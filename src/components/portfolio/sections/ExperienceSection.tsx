/**
 * ExperienceSection — Displays work experience entries.
 * Renders nothing if the experience array is empty.
 * Never fabricates or invents content.
 */
import type { RendererProfile, PortfolioTheme, RendererExperience } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily, getThemeBorderRadius } from '../../../types/portfolio'

interface ExperienceSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

function formatDateRange(exp: RendererExperience): string {
  if (!exp.startDate && !exp.endDate) return ''
  const start = exp.startDate || ''
  const end = exp.current ? 'Present' : (exp.endDate || 'Present')
  return `${start} – ${end}`
}

export function ExperienceSection({ profile, theme, variant = 'editorial' }: ExperienceSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)
  const radius = getThemeBorderRadius(theme.radius)

  if (!profile.experience || profile.experience.length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        id="experience"
        aria-labelledby="experience-heading"
        style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            Experience
          </p>
          <h2 id="experience-heading" className="sr-only">Work Experience</h2>
          <div className="space-y-8">
            {profile.experience.map((exp) => (
              <div
                key={exp._id}
                className="border-l-2 pl-5"
                style={{ borderColor: colors.accent }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: colors.text }}>
                      {exp.title}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: colors.accent }}>
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-mono" style={{ color: colors.muted }}>
                    {formatDateRange(exp)}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.muted }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        id="experience"
        aria-labelledby="experience-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="experience-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Experience
            </h2>
          </div>
          <div className="space-y-8">
            {profile.experience.map((exp) => (
              <div key={exp._id}>
                <div className="flex flex-wrap items-start justify-between gap-1">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                      {exp.title}
                    </h3>
                    <p className="text-sm" style={{ color: colors.muted }}>
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: colors.muted }}>
                    {formatDateRange(exp)}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.text }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // editorial
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="mb-10">
          <p className="eyebrow" style={{ color: colors.accent }}>Career</p>
          <h2
            id="experience-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Work Experience
          </h2>
        </div>
        <div className="space-y-8">
          {profile.experience.map((exp) => (
            <article
              key={exp._id}
              className="grid grid-cols-1 gap-4 border-t pt-8 sm:grid-cols-[1fr_auto]"
              style={{ borderColor: colors.border }}
            >
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  {exp.title}
                </h3>
                <p
                  className="mt-0.5 font-semibold"
                  style={{ color: colors.accent }}
                >
                  {exp.company}
                  {exp.location ? <span className="font-normal text-sm" style={{ color: colors.muted }}> · {exp.location}</span> : null}
                </p>
                {exp.description && (
                  <p
                    className="mt-3 text-sm leading-relaxed max-w-2xl"
                    style={{ color: colors.muted }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <span
                  className="inline-block rounded px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.muted,
                    borderRadius: radius,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {formatDateRange(exp) || (exp.current ? 'Current' : '')}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
