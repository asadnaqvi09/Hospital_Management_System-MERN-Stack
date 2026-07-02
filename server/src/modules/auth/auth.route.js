import { Router } from "express"
import { validate } from "../../shared/middlewares/validate.js"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { authLimiter } from "../../shared/middlewares/rateLimit.js"
import {
  loginSchema,
  verifyTwoFactorSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enableTwoFactorSchema,
  revokeSessionSchema
} from "./auth.validator.js"
import {
  login,
  verifyTwoFactorLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  setupTwoFactor,
  enableTwoFactor,
  getCurrentUser,
  listSessions,
  revokeSession
} from "./auth.controller.js"

export const authRouter = Router()

authRouter.post("/login", authLimiter, validate(loginSchema), login)
authRouter.post("/2fa/verify", authLimiter, validate(verifyTwoFactorSchema), verifyTwoFactorLogin)
authRouter.post("/refresh", validate(refreshSchema), refresh)
authRouter.post("/logout", validate(logoutSchema), logout)
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword)
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword)

authRouter.get("/me", authenticate, getCurrentUser)
authRouter.post("/2fa/setup", authenticate, setupTwoFactor)
authRouter.post("/2fa/enable", authenticate, validate(enableTwoFactorSchema), enableTwoFactor)
authRouter.get("/sessions", authenticate, listSessions)
authRouter.delete("/sessions/:sessionId", authenticate, validate(revokeSessionSchema), revokeSession)
