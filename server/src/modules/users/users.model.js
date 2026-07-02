import { pool } from "../../shared/config/db.js"

const PUBLIC_COLUMNS = `id, email, phone, full_name, role, is_active, two_fa_enabled, created_at, updated_at`

export const insertUser = async ({ email, phone, passwordHash, fullName, role }) => {
  const result = await pool.query(
    `INSERT INTO users (email, phone, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, phone || null, passwordHash, fullName, role]
  )
  return result.rows[0]
}

export const findUserById = async (userId) => {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email FROM users WHERE email = $1`,
    [email]
  )
  return result.rows[0] || null
}

export const listUsers = async ({ role, search, limit, offset }) => {
  const conditions = []
  const values = []

  if (role) {
    values.push(role)
    conditions.push(`role = $${values.length}`)
  }

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countUsers = async ({ role, search }) => {
  const conditions = []
  const values = []

  if (role) {
    values.push(role)
    conditions.push(`role = $${values.length}`)
  }

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${whereClause}`, values)
  return result.rows[0].total
}

export const updateUserProfile = async (userId, { fullName, phone }) => {
  const result = await pool.query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [userId, fullName ?? null, phone ?? null]
  )
  return result.rows[0] || null
}

export const setUserActiveState = async (userId, isActive) => {
  const result = await pool.query(
    `UPDATE users
     SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [userId, isActive]
  )
  return result.rows[0] || null
}

export const updateUserRole = async (userId, role) => {
  const result = await pool.query(
    `UPDATE users
     SET role = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [userId, role]
  )
  return result.rows[0] || null
}
