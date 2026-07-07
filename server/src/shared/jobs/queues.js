import { Queue } from "bullmq"
import IORedis from "ioredis"
import { env } from "../config/env.js"

export const jobConnection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true
})

export const QUEUE_NAMES = {
  EMAIL: "email",
  PDF: "pdf",
  SMS: "sms",
  ALERTS: "alerts",
  AI: "ai"
}

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection: jobConnection })
export const pdfQueue = new Queue(QUEUE_NAMES.PDF, { connection: jobConnection })
export const smsQueue = new Queue(QUEUE_NAMES.SMS, { connection: jobConnection })
export const alertsQueue = new Queue(QUEUE_NAMES.ALERTS, { connection: jobConnection })
export const aiQueue = new Queue(QUEUE_NAMES.AI, { connection: jobConnection })
