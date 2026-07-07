import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import { globalPatientSearchSchema } from "./search.validator.js"
import { searchPatientsGlobal } from "./search.controller.js"

export const searchRouter = Router()

searchRouter.use(authenticate)
searchRouter.use(
  requireRole(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.LAB_TECHNICIAN)
)

searchRouter.get("/patients", validate(globalPatientSearchSchema), searchPatientsGlobal)
