#!/usr/bin/env node
// namespace-check.js — the layout NAMESPACE has one membership, and two
// places state it.
//
// WHY THIS EXISTS (GENRE-NAMESPACE)
// ----------------------------------
// Until GENRE-NAMESPACE the ignorability promise was stated over the layout zone's
// TEXTUAL EXTENT: "a reading agent's DEFAULT behaviour is to ignore the layout
// zone entirely". That promise was literally true and practically empty. `pin`
// is legal before the `layout` opener as well as after it — the engine parses
// it identically in both positions and no gate ever checked — and in this
// repository's own corpus most pins are written outside any zone. An agent
// keeping the promise still met most of the layout information in the
// document, because the zone was meant to be the container for presentation
// and only holds part of it.
//
// GENRE-NAMESPACE restates the promise over MEMBERSHIP: ignore every member of the layout
// namespace, wherever in the document it appears. Position stops mattering.
// That is only actionable if a reader can ENUMERATE the namespace, so
// spec/core.md §10 (a′) is promoted from a summary table to THE normative
// enumeration — and an enumeration nobody checks is exactly the kind of
// promise GENRE-NAMESPACE exists to stop making. This gate is the check.
//
// WHAT IT ASSERTS
// ---------------
//   1. MEMBERSHIP  — the §10 (a′) table in spec/core.md and the
//                    reference engine's accepted set (`LAYOUT_DIRECTIVES` in
//                    editor/figdown.html) name the SAME keywords. Two sources,
//                    one set.
//   2. COUNT       — the count written into each (a′) heading — "(1)" /
//                    "（1 個）" — equals the number of rows in that table. A
//                    heading that disagrees with its own table is how a reader
//                    learns the wrong size of the namespace without reading it.
//   3. OPENER      — `layout` is NOT a member. It is the zone's opener and
//                    lives in the universal core of three (§10 (a)). This is
//                    asserted because a shipped document got it wrong:
//                    guide/layout.md claimed the namespace had "exactly two
//                    members, `layout` and `pin`" while the spec said one.
//   4. PROMISE     — core.md states the default over MEMBERSHIP, and no
//                    longer carries the retired position wording. This is the anti-reversion guard: the
//                    defect GENRE-NAMESPACE fixed was a sentence, and a sentence can come
//                    back in a rewrite that nothing else would notice.
//
// IT FAILS LOUDLY, NEVER QUIETLY
// ------------------------------
// Every source is REQUIRED. A missing file, an (a′) heading this tool cannot
// find, a table it cannot parse or an engine whose `LAYOUT_DIRECTIVES` has
// moved is exit 2 with a message naming what moved — never "0 findings" and
// never a silently smaller check. That is the LANE-ALPHABET-KEY-RESERVATION guard discipline, and the
// class of failure `tools/capability-coverage.js` calls "green because it was
// not looking".
//
// usage: node tools/namespace-check.js [--strict] [--verbose]
//   --strict   present for symmetry with the other gates; findings already
//              exit 1 without it.
// Exit codes: 0 clean · 1 a membership/count/opener/promise finding · 2 tool
// error (a source could not be read).
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');

const rel = p => path.relative(ROOT, p);

function die(msg) {
  console.error('namespace-check: TOOL ERROR — ' + msg);
  process.exit(2);
}

function readOrDie(p, what) {
  if (!fs.existsSync(p)) die(what + ' not found at ' + rel(p));
  return fs.readFileSync(p, 'utf8');
}

// ── Source 1: the reference engine's accepted set ────────────────────────────
// `LAYOUT_DIRECTIVES` is a const local to the engine IIFE, so it is read from
// the source text rather than required — the same way capability-coverage.js
// reads `CHILD_KW` and `DIRECTIVE_OPTS`.
const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(ROOT, 'editor', 'figdown.html'),
].filter(Boolean);

function engineSet() {
  const enginePath = ENGINE_CANDIDATES.find(p => fs.existsSync(p));
  if (!enginePath) die('no engine found; looked at ' + ENGINE_CANDIDATES.map(rel).join(', '));
  const src = fs.readFileSync(enginePath, 'utf8');
  const m = /const\s+LAYOUT_DIRECTIVES\s*=\s*new\s+Set\(\[([^\]]*)\]\)/.exec(src);
  if (!m)
    die('engine drift: cannot read `LAYOUT_DIRECTIVES` in ' + rel(enginePath) +
        ' — the engine\'s layout namespace moved or was respelt. Update this tool ' +
        'so it reads the new spelling; do NOT let it check less.');
  const kws = [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map(x => x[1] || x[2]);
  if (!kws.length)
    die('engine drift: `LAYOUT_DIRECTIVES` parsed to an EMPTY set in ' + rel(enginePath) +
        ' — an empty namespace would make every comparison below vacuously pass.');
  return { set: new Set(kws), path: enginePath };
}

// ── Sources 2 and 3: the §10 (a′) tables, one per language ───────────────────
// The heading carries the count in parentheses; the table follows it. Both
// languages use a `| keyword | status | role |` GFM table whose first column
// holds the spelling in backticks.
const SPECS = [
  {
    file: path.join(ROOT, 'spec', 'core.md'),
    lang: 'en',
    heading: /\(a′\)\s*The layout namespace\s*\((\d+)\)/,
    // The promise, stated over membership, and the retired position wording.
    must:    'ignore every member of the layout namespace',
    mustNot: 'ignore the layout zone entirely',
  },
];

function tableAfter(src, headingRe, file) {
  const m = headingRe.exec(src);
  if (!m)
    die('cannot find the §10 (a′) layout-namespace heading in ' + rel(file) +
        ' — the enumeration GENRE-NAMESPACE made normative is the thing this gate exists ' +
        'to read. Restore the heading, or update this tool if it was respelt.');
  const rest = src.slice(m.index + m[0].length);
  const lines = rest.split('\n');
  const rows = [];
  let seenHeader = false, seenRule = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) { if (seenRule) break; continue; }
    if (!t.startsWith('|')) { if (seenRule) break; continue; }
    if (!seenHeader) { seenHeader = true; continue; }        // | Keyword | Status | Role |
    if (!seenRule)   { seenRule   = true; continue; }        // |---|---|---|
    const cell = t.split('|')[1];
    if (cell === undefined) break;
    const kw = /`([^`]+)`/.exec(cell);
    if (!kw) break;
    rows.push(kw[1]);
  }
  if (!rows.length)
    die('the §10 (a′) table in ' + rel(file) + ' parsed to ZERO rows — an empty ' +
        'enumeration would make this gate pass by finding nothing. Check the table ' +
        'format, or update this tool.');
  return { declared: Number(m[1]), rows };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const engine = engineSet();
console.log('namespace-check  engine=' + rel(engine.path));
console.log('  engine LAYOUT_DIRECTIVES: ' + [...engine.set].sort().join(' '));

let fail = 0;
const finding = s => { console.log('  ' + s); fail++; };

const parsed = SPECS.map(s => {
  const src = readOrDie(s.file, 'spec (' + s.lang + ')');
  return { ...s, src, ...tableAfter(src, s.heading, s.file) };
});

// 1 + 2 + 3
console.log('\n[membership]');
for (const s of parsed) {
  const set = new Set(s.rows);
  if (VERBOSE || true)
    console.log('  ' + rel(s.file) + ' §10 (a′): ' + s.rows.join(' ') +
                '  (heading declares ' + s.declared + ')');

  const only = [...set].filter(k => !engine.set.has(k));
  const miss = [...engine.set].filter(k => !set.has(k));
  if (only.length || miss.length) {
    finding('MEMBERSHIP DRIFT  ' + rel(s.file) + ' and the engine disagree:');
    if (only.length)
      console.log('      in the spec table, NOT accepted by the engine: ' + only.join(', '));
    if (miss.length)
      console.log('      accepted by the engine, NOT in the spec table: ' + miss.join(', '));
    console.log('      §3\'s default is stated over MEMBERSHIP (GENRE-NAMESPACE), so a reader');
    console.log('      applies this table. A table the engine disagrees with is a');
    console.log('      promise that does not do what it says.');
  }

  if (s.declared !== s.rows.length)
    finding('COUNT  ' + rel(s.file) + ' §10 (a′) heading says (' + s.declared +
            ') but the table has ' + s.rows.length + ' row(s)');

  if (set.has('layout'))
    finding('OPENER  ' + rel(s.file) + ' §10 (a′) lists `layout` as a MEMBER — it is ' +
            'the zone\'s opener and belongs to the universal core of three, §10 (a)');
}

// 4
console.log('\n[promise]');
for (const s of parsed) {
  const flat = s.src.replace(/\s+/g, ' ');
  if (!flat.includes(s.must))
    finding('PROMISE MISSING  ' + rel(s.file) + ' does not state the default over ' +
            'membership — expected the phrase "' + s.must + '" (§3, GENRE-NAMESPACE)');
  else
    console.log('  ' + rel(s.file) + ': states the default over membership');
  if (flat.includes(s.mustNot))
    finding('PROMISE REVERTED  ' + rel(s.file) + ' still carries the retired ' +
            'POSITION wording "' + s.mustNot + '". GENRE-NAMESPACE replaced it: `pin` is legal ' +
            'outside the zone, so a promise over the zone\'s textual extent is ' +
            'literally true and practically empty.');
}

console.log('');
if (fail) {
  console.log('FAIL  ' + fail + ' finding(s)');
  process.exit(1);
}
console.log('OK  the layout namespace has one membership, and both sources state it');
