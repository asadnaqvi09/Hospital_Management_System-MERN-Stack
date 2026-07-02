import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createUserSchema,
  listUsersSchema,
  userIdSchema,
  updateUserSchema,
  updateRoleSchema
} from "./users.validator.js"
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  changeUserRole
} from "./users.controller.js"

export const usersRouter = Router()

usersRouter.use(authenticate, requireRole(ROLES.ADMIN))

usersRouter.post("/", validate(createUserSchema), createUser)
usersRouter.get("/", validate(listUsersSchema), getUsers)
usersRouter.get("/:userId", validate(userIdSchema), getUserById)
usersRouter.patch("/:userId", validate(updateUserSchema), updateUser)
usersRouter.patch("/:userId/role", validate(updateRoleSchema), changeUserRole)
usersRouter.patch("/:userId/deactivate", validate(userIdSchema), deactivateUser)
usersRouter.patch("/:userId/activate", validate(userIdSchema), activateUser)
