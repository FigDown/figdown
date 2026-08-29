#!/usr/bin/env node
'use strict';
// FigDown v0.1 parser-conformance runner.
//
// usage: node conformance/run.js [--update] [--experimental]
//                                [--engine-cmd=<command>] [name-filter]
//
// TWO WAYS TO REACH AN IMPLEMENTATION, AND THE DEFAULT IS UNCHANGED
//
// IN-PROCESS (default) — the reference engine is loaded out of figdown.html
// and called directly. Nothing about this path changed when the second one
// landed; every count, every gate and every golden is exactly as it was.
//
// SUBPROCESS (`--engine-cmd=<command>`, or $FIGDOWN_ENGINE_CMD) — the runner
// invokes an EXTERNAL command per fixture, writes the `.fd` bytes to its
// stdin, and compares its stdout against the SAME goldens. The command may be
// written in any language; nothing about it is inspected. This exists because
// core §0.2 (CONFORMANCE-CLASS-OBLIGATIONS) tells an outside claimant that `conformance/cases/` IS the
// Parser class's conformance suite, and until 0.5 a claimant who wrote
// their parser in anything but JavaScript could not execute the harness they
// were pointed at ($FIGDOWN_HTML only substitutes a second JAVASCRIPT engine
// mimicking this one's private module shape). Engine-backlog item 80, filed
// as a defect against INDEPENDENT-IMPLEMENTATION-CRITERION.
//
// The contract the command must satisfy is written in conformance/README.md
// ("The harness contract"); conformance/adapters/reference-engine.js is a
// worked implementation of it that drives the reference engine, and running
// the suite through it must produce results identical to the in-process path.
//
// The subprocess path covers the PARSER class only — model goldens and error
// goldens. Geometry goldens are the RENDERER's (core §8's geometry-time
// errors, raised by render(), not parse()), and the determinism self-check and
// the three engine property tests below all need in-process access to the
// reference engine, so all three are skipped and the skip is REPORTED rather
// than absorbed. `--update` is refused in subprocess mode: goldens are minted
// by the reference engine and by nothing else.
//
// ONE MECHANISM PUTS A CASE OUTSIDE THE CONFORMANCE SURFACE: LOCATION
//
// conformance/cases/        the v0.1 conformance surface — NORMATIVE.
// conformance/experimental/ everything outside it — EXPERIMENTAL.
//
// Until 0.1 there were TWO: this directory split, plus a per-case
// tag in conformance/STATUS.txt that put 52 experimental fixtures inside
// cases/. The 0.1 isolation ruling requires frozen and
// experimental material to be separated at the FILE level, so that a
// consumer who wants nothing experimental can ignore whole files, so the
// 52 moved and the tag stopped deciding anything.
//
// STATUS.txt survives, with a narrower job: it is the REASON manifest for
// conformance/experimental/. It no longer decides a bucket (location
// does); it records WHY each fixture is outside the surface, and the
// runner enforces the correspondence in BOTH directions — a record naming
// a file that is not in experimental/ is an error, and a fixture in
// experimental/ with no record is an error. Neither list can rot.
//
// A default run executes BOTH corpora: an experimental fixture still RUNS
// and still has to PASS, because it pins real reference-engine behaviour.
// What its location changes is which TOTAL it counts toward. The headline
// conformance number is the NORMATIVE count only; a second implementation
// may skip the whole of experimental/ and still claim v0.1 conformance.
// `--experimental` runs that corpus on its own.
//
// For each <corpus>/NNN-name.fd:
//   - parse with the reference engine;
//   - if the parse reports errors: compare the SORTED error lines against
//     NNN-name.errors.txt;
//   - otherwise: project the doc through normalize.js and compare against
//     NNN-name.model.json (pretty-printed, trailing newline), AND compare any
//     GEOMETRY-TIME diagnostics from render() against NNN-name.geometry.txt
//     (absent when the figure renders clean).
// Additionally every valid case gets a determinism self-check: parse+render
// twice, the SVG byte streams must be identical. SVG output itself has no
// goldens (renderer-version-specific by spec section 3: only same source +
// same renderer version must be byte-identical).
//
// --update rewrites the goldens (and removes a stale golden of the other
// kind when a case flips between valid and erroring). Exit code 1 on any
// failure.
const fs = require('fs');
const path = require('path');

// Engine lookup, same order as tools/build-svg.js: $FIGDOWN_HTML, a
// co-located copy, then ../editor/figdown.html (the repository layout).
//
// ../figdown.html is the FROZEN layout. A copy of this runner is archived at
// each language release under archive/<X.Y>/conformance/, beside the engine
// page archive/<X.Y>/figdown.html that the same release owes (core.md §13.5).
// From there ../editor/ does not exist and never will, so without this
// candidate the frozen suite is inert: fixtures with nothing to run them.
// In the live tree <repo>/figdown.html does not exist, so this line changes
// no lookup here — it is the one line that makes every future frozen
// partition self-contained.
//
// The lookup is performed INSIDE loadEngine(), not at module load, so that a
// subprocess-mode run never touches it: `conformance/` plus an external
// command must be enough, in a tree that contains no engine page at all.
const ENGINE_CANDIDATES = () => [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean);

function loadEngine() {
  const ENGINE = ENGINE_CANDIDATES().find(p => fs.existsSync(p));
  if (!ENGINE) throw new Error('figdown.html not found (set FIGDOWN_HTML or keep it next to this script)');
  const h = fs.readFileSync(ENGINE, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  const factory = new Function(h.slice(start, end) +
    '\nreturn {parse, render, stackSectionSvgs, tokenize, findComment, OPT_KEYS, LANE_RE:/^[01pnx=.]+$/};');
  return factory();
}

// LANE-ALPHABET-KEY-RESERVATION — option-key namespace guard.
//
// `splitOpts(tk.toks, lead==='signal')` keeps UNREGISTERED `key=value` tokens
// positional inside a wave `signal` lane, but a REGISTERED key is stolen
// first: splitOpts tests OPT_KEYS before it consults the laneMode guard. Lane
// characters are `[01pnx=.]`, which includes `p`, `n`, `x` and `=` — so a
// lane written `x=01` is positional ONLY because no option key is spelled
// `x`. Registering a single-letter key drawn from the lane alphabet would
// silently turn existing lanes into options: no error, a different figure.
// The constraint is normative (core §10 genre namespace, genres/experimental/timing.md);
// this is the guard that makes a future registration fail loudly here rather
// than corrupt lanes quietly.
function assertLaneKeyNamespace(engine) {
  const reserved = [];
  for (const k of engine.OPT_KEYS) if (k.length === 1 && engine.LANE_RE.test(k)) reserved.push(k);
  if (reserved.length) {
    console.error('OPTION-KEY NAMESPACE VIOLATION (LANE-ALPHABET-KEY-RESERVATION): ' +
      reserved.map(k => '"' + k + '="').join(', ') +
      ' collide with the timing lane alphabet [01pnx=.].');
    console.error('A single-letter option key spelled with a lane character makes every');
    console.error('existing `signal <name> <lane>` containing it parse as an option instead.');
    console.error('Pick a full-word spelling (spec/core.md §10, spec/genres/experimental/timing.md).');
    process.exit(1);
  }
}

// 0.1 — comment-scanner property test.
//
// `findComment` and `tokenize` each maintain their own idea of "inside a
// string", and they must never disagree: findComment runs FIRST and truncates
// the line, so if it thinks a `#` is outside a string when the tokenizer would
// have swallowed it, a legal document is destroyed before the tokenizer ever
// sees it. That is exactly the 0.1 defect (`title "a \" b # c"` was
// rejected as `unterminated string`), and it came from findComment toggling
// its in-quote flag on an ESCAPED quote.
//
// The property, over generated quoted values built from `#`, `\"`, `\\` and
// plain text: for every line, the prefix findComment keeps must never cut
// inside a region the tokenizer treats as a string. Checked by comparing the
// tokenization of the whole line with the tokenization of the kept prefix:
// if findComment cut inside a string, the prefix fails to tokenize (or the
// leading tokens change). Deterministic enumeration, no RNG — the suite must
// be reproducible.
function assertCommentScanner(engine) {
  const ATOMS = ['a', '#', '\\"', '\\\\', ' ', 'b#c', '\\\\#', '# ', ' # '];
  const bad = [];
  const check = (line) => {
    const hi = engine.findComment(line);
    const kept = hi >= 0 ? line.slice(0, hi) : line;
    const whole = engine.tokenize(line);
    if (whole.error) return;              // not a well-formed line; nothing to promise
    const pre = engine.tokenize(kept);
    if (pre.error) { bad.push(line + '  -> cut inside a string: ' + pre.error); return; }
    // The kept prefix must be a token-wise prefix of the whole line.
    for (let i = 0; i < pre.toks.length; i++) {
      if (i >= whole.toks.length || pre.toks[i].v !== whole.toks[i].v) {
        bad.push(line + '  -> token ' + i + ' changed: ' +
          JSON.stringify(pre.toks[i] && pre.toks[i].v) + ' vs ' +
          JSON.stringify(whole.toks[i] && whole.toks[i].v));
        return;
      }
    }
  };
  for (const a of ATOMS) for (const b of ATOMS) {
    check('title "' + a + b + '"');
    check('title "' + a + '" # ' + b);
    check('field x 8 note="' + a + b + '"');
    check('node id "' + a + '" fill=#0d9488');
    check('node id "' + a + b + '" # trailing ' + b);
  }
  if (bad.length) {
    console.error('COMMENT SCANNER PROPERTY FAILED: findComment and');
    console.error('tokenize disagree about where a string ends, on ' + bad.length + ' input(s):');
    for (const b of bad.slice(0, 10)) console.error('  ' + b);
    process.exit(1);
  }
}

// GROUP-BOUNDARY-OBSTACLE — a group boundary is crossed, not terminated on.
//
// THE REGRESSION THIS PINS. 0.4 made a `group`'s NAME an obstacle to
// the router, correctly (an element label is ink and a shaft must not read as
// striking through it) but without the exemption its sibling rule already had.
// A group's name strip runs the full width of the band's TOP, so it lies
// across every approach an outside node has to a member INSIDE the group:
// every boundary-crossing edge in the figure left its corridor, ran down the
// band's outer edge and entered the member from the side. The drawing then
// said the line arrives at the CONTAINER when the source says it arrives at
// the MEMBER. It shipped for nine engine versions and was found by a reader,
// not by this suite.
//
// WHY IT IS HERE AND NOT IN cases/. Three pins were available and two cannot
// see this defect. A MODEL golden reads the AST, which is byte-identical
// before and after the fix — a route is not in the model. A `.geometry.txt`
// golden records render()'s REFUSAL diagnostics, and this figure renders
// clean, so its golden would be absent and would pin nothing. The artifact
// corpus does carry the case now (`examples/pvlan-flows` edge 81), but
// `gate:artifact` compares an artifact against its SOURCE HASH and never
// re-renders, so a re-introduction would survive it. What is left is the
// mechanism this file already has: an in-process engine property test that
// RENDERS and asserts a drawn property. This is the third.
//
// THE PROPERTY. In a figure whose only obstacles are the group band and its
// name, an edge with one endpoint outside the group and one endpoint on a
// member inside it is drawn as a straight `<line>` to that member. Two
// controls travel with it so the fix cannot be over-applied: an edge wholly
// inside the group is also straight (it never met the strip), and an edge
// between two OUTSIDE nodes whose straight run would cross the name IS still
// detoured — that last one is the whole of what 0.4 was right about,
// and a fix that straightened it too would have put the strikethrough back.
function assertGroupCrossingEdge(engine) {
  const SRC = [
    'figdown 0.5 topology',
    'title "group-crossing edge"',
    'group pod "A group whose name strip spans the whole width of its band"',
    'node up "Up" ',
    'node west "West"',
    'node east "East"',
    'node lf "Leaf" in=pod',
    'node tor "ToR" in=pod',
    'flow down',
    'edge up -- lf',          // crosses the boundary: must stay straight
    'edge lf -- tor',         // wholly inside: must stay straight
    'edge west -- east',      // wholly outside, over the name: must detour
    'layout',
    'pin up at=(180,20) width=120 height=50',
    'pin west at=(20,150) width=90 height=50',
    'pin east at=(420,150) width=90 height=50',
    'pin pod at=(60,110)',
    'pin lf at=(60,60) width=120 height=50',
    'pin tor at=(60,180) width=120 height=50',
  ].join('\n');
  const { doc, errors } = engine.parse(SRC);
  const bad = [];
  if (errors && errors.length) {
    bad.push('the property figure no longer parses: ' + errors.join('; '));
  } else {
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    // `data-edge` carries the 1-based SOURCE LINE of the edge (CONNECTOR-IDENTITY-KEY).
    const kindOf = (line) => {
      const m = svg.match(new RegExp('<(line|path) data-edge="' + line + '"'));
      return m ? m[1] : null;
    };
    const want = [
      [10, 'line', 'up -- lf crosses the group boundary and must reach the MEMBER'],
      [11, 'line', 'lf -- tor is wholly inside the group and never met the name strip'],
      [12, 'path', 'west -- east is foreign to the group and must go round its name'],
    ];
    for (const [ln, kind, why] of want) {
      const got = kindOf(ln);
      if (got !== kind) bad.push('edge on line ' + ln + ': expected <' + kind +
        '>, got ' + (got ? '<' + got + '>' : 'no edge element') + ' — ' + why);
    }
  }
  if (bad.length) {
    console.error('GROUP-CROSSING EDGE PROPERTY FAILED (GROUP-BOUNDARY-OBSTACLE): a group');
    console.error('boundary is crossed, not terminated on — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

const normalize = require('./normalize.js');

const args = process.argv.slice(2);

// An unknown `--flag` is REFUSED, never ignored. Until 2026-08-24 this runner
// dropped anything it did not recognise, which is survivable for `--experimntal`
// (the run is visibly smaller) and dangerous for `--engine-cmd`: a caller who
// mistypes the flag that selects THEIR engine gets a green run of OURS and no
// hint that their program was never executed. A conformance runner that can
// report someone else's pass as your own is worse than one that refuses to
// start, so it refuses to start. Same axiom as the language: unknown input is
// an error, never silence (core §8).
const KNOWN_FLAGS = ['--update', '--experimental', '--help'];
const unknownFlags = args.filter(a => a.startsWith('--')
  && !KNOWN_FLAGS.includes(a) && !a.startsWith('--engine-cmd='));
if (unknownFlags.length) {
  console.error('unrecognized option(s): ' + unknownFlags.join(' '));
  console.error('usage: node conformance/run.js [--update] [--experimental]');
  console.error("       [--engine-cmd='<command>'] [name-filter]");
  console.error('');
  console.error('Refused rather than ignored: if this was a mistyped');
  console.error("--engine-cmd='…', running anyway would have tested the");
  console.error('reference engine and reported the result as yours.');
  process.exit(2);
}

const update = args.includes('--update');
const experimental = args.includes('--experimental');
const filter = args.filter(a => !a.startsWith('--'))[0] || null;

// Subprocess mode. The CLI form is PRIMARY (it makes the run reproducible from
// its own command line); the environment variable is the same switch for a
// caller who cannot edit the command, and the CLI wins when both are set. Only
// the `--engine-cmd=<command>` spelling is accepted — a space-separated form
// would be indistinguishable from the positional name-filter.
const cmdArg = args.find(a => a.startsWith('--engine-cmd='));
const ENGINE_CMD = (cmdArg ? cmdArg.slice('--engine-cmd='.length)
                           : (process.env.FIGDOWN_ENGINE_CMD || '')).trim() || null;
if (ENGINE_CMD && update) {
  console.error('--update is refused in subprocess mode: goldens are minted by the');
  console.error('reference engine and by nothing else. Re-run without --engine-cmd.');
  process.exit(2);
}
const { spawnSync } = require('child_process');

// One fixture through the external command. Returns exactly one of
// {model}, {errLines} or {fatal} — see conformance/README.md for the rules
// these three cases encode.
function runEngineCmd(srcBuf) {
  const r = spawnSync(ENGINE_CMD, {
    shell: true,
    input: srcBuf,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (r.error) return { fatal: 'engine command could not be run: ' + r.error.message };
  const stderr = r.stderr ? r.stderr.toString('utf8') : '';
  const tail = stderr.trim() ? '\n--- stderr\n' + stderr : '';
  if (r.signal) return { fatal: 'engine command killed by signal ' + r.signal + tail };
  const stdout = r.stdout ? r.stdout.toString('utf8') : '';
  if (r.status === 0) return { model: stdout };
  if (r.status === 1) {
    // One `Line N: <message>` per line. The final LF is required by the
    // contract but a missing one is tolerated here rather than turned into a
    // second, confusing failure mode; an EMPTY line is not tolerated, because
    // no diagnostic is empty and swallowing one would hide a truncated list.
    const lines = stdout.split('\n');
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (!lines.length) return { fatal: 'engine command exited 1 but named no error' + tail };
    const blank = lines.findIndex(l => l === '');
    if (blank >= 0) return { fatal: 'engine command emitted an empty error line at position ' + (blank + 1) + tail };
    return { errLines: lines };
  }
  return { fatal: 'engine command exited ' + r.status +
                  ' (0 = model on stdout, 1 = errors on stdout; anything else is a failure)' + tail };
}

// --- reason manifest (conformance/STATUS.txt) -----------------------------
// Line-oriented, `#` comments, `default normative` plus one record per
// EXPERIMENTAL fixture: `<case>  <reason>[,<reason>...]  <note>`. Since
// 0.1 the manifest does not decide any bucket — the directory does —
// so it is validated in both directions: every record must name a fixture in
// experimental/, and every fixture in experimental/ must carry a record.
const STATUS_FILE = path.join(__dirname, 'STATUS.txt');
const NORMATIVE_DIR   = path.join(__dirname, 'cases');
const EXPERIMENTAL_DIR = path.join(__dirname, 'experimental');

function loadStatus(expDir) {
  const tags = new Map();               // case base name -> [reason, ...]
  if (!fs.existsSync(STATUS_FILE)) {
    console.error('missing ' + STATUS_FILE + ' — the reason manifest is required');
    process.exit(1);
  }
  const lines = fs.readFileSync(STATUS_FILE, 'utf8').split('\n');
  const bad = [];
  let sawDefault = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const m = /^(\S+)(?:\s+(\S+))?/.exec(line);
    if (m[1] === 'default') {
      sawDefault = true;
      if (m[2] !== 'normative') bad.push('STATUS.txt line ' + (i + 1) + ': only `default normative` is supported');
      return;
    }
    const name = m[1];
    if (!m[2]) { bad.push('STATUS.txt line ' + (i + 1) + ': "' + name + '" has no reason field'); return; }
    if (!fs.existsSync(path.join(expDir, name + '.fd'))) {
      bad.push('STATUS.txt line ' + (i + 1) + ': no such fixture "' + name + '" in experimental/');
      return;
    }
    if (tags.has(name)) { bad.push('STATUS.txt line ' + (i + 1) + ': "' + name + '" listed twice'); return; }
    const reasons = m[2].split(',').filter(Boolean);
    for (const r of reasons) {
      if (!/^(genre|construct)=\S+$/.test(r)) bad.push('STATUS.txt line ' + (i + 1) + ': bad reason "' + r + '" (expected genre=<g> or construct=<k>)');
    }
    tags.set(name, reasons);
  });
  if (!sawDefault) bad.push('STATUS.txt: missing the `default normative` line');
  // The other direction: an experimental fixture with no recorded reason.
  for (const f of fs.readdirSync(expDir).filter(f => f.endsWith('.fd')).sort()) {
    const base = f.replace(/\.fd$/, '');
    if (!tags.has(base)) bad.push('STATUS.txt: experimental/' + f + ' has no record — every experimental fixture states why it is outside the surface');
  }
  if (bad.length) { bad.forEach(b => console.error(b)); process.exit(1); }
  return tags;
}

// The manifest is validated on every run, so a stale entry is caught even by
// an --experimental invocation.
const STATUS = loadStatus(EXPERIMENTAL_DIR);

// A default run executes both corpora; --experimental executes the
// experimental one alone. Each entry carries the directory it came from,
// which is the ONLY thing that decides its bucket.
const corpora = experimental
  ? [{ dir: EXPERIMENTAL_DIR, exp: true }]
  : [{ dir: NORMATIVE_DIR, exp: false }, { dir: EXPERIMENTAL_DIR, exp: true }];

let files = [];
for (const c of corpora) {
  for (const f of fs.readdirSync(c.dir).filter(f => f.endsWith('.fd')).sort()) {
    files.push({ dir: c.dir, exp: c.exp, file: f, base: f.replace(/\.fd$/, '') });
  }
}
if (filter) files = files.filter(f => f.file.includes(filter));
if (!files.length) { console.error('no cases match "' + (filter || '') + '"'); process.exit(1); }

const EXP = new Set(files.filter(f => f.exp).map(f => f.base));
const isExp = base => EXP.has(base);
const reasonOf = base => STATUS.get(base) || [];

// In subprocess mode the reference engine is never loaded — that is the whole
// point: the harness must run in a tree that has no figdown.html at all. The
// three property tests below take the reference engine's PRIVATE symbols
// (`OPT_KEYS`, `LANE_RE`, `findComment`, `tokenize`, `render`), so they are in-process
// only and their absence is stated in the summary, not hidden.
const engine = ENGINE_CMD ? null : loadEngine();
if (engine) {
  assertLaneKeyNamespace(engine);
  assertCommentScanner(engine);
  assertGroupCrossingEdge(engine);
}
let geometrySkipped = 0;
const tally = {
  normative:    { pass: 0, fail: 0, total: 0 },
  experimental: { pass: 0, fail: 0, total: 0 },
};
let updated = 0;
const failures = [];

function report(name, ok, why) {
  const t = tally[isExp(name) ? 'experimental' : 'normative'];
  const tag = isExp(name) ? '  [experimental: ' + reasonOf(name).join(',') + ']' : '';
  if (ok) { t.pass++; console.log('PASS  ' + name + tag); }
  else { t.fail++; failures.push({ name, why }); console.log('FAIL  ' + name + tag + '  — ' + why.split('\n')[0]); }
}

for (const f of files) {
  tally[f.exp ? 'experimental' : 'normative'].total++;
}

for (const entry of files) {
  const { dir: CASES, base } = entry;
  const srcBuf = fs.readFileSync(path.join(CASES, entry.file));
  const src = srcBuf.toString('utf8');
  const errPath = path.join(CASES, base + '.errors.txt');
  const modelPath = path.join(CASES, base + '.model.json');
  const geoPath = path.join(CASES, base + '.geometry.txt');

  // --- the implementation's verdict, from whichever path is in use --------
  // Exactly one of the two is non-null afterwards: `errs` when the document
  // is REFUSED, `modelBytes` when it is ACCEPTED. Everything below compares
  // the same two things against the same two goldens, whichever path
  // produced them — which is what makes the subprocess run evidence.
  let errs = null;         // ['Line N: message', ...], any order
  let modelBytes = null;   // canonical §12.5 serialization, bytes as compared
  if (ENGINE_CMD) {
    const r = runEngineCmd(srcBuf);
    if (r.fatal) { report(base, false, r.fatal); continue; }
    if (r.errLines) errs = r.errLines; else modelBytes = r.model;
  } else {
    let parsed;
    try { parsed = engine.parse(src); }
    catch (e) { report(base, false, 'parse threw: ' + e.message); continue; }
    const { doc } = parsed;
    const docs = parsed.docs && parsed.docs.length ? parsed.docs : (doc ? [doc] : []);
    if (parsed.errs.length) errs = parsed.errs;
    else {
      // Multi-section (MULTI-FIGURE-DOCUMENTS): { "sections": [ model, ... ] } (core §12.5);
      // single-section stays flat.
      try {
        modelBytes = docs.length > 1
          ? JSON.stringify({ sections: docs.map(d => normalize(d)) }, null, 2) + '\n'
          : JSON.stringify(normalize(doc), null, 2) + '\n';
      } catch (e) { report(base, false, 'normalize threw: ' + e.message); continue; }
    }
  }

  if (errs) {
    const actual = errs.slice().sort().join('\n') + '\n';
    if (update) {
      fs.writeFileSync(errPath, actual);
      if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
      updated++; console.log('UPDT  ' + base + '  (' + errs.length + ' error line' + (errs.length > 1 ? 's' : '') + ')');
      continue;
    }
    if (fs.existsSync(modelPath)) { report(base, false, 'stale golden: case now errors but ' + base + '.model.json exists'); continue; }
    if (!fs.existsSync(errPath)) { report(base, false, 'missing golden ' + base + '.errors.txt — actual errors:\n' + actual); continue; }
    const expected = fs.readFileSync(errPath, 'utf8');
    if (expected !== actual) { report(base, false, 'error mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
    report(base, true);
    continue;
  }

  // valid case: canonical model golden
  const actual = modelBytes;

  // RENDERER-CLASS CHECKS — in-process only (core §0.2: the subprocess
  // contract covers the Parser class). Both need render(), which is not on
  // the contract's surface; a subprocess run counts the geometry goldens it
  // did not check and prints the number rather than absorbing the gap.
  if (ENGINE_CMD) {
    if (fs.existsSync(geoPath)) geometrySkipped++;
  } else {
    // determinism self-check (spec section 3, renderer tier): parse+render
    // twice, byte-compare. Runs in --update mode too — a non-deterministic
    // engine must never mint goldens.
    try {
      const renderParsed = (p) => {
        const ds = p.docs && p.docs.length ? p.docs : [p.doc];
        if (ds.length > 1) return engine.stackSectionSvgs(ds.map(d => engine.render(d)));
        return engine.render(ds[0]).svg;
      };
      const svg1 = renderParsed(engine.parse(src));
      const svg2 = renderParsed(engine.parse(src));
      if (svg1 !== svg2) { report(base, false, 'determinism self-check: two renders of the same source differ'); continue; }
    } catch (e) { report(base, false, 'render threw: ' + e.message); continue; }

    // GEOMETRY-TIME DIAGNOSTICS. A figure whose SOURCE is
    // impeccable can still draw a false statement — a group band that encloses a
    // non-member, a pin that covers a node completely — and the engine reports
    // those from `render`, not from `parse`. Until now nothing in this corpus
    // could express one: the runner rendered only to compare two byte streams and
    // threw the diagnostics away, so the whole channel `tools/build-svg.js` gates
    // artifacts on was untested. A case that renders with diagnostics is pinned by
    // NNN-name.geometry.txt, exactly as a parse error is pinned by
    // NNN-name.errors.txt; a case that renders clean must have no such golden.
    let gerrs;
    try {
      const p2 = engine.parse(src);
      const ds = p2.docs && p2.docs.length ? p2.docs : [p2.doc];
      gerrs = ds.reduce((a, d) => a.concat(engine.render(d).errs || []), []);
    } catch (e) { report(base, false, 'render threw: ' + e.message); continue; }
    const gActual = gerrs.length ? gerrs.slice().sort().join('\n') + '\n' : '';
    if (update) {
      if (gerrs.length) { fs.writeFileSync(geoPath, gActual); updated++; console.log('UPDT  ' + base + '  (' + gerrs.length + ' geometry diagnostic' + (gerrs.length > 1 ? 's' : '') + ')'); }
      else if (fs.existsSync(geoPath)) fs.unlinkSync(geoPath);
    } else if (gerrs.length) {
      if (!fs.existsSync(geoPath)) { report(base, false, 'missing golden ' + base + '.geometry.txt — actual geometry diagnostics:\n' + gActual); continue; }
      const gExpected = fs.readFileSync(geoPath, 'utf8');
      if (gExpected !== gActual) { report(base, false, 'geometry mismatch\n--- expected\n' + gExpected + '--- actual\n' + gActual); continue; }
    } else if (fs.existsSync(geoPath)) {
      report(base, false, 'stale golden: case now renders clean but ' + base + '.geometry.txt exists'); continue;
    }
  }

  if (update) {
    fs.writeFileSync(modelPath, actual);
    if (fs.existsSync(errPath)) fs.unlinkSync(errPath);
    updated++; console.log('UPDT  ' + base + '  (model)');
    continue;
  }
  if (fs.existsSync(errPath)) { report(base, false, 'stale golden: case now parses clean but ' + base + '.errors.txt exists'); continue; }
  if (!fs.existsSync(modelPath)) { report(base, false, 'missing golden ' + base + '.model.json'); continue; }
  const expected = fs.readFileSync(modelPath, 'utf8');
  if (expected !== actual) { report(base, false, 'model mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
  report(base, true);
}

const N = tally.normative, X = tally.experimental;
const fail = N.fail + X.fail;

console.log('');
// Printed ONLY in subprocess mode, so the default run's output — which
// tools/make-proof.js parses — is byte-for-byte what it always was.
if (ENGINE_CMD) {
  console.log('HARNESS  subprocess  [' + ENGINE_CMD + ']');
  console.log('PARSER-CLASS RUN (core §0.2). Model goldens and error goldens were');
  console.log('compared against the external command\'s stdout, by the same code and');
  console.log('against the same files the in-process path uses. Renderer-class checks');
  console.log('were NOT run: ' + geometrySkipped + ' geometry golden(s) unchecked, no determinism');
  console.log('self-check, and the three reference-engine property tests skipped — all');
  console.log('three need in-process access to the engine. Contract: conformance/README.md.');
  console.log('');
}
if (update) {
  console.log(updated + ' golden(s) written, ' + fail + ' failure(s)');
} else if (experimental) {
  console.log('CORPUS  conformance/experimental/' + (filter ? '  (filter: ' + filter + ')' : ''));
  console.log('EXPERIMENTAL — outside the v0.1 conformance surface. A conforming');
  console.log('implementation MAY skip every case here. Never counted in the');
  console.log('normative total; run `node conformance/run.js` for that number.');
  console.log('  ' + X.pass + ' passed, ' + X.fail + ' failed, ' + X.total + ' total');
} else {
  // breakdown over the cases actually run, so a filtered run does not
  // quote whole-manifest figures next to a partial total.
  const byReason = { genre: 0, construct: 0, both: 0 };
  for (const f of files) {
    const rs = STATUS.get(f.base);
    if (!rs) continue;
    const g = rs.some(r => r.startsWith('genre=')), c = rs.some(r => r.startsWith('construct='));
    if (g && c) byReason.both++; else if (g) byReason.genre++; else if (c) byReason.construct++;
  }
  console.log('CORPORA  conformance/cases/ + conformance/experimental/' +
              (filter ? '  (filter: ' + filter + ')' : ''));
  console.log('');
  console.log('NORMATIVE — conformance/cases/, the v0.1 conformance surface. THIS');
  console.log('is "the conformance suite" and the only number that may be quoted');
  console.log('as one.');
  console.log('  ' + N.pass + ' passed, ' + N.fail + ' failed, ' + N.total + ' total');
  console.log('');
  console.log('EXPERIMENTAL — conformance/experimental/. Run above and required to');
  console.log('pass, because they pin reference-engine behaviour, but their SUBJECT');
  console.log('is outside the surface (CONSTRUCT-STATUS-TIERS: experimental genres, demoted constructs,');
  console.log('`chart`), so they are NOT part of the total above. A second');
  console.log('implementation may skip the whole directory and still conform; the');
  console.log('reason for each is recorded in conformance/STATUS.txt.');
  console.log('  ' + X.pass + ' passed, ' + X.fail + ' failed, ' + X.total + ' total' +
              '   (' + (byReason.genre + byReason.both) + ' by genre, ' +
              (byReason.construct + byReason.both) + ' by demoted construct, ' +
              byReason.both + ' both)');
  console.log('');
  console.log('Run `node conformance/run.js --experimental` for that corpus alone.');
  console.log('');
  console.log('TOTAL RUN  ' + (N.pass + X.pass) + ' passed, ' + fail + ' failed, ' +
              (N.total + X.total) + ' total  (exit 1 on any failure, either bucket)');
}
for (const f of failures) {
  console.log('\n=== FAIL ' + f.name + '\n' + f.why);
}
process.exit(fail ? 1 : 0);
