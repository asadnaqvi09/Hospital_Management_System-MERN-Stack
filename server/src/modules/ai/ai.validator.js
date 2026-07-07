import { z } from "zod"

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000)
})

export const symptomCheckSchema = z.object({
  body: z.object({
    messages: z.array(chatMessageSchema).min(1, "At least one message is required")
  })
})

export const sessionIdSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid()
  })
})

export const listSessionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})

export const historySummarySchema = z.object({
  body: z.object({
    patientId: z.string().uuid()
  })
})

export const patientIdParamSchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  })
})

const medicineCheckSchema = z.object({
  medicineName: z.string().min(1).max(120),
  genericName: z.string().max(120).optional(),
  dosage: z.string().max(50).optional(),
  frequency: z.string().max(50).optional()
})

export const drugInteractionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    medicines: z.array(medicineCheckSchema).min(1)
  })
})

export const appointmentIdParamSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid()
  })
})

export const batchNoShowSchema = z.object({
  body: z.object({
    daysAhead: z.coerce.number().int().min(1).max(30).optional()
  })
})
