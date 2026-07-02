import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { verifyPassword, hashPassword, hashToken, generateNumericOtp } from "../../shared/utils/hash.js"
import { sendEmail } from "../../shared/utils/mailer.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { TWO_FACTOR_ROLES } from "../../shared/constants/roles.js"
import {
  findUserByEmail,
  findUserById,
  findUserWithSecretById,
  setUserTwoFactorSecret,
  enableUserTwoFactor,
  updateUserPasswordByEmail,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokenByHash,
  listActiveSessionsForUser,
  revokeSessionForUser
} from "./auth.model.js"
import {
  issueAuthTokens,
  rotateRefreshToken,
  signTwoFactorToken,
  verifyTwoFactorToken,
  generateTwoFactorSetup,
  verifyTotpCode,
  assertNotLockedOut,
  registerFailedLoginAttempt,
  clearLoginAttempts,
  storePasswordResetOtp,
  consumePasswordResetOtp
} from "./auth.service.js"

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  fullName: user.full_name,
  role: user.role,
  isActive: user.is_active,
  twoFactorEnabled: user.two_fa_enabled
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body

  await assertNotLockedOut(email)

  const user = await findUserByEmail(email)
  if (!user) {
    await registerFailedLoginAttempt(email)
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS")
  }

  if (!user.is_active) {
    throw new AppError("Your account has been deactivated", 403, "ACCOUNT_DEACTIVATED")
  }

  const passwordMatches = await verifyPassword(password, user.password_hash)
  if (!passwordMatches) {
    await registerFailedLoginAttempt(email)
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS")
  }

  await clearLoginAttempts(email)

  if (user.two_fa_enabled) {
    const twoFactorToken = signTwoFactorToken(user)
    return sendSuccess(res, {
      message: "Two-factor authentication required",
      data: { requiresTwoFactor: true, twoFactorToken }
    })
  }

  const tokens = await issueAuthTokens(user, req)
  await writeAuditLog({ userId: user.id, userRole: user.role, action: AUDIT_ACTIONS.LOGIN, entityType: "user", entityId: user.id, req })

  const mustSetupTwoFactor = TWO_FACTOR_ROLES.includes(user.role) && !user.two_fa_enabled

  return sendSuccess(res, {
    message: "Login successful",
    data: { user: toPublicUser(user), tokens, mustSetupTwoFactor }
  })
})

export const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { twoFactorToken, code } = req.validated.body

  const payload = verifyTwoFactorToken(twoFactorToken)
  if (payload.purpose !== "2fa") {
    throw new AppError("Invalid two-factor token", 401, "INVALID_TWO_FACTOR_TOKEN")
  }

  const user = await findUserWithSecretById(payload.sub)
  if (!user || !user.is_active) {
    throw new AppError("User account is no longer active", 401, "USER_INACTIVE")
  }

  if (!user.two_fa_secret) {
    throw new AppError("Two-factor authentication is not configured", 400, "TWO_FACTOR_NOT_CONFIGURED")
  }

  const codeIsValid = verifyTotpCode(user.two_fa_secret, code)
  if (!codeIsValid) {
    throw new AppError("Invalid two-factor code", 401, "INVALID_TWO_FACTOR_CODE")
  }

  const tokens = await issueAuthTokens(user, req)
  await writeAuditLog({ userId: user.id, userRole: user.role, action: AUDIT_ACTIONS.LOGIN, entityType: "user", entityId: user.id, req })

  const fullUser = await findUserById(user.id)
  return sendSuccess(res, {
    message: "Login successful",
    data: { user: toPublicUser(fullUser), tokens }
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body
  const { user, tokens } = await rotateRefreshToken(refreshToken, req)

  return sendSuccess(res, {
    message: "Token refreshed successfully",
    data: { user: toPublicUser(user), tokens }
  })
})

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body
  const revoked = await revokeRefreshTokenByHash(hashToken(refreshToken))

  if (revoked) {
    await writeAuditLog({ userId: req.user?.id || null, userRole: req.user?.role || null, action: AUDIT_ACTIONS.LOGOUT, entityType: "user", entityId: req.user?.id || null, req })
  }

  return sendSuccess(res, { message: "Logout successful" })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body
  const user = await findUserByEmail(email)

  if (user && user.is_active) {
    const otp = generateNumericOtp(6)
    await storePasswordResetOtp(email, otp)
    await sendEmail({
      to: email,
      subject: "Your CareCore HMS password reset code",
      text: `Your password reset code is ${otp}. It expires in a few minutes.`
    })
  }

  return sendSuccess(res, {
    message: "If an account exists for this email, a reset code has been sent"
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.validated.body

  const otpIsValid = await consumePasswordResetOtp(email, otp)
  if (!otpIsValid) {
    throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET_CODE")
  }

  const passwordHash = await hashPassword(newPassword)
  const updatedUser = await updateUserPasswordByEmail(email, passwordHash)
  if (!updatedUser) {
    throw new AppError("Unable to reset password for this account", 404, "USER_NOT_FOUND")
  }

  await revokeAllRefreshTokensForUser(updatedUser.id)
  await writeAuditLog({ userId: updatedUser.id, action: AUDIT_ACTIONS.UPDATE, entityType: "user_password", entityId: updatedUser.id, req })

  return sendSuccess(res, { message: "Password has been reset successfully" })
})

export const setupTwoFactor = asyncHandler(async (req, res) => {
  const user = await findUserWithSecretById(req.user.id)
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  const setup = await generateTwoFactorSetup(user)
  await setUserTwoFactorSecret(user.id, setup.base32Secret)

  return sendSuccess(res, {
    message: "Scan the QR code with your authenticator app, then confirm with a code",
    data: { otpauthUrl: setup.otpauthUrl, qrCodeDataUrl: setup.qrCodeDataUrl }
  })
})

export const enableTwoFactor = asyncHandler(async (req, res) => {
  const { code } = req.validated.body
  const user = await findUserWithSecretById(req.user.id)

  if (!user || !user.two_fa_secret) {
    throw new AppError("Start two-factor setup before enabling it", 400, "TWO_FACTOR_NOT_STARTED")
  }

  const codeIsValid = verifyTotpCode(user.two_fa_secret, code)
  if (!codeIsValid) {
    throw new AppError("Invalid two-factor code", 401, "INVALID_TWO_FACTOR_CODE")
  }

  await enableUserTwoFactor(user.id)
  await writeAuditLog({ userId: user.id, userRole: user.role, action: AUDIT_ACTIONS.UPDATE, entityType: "user_two_factor", entityId: user.id, req })

  return sendSuccess(res, { message: "Two-factor authentication enabled" })
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id)
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  return sendSuccess(res, { message: "Current user profile", data: { user: toPublicUser(user) } })
})

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await listActiveSessionsForUser(req.user.id)
  return sendSuccess(res, { message: "Active sessions", data: { sessions } })
})

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.validated.params
  const revoked = await revokeSessionForUser(sessionId, req.user.id)

  if (!revoked) {
    throw new AppError("Session not found or already revoked", 404, "SESSION_NOT_FOUND")
  }

  return sendSuccess(res, { message: "Session revoked successfully" })
})
