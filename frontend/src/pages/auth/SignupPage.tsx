/**
 * SignupPage.tsx
 *
 * - Validates name, email, password strength, and confirmation client-side
 * - On success, shows an email verification prompt
 * - Redirects to /dashboard if already authenticated
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { FormField } from '../../components/auth/FormField'
import { Button } from '../../components/common/Button'
import { useAuth, ApiError } from '../../context/AuthContext'

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })

type SignupFields = z.infer<typeof signupSchema>
type FieldErrors = Partial<Record<keyof SignupFields, string>>

export function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState<SignupFields>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name as keyof SignupFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const result = signupSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignupFields
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const { emailVerificationSent } = await signup(result.data)
      if (emailVerificationSent) {
        setEmailSent(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
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

  // Post-signup: show verification prompt
  if (emailSent) {
    return (
      <AuthLayout title="Check your email.">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-control)] border border-pine/20 bg-[#edf4f1] px-4 py-4 text-sm leading-6 text-pine">
            We sent a verification link to <strong>{fields.email}</strong>.
            <br />
            Click the link to activate your account.
          </div>
          <p className="text-sm leading-6 text-muted">
            Didn&apos;t receive it? Check your spam folder, or{' '}
            <button
              onClick={() => navigate('/dashboard')}
              className="font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              continue to your dashboard
            </button>{' '}
            and request a new one.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account."
      subtitle="Start building a portfolio that's unmistakably yours."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <div role="alert" className="rounded-[var(--radius-control)] border border-[#b83232]/30 bg-[#fdf1f1] px-4 py-3 text-sm text-[#b83232]">
            {serverError}
          </div>
        )}

        <FormField
          id="name"
          name="name"
          type="text"
          label="Full name"
          autoComplete="name"
          autoFocus
          value={fields.name}
          onChange={handleChange}
          error={fieldErrors.name}
          disabled={isSubmitting}
          placeholder="Your name"
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          error={fieldErrors.email}
          disabled={isSubmitting}
          placeholder="you@example.com"
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={fields.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isSubmitting}
          placeholder="••••••••"
        />
        <p className="mt-[-12px] text-xs leading-5 text-muted">
          Minimum 8 characters, one uppercase letter, one number.
        </p>

        <FormField
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          label="Confirm password"
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
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
