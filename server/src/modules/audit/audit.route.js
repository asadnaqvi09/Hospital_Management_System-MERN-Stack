import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import { listAuditLogsSchema, auditIdSchema } from "./audit.validator.js"
import { getAuditLogs, getAuditLog } from "./audit.controller.js"

export const auditRouter = Router()

auditRouter.use(authenticate)
auditRouter.use(requireRole(ROLES.ADMIN))

auditRouter.get("/", validate(listAuditLogsSchema), getAuditLogs)
auditRouter.get("/:auditId", validate(auditIdSchema), getAuditLog)
