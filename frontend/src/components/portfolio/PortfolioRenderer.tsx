/**
 * PortfolioRenderer — Central renderer that resolves templates from the registry.
 *
 * Architecture:
 *   <PortfolioRenderer portfolio={...} profile={...} />
 *       ↓
 *   resolveTemplate(portfolio.template) → TemplateComponent
 *       ↓
 *   <TemplateComponent portfolio={portfolio} profile={profile} />
 *       ↓
 *   Template reads portfolio.sections (sorted, filtered)
 *       ↓
 *   Renders section components with structured profile data
 *
 * The same renderer is used for:
 * - Portfolio workspace live preview
 * - Future published portfolio view
 *
 * Security:
 * - Template is resolved from a closed registry — no arbitrary component names.
 * - Profile content is rendered as React text nodes — no dangerouslySetInnerHTML.
 * - URLs are validated in ContactSection before rendering as links.
 */
import type { Portfolio, RendererProfile } from '../../types/portfolio'
import { resolveTemplate } from './TemplateRegistry'

interface PortfolioRendererProps {
  portfolio: Portfolio
  profile: RendererProfile | null
  /** Optional className for the renderer container. */
  className?: string
}

/**
 * Renders a fallback when there is no profile data linked to the portfolio.
 */
function EmptyProfileState({ colors }: { colors: { bg: string; text: string; muted: string } }) {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center"
      style={{ backgroundColor: colors.bg }}
    >
      <p className="text-sm font-semibold" style={{ color: colors.text }}>
        No profile data found.
      </p>
      <p className="text-xs" style={{ color: colors.muted }}>
        Add information to your Profile to see it here.
      </p>
    </div>
  )
}

export function PortfolioRenderer({
  portfolio,
  profile,
  className = '',
}: PortfolioRendererProps) {
  const TemplateComponent = resolveTemplate(portfolio.template)

  if (!profile) {
    const bg = portfolio.theme.background === 'dark' ? '#161e1b' : '#f8f5ef'
    const text = portfolio.theme.background === 'dark' ? '#f1eee6' : '#18221e'
    const muted = portfolio.theme.background === 'dark' ? '#94a39d' : '#59625c'
    return (
      <div className={className} style={{ backgroundColor: bg }}>
        <EmptyProfileState colors={{ bg, text, muted }} />
      </div>
    )
  }

  return (
    <div className={`overflow-x-hidden ${className}`}>
      <TemplateComponent portfolio={portfolio} profile={profile} />
    </div>
  )
}
