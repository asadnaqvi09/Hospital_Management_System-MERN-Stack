import { pool } from "../../shared/config/db.js"
import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS, INVOICE_STATUS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { pdfQueue } from "../../shared/jobs/queues.js"
import { createNotification } from "../../shared/utils/notifications.js"
import { findPatientById, findPatientByUserId } from "../patients/patients.model.js"
import { findConsultationById } from "../consultations/consultations.model.js"
import { findAdmissionById } from "../ipd/ipd.model.js"
import { findDoctorByUserId } from "../doctors/doctors.model.js"
import { listDispensedItemsForConsultation } from "../pharmacy/pharmacy.model.js"
import {
  insertInvoice,
  insertInvoiceItem,
  findInvoiceById,
  listInvoiceItems,
  listInvoices,
  countInvoices,
  updateInvoice,
  deleteInvoiceItems,
  insertPayment,
  listPaymentsByInvoice,
  sumPaymentsForInvoice,
  getConsultationFeeLine,
  getCompletedLabLinesForConsultation,
  getAdmissionRoomChargeLine,
  listInvoicesForDoctor,
  countInvoicesForDoctor
} from "./billing.model.js"

const roundMoney = (value) => Math.round(Number(value) * 100) / 100

const buildLineTotal = (quantity, unitPrice) => roundMoney(Number(quantity || 1) * Number(unitPrice))

const computeInvoiceTotals = ({ items, discountAmount = 0, taxAmount = 0 }) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.total), 0))
  const total = roundMoney(subtotal - Number(discountAmount) + Number(taxAmount))
  return { subtotal, total }
}

const mapItemInput = (item) => {
  const quantity = item.quantity ?? 1
  const unitPrice = Number(item.unitPrice)
  return {
    description: item.description,
    category: item.category || null,
    quantity,
    unitPrice,
    total: buildLineTotal(quantity, unitPrice)
  }
}

const loadInvoiceWithItems = async (invoiceId) => {
  const invoice = await findInvoiceById(invoiceId)
  if (!invoice) {
    return null
  }
  const items = await listInvoiceItems(invoiceId)
  return { ...invoice, items }
}

const ensureInvoiceAccess = async (req, invoice) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== invoice.patient_id) {
      throw new AppError("You can only access your own invoices", 403, "FORBIDDEN")
    }
  }
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor || !invoice.consultation_id) {
      throw new AppError("You can only access invoices for your consultations", 403, "FORBIDDEN")
    }
    const consultation = await findConsultationById(invoice.consultation_id)
    if (!consultation || consultation.doctor_id !== doctor.id) {
      throw new AppError("You can only access invoices for your consultations", 403, "FORBIDDEN")
    }
  }
}

const buildAutoGenerateLines = async ({ consultationId, admissionId }) => {
  const lines = []

  if (consultationId) {
    const feeLine = await getConsultationFeeLine(consultationId)
    if (feeLine && Number(feeLine.consultation_fee) > 0) {
      lines.push({
        description: `Consultation — Dr. ${feeLine.doctor_name}`,
        category: "consultation",
        quantity: 1,
        unitPrice: Number(feeLine.consultation_fee),
        total: Number(feeLine.consultation_fee)
      })
    }

    const labLines = await getCompletedLabLinesForConsultation(consultationId)
    for (const lab of labLines) {
      const price = Number(lab.price)
      if (price > 0) {
        lines.push({
          description: `Lab Test — ${lab.name}`,
          category: "laboratory",
          quantity: 1,
          unitPrice: price,
          total: price
        })
      }
    }

    const pharmacyLines = await listDispensedItemsForConsultation(consultationId)
    for (const item of pharmacyLines) {
      const qty = Number(item.dispensed_quantity)
      const price = Number(item.sale_price || 0)
      if (qty > 0 && price > 0) {
        lines.push({
          description: `Medicine — ${item.medicine_name}`,
          category: "pharmacy",
          quantity: qty,
          unitPrice: price,
          total: buildLineTotal(qty, price)
        })
      }
    }
  }

  if (admissionId) {
    const roomLine = await getAdmissionRoomChargeLine(admissionId)
    if (roomLine && Number(roomLine.daily_rate) > 0) {
      const days = roomLine.charge_days
      const rate = Number(roomLine.daily_rate)
      lines.push({
        description: `Room ${roomLine.room_number} (${roomLine.ward}) — ${days} day(s)`,
        category: "ipd",
        quantity: days,
        unitPrice: rate,
        total: buildLineTotal(days, rate)
      })
    }
  }

  return lines
}

const persistInvoiceWithItems = async (
  client,
  { patientId, consultationId, admissionId, items, discountAmount, discountReason, taxAmount, insuranceProvider, insurancePolicy, insuranceCovered, createdBy }
) => {
  const mappedItems = items.map(mapItemInput)
  const { subtotal, total } = computeInvoiceTotals({ items: mappedItems, discountAmount, taxAmount })

  const invoice = await insertInvoice(
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
    client
  )

  const savedItems = []
  for (const item of mappedItems) {
    const row = await insertInvoiceItem({ invoiceId: invoice.id, ...item }, client)
    savedItems.push(row)
  }

  return { invoice, items: savedItems }
}

const resolvePaymentStatus = (total, paidAmount) => {
  if (paidAmount >= total) {
    return INVOICE_STATUS.FULLY_PAID
  }
  if (paidAmount > 0) {
    return INVOICE_STATUS.PARTIALLY_PAID
  }
  return INVOICE_STATUS.FINALIZED
}

export const generateInvoice = asyncHandler(async (req, res) => {
  const {
    patientId,
    consultationId,
    admissionId,
    discountAmount,
    discountReason,
    taxAmount,
    insuranceProvider,
    insurancePolicy,
    insuranceCovered
  } = req.validated.body

  if (!consultationId && !admissionId) {
    throw new AppError("Provide consultationId and/or admissionId to generate an invoice", 400, "MISSING_CONTEXT")
  }

  const patient = await findPatientById(patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }

  if (consultationId) {
    const consultation = await findConsultationById(consultationId)
    if (!consultation) {
      throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
    }
    if (consultation.patient_id !== patientId) {
      throw new AppError("Consultation does not belong to this patient", 400, "PATIENT_MISMATCH")
    }
  }

  if (admissionId) {
    const admission = await findAdmissionById(admissionId)
    if (!admission) {
      throw new AppError("Admission not found", 404, "ADMISSION_NOT_FOUND")
    }
    if (admission.patient_id !== patientId) {
      throw new AppError("Admission does not belong to this patient", 400, "PATIENT_MISMATCH")
    }
  }

  const lines = await buildAutoGenerateLines({ consultationId, admissionId })
  if (lines.length === 0) {
    throw new AppError("No billable services found for the given context", 400, "NO_BILLABLE_SERVICES")
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const { invoice, items } = await persistInvoiceWithItems(client, {
      patientId,
      consultationId,
      admissionId,
      items: lines,
      discountAmount,
      discountReason,
      taxAmount,
      insuranceProvider,
      insurancePolicy,
      insuranceCovered,
      createdBy: req.user.id
    })
    await client.query("COMMIT")

    const full = { ...invoice, items }

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entityType: "invoice",
      entityId: invoice.id,
      after: full,
      req
    })

    return sendSuccess(res, {
      message: "Invoice generated successfully",
      statusCode: 201,
      data: { invoice: full }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})

export const createInvoice = asyncHandler(async (req, res) => {
  const body = req.validated.body
  const patient = await findPatientById(body.patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const { invoice, items } = await persistInvoiceWithItems(client, {
      ...body,
      createdBy: req.user.id
    })
    await client.query("COMMIT")

    const full = { ...invoice, items }

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entityType: "invoice",
      entityId: invoice.id,
      after: full,
      req
    })

    return sendSuccess(res, {
      message: "Invoice created successfully",
      statusCode: 201,
      data: { invoice: full }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await loadInvoiceWithItems(req.validated.params.invoiceId)
  if (!invoice) {
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND")
  }
  await ensureInvoiceAccess(req, invoice)
  const payments = await listPaymentsByInvoice(invoice.id)
  return sendSuccess(res, { message: "Invoice retrieved successfully", data: { invoice, payments } })
})

export const getInvoices = asyncHandler(async (req, res) => {
  const filters = { ...req.validated.query }
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient) {
      throw new AppError("No patient profile is linked to your account", 400, "PATIENT_PROFILE_MISSING")
    }
    filters.patientId = patient.id
  }

  let invoices
  let total

  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor) {
      throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
    }
    ;[invoices, total] = await Promise.all([
      listInvoicesForDoctor({ doctorId: doctor.id, status: filters.status, limit, offset }),
      countInvoicesForDoctor({ doctorId: doctor.id, status: filters.status })
    ])
  } else {
    ;[invoices, total] = await Promise.all([
      listInvoices({ ...filters, limit, offset }),
      countInvoices(filters)
    ])
  }

  return sendSuccess(res, {
    message: "Invoices retrieved successfully",
    data: { invoices },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const updateInvoiceHandler = asyncHandler(async (req, res) => {
  const { invoiceId } = req.validated.params
  const existing = await findInvoiceById(invoiceId)
  if (!existing) {
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND")
  }
  if (existing.status !== INVOICE_STATUS.DRAFT) {
    throw new AppError("Only draft invoices can be updated", 400, "INVOICE_NOT_EDITABLE")
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    let items = await listInvoiceItems(invoiceId)
    if (req.validated.body.items) {
      await deleteInvoiceItems(invoiceId, client)
      items = []
      for (const item of req.validated.body.items.map(mapItemInput)) {
        const row = await insertInvoiceItem({ invoiceId, ...item }, client)
        items.push(row)
      }
    }

    const discountAmount = req.validated.body.discountAmount ?? existing.discount_amount
    const taxAmount = req.validated.body.taxAmount ?? existing.tax_amount
    const { subtotal, total } = computeInvoiceTotals({ items, discountAmount, taxAmount })

    const invoice = await updateInvoice(
      invoiceId,
      {
        subtotal,
        total,
        discountAmount,
        discountReason: req.validated.body.discountReason ?? existing.discount_reason,
        taxAmount,
        insuranceProvider: req.validated.body.insuranceProvider ?? existing.insurance_provider,
        insurancePolicy: req.validated.body.insurancePolicy ?? existing.insurance_policy,
        insuranceCovered: req.validated.body.insuranceCovered ?? existing.insurance_covered
      },
      client
    )

    await client.query("COMMIT")

    const full = { ...invoice, items }

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: "invoice",
      entityId: invoiceId,
      before: existing,
      after: full,
      req
    })

    return sendSuccess(res, { message: "Invoice updated successfully", data: { invoice: full } })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})

export const finalizeInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.validated.params
  const existing = await findInvoiceById(invoiceId)
  if (!existing) {
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND")
  }
  if (existing.status !== INVOICE_STATUS.DRAFT) {
    throw new AppError("Only draft invoices can be finalized", 400, "INVOICE_NOT_FINALIZABLE")
  }

  const invoice = await updateInvoice(invoiceId, { status: INVOICE_STATUS.FINALIZED })

  await pdfQueue.add("invoice-receipt", { invoiceId })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "invoice",
    entityId: invoiceId,
    before: existing,
    after: invoice,
    req
  })

  const patient = await findPatientById(invoice.patient_id)
  if (patient?.user_id) {
    await createNotification({
      userId: patient.user_id,
      type: "invoice_finalized",
      title: "Invoice Finalized",
      message: `Your invoice of ${invoice.total} has been finalized.`,
      entityType: "invoice",
      entityId: invoiceId
    })
  }

  return sendSuccess(res, { message: "Invoice finalized successfully", data: { invoice } })
})

export const cancelInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.validated.params
  const existing = await findInvoiceById(invoiceId)
  if (!existing) {
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND")
  }
  if (existing.status === INVOICE_STATUS.FULLY_PAID || existing.status === INVOICE_STATUS.CANCELLED) {
    throw new AppError("Invoice cannot be cancelled", 400, "INVOICE_NOT_CANCELLABLE")
  }

  const invoice = await updateInvoice(invoiceId, { status: INVOICE_STATUS.CANCELLED })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "invoice",
    entityId: invoiceId,
    before: existing,
    after: invoice,
    req
  })

  return sendSuccess(res, { message: "Invoice cancelled successfully", data: { invoice } })
})

export const recordPayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.validated.params
  const { amount, method, reference } = req.validated.body

  const existing = await findInvoiceById(invoiceId)
  if (!existing) {
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND")
  }
  if (
    existing.status !== INVOICE_STATUS.FINALIZED &&
    existing.status !== INVOICE_STATUS.PARTIALLY_PAID
  ) {
    throw new AppError("Payments can only be recorded on finalized invoices", 400, "INVOICE_NOT_PAYABLE")
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const payment = await insertPayment(
      { invoiceId, amount, method, reference, receivedBy: req.user.id },
      client
    )
    const paidAmount = await sumPaymentsForInvoice(invoiceId, client)
    const total = Number(existing.total)
    const nextStatus = resolvePaymentStatus(total, paidAmount)

    const invoice = await updateInvoice(
      invoiceId,
      { paidAmount, status: nextStatus },
      client
    )

    await client.query("COMMIT")

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entityType: "payment",
      entityId: payment.id,
      after: { payment, invoice },
      req
    })

    const patient = await findPatientById(invoice.patient_id)
    if (patient?.user_id) {
      await createNotification({
        userId: patient.user_id,
        type: "payment_received",
        title: "Payment Received",
        message: `Payment of ${amount} recorded on your invoice.`,
        entityType: "invoice",
        entityId: invoiceId
      })
    }

    return sendSuccess(res, {
      message: "Payment recorded successfully",
      statusCode: 201,
      data: { payment, invoice }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})
