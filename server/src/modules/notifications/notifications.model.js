import { pool } from "../../shared/config/db.js"

export const listNotifications = async ({ userId, isRead, limit, offset }) => {
  const values = [userId]
  const conditions = [`user_id = $1`]

  if (isRead !== undefined) {
    values.push(isRead)
    conditions.push(`is_read = $${values.length}`)
  }

  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countNotifications = async ({ userId, isRead }) => {
  const values = [userId]
  const conditions = [`user_id = $1`]

  if (isRead !== undefined) {
    values.push(isRead)
    conditions.push(`is_read = $${values.length}`)
  }

  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM notifications WHERE ${conditions.join(" AND ")}`,
    values
  )
  return result.rows[0].total
}

export const countUnreadNotifications = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  )
  return result.rows[0].total
}

export const findNotificationById = async (notificationId) => {
  const result = await pool.query(`SELECT * FROM notifications WHERE id = $1`, [notificationId])
  return result.rows[0] || null
}

export const markNotificationRead = async (notificationId, userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  )
  return result.rows[0] || null
}

export const markAllNotificationsRead = async (userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING id`,
    [userId]
  )
  return result.rowCount
}
