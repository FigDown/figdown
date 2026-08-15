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
  const lineRe = /<line(?: data-edge="[^"]*")? x1="([^"]*)" y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"[^/]*stroke-width="1\.6"[^/]*\/>/g;
  let m;
  while ((m = lineRe.exec(svgText)) !== null) {
    const x1 = parseFloat(m[1]) + tx, y1 = parseFloat(m[2]) + ty;
    const x2 = parseFloat(m[3]) + tx, y2 = parseFloat(m[4]) + ty;
    edges.push({ segs: [[[x1, y1], [x2, y2]]] });
  }

  // polyline <path> edges: fill="none" + stroke-width="1.6"
  // The hatch pattern line has stroke-width="2"; trunk ellipses are <ellipse>.
  // Wave/plot paths also have stroke-width="1.6" — we must filter those.
  // Scene paths appear BEFORE the <g data-node> blocks (esvg paints first).
  // Use a conservative check: path must have fill="none" and not be inside <defs>.
  //
  // Strategy: find the <g transform="translate("> content block and scan it.
  const pathRe = /<path(?: data-edge="[^"]*")? d="([^"]*)" fill="none" stroke="[^"]*" stroke-width="1\.6"([^/]*)\/>/g;
  while ((m = pathRe.exec(svgText)) !== null) {
    // A merge bus (engine, item 26 stage 1) draws ONE trunk that several edges
    // share, and every member says so with data-bus="<target>". The shared ink
    // is the convention — the junction dots are what tell the reader how many
    // lines the trunk carries — so `coincident` below does not charge two
    // members of the SAME bus for it. Coincidence between anything else,
    // including two members of two DIFFERENT buses, is scored as before.
    const busM = /\bdata-bus="([^"]*)"/.exec(m[2] || '');
    // skip the arrowhead path (M0,0 L10,5 L0,10 z — it lives in <defs>)
    const d = m[1];
    if (d.includes('z') || d.includes('Z')) continue;
    const pts = parsePath(d);
    if (pts.length < 2) continue;
    // translate coordinates
    const tpts = pts.map(p => [p[0] + tx, p[1] + ty]);
    // decompose polyline into individual segments
    const segs = [];
    for (let i = 0; i + 1 < tpts.length; i++) segs.push([tpts[i], tpts[i + 1]]);
    edges.push({ segs, bus: busM ? busM[1] : null });
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
    // Body is either bare text (single line) or a run of <tspan>s (one per line).
    let lines;
    if (body.indexOf('<tspan') >= 0) {
      lines = [];
      const sp = /<tspan[^>]*>([\s\S]*?)<\/tspan>/g;
      let sm; while ((sm = sp.exec(body)) !== null) lines.push(sm[1]);
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
    const isEdge = [...halos].some(k => {
      const i2 = k.lastIndexOf(',');
      if (k.slice(i2 + 1) !== L.text) return false;
      const hx = parseFloat(k.slice(0, i2).split(',')[0]);
      const hy = parseFloat(k.slice(0, i2).split(',')[1]);
      return hx >= L.x - 1 && hx <= L.x + L.w + 1 && hy >= L.y - 1 && hy <= L.y + L.h + 14;
    });
    if (!isEdge) continue;
    const C = [L.x + L.w / 2, L.y + L.h / 2];
    // filter (1): per-EDGE min distance, so a bent edge is one edge.
    const ds = edges.map(e => ({ e, d: f5EdgeMin(C, e) })).sort((a, b) => a.d - b.d);
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
    const svgs = docs.map(d => (d === doc ? result : engine.render(d)).svg);
    return { ok: true, svg: result.svg, svgs, doc };
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

function analyzeSvg(svgText) {
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
// F5 lands ADVISORY. The 9 labels below are REAL defects, not false positives —
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
const F5_BASELINE = {
  'examples/statechart/dhcp-client.fd':           3, // saturated top band; label-aware placement only
  'examples/statechart/bfd-session.fd':           2, // `rx Down`,`admin disable` — DOWN/INIT/UP column (item 26/27)
  'examples/showcase/tcp-state-machine.fd':       1, // `rcv ACK of FIN / x` — TIME-WAIT convergence (0.5px margin)
  'examples/layout-compare/srl-evpn-irb-auto.fd': 1, // `e1/12.24` — auto-layout comparison figure
  'examples/patterns/state-b.fd':                 1, // `cond3` — IDLE fan, item-26 stranded-label figure
  'examples/patterns/topology-a.fd':              1, // `p3` — port labels at a link crossing
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
const SCENE_GENRES = new Set(['block', 'topology', 'flowchart', 'statechart']);

// ── Formatting helpers ────────────────────────────────────────────────────────

// `offcv` carries the HEAVIEST weight in this function, above `thru` and
// `novlp`. Every other term measures text or lines that are hard to read; this
// one measures text that is NOT THERE. The engine's own note-placement pass
// already states the ranking — an annotation the author wrote and the reader
// never sees is "the worst outcome available" — and the score should agree
// with it rather than rank a clipped label below a crossing.
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
      const reason = (detail && detail.startsWith('render threw:'))
        ? 'render-error' : 'parse-error';
      skips.push({ file: rel, reason, detail });
      continue;
    }

    let metrics;
    try { metrics = analyzeSvg(result.svg); }
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
