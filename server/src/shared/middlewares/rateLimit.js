import rateLimit from "express-rate-limit"

const buildLimiter = (windowMinutes, maxRequests, code) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        code,
        message: "Too many requests, please try again later"
      })
    }
  })
}

export const authLimiter = buildLimiter(15, 20, "AUTH_RATE_LIMITED")

export const apiLimiter = buildLimiter(15, 300, "API_RATE_LIMITED")
