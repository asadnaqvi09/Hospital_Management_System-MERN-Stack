import { z } from "zod"

export const globalPatientSearchSchema = z.object({
  query: z.object({
    q: z.string().min(2).max(120),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})
