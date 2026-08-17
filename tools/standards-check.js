#!/usr/bin/env node
'use strict';
// standards-check.js — the external-standard claims gate (gate:standards).
//
//   node tools/standards-check.js [--strict] [--verbose] [--unregistered]
//
// WHY THIS FILE EXISTS
//
// An audit of this repository's own text enumerated, for the first time,
// every claim it makes ABOUT AN EXTERNAL STANDARD — what a standard says, what
// it does not contain, what its clause numbers are, and whether the document can
// be obtained at all. Establishing that list changed the number: three known
// false claims became thirteen, over about fifty sites, and one of the thirteen
// was written by the commit that fixed another. The failure was never care about
// any one document. It was that NOBODY HELD THE LIST — twenty-five gates ran on
// every change and not one of them had an external-standard claim in its
// denominator. `gate:cite` measures the project's INTERNAL pointers exhaustively
// (6920 `R` occurrences, zero unresolved) and its external ones not at all.
//
// So this gate holds the list. spec/standards-claims.tsv is the register; this
// file is the check that the register still covers the tree, that its rows have
// the shape their `claim_kind` demands, and — when the fetched source texts are
// present — that the quotes are really in the sources.
//
// FIVE ASSERTIONS (audit §4.2):
//   A. COVERAGE  — every claim-bearing (standard, file) pair the harvest finds
//                  resolves to a register row. An unregistered claim is a FAIL.
//   (The source repository adds two more assertions here — B. SITES, that
//   every file a row names still names its standard, and D. TWIN, that a
//   translation names no standard its English twin does not. Most sites a
//   row names are internal working record this repository does not carry,
//   and it carries no translations at all, so neither assertion has its
//   second operand here and neither is part of this copy.)
//   E. MATCH     — CONDITIONAL. Where the fetched source text is present, a
//                  `wording` quote must appear in it verbatim and an `absence`
//                  quote must NOT appear. Absent the texts, this assertion prints
//                  SKIPPED with the reason and the exact count it did not check.
//
// THE DENOMINATOR, STATED ON EVERY RUN (the STATED-ABSENCE-ACCOUNTING discipline; CORPUS-ENUMERATION-MECHANISM for the walk).
// This project's recurring defect is a wrongly chosen denominator, so the scanned
// set, the excluded set AND THE REASON FOR EACH EXCLUSION are printed whether or
// not anything is found. A gate that silently passes when it checked nothing is
// the defect class this whole exercise exists to kill.
//
// THE HARVEST HEURISTIC, AND ITS KNOWN MISSES.
// The scan keys on the STANDARD'S NAME TOKEN and reads a following `§` as that
// token's ARGUMENT — never on `§` syntax alone. The audit's one rejected finding
// is the reason: four `§15.4`-style spans in a design note were reported as UML
// clause citations, twice, by two independent checkers, and they are
// cross-references to a SIBLING DESIGN DOCUMENT's own §15.4. A gate that fires on
// the project's own cross-references gets switched off inside a week. Only an
// edition number and a possessive may sit between a name and its clause: a
// sentence that names an RFC, ends, and then opens with a section sign is
// pointing at the CONTAINING document, not at the RFC.
//
// A bare mention is not a claim. `RFC 9293` in a figure title, or an example
// string in a tool's own documentation, asserts nothing about RFC 9293. A token
// therefore counts only when its context also carries one of four markers, which
// are also the four `claim_kind` values:
//
//   structure     the token is IMMEDIATELY followed by its clause argument —
//                 `§`, `clause N`, `Annex X`, `Table N`, allowing an edition
//                 number and a possessive in between (`UML 2.5.1 §14.2.3.7`).
//   availability  the sentence carries an obtainability word — paywalled, free of
//                 charge, fetched, priced, downloadable, first-hand, not held.
//   absence       the sentence carries an absence claim — zero occurrences, does
//                 not define, never uses, no such word.
//   wording       the sentence carries an attribution — spells, calls it, its own
//                 term, verbatim, taken from, deliberately NOT.
//
// Known misses, stated rather than discovered later:
//   1. A claim that names no standard token at all ("the domain's own standard
//      says") is invisible here. The harvest is a regex over names. The honest
//      mitigation is that vagueness is already a drafting defect this project
//      rules against, and a vague claim cannot be cited by a reader either.
//   2. A claim whose sentence carries none of the four markers — "ISO 5807 has a
//      symbol for this" — is not harvested. The heuristic is deliberately
//      CONSERVATIVE: a noisy gate that flags figure captions trains people to
//      silence it, and a silenced gate has the denominator of the old world.
//   3. Resolution is per (STANDARD, FILE), not per sentence. One registered UML
//      claim in a file satisfies every UML claim in that file. Sentence-level
//      resolution would need thousands of rows and would flag the project's own
//      prose about its own claims. The register's `sites` column is what carries
//      the finer grain, and it is not checked by the harvest.
//   4. The four markers are English, which is the only language this
//      repository publishes.
//   5. Bare `CSS`, `SVG` and `HTML` are NOT harvested as W3C tokens. In a project
//      whose output format IS SVG that would be pure noise, and a noisy gate is a
//      silenced gate. The consequence is real and is the audit's largest single
//      block of unverified claims: ~24 rows of spec/vocabulary-sources.tsv
//      attribute spellings to W3C through its `source` column alone. They are in
//      the register anyway (S371) — the register may hold MORE than the harvest
//      finds, never less — and assertion B keeps them honest through an alias.
//
// SOURCE TEXTS LIVE OUTSIDE THE REPOSITORY. The standards themselves are not
// redistributable and a session-local path is not a citation, so assertion E is
// conditional: point $FIGDOWN_STANDARDS_TEXT at a directory of fetched texts, or
// drop them in the gitignored `standards-text/` at the repo root. One file per
// standard, named by the slug of the register's `standard` column
// (`ISO 5807` -> `iso-5807.txt`, `ITU-T Z.120` -> `itu-t-z-120.txt`), extension
// `.txt` or `.md`. What is NOT held is printed and counted, never assumed clean.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTER_REL = 'spec/standards-claims.tsv';
const REGISTER = path.join(ROOT, REGISTER_REL);

const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const VERBOSE = argv.includes('--verbose');
const DUMP = argv.includes('--unregistered');

let failures = 0;
const fail = m => { console.log('  FAIL  ' + m); failures++; };
const ok = m => { console.log('  ok    ' + m); };
const die2 = m => { console.error('standards-check: ' + m); process.exit(2); };

// ── The denominator ──────────────────────────────────────────────────────────
// Roots the gate reads. Each is a directory that makes ASSERTIONS in prose,
// registry rows or diagnostics — as opposed to one that draws figures.
const ROOTS = [
  ['<root>/*.md',   'the published top-level documents'],
  ['spec/',         'the standard itself and its registries'],
  ['tools/',        'gate headers, which argue from standards as much as prose does'],
  ['conformance/',  'fixture documentation and coverage notes'],
  ['examples/',     'the figure index prose (the .fd sources themselves are excluded)'],
  ['editor/',       'the single hand-edited engine source and its diagnostics'],
  ['integrations/', 'shipped adapters and their documentation'],
  ['figures/',      'figure documentation embedded in the standard documents'],
];

// Every exclusion is PRINTED. An exclusion nobody can see is a hole nobody
// can audit — which is exactly how the three shipped cases survived.
const EXCLUSIONS = [
  [/^read\//,                       'frozen release trees — corrected through spec/ERRATA.md, not here (audit §Scope)'],
  [/^archive\//,                    'frozen release trees — same rule'],
  [/^CHANGELOG\.md$/,               'the release narrative — written in this repository, which the register is not, and every standards claim it summarises is registered at the spec site that makes it'],
  [/^dist\//,                       'GENERATED from editor/figdown.html by tools/make-lib.js'],
  [/^skill\//,                      'GENERATED from read/0.4/ and the engine by tools/make-skill.js — the engine claim is registered once, at editor/figdown.html'],
  [/^tools\/comprehension\//,       'model transcripts and question fixtures — other agents\' words, not this project\'s assertions'],
  [/^tools\/migrate-fixtures\//,    'migration inputs, pre-migration by design'],
  [/^spec\/standards-claims\.tsv$/, 'THE REGISTER ITSELF'],
];

// Content excluded INSIDE a scanned file, for the audit's own reason: a standard
// named as the SUBJECT MATTER of a figure is not a claim about its vocabulary.
const CONTENT_EXCLUSIONS = [
  ['fenced code blocks in .md',   '```…``` — figure sources and quoted syntax, where a standard is the figure\'s SUBJECT'],
  ['figure-index table rows',     'a markdown table row linking a .fd or .svg is a figure index, and the standard named in it is that figure\'s subject'],
  ['clause spans inside `code`',  'a `RFC 9293 §3.3.2` written as an example STRING is not a citation of RFC 9293'],
];

const SCAN_EXT = /\.(md|tsv)$/;
const SCAN_EXTRA = r => r === 'editor/figdown.html'
                     || /^tools\/[^/]+\.js$/.test(r)
                     || /^integrations\/.+\.js$/.test(r);

function excluded(rel) {
  for (const [re, why] of EXCLUSIONS) if (re.test(rel)) return why;
  return null;
}

// The walk RECURSES (lib/corpus.js rule 1; that module enumerates .fd figures,
// this gate enumerates prose, so the walk is here but the rule is the same).
function walkTree() {
  const kept = [], skipped = [];
  const seen = new Set();
  const visit = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })
                     .sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p);
      if (e.isDirectory()) {
        const why = excluded(rel + '/');
        if (why) { skipped.push([rel + '/', why]); continue; }
        visit(p);
      } else {
        if (!(SCAN_EXT.test(rel) || SCAN_EXTRA(rel))) continue;
        if (seen.has(rel)) continue;
        seen.add(rel);
        const why = excluded(rel);
        if (why) { skipped.push([rel, why]); continue; }
        kept.push(rel);
      }
    }
  };
  visit(ROOT);
  return { kept, skipped };
}

// ── The token list ───────────────────────────────────────────────────────────
// Derived from what the audit actually found in the tree, not from a wishlist.
// STATED-ABSENCE-ACCOUNTING's residue: this list is written by a person, and a new standards body
// needs a line here. That is one line rather than a re-audit.
const PATTERNS = [
  [/ISO\/IEC\s+19505(?:-\d)?(?::\d{4})?/g,            () => 'ISO/IEC 19505'],
  [/\bISO\s+19505\b/g,                                () => 'ISO/IEC 19505'],
  [/\bISO\s+5807(?::\d{4})?/g,                        () => 'ISO 5807'],
  [/\bISO\/IEC\s+(\d{3,5})/g,                         m => 'ISO/IEC ' + m[1]],
  // `ISO 19505` written without the IEC half is the SAME standard, and must
  // normalise to the same key or the register would owe it a second row.
  [/\bISO\s+(\d{3,5})/g,                              m => m[1] === '19505' ? 'ISO/IEC 19505' : 'ISO ' + m[1]],
  [/\bIEEE\s+(\d{3,4}(?:\.\d+)?(?:[A-Za-z]{1,3})?)/g, m => 'IEEE ' + m[1]],
  [/(?:ITU-T\s+)?\bZ\.120\b/g,                        () => 'ITU-T Z.120'],
  [/(?:ITU-T\s+)?\bX\.680\b/g,                        () => 'ITU-T X.680'],
  [/\bASN\.1\b/g,                                     () => 'ITU-T X.680'],
  [/\bRFC\s*(\d{3,4})/g,                              m => 'RFC ' + m[1]],
  [/\bUML\b/g,                                        () => 'UML'],
  [/\bBPMN\b/g,                                       () => 'OMG BPMN'],
  [/\bW3C\b/g,                                        () => 'W3C'],
  [/\bECMAScript\b|\bECMA-262\b/g,                    () => 'ECMA-262'],
  [/\bANSI\s+X3\.5[-\d]*/g,                           () => 'ANSI X3.5'],
  [/\bSystemRDL\b/g,                                  () => 'Accellera SystemRDL'],
  [/\bIP-XACT\b/g,                                    () => 'IEEE 1685'],
  [/UAX\s*#?\s*11|East Asian Width/g,                 () => 'Unicode UAX #11'],
  [/\bPOSIX\b/g,                                      () => 'ISO 9945'],
  [/\bOOXML\b/g,                                      () => 'ISO/IEC 29500'],
  [/\bODF\b/g,                                        () => 'ISO/IEC 26300'],
];

// The clause argument must belong to the TOKEN: at most an edition number and a
// possessive may sit between them. A span reading "…the four RFC 8446 figures.
// §11 Q3" is NOT a clause citation — the §11 belongs to the design note itself.
const CLAUSE_ARG = /^\s*(?:[-:]?\d+(?:\.\d+)*)?(?:'s)?[\s,]{0,2}(?:§|\bclause\s+\d|\bAnnex\s+[A-Z]|\bTable\s+\d)/;
const AVAIL_MARK = /\bpaywall\w*|\bfree of charge\b|\bfreely\b|\bobtainab\w+|\bpriced\b|\bfetched\b|\bdownloadab\w+|\bpp\. 1[-–]8\b|\bfirst-hand\b|\bnot held\b|\bunread\b/i;
const ABSENCE_MARK = /\bzero (?:occurrences|hits|times)\b|\boccurs? zero\b|\bdoes not (?:contain|use|define|say)\b|\bno (?:such )?(?:word|term|metaclass|equivalent)\b|\bnever uses\b|\bnot in\b/i;
const WORDING_MARK = /\bown (?:word|term|name|spelling|grammar|production|wording|words)\b|\bspell(?:s|t|ed|ing)\b|\bcalls? (?:it|the|them)\b|\bnames? (?:it|the)\b|\bthe (?:word|term|spelling|metaclass|keyword)\b|\bverbatim\b|\btaken (?:from|whole)\b|\bborrowed\b|\bis the source of\b|\bsource standard\b|\bdeliberately NOT\b/i;

// Blank out the content exclusions rather than deleting them, so every byte
// offset — and therefore every reported line number — stays true.
function maskContent(rel, text) {
  const blank = s => s.replace(/[^\n]/g, ' ');
  if (/\.md$/.test(rel)) {
    text = text.replace(/^```[\s\S]*?^```/gm, blank);
    text = text.split('\n')
               .map(l => (/^\s*\|/.test(l) && /\.(fd|svg)\b/.test(l)) ? blank(l) : l)
               .join('\n');
  }
  return text;
}

function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }

// The sentence around a hit: bounded by a blank line, a sentence end, or 400
// characters, whichever comes first.
function sentenceAt(t, i) {
  let a = i, b = i;
  while (a > 0) {
    if (/\n\n/.test(t.slice(a - 2, a))) break;
    if (i - a > 10 && /[.;!?]\s/.test(t.slice(a - 2, a))) break;
    if (i - a > 400) break;
    a--;
  }
  while (b < t.length) {
    if (/\n\n/.test(t.slice(b, b + 2))) break;
    if (b - i > 10 && /[.;!?]\s/.test(t.slice(b, b + 2))) break;
    if (b - i > 400) break;
    b++;
  }
  return t.slice(a, b);
}

function rawTokens(text) {
  const out = new Set();
  for (const [re, norm] of PATTERNS) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(text)); ) out.add(norm(m));
  }
  return out;
}

// Returns Map("<standard>\t<file>" -> {n, kinds:Set, first:{line, sentence}}).
function harvest(files) {
  const pairs = new Map();
  let hits = 0;
  for (const rel of files) {
    const text = maskContent(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    for (const [re, norm] of PATTERNS) {
      re.lastIndex = 0;
      for (let m; (m = re.exec(text)); ) {
        const std = norm(m);
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
        const lineStart = text.lastIndexOf('\n', m.index) + 1;
        const before = text.slice(lineStart, m.index);
        const inCodeSpan = ((before.match(/`/g) || []).length % 2) === 1;
        const sent = sentenceAt(text, m.index).replace(/\s+/g, ' ').trim();
        // A decision ID is UPPERCASE-KEBAB English and is a NAME, not prose:
        // `DESCRIPTION-KEY-SPELLING` must not satisfy the `spelling` marker.
        // Masked for the marker test only; the reported sentence is untouched.
        const prose = sent.replace(/\b[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)+\b/g, ' ');
        let kind = null;
        if (CLAUSE_ARG.test(after) && !inCodeSpan) kind = 'structure';
        else if (AVAIL_MARK.test(prose))           kind = 'availability';
        else if (ABSENCE_MARK.test(prose))         kind = 'absence';
        else if (WORDING_MARK.test(prose))         kind = 'wording';
        if (!kind) continue;
        hits++;
        const key = std + '\t' + rel;
        if (!pairs.has(key))
          pairs.set(key, { std, file: rel, n: 0, kinds: new Set(),
                           line: lineOf(text, m.index), sentence: sent.slice(0, 180) });
        const p = pairs.get(key);
        p.n++; p.kinds.add(kind);
      }
    }
  }
  return { pairs, hits };
}

// ── The register ─────────────────────────────────────────────────────────────
const COLUMNS = ['id', 'standard', 'edition', 'clause', 'claim_kind', 'claim',
                 'quote', 'sites', 'status', 'verifier', 'checked'];
const KINDS = ['wording', 'absence', 'structure', 'availability'];
const STATUSES = ['verified', 'corrected', 'weak', 'secondary', 'unverified', 'unread', 'open'];
// A prose quote must be long enough to grep. A quote that IS a literal — one
// backticked token, a metaclass name, a production — is exact by construction and
// cannot be padded without falsifying it, so it is admitted at 3 characters.
const MIN_QUOTE = { wording: 16, absence: 3, structure: 3, availability: 12 };
const LITERAL = /^`[^`]+`$/;

// Site verification (assertion B) resolves a few standards through the names the
// tree actually writes. This is NOT a harvest alias — see known miss 5.
const SITE_ALIASES = {
  'W3C': /\bW3C\b|\bCSS\b|\bSVG\b|\bHTML\b/,
  'Unicode UAX #11': /UAX\s*#?\s*11|East Asian Width|\bUnicode\b/,
};

if (!fs.existsSync(REGISTER))
  die2(REGISTER_REL + ' is missing — the claims register does not exist, so nothing\n' +
       '             can be said about whether this repository\'s external-standard claims\n' +
       '             hold. That is a failure, not an empty pass.');

const registerText = fs.readFileSync(REGISTER, 'utf8');
const rows = [];
{
  const lines = registerText.split('\n');
  let header = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line[0] === '#' || line.trim() === '') continue;
    const cells = line.split('\t');
    if (!header) {
      header = cells;
      if (header.join('\t') !== COLUMNS.join('\t'))
        die2(REGISTER_REL + ' header row is not the declared schema.\n' +
             '             expected: ' + COLUMNS.join(' · ') + '\n' +
             '             found:    ' + header.join(' · '));
      continue;
    }
    if (cells.length !== COLUMNS.length) {
      fail(REGISTER_REL + ':' + (i + 1) + ': ' + cells.length + ' field(s), expected ' +
           COLUMNS.length + ' — TSV field-count discipline (a stray tab or a missing `-`).');
      continue;
    }
    const r = {};
    COLUMNS.forEach((c, j) => { r[c] = cells[j]; });
    r.__line = i + 1;
    rows.push(r);
  }
  if (!header)
    die2(REGISTER_REL + ' has no header row — the register is unparseable.');
}
if (!rows.length)
  die2(REGISTER_REL + ' parsed to ZERO claim rows. A register with nothing in it is\n' +
       '             not a clean run; it is a register that cannot report an absence.');

const registered = new Map();   // "<standard>\t<file>" -> [row ids]
for (const r of rows) {
  for (const site of r.sites.split(/\s+/).filter(s => s && s !== '-')) {
    const file = site.split(':')[0];
    const key = r.standard + '\t' + file;
    if (!registered.has(key)) registered.set(key, []);
    registered.get(key).push(r.id);
  }
}

// ── Source texts (assertion E is conditional on these) ───────────────────────
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TEXT_DIR_ENV = process.env.FIGDOWN_STANDARDS_TEXT;
const TEXT_DIR_DEFAULT = path.join(ROOT, 'standards-text');
let textDir = null, textDirWhy = '';
if (TEXT_DIR_ENV && fs.existsSync(TEXT_DIR_ENV)) {
  textDir = TEXT_DIR_ENV; textDirWhy = '$FIGDOWN_STANDARDS_TEXT';
} else if (fs.existsSync(TEXT_DIR_DEFAULT)) {
  textDir = TEXT_DIR_DEFAULT; textDirWhy = 'standards-text/ (gitignored)';
} else if (TEXT_DIR_ENV) {
  textDirWhy = '$FIGDOWN_STANDARDS_TEXT is set but does not exist: ' + TEXT_DIR_ENV;
} else {
  textDirWhy = 'neither $FIGDOWN_STANDARDS_TEXT nor standards-text/ is present';
}
const sourceCache = new Map();
function sourceTextFor(standard) {
  if (!textDir) return null;
  if (sourceCache.has(standard)) return sourceCache.get(standard);
  let found = null;
  for (const ext of ['.txt', '.md']) {
    const p = path.join(textDir, slug(standard) + ext);
    if (fs.existsSync(p)) { found = fs.readFileSync(p, 'utf8'); break; }
  }
  sourceCache.set(standard, found);
  return found;
}

// ── Run ──────────────────────────────────────────────────────────────────────
const { kept, skipped } = walkTree();
const { pairs, hits } = harvest(kept);

console.log('standards-check — every claim this tree makes about an external standard is');
console.log('                  in the register, and the register still fits the tree');
console.log('  register: ' + REGISTER_REL + '  (' + rows.length + ' claim row(s))');
console.log('');
console.log('  DENOMINATOR — scanned (recursive): ' + kept.length + ' file(s), '
            + '.md / .tsv / editor/figdown.html / tools/*.js / integrations/**/*.js');
for (const [r, why] of ROOTS) console.log('    ' + pad(r, 16) + why);
console.log('  DENOMINATOR — excluded, by design (' + skipped.length + ' path(s) matched):');
for (const [re, why] of EXCLUSIONS) {
  const n = skipped.filter(([p]) => re.test(p)).length;
  console.log('    ' + lpad(n, 4) + '  ' + String(re).replace(/^\/|\/$/g, '') + '  — ' + why);
}
console.log('  DENOMINATOR — excluded INSIDE a scanned file (audit §Scope: a standard');
console.log('                named as a figure\'s SUBJECT is not a claim about its vocabulary):');
for (const [what, why] of CONTENT_EXCLUSIONS) console.log('    ' + pad(what, 30) + why);
console.log('  HARVEST: ' + hits + ' claim-bearing sentence(s) over ' + pairs.size
            + ' (standard, file) pair(s), '
            + new Set([...pairs.values()].map(p => p.std)).size + ' distinct standard(s).');
console.log('           Resolution is per (standard, file); see the header for the misses.');
console.log('');

// A. COVERAGE
console.log('  A. COVERAGE — every harvested (standard, file) pair has a register row');
const unregistered = [];
for (const [key, p] of pairs) if (!registered.has(key)) unregistered.push(p);
if (unregistered.length) {
  for (const p of unregistered.sort((a, b) => (a.std + a.file).localeCompare(b.std + b.file))) {
    fail('UNREGISTERED: ' + p.std + ' in ' + p.file + ':' + p.line +
         ' [' + [...p.kinds].join(',') + ', ' + p.n + ' hit(s)] — no row in ' + REGISTER_REL);
    console.log('        ' + p.sentence);
  }
} else {
  ok(pairs.size + ' harvested pair(s), all registered');
}
if (DUMP) for (const p of unregistered)
  console.log('    DUMP\t' + p.std + '\t' + p.file + ':' + p.line + '\t'
              + [...p.kinds].join(',') + '\t' + p.sentence);

// B. SITES — not performed here. Three quarters of the sites the register
// names are internal working record this repository does not carry, and the
// published quarter is rewritten and truncated by the publish transform, so
// the assertion has no second operand in this tree. It runs where the sites
// are, which is where the register is edited.
const siteChecks = 0;

// C. SHAPE
console.log('');
console.log('  C. SHAPE — each claim_kind carries the evidence its kind demands');
let shapeBad = 0;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const seenIds = new Set();
for (const r of rows) {
  const bad = m => { fail(r.id + ' (' + REGISTER_REL + ':' + r.__line + '): ' + m); shapeBad++; };
  if (!/^S\d{3}$/.test(r.id)) bad('id is not `S<nnn>`.');
  if (seenIds.has(r.id)) bad('duplicate id.');
  seenIds.add(r.id);
  if (!KINDS.includes(r.claim_kind)) bad('claim_kind `' + r.claim_kind + '` is not one of ' + KINDS.join(' · '));
  if (!STATUSES.includes(r.status)) bad('status `' + r.status + '` is not one of ' + STATUSES.join(' · '));
  if (r.claim.length < 12) bad('claim is empty or too short to be a claim.');
  if (r.sites.trim() === '' || r.sites.trim() === '-') bad('no site — a claim with no location cannot be checked.');
  if (r.verifier.trim() === '' || r.verifier.trim() === '-') bad('no verifier — `verified` must name who checked it, and `unread` must name who looked.');
  if (!DATE.test(r.checked)) bad('checked is not an ISO date.');
  const min = MIN_QUOTE[r.claim_kind] || 3;
  if (r.claim_kind === 'availability') {
    // THIS IS THE COLUMN CASE 3 NEEDED. "ISO/IEC 19505 is paywalled" is not a
    // claim about what the document SAYS — no quotation rule reaches it — it is
    // a claim about whether the document can be got. So an availability row
    // carries a RETRIEVAL RECORD instead of a quote: where it was fetched from
    // and when. A claim that was never fetched must say `NOT RETRIEVED` in the
    // register, and then it cannot also be `verified`.
    if (!DATE.test(r.quote))
      bad('an availability row\'s quote column must hold a RETRIEVAL RECORD — where it was fetched from and WHEN.');
    const notRetrieved = /^NOT RETRIEVED/.test(r.quote);
    if ((r.status === 'unread' || r.status === 'unverified') && !notRetrieved)
      bad('status `' + r.status + '` on an availability row must record `NOT RETRIEVED; <date looked>` — an unfetched document has no retrieval record to give.');
    if ((r.status === 'verified' || r.status === 'corrected') && notRetrieved)
      bad('an availability row marked `' + r.status + '` may not say NOT RETRIEVED. `verified` means the document was obtained, never that someone believed it could be.');
  } else if (r.status === 'unread') {
    // You may not print a verbatim quote from a text you do not hold. That is
    // the whole of case 1 and case 2, one level down.
    if (r.quote.trim() !== '-')
      bad('status `unread` means the source text is not held, so the row may not carry a quote from it — write `-`. A quote the register cannot have read is a claim, not a citation.');
  } else if (r.quote.trim() === '-') {
    if (r.claim_kind !== 'structure') bad('a ' + r.claim_kind + ' row must carry a quote (or be `unread`).');
  } else if (r.quote.length < min && !LITERAL.test(r.quote)) {
    bad('quote is ' + r.quote.length + ' char(s); a ' + r.claim_kind + ' quote needs ' + min +
        ' to be greppable, unless it is a single backticked literal.');
  }
  if ((r.claim_kind === 'structure' || r.claim_kind === 'wording')
      && (r.clause.trim() === '' )) bad('clause column is empty (use `-` when the standard has no clause to name).');
}
if (!shapeBad) ok(rows.length + ' row(s) carry the evidence their claim_kind demands');

// D. TWIN PARITY — not performed here. This repository is English only and
// carries no translation to compare, so the assertion would report parity it
// never checked.
const twins = 0;

// E. MATCH (conditional)
console.log('');
console.log('  E. MATCH — quote versus the standard\'s own text (CONDITIONAL)');
let matched = 0, unmatchable = 0, matchBad = 0;
const notHeld = new Map();
if (!textDir) {
  const quotable = rows.filter(r => r.claim_kind !== 'availability' && r.quote.trim() !== '-');
  console.log('  SKIPPED — ' + textDirWhy + '.');
  console.log('            ' + quotable.length + ' of ' + rows.length + ' row(s) carry a quote that COULD have been matched and');
  console.log('            was NOT checked on this run. The presence of a register row is always');
  console.log('            checkable; quote-versus-source only when the fetched texts are here.');
  console.log('            Drop one file per standard into standards-text/ (gitignored), named');
  console.log('            by the slug of the `standard` column — e.g. ' + slug('ISO 5807') + '.txt.');
  unmatchable = quotable.length;
} else {
  console.log('  source texts: ' + textDirWhy);
  for (const r of rows) {
    if (r.claim_kind === 'availability' || r.quote.trim() === '-') continue;
    const src = sourceTextFor(r.standard);
    if (src === null) {
      unmatchable++;
      notHeld.set(r.standard, (notHeld.get(r.standard) || 0) + 1);
      continue;
    }
    // A backticked literal is the register's own markup, not the source's.
    const q = LITERAL.test(r.quote) ? r.quote.slice(1, -1) : r.quote;
    if (r.claim_kind === 'absence') {
      if (src.includes(q)) {
        fail(r.id + ': absence claim, but "' + clip(q) + '" IS present in the held text of ' + r.standard + '.');
        matchBad++;
      } else { matched++; if (VERBOSE) ok(r.id + ': absent from ' + r.standard + ', as claimed'); }
      continue;
    }
    // A truncated quote is a substring of the true one, so a production quote
    // must be ANCHORED to its line end (audit §4.4 — the naive implementation is
    // green on exactly the ASN.1 `PresenceConstraint` defect this audit found).
    const anchored = /::=|:==|\bBNF\b/.test(q);
    let hit;
    if (anchored) {
      hit = src.split('\n').some(l => l.trimEnd().endsWith(q.trimEnd()));
    } else {
      hit = src.includes(q);
    }
    if (hit) { matched++; if (VERBOSE) ok(r.id + ': quote found in ' + r.standard); }
    else {
      fail(r.id + ': quote "' + clip(q) + '" does NOT appear' + (anchored ? ' anchored to a line end' : '') +
           ' in the held text of ' + r.standard + '.');
      matchBad++;
    }
    // The honesty rule (audit §4.2), applied where it can be: a row marked
    // `verified` whose source IS held must be matched by this gate, not asserted.
  }
  console.log('  matched ' + matched + ' quote(s); ' + unmatchable + ' row(s) had no held source text:');
  for (const [s, n] of [...notHeld].sort()) console.log('      ' + pad(s, 24) + n + ' row(s) — no ' + slug(s) + '.txt in the text directory');
}

// ── Summary ──────────────────────────────────────────────────────────────────
const byKind = {}, byStatus = {};
for (const r of rows) {
  byKind[r.claim_kind] = (byKind[r.claim_kind] || 0) + 1;
  byStatus[r.status] = (byStatus[r.status] || 0) + 1;
}
console.log('');
console.log('  register: ' + KINDS.map(k => k + ' ' + (byKind[k] || 0)).join('  '));
console.log('            ' + STATUSES.map(s => s + ' ' + (byStatus[s] || 0)).join('  '));
if (byStatus.open)
  console.log('  OPEN: ' + byStatus.open + ' known-false or known-unresolved claim(s) still in the tree, ' +
              'registered as `open` rather than hidden. Each names its owner in the register\'s `verifier` column; ' +
              'this line prints on every run so the count cannot go quiet.');
console.log('');
console.log('standards-check summary: ' + rows.length + ' register row(s); harvested ' + hits
            + ' claim-bearing sentence(s) over ' + pairs.size + ' (standard, file) pair(s) in '
            + kept.length + ' scanned file(s), ' + skipped.length + ' path(s) excluded by design; '
            + 'coverage ' + (pairs.size - unregistered.length) + '/' + pairs.size + '; '
            + siteChecks + ' site(s) resolved; ' + twins + ' translation(s) parity-checked; '
            + 'quote-vs-source ' + (textDir ? matched + ' matched, ' + unmatchable + ' unheld'
                                            : 'SKIPPED (' + unmatchable + ' quotable row(s) unchecked — ' + textDirWhy + ')')
            + '; ' + failures + ' failure(s)');

function clip(s) { return s.length > 56 ? s.slice(0, 53) + '…' : s; }
function pad(s, n)  { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function lpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

if (failures) {
  console.log('');
  console.log('standards-check: ' + failures + ' failure(s)');
  process.exit(STRICT ? 1 : 1);
}
console.log('OK  every harvested external-standard claim resolves to a register row, and every row fits the tree');
