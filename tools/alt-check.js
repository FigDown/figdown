#!/usr/bin/env node
// alt-check.js — gate:alt. Every Markdown embed of a FigDown artifact must
// carry an alt that says what the figure is.
//
// WHY THIS EXISTS (ACCESSIBLE-TEXT-EMISSION, the a11y-profile ruling, ADV-11 §3.7 assertion E)
// --------------------------------------------------------------------------
// Core §7 makes the plain image reference the normative embed for a FigDown
// artifact, and HTML-AAM §3.5.56–§3.5.57 map that `<img>` to the `img`/`image`
// role with an empty `alt` mapping to `none`/`presentation` — so for a reader
// who cannot see the drawing, the alt text is the WHOLE of what the embed
// says. `decisions/registry.md` filed this as
// assertion E and named it the one piece of the profile that ships with no
// engine change at all, because it is checkable today against the corpus as
// it already stands: **106 embeds, 0 empty**, measured 2026-08-22
// (`decisions/registry.md`). The ruling (ACCESSIBLE-TEXT-EMISSION) adopted
// the host-profile §1.2 alt sentence (author MUST write an alt that says what
// the figure is, MUST NOT be synthesized/rewritten/substituted with the file
// name by a host, empty only where the same content is stated in adjacent
// prose) and directed assertion E to land immediately as a gate, ahead of the
// rest of the accessibility profile's verifier work.
//
// WHAT IT ASSERTS
// ----------------
// Every Markdown image reference `![alt](path.svg)` in the tree, where the
// path resolves to an `.svg`, has a non-empty `alt` after trimming
// whitespace. This is the total, cheap half of assertion E — that the field
// exists and says something — never a judgement of whether the alt text is
// GOOD, whether it matches the figure's `title`, or whether an empty alt's
// adjacent-prose exception (host-profile §1.2) genuinely holds. Those are
// human judgements outside what a regex can settle; see WHAT THIS TOOL DOES
// NOT COVER below.
//
// SCOPE
// -----
// Every `*.md` file in the repository, walked recursively from the root —
// the same tree the corpus measurement in the a11y proposal covered (it did
// not exclude archive/ or read/, and neither does this: both currently
// contribute zero embeds, but a gate that scopes itself away from part of the
// tree is a gate that can go quietly stale there). `.git`, `node_modules` and
// `dist` are skipped: the first two hold no authored Markdown, and `dist` is
// build output, not documentation.
//
// WHAT THIS TOOL DOES NOT COVER — stated plainly, not minimised:
//   - It does not check that a non-empty alt is a GOOD one, or that it
//     matches the figure's `title` (host-profile §1.2's SHOULD).
//   - It does not adjudicate the decorative-alt exception (empty permitted
//     only where the same figure's full content is stated in adjacent
//     prose): that is a reading judgement, not a syntactic one, and the
//     corpus currently has zero cases claiming it.
//   - It does not check reference-style Markdown images (`![alt][ref]`) or
//     raw HTML `<img>` tags: neither form appears anywhere in this repo's
//     `.md` corpus today (checked by hand at authoring time), and adding
//     support for a form the corpus does not use would be an unexercised
//     branch — the same failure this project's other gates decline.
//
// Usage:
//   node tools/alt-check.js [--strict] [--verbose] [<file.md | dir> ...]
//   --strict   present for symmetry with the other gates; a finding already
//              exits 1 without it (assertion E is FATAL, not a lint opinion).
//   --verbose  print every embed found, not only the failing ones.
// Exit codes: 0 clean · 1 an embed has an empty/missing alt ·
//             2 tool error (a root could not be read, or the harvest was
//             empty — a gate that finds nothing has not passed, it has
//             failed to run).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const VERBOSE = args.includes('--verbose');
const roots = args.filter(a => !a.startsWith('-'));

const rel = p => path.relative(ROOT, path.resolve(p)) || '.';

function die(msg) {
  console.error('alt-check: TOOL ERROR — ' + msg);
  process.exit(2);
}

const SKIP_DIR = new Set(['.git', 'node_modules', 'dist']);

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { die('cannot read directory ' + rel(dir) + ': ' + e.message); }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p, out); continue; }
    if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(p);
  }
}

function mdFiles() {
  const out = [];
  const bases = roots.length ? roots : [ROOT];
  for (const b of bases) {
    const abs = path.resolve(b);
    if (!fs.existsSync(abs)) die('path not found: ' + b);
    const st = fs.statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (st.isFile() && abs.toLowerCase().endsWith('.md')) out.push(abs);
  }
  return out.sort();
}

// `![alt](path.svg)` or `![alt](path.svg "title")` — the one embed form this
// repo's Markdown corpus uses (see WHAT THIS TOOL DOES NOT COVER). The alt
// group allows escaped brackets (`\]`) since CommonMark link text does.
const IMG_RE = /!\[((?:\\.|[^\]\\])*)\]\(\s*(\S+?\.svg)(?:\s+"[^"]*")?\s*\)/gi;

function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    let m;
    IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(line))) {
      hits.push({ line: i + 1, alt: m[1], target: m[2] });
    }
  });
  return hits;
}

// ── Run ──────────────────────────────────────────────────────────────────
const files = mdFiles();
if (!files.length)
  die('no .md files found under ' + (roots.length ? roots.join(', ') : rel(ROOT)) +
      ' — the scope moved or the walk broke.');

let total = 0, empty = 0;
const findings = [];
for (const f of files) {
  const hits = scan(f);
  for (const h of hits) {
    total++;
    const altTrimmed = h.alt.trim();
    if (VERBOSE)
      console.log('  ' + rel(f) + ':' + h.line + '  alt="' + h.alt + '"  -> ' + h.target);
    if (!altTrimmed) {
      empty++;
      findings.push(rel(f) + ':' + h.line + '  ![' + h.alt + '](' + h.target + ')  — empty/missing alt');
    }
  }
}

console.log('alt-check  scanned ' + files.length + ' .md file(s)');
console.log('=== EMBED DENOMINATOR ===');
console.log('  .svg embeds found: ' + total + '  ->  with alt ' + (total - empty) + '  empty/missing ' + empty);

if (!total)
  die('the harvest found ZERO `.svg` Markdown embeds across ' + files.length +
      ' file(s). A gate that finds no embeds has not passed — it has failed to ' +
      'run. The scope moved or the regex broke. Refusing to report success for ' +
      'work not done.');

if (findings.length) {
  console.log('\nEMPTY/MISSING ALT — assertion E (design/accessibility-profile-proposal.md ' +
              '§3.7, adopted ACCESSIBLE-TEXT-EMISSION) requires a non-empty alt on every artifact embed:');
  for (const f of findings) console.log('  ' + f);
  console.log('\n  Write an alt that says what the figure is (host-profile §1.2: it SHOULD ' +
              'be the figure\'s `title`). An empty alt is permitted only where the same ' +
              'figure\'s full content is already stated in adjacent prose — this gate ' +
              'cannot judge that case and treats every empty alt as a finding.');
  console.log('\nFAIL  ' + findings.length + ' finding(s)');
  process.exit(1);
}

console.log('\nOK  every `.svg` Markdown embed in scope has a non-empty alt' +
            (STRICT ? ' (--strict)' : ''));
