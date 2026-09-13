/**
 * email.service.ts — Nodemailer transporter + transactional email delivery.
 *
 * Implements:
 * - Lazy SMTP transporter creation with full SMTP env variable support:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 * - Safe SMTP verification with connection/auth failure logging
 * - Never crashes the backend if email configuration is missing or invalid
 * - Transparent dispatch status return (EmailResult) distinguishing sent vs skipped vs failed
 * - Zero credential leakage in logs, errors, or API responses
 * - Complete test isolation: supports mock transporter injection and configuration
 *   overrides to guarantee tests never send real emails or use real credentials
 */
import nodemailer, { Transporter } from 'nodemailer'
import { env } from '../config/env'
import { logger } from '../config/logger'

let transporter: Transporter | null = null
let configOverrideForTesting: boolean | null = null
let allowRealEmailsForTesting = false

export interface EmailResult {
  success: boolean
  skipped: boolean
  reason?: 'not_configured' | 'delivery_failed'
  messageId?: string
  error?: string
}

/** Allows tests to explicitly mock whether SMTP configuration is present */
export function setConfigOverrideForTesting(configured: boolean | null): void {
  configOverrideForTesting = configured
}

/** Allows unit tests to explicitly allow real SMTP (defaults to false for safety) */
export function setAllowRealEmailsForTesting(allow: boolean): void {
  allowRealEmailsForTesting = allow
}

/** Checks whether email service is configured (respecting test overrides) */
export function isEmailConfigured(): boolean {
  if (configOverrideForTesting !== null) {
    return configOverrideForTesting
  }
  return env.isEmailConfigured
}

/**
 * Returns or creates the Nodemailer transporter.
 * Returns null if SMTP is not configured.
 * In test environments, refuses to create a live external SMTP connection
 * unless a mock transporter has been injected via setTransporterForTesting.
 */
export function getTransporter(): Transporter | null {
  if (transporter) return transporter

  if (!isEmailConfigured()) {
    return null
  }

  // Safety guard: in test environment, never create a real SMTP transporter
  // unless a mock transporter was injected or explicitly allowed
  if ((env.isTest || process.env.NODE_ENV === 'test') && !allowRealEmailsForTesting) {
    logger.warn('Email', 'Blocked attempt to create real SMTP transporter in test environment')
    return null
  }

  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  })

  return transporter
}

/** Allows injecting a mock transporter for testing. */
export function setTransporterForTesting(custom: Transporter | null): void {
  transporter = custom
}

/** Resets cached transporter instance and test overrides. */
export function resetTransporter(): void {
  transporter = null
  configOverrideForTesting = null
}

/**
 * Safely verifies the SMTP transporter configuration.
 * Logs connection errors without crashing the backend process.
 * Never exposes credentials in logs.
 */
export async function verifyEmailTransporter(): Promise<boolean> {
  if (!isEmailConfigured() && !transporter) {
    logger.info(
      'Email',
      'SMTP not configured — transactional emails (verification, password reset) will be skipped'
    )
    return false
  }

  try {
    const transport = getTransporter()
    if (!transport) {
      logger.warn('Email', 'SMTP transporter could not be created from environment')
      return false
    }

    await transport.verify()
    logger.info('Email', 'SMTP transporter connected successfully and ready', {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
    })
    return true
  } catch (err) {
    logger.error('Email', 'SMTP transporter verification failed — emails may fail to send', {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Internal email dispatch function.
 * Catches delivery errors, logs safely, and returns EmailResult.
 */
async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!isEmailConfigured() && !transporter) {
    return {
      success: false,
      skipped: true,
      reason: 'not_configured',
    }
  }

  try {
    const transport = getTransporter()
    if (!transport) {
      return {
        success: false,
        skipped: true,
        reason: 'not_configured',
      }
    }

    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    logger.info('Email', `Email sent successfully to ${options.to} [${options.subject}]`, {
      messageId: info.messageId,
    })

    return {
      success: true,
      skipped: false,
      messageId: info.messageId,
    }
  } catch (err) {
    logger.error('Email', `Failed to send email to ${options.to} [${options.subject}]`, {
      error: err instanceof Error ? err.message : String(err),
    })

    return {
      success: false,
      skipped: false,
      reason: 'delivery_failed',
      error: 'Email delivery failed',
    }
  }
}

// ─── Transactional Email Templates ───────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<EmailResult> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`

  if (!isEmailConfigured() && !transporter) {
    if (env.isDevelopment || env.isTest) {
      logger.warn(
        'Email',
        `[DEV] SMTP not configured — verification email skipped for ${to}. Verification URL: ${verifyUrl}`
      )
    } else {
      logger.warn('Email', `SMTP not configured — verification email skipped for ${to}`)
    }
    return {
      success: false,
      skipped: true,
      reason: 'not_configured',
    }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18221e;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e4a40; margin-bottom: 8px;">FOLVIRA</h1>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify your email address</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thank you for creating a FOLVIRA account. Please verify your email address to get started.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}"
           style="background: #1e4a40; color: #ffffff; padding: 12px 24px;
                  border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
          Verify email address
        </a>
      </p>
      <p style="color: #59625c; font-size: 13px;">
        This link expires in 24 hours. If you did not create a FOLVIRA account, you can safely ignore this email.
      </p>
      <p style="color: #59625c; font-size: 12px;">
        If the button does not work, copy and paste this URL into your browser:<br/>
        <span style="color: #9d602d;">${verifyUrl}</span>
      </p>
    </div>
  `

  const text = `FOLVIRA — Verify your email\n\nHi ${name},\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`

  return sendEmail({
    to,
    subject: 'Verify your FOLVIRA email address',
    html,
    text,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<EmailResult> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`

  if (!isEmailConfigured() && !transporter) {
    if (env.isDevelopment || env.isTest) {
      logger.warn(
        'Email',
        `[DEV] SMTP not configured — password reset skipped for ${to}. Reset URL: ${resetUrl}`
      )
    } else {
      logger.warn('Email', `SMTP not configured — password reset skipped for ${to}`)
    }
    return {
      success: false,
      skipped: true,
      reason: 'not_configured',
    }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18221e;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e4a40; margin-bottom: 8px;">FOLVIRA</h1>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Reset your password</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your FOLVIRA password.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background: #1e4a40; color: #ffffff; padding: 12px 24px;
                  border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="color: #59625c; font-size: 13px;">
        This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #59625c; font-size: 12px;">
        If the button does not work, copy and paste this URL into your browser:<br/>
        <span style="color: #9d602d;">${resetUrl}</span>
      </p>
    </div>
  `

  const text = `FOLVIRA — Reset your password\n\nHi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`

  return sendEmail({
    to,
    subject: 'Reset your FOLVIRA password',
    html,
    text,
  })
}

/** Minimal HTML escaping to prevent XSS in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
