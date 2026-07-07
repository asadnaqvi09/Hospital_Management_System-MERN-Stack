import { pool } from "../../shared/config/db.js"

const PRESCRIPTION_COLUMNS = `id, consultation_id, doctor_id, patient_id, notes, status, created_at`

export const insertPrescription = async ({ consultationId, doctorId, patientId, notes }) => {
  const result = await pool.query(
    `INSERT INTO prescriptions (consultation_id, doctor_id, patient_id, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PRESCRIPTION_COLUMNS}`,
    [consultationId, doctorId, patientId, notes || null]
  )
  return result.rows[0]
}

export const insertPrescriptionItem = async ({
  prescriptionId,
  medicineName,
  genericName,
  dosage,
  frequency,
  duration,
  instructions,
  quantity
}) => {
  const result = await pool.query(
    `INSERT INTO prescription_items
      (prescription_id, medicine_name, generic_name, dosage, frequency, duration, instructions, quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      prescriptionId,
      medicineName,
      genericName || null,
      dosage || null,
      frequency || null,
      duration || null,
      instructions || null,
      quantity ?? null
    ]
  )
  return result.rows[0]
}

export const findPrescriptionById = async (prescriptionId) => {
  const result = await pool.query(`SELECT ${PRESCRIPTION_COLUMNS} FROM prescriptions WHERE id = $1`, [prescriptionId])
  return result.rows[0] || null
}

export const listPrescriptionItems = async (prescriptionId) => {
  const result = await pool.query(
    `SELECT * FROM prescription_items WHERE prescription_id = $1 ORDER BY medicine_name ASC`,
    [prescriptionId]
  )
  return result.rows
}

export const listPrescriptions = async ({ patientId, doctorId, consultationId, status, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`pr.patient_id = $${values.length}`)
  }
  if (doctorId) {
    values.push(doctorId)
    conditions.push(`pr.doctor_id = $${values.length}`)
  }
  if (consultationId) {
    values.push(consultationId)
    conditions.push(`pr.consultation_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`pr.status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT pr.*, p.full_name AS patient_name, p.mrn AS patient_mrn, du.full_name AS doctor_name
     FROM prescriptions pr
     LEFT JOIN patients p ON p.id = pr.patient_id
     LEFT JOIN doctors d ON d.id = pr.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     ${whereClause}
     ORDER BY pr.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countPrescriptions = async ({ patientId, doctorId, consultationId, status }) => {
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
  if (consultationId) {
    values.push(consultationId)
    conditions.push(`consultation_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM prescriptions ${whereClause}`, values)
  return result.rows[0].total
}

export const listPendingPrescriptions = async ({ limit, offset }) => {
  const result = await pool.query(
    `SELECT pr.*, p.full_name AS patient_name, p.mrn AS patient_mrn, du.full_name AS doctor_name
     FROM prescriptions pr
     LEFT JOIN patients p ON p.id = pr.patient_id
     LEFT JOIN doctors d ON d.id = pr.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     WHERE pr.status IN ('pending', 'partially_dispensed')
     ORDER BY pr.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return result.rows
}

export const countPendingPrescriptions = async () => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM prescriptions WHERE status IN ('pending', 'partially_dispensed')`
  )
  return result.rows[0].total
}

export const listPrescriptionItemsByPrescriptionIds = async (prescriptionIds) => {
  if (!prescriptionIds.length) {
    return {}
  }
  const result = await pool.query(
    `SELECT * FROM prescription_items
     WHERE prescription_id = ANY($1::uuid[])
     ORDER BY medicine_name ASC`,
    [prescriptionIds]
  )
  const grouped = {}
  for (const row of result.rows) {
    if (!grouped[row.prescription_id]) {
      grouped[row.prescription_id] = []
    }
    grouped[row.prescription_id].push(row)
  }
  return grouped
}

export const findPrescriptionItemById = async (itemId, prescriptionId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM prescription_items WHERE id = $1 AND prescription_id = $2`,
    [itemId, prescriptionId]
  )
  return result.rows[0] || null
}

export const updatePrescriptionItemDispensed = async (
  { itemId, medicineId, dispensedQuantity },
  client = pool
) => {
  const result = await client.query(
    `UPDATE prescription_items
     SET medicine_id = $2,
         dispensed_quantity = COALESCE(dispensed_quantity, 0) + $3
     WHERE id = $1
     RETURNING *`,
    [itemId, medicineId, dispensedQuantity]
  )
  return result.rows[0] || null
}

export const updatePrescriptionStatus = async (prescriptionId, status, client = pool) => {
  const result = await client.query(
    `UPDATE prescriptions SET status = $2 WHERE id = $1 RETURNING ${PRESCRIPTION_COLUMNS}`,
    [prescriptionId, status]
  )
  return result.rows[0] || null
}

export const insertMedicineDispensing = async ({ prescriptionId, dispensedBy, notes }, client = pool) => {
  const result = await client.query(
    `INSERT INTO medicine_dispensing (prescription_id, dispensed_by, notes)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [prescriptionId, dispensedBy, notes || null]
  )
  return result.rows[0]
}

export const listDispensedItemsForConsultation = async (consultationId) => {
  const result = await pool.query(
    `SELECT pi.*, m.sale_price, pr.id AS prescription_id
     FROM prescriptions pr
     JOIN prescription_items pi ON pi.prescription_id = pr.id
     LEFT JOIN medicines m ON m.id = pi.medicine_id
     WHERE pr.consultation_id = $1
       AND COALESCE(pi.dispensed_quantity, 0) > 0`,
    [consultationId]
  )
  return result.rows
}
