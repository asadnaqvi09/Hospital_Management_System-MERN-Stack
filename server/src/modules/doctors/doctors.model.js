import { pool } from "../../shared/config/db.js"

const DOCTOR_COLUMNS = `id, user_id, specialization, qualification, experience_years,
  license_number, consultation_fee, department, bio, avatar_url`

const DOCTOR_COLUMNS_WITH_USER = `d.id, d.user_id, d.specialization, d.qualification, d.experience_years,
  d.license_number, d.consultation_fee, d.department, d.bio, d.avatar_url, u.full_name, u.email`

export const insertDoctor = async ({
  userId,
  specialization,
  qualification,
  experienceYears,
  licenseNumber,
  consultationFee,
  department,
  bio
}) => {
  const result = await pool.query(
    `INSERT INTO doctors
      (user_id, specialization, qualification, experience_years, license_number, consultation_fee, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${DOCTOR_COLUMNS}`,
    [
      userId,
      specialization,
      qualification || null,
      experienceYears ?? null,
      licenseNumber || null,
      consultationFee ?? 0,
      department || null,
      bio || null
    ]
  )
  return result.rows[0]
}

export const findDoctorById = async (doctorId) => {
  const result = await pool.query(
    `SELECT ${DOCTOR_COLUMNS_WITH_USER}
     FROM doctors d
     LEFT JOIN users u ON u.id = d.user_id
     WHERE d.id = $1`,
    [doctorId]
  )
  return result.rows[0] || null
}

export const findDoctorByUserId = async (userId) => {
  const result = await pool.query(`SELECT ${DOCTOR_COLUMNS} FROM doctors WHERE user_id = $1`, [userId])
  return result.rows[0] || null
}

export const listDoctors = async ({ specialization, search }) => {
  const values = []
  const conditions = []

  if (specialization) {
    values.push(specialization)
    conditions.push(`d.specialization ILIKE $${values.length}`)
  }

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(u.full_name ILIKE $${values.length} OR d.department ILIKE $${values.length})`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(
    `SELECT ${DOCTOR_COLUMNS_WITH_USER}
     FROM doctors d
     LEFT JOIN users u ON u.id = d.user_id
     ${whereClause}
     ORDER BY u.full_name ASC`,
    values
  )
  return result.rows
}

export const updateDoctorProfile = async (doctorId, fields) => {
  const result = await pool.query(
    `UPDATE doctors
     SET specialization = COALESCE($2, specialization),
         qualification = COALESCE($3, qualification),
         experience_years = COALESCE($4, experience_years),
         consultation_fee = COALESCE($5, consultation_fee),
         department = COALESCE($6, department),
         bio = COALESCE($7, bio)
     WHERE id = $1
     RETURNING ${DOCTOR_COLUMNS}`,
    [
      doctorId,
      fields.specialization ?? null,
      fields.qualification ?? null,
      fields.experienceYears ?? null,
      fields.consultationFee ?? null,
      fields.department ?? null,
      fields.bio ?? null
    ]
  )
  return result.rows[0] || null
}

export const replaceWeeklySchedule = async (doctorId, entries) => {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [doctorId])

    for (const entry of entries) {
      await client.query(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [doctorId, entry.dayOfWeek, entry.startTime, entry.endTime, entry.slotDuration ?? 20, entry.maxPatients ?? 20]
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export const listSchedule = async (doctorId) => {
  const result = await pool.query(
    `SELECT id, day_of_week, to_char(start_time, 'HH24:MI:SS') AS start_time,
            to_char(end_time, 'HH24:MI:SS') AS end_time, slot_duration, max_patients
     FROM doctor_schedules
     WHERE doctor_id = $1
     ORDER BY day_of_week ASC`,
    [doctorId]
  )
  return result.rows
}

export const findScheduleForDay = async (doctorId, dayOfWeek) => {
  const result = await pool.query(
    `SELECT id, day_of_week, to_char(start_time, 'HH24:MI:SS') AS start_time,
            to_char(end_time, 'HH24:MI:SS') AS end_time, slot_duration, max_patients
     FROM doctor_schedules
     WHERE doctor_id = $1 AND day_of_week = $2`,
    [doctorId, dayOfWeek]
  )
  return result.rows[0] || null
}

export const insertLeave = async ({ doctorId, startDate, endDate, reason, approvedBy }) => {
  const result = await pool.query(
    `INSERT INTO doctor_leaves (doctor_id, start_date, end_date, reason, approved_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [doctorId, startDate, endDate, reason || null, approvedBy || null]
  )
  return result.rows[0]
}

export const listLeaves = async (doctorId) => {
  const result = await pool.query(
    `SELECT * FROM doctor_leaves WHERE doctor_id = $1 ORDER BY start_date DESC`,
    [doctorId]
  )
  return result.rows
}

export const deleteLeave = async (leaveId, doctorId) => {
  const result = await pool.query(
    `DELETE FROM doctor_leaves WHERE id = $1 AND doctor_id = $2 RETURNING id`,
    [leaveId, doctorId]
  )
  return result.rows[0] || null
}

export const isDoctorOnLeave = async (doctorId, dateString) => {
  const result = await pool.query(
    `SELECT 1 FROM doctor_leaves
     WHERE doctor_id = $1 AND $2::date BETWEEN start_date AND end_date
     LIMIT 1`,
    [doctorId, dateString]
  )
  return result.rowCount > 0
}
