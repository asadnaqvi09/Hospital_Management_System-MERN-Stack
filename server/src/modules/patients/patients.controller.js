import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { uploadObject } from "../../shared/utils/storage.js"
import { generateRandomToken } from "../../shared/utils/hash.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { findAdmissionById } from "../ipd/ipd.model.js"
import {
  insertPatient,
  findPatientById,
  findPatientByCnic,
  searchPatients,
  countPatients,
  insertVitals,
  listVitals,
  insertAllergy,
  listAllergies,
  deleteAllergy,
  insertCondition,
  listConditions,
  updateCondition,
  insertDocument,
  listDocuments,
  getPatientEmr
} from "./patients.model.js"

const loadPatientOrFail = async (patientId) => {
  const patient = await findPatientById(patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }
  return patient
}

const ensurePatientAccess = (req, patient) => {
  if (req.user.role === ROLES.PATIENT && patient.user_id !== req.user.id) {
    throw new AppError("You can only access your own records", 403, "FORBIDDEN")
  }
}

export const registerPatient = asyncHandler(async (req, res) => {
  const payload = req.validated.body

  if (payload.cnic) {
    const existingPatient = await findPatientByCnic(payload.cnic)
    if (existingPatient) {
      throw new AppError(`A patient with this CNIC already exists (MRN ${existingPatient.mrn})`, 409, "DUPLICATE_CNIC")
    }
  }

  const patient = await insertPatient({ ...payload, registeredBy: req.user.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "patient",
    entityId: patient.id,
    after: patient,
    req
  })

  return sendSuccess(res, {
    message: "Patient registered successfully",
    statusCode: 201,
    data: { patient }
  })
})

export const getPatients = asyncHandler(async (req, res) => {
  const { search } = req.validated.query
  const page = req.validated.query.page || 1
  const limit = req.validated.query.limit || 20
  const offset = (page - 1) * limit

  const [patients, total] = await Promise.all([
    searchPatients({ search, limit, offset }),
    countPatients({ search })
  ])

  return sendSuccess(res, {
    message: "Patients retrieved successfully",
    data: { patients },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  return sendSuccess(res, { message: "Patient retrieved successfully", data: { patient } })
})

export const getPatientEmrTimeline = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  const emr = await getPatientEmr(patient.id)

  return sendSuccess(res, {
    message: "Patient EMR retrieved successfully",
    data: { patient, ...emr }
  })
})

export const recordVitals = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  const { admissionId, ...vitalsBody } = req.validated.body

  if (admissionId) {
    const admission = await findAdmissionById(admissionId)
    if (!admission || admission.patient_id !== patient.id) {
      throw new AppError("Admission not found for this patient", 404, "ADMISSION_NOT_FOUND")
    }
  }

  const vitals = await insertVitals({
    ...vitalsBody,
    admissionId,
    patientId: patient.id,
    recordedBy: req.user.id
  })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "patient_vitals",
    entityId: vitals.id,
    after: vitals,
    req
  })

  return sendSuccess(res, { message: "Vitals recorded successfully", statusCode: 201, data: { vitals } })
})

export const getVitals = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  const vitals = await listVitals(patient.id)
  return sendSuccess(res, { message: "Vitals retrieved successfully", data: { vitals } })
})

export const addAllergy = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  const allergy = await insertAllergy({ ...req.validated.body, patientId: patient.id, addedBy: req.user.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "patient_allergy",
    entityId: allergy.id,
    after: allergy,
    req
  })

  return sendSuccess(res, { message: "Allergy added successfully", statusCode: 201, data: { allergy } })
})

export const getAllergies = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  const allergies = await listAllergies(patient.id)
  return sendSuccess(res, { message: "Allergies retrieved successfully", data: { allergies } })
})

export const removeAllergy = asyncHandler(async (req, res) => {
  const { patientId, allergyId } = req.validated.params
  await loadPatientOrFail(patientId)

  const removed = await deleteAllergy(allergyId, patientId)
  if (!removed) {
    throw new AppError("Allergy not found", 404, "ALLERGY_NOT_FOUND")
  }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.DELETE,
    entityType: "patient_allergy",
    entityId: allergyId,
    req
  })

  return sendSuccess(res, { message: "Allergy removed successfully" })
})

export const addCondition = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  const condition = await insertCondition({ ...req.validated.body, patientId: patient.id, addedBy: req.user.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "patient_condition",
    entityId: condition.id,
    after: condition,
    req
  })

  return sendSuccess(res, { message: "Condition added successfully", statusCode: 201, data: { condition } })
})

export const getConditions = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  const conditions = await listConditions(patient.id)
  return sendSuccess(res, { message: "Conditions retrieved successfully", data: { conditions } })
})

export const editCondition = asyncHandler(async (req, res) => {
  const { patientId, conditionId } = req.validated.params
  await loadPatientOrFail(patientId)

  const condition = await updateCondition(conditionId, patientId, req.validated.body)
  if (!condition) {
    throw new AppError("Condition not found", 404, "CONDITION_NOT_FOUND")
  }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "patient_condition",
    entityId: conditionId,
    after: condition,
    req
  })

  return sendSuccess(res, { message: "Condition updated successfully", data: { condition } })
})

export const uploadDocument = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)

  if (!req.file) {
    throw new AppError("A document file is required", 400, "FILE_REQUIRED")
  }

  const fileExtension = req.file.originalname.includes(".") ? req.file.originalname.split(".").pop() : "bin"
  const fileKey = `patients/${patient.id}/documents/${generateRandomToken(12)}.${fileExtension}`

  const uploaded = await uploadObject({
    key: fileKey,
    body: req.file.buffer,
    contentType: req.file.mimetype
  })

  const document = await insertDocument({
    patientId: patient.id,
    title: req.validated.body.title || req.file.originalname,
    fileKey: uploaded.key,
    fileUrl: uploaded.url,
    contentType: req.file.mimetype,
    sizeBytes: req.file.size,
    uploadedBy: req.user.id
  })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "patient_document",
    entityId: document.id,
    after: { id: document.id, title: document.title, fileKey: document.file_key },
    req
  })

  return sendSuccess(res, { message: "Document uploaded successfully", statusCode: 201, data: { document } })
})

export const getDocuments = asyncHandler(async (req, res) => {
  const patient = await loadPatientOrFail(req.validated.params.patientId)
  ensurePatientAccess(req, patient)

  const documents = await listDocuments(patient.id)
  return sendSuccess(res, { message: "Documents retrieved successfully", data: { documents } })
})
