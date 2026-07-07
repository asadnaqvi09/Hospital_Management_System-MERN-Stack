import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { AppError } from "../../shared/utils/AppError.js"
import {
  listNotifications,
  countNotifications,
  countUnreadNotifications,
  findNotificationById,
  markNotificationRead,
  markAllNotificationsRead
} from "./notifications.model.js"

export const getNotifications = asyncHandler(async (req, res) => {
  const filters = { ...req.validated.query, userId: req.user.id }
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    listNotifications({ ...filters, limit, offset }),
    countNotifications(filters)
  ])

  return sendSuccess(res, {
    message: "Notifications retrieved successfully",
    data: { notifications },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await countUnreadNotifications(req.user.id)
  return sendSuccess(res, { message: "Unread count retrieved successfully", data: { count } })
})

export const markRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.validated.params
  const existing = await findNotificationById(notificationId)
  if (!existing) {
    throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND")
  }
  if (existing.user_id !== req.user.id) {
    throw new AppError("You can only update your own notifications", 403, "FORBIDDEN")
  }

  const notification = await markNotificationRead(notificationId, req.user.id)
  return sendSuccess(res, { message: "Notification marked as read", data: { notification } })
})

export const markAllRead = asyncHandler(async (req, res) => {
  const updated = await markAllNotificationsRead(req.user.id)
  return sendSuccess(res, { message: "All notifications marked as read", data: { updated } })
})
