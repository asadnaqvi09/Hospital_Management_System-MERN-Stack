import Redis from "ioredis"
import { env } from "./env.js"
import { logger } from "../utils/logger.js"

export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy: (attempt) => Math.min(attempt * 200, 2000)
})

redis.on("connect", () => {
  logger.info("Redis connected")
})

redis.on("error", (error) => {
  logger.error(`Redis error: ${error.message}`)
})

export const connectRedis = async () => {
  if (redis.status === "ready" || redis.status === "connecting") {
    return
  }
  await redis.connect()
}

export const closeRedis = async () => {
  await redis.quit()
}
