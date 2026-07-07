import { z } from "zod"
import { PRESCRIPTION_STATUS } from "../../shared/constants/statuses.js"

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required").max(120),
  genericName: z.string().max(120).optional(),
  dosage: z.string().max(50).optional(),
  frequency: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  instructions: z.string().optional(),
  quantity: z.number().int().min(1).max(9999).optional()
})

export const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid(),
    notes: z.string().optional(),
    items: z.array(prescriptionItemSchema).min(1, "At least one prescription item is required")
  })
})

export const prescriptionIdSchema = z.object({
  params: z.object({
    prescriptionId: z.string().uuid()
  })
})

export const listPrescriptionsSchema = z.object({
  query: z.object({
    patientId: z.string().uuid().optional(),
    consultationId: z.string().uuid().optional(),
    status: z.enum(Object.values(PRESCRIPTION_STATUS)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const pendingPrescriptionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

const dispenseItemSchema = z.object({
  prescriptionItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(9999),
  medicineId: z.string().uuid().optional()
})

export const dispensePrescriptionSchema = z.object({
  params: z.object({
    prescriptionId: z.string().uuid()
  }),
  body: z.object({
    items: z.array(dispenseItemSchema).optional(),
    notes: z.string().optional()
  })
})
