import { Worker } from "bullmq"
import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { sendSms } from "../utils/sms.js"
import { logger } from "../utils/logger.js"

export const createSmsWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.SMS,
    async (job) => {
      const { to, body } = job.data
      await sendSms({ to, body })
    },
    { connection: jobConnection }
  )

  worker.on("failed", (job, error) => {
    logger.error(`SMS job ${job?.id} failed: ${error.message}`)
  })

  return worker
}
