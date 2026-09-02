# /nibblenation — staff area

Not part of the marketing site's page set. Deliberately outside the plain-HTML rule
in CLAUDE.md, because a password that lives in the browser is not a password.

## How it works

- `vercel.json` rewrites `/nibblenation` and `/nibblenation/*` to `api/nn.js`.
- `api/nn.js` checks a signed, HttpOnly session cookie and serves the pages.
- `api/_nn/assets.js` holds the hub, login and simulator HTML. It lives **inside**
  `api/`, so Vercel never serves it as a static file. Nothing protected exists in
  the public tree — if the rewrite breaks, the route 404s instead of leaking.
- The session cookie is HMAC-signed with the password itself, so changing the
  password signs everyone out.
- The 33 training videos are **not** in the repo. They live in Supabase Storage
  (bucket `nn-training`, folder `NNYT/`). `/nibblenation/v/<name>` checks the name
  against `api/_nn/files.js`, asks Storage for a signed link, and 302s to it.
  Links expire after 2 hours, so a forwarded URL stops working the same session.
  Only the 33 names in `files.js` will ever be signed.
  Series 03 A.R.T. role videos live in the same bucket under `ART/` and are
  whitelisted in `api/_nn/art.js` (`ART_FILES`). Project + bucket file-size
  limits were raised to 150MB on 2026-09-02 for the 64MB Shift Leader video.

## Required setup (once)

Vercel → `nexuscmd-site` → Settings → Environment Variables:

    NIBBLE_PASSWORD = <the team password>
    NN_STORAGE_KEY  = <Supabase service key for the nn-training bucket>
    RESEND_API_KEY  = <managed Resend API key>

Apply to Production (and Preview if you want it there). Redeploy after adding them.
Without `NIBBLE_PASSWORD` the route returns a 500 that says so — it never opens.
Without `NN_STORAGE_KEY` the pages load but every video returns a 502.
Without `RESEND_API_KEY`, offboarding submissions fail safely without showing a
false confirmation.

## Routes

| URL | What |
|---|---|
| `/nibblenation` | Hub: simulator + manager training running order |
| `/nibblenation/interview` | The interview simulator |
| `/nibblenation/inventory` | Inventory Conversion Calculator (counts/weights → Altametrics decimals) |
| `/nibblenation/certification` | NNLC Shift Manager Certification Simulator (full-shift, offline scoring; AGM/Store Manager locked until built) |
| `/nibblenation/art-test` | Series 03 A.R.T. Shift Leader assessment (13 questions; graded server-side in `api/_nn/art.js` — the answer key never reaches the browser; pass mark 11/13; printable result) |
| `/nibblenation/art-test/submit` | Server-side grading endpoint |
| `/nibblenation/art-test-agm` | Series 03 AGM assessment (9 auto-graded, pass 8/9, + written scenario for manager review; key server-side only) |
| `/nibblenation/art-test-agm/submit` | Server-side AGM grading endpoint |
| `/nibblenation/offboarding` | Protected Employee Separation / Offboarding Form |
| `/nibblenation/offboarding/submit` | Protected server-side offboarding submission |
| `/nibblenation/login` | Password form (POST target) |
| `/nibblenation/logout` | Clears the session |

## Editing the pages

The HTML in `api/_nn/assets.js` is generated. Regenerate it rather than hand-editing.

## Employee offboarding

The offboarding form is served from the protected `api/_nn/offboarding.js` module;
it is not placed in the public static tree. It creates a print-friendly management
record and sends the server-generated record from `nibblenation@nexuscmd.io` to
`shaun@nibblenation.com` and `t.harvey@nibblenation.com`, with a confirmation copy
to the submitting manager. The sender and recipients are fixed server-side.

The Store Manager's rehire value is a recommendation (`SM-R`), not Area Supervisor
approval. The form must not contain Social Security numbers, credentials, payment
card data, or unnecessary medical details. Its structured output supports follow-up
in Gusto, Altametrics, and Little Caesars Gateway; those systems are not changed by
this form. V1 uses email and the immediate print view rather than a new database or
public file storage.

## Inventory calculator

Served from the generated `api/_nn/inventory.js` (single self-contained page,
inline CSS/JS/catalog). Source of truth for the calculator lives at
`~/Downloads/NN_Documents_and_Tools/3 Inventory Calculator/inventory-calculator/`
— edit `inventory-data.js` there, run its tests, and regenerate rather than
hand-editing the module. Owner-confirmed package bases applied 2026-08-31
(Mtn Dew 12/case, thin crust 20/bag, sauces counted by container). Five fields
still show `CONVERSION BASIS REQUIRED` — see that folder's README.

## Still to do

- ~~Video re-render~~ **DONE (owner-confirmed live 2026-08-31):** modules re-rendered
  against Field Guide v3.4, master file live. See `NNLA/NNYT/RUNNING_ORDER.md`.
- Calculator: mozzarella 4/4# CASE/BAG and chicken wings ORDER(8) conversions are
  derivable from their labels, pending owner sign-off; owner plans to weigh the
  by-container sauce items later for real oz bases.

## Running order

The hub plays the 33 modules in teaching order, which is **not** filename order —
`29_form_categories` and `30_if_then` come 9th and 10th, and `31_manager_script`
is last. The source of truth is `NNLA/NNYT/RUNNING_ORDER.md`; the hub, `files.js`
and that document were verified identical (order, numbering, titles, durations and
all six `ESCALATE ALWAYS` chips) on 2026-08-24. Re-check after any re-render.
