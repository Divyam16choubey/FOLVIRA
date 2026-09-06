/**
 * DashboardPage.tsx — Upgraded FOLVIRA workspace dashboard for Phase 3.
 *
 * Preserves all Phase 2 authentication and account features (email verification,
 * account deletion, session security) while integrating:
 * - Profile completeness calculation
 * - Multi-source ingestion status (Resume, GitHub, LinkedIn)
 * - Profile sections breakdown with direct edit shortcuts
 * - Editorial design aesthetic
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { ProfileCompleteness } from '../../components/profile/ProfileCompleteness'
import { useAuth, ApiError } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { Profile, DataSource } from '../../types/profile'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Profile and data sources state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [completeness, setCompleteness] = useState(0)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Account management state (Phase 2)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    async function fetchWorkspaceData() {
      try {
        setLoadingData(true)
        const [profileRes, sourcesRes] = await Promise.all([
          api.get<{ profile: Profile; completeness: number }>('/api/profile'),
          api.get<{ sources: DataSource[] }>('/api/profile/datasources'),
        ])
        setProfile(profileRes.profile)
        setCompleteness(profileRes.completeness)
        setDataSources(sourcesRes.sources)
      } catch {
        // Fallback: If profile fetch fails, dashboard still loads
      } finally {
        setLoadingData(false)
      }
    }

    void fetchWorkspaceData()
  }, [])

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

  // Ingestion status helpers
  const resumeSource = dataSources.find((s) => s.type === 'resume')
  const githubSource = dataSources.find((s) => s.type === 'github')

  return (
    <AppLayout>
      <div className="section-shell py-10 sm:py-14">
        {/* Email verification banner (Phase 2) */}
        {!user.isEmailVerified && (
          <div
            role="alert"
            className="mb-8 rounded-[var(--radius-control)] border border-[#b8860b]/30 bg-[#fdf8ed] px-5 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[#7a5c00]">
                Your email address is not verified. Check your inbox or resend.
              </p>
              <div className="flex flex-col gap-1.5 sm:items-end">
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-xs"
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

        {/* Welcome Section */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Portfolio Workspace</p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-[-0.04em] text-ink">
              Welcome, {user.name.split(' ')[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {profile?.headline ||
                'Build your definitive professional presence. Connect your data sources or manually refine your story.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button className="px-4 py-2.5 text-xs">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Completeness Card */}
        <div className="mb-10">
          <ProfileCompleteness
            completeness={completeness}
            profile={profile || undefined}
            showDetails={!loadingData}
          />
        </div>

        {/* Grid: Ingestion Sources & Profile Sections */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left 2 Cols: Profile Sections Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">
                Profile Breakdown
              </h2>
              <Link
                to="/profile"
                className="text-xs font-bold text-pine hover:underline"
              >
                Open Full Editor →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Experience Card */}
              <Link
                to="/profile#experience"
                className="group rounded-card border border-line bg-paper p-5 shadow-soft transition-all hover:border-pine/50 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Work Experience
                  </span>
                  <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-xs font-extrabold text-pine">
                    {profile?.experience.length || 0}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg text-ink group-hover:text-pine transition-colors">
                  Positions & Roles
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {profile?.experience.length
                    ? `Latest: ${profile.experience[0]?.title} @ ${profile.experience[0]?.company}`
                    : 'No positions added yet.'}
                </p>
              </Link>

              {/* Projects Card */}
              <Link
                to="/profile#projects"
                className="group rounded-card border border-line bg-paper p-5 shadow-soft transition-all hover:border-pine/50 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Showcase Projects
                  </span>
                  <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-xs font-extrabold text-pine">
                    {profile?.projects.length || 0}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg text-ink group-hover:text-pine transition-colors">
                  Portfolio Works
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {profile?.projects.length
                    ? `${profile.projects.length} projects cataloged`
                    : 'Highlight your best creations.'}
                </p>
              </Link>

              {/* Skills Card */}
              <Link
                to="/profile#skills"
                className="group rounded-card border border-line bg-paper p-5 shadow-soft transition-all hover:border-pine/50 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Skills & Tech
                  </span>
                  <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-xs font-extrabold text-pine">
                    {profile?.skills.length || 0}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg text-ink group-hover:text-pine transition-colors">
                  Expertise Matrix
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {profile?.skills.length
                    ? profile.skills.slice(0, 4).map((s) => s.name).join(', ') +
                      (profile.skills.length > 4 ? '…' : '')
                    : 'Add core competencies.'}
                </p>
              </Link>

              {/* Education Card */}
              <Link
                to="/profile#education"
                className="group rounded-card border border-line bg-paper p-5 shadow-soft transition-all hover:border-pine/50 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Education
                  </span>
                  <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-xs font-extrabold text-pine">
                    {profile?.education.length || 0}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg text-ink group-hover:text-pine transition-colors">
                  Academic History
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {profile?.education.length
                    ? profile.education[0]?.institution
                    : 'Degrees & institutions.'}
                </p>
              </Link>
            </div>
          </div>

          {/* Right Col: Data Sources Panel */}
          <div className="space-y-6">
            <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">
              Data Ingestion
            </h2>

            <div className="space-y-4">
              {/* Resume Ingestion Status */}
              <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <span className="text-sm font-bold text-ink">Resume Ingestion</span>
                  </div>
                  {resumeSource?.status === 'imported' ? (
                    <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-bold text-pine uppercase">
                      Imported
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                      Not Uploaded
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {resumeSource?.status === 'imported'
                    ? `Processed ${(resumeSource.metadata?.filename as string) || 'document'}`
                    : 'Upload your CV in PDF/DOCX to extract experience and skills.'}
                </p>

                <div className="mt-4">
                  <Link to="/import/resume">
                    <Button
                      variant="secondary"
                      className="w-full py-1.5 text-xs"
                    >
                      {resumeSource?.status === 'imported' ? 'Re-upload Resume' : 'Import Resume'}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* GitHub Ingestion Status */}
              <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🐙</span>
                    <span className="text-sm font-bold text-ink">GitHub Integration</span>
                  </div>
                  {githubSource?.status === 'imported' || githubSource?.status === 'connected' ? (
                    <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-bold text-pine uppercase">
                      Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                      Not Connected
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {githubSource?.sourceIdentifier
                    ? `Linked to @${githubSource.sourceIdentifier}`
                    : 'Connect your GitHub username to showcase public repositories.'}
                </p>

                <div className="mt-4">
                  <Link to="/import/github">
                    <Button
                      variant="secondary"
                      className="w-full py-1.5 text-xs"
                    >
                      {githubSource ? 'Sync Repositories' : 'Connect GitHub'}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* LinkedIn Reference Status */}
              <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💼</span>
                    <span className="text-sm font-bold text-ink">LinkedIn Reference</span>
                  </div>
                  {profile?.linkedinUrl ? (
                    <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-bold text-pine uppercase">
                      Configured
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                      Missing
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {profile?.linkedinUrl ? (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pine font-medium truncate block hover:underline"
                    >
                      {profile.linkedinUrl}
                    </a>
                  ) : (
                    'Add your public LinkedIn profile link for prospective employers.'
                  )}
                </p>

                <div className="mt-4">
                  <Link to="/profile#basic">
                    <Button
                      variant="secondary"
                      className="w-full py-1.5 text-xs"
                    >
                      Configure Link
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2: Account Information & Danger Zone */}
        <div className="border-t border-line pt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Account Info */}
            <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-pine">
                Account Information
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-line/40 pb-2">
                  <dt className="text-muted">Name</dt>
                  <dd className="font-bold text-ink">{user.name}</dd>
                </div>
                <div className="flex justify-between border-b border-line/40 pb-2">
                  <dt className="text-muted">Email</dt>
                  <dd className="flex items-center gap-2 font-bold text-ink">
                    {user.email}
                    {user.isEmailVerified ? (
                      <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[9px] font-bold uppercase text-pine">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#fdf8ed] px-2 py-0.5 text-[9px] font-bold uppercase text-[#7a5c00]">
                        Unverified
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Member Since</dt>
                  <dd className="font-bold text-ink">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Danger Zone */}
            <div className="rounded-card border border-[#b83232]/20 bg-paper p-6 shadow-soft">
              <h2 className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#b83232]">
                Danger Zone
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-muted">
                Permanently delete your FOLVIRA account, profile, and all ingested data sources.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="secondary"
                  className="border-[#b83232]/40 px-3.5 py-1.5 text-xs text-[#b83232] hover:border-[#b83232] hover:bg-[#fdf1f1]"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#b83232]">
                    Are you sure? This action cannot be reversed.
                  </p>
                  {deleteError && (
                    <p role="alert" className="text-xs text-[#b83232]">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="bg-[#b83232] px-3.5 py-1.5 text-xs hover:bg-[#9a2a2a]"
                      onClick={() => void handleDeleteAccount()}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Yes, Delete Everything'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3.5 py-1.5 text-xs"
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
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
