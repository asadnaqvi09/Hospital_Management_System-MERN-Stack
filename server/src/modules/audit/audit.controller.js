import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { listAuditLogs, countAuditLogs, findAuditLogById } from "./audit.model.js"

export const getAuditLogs = asyncHandler(async (req, res) => {
  const filters = { ...req.validated.query }
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const [logs, total] = await Promise.all([
    listAuditLogs({ ...filters, limit, offset }),
    countAuditLogs(filters)
  ])

  return sendSuccess(res, {
    message: "Audit logs retrieved successfully",
    data: { logs },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await findAuditLogById(req.validated.params.auditId)
  if (!log) {
    throw new AppError("Audit log not found", 404, "AUDIT_LOG_NOT_FOUND")
  }

  return sendSuccess(res, { message: "Audit log retrieved successfully", data: { log } })
})
