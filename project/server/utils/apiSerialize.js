/** Map Sequelize rows to API shape (frontend expects Mongo-style `_id`). */
export function toApiJson(record) {
  if (record == null) return record;
  const plain =
    typeof record.get === 'function' ? record.get({ plain: true }) : { ...record };

  if (plain.id != null && plain._id == null) {
    plain._id = String(plain.id);
  }

  if (Array.isArray(plain.members)) {
    plain.members = plain.members.map((m) => toApiJson(m));
  }

  return plain;
}

export function toApiJsonList(records) {
  return (records || []).map((r) => toApiJson(r));
}
