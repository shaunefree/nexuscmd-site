/* Series 03 — A.R.T. Roles & Responsibilities assessment.
 *
 * The answer KEY lives only in this server module, which is never served as a
 * static file. The form contains questions only; grading happens in submit()
 * and the result page reports score, pass/fail, and question numbers to
 * review — never the correct answers.
 */

const ART_FILES = ['Shift_Leader_ART_Roles_and_Responsibilities'];

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

module.exports = { ART_FILES, FORM, submit };
