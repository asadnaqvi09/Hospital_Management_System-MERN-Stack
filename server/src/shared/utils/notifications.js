import { pool } from "../config/db.js"
import { emitToUser } from "../sockets/notification.socket.js"

export const createNotification = async ({ userId, type, title, message, entityType, entityId }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, title, message, entityType || null, entityId || null]
  )
  const notification = result.rows[0]
  emitToUser(userId, "notification:new", { notification })
  return notification
}

export const notifyUsers = async ({ userIds, type, title, message, entityType, entityId }) => {
  const results = []
  for (const userId of userIds) {
    const notification = await createNotification({ userId, type, title, message, entityType, entityId })
    results.push(notification)
  }
  return results
}
