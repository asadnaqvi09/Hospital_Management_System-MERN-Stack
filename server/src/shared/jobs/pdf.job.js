import { Worker } from "bullmq"
// import { jobConnection, QUEUE_NAMES, smsQueue } from "./queues.js"
import { QUEUE_NAMES } from "./queues.js"
import { logger } from "../utils/logger.js"
import { uploadObject } from "../utils/storage.js"
import { createNotification } from "../utils/notifications.js"
import { isSmsConfigured } from "../utils/sms.js"
import { buildLabReportPdf } from "../../modules/lab/lab.service.js"
import { buildInvoicePdf } from "../../modules/billing/billing.service.js"
import {
  getLabOrderReportContext,
  setLabOrderItemsReportUrl,
  getPatientUserId,
  getDoctorUserId
} from "../../modules/lab/lab.model.js"
import { getInvoiceReportContext, setInvoicePdfUrl } from "../../modules/billing/billing.model.js"
import { getReportExportContext, updateReportExport } from "../../modules/reports/reports.model.js"
import { buildReportPdf } from "../../modules/reports/reports.service.js"
import { findPatientById } from "../../modules/patients/patients.model.js"

const notifyLabReportReady = async ({ order, items, fileUrl }) => {
  const hasCritical = items.some((item) => item.is_critical)
  const doctorUserId = await getDoctorUserId(order.doctor_id)
  const patientUserId = await getPatientUserId(order.patient_id)

  const title = hasCritical ? "Critical Lab Results Available" : "Lab Report Ready"
  const message = hasCritical
    ? "One or more lab results are flagged as critical. Please review immediately."
    : "Your lab report has been generated and is ready to view."

  if (doctorUserId) {
    await createNotification({
      userId: doctorUserId,
      type: hasCritical ? "lab_critical" : "lab_report",
      title,
      message,
      entityType: "lab_order",
      entityId: order.id
    })
  }

  if (patientUserId) {
    await createNotification({
      userId: patientUserId,
      type: hasCritical ? "lab_critical" : "lab_report",
      title,
      message,
      entityType: "lab_order",
      entityId: order.id
    })
  }

  if (hasCritical && isSmsConfigured()) {
    const patient = await findPatientById(order.patient_id)
    if (patient?.phone) {
      // await smsQueue.add("critical-lab", {
      //   to: patient.phone,
      //   body: "CareCore HMS: Critical lab results are available. Please contact your doctor immediately."
      // })
      logger.warn(`Redis disabled — skipped critical lab SMS for order ${order.id}`)
    }
  }

  return { fileUrl, hasCritical }
}

const processLabReport = async (orderId) => {
  const context = await getLabOrderReportContext(orderId)
  if (!context) {
    throw new Error(`Lab order ${orderId} not found for PDF generation`)
  }

  const pdfBuffer = await buildLabReportPdf(context)
  const key = `lab-reports/${orderId}.pdf`
  const { url } = await uploadObject({ key, body: pdfBuffer, contentType: "application/pdf" })
  await setLabOrderItemsReportUrl(orderId, url)

  await notifyLabReportReady({ order: context.order, items: context.items, fileUrl: url })
  return { orderId, url }
}

const processInvoiceReceipt = async (invoiceId) => {
  const context = await getInvoiceReportContext(invoiceId)
  if (!context) {
    throw new Error(`Invoice ${invoiceId} not found for PDF generation`)
  }

  const pdfBuffer = await buildInvoicePdf(context)
  const key = `invoices/${invoiceId}.pdf`
  const { url } = await uploadObject({ key, body: pdfBuffer, contentType: "application/pdf" })
  await setInvoicePdfUrl(invoiceId, url)

  const patient = await findPatientById(context.invoice.patient_id)
  if (patient?.user_id) {
    await createNotification({
      userId: patient.user_id,
      type: "invoice_pdf",
      title: "Invoice Receipt Ready",
      message: "Your invoice receipt PDF is ready to download.",
      entityType: "invoice",
      entityId: invoiceId
    })
  }

  return { invoiceId, url }
}

const processReportExport = async (exportId) => {
  await updateReportExport(exportId, { status: "processing" })

  try {
    const context = await getReportExportContext(exportId)
    if (!context) {
      throw new Error(`Report export ${exportId} not found`)
    }

    const pdfBuffer = await buildReportPdf({
      reportType: context.reportType,
      rows: context.rows,
      summary: context.summary,
      params: context.params
    })
    const key = `reports/${context.reportType}-${exportId}.pdf`
    const { url } = await uploadObject({ key, body: pdfBuffer, contentType: "application/pdf" })

    await updateReportExport(exportId, {
      fileUrl: url,
      status: "completed",
      completedAt: new Date().toISOString()
    })

    return { exportId, url }
  } catch (error) {
    await updateReportExport(exportId, { status: "failed", completedAt: new Date().toISOString() })
    throw error
  }
}

export const createPdfWorker = () => {
  // Redis/BullMQ disabled — uncomment when Redis is available
  // const worker = new Worker(
  //   QUEUE_NAMES.PDF,
  //   async (job) => {
  //     if (job.name === "invoice-receipt") {
  //       return processInvoiceReceipt(job.data.invoiceId)
  //     }
  //     if (job.name === "report-export") {
  //       return processReportExport(job.data.exportId)
  //     }
  //     return processLabReport(job.data.orderId)
  //   },
  //   { connection: jobConnection }
  // )

  // worker.on("failed", (job, error) => {
  //   logger.error(`PDF job ${job?.id} failed: ${error.message}`)
  // })

  // return worker
  logger.warn("PDF worker disabled — Redis is not available")
  return null
}

// Suppress unused import warnings while worker is disabled
void Worker
void QUEUE_NAMES
void processLabReport
void processInvoiceReceipt
void processReportExport
