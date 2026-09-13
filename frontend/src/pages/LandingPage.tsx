/**
 * LandingPage.tsx — Wrapper for the existing Phase 1 landing content.
 * Keeps App.tsx clean as a router and separates concerns.
 * Phase 1 components are NOT modified.
 */
import { useEffect } from 'react'
import { FinalCta } from '../components/landing/FinalCta'
import { Features } from '../components/landing/Features'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Templates } from '../components/landing/Templates'
import { scrollToSection } from '../lib/scroll'

export function LandingPage() {
  useEffect(() => {
    document.title = 'FOLVIRA — Your identity. Your work. Your portfolio.'

    const handleHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace('#', '')
        setTimeout(() => {
          scrollToSection(id)
        }, 100)
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

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
