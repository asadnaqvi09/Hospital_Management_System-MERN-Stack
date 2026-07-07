import { pool } from "../../shared/config/db.js"

export const listAuditLogs = async ({
  userId,
  userRole,
  action,
  entityType,
  entityId,
  fromDate,
  toDate,
  limit,
  offset
}) => {
  const values = []
  const conditions = []

  if (userId) {
    values.push(userId)
    conditions.push(`al.user_id = $${values.length}`)
  }
  if (userRole) {
    values.push(userRole)
    conditions.push(`al.user_role = $${values.length}`)
  }
  if (action) {
    values.push(action)
    conditions.push(`al.action = $${values.length}`)
  }
  if (entityType) {
    values.push(entityType)
    conditions.push(`al.entity_type = $${values.length}`)
  }
  if (entityId) {
    values.push(entityId)
    conditions.push(`al.entity_id = $${values.length}`)
  }
  if (fromDate) {
    values.push(fromDate)
    conditions.push(`al.created_at >= $${values.length}::date`)
  }
  if (toDate) {
    values.push(toDate)
    conditions.push(`al.created_at < ($${values.length}::date + INTERVAL '1 day')`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT al.*, u.full_name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countAuditLogs = async (filters) => {
  const values = []
  const conditions = []

  if (filters.userId) {
    values.push(filters.userId)
    conditions.push(`user_id = $${values.length}`)
  }
  if (filters.userRole) {
    values.push(filters.userRole)
    conditions.push(`user_role = $${values.length}`)
  }
  if (filters.action) {
    values.push(filters.action)
    conditions.push(`action = $${values.length}`)
  }
  if (filters.entityType) {
    values.push(filters.entityType)
    conditions.push(`entity_type = $${values.length}`)
  }
  if (filters.entityId) {
    values.push(filters.entityId)
    conditions.push(`entity_id = $${values.length}`)
  }
  if (filters.fromDate) {
    values.push(filters.fromDate)
    conditions.push(`created_at >= $${values.length}::date`)
  }
  if (filters.toDate) {
    values.push(filters.toDate)
    conditions.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`, values)
  return result.rows[0].total
}

export const findAuditLogById = async (auditId) => {
  const result = await pool.query(
    `SELECT al.*, u.full_name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.id = $1`,
    [auditId]
  )
  return result.rows[0] || null
}
