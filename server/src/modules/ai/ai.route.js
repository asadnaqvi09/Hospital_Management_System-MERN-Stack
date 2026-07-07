import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { aiLimiter } from "../../shared/middlewares/rateLimit.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  symptomCheckSchema,
  sessionIdSchema,
  listSessionsSchema,
  historySummarySchema,
  patientIdParamSchema,
  drugInteractionSchema,
  appointmentIdParamSchema,
  batchNoShowSchema
} from "./ai.validator.js"
import {
  startSymptomCheck,
  getSymptomCheckSession,
  listSymptomCheckSessions,
  generateHistorySummary,
  getHistorySummary,
  checkDrugInteractions,
  predictNoShow,
  predictNoShowBatch
} from "./ai.controller.js"

export const aiRouter = Router()

aiRouter.use(authenticate)
aiRouter.use(aiLimiter)

aiRouter.post(
  "/symptom-check",
  requireRole(ROLES.PATIENT),
  validate(symptomCheckSchema),
  startSymptomCheck
)

aiRouter.get(
  "/symptom-check",
  requireRole(ROLES.PATIENT),
  validate(listSessionsSchema),
  listSymptomCheckSessions
)

aiRouter.get(
  "/symptom-check/:sessionId",
  requireRole(ROLES.PATIENT),
  validate(sessionIdSchema),
  getSymptomCheckSession
)

aiRouter.post(
  "/history-summary",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.NURSE),
  validate(historySummarySchema),
  generateHistorySummary
)

aiRouter.get(
  "/history-summary/:patientId",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.NURSE, ROLES.PATIENT),
  validate(patientIdParamSchema),
  getHistorySummary
)

aiRouter.post(
  "/drug-interactions",
  requireRole(ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN),
  validate(drugInteractionSchema),
  checkDrugInteractions
)

aiRouter.post(
  "/no-show/predict",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(batchNoShowSchema),
  predictNoShowBatch
)

aiRouter.post(
  "/no-show/:appointmentId",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(appointmentIdParamSchema),
  predictNoShow
)
