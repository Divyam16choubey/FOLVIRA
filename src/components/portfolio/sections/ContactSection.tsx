/**
 * ContactSection — Displays contact information and social links.
 * Renders nothing if there is no contact data at all.
 * mailto: and https: links are safe; no script: or javascript: URLs are used.
 */
import type { RendererProfile, PortfolioTheme } from '../../../types/portfolio'
import { getThemeColors, getThemeHeadingFontFamily } from '../../../types/portfolio'

interface ContactSectionProps {
  profile: RendererProfile
  theme: PortfolioTheme
  variant?: 'editorial' | 'minimal' | 'developer'
}

/**
 * Validate that a URL uses http/https/mailto — never execute arbitrary protocols.
 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function safeMailto(email: string): string {
  // Basic email format check — prevent protocol injection
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return `mailto:${email}`
  }
  return '#'
}

export function ContactSection({ profile, theme, variant = 'editorial' }: ContactSectionProps) {
  const colors = getThemeColors(theme)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)

  // Don't render an empty contact section
  const hasContact = profile.email || profile.phone || profile.website ||
    profile.linkedinUrl || profile.githubUrl ||
    (profile.socialLinks && profile.socialLinks.length > 0)

  if (!hasContact) return null

  const links = [
    profile.email && { label: profile.email, href: safeMailto(profile.email), text: 'Email' },
    profile.website && isSafeUrl(profile.website) && { label: 'Website', href: profile.website, text: 'Website' },
    profile.linkedinUrl && isSafeUrl(profile.linkedinUrl) && { label: 'LinkedIn', href: profile.linkedinUrl, text: 'LinkedIn' },
    profile.githubUrl && isSafeUrl(profile.githubUrl) && { label: 'GitHub', href: profile.githubUrl, text: 'GitHub' },
    ...(profile.socialLinks || [])
      .filter((sl) => isSafeUrl(sl.url))
      .map((sl) => ({ label: sl.platform, href: sl.url, text: sl.platform })),
  ].filter(Boolean) as Array<{ label: string; href: string; text: string }>

  if (variant === 'developer') {
    return (
      <section
        aria-labelledby="contact-heading"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: colors.accent }}>
            Contact
          </p>
          <h2 id="contact-heading" className="sr-only">Contact</h2>
          <div className="flex flex-wrap gap-4">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="text-sm font-medium hover:underline"
                style={{ color: colors.accent }}
              >
                {link.text} ↗
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'minimal') {
    return (
      <section
        aria-labelledby="contact-heading"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
        className="py-12 sm:py-16"
      >
        <div className="section-shell grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <div>
            <h2
              id="contact-heading"
              className="text-xs font-extrabold uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              Contact
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="text-sm hover:underline"
                style={{ color: colors.text }}
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // editorial
  return (
    <section
      aria-labelledby="contact-heading"
      style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}
      className="py-14 sm:py-20"
    >
      <div className="section-shell">
        <div className="mb-8">
          <p className="eyebrow" style={{ color: colors.accent }}>Get in touch</p>
          <h2
            id="contact-heading"
            className="mt-2 font-display text-2xl sm:text-3xl tracking-[-0.03em]"
            style={{ fontFamily: headingFont, color: colors.text }}
          >
            Contact
          </h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="text-sm font-bold hover:underline"
              style={{ color: colors.accent }}
            >
              {link.text} →
            </a>
          ))}
        </div>
        {profile.location && (
          <p className="mt-4 text-sm" style={{ color: colors.muted }}>
            {profile.location}
          </p>
        )}
      </div>
    </section>
  )
}
