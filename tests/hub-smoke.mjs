// Production smoke check for the Nibble Nation hub.
//
// Signs in exactly the way the login form does, then asserts that every hub route
// serves and every hub card renders. Exists because the hub was silently reverted
// twice (2026-08-31, 2026-09-05) by deploys that lacked the hub code, and nobody
// could tell from outside: the password gate returns the same 401 whether a route
// exists or not. This check looks behind the gate.
//
// Usage:
//   NIBBLE_PASSWORD=... node tests/hub-smoke.mjs                 # against production
//   SMOKE_BASE_URL=http://127.0.0.1:8899 NIBBLE_PASSWORD=... node tests/hub-smoke.mjs
//
// The password is read from the environment only and is never printed. Exit code is
// non-zero on any failure so CI fails loudly.

import assert from 'node:assert/strict';

const BASE = (process.env.SMOKE_BASE_URL || 'https://nexuscmd.io').replace(/\/+$/, '');
const PASSWORD = process.env.NIBBLE_PASSWORD;
const COOKIE = 'nn_session';
const RETRIES = Number(process.env.SMOKE_RETRIES || 4);
const RETRY_WAIT_MS = Number(process.env.SMOKE_RETRY_WAIT_MS || 20000);

// Every protected route the hub serves, with a string that only the real page carries.
const ROUTES = [
  ['/nibblenation', 'Team Resources'],
  ['/nibblenation/inventory', 'Inventory'],
  ['/nibblenation/offboarding', 'Offboarding'],
  ['/nibblenation/interview', 'Interview'],
  ['/nibblenation/certification', 'Certification'],
  ['/nibblenation/art-test', 'A.R.T.'],
  ['/nibblenation/art-test-agm', 'A.R.T.'],
  ['/nibblenation/art-test-sm', 'A.R.T.'],
  ['/nibblenation/art-test-crew', 'A.R.T.']
];

// Every card the hub page must show. Add a line here when a card ships.
const HUB_CARDS = [
  'Start Here',
  'Company Systems',
  'Interview Simulator',
  'Inventory Calculator',
  'Employee Offboarding',
  'Training Library',
  'A.R.T.'
];

const failures = [];
function check(label, condition, detail = '') {
  if (condition) console.log(`  ok    ${label}`);
  else { console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); failures.push(label); }
}

async function signIn() {
  const res = await fetch(`${BASE}/nibblenation/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password: PASSWORD })
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return { status: res.status, cookie: match ? `${COOKIE}=${match[1]}` : null, setCookie };
}

async function run() {
  assert.ok(PASSWORD, 'NIBBLE_PASSWORD is not set');
  console.log(`Hub smoke against ${BASE}`);

  // Public invariants that do not need the password. These are the SEO properties the
  // 2026-09-05 deploy shipped; a regression here means someone deployed a stale tree.
  const home = await fetch(`${BASE}/?smoke=${Date.now()}`);
  const homeHtml = await home.text();
  check('home responds 200', home.status === 200, String(home.status));
  check('home has no .html internal links', !/href="[^"]*\.html"/.test(homeHtml));
  const gate = await fetch(`${BASE}/nibblenation?smoke=${Date.now()}`);
  check('hub is gated when signed out (401)', gate.status === 401, String(gate.status));

  // Sign in. Production aliases can lag a deploy by a few seconds; retry the login.
  let session = null;
  let cookieFlags = '';
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const result = await signIn();
    if (result.status === 303 && result.cookie) { session = result.cookie; cookieFlags = result.setCookie; break; }
    if (attempt < RETRIES) {
      console.log(`  ..    sign-in attempt ${attempt} returned ${result.status}; retrying in ${RETRY_WAIT_MS / 1000}s`);
      await new Promise((r) => setTimeout(r, RETRY_WAIT_MS));
    }
  }
  check('sign-in issues a session cookie', Boolean(session));
  if (!session) return finish();

  // Behind the gate: every route serves the real page.
  const pages = {};
  for (const [path, marker] of ROUTES) {
    const res = await fetch(`${BASE}${path}?smoke=${Date.now()}`, { headers: { cookie: session } });
    const html = await res.text();
    pages[path] = html;
    check(`${path} serves (200, contains "${marker}")`, res.status === 200 && html.includes(marker), `status ${res.status}`);
  }

  // The hub page shows every card.
  const hub = pages['/nibblenation'] || '';
  for (const card of HUB_CARDS) check(`hub shows card "${card}"`, hub.includes(card));

  // Session hygiene, from the cookie the successful sign-in issued: not readable by
  // scripts, not sent cross-site, and (in production) only over HTTPS.
  check('session cookie is HttpOnly', /httponly/i.test(cookieFlags));
  check('session cookie is SameSite', /samesite/i.test(cookieFlags));
  check('session cookie is Secure', /secure/i.test(cookieFlags));

  return finish();
}

function finish() {
  if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:\n  - ${failures.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('\nAll hub smoke checks passed.');
}

run().catch((error) => {
  // Never echo the environment; the message is enough.
  console.error(`Smoke check crashed: ${error.message}`);
  process.exit(2);
});
