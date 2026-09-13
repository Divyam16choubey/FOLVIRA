/**
 * errorHandler.ts — global Express error handler.
 *
 * Never exposes stack traces or internal details in production.
 * Maps Mongoose/MongoDB errors to clean application-level responses.
 *
 * Phase 9 additions:
 * - Error correlation IDs for traceability (UUID v4 via crypto)
 * - Safe generic message for 500 errors in production
 * - SyntaxError handling for malformed JSON bodies
 * - Structured logging for server-side error details
 */
import { Request, Response, NextFunction } from 'express'
import { MongoServerError } from 'mongodb'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { env } from '../config/env'
import { logger } from '../config/logger'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  validationErrors?: string[]
}

export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500
  let message = err.message ?? 'An unexpected error occurred'

  // ── Malformed JSON body (SyntaxError from express.json()) ──────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400
    message = 'Invalid JSON in request body'
  }

  // ── Mongoose duplicate key (e.g. duplicate email) ──────────────────────────
  if (err instanceof MongoServerError && String(err.code) === '11000') {
    statusCode = 409
    message = 'An account with this email already exists'
  }

  // ── Mongoose validation errors ─────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    const messages = Object.values(err.errors).map((e) => e.message)
    message = messages[0] ?? 'Validation failed'
  }

  // ── Mongoose CastError (bad ObjectId etc.) ─────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = 'Invalid identifier format'
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid authentication token'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Authentication token has expired'
  }

  // ── Request entity too large ───────────────────────────────────────────────
  if (err.name === 'PayloadTooLargeError' || (err as { type?: string }).type === 'entity.too.large') {
    statusCode = 413
    message = 'Request body is too large'
  }

  // ── Phase 9: Error correlation ID for 500s ─────────────────────────────────
  let errorId: string | undefined
  if (statusCode >= 500) {
    errorId = crypto.randomUUID()
  }

  // ── Logging ────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    // Server errors: always log with full detail and error ID
    logger.error('Error', `[${errorId}] ${statusCode}: ${err.message}`, {
      errorId,
      statusCode,
      name: err.name,
      stack: err.stack,
    })
  } else if (env.isDevelopment || env.isTest) {
    // Client errors: log in development/test only for debugging
    logger.warn('Error', `${statusCode}: ${message}`)
  }

  // ── Phase 9: Sanitize 500 messages in production ───────────────────────────
  // Never expose internal error details (DB errors, provider errors, etc.) to clients.
  if (statusCode >= 500 && env.isProduction) {
    message = 'An unexpected error occurred. Please try again.'
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    // Error correlation ID for 500s — allows users to reference specific errors in support
    ...(errorId ? { errorId } : {}),
    // Only include stack trace in development
    ...(env.isDevelopment && statusCode >= 500 ? { stack: err.stack } : {}),
  })
}
