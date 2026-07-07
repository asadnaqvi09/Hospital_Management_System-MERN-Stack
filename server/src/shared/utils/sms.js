import twilio from "twilio"
import { env } from "../config/env.js"
import { logger } from "./logger.js"

let client = null

if (env.twilio.accountSid && env.twilio.authToken) {
  client = twilio(env.twilio.accountSid, env.twilio.authToken)
}

export const isSmsConfigured = () => Boolean(client && env.twilio.phoneNumber)

export const sendSms = async ({ to, body }) => {
  if (!isSmsConfigured()) {
    logger.warn(`SMS transport not configured. Skipped SMS to ${to}`)
    return { delivered: false }
  }
  if (!to) {
    return { delivered: false }
  }
  try {
    await client.messages.create({ from: env.twilio.phoneNumber, to, body })
    return { delivered: true }
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}: ${error.message}`)
    throw error
  }
}
