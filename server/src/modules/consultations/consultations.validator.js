import { z } from "zod"
import { DIAGNOSIS_TYPES } from "../../shared/constants/statuses.js"

const diagnosisSchema = z.object({
  icdCode: z.string().max(20).optional(),
  description: z.string().min(1, "Description is required"),
  type: z.enum(DIAGNOSIS_TYPES).optional()
})

export const openConsultationSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid(),
    chiefComplaint: z.string().optional()
  })
})

export const consultationIdSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid()
  })
})

export const appointmentIdParamSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid()
  })
})

export const updateConsultationSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid()
  }),
  body: z.object({
    chiefComplaint: z.string().optional(),
    hopi: z.string().optional(),
    examination: z.string().optional(),
    diagnosisText: z.string().optional(),
    managementPlan: z.string().optional(),
    followUpDate: z.string().date().optional().nullable(),
    diagnoses: z.array(diagnosisSchema).optional()
  })
})

export const listConsultationsSchema = z.object({
  query: z.object({
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    fromDate: z.string().date().optional(),
    toDate: z.string().date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})
