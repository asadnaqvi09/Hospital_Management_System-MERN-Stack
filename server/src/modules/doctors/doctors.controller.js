import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  insertDoctor,
  findDoctorById,
  findDoctorByUserId,
  listDoctors,
  updateDoctorProfile,
  replaceWeeklySchedule,
  listSchedule,
  insertLeave,
  listLeaves,
  deleteLeave
} from "./doctors.model.js"
import { computeAvailableSlots } from "./doctors.service.js"

const loadDoctorOrFail = async (doctorId) => {
  const doctor = await findDoctorById(doctorId)
  if (!doctor) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND")
  }
  return doctor
}

const ensureDoctorSelfOrAdmin = async (req, doctorId) => {
  if (req.user.role === ROLES.ADMIN) {
    return
  }
  const doctorProfile = await findDoctorByUserId(req.user.id)
  if (!doctorProfile || doctorProfile.id !== doctorId) {
    throw new AppError("You can only manage your own schedule", 403, "FORBIDDEN")
  }
}

export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await insertDoctor(req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "doctor",
    entityId: doctor.id,
    after: doctor,
    req
  })

  return sendSuccess(res, { message: "Doctor profile created successfully", statusCode: 201, data: { doctor } })
})

export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await listDoctors(req.validated.query)
  return sendSuccess(res, { message: "Doctors retrieved successfully", data: { doctors } })
})

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await loadDoctorOrFail(req.validated.params.doctorId)
  return sendSuccess(res, { message: "Doctor retrieved successfully", data: { doctor } })
})

export const updateDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  await loadDoctorOrFail(doctorId)
  await ensureDoctorSelfOrAdmin(req, doctorId)

  const doctor = await updateDoctorProfile(doctorId, req.validated.body)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "doctor",
    entityId: doctorId,
    after: doctor,
    req
  })

  return sendSuccess(res, { message: "Doctor updated successfully", data: { doctor } })
})

export const setSchedule = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  await loadDoctorOrFail(doctorId)
  await ensureDoctorSelfOrAdmin(req, doctorId)

  await replaceWeeklySchedule(doctorId, req.validated.body.schedule)
  const schedule = await listSchedule(doctorId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "doctor_schedule",
    entityId: doctorId,
    after: { entries: schedule.length },
    req
  })

  return sendSuccess(res, { message: "Schedule updated successfully", data: { schedule } })
})

export const getSchedule = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  await loadDoctorOrFail(doctorId)

  const schedule = await listSchedule(doctorId)
  return sendSuccess(res, { message: "Schedule retrieved successfully", data: { schedule } })
})

export const addLeave = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  await loadDoctorOrFail(doctorId)
  await ensureDoctorSelfOrAdmin(req, doctorId)

  const { startDate, endDate, reason } = req.validated.body
  if (endDate < startDate) {
    throw new AppError("End date cannot be before start date", 422, "INVALID_DATE_RANGE")
  }

  const leave = await insertLeave({ doctorId, startDate, endDate, reason, approvedBy: req.user.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "doctor_leave",
    entityId: leave.id,
    after: leave,
    req
  })

  return sendSuccess(res, { message: "Leave added successfully", statusCode: 201, data: { leave } })
})

export const getLeaves = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  await loadDoctorOrFail(doctorId)

  const leaves = await listLeaves(doctorId)
  return sendSuccess(res, { message: "Leaves retrieved successfully", data: { leaves } })
})

export const removeLeave = asyncHandler(async (req, res) => {
  const { doctorId, leaveId } = req.validated.params
  await loadDoctorOrFail(doctorId)
  await ensureDoctorSelfOrAdmin(req, doctorId)

  const removed = await deleteLeave(leaveId, doctorId)
  if (!removed) {
    throw new AppError("Leave not found", 404, "LEAVE_NOT_FOUND")
  }

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.DELETE,
    entityType: "doctor_leave",
    entityId: leaveId,
    req
  })

  return sendSuccess(res, { message: "Leave removed successfully" })
})

export const getAvailability = asyncHandler(async (req, res) => {
  const { doctorId } = req.validated.params
  const { date } = req.validated.query
  await loadDoctorOrFail(doctorId)

  const availableSlots = await computeAvailableSlots(doctorId, date)

  return sendSuccess(res, {
    message: "Availability retrieved successfully",
    data: { doctorId, date, availableSlots }
  })
})
