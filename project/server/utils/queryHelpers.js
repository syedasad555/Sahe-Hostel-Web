import { Op } from 'sequelize';

export function todayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

export function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function likePattern(term) {
  const escaped = String(term || '').replace(/[%_\\]/g, '\\$&');
  return { [Op.like]: `%${escaped}%` };
}
