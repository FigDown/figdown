#!/usr/bin/env node
/**
 * capability-coverage.js — does the EXAMPLE CORPUS demonstrate every
 * capability the language has?
 *
 * WHY THIS EXISTS
 * ----------------------------
 * VERBATIM-REGION-SCOPE shipped — a `#` inside a bracketed edge label is
 * verbatim — and no example in the repo ever used it. Nothing noticed. The
 * newest construct in the language was heading into the freeze with zero
 * demonstrators, and the same was true of `flow left`, `flow up`, the `\"`
 * escape, a negative `at=`, `chart` on a scene document, and the whole
 * one-document hybrid form (GENRE-COMPOSITION). Six gaps, none of them caught by seventeen
 * gates, because every gate asked "is what is here correct?" and none asked
 * "is everything the language can do here at all?".
 *
 * `tools/reference-coverage.js` asks the second question, but only of
 * `examples/reference/` — the form-complete set for the six genres. That set
 * cannot carry a corpus-level capability: `flow` is single-valued per
 * document, so no ONE reference figure can show all four directions, and
 * reference-coverage deliberately excludes keyword-argument enums for exactly
 * that reason. Spread across a CORPUS the same enum is perfectly coverable.
 * This tool is that question asked of every `.fd` under `examples/`.
 *
 * HOW IT AVOIDS ASKING ONLY WHAT IT ALREADY KNOWS
 * -----------------------------------------------
 * A coverage check that enumerates a hand-written list reports "0 gaps" and
 * means "nothing I recognised" — this project has hit that failure four
 * separate times. So the capability space here is DERIVED wherever derivation
 * is possible, and the one part that cannot be derived is fenced by a guard
 * that fails when the spec moves past it:
 *
 *   A. keywords      — engine `GENRE_KW` + `CHILD_KW` + the `|` row token,
 *                      minus every spelling the engine's own retirement
 *                      diagnostics name. No list here.
 *   B. option keys   — engine `DIRECTIVE_OPTS`, minus `RETIRED_OPT_KEYS`,
 *                      minus keys that appear in DIRECTIVE_OPTS only so a
 *                      retirement message can fire (detected by reading the
 *                      engine's own diagnostics). No list here.
 *   C. enum values   — every value of every closed enum, from the engine:
 *                      `shape` `style` `extend` `numbering` (via
 *                      reference-coverage's `engineEnums`), the `chart`
 *                      `type=` value set, and the KEYWORD-ARGUMENT enum
 *                      `flow`, which reference-coverage cannot check.
 *                      No list here.
 *   D. comma forms   — `reference-coverage.MULTIVALUE`, required rather than
 *                      restated, and probe-verified against the engine there.
 *   E. escapes       — parsed out of the ABNF `escape` production in
 *                      spec/core.md §11. Grow the production and this tool
 *                      demands a demonstrator for the new alternative with
 *                      no edit here. Derived FROM THE SPEC TEXT.
 *   F. structural    — A DECLARED LIST. See the honesty section below.
 *
 *   CROSS-CHECK (A, B): the derived keyword and option-key sets are compared
 *   against the Complete-vocabulary tables of the spec genre documents, read
 *   with reference-coverage's `extractVocab`. A construct the SPEC documents
 *   and the engine does not implement, or the reverse, is itself a failure —
 *   so neither source can hide a capability from this tool by itself.
 *
 * WHAT IS DECLARED, AND WHY IT HAS TO BE
 * --------------------------------------
 * Axis F is a hand-written table and there is no honest way around it. The
 * capabilities on it — a nested typed region, a negative coordinate, a `#`
 * that survives inside brackets, a `class` that claims no meaning — add no
 * keyword, no option key, no enum value and no escape. They are refinements
 * of what an EXISTING construct accepts, and nothing in the engine or the
 * spec enumerates them as a set. VERBATIM-REGION-SCOPE is precisely that shape, which is why
 * it slipped.
 *
 * So the list is fenced twice:
 *
 *   1. EVERY entry names a spec anchor — a literal string that must still be
 *      present in the named spec file. Reword or delete the passage and this
 *      tool fails rather than silently checking a capability the spec no
 *      longer describes. Several entries may share one anchor (the ten
 *      written-empty-label sites are one spec sentence); removing that
 *      sentence fails every entry that cites it, which is the point.
 *   (The source repository adds a RULING WATERMARK axis here, which
 *   reads its numbered ruling ledger. That ledger is internal working
 *   record and is not published, so the axis is not part of this copy.)
 *
 * THE GRANULARITY OF AXIS F IS PER SITE, NOT PER RULING
 * -----------------------------------------------------------------
 * Until this release each declared entry was ONE probe for a whole ruling, so a
 * ruling that reaches several constructs was satisfied by any one of them.
 * Measured: `examples/gre.fd` carried the corpus's only `field ""`, and
 * rewriting it to a named field left this gate green — `node ""` in
 * `examples/reference/block.fd` answered for it. But `field ""` draws an
 * unnamed CELL and `node ""` draws an unnamed BOX; a reader shown one has not
 * been shown the other, and the language's own claim is that `""` is written
 * at ten different directives.
 *
 * So an entry is now one SITE — one directive, one token, one syntactic
 * region — and a ruling that spans sites is split across as many entries.
 * The site set comes FROM THE SPEC, never from the corpus: deriving it from
 * what the examples happen to contain would make the gate agree with whatever
 * is there. Where the spec enumerates the sites itself (core §12.3 lists the
 * ten `""` directives; core §1 lists the four verbatim regions; core §4 lists
 * the three composable region openers) that enumeration IS the split.
 *
 * A site is where the SYNTAX IS WRITTEN, not what it is written about. A
 * negative `at=` is one entry, not three, although §3 says `at=` applies to
 * nodes, groups and externals: the coordinate is written on one directive
 * (`pin`) with one grammar, and a reader who has seen `pin x at=(-30,0)`
 * knows the form wherever the id points. Most entries below are single-site
 * for the same reason, and going per-construct across the board would have
 * doubled the list for nothing (CAPABILITY-COVERAGE-GRANULARITY).
 *
 * WHAT THIS TOOL DOES NOT COVER — stated plainly, not minimised:
 *   - It checks that a capability has AT LEAST ONE demonstrator. It does not
 *     check that the demonstrator is good, or that the figure is correct.
 *   - A `#` inside a COMMENT is core §1's fourth verbatim region and has no
 *     entry: every comment opens with a `#`, so a probe for one could not
 *     fail, and a probe that cannot fail is not a probe.
 *   - Axis F is only as complete as the last ruling review. The watermark
 *     forces a review; it cannot perform one.
 *   - Combinations are out of scope. `present=` is covered and `index=` is
 *     covered; a field carrying both is not a tracked capability.
 *   - Error cases are out of scope — that is `conformance/`.
 *   - Semantics are out of scope. A demonstrator is a line that parses and
 *     uses the construct; whether it uses it WELL is a human judgement.
 *
 * Usage:
 *   node tools/capability-coverage.js [--strict] [--verbose]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RC = require('./reference-coverage.js');

const ROOT = RC.ROOT;
const EXAMPLES = path.join(ROOT, 'examples');

// id      : what is reported when it has no demonstrator — it must name the
//           SITE, because "somewhere in the corpus" is the failure this
//           granularity exists to prevent
// anchor  : [spec file, literal substring that must still be present]
// detect  : run against COMMENT-STRIPPED source, so a capability described in
//           a comment never counts as demonstrated. A GFM pipe row is NOT
//           comment-stripped (core §1: the whole row is verbatim), which is
//           what makes the pipe-row `#` site observable at all.

/** The `figdown`-headed sections of a document, comment-stripped. */
function sections(text) {
  return text.split(/^(?=figdown\s)/m).filter(s => /^figdown\s/.test(s));
}
/** A typed region `kw` opened at the top level of a SCENE document (core §4). */
function nestedRegion(kw) {
  const open = new RegExp('^' + kw + '\\s+\\S', 'm');
  return t => sections(t).some(s =>
    /^figdown\s+\S+\s+(?:block|topology|flowchart)\b/.test(s) && open.test(s));
}
/** `<kw> [opts] <id> ""` — a written-empty label on a directive that has one. */
function emptyLabel(kw) {
  const re = new RegExp('^\\s*' + kw + '\\s+(?:[\\w-]+=\\S+\\s+)*[A-Za-z_][\\w-]*\\s+""(?:\\s|$)', 'm');
  return t => re.test(t);
}
/** Lines that are GFM pipe rows, minus the delimiter row (`|---|:--|`). */
function pipeRows(t) {
  return t.split('\n').map(l => l.trim())
    .filter(l => l.startsWith('|') && !/^\|[\s:|-]+$/.test(l));
}
/** A `#` inside a quoted string — scanned, not regexed: `a" fill=#hex b"` is
 *  two strings with the `#` BETWEEN them, and a regex reads it as inside. */
function hashInString(t) {
  for (const line of t.split('\n')) {
    let inq = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inq && c === '\\') { i++; continue; }
      if (c === '"') inq = !inq;
      else if (inq && c === '#') return true;
    }
  }
  return false;
}

const STRUCTURAL = [
  // ── Composition (core §4): three openers have a region form, so three sites
  { id: 'hybrid nested region (GENRE-COMPOSITION) — `bitfield` region inside a scene document',
    anchor: ['spec/core.md', 'Only `bitfield`, `table` and `timing` have a region form'],
    detect: nestedRegion('bitfield') },
  { id: 'hybrid nested region (GENRE-COMPOSITION) — `table` region inside a scene document',
    anchor: ['spec/core.md', 'A typed block is a nested genre region'],
    detect: nestedRegion('table') },
  { id: 'hybrid nested region (GENRE-COMPOSITION) — `timing` region inside a scene document',
    anchor: ['spec/core.md', 'Only `bitfield`, `table` and `timing` have a region form'],
    detect: nestedRegion('timing') },
  { id: 'hybrid multi-section (MULTI-FIGURE-DOCUMENTS) — a second `figdown` header in one file',
    anchor: ['spec/core.md', '*insignificant header'],
    detect: t => (t.match(/^figdown\s/gm) || []).length > 1 },
  // ── The verbatim regions (core §1). Three of the four are sites; the fourth
  //    is the comment itself, which no probe can fail on (see the header).
  { id: 'verbatim `#` inside a quoted string',
    anchor: ['spec/core.md', '`#` starts a comment'],
    detect: hashInString },
  { id: 'verbatim `#` inside a bracketed edge label (VERBATIM-REGION-SCOPE)',
    anchor: ['spec/core.md', 'VERBATIM-REGION-SCOPE'],
    detect: t => /^\s*edge\b.*\[[^\]\n]*#[^\]\n]*\]/m.test(t) },
  { id: 'verbatim `#` inside a GFM pipe row',
    anchor: ['spec/core.md', 'a comment or a GFM pipe row is ordinary text'],
    detect: t => pipeRows(t).some(l => l.includes('#')) },
  // ── One directive, one grammar: `at=` is written only on `pin` (§3), so the
  //    negative coordinate is ONE site even though the id may name a node, a
  //    group or an external.
  { id: 'negative `at=` coordinate',
    anchor: ['spec/core.md', 'at=(<x>,<y>)'],
    detect: t => /\bat=\(\s*-\d|\bat=\([^)]*,\s*-\d/.test(t) },
  { id: '`class x ""` — a class that claims no meaning (CLASS-EMPTY-MEANING)',
    anchor: ['spec/core.md', 'class x ""'],
    detect: t => /^\s*class\s+[A-Za-z_][\w-]*\s+""/m.test(t) },
  // ── The written-empty label (EMPTY-LABEL-STATE). core §12.3 enumerates the directives
  //    that record `label: ""`; that sentence is the site list, and the
  //    eleventh site — `field` — is the bitfield genre's own name slot, whose
  //    empty form the core sentence does not mention. It draws an unnamed
  //    CELL, which is not what any of the others draw.
  ...['node', 'group', 'bundle', 'external', 'plane', 'bitfield', 'table', 'timing']
    .map(kw => ({
      id: 'written-empty label (EMPTY-LABEL-STATE) — `' + kw + ' <id> ""`',
      anchor: ['spec/core.md', 'The empty string is a written value'],
      detect: emptyLabel(kw) })),
  { id: 'written-empty label (EMPTY-LABEL-STATE) — `title ""`',
    anchor: ['spec/core.md', 'The empty string is a written value'],
    detect: t => /^\s*title\s+""\s*$/m.test(t) },
  { id: 'written-empty label (EMPTY-LABEL-STATE) — `field ""` (an unnamed cell)',
    anchor: ['spec/genres/bitfield.md', 'field "<name>"'],
    detect: t => /^\s*field\s+""(?:\s|:|$)/m.test(t) },
  { id: 'field wider than `word=` — one field spanning rows (R128)',
    anchor: ['spec/genres/bitfield.md', 'word'],
    detect: (t, doc) => !!doc && (doc.blocks || []).some(b =>
      b.type === 'bitfield' && +b.word > 0 &&
      (b.fields || []).some(f => +f.w > +b.word)) },
  { id: '`present=` — conditional presence with the condition as its value',
    anchor: ['spec/genres/bitfield.md', 'present'],
    detect: t => /\bpresent=/.test(t) },
  { id: '`index=<first>..<last>` — the repetition construct (BITFIELD-REPETITION-CONSTRUCT)',
    anchor: ['spec/genres/bitfield.md', 'index'],
    detect: t => /\bindex=\S*\.\./.test(t) },
  { id: '`*` field width — length not carried in the document',
    anchor: ['spec/genres/bitfield.md', '`*`'],
    detect: t => /^\s*field\s+.*\s\*(?:\s|$)/m.test(t) },
  { id: '`<br>` inside a table cell — the only multi-line cell form',
    anchor: ['spec/genres/table.md', '<br>'],
    detect: t => /^\s*\|.*<br\s*\/?>/im.test(t) },
  // Two markers, two sites. The pre-0.1 probe read
  // `(?:\^\^|<<)`, and `<<` is not a marker this language has ever had —
  // the colspan is an EMPTY SEGMENT, `||`. The alternative could never have
  // matched anything, and `^^` alone was answering for both.
  { id: 'cell span marker `^^` — rowspan-up',
    anchor: ['spec/genres/table.md', '`^^` rowspan-up'],
    detect: t => pipeRows(t).some(l => /\|\s*(?<!\\)\^\^\s*\|/.test(l)) },
  { id: 'cell span marker `||` — colspan-left, spelled as an empty segment',
    anchor: ['spec/genres/table.md', 'The colspan is spelled by an EMPTY segment'],
    detect: t => pipeRows(t).some(l => /(?<!\\)\|\|/.test(l)) },
  { id: '`highlight` — the positional row flag on `cell`',
    anchor: ['spec/genres/table.md', 'highlight'],
    detect: t => /^\s*cell\s+\S+\s+highlight\b/m.test(t) },
  { id: 'header-tier row address `h<N>` on `cell`',
    anchor: ['spec/genres/table.md', 'h1'],
    detect: t => /^\s*cell\s+\(?h\d/m.test(t) },
  { id: 'a `layout` zone — geometry separated from content (GUI-WRITEBACK-STRUCTURE)',
    anchor: ['spec/core.md', 'layout'],
    detect: t => /^\s*layout\s*$/m.test(t) },
];

// ── Corpus ───────────────────────────────────────────────────────────────────
function walk(dir, out) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.fd')) out.push(p);
  }
  return out;
}

// ── Engine-derived axes ──────────────────────────────────────────────────────
function grabSet(src, name) {
  const m = new RegExp('const ' + name + '=new Set\\(\\[([\\s\\S]*?)\\]\\)').exec(src);
  if (!m) throw new Error('engine drift: cannot read ' + name + ' — update this tool');
  return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''))
    .filter(x => /^[a-z][\w-]*$/.test(x));
}

function derivedSpace(engine) {
  const src = engine.src;
  const facts = RC.engineVocabFacts(engine);
  const enums = RC.engineEnums(engine);

  // A — keywords
  const kw = new Set(grabSet(src, 'CHILD_KW'));
  for (const g of Object.keys(engine.GENRE_KW)) for (const k of engine.GENRE_KW[g]) kw.add(k);
  kw.delete('figdown');                       // always present; the header IS the document
  kw.add('|');                                // the table row token
  for (const k of facts.retiredKw) kw.delete(k);

  // B — option keys. DIRECTIVE_OPTS is the engine's applicable-key registry,
  // but it also lists keys that exist there ONLY so a retirement diagnostic
  // fires (edge `label=`/`taillabel=`/`headlabel=`, band `from=`/`to=`). Those
  // are found by reading the engine's own messages, never by a list here.
  const doBody = /const DIRECTIVE_OPTS=(\{[\s\S]*?\n\});/.exec(src);
  if (!doBody) throw new Error('engine drift: cannot read DIRECTIVE_OPTS — update this tool');
  // Evaluated, not regexed: a directive whose NAME needs quoting (`'break'`,
  // `'class'`) is indistinguishable from an option-key value by pattern alone,
  // and reading `'break':[]` as an option key invented an option `break=` that
  // has never existed in the language.
  const dirOpts = new Function('return ' + doBody[1])();
  const optAll = new Set();
  for (const d of Object.keys(dirOpts)) for (const k of dirOpts[d]) optAll.add(k);
  if (optAll.size < 15 || Object.keys(dirOpts).length < 15)
    throw new Error('engine drift: DIRECTIVE_OPTS parsed to ' + Object.keys(dirOpts).length +
      ' directives / ' + optAll.size + ' option keys — update this tool');
  const deadByMessage = new Set();
  { // `k+'= is retired`, `'<k>= retired`, `from=/to= retired`, …
    let m;
    const re = /'([a-z][\w-]*)=(?:\/([a-z][\w-]*)=)? (?:is )?(?:retired|WITHDRAWN)/g;
    while ((m = re.exec(src))) { deadByMessage.add(m[1]); if (m[2]) deadByMessage.add(m[2]); }
    const loop = /for\(const k of \[((?:'[a-z][\w-]*',?\s*)+)\]\)\s*\n?\s*if\(o2\[k\]!==undefined\)\{ err\(n,k\+'= is retired/.exec(src);
    if (loop) for (const s of loop[1].split(',')) deadByMessage.add(s.trim().replace(/'/g, ''));
  }
  if (deadByMessage.size < 3)
    throw new Error('engine drift: found only ' + deadByMessage.size +
      ' diagnostic-only option keys; the retirement messages moved — update this tool');
  const opt = new Set();
  for (const k of optAll)
    if (!facts.retiredOpt.has(k) && !deadByMessage.has(k)) opt.add(k);

  // C — closed enums, including the keyword-argument enum reference-coverage
  // cannot ask a single figure for.
  const enumVals = [];
  for (const key of Object.keys(enums))
    for (const v of enums[key]) enumVals.push({ kind: 'opt', key, val: v });
  const chartType = /ptype!=='([a-z0-9]+)'/.exec(src);
  if (!chartType) throw new Error('engine drift: cannot read the chart type= enum — update this tool');
  enumVals.push({ kind: 'opt', key: 'type', val: chartType[1] });
  const flow = /\[((?:'[a-z]+',?\s*)+)\]\.includes\(pos\[1\]\)/.exec(src);
  if (!flow) throw new Error('engine drift: cannot read the flow direction enum — update this tool');
  for (const v of flow[1].split(',').map(s => s.trim().replace(/'/g, '')))
    enumVals.push({ kind: 'kwarg', key: 'flow', val: v });

  return { kw, opt, enumVals };
}

// E — escapes, read out of the spec's own ABNF.
function specEscapes() {
  const md = fs.readFileSync(path.join(ROOT, 'spec', 'core.md'), 'utf8');
  const m = /^escape\s*=\s*(.+)$/m.exec(md);
  if (!m) throw new Error('spec drift: no `escape` production in spec/core.md §11 — update this tool');
  const out = [];
  const re = /"([^"]+)"|DQUOTE/g;
  let x; let first = true;
  while ((x = re.exec(m[1]))) {
    const lit = x[0] === 'DQUOTE' ? '"' : x[1];
    if (first && lit === '\\') { first = false; continue; }   // the leading backslash
    first = false;
    out.push(lit);
  }
  if (!out.length) throw new Error('spec drift: the `escape` production lists no alternatives — update this tool');
  return out;
}

// ── Spec cross-check (A, B) ──────────────────────────────────────────────────
function specVocab(engine) {
  const facts = RC.engineVocabFacts(engine);
  const kw = new Set(), opt = new Set();
  for (const g of RC.GENRES) {
    const p = RC.genreDocFor(g);
    if (!fs.existsSync(p)) continue;
    const v = RC.extractVocab(g, fs.readFileSync(p, 'utf8'), false, facts);
    for (const k of v.keywords.keys()) kw.add(k);
    for (const k of v.optionKeys.keys()) opt.add(k);
  }
  return { kw, opt };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const verbose = args.includes('--verbose');
  for (const a of args) if (a.startsWith('-') && !['--strict', '--verbose'].includes(a))
    throw new Error('unknown flag ' + a);

  const engine = RC.loadEngine();
  RC.checkMultivalueProbes(engine);                 // the comma forms still parse
  const { kw, opt, enumVals } = derivedSpace(engine);
  const escapes = specEscapes();
  const sv = specVocab(engine);

  // Watermark

  const files = walk(EXAMPLES, []);
  const strip = RC.stripComment;

  // Per-file scan
  const cap = new Map();                            // capability id -> [file]
  const note = (id, f) => {
    if (!cap.has(id)) cap.set(id, []);
    if (f) cap.get(id).push(path.relative(ROOT, f));
  };
  const declare = id => { if (!cap.has(id)) cap.set(id, []); };

  for (const k of kw) declare('keyword `' + k + '`');
  for (const k of opt) declare('option key `' + k + '=`');
  for (const e of enumVals)
    declare(e.kind === 'opt' ? 'enum value `' + e.key + '=' + e.val + '`'
                             : 'enum value `' + e.key + ' ' + e.val + '`');
  for (const mv of RC.MULTIVALUE)
    declare('comma form `' + mv.name + (mv.kind === 'opt' ? '=a,b`' : ' a,b`'));
  for (const e of escapes) declare('escape `\\' + e + '`');
  for (const s of STRUCTURAL) declare(s.id);

  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    const text = raw.split(/\r?\n/).map(strip).join('\n');
    let doc = null;
    // Multi-section files parse to `docs`; every section is inspected, so a
    // capability demonstrated in a later section still counts.
    try {
      const r = engine.parse(text);
      const ds = r.docs && r.docs.length ? r.docs : (r.doc ? [r.doc] : []);
      doc = { blocks: ds.reduce((a, d) => a.concat(d.blocks || []), []) };
    } catch (e) { doc = null; }

    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith('|')) note('keyword `|`', f);
      const m = /^([a-z][\w-]*)\b/.exec(t);
      if (m && kw.has(m[1])) note('keyword `' + m[1] + '`', f);
      let om; const optRe = /(?:^|\s)([a-z][\w-]*)=/g;
      while ((om = optRe.exec(t))) if (opt.has(om[1])) note('option key `' + om[1] + '=`', f);
    }
    for (const e of enumVals) {
      const re = e.kind === 'opt'
        ? new RegExp('(?:^|\\s)' + e.key + '=' + e.val + '(?:\\s|$)')
        : new RegExp('^\\s*' + e.key + '\\s+' + e.val + '\\s*$', 'm');
      if (re.test(text))
        note(e.kind === 'opt' ? 'enum value `' + e.key + '=' + e.val + '`'
                              : 'enum value `' + e.key + ' ' + e.val + '`', f);
    }
    for (const mv of RC.MULTIVALUE)
      if (mv.detect.test(text))
        note('comma form `' + mv.name + (mv.kind === 'opt' ? '=a,b`' : ' a,b`'), f);
    for (const e of escapes) {
      // The escape must be inside a quoted region; a bare `\n` in a table cell
      // is not the grammar's `escape`.
      const re = new RegExp('"[^"\\n]*\\\\' + e.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'));
      if (re.test(text) || new RegExp('\\[[^\\]\\n]*\\\\' + e.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')).test(text))
        note('escape `\\' + e + '`', f);
    }
    for (const s of STRUCTURAL) if (s.detect(text, doc)) note(s.id, f);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('capability-coverage  engine=' + path.relative(ROOT, engine.path) +
    '  corpus=' + files.length + ' .fd under examples/');
  console.log('  derived: keywords=' + kw.size + ' optionKeys=' + opt.size +
    ' enumValues=' + enumVals.length + ' commaForms=' + RC.MULTIVALUE.length +
    ' escapes=' + escapes.length + '  declared: structural=' + STRUCTURAL.length);

  let fail = 0;

  // Cross-check A/B against the spec genre documents.
  // A genre document lists its own genre token as a keyword, because `bitfield
  // …` opens the region form. Three genres HAVE no region form (core §4: only
  // `bitfield`, `table` and `timing` can be composed), so their token is a
  // HEADER token only and is legitimately absent from the engine's keyword
  // sets. That set is derived, not listed: it is the genres the engine never
  // admits as a keyword in any genre's namespace.
  const composable = new Set();
  for (const g of Object.keys(engine.GENRE_KW)) for (const k of engine.GENRE_KW[g])
    if (RC.GENRES.includes(k)) composable.add(k);
  const xkw = [...sv.kw].filter(k =>
    !kw.has(k) && k !== 'figdown' && !(RC.GENRES.includes(k) && !composable.has(k)));
  const xopt = [...sv.opt].filter(k => !opt.has(k) && !RC.EXP_OPTION_KEYS.has(k));
  if (xkw.length || xopt.length) {
    console.log('\nSPEC/ENGINE DIVERGENCE — documented but not in the derived space:');
    if (xkw.length) console.log('  keywords: ' + xkw.join(', '));
    if (xopt.length) console.log('  option keys: ' + xopt.map(k => k + '=').join(', '));
    console.log('  (one of the two sources is wrong; this tool cannot say which)');
    fail++;
  } else {
    console.log('  spec/engine cross-check: ok (' + sv.kw.size + ' documented keywords, ' +
      sv.opt.size + ' documented option keys, all in the derived space)');
  }

  // Anchors for the declared axis.
  const badAnchor = [];
  for (const s of STRUCTURAL) {
    const p = path.join(ROOT, s.anchor[0]);
    if (!fs.existsSync(p) || !fs.readFileSync(p, 'utf8').includes(s.anchor[1]))
      badAnchor.push(s.id + '  [' + s.anchor[0] + ' no longer contains "' + s.anchor[1] + '"]');
  }
  if (badAnchor.length) {
    console.log('\nSTALE ANCHOR — a declared capability no longer points at live spec text:');
    for (const b of badAnchor) console.log('  ' + b);
    fail++;
  } else {
    console.log('  declared-list anchors: ok (' + STRUCTURAL.length + ' resolve into the spec)');
  }


  // The coverage question itself.
  const missing = [...cap.entries()].filter(([, v]) => v.length === 0).map(([k]) => k);
  const single = [...cap.entries()].filter(([, v]) => v.length === 1);
  if (missing.length) {
    console.log('\nNO DEMONSTRATOR (' + missing.length + ' of ' + cap.size + ' capabilities):');
    for (const m of missing) console.log('  ' + m);
    console.log('\n  Each of these is something FigDown can do that no figure under');
    console.log('  examples/ does. Add one — a capability with no example is a');
    console.log('  capability nobody has read.');
    fail++;
  } else {
    console.log('  demonstrators: ok (all ' + cap.size + ' capabilities have at least one)');
  }

  if (verbose && single.length) {
    console.log('\nSINGLE DEMONSTRATOR (' + single.length + ') — advisory, not a gap:');
    for (const [k, v] of single) console.log('  ' + k + '  ->  ' + v[0]);
  } else if (single.length) {
    console.log('  single-demonstrator capabilities: ' + single.length + ' (--verbose to list)');
  }

  console.log('\n' + (fail ? 'FAIL  ' + fail + ' finding(s)' : 'OK  the corpus demonstrates the whole derived capability space'));
  if (strict && fail) process.exit(1);
}

if (require.main === module) {
  try { main(); }
  catch (e) { console.error(e.stack || e); process.exit(2); }
}
