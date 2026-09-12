/**
 * test-phase8.js — Phase 8 Public Experience, Sharing, SEO & Accessibility verification.
 *
 * Tests against a running server at http://localhost:3001.
 * Requires MongoDB connection.
 *
 * Run: node test-phase8.js
 */

const BASE = 'http://localhost:3001'
let pass = 0
let fail = 0

let cookie1 = ''
let cookie2 = ''
let portfolioId = ''
let testSlug = ''

function ok(label, value) {
  if (value) { console.log(`  ✅ ${label}`); pass++ }
  else        { console.log(`  ❌ ${label}`); fail++ }
}

async function req(method, path, body, cookie) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (cookie) opts.headers['Cookie'] = cookie
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json, headers: res.headers }
}

async function publicReq(method, path) {
  const res = await fetch(`${BASE}${path}`, { method, credentials: 'omit' })
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

async function setup() {
  section('SETUP')
  const ts = Date.now()
  testSlug = `p8-test-${ts}`

  // User 1 — portfolio owner
  const r1 = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'P8 Owner', email: `p8owner_${ts}@test.com`, password: 'TestPass123!', passwordConfirm: 'TestPass123!' }),
  })
  cookie1 = extractCookie(r1.headers)
  ok('User 1 (owner) created', r1.status === 201 && cookie1.length > 0)

  // User 2 — non-owner
  const r2 = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'P8 Other', email: `p8other_${ts}@test.com`, password: 'TestPass123!', passwordConfirm: 'TestPass123!' }),
  })
  cookie2 = extractCookie(r2.headers)
  ok('User 2 (non-owner) created', r2.status === 201 && cookie2.length > 0)

  // Populate base profile for User 1
  const profRes = await req('PUT', '/api/profile', {
    fullName: 'Elena Vance',
    headline: 'Staff Software Architect',
    about: 'Specializing in resilient distributed systems and modern web architectures.',
    location: 'Seattle, WA',
    website: 'https://elenavance.dev',
    githubUrl: 'https://github.com/elenavance',
    linkedinUrl: 'https://linkedin.com/in/elenavance',
    socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com/elenavance' }],
  }, cookie1)
  ok('User 1 profile base updated', profRes.status === 200)

  // Add structured profile items
  await req('POST', '/api/profile/experience', {
    title: 'Principal Engineer', company: 'CloudCore Inc',
    startDate: '2021-01-01', current: true,
    description: 'Architecting high-throughput messaging infrastructure.',
  }, cookie1)

  await req('POST', '/api/profile/skills', {
    skills: [
      { name: 'TypeScript', level: 'expert' },
      { name: 'Distributed Systems', level: 'advanced' },
      { name: 'Node.js', level: 'expert' },
    ],
  }, cookie1)

  await req('POST', '/api/profile/education', {
    institution: 'University of Washington', degree: 'B.S. Computer Science',
    startDate: '2014-09-01', endDate: '2018-06-01',
  }, cookie1)

  await req('POST', '/api/profile/certifications', {
    name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services',
    issueDate: '2022-04-15',
  }, cookie1)

  await req('POST', '/api/profile/projects', {
    name: 'AeroStream', description: 'Ultra-low latency streaming broker.',
    technologies: ['Rust', 'TypeScript', 'WebSockets'],
    url: 'https://github.com/elenavance/aerostream',
  }, cookie1)

  // Create portfolio for User 1 with custom slug
  const portRes = await req('POST', '/api/portfolios', {
    name: 'Elena Vance Portfolio',
    template: 'developer',
    slug: testSlug,
  }, cookie1)
  portfolioId = portRes.body?.data?.portfolio?._id ?? ''
  ok('User 1 portfolio created', portRes.status === 201 && !!portfolioId)
  ok('Portfolio slug matches', portRes.body?.data?.portfolio?.slug === testSlug)

  // Update portfolio theme
  const themeRes = await req('PATCH', `/api/portfolios/${portfolioId}/theme`, {
    font: 'inter',
    headingFont: 'playfair',
    accent: 'forest',
    background: 'dark',
    radius: 'rounded',
    animation: 'subtle',
  }, cookie1)
  ok('Portfolio theme configured', themeRes.status === 200)

  // Update portfolio SEO metadata
  const patchRes = await req('PATCH', `/api/portfolios/${portfolioId}`, {
    seo: {
      title: 'Elena Vance — Staff Software Architect',
      description: 'Specializing in resilient distributed systems and modern web architectures.',
    },
  }, cookie1)
  ok('Portfolio SEO configured', patchRes.status === 200)
}

async function testPublicExperience() {
  section('PHASE 8: PUBLIC EXPERIENCE & SNAPSHOT RESOLUTION')

  // 1. Publish validation pre-check
  const valRes = await req('GET', `/api/portfolios/${portfolioId}/publish/validate`, null, cookie1)
  ok('Publish validation passes', valRes.status === 200 && valRes.body?.data?.valid === true)

  // 2. Publish portfolio
  const pubRes = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
  ok('Portfolio published successfully', pubRes.status === 200 && pubRes.body?.data?.portfolio?.status === 'published')
  const publishedSlug = pubRes.body?.data?.portfolio?.slug
  ok('Published portfolio has slug', publishedSlug === testSlug)

  // 3. Public access via public endpoint (no auth cookie)
  const pubGet = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Public endpoint returns 200 OK without auth', pubGet.status === 200)
  ok('Public endpoint success envelope is true', pubGet.body?.success === true)

  const snap = pubGet.body?.data
  ok('Public data contains snapshot payload', !!snap)
  ok('Public status is published', snap?.status === 'published')
  ok('Public template matches developer', snap?.template === 'developer')

  // 4. Section structure verification (Phase 8 IDs and anchor support)
  const sectionTypes = snap?.sections?.map(s => s.type) || []
  const expectedSections = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact']
  const hasAllExpected = expectedSections.every(s => sectionTypes.includes(s))
  ok('Snapshot contains all 8 section types for navigation and anchors', hasAllExpected)

  // 5. Populated profile verification
  ok('Profile fullName is correct', snap?.profile?.fullName === 'Elena Vance')
  ok('Profile headline is present', snap?.profile?.headline === 'Staff Software Architect')
  ok('Profile about is present', snap?.profile?.about?.length > 0)
  ok('Profile experience array is populated', snap?.profile?.experience?.length > 0)
  ok('Profile projects array is populated', snap?.profile?.projects?.length > 0)
  ok('Profile skills array is populated', snap?.profile?.skills?.length > 0)
  ok('Profile education array is populated', snap?.profile?.education?.length > 0)
  ok('Profile certifications array is populated', snap?.profile?.certifications?.length > 0)
  ok('Profile contact fields are populated', snap?.profile?.website === 'https://elenavance.dev')

  // 6. Theme and SEO payload verification
  ok('SEO title matches configuration', snap?.seo?.title === 'Elena Vance — Staff Software Architect')
  ok('SEO description matches configuration', snap?.seo?.description?.includes('distributed systems'))
  ok('Theme heading font matches playfair', snap?.theme?.headingFont === 'playfair')
  ok('Theme background matches dark', snap?.theme?.background === 'dark')
  ok('Theme animation matches subtle', snap?.theme?.animation === 'subtle')
}

async function testSecurityAndIsolation() {
  section('PHASE 8: SECURITY, PRIVACY & REDACTION')

  const pubGet = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  const snap = pubGet.body?.data

  // 1. Sensitive user fields never leaked
  ok('No passwordHash in public payload', !snap?.passwordHash && !snap?.profile?.passwordHash)
  ok('No emailVerificationToken in public payload', !snap?.emailVerificationToken)
  ok('No passwordResetToken in public payload', !snap?.passwordResetToken)
  ok('No userId exposed in public payload', !snap?.userId && !snap?.profile?.userId)
  ok('No profileId exposed in public payload', !snap?.profileId)

  // 2. Draft-only data never leaked
  ok('No draft overrides exposed in public snapshot', snap?.overrides === undefined)
  ok('No draft selections exposed in public snapshot', snap?.selections === undefined)

  // 3. Unauthorized access controls
  const unpubUnauthorized = await req('POST', `/api/portfolios/${portfolioId}/unpublish`, {}, cookie2)
  ok('User 2 cannot unpublish User 1 portfolio', unpubUnauthorized.status === 403 || unpubUnauthorized.status === 404)

  const pubUnauthorized = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie2)
  ok('User 2 cannot publish User 1 portfolio', pubUnauthorized.status === 403 || pubUnauthorized.status === 404)
}

async function testUnpublishAndStateTransitions() {
  section('PHASE 8: UNPUBLISH, 404 RESOLUTION & DRAFT PRESERVATION')

  // 1. Owner unpublishes
  const unpubRes = await req('POST', `/api/portfolios/${portfolioId}/unpublish`, {}, cookie1)
  ok('Owner can unpublish portfolio', unpubRes.status === 200 && unpubRes.body?.data?.portfolio?.status === 'draft')

  // 2. Public URL returns 404 after unpublish
  const pub404 = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Unpublished portfolio returns 404 at public endpoint', pub404.status === 404)
  ok('404 response has success=false', pub404.body?.success === false)

  // 3. Draft is preserved for owner
  const draftGet = await req('GET', `/api/portfolios/${portfolioId}`, null, cookie1)
  ok('Draft is still fully accessible to owner', draftGet.status === 200 && draftGet.body?.data?.portfolio?._id === portfolioId)
  ok('Owner draft status is draft', draftGet.body?.data?.portfolio?.status === 'draft')

  // 4. Re-publishing works cleanly
  const repubRes = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
  ok('Portfolio can be re-published cleanly', repubRes.status === 200 && repubRes.body?.data?.portfolio?.status === 'published')

  const pubReGet = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Public endpoint returns 200 again after re-publish', pubReGet.status === 200)
}

async function testSnapshotImmutability() {
  section('PHASE 8: SNAPSHOT IMMUTABILITY UNDER DRAFT EDITS')

  // 1. Get initial public headline
  const initialSnap = (await publicReq('GET', `/api/public/portfolio/${testSlug}`)).body?.data
  const initialHeadline = initialSnap?.profile?.headline

  // 2. Change owner's profile headline in draft
  await req('PUT', '/api/profile', {
    fullName: 'Elena Vance',
    headline: 'MODIFIED DRAFT HEADLINE — DO NOT PUBLISH',
  }, cookie1)

  // 3. Check public endpoint — headline MUST still be the snapshot version
  const postEditSnap = (await publicReq('GET', `/api/public/portfolio/${testSlug}`)).body?.data
  ok('Public snapshot remains immutable after draft edits', postEditSnap?.profile?.headline === initialHeadline)
  ok('Modified draft headline is not leaked to public', postEditSnap?.profile?.headline !== 'MODIFIED DRAFT HEADLINE — DO NOT PUBLISH')

  // 4. Re-publish to verify sync
  await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
  const rePubSnap = (await publicReq('GET', `/api/public/portfolio/${testSlug}`)).body?.data
  ok('Re-publish updates snapshot to current profile state', rePubSnap?.profile?.headline === 'MODIFIED DRAFT HEADLINE — DO NOT PUBLISH')
}

async function run() {
  console.log('Starting Phase 8 Test Suite...')
  try {
    await setup()
    await testPublicExperience()
    await testSecurityAndIsolation()
    await testUnpublishAndStateTransitions()
    await testSnapshotImmutability()
  } catch (err) {
    console.error('Fatal test error:', err)
    fail++
  }

  console.log('\n══════════════════════════════════════════════')
  console.log(`  Phase 8 Tests Complete: ${pass} passed, ${fail} failed`)
  console.log('══════════════════════════════════════════════')
  process.exit(fail > 0 ? 1 : 0)
}

run()
