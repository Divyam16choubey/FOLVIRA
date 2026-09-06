/**
 * env.ts — validates and exports all required environment variables.
 * The application fails loudly at startup if any required variable is missing.
 * Never import process.env directly elsewhere — always import from this module.
 */
import 'dotenv/config'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[FOLVIRA] Missing required environment variable: ${key}\n` +
        `  Copy server/.env.example to server/.env and fill in the values.`
    )
  }
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '3001'), 10),

  // Database — required
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // JWT — required
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // App URL (used in email links)
  FRONTEND_URL: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  // Email — optional at startup (verified before sending)
  EMAIL_FROM: optionalEnv('EMAIL_FROM', 'FOLVIRA <noreply@folvira.co>'),
  EMAIL_HOST: process.env['EMAIL_HOST'],
  EMAIL_PORT: parseInt(optionalEnv('EMAIL_PORT', '587'), 10),
  EMAIL_USER: process.env['EMAIL_USER'],
  EMAIL_PASS: process.env['EMAIL_PASS'],

  // AI provider — optional at startup (graceful degradation when not set)
  // Keys are read here once at import time. Never logged or returned to clients.
  AI_PROVIDER: optionalEnv('AI_PROVIDER', 'openai'),
  AI_API_KEY: process.env['AI_API_KEY'],
  AI_MODEL: optionalEnv('AI_MODEL', 'gpt-4o-mini'),

  get isProduction() {
    return this.NODE_ENV === 'production'
  },
  get isDevelopment() {
    return this.NODE_ENV === 'development'
  },
  get isEmailConfigured() {
    return !!(this.EMAIL_HOST && this.EMAIL_USER && this.EMAIL_PASS)
  },
  get isAIConfigured() {
    return !!(this.AI_API_KEY && this.AI_API_KEY.length > 0)
  },
} as const
