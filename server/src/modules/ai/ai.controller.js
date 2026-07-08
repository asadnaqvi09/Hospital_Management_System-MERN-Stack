import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { ROLES } from "../../shared/constants/roles.js"
import { isAiConfigured } from "../../shared/config/ai.js"
// import { aiQueue } from "../../shared/jobs/queues.js"
import { findPatientByUserId, findPatientById, listAllergies } from "../patients/patients.model.js"
import { findAppointmentById } from "../appointments/appointments.model.js"
import {
  insertSymptomSession,
  findSymptomSessionById,
  listSymptomSessions,
  countSymptomSessions,
  getTodayHistorySummary,
  insertHistorySummary,
  getPatientTwelveMonthHistory,
  updateAppointmentNoShowProbability,
  listUpcomingAppointmentsForScoring
} from "./ai.model.js"
import {
  runHistorySummary,
  checkPrescriptionInteractions,
  scoreAppointmentNoShow
} from "./ai.service.js"

const ensurePatientAccess = async (req, patientId) => {
  if (req.user.role === ROLES.PATIENT) {
    const patient = await findPatientByUserId(req.user.id)
    if (!patient || patient.id !== patientId) {
      throw new AppError("You can only access your own records", 403, "FORBIDDEN")
    }
  }
}

const parseSessionMessages = (session) => {
  try {
    return JSON.parse(session.symptoms_input)
  } catch {
    return [{ role: "user", content: session.symptoms_input }]
  }
}

export const startSymptomCheck = asyncHandler(async (req, res) => {
  if (!isAiConfigured()) {
    throw new AppError("AI provider is not configured", 503, "AI_NOT_CONFIGURED")
  }

  const patient = await findPatientByUserId(req.user.id)
  if (!patient) {
    throw new AppError("No patient profile is linked to your account", 400, "PATIENT_PROFILE_MISSING")
  }

  const { messages } = req.validated.body
  const session = await insertSymptomSession({
    patientId: patient.id,
    symptomsInput: JSON.stringify(messages)
  })

  // await aiQueue.add("symptom-triage", { sessionId: session.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "ai_symptom_session",
    entityId: session.id,
    after: session,
    req
  })

  return sendSuccess(res, {
    message: "Symptom check queued for processing",
    statusCode: 202,
    data: { session: { ...session, messages } }
  })
})

export const getSymptomCheckSession = asyncHandler(async (req, res) => {
  const session = await findSymptomSessionById(req.validated.params.sessionId)
  if (!session) {
    throw new AppError("Symptom session not found", 404, "SESSION_NOT_FOUND")
  }

  await ensurePatientAccess(req, session.patient_id)

  const messages = parseSessionMessages(session)
  let parsedResponse = null
  if (session.status === "completed" && session.ai_response) {
    try {
      parsedResponse = JSON.parse(session.ai_response)
    } catch {
      parsedResponse = { reply: session.ai_response }
    }
  }

  return sendSuccess(res, {
    message: "Symptom session retrieved successfully",
    data: { session: { ...session, messages, parsedResponse } }
  })
})

export const listSymptomCheckSessions = asyncHandler(async (req, res) => {
  const patient = await findPatientByUserId(req.user.id)
  if (!patient) {
    throw new AppError("No patient profile is linked to your account", 400, "PATIENT_PROFILE_MISSING")
  }

  const page = req.validated.query.page || 1
  const limit = req.validated.query.limit || 20
  const offset = (page - 1) * limit

  const [sessions, total] = await Promise.all([
    listSymptomSessions({ patientId: patient.id, limit, offset }),
    countSymptomSessions(patient.id)
  ])

  const enriched = sessions.map((session) => ({
    ...session,
    messages: parseSessionMessages(session)
  }))

  return sendSuccess(res, {
    message: "Symptom sessions retrieved successfully",
    data: { sessions: enriched },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const generateHistorySummary = asyncHandler(async (req, res) => {
  const { patientId } = req.validated.body
  await ensurePatientAccess(req, patientId)

  const patient = await findPatientById(patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }

  const cached = await getTodayHistorySummary(patientId)
  if (cached) {
    return sendSuccess(res, {
      message: "History summary retrieved from cache",
      data: { summary: cached, cached: true }
    })
  }

  if (!isAiConfigured()) {
    throw new AppError("AI provider is not configured", 503, "AI_NOT_CONFIGURED")
  }

  const history = await getPatientTwelveMonthHistory(patientId)
  const generated = await runHistorySummary(history)

  const summary = await insertHistorySummary({
    patientId,
    generatedBy: req.user.id,
    summaryText: generated.summaryText,
    dataRange: "12 months"
  })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "ai_history_summary",
    entityId: summary.id,
    after: { ...summary, ...generated },
    req
  })

  return sendSuccess(res, {
    message: "History summary generated successfully",
    statusCode: 201,
    data: { summary, details: generated, cached: false }
  })
})

export const getHistorySummary = asyncHandler(async (req, res) => {
  const { patientId } = req.validated.params
  await ensurePatientAccess(req, patientId)

  const summary = await getTodayHistorySummary(patientId)
  if (!summary) {
    throw new AppError("No summary found for today. Generate one first.", 404, "SUMMARY_NOT_FOUND")
  }

  return sendSuccess(res, { message: "History summary retrieved successfully", data: { summary } })
})

export const checkDrugInteractions = asyncHandler(async (req, res) => {
  const { patientId, medicines } = req.validated.body

  const patient = await findPatientById(patientId)
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND")
  }

  const allergies = await listAllergies(patientId)
  const result = await checkPrescriptionInteractions({ items: medicines, allergies })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.ACCESS,
    entityType: "drug_interaction_check",
    entityId: patientId,
    after: result,
    req
  })

  return sendSuccess(res, { message: "Drug interaction check completed", data: { result } })
})

export const predictNoShow = asyncHandler(async (req, res) => {
  const appointment = await findAppointmentById(req.validated.params.appointmentId)
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND")
  }

  const prediction = await scoreAppointmentNoShow(appointment)
  const updated = await updateAppointmentNoShowProbability(appointment.id, prediction.probability)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "appointment",
    entityId: appointment.id,
    before: appointment,
    after: { ...updated, prediction },
    req
  })

  return sendSuccess(res, {
    message: "No-show prediction completed",
    data: { appointment: updated, prediction }
  })
})

export const predictNoShowBatch = asyncHandler(async (req, res) => {
  const daysAhead = req.validated.body.daysAhead || 14
  const appointments = await listUpcomingAppointmentsForScoring({ daysAhead })

  const results = []
  for (const appointment of appointments) {
    const prediction = await scoreAppointmentNoShow(appointment)
    const updated = await updateAppointmentNoShowProbability(appointment.id, prediction.probability)
    results.push({ appointmentId: appointment.id, prediction, appointment: updated })
  }

  return sendSuccess(res, {
    message: "Batch no-show prediction completed",
    data: { scored: results.length, results }
  })
})
