/**
 * auth.routes.ts — /api/auth/* router.
 *
 * Applies:
 *   - Input validation (express-validator)
 *   - Rate limiting (per-route)
 *   - authenticate middleware on protected endpoints
 *   - Controller handlers
 */
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/authenticate'
import { authLimiter, sensitiveActionLimiter } from '../middleware/rateLimiter'
import {
  signup,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from '../controllers/auth.controller'

const router = Router()

// ─── Validation rule sets ──────────────────────────────────────────────────────

const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('passwordConfirm')
    .custom((value: string, { req }) => {
      if (value !== (req.body as { password: string }).password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
]

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

const emailTokenValidation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required')
    .isHexadecimal()
    .withMessage('Invalid token format')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token length'),
]

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
]

const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isHexadecimal()
    .withMessage('Invalid token format')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token length'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('passwordConfirm')
    .custom((value: string, { req }) => {
      if (value !== (req.body as { password: string }).password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public auth routes (rate limited)
router.post('/signup', authLimiter, signupValidation, signup)
router.post('/login', authLimiter, loginValidation, login)
router.post('/logout', logout)

// Session check — used on every app load by the frontend
router.get('/me', authenticate, getMe)

// Email verification
router.post('/verify-email', sensitiveActionLimiter, emailTokenValidation, verifyEmail)
router.post('/resend-verification', sensitiveActionLimiter, authenticate, resendVerification)

// Password reset — validation runs BEFORE rate limiter so malformed requests
// are rejected cheaply without consuming rate limit slots
router.post('/forgot-password', forgotPasswordValidation, authLimiter, forgotPassword)
router.post('/reset-password', sensitiveActionLimiter, resetPasswordValidation, resetPassword)

// Account management (requires auth)
router.delete('/account', authenticate, deleteAccount)

export default router
