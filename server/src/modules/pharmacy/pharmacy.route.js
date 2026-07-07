import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createPrescriptionSchema,
  prescriptionIdSchema,
  listPrescriptionsSchema,
  pendingPrescriptionsSchema,
  dispensePrescriptionSchema
} from "./pharmacy.validator.js"
import {
  createPrescription,
  getPrescription,
  getPrescriptions,
  getPendingPrescriptions,
  dispensePrescription
} from "./pharmacy.controller.js"

export const prescriptionsRouter = Router()

prescriptionsRouter.use(authenticate)

prescriptionsRouter.post(
  "/",
  requireRole(ROLES.DOCTOR),
  validate(createPrescriptionSchema),
  createPrescription
)

prescriptionsRouter.get(
  "/pending",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN),
  validate(pendingPrescriptionsSchema),
  getPendingPrescriptions
)

prescriptionsRouter.post(
  "/:prescriptionId/dispense",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN),
  validate(dispensePrescriptionSchema),
  dispensePrescription
)

prescriptionsRouter.get(
  "/",
  requireRole(ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN, ROLES.PATIENT),
  validate(listPrescriptionsSchema),
  getPrescriptions
)

prescriptionsRouter.get(
  "/:prescriptionId",
  requireRole(ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN, ROLES.PATIENT),
  validate(prescriptionIdSchema),
  getPrescription
)
