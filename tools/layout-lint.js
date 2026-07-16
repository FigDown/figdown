#!/usr/bin/env node
// layout-lint.js — render-quality linter for FigDown figures
// Loads the FigDown engine the same way build-svg.js does, renders each .fd in
// memory, extracts geometry from the SVG, and reports layout defects.
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
  // eslint-disable-next-line no-new-func
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render};');
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

// Parse a <path d="..."> "M x y L x y L x y ..." into an array of [x,y] points.
function parsePath(d) {
  const pts = [];
  // normalise: replace commas/multiple spaces with single space, trim leading M
  const tokens = d.trim().replace(/,/g, ' ').replace(/\s+/g, ' ').split(' ');
  let i = 0, cx = 0, cy = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'M' || t === 'L') { i++; continue; }
    if (/^[A-Za-z]$/.test(t))   { i++; continue; }
    const x = parseFloat(t), y = parseFloat(tokens[i + 1] || '0');
    if (!isNaN(x) && !isNaN(y)) {
      pts.push([x, y]);
      cx = x; cy = y;
    }
    i += 2;
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
    // Find the shape element immediately inside this group: rect/ellipse/polygon/circle
    // Search from m.index forward for the first shape tag.
    const after = svgText.slice(m.index + m[0].length, m.index + m[0].length + 600);
    let x = gx, y = gy, w = 60, h = 36; // fallback

    const rRect = after.match(/<rect x="([^"]*)" y="([^"]*)" width="([^"]*)" height="([^"]*)"/);
    const rEll  = after.match(/<ellipse cx="([^"]*)" cy="([^"]*)" rx="([^"]*)" ry="([^"]*)"/);
    const rPoly = after.match(/<polygon points="([^"]*)"/);
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
  const lineRe = /<line x1="([^"]*)" y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"[^/]*stroke-width="1\.6"[^/]*\/>/g;
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
  const pathRe = /<path d="([^"]*)" fill="none" stroke="[^"]*" stroke-width="1\.6"[^/]*\/>/g;
  while ((m = pathRe.exec(svgText)) !== null) {
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
    edges.push({ segs });
  }

  return edges;
}

// Extract edge-label text bounding boxes (approximate).
// Labels are <text> elements NOT inside a data-node group.
// We use: chars * 6.5 wide, 12 tall, anchored at the text x,y (y is baseline, so top = y-12).
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
  const textRe = /<text x="([^"]*)" y="([^"]*)"[^>]*font-size="(1[01])"[^>]*>([^<]*)</g;
  let tm;
  while ((tm = textRe.exec(svgText)) !== null) {
    if (inNode(tm.index)) continue;
    const x    = parseFloat(tm[1]) + tx;
    const y    = parseFloat(tm[2]) + ty;
    const text = tm[4];
    if (!text.trim()) continue;
    const key = x.toFixed(2) + ',' + y.toFixed(2) + ',' + text;
    if (seen.has(key)) continue;
    seen.add(key);
    const charW = 6.5, h = 12;
    const w = text.length * charW;
    // x is the anchor; text-anchor might be "middle" or "start" — both occur.
    // Conservatively use the position as the left edge (start), which is the
    // common case for edge labels that could collide.
    labels.push({ x, y: y - h, w, h, text });
  }
  return labels;
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

  // 4. lblcol — edge label bounding-box overlaps
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

  // 5. coincident — distinct edges with collinear segments overlapping > 10px
  let coincident = 0;
  for (let i = 0; i < edges.length; i++) {
    let found = false;
    for (let j = i + 1; j < edges.length && !found; j++) {
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
    const { doc, errs } = engine.parse(src);
    if (errs.length) return { ok: false, errs };
    const result = engine.render(doc);
    return { ok: true, svg: result.svg };
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
  const m = svgText.match(/<g transform="translate\(([^,)]+),([^)]+)\)"/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
}

function analyzeSvg(svgText) {
  const [tx, ty] = parseTranslate(svgText);
  const nodes   = extractNodes(svgText, tx, ty);
  const groups  = extractGroups(svgText, tx, ty);
  const edges   = extractEdges(svgText, tx, ty);
  const labels  = extractLabels(svgText, tx, ty);
  return computeMetrics(edges, nodes, groups, labels);
}

// ── File collection ───────────────────────────────────────────────────────────

function collectFd(arg) {
  const resolved = path.resolve(arg); // resolve relative to CWD
  if (!fs.existsSync(resolved)) {
    console.error('warning: path not found: ' + arg);
    return [];
  }
  const st = fs.statSync(resolved);
  if (st.isDirectory()) {
    return fs.readdirSync(resolved)
      .filter(f => f.endsWith('.fd'))
      .sort()
      .map(f => path.join(resolved, f));
  }
  return [resolved];
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function score(m) {
  return m.crossings * 2 + m.thru * 3 + m.novlp * 3 + m.lblcol * 2 + m.coincident * 2;
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
  const inputs = [];
  for (const a of argv) {
    const ms = a.match(/^--max-score=(\d+)$/);
    if (ms) { maxScore = parseInt(ms[1], 10); continue; }
    if (a.startsWith('--')) { console.error('unknown flag: ' + a); process.exit(2); }
    inputs.push(a);
  }

  // Default search paths when none given — resolved relative to the project
  // root (one level up from this script) so the tool works from any CWD.
  const projectRoot = path.join(__dirname, '..');
  const searchPaths = inputs.length
    ? inputs
    : [
        path.join(projectRoot, 'examples'),
        path.join(projectRoot, 'examples', 'patterns'),
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
  const files = [];
  for (const sp of searchPaths) {
    for (const f of collectFd(sp)) {
      if (!files.includes(f)) files.push(f);
    }
  }

  if (!files.length) {
    console.error('No .fd files found in the given paths.');
    process.exit(0);
  }

  const rows = [];
  let parseErrors = 0, renderErrors = 0;

  for (const fdPath of files) {
    let src;
    try { src = fs.readFileSync(fdPath, 'utf8'); }
    catch (e) { console.error('Cannot read ' + fdPath + ': ' + e.message); continue; }

    const result = renderWithRetry(engine, src, fdPath);
    if (!result.ok) {
      if (result.errs[0] && result.errs[0].startsWith('render threw:')) renderErrors++;
      else parseErrors++;
      console.error('skip ' + path.relative(process.cwd(), fdPath) + ': ' + result.errs[0]);
      continue;
    }

    let metrics;
    try { metrics = analyzeSvg(result.svg); }
    catch (e) {
      console.error('geometry error on ' + fdPath + ': ' + e.message);
      continue;
    }

    if (metrics.nodeCount === 0 && metrics.edgeCount === 0) continue; // skip silently

    const rel = path.relative(process.cwd(), fdPath);
    rows.push({ file: rel, ...metrics, score: score(metrics) });
  }

  if (!rows.length) {
    console.log('No scene figures found (all skipped).');
    process.exit(0);
  }

  // Sort worst-first by weighted score.
  rows.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  // Print aligned table.
  const COL = {
    file:       30,
    nodes:       5,
    edges:       5,
    cross:       5,
    thru:        4,
    novlp:       5,
    lblcol:      6,
    coinc:       5,
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
    lpad('coinc',  COL.coinc),
    lpad('ink/e',  COL.ink),
    lpad('score',  COL.score),
  ].join('  ');

  const sep = '-'.repeat(header.length);
  console.log(sep);
  console.log(header);
  console.log(sep);

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
      lpad(r.coincident,              COL.coinc),
      lpad(r.inkPerEdge.toFixed(0),   COL.ink),
      lpad(r.score,                   COL.score),
    ].join('  ');
    const flag = r.score > maxScore ? ' !' : '';
    console.log(line + flag);
    if (r.score > maxScore) anyFail = true;
  }

  console.log(sep);
  if (parseErrors)  console.log('parse errors (skipped): ' + parseErrors);
  if (renderErrors) console.log('render errors (skipped): ' + renderErrors);

  process.exit(anyFail ? 1 : 0);
}

main();
