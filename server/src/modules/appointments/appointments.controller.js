import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS, APPOINTMENT_STATUS, APPOINTMENT_STATUS_TRANSITIONS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { emitAppointmentBooked, emitQueueUpdate } from "../../shared/sockets/queue.socket.js"
import { findPatientByUserId } from "../patients/patients.model.js"
import { findDoctorByUserId } from "../doctors/doctors.model.js"
import { isSlotAvailable } from "../doctors/doctors.service.js"
import {
  insertAppointment,
  findAppointmentById,
  listAppointments,
  countAppointments,
  updateAppointmentStatus,
  updateAppointmentSlot,
  getQueueForDate,
  getDoctorUserId
} from "./appointments.model.js"

const resolveBookingContext = async (req) => {
  const body = req.validated.body

  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient) {
      throw new AppError("No patient profile is linked to your account", 400, "PATIENT_PROFILE_MISSING")
    }
    return { patientId: patient.id, bookingSource: "patient" }
  }

  if (!body.patientId) {
    throw new AppError("patientId is required", 422, "PATIENT_ID_REQUIRED")
  }

  const bookingSource = req.user.role === ROLES.DOCTOR ? "doctor" : "receptionist"
  return { patientId: body.patientId, bookingSource }
}

const todayDateString = () => new Date().toISOString().slice(0, 10)

export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, slotTime, type, chiefComplaint } = req.validated.body
  const { patientId, bookingSource } = await resolveBookingContext(req)

  const normalizedSlot = slotTime.length === 5 ? `${slotTime}:00` : slotTime
  const isWalkIn = type === "walk_in" || type === "emergency"

  if (!isWalkIn) {
    const slotAvailable = await isSlotAvailable(doctorId, appointmentDate, normalizedSlot)
    if (!slotAvailable) {
      throw new AppError("The selected slot is not available", 409, "SLOT_UNAVAILABLE")
    }
  }

  let appointment
  try {
    appointment = await insertAppointment({
      patientId,
      doctorId,
      appointmentDate,
      slotTime: normalizedSlot,
      type,
      chiefComplaint,
      bookingSource,
      createdBy: req.user.id
    })
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("This slot has already been booked", 409, "DOUBLE_BOOKING")
    }
    throw error
  }

  const doctorUserId = await getDoctorUserId(doctorId)
  emitAppointmentBooked({ doctorUserId, appointment })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "appointment",
    entityId: appointment.id,
    after: appointment,
    req
  })

  return sendSuccess(res, { message: "Appointment booked successfully", statusCode: 201, data: { appointment } })
})

export const getAppointments = asyncHandler(async (req, res) => {
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
    filters.doctorId = doctor.id
  }

  const [appointments, total] = await Promise.all([
    listAppointments({ ...filters, limit, offset }),
    countAppointments(filters)
  ])

  return sendSuccess(res, {
    message: "Appointments retrieved successfully",
    data: { appointments },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAppointmentById(req.validated.params.appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }
  return sendSuccess(res, { message: "Appointment retrieved successfully", data: { appointment } })
})

export const changeAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.validated.params
  const { status } = req.validated.body

  const appointment = await findAppointmentById(appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  const allowedNextStatuses = APPOINTMENT_STATUS_TRANSITIONS[appointment.status] || []
  if (!allowedNextStatuses.includes(status)) {
    throw new AppError(`Cannot change status from ${appointment.status} to ${status}`, 422, "INVALID_STATUS_TRANSITION")
  }

  const updated = await updateAppointmentStatus(appointmentId, status)
  emitQueueUpdate({ type: "status", appointment: updated })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "appointment_status",
    entityId: appointmentId,
    before: { status: appointment.status },
    after: { status },
    req
  })

  return sendSuccess(res, { message: "Appointment status updated successfully", data: { appointment: updated } })
})

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.validated.params
  const { appointmentDate, slotTime } = req.validated.body

  const appointment = await findAppointmentById(appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  const normalizedSlot = slotTime.length === 5 ? `${slotTime}:00` : slotTime
  const slotAvailable = await isSlotAvailable(appointment.doctor_id, appointmentDate, normalizedSlot)
  if (!slotAvailable) {
    throw new AppError("The selected slot is not available", 409, "SLOT_UNAVAILABLE")
  }

  let updated
  try {
    updated = await updateAppointmentSlot(appointmentId, { appointmentDate, slotTime: normalizedSlot })
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("This slot has already been booked", 409, "DOUBLE_BOOKING")
    }
    throw error
  }

  emitQueueUpdate({ type: "reschedule", appointment: updated })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "appointment_reschedule",
    entityId: appointmentId,
    before: { date: appointment.appointment_date, slot: appointment.slot_time },
    after: { date: appointmentDate, slot: normalizedSlot },
    req
  })

  return sendSuccess(res, { message: "Appointment rescheduled successfully", data: { appointment: updated } })
})

export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.validated.params

  const appointment = await findAppointmentById(appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  if (![APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(appointment.status)) {
    throw new AppError(`Cannot cancel an appointment with status ${appointment.status}`, 422, "INVALID_STATUS_TRANSITION")
  }

  if (req.user.role === ROLES.PATIENT) {
    const appointmentStart = new Date(`${appointment.appointment_date}T${appointment.slot_time}`)
    const hoursUntil = (appointmentStart.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 2) {
      throw new AppError("Appointments can only be cancelled at least 2 hours in advance", 422, "CANCELLATION_WINDOW_CLOSED")
    }
  }

  const updated = await updateAppointmentStatus(appointmentId, APPOINTMENT_STATUS.CANCELLED)
  emitQueueUpdate({ type: "cancel", appointment: updated })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "appointment_cancel",
    entityId: appointmentId,
    before: { status: appointment.status },
    after: { status: APPOINTMENT_STATUS.CANCELLED },
    req
  })

  return sendSuccess(res, { message: "Appointment cancelled successfully", data: { appointment: updated } })
})

export const getQueue = asyncHandler(async (req, res) => {
  const date = req.validated.query.date || todayDateString()
  const queue = await getQueueForDate(date)
  return sendSuccess(res, { message: "Queue retrieved successfully", data: { date, queue } })
})
