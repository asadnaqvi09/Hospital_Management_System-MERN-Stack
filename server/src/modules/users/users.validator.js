import { z } from "zod"
import { ROLE_VALUES } from "../../shared/constants/roles.js"

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    phone: z.string().min(7).max(20).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().min(2, "Full name is required"),
    role: z.enum(ROLE_VALUES)
  })
})

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(ROLE_VALUES).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  })
})

export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(7).max(20).optional()
  })
})

export const updateRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  }),
  body: z.object({
    role: z.enum(ROLE_VALUES)
  })
})
