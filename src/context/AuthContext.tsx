/**
 * AuthContext.tsx — Application-wide authentication state.
 *
 * On mount, calls GET /api/auth/me to restore the session from the
 * httpOnly cookie. This is the single source of truth for auth state.
 *
 * Provides login, signup, logout, and refreshUser to all descendants.
 * Never stores tokens in localStorage or sessionStorage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../lib/api'
import type { User } from '../types/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginInput {
  email: string
  password: string
}

interface SignupInput {
  name: string
  email: string
  password: string
  passwordConfirm: string
}

interface SignupResult {
  user: User
  emailVerificationSent: boolean
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  signup: (input: SignupInput) => Promise<SignupResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // true until first /me check

  /** Fetch the current user from the server cookie session. */
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me')
      setUser(data.user)
    } catch {
      // 401 means no valid session — clear user silently
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // On mount: hydrate auth state from server cookie.
  // This prevents authentication flashes on page reload.
  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (input: LoginInput) => {
    const data = await api.post<{ user: User }>('/api/auth/login', input)
    setUser(data.user)
  }, [])

  const signup = useCallback(async (input: SignupInput): Promise<SignupResult> => {
    const data = await api.post<SignupResult>('/api/auth/signup', input)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {})
    } finally {
      // Always clear local state, even if the server request fails
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

// Re-export ApiError so callers can check error types
export { ApiError }
