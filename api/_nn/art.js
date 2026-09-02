/* Series 03 — A.R.T. Roles & Responsibilities assessment.
 *
 * The answer KEY lives only in this server module, which is never served as a
 * static file. The form contains questions only; grading happens in submit()
 * and the result page reports score, pass/fail, and question numbers to
 * review — never the correct answers.
 */

const ART_FILES = ['Shift_Leader_ART_Roles_and_Responsibilities', 'AGM_ART_Roles_and_Responsibilities', 'Store_Manager_ART_Leadership_Workshop'];

const PASS_MARK = 11; // of 13 (~85%)

const QUESTIONS = [
  { n: 1, t: 'Who does a shift leader directly report to?', o: { A: 'Crew members', B: 'Store Manager or Assistant General Manager (AGM)', C: 'General Crew Captain', D: 'Regional Director' } },
  { n: 2, t: 'According to ART principles, what three elements build crew confidence?', o: { A: 'Busy work, personal effort, and rescue tactics', B: 'Speed, accuracy, and friendliness', C: 'Accountability, responsibility, and teamwork', D: 'Logs, counts, and escalation' } },
  { n: 3, match: true, t: 'Match the role to its proper definition based on operational systems:', items: { I: 'Crew Member', II: 'Shift Leader', III: 'Assistant General Manager (AGM)', IV: 'Store Manager' }, o: { A: 'Builds managers while controlling operational systems', B: 'Executes standards in station work', C: 'Creates sustainable people and business rhythms', D: 'Directs the crew and protects shift execution' } },
  { n: 4, t: "What is the “key test” for a shift leader's success?", o: { A: 'If they can complete all the station work by themselves.', B: 'If they can finish a shift with zero waste.', C: 'If their crew can consistently produce the required results without the leader constantly having to rescue them.', D: 'If they work longer hours than the crew members.' } },
  { n: 5, t: 'What are the four core outcomes that define shift leader ownership?', o: { A: 'Cash, waste, food safety, and security', B: 'Effective crew direction, operational execution, maintaining strict controls, and ensuring a clean handoff', C: 'Growth, readiness, ownership, and wins', D: 'Preparing, directing, adjusting, and escalating' } },
  { n: 6, t: 'If a shift leader is filling out logs, performing counts, checking next shift readiness, and noting open issues, which pillar are they executing?', o: { A: 'Crew Direction', B: 'Operational Execution', C: 'Controls', D: 'Shift Handoff' } },
  { n: 7, t: "When a shift leader assigns tasks or station work to the crew, what happens to the leader's accountability?", o: { A: 'It transfers fully to the crew member performing the work.', B: 'It is shared 50/50 with the Store Manager.', C: 'It never transfers; the shift leader remains accountable for the results.', D: 'It is put on hold until the next shift handoff.' } },
  { n: 8, t: 'What is the core difference between a “rescuer” and a true leader?', o: { A: 'A rescuer teaches skills, while a leader takes work back to save time.', B: 'A rescuer repeatedly takes work back because it is faster, while a leader teaches, delegates, and inspects.', C: 'A rescuer focuses on cash controls, while a leader focuses on food safety.', D: 'There is no difference; both achieve the same operational outcome.' } },
  { n: 9, t: 'What are the four parts of a planned leadership rhythm that help avoid reacting to a constant sequence of emergencies?', o: { A: 'Identify, Cause, Action, Result', B: 'Explanation, Demonstration, Evaluation, Promotion', C: 'Preparing, Directing, Adjusting, and Handing Off', D: 'Practice, Feedback, Recognition, Follow-up' } },
  { n: 10, t: 'What is the ultimate goal of coaching and follow-through?', o: { A: 'Having a completed conversation with an employee', B: 'Changed behavior and stronger crew capability', C: 'Writing a detailed report for the AGM', D: 'Minimizing the time spent on station work' } },
  { n: 11, t: 'When facing a serious risk (such as equipment failure or a major safety concern), what format should a shift leader use to escalate the issue early?', o: { A: 'Growth, Readiness, Ownership, Wins (GROW)', B: 'Accountability, Responsibility, Teamwork (ART)', C: 'Problem, Cause, Action taken, Current result, and Required next step', D: 'Position, Communication, Pace, Behavior, and Coverage' } },
  { n: 12, t: 'The GROW process is a 4-week framework used to prove readiness for promotion. What does each week require?', o: { A: 'A signature from the Store Manager', B: 'Completed training hours only', C: 'Observable evidence of capability', D: 'Perfect service times across all shifts' } },
  { n: 13, match: true, t: 'Match the correct milestone to its designated week in the GROW framework:', items: { I: 'Week 1', II: 'Week 2', III: 'Week 3', IV: 'Week 4' }, o: { A: 'Lead a fully independent shift, solve routine problems, perform guest recovery, and use proper escalation.', B: 'Explain shift standards, demonstrate stations, perform opening/closing tasks, and know food safety.', C: 'Sustain two successful shifts through the crew and train an employee on a skill gap.', D: 'Lead a supervised day part, assign positions, coach quality/service, and provide a clean handoff.' } }
];

/* Server-only answer key. Never include in any rendered HTML. */
const KEY = {
  1: 'B', 2: 'C', 4: 'C', 5: 'B', 6: 'D', 7: 'C', 8: 'B',
  9: 'C', 10: 'B', 11: 'C', 12: 'C',
  3: { I: 'B', II: 'D', III: 'A', IV: 'C' },
  13: { I: 'B', II: 'D', III: 'A', IV: 'C' }
};

const esc = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const STYLE = `
:root{--paper:hsl(36 30% 96%);--card:hsl(36 40% 99%);--ink:hsl(24 18% 14%);--muted:hsl(24 10% 42%);
--line:hsl(30 18% 87%);--basil:hsl(96 32% 26%);--tomato:hsl(6 64% 42%);--brass:hsl(38 58% 38%)}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);
font:16px/1.55 Inter,system-ui,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:32px 20px 60px}
h1{font-family:Fraunces,Georgia,serif;font-size:1.7rem;margin:.2em 0}
.eyebrow{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--brass);font-weight:700}
.q{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin:14px 0}
.q h2{font-size:1rem;margin:0 0 10px}
label.opt{display:flex;gap:10px;align-items:flex-start;padding:7px 4px;cursor:pointer;border-radius:8px}
label.opt:hover{background:hsl(36 26% 94%)}
select{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:#fff}
.match-row{display:flex;gap:10px;align-items:center;margin:8px 0;flex-wrap:wrap}
.btn{display:inline-block;background:var(--basil);color:#fff;border:0;border-radius:11px;
padding:13px 22px;font:600 1rem Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}
.btn.secondary{background:transparent;color:var(--ink);border:1px solid var(--line)}
.field{margin:10px 0}.field input{width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px}
.banner{border-radius:12px;padding:18px 20px;margin:16px 0;font-weight:600}
.banner.pass{background:hsl(96 24% 91%);color:var(--basil)}
.banner.retry{background:hsl(6 60% 94%);color:var(--tomato)}
.small{font-size:.85rem;color:var(--muted)}
@media print{.no-print{display:none}}`;

function questionMarkup(q) {
  if (q.match) {
    const options = Object.entries(q.o).map(([k, v]) => `<div class="small" style="margin:2px 0"><b>${k})</b> ${esc(v)}</div>`).join('');
    const rows = Object.keys(q.items).map(roman => `
      <div class="match-row"><b>${roman}.</b> ${esc(q.items[roman])}
        <select name="q${q.n}_${roman}" required>
          <option value="">–</option>
          ${Object.keys(q.o).map(k => `<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>`).join('');
    return `<div class="q"><h2>${q.n}. ${esc(q.t)}</h2>${options}${rows}</div>`;
  }
  const opts = Object.entries(q.o).map(([k, v]) => `
    <label class="opt"><input type="radio" name="q${q.n}" value="${k}" required>
      <span><b>${k})</b> ${esc(v)}</span></label>`).join('');
  return `<div class="q"><h2>${q.n}. ${esc(q.t)}</h2>${opts}</div>`;
}

const FORM = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>A.R.T. Roles &amp; Responsibilities — Assessment</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>Shift Leader Assessment</h1>
  <p class="small">13 questions covering the Shift Leader A.R.T. video. Pass mark: ${PASS_MARK} of 13.
  Watch the video first, then answer without notes. Your result page is printable for the store record.</p>
  <form method="POST" action="/nibblenation/art-test/submit">
    <div class="q">
      <div class="field"><label>Your name<br><input name="name" required maxlength="80"></label></div>
      <div class="field"><label>Store<br><input name="store" required maxlength="40" placeholder="e.g. Store 3"></label></div>
    </div>
    ${QUESTIONS.map(questionMarkup).join('')}
    <button class="btn" type="submit">Submit answers</button>
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </form>
</div></body></html>`;

function parseForm(raw) {
  const out = {};
  String(raw || '').split('&').forEach(pair => {
    if (!pair) return;
    const i = pair.indexOf('=');
    const k = decodeURIComponent((i < 0 ? pair : pair.slice(0, i)).replace(/\+/g, ' '));
    const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  });
  return out;
}

function readBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') return resolve(parseForm(req.body));
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 32768) raw = raw.slice(0, 32768); });
    req.on('end', () => resolve(parseForm(raw)));
    req.on('error', () => resolve({}));
  });
}

const MANAGEMENT = ['shaun@nibblenation.com', 't.harvey@nibblenation.com'];
const MAIL_FROM = 'Nibble Nation Training <nibblenation@nexuscmd.io>';

/* Emails the result to management on every submission. Best-effort with a
   bounded timeout; the printable result page remains the record either way.
   Never includes correct answers. */
async function sendAssessmentEmail({ assessment, name, store, score, total, passed, review, written }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false };
  const lines = [
    `${assessment} submitted on nexuscmd.io/nibblenation`,
    '',
    `Name: ${name || 'Unknown'}`,
    `Store: ${store || '—'}`,
    `Score: ${score} / ${total} — ${passed ? 'PASS' : 'DID NOT PASS'}`,
    review && review.length ? `Questions to review: ${review.join(', ')}` : 'No missed questions.',
  ];
  if (written) lines.push('', 'Written scenario answer (manager review required):', written);
  const text = lines.join('\n');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: MANAGEMENT,
        subject: `[ART] ${assessment} | ${store || '—'} | ${name || 'Unknown'} | ${score}/${total} ${passed ? 'PASS' : 'RETRY'}`,
        text,
        html: text.split('\n').map(l => l ? `<p>${esc(l)}</p>` : '<br/>').join('')
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}

function emailStatusLine(sent) {
  return sent
    ? '<p class="small">Result emailed to management automatically.</p>'
    : '<p class="small"><b>Result could not be emailed</b> — print this page and hand it to your manager.</p>';
}

function grade(body) {
  let score = 0;
  const review = [];
  for (const q of QUESTIONS) {
    let correct;
    if (q.match) {
      correct = Object.keys(q.items).every(roman => String(body[`q${q.n}_${roman}`] || '').toUpperCase() === KEY[q.n][roman]);
    } else {
      correct = String(body[`q${q.n}`] || '').toUpperCase() === KEY[q.n];
    }
    if (correct) score += 1; else review.push(q.n);
  }
  return { score, review };
}

async function submit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed.');
  }
  const body = await readBody(req);
  const { score, review } = grade(body);
  const passed = score >= PASS_MARK;
  const mail = await sendAssessmentEmail({ assessment: 'Shift Leader A.R.T. Assessment', name: body.name, store: body.store, score, total: QUESTIONS.length, passed, review });
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>A.R.T. Assessment Result</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>Assessment Result</h1>
  <div class="q">
    <p><b>${esc(body.name || 'Unknown')}</b> · ${esc(body.store || '—')} · ${esc(date)}</p>
    <p style="font-size:1.6rem;margin:6px 0"><b>${score} / ${QUESTIONS.length}</b></p>
    <div class="banner ${passed ? 'pass' : 'retry'}">${passed
      ? 'PASS — meets the A.R.T. Shift Leader standard.'
      : `Not yet — pass mark is ${PASS_MARK} of ${QUESTIONS.length}. Rewatch the video and retake.`}</div>
    ${review.length ? `<p class="small">Review these questions with the video before retaking: <b>${review.join(', ')}</b>. Correct answers are not shown — that is deliberate.</p>` : '<p class="small">Perfect understanding of every section.</p>'}
    ${emailStatusLine(mail.sent)}
  </div>
  <div class="no-print">
    <button class="btn" onclick="window.print()">Print for store record</button>
    ${passed ? '' : '<a class="btn secondary" href="/nibblenation/art-test">Retake assessment</a>'}
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </div>
</div></body></html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.end(html);
}


/* ---------------- AGM assessment ---------------- */

const AGM_PASS_MARK = 8; // of 9 auto-graded (~89%); Q10 is manager-reviewed

const AGM_QUESTIONS = [
  { n: 1, t: 'What are the three core principles that guide the Assistant General Manager (AGM) role?', o: { A: 'Efficiency, Speed, and Compliance', B: 'Accountability, Responsibility, and Teamwork', C: 'Profitability, Customer Service, and Strategy', D: 'Innovation, Quality, and Delegation' } },
  { n: 2, t: "How is an AGM's success fundamentally measured?", o: { A: 'By the total number of hours they personally work each week', B: 'By whether shift leaders and crew can produce results through direction and coaching without a constant rescue', C: "By doing all the busy work to ensure the store manager doesn't have to step in", D: 'By how quickly they personally complete station tasks during high-pressure shifts' } },
  { n: 3, t: 'Which of the following is considered part of the “complete leadership cycle” for Accountability?', o: { A: 'Ignore, Repair, Report, Forget', B: 'Define, Inspect, Coach, Follow Through, and Report', C: 'Assign, Assume, Complete, Appraise', D: 'Tell, Delegate, Document, Escalate' } },
  { n: 4, t: "What are the five stages of an AGM's consistent operating rhythm?", o: { A: 'Plan, Organize, Lead, Control, Review', B: 'Hire, Train, Schedule, Supervise, Evaluate', C: 'Prepare, Direct, Verify, Adjust, and Close the Loop', D: 'Observe, Analyze, Correct, Document, Escalate' } },
  { n: 5, t: 'On the 1–4 performance rating scale for an AGM, what does a score of “3” represent?', o: { A: 'Not demonstrated', B: 'Inconsistent', C: 'Independently meets the standard', D: 'Sustains and teaches others' } },
  { n: 6, tf: true, t: 'True accountability is completely achieved simply by stating, “I told them.”' },
  { n: 7, tf: true, t: 'When an AGM repeatedly steps in to rescue shift leaders, it successfully improves the long-term leadership capability of the team.' },
  { n: 8, tf: true, t: 'Simply reporting that labor or food costs are high does not qualify as business analysis.' },
  { n: 9, tf: true, t: 'Completing a four-week training period automatically guarantees a candidate a promotion to AGM.' },
  { n: 10, written: true, t: 'Which types of issues are AGMs expected to resolve on their own, and which types must be escalated? Give two examples of each.' }
];

/* Server-only AGM answer key. Q10 is manager-reviewed; its model answer is
   deliberately not stored here so no code path can ever render it. */
const AGM_KEY = { 1: 'B', 2: 'B', 3: 'B', 4: 'C', 5: 'C', 6: 'FALSE', 7: 'FALSE', 8: 'TRUE', 9: 'FALSE' };

function agmQuestionMarkup(q) {
  if (q.written) {
    return `<div class="q"><h2>${q.n}. ${esc(q.t)}</h2>
      <p class="small">Write your answer below. This question is reviewed by your manager, not auto-graded.</p>
      <textarea name="q${q.n}" required rows="6" maxlength="2000" style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px"></textarea></div>`;
  }
  if (q.tf) {
    return `<div class="q"><h2>${q.n}. True or False: ${esc(q.t)}</h2>
      <label class="opt"><input type="radio" name="q${q.n}" value="TRUE" required><span><b>True</b></span></label>
      <label class="opt"><input type="radio" name="q${q.n}" value="FALSE" required><span><b>False</b></span></label></div>`;
  }
  return questionMarkup(q);
}

const AGM_FORM = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>A.R.T. Roles &amp; Responsibilities — AGM Assessment</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>AGM Assessment</h1>
  <p class="small">10 questions covering the AGM A.R.T. video — 9 auto-graded (pass mark: ${AGM_PASS_MARK} of 9)
  plus one written scenario your manager reviews. Watch the video first, then answer without notes.
  Your result page is printable for the store record.</p>
  <form method="POST" action="/nibblenation/art-test-agm/submit">
    <div class="q">
      <div class="field"><label>Your name<br><input name="name" required maxlength="80"></label></div>
      <div class="field"><label>Store<br><input name="store" required maxlength="40" placeholder="e.g. Store 3"></label></div>
    </div>
    ${AGM_QUESTIONS.map(agmQuestionMarkup).join('')}
    <button class="btn" type="submit">Submit answers</button>
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </form>
</div></body></html>`;

async function agmSubmit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed.');
  }
  const body = await readBody(req);
  let score = 0;
  const review = [];
  for (const q of AGM_QUESTIONS) {
    if (q.written) continue;
    if (String(body[`q${q.n}`] || '').toUpperCase() === AGM_KEY[q.n]) score += 1;
    else review.push(q.n);
  }
  const passed = score >= AGM_PASS_MARK;
  const written = String(body.q10 || '').slice(0, 2000);
  const mail = await sendAssessmentEmail({ assessment: 'AGM A.R.T. Assessment', name: body.name, store: body.store, score, total: 9, passed, review, written });
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>AGM A.R.T. Assessment Result</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>AGM Assessment Result</h1>
  <div class="q">
    <p><b>${esc(body.name || 'Unknown')}</b> · ${esc(body.store || '—')} · ${esc(date)}</p>
    <p style="font-size:1.6rem;margin:6px 0"><b>${score} / 9</b> <span class="small">auto-graded</span></p>
    <div class="banner ${passed ? 'pass' : 'retry'}">${passed
      ? 'PASS (auto-graded portion) — pending manager review of the written scenario.'
      : `Not yet — pass mark is ${AGM_PASS_MARK} of 9. Rewatch the video and retake.`}</div>
    ${review.length ? `<p class="small">Review these questions with the video before retaking: <b>${review.join(', ')}</b>. Correct answers are not shown — that is deliberate.</p>` : '<p class="small">Perfect score on the auto-graded portion.</p>'}
    ${emailStatusLine(mail.sent)}
  </div>
  <div class="q">
    <h2>Written scenario (manager review)</h2>
    <p class="small">Question 10: issues AGMs resolve vs. escalate, two examples of each.</p>
    <p style="white-space:pre-wrap">${esc(written)}</p>
    <p class="small">Manager: initial and date after review — ______________________</p>
  </div>
  <div class="no-print">
    <button class="btn" onclick="window.print()">Print for store record</button>
    ${passed ? '' : '<a class="btn secondary" href="/nibblenation/art-test-agm">Retake assessment</a>'}
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </div>
</div></body></html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.end(html);
}


/* ---------------- Store Manager assessment ---------------- */

const SM_PASS_MARK = 9; // of 10 (90%) — the senior-most standard

const SM_QUESTIONS = [
  { n: 1, t: 'What is defined as the core standard of a successful store manager?', o: { A: 'Working the most hours and filling shift coverage gaps', B: 'Managing daily shift tasks personally', C: 'Building a store that runs successfully without them', D: 'Being well-liked by all crew members to keep morale high' } },
  { n: 2, t: 'As a store manager shifts value from being a worker to a leader, their primary goal changes from saying “I can do it” to:', o: { A: '“You must do it”', B: '“My team can do it”', C: '“I will coordinate it”', D: '“Who wants to do it?”' } },
  { n: 3, t: 'In the “crutch store” scenario, a manager works 55 hours a week to fix everything, but the store falls apart when they leave. What is the sustainable solution?', o: { A: 'Reward the manager for their sacrifice and dedication', B: 'Have the manager work more night shifts until the store is in order', C: 'Hire more crew members to lessen the overall workload', D: 'Develop the Assistant General Manager (AGM) and shift leaders to handle operational deficiencies' } },
  { n: 4, t: 'When updating upper management about an operational problem, a true leader should always communicate:', o: { A: 'Just the details of the problem so others can solve it', B: 'A solution-oriented plan that includes the root cause, impact, action taken, results, and next steps', C: 'An explanation shifting the blame to the staff patterns', D: 'A request for immediate intervention' } },
  { n: 5, tf: true, t: 'Accountability means you own the final results of the store, even when you delegate tasks to others.' },
  { n: 6, tf: true, t: 'When evaluating your leadership using the self-assessment tool, you should rate your overall effort rather than the actual evidence your store produces.' },
  { n: 7, tf: true, t: 'A great worker should automatically be promoted to a leadership position based solely on their individual speed and work ethic.' },
  { n: 8, blank: true, t: "The three foundational pillars of the workshop's focus are accountability, responsibility, and _____________." },
  { n: 9, blank: true, t: 'Dependence happens when a manager fixes every problem personally; _____________ happens when you teach others, making yourself optional.' },
  { n: 10, blank: true, t: 'According to the 90-Day Leadership Challenge, days 1 to 30 focus on clarity, days 31 to 60 focus on _____________, and days 61 to 90 focus on proving results.' }
];

/* Server-only key. Blanks grade by normalized containment. */
const SM_KEY = { 1: 'C', 2: 'B', 3: 'D', 4: 'B', 5: 'TRUE', 6: 'FALSE', 7: 'FALSE', 8: 'teamwork', 9: 'development', 10: 'transfer' };

function smQuestionMarkup(q) {
  if (q.blank) {
    return `<div class="q"><h2>${q.n}. ${esc(q.t)}</h2>
      <input name="q${q.n}" required maxlength="60" placeholder="One word" style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px"></div>`;
  }
  if (q.tf) {
    return `<div class="q"><h2>${q.n}. True or False: ${esc(q.t)}</h2>
      <label class="opt"><input type="radio" name="q${q.n}" value="TRUE" required><span><b>True</b></span></label>
      <label class="opt"><input type="radio" name="q${q.n}" value="FALSE" required><span><b>False</b></span></label></div>`;
  }
  return questionMarkup(q);
}

const SM_FORM = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>A.R.T. Leadership Workshop — Store Manager Assessment</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>Store Manager Assessment</h1>
  <p class="small">10 questions covering the Store Manager A.R.T. Leadership Workshop video.
  Pass mark: ${SM_PASS_MARK} of 10 — the senior-most standard. Watch the video first, then
  answer without notes. Your result is emailed to management and the page is printable.</p>
  <form method="POST" action="/nibblenation/art-test-sm/submit">
    <div class="q">
      <div class="field"><label>Your name<br><input name="name" required maxlength="80"></label></div>
      <div class="field"><label>Store<br><input name="store" required maxlength="40" placeholder="e.g. Store 3"></label></div>
    </div>
    ${SM_QUESTIONS.map(smQuestionMarkup).join('')}
    <button class="btn" type="submit">Submit answers</button>
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </form>
</div></body></html>`;

async function smSubmit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed.');
  }
  const body = await readBody(req);
  let score = 0;
  const review = [];
  for (const q of SM_QUESTIONS) {
    const raw = String(body[`q${q.n}`] || '');
    let correct;
    if (q.blank) {
      const norm = raw.toLowerCase().replace(/[^a-z]/g, ' ').trim();
      correct = norm.split(/\s+/).includes(SM_KEY[q.n]);
    } else {
      correct = raw.toUpperCase() === SM_KEY[q.n];
    }
    if (correct) score += 1; else review.push(q.n);
  }
  const passed = score >= SM_PASS_MARK;
  const mail = await sendAssessmentEmail({ assessment: 'Store Manager A.R.T. Assessment', name: body.name, store: body.store, score, total: SM_QUESTIONS.length, passed, review });
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Store Manager A.R.T. Assessment Result</title>
<style>${STYLE}</style></head><body>
<div class="wrap">
  <p class="eyebrow">Series 03 · A.R.T. Roles &amp; Responsibilities</p>
  <h1>Store Manager Assessment Result</h1>
  <div class="q">
    <p><b>${esc(body.name || 'Unknown')}</b> · ${esc(body.store || '—')} · ${esc(date)}</p>
    <p style="font-size:1.6rem;margin:6px 0"><b>${score} / ${SM_QUESTIONS.length}</b></p>
    <div class="banner ${passed ? 'pass' : 'retry'}">${passed
      ? 'PASS — meets the A.R.T. Store Manager standard.'
      : `Not yet — pass mark is ${SM_PASS_MARK} of ${SM_QUESTIONS.length}. Rewatch the workshop and retake.`}</div>
    ${review.length ? `<p class="small">Review these questions with the video before retaking: <b>${review.join(', ')}</b>. Correct answers are not shown — that is deliberate.</p>` : '<p class="small">Perfect understanding of every section.</p>'}
    ${emailStatusLine(mail.sent)}
  </div>
  <div class="no-print">
    <button class="btn" onclick="window.print()">Print for store record</button>
    ${passed ? '' : '<a class="btn secondary" href="/nibblenation/art-test-sm">Retake assessment</a>'}
    <a class="btn secondary" href="/nibblenation">Back to team resources</a>
  </div>
</div></body></html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.end(html);
}

module.exports = { ART_FILES, FORM, submit, AGM_FORM, agmSubmit, SM_FORM, smSubmit };
