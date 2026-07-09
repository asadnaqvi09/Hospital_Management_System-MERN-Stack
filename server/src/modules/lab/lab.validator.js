import { z } from "zod"
import { LAB_ORDER_STATUS } from "../../shared/constants/statuses.js"

export const createLabTestSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    category: z.string().max(60).optional(),
    unit: z.string().max(30).optional(),
    normalRange: z.string().max(80).optional(),
    criticalLow: z.number().optional().nullable(),
    criticalHigh: z.number().optional().nullable(),
    price: z.number().min(0).optional()
  })
})

export const labTestIdSchema = z.object({
  params: z.object({
    testId: z.string().uuid()
  })
})

export const updateLabTestSchema = z.object({
  params: z.object({
    testId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    category: z.string().max(60).optional(),
    unit: z.string().max(30).optional(),
    normalRange: z.string().max(80).optional(),
    criticalLow: z.number().optional().nullable(),
    criticalHigh: z.number().optional().nullable(),
    price: z.number().min(0).optional(),
    isActive: z.boolean().optional()
  })
})

export const listLabTestsSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    includeInactive: z.coerce.boolean().optional()
  })
})

export const createLabOrderSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid(),
    testIds: z.array(z.string().uuid()).min(1, "At least one test is required"),
    priority: z.enum(["routine", "urgent", "critical"]).optional()
  })
})

export const labOrderIdSchema = z.object({
  params: z.object({
    orderId: z.string().uuid()
  })
})

export const listLabOrdersSchema = z.object({
  query: z.object({
    patientId: z.string().uuid().optional(),
    consultationId: z.string().uuid().optional(),
    status: z.enum(Object.values(LAB_ORDER_STATUS)).optional(),
    priority: z.enum(["routine", "urgent", "critical"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const updateLabOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(Object.values(LAB_ORDER_STATUS))
  })
})

export const enterLabResultSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
    itemId: z.string().uuid()
  }),
  body: z.object({
    resultValue: z.string().max(100).optional(),
    resultNumeric: z.number().optional().nullable(),
    notes: z.string().optional()
  })
})
