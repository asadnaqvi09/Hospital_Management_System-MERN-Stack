import { createEmailWorker } from "./email.job.js"
import { createPdfWorker } from "./pdf.job.js"
import { createSmsWorker } from "./sms.job.js"
import { createAlertsWorker } from "./alerts.job.js"
import { createAiWorker } from "./ai.job.js"
import {
  startAppointmentReminderScheduler,
  startStockExpiryScheduler,
  startNoShowPredictionScheduler,
  startReportRefreshScheduler
} from "./scheduler.js"
import { logger } from "../utils/logger.js"

export const startBackgroundWorkers = () => {
  try {
    createEmailWorker()
    createPdfWorker()
    createSmsWorker()
    createAlertsWorker()
    createAiWorker()
    logger.info("Background workers started")
  } catch (error) {
    logger.error(`Failed to start background workers: ${error.message}`)
  }
}

export const startSchedulers = () => {
  try {
    startAppointmentReminderScheduler()
    startStockExpiryScheduler()
    startNoShowPredictionScheduler()
    startReportRefreshScheduler()
    logger.info("Schedulers started")
  } catch (error) {
    logger.error(`Failed to start schedulers: ${error.message}`)
  }
}
