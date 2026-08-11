#!/usr/bin/env node
// shape-check.js — render-side geometry check for non-rectangular shapes.
// Loads the FigDown engine the same way build-svg.js / boundary-check.js do,
// renders each .fd in memory and asserts the two properties that make a shape
// mean what it looks like. Both are read off the RENDERED SVG — the drawn
// outline (polygon/ellipse/rect attributes) and the drawn label — never off
// engine internals, so the check is independent of how the engine computes
// its geometry:
//
//   1. containment — every corner of a node label's text box lies inside the
//      node's own drawn outline (not merely inside its bounding box). A
//      rhombus offers only its inscribed rectangle; an ellipse only its
//      inscribed rectangle; sizing that ignores this pushes text across the
//      visible outline;
//   2. endpoints   — an edge that meets a node ends ON that node's drawn
//      outline: not short of it (the arrowhead hides under the fill) and not
//      beyond it (the line floats in empty space next to the shape).
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
// Default paths: conformance/cases/, examples/, examples/patterns/, figures/.
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

function loadEngine() {
  const enginePath = ENGINE_CANDIDATES.find(p => fs.existsSync(p));
  if (!enginePath) return null;
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + enginePath);
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render};');
  const api = factory();
  api.path = enginePath;
  return api;
}

// ── tolerances ────────────────────────────────────────────────────────────────
const TEXT_TOL = 1.0;    // norm ceiling for a label corner (1.0 = the outline)
const END_TOL  = 0.02;   // endpoint norm must be 1 +/- this (2% of the radius)
const CH       = 7.2;    // engine's glyph-width estimate at font-size 13
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
  const chars = Math.max(...lines.map(l => l.replace(/&[a-z]+;/g, 'x').length));
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

// ── per-figure check ──────────────────────────────────────────────────────────
function checkOne(engine, fdPath) {
  const src = fs.readFileSync(fdPath, 'utf8');
  const { doc, errs } = engine.parse(src);
  if (errs.length) return { fd: fdPath, skip: 'parse-error' };
  const out = engine.render(doc, {});
  const svg = out.svg;

  const nodes = {};                          // id -> {outline, label}
  for (const m of svg.matchAll(/<g data-node="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const o = outlineOf(m[2]);
    if (o) nodes[m[1]] = { id: m[1], o, lbl: labelBoxOf(m[2]) };
  }
  const shapeOf = {};
  for (const n of doc.nodes) shapeOf[n.id] = n.shape;

  const textFails = [], endFails = [], seen = {}, rows = [];

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
  const edgeByLine = {}, pairN = {};
  const pk = e => (e.a < e.b ? e.a + '\t' + e.b : e.b + '\t' + e.a);
  for (const e of doc.edges) { edgeByLine[e.line] = e; pairN[pk(e)] = (pairN[pk(e)] || 0) + 1; }
  for (const m of svg.matchAll(/<(line|path) data-edge="(\d+)"[^>]*\/>/g)) {
    const tag = m[0], e = edgeByLine[+m[2]];
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
  return { fd: fdPath, nodes: Object.keys(nodes).length, textFails, endFails, seen, rows };
}

// ── file collection (matches layout-lint.js / boundary-check.js) ──────────────
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
  let strict = false, verbose = false;
  const paths = [];
  for (const a of args) {
    if (a === '--strict') strict = true;
    else if (a === '--verbose') verbose = true;
    else paths.push(a);
  }
  if (!paths.length) {
    const root = path.join(__dirname, '..');
    for (const d of ['conformance/cases', 'examples', 'examples/patterns', 'figures'])
      if (fs.existsSync(path.join(root, d))) paths.push(path.join(root, d));
  }
  const engine = loadEngine();
  if (!engine) { console.error('figdown.html not found'); process.exit(2); }

  const files = [];
  for (const p of paths) for (const f of collectFd(p)) files.push(f);

  const perShape = {};
  let anyFail = false, checkedText = 0, checkedEnd = 0;
  const bad = [];
  console.log(pad('figure', 40) + lpad('nodes', 6) + lpad('labels', 7) +
              lpad('ends', 6) + '  result');
  for (const f of files) {
    let r;
    try { r = checkOne(engine, f); }
    catch (e) { console.log(pad(path.basename(f), 40) + '  error: ' + e.message); anyFail = true; continue; }
    if (r.skip) continue;
    const nt = r.rows.filter(x => x.kind === 'text').length;
    const ne = r.rows.filter(x => x.kind === 'end' || x.kind === 'fan').length;
    if (!nt && !ne) continue;
    checkedText += nt; checkedEnd += ne;
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
    const fails = r.textFails.concat(r.endFails);
    if (fails.length) { anyFail = true; bad.push([f, fails]); }
    console.log(pad(path.basename(f), 40) + lpad(r.nodes, 6) + lpad(nt, 7) +
                lpad(ne, 6) + '  ' + (fails.length ? 'FAIL (' + fails.length + ')' : 'ok'));
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
    bad.reduce((n, b) => n + b[1].length, 0) + ' failures');

  process.exit(strict && anyFail ? 1 : 0);
}

main();
