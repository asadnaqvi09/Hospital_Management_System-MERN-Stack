import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createMedicineSchema,
  medicineIdSchema,
  updateMedicineSchema,
  listMedicinesSchema,
  receiveBatchSchema,
  expiryAlertsSchema
} from "./medicines.validator.js"
import {
  createMedicine,
  getMedicines,
  getMedicine,
  updateMedicineHandler,
  receiveMedicineBatch,
  getReorderAlerts,
  getExpiryAlerts
} from "./medicines.controller.js"

export const medicinesRouter = Router()

medicinesRouter.use(authenticate)

medicinesRouter.get(
  "/alerts/reorder",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN),
  getReorderAlerts
)

medicinesRouter.get(
  "/alerts/expiry",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN),
  validate(expiryAlertsSchema),
  getExpiryAlerts
)

medicinesRouter.post(
  "/",
  requireRole(ROLES.ADMIN),
  validate(createMedicineSchema),
  createMedicine
)

medicinesRouter.get(
  "/",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(listMedicinesSchema),
  getMedicines
)

medicinesRouter.get(
  "/:medicineId",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.DOCTOR),
  validate(medicineIdSchema),
  getMedicine
)

medicinesRouter.patch(
  "/:medicineId",
  requireRole(ROLES.ADMIN),
  validate(updateMedicineSchema),
  updateMedicineHandler
)

medicinesRouter.post(
  "/:medicineId/batches",
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN),
  validate(receiveBatchSchema),
  receiveMedicineBatch
)
