import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

const offboarding = (await import('../api/_nn/offboarding.js')).default || await import('../api/_nn/offboarding.js');

function payload(overrides = {}) {
  return {
    request_token: `test-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    manager_name: 'Test Manager',
    manager_email: 'manager@nibblenation.com',
    employee_name: 'Test Employee',
    employee_id: 'QA-1',
    store_code: '1530-0002',
    position: 'Store Manager',
    last_day_worked: '2026-08-25',
    separation_date: '2026-08-25',
    state: 'Florida',
    separation_code: 'IT-AT',
    rehire_code: 'CR',
    authority_code: 'SM-R',
    attendance_event_date: '2026-08-25',
    attendance_event_type: 'tardy',
    prior_attendance_incidents: 'None recorded',
    prior_coaching_warnings: 'Coaching documented',
    attendance_dates: '2026-08-01',
    final_warning_issued: 'false',
    attendance_expectation_known: 'yes',
    attendance_narrative: 'Factual QA narrative',
    evidence_available: 'true',
    evidence_types: ['attendance record'],
    evidence_reference: 'QA-REF-1',
    evidence_summary: 'Synthetic staging evidence reference',
    protected_flags: ['none known'],
    final_hours_verified: 'pending',
    time_correction: 'no',
    reimbursement: 'no',
    bonus_pending: 'no',
    payroll_notes: 'QA only',
    property_restaurant_keys: 'returned',
    property_safe_key: 'not_applicable',
    property_uniforms: 'returned',
    property_documents: 'not_applicable',
    property_company_device: 'not_applicable',
    property_other_property: 'not_applicable',
    access_items: ['none'],
    florida_processing_notes: 'QA only',
    cert_reviewed: 'true',
    cert_factual: 'true',
    cert_supporting: 'true',
    cert_recommendation: 'true',
    cert_no_sensitive: 'true',
    cert_review: 'true',
    cert_name: 'Test Manager',
    cert_date: '2026-08-25',
    ...overrides,
  };
}

function response() {
  const headers = {};
  return {
    statusCode: 0,
    headers,
    body: '',
    setHeader(name, value) { headers[name] = value; },
    end(body = '') { this.body = body; },
  };
}

test('form is protected-content shaped and excludes prohibited fields and secrets', () => {
  assert.match(offboarding.FORM, /\/nibblenation\/offboarding\/submit/);
  for (const store of ['1530-0002', '1530-0003', '1530-0004', '1530-0011', '1530-0012']) assert.match(offboarding.FORM, new RegExp(store));
  assert.doesNotMatch(offboarding.FORM, /name=["'](?:ssn|password|safe_combination|alarm_code|payment_card)/i);
  assert.doesNotMatch(offboarding.FORM, /RESEND_API_KEY|process\.env/);
  assert.match(offboarding.FORM, /STORE MANAGER RECOMMENDATION ONLY/);
  assert.match(offboarding.FORM, /Georgia DOL-800/);
  assert.match(offboarding.FORM, /Florida processing/);
});

test('server validation enforces locked stores, controlled codes, OTH review, and policy-derived rehire', () => {
  assert.equal(offboarding.validate(payload()).store_code, '1530-0002');
  assert.throws(() => offboarding.validate(payload({ store_code: '1530-0099' })), /invalid_store_code/);
  assert.throws(() => offboarding.validate(payload({ separation_code: 'MADE-UP' })), /invalid_separation_code/);
  assert.throws(() => offboarding.validate(payload({ authority_code: 'AS-A' })), /invalid_authority_code/);
  assert.throws(() => offboarding.validate(payload({ separation_code: 'OTH', rehire_code: 'EC', factual_reason: 'Facts', area_supervisor_notified: 'false' })), /area_review_required/);
  assert.equal(offboarding.validate(payload({ separation_code: 'JA-CF', rehire_code: 'EC', missed_shifts: 'Two', communication_received: 'false', contact_attempts: 'Call', contact_dates: '2026-08-24', contact_methods: 'call', abandonment_narrative: 'Facts' })).rehire_code, 'RI');
  assert.equal(offboarding.validate(payload({ separation_code: 'SM-TF', rehire_code: 'PRI', incident_datetime: '2026-08-25T10:00', incident_summary: 'Facts', evidence_available: 'true', evidence_types: ['cash/inventory report'], incident_reviewed_by: 'Area Supervisor', area_supervisor_notified: 'true' })).rehire_code, 'PR');
});

test('protected router gates offboarding and preserves interview routing', async () => {
  process.env.NIBBLE_PASSWORD = 'test-password-only';
  const nn = (await import('../api/nn.js')).default || await import('../api/nn.js');
  const unauth = response();
  await nn({ method: 'GET', query: { p: 'offboarding' }, headers: {} }, unauth);
  assert.equal(unauth.statusCode, 401);
  const expiry = String(Date.now() + 60_000);
  const signature = crypto.createHmac('sha256', process.env.NIBBLE_PASSWORD).update(expiry).digest('base64url');
  const cookie = `nn_session=${expiry}.${signature}`;
  const form = response();
  await nn({ method: 'GET', query: { p: 'offboarding' }, headers: { cookie } }, form);
  assert.equal(form.statusCode, 200);
  assert.match(form.body, /Employee separation \/ offboarding/);
  const interview = response();
  await nn({ method: 'GET', query: { p: 'interview' }, headers: { cookie } }, interview);
  assert.equal(interview.statusCode, 200);
  assert.match(interview.body, /Interview/);
  const hub = response();
  await nn({ method: 'GET', query: { p: '' }, headers: { cookie } }, hub);
  assert.match(hub.body, /Open offboarding form/);
});

test('missing Resend configuration fails safely without confirmation', async () => {
  const old = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const errors = [];
  const original = console.error;
  console.error = value => errors.push(String(value));
  try {
    const res = response();
    await offboarding.submit({ method: 'POST', body: payload() }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body, /Submission could not be completed/);
    assert.doesNotMatch(res.body, /RESEND|Employee|QA narrative/);
    assert.ok(errors.every(line => !/Test Employee|QA narrative|nibblenation\.com/.test(line)));
  } finally {
    console.error = original;
    if (old === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = old;
  }
});

test('email workflow uses fixed recipients, escapes content, and is idempotent', async () => {
  const old = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-only-placeholder';
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true };
  };
  try {
    const input = payload({ employee_name: '<img src=x onerror=alert(1)>' });
    const first = response();
    await offboarding.submit({ method: 'POST', body: input }, first);
    assert.equal(first.statusCode, 200);
    const result = JSON.parse(first.body);
    assert.equal(result.ok, true);
    assert.match(result.submission_id, /^SEP-\d{8}-[A-F0-9]{6}$/);
    assert.match(result.html, new RegExp(result.submission_id));
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].body.to, ['shaun@nibblenation.com', 't.harvey@nibblenation.com']);
    assert.deepEqual(calls[1].body.to, ['manager@nibblenation.com']);
    assert.equal(calls[0].body.from, 'Nibble Nation Offboarding <nibblenation@nexuscmd.io>');
    assert.equal(calls[0].body.reply_to, 'manager@nibblenation.com');
    assert.match(calls[0].body.subject, new RegExp(result.submission_id));
    assert.doesNotMatch(calls[0].body.html, /<img src=x onerror/);
    const duplicate = response();
    await offboarding.submit({ method: 'POST', body: input }, duplicate);
    assert.equal(duplicate.statusCode, 200);
    assert.equal(JSON.parse(duplicate.body).submission_id, result.submission_id);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (old === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = old;
  }
});

test('newline email injection and oversized body are rejected', async () => {
  assert.throws(() => offboarding.validate(payload({ manager_email: 'manager@nibblenation.com\r\nBcc:evil@example.com' })), /invalid_manager_email/);
  const res = response();
  await offboarding.submit({ method: 'POST', body: 'x'.repeat(128 * 1024 + 1) }, res);
  assert.equal(res.statusCode, 413);
  assert.match(res.body, /Submission could not be completed/);
});
