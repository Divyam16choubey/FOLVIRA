# FOLVIRA

### Your Identity. Your Work. Your Portfolio.

FOLVIRA is a production-ready, AI-powered personal portfolio and brand builder. It empowers software engineers, designers, and tech professionals to aggregate their career history, normalize profile data from diverse sources (such as resumes and GitHub), generate tailored portfolios across distinct aesthetic templates, refine them with a live split-pane visual editor, and publish immutable portfolio snapshots at dedicated public URLs (`/p/:slug`).

---

## Current Status & Completed Phases

FOLVIRA has completed **Phases 1 through 9**, progressing from foundational design systems to complete end-to-end portfolio workflows, security hardening, and production deployment readiness.

| Phase | Title | Status | Description |
|---|---|---|---|
| **Phase 1** | Foundation & UI/UX | Completed | Editorial aesthetic design system, Tailwind tokens, Framer Motion, responsive navigation, accessible layouts |
| **Phase 2** | Authentication & User System | Completed | JWT in HTTP-only cookies, password hashing (bcrypt), token hashing (SHA-256), rate limiters, Helmet |
| **Phase 3** | Profile & Data Sources | Completed | Normalized professional profile (experience, education, projects, skills, certifications), resume parser, GitHub sync |
| **Phase 4** | AI Profile Intelligence | Completed | AI quality scoring, headline generator, bio enhancer, experience bullet polisher, skills suggestions with fallback |
| **Phase 5** | Portfolio Generator & Templates | Completed | Multi-portfolio support, custom slugs, 5 curated templates (Editorial, Minimal, Developer, Creative, Executive), themes |
| **Phase 6** | Visual Editor & Live Preview | Completed | Real-time split-pane editor, master profile selections, custom overrides, device preview frames (desktop/tablet/mobile) |
| **Phase 7** | Publishing & Public Portfolios | Completed | Static immutable snapshots on publish, public route `/p/:slug`, SEO & OpenGraph tags, unpublishing, private field stripping |
| **Phase 8** | Hardening & Polish | Completed | Cross-phase regression suites, responsive verification, WCAG accessibility, keyboard navigation, meta tags audit |
| **Phase 9** | Production Readiness & Performance | Completed | Startup environment validation, NoSQL injection filter, structured logging, graceful shutdown, code-splitting, `/health` endpoint |

---

## Core Product Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FOLVIRA Architecture                            │
└────────────────────────────────────────────────────────────────────────┘

    [ Browser / Client ]
             │
             ├── Static Routes (/) (/login) (/dashboard) (/portfolio/:id)
             └── Public Portfolio Route (/p/:slug)
             │
             ▼
    [ Vite + React 19 SPA ]
             │  • Route-level React.lazy() code-splitting
             │  • Split vendor chunks (vendor-react, vendor-motion)
             │  • Tailwind CSS + Framer Motion Design Tokens
             │
             ▼  HTTP Requests (Credentials: include, JSON API)
    [ Express 5 Backend (Node.js + TypeScript) ]
             │
             ├── Security & Middleware Layer
             │     ├── Helmet (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
             │     ├── CORS (strictly locked to FRONTEND_URL with credentials)
             │     ├── NoSQL Injection Protection (strips $ query operators)
             │     ├── Body Size Limits (16kb JSON & urlencoded)
             │     ├── Rate Limiters (Auth limiter, General limiter, Public read limiter)
             │     ├── Request Logger (method, route, status, duration)
             │     └── Global Error Handler (correlation IDs, safe production messages)
             │
             ├── Health & Probes: GET /health and GET /api/health
             │
             ├── API Routes
             │     ├── /api/auth       → Authentication, sessions, recovery
             │     ├── /api/profile    → Master profile, resume/GitHub imports
             │     ├── /api/ai         → Quality score, AI content generation
             │     ├── /api/portfolios → Portfolio CRUD, editor, publish/unpublish
             │     └── /api/public     → Public read-only portfolio snapshots
             │
             ▼
    [ Database & Storage ]
             ├── MongoDB Atlas (Mongoose ODM)
             │     ├── User collection (hashed credentials, token hashes)
             │     ├── Profile collection (normalized career history)
             │     └── Portfolio collection (draft settings + immutable snapshots)
             └── External Services
                   ├── OpenAI API (Profile & portfolio intelligence)
                   ├── GitHub REST API (Repository sync & language statistics)
                   └── SMTP Provider (Transactional verification & recovery emails)
```

---

## Key Features

### 1. Unified Master Profile & Data Sources
- **Normalized Schema**: Structured storage for personal info, experience, education, projects, skills, certifications, and social links.
- **Resume Import**: Upload PDF/DOCX resumes to extract career milestones automatically.
- **GitHub Import**: Connect GitHub username to pull top repositories, stars, languages, and commit activity directly into project entries.
- **Completeness Meter**: Dynamic calculation of profile completeness with actionable suggestions.

### 2. AI Profile Intelligence
- **Profile Quality Score**: Multi-factor evaluation rating completeness, clarity, impact metrics, and keyword strength.
- **Headline & Bio Suggestions**: Generate role-specific, editorial headlines and elevator bios tailored to your target position.
- **Bullet Point Refinement**: Action-verb driven enhancement of job experience and project descriptions.
- **Graceful Fallback**: Fully functional even when an AI API key is not configured, providing rule-based fallbacks.

### 3. Five Curated Portfolio Templates
- **Editorial**: Warm ivory canvas, deep charcoal serif typography, restrained brass accents, editorial hierarchy.
- **Minimal**: Clean whitespace, modern sans-serif typography, stark contrast, hyper-focused layout.
- **Developer**: Dark mode monospace aesthetic, syntax-highlighted accents, terminal-inspired project showcases.
- **Creative**: Expressive typography, asymmetric layouts, vibrant accent cards, showcase for visual craft.
- **Executive**: Classic corporate sophistication, slate tones, structured timeline hierarchy for senior leadership.

### 4. Real-Time Split-Pane Visual Editor
- **Live Preview**: Dual-pane workspace with real-time updates as you edit content, themes, or layouts.
- **Device Viewport Toggle**: Instant switching between Desktop, Tablet, and Mobile preview containers.
- **Custom Overrides**: Fine-tune portfolio-specific headlines, bios, or contact info without mutating your master profile.
- **Section Visibility & Reordering**: Toggle and drag-reorder sections (Hero, About, Projects, Experience, Skills, Education).
- **Theme Customizer**: Select font pairings, color palettes, and container widths per portfolio.

### 5. Publishing & Static Snapshots
- **Immutable Snapshot Model**: Publishing creates an isolated frozen snapshot of your profile and portfolio settings. Subsequent draft edits in the editor never alter the live public URL until explicitly republished.
- **Public Routes**: Clean `/p/:slug` public URLs accessible without authentication.
- **Automated SEO & OpenGraph**: Injects dynamic `<title>`, `<meta name="description">`, canonical URLs, and OpenGraph/Twitter card social previews.
- **Zero Data Leakage**: Public endpoints strip all private identifiers, user IDs, internal hashes, and unselected profile items.

### 6. Production-Grade Reliability & Security
- **Strict Environment Validation**: Fails fast on startup in production mode if JWT secrets are weak (< 32 chars) or if configuration points to localhost.
- **NoSQL Injection Sanitization**: Strips `$` operators recursively from query parameters, route params, and JSON bodies.
- **Structured JSON Logging**: Timestamped, leveled, redacted logging for container aggregators with request duration tracking.
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, halts incoming traffic, finishes in-flight requests, closes database connections, with a 10s watchdog timeout.
- **Health Probes**: Liveness and readiness `/health` endpoint returning database connection state, environment, and timestamps.
- **High-Performance Bundling**: Route-level lazy loading (`React.lazy`) and Rollup vendor chunking (`vendor-react`, `vendor-motion`), eliminating oversized bundle warnings.

---

## Tech Stack

### Frontend
- **Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 6
- **Routing**: React Router 7 (Route-level lazy loading with Suspense)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Animations**: Framer Motion
- **Form & Validation**: Zod, React Hook Form
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express 5, TypeScript
- **Database**: MongoDB Atlas via Mongoose 8
- **Security**: Helmet, CORS, bcryptjs, crypto, express-rate-limit
- **Authentication**: JWT (JSON Web Tokens) in HTTP-only, SameSite cookies
- **Validation**: express-validator, input sanitization middleware
- **Email**: Nodemailer (SMTP transport)
- **AI Integration**: OpenAI SDK

---

## Directory Structure

```text
FOLVIRA/
├── public/                      # Static assets & favicon
├── server/                      # Express Backend
│   ├── .env.example             # Documented environment variables
│   ├── package.json             # Backend dependencies & scripts
│   ├── tsconfig.json            # Backend TypeScript configuration
│   ├── test-api.js              # Smoke test suite
│   ├── test-phase6.js            # Phase 6 visual editor test suite
│   ├── test-phase7.js            # Phase 7 publishing test suite
│   ├── test-phase8.js            # Phase 8 regression test suite
│   ├── test-phase9.js            # Phase 9 production readiness test suite
│   └── src/
│       ├── app.ts               # Express app factory & middleware stack
│       ├── index.ts             # Server entry point & graceful shutdown
│       ├── config/              # env.ts, db.ts, logger.ts
│       ├── controllers/         # Request handlers (auth, profile, ai, portfolio, public)
│       ├── middleware/          # auth, rateLimiter, errorHandler, requestLogger, sanitize
│       ├── models/              # User, Profile, Portfolio, DataSource Mongoose schemas
│       ├── routes/              # Express route declarations
│       ├── services/            # Business logic (auth, profile, ai, portfolio, email, github)
│       └── types/               # TypeScript definitions
├── src/                         # Frontend Application
│   ├── main.tsx                 # Client entry point
│   ├── App.tsx                  # Routes & Suspense code-splitting
│   ├── index.css                # Global CSS & Tailwind layers
│   ├── components/
│   │   ├── auth/                # Login, Signup, Reset forms
│   │   ├── common/              # Buttons, inputs, modals, spinners, badges
│   │   ├── dashboard/           # Overview, stats, quick actions
│   │   ├── landing/             # Hero, features, templates preview, CTA, footer
│   │   ├── layout/              # Navbar, Sidebar, AppLayout
│   │   ├── portfolio/           # Visual editor, sections, live preview pane
│   │   └── profile/             # Experience, education, project editors, resume uploader
│   ├── context/                 # AuthContext, PortfolioContext
│   ├── hooks/                   # Custom React hooks (auth, debounce, media query)
│   ├── lib/                     # API client, fetch wrapper, utilities
│   ├── pages/                   # Lazy-loaded page components
│   └── types/                   # Frontend TypeScript contracts
├── package.json                 # Root dependencies & scripts
├── tailwind.config.ts           # Design tokens, color palette, typography
├── vite.config.ts               # Chunk splitting & proxy configuration
└── README.md
```

---

## Environment Variables

Configure environment variables in `server/.env`. Copy from `server/.env.example`:

```bash
cp server/.env.example server/.env
```

| Variable | Required | Default | Purpose / Production Requirement |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Set to `production` in production |
| `PORT` | No | `3001` | Backend HTTP listening port |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string (cannot be localhost in production) |
| `JWT_SECRET` | **Yes** | — | Secret for signing tokens (must be >= 32 chars and random in production) |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity duration |
| `FRONTEND_URL` | **Yes** | `http://localhost:5173` | Allowed CORS origin (must be your deployed domain in production) |
| `PUBLIC_ORIGIN` | No | — | Canonical URL for public portfolio links (e.g. `https://folvira.co`) |
| `EMAIL_FROM` | No | `FOLVIRA <noreply@folvira.co>` | Sender display name & email address |
| `EMAIL_HOST` | No | — | SMTP host for verification and password reset |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_USER` | No | — | SMTP username / API key |
| `EMAIL_PASS` | No | — | SMTP password / API secret |
| `AI_PROVIDER` | No | `openai` | AI integration provider |
| `AI_API_KEY` | No | — | OpenAI API key (graceful fallback if omitted) |
| `AI_MODEL` | No | `gpt-4o-mini` | OpenAI model identifier |

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster

### 2. Installation

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd server
npm install
cd ..
```

### 3. Configure Local Environment
Create `server/.env` and set:
```dotenv
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/folvira
JWT_SECRET=development_secret_key_at_least_32_characters_long_for_testing
FRONTEND_URL=http://localhost:5173
```

### 4. Running the Application

In terminal 1 (Backend):
```bash
cd server
npm run dev
```
The server will start at `http://localhost:3001`.

In terminal 2 (Frontend):
```bash
npm run dev
```
The client will start at `http://localhost:5173` with automatic API proxying.

---

## Verification & Testing Suites

FOLVIRA includes dedicated automated test suites covering all functionality:

| Suite | Command | What It Verifies |
|---|---|---|
| **API Smoke** | `node server/test-api.js` | Basic authentication & session flow |
| **Phase 6** | `npx tsx server/test-phase6.js` | Visual editor, overrides, section ordering, theme updates |
| **Phase 7** | `npx tsx server/test-phase7.js` | Publishing flow, snapshot immutability, `/p/:slug` public routes |
| **Phase 8** | `npx tsx server/test-phase8.js` | End-to-end multi-phase regression, accessibility, SEO |
| **Phase 9** | `npx tsx server/test-phase9.js` | Health probes, security headers, CORS, size limits, NoSQL sanitization |

### Running the Phase 9 Verification Suite:
Ensure the server is running on port 3001, then execute:
```bash
cd server
npx tsx test-phase9.js
```

---

## Production Build & Deployment Guide

FOLVIRA is designed to be cloud-agnostic and deployable to any standard infrastructure (Docker, Render, Railway, Fly.io, AWS, DigitalOcean, Vercel).

### 1. Building the Application

**Frontend Build:**
```bash
npm run build
```
Generates optimized, vendor-split static assets in the root `dist/` directory.

**Backend Build:**
```bash
cd server
npm run build
```
Compiles TypeScript into pure JavaScript in `server/dist/`.

### 2. Starting the Backend in Production
```bash
cd server
NODE_ENV=production npm start
```
Executes `node dist/index.js`. Startup validation ensures all production requirements are satisfied before opening socket connections.

### 3. Health & Liveness Checks
Configure container or load balancer health probes to hit:
- `GET /health` (or `GET /api/health`)
- Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "environment": "production",
    "timestamp": "2026-09-13T01:40:00.000Z"
  }
}
```
If MongoDB loses connection, the status transitions to `"degraded"` and returns HTTP `503 Service Unavailable`.

### 4. SPA Routing Configuration
When deploying the frontend SPA to static hosts (Nginx, Netlify, Vercel, Cloudflare Pages), ensure all non-asset routes fallback to `/index.html`:
- Standard route: `/dashboard`, `/portfolio/:id` -> `index.html`
- Public portfolio route: `/p/:slug` -> `index.html`

---

## Security Policy & Deployment Architecture

- **Deployment Topology**: FOLVIRA is architected for **Same-Site Deployment Topology** (Topology A). The frontend and backend reside under the same registrable site/domain (e.g., reverse proxy at `https://folvira.co` + `https://folvira.co/api`, or subdomains `https://app.folvira.co` + `https://api.folvira.co`). Cross-site deployment across separate third-party domains without a common parent site or reverse proxy is not supported with `SameSite=Lax`.
- **Authentication & Cookies**: Stateless signed JWTs with expiration, delivered strictly via `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies on `path: '/'`. Clearing cookies strictly mirrors these attributes.
- **CORS**: Strictly locked to `FRONTEND_URL` with `credentials: true` — disallowing wildcard `*` origins and blocking unauthorized cross-origin requests.
- **Content Security Policy (CSP)**: Explicit directives allowing only required resources:
  - `default-src 'self'`
  - `script-src 'self'` (strictly prohibits `'unsafe-eval'` and arbitrary remote scripts)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (allows theme styling and Google Fonts stylesheets)
  - `font-src 'self' https://fonts.gstatic.com data:` (allows Google Fonts font assets)
  - `img-src 'self' data: blob: https:` (allows HTTPS profile photos, avatars, and local upload previews)
  - `connect-src 'self' [FRONTEND_URL] [PUBLIC_ORIGIN]`
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`
- **Password Security**: Passwords hashed with `bcryptjs` (salt rounds = 12).
- **Token Protection**: Verification and reset tokens are hashed via `SHA-256` before database persistence to prevent offline token compromise.
- **Defense-in-Depth Sanitization**: Strips MongoDB query operator keys (`$gt`, `$ne`, `$regex`) across body, query, and params.
- **Security Headers**: Helmet suite enforcing `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`, and explicit CSP.
- **Zero Information Leakage**: Error handler intercepts 500 errors in production, generates a UUID `errorId` for log auditing, and returns a sanitized generic error message without stack traces or database error strings.

---

## License

Private & Proprietary. All rights reserved.