// Structural check on every HTML page the staff area serves.
//
// Exists because the Avoidable Moments course shipped with two stacked document
// preambles (2026-09-11). The pages in api/_nn are generated from artifact
// sources outside this repo, and the Artifact platform wraps published content
// in its own <!doctype html><html><head>… skeleton — so an export that captures
// the wrapper as well as the authored document produces a page with two
// doctypes, two <html> and two <head>, and no </head> or <body> at all.
// Browsers recover silently, so nothing looks broken and the hub smoke check
// still passes. Only a structural assertion catches it.
//
// The generator is not in this repo. This test is what keeps a future
// regeneration from reintroducing the same defect unnoticed.
//
// Usage:  node --test tests/
//         node tests/html-structure.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const NN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'api', '_nn');

// A document embedded in a JS string — the printable report the interview and
// certification simulators build at runtime — is legitimate and must not count
// against the page that contains it.
const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

const TAGS = [
  ['<!doctype html>', /<!doctype html>/gi],
  ['<html>', /<html[\s>]/gi],
  ['<head>', /<head[\s>]/gi],
  ['</head>', /<\/head>/gi],
  ['<body>', /<body[\s>]/gi],
  ['</body>', /<\/body>/gi],
  ['</html>', /<\/html>/gi]
];

// Every string export that is itself a served page: a full document from its
// first character.
const pages = [];
for (const file of readdirSync(NN_DIR).filter((f) => f.endsWith('.js'))) {
  const mod = await import(join(NN_DIR, file));
  const exported = mod.default ?? mod;
  for (const [key, value] of Object.entries(exported)) {
    if (typeof value === 'string' && /^\s*<!doctype html>/i.test(value)) {
      pages.push([`${file}:${key}`, value]);
    }
  }
}

test('every served page is one well-formed document', async (t) => {
  assert.ok(pages.length > 0, 'no HTML pages found in api/_nn — did the module shape change?');

  for (const [name, html] of pages) {
    await t.test(name, () => {
      const markup = withoutScripts(html);

      for (const [label, re] of TAGS) {
        const n = (markup.match(re) || []).length;
        assert.equal(n, 1, `${name}: expected exactly one ${label}, found ${n}`);
      }

      // Order matters as much as count: a stacked wrapper can produce one of
      // each and still nest them wrongly.
      const at = (re) => markup.search(re);
      const order = TAGS.map(([label, re]) => [label, at(new RegExp(re.source, 'i'))]);
      for (let i = 1; i < order.length; i++) {
        assert.ok(
          order[i][1] > order[i - 1][1],
          `${name}: ${order[i][0]} must come after ${order[i - 1][0]}`
        );
      }
    });
  }
});
