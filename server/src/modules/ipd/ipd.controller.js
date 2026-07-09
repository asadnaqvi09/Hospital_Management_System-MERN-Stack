import { pool } from "../../shared/config/db.js"
import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS, ADMISSION_STATUS, ROOM_STATUS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { findPatientById, findPatientByUserId } from "../patients/patients.model.js"
import { findDoctorById, findDoctorByUserId } from "../doctors/doctors.model.js"
import {
  insertRoom,
  findRoomById,
  listRooms,
  updateRoom,
  countActiveAdmissionsForRoom,
  assignRoomWithLock,
  setRoomAvailableIfEmpty,
  insertAdmission,
  findAdmissionById,
  listAdmissions,
  countAdmissions,
  dischargeAdmission,
  insertNursingNote,
  listNursingNotes,
  findActiveAdmissionForPatient
} from "./ipd.model.js"

const ensureAdmissionAccess = async (req, admission) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== admission.patient_id) {
      throw new AppError("You can only access your own admissions", 403, "FORBIDDEN")
    }
  }
}

export const createRoom = asyncHandler(async (req, res) => {
  const room = await insertRoom(req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "room",
    entityId: room.id,
    after: room,
    req
  })

  return sendSuccess(res, { message: "Room created successfully", statusCode: 201, data: { room } })
})

export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await listRooms(req.validated.query)
  return sendSuccess(res, { message: "Rooms retrieved successfully", data: { rooms } })
})

export const updateRoomHandler = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params
  const existing = await findRoomById(roomId)
  if (!existing) {
    throw new AppError("Room not found", 404, "ROOM_NOT_FOUND")
  }

  const room = await updateRoom(roomId, req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "room",
    entityId: roomId,
    before: existing,
    after: room,
    req
  })

  return sendSuccess(res, { message: "Room updated successfully", data: { room } })
})

export const admitPatient = asyncHandler(async (req, res) => {
  const { patientId, roomId, roomVersion, expectedDays, admissionReason } = req.validated.body

  const patient = await findPatientById(patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }

  const existingAdmission = await findActiveAdmissionForPatient(patientId)
  if (existingAdmission) {
    throw new AppError("Patient already has an active admission", 409, "ACTIVE_ADMISSION_EXISTS")
  }

  const room = await findRoomById(roomId)
  if (!room) {
    throw new AppError("Room not found", 404, "ROOM_NOT_FOUND")
  }

  if (room.status === ROOM_STATUS.MAINTENANCE) {
    throw new AppError("Room is under maintenance and cannot accept admissions", 422, "ROOM_UNAVAILABLE")
  }

  let admittingDoctor = null
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor) {
      throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
    }
    admittingDoctor = doctor.id
  } else {
    const bodyDoctorId = req.validated.body.admittingDoctorId
    if (!bodyDoctorId) {
      throw new AppError("admittingDoctorId is required for receptionist admissions", 422, "ADMITTING_DOCTOR_REQUIRED")
    }
    const doctor = await findDoctorById(bodyDoctorId)
    if (!doctor) {
      throw new AppError("Admitting doctor not found", 404, "DOCTOR_NOT_FOUND")
    }
    admittingDoctor = bodyDoctorId
  }

  const client = await pool.connect()
  let admission

  try {
    await client.query("BEGIN")

    const activeCount = await countActiveAdmissionsForRoom(roomId, client)
    if (activeCount >= room.capacity) {
      throw new AppError("No available beds in this room", 409, "BED_UNAVAILABLE")
    }

    const lockedRoom = await assignRoomWithLock({ roomId, expectedVersion: roomVersion }, client)
    if (!lockedRoom) {
      throw new AppError("Bed assignment failed due to a concurrent update. Please retry.", 409, "BED_CONFLICT")
    }

    admission = await insertAdmission(
      { patientId, admittingDoctor, roomId, expectedDays, admissionReason },
      client
    )

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  const full = await findAdmissionById(admission.id)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "admission",
    entityId: admission.id,
    after: full,
    req
  })

  return sendSuccess(res, { message: "Patient admitted successfully", statusCode: 201, data: { admission: full } })
})

export const getAdmissions = asyncHandler(async (req, res) => {
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

  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor) {
      throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
    }
    filters.admittingDoctorId = doctor.id
  }

  const [admissions, total] = await Promise.all([
    listAdmissions({ ...filters, limit, offset }),
    countAdmissions(filters)
  ])

  return sendSuccess(res, {
    message: "Admissions retrieved successfully",
    data: { admissions },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getAdmission = asyncHandler(async (req, res) => {
  const admission = await findAdmissionById(req.validated.params.admissionId)
  if (!admission) {
    throw new AppError("Admission not found", 404, "ADMISSION_NOT_FOUND")
  }

  await ensureAdmissionAccess(req, admission)

  return sendSuccess(res, { message: "Admission retrieved successfully", data: { admission } })
})

export const addNursingNoteHandler = asyncHandler(async (req, res) => {
  const { admissionId } = req.validated.params
  const admission = await findAdmissionById(admissionId)
  if (!admission) {
    throw new AppError("Admission not found", 404, "ADMISSION_NOT_FOUND")
  }

  if (admission.status !== ADMISSION_STATUS.ADMITTED) {
    throw new AppError("Nursing notes can only be added to active admissions", 422, "ADMISSION_NOT_ACTIVE")
  }

  const note = await insertNursingNote({
    admissionId,
    nurseId: req.user.id,
    shift: req.validated.body.shift,
    note: req.validated.body.note
  })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "nursing_note",
    entityId: note.id,
    after: note,
    req
  })

  return sendSuccess(res, { message: "Nursing note recorded successfully", statusCode: 201, data: { note } })
})

export const getNursingNotes = asyncHandler(async (req, res) => {
  const { admissionId } = req.validated.params
  const admission = await findAdmissionById(admissionId)
  if (!admission) {
    throw new AppError("Admission not found", 404, "ADMISSION_NOT_FOUND")
  }

  const notes = await listNursingNotes(admissionId)
  return sendSuccess(res, { message: "Nursing notes retrieved successfully", data: { notes } })
})

export const dischargePatient = asyncHandler(async (req, res) => {
  const { admissionId } = req.validated.params
  const admission = await findAdmissionById(admissionId)
  if (!admission) {
    throw new AppError("Admission not found", 404, "ADMISSION_NOT_FOUND")
  }

  if (admission.status !== ADMISSION_STATUS.ADMITTED) {
    throw new AppError("Only active admissions can be discharged", 422, "ADMISSION_NOT_ACTIVE")
  }

  const client = await pool.connect()
  let discharged

  try {
    await client.query("BEGIN")

    discharged = await dischargeAdmission(
      { admissionId, ...req.validated.body },
      client
    )

    if (!discharged) {
      throw new AppError("Failed to discharge patient", 422, "DISCHARGE_FAILED")
    }

    await setRoomAvailableIfEmpty(admission.room_id, client)

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  const full = await findAdmissionById(admissionId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "admission_discharge",
    entityId: admissionId,
    before: admission,
    after: full,
    req
  })

  return sendSuccess(res, { message: "Patient discharged successfully", data: { admission: full } })
})
