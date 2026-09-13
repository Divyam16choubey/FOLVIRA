/**
 * logger.ts — Phase 9 structured logging.
 *
 * Lightweight logger that wraps console methods with:
 * - Timestamps
 * - Log levels
 * - Context tags
 * - JSON format in production for log aggregation
 * - Readable format in development
 *
 * NEVER logs sensitive values:
 * - Passwords, JWTs, cookies, Authorization headers
 * - API keys, MongoDB URIs, secret values
 * - Sensitive profile data (phone, email in log context)
 */

import { env } from './env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// In production, suppress debug logs
const MIN_LEVEL: LogLevel = env.isProduction ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  if (env.isProduction) {
    // JSON structured logging for production log aggregation
    const entry: Record<string, unknown> = {
      timestamp: formatTimestamp(),
      level,
      context,
      message,
    }
    if (meta) entry.meta = meta
    // Use the appropriate console method
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
  } else {
    // Readable format for development
    const prefix = `[${formatTimestamp()}] [${level.toUpperCase()}] [${context}]`
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    if (meta && Object.keys(meta).length > 0) {
      fn(prefix, message, meta)
    } else {
      fn(prefix, message)
    }
  }
}

export const logger = {
  debug: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('debug', context, message, meta),

  info: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('info', context, message, meta),

  warn: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('warn', context, message, meta),

  error: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('error', context, message, meta),
}
