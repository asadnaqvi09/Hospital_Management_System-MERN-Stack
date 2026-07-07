import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createLabTestSchema,
  labTestIdSchema,
  updateLabTestSchema,
  listLabTestsSchema,
  createLabOrderSchema,
  labOrderIdSchema,
  listLabOrdersSchema,
  updateLabOrderStatusSchema,
  enterLabResultSchema
} from "./lab.validator.js"
import {
  createLabTest,
  getLabTests,
  updateLabTestHandler,
  removeLabTest,
  createLabOrder,
  getLabOrders,
  getLabOrder,
  changeLabOrderStatus,
  enterLabResult
} from "./lab.controller.js"

export const labRouter = Router()

labRouter.use(authenticate)

labRouter.post("/tests", requireRole(ROLES.ADMIN), validate(createLabTestSchema), createLabTest)
labRouter.get(
  "/tests",
  requireRole(ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.ADMIN),
  validate(listLabTestsSchema),
  getLabTests
)
labRouter.patch("/tests/:testId", requireRole(ROLES.ADMIN), validate(updateLabTestSchema), updateLabTestHandler)
labRouter.delete("/tests/:testId", requireRole(ROLES.ADMIN), validate(labTestIdSchema), removeLabTest)

labRouter.post("/orders", requireRole(ROLES.DOCTOR), validate(createLabOrderSchema), createLabOrder)
labRouter.get(
  "/orders",
  requireRole(ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.ADMIN, ROLES.PATIENT),
  validate(listLabOrdersSchema),
  getLabOrders
)
labRouter.get(
  "/orders/:orderId",
  requireRole(ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.ADMIN, ROLES.PATIENT),
  validate(labOrderIdSchema),
  getLabOrder
)
labRouter.patch(
  "/orders/:orderId/status",
  requireRole(ROLES.LAB_TECHNICIAN),
  validate(updateLabOrderStatusSchema),
  changeLabOrderStatus
)
labRouter.patch(
  "/orders/:orderId/items/:itemId/results",
  requireRole(ROLES.LAB_TECHNICIAN),
  validate(enterLabResultSchema),
  enterLabResult
)
