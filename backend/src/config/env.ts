/**
 * env.ts — validates and exports all required environment variables.
 * The application fails loudly at startup if any required variable is missing.
 * Never import process.env directly elsewhere — always import from this module.
 *
 * Phase 9: Production-mode validation added.
 * - Rejects weak/default JWT secrets in production.
 * - Requires explicit FRONTEND_URL in production.
 * - Warns on missing email/AI config in production.
 * - Never logs secret values.
 */
import 'dotenv/config'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[FOLVIRA] Missing required environment variable: ${key}\n` +
        `  Copy backend/.env.example to backend/.env and fill in the values.`
    )
  }
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

// ─── Weak-secret blocklist ────────────────────────────────────────────────────
// These patterns are checked in production to reject placeholder or weak secrets.
const WEAK_JWT_PATTERNS = [
  'replace_with_',
  'your_secret',
  'changeme',
  'secret',
  'password',
  'jwt_secret',
  'example',
]

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '3001'), 10),

  // Database — required
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // JWT — required
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // App URL (used in email links and CORS)
  FRONTEND_URL: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  // Public origin (used in deployment docs and HSTS context)
  PUBLIC_ORIGIN: process.env['PUBLIC_ORIGIN'],

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
  get isTest() {
    return this.NODE_ENV === 'test'
  },
  get isEmailConfigured() {
    return !!(this.EMAIL_HOST && this.EMAIL_USER && this.EMAIL_PASS)
  },
  get isAIConfigured() {
    return !!(this.AI_API_KEY && this.AI_API_KEY.length > 0)
  },
} as const

// ─── Phase 9: Production-mode validation ──────────────────────────────────────
// Runs once at import time. Rejects unsafe defaults in production.
// Development and test environments are not affected.

function validateProductionConfig(): void {
  if (!env.isProduction) return

  const errors: string[] = []

  // JWT secret: must be at least 32 characters and not a known weak pattern
  if (env.JWT_SECRET.length < 32) {
    errors.push(
      'JWT_SECRET is too short for production (minimum 32 characters).'
    )
  }

  const lowerSecret = env.JWT_SECRET.toLowerCase()
  for (const pattern of WEAK_JWT_PATTERNS) {
    if (lowerSecret.includes(pattern)) {
      errors.push(
        'JWT_SECRET appears to be a placeholder or weak default. ' +
          'Generate a strong random secret for production.'
      )
      break
    }
  }

  // FRONTEND_URL: must not use localhost in production
  if (
    env.FRONTEND_URL.includes('localhost') ||
    env.FRONTEND_URL.includes('127.0.0.1')
  ) {
    errors.push(
      'FRONTEND_URL must not reference localhost in production. ' +
        'Set it to the deployed frontend origin (e.g. https://folvira.co).'
    )
  }

  // MONGODB_URI: must not use localhost in production
  if (
    env.MONGODB_URI.includes('localhost') ||
    env.MONGODB_URI.includes('127.0.0.1')
  ) {
    errors.push(
      'MONGODB_URI must not reference localhost in production. ' +
        'Use a managed database (e.g. MongoDB Atlas).'
    )
  }

  // Fail fast with all errors — never log the actual secret values
  if (errors.length > 0) {
    throw new Error(
      `[FOLVIRA] Production configuration errors:\n` +
        errors.map((e) => `  ✗ ${e}`).join('\n') +
        '\n\n  Fix the above issues in backend/.env before starting in production mode.'
    )
  }

  // Non-blocking warnings for optional services
  if (!env.isEmailConfigured) {
    console.warn(
      '[Config] ⚠ Email provider not configured in production. ' +
        'Verification and reset emails will not be sent.'
    )
  }

  if (!env.isAIConfigured) {
    console.warn(
      '[Config] ⚠ AI provider not configured in production. ' +
        'AI endpoints will return configuration errors.'
    )
  }
}

validateProductionConfig()
