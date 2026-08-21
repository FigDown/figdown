#!/usr/bin/env node
'use strict';
// make-proof.js — generates PROOF.md, the page a stranger uses to check this
// project's claims mechanically.
//
//   node tools/make-proof.js            write PROOF.md
//   node tools/make-proof.js --check    regenerate to a buffer and diff against
//                                       the committed PROOF.md (gate:proof)
//
// WHY THIS FILE EXISTS
//
// The evidence this repository carries is real and it is scattered: the gate
// list is in package.json, the conformance totals are printed by a runner, the
// freeze surfaces are a manifest, and the four measured instruments each keep
// their numbers in their own results JSON beside their transcripts. A reader
// who wants to know whether any of it is true has to go and assemble it. That
// assembly is a program, so it is one, and its output is committed so the
// reader can start from the answer and re-derive it.
//
// THE ONE RULE: NO NUMBER IS TYPED
//
// Every count, rate and version on the page is read out of the tree at
// generation time — from package.json's own gate enumeration (the same one
// `npm test` walks), from the conformance runner's printed summary, from the
// manifest, from the corpus on disk, and from each instrument's results JSON.
// Numbers are NEVER read out of a design document's prose: a write-up states
// what was found, the JSON beside the transcripts is what was found, and only
// the second one can be re-derived. A page that restates a number by hand is
// the failure mode this file exists to remove.
//
// AND NOTHING VOLATILE
//
// Two identical trees must generate identical bytes, or `gate:proof` reports
// staleness that is not staleness. So: no dates, no durations, no spend, no
// absolute paths, no machine identity, and no number that needs the network.
// Everything expensive is either cheap-and-deterministic (the conformance
// runner and the diff selftest both finish in about a second and print a
// fixed summary) or left off the page.
//
// A MISSING SURFACE IS OMITTED, NOT INVENTED
//
// If a source file is not there, its section does not appear and the generator
// prints a warning naming what it could not find. The page never carries a
// number the tree could not produce.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'PROOF.md');

const warnings = [];
const warn = (m) => warnings.push(m);

const abs = (p) => path.join(ROOT, p);
const has = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

// ── formatting helpers (deterministic by construction) ───────────────────────
const trimZeros = (s) => s.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
const rate = (c, t) => (t ? trimZeros((c / t * 100).toFixed(1)) + '%' : 'n/a');
const num = (x) => trimZeros(Number(x).toFixed(4));
const pts = (x) => (Number(x) > 0 ? '+' : '') + num(x) + ' points';
const plural = (n, one, many) => n + ' ' + (Number(n) === 1 ? one : (many || one + 's'));
// A pre-registered criterion is quoted VERBATIM out of the results JSON rather
// than paraphrased, so the bar on the page is the bar the run was judged
// against and no threshold on this page is typed by hand. Greedy wrap, fixed
// width — same text in, same bytes out.
function quoteBlock(text, width) {
  const w = width || 78;
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= w) line += ' ' + word;
    else { out.push('> ' + line); line = word; }
  }
  if (line) out.push('> ' + line);
  return out.join('\n');
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// ── design/ write-ups are a SOURCE-TREE surface ──────────────────────────────
//
// `design/` does not ship: the published tree carries the spec, the engine, the
// corpus and the tools, and none of the working record. An unconditional link
// to a design document is therefore a link that resolves in the tree the page
// is generated in and points at nothing in the tree the stranger reads — the
// one failure this file's "a missing surface is omitted, not invented" rule
// exists to prevent, arriving through a literal instead of through a count.
// So every design/ citation passes through has(), exactly as sectionDiff's
// classification link already does: present, it links; absent, the clause goes
// and the sentence it sat in still reads.
const writeUp = (p) => (has(p) ? ' · write-up: [' + p + '](' + p + ')' : '');
const countFiles = (dir, ext) => walk(abs(dir), []).filter(p => p.endsWith(ext)).length;
const countEntries = (dir, ext) => (fs.existsSync(abs(dir))
  ? fs.readdirSync(abs(dir)).filter(n => n.endsWith(ext)).length : 0);

// ── the gate note: the tool's own header line, not a second description ──────
//
// A gate's one-line note is lifted from the top comment of the file the gate
// runs, so it cannot drift from the tool. Two gates get an override because
// their header's first line does not stand alone: the experimental conformance
// gate shares a runner with the normative one, and cite-check's first line is
// its own gate name.
const NOTE_OVERRIDE = {
  'gate:conformance-experimental': 'the same runner over `conformance/experimental/`, whose subject sits outside the v0.1 surface',
  'gate:cite': 'a citation must point at something that exists — every `R<n>` and `OQ-S<n>` cited in the shipped tree resolves to a real entry',
  'gate:strip': 'the strip test — removing every layout line must leave a document that still parses, renders, and expresses the identical structure and relationships',
  'gate:proof': 'this page is not stale — regenerating it from the tree must reproduce the committed bytes',
};

function headerNote(file) {
  if (!has(file)) return null;
  const lines = read(file).split('\n');
  const got = [];
  for (let i = 0; i < 40 && i < lines.length; i++) {
    const l = lines[i];
    if (/^#!/.test(l)) continue;
    if (/^'use strict';?$/.test(l.trim())) continue;
    if (/^\/\*\*?$/.test(l.trim())) continue;
    const m = /^\s*(?:\/\/|\*)\s?(.*)$/.exec(l);
    if (!m) { if (got.length) break; else continue; }
    const t = m[1].trim();
    if (!t) break;
    got.push(t);
    if (/[.:]$/.test(t)) break;
    // Continue only into a WRAPPED CLAUSE, never into the next sentence: either
    // the next line opens lowercase, or this one ends on a word that cannot end
    // a sentence. A tool header whose first line is a title followed by a new
    // sentence stops here, which is why the note never runs two sentences
    // together.
    const next = lines[i + 1] || '';
    const nm = /^\s*(?:\/\/|\*)\s?(.*)$/.exec(next);
    if (!nm) break;
    const nt = nm[1].trim();
    const dangling = /\b(the|a|an|of|to|in|for|with|and|or|that|its|it|is|are|be|by|on|at|from|must|not|no|every|each|this|these|which|what)$/i.test(t);
    if (!/^[a-z`"(]/.test(nt) && !dangling) break;
    if (got.length >= 4) break;
  }
  if (!got.length) return null;
  const base = path.basename(file);
  let s = got.join(' ')
    .replace(new RegExp('^' + base.replace(/\./g, '\\.') + '\\s*[—-]\\s*'), '')
    .replace(new RegExp('^' + base.replace(/\.js$/, '').replace(/\./g, '\\.') + '\\s*[—-]\\s*'), '');
  const p = s.indexOf('. ');
  if (p > 0) s = s.slice(0, p + 1);
  // The note lands in a Markdown table cell: a pipe would end the cell, and a
  // fence marker quoted out of a header would open a code block mid-row (and
  // hand `gate:fence` a fence that is not one).
  return s.replace(/```(\w*)/g, '$1').replace(/\|/g, '\\|').replace(/\.$/, '');
}

// ── section 1: the gates ─────────────────────────────────────────────────────
function sectionGates() {
  const pkg = readJSON('package.json');
  const scripts = pkg.scripts || {};
  const gates = Object.keys(scripts).filter(k => k.startsWith('gate:'));
  if (!gates.length) {
    console.error('make-proof: package.json declares no gate:* scripts — refusing to generate');
    process.exit(2);
  }
  const rows = [];
  const fellBack = [];
  for (const g of gates) {
    const cmd = scripts[g];
    const file = cmd.split(/\s+/).find(a => a.endsWith('.js'));
    let note = NOTE_OVERRIDE[g];
    if (!note) {
      note = file ? headerNote(file) : null;
      if (!note) { note = '(the tool states no one-line purpose in its header)'; fellBack.push(g); }
    }
    rows.push('| `' + g + '` | `' + cmd + '` | ' + note + ' |');
  }
  if (fellBack.length) warn('no header line to quote for: ' + fellBack.join(', '));

  return [
    '`npm test` does not carry a list of its own. It reads `package.json`, takes',
    'every script whose name starts with `gate:`, runs them in declaration order,',
    'and prints `N/N`. Adding a gate is adding a script; there is no second place',
    'to register it and no way for a gate to exist and not run.',
    '',
    '```',
    'npm test          # every gate, in order, with a pass/fail line each',
    'npm run gates:list # the enumeration alone, without running anything',
    '```',
    '',
    'There are **' + plural(gates.length, 'gate') + '**. Each note below is the tool\'s own',
    'one-line description of itself, read out of its header comment, so a note cannot',
    'drift from the tool it describes; ' + Object.keys(NOTE_OVERRIDE).length + ' are stated here instead, where the',
    "header's first line does not stand alone:",
    '',
    '| gate | command | what it asserts |',
    '|---|---|---|',
    ...rows,
  ].join('\n');
}

// ── section 2: conformance ───────────────────────────────────────────────────
function sectionConformance() {
  if (!has('conformance/run.js')) { warn('conformance/run.js is missing — conformance section omitted'); return null; }
  let out;
  try {
    out = execFileSync(process.execPath, [abs('conformance/run.js')], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    console.error('make-proof: `node conformance/run.js` exited non-zero — the suite is red, so its');
    console.error('            totals are not a proof of anything. Fix the suite, then regenerate.');
    process.exit(2);
  }
  const iN = out.indexOf('NORMATIVE');
  const iE = out.indexOf('EXPERIMENTAL —');
  const re = /(\d+) passed, (\d+) failed, (\d+) total/g;
  const grab = (from) => { re.lastIndex = from; const m = re.exec(out); return m; };
  const mN = iN >= 0 ? grab(iN) : null;
  const mE = iE >= 0 ? grab(iE) : null;
  const mT = /TOTAL RUN\s+(\d+) passed, (\d+) failed, (\d+) total/.exec(out);
  if (!mN || !mE || !mT) { warn('cannot parse the conformance runner summary — conformance section omitted'); return null; }
  const mBreak = /total\s+\((\d+) by genre, (\d+) by demoted construct, (\d+) both\)/.exec(out);

  const fdCases = countEntries('conformance/cases', '.fd');
  const fdExp = countEntries('conformance/experimental', '.fd');
  const expectedCases = fdCases === Number(mN[3]);
  const expectedExp = fdExp === Number(mE[3]);

  return [
    '### The conformance corpus',
    '',
    'A second implementation is not asked to match this engine\'s pictures. It is',
    'asked to match its **model**: for each fixture, the parsed structure or the',
    'exact error set. Those fixtures are the language, written down in a form that',
    'runs.',
    '',
    '```',
    'node conformance/run.js                  # the normative surface',
    'node conformance/run.js --experimental   # the corpus outside it',
    '```',
    '',
    '- **' + mN[3] + ' normative fixtures**, ' + mN[1] + ' passing, ' + mN[2] + ' failing. This is the number that may',
    '  be quoted as "the conformance suite" — `conformance/cases/`.',
    '- **' + mE[3] + ' experimental fixtures**, ' + mE[1] + ' passing, ' + mE[2] + ' failing' +
      (mBreak ? ' (' + mBreak[1] + ' by genre, ' + mBreak[2] + ' by demoted construct, ' + mBreak[3] + ' both)' : '') + '. They pin',
    '  reference-engine behaviour and are required to pass, but their subject is',
    '  outside the v0.1 surface, so a second implementation may skip the whole',
    '  directory and still conform. The reason for each is recorded in',
    '  `conformance/STATUS.txt`.',
    '- **' + mT[3] + ' fixtures run in total**, ' + mT[1] + ' passing, ' + mT[2] + ' failing.',
    '',
    'The corpus on disk is **' + fdCases + '** `.fd` files under `conformance/cases/` and **' + fdExp + '**',
    'under `conformance/experimental/`' +
      (expectedCases && expectedExp
        ? ' — the same counts the runner reports, so no fixture is present and unrun.'
        : ' — which does NOT match the runner totals above; the runner is the authority and the difference is worth reading.'),
    '',
    'Every audited engine-vs-spec deviation is written down in',
    '`conformance/DISCREPANCIES.md` rather than silently absorbed, and error-message',
    'coverage in `conformance/ERROR-COVERAGE.md`.',
  ].join('\n');
}

// ── section 3: the freeze surfaces ───────────────────────────────────────────
function sectionFreeze() {
  if (!has('archive/MANIFEST.tsv')) { warn('archive/MANIFEST.tsv is missing — freeze section omitted'); return null; }
  const rows = read('archive/MANIFEST.tsv').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('\t'));
  const releases = [...new Set(rows.map(r => r[0]))].sort();
  const byPrefix = {};
  for (const r of rows) {
    const k = r[1].split('/')[0];
    byPrefix[k] = (byPrefix[k] || 0) + 1;
  }
  const engineDirs = has('archive')
    ? fs.readdirSync(abs('archive'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()
    : [];
  const readDirs = has('read')
    ? fs.readdirSync(abs('read'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()
    : [];

  const rowsUnder = (prefix) => rows.filter(r => r[1].startsWith(prefix)).length;
  const engineLines = engineDirs.map(d =>
    '| `archive/' + d + '/` | ' + plural(countFiles('archive/' + d, '.html'), 'engine page') + ' | ' +
    (rowsUnder('archive/' + d + '/') ? 'yes, ' + plural(rowsUnder('archive/' + d + '/'), 'row') : 'no') + ' |');
  const readLines = readDirs.map(d =>
    '| `read/' + d + '/` | ' + countFiles('read/' + d, '.md') + ' `.md` | ' +
    (rowsUnder('read/' + d + '/')
      ? 'yes, ' + plural(rowsUnder('read/' + d + '/'), 'row')
      : 'no — not a released language version yet') + ' |');

  return [
    '### The archive, and what "never rewritten" is checked against',
    '',
    'Per released version the project keeps a git tag and a runnable engine page,',
    'and neither is ever rewritten. `archive/MANIFEST.tsv` is what that is checked',
    'against: one append-only row per archived file — release, path, byte count,',
    'SHA-256 — written once at release and never edited. If the bytes on disk stop',
    'matching a row, the bytes are wrong, not the row.',
    '',
    '```',
    'node tools/archive-check.js --strict     # gate:archive',
    '```',
    '',
    'The manifest carries **' + plural(rows.length, 'row') + '** across **' +
      plural(releases.length, 'released version') + '**: ' + releases.map(r => '`' + r + '`').join(', ') + '.',
    '',
    '| surface | on disk | in the manifest |',
    '|---|---|---|',
    ...engineLines,
    ...readLines,
    '',
    'The gate asserts five things, and they are different failures: **modification**',
    '(re-hash every listed path), **deletion** (a listed path that no longer exists —',
    'the failure a content hash cannot see), **addition** (a file under an archived',
    'prefix the manifest does not list, which is how an archived version gets changed',
    'without any hash moving), **coverage** (every released version named in the',
    'manifest has at least one runnable engine page), and **structural coverage**',
    '(every version directory that exists has at least one row). This page states',
    'what the gate checks; it does not re-check it — run the command above.',
  ].join('\n');
}

// ── section 4: the corpus and the engine ─────────────────────────────────────
function sectionCorpus() {
  const files = walk(abs('examples'), []);
  if (!files.length) { warn('examples/ is empty or missing — corpus section omitted'); return null; }
  const fd = files.filter(p => p.endsWith('.fd'));
  const svg = files.filter(p => p.endsWith('.svg'));
  const unpaired = fd.filter(p => !fs.existsSync(p.replace(/\.fd$/, '.svg'))).map(rel);
  const figFd = countFiles('figures', '.fd');
  const figSvg = countFiles('figures', '.svg');

  const engineHtml = 'editor/figdown.html';
  let version = null;
  if (has(engineHtml)) {
    const m = /^const FIGDOWN_VERSION = '([^']+)';$/m.exec(read(engineHtml));
    if (m) version = m[1];
  }
  if (!version) warn('cannot read FIGDOWN_VERSION from ' + engineHtml + ' — engine version omitted');
  const copies = ['editor/figdown.html', 'skill/figdown/figdown.html', 'dist/figdown.js', 'dist/figdown.mjs'].filter(has);
  const pkgVersion = readJSON('package.json').version;

  const lines = [
    '### The published corpus, and its artifacts',
    '',
    'Every published figure is a `.fd` with its rendered `.svg` committed beside it,',
    'and the SVG embeds its own source and that source\'s SHA-256. So an artifact is',
    'checkable against the text it claims to draw, by anyone, without the editor.',
    '',
    '```',
    'node tools/artifact-check.js --strict    # gate:artifact',
    'node tools/fence-check.js --strict       # gate:fence — every figdown fence in the docs',
    '```',
    '',
    '- `examples/` — **' + fd.length + '** `.fd`, **' + svg.length + '** `.svg`.' +
      (unpaired.length
        ? ' ' + plural(unpaired.length, '`.fd`', '`.fd` files') + ' ' + (unpaired.length === 1 ? 'has' : 'have') +
          ' no committed `.svg`: ' + unpaired.map(p => '`' + p + '`').join(', ') + '.'
        : ' Every `.fd` has one.'),
    '- `figures/` — **' + figFd + '** `.fd`, **' + figSvg + '** `.svg` (the figures the documentation itself uses).',
  ];
  if (version) {
    lines.push('');
    lines.push('### The engine');
    lines.push('');
    lines.push('The engine is one hand-edited file, `editor/figdown.html`; the other copies are',
      'generated from it and byte-gated against it. It stamps its own version into every',
      'artifact it builds, because the reproducibility promise is per-renderer-version.');
    lines.push('');
    lines.push('- `FIGDOWN_VERSION` — **`' + version + '`** (read from `editor/figdown.html`).');
    lines.push('- package version — **`' + pkgVersion + '`**.');
    lines.push('- engine copies present, each gated against that source copy — **' + copies.length + '**: ' +
      copies.map(c => '`' + c + '`').join(', ') + '.');
  }
  return lines.join('\n');
}

// ── section 5: the four instruments ──────────────────────────────────────────
function instrumentComprehension() {
  const p = 'tools/comprehension/baseline.json';
  if (!has(p)) { warn(p + ' is missing — comprehension instrument omitted'); return null; }
  const j = readJSON(p);
  const o = j.overall || {};
  const figs = Array.isArray(j.figures) ? j.figures : Object.values(j.figures || {});
  const genres = [...new Set(figs.map(f => f.genre))].sort();
  const t = j.target || {};
  const fc = o.failure_classes || {};
  const transcripts = countEntries('tools/comprehension/transcripts', '.json');
  const conds = figs.length ? Object.keys(figs[0].conditions || {}) : [];

  return [
    '### %N%.1 Can a reader who has never opened the spec read a `.fd`?',
    '',
    '**The claim under test:** ' + (t.statement || 'a cold reader recovers ' + rate(t.floor, 1) + '–' + rate(t.ceiling, 1) + ' of a `.fd` from the syntax alone') + '.',
    '',
    'The trap is obvious and was designed around: the questions were authored from the',
    'SOURCE each figure documents, by an agent that had not seen the `.fd`, so the',
    'instrument cannot ask only what the syntax happens to make easy. Each figure is',
    'read under ' + conds.length + ' conditions (' + conds.map(c => '`' + c + '`').join(', ') + '), and one of them is a',
    '**control shown the title and no file at all**.',
    '',
    '| | correct | of | score |',
    '|---|---:|---:|---:|',
    '| syntax alone | ' + o.syntax.correct + ' | ' + o.syntax.total + ' | **' + rate(o.syntax.correct, o.syntax.total) + '** |',
    '| control — title only, no file | ' + o.control.correct + ' | ' + o.control.total + ' | ' + rate(o.control.correct, o.control.total) + ' |',
    '| syntax, instrument defects removed | ' + o.instrument_adjusted.correct + ' | ' + o.instrument_adjusted.total + ' | ' + rate(o.instrument_adjusted.correct, o.instrument_adjusted.total) + ' |',
    '',
    'Syntax alone lands inside the stated band and the floor is met (`meets_floor: ' + String(o.meets_floor) + '`).',
    'The control is the number to read next, and it is the uncomfortable one: a reader',
    'shown the title and nothing else scores ' + rate(o.control.correct, o.control.total) + ', so the lift',
    '(syntax − control) is ' + pts(o.lift_points) + '. That is not a defect in the language and the',
    'write-up refuses to read it as one — the reader is instructed to answer only from',
    'the text and to say NOT STATED otherwise, so the file\'s job is to CONSTRAIN a',
    'reader that already knows these protocols down to what the figure actually carries.',
    'The consequence is stated there and it is the honest one: on famous standards the',
    'control is at ceiling, so lift cannot measure legibility at all.',
    '',
    'The suite also reports its own defects rather than absorbing them — the ' +
      (o.syntax.total - o.syntax.correct) + ' missed',
    'answers are classified as ' + Object.entries(fc).map(([k, v]) => '`' + k + '` ' + v).join(', ') + '.',
    '',
    '- **' + figs.length + ' figures**, ' + genres.length + ' genres (' + genres.map(g => '`' + g + '`').join(', ') + ').',
    '- **' + transcripts + ' transcripts** committed at `tools/comprehension/transcripts/`.',
    '- numbers: `tools/comprehension/baseline.json`' + writeUp('design/comprehension-suite.md'),
    '',
    '```',
    'node tools/comprehension-check.js --selftest   # are the keys sane?',
    'node tools/comprehension-check.js              # score, offline, from the committed transcripts',
    'node tools/comprehension-check.js --audit --figure tcp-header   # every answer, verbatim',
    '```',
  ].join('\n');
}

function instrumentGenre() {
  const p = 'tools/genre-probe/results.json';
  if (!has(p)) { warn(p + ' is missing — genre probe omitted'); return null; }
  const j = readJSON(p);
  const c = j.conditions || {};
  const ks = j.keys_summary || {};
  const bundle = j.bundle_measured || {};
  const transcripts = countEntries('tools/genre-probe/transcripts', '.json');
  const vc = (cond) => cond && cond.version_correctness_statechart_sequence;

  return [
    '### %N%.2 Does an agent pick the right genre without a guideline?',
    '',
    '**The claim under test:** before any genre-selection guideline exists, does a',
    'reader shown the bundle pick the genre a labeller would pick? The two numbers',
    'stop existing the moment a guideline ships — the `cold` column is the last',
    'measurement of the documents as they stood before one existed, and it cannot be',
    'taken again — which is why it was taken first.',
    '',
    '| condition | genre matches the key | honest fallback | version correct (statechart + sequence) |',
    '|---|---:|---:|---:|',
    ...Object.entries(c).map(([name, cond]) => '| `' + name + '` | ' +
      cond.genre_match.correct + '/' + cond.genre_match.total + ' (' + rate(cond.genre_match.correct, cond.genre_match.total) + ') | ' +
      (cond.honest_fallback ? cond.honest_fallback.with_reason + '/' + cond.honest_fallback.block_answers + ' (' + rate(cond.honest_fallback.with_reason, cond.honest_fallback.block_answers) + ')' : 'n/a') + ' | ' +
      (vc(cond) ? vc(cond).correct + '/' + vc(cond).total + ' (' + rate(vc(cond).correct, vc(cond).total) + ')' : 'n/a') + ' |'),
    '',
    'Genre selection is not where the failures are: `cold` is ' + pts(j.cold_minus_naive_points) + ' against `naive`,',
    'and both fall back honestly when no genre fits. The **declared language version**',
    'is where they are — a reader that picks `statechart` or `sequence` correctly and',
    'then writes a header version that genre does not exist in has produced a file the',
    'engine refuses.',
    '',
    '- keys: **' + ks.single + '** single-answer, **' + ks.either_with_reason + '** either-with-reason, **' + ks.key_disputed + '** disputed.',
    '- **' + transcripts + ' transcripts** committed at `tools/genre-probe/transcripts/`.',
    (bundle.path ? '- the measurement is pinned to one bundle: `' + bundle.path + '`, SHA-256 `' + bundle.sha256 + '`. Re-word the bundle and `--verify` goes red, because a re-worded bundle is a different measurement.' : null),
    '- numbers: `tools/genre-probe/results.json`' + writeUp('design/genre-gate-baseline.md'),
    '',
    '```',
    'node tools/genre-probe/genre-probe.js --write-results   # score, offline',
    'node tools/genre-probe/genre-probe.js --audit           # every answer, verbatim',
    'node tools/genre-probe/genre-probe.js --strict          # stale or unclassified -> exit 1',
    '```',
  ].filter(l => l !== null).join('\n');
}

function instrumentRepair() {
  const p = 'tools/repair-probe/results.json';
  if (!has(p)) { warn(p + ' is missing — repair probe omitted'); return null; }
  const j = readJSON(p);
  const fr = j.floor_run, r1 = j.run1;
  if (!fr) { warn(p + ' has no floor_run — repair probe omitted'); return null; }
  const A = fr.conditions.A, B = fr.conditions.B;
  const transcripts = countEntries('tools/repair-probe/transcripts', '.json');

  return [
    '### %N%.3 Does the diagnostics envelope help a model fix a broken figure? — **no, and it was retracted**',
    '',
    '**The claim under test.** Condition `B` adds a diagnostics envelope to what the',
    'model is shown when a figure is broken; condition `A` is the plain one. The bar was',
    'written down before the run and was not touched afterwards — this is it, quoted out',
    'of `results.json` rather than restated:',
    '',
    quoteBlock(fr.criteria.text),
    '',
    '| ' + fr.fixture_set + ' | chains | first-round success | mean rounds to success | eventual success |',
    '|---|---:|---:|---:|---:|',
    '| `A` (plain) | ' + A.chains + ' | ' + A.first_round_success + '/' + A.chains + ' (' + rate(A.first_round_success, A.chains) + ') | ' + num(A.mean_rounds_to_success) + ' | ' + A.eventual_success + '/' + A.chains + ' |',
    '| `B` (envelope) | ' + B.chains + ' | ' + B.first_round_success + '/' + B.chains + ' (' + rate(B.first_round_success, B.chains) + ') | ' + num(B.mean_rounds_to_success) + ' | ' + B.eventual_success + '/' + B.chains + ' |',
    '',
    'First-round delta **' + pts(fr.first_round_delta_points) + '**; mean-rounds delta **' + num(fr.mean_rounds_delta) + '**.',
    'Neither criterion met (`first_round_gate_met: ' + String(fr.criteria.first_round_gate_met) + '`,',
    '`mean_rounds_gate_met: ' + String(fr.criteria.mean_rounds_gate_met) + '`), so',
    '`b_enters_library: ' + String(fr.criteria.b_enters_library) + '`. **The envelope did not ship.** The one thing `B` did do is',
    'visible in the last column and is not a criterion: every chain eventually succeeded,',
    'and ' + (fr.suggested_fix_adoption ? fr.suggested_fix_adoption.adopted + ' of ' + fr.suggested_fix_adoption.suggested : 'n/a') + ' engine-suggested coordinates were adopted where offered.',
    '',
    (r1 ? '- an earlier run over ' + r1.fixture_ids.length + ' single-error fixtures hit the ceiling — ' +
      r1.conditions.A.first_round_success + '/' + r1.conditions.A.chains + ' and ' + r1.conditions.B.first_round_success + '/' + r1.conditions.B.chains +
      ' first-round in both conditions — which measures nothing and gates nothing. It is kept as `run1` rather than deleted, because a ceiling result is the reason the final run was re-designed around compound fixtures and a weaker reader model.' : null),
    '- **' + transcripts + ' transcripts** committed at `tools/repair-probe/transcripts/`.',
    '- numbers: `tools/repair-probe/results.json`' + writeUp('design/repair-probe-baseline.md'),
    '',
    '```',
    'node tools/repair-probe/repair-probe.js --check           # offline: fixtures and staged checks',
    'node tools/repair-probe/repair-probe.js --write-results   # score, offline',
    'node tools/repair-probe/repair-probe.js --report          # both runs, printed separately',
    '```',
  ].filter(l => l !== null).join('\n');
}

function instrumentAuthor() {
  const p = 'tools/author-probe/results.json';
  if (!has(p)) { warn(p + ' is missing — author probe omitted'); return null; }
  const j = readJSON(p);
  const A = j.conditions.A, B = j.conditions.B;
  const transcripts = countEntries('tools/author-probe/transcripts', '.json');
  const aborted = countEntries('tools/author-probe/transcripts-aborted-oneshot', '.json');

  const lines = [
    '### %N%.4 Do the candidate SKILL clauses make an authoring agent tell the truth? — **yes, at the bar**',
    '',
    '**The claim under test.** Condition `B` shows the author the candidate `SKILL.md`',
    'clauses; condition `A` does not. Some of the tasks are **traps** — they demand',
    'something the language cannot currently express, so the only truthful outcome is to',
    'say so, and the counts below separate them from the normal ones. The bar was written',
    'down before any condition-`B` call; quoted out of `results.json`:',
    '',
    quoteBlock(j.criteria.text),
    '',
    '| condition | normal tasks valid | mean rounds to valid | trap tasks reported truthfully |',
    '|---|---:|---:|---:|',
    '| `A` (control) | ' + A.normal.valid + '/' + A.normal.total + ' (' + rate(A.normal.valid, A.normal.total) + ') | ' + num(A.normal.mean_rounds_to_valid) + ' | ' + A.trap.flags_unmet_demand + '/' + A.trap.total + ' (' + rate(A.trap.flags_unmet_demand, A.trap.total) + ') |',
    '| `B` (candidate clauses) | ' + B.normal.valid + '/' + B.normal.total + ' (' + rate(B.normal.valid, B.normal.total) + ') | ' + num(B.normal.mean_rounds_to_valid) + ' | ' + B.trap.flags_unmet_demand + '/' + B.trap.total + ' (' + rate(B.trap.flags_unmet_demand, B.trap.total) + ') |',
    '',
    'Truthful-report delta **' + pts(j.trap_truthful_delta_points) + '** — met exactly at the bar, not above it.',
    'Normal-task validity moved ' + pts(j.normal_validity_delta_points) + ', so non-inferiority is not the binding',
    'question here. `truthful_gate_met: ' + String(j.criteria.truthful_gate_met) + '`, `non_inferiority_met: ' + String(j.criteria.non_inferiority_met) + '`,',
    '`clauses_enter_skill: ' + String(j.criteria.clauses_enter_skill) + '`.',
    '',
    'Read the absolute numbers, not only the delta: even with the clauses, most trap',
    'tasks still end with the agent claiming full compliance (`claims_full_compliance` ' +
      B.trap.claims_full_compliance + ' of ' + B.trap.total + '),',
    'and normal-task validity within three rounds is under half. The clauses moved a bad',
    'number to a less bad one.',
  ];
  if (aborted) {
    lines.push('');
    lines.push('**The run before this one does not score, and it is kept anyway.** An earlier',
      'harness gave each author a single cold shot with no validator feedback. It was',
      'stopped mid-run, condition `A` only, zero condition-`B` calls, because first-pass',
      'validity floored at both reader models — and a metric that floors for the control',
      'floors for the treatment too, which makes the non-inferiority bar vacuously',
      'passable rather than passed. Its **' + aborted + ' transcripts** are preserved verbatim at',
      '`tools/author-probe/transcripts-aborted-oneshot/`, and they are excluded from',
      'scoring by construction rather than by intention: the scorer reads');
    // This closing sentence exists only to hand the reader the write-up. Where
    // there is no write-up to hand over, the sentence goes whole rather than
    // degrading into a promise the tree cannot keep; the paragraph before it
    // already says everything the page can vouch for.
    const baseline = 'design/author-probe-baseline.md';
    if (has(baseline)) {
      lines.push('`tools/author-probe/transcripts/` and that directory is not it. What went wrong,',
        'and the redesign it forced, is [' + baseline + ' §6](' + baseline + ').');
    } else {
      lines.push('`tools/author-probe/transcripts/` and that directory is not it.');
    }
  }
  lines.push('');
  lines.push('- **' + transcripts + ' transcripts** committed at `tools/author-probe/transcripts/`.');
  lines.push('- numbers: `tools/author-probe/results.json`' + writeUp('design/author-probe-baseline.md'));
  lines.push('');
  lines.push('```');
  lines.push('node tools/author-probe/author-probe.js --check           # offline: tasks, refusals, coverage');
  lines.push('node tools/author-probe/author-probe.js --write-results   # score, offline');
  lines.push('node tools/author-probe/author-probe.js --verify          # is the measured text still the shipped text?');
  lines.push('```');
  return lines.join('\n');
}

function sectionInstruments() {
  const parts = [instrumentComprehension(), instrumentGenre(), instrumentRepair(), instrumentAuthor()].filter(Boolean);
  if (!parts.length) { warn('no instrument results found — measurement section omitted'); return null; }
  return [
    'There are ' + plural(parts.length, 'instrument') + '. Each states what it measures before it runs, records the',
    'criterion that would make it fail, keeps every transcript, and scores offline from',
    'those transcripts by a pure function of files in this tree. The scoring commands',
    'below call no model and cost nothing; the `--run` modes that DO call a model are',
    'deliberately not wired into `npm test`, because a gate that spends money and',
    'depends on a model\'s mood is not a gate.',
    '',
    'They did not all come out the way the project would have chosen. One candidate',
    'failed its own pre-registered bar and was retracted; one instrument was aborted',
    'mid-run and is published anyway; one passed exactly at the bar and not above it.',
    'Those are on this page for the same reason as the rest: a measurement that can only',
    'confirm is not a measurement.',
    '',
    parts.join('\n\n'),
  ].join('\n');
}

// ── section 6: the semantic diff ─────────────────────────────────────────────
function sectionDiff() {
  const p = 'tools/figdown-diff.js';
  if (!has(p)) { warn(p + ' is missing — semantic-diff section omitted'); return null; }
  let out;
  try {
    out = execFileSync(process.execPath, [abs(p), '--selftest'], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    console.error('make-proof: `node tools/figdown-diff.js --selftest` exited non-zero — regenerate once it is green.');
    process.exit(2);
  }
  const m = /SELFTEST:\s*(\d+)\/(\d+)\s+passed/.exec(out);
  if (!m) { warn('cannot parse the diff selftest summary — semantic-diff section omitted'); return null; }
  const doc = has('design/semantic-diff-classification.md');
  return [
    'A reviewer reading a `.fd` diff wants one question answered: did this edit change',
    'what the figure SAYS, or only how it looks? `tools/figdown-diff.js` answers it',
    'over the parsed model rather than the text, refuses to diff a side that does not',
    'parse, and carries its own selftest — including regression cases for the ones it',
    'got wrong before, and an audit case asserting every presentation attribute site is',
    'visible to the walk.',
    '',
    '```',
    'node tools/figdown-diff.js --selftest',
    '```',
    '',
    '**' + m[1] + '/' + m[2] + ' selftest cases pass.** This is a tool with a selftest, not a gate: it is not',
    'in the `gate:*` list above, so `npm test` does not run it and you should run it',
    'yourself.' + (doc ? ' The classification it implements is written up in [design/semantic-diff-classification.md](design/semantic-diff-classification.md).' : ''),
  ].join('\n');
}

// ── the page ─────────────────────────────────────────────────────────────────
// ── the closing section: what the page does not prove ────────────────────────
const TAIL = [
    'Stated plainly, because a proof page that lists only what it proves is an',
    'advertisement:',
    '',
    '- The conformance corpus pins **this** engine\'s model against fixtures. It is what',
    '  a second implementation would be tested against; no second implementation has',
    '  been tested against it.',
    '- The instruments measure model readers, at named model aliases, on small',
    '  fixture sets whose sizes are in the tables above. They are evidence, not',
    '  statistics, and each write-up carries its own section on what is weak in it.',
    '- The gates check that this tree is self-consistent. Self-consistency is not',
    '  usefulness: no gate can tell you the language is worth writing figures in.',
    '- The language is 0.x. What the version numbers do and do not promise is in',
    '  [README.md](README.md), under Stability, and the promise that does not weaken is',
    '  the archive.',
].join('\n');

function build() {
  const head = [
    '# PROOF — check this project instead of believing it',
    '',
    'This page is generated by `node tools/make-proof.js`. Every number on it is read',
    'out of this tree at generation time — from `package.json`\'s own gate enumeration,',
    'from the conformance runner\'s printed summary, from the archive manifest, from the',
    'corpus on disk, and from each measurement\'s results JSON beside its transcripts.',
    'No number is typed, and none is copied out of a design document\'s prose.',
    '',
    '`node tools/make-proof.js --check` (`gate:proof`, part of `npm test`) regenerates',
    'the page into a buffer and fails if this file no longer matches the tree. So the',
    'page is either current or the build is red.',
    '',
    'Every claim below is followed by the command that reproduces it and the path where',
    'its record lives. Nothing here asks to be taken on trust, and the results that came',
    'out against the project are on the page with the rest.',
    '',
    '```',
    'npm test                                # every gate',
    'node tools/make-proof.js --check        # is this page still true?',
    '```',
  ].join('\n');

  // Groups are numbered at assembly, never in the text: a surface that is
  // missing drops out of the page AND out of the numbering, so an omitted
  // section cannot leave a hole a reader has to explain to themselves. `%N%`
  // in any body is the group's own number.
  const groups = [
    { title: 'What is checked on every change', parts: [sectionGates()] },
    { title: 'What the language promises, and where that is pinned', parts: [sectionConformance(), sectionFreeze()] },
    { title: 'What ships, and how it is stamped', parts: [sectionCorpus()] },
    { title: 'What was measured rather than asserted', parts: [sectionInstruments()] },
    { title: 'Telling a meaning change from a presentation change', parts: [sectionDiff()] },
    { title: 'What this page does not prove', parts: [TAIL] },
  ].map(g => ({ title: g.title, parts: g.parts.filter(Boolean) })).filter(g => g.parts.length);

  const sections = groups.map((g, i) =>
    ('## ' + (i + 1) + '. ' + g.title + '\n\n' + g.parts.join('\n\n')).replace(/%N%/g, String(i + 1)));


  return [head, ...sections].join('\n\n') + '\n';
}

// ── entry ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
if (argv.includes('--help')) {
  console.log('usage: node tools/make-proof.js [--check]');
  console.log('  (no flag)  regenerate PROOF.md from the tree');
  console.log('  --check    diff a fresh generation against the committed PROOF.md (gate:proof)');
  process.exit(0);
}

const page = build();
for (const w of warnings) console.error('make-proof: WARNING — ' + w);

if (!CHECK) {
  fs.writeFileSync(OUT, page);
  console.log('make-proof: wrote PROOF.md (' + page.length + ' bytes, ' + page.split('\n').length + ' lines)');
  if (warnings.length) console.log('make-proof: ' + warnings.length + ' surface(s) omitted — see the warnings above');
  process.exit(0);
}

if (!fs.existsSync(OUT)) {
  console.log('FAIL  PROOF.md does not exist — run `node tools/make-proof.js`');
  process.exit(1);
}
const committed = fs.readFileSync(OUT, 'utf8');
if (committed === page) {
  console.log('OK  PROOF.md matches the tree (' + page.split('\n').length + ' lines)');
  process.exit(0);
}
const a = committed.split('\n'), b = page.split('\n');
let i = 0;
while (i < a.length && i < b.length && a[i] === b[i]) i++;
console.log('FAIL  PROOF.md is stale — run `node tools/make-proof.js`');
console.log('      first difference at line ' + (i + 1) + ':');
console.log('        committed: ' + (i < a.length ? JSON.stringify(a[i]) : '(end of file)'));
console.log('        generated: ' + (i < b.length ? JSON.stringify(b[i]) : '(end of file)'));
console.log('      ' + a.length + ' committed lines vs ' + b.length + ' generated');
process.exit(1);
