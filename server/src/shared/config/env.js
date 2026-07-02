import dotenv from "dotenv"

dotenv.config()

const requiredVariables = ["DATABASE_URL"]
const missingVariables = requiredVariables.filter((key) => !process.env[key])

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  logLevel: process.env.LOG_LEVEL || "info",
  appName: process.env.APP_NAME || "CareCore HMS",
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL !== "false",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    twoFactorSecret: process.env.JWT_TWO_FACTOR_SECRET || "dev_two_factor_secret_change_me",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenDays: Number(process.env.JWT_REFRESH_TOKEN_DAYS) || 7,
    twoFactorExpiresIn: process.env.JWT_TWO_FACTOR_EXPIRES_IN || "5m"
  },
  security: {
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutMinutes: Number(process.env.LOCKOUT_MINUTES) || 15,
    otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 10
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "CareCore HMS <no-reply@carecore.local>"
  }
}
