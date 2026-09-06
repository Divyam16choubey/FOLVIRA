/**
 * User.ts — Mongoose User schema.
 *
 * Security notes:
 * - passwordHash has select: false — never returned by default queries.
 * - Email is normalized (lowercased + trimmed) before save.
 * - Verification and reset tokens are stored as SHA-256 hashes.
 *   Raw tokens are only ever sent via email — never stored.
 * - Schema is designed to support future phases (profile ref, OAuth providers).
 */
import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  isEmailVerified: boolean
  emailVerificationTokenHash?: string
  emailVerificationTokenExpires?: Date
  passwordResetTokenHash?: string
  passwordResetTokenExpires?: Date
  accountStatus: 'active' | 'suspended'
  // Future phases: profileId, oauthProviders, etc.
  createdAt: Date
  updatedAt: Date

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>
  setEmailVerificationToken(): string   // returns raw token
  setPasswordResetToken(): string       // returns raw token
  clearEmailVerificationToken(): void
  clearPasswordResetToken(): void
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: The unique email index is already declared via `unique: true` on the
// email field above. We do NOT add a duplicate schema.index() call here —
// Mongoose would warn about the duplicate and it wastes an index slot.

// TTL-style: We don't use MongoDB TTL here since we need to keep the user
// document alive — expiry is checked in code. We do index these for fast lookup.
userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true })
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true })

// ─── Static methods ───────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() })
}

// ─── Instance methods ─────────────────────────────────────────────────────────

/** Compare a plaintext candidate password against the stored hash. */
userSchema.methods.comparePassword = function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

/** Generate a raw email-verification token, store its hash, return the raw. */
userSchema.methods.setEmailVerificationToken = function (this: IUser): string {
  const rawToken = crypto.randomBytes(32).toString('hex')
  this.emailVerificationTokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')
  // 24-hour expiry
  this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return rawToken
}

/** Generate a raw password-reset token, store its hash, return the raw. */
userSchema.methods.setPasswordResetToken = function (this: IUser): string {
  const rawToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetTokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')
  // 1-hour expiry
  this.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
  return rawToken
}

userSchema.methods.clearEmailVerificationToken = function (this: IUser): void {
  this.emailVerificationTokenHash = undefined
  this.emailVerificationTokenExpires = undefined
}

userSchema.methods.clearPasswordResetToken = function (this: IUser): void {
  this.passwordResetTokenHash = undefined
  this.passwordResetTokenExpires = undefined
}

export const User = mongoose.model<IUser, IUserModel>('User', userSchema)
