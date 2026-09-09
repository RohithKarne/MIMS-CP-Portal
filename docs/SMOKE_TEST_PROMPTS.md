# Pharaxis One — Smoke Test Prompts

## Section 1 — File Header
- Title: Pharaxis One — Smoke Test Prompts
- Date: 2026-04-12
- Platform context: Pharaxis One — 5 apps deployed on AWS EC2 at permanent IP 13.205.213.128
- All backends: Node.js + Express APIs (app-specific DB backends)
- All frontends: React, served as static files via Nginx
- Backend health check pattern: `GET /appname/api/health` → HTTP 200
- Note: these smoke tests use Node.js native `fetch` (Node 22) to hit live API endpoints directly — no browser needed

### QA Team Instructions
1. For each app section, copy only the text between the `---` delimiters.
2. Paste it into Claude Code exactly as-is.
3. Let Claude Code create the Node.js script, run it immediately, and print PASS/FAIL output.
4. Capture the console output and summary for your QA report.
5. Use the final combined prompt for a quick all-app health snapshot.

## Section 2 — 5 App Smoke Test Prompts

## App 1 — MIMS Smoke Test
### Prompt (copy everything below this line into Claude Code)
---
[PROMPT STARTS HERE]
You are running a live API smoke test for the MIMS app.

Context:
- Frontend: http://13.205.213.128/mims/
- Superadmin URL: http://13.205.213.128/mims/superadmin.html
- API base: http://13.205.213.128/mims/api
- Admin login: vanaja_admin@reviewco.com / Test@1234
- Superadmin login: username superadmin / Manager@123

Write a Node.js 22 script named `smoke_mims.js` using native `fetch` (no imports), run it immediately, and print clear `✅ PASS` / `❌ FAIL` lines for each test plus a summary.

Test cases to implement:
1. `GET /health` → expect HTTP 200 + JSON response
2. `POST /auth/login` (admin login) → expect HTTP 200 + JSON response
3. If login returns `challengeToken` without JWT, call `POST /auth/2fa/skip-setup` to obtain JWT
4. `GET /cases` with admin Bearer JWT → expect HTTP 200 + JSON response
5. `GET /users` with admin Bearer JWT → expect HTTP 200 + JSON response
6. `GET /admin/picklists` with admin Bearer JWT → expect HTTP 200 + JSON response

Use this exact script:

```js
const API_BASE = 'http://13.205.213.128/mims/api';

const results = [];

function logResult(name, pass, details = '') {
  results.push({ name, pass, details });
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} - ${name}${details ? ` (${details})` : ''}`);
}

function extractToken(payload) {
  const candidates = [
    payload?.token,
    payload?.jwt,
    payload?.accessToken,
    payload?.authToken,
    payload?.data?.token,
    payload?.data?.jwt,
    payload?.data?.accessToken,
    payload?.result?.token,
    payload?.result?.accessToken,
    payload?.user?.token,
  ];
  return candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
}

async function requestJson(testName, path, { method = 'GET', body, token, expectedStatus = 200, expectedStatuses } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const raw = await res.text();
    let json = null;
    let isJsonObjectOrArray = false;

    try {
      json = raw ? JSON.parse(raw) : null;
      isJsonObjectOrArray = json !== null && typeof json === 'object';
    } catch {
      isJsonObjectOrArray = false;
    }

    const allowedStatuses = Array.isArray(expectedStatuses) && expectedStatuses.length > 0
      ? expectedStatuses
      : [expectedStatus];
    const pass = allowedStatuses.includes(res.status) && isJsonObjectOrArray;
    const details = `status=${res.status}, expected=${allowedStatuses.join('|')}, json=${isJsonObjectOrArray ? 'ok' : 'invalid'}`;
    logResult(testName, pass, details);

    return { res, json, raw };
  } catch (err) {
    logResult(testName, false, `request_error=${err.message}`);
    return { res: null, json: null, raw: '' };
  }
}

(async () => {
  await requestJson('Health check GET /health', '/health');

  const adminLogin = await requestJson('Admin login POST /auth/login', '/auth/login', {
    method: 'POST',
    body: { email: 'vanaja_admin@reviewco.com', password: 'Test@1234' },
  });
  let adminToken = extractToken(adminLogin.json);

  if (!adminToken && adminLogin?.json?.challengeToken && adminLogin?.json?.twoFactorRequired === false) {
    const skipSetup = await requestJson('POST /auth/2fa/skip-setup (optional setup bypass)', '/auth/2fa/skip-setup', {
      method: 'POST',
      body: { challengeToken: adminLogin.json.challengeToken },
    });
    adminToken = extractToken(skipSetup.json);
  }

  logResult('Admin login JWT present', Boolean(adminToken), adminToken ? 'token_found=yes' : 'token_found=no');

  await requestJson('GET /cases (admin auth)', '/cases', {
    token: adminToken || 'invalid-token',
  });

  await requestJson('GET /users (admin auth)', '/users', {
    token: adminToken || 'invalid-token',
  });

  await requestJson('GET /admin/picklists (admin auth)', '/admin/picklists', {
    token: adminToken || 'invalid-token',
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`\nSummary: ${passed} passed, ${failed} failed, total ${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter((x) => !x.pass)) {
      console.log(`- ${r.name}${r.details ? ` :: ${r.details}` : ''}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
})();
```

Then run:

```bash
node smoke_mims.js
```

Return:
1. Full console output
2. PASS/FAIL summary
3. Any failures with status code and response snippet
[PROMPT ENDS HERE]
---

## App 2 — CP Portal Smoke Test
### Prompt (copy everything below this line into Claude Code)
---
[PROMPT STARTS HERE]
You are running a live API smoke test for the CP Portal app.

Context:
- Frontend: http://13.205.213.128/cp-portal/
- API base: http://13.205.213.128/cp-portal/api
- Admin login: cpadmin / Admin@123

Write a Node.js 22 script named `smoke_cp_portal.js` using native `fetch` (no imports), run it immediately, and print clear `✅ PASS` / `❌ FAIL` lines for each test plus a summary.

Test cases to implement:
1. `GET /health` → expect HTTP 200 + JSON response
2. `POST /admin/auth/login` (admin login) → expect HTTP 200 + JSON response + JWT present
3. `GET /admin/auth/me` with admin Bearer JWT → expect HTTP 200 + JSON response
4. `GET /admin/clients` with admin Bearer JWT → expect HTTP 200 + JSON response

Use this exact script:

```js
const API_BASE = 'http://13.205.213.128/cp-portal/api';

const results = [];

function logResult(name, pass, details = '') {
  results.push({ name, pass, details });
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} - ${name}${details ? ` (${details})` : ''}`);
}

function extractToken(payload) {
  const candidates = [
    payload?.token,
    payload?.jwt,
    payload?.accessToken,
    payload?.authToken,
    payload?.data?.token,
    payload?.data?.jwt,
    payload?.data?.accessToken,
    payload?.result?.token,
    payload?.result?.accessToken,
    payload?.user?.token,
  ];
  return candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
}

async function requestJson(testName, path, { method = 'GET', body, token, expectedStatus = 200, expectedStatuses } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const raw = await res.text();
    let json = null;
    let isJsonObjectOrArray = false;

    try {
      json = raw ? JSON.parse(raw) : null;
      isJsonObjectOrArray = json !== null && typeof json === 'object';
    } catch {
      isJsonObjectOrArray = false;
    }

    const allowedStatuses = Array.isArray(expectedStatuses) && expectedStatuses.length > 0
      ? expectedStatuses
      : [expectedStatus];
    const pass = allowedStatuses.includes(res.status) && isJsonObjectOrArray;
    const details = `status=${res.status}, expected=${allowedStatuses.join('|')}, json=${isJsonObjectOrArray ? 'ok' : 'invalid'}`;
    logResult(testName, pass, details);

    return { res, json, raw };
  } catch (err) {
    logResult(testName, false, `request_error=${err.message}`);
    return { res: null, json: null, raw: '' };
  }
}

(async () => {
  await requestJson('Health check GET /health', '/health');

  const adminLogin = await requestJson('Admin login POST /admin/auth/login', '/admin/auth/login', {
    method: 'POST',
    body: { email: 'cpadmin', password: 'Admin@123' },
  });

  const adminToken = extractToken(adminLogin.json);
  logResult('Admin login JWT present', Boolean(adminToken), adminToken ? 'token_found=yes' : 'token_found=no');

  await requestJson('GET /admin/auth/me (admin auth)', '/admin/auth/me', {
    token: adminToken || 'invalid-token',
  });

  await requestJson('GET /admin/clients (admin auth)', '/admin/clients', {
    token: adminToken || 'invalid-token',
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`\nSummary: ${passed} passed, ${failed} failed, total ${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter((x) => !x.pass)) {
      console.log(`- ${r.name}${r.details ? ` :: ${r.details}` : ''}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
})();
```

Then run:

```bash
node smoke_cp_portal.js
```

Return:
1. Full console output
2. PASS/FAIL summary
3. Any failures with status code and response snippet
[PROMPT ENDS HERE]
---
