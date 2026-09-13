/**
 * db.ts — MongoDB connection management.
 *
 * Phase 9 additions:
 * - Exported disconnectDB() for graceful shutdown
 * - Connection timeout and heartbeat settings
 * - Structured logging
 */
import dns from 'node:dns'
import mongoose from 'mongoose'

import { env } from './env'
import { logger } from './logger'

// Use reliable public DNS resolvers for MongoDB Atlas SRV resolution.
// This works around the Node.js DNS resolver issue on the local machine.
dns.setServers(['8.8.8.8', '1.1.1.1'])

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) return

  mongoose.set('strictQuery', true)

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 10_000,
      heartbeatFrequencyMS: 30_000,
      // retryWrites and retryReads are enabled by default in MongoDB driver 4+
    })

    isConnected = true

    const host = conn.connection.host
    logger.info('DB', `Connected to MongoDB Atlas: ${host}`)
  } catch (err) {
    logger.error('DB', 'MongoDB connection failed', {
      error: err instanceof Error ? err.message : String(err),
    })

    // Exit the process so the issue is immediately visible in logs.
    process.exit(1)
  }
}

/**
 * Phase 9: Graceful disconnect for shutdown.
 */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) return

  try {
    await mongoose.disconnect()
    isConnected = false
  } catch (err) {
    logger.error('DB', 'MongoDB disconnect error', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false
  logger.warn('DB', 'MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  logger.error('DB', 'MongoDB error', {
    error: err instanceof Error ? err.message : String(err),
  })
})