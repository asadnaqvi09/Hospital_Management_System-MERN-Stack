import { pool } from "../../shared/config/db.js"

const REMINDER_COLUMNS = ["reminder_24h_sent", "reminder_2h_sent"]

export const insertAppointment = async ({
  patientId,
  doctorId,
  appointmentDate,
  slotTime,
  type,
  chiefComplaint,
  bookingSource,
  createdBy
}) => {
  const result = await pool.query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, slot_time, type, chief_complaint, booking_source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      patientId,
      doctorId,
      appointmentDate,
      slotTime,
      type || "booked",
      chiefComplaint || null,
      bookingSource || "patient",
      createdBy || null
    ]
  )
  return result.rows[0]
}

export const findAppointmentById = async (appointmentId) => {
  const result = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [appointmentId])
  return result.rows[0] || null
}

export const getBookedSlotTimes = async (doctorId, dateString) => {
  const result = await pool.query(
    `SELECT to_char(slot_time, 'HH24:MI:SS') AS slot_time
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled', 'no_show')`,
    [doctorId, dateString]
  )
  return result.rows.map((row) => row.slot_time)
}

export const listAppointments = async ({ patientId, doctorId, date, status, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`a.patient_id = $${values.length}`)
  }
  if (doctorId) {
    values.push(doctorId)
    conditions.push(`a.doctor_id = $${values.length}`)
  }
  if (date) {
    values.push(date)
    conditions.push(`a.appointment_date = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`a.status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT a.*, p.full_name AS patient_name, p.mrn AS patient_mrn, du.full_name AS doctor_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.slot_time ASC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countAppointments = async ({ patientId, doctorId, date, status }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`patient_id = $${values.length}`)
  }
  if (doctorId) {
    values.push(doctorId)
    conditions.push(`doctor_id = $${values.length}`)
  }
  if (date) {
    values.push(date)
    conditions.push(`appointment_date = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM appointments ${whereClause}`, values)
  return result.rows[0].total
}

export const updateAppointmentStatus = async (appointmentId, status) => {
  const result = await pool.query(
    `UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *`,
    [appointmentId, status]
  )
  return result.rows[0] || null
}

export const updateAppointmentSlot = async (appointmentId, { appointmentDate, slotTime }) => {
  const result = await pool.query(
    `UPDATE appointments SET appointment_date = $2, slot_time = $3 WHERE id = $1 RETURNING *`,
    [appointmentId, appointmentDate, slotTime]
  )
  return result.rows[0] || null
}

export const getQueueForDate = async (dateString) => {
  const result = await pool.query(
    `SELECT a.id, a.slot_time, a.status, a.type, a.chief_complaint,
            p.full_name AS patient_name, p.mrn AS patient_mrn,
            du.full_name AS doctor_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     WHERE a.appointment_date = $1 AND a.status NOT IN ('cancelled', 'no_show')
     ORDER BY a.slot_time ASC`,
    [dateString]
  )
  return result.rows
}

export const findAppointmentsNeedingReminder = async (hoursAhead, column) => {
  if (!REMINDER_COLUMNS.includes(column)) {
    throw new Error(`Invalid reminder column: ${column}`)
  }

  const result = await pool.query(
    `SELECT a.id, a.appointment_date, to_char(a.slot_time, 'HH24:MI') AS slot_time,
            pu.email AS email, p.phone AS phone, du.full_name AS doctor_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN users pu ON pu.id = p.user_id
     LEFT JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     WHERE a.${column} = FALSE
       AND a.status IN ('scheduled', 'confirmed')
       AND (a.appointment_date + a.slot_time) BETWEEN NOW() + make_interval(hours => $1)
                                                   AND NOW() + make_interval(hours => $1) + interval '15 minutes'`,
    [hoursAhead]
  )
  return result.rows
}

export const markAppointmentReminderSent = async (appointmentId, column) => {
  if (!REMINDER_COLUMNS.includes(column)) {
    throw new Error(`Invalid reminder column: ${column}`)
  }
  await pool.query(`UPDATE appointments SET ${column} = TRUE WHERE id = $1`, [appointmentId])
}

export const getDoctorUserId = async (doctorId) => {
  const result = await pool.query(`SELECT user_id FROM doctors WHERE id = $1`, [doctorId])
  return result.rows[0]?.user_id || null
}
