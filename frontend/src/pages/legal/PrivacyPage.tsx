/**
 * PrivacyPage.tsx — Minimal, honest privacy disclosure for FOLVIRA.
 *
 * Plain-language privacy overview without invented legal claims or fake certifications.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../../components/layout/Navbar'
import { Footer } from '../../components/layout/Footer'

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — FOLVIRA'
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
              Legal & Privacy
            </p>

            <h1 className="font-display text-[clamp(2.4rem,4.5vw,3.5rem)] leading-[1.1] tracking-[-0.05em] text-ink">
              Privacy Policy<span className="text-brass">.</span>
            </h1>

            <p className="mt-4 text-sm text-muted">
              Last updated: March 2026
            </p>

            <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  1. Information We Collect
                </h2>
                <p>
                  When you create an account with FOLVIRA, we collect your name and email address
                  to authenticate you and keep your account secure.
                </p>
                <p>
                  As you build your portfolio, we store the content you choose to provide, such as
                  your biography, project details, skills, social links, and uploaded assets.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  2. How We Use Information
                </h2>
                <p>
                  We use your information exclusively to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide, operate, and maintain the portfolio creation service.</li>
                  <li>Host and display your published portfolio snapshots when you choose to publish.</li>
                  <li>Communicate with you regarding account security, verification, and critical service updates.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  3. What We Do Not Do
                </h2>
                <p>
                  We believe your work and data belong to you. We do not sell, rent, or monetize
                  your personal information or portfolio content to third-party data brokers or
                  advertisers. We do not inject third-party advertising trackers into your published portfolios.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  4. Data Ownership & Deletion
                </h2>
                <p>
                  You can update or remove your portfolio content at any time through your dashboard.
                  If you wish to delete your account and associated data, please contact us directly.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  5. Contact Us
                </h2>
                <p>
                  If you have questions about this privacy policy or how your data is handled, feel
                  free to contact us at{' '}
                  <a
                    href="mailto:folvira784@gmail.com?subject=Privacy%20Inquiry"
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
