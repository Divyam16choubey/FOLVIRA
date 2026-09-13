/**
 * Navbar.tsx — Phase 2 update: auth-aware navigation.
 *
 * Phase 1 design is preserved exactly. Changes:
 * - "Log in" is now a real link to /login (was PlannedNavItem)
 * - "Get started" links to /signup when unauthenticated
 * - When authenticated: shows user's first name + sign-out button
 * - All Phase 1 scroll-based nav behaviour is unchanged
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { navigation } from '../../data/landing'
import { scrollToSection } from '../../lib/scroll'
import { Button } from '../common/Button'
import { CloseIcon, MenuIcon } from '../common/Icons'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const closeAndScroll = (target: string) => {
    setIsOpen(false)
    scrollToSection(target)
  }

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => firstMenuItemRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate('/')
  }

  const firstName = user?.name.split(' ')[0]

  return (
    <header className="relative z-30">
      <motion.nav
        initial={reducedMotion ? false : { opacity: 0, y: -14 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
        className="section-shell flex h-[82px] items-center justify-between md:h-[94px]"
      >
        {/* Wordmark — scrolls to top on landing, links to / otherwise */}
        <button
          onClick={() => scrollToSection('top')}
          className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:text-[2rem]"
          aria-label="FOLVIRA home"
        >
          FOLVIRA<span className="text-brass">.</span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) =>
            item.target ? (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.target!)}
                className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
              >
                {item.label}
              </button>
            ) : (
              <PlannedNavItem key={item.label}>{item.label}</PlannedNavItem>
            )
          )}
        </div>

        {/* Desktop CTA — changes based on auth state */}
        <div className="hidden items-center gap-6 sm:flex">
          {isLoading ? null : isAuthenticated ? (
            // Authenticated state
            <>
              <Link
                to="/dashboard"
                className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
              >
                {firstName}
              </Link>
              <Button
                variant="secondary"
                onClick={() => void handleLogout()}
                className="px-5 py-3"
              >
                Sign out
              </Button>
            </>
          ) : (
            // Unauthenticated state
            <>
              <Link
                to="/login"
                className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
              >
                Log in
              </Link>
              <Button
                onClick={() => navigate('/signup')}
                showArrow
                className="px-5 py-3"
              >
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-line text-ink transition-colors hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine lg:hidden"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation"
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }}
            exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-paper shadow-soft lg:hidden"
          >
            <div className="section-shell flex flex-col py-3">
              {navigation.map((item, i) =>
                item.target ? (
                  <button
                    key={item.label}
                    ref={i === 0 ? firstMenuItemRef : undefined}
                    onClick={() => closeAndScroll(item.target!)}
                    className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    key={item.label}
                    className="py-3 text-left text-base font-bold text-muted/65"
                    title="Planned for a future release"
                  >
                    {item.label}
                    <span className="sr-only"> (planned)</span>
                  </span>
                )
              )}

              {/* Auth items in mobile menu */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
                  >
                    Dashboard
                  </Link>
                  <Button
                    onClick={() => void handleLogout()}
                    variant="secondary"
                    className="mt-3 w-full"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
                  >
                    Log in
                  </Link>
                  <Button
                    onClick={() => {
                      setIsOpen(false)
                      navigate('/signup')
                    }}
                    showArrow
                    className="mt-3 w-full"
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function PlannedNavItem({ children }: { children: string }) {
  return (
    <span
      className="cursor-default text-sm font-bold text-muted/65"
      title="Planned for a future release"
    >
      {children}
      <span className="sr-only"> (planned)</span>
    </span>
  )
}
