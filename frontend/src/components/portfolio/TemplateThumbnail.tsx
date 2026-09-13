/**
 * TemplateThumbnail — Visual mini-preview of each portfolio template.
 *
 * Uses the CSS classes already defined in src/styles/index.css for the
 * Phase 1 landing page template showcase. These are plain CSS classes —
 * no Tailwind required for the internal thumbnail structure.
 *
 * The thumbnails are purely decorative — wrapped in aria-hidden="true"
 * so screen readers don't read out the fake portfolio content.
 *
 * Usage:
 *   <TemplateThumbnail name="editorial" active={true} size="md" />
 */
import type { PortfolioTemplate } from '../../types/portfolio'

interface TemplateThumbnailProps {
  name: PortfolioTemplate
  active?: boolean
  /** sm = compact list card, md = selector button (default) */
  size?: 'sm' | 'md'
}

export function TemplateThumbnail({ name, active = false, size = 'md' }: TemplateThumbnailProps) {
  const ringClass = active
    ? 'ring-2 ring-pine ring-offset-1'
    : 'ring-0'

  const sizeClass = size === 'sm' ? 'w-full max-w-[140px]' : 'w-full'

  if (name === 'editorial') {
    return (
      <div
        className={`template-frame ${sizeClass} ${ringClass}`}
        aria-hidden="true"
        role="img"
      >
        <div className="template-top"><span>FOLVIRA</span><i /><i /></div>
        {/* Decorative portrait illustration */}
        <div
          className="portrait-wash"
          style={{ position: 'absolute', right: '-5%', top: '14%', width: '48%', height: '80%' }}
        >
          <div className="portrait-hair" />
          <div className="portrait-face" />
          <div className="portrait-neck" />
          <div className="portrait-shirt" />
          <div className="portrait-collar portrait-collar-left" />
          <div className="portrait-collar portrait-collar-right" />
          <div className="portrait-arm portrait-arm-left" />
          <div className="portrait-arm portrait-arm-right" />
        </div>
        <div className="template-editorial-copy">
          <span>Portfolio</span>
          <strong>Alex<br />Jordan</strong>
          <em>Full-Stack Developer</em>
        </div>
        <div className="template-orb" />
      </div>
    )
  }

  if (name === 'minimal') {
    return (
      <div
        className={`template-frame template-minimal ${sizeClass} ${ringClass}`}
        aria-hidden="true"
        role="img"
      >
        <div className="template-top"><span>FOLVIRA</span><i /><i /></div>
        <div className="template-minimal-copy">
          <strong>Alex<br />Jordan</strong>
          <span>Full-Stack Developer<br />London, UK</span>
        </div>
        <div className="template-minimal-line" />
      </div>
    )
  }

  // developer
  return (
    <div
      className={`template-frame template-developer ${sizeClass} ${ringClass}`}
      aria-hidden="true"
      role="img"
    >
      <div className="template-top"><span>~/portfolio</span><i /><i /></div>
      <div className="template-dev-code">
        <b>const</b> <span>engineer</span> = {'{'}
        <br />&nbsp;&nbsp;name: <span>&quot;Alex&quot;</span>,
        <br />&nbsp;&nbsp;stack: <span>[&quot;React&quot;]</span>
        <br />{'}'}
      </div>
      <div className="template-dev-window">
        <i /><i /><i />
      </div>
    </div>
  )
}
