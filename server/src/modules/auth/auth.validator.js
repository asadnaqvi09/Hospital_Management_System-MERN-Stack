import { z } from "zod"

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required")
  })
})

export const verifyTwoFactorSchema = z.object({
  body: z.object({
    twoFactorToken: z.string().min(1, "Two-factor token is required"),
    code: z.string().min(6).max(6)
  })
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
})

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
})

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().min(6).max(6),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
  })
})

export const enableTwoFactorSchema = z.object({
  body: z.object({
    code: z.string().min(6).max(6)
  })
})

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid()
  })
})
