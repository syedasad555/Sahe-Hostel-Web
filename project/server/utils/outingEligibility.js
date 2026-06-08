import OutingPermission from '../models/OutingPermission.js';

function normalizeRoll(r) {
  return String(r ?? '').trim().toUpperCase();
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * True if the student appears on any saved Outgoing Services permission
 * (record stays until faculty removes it from the list).
 */
export async function isStudentOnOutgoingServicesList(rollNumber) {
  const norm = normalizeRoll(rollNumber);
  if (!norm) return false;

  const exists = await OutingPermission.exists({
    members: {
      $elemMatch: {
        rollNumber: { $regex: new RegExp(`^${escapeRegex(norm)}$`, 'i') },
      },
    },
  });

  return !!exists;
}
