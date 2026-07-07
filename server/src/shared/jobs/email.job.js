import { Worker } from "bullmq"
import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { sendEmail } from "../utils/mailer.js"
import { logger } from "../utils/logger.js"

export const createEmailWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { to, subject, text, html } = job.data
      await sendEmail({ to, subject, text, html })
    },
    { connection: jobConnection }
  )

  worker.on("failed", (job, error) => {
    logger.error(`Email job ${job?.id} failed: ${error.message}`)
  })

  return worker
}
