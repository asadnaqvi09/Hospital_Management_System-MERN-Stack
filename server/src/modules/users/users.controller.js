import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import { hashPassword } from "../../shared/utils/hash.js"
import { writeAuditLog } from "../../shared/middlewares/audit.js"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { revokeAllRefreshTokensForUser } from "../auth/auth.model.js"
import {
  insertUser,
  findUserById,
  findUserByEmail,
  listUsers,
  countUsers,
  updateUserProfile,
  setUserActiveState,
  updateUserRole
} from "./users.model.js"

export const createUser = asyncHandler(async (req, res) => {
  const { email, phone, password, fullName, role } = req.validated.body

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409, "EMAIL_ALREADY_EXISTS")
  }

  const passwordHash = await hashPassword(password)
  const createdUser = await insertUser({ email, phone, passwordHash, fullName, role })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: "user",
    entityId: createdUser.id,
    after: createdUser,
    req
  })

  return sendSuccess(res, {
    message: "User created successfully",
    statusCode: 201,
    data: { user: createdUser }
  })
})

export const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.validated.query
  const page = req.validated.query.page || 1
  const limit = req.validated.query.limit || 20
  const offset = (page - 1) * limit

  const [users, total] = await Promise.all([
    listUsers({ role, search, limit, offset }),
    countUsers({ role, search })
  ])

  return sendSuccess(res, {
    message: "Users retrieved successfully",
    data: { users },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params
  const user = await findUserById(userId)

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  return sendSuccess(res, { message: "User retrieved successfully", data: { user } })
})

export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params
  const { fullName, phone } = req.validated.body

  const existingUser = await findUserById(userId)
  if (!existingUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  const updatedUser = await updateUserProfile(userId, { fullName, phone })

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "user",
    entityId: userId,
    before: existingUser,
    after: updatedUser,
    req
  })

  return sendSuccess(res, { message: "User updated successfully", data: { user: updatedUser } })
})

export const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params

  if (userId === req.user.id) {
    throw new AppError("You cannot deactivate your own account", 400, "SELF_DEACTIVATION_FORBIDDEN")
  }

  const existingUser = await findUserById(userId)
  if (!existingUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  const updatedUser = await setUserActiveState(userId, false)
  await revokeAllRefreshTokensForUser(userId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "user_deactivation",
    entityId: userId,
    before: existingUser,
    after: updatedUser,
    req
  })

  return sendSuccess(res, { message: "User deactivated successfully", data: { user: updatedUser } })
})

export const activateUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params

  const existingUser = await findUserById(userId)
  if (!existingUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  const updatedUser = await setUserActiveState(userId, true)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "user_activation",
    entityId: userId,
    before: existingUser,
    after: updatedUser,
    req
  })

  return sendSuccess(res, { message: "User activated successfully", data: { user: updatedUser } })
})

export const changeUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params
  const { role } = req.validated.body

  const existingUser = await findUserById(userId)
  if (!existingUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND")
  }

  const updatedUser = await updateUserRole(userId, role)
  await revokeAllRefreshTokensForUser(userId)

  await writeAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: "user_role",
    entityId: userId,
    before: existingUser,
    after: updatedUser,
    req
  })

  return sendSuccess(res, { message: "User role updated successfully", data: { user: updatedUser } })
})
