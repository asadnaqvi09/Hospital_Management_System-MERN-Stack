import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  bookAppointmentSchema,
  listAppointmentsSchema,
  appointmentIdSchema,
  updateStatusSchema,
  rescheduleSchema,
  queueSchema
} from "./appointments.validator.js"
import {
  bookAppointment,
  getAppointments,
  getAppointment,
  changeAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getQueue
} from "./appointments.controller.js"

export const appointmentsRouter = Router()

appointmentsRouter.use(authenticate)

appointmentsRouter.post(
  "/",
  requireRole(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(bookAppointmentSchema),
  bookAppointment
)

appointmentsRouter.get("/", validate(listAppointmentsSchema), getAppointments)

appointmentsRouter.get(
  "/queue",
  requireRole(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.NURSE),
  validate(queueSchema),
  getQueue
)

appointmentsRouter.get("/:appointmentId", validate(appointmentIdSchema), getAppointment)

appointmentsRouter.patch(
  "/:appointmentId/status",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(updateStatusSchema),
  changeAppointmentStatus
)

appointmentsRouter.patch(
  "/:appointmentId/reschedule",
  requireRole(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(rescheduleSchema),
  rescheduleAppointment
)

appointmentsRouter.patch(
  "/:appointmentId/cancel",
  requireRole(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(appointmentIdSchema),
  cancelAppointment
)
