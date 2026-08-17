#!/usr/bin/env node
/**
 * skill-coverage.js — the agent skill teaches the whole registry, and nothing
 * retired.
 *
 * `skill/figdown/` is the document that AUTHORS documents. Everything else in
 * this repository is checked against the engine — conformance fixtures,
 * reference figures, `.fd` comments, ` ```figdown ` fences. The skill bundle's
 * PROSE was checked by nothing, and it is the single highest-leverage text in
 * the project: it authored 642 downstream `.fd` files. Two spellings it taught
 * (`edge … fill=` and a `fill=`-only class joined by an edge) had been hard
 * errors and went on being taught for four releases, and the
 * measured consequence was recorded as *supply, not demand*: `stroke=` was
 * demoted to EXPERIMENTAL on a corpus count of 5, taken from a corpus that had
 * been taught not to use it.
 *
 * A gate cannot check that prose is TRUE. It can check that the prose is
 * COMPLETE against the registry and CURRENT against the retirement tables,
 * which is the half that was silently rotting.
 *
 * Usage:
 *   node tools/skill-coverage.js [--strict] [--normative-only] [--verbose]
 *
 *   --normative-only  require only the v0.1 conformance surface
 *   --strict          exit 1 on any finding
 *   --verbose         list every taught token per file
 *
 * ── What it checks ──────────────────────────────────────────────────────────
 *
 *   0. VENDOR      `skill/figdown/reference/` is byte-identical to the LIVE
 *                  `read/<X.Y>/`, which is the source of truth (
 *                  GENRE-REFERENCE-ADDRESS; the live directory became `read/0.2/` at STATECHART-GENRE-SCOPE, `read/0.3/` at DRAWN-ANNOTATION-FORM and
 *                  `read/0.4/` at SEQUENCE-GENRE-VOCABULARY). The bundle
 *                  carries its own copy because it is installed standalone,
 *                  with no repository and no network; a generated copy that
 *                  nothing compares is the eighth four-copy-drift incident
 *                  waiting to happen.
 *   1. ROUTE     every genre named by the engine's own allowlist has a row
 *                  in SKILL.md's router table, and every file that row names
 *                  exists. Progressive disclosure that an agent cannot
 *                  navigate is not disclosure — it is a bundle that gets read
 *                  whole.
 *   2. MISSING     a registered keyword, option key or enum value of genre G
 *                  that G's LOAD SET (SKILL.md + the files its router row
 *                  names) never teaches. This is the per-genre minimum-set
 *                  check: the genre document's Complete-vocabulary table IS
 *                  the minimum set.
 *   3. RETIRED     a retired or WITHDRAWN spelling taught anywhere in the
 *                  bundle without a retirement marker beside it. Naming a
 *                  retirement is allowed and often necessary; teaching the
 *                  spelling as if it were live is the defect.
 *   4. CORE        SKILL.md — the file that is ALWAYS loaded — teaches nothing
 *                  outside the genre-independent surface. That surface is not
 *                  a judgement call: it is the INTERSECTION of the engine's
 *                  per-genre top-level allowlists, plus the presentation
 *                  option keys core §5 permits on any element. A genre-owned
 *                  keyword in the always-loaded file is a token every agent
 *                  pays for and most agents cannot use.
 *   5. ISOLATION   a FROZEN genre's load set names no file inside the
 *                  bundle's `experimental/` subtree, and teaches no
 *                  EXPERIMENTAL construct. Same criterion as
 *                  `tools/isolation-check.js`, applied to the skill: delete
 *                  the experimental files and the rest must still teach a
 *                  complete v0.1.
 *
 * ── Where the facts come from ───────────────────────────────────────────────
 *
 * Nothing here is a list this tool maintains. The registry comes from the
 * genre documents' Complete-vocabulary tables and from `editor/figdown.html`,
 * read through `tools/reference-coverage.js`, which is the project's one
 * reader of both. The retirement tables come from the engine's own
 * `RETIRED_OPT_KEYS`, `RETIRED_SHAPES` and retirement diagnostics — the three
 * sources `tools/comment-check.js` reads. Every lookup throws if the engine's
 * spelling moves, so drift breaks this tool loudly instead of quietly checking
 * less (the LANE-ALPHABET-KEY-RESERVATION guard discipline).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RC = require('./reference-coverage.js');

const ROOT = RC.ROOT;
const BUNDLE = path.join(ROOT, 'skill', 'figdown');
const SKILL = path.join(BUNDLE, 'SKILL.md');
// The source of truth for the per-genre reading files. `skill/figdown/reference/`
// is a generated mirror of this directory — see check 0, VENDOR.
const READ_SRC = path.join(ROOT, 'read', '0.4');
// Reference files that answer a TASK rather than a genre, so no genre row can
// name them. They are routed by SKILL.md's task list, which is prose an agent
// reads and a regex cannot check.
const UNROUTED_OK = /^reference\/(reading|transcribe)\.md$/;

// ── Retired vocabulary, read out of the engine ───────────────────────────────
// Same three sources as comment-check.js, and the same verb list. It is WIDER
// than the one reference-coverage.js uses, which omits `reverted` and
// `WITHDRAWN` — so `path` and `routing`, withdrawn, are
// invisible to that tool and visible here. That divergence is reported by
// `--verbose`; it is a defect in the narrower list, not in this one.
const RETIRE_VERBS = '(?:renamed|retired|DELETED|reverted|WITHDRAWN)';

function retiredVocab(engine) {
  const optKeys = new Set(Object.keys(engine.RETIRED_OPT_KEYS));
  const enumVals = new Set(Object.keys(engine.RETIRED_SHAPES).map(v => 'shape=' + v));
  const keywords = new Set();
  for (const re of [
    new RegExp('(?:^|[^\\w-])([a-z][\\w-]*) has been ' + RETIRE_VERBS, 'g'),
    new RegExp('"([a-z][\\w-]*)" has been ' + RETIRE_VERBS, 'g'),
  ]) {
    let m;
    while ((m = re.exec(engine.src))) keywords.add(m[1]);
  }
  for (const v of Object.keys(engine.RETIRED_SHAPES)) keywords.delete(v);
  if (optKeys.size < 8 || !enumVals.size || keywords.size < 6)
    throw new Error('engine drift: read only ' + optKeys.size +
      ' retired option keys, ' + enumVals.size + ' retired enum values and ' +
      keywords.size + ' retired keywords out of the engine — update this tool');
  return { optKeys, enumVals, keywords };
}

// Retired KEYWORDS whose spelling is also ordinary English or a live spelling
// in the option-key namespace, so a backticked bare token is not evidence.
// These are checked only where a keyword can actually stand: the first token
// of a directive line inside a ```figdown fence. Each entry is asserted below
// to still BE a retired keyword, so the opt-out cannot rot.
const AMBIGUOUS_KW = {
  fill: 'the live option key `fill=` (retired only as the keyword that became `band`)',
  line: 'a source line number, and "line" in ordinary prose',
  route: 'a routing-table entry — a domain noun in these figures',
  render: 'the verb, and the renderer this repo talks about constantly',
  size: 'the ordinary noun; the keyword merged into `pin`',
  optional: 'the ordinary adjective; the field flag became `present=`',
  conditional: 'the ordinary adjective; the field flag became `present=`',
  boundary: 'the ordinary noun; the keyword became `external`',
  wrap: 'the ordinary verb; the bitfield child became `break`',
};

// A retirement is ADMITTED when a marker stands beside the mention. 0.1
// is accepted for files this tool does not own, but the skill bundle is
// deliberately free of dev-increment provenance — an authoring agent learns
// nothing from WHEN a rule landed — so the verbs are what the bundle uses.
const RETIRE_MARKER =
  /\bretired\b|\bRETIRED\b|\brenamed\b|\bwithdrawn\b|\bWITHDRAWN\b|\bDELETED\b|\breverted\b|\bline error\b|\bno longer\b|\bnot a keyword\b|\bdo not write\b|\bnever write\b|0\.1-dev\.\d+/;

// ── Keyword-argument enums, read out of the engine ───────────────────────────
// reference-coverage.js deliberately does NOT track these: `flow` is
// single-valued per document (REPEATED-DIRECTIVE-HANDLING), so no one figure can demonstrate every
// value and demanding it would be a false gap. A TEACHING document has no such
// excuse — it can and must name all four — so the check that is wrong for a
// figure is exactly right here.
function keywordEnums(engine) {
  const grab = (re, what) => {
    const m = re.exec(engine.src);
    if (!m) throw new Error('engine drift: cannot read the ' + what +
      ' enum out of the engine — update this tool');
    return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  };
  return {
    flow: grab(/\[((?:'[a-z]+',?\s*)+)\]\.includes\(pos\[1\]\)/, 'flow'),
  };
}

// Edge operators. `op` is a first-class member of the semantic model (§12.4
// rule 3 derives direction from it), so an unspelt operator is an unteachable
// relationship. The set is PROBED through the engine rather than listed: if an
// operator stops parsing, this throws instead of checking a spelling that no
// longer exists.
const EDGE_OPS = ['->', '<-', '--', '<->'];
function checkEdgeOps(engine) {
  for (const op of EDGE_OPS) {
    const r = engine.parse('figdown 0.1 block\nnode a\nnode b\nedge a ' + op + ' b');
    if (r.errs && r.errs.length)
      throw new Error('engine drift: the edge operator `' + op +
        '` no longer parses (' + r.errs[0] + ') — update this tool');
  }
}

// ── Reading the bundle ───────────────────────────────────────────────────────

function bundleFiles() {
  const out = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.md')) out.push(p);
    }
  })(BUNDLE);
  return out;
}

const rel = p => path.relative(ROOT, p);

/**
 * What a Markdown file TEACHES.
 *
 * Two channels, and both count. A ` ```figdown ` fence is the strong one — it
 * is engine-verified by fence-check, so a spelling taught there is a spelling
 * that exists. A prose code span is the weak one, and it is still teaching:
 * "`w=` was renamed `width=`" teaches `width=` as surely as a fence would.
 * Anything outside a fence and outside backticks is running text and teaches
 * no spelling at all — which is exactly the exposure PROCESS §3.1(f) records.
 */
function scanDoc(text, flags) {
  const lines = text.split(/\r?\n/);
  const kw = new Set();          // keywords taught
  const opt = new Set();         // option keys taught
  const enumv = new Set();       // "key=value" pairs taught
  const ops = new Set();         // edge operators taught
  const hits = [];               // {line, kind, token} for the retirement check

  let inFence = false;
  const noteKeyVal = (raw, i) => {
    // `key=v1|v2|v3` teaches three values; `key=#hex` teaches none.
    const re = /\b([a-z][\w-]*)=([A-Za-z0-9_|-]*)/g;
    let m;
    while ((m = re.exec(raw))) {
      const k = m[1];
      opt.add(k);
      hits.push({ line: i + 1, kind: 'opt', token: k });
      for (const v of m[2].split('|')) {
        if (/^[a-z][a-z0-9_-]*$/.test(v)) {
          enumv.add(k + '=' + v);
          hits.push({ line: i + 1, kind: 'enum', token: k + '=' + v });
        }
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*```/.test(raw)) {
      if (!inFence) inFence = /^\s*```figdown\b/.test(raw);
      else inFence = false;
      continue;
    }
    if (inFence) {
      const line = RC.stripComment(raw).trim();
      if (line.startsWith('|')) { kw.add('|'); hits.push({ line: i + 1, kind: 'kw', token: '|' }); }
      const m = /^([a-zA-Z][\w-]*)\b/.exec(line);
      if (m) { kw.add(m[1]); hits.push({ line: i + 1, kind: 'kw', token: m[1], strong: true }); }
      noteKeyVal(line, i);
      for (const op of EDGE_OPS) if (line.includes(' ' + op + ' ')) ops.add(op);
      // Positional flags (`cell 1 highlight`) carry no `=`, so they need their
      // own probe. The set is the engine's, so a renamed flag is looked for
      // under its new spelling.
      for (const fl of flags) if (new RegExp('\\b' + fl + '\\b').test(line)) opt.add(fl);
      // A comment inside a fence is prose; scan its code spans too.
      const cmt = raw.slice(RC.stripComment(raw).length);
      for (const t of RC.ticks(cmt)) absorbSpan(t, i);
      continue;
    }
    for (const t of RC.ticks(raw)) absorbSpan(t, i);
  }

  function absorbSpan(t, i) {
    const s = t.trim();
    // A path or a shell command is not a directive. `node tools/build-svg.js`
    // would otherwise teach the keyword `node`, which is the one collision
    // between this language and the runtime that builds it.
    if (/[/\\]|\.(?:js|fd|svg|md|html|json)\b/.test(s)) return;
    if (/^[a-z][\w-]*=/.test(s)) { noteKeyVal(s, i); return; }
    if (s === '|' || s === '\\|') { kw.add('|'); return; }
    for (const op of EDGE_OPS) if (s === op || s.includes(' ' + op + ' ')) ops.add(op);
    // A bare code span may be a keyword, an enum value, or neither.
    const first = /^([a-z][\w-]*)\b/.exec(s);
    if (first && /^[a-z][\w-]*$/.test(s)) {
      kw.add(s);
      if (flags.includes(s)) opt.add(s);
      hits.push({ line: i + 1, kind: 'kw', token: s });
    } else if (first) {
      // e.g. `node a "Label" shape=rounded` written inline
      kw.add(first[1]);
      hits.push({ line: i + 1, kind: 'kw', token: first[1] });
      noteKeyVal(s, i);
    }
  }

  return { kw, opt, enumv, ops, hits, lines };
}

/**
 * The router table in SKILL.md. Three columns, one row per genre:
 *
 *   | Genre on line 1 | Load | Add only for EXPERIMENTAL |
 *
 * The middle column is the FROZEN load set — what an agent authoring a
 * portable v0.1 figure reads, and nothing more. The last column names the
 * experimental files, which an agent reads only when the figure needs a
 * construct outside the conformance surface. The split is in the router
 * itself rather than in a paragraph beside it, so an agent that follows the
 * table mechanically gets the frozen set by default.
 *
 * The table is found by its marker comment, so its position in the document is
 * free and its shape is not.
 */
function readRouter(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /<!--\s*skill-coverage:\s*router\s*-->/.test(l));
  if (start < 0) return null;
  const rows = new Map();
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!/^\s*\|/.test(l)) { if (rows.size) break; else continue; }
    const cells = l.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    if (cells.every(c => /^:?-+:?$/.test(c))) continue;
    const genres = RC.ticks(cells[0]).filter(t => /^[a-z]+$/.test(t));
    if (!genres.length) continue;
    const md = (c) => RC.ticks(c || '').filter(t => /\.md$/.test(t));
    for (const g of genres) rows.set(g, { frozen: md(cells[1]), exp: md(cells[2]) });
  }
  return rows.size ? rows : null;
}

/** 1-based [first, last] line range of the router table, or [0,-1]. */
function routerLines(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /<!--\s*skill-coverage:\s*router\s*-->/.test(l));
  if (start < 0) return [0, -1];
  let end = start + 1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*\|/.test(lines[i])) end = i;
    else if (end > start + 1) break;
  }
  return [start + 1, end + 1];
}

function main() {
  const args = { strict: false, normativeOnly: false, verbose: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--strict') args.strict = true;
    else if (a === '--normative-only') args.normativeOnly = true;
    else if (a === '--verbose') args.verbose = true;
    else throw new Error('unknown flag ' + a);
  }

  const engine = RC.loadEngine();
  const FACTS = RC.engineVocabFacts(engine);
  const ENUMS = RC.engineEnums(engine);
  const KWENUMS = keywordEnums(engine);
  const RETIRED = retiredVocab(engine);
  checkEdgeOps(engine);

  for (const [k, why] of Object.entries(AMBIGUOUS_KW))
    if (!RETIRED.keywords.has(k))
      throw new Error('stale opt-out: `' + k + '` is no longer a retired keyword (' +
        why + ') — remove it from AMBIGUOUS_KW');

  // The genre-independent surface: the intersection of the engine's own
  // per-genre allowlists. Not a judgement — a computation.
  const genres = Object.keys(FACTS.top).sort();
  let CORE = null;
  for (const g of genres) {
    const s = new Set(FACTS.top[g]);
    CORE = CORE === null ? s : new Set([...CORE].filter(x => s.has(x)));
  }
  // core §5 permits these on any element, so they are genre-independent too,
  // and so is the layout namespace's own key set: no genre may define,
  // redefine or extend a keyword — or its keys — inside the layout zone.
  const CORE_OPT = new Set(['fill', 'stroke', 'style', 'class',
                            'at', 'width', 'height']);

  const files = bundleFiles();
  if (!files.some(f => f === SKILL)) throw new Error('no ' + rel(SKILL));
  const docs = new Map();
  for (const f of files) docs.set(f, scanDoc(fs.readFileSync(f, 'utf8'), FACTS.flags));

  console.log('skill-coverage  bundle=' + rel(BUNDLE) +
    (args.normativeOnly ? '  normative-only' : '  full') +
    '  engine=' + rel(engine.path));
  console.log('  files: ' + files.length + '  (' + files.map(f =>
    path.relative(BUNDLE, f)).join(', ') + ')');
  console.log('  genre-independent core (∩ of the engine allowlists): ' +
    [...CORE].sort().join(' ') + '  + option keys ' +
    [...CORE_OPT].sort().map(k => k + '=').join(' '));

  let failed = 0;
  const fail = (s) => { console.log('  ' + s); failed++; };

  // ── 0. VENDOR ──────────────────────────────────────────────────────────────
  // `skill/figdown/reference/` is a GENERATED copy of `read/0.1/` (
  // GENRE-REFERENCE-ADDRESS). The source of truth is the one a repository reader is sent to; the
  // bundle carries its own copy only because it is installed standalone. Two
  // copies of one text is exactly the shape of the seven four-copy-drift
  // incidents this project has already shipped, so the copy is byte-compared
  // here rather than trusted. This check lives in THIS gate, not a new one,
  // because this gate already owns the bundle's correctness and is the gate
  // `tools/make-skill.js` names; `dist-check.js` is the same pattern for the
  // engine's generated copies.
  console.log('\n[vendor]');
  {
    const listMd = (dir, base) => {
      const out = [];
      if (!fs.existsSync(dir)) return out;
      for (const name of fs.readdirSync(dir).sort()) {
        const p = path.join(dir, name);
        const r = base ? base + '/' + name : name;
        if (fs.statSync(p).isDirectory()) out.push(...listMd(p, r));
        else if (name.endsWith('.md')) out.push(r);
      }
      return out;
    };
    const src = listMd(READ_SRC, '');
    const dst = listMd(path.join(BUNDLE, 'reference'), '');
    if (!src.length)
      fail('VENDOR SOURCE MISSING — ' + rel(READ_SRC) + ' has no .md files; ' +
        'the bundle\'s reference/ has nothing to be generated from');
    for (const r of src)
      if (!dst.includes(r))
        fail('VENDOR MISSING  reference/' + r + ' — present in ' + rel(READ_SRC) +
          ', absent from the bundle; run `node tools/make-skill.js`');
    for (const r of dst)
      if (!src.includes(r))
        fail('VENDOR STALE  reference/' + r + ' — not in ' + rel(READ_SRC) +
          '; the copy is hand-edited or left over. Run `node tools/make-skill.js`');
    for (const r of src) {
      if (!dst.includes(r)) continue;
      const a = fs.readFileSync(path.join(READ_SRC, r));
      const b = fs.readFileSync(path.join(BUNDLE, 'reference', r));
      if (!a.equals(b))
        fail('VENDOR DRIFT  skill/figdown/reference/' + r + ' differs from ' +
          rel(READ_SRC) + '/' + r + ' — the bundle copy is GENERATED and must ' +
          'never be hand-edited. Edit ' + rel(READ_SRC) + '/' + r +
          ' and run `node tools/make-skill.js`.');
    }
    if (!failed)
      console.log('  reference/ is byte-identical to ' + rel(READ_SRC) +
        ' (' + src.length + ' files)');
  }

  // ── 1. ROUTE ───────────────────────────────────────────────────────────────
  const skillText = fs.readFileSync(SKILL, 'utf8');
  let router = readRouter(skillText);
  console.log('\n[route]');
  if (!router) {
    fail('NO ROUTER TABLE in ' + rel(SKILL) + ' — an agent cannot tell which ' +
      'file it needs, so every genre falls back to the WHOLE bundle and ' +
      'progressive disclosure is a fiction. Add a `<!-- skill-coverage: ' +
      'router -->` table with one row per genre.');
    const all = files.map(f => path.relative(BUNDLE, f));
    router = new Map(genres.map(g => [g, { frozen: all, exp: [] }]));
  } else {
    for (const g of genres) {
      if (!router.has(g)) fail('genre `' + g + '` has no router row');
    }
    for (const [g, row] of router) {
      if (!genres.includes(g)) fail('router names unknown genre `' + g + '`');
      for (const f of row.frozen.concat(row.exp))
        if (!fs.existsSync(path.join(BUNDLE, f)))
          fail('router row `' + g + '` names a missing file `' + f + '`');
    }
    // Every reference file must be reachable: a file no row names is a file no
    // agent will ever open, and it drifts unread.
    for (const f of files) {
      if (f === SKILL) continue;
      const r = path.relative(BUNDLE, f);
      let reached = false;
      for (const row of router.values())
        if (row.frozen.includes(r) || row.exp.includes(r)) reached = true;
      if (!reached && !UNROUTED_OK.test(r))
        fail('unreachable file ' + r + ' — no router row names it');
    }
    if (!failed) console.log('  every genre routes to files that exist, and every file is reachable');
  }

  const isExpFile = p => path.relative(BUNDLE, p)
    .split(path.sep).includes('experimental');
  const loadSet = (g, frozenOnly) => {
    const row = router.get(g) || { frozen: [], exp: [] };
    const want = frozenOnly ? row.frozen : row.frozen.concat(row.exp);
    const out = [SKILL];
    for (const f of want) {
      const p = path.join(BUNDLE, f);
      if (fs.existsSync(p) && !out.includes(p) && !(frozenOnly && isExpFile(p))) out.push(p);
    }
    return out;
  };
  const merged = (g, frozenOnly) => {
    const acc = { kw: new Set(), opt: new Set(), enumv: new Set(), ops: new Set() };
    for (const p of loadSet(g, frozenOnly)) {
      const d = docs.get(p);
      if (!d) continue;
      for (const k of ['kw', 'opt', 'enumv', 'ops'])
        for (const v of d[k]) acc[k].add(v);
    }
    return acc;
  };

  // A genre's VOCABULARY SOURCE is its genre document, and this tool compares
  // the skill bundle against it. A genre can reach `RC.GENRES` before that
  // document is written — `sequence` did, when its renderer
  // landed and its genre document was still owed — and there is then no
  // surface to measure the bundle against. That is NOT a pass, so it is never
  // silent: the genre is named in every section that skips it, exactly as
  // `layout-lint` names the figures it could not score. It becomes a real
  // answer the moment `spec/genres/experimental/<genre>.md` exists.
  //
  // `sequence`'s document landed and the branch closed the way
  // it was built to: it keys on FILE EXISTENCE, so not a line here was edited
  // and the genre started being measured on the same run. `DOCLESS` is empty
  // today. The branch stays for the next genre that lands ahead of its
  // document — deleting it would trade a named gap for a silent one.
  const genreMd = (g) => {
    const p = RC.genreDocFor(g);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  };
  const DOCLESS = RC.GENRES.filter(g => genreMd(g) === null);
  const MEASURABLE = RC.GENRES.filter(g => genreMd(g) !== null);

  // ── 2. MISSING ─────────────────────────────────────────────────────────────
  console.log('\n[coverage]');
  for (const g of MEASURABLE) gapsFor(g, args.normativeOnly, false, true);
  for (const g of DOCLESS)
    console.log('  [' + g + '] NOT MEASURED — no genre document at '
      + path.relative(ROOT, RC.genreDocFor(g))
      + '; the bundle has nothing to be complete against yet');

  /**
   * @param normOnly  require only the v0.1 conformance surface
   * @param frozenOnly  answer the question with the experimental files DELETED
   *                    — the strip test, run as check 6
   */
  function gapsFor(g, normOnly, frozenOnly, report) {
    const md = fs.readFileSync(RC.genreDocFor(g), 'utf8');
    const vocab = RC.extractVocab(g, md, normOnly, FACTS);
    const t = merged(g, frozenOnly);
    const miss = { kw: [], opt: [], en: [] };

    for (const [k, st] of vocab.keywords) {
      if (RC.COMPOSITION_OPENERS.has(k) && k !== g) continue;
      if (!t.kw.has(k)) miss.kw.push(k + (st === 'experimental' ? ' (exp)' : ''));
    }
    for (const [k, st] of vocab.optionKeys) {
      if (normOnly && (st === 'experimental' || RC.EXP_OPTION_KEYS.has(k))) continue;
      if (!t.opt.has(k)) miss.opt.push(k + '=' + (st === 'experimental' ? ' (exp)' : ''));
    }
    for (const k of Object.keys(ENUMS)) {
      if (!vocab.optionKeys.has(k)) continue;
      if (normOnly &&
          (vocab.optionKeys.get(k) === 'experimental' || RC.EXP_OPTION_KEYS.has(k))) continue;
      for (const v of ENUMS[k]) if (!t.enumv.has(k + '=' + v)) miss.en.push(k + '=' + v);
    }
    for (const k of Object.keys(KWENUMS)) {
      if (!vocab.keywords.has(k)) continue;
      for (const v of KWENUMS[k])
        if (!t.kw.has(k) || !hasKwEnum(g, k, v, frozenOnly)) miss.en.push(k + ' ' + v);
    }
    if (vocab.keywords.has('edge'))
      for (const op of EDGE_OPS) if (!t.ops.has(op)) miss.en.push('edge ' + op);

    const n = miss.kw.length + miss.opt.length + miss.en.length;
    if (report) {
      const set = loadSet(g, frozenOnly).map(p => path.relative(BUNDLE, p)).join(' + ');
      console.log('  [' + g + '] load set: ' + set);
      console.log('    tracked kw=' + vocab.keywords.size + ' opt=' + vocab.optionKeys.size +
        (n ? '' : '   — complete'));
      if (miss.kw.length) fail('  [' + g + '] MISSING keywords (' + miss.kw.length + '): ' + miss.kw.join(', '));
      if (miss.opt.length) fail('  [' + g + '] MISSING option keys (' + miss.opt.length + '): ' + miss.opt.join(', '));
      if (miss.en.length) fail('  [' + g + '] MISSING enum values (' + miss.en.length + '): ' + miss.en.join(', '));
    }
    return miss;
  }

  function hasKwEnum(g, k, v, frozenOnly) {
    for (const p of loadSet(g, frozenOnly)) {
      const d = docs.get(p);
      if (!d) continue;
      // `flow right\|down\|left\|up` in prose is a code span whose alternatives
      // are pipe-escaped for the Markdown table it usually sits in.
      const re = new RegExp('`[^`]*\\b' + k + '\\s+[a-z|\\\\ ,]*\\b' + v + '\\b[^`]*`|^\\s*' + k + '\\s+[a-z|\\\\ ,]*\\b' + v + '\\b', 'm');
      if (re.test(d.lines.join('\n'))) return true;
    }
    return false;
  }

  // ── 3. RETIRED ─────────────────────────────────────────────────────────────
  console.log('\n[retirement]');
  let admitted = 0, stale = 0;
  for (const f of files) {
    const d = docs.get(f);
    for (const h of d.hits) {
      let isRetired = false;
      if (h.kind === 'kw' && RETIRED.keywords.has(h.token)) {
        if (AMBIGUOUS_KW[h.token] && !h.strong) continue;
        isRetired = true;
      } else if (h.kind === 'opt' && RETIRED.optKeys.has(h.token)) isRetired = true;
      else if (h.kind === 'enum' && RETIRED.enumVals.has(h.token)) isRetired = true;
      if (!isRetired) continue;
      const lo = Math.max(0, h.line - 1 - 4), hi = Math.min(d.lines.length, h.line + 4);
      const window = d.lines.slice(lo, hi).join('\n');
      if (RETIRE_MARKER.test(window)) {
        admitted++;
        if (args.verbose)
          console.log('    admitted  ' + rel(f) + ':' + h.line + '  ' + h.token);
      } else {
        stale++;
        fail('TEACHES A RETIRED SPELLING  ' + rel(f) + ':' + h.line + '  `' +
          h.token + (h.kind === 'opt' ? '=' : '') + '` with no retirement ' +
          'marker beside it — an agent reading this line writes a line error');
      }
    }
  }
  if (!stale) console.log('  no retired spelling taught as live  (' + admitted +
    ' historical mention(s) admitted)');

  // ── 4. CORE ────────────────────────────────────────────────────────────────
  console.log('\n[core]');
  const core = docs.get(SKILL);
  // The router table is exempt: three genres are spelled the same as the
  // composition-opener keywords (`bitfield`, `table`, `timing`), and a router
  // that cannot name a genre routes nothing. It names genres and files only.
  const rt = routerLines(skillText);
  const outside = (kind) => new Set(core.hits
    .filter(h => h.kind === kind && !(h.line >= rt[0] && h.line <= rt[1]))
    .map(h => h.token));
  // A genre NAME may be spelled in the always-loaded file — the router routes
  // on it, and three of the six (`bitfield`, `table`, `timing`) are spelled the
  // same as the composition-opener keyword. Naming the genre is not teaching
  // the opener's syntax, which its own file owns.
  const bloatKw = [...outside('kw')].filter(k =>
    !CORE.has(k) && !RETIRED.keywords.has(k) && !RC.GENRES.includes(k) && isLiveKw(k));
  const bloatOpt = [...outside('opt')].filter(k =>
    !CORE_OPT.has(k) && isLiveOpt(k) && !RETIRED.optKeys.has(k));
  if (bloatKw.length)
    fail('the ALWAYS-LOADED file teaches genre-owned keyword(s): ' + bloatKw.sort().join(', ') +
      ' — every agent pays for them and most cannot use them; move each to its genre file');
  if (bloatOpt.length)
    fail('the ALWAYS-LOADED file teaches genre-owned option key(s): ' +
      bloatOpt.sort().map(k => k + '=').join(', ') + ' — move each to its genre file');
  if (!bloatKw.length && !bloatOpt.length)
    console.log('  ' + rel(SKILL) + ' stays inside the genre-independent surface');

  function isLiveKw(k) {
    if (k === '|') return true;
    for (const g of genres) if (FACTS.top[g].includes(k)) return true;
    for (const g of Object.keys(FACTS.children))
      if (FACTS.children[g].includes(k)) return true;
    return false;
  }
  function isLiveOpt(k) {
    for (const g of MEASURABLE) {
      const md = genreMd(g);
      if (RC.extractVocab(g, md, false, FACTS).optionKeys.has(k)) return true;
    }
    return false;
  }

  // ── 5. CODES ───────────────────────────────────────────────────────────────
  // An authoring agent cannot look up `MEANING-RECOVERY-SOURCE`, `MEANINGFUL-ARRANGEMENT`, `DECLARATION-ORDER-SEMANTICS` or 0.1.
  // It has this bundle and nothing else — the skill is installed standalone,
  // without the spec beside it. A bare citation therefore teaches nothing and
  // costs tokens in a document whose whole purpose is to cost few; where the
  // reasoning behind a rule prevents a class of error, the reasoning is what
  // belongs in the sentence.
  //
  // THIS IS A SHAPE TEST, NOT A FAMILY LIST.
  //
  // It used to be an enumeration:
  //   /(?:R\d{1,3}|D\d{1,2}|G\d{1,2}|A\d{1,3}|K\d{1,2}|S\d{1,2}|OQ-S\d{1,3}|0\.1-dev\.\d+)/
  // which had the three blind spots an enumeration always has, and the same
  // three the publish pipeline's copy of this idea had:
  //   (1) it enumerated FAMILIES, so `GRAMMAR-SKETCH-COMPLETENESS`, `V2`, `INAPPLICABLE-OPTION-KEYS` were
  //       invisible — a check that lists what it knows about cannot report the
  //       arrival of something new; it reports zero and means "nothing I
  //       recognised";
  //   (2) it was CASE-SENSITIVE, so every `r25` was invisible;
  //   (3) it scanned `.md` ONLY, and the bundle also ships `build-svg.js` —
  //       a file SKILL.md tells the agent to RUN, whose header carried three
  //       citations nothing had ever looked at.
  //
  // So: match code-SHAPED tokens, case-insensitively, over every text file the
  // bundle ships, and cut the false positives with NAMED DATA-VERSUS-REFERENCE
  // DISCRIMINATORS — never by loosening the pattern. This repository is full
  // of figure data that looks like a code (`DYNAMIC-FIGURE-PURPOSE` a router, `A1`/`A2` PVLAN
  // communities, `Q0` a queue, `T1` a DHCP timer, `MULTI-FIGURE-DOCUMENTS` a node label), and
  // every discriminator below was earned from one of them.
  console.log('\n[codes]');

  // The shape: 1-3 letters, 1-3 digits, an optional `-<digits>` tail;
  // plus the two hyphenated prefixes and the dotted dev increment. NO FAMILY
  // LETTER APPEARS IN IT.
  const CODE_SHAPE = /(?:OQ-S|DISC-)\d{1,3}|0\.1-dev\.\d+|[A-Za-z]{1,3}\d{1,3}(?:-\d{1,2})?/g;

  // THE REFERENCE SIDE: the codes THIS PROJECT HAS ACTUALLY USED, harvested
  // from `spec/` and `conformance/` — outside the bundle, which is
  // the thing under test. A token counts as a project code when it appears in
  // a DEFINING or CITING position: a heading (`### CLOSED-GRAMMAR — …`, `## COLOUR-VALUE-VALIDATION — …`,
  // `## 0.1`), the lead of a list item (`- **GENRE-NAMESPACE — …**`), a
  // bold run (`**GENRE-KEYWORD-ALLOWLIST**`), or a parenthesised citation (`(BITFIELD-REPETITION-CONSTRUCT)`, `(DOMAIN-VOCABULARY-PREFERENCE §4)`).
  // This is what makes the check family-agnostic in BOTH directions: define
  // `Z9` in requirements-notes tomorrow and the registry gains it with no edit
  // here, while `sha256`, `IPv4`, `L3` and `msb0` — which are shape matches but
  // have never been used as codes — never enter it.
  const CODE_FRAMES = [
    new RegExp('\\*\\*(' + CODE_SHAPE.source + ')\\*\\*', 'g'),
    new RegExp('^#{1,6}\\s+\\**(' + CODE_SHAPE.source + ')\\**(?:[\\s—–:(]|$)'),
    new RegExp('^[-*]\\s+~?~?\\**(' + CODE_SHAPE.source + ')\\**(?:[\\s—–:(]|$)'),
    new RegExp('\\((' + CODE_SHAPE.source + ')(?:[)]|\\s§)', 'g'),
  ];
  const CODE_REGISTRY = (function () {
    const reg = new Set();
    const roots = ['spec', 'conformance'].map(d => path.join(ROOT, d));
    (function walk(dirs) {
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).sort()) {
          const p = path.join(dir, f);
          if (fs.statSync(p).isDirectory()) { walk([p]); continue; }
          if (!f.endsWith('.md')) continue;
          for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
            const s = line.replace(/`[^`]*`/g, ' ').replace(/"[^"]*"/g, ' ')
                          .replace(/#[0-9a-fA-F]{3,8}\b/g, ' ').trim();
            for (const re of CODE_FRAMES) {
              re.lastIndex = 0;
              let m;
              if (re.global) { while ((m = re.exec(s))) reg.add(m[1].toUpperCase()); }
              else if ((m = re.exec(s))) reg.add(m[1].toUpperCase());
            }
          }
        }
      }
    })(roots);
    return reg;
  })();

  // PIN-COORDINATE-SCOPE — LANGUAGE VOCABULARY is not a code. A registered keyword, option key
  // or enum value, and a header-tier address `h<n>` (`cell (h1,3)`), are the
  // language talking about itself. Drawn from the engine's own registry, so it
  // widens automatically when the language does.
  const VOCAB = new Set();
  for (const g of genres) for (const k of FACTS.top[g]) VOCAB.add(k.toLowerCase());
  for (const g of Object.keys(FACTS.children)) for (const k of FACTS.children[g]) VOCAB.add(k.toLowerCase());
  for (const vs of Object.values(ENUMS || {})) for (const v of (vs || [])) VOCAB.add(String(v).toLowerCase());
  const isVocab = (t) => VOCAB.has(t.toLowerCase()) || /^h\d{1,3}$/i.test(t);

  // The engine copy is EXEMPT, by name and with the reason stated. It is a
  // byte-identical generated copy of `editor/figdown.html`; its comments are
  // maintainer documentation of a renderer, not text the skill teaches from,
  // and an agent that opens it is reading an implementation, not a lesson.
  // Requiring it to be code-free would mean stripping the engine's own
  // reasoning out of the engine. `.md` and `.js` are the teaching surface.
  const CODE_SCAN_EXEMPT = new Set(['figdown.html']);
  const textFiles = (function walk(dir, out) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p, out);
      else if (/\.(md|js|mjs)$/.test(f) && !CODE_SCAN_EXEMPT.has(f)) out.push(p);
    }
    return out;
  })(BUNDLE, []);

  let codes = 0;
  for (const f of textFiles) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const isJs = /\.(js|mjs)$/.test(f);
    // SHAPE-ENUM-VOCABULARY — DECLARED ID. An id this file's own fences declare is figure data
    // even where the file's prose names it. `node s2 "Spine 2"` makes `s2`
    // data for the whole file.
    const declared = new Set();
    if (!isJs) {
      for (const l of lines) {
        const m = /^\s*(?:node|group|external|class|plane|bundle|bitfield|table|timing)\s+([A-Za-z_][\w-]*)/.exec(l);
        if (m) declared.add(m[1].toLowerCase());
      }
    }
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      let scan;
      if (isJs) {
        // D2 — IN CODE, COMMENTS AND QUOTED SENTENCES ONLY. Everything else on
        // the line is program text, where `h1` or `p2` is an identifier.
        const c = raw.indexOf('//');
        scan = c >= 0 ? raw.slice(c) : '';
        for (const q of raw.match(/(['"])(?:\\.|(?!\1).)*\1/g) || []) {
          const body = q.slice(1, -1);
          const words = body.trim().split(/\s+/);
          // D3 — A QUOTED STRING BEGINNING WITH A REGISTERED KEYWORD IS A
          // DIRECTIVE, not prose: `'node a "A"'` is a sample document.
          if (words.length >= 3 && !VOCAB.has(words[0].toLowerCase())) scan += ' ' + body;
        }
      } else {
        if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
        // RENDERING-DETERMINISM — IN A FIGDOWN FENCE, COMMENTS ONLY. The directives are the
        // figure; only what follows `#` is the author talking to a reader.
        scan = inFence ? (raw.indexOf('#') >= 0 ? raw.slice(raw.indexOf('#')) : '') : raw;
      }
      scan = scan
        .replace(/#[0-9a-fA-F]{3,8}\b/g, ' ')   // D4 — a hex colour is a VALUE
        .replace(/"[^"]*"/g, ' ')               // D5 — a quoted label is figure DATA
        .replace(/`[^`]*`/g, ' ');              // D5′ — a code span is language text
      CODE_SHAPE.lastIndex = 0;
      let m;
      while ((m = CODE_SHAPE.exec(scan))) {
        const t = m[0];
        // GENRE-NAMESPACE — A DOTTED VERSION IS NOT A CODE. `v0.1`, `v1.0`: the token is
        // followed by a dot and a digit, and the spec spells versions this way.
        if (/^\.\d/.test(scan.slice(m.index + t.length))) continue;
        if (isVocab(t)) continue;                                  // D6
        if (declared.has(t.toLowerCase())) continue;               // D7
        // CATEGORICAL-MEANING-MAPPING — THE REFERENCE FILTER. A shape match the project has never used
        // as a code is not a code. This is the discriminator, not a shorter
        // pattern: the shape stays wide so a NEW family is caught the moment
        // it is defined anywhere in spec/ or conformance/.
        if (!CODE_REGISTRY.has(t.toUpperCase())) continue;
        codes++;
        fail('UNDECODABLE CODE  ' + rel(f) + ':' + (i + 1) + '  ' + t +
          ' — the agent has this bundle and nothing else; teach the rule, drop the citation');
      }
    }
  }
  if (!codes) console.log('  no internal decision codes or dev-increment provenance  (shape test over ' +
    textFiles.length + ' bundle file(s), case-insensitive, against ' +
    CODE_REGISTRY.size + ' codes this project has used)');

  // ── 6. ISOLATION ───────────────────────────────────────────────────────────
  // The strip test of CONTRIBUTING and PROCESS §3.1(e), applied to the skill:
  // delete `reference/experimental/` and what remains must still teach a
  // complete, portable v0.1. Two halves — a frozen genre's row may not put an
  // experimental file in its FROZEN column, and its frozen column alone must
  // still cover the whole normative surface.
  console.log('\n[isolation]');
  let leaks = 0;
  for (const g of MEASURABLE) {
    const md = genreMd(g);
    if (!/Genre status:\s*NORMATIVE/i.test(md)) continue;
    for (const p of loadSet(g, true))
      if (isExpFile(p)) {
        leaks++;
        fail('frozen genre `' + g + '` loads the experimental file ' +
          path.relative(BUNDLE, p) + ' by default — move it to the ' +
          '"add only for EXPERIMENTAL" column');
      }
    const miss = gapsFor(g, true, true, false);
    const n = miss.kw.length + miss.opt.length + miss.en.length;
    if (n) {
      leaks++;
      fail('frozen genre `' + g + '` is INCOMPLETE with the experimental files ' +
        'deleted (' + n + '): ' + miss.kw.concat(miss.opt, miss.en).join(', ') +
        ' — a normative fact is being taught in an experimental file');
    }
  }
  if (!leaks) console.log('  every frozen genre is complete with reference/experimental/ deleted');

  // ── 7. LINKS ───────────────────────────────────────────────────────────────
  // Every relative link inside the bundle must resolve RELATIVE TO THE BUNDLE
  // ROOT, because `skill/figdown/` is copied standalone into
  // `~/.claude/skills/figdown` (skill/README.md) and that copy has no
  // repository above it. A link that resolves only because this repository
  // happens to sit above the bundle is exactly the defect: green here, dangling
  // for every installed user.
  //
  // WHY HERE AND NOT IN isolation-check.js. `gate:isolation` answers a
  // different question — does the FROZEN file set survive deletion of the
  // EXPERIMENTAL one — and it excludes `skill/` by name (isolation-check.js
  // header, "THE TEACHING AND guide/authoring.md GUIDES"). Its `resolveTarget` is also
  // rooted at the REPOSITORY, which is the wrong root for a bundle; teaching it
  // a second root would fork its resolution model for one directory. This tool
  // already owns the bundle: `BUNDLE`, `bundleFiles()`, the vendored-copy
  // comparison (check 0) and the router's own "names a missing file" test all
  // resolve against the bundle root already. So the check goes where the root
  // is already right, and no nineteenth gate is added.
  //
  // A link inside a fence is a SAMPLE, not a reference — the same rule
  // isolation-check.js applies ("a link inside a fence is a sample"). Samples
  // are skipped here too; the way to keep a sample honest is to write it with a
  // placeholder basename, not to make the checker chase it.
  console.log('\n[links]');
  {
    const linkRe = /\[([^\]\n]*)\]\(\s*<?([^)<>\s]+)>?(?:\s+"[^"\n]*")?\s*\)/g;
    let checked = 0;
    for (const f of bundleFiles()) {
      const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
      let inFence = false;
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
        if (inFence) continue;
        let m;
        linkRe.lastIndex = 0;
        while ((m = linkRe.exec(raw))) {
          let t = m[2].trim();
          if (!t || t.startsWith('#')) continue;
          if (/^[a-z][a-z0-9+.\-]*:/i.test(t)) continue;   // http:, mailto:, …
          const hash = t.indexOf('#');
          if (hash >= 0) t = t.slice(0, hash);
          if (!t) continue;
          try { t = decodeURIComponent(t); } catch (e) { /* leave as written */ }
          // Bundle root, not repo root: `/x` and `../x` both leave the installed
          // copy, so both are defects even when the repository can satisfy them.
          const abs = t.startsWith('/')
            ? path.resolve(BUNDLE, '.' + t)
            : path.resolve(path.dirname(f), t);
          const inside = abs === BUNDLE || abs.startsWith(BUNDLE + path.sep);
          checked++;
          if (!inside)
            fail('LINK ESCAPES THE BUNDLE  ' + path.relative(BUNDLE, f) + ':' +
              (i + 1) + '  `' + m[2] + '` resolves outside skill/figdown/ — an ' +
              'installed copy has no repository above it, so this link dangles ' +
              'for every user who followed skill/README.md');
          else if (!fs.existsSync(abs))
            fail('DANGLING LINK IN THE BUNDLE  ' + path.relative(BUNDLE, f) + ':' +
              (i + 1) + '  `' + m[2] + '` does not exist relative to the bundle ' +
              'root — either ship the file inside skill/figdown/ or write the ' +
              'reference as an example rather than a link');
        }
      }
    }
    if (!failed)
      console.log('  every link in the bundle resolves inside the bundle (' +
        checked + ' checked)');
  }

  console.log('\n' + (failed ? 'FAIL  ' + failed + ' finding(s)' : 'OK  the skill teaches the whole registry'));
  if (args.strict && failed) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(e.stack || e);
  process.exit(2);
}
