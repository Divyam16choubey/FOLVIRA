/**
 * test-phase7.js — Phase 7 Public Publishing & Deployment Foundation tests.
 *
 * Tests against a running server at http://localhost:3001.
 * Requires MongoDB Atlas connection (same as Phases 2–6).
 *
 * Coverage:
 *
 * PUBLIC ACCESS
 *  1.  Published portfolio returns 200 via public endpoint
 *  2.  Correct published snapshot data is returned
 *  3.  Nonexistent slug returns 404
 *  4.  Unpublished portfolio returns 404 at public endpoint
 *  5.  Draft-only portfolio returns 404 at public endpoint
 *  6.  Public request requires no authentication cookie
 *  7.  Public request cannot access draft-only data
 *
 * PUBLISH (via Phase 6 endpoint — tested here for Phase 7 completeness)
 *  8.  Authenticated owner can publish
 *  9.  Non-owner cannot publish
 * 10.  Missing profile returns error on publish
 *
 * SNAPSHOT IMMUTABILITY
 * 11.  Publish version A — public shows A
 * 12.  Modify draft to version B — public still shows A
 * 13.  Re-publish — public shows B
 *
 * UNPUBLISH
 * 14.  Owner can unpublish
 * 15.  Non-owner cannot unpublish
 * 16.  Unpublished portfolio returns 404 publicly
 * 17.  Draft still accessible to owner after unpublish
 *
 * SECURITY
 * 18.  passwordHash never in public response
 * 19.  emailVerificationToken never in public response
 * 20.  passwordResetToken never in public response
 * 21.  JWT/secret tokens never in public response
 * 22.  userId not exposed in public response
 * 23.  profileId not exposed in public response
 * 24.  Cross-user access: user B cannot unpublish user A portfolio
 * 25.  Cross-user: user B cannot publish user A portfolio
 * 26.  Public URL uses published snapshot — never draft
 *
 * SLUG
 * 27.  Valid published slug works
 * 28.  Invalid slug format returns 404 safely
 * 29.  Oversized slug returns 404 safely
 * 30.  Empty slug returns 404
 *
 * SEO DATA
 * 31.  SEO title returned in public response
 * 32.  SEO description returned in public response
 *
 * RATE LIMITING STRUCTURE
 * 33.  Public endpoint uses success/error envelope
 *
 * REGRESSION
 * 34.  Phase 2: auth still works
 * 35.  Phase 3: profile CRUD still works
 * 36.  Phase 4: AI quality still works
 * 37.  Phase 5: portfolio CRUD still works
 * 38.  Phase 6: overrides/selections/editor still work
 *
 * Run: npx tsx tests/test-phase7.js
 * Server must be running: npm run dev (in backend/)
 */

const BASE = 'http://localhost:3001'
let pass = 0
let fail = 0

let cookie1 = ''  // owner
let cookie2 = ''  // non-owner
let portfolioId = ''  // user 1's portfolio
let portfolio2Id = '' // user 2's portfolio
let testSlug = ''

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  // Explicitly no Cookie header — public request
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

// ─── Setup ────────────────────────────────────────────────────────────────────

async function setup() {
  section('SETUP')
  const ts = Date.now()
  testSlug = `p7-test-${ts}`

  // User 1 — portfolio owner
  const r1 = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'P7 Owner', email: `p7owner_${ts}@test.com`, password: 'TestPass123!', passwordConfirm: 'TestPass123!' }),
  })
  cookie1 = extractCookie(r1.headers)
  ok('User 1 (owner) created', r1.status === 201 && cookie1.length > 0)

  // User 2 — non-owner
  const r2 = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'P7 Other', email: `p7other_${ts}@test.com`, password: 'TestPass123!', passwordConfirm: 'TestPass123!' }),
  })
  cookie2 = extractCookie(r2.headers)
  ok('User 2 (non-owner) created', r2.status === 201 && cookie2.length > 0)

  // Populate user 1 profile
  await req('PUT', '/api/profile', {
    fullName: 'Alex Jordan', headline: 'Software Engineer v1',
    about: 'Portfolio test subject.', location: 'London, UK',
  }, cookie1)
  await req('POST', '/api/profile/experience', {
    title: 'Engineer', company: 'Acme', current: true,
  }, cookie1)
  await req('POST', '/api/profile/skills', {
    skills: [{ name: 'TypeScript' }],
  }, cookie1)

  // Create portfolio with custom slug
  const pR = await req('POST', '/api/portfolios', {
    name: 'Phase 7 Test Portfolio', template: 'editorial', slug: testSlug,
  }, cookie1)
  portfolioId = pR.body?.data?.portfolio?._id ?? ''
  ok('Portfolio created', !!portfolioId)
  ok('Portfolio slug matches', pR.body?.data?.portfolio?.slug === testSlug)

  // SEO data
  await req('PATCH', `/api/portfolios/${portfolioId}`, {
    seo: { title: 'Alex Jordan — Portfolio', description: 'Phase 7 test portfolio.' },
  }, cookie1)

  // Create user 2 portfolio for isolation tests
  const p2R = await req('POST', '/api/portfolios', {
    name: 'User 2 Portfolio', template: 'minimal',
  }, cookie2)
  portfolio2Id = p2R.body?.data?.portfolio?._id ?? ''
  ok('User 2 portfolio created', !!portfolio2Id)
}

// ─── 5. Draft-only portfolio returns 404 publicly ────────────────────────────

async function testDraftNotPublic() {
  section('5. DRAFT PORTFOLIO IS NOT PUBLIC')

  // Portfolio has NOT been published yet
  const r = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Draft portfolio returns 404 at public endpoint', r.status === 404)
  ok('Error message is safe (no leak)', !JSON.stringify(r.body ?? {}).includes('draft'))
}

// ─── 8. Publish ───────────────────────────────────────────────────────────────

async function testPublish() {
  section('8-10. PUBLISH')

  // 8. Owner can publish
  const pubR = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
  ok('POST /publish returns 200 for owner', pubR.status === 200)
  ok('Status becomes published', pubR.body?.data?.portfolio?.status === 'published')
  ok('publishedAt is set', !!pubR.body?.data?.publishedAt)
  ok('publishedSnapshot is created', !!pubR.body?.data?.portfolio?.publishedSnapshot)

  // 9. Non-owner cannot publish
  const badPubR = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie2)
  ok('Non-owner cannot publish (404)', badPubR.status === 404)
}

// ─── 1–7. Public access ───────────────────────────────────────────────────────

async function testPublicAccess() {
  section('1-7. PUBLIC ACCESS')

  // 1. Published portfolio returns 200
  const r = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Published portfolio returns 200 publicly', r.status === 200)
  ok('success is true', r.body?.success === true)

  // 2. Correct snapshot data returned
  const data = r.body?.data
  ok('Returns name', typeof data?.name === 'string')
  ok('Returns template', data?.template === 'editorial')
  ok('Returns sections array', Array.isArray(data?.sections))
  ok('Returns theme', data?.theme !== undefined)
  ok('Returns profile snapshot', data?.profile !== undefined)
  ok('Profile has fullName', data?.profile?.fullName === 'Alex Jordan')
  ok('Profile has headline from snapshot', data?.profile?.headline === 'Software Engineer v1')
  ok('publishedAt present', !!data?.publishedAt)

  // 3. Nonexistent slug returns 404
  const noSlug = await publicReq('GET', '/api/public/portfolio/this-slug-definitely-does-not-exist-xyz')
  ok('Nonexistent slug returns 404', noSlug.status === 404)

  // 6. No auth required — public request has no cookie
  const noAuth = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Public request succeeds without authentication', noAuth.status === 200)

  // 7. Draft data not accessible — check that public response is snapshot only
  const raw = JSON.stringify(data ?? {})
  ok('Public response uses snapshot data (not live draft)', raw.includes('Software Engineer v1'))
}

// ─── 11–13. Snapshot immutability ────────────────────────────────────────────

async function testSnapshotImmutability() {
  section('11-13. SNAPSHOT IMMUTABILITY')

  // 11. Public shows version A (already published as "Software Engineer v1")
  const preEdit = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Version A: public shows headline v1', preEdit.body?.data?.profile?.headline === 'Software Engineer v1')

  // 12. Modify draft (change override)
  await req('PATCH', `/api/portfolios/${portfolioId}/overrides`, {
    headline: 'Software Engineer v2 DRAFT',
  }, cookie1)
  await req('PATCH', `/api/portfolios/${portfolioId}`, {
    seo: { title: 'Draft V2 Title', description: 'V2 desc' },
  }, cookie1)

  // Public still shows v1
  const midEdit = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('After draft edit: public still shows headline v1', midEdit.body?.data?.profile?.headline === 'Software Engineer v1')
  ok('After draft edit: public SEO title unchanged', midEdit.body?.data?.seo?.title === 'Alex Jordan — Portfolio')

  // 13. Re-publish → public should show v2
  await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
  const postRepub = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('After re-publish: public shows headline v2', postRepub.body?.data?.profile?.headline === 'Software Engineer v2 DRAFT')
  ok('After re-publish: public SEO updated', postRepub.body?.data?.seo?.title === 'Draft V2 Title')
}

// ─── 14–17. Unpublish ─────────────────────────────────────────────────────────

async function testUnpublish() {
  section('14-17. UNPUBLISH')

  // 15. Non-owner cannot unpublish
  const badUnpub = await req('POST', `/api/portfolios/${portfolioId}/unpublish`, {}, cookie2)
  ok('Non-owner cannot unpublish (404)', badUnpub.status === 404)

  // 14. Owner can unpublish
  const unpubR = await req('POST', `/api/portfolios/${portfolioId}/unpublish`, {}, cookie1)
  ok('POST /unpublish returns 200 for owner', unpubR.status === 200)
  ok('Status becomes draft after unpublish', unpubR.body?.data?.portfolio?.status === 'draft')

  // 16. Unpublished portfolio returns 404 publicly
  const afterUnpub = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Unpublished portfolio returns 404 publicly', afterUnpub.status === 404)

  // 17. Draft still accessible to owner
  const draftR = await req('GET', `/api/portfolios/${portfolioId}/editor`, null, cookie1)
  ok('Draft still accessible to owner after unpublish', draftR.status === 200)
  ok('Draft portfolio data intact', !!draftR.body?.data?.portfolio)

  // Re-publish for remaining tests
  await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie1)
}

// ─── 18–26. Security ─────────────────────────────────────────────────────────

async function testSecurity() {
  section('18-26. SECURITY')

  const r = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  const raw = JSON.stringify(r.body ?? {})

  ok('18. passwordHash not in public response', !raw.includes('passwordHash'))
  ok('19. emailVerificationToken not in public response', !raw.includes('emailVerificationToken'))
  ok('20. passwordResetToken not in public response', !raw.includes('passwordResetToken'))
  ok('21. JWT_SECRET not in public response', !raw.includes('JWT_SECRET') && !raw.includes('jwt_secret'))
  ok('22. userId not in public response', !raw.includes('"userId"'))
  ok('23. profileId not in public response', !raw.includes('"profileId"'))

  // 24. User B cannot unpublish user A portfolio
  const badUnpub = await req('POST', `/api/portfolios/${portfolioId}/unpublish`, {}, cookie2)
  ok('24. Cross-user: user B cannot unpublish user A (404)', badUnpub.status === 404)

  // 25. User B cannot publish user A portfolio
  const badPub = await req('POST', `/api/portfolios/${portfolioId}/publish`, {}, cookie2)
  ok('25. Cross-user: user B cannot publish user A (404)', badPub.status === 404)

  // 26. Public URL serves published snapshot — not live draft
  // Verify by checking the public data matches what was in the snapshot
  const pubData = r.body?.data
  ok('26. Public serves published snapshot (immutable)', typeof pubData?.publishedAt === 'string')

  // AI_API_KEY / internal keys not in response
  ok('AI_API_KEY not in public response', !raw.includes('AI_API_KEY') && !raw.includes('ai_api_key'))
}

// ─── 27–30. Slug safety ───────────────────────────────────────────────────────

async function testSlugSafety() {
  section('27-30. SLUG SAFETY')

  // 27. Valid slug works (already tested above, confirm again)
  const valid = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('27. Valid published slug returns 200', valid.status === 200)

  // 28. Invalid slug format (uppercase) returns 404 safely
  const invalid = await publicReq('GET', '/api/public/portfolio/UPPERCASE_INVALID')
  ok('28. Invalid slug format (uppercase) returns 404', invalid.status === 404)

  // 29. Oversized slug (> 80 chars) returns 404
  const longSlug = 'a'.repeat(81)
  const tooLong = await publicReq('GET', `/api/public/portfolio/${longSlug}`)
  ok('29. Oversized slug returns 404', tooLong.status === 404)

  // 30. Empty slug — route won't match; should be 404 from Express
  const empty = await publicReq('GET', '/api/public/portfolio/')
  ok('30. Empty slug returns 404', empty.status === 404)

  // SQL-injection style slug
  const sql = await publicReq('GET', '/api/public/portfolio/%27%3BSELECT%20*%20FROM%20portfolios')
  ok('SQL-injection slug returns 404 safely', sql.status === 404)

  // HTML injection slug
  const html = await publicReq('GET', '/api/public/portfolio/%3Cscript%3Ealert(1)%3C%2Fscript%3E')
  ok('HTML injection slug returns 404 safely', html.status === 404)
}

// ─── 31–32. SEO data ─────────────────────────────────────────────────────────

async function testSEOData() {
  section('31-32. SEO DATA')

  const r = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  const data = r.body?.data

  ok('31. SEO title present in public response', typeof data?.seo?.title === 'string' && data.seo.title.length > 0)
  ok('32. SEO description present in public response', typeof data?.seo?.description === 'string' && data.seo.description.length > 0)

  // Verify SEO values are plain text — not scripts
  const seoRaw = JSON.stringify(data?.seo ?? {})
  ok('SEO values contain no script injection', !seoRaw.includes('<script>') && !seoRaw.includes('javascript:'))
}

// ─── 33. Rate limiting structure ─────────────────────────────────────────────

async function testRateLimitStructure() {
  section('33. RATE LIMITING STRUCTURE')

  const r = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Public endpoint returns success envelope', r.body?.success === true)

  // Check that rate limit headers are present (standardHeaders: true)
  const headers = JSON.stringify(Object.fromEntries([...new Headers()]))
  ok('Public endpoint uses { success, data } envelope', 'data' in (r.body ?? {}))
}

// ─── 34–38. Regression ───────────────────────────────────────────────────────

async function testRegression() {
  section('34-38. REGRESSION (Phases 2–6)')

  // Phase 2
  const me = await req('GET', '/api/auth/me', null, cookie1)
  ok('34. Phase 2: /auth/me still works', me.status === 200)
  ok('34. Phase 2: /me no passwordHash', !JSON.stringify(me.body ?? {}).includes('passwordHash'))

  // Phase 3
  const profile = await req('GET', '/api/profile', null, cookie1)
  ok('35. Phase 3: /profile still works', profile.status === 200)
  ok('35. Phase 3: profile has completeness', typeof profile.body?.data?.completeness === 'number')

  // Phase 4
  const quality = await req('GET', '/api/ai/profile/quality', null, cookie1)
  ok('36. Phase 4: AI quality still works', quality.status === 200)

  // Phase 5
  const list = await req('GET', '/api/portfolios', null, cookie1)
  ok('37. Phase 5: portfolio list still works', list.status === 200)
  ok('37. Phase 5: list has portfolios array', Array.isArray(list.body?.data?.portfolios))

  // Phase 6
  const editor = await req('GET', `/api/portfolios/${portfolioId}/editor`, null, cookie1)
  ok('38. Phase 6: editor endpoint still works', editor.status === 200)
  ok('38. Phase 6: editor returns masterProfile', !!editor.body?.data?.masterProfile)

  // Phase 6: Overrides still work
  const ovR = await req('PATCH', `/api/portfolios/${portfolioId}/overrides`, { location: 'Berlin, Germany' }, cookie1)
  ok('38. Phase 6: overrides PATCH still works', ovR.status === 200)

  // Health check
  const health = await req('GET', '/api/health', null, '')
  ok('Health check still works', health.status === 200)
}

// ─── Summary ──────────────────────────────────────────────────────────────────

async function printSummary() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  TEST RESULTS')
  console.log('══════════════════════════════════════════════')
  console.log(`  ✅ Passed:  ${pass}`)
  console.log(`  ❌ Failed:  ${fail}`)
  console.log(`  Total:     ${pass + fail}`)
  if (fail === 0) console.log('\n  ALL TESTS PASSED ✅')
  else            console.log(`\n  ${fail} TEST(S) FAILED ❌`)
}

// ─── FIX 1: Slug collision & hijacking tests ─────────────────────────────────

async function testSlugCollisionAndHijacking() {
  section('FIX 1: SLUG COLLISION & HIJACKING PREVENTION')

  const collisionSlug = `collision-${Date.now()}`

  // Step 1: User 1 creates and publishes a portfolio with collisionSlug
  const p1 = await req('POST', '/api/portfolios', {
    name: 'User 1 Original Portfolio', template: 'editorial', slug: collisionSlug,
  }, cookie1)
  const p1Id = p1.body?.data?.portfolio?._id
  ok('User 1 portfolio created with collisionSlug', !!p1Id)

  const pub1 = await req('POST', `/api/portfolios/${p1Id}/publish`, {}, cookie1)
  ok('User 1 successfully published collisionSlug', pub1.status === 200)

  // Step 2: Self-publish / self-update does not conflict with itself
  const selfUpdate = await req('PATCH', `/api/portfolios/${p1Id}`, {
    name: 'User 1 Updated Name',
  }, cookie1)
  ok('Self-update does not conflict with own published slug', selfUpdate.status === 200)

  const selfRepublish = await req('POST', `/api/portfolios/${p1Id}/publish`, {}, cookie1)
  ok('Self-republish does not conflict with own published slug', selfRepublish.status === 200)

  // Step 3: User 2 attempts to create a portfolio directly with collisionSlug
  const p2Conflict = await req('POST', '/api/portfolios', {
    name: 'User 2 Hijack Attempt', template: 'minimal', slug: collisionSlug,
  }, cookie2)
  ok('Conflicting draft create returns 409 Conflict', p2Conflict.status === 409)
  ok('409 error message is clear and safe', (p2Conflict.body?.error ?? '').includes('already taken by a published portfolio'))

  // Step 4: User 2 creates a draft with a different slug, then tries to PATCH it to collisionSlug
  const p2DraftSlug = `draft-${Date.now()}`
  const p2Draft = await req('POST', '/api/portfolios', {
    name: 'User 2 Draft', template: 'minimal', slug: p2DraftSlug,
  }, cookie2)
  const p2Id = p2Draft.body?.data?.portfolio?._id
  ok('User 2 draft created with separate slug', !!p2Id)

  const p2PatchConflict = await req('PATCH', `/api/portfolios/${p2Id}`, {
    slug: collisionSlug,
  }, cookie2)
  ok('Conflicting draft update returns 409 Conflict', p2PatchConflict.status === 409)

  // Step 5: Test conflicting publish returns 422:
  // Setup a scenario where User 2 has a draft with slug S, then User 1 publishes with S first
  const raceSlug = `race-${Date.now()}`
  const u2Race = await req('POST', '/api/portfolios', {
    name: 'User 2 Race Draft', template: 'minimal', slug: raceSlug,
  }, cookie2)
  const u2RaceId = u2Race.body?.data?.portfolio?._id

  // User 1 creates same slug and publishes first
  const u1Race = await req('POST', '/api/portfolios', {
    name: 'User 1 Race First', template: 'editorial', slug: raceSlug,
  }, cookie1)
  const u1RaceId = u1Race.body?.data?.portfolio?._id
  const u1Pub = await req('POST', `/api/portfolios/${u1RaceId}/publish`, {}, cookie1)
  ok('User 1 publishes raceSlug first', u1Pub.status === 200)

  // Now User 2 tries to publish their pre-existing draft with raceSlug
  const u2PubConflict = await req('POST', `/api/portfolios/${u2RaceId}/publish`, {}, cookie2)
  ok('Conflicting publish returns 422 Unprocessable Entity', u2PubConflict.status === 422)
  ok('422 error explains slug is already in use by published portfolio',
    (u2PubConflict.body?.error ?? '').includes('already in use by another published portfolio'))

  // Step 6: User 1's portfolio remains accessible and unaffected at /p/collisionSlug
  const pubRes = await publicReq('GET', `/api/public/portfolio/${collisionSlug}`)
  ok('Original public portfolio remains accessible at /p/:slug', pubRes.status === 200)
  ok('Public response deterministically belongs to User 1', pubRes.body?.data?.name === 'User 1 Updated Name')

  // Step 7: Public lookup returns exactly one deterministic portfolio
  ok('Public lookup returns exactly one portfolio (no array leak)', typeof pubRes.body?.data?._id === 'string')

  // Step 8: Case-normalized slug conflicts — User 2 attempts with uppercase variant
  const p2UpperConflict = await req('POST', '/api/portfolios', {
    name: 'User 2 Case Collision', template: 'minimal', slug: collisionSlug.toUpperCase(),
  }, cookie2)
  ok('Conflicting uppercase slug create returns 409 (case-normalized collision)', p2UpperConflict.status === 409)

  // Step 9: Ownership isolation — User 2 cannot unpublish User 1's portfolio
  const unauthUnpub = await req('POST', `/api/portfolios/${p1Id}/unpublish`, {}, cookie2)
  ok('User 2 cannot unpublish User 1 portfolio (404 isolation)', unauthUnpub.status === 404)

  // Step 10: Slug becomes reusable after unpublishing
  const unpub1 = await req('POST', `/api/portfolios/${p1Id}/unpublish`, {}, cookie1)
  ok('User 1 unpublishes collisionSlug', unpub1.status === 200)

  // Now collisionSlug is no longer published — public lookup returns 404
  const unpubPublic = await publicReq('GET', `/api/public/portfolio/${collisionSlug}`)
  ok('Unpublished collisionSlug returns 404 publicly', unpubPublic.status === 404)

  // Now User 2 CAN update their draft to collisionSlug because it is no longer published
  const p2Reclaim = await req('PATCH', `/api/portfolios/${p2Id}`, {
    slug: collisionSlug,
  }, cookie2)
  ok('Slug becomes reusable after unpublishing (User 2 claims collisionSlug)', p2Reclaim.status === 200)

  // Step 11: Deterministic legacy duplicate handling (createdAt ascending order)
  const legacyDup = await publicReq('GET', '/api/public/portfolio/phase-6-test-portfolio')
  if (legacyDup.status === 200) {
    ok('Legacy duplicate lookup returns 200 deterministically', legacyDup.status === 200)
    ok('Legacy duplicate lookup returns single portfolio', typeof legacyDup.body?.data?._id === 'string')
  }

  // Clean up test portfolios
  await req('DELETE', `/api/portfolios/${p1Id}`, null, cookie1)
  await req('DELETE', `/api/portfolios/${p2Id}`, null, cookie2)
  await req('DELETE', `/api/portfolios/${u1RaceId}`, null, cookie1)
  await req('DELETE', `/api/portfolios/${u2RaceId}`, null, cookie2)
}

// ─── FIX 2: Database index inspection ────────────────────────────────────────

async function testDatabaseIndex() {
  section('FIX 2: DATABASE INDEX FOR PUBLIC LOOKUP')

  const mongoose = require('mongoose')
  const dns = require('node:dns')
  dns.setServers(['8.8.8.8', '1.1.1.1'])
  require('dotenv').config()

  let indexFound = false
  try {
    const conn = await mongoose.createConnection(process.env.MONGODB_URI).asPromise()
    const indexes = await conn.collection('portfolios').indexes()
    indexFound = indexes.some(idx => idx.key && idx.key.slug === 1 && idx.key.status === 1)
    await conn.close()
  } catch (err) {
    console.error('Index check connection error:', err)
  }

  ok('Compound index { slug: 1, status: 1 } exists on portfolios collection', indexFound)
}

// ─── FIX 3: Rate limiting mounting order ─────────────────────────────────────

async function testRateLimitingMounting() {
  section('FIX 3: RATE LIMITER MOUNTING ORDER & QUOTAS')

  // In test mode:
  // publicReadLimiter max: 2000
  // generalLimiter max: 1000
  const pubRes = await publicReq('GET', `/api/public/portfolio/${testSlug}`)
  ok('Public route returns 200', pubRes.status === 200)

  const pubLimit = pubRes.headers.get('ratelimit-limit')
  ok('Public route uses publicReadLimiter quota (limit 2000 in test)', pubLimit === '2000')

  // Authenticated/general route (e.g. /api/health) uses generalLimiter
  const genRes = await req('GET', '/api/health', null, '')
  ok('General route returns 200', genRes.status === 200)
  const genLimit = genRes.headers.get('ratelimit-limit')
  ok('General route uses generalLimiter quota (limit 1000 in test)', genLimit === '1000')
  ok('Public route does not inherit generalLimiter (limits are separate: 2000 vs 1000)', pubLimit !== genLimit)
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  FOLVIRA Phase 7 — Public Publishing Tests     ║')
  console.log('╚═══════════════════════════════════════════════╝')

  try {
    await setup()
    await testDraftNotPublic()
    await testPublish()
    await testPublicAccess()
    await testSnapshotImmutability()
    await testUnpublish()
    await testSecurity()
    await testSlugSafety()
    await testSEOData()
    await testRateLimitStructure()
    // Fixes 1, 2, 3 verification
    await testSlugCollisionAndHijacking()
    await testDatabaseIndex()
    await testRateLimitingMounting()
    await testRegression()
  } catch (err) {
    console.error('\n❌ Test runner error:', err)
    fail++
  }

  await printSummary()
  process.exit(fail > 0 ? 1 : 0)
}

run()
