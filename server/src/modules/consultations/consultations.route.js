import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  openConsultationSchema,
  consultationIdSchema,
  appointmentIdParamSchema,
  updateConsultationSchema,
  listConsultationsSchema
} from "./consultations.validator.js"
import {
  openConsultation,
  getConsultation,
  getConsultationByAppointment,
  editConsultation,
  completeConsultation,
  getConsultations
} from "./consultations.controller.js"

export const consultationsRouter = Router()

consultationsRouter.use(authenticate)

consultationsRouter.post(
  "/",
  requireRole(ROLES.DOCTOR),
  validate(openConsultationSchema),
  openConsultation
)

consultationsRouter.get(
  "/",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.PATIENT),
  validate(listConsultationsSchema),
  getConsultations
)

consultationsRouter.get(
  "/appointment/:appointmentId",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.PATIENT),
  validate(appointmentIdParamSchema),
  getConsultationByAppointment
)

consultationsRouter.get(
  "/:consultationId",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.PATIENT),
  validate(consultationIdSchema),
  getConsultation
)

consultationsRouter.patch(
  "/:consultationId",
  requireRole(ROLES.DOCTOR),
  validate(updateConsultationSchema),
  editConsultation
)

consultationsRouter.patch(
  "/:consultationId/complete",
  requireRole(ROLES.DOCTOR),
  validate(consultationIdSchema),
  completeConsultation
)
