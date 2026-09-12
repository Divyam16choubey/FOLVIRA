/**
 * PublicPortfolioPage — Phase 7+8 public portfolio at /p/:slug
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
 * SEO strategy (Phase 8):
 *   Vite is a client-side SPA — full SSR is out of scope.
 *   We use useEffect to set document.title and inject <meta> tags
 *   into <head> after mount. This handles social sharing previews
 *   where crawlers execute JavaScript (most modern crawlers do).
 *   For crawlers that don't execute JS, the static title in index.html
 *   serves as a fallback.
 *
 *   Phase 8 additions:
 *   - Tracks all injected meta/link tags and removes them on unmount
 *   - Sets canonical URL and og:url using the application origin
 *   - Sets og:image from profile photo when available
 *   - Manages robots meta: allows indexing on public pages
 *   - Supports hash navigation after async load
 */
import { useEffect, useState, useRef, useCallback } from 'react'
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

// ─── SEO helpers ──────────────────────────────────────────────────────────────

/**
 * Tracks all head elements injected by this page so they can be cleanly
 * removed on unmount without affecting global head metadata.
 */
const injectedElements: HTMLElement[] = []

/**
 * Safely set/update a <meta> tag in <head>.
 * Sanitizes value: strips HTML tags, limits length.
 * Does NOT allow arbitrary HTML injection.
 * Tracks the element for cleanup on unmount.
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
    injectedElements.push(el)
  }
  el.setAttribute(attr, safe)
}

/**
 * Set or update a <link> tag in <head> (e.g. canonical).
 */
function setLink(rel: string, href: string): void {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
    injectedElements.push(el)
  }
  el.href = href
}

/**
 * Get the application origin for canonical URLs.
 * Uses the current window origin — never hardcoded localhost.
 */
function getAppOrigin(): string {
  return window.location.origin
}

function applyPortfolioSEO(data: PublicPortfolioData): void {
  const title = data.seo?.title ?? data.name ?? 'Portfolio'
  const description = data.seo?.description ?? data.profile?.headline ?? ''
  const fullName = data.profile?.fullName ?? ''
  const pageTitle = `${title} — FOLVIRA`
  const publicUrl = `${getAppOrigin()}/p/${data.slug}`

  // Document title
  document.title = pageTitle

  // Robots: allow indexing on public portfolio pages
  setMeta('meta[name="robots"]', 'content', 'index, follow')

  // Basic meta
  setMeta('meta[name="description"]', 'content', description)

  // Canonical URL
  setLink('canonical', publicUrl)

  // Open Graph
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:type"]', 'content', 'profile')
  setMeta('meta[property="og:site_name"]', 'content', 'FOLVIRA')
  setMeta('meta[property="og:url"]', 'content', publicUrl)

  // og:image — only when a valid public profile photo exists
  if (data.profile?.profilePhoto) {
    const photo = data.profile.profilePhoto
    // Only set if it looks like a valid http(s) URL
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      setMeta('meta[property="og:image"]', 'content', photo)
    }
  }

  // Twitter Card
  setMeta('meta[name="twitter:card"]', 'content', 'summary')
  setMeta('meta[name="twitter:title"]', 'content', title)
  setMeta('meta[name="twitter:description"]', 'content', description)

  // Profile-specific OG
  if (fullName) {
    setMeta('meta[property="profile:full_name"]', 'content', fullName)
  }
}

/**
 * Remove all meta/link tags injected by this page and restore document title.
 * Only removes elements that were created by this page — never deletes
 * pre-existing global head metadata.
 */
function cleanupSEO(): void {
  document.title = 'FOLVIRA — Your Identity. Your Work. Your Portfolio.'

  // Restore robots to noindex for non-public pages
  const robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
  if (robotsMeta) {
    robotsMeta.setAttribute('content', 'noindex, nofollow')
  }

  // Remove only the elements we injected (excluding robots which we restore)
  for (const el of injectedElements) {
    // Don't remove the robots meta — we just reset its content above
    if (el instanceof HTMLMetaElement && el.getAttribute('name') === 'robots') continue
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  injectedElements.length = 0
}

// ─── Public 404 component ─────────────────────────────────────────────────────

function PublicNotFound({ slug }: { slug?: string }) {
  useEffect(() => {
    document.title = 'Portfolio not found — FOLVIRA'
    return () => {
      document.title = 'FOLVIRA — Your Identity. Your Work. Your Portfolio.'
    }
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
            : "The portfolio you're looking for doesn't exist or is not yet published."}
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

// ─── Branded skeleton loader ──────────────────────────────────────────────────

function PublicLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f5ef]" aria-busy="true" aria-label="Loading portfolio">
      {/* Skeleton header */}
      <div className="py-4 border-b border-[#dedbd3]/50">
        <div className="section-shell">
          <div className="h-4 w-28 rounded bg-[#dedbd3] animate-pulse" />
        </div>
      </div>

      {/* Skeleton hero */}
      <div className="py-16 sm:py-24">
        <div className="section-shell">
          <div className="h-3 w-16 rounded bg-[#dedbd3] animate-pulse mb-6" />
          <div className="h-12 sm:h-16 w-3/4 max-w-lg rounded bg-[#dedbd3] animate-pulse mb-4" />
          <div className="h-5 w-2/3 max-w-md rounded bg-[#dedbd3]/70 animate-pulse mb-3" />
          <div className="h-4 w-1/3 max-w-xs rounded bg-[#dedbd3]/50 animate-pulse" />
        </div>
      </div>

      {/* Skeleton sections */}
      <div className="border-t border-[#dedbd3]/50 py-12 sm:py-16">
        <div className="section-shell">
          <div className="h-3 w-12 rounded bg-[#dedbd3] animate-pulse mb-4" />
          <div className="h-6 w-40 rounded bg-[#dedbd3] animate-pulse mb-6" />
          <div className="space-y-3">
            <div className="h-4 w-full max-w-2xl rounded bg-[#dedbd3]/60 animate-pulse" />
            <div className="h-4 w-5/6 max-w-xl rounded bg-[#dedbd3]/50 animate-pulse" />
            <div className="h-4 w-4/6 max-w-lg rounded bg-[#dedbd3]/40 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="border-t border-[#dedbd3]/50 py-12 sm:py-16">
        <div className="section-shell">
          <div className="h-3 w-16 rounded bg-[#dedbd3] animate-pulse mb-4" />
          <div className="h-6 w-48 rounded bg-[#dedbd3] animate-pulse mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-[#dedbd3]/40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* FOLVIRA wordmark */}
      <div className="flex justify-center py-8">
        <span
          className="font-display text-lg tracking-[-0.04em] animate-pulse select-none"
          style={{ color: '#1e4a40', opacity: 0.3 }}
        >
          FOLVIRA
        </span>
      </div>
    </div>
  )
}

// ─── Public error component ───────────────────────────────────────────────────

function PublicError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f8f5ef] px-4 text-center">
      <a
        href="/"
        className="font-display text-[1.5rem] leading-none tracking-[-0.06em] text-[#1e4a40] hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e4a40]"
        aria-label="FOLVIRA home"
      >
        FOLVIRA<span style={{ color: '#9d602d' }}>.</span>
      </a>

      <div className="max-w-sm space-y-3">
        <h1 className="font-display text-xl tracking-[-0.03em]" style={{ color: '#18221e' }}>
          Something went wrong
        </h1>
        <p className="text-sm" style={{ color: '#59625c' }}>
          We couldn't load this portfolio. This might be a temporary issue.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-[0.375rem] border border-[#1e4a40]/30 bg-[#f4faf7] px-5 py-2.5 text-sm font-bold text-[#1e4a40] transition hover:bg-[#edf4f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e4a40]"
      >
        Try again
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>()

  const [data, setData] = useState<PublicPortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const hasScrolledToHash = useRef(false)

  const loadPortfolio = useCallback(async (portfolioSlug: string) => {
    try {
      setLoading(true)
      setError(false)
      setNotFound(false)
      // Public endpoint — no authentication header/cookie needed
      const res = await fetch(`/api/public/portfolio/${encodeURIComponent(portfolioSlug)}`, {
        credentials: 'omit', // Explicitly omit credentials — fully public request
      })

      if (res.status === 404) {
        setNotFound(true)
        return
      }

      if (!res.ok) {
        setError(true)
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
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }
    void loadPortfolio(slug)

    // Cleanup all injected SEO metadata when navigating away
    return () => cleanupSEO()
  }, [slug, loadPortfolio])

  // Phase 8: Handle hash navigation after async load
  useEffect(() => {
    if (!loading && data && !hasScrolledToHash.current) {
      hasScrolledToHash.current = true
      const hash = window.location.hash
      if (hash) {
        // Small delay to let React render the DOM with section IDs
        requestAnimationFrame(() => {
          const target = document.querySelector(hash)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' })
          }
        })
      }
    }
  }, [loading, data])

  if (loading) {
    return <PublicLoadingSkeleton />
  }

  if (notFound || (!data && !error)) {
    return <PublicNotFound slug={slug} />
  }

  if (error || !data) {
    return <PublicError onRetry={() => { if (slug) void loadPortfolio(slug) }} />
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
    <>
      {/* Phase 8: Skip to main content for keyboard users */}
      <a
        href="#main-content"
        className="fixed z-50 top-3 left-3 -translate-y-[160%] rounded-[0.375rem] bg-[#1e4a40] px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9d602d]"
      >
        Skip to content
      </a>
      <main id="main-content" className="min-h-screen overflow-x-hidden">
        <PortfolioRenderer
          portfolio={renderPortfolio}
          profile={data.profile}
        />
      </main>
    </>
  )
}
