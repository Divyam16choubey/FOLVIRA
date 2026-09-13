/**
 * AuthLayout.tsx — Shared layout shell for all authentication pages.
 *
 * Matches FOLVIRA's editorial design language:
 * - Warm canvas background
 * - Centered card with soft shadow
 * - FOLVIRA wordmark links back to landing
 * - Subtle decorative arch rings (consistent with FinalCta)
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Top bar — wordmark only */}
      <header className="section-shell flex h-[72px] items-center">
        <Link
          to="/"
          className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:text-[2rem]"
          aria-label="FOLVIRA — go to homepage"
        >
          FOLVIRA<span className="text-brass">.</span>
        </Link>
      </header>

      {/* Page content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 pb-16 pt-10 sm:items-center sm:pt-4"
      >
        <div className="w-full max-w-[440px]">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-[2.1rem] leading-[1.0] tracking-[-0.055em] text-ink sm:text-[2.5rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm leading-6 text-muted">{subtitle}</p>
            )}
          </div>

          {/* Card */}
          <div className="rounded-card border border-line bg-paper p-8 shadow-soft">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
