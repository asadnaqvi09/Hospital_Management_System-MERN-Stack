import { pool } from "../config/db.js"
import { logger } from "../utils/logger.js"

const resolveIpAddress = (req) => {
  if (!req) {
    return null
  }
  const forwarded = req.headers["x-forwarded-for"]
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return req.socket?.remoteAddress || null
}

export const writeAuditLog = async ({
  userId = null,
  userRole = null,
  action,
  entityType = null,
  entityId = null,
  before = null,
  after = null,
  req = null
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
        (user_id, user_role, action, entity_type, entity_id, before_state, after_state, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        userRole,
        action,
        entityType,
        entityId,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        resolveIpAddress(req),
        req ? req.headers["user-agent"] || null : null
      ]
    )
  } catch (error) {
    logger.error(`Failed to write audit log for action ${action}: ${error.message}`)
  }
}
