#!/usr/bin/env node
// registry-check.js — the decision registry, checked in BOTH directions.
//
// WHY THIS EXISTS
// `decisions/registry.md` states that every ID cited in normative text has a
// row, and that every row is cited from somewhere, and that "both directions
// are checked at every release". That sentence was true of the intent and
// false of the mechanism: nothing performed the check. A promise of a check is
// worth less than no promise, because a reader budgets trust against it.
//
// WHAT IT CHECKS
//   1. CITED BUT NOT DEFINED — an ID in published text with no row. This is a
//      hard failure: a normative citation a reader cannot resolve is a defect
//      they can neither comply with nor detect.
//   2. DEFINED BUT NOT CITED — a row nothing points at. This is a failure too,
//      unless the row itself says why, which `decisions/README.md` permits for
//      an entry that records a decision no normative sentence needs to make.
//      Such a row must carry the marker `(uncited: <reason>)`.
//   3. The status legend must list every status the file actually uses.
//
// usage: registry-check.js [--strict] [root]
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const ROOT = args.find(a => !a.startsWith('--')) || '.';
// An ID is written BACKTICKED in prose and BARE in code comments -- the
// publish pipeline never inserts a backtick into a JavaScript file, because
// doing so can terminate a template literal. Both forms are citations, and a
// check that sees only one under-counts, which is how EDITOR-REQUIREMENT
// looked uncited while `tools/editor-check.js` cited it in its header.
const ID_RE = /`?\b([A-Z][A-Z0-9-]{3,})\b`?/g;
// Parse rows by SHAPE, then validate the status. Matching the status in the
// row pattern meant an unknown status made the row vanish from the check
// instead of failing it -- silence where a fault should have been.
const ROW_RE = /^\| `([A-Z][A-Z0-9-]*)` \| ([a-z-]+) \|/;
const STATUSES = new Set(['ruled', 'open', 'superseded', 'defect']);
// An ID-shaped token: UPPERCASE-KEBAB, at least two words. This is what lets
// the cited-but-unregistered direction actually run.
const IDLIKE = /`([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)+)`/g;

const REG = path.join(ROOT, 'decisions', 'registry.md');
if (!fs.existsSync(REG)) {
  console.error('registry-check: no decisions/registry.md under ' + path.resolve(ROOT));
  process.exit(2);
}
const regText = fs.readFileSync(REG, 'utf8');

// ── rows ─────────────────────────────────────────────────────────────────────
const rows = new Map();          // id -> { status, uncitedReason }
for (const line of regText.split('\n')) {
  const m = ROW_RE.exec(line);
  if (!m) continue;
  const why = /\(uncited: ([^)]+)\)/.exec(line);
  rows.set(m[1], { status: m[2], uncited: why ? why[1].trim() : null });
}
if (!rows.size) { console.error('registry-check: no rows parsed'); process.exit(2); }

// ── the status legend must cover what the file uses ───────────────────────────
const legend = new Set([...regText.matchAll(/^\| `(ruled|open|superseded|defect)` \| /gm)].map(m => m[1]));
const used = new Set([...rows.values()].map(r => r.status));
const missingFromLegend = [...used].filter(s => !legend.has(s)).sort();

// ── citations across every published file ────────────────────────────────────
const SKIP_DIR = new Set(['.git', 'node_modules']);
const cited = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(path.join(dir, e.name)); continue; }
    const p = path.join(dir, e.name);
    const rel = path.relative(ROOT, p);
    let t;
    try { t = fs.readFileSync(p, 'utf8'); } catch { continue; }
    // The registry's own ROWS define; they do not cite. Everything else in the
    // file (its prose) does cite.
    if (rel === path.join('decisions', 'registry.md')) {
      t = t.split('\n').filter(l => !ROW_RE.test(l)).join('\n');
    }
    for (const m of t.matchAll(ID_RE)) if (rows.has(m[1])) cited.add(m[1]);
  }
})(ROOT);

// THE DIRECTION THAT WAS DEAD CODE. It was marked "impossible by
// construction" because `cited` was filtered against `rows` as it was built --
// which made the claim true of the variable and false of the tree. Collect
// ID-SHAPED tokens instead, and report the ones with no row.
const undefinedIds = [];
(function walk2(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk2(path.join(dir, e.name)); continue; }
    const p = path.join(dir, e.name);
    const rel = path.relative(ROOT, p);
    if (!/\.(md|fd|txt|tsv|js|mjs|html)$/.test(rel)) continue;
    // decisions/README.md DEFINES the ID scheme, so it necessarily contains
    // illustrative IDs that name no decision. It is the
    // one file that describes the notation rather than using it.
    if (rel === path.join('decisions', 'README.md')) continue;
    let t; try { t = fs.readFileSync(p, 'utf8'); } catch { continue; }
    if (rel === path.join('decisions', 'registry.md'))
      t = t.split('\n').filter(l => !ROW_RE.test(l)).join('\n');
    for (const m of t.matchAll(IDLIKE))
      if (!rows.has(m[1])) undefinedIds.push(rel + ':' + m[1]);
  }
})(ROOT);
const badStatus = [...rows.entries()].filter(([, r]) => !STATUSES.has(r.status));
// defect 3: the opt-out reason was never validated -- `(uncited: banana)`
// passed. A reason must be a SENTENCE, not a token.
const badReason = [...rows.entries()]
  .filter(([, r]) => r.uncited !== null && r.uncited.split(/\s+/).length < 4);
const uncited = [...rows.keys()].filter(id => !cited.has(id)).sort();
const unexplained = uncited.filter(id => !rows.get(id).uncited);

console.log('registry-check  rows=' + rows.size + '  cited=' + cited.size +
            '  cited-unregistered=' + new Set(undefinedIds).size +
            '  uncited=' + uncited.length + ' (explained ' + (uncited.length - unexplained.length) + ')');
if (missingFromLegend.length)
  console.log('  status legend omits: ' + missingFromLegend.join(', '));
for (const id of unexplained) console.log('  UNCITED, unexplained: ' + id);

for (const id of [...new Set(undefinedIds)]) console.log('  CITED, no row: ' + id);
for (const [id, r] of badStatus) console.log('  UNKNOWN STATUS: ' + id + ' = ' + r.status);
for (const [id] of badReason) console.log('  OPT-OUT REASON TOO THIN: ' + id);
const bad = new Set(undefinedIds).size + unexplained.length + missingFromLegend.length
          + badStatus.length + badReason.length;
if (bad) {
  console.log('\nFAIL  ' + bad + ' registry problem(s).');
  console.log('      Cite the row, or mark it `(uncited: <reason>)`, or extend the legend.');
  process.exit(1);
}
console.log('OK  every citation resolves, every row is cited or explains why, legend complete');
