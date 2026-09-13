/**
 * EducationSection — Displays education history.
 * Renders nothing if the education array is empty.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily } from '../../../types/portfolio'

interface EducationSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function EducationSection({ profile, theme, variant = 'editorial' }: EducationSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)

  if (!profile.education || profile.education.length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        id="education"
        aria-labelledby="education-heading"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            Education
          </p>
          <h2 id="education-heading" className="sr-only">Education</h2>
          <div className="space-y-5">
            {profile.education.map((edu) => (
              <div key={edu._id} className="border-l-2 pl-5" style={{ borderColor: colors.border }}>
                <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                  {edu.institution}
                </h3>
                {(edu.degree || edu.field) && (
                  <p className="text-sm" style={{ color: colors.muted }}>
                    {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                  </p>
                )}
                {(edu.startDate || edu.endDate) && (
                  <p className="text-xs font-mono mt-0.5" style={{ color: colors.muted }}>
                    {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
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
        id="education"
        aria-labelledby="education-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="education-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Education
            </h2>
          </div>
          <div className="space-y-5">
            {profile.education.map((edu) => (
              <div key={edu._id}>
                <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                  {edu.institution}
                </h3>
                {(edu.degree || edu.field) && (
                  <p className="text-sm" style={{ color: colors.muted }}>
                    {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                  </p>
                )}
                {(edu.startDate || edu.endDate) && (
                  <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                    {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
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
      id="education"
      aria-labelledby="education-heading"
      style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="mb-8">
          <p className="eyebrow" style={{ color: colors.accent }}>Academic</p>
          <h2
            id="education-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Education
          </h2>
        </div>
        <div className="space-y-6">
          {profile.education.map((edu) => (
            <div
              key={edu._id}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-t pt-6"
              style={{ borderColor: colors.border }}
            >
              <div>
                <h3 className="font-bold text-base" style={{ color: colors.text }}>
                  {edu.institution}
                </h3>
                {(edu.degree || edu.field) && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: colors.accent }}>
                    {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                  </p>
                )}
                {edu.description && (
                  <p className="mt-1.5 text-sm" style={{ color: colors.muted }}>
                    {edu.description}
                  </p>
                )}
              </div>
              {(edu.startDate || edu.endDate) && (
                <span className="text-xs shrink-0" style={{ color: colors.muted }}>
                  {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
