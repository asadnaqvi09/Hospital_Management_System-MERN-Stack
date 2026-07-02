import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { env } from "../config/env.js"

export const hashPassword = (plainPassword) => {
  return bcrypt.hash(plainPassword, env.bcryptRounds)
}

export const verifyPassword = (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash)
}

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export const generateRandomToken = (byteLength = 48) => {
  return crypto.randomBytes(byteLength).toString("hex")
}

export const generateNumericOtp = (digits = 6) => {
  const max = 10 ** digits
  const value = crypto.randomInt(0, max)
  return value.toString().padStart(digits, "0")
}
