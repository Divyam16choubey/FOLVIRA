/**
 * rateLimiter.ts — express-rate-limit configurations.
 *
 * Auth endpoints (login, signup, forgot-password) are limited aggressively
 * to slow brute-force and credential-stuffing attacks.
 * General API has a more permissive limit.
 */
import rateLimit from 'express-rate-limit'

const commonOptions = {
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
}

/** Applied to login, signup, forgot-password: 10 attempts per 15 minutes per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  ...commonOptions,
})

/** Applied to resend-verification and reset-password: 5 per 15 minutes */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  ...commonOptions,
})

/** Applied to all /api routes as a general backstop: 100 per 15 minutes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  ...commonOptions,
})
