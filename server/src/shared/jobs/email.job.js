import { Worker } from "bullmq"
// import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { QUEUE_NAMES } from "./queues.js"
import { sendEmail } from "../utils/mailer.js"
import { logger } from "../utils/logger.js"

export const createEmailWorker = () => {
  // Redis/BullMQ disabled — uncomment when Redis is available
  // const worker = new Worker(
  //   QUEUE_NAMES.EMAIL,
  //   async (job) => {
  //     const { to, subject, text, html } = job.data
  //     await sendEmail({ to, subject, text, html })
  //   },
  //   { connection: jobConnection }
  // )

  // worker.on("failed", (job, error) => {
  //   logger.error(`Email job ${job?.id} failed: ${error.message}`)
  // })

  // return worker
  logger.warn("Email worker disabled — Redis is not available")
  return null
}

// Suppress unused import warnings while worker is disabled
void Worker
void QUEUE_NAMES
void sendEmail
