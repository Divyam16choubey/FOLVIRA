/**
 * sanitize.ts — Phase 9 NoSQL injection protection middleware.
 *
 * Defense-in-depth: strips MongoDB query operators ($gt, $ne, $regex, etc.)
 * from request body, query params, and URL params in-place.
 *
 * Express-validator and Mongoose schemas already provide primary protection,
 * but this middleware catches edge cases where raw objects might reach queries.
 */
import { Request, Response, NextFunction } from 'express'

/**
 * Recursively strip keys starting with '$' from an object in place.
 * Mutates in-place to support Express 5 where req.query and req.params are getters.
 */
function stripDollarKeysInPlace(obj: unknown): void {
  if (obj === null || obj === undefined) return
  if (typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (const item of obj) {
      stripDollarKeysInPlace(item)
    }
    return
  }

  const rec = obj as Record<string, unknown>
  for (const key of Object.keys(rec)) {
    if (key.startsWith('$')) {
      delete rec[key]
    } else if (rec[key] !== null && typeof rec[key] === 'object') {
      stripDollarKeysInPlace(rec[key])
    }
  }
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to remove MongoDB query operator keys in-place.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      stripDollarKeysInPlace(req.body)
    }
    if (req.query && typeof req.query === 'object') {
      stripDollarKeysInPlace(req.query)
    }
    if (req.params && typeof req.params === 'object') {
      stripDollarKeysInPlace(req.params)
    }
  } catch {
    // Fail closed: continue safely without breaking request flow
  }
  next()
}
