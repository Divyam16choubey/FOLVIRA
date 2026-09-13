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

/** Applied to login, signup, forgot-password: 10 attempts per 15 minutes per IP in production (100 in dev/test) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 10 : 100,
  ...commonOptions,
})

/** Applied to resend-verification and reset-password: 5 per 15 minutes in production (50 in dev/test) */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 5 : 50,
  ...commonOptions,
})

/** Applied to all /api routes as a general backstop: 100 per 15 minutes in production (1000 in dev/test) */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 100 : 1000,
  ...commonOptions,
})

/**
 * Applied to AI operations (analyze, improve, summarise).
 * AI calls are expensive — 20 per hour per IP is permissive for development
 * but limits accidental/abusive runaway usage.
 * In test environment the limit is relaxed to 200 to prevent test exhaustion.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: process.env['NODE_ENV'] === 'production' ? 20 : 500,
  ...commonOptions,
  message: {
    success: false,
    error: 'Too many AI requests. Please wait before running another analysis.',
  },
})

/**
 * Applied to suggestion accept/reject (lighter operations — no AI call).
 * More permissive: 60 per 15 minutes.
 */
export const suggestionActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  ...commonOptions,
})

/**
 * Phase 6: Applied to portfolio publish operations.
 * Publishing is expensive (profile resolution, snapshot creation).
 * 10 publishes per hour per IP in production (200 in dev/test).
 */
export const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env['NODE_ENV'] === 'production' ? 10 : 200,
  ...commonOptions,
  message: {
    success: false,
    error: 'Too many publish requests. Please wait before publishing again.',
  },
})

/**
 * Phase 7: Applied to public portfolio read endpoints.
 * Public portfolios can be shared widely — this limit is generous.
 * 300 requests per 15 minutes per IP covers normal browsing/sharing (2000 in dev/test).
 * Distributed rate limiting (Redis) can replace this in a future phase.
 * NOTE: Do NOT apply the authenticated generalLimiter to public routes.
 */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again shortly.',
  },
})
