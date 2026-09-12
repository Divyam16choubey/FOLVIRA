/**
 * PortfolioNav — Phase 8 in-page navigation for portfolio templates.
 *
 * Renders navigation links for visible sections that have content.
 * Used by all three templates (Editorial, Minimal, Developer).
 *
 * Rules:
 * - Only shows links for sections that are visible AND have rendered content
 * - Uses the section IDs added in Phase 8 (hero, about, experience, etc.)
 * - Provides a mobile hamburger drawer for small screens
 * - Does NOT use arbitrary HTML or user-defined labels
 */
import { useState, useCallback, useEffect } from 'react'
import type { PortfolioSection, SectionType, RendererProfile } from '../../types/portfolio'

interface PortfolioNavProps {
  sections: PortfolioSection[]
  profile: RendererProfile
  colors: {
    bg: string
    text: string
    muted: string
    accent: string
    border: string
    surface: string
  }
  variant: 'editorial' | 'minimal' | 'developer'
  fontFamily?: string
}

/** Section labels — closed set, no user content */
const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Top',
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  certifications: 'Certifications',
  contact: 'Contact',
}

/**
 * Determine which sections actually have renderable content.
 * A section is "populated" if the profile has data for it.
 */
function isSectionPopulated(type: SectionType, profile: RendererProfile): boolean {
  switch (type) {
    case 'hero': return !!profile.fullName
    case 'about': return !!(profile.about && profile.about.trim().length > 0)
    case 'experience': return !!(profile.experience && profile.experience.length > 0)
    case 'projects': return !!(profile.projects && profile.projects.length > 0)
    case 'skills': return !!(profile.skills && profile.skills.length > 0)
    case 'education': return !!(profile.education && profile.education.length > 0)
    case 'certifications': return !!(profile.certifications && profile.certifications.length > 0)
    case 'contact': return !!(
      profile.email || profile.website || profile.linkedinUrl ||
      profile.githubUrl || (profile.socialLinks && profile.socialLinks.length > 0)
    )
    default: return false
  }
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

export function PortfolioNav({ sections, profile, colors, variant, fontFamily }: PortfolioNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Get navigable sections: visible, populated, and not "hero" in the nav links
  const navSections = sections
    .filter((s) => s.visible && isSectionPopulated(s.type, profile) && s.type !== 'hero')
    .sort((a, b) => a.order - b.order)

  // Close mobile menu on escape
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  // Close mobile menu on navigation
  const handleNav = useCallback((sectionType: SectionType) => {
    setMobileOpen(false)
    scrollToSection(sectionType)
  }, [])

  if (navSections.length === 0) return null

  const isDark = colors.bg === '#161e1b' || colors.bg === '#1a1e1c'
  const isDevVariant = variant === 'developer'
  const isEditorialVariant = variant === 'editorial'

  // ── Desktop links (hidden on mobile) ────────────────────────────────────

  const desktopLinks = (
    <div className="hidden sm:flex items-center gap-1" role="navigation" aria-label="Portfolio sections">
      {navSections.map((s) => (
        <button
          key={s.type}
          type="button"
          onClick={() => scrollToSection(s.type)}
          className="px-2.5 py-1 text-xs font-semibold transition-colors rounded-[0.25rem] hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{
            color: colors.muted,
            fontFamily: isDevVariant ? 'monospace' : fontFamily,
            ...(isDevVariant ? {} : {}),
          }}
        >
          {SECTION_LABELS[s.type]}
        </button>
      ))}
    </div>
  )

  // ── Mobile hamburger ────────────────────────────────────────────────────

  const mobileButton = (
    <button
      type="button"
      onClick={() => setMobileOpen(!mobileOpen)}
      className="sm:hidden flex flex-col items-center justify-center gap-[4px] w-8 h-8 rounded-[0.25rem] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
      aria-expanded={mobileOpen}
      aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      aria-controls="portfolio-mobile-nav"
      style={{ color: colors.text }}
    >
      <span
        className="block w-4 h-[1.5px] transition-transform origin-center"
        style={{
          backgroundColor: colors.text,
          transform: mobileOpen ? 'rotate(45deg) translateY(2.75px)' : 'none',
        }}
      />
      <span
        className="block w-4 h-[1.5px] transition-opacity"
        style={{
          backgroundColor: colors.text,
          opacity: mobileOpen ? 0 : 1,
        }}
      />
      <span
        className="block w-4 h-[1.5px] transition-transform origin-center"
        style={{
          backgroundColor: colors.text,
          transform: mobileOpen ? 'rotate(-45deg) translateY(-2.75px)' : 'none',
        }}
      />
    </button>
  )

  // ── Mobile drawer ───────────────────────────────────────────────────────

  const mobileDrawer = mobileOpen ? (
    <div
      id="portfolio-mobile-nav"
      className="sm:hidden absolute top-full left-0 right-0 z-20 border-b shadow-lg"
      style={{
        backgroundColor: isDark ? '#1a2420' : '#fffdfa',
        borderColor: colors.border,
      }}
      role="navigation"
      aria-label="Portfolio sections"
    >
      <div className="section-shell py-3">
        <div className="flex flex-col gap-0.5">
          {/* Scroll to top */}
          <button
            type="button"
            onClick={() => handleNav('hero')}
            className="text-left px-3 py-2 text-sm font-semibold rounded-[0.25rem] transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{
              color: colors.accent,
              fontFamily: isDevVariant ? 'monospace' : fontFamily,
            }}
          >
            ↑ Top
          </button>
          {navSections.map((s) => (
            <button
              key={s.type}
              type="button"
              onClick={() => handleNav(s.type)}
              className="text-left px-3 py-2 text-sm font-semibold rounded-[0.25rem] transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{
                color: colors.text,
                fontFamily: isDevVariant ? 'monospace' : fontFamily,
              }}
            >
              {isDevVariant ? `// ${SECTION_LABELS[s.type]}` : SECTION_LABELS[s.type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null

  // ── Render based on template variant ────────────────────────────────────

  if (isEditorialVariant) {
    return (
      <div
        className="sticky top-0 z-10 py-3"
        style={{
          backgroundColor: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="section-shell flex items-center justify-between gap-4 relative">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="font-display text-base tracking-[-0.04em] hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: colors.accent }}
            aria-label="Scroll to top"
          >
            FOLVIRA<span style={{ opacity: 0.5 }}>.</span>
          </button>
          {desktopLinks}
          {mobileButton}
          {mobileDrawer}
        </div>
      </div>
    )
  }

  // Minimal + Developer: return just the nav pieces for embedding in existing headers
  return (
    <>
      {desktopLinks}
      {mobileButton}
      {mobileDrawer}
    </>
  )
}
