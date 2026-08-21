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

## Required setup (once)

Vercel → `nexuscmd-site` → Settings → Environment Variables:

    NIBBLE_PASSWORD = <the team password>

Apply to Production (and Preview if you want it there). Redeploy after adding it.
Without the variable the route returns a 500 that says so — it never opens.

## Routes

| URL | What |
|---|---|
| `/nibblenation` | Hub: simulator + manager training running order |
| `/nibblenation/interview` | The interview simulator |
| `/nibblenation/login` | Password form (POST target) |
| `/nibblenation/logout` | Clears the session |

## Editing the pages

The HTML in `api/_nn/assets.js` is generated. Regenerate it rather than hand-editing.

## Still to do

- Host the 33 training videos and wire each row to a player. 223 MB total — too big
  for the repo and for a Vercel deployment.
- The videos currently carry a "Draft, not for issue" footer on every frame.
