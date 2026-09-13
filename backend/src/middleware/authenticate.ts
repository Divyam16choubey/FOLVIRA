/**
 * authenticate.ts — JWT authentication middleware.
 *
 * Reads the access token from the httpOnly cookie, verifies it,
 * and attaches req.userId for downstream handlers.
 * Returns 401 without leaking JWT implementation details.
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface JwtPayload {
  userId: string
  iat: number
  exp: number
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['access_token'] as string | undefined

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.userId = payload.userId
    next()
  } catch {
    // Do not expose whether the token was expired vs tampered
    res.status(401).json({ success: false, error: 'Invalid or expired session' })
  }
}
