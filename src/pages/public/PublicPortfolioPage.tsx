/**
 * PublicPortfolioPage — Phase 7 public portfolio at /p/:slug
 *
 * This page:
 *   - Requires NO authentication
 *   - Renders the PUBLISHED SNAPSHOT (immutable) only
 *   - Returns a polished 404 if the portfolio is not published or not found
 *   - Applies SEO metadata from the published snapshot
 *   - Uses the existing PortfolioRenderer (same as preview/editor)
 *   - Draft data is NEVER rendered here
 *
 * Architecture:
 *   /p/:slug → PublicPortfolioPage
 *       → GET /api/public/portfolio/:slug (no auth)
 *       → publishedSnapshot
 *       → PortfolioRenderer (existing, unchanged)
 *
 * SEO strategy:
 *   Vite is a client-side SPA — full SSR is out of scope.
 *   We use useEffect to set document.title and inject <meta> tags
 *   into <head> after mount. This handles social sharing previews
 *   where crawlers execute JavaScript (most modern crawlers do).
 *   For crawlers that don't execute JS, the static title in index.html
 *   serves as a fallback.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PortfolioRenderer } from '../../components/portfolio/PortfolioRenderer'
import type { Portfolio, RendererProfile } from '../../types/portfolio'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicPortfolioData {
  _id: string
  name: string
  slug: string
  status: string
  lastPublishedAt?: string
  template: Portfolio['template']
  sections: Portfolio['sections']
  theme: Portfolio['theme']
  seo: Portfolio['seo']
  profile: RendererProfile
  publishedAt: string
}

// ─── SEO helper ───────────────────────────────────────────────────────────────

/**
 * Safely set/update a <meta> tag in <head>.
 * Sanitizes value: strips HTML tags, limits length.
 * Does NOT allow arbitrary HTML injection.
 */
function setMeta(selector: string, attr: string, content: string): void {
  if (!content) return

  // Strip any HTML tags — prevent injection via SEO fields
  const safe = content.replace(/<[^>]+>/g, '').trim().slice(0, 500)
  if (!safe) return

  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    // Set the identifying attribute from the selector, e.g. name="description"
    const match = selector.match(/\[([^\]=]+)="([^"]+)"\]/)
    if (match) {
      el.setAttribute(match[1], match[2])
    }
    document.head.appendChild(el)
  }
  el.setAttribute(attr, safe)
}

function applyPortfolioSEO(data: PublicPortfolioData): void {
  const title = data.seo?.title ?? data.name ?? 'Portfolio'
  const description = data.seo?.description ?? data.profile?.headline ?? ''
  const fullName = data.profile?.fullName ?? ''
  const pageTitle = `${title} — FOLVIRA`

  // Document title
  document.title = pageTitle

  // Basic meta
  setMeta('meta[name="description"]', 'content', description)

  // Open Graph
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:type"]', 'content', 'profile')
  setMeta('meta[property="og:site_name"]', 'content', 'FOLVIRA')

  // Twitter Card
  setMeta('meta[name="twitter:card"]', 'content', 'summary')
  setMeta('meta[name="twitter:title"]', 'content', title)
  setMeta('meta[name="twitter:description"]', 'content', description)

  // Profile-specific OG
  if (fullName) {
    setMeta('meta[property="profile:full_name"]', 'content', fullName)
  }
}

function resetSEO(): void {
  document.title = 'FOLVIRA — Your Identity. Your Work. Your Portfolio.'
}

// ─── Public 404 component ─────────────────────────────────────────────────────

function PublicNotFound({ slug }: { slug?: string }) {
  useEffect(() => {
    document.title = 'Portfolio not found — FOLVIRA'
    return () => resetSEO()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#18221e] flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* FOLVIRA wordmark */}
      <a
        href="/"
        className="mb-12 font-display text-[2rem] leading-none tracking-[-0.06em] text-[#1e4a40] hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e4a40]"
        aria-label="FOLVIRA home"
      >
        FOLVIRA<span style={{ color: '#9d602d' }}>.</span>
      </a>

      {/* Large typography 404 */}
      <p
        className="font-display text-[clamp(5rem,18vw,10rem)] leading-none tracking-[-0.06em] select-none"
        style={{ color: '#1e4a40', opacity: 0.12 }}
        aria-hidden="true"
      >
        404
      </p>

      <div className="mt-6 max-w-md space-y-3">
        <h1 className="font-display text-2xl sm:text-3xl tracking-[-0.03em]" style={{ color: '#18221e' }}>
          Portfolio not found
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#59625c' }}>
          {slug
            ? `The portfolio at this address is not publicly available.`
            : 'The portfolio you're looking for doesn't exist or is not yet published.'}
        </p>
        <p className="text-xs" style={{ color: '#59625c', opacity: 0.7 }}>
          It may have been unpublished or the link may be incorrect.
        </p>
      </div>

      <a
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-[0.375rem] border border-[#dedbd3] bg-[#fffdfa] px-5 py-2.5 text-sm font-bold text-[#18221e] transition hover:border-[#1e4a40]/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e4a40]"
      >
        ← Go to FOLVIRA
      </a>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>()

  const [data, setData] = useState<PublicPortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }
    void loadPortfolio(slug)

    // Reset SEO when navigating away
    return () => resetSEO()
  }, [slug])

  async function loadPortfolio(portfolioSlug: string) {
    try {
      setLoading(true)
      // Public endpoint — no authentication header/cookie needed
      const res = await fetch(`/api/public/portfolio/${encodeURIComponent(portfolioSlug)}`, {
        credentials: 'omit', // Explicitly omit credentials — fully public request
      })

      if (res.status === 404) {
        setNotFound(true)
        return
      }

      if (!res.ok) {
        setError('Failed to load portfolio.')
        return
      }

      const body = await res.json() as { success: boolean; data: PublicPortfolioData }
      if (!body.success || !body.data) {
        setNotFound(true)
        return
      }

      setData(body.data)
      // Apply SEO after data loads
      applyPortfolioSEO(body.data)
    } catch {
      setError('Failed to load portfolio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef]">
        <p
          className="font-display text-xl animate-pulse"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#1e4a40' }}
        >
          Loading…
        </p>
      </div>
    )
  }

  if (notFound || !data) {
    return <PublicNotFound slug={slug} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f5ef] px-4 text-center">
        <p className="text-sm font-semibold" style={{ color: '#b83232' }}>{error}</p>
        <button
          type="button"
          onClick={() => { setError(''); void loadPortfolio(slug!) }}
          className="text-sm font-bold underline"
          style={{ color: '#1e4a40' }}
        >
          Try again
        </button>
      </div>
    )
  }

  // Build a Portfolio shape that PortfolioRenderer can consume from the snapshot data
  // We reconstruct the Portfolio object using snapshot fields — NO draft data
  const renderPortfolio: Portfolio = {
    _id: data._id,
    userId: '',        // Not needed by renderer
    profileId: '',     // Not needed by renderer
    name: data.name,
    slug: data.slug,
    template: data.template,
    sections: data.sections,
    theme: data.theme,
    overrides: {},
    selections: { featuredProjects: [], visibleExperience: [], visibleEducation: [], visibleCertifications: [] },
    seo: data.seo,
    status: 'published',
    lastPublishedAt: data.lastPublishedAt,
    createdAt: data.publishedAt,
    updatedAt: data.publishedAt,
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <PortfolioRenderer
        portfolio={renderPortfolio}
        profile={data.profile}
      />
    </div>
  )
}
