/**
 * HeroSection — Displays the user's name, headline, and location.
 *
 * Safe rendering: all output is plain text via React's escaping.
 * No dangerouslySetInnerHTML. External links use rel="noopener noreferrer".
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily } from '../../../types/portfolio'

interface HeroSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function HeroSection({ profile, theme, variant = 'editorial' }: HeroSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)

  if (!profile.fullName) return null

  if (variant === 'developer') {
    return (
      <section
        aria-label="Introduction"
        style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        className="py-14 sm:py-20"
      >
        <div className="section-shell">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            Hi, I&apos;m
          </p>
          <h1
            className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight"
            style={{ fontFamily: headingFont, color: colors.text, lineHeight: 1.05 }}
          >
            {profile.fullName}
          </h1>
          {profile.headline && (
            <p
              className="mt-4 text-lg sm:text-xl font-medium"
              style={{ color: colors.muted }}
            >
              {profile.headline}
            </p>
          )}
          {(profile.location || profile.email || profile.githubUrl) && (
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.muted }}>
              {profile.location && <span>{profile.location}</span>}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  style={{ color: colors.accent }}
                  className="hover:underline"
                  rel="noopener noreferrer"
                >
                  {profile.email}
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.accent }}
                  className="hover:underline"
                >
                  GitHub ↗
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        aria-label="Introduction"
        style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        className="py-16 sm:py-24"
      >
        <div className="section-shell">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
            style={{ fontFamily: headingFont, color: colors.text, lineHeight: 0.95, letterSpacing: '-0.04em' }}
          >
            {profile.fullName}
          </h1>
          {profile.headline && (
            <p
              className="mt-6 max-w-xl text-lg"
              style={{ color: colors.muted }}
            >
              {profile.headline}
            </p>
          )}
          {profile.location && (
            <p className="mt-3 text-sm" style={{ color: colors.muted }}>
              {profile.location}
            </p>
          )}
        </div>
      </section>
    )
  }

  // editorial (default)
  return (
    <section
      aria-label="Introduction"
      style={{ backgroundColor: colors.bg }}
      className="py-16 sm:py-24 lg:py-32"
    >
      <div className="section-shell">
        <div className="max-w-3xl">
          <p
            className="eyebrow mb-5"
            style={{ color: colors.accent }}
          >
            Portfolio
          </p>
          <h1
            className="text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.055em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            {profile.fullName}
          </h1>
          {profile.headline && (
            <p
              className="mt-6 text-xl sm:text-2xl font-light leading-relaxed"
              style={{ color: colors.muted }}
            >
              {profile.headline}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.muted }}>
            {profile.location && <span>{profile.location}</span>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: colors.accent }}
                className="hover:underline"
              >
                {profile.website}
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                style={{ color: colors.accent }}
                className="hover:underline"
              >
                {profile.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
