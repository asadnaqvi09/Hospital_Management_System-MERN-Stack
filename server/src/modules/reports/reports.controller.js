import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { pdfQueue } from "../../shared/jobs/queues.js"
import {
  refreshMaterializedViews,
  getRevenueReport,
  getRevenueSummary,
  getPatientVolumeReport,
  getPatientVolumeSummary,
  getDoctorPerformanceReport,
  getAppointmentAnalyticsReport,
  getAppointmentAnalyticsSummary,
  getBedOccupancyReport,
  getBedOccupancySummary,
  insertReportExport,
  findReportExportById
} from "./reports.model.js"
import { getReportCsv, getDefaultDateRange } from "./reports.service.js"

const resolveDateRange = (query) => {
  const defaults = getDefaultDateRange()
  return {
    fromDate: query.fromDate || defaults.fromDate,
    toDate: query.toDate || defaults.toDate
  }
}

const reportHandlers = {
  revenue: async (range) => ({
    rows: await getRevenueReport(range),
    summary: await getRevenueSummary(range)
  }),
  "patient-volume": async (range) => ({
    rows: await getPatientVolumeReport(range),
    summary: await getPatientVolumeSummary(range)
  }),
  "doctor-performance": async () => ({
    rows: await getDoctorPerformanceReport(),
    summary: null
  }),
  "appointment-analytics": async (range) => ({
    rows: await getAppointmentAnalyticsReport(range),
    summary: await getAppointmentAnalyticsSummary(range)
  }),
  "bed-occupancy": async () => ({
    rows: await getBedOccupancyReport(),
    summary: await getBedOccupancySummary()
  })
}

const loadReport = async (reportType, range) => {
  const handler = reportHandlers[reportType]
  if (!handler) {
    throw new AppError("Invalid report type", 400, "INVALID_REPORT_TYPE")
  }
  return handler(range)
}

export const refreshReports = asyncHandler(async (req, res) => {
  await refreshMaterializedViews()

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "report_materialized_views",
    entityId: null,
    after: { refreshedAt: new Date().toISOString() },
    req
  })

  return sendSuccess(res, { message: "Report materialized views refreshed successfully" })
})

export const getReport = asyncHandler(async (req, res) => {
  const { reportType } = req.validated.params
  const range = resolveDateRange(req.validated.query)
  const { rows, summary } = await loadReport(reportType, range)

  return sendSuccess(res, {
    message: "Report retrieved successfully",
    data: { reportType, range, summary, rows }
  })
})

export const exportReportCsv = asyncHandler(async (req, res) => {
  const { reportType } = req.validated.params
  const range = resolveDateRange(req.validated.query)
  const { rows } = await loadReport(reportType, range)
  const csv = getReportCsv(reportType, rows)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.ACCESS,
    entityType: "report_export",
    entityId: null,
    after: { reportType, format: "csv", range },
    req
  })

  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", `attachment; filename="${reportType}-${range.toDate}.csv"`)
  return res.status(200).send(csv)
})

export const exportReportPdf = asyncHandler(async (req, res) => {
  const { reportType } = req.validated.params
  const range = resolveDateRange(req.validated.body)

  const exportRecord = await insertReportExport({
    reportType,
    format: "pdf",
    params: range,
    createdBy: req.user.id
  })

  await pdfQueue.add("report-export", { exportId: exportRecord.id })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "report_export",
    entityId: exportRecord.id,
    after: { reportType, format: "pdf", range },
    req
  })

  return sendSuccess(res, {
    message: "Report PDF export queued",
    statusCode: 202,
    data: { export: exportRecord }
  })
})

export const getReportExportStatus = asyncHandler(async (req, res) => {
  const exportRecord = await findReportExportById(req.validated.params.exportId)
  if (!exportRecord) {
    throw new AppError("Report export not found", 404, "EXPORT_NOT_FOUND")
  }
  if (exportRecord.created_by !== req.user.id && req.user.role !== "admin") {
    throw new AppError("You can only access your own exports", 403, "FORBIDDEN")
  }

  return sendSuccess(res, {
    message: "Report export status retrieved successfully",
    data: { export: exportRecord }
  })
})
