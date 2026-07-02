import { sendError } from "../utils/apiResponse.js"
import { logger } from "../utils/logger.js"

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const code = error.code || "INTERNAL_ERROR"
  const message = error.message || "Something went wrong"

  logger.error(`${req.method} ${req.originalUrl} -> [${statusCode}] ${code}: ${error.stack || message}`)

  return sendError(res, { code, message, statusCode })
}
