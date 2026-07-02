import { Router } from "express"
import { authRouter } from "./modules/auth/auth.route.js"
import { usersRouter } from "./modules/users/users.route.js"

export const apiRouter = Router()

apiRouter.use("/auth", authRouter)
apiRouter.use("/users", usersRouter)
