/**
 * ResetPasswordPage.tsx
 *
 * Reads the token from the URL query string (?token=...).
 * On success, clears the cookie server-side and redirects to login.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { FormField } from '../../components/auth/FormField'
import { Button } from '../../components/common/Button'
import { api, ApiError } from '../../lib/api'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })

type Fields = z.infer<typeof schema>
type FieldErrors = Partial<Record<keyof Fields, string>>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [fields, setFields] = useState<Fields>({ password: '', passwordConfirm: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // No token in URL — show a clear error
  if (!token) {
    return (
      <AuthLayout title="Invalid link.">
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-6 text-muted">
            This password reset link is missing a token. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            Request new reset link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name as keyof Fields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const result = schema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Fields
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/api/auth/reset-password', {
        token,
        password: result.data.password,
        passwordConfirm: result.data.passwordConfirm,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
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

  if (success) {
    return (
      <AuthLayout title="Password updated.">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-control)] border border-pine/20 bg-[#edf4f1] px-4 py-4 text-sm leading-6 text-pine">
            Your password has been reset successfully. Redirecting to sign in…
          </div>
          <Link
            to="/login"
            className="text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            Sign in now
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a new password."
      subtitle="Your new password must be at least 8 characters."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <div role="alert" className="rounded-[var(--radius-control)] border border-[#b83232]/30 bg-[#fdf1f1] px-4 py-3 text-sm text-[#b83232]">
            {serverError}
            {serverError.toLowerCase().includes('expired') && (
              <Link
                to="/forgot-password"
                className="ml-1 font-bold underline hover:no-underline"
              >
                Request a new link.
              </Link>
            )}
          </div>
        )}

        <FormField
          id="password"
          name="password"
          type="password"
          label="New password"
          autoComplete="new-password"
          autoFocus
          value={fields.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isSubmitting}
          placeholder="••••••••"
        />

        <FormField
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={fields.passwordConfirm}
          onChange={handleChange}
          error={fieldErrors.passwordConfirm}
          disabled={isSubmitting}
          placeholder="••••••••"
        />

        <Button
          type="submit"
          className="mt-1 w-full py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
