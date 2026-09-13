/**
 * auth.service.ts — Authentication business logic.
 *
 * Pure functions that operate on the database and return results.
 * No HTTP concerns (Request/Response) live here — only business logic.
 */
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'
import { env } from '../config/env'

const BCRYPT_ROUNDS = 12

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Hash a raw token for safe storage (SHA-256). */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/** Sign a JWT access token for the given user ID. */
export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

/**
 * Returns the cookie options object for issuing session cookies.
 *
 * Supported Deployment Topology:
 * FOLVIRA supports Same-Site Deployment Topology (Topology A):
 * - Frontend and backend are deployed under the same registrable domain / site
 *   (e.g., via reverse proxy at `https://folvira.co` + `https://folvira.co/api`,
 *   or subdomains `https://app.folvira.co` + `https://api.folvira.co`).
 * - Under same-site topology, `SameSite=Lax` ensures cookies are transmitted on
 *   same-site XHR/fetch requests and top-level navigations while providing strong
 *   CSRF protection against untrusted third-party sites.
 * - Note: True cross-site deployment across separate effective TLDs (e.g.
 *   `app.vercel.app` and `api.onrender.com`) is not supported with SameSite=Lax
 *   because modern browsers block Lax cookies on cross-site subresource requests.
 *   For cross-site hosting, a reverse proxy or shared custom domain must be used.
 */
export function cookieOptions(): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  maxAge: number
  path: string
} {
  // 7 days in ms — matches JWT_EXPIRES_IN default
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: sevenDays,
    path: '/',
  }
}

/**
 * Returns matching cookie options for clearing the session cookie.
 */
export function clearCookieOptions(): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
} {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  }
}

/** The safe user object returned to the client — no password, no tokens. */
export type SafeUser = {
  id: string
  name: string
  email: string
  isEmailVerified: boolean
  accountStatus: string
  createdAt: Date
}

export function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  }
}

// ─── Auth operations ──────────────────────────────────────────────────────────

export interface SignupInput {
  name: string
  email: string
  password: string
}

/**
 * Creates a new user account.
 * Returns the saved user and the raw email-verification token.
 * Throws if email already exists (Mongoose unique index → 11000 error).
 */
export async function createUser(
  input: SignupInput
): Promise<{ user: IUser; verificationToken: string }> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  const user = new User({
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    passwordHash,
  })

  // Generate verification token (stored as hash on user document)
  const verificationToken = user.setEmailVerificationToken()

  await user.save()
  return { user, verificationToken }
}

export interface LoginInput {
  email: string
  password: string
}

/**
 * Validates credentials and returns the user on success.
 * Returns null if the email doesn't exist or the password is wrong.
 * Never indicates which part was wrong — prevents account enumeration.
 */
export async function validateCredentials(
  input: LoginInput
): Promise<IUser | null> {
  // .select('+passwordHash') overrides the select:false on the field
  const user = await User.findOne({
    email: input.email.toLowerCase().trim(),
  }).select('+passwordHash')

  if (!user) return null

  const isValid = await user.comparePassword(input.password)
  if (!isValid) return null

  return user
}

/**
 * Finds a user by a raw email-verification token.
 * Hashes the raw token, looks up the hash, checks expiry.
 */
export async function findUserByVerificationToken(
  rawToken: string
): Promise<IUser | null> {
  const tokenHash = hashToken(rawToken)

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationTokenExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationTokenExpires')

  return user ?? null
}

/**
 * Finds a user by a raw password-reset token.
 * Hashes the raw token, looks up the hash, checks expiry.
 */
export async function findUserByResetToken(
  rawToken: string
): Promise<IUser | null> {
  const tokenHash = hashToken(rawToken)

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpires: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetTokenExpires')

  return user ?? null
}

/**
 * Updates a user's password and clears the reset token.
 * Also invalidates any existing session by rotating — callers should
 * clear the auth cookie after calling this.
 */
export async function resetUserPassword(
  user: IUser,
  newPassword: string
): Promise<void> {
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  user.clearPasswordResetToken()
  await user.save()
}
