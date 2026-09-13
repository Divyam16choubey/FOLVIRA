/**
 * AboutPage.tsx — About FOLVIRA.
 *
 * Grounded, humanized overview of FOLVIRA's purpose.
 * Avoids startup hype, fabricated founders, or fake metrics.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — FOLVIRA'
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
            {/* Eyebrow */}
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-pine">
              About FOLVIRA
            </p>

            {/* Heading */}
            <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.05em] text-ink">
              Your work deserves more than a collection of scattered links<span className="text-brass">.</span>
            </h1>

            {/* Body copy */}
            <div className="mt-8 space-y-6 text-base leading-relaxed text-muted sm:text-lg sm:leading-8">
              <p>
                FOLVIRA was created around a simple idea: your work deserves more than a collection
                of scattered links or a one-page resume.
              </p>

              <p>
                Many people have valuable experiences, projects, skills, and ideas, but presenting
                them clearly can be difficult. FOLVIRA helps bring those pieces together into a
                professional portfolio that feels personal, organized, and easy to share.
              </p>

              <p>
                We’re building FOLVIRA to make it easier for students, developers, creators, and
                professionals to present their journey with confidence—without needing to spend
                hours designing a website from scratch.
              </p>
            </div>

            {/* Core Values / Grounded Points */}
            <div className="mt-12 grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
              <div className="rounded-card border border-line bg-paper p-6">
                <h2 className="font-display text-lg tracking-[-0.02em] text-ink">
                  Personal, not generic
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  A portfolio should reflect your own craft, tone, and identity rather than looking
                  like a carbon copy of a rigid template.
                </p>
              </div>

              <div className="rounded-card border border-line bg-paper p-6">
                <h2 className="font-display text-lg tracking-[-0.02em] text-ink">
                  Accessible to everyone
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Getting started shouldn’t require high costs or web design expertise. We focus on
                  helping you organize and showcase your work easily.
                </p>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-12 pt-6">
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
