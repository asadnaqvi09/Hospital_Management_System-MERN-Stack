import { pool } from "../../shared/config/db.js"

const CONSULTATION_COLUMNS = `id, appointment_id, doctor_id, patient_id, chief_complaint, hopi,
  examination, diagnosis_text, management_plan, follow_up_date, is_locked, created_at, locked_at`

export const insertConsultation = async ({ appointmentId, doctorId, patientId, chiefComplaint }) => {
  const result = await pool.query(
    `INSERT INTO consultations (appointment_id, doctor_id, patient_id, chief_complaint)
     VALUES ($1, $2, $3, $4)
     RETURNING ${CONSULTATION_COLUMNS}`,
    [appointmentId, doctorId, patientId, chiefComplaint || null]
  )
  return result.rows[0]
}

export const findConsultationById = async (consultationId) => {
  const result = await pool.query(`SELECT ${CONSULTATION_COLUMNS} FROM consultations WHERE id = $1`, [consultationId])
  return result.rows[0] || null
}

export const findConsultationByAppointmentId = async (appointmentId) => {
  const result = await pool.query(
    `SELECT ${CONSULTATION_COLUMNS} FROM consultations WHERE appointment_id = $1`,
    [appointmentId]
  )
  return result.rows[0] || null
}

export const updateConsultation = async (consultationId, fields) => {
  const allowedFields = [
    "chief_complaint",
    "hopi",
    "examination",
    "diagnosis_text",
    "management_plan",
    "follow_up_date"
  ]
  const setClauses = []
  const values = [consultationId]

  for (const [key, column] of Object.entries({
    chiefComplaint: "chief_complaint",
    hopi: "hopi",
    examination: "examination",
    diagnosisText: "diagnosis_text",
    managementPlan: "management_plan",
    followUpDate: "follow_up_date"
  })) {
    if (fields[key] !== undefined && allowedFields.includes(column)) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findConsultationById(consultationId)
  }

  const result = await pool.query(
    `UPDATE consultations SET ${setClauses.join(", ")} WHERE id = $1 AND is_locked = FALSE
     RETURNING ${CONSULTATION_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const lockConsultation = async (consultationId) => {
  const result = await pool.query(
    `UPDATE consultations SET is_locked = TRUE, locked_at = NOW()
     WHERE id = $1 AND is_locked = FALSE
     RETURNING ${CONSULTATION_COLUMNS}`,
    [consultationId]
  )
  return result.rows[0] || null
}

export const listConsultations = async ({ patientId, doctorId, fromDate, toDate, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`c.patient_id = $${values.length}`)
  }
  if (doctorId) {
    values.push(doctorId)
    conditions.push(`c.doctor_id = $${values.length}`)
  }
  if (fromDate) {
    values.push(fromDate)
    conditions.push(`c.created_at::date >= $${values.length}`)
  }
  if (toDate) {
    values.push(toDate)
    conditions.push(`c.created_at::date <= $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT ${CONSULTATION_COLUMNS.split(", ").map((c) => `c.${c.trim()}`).join(", ")},
            p.full_name AS patient_name, p.mrn AS patient_mrn, du.full_name AS doctor_name
     FROM consultations c
     LEFT JOIN patients p ON p.id = c.patient_id
     LEFT JOIN doctors d ON d.id = c.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countConsultations = async ({ patientId, doctorId, fromDate, toDate }) => {
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
  if (fromDate) {
    values.push(fromDate)
    conditions.push(`created_at::date >= $${values.length}`)
  }
  if (toDate) {
    values.push(toDate)
    conditions.push(`created_at::date <= $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM consultations ${whereClause}`, values)
  return result.rows[0].total
}

export const deleteDiagnosesByConsultationId = async (consultationId) => {
  await pool.query(`DELETE FROM diagnoses WHERE consultation_id = $1`, [consultationId])
}

export const insertDiagnosis = async ({ consultationId, icdCode, description, type }) => {
  const result = await pool.query(
    `INSERT INTO diagnoses (consultation_id, icd_code, description, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [consultationId, icdCode || null, description, type || "primary"]
  )
  return result.rows[0]
}

export const listDiagnosesByConsultationId = async (consultationId) => {
  const result = await pool.query(
    `SELECT * FROM diagnoses WHERE consultation_id = $1 ORDER BY type ASC, description ASC`,
    [consultationId]
  )
  return result.rows
}
