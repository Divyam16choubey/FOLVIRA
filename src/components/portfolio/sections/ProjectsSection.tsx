/**
 * ProjectsSection — Displays portfolio projects.
 * Renders nothing if no projects exist.
 * External links use rel="noopener noreferrer".
 * URLs are rendered as anchor elements — never executed.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily, getThemeBorderRadius } from '../../../types/portfolio'

interface ProjectsSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function ProjectsSection({ profile, theme, variant = 'editorial' }: ProjectsSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)
  const radius = getThemeBorderRadius(theme.radius)

  if (!profile.projects || profile.projects.length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        aria-labelledby="projects-heading"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            Projects
          </p>
          <h2 id="projects-heading" className="sr-only">Projects</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((proj) => (
              <article
                key={proj._id}
                className="flex flex-col gap-3 rounded p-4"
                style={{
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  borderRadius: radius,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                    {proj.name}
                  </h3>
                  <div className="flex shrink-0 gap-2">
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline"
                        style={{ color: colors.accent }}
                        aria-label={`Live demo of ${proj.name}`}
                      >
                        Demo ↗
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline"
                        style={{ color: colors.accent }}
                        aria-label={`Repository for ${proj.name}`}
                      >
                        Repo ↗
                      </a>
                    )}
                  </div>
                </div>
                {proj.description && (
                  <p className="text-xs leading-relaxed" style={{ color: colors.muted }}>
                    {proj.description}
                  </p>
                )}
                {proj.technologies.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: colors.surface,
                          color: colors.muted,
                          border: `1px solid ${colors.border}`,
                          borderRadius: radius,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        aria-labelledby="projects-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="projects-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Projects
            </h2>
          </div>
          <div className="space-y-6">
            {profile.projects.map((proj) => (
              <div key={proj._id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                    {proj.name}
                  </h3>
                  <div className="flex gap-3">
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs hover:underline" style={{ color: colors.accent }}>
                        Live ↗
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs hover:underline" style={{ color: colors.accent }}>
                        Repo ↗
                      </a>
                    )}
                  </div>
                </div>
                {proj.description && (
                  <p className="mt-1 text-sm" style={{ color: colors.muted }}>{proj.description}</p>
                )}
                {proj.technologies.length > 0 && (
                  <p className="mt-1 text-xs" style={{ color: colors.muted }}>
                    {proj.technologies.join(' · ')}
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
      aria-labelledby="projects-heading"
      style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="mb-10">
          <p className="eyebrow" style={{ color: colors.accent }}>Work</p>
          <h2
            id="projects-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.projects.map((proj) => (
            <article
              key={proj._id}
              className="flex flex-col gap-3 p-5"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: radius,
                backgroundColor: colors.bg,
              }}
            >
              <h3 className="font-bold text-base" style={{ color: colors.text }}>
                {proj.name}
              </h3>
              {proj.description && (
                <p className="text-sm leading-relaxed" style={{ color: colors.muted }}>
                  {proj.description}
                </p>
              )}
              {proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                  {proj.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: colors.surface,
                        color: colors.muted,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {(proj.url || proj.repoUrl) && (
                <div className="flex gap-3 border-t pt-3" style={{ borderColor: colors.border }}>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold hover:underline" style={{ color: colors.accent }}>
                      Live Demo ↗
                    </a>
                  )}
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold hover:underline" style={{ color: colors.accent }}>
                      GitHub ↗
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
