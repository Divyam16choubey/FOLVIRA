/**
 * email.service.ts — Nodemailer transporter + email send functions.
 *
 * The transporter is created lazily — only when email is actually needed.
 * If email is not configured, a clear warning is logged (no silent failures).
 * Email credentials NEVER appear in API responses or logs.
 */
import nodemailer, { Transporter } from 'nodemailer'
import { env } from '../config/env'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  if (!env.isEmailConfigured) {
    throw new Error(
      '[Email] Email provider is not configured. ' +
        'Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env'
    )
  }

  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  })

  return transporter
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = getTransporter()
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18221e;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e4a40; margin-bottom: 8px;">FOLVIRA</h1>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify your email address</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thank you for creating a FOLVIRA account. Please verify your email address to get started.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}"
           style="background: #1e4a40; color: #ffffff; padding: 12px 24px;
                  border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 14px;">
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

  await sendEmail({ to, subject: 'Verify your FOLVIRA email address', html, text })
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18221e;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e4a40; margin-bottom: 8px;">FOLVIRA</h1>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Reset your password</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your FOLVIRA password.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background: #1e4a40; color: #ffffff; padding: 12px 24px;
                  border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 14px;">
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

  await sendEmail({ to, subject: 'Reset your FOLVIRA password', html, text })
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
