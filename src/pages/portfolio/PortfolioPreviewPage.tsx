/**
 * PortfolioPreviewPage — Full-screen portfolio preview at /portfolio/:id/preview
 *
 * Phase 6 behaviour:
 *   - If the portfolio has a publishedSnapshot, renders the IMMUTABLE snapshot.
 *   - If no snapshot exists yet (status = 'draft'), renders the current draft.
 *   - A "Back to Editor" bar is shown at top (hidden on print).
 *
 * This page always requires authentication (owner only).
 * The published snapshot profile is the resolved version that was frozen
 * at publish time — it does NOT change when the master Profile changes.
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
  const [usingSnapshot, setUsingSnapshot] = useState(false)

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

      // Phase 6: use the published snapshot profile if available — it's immutable
      if (res.portfolio.publishedSnapshot?.profile) {
        setProfile(res.portfolio.publishedSnapshot.profile as RendererProfile)
        setUsingSnapshot(true)
      } else {
        // Fall back to live draft profile (no snapshot yet)
        setProfile(res.profile)
        setUsingSnapshot(false)
      }
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

  // When viewing the snapshot, use snapshot template/sections/theme
  const renderPortfolio: Portfolio | null = portfolio
    ? usingSnapshot && portfolio.publishedSnapshot
      ? {
          ...portfolio,
          template:  portfolio.publishedSnapshot.template,
          sections:  portfolio.publishedSnapshot.sections,
          theme:     portfolio.publishedSnapshot.theme,
        }
      : portfolio
    : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-display text-xl text-pine animate-pulse">Loading preview…</p>
      </div>
    )
  }

  if (error || !renderPortfolio) {
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

  const snapshotDate = portfolio?.publishedSnapshot?.publishedAt
    ? new Date(portfolio.publishedSnapshot.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Preview / published bar */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-black/10 bg-black/80 px-4 py-2 backdrop-blur-sm print:hidden"
        role="banner"
        aria-label="Preview bar"
      >
        <div className="flex items-center gap-3">
          {usingSnapshot ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
              Published snapshot
              {snapshotDate && (
                <span className="font-normal text-white/50 ml-1">{snapshotDate}</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#f5d87a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5d87a]" aria-hidden="true" />
              Draft preview — not yet published
            </span>
          )}
        </div>
        <Link
          to={`/portfolio/${id}`}
          className="rounded-[var(--radius-control)] bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          ← Back to Editor
        </Link>
      </div>

      <PortfolioRenderer portfolio={renderPortfolio} profile={profile} />
    </div>
  )
}
