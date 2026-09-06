import dns from 'node:dns'
import mongoose from 'mongoose'

import { env } from './env'

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
})

    isConnected = true

    const host = conn.connection.host
    console.log(`[DB] Connected to MongoDB Atlas: ${host}`)
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err)

    // Exit the process so the issue is immediately visible in logs.
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false
  console.warn('[DB] MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB error:', err)
})