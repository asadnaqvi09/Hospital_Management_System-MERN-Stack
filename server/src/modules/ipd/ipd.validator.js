import { z } from "zod"
import { ADMISSION_STATUS, NURSING_SHIFTS, ROOM_STATUS } from "../../shared/constants/statuses.js"

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1).max(20),
    ward: z.string().min(1).max(50),
    floor: z.number().int().min(0).max(100).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    dailyRate: z.number().min(0).optional()
  })
})

export const roomIdSchema = z.object({
  params: z.object({
    roomId: z.string().uuid()
  })
})

export const updateRoomSchema = z.object({
  params: z.object({
    roomId: z.string().uuid()
  }),
  body: z.object({
    ward: z.string().min(1).max(50).optional(),
    floor: z.number().int().min(0).max(100).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    dailyRate: z.number().min(0).optional(),
    status: z.enum(Object.values(ROOM_STATUS)).optional()
  })
})

export const listRoomsSchema = z.object({
  query: z.object({
    ward: z.string().optional(),
    status: z.enum(Object.values(ROOM_STATUS)).optional()
  })
})

export const createAdmissionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    roomId: z.string().uuid(),
    roomVersion: z.number().int().min(0),
    admittingDoctorId: z.string().uuid().optional(),
    expectedDays: z.number().int().min(1).max(365).optional(),
    admissionReason: z.string().optional()
  })
})

export const admissionIdSchema = z.object({
  params: z.object({
    admissionId: z.string().uuid()
  })
})

export const listAdmissionsSchema = z.object({
  query: z.object({
    patientId: z.string().uuid().optional(),
    status: z.enum(Object.values(ADMISSION_STATUS)).optional(),
    ward: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const addNursingNoteSchema = z.object({
  params: z.object({
    admissionId: z.string().uuid()
  }),
  body: z.object({
    shift: z.enum(NURSING_SHIFTS),
    note: z.string().min(1)
  })
})

export const dischargeAdmissionSchema = z.object({
  params: z.object({
    admissionId: z.string().uuid()
  }),
  body: z.object({
    dischargeSummary: z.string().optional(),
    dischargeMeds: z.string().optional(),
    followUpNotes: z.string().optional()
  })
})
