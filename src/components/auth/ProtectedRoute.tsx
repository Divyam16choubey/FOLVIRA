/**
 * ProtectedRoute.tsx — Renders children only when authenticated.
 *
 * While auth state is loading (initial /api/auth/me check), renders
 * a neutral loading state to prevent flash of unauthenticated content.
 * Once loading is complete:
 *   - Authenticated: renders children
 *   - Unauthenticated: redirects to /login (preserving intended destination)
 */
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div
            className="size-8 animate-spin rounded-full border-2 border-line border-t-pine"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Pass the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
