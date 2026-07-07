import { pool } from "../../shared/config/db.js"

const INVOICE_COLUMNS = `id, patient_id, consultation_id, admission_id, subtotal, discount_amount,
  discount_reason, tax_amount, total, paid_amount, status, insurance_provider, insurance_policy,
  insurance_covered, pdf_url, created_by, created_at`

export const insertInvoice = async (
  {
    patientId,
    consultationId,
    admissionId,
    subtotal,
    discountAmount,
    discountReason,
    taxAmount,
    total,
    insuranceProvider,
    insurancePolicy,
    insuranceCovered,
    createdBy
  },
  client = pool
) => {
  const result = await client.query(
    `INSERT INTO invoices
      (patient_id, consultation_id, admission_id, subtotal, discount_amount, discount_reason,
       tax_amount, total, insurance_provider, insurance_policy, insurance_covered, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ${INVOICE_COLUMNS}`,
    [
      patientId,
      consultationId || null,
      admissionId || null,
      subtotal ?? 0,
      discountAmount ?? 0,
      discountReason || null,
      taxAmount ?? 0,
      total ?? 0,
      insuranceProvider || null,
      insurancePolicy || null,
      insuranceCovered ?? 0,
      createdBy
    ]
  )
  return result.rows[0]
}

export const insertInvoiceItem = async (
  { invoiceId, description, category, quantity, unitPrice, total },
  client = pool
) => {
  const result = await client.query(
    `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, total)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [invoiceId, description, category || null, quantity ?? 1, unitPrice, total]
  )
  return result.rows[0]
}

export const findInvoiceById = async (invoiceId) => {
  const result = await pool.query(
    `SELECT i.*, p.full_name AS patient_name, p.mrn AS patient_mrn
     FROM invoices i
     LEFT JOIN patients p ON p.id = i.patient_id
     WHERE i.id = $1`,
    [invoiceId]
  )
  return result.rows[0] || null
}

export const listInvoiceItems = async (invoiceId) => {
  const result = await pool.query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY category ASC, description ASC`,
    [invoiceId]
  )
  return result.rows
}

export const listInvoices = async ({ patientId, consultationId, admissionId, status, limit, offset }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`i.patient_id = $${values.length}`)
  }
  if (consultationId) {
    values.push(consultationId)
    conditions.push(`i.consultation_id = $${values.length}`)
  }
  if (admissionId) {
    values.push(admissionId)
    conditions.push(`i.admission_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`i.status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT i.*, p.full_name AS patient_name, p.mrn AS patient_mrn
     FROM invoices i
     LEFT JOIN patients p ON p.id = i.patient_id
     ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countInvoices = async ({ patientId, consultationId, admissionId, status }) => {
  const values = []
  const conditions = []

  if (patientId) {
    values.push(patientId)
    conditions.push(`patient_id = $${values.length}`)
  }
  if (consultationId) {
    values.push(consultationId)
    conditions.push(`consultation_id = $${values.length}`)
  }
  if (admissionId) {
    values.push(admissionId)
    conditions.push(`admission_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    conditions.push(`status = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM invoices ${whereClause}`, values)
  return result.rows[0].total
}

export const updateInvoice = async (invoiceId, fields, client = pool) => {
  const mapping = {
    subtotal: "subtotal",
    discountAmount: "discount_amount",
    discountReason: "discount_reason",
    taxAmount: "tax_amount",
    total: "total",
    paidAmount: "paid_amount",
    status: "status",
    insuranceProvider: "insurance_provider",
    insurancePolicy: "insurance_policy",
    insuranceCovered: "insurance_covered",
    pdfUrl: "pdf_url"
  }
  const setClauses = []
  const values = [invoiceId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    const result = await client.query(`SELECT ${INVOICE_COLUMNS} FROM invoices WHERE id = $1`, [invoiceId])
    return result.rows[0] || null
  }

  const result = await client.query(
    `UPDATE invoices SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${INVOICE_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const deleteInvoiceItems = async (invoiceId, client = pool) => {
  await client.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [invoiceId])
}

export const insertPayment = async ({ invoiceId, amount, method, reference, receivedBy }, client = pool) => {
  const result = await client.query(
    `INSERT INTO payments (invoice_id, amount, method, reference, received_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [invoiceId, amount, method, reference || null, receivedBy]
  )
  return result.rows[0]
}

export const listPaymentsByInvoice = async (invoiceId) => {
  const result = await pool.query(
    `SELECT py.*, u.full_name AS received_by_name
     FROM payments py
     LEFT JOIN users u ON u.id = py.received_by
     WHERE py.invoice_id = $1
     ORDER BY py.paid_at DESC`,
    [invoiceId]
  )
  return result.rows
}

export const sumPaymentsForInvoice = async (invoiceId, client = pool) => {
  const result = await client.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE invoice_id = $1`,
    [invoiceId]
  )
  return Number(result.rows[0].total)
}

export const getConsultationFeeLine = async (consultationId) => {
  const result = await pool.query(
    `SELECT c.id AS consultation_id, d.consultation_fee, du.full_name AS doctor_name
     FROM consultations c
     JOIN doctors d ON d.id = c.doctor_id
     JOIN users du ON du.id = d.user_id
     WHERE c.id = $1`,
    [consultationId]
  )
  return result.rows[0] || null
}

export const getCompletedLabLinesForConsultation = async (consultationId) => {
  const result = await pool.query(
    `SELECT lt.name, lt.price, loi.id AS lab_order_item_id
     FROM lab_orders lo
     JOIN lab_order_items loi ON loi.lab_order_id = lo.id
     JOIN lab_tests lt ON lt.id = loi.test_id
     WHERE lo.consultation_id = $1 AND lo.status = 'completed'`,
    [consultationId]
  )
  return result.rows
}

export const getAdmissionRoomChargeLine = async (admissionId) => {
  const result = await pool.query(
    `SELECT a.id AS admission_id, a.admission_date, a.discharge_date, a.status,
            r.room_number, r.ward, r.daily_rate,
            GREATEST(
              CEIL(EXTRACT(EPOCH FROM (COALESCE(a.discharge_date, NOW()) - a.admission_date)) / 86400),
              1
            )::int AS charge_days
     FROM admissions a
     JOIN rooms r ON r.id = a.room_id
     WHERE a.id = $1`,
    [admissionId]
  )
  return result.rows[0] || null
}

export const getInvoiceReportContext = async (invoiceId) => {
  const invoice = await findInvoiceById(invoiceId)
  if (!invoice) {
    return null
  }
  const items = await listInvoiceItems(invoiceId)
  const payments = await listPaymentsByInvoice(invoiceId)
  return { invoice, items, payments }
}

export const setInvoicePdfUrl = async (invoiceId, pdfUrl) => {
  const result = await pool.query(
    `UPDATE invoices SET pdf_url = $2 WHERE id = $1 RETURNING ${INVOICE_COLUMNS}`,
    [invoiceId, pdfUrl]
  )
  return result.rows[0] || null
}

export const listInvoicesForDoctor = async ({ doctorId, status, limit, offset }) => {
  const values = [doctorId]
  const conditions = [`c.doctor_id = $1`]

  if (status) {
    values.push(status)
    conditions.push(`i.status = $${values.length}`)
  }

  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT i.*, p.full_name AS patient_name, p.mrn AS patient_mrn
     FROM invoices i
     JOIN consultations c ON c.id = i.consultation_id
     LEFT JOIN patients p ON p.id = i.patient_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY i.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countInvoicesForDoctor = async ({ doctorId, status }) => {
  const values = [doctorId]
  const conditions = [`c.doctor_id = $1`]

  if (status) {
    values.push(status)
    conditions.push(`i.status = $${values.length}`)
  }

  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM invoices i
     JOIN consultations c ON c.id = i.consultation_id
     WHERE ${conditions.join(" AND ")}`,
    values
  )
  return result.rows[0].total
}
