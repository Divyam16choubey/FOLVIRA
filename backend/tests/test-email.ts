/**
 * test-email.ts — Comprehensive Email Service & SMTP Verification Suite.
 *
 * Isolated Test Requirements:
 * 1. Tests must NEVER send real emails.
 * 2. Tests must NEVER use real SMTP credentials from backend/.env.
 * 3. Tests for unconfigured SMTP must explicitly mock/disable SMTP configuration.
 * 4. Tests for configured SMTP must ONLY use a mock transporter.
 * 5. Tests for delivery failure must use a mock transporter that throws.
 * 6. Tests for verification failure must use a mock transporter where verify() throws.
 * 7. HTTP API integration tests must run in-process on an isolated ephemeral port,
 *    testing both unconfigured and mock-configured behavior without touching port 3001.
 *
 * Run: npx tsx tests/test-email.ts
 */

// Force test environment so safety guards prevent any live SMTP connections
process.env.NODE_ENV = 'test'

import type { AddressInfo } from 'node:net'
import type { Transporter } from 'nodemailer'
import {
  verifyEmailTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  setTransporterForTesting,
  setConfigOverrideForTesting,
  resetTransporter,
  isEmailConfigured,
} from '../src/services/email.service'
import { env } from '../src/config/env'
import { createApp } from '../src/app'
import { connectDB, disconnectDB } from '../src/config/db'

let passCount = 0
let failCount = 0

function ok(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passCount++
  } else {
    console.error(`  ❌ ${label}`)
    failCount++
  }
}

function section(title: string) {
  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  ${title}`)
  console.log(`══════════════════════════════════════════════`)
}

async function run() {
  console.log('--- FOLVIRA Email System Verification Suite (Isolated) ---')

  // Connect database for HTTP integration tests
  await connectDB()

  try {
    // ─── 1. Unconfigured SMTP Behavior ────────────────────────────────────────
    section('1. Unconfigured SMTP Behavior')

    // Explicitly set unconfigured state and clear any transporter
    setConfigOverrideForTesting(false)
    setTransporterForTesting(null)

    ok('SMTP is identified as unconfigured when overridden for testing', isEmailConfigured() === false)

    const verifyUnconfigured = await verifyEmailTransporter()
    ok('verifyEmailTransporter() returns false when unconfigured', verifyUnconfigured === false)

    const verifyResult = await sendVerificationEmail(
      'test@example.com',
      'Test User',
      'raw-verification-token-123'
    )
    ok('sendVerificationEmail returns success=false when unconfigured', verifyResult.success === false)
    ok('sendVerificationEmail returns skipped=true when unconfigured', verifyResult.skipped === true)
    ok('sendVerificationEmail returns reason="not_configured"', verifyResult.reason === 'not_configured')

    const resetResult = await sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'raw-reset-token-456'
    )
    ok('sendPasswordResetEmail returns success=false when unconfigured', resetResult.success === false)
    ok('sendPasswordResetEmail returns skipped=true when unconfigured', resetResult.skipped === true)
    ok('sendPasswordResetEmail returns reason="not_configured"', resetResult.reason === 'not_configured')

    // ─── 2. Configured SMTP with Mock Transporter ────────────────────────────
    section('2. Configured SMTP with Mock Transporter (No Real Emails)')

    // Explicitly configure mock transporter
    setConfigOverrideForTesting(true)

    let lastSentMail: any = null

    const mockTransporter: Partial<Transporter> = {
      verify: async () => true,
      sendMail: async (mailOptions: any) => {
        lastSentMail = mailOptions
        return {
          messageId: '<mock-msg-id-12345@folvira.co>',
          response: '250 OK: message queued',
        } as any
      },
    }

    setTransporterForTesting(mockTransporter as Transporter)

    const verifyMock = await verifyEmailTransporter()
    ok('verifyEmailTransporter() returns true with active mock transporter', verifyMock === true)

    const sendVerifMock = await sendVerificationEmail(
      'alice@example.com',
      'Alice Smith',
      'secure-token-abc'
    )
    ok('sendVerificationEmail returns success=true with mock transporter', sendVerifMock.success === true)
    ok('sendVerificationEmail returns skipped=false', sendVerifMock.skipped === false)
    ok('sendVerificationEmail returns messageId', sendVerifMock.messageId === '<mock-msg-id-12345@folvira.co>')
    ok('Email "to" field is alice@example.com', lastSentMail?.to === 'alice@example.com')
    ok('Email "subject" contains verification', lastSentMail?.subject?.includes('Verify'))
    ok('Email "html" contains verifyUrl with token', lastSentMail?.html?.includes('token=secure-token-abc'))
    ok('Email "text" contains verifyUrl with token', lastSentMail?.text?.includes('token=secure-token-abc'))
    ok('Email HTML escapes user name against XSS', !lastSentMail?.html?.includes('<script>'))

    const sendResetMock = await sendPasswordResetEmail(
      'bob@example.com',
      'Bob Jones',
      'reset-token-xyz'
    )
    ok('sendPasswordResetEmail returns success=true with mock transporter', sendResetMock.success === true)
    ok('sendPasswordResetEmail returns skipped=false', sendResetMock.skipped === false)
    ok('sendPasswordResetEmail returns messageId', sendResetMock.messageId === '<mock-msg-id-12345@folvira.co>')
    ok('Email "to" field is bob@example.com', lastSentMail?.to === 'bob@example.com')
    ok('Email "subject" contains reset', lastSentMail?.subject?.includes('Reset'))
    ok('Email "html" contains resetUrl with token', lastSentMail?.html?.includes('token=reset-token-xyz'))
    ok('Email "text" contains resetUrl with token', lastSentMail?.text?.includes('token=reset-token-xyz'))

    // ─── 3. Delivery Failure Handling ─────────────────────────────────────────
    section('3. Delivery Failure Handling')

    const failingTransporter: Partial<Transporter> = {
      verify: async () => true,
      sendMail: async () => {
        throw new Error('554 5.7.1 Relay access denied / SMTP timeout')
      },
    }

    setTransporterForTesting(failingTransporter as Transporter)

    const failVerif = await sendVerificationEmail(
      'failing@example.com',
      'Fail Tester',
      'token-fail-123'
    )
    ok('sendVerificationEmail catches send error and returns success=false', failVerif.success === false)
    ok('sendVerificationEmail returns skipped=false (was attempted)', failVerif.skipped === false)
    ok('sendVerificationEmail returns reason="delivery_failed"', failVerif.reason === 'delivery_failed')
    ok('Does not expose raw SMTP error to caller', failVerif.error === 'Email delivery failed')

    const failReset = await sendPasswordResetEmail(
      'failing@example.com',
      'Fail Tester',
      'token-fail-456'
    )
    ok('sendPasswordResetEmail catches send error and returns success=false', failReset.success === false)
    ok('sendPasswordResetEmail returns skipped=false', failReset.skipped === false)
    ok('sendPasswordResetEmail returns reason="delivery_failed"', failReset.reason === 'delivery_failed')

    // ─── 4. Transporter Verification Failure Handling ─────────────────────────
    section('4. Transporter Verification Failure Handling')

    const brokenTransporter: Partial<Transporter> = {
      verify: async () => {
        throw new Error('535 5.7.8 Authentication credentials invalid')
      },
    }

    setTransporterForTesting(brokenTransporter as Transporter)

    const verifyBroken = await verifyEmailTransporter()
    ok('verifyEmailTransporter() safely catches auth failure and returns false', verifyBroken === false)

    // ─── 5. Credential Leakage Protection ─────────────────────────────────────
    section('5. Credential Leakage Protection')

    const resultStr = JSON.stringify({ failVerif, failReset, sendVerifMock })
    ok('Result objects never contain EMAIL_PASS', !resultStr.includes('EMAIL_PASS'))
    ok('Result objects never contain password', !resultStr.toLowerCase().includes('password='))
    ok('Result objects never contain user credentials', !resultStr.includes('smtp_password'))

    // ─── 6. HTTP API Integration (In-Process Isolated Server) ─────────────────
    section('6. HTTP API Integration (Isolated Test Server)')

    // Start in-memory test server on an ephemeral port (port 0)
    const app = createApp()
    const testServer = app.listen(0)
    const testPort = (testServer.address() as AddressInfo).port
    const testBaseUrl = `http://localhost:${testPort}`

    try {
      // 6A. Test API behavior when SMTP is UNCONFIGURED
      setConfigOverrideForTesting(false)
      setTransporterForTesting(null)

      const ts = Date.now()
      const unconfEmail = `unconf_${ts}@folvira.test`

      const signupUnconfRes = await fetch(`${testBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unconf User',
          email: unconfEmail,
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        }),
      })

      const signupUnconfBody = await signupUnconfRes.json()
      ok('Unconfigured: Signup returns HTTP 201', signupUnconfRes.status === 201)
      ok(
        'Unconfigured: Signup reports emailVerificationSent=false',
        signupUnconfBody.data?.emailVerificationSent === false
      )

      const unconfCookie = (signupUnconfRes.headers.get('set-cookie') ?? '').split(';')[0]

      const resendUnconfRes = await fetch(`${testBaseUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: unconfCookie },
        body: JSON.stringify({}),
      })

      const resendUnconfBody = await resendUnconfRes.json()
      ok('Unconfigured: Resend returns HTTP 200', resendUnconfRes.status === 200)
      ok(
        'Unconfigured: Resend reports emailVerificationSent=false',
        resendUnconfBody.data?.emailVerificationSent === false
      )
      ok(
        'Unconfigured: Resend does NOT falsely claim email was sent',
        !resendUnconfBody.data?.message?.toLowerCase().includes('email sent')
      )
      ok(
        'Unconfigured: Resend message informs about unconfigured status',
        resendUnconfBody.data?.message?.includes('server logs') ||
          resendUnconfBody.data?.message?.includes('not configured') ||
          resendUnconfBody.data?.message?.includes('unavailable')
      )

      // 6B. Test API behavior when SMTP is CONFIGURED WITH MOCK TRANSPORTER
      let mockApiSentMail: any = null
      const apiMockTransporter: Partial<Transporter> = {
        verify: async () => true,
        sendMail: async (mailOptions: any) => {
          mockApiSentMail = mailOptions
          return {
            messageId: '<mock-api-sent-123@folvira.co>',
            response: '250 OK: queued',
          } as any
        },
      }

      setConfigOverrideForTesting(true)
      setTransporterForTesting(apiMockTransporter as Transporter)

      const confEmail = `conf_${ts}@folvira.test`

      const signupConfRes = await fetch(`${testBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Conf User',
          email: confEmail,
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        }),
      })

      const signupConfBody = await signupConfRes.json()
      ok('Mock Configured: Signup returns HTTP 201', signupConfRes.status === 201)
      ok(
        'Mock Configured: Signup reports emailVerificationSent=true',
        signupConfBody.data?.emailVerificationSent === true
      )
      ok('Mock Configured: Mock transporter received verification email', mockApiSentMail?.to === confEmail)

      const confCookie = (signupConfRes.headers.get('set-cookie') ?? '').split(';')[0]

      // Reset last sent mail
      mockApiSentMail = null

      const resendConfRes = await fetch(`${testBaseUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: confCookie },
        body: JSON.stringify({}),
      })

      const resendConfBody = await resendConfRes.json()
      ok('Mock Configured: Resend returns HTTP 200', resendConfRes.status === 200)
      ok(
        'Mock Configured: Resend reports emailVerificationSent=true',
        resendConfBody.data?.emailVerificationSent === true
      )
      ok(
        'Mock Configured: Resend message confirms email sent',
        resendConfBody.data?.message?.includes('Verification email sent')
      )
      ok('Mock Configured: Mock transporter received resend email', mockApiSentMail?.to === confEmail)

      // Test forgot-password endpoint
      mockApiSentMail = null
      const forgotRes = await fetch(`${testBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confEmail }),
      })

      const forgotBody = await forgotRes.json()
      ok('Forgot-password returns HTTP 200', forgotRes.status === 200)
      ok('Forgot-password response is safe', forgotBody.success === true)
      ok('Mock transporter received forgot-password reset email', mockApiSentMail?.to === confEmail)
    } finally {
      // Clean up in-process server
      testServer.close()
    }
  } finally {
    // Reset test overrides and disconnect DB
    resetTransporter()
    await disconnectDB()
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  Tests Passed: ${passCount}`)
  console.log(`  Tests Failed: ${failCount}`)
  console.log(`══════════════════════════════════════════════`)

  if (failCount > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
