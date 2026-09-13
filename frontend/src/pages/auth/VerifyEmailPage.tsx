/**
 * VerifyEmailPage.tsx
 *
 * Reads token from URL query string, calls the verify endpoint on mount.
 * Shows success / error / loading state.
 * Also handles the "resend verification" flow for authenticated users.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/common/Button'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

type Status = 'loading' | 'success' | 'error' | 'no-token'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { user, refreshUser } = useAuth()

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'no-token')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  // Use a ref to prevent double-invocation in React Strict Mode
  const verifyCalledRef = useRef(false)

  useEffect(() => {
    if (!token || verifyCalledRef.current) return
    verifyCalledRef.current = true

    api
      .post('/api/auth/verify-email', { token })
      .then(async () => {
        setStatus('success')
        // Refresh user state so isEmailVerified updates in the navbar/dashboard
        await refreshUser()
      })
      .catch((err: unknown) => {
        setStatus('error')
        if (err instanceof ApiError) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage('Verification failed. Please try again.')
        }
      })
  }, [token, refreshUser])

  const handleResend = async () => {
    setResendLoading(true)
    setResendMessage('')
    try {
      await api.post('/api/auth/resend-verification', {})
      setResendMessage('A new verification link has been sent to your email.')
    } catch (err) {
      if (err instanceof ApiError) {
        setResendMessage(err.message)
      } else {
        setResendMessage('Could not send verification email. Please try again.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <AuthLayout title="Verifying your email…">
        <div className="flex items-center gap-3 text-sm text-muted">
          <div
            className="size-5 animate-spin rounded-full border-2 border-line border-t-pine"
            role="status"
            aria-label="Verifying"
          />
          Please wait…
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verified.">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-control)] border border-pine/20 bg-[#edf4f1] px-4 py-4 text-sm leading-6 text-pine">
            Your email address has been verified. Your account is fully activated.
          </div>
          <Link to="/dashboard">
            <Button className="w-full py-3" showArrow>
              Go to dashboard
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'error') {
    return (
      <AuthLayout title="Verification failed.">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-control)] border border-[#b83232]/30 bg-[#fdf1f1] px-4 py-3 text-sm leading-6 text-[#b83232]">
            {errorMessage}
          </div>

          {/* Offer resend only if the user is logged in */}
          {user && !user.isEmailVerified && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Request a new verification link:
              </p>
              <Button
                variant="secondary"
                className="w-full py-3"
                onClick={() => void handleResend()}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending…' : 'Resend verification email'}
              </Button>
              {resendMessage && (
                <p className="text-sm text-pine">{resendMessage}</p>
              )}
            </div>
          )}

          <Link
            to={user ? '/dashboard' : '/login'}
            className="text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            {user ? 'Back to dashboard' : 'Back to sign in'}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // No token in URL — user probably navigated here directly
  return (
    <AuthLayout title="Verify your email.">
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-6 text-muted">
          Check your inbox for a verification link. If you need a new one:
        </p>

        {user && !user.isEmailVerified ? (
          <>
            <Button
              className="w-full py-3"
              onClick={() => void handleResend()}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending…' : 'Send verification email'}
            </Button>
            {resendMessage && (
              <p className="text-sm text-pine">{resendMessage}</p>
            )}
          </>
        ) : (
          <Link
            to={user ? '/dashboard' : '/signup'}
            className="text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            {user ? 'Go to dashboard' : 'Create an account'}
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}
