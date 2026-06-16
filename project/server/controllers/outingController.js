import { Op, Sequelize } from 'sequelize';
import Student from '../models/Student.js';
import OutingPermission, { OutingPermissionMember } from '../models/OutingPermission.js';
import {
  buildSalesquaredOutingMessage,
  getSalesquaredConfigError,
  isSalesquaredConfigured,
  normalizeIndianMobileDigits,
  sendSalesquaredSms,
} from '../utils/salesquared.js';
import { toApiJson, toApiJsonList } from '../utils/apiSerialize.js';
import { likePattern, parseId } from '../utils/queryHelpers.js';

function normalizeRoll(r) {
  return String(r ?? '').trim().toUpperCase();
}

async function findStudentOutingFields(roll, attributeList) {
  const norm = normalizeRoll(roll);
  if (!norm) return null;

  const attrs = String(attributeList || '')
    .split(/\s+/)
    .filter(Boolean);

  let student = await Student.findOne({
    where: { rollNumber: norm },
    attributes: attrs.length ? attrs : undefined,
  });
  if (student) return student;

  student = await Student.findOne({
    where: Sequelize.where(
      Sequelize.fn('UPPER', Sequelize.fn('TRIM', Sequelize.col('roll_number'))),
      norm
    ),
    attributes: attrs.length ? attrs : undefined,
  });
  if (student) return student;

  const normAlnum = norm.replace(/[^A-Z0-9]/g, '');
  if (!normAlnum) return null;

  const candidates = await Student.findAll({
    where: {
      rollNumber: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
    },
    attributes: attrs.length ? attrs : undefined,
  });

  return (
    candidates.find(
      (c) =>
        String(c.rollNumber || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '') === normAlnum
    ) || null
  );
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

async function loadPermissionWithMembers(id) {
  const permission = await OutingPermission.findByPk(id, {
    include: [{ model: OutingPermissionMember, as: 'members' }],
  });
  return permission ? toApiJson(permission) : null;
}

// @route   GET /api/outing/students
// @access  Faculty
export const listOutingStudents = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 300), 2000);
    const search = String(req.query.search || '').trim();
    const where = {};

    if (search) {
      where[Op.or] = [
        { studentName: likePattern(search) },
        { rollNumber: likePattern(search) },
      ];
    }

    const students = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      attributes: [
        'id',
        'studentName',
        'rollNumber',
        'year',
        'branch',
        'parentPhone',
        'phone',
        'createdAt',
      ],
    });

    return res.json({ success: true, data: toApiJsonList(students) });
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

    const student = await findStudentOutingFields(
      roll,
      'studentName parentPhone rollNumber year phone'
    );

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
// @access  Faculty
export const notifyOutingParents = async (req, res) => {
  try {
    if (!isSalesquaredConfigured()) {
      return res.status(503).json({
        success: false,
        message: getSalesquaredConfigError() || 'SMS is not configured.',
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
    if (entries.length === 0 && Array.isArray(rollNumbers)) {
      for (const raw of rollNumbers) {
        const roll = normalizeRoll(raw);
        if (roll) entries.push({ roll, block: '' });
      }
    }
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
    const message = buildSalesquaredOutingMessage(outStr, inStr);

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
        const sms = await sendSalesquaredSms(digits, message);
        const data = sms.data ?? {};
        const apiMessage = Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message;
        const feedback = sms.ok
          ? apiMessage || 'Sent'
          : sms.error || JSON.stringify(data);

        results.push({
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          studentPhone,
          parentPhone: student.parentPhone,
          block,
          ok: sms.ok,
          feedback,
          requestId: data.request_id ?? data.requestId ?? data.sid,
          httpStatus: sms.httpStatus,
        });
      } catch (err) {
        console.error('SaleSquared SMS error:', err);
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

    let permissionPlain = null;
    try {
      const createdBy = parseId(req.user?._id ?? req.user?.id);
      if (!createdBy) {
        throw new Error('Faculty id missing for outing permission');
      }

      const permission = await OutingPermission.create({
        outingOut: outDt,
        outingIn: inDt,
        createdBy,
      });

      await OutingPermissionMember.bulkCreate(
        results.map((r) => ({
          permissionId: permission.id,
          rollNumber: String(r.rollNumber || '').trim().toUpperCase(),
          studentName: r.studentName || '',
          studentPhone: r.studentPhone || '',
          parentPhone: r.parentPhone || '',
          block: r.block != null ? String(r.block) : '',
          ok: !!r.ok,
          feedback: r.feedback || '',
          requestId: r.requestId || r.request_id || '',
          httpStatus: r.httpStatus ?? null,
        }))
      );

      permissionPlain = await loadPermissionWithMembers(permission.id);
    } catch (e) {
      console.error('Failed to save outing permission:', e);
    }

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

// @route   GET /api/outing/permissions
// @access  Faculty
export const listOutingPermissions = async (req, res) => {
  try {
    const status = String(req.query.status || 'both');
    const search = String(req.query.search || '').trim();
    const limit = Math.min(Number(req.query.limit || 20), 200);
    const page = Math.max(1, Number(req.query.page || 1));

    const where = {};
    const now = new Date();
    if (status === 'ongoing') where.outingIn = { [Op.gt]: now };
    else if (status === 'completed') where.outingIn = { [Op.lte]: now };

    if (search) {
      const matchingMembers = await OutingPermissionMember.findAll({
        where: {
          [Op.or]: [
            { rollNumber: likePattern(search) },
            { studentName: likePattern(search) },
            { studentPhone: likePattern(search) },
            { parentPhone: likePattern(search) },
            { block: likePattern(search) },
            { feedback: likePattern(search) },
          ],
        },
        attributes: ['permissionId'],
        group: ['permissionId'],
      });
      const permissionIds = matchingMembers.map((m) => m.permissionId);
      if (permissionIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          totalPages: 1,
          currentPage: 1,
          limit,
        });
      }
      where.id = { [Op.in]: permissionIds };
    }

    const total = await OutingPermission.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;

    const permissions = await OutingPermission.findAll({
      where,
      include: [{ model: OutingPermissionMember, as: 'members' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: toApiJsonList(permissions),
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
    const permissionId = parseId(req.params.id);
    const roll = normalizeRoll(req.params.rollNumber);
    if (!permissionId || !roll) {
      return res.status(400).json({ success: false, message: 'Roll number is required.' });
    }

    const doc = await OutingPermission.findByPk(permissionId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Permission not found.' });
    }

    const deleted = await OutingPermissionMember.destroy({
      where: {
        permissionId,
        rollNumber: roll,
      },
    });

    if (!deleted) {
      const members = await OutingPermissionMember.findAll({ where: { permissionId } });
      const match = members.find((m) => normalizeRoll(m.rollNumber) === roll);
      if (!match) {
        return res.status(404).json({ success: false, message: 'Member not found on this permission.' });
      }
      await match.destroy();
    }

    const remaining = await OutingPermissionMember.count({ where: { permissionId } });
    if (remaining === 0) {
      await doc.destroy();
      return res.json({
        success: true,
        message: 'Last member removed; the outing permission record was deleted.',
        removedAll: true,
      });
    }

    const permissionPlain = await loadPermissionWithMembers(permissionId);
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
    const id = parseId(req.params.id);
    const deleted = id ? await OutingPermission.findByPk(id) : null;
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Permission not found.' });
    }
    await deleted.destroy();
    return res.json({ success: true, message: 'Permission deleted.' });
  } catch (e) {
    console.error('deleteOutingPermission:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete permission.' });
  }
};
