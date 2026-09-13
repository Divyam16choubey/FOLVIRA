/**
 * app.ts — Express application factory.
 *
 * Separated from index.ts so the app can be imported for testing
 * without starting the HTTP server.
 *
 * Phase 9 additions:
 * - NoSQL injection sanitization middleware
 * - Request logging middleware
 * - Enhanced health check (database status, environment, timestamp)
 * - Root-level /health for load balancer compatibility
 * - HPP protection (duplicate parameter handling)
 */
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { env } from './config/env'
import { generalLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { sanitizeInput } from './middleware/sanitize'
import authRoutes from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import aiRoutes from './routes/ai.routes'
import portfolioRoutes from './routes/portfolio.routes'
import publicRoutes from './routes/public.routes'

// ── Explicit Content Security Policy (CSP) ─────────────────────────────────
// Whitelists only the resources genuinely required by FOLVIRA.
// Does NOT allow wildcard *, unsafe-eval, or arbitrary external scripts.
export const productionCspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  connectSrc: [
    "'self'",
    ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
    ...(env.PUBLIC_ORIGIN ? [env.PUBLIC_ORIGIN] : []),
  ].filter(Boolean),
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  ...(env.isProduction ? { upgradeInsecureRequests: [] } : {}),
}

export function createApp() {
  const app = express()

  // ── Disable x-powered-by (defense-in-depth, also handled by helmet) ────────
  app.disable('x-powered-by')

  // ── Security headers (helmet sets 12+ headers including explicit CSP) ─────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: productionCspDirectives,
      },
    })
  )

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Only the configured FRONTEND_URL is allowed — prevents cross-origin abuse
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true, // Required: allows cookies to be sent cross-origin
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '16kb' }))
  app.use(express.urlencoded({ extended: true, limit: '16kb' }))

  // ── Cookie parsing ────────────────────────────────────────────────────────
  app.use(cookieParser())

  // ── Phase 9: NoSQL injection sanitization ──────────────────────────────────
  app.use(sanitizeInput)

  // ── Phase 9: Request logging (skips /health) ──────────────────────────────
  app.use(requestLogger)

  // ── Phase 9: Root-level health check (exempt from /api rate limiting) ─────
  // Designed for container orchestrators, load balancers, and reverse proxy probes.
  const healthHandler: express.RequestHandler = (_req, res) => {
    const dbState = mongoose.connection.readyState
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected'
    const status = dbState === 1 ? 'ok' : 'degraded'

    res.status(status === 'ok' ? 200 : 503).json({
      success: true,
      data: {
        status,
        database: dbStatus,
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    })
  }
  app.get('/health', healthHandler)

  // ── Phase 7: Public routes — no authentication required (uses publicReadLimiter) ─
  app.use('/api/public', publicRoutes)

  // ── General rate limiter (100 req/15min per IP on authenticated /api routes) ──
  app.use('/api', generalLimiter)

  // ── Phase 2/9: API-level health check alias (subject to /api rate limiter) ──
  app.get('/api/health', healthHandler)

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/portfolios', portfolioRoutes)

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' })
  })

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorHandler)

  return app
}
