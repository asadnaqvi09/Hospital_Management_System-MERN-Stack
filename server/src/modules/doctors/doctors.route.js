import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createDoctorSchema,
  doctorIdSchema,
  listDoctorsSchema,
  updateDoctorSchema,
  setScheduleSchema,
  addLeaveSchema,
  leaveIdSchema,
  availabilitySchema
} from "./doctors.validator.js"
import {
  createDoctor,
  getDoctors,
  getDoctor,
  updateDoctor,
  setSchedule,
  getSchedule,
  addLeave,
  getLeaves,
  removeLeave,
  getAvailability
} from "./doctors.controller.js"

export const doctorsRouter = Router()

doctorsRouter.use(authenticate)

doctorsRouter.post("/", requireRole(ROLES.ADMIN), validate(createDoctorSchema), createDoctor)
doctorsRouter.get("/", validate(listDoctorsSchema), getDoctors)
doctorsRouter.get("/:doctorId", validate(doctorIdSchema), getDoctor)
doctorsRouter.patch("/:doctorId", requireRole(ROLES.ADMIN, ROLES.DOCTOR), validate(updateDoctorSchema), updateDoctor)

doctorsRouter.put("/:doctorId/schedule", requireRole(ROLES.ADMIN, ROLES.DOCTOR), validate(setScheduleSchema), setSchedule)
doctorsRouter.get("/:doctorId/schedule", validate(doctorIdSchema), getSchedule)

doctorsRouter.post("/:doctorId/leaves", requireRole(ROLES.ADMIN, ROLES.DOCTOR), validate(addLeaveSchema), addLeave)
doctorsRouter.get("/:doctorId/leaves", validate(doctorIdSchema), getLeaves)
doctorsRouter.delete("/:doctorId/leaves/:leaveId", requireRole(ROLES.ADMIN, ROLES.DOCTOR), validate(leaveIdSchema), removeLeave)

doctorsRouter.get(
  "/:doctorId/availability",
  requireRole(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(availabilitySchema),
  getAvailability
)
