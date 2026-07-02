import winston from "winston"

const { combine, timestamp, printf, colorize, errors } = winston.format

const consoleFormat = printf(({ level, message, timestamp: loggedAt, stack }) => {
  return `${loggedAt} [${level}]: ${stack || message}`
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    consoleFormat
  ),
  transports: [new winston.transports.Console()]
})
