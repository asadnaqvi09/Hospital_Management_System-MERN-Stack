import { z } from "zod"
import { AUDIT_ACTIONS } from "../../shared/constants/statuses.js"
import { ROLE_VALUES } from "../../shared/constants/roles.js"

export const listAuditLogsSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    userRole: z.enum(ROLE_VALUES).optional(),
    action: z.enum(Object.values(AUDIT_ACTIONS)).optional(),
    entityType: z.string().max(50).optional(),
    entityId: z.string().uuid().optional(),
    fromDate: z.string().date().optional(),
    toDate: z.string().date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const auditIdSchema = z.object({
  params: z.object({
    auditId: z.string().uuid()
  })
})
