#!/usr/bin/env node
/**
 * reference-coverage.js — genre vocabulary coverage over examples/reference/
 *
 * Coverage is over the **set** of reference files for that genre
 * (e.g. block.fd + block-experimental.fd), not a single file.
 *
 * Four checks, in increasing strength:
 *   1. keywords  — every keyword of the genre's vocabulary table is used;
 *   2. options   — every option key is used;
 *   3. FORMS     — every value of a closed enum option is used, and every
 *      construct that has a multi-value (comma) form is used in that form.
 *      Keyword/option coverage alone cannot see a missing FORM: `class=a`
 *      and `class=a,b` are the same option key, so a reference set could
 *      demonstrate the first and never the second and still report "ok".
 *      The enum lists and the multi-value forms are derived from the ENGINE
 *      (editor/figdown.html), not from the docs, so the check cannot drift:
 *      if the engine's spelling changes, this tool throws instead of
 *      silently checking less;
 *   4. LEAK      — under --normative-only, `<genre>.fd` must contain no
 *      EXPERIMENTAL keyword or option key. The experimental surface belongs
 *      in `<genre>-experimental.fd`, so that removing the experimental file
 *      cannot silently open a coverage gap in the normative one.
 *
 * Usage:
 *   node tools/reference-coverage.js [--strict] [--normative-only] [genre...]
 *
 *   --normative-only  skip EXPERIMENTAL / EXPERIMENTAL rows, and run the leak check
 *   --strict          exit 1 on any gap
 *   --enums           accepted and ignored (enum coverage is always on now)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GENRES_DIR = path.join(ROOT, 'spec', 'genres');
const REF_DIR = path.join(ROOT, 'examples', 'reference');
const GENRES = ['block', 'bitfield', 'table', 'topology', 'flowchart', 'timing'];

// Composition openers listed on scene genres — covered only if present in set;
// not required for a pure scene reference figure.
const COMPOSITION_OPENERS = new Set(['bitfield', 'table', 'timing']);
// CONSTRUCT-STATUS-TIERS demoted option keys — never required under --normative-only even if a
// keyword-row Option-keys cell listed them next to a NORMATIVE keyword.
const EXP_OPTION_KEYS = new Set([
  'text', 'layer', 'z', 'via', 'dir', 'labels',
  // 0.1 spellings of the four above; 'level' left the language
  // entirely (CHART-LEVEL-KEY) and is no longer an option key at all.
  // 'stroke' and 'color' left this list: STROKE-KEY-STATUS promoted
  // `stroke=` to NORMATIVE and COLOUR-KEY-STATUS retired `color=` language-wide, so
  // neither is an experimental option key any more.
  // 'points', 'tailport', 'headport' and 'routing' left (EDGE-GEOMETRY-CONSTRUCTS):
  // WITHDRAWN with the `path` directive, so they are no longer experimental
  // option keys either — they are not option keys at all.
  'plane', 'z-index', 'data',
  'offset', 'extend',
]);
function parseArgs(argv) {
  const out = { strict: false, normativeOnly: false, genres: [] };
  for (const a of argv) {
    if (a === '--strict') out.strict = true;
    else if (a === '--normative-only') out.normativeOnly = true;
    else if (a === '--enums') { /* enum coverage is always on; flag kept */ }
    else if (a.startsWith('-')) throw new Error('unknown flag ' + a);
    else out.genres.push(a);
  }
  if (!out.genres.length) out.genres = GENRES.slice();
  return out;
}

// ── Engine-derived facts (the form checks) ───────────────────────────────────
// Everything below is read out of editor/figdown.html, never out of the docs:
// a reference figure is checked against what the engine ACCEPTS. Each lookup
// throws if the engine's spelling moved, so drift breaks the tool loudly
// instead of quietly checking less (the LANE-ALPHABET-KEY-RESERVATION guard discipline).

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
  const api = new Function(src +
    '\nreturn {parse, SHAPES, STYLES, GENRE_KW, RETIRED_OPT_KEYS, RETIRED_SHAPES};')();
  api.src = src;
  api.path = p;
  return api;
}

// ── The tracked VOCABULARY, read out of the engine ───────────────────────────
// The genre docs supply each row's STATUS (NORMATIVE / EXPERIMENTAL), which is a spec
// fact the engine does not carry. Everything else — which keywords exist,
// which are a genre's typed-block children, which positional flags there
// are, and which spellings have been RETIRED — comes from the engine, so a
// rename can no longer leave this tool asking for a spelling that is now a
// line error. ( it still demanded `wrap`, renamed to `break`
// three releases earlier, and demanded the flag `optional` under the name
// the engine had already replaced with `conditional`.)
function engineVocabFacts(engine) {
  const children = {};                       // block genre -> [child keyword]
  let m;
  const reChild = /cur\.type==='(\w+)'\s*&&\s*kw==='(\w+)'/g;
  while ((m = reChild.exec(engine.src))) {
    (children[m[1]] = children[m[1]] || new Set()).add(m[2]);
  }
  // The `|` row token is a keyword whose host is named only by its own
  // diagnostic: `err(n,'pipe row outside a table block')`.
  const pipe = /'pipe row outside a (\w+) block'/.exec(engine.src);
  // Positional flags (`field … conditional`, `cell <r> highlight`) — the
  // parser tests them as `pos.includes('<flag>')` or
  // `pos.indexOf('<flag>')` and nowhere else. RULE-POSITION-ENUMERATION made the flag an enum
  // position under RULE 2.4 (`cell 1 "highlight"` is now a line error), and
  // reporting that needs the flag's INDEX so its quotedness can be read off
  // `posq` at the same index — which turned the language's one surviving
  // flag test from `includes` into `indexOf` and left this set empty.
  const flags = new Set();
  const reFlag = /pos\.(?:includes|indexOf)\('([a-z][\w]*)'\)/g;
  while ((m = reFlag.exec(engine.src))) flags.add(m[1]);

  // Retired spellings, from the engine's own retirement tables and
  // diagnostics — the same three sources tools/comment-check.js reads.
  const retiredOpt = new Set(Object.keys(engine.RETIRED_OPT_KEYS));
  const retiredKw = new Set();
  for (const re of [/(?:^|[^\w-])([a-z][\w-]*) has been (?:renamed|retired|DELETED)/g,
                    /"([a-z][\w-]*)" has been (?:renamed|retired|DELETED)/g]) {
    re.lastIndex = 0;
    while ((m = re.exec(engine.src))) retiredKw.add(m[1]);
  }
  for (const v of Object.keys(engine.RETIRED_SHAPES)) retiredKw.delete(v);

  if (!Object.keys(children).length || !pipe || !flags.size ||
      retiredOpt.size < 8 || retiredKw.size < 6)
    throw new Error('engine drift: cannot read the genre vocabulary out of ' +
      path.relative(ROOT, engine.path) + ' (children=' +
      Object.keys(children).length + ' pipe=' + !!pipe + ' flags=' + flags.size +
      ' retiredOpt=' + retiredOpt.size + ' retiredKw=' + retiredKw.size +
      ') — update this tool');

  const byGenre = {};
  for (const g of Object.keys(children)) byGenre[g] = [...children[g]].sort();
  if (pipe) byGenre[pipe[1]] = (byGenre[pipe[1]] || []).concat('|');
  // Every genre's top-level keywords are the engine's own GENRE-KEYWORD-ALLOWLIST allowlist.
  const top = {};
  for (const g of Object.keys(engine.GENRE_KW)) top[g] = [...engine.GENRE_KW[g]];
  return { children: byGenre, top, flags: [...flags].sort(), retiredKw, retiredOpt };
}

// Closed enums an OPTION KEY accepts. Keyword-argument enums (`flow`) are
// deliberately absent: that directive is
// single-valued per document (REPEATED-DIRECTIVE-HANDLING), so one figure can never show every value
// and demanding it would be a false gap. (`routing` was the other one, until
// EDGE-GEOMETRY-CONSTRUCTS withdrew it.)
function engineEnums(engine) {
  const grab = (re, what) => {
    const m = re.exec(engine.src);
    if (!m) throw new Error('engine drift: cannot read the ' + what +
      ' enum out of ' + path.relative(ROOT, engine.path) + ' — update this tool');
    return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  };
  return {
    shape: engine.SHAPES.slice(),
    style: engine.STYLES.slice(),
    extend: grab(/\[((?:'[a-z]+',?\s*)+)\]\.includes\(fdir\)/, 'band extend='),
    numbering: grab(/\[((?:'[a-z0-9]+',?\s*)+)\]\.includes\(cur\.numbering\)/, 'bitfield numbering='),
  };
}

// Constructs with a MULTI-VALUE (comma) form. `probe` is parsed by the engine
// at startup: if it stops parsing, the form moved and the tool throws rather
// than checking a spelling that no longer exists. `detect` is what a use of
// that form looks like in a .fd (matched against comment-stripped source).
// `at=<x>,<y>` and `src=<u>,<v>` are NOT here: their comma is a fixed pair,
// not a list, so there is no single-value form to miss.
// For the three KEYWORD lists (`rank`, `width`, `bundle`) the comma spelling is
// the ONLY one: POSITIONAL-LIST-SPELLING had ruled the space form still accepted, and 0.1
// (COMMA-LIST-WHITESPACE/POSITIONAL-LIST-SPELLING) reversed that and retired it for all three, so a space form now
// raises a named migration diagnostic rather than parsing.
const MULTIVALUE = [
  { kind: 'opt', name: 'class', detect: /\bclass=[A-Za-z_][\w-]*,/,
    probe: 'figdown 0.1 block\nclass a "A"\nclass b "B"\nnode n class=a,b' },
  // `points=` stood here (spelled `via=` until this release, WAYPOINT-KEY-SPELLING) as the second
  // multi-value OPTION form. EDGE-GEOMETRY-CONSTRUCTS withdrew it with the `path`
  // directive, so `class=` and `data=` are the two that remain.
  { kind: 'opt', name: 'data', detect: /\bdata=[^\s#]*,/,
    probe: 'figdown 0.1 timing\ntiming w\nsignal s 0=1= data=x,y' },
  { kind: 'kw', name: 'rank', detect: /^\s*rank\s+\S+,\S/m,
    probe: 'figdown 0.1 block\nnode a\nnode b\nrank a,b' },
  { kind: 'kw', name: 'width', detect: /^\s*width\s+\S+,\S/m,
    probe: 'figdown 0.1 table\ntable t\n| a | b |\n|---|---|\n| 1 | 2 |\nwidth auto,90' },
  { kind: 'kw', name: 'bundle', detect: /^\s*bundle\s+.*\w--\w[\w-]*,\s*\w[\w-]*--/m,
    probe: 'figdown 0.1 block\nnode a\nnode b\nnode c\nnode d\nedge a -- b\nedge c -- d\n' +
           'bundle t "L" a--b,c--d' },
];

function checkMultivalueProbes(engine) {
  for (const mv of MULTIVALUE) {
    const r = engine.parse(mv.probe);
    if (r.errs && r.errs.length)
      throw new Error('engine drift: the multi-value form of `' + mv.name +
        '` no longer parses (' + r.errs[0] + ') — update this tool');
    const stripped = mv.probe.split('\n').map(stripComment).join('\n');
    if (!mv.detect.test(stripped))
      throw new Error('tool defect: the `detect` pattern for `' + mv.name +
        '` does not match its own probe');
  }
}

function ticks(s) {
  const m = [];
  const re = /`([^`]+)`/g;
  let x;
  while ((x = re.exec(String(s)))) m.push(x[1].trim());
  return m;
}

function isExperimental(cells) {
  const s = cells.join(' ');
  return /EXPERIMENTAL|\*\*EXPERIMENTAL\*\*|EXPERIMENTAL/i.test(s);
}

function isKeywordName(t) {
  if (t === '|' || t === '\\|') return true;
  // plain keyword token
  return /^[a-z][a-z0-9_]*$/i.test(t);
}

function normalizeKw(t) {
  if (t === '\\|' || t === '|') return '|';
  return t;
}

/**
 * Parse Complete vocabulary section tables.
 */
function extractVocab(genre, md, normativeOnly, facts) {
  const lines = md.split(/\r?\n/);
  const keywords = new Map(); // name -> status
  const optionKeys = new Map();
  const enums = new Map(); // opt -> Set(values)

  let inVocab = false;
  let mode = null; // 'kw' | 'opt' | null
  let headers = [];

  function endTable() {
    mode = null;
    headers = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^## Complete vocabulary/i.test(line)) {
      inVocab = true;
      endTable();
      continue;
    }
    if (inVocab && /^## /.test(line)) {
      if (/^## (Semantic|Errors|Example|What |Scene model|How this)/i.test(line)) {
        inVocab = false;
        endTable();
        continue;
      }
      // Option-key values subsections stay inside vocab
      endTable();
    }
    if (!inVocab) continue;

    if (!/^\|/.test(line)) {
      if (mode) endTable();
      continue;
    }

    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (!cells.length) continue;

    // separator
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')) || c === '' || /^-+$/.test(c))) {
      continue;
    }

    // header row
    const h0 = cells[0].replace(/`/g, '');
    if (/^Keyword$/i.test(h0) || /Keyword/.test(cells[0])) {
      mode = 'kw';
      headers = cells.map(c => c.toLowerCase());
      continue;
    }
    if (/^Key$/i.test(h0) || (/Values/.test(cells[1] || '') && /Key|Status/.test(cells.join(' ')))) {
      mode = 'opt';
      headers = cells.map(c => c.toLowerCase());
      continue;
    }
    if (!mode) continue;
    // skip repeated headers
    if (/^(Keyword|Key|Values)/i.test(h0)) continue;

    const exp = isExperimental(cells);
    if (normativeOnly && exp) continue;
    const status = exp ? 'experimental' : 'normative';

    if (mode === 'kw') {
      const names = ticks(cells[0]).map(normalizeKw).filter(isKeywordName);
      // also bare first cell without ticks? not used in these docs
      for (const name of names) {
        if (name === 'figdown') continue; // always via header
        keywords.set(name, status);
      }
      // Option keys column: find header index
      let optIdx = headers.findIndex(h => /option/.test(h));
      if (optIdx < 0) {
        // English table: column often index 4 "Option keys"
        optIdx = cells.findIndex((c, idx) =>
          idx > 0 && ticks(c).some(t =>
            /^(shape|fill|stroke|text|style|class|in|layer|gap|z|dir|at|w|h|via|unit|numbering|note|labels)$/.test(t)
          )
        );
      }
      if (optIdx >= 0) {
        for (const t of ticks(cells[optIdx])) {
          if (/^[a-z][a-z0-9_]*$/i.test(t)) optionKeys.set(t, status);
        }
      }
    } else if (mode === 'opt') {
      // A POSITIONAL row's ticked names are not option keys. `| *cycle*
      // (positional, on `gap`) |` names the HOST directive, and reading it as
      // an option key demanded `gap=` of every `timing` reference figure — a
      // spelling that has never existed in the language, so the gap could
      // never be closed. Positional FLAGS are still picked up, from the
      // engine's own flag set, by the loop at the end of this branch.
      const positional = /\(positional/i.test(cells[0]);
      const keys = positional
        ? [] : ticks(cells[0]).filter(t => /^[a-z][a-z0-9_]*$/i.test(t));
      // skip positional pseudo-rows
      const joined = cells[0];
      if (/\*width|cell address|lane string|cycle|width value|in-cell|alignment|span markers|highlight|optional/i.test(joined) &&
          !keys.length) {
        continue;
      }
      for (const k of keys) {
        // "stroke` `text" already split by ticks
        optionKeys.set(k, status);
        if (cells[1]) {
          const vals = ticks(cells[1]).filter(v =>
            /^[a-z][a-z0-9_-]*$/i.test(v) &&
            !['rgb', 'rrggbb', 'px', 'id', 'transparent', 'name', 'width'].includes(v)
          );
          // only keep small closed enums
          const closed = vals.filter(v =>
            /^(box|rounded|circle|ellipse|diamond|cylinder|solid|dashed|dotted|right|down|left|up|lsb0|msb0|auto|orthogonal|straight|base)$/.test(v)
          );
          if (closed.length) {
            if (!enums.has(k)) enums.set(k, new Set());
            for (const v of closed) enums.get(k).add(v);
          }
        }
      }
      // positional flags listed as names — the flag SET comes from the engine
      for (const f of facts.flags)
        if (new RegExp('\\b' + f + '\\b').test(cells[0])) optionKeys.set(f, status);
    }
  }

  // genre opener is required
  keywords.set(genre, 'normative');

  // Child keywords of this genre's own typed block, from the engine's parser
  // dispatch. A genre doc that forgets a row cannot shrink the check, and a
  // renamed child cannot survive in it.
  const isExpGenre = !/Genre status:\s*NORMATIVE/i.test(md);
  for (const k of (facts.children[genre] || [])) {
    if (!keywords.has(k)) keywords.set(k, isExpGenre ? 'experimental' : 'normative');
  }

  // RETIREMENT FILTER — nothing the engine has retired may be tracked, no
  // matter which table it was read out of. This is the guard that would have
  // caught `wrap` (renamed `break`) and `optional` (renamed
  // `conditional` in the same release) instead of reporting them MISSING
  // forever from figures that could never legally contain them.
  const dropped = [];
  for (const k of [...keywords.keys()])
    if (facts.retiredKw.has(k)) { keywords.delete(k); dropped.push(k); }
  // Keyword and option-key retirements are separate namespaces (§10): `fill`
  // is a RETIRED keyword (it became `band`) and a LIVE option key at the same
  // time, so an option key is only ever filtered against RETIRED_OPT_KEYS.
  for (const k of [...optionKeys.keys()])
    if (facts.retiredOpt.has(k)) { optionKeys.delete(k); dropped.push(k + '='); }

  return { keywords, optionKeys, enums, dropped };
}

// the reference corpus is split at the file level: the three
// frozen genres sit in examples/reference/, and everything experimental — the
// three experimental genres AND the `<genre>-experimental.fd` files that
// demonstrate experimental constructs inside a frozen genre — sits in
// examples/reference/experimental/. A genre's SET spans both directories.
function refFilesFor(genre) {
  const out = [];
  for (const dir of [REF_DIR, path.join(REF_DIR, 'experimental')]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.fd')) continue;
      if (f === genre + '.fd' || f.startsWith(genre + '-')) out.push(path.join(dir, f));
    }
  }
  return out;
}

// A genre document is in spec/genres/ when the genre is frozen and in
// spec/genres/experimental/ when it is not.
function genreDocFor(genre) {
  for (const p of [path.join(GENRES_DIR, genre + '.md'),
                   path.join(GENRES_DIR, 'experimental', genre + '.md')]) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(GENRES_DIR, genre + '.md');
}

/**
 * Match engine findComment: '#' is a comment only at line start or after
 * whitespace (so `fill=#hex` survives), never inside a quoted string, and —
 * since VERBATIM-REGION-SCOPE — never inside a `[edge label]` either.
 *
 * The bracket depth counter and the in-string escape skip were missing here
 * until this release, so this function's "match engine findComment" claim was
 * false for two of the engine's four verbatim regions: `edge a -[hop #1]-> b`
 * was cut at the `#`, and `"a \" b # c"` toggled the quote state on the
 * ESCAPED quote and then cut there too. Both are lines the engine accepts, so
 * every tool reading through here saw a truncated version of a legal document.
 *
 * 0.1 closes the FOURTH region: a GFM pipe row is raw content and the
 * engine strips no comment inside one (it tests `raw.trimStart()` for a
 * leading `|` before ever calling `findComment`). This function did strip,
 * so `| Tag | vlan #10 |` — a row the engine reads as the cell text
 * `vlan #10` — arrived here as `| Tag | vlan `. The engine's own rule is
 * line-local and so is this one: the leading `|` IS the row token (core §1),
 * and no directive or comment line can begin with it.
 */
function stripComment(s) {
  if (s.trimStart().startsWith('|')) return s;
  let inq = false, depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (inq && s[i] === '\\' && i + 1 < s.length) { i++; continue; }
    if (s[i] === '"') inq = !inq;
    else if (inq) continue;
    else if (s[i] === '[') depth++;
    else if (s[i] === ']') { if (depth) depth--; }
    else if (s[i] === '#' && !depth && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}

function scanFd(text, flags) {
  const usedKw = new Set();
  const usedOpt = new Set();
  const usedEnum = new Map();
  for (const raw of text.split(/\r?\n/)) {
    let line = stripComment(raw).trim();
    if (!line) continue;
    if (line.startsWith('|')) {
      usedKw.add('|');
      continue;
    }
    const m = /^([a-zA-Z][\w]*)\b/.exec(line);
    if (m) usedKw.add(m[1]);

    const optRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)=/g;
    let om;
    while ((om = optRe.exec(line))) {
      const k = om[1];
      usedOpt.add(k);
      const rest = line.slice(om.index + k.length + 1);
      let val = '';
      if (rest.startsWith('"')) {
        const end = rest.indexOf('"', 1);
        val = end >= 0 ? rest.slice(1, end) : '';
      } else {
        val = (rest.split(/\s+/)[0] || '').split(/[,;%]/)[0];
      }
      if (val && /^[a-z][a-z0-9_-]*$/i.test(val)) {
        if (!usedEnum.has(k)) usedEnum.set(k, new Set());
        usedEnum.get(k).add(val);
      }
    }
    // positional flags carry no `=`, so they need their own probe; the set
    // is the engine's, so a renamed flag is detected under its new spelling
    for (const f of flags)
      if (new RegExp('\\b' + f + '\\b').test(line)) usedOpt.add(f);
  }
  return { usedKw, usedOpt, usedEnum };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const engine = loadEngine();
  const ENUMS = engineEnums(engine);
  const FACTS = engineVocabFacts(engine);
  checkMultivalueProbes(engine);
  let failed = 0;
  console.log('reference-coverage  dir=' + path.relative(ROOT, REF_DIR) +
    (args.normativeOnly ? '  normative-only' : '  full') +
    '  +forms  engine=' + path.relative(ROOT, engine.path));

  for (const genre of args.genres) {
    const mdPath = genreDocFor(genre);
    if (!fs.existsSync(mdPath)) {
      console.log('\n[' + genre + '] MISSING ' + path.relative(ROOT, mdPath));
      failed++;
      continue;
    }
    const md = fs.readFileSync(mdPath, 'utf8');
    const vocab = extractVocab(genre, md, args.normativeOnly, FACTS);
    // Full vocabulary (statuses intact) — the leak check needs to know which
    // rows are EXPERIMENTAL, which the filtered pass has already dropped.
    const vocabFull = args.normativeOnly
      ? extractVocab(genre, md, false, FACTS) : vocab;
    const files = refFilesFor(genre);
    if (!files.length) {
      console.log('\n[' + genre + '] NO reference files');
      failed++;
      continue;
    }

    const usedKw = new Set();
    const usedOpt = new Set();
    const usedEnum = new Map();
    let hasHeader = false;
    let setText = '';           // comment-stripped source of the whole set
    let baseScan = null;        // <genre>.fd alone, for the leak check
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      if (new RegExp('figdown\\s+0\\.1\\s+' + genre + '\\b').test(text)) hasHeader = true;
      const sc = scanFd(text, FACTS.flags);
      if (path.basename(f) === genre + '.fd') baseScan = sc;
      setText += text.split(/\r?\n/).map(stripComment).join('\n') + '\n';
      for (const k of sc.usedKw) usedKw.add(k);
      for (const k of sc.usedOpt) usedOpt.add(k);
      for (const [k, set] of sc.usedEnum) {
        if (!usedEnum.has(k)) usedEnum.set(k, new Set());
        for (const v of set) usedEnum.get(k).add(v);
      }
    }

    const missKw = [];
    for (const [k, st] of vocab.keywords) {
      if (COMPOSITION_OPENERS.has(k) && k !== genre) continue; // optional nested openers
      if (k === genre) {
        if (!hasHeader) missKw.push(k);
        continue;
      }
      if (!usedKw.has(k)) missKw.push(k + (st === 'experimental' ? ' (exp)' : ''));
    }

    const missOpt = [];
    for (const [k, st] of vocab.optionKeys) {
      if (args.normativeOnly && (st === 'experimental' || EXP_OPTION_KEYS.has(k))) continue;
      if (!usedOpt.has(k)) missOpt.push(k + (st === 'experimental' ? ' (exp)' : ''));
    }

    // FORM 1 — every value of a closed enum option must appear. The value set
    // comes from the engine; which keys apply comes from the genre's table.
    const missEnum = [];
    const enumKeys = [];
    for (const k of Object.keys(ENUMS)) {
      if (!vocab.optionKeys.has(k)) continue;
      if (args.normativeOnly &&
          (vocab.optionKeys.get(k) === 'experimental' || EXP_OPTION_KEYS.has(k))) continue;
      enumKeys.push(k);
      const used = usedEnum.get(k) || new Set();
      for (const v of ENUMS[k]) if (!used.has(v)) missEnum.push(k + '=' + v);
    }

    // FORM 2 — every construct with a multi-value (comma) form must be shown
    // in that form at least once, not only in its single-value spelling.
    const missForm = [];
    for (const mv of MULTIVALUE) {
      const table = mv.kind === 'opt' ? vocab.optionKeys : vocab.keywords;
      if (!table.has(mv.name)) continue;
      if (args.normativeOnly &&
          (table.get(mv.name) === 'experimental' ||
           (mv.kind === 'opt' && EXP_OPTION_KEYS.has(mv.name)))) continue;
      if (!mv.detect.test(setText))
        missForm.push(mv.kind === 'opt' ? mv.name + '=a,b' : mv.name + ' a,b');
    }

    // LEAK — the normative file must not reach outside the conformance surface.
    // For a genre that is itself EXPERIMENTAL the split has nothing to protect
    // (no part of the genre is inside the promise), so the finding is reported
    // as advisory instead of as a gap.
    const genreNormative = /Genre status:\s*NORMATIVE/i.test(md);
    const leaks = [];
    if (args.normativeOnly) {
      if (!baseScan) leaks.push('(no ' + genre + '.fd)');
      else {
        for (const [k, st] of vocabFull.keywords)
          if (st === 'experimental' && baseScan.usedKw.has(k)) leaks.push(k);
        for (const [k, st] of vocabFull.optionKeys)
          if ((st === 'experimental' || EXP_OPTION_KEYS.has(k)) && baseScan.usedOpt.has(k))
            leaks.push(k + '=');
      }
    }

    console.log('\n[' + genre + '] ' + files.map(f => path.basename(f)).join(', '));
    console.log('  tracked: kw=' + vocab.keywords.size +
      ' opt=' + vocab.optionKeys.size +
      ' enumKeys=' + enumKeys.length +
      (vocab.dropped.length
        ? '  (retired, not tracked: ' + vocab.dropped.join(' ') + ')' : ''));

    let gap = false;
    if (missKw.length) {
      console.log('  MISSING keywords (' + missKw.length + '): ' + missKw.join(', '));
      gap = true;
    } else console.log('  keywords: ok');
    if (missOpt.length) {
      console.log('  MISSING options (' + missOpt.length + '): ' + missOpt.join(', '));
      gap = true;
    } else console.log('  options: ok');
    if (missEnum.length) {
      console.log('  MISSING enum values (' + missEnum.length + '): ' +
        missEnum.slice(0, 24).join(', ') + (missEnum.length > 24 ? ' …' : ''));
      gap = true;
    } else console.log('  enum values: ok');
    if (missForm.length) {
      console.log('  MISSING multi-value forms (' + missForm.length + '): ' + missForm.join(', '));
      gap = true;
    } else console.log('  multi-value forms: ok');
    if (args.normativeOnly) {
      if (leaks.length) {
        console.log('  EXPERIMENTAL LEAK in ' + genre + '.fd (' + leaks.length + '): ' +
          leaks.join(', ') + '  — move it to ' + genre + '-experimental.fd' +
          (genreNormative ? '' : '  [advisory: the genre itself is EXPERIMENTAL]'));
        if (genreNormative) gap = true;
      } else console.log('  experimental leak: none');
    }
    if (gap) failed++;
  }

  console.log('\n' + (failed ? 'FAIL  ' + failed + ' genre(s) with gaps' : 'OK  coverage complete'));
  if (args.strict && failed) process.exit(1);
}

// The vocabulary machinery above is the project's ONE reader of the genre
// documents' Complete-vocabulary tables and of the engine's own registry.
// `tools/skill-coverage.js` asks the same question of a different corpus (the
// agent skill bundle instead of the reference figures), so it REQUIRES these
// rather than restating them: a second copy of `extractVocab` would drift the
// way the four engine copies did (PROCESS §3.1(a)).
// `MULTIVALUE` and `checkMultivalueProbes` are exported for the same reason
// tools/capability-coverage.js asks whether the WHOLE example
// corpus demonstrates each comma form, and a second copy of the detect
// patterns would be a second thing to update when a form moves.
module.exports = {
  GENRES, ROOT,
  loadEngine, engineVocabFacts, engineEnums, extractVocab,
  genreDocFor, stripComment, ticks, isExperimental,
  EXP_OPTION_KEYS, COMPOSITION_OPENERS,
  MULTIVALUE, checkMultivalueProbes,
};

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.stack || e);
    process.exit(2);
  }
}
