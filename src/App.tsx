/**
 * App.tsx — Root component.
 *
 * Sets up:
 * - BrowserRouter for client-side routing
 * - AuthProvider for application-wide auth state
 * - Route definitions for Phase 1 (landing) and Phase 2 (auth + dashboard)
 *
 * Phase 1 landing page structure is preserved exactly — the LandingPage
 * wrapper simply re-exports the existing section components.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { DashboardPage } from './pages/app/DashboardPage'
import { ProfileEditorPage } from './pages/app/ProfileEditorPage'
import { ResumeImportPage } from './pages/app/ResumeImportPage'
import { GitHubImportPage } from './pages/app/GitHubImportPage'
import { AIIntelligencePage } from './pages/app/AIIntelligencePage'
import { PortfolioListPage } from './pages/portfolio/PortfolioListPage'
import { PortfolioWorkspacePage } from './pages/portfolio/PortfolioWorkspacePage'
import { PortfolioPreviewPage } from './pages/portfolio/PortfolioPreviewPage'
import { PortfolioEditorPage } from './pages/portfolio/PortfolioEditorPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/*
           * ── Landing page ────────────────────────────────────────────────
           * Uses the Phase 1 Navbar + Footer with full scroll-nav behaviour.
           */}
          <Route
            path="/"
            element={
              <div className="min-h-screen overflow-x-hidden bg-canvas text-ink">
                <a className="skip-link" href="#main-content">
                  Skip to content
                </a>
                <Navbar />
                <LandingPage />
                <Footer />
              </div>
            }
          />

          {/*
           * ── Auth pages ─────────────────────────────────────────────────
           * Use their own AuthLayout (no Footer/Navbar shell).
           */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/*
           * ── Protected app routes ────────────────────────────────────────
           * ProtectedRoute redirects to /login if not authenticated.
           */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import/resume"
            element={
              <ProtectedRoute>
                <ResumeImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import/github"
            element={
              <ProtectedRoute>
                <GitHubImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/intelligence"
            element={
              <ProtectedRoute>
                <AIIntelligencePage />
              </ProtectedRoute>
            }
          />
          {/*
           * ── Portfolio routes ────────────────────────────────────────────
           * /portfolio       → list + create
           * /portfolio/:id   → Phase 6 visual editor (replaces Phase 5 workspace)
           * /portfolio/:id/preview → full-screen preview / published view
           */}
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <PortfolioListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:id"
            element={
              <ProtectedRoute>
                <PortfolioEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:id/preview"
            element={
              <ProtectedRoute>
                <PortfolioPreviewPage />
              </ProtectedRoute>
            }
          />

          {/* 404 — redirect to landing */}
          <Route
            path="*"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-ink">
                <p className="font-display text-[4rem] leading-none tracking-[-0.06em] text-pine">
                  404
                </p>
                <p className="mt-3 text-base text-muted">Page not found.</p>
                <a
                  href="/"
                  className="mt-6 text-sm font-bold text-pine hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                >
                  ← Go home
                </a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
