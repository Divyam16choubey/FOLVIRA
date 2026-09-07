/**
 * CertificationSection — Displays professional certifications.
 * Renders nothing if certifications array is empty.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily, getThemeBorderRadius } from '../../../types/portfolio'

interface CertificationSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

export function CertificationSection({ profile, theme, variant = 'editorial' }: CertificationSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)
  const radius = getThemeBorderRadius(theme.radius)

  if (!profile.certifications || profile.certifications.length === 0) return null

  if (variant === 'developer') {
    return (
      <section
        aria-labelledby="certs-heading"
        style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        className="py-10 sm:py-14"
      >
        <div className="section-shell">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: colors.accent }}>
            Certifications
          </p>
          <h2 id="certs-heading" className="sr-only">Certifications</h2>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert) => (
              <div
                key={cert._id}
                className="rounded px-3 py-2 text-xs"
                style={{ border: `1px solid ${colors.border}`, borderRadius: radius, color: colors.text }}
              >
                <span className="font-semibold">{cert.name}</span>
                {cert.issuer && <span style={{ color: colors.muted }}> · {cert.issuer}</span>}
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
        aria-labelledby="certs-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-10 sm:py-14"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="certs-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Certifications
            </h2>
          </div>
          <ul className="space-y-2">
            {profile.certifications.map((cert) => (
              <li key={cert._id}>
                <span className="text-sm font-medium" style={{ color: colors.text }}>{cert.name}</span>
                {cert.issuer && <span className="text-sm" style={{ color: colors.muted }}> — {cert.issuer}</span>}
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer"
                    className="ml-2 text-xs hover:underline" style={{ color: colors.accent }}>
                    View ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  // editorial
  return (
    <section
      aria-labelledby="certs-heading"
      style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}
      className="py-12 sm:py-16"
    >
      <div className="section-shell">
        <div className="mb-8">
          <p className="eyebrow" style={{ color: colors.accent }}>Credentials</p>
          <h2
            id="certs-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Certifications
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.certifications.map((cert) => (
            <div
              key={cert._id}
              className="p-4"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: radius,
                backgroundColor: colors.bg,
              }}
            >
              <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                {cert.name}
              </h3>
              {cert.issuer && (
                <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                  {cert.issuer}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                {cert.date && <span className="text-xs" style={{ color: colors.muted }}>{cert.date}</span>}
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold hover:underline" style={{ color: colors.accent }}>
                    View ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
