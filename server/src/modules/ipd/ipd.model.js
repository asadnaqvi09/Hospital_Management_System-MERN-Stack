import { pool } from "../../shared/config/db.js"

const ROOM_COLUMNS = `id, room_number, ward, floor, capacity, daily_rate, status, version`

export const insertRoom = async ({ roomNumber, ward, floor, capacity, dailyRate }) => {
  const result = await pool.query(
    `INSERT INTO rooms (room_number, ward, floor, capacity, daily_rate)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${ROOM_COLUMNS}`,
    [roomNumber, ward, floor ?? null, capacity ?? 1, dailyRate ?? 0]
  )
  return result.rows[0]
}

export const findRoomById = async (roomId) => {
  const result = await pool.query(`SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = $1`, [roomId])
  return result.rows[0] || null
}

export const listRooms = async ({ ward, status }) => {
  const values = []
  const conditions = []

  if (ward) {
    values.push(ward)
    conditions.push(`r.ward ILIKE $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`r.status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(
    `SELECT r.*,
            COALESCE(a.active_count, 0)::int AS active_admissions,
            GREATEST(r.capacity - COALESCE(a.active_count, 0), 0)::int AS available_beds
     FROM rooms r
     LEFT JOIN (
       SELECT room_id, COUNT(*) AS active_count
       FROM admissions
       WHERE status = 'admitted'
       GROUP BY room_id
     ) a ON a.room_id = r.id
     ${whereClause}
     ORDER BY r.ward ASC, r.room_number ASC`,
    values
  )
  return result.rows
}

export const updateRoom = async (roomId, fields) => {
  const mapping = {
    ward: "ward",
    floor: "floor",
    capacity: "capacity",
    dailyRate: "daily_rate",
    status: "status"
  }
  const setClauses = []
  const values = [roomId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findRoomById(roomId)
  }

  const result = await pool.query(
    `UPDATE rooms SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${ROOM_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const countActiveAdmissionsForRoom = async (roomId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS total FROM admissions WHERE room_id = $1 AND status = 'admitted'`,
    [roomId]
  )
  return result.rows[0].total
}

export const assignRoomWithLock = async ({ roomId, expectedVersion }, client) => {
  const result = await client.query(
    `UPDATE rooms SET version = version + 1
     WHERE id = $1 AND version = $2 AND status != 'maintenance'
     RETURNING ${ROOM_COLUMNS}`,
    [roomId, expectedVersion]
  )
  return result.rows[0] || null
}

export const setRoomAvailableIfEmpty = async (roomId, client = pool) => {
  const activeCount = await countActiveAdmissionsForRoom(roomId, client)
  if (activeCount === 0) {
    await client.query(`UPDATE rooms SET status = 'available' WHERE id = $1`, [roomId])
  }
  return activeCount
}

const ADMISSION_COLUMNS = `id, patient_id, admitting_doctor, room_id, admission_date, expected_days,
  admission_reason, status, discharge_date, discharge_summary, discharge_meds, follow_up_notes, created_at`

export const insertAdmission = async (
  { patientId, admittingDoctor, roomId, expectedDays, admissionReason },
  client = pool
) => {
  const result = await client.query(
    `INSERT INTO admissions (patient_id, admitting_doctor, room_id, expected_days, admission_reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${ADMISSION_COLUMNS}`,
    [patientId, admittingDoctor, roomId, expectedDays ?? null, admissionReason || null]
  )
  return result.rows[0]
}

export const findAdmissionById = async (admissionId) => {
  const result = await pool.query(
    `SELECT a.*, p.full_name AS patient_name, p.mrn AS patient_mrn,
            r.room_number, r.ward, du.full_name AS doctor_name
     FROM admissions a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN rooms r ON r.id = a.room_id
     LEFT JOIN doctors d ON d.id = a.admitting_doctor
     LEFT JOIN users du ON du.id = d.user_id
     WHERE a.id = $1`,
    [admissionId]
  )
  return result.rows[0] || null
}

export const listAdmissions = async ({ patientId, status, ward, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`a.patient_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`a.status = $${values.length}`)
  }
  if (ward) {
    values.push(ward)
    conditions.push(`r.ward ILIKE $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT a.*, p.full_name AS patient_name, p.mrn AS patient_mrn, r.room_number, r.ward
     FROM admissions a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN rooms r ON r.id = a.room_id
     ${whereClause}
     ORDER BY a.admission_date DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countAdmissions = async ({ patientId, status, ward }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`a.patient_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`a.status = $${values.length}`)
  }
  if (ward) {
    values.push(ward)
    conditions.push(`r.ward ILIKE $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM admissions a
     LEFT JOIN rooms r ON r.id = a.room_id
     ${whereClause}`,
    values
  )
  return result.rows[0].total
}

export const dischargeAdmission = async (
  { admissionId, dischargeSummary, dischargeMeds, followUpNotes },
  client = pool
) => {
  const result = await client.query(
    `UPDATE admissions
     SET status = 'discharged', discharge_date = NOW(), discharge_summary = $2,
         discharge_meds = $3, follow_up_notes = $4
     WHERE id = $1 AND status = 'admitted'
     RETURNING ${ADMISSION_COLUMNS}`,
    [admissionId, dischargeSummary || null, dischargeMeds || null, followUpNotes || null]
  )
  return result.rows[0] || null
}

export const insertNursingNote = async ({ admissionId, nurseId, shift, note }) => {
  const result = await pool.query(
    `INSERT INTO nursing_notes (admission_id, nurse_id, shift, note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [admissionId, nurseId, shift, note]
  )
  return result.rows[0]
}

export const listNursingNotes = async (admissionId) => {
  const result = await pool.query(
    `SELECT nn.*, u.full_name AS nurse_name
     FROM nursing_notes nn
     LEFT JOIN users u ON u.id = nn.nurse_id
     WHERE nn.admission_id = $1
     ORDER BY nn.recorded_at DESC`,
    [admissionId]
  )
  return result.rows
}

export const findActiveAdmissionForPatient = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM admissions WHERE patient_id = $1 AND status = 'admitted' LIMIT 1`,
    [patientId]
  )
  return result.rows[0] || null
}
