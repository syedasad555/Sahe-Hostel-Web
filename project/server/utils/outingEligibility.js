import { OutingPermissionMember } from '../models/index.js';
import { Op } from 'sequelize';

function normalizeRoll(r) {
  return String(r ?? '').trim().toUpperCase();
}

export async function isStudentOnOutgoingServicesList(rollNumber) {
  const norm = normalizeRoll(rollNumber);
  if (!norm) return false;

  const count = await OutingPermissionMember.count({
    where: {
      rollNumber: { [Op.like]: norm },
    },
  });

  return count > 0;
}
