import { pool } from "../../shared/config/db.js"

export const globalSearchPatients = async ({ search, limit, offset }) => {
  const pattern = `%${search}%`
  const result = await pool.query(
    `SELECT p.id, p.mrn, p.full_name, p.cnic, p.phone, p.gender, p.blood_group, p.created_at,
            u.email AS user_email
     FROM patients p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.full_name ILIKE $1
        OR p.mrn ILIKE $1
        OR p.cnic ILIKE $1
        OR p.phone ILIKE $1
        OR u.email ILIKE $1
     ORDER BY
       CASE
         WHEN p.mrn ILIKE $1 THEN 0
         WHEN p.cnic ILIKE $1 THEN 1
         WHEN p.phone ILIKE $1 THEN 2
         ELSE 3
       END,
       p.full_name ASC
     LIMIT $2 OFFSET $3`,
    [pattern, limit, offset]
  )
  return result.rows
}

export const countGlobalSearchPatients = async (search) => {
  const pattern = `%${search}%`
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM patients p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.full_name ILIKE $1
        OR p.mrn ILIKE $1
        OR p.cnic ILIKE $1
        OR p.phone ILIKE $1
        OR u.email ILIKE $1`,
    [pattern]
  )
  return result.rows[0].total
}
