/**
 * SkillsSection — Displays skills/technologies.
 * Renders nothing if the skills array is empty.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily, getThemeBorderRadius } from '../../../types/portfolio'

interface SkillsSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function SkillsSection({ profile, theme, variant = 'editorial' }: SkillsSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)
  const radius = getThemeBorderRadius(theme.radius)

  if (!profile.skills || profile.skills.length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        id="skills"
        aria-labelledby="skills-heading"
        style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            Skills
          </p>
          <h2 id="skills-heading" className="sr-only">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill._id}
                className="rounded px-2.5 py-1 text-xs font-mono font-semibold"
                style={{
                  backgroundColor: colors.surface,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius,
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        id="skills"
        aria-labelledby="skills-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="skills-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Skills
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill._id}
                className="text-sm"
                style={{ color: colors.text }}
              >
                {skill.name}
                <span style={{ color: colors.border }} className="ml-2">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // editorial
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="mb-8">
          <p className="eyebrow" style={{ color: colors.accent }}>Expertise</p>
          <h2
            id="skills-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Skills & Technologies
          </h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {profile.skills.map((skill) => (
            <span
              key={skill._id}
              className="px-3 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radius,
              }}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
