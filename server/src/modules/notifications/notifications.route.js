import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { validate } from "../../shared/middlewares/validate.js"
import { listNotificationsSchema, notificationIdSchema } from "./notifications.validator.js"
import { getNotifications, getUnreadCount, markRead, markAllRead } from "./notifications.controller.js"

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)

notificationsRouter.get("/unread-count", getUnreadCount)
notificationsRouter.patch("/read-all", markAllRead)
notificationsRouter.get("/", validate(listNotificationsSchema), getNotifications)
notificationsRouter.patch("/:notificationId/read", validate(notificationIdSchema), markRead)
