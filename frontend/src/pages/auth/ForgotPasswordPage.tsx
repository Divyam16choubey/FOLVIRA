/**
 * ForgotPasswordPage.tsx
 *
 * Always shows a success message after submit — prevents account enumeration
 * regardless of whether the email exists.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { FormField } from '../../components/auth/FormField'
import { Button } from '../../components/common/Button'
import { api, ApiError } from '../../lib/api'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    setEmailError('')

    const result = schema.safeParse({ email })
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Invalid email')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/api/auth/forgot-password', { email: result.data.email })
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your email.">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-control)] border border-pine/20 bg-[#edf4f1] px-4 py-4 text-sm leading-6 text-pine">
            If an account exists for <strong>{email}</strong>, a password reset
            link has been sent. The link expires in 1 hour.
          </div>
          <p className="text-sm leading-6 text-muted">
            Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            to="/login"
            className="text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            &larr; Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password."
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <div role="alert" className="rounded-[var(--radius-control)] border border-[#b83232]/30 bg-[#fdf1f1] px-4 py-3 text-sm text-[#b83232]">
            {serverError}
          </div>
        )}

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError('')
          }}
          error={emailError}
          disabled={isSubmitting}
          placeholder="you@example.com"
        />

        <Button
          type="submit"
          className="mt-1 w-full py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link
          to="/login"
          className="font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
