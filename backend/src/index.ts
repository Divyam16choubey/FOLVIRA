/**
 * index.ts — Server entry point.
 *
 * 1. Validates environment variables (fails fast if misconfigured)
 * 2. Connects to MongoDB Atlas
 * 3. Starts the HTTP server
 * 4. Phase 9: Implements graceful shutdown on SIGTERM/SIGINT
 *
 * Import order matters: env must be imported first so dotenv runs
 * before any other module reads process.env.
 */
import http from 'node:http'
import { env } from './config/env'
import { logger } from './config/logger'
import { connectDB, disconnectDB } from './config/db'
import { createApp } from './app'

let server: http.Server | null = null
let isShuttingDown = false

async function start() {
  // Connect to MongoDB Atlas — exits process if connection fails
  await connectDB()

  const app = createApp()

  server = app.listen(env.PORT, () => {
    logger.info('Server', `FOLVIRA API running on http://localhost:${env.PORT}`)
    logger.info('Server', `Environment: ${env.NODE_ENV}`)
    if (!env.isEmailConfigured) {
      logger.warn(
        'Server',
        'Email provider not configured. Verification and reset emails will not be sent. ' +
          'Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in backend/.env'
      )
    }
  })
}

// ─── Phase 9: Graceful shutdown ──────────────────────────────────────────────
// Ensures HTTP server stops accepting connections and MongoDB disconnects
// cleanly on SIGTERM (container orchestrators) and SIGINT (Ctrl+C).

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn('Shutdown', `Duplicate ${signal} received — already shutting down`)
    return
  }
  isShuttingDown = true

  logger.info('Shutdown', `${signal} received — starting graceful shutdown`)

  // Force exit after timeout to prevent hanging
  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown', 'Graceful shutdown timed out (10s) — forcing exit')
    process.exit(1)
  }, 10_000)
  // Don't let the timer keep the process alive
  forceExitTimer.unref()

  try {
    // 1. Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      logger.info('Shutdown', 'HTTP server closed')
    }

    // 2. Close MongoDB connection
    await disconnectDB()
    logger.info('Shutdown', 'MongoDB connection closed')

    // 3. Clean exit
    logger.info('Shutdown', 'Graceful shutdown complete')
    process.exit(0)
  } catch (err) {
    logger.error('Shutdown', 'Error during graceful shutdown', {
      error: err instanceof Error ? err.message : String(err),
    })
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start().catch((err) => {
  logger.error('Server', 'Failed to start', {
    error: err instanceof Error ? err.message : String(err),
  })
  process.exit(1)
})
