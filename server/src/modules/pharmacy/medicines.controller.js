import { pool } from "../../shared/config/db.js"
import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { env } from "../../shared/config/env.js"
import {
  insertMedicine,
  findMedicineById,
  listMedicines,
  countMedicines,
  updateMedicine,
  insertMedicineBatch,
  incrementMedicineStock,
  listLowStockMedicines,
  listExpiringBatches,
  listMedicineBatches
} from "./medicines.model.js"

export const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await insertMedicine(req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "medicine",
    entityId: medicine.id,
    after: medicine,
    req
  })

  return sendSuccess(res, { message: "Medicine created successfully", statusCode: 201, data: { medicine } })
})

export const getMedicines = asyncHandler(async (req, res) => {
  const filters = { ...req.validated.query }
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const [medicines, total] = await Promise.all([
    listMedicines({ ...filters, limit, offset }),
    countMedicines(filters)
  ])

  return sendSuccess(res, {
    message: "Medicines retrieved successfully",
    data: { medicines },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await findMedicineById(req.validated.params.medicineId)
  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND")
  }
  const batches = await listMedicineBatches(medicine.id)
  return sendSuccess(res, { message: "Medicine retrieved successfully", data: { medicine, batches } })
})

export const updateMedicineHandler = asyncHandler(async (req, res) => {
  const { medicineId } = req.validated.params
  const existing = await findMedicineById(medicineId)
  if (!existing) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND")
  }

  const medicine = await updateMedicine(medicineId, req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "medicine",
    entityId: medicineId,
    before: existing,
    after: medicine,
    req
  })

  return sendSuccess(res, { message: "Medicine updated successfully", data: { medicine } })
})

export const receiveMedicineBatch = asyncHandler(async (req, res) => {
  const { medicineId } = req.validated.params
  const { batchNumber, quantity, expiryDate } = req.validated.body

  const existing = await findMedicineById(medicineId)
  if (!existing) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND")
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const batch = await insertMedicineBatch({ medicineId, batchNumber, quantity, expiryDate }, client)
    const medicine = await incrementMedicineStock(medicineId, quantity, client)
    await client.query("COMMIT")

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entityType: "medicine_batch",
      entityId: batch.id,
      after: { batch, medicine },
      req
    })

    return sendSuccess(res, {
      message: "Medicine batch received successfully",
      statusCode: 201,
      data: { batch, medicine }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})

export const getReorderAlerts = asyncHandler(async (req, res) => {
  const medicines = await listLowStockMedicines()
  return sendSuccess(res, { message: "Reorder alerts retrieved successfully", data: { medicines } })
})

export const getExpiryAlerts = asyncHandler(async (req, res) => {
  const days = req.validated.query.days || env.pharmacy.expiryAlertDays
  const batches = await listExpiringBatches(days)
  return sendSuccess(res, { message: "Expiry alerts retrieved successfully", data: { batches, days } })
})
