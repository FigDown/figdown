#!/usr/bin/env node
/**
 * migrate-figdown.js — detection-based, idempotent migration toward current
 * 0.1 / freeze-candidate spellings.
 *
 * Downstream files all say `figdown 0.1` with no dev.N marker, so this tool
 * CANNOT chain by version. It applies every *mechanical* rewrite that is
 * still safe and idempotent, and **reports** issues that need a human.
 *
 * REQUIREMENT (spec core §13.4) — CUMULATIVE AND IDEMPOTENT ACROSS VERSIONS,
 * not merely correct for the latest hop. Every rewrite the project has ever
 * shipped stays in this file; a document from ANY earlier version must reach
 * the current one in a SINGLE run; running on an already-current document
 * must change nothing. Do not delete a rule because "nobody is still on that
 * version" — accumulating the 0.x rewrites is the rehearsal for v1.0's
 * machinery, and a chain never run end to end has not been rehearsed.
 *
 * Safe mechanical rewrites (applied with --write):
 *   render          → layout          (line-initial keyword)
 *   line            → threshold       (zone marker; not SVG/CSS "line")
 *   colw            → width
 *   trunk           → bundle
 *   color=          → fill=  OR DELETED  (option key; see --color-means)
 *   w= / h=         → width= / height=  (option keys)
 *   dir=            → extend=         (option key on `band`)
 *   band a-b%       → band a..b%      (`RANGE-SPELLING` — ONE range grammar)
 *   kind=<map>      → shape=<geom>    (known kind map; unknown → report)
 *                     (`fill <range> in=` → `band …` was here until 0.1;
 *                     see the report-only list — its output has not parsed
 *                     since `BAND-LABEL-STATUS` made the `band` label mandatory)
 *   via=x,y;x,y       → via=(x,y),(x,y),…  (0.1; ";" reserved)
 *   pin at=x,y      → at=(x,y)          (0.1; every point is parenthesised)
 *   cell r,c        → cell (r,c)
 *   rank a b c      → rank a,b,c        (0.1; the space form is retired)
 *   width auto 90   → width auto,90     (0.1; same)
 *   bundle … a--b c--d → a--b,c--d      (0.1; same)
 *   field a:1, b:2  → field a:1,b:2     (0.1; a comma list is ONE token)
 *   field Name 8    → field "Name" 8    (0.1; classic name is a string)
 *   labels="a,b"    → labels=a,b        (0.1; per-element quoting — the
 *                     whole-value form used to be split on every comma, so this
 *                     is what PRESERVES the old meaning, not a cosmetic change)
 *   text=           DELETED             (0.1 renamed it color=, which
 *                     0.1 retired outright — v0.1 has NO label-colour key)
 *   z=              REPORT-ONLY          (renamed z-index=;
 *                     z-index= was legal on `plane` and nowhere else and went
 *                     with it, `PAINT-ORDER-CONSTRUCT`)
 *   threshold at=   → threshold offset=
 *   fill= on edge/threshold/bundle → stroke=, or DELETED when stroke= is already
 *                     present (0.1; both preserve the drawing exactly)
 *   edge-only `class … fill=` → stroke=
 *   unit=           → word=             (`BITS-PER-ROW-KEY-NAMING`)
 *   boundary        → external          (`EXTERNAL-ENDPOINT-NAMING`; line-initial keyword)
 *   wrap            → break             (`ROW-BREAK-NAMING`; bitfield child keyword)
 *   layer / layer=  REPORT-ONLY          (renamed plane / plane=,
 *                     `PLANE-KEYWORD-SPELLING`; `plane` was WITHDRAWN, `PAINT-ORDER-CONSTRUCT`, so the
 *                     rewrite's target no longer exists — the `route`→`path`
 *                     shape)
 *   labels=         → data=             (`SIGNAL-DATA-KEY-SPELLING`)
 *   plot            → chart             (`CHART-BLOCK-NAMING`; line-initial keyword)
 *   guide           → threshold         (`THRESHOLD-KEYWORD-SPELLING`; line-initial keyword)
 *   note=           → description=      (`DESCRIPTION-KEY-SPELLING`)
 *   wave            → timing            (`TIMING-GENRE-NAMING`; genre token AND
 *                     the block opener keyword)
 *   field … optional → field … present=""  (`PRESENCE-CONDITION-EXPRESSION`; the FLAG
 *                     position only. The condition itself is NOT lifted)
 *   chart … level=  → level= DELETED    (`CHART-LEVEL-KEY`; the construct is gone,
 *                     so removing the token is the only rewrite there is)
 *   size <id> …      → folded onto the id's `pin` line, or renamed `pin`
 *                     when the id has no pin line (`ELEMENT-GEOMETRY-DIRECTIVE`). The one
 *                     WHOLE-FILE rule in this table: its two cases depend on
 *                     what other lines say, so it runs as a pass after the
 *                     per-line map. See applySizeMerge().
 *   # r25: decorative → # decorative   (0.1; the strip-check.js opt-out
 *                     marker drops its internal item-code prefix. The only
 *                     rewrite in this file that acts on a COMMENT)
 *   bitfield b Hdr  → bitfield b "Hdr"  (`RULE-POSITION-ENUMERATION`; the typed-block
 *                     openers `bitfield` `table` `timing` join the labelled
 *                     positions that already required quotes. A MULTI-WORD
 *                     bare label is REPORTED, not rewritten — two readings)
 *   shape="box"     → shape=box         (`RULE-POSITION-ENUMERATION`; RULE 2.4's enum
 *                     half, at every enum and bare-flag position:
 *                     `shape=` `style=` `numbering=` `extend=` `type=`,
 *                     `figdown "0.1"`, `figdown 0.1 "block"`, `flow "down"`,
 *                     `cell 1 "highlight"`. Pure spelling: the value inside
 *                     the quotes was already the value the engine used)
 *
 * --color-means=fill | --color-means=text
 *   `color=` alone does not say which version wrote it: in one era it
 *   set the FILL, in another it set the LABEL. 0.1
 *   retired the key language-wide (`COLOUR-KEY-STATUS`) precisely BECAUSE no engine can tell
 *   the two apart. The tool NEVER guesses. Four disjoint modes, one rewrite
 *   each, and each rewrite removes the token its own pattern matches — so
 *   every mode is idempotent and no two rewrites are enabled in one run:
 *       no flag             `text=` DELETED  (it was the label colour)
 *       --color-means=fill  `color=` → `fill=`   (a pre-0.1 corpus)
 *       --color-means=text  `color=` DELETED     (a pre-release corpus)
 *       (no flag, color= present, no text=)  → reported, never rewritten
 *   A file containing BOTH keys is a contradiction under every version of the
 *   language: it is reported and never rewritten.
 *
 *   THREE REFUSALS guard the two flags, because each mode is an assertion
 *   about WHEN the file was written and a wrong assertion writes a wrong
 *   figure that reports success:
 *     (a) --color-means=fill REFUSES a file that also writes `fill=`. Such a
 *         file parses under 0.1+ and therefore cannot be
 *         pre-0.1, where `fill=` did not exist. Without this, `node a
 *         "A" color=#ffffff` (a white LABEL) was rewritten to
 *         `fill=#ffffff` (a white BOX) and reported `mechanical: 1  report
 *         items: 0` — a wrong figure declared a success.
 *     (b) --color-means=text REFUSES a file carrying any pre-0.1
 *         spelling (`w=` `h=` `unit=` `boundary` `wrap` `optional` `via=`
 *         `layer` `dir=` `kind=`). A file old enough to write those cannot
 *         be a 0.1+ file. 176 of the 425 colour-bearing files in the
 *         measured downstream corpus carry one.
 *     (c) EVERY write is parsed before it lands. A file whose rewritten text
 *         does not parse under the reference engine is refused and reported,
 *         never written. A mixed file used to emit `fill=X fill=Y` — a
 *         `duplicate option` line error — and still be counted `mechanical`.
 *
 *   WHAT THE MESSAGES SAY, AND WHAT THEY MAY NOT. The refusals
 *   above name a fact about the file in front of the user — "this file also
 *   writes `fill=`" — and that is the only shape this family is allowed to
 *   have. Until 0.1 `color-ambiguous` had the opposite shape: it
 *   asked the reader to say which PRE-RELEASE their document came from, a
 *   property no document records (downstream every file says `figdown 0.1`)
 *   and no reader can check. All four era branches are now spelled by the
 *   evidence the refusals already read — `fill=` present, a pre-LABEL-era
 *   spelling present, both, or NEITHER, which is stated plainly rather than
 *   papered over. The version numbers still in this file are `MIGRATIONS`
 *   citations: this repository's own history, which is a fact, not a
 *   classification the user is asked to perform.
 *
 * Detection only (never auto-rewritten):
 *   index="… step …"  `step` is RESERVED inside an `index=` range at
 *                   0.1 (`RULE-POSITION-ENUMERATION`), so a prose `<last>` containing a bare
 *                   lowercase `step` token is now a LINE ERROR. There is no
 *                   rewrite, and the reason is the reservation's own: the tool
 *                   cannot tell prose that happens to read like a step clause
 *                   ("0..7 step 2" written as documentation) from an author
 *                   who meant "every other element" — which is exactly the
 *                   ambiguity the reservation exists to make impossible in
 *                   future. Guessing either way would write a meaning the
 *                   author did not. It REPORTS, with both respellings.
 *
 *   path / routing  WITHDRAWN from the language (`EDGE-GEOMETRY-CONSTRUCTS`), together
 *                   with `points=`, `tailport=`, `headport=`, `routing=` and
 *                   their pre-0.1 spellings `via=`, `src=`, `dst=`, and
 *                   the pre-0.1 keyword `route`.
 *
 *                   THIS ONE IS DIFFERENT FROM EVERY OTHER ENTRY IN THIS FILE,
 *                   and the difference is the point. Every previous retirement
 *                   gave this tool a REWRITE RULE, because every previous
 *                   retirement named a replacement spelling. This one names
 *                   none: the constructs are gone and nothing in v0.1 does what
 *                   they did. The correct action is to DELETE the line — and
 *                   deleting it CHANGES THE RENDERED OUTPUT, because the edge
 *                   stops following the author's geometry and starts following
 *                   auto layout. A tool that silently deleted the line would be
 *                   silently redrawing the figure, which is the one thing a
 *                   migration tool must never do.
 *
 *                   So it REPORTS and does not rewrite. It prints each line, in
 *                   full, with the instruction to delete it and check the
 *                   result, and it suppresses the older rewrites that used to
 *                   feed these lines (`route`→`path`, `via=`→`points=`,
 *                   `src=`/`dst=`→`tailport=`/`headport=`, the `;`→paren point
 *                   list, and the `path tailport=`/`headport=` paren rewrite) —
 *                   a rewrite whose OUTPUT is a hard error is not a migration.
 *                   Those rules stay documented here rather than being erased,
 *                   because core §13.4 makes this file the cumulative record of
 *                   every hop the project has shipped; what changed is that the
 *                   chain now terminates in a withdrawal instead of a spelling.
 *
 *                   NOTE ON THE FREEZE CONTRACT: the promise of mechanical
 *                   migration covers FROZEN constructs. `path` and `routing`
 *                   were EXPERIMENTAL — outside the v0.1 conformance surface
 *                   and outside the compatibility promise — so no promise is
 *                   broken by their having no mechanical path forward. See
 *                   spec/migrations.md 0.1 and spec/core.md §9 `EDGE-IDENTITY-AND-GEOMETRY`.
 *   field <Spaced Name>:<w>   compact-form item name with unquoted spaces —
 *                   0.1 requires quotes. Report-only: some of these
 *                   lines have NO correct compact rewrite (a name containing
 *                   a comma cannot be spelled in the compact form at all and
 *                   must move to the classic form), and `field Total Length 16`
 *                   — the classic spelling with the same defect — sits one
 *                   token away, so the intended form is an author decision.
 *                   The report prints the exact quoted line to paste.
 *   shape=cloud     retired 0.1; the replacement depends on INTENT
 *                   (label + class / group / ellipse), so it is listed, not
 *                   rewritten — MIGRATIONS 0.1 is NON-MECHANICAL
 *   kind=cloud      same reason: its 0.1 target no longer exists
 *   bitfield without numbering=
 *   node / edge under pure bitfield|table|wave (`GENRE-KEYWORD-ALLOWLIST`)
 *   experimental genre headers (topology|flowchart|wave) when --flag-experimental
 *   duplicate * fields in one bitfield (needs author choice)
 *   present= condition  a field that WAS `optional` and carries prose next to
 *                   it. The flag is rewritten to `present=""` mechanically;
 *                   lifting a condition OUT of that prose is NON-MECHANICAL
 *                   and is reported with the text quoted. Most descriptions
 *                   are not conditions, and inventing one is worse than
 *                   leaving `present=""` — which says exactly what the bare
 *                   flag said.
 *   cell (r,c) … highlight  the row tint and a cell fill are one channel
 *                   (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`); both are now line errors, and which
 *                   one the author meant is not derivable.
 *   kind=bars3d     `plot kind=bars3d` became `chart type=bar3d` (
 *                   `CHART-BLOCK-NAMING`). Report-only: `kind=` still has a SECOND retired
 *                   meaning on `node` (→ `shape=`) whose target
 *                   depends on the value, so one key cannot be rewritten blind.
 *   signal lane 2-9 the wave lane digits `2`-`9` were retired (
 *                   `TIMING-LANE-ALPHABET`). Report-only and NON-MECHANICAL: `=` is the
 *                   replacement brick but each one needs a `data=` entry that
 *                   only the author can supply.
 *   fill <range> in=  the zone band spelled with the keyword `fill`. It became
 *                   `band` — and then `BAND-LABEL-STATUS` gave `band` a mandatory quoted
 *                   label the legacy form has no slot for, so the rewrite's
 *                   OUTPUT stopped parsing and REFUSAL (c) has
 *                   been silently blocking it ever since. Report-only from
 *                   0.1, with the exact line to paste.
 *   band <range>%   `band` gained a MANDATORY quoted label
 *                   (`BAND-LABEL-STATUS`), written first: `band "Headroom" 15..35% in=pool`.
 *                   Report-only and NON-MECHANICAL — the name is the whole
 *                   point of the change and only the author has it.
 *
 * The conformance corpus is REFUSED, not merely discouraged.
 * `conformance/`, `conformance/cases/` and `conformance/experimental/` throw
 * before a single file is read, with or without --write, and there is no
 * override flag. Those fixtures are FULL of retired spellings on purpose —
 * that is what they test — so the tool would happily "migrate" a retirement
 * test into a passing one and delete the coverage; it did
 * exactly that to four fixtures and only a final audit caught it. Point the
 * tool at the authoring corpus (examples/, figures/, a downstream docs tree);
 * update conformance goldens with `node conformance/run.js --update` instead.
 *
 * Usage:
 *   node tools/migrate-figdown.js [--write] [--flag-experimental] <file.fd|dir> ...
 *   node tools/migrate-figdown.js --dry-run examples/   (default is dry-run)
 *
 * Exit 1 if any file still has report-only problems after rewrites (or would,
 * in dry-run, need human attention). Exit 0 if clean or only mechanical fixes.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// REFUSAL (c), 0.1: the tool parses its own output and refuses to write
// a file that does not parse. A rewrite that produces a line error is not a
// migration, and reporting it as `mechanical` is worse than not running at all
// — a mixed file used to emit `fill=X fill=Y` (a `duplicate option` line
// error) and still be counted a success. The reference engine is the single
// source of truth here, extracted from editor/figdown.html the same way
// build-svg.js and reference-coverage.js extract it (regenerate, never fork).
let __engine = null;
function engineParse(text) {
  if (!__engine) {
    const cands = [
      process.env.FIGDOWN_HTML,
      path.join(__dirname, 'figdown.html'),
      path.join(__dirname, '..', 'editor', 'figdown.html'),
    ].filter(Boolean);
    const enginePath = cands.find(f => fs.existsSync(f));
    if (!enginePath) throw new Error('figdown.html not found (set FIGDOWN_HTML)');
    const h = fs.readFileSync(enginePath, 'utf8');
    const start = h.indexOf('const SHAPES');
    const end = h.indexOf('// 3. UI');
    if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + enginePath);
    __engine = new Function(h.slice(start, end) + '\nreturn {parse};')();
  }
  return __engine.parse(text);
}

// REFUSAL (c), the decision itself — ONE implementation, so the gate that
// proves it (tools/migrate-check.js) tests the code that runs, not a second
// copy of it. Returns the errors the rewrite INTRODUCED: a file that did not
// parse before is not held against the rewrite (this tool exists to migrate
// documents that are broken under the current spec), but a rewrite that adds
// a new line error is refused and reported, never written.
function introducedErrors(before, after) {
  if (before === after) return [];
  const b = engineParse(before).errs || [];
  const a = engineParse(after).errs || [];
  return a.filter(e => !b.includes(e));
}

const KIND_MAP = {
  decision: 'diamond',
  terminator: 'rounded',
  datastore: 'cylinder',
  switch: 'rounded',
  router: 'rounded',
  // `cloud` is deliberately ABSENT: the 0.1 mapping sent it to
  // shape=cloud, which was itself retired (`SHAPE-ENUM-VOCABULARY`). Falling
  // through to the report path is the correct behaviour — see RETIRED_SHAPES.
  process: null, // delete kind=
  host: null,
  port: null,
};

// Retired shape VALUES. Detection only: `shape=ellipse` reproduces the
// drawing, but only the author knows whether the drawing was the point —
// a "Network" cloud wants its meaning in the label plus a `class`, a region
// with elements inside wants a `group`, and a callout wants a construct
// FigDown does not have yet (core §9 `NON-GRAPH-ANNOTATION-NODE`). MIGRATIONS 0.1 marks
// this rule NON-MECHANICAL, so the tool must not guess.
const RETIRED_SHAPES = {
  cloud: 'shape=cloud is retired (`SHAPE-ENUM-VOCABULARY`) — NON-MECHANICAL: shape=ellipse keeps the drawing, but move the meaning into the label (+ a class), or use a group; a callout has no v0.1 replacement (`NON-GRAPH-ANNOTATION-NODE`)',
};

function parseArgs(argv) {
  const out = { write: false, flagExp: false, colorMeans: null, paths: [] };
  for (const a of argv) {
    if (a === '--write') out.write = true;
    else if (a === '--dry-run') out.write = false;
    else if (a === '--flag-experimental') out.flagExp = true;
    else if (a === '--color-means=fill') out.colorMeans = 'fill';
    else if (a === '--color-means=text') out.colorMeans = 'text';
    else if (a.startsWith('-')) throw new Error('unknown flag ' + a);
    else out.paths.push(a);
  }
  if (!out.paths.length) out.paths.push('.');
  return out;
}

// HARD GUARD. The conformance corpus is deliberately full of
// RETIRED spellings — that is the coverage. Running this tool over it turns a
// retirement test into a passing one and deletes the test silently. At
// 0.1 exactly that happened to four fixtures and was caught only by a
// final audit, so the prose warning in the header is no longer the mechanism:
// the tool REFUSES the path. There is no override flag, because a legitimate
// need does not exist — goldens move with `node conformance/run.js --update`.
// tools/migrate-fixtures/ joins the refusal for the identical
// reason: its inputs are RETIRED spellings on purpose — they are this tool's
// own test corpus — and a `--write` run over them would rewrite every input
// into its own expected output and report every fixture as passing.
const FORBIDDEN_DIRS = ['cases', 'experimental'];
const FIXTURE_DIR = 'migrate-fixtures';
function assertNotConformance(p) {
  const parts = path.resolve(p).split(path.sep);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === FIXTURE_DIR) {
      throw new Error(
        'refusing to touch the migration fixture corpus: ' + p + '\n' +
        '  tools/migrate-fixtures/ holds RETIRED spellings on purpose — they are the\n' +
        '  INPUTS this tool is tested against. A --write run over them would rewrite\n' +
        '  each input into its own expected output and then agree with itself. Use\n' +
        '  `node tools/migrate-check.js --update` to move those goldens. No override exists.'
      );
    }
    if (parts[i] === 'conformance' && (i + 1 >= parts.length || FORBIDDEN_DIRS.includes(parts[i + 1]))) {
      throw new Error(
        'refusing to touch the conformance corpus: ' + p + '\n' +
        '  conformance/cases/ and conformance/experimental/ hold RETIRED spellings on\n' +
        '  purpose; migrating them deletes the retirement coverage. Use\n' +
        '  `node conformance/run.js --update` to move goldens. No override exists.'
      );
    }
  }
}

function walk(p, acc) {
  assertNotConformance(p);
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    const base = path.basename(p);
    if (base === 'node_modules' || base === '.git') return;
    if (base === FIXTURE_DIR) {
      throw new Error(
        'refusing to descend into ' + p + ' — this tool\'s own fixture corpus is not\n' +
        '  migratable (retired spellings are the inputs). Use `node tools/migrate-check.js`.'
      );
    }
    if (base === 'conformance') {
      throw new Error(
        'refusing to descend into ' + p + ' — the conformance corpus is not migratable\n' +
        '  (retired spellings are the coverage). Use `node conformance/run.js --update`.'
      );
    }
    for (const name of fs.readdirSync(p)) walk(path.join(p, name), acc);
  } else if (p.endsWith('.fd')) acc.push(p);
}

// Same comment rule as the engine's findComment: `#` opens a
// comment only at line start or after whitespace — so `fill=#0d9488` survives —
// and the in-string state honours the \n \" \\ escapes. This tool used to cut
// at ANY unquoted `#`, which truncated every line carrying a hex colour; the
// rewrites that rebuild a line from its tokens would have dropped the colour.
function stripComment(line) {
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ && c === '\\' && i + 1 < line.length) { i++; continue; }
    if (c === '"') { inQ = !inQ; continue; }
    if (c === '#' && !inQ && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

// Apply `fn` to the CODE portions of a line only: outside double quotes and
// before an unquoted `#`. Option-key renames must never reach a label or a
// comment — `note="w=1"` is data, not a `w=` option.
function mapCode(line, fn) {
  let inQ = false, out = '', buf = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ && c === '\\' && i + 1 < line.length) { out += c + line[i + 1]; i++; continue; }
    if (c === '"') { if (!inQ) { out += fn(buf); buf = ''; } inQ = !inQ; out += c; continue; }
    if (c === '#' && !inQ && (i === 0 || /\s/.test(line[i - 1]))) { out += fn(buf); return out + line.slice(i); }
    if (inQ) out += c; else buf += c;
  }
  return out + fn(buf);
}

// 0.1 option-key renames. `(^|\s)` anchors the key so the rewrite is
// idempotent: `width=` has no bare `w=` and `height=` no bare `h=`.
// `EDGE-GEOMETRY-CONSTRUCTS` — the WITHDRAWN edge-geometry family, in every spelling it
// ever had. Matching is deliberately generous across history so that a document
// from ANY earlier version lands on this report rather than on a rewrite whose
// output the engine rejects:
//
//   line-initial   `path` (0.1+), `route` (pre-0.1), `routing`
//   option keys    `points=` `tailport=` `headport=` `routing=` (0.1+),
//                  `via=` `src=` `dst=` (pre-0.1)
//
// REPORT-ONLY BY CONSTRUCTION. There is no replacement spelling, the correct
// action is to delete the line, and deleting it changes the rendered output —
// so only the author can take it. See the header note for why that differs
// from every other entry in this file.
const WITHDRAWN_KW_RE = /^(path|route|routing)(\s|$)/;

// 0.1 — the `strip-check.js` decorative opt-out marker lost its internal
// item-code prefix. Anchored on the whole line (leading whitespace captured
// and preserved) so it can only ever match a comment-only line, which is what
// the marker is.
const DECORATIVE_OLD_RE = /^(\s*)#\s*r25:\s*decorative\b/;
const WITHDRAWN_OPT_RE = /(^|\s)(points|tailport|headport|routing|via|src|dst)=/;

// `PAINT-ORDER-CONSTRUCT`: the withdrawn PLANE family. Same shape as the edge-
// geometry family above and for the same reason — `layer`/`layer=` were
// renamed `plane`/`plane=` and `z=` was renamed `z-index=` at
// 0.1, and `PAINT-ORDER-CONSTRUCT` withdrew all three targets, so every one of those
// rewrites would now emit a hard error. A rewrite whose output does not parse
// is not a migration, so the six spellings are DETECTED AND REPORTED and the
// line is returned unchanged for a human to delete.
const WITHDRAWN_PLANE_KW_RE  = /^(plane|layer)(\s|$)/;
const WITHDRAWN_PLANE_OPT_RE = /(^|\s)(plane|layer|z|z-index)=/;
// `SCENE-KEYWORD-MEMBERSHIP`: `bundle` is declared by `topology` alone. `trunk` was
// renamed `bundle` at an earlier release and that rewrite is still correct
// under `topology`; under any other genre its output is a line error, so the
// line is reported instead. This is the FIRST rule in this tool whose
// suppression is per GENRE rather than per release, which is the ruling
// showing up in the migration surface: a word can be live in one genre and
// gone from another, so a rewrite has to know which document it is in.
const GENRE_WITHDRAWN_KW_RE  = /^(bundle|trunk|threshold|band|guide|group|external)(\s|$)/;
const GENRE_KEEPS = {
  block:      new Set(['group', 'external', 'threshold', 'band', 'guide']),
  topology:   new Set(['group', 'external', 'bundle', 'trunk']),
  flowchart:  new Set(['external']),
  statechart: new Set([]),
};
// `MEMBERSHIP-KEY-ACCEPTANCE`: the OPTION-KEY half of the same rule. `in=` named a
// `group` id and nothing else, so withdrawing `group` from `flowchart` and
// `statechart` left the key accepted there with no value that could resolve;
// `MEMBERSHIP-KEY-ACCEPTANCE` withdrew the key from both genres. REPORTED, never rewritten, for the
// same reason the keyword half is: there is nothing to rewrite it TO. The key
// is untouched in `block` and `topology`, so the map is keyed by genre.
const GENRE_WITHDRAWN_OPT_RE = /(^|\s)in=/;
const GENRE_DROPS_OPT = {
  flowchart:  new Set(['in']),
  statechart: new Set(['in']),
};

// A rename entry is [pattern, replacement, label] and may carry a FOURTH
// element: the DIRECTIVE the rewrite is scoped to. Absent means language-wide,
// which is what every 0.1/37 entry wants — those keys left the language
// outright, so wherever the old spelling appears the new one is correct.
// A scoped entry fires only on a line whose first word is that directive; the
// test is `parenPointOpt`'s, reused rather than reinvented (see `lineDirectiveIs`).
const OPT_RENAMES = [
  [/(^|\s)w=/g, '$1width=', 'w=→width='],
  [/(^|\s)h=/g, '$1height=', 'h=→height='],
  [/(^|\s)dir=/g, '$1extend=', 'dir=→extend='],
  // 0.1 (the terminology batch). Every one is a pure spelling swap
  // with no value-shape change, so all are safe and idempotent: the old key
  // is a hard error, so a rewritten file can never match again.
  [/(^|\s)unit=/g, '$1word=', 'unit=→word='],
  // `via=`→`points=` and `src=`/`dst=`→`tailport=`/`headport=` (
  // `WAYPOINT-KEY-SPELLING`/`ENDPOINT-DOCKING-KEYS`) stood here until 0.1. `EDGE-GEOMETRY-CONSTRUCTS` withdrew their TARGETS, so the
  // rewrites would have produced hard errors; the six keys are now handled by
  // the report-only withdrawal detection (see WITHDRAWN_RE below).
  [/(^|\s)labels=/g, '$1data=', 'labels=→data='],
  // `layer=`→`plane=` (`PLANE-KEYWORD-SPELLING`) stood here until 0.3. `PAINT-ORDER-CONSTRUCT`
  // withdrew its TARGET, so the rewrite would have produced a hard error; the
  // key is now handled by the report-only withdrawal detection below, exactly
  // as `via=`/`src=`/`dst=` have been.
  // 0.1 (`DESCRIPTION-KEY-SPELLING`). `note=` → `description=`, SCOPED TO `field` LINES.
  //
  // `DRAWN-ANNOTATION-FORM` REVIVED the spelling: `note=` is live language-wide
  // again, as the DRAWN annotation, on node/process/decision/terminator/
  // state/group/edge/flowline/transition/title. This rule was line-agnostic
  // until then, and left that way it would have fired on every one of those
  // lines and SILENTLY CONVERTED A DRAWN NOTE INTO A TOOLTIP — deleting ink
  // the author asked for, with no diagnostic, in the one tool whose whole
  // job is to be trusted unattended. That is worse than any error it could
  // have reported.
  //
  // `field` is the correct and complete scope because it is the ONLY place
  // `note=` was ever legal: `DESCRIPTION-KEY-SPELLING` renamed the key on the directive that had
  // it, and no other directive accepted the spelling in any release. So a
  // `note=` on a `field` line is unambiguously the retired tooltip key and
  // the rewrite is right; a `note=` anywhere else is either the new drawn
  // annotation (leave it alone) or a key that directive never took (the
  // engine's own error, not this tool's business to guess at).
  //
  // Still idempotent, and now for two reasons: `note=` on a `field` remains
  // a hard error at every version (`DRAWN-ANNOTATION-FORM`'s `field` refusal), and the rewrite
  // eliminates the token its own pattern matches.
  [/(^|\s)note=/g, '$1description=', 'note=→description=', 'field'],
];

// The DIRECTIVE-SCOPE test, extracted from `parenPointOpt` so the two agree
// by construction: a line belongs to directive `kw` when the code portion's
// first word is `kw`.
const lineDirectiveIs = (line, kw) =>
  new RegExp('^\\s*' + kw + '(\\s|$)').test(stripComment(line));

// A `field` line in the COMPACT form whose item name contains unquoted spaces
// Returns the suggested quoted line, or null when the line is
// not a compact-form line or needs no change.
function quoteCompactFieldNames(code) {
  const t = code.trim();
  if (!/^field\s/.test(t)) return null;
  const rest = t.replace(/^field\s+/, '')
                .replace(/\s*\b[A-Za-z_][A-Za-z0-9_-]*=(?:"(?:[^"\\]|\\.)*"|\S*)/g, '').trim();
  if (!rest.includes(':')) return null;                       // classic form
  if (/^(?:"(?:[^"\\]|\\.)*"|\S+)\s+(\d+|\*)(\s+optional)?$/.test(rest)) return null;
  let touched = false;
  const items = rest.split(',').map(raw => {
    const it = raw.trim();
    const m = /^(.+):(\d+|\*)$/.exec(it);
    if (!m) return it;
    const nm = m[1].trim();
    if (!/\s/.test(nm) || /^".*"$/.test(nm)) return it;
    // `field a:1 b:2` is a FORGOTTEN COMMA, not a spaced name: the engine
    // reports it as such and quoting it (`"a:1 b":2`) would be wrong.
    if (/:(?:\d+|\*)(?:\s|$)/.test(nm)) return it;
    touched = true;
    return '"' + nm + '":' + m[2];
  });
  // Joined with a BARE comma, not ", ": `COMMA-LIST-WHITESPACE` makes a comma list
  // ONE whitespace-free token, and the space form is exactly what the
  // `field compact list → one token` rewrite below removes. Until 0.1
  // this suggestion printed the retired spelling for the author to paste —
  // the tool teaching the form it migrates away from. Found by
  // tools/migrate-check.js fixture 604.
  return touched ? 'field ' + items.join(',') : null;
}

// ---------------------------------------------------------------------------
// 0.1 helpers — the punctuation/quoting scheme.
//
// Every rule below is written so that applying it twice is the same as
// applying it once: each pattern matches only the RETIRED spelling, and the
// rewrite produces a form the pattern cannot match. That is the whole
// idempotence argument for this release; 0.1 needs a stronger one and
// states it separately.
// ---------------------------------------------------------------------------

// Tokenize the CODE portion of a line the way the engine does: a token is a
// maximal run of non-whitespace in which quoted regions may appear anywhere.
// Returns [{text, quoted}] where `text` is the SOURCE text of the token
// (quotes included) so a rewrite can splice it back verbatim.
function codeTokens(code) {
  const toks = [];
  let i = 0;
  while (i < code.length) {
    while (i < code.length && /\s/.test(code[i])) i++;
    if (i >= code.length) break;
    const start = i;
    let sawQuote = false, allQuoted = true;
    while (i < code.length && !/\s/.test(code[i])) {
      if (code[i] === '"') {
        sawQuote = true; i++;
        while (i < code.length && code[i] !== '"') { if (code[i] === '\\') i++; i++; }
        i++; continue;
      }
      allQuoted = false; i++;
    }
    toks.push({ text: code.slice(start, i), quoted: sawQuote && allQuoted });
  }
  return toks;
}
const isOptTok = t => !t.quoted && /^[A-Za-z_][A-Za-z0-9_-]*=/.test(t.text);
// Rewrite whole `key=value` OPTION tokens (value SOURCE text, quotes
// included). `fn(key, valueSource)` returns the replacement token text, or
// null to leave the token alone.
function mapCode2(line, fn) {
  const code = stripComment(line);
  const tail = line.slice(code.length);
  const toks = codeTokens(code);
  let out = code, changed = false;
  const pieces = [];
  let idx = 0;
  for (const t of toks) {
    const at = code.indexOf(t.text, idx);
    const m = isOptTok(t) ? /^([A-Za-z_][A-Za-z0-9_-]*)=([\s\S]*)$/.exec(t.text) : null;
    if (m) {
      const rep = fn(m[1], m[2]);
      if (rep !== null && rep !== undefined && rep !== t.text) {
        pieces.push([at, t.text.length, rep]);
        changed = true;
      }
    }
    idx = at + t.text.length;
  }
  if (!changed) return null;
  for (const [at, len, rep] of pieces.reverse()) out = out.slice(0, at) + rep + out.slice(at + len);
  return out + tail;
}
// Join retired space-form list elements into the one comma-delimited token.
const joinList = toks => toks.map(t => t.text.replace(/,+$/, '')).filter(Boolean).join(',');

// `key=<num>,<num>` -> `key=(<num>,<num>)` on the named directive only.
// `guide at=50%` is single-valued and is deliberately left alone.
function parenPointOpt(line, kw, keys) {
  if (!lineDirectiveIs(line, kw)) return null;
  let after = line;
  for (const k of keys) {
    after = mapCode(after, seg => seg.replace(
      new RegExp('(^|\\s)' + k + '=(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)(?=\\s|$)', 'g'),
      '$1' + k + '=($2,$3)'));
  }
  return after !== line ? after : null;
}

// Retired SPACE form of a variable-length positional list -> the comma form.
// `skip` is how many positionals the directive owns before the list starts
// (`rank` 0, table `width` 0, `bundle` 1 id + an optional quoted label).
function commaJoinList(line, kw, skip, labelOptional) {
  const code = stripComment(line);
  const m = new RegExp('^(\\s*)' + kw + '(\\s+)([\\s\\S]*)$').exec(code);
  if (!m) return null;
  const toks = codeTokens(m[3]);
  const opts = toks.filter(isOptTok);
  let pos = toks.filter(t => !isOptTok(t));
  const head = [];
  for (let k = 0; k < skip && pos.length; k++) head.push(pos.shift());
  if (labelOptional && pos.length && pos[0].quoted) head.push(pos.shift());
  if (pos.length < 2) return null;                    // already one token
  const joined = joinList(pos);
  // Preserve the run of trailing whitespace inside `code`: it is the column
  // padding in front of an aligned `#` comment, and dropping it glues the
  // `#` to the last token — where it stops being a comment introducer at all
  // (`rank l2,l3# note` makes `l3#` an illegal id).
  const pad = /\s*$/.exec(code)[0];
  const rebuilt = m[1] + kw + m[2] +
    head.concat([{ text: joined }], opts).map(t => t.text).join(' ') + pad;
  const tail = line.slice(code.length);               // preserve the comment
  return rebuilt === code ? null : rebuilt + tail;
}

// Classic `field <bare name> <width>` -> `field "<bare name>" <width>`
// (`QUOTING-RULES`: a whitespace-delimited string position is quoted). Compact-form
// lines (`field a:1,b:2`) never match, because their first token carries a
// `:` and no second positional is a bare width.
function quoteClassicFieldName(line) {
  const code = stripComment(line);
  const m = /^(\s*)field(\s+)([\s\S]*)$/.exec(code);
  if (!m) return null;
  const toks = codeTokens(m[3]);
  const pos = toks.filter(t => !isOptTok(t));
  if (pos.length < 2) return null;
  if (pos[0].quoted) return null;                     // already quoted
  if (!/^(\d+|\*)$/.test(pos[1].text)) return null;   // not the classic form
  if (/[":]/.test(pos[0].text)) return null;          // not a bare simple name
  const idx = m[1].length + 'field'.length + m[2].length;
  return line.slice(0, idx) + '"' + pos[0].text + '"' + line.slice(idx + pos[0].text.length);
}

/**
 * `RULE-POSITION-ENUMERATION`: quote a typed-block opener's bare label.
 *   bitfield b Hdr numbering=msb0  →  bitfield b "Hdr" numbering=msb0
 * Returns {text} when it rewrote, {report} when the label is multi-word and
 * only the author can say where the string ends, and null when there is
 * nothing to do. The `pos[1]` id is left alone — it is an id position and a
 * quoted id has been a line error.
 */
function quoteBlockLabel(line) {
  const code = stripComment(line);
  const m = /^(\s*)(bitfield|table|timing)(\s+)([\s\S]*)$/.exec(code);
  if (!m) return null;
  const toks = codeTokens(m[4]);
  const pos = toks.filter(t => !isOptTok(t));
  if (pos.length < 2) return null;                 // no label written
  if (pos[1].quoted) return null;                  // already quoted
  if (/"/.test(pos[1].text)) return null;          // partially quoted — hands off
  if (pos.length > 2 && !pos.slice(2).every(t => t.quoted)) {
    return { report: m[2] + ' label is bare AND multi-word — ' + pos.slice(1).map(t => t.text).join(' ') +
      '. Quote it yourself: only you know whether that is one label or a label plus a surplus argument ' +
      '(`RULE-POSITION-ENUMERATION`)' };
  }
  const idx = code.indexOf(pos[1].text, m[1].length + m[2].length + m[3].length + pos[0].text.length);
  if (idx < 0) return null;
  return { text: line.slice(0, idx) + '"' + pos[1].text + '"' + line.slice(idx + pos[1].text.length) };
}

/**
 * 0.2 (engine-backlog 29): quote a bare `title` argument.
 *
 *   title Figure 5-3 VP-based SH Group Filtering
 *   → title "Figure 5-3 VP-based SH Group Filtering"
 *
 * `title` has taken a QUOTED string, and a document
 * transcribed before that reports `title needs a quoted string` and does not
 * build at all — so this is not cosmetic, it is the difference between a
 * figure and a parse error. The production corpus still carries them.
 *
 * Unlike a typed-block label this is UNAMBIGUOUS and therefore mechanical:
 * `title` takes exactly ONE positional string and NO option keys, so the whole
 * remainder of the code portion IS the title and there is no "label plus a
 * surplus argument" reading for the author to arbitrate. A trailing comment is
 * spliced back untouched.
 *
 * Hands off, with a report rather than a guess, when the argument carries a
 * `"` or a `\`: both need an ESCAPING decision (§2.2's escape set), and
 * inventing one would silently change the rendered text.
 */
function quoteBareTitle(line) {
  const code = stripComment(line);
  const m = /^(\s*)title(\s+)(\S[\s\S]*?)\s*$/.exec(code);
  if (!m) return null;
  const arg = m[3];
  if (arg.startsWith('"')) return null;              // already quoted — or the author's business
  if (arg.includes('"')) {
    return { report: '`title` argument is bare AND contains a double quote — ' + arg +
      '. Quote it yourself: the inner quote has to be escaped (\\") or dropped, and only you ' +
      'know which was meant (MIGRATIONS 0.1)' };
  }
  if (arg.includes('\\')) {
    return { report: '`title` argument is bare AND contains a backslash — ' + arg +
      '. Quote it yourself: inside a quoted string a backslash starts an ESCAPE (§2.2), so ' +
      'quoting this blind would change the rendered text (MIGRATIONS 0.1)' };
  }
  const start = m[1].length + 'title'.length + m[2].length;
  return { text: line.slice(0, start) + '"' + arg + '"' + line.slice(start + arg.length) };
}

// `RULE-POSITION-ENUMERATION`: every LIVE enum-valued OPTION key (SYNTAX-STYLE RULE
// 2.4 / vocabulary-sources.tsv `shape = enum`). The positional enum
// positions are handled by their own patterns below.
const ENUM_OPT_KEYS_MIG = ['shape', 'style', 'numbering', 'extend', 'type'];

/**
 * `RULE-POSITION-ENUMERATION`: strip the quotes from a quoted enum value. Never touches a quoted
 * value at a STRING position (`description=`, `present=`) or at a number /
 * point / range position, where quoting stays legal and inert (RULE 2.3b).
 */
function bareEnumValues(line) {
  const code = stripComment(line);
  const comment = commentOf(line);
  let out = code, hit = false;
  for (const k of ENUM_OPT_KEYS_MIG) {
    const re = new RegExp('(^|\\s)' + k + '="([A-Za-z0-9_-]*)"', 'g');
    const rep = out.replace(re, (_, sp, v) => { hit = true; return sp + k + '=' + v; });
    out = rep;
  }
  // `figdown "0.1" <genre>` and `figdown 0.1 "<genre>"`
  out = out.replace(/^(\s*figdown\s+)"([^"\s]*)"/, (_, a, v) => { hit = true; return a + v; });
  out = out.replace(/^(\s*figdown\s+\S+\s+)"([^"\s]*)"/, (_, a, v) => { hit = true; return a + v; });
  // `flow "<dir>"`
  out = out.replace(/^(\s*flow\s+)"([^"\s]*)"/, (_, a, v) => { hit = true; return a + v; });
  // `cell <row> "highlight"` — the one bare keyword flag
  out = out.replace(/^(\s*cell\s+\S+\s+)"(highlight)"(\s*)$/, (_, a, v, z) => { hit = true; return a + v + z; });
  return hit ? out + comment : null;
}

// Spellings that were retired at or before 0.1. A file that writes any
// of them cannot be a pre-release file, so --color-means=text is a false
// assertion about it (refusal (b)). Keyword forms are anchored to
// line start; option keys are matched as ` key=`.
const PRE_DEV33_MARKERS = [
  [/(^|\s)w\s*=/m,      'w='],
  [/(^|\s)h\s*=/m,      'h='],
  [/(^|\s)unit\s*=/m,   'unit='],
  [/(^|\s)via\s*=/m,    'via='],
  [/(^|\s)dir\s*=/m,    'dir='],
  [/(^|\s)kind\s*=/m,   'kind='],
  [/(^|\s)layer\s*=/m,  'layer='],
  [/^\s*boundary(\s|$)/m, 'boundary'],
  [/^\s*layer(\s|$)/m,    'layer'],
  [/^\s*wrap(\s|$)/m,     'wrap'],
  [/(^|\s)optional(\s|$)/m, 'optional'],
];

const ID_TOKEN = '[A-Za-z_][A-Za-z0-9_-]*';

/** The comment half of a line ('' when there is none), the mirror of stripComment. */
function commentOf(line) {
  const code = stripComment(line);
  return line.slice(code.length);
}

/**
 * `ELEMENT-GEOMETRY-DIRECTIVE`: fold every `size` line into the id's `pin` line, or
 * rename it when the id has no pin. Mutates `lines` in place and appends to
 * `changes`. See the call site for the two cases and the idempotence argument.
 */
function applySizeMerge(lines, changes) {
  const secOf = [];
  let sec = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*figdown\b/.test(stripComment(lines[i]))) sec++;
    secOf[i] = sec;
  }
  const pinRe = new RegExp('^\\s*pin\\s+(' + ID_TOKEN + ')(?=\\s|$)');
  const sizeRe = new RegExp('^\\s*size\\s+(' + ID_TOKEN + ')(?=\\s|$)');
  const pinAt = new Map();          // "<section>\0<id>" -> line index
  const sizes = [];                 // {i, id}
  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i]);
    const pm = pinRe.exec(code);
    if (pm) { const k = secOf[i] + '\0' + pm[1]; if (!pinAt.has(k)) pinAt.set(k, i); continue; }
    const sm = sizeRe.exec(code);
    if (sm) sizes.push({ i, id: sm[1] });
  }
  const drop = new Set();
  for (const s of sizes) {
    const code = stripComment(lines[s.i]);
    const before = code.trim();
    const keys = code.replace(sizeRe, '').trim();      // "width=… height=…"
    const pi = pinAt.get(secOf[s.i] + '\0' + s.id);
    if (pi === undefined) {
      // (b) no pin line for this id — rename the keyword, keys untouched.
      const after = lines[s.i].replace(/^(\s*)size(?=\s)/, '$1pin');
      changes.push({ line: s.i + 1, rule: 'size→pin (the id has no pin line)',
        before, after: stripComment(after).trim() });
      lines[s.i] = after;
      continue;
    }
    // (a) fold onto the pin line and delete this one.
    const pinCode = stripComment(lines[pi]).replace(/\s+$/, '');
    const pinComment = commentOf(lines[pi]).trim();
    const sizeComment = commentOf(lines[s.i]).trim().replace(/^#\s*/, '');
    let merged = keys ? pinCode + ' ' + keys : pinCode;
    const comment = [pinComment, sizeComment && (pinComment ? sizeComment : '# ' + sizeComment)]
      .filter(Boolean).join('  ');
    if (comment) merged += '  ' + comment;
    changes.push({ line: pi + 1, rule: 'size folded into pin (one directive, one line)',
      before: stripComment(lines[pi]).trim(), after: stripComment(merged).trim() });
    changes.push({ line: s.i + 1, rule: 'size line deleted (folded into the pin line above)',
      before, after: '' });
    lines[pi] = merged;
    drop.add(s.i);
  }
  if (drop.size) {
    // Splice from the end so earlier indices stay valid.
    for (const i of [...drop].sort((a, b) => b - a)) lines.splice(i, 1);
  }
}

function migrateText(text, colorMeans) {
  // See the `color=` block below for the full idempotence argument.
  const bare = text.split('\n').map(stripComment).join('\n');
  const hasText = /(^|\s)text\s*=/m.test(bare);
  const hasColor = /(^|\s)color\s*=/m.test(bare);
  const hasFill = /(^|\s)fill\s*=/m.test(bare);
  const preDev33 = PRE_DEV33_MARKERS.filter(([re]) => re.test(bare)).map(([, n]) => n);
  // Refusals (a) and (b): each flag is an ASSERTION about when the file was
  // written, and the file itself can contradict it. A contradicted assertion
  // is refused outright — the file is reported and NOTHING is rewritten,
  // because the alternative is a wrong figure reported as a success.
  const refuseFill = colorMeans === 'fill' && hasColor && hasFill;
  const refuseText = colorMeans === 'text' && hasColor && preDev33.length > 0;
  const fileMode =
    hasText && hasColor ? 'contradiction' :
    refuseFill ? 'refuse-fill' :
    refuseText ? 'refuse-text' :
    colorMeans === 'fill' ? (hasText ? 'contradiction' : 'fill') :
    colorMeans === 'text' ? 'color-delete' :
    hasText ? 'text-delete' : 'ambiguous';
  // ── THE EVIDENCE, NAMED AS A FACT ABOUT THE FILE ────────────
  //
  // Every message in the `color=` family below is built from these two
  // strings, and neither of them names a release. A release number is not
  // OBSERVABLE in a document: a reader holding a `.fd` cannot check which
  // pre-release wrote it, and downstream every document says `figdown 0.1`
  // with no dev marker at all — so a diagnostic whose whole content is
  // "which era are you from?" hands the reader a question it has just told
  // them they cannot answer. What IS observable is what else the file
  // writes, and the two refusals already read exactly that:
  //
  //   also writes `fill=`            the FILL reading is out — the two keys
  //                                  never coexisted, so this `color=` was
  //                                  the LABEL colour             (refusal a)
  //   writes a spelling retired      the LABEL reading is out — those
  //   before the LABEL reading       spellings were gone by then, so this
  //   existed                        `color=` was a FILL          (refusal b)
  //   both                           neither reading accounts for the file;
  //                                  no flag is accepted, it is hand work
  //   neither                        NO evidence. Say so — the tool will not
  //                                  guess, and that is the same position it
  //                                  takes when it refuses.
  //
  // The version numbers that remain in this family are `(MIGRATIONS 0.1)`
  // citations: a fact about THIS repository's history, which the reader can
  // look up, not a classification they are asked to perform.
  const evFill = 'this file also writes fill=, a key that did not exist while color= meant the FILL';
  const evOld = 'this file writes ' + preDev33.join(', ') + ', '
    + (preDev33.length === 1 ? 'a spelling' : 'spellings')
    + ' already retired by the time color= meant the LABEL';
  // Continuation forms, for the second clause of a sentence that has already
  // said "this file".
  const evFill2 = evFill.replace(/^this file /, 'it ');
  const evOld2 = evOld.replace(/^this file /, 'it ');
  const COLOUR_WHERE = ' (MIGRATIONS 0.1)';
  // Which class ids are referenced from an edge line, and which from a node
  // line — the §8.4 class check below needs both to say whether the fix is
  // mechanical.
  const edgeClasses = new Set(), nodeClasses = new Set();
  for (const ln of bare.split('\n')) {
    const m = /(^|\s)class=(\S+)/.exec(ln);
    if (!m) continue;
    const ids = m[2].replace(/"/g, '').split(',').filter(Boolean);
    const target = /^\s*edge(\s|$)/.test(ln) ? edgeClasses : nodeClasses;
    for (const id of ids) target.add(id);
  }
  const reports = [];
  const changes = [];
  const lines = text.split('\n');
  // 0.2 (`KEYWORD-RENAME-SCOPE`): the flowchart connector rename is GATED BY THE LANGUAGE
  // VERSION, so the HEADER moves with the keyword or this tool emits a document
  // that does not parse — which is worse than emitting nothing. `flowline` is
  // 0.2 vocabulary; a section that will end up writing it must declare 0.2.
  //
  // It is a PRE-PASS because the header is written before the connector lines
  // that decide it, and `lines.map` cannot go back. A section already at 0.2 is
  // left alone, and a section that writes no connector is left at 0.1 — the
  // version is raised only where the vocabulary actually requires it (core
  // §13.0: `Y` adds, so the lowest version that carries the figure is correct).
  const bumpHeader = new Set();
  {
    let hdrLine = -1, hdrGenre = null, hdrVer = null, needs = false;
    const close = () => {
      if (needs && hdrLine > 0 && hdrGenre === 'flowchart' && hdrVer === '0.1') bumpHeader.add(hdrLine);
    };
    lines.forEach((line, i) => {
      const bare = stripComment(line).trim();
      const hm2 = /^figdown\s+(0\.\d+)(?:\s+(\S+))?/.exec(bare);
      if (hm2) { close(); hdrLine = i + 1; hdrVer = hm2[1]; hdrGenre = hm2[2] || null; needs = false; return; }
      // `edge` becomes `flowline` below; `flowline` may already be there, in a
      // document a previous run of this tool rewrote without moving the header.
      if (/^(edge|flowline)(\s|$)/.test(bare)) needs = true;
    });
    close();
  }
  let genre = null;
  let inBitfield = false;
  let starCount = 0;
  let bitfieldHasNumbering = true; // set false when open bitfield without numbering
  let openBitfieldLine = -1;

  const out = lines.map((line, idx) => {
    const n = idx + 1;
    const code = stripComment(line);
    const trim = code.trim();

    // 0.1 — the decorative marker drops its internal-code prefix.
    //
    // `# r25: decorative` → `# decorative`. This is the ONE rewrite in this
    // file that acts on a COMMENT, so it must run before the `!trim` early
    // return below (a comment-only line strips to nothing). `strip-check.js`
    // no longer accepts the old spelling, so a document that keeps it
    // silently loses its opt-out — which is why the rule is mechanical
    // rather than report-only. Idempotent: the output does not match `r25:`.
    if (DECORATIVE_OLD_RE.test(line)) {
      const after = line.replace(DECORATIVE_OLD_RE, '$1# decorative');
      if (after !== line) {
        changes.push({ line: n, rule: '# r25: decorative → # decorative',
          before: line.trim(), after: after.trim() });
        return after;
      }
    }

    if (!trim) return line;

    // `EDGE-GEOMETRY-CONSTRUCTS`: the withdrawn edge-geometry family. This runs BEFORE
    // every rewrite in this file, and it returns the line UNCHANGED — the
    // older rules that used to feed these lines (`route`→`path`, `via=`→
    // `points=`, `src=`/`dst=`→`tailport=`/`headport=`) would now produce a
    // document the engine rejects, and a rewrite whose output is a hard error
    // is not a migration.
    if (WITHDRAWN_KW_RE.test(trim) || WITHDRAWN_OPT_RE.test(code)) {
      const kw = WITHDRAWN_KW_RE.test(trim) ? trim.split(/\s/)[0] : null;
      reports.push({
        line: n,
        code: 'withdrawn-edge-geometry',
        msg: (kw ? '`' + kw + '` is' : 'this line uses an option key') +
          ' WITHDRAWN from the language (`EDGE-GEOMETRY-CONSTRUCTS`) — removed, not renamed, ' +
          'so there is NO replacement spelling and NO mechanical rewrite. ' +
          'DELETE the line and re-render: the edge will draw under auto layout, ' +
          'which is a DIFFERENT PICTURE, so check the result. ' +
          '`rank`, `flow`, declaration order and `pin` are the content-zone means ' +
          'of shaping it. The freeze contract promises mechanical migration for ' +
          'FROZEN constructs; these were EXPERIMENTAL, so none was owed. ' +
          'See spec/migrations.md 0.1 and spec/core.md §9 `EDGE-IDENTITY-AND-GEOMETRY`.  ' +
          'line: ' + trim,
      });
      return line;
    }

    // `PAINT-ORDER-CONSTRUCT`: the withdrawn PLANE family, reported the same way and
    // for the same reason. `guide` is NOT here — it is a live RENAME to
    // `threshold` and the tool still performs it.
    if (WITHDRAWN_PLANE_KW_RE.test(trim) || WITHDRAWN_PLANE_OPT_RE.test(code)) {
      const kw = WITHDRAWN_PLANE_KW_RE.test(trim) ? trim.split(/\s/)[0] : null;
      reports.push({
        line: n,
        code: 'withdrawn-plane',
        msg: (kw ? '`' + kw + '` is' : 'this line uses an option key') +
          ' WITHDRAWN from the language (`PAINT-ORDER-CONSTRUCT`) — removed, not renamed, ' +
          'so there is NO replacement spelling and NO mechanical rewrite. ' +
          'DELETE the line and every plane= that referenced it. Paint order is ' +
          'document order: a later line paints on top, so the drawing is ' +
          'unchanged unless the planes were written out of document order — ' +
          'check the result. If the elements formed a logical layer of the ' +
          'SUBJECT (an overlay, a control plane), that meaning belongs in a ' +
          'class= whose LABEL states it (core §5, `PRESENTATION-AS-MEANING-CARRIER`), which is where the ' +
          'corpus was already carrying it. The freeze contract promises ' +
          'mechanical migration for FROZEN constructs; `plane` was ' +
          'EXPERIMENTAL, so none was owed. ' +
          'See spec/migrations.md 0.3 and decisions/registry.md.  ' +
          'line: ' + trim,
      });
      return line;
    }

    // `SCENE-KEYWORD-MEMBERSHIP`: a keyword this document's GENRE no longer declares.
    // Reported, never rewritten — there is nothing to rewrite it TO, because
    // the word is not gone from the language, only from this genre, and the
    // fix is a decision about the figure (change the header, or move the line
    // to a section that declares the word) which no tool may make unattended.
    if (genre && GENRE_KEEPS[genre] && GENRE_WITHDRAWN_KW_RE.test(trim)) {
      const kw = trim.split(/\s/)[0];
      if (!GENRE_KEEPS[genre].has(kw)) {
        const still = Object.keys(GENRE_KEEPS).filter(g => GENRE_KEEPS[g].has(kw));
        reports.push({
          line: n,
          code: 'withdrawn-from-genre',
          // The version parenthetical keeps its LEADING SPACE inside the same
          // string literal as the clause it annotates. Split across a `+`, the
          // space belongs to one literal and the parenthesis to the next, and
          // the publish transform — which deletes a version parenthetical
          // together with the whitespace in front of it — can only reach the
          // half it can see. The `.report.txt` golden beside this file is one
          // flat string and loses both, so the two halves of the pair came out
          // of the same edit spelled differently: `genre \`x\` .` here against
          // `genre \`x\`.` there. Same rule below, and for the `at <version>`
          // clause, which a temporal-clause rule removes whole or not at all.
          msg: '`' + kw + '` is no longer declared by genre `' + genre + '`' +
            ' (`SCENE-KEYWORD-MEMBERSHIP`). Subject vocabulary is per genre: a spelling ' +
            'accepted by several genres is several independent declarations, ' +
            'and this genre withdrew its own. There is NO mechanical rewrite — ' +
            (still.length
              ? 'the word is still declared by ' + still.join(', ') + ', so the fix'
              : 'the word is declared by no genre at all now, so the fix') +
            ' is a decision about the figure: change the section header, or ' +
            'move the line into a section whose genre declares the word. ' +
            'The genre or the keyword was EXPERIMENTAL in every affected cell, ' +
            'so no migration was owed. See spec/migrations.md 0.3.  ' +
            'line: ' + trim,
        });
        return line;
      }
    }

    // `MEMBERSHIP-KEY-ACCEPTANCE`: an OPTION KEY this document's GENRE no longer
    // accepts. Same shape as the keyword rule above and same reason for being
    // report-only: `in=` is not gone from the language, only from this genre,
    // and what replaces it is a decision about the figure (a `class` naming
    // the phase, or a section whose genre declares `group`).
    if (genre && GENRE_DROPS_OPT[genre] && GENRE_WITHDRAWN_OPT_RE.test(trim)) {
      const drop = GENRE_DROPS_OPT[genre];
      if (drop.has('in')) {
        reports.push({
          line: n,
          code: 'withdrawn-opt-from-genre',
          msg: '`in=` is no longer accepted by genre `' + genre + '`' +
            ' (`MEMBERSHIP-KEY-ACCEPTANCE`). Its only value domain was the id of a ' +
            'containing `group`, and this genre stopped declaring ' +
            '`group`, so every value was a dead end. ' +
            'There is NO mechanical ' +
            'rewrite: what expresses membership now is a `class` whose label ' +
            'names the partition, put on each member with `class=`' +
            (genre === 'statechart'
              ? ' — and note the spelling is RESERVED here for a `state`-id ' +
                'domain, should UML composite states be earned'
              : '') +
            '. See spec/migrations.md 0.3.  ' +
            'line: ' + trim,
        });
        return line;
      }
    }

    // header
    const hm = /^figdown(\s+)(0\.\d+)(?:\s+(\S+))?/.exec(trim);
    if (hm) {
      genre = hm[3] || null;
      inBitfield = false;
      // `TIMING-GENRE-NAMING`: the EXPERIMENTAL genre token `wave` → `timing`.
      // It has to be rewritten HERE: the header branch returns early, so the
      // line-initial rename table below never sees this line — and the genre
      // token is the third word anyway, which no line-initial rule reaches.
      if (genre === 'wave') {
        const after = line.replace(/^(\s*figdown\s+0\.\d+\s+)wave\b/, '$1timing');
        if (after !== line) {
          changes.push({ line: n, rule: 'genre wave→timing', before: trim, after: stripComment(after).trim() });
          genre = 'timing';
          return after;
        }
      }
      // `KEYWORD-RENAME-SCOPE`: raise `figdown 0.1` to `figdown 0.2` on a flowchart
      // section that carries a connector, because `flowline` is 0.2 vocabulary
      // and `edge` is 0.1's. This runs BEFORE the reports below so the genre
      // reports still fire on the same line.
      let headerLine = line;
      if (bumpHeader.has(n)) {
        const after = headerLine.replace(/^(\s*figdown\s+)0\.1(\s)/, '$10.2$2');
        if (after !== headerLine) {
          changes.push({
            line: n,
            rule: 'flowchart header 0.1→0.2 (flowline is 0.2 vocabulary)',
            before: trim,
            after: stripComment(after).trim(),
          });
          headerLine = after;
        }
      }
      if (!genre) {
        reports.push({ line: n, code: 'missing-genre', msg: 'header has no genre token' });
      } else if (/^(topology|flowchart|timing)$/.test(genre)) {
        reports.push({
          line: n,
          code: 'experimental-genre',
          msg: 'genre `' + genre + '` is EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) — prefer block/bitfield/table when portable',
        });
      }
      return headerLine;
    }

    // close typed region on top-level keyword
    const kwM = /^([a-zA-Z][\w]*)\b/.exec(trim);
    const kw = kwM ? kwM[1] : null;

    if (kw === 'bitfield') {
      inBitfield = true;
      starCount = 0;
      openBitfieldLine = n;
      if (!/\bnumbering\s*=/.test(trim)) {
        bitfieldHasNumbering = false;
        reports.push({
          line: n,
          code: 'bitfield-numbering',
          msg: 'bitfield requires numbering=lsb0|msb0 (cannot invent direction)',
        });
      } else bitfieldHasNumbering = true;
    } else if (kw && !/^(field|wrap|break)$/.test(kw) && inBitfield && kw !== 'bitfield') {
      // leaving bitfield region (`wrap` was renamed `break`;
      // an un-migrated file still says `wrap`, so both close nothing)
      if (kw !== 'field' && kw !== 'wrap' && kw !== 'break') inBitfield = false;
    }
    if (inBitfield && kw === 'field' && /(^|\s)\*(?:\s|$)/.test(trim.replace(/"[^"]*"/g, ''))) {
      starCount++;
      if (starCount > 1) {
        reports.push({
          line: n,
          code: 'dual-star',
          msg: 'more than one * field in a bitfield block (max one)',
        });
      }
    }

    // `GENRE-KEYWORD-ALLOWLIST`: scene keywords under pure bitfield/table/wave
    if (genre && /^(bitfield|table|wave)$/.test(genre) && kw &&
        /^(node|group|boundary|external|edge|bundle|layer|plane|guide|threshold|band|flow|rank)$/.test(kw)) {
      reports.push({
        line: n,
        code: 'k2-allowlist',
        msg: '`' + kw + '` is not allowed in genre ' + genre + ' (use multi-section `MULTI-FIGURE-DOCUMENTS` or a scene host)',
      });
    }

    // ---- 0.1 report-only detections ----
    {
      const c37 = stripComment(line);
      // `CHART-BLOCK-NAMING`: `plot kind=bars3d` → `chart type=bar3d`. `kind=` carries a SECOND
      // retired meaning on `node` (→ shape=), so the key alone cannot be
      // rewritten blind.
      const km37 = /\bkind\s*=\s*bars3d\b/.exec(c37);
      if (km37) {
        reports.push({
          line: n,
          code: 'chart-kind',
          msg: '`kind=bars3d` became `type=bar3d` on `chart` (`CHART-BLOCK-NAMING`) — `kind=` also has a retired meaning on `node` (→ shape=), so this one is not rewritten automatically',
        });
      }
      // `TIMING-LANE-ALPHABET`: the wave lane digits 2-9 left the closed alphabet. Non-mechanical:
      // `=` is the replacement brick but each needs its own `data=` entry.
      const sm37 = /^\s*signal\s+\S+\s+(\S+)/.exec(c37);
      if (sm37 && /[2-9]/.test(sm37[1])) {
        reports.push({
          line: n,
          code: 'wave-lane-digit',
          msg: 'wave lane digits 2-9 were retired (`TIMING-LANE-ALPHABET`) — WaveDrom reads them as "value with color N", the same brick as `=`; write `=` for each data cell and name it in `data=`. NON-MECHANICAL: the labels are yours to supply',
        });
      }
    }

    // retired shape values — DETECT AND LIST, never rewrite
    {
      const sm = /\bshape\s*=\s*([A-Za-z0-9_-]+)/.exec(code);
      if (sm && RETIRED_SHAPES[sm[1]]) {
        reports.push({ line: n, code: 'retired-shape', msg: RETIRED_SHAPES[sm[1]] });
      }
    }

    let next = line;

    // mechanical line-initial renames
    const renames = [
      [/^(\s*)render(\b)/, '$1layout$2', 'render→layout'],
      // `route`→`path` stood here until 0.1: `EDGE-GEOMETRY-CONSTRUCTS`
      // withdrew `path`, so the rewrite's output is a line error. `route`
      // lines are reported by the withdrawal detection instead.
      [/^(\s*)line(\b)/, '$1threshold$2', 'line→threshold'],
      [/^(\s*)colw(\b)/, '$1width$2', 'colw→width'],
      // `SCENE-KEYWORD-MEMBERSHIP` makes this rule GENRE-AWARE. `bundle` is now
      // declared by `topology` alone, so under any other genre the rewrite's
      // output is a line error and the rule must not fire; the withdrawal
      // detection reports those lines instead. Under `topology` it is the
      // same pure spelling swap it always was.
      ...(genre === 'topology'
        ? [[/^(\s*)trunk(\b)/, '$1bundle$2', 'trunk→bundle']]
        : []),
      // 0.1 (the terminology batch)
      [/^(\s*)boundary(\b)/, '$1external$2', 'boundary→external'],
      // `layer`→`plane` (`PLANE-KEYWORD-SPELLING`) stood here until 0.3 — same
      // reason as `layer=` above, and the same reason `route`→`path` left at
      // 0.1: `PAINT-ORDER-CONSTRUCT` withdrew `plane`, so the output would not parse.
      [/^(\s*)wrap(\b)/, '$1break$2', 'wrap→break'],
      [/^(\s*)plot(\b)/, '$1chart$2', 'plot→chart'],
      // 0.1 (`THRESHOLD-KEYWORD-SPELLING`). `line` above already lands on `threshold`, so a
      // pre-0.1 document takes ONE hop, not two, and this rule then
      // cannot match its own output.
      [/^(\s*)guide(\b)/, '$1threshold$2', 'guide→threshold'],
      // 0.1 (`TIMING-GENRE-NAMING`). The EXPERIMENTAL genre `wave` became `timing`,
      // and the opener keyword moves with it. The header line is rewritten
      // by its own rule below (a genre token is not line-initial).
      [/^(\s*)wave(\b)/, '$1timing$2', 'wave→timing'],
    ];
    for (const [re, rep, label] of renames) {
      if (re.test(stripComment(next))) {
        const after = next.replace(re, rep);
        if (after !== next) {
          changes.push({ line: n, rule: label, before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
    }

    // ---- 0.2 (`GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING`): the PER-GENRE node and connector words ----
    //
    // MECHANICAL, and the only rename in this tool that is SCOPED BY GENRE.
    // `edge` is not retired — it is exactly as live as it ever was under
    // `block` and `topology` — so a blind line-initial rename would corrupt
    // every portable document in the corpus. What moved is the SPELLING each
    // scene genre uses, and the header three words up is the only thing that
    // says which:
    //
    //   flowchart   edge -> flowline
    //   statechart  edge -> transition ,  node -> state
    //
    // `genre` is tracked by the header branch above and is null before the
    // first header, so a headerless fragment is left alone rather than
    // guessed at. Idempotent by construction: the output spellings are not
    // in any source position of the table.
    //
    // WHY THE TOOL OWES THIS AT ALL. A rename is precisely the case core
    // §13.4 makes mechanical, and this one has to be: reclassifying a figure
    // used to be a one-line edit and now rewrites every connector line. That
    // cost was accepted deliberately (`GENRE-CONNECTOR-SPELLING`) on the condition that the tool,
    // not the author, pays it.
    {
      const GENRE_WORDS = {
        flowchart: [[/^(\s*)edge(\b)/, '$1flowline$2', 'flowchart edge→flowline']],
        statechart: [
          [/^(\s*)edge(\b)/, '$1transition$2', 'statechart edge→transition'],
          [/^(\s*)node(\b)/, '$1state$2', 'statechart node→state'],
        ],
      };
      for (const [re, rep, label] of (GENRE_WORDS[genre] || [])) {
        if (!re.test(stripComment(next))) continue;
        const after = next.replace(re, rep);
        if (after !== next) {
          changes.push({ line: n, rule: label, before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
    }

    // legacy `fill <range> in=` as band keyword (not fill= option)
    //
    // REPORT-ONLY, and it used to be a rewrite. The rewrite
    // was `fill` → `band` and nothing else — but 0.1 (`BAND-LABEL-STATUS`) gave `band`
    // a MANDATORY quoted label, and the legacy `fill` form had no label slot
    // at all, so the rewrite's OUTPUT has been a hard error (`band needs a
    // quoted "<label>" first`) for ten releases. REFUSAL (c) caught it every
    // time, which meant the tool announced a mechanical fix and then wrote
    // nothing — and a file containing only this line could never migrate.
    // A rewrite whose output is a hard error is not a migration (the
    // 0.1 precedent), so it is reported with the exact line to paste
    // and the one word only the author has left blank.
    // Found by tools/migrate-check.js on its first run.
    {
      const c = stripComment(next);
      const bm = /^(\s*)fill(\s+)(\d+(?:-\d+)?%)(\s+.*)$/.exec(c);
      if (bm && /(^|\s)in=/.test(c) && !/fill=/.test(c)) {
        reports.push({
          line: n,
          code: 'fill-range-band',
          msg: 'the zone band spelled with the keyword `fill` became `band` — but 0.1 ' +
               '(`BAND-LABEL-STATUS`) also gave `band` a MANDATORY quoted label, written FIRST, and this form ' +
               'has no label to carry over. NON-MECHANICAL: the region\'s name is yours to ' +
               'supply. Write: band "<name>" ' + bm[3] + bm[4].replace(/\s+$/, ''),
        });
      }
    }

    // 0.1 option-key renames (w=/h=/dir=), code portions only.
    // A fourth element scopes the rename to one DIRECTIVE (`DRAWN-ANNOTATION-FORM`: `note=` is
    // live again everywhere except `field`, so its rewrite must not leave
    // that line — see OPT_RENAMES).
    for (const [re, rep, label, kw] of OPT_RENAMES) {
      if (kw && !lineDirectiveIs(next, kw)) continue;
      const after = mapCode(next, seg => seg.replace(re, rep));
      if (after !== next) {
        changes.push({ line: n, rule: label, before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 ----
    // `PRESENCE-CONDITION-EXPRESSION`: the `field` classic-form FLAG `optional` → the option key
    // `present=""`. MECHANICAL, and anchored to the flag position only —
    // the word also occurs inside quoted field NAMES and inside description=
    // text, and neither of those moves. The rewrite ELIMINATES the token its
    // own pattern matches (a bare `optional` after the width), so it is
    // idempotent; `optional` is a hard error, so a rewritten
    // file can never match again.
    //
    // LIFTING THE CONDITION IS NOT MECHANICAL and this tool never does it.
    // `present=""` is the honest mechanical target: it says "conditional,
    // condition not stated", which is exactly what the bare flag said. A
    // condition sitting in the neighbouring description= is REPORTED with the
    // text quoted, so a human can move it — the tool must never invent one,
    // and must never assume a description IS a condition (most are not).
    {
      const c = stripComment(next);
      const FLAG = /^(\s*field\s+(?:"(?:[^"\\]|\\.)*"|\S+)\s+(?:\d+|\*))\s+optional\b/;
      if (FLAG.test(c)) {
        const after = next.replace(FLAG, '$1 present=""');
        changes.push({ line: n, rule: 'field optional→present=""', before: trim, after: stripComment(after).trim() });
        next = after;
        const dm = /\b(?:description|note)=("(?:[^"\\]|\\.)*")/.exec(c);
        if (dm) {
          reports.push({
            line: n,
            code: 'present-condition-lift',
            msg: 'this field was `optional` and carries prose alongside it: ' + dm[1] +
                 '. NON-MECHANICAL: if that prose states the PRESENCE CONDITION, move it into present="…" ' +
                 '(and shorten or drop the description=); if it says anything else, leave both alone. ' +
                 'The tool never lifts it and never invents one (MIGRATIONS 0.1)',
          });
        }
      }
    }
    // `ROW-HIGHLIGHT-CELL-FILL-COLLISION`: the row tint and a cell fill are one channel, and both forms of
    // writing them for the same cell are line errors.
    // REPORT-ONLY: which of the two the author meant is not derivable.
    {
      const c = stripComment(next);
      if (/^\s*cell\s+\(\s*\d+\s*,\s*\d+\s*\)/.test(c) && /(^|\s)highlight(\s|$)/.test(c)) {
        reports.push({
          line: n,
          code: 'cell-highlight-address',
          msg: '`highlight` on a CELL address was silently discarded and is a line error (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`) — tint the row (`cell <row> highlight`) or paint the cell (`cell (<row>,<col>) fill=…`), not both',
        });
      }
    }

    // 0.1 compact `field` item names with unquoted spaces — REPORT ONLY
    {
      const suggestion = quoteCompactFieldNames(stripComment(next));
      if (suggestion) {
        reports.push({
          line: n,
          code: 'field-unquoted-name',
          msg: 'compact `field` item name contains spaces — quote it. Suggested: ' + suggestion,
        });
      }
    }

    // ---- the `color=` family ----
    //
    // THE IDEMPOTENCE ARGUMENT, in full, because this is the one migration
    // that is NOT a rename: old `color=` set the FILL, new `color=` sets the
    // TEXT. `color=` alone therefore does not say which version wrote it,
    // and no amount of scanning can decide it — so the tool never guesses.
    //
    // In any document that parses under SOME version, `color=` and `text=`
    // can never co-occur: `text=` did not exist in one era, `color=`
    // was a hard error in another, and `text=` is a hard
    // error. That gives three disjoint MODES, and the tool
    // applies exactly one rewrite per mode:
    //
    //   no flag              `text=` -> `color=`   (removes every `text=`)
    //   --color-means=fill   `color=` -> `fill=`   (removes every `color=`)
    //   --color-means=text   nothing (it is already migrated)
    //
    // Each mode's rewrite ELIMINATES the token its own pattern matches, so
    // running that mode again is a no-op — every mode is idempotent. And the
    // two rewrites are never both enabled in one invocation, so a `color=`
    // this tool just WROTE can never be re-read as a pre-0.1 one.
    // A file carrying BOTH keys is a contradiction under every version: it
    // is reported and never rewritten.
    if (fileMode === 'contradiction') {
      if (/(^|\s)(color|text)\s*=/.test(stripComment(next))) {
        reports.push({
          line: n, code: 'color-text-both',
          msg: 'this file writes BOTH color= and text=, which no version of the language accepts — classify it by hand before migrating (MIGRATIONS 0.1)',
        });
      }
    } else if (fileMode === 'refuse-fill') {
      if (/(^|\s)color\s*=/.test(stripComment(next))) {
        reports.push({
          line: n, code: 'color-means-fill-refused',
          msg: '--color-means=fill REFUSED: ' + evFill + ' — so this color= cannot have meant the FILL, and rewriting it to fill= would turn a coloured LABEL into a coloured BOX. '
             + (preDev33.length
                 ? '--color-means=text is refused on this file too (' + evOld2 + '), so no value of the flag settles it: rewrite these lines by hand.'
                 : 'Re-run with --color-means=text, or classify the file by hand.')
             + COLOUR_WHERE,
        });
      }
    } else if (fileMode === 'refuse-text') {
      if (/(^|\s)color\s*=/.test(stripComment(next))) {
        reports.push({
          line: n, code: 'color-means-text-refused',
          msg: '--color-means=text REFUSED: ' + evOld + ' — so this color= cannot have meant the LABEL, and deleting it would silently discard a FILL. '
             + (hasFill
                 ? '--color-means=fill is refused on this file too (' + evFill2 + '), so no value of the flag settles it: rewrite these lines by hand.'
                 : 'Re-run with --color-means=fill, which rewrites color= to fill=.')
             + COLOUR_WHERE,
        });
      }
    } else if (fileMode === 'fill') {
      const after = mapCode(next, seg => seg.replace(/(^|\s)color=/g, '$1fill='));
      if (after !== next) {
        changes.push({ line: n, rule: 'color=→fill= (pre-0.1 fill)', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    } else if (fileMode === 'color-delete') {
      const after = mapCode(next, seg => seg.replace(/(^|\s)color=("[^"]*"|\S+)/g, ''));
      if (after !== next) {
        changes.push({ line: n, rule: 'color= DELETED (0.1: v0.1 has no label-colour key; the default is derived)', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    } else if (fileMode === 'text-delete') {
      const after = mapCode(next, seg => seg.replace(/(^|\s)text=("[^"]*"|\S+)/g, ''));
      if (after !== next) {
        changes.push({ line: n, rule: 'text= DELETED (0.1: v0.1 has no label-colour key; the default is derived)', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    } else if (fileMode === 'ambiguous' && /(^|\s)color\s*=/.test(stripComment(next))) {
      const head = 'color= has two readings and nothing on this line chooses between them: it set the FILL of the box, or it set the colour of the LABEL — a channel v0.1 has no key for at all, so that reading DELETES the token. ';
      const tail =
        hasFill && preDev33.length
          ? 'BOTH READINGS ARE RULED OUT BY THE FILE: ' + evFill + '; and ' + evOld2 + '. No value of --color-means is accepted here — read these lines and rewrite them by hand.'
        : hasFill
          ? 'ONE READING IS RULED OUT BY THE FILE: ' + evFill + ' — so this was the LABEL colour. Re-run with --color-means=text, which DELETES it and lets the derived default apply (core §5); --color-means=fill is REFUSED on this file.'
        : preDev33.length
          ? 'ONE READING IS RULED OUT BY THE FILE: ' + evOld + ' — so this was a FILL. Re-run with --color-means=fill, which rewrites it to fill=; --color-means=text is REFUSED on this file.'
          : 'NOTHING IN THIS FILE RULES EITHER READING OUT — it writes no fill=, and none of the spellings that were retired before the LABEL reading existed — and the tool will not guess. The two readings differ in what was DRAWN, not in what is written: as a FILL the value painted the box interior, as a LABEL colour it painted only the text. Decide from the figure, then re-run with --color-means=fill or --color-means=text.';
      reports.push({ line: n, code: 'color-ambiguous', msg: head + tail + COLOUR_WHERE });
    }

    // ---- 0.1: guide at= -> offset= ----
    // `z=`→`z-index=` stood here until 0.3. `z-index=` was legal on
    // `plane` and on nothing else, so `PAINT-ORDER-CONSTRUCT` took it with the keyword and the
    // rewrite lost its target; `z=` is reported, not rewritten.
    if (/^\s*threshold(\s|$)/.test(stripComment(next))) {
      const after = mapCode(next, seg => seg.replace(/(^|\s)at=/g, '$1offset='));
      if (after !== next) {
        changes.push({ line: n, rule: 'threshold at=→offset=', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 (`CHART-LEVEL-KEY`): `chart … level=` is DELETED ----
    // MECHANICAL, and deletion is the only possible rewrite: the construct is
    // gone from the language, there is no replacement key, and the value it
    // carried has no other home. Same shape as the 0.1 `fill=` drop on
    // a no-interior directive — remove the token, keep the line. Idempotent:
    // the token is gone after one pass and `level=` is a hard error from
    // 0.1, so a rewritten file can never match again.
    if (/^\s*chart(\s|$)/.test(stripComment(next)) && /(^|\s)level=/.test(stripComment(next))) {
      const after = mapCode(next, seg => seg.replace(/(^|\s)level=(?:"(?:[^"\\]|\\.)*"|\S*)/g, ''))
        .replace(/[ \t]+$/, '');
      if (after !== next) {
        changes.push({ line: n, rule: 'chart level= deleted', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 (`RANGE-SPELLING`): `band` moves onto the one range grammar ----
    // MECHANICAL, and it must run BEFORE the band-label report below so that
    // report prints the CURRENT spelling of the range it echoes.
    // `band "Headroom" 15-35%` reads as subtraction, and it was the language's
    // second range spelling — the first being `index=` (`BITFIELD-REPETITION-CONSTRUCT`, same release),
    // single-sourced from Ada (ISO/IEC 8652) and Pascal (ISO 7185), both
    // inclusive. `band` is EXPERIMENTAL, so nothing was promised; the rewrite
    // is offered anyway, because a mechanical one costs a user nothing.
    // Idempotent by construction: the output contains no digit-hyphen-digit
    // for the pattern to match a second time.
    if (/^\s*band(\s|$)/.test(stripComment(next))) {
      const after = mapCode(next, seg =>
        seg.replace(/(^|\s)(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?%)/, '$1$2..$3'));
      if (after !== next) {
        changes.push({ line: n, rule: 'band range -→..', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 (`BAND-LABEL-STATUS`): `band` needs a mandatory quoted label ----
    // REPORT ONLY, and NON-MECHANICAL by construction: the label is the whole
    // point of the change (a band with no label asserts nothing a reader may
    // keep — §5 forbids meaning riding on `fill=` alone), and only the author
    // knows the region's name. Detected by the absence of a quoted token
    // before the range on a `band` line.
    if (/^\s*band(\s|$)/.test(stripComment(next))) {
      const c0 = stripComment(next).trim();
      const rest = c0.replace(/^band\s*/, '')
                     .replace(/\s*\b[A-Za-z_][A-Za-z0-9_-]*=(?:"(?:[^"\\]|\\.)*"|\S*)/g, '').trim();
      if (rest && !/^"/.test(rest)) {
        reports.push({
          line: n, code: 'band-needs-label',
          msg: '`band` gained a MANDATORY quoted label (`BAND-LABEL-STATUS`), written FIRST: ' +
               'band "<name>" ' + rest + ' … . Until now `band` had no label slot at all, so ' +
               'stripping `fill=` (which §5/`PRESENTATION-AS-MEANING-CARRIER` entitle a reader to discard) left it asserting ' +
               'nothing whatsoever. NON-MECHANICAL: the region\'s name is yours to supply.',
        });
      }
    }

    // ---- 0.1 (§8.4): a CLASS that paints edges may not set fill= ----
    // REPORT ONLY. A class referenced only by edges converts by changing
    // `fill=` to `stroke=`; a class shared with nodes has to be SPLIT, and
    // only the author knows which half each member wanted. Detection is
    // file-wide, so it is reported once, on the class declaration.
    if (/^\s*class(\s|$)/.test(stripComment(next)) && /(^|\s)fill=/.test(stripComment(next))) {
      const cid = (/^\s*class\s+(\S+)/.exec(stripComment(next)) || [])[1];
      const c0 = stripComment(next);
      if (cid && edgeClasses.has(cid) && !/(^|\s)stroke=/.test(c0)) {
        if (!nodeClasses.has(cid)) {
          // edges only: the fill was already being used AS the stroke, so
          // renaming the key preserves the drawing exactly.
          const after = mapCode(next, seg => seg.replace(/(^|\s)fill=/g, '$1stroke='));
          if (after !== next) {
            changes.push({ line: n, rule: 'edge-only class fill= → stroke=', before: trim, after: stripComment(after).trim() });
            next = after;
          }
        } else {
          const fv = (/(^|\s)fill=(\S+)/.exec(c0) || [])[2];
          reports.push({
            line: n, code: 'class-fill-on-edge',
            msg: 'class `' + cid + '` sets fill= but no stroke=, and is used by BOTH a node and an edge (§8.4). ' +
                 'ADD a stroke= (do not split the class — one meaning, one legend entry). ' +
                 'To reproduce the old drawing exactly, use the fill colour: stroke=' + (fv || '<colour>'),
          });
        }
      }
    }

    // ---- 0.1 (§8.4): fill= on edge / guide / bundle ----
    // Those three have no interior, so fill= and stroke= named one channel
    // and stroke= won SILENTLY. Both shapes are mechanical and both preserve
    // the drawing exactly: with stroke= also present, drop fill= (it never
    // had an effect); alone, rename it to stroke=.
    if (/^\s*(edge|threshold|bundle)(\s|$)/.test(stripComment(next))) {
      const c0 = stripComment(next);
      if (/(^|\s)fill=/.test(c0)) {
        const after = /(^|\s)stroke=/.test(c0)
          ? mapCode(next, seg => seg.replace(/(^|\s)fill=(?:"(?:[^"\\]|\\.)*"|\S*)/g, ''))
          : mapCode(next, seg => seg.replace(/(^|\s)fill=/g, '$1stroke='));
        if (after !== next) {
          changes.push({ line: n, rule: 'interior-less fill= → stroke=', before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
    }

    // The `via=x,y;…` → `points=(x,y),…` rewrite (0.1 shape,
    // 0.1 spelling) stood here until 0.1. `EDGE-GEOMETRY-CONSTRUCTS` withdrew
    // `points=`, so any line that would have reached this rule is now caught
    // by the withdrawal report at the top of the loop and returned untouched.

    // ---- 0.1: all points parenthesised (RULE 1.1a) ----
    {
      const rules = [
        ['pin', ['at'], 'pin at=(x,y)'],
        // `['path', ['tailport','headport'], …]` stood here until 0.1
        // (`EDGE-GEOMETRY-CONSTRUCTS`): the directive it operated on no longer exists.
      ];
      for (const [kw, keys, label] of rules) {
        const after = parenPointOpt(next, kw, keys);
        if (after) {
          changes.push({ line: n, rule: label, before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
      // `cell h1,2` / `cell 3,4` -> `cell (h1,2)`. The single-valued row
      // form `cell 3 highlight` is not a point and is left bare.
      const cm = /^(\s*cell\s+)(h?\d+,\d+)(\s|$)/.exec(stripComment(next));
      if (cm) {
        const after = next.replace(/^(\s*cell\s+)(h?\d+,\d+)(\s|$)/, '$1($2)$3');
        changes.push({ line: n, rule: 'cell paren address', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1: the space forms of rank / table width / bundle ----
    {
      const lists = [
        ['rank', 0, false, 'rank space form → comma form'],
        ['width', 0, false, 'table width space form → comma form'],
        ['bundle', 1, true, 'bundle members space form → comma form'],
      ];
      for (const [kw, skip, lbl, label] of lists) {
        const after = commaJoinList(next, kw, skip, lbl);
        if (after) {
          changes.push({ line: n, rule: label, before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
      // Compact `field a:1, b:2` — one whitespace-free token (`COMMA-LIST-WHITESPACE`).
      const fc = /^(\s*)field(\s+)([\s\S]*)$/.exec(stripComment(next));
      if (fc) {
        const ft = codeTokens(fc[3]);
        const fp = ft.filter(t => !isOptTok(t));
        if (fp.length > 1 && fp.every(t => /:/.test(t.text)) && fp.some(t => /,$/.test(t.text))) {
          // Same padding rule as commaJoinList: keep the trailing whitespace
          // inside the code portion, or an aligned `#` comment gets glued to
          // the last token and stops being a comment.
          const fcode = stripComment(next);
          const after = fc[1] + 'field' + fc[2] +
            [{ text: joinList(fp) }].concat(ft.filter(isOptTok)).map(t => t.text).join(' ') +
            /\s*$/.exec(fcode)[0] + next.slice(fcode.length);
          changes.push({ line: n, rule: 'field compact list → one token', before: trim, after: stripComment(after).trim() });
          next = after;
        }
      }
    }

    // ---- 0.1: a quoted comma now protects its element (2g) ----
    // Before this release the tokenizer discarded quotedness before the value
    // was split, so `labels="a,b"` was TWO elements. It is now ONE. Every
    // pre-0.1 whole-value quoting therefore has to be re-spelled as
    // per-element quoting to keep the meaning it had — split on every comma
    // (the old behaviour, exactly) and re-quote only the elements that still
    // need it. Idempotent: the output is never a single quoted value
    // containing a comma, so the pattern cannot match twice.
    {
      const after = mapCode2(next, (key, val) => {
        if (key !== 'data' && key !== 'class') return null;
        const m = /^"((?:[^"\\]|\\.)*)"$/.exec(val);
        if (!m || !m[1].includes(',')) return null;
        return key + '=' + m[1].split(',')
          .map(e => /[\s",()#]/.test(e) ? '"' + e + '"' : e).join(',');
      });
      if (after && after !== next) {
        changes.push({ line: n, rule: 'quoted list value → per-element quoting', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1: classic `field` name is a quoted string (`QUOTING-RULES`) ----
    {
      const after = quoteClassicFieldName(next);
      if (after) {
        changes.push({ line: n, rule: 'field classic name quoted', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 (`RULE-POSITION-ENUMERATION`): a typed-block opener's label is a quoted
    // string, exactly as `node`/`group`/`external`/`plane` already were.
    // `bitfield b Hdr` → `bitfield b "Hdr"`. Idempotent by construction: the
    // rewrite ADDS the quotes its own pattern requires to be absent.
    // A MULTI-WORD bare label is NOT rewritten — `table t My Caption` has two
    // readings (`"My Caption"`, or `"My"` plus a surplus argument) and only
    // the author knows which; it is reported.
    {
      const after = quoteBlockLabel(next);
      if (after && after.text) {
        changes.push({ line: n, rule: 'typed-block label quoted', before: trim, after: stripComment(after.text).trim() });
        next = after.text;
      } else if (after && after.report) {
        reports.push({ line: n, code: 'block-label-multiword', msg: after.report });
      }
    }

    // Backlog 29: `title Bare Words` → `title "Bare Words"`.
    // Idempotent by construction: the rewrite ADDS the quotes its own pattern
    // requires to be absent.
    {
      const after = quoteBareTitle(next);
      if (after && after.text) {
        changes.push({ line: n, rule: 'title quoted', before: trim, after: stripComment(after.text).trim() });
        next = after.text;
      } else if (after && after.report) {
        reports.push({ line: n, code: 'title-bare-unquotable', msg: after.report });
      }
    }

    // ---- 0.1 (`RULE-POSITION-ENUMERATION`): RULE 2.4's enum half. A quoted enum value is a
    // line error now, and stripping the quotes is a pure spelling change —
    // the value inside them was already the value the engine used, so the
    // model and the drawing are identical before and after. Idempotent: the
    // rewrite removes the quotes its own pattern matches.
    {
      const after = bareEnumValues(next);
      if (after) {
        changes.push({ line: n, rule: 'enum value written bare (RULE 2.4)', before: trim, after: stripComment(after).trim() });
        next = after;
      }
    }

    // ---- 0.1 (`RULE-POSITION-ENUMERATION`): `step` is RESERVED inside an index= range.
    // REPORT ONLY, never rewritten, and the reason is the reservation's own:
    // the tool cannot tell "prose that reads like a step clause" from "the
    // author wanted every other element". Rewriting either way would put a
    // meaning in the file that the author did not write.
    {
      const im = /(^|\s)index="([^"]*)"/.exec(stripComment(next));
      if (im && /(^|\s)step(\s|$)/.test(im[2].split('..').slice(1).join('..'))) {
        reports.push({
          line: n,
          code: 'index-step-reserved',
          msg: 'index="' + im[2] + '" — "step" is RESERVED inside an index= range (`RULE-POSITION-ENUMERATION`) and this line is now a ' +
               'line error. The tool does not rewrite it, because it cannot tell prose that happens to read like a step ' +
               'clause from an author who meant "every other element" — which is the whole reason the spelling was ' +
               'reserved. If it is prose, respell it ("0..7 stepping by 2", "0..7 in steps of 2"); if you meant a stepped ' +
               'range, v0.1 cannot express it — write the run you can state and put the rest in description=',
        });
      }
    }

    // kind= → shape=
    //
    // NOT on a `chart` line. `kind=` carries two unrelated retired meanings:
    // the chart TYPE (`plot kind=bars3d` → `chart type=bar3d`, `CHART-BLOCK-NAMING`) and the
    // node SHAPE (→ `shape=`). The chart meaning is reported above
    // under `chart-kind`; letting the shape branch run as well produced a
    // SECOND report on the same line telling the author to "set shape=
    // manually" on a chart, which is advice for a directive that has no shape.
    // Found by tools/migrate-check.js fixture 613.
    if (/\bkind\s*=/.test(stripComment(next)) && !/^\s*chart(\s|$)/.test(stripComment(next))) {
      const c = stripComment(next);
      const km = /\bkind\s*=\s*([A-Za-z0-9_-]+)/.exec(c);
      if (km) {
        const k = km[1];
        if (Object.prototype.hasOwnProperty.call(KIND_MAP, k)) {
          const shape = KIND_MAP[k];
          let after;
          if (shape === null) {
            after = next.replace(/\s*\bkind\s*=\s*[A-Za-z0-9_-]+/, '');
            changes.push({ line: n, rule: 'kind= delete (' + k + ')', before: trim, after: stripComment(after).trim() });
          } else {
            after = next.replace(/\bkind\s*=\s*[A-Za-z0-9_-]+/, 'shape=' + shape);
            changes.push({ line: n, rule: 'kind=→shape=' + shape, before: trim, after: stripComment(after).trim() });
          }
          next = after;
        } else if (RETIRED_SHAPES[k]) {
          reports.push({ line: n, code: 'retired-shape', msg: 'kind=' + k + ' → ' + RETIRED_SHAPES[k] });
        } else {
          reports.push({
            line: n,
            code: 'kind-unknown',
            msg: 'kind=' + k + ' has no shape mapping — set shape= manually',
          });
        }
      }
    }

    return next;
  });

  // ── 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`): `size` merged into `pin` ─────────────────────────
  //
  // This is the ONE rewrite in the table that is not a per-line map, because
  // its two cases depend on what OTHER lines say. It therefore runs as a
  // whole-file pass after the map, over the already-rewritten text.
  //
  //   (a) the id has BOTH a `pin` and a `size` line
  //         pin  a at=(20,20)                 →  pin a at=(20,20) width=120 height=60
  //         size a width=120 height=60           (the size line is deleted;
  //                                               the pin line keeps its place)
  //   (b) the id has ONLY a `size` line
  //         size a width=120 height=60        →  pin a width=120 height=60
  //
  // Both are idempotent: each rewrite REMOVES the `size` token its own
  // pattern matches, so a second run finds nothing. (The tool shipped a stale
  // rule for a whole release once — `optional`→`conditional` after `PRESENCE-FLAG-SPELLING` had
  // reversed it — so idempotence is asserted by construction here, not
  // assumed: every branch below deletes or renames the keyword it matched.)
  //
  // Pairing is scoped PER SECTION: a multi-section file (`MULTI-FIGURE-DOCUMENTS`) gives each
  // `figdown 0.1 <genre>` section its own id space, so `size a` in section 2
  // must not fold onto `pin a` in section 1.
  //
  // A trailing comment on a deleted `size` line is CARRIED onto the merged
  // `pin` line rather than dropped — the author wrote it, and a migration
  // that silently eats prose is a migration nobody trusts twice.
  applySizeMerge(out, changes);

  // ── 0.1: AN UNRESOLVED `color=` HOLDS THE WHOLE FILE ──────────────
  //
  // Refusals (a) and (b) are whole-FILE assertions that rest on EVIDENCE
  // INSIDE THE FILE: (a) reads `fill=` and (b) reads the pre-0.1
  // spellings (`w=` `boundary` `unit=` …). Until now the tool refused the
  // colour rewrite and applied every OTHER rewrite in the same pass — which
  // DELETED THE EVIDENCE. Run twice, and refusal (b) is gone:
  //
  //     run 1 (no flag)            reports color-ambiguous, rewrites
  //                                `boundary` → `external`
  //     run 2 --color-means=text   no pre-0.1 spelling survives, so
  //                                nothing refuses, and color= is DELETED —
  //                                silently discarding a FILL, which is the
  //                                exact outcome refusal (b) exists to stop
  //
  // The two-step is not a misuse: it is the workflow refusal (b)'s own message
  // recommends ("migrate the older spellings first, then re-classify"). So the
  // rule is now: while `color=` is present and UNCLASSIFIED, this file is not
  // migrated at all. Nothing is written, everything is reported. Once the
  // author supplies --color-means=fill or =text and the assertion holds, the
  // colour question is settled in the same pass that moves everything else,
  // and there is no second run to be trapped by.
  //
  // Found by tools/migrate-check.js fixture 407 on its first run: the suite
  // asserts idempotence for every fixture, and this defect IS a failure of it.
  const unresolvedColor = hasColor && fileMode !== 'fill' && fileMode !== 'color-delete';
  if (unresolvedColor && changes.length) {
    reports.push({
      line: 1,
      code: 'color-holds-file',
      msg: changes.length + ' other mechanical rewrite(s) in this file were WITHHELD, not ' +
           'applied: ' + [...new Set(changes.map(c => c.rule))].join(', ') + '. An unresolved ' +
           'color= holds the whole file, because the refusals that classify it read EVIDENCE ' +
           'those rewrites would delete — migrate the older spellings first and --color-means ' +
           'has nothing left to refuse, so it would delete a FILL and report success. Settle ' +
           'color= (--color-means=fill|text, or by hand) and re-run; everything else then ' +
           'migrates in the same pass (MIGRATIONS 0.1)',
    });
  }
  if (unresolvedColor) {
    reports.sort((a, b) => a.line - b.line);
    const held = reports.filter(r => r.code !== 'experimental-genre');
    return { text, changes: [], reports: held, rawReports: reports };
  }
  // The fold above is the one rule that can touch a line ABOVE the one it
  // matched, so the change list is no longer in line order by construction.
  // Sort is stable, so two changes on one line keep the order they were made.
  changes.sort((a, b) => a.line - b.line);

  // Filter experimental-genre reports unless flag set
  const filteredReports = reports.filter(r => {
    if (r.code === 'experimental-genre') return false; // only with --flag-experimental, handled below
    return true;
  });

  return {
    text: out.join('\n'),
    changes,
    reports: filteredReports,
    rawReports: reports,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = [];
  for (const p of args.paths) walk(path.resolve(p), files);
  files.sort();

  let nChanged = 0;
  let nReports = 0;
  let nWritten = 0;
  let badOutput = 0;

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const r = migrateText(text, args.colorMeans);
    let reports = r.reports;
    if (args.flagExp) {
      reports = r.rawReports.filter(x =>
        x.code === 'experimental-genre' || reports.includes(x) || r.reports.some(y => y === x)
      );
      // simpler: use rawReports when flagExp
      reports = r.rawReports.filter(x =>
        x.code !== 'experimental-genre' || args.flagExp
      );
      if (!args.flagExp) reports = r.reports;
      else reports = r.rawReports;
    }

    if (!r.changes.length && !reports.length) continue;

    const rel = path.relative(process.cwd(), f) || f;
    if (r.changes.length) {
      nChanged++;
      console.log((args.write ? 'WRITE' : 'WOULD') + '  ' + rel);
      for (const c of r.changes) {
        console.log('  L' + c.line + '  ' + c.rule);
        console.log('    - ' + c.before);
        console.log('    + ' + c.after);
      }
      // REFUSAL (c): parse the OUTPUT before it lands. A file that did not
      // parse BEFORE the rewrite is not held against the rewrite — the tool
      // exists to migrate broken-under-current-spec documents — but a rewrite
      // that introduces new errors is refused and reported.
      if (r.text !== text) {
        const introduced = introducedErrors(text, r.text);
        if (introduced.length) {
          badOutput++;
          console.log('  REFUSED — the rewritten file does not parse; nothing written:');
          for (const e of introduced.slice(0, 6)) console.log('    ' + e);
          if (introduced.length > 6) console.log('    … ' + (introduced.length - 6) + ' more');
          nChanged--;
          continue;
        }
        if (args.write) {
          fs.writeFileSync(f, r.text, 'utf8');
          nWritten++;
        }
      }
    }
    if (reports.length) {
      nReports += reports.length;
      if (!r.changes.length) console.log('REPORT  ' + rel);
      for (const rep of reports) {
        console.log('  L' + rep.line + '  [' + rep.code + '] ' + rep.msg);
      }
    }
  }

  console.log('\nfiles scanned: ' + files.length +
    '  mechanical: ' + nChanged +
    (args.write ? '  written: ' + nWritten : '  (dry-run)') +
    '  report items: ' + nReports +
    (badOutput ? '  REFUSED (output does not parse): ' + badOutput : ''));
  if (nReports || badOutput) process.exit(1);
}

// Exported so the editor's embedded examples can be migrated by the same
// rules that migrate a .fd file (tools/editor-check.js) — one implementation,
// never a second copy of the rewrite table. `introducedErrors` is exported for
// the same reason: tools/migrate-check.js proves REFUSAL (c) against the code
// that actually runs.
module.exports = { migrateText, introducedErrors };

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.stack || e);
    process.exit(2);
  }
}
