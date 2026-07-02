import pg from "pg"
import { env } from "./env.js"
import { logger } from "../utils/logger.js"

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

pool.on("error", (error) => {
  logger.error(`Unexpected database pool error: ${error.message}`)
})

export const checkDatabaseConnection = async () => {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT NOW() AS server_time")
    return { connected: true, serverTime: result.rows[0].server_time }
  } finally {
    client.release()
  }
}

export const closeDatabasePool = async () => {
  await pool.end()
}
