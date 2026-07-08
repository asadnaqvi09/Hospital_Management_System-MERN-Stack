import { Worker } from "bullmq"
// import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { QUEUE_NAMES } from "./queues.js"
import { sendSms } from "../utils/sms.js"
import { logger } from "../utils/logger.js"

export const createSmsWorker = () => {
  // Redis/BullMQ disabled — uncomment when Redis is available
  // const worker = new Worker(
  //   QUEUE_NAMES.SMS,
  //   async (job) => {
  //     const { to, body } = job.data
  //     await sendSms({ to, body })
  //   },
  //   { connection: jobConnection }
  // )

  // worker.on("failed", (job, error) => {
  //   logger.error(`SMS job ${job?.id} failed: ${error.message}`)
  // })

  // return worker
  logger.warn("SMS worker disabled — Redis is not available")
  return null
}

// Suppress unused import warnings while worker is disabled
void Worker
void QUEUE_NAMES
void sendSms
