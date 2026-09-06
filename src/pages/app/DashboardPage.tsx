/**
 * DashboardPage.tsx — Protected dashboard.
 *
 * Entry point for authenticated users. Phase 2 scope:
 * - Shows a welcome message with the user's name
 * - Email verification banner if not yet verified
 * - Account deletion (requires confirmation)
 * - Sign out
 *
 * Future phases will add portfolio editor, profile import, etc.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { useAuth, ApiError } from '../../context/AuthContext'
import { api } from '../../lib/api'

export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendMessage('')
    try {
      await api.post('/api/auth/resend-verification', {})
      setResendMessage('Verification email sent. Check your inbox.')
    } catch (err) {
      if (err instanceof ApiError) {
        setResendMessage(err.message)
      } else {
        setResendMessage('Could not send email. Please try again.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setDeleteError('')
    try {
      await api.delete('/api/auth/account')
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
      } else {
        setDeleteError('Could not delete account. Please try again.')
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top bar */}
      <header className="border-b border-line bg-paper">
        <div className="section-shell flex h-[72px] items-center justify-between">
          <span className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine sm:text-[2rem]">
            FOLVIRA<span className="text-brass">.</span>
          </span>
          <Button
            variant="secondary"
            className="px-4 py-2 text-sm"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="section-shell py-12 sm:py-16">
        {/* Email verification banner */}
        {!user.isEmailVerified && (
          <div
            role="alert"
            className="mb-8 rounded-[var(--radius-control)] border border-[#b8860b]/30 bg-[#fdf8ed] px-5 py-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[#7a5c00]">
                Your email address is not verified.
              </p>
              <div className="flex flex-col gap-1.5 sm:items-end">
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                  onClick={() => void handleResendVerification()}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </Button>
                {resendMessage && (
                  <p className="text-xs text-muted">{resendMessage}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-12">
          <p className="eyebrow mb-3">Dashboard</p>
          <h1 className="font-display text-[2.4rem] leading-[1.0] tracking-[-0.05em] text-ink sm:text-[3rem]">
            Welcome, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-4 max-w-[520px] text-base leading-7 text-muted">
            Your FOLVIRA account is set up. Portfolio building tools are coming
            in the next phase.
          </p>
        </div>

        {/* Account info card */}
        <div className="mb-8 max-w-[520px] rounded-card border border-line bg-paper p-6 shadow-soft">
          <h2 className="mb-5 text-sm font-extrabold uppercase tracking-[0.12em] text-pine">
            Account
          </h2>
          <dl className="space-y-3">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-muted">Name</dt>
              <dd className="text-sm font-bold text-ink">{user.name}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-muted">Email</dt>
              <dd className="flex items-center gap-2 text-sm font-bold text-ink">
                {user.email}
                {user.isEmailVerified ? (
                  <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-pine">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-[#fdf8ed] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7a5c00]">
                    Unverified
                  </span>
                )}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-muted">Member since</dt>
              <dd className="text-sm font-bold text-ink">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Danger zone */}
        <div className="max-w-[520px] rounded-card border border-[#b83232]/20 bg-paper p-6">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#b83232]">
            Danger zone
          </h2>
          <p className="mb-5 text-sm leading-6 text-muted">
            Permanently delete your FOLVIRA account and all associated data.
            This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="secondary"
              className="border-[#b83232]/40 px-4 py-2 text-sm text-[#b83232] hover:border-[#b83232] hover:bg-[#fdf1f1]"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete my account
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-[#b83232]">
                Are you sure? This cannot be undone.
              </p>
              {deleteError && (
                <p role="alert" className="text-sm text-[#b83232]">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  className="bg-[#b83232] px-4 py-2 text-sm hover:bg-[#9a2a2a]"
                  onClick={() => void handleDeleteAccount()}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete my account'}
                </Button>
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteError('')
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Phase note */}
        <p className="mt-12 text-xs text-muted/70">
          FOLVIRA Phase 2 · Authentication foundation ·{' '}
          Portfolio editor coming in Phase 3.
        </p>
      </main>
    </div>
  )
}
