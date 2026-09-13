/**
 * auth.controller.ts — Thin HTTP handlers for /api/auth/* routes.
 *
 * Each handler:
 *   1. Reads validated inputs from req.body / req.params / req.cookies
 *   2. Calls the appropriate service function
 *   3. Sets cookies / sends safe JSON responses
 *   4. Calls next(err) on failure so the global error handler responds
 *
 * No business logic lives here — only HTTP translation.
 */
import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { User } from '../models/User'
import {
  createUser,
  validateCredentials,
  findUserByVerificationToken,
  findUserByResetToken,
  resetUserPassword,
  signAccessToken,
  cookieOptions,
  clearCookieOptions,
  toSafeUser,
} from '../services/auth.service'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service'
import { createError } from '../middleware/errorHandler'
import { env } from '../config/env'

/** Reads express-validator results and throws a 400 if invalid. */
function assertValidation(req: Request): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array()[0]?.msg ?? 'Validation failed'
    throw createError(message, 400)
  }
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const { name, email, password } = req.body as {
      name: string
      email: string
      password: string
    }

    const { user, verificationToken } = await createUser({ name, email, password })

    // Send verification email (returns EmailResult: success, skipped, or failed)
    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken)

    // Issue access token cookie
    const token = signAccessToken(user._id.toString())
    res.cookie('access_token', token, cookieOptions())

    res.status(201).json({
      success: true,
      data: {
        user: toSafeUser(user),
        emailVerificationSent: emailResult.success,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const { email, password } = req.body as { email: string; password: string }

    const user = await validateCredentials({ email, password })

    if (!user) {
      // Same message for wrong email and wrong password — prevents enumeration
      throw createError('Invalid email or password', 401)
    }

    const token = signAccessToken(user._id.toString())
    res.cookie('access_token', token, cookieOptions())

    res.json({
      success: true,
      data: { user: toSafeUser(user) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Clear the cookie server-side — this is real logout, not a client-side flag
    res.clearCookie('access_token', clearCookieOptions())

    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.userId is set by the authenticate middleware
    const user = await User.findById(req.userId)

    if (!user || user.accountStatus !== 'active') {
      // Clear stale cookie
      res.clearCookie('access_token', clearCookieOptions())
      throw createError('User not found', 401)
    }

    res.json({ success: true, data: { user: toSafeUser(user) } })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/verify-email ─────────────────────────────────────────────
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { token } = req.body as { token: string }

    const user = await findUserByVerificationToken(token)

    if (!user) {
      throw createError(
        'Verification link is invalid or has expired. Please request a new one.',
        400
      )
    }

    user.isEmailVerified = true
    user.clearEmailVerificationToken()
    await user.save()

    res.json({
      success: true,
      data: { message: 'Email verified successfully' },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/resend-verification ──────────────────────────────────────
export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.userId set by authenticate middleware (must be logged in)
    const user = await User.findById(req.userId).select(
      '+emailVerificationTokenHash +emailVerificationTokenExpires'
    )

    if (!user) {
      throw createError('User not found', 404)
    }

    if (user.isEmailVerified) {
      throw createError('Email is already verified', 400)
    }

    // Invalidate old token, generate new one
    const verificationToken = user.setEmailVerificationToken()
    await user.save()

    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken)

    let message = 'Verification email sent. Please check your inbox.'
    if (!emailResult.success) {
      if (emailResult.skipped) {
        message = env.isDevelopment
          ? 'Email service is not configured. In development, check server logs for the verification link.'
          : 'Email service is currently unavailable. Please try again later.'
      } else {
        message = 'Failed to deliver verification email. Please try again later.'
      }
    }

    res.json({
      success: true,
      data: {
        message,
        emailVerificationSent: emailResult.success,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { email } = req.body as { email: string }

    // ALWAYS return the same response — never reveal whether the email exists
    // or whether any error occurred (prevents account enumeration)
    const SAFE_RESPONSE = {
      success: true,
      data: {
        message:
          'If an account exists for that email, a password reset link has been sent.',
      },
    }

    try {
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      }).select('+passwordResetTokenHash +passwordResetTokenExpires')

      if (user) {
        const resetToken = user.setPasswordResetToken()
        await user.save()

        await sendPasswordResetEmail(user.email, user.name, resetToken)
      }
    } catch (dbErr) {
      // Swallow DB/email errors — never expose them to prevent enumeration
      // Log in development for debugging, but always return the safe response
      if (env.isDevelopment) {
        console.warn('[Auth] forgot-password internal error (suppressed):', dbErr)
      }
    }

    res.json(SAFE_RESPONSE)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { token, password } = req.body as { token: string; password: string }

    const user = await findUserByResetToken(token)

    if (!user) {
      throw createError(
        'Password reset link is invalid or has expired. Please request a new one.',
        400
      )
    }

    await resetUserPassword(user, password)

    // Invalidate the current session — force re-login with new password
    res.clearCookie('access_token', clearCookieOptions())

    res.json({
      success: true,
      data: { message: 'Password reset successfully. Please log in.' },
    })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/auth/account ─────────────────────────────────────────────────
export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.userId is set by authenticate middleware
    const user = await User.findById(req.userId)

    if (!user) {
      throw createError('User not found', 404)
    }

    await User.findByIdAndDelete(req.userId)

    // Invalidate session immediately
    res.clearCookie('access_token', clearCookieOptions())

    res.json({
      success: true,
      data: { message: 'Account deleted successfully' },
    })
  } catch (err) {
    next(err)
  }
}
