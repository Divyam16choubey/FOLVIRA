import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { scrollToSection } from '../../lib/scroll'
import { PricingModal } from '../common/PricingModal'

export function Footer() {
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSectionClick = (target: string) => {
    if (location.pathname === '/') {
      scrollToSection(target)
    } else {
      navigate(`/#${target}`)
    }
  }

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      scrollToSection('top')
    } else {
      navigate('/')
    }
  }

  const linkClass =
    'text-sm text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine text-left'

  return (
    <footer id="footer" className="border-t border-line bg-[var(--color-surface-muted)]">
      <div className="section-shell grid gap-12 py-14 md:grid-cols-[1.35fr_2fr] md:py-16">
        <div>
          <button
            type="button"
            onClick={handleLogoClick}
            className="font-display text-[2rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
            aria-label="FOLVIRA home"
          >
            FOLVIRA<span className="text-brass">.</span>
          </button>
          <p className="mt-4 max-w-[230px] text-sm leading-6 text-muted">
            Your identity. Your work. Your portfolio.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {/* Product */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-pine">Product</p>
            <ul className="mt-4 space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('features')}
                  className={linkClass}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('templates')}
                  className={linkClass}
                >
                  Templates
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('how-it-works')}
                  className={linkClass}
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsPricingOpen(true)}
                  className={linkClass}
                >
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-pine">Company</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:folvira784@gmail.com?subject=Hello%20FOLVIRA"
                  className={linkClass}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-pine">Legal</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/privacy" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="section-shell border-t border-ink/10 py-5 text-xs text-muted">
        © 2026 FOLVIRA. All rights reserved.
      </div>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </footer>
  )
}
