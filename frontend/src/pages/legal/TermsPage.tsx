/**
 * TermsPage.tsx — Minimal, honest terms of service for FOLVIRA.
 *
 * Plain-language terms appropriate for FOLVIRA's current stage.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../../components/layout/Navbar'
import { Footer } from '../../components/layout/Footer'

export function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — FOLVIRA'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1">
        <div className="section-shell py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-pine">
              Legal & Terms
            </p>

            <h1 className="font-display text-[clamp(2.4rem,4.5vw,3.5rem)] leading-[1.1] tracking-[-0.05em] text-ink">
              Terms of Service<span className="text-brass">.</span>
            </h1>

            <p className="mt-4 text-sm text-muted">
              Last updated: March 2026
            </p>

            <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  1. Welcome to FOLVIRA
                </h2>
                <p>
                  FOLVIRA is a platform built to help creators, developers, designers, and
                  professionals create, organize, and showcase their personal portfolios. By creating
                  an account or using the platform, you agree to these basic terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  2. Content Ownership & Responsibility
                </h2>
                <p>
                  You retain full ownership of all the work, projects, texts, and media you upload
                  to FOLVIRA. You are responsible for ensuring that your content does not violate any
                  copyrights, trademarks, or rights of others.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  3. Acceptable Use
                </h2>
                <p>
                  FOLVIRA is intended for legitimate portfolio creation and professional presentation.
                  You agree not to use FOLVIRA to publish unlawful, abusive, or harassing material,
                  or attempt to compromise the security or availability of the service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  4. Service Availability & Evolution
                </h2>
                <p>
                  FOLVIRA is currently free to use while under active development. While we make every
                  effort to keep the platform reliable, fast, and accessible, the service is provided
                  on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. Features may be updated, improved,
                  or refined as the platform evolves.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  5. Contact Us
                </h2>
                <p>
                  If you have questions regarding these terms, please reach out to us at{' '}
                  <a
                    href="mailto:folvira784@gmail.com?subject=Terms%20Inquiry"
                    className="font-bold text-pine underline hover:text-brass"
                  >
                    folvira784@gmail.com
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-12 pt-6 border-t border-line">
              <Link
                to="/"
                className="inline-flex items-center text-sm font-bold text-pine transition-colors hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
