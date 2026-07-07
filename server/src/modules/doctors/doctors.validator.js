import { z } from "zod"

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

export const createDoctorSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    specialization: z.string().min(2, "Specialization is required"),
    qualification: z.string().optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
    licenseNumber: z.string().max(50).optional(),
    consultationFee: z.number().min(0).optional(),
    department: z.string().max(80).optional(),
    bio: z.string().optional()
  })
})

export const doctorIdSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid()
  })
})

export const listDoctorsSchema = z.object({
  query: z.object({
    specialization: z.string().optional(),
    search: z.string().optional()
  })
})

export const updateDoctorSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid()
  }),
  body: z.object({
    specialization: z.string().min(2).optional(),
    qualification: z.string().optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
    consultationFee: z.number().min(0).optional(),
    department: z.string().max(80).optional(),
    bio: z.string().optional()
  })
})

export const setScheduleSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid()
  }),
  body: z.object({
    schedule: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(timePattern, "Invalid time format"),
          endTime: z.string().regex(timePattern, "Invalid time format"),
          slotDuration: z.number().int().min(5).max(120).optional(),
          maxPatients: z.number().int().min(1).max(200).optional()
        })
      )
      .min(1, "At least one schedule entry is required")
  })
})

export const addLeaveSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid()
  }),
  body: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().optional()
  })
})

export const leaveIdSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid(),
    leaveId: z.string().uuid()
  })
})

export const availabilitySchema = z.object({
  params: z.object({
    doctorId: z.string().uuid()
  }),
  query: z.object({
    date: z.string().date()
  })
})
