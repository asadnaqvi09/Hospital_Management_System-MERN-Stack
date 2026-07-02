import nodemailer from "nodemailer"
import { env } from "../config/env.js"
import { logger } from "./logger.js"

let transporter = null

if (env.smtp.host) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined
  })
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    logger.warn(`Email transport not configured. Skipped email to ${to} with subject "${subject}"`)
    return { delivered: false }
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, text, html })
    return { delivered: true }
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`)
    throw error
  }
}
