#!/usr/bin/env node
'use strict';
// dist-check.js — the gate `dist/` never had.
//
//   node tools/dist-check.js [--strict]
//
// WHY THIS FILE EXISTS
//
// The engine lives in FOUR copies: `editor/figdown.html` (the only
// hand-edited one), `skill/figdown/figdown.html`, and the two `dist/` builds.
// Three of the four were gated — `editor-check.js` covers the editor,
// `skill-coverage.js` covers the skill bundle, `artifact-check.js` covers the
// SVGs — and `dist/` was covered by NOTHING. `conformance/run.js` loads the
// engine from `conformance/figdown.html` or `../editor/figdown.html` and never
// looks at `dist/`, and `grep -c make-lib package.json` returned 0.
//
// `dist/` is also the copy a USER installs: it is `package.json`'s `main` and
// `module`, it is what `require('figdown')` returns, and both `integrations/`
// projects go through it. So the one copy with no gate was the one copy with
// consumers.
//
// The failure that bought this gate: the PUBLISHED tarball
// carried a `dist/figdown.js` built from an OLDER engine. It rejected
// `index=` — a FROZEN key — with `unknown option "index="`; measured against
// the current engine it diverged on 23 of 205 fixtures (12 on the normative
// surface) and refused 3 of 65 published `.fd` outright, `examples/srh.fd`
// among them, returning `null` from `render()`. Nothing in the repository
// could see it, because nothing in the repository read `dist/` at all. That
// was the SEVENTH occurrence of four-copy drift, and the first in the copy
// that ships.
//
// WHAT IT CHECKS  (all four are cheap; none needs the network)
//
//   A. REGENERATION IS A NO-OP. Re-run tools/make-lib.js into a temp dir and
//      byte-compare against the committed `dist/`. make-lib is deterministic
//      (same engine source -> byte-identical output), so any difference means
//      `dist/` is stale. This is the check that would have caught the failure.
//   B. THE VERSION AGREES. Both builds must report the engine's own
//      FIGDOWN_VERSION. `make-lib.js` reads the version out of the extracted
//      engine region precisely so there is no fifth copy to keep in step;
//      this asserts that the reading actually happened for these bytes.
//   C. THE BUILDS LOAD AND WORK. `require()` the UMD build and import the
//      ESM build, and run a document through each: parse+render must succeed
//      and the two builds must agree byte-for-byte on the SVG. A build that
//      is byte-current but throws on import is still a broken publish.
//   D. THE FROZEN SURFACE PARSES *AND RENDERS THE SAME*. Every `.fd` under
//      `examples/` and `figures/` that the reference engine accepts must ALSO
//      be accepted by the `dist/` build, with the same error set. This is the
//      check stated in the shape the published defect actually took: a user's
//      copy rejecting a shipped example.
//
//      BOTH ERROR CHANNELS ARE COMPARED, not just the parse one. Until
//      0.4 this check read `parse` alone, and the geometry channel —
//      the diagnostics only `render` can raise, which core §8 says a caller
//      MUST treat exactly as parse errors — was compared by nothing. That is
//      how `make-lib.js` came to build a `render` wrapper returning
//      `errors: []` next to an SVG of a figure the engine had just refused:
//      every fixture in scope parsed clean, so a parse-only comparison saw
//      two identical empty lists and agreed. `conformance/cases/`'s
//      geometry fixture is added to the corpus below for exactly this reason
//      — a fixture whose whole subject is a non-empty render diagnostic, so
//      the regression cannot silently return.
//
// `--strict` is accepted for symmetry with the other gates; every finding
// here is already fatal, so it changes nothing.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ENGINE_HTML = path.join(ROOT, 'editor', 'figdown.html');
const BUILDS = ['figdown.js', 'figdown.mjs'];

let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL  ' + msg); };
const ok = (msg) => console.log('  ok  ' + msg);

console.log('dist-check  engine=' + path.relative(ROOT, ENGINE_HTML));

// ── A. regeneration is a no-op ───────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'figdown-dist-'));
try {
  // make-lib.js writes to <repo>/dist unconditionally, so it is run against a
  // throwaway ROOT: a temp tree carrying only editor/figdown.html and the
  // tool. Copying (rather than teaching make-lib an output flag) keeps the
  // gate from changing the thing it is checking.
  fs.mkdirSync(path.join(tmp, 'editor'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'tools'), { recursive: true });
  fs.copyFileSync(ENGINE_HTML, path.join(tmp, 'editor', 'figdown.html'));
  fs.copyFileSync(path.join(__dirname, 'make-lib.js'), path.join(tmp, 'tools', 'make-lib.js'));
  execFileSync(process.execPath, [path.join(tmp, 'tools', 'make-lib.js')], { stdio: 'pipe' });

  for (const name of BUILDS) {
    const committed = path.join(DIST, name);
    const rebuilt = path.join(tmp, 'dist', name);
    if (!fs.existsSync(committed)) { fail('dist/' + name + ' is missing'); continue; }
    const a = fs.readFileSync(committed), b = fs.readFileSync(rebuilt);
    if (a.equals(b)) ok('dist/' + name + ' matches a fresh build of editor/figdown.html');
    else fail('dist/' + name + ' is STALE — regenerate with `node tools/make-lib.js` '
      + '(' + a.length + ' bytes committed vs ' + b.length + ' rebuilt)');
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ── B. the version agrees with the engine ────────────────────────────────────
const mVer = /^const FIGDOWN_VERSION = '([^']+)';$/m.exec(fs.readFileSync(ENGINE_HTML, 'utf8'));
if (!mVer) { console.error('cannot locate FIGDOWN_VERSION in ' + ENGINE_HTML); process.exit(2); }
const VERSION = mVer[1];

// ── C. the builds load, run, and agree ───────────────────────────────────────
const SAMPLE = [
  'figdown 0.1 bitfield',
  'title "dist-check"',
  'bitfield h "Header" word=32 numbering=msb0',
  'field "Type" 8',
  'field "Segment" 32 index=0..7',      // the FROZEN key the stale publish rejected
  ''
].join('\n');

const svgs = {};
async function checkBuilds() {
  for (const name of BUILDS) {
    const p = path.join(DIST, name);
    if (!fs.existsSync(p)) continue;
    let lib;
    try {
      lib = name.endsWith('.mjs')
        ? await import('file://' + p)
        : require(p);
    } catch (e) { fail('dist/' + name + ' does not load: ' + e.message); continue; }

    for (const fn of ['parse', 'render', 'artifact', 'renderDoc']) {
      if (typeof lib[fn] !== 'function') fail('dist/' + name + ' exports no ' + fn + '()');
    }
    if (lib.version !== VERSION)
      fail('dist/' + name + ' reports version ' + JSON.stringify(lib.version)
        + ', engine is ' + JSON.stringify(VERSION));
    else ok('dist/' + name + ' reports ' + VERSION);

    const r = lib.render(SAMPLE);
    if (r.errors.length) fail('dist/' + name + ' rejects the sample: ' + r.errors.join(' | '));
    else if (!r.svg) fail('dist/' + name + ' returned a null svg with no errors');
    else { svgs[name] = r.svg; ok('dist/' + name + ' renders the sample (' + r.svg.length + ' bytes)'); }
  }
  const [a, b] = BUILDS;
  if (svgs[a] && svgs[b] && svgs[a] !== svgs[b])
    fail('the two dist builds disagree on the same source — ESM and UMD wrap ONE body, so this is impossible unless one is stale');
  else if (svgs[a] && svgs[b]) ok('both builds produce identical SVG for the same source');
}

// ── D. the published corpus parses through dist/ ─────────────────────────────
function walkFd(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFd(p, out);
    else if (e.name.endsWith('.fd')) out.push(p);
  }
  return out;
}

function loadReferenceEngine() {
  const h = fs.readFileSync(ENGINE_HTML, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE_HTML);
  return new Function(h.slice(start, end) + '\nreturn {parse, render, stackSectionSvgs};')();
}

// The reference engine's GEOMETRY channel for one source, in the shape
// `dist`'s `render()` reports it: parse errors first (they pre-empt geometry —
// nothing is rendered), otherwise every section's render diagnostics.
function referenceErrors(ref, src) {
  const p = ref.parse(src);
  if (p.errs.length) return p.errs.slice().sort();
  const docs = p.docs && p.docs.length ? p.docs : (p.doc ? [p.doc] : []);
  return docs.reduce((a, d) => a.concat(ref.render(d).errs || []), []).sort();
}

function checkCorpus() {
  const distPath = path.join(DIST, 'figdown.js');
  if (!fs.existsSync(distPath)) return;
  const lib = require(distPath);
  const ref = loadReferenceEngine();
  // The published corpus, PLUS the conformance fixtures whose subject is a
  // geometry-time diagnostic. `examples/` and `figures/` are all figures that
  // are meant to render clean, so on their own they can only ever compare two
  // empty geometry lists — which is precisely how the discarded channel stayed
  // invisible. A fixture that MUST report is named here so the comparison has
  // something to be wrong about.
  const GEOMETRY_FIXTURES = [
    path.join(ROOT, 'conformance', 'cases', '369-pin-complete-cover-refused.fd'),
  ];
  for (const f of GEOMETRY_FIXTURES) {
    if (!fs.existsSync(f)) fail('missing geometry fixture ' + path.relative(ROOT, f)
      + ' — it pins the render/geometry channel through dist/; do not delete it without a replacement');
  }
  const files = [].concat(walkFd(path.join(ROOT, 'examples'), []),
                          walkFd(path.join(ROOT, 'figures'), [])).sort()
                  .concat(GEOMETRY_FIXTURES.filter(f => fs.existsSync(f)));
  let diverged = 0, geometryPinned = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    // PARSE CHANNEL
    const wantP = ref.parse(src).errs.slice().sort();
    const gotP = lib.parse(src).errors.slice().sort();
    if (JSON.stringify(wantP) !== JSON.stringify(gotP)) {
      diverged++;
      fail(path.relative(ROOT, f) + ' — dist/ and the reference engine disagree on the PARSE channel\n'
        + '        reference: ' + JSON.stringify(wantP) + '\n'
        + '        dist:      ' + JSON.stringify(gotP));
      continue;
    }
    // RENDER / GEOMETRY CHANNEL (core §8: a caller must treat it as it treats
    // a parse error, so `render()` must SURFACE it, not swallow it).
    const wantR = referenceErrors(ref, src);
    const r = lib.render(src);
    const gotR = (r.errors || []).slice().sort();
    if (JSON.stringify(wantR) !== JSON.stringify(gotR)) {
      diverged++;
      fail(path.relative(ROOT, f) + ' — dist/ and the reference engine disagree on the RENDER/GEOMETRY channel\n'
        + '        reference: ' + JSON.stringify(wantR) + '\n'
        + '        dist:      ' + JSON.stringify(gotR));
      continue;
    }
    if (wantR.length) {
      geometryPinned++;
      // The contract build-svg.js establishes and core §8 states: a non-empty
      // render diagnostic list withholds the artifact. A build that reports
      // the diagnostics and hands back the picture anyway has not refused.
      if (r.svg !== null)
        { diverged++; fail(path.relative(ROOT, f) + ' — dist/ render() reported ' + wantR.length
          + ' geometry diagnostic(s) and STILL returned an svg; core §8 says nothing is drawn'); }
      const art = lib.artifact(src);
      if (art.svg !== null || !art.errors.length)
        { diverged++; fail(path.relative(ROOT, f) + ' — dist/ artifact() did not refuse a figure with '
          + 'geometry diagnostics (svg must be null, errors non-empty)'); }
    }
  }
  if (!diverged) ok(files.length + ' published .fd: dist/ and the reference engine agree on every '
    + 'error set, parse AND geometry (' + geometryPinned + ' with a non-empty geometry channel, refused by both)');
}

checkBuilds().then(() => {
  checkCorpus();
  console.log('');
  if (failures) {
    console.log('dist-check: ' + failures + ' failure(s)');
    process.exit(1);
  }
  console.log('OK  dist/ is a current, working build of editor/figdown.html');
}).catch(e => { console.error(e); process.exit(2); });
