import jwt from "jsonwebtoken"
import speakeasy from "speakeasy"
import qrcode from "qrcode"
import { env } from "../../shared/config/env.js"
// import { redis } from "../../shared/config/redis.js"
import { hashToken } from "../../shared/utils/hash.js"
import { AppError } from "../../shared/utils/AppError.js"
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshTokenById,
  findUserById
} from "./auth.model.js"

const loginAttemptsKey = (email) => `login:attempts:${email}`
const loginLockKey = (email) => `login:lock:${email}`
const passwordResetKey = (email) => `pwreset:${email}`

// In-memory fallback while Redis is disabled (lost on server restart)
const memoryStore = new Map()
const memoryExpiry = new Map()

const memoryGet = async (key) => {
  const expiresAt = memoryExpiry.get(key)
  if (expiresAt && Date.now() > expiresAt) {
    memoryStore.delete(key)
    memoryExpiry.delete(key)
    return null
  }
  return memoryStore.get(key) ?? null
}

const memorySet = async (key, value, ttlSeconds) => {
  memoryStore.set(key, value)
  if (ttlSeconds) {
    memoryExpiry.set(key, Date.now() + ttlSeconds * 1000)
  }
}

const memoryDel = async (key) => {
  memoryStore.delete(key)
  memoryExpiry.delete(key)
}

const memoryIncr = async (key) => {
  const next = Number(memoryStore.get(key) || 0) + 1
  memoryStore.set(key, String(next))
  return next
}

export const signAccessToken = (user) => {
  return jwt.sign({ role: user.role }, env.jwt.accessSecret, {
    subject: user.id,
    expiresIn: env.jwt.accessExpiresIn
  })
}

export const signRefreshToken = (user) => {
  return jwt.sign({ type: "refresh" }, env.jwt.refreshSecret, {
    subject: user.id,
    expiresIn: `${env.jwt.refreshTokenDays}d`
  })
}

export const signTwoFactorToken = (user) => {
  return jwt.sign({ purpose: "2fa" }, env.jwt.twoFactorSecret, {
    subject: user.id,
    expiresIn: env.jwt.twoFactorExpiresIn
  })
}

export const verifyTwoFactorToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.twoFactorSecret)
  } catch {
    throw new AppError("Invalid or expired two-factor token", 401, "INVALID_TWO_FACTOR_TOKEN")
  }
}

export const issueAuthTokens = async (user, req) => {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  const expiresAt = new Date(Date.now() + env.jwt.refreshTokenDays * 24 * 60 * 60 * 1000)

  await createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers["user-agent"] || null,
    ipAddress: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || null,
    expiresAt
  })

  return { accessToken, refreshToken }
}

export const rotateRefreshToken = async (rawToken, req) => {
  let payload
  try {
    payload = jwt.verify(rawToken, env.jwt.refreshSecret)
  } catch {
    throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN")
  }

  const storedToken = await findRefreshTokenByHash(hashToken(rawToken))
  if (!storedToken || storedToken.revoked_at) {
    throw new AppError("Refresh token has been revoked", 401, "REVOKED_REFRESH_TOKEN")
  }

  const user = await findUserById(payload.sub)
  if (!user || !user.is_active) {
    throw new AppError("User account is no longer active", 401, "USER_INACTIVE")
  }

  await revokeRefreshTokenById(storedToken.id)
  const tokens = await issueAuthTokens(user, req)
  return { user, tokens }
}

export const generateTwoFactorSetup = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `${env.appName} (${user.email})`,
    length: 20
  })
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url)
  return { base32Secret: secret.base32, otpauthUrl: secret.otpauth_url, qrCodeDataUrl }
}

export const verifyTotpCode = (base32Secret, code) => {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token: code,
    window: 1
  })
}

export const assertNotLockedOut = async (email) => {
  // const lock = await redis.get(loginLockKey(email))
  const lock = await memoryGet(loginLockKey(email))
  if (lock) {
    throw new AppError("Account temporarily locked due to failed login attempts", 429, "ACCOUNT_LOCKED")
  }
}

export const registerFailedLoginAttempt = async (email) => {
  // const attempts = await redis.incr(loginAttemptsKey(email))
  const attempts = await memoryIncr(loginAttemptsKey(email))
  if (attempts === 1) {
    // await redis.expire(loginAttemptsKey(email), env.security.lockoutMinutes * 60)
    await memorySet(loginAttemptsKey(email), String(attempts), env.security.lockoutMinutes * 60)
  }
  if (attempts >= env.security.maxLoginAttempts) {
    // await redis.set(loginLockKey(email), "1", "EX", env.security.lockoutMinutes * 60)
    // await redis.del(loginAttemptsKey(email))
    await memorySet(loginLockKey(email), "1", env.security.lockoutMinutes * 60)
    await memoryDel(loginAttemptsKey(email))
  }
}

export const clearLoginAttempts = async (email) => {
  // await redis.del(loginAttemptsKey(email))
  // await redis.del(loginLockKey(email))
  await memoryDel(loginAttemptsKey(email))
  await memoryDel(loginLockKey(email))
}

export const storePasswordResetOtp = async (email, otp) => {
  // await redis.set(passwordResetKey(email), otp, "EX", env.security.otpExpiryMinutes * 60)
  await memorySet(passwordResetKey(email), otp, env.security.otpExpiryMinutes * 60)
}

export const consumePasswordResetOtp = async (email, otp) => {
  // const storedOtp = await redis.get(passwordResetKey(email))
  const storedOtp = await memoryGet(passwordResetKey(email))
  if (!storedOtp || storedOtp !== otp) {
    return false
  }
  // await redis.del(passwordResetKey(email))
  await memoryDel(passwordResetKey(email))
  return true
}
