/**
 * Augments Express's Request interface so `req.userId` is available
 * after the authenticate middleware runs.
 */
import 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
