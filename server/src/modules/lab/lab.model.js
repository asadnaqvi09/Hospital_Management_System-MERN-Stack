import { pool } from "../../shared/config/db.js"

const LAB_TEST_COLUMNS = `id, name, category, unit, normal_range, critical_low, critical_high, price, is_active`

export const insertLabTest = async ({ name, category, unit, normalRange, criticalLow, criticalHigh, price }) => {
  const result = await pool.query(
    `INSERT INTO lab_tests (name, category, unit, normal_range, critical_low, critical_high, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${LAB_TEST_COLUMNS}`,
    [name, category || null, unit || null, normalRange || null, criticalLow ?? null, criticalHigh ?? null, price ?? 0]
  )
  return result.rows[0]
}

export const findLabTestById = async (testId) => {
  const result = await pool.query(`SELECT ${LAB_TEST_COLUMNS} FROM lab_tests WHERE id = $1`, [testId])
  return result.rows[0] || null
}

export const listLabTests = async ({ activeOnly, category, search }) => {
  const values = []
  const conditions = []

  if (activeOnly) {
    conditions.push(`is_active = TRUE`)
  }
  if (category) {
    values.push(category)
    conditions.push(`category ILIKE $${values.length}`)
  }
  if (search) {
    values.push(`%${search}%`)
    conditions.push(`name ILIKE $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(
    `SELECT ${LAB_TEST_COLUMNS} FROM lab_tests ${whereClause} ORDER BY name ASC`,
    values
  )
  return result.rows
}

export const updateLabTest = async (testId, fields) => {
  const mapping = {
    name: "name",
    category: "category",
    unit: "unit",
    normalRange: "normal_range",
    criticalLow: "critical_low",
    criticalHigh: "critical_high",
    price: "price",
    isActive: "is_active"
  }
  const setClauses = []
  const values = [testId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findLabTestById(testId)
  }

  const result = await pool.query(
    `UPDATE lab_tests SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${LAB_TEST_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const countLabTestReferences = async (testId) => {
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM lab_order_items WHERE test_id = $1`, [testId])
  return result.rows[0].total
}

export const deleteLabTest = async (testId) => {
  await pool.query(`DELETE FROM lab_tests WHERE id = $1`, [testId])
}

export const insertLabOrder = async ({ patientId, doctorId, consultationId, priority }) => {
  const result = await pool.query(
    `INSERT INTO lab_orders (patient_id, doctor_id, consultation_id, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [patientId, doctorId, consultationId, priority || "routine"]
  )
  return result.rows[0]
}

export const insertLabOrderItem = async ({ labOrderId, testId }) => {
  const result = await pool.query(
    `INSERT INTO lab_order_items (lab_order_id, test_id) VALUES ($1, $2) RETURNING *`,
    [labOrderId, testId]
  )
  return result.rows[0]
}

export const findLabOrderById = async (orderId) => {
  const result = await pool.query(`SELECT * FROM lab_orders WHERE id = $1`, [orderId])
  return result.rows[0] || null
}

export const listLabOrderItems = async (orderId) => {
  const result = await pool.query(
    `SELECT loi.*, lt.name AS test_name, lt.category, lt.unit, lt.normal_range,
            lt.critical_low, lt.critical_high
     FROM lab_order_items loi
     JOIN lab_tests lt ON lt.id = loi.test_id
     WHERE loi.lab_order_id = $1
     ORDER BY lt.name ASC`,
    [orderId]
  )
  return result.rows
}

export const listLabOrders = async ({ patientId, doctorId, status, priority, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`lo.patient_id = $${values.length}`)
  }
  if (doctorId) {
    values.push(doctorId)
    conditions.push(`lo.doctor_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`lo.status = $${values.length}`)
  }
  if (priority) {
    values.push(priority)
    conditions.push(`lo.priority = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT lo.*, p.full_name AS patient_name, p.mrn AS patient_mrn, du.full_name AS doctor_name
     FROM lab_orders lo
     LEFT JOIN patients p ON p.id = lo.patient_id
     LEFT JOIN doctors d ON d.id = lo.doctor_id
     LEFT JOIN users du ON du.id = d.user_id
     ${whereClause}
     ORDER BY lo.ordered_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countLabOrders = async ({ patientId, doctorId, status, priority }) => {
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
  if (status) {
    values.push(status)
    conditions.push(`status = $${values.length}`)
  }
  if (priority) {
    values.push(priority)
    conditions.push(`priority = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM lab_orders ${whereClause}`, values)
  return result.rows[0].total
}

export const updateLabOrderStatus = async (orderId, status, extra = {}) => {
  const setClauses = ["status = $2"]
  const values = [orderId, status]

  if (extra.sampleCollectedAt) {
    values.push(extra.sampleCollectedAt)
    setClauses.push(`sample_collected_at = $${values.length}`)
  }
  if (extra.collectedBy) {
    values.push(extra.collectedBy)
    setClauses.push(`collected_by = $${values.length}`)
  }
  if (extra.completedAt) {
    values.push(extra.completedAt)
    setClauses.push(`completed_at = $${values.length}`)
  }

  const result = await pool.query(
    `UPDATE lab_orders SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] || null
}

export const findLabOrderItemById = async (itemId) => {
  const result = await pool.query(
    `SELECT loi.*, lt.name AS test_name, lt.unit, lt.normal_range, lt.critical_low, lt.critical_high,
            lo.patient_id, lo.doctor_id, lo.status AS order_status
     FROM lab_order_items loi
     JOIN lab_tests lt ON lt.id = loi.test_id
     JOIN lab_orders lo ON lo.id = loi.lab_order_id
     WHERE loi.id = $1`,
    [itemId]
  )
  return result.rows[0] || null
}

export const updateLabOrderItemResult = async ({
  itemId,
  resultValue,
  resultNumeric,
  isAbnormal,
  isCritical,
  notes,
  processedBy
}) => {
  const result = await pool.query(
    `UPDATE lab_order_items
     SET result_value = $2, result_numeric = $3, is_abnormal = $4, is_critical = $5,
         notes = $6, processed_by = $7, processed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [itemId, resultValue || null, resultNumeric ?? null, isAbnormal, isCritical, notes || null, processedBy]
  )
  return result.rows[0] || null
}

export const countPendingResultsForOrder = async (orderId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM lab_order_items
     WHERE lab_order_id = $1 AND (result_value IS NULL AND result_numeric IS NULL)`,
    [orderId]
  )
  return result.rows[0].total
}

export const setLabOrderItemsReportUrl = async (orderId, fileUrl) => {
  await pool.query(`UPDATE lab_order_items SET result_file_url = $2 WHERE lab_order_id = $1`, [orderId, fileUrl])
}

export const getLabOrderReportContext = async (orderId) => {
  const orderResult = await pool.query(`SELECT * FROM lab_orders WHERE id = $1`, [orderId])
  const order = orderResult.rows[0]
  if (!order) {
    return null
  }

  const [patientResult, doctorResult, items] = await Promise.all([
    pool.query(`SELECT id, full_name, mrn FROM patients WHERE id = $1`, [order.patient_id]),
    pool.query(
      `SELECT d.id, u.full_name FROM doctors d LEFT JOIN users u ON u.id = d.user_id WHERE d.id = $1`,
      [order.doctor_id]
    ),
    listLabOrderItems(orderId)
  ])

  return {
    order,
    patient: patientResult.rows[0],
    doctor: doctorResult.rows[0] || {},
    items
  }
}

export const getPatientUserId = async (patientId) => {
  const result = await pool.query(`SELECT user_id FROM patients WHERE id = $1`, [patientId])
  return result.rows[0]?.user_id || null
}

export const getDoctorUserId = async (doctorId) => {
  const result = await pool.query(`SELECT user_id FROM doctors WHERE id = $1`, [doctorId])
  return result.rows[0]?.user_id || null
}
