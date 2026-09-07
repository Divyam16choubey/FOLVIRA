/**
 * PortfolioPreviewPage — Full-screen portfolio preview at /portfolio/:id/preview
 *
 * Renders the portfolio exactly as it will appear — no AppLayout header,
 * no sidebar controls. Used for:
 *   - "Open full preview" link from the workspace
 *   - Future public portfolio URL (Phase 6)
 *
 * Redirects to /login if not authenticated.
 * Only loads the user's own portfolio (ownership enforced server-side).
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PortfolioRenderer } from '../../components/portfolio/PortfolioRenderer'
import { api, ApiError } from '../../lib/api'
import type { Portfolio, RendererProfile } from '../../types/portfolio'

export function PortfolioPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [profile, setProfile] = useState<RendererProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    void loadData()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    try {
      setLoading(true)
      const res = await api.get<{ portfolio: Portfolio; profile: RendererProfile | null }>(
        `/api/portfolios/${id}`
      )
      setPortfolio(res.portfolio)
      setProfile(res.profile)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login', { replace: true })
      } else if (err instanceof ApiError && err.status === 404) {
        navigate('/portfolio', { replace: true })
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load portfolio.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-display text-xl text-pine animate-pulse">Loading preview…</p>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <p className="text-sm font-semibold text-red-700">{error || 'Portfolio not found.'}</p>
        <Link
          to="/portfolio"
          className="text-sm font-bold text-pine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
        >
          ← Back to Portfolios
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Back to editor bar — unobtrusive, only shown in preview mode */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-black/10 bg-black/80 px-4 py-2 backdrop-blur-sm print:hidden"
        role="banner"
        aria-label="Preview bar"
      >
        <span className="text-xs font-bold text-white/80">Preview mode</span>
        <Link
          to={`/portfolio/${id}`}
          className="rounded-[var(--radius-control)] bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          ← Back to Editor
        </Link>
      </div>

      <PortfolioRenderer portfolio={portfolio} profile={profile} />
    </div>
  )
}
