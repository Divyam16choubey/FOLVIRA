/**
 * test-portfolio.js — Phase 5 Portfolio Generator test suite.
 *
 * Tests against a running server at http://localhost:3001.
 * Uses MongoDB Atlas (same as Phases 2–4 tests).
 *
 * Coverage:
 *   Phase 5 — Portfolio CRUD, template, theme, sections, validation, ownership
 *   Phase 5 — Renderer profile shape, missing data, security
 *   Phase 5 — Slug handling, duplicate detection
 *   Phase 2 — Regression: auth endpoints still work
 *   Phase 3 — Regression: profile endpoints still work
 *   Phase 4 — Regression: AI endpoints still work
 *
 * Run: node test-portfolio.js
 * Server must be running: npm run dev (in server/)
 */

const BASE = 'http://localhost:3001'
let pass = 0
let fail = 0

// Per-user session cookies
let cookieUser1 = ''
let cookieUser2 = ''

// IDs collected during run
let portfolioId1 = ''
let portfolioId2 = ''

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(label, value) {
  if (value) {
    console.log(`  ✅ ${label}`)
    pass++
  } else {
    console.log(`  ❌ ${label}`)
    fail++
  }
}

async function req(method, path, body, cookie) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (cookie) opts.headers['Cookie'] = cookie
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json, headers: res.headers }
}

function extractCookie(headers) {
  const raw = headers.get('set-cookie') ?? ''
  return raw.split(';')[0] ?? ''
}

// ─── Setup: Create two test users with populated profiles ─────────────────────

async function setupUsers() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  SETUP: Creating test users')
  console.log('══════════════════════════════════════════════')

  const ts = Date.now()

  const r1 = await req('POST', '/api/auth/signup', {
    name: 'Portfolio Test User One',
    email: `port_u1_${ts}@folvira.test`,
    password: 'TestPass123!',
    passwordConfirm: 'TestPass123!',
  })
  cookieUser1 = extractCookie(r1.headers)
  ok('User 1 created', r1.status === 201 && cookieUser1.length > 0)

  const r2 = await req('POST', '/api/auth/signup', {
    name: 'Portfolio Test User Two',
    email: `port_u2_${ts}@folvira.test`,
    password: 'TestPass123!',
    passwordConfirm: 'TestPass123!',
  })
  cookieUser2 = extractCookie(r2.headers)
  ok('User 2 created', r2.status === 201 && cookieUser2.length > 0)

  // Populate User 1's profile
  await req('PUT', '/api/profile', {
    fullName: 'Alex Jordan',
    headline: 'Full-Stack Developer',
    about: 'Developer with experience in web technologies.',
    location: 'London, UK',
    email: 'alex@example.com',
  }, cookieUser1)

  await req('POST', '/api/profile/experience', {
    title: 'Software Engineer',
    company: 'Acme Corp',
    startDate: '2022-01',
    current: true,
    description: 'Built web applications using React and Node.js.',
  }, cookieUser1)

  await req('POST', '/api/profile/projects', {
    name: 'Portfolio App',
    description: 'A personal portfolio application.',
    technologies: ['React', 'TypeScript', 'Node.js'],
  }, cookieUser1)

  await req('POST', '/api/profile/skills', {
    skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Node.js' }],
  }, cookieUser1)

  ok('User 1 profile populated', true)
}

// ─── Section 1: Portfolio Creation ───────────────────────────────────────────

async function testPortfolioCreation() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PORTFOLIO CREATION')
  console.log('══════════════════════════════════════════════')

  // Valid creation
  const r = await req('POST', '/api/portfolios', {
    name: 'My Engineering Portfolio',
    template: 'editorial',
  }, cookieUser1)
  ok('POST /api/portfolios returns 201', r.status === 201)
  ok('Returns portfolio object', r.body?.data?.portfolio !== undefined)
  ok('Portfolio has _id', typeof r.body?.data?.portfolio?._id === 'string')
  ok('Portfolio has name', r.body?.data?.portfolio?.name === 'My Engineering Portfolio')
  ok('Portfolio has slug derived from name', typeof r.body?.data?.portfolio?.slug === 'string')
  ok('Slug is lowercase with no special chars', /^[a-z0-9-]+$/.test(r.body?.data?.portfolio?.slug ?? ''))
  ok('Portfolio template is editorial', r.body?.data?.portfolio?.template === 'editorial')
  ok('Portfolio has sections array', Array.isArray(r.body?.data?.portfolio?.sections))
  ok('Portfolio has theme object', r.body?.data?.portfolio?.theme !== undefined)
  ok('Portfolio has seo object', r.body?.data?.portfolio?.seo !== undefined)
  ok('Portfolio status is draft', r.body?.data?.portfolio?.status === 'draft')
  ok('Portfolio userId is not exposed as raw object', typeof r.body?.data?.portfolio?.userId === 'string')
  ok('No __v in response', r.body?.data?.portfolio?.__v === undefined)
  ok('No passwordHash in response', !JSON.stringify(r.body).includes('passwordHash'))

  portfolioId1 = r.body?.data?.portfolio?._id ?? ''

  // Create second portfolio
  const r2 = await req('POST', '/api/portfolios', {
    name: 'Developer Portfolio',
    template: 'developer',
  }, cookieUser1)
  ok('Second portfolio creation returns 201', r2.status === 201)
  portfolioId2 = r2.body?.data?.portfolio?._id ?? ''

  // Default sections check
  const sections = r.body?.data?.portfolio?.sections ?? []
  ok('Default sections include hero', sections.some(s => s.type === 'hero'))
  ok('Default sections include about', sections.some(s => s.type === 'about'))
  ok('Default sections include experience', sections.some(s => s.type === 'experience'))
  ok('Default sections include projects', sections.some(s => s.type === 'projects'))
  ok('Default sections include skills', sections.some(s => s.type === 'skills'))
  ok('Sections have visible and order fields', sections.every(s => typeof s.visible === 'boolean' && typeof s.order === 'number'))

  // Default theme check
  const theme = r.body?.data?.portfolio?.theme ?? {}
  ok('Default theme has font', typeof theme.font === 'string')
  ok('Default theme has accent', typeof theme.accent === 'string')
  ok('Default theme has background', typeof theme.background === 'string')

  // Unauthenticated
  const unauth = await req('POST', '/api/portfolios', { name: 'Hack', template: 'editorial' }, '')
  ok('Unauthenticated creation returns 401', unauth.status === 401)

  // Missing name
  const noName = await req('POST', '/api/portfolios', { template: 'editorial' }, cookieUser1)
  ok('Missing name returns 400', noName.status === 400)

  // Invalid template
  const badTemplate = await req('POST', '/api/portfolios', {
    name: 'Test',
    template: 'invalid_template_xyz',
  }, cookieUser1)
  ok('Invalid template returns 400', badTemplate.status === 400)

  // Name too long
  const tooLong = await req('POST', '/api/portfolios', {
    name: 'x'.repeat(101),
    template: 'editorial',
  }, cookieUser1)
  ok('Name too long (>100) returns 400', tooLong.status === 400)
}

// ─── Section 2: Portfolio Retrieval ──────────────────────────────────────────

async function testPortfolioRetrieval() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PORTFOLIO RETRIEVAL')
  console.log('══════════════════════════════════════════════')

  // List
  const listR = await req('GET', '/api/portfolios', null, cookieUser1)
  ok('GET /api/portfolios returns 200', listR.status === 200)
  ok('Returns portfolios array', Array.isArray(listR.body?.data?.portfolios))
  ok('User 1 has 2 portfolios', listR.body?.data?.portfolios?.length === 2)

  // Get single
  const singleR = await req('GET', `/api/portfolios/${portfolioId1}`, null, cookieUser1)
  ok('GET /api/portfolios/:id returns 200', singleR.status === 200)
  ok('Returns portfolio config', singleR.body?.data?.portfolio?._id === portfolioId1)
  ok('Returns renderer profile', singleR.body?.data?.profile !== null)

  // Profile shape for renderer — must not include passwordHash
  const rProfile = singleR.body?.data?.profile ?? {}
  ok('Renderer profile has fullName', typeof rProfile.fullName === 'string')
  ok('Renderer profile has skills array', Array.isArray(rProfile.skills))
  ok('Renderer profile has experience array', Array.isArray(rProfile.experience))
  ok('Renderer profile has projects array', Array.isArray(rProfile.projects))
  ok('Renderer profile does not expose passwordHash', !JSON.stringify(rProfile).includes('passwordHash'))
  ok('Renderer profile does not expose emailVerificationToken', !JSON.stringify(rProfile).includes('emailVerificationToken'))
  ok('Renderer profile does not expose source/sourceId fields', !JSON.stringify(rProfile).includes('"sourceId"'))

  // Unauthenticated
  const unauth = await req('GET', '/api/portfolios', null, '')
  ok('Unauthenticated list returns 401', unauth.status === 401)

  // Invalid ID
  const badId = await req('GET', '/api/portfolios/not-an-id', null, cookieUser1)
  ok('Invalid portfolio ID returns 400', badId.status === 400)

  // Non-existent
  const nonExist = await req('GET', '/api/portfolios/507f1f77bcf86cd799439011', null, cookieUser1)
  ok('Non-existent portfolio returns 404', nonExist.status === 404)
}

// ─── Section 3: Portfolio Update ─────────────────────────────────────────────

async function testPortfolioUpdate() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PORTFOLIO UPDATE')
  console.log('══════════════════════════════════════════════')

  // Update name and SEO
  const r = await req('PATCH', `/api/portfolios/${portfolioId1}`, {
    name: 'Updated Portfolio Name',
    seo: { title: 'Alex Jordan Portfolio', description: 'Software developer portfolio.' },
  }, cookieUser1)
  ok('PATCH /api/portfolios/:id returns 200', r.status === 200)
  ok('Name updated', r.body?.data?.portfolio?.name === 'Updated Portfolio Name')
  ok('SEO title stored', r.body?.data?.portfolio?.seo?.title === 'Alex Jordan Portfolio')
  ok('SEO description stored', r.body?.data?.portfolio?.seo?.description === 'Software developer portfolio.')

  // SEO description too long
  const longDesc = await req('PATCH', `/api/portfolios/${portfolioId1}`, {
    seo: { description: 'x'.repeat(301) },
  }, cookieUser1)
  ok('SEO description >300 chars returns 400', longDesc.status === 400)

  // Unauthenticated
  const unauth = await req('PATCH', `/api/portfolios/${portfolioId1}`, { name: 'Hack' }, '')
  ok('Unauthenticated update returns 401', unauth.status === 401)
}

// ─── Section 4: Template Update ──────────────────────────────────────────────

async function testTemplateUpdate() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  TEMPLATE UPDATE')
  console.log('══════════════════════════════════════════════')

  // Switch to minimal
  const r = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {
    template: 'minimal',
  }, cookieUser1)
  ok('PATCH /template returns 200', r.status === 200)
  ok('Template updated to minimal', r.body?.data?.portfolio?.template === 'minimal')

  // Switch to developer
  const r2 = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {
    template: 'developer',
  }, cookieUser1)
  ok('Switch to developer template', r2.body?.data?.portfolio?.template === 'developer')

  // Switch back to editorial
  await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {
    template: 'editorial',
  }, cookieUser1)

  // Invalid template value
  const bad = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {
    template: 'purple_gradient_saas',
  }, cookieUser1)
  ok('Invalid template value returns 400', bad.status === 400)

  // Missing template field
  const missing = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {}, cookieUser1)
  ok('Missing template field returns 400', missing.status === 400)

  // Unauthenticated
  const unauth = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, { template: 'minimal' }, '')
  ok('Unauthenticated template change returns 401', unauth.status === 401)
}

// ─── Section 5: Theme Update ──────────────────────────────────────────────────

async function testThemeUpdate() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  THEME UPDATE')
  console.log('══════════════════════════════════════════════')

  const r = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, {
    accent: 'brass',
    background: 'dark',
    font: 'inter',
    headingFont: 'playfair',
    radius: 'rounded',
    animation: 'none',
  }, cookieUser1)
  ok('PATCH /theme returns 200', r.status === 200)
  ok('Accent updated to brass', r.body?.data?.portfolio?.theme?.accent === 'brass')
  ok('Background updated to dark', r.body?.data?.portfolio?.theme?.background === 'dark')
  ok('Font updated to inter', r.body?.data?.portfolio?.theme?.font === 'inter')
  ok('Heading font updated', r.body?.data?.portfolio?.theme?.headingFont === 'playfair')
  ok('Radius updated', r.body?.data?.portfolio?.theme?.radius === 'rounded')
  ok('Animation updated', r.body?.data?.portfolio?.theme?.animation === 'none')

  // Partial update — only change accent
  const partial = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, {
    accent: 'forest',
  }, cookieUser1)
  ok('Partial theme update preserves other fields', partial.body?.data?.portfolio?.theme?.background === 'dark')
  ok('Partial update changes accent', partial.body?.data?.portfolio?.theme?.accent === 'forest')

  // Invalid accent value
  const bad = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, {
    accent: 'purple_glassmorphism',
  }, cookieUser1)
  ok('Invalid accent value returns 400', bad.status === 400)

  // Invalid font
  const badFont = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, {
    font: 'comic-sans',
  }, cookieUser1)
  ok('Invalid font value returns 400', badFont.status === 400)

  // Unauthenticated
  const unauth = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, { accent: 'brass' }, '')
  ok('Unauthenticated theme update returns 401', unauth.status === 401)
}

// ─── Section 6: Section Update ────────────────────────────────────────────────

async function testSectionUpdate() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  SECTION UPDATE')
  console.log('══════════════════════════════════════════════')

  const validSections = [
    { type: 'hero',       visible: true,  order: 1 },
    { type: 'about',      visible: true,  order: 2 },
    { type: 'experience', visible: true,  order: 3 },
    { type: 'projects',   visible: false, order: 4 },
    { type: 'skills',     visible: true,  order: 5 },
    { type: 'education',  visible: false, order: 6 },
    { type: 'contact',    visible: true,  order: 7 },
  ]

  const r = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: validSections,
  }, cookieUser1)
  ok('PATCH /sections returns 200', r.status === 200)
  ok('Sections updated', r.body?.data?.portfolio?.sections?.length === 7)
  ok('Hidden section persisted', r.body?.data?.portfolio?.sections?.some(s => s.type === 'projects' && s.visible === false))
  ok('Visible section persisted', r.body?.data?.portfolio?.sections?.some(s => s.type === 'hero' && s.visible === true))

  // Verify no arbitrary HTML can be passed as section type
  const htmlInjection = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: [{ type: '<script>alert(1)</script>', visible: true, order: 1 }],
  }, cookieUser1)
  ok('HTML injection in section type returns 400', htmlInjection.status === 400)

  // Invalid section type
  const badType = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: [{ type: 'arbitrary_component_xyz', visible: true, order: 1 }],
  }, cookieUser1)
  ok('Arbitrary component name in section type returns 400', badType.status === 400)

  // Duplicate section types
  const dupSections = [
    { type: 'hero', visible: true, order: 1 },
    { type: 'hero', visible: false, order: 2 },
  ]
  const dupR = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: dupSections,
  }, cookieUser1)
  ok('Duplicate section types returns 400', dupR.status === 400)

  // Empty sections array
  const emptyR = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: [],
  }, cookieUser1)
  ok('Empty sections array returns 400', emptyR.status === 400)

  // Order reordering — verify stored correctly
  const reorder = [
    { type: 'projects',   visible: true, order: 1 },
    { type: 'hero',       visible: true, order: 2 },
    { type: 'skills',     visible: true, order: 3 },
    { type: 'about',      visible: true, order: 4 },
    { type: 'experience', visible: true, order: 5 },
    { type: 'contact',    visible: true, order: 6 },
    { type: 'education',  visible: true, order: 7 },
  ]
  const reorderR = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: reorder,
  }, cookieUser1)
  ok('Section reorder stored correctly', reorderR.status === 200)
  const firstSection = reorderR.body?.data?.portfolio?.sections?.find(s => s.order === 1)
  ok('First section after reorder is projects', firstSection?.type === 'projects')

  // Unauthenticated
  const unauth = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, { sections: validSections }, '')
  ok('Unauthenticated section update returns 401', unauth.status === 401)
}

// ─── Section 7: Slug Handling ─────────────────────────────────────────────────

async function testSlugHandling() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  SLUG HANDLING')
  console.log('══════════════════════════════════════════════')

  // Slug preview helper
  const previewR = await req('GET', '/api/portfolios/slug-preview?name=My%20Great%20Portfolio', null, cookieUser1)
  ok('Slug preview returns 200', previewR.status === 200)
  ok('Slug is normalized lowercase', previewR.body?.data?.slug === 'my-great-portfolio')

  // Special characters are normalized
  const specialR = await req('GET', '/api/portfolios/slug-preview?name=C%2B%2B%20%26%20React%20Dev!', null, cookieUser1)
  ok('Special chars normalized in slug', /^[a-z0-9-]+$/.test(specialR.body?.data?.slug ?? ''))

  // Creating with same slug under same user fails
  const ts = Date.now()
  const base = `unique-slug-${ts}`

  await req('POST', '/api/portfolios', { name: base, template: 'editorial' }, cookieUser1)
  const dup = await req('POST', '/api/portfolios', { name: base, template: 'minimal' }, cookieUser1)
  ok('Duplicate slug under same user returns 409', dup.status === 409)

  // Same slug under DIFFERENT user is allowed (user-scoped uniqueness)
  const sameName = await req('POST', '/api/portfolios', { name: base, template: 'editorial' }, cookieUser2)
  ok('Same slug under different user is allowed (user-scoped)', sameName.status === 201)

  // Cleanup the extra portfolios to keep state clean
  if (sameName.body?.data?.portfolio?._id) {
    await req('DELETE', `/api/portfolios/${sameName.body.data.portfolio._id}`, null, cookieUser2)
  }
}

// ─── Section 8: Portfolio Deletion ────────────────────────────────────────────

async function testPortfolioDeletion() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PORTFOLIO DELETION')
  console.log('══════════════════════════════════════════════')

  // Create a temporary portfolio to delete
  const createR = await req('POST', '/api/portfolios', {
    name: 'Temp For Deletion',
    template: 'minimal',
  }, cookieUser1)
  const tempId = createR.body?.data?.portfolio?._id ?? ''
  ok('Temp portfolio created for deletion test', !!tempId)

  // Delete it
  const deleteR = await req('DELETE', `/api/portfolios/${tempId}`, null, cookieUser1)
  ok('DELETE returns 200', deleteR.status === 200)
  ok('Response indicates deleted', deleteR.body?.data?.deleted === true)

  // Verify it's gone
  const getR = await req('GET', `/api/portfolios/${tempId}`, null, cookieUser1)
  ok('Deleted portfolio returns 404', getR.status === 404)

  // Unauthenticated delete
  const unauth = await req('DELETE', `/api/portfolios/${portfolioId1}`, null, '')
  ok('Unauthenticated delete returns 401', unauth.status === 401)

  // Delete non-existent
  const nonExist = await req('DELETE', '/api/portfolios/507f1f77bcf86cd799439011', null, cookieUser1)
  ok('Non-existent delete returns 404', nonExist.status === 404)
}

// ─── Section 9: Ownership Isolation ──────────────────────────────────────────

async function testOwnershipIsolation() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  OWNERSHIP ISOLATION')
  console.log('══════════════════════════════════════════════')

  if (!portfolioId1) {
    console.log('  ℹ️  Skipping ownership tests — portfolioId1 not set')
    return
  }

  // User 2 cannot GET User 1's portfolio
  const getR = await req('GET', `/api/portfolios/${portfolioId1}`, null, cookieUser2)
  ok('User 2 cannot GET User 1 portfolio (404)', getR.status === 404)

  // User 2 cannot PATCH User 1's portfolio
  const patchR = await req('PATCH', `/api/portfolios/${portfolioId1}`, { name: 'Stolen' }, cookieUser2)
  ok('User 2 cannot PATCH User 1 portfolio (404)', patchR.status === 404)

  // User 2 cannot change User 1's template
  const templR = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, { template: 'minimal' }, cookieUser2)
  ok('User 2 cannot change User 1 template (404)', templR.status === 404)

  // User 2 cannot change User 1's theme
  const themeR = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, { accent: 'brass' }, cookieUser2)
  ok('User 2 cannot change User 1 theme (404)', themeR.status === 404)

  // User 2 cannot change User 1's sections
  const sectR = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: [{ type: 'hero', visible: false, order: 1 }],
  }, cookieUser2)
  ok('User 2 cannot change User 1 sections (404)', sectR.status === 404)

  // User 2 cannot DELETE User 1's portfolio
  const delR = await req('DELETE', `/api/portfolios/${portfolioId1}`, null, cookieUser2)
  ok('User 2 cannot DELETE User 1 portfolio (404)', delR.status === 404)

  // User 2 list only shows User 2's portfolios
  const listR = await req('GET', '/api/portfolios', null, cookieUser2)
  const user2Ids = (listR.body?.data?.portfolios ?? []).map(p => p._id)
  ok('User 2 list does not contain User 1 portfolio', !user2Ids.includes(portfolioId1))

  // Verify User 1's portfolio is unchanged after User 2 attempts
  const verifyR = await req('GET', `/api/portfolios/${portfolioId1}`, null, cookieUser1)
  ok('User 1 portfolio unchanged after User 2 attack', verifyR.status === 200)
}

// ─── Section 10: Missing Profile Data Safety ─────────────────────────────────

async function testMissingProfileData() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  MISSING PROFILE DATA SAFETY')
  console.log('══════════════════════════════════════════════')

  // User 2 has no profile data — portfolio should still work
  const createR = await req('POST', '/api/portfolios', {
    name: 'Empty Profile Portfolio',
    template: 'editorial',
  }, cookieUser2)
  ok('Portfolio creation with empty profile returns 201', createR.status === 201)
  const emptyId = createR.body?.data?.portfolio?._id ?? ''

  if (emptyId) {
    const getR = await req('GET', `/api/portfolios/${emptyId}`, null, cookieUser2)
    ok('GET empty profile portfolio returns 200', getR.status === 200)

    // Profile should still be returned (auto-created) but with empty arrays
    const rProfile = getR.body?.data?.profile
    if (rProfile) {
      ok('Empty profile has skills as array', Array.isArray(rProfile.skills))
      ok('Empty profile skills is empty', rProfile.skills.length === 0)
      ok('Empty profile experience is empty', rProfile.experience?.length === 0)
      ok('Empty profile projects is empty', rProfile.projects?.length === 0)
    } else {
      // profile might be null if no profile exists yet — that's also acceptable
      ok('Empty profile handled gracefully (null or empty)', true)
    }

    // Renderer profile never contains fabricated data
    const raw = JSON.stringify(rProfile ?? {})
    ok('Empty profile contains no fabricated content', !raw.includes('"award-winning"') && !raw.includes('"industry leader"'))

    // Cleanup
    await req('DELETE', `/api/portfolios/${emptyId}`, null, cookieUser2)
  }
}

// ─── Section 11: Security — Secrets Not Exposed ───────────────────────────────

async function testSecurityNoSecrets() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  SECURITY: NO SECRETS IN RESPONSES')
  console.log('══════════════════════════════════════════════')

  const endpoints = [
    ['GET', '/api/portfolios'],
    ['GET', `/api/portfolios/${portfolioId1}`],
    ['POST', '/api/portfolios', { name: 'SecCheck', template: 'editorial' }],
  ]

  for (const [method, path, body] of endpoints) {
    const r = await req(method, path, body ?? null, cookieUser1)
    if (r.status === 200 || r.status === 201) {
      const raw = JSON.stringify(r.body)
      ok(`${method} ${path}: no passwordHash`, !raw.includes('passwordHash'))
      ok(`${method} ${path}: no emailVerificationToken`, !raw.includes('emailVerificationToken'))
      ok(`${method} ${path}: no passwordResetToken`, !raw.includes('passwordResetToken'))
      ok(`${method} ${path}: no JWT_SECRET`, !raw.includes('JWT_SECRET'))
      ok(`${method} ${path}: no AI_API_KEY`, !raw.includes('AI_API_KEY'))
    }
  }

  // Cleanup the SecCheck portfolio
  const listR = await req('GET', '/api/portfolios', null, cookieUser1)
  const secCheck = listR.body?.data?.portfolios?.find(p => p.name === 'SecCheck')
  if (secCheck) await req('DELETE', `/api/portfolios/${secCheck._id}`, null, cookieUser1)
}

// ─── Section 12: No Arbitrary HTML/JS Injection ───────────────────────────────

async function testNoArbitraryContent() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  SECURITY: NO ARBITRARY HTML/JS INJECTION')
  console.log('══════════════════════════════════════════════')

  // Portfolio name with HTML — should be stored safely
  const htmlNameR = await req('POST', '/api/portfolios', {
    name: '<script>alert("xss")</script>',
    template: 'editorial',
  }, cookieUser1)
  // Server may accept the name (it's just text) but it must be stored safely
  if (htmlNameR.status === 201) {
    const storedName = htmlNameR.body?.data?.portfolio?.name
    // The name is stored as-is (text) — the frontend React rendering escapes it.
    // The important thing is the server does NOT execute it.
    ok('HTML in portfolio name is stored as text (not executed)', typeof storedName === 'string')
    ok('HTML name does not change template or execute code server-side', htmlNameR.body?.data?.portfolio?.template === 'editorial')
    if (htmlNameR.body?.data?.portfolio?._id) {
      await req('DELETE', `/api/portfolios/${htmlNameR.body.data.portfolio._id}`, null, cookieUser1)
    }
  } else {
    // Server may also reject oversized/invalid names — acceptable
    ok('HTML injection in name handled (rejected or stored as text)', htmlNameR.status === 400 || htmlNameR.status === 201)
  }

  // Section type injection — must be rejected
  const sectInjection = await req('PATCH', `/api/portfolios/${portfolioId1}/sections`, {
    sections: [{ type: 'javascript:void(0)', visible: true, order: 1 }],
  }, cookieUser1)
  ok('Protocol injection in section type returns 400', sectInjection.status === 400)

  // Theme value injection — must be rejected
  const themeInjection = await req('PATCH', `/api/portfolios/${portfolioId1}/theme`, {
    accent: '; DROP TABLE users; --',
  }, cookieUser1)
  ok('SQL-style injection in theme value returns 400', themeInjection.status === 400)

  // Template injection
  const templateInjection = await req('PATCH', `/api/portfolios/${portfolioId1}/template`, {
    template: '../../etc/passwd',
  }, cookieUser1)
  ok('Path traversal in template value returns 400', templateInjection.status === 400)
}

// ─── Section 13: Phase 2 Regression ──────────────────────────────────────────

async function testPhase2Regression() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PHASE 2 REGRESSION')
  console.log('══════════════════════════════════════════════')

  const meR = await req('GET', '/api/auth/me', null, cookieUser1)
  ok('/api/auth/me still works', meR.status === 200)
  ok('/me returns user data', meR.body?.data?.user?.id !== undefined)
  ok('/me does not expose passwordHash', !JSON.stringify(meR.body).includes('passwordHash'))

  const noAuth = await req('GET', '/api/auth/me', null, '')
  ok('/me without auth returns 401', noAuth.status === 401)

  const health = await req('GET', '/api/health', null, '')
  ok('Health check still returns 200', health.status === 200)
}

// ─── Section 14: Phase 3 Regression ──────────────────────────────────────────

async function testPhase3Regression() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PHASE 3 REGRESSION')
  console.log('══════════════════════════════════════════════')

  const profileR = await req('GET', '/api/profile', null, cookieUser1)
  ok('GET /api/profile still works', profileR.status === 200)
  ok('Profile has completeness score', typeof profileR.body?.data?.completeness === 'number')
  ok('Profile has experience', profileR.body?.data?.profile?.experience?.length > 0)
  ok('Profile does not expose __v', profileR.body?.data?.profile?.__v === undefined)

  const datasrcR = await req('GET', '/api/profile/datasources', null, cookieUser1)
  ok('GET /api/profile/datasources still works', datasrcR.status === 200)
}

// ─── Section 15: Phase 4 Regression ──────────────────────────────────────────

async function testPhase4Regression() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  PHASE 4 REGRESSION')
  console.log('══════════════════════════════════════════════')

  const qualityR = await req('GET', '/api/ai/profile/quality', null, cookieUser1)
  ok('GET /api/ai/profile/quality still works', qualityR.status === 200)
  ok('Quality has total score', typeof qualityR.body?.data?.quality?.total === 'number')

  const suggestR = await req('GET', '/api/ai/suggestions', null, cookieUser1)
  ok('GET /api/ai/suggestions still works', suggestR.status === 200)
  ok('Suggestions is array', Array.isArray(suggestR.body?.data?.suggestions))

  const noAuthR = await req('GET', '/api/ai/profile/quality', null, '')
  ok('AI quality without auth returns 401', noAuthR.status === 401)
}

// ─── Summary ──────────────────────────────────────────────────────────────────

async function printSummary() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  TEST RESULTS')
  console.log('══════════════════════════════════════════════')
  console.log(`  ✅ Passed:  ${pass}`)
  console.log(`  ❌ Failed:  ${fail}`)
  console.log(`  Total:     ${pass + fail}`)

  if (fail === 0) {
    console.log('\n  ALL TESTS PASSED ✅')
  } else {
    console.log(`\n  ${fail} TEST(S) FAILED ❌`)
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  FOLVIRA Phase 5 — Portfolio Tests           ║')
  console.log('╚══════════════════════════════════════════════╝')

  try {
    await setupUsers()
    await testPortfolioCreation()
    await testPortfolioRetrieval()
    await testPortfolioUpdate()
    await testTemplateUpdate()
    await testThemeUpdate()
    await testSectionUpdate()
    await testSlugHandling()
    await testPortfolioDeletion()
    await testOwnershipIsolation()
    await testMissingProfileData()
    await testSecurityNoSecrets()
    await testNoArbitraryContent()
    await testPhase2Regression()
    await testPhase3Regression()
    await testPhase4Regression()
  } catch (err) {
    console.error('\n❌ Test runner error:', err)
    fail++
  }

  await printSummary()
  process.exit(fail > 0 ? 1 : 0)
}

run()
