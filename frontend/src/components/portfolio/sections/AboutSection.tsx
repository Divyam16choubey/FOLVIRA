/**
 * AboutSection — Displays the user's bio/about text.
 * Renders nothing if the about field is empty — never shows placeholder content.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily } from '../../../types/portfolio'

interface AboutSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function AboutSection({ profile, theme, variant = 'editorial' }: AboutSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)

  // Never render empty placeholder content
  if (!profile.about || profile.about.trim().length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        id="about"
        aria-labelledby="about-heading"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <h2 id="about-heading" className="sr-only">About</h2>
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            About
          </p>
          <p
            className="max-w-2xl text-base leading-relaxed"
            style={{ color: colors.text }}
          >
            {profile.about}
          </p>
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        id="about"
        aria-labelledby="about-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="about-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              About
            </h2>
          </div>
          <p
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: colors.text }}
          >
            {profile.about}
          </p>
        </div>
      </section>
    )
  }

  // editorial
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="eyebrow" style={{ color: colors.accent }}>About</p>
            <h2
              id="about-heading"
              className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
              style={{ fontFamily: headingFont, color: colors.text }}
            >
              My Story
            </h2>
          </div>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl"
            style={{ color: colors.text }}
          >
            {profile.about}
          </p>
        </div>
      </div>
    </section>
  )
}
