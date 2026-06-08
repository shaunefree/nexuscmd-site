# Nexus Command — Marketing Site

## What This Is
`nexuscmd-site` is the public marketing site for Nexus Command™. It is a **separate Vercel project** from `nexus-command` (the app/backend). No shared secrets, no shared config, no API logic lives here.

Live URL: https://nexuscmd.io

---

## Tech Stack
- **Pure static HTML/CSS** — no build system, no framework, no JS bundler
- **Fonts:** Google Fonts (Cormorant Garamond, Cinzel, EB Garamond)
- **Styles:** Single `styles.css` file — shared across all pages via `<link>`
- **Deployed:** Vercel (`nexuscmd-site` project) — `vercel --prod`

---

## Pages
| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage / hero |
| `about.html` | `/about` | Founder story, principles, tech |
| `pricing.html` | `/pricing` | Plans, founding member CTA |
| `thanks.html` | `/thanks` | "With Gratitude" appreciation page |
| `terms.html` | `/terms` | Terms of Service |
| `privacy.html` | `/privacy` | Privacy Policy |
| `subscribe-success.html` | `/subscribe-success` | Post-checkout confirmation |

---

## Nav Structure
**Desktop nav** (all pages): Logo · About · Pricing · Launch App (btn)
- "With Gratitude" is NOT in the desktop nav — footer only
- Terms and Privacy are NOT in the desktop nav — footer only

**Mobile nav** (hamburger, all pages): About · Pricing only
- No Launch App, no With Gratitude in the mobile dropdown

**Hamburger implementation:** Button with id `nav-hamburger`, menu div with id `nav-mobile`. JS toggle at bottom of each `<body>` (inline, no external file):
```js
(function(){var b=document.getElementById("nav-hamburger"),m=document.getElementById("nav-mobile");if(b&&m){b.addEventListener("click",function(){b.classList.toggle("active");m.classList.toggle("open");});m.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){b.classList.remove("active");m.classList.remove("open");});});}})()
```

---

## Footer Structure

**Simple pages** (index, about, pricing, thanks) — single-row footer:
```
About · Pricing · With Gratitude · Terms · Privacy · Launch App · Contact
```

**Legal pages** (terms, privacy) — two-column footer:
- Platform column: About, Pricing, With Gratitude, Launch App
- Legal column: Terms of Service, Privacy Policy, Contact

---

## Product Details (for copy accuracy)
- **5 modules:** Conflict Translator, Accountability Assassin, Beyond the Mirror, Daily Debrief, Strategy Mode
- **Pricing:** $79.99/month standard; Founding Members rate locked (first 20 subscribers)
- **Trial:** 14-day free, no charge until day 15
- **Founder background:** 28+ years restaurant ops — crew to Operations Trainer — at Little Caesars, KFC, Pizza Hut, Krystal, Maryland Fried Chicken, Nibble Nation. ServSafe certified instructor and proctor.
- **Company:** Hudley Entertainment, Albany, Georgia
- **App URL:** https://app.nexuscmd.io
- **Contact:** hello@nexuscmd.io

---

## Editing Guidelines
- Always edit HTML with Python string replace or the Edit tool — never `sed` (special characters like `&&` corrupt JS)
- Do not add dependencies, build steps, or frameworks — this is intentionally plain HTML
- `styles.css` is the single source of truth for all styles — add new styles there, not in `<style>` tags on individual pages (exception: legal pages have page-specific styles in `<style>` tags, which is acceptable)
- Keep footer links consistent across all pages — if you add a link to one footer, add it to all

---

## Deployment
- `vercel --prod` from this directory (targets `nexuscmd-site` project — NOT nexus-command)
- No build step needed — Vercel serves static files directly
- `sitemap.xml` and `robots.txt` are maintained manually — update sitemap when adding pages
