# FOLVIRA

### Your Identity. Your Work. Your Portfolio.

FOLVIRA is a production-ready, AI-powered personal portfolio and brand builder. It empowers software engineers, designers, and tech professionals to aggregate their career history, normalize profile data from diverse sources (such as resumes and GitHub), generate tailored portfolios across distinct aesthetic templates, refine them with a live split-pane visual editor, and publish immutable portfolio snapshots at dedicated public URLs (`/p/:slug`).

FOLVIRA is organized as a **clean, decoupled two-application monorepo**:
- **`frontend/`**: Modern React 19 SPA powered by Vite, Tailwind CSS, and Framer Motion.
- **`backend/`**: High-performance Node.js / Express 5 API powered by TypeScript and MongoDB Atlas via Mongoose.

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

## Monorepo Architecture

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
    [ frontend/ — Vite + React 19 SPA ]
             │  • Route-level React.lazy() code-splitting
             │  • Split vendor chunks (vendor-react, vendor-motion)
             │  • Tailwind CSS + Framer Motion Design Tokens
             │
             ▼  HTTP Requests (Credentials: include, JSON API)
    [ backend/ — Express 5 Backend (Node.js + TypeScript) ]
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
- **Resume Import**: Upload PDF/DOCX resumes to extract career milestones automatically in-memory.
- **GitHub Import**: Connect GitHub username to pull top repositories, stars, languages, and commit activity directly into project entries.
- **Completeness Meter**: Dynamic calculation of profile completeness with actionable suggestions.

### 2. AI Profile Intelligence
- **Profile Quality Score**: Multi-factor evaluation rating completeness, clarity, impact metrics, and keyword strength.
- **Headline & Bio Suggestions**: Generate role-specific, editorial headlines and elevator bios tailored to your target position.
- **Bullet Point Refinement**: Action-verb driven enhancement of job experience and project descriptions.
- **Graceful Fallback**: Fully functional even when an AI API key is not configured, providing rule-based mock fallbacks.

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

## Monorepo Directory Structure

```text
FOLVIRA/
├── .gitignore                      # Monorepo root gitignore
├── README.md                       # Comprehensive documentation & deployment guide
├── package.json                    # Root package with npm workspaces & convenience scripts
│
├── frontend/                       # Frontend SPA Application
│   ├── public/                     # Static assets & favicon
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ai/                 # AnalysisPanel, QualityScore, SuggestionCard
│   │   │   ├── auth/               # AuthLayout, FormField, ProtectedRoute
│   │   │   ├── common/             # Button, ConfirmModal, Icons, Reveal
│   │   │   ├── landing/            # Hero, Features, HowItWorks, Templates, FinalCta
│   │   │   ├── layout/             # AppLayout, Navbar, Footer
│   │   │   ├── portfolio/          # Editor, Preview, TemplateRegistry, Sections
│   │   │   │   ├── sections/       # Hero, About, Projects, Experience, Skills, etc.
│   │   │   │   └── templates/      # Developer, Editorial, Minimal templates
│   │   │   └── profile/            # Experience, Education, Project, Skill forms
│   │   ├── context/                # AuthContext
│   │   ├── data/                   # Landing page copy & mock data
│   │   ├── lib/                    # API client (fetch wrapper with credentials)
│   │   ├── pages/                  # Route components (lazy-loaded with React.lazy)
│   │   │   ├── app/                # Dashboard, ProfileEditor, GitHub/Resume import
│   │   │   ├── auth/               # Login, Signup, ResetPassword, VerifyEmail
│   │   │   ├── portfolio/          # Editor, Workspace, Preview, PortfolioList
│   │   │   ├── public/             # PublicPortfolioPage (/p/:slug)
│   │   │   └── LandingPage.tsx     # Homepage marketing landing
│   │   ├── styles/                 # Global styles & design tokens
│   │   │   ├── index.css
│   │   │   └── tokens.css
│   │   ├── types/                  # Decoupled frontend TypeScript definitions
│   │   ├── App.tsx                 # Router definition & Suspense boundary
│   │   └── main.tsx                # Client entry point
│   ├── index.html                  # HTML entry point with font preloads
│   ├── package.json                # Frontend dependencies & scripts
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts          # Design tokens & extended palette
│   ├── tsconfig.app.json           # Client app TSConfig
│   ├── tsconfig.json               # Root frontend TSConfig
│   ├── tsconfig.node.json          # Vite TSConfig
│   └── vite.config.ts              # Proxy & vendor chunk splitting configuration
│
└── backend/                        # Express 5 Backend API
    ├── src/
    │   ├── app.ts                  # Express application factory & middleware stack
    │   ├── index.ts                # Server entry point & graceful shutdown
    │   ├── config/                 # env.ts, db.ts, logger.ts
    │   ├── controllers/            # auth, profile, ai, portfolio, public handlers
    │   ├── middleware/             # authenticate, rateLimiter, sanitize, upload, etc.
    │   ├── models/                 # User, Profile, Portfolio, DataSource, AISuggestion
    │   ├── routes/                 # Express route declarations
    │   ├── services/               # auth, profile, ai, portfolio, email, github, resume
    │   └── types/                  # Express TypeScript declaration merging
    ├── tests/                      # Automated test suites
    │   ├── test-api.js             # Phase 3 Smoke verification
    │   ├── test-portfolio.js       # Phase 5 Portfolio test suite
    │   ├── test-phase6.js          # Phase 6 Visual Editor test suite
    │   ├── test-phase7.js          # Phase 7 Publishing test suite
    │   ├── test-phase8.js          # Phase 8 SEO & Accessibility test suite
    │   ├── test-phase9.js          # Phase 9 Production Readiness test suite
    │   └── test-ai.js              # Phase 4 AI Profile Intelligence test suite
    ├── .env                        # Local untracked environment secrets
    ├── .env.example                # Documented environment variable template
    ├── package.json                # Backend dependencies & test scripts
    ├── package-lock.json
    └── tsconfig.json               # Backend TypeScript configuration
```

---

## Tech Stack

### Frontend (`frontend/`)
- **Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 7
- **Routing**: React Router 7 (Route-level lazy loading with Suspense)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Animations**: Framer Motion
- **Form & Validation**: Zod, React Hook Form
- **Icons**: Lucide React

### Backend (`backend/`)
- **Runtime**: Node.js (v18+)
- **Framework**: Express 5, TypeScript
- **Database**: MongoDB Atlas via Mongoose 8
- **Security**: Helmet, CORS, bcryptjs, crypto, express-rate-limit
- **Authentication**: JWT (JSON Web Tokens) in HTTP-only, SameSite=Lax cookies
- **Validation**: express-validator, input sanitization middleware
- **Email**: Nodemailer (SMTP transport)
- **AI Integration**: OpenAI SDK (with graceful mock provider fallback)

---

## Environment Variables

Configure environment variables in `backend/.env`. Copy from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Purpose / Production Requirement |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Set to `production` in production, `test` during mock testing |
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
- **MongoDB**: Free MongoDB Atlas cluster or local MongoDB instance

### 2. Installation

You can install dependencies independently in both sub-applications:

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

Or from the repository root using npm workspaces:
```bash
npm install
```

### 3. Configure Local Environment
Create `backend/.env` and set:
```dotenv
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/folvira?retryWrites=true&w=majority
JWT_SECRET=development_secret_key_at_least_32_characters_long_for_testing
FRONTEND_URL=http://localhost:5173
```

### 4. Running the Applications

#### Option A: Running from Sub-directories
In terminal 1 (Backend):
```bash
cd backend
npm run dev
```
The server will start at `http://localhost:3001`.

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
The client will start at `http://localhost:5173` with automatic API proxying to `http://localhost:3001`.

#### Option B: Running from Repository Root
In terminal 1 (Backend):
```bash
npm run dev:backend
```
In terminal 2 (Frontend):
```bash
npm run dev:frontend
```

---

## Verification & Testing Suites

FOLVIRA includes comprehensive regression and integration test suites located in `backend/tests/`:

| Suite | Command (from backend/) | Command (from root) | What It Verifies |
|---|---|---|---|
| **Smoke API** | `npm run test:smoke` | `npm run test:smoke` | Auth, profile CRUD, GitHub import, resume upload |
| **Portfolio (Phase 5)** | `npm run test:portfolio` | `npm run test:portfolio` | Multi-portfolio CRUD, templates, themes, ownership isolation |
| **Visual Editor (Phase 6)** | `npm run test:phase6` | `npm run test:phase6` | Live split-pane editor, drag reordering, custom overrides, immutability |
| **Publishing (Phase 7)** | `npm run test:phase7` | `npm run test:phase7` | Static snapshots, unpublishing, slug collision protection, public access |
| **SEO & Access (Phase 8)** | `npm run test:phase8` | `npm run test:phase8` | Public experience, OpenGraph/Twitter SEO tags, data redaction |
| **Production (Phase 9)** | `npm run test:phase9` | `npm run test:phase9` | Security headers, CORS, size limits, NoSQL injection filter, /health |
| **AI Intelligence (Phase 4)**| `npm run test:ai` | `npm run test:ai` | Quality scoring, headline generator, bio enhancement, mock fallbacks |

*Note: The backend server must be running (`npm run dev` in `backend/`) before executing the test commands.*

---

## Production Build & Deployment Guide

FOLVIRA is cloud-ready and easily deployable to AWS EC2, DigitalOcean Droplets, Render, Railway, or standard VPS providers.

### 1. Building the Applications

Build both frontend and backend from the root:
```bash
npm run build
```
Or build each independently:
```bash
# Frontend build
cd frontend
npm run build
# Outputs optimized static bundle to frontend/dist/

# Backend build
cd backend
npm run build
# Compiles TypeScript to backend/dist/
```

### 2. Running the Backend in Production
```bash
cd backend
NODE_ENV=production npm start
```
Starts `dist/index.js`. Startup validation automatically confirms JWT secret strength and production configuration before opening network sockets.

### 3. Production Deployment Architecture (AWS EC2 + Nginx + PM2)

In production, run the Express backend with **PM2** process manager and serve the Vite SPA and reverse-proxy API requests using **Nginx**:

```text
               Internet (Port 80/443)
                         │
                         ▼
                   [ Nginx Reverse Proxy ]
                   ├── /api/*   ──►  Proxy to Express Backend (http://127.0.0.1:3001)
                   ├── /health  ──►  Proxy to Express Backend (http://127.0.0.1:3001/health)
                   └── /*       ──►  Serve static frontend files from /var/www/folvira/frontend/dist
```

#### Sample Nginx Configuration (`/etc/nginx/sites-available/folvira`)
```nginx
server {
    listen 80;
    server_name folvira.co www.folvira.co;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name folvira.co www.folvira.co;

    ssl_certificate /etc/letsencrypt/live/folvira.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/folvira.co/privkey.pem;

    # Static Frontend SPA
    root /var/www/folvira/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA Fallback: route everything to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
    }
}
```

#### Starting Backend with PM2:
```bash
cd /var/www/folvira/backend
NODE_ENV=production pm2 start dist/index.js --name "folvira-api"
pm2 save
pm2 startup
```

### 4. Health & Liveness Checks
The backend provides dedicated health probe endpoints at `/health` and `/api/health`:
- Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "environment": "production",
    "timestamp": "2026-09-13T14:00:00.000Z"
  }
}
```
If the database connection degrades, status returns `503 Service Unavailable`.

---

## Security Policy

- **Topology**: Strictly designed for Same-Site topologies (e.g., `https://folvira.co` + `https://folvira.co/api`).
- **Stateless Authentication**: Signed JWTs delivered exclusively via `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookies on path `/`.
- **CORS**: Locked strictly to `FRONTEND_URL` with `credentials: true`. Wildcards are disallowed.
- **Content Security Policy (CSP)**: Strict Helmet configuration whitelist:
  - `default-src 'self'`
  - `script-src 'self'` (no `unsafe-eval` or third-party script injection)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com data:`
  - `img-src 'self' data: blob: https:`
- **Password & Token Security**: Passwords hashed with `bcryptjs` (salt rounds = 12). Reset & verification tokens hashed with `SHA-256` before persistence.
- **Defense-in-Depth Sanitization**: Recursive NoSQL injection sanitization removing MongoDB `$` operators from body, query, and params.
- **Zero Information Leakage**: Error handling generates an audit UUID (`errorId`) for internal logs, withholding stack traces and database errors from clients.

---

## License

Private & Proprietary. All rights reserved.