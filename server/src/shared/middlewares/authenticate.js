import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { AppError } from "../utils/AppError.js"

export const authenticate = (req, res, next) => {
  const authorizationHeader = req.headers.authorization

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication token missing", 401, "UNAUTHORIZED")
  }

  const token = authorizationHeader.slice(7)

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    throw new AppError("Invalid or expired access token", 401, "INVALID_TOKEN")
  }
}
