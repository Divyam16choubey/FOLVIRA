/**
 * Shared TypeScript types for the authentication domain.
 * These mirror the SafeUser shape returned by the backend.
 * Never import server-side types directly into the frontend.
 */

export interface User {
  id: string
  name: string
  email: string
  isEmailVerified: boolean
  accountStatus: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
