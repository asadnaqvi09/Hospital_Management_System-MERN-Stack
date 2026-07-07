import { z } from "zod"

export const listNotificationsSchema = z.object({
  query: z.object({
    isRead: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const notificationIdSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid()
  })
})
