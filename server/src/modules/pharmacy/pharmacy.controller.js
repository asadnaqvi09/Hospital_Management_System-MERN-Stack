import { pool } from "../../shared/config/db.js"
import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS, PRESCRIPTION_STATUS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { createNotification } from "../../shared/utils/notifications.js"
import { findConsultationById } from "../consultations/consultations.model.js"
import { findDoctorByUserId } from "../doctors/doctors.model.js"
import { findPatientByUserId, findPatientById, listAllergies } from "../patients/patients.model.js"
import { checkPrescriptionInteractions } from "../ai/ai.service.js"
import { deductFifoStock, resolveMedicineForItem } from "./pharmacy.service.js"
import {
  insertPrescription,
  insertPrescriptionItem,
  findPrescriptionById,
  listPrescriptionItems,
  listPrescriptions,
  countPrescriptions,
  listPendingPrescriptions,
  countPendingPrescriptions,
  listPrescriptionItemsByPrescriptionIds,
  findPrescriptionItemById,
  updatePrescriptionItemDispensed,
  updatePrescriptionStatus,
  insertMedicineDispensing
} from "./pharmacy.model.js"

const loadPrescriptionWithItems = async (prescriptionId) => {
  const prescription = await findPrescriptionById(prescriptionId)
  if (!prescription) {
    return null
  }
  const items = await listPrescriptionItems(prescriptionId)
  return { ...prescription, items }
}

const ensurePrescriptionAccess = async (req, prescription) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== prescription.patient_id) {
      throw new AppError("You can only access your own prescriptions", 403, "FORBIDDEN")
    }
  }
}

export const createPrescription = asyncHandler(async (req, res) => {
  const { consultationId, notes, items } = req.validated.body

  const doctor = await findDoctorByUserId(req.user.id)
  if (!doctor) {
    throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
  }

  const consultation = await findConsultationById(consultationId)
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
  }

  if (consultation.doctor_id !== doctor.id) {
    throw new AppError("You can only prescribe for your own consultations", 403, "FORBIDDEN")
  }

  const allergies = await listAllergies(consultation.patient_id)
  const interactionCheck = await checkPrescriptionInteractions({ items, allergies })

  const prescription = await insertPrescription({
    consultationId,
    doctorId: doctor.id,
    patientId: consultation.patient_id,
    notes
  })

  const savedItems = []
  for (const item of items) {
    const row = await insertPrescriptionItem({ prescriptionId: prescription.id, ...item })
    savedItems.push(row)
  }

  const full = { ...prescription, items: savedItems }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "prescription",
    entityId: prescription.id,
    after: full,
    req
  })

  return sendSuccess(res, {
    message: "Prescription created successfully",
    statusCode: 201,
    data: { prescription: full, drugInteractionWarnings: interactionCheck }
  })
})

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await loadPrescriptionWithItems(req.validated.params.prescriptionId)
  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND")
  }

  await ensurePrescriptionAccess(req, prescription)

  return sendSuccess(res, { message: "Prescription retrieved successfully", data: { prescription } })
})

export const getPrescriptions = asyncHandler(async (req, res) => {
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

  const [prescriptions, total] = await Promise.all([
    listPrescriptions({ ...filters, limit, offset }),
    countPrescriptions(filters)
  ])

  return sendSuccess(res, {
    message: "Prescriptions retrieved successfully",
    data: { prescriptions },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getPendingPrescriptions = asyncHandler(async (req, res) => {
  const page = req.validated.query.page || 1
  const limit = req.validated.query.limit || 20
  const offset = (page - 1) * limit

  const [prescriptions, total] = await Promise.all([
    listPendingPrescriptions({ limit, offset }),
    countPendingPrescriptions()
  ])

  const itemsByPrescription = await listPrescriptionItemsByPrescriptionIds(prescriptions.map((p) => p.id))
  const withItems = prescriptions.map((prescription) => ({
    ...prescription,
    items: itemsByPrescription[prescription.id] || []
  }))

  return sendSuccess(res, {
    message: "Pending prescriptions retrieved successfully",
    data: { prescriptions: withItems },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

const buildDispensePlan = (prescriptionItems, requestedItems) => {
  if (!requestedItems || requestedItems.length === 0) {
    return prescriptionItems.map((item) => {
      const ordered = item.quantity ?? 0
      const already = item.dispensed_quantity ?? 0
      const remaining = Math.max(ordered - already, 0)
      return { prescriptionItemId: item.id, quantity: remaining, medicineId: item.medicine_id || undefined }
    }).filter((entry) => entry.quantity > 0)
  }
  return requestedItems
}

const computePrescriptionStatus = (items) => {
  const allFullyDispensed = items.every((item) => {
    const ordered = item.quantity ?? 0
    const dispensed = item.dispensed_quantity ?? 0
    return ordered > 0 ? dispensed >= ordered : dispensed > 0
  })
  if (allFullyDispensed) {
    return PRESCRIPTION_STATUS.DISPENSED
  }
  const anyDispensed = items.some((item) => (item.dispensed_quantity ?? 0) > 0)
  return anyDispensed ? PRESCRIPTION_STATUS.PARTIALLY_DISPENSED : PRESCRIPTION_STATUS.PENDING
}

export const dispensePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.validated.params
  const { items: requestedItems, notes } = req.validated.body

  const prescription = await findPrescriptionById(prescriptionId)
  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND")
  }

  if (
    prescription.status !== PRESCRIPTION_STATUS.PENDING &&
    prescription.status !== PRESCRIPTION_STATUS.PARTIALLY_DISPENSED
  ) {
    throw new AppError("Prescription is not eligible for dispensing", 400, "PRESCRIPTION_NOT_DISPENSABLE")
  }

  const prescriptionItems = await listPrescriptionItems(prescriptionId)
  const dispensePlan = buildDispensePlan(prescriptionItems, requestedItems)

  if (dispensePlan.length === 0) {
    throw new AppError("No items to dispense", 400, "NOTHING_TO_DISPENSE")
  }

  const client = await pool.connect()
  let dispensingRecord = null
  const dispensedLines = []

  try {
    await client.query("BEGIN")

    for (const line of dispensePlan) {
      const item = await findPrescriptionItemById(line.prescriptionItemId, prescriptionId, client)
      if (!item) {
        throw new AppError("Prescription item not found", 404, "PRESCRIPTION_ITEM_NOT_FOUND")
      }

      const ordered = item.quantity ?? 0
      const already = item.dispensed_quantity ?? 0
      const remaining = Math.max(ordered - already, 0)

      if (line.quantity > remaining) {
        throw new AppError(
          `Cannot dispense ${line.quantity} for ${item.medicine_name}. Remaining: ${remaining}`,
          409,
          "DISPENSE_QUANTITY_EXCEEDED"
        )
      }

      const medicine = await resolveMedicineForItem({
        medicineId: line.medicineId,
        medicineName: item.medicine_name,
        genericName: item.generic_name
      })

      await deductFifoStock(client, medicine.id, line.quantity)

      const updatedItem = await updatePrescriptionItemDispensed(
        { itemId: item.id, medicineId: medicine.id, dispensedQuantity: line.quantity },
        client
      )
      dispensedLines.push({ item: updatedItem, medicine })
    }

    dispensingRecord = await insertMedicineDispensing(
      { prescriptionId, dispensedBy: req.user.id, notes },
      client
    )

    const refreshedItems = await client.query(
      `SELECT * FROM prescription_items WHERE prescription_id = $1 ORDER BY medicine_name ASC`,
      [prescriptionId]
    )
    const nextStatus = computePrescriptionStatus(refreshedItems.rows)
    const updatedPrescription = await updatePrescriptionStatus(prescriptionId, nextStatus, client)

    await client.query("COMMIT")

    const full = { ...updatedPrescription, items: refreshedItems.rows }

    await writeAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: "prescription",
      entityId: prescriptionId,
      before: prescription,
      after: full,
      req
    })

    const patient = await findPatientById(prescription.patient_id)
    if (patient?.user_id) {
      await createNotification({
        userId: patient.user_id,
        type: "prescription_dispensed",
        title: "Prescription Dispensed",
        message: `Your prescription has been ${nextStatus === PRESCRIPTION_STATUS.DISPENSED ? "fully" : "partially"} dispensed.`,
        entityType: "prescription",
        entityId: prescriptionId
      })
    }

    return sendSuccess(res, {
      message: "Prescription dispensed successfully",
      data: { prescription: full, dispensing: dispensingRecord, dispensedLines }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
})
