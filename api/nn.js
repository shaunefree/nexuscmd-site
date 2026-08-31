/* /nibblenation — staff area for Nibble Nation, LLC.
 *
 * Everything protected is served from this function. None of it exists in the
 * static tree, so a misconfigured route fails closed (404) rather than leaking
 * the content. Set NIBBLE_PASSWORD in the Vercel project's environment
 * variables; it is also the HMAC key for the session cookie, so changing the
 * password immediately invalidates every signed-in session.
 */
const crypto = require('crypto');
const ASSETS = require('./_nn/assets.js');
const FILES = require('./_nn/files.js');   // the 33 permitted video names
const OFFBOARDING = require('./_nn/offboarding.js');
const INVENTORY = require('./_nn/inventory.js');
const LINKS = require('./_nn/links.js');
const SIMULATOR = require('./_nn/simulator.js');

const STORAGE = 'https://tgxjsdlfvstdmfpkjurg.supabase.co/storage/v1';
const BUCKET = 'nn-training';
const PREFIX = 'NNYT/';                    // folder name the upload created
const LINK_TTL = 2 * 60 * 60;              // signed video links live 2 hours

const COOKIE = 'nn_session';
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const PATH = '/nibblenation';
const OFFBOARDING_CARD = '<div class="feature offboarding-card"><h2>Employee Offboarding</h2>' +
  '<p>Document a resignation or termination and submit the management separation record.</p>' +
  '<a class="btn" href="/nibblenation/offboarding">Open offboarding form</a></div>';
const INVENTORY_CARD = '<div class="feature inventory-card"><h2>Inventory Calculator</h2>' +
  '<p>Convert what you count or weigh into the exact decimals to enter in Altametrics. Works on any phone.</p>' +
  '<a class="btn" href="/nibblenation/inventory">Open inventory calculator</a></div>';

function sha(s) { return crypto.createHash('sha256').update(String(s), 'utf8').digest(); }
function equal(a, b) { return crypto.timingSafeEqual(sha(a), sha(b)); }
function sign(v, key) { return crypto.createHmac('sha256', key).update(v).digest('base64url'); }

function issue(key) {
  const exp = String(Date.now() + TTL_MS);
  return exp + '.' + sign(exp, key);
}
function verify(token, key) {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  if (!/^\d{10,16}$/.test(exp)) return false;
  if (!equal(token.slice(dot + 1), sign(exp, key))) return false;
  return Number(exp) > Date.now();
}
function cookieValue(header, name) {
  if (!header) return null;
  const parts = String(header).split(';');
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    if (p.slice(0, name.length + 1) === name + '=') return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}
function readBody(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') return resolve(parseForm(req.body));
    let raw = '';
    req.on('data', function (c) { raw += c; if (raw.length > 8192) raw = raw.slice(0, 8192); });
    req.on('end', function () { resolve(parseForm(raw)); });
    req.on('error', function () { resolve({}); });
  });
}
function parseForm(raw) {
  const out = {};
  String(raw || '').split('&').forEach(function (pair) {
    if (!pair) return;
    const i = pair.indexOf('=');
    const k = decodeURIComponent((i < 0 ? pair : pair.slice(0, i)).replace(/\+/g, ' '));
    const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  });
  return out;
}
function send(res, status, body, extra) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (extra) Object.keys(extra).forEach(function (k) { res.setHeader(k, extra[k]); });
  res.end(body);
}
function setCookie(token) {
  return COOKIE + '=' + token + '; Path=' + PATH + '; HttpOnly; Secure; SameSite=Lax; Max-Age=' +
    Math.floor(TTL_MS / 1000);
}
const CLEAR = COOKIE + '=; Path=' + PATH + '; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

function hubWithOffboarding() {
  const marker = '<div class="sec">';
  if (ASSETS.hub.indexOf(marker) < 0) return ASSETS.hub;
  return ASSETS.hub.replace(marker, LINKS.CARD + '\n\n  ' + INVENTORY_CARD + '\n\n  ' + OFFBOARDING_CARD + '\n\n  ' + marker);
}

module.exports = async function handler(req, res) {
  const key = process.env.NIBBLE_PASSWORD;
  if (!key) {
    return send(res, 500,
      '<!doctype html><meta charset="utf-8"><title>Not configured</title>' +
      '<p style="font:16px system-ui;padding:40px">This area is not configured yet. ' +
      'Set <code>NIBBLE_PASSWORD</code> in the Vercel project environment variables and redeploy.</p>');
  }

  let p = req.query && req.query.p;
  if (Array.isArray(p)) p = p[0];
  p = String(p == null ? '' : p).replace(/^\/+|\/+$/g, '');

  const signedIn = verify(cookieValue(req.headers.cookie, COOKIE), key);

  if (p === 'logout') {
    return send(res, 200, ASSETS.login, { 'Set-Cookie': CLEAR });
  }

  if (p === 'login') {
    if (req.method !== 'POST') {
      if (signedIn) { res.statusCode = 303; res.setHeader('Location', PATH); return res.end(); }
      return send(res, 200, ASSETS.login);
    }
    const body = await readBody(req);
    if (typeof body.password === 'string' && body.password.length && equal(body.password, key)) {
      res.statusCode = 303;
      res.setHeader('Location', PATH);
      res.setHeader('Set-Cookie', setCookie(issue(key)));
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      return res.end();
    }
    await new Promise(function (r) { setTimeout(r, 700); }); // blunt the guessing rate
    return send(res, 401, ASSETS.loginBad);
  }

  if (!signedIn) return send(res, 401, ASSETS.login);

  if (p === '') return send(res, 200, hubWithOffboarding());
  if (p === 'offboarding') {
    if (req.method !== 'GET') return send(res, 405, 'Method not allowed.');
    return send(res, 200, OFFBOARDING.FORM);
  }
  if (p === 'offboarding/submit') return OFFBOARDING.submit(req, res);
  if (p === 'interview') return send(res, 200, ASSETS.interview);
  if (p === 'inventory') return send(res, 200, INVENTORY.PAGE);
  if (p === 'certification') return send(res, 200, SIMULATOR.PAGE);

  /* Video. The page never contains a storage URL. Each play mints a short-lived
     signed link, so a forwarded link stops working within the hour. Only the 33
     known filenames are accepted, so this cannot be pointed at anything else. */
  if (p.slice(0, 2) === 'v/') {
    const name = p.slice(2);
    if (FILES.indexOf(name) < 0) return send(res, 404, 'Unknown module.');
    const key = process.env.NN_STORAGE_KEY;
    if (!key) return send(res, 503, 'Video storage is not configured yet.');
    try {
      const r = await fetch(STORAGE + '/object/sign/' + BUCKET + '/' + PREFIX + encodeURIComponent(name) + '.mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key },
        body: JSON.stringify({ expiresIn: LINK_TTL })
      });
      if (!r.ok) return send(res, 502, 'Could not reach video storage (' + r.status + ').');
      const data = await r.json();
      if (!data || !data.signedURL) return send(res, 502, 'Storage returned no link.');
      res.statusCode = 302;
      res.setHeader('Location', STORAGE + data.signedURL);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      return res.end();
    } catch (e) {
      return send(res, 502, 'Video storage error.');
    }
  }

  return send(res, 404,
    '<!doctype html><meta charset="utf-8"><title>Not found</title>' +
    '<p style="font:16px system-ui;padding:40px">Nothing here. ' +
    '<a href="' + PATH + '">Back to team resources</a>.</p>');
};
