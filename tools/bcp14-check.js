#!/usr/bin/env node
// bcp14-check.js — gate:bcp14. The BCP 14 declaration exists, and every
// all-caps modal construction in spec/ is one of the eleven spellings it
// declares.
//
// WHY THIS EXISTS (NORMATIVE-KEYWORD-DECLARATION)
// ----------------------
// NORMATIVE-KEYWORD-DECLARATION adopted BCP 14 explicitly, in core §0.1, with RFC 8174's
// capitalization caveat. That sentence turns every all-caps occurrence in
// spec/ into a claim on the day it lands — 567 occurrences in this tree's
// spec/ when it landed. A declaration nothing checks is a declaration that drifts, and this
// project has the receipt: `S128` carried a quote that did not exist in the
// RFC it cited for four months, because assertion E printed SKIPPED whenever
// the text was not held.
//
// WHAT IT ASSERTS — three mechanical checks and nothing else
// ---------------------------------------------------------
//   1. THE DECLARATION EXISTS, in the declared place. spec/core.md carries
//      a §0.1 heading and, inside it, a citation of BOTH RFC 2119 and
//      RFC 8174 plus the capitalization caveat. The place is checked,
//      not merely the presence: a declaration that drifts back into §13 is
//      the defect NORMATIVE-KEYWORD-DECLARATION corrected.
//   2. EVERY ALL-CAPS MODAL CONSTRUCTION IN spec/ IS ONE OF THE ELEVEN.
//      MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT,
//      RECOMMENDED, NOT RECOMMENDED, MAY, OPTIONAL. Anything else built out
//      of an all-caps modal — MUST NEVER, MAY NOT, MUST ALWAYS, SHOULD
//      ALWAYS, SHALL ALWAYS, MUST SOMETIMES — is a construction BCP 14 does
//      not define, so the sentence carrying it claims a meaning the
//      declaration does not supply. FIVE `MUST NEVER` occurrences were live
//      when this gate was written and NORMATIVE-KEYWORD-DECLARATION fixed all five in the same batch.
//      The ADV-6 census that motivated this check predicted FOUR; the gate
//      found a fifth, in spec/core.md §10, on its first run. That gap between
//      a hand census and a gate is the whole argument for having the gate.
//      SHALL / SHALL NOT / RECOMMENDED / NOT RECOMMENDED are at zero
//      occurrences today; their absence is not asserted (the boilerplate is
//      a fixed sentence and declaring an unused word is free), but the
//      denominator prints per keyword so the day one is first used is
//      visible in the log rather than silent.
//   3. EVERY DOCUMENT WITH ITS OWN STATUS BLOCK CARRIES THE POINTER SENTENCE.
//      The three profiles are normative documents that are not core, so a
//      reader arriving at one must be able to find the declaration without
//      already knowing it exists. Each cites BCP 14 and
//      names core §0.1.
//
// WHAT THIS GATE MUST NOT PRETEND TO CHECK, and does not
// ------------------------------------------------------
// It does NOT judge whether an occurrence is a genuine requirement. It does
// NOT judge whether the party bound by a given MUST is the right party — the
// spec names fifteen grammatical subjects for its obligations and defines
// zero conformance classes, which is a registered open item of its own
// (advisory intake, "the conformance-actor problem") and not something a
// regex can settle. It does NOT judge whether a lowercase "must" should have
// been uppercase: RFC 8174 §2 says in terms that normative text does not
// require these key words, so the 779 lowercase modals are prose by the
// standard's own rule and promoting one is an editorial judgement. And it
// does NOT count the MENTION class — a keyword being talked about rather
// than used, measured at 14% of a 63-occurrence sample — because separating
// use from mention is reading, not matching.
//
// Each of those is a judgement. A gate that claimed one would be a gate
// saying a thing it cannot know, which is the failure spec/standards-claims.tsv
// exists to prevent. The audit NORMATIVE-KEYWORD-DECLARATION scheduled is where those judgements are
// made, by a reader, occurrence by occurrence.
//
// COUNTING RULES (the same ones NORMATIVE-KEYWORD-DECLARATION's census used, so the numbers compare)
// ------------------------------------------------------------------------
// Fenced code blocks are skipped whole; inline `code` spans are blanked
// before the scan. Longest-match-first, so `MUST NOT` is ONE occurrence and
// not two — the first run of the census counted it as two and reported MUST
// as 450. Word boundaries exclude `[A-Za-z0-9_-]` on both sides.
//
// IT FAILS LOUDLY, NEVER QUIETLY
// ------------------------------
// The denominator prints on every run, green or red. An empty harvest is
// exit 2: a keyword gate that finds no keywords has not passed, it has
// failed to run.
//
// usage: node tools/bcp14-check.js [--strict] [--verbose]
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
  console.error('bcp14-check: TOOL ERROR — ' + msg);
  process.exit(2);
}

// ---------------------------------------------------------------- the eleven
const KEYWORDS = [
  'MUST NOT', 'SHALL NOT', 'SHOULD NOT', 'NOT RECOMMENDED',
  'MUST', 'SHALL', 'SHOULD', 'RECOMMENDED', 'REQUIRED', 'MAY', 'OPTIONAL',
];
// Longest first so `MUST NOT` wins over `MUST`.
const ORDER = KEYWORDS.slice().sort((a, b) => b.length - a.length);

// The modal heads a non-BCP-14 construction can be built out of. A head
// followed by an all-caps word that does not complete one of the eleven is a
// finding.
const HEADS = ['MUST', 'SHALL', 'SHOULD', 'MAY', 'NOT'];

const B = '(?<![A-Za-z0-9_-])';
const A = '(?![A-Za-z0-9_-])';
const KW_RE   = new RegExp(B + '(' + ORDER.join('|') + ')' + A, 'g');
const HEAD_RE = new RegExp(B + '(' + HEADS.join('|') + ')[  ]+([A-Z]{2,})' + A, 'g');

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

// Strip fenced blocks and inline code spans, preserving line count.
function prose(src) {
  const lines = src.split('\n');
  let fenced = false;
  return lines.map(l => {
    if (/^\s*(```|~~~)/.test(l)) { fenced = !fenced; return ''; }
    if (fenced) return '';
    return l.replace(/`[^`]*`/g, m => ' '.repeat(m.length));
  });
}

const SPEC = path.join(ROOT, 'spec');
if (!fs.existsSync(SPEC)) die('spec/ not found — the scan scope moved.');
const files = walk(SPEC, []);
if (!files.length) die('the walk found no .md under spec/. The scope moved.');

let fail = 0;
const tally = Object.create(null);
for (const k of KEYWORDS) tally[k] = { en: 0, zh: 0 };
const bad = [];
let occurrences = 0;

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); }
  catch (e) { die('cannot read ' + rel(f) + ': ' + e.message); }
  const isZh = /\.zh-tw\.md$/.test(f);
  const lines = prose(src);

  lines.forEach((line, i) => {
    // CHECK 2a — the eleven, counted.
    let m;
    KW_RE.lastIndex = 0;
    while ((m = KW_RE.exec(line))) { tally[m[1]][isZh ? 'zh' : 'en']++; occurrences++; }

    // CHECK 2b — an all-caps modal construction that is not one of the eleven.
    HEAD_RE.lastIndex = 0;
    while ((m = HEAD_RE.exec(line))) {
      const whole = m[1] + ' ' + m[2];
      if (KEYWORDS.includes(whole)) continue;
      // `MUST` / `SHOULD` / `MAY` followed by an unrelated all-caps token —
      // an acronym, a heading word, a shouted noun — is not a construction:
      // only a modal-shaped continuation is.
      if (!/^(NEVER|ALWAYS|SOMETIMES|NOT|ONLY|EVER|RARELY|OFTEN)$/.test(m[2])) continue;
      bad.push({ file: rel(f), line: i + 1, text: whole, ctx: line.trim().slice(0, 100) });
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
  return lines.slice(start, end).join('\n');
}

const DECL = [
  { file: 'spec/core.md',       caveat: /all capitals/i },
];
const declFindings = [];
for (const d of DECL) {
  const sec = sectionOf(d.file, /^###\s*0\.1[.\s]/, /^##\s/);
  if (!sec) {
    declFindings.push(d.file + ' — no §0.1 heading. NORMATIVE-KEYWORD-DECLARATION placed the BCP 14 ' +
      'declaration there, ABOVE §13, so that its scope is the document and ' +
      'not one section of it.');
    continue;
  }
  if (!/rfc2119|RFC 2119/i.test(sec) || !/rfc8174|RFC 8174/i.test(sec))
    declFindings.push(d.file + ' §0.1 — does not cite BOTH RFC 2119 and RFC 8174. ' +
      'BCP 14 is the two of them; citing one is the 1997 phrase NORMATIVE-KEYWORD-DECLARATION declined.');
  if (!d.caveat.test(sec))
    declFindings.push(d.file + ' §0.1 — no capitalization caveat. RFC 8174 §2 is ' +
      'entirely about it, and it is what gives the lowercase modals a stated status.');
}

// -------------------------------------------- CHECK 3 — the pointer sentence
const POINTERS = [
  'spec/host-profile.md',
  'spec/figdown-manifest.md',
  'spec/figdown-a11y.md',
];
const ptrFindings = [];
for (const f of POINTERS) {
  let src;
  try { src = fs.readFileSync(path.join(ROOT, f), 'utf8'); }
  catch (e) { die('cannot read ' + f + ': ' + e.message); }
  if (!/BCP 14/.test(src) || !/§0\.1/.test(src))
    ptrFindings.push(f + ' — a document with its own status block must cite BCP 14 ' +
      'and name core §0.1. A reader arriving here cannot be assumed to know the ' +
      'declaration exists.');
}

// ------------------------------------------------------------- the report
console.log('=== BCP 14 DENOMINATOR — spec/**/*.md, prose only ===');
let en = 0, zh = 0;
for (const k of KEYWORDS) {
  en += tally[k].en; zh += tally[k].zh;
  if (VERBOSE || tally[k].en || tally[k].zh)
    console.log('  ' + k.padEnd(16) + String(tally[k].en).padStart(4) + ' en  ' +
                String(tally[k].zh).padStart(4) + ' zh-tw');
}
console.log('  ' + 'total'.padEnd(16) + String(en).padStart(4) + ' en  ' +
            String(zh).padStart(4) + ' zh-tw   (' + (en + zh) + ' across ' +
            files.length + ' file(s))');
// The §0.1 boilerplate names all eleven, so every keyword scores at least
// one occurrence per language whatever the corpus does. A keyword sitting at
// that floor is used NOWHERE but the declaration — which was true of SHALL,
// SHALL NOT, RECOMMENDED and NOT RECOMMENDED when NORMATIVE-KEYWORD-DECLARATION landed, and is the
// signal this line exists to keep visible. It is reported, never asserted:
// the boilerplate is a fixed sentence and declaring an unused word is free.
console.log('  at the declaration floor (used nowhere but core §0.1): ' +
  (KEYWORDS.filter(k => tally[k].en <= 1 && tally[k].zh <= 1).join(', ') || '(none)'));

if (occurrences === 0)
  die('the scan found ZERO BCP 14 keywords across spec/. A keyword gate that ' +
      'finds no keywords has not passed — it has failed to run. Refusing to ' +
      'report success for work not done.');

if (declFindings.length) {
  console.log('\nCHECK 1 — THE DECLARATION:');
  for (const m of declFindings) console.log('  ' + m);
  fail += declFindings.length;
} else console.log('\nCHECK 1 — the declaration: ok (core §0.1)');

if (bad.length) {
  console.log('\nCHECK 2 — NON-BCP-14 ALL-CAPS MODAL CONSTRUCTIONS:');
  for (const b of bad)
    console.log('  ' + b.file + ':' + b.line + '  "' + b.text + '"  — ' + b.ctx);
  console.log('\n  BCP 14 defines eleven spellings and this is not one of them, so');
  console.log('  core §0.1 does not say what it means. Write the BCP 14 form: an');
  console.log('  absolute prohibition is MUST NOT, and "never" is carried by the');
  console.log('  scope clause beside it, not by the keyword.');
  fail += bad.length;
} else console.log('CHECK 2 — every all-caps modal construction is one of the eleven: ok');

if (ptrFindings.length) {
  console.log('\nCHECK 3 — THE POINTER SENTENCE:');
  for (const m of ptrFindings) console.log('  ' + m);
  fail += ptrFindings.length;
} else console.log('CHECK 3 — every status-block document points at core §0.1: ok');

console.log('\n  NOT CHECKED, deliberately: whether an occurrence is a genuine');
console.log('  requirement; which party it binds; whether a lowercase modal should');
console.log('  have been uppercase; and the use-vs-mention split. Those are');
console.log('  judgements, and the NORMATIVE-KEYWORD-DECLARATION audit is where a reader makes them.');

console.log('');
if (fail) {
  console.log('FAIL  ' + fail + ' finding(s)');
  process.exit(1);
}
console.log('OK  BCP 14 declared in core §0.1, ' + (en + zh) +
            ' keyword occurrence(s) all of the eleven, ' + POINTERS.length +
            ' pointer sentence(s) present');
