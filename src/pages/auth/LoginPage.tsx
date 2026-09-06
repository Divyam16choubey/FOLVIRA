/**
 * LoginPage.tsx
 *
 * - Redirects to /dashboard if already authenticated
 * - After login, redirects to the originally intended page or /dashboard
 * - Zod validation on the client before sending to the server
 * - Accessible form with visible focus states, loading state, and errors
 */
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { FormField } from '../../components/auth/FormField'
import { Button } from '../../components/common/Button'
import { useAuth, ApiError } from '../../context/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFields = z.infer<typeof loginSchema>
type FieldErrors = Partial<Record<keyof LoginFields, string>>

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [fields, setFields] = useState<LoginFields>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already authenticated, don't render the form
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (fieldErrors[name as keyof LoginFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    // Client-side validation
    const result = loginSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFields
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await login(result.data)
      navigate(from, { replace: true })
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

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your FOLVIRA account."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Server error */}
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
          value={fields.email}
          onChange={handleChange}
          error={fieldErrors.email}
          disabled={isSubmitting}
          placeholder="you@example.com"
        />

        <div className="flex flex-col gap-1.5">
          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            value={fields.password}
            onChange={handleChange}
            error={fieldErrors.password}
            disabled={isSubmitting}
            placeholder="••••••••"
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-1 w-full py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
