import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { pool, closeDatabasePool } from "../shared/config/db.js"
import { logger } from "../shared/utils/logger.js"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const migrationsDirectory = path.join(currentDirectory, "migrations")

const ensureMigrationsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )`
  )
}

const getAppliedMigrations = async () => {
  const result = await pool.query(`SELECT filename FROM schema_migrations`)
  return new Set(result.rows.map((row) => row.filename))
}

const getMigrationFiles = async () => {
  const files = await readdir(migrationsDirectory)
  return files.filter((file) => file.endsWith(".sql")).sort()
}

const applyMigration = async (filename) => {
  const sql = await readFile(path.join(migrationsDirectory, filename), "utf8")
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(sql)
    await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [filename])
    await client.query("COMMIT")
    logger.info(`Applied migration ${filename}`)
  } catch (error) {
    await client.query("ROLLBACK")
    logger.error(`Migration failed ${filename}: ${error.message}`)
    throw error
  } finally {
    client.release()
  }
}

const runMigrations = async () => {
  await ensureMigrationsTable()
  const appliedMigrations = await getAppliedMigrations()
  const migrationFiles = await getMigrationFiles()
  const pendingMigrations = migrationFiles.filter((file) => !appliedMigrations.has(file))

  if (pendingMigrations.length === 0) {
    logger.info("No pending migrations to apply")
    return
  }

  for (const filename of pendingMigrations) {
    await applyMigration(filename)
  }

  logger.info(`Completed ${pendingMigrations.length} migration(s)`)
}

runMigrations()
  .then(async () => {
    await closeDatabasePool()
    process.exit(0)
  })
  .catch(async (error) => {
    logger.error(`Migration process aborted: ${error.message}`)
    await closeDatabasePool()
    process.exit(1)
  })
