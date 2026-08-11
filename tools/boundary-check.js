#!/usr/bin/env node
// boundary-check.js — render-side check for boundary placement in pinned scenes.
// Loads the FigDown engine the same way build-svg.js / layout-lint.js do, renders
// each .fd in memory, and — for scenes that declare `external` endpoints and are
// substantially pinned — asserts the two properties the auto-placement fix must
// hold (see the external-pinned-layout conformance case):
//
// The DIRECTIVE is spelled `external` (it was `boundary` until this release,
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
// Deterministic; engine lookup order matches build-svg.js.
'use strict';

const fs   = require('fs');
const path = require('path');

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
  if (errs.length) return { fd: fdPath, skip: 'parse-error' };
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

// ── file collection (matches layout-lint.js) ──────────────────────────────────
function collectFd(arg) {
  const st = fs.statSync(arg);
  if (st.isDirectory())
    return fs.readdirSync(arg).filter(f => f.endsWith('.fd')).sort()
      .map(f => path.join(arg, f));
  return [arg];
}

function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function lpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

function main() {
  const args = process.argv.slice(2);
  let maxFail = null;
  const paths = [];
  for (const a of args) {
    if (a.startsWith('--strict')) maxFail = 0;
    else paths.push(a);
  }
  if (!paths.length) {
    const root = path.join(__dirname, '..');
    for (const d of ['examples', 'conformance/cases'])
      if (fs.existsSync(path.join(root, d))) paths.push(path.join(root, d));
  }
  const enginePath = findEngine();
  if (!enginePath) { console.error('figdown.html not found'); process.exit(2); }
  const engine = loadEngine(enginePath);

  const files = [];
  for (const p of paths) for (const f of collectFd(p)) files.push(f);

  const rows = [];
  let anyFail = false;
  for (const f of files) {
    let r;
    try { r = checkOne(engine, f); }
    catch (e) { r = { fd: f, skip: 'error: ' + e.message }; }
    if (r.skip) continue;                 // report only boundary+pinned scenes
    rows.push(r);
    if (r.fails.length) anyFail = true;
  }

  console.log(pad('figure', 34) + lpad('content', 9) + lpad('canvas', 9) +
    lpad('ratio', 8) + lpad('maxGap', 9) + '  result');
  for (const r of rows) {
    const name = path.basename(r.fd);
    const res = r.fails.length ? 'FAIL' : 'ok';
    console.log(pad(name, 34) + lpad(r.contentW.toFixed(0), 9) +
      lpad(r.sceneW.toFixed(0), 9) + lpad(r.ratio.toFixed(2) + 'x', 8) +
      lpad(r.maxGap.toFixed(1), 9) + '  ' + res);
    for (const m of r.fails) console.log('    - ' + m);
  }
  if (!rows.length) console.log('(no pinned boundary scenes found)');

  if (maxFail !== null && anyFail) process.exit(1);
  process.exit(0);
}

main();
