#!/usr/bin/env node
// actor-check.js — gate:actor. The conformance-class declaration exists, and
// every party `spec/` calls CONFORMING is one of the classes it declares.
//
// WHY THIS EXISTS (CONFORMANCE-CLASS-LIST)
// ---------------------------
// core §0.1 (NORMATIVE-KEYWORD-DECLARATION) says what the keywords mean; core §0.2 (CONFORMANCE-CLASS-LIST) says whom
// they bind, and closes the list at six: Parser, Renderer, Reading agent,
// Host, Publisher, and Document as an artifact class. A CLOSED list nothing
// checks is a list that reopens by accident, and this project has the
// receipt: `conformance/DISCREPANCIES.md` UNKNOWN-MINOR-VERSION settled a real divergence
// by inventing a conformance class on the spot — a "viewer-tier
// (lenient-mode) implementation" against "a strict authoring-tier
// implementation" — and LANGUAGE-EXTENSION-POLICY removed that class's ground the same day. The
// orphaned `SHOULD` sat in core §1 until NORMATIVE-SENTENCE-ACTOR repaired it, because a class
// defined in one paragraph is in no list, and a thing in no list cannot be
// checked when its ground moves.
//
// WHAT IT ASSERTS — three mechanical checks and nothing else
// ---------------------------------------------------------
//   1. THE DECLARATION EXISTS, in the declared place. spec/core.md carries
//      a §0.2 heading and,
//      inside it: all six class names, a statement that the list is CLOSED,
//      the label sentence (Engine = Parser and Renderer), and the sentence
//      putting the specification's maintainers out of scope. The place is
//      checked, not merely the presence: §0.2 sits beside §0.1 by NORMATIVE-KEYWORD-DECLARATION's own
//      scope argument, and a declaration that drifts into a section binds
//      that section only.
//   2. EVERY PARTY spec/ CALLS `conforming`/`conformant` IS ONE OF THE SIX,
//      a declared LABEL, or a declared NON-PARTY noun. This is the narrow
//      surface on which a class NAME is actually claimed — "a conforming X"
//      is the form in which an implementer would enter a claim — and it is
//      where a seventh class would first appear in prose. The three
//      vocabularies below are the whole allowlist; a spelling outside them
//      is a finding, and the fix is either to use a declared class name or
//      to rule a new one into core §0.2 deliberately.
//   3. EVERY DOCUMENT WITH ITS OWN STATUS BLOCK NAMES ITS CLASS. The three
//      profiles each cite core §0.2 and name the class they
//      bind, so a reader arriving at a profile does not have to infer which
//      party its MUSTs are addressed to.
//
// WHAT THIS GATE MUST NOT PRETEND TO CHECK, and does not
// ------------------------------------------------------
// It does NOT decide which class a given normative sentence binds. That was
// measured before this tool was written: an open-ended scan for the noun
// nearest before a BCP 14 keyword harvests 63 distinct nouns from spec/, of
// which the majority are not parties at all ("genre", "line", "is", "and"),
// and 354 of the 590 English occurrences carry no actor even inside their
// own sentence. A gate built on that harvest would need an allowlist of
// ~50 non-party words to stay green, which is a decorative check: it would
// pass on noise and could not fail on a wrong party. Assigning a party to a
// sentence is reading, and the per-section audit core §0.2 schedules —
// merged with NORMATIVE-KEYWORD-DECLARATION's, CONFORMANCE-CLASS-LIST — is where a reader does it.
// It also does NOT check that a class's obligation set is complete, that a
// profile's local role is well chosen. Those are judgements too.
//
// COUNTING RULES
// --------------
// Fenced code blocks are skipped whole; inline `code` spans are blanked.
// Whitespace is collapsed to single spaces FIRST, so a phrase broken across
// a line wrap is still seen — without that step five occurrences read as a
// bare adjective and the harvest looks a third smaller than it is.
// English files only -- this repository publishes no translation twin.
//
// IT FAILS LOUDLY, NEVER QUIETLY
// ------------------------------
// The harvest prints on every run, green or red. An empty harvest is exit 2:
// a class gate that finds no class claims has not passed, it has failed to
// run.
//
// usage: node tools/actor-check.js [--strict] [--verbose]
//   --strict   present for symmetry with the other gates; findings already
//              exit 1 without it.
// Exit codes: 0 clean · 1 a finding · 2 tool error (a source could not be
//             read, or the harvest was empty).
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');

const rel = p => path.relative(ROOT, path.resolve(p));

function die(msg) {
  console.error('actor-check: TOOL ERROR — ' + msg);
  process.exit(2);
}

// ------------------------------------------------------------ the six, closed
const CLASSES = ['Parser', 'Renderer', 'Reading agent', 'Host', 'Publisher',
                 'Document'];

// The nouns a `conforming`/`conformant` may legally precede, in three kinds.
// A CLASS is one of the six. A LABEL is core §0.2's conjunction shorthand.
// A NON-PARTY is a word that is not an actor at all — an artifact, an
// external party, or a preposition that happens to follow the adjective.
const CLASS_NOUNS = {
  parser: 'Parser', parsers: 'Parser', producer: 'Parser',
  renderer: 'Renderer', renderers: 'Renderer',
  reader: 'Reading agent', readers: 'Reading agent', agent: 'Reading agent',
  consumer: 'Reading agent', consumers: 'Reading agent',
  host: 'Host', hosts: 'Host', caller: 'Host', viewer: 'Host',
  publisher: 'Publisher', publishers: 'Publisher',
  document: 'Document', documents: 'Document',
};
const LABEL_NOUNS = {
  engine: 'Engine = Parser and Renderer',
  engines: 'Engine = Parser and Renderer',
  implementation: 'Implementation = Parser and Renderer',
  implementations: 'Implementation = Parser and Renderer',
};
// Each with the reason it is not a party, so the allowlist is auditable.
const NON_PARTY = {
  to: 'the preposition — "conforming to X"',
  at: 'the preposition — "conforming at version X"',
  v: 'a version token — "conforming v0.1 document"',
  source: 'an artifact, not a party (core §13)',
  figure: 'an artifact, not a party (core §14 legibility floor)',
  options: 'a set of choices, not a party (host-profile §2)',
  things: 'a quantifier over artifacts (figdown-a11y §7)',
  ua: 'an SVG user agent — an EXTERNAL party, outside FigDown\'s classes',
  xml: 'an XML reader — an EXTERNAL party, outside FigDown\'s classes',
};

// ------------------------------------------------------------------ the walk
function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { die('cannot read directory ' + rel(dir) + ': ' + e.message); }
  for (const e of ents.sort((a, b) => a.name < b.name ? -1 : 1)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// Strip fenced blocks and inline code spans, preserving line numbers.
function prose(src) {
  let fenced = false;
  return src.split('\n').map(l => {
    if (/^\s*(```|~~~)/.test(l)) { fenced = !fenced; return ''; }
    if (fenced) return '';
    return l.replace(/`[^`]*`/g, m => ' '.repeat(m.length));
  });
}

const SPEC = path.join(ROOT, 'spec');
if (!fs.existsSync(SPEC)) die('spec/ not found — the scan scope moved.');
const files = walk(SPEC, []).filter(f => !/\.zh-tw\.md$/.test(f));
if (!files.length) die('the walk found no English .md under spec/. The scope moved.');

// -------------------------------------------- CHECK 2 — the claim spellings
const CLAIM_RE = /\b(conforming|conformant)\s+([A-Za-z][A-Za-z-]*)/g;
const tally = { class: Object.create(null), label: 0, nonparty: 0 };
const unknown = [];
let harvested = 0;

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); }
  catch (e) { die('cannot read ' + rel(f) + ': ' + e.message); }
  const lines = prose(src);
  // Join for wrap-crossing phrases, but keep a line number for each finding
  // by scanning line-joined PAIRS as well as single lines.
  lines.forEach((line, i) => {
    const unit = (line + ' ' + (lines[i + 1] || '')).replace(/\s+/g, ' ');
    let m;
    CLAIM_RE.lastIndex = 0;
    while ((m = CLAIM_RE.exec(unit))) {
      // Only count a match that STARTS on this line, so the pair-join does
      // not double-count the following line's own matches.
      if (m.index > line.replace(/\s+$/, '').length) continue;
      harvested++;
      const noun = m[2].toLowerCase();
      if (CLASS_NOUNS[noun]) {
        const c = CLASS_NOUNS[noun];
        tally.class[c] = (tally.class[c] || 0) + 1;
      } else if (LABEL_NOUNS[noun]) {
        tally.label++;
      } else if (NON_PARTY[noun]) {
        tally.nonparty++;
      } else {
        unknown.push({ file: rel(f), line: i + 1, text: m[1] + ' ' + m[2],
                       ctx: unit.trim().slice(0, 110) });
      }
    }
  });
}

// -------------------------------------------- CHECK 1 — the declaration
function sectionOf(file, headRe, endRe) {
  let src;
  try { src = fs.readFileSync(path.join(ROOT, file), 'utf8'); }
  catch (e) { die('cannot read ' + file + ': ' + e.message); }
  const lines = src.split('\n');
  const start = lines.findIndex(l => headRe.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (endRe.test(lines[i])) { end = i; break; }
  return lines.slice(start, end).join('\n').replace(/\s+/g, ' ');
}

const DECL = [
  { file: 'spec/core.md',
    closed: /\bCLOSED\b/,
    label: /Parser ∧ Renderer/,
    scope: /OUT OF\s+SCOPE|out of\s+scope/ },
];
const declFindings = [];
for (const d of DECL) {
  const sec = sectionOf(d.file, /^###\s*0\.2[.\s]/, /^##\s/);
  if (!sec) {
    declFindings.push(d.file + ' — no §0.2 heading. CONFORMANCE-CLASS-LIST placed the ' +
      'conformance-class list there, beside §0.1, so that its scope is the ' +
      'document and not one section of it.');
    continue;
  }
  const missing = CLASSES.filter(c => !sec.includes(c));
  if (missing.length)
    declFindings.push(d.file + ' §0.2 — does not name ' + missing.join(', ') +
      '. The list is closed at six and all six are declared in one place.');
  if (!d.closed.test(sec))
    declFindings.push(d.file + ' §0.2 — does not say the list is CLOSED. ' +
      'An open list is a promise whose cost is paid by whoever believes it.');
  if (!d.label.test(sec))
    declFindings.push(d.file + ' §0.2 — does not carry the label sentence ' +
      '(Engine = Parser ∧ Renderer). Without it "implementation" reads as a ' +
      'seventh class, which is what CONFORMANCE-CLASS-LIST item 3 ruled it is not.');
  if (!d.scope.test(sec))
    declFindings.push(d.file + ' §0.2 — does not place the specification\'s ' +
      'maintainers out of scope. 126 of 590 occurrences bind this project, ' +
      'and a list that appears to include them is claimable by an implementer.');
}

// -------------------------------------------- CHECK 3 — the profile pointers
const POINTERS = [
  { file: 'spec/host-profile.md',      cls: 'Host' },
  { file: 'spec/figdown-manifest.md',  cls: 'Publisher' },
  { file: 'spec/figdown-a11y.md',      cls: 'Publisher' },
];
const ptrFindings = [];
for (const p of POINTERS) {
  let src;
  try { src = fs.readFileSync(path.join(ROOT, p.file), 'utf8'); }
  catch (e) { die('cannot read ' + p.file + ': ' + e.message); }
  const flat = src.replace(/\s+/g, ' ');
  if (!/§0\.2/.test(flat) || !flat.includes(p.cls))
    ptrFindings.push(p.file + ' — a normative document with its own status ' +
      'block must name core §0.2 and the class it binds (' + p.cls + '). ' +
      'A reader arriving here should not have to infer which party its ' +
      'requirements address.');
}

// ------------------------------------------------------------- the report
console.log('=== CONFORMANCE-CLASS CLAIM HARVEST — spec/**/*.md (English), prose only ===');
const classRows = Object.entries(tally.class).sort((a, b) => b[1] - a[1]);
for (const [c, n] of classRows)
  console.log('  ' + c.padEnd(22) + String(n).padStart(4) + '  class');
if (VERBOSE || tally.label)
  console.log('  ' + 'engine/implementation'.padEnd(22) + String(tally.label).padStart(4) +
              '  LABEL for Parser ∧ Renderer');
if (VERBOSE || tally.nonparty)
  console.log('  ' + 'non-party nouns'.padEnd(22) + String(tally.nonparty).padStart(4) +
              '  declared not to be actors (' + Object.keys(NON_PARTY).length + ' spellings)');
console.log('  ' + 'total'.padEnd(22) + String(harvested).padStart(4) +
            '  "conforming|conformant <noun>" across ' + files.length + ' English file(s)');
console.log('  classes with no claim spelling in the tree: ' +
  (CLASSES.filter(c => !tally.class[c]).join(', ') || '(none)'));

if (harvested === 0)
  die('the scan found ZERO "conforming <noun>" phrases across spec/. A class ' +
      'gate that finds no class claims has not passed — it has failed to run. ' +
      'Refusing to report success for work not done.');

let fail = 0;

if (declFindings.length) {
  console.log('\nCHECK 1 — THE DECLARATION:');
  for (const m of declFindings) console.log('  ' + m);
  fail += declFindings.length;
} else console.log('\nCHECK 1 — the declaration: ok (core §0.2, six classes, closed)');

if (unknown.length) {
  console.log('\nCHECK 2 — A PARTY CALLED CONFORMING THAT IS NOT A DECLARED CLASS:');
  for (const u of unknown)
    console.log('  ' + u.file + ':' + u.line + '  "' + u.text + '"  — ' + u.ctx);
  console.log('\n  core §0.2 closes the list at ' + CLASSES.join(', ') + ',');
  console.log('  with engine/implementation as labels for Parser ∧ Renderer. A party');
  console.log('  not on that list is not a conformance class: either write one of the');
  console.log('  declared names, or rule a new class into §0.2 deliberately and add it');
  console.log('  here in the same change. Improvising one in a paragraph is what');
  console.log('  UNKNOWN-MINOR-VERSION did, and LANGUAGE-EXTENSION-POLICY orphaned it inside a day.');
  fail += unknown.length;
} else console.log('CHECK 2 — every conforming/conformant party is a declared class, label or non-party: ok');

if (ptrFindings.length) {
  console.log('\nCHECK 3 — THE PROFILE POINTERS:');
  for (const m of ptrFindings) console.log('  ' + m);
  fail += ptrFindings.length;
} else console.log('CHECK 3 — every profile names core §0.2 and its own class: ok');

console.log('\n  NOT CHECKED, deliberately: which class any given normative');
console.log('  sentence binds. An open-ended actor harvest over spec/ returns 63');
console.log('  distinct nouns, mostly not parties, and 354 of 590 occurrences carry');
console.log('  no actor inside their own sentence — a gate over that would pass on');
console.log('  noise and could not fail on a wrong party. The per-section audit core');
console.log('  §0.2 schedules (merged with NORMATIVE-KEYWORD-DECLARATION\'s, CONFORMANCE-CLASS-LIST) is where a reader decides.');

console.log('');
if (fail) {
  console.log('FAIL  ' + fail + ' finding(s)');
  process.exit(1);
}
console.log('OK  core §0.2 declares ' + CLASSES.length + ' closed conformance class(es), ' +
            harvested + ' claim spelling(s) all declared, ' +
            POINTERS.length + ' profile pointer(s) present');
