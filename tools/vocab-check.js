#!/usr/bin/env node
// vocab-check.js — gate:vocab. spec/vocabulary-sources.tsv is the
// machine-readable half of spec/syntax-style.md and, since GRAMMAR-LAYERING-MODEL, the carrier
// of the SCOPE×STAGE grammar-layering classification (core §1.1). Nothing
// checked it: `id=` was registered in core §10 at CONNECTOR-IDENTITY-KEY and
// never gained a row here, silently, for four months, until the ADV-6
// landing's audit found the gap by hand. VOCABULARY-SOURCE-ATTRIBUTION files the fix and this gate,
// together, on the ruling that a carrier nothing validates is how a registry
// drifts — the `id=` omission is the recorded evidence, not a hypothetical.
//
// WHAT IS ASSERTED, on every run:
//
//   A. SHAPE. Every non-comment, non-header row has exactly as many columns
//      as the header declares; no cell is the empty string; no cell has
//      leading/trailing whitespace (a sign of tab damage — a cell boundary
//      that landed one character off).
//   B. VOCABULARY. `layer` (column 10) is one of core|core-layout|genre|
//      profile; `stage` (column 11) is one of grammar|context|resolution|
//      semantic|rendering (core §1.1, GRAMMAR-LAYERING-MODEL). Anything else fails, naming the
//      row and the bad value.
//   C. TWO-WAY AGREEMENT WITH core.md §10, for OPTION KEYS. Every option key
//      registered in §10's Key/Value/Accepted-by/Status table has exactly one
//      base-key row here (kind=option, `<key>` or `<key>.<directive>`), and
//      every option row here names a key §10 registers. A key present on one
//      side and missing on the other FAILS, naming the key and the
//      direction. This is the check that would have caught `id=`.
//   D. TWO-WAY AGREEMENT WITH core.md §10, for KEYWORDS — LIVE SPELLINGS
//      ONLY. §10 states its keyword registry across eight small tables
//      (universal core, the layout namespace, the scene bucket, flowchart's
//      own three, the per-genre node/connector five, sequence's own two, the
//      three nested-genre openers with their six children, and `chart`) and
//      one sentence reserving three dynamic-profile words. There is no
//      single table naming every RETIRED keyword the way the option-key
//      table does — retired keywords are documented in prose scattered
//      across §9/§10/§13 — so retired-keyword agreement is **NOT CHECKED**
//      here; that is a genuine reliability limit of the source, stated
//      rather than papered over, per this gate's own charter.
//   E. GENRE AGREEMENT, TWO-WAY, WITH core.md §11's ABNF `genre` production
//      AND WITH §10's CURRENT genre-status table (GENRE-STATUS-RECORD). §10 also keeps a
//      historical v0.1 "Genre status" table (six genres, explicitly labelled
//      as the v0.1 record) — this gate does NOT check against that one, on
//      purpose: it is a snapshot, not a claim about today, and GENRE-STATUS-RECORD gave it
//      a companion "current" table specifically so a genre would have
//      somewhere authoritative to land. A genre present on one side of
//      either two-way comparison (tsv enum vs §11 ABNF; §10 current table
//      vs §11 ABNF) and missing from the other FAILS, naming the genre and
//      the direction. Before GENRE-STATUS-RECORD the current-table half of this was a
//      printed note, not a gate — the note said the table was stale and
//      moved on. It is not a note anymore.
//   F. COUNTS. The tsv's own option-key header comment states a row count
//      and a distinct-key count; both are re-derived from the rows and must
//      agree. Two INDEPENDENT core.md statements of the same total — the
//      "NN NORMATIVE and N EXPERIMENTAL, NN in all" sentence and the namespace table's
//      own Count column summed — must also agree with the measured count.
//      This is the arithmetic that was wrong (45 vs 46) landing under a
//      machine check for the first time.
//
// WHAT THIS GATE MUST NOT PRETEND TO CHECK, and does not
// --------------------------------------------------------
// It does NOT verify that a `source`/`source_spelling`/`conflicts` claim is
// true — that a cited standard really says what a row quotes it as saying.
// That is `gate:standards` / `spec/standards-claims.tsv`'s job, over the
// citations that carry a claim ID, and this file's citations mostly do not.
// It does NOT judge a `layer` or `stage` VALUE for correctness beyond
// vocabulary membership — whether `id`'s row really belongs in `genre`
// rather than some other layer is the kind of provenance and layering
// JUDGEMENT GRAMMAR-LAYERING-MODEL assigned to a reader, not to a regex. It does NOT check
// retired-keyword agreement (§D above) or POSITIONAL/MARK two-way agreement
// with core.md at all — core.md has no single positional or mark registry
// table the way it has one for option keys, so nothing here claims to
// verify those two kinds against it. It does NOT check that `exception_reason`
// is empty exactly where the header says it should be, or that every citied
// `R<n>` resolves (that is `gate:cite`'s job).
//
// Each of those is either another gate's job or a judgement this tool cannot
// make honestly. A gate that claimed one would be a gate saying a thing it
// cannot know.
//
// usage: node tools/vocab-check.js [--strict] [--verbose]
//   --strict   exit 1 on any failure (CI mode; this is what `npm test` runs)
//   --verbose  print the full measured key/keyword sets
// Exit codes: 0 clean · 1 a finding · 2 tool error (a source could not be
//             parsed, or a section this gate depends on has moved).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TSV_PATH = path.join(ROOT, 'spec', 'vocabulary-sources.tsv');
const CORE_PATH = path.join(ROOT, 'spec', 'core.md');
const TSV_REL = 'spec/vocabulary-sources.tsv';
const CORE_REL = 'spec/core.md';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');

function die(msg) {
  console.error('vocab-check: TOOL ERROR — ' + msg);
  process.exit(2);
}

let failures = 0;
const findings = [];
function fail(msg) { failures++; findings.push(msg); }

// ── load the two sources ────────────────────────────────────────────────────
let tsvRaw, coreRaw;
try { tsvRaw = fs.readFileSync(TSV_PATH, 'utf8'); }
catch (e) { die('cannot read ' + TSV_REL + ': ' + e.message); }
try { coreRaw = fs.readFileSync(CORE_PATH, 'utf8'); }
catch (e) { die('cannot read ' + CORE_REL + ': ' + e.message); }
const coreLines = coreRaw.split('\n');

// ── TSV parsing ──────────────────────────────────────────────────────────────
const COLUMNS = ['key', 'kind', 'source', 'source_spelling', 'shape',
  'accepted_syntax', 'status', 'conflicts', 'exception_reason', 'layer', 'stage'];

const allLines = tsvRaw.split('\n');
let headerIdx = -1;
const dataRows = []; // { line, cells, cols }
for (let i = 0; i < allLines.length; i++) {
  const raw = allLines[i];
  if (raw.trim() === '' || raw.startsWith('#')) continue;
  const cells = raw.split('\t');
  if (headerIdx < 0) {
    headerIdx = i;
    if (cells.join('\t') !== COLUMNS.join('\t'))
      die(TSV_REL + ':' + (i + 1) + ' — header row does not match the expected ' +
          COLUMNS.length + ' columns (' + COLUMNS.join(', ') + '). The carrier moved ' +
          'its own shape; this gate needs updating before it can check anything.');
    continue;
  }
  dataRows.push({ line: i + 1, raw, cells });
}
if (headerIdx < 0) die(TSV_REL + ' — no header row found (every non-comment line was blank?)');
if (!dataRows.length) die(TSV_REL + ' — the header was found but zero data rows follow it');

// ── A. SHAPE ─────────────────────────────────────────────────────────────────
for (const row of dataRows) {
  const { line, cells } = row;
  if (cells.length !== COLUMNS.length) {
    fail(TSV_REL + ':' + line + ' — ' + cells.length + ' column(s), header declares ' +
      COLUMNS.length + ' (' + JSON.stringify(row.raw.slice(0, 60)) + '…)');
    continue; // a malformed row cannot be cell-checked further
  }
  cells.forEach((c, i) => {
    if (c.length === 0)
      fail(TSV_REL + ':' + line + ' — column "' + COLUMNS[i] + '" is empty (use "-" for ' +
        'none, per the header\'s own convention)');
    else if (c !== c.trim())
      fail(TSV_REL + ':' + line + ' — column "' + COLUMNS[i] + '" has leading/trailing ' +
        'whitespace: ' + JSON.stringify(c.slice(0, 40)));
  });
}
const shapeOK = failures;
console.log(shapeOK === 0
  ? 'CHECK A (shape) — ' + dataRows.length + ' row(s), all ' + COLUMNS.length + ' columns, no empty/stray-whitespace cells: ok'
  : 'CHECK A (shape) — ' + shapeOK + ' finding(s), see below');

// ── well-formed rows only, from here on ─────────────────────────────────────
const rows = dataRows.filter(r => r.cells.length === COLUMNS.length);
const col = {};
COLUMNS.forEach((name, i) => { col[name] = i; });

// ── B. VOCABULARY — layer / stage enums ─────────────────────────────────────
const LAYERS = new Set(['core', 'core-layout', 'genre', 'profile']);
const STAGES = new Set(['grammar', 'context', 'resolution', 'semantic', 'rendering']);
let vocabFail = 0;
for (const row of rows) {
  const layer = row.cells[col.layer];
  const stage = row.cells[col.stage];
  if (!LAYERS.has(layer)) {
    fail(TSV_REL + ':' + row.line + ' — layer "' + layer + '" is not one of ' +
      '{' + [...LAYERS].join(', ') + '}');
    vocabFail++;
  }
  if (!STAGES.has(stage)) {
    fail(TSV_REL + ':' + row.line + ' — stage "' + stage + '" is not one of ' +
      '{' + [...STAGES].join(', ') + '}');
    vocabFail++;
  }
}
console.log(vocabFail === 0
  ? 'CHECK B (vocabulary) — layer/stage on ' + rows.length + ' row(s), all in the declared sets: ok'
  : 'CHECK B (vocabulary) — ' + vocabFail + ' finding(s), see below');

// ── markdown-table helpers over core.md, respecting backtick code spans ────
// A `|` inside a backtick span (e.g. `` `\|` `` in the table-row-token cell)
// is literal content, not a column separator — a naive split breaks on it.
function splitRow(line) {
  const cells = [];
  let cur = '';
  let inCode = false;
  for (const c of line) {
    if (c === '`') { inCode = !inCode; cur += c; continue; }
    if (c === '|' && !inCode) { cells.push(cur); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur);
  return cells;
}
function tableAt(headerRe, fromLine) {
  const from = fromLine || 0;
  const start = coreLines.findIndex((l, i) => i >= from && headerRe.test(l));
  if (start < 0) return null;
  const out = [];
  let i = start + 1;
  if (/^\|[\s-]*\|/.test(coreLines[i] || '')) i++; // separator row
  for (; i < coreLines.length; i++) {
    const l = coreLines[i];
    if (!l.startsWith('|')) break;
    out.push(splitRow(l));
  }
  return { startLine: start + 1, rows: out };
}
function backtickTokens(cell) {
  if (!cell) return [];
  return [...cell.matchAll(/`([^`]+)`/g)].map(m => m[1]);
}

// ── C. TWO-WAY OPTION-KEY AGREEMENT WITH core.md §10 ────────────────────────
const OPT_TABLE_RE = /^\| Key \| Value \| Accepted by \| Status \|/;
const optTable = tableAt(OPT_TABLE_RE, 3600);
if (!optTable)
  die(CORE_REL + ' — the option-key registry table ("| Key | Value | Accepted by | ' +
    'Status |") was not found. §10 moved; this gate cannot check option keys until it ' +
    'is updated to find the new location.');

const coreOptKeys = new Set();
let coreOptRegistrations = 0;
for (const cells of optTable.rows) {
  coreOptRegistrations++;
  const toks = backtickTokens(cells[1]);
  if (!toks.length) {
    die(CORE_REL + ' near line ' + optTable.startLine + ' — an option-key registry row ' +
      'has no backtick-quoted key in its Key cell: ' + JSON.stringify(cells[1]).slice(0, 80));
  }
  coreOptKeys.add(toks[0]); // the row's own key is always the FIRST backtick token
}

const tsvOptKeys = new Set();
let tsvOptRows = 0;
for (const row of rows) {
  if (row.cells[col.kind] !== 'option') continue;
  tsvOptRows++;
  const base = row.cells[col.key].split('.')[0];
  tsvOptKeys.add(base);
}

const missingFromTsv = [...coreOptKeys].filter(k => !tsvOptKeys.has(k)).sort();
const missingFromCore = [...tsvOptKeys].filter(k => !coreOptKeys.has(k)).sort();
for (const k of missingFromTsv)
  fail('option key `' + k + '` is registered in ' + CORE_REL + ' §10 but has no row in ' +
    TSV_REL + ' (kind=option)');
for (const k of missingFromCore)
  fail('option key `' + k + '` has a row in ' + TSV_REL + ' (kind=option) but is not ' +
    'registered in ' + CORE_REL + ' §10\'s option-key table');
console.log('CHECK C (option keys, two-way) — core §10: ' + coreOptKeys.size + ' distinct key(s) ' +
  'in ' + coreOptRegistrations + ' registration(s); ' + TSV_REL + ': ' + tsvOptKeys.size +
  ' distinct base key(s) in ' + tsvOptRows + ' row(s)' +
  (missingFromTsv.length || missingFromCore.length ? ' — DISAGREE' : ': agree'));

// ── D. KEYWORD AGREEMENT, LIVE SPELLINGS ONLY ───────────────────────────────
// §10's eight small keyword tables. Retired keywords are documented in prose,
// not in one comprehensive table the way the option-key registry is one — so
// this check is deliberately partial, and says so (see the header comment).
// The `from` bounds exist only to DISAMBIGUATE: four of the eight tables share
// a header line with another table, so a bare regex would always match the
// first one. They are therefore anchored to the §10 HEADING and not to
// absolute file positions (CONFORMANCE-CLASS-LIST): before that they were absolute line numbers,
// and adding core §0.2 — 151 lines, all of them above §10 — silently pointed
// four of the eight bounds past the table they were meant to select, so this
// check reported six live keywords as missing from tables that had not moved
// at all. An anchor that a paragraph elsewhere in the file can break is an
// anchor that will break; these offsets now move with §10 itself, and a
// missing §10 heading is a TOOL ERROR rather than a silent miss.
const S10 = coreLines.findIndex(l => /^##\s*10\./.test(l));
if (S10 < 0) {
  console.error('vocab-check: TOOL ERROR — no "## 10." heading in ' + CORE_REL +
    '; CHECK D anchors its eight keyword tables to it and cannot run without it.');
  process.exit(2);
}
const KEYWORD_TABLES = [
  { name: '(a) universal core',                 re: /^\| Keyword \| Status \| Role \|/,                                     cells: [1], from: S10 - 42 },
  { name: "(a') layout namespace",              re: /^\| Keyword \| Status \| Role \|/,                                     cells: [1], from: S10 + 58 },
  { name: '(b) scene bucket',                   re: /^\| Status \| Keywords \| Count \| Declared by \|/,                    cells: [2], from: S10 + 103 },
  { name: "(b'') flowchart's own namespace",    re: /^\| Status \| Keywords \| Count \|/,                                   cells: [2], from: S10 + 136 },
  { name: "(b''') per-genre node/connector",    re: /^\| Status \| Keyword \| Genre \| Replaces \|/,                        cells: [2], from: S10 + 152 },
  { name: "(b'''') sequence's own subject",     re: /^\| Status \| Keywords \| Count \| Declared by \|/,                    cells: [2], from: S10 + 183 },
  { name: '(c) nested-genre namespaces',        re: /^\| Genre \| Status \| Opener \(top level\) \| Children \(region only\) \|/, cells: [3, 4], from: S10 + 249 },
  { name: "(c') chart",                         re: /^\| Keyword \| Status \| Role \|/,                                     cells: [1], from: S10 + 260 },
];
const coreKeywords = new Set();
let keywordTablesOK = true;
for (const spec of KEYWORD_TABLES) {
  const t = tableAt(spec.re, spec.from);
  if (!t) {
    fail(CORE_REL + ' — keyword table ' + spec.name + ' not found (was looking for ' +
      spec.re + ' at/after line ' + (spec.from + 1) + '); the keyword two-way check is ' +
      'INCOMPLETE this run because a table this gate depends on moved');
    keywordTablesOK = false;
    continue;
  }
  for (const cells of t.rows) {
    for (const ci of spec.cells) {
      for (let tok of backtickTokens(cells[ci])) {
        if (tok === '\\|' || tok === '|') tok = 'pipe'; // the row-start token, spelled `pipe` in the tsv
        coreKeywords.add(tok);
      }
    }
  }
}
// the three reserved dynamic-profile words are prose-only (no table row) —
// verified as a literal sentence rather than silently ignored.
const RESERVED = ['page', 'set', 'pulse'];
const reservedSentence = coreRaw.includes('Reserved for the dynamic profile: `page set pulse`');
if (!reservedSentence)
  fail(CORE_REL + ' — the "Reserved for the dynamic profile: `page set pulse`" sentence ' +
    'was not found verbatim; the reserved-word exemption in this check rests on it existing');

const tsvKeywordsLive = new Set();
let tsvKeywordRowsLive = 0;
for (const row of rows) {
  if (row.cells[col.kind] !== 'keyword') continue;
  if (row.cells[col.status] === 'retired') continue; // §D scope: LIVE only
  const base = row.cells[col.key].split('.')[0];
  if (RESERVED.includes(base)) continue; // checked separately, above
  tsvKeywordRowsLive++;
  tsvKeywordsLive.add(base);
}

if (keywordTablesOK) {
  const missingFromTsvKw = [...coreKeywords].filter(k => !tsvKeywordsLive.has(k)).sort();
  const missingFromCoreKw = [...tsvKeywordsLive].filter(k => !coreKeywords.has(k)).sort();
  for (const k of missingFromTsvKw)
    fail('keyword `' + k + '` is declared live in ' + CORE_REL + ' §10\'s keyword tables but ' +
      'has no LIVE row in ' + TSV_REL + ' (kind=keyword)');
  for (const k of missingFromCoreKw)
    fail('keyword `' + k + '` has a LIVE row in ' + TSV_REL + ' (kind=keyword) but is not in ' +
      'any of ' + CORE_REL + ' §10\'s eight keyword tables');
  console.log('CHECK D (keywords, two-way, LIVE ONLY) — core §10 tables: ' + coreKeywords.size +
    ' live spelling(s); ' + TSV_REL + ': ' + tsvKeywordsLive.size + ' live keyword row(s)' +
    (missingFromTsvKw.length || missingFromCoreKw.length ? ' — DISAGREE' : ': agree') +
    '. RETIRED keywords are NOT cross-checked (no single core.md table lists them all).');
} else {
  console.log('CHECK D (keywords, two-way) — SKIPPED: a dependency table moved, see finding(s) above');
}

// ── E. GENRE AGREEMENT — core §11 ABNF is ground truth, checked two-way ────
// against BOTH the tsv's figdown.genre enum AND §10's CURRENT genre-status
// table (GENRE-STATUS-RECORD). §10's historical v0.1 table is deliberately not consulted
// here — it is a labelled snapshot, not a source of truth for today.
const genreAbnfStart = coreLines.findIndex(l => /^genre\s*=/.test(l));
if (genreAbnfStart < 0)
  die(CORE_REL + ' — the ABNF `genre =` production was not found in §11. This gate\'s genre ' +
    'check has no ground truth without it.');
let genreBlock = [];
for (let i = genreAbnfStart; i < coreLines.length; i++) {
  const l = coreLines[i];
  if (i > genreAbnfStart && /^[a-z][a-z-]*\s*=/.test(l)) break;
  genreBlock.push(l);
}
const coreGenres = new Set();
for (const l of genreBlock) {
  const code = l.replace(/;.*$/, '');
  for (const m of code.matchAll(/"([a-z]+)"/g)) coreGenres.add(m[1]);
}

// E1 — core §10's CURRENT genre-status table (GENRE-STATUS-RECORD), two-way vs the ABNF.
// This is the retargeted half: before GENRE-STATUS-RECORD this printed a note about the
// (then only) genre-status table being stale and did not gate on it. Now
// there is a table meant to be kept current, and a genre missing from
// either side of this comparison FAILS instead of being merely reported.
const genreCurrentTableStart = coreLines.findIndex(l => /^\| Genre \| Status \| Since \| Minimum/.test(l));
if (genreCurrentTableStart < 0) {
  fail(CORE_REL + ' — the CURRENT "| Genre | Status | Since | Minimum `figdown` |" table ' +
    '(GENRE-STATUS-RECORD) was not found in §10; CHECK E has no current-table ground truth to check');
} else {
  const ct = tableAt(/^\| Genre \| Status \| Since \| Minimum/, genreCurrentTableStart);
  const currentGenres = new Set();
  for (const cells of ct.rows) for (const tok of backtickTokens(cells[1])) currentGenres.add(tok);
  const missingFromCurrentG = [...coreGenres].filter(g => !currentGenres.has(g)).sort();
  const missingFromAbnfG = [...currentGenres].filter(g => !coreGenres.has(g)).sort();
  for (const g of missingFromCurrentG)
    fail('genre `' + g + '` is in core §11\'s ABNF genre production but missing from ' +
      CORE_REL + ' §10\'s CURRENT genre-status table (line ' + (genreCurrentTableStart + 1) + ')');
  for (const g of missingFromAbnfG)
    fail('genre `' + g + '` is in ' + CORE_REL + ' §10\'s CURRENT genre-status table (line ' +
      (genreCurrentTableStart + 1) + ') but missing from core §11\'s ABNF genre production');
  console.log('CHECK E1 (genres, two-way, vs core §10 CURRENT table, GENRE-STATUS-RECORD) — abnf: ' +
    coreGenres.size + ' genre(s); current table: ' + currentGenres.size + ' genre(s)' +
    (missingFromCurrentG.length || missingFromAbnfG.length ? ' — DISAGREE' : ': agree'));
}

const genreRow = rows.find(r => r.cells[col.key] === 'figdown.genre' && r.cells[col.kind] === 'positional');
if (!genreRow) {
  fail(TSV_REL + ' — no figdown.genre positional row found; cannot check the genre enum');
} else {
  const enumMatch = genreRow.cells[col.accepted_syntax].match(/^([a-z|]+),/);
  if (!enumMatch) {
    fail(TSV_REL + ':' + genreRow.line + ' — figdown.genre\'s accepted_syntax does not open ' +
      'with a "|"-delimited enum followed by a comma; cannot extract the genre list');
  } else {
    const tsvGenres = new Set(enumMatch[1].split('|'));
    const missingFromTsvG = [...coreGenres].filter(g => !tsvGenres.has(g)).sort();
    const missingFromCoreG = [...tsvGenres].filter(g => !coreGenres.has(g)).sort();
    for (const g of missingFromTsvG)
      fail('genre `' + g + '` is in core §11\'s ABNF genre production but missing from ' +
        TSV_REL + '\'s figdown.genre enum');
    for (const g of missingFromCoreG)
      fail('genre `' + g + '` is in ' + TSV_REL + '\'s figdown.genre enum but missing from ' +
        'core §11\'s ABNF genre production');
    console.log('CHECK E2 (genres, two-way, vs core §11 ABNF) — core: ' + coreGenres.size +
      ' genre(s); tsv: ' + tsvGenres.size + ' genre(s)' +
      (missingFromTsvG.length || missingFromCoreG.length ? ' — DISAGREE' : ': agree'));
  }
}

// ── F. COUNTS ────────────────────────────────────────────────────────────────
// F1 — the tsv's own option-key header comment states a row count and a
// distinct-key count; both must match what the rows actually contain.
const optHeaderComment = allLines.find(l => l.startsWith('# ') && / option keys \(/.test(l));
if (!optHeaderComment) {
  fail(TSV_REL + ' — the option-key section\'s header comment was not found; cannot cross-' +
    'check its stated counts');
} else {
  const m = optHeaderComment.match(/\((\d+) rows here for (\d+) distinct spellings/);
  if (!m) {
    fail(TSV_REL + ' — the option-key header comment does not state "NN rows here for NN ' +
      'distinct spellings" in the expected form; cannot cross-check it');
  } else {
    const [, statedRows, statedDistinct] = m.map(Number);
    if (statedRows !== tsvOptRows)
      fail(TSV_REL + ' — the option-key header comment claims ' + statedRows + ' rows; the ' +
        'file actually has ' + tsvOptRows);
    if (statedDistinct !== tsvOptKeys.size)
      fail(TSV_REL + ' — the option-key header comment claims ' + statedDistinct + ' distinct ' +
        'spellings; the file actually has ' + tsvOptKeys.size);
    console.log('CHECK F1 (tsv header count) — claims ' + statedRows + ' rows / ' +
      statedDistinct + ' distinct; measured ' + tsvOptRows + ' / ' + tsvOptKeys.size +
      (statedRows === tsvOptRows && statedDistinct === tsvOptKeys.size ? ': agree' : ' — DISAGREE'));
  }
}

// F2 — core.md's OWN current total statement ("NN NORMATIVE and N EXPERIMENTAL, NN in all") for
// option keys, taken from the UNQUOTED occurrence only — the section also
// quotes three earlier, now-corrected totals as its own history, each
// wrapped in literal double quotes, which must be excluded or this check
// would flag core.md's own historical record as a live disagreement.
const optSecStart = coreRaw.indexOf('**Option-key registry (v0.1).**');
const optSecEnd = coreRaw.indexOf('| Key | Value | Accepted by | Status |');
if (optSecStart < 0 || optSecEnd < 0 || optSecEnd < optSecStart) {
  fail(CORE_REL + ' — could not isolate the option-key registry prose section between its ' +
    'heading and its table; cannot cross-check its stated total');
} else {
  const flat = coreRaw.slice(optSecStart, optSecEnd).replace(/\n/g, ' ');
  const totalRe = /(")?\*{0,2}(\d+)\s*NORMATIVE and (\d+)\s*EXPERIMENTAL\*{0,2},\s*(\d+) in all/g;
  const live = [...flat.matchAll(totalRe)].filter(m => !m[1]);
  if (live.length !== 1) {
    fail(CORE_REL + ' — expected exactly one UNQUOTED "NN NORMATIVE and N EXPERIMENTAL, NN in all" ' +
      'statement in the option-key registry prose (the current total; earlier ones are ' +
      'quoted as history), found ' + live.length + '. Cannot cross-check the total reliably.');
  } else {
    const [, , normative, experimental, total] = live[0].map(x => x === undefined ? x : Number(x) || x);
    const stated = Number(live[0][4]);
    if (stated !== tsvOptKeys.size)
      fail(CORE_REL + ' — the current option-key total statement says ' + stated + ' in all; ' +
        TSV_REL + ' has ' + tsvOptKeys.size + ' distinct option keys');
    console.log('CHECK F2 (core §10 stated total) — "' + Number(live[0][2]) + ' NORMATIVE and ' +
      Number(live[0][3]) + ' EXPERIMENTAL, ' + stated + ' in all" vs measured ' + tsvOptKeys.size +
      (stated === tsvOptKeys.size ? ': agree' : ' — DISAGREE'));
  }
}

// F3 — the namespace table's own Count column, summed, is a SECOND
// independent statement of the same total inside core.md.
const nsTable = tableAt(/^\| Namespace \| Keys \| Count \| Status \|/, 3600);
if (!nsTable) {
  fail(CORE_REL + ' — the "| Namespace | Keys | Count | Status |" table was not found; ' +
    'cannot cross-check its Count-column sum');
} else {
  let nsSum = 0;
  let nsBad = false;
  for (const cells of nsTable.rows) {
    const n = parseInt(cells[3], 10);
    if (Number.isNaN(n)) { nsBad = true; continue; }
    nsSum += n;
  }
  if (nsBad) fail(CORE_REL + ' — the namespace table has a Count cell that is not a plain integer');
  if (nsSum !== tsvOptKeys.size)
    fail(CORE_REL + ' — the namespace table\'s Count column sums to ' + nsSum + '; ' +
      TSV_REL + ' has ' + tsvOptKeys.size + ' distinct option keys');
  console.log('CHECK F3 (core §10 namespace-table sum) — sums to ' + nsSum + ' vs measured ' +
    tsvOptKeys.size + (nsSum === tsvOptKeys.size ? ': agree' : ' — DISAGREE'));
}

// ── verbose dump ─────────────────────────────────────────────────────────────
if (verbose) {
  console.log('\n--- verbose: option keys ---');
  console.log('core §10:', [...coreOptKeys].sort().join(', '));
  console.log('tsv     :', [...tsvOptKeys].sort().join(', '));
  console.log('\n--- verbose: live keywords ---');
  console.log('core §10:', [...coreKeywords].sort().join(', '));
  console.log('tsv     :', [...tsvKeywordsLive].sort().join(', '));
}

// ── report ───────────────────────────────────────────────────────────────────
console.log('');
console.log('NOT CHECKED, deliberately (see this file\'s header comment for why):');
console.log('  - whether a `source`/`source_spelling`/`conflicts` claim is factually true');
console.log('    (gate:standards / spec/standards-claims.tsv, for citations that carry a claim ID)');
console.log('  - whether a `layer` or `stage` VALUE is the CORRECT judgement for a given row,');
console.log('    beyond it being one of the declared vocabulary values');
console.log('  - retired-keyword two-way agreement (no single core.md table lists them all)');
console.log('  - positional and mark rows against any core.md registry (core.md has none to check against)');
console.log('  - whether every `R<n>` cited resolves to a real ledger entry (gate:cite\'s job)');

if (findings.length) {
  console.log('\nFINDINGS:');
  for (const f of findings) console.log('  - ' + f);
}

console.log('');
console.log('SUMMARY  ' + dataRows.length + ' data row(s) · ' + tsvOptKeys.size +
  ' distinct option key(s) · ' + tsvKeywordsLive.size + ' live keyword(s) · ' +
  (genreRow ? (rows.length ? new Set((genreRow.cells[col.accepted_syntax].match(/^([a-z|]+),/) || [,''])[1].split('|')).size : 0) : 0) +
  ' genre(s) · ' + failures + ' failure(s)');

if (failures && strict) process.exit(1);
if (failures) console.log('(not --strict: reporting only)');
else console.log('OK');
