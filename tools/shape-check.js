#!/usr/bin/env node
// shape-check.js — render-side geometry check for non-rectangular shapes.
// Loads the FigDown engine the same way build-svg.js / boundary-check.js do,
// renders each .fd in memory and asserts the three properties that make a
// shape mean what it looks like. All are read off the RENDERED SVG — the drawn
// outline (polygon/ellipse/rect attributes), the drawn label and the drawn
// edge path — never off engine internals, so the check is independent of how
// the engine computes its geometry:
//
//   1. containment — every corner of a node label's text box lies inside the
//      node's own drawn outline (not merely inside its bounding box). A
//      rhombus offers only its inscribed rectangle; an ellipse only its
//      inscribed rectangle; sizing that ignores this pushes text across the
//      visible outline;
//   2. endpoints   — an edge that meets a node ends ON that node's drawn
//      outline: not short of it (the arrowhead hides under the fill) and not
//      beyond it (the line floats in empty space next to the shape);
//   3. self-loops  — an edge that returns to its own node draws a loop with
//      LENGTH, outside the box, and its label clears the node's own label.
//      Added 0.4 for backlog 64, where the failure was exactly this
//      and nothing measured it: a pinned node's self-edge fell out of the
//      loop branch and drew a ZERO-LENGTH line at the node's centre, with
//      the edge label printed across the node's name. The model goldens
//      cannot see it (geometry is not modelled) and the endpoint check
//      skipped self-loops by name, so the defect shipped unpriced from
//      0.2 until it was filed. The property is stated for EVERY self-loop,
//      pinned or auto, because that is the rule the fix has to keep: a
//      self-transition draws the same way whether its node's coordinate
//      came from a pin or from the layout pass.
//
// Outline model, matching the shapes the engine draws:
//   rectangle (box/rounded/cylinder)  max(|dx|/a, |dy|/b) = 1
//   rhombus   (diamond)                   |dx|/a + |dy|/b = 1
//   ellipse   (ellipse/circle)         (dx/a)^2 + (dy/b)^2 = 1
// The value of that expression is the "norm": <1 inside, 1 on the outline,
// >1 outside. It is scale-homogeneous, so the numbers below read directly as
// fractions of the distance from the centre to the outline.
//
// usage: node tools/shape-check.js [--strict] [--verbose] [<file.fd | dir> ...]
// Default roots: conformance/cases/, examples/, figures/ — WALKED RECURSIVELY.
//
// Until 0.3 that list was `conformance/cases`, `examples`, `examples/patterns`,
// `figures` read NON-recursively — the same copied line three sibling gates
// carried. It opened 230 files and printed 71 rows; the other 159 vanished
// without a number, and the footer read identically whether the tool had
// measured everything or nothing. `examples/showcase/`, `examples/statechart/`,
// `examples/reference/` and `examples/layout-compare/` were never opened.
//
// Enumeration, the skip taxonomy and the coverage line now come from
// `tools/lib/corpus.js`. A conformance fixture paired with a `.errors.txt` is
// invalid ON PURPOSE and is counted as such rather than failing --strict.
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

function loadEngine() {
  const enginePath = ENGINE_CANDIDATES.find(p => fs.existsSync(p));
  if (!enginePath) return null;
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + enginePath);
  // cw is taken FROM the engine, never restated here: this check re-derives a
  // label's width from the drawn SVG, and a second copy of the advance table
  // would let the two disagree about any non-Latin label.
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render, cw};');
  const api = factory();
  api.path = enginePath;
  ENG = api;
  return api;
}
let ENG = null;                                   // set by loadEngine; carries cw

// ── tolerances ────────────────────────────────────────────────────────────────
const TEXT_TOL = 1.0;    // norm ceiling for a label corner (1.0 = the outline)
const END_TOL  = 0.02;   // endpoint norm must be 1 +/- this (2% of the radius)
// A self-loop's drawn run is 20 + 16 + 20 = 56 px on every side the engine
// offers, so the floor is a FLOOR — it separates "a loop" from "no loop at
// all", not one loop shape from another, and a future loop half that size
// still clears it. The defect it exists to catch measured 0.0.
const LOOP_MIN = 24;     // px of drawn run below which a self-loop is not drawn
const OVL_TOL  = 0.5;    // px of box overlap tolerated before it is a collision
const CH       = 7.2;    // engine's advance per LATIN unit at font-size 13
const FONT     = 13;

// ── outline algebra ───────────────────────────────────────────────────────────
function norm(o, dx, dy) {
  const u = Math.abs(dx) / (o.a || 1e-9), v = Math.abs(dy) / (o.b || 1e-9);
  if (o.p === 1) return u + v;
  if (o.p === 2) return Math.hypot(u, v);
  return Math.max(u, v);
}

// ── SVG scraping ──────────────────────────────────────────────────────────────
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
};
const num = (tag, name) => parseFloat(attr(tag, name));

// the outline a node group actually draws, as centre + half-extents + exponent
function outlineOf(inner) {
  let m = inner.match(/<polygon[^>]*>/);
  if (m) {                                   // diamond: cx,y  x+w,cy  cx,y+h  x,cy
    const pts = attr(m[0], 'points').trim().split(/\s+/).map(p => p.split(',').map(Number));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { cx, cy, a: (Math.max(...xs) - Math.min(...xs)) / 2,
             b: (Math.max(...ys) - Math.min(...ys)) / 2, p: 1, kind: 'rhombus' };
  }
  m = inner.match(/<ellipse[^>]*>/);
  if (m) return { cx: num(m[0], 'cx'), cy: num(m[0], 'cy'),
                  a: num(m[0], 'rx'), b: num(m[0], 'ry'), p: 2, kind: 'ellipse' };
  m = inner.match(/<rect[^>]*>/);
  if (m) {
    const x = num(m[0], 'x'), y = num(m[0], 'y'), w = num(m[0], 'width'), h = num(m[0], 'height');
    return { cx: x + w / 2, cy: y + h / 2, a: w / 2, b: h / 2, p: Infinity, kind: 'rect' };
  }
  return null;
}

// the label a node group actually draws, as a text box (x centred, y baseline)
function labelBoxOf(inner) {
  const texts = [...inner.matchAll(/<text[^>]*>[\s\S]*?<\/text>/g)].map(x => x[0]);
  if (!texts.length) return null;
  const t = texts[texts.length - 1];         // the node label is emitted last
  const open = t.match(/<text[^>]*>/)[0];
  const fsz = num(open, 'font-size');
  const body = t.replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
  const lines = body.includes('<tspan')
    ? [...body.matchAll(/<tspan[^>]*>([\s\S]*?)<\/tspan>/g)].map(x => x[1])
    : [body];
  const chars = Math.max(...lines.map(l => ENG.cw(l.replace(/&[a-z]+;/g, 'x'))));
  // the drawn y is the baseline of the FIRST line (textEl centres the block);
  // the ink box runs from cap height above it to the descender below the last
  const w = chars * CH * (fsz / FONT);
  const h = (lines.length - 1) * fsz * 1.3 + 0.93 * fsz;   // 0.72 cap + 0.21 descender
  const top = num(open, 'y') - 0.72 * fsz;
  return { x: num(open, 'x') - w / 2, y: top, w, h, fs: fsz, lines: lines.length, text: lines.join(' ') };
}

function pointsOfEdge(tag, d) {
  if (d) {                                   // <path d="Mx y L… [Q vx vy tx ty] …">
    // Rebuild the ORIGINAL polyline vertices. Interior bends are drawn as
    // rounded fillets ("L trim1 Q vertex trim2"); the Q control point is the
    // untouched vertex, and the first/last points are never filleted — so the
    // endpoints this check asserts are exactly the drawn edge endpoints.
    const toks = d.trim().replace(/([A-Za-z])/g, ' $1 ')
      .replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    const pts = [];
    for (let i = 0; i < toks.length; ) {
      const t = toks[i];
      if (t === 'M' || t === 'L') { pts.push([Number(toks[i + 1]), Number(toks[i + 2])]); i += 3; }
      else if (t === 'Q') { if (pts.length) pts[pts.length - 1] = [Number(toks[i + 1]), Number(toks[i + 2])]; i += 5; }
      else i++;
    }
    return pts;
  }
  return [[num(tag, 'x1'), num(tag, 'y1')], [num(tag, 'x2'), num(tag, 'y2')]];
}

const runLen = pts => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
const flat = s => s.replace(/&[a-z]+;/g, 'x').replace(/\s+/g, ' ').trim();

// Every <text> the figure draws OUTSIDE a node group — edge labels, port
// labels, notes — as boxes, in the same units labelBoxOf uses. A label is
// emitted twice (halo pass then fill pass) at identical coordinates, so the
// duplicates are folded by position+text rather than counted twice.
function looseLabels(svg) {
  const loose = svg.replace(/<g data-node="[^"]+"[^>]*>[\s\S]*?<\/g>/g, '');
  const box = {};
  for (const m of loose.matchAll(/<text[^>]*>[\s\S]*?<\/text>/g)) {
    const open = m[0].match(/<text[^>]*>/)[0];
    const fsz = num(open, 'font-size');
    const x = num(open, 'x'), y = num(open, 'y');
    if (isNaN(fsz) || isNaN(x) || isNaN(y)) continue;
    const body = m[0].replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
    const lines = body.includes('<tspan')
      ? [...body.matchAll(/<tspan[^>]*>([\s\S]*?)<\/tspan>/g)].map(t => t[1])
      : [body];
    const w = Math.max(...lines.map(l => ENG.cw(l.replace(/&[a-z]+;/g, 'x')))) * CH * (fsz / FONT);
    const h = (lines.length - 1) * fsz * 1.3 + 0.93 * fsz;
    const anc = attr(open, 'text-anchor') || 'start';
    const x0 = anc === 'middle' ? x - w / 2 : anc === 'end' ? x - w : x;
    const text = flat(lines.join(' '));
    box[x0.toFixed(2) + '|' + y.toFixed(2) + '|' + text] =
      { x: x0, y: y - 0.72 * fsz, w, h, text };
  }
  return Object.values(box);
}

// ── per-figure check ──────────────────────────────────────────────────────────
function checkOne(engine, fdPath) {
  const src = fs.readFileSync(fdPath, 'utf8');
  const { doc, errs } = engine.parse(src);
  if (errs.length) return { fd: fdPath, skip: 'parse-error', detail: errs[0] };
  const out = engine.render(doc, {});
  // `render` returns null for a document it cannot lay out. Reading `.svg` off
  // that threw, and the throw was caught upstream as a generic `error:` row.
  if (!out || typeof out.svg !== 'string')
    return { fd: fdPath, skip: 'render-error', detail: 'render() returned no svg' };
  const svg = out.svg;

  const nodes = {};                          // id -> {outline, label}
  for (const m of svg.matchAll(/<g data-node="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const o = outlineOf(m[2]);
    if (o) nodes[m[1]] = { id: m[1], o, lbl: labelBoxOf(m[2]) };
  }
  const shapeOf = {};
  for (const n of doc.nodes) shapeOf[n.id] = n.shape;

  const textFails = [], endFails = [], loopFails = [], seen = {}, rows = [];

  // 1. label containment
  for (const id in nodes) {
    const { o, lbl } = nodes[id];
    if (!lbl || !lbl.text.trim()) continue;
    const sh = shapeOf[id] || 'box';
    let worst = 0, wc = null;
    for (const cx of [lbl.x, lbl.x + lbl.w]) for (const cy of [lbl.y, lbl.y + lbl.h]) {
      const v = norm(o, cx - o.cx, cy - o.cy);
      if (v > worst) { worst = v; wc = [cx, cy]; }
    }
    seen[sh] = seen[sh] || { text: 0, ends: 0 };
    seen[sh].text++;
    rows.push({ kind: 'text', shape: sh, id, norm: worst });
    if (worst > TEXT_TOL)
      textFails.push('node "' + id + '" (' + sh + '): label corner at (' +
        wc[0].toFixed(1) + ',' + wc[1].toFixed(1) + ') is at norm ' +
        worst.toFixed(3) + ' — outside the drawn outline');
  }

  // 2. edge endpoints
  // CONNECTOR-IDENTITY-KEY: `data-edge` carries the connector's AUTHORED id where
  // it has one and its source line where it does not, so the index is keyed by
  // whichever of the two the drawing wrote and the attribute is read as an
  // opaque string. It could not stay `(\d+)`: that pattern silently stops
  // matching a named connector, and an assertion that quietly covers fewer
  // edges than it did is worse than one that fails. The two key spaces cannot
  // collide — an id starts with a letter or `_`, a line number does not.
  const edgeByRef = {}, pairN = {};
  const pk = e => (e.a < e.b ? e.a + '\t' + e.b : e.b + '\t' + e.a);
  const refOf = e => (e.id !== undefined && e.id !== null ? String(e.id) : String(e.line));
  for (const e of doc.edges) { edgeByRef[refOf(e)] = e; pairN[pk(e)] = (pairN[pk(e)] || 0) + 1; }
  for (const m of svg.matchAll(/<(line|path) data-edge="([^"]*)"[^>]*\/>/g)) {
    const tag = m[0], e = edgeByRef[m[2]];
    if (!e || e.a === e.b) continue;                 // self-loops draw their own arc
    // co-located edges on the same node pair are deliberately fanned out
    // sideways (+/- 7 px per lane) so they stay legible; their endpoints are
    // offset from the outline BY DESIGN and are reported, not asserted. The
    // fan-out applies only to the straight branch, which emits <line> — a
    // routed <path> on the same pair is still asserted.
    const fanned = m[1] === 'line' && pairN[pk(e)] > 1;
    const pts = pointsOfEdge(tag, attr(tag, 'd'));
    if (pts.length < 2 || pts.some(p => p.some(isNaN))) continue;
    for (const [id, pt] of [[e.a, pts[0]], [e.b, pts[pts.length - 1]]]) {
      const n = nodes[id];
      if (!n) continue;                              // boundary anchor: not drawn
      const sh = shapeOf[id] || 'box';
      const v = norm(n.o, pt[0] - n.o.cx, pt[1] - n.o.cy);
      seen[sh] = seen[sh] || { text: 0, ends: 0 };
      seen[sh].ends++;
      rows.push({ kind: fanned ? 'fan' : 'end', shape: sh, id, norm: v, line: e.line });
      if (!fanned && Math.abs(v - 1) > END_TOL)
        endFails.push('edge line ' + e.line + ' at node "' + id + '" (' + sh +
          '): endpoint (' + pt[0].toFixed(1) + ',' + pt[1].toFixed(1) + ') is at norm ' +
          v.toFixed(3) + ' — ' + (v < 1 ? 'short of' : 'beyond') + ' the drawn outline');
    }
  }

  // 3. self-loops (backlog 64)
  // Read off the drawing like everything else here: the arc's own run length,
  // and whether the text that names it sits on top of the node's name. Both
  // failures were what a pinned self-transition looked like — a zero-length
  // `<line>` at the node's centre and a trigger label across the state's own
  // label — so the two assertions together are the regression, and they are
  // asserted for auto-placed loops as well, which is the invariant.
  const loose = looseLabels(svg);
  let loops = 0;
  for (const m of svg.matchAll(/<(line|path) data-edge="([^"]*)"[^>]*\/>/g)) {
    const tag = m[0], e = edgeByRef[m[2]];
    if (!e || e.a !== e.b) continue;
    const n = nodes[e.a];
    if (!n) continue;                                // boundary anchor: not drawn
    const pts = pointsOfEdge(tag, attr(tag, 'd'));
    if (pts.length < 2 || pts.some(p => p.some(isNaN))) continue;
    loops++;
    const L = runLen(pts);
    if (L < LOOP_MIN)
      loopFails.push('self-loop line ' + e.line + ' on node "' + e.a + '": drawn run is ' +
        L.toFixed(1) + ' px (floor ' + LOOP_MIN + ') — the loop is not drawn' +
        (L < 0.05 ? ', it is a zero-length mark at the node centre' : ''));
    // the loop's own outer run must leave the box, or there is nothing to read
    if (!pts.some(p => norm(n.o, p[0] - n.o.cx, p[1] - n.o.cy) > 1 + END_TOL))
      loopFails.push('self-loop line ' + e.line + ' on node "' + e.a +
        '": every drawn point lies inside the node outline');
    if (!e.mid || !n.lbl) continue;
    const want = flat(String(e.mid).replace(/\\n/g, ' '));
    for (const t of loose) {
      if (t.text !== want) continue;
      const ox = Math.min(t.x + t.w, n.lbl.x + n.lbl.w) - Math.max(t.x, n.lbl.x);
      const oy = Math.min(t.y + t.h, n.lbl.y + n.lbl.h) - Math.max(t.y, n.lbl.y);
      if (ox > OVL_TOL && oy > OVL_TOL)
        loopFails.push('self-loop line ' + e.line + ' on node "' + e.a + '": its label "' +
          t.text + '" overlaps the node\'s own label by ' + ox.toFixed(1) + 'x' +
          oy.toFixed(1) + ' px');
    }
  }
  return { fd: fdPath, nodes: Object.keys(nodes).length, loops,
           textFails, endFails, loopFails, seen, rows };
}

// ── file collection ───────────────────────────────────────────────────────────
// Enumeration lives in tools/lib/corpus.js. See this file's header for what the
// private, non-recursive copy that used to sit here cost.

// Skip reasons this gate adds. Neither fails --strict: both are a correct
// ANSWER ("this document draws no outline this check can measure"), not a
// failure to answer. Both are counted and named on every run.
const EXTRA_REASONS = [
  ['no-drawn-shapes', 'no node outline in the rendered SVG (bitfield/table/timing)', false],
  ['nothing-to-assert', 'shapes drawn but no label and no edge endpoint to check',   false],
];

const pad  = corpus.pad;
const lpad = corpus.lpad;

function main() {
  const args = process.argv.slice(2);
  let strict = false, verbose = false;
  const paths = [];
  for (const a of args) {
    if (a === '--strict') strict = true;
    else if (a === '--verbose') verbose = true;
    else paths.push(a);
  }
  // The gate's DECLARED scope, walked recursively.
  const en = corpus.enumerate(['conformance/cases', 'examples', 'figures'], paths);
  corpus.assertNonEmpty(en, 'shape-check');
  const cov = new corpus.Coverage('shape-check', en, EXTRA_REASONS);

  const engine = loadEngine();
  if (!engine) { console.error('figdown.html not found'); process.exit(2); }

  const files = en.files;
  cov.header();

  const perShape = {};
  let anyFail = false, checkedText = 0, checkedEnd = 0, checkedLoop = 0;
  const bad = [];
  console.log(pad('figure', 52) + lpad('nodes', 6) + lpad('labels', 7) +
              lpad('ends', 6) + lpad('loops', 7) + '  result');
  for (const f of files) {
    let r;
    try { r = checkOne(engine, f); }
    catch (e) {
      // A throw is a reason the tool could not read the figure, so it belongs
      // in the coverage table under a named reason rather than as a loose row.
      cov.skip(f, 'render-error', e.message);
      continue;
    }
    if (r.skip) {
      // A conformance fixture paired with `.errors.txt` is MEANT not to parse.
      const reason = (r.skip === 'parse-error' && en.invalidByDesign.has(f))
        ? 'invalid-by-design' : r.skip;
      cov.skip(f, reason, r.detail);
      continue;
    }
    const nt = r.rows.filter(x => x.kind === 'text').length;
    const ne = r.rows.filter(x => x.kind === 'end' || x.kind === 'fan').length;
    if (!nt && !ne && !r.loops) {
      // These two used to share one bare `continue`, so "renders no shapes at
      // all" and "draws shapes with nothing to assert" were both invisible.
      cov.skip(f, r.nodes ? 'nothing-to-assert' : 'no-drawn-shapes');
      continue;
    }
    cov.score();
    checkedText += nt; checkedEnd += ne; checkedLoop += r.loops;
    for (const row of r.rows) {
      const s = perShape[row.shape] = perShape[row.shape] ||
        { text: 0, ends: 0, fan: 0, tfail: 0, efail: 0, worstText: 0, worstEnd: 0 };
      if (row.kind === 'text') {
        s.text++; s.worstText = Math.max(s.worstText, row.norm);
        if (row.norm > TEXT_TOL) s.tfail++;
      } else if (row.kind === 'fan') {
        s.fan++;
      } else {
        s.ends++; s.worstEnd = Math.max(s.worstEnd, Math.abs(row.norm - 1));
        if (Math.abs(row.norm - 1) > END_TOL) s.efail++;
      }
    }
    const fails = r.textFails.concat(r.endFails, r.loopFails);
    if (fails.length) { anyFail = true; bad.push([f, fails]); }
    console.log(pad(corpus.rel(f), 52) + lpad(r.nodes, 6) + lpad(nt, 7) +
                lpad(ne, 6) + lpad(r.loops, 7) + '  ' + (fails.length ? 'FAIL (' + fails.length + ')' : 'ok'));
    if (verbose)
      for (const row of r.rows)
        console.log('    ' + pad(row.kind, 5) + pad(row.shape, 9) + pad(row.id, 16) +
                    'norm=' + row.norm.toFixed(4));
    for (const msg of fails) console.log('    - ' + msg);
  }

  console.log('');
  console.log(pad('shape', 12) + lpad('labels', 8) + lpad('fail', 6) +
              lpad('worstNorm', 11) + lpad('asserted', 9) + lpad('fail', 6) +
              lpad('worstErr', 10) + lpad('fanned', 8));
  for (const k of Object.keys(perShape).sort()) {
    const s = perShape[k];
    console.log(pad(k, 12) + lpad(s.text, 8) + lpad(s.tfail, 6) +
      lpad(s.worstText.toFixed(3), 11) + lpad(s.ends, 9) + lpad(s.efail, 6) +
      lpad(s.worstEnd.toFixed(4), 10) + lpad(s.fan, 8));
  }
  console.log('total: ' + checkedText + ' labels, ' + checkedEnd + ' endpoints, ' +
    checkedLoop + ' self-loops, ' +
    bad.reduce((n, b) => n + b[1].length, 0) + ' failures');

  // ── COVERAGE. Printed on EVERY run, every reason, zero or not. ────────────
  // The old footer printed the same three totals whether the tool had measured
  // 230 files or none of them.
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
