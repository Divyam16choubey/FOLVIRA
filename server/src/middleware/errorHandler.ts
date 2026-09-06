/**
 * errorHandler.ts — global Express error handler.
 *
 * Never exposes stack traces or internal details in production.
 * Maps Mongoose/MongoDB errors to clean application-level responses.
 */
import { Request, Response, NextFunction } from 'express'
import { MongoServerError } from 'mongodb'
import mongoose from 'mongoose'
import { env } from '../config/env'

export interface AppError extends Error {
  statusCode?: number
  code?: string
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

  // In development, log the full error for debugging.
  if (env.isDevelopment) {
    console.error(`[Error] ${statusCode}:`, err)
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    // Only include stack trace in development
    ...(env.isDevelopment && statusCode >= 500 ? { stack: err.stack } : {}),
  })
}
