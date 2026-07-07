import { z } from "zod"
import { APPOINTMENT_STATUS } from "../../shared/constants/statuses.js"

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

export const bookAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid(),
    appointmentDate: z.string().date(),
    slotTime: z.string().regex(timePattern, "Invalid time format"),
    type: z.enum(["booked", "walk_in", "follow_up", "emergency"]).optional(),
    chiefComplaint: z.string().optional()
  })
})

export const listAppointmentsSchema = z.object({
  query: z.object({
    doctorId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    date: z.string().date().optional(),
    status: z.enum(Object.values(APPOINTMENT_STATUS)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const appointmentIdSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid()
  })
})

export const updateStatusSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(Object.values(APPOINTMENT_STATUS))
  })
})

export const rescheduleSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid()
  }),
  body: z.object({
    appointmentDate: z.string().date(),
    slotTime: z.string().regex(timePattern, "Invalid time format")
  })
})

export const queueSchema = z.object({
  query: z.object({
    date: z.string().date().optional()
  })
})
