import { pool } from "../../shared/config/db.js"

const PATIENT_COLUMNS = `id, user_id, mrn, full_name, cnic, date_of_birth, gender, blood_group,
  phone, address, emergency_contact_name, emergency_contact_phone, registered_by, created_at`

export const insertPatient = async ({
  userId,
  fullName,
  cnic,
  dateOfBirth,
  gender,
  bloodGroup,
  phone,
  address,
  emergencyContactName,
  emergencyContactPhone,
  registeredBy
}) => {
  const result = await pool.query(
    `INSERT INTO patients
      (user_id, mrn, full_name, cnic, date_of_birth, gender, blood_group, phone, address,
       emergency_contact_name, emergency_contact_phone, registered_by)
     VALUES
      ($1, 'CC' || LPAD(nextval('patient_mrn_seq')::text, 6, '0'), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${PATIENT_COLUMNS}`,
    [
      userId || null,
      fullName,
      cnic || null,
      dateOfBirth || null,
      gender || null,
      bloodGroup || null,
      phone,
      address || null,
      emergencyContactName || null,
      emergencyContactPhone || null,
      registeredBy || null
    ]
  )
  return result.rows[0]
}

export const findPatientById = async (patientId) => {
  const result = await pool.query(`SELECT ${PATIENT_COLUMNS} FROM patients WHERE id = $1`, [patientId])
  return result.rows[0] || null
}

export const findPatientByCnic = async (cnic) => {
  const result = await pool.query(`SELECT ${PATIENT_COLUMNS} FROM patients WHERE cnic = $1`, [cnic])
  return result.rows[0] || null
}

export const findPatientByUserId = async (userId) => {
  const result = await pool.query(`SELECT ${PATIENT_COLUMNS} FROM patients WHERE user_id = $1`, [userId])
  return result.rows[0] || null
}

export const searchPatients = async ({ search, limit, offset }) => {
  const values = []
  let whereClause = ""

  if (search) {
    values.push(`%${search}%`)
    whereClause = `WHERE full_name ILIKE $1 OR mrn ILIKE $1 OR cnic ILIKE $1 OR phone ILIKE $1`
  }

  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT ${PATIENT_COLUMNS}
     FROM patients
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countPatients = async ({ search }) => {
  const values = []
  let whereClause = ""

  if (search) {
    values.push(`%${search}%`)
    whereClause = `WHERE full_name ILIKE $1 OR mrn ILIKE $1 OR cnic ILIKE $1 OR phone ILIKE $1`
  }

  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM patients ${whereClause}`, values)
  return result.rows[0].total
}

export const insertVitals = async ({
  patientId,
  recordedBy,
  appointmentId,
  admissionId,
  bpSystolic,
  bpDiastolic,
  heartRate,
  temperature,
  weightKg,
  heightCm,
  spo2,
  notes
}) => {
  const result = await pool.query(
    `INSERT INTO patient_vitals
      (patient_id, recorded_by, appointment_id, admission_id, bp_systolic, bp_diastolic, heart_rate,
       temperature, weight_kg, height_cm, spo2, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      patientId,
      recordedBy || null,
      appointmentId || null,
      admissionId || null,
      bpSystolic ?? null,
      bpDiastolic ?? null,
      heartRate ?? null,
      temperature ?? null,
      weightKg ?? null,
      heightCm ?? null,
      spo2 ?? null,
      notes || null
    ]
  )
  return result.rows[0]
}

export const listVitals = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM patient_vitals WHERE patient_id = $1 ORDER BY recorded_at DESC`,
    [patientId]
  )
  return result.rows
}

export const insertAllergy = async ({ patientId, allergen, reaction, severity, addedBy }) => {
  const result = await pool.query(
    `INSERT INTO patient_allergies (patient_id, allergen, reaction, severity, added_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [patientId, allergen, reaction || null, severity || null, addedBy || null]
  )
  return result.rows[0]
}

export const listAllergies = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM patient_allergies WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  )
  return result.rows
}

export const deleteAllergy = async (allergyId, patientId) => {
  const result = await pool.query(
    `DELETE FROM patient_allergies WHERE id = $1 AND patient_id = $2 RETURNING id`,
    [allergyId, patientId]
  )
  return result.rows[0] || null
}

export const insertCondition = async ({ patientId, conditionName, icdCode, diagnosedDate, status, notes, addedBy }) => {
  const result = await pool.query(
    `INSERT INTO patient_conditions
      (patient_id, condition_name, icd_code, diagnosed_date, status, notes, added_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [patientId, conditionName, icdCode || null, diagnosedDate || null, status || "active", notes || null, addedBy || null]
  )
  return result.rows[0]
}

export const listConditions = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM patient_conditions WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  )
  return result.rows
}

export const updateCondition = async (conditionId, patientId, { status, notes }) => {
  const result = await pool.query(
    `UPDATE patient_conditions
     SET status = COALESCE($3, status),
         notes = COALESCE($4, notes)
     WHERE id = $1 AND patient_id = $2
     RETURNING *`,
    [conditionId, patientId, status ?? null, notes ?? null]
  )
  return result.rows[0] || null
}

export const insertDocument = async ({ patientId, title, fileKey, fileUrl, contentType, sizeBytes, uploadedBy }) => {
  const result = await pool.query(
    `INSERT INTO patient_documents
      (patient_id, title, file_key, file_url, content_type, size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [patientId, title || null, fileKey, fileUrl || null, contentType || null, sizeBytes || null, uploadedBy || null]
  )
  return result.rows[0]
}

export const listDocuments = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM patient_documents WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  )
  return result.rows
}

export const getPatientEmr = async (patientId) => {
  const [allergies, conditions, vitals, appointments, consultations, prescriptions, labOrders] = await Promise.all([
    pool.query(`SELECT * FROM patient_allergies WHERE patient_id = $1 ORDER BY created_at DESC`, [patientId]),
    pool.query(`SELECT * FROM patient_conditions WHERE patient_id = $1 ORDER BY created_at DESC`, [patientId]),
    pool.query(`SELECT * FROM patient_vitals WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 50`, [patientId]),
    pool.query(
      `SELECT id, doctor_id, appointment_date, slot_time, type, status, chief_complaint, created_at
       FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC, slot_time DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT id, appointment_id, doctor_id, diagnosis_text, follow_up_date, created_at
       FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT id, consultation_id, doctor_id, status, created_at
       FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT id, consultation_id, doctor_id, status, priority, ordered_at, completed_at
       FROM lab_orders WHERE patient_id = $1 ORDER BY ordered_at DESC`,
      [patientId]
    )
  ])

  return {
    allergies: allergies.rows,
    conditions: conditions.rows,
    vitals: vitals.rows,
    appointments: appointments.rows,
    consultations: consultations.rows,
    prescriptions: prescriptions.rows,
    labOrders: labOrders.rows
  }
}
