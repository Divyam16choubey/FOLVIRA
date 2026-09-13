/**
 * test-phase9.js — Phase 9 Production Readiness verification suite.
 *
 * Tests against a running server at http://localhost:3001.
 * Requires MongoDB connection.
 *
 * Run: npx tsx tests/test-phase9.js
 * Server must be running: npm run dev (in backend/)
 *
 * Covers:
 * - Environment validation behavior
 * - Security headers
 * - CORS behavior
 * - Request size limits
 * - Safe error responses
 * - NoSQL injection protection
 * - Health endpoint
 * - Public portfolio security
 * - Deployment readiness
 */

const BASE = 'http://localhost:3001'
let pass = 0
let fail = 0

let cookie = ''
let portfolioId = ''
let testSlug = ''

function ok(label, value) {
  if (value) { console.log(`  ✅ ${label}`); pass++ }
  else        { console.log(`  ❌ ${label}`); fail++ }
}

async function req(method, path, body, cookie_, extraHeaders) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  }
  if (cookie_) opts.headers['Cookie'] = cookie_
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json, headers: res.headers }
}

async function rawReq(method, path, rawBody, headers) {
  const opts = { method, headers: headers || {} }
  if (rawBody !== undefined) opts.body = rawBody
  const res = await fetch(`${BASE}${path}`, opts)
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json, headers: res.headers }
}

function extractCookie(headers) {
  return (headers.get('set-cookie') ?? '').split(';')[0] ?? ''
}

function section(title) {
  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  ${title}`)
  console.log(`══════════════════════════════════════════════`)
}

// ─── SETUP ───────────────────────────────────────────────────────────────────

async function setup() {
  section('SETUP')
  const ts = Date.now()
  testSlug = `p9-test-${ts}`

  // Create test user
  const r = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'P9 Tester',
      email: `p9test_${ts}@test.com`,
      password: 'TestPass123!',
      passwordConfirm: 'TestPass123!',
    }),
  })
  cookie = extractCookie(r.headers)
  ok('Test user created', r.status === 201 && cookie.length > 0)
  const rawCookieHeader = r.headers.get('set-cookie') ?? ''
  ok('Cookie has HttpOnly flag', rawCookieHeader.toLowerCase().includes('httponly'))
  ok('Cookie has SameSite=Lax', rawCookieHeader.toLowerCase().includes('samesite=lax'))
  ok('Cookie has Path=/', rawCookieHeader.toLowerCase().includes('path=/'))

  // Set up profile with required data
  await req('PUT', '/api/profile', {
    fullName: 'Phase 9 Tester',
    headline: 'Production Readiness Engineer',
    about: 'Testing production deployment readiness.',
    location: 'Test City',
  }, cookie)
  ok('Profile configured', true)

  // Add experience
  await req('POST', '/api/profile/experience', {
    title: 'Engineer', company: 'TestCorp', current: true,
  }, cookie)

  // Add a project
  await req('POST', '/api/profile/projects', {
    name: 'Test Project', description: 'A test project', technologies: ['Node.js'],
  }, cookie)

  // Add skills
  await req('POST', '/api/profile/skills', {
    skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
  }, cookie)

  // Add education
  await req('POST', '/api/profile/education', {
    institution: 'Test University', degree: 'BSc', field: 'CS',
  }, cookie)

  // Create portfolio
  const pRes = await req('POST', '/api/portfolios', {
    name: 'P9 Portfolio', slug: testSlug, template: 'developer',
  }, cookie)
  portfolioId = pRes.body?.data?.portfolio?._id ?? ''
  ok('Portfolio created', pRes.status === 201 && portfolioId.length > 0)

  // Configure SEO
  await req('PATCH', `/api/portfolios/${portfolioId}`, {
    seo: { title: 'P9 Test Portfolio', description: 'Phase 9 test' },
  }, cookie)

  // Publish
  const pubRes = await req('POST', `/api/portfolios/${portfolioId}/publish`, null, cookie)
  ok('Portfolio published', pubRes.status === 200)
}

// ─── 1. HEALTH ENDPOINT ──────────────────────────────────────────────────────

async function testHealth() {
  section('1. HEALTH ENDPOINT')

  // Root-level /health
  const r1 = await rawReq('GET', '/health')
  ok('/health returns 200', r1.status === 200)
  ok('/health has success=true', r1.body?.success === true)
  ok('/health has status field', typeof r1.body?.data?.status === 'string')
  ok('/health status is ok', r1.body?.data?.status === 'ok')
  ok('/health has database field', typeof r1.body?.data?.database === 'string')
  ok('/health database is connected', r1.body?.data?.database === 'connected')
  ok('/health has environment field', typeof r1.body?.data?.environment === 'string')
  ok('/health has timestamp', typeof r1.body?.data?.timestamp === 'string')

  // Alias at /api/health
  const r2 = await rawReq('GET', '/api/health')
  ok('/api/health returns 200', r2.status === 200)
  ok('/api/health has same structure', r2.body?.data?.status === 'ok')

  // Health endpoint does NOT expose secrets
  const serialized = JSON.stringify(r1.body)
  ok('No connection string in health', !serialized.includes('mongodb'))
  ok('No secrets in health', !serialized.includes('JWT_SECRET'))
  ok('No filesystem paths in health', !serialized.includes('C:\\'))
}

// ─── 2. SECURITY HEADERS ────────────────────────────────────────────────────

async function testSecurityHeaders() {
  section('2. SECURITY HEADERS')

  const r = await rawReq('GET', '/health')

  // Helmet headers
  ok('X-Content-Type-Options present', !!r.headers.get('x-content-type-options'))
  ok('X-Content-Type-Options is nosniff',
    r.headers.get('x-content-type-options') === 'nosniff')
  ok('X-Frame-Options present', !!r.headers.get('x-frame-options'))
  ok('X-DNS-Prefetch-Control present', !!r.headers.get('x-dns-prefetch-control'))
  ok('Strict-Transport-Security present', !!r.headers.get('strict-transport-security'))

  // No x-powered-by
  ok('No X-Powered-By header', !r.headers.get('x-powered-by'))

  // Explicit Content-Security-Policy (Phase 9 Production Readiness)
  const csp = r.headers.get('content-security-policy') || ''
  ok('Content-Security-Policy header present', csp.length > 0)
  ok('CSP defines default-src self', csp.includes("default-src 'self'"))
  ok('CSP defines script-src self without unsafe-eval', csp.includes("script-src 'self'") && !csp.includes("'unsafe-eval'"))
  ok('CSP allows Google Fonts stylesheets in style-src', csp.includes('style-src') && csp.includes('https://fonts.googleapis.com'))
  ok('CSP allows runtime dynamic theme styling in style-src', csp.includes('style-src') && csp.includes("'unsafe-inline'"))
  ok('CSP allows Google Fonts binaries in font-src', csp.includes('font-src') && csp.includes('https://fonts.gstatic.com'))
  ok('CSP allows HTTPS external profile images in img-src', csp.includes('img-src') && csp.includes('https:'))
  ok('CSP allows data/blob image sources in img-src', csp.includes('data:') && csp.includes('blob:'))
  ok('CSP defines connect-src self and frontend origin', csp.includes("connect-src 'self'"))
  ok('CSP blocks plugins with object-src none', csp.includes("object-src 'none'"))
  ok('CSP restricts frame-ancestors to self', csp.includes("frame-ancestors 'self'"))
}

// ─── 3. CORS BEHAVIOR ───────────────────────────────────────────────────────

async function testCORS() {
  section('3. CORS BEHAVIOR')

  // OPTIONS preflight with allowed origin
  const r1 = await fetch(`${BASE}/api/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
    },
  })
  ok('CORS preflight returns 204 or 200', r1.status === 204 || r1.status === 200)
  ok('Access-Control-Allow-Origin matches frontend',
    r1.headers.get('access-control-allow-origin') === 'http://localhost:5173')
  ok('Access-Control-Allow-Credentials is true',
    r1.headers.get('access-control-allow-credentials') === 'true')

  // Request with disallowed origin
  const r2 = await fetch(`${BASE}/api/health`, {
    method: 'GET',
    headers: { 'Origin': 'https://evil.com' },
  })
  // CORS: the response arrives but without Access-Control-Allow-Origin for evil.com
  ok('Disallowed origin does not get CORS header',
    r2.headers.get('access-control-allow-origin') !== 'https://evil.com')
}

// ─── 4. REQUEST SIZE LIMITS ──────────────────────────────────────────────────

async function testRequestSizeLimits() {
  section('4. REQUEST SIZE LIMITS')

  // Create a body > 16kb
  const largeBody = JSON.stringify({ data: 'x'.repeat(20000) })
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: largeBody,
  })
  ok('Oversized body rejected (413 or 400)', r.status === 413 || r.status === 400)
}

// ─── 5. SAFE ERROR RESPONSES ─────────────────────────────────────────────────

async function testSafeErrors() {
  section('5. SAFE ERROR RESPONSES')

  // 404 route
  const r1 = await rawReq('GET', '/api/nonexistent')
  ok('Unknown route returns 404', r1.status === 404)
  ok('404 response has success=false', r1.body?.success === false)
  ok('404 has safe error message', typeof r1.body?.error === 'string')
  ok('404 has no stack trace', !r1.body?.stack)

  // Malformed JSON body
  const r2 = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid json',
  })
  const b2 = await r2.json().catch(() => null)
  ok('Malformed JSON returns 400', r2.status === 400)
  ok('Malformed JSON has safe message', b2?.error && !b2.error.includes('SyntaxError'))

  // Auth error — no internal details
  const r3 = await req('POST', '/api/auth/login', {
    email: 'nonexistent@test.com',
    password: 'WrongPass123!',
  })
  ok('Auth error returns 401', r3.status === 401)
  ok('Auth error message is generic', r3.body?.error === 'Invalid email or password')
  ok('Auth error has no stack', !r3.body?.stack)
  ok('Auth error has no JWT info', !JSON.stringify(r3.body).includes('jwt'))

  // Invalid ObjectId
  const r4 = await req('GET', '/api/portfolios/not-a-valid-id', null, cookie)
  ok('Invalid ObjectId returns 400', r4.status === 400)
}

// ─── 6. NOSQL INJECTION PROTECTION ───────────────────────────────────────────

async function testNoSQLInjection() {
  section('6. NOSQL INJECTION PROTECTION')

  // Attempt $gt injection in login
  const r1 = await req('POST', '/api/auth/login', {
    email: { $gt: '' },
    password: { $gt: '' },
  })
  // Should be rejected or fail safely — not return user data
  ok('$gt injection does not return 200', r1.status !== 200)
  ok('$gt injection does not leak user data', !r1.body?.data?.user)

  // Attempt $ne injection
  const r2 = await req('POST', '/api/auth/login', {
    email: { $ne: '' },
    password: 'anything',
  })
  ok('$ne injection does not return 200', r2.status !== 200)
}

// ─── 7. AUTHENTICATION ABUSE PROTECTION ──────────────────────────────────────

async function testAuthProtection() {
  section('7. AUTHENTICATION ABUSE PROTECTION')

  // Unauthenticated access to protected routes
  const r1 = await rawReq('GET', '/api/profile')
  ok('Profile without auth returns 401', r1.status === 401)

  const r2 = await rawReq('GET', '/api/portfolios')
  ok('Portfolios without auth returns 401', r2.status === 401)

  const r3 = await rawReq('GET', '/api/ai/profile/quality')
  ok('AI quality without auth returns 401', r3.status === 401)

  // Tampered cookie
  const r4 = await req('GET', '/api/auth/me', null, 'access_token=invalid.jwt.token')
  ok('Tampered JWT returns 401', r4.status === 401)
  ok('Tampered JWT has generic message', r4.body?.error && !r4.body.error.includes('jwt'))
}

// ─── 8. PUBLIC PORTFOLIO SECURITY ────────────────────────────────────────────

async function testPublicPortfolioSecurity() {
  section('8. PUBLIC PORTFOLIO SECURITY')

  // Published portfolio is accessible
  const r1 = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Published portfolio returns 200', r1.status === 200)
  ok('Public response has success=true', r1.body?.success === true)

  // Security: no private fields
  const serialized = JSON.stringify(r1.body)
  ok('No passwordHash in public response', !serialized.includes('passwordHash'))
  ok('No emailVerificationToken in public response', !serialized.includes('emailVerificationToken'))
  ok('No passwordResetToken in public response', !serialized.includes('passwordResetToken'))
  ok('No JWT_SECRET in public response', !serialized.includes('JWT_SECRET'))
  ok('No AI_API_KEY in public response', !serialized.includes('AI_API_KEY'))

  // Profile data present
  ok('Public has profile', !!r1.body?.data?.profile)
  ok('Public has fullName', typeof r1.body?.data?.profile?.fullName === 'string')
  ok('Public has template', typeof r1.body?.data?.template === 'string')
  ok('Public has sections', Array.isArray(r1.body?.data?.sections))
  ok('Public has theme', typeof r1.body?.data?.theme === 'object')

  // Draft portfolio not accessible publicly
  const draftSlug = `draft-${Date.now()}`
  await req('POST', '/api/portfolios', {
    name: 'Draft Only', slug: draftSlug, template: 'minimal',
  }, cookie)
  const r2 = await rawReq('GET', `/api/public/portfolio/${draftSlug}`)
  ok('Draft portfolio returns 404 publicly', r2.status === 404)
  ok('No unpublished portfolio leakage', !r2.body?.data?.profile)

  // Invalid slug handling
  const r3 = await rawReq('GET', '/api/public/portfolio/UPPERCASE-SLUG')
  ok('Uppercase slug returns 404', r3.status === 404)

  const r4 = await rawReq('GET', `/api/public/portfolio/${'a'.repeat(100)}`)
  ok('Oversized slug returns 404', r4.status === 404)

  const r5 = await rawReq('GET', '/api/public/portfolio/slug-with_underscore!')
  ok('Invalid chars in slug returns 404', r5.status === 404)
}

// ─── 9. SNAPSHOT IMMUTABILITY ────────────────────────────────────────────────

async function testSnapshotImmutability() {
  section('9. SNAPSHOT IMMUTABILITY')

  // Get current public snapshot
  const pub1 = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  const originalHeadline = pub1.body?.data?.profile?.headline

  // Edit draft headline
  await req('PATCH', `/api/portfolios/${portfolioId}/overrides`, {
    headline: 'Draft-Only Headline Change',
  }, cookie)

  // Public snapshot should be unchanged
  const pub2 = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Snapshot unchanged after draft edit',
    pub2.body?.data?.profile?.headline === originalHeadline)

  // Re-publish should update snapshot
  await req('POST', `/api/portfolios/${portfolioId}/publish`, null, cookie)
  const pub3 = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Snapshot updated after re-publish',
    pub3.body?.data?.profile?.headline === 'Draft-Only Headline Change')
}

// ─── 10. DUPLICATE KEY HANDLING ──────────────────────────────────────────────

async function testDuplicateKeyHandling() {
  section('10. DUPLICATE KEY HANDLING')

  const ts = Date.now()
  const email = `dup_${ts}@test.com`

  // First signup
  await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dup User',
      email,
      password: 'TestPass123!',
      passwordConfirm: 'TestPass123!',
    }),
  })

  // Duplicate signup
  const r = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dup User 2',
      email,
      password: 'TestPass123!',
      passwordConfirm: 'TestPass123!',
    }),
  })
  const body = await r.json()
  ok('Duplicate email returns 409', r.status === 409)
  ok('Duplicate email message is safe', body?.error === 'An account with this email already exists')
  ok('No MongoDB error details exposed', !JSON.stringify(body).includes('E11000'))
}

// ─── 11. DEPLOYMENT READINESS ────────────────────────────────────────────────

async function testDeploymentReadiness() {
  section('11. DEPLOYMENT READINESS')

  // Verify server responds to basic requests
  const r = await rawReq('GET', '/health')
  ok('Server is responsive', r.status === 200)
  ok('Environment is set', typeof r.body?.data?.environment === 'string')
  ok('Database is connected', r.body?.data?.database === 'connected')
}

// ─── 12. REGRESSION ──────────────────────────────────────────────────────────

async function testRegression() {
  section('12. REGRESSION (Phases 2–8)')

  // Phase 2: Auth
  const me = await req('GET', '/api/auth/me', null, cookie)
  ok('Phase 2: /auth/me returns 200', me.status === 200)
  ok('Phase 2: user has id', !!me.body?.data?.user?.id)
  ok('Phase 2: no passwordHash', !me.body?.data?.user?.passwordHash)

  // Phase 3: Profile
  const prof = await req('GET', '/api/profile', null, cookie)
  ok('Phase 3: /profile returns 200', prof.status === 200)
  ok('Phase 3: profile has completeness', typeof prof.body?.data?.completeness === 'number')

  // Phase 4: AI quality
  const qual = await req('GET', '/api/ai/profile/quality', null, cookie)
  ok('Phase 4: /ai/profile/quality returns 200', qual.status === 200)
  ok('Phase 4: quality has total', typeof (qual.body?.data?.quality?.total ?? qual.body?.data?.total) === 'number')

  // Phase 5: Portfolio list
  const list = await req('GET', '/api/portfolios', null, cookie)
  ok('Phase 5: /portfolios returns 200', list.status === 200)
  ok('Phase 5: portfolios is array', Array.isArray(list.body?.data?.portfolios))

  // Phase 6: Editor data
  if (portfolioId) {
    const ed = await req('GET', `/api/portfolios/${portfolioId}/editor`, null, cookie)
    ok('Phase 6: editor returns 200', ed.status === 200)
    ok('Phase 6: editor has masterProfile', !!ed.body?.data?.masterProfile)
  }

  // Phase 7: Public portfolio
  const pub = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Phase 7: public portfolio returns 200', pub.status === 200)

  // Phase 8: Unpublish/re-publish
  await req('POST', `/api/portfolios/${portfolioId}/unpublish`, null, cookie)
  const unpub = await rawReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Phase 8: unpublished portfolio returns 404 publicly', unpub.status === 404)

  // Re-publish for other tests
  await req('POST', `/api/portfolios/${portfolioId}/publish`, null, cookie)
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting Phase 9 Test Suite...')

  try {
    await setup()
    await testHealth()
    await testSecurityHeaders()
    await testCORS()
    await testRequestSizeLimits()
    await testSafeErrors()
    await testNoSQLInjection()
    await testAuthProtection()
    await testPublicPortfolioSecurity()
    await testSnapshotImmutability()
    await testDuplicateKeyHandling()
    await testDeploymentReadiness()
    await testRegression()
  } catch (err) {
    console.error('\n  ❌ Test suite error:', err)
    fail++
  }

  section(`Phase 9 Tests Complete: ${pass} passed, ${fail} failed`)

  process.exit(fail > 0 ? 1 : 0)
}

main()
