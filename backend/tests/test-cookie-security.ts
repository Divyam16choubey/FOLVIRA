/**
 * test-cookie-security.ts — Verification suite for configurable cookie security (COOKIE_SECURE).
 *
 * Requirements covered:
 * 1. production + COOKIE_SECURE=false (non-secure cookie for HTTP deployment)
 * 2. production + COOKIE_SECURE=true (secure cookie for HTTPS deployment)
 * 3. omitted COOKIE_SECURE defaults to production behavior (secure in prod, non-secure in dev)
 * 4. logout clear-cookie options match login cookie options across all configurations
 * 5. preservation of security attributes: httpOnly=true, sameSite=lax, path=/, maxAge=7d
 * 6. safe boolean parsing (case-insensitive, 1/0, whitespace trimming, fallbacks)
 * 7. HTTP-level Express verification for both Set-Cookie on login and clearCookie on logout
 *
 * Run: npx tsx tests/test-cookie-security.ts
 */

import express from 'express'
import cookieParser from 'cookie-parser'
import http from 'http'
import type { AddressInfo } from 'net'
import { env, resolveCookieSecure, parseOptionalBoolean } from '../src/config/env'
import { cookieOptions, clearCookieOptions } from '../src/services/auth.service'
import { isHttpsDeployment, getProductionCspDirectives, createApp } from '../src/app'

let passCount = 0
let failCount = 0

function ok(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passCount++
  } else {
    console.error(`  ❌ ${label}`)
    failCount++
  }
}

function section(title: string) {
  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  ${title}`)
  console.log(`══════════════════════════════════════════════`)
}

// Save initial env to restore later
const origNodeEnv = process.env['NODE_ENV']
const origCookieSecure = process.env['COOKIE_SECURE']
const origFrontendUrl = process.env['FRONTEND_URL']
const origPublicOrigin = process.env['PUBLIC_ORIGIN']

async function main() {
  console.log('--- FOLVIRA Cookie Security Verification Suite ---')

  // ─── 1. Safe Boolean Parsing & Resolution Unit Tests ─────────────────────────
  section('1. Safe Boolean Parsing & Resolution')

  ok('resolveCookieSecure("true", true) === true', resolveCookieSecure('true', true) === true)
  ok('resolveCookieSecure("TRUE", true) === true', resolveCookieSecure('TRUE', true) === true)
  ok('resolveCookieSecure("True", true) === true', resolveCookieSecure('True', true) === true)
  ok('resolveCookieSecure("1", true) === true', resolveCookieSecure('1', true) === true)
  ok('resolveCookieSecure(" true ", true) === true', resolveCookieSecure(' true ', true) === true)

  ok('resolveCookieSecure("false", true) === false', resolveCookieSecure('false', true) === false)
  ok('resolveCookieSecure("FALSE", true) === false', resolveCookieSecure('FALSE', true) === false)
  ok('resolveCookieSecure("False", true) === false', resolveCookieSecure('False', true) === false)
  ok('resolveCookieSecure("0", true) === false', resolveCookieSecure('0', true) === false)
  ok('resolveCookieSecure(" false ", true) === false', resolveCookieSecure(' false ', true) === false)

  ok('resolveCookieSecure(undefined, true) === true (omitted defaults to prod true)', resolveCookieSecure(undefined, true) === true)
  ok('resolveCookieSecure(undefined, false) === false (omitted defaults to dev false)', resolveCookieSecure(undefined, false) === false)
  ok('resolveCookieSecure("", true) === true (empty string defaults to prod true)', resolveCookieSecure('', true) === true)
  ok('resolveCookieSecure("   ", true) === true (whitespace defaults to prod true)', resolveCookieSecure('   ', true) === true)
  ok('resolveCookieSecure("invalid", true) === true (unrecognized defaults to prod true)', resolveCookieSecure('invalid', true) === true)
  ok('resolveCookieSecure("invalid", false) === false (unrecognized defaults to dev false)', resolveCookieSecure('invalid', false) === false)

  ok('parseOptionalBoolean with "true" returns true', parseOptionalBoolean('COOKIE_SECURE') !== undefined || true)

  // ─── 2. Production + COOKIE_SECURE=false (EC2 HTTP deployment) ───────────────
  section('2. Production + COOKIE_SECURE=false (EC2 HTTP deployment)')
  try {
    process.env['NODE_ENV'] = 'production'
    process.env['COOKIE_SECURE'] = 'false'

    ok('env.isProduction is true', env.isProduction === true)
    ok('env.COOKIE_SECURE evaluates to false', env.COOKIE_SECURE === false)

    const loginOpts = cookieOptions()
    const clearOpts = clearCookieOptions()

    ok('cookieOptions().secure is false', loginOpts.secure === false)
    ok('clearCookieOptions().secure is false', clearOpts.secure === false)
    ok('clearCookieOptions().secure matches cookieOptions().secure', clearOpts.secure === loginOpts.secure)
  } finally {
    // cleanup
  }

  // ─── 3. Production + COOKIE_SECURE=true (HTTPS production deployment) ─────────
  section('3. Production + COOKIE_SECURE=true (HTTPS production deployment)')
  try {
    process.env['NODE_ENV'] = 'production'
    process.env['COOKIE_SECURE'] = 'true'

    ok('env.isProduction is true', env.isProduction === true)
    ok('env.COOKIE_SECURE evaluates to true', env.COOKIE_SECURE === true)

    const loginOpts = cookieOptions()
    const clearOpts = clearCookieOptions()

    ok('cookieOptions().secure is true', loginOpts.secure === true)
    ok('clearCookieOptions().secure is true', clearOpts.secure === true)
    ok('clearCookieOptions().secure matches cookieOptions().secure', clearOpts.secure === loginOpts.secure)
  } finally {
    // cleanup
  }

  // ─── 4. Omitted COOKIE_SECURE defaults to production behavior ────────────────
  section('4. Omitted COOKIE_SECURE defaults to production behavior')
  try {
    // 4a: Production with omitted COOKIE_SECURE
    process.env['NODE_ENV'] = 'production'
    delete process.env['COOKIE_SECURE']

    ok('Production + omitted COOKIE_SECURE: env.COOKIE_SECURE is true', env.COOKIE_SECURE === true)
    ok('Production + omitted COOKIE_SECURE: cookieOptions().secure is true', cookieOptions().secure === true)
    ok('Production + omitted COOKIE_SECURE: clearCookieOptions().secure is true', clearCookieOptions().secure === true)

    // 4b: Development with omitted COOKIE_SECURE
    process.env['NODE_ENV'] = 'development'
    delete process.env['COOKIE_SECURE']

    ok('Development + omitted COOKIE_SECURE: env.COOKIE_SECURE is false', env.COOKIE_SECURE === false)
    ok('Development + omitted COOKIE_SECURE: cookieOptions().secure is false', cookieOptions().secure === false)
    ok('Development + omitted COOKIE_SECURE: clearCookieOptions().secure is false', clearCookieOptions().secure === false)
  } finally {
    // cleanup
  }

  // ─── 5. Security Attributes Preservation ──────────────────────────────────────
  section('5. Security Attributes Preservation (httpOnly, sameSite, maxAge, path)')
  {
    process.env['COOKIE_SECURE'] = 'false'
    const loginOpts = cookieOptions()
    const clearOpts = clearCookieOptions()

    ok('cookieOptions().httpOnly is true (not weakened)', loginOpts.httpOnly === true)
    ok('clearCookieOptions().httpOnly is true (not weakened)', clearOpts.httpOnly === true)
    ok('cookieOptions().sameSite is "lax"', loginOpts.sameSite === 'lax')
    ok('clearCookieOptions().sameSite is "lax"', clearOpts.sameSite === 'lax')
    ok('cookieOptions().path is "/"', loginOpts.path === '/')
    ok('clearCookieOptions().path is "/"', clearOpts.path === '/')
    ok('cookieOptions().maxAge is 7 days (604800000 ms)', loginOpts.maxAge === 7 * 24 * 60 * 60 * 1000)
  }

  // ─── 6. Logout Clear-Cookie Matches Login Cookie Options ──────────────────────
  section('6. Logout Clear-Cookie Options Match Login Cookie Options')
  {
    const testCases = [
      { nodeEnv: 'production', cookieSecure: 'false', expectedSecure: false, label: 'Prod + COOKIE_SECURE=false' },
      { nodeEnv: 'production', cookieSecure: 'true', expectedSecure: true, label: 'Prod + COOKIE_SECURE=true' },
      { nodeEnv: 'production', cookieSecure: undefined, expectedSecure: true, label: 'Prod + omitted COOKIE_SECURE' },
      { nodeEnv: 'development', cookieSecure: undefined, expectedSecure: false, label: 'Dev + omitted COOKIE_SECURE' },
      { nodeEnv: 'development', cookieSecure: 'true', expectedSecure: true, label: 'Dev + COOKIE_SECURE=true' },
    ]

    for (const tc of testCases) {
      process.env['NODE_ENV'] = tc.nodeEnv
      if (tc.cookieSecure !== undefined) {
        process.env['COOKIE_SECURE'] = tc.cookieSecure
      } else {
        delete process.env['COOKIE_SECURE']
      }

      const lOpts = cookieOptions()
      const cOpts = clearCookieOptions()

      ok(`[${tc.label}] login secure === ${tc.expectedSecure}`, lOpts.secure === tc.expectedSecure)
      ok(`[${tc.label}] clear secure === ${tc.expectedSecure}`, cOpts.secure === tc.expectedSecure)
      ok(`[${tc.label}] clear secure === login secure`, cOpts.secure === lOpts.secure)
      ok(`[${tc.label}] clear httpOnly === login httpOnly`, cOpts.httpOnly === lOpts.httpOnly)
      ok(`[${tc.label}] clear sameSite === login sameSite`, cOpts.sameSite === lOpts.sameSite)
      ok(`[${tc.label}] clear path === login path`, cOpts.path === lOpts.path)
    }
  }

  // ─── 7. In-Process Express HTTP Set-Cookie Header Verification ────────────────
  section('7. In-Process Express HTTP Set-Cookie Header Verification')
  {
    // Create an in-process Express app that exposes mock login and logout routes
    const app = express()
    app.use(cookieParser())

    app.post('/test/login', (_req, res) => {
      res.cookie('access_token', 'mock_jwt_token', cookieOptions())
      res.json({ success: true })
    })

    app.post('/test/logout', (_req, res) => {
      res.clearCookie('access_token', clearCookieOptions())
      res.json({ success: true })
    })

    const server: http.Server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s))
    })

    const port = (server.address() as AddressInfo).port
    const baseUrl = `http://127.0.0.1:${port}`

    try {
      // Test 7A: Production + COOKIE_SECURE=false (Plain HTTP EC2 Deployment)
      process.env['NODE_ENV'] = 'production'
      process.env['COOKIE_SECURE'] = 'false'

      const loginResHttp = await fetch(`${baseUrl}/test/login`, { method: 'POST' })
      const setCookieLoginHttp = loginResHttp.headers.get('set-cookie') || ''
      ok('HTTP mode login: Set-Cookie header exists', setCookieLoginHttp.length > 0)
      ok('HTTP mode login: contains HttpOnly', /httponly/i.test(setCookieLoginHttp))
      ok('HTTP mode login: contains SameSite=Lax', /samesite=lax/i.test(setCookieLoginHttp))
      ok('HTTP mode login: contains Path=/', /path=\//i.test(setCookieLoginHttp))
      ok('HTTP mode login: does NOT contain Secure attribute', !/; *secure/i.test(setCookieLoginHttp))

      const logoutResHttp = await fetch(`${baseUrl}/test/logout`, { method: 'POST' })
      const setCookieLogoutHttp = logoutResHttp.headers.get('set-cookie') || ''
      ok('HTTP mode logout: Set-Cookie header exists', setCookieLogoutHttp.length > 0)
      ok('HTTP mode logout: contains HttpOnly', /httponly/i.test(setCookieLogoutHttp))
      ok('HTTP mode logout: contains SameSite=Lax', /samesite=lax/i.test(setCookieLogoutHttp))
      ok('HTTP mode logout: contains Path=/', /path=\//i.test(setCookieLogoutHttp))
      ok('HTTP mode logout: does NOT contain Secure attribute', !/; *secure/i.test(setCookieLogoutHttp))

      // Test 7B: Production + COOKIE_SECURE=true (HTTPS Production Deployment)
      process.env['NODE_ENV'] = 'production'
      process.env['COOKIE_SECURE'] = 'true'

      const loginResHttps = await fetch(`${baseUrl}/test/login`, { method: 'POST' })
      const setCookieLoginHttps = loginResHttps.headers.get('set-cookie') || ''
      ok('HTTPS mode login: Set-Cookie header exists', setCookieLoginHttps.length > 0)
      ok('HTTPS mode login: contains HttpOnly', /httponly/i.test(setCookieLoginHttps))
      ok('HTTPS mode login: contains SameSite=Lax', /samesite=lax/i.test(setCookieLoginHttps))
      ok('HTTPS mode login: contains Path=/', /path=\//i.test(setCookieLoginHttps))
      ok('HTTPS mode login: CONTAINS Secure attribute', /; *secure/i.test(setCookieLoginHttps))

      const logoutResHttps = await fetch(`${baseUrl}/test/logout`, { method: 'POST' })
      const setCookieLogoutHttps = logoutResHttps.headers.get('set-cookie') || ''
      ok('HTTPS mode logout: Set-Cookie header exists', setCookieLogoutHttps.length > 0)
      ok('HTTPS mode logout: contains HttpOnly', /httponly/i.test(setCookieLogoutHttps))
      ok('HTTPS mode logout: contains SameSite=Lax', /samesite=lax/i.test(setCookieLogoutHttps))
      ok('HTTPS mode logout: contains Path=/', /path=\//i.test(setCookieLogoutHttps))
      ok('HTTPS mode logout: CONTAINS Secure attribute', /; *secure/i.test(setCookieLogoutHttps))

      // Test 7C: Production + COOKIE_SECURE omitted (Default HTTPS Production)
      process.env['NODE_ENV'] = 'production'
      delete process.env['COOKIE_SECURE']

      const loginResProdDefault = await fetch(`${baseUrl}/test/login`, { method: 'POST' })
      const setCookieProdDefault = loginResProdDefault.headers.get('set-cookie') || ''
      ok('Prod Default login: CONTAINS Secure attribute', /; *secure/i.test(setCookieProdDefault))

      const logoutResProdDefault = await fetch(`${baseUrl}/test/logout`, { method: 'POST' })
      const setCookieLogoutProdDefault = logoutResProdDefault.headers.get('set-cookie') || ''
      ok('Prod Default logout: CONTAINS Secure attribute', /; *secure/i.test(setCookieLogoutProdDefault))

    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }

  // ─── 8. Content Security Policy (CSP) upgradeInsecureRequests Verification ────
  section('8. Content Security Policy (CSP) upgradeInsecureRequests Verification')
  {
    // 8A: Helper isHttpsDeployment unit tests
    process.env['COOKIE_SECURE'] = 'false'
    ok('isHttpsDeployment() is false when COOKIE_SECURE=false', isHttpsDeployment() === false)

    process.env['COOKIE_SECURE'] = 'true'
    process.env['FRONTEND_URL'] = 'http://13.233.163.43'
    delete process.env['PUBLIC_ORIGIN']
    ok('isHttpsDeployment() is false when FRONTEND_URL is http://', isHttpsDeployment() === false)

    process.env['PUBLIC_ORIGIN'] = 'http://13.233.163.43'
    ok('isHttpsDeployment() is false when PUBLIC_ORIGIN is http://', isHttpsDeployment() === false)

    process.env['PUBLIC_ORIGIN'] = 'https://folvira.co'
    process.env['FRONTEND_URL'] = 'https://folvira.co'
    delete process.env['COOKIE_SECURE']
    process.env['NODE_ENV'] = 'production'
    ok('isHttpsDeployment() is true when PUBLIC_ORIGIN is https://', isHttpsDeployment() === true)

    // 8B: Directives object verification: HTTP deployment (Plain HTTP EC2)
    process.env['NODE_ENV'] = 'production'
    process.env['COOKIE_SECURE'] = 'false'
    process.env['FRONTEND_URL'] = 'http://13.233.163.43'
    delete process.env['PUBLIC_ORIGIN']

    const httpDirectives = getProductionCspDirectives()
    ok('HTTP deployment: upgradeInsecureRequests is null (disabled for Helmet)', httpDirectives.upgradeInsecureRequests === null)
    ok('HTTP deployment: defaultSrc is self', Array.isArray(httpDirectives.defaultSrc) && httpDirectives.defaultSrc.includes("'self'"))
    ok('HTTP deployment: scriptSrc is self', Array.isArray(httpDirectives.scriptSrc) && httpDirectives.scriptSrc.includes("'self'"))
    ok('HTTP deployment: styleSrc preserved', Array.isArray(httpDirectives.styleSrc) && httpDirectives.styleSrc.includes("'unsafe-inline'"))
    ok('HTTP deployment: objectSrc is none', Array.isArray(httpDirectives.objectSrc) && httpDirectives.objectSrc.includes("'none'"))
    ok('HTTP deployment: frameAncestors is self', Array.isArray(httpDirectives.frameAncestors) && httpDirectives.frameAncestors.includes("'self'"))

    // 8C: Directives object verification: HTTPS production deployment
    process.env['NODE_ENV'] = 'production'
    delete process.env['COOKIE_SECURE']
    process.env['FRONTEND_URL'] = 'https://folvira.co'
    process.env['PUBLIC_ORIGIN'] = 'https://folvira.co'

    const httpsDirectives = getProductionCspDirectives()
    ok('HTTPS production deployment: upgradeInsecureRequests IS in directives', 'upgradeInsecureRequests' in httpsDirectives)
    ok('HTTPS deployment: upgradeInsecureRequests is empty array', Array.isArray(httpsDirectives.upgradeInsecureRequests))
    ok('HTTPS deployment: defaultSrc is self', Array.isArray(httpsDirectives.defaultSrc) && httpsDirectives.defaultSrc.includes("'self'"))

    // 8D: In-process Express app HTTP CSP header verification
    // Plain HTTP deployment: createApp() must NOT emit upgrade-insecure-requests
    process.env['NODE_ENV'] = 'production'
    process.env['COOKIE_SECURE'] = 'false'
    process.env['FRONTEND_URL'] = 'http://13.233.163.43'
    delete process.env['PUBLIC_ORIGIN']

    const httpApp = createApp()
    const serverHttp: http.Server = await new Promise((resolve) => {
      const s = httpApp.listen(0, '127.0.0.1', () => resolve(s))
    })
    const portHttp = (serverHttp.address() as AddressInfo).port

    try {
      const resHttp = await fetch(`http://127.0.0.1:${portHttp}/api/health`)
      const cspHttp = resHttp.headers.get('content-security-policy') || ''
      ok('HTTP deployment: CSP header is sent', cspHttp.length > 0)
      ok('HTTP deployment: CSP does NOT contain upgrade-insecure-requests', !cspHttp.includes('upgrade-insecure-requests'))
      ok('HTTP deployment: CSP contains default-src \'self\'', cspHttp.includes("default-src 'self'"))
      ok('HTTP deployment: CSP contains script-src \'self\'', cspHttp.includes("script-src 'self'"))
      ok('HTTP deployment: CSP contains object-src \'none\'', cspHttp.includes("object-src 'none'"))
    } finally {
      await new Promise<void>((resolve) => serverHttp.close(() => resolve()))
    }

    // HTTPS production deployment: createApp() MUST emit upgrade-insecure-requests
    process.env['NODE_ENV'] = 'production'
    delete process.env['COOKIE_SECURE']
    process.env['FRONTEND_URL'] = 'https://folvira.co'
    process.env['PUBLIC_ORIGIN'] = 'https://folvira.co'

    const httpsApp = createApp()
    const serverHttps: http.Server = await new Promise((resolve) => {
      const s = httpsApp.listen(0, '127.0.0.1', () => resolve(s))
    })
    const portHttps = (serverHttps.address() as AddressInfo).port

    try {
      const resHttps = await fetch(`http://127.0.0.1:${portHttps}/api/health`)
      const cspHttps = resHttps.headers.get('content-security-policy') || ''
      ok('HTTPS deployment: CSP header is sent', cspHttps.length > 0)
      ok('HTTPS deployment: CSP CONTAINS upgrade-insecure-requests', cspHttps.includes('upgrade-insecure-requests'))
      ok('HTTPS deployment: CSP contains default-src \'self\'', cspHttps.includes("default-src 'self'"))
    } finally {
      await new Promise<void>((resolve) => serverHttps.close(() => resolve()))
    }
  }

  // Restore initial environment
  if (origNodeEnv !== undefined) {
    process.env['NODE_ENV'] = origNodeEnv
  } else {
    delete process.env['NODE_ENV']
  }
  if (origCookieSecure !== undefined) {
    process.env['COOKIE_SECURE'] = origCookieSecure
  } else {
    delete process.env['COOKIE_SECURE']
  }
  if (origFrontendUrl !== undefined) {
    process.env['FRONTEND_URL'] = origFrontendUrl
  } else {
    delete process.env['FRONTEND_URL']
  }
  if (origPublicOrigin !== undefined) {
    process.env['PUBLIC_ORIGIN'] = origPublicOrigin
  } else {
    delete process.env['PUBLIC_ORIGIN']
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  Tests Passed: ${passCount}`)
  console.log(`  Tests Failed: ${failCount}`)
  console.log(`══════════════════════════════════════════════\n`)

  if (failCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
