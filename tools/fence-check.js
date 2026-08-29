#!/usr/bin/env node
// fence-check.js — engine-verify every ```figdown fence AND every FigDown
// directive written in an inline code span, across the Markdown corpus.
//
// Rationale: a documentation snippet that does not parse teaches a spelling that
// does not exist.  This was found the hard way when a reply document that itself
// mandated engine-verified spellings contained an invalid snippet.
//
// Fenced blocks alone are not enough.  Most of the syntax this project teaches
// is written in INLINE code spans — `bundle b1 "LAG" a--c,b--c` in a prose
// sentence, `cell (r,c) fill=…` in a table cell — and a fenced-only checker
// cannot see any of it.  That blind spot hid an invalid `class … fill=` on an
// edge in guide/agents.md for ten releases, and four more live errors in
// guide/expressing.md / guide/authoring.md / guide/layout.md.  The inline-span scan below
// closes it.
//
// Usage:
//   node tools/fence-check.js [--strict] [--help] [<file.md | dir> ...]
//
// --strict   exit 1 if any fence OR any inline span is reported as `fail`
// --help     print usage (including the default roots) and exit
//
// Default roots when no path is given (resolved from the project root,
// independent of CWD):
//
//   .              top-level *.md only (README, CHANGELOG, PROOF)
//   spec/          the normative spec
//   skill/         the agent skill
//   conformance/   discrepancy + error-coverage notes, full of syntax
//   examples/      including reference/, patterns/, statechart/
//   tools/         this directory's own README and notes
//   figures/
//   integrations/
//
// Every root except `.` is walked RECURSIVELY for *.md.  A gate that does not
// recurse is a gate that lies (.github/CONTRIBUTING.md §3.1(d)), so the run states the
// number of files it scanned; cross-check it against the corpus when the roots
// change.  Archival subdirectories (dist/ and
// any dot-directory) are never searched by the default roots.
//
// Opt-out markers
// ---------------
// (a) Immediately before a ```figdown fence, a comment on its own line:
//
//       <!-- fence-check: skip -->
//
//     tells this tool to skip that fence.  Use it for snippets that
//     deliberately show a WRONG spelling (e.g. a "don't do this" example).
//     The marker MUST appear on the line immediately before the opening
//     fence — no blank lines between the marker and the fence.
//
// (b) A per-LINE marker, for inline spans: the same comment appearing anywhere
//     on a Markdown source line skips the inline spans on THAT line.  A
//     per-fence comment cannot address an inline span, so this is the
//     finest granularity offered:
//
//       There used to be `routing orthogonal`. <!-- fence-check: skip -->
//
// (c) A per-SECTION / per-FILE marker, for documents whose subject IS the set
//     of retired spellings (MIGRATIONS, SYNTAX-STYLE, error catalogues).
//     On a line of its own:
//
//       <!-- fence-check: skip-inline -->
//
//     suspends the inline-span scan from that point to the next
//
//       <!-- fence-check: resume-inline -->
//
//     or to end of file.  Put it under a heading to cover one section, or at
//     the top of the file to cover the whole file.  It does NOT affect fences,
//     which keep marker (a).
//
// (d) A document-CLASS declaration, placed once near the top of a file:
//
//       <!-- fence-check: migration-record -->
//
//     for the handful of files whose SUBJECT is retired syntax (MIGRATIONS,
//     MIGRATE, and any error catalogue).  It changes the DEFAULT instead of
//     switching the check off: a failing inline span there is reported
//     `historical` rather than `fail`, because the file's left-hand content is
//     retired by construction — but the rewrite TARGET of a row is still
//     `fail` when it does not parse.  A target is the span right of an arrow,
//     or the second cell of a two-column `| old | new |` table (that table
//     shape is recognised only under this marker; a general three-column
//     reference table would otherwise pair two unrelated cells).
//
//     A target that does not parse is NOT a failure either: it gets its own
//     verdict, `stale-target`, which is counted and printed as a worklist.  A
//     migration log is chronological — entry N's target is the spelling as of
//     version N — so requiring every target to parse against today's engine
//     would demand that history be rewritten every release.  See demote().
//
//     WHAT IT GIVES UP, stated rather than implied.  TWO exposures:
//       1. a genuinely false claim in such a file's narrative prose — a
//          sentence asserting a retired form is live — will not be caught;
//       2. a stale rewrite target is REPORTED AND NOT GATED, so a genuinely
//          WRONG rewrite rule in a migration document will not turn the build
//          red.  What catches it: reading the worklist when the log's last
//          entry changes, since only the last entry's targets are current by
//          construction.  Four hundred per-span markers would be
//     applied by rote and make the files unreadable, which is worse; and these
//     entries are dated, chronological records the project already reads in
//     order (.github/CONTRIBUTING.md §3.1(f) is the precedent for writing an exposure
//     down instead of hiding it).
//
// Three states
// ------------
// ok         — the fence parsed without errors (complete doc or wrapped fragment)
// fail       — a genuine error: unknown keyword, unknown option, malformed line,
//              or a complete document (one that starts with `figdown …`) that
//              has any parse error
// unverified — a fragment that cannot be verified without inventing context:
//              errors exclusively about unknown ids / endpoints / groups / nodes
//              / layers, or about no matching edge — these are missing-declaration
//              artefacts, not bad spellings
//
// Distinguishing fail from unverified (fragment mode only)
// ---------------------------------------------------------
// Errors that indicate a real bad spelling:
//   "unrecognized line (unknown keyword …)"
//   "unknown option …="
//   "unknown shape …"
//   "unknown genre …"
//   "unknown color …"
//   "first line must be …"
//   "unknown escape …"
//   "expected …" (operator / close bracket errors)
// Errors that are context artefacts (missing declarations):
//   "unknown endpoint …"
//   "unknown group …"
//   "unknown node …"
//   "unknown plane …"
//   "unknown target …"
//   "pin of unknown id …"
//   "unknown class …"
//   "no edge between … for bundle"
//   "edge endpoint … is a group"
//
// Distinguishing fail from unverified for INLINE SPANS
// ----------------------------------------------------
// An inline span is a bare directive line with no document around it, so the
// fenced-fragment rule ("anything that is not a missing-declaration artefact
// is a bad spelling") inverts into a flood: almost every span references ids
// that were never declared, sits in the wrong genre, or is a template with a
// `<placeholder>` in it.  A check that floods `unverified` is ignored, and one
// that floods `fail` is worse.
//
// So inline spans use the OPPOSITE, positive test: a span `fail`s only when
// the engine hands back an error from the bad-SPELLING family — the five kinds
// this tool exists to catch:
//
//   a retired keyword      "… has been renamed: use …", "… has been retired",
//                          "… has been WITHDRAWN from the language"
//   a retired option key   "unknown option \"x=\"", "… does not take x="
//   a retired form         every migration diagnostic carries its own citation,
//                          "(MIGRATIONS 0.1)" — the space-form bundle
//                          list, the paren point, the quoted title, …
//   a bad enum value       "unknown shape/genre/color/escape …",
//                          "numbering must be lsb0 or msb0"
//   a not-in-v0.1 word     "… is reserved for …"
//
// Deliberately NOT in the family: "unsupported version" — README and
// spec/PROCESS discuss the 0.2 / 1.0 versioning policy in prose spans
// (`figdown 1.0`), and a version this engine does not implement is a policy
// statement, not a misspelling.
//
// Anything else the engine says about a span (needs an id, unknown node,
// wrong genre, "cell needs [h]<row>[,<col>]") is `unverified`: the span is a
// fragment and the tool declines to invent the context that would settle it.
//
// A fourth state, `historical`, exists for inline spans only: the rewrite-FROM
// side of a `<before>` → `<after>` migration row, and anything struck through
// with ~~…~~.  It is never `fail` and never `ok`.  See the arrow note at
// scanInlineSpans().  The rewrite-TO side is checked normally and its failures
// are printed FIRST, because a migration row telling an author to type
// something the engine rejects is the one defect class nothing else checks.

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Engine lookup (same order as build-svg.js / strip-check.js) ────────────────

const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean);

function findEngine() {
  return ENGINE_CANDIDATES.find(p => fs.existsSync(p)) || null;
}

function loadEngine(enginePath) {
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0)
    throw new Error('Cannot locate engine boundaries in ' + enginePath);
  // eslint-disable-next-line no-new-func
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render};');
  return factory();
}

// ── Version header detection ──────────────────────────────────────────────────
// A complete document begins with `figdown <version> …` on its first non-blank
// non-comment line.

const VERSION_HEADER_RE = /^figdown\s+\d+\.\d+/;

function isCompleteDoc(src) {
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    return VERSION_HEADER_RE.test(t);
  }
  return false;
}

// ── Minimal wrapper for fragments ─────────────────────────────────────────────
// Prepend the smallest valid header so the parser can proceed.

const FRAGMENT_HEADER = 'figdown 0.1 block\n';

function wrapFragment(src) {
  return FRAGMENT_HEADER + src;
}

// ── Error classification ──────────────────────────────────────────────────────
// Returns true if the error message is a context-artefact (missing declaration)
// rather than a bad-spelling error.

// Every alternative below is the engine's OWN wording; three of them had gone
// stale against it and were matching nothing:
//   `unknown layer`               → `unknown plane` (PLANE-KEYWORD-SPELLING)
//   `plot references unknown …`   → `chart references unknown …`
//   `size of unknown id`          → deleted with the `size` keyword (ELEMENT-GEOMETRY-DIRECTIVE,
//                                   0.1); `pin of unknown id` is the
//                                   one diagnostic left for both.
//   `no edge … for path`          → deleted with the `path` keyword (EDGE-GEOMETRY-CONSTRUCTS,
//                                   0.1). `path` was WITHDRAWN, so the
//                                   error it produced can no longer occur;
//                                   only `no edge between … for bundle`
//                                   remains in this family.
// A dead alternative is not harmless: the artefact it named starts being
// reported as a genuine bad spelling, and the fence it appears in fails for
// missing context it was never going to have.
const CONTEXT_ARTEFACT_RE = /\b(unknown endpoint|unknown group|unknown node|unknown plane|unknown target|pin of unknown id|unknown class|no edge between .* for bundle|edge endpoint .* is a group|chart references unknown table)\b/;

function isContextArtefact(errMsg) {
  return CONTEXT_ARTEFACT_RE.test(errMsg);
}

// ── Fence extraction ──────────────────────────────────────────────────────────
// Returns array of { lineNo, src, skip } objects.
// lineNo = 1-based line number of the opening ``` fence.

const SKIP_MARKER_RE = /^<!--\s*fence-check:\s*skip\s*-->$/;

function extractFences(mdSrc) {
  const lines = mdSrc.split('\n');
  const fences = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Look for ```figdown (with optional trailing whitespace)
    if (/^```figdown\s*$/.test(line)) {
      // Check for skip marker immediately before this line (i-1, no blank lines).
      let skip = false;
      if (i > 0) {
        const prev = lines[i - 1].trim();
        if (SKIP_MARKER_RE.test(prev)) skip = true;
      }
      const openLineNo = i + 1; // 1-based
      i++;
      const bodyLines = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      fences.push({ lineNo: openLineNo, src: bodyLines.join('\n'), skip });
    } else {
      i++;
    }
  }
  return fences;
}

// ── Single-fence check ────────────────────────────────────────────────────────
// Returns { verdict: 'ok'|'fail'|'unverified'|'skip', errors: string[] }

function checkFence(engine, src, skip) {
  if (skip) return { verdict: 'skip', errors: [] };

  const complete = isCompleteDoc(src);

  if (complete) {
    const { errs } = engine.parse(src);
    if (!errs.length) return { verdict: 'ok', errors: [] };
    return { verdict: 'fail', errors: errs };
  }

  // Fragment mode: wrap and parse.
  const wrapped = wrapFragment(src);
  const { errs } = engine.parse(wrapped);
  if (!errs.length) return { verdict: 'ok', errors: [] };

  // Classify: are ALL errors context artefacts?
  // Filter out "Line 1:" errors (that's our injected header line) — those
  // could be spurious if the fragment's first line confuses the header parser.
  const relevant = errs.filter(e => {
    // Lines 1 of the wrapped doc is our injected header; ignore parse errors
    // on that line (shouldn't happen since we inject a valid header, but guard).
    return !e.startsWith('Line 1:');
  });

  if (relevant.length === 0) {
    // Only header-line errors, which shouldn't happen — treat as ok.
    return { verdict: 'ok', errors: [] };
  }

  const allArtefacts = relevant.every(e => isContextArtefact(e));
  if (allArtefacts) return { verdict: 'unverified', errors: relevant };
  return { verdict: 'fail', errors: relevant };
}

// ═════════════════════════════════════════════════════════════════════════════
// INLINE CODE SPANS
// ═════════════════════════════════════════════════════════════════════════════

// ── The keyword registry, read from the engine (never hardcoded) ──────────────
// There is no exported KEYWORDS array in figdown.html, but the engine answers
// the question directly: it rejects a word it does not know with either
//   `"w" is not allowed in genre <g>`   (the genre allowlist, GENRE-KEYWORD-ALLOWLIST), or
//   `unrecognized line (unknown keyword "w")`.
// A word is REGISTERED when at least one genre answers with neither — that
// includes the retired keywords (`layer`, `guide`, `path`, `size`, `routing`,
// `boundary`, `plot`, `wave`, `line`, `fill`), which answer with their own
// retirement diagnostic and are exactly what this check is for.
//
// Deriving the set this way cannot rot: it is the engine's own dispatch,
// re-measured on every run against whatever figdown.html is loaded.

const REGISTRY_GENRES = ['block', 'topology', 'flowchart', 'bitfield', 'table', 'timing'];

function makeKeywordOracle(engine) {
  const cache = new Map();
  return function isKeyword(w) {
    if (cache.has(w)) return cache.get(w);
    let registered = false;
    if (/^[a-z][a-z0-9-]*$/.test(w)) {
      for (const g of REGISTRY_GENRES) {
        const { errs } = engine.parse('figdown 0.1 ' + g + '\n' + w + '\n');
        const rejected = errs.some(e =>
          e.includes('"' + w + '" is not allowed in genre') ||
          e.includes('unknown keyword "' + w + '"'));
        if (!rejected) { registered = true; break; }
      }
    }
    cache.set(w, registered);
    return registered;
  };
}

// ── Parse contexts ────────────────────────────────────────────────────────────
// A span is judged under every plausible context and keeps its BEST verdict, so
// that a `topology`-only or `table`-only spelling is never failed merely for
// being read under the wrong genre.  The three typed scaffolds exist because
// `cell` / `field` / `width` / `signal` / `gap` / `break` are typed-block
// children: without a block above them the engine can only say so.

// A CONTEXT NAMES A LANGUAGE VERSION, AND THERE IS NOW MORE THAN ONE OF THOSE.
// Every scaffold below declared `figdown 0.1`, which was every version there
// was.  Once a keyword is gated on the version -- `flowline`, `state` and
// `transition` require `figdown 0.2` -- a span written in the CURRENT
// vocabulary parses under no scaffold at all, and the genre documents' own
// correct examples are read as bad spellings.  Each genre is therefore offered
// at 0.1 and at the version this engine implements, taken FROM the engine
// rather than written here, so a later `X.Y` needs no edit and neither does a
// genre introduced at one.
const GENRE_SCAFFOLD = [
  ['block',      ''],
  ['topology',   ''],
  ['flowchart',  ''],
  ['statechart', ''],
  ['table',      'table __fc "T"\n| A | B |\n|---|---|\n| x | y |\n'],
  ['bitfield',   'bitfield __fc "B" numbering=msb0\nfield __f 8\n'],
  ['timing',     'timing __fc "M"\nsignal __s "S" wave=hlh\n'],
];
const INLINE_CONTEXTS = [];
function buildInlineContexts(engine) {
  const lang = (/^(\d+\.\d+)/.exec(String(engine.FIGDOWN_VERSION || '')) || [])[1] || '0.1';
  const versions = lang === '0.1' ? ['0.1'] : ['0.1', lang];
  INLINE_CONTEXTS.length = 0;
  for (const v of versions)
    for (const [g, body] of GENRE_SCAFFOLD)
      INLINE_CONTEXTS.push([g + '@' + v, 'figdown ' + v + ' ' + g + '\n' + body]);
}

// A context that answers "that word belongs to a different genre" has not READ
// the span -- it has declined to.  Three wordings say it: the older two, and
// the per-genre connector message, which names the word this genre uses and
// cites the migration entry.  That citation is what puts it in the
// bad-spelling family, and under the wrong genre it does not belong there: the
// spelling is not retired, it is somewhere else.  Excluding these contexts is
// what lets `flowline` be judged by `flowchart`, while `rank hit punt` -- a
// retired FORM, which every genre that knows the keyword rejects as retired --
// still fails, because its contexts are declining the form and not the word.
const GENRE_MISMATCH_RE =
  /is not allowed in genre|unknown keyword|is not the word genre \S+ uses for this/;

// The same shape, one axis over: the context declined on its VERSION.  A
// scaffold declaring `figdown 0.1` answers a `0.2` word with "requires figdown
// 0.2", which is the version gate working -- not evidence about the spelling,
// which the scaffold at that version judges instead.
const VERSION_GATE_RE = /requires figdown \d+\.\d+/;

// ── The bad-spelling family (see the header comment for the rationale) ────────
// Every alternative is the engine's OWN wording.  `(MIGRATIONS <version>` is the
// citation the engine appends to every migration diagnostic, so it covers the
// retired FORMS (space-delimited bundle list, bare-comma cell address / pin
// point, unquoted title, …) without this file having to enumerate them.
const BAD_SPELLING_RE = new RegExp([
  '\\(MIGRATIONS \\d',
  'has been renamed',
  'has been retired',
  'has been WITHDRAWN',
  'unknown option',
  'does not take',
  'unknown shape',
  'unknown genre',
  'unknown color',
  'unknown escape',
  'must be lsb0 or msb0',
  'is reserved for',
].join('|'));

// SELF-TEST: the `(MIGRATIONS …` alternative above is the ONLY
// one that is not a literal phrase the engine writes at a known site — it is a
// citation format, and a citation format is exactly the kind of string a
// version rewrite edits without noticing. If it ever stops matching, this file
// silently loses its whole coverage of the retired FORMS: six of them
// (`field SYN 1`, `rank hit punt`, `title TCP Header`, `pin a at=20,20`,
// `cell 1,1 fill=#eee`, `width auto 90 25%`) drop from `historical` to
// `unverified`, the tool goes on reporting 0 fail, and two of those six are
// named in this repository's own prose as things this check catches — one of
// them in its own header example. Nothing would go red.
//
// So the alternative is VERIFIED END TO END, against the engine, before any
// file is read: run a retired form through it and require the diagnostic to
// land in the family. A regex is checked by RUNNING it, never by reading it —
// the same rule PROCESS §3.1(c) states for the migration tool.
function selfTestMigrationCitation(engine) {
  const probe = [
    'figdown 0.1 table',
    'table t "T"',
    '| A | B |',
    '|---|---|',
    '| 1 | 2 |',
    'width auto 90',            // the space form, retired 0.1
  ].join('\n');
  const errs = engine.parse(probe).errs || [];
  const cited = errs.filter(e => /\(MIGRATIONS /.test(e));
  if (!cited.length) {
    console.error('fence-check SELF-TEST FAILED: the engine emitted no migration '
      + 'diagnostic for a known retired form. Errors were:\n  ' + errs.join('\n  '));
    process.exit(2);
  }
  if (!cited.some(e => BAD_SPELLING_RE.test(e))) {
    console.error('fence-check SELF-TEST FAILED: the engine writes its migration '
      + 'citation as\n  ' + cited[0]
      + '\nand BAD_SPELLING_RE does not match it, so every retired FORM this tool '
      + 'claims to cover would be reported `unverified` instead of caught. '
      + 'Fix the alternative in BAD_SPELLING_RE to the citation the engine '
      + 'actually emits.');
    process.exit(2);
  }
}

// ── Guards: which spans are directive lines at all ────────────────────────────
// Markdown backticks are used for far more than FigDown source.  Each guard
// below suppresses a span the engine could only answer nonsense about; every
// one of them is an EXPLICIT authorial signal, not a guess about intent.

function stripQuoted(s) { return s.replace(/"[^"]*"/g, '""'); }

// (1) A template, not a line: `<id>` metavariables, `…`/`...` elisions,
//     `[key=…]` optional-argument brackets, `a|b` alternation, and a dangling
//     `key=` with no value (the documentation convention for NAMING an option
//     key).  Note `[yes]` / `[1]` edge labels and the `<->` operator are NOT
//     templates and stay checked.
function isTemplate(text) {
  const u = stripQuoted(text);
  if (/…|\.\.\./.test(u))            return true;   // elision
  if (/<[^\s<>\-][^<>]*>/.test(u))     return true;   // <id>, <genre>, <標籤> — but not <->
  if (/\[[^\]]*[=<]/.test(u))        return true;   // [word=32], [--strict]
  if (/\|/.test(u))                  return true;   // lsb0|msb0
  if (/[A-Za-z-]+=(\s|$)/.test(u))   return true;   // `fill=`, `at=`
  return false;
}

// (2) Prose that happens to start with a keyword — most often this corpus
//     QUOTING an engine diagnostic (`layer needs an id`, `size of unknown id`,
//     `table has no |---| delimiter row`).  These read as English sentences;
//     a directive line does not contain these connectives outside a quote.
const PROSE_RE = /(\s(needs|expected|reserved|accepts|parses|renamed|retired)\s|\shas been\s|\sis not\s|\smust be\s|\sof unknown\s|,\sexpected)/;

// (3) Not FigDown at all: shell commands and paths (`node tools/foo.js`),
//     CLI flags, JS/TS operators.
function isNotFigdown(text) {
  const u = stripQuoted(text);
  if (/\//.test(u))                                 return true;
  if (/\.(js|md|fd|html|json|svg|py|sh|tsv|css)\b/.test(u)) return true;
  if (/(^|\s)--/.test(u))                           return true;
  if (/===|!==|=>|&&|\$\{/.test(u))                 return true;
  return false;
}

// (4) A retired keyword in first position is reported EVEN IF the rest of the
//     span is a template — `path … points=`, `routing orthogonal`, `layer z=`.
//     A retired keyword is a bad spelling whatever its arguments look like, and
//     this is the family that shipped undetected for ten releases.
//
//     The probe is deliberately NARROWER than BAD_SPELLING_RE: only the four
//     phrasings that mean "this WORD is gone" count.  A diagnostic about
//     missing arguments may cite MIGRATIONS too (`band` does), and reading that
//     as a retirement would fail every template that names a live keyword.
const RETIRED_KEYWORD_RE =
  /(has been renamed|has been retired|has been WITHDRAWN|is reserved for)/;

function retiredKeywordError(engine, word) {
  if (word === 'figdown') return null;            // a version header, not a directive
  for (const [, wrap] of INLINE_CONTEXTS) {
    const n = wrap.split('\n').length - 1;
    const { errs } = engine.parse(wrap + word + '\n');
    const hit = errs.find(e => {
      const m = /^Line (\d+):/.exec(e);
      return m && +m[1] > n && RETIRED_KEYWORD_RE.test(e);
    });
    if (hit) return hit;
  }
  return null;
}

// ── Single-span check ─────────────────────────────────────────────────────────
// Returns { verdict, errors, context } with the BEST verdict over all contexts.

function checkInlineSpan(engine, text) {
  const RANK = { ok: 0, unverified: 1, fail: 2 };

  // A span that IS a version header (`figdown 0.1 table`) is a complete
  // document of its own — wrapping it would make it a second header and the
  // engine would answer about that, not about the span.
  if (/^figdown\b/.test(text)) {
    const { errs } = engine.parse(text + '\n');
    const verdict = !errs.length ? 'ok'
      : errs.some(e => BAD_SPELLING_RE.test(e)) ? 'fail'
      : 'unverified';
    return { verdict, errors: errs, context: 'header' };
  }

  // A bad SPELLING is bad in every genre, so a `fail` from ANY context wins
  // outright — it must not be masked by another context answering `"rank" is
  // not allowed in genre table`.  Best-of only decides ok vs unverified: those
  // two differ precisely by whether some genre accepts the line as written.
  //
  // (Getting this backwards made `rank hit punt` — the retired space form —
  //  come out `unverified`, which is the exact defect this check exists for.)
  let best = null, declined = null;
  for (const [name, wrap] of INLINE_CONTEXTS) {
    const n = wrap.split('\n').length - 1;
    const { errs } = engine.parse(wrap + text + '\n');
    const relevant = errs.filter(e => {
      const m = /^Line (\d+):/.exec(e);
      return m && +m[1] > n;                      // drop the scaffold's own lines
    });
    const bad = relevant.filter(e => BAD_SPELLING_RE.test(e));
    // This context declined to read the span rather than judging it.
    if (relevant.length && relevant.every(e => GENRE_MISMATCH_RE.test(e) || VERSION_GATE_RE.test(e))) {
      if (!declined) declined = { verdict: 'unverified', errors: relevant, context: name };
      continue;
    }
    if (bad.length) return { verdict: 'fail', errors: bad, context: name };
    const verdict = relevant.length ? 'unverified' : 'ok';
    if (!best || RANK[verdict] < RANK[best.verdict])
      best = { verdict, errors: relevant, context: name };
  }
  // Every context declined: no genre at any version claims the word, so there
  // is nothing to verify and nothing to fail.
  return best || declined;
}

// ── Inline-span extraction ────────────────────────────────────────────────────
// Returns array of { lineNo, text, skip, errors, verdict }.
//
// The scan is line-oriented, which is what reaches TABLE CELLS: a GFM table row
// is one source line, so the spans inside its `|`-delimited cells are found by
// the same pass as the spans in a paragraph.  (A code span wrapped across two
// source lines is not reached; the corpus does not write any.)

const SKIP_INLINE_RE   = /^<!--\s*fence-check:\s*skip-inline\s*-->$/;
const RESUME_INLINE_RE = /^<!--\s*fence-check:\s*resume-inline\s*-->$/;
const SKIP_ANYWHERE_RE = /<!--\s*fence-check:\s*skip\s*-->/;
const SPAN_RE          = /(`+)([^`][\s\S]*?[^`]|[^`])\1(?!`)/g;
const ARROW_RE         = /→|->|=>/g;
const MIGRATION_RECORD_RE = /<!--\s*fence-check:\s*migration-record\s*-->/;

// A migration log writes  `<before>` → `<after>`  and its whole job is to quote
// the retired spelling on the LEFT.  Reporting those as `fail` is the tool
// misreading the document, and 200 false positives buys a blanket suppression
// within a week.  So the arrow — a syntactic fact on the LINE, not a guess from
// the span's content — splits the row:
//
//   left of the last arrow   → `historical`: expected to fail, never `fail`,
//                              never `ok`.  A left span that parses CLEAN is
//                              listed separately: a rewrite rule whose input is
//                              still legal is either finished or wrong.
//   right of the last arrow  → checked normally.  A `fail` there means the log
//                              is telling an author to type something the
//                              engine rejects — the most valuable thing this
//                              extension finds, and the reason not to take the
//                              cheap file-level skip.
//
// Arrows INSIDE a code span are FigDown's own edge operator and must not split
// anything, so the arrow search runs over the line with the spans masked out.

// The pairing is per ADJACENT PAIR, not "everything left of the last arrow":
// a table cell often carries several arrows in unrelated sentences ("no text
// in the original → `node a \"\"` … unreadable → omit it"), and a single
// split-point would file a perfectly good span as historical.  A span is the
// rewrite-FROM side only when an arrow lies strictly between it and the NEXT
// candidate span on the same line — that is the `<before>` → `<after>` shape
// and nothing else.
function maskRange(str, a, b) {
  return str.slice(0, a) + str.slice(a, b).replace(/[^\n]/g, ' ') + str.slice(b);
}

function scanInlineSpans(engine, isKeyword, mdSrc) {
  const lines = mdSrc.split('\n');

  // ── Document class ──────────────────────────────────────────────────────
  // `<!-- fence-check: migration-record -->` once near the top of a file
  // declares that the file's SUBJECT is retired syntax.  It changes the
  // DEFAULT rather than switching the check off: a failing span is reported
  // `historical` instead of `fail` — but the rewrite TARGET of a migration row
  // (right of an arrow, or the second cell of a two-column rewrite table) is
  // still `fail` when it does not parse, because that is the only text in such
  // a file an author is instructed to type.
  //
  // WHAT THIS GIVES UP, stated rather than implied (the precedent is
  // .github/CONTRIBUTING.md §3.1(f), which marks historical rows rather than hiding
  // them): in a migration-record file a genuinely FALSE claim in narrative
  // prose — a sentence asserting that a retired form is still live — is not
  // caught.  It is accepted here because these entries are dated,
  // chronological records the project already rules are read in order, and
  // because the files carrying the marker are the only ones in the corpus
  // whose subject IS retired syntax.
  const migrationRecord = MIGRATION_RECORD_RE.test(mdSrc);

  // ── Pass 1 ──────────────────────────────────────────────────────────────
  // Walk the document once: honour fences and the suspend markers, collect
  // every DIRECTIVE CANDIDATE with its global offset, and build a copy of the
  // source with all code spans (and all fenced blocks) blanked out.  The
  // blanked copy is where arrows are looked for, so FigDown's own `->`
  // operator inside a span can never split a migration row.
  const cand = [];
  let masked = mdSrc;
  let offset = 0;
  let inFence = false;
  let suspended = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = offset;
    offset += line.length + 1;

    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { masked = maskRange(masked, lineStart, lineStart + line.length); continue; }

    const trimmed = line.trim();
    if (SKIP_INLINE_RE.test(trimmed))   { suspended = true;  continue; }
    if (RESUME_INLINE_RE.test(trimmed)) { suspended = false; continue; }

    const lineSkipped = suspended || SKIP_ANYWHERE_RE.test(line);

    // A two-column rewrite table (`| Old spelling | New spelling |`) is the
    // same before/after idiom with a pipe instead of an arrow.  Detected only
    // in a migration-record file: a general 3-column reference table would
    // otherwise pair two unrelated cells.
    let cellBounds = null;
    if (migrationRecord && /^\s*\|/.test(line) && !/^\s*\|[\s:|-]+\|\s*$/.test(line)) {
      const bars = [];
      for (let k = 0; k < line.length; k++) if (line[k] === '|' && line[k - 1] !== '\\') bars.push(k);
      // Cell 1 must actually contain a code span.  spec/migrate.md:56 is
      // `| *(none — NON-MECHANICAL)* | the legacy keyword `fill <pct>% in=` |`
      // — prose on the left and the retired spelling on the right, where it is
      // the FROM, not the target.  With no span in cell 1 there is no pair.
      if (bars.length === 3 && line.slice(bars[0], bars[1]).includes('`'))
        cellBounds = bars;                          // | c1 | c2 |  → exactly 2 cells
    }

    SPAN_RE.lastIndex = 0;
    let m;
    while ((m = SPAN_RE.exec(line)) !== null) {
      const start = lineStart + m.index;
      const end   = start + m[0].length;
      masked = maskRange(masked, start, end);

      const text  = m[2].trim();
      const words = text.split(/\s+/);
      if (words.length < 2) continue;             // a bare keyword names a word
      if (!isKeyword(words[0])) continue;         // not a FigDown directive

      let tableFrom = false, tableTo = false;
      if (cellBounds) {
        if (m.index > cellBounds[0] && m.index < cellBounds[1]) tableFrom = true;
        else if (m.index > cellBounds[1] && m.index < cellBounds[2]) tableTo = true;
      }
      cand.push({ lineNo: i + 1, text, start, end, skip: lineSkipped, tableFrom, tableTo,
                  struck: line.slice(Math.max(0, m.index - 2), m.index) === '~~' });
    }
  }

  // ── Pass 2 ──────────────────────────────────────────────────────────────
  // Pair adjacent candidates joined by an arrow.  The pairing is per ADJACENT
  // PAIR rather than "everything left of the last arrow on the line": a table
  // cell often carries several arrows in unrelated sentences, and a single
  // split point would file a perfectly good span as historical.  It reaches
  // ACROSS a line break, because a migration log wraps
  //     Example: `cell 0,1 color=#eee` →
  //              `cell h2,1 fill=#eee`
  // but never across a blank line, which ends the row.
  // The arrow must sit on the LEFT span's own line with nothing but whitespace
  // between it and the right span.  Anything else — prose after the arrow, a
  // second sentence, the next table row — is not a rewrite pair.  Without this
  // the pairing leaks across consecutive table rows, which have no blank line
  // to separate them, and files live examples as historical.
  const PAIR_RE = /^[^\n]*?(?:→|->|=>)[ \t]*\n?[ \t>|]*$/;
  for (let i = 0; i + 1 < cand.length; i++) {
    if (PAIR_RE.test(masked.slice(cand[i].end, cand[i + 1].start))) {
      cand[i].rewriteFrom = true;
      cand[i + 1].rewriteTo = true;
    }
  }

  // ── Pass 3 ──────────────────────────────────────────────────────────────
  const out = [];
  for (const c of cand) {
    const text = c.text;

    if (c.skip) {
      out.push({ lineNo: c.lineNo, text, verdict: 'skip', errors: [], context: '-' });
      continue;
    }

    // Guard order matters: prose and non-FigDown spans are dismissed BEFORE
    // the retired-keyword rule, or a sentence quoting a diagnostic
    // (`size of unknown id`) would be read as a use of the retired word.
    if (PROSE_RE.test(stripQuoted(text))) continue;
    if (isNotFigdown(text)) continue;

    // The rewrite-FROM side of a migration row, and anything the author struck
    // through, is quoted on purpose.
    if (c.struck || c.rewriteFrom || c.tableFrom) {
      const r = isTemplate(text) ? null : checkInlineSpan(engine, text);
      out.push({ lineNo: c.lineNo, text, verdict: 'historical',
                 errors: r ? r.errors : [],
                 cleanLeft: !!(r && r.verdict === 'ok'),
                 context: c.struck ? 'struck' : c.tableFrom ? 'table-from' : 'rewrite-from' });
      continue;
    }

    const isTarget = c.rewriteTo || c.tableTo;

    const retired = retiredKeywordError(engine, text.split(/\s+/)[0]);
    if (retired) {
      out.push(demote(migrationRecord, isTarget,
        { lineNo: c.lineNo, text, verdict: 'fail', errors: [retired],
          context: isTarget ? 'rewrite-to' : 'keyword' }));
      continue;
    }

    // A TEMPLATE is not parsed at all.  Measured: feeding templates to the
    // engine produces answers about the PLACEHOLDERS, not about the spelling —
    // `fill=…` is "unknown color …", `figdown 0.1 <genre>` is "unknown genre
    // <genre>", `<its side exit>` is read as three positionals.  That is 240
    // false failures against this corpus.
    //
    // The cost is honest and bounded: a retired FORM written with
    // metavariables (`rank <a> <b>`) is NOT caught.  A retired KEYWORD in
    // first position still is — the rule above runs first and is
    // placeholder-insensitive by construction.
    if (isTemplate(text)) continue;

    const r = checkInlineSpan(engine, text);
    out.push(demote(migrationRecord, isTarget,
      { lineNo: c.lineNo, text, verdict: r.verdict, errors: r.errors,
        context: isTarget ? 'rewrite-to' : r.context }));
  }
  return out;
}

// In a migration-record file a failing span is never `fail`.  Which of the two
// non-failing verdicts it gets depends on which side of the row it is on:
//
//   not a target  → `historical`.  The before-column is retired by
//                   construction; that is the whole point of the column.
//
//   a target      → `stale-target`.  A migration log is CHRONOLOGICAL: entry
//                   N's target is the spelling as of version N, and a later
//                   entry moves it again.  Upgrading means applying the
//                   entries IN ORDER, so only the last entry's targets are
//                   current by construction.  Demanding that all of them parse
//                   against today's engine demands that history be rewritten
//                   every release — which is precisely what the log exists not
//                   to do.  So it is counted, printed as a worklist, and never
//                   fails the build; the shape follows comment-check's tier-2
//                   parenthesised codes and isolation-check's unmarked
//                   citations, which this project already treats as "cannot be
//                   decided by shape" rather than "wrong".
//
// Outside a migration-record file the arrow idiom is UNCHANGED: a rewrite
// target that does not parse is a plain `fail` there, which is where it
// belongs — such a document is giving a live instruction, not keeping a log.
function demote(migrationRecord, isTarget, row) {
  if (migrationRecord && row.verdict === 'fail')
    return Object.assign({}, row, {
      verdict: isTarget ? 'stale-target' : 'historical',
      context: isTarget ? row.context : 'record',
    });
  return row;
}

// ── File collection ───────────────────────────────────────────────────────────

function collectMd(arg) {
  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved)) {
    process.stderr.write('warning: path not found: ' + arg + '\n');
    return [];
  }
  const st = fs.statSync(resolved);
  if (st.isFile()) {
    return resolved.endsWith('.md') ? [resolved] : [];
  }
  if (st.isDirectory()) {
    // Recurse, skipping hidden dirs and symlinks.
    const out = [];
    for (const entry of fs.readdirSync(resolved).sort()) {
      if (entry.startsWith('.')) continue;
      const full = path.join(resolved, entry);
      const est = fs.statSync(full);
      if (est.isSymbolicLink()) continue;
      if (est.isDirectory()) {
        for (const f of collectMd(full)) out.push(f);
      } else if (entry.endsWith('.md')) {
        out.push(full);
      }
    }
    return out;
  }
  return [];
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}
function lpad(s, n) {
  s = String(s);
  return s.length >= n ? s : ' '.repeat(n - s.length) + s;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// The recursive roots.  `.` is handled separately (top-level *.md only).
const DEFAULT_ROOTS = [
  'spec', 'guide', 'skill', 'conformance',
  'examples', 'tools', 'figures', 'integrations',
];

const USAGE = [
  'fence-check.js — engine-verify ```figdown fences AND FigDown directives',
  '                 written in inline code spans, across the Markdown corpus.',
  '',
  'Usage:',
  '  node tools/fence-check.js [--strict] [--help] [<file.md | dir> ...]',
  '',
  '  --strict   exit 1 if any fence or inline span is reported as `fail`',
  '  --help     print this and exit',
  '',
  'Default roots when no path is given (relative to the project root):',
  '  .              top-level *.md only, not recursive',
  '  ' + DEFAULT_ROOTS.join('/  ') + '/',
  'All of those except `.` are walked recursively for *.md.  The run states the',
  'number of files it scanned — a gate that does not recurse is a gate that',
  'lies (spec/PROCESS.md §3.1(d)).',
  '',
  'Opt-out markers:',
  '  <!-- fence-check: skip -->           on the line BEFORE a fence: skip that fence',
  '  <!-- fence-check: skip -->           anywhere ON a line: skip that line\'s inline spans',
  '  <!-- fence-check: skip-inline -->    on its own line: suspend the inline scan',
  '  <!-- fence-check: resume-inline -->  on its own line: resume it',
  '  <!-- fence-check: migration-record --> once near the top: this file\'s subject',
  '                                       IS retired syntax — its failing spans become',
  '                                       `historical`, but the rewrite TARGET of a row',
  '                                       (right of an arrow, or cell 2 of a two-column',
  '                                       | old | new | table) is still `fail`.',
  '                                       A target that fails becomes `stale-target`:',
  '                                       counted, printed as a worklist, never gated —',
  '                                       a log is chronological, so entry N\'s target is',
  '                                       the spelling as of version N.',
  '                                       Gives up TWO things there: a false claim in its',
  '                                       narrative prose is not caught, and a wrong',
  '                                       rewrite rule will not turn the build red.',
  '                                       Read the worklist when the log\'s LAST entry',
  '                                       changes — only its targets are current.',
  '',
  'Verdicts: ok | fail | unverified | skip, plus `historical` and `stale-target`',
  'for inline spans.',
  'For a fence, `fail` is any parse error that is not a missing-declaration',
  'artefact.  For an inline span, `fail` is only a bad SPELLING — a retired',
  'keyword, a retired option key, a retired form, a bad enum value, a word not',
  'in v0.1; everything else is `unverified`.',
  '',
  'Migration rows.  Where an arrow (→, ->, =>) joins two spans on one line —',
  'the arrow being read OUTSIDE the code spans, so FigDown\'s own -> operator',
  'never splits anything — the LEFT span is the retired form, quoted on',
  'purpose: it is reported `historical`, never `fail`.  The RIGHT span is the',
  'rewrite TARGET and is checked normally; its failures are printed first.',
  'A left span that still parses clean is listed quietly at the end: such a',
  'rewrite rule is either finished or was never right.',
].join('\n');

function main() {
  const argv = process.argv.slice(2);

  let strict = false;
  const inputs = [];
  for (const a of argv) {
    if (a === '--strict') { strict = true; continue; }
    if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
    if (a.startsWith('--')) {
      process.stderr.write('unknown flag: ' + a + '\n');
      process.exit(2);
    }
    inputs.push(a);
  }

  const projectRoot = path.join(__dirname, '..');
  const searchPaths = inputs.length
    ? inputs
    : [projectRoot].concat(DEFAULT_ROOTS.map(r => path.join(projectRoot, r)));

  const enginePath = findEngine();
  if (!enginePath) {
    process.stderr.write('figdown.html not found (set $FIGDOWN_HTML or keep it next to this script)\n');
    process.exit(2);
  }

  let engine;
  try {
    engine = loadEngine(enginePath);
    buildInlineContexts(engine);
  } catch (err) {
    process.stderr.write('Failed to load engine: ' + err.message + '\n');
    process.exit(2);
  }

  // Before a single file is read: prove the citation alternative still matches.
  selfTestMigrationCitation(engine);

  // Collect .md files, deduplicating.
  const seen = new Set();
  const files = [];
  for (const sp of searchPaths) {
    // For the project root, only collect top-level .md files (not recursive).
    const resolved = path.resolve(sp);
    let candidates;
    if (resolved === projectRoot && !inputs.length) {
      // Only immediate .md files in the root dir.
      candidates = [];
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        for (const entry of fs.readdirSync(resolved).sort()) {
          if (!entry.endsWith('.md')) continue;
          candidates.push(path.join(resolved, entry));
        }
      }
    } else {
      candidates = collectMd(resolved);
    }
    for (const f of candidates) {
      if (!seen.has(f)) { seen.add(f); files.push(f); }
    }
  }

  if (!files.length) {
    process.stderr.write('No .md files found in the given paths.\n');
    process.exit(0);
  }

  // Column widths.
  const C = {
    file:    42,
    fence:    5,
    line:     4,
    verdict:  10,
  };

  const TOTAL_W = C.file + 2 + C.fence + 2 + C.line + 2 + C.verdict;
  const SEP = '-'.repeat(TOTAL_W);

  const header = [
    pad('file',    C.file),
    lpad('fence',  C.fence),
    lpad('line',   C.line),
    pad('verdict', C.verdict),
  ].join('  ');

  console.log(SEP);
  console.log(header);
  console.log(SEP);

  const rows = [];
  const inlineRows = [];
  const isKeyword = makeKeywordOracle(engine);
  let anyFail = false;

  for (const mdPath of files) {
    let src;
    try { src = fs.readFileSync(mdPath, 'utf8'); }
    catch (e) {
      process.stderr.write('Cannot read ' + mdPath + ': ' + e.message + '\n');
      continue;
    }

    const rel = path.relative(process.cwd(), mdPath);

    const fences = extractFences(src);
    for (let fi = 0; fi < fences.length; fi++) {
      const f = fences[fi];
      const result = checkFence(engine, f.src, f.skip);
      if (result.verdict === 'fail') anyFail = true;

      rows.push({
        rel,
        fenceIdx: fi + 1,
        lineNo:   f.lineNo,
        verdict:  result.verdict,
        errors:   result.errors,
      });

      const line = [
        pad(rel,              C.file),
        lpad(fi + 1,          C.fence),
        lpad(f.lineNo,        C.line),
        pad(result.verdict,   C.verdict),
      ].join('  ');
      console.log(line);
    }

    for (const s of scanInlineSpans(engine, isKeyword, src)) {
      if (s.verdict === 'fail') anyFail = true;
      inlineRows.push({ rel, lineNo: s.lineNo, text: s.text, verdict: s.verdict,
                        errors: s.errors, context: s.context, cleanLeft: s.cleanLeft });
    }
  }

  console.log(SEP);

  // ── Inline-span table (its own reported category) ──────────────────────────
  // Only non-`ok` rows are listed: an ok span is a span that already parses,
  // and listing several hundred of them would bury the ones that do not.
  const inlineShown = inlineRows.filter(r => r.verdict !== 'ok');
  if (inlineRows.length) {
    console.log('');
    console.log(SEP);
    console.log([pad('file', C.file), lpad('span', C.fence),
                 lpad('line', C.line), pad('verdict', C.verdict)].join('  ') +
                '  inline code span');
    console.log(SEP);
    let n = 0;
    for (const r of inlineShown) {
      console.log([pad(r.rel, C.file), lpad(++n, C.fence),
                   lpad(r.lineNo, C.line), pad(r.verdict, C.verdict)].join('  ') +
                  '  `' + r.text + '`');
    }
    console.log(SEP);
  }

  // Summary counts.
  const counts = { ok: 0, fail: 0, unverified: 0, skip: 0 };
  for (const r of rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  const inl = { ok: 0, fail: 0, unverified: 0, historical: 0, 'stale-target': 0, skip: 0 };
  for (const r of inlineRows) inl[r.verdict] = (inl[r.verdict] || 0) + 1;

  console.log('scanned: ' + files.length + ' Markdown files');
  console.log(
    'fences  total: ' + rows.length +
    '  ok: ' + counts.ok +
    '  fail: ' + counts.fail +
    '  unverified: ' + counts.unverified +
    '  skip: ' + (counts.skip || 0)
  );
  console.log(
    'inline  total: ' + inlineRows.length +
    '  ok: ' + inl.ok +
    '  fail: ' + inl.fail +
    '  unverified: ' + inl.unverified +
    '  historical: ' + inl.historical +
    '  stale-target: ' + inl['stale-target'] +
    '  skip: ' + (inl.skip || 0)
  );

  // Detail section for failures.
  const failures = rows.filter(r => r.verdict === 'fail');
  if (failures.length) {
    console.log('');
    console.log('Fence failures:');
    for (const r of failures) {
      console.log('');
      console.log('  ' + r.rel + '  fence #' + r.fenceIdx + ' (line ' + r.lineNo + ')');
      for (const e of r.errors) {
        console.log('    ' + e);
      }
    }
  }

  // The rewrite TARGETS of a migration row come first: a `fail` there means a
  // migration log is instructing an author to type something the engine
  // rejects, which is the one defect class nothing else in this repo checks.
  const inlineFailures = inlineRows.filter(r => r.verdict === 'fail');
  const rewriteTo = inlineFailures.filter(r => r.context === 'rewrite-to');
  const other     = inlineFailures.filter(r => r.context !== 'rewrite-to');

  if (rewriteTo.length) {
    console.log('');
    console.log('REWRITE TARGETS THAT DO NOT PARSE (' + rewriteTo.length + ') —');
    console.log('a migration row is telling an author to write this, and the engine rejects it:');
    for (const r of rewriteTo) {
      console.log('');
      console.log('  ' + r.rel + ':' + r.lineNo + '  `' + r.text + '`');
      for (const e of r.errors) console.log('    ' + e);
    }
  }

  if (other.length) {
    console.log('');
    console.log('Inline-span failures (' + other.length + '):');
    for (const r of other) {
      console.log('');
      console.log('  ' + r.rel + ':' + r.lineNo + '  `' + r.text + '`');
      for (const e of r.errors) console.log('    ' + e);
    }
  }

  // Worklist, never a failure.  See demote() for why a chronological log's
  // older targets are not defects.
  const stale = inlineRows.filter(r => r.verdict === 'stale-target');
  if (stale.length) {
    console.log('');
    console.log('STALE REWRITE TARGETS (' + stale.length + ') — worklist, not failures:');
    console.log('a rewrite target that no longer parses was correct at the release it');
    console.log('documents; it is a defect only if it is in the LAST entry, or in a document');
    console.log('whose subject is reaching the current version.');
    for (const r of stale)
      console.log('  ' + r.rel + ':' + r.lineNo + '  `' + r.text + '`');
  }

  // Quiet report: a rewrite-FROM span that still parses clean means the
  // migration rule is either already done or was never right.
  const cleanLeft = inlineRows.filter(r => r.verdict === 'historical' && r.cleanLeft);
  if (cleanLeft.length) {
    console.log('');
    console.log('Rewrite-FROM spans that still parse clean (' + cleanLeft.length + '):');
    for (const r of cleanLeft)
      console.log('  ' + r.rel + ':' + r.lineNo + '  `' + r.text + '`');
  }

  if (strict && anyFail) process.exit(1);
  process.exit(0);
}

main();
