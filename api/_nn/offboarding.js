/* Protected Nibble Nation offboarding form and submission workflow. */
const crypto = require('crypto');

const MAX_BODY = 128 * 1024;
const MANAGEMENT = ['shaun@nibblenation.com', 't.harvey@nibblenation.com'];
const FROM = 'Nibble Nation Offboarding <nibblenation@nexuscmd.io>';
const BASE = '/nibblenation/offboarding';

const STORES = {
  '1530-0002': 'Store 2 — 1530-0002',
  '1530-0003': 'Store 3 — 1530-0003',
  '1530-0004': 'Store 4 — 1530-0004',
  '1530-0011': 'Store 11 — 1530-0011',
  '1530-0012': 'Store 12 — 1530-0012',
};
const POSITIONS = ['Crew', 'Shift Manager', 'Assistant Manager', 'Store Manager', 'Other'];
const STATES = ['Georgia', 'Florida'];
const REHIRE = {
  EC: 'Eligible for Consideration', CR: 'Conditional Review Required', RI: 'Rehire Ineligible',
  PRI: 'Permanent Rehire Ineligible', PR: 'Pending Review',
};
const REASONS = {
  'VR-GS': ['Voluntary resignation — good standing/proper notice', 'voluntary'],
  'VR-NN': ['Voluntary resignation — insufficient/no notice', 'voluntary'],
  'VR-PF': ['Personal/family circumstances', 'voluntary'], 'VR-MD': ['Medical/health-related separation', 'voluntary'],
  'VR-ED': ['School/education', 'voluntary'], 'VR-RL': ['Relocation', 'voluntary'],
  'VR-SC': ['Scheduling/availability conflict', 'voluntary'], 'VR-TR': ['Transportation/reliability circumstances', 'voluntary'],
  'IT-AT': ['Involuntary termination — attendance', 'involuntary'], 'IT-PF': ['Involuntary termination — performance', 'involuntary'],
  'IT-CD': ['Involuntary termination — conduct/discipline', 'involuntary'], 'JA-CF': ['Confirmed job abandonment', 'involuntary'],
  'SM-TF': ['Substantiated theft/fraud', 'serious'], 'SM-CM': ['Cash manipulation', 'serious'],
  'SM-FR': ['Falsification of company records', 'serious'], 'SM-IM': ['Intentional inventory manipulation', 'serious'],
  'SM-VT': ['Workplace violence/credible threat', 'serious'], 'SM-HD': ['Serious harassment/discrimination', 'serious'],
  'SM-FS': ['Deliberate serious food-safety violation', 'serious'], 'SM-WS': ['Deliberate serious workplace-safety violation', 'serious'],
  'SM-SE': ['Serious security violation', 'serious'], 'SM-PC': ['Intentional misuse of payment/customer information', 'serious'],
  'SM-DP': ['Deliberate destruction of company property', 'serious'], 'SL-DT': ['Senior-leadership-directed termination', 'leadership'],
  LW: ['Layoff/lack of work', 'layoff'], OTH: ['Other documented separation', 'other'],
};
const VOLUNTARY = new Set(['VR-GS', 'VR-NN']);
const PERSONAL = new Set(['VR-PF', 'VR-MD', 'VR-ED', 'VR-RL', 'VR-SC', 'VR-TR']);
const SERIOUS = new Set(Object.keys(REASONS).filter(code => REASONS[code][1] === 'serious'));
const EVIDENCE = ['attendance record', 'schedule', 'punch record', 'warning/write-up', 'manager notes', 'employee message', 'witness statement', 'camera/security review', 'cash/inventory report', 'other'];
const PROTECTED = ['protected medical/family leave', 'disability/accommodation request', 'workers’ compensation/workplace injury', 'military service', 'discrimination/harassment complaint', 'wage/pay complaint', 'workplace safety complaint', 'protected concerted activity', 'other potentially protected activity', 'none known', 'unsure'];
const PROPERTY = ['restaurant_keys', 'safe_key', 'uniforms', 'documents', 'company_device', 'other_property'];
const ACCESS = ['alarm', 'safe', 'pos_management', 'banking', 'management_credentials', 'other_restricted_access', 'none'];
const ALLOWED_STATUS = new Set(['returned', 'outstanding', 'not_applicable']);
const ALLOWED_KEYS = new Set([
  'request_token', 'manager_name', 'manager_email', 'employee_name', 'employee_id', 'store_code', 'position', 'hire_date',
  'last_day_worked', 'separation_date', 'separation_time', 'state', 'separation_code', 'rehire_code', 'authority_code',
  'resignation_notice_date', 'notice_method', 'two_week_notice', 'notice_completed', 'employee_stated_reason', 'final_scheduled_shift', 'manager_comments',
  'factual_reason', 'communicated_before', 'accommodation_discussion', 'potentially_correctable', 'supporting_notes',
  'attendance_event_date', 'attendance_event_type', 'prior_attendance_incidents', 'prior_coaching_warnings', 'attendance_dates', 'final_warning_issued', 'attendance_expectation_known', 'attendance_narrative',
  'performance_standard', 'performance_coaching', 'performance_warnings', 'training_provided', 'performance_dates', 'triggering_performance_event', 'performance_narrative',
  'conduct_policy', 'incident_date', 'witnesses', 'employee_response', 'prior_discipline', 'conduct_narrative',
  'missed_shifts', 'communication_received', 'contact_attempts', 'contact_dates', 'contact_methods', 'abandonment_response', 'abandonment_narrative',
  'incident_datetime', 'incident_summary', 'evidence_available', 'serious_witnesses', 'law_enforcement_involvement', 'serious_employee_response', 'incident_reviewed_by', 'area_supervisor_notified',
  'directing_authority', 'direction_date', 'leadership_notes', 'approval_status', 'business_reason', 'layoff_duration', 'acceptable_standing',
  'evidence_types', 'evidence_reference', 'evidence_summary', 'protected_flags', 'final_hours_verified', 'last_payroll_date', 'time_correction', 'reimbursement', 'bonus_pending', 'payroll_notes',
  'property_restaurant_keys', 'property_safe_key', 'property_uniforms', 'property_documents', 'property_company_device', 'property_other_property', 'access_items',
  'dol800_prepared', 'dol800_delivery', 'dol800_delivery_date', 'dol800_notes', 'florida_processing_notes',
  'cert_reviewed', 'cert_factual', 'cert_supporting', 'cert_recommendation', 'cert_no_sensitive', 'cert_review', 'cert_name', 'cert_date',
]);
const CACHE = new Map();

function esc(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.end(JSON.stringify(body));
}
function fail(res, status, category) {
  console.error(JSON.stringify({ event: 'nibble_offboarding_failed', category, status, ts: new Date().toISOString() }));
  return json(res, status, { error: 'Submission could not be completed. No confirmation was issued. Please retry or contact the Area Supervisor.' });
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      try {
        if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > MAX_BODY) return reject(new Error('body_too_large'));
      } catch { return reject(new Error('invalid_payload')); }
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      if (req.body.length > MAX_BODY) return reject(new Error('body_too_large'));
      try { return resolve(JSON.parse(req.body)); } catch { return reject(new Error('invalid_json')); }
    }
    let raw = '';
    let finished = false;
    req.on('data', chunk => {
      if (finished) return;
      raw += String(chunk);
      if (raw.length > MAX_BODY) {
        finished = true;
        reject(new Error('body_too_large'));
      }
    });
    req.on('end', () => {
      if (finished || raw.length > MAX_BODY) return;
      finished = true;
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('invalid_json')); }
    });
    req.on('error', () => { if (!finished) { finished = true; reject(new Error('body_read_failed')); } });
  });
}
function stringValue(body, key, max, required = false) {
  const value = body[key];
  if (value == null || value === '') { if (required) throw new Error(`required_${key}`); return ''; }
  if (typeof value !== 'string' || value.length > max || /[\u0000]/.test(value)) throw new Error(`invalid_${key}`);
  return value.trim();
}
function oneOf(body, key, allowed, required = false) {
  const value = stringValue(body, key, 160, required);
  if (!value && !required) return '';
  if (!allowed.includes(value)) throw new Error(`invalid_${key}`);
  return value;
}
function listOf(body, key, allowed, required = false) {
  const value = body[key];
  if (value == null) { if (required) throw new Error(`required_${key}`); return []; }
  if (!Array.isArray(value) || value.length > 20 || value.some(item => typeof item !== 'string' || !allowed.includes(item))) throw new Error(`invalid_${key}`);
  const unique = [...new Set(value)];
  if (required && !unique.length) throw new Error(`required_${key}`);
  return unique;
}
function bool(body, key, required = false) {
  const value = body[key];
  if (value === true || value === 'true' || value === 'yes') return true;
  if (value === false || value === 'false' || value === 'no') return false;
  if (required) throw new Error(`required_${key}`);
  return null;
}
function dateValue(body, key, required = false) {
  const value = stringValue(body, key, 10, required);
  if (!value && !required) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error(`invalid_${key}`);
  return value;
}
function requireText(body, key, max = 2000) { return stringValue(body, key, max, true); }
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_payload');
  if (Object.keys(body).some(key => !ALLOWED_KEYS.has(key))) throw new Error('unknown_field');
  const result = {};
  result.request_token = stringValue(body, 'request_token', 128, true);
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(result.request_token)) throw new Error('invalid_request_token');
  result.manager_name = requireText(body, 'manager_name', 120);
  result.manager_email = requireText(body, 'manager_email', 254);
  if (/\r|\n/.test(result.manager_email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.manager_email)) throw new Error('invalid_manager_email');
  result.external_email_warning = !result.manager_email.toLowerCase().endsWith('@nibblenation.com');
  result.employee_name = requireText(body, 'employee_name', 160);
  result.employee_id = stringValue(body, 'employee_id', 80);
  result.store_code = oneOf(body, 'store_code', Object.keys(STORES), true);
  result.store = STORES[result.store_code];
  result.position = oneOf(body, 'position', POSITIONS, true);
  result.hire_date = dateValue(body, 'hire_date');
  result.last_day_worked = dateValue(body, 'last_day_worked', true);
  result.separation_date = dateValue(body, 'separation_date', true);
  result.separation_time = stringValue(body, 'separation_time', 12);
  result.state = oneOf(body, 'state', STATES, true);
  result.separation_code = oneOf(body, 'separation_code', Object.keys(REASONS), true);
  result.authority_code = oneOf(body, 'authority_code', ['SM-R'], true);
  result.rehire_code = oneOf(body, 'rehire_code', Object.keys(REHIRE), true);

  const code = result.separation_code;
  if (VOLUNTARY.has(code)) {
    result.resignation_notice_date = dateValue(body, 'resignation_notice_date', true);
    result.notice_method = requireText(body, 'notice_method', 120);
    result.two_week_notice = bool(body, 'two_week_notice', true);
    result.notice_completed = requireText(body, 'notice_completed', 80);
    result.employee_stated_reason = requireText(body, 'employee_stated_reason');
    result.final_scheduled_shift = requireText(body, 'final_scheduled_shift', 120);
    result.manager_comments = stringValue(body, 'manager_comments', 2000);
  } else if (PERSONAL.has(code)) {
    result.factual_reason = requireText(body, 'factual_reason');
    result.communicated_before = bool(body, 'communicated_before', true);
    result.accommodation_discussion = bool(body, 'accommodation_discussion', true);
    result.potentially_correctable = bool(body, 'potentially_correctable', true);
    result.supporting_notes = stringValue(body, 'supporting_notes', 2000);
  } else if (code === 'IT-AT') {
    result.attendance_event_date = dateValue(body, 'attendance_event_date', true);
    result.attendance_event_type = requireText(body, 'attendance_event_type', 80);
    result.prior_attendance_incidents = requireText(body, 'prior_attendance_incidents');
    result.prior_coaching_warnings = requireText(body, 'prior_coaching_warnings');
    result.attendance_dates = requireText(body, 'attendance_dates', 1000);
    result.final_warning_issued = bool(body, 'final_warning_issued', true);
    result.attendance_expectation_known = requireText(body, 'attendance_expectation_known', 80);
    result.attendance_narrative = requireText(body, 'attendance_narrative');
  } else if (code === 'IT-PF') {
    result.performance_standard = requireText(body, 'performance_standard');
    result.performance_coaching = requireText(body, 'performance_coaching');
    result.performance_warnings = requireText(body, 'performance_warnings');
    result.training_provided = requireText(body, 'training_provided');
    result.performance_dates = requireText(body, 'performance_dates', 1000);
    result.triggering_performance_event = requireText(body, 'triggering_performance_event');
    result.performance_narrative = requireText(body, 'performance_narrative');
  } else if (code === 'IT-CD') {
    result.conduct_policy = requireText(body, 'conduct_policy');
    result.incident_date = dateValue(body, 'incident_date', true);
    result.witnesses = stringValue(body, 'witnesses', 1000);
    result.employee_response = stringValue(body, 'employee_response', 2000);
    result.prior_discipline = requireText(body, 'prior_discipline');
    result.conduct_narrative = requireText(body, 'conduct_narrative');
  } else if (code === 'JA-CF') {
    result.missed_shifts = requireText(body, 'missed_shifts');
    result.communication_received = bool(body, 'communication_received', true);
    result.contact_attempts = requireText(body, 'contact_attempts');
    result.contact_dates = requireText(body, 'contact_dates');
    result.contact_methods = requireText(body, 'contact_methods');
    result.abandonment_response = stringValue(body, 'abandonment_response', 2000);
    result.abandonment_narrative = requireText(body, 'abandonment_narrative');
    result.rehire_code = 'RI';
    result.rehire_code_source = 'policy_derived_job_abandonment';
  } else if (SERIOUS.has(code)) {
    result.incident_datetime = requireText(body, 'incident_datetime', 40);
    result.incident_summary = requireText(body, 'incident_summary');
    result.evidence_available = bool(body, 'evidence_available', true);
    result.serious_witnesses = stringValue(body, 'serious_witnesses', 1000);
    result.law_enforcement_involvement = stringValue(body, 'law_enforcement_involvement', 500);
    result.serious_employee_response = stringValue(body, 'serious_employee_response', 2000);
    result.incident_reviewed_by = requireText(body, 'incident_reviewed_by', 160);
    result.area_supervisor_notified = bool(body, 'area_supervisor_notified', true);
    result.rehire_code = 'PR';
    result.rehire_code_source = 'policy_derived_pending_higher_review';
  } else if (code === 'SL-DT') {
    result.directing_authority = requireText(body, 'directing_authority', 160);
    result.direction_date = dateValue(body, 'direction_date', true);
    result.leadership_notes = requireText(body, 'leadership_notes');
    result.approval_status = requireText(body, 'approval_status', 80);
    result.rehire_code = 'PR';
    result.rehire_code_source = 'policy_derived_pending_authority';
  } else if (code === 'LW') {
    result.business_reason = requireText(body, 'business_reason');
    result.layoff_duration = requireText(body, 'layoff_duration', 80);
    result.acceptable_standing = bool(body, 'acceptable_standing', true);
  } else if (code === 'OTH') {
    result.factual_reason = requireText(body, 'factual_reason');
    if (!bool(body, 'area_supervisor_notified', true)) throw new Error('area_review_required');
    result.area_supervisor_notified = true;
  }

  result.evidence_available = result.evidence_available == null ? bool(body, 'evidence_available', true) : result.evidence_available;
  result.evidence_types = listOf(body, 'evidence_types', EVIDENCE, result.evidence_available === true);
  result.evidence_reference = stringValue(body, 'evidence_reference', 500);
  result.evidence_summary = stringValue(body, 'evidence_summary', 2000);
  result.protected_flags = listOf(body, 'protected_flags', PROTECTED, true);
  if (result.protected_flags.includes('none known') && result.protected_flags.length > 1) throw new Error('invalid_protected_flags');
  result.protected_review_required = !result.protected_flags.includes('none known');
  if (result.protected_review_required) { result.rehire_code = 'PR'; result.rehire_code_source = 'protected_circumstance_review'; }

  result.final_hours_verified = oneOf(body, 'final_hours_verified', ['yes', 'no', 'pending'], true);
  result.last_payroll_date = dateValue(body, 'last_payroll_date');
  result.time_correction = oneOf(body, 'time_correction', ['yes', 'no'], true);
  result.reimbursement = oneOf(body, 'reimbursement', ['yes', 'no'], true);
  result.bonus_pending = oneOf(body, 'bonus_pending', ['yes', 'no', 'unknown'], true);
  result.payroll_notes = stringValue(body, 'payroll_notes', 2000);
  for (const key of PROPERTY) result[`property_${key}`] = oneOf(body, `property_${key}`, [...ALLOWED_STATUS], true);
  result.access_items = listOf(body, 'access_items', ACCESS, true);
  if (result.access_items.includes('none') && result.access_items.length > 1) throw new Error('invalid_access_items');
  result.access_review_required = !result.access_items.includes('none');

  if (result.state === 'Georgia') {
    result.dol800_prepared = oneOf(body, 'dol800_prepared', ['yes', 'no', 'pending'], true);
    result.dol800_delivery = oneOf(body, 'dol800_delivery', ['employee on final day', 'electronic', 'mailed', 'pending', 'other'], true);
    result.dol800_delivery_date = dateValue(body, 'dol800_delivery_date');
    if (result.dol800_delivery !== 'pending' && !result.dol800_delivery_date) throw new Error('required_dol800_delivery_date');
    result.dol800_notes = stringValue(body, 'dol800_notes', 1000);
  } else {
    result.florida_processing_notes = stringValue(body, 'florida_processing_notes', 2000);
  }
  for (const key of ['cert_reviewed', 'cert_factual', 'cert_supporting', 'cert_recommendation', 'cert_no_sensitive', 'cert_review']) {
    if (!bool(body, key, true)) throw new Error(`required_${key}`);
  }
  result.cert_name = requireText(body, 'cert_name', 120);
  result.cert_date = dateValue(body, 'cert_date', true);
  if (result.cert_name.toLowerCase() !== result.manager_name.toLowerCase()) throw new Error('certification_name_mismatch');
  if (result.rehire_code === 'PRI' && (SERIOUS.has(code) || result.protected_review_required || code === 'SL-DT')) throw new Error('higher_review_required');
  return result;
}
function idForNow() { return `SEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; }
function fingerprint(record) { return crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex'); }
function row(label, value) { return `<tr><th>${esc(label)}</th><td>${esc(Array.isArray(value) ? value.join(', ') : value || '—')}</td></tr>`; }
function recordHtml(record) {
  const reason = REASONS[record.separation_code];
  const conditional = Object.keys(record).filter(key => !['request_token', 'external_email_warning'].includes(key) && record[key] !== '' && record[key] !== null && record[key] !== undefined);
  const rows = conditional.map(key => row(key.replace(/_/g, ' '), record[key])).join('');
  return `<h1>Nibble Nation LLC</h1><h2>Employee Separation / Offboarding Record</h2><p><strong>Submission ID:</strong> ${esc(record.submission_id)}</p><table>${row('Submitted', record.submitted_at)}${row('Submitting manager', record.manager_name)}${row('Manager email', record.manager_email)}${row('Employee', record.employee_name)}${row('Employee ID', record.employee_id)}${row('Store', record.store)}${row('Position', record.position)}${row('State', record.state)}${row('Hire date', record.hire_date)}${row('Last day worked', record.last_day_worked)}${row('Effective separation date', record.separation_date)}${row('Separation code', `${record.separation_code} — ${reason[0]}`)}${row('Rehire recommendation', `${record.rehire_code} — ${REHIRE[record.rehire_code]}`)}${row('Authority', 'SM-R — Store Manager Recommendation')}${row('Area Supervisor final decision', 'PENDING')}${rows}</table><h3>Required processing</h3><ul><li>Gusto — Action Required: verify final hours, separation, and payroll notes.</li><li>Altametrics — Action Required: remove/deactivate employee and clean up scheduling/timekeeping.</li><li>Little Caesars Gateway — Action Required: deactivate access and update training/access records.</li></ul>${record.state === 'Georgia' ? '<h3>Georgia DOL-800</h3><p>Georgia DOL-800 must be completed through the authorized company process.</p>' : ''}<p><strong>Management review:</strong> ${record.protected_review_required || record.access_review_required || SERIOUS.has(record.separation_code) ? 'REQUIRED' : 'Not automatically flagged'}</p><p><strong>Manager certification:</strong> ${esc(record.cert_name)} · ${esc(record.cert_date)}</p><p><em>This record is for management use. The Store Manager recommendation is not final rehire approval.</em></p>`;
}
function emailText(record) {
  const reason = REASONS[record.separation_code];
  return `NIBBLE NATION LLC\nEMPLOYEE SEPARATION / OFFBOARDING RECORD\n\nSubmission ID: ${record.submission_id}\nSubmitted: ${record.submitted_at}\nManager: ${record.manager_name} <${record.manager_email}>\nEmployee: ${record.employee_name}\nStore: ${record.store}\nPosition: ${record.position}\nState: ${record.state}\nLast day worked: ${record.last_day_worked}\nEffective separation date: ${record.separation_date}\nSeparation: ${record.separation_code} — ${reason[0]}\nRehire recommendation: ${record.rehire_code} — ${REHIRE[record.rehire_code]}\nAuthority: SM-R — Store Manager Recommendation\nArea Supervisor final decision: PENDING\n\nManagement processing: Gusto, Altametrics, and Little Caesars Gateway action required.\n${record.state === 'Georgia' ? 'Georgia DOL-800 must be completed through the authorized company process.\n' : ''}\nThis confirmation does not indicate final rehire classification or completion of system or payroll processing.\n`;
}
async function sendEmail(to, record) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('resend_not_configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, reply_to: record.manager_email, subject: `[${record.submission_id}] EMPLOYEE SEPARATION | ${record.store.split(' — ')[0]} | ${record.employee_name} | ${record.separation_code}`, html: `<div style="font-family:Arial,sans-serif;line-height:1.5">${recordHtml(record)}</div>`, text: emailText(record) }), signal: controller.signal,
    });
    if (!response.ok) throw new Error('resend_rejected');
  } finally { clearTimeout(timer); }
}
function confirmationPage(record) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(record.submission_id)} — Submission received</title><style>body{font:16px/1.5 system-ui;margin:0;background:#f7f3eb;color:#29251f}.wrap{max-width:900px;margin:auto;padding:28px}.card{background:#fff;border:1px solid #ded7ca;border-radius:16px;padding:24px;box-shadow:0 8px 24px #29251f12}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #e8e1d6;padding:9px;vertical-align:top}th{width:32%;color:#6f685d;text-transform:capitalize}@media print{body{background:#fff}.noprint{display:none!important}.card{box-shadow:none;border:0;padding:0}}</style></head><body><main class="wrap"><div class="card">${recordHtml(record)}<p class="noprint"><button onclick="window.print()">Print management record</button> <a href="/nibblenation">Return to hub</a></p></div></main></body></html>`;
}
async function submit(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  let body;
  try { body = await readBody(req); } catch (error) { return fail(res, 413, error.message === 'body_too_large' ? 'body_too_large' : 'invalid_payload'); }
  let normalized;
  try { normalized = validate(body); } catch (error) { return fail(res, 400, error.message || 'validation_failed'); }
  const key = normalized.request_token;
  const fp = fingerprint(normalized);
  const cached = CACHE.get(key);
  if (cached) {
    if (cached.fingerprint !== fp) return fail(res, 409, 'idempotency_conflict');
    try { return json(res, 200, await cached.promise); } catch { return fail(res, 503, 'submission_failed'); }
  }
  const record = { ...normalized, submission_id: idForNow(), submitted_at: new Date().toISOString() };
  const promise = (async () => {
    await sendEmail(MANAGEMENT, record);
    await sendEmail([record.manager_email], record);
    return { ok: true, submission_id: record.submission_id, html: confirmationPage(record) };
  })();
  CACHE.set(key, { fingerprint: fp, promise });
  try {
    const result = await promise;
    console.log(JSON.stringify({ event: 'nibble_offboarding_submitted', submission_id: record.submission_id, store: record.store_code, status: 'emailed', ts: record.submitted_at }));
    return json(res, 200, result);
  } catch {
    CACHE.delete(key);
    return fail(res, 503, 'email_delivery_failed');
  }
}

const FORM = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Nibble Nation — Employee Offboarding</title><style>:root{--paper:#f7f3eb;--card:#fff;--ink:#29251f;--muted:#6f685d;--line:#ded7ca;--basil:#405a31;--tomato:#a84235}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Inter,system-ui,sans-serif}.wrap{max-width:920px;margin:auto;padding:20px 18px 70px}.mast{display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding:12px 0 18px}.mark{background:var(--basil);color:#fff;border-radius:10px;padding:9px;font-weight:800}.grow{flex:1}.btn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:11px 16px;font:inherit;font-weight:700;cursor:pointer}.primary{background:var(--basil);color:#fff;border-color:var(--basil)}.hero{padding:28px 0 18px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-size:.75rem;font-weight:800}.hero h1{font-size:clamp(2rem,6vw,3rem);line-height:1.1;margin:.35rem 0}.hero p{color:var(--muted);max-width:68ch}.warning{border-left:4px solid var(--tomato);background:#fff0ed;padding:14px 16px;border-radius:8px;margin:16px 0}.steps{display:flex;gap:5px;margin:18px 0 26px}.step{flex:1;height:8px;border-radius:8px;background:#e6dfd3}.step.active{background:var(--basil)}fieldset{border:0;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:20px;margin:0 0 18px}legend{font-size:1.25rem;font-weight:800;padding:0 5px}label{display:block;font-weight:700;margin:13px 0 5px}input,select,textarea{width:100%;border:1px solid #cfc6b8;background:#fff;border-radius:8px;padding:11px;font:inherit;color:inherit}textarea{min-height:92px;resize:vertical}.hint{color:var(--muted);font-size:.88rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.grid .full{grid-column:1/-1}.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.check{display:flex;gap:8px;align-items:flex-start;font-weight:500}.check input{width:auto;margin-top:5px}.actions{display:flex;justify-content:space-between;gap:10px;margin-top:18px}.hidden{display:none!important}.review{background:#fbf9f5;border:1px solid var(--line);padding:14px;border-radius:10px;white-space:pre-wrap}.escalate{background:#fff4d8;border:1px solid #dfbd65;padding:14px;border-radius:10px;font-weight:700}.error{color:var(--tomato);font-weight:700;margin-top:12px}@media(max-width:650px){.grid,.checks{grid-template-columns:1fr}.wrap{padding-left:13px;padding-right:13px}fieldset{padding:16px}.actions{position:sticky;bottom:0;background:var(--paper);padding:10px 0}.steps{gap:3px}}@media print{.noprint{display:none!important}}</style></head><body><main class="wrap"><header class="mast"><div class="mark">NN</div><div><strong>Nibble Nation</strong><div class="hint">Management use · Employee separation / offboarding</div></div><div class="grow"></div><a class="btn" href="/nibblenation">Back to hub</a></header><section class="hero"><div class="eyebrow">Protected staff tool</div><h1>Employee separation / offboarding</h1><p>Capture factual operational information for Gusto, Altametrics, Little Caesars Gateway, payroll, access, and rehire review. Do not enter Social Security numbers, passwords, actual alarm/safe credentials, payment-card data, or unnecessary medical details.</p><div class="warning"><strong>Store Manager recommendation only.</strong> Final rehire classification is subject to Area Supervisor / DM review. Submit facts, not legal conclusions.</div></section><div class="steps" aria-label="Form progress"><i class="step active"></i><i class="step"></i><i class="step"></i><i class="step"></i><i class="step"></i><i class="step"></i><i class="step"></i></div><form id="offboarding" novalidate><section data-step="0"><fieldset><legend>1. Manager &amp; employee</legend><div class="grid"><div><label for="manager_name">Manager full name *</label><input id="manager_name" name="manager_name" required maxlength="120" autocomplete="name"></div><div><label for="manager_email">Manager email *</label><input id="manager_email" name="manager_email" type="email" required maxlength="254" autocomplete="email"><div class="hint">Use your @nibblenation.com address where possible.</div></div><div><label for="employee_name">Employee full legal name *</label><input id="employee_name" name="employee_name" required maxlength="160"></div><div><label for="employee_id">Employee ID if known</label><input id="employee_id" name="employee_id" maxlength="80"></div><div><label for="store_code">Store *</label><select id="store_code" name="store_code" required><option value="">Select a store</option><option value="1530-0002">Store 2 — 1530-0002</option><option value="1530-0003">Store 3 — 1530-0003</option><option value="1530-0004">Store 4 — 1530-0004</option><option value="1530-0011">Store 11 — 1530-0011</option><option value="1530-0012">Store 12 — 1530-0012</option></select></div><div><label for="position">Position *</label><select id="position" name="position" required><option value="">Select</option><option>Crew</option><option>Shift Manager</option><option>Assistant Manager</option><option>Store Manager</option><option>Other</option></select></div><div><label for="state">State *</label><select id="state" name="state" required><option value="">Select</option><option>Georgia</option><option>Florida</option></select></div><div><label for="hire_date">Original hire date if known</label><input id="hire_date" name="hire_date" type="date"></div><div><label for="last_day_worked">Last day actually worked *</label><input id="last_day_worked" name="last_day_worked" type="date" required></div><div><label for="separation_date">Effective separation date *</label><input id="separation_date" name="separation_date" type="date" required></div><div><label for="separation_time">Effective separation time if relevant</label><input id="separation_time" name="separation_time" maxlength="12" placeholder="e.g. 3:00 PM"></div></div></fieldset></section><section data-step="1" hidden><fieldset><legend>2. Separation</legend><label for="separation_code">Separation reason code *</label><select id="separation_code" name="separation_code" required><option value="">Select a controlled code</option><optgroup label="Voluntary resignation"><option value="VR-GS">VR-GS — Voluntary resignation — good standing/proper notice</option><option value="VR-NN">VR-NN — Voluntary resignation — insufficient/no notice</option><option value="VR-PF">VR-PF — Personal/family circumstances</option><option value="VR-MD">VR-MD — Medical/health-related separation</option><option value="VR-ED">VR-ED — School/education</option><option value="VR-RL">VR-RL — Relocation</option><option value="VR-SC">VR-SC — Scheduling/availability conflict</option><option value="VR-TR">VR-TR — Transportation/reliability circumstances</option></optgroup><optgroup label="Involuntary / job abandonment"><option value="IT-AT">IT-AT — Attendance</option><option value="IT-PF">IT-PF — Performance</option><option value="IT-CD">IT-CD — Conduct/discipline</option><option value="JA-CF">JA-CF — Confirmed job abandonment</option></optgroup><optgroup label="Serious misconduct / directed / layoff"><option value="SM-TF">SM-TF — Substantiated theft/fraud</option><option value="SM-CM">SM-CM — Cash manipulation</option><option value="SM-FR">SM-FR — Falsification of company records</option><option value="SM-IM">SM-IM — Intentional inventory manipulation</option><option value="SM-VT">SM-VT — Workplace violence/credible threat</option><option value="SM-HD">SM-HD — Serious harassment/discrimination</option><option value="SM-FS">SM-FS — Serious food-safety violation</option><option value="SM-WS">SM-WS — Serious workplace-safety violation</option><option value="SM-SE">SM-SE — Serious security violation</option><option value="SM-PC">SM-PC — Intentional misuse of payment/customer information</option><option value="SM-DP">SM-DP — Deliberate destruction of company property</option><option value="SL-DT">SL-DT — Senior-leadership-directed termination</option><option value="LW">LW — Layoff/lack of work</option><option value="OTH">OTH — Other documented separation</option></optgroup></select><div id="policy-warning" class="warning hidden"></div><div id="conditional-fields"></div></fieldset></section><section data-step="2" hidden><fieldset><legend>3. Evidence &amp; protected-circumstance review</legend><label>Evidence available? *</label><div class="checks"><label class="check"><input type="radio" name="evidence_available" value="true" required> Yes</label><label class="check"><input type="radio" name="evidence_available" value="false"> No</label></div><label>Evidence types *</label><div class="checks">${EVIDENCE.map(item => `<label class="check"><input type="checkbox" name="evidence_types[]" value="${esc(item)}"> ${esc(item)}</label>`).join('')}</div><div class="grid"><div><label for="evidence_reference">Evidence location/reference</label><input id="evidence_reference" name="evidence_reference" maxlength="500"></div><div class="full"><label for="evidence_summary">Evidence summary</label><textarea id="evidence_summary" name="evidence_summary" maxlength="2000"></textarea></div></div><label>Potentially protected circumstance? Select all that apply *</label><div class="checks">${PROTECTED.map(item => `<label class="check"><input type="checkbox" name="protected_flags[]" value="${esc(item)}"> ${esc(item)}</label>`).join('')}</div><div class="hint">If anything other than “none known” is selected, submit factual information only and refer for management review. Do not decide whether activity is legally protected.</div></fieldset></section><section data-step="3" hidden><fieldset><legend>4. Final pay, property &amp; access</legend><div class="grid"><div><label for="final_hours_verified">Final hours verified? *</label><select id="final_hours_verified" name="final_hours_verified" required><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="pending">Pending</option></select></div><div><label for="last_payroll_date">Last payroll period/date if known</label><input id="last_payroll_date" name="last_payroll_date" type="date"></div><div><label for="time_correction">Outstanding time correction? *</label><select id="time_correction" name="time_correction" required><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div><div><label for="reimbursement">Outstanding reimbursement? *</label><select id="reimbursement" name="reimbursement" required><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div><div><label for="bonus_pending">Bonus/other pay pending? *</label><select id="bonus_pending" name="bonus_pending" required><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Unknown</option></select></div><div class="full"><label for="payroll_notes">Payroll notes</label><textarea id="payroll_notes" name="payroll_notes" maxlength="2000"></textarea></div></div><h3>Company property</h3>${PROPERTY.map(key => `<label for="property_${key}">${esc(key.replace(/_/g, ' '))} *</label><select id="property_${key}" name="property_${key}" required><option value="">Select</option><option value="returned">Returned</option><option value="outstanding">Outstanding</option><option value="not_applicable">Not applicable</option></select>`).join('')}<h3>Access held</h3><div class="checks">${ACCESS.filter(x => x !== 'none').map(item => `<label class="check"><input type="checkbox" name="access_items[]" value="${esc(item)}"> ${esc(item.replace(/_/g, ' '))}</label>`).join('')}<label class="check"><input type="checkbox" name="access_items[]" value="none"> None</label></div><div class="hint">If management or security access existed, immediate access review is required. Do not enter credentials or combinations.</div></fieldset><fieldset id="state-fields"><legend>State processing</legend><div id="ga-fields" class="hidden"><strong>Georgia DOL-800</strong><p class="hint">Georgia DOL-800 must be completed through the authorized company process. This form does not replace the state form.</p><label for="dol800_prepared">DOL-800 required/prepared? *</label><select id="dol800_prepared" name="dol800_prepared"><option value="">Select</option><option>yes</option><option>no</option><option>pending</option></select><label for="dol800_delivery">DOL-800 delivery *</label><select id="dol800_delivery" name="dol800_delivery"><option value="">Select</option><option>employee on final day</option><option>electronic</option><option>mailed</option><option>pending</option><option>other</option></select><label for="dol800_delivery_date">Delivery date</label><input id="dol800_delivery_date" name="dol800_delivery_date" type="date"><label for="dol800_notes">DOL-800 notes</label><textarea id="dol800_notes" name="dol800_notes" maxlength="1000"></textarea></div><div id="fl-fields" class="hidden"><strong>Florida processing</strong><p class="hint">Capture company processing notes only; no Georgia-style separation notice requirement is implied.</p><label for="florida_processing_notes">Processing notes</label><textarea id="florida_processing_notes" name="florida_processing_notes" maxlength="2000"></textarea></div></fieldset></section><section data-step="4" hidden><fieldset><legend>5. Rehire recommendation</legend><p class="warning"><strong>STORE MANAGER RECOMMENDATION ONLY.</strong> Final rehire classification is subject to Area Supervisor / DM review.</p><label for="rehire_code">Recommendation *</label><select id="rehire_code" name="rehire_code" required><option value="">Select</option><option value="EC">EC — Eligible for Consideration</option><option value="CR">CR — Conditional Review Required</option><option value="RI">RI — Rehire Ineligible</option><option value="PRI">PRI — Permanent Rehire Ineligible</option><option value="PR">PR — Pending Review</option></select><div class="hint">JA-CF is policy-derived RI. Serious misconduct, senior-leadership-directed, and protected-circumstance cases require PR and higher review.</div><input type="hidden" name="authority_code" value="SM-R"></fieldset></section><section data-step="5" hidden><fieldset><legend>6. Review &amp; certification</legend><div id="review" class="review">Complete the form to see the full management record here.</div><div class="checks"><label class="check"><input type="checkbox" name="cert_reviewed" value="true" required> I reviewed the information above.</label><label class="check"><input type="checkbox" name="cert_factual" value="true" required> The information is factual and accurate to the best of my knowledge.</label><label class="check"><input type="checkbox" name="cert_supporting" value="true" required> I have identified available supporting documentation.</label><label class="check"><input type="checkbox" name="cert_recommendation" value="true" required> I understand I am making a rehire recommendation, not the final determination.</label><label class="check"><input type="checkbox" name="cert_no_sensitive" value="true" required> I did not enter prohibited sensitive information.</label><label class="check"><input type="checkbox" name="cert_review" value="true" required> I understand questionable or protected-circumstance cases require management review.</label></div><div class="grid"><div><label for="cert_name">Manager name again *</label><input id="cert_name" name="cert_name" required maxlength="120"></div><div><label for="cert_date">Certification date *</label><input id="cert_date" name="cert_date" type="date" required></div></div></fieldset></section><section data-step="6" hidden><fieldset><legend>7. Submit</legend><div class="warning"><strong>Before submitting:</strong> This sends the management record to Shaun Hudley and T. Harvey and a confirmation copy to the manager email. No final rehire classification or system update is implied.</div><p id="submit-error" class="error" role="alert"></p><button id="submit" class="btn primary" type="submit">Submit separation record</button></fieldset></section><div class="actions"><button class="btn" id="back" type="button">Back</button><button class="btn primary" id="next" type="button">Next</button></div></form></main><script>(function(){var form=document.getElementById('offboarding'),sections=[].slice.call(form.querySelectorAll('[data-step]')),bar=[].slice.call(document.querySelectorAll('.step')),current=0,code=document.getElementById('separation_code'),state=document.getElementById('state'),requestToken=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now();function field(name,label,type){return '<div class="grid"><div class="full"><label>'+label+'</label><textarea name="'+name+'" maxlength="2000" required></textarea></div></div>'}function renderConditional(){var c=code.value,w=document.getElementById('conditional-fields'),p=document.getElementById('policy-warning');w.innerHTML='';p.className='warning hidden';if(c==='JA-CF'){p.textContent='CONFIRMED JOB ABANDONMENT = REHIRE INELIGIBLE UNDER THE STANDARD REHIRE PROCESS. Store Manager may not override.';p.className='warning';}if(c.indexOf('SM-')===0){p.textContent='STOP — AREA SUPERVISOR / HIGHER REVIEW REQUIRED. Store Manager may not independently finalize PRI.';p.className='warning escalate';}if(c==='SL-DT'){p.textContent='Store Manager may not override this separation.';p.className='warning';}if(c==='VR-MD'){p.textContent='Use neutral facts only. Do not enter diagnosis or detailed medical history.';p.className='warning';}var templates={"VR-GS":'<div class="grid"><div><label>Resignation notice date *</label><input type="date" name="resignation_notice_date" required></div><div><label>Notice method *</label><input name="notice_method" maxlength="120" required></div><div><label>Two-week notice submitted? *</label><select name="two_week_notice" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div><label>Notice period completed? *</label><input name="notice_completed" maxlength="80" required></div><div class="full"><label>Employee stated reason *</label><textarea name="employee_stated_reason" required></textarea></div><div class="full"><label>Final scheduled shift *</label><input name="final_scheduled_shift" maxlength="120" required></div><div class="full"><label>Manager comments</label><textarea name="manager_comments" maxlength="2000"></textarea></div></div>',"VR-NN":'<div class="grid"><div><label>Resignation notice date *</label><input type="date" name="resignation_notice_date" required></div><div><label>Notice method *</label><input name="notice_method" maxlength="120" required></div><div><label>Two-week notice submitted? *</label><select name="two_week_notice" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div><label>Notice period completed? *</label><input name="notice_completed" maxlength="80" required></div><div class="full"><label>Employee stated reason *</label><textarea name="employee_stated_reason" required></textarea></div><div class="full"><label>Final scheduled shift *</label><input name="final_scheduled_shift" maxlength="120" required></div></div>',"IT-AT":'<div class="grid"><div><label>Final attendance event date *</label><input type="date" name="attendance_event_date" required></div><div><label>Event type *</label><input name="attendance_event_type" required placeholder="absence, tardy, NCNS, etc."></div><div class="full"><label>Prior related incidents *</label><textarea name="prior_attendance_incidents" required></textarea></div><div class="full"><label>Prior coaching/warnings *</label><textarea name="prior_coaching_warnings" required></textarea></div><div class="full"><label>Dates if known *</label><textarea name="attendance_dates" required></textarea></div><div><label>Final warning issued? *</label><select name="final_warning_issued" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div><label>Employee knew expectation? *</label><input name="attendance_expectation_known" required></div><div class="full"><label>Factual narrative *</label><textarea name="attendance_narrative" required></textarea></div></div>',"IT-PF":'<div class="grid"><div class="full"><label>Performance standard not met *</label><textarea name="performance_standard" required></textarea></div><div class="full"><label>Prior coaching *</label><textarea name="performance_coaching" required></textarea></div><div class="full"><label>Written warnings *</label><textarea name="performance_warnings" required></textarea></div><div class="full"><label>Training/retraining provided *</label><textarea name="training_provided" required></textarea></div><div class="full"><label>Dates *</label><textarea name="performance_dates" required></textarea></div><div class="full"><label>Final triggering performance event *</label><textarea name="triggering_performance_event" required></textarea></div><div class="full"><label>Factual narrative *</label><textarea name="performance_narrative" required></textarea></div></div>',"IT-CD":'<div class="grid"><div class="full"><label>Conduct/policy involved *</label><textarea name="conduct_policy" required></textarea></div><div><label>Incident date *</label><input type="date" name="incident_date" required></div><div><label>Witnesses</label><input name="witnesses" maxlength="1000"></div><div class="full"><label>Employee response if available</label><textarea name="employee_response"></textarea></div><div class="full"><label>Prior related discipline *</label><textarea name="prior_discipline" required></textarea></div><div class="full"><label>Final triggering event *</label><textarea name="conduct_narrative" required></textarea></div></div>',"JA-CF":'<div class="grid"><div class="full"><label>Scheduled shifts missed *</label><textarea name="missed_shifts" required></textarea></div><div><label>Communication received? *</label><select name="communication_received" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div class="full"><label>Attempts to contact employee *</label><textarea name="contact_attempts" required></textarea></div><div class="full"><label>Contact dates *</label><textarea name="contact_dates" required></textarea></div><div class="full"><label>Contact methods *</label><textarea name="contact_methods" required placeholder="call, voicemail, text, email, other"></textarea></div><div class="full"><label>Employee response if any</label><textarea name="abandonment_response"></textarea></div><div class="full"><label>Manager narrative *</label><textarea name="abandonment_narrative" required></textarea></div></div>',"SL-DT":'<div class="grid"><div><label>Directing authority if known *</label><input name="directing_authority" required></div><div><label>Direction date *</label><input type="date" name="direction_date" required></div><div><label>Approval status *</label><select name="approval_status" required><option value="">Select</option><option>Required</option><option>Pending</option><option>Obtained</option><option>Unknown</option></select></div><div class="full"><label>Supporting notes *</label><textarea name="leadership_notes" required></textarea></div></div>',"LW":'<div class="grid"><div class="full"><label>Business reason *</label><textarea name="business_reason" required></textarea></div><div><label>Anticipated temporary/permanent *</label><input name="layoff_duration" required></div><div><label>Employee left in acceptable standing? *</label><select name="acceptable_standing" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div></div>',"OTH":'<div class="grid"><div class="full"><label>Factual written explanation *</label><textarea name="factual_reason" required></textarea></div><div><label>Area Supervisor review flag *</label><select name="area_supervisor_notified" required><option value="">Select</option><option value="true">Required / flagged</option><option value="false">Not flagged</option></select></div></div>'};if(templates[c])w.innerHTML=templates[c];else if(c.indexOf('VR-')===0)w.innerHTML='<div class="grid"><div class="full"><label>Brief factual reason *</label><textarea name="factual_reason" required></textarea></div><div><label>Communicated before leaving? *</label><select name="communicated_before" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div><label>Accommodation/scheduling discussion if applicable? *</label><select name="accommodation_discussion" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div><label>Potentially correctable? *</label><select name="potentially_correctable" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div class="full"><label>Supporting notes</label><textarea name="supporting_notes"></textarea></div></div>';else if(c.indexOf('SM-')===0)w.innerHTML='<div class="grid"><div><label>Incident date/time *</label><input name="incident_datetime" required></div><div><label>Incident evidence available? *</label><select name="evidence_available" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div><div class="full"><label>Factual incident summary *</label><textarea name="incident_summary" required></textarea></div><div class="full"><label>Witnesses if applicable</label><textarea name="serious_witnesses"></textarea></div><div class="full"><label>Law enforcement/regulatory involvement if applicable</label><textarea name="law_enforcement_involvement"></textarea></div><div class="full"><label>Employee response if available</label><textarea name="serious_employee_response"></textarea></div><div><label>Who reviewed incident? *</label><input name="incident_reviewed_by" required></div><div><label>Area Supervisor notified? *</label><select name="area_supervisor_notified" required><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></div></div>')}function updateState(){var ga=document.getElementById('ga-fields'),fl=document.getElementById('fl-fields'),isga=state.value==='Georgia';ga.classList.toggle('hidden',!isga);fl.classList.toggle('hidden',isga);[].slice.call(ga.querySelectorAll('input,select,textarea')).forEach(function(x){x.disabled=!isga});[].slice.call(fl.querySelectorAll('input,select,textarea')).forEach(function(x){x.disabled=isga})}function serialize(){var out={request_token:requestToken};new FormData(form).forEach(function(value,key){var array=key.endsWith('[]');var clean=array?key.slice(0,-2):key;if(array){(out[clean] ||= []).push(value)}else out[clean]=value});return out}function setStep(n){current=Math.max(0,Math.min(6,n));sections.forEach(function(s,i){s.hidden=i!==current});bar.forEach(function(b,i){b.classList.toggle('active',i<=current)});document.getElementById('back').disabled=current===0;document.getElementById('next').classList.toggle('hidden',current>=6);if(current===5)document.getElementById('review').textContent=JSON.stringify(serialize(),null,2);window.scrollTo(0,0)}function validStep(){var fields=[].slice.call(sections[current].querySelectorAll('input,select,textarea')).filter(function(x){return !x.disabled});for(var i=0;i<fields.length;i++)if(!fields[i].checkValidity()){fields[i].reportValidity();return false}return true}code.addEventListener('change',renderConditional);state.addEventListener('change',updateState);document.getElementById('next').addEventListener('click',function(){if(validStep())setStep(current+1)});document.getElementById('back').addEventListener('click',function(){setStep(current-1)});form.addEventListener('submit',async function(e){e.preventDefault();if(!validStep())return;var btn=document.getElementById('submit'),err=document.getElementById('submit-error');btn.disabled=true;err.textContent='';try{var response=await fetch('/nibblenation/offboarding/submit',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(serialize())});var data=await response.json();if(!response.ok||!data.ok)throw new Error('submit_failed');document.open();document.write(data.html);document.close()}catch(error){btn.disabled=false;err.textContent='Submission could not be completed. No confirmation was issued. Please retry or contact the Area Supervisor.'}});renderConditional();updateState();document.getElementById('cert_date').value=new Date().toISOString().slice(0,10);setStep(0)})()</script></body></html>`;

module.exports = { FORM, submit, STORES, REASONS, REHIRE, validate };
