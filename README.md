# FOLVIRA

### Your Identity. Your Work. Your Portfolio.

FOLVIRA is an AI-powered personal portfolio and personal brand builder. Its long-term purpose is to help people collect their professional information, organize it into a structured profile, and turn that information into a polished, customizable portfolio.

The project is being developed in phases. Phase 1, the frontend foundation, and Phase 2, the authentication and user system, are complete. Profile management and data sources are planned for Phase 3 and are not implemented yet.

## Current Status

### Completed

- Phase 1 - Foundation & UI/UX
- Phase 2 - Authentication & User System

### Next

- Phase 3 - Profile & Data Sources

The current dashboard is an authenticated account area. Portfolio editing, profile imports, and AI-assisted profile tools are part of future phases.

## Product Direction

FOLVIRA is being shaped around a structured professional profile rather than a one-off generated page. The planned product direction includes:

- Professional data collection and profile normalization
- AI-assisted profile improvement
- Portfolio generation and reusable templates
- Visual editing and portfolio scoring
- Job-description matching and other career-focused tools
- Publishing, deployment, custom domains, and analytics

These are product goals, not claims about functionality available in the current release.

## Phase 1: Foundation & UI/UX

Phase 1 established the responsive frontend and the visual language for FOLVIRA. The landing page includes:

- React, Vite, and TypeScript
- Tailwind CSS and Framer Motion
- Responsive navigation with a mobile menu
- Hero section with a portfolio preview
- Features, workflow/how-it-works, template studies, CTA, and footer sections
- Reusable buttons, icons, reveal animations, layouts, and form components
- Centralized design tokens for color, typography, spacing, borders, and shadows
- Responsive layouts and keyboard-visible focus states
- Reduced-motion support through Framer Motion and CSS media queries

The visual direction is editorial and minimal rather than a generic AI SaaS dashboard: warm ivory, deep charcoal, forest/olive green, restrained brass/gold, editorial typography, generous whitespace, subtle borders, and a quiet premium feel.

The current theme is the warm light design defined in the frontend tokens. A dark/light theme switch is not currently implemented.

## Phase 2: Authentication & User System

The current authentication system includes:

- Email/password signup and login
- Logout and authenticated session restoration
- JWT-based authentication stored in an HTTP-only cookie
- Protected routes and a protected `/dashboard` route
- Authenticated `/api/auth/me` session endpoint
- Email verification token infrastructure
- Forgot-password and reset-password token infrastructure
- Account deletion
- Password hashing with bcryptjs
- SHA-256 hashing for verification and reset tokens before storage
- Request validation with express-validator
- Route and API rate limiting
- Helmet security headers and configured CORS
- Safe error handling that avoids exposing authentication details
- MongoDB Atlas persistence through Mongoose

Passwords are never stored in plaintext. Authentication tokens are sent with cookies and are not stored in `localStorage` or `sessionStorage`.

### Current Authentication Flow

```text
Signup
  |
  v
Create account
  |
  v
Password hashed with bcryptjs
  |
  v
User stored in MongoDB Atlas
  |
  v
JWT authentication cookie issued
  |
  v
Protected dashboard
```

```text
Login
  |
  v
Validate credentials
  |
  v
Verify password hash
  |
  v
Issue JWT authentication cookie
  |
  v
Protected dashboard
```

## Email Status

The application contains Nodemailer-based infrastructure for email verification and password reset messages. SMTP/provider credentials are not currently configured for live delivery. As a result, verification and reset emails are not being delivered in the current local setup.

The backend keeps the token workflows and expiry checks in place, but SMTP delivery has not been tested or presented as a working production feature.

## Security

The implemented protections include:

- bcrypt password hashing with a work factor configured in the auth service
- HTTP-only authentication cookies with `SameSite=Lax`
- Secure cookies in production
- JWT expiration
- SHA-256 hashing and expiry checks for verification and reset tokens
- Per-route and general API rate limiting
- Input validation for authentication requests
- Helmet security headers
- CORS restricted to the configured frontend URL
- Safe authentication errors, including a shared invalid-credentials response
- `passwordHash` and token fields excluded from normal user responses
- Environment variables for database credentials and application secrets

These measures are part of the current foundation; they are not a claim that the application is completely secure.

## Technology

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Zod

The frontend currently includes these routes and screens:

- Landing page: `/`
- Login: `/login`
- Signup: `/signup`
- Forgot password: `/forgot-password`
- Reset password: `/reset-password`
- Verify email: `/verify-email`
- Protected dashboard: `/dashboard`

### Backend

The backend lives under `server/` and uses:

- Node.js
- Express
- TypeScript
- MongoDB Atlas and Mongoose
- JSON Web Tokens
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- express-validator
- Nodemailer infrastructure

The API currently exposes authentication routes under `/api/auth` and a health check at `/api/health`.

## MongoDB Atlas

FOLVIRA uses MongoDB Atlas through Mongoose. The backend reads the MongoDB connection string from the `MONGODB_URI` environment variable and connects before starting the HTTP server.

Create `server/.env` locally from `server/.env.example`. Never commit MongoDB URIs, usernames, passwords, JWT secrets, SMTP credentials, or other secrets to Git.

## Project Structure

```text
FOLVIRA/
├── public/
│   └── favicon.svg
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.ts
│       ├── index.ts
│       ├── config/          # Environment validation and MongoDB connection
│       ├── controllers/     # Authentication request handlers
│       ├── middleware/      # Auth, errors, and rate limiting
│       ├── models/          # Mongoose user model
│       ├── routes/          # Express route definitions
│       ├── services/        # Auth and email services
│       └── types/           # Express type extensions
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── landing/
│   │   └── layout/
│   ├── context/             # Authentication context
│   ├── data/                # Landing page content
│   ├── lib/                 # API and scroll helpers
│   ├── pages/               # Landing, auth, and dashboard pages
│   ├── styles/              # Global styles and design tokens
│   └── types/
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd FOLVIRA
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create `server/.env` from `server/.env.example` and provide a MongoDB Atlas URI and JWT secret. The backend will fail fast if required values are missing.

```dotenv
NODE_ENV=development
PORT=3001
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Optional until SMTP delivery is configured
EMAIL_FROM=FOLVIRA <noreply@example.com>
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```

`MONGODB_URI` and `JWT_SECRET` are required. The `EMAIL_*` variables are optional at startup, but email delivery remains disabled until the provider values are configured.

### 5. Start the backend

From the `server/` directory:

```bash
npm run dev
```

The API runs at `http://localhost:3001` by default.

### 6. Start the frontend

From the repository root, in a separate terminal:

```bash
npm run dev
```

The Vite development server runs at `http://localhost:5173` and proxies `/api` requests to the backend.

## Available Scripts

From the repository root:

```bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and build the frontend
npm run preview   # Preview the frontend production build
```

From `server/`:

```bash
npm run dev       # Start the backend with tsx watch
npm run build     # Compile the backend
npm run typecheck # Run the backend TypeScript check
npm start         # Start the compiled backend
```

## Verification

The completed Phase 2 verification includes:

- Frontend TypeScript check passed
- Backend TypeScript check passed
- Frontend production build passed
- Backend security dependency audit passed
- Frontend dependency audit passed
- Authentication route tests passed: 32/32 in the Phase 2 test suite
- Real MongoDB Atlas connection tested successfully
- Signup tested against the real Atlas database
- Login tested against the real Atlas database
- Protected dashboard access tested
- Logout tested
- Session persistence after browser refresh tested

SMTP delivery has not been tested because provider configuration is not currently enabled. Future profile, AI, portfolio, publishing, and career features are not implied to be tested or implemented.

## Roadmap

- [x] Phase 1 - Foundation & UI/UX: Responsive editorial landing page, reusable frontend components, design tokens, and accessibility foundations.
- [x] Phase 2 - Authentication & User System: Account creation, sessions, protected routes, token workflows, account management, and security middleware.
- [ ] Phase 3 - Profile & Data Sources: Store and manage a normalized professional profile and connect initial data sources.
- [ ] Phase 4 - AI Profile Intelligence: Assist with profile improvement, organization, and completeness.
- [ ] Phase 5 - Portfolio Generator & Templates: Transform structured profile data into selectable portfolio layouts.
- [ ] Phase 6 - Visual Editor: Add live previews and controls for editing portfolio sections and presentation.
- [ ] Phase 7 - AI Portfolio Intelligence & Career Tools: Add portfolio scoring, job-description matching, and related guidance.
- [ ] Phase 8 - Publishing & Deployment: Support portfolio publishing, deployment, and source export workflows.
- [ ] Phase 9 - Custom Domains & Analytics: Add custom domains and portfolio usage insights.
- [ ] Phase 10 - Security, Optimization & Production: Harden, optimize, and prepare the broader product for production operation.

## Next Up: Phase 3

Phase 3 will introduce the first profile and data-source layer. Planned work includes:

- Professional profile management
- Manual profile editing
- Resume PDF/DOCX import
- GitHub data import
- LinkedIn-safe integration/reference architecture
- Normalized professional data
- Data-source provenance
- Profile completeness indicators
- MongoDB-backed profile data

None of these Phase 3 capabilities are implemented in the current release.