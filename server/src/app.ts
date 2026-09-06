/**
 * app.ts — Express application factory.
 *
 * Separated from index.ts so the app can be imported for testing
 * without starting the HTTP server.
 */
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { generalLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import aiRoutes from './routes/ai.routes'

export function createApp() {
  const app = express()

  // ── Security headers (helmet sets 12+ headers) ─────────────────────────────
  app.use(
    helmet({
      // Allow same-origin iframe for development tools
      contentSecurityPolicy: env.isProduction ? undefined : false,
    })
  )

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Only the configured FRONTEND_URL is allowed — prevents cross-origin abuse
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true, // Required: allows cookies to be sent cross-origin
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '16kb' }))
  app.use(express.urlencoded({ extended: true, limit: '16kb' }))

  // ── Cookie parsing ────────────────────────────────────────────────────────
  app.use(cookieParser())

  // ── General rate limiter (100 req/15min per IP on all /api routes) ────────
  app.use('/api', generalLimiter)

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/ai', aiRoutes)

  // ── Health check (for deployment probes — no sensitive info) ─────────────
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' })
  })

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorHandler)

  return app
}
