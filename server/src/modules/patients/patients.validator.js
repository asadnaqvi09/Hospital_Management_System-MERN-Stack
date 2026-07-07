import { z } from "zod"

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name is required"),
    cnic: z.string().min(5).max(15).optional(),
    dateOfBirth: z.string().date().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    bloodGroup: z.string().max(5).optional(),
    phone: z.string().min(7).max(20),
    address: z.string().optional(),
    emergencyContactName: z.string().max(80).optional(),
    emergencyContactPhone: z.string().max(20).optional(),
    userId: z.string().uuid().optional()
  })
})

export const searchPatientsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const patientIdSchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  })
})

export const recordVitalsSchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  }),
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    admissionId: z.string().uuid().optional(),
    bpSystolic: z.number().int().min(0).max(400).optional(),
    bpDiastolic: z.number().int().min(0).max(300).optional(),
    heartRate: z.number().int().min(0).max(400).optional(),
    temperature: z.number().min(20).max(45).optional(),
    weightKg: z.number().min(0).max(500).optional(),
    heightCm: z.number().min(0).max(300).optional(),
    spo2: z.number().int().min(0).max(100).optional(),
    notes: z.string().optional()
  })
})

export const addAllergySchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  }),
  body: z.object({
    allergen: z.string().min(1, "Allergen is required"),
    reaction: z.string().optional(),
    severity: z.enum(["mild", "moderate", "severe"]).optional()
  })
})

export const allergyIdSchema = z.object({
  params: z.object({
    patientId: z.string().uuid(),
    allergyId: z.string().uuid()
  })
})

export const addConditionSchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  }),
  body: z.object({
    conditionName: z.string().min(1, "Condition name is required"),
    icdCode: z.string().max(20).optional(),
    diagnosedDate: z.string().date().optional(),
    status: z.enum(["active", "resolved", "chronic"]).optional(),
    notes: z.string().optional()
  })
})

export const updateConditionSchema = z.object({
  params: z.object({
    patientId: z.string().uuid(),
    conditionId: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(["active", "resolved", "chronic"]).optional(),
    notes: z.string().optional()
  })
})

export const uploadDocumentSchema = z.object({
  params: z.object({
    patientId: z.string().uuid()
  }),
  body: z.object({
    title: z.string().max(160).optional()
  })
})
