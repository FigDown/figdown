#!/usr/bin/env node
/**
 * comment-check.js — the gate over `.fd` PROSE, which the engine never reads.
 *
 * Three rules, because the engine validates directives and nothing else: it
 * checks that a `class` line is well-formed and never looks at a single
 * character of what the comment above it or the string inside it actually
 * says.
 *
 *   Rule 1  no `.fd` COMMENT may teach a retired spelling.
 *   Rule 2  no `.fd` string that RENDERS may carry an internal reference.
 *   Rule 3  every published `.fd` opens with the SPEC PROVENANCE LINE.
 *
 * Rules 2 and 3 are documented at their own definitions below. Rule 1 follows.
 *
 * Rule 3 lives here rather than in a tool of its own for the reason this file
 * exists at all: it is a rule about `.fd` PROSE the engine never reads, over
 * exactly this tool's corpus (`examples/`, `figures/`). A nineteenth gate
 * would duplicate the walker, the engine load and the strict convention to
 * check one line.
 *
 * The engine validates directives, never comments, so a comment can go on
 * saying `boundary` or `text=` for three releases after the language stopped
 * accepting them and every gate still passes. The reference figures are read
 * by a human alongside the render, so a stale comment teaches the wrong
 * spelling with the authority of the standard's own example. That is the
 * defect class this tool closes.
 *
 * What is a defect and what is a legitimate historical note:
 *
 *   defect   a comment that USES a retired spelling as if it were current
 *            (`# text= colours the label`)
 *   allowed  a comment that NAMES a retired spelling as history
 *            (``# Spelled `guide` until this release``)
 *
 * The rule (see tools/README.md for the rationale): a retired spelling is
 * admitted when its CONTIGUOUS COMMENT BLOCK also carries a retirement
 * marker — a 0.1 version token or one of a small set of retirement
 * verbs (`renamed`, `retired`, `until`, `was`, `used to`, …). A bare
 * R-number is deliberately NOT a marker: `(EXTERNAL-EDGE-ENDPOINTS)` sits in a comment that was
 * a genuine defect, so accepting R-numbers would admit it.
 *
 * The retired vocabulary is DERIVED FROM THE ENGINE (editor/figdown.html):
 * `RETIRED_OPT_KEYS`, `RETIRED_SHAPES` and every `... has been renamed/
 * retired/DELETED` diagnostic. A retirement added to the engine is checked
 * here the same day, and if the engine's retirement tables move the tool
 * throws instead of quietly checking less (the LANE-ALPHABET-KEY-RESERVATION guard discipline).
 *
 * Usage:
 *   node tools/comment-check.js [--strict] [--verbose] [<file.fd | dir> ...]
 *
 *   default paths: examples/, figures/
 *   --strict   exit 1 on any defect
 *   --verbose  also print the admitted historical notes
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PATHS = ['examples', 'figures'];

const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(ROOT, 'editor', 'figdown.html'),
].filter(Boolean);

function loadEngine() {
  const p = ENGINE_CANDIDATES.find(f => fs.existsSync(f));
  if (!p) throw new Error('figdown.html not found (set FIGDOWN_HTML)');
  const h = fs.readFileSync(p, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + p);
  const src = h.slice(start, end);
  const api = new Function(src + '\nreturn {RETIRED_OPT_KEYS, RETIRED_SHAPES};')();
  api.src = src;
  api.path = p;
  return api;
}

// ── The retired vocabulary, read out of the engine ───────────────────────────
//
// Three sources, all inside the engine:
//   1. RETIRED_OPT_KEYS — the retired option KEYS (`text=`, `via=`, `w=`, …);
//   2. RETIRED_SHAPES   — the retired ENUM VALUES (`shape=cloud`);
//   3. every retirement DIAGNOSTIC string — `<x> has been renamed`,
//      `"<x>" has been renamed`, `<x> has been retired/DELETED/reverted/
//      WITHDRAWN` (`WITHDRAWN` joined, EDGE-GEOMETRY-CONSTRUCTS: a withdrawal names
//      no replacement, so it is the one retirement shape whose message cannot
//      say "use Y" — the verb had to be added here or `path` and `routing`
//      would have been invisible to this tool) —
//      which is how the retired KEYWORDS (`boundary`, `wrap`, `guide`,
//      `layer`, `plot`, `line`, `fill`, `route`, `render`) and the retired
//      positional flag (`conditional`) are spelled in the parser.
//      `reverted` joined the verb list (PRESENCE-FLAG-SPELLING), the first time
//      a retirement was the UNDOING of an earlier rename rather than a new
//      one; without it the retired spelling would have been invisible here.
function retiredVocab(engine) {
  const optKeys = Object.keys(engine.RETIRED_OPT_KEYS);
  const enumVals = Object.keys(engine.RETIRED_SHAPES).map(v => 'shape=' + v);
  const keywords = new Set();
  const RE_BARE = /(?:^|[^\w-])([a-z][\w-]*) has been (?:renamed|retired|DELETED|reverted|WITHDRAWN)/g;
  const RE_QUOTED = /"([a-z][\w-]*)" has been (?:renamed|retired|DELETED|reverted|WITHDRAWN)/g;
  for (const re of [RE_BARE, RE_QUOTED]) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(engine.src))) keywords.add(m[1]);
  }
  // `shape=cloud has been retired` lands `cloud` here too; it is an enum
  // value, not a keyword, and is checked as one.
  for (const v of Object.keys(engine.RETIRED_SHAPES)) keywords.delete(v);
  // `layer` is the one spelling retired in BOTH namespaces (the keyword became
  // `plane`, the option key became `plane=`), so it stays in both lists: the
  // `key=` probe catches `layer=` and the keyword probe catches a bare `layer`.

  if (optKeys.length < 8 || !enumVals.length || keywords.size < 6)
    throw new Error('engine drift: read only ' + optKeys.length +
      ' retired option keys, ' + enumVals.length + ' retired enum values and ' +
      keywords.size + ' retired keywords out of ' +
      path.relative(ROOT, engine.path) + ' — update this tool');
  return { optKeys, enumVals, keywords: [...keywords].sort() };
}

// Retired spellings that are ALSO ordinary English, so a bare word is not
// evidence of anything. These are checked in a CODE CONTEXT only — inside
// backticks, or written as `key=` / `shape=value`. Every other retired
// spelling is checked as a bare word too, so a retirement added to the
// engine tomorrow lands in the strict tier by default (fail-closed).
// Each entry is asserted to still BE a retired spelling, so this opt-out
// cannot rot either.
const ENGLISH_AMBIGUOUS = {
  line:     'a source line number, and "line" in ordinary prose',
  fill:     'the live option key fill=, and the verb',
  route:    'a routing-table entry — a domain noun in these figures',
  render:   'the verb, and the renderer this repo talks about constantly',
  // 0.1 (PRESENCE-FLAG-SPELLING) made `optional` live again and `conditional` retired;
  // 0.1 (PRESENCE-CONDITION-EXPRESSION) retired BOTH, so both entries are here now. Each is
  // English-ambiguous: "conditional" appears in ordinary prose about
  // conditionally-present fields and in `conditional values` (BITFIELD-CONDITIONAL-OFFSETS), and
  // "optional" is one of the commonest words in a spec (RFC 2119's OPTIONAL,
  // "an optional label", "optional attributes" in §12.3).
  conditional: 'ordinary English, and how BITFIELD-CONDITIONAL-OFFSETS describes per-case offsets',
  optional: 'ordinary English, RFC 2119\'s OPTIONAL, and "an optional attribute" throughout §12.3',
  // 0.1 (DESCRIPTION-KEY-SPELLING): the option key `note=` was renamed `description=`.
  // The bare word is ordinary English AND the name of the v0.2 annotation
  // keyword this project talks about constantly (ANNOTATION-LOCATOR-SPLIT).
  note: 'ordinary English, and the name of the v0.2 annotation construct (ANNOTATION-LOCATOR-SPLIT)',
  // 0.1 (TIMING-GENRE-NAMING): the genre `wave` became `timing`. The bare word is
  // ordinary English and is the root of "waveform" and "WaveDrom", which the
  // timing genre's own documentation cites on nearly every line.
  wave: 'ordinary English, and the root of "waveform"/"WaveDrom"',
  // 0.1 (ELEMENT-GEOMETRY-DIRECTIVE): the keyword `size` was retired and its keys moved onto
  // `pin`. The bare word is ordinary English and unavoidable in a figure's
  // comments — "a fixed-size slot group", "equal size is what carries
  // peerhood" — none of which teaches a directive. A backticked `size` still
  // fails, and that is the spelling a stale comment would use.
  size: 'ordinary English ("a fixed-size table", "the size of the box")',
  // 0.1 (EDGE-GEOMETRY-CONSTRUCTS): `path` and `routing` were WITHDRAWN from the language,
  // and both are ordinary English of the commonest kind — "the happy path",
  // "a code path", "the routing table", "routing between VRFs". EDGE-GEOMETRY-CONSTRUCTS (now
  // closed) filed exactly that generality as the reason LAYOUT-ZONE-NAMESPACE's reservation of
  // them was an exposure; the same generality is why a bare word here is
  // evidence of nothing. `points` joins them for the same reason ("border
  // points", "the two points where"). A backticked `path` or a written
  // `points=` still fails, and that is the spelling a stale comment uses.
  path:     'ordinary English ("a code path", "the happy path", "the return path")',
  routing:  'ordinary English, and the domain noun these figures are full of',
  points:   'ordinary English (the plural of point; "border points")',
  tailport: 'reads as a compound of ordinary words in prose about edge ends',
  headport: 'ditto',
  cloud:    'the network cloud a topology figure is about',
  via:      'the English preposition',
  unit:     'ordinary English ("one unit shown as a representative row")',
  level:    'ordinary English',
  kind:     'ordinary English',
  text:     'ordinary English',
  labels:   'ordinary English (the plural of label)',
  z: 'a single letter', w: 'a single letter', h: 'a single letter',
  dir: 'an abbreviation used in prose', src: 'ditto', dst: 'ditto',
};

// The publish step DELETES pre-release version clauses rather than rewriting
// them, so a version string can no longer serve as the marker. The corpus
// states the same fact with a past-tense verb before a code span
// (`style=` LEFT `signal`), and that is the marker now. A retirement marker
// turns a USE into a historical NOTE. Deliberately NOT
// on this list: a bare R-number. `# … drawn as a shape (EXTERNAL-EDGE-ENDPOINTS) …` was one of
// the eight stale comments found by hand, so an R-number is
// evidence of nothing — the standard cites rule numbers everywhere.
const MARKER = /\b(?:left|became|moved|gained|dropped)\s+`|\b(?:renamed|renames|rename|retired|retirement|deleted|removed|replaced|superseded|formerly|until|was|were|spelled|used to|no longer|withdrawn|withdrew)\b/i;

// ── Rule 2: no INTERNAL REFERENCE inside a string that renders ───────────────
//
// Rule 1 above governs `.fd` COMMENTS, which no reader of the picture ever
// sees. This rule governs the opposite surface: a `class` meaning, a node or
// edge label, a `title`, a `description=` and a table's pipe cells are all
// DRAWN — into `<text>` in the legend and the boxes, and into the `<title>`
// tooltips. An internal decision code there is not undecodable prose, it is an
// undecodable reference IN THE PICTURE, where the reader has no document to
// consult even in principle: the `.svg` travels into someone else's wiki with
// no repository beside it.
//   *The failure:* `examples/showcase/tcp-state-machine.fd` drew
//   `… no node-identity construct yet (IDENTITY-ASSERTION)` in its legend for four
//   releases. Every gate was green — the directive parsed, the comment was
//   current, the artifact matched its source. Nothing looked inside a string.
//
// TWO TIERS, because the distinction that matters is DATA vs REFERENCE and
// only one half of it can be decided mechanically.
//
//   fail    the project's own namespace, which no figure could ever mean:
//           `IDENTITY-ASSERTION`, a 0.1 provenance token, a repo-relative doc
//           path, and a `§` hung off an internal document name (`core §9`).
//   review  a parenthesised bare code — `(MEANING-RECOVERY-SOURCE)`, `(CATEGORICAL-MEANING-MAPPING)`. Printed, never
//           fails, because it CANNOT be told from figure data by shape:
//           `DYNAMIC-FIGURE-PURPOSE` is a router, `A1`/`A2` are private-VLAN communities, `Q0`
//           is a queue, `C1` is a chassis, `PIN-COORDINATE-SCOPE` is a device. All five are
//           live in this corpus. A gate that failed on them would be wrong
//           more often than right, so this tier is a human's worklist and
//           says so rather than pretending to a certainty it lacks.
//
// An external standard's section is a REFERENCE A READER CAN FOLLOW and is
// not touched: `RFC 9293 §3.3.2` is the whole point of citing it.
const RENDERED_FAIL = [
  [/\bOQ-[A-Z]?\d+\b/g,                          'open-question code'],
  [/\b0\.\d+-dev\.\d+\b/g,                       'dev-increment provenance'],
  [/\b(?:spec|design|tools|conformance|skill|examples|figures)\/[\w./-]+\.\w+/g,
                                                 'repo path'],
  [/\b(?:core|genres|SKILL)\s*§\s*[\w.]+/g,      'internal spec section'],
];
const RENDERED_REVIEW = [
  [/\((?:R|D|G|A|Q|C)\d{1,3}\)/g,                'parenthesised code — data or reference?'],
];

/**
 * Every string in a `.fd` that reaches the SVG. Two shapes, because the
 * language has two: a quoted string on a directive, and a table pipe row,
 * whose cells are raw GFM and carry no quotes at all. Missing the second is
 * how a scan of this file class goes blind — `examples/reference/table.fd`
 * writes 5 of its 7 drawn strings as pipe cells.
 */
function renderedStrings(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trimStart().startsWith('|')) { out.push({ n: i + 1, s: raw }); continue; }
    if (raw.trimStart().startsWith('#')) continue;
    const c = commentOf(raw);
    const body = c === null ? raw : raw.slice(0, raw.length - c.length);
    const re = /"([^"]*)"/g;
    let m;
    while ((m = re.exec(body))) out.push({ n: i + 1, s: m[1] });
  }
  return out;
}

function checkRendered(text) {
  const fails = [], reviews = [];
  for (const { n, s } of renderedStrings(text)) {
    for (const [re, why] of RENDERED_FAIL) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(s))) fails.push({ n, why, tok: m[0], s: s.trim() });
    }
    for (const [re, why] of RENDERED_REVIEW) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(s))) reviews.push({ n, why, tok: m[0], s: s.trim() });
    }
  }
  return { fails, reviews };
}

/** Engine findComment: '#' opens a comment at line start or after whitespace, never inside quotes. */
function commentOf(s) {
  let inq = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') inq = !inq;
    else if (s[i] === '#' && !inq && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(i);
  }
  return null;
}

function backtickTokens(comment) {
  const out = [];
  const re = /`([^`]+)`/g;
  let m;
  while ((m = re.exec(comment))) out.push(m[1].trim());
  return out;
}

function findHits(comment, vocab) {
  const hits = [];
  const ticks = backtickTokens(comment);
  // Exact token only. A backticked `fill=` is the LIVE option key, not the
  // retired KEYWORD `fill` (which became `band`) — the two namespaces are
  // separate (§10), and a trailing `=` says which one is meant. Retired
  // option keys are matched by their own `key=` probe below.
  const inTicks = t => ticks.includes(t);

  for (const k of vocab.optKeys) {
    if (new RegExp('\\b' + k + '=').test(comment)) hits.push(k + '=');
  }
  for (const v of vocab.enumVals) {
    const val = v.split('=')[1];
    if (comment.includes(v) || inTicks(v) || inTicks(val)) hits.push(v);
  }
  for (const k of vocab.keywords) {
    if (inTicks(k)) { hits.push('`' + k + '`'); continue; }
    if (ENGLISH_AMBIGUOUS[k]) continue;            // bare word proves nothing
    if (new RegExp('\\b' + k + '\\b(?![/.\\w])').test(comment)) hits.push(k);
  }
  return [...new Set(hits)];
}

/**
 * Contiguous comment blocks. A block is a maximal run of ADJACENT lines that
 * each carry a comment — whether a whole-line comment or a trailing one. The
 * block, not the line, is the exemption scope: a historical note routinely
 * spans four lines and puts the version token on the last of them.
 * Pipe rows are raw GFM content (the engine does not strip comments there),
 * so they carry no comment at all.
 */
function blocksOf(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const c = raw.trimStart().startsWith('|') ? null : commentOf(raw);
    if (c === null) { cur = null; continue; }
    if (!cur) { cur = { lines: [], text: '' }; blocks.push(cur); }
    cur.lines.push({ n: i + 1, comment: c });
    cur.text += c + '\n';
  }
  return blocks;
}

// ── Rule 3: the SPEC PROVENANCE LINE ────────────────────────────────────────
//
// A `.fd` file travels. It is pasted into a chat, committed to a downstream
// wiki, attached to a ticket — and it arrives beside a reader who has never
// heard of FigDown and has nothing telling them what the format is or where
// it is defined. Measured: of 430 `.fd` files in this
// repository, 13 carried a URL or a spec path and NOT ONE of them was a
// resolvable locator aimed at that reader.
//
// The fix is one comment line, first line of the file:
//
//   # FigDown — figures as text. Spec: https://github.com/FigDown/figdown
//
// It is a CONVENTION, not a directive (SPEC-PROVENANCE-LINE). The parser does not read it,
// its absence is not a line error, and nothing in the language changes. Core
// §1 already blesses a provenance block above the header — "source document,
// image hash, reconstruction method" — and a pointer to the standard IS
// provenance, so this is an existing normative convention gaining a standard
// spelling rather than new machinery. What makes it stick is a repository
// gate, which is this rule: a gate reads files, and a comment is as readable
// as a keyword.
//
// Checked here on THREE counts, because two thirds of a convention is not
// one: PRESENCE (the line is there), EXACT WORDING (byte-for-byte, em dash
// included — a paraphrase is a different sentence and cannot be searched
// for), and POSITION (first line, hence above the `figdown` header, per §1).
//
// Scope is this tool's default corpus — the PUBLISHED documents, `examples/`
// and `figures/`. Deliberately NOT the fixtures: `conformance/cases/`,
// `conformance/experimental/` and `tools/migrate-fixtures/` are minimal
// inputs whose job is to isolate one construct, and 105 of the
// `conformance/cases/*.errors.txt` goldens carry 1-based `Line N:` prefixes
// that a line inserted at the top would shift by one, every one of them.
const SPEC_LINE = '# FigDown — figures as text. Spec: https://github.com/FigDown/figdown';

/**
 * @returns {null | {why: string, got: string}} null when the file opens with
 * the provenance line exactly; otherwise what is wrong with the opening.
 */
function checkSpecLine(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] === SPEC_LINE) return null;
  const at = lines.findIndex(l => l === SPEC_LINE);
  const header = lines.findIndex(l => /^\s*figdown\s/.test(l));
  if (at < 0) {
    // A near miss is the likely failure — a reworded line, a hyphen where the
    // em dash belongs, a moved URL — so say which it is.
    const near = lines.findIndex(l => /^\s*#.*\bFigDown\b.*\bSpec:/i.test(l));
    return near >= 0
      ? { why: 'spec provenance line reworded (line ' + (near + 1) + ')', got: lines[near] }
      : { why: 'spec provenance line missing', got: lines[0] === undefined ? '' : lines[0] };
  }
  if (header >= 0 && at > header)
    return { why: 'spec provenance line is BELOW the figdown header (line ' + (at + 1) + ')', got: lines[at] };
  return { why: 'spec provenance line must be line 1 (found at line ' + (at + 1) + ')', got: lines[at] };
}

function checkFile(file, vocab) {
  const text = fs.readFileSync(file, 'utf8');
  const spec = checkSpecLine(text);
  const defects = [], notes = [];
  for (const b of blocksOf(text)) {
    const marked = MARKER.test(b.text);
    for (const l of b.lines) {
      const hits = findHits(l.comment, vocab);
      if (!hits.length) continue;
      (marked ? notes : defects).push({ n: l.n, hits, comment: l.comment.trim() });
    }
  }
  return { defects, notes, spec, ...checkRendered(text) };
}

function collect(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) throw new Error('no such path: ' + p);
  if (fs.statSync(abs).isFile()) return abs.endsWith('.fd') ? [abs] : [];
  const out = [];
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    out.push(...collect(path.join(abs, e.name)));
  }
  return out.sort();
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const verbose = args.includes('--verbose');
  const paths = args.filter(a => !a.startsWith('-'));
  const engine = loadEngine();
  const vocab = retiredVocab(engine);

  for (const k of Object.keys(ENGLISH_AMBIGUOUS)) {
    if (!vocab.optKeys.includes(k) && !vocab.keywords.includes(k) &&
        !vocab.enumVals.includes('shape=' + k))
      throw new Error('tool defect: "' + k + '" is on the English-ambiguous ' +
        'opt-out but the engine no longer retires it — drop the entry');
  }

  const files = (paths.length ? paths : DEFAULT_PATHS).flatMap(collect);
  console.log('comment-check  engine=' + path.relative(ROOT, engine.path) +
    '  files=' + files.length);
  console.log('  retired: keywords=' + vocab.keywords.join(' ') +
    '  option-keys=' + vocab.optKeys.map(k => k + '=').join(' ') +
    '  enum-values=' + vocab.enumVals.join(' '));

  let bad = 0, noted = 0, drawn = 0, review = 0, unlocated = 0;
  for (const f of files) {
    const r = checkFile(f, vocab);
    noted += r.notes.length;
    if (r.spec) {
      unlocated++;
      console.log('\nFAIL ' + path.relative(ROOT, f) + '  (' + r.spec.why + ')');
      console.log('  expected line 1: ' + SPEC_LINE);
      console.log('  found:           ' + r.spec.got);
    }
    if (verbose) for (const nt of r.notes)
      console.log('  note ' + path.relative(ROOT, f) + ':' + nt.n +
        '  [' + nt.hits.join(' ') + ']  ' + nt.comment);
    if (verbose) for (const rv of r.reviews)
      console.log('  review ' + path.relative(ROOT, f) + ':' + rv.n +
        '  ' + rv.tok + '  (' + rv.why + ')  ' + rv.s.slice(0, 90));
    review += r.reviews.length;
    if (r.fails.length) {
      drawn += r.fails.length;
      console.log('\nFAIL ' + path.relative(ROOT, f) + '  (internal reference in a DRAWN string)');
      for (const d of r.fails)
        console.log('  line ' + d.n + '  ' + d.tok + '  (' + d.why +
          ') in: ' + d.s.slice(0, 110));
    }
    if (!r.defects.length) continue;
    bad += r.defects.length;
    console.log('\nFAIL ' + path.relative(ROOT, f));
    for (const d of r.defects)
      console.log('  line ' + d.n + '  uses [' + d.hits.join(' ') +
        '] as current: ' + d.comment);
  }

  console.log('\n' + (bad || drawn || unlocated
    ? 'FAIL  ' + bad + ' stale comment(s), ' + drawn + ' drawn internal reference(s), ' +
      unlocated + ' file(s) without the spec provenance line'
    : 'OK  no stale comments, no drawn internal references, ' + files.length +
      ' file(s) carry the spec provenance line') +
    '; ' + noted + ' historical note(s) admitted, ' +
    review + ' parenthesised code(s) for review (--verbose to list)');
  if (strict && (bad || drawn || unlocated)) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(e.stack || e);
  process.exit(2);
}
