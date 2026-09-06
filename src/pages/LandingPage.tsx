/**
 * LandingPage.tsx — Wrapper for the existing Phase 1 landing content.
 * Keeps App.tsx clean as a router and separates concerns.
 * Phase 1 components are NOT modified.
 */
import { FinalCta } from '../components/landing/FinalCta'
import { Features } from '../components/landing/Features'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Templates } from '../components/landing/Templates'

export function LandingPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <Features />
      <HowItWorks />
      <Templates />
      <FinalCta />
    </main>
  )
}
