/**
 * AppLayout.tsx — Shared layout shell for all authenticated app pages.
 *
 * Consistent FOLVIRA header with navigation and sign-out.
 * Uses the same editorial design language as the landing and auth pages.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../common/Button'

interface AppLayoutProps {
  children: ReactNode
}

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard' },
  { label: 'Profile',      path: '/profile' },
  { label: 'Intelligence', path: '/profile/intelligence' },
  { label: 'Portfolio',    path: '/portfolio' },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-paper">
        <div className="section-shell flex h-[72px] items-center justify-between">
          {/* Left: wordmark + nav */}
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:text-[2rem]"
            >
              FOLVIRA<span className="text-brass">.</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={[
                      'rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-bold transition-colors duration-150',
                      isActive
                        ? 'bg-[#edf4f1] text-pine'
                        : 'text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: sign out */}
          <Button
            variant="secondary"
            className="px-4 py-2 text-sm"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
