import Student from '../models/Student.js';
import OutingPermission from '../models/OutingPermission.js';
import {
  isTwilioConfigured,
  normalizeIndianMobileDigits,
  sendTwilioSms,
} from '../utils/twilio.js';

function normalizeRoll(r) {
  return String(r ?? '').trim().toUpperCase();
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findStudentOutingFields(roll, select) {
  const norm = normalizeRoll(roll);
  if (!norm) return null;
  let student = await Student.findOne({ rollNumber: norm }).select(select);
  if (!student) {
    student = await Student.findOne({
      rollNumber: { $regex: new RegExp(`^${escapeRegex(norm)}$`, 'i') },
    }).select(select);
  }
  if (!student) {
    // tolerate accidental leading/trailing spaces in legacy data
    student = await Student.findOne({
      rollNumber: { $regex: new RegExp(`^\\s*${escapeRegex(norm)}\\s*$`, 'i') },
    }).select(select);
  }
  if (!student) {
    // fallback: compare alphanumeric-only form (e.g., with dashes/spaces in DB)
    const normAlnum = norm.replace(/[^A-Z0-9]/g, '');
    if (normAlnum) {
      const candidates = await Student.find({
        rollNumber: { $exists: true, $ne: null, $ne: '' },
      }).select(`rollNumber ${select}`);
      student =
        candidates.find(
          (c) =>
            String(c.rollNumber || '')
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '') === normAlnum
        ) || null;
    }
  }
  return student;
}

function formatOutingDate(dt) {
  try {
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return String(dt);
  }
}

// @route   GET /api/outing/students
// @access  Faculty
export const listOutingStudents = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 300), 2000);
    const search = String(req.query.search || '').trim();
    const query = {};
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('studentName rollNumber year branch parentPhone phone createdAt');

    return res.json({ success: true, data: students });
  } catch (error) {
    console.error('listOutingStudents:', error);
    return res.status(500).json({ success: false, message: 'Failed to load students.' });
  }
};

// @route   GET /api/outing/lookup/:rollNumber
// @access  Faculty
export const lookupStudentByRoll = async (req, res) => {
  try {
    const roll = normalizeRoll(req.params.rollNumber);
    if (!roll) {
      return res.status(400).json({ success: false, message: 'Roll number is required.' });
    }

    const student = await findStudentOutingFields(roll, 'studentName parentPhone rollNumber year phone');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found for this roll / administration number.',
      });
    }

    return res.json({
      success: true,
      data: {
        studentName: student.studentName,
        studentPhone: student.phone || '',
        parentPhone: student.parentPhone,
        rollNumber: student.rollNumber,
        year: student.year,
      },
    });
  } catch (error) {
    console.error('outing lookupStudentByRoll:', error);
    return res.status(500).json({ success: false, message: 'Lookup failed.' });
  }
};

// @route   POST /api/outing/notify
// @body    { outingMembers?: { rollNumber, block }[], rollNumbers?: string[], outingOut, outingIn }
// @access  Faculty
export const notifyOutingParents = async (req, res) => {
  try {
    if (!isTwilioConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in server .env.',
      });
    }

    const { outingMembers, rollNumbers, outingOut, outingIn } = req.body || {};
    /** @type {{ roll: string, block: string }[]} */
    let entries = [];
    if (Array.isArray(outingMembers) && outingMembers.length > 0) {
      for (const m of outingMembers) {
        const roll = normalizeRoll(m?.rollNumber ?? m?.roll ?? m?.roll_number);
        if (!roll) continue;
        entries.push({ roll, block: String(m?.block ?? '').trim() });
      }
    }
    // If outingMembers was missing, malformed, or every roll was empty, fall back to rollNumbers.
    if (entries.length === 0 && Array.isArray(rollNumbers)) {
      for (const raw of rollNumbers) {
        const roll = normalizeRoll(raw);
        if (roll) entries.push({ roll, block: '' });
      }
    }
    // Attach blocks from outingMembers when rolls came from rollNumbers fallback (same roll keys).
    if (entries.length > 0 && Array.isArray(outingMembers) && outingMembers.length > 0) {
      const blockByRoll = new Map();
      for (const m of outingMembers) {
        const r = normalizeRoll(m?.rollNumber ?? m?.roll ?? m?.roll_number);
        if (r) blockByRoll.set(r, String(m?.block ?? '').trim());
      }
      if (blockByRoll.size > 0) {
        entries = entries.map((e) => ({
          ...e,
          block: e.block || blockByRoll.get(e.roll) || '',
        }));
      }
    }
    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one roll number.' });
    }
    if (!outingOut || !outingIn) {
      return res
        .status(400)
        .json({ success: false, message: 'Outgoing and return date-time are required.' });
    }

    const outDt = new Date(outingOut);
    const inDt = new Date(outingIn);
    if (Number.isNaN(outDt.getTime()) || Number.isNaN(inDt.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date-time values.' });
    }

    const outStr = formatOutingDate(outDt);
    const inStr = formatOutingDate(inDt);
    const message = `Your Child had taken permission for outing from ${outStr} and until ${inStr} dates.`;

    const results = [];

    for (const { roll, block } of entries) {
      if (!roll) {
        results.push({
          rollNumber: '',
          block,
          ok: false,
          feedback: 'Empty roll number.',
        });
        continue;
      }

      const student = await findStudentOutingFields(roll, 'studentName parentPhone rollNumber phone');

      if (!student) {
        results.push({
          rollNumber: roll,
          block,
          ok: false,
          feedback: 'Student not found.',
        });
        continue;
      }

      const studentPhone = String(student.phone ?? '').trim();

      const digits = normalizeIndianMobileDigits(student.parentPhone);
      if (digits.length !== 10) {
        results.push({
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          studentPhone,
          parentPhone: student.parentPhone,
          block,
          ok: false,
          feedback: `Invalid parent phone in records: ${student.parentPhone || 'missing'}`,
        });
        continue;
      }

      try {
        const sms = await sendTwilioSms(digits, message);
        const data = sms.data ?? {};
        const feedback = sms.ok
          ? data.status
            ? `Sent (${data.status})`
            : 'Sent'
          : sms.error || JSON.stringify(data);

        results.push({
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          studentPhone,
          parentPhone: student.parentPhone,
          block,
          ok: sms.ok,
          feedback,
          requestId: data.sid ?? data.request_id ?? data.requestId,
          httpStatus: sms.httpStatus,
        });
      } catch (err) {
        console.error('Twilio SMS error:', err);
        results.push({
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          studentPhone,
          parentPhone: student.parentPhone,
          block,
          ok: false,
          feedback: err.message || 'SMS request failed.',
        });
      }
    }

    // Persist permission + results for list/delete/download
    let permissionDoc = null;
    try {
      permissionDoc = await OutingPermission.create({
        outingOut: outDt,
        outingIn: inDt,
        createdBy: req.user?._id,
        members: results.map((r) => ({
          rollNumber: String(r.rollNumber || '').trim().toUpperCase(),
          studentName: r.studentName || '',
          studentPhone: r.studentPhone || '',
          parentPhone: r.parentPhone || '',
          block: r.block != null ? String(r.block) : '',
          ok: !!r.ok,
          feedback: r.feedback || '',
          requestId: r.requestId || r.request_id || '',
          httpStatus: r.httpStatus ?? null,
        })),
      });
    } catch (e) {
      console.error('Failed to save outing permission:', e);
    }

    const permissionPlain =
      permissionDoc && typeof permissionDoc.toObject === 'function'
        ? permissionDoc.toObject({ flattenMaps: true })
        : permissionDoc;

    return res.json({
      success: true,
      message: 'Notifications processed.',
      results,
      permission: permissionPlain,
    });
  } catch (error) {
    console.error('notifyOutingParents:', error);
    return res.status(500).json({ success: false, message: 'Failed to send notifications.' });
  }
};

// @route   GET /api/outing/permissions?status=ongoing|completed|both&search=
// @access  Faculty
export const listOutingPermissions = async (req, res) => {
  try {
    const status = String(req.query.status || 'both');
    const search = String(req.query.search || '').trim();
    const limit = Math.min(Number(req.query.limit || 20), 200);
    const page = Math.max(1, Number(req.query.page || 1));

    const query = {};
    const now = new Date();
    if (status === 'ongoing') query.outingIn = { $gt: now };
    else if (status === 'completed') query.outingIn = { $lte: now };

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { 'members.rollNumber': rx },
        { 'members.studentName': rx },
        { 'members.studentPhone': rx },
        { 'members.parentPhone': rx },
        { 'members.block': rx },
        { 'members.feedback': rx },
      ];
    }

    const total = await OutingPermission.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const permissions = await OutingPermission.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((safePage - 1) * limit)
      .lean();

    return res.json({
      success: true,
      data: permissions,
      total,
      totalPages,
      currentPage: safePage,
      limit,
    });
  } catch (e) {
    console.error('listOutingPermissions:', e);
    return res.status(500).json({ success: false, message: 'Failed to load permissions.' });
  }
};

// @route   DELETE /api/outing/permissions/:id/members/:rollNumber
// @access  Faculty
export const removeOutingMember = async (req, res) => {
  try {
    const permissionId = req.params.id;
    const roll = normalizeRoll(req.params.rollNumber);
    if (!roll) {
      return res.status(400).json({ success: false, message: 'Roll number is required.' });
    }

    const doc = await OutingPermission.findById(permissionId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Permission not found.' });
    }

    const before = doc.members.length;
    doc.members = doc.members.filter((m) => normalizeRoll(m.rollNumber) !== roll);
    if (doc.members.length === before) {
      return res.status(404).json({ success: false, message: 'Member not found on this permission.' });
    }

    if (doc.members.length === 0) {
      await OutingPermission.findByIdAndDelete(permissionId);
      return res.json({
        success: true,
        message: 'Last member removed; the outing permission record was deleted.',
        removedAll: true,
      });
    }

    await doc.save();
    const permissionPlain = doc.toObject({ flattenMaps: true });
    return res.json({ success: true, message: 'Member removed.', permission: permissionPlain });
  } catch (e) {
    console.error('removeOutingMember:', e);
    return res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};

// @route   DELETE /api/outing/permissions/:id
// @access  Faculty
export const deleteOutingPermission = async (req, res) => {
  try {
    const deleted = await OutingPermission.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Permission not found.' });
    }
    return res.json({ success: true, message: 'Permission deleted.' });
  } catch (e) {
    console.error('deleteOutingPermission:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete permission.' });
  }
};
