#!/usr/bin/env node
// boundary-check.js — render-side check for boundary placement in pinned scenes.
// Loads the FigDown engine the same way build-svg.js / layout-lint.js do, renders
// each .fd in memory, and — for scenes that declare `external` endpoints and are
// substantially pinned — asserts the two properties the auto-placement fix must
// hold (see the external-pinned-layout conformance case):
//
// The DIRECTIVE is spelled `external` (it was `boundary` until 0.1,
// PRESENCE-FLAG-SPELLING); the engine's own model still calls the collection `doc.boundaries` and
// flags each anchor `n.boundary`, so those spellings below are engine internals
// read as-is, not the language.
//
//   1. adjacency  — every degree-1 boundary anchor sits just outside its
//                   connected node's border (within ADJ px of the border) on the
//                   flow side, so it never drifts to a far auto-layout rank;
//   2. canvas fit — the scene canvas width does not exceed the real node/group
//                   union width by more than 1.25x (a lone boundary must not blow
//                   the canvas out).
//
// Unpinned scenes keep auto-layout and are reported but not asserted.
//
// usage: node tools/boundary-check.js [--strict] [--verbose] [<file.fd|dir> ...]
// Default roots: examples/, conformance/cases/ — WALKED RECURSIVELY.
//
// Until 0.3 those two roots were read NON-recursively by a private `collectFd`
// — the same copied line three sibling gates carried. It opened 212 files and
// printed TWO rows, and every one of the other 210 left no trace: a scene was
// dropped on a bare `continue` whether it had no boundary, no pins, or could
// not be parsed at all. When no row survived, the whole output was the single
// line `(no pinned boundary scenes found)`, which is what a correct run and a
// completely broken run both printed.
//
// Enumeration, the skip taxonomy and the coverage line now come from
// `tools/lib/corpus.js`.
// Deterministic; engine lookup order matches build-svg.js.
'use strict';

const fs   = require('fs');
const path = require('path');
const corpus = require('./lib/corpus.js');

// ── Engine lookup (same order as build-svg.js) ────────────────────────────────
const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean);

function findEngine() {
  return ENGINE_CANDIDATES.find(p => fs.existsSync(p)) || null;
}

// The engine is instrumented at its existing structural anchor: the
// `let W=0,Hh=0;` line in renderScene runs after pins and boundary adjacency
// are resolved, so `nodes` there carry final geometry (boundaries included).
// A probe hook publishes that array without changing any rendered output.
function loadEngine(enginePath) {
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0)
    throw new Error('Cannot locate engine boundaries in ' + enginePath);
  const ANCHOR = 'let W=0,Hh=0;';
  let body = h.slice(start, end);
  if (body.indexOf(ANCHOR) < 0)
    throw new Error('Cannot locate probe anchor in ' + enginePath);
  body = body.replace(ANCHOR, ANCHOR +
    '\n  if(globalThis.__boundaryProbe)globalThis.__boundaryProbe(' +
    'nodes.map(n=>({id:n.id,boundary:!!n.boundary,group:n.group,' +
    'x:n.x,y:n.y,w:n.w,h:n.h})));');
  // eslint-disable-next-line no-new-func
  const factory = new Function(body + '\nreturn {parse, render};');
  return factory();
}

// ── check ─────────────────────────────────────────────────────────────────────
const ADJ = 44;          // max border-to-anchor gap (fix uses 30; margin for label/anchor)
const FIT = 1.25;        // canvas width / content union width ceiling (acceptance A)

// smallest gap between a boundary anchor and any real node's rectangle
function anchorGap(b, reals) {
  let best = Infinity;
  const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
  for (const n of reals) {
    // clamp anchor centre to the node rect, measure remaining distance
    const dx = Math.max(n.x - bcx, 0, bcx - (n.x + n.w));
    const dy = Math.max(n.y - bcy, 0, bcy - (n.y + n.h));
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

function checkOne(engine, fdPath) {
  const src = fs.readFileSync(fdPath, 'utf8');
  const { doc, errs } = engine.parse(src);
  if (errs.length) return { fd: fdPath, skip: 'parse-error', detail: errs[0] };
  if (!(doc.boundaries || []).length) return { fd: fdPath, skip: 'no-boundary' };

  let probed = null;
  globalThis.__boundaryProbe = (arr) => { probed = arr; };
  try { engine.render(doc, {}); }
  finally { globalThis.__boundaryProbe = null; }
  if (!probed) return { fd: fdPath, skip: 'no-scene' };

  const reals = probed.filter(n => !n.boundary);
  const bnds  = probed.filter(n => n.boundary);
  // "Pinned" means POSITIONED. Since ELEMENT-GEOMETRY-DIRECTIVE a `pin` line may carry
  // width=/height= and no at= at all, so the mere presence of an entry in
  // doc.pins no longer says the node has a place — counting those would call an
  // auto-laid-out scene pinned and assert adjacency the renderer never promised.
  // Same test the engine's own layout uses: an entry AND a non-null fx.
  const pinnedReal = reals.filter(n => doc.pins[n.id] && doc.pins[n.id].fx !== null).length;
  const scenePinned = reals.length > 0 && pinnedReal >= Math.ceil(reals.length / 2);
  if (!scenePinned) return { fd: fdPath, skip: 'unpinned' };

  // content union width of real nodes + group boxes (groups extend ~14 px each side)
  let x0 = Infinity, x1 = -Infinity;
  for (const n of reals) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x + n.w); }
  const gpad = 14;
  for (const g of doc.groups) {
    const mem = reals.filter(n => n.group === g.id);
    if (!mem.length) continue;
    x0 = Math.min(x0, Math.min(...mem.map(n => n.x)) - gpad);
    x1 = Math.max(x1, Math.max(...mem.map(n => n.x + n.w)) + gpad);
  }
  const contentW = x1 - x0;

  // adjacency: each boundary within ADJ px of some real node's border
  const fails = [];
  let maxGap = 0;
  for (const b of bnds) {
    const g = anchorGap(b, reals);
    maxGap = Math.max(maxGap, g);
    if (g > ADJ) fails.push('boundary "' + b.id + '" is ' + g.toFixed(1) +
      ' px from the nearest node (> ' + ADJ + ' px) — not placed adjacent');
  }

  // canvas fit: the scene width may exceed the real content union only by the
  // room an adjacent boundary legitimately needs — its gap + anchor + longest
  // label — never by a far auto-layout rank. A pure ratio ceiling is too tight
  // on a narrow (e.g. single-column) scene where that fixed offset is a large
  // fraction of the content, so the overrun is bounded by whichever is more
  // permissive: FIT x the union, or an absolute per-boundary margin.
  const sceneW = engine.render(doc, {}).sceneMeta.W;
  const ratio = contentW > 0 ? sceneW / contentW : 1;
  const longestLbl = Math.max(0, ...bnds.map(b => (b.id ? b.id.length : 0) * 7));
  const margin = ADJ + 12 + Math.max(60, longestLbl);   // gap + anchor + label room
  const allow = Math.max(contentW * FIT, contentW + 2 * margin);
  if (sceneW > allow) fails.push('canvas width ' + sceneW.toFixed(1) +
    ' exceeds content union ' + contentW.toFixed(1) + ' by ' +
    (sceneW - contentW).toFixed(1) + ' px (> ' + (allow - contentW).toFixed(1) +
    ' px allowance) — boundary placed at a far rank');

  return { fd: fdPath, contentW, sceneW, ratio, maxGap, fails };
}

// ── file collection ───────────────────────────────────────────────────────────
// Enumeration lives in tools/lib/corpus.js.

// Skip reasons this gate adds. None fails --strict: each is a correct ANSWER
// about a figure this check has no claim to make about, not a failure to read
// it. All are counted and named on every run, which is the difference that
// matters — the old code expressed all three as the same bare `continue`.
const EXTRA_REASONS = [
  ['no-boundary', 'scene declares no `external` endpoint — nothing to place', false],
  ['no-scene',    'document renders no scene (bitfield/table/timing)',        false],
  ['unpinned',    'scene is auto-laid-out, so adjacency is not promised',     false],
];

const pad  = corpus.pad;
const lpad = corpus.lpad;

function main() {
  const args = process.argv.slice(2);
  let strict = false, verbose = false;
  const paths = [];
  for (const a of args) {
    if (a === '--strict')  strict  = true;
    else if (a === '--verbose') verbose = true;
    else paths.push(a);
  }

  // The gate's DECLARED scope, walked recursively.
  const en = corpus.enumerate(['examples', 'conformance/cases'], paths);
  corpus.assertNonEmpty(en, 'boundary-check');
  const cov = new corpus.Coverage('boundary-check', en, EXTRA_REASONS);

  const enginePath = findEngine();
  if (!enginePath) { console.error('figdown.html not found'); process.exit(2); }
  const engine = loadEngine(enginePath);

  const files = en.files;
  cov.header();

  const rows = [];
  let anyFail = false;
  for (const f of files) {
    let r;
    try { r = checkOne(engine, f); }
    catch (e) { r = { fd: f, skip: 'render-error', detail: e.message }; }
    if (r.skip) {
      // A conformance fixture paired with `.errors.txt` is MEANT not to parse.
      const reason = (r.skip === 'parse-error' && en.invalidByDesign.has(f))
        ? 'invalid-by-design' : r.skip;
      cov.skip(f, reason, r.detail);
      continue;
    }
    cov.score();
    rows.push(r);
    if (r.fails.length) anyFail = true;
  }

  console.log(pad('figure', 46) + lpad('content', 9) + lpad('canvas', 9) +
    lpad('ratio', 8) + lpad('maxGap', 9) + '  result');
  for (const r of rows) {
    const res = r.fails.length ? 'FAIL' : 'ok';
    console.log(pad(corpus.rel(r.fd), 46) + lpad(r.contentW.toFixed(0), 9) +
      lpad(r.sceneW.toFixed(0), 9) + lpad(r.ratio.toFixed(2) + 'x', 8) +
      lpad(r.maxGap.toFixed(1), 9) + '  ' + res);
    for (const m of r.fails) console.log('    - ' + m);
  }

  // ── COVERAGE. Printed on EVERY run, every reason, zero or not. ────────────
  const covResult = cov.report({ verbose });

  if (covResult.unread) {
    console.log('');
    console.log((strict ? 'FAIL' : 'WARN') + '  ' + covResult.unread
              + ' figure(s) were considered and NOT scored for a reason that means'
              + ' the tool could not read them.');
    if (!strict) console.log('      (run with --strict to make this an exit-1 failure)');
  }
  if (covResult.broken) process.exit(2);

  process.exit(strict && (anyFail || covResult.unread) ? 1 : 0);
}

main();
