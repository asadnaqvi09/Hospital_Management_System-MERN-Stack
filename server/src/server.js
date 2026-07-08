import http from "node:http"
import { createApp } from "./app.js"
import { env } from "./shared/config/env.js"
import { checkDatabaseConnection, closeDatabasePool } from "./shared/config/db.js"
// import { connectRedis, closeRedis } from "./shared/config/redis.js"
import { initSocketServer } from "./shared/sockets/index.js"
// import { startBackgroundWorkers, startSchedulers } from "./shared/jobs/index.js"
import { logger } from "./shared/utils/logger.js"

const startServer = async () => {
  const app = createApp()
  const server = http.createServer(app)

  initSocketServer(server)

  server.listen(env.port, () => {
    logger.info(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`)
  })

  try {
    const database = await checkDatabaseConnection()
    logger.info(`Database connected successfully at ${database.serverTime}`)
  } catch (error) {
    logger.error(`Database connection failed on startup: ${error.message}`)
  }

  // try {
  //   await connectRedis()
  // } catch (error) {
  //   logger.error(`Redis connection failed on startup: ${error.message}`)
  // }

  // startBackgroundWorkers()
  // startSchedulers()

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`)
    server.close(async () => {
      try {
        await closeDatabasePool()
        // await closeRedis()
        logger.info("Resources released, exiting")
        process.exit(0)
      } catch (error) {
        logger.error(`Error during shutdown: ${error.message}`)
        process.exit(1)
      }
    })
  }

  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`)
  process.exit(1)
})
