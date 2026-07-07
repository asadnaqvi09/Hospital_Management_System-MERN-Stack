import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import {
  AUDIT_ACTIONS,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_TRANSITIONS,
  CONSULTATION_OPEN_STATUSES
} from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { emitQueueUpdate } from "../../shared/sockets/queue.socket.js"
import { findAppointmentById, updateAppointmentStatus } from "../appointments/appointments.model.js"
import { findDoctorByUserId } from "../doctors/doctors.model.js"
import { findPatientByUserId } from "../patients/patients.model.js"
import {
  insertConsultation,
  findConsultationById,
  findConsultationByAppointmentId,
  updateConsultation,
  lockConsultation,
  listConsultations,
  countConsultations,
  deleteDiagnosesByConsultationId,
  insertDiagnosis,
  listDiagnosesByConsultationId
} from "./consultations.model.js"

const CONSULTATION_LOCK_HOURS = 24

const isConsultationExpired = (consultation) => {
  const createdAt = new Date(consultation.created_at).getTime()
  const lockDeadline = createdAt + CONSULTATION_LOCK_HOURS * 60 * 60 * 1000
  return Date.now() >= lockDeadline
}

const ensureConsultationEditable = async (consultation) => {
  if (consultation.is_locked) {
    throw new AppError("This consultation is locked and cannot be modified", 422, "CONSULTATION_LOCKED")
  }
  if (isConsultationExpired(consultation)) {
    await lockConsultation(consultation.id)
    throw new AppError("This consultation is locked and cannot be modified", 422, "CONSULTATION_LOCKED")
  }
}

const ensureConsultationAccess = async (req, consultation) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== consultation.patient_id) {
      throw new AppError("You can only access your own consultations", 403, "FORBIDDEN")
    }
    return
  }
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await findDoctorByUserId(req.user.id)
    if (!doctor || doctor.id !== consultation.doctor_id) {
      throw new AppError("You can only access your own consultations", 403, "FORBIDDEN")
    }
  }
}

const transitionAppointmentStatus = async (appointment, nextStatus) => {
  const allowed = APPOINTMENT_STATUS_TRANSITIONS[appointment.status] || []
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Cannot change appointment status from ${appointment.status} to ${nextStatus}`, 422, "INVALID_STATUS_TRANSITION")
  }
  return updateAppointmentStatus(appointment.id, nextStatus)
}

const attachDiagnoses = async (consultationId) => {
  const diagnoses = await listDiagnosesByConsultationId(consultationId)
  return diagnoses
}

const loadConsultationWithDiagnoses = async (consultationId) => {
  const consultation = await findConsultationById(consultationId)
  if (!consultation) {
    return null
  }
  const diagnoses = await attachDiagnoses(consultationId)
  return { ...consultation, diagnoses }
}

const replaceDiagnoses = async (consultationId, diagnoses) => {
  await deleteDiagnosesByConsultationId(consultationId)
  if (!diagnoses || diagnoses.length === 0) {
    return []
  }
  const saved = []
  for (const diagnosis of diagnoses) {
    const row = await insertDiagnosis({ consultationId, ...diagnosis })
    saved.push(row)
  }
  return saved
}

export const openConsultation = asyncHandler(async (req, res) => {
  const { appointmentId, chiefComplaint } = req.validated.body

  const doctor = await findDoctorByUserId(req.user.id)
  if (!doctor) {
    throw new AppError("No doctor profile is linked to your account", 400, "DOCTOR_PROFILE_MISSING")
  }

  const appointment = await findAppointmentById(appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  if (appointment.doctor_id !== doctor.id) {
    throw new AppError("You can only open consultations for your own appointments", 403, "FORBIDDEN")
  }

  if (!CONSULTATION_OPEN_STATUSES.includes(appointment.status)) {
    throw new AppError(`Cannot open consultation for appointment with status ${appointment.status}`, 422, "INVALID_APPOINTMENT_STATUS")
  }

  const existing = await findConsultationByAppointmentId(appointmentId)
  if (existing) {
    const full = await loadConsultationWithDiagnoses(existing.id)
    return sendSuccess(res, { message: "Consultation already exists for this appointment", data: { consultation: full } })
  }

  let consultation
  try {
    consultation = await insertConsultation({
      appointmentId,
      doctorId: doctor.id,
      patientId: appointment.patient_id,
      chiefComplaint: chiefComplaint || appointment.chief_complaint
    })
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("A consultation already exists for this appointment", 409, "CONSULTATION_EXISTS")
    }
    throw error
  }

  if (appointment.status !== APPOINTMENT_STATUS.IN_CONSULTATION) {
    const updated = await transitionAppointmentStatus(appointment, APPOINTMENT_STATUS.IN_CONSULTATION)
    emitQueueUpdate({ type: "status", appointment: updated })
  }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "consultation",
    entityId: consultation.id,
    after: consultation,
    req
  })

  return sendSuccess(res, {
    message: "Consultation opened successfully",
    statusCode: 201,
    data: { consultation: { ...consultation, diagnoses: [] } }
  })
})

export const getConsultation = asyncHandler(async (req, res) => {
  const consultation = await loadConsultationWithDiagnoses(req.validated.params.consultationId)
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
  }

  await ensureConsultationAccess(req, consultation)

  if (!consultation.is_locked && isConsultationExpired(consultation)) {
    const locked = await lockConsultation(consultation.id)
    if (locked) {
      consultation.is_locked = locked.is_locked
      consultation.locked_at = locked.locked_at
    }
  }

  return sendSuccess(res, { message: "Consultation retrieved successfully", data: { consultation } })
})

export const getConsultationByAppointment = asyncHandler(async (req, res) => {
  const consultation = await findConsultationByAppointmentId(req.validated.params.appointmentId)
  if (!consultation) {
    throw new AppError("No consultation found for this appointment", 404, "CONSULTATION_NOT_FOUND")
  }

  await ensureConsultationAccess(req, consultation)

  const full = await loadConsultationWithDiagnoses(consultation.id)
  if (!full.is_locked && isConsultationExpired(full)) {
    const locked = await lockConsultation(full.id)
    if (locked) {
      full.is_locked = locked.is_locked
      full.locked_at = locked.locked_at
    }
  }

  return sendSuccess(res, { message: "Consultation retrieved successfully", data: { consultation: full } })
})

export const editConsultation = asyncHandler(async (req, res) => {
  const { consultationId } = req.validated.params
  const { diagnoses, ...fields } = req.validated.body

  const consultation = await findConsultationById(consultationId)
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
  }

  const doctor = await findDoctorByUserId(req.user.id)
  if (!doctor || doctor.id !== consultation.doctor_id) {
    throw new AppError("You can only edit your own consultations", 403, "FORBIDDEN")
  }

  await ensureConsultationEditable(consultation)

  const updated = await updateConsultation(consultationId, fields)
  if (!updated) {
    throw new AppError("This consultation is locked and cannot be modified", 422, "CONSULTATION_LOCKED")
  }

  let savedDiagnoses
  if (diagnoses !== undefined) {
    savedDiagnoses = await replaceDiagnoses(consultationId, diagnoses)
  } else {
    savedDiagnoses = await attachDiagnoses(consultationId)
  }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "consultation",
    entityId: consultationId,
    before: consultation,
    after: { ...updated, diagnoses: savedDiagnoses },
    req
  })

  return sendSuccess(res, {
    message: "Consultation updated successfully",
    data: { consultation: { ...updated, diagnoses: savedDiagnoses } }
  })
})

export const completeConsultation = asyncHandler(async (req, res) => {
  const { consultationId } = req.validated.params

  const consultation = await findConsultationById(consultationId)
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND")
  }

  const doctor = await findDoctorByUserId(req.user.id)
  if (!doctor || doctor.id !== consultation.doctor_id) {
    throw new AppError("You can only complete your own consultations", 403, "FORBIDDEN")
  }

  const appointment = await findAppointmentById(consultation.appointment_id)
  if (!appointment) {
    throw new AppError("Linked appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    const updated = await transitionAppointmentStatus(appointment, APPOINTMENT_STATUS.COMPLETED)
    emitQueueUpdate({ type: "status", appointment: updated })
  }

  const full = await loadConsultationWithDiagnoses(consultationId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "consultation_complete",
    entityId: consultationId,
    after: { appointmentStatus: APPOINTMENT_STATUS.COMPLETED },
    req
  })

  return sendSuccess(res, { message: "Consultation completed successfully", data: { consultation: full } })
})

export const getConsultations = asyncHandler(async (req, res) => {
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

  const [consultations, total] = await Promise.all([
    listConsultations({ ...filters, limit, offset }),
    countConsultations(filters)
  ])

  return sendSuccess(res, {
    message: "Consultations retrieved successfully",
    data: { consultations },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})
