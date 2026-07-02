import { pool, closeDatabasePool } from "../shared/config/db.js"
import { hashPassword } from "../shared/utils/hash.js"
import { logger } from "../shared/utils/logger.js"
import { ROLES } from "../shared/constants/roles.js"

const seedAdminUser = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@carecore.local"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345"
  const adminName = process.env.SEED_ADMIN_NAME || "System Administrator"

  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [adminEmail])
  if (existing.rowCount > 0) {
    logger.info(`Admin user already exists: ${adminEmail}`)
    return
  }

  const passwordHash = await hashPassword(adminPassword)
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, TRUE)`,
    [adminEmail, passwordHash, adminName, ROLES.ADMIN]
  )

  logger.info(`Seeded admin user ${adminEmail} with password ${adminPassword}`)
}

const runSeed = async () => {
  await seedAdminUser()
  logger.info("Database seeding completed")
}

runSeed()
  .then(async () => {
    await closeDatabasePool()
    process.exit(0)
  })
  .catch(async (error) => {
    logger.error(`Seeding process aborted: ${error.message}`)
    await closeDatabasePool()
    process.exit(1)
  })
