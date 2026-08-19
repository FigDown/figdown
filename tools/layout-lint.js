#!/usr/bin/env node
// layout-lint.js — render-quality linter for FigDown figures
// Loads the FigDown engine the same way build-svg.js does, renders each .fd in
// memory, extracts geometry from the SVG, and reports layout defects.
//
// IT RECURSES, AND IT ALWAYS STATES ITS COVERAGE.
// Until 0.2.0 it did neither. `collectFd` was a single non-recursive
// `readdirSync`, and the default search paths were the hard-coded list
// `examples/`, `examples/patterns/`, `figures/` — so `examples/statechart/`,
// `examples/showcase/`, `examples/reference/` and `examples/layout-compare/`
// were never opened by this gate at all. Twenty-two files were tabled out of
// fifty-five that exist, and the run reported "0 skips" because it had never
// counted the thirty-three it could not see. Separately, fifteen of the
// twenty-two it DID open were dropped on a bare `continue` when nodeCount and
// edgeCount were both zero, and the parse/render error counters printed only
// when non-zero — so a figure the tool could not read produced output
// byte-identical to a figure with no defects.
//
// The rule this file now follows (.github/CONTRIBUTING.md §3.1(d), and the same rule
// artifact-check.js states in its own header): a gate that does not recurse is
// a gate that lies, and a gate that skips silently is a gate that reports
// success for work it never did. Every run therefore prints a coverage line —
// considered / scored / skipped, broken down by reason — WHETHER OR NOT ANY
// COUNT IS NON-ZERO, and prints which roots were searched and which were
// deliberately not.
//
// Usage:
//   node tools/layout-lint.js [--strict] [--verbose] [--max-score=N] [<file.fd | dir> ...]
//
//   default paths: examples/  figures/  (recursive, resolved from the project
//                  root, independent of CWD)
//   --strict       exit 1 if any figure could not be SCORED for a reason that
//                  means "the tool could not read it" (see STRICT_SKIPS)
//   --verbose      name every skipped file, not just the counts
//   --max-score=N  exit 1 if any scored figure exceeds N
//
// Exit codes: 0 clean · 1 over --max-score, or unscored under --strict · 2 tool error.
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

function loadEngine(enginePath) {
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0)
    throw new Error('Cannot locate engine boundaries in ' + enginePath);
  // FIGDOWN_VERSION is reported so a run says WHICH engine judged the figures.
  // The engine exists in four copies (PROCESS §3.1(a)); this tool reads the
  // one hand-edited copy, `editor/figdown.html`, and never a generated one.
  // eslint-disable-next-line no-new-func
  const factory = new Function(
    h.slice(start, end) + '\nreturn {parse, render, FIGDOWN_VERSION};');
  return factory();
}

// ── SVG geometry extraction ───────────────────────────────────────────────────
// Tiny regex-based SVG reader — no DOM, no dependencies.

function numAttr(el, name) {
  const m = el.match(new RegExp(name + '="([^"]*)"'));
  return m ? parseFloat(m[1]) : null;
}
function strAttr(el, name) {
  const m = el.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

// Parse a <path d="..."> into its ORIGINAL polyline vertices [x,y].
// The engine glues the command letter to the first coordinate
// ("M169.6 142 L201.6 150"), so letters are detached before tokenizing.
// Interior bends are drawn as rounded fillets — each original vertex v becomes
// "L trim1 Q v trim2": the two legs are shortened by r and rejoined with a
// quadratic whose CONTROL point is the untouched vertex v. To keep this linter
// metric-identical to the un-filleted geometry, a Q rebuilds the true vertex
// from its control point (replacing the preceding trim) and drops the trim
// endpoint. Straight "L" points and the M/final-L endpoints are real vertices.
function parsePath(d) {
  const pts = [];
  const tokens = d.trim().replace(/([A-Za-z])/g, ' $1 ')
    .replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'M' || t === 'L') {
      const x = parseFloat(tokens[i + 1]), y = parseFloat(tokens[i + 2]);
      if (!isNaN(x) && !isNaN(y)) pts.push([x, y]);
      i += 3; continue;
    }
    if (t === 'Q') {                       // control point = the real vertex
      const cx = parseFloat(tokens[i + 1]), cy = parseFloat(tokens[i + 2]);
      if (!isNaN(cx) && !isNaN(cy)) {
        if (pts.length) pts[pts.length - 1] = [cx, cy]; else pts.push([cx, cy]);
      }
      i += 5; continue;                    // skip the trim endpoint (i+3,i+4)
    }
    i++;
  }
  return pts;
}

// Expand data-node group bounds — find the first geometric child of <g data-node=...>
// The node group uses data-x/data-y attributes.
function extractNodes(svgText, tx, ty) {
  // Extract all <g data-node="..." data-x="..." data-y="..."> blocks
  const nodes = [];
  const gRe = /<g data-node="([^"]*)" data-x="([^"]*)" data-y="([^"]*)"/g;
  let m;
  while ((m = gRe.exec(svgText)) !== null) {
    const id = m[1];
    const gx = parseFloat(m[2]) + tx;
    const gy = parseFloat(m[3]) + ty;
    // Find the shape element immediately inside THIS group.
    //
    // Two defects were fixed here. (1) The window was a fixed
    // 600 characters, which can run past the end of this node's group and
    // into the next one. It is now bounded by the next `<g data-node=`, so a
    // shape can never be attributed to the wrong node. (2) `<rect>` was
    // tested BEFORE `<polygon>`/`<ellipse>` regardless of position, so for a
    // diamond, circle or ellipse the scan happily picked up a LATER rect —
    // every `novlp`/`thru`/`cross` number for a figure containing one of
    // those shapes was unreliable. The shape is now whichever tag appears
    // FIRST by index.
    const start = m.index + m[0].length;
    const nextG = svgText.indexOf('<g data-node="', start);
    const after = svgText.slice(start, nextG < 0 ? start + 600 : nextG);
    let x = gx, y = gy, w = 60, h = 36; // fallback

    const mRect = after.match(/<rect x="([^"]*)" y="([^"]*)" width="([^"]*)" height="([^"]*)"/);
    const mEll  = after.match(/<ellipse cx="([^"]*)" cy="([^"]*)" rx="([^"]*)" ry="([^"]*)"/);
    const mPoly = after.match(/<polygon points="([^"]*)"/);
    const at = mm => (mm ? mm.index : Infinity);
    const first = Math.min(at(mRect), at(mEll), at(mPoly));
    const rRect = at(mRect) === first ? mRect : null;
    const rEll  = at(mEll)  === first ? mEll  : null;
    const rPoly = at(mPoly) === first ? mPoly : null;
    if (rRect) {
      x = parseFloat(rRect[1]) + tx;
      y = parseFloat(rRect[2]) + ty;
      w = parseFloat(rRect[3]);
      h = parseFloat(rRect[4]);
    } else if (rEll) {
      const cx = parseFloat(rEll[1]) + tx, cy = parseFloat(rEll[2]) + ty;
      const rx = parseFloat(rEll[3]), ry = parseFloat(rEll[4]);
      x = cx - rx; y = cy - ry; w = rx * 2; h = ry * 2;
    } else if (rPoly) {
      const pts = rPoly[1].split(/\s+/).map(p => p.split(',').map(Number));
      const xs = pts.map(p => p[0] + tx), ys = pts.map(p => p[1] + ty);
      x = Math.min(...xs); y = Math.min(...ys);
      w = Math.max(...xs) - x; h = Math.max(...ys) - y;
    }
    nodes.push({ id, x, y, w, h });
  }
  return nodes;
}

// Extract group (container) rectangles.
function extractGroups(svgText, tx, ty) {
  const groups = [];
  const gRe = /<g data-group="[^"]*"[^>]*>/g;
  let m;
  while ((m = gRe.exec(svgText)) !== null) {
    const after = svgText.slice(m.index + m[0].length, m.index + m[0].length + 400);
    const rRect = after.match(/<rect x="([^"]*)" y="([^"]*)" width="([^"]*)" height="([^"]*)"/);
    if (rRect) {
      groups.push({
        x: parseFloat(rRect[1]) + tx,
        y: parseFloat(rRect[2]) + ty,
        w: parseFloat(rRect[3]),
        h: parseFloat(rRect[4]),
      });
    }
  }
  return groups;
}

// Extract edge segments.  Edges use stroke-width="1.6" and appear as:
//   <line x1="..." y1="..." x2="..." y2="..." stroke="..." stroke-width="1.6" .../>
//   <path d="M x y L x y ..." fill="none" stroke="..." stroke-width="1.6" .../>
// We skip the hatch <pattern> line (which has stroke-width="2") and trunk ellipses.
// All coordinates here are LOCAL to the <g transform="translate(tx,ty)"> group.
function extractEdges(svgText, tx, ty) {
  const edges = [];

  // straight <line> edges
  // `data-edge` is the drawn edge's identity — the SOURCE LINE it came from —
  // and F6 needs it to ask whether an edge is incident to a label's owner. It
  // is captured, never required: an edge without one simply has `line: null`
  // and F6 treats it as foreign to everything, which is the safe direction.
  const lineRe = /<line(?: data-edge="([^"]*)")? x1="([^"]*)" y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"[^/]*stroke-width="1\.6"[^/]*\/>/g;
  let m;
  while ((m = lineRe.exec(svgText)) !== null) {
    const x1 = parseFloat(m[2]) + tx, y1 = parseFloat(m[3]) + ty;
    const x2 = parseFloat(m[4]) + tx, y2 = parseFloat(m[5]) + ty;
    edges.push({ segs: [[[x1, y1], [x2, y2]]], line: m[1] === undefined ? null : m[1] });
  }

  // polyline <path> edges: fill="none" + stroke-width="1.6"
  // The hatch pattern line has stroke-width="2"; trunk ellipses are <ellipse>.
  // Wave/plot paths also have stroke-width="1.6" — we must filter those.
  // Scene paths appear BEFORE the <g data-node> blocks (esvg paints first).
  // Use a conservative check: path must have fill="none" and not be inside <defs>.
  //
  // Strategy: find the <g transform="translate("> content block and scan it.
  const pathRe = /<path(?: data-edge="([^"]*)")? d="([^"]*)" fill="none" stroke="[^"]*" stroke-width="1\.6"([^/]*)\/>/g;
  while ((m = pathRe.exec(svgText)) !== null) {
    // A merge bus (engine, item 26 stage 1) draws ONE trunk that several edges
    // share, and every member says so with data-bus="<target>". The shared ink
    // is the convention — the junction dots are what tell the reader how many
    // lines the trunk carries — so `coincident` below does not charge two
    // members of the SAME bus for it. Coincidence between anything else,
    // including two members of two DIFFERENT buses, is scored as before.
    const busM = /\bdata-bus="([^"]*)"/.exec(m[3] || '');
    // skip the arrowhead path (M0,0 L10,5 L0,10 z — it lives in <defs>)
    const d = m[2];
    if (d.includes('z') || d.includes('Z')) continue;
    const pts = parsePath(d);
    if (pts.length < 2) continue;
    // translate coordinates
    const tpts = pts.map(p => [p[0] + tx, p[1] + ty]);
    // decompose polyline into individual segments
    const segs = [];
    for (let i = 0; i + 1 < tpts.length; i++) segs.push([tpts[i], tpts[i + 1]]);
    edges.push({ segs, bus: busM ? busM[1] : null, line: m[1] === undefined ? null : m[1] });
  }

  return edges;
}

// Extract edge-label text bounding boxes (approximate).
// Labels are <text> elements NOT inside a data-node group.
//
// Two properties this reader MUST get right, because `lblcol` now also charges
// an edge that runs through a label box (a strikethrough is the commonest way a
// label stops saying which line it belongs to, and the old reader was blind to
// it — bfd-session read `lblcol 0` with three labels visibly struck):
//
//   1. text-anchor. The engine anchors multi-line labels "middle" and single
//      line ones "start"/"middle"/"end" depending on the side chosen. Treating
//      every x as a left edge put half the boxes a full width off, which both
//      invented collisions and hid real ones.
//   2. <tspan> children. A multi-line label carries no text directly, so the
//      old `>([^<]*)<` capture read it as empty and SKIPPED it. Every one of
//      bfd-session's parked back-edge labels is multi-line: the metric could
//      not see the worst-placed labels in the corpus at all.
function extractLabels(svgText, tx, ty) {
  const labels = [];
  // We need text elements that are edge labels: they appear after the edge SVG
  // and before </g> (the outer scene group). They have font-size="11" or "10".
  // Node labels have font-size="13". Title/legend have 15/11.5/13/etc.
  // Edge mid-labels: font-size="11", tail/head: font-size="10".
  // We look for <text> elements with font-size="11" or font-size="10" that are
  // NOT inside a data-node group.

  // Step 1: mark the ranges of all <g data-node="..."> ... </g> blocks to exclude.
  const nodeRanges = [];
  const nodeOpenRe = /<g data-node="[^"]*"/g;
  let nm;
  while ((nm = nodeOpenRe.exec(svgText)) !== null) {
    // find matching </g>
    let depth = 1, p = svgText.indexOf('>', nm.index) + 1;
    while (p < svgText.length && depth > 0) {
      const openIdx  = svgText.indexOf('<g', p);
      const closeIdx = svgText.indexOf('</g>', p);
      if (closeIdx < 0) break;
      if (openIdx >= 0 && openIdx < closeIdx) { depth++; p = openIdx + 2; }
      else { depth--; p = closeIdx + 4; }
    }
    nodeRanges.push([nm.index, p]);
  }

  const inNode = pos => nodeRanges.some(([s, e]) => pos >= s && pos < e);

  // The engine renders each edge label twice at the same position: once with a
  // white halo stroke and once with the actual colour (for legibility).  We
  // must deduplicate by (x, y, text) before collision testing or every label
  // would register a collision against its own twin.
  const seen = new Set();
  // font-size exactly 10 or 11: the two sizes edge labels use. 10.5/11.5 are
  // the timing genre's span and lane labels, which ride ON their waveform by
  // convention and must not be read as edge labels.
  const textRe = /<text x="([^"]*)" y="([^"]*)"([^>]*)font-size="(1[01])"([^>]*)>([\s\S]*?)<\/text>/g;
  let tm;
  while ((tm = textRe.exec(svgText)) !== null) {
    if (inNode(tm.index)) continue;
    const x    = parseFloat(tm[1]) + tx;
    const y    = parseFloat(tm[2]) + ty;
    const fs   = parseFloat(tm[4]);
    const attrs = tm[3] + tm[5];
    const body  = tm[6];
    // Body is bare text (single line), or <tspan>s. A tspan is one of TWO
    // things and they must not be confused:
    //   • a LINE of a multi-line label — the engine writes one tspan per line
    //     with its own `y`, which is the case this reader was built for;
    //   • a RUN inside one line — a note may open with its
    //     target's label in bold (item 56b), and that line is two tspans at
    //     the SAME `y`.
    // Grouping by `y` tells them apart. Reading the runs as lines made a
    // two-run single line look like a two-line label, which inflated the box
    // and invented a collision with the line below it: the gate reporting a
    // defect the drawing does not have.
    let lines;
    if (body.indexOf('<tspan') >= 0) {
      const rows = new Map(), order = [];
      const sp = /<tspan([^>]*)>([\s\S]*?)<\/tspan>/g;
      let sm;
      while ((sm = sp.exec(body)) !== null) {
        const ym = /\by="([^"]*)"/.exec(sm[1]);
        const key = ym ? ym[1] : String(order.length);
        if (!rows.has(key)) { rows.set(key, []); order.push(key); }
        rows.get(key).push(sm[2]);
      }
      lines = order.map(k => rows.get(k).join(' '));
    } else {
      lines = [body];
    }
    const text = lines.join('\n');
    if (!text.trim()) continue;
    const key = x.toFixed(2) + ',' + y.toFixed(2) + ',' + text;
    if (seen.has(key)) continue;
    seen.add(key);
    // Same geometry the engine's own placement pass uses (cand() in
    // editor/figdown.html): width = widest line, line height 1.3*fs, ink box
    // 1.1*fs, baseline of the first line sits 0.85*fs below the box top.
    const charW = 6.5 * fs / 11;
    const n = lines.length;
    const w = Math.max(...lines.map(l => l.length)) * charW;
    const h = (n - 1) * fs * 1.3 + fs * 1.1;
    const am = /text-anchor="([^"]*)"/.exec(attrs);
    const anchor = am ? am[1] : 'start';
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    labels.push({ x: left, y: y - fs * 0.85, w, h, text });
  }
  return labels;
}

// ── Off-canvas text (axis: is the ink ON THE PAGE at all?) ────────────────────
// THE SEVENTEENTH INSTANCE OF THE SAME BLIND SPOT, and it is the same shape as
// the sixteen before it: every metric above measures a PROPERTY OF WHAT IT
// FOUND — crossings among the edges it parsed, overlaps among the labels it
// read — and none of them asks whether what it found is INSIDE THE FRAME. A
// label 95% outside the canvas crosses nothing, overlaps nothing and strikes
// nothing, so it scored 0 and the figure read as clean. Measured on the shipped
// corpus: telemetry-export drew "gRPC encoder" 41.9 px off the
// left edge (59.1% of the box) and "Export ring" 16.0 px off (24.6%), and
// table-experimental shaved "00:05" — three labels a reader saw as a sliver or
// not at all, under a gate reporting `score 0` for one of those figures.
//
// This reader is deliberately NOT `extractLabels`. That one answers "which text
// is an edge label" and filters to font-size 10/11 outside node groups, which
// is right for collision scoring and wrong here: a clipped NODE label or a
// clipped chart axis label is exactly as invisible. The question this axis asks
// is about ink, not about role, so it reads every <text> in the section.
function extractAllText(svgText, tx, ty) {
  const out = [];
  const textRe = /<text x="([^"]*)" y="([^"]*)"([^>]*?)>([\s\S]*?)<\/text>/g;
  let tm;
  while ((tm = textRe.exec(svgText)) !== null) {
    const x = parseFloat(tm[1]) + tx, y = parseFloat(tm[2]) + ty;
    if (!isFinite(x) || !isFinite(y)) continue;
    const attrs = tm[3], body = tm[4];
    const fsm = /font-size="([\d.]+)"/.exec(attrs);
    const fs = fsm ? parseFloat(fsm[1]) : 13;
    let lines;
    if (body.indexOf('<tspan') >= 0) {
      lines = [];
      const sp = /<tspan[^>]*>([\s\S]*?)<\/tspan>/g;
      let sm; while ((sm = sp.exec(body)) !== null) lines.push(sm[1]);
    } else lines = [body];
    const text = lines.join('\n');
    if (!text.trim()) continue;
    // TWO ADVANCES, because the engine has two and this reader must not invent
    // a third. `cand()` sizes edge labels at 6.5 px per character at font-size
    // 11; `CH = 7.2` at `FONT = 13` sizes every box and caption. They are not
    // the same ratio, and using the label one for 13 px text overestimates by
    // 6.7% — enough to put a correctly-placed node label 1.6 px "off canvas"
    // (rpf-check's "Drop (RPF fail)", which the raster shows intact). A reader
    // that reports a defect the engine did not commit is as useless as one that
    // misses the defects it did.
    const charW = fs <= 11.5 ? 6.5 * fs / 11 : 7.2 * fs / 13;
    const w = Math.max(...lines.map(l => l.replace(/&[a-z]+;/g, 'x').length)) * charW;
    const h = (lines.length - 1) * fs * 1.3 + fs * 1.1;
    const am = /text-anchor="([^"]*)"/.exec(attrs);
    const anchor = am ? am[1] : 'start';
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    out.push({ x: left, y: y - fs * 0.85, w, h, text });
  }
  return out;
}

// The canvas is the section's own <svg width/height> — the box a viewer clips
// to. Anything outside it is not "badly placed", it is NOT DRAWN.
function canvasOf(svgText) {
  const w = /<svg[^>]*\swidth="([\d.]+)"/.exec(svgText);
  const h = /<svg[^>]*\sheight="([\d.]+)"/.exec(svgText);
  return w && h ? { W: parseFloat(w[1]), H: parseFloat(h[1]) } : null;
}

// TOLERANCE, and why it is 1 px and not a percentage. The width model above is
// an ESTIMATE (a fixed advance per character against a proportional font), so
// sub-pixel overhang says nothing. One pixel is below what any reader can see
// and above what the estimate can resolve. It is NOT a severity threshold:
// a 1.1 px clip and a 41.9 px clip are both reported, because "how much of the
// label is missing" is the report's job, not the filter's.
const OFFCANVAS_TOL = 1;

function offCanvasText(svgText) {
  const c = canvasOf(svgText);
  if (!c) return [];
  const [tx, ty] = parseTranslate(svgText);
  const hits = [];
  for (const L of extractAllText(svgText, tx, ty)) {
    const outPx = Math.max(-L.x, -L.y, (L.x + L.w) - c.W, (L.y + L.h) - c.H);
    if (outPx <= OFFCANVAS_TOL) continue;
    const ix = Math.max(0, Math.min(L.x + L.w, c.W) - Math.max(L.x, 0));
    const iy = Math.max(0, Math.min(L.y + L.h, c.H) - Math.max(L.y, 0));
    const area = L.w * L.h;
    hits.push({ text: L.text, x: L.x, y: L.y, w: L.w, h: L.h, outPx,
                frac: area > 0 ? 1 - (ix * iy) / area : 1 });
  }
  return hits;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

// Segment intersection test (excluding shared endpoints and T-junctions).
// Returns true iff segments AB and CD cross as proper intersections.
function segsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const dxAB = bx - ax, dyAB = by - ay;
  const dxCD = dx - cx, dyCD = dy - cy;
  const denom = dxAB * dyCD - dyAB * dxCD;
  if (Math.abs(denom) < 1e-9) return false; // parallel / collinear

  const t = ((cx - ax) * dyCD - (cy - ay) * dxCD) / denom;
  const u = ((cx - ax) * dyAB - (cy - ay) * dxAB) / denom;

  // Strict interior: both parameters in open interval (0,1).
  // Endpoints touching (t=0, t=1, u=0, u=1) are excluded (shared endpoints,
  // T-junctions).
  const EPS = 1e-6;
  return t > EPS && t < 1 - EPS && u > EPS && u < 1 - EPS;
}

// Distance from point P to segment AB.
function pointToSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Does point P lie strictly inside rectangle [rx, ry, rx+rw, ry+rh]?
function pointInRect(px, py, rx, ry, rw, rh) {
  const EPS = 2; // small tolerance so border-attached endpoints don't trigger
  return px > rx + EPS && px < rx + rw - EPS &&
         py > ry + EPS && py < ry + rh - EPS;
}

// Segment vs axis-aligned rectangle intersection (strict interior crossing).
function segPassesThroughRect(ax, ay, bx, by, rx, ry, rw, rh) {
  // If either endpoint is strictly inside the rect, count it.
  if (pointInRect(ax, ay, rx, ry, rw, rh)) return true;
  if (pointInRect(bx, by, rx, ry, rw, rh)) return true;

  // Otherwise check if the segment crosses any of the 4 edges of the rectangle.
  const x2 = rx + rw, y2 = ry + rh;
  const sides = [
    [rx, ry, x2, ry],
    [x2, ry, x2, y2],
    [x2, y2, rx, y2],
    [rx, y2, rx, ry],
  ];
  // We want the segment to cross at least TWO sides (meaning it goes through).
  let crossings = 0;
  for (const [sx1, sy1, sx2, sy2] of sides) {
    if (segsCross(ax, ay, bx, by, sx1, sy1, sx2, sy2)) crossings++;
  }
  return crossings >= 2;
}

// Collinear overlap length between two segments that share the same line.
function collinearOverlap(ax, ay, bx, by, cx, cy, dx, dy) {
  // Project all four points onto the line AB.
  const dxAB = bx - ax, dyAB = by - ay;
  const len = Math.hypot(dxAB, dyAB);
  if (len < 1e-9) return 0;
  const ux = dxAB / len, uy = dyAB / len;

  // Check that CD is collinear with AB (distance from C,D to line < 1 px).
  const distC = Math.abs((cy - ay) * ux - (cx - ax) * uy);
  const distD = Math.abs((dy - ay) * ux - (dx - ax) * uy);
  if (distC > 1.5 || distD > 1.5) return 0;

  // Project onto 1-D axis.
  const t1 = 0, t2 = len;
  const t3 = (cx - ax) * ux + (cy - ay) * uy;
  const t4 = (dx - ax) * ux + (dy - ay) * uy;
  const lo = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const hi = Math.min(Math.max(t1, t2), Math.max(t3, t4));
  return Math.max(0, hi - lo);
}

// Total path length of an edge (sum of its segment lengths).
function edgeLength(edge) {
  let len = 0;
  for (const [[ax, ay], [bx, by]] of edge.segs)
    len += Math.hypot(bx - ax, by - ay);
  return len;
}

// ── F5: label-association margin (the legibility floor's first rule) ──────────
// ADVISORY, RATCHETING axis — the first rule of the LEGIBILITY FLOOR
// (spec/core.md §14). It is NOT part of score(): the floor is a MUST-NOT list a
// conformant renderer must satisfy, not one more term in the aesthetic ranking.
//
// The rule. A label whose distance to its NEAREST edge (d1) and to its
// SECOND-NEAREST DISTINCT edge (d2) differ by less than M=4px is ambiguous — a
// reader cannot tell which edge it names. margin = d2 - d1; flag when margin < M.
// Measured from the label box CENTRE, the only point that matches the eye: a
// wide side-anchored label grazes its own line at one corner while its
// *identity* floats out into a convergence (the tcp `rcv ACK of FIN / x` case,
// centre 64.5px from its own line vs 65.0px from the next — a 0.5px margin).
//
// Four false-positive filters carry a naive 67 down to the honest 9 / 6 figures,
// and every clean figure — turnstile included — stays at 0:
//   (1) per-EDGE grouping — d(label,edge) is the MIN over that edge's segments,
//       so the two segments of one bent edge can never be its own "second edge";
//   (2) node-border proximity <18px — an endpoint/port label the reader ties to
//       the node, not an edge-edge ambiguity. ABSOLUTE, not `nodeD < d1`: a
//       label that floats far from every edge is not excused by a nearer node;
//   (3) halo-twin edge-label test — the engine draws every edge label twice at
//       one (x,y), a white halo (`stroke="#fff"`) then the coloured glyph;
//       legends/titles/notes render once, so the twin tells an edge label from a
//       non-edge label without a data-* role marker;
//   (4) anti-parallel-pair / self-loop exemption — when the two nearest edges
//       share BOTH endpoints the ±7px fan is intentional and colour
//       disambiguates (turnstile's `coin`/`push`, tcp's CLOSED<->LISTEN fan).
// M=4 sits in the measured gap: real defects span 0.0–3.6px; the clean
// anti-parallel fan is at 4.9px and turnstile's tightest label at 7.0px.
const F5_M = +(process.env.F5_M || 4);

function f5HaloKeys(svgText, tx, ty) {
  const keys = new Set();
  const re = /<text x="([^"]*)" y="([^"]*)"([^>]*)>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    if (!/stroke="#fff"/.test(m[3])) continue;
    const x = parseFloat(m[1]) + tx, y = parseFloat(m[2]) + ty;
    const body = m[4];
    let lines;
    if (body.indexOf('<tspan') >= 0) {
      lines = []; const sp = /<tspan[^>]*>([\s\S]*?)<\/tspan>/g; let sm;
      while ((sm = sp.exec(body)) !== null) lines.push(sm[1]);
    } else lines = [body];
    keys.add(x.toFixed(2) + ',' + y.toFixed(2) + ',' + lines.join('\n'));
  }
  return keys;
}
function f5EdgeMin(pt, e) {
  let d = Infinity;
  for (const [p, q] of e.segs)
    d = Math.min(d, pointToSegDist(pt[0], pt[1], p[0], p[1], q[0], q[1]));
  return d;
}
function f5NodeBorderDist(pt, n) {
  const dx = Math.max(n.x - pt[0], 0, pt[0] - (n.x + n.w));
  const dy = Math.max(n.y - pt[1], 0, pt[1] - (n.y + n.h));
  return Math.hypot(dx, dy);
}
function f5Endpoints(e) { const s = e.segs; return [s[0][0], s[s.length - 1][1]]; }
function f5Near2(p, q, tol) { return Math.hypot(p[0] - q[0], p[1] - q[1]) < tol; }
// anti-parallel pair / self-loop twin: the two edges share BOTH endpoints.
function f5AntiParallel(a, b, tol) {
  const A = f5Endpoints(a), B = f5Endpoints(b);
  return A[0] !== A[1] &&
    A.every(p => B.some(q => f5Near2(p, q, tol))) &&
    B.every(q => A.some(p => f5Near2(p, q, tol)));
}

// Returns { flagged: [text,...], considered } for one rendered scene SVG.
// Faithful port of the verified F5 prototype (turnstile 0, 9 real defects).
// It reuses this file's own readers.
function computeF5(svgText, tx, ty, edges, nodes, labels) {
  if (!edges.length) return { flagged: [], considered: 0 };
  const halos = f5HaloKeys(svgText, tx, ty);
  const flagged = [];
  let considered = 0;
  for (const L of labels) {
    // filter (3): keep only labels with a white halo twin at their box (edge
    // labels); drop legends/titles/notes, which the engine renders once.
    // The key is `x,y,text` and the TEXT may itself contain commas, so split
    // from the FRONT at the first two separators.  Splitting from the back
    // (lastIndexOf) recovered a truncated text for any label with a comma in
    // it, the identity test then failed, and the label was dropped before
    // `considered++` — silently absent from both numerator and denominator.
    // That hid 13 of 223 corpus edge labels, concentrated in exactly the
    // compound conditions dense state machines use (`rcv SYN,ACK / snd ACK`).
    const isEdge = [...halos].some(k => {
      const i1 = k.indexOf(',');
      const i2 = k.indexOf(',', i1 + 1);
      if (k.slice(i2 + 1) !== L.text) return false;
      const hx = parseFloat(k.slice(0, i1));
      const hy = parseFloat(k.slice(i1 + 1, i2));
      return hx >= L.x - 1 && hx <= L.x + L.w + 1 && hy >= L.y - 1 && hy <= L.y + L.h + 14;
    });
    if (!isEdge) continue;
    const C = [L.x + L.w / 2, L.y + L.h / 2];
    // filter (1): per-EDGE min distance, so a bent edge is one edge.
    // filter (5): per-BUS min distance, so a merge bus is one LINE. A bus draws
    // its shared trunk once per member (that is the convention `data-bus`
    // records, and the reason `coincident` already exempts it), so a label on
    // the trunk sits at the same distance from every member and F5's
    // nearest-versus-second-nearest margin is 0 by construction — it would
    // charge the drawing convention rather than an ambiguity. The reader's
    // question, "which line does this word name", has one answer here: the
    // trunk. Members of DIFFERENT buses, and a bus against any other edge, are
    // compared exactly as before.
    const perEdge = edges.map(e => ({ e, d: f5EdgeMin(C, e) }));
    const busMin = new Map();
    for (const r of perEdge) if (r.e.bus) {
      const cur = busMin.get(r.e.bus);
      if (cur === undefined || r.d < cur) busMin.set(r.e.bus, r.d);
    }
    const seenBus = new Set();
    const ds = perEdge.filter(r => {
      if (!r.e.bus) return true;
      if (seenBus.has(r.e.bus)) return false;
      seenBus.add(r.e.bus);
      r.d = busMin.get(r.e.bus);
      return true;
    }).sort((a, b) => a.d - b.d);
    if (ds.length < 2) continue;
    considered++;
    const margin = ds[1].d - ds[0].d;
    const nodeD = nodes.length ? Math.min(...nodes.map(n => f5NodeBorderDist(C, n))) : Infinity;
    const anti = f5AntiParallel(ds[0].e, ds[1].e, 5);   // filter (4)
    const nodeBorderFP = nodeD < 18;                     // filter (2)
    if (margin < F5_M && !anti && !nodeBorderFP) flagged.push(L.text);
  }
  return { flagged, considered };
}

// ── F6: element-label / foreign-edge margin (§14.4's named frontier) ─────────
// ADVISORY, RATCHETING — printed with its denominator, absent from score(),
// from --max-score and from --strict, exactly like F5 and `align`.
//
// F5 charges EDGE labels only, by design: it asks which of two edges a label
// names. §14.4 names the other half of the same question and leaves it open —
// an ELEMENT's label (a node's, an external's, a group's band name) that a
// FOREIGN edge touches. It is the fourth instance of one mechanism
// (edge-label/edge = F5, note/element = engine-backlog item 40,
// endpoint-label/endpoint = item 42, element-label/foreign-edge = this), and
// the corpus case that filed it is the sharpest yet: `showcase/arp-resolution`
// ran the green unicast shaft through `rest of the LAN (hosts C, D, ...)`,
// inviting the reader to conclude the unicast reaches the rest of the LAN —
// the exact claim the figure exists to deny.
//
// The rule. For an element label owned by element O:
//   margin = distance from the label BOX to the nearest edge NOT incident to O
//   flag when margin < M.
//
// WHY NOT F5's LITERAL nearest-versus-second-nearest. It was written that way
// first (margin = d_foreign - d_own) and measured: it charges the DRAWING
// CONVENTION rather than the defect. F5 compares two edges because an edge
// label between two lines names one of them and the reader must choose; an
// ELEMENT label already has an owner — the element — so the only open question
// is clearance. Worse, the own-edge term is a constant of the convention: an
// external's label sits a fixed 10 px beyond its anchor and its own edge
// terminates AT that anchor, so d_own is pinned near 16 px for every external
// in the corpus, and the axis then reported `arp-resolution` as defective at a
// foreign clearance of 11.6 px — a figure whose shaft demonstrably clears the
// label. What survives from F5 is everything else: the readers, the box
// geometry, the halo-twin de-duplication, M, the printed denominator, and the
// ratchet. Incidence is read from the DOCUMENT, so "foreign" is a fact about
// the source and not a guess from the geometry.
//
// Distance is measured to the BOX, not to a centre, because the defect is
// INTERSECTION: the arp shaft entered the box's right portion while the box
// centre was 30 px away. This is the one place F6 departs from F5's
// centre-based measure, and it departs for the reason F5 gives for choosing
// the centre — measure the thing the eye is actually doing.
//
// M = 4 px, F5's own constant, and for F5's reason: a 1.6 px shaft with a 3 px
// white halo under the glyph is separated from the text at about 4 px and not
// before.
const F6_M = +(process.env.F6_M || 4);

function pointRectDist(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}
// Exact distance from a segment to an axis-aligned rect: 0 when they meet,
// otherwise attained at a vertex of one against the other.
function segRectDist(p, q, r) {
  if (pointRectDist(p[0], p[1], r) === 0 || pointRectDist(q[0], q[1], r) === 0) return 0;
  const x2 = r.x + r.w, y2 = r.y + r.h;
  const sides = [[r.x, r.y, x2, r.y], [x2, r.y, x2, y2], [x2, y2, r.x, y2], [r.x, y2, r.x, r.y]];
  for (const [sx1, sy1, sx2, sy2] of sides)
    if (segsCross(p[0], p[1], q[0], q[1], sx1, sy1, sx2, sy2)) return 0;
  let d = Infinity;
  for (const c of [[r.x, r.y], [x2, r.y], [x2, y2], [r.x, y2]])
    d = Math.min(d, pointToSegDist(c[0], c[1], p[0], p[1], q[0], q[1]));
  d = Math.min(d, pointRectDist(p[0], p[1], r), pointRectDist(q[0], q[1], r));
  return d;
}
function edgeRectDist(e, r) {
  let d = Infinity;
  for (const [p, q] of e.segs) d = Math.min(d, segRectDist(p, q, r));
  return d;
}

// The three element-label classes, each read where the engine writes it.
//   node label     — <text> inside <g data-node="ID">; owner = ID
//   band name      — <text font-size="11.5"> inside <g data-group="ID">
//   external label — font-size 10, outside both wrappers, its full text equal
//                    to a `boundary` node's label in the DOCUMENT. An external
//                    is never drawn as a shape (EXTERNAL-EDGE-ENDPOINTS), so the drawing carries no
//                    wrapper to key on and the SOURCE is the only honest way to
//                    tell its label from an endpoint label at the same size.
//                    That is the same reason `computeAlign` reads the document.
function extractElementLabels(svgText, tx, ty, doc) {
  const out = [];
  const textRe = /<text x="([^"]*)" y="([^"]*)"([^>]*)>([\s\S]*?)<\/text>/g;
  const boxOf = (x, y, fs, attrs, body) => {
    let lines;
    if (body.indexOf('<tspan') >= 0) {
      lines = []; const sp = /<tspan[^>]*>([\s\S]*?)<\/tspan>/g; let sm;
      while ((sm = sp.exec(body)) !== null) lines.push(sm[1]);
    } else lines = [body];
    const text = lines.join('\n');
    if (!text.trim()) return null;
    const charW = 6.5 * fs / 11;
    const w = Math.max(...lines.map(l => l.length)) * charW;
    const h = (lines.length - 1) * fs * 1.3 + fs * 1.1;
    const am = /text-anchor="([^"]*)"/.exec(attrs);
    const anchor = am ? am[1] : 'start';
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return { x: left, y: y - fs * 0.85, w, h, text };
  };
  // wrapper ranges, so a <text> is attributed to the group that encloses it
  const ranges = [];
  for (const tag of ['data-node', 'data-group']) {
    const re = new RegExp('<g ' + tag + '="([^"]*)"', 'g');
    let m;
    while ((m = re.exec(svgText)) !== null) {
      let depth = 1, p = svgText.indexOf('>', m.index) + 1;
      while (p < svgText.length && depth > 0) {
        const o = svgText.indexOf('<g', p), c = svgText.indexOf('</g>', p);
        if (c < 0) break;
        if (o >= 0 && o < c) { depth++; p = o + 2; } else { depth--; p = c + 4; }
      }
      ranges.push({ kind: tag === 'data-node' ? 'node' : 'group', id: m[1], s: m.index, e: p });
    }
  }
  // `external` declarations live in `doc.boundaries`, not in `doc.nodes`: an
  // external is not a node and the parser says so. Reading `doc.nodes` for them
  // — the obvious guess — finds nothing and the axis silently measures no
  // external label at all, which is the blind spot this file's header is about.
  const extLabels = new Map();
  for (const n of ((doc && doc.boundaries) || []))
    if (n.label) extLabels.set(String(n.label), n.id);
  const seen = new Set();
  let tm;
  while ((tm = textRe.exec(svgText)) !== null) {
    const attrs = tm[3];
    const fm = /font-size="([^"]*)"/.exec(attrs);
    if (!fm) continue;
    const fs = parseFloat(fm[1]);
    const b = boxOf(parseFloat(tm[1]) + tx, parseFloat(tm[2]) + ty, fs, attrs, tm[4]);
    if (!b) continue;
    // the halo twin is the same box at the same point — count it once
    const key = b.x.toFixed(2) + ',' + b.y.toFixed(2) + ',' + b.text;
    if (seen.has(key)) continue;
    const owner = ranges.find(r => tm.index >= r.s && tm.index < r.e);
    if (owner && owner.kind === 'node') { seen.add(key); out.push(Object.assign(b, { cls: 'node', owner: owner.id })); continue; }
    if (owner && owner.kind === 'group' && Math.abs(fs - 11.5) < 1e-6) {
      seen.add(key); out.push(Object.assign(b, { cls: 'band', owner: null })); continue;
    }
    if (!owner && Math.abs(fs - 10) < 1e-6 && extLabels.has(b.text)) {
      seen.add(key); out.push(Object.assign(b, { cls: 'external', owner: extLabels.get(b.text) }));
    }
  }
  return out;
}

function computeF6(svgText, tx, ty, edges, doc) {
  const labels = extractElementLabels(svgText, tx, ty, doc);
  if (!labels.length || !edges.length) return { flagged: [], considered: 0 };
  // which drawn edge belongs to which source line, so "incident to O" is a
  // question about the DOCUMENT and not a guess from the geometry
  const inc = new Map();
  for (const e of ((doc && doc.edges) || [])) inc.set(String(e.line), [e.a, e.b]);
  const flagged = [];
  let considered = 0;
  for (const L of labels) {
    considered++;
    let foreign = Infinity, who = null;
    for (const e of edges) {
      const ends = e.line !== undefined && e.line !== null ? inc.get(String(e.line)) : null;
      if (L.owner && ends && (ends[0] === L.owner || ends[1] === L.owner)) continue;   // its own
      const d = edgeRectDist(e, L);
      if (d < foreign) { foreign = d; who = e.line; }
    }
    if (!isFinite(foreign)) continue;
    if (foreign < F6_M) flagged.push(L.cls + ' "' + L.text.replace(/\n/g, '|') + '"'
      + ' (' + foreign.toFixed(1) + 'px' + (who !== null && who !== undefined ? ', line ' + who : '') + ')');
  }
  return { flagged, considered };
}

// ── align: axis-free orthogonality (ADVISORY, never gates) ───────────────────
//
//   A = #{ edges : min(|Δcx|, |Δcy|) > TOL }        self-loops excluded
//
// Δcx/Δcy are the differences between the two endpoint node CENTRES, so an edge
// is charged when it is neither horizontal nor vertical within tolerance. It
// counts a property of the PLACEMENT, not of the routing: a bent orthogonal
// route between two nodes that are not aligned still leaves the reader tracing
// a staircase, and a straight diagonal between two aligned nodes is not
// possible. This is the drawing-tool convention (a figure reads as columns and
// rows), and it is the axis every other term in this file lacked — a clean
// column scored no better than a staircase, and worse on `crossings`, because a
// denser drawing crosses more per unit area.
//
// WHY IT IS ADVISORY AND NOT AN OBJECTIVE. The term was measured as a candidate
// for the placement objective (decisions/registry.md). Against a
// control with the same move set and no alignment term, the whole floor gain
// belonged to the MOVE SET; the term's own contribution was A 132 -> 127, and
// buying it needed two guards, each added to repair a measured regression (a
// clean figure went crossings 0 -> 3; the fan-hub barycentre was pulled off
// centre). A readability signal that needs two guards to stop it making figures
// worse is a signal, not an objective. So it is REPORTED here and wired into
// nothing: not `score()`, not `--max-score`, not `--strict`.
//
// WHY IT IS AXIS-FREE. `min(|Δcx|,|Δcy|)` never asks which way the figure
// flows. It cannot: `examples/statechart/turnstile.fd` is `flow right` with
// both states in ONE rank, so its clean straight-down transition has a
// perpendicular offset of 80 px against the flow axis and 7.2 px along it. A
// term keyed to the flow direction calls the project's calibration reference
// misaligned; this one calls it aligned, as the eye does.
//
// TOL = 12 px, from the corpus rather than from taste. The 249 corpus edge
// offsets cluster hard below 0.5 px (97 edges) and then stop; 12 px sits in the
// widest gap of the sub-20 px distribution (11.8 -> 14.7) and is about one text
// line-height, below which an offset reads as "the same line".
const ALIGN_TOL = +(process.env.ALIGN_TOL || 12);

// This is the one metric in this file that needs the PARSED DOCUMENT and not
// just the SVG: it is about which two nodes an edge JOINS, and the rendered
// path says only where ink went. Endpoints that are not drawn nodes (a port
// stub, a group anchor) have no centre, so they are counted as `unresolved`
// and named in the denominator rather than quietly dropped — the blind spot
// this file's header, `corpus.js` and the F5 comma defect all record.
function computeAlign(doc, nodes) {
  const box = new Map();
  for (const n of nodes)
    if (!box.has(n.id)) box.set(n.id, { cx: n.x + n.w / 2, cy: n.y + n.h / 2 });
  const edges = (doc && doc.edges) || [];
  let count = 0, considered = 0, selfLoops = 0, unresolved = 0;
  for (const e of edges) {
    if (e.a === e.b) { selfLoops++; continue; }   // a self-loop has no direction to be off
    const A = box.get(e.a), B = box.get(e.b);
    if (!A || !B) { unresolved++; continue; }
    considered++;
    if (Math.min(Math.abs(A.cx - B.cx), Math.abs(A.cy - B.cy)) > ALIGN_TOL) count++;
  }
  return { count, considered, selfLoops, unresolved };
}

// ── Metrics ──────────────────────────────────────────────────────────────────

function computeMetrics(edges, nodes, groups, labels) {
  // 1. crossings — true edge-edge segment crossings
  let crossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      for (const [p1, p2] of edges[i].segs) {
        for (const [p3, p4] of edges[j].segs) {
          if (segsCross(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]))
            crossings++;
        }
      }
    }
  }

  // 2. thru — edges passing through node rectangles they are not connected to
  // We don't have direct edge-to-node connectivity from the SVG alone, so we
  // consider ANY segment endpoint whose distance to a node center is <= half-
  // diagonal a "connected" node.  This is a conservative approximation:
  // a segment endpoint near a node border implies the edge connects to that node.
  let thru = 0;
  for (const edge of edges) {
    // Collect all endpoint positions for this edge.
    const endpoints = new Set();
    for (const [[ax, ay], [bx, by]] of edge.segs) {
      endpoints.add(`${ax.toFixed(1)},${ay.toFixed(1)}`);
      endpoints.add(`${bx.toFixed(1)},${by.toFixed(1)}`);
    }

    // Find which nodes are "connected" (an endpoint is near the node border).
    const connectedNodes = new Set();
    for (const n of nodes) {
      const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
      const diag = Math.hypot(n.w, n.h) / 2 + 6; // generous endpoint proximity
      for (const key of endpoints) {
        const [px, py] = key.split(',').map(Number);
        if (Math.hypot(px - cx, py - cy) <= diag) {
          connectedNodes.add(n.id);
          break;
        }
      }
    }

    // Check each segment against non-connected nodes.
    let edgeThru = false;
    for (const [[ax, ay], [bx, by]] of edge.segs) {
      for (const n of nodes) {
        if (connectedNodes.has(n.id)) continue;
        if (segPassesThroughRect(ax, ay, bx, by, n.x, n.y, n.w, n.h)) {
          edgeThru = true;
          break;
        }
      }
      if (edgeThru) break;
    }
    if (edgeThru) thru++;
  }

  // 3. novlp — node-node rectangle overlaps (peer nodes only).
  // Group boxes are containers that always enclose their member nodes by
  // design, so group-vs-node and group-vs-group overlaps are excluded.
  // Only count true peer-node collisions.
  let novlp = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const EPS = 1; // 1px touching is not an overlap
      if (a.x + a.w > b.x + EPS && b.x + b.w > a.x + EPS &&
          a.y + a.h > b.y + EPS && b.y + b.h > a.y + EPS)
        novlp++;
    }
  }

  // 4. lblcol — a label that has stopped saying which line it belongs to.
  //    Two ways that happens, and only the first used to be counted:
  //      (a) two label boxes overlap (unreadable, and the reader cannot tell
  //          which of the two texts is one label);
  //      (b) an edge runs THROUGH a label box — the strikethrough. This is the
  //          commoner defect by a wide margin and the metric was blind to it.
  //    A label is charged AT MOST ONCE for (b) no matter how many edges cross
  //    it, because what the eye reports is "that label is struck", not a count
  //    of strokes; the label-vs-label term stays a pair count as before.
  //
  //    Every mid/endpoint label the engine places is offset 3–6 px CLEAR of its
  //    own carrying segment, so a label sitting on a line is a defect whichever
  //    edge drew the line — including the one the label names. The merge-bus
  //    exemption does not apply here: a trunk striking a label is still a
  //    strikethrough. `coincident` is where the bus convention is exempt.
  let lblcol = 0;
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i], b = labels[j];
      const EPS = 1;
      if (a.x + a.w > b.x + EPS && b.x + b.w > a.x + EPS &&
          a.y + a.h > b.y + EPS && b.y + b.h > a.y + EPS)
        lblcol++;
    }
  }
  for (const L of labels) {
    // The test is against the box's CENTRE BAND — the middle 40% of its height,
    // inset 2 px in x — not the full box. That band is where the glyph ink
    // lives, so a line that crosses it reads as a strikethrough, while a
    // shallow diagonal that clips a corner of the (generous) text box does not
    // and is not charged. Measured against the corpus by eye: the full box
    // charged `ingress` "L3 hit" and `l2-forwarding-logic` "no", both of which
    // sit visibly clear of their lines.
    const r = { x: L.x + 2, y: L.y + L.h * 0.3, w: L.w - 4, h: L.h * 0.4 };
    if (r.w <= 0 || r.h <= 0) continue;
    let struck = false;
    for (const e of edges) {
      for (const [p, q] of e.segs) {
        if (segPassesThroughRect(p[0], p[1], q[0], q[1], r.x, r.y, r.w, r.h)) { struck = true; break; }
      }
      if (struck) break;
    }
    if (struck) lblcol++;
  }

  // 5. coincident — HOW MANY EDGES are drawn on top of another edge: an edge
  //    is charged once if any of its segments shares more than 10 px of line
  //    with a segment of any OTHER edge. Once per edge, like the `lblcol`
  //    strikethrough, because what the eye reports is "that line is buried",
  //    not a count of buriers.
  //
  //    IT USED TO SCAN FORWARD ONLY. The inner loop ran `j = i + 1`, so the
  //    LAST edge of a coincident set was never charged: it had already been
  //    counted from the other side, but only as somebody else's partner, and
  //    its own pass had nothing left to look at. Three edges sharing one row
  //    therefore read `2` — not the three pairs, not the three edges, a number
  //    that is neither. That is what bfd-session reported while three back
  //    edges (452 px, 263 px and 263 px of shared ink) drew as one stroke on
  //    y=46: the metric that exists to make this class visible was quietly one
  //    short of every reading of it. `j` now scans every other edge.
  let coincident = 0;
  for (let i = 0; i < edges.length; i++) {
    let found = false;
    for (let j = 0; j < edges.length && !found; j++) {
      if (j === i) continue;
      if (edges[i].bus && edges[i].bus === edges[j].bus) continue;  // one merge bus, one trunk
      for (const [p1, p2] of edges[i].segs) {
        for (const [p3, p4] of edges[j].segs) {
          if (collinearOverlap(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]) > 10) {
            coincident++;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }

  // 6. inkPerEdge — total edge length / edge count
  let totalLen = 0;
  for (const e of edges) totalLen += edgeLength(e);
  const inkPerEdge = edges.length ? totalLen / edges.length : 0;

  return { crossings, thru, novlp, lblcol, coincident, inkPerEdge,
           nodeCount: nodes.length, edgeCount: edges.length };
}

// ── Rendering with retry ──────────────────────────────────────────────────────

function renderWithRetry(engine, src, fdPath) {
  function attempt() {
    const parsed = engine.parse(src);
    const { doc, errs } = parsed;
    if (errs.length) return { ok: false, errs };
    const result = engine.render(doc);
    // EVERY SECTION, not only the first. The scene metrics below are about ONE
    // scene and rightly read the primary document, but "is this ink on the
    // page" is a question about the whole published artifact — and the answer
    // that was missing lived in a LATER section: telemetry-export's clipped
    // labels are in its `chart` section, which this gate rendered zero times.
    // A gate that reads section 1 of a 3-section figure and reports on the
    // figure is the same lie as a gate that does not recurse.
    const docs = (parsed.docs && parsed.docs.length) ? parsed.docs : [doc];
    const rs = docs.map(d => (d === doc ? result : engine.render(d)));
    // GEOMETRY-TIME REFUSAL. `render` can reject a figure that parsed cleanly
    // — a group band that would enclose a node the source never put in the
    // group is a picture that states something the document does not, so the
    // engine returns diagnostics and the artifact is never written. There is
    // then no drawing to lint, and measuring the coordinates the engine
    // computed on the way to refusing would score ink no reader will ever see.
    const gerrs = rs.reduce((a, r) => a.concat(r.errs || []), []);
    if (gerrs.length) return { ok: false, refused: true, errs: gerrs };
    return { ok: true, svg: result.svg, svgs: rs.map(r => r.svg), doc };
  }
  try {
    return attempt();
  } catch (err) {
    console.error(`  render error on ${fdPath}: ${err.message} — retrying in 30s`);
    // Synchronous 30 s sleep (Node.js, no external deps).
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) { /* spin */ }
    try {
      return attempt();
    } catch (err2) {
      return { ok: false, errs: ['render threw: ' + err2.message] };
    }
  }
}

// ── SVG coordinate extraction (handle the translate wrapper) ──────────────────

function parseTranslate(svgText) {
  const m = svgText.match(/<g transform="translate\(([^)]+),([^)]+)\)"/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
}

function analyzeSvg(svgText, doc) {
  const [tx, ty] = parseTranslate(svgText);
  const nodes   = extractNodes(svgText, tx, ty);
  const groups  = extractGroups(svgText, tx, ty);
  const edges   = extractEdges(svgText, tx, ty);
  const labels  = extractLabels(svgText, tx, ty);
  const m = computeMetrics(edges, nodes, groups, labels);
  const f5 = computeF5(svgText, tx, ty, edges, nodes, labels);
  m.f5 = f5.flagged.length;
  m.f5Flagged = f5.flagged;
  m.f5Considered = f5.considered;
  const f6 = computeF6(svgText, tx, ty, edges, doc);
  m.f6 = f6.flagged.length;
  m.f6Flagged = f6.flagged;
  m.f6Considered = f6.considered;
  const al = computeAlign(doc, nodes);
  m.align           = al.count;
  m.alignConsidered = al.considered;
  m.alignSelfLoops  = al.selfLoops;
  m.alignUnresolved = al.unresolved;
  return m;
}

// ── File collection ───────────────────────────────────────────────────────────

// Directory names never descended into, whatever root is given. Each one is
// named with its reason so the exclusion is VISIBLE in the run header rather
// than implied by a file simply not appearing in the table.
const PRUNED_DIRS = {
  'node_modules': 'third-party packages',
  '.git':         'version-control internals',
};

// Roots this gate deliberately does not judge by default. Printed on every run
// so "absent from the table" is never the only evidence of an exclusion.
const NOT_JUDGED = [
  ['conformance/',          'error-model fixtures — most are INVALID on purpose'],
  ['tools/migrate-fixtures/', 'migration fixtures — inputs are pre-migration by design'],
  ['archive/', 'frozen releases'],
  ['read/',    'frozen releases'],
];

// ── F5 RATCHET BASELINE (spec/core.md §14) ────────────────────────────────────
// F5 lands ADVISORY. The 7 labels below are REAL defects, not false positives —
// the list is the honest state and no filter or M was weakened to shrink it.
// They are TOLERATED here (a warning, never a failure) because every one sits in
// a figure still under layout repair: the DEFECT is the placement, and only
// label-aware placement — the engine-backlog items 26/27, the frontier the
// floor MEASURES but does not FIX — can clear them.
//
// The ratchet fails on REGRESSION, not on the residue. A figure whose current
// F5 count EXCEEDS its baseline — including a currently-clean figure (baseline 0)
// that gains its first F5 defect — fails the gate immediately, in --strict and
// out of it, so a NEW ambiguity in a clean figure is caught the moment it lands
// while the filed residue is not masked as clean. When items 26/27 clear a
// figure, lower its entry (to 0, then delete it); when all reach 0, F5 becomes a
// hard --strict 0 and the ratchet is retired. Keys are paths relative to the
// project root, so the match is CWD-independent.
//
// AN ENTRY THAT NOTHING MEASURES IS REMOVED, NOT KEPT AT ITS LAST VALUE.
// `examples/layout-compare/srl-evpn-irb-auto.fd` held `1` (`e1/12.24`) until
// 0.3 made the figure a geometry refusal: it is now skipped under
// `geometry-refused`, so its baseline is consulted by no run and asserts a
// measurement that no longer exists. Leaving it would also make the ratchet's
// own retirement condition — every entry at 0 — unreachable by a figure that
// cannot be measured at all. Its number is recorded HERE rather than deleted
// (a removed entry with no note is how a later reader re-discovers a defect as
// if it were new): if group-aware rank assignment lands and the figure renders
// again (engine-backlog item 32), it returns with F5 1 on `e1/12.24` —
// restore the entry in the same commit, because the ratchet would otherwise
// read a pre-existing defect as a regression against baseline 0.
// AN ENTRY CLEARED BY A PIN CHANGE IS REMOVED IN THE SAME COMMIT, WITH ITS
// NUMBER KEPT HERE. `examples/showcase/tcp-state-machine.fd` held `1`
// (`rcv ACK of FIN / x`, the TIME-WAIT convergence, 0.5 px of margin) from the
// ratchet's first day until this release, when three pins moved — CLOSED right,
// LISTEN down, CLOSING up and right — and the figure measured F5 0 with lblcol
// also 0 and a score of 0. This is the second removal and it is a DIFFERENT
// kind from srl-evpn's below: that one left because nothing measures it any
// more, this one because the defect is gone. Both keep their number here, for
// the same reason — a removed entry with no note is how a later reader
// re-discovers an old defect as if it were new. If those pins are ever
// reverted, the label returns and the ratchet will read it as a REGRESSION
// against baseline 0, which is the correct reading: the placement, not the
// figure, is what cleared it.
// ── F6 RATCHET BASELINE (§14.4's frontier) ────────────────────────────────────
// Same contract as F5_BASELINE below, and populated the same way: the honest
// residue after the renderer half of engine-backlog item 45 landed. An entry is
// a TOLERATED count, never a target; a figure that exceeds its entry — or a
// clean figure that gains its first — is reported as a regression. F6 is
// ADVISORY: it is absent from score(), from --max-score and from --strict, so
// the regression is printed and does not fail the gate while the axis soaks.
const F6_BASELINE = {
  // A shaft grazing the band name at 2.8 px, not a strike. The edge is drawn
  // as a plain <line> because `routeAround` reports "boxed in" for it — the
  // detour the padded name obstacle asks for is blocked by the neighbouring
  // group rects — so the router cannot clear this one and the residue is
  // honest rather than papered over. It clears when the router can leave a
  // corridor for it (engine-backlog items 26/41/44's territory).
  'examples/pvlan-flows.fd': 1, // band `Promiscuous — VID_P` — 2.8px from edge line 77
};

const F5_BASELINE = {
  // LOWERED (engine-backlog items 41/46). The long-edge corridor
  // router gives parallel returns to one target DISTINCT LANES, so the two top
  // returns that had 3 px of y between them are now 36 px apart and each names
  // one line. `need address|snd DISCOVER` and `no lease left|NAK / expiry`
  // cleared with them; 3 -> 1, and the residue is
  // `REQUEST failed|NAK/timeout → INIT` against the INIT-bound arrival fan.
  'examples/statechart/dhcp-client.fd':           1, // was 3 (saturated top band)
  // LOWERED. `rx Down` cleared: `DOWN -> UP` left the crowded
  // centre column for the free LEFT margin (item 41's occupancy rule), which is
  // the ambiguity that label was caught in. `admin disable` is the residue and
  // it is the self-loop column — item 27's.
  // CLEARED (engine-backlog items 60/61), entries DELETED per
  // the ratchet's own rule — lower it, then remove it:
  //   bfd-session's `admin disable` was the self-loop column, and its three
  //   transitions are now one merge-bus trunk with a label at each origin, so
  //   the column is gone rather than tidied;
  //   state-b's `cond3` cleared with the scorer's new F5 term — a candidate
  //   whose two NEAREST edges are within M of each other is charged, which is
  //   the gate's own question asked before the fact instead of after it.
  // Both figures now measure F5 0. A regression at either is a floor
  // violation from here, which is what deleting the entry means.
  // topology-a's `p3` cleared: engine-backlog item 42 anchors
  // endpoint labels at a fixed DISTANCE from their own port instead of a
  // fraction of the run, so the three-label cluster mid-span dissolved.
  // Entry deleted per the ratchet's own rule (lower it, then remove it).
};

// collectFd RECURSES. See the file header for what the non-recursive version
// cost. `skips` accumulates {file, reason} for anything named but not usable.
function collectFd(arg, skips) {
  const resolved = path.resolve(arg); // resolve relative to CWD
  if (!fs.existsSync(resolved)) {
    skips.push({ file: arg, reason: 'not-found' });
    return [];
  }
  if (!fs.statSync(resolved).isDirectory()) {
    // An explicitly named file. It must actually BE a .fd: handing this tool
    // an `.svg` used to feed SVG markup straight to the FigDown parser, which
    // answered with a genuine-looking parse error about line 1 of a file that
    // was never FigDown source. The tool's own input is checked here instead.
    if (!resolved.endsWith('.fd')) {
      skips.push({ file: arg, reason: 'not-a-fd-file' });
      return [];
    }
    return [resolved];
  }
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })
                      .sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (Object.prototype.hasOwnProperty.call(PRUNED_DIRS, e.name)) continue;
        walk(p);
      } else if (e.name.endsWith('.fd')) {
        out.push(p);
      }
    }
  })(resolved);
  return out;
}

// ── Skip taxonomy ─────────────────────────────────────────────────────────────
// Every reason a `.fd` can be considered and not scored. The coverage line
// prints ALL of these on every run, zero or not — a reason that appears only
// when non-zero is a reason nobody knows the tool has.
const SKIP_REASONS = [
  ['parse-error',            'the engine rejected the source'],
  ['render-error',           'render() threw'],
  ['geometry-refused',       'render() refused the figure — no drawing to measure'],
  ['geometry-error',         'the SVG reader failed on the output'],
  ['no-scene-in-scene-genre','scene genre rendered 0 nodes and 0 edges'],
  ['unreadable',             'file could not be read'],
  ['not-a-fd-file',          'named on the command line but not a .fd'],
  ['not-found',              'path does not exist'],
  ['no-scene-genre',         'bitfield/table/timing/chart — nothing to measure'],
];

// Reasons that mean "the tool could not read this figure". These fail --strict:
// an unscored figure is otherwise indistinguishable from a clean one. The one
// reason NOT in this set is `no-scene-genre`, which is a correct answer rather
// than a failure to answer — a bitfield has no edges to cross. It is still
// counted and named on every run, so it is no longer silent either.
const STRICT_SKIPS = new Set([
  'parse-error', 'render-error', 'geometry-error',
  'no-scene-in-scene-genre', 'unreadable', 'not-a-fd-file', 'not-found',
]);

// Genres whose figures HAVE scene geometry (engine: GENRE_NODE_KW plus
// statechart). Used only to classify an empty render.
//
// `sequence` is in this set even though the ladder is NOT the
// scene renderer: what the set actually decides is whether an EMPTY render is
// a correct answer or a defect. A bitfield has no nodes and no edges by
// construction; a sequence figure has a `data-node` per lifeline and a
// `stroke-width="1.6"` shaft per message, so nothing drawn means the tool
// rendered a ladder and found none of it — a `no-scene-in-scene-genre` strict
// skip, never the silent `no-scene-genre`.
const SCENE_GENRES = new Set(['block', 'topology', 'flowchart', 'statechart', 'sequence']);

// ── Formatting helpers ────────────────────────────────────────────────────────

// `offcv` carries the HEAVIEST weight in this function, above `thru` and
// `novlp`. Every other term measures text or lines that are hard to read; this
// one measures text that is NOT THERE. The engine's own note-placement pass
// already states the ranking — an annotation the author wrote and the reader
// never sees is "the worst outcome available" — and the score should agree
// with it rather than rank a clipped label below a crossing.
//
// `align` and `f5` are DELIBERATELY ABSENT from this sum. Both are advisory:
// `f5` is a floor rule under a ratchet, and `align` is a readability signal
// whose own measured contribution to a placement objective was small and needed
// two guards to stop it making figures worse. Neither may move a figure's rank,
// and neither may fail the gate. They are columns, not terms.
function score(m) {
  return m.crossings * 2 + m.thru * 3 + m.novlp * 3 + m.lblcol * 2 + m.coincident * 2
       + (m.offcv || 0) * 4;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}
function lpad(s, n) {
  s = String(s);
  return s.length >= n ? s : ' '.repeat(n - s.length) + s;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);

  // Parse flags
  let maxScore = Infinity;
  let strict = false, verbose = false;
  const inputs = [];
  for (const a of argv) {
    const ms = a.match(/^--max-score=(\d+)$/);
    if (ms) { maxScore = parseInt(ms[1], 10); continue; }
    if (a === '--strict')  { strict  = true; continue; }
    if (a === '--verbose') { verbose = true; continue; }
    if (a.startsWith('--')) { console.error('unknown flag: ' + a); process.exit(2); }
    inputs.push(a);
  }

  // Default search paths when none given — resolved relative to the project
  // root (one level up from this script) so the tool works from any CWD.
  // Both are walked RECURSIVELY; `examples/patterns` no longer needs naming
  // because it is reached by the walk, and so are the four sibling directories
  // the old hard-coded list silently omitted.
  const projectRoot = path.join(__dirname, '..');
  const searchPaths = inputs.length
    ? inputs
    : [
        path.join(projectRoot, 'examples'),
        path.join(projectRoot, 'figures'),
      ];

  const enginePath = findEngine();
  if (!enginePath) {
    console.error('figdown.html not found (set $FIGDOWN_HTML or keep it next to this script)');
    process.exit(2);
  }

  let engine;
  try {
    engine = loadEngine(enginePath);
  } catch (err) {
    console.error('Failed to load engine: ' + err.message);
    process.exit(2);
  }

  // Collect all .fd files
  const skips = [];                   // {file, reason, detail}
  const files = [];
  for (const sp of searchPaths) {
    for (const f of collectFd(sp, skips)) {
      if (!files.includes(f)) files.push(f);
    }
  }

  const collectSkipCount = skips.length;   // not-found / not-a-fd-file, from the walk

  console.log('layout-lint  engine=' + path.relative(projectRoot, enginePath)
              + ' (' + (engine.FIGDOWN_VERSION || 'unknown') + ')'
              + '  files=' + files.length);
  console.log('  ' + (inputs.length ? 'given:              ' : 'searched (recursive):') + ' '
              + searchPaths.map(p => path.relative(projectRoot, p) || '.').join('  '));
  if (!inputs.length) {
    console.log('  not judged by default, by design:');
    for (const [root, why] of NOT_JUDGED)
      console.log('    ' + pad(root, 26) + why);
  }
  console.log('');

  const rows = [];
  const offCanvas = [];

  for (const fdPath of files) {
    const rel = path.relative(process.cwd(), fdPath);
    let src;
    try { src = fs.readFileSync(fdPath, 'utf8'); }
    catch (e) { skips.push({ file: rel, reason: 'unreadable', detail: e.message }); continue; }

    const result = renderWithRetry(engine, src, fdPath);
    if (!result.ok) {
      const detail = result.errs[0];
      const reason = result.refused ? 'geometry-refused'
        : (detail && detail.startsWith('render threw:')) ? 'render-error' : 'parse-error';
      skips.push({ file: rel, reason, detail });
      continue;
    }

    let metrics;
    try { metrics = analyzeSvg(result.svg, result.doc); }
    catch (e) {
      skips.push({ file: rel, reason: 'geometry-error', detail: e.message });
      continue;
    }

    // Off-canvas is measured across every section, and it is measured BEFORE
    // the no-scene-genre skip below. A bitfield or chart figure has no edges to
    // cross and is correctly not scored for crossings — but it has text, and
    // text can fall off the page. Skipping the file entirely is how the two
    // `chart` sections stayed invisible to this gate.
    const off = [];
    for (const s of (result.svgs || [result.svg]))
      for (const h of offCanvasText(s)) off.push({ file: rel, ...h });
    offCanvas.push(...off);
    metrics.offcv = off.length;

    if (metrics.nodeCount === 0 && metrics.edgeCount === 0 && !off.length) {
      // No scene geometry. For bitfield/table/timing/chart that is the CORRECT
      // outcome — those genres have no nodes or edges to measure — so it is
      // reported and not failed. For a scene genre it means the tool rendered
      // the figure and found nothing, which is a defect and IS failed.
      const genre = (result.doc && result.doc.genre) || 'unknown';
      skips.push({
        file: rel,
        reason: SCENE_GENRES.has(genre) ? 'no-scene-in-scene-genre' : 'no-scene-genre',
        detail: 'genre=' + genre,
      });
      continue;
    }

    rows.push({ file: rel, relRoot: path.relative(projectRoot, fdPath),
                ...metrics, score: score(metrics) });
  }

  // Sort worst-first by weighted score.
  rows.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  // Print aligned table.
  const COL = {
    file:       50,   // paths are now up to `examples/reference/experimental/…`
    nodes:       5,
    edges:       5,
    cross:       5,
    thru:        4,
    novlp:       5,
    lblcol:      6,
    offcv:       5,
    coinc:       5,
    f5:          4,
    f6:          4,
    align:       6,
    ink:         7,
    score:       5,
  };

  const header = [
    pad('file',    COL.file),
    lpad('nodes',  COL.nodes),
    lpad('edges',  COL.edges),
    lpad('cross',  COL.cross),
    lpad('thru',   COL.thru),
    lpad('novlp',  COL.novlp),
    lpad('lblcol', COL.lblcol),
    lpad('offcv',  COL.offcv),
    lpad('coinc',  COL.coinc),
    lpad('f5',     COL.f5),
    lpad('f6',     COL.f6),
    lpad('align',  COL.align),
    lpad('ink/e',  COL.ink),
    lpad('score',  COL.score),
  ].join('  ');

  const sep = '-'.repeat(header.length);
  console.log(sep);
  console.log(header);
  console.log(sep);
  if (!rows.length) console.log('(no figure was scored)');

  let anyFail = false;
  for (const r of rows) {
    const line = [
      pad(r.file,                     COL.file),
      lpad(r.nodeCount,               COL.nodes),
      lpad(r.edgeCount,               COL.edges),
      lpad(r.crossings,               COL.cross),
      lpad(r.thru,                    COL.thru),
      lpad(r.novlp,                   COL.novlp),
      lpad(r.lblcol,                  COL.lblcol),
      lpad(r.offcv || 0,              COL.offcv),
      lpad(r.coincident,              COL.coinc),
      lpad(r.f5 || 0,                 COL.f5),
      lpad(r.f6 || 0,                 COL.f6),
      lpad(r.align || 0,              COL.align),
      lpad(r.inkPerEdge.toFixed(0),   COL.ink),
      lpad(r.score,                   COL.score),
    ].join('  ');
    const flag = r.score > maxScore ? ' !' : '';
    console.log(line + flag);
    if (r.score > maxScore) anyFail = true;
  }

  console.log(sep);

  // ── COVERAGE. Printed on EVERY run, every reason, zero or not. ─────────────
  // The old tail printed error counts only when non-zero and dropped empty
  // renders on a bare `continue`, so "clean" and "I could not read any of
  // them" were the same output. They are now different by construction.
  const byReason = new Map(SKIP_REASONS.map(([r]) => [r, []]));
  for (const s of skips) {
    if (!byReason.has(s.reason)) byReason.set(s.reason, []);
    byReason.get(s.reason).push(s);
  }
  // "considered" = every path this run looked at: the .fd files the walk found,
  // plus the paths named on the command line that could not become one.
  const considered = files.length + collectSkipCount;

  console.log('considered ' + considered
            + '  scored ' + rows.length
            + '  skipped ' + skips.length);
  for (const [reason, why] of SKIP_REASONS) {
    const hits = byReason.get(reason) || [];
    console.log('  ' + pad(reason, 26) + lpad(hits.length, 3)
              + '   ' + why + (STRICT_SKIPS.has(reason) ? '  [fails --strict]' : ''));
    if (hits.length && (verbose || STRICT_SKIPS.has(reason))) {
      for (const h of hits)
        console.log('      ' + h.file + (h.detail ? ' — ' + h.detail : ''));
    }
  }

  // ── OFF-CANVAS FINDINGS, named one by one ─────────────────────────────────
  // A count in a column is enough for a defect of DEGREE — one more crossing is
  // worse than none and an author can go and look. Ink that is not on the page
  // is not a matter of degree: the author cannot see what is missing BY
  // LOOKING AT THE FIGURE, which is the whole reason it went unnoticed. So each
  // one is named, with how far out and how much of it is gone.
  //
  // AND IT FAILS --strict, unlike every score above it. The scores rank figures
  // that could be better; this says a figure does not show what its source
  // says. That is the same class as "the tool could not read it", which is
  // already the strict bar here.
  if (offCanvas.length) {
    console.log('');
    console.log('OFF-CANVAS TEXT — drawn outside the section\'s own <svg> box, so a reader');
    console.log('sees a sliver or nothing:');
    let last = null;
    for (const h of offCanvas) {
      if (h.file !== last) { console.log('  ' + h.file); last = h.file; }
      console.log('      ' + lpad(h.outPx.toFixed(1) + 'px', 8) + ' out, '
                + lpad((h.frac * 100).toFixed(0) + '%', 4) + ' of the box gone   '
                + JSON.stringify(h.text.length > 60 ? h.text.slice(0, 57) + '...' : h.text));
    }
    console.log('  The canvas grows right and down only, so text placed at a negative');
    console.log('  coordinate is CLIPPED, never merely misplaced. Reserve the room in the');
    console.log('  renderer (the origin moves; the label does not) rather than nudging the');
    console.log('  text somewhere it no longer names what it is beside.');
    if (strict) anyFail = true;
  }

  // ── F5 RATCHET — legibility floor §14, advisory now, fails on REGRESSION ────
  // Printed on every run, whether or not anything is flagged, with its
  // denominator (edge labels considered) beside the flagged count — the
  // denominator is stated so "F5 0" can never mean "the axis looked at nothing".
  {
    let considered = 0, flagged = 0;
    const residue = [], regressed = [], cleared = [];
    for (const r of rows) {
      considered += (r.f5Considered || 0);
      flagged    += (r.f5 || 0);
      const base = F5_BASELINE[r.relRoot] || 0;
      if (r.f5 > base)
        regressed.push({ file: r.relRoot, base, now: r.f5, labels: r.f5Flagged || [] });
      else if (r.f5 > 0)
        residue.push({ file: r.relRoot, now: r.f5, base, labels: r.f5Flagged || [] });
      else if (base > 0)
        cleared.push({ file: r.relRoot, base });
    }
    console.log('');
    console.log('F5 — label-association margin (legibility floor §14; ADVISORY ratchet, M='
                + F5_M + 'px, measured from the label box centre):');
    console.log('  ' + flagged + ' flagged / ' + considered
                + ' edge labels considered   (a label < ' + F5_M
                + 'px from telling two edges apart is ambiguous)');
    for (const x of residue)
      console.log('  baseline  ' + pad(x.file, 46) + 'F5 ' + x.now + '/' + x.base
                  + '  ' + x.labels.map(t => JSON.stringify(t.replace(/\n/g, '|'))).join(', '));
    for (const x of cleared)
      console.log('  cleared   ' + pad(x.file, 46) + 'F5 0/' + x.base
                  + '  — baseline may be lowered');
    console.log('  baseline residue is the item-26/27 layout-repair set; it is TOLERATED,');
    console.log('  never masked as clean. F5 becomes a hard --strict 0 when it reaches 0.');
    if (regressed.length) {
      console.log('');
      console.log('F5 REGRESSION — a figure gained an F5 defect over its ratchet baseline:');
      for (const x of regressed)
        console.log('  ' + pad(x.file, 46) + 'F5 ' + x.now + ' > baseline ' + x.base
                    + '   ' + x.labels.map(t => JSON.stringify(t.replace(/\n/g, '|'))).join(', '));
      console.log('  A new ambiguity in a clean figure is a floor violation and fails this');
      console.log('  gate now (the ratchet catches new defects immediately). Fix the');
      console.log('  placement; do not raise the baseline to silence it.');
      anyFail = true;
    }
  }

  // ── F6 — element-label / foreign-edge margin, ADVISORY, §14.4's frontier ───
  // Printed with its denominator on every run, for F5's reason: `F6 0` must
  // never be able to mean "the axis looked at nothing".
  {
    let flagged = 0, considered = 0;
    const residue = [], regressed = [], cleared = [];
    for (const r of rows) {
      considered += (r.f6Considered || 0);
      flagged    += (r.f6 || 0);
      const base = F6_BASELINE[r.relRoot] || 0;
      if (r.f6 > base) regressed.push({ file: r.relRoot, base, now: r.f6, labels: r.f6Flagged || [] });
      else if (r.f6 > 0) residue.push({ file: r.relRoot, now: r.f6, base, labels: r.f6Flagged || [] });
      else if (base > 0) cleared.push({ file: r.relRoot, base });
    }
    console.log('');
    console.log('F6 — element-label / foreign-edge margin (§14.4 frontier; ADVISORY ratchet, M='
                + F6_M + 'px, measured to the label BOX):');
    console.log('  ' + flagged + ' flagged / ' + considered
                + ' element labels considered   (node, external and band names; a foreign');
    console.log('  shaft within ' + F6_M + 'px of a label the element did not draw invites the'
                + ' wrong reading)');
    for (const x of residue)
      console.log('  baseline  ' + pad(x.file, 46) + 'F6 ' + x.now + '/' + x.base
                  + '  ' + x.labels.join(', '));
    for (const x of cleared)
      console.log('  cleared   ' + pad(x.file, 46) + 'F6 0/' + x.base + '  — baseline may be lowered');
    for (const x of regressed)
      console.log('  REGRESSED ' + pad(x.file, 46) + 'F6 ' + x.now + ' > baseline ' + x.base
                  + '  ' + x.labels.join(', '));
    console.log('  This axis DOES NOT GATE while it soaks: not in score(), not in');
    console.log('  --max-score, not in --strict. It becomes a floor rule when it reaches 0,');
    console.log('  by the route F5 is taking.');
  }

  // ── align — axis-free orthogonality, ADVISORY, WIRED INTO NOTHING ──────────
  // Printed on every run with its denominator beside it, whether or not
  // anything is flagged, for the same reason F5 prints its own: `align 0` must
  // never be able to mean "the axis looked at nothing". It states in the output
  // that it does not gate, so a reader of a run cannot mistake it for a floor.
  {
    let flagged = 0, considered = 0, loops = 0, unres = 0, clean = 0;
    for (const r of rows) {
      flagged    += (r.align || 0);
      considered += (r.alignConsidered || 0);
      loops      += (r.alignSelfLoops || 0);
      unres      += (r.alignUnresolved || 0);
      if (r.alignConsidered && !r.align) clean++;
    }
    console.log('');
    console.log('align — axis-free orthogonality (ADVISORY, TOL=' + ALIGN_TOL
              + 'px: an edge whose two node CENTRES differ by more than TOL on');
    console.log('  BOTH axes is neither horizontal nor vertical, so the reader traces a staircase):');
    console.log('  ' + flagged + ' flagged / ' + considered
              + ' edges between two placed nodes   ('
              + clean + ' of ' + rows.filter(r => r.alignConsidered).length
              + ' figures with edges score 0)');
    console.log('  ' + loops + ' self-loop(s) excluded by definition; ' + unres
              + ' edge(s) had an endpoint that is not a placed node');
    console.log('  This axis DOES NOT GATE. It is not in score(), not in --max-score, not in');
    console.log('  --strict: a readability signal, not a floor rule. It is also not derived');
    console.log('  from `flow`, which is load-bearing — a flow-axis term calls a one-rank');
    console.log('  figure with a clean cross-flow edge misaligned, and the corpus has those.');
  }

  const unread = skips.filter(s => STRICT_SKIPS.has(s.reason));
  if (unread.length) {
    console.log('');
    console.log((strict ? 'FAIL' : 'WARN') + '  ' + unread.length
              + ' figure(s) were considered and NOT scored for a reason that means'
              + ' the tool could not read them.');
    if (!strict) console.log('      (run with --strict to make this an exit-1 failure)');
    if (strict) anyFail = true;
  } else {
    console.log('');
    console.log('OK  every figure the gate judges was either scored or is a'
              + ' non-scene genre with nothing to measure');
  }

  process.exit(anyFail ? 1 : 0);
}

main();
