/**
 * App.tsx — Root component.
 *
 * Sets up:
 * - BrowserRouter for client-side routing
 * - AuthProvider for application-wide auth state
 * - Route definitions for Phase 1 (landing) and Phase 2 (auth + dashboard)
 *
 * Phase 9: Route-level lazy loading with React.lazy() + Suspense.
 * Splits the 665KB monolithic bundle into smaller chunks loaded on demand.
 * Landing page is eagerly loaded (first impression); all others are lazy.
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { LandingPage } from './pages/LandingPage'

// ─── Phase 9: Lazy-loaded route components ───────────────────────────────────
// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))

// App pages
const DashboardPage = lazy(() => import('./pages/app/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProfileEditorPage = lazy(() => import('./pages/app/ProfileEditorPage').then(m => ({ default: m.ProfileEditorPage })))
const ResumeImportPage = lazy(() => import('./pages/app/ResumeImportPage').then(m => ({ default: m.ResumeImportPage })))
const GitHubImportPage = lazy(() => import('./pages/app/GitHubImportPage').then(m => ({ default: m.GitHubImportPage })))
const AIIntelligencePage = lazy(() => import('./pages/app/AIIntelligencePage').then(m => ({ default: m.AIIntelligencePage })))

// Portfolio pages
const PortfolioListPage = lazy(() => import('./pages/portfolio/PortfolioListPage').then(m => ({ default: m.PortfolioListPage })))
const PortfolioPreviewPage = lazy(() => import('./pages/portfolio/PortfolioPreviewPage').then(m => ({ default: m.PortfolioPreviewPage })))
const PortfolioEditorPage = lazy(() => import('./pages/portfolio/PortfolioEditorPage').then(m => ({ default: m.PortfolioEditorPage })))

// Public page
const PublicPortfolioPage = lazy(() => import('./pages/public/PublicPortfolioPage').then(m => ({ default: m.PublicPortfolioPage })))

// Content & Legal pages
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then(m => ({ default: m.TermsPage })))

// ─── Suspense fallback ───────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pine/20 border-t-pine" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/*
             * ── Landing page ────────────────────────────────────────────────
             * Uses the Phase 1 Navbar + Footer with full scroll-nav behaviour.
             * Eagerly loaded — first impression matters.
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
             * /portfolio              → list + create
             * /portfolio/:id          → Phase 6 visual editor
             * /portfolio/:id/preview  → full-screen preview / published view
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

            {/*
             * ── Phase 7: Public portfolio route ────────────────────────────
             * /p/:slug — publicly accessible published portfolio
             * NO authentication required. Published snapshot only.
             * Draft data is NEVER rendered here.
             */}
            <Route path="/p/:slug" element={<PublicPortfolioPage />} />

            {/*
             * ── Content & Legal routes ─────────────────────────────────────
             */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
