import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { checkDatabaseConnection } from "./shared/config/db.js"
import { sendSuccess, sendError } from "./shared/utils/apiResponse.js"
import { apiLimiter } from "./shared/middlewares/rateLimit.js"
import { errorHandler } from "./shared/middlewares/errorHandler.js"
import { notFound } from "./shared/middlewares/notFound.js"
import { logger } from "./shared/utils/logger.js"
import { apiRouter } from "./routes.js"

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(morgan("dev"))

  app.get("/health", async (req, res) => {
    try {
      const database = await checkDatabaseConnection()
      return sendSuccess(res, {
        message: "Server is healthy",
        data: {
          server: "up",
          database: "connected",
          databaseTime: database.serverTime,
          uptimeSeconds: Math.round(process.uptime())
        }
      })
    } catch (error) {
      logger.error(`Health check failed to reach database: ${error.message}`)
      return sendError(res, {
        code: "DATABASE_UNAVAILABLE",
        message: `Server is running but database is unreachable: ${error.message}`,
        statusCode: 503
      })
    }
  })

  app.use("/api/v1", apiLimiter, apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
