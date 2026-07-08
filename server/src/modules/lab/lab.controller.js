import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS, LAB_ORDER_STATUS, LAB_ORDER_STATUS_TRANSITIONS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
// import { pdfQueue } from "../../shared/jobs/queues.js"
import { findConsultationById } from "../consultations/consultations.model.js"
import { findDoctorByUserId } from "../doctors/doctors.model.js"
import { findPatientByUserId } from "../patients/patients.model.js"
import { evaluateResult } from "./lab.service.js"
import {
  insertLabTest,
  findLabTestById,
  listLabTests,
  updateLabTest,
  countLabTestReferences,
  deleteLabTest,
  insertLabOrder,
  insertLabOrderItem,
  findLabOrderById,
  listLabOrderItems,
  listLabOrders,
  countLabOrders,
  updateLabOrderStatus,
  findLabOrderItemById,
  updateLabOrderItemResult,
  countPendingResultsForOrder
} from "./lab.model.js"

const loadLabOrderWithItems = async (orderId) => {
  const order = await findLabOrderById(orderId)
  if (!order) {
    return null
  }
  const items = await listLabOrderItems(orderId)
  return { ...order, items }
}

const ensureLabOrderAccess = async (req, order) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== order.patient_id) {
      throw new AppError("You can only access your own lab orders", 403, "FORBIDDEN")
    }
  }
}

export const createLabTest = asyncHandler(async (req, res) => {
  const test = await insertLabTest(req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "lab_test",
    entityId: test.id,
    after: test,
    req
  })

  return sendSuccess(res, { message: "Lab test created successfully", statusCode: 201, data: { test } })
})

export const getLabTests = asyncHandler(async (req, res) => {
  const { includeInactive, category, search } = req.validated.query
  const activeOnly = req.user.role !== ROLES.ADMIN || !includeInactive
  const tests = await listLabTests({ activeOnly, category, search })
  return sendSuccess(res, { message: "Lab tests retrieved successfully", data: { tests } })
})

export const updateLabTestHandler = asyncHandler(async (req, res) => {
  const { testId } = req.validated.params
  const existing = await findLabTestById(testId)
  if (!existing) {
    throw new AppError("Lab test not found", 404, "LAB_TEST_NOT_FOUND")
  }

  const test = await updateLabTest(testId, req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "lab_test",
    entityId: testId,
    before: existing,
    after: test,
    req
  })

  return sendSuccess(res, { message: "Lab test updated successfully", data: { test } })
})

export const removeLabTest = asyncHandler(async (req, res) => {
  const { testId } = req.validated.params
  const existing = await findLabTestById(testId)
  if (!existing) {
    throw new AppError("Lab test not found", 404, "LAB_TEST_NOT_FOUND")
  }

  const references = await countLabTestReferences(testId)
  if (references > 0) {
    const test = await updateLabTest(testId, { isActive: false })
    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: "lab_test_deactivate",
      entityId: testId,
      before: existing,
      after: test,
      req
    })
    return sendSuccess(res, { message: "Lab test deactivated successfully", data: { test } })
  }

  await deleteLabTest(testId)
  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.DELETE,
    entityType: "lab_test",
    entityId: testId,
    before: existing,
    req
  })

  return sendSuccess(res, { message: "Lab test deleted successfully", data: { testId } })
})

export const createLabOrder = asyncHandler(async (req, res) => {
  const { consultationId, testIds, priority } = req.validated.body

  const doctor = await findDoctorByUserId(req.user.id)
  if (!doctor) {
    throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
  }

  const consultation = await findConsultationById(consultationId)
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
  }

  if (consultation.doctor_id !== doctor.id) {
    throw new AppError("You can only order labs for your own consultations", 403, "FORBIDDEN")
  }

  for (const testId of testIds) {
    const test = await findLabTestById(testId)
    if (!test || test.is_active === false) {
      throw new AppError(`Lab test ${testId} is not available`, 422, "LAB_TEST_INACTIVE")
    }
  }

  const order = await insertLabOrder({
    patientId: consultation.patient_id,
    doctorId: doctor.id,
    consultationId,
    priority
  })

  const items = []
  for (const testId of testIds) {
    const item = await insertLabOrderItem({ labOrderId: order.id, testId })
    items.push(item)
  }

  const full = { ...order, items }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "lab_order",
    entityId: order.id,
    after: full,
    req
  })

  return sendSuccess(res, { message: "Lab order created successfully", statusCode: 201, data: { order: full } })
})

export const getLabOrders = asyncHandler(async (req, res) => {
  const filters = { ...req.validated.query }
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor) {
      throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
    }
    filters.doctorId = doctor.id
  }

  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient) {
      throw new AppError("No patient profile is linked to your account", 400, "PATIENT_PROFILE_MISSING")
    }
    filters.patientId = patient.id
  }

  const [orders, total] = await Promise.all([
    listLabOrders({ ...filters, limit, offset }),
    countLabOrders(filters)
  ])

  return sendSuccess(res, {
    message: "Lab orders retrieved successfully",
    data: { orders },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getLabOrder = asyncHandler(async (req, res) => {
  const order = await loadLabOrderWithItems(req.validated.params.orderId)
  if (!order) {
    throw new AppError("Lab order not found", 404, "LAB_ORDER_NOT_FOUND")
  }

  await ensureLabOrderAccess(req, order)

  return sendSuccess(res, { message: "Lab order retrieved successfully", data: { order } })
})

export const changeLabOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.params
  const { status } = req.validated.body

  const order = await findLabOrderById(orderId)
  if (!order) {
    throw new AppError("Lab order not found", 404, "LAB_ORDER_NOT_FOUND")
  }

  const allowed = LAB_ORDER_STATUS_TRANSITIONS[order.status] || []
  if (!allowed.includes(status)) {
    throw new AppError(`Cannot change lab order status from ${order.status} to ${status}`, 422, "INVALID_STATUS_TRANSITION")
  }

  const extra = {}
  if (status === LAB_ORDER_STATUS.SAMPLE_COLLECTED) {
    extra.sampleCollectedAt = new Date().toISOString()
    extra.collectedBy = req.user.id
  }

  const updated = await updateLabOrderStatus(orderId, status, extra)
  const full = await loadLabOrderWithItems(orderId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "lab_order_status",
    entityId: orderId,
    before: { status: order.status },
    after: { status },
    req
  })

  return sendSuccess(res, { message: "Lab order status updated successfully", data: { order: full || updated } })
})

export const enterLabResult = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.validated.params
  const { resultValue, resultNumeric, notes } = req.validated.body

  const order = await findLabOrderById(orderId)
  if (!order) {
    throw new AppError("Lab order not found", 404, "LAB_ORDER_NOT_FOUND")
  }

  if (![LAB_ORDER_STATUS.PROCESSING, LAB_ORDER_STATUS.SAMPLE_COLLECTED].includes(order.status)) {
    throw new AppError(`Cannot enter results for order with status ${order.status}`, 422, "INVALID_ORDER_STATUS")
  }

  const item = await findLabOrderItemById(itemId)
  if (!item || item.lab_order_id !== orderId) {
    throw new AppError("Lab order item not found", 404, "LAB_ORDER_ITEM_NOT_FOUND")
  }

  if (!resultValue && resultNumeric === undefined) {
    throw new AppError("Either resultValue or resultNumeric is required", 422, "RESULT_REQUIRED")
  }

  const flags = evaluateResult(item, resultNumeric)
  const updatedItem = await updateLabOrderItemResult({
    itemId,
    resultValue,
    resultNumeric,
    isAbnormal: flags.isAbnormal,
    isCritical: flags.isCritical,
    notes,
    processedBy: req.user.id
  })

  if (order.status === LAB_ORDER_STATUS.SAMPLE_COLLECTED) {
    await updateLabOrderStatus(orderId, LAB_ORDER_STATUS.PROCESSING)
  }

  const pendingCount = await countPendingResultsForOrder(orderId)
  let orderStatus = order.status === LAB_ORDER_STATUS.SAMPLE_COLLECTED ? LAB_ORDER_STATUS.PROCESSING : order.status

  if (pendingCount === 0) {
    await updateLabOrderStatus(orderId, LAB_ORDER_STATUS.COMPLETED, { completedAt: new Date().toISOString() })
    orderStatus = LAB_ORDER_STATUS.COMPLETED
    // await pdfQueue.add("lab-report", { orderId })
  }

  const full = await loadLabOrderWithItems(orderId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "lab_order_result",
    entityId: itemId,
    after: { ...updatedItem, orderStatus },
    req
  })

  return sendSuccess(res, {
    message: "Lab result saved successfully",
    data: { order: full, item: updatedItem, pdfPending: pendingCount === 0 }
  })
})
