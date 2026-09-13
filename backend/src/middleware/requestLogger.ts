/**
 * requestLogger.ts — Phase 9 HTTP request logging middleware.
 *
 * Logs: method, route, status code, duration.
 * Skips: /health and /api/health to reduce noise.
 *
 * NEVER logs:
 * - Authorization headers
 * - Cookie values
 * - Request body fields containing passwords
 * - JWT tokens
 * - API keys
 */
import { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'

// Routes to skip logging (health checks are high-frequency, low-value)
const SKIP_ROUTES = new Set(['/health', '/api/health'])

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health check routes
  if (SKIP_ROUTES.has(req.path)) {
    next()
    return
  }

  const start = Date.now()

  // Hook into response finish event
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode

    // Use appropriate level based on status code
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

    logger[level]('HTTP', `${req.method} ${req.path} ${status} ${duration}ms`, {
      method: req.method,
      path: req.path,
      status,
      duration,
    })
  })

  next()
}
