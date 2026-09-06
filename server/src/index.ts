/**
 * index.ts — Server entry point.
 *
 * 1. Validates environment variables (fails fast if misconfigured)
 * 2. Connects to MongoDB Atlas
 * 3. Starts the HTTP server
 *
 * Import order matters: env must be imported first so dotenv runs
 * before any other module reads process.env.
 */
import { env } from './config/env'
import { connectDB } from './config/db'
import { createApp } from './app'

async function start() {
  // Connect to MongoDB Atlas — exits process if connection fails
  await connectDB()

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`[Server] FOLVIRA API running on http://localhost:${env.PORT}`)
    console.log(`[Server] Environment: ${env.NODE_ENV}`)
    if (!env.isEmailConfigured) {
      console.warn(
        '[Server] Email provider not configured. ' +
          'Verification and reset emails will not be sent. ' +
          'Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in server/.env'
      )
    }
  })
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err)
  process.exit(1)
})
