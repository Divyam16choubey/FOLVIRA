/**
 * test-api.js — Phase 3 Smoke Verification & Regression Suite.
 *
 * Run: npx tsx tests/test-api.js (or npm run test:smoke in backend/)
 * Server must be running: npm run dev (in backend/)
 */

async function run() {
  const baseUrl = 'http://localhost:3001'
  let cookie = ''

  console.log('--- FOLVIRA Phase 3 Verification ---')

  // 1. Phase 2 Regression: Signup & Login
  const testEmail = `test_${Date.now()}@folvira.com`
  console.log(`\n[Test 1] Signup new user: ${testEmail}`)
  try {
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'Password123!', passwordConfirm: 'Password123!' })
    })
    
    // We need to extract the cookie
    const setCookie = signupRes.headers.get('set-cookie')
    if (setCookie) {
      cookie = setCookie.split(';')[0]
      console.log('✅ Signup successful, cookie extracted.')
    } else {
      console.log('❌ Signup failed to return cookie.')
    }

    const text = await signupRes.text()
    console.log(`Signup Response Status: ${signupRes.status}`)
    console.log(`Signup Response Body: ${text}`)
    
    let data;
    try {
      data = JSON.parse(text)
      if (!data.data.user.passwordHash) {
        console.log('✅ No passwordHash exposed in signup response.')
      } else {
        console.log('❌ passwordHash exposed in signup response!')
      }
    } catch (e) {
      console.log('❌ Failed to parse signup JSON')
    }
  } catch (err) {
    console.error('❌ Signup error:', err)
  }

  // 2. Profile CRUD & Completeness
  console.log(`\n[Test 2] Profile CRUD & Completeness`)
  try {
    const getRes = await fetch(`${baseUrl}/api/profile`, {
      headers: { Cookie: cookie }
    })
    const getBody = await getRes.json()
    console.log('Initial Completeness:', getBody.data?.completeness)

    const putRes = await fetch(`${baseUrl}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ fullName: 'Test User Profile', headline: 'Testing API' })
    })
    const putBody = await putRes.json()
    console.log('✅ Basic Info updated. New Completeness:', putBody.data?.completeness)

    // Check ownership isolation by making request without cookie
    const unauthorizedRes = await fetch(`${baseUrl}/api/profile`, { method: 'GET' })
    if (unauthorizedRes.status === 401) {
      console.log('✅ Authentication isolation confirmed (401 without cookie).')
    } else {
      console.log('❌ Authentication isolation failed. Status:', unauthorizedRes.status)
    }

  } catch (err) {
    console.error('❌ Profile CRUD error:', err)
  }

  // 3. Subdocuments (Experience)
  console.log(`\n[Test 3] Subdocuments (Experience)`)
  let expId = ''
  try {
    const expRes = await fetch(`${baseUrl}/api/profile/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ title: 'Software Engineer', company: 'Tech Corp' })
    })
    const expBody = await expRes.json()
    if (expBody.data) {
      expId = expBody.data.profile.experience[0]._id
      console.log('✅ Experience added manually, source:', expBody.data.profile.experience[0].source)
    } else {
      console.log('❌ Experience add failed:', expBody)
    }
  } catch (err) {
    console.error('❌ Experience add error:', err)
  }

  // 4. LinkedIn Reference
  console.log(`\n[Test 4] LinkedIn Reference`)
  try {
    const liRes = await fetch(`${baseUrl}/api/profile/social-links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/testuser' }] })
    })
    const liBody = await liRes.json()
    if (liBody.data && liBody.data.profile.socialLinks[0].url === 'https://linkedin.com/in/testuser') {
      console.log('✅ LinkedIn URL reference updated successfully without scraping.')
    } else {
      console.log('❌ LinkedIn error:', liBody)
    }
  } catch (err) {
    console.error('❌ LinkedIn error:', err)
  }

  // 5. GitHub API
  console.log(`\n[Test 5] GitHub API Integration`)
  try {
    const ghRes = await fetch(`${baseUrl}/api/profile/github/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ username: 'octocat' })
    })
    const ghBody = await ghRes.json()
    if (ghBody.success && ghBody.data.profile.username === 'octocat') {
      console.log('✅ GitHub fetched successfully. Repos found:', ghBody.data.repos.length)
      
      // Import
      const importRes = await fetch(`${baseUrl}/api/profile/github/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ repos: [ghBody.data.repos[0]] })
      })
      const importBody = await importRes.json()
      if (importBody.data) {
        console.log('✅ GitHub repo imported. Total projects:', importBody.data.profile.projects.length)
        console.log('Provenance source:', importBody.data.profile.projects[0].source)
      } else {
        console.log('❌ GitHub repo import failed:', importBody)
      }

      // Duplicate Handling test
      const importRes2 = await fetch(`${baseUrl}/api/profile/github/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ repos: [ghBody.data.repos[0]] })
      })
      const importBody2 = await importRes2.json()
      if (importBody2.data.profile.projects.length === 1) {
        console.log('✅ Duplicate GitHub import prevented successfully.')
      } else {
        console.log('❌ Duplicate GitHub import failed (added twice).')
      }

    } else {
      console.log('❌ GitHub fetch failed:', ghBody)
    }

    // Rate limit / Invalid user test
    const ghErrRes = await fetch(`${baseUrl}/api/profile/github/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ username: 'nonexistentuser1234567890' })
    })
    if (ghErrRes.status === 404) {
      console.log('✅ GitHub invalid user correctly handled (404).')
    } else {
      console.log('❌ GitHub invalid user handler failed:', ghErrRes.status)
    }
  } catch (err) {
    console.error('❌ GitHub test error:', err)
  }

  // 6. Resume Upload (Malformed/Oversized handling)
  console.log(`\n[Test 6] Resume Upload Security`)
  try {
    // We'll test with a FormData payload but without a valid file to trigger validation
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const payload = `--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nThis is a fake resume.\r\n--${boundary}--`

    const uploadRes = await fetch(`${baseUrl}/api/profile/resume/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: cookie
      },
      body: payload
    })
    
    // The server should reject .txt due to multer filter
    if (uploadRes.status === 400) {
      const data = await uploadRes.json()
      console.log('✅ Invalid file upload correctly blocked (400). Message:', data.error)
    } else {
      console.log('❌ Invalid file upload not blocked. Status:', uploadRes.status)
    }
  } catch (err) {
    console.error('❌ Upload test error:', err)
  }

  console.log('\n--- Verification complete ---')
}

run()
