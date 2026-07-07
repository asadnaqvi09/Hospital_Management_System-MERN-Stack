import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { reportsLimiter } from "../../shared/middlewares/rateLimit.js"
import { ROLES } from "../../shared/constants/roles.js"
import { reportTypeSchema, exportIdSchema, pdfExportSchema } from "./reports.validator.js"
import {
  refreshReports,
  getReport,
  exportReportCsv,
  exportReportPdf,
  getReportExportStatus
} from "./reports.controller.js"

export const reportsRouter = Router()

reportsRouter.use(authenticate)
reportsRouter.use(requireRole(ROLES.ADMIN))
reportsRouter.use(reportsLimiter)

reportsRouter.post("/refresh", refreshReports)
reportsRouter.get("/exports/:exportId", validate(exportIdSchema), getReportExportStatus)
reportsRouter.get("/:reportType/export/csv", validate(reportTypeSchema), exportReportCsv)
reportsRouter.post("/:reportType/export/pdf", validate(pdfExportSchema), exportReportPdf)
reportsRouter.get("/:reportType", validate(reportTypeSchema), getReport)
