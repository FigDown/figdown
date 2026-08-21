#!/usr/bin/env node
// stability-check.js — axiom-3 evidence harness for FigDown
// Measures "local edit → local change": applies single-line edits to each
// scene .fd and reports how far pre-existing nodes move (displacement), with
// special focus on SPILLOVER = max displacement of nodes NOT adjacent to the
// edit.
//
// Usage:
//   node tools/stability-check.js [--strict] [--verbose] [--max-spillover=N]
//                                 [<file.fd | dir> ...]
//
// Default roots when none are given: examples/  figures/ — WALKED RECURSIVELY.
// Exits 1 if --max-spillover=N is set and any figure×edit exceeds it, if any
// pinned node moves (a VIOLATION, always reported), or — under --strict — if
// an in-scope figure could not be read.
//
// COVERAGE IS UNCONDITIONAL. Until 0.3 the line `Figures processed: N
// skipped: M` sat inside `if (processed)`, and `No pinned-node violations.`
// inside its `else if (processed)` — so a run that processed NOTHING printed
// neither, and exited 0. Silence was the success signal and the total-failure
// signal at the same time.
'use strict';

const fs   = require('fs');
const path = require('path');
const corpus = require('./lib/corpus.js');

// ── Engine lookup (same order as build-svg.js / layout-lint.js) ──────────────

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

// ── Rendering with retry (30 s on throw, then skip) ───────────────────────────

function renderOnce(engine, src) {
  const { doc, errs } = engine.parse(src);
  if (errs.length) return { ok: false, errs };
  const result = engine.render(doc);
  // THE SCENE ORIGIN IS REPORTED, AND THIS GATE HAS TO SUBTRACT IT.
  // Several passes move the WHOLE scene by one uniform offset so ink that
  // belongs off the low side of the canvas has somewhere to be drawn — a
  // left-pointing boundary label (`bShift`), a ring return row above the top
  // rank (`chShift`), a long-edge corridor on the low margin (`lShift`/
  // `tShift`). None of them reflows anything: relative geometry,
  // pins included, is preserved exactly, and `meta.left`/`meta.top` exist so
  // the editor's drag->pin round-trip stays stable. Measured in RAW svg
  // coordinates a uniform shift reads as "every pinned node moved", which is
  // the opposite of what this gate is asking. `patterns/block-b` hit it first:
  // pinning one more node let a corridor be adopted, the scene shifted 25.5 px,
  // and two pins that had not reflowed at all were reported as violations.
  return { ok: true, svg: result.svg,
           org: [ (result.sceneMeta && result.sceneMeta.left) || 0,
                  (result.sceneMeta && result.sceneMeta.top)  || 0 ] };
}

function renderWithRetry(engine, src, label) {
  try {
    return renderOnce(engine, src);
  } catch (err) {
    process.stderr.write('  render error (' + label + '): ' + err.message + ' — retrying in 30s\n');
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) { /* spin */ }
    try {
      return renderOnce(engine, src);
    } catch (err2) {
      return { ok: false, errs: ['render threw: ' + err2.message] };
    }
  }
}

// ── SVG node-position extraction ──────────────────────────────────────────────
// Returns an array of { id, x, y } where x/y are the data-x/data-y values
// (these are the layout-space coordinates of each node, as written by the
// engine's renderer at line:
//   nsvg.push('<g data-node="'+n.id+'" data-x="'+n.x+'" data-y="'+n.y+'"...')
// These are stable, deterministic, and do not include the translate wrapper.

function extractNodePositions(svgText) {
  const nodes = [];
  const re = /<g data-node="([^"]*)" data-x="([^"]*)" data-y="([^"]*)"/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    nodes.push({ id: m[1], x: parseFloat(m[2]), y: parseFloat(m[3]) });
  }
  return nodes;
}

// Extract canvas size from the <svg> root element.
function extractCanvasSize(svgText) {
  const mW = svgText.match(/\bwidth="(\d+(?:\.\d+)?)"/);
  const mH = svgText.match(/\bheight="(\d+(?:\.\d+)?)"/);
  return {
    w: mW ? parseFloat(mW[1]) : 0,
    h: mH ? parseFloat(mH[1]) : 0,
  };
}

// ── .fd source analysis ───────────────────────────────────────────────────────
// These functions read the raw source to understand what nodes exist, which are
// pinned, and how to generate deterministic edits.

// Return a list of { id, label, line, hasPinLine, hasPinAt, colorOption, groupId }
// for all node lines in the source.  colorOption = true if the node already has
// fill=.  groupId = the `in=` group value if present.
//
// ELEMENT-GEOMETRY-DIRECTIVE split one question into two, and they are NOT the same:
//   hasPinAt    the node has a POSITION — a `pin <id> … at=(x,y)`. This is what
//               "pinned" means for the violation check: only a positioned node
//               is promised not to move.
//   hasPinLine  the node has a `pin` line AT ALL, position or not. A `pin`
//               carrying only width=/height= is a legal line with no position,
//               and appending a second `pin` for the same id is a duplicate-pin
//               error — so this, not hasPinAt, is what edit (e) must avoid.
// THE NODE SET COMES FROM THE ENGINE, NOT FROM A KEYWORD THIS FILE KNOWS.
//
// Until 0.3 this matched `^node\s+(\S+)` and nothing else. `node` is the
// declaration spelling of the `block` and `topology` genres ONLY: a flowchart
// declares `terminator`/`process`/`decision` (FLOWCHART-ROLE-KEYWORDS, the role vocabulary) and a
// statechart declares `state`. So every flowchart and statechart figure parsed
// to zero node declarations and was dropped — the whole of
// `examples/statechart/`, plus `flowchart-a`/`-b`, `state-a`/`-b`,
// `packet-ingress` and `l2-forwarding-logic`: TEN figures, silently, by a gate
// whose own `isSceneGenre` correctly said all ten were scene genres.
//
// That is the same defect as the hard-coded directory list, one level down —
// a denominator chosen by a list this file wrote rather than by the language.
// The fix is the same in kind: ask the authority. `doc.nodes` is the engine's
// own answer to "what nodes does this document declare", and each entry
// carries a 1-based `line`, so the source line is recoverable for the edit
// generators without this file knowing a single genre keyword.
function parseNodes(src, doc) {
  const lines = src.split('\n');
  const pins = new Set();      // any pin line
  const pinnedAt = new Set();  // pin line carrying at=
  const nodes = [];

  // `pin` IS genre-independent — it is the layout namespace (LAYOUT-ZONE-NAMESPACE), spelled the
  // same in every genre — so reading it off the source stays correct.
  for (const ln of lines) {
    const pm = ln.match(/^pin\s+(\S+)\b/);
    if (!pm) continue;
    pins.add(pm[1]);
    if (/\bat=/.test(ln)) pinnedAt.add(pm[1]);
  }

  for (const n of doc.nodes || []) {
    const idx = (n.line || 0) - 1;          // engine `line` is 1-based
    const sourceLine = lines[idx];
    if (sourceLine === undefined) continue;

    // quotedForm is the label EXACTLY as written on that line, and `label` is
    // its RAW source text — deliberately not the engine's `n.label`, which is
    // DECODED. Labels in this corpus carry `\n` escapes (`"Host A\nwants MAC
    // for B's IP"`); re-quoting a decoded label writes a real newline into the
    // middle of a string and the engine answers `unterminated string`. The
    // engine is the authority on WHICH LINES declare nodes; the source is the
    // authority on what those lines literally say.
    const id = n.id;
    let quotedForm = id, label = id;
    const at = sourceLine.indexOf(id);
    const afterId = at < 0 ? '' : sourceLine.slice(at + id.length);
    const qm = afterId.match(/^\s*"((?:[^"\\]|\\.)*)"/);
    if (qm) {
      label = qm[1];
      quotedForm = '"' + qm[1] + '"';
    } else {
      const bm = afterId.match(/^\s*(\S+)/);
      if (bm && bm[1] && !bm[1].includes('=')) { label = bm[1]; quotedForm = bm[1]; }
    }

    nodes.push({
      id,
      label,
      quotedForm,
      line: idx,          // 0-based line index
      hasPinLine: pins.has(id),
      hasPinAt: pinnedAt.has(id),
      // Deliberately a SOURCE-LINE test, not `n.fill`: the add-color edit
      // appends `fill=` to this line, so what matters is whether this line
      // already writes one — a fill inherited from a `class` does not stop the
      // edit from being a valid one to make.
      hasColor: /\bfill=/.test(sourceLine),
      groupId: n.group || null,
      sourceLine,
      // The genre's OWN declaration spelling, read off the line that declares
      // this node. Edits that add a node reuse it instead of writing `node`.
      declKeyword: (sourceLine.match(/^\s*(\S+)/) || [null, 'node'])[1],
    });
  }
  return nodes;
}

// WHERE AN EDIT GOES IS PART OF WHETHER IT IS VALID.
//
// Every add-a-line edit used to do `src + append`, i.e. paste at end of file.
// That is wrong twice over in this corpus: a document may carry a `layout`
// zone, and CONTENT-LAYOUT-ZONE-SPLIT forbids a semantic directive after it ("`node` is a semantic
// directive — it must appear before the layout zone"); and a document may hold
// SEVERAL sections, so end-of-file is inside whatever genre the LAST section
// declares ("`node` is not allowed in genre table"). Both produced source the
// engine refused, and the refusal printed as an uncounted dash row.
//
// Semantic lines are therefore inserted directly after the last line that
// declares a node — which is inside the right section and before any layout
// zone by construction.
function insertAfter(src, idx, textLines) {
  const lines = src.split('\n');
  lines.splice(idx + 1, 0, ...textLines);
  return lines.join('\n');
}

function lastDeclIndex(nodes) {
  return nodes.reduce((m, n) => Math.max(m, n.line), -1);
}

// A document is a sequence of SECTIONS, each opened by its own `figdown
// <version> <genre>` line. A line inserted for a node in section 1 must land
// in section 1: `examples/evpn-fabric.fd` is a `topology` followed by a
// `table`, so end-of-file is inside the table, which is why the engine
// answered `"node" is not allowed in genre table` and `pin of unknown id
// "sp1"` — the id is real, the section was wrong.
function sectionBounds(src) {
  const lines = src.split('\n');
  const starts = [];
  for (let i = 0; i < lines.length; i++)
    if (/^figdown\s/.test(lines[i])) starts.push(i);
  if (!starts.length) return [{ start: 0, end: lines.length - 1 }];
  return starts.map((s, k) => ({
    start: s,
    end: (k + 1 < starts.length ? starts[k + 1] - 1 : lines.length - 1),
  }));
}

function sectionOf(src, idx) {
  for (const b of sectionBounds(src)) if (idx >= b.start && idx <= b.end) return b;
  return null;
}

// A `pin` is a LAYOUT line: it must sit after its section's `layout` opener.
// Returns where to put it and whether the opener has to be written too — a
// section with no layout zone needs one created, not a pin dropped loose.
function pinInsertPoint(src, declIdx) {
  const lines = src.split('\n');
  const sec = sectionOf(src, declIdx) || { start: 0, end: lines.length - 1 };
  let lastPin = -1, layoutIdx = -1;
  for (let i = sec.start; i <= sec.end; i++) {
    const t = lines[i].trim();
    if (/^pin\b/.test(t)) lastPin = i;
    else if (/^layout\s*(?:#.*)?$/.test(t) && layoutIdx < 0) layoutIdx = i;
  }
  if (lastPin >= 0)   return { idx: lastPin,   needsLayout: false };
  if (layoutIdx >= 0) return { idx: layoutIdx, needsLayout: false };
  // No layout zone in this section: open one at the end of the section, after
  // every semantic directive (CONTENT-LAYOUT-ZONE-SPLIT) and before the next `figdown` line.
  let end = sec.end;
  while (end > sec.start && lines[end].trim() === '') end--;
  return { idx: end, needsLayout: true };
}

// Last word-boundary occurrence of `id` in `line`, or -1. Used to rewrite an
// edge's target endpoint without disturbing a label that may contain the id as
// a substring (`locked` inside `unlocked`).
function lastIdIndex(line, id) {
  const re = new RegExp('(^|[^A-Za-z0-9_-])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        + '(?![A-Za-z0-9_-])', 'g');
  let m, best = -1;
  while ((m = re.exec(line)) !== null) best = m.index + m[1].length;
  return best;
}

// Return the set of node IDs reachable from a given node via an edge in src.
function adjacentNodeIds(nodeId, src) {
  const adj = new Set();
  const lines = src.split('\n');
  // edge lines:  edge <a> [port] <op> [label] [port] <b> [options]
  // We extract the first and last bare identifiers on the edge line.
  // The engine uses: edge <a-expr> <op> <b-expr> [options]
  // where a-expr/b-expr may contain port specs [xxx].
  // We match the two "node id" tokens by taking the content before and after
  // the arrow operator (-- / -> / <- / <-> / -[...]-> etc.)
  // The trailing group trims option keys off the b-side. `layer=` was renamed
  // `plane=`, so the old spelling was trimming nothing; an edge
  // carrying one of the live keys had its b-side read as "b plane=..." and
  // matched no node id. `points=`/`tailport=`/`headport=` left the list at
  // 0.1 (EDGE-GEOMETRY-CONSTRUCTS): they were withdrawn from the language, so a line
  // carrying one is a parse error long before it reaches this regex, and a
  // dead alternative here is the same defect in miniature.
  const edgeRe = /^edge\s+(.*?)\s+(?:<-\[([^\]]*)\]->|<->|-\[([^\]]*)\]->|<-\[([^\]]*)\]-|-\[([^\]]*)\]-|->|<-|--)\s+(.*?)(?:\s+(?:style=|fill=|stroke=|plane=|z-index=|class=).*)?\s*$/;
  for (const ln of lines) {
    const em = ln.match(edgeRe);
    if (!em) continue;
    // Strip port specs: [portname] — anything in [...]
    const aRaw = em[1].replace(/\[[^\]]*\]/g, '').trim();
    const bRaw = em[6].replace(/\[[^\]]*\]/g, '').trim();
    // Each side is just an identifier.
    if (aRaw === nodeId) adj.add(bRaw);
    if (bRaw === nodeId) adj.add(aRaw);
  }
  return adj;
}

// ── Genre classification ──────────────────────────────────────────────────────
// "Scene-bearing" genres are those that use node+edge layout.
// Pure bitfield / table / timing genres have no positionable nodes.
const SCENE_GENRES = new Set([
  'flowchart', 'block', 'topology', 'flow', // named genres
]);

function isSceneGenre(src) {
  const m = src.match(/^figdown\s+\S+\s+(\S+)/m);
  if (!m) return false;
  // flowchart and block and topology are scene genres.
  // Also include any genre that isn't clearly bitfield/table/timing.
  const g = m[1].toLowerCase();
  if (g === 'bitfield' || g === 'table' || g === 'timing') return false;
  return true; // flowchart, block, topology, and any unknown scene type
}

// ── Edit generators ───────────────────────────────────────────────────────────
// Each generator takes (src, nodes) and returns { editName, newSrc, editedNodeId }
// or null if inapplicable.  The editedNodeId is the node that was added/changed.
// For adds, it's the new node id (which won't exist in baseline, so adjacency
// is computed via the new edge if any).

// (a) Append a new unconnected node.
// Both add-a-node edits reuse the DECLARATION SPELLING THE DOCUMENT ITSELF
// USES. Writing a literal `node` here produced source the engine refused in
// every flowchart, statechart and other role-vocabulary genre — and the
// refusal printed as a "(render failed)" row that no counter read.
function editAddUnconnectedNode(src, nodes) {
  if (!nodes.length) return null;
  const newId  = '_stab_newA';
  const last   = nodes[nodes.length - 1];
  const newSrc = insertAfter(src, lastDeclIndex(nodes),
    [last.declKeyword + ' ' + newId + ' "Stability Check Node A"']);
  return { editName: 'add-unconnected', newSrc, editedNodeId: newId, newNodeId: newId };
}

// (b) Append a new node + one edge from the first existing node.
// The edge is built by CLONING an existing edge line and renaming its target,
// so the connector keeps the genre's own spelling: `flowline a -> b`,
// `transition a -[coin]-> b`, `edge a -[eBGP]- b`. The hard-coded
// `edge <a> -> <b>` this used to append is valid in `block`/`topology` and in
// no other genre.
function editAddConnectedNode(src, nodes, doc) {
  if (!nodes.length) return null;
  const e0 = (doc.edges || [])[0];
  if (!e0) return null;                       // nothing to copy the spelling from
  const lines = src.split('\n');
  const raw = lines[(e0.line || 0) - 1];
  if (raw === undefined) return null;
  const i = lastIdIndex(raw, e0.b);
  if (i < 0) return null;

  const newId  = '_stab_newB';
  const anchor = e0.a;
  const edgeLine = raw.slice(0, i) + newId + raw.slice(i + e0.b.length);
  // Both lines must land in THE CLONED EDGE'S OWN SECTION — its endpoint ids
  // exist only there. Anchor on the later of {the edge, the last node
  // declaration in that same section}, so the pair sits in the semantic zone
  // ahead of any layout zone.
  const edgeIdx = (e0.line || 1) - 1;
  const sec = sectionOf(src, edgeIdx) || { start: 0, end: src.split('\n').length - 1 };
  const inSec = nodes.filter(n => n.line >= sec.start && n.line <= sec.end);
  if (!inSec.length) return null;
  const at = Math.max(lastDeclIndex(inSec), edgeIdx);
  const newSrc = insertAfter(src, at,
    [inSec[inSec.length - 1].declKeyword + ' ' + newId + ' "Stability Check Node B"',
     edgeLine]);
  return { editName: 'add-with-edge', newSrc, editedNodeId: newId, newNodeId: newId, anchorId: anchor };
}

// (c) Change one existing node's label to a longer string.
function editChangeLabelLonger(src, nodes) {
  // Find first node whose label won't already be very long.
  const target = nodes.find(n => n.label.length < 40 && n.quotedForm && n.quotedForm !== n.id);
  if (!target) return null;
  // newLabel is always quoted (safe regardless of whether the original was bare or quoted).
  const newLabel = '"' + target.label + ' (stability-check-label-extended)"';
  // Replace the exact original form (quotedForm) with the new quoted label.
  const newSrc = src.replace(target.sourceLine, target.sourceLine.replace(
    target.quotedForm,
    newLabel,
  ));
  if (newSrc === src) return null; // replacement didn't work
  return { editName: 'longer-label', newSrc, editedNodeId: target.id };
}

// (d) Append fill= to one unstyled node.
function editAddColor(src, nodes) {
  const target = nodes.find(n => !n.hasColor);
  if (!target) return null;
  // Replace the node's source line: append fill=#e2e8f0 at the end.
  const newLine = target.sourceLine.trimEnd() + ' fill=#e2e8f0';
  const newSrc  = src.replace(target.sourceLine, newLine);
  if (newSrc === src) return null;
  return { editName: 'add-color', newSrc, editedNodeId: target.id };
}

// (e) Pin one currently-unpinned node at its current rendered position.
// We need the baseline positions for this — accept basePositions as extra arg.
// The target must have NO pin line of any kind: a second `pin` for an id that
// already has one is a duplicate-pin error, whatever keys either line carries.
function editPinUnpinned(src, nodes, basePositions) {
  const target = nodes.find(n => !n.hasPinLine);
  if (!target) return null;
  const pos = basePositions.find(p => p.id === target.id);
  if (!pos) return null;
  // `at=` takes a PAREN POINT. The bare comma pair this emitted until now was
  // retired (a bare pair reads as a list of two numbers, not a
  // point), so every (e) edit had been producing a document the engine refused
  // — silently, as one more "render failed" row in the table.
  // Placed in the LAYOUT ZONE OF THE TARGET'S OWN SECTION, beside the pins
  // already there — opening the zone if that section has none.
  const at = pinInsertPoint(src, target.line);
  const pinLine = 'pin ' + target.id + ' at=(' + Math.round(pos.x) + ',' + Math.round(pos.y) + ')';
  const newSrc = insertAfter(src, at.idx,
    at.needsLayout ? ['layout', pinLine] : [pinLine]);
  return { editName: 'pin-unpinned', newSrc, editedNodeId: target.id };
}

// ── Displacement measurement ──────────────────────────────────────────────────

function measureDisplacements(basePosMap, afterPositions) {
  // Returns array of { id, dx, dy, dist } for nodes present in both.
  const result = [];
  for (const p of afterPositions) {
    const b = basePosMap.get(p.id);
    if (!b) continue; // new node, skip
    const dx = p.x - b.x, dy = p.y - b.y;
    result.push({ id: p.id, dx, dy, dist: Math.sqrt(dx * dx + dy * dy) });
  }
  return result;
}

// ── File collection ───────────────────────────────────────────────────────────

// Enumeration lives in tools/lib/corpus.js. The private, non-recursive copy
// that used to sit here read a hard-coded `examples/`, `examples/patterns/`,
// `figures/` — the same copied line three sibling gates carried — so it opened
// 38 files, processed 16, and never opened examples/showcase/,
// examples/statechart/, examples/reference/ or examples/layout-compare/ at all.

// Skip reasons this gate adds. None fails --strict: each is a correct ANSWER
// ("there is no pinned geometry here to perturb"), not a failure to answer.
const EXTRA_REASONS = [
  ['non-scene-genre',  'bitfield/table/timing — no node positions to measure', false],
  ['no-node-decls',    'no node declarations found in source',                 false],
  ['no-positions',     'baseline render produced no positioned nodes',         false],
  ['no-edits',         'no applicable edit variant could be generated',        false],
];

// ── Formatting helpers ────────────────────────────────────────────────────────

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function lpad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(-n) : ' '.repeat(n - s.length) + s;
}

function fmtFloat(v, decimals) {
  if (!isFinite(v)) return '-';
  return v.toFixed(decimals);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);

  let maxSpillover = Infinity;
  let strict = false, verbose = false;
  const inputs = [];
  for (const a of argv) {
    const ms = a.match(/^--max-spillover=(\d+(?:\.\d+)?)$/);
    if (ms) { maxSpillover = parseFloat(ms[1]); continue; }
    if (a === '--strict')  { strict  = true; continue; }
    if (a === '--verbose') { verbose = true; continue; }
    if (a.startsWith('--')) {
      process.stderr.write('unknown flag: ' + a + '\n');
      process.exit(2);
    }
    inputs.push(a);
  }

  // The gate's DECLARED scope, walked recursively. conformance/ is not a root:
  // its fixtures test the error model, not layout stability under edits.
  const en = corpus.enumerate(['examples', 'figures'], inputs);
  corpus.assertNonEmpty(en, 'stability-check');
  const cov = new corpus.Coverage('stability-check', en, EXTRA_REASONS);

  const enginePath = findEngine();
  if (!enginePath) {
    process.stderr.write('figdown.html not found (set $FIGDOWN_HTML or keep it next to this script)\n');
    process.exit(2);
  }

  let engine;
  try {
    engine = loadEngine(enginePath);
  } catch (err) {
    process.stderr.write('Failed to load engine: ' + err.message + '\n');
    process.exit(2);
  }

  const files = en.files;
  cov.header();

  // Column widths for the output table.
  const C = {
    file:    46,   // recursive roots produce nested paths; 32 truncated them
    edit:    18,
    moved:    5,
    maxDisp:  8,
    spill:    8,
  };

  // Separator line.
  const TOTAL_W = C.file + 2 + C.edit + 2 + C.moved + 2 + C.maxDisp + 2 + C.spill;
  const SEP = '-'.repeat(TOTAL_W);

  const headerLine = [
    pad('file',         C.file),
    pad('edit',         C.edit),
    lpad('moved',       C.moved),
    lpad('maxDisp',     C.maxDisp),
    lpad('spillover',   C.spill),
  ].join('  ');

  console.log(SEP);
  console.log(headerLine);
  console.log(SEP);

  // Summary accumulators.
  const allSpillovers   = []; // for percentile computation
  const violations      = []; // pinned-node movements
  const editFailures    = []; // edit variants the engine refused to render
  let   thresholdFailed = false;
  let   processed = 0;

  for (const fdPath of files) {
    let src;
    try { src = fs.readFileSync(fdPath, 'utf8'); }
    catch (e) { cov.skip(fdPath, 'unreadable', e.message); continue; }

    // Skip non-scene genres.
    if (!isSceneGenre(src)) { cov.skip(fdPath, 'non-scene-genre'); continue; }

    const rel = corpus.rel(fdPath);

    // Parse once, up front: the node set comes from the engine (see parseNodes),
    // and a document the engine rejects is now a NAMED skip reason instead of
    // arriving later disguised as a render failure.
    let parsed;
    try { parsed = engine.parse(src); }
    catch (e) { cov.skip(fdPath, 'parse-error', 'parse threw: ' + e.message); continue; }
    if (parsed.errs && parsed.errs.length) {
      cov.skip(fdPath, 'parse-error', parsed.errs[0]);
      continue;
    }

    // Node declarations, read off the engine's own doc.
    const nodeDecls = parseNodes(src, parsed.doc);
    if (!nodeDecls.length) { cov.skip(fdPath, 'no-node-decls'); continue; }

    // Determine which nodes are pinned — POSITIONED, i.e. a pin line carrying
    // at=. A width=/height=-only pin (ELEMENT-GEOMETRY-DIRECTIVE) declares an extent, not a place,
    // and the renderer is free to move that node; asserting it must not move
    // would report a violation the language never promised.
    const pinnedIds = new Set(nodeDecls.filter(n => n.hasPinAt).map(n => n.id));

    // Step 1: Render baseline.
    const baseResult = renderWithRetry(engine, src, rel);
    if (!baseResult.ok) {
      cov.skip(fdPath, 'render-error', baseResult.errs[0] || 'unknown error');
      continue;
    }

    const basePositions = extractNodePositions(baseResult.svg);
    const baseOrg = baseResult.org || [0, 0];
    if (!basePositions.length) { cov.skip(fdPath, 'no-positions'); continue; }

    const basePosMap = new Map(basePositions.map(p => [p.id, p]));

    // Step 2: Generate the five edit variants.
    const edits = [
      editAddUnconnectedNode(src, nodeDecls),
      editAddConnectedNode(src, nodeDecls, parsed.doc),
      editChangeLabelLonger(src, nodeDecls),
      editAddColor(src, nodeDecls),
      editPinUnpinned(src, nodeDecls, basePositions),
    ].filter(Boolean);

    if (!edits.length) { cov.skip(fdPath, 'no-edits'); continue; }

    processed++;
    cov.score();

    // Step 3: For each edit, render and measure.
    for (const edit of edits) {
      const afterResult = renderWithRetry(engine, edit.newSrc, rel + ' (' + edit.editName + ')');
      if (!afterResult.ok) {
        // A VARIANT THAT WILL NOT RENDER IS A MEASUREMENT THAT DID NOT HAPPEN.
        // This row used to print a line of dashes and increment NOTHING: the
        // figure still counted as "processed", the spillover percentiles were
        // computed over whatever variants happened to survive, and the gate
        // exited 0. `editPinUnpinned` carries a comment about this exact hole
        // being found once before, for one edit — the row it hid behind was
        // never made to cost anything, so the class came straight back.
        editFailures.push({
          file: rel, edit: edit.editName,
          err: (afterResult.errs && afterResult.errs[0]) || 'unknown render error',
        });
        console.log(
          pad(rel,            C.file) + '  ' +
          pad(edit.editName,  C.edit) + '  ' +
          lpad('-', C.moved)          + '  ' +
          lpad('-', C.maxDisp)        + '  ' +
          lpad('-', C.spill)          +
          '  (render failed)',
        );
        continue;
      }

      const afterPositions = extractNodePositions(afterResult.svg);
      // normalise both renders to their own reported scene origin, so a uniform
      // shift is not read as movement
      const afterOrg = afterResult.org || [0, 0];
      const dOx = afterOrg[0] - baseOrg[0], dOy = afterOrg[1] - baseOrg[1];
      if (dOx || dOy) for (const p of afterPositions) { p.x -= dOx; p.y -= dOy; }
      const disps = measureDisplacements(basePosMap, afterPositions);

      if (!disps.length) {
        // No pre-existing nodes found in result — structural mismatch, skip.
        continue;
      }

      // Determine which nodes are "adjacent" to the edit:
      //   - the edited node itself (if it already existed)
      //   - the anchorId for add-with-edge (the node the new edge attaches to)
      //   - all nodes edge-connected to the edited node in the ORIGINAL source
      const adjacentToEdit = new Set();
      if (edit.editedNodeId) {
        adjacentToEdit.add(edit.editedNodeId);
        // If editing an existing node, include its edges.
        if (!edit.newNodeId || edit.editedNodeId !== edit.newNodeId) {
          for (const id of adjacentNodeIds(edit.editedNodeId, src)) {
            adjacentToEdit.add(id);
          }
        }
      }
      if (edit.anchorId) {
        adjacentToEdit.add(edit.anchorId);
        for (const id of adjacentNodeIds(edit.anchorId, src)) {
          adjacentToEdit.add(id);
        }
      }

      // Moved: count of pre-existing nodes that moved by > 0.5 px.
      const movedNodes = disps.filter(d => d.dist > 0.5);

      // Max displacement across all pre-existing nodes.
      const maxDisp = disps.length
        ? Math.max(...disps.map(d => d.dist))
        : 0;

      // Spillover: max displacement among nodes NOT adjacent to the edit.
      const nonAdjacentDisps = disps.filter(d => !adjacentToEdit.has(d.id));
      const spillover = nonAdjacentDisps.length
        ? Math.max(...nonAdjacentDisps.map(d => d.dist))
        : 0;

      allSpillovers.push(spillover);

      // Check pinned-node movement (VIOLATION).
      for (const d of disps) {
        if (pinnedIds.has(d.id) && d.dist > 0.5) {
          violations.push({
            file: rel, edit: edit.editName, nodeId: d.id, dist: d.dist,
          });
        }
      }

      // Threshold check.
      if (spillover > maxSpillover) thresholdFailed = true;

      const flag = spillover > maxSpillover ? '  !' : '';

      console.log(
        pad(rel,                    C.file) + '  ' +
        pad(edit.editName,          C.edit) + '  ' +
        lpad(movedNodes.length,     C.moved) + '  ' +
        lpad(fmtFloat(maxDisp, 1),  C.maxDisp) + '  ' +
        lpad(fmtFloat(spillover, 1),C.spill) +
        flag,
      );
    }
  }

  console.log(SEP);

  // Summary percentiles.
  if (allSpillovers.length) {
    const sorted = allSpillovers.slice().sort((a, b) => a - b);
    const pct = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length / 100))];
    const mean = allSpillovers.reduce((s, v) => s + v, 0) / allSpillovers.length;
    const max  = Math.max(...allSpillovers);
    console.log('');
    console.log('Spillover summary (' + allSpillovers.length + ' edit×figure pairs):');
    console.log('  mean   = ' + fmtFloat(mean, 1) + ' px');
    console.log('  p50    = ' + fmtFloat(pct(50),  1) + ' px');
    console.log('  p75    = ' + fmtFloat(pct(75),  1) + ' px');
    console.log('  p90    = ' + fmtFloat(pct(90),  1) + ' px');
    console.log('  p95    = ' + fmtFloat(pct(95),  1) + ' px');
    console.log('  max    = ' + fmtFloat(max,       1) + ' px');
    if (maxSpillover < Infinity)
      console.log('  threshold = ' + maxSpillover + ' px  ' + (thresholdFailed ? 'EXCEEDED' : 'OK'));
  }

  // ── COVERAGE. Printed on EVERY run, every reason, zero or not. ────────────
  // Both this and the violations verdict below used to hang off `if
  // (processed)`, so a run that processed nothing printed neither and exited 0.
  const covResult = cov.report({ verbose });

  // VIOLATIONS — pinned-node movement. Stated UNCONDITIONALLY: "no violations"
  // is a claim the gate must be willing to make out loud, or not at all.
  console.log('');
  if (violations.length) {
    console.log('VIOLATIONS — pinned nodes that moved (must be zero):');
    for (const v of violations) {
      console.log('  ' + v.file + '  edit=' + v.edit + '  node=' + v.nodeId
        + '  moved=' + fmtFloat(v.dist, 1) + ' px');
    }
  } else {
    console.log('No pinned-node violations across ' + processed + ' figure(s) processed.');
  }

  // EDIT VARIANTS THAT WOULD NOT RENDER. Stated unconditionally, with the
  // engine's own error, because each one is a measurement this gate claimed to
  // make and did not.
  console.log('');
  if (editFailures.length) {
    console.log('EDIT VARIANTS THAT WOULD NOT RENDER — ' + editFailures.length
              + ' measurement(s) did not happen:');
    for (const f of editFailures)
      console.log('  ' + f.file + '  edit=' + f.edit + '  ' + f.err);
    console.log('  A variant the engine refuses is a HARNESS defect until proven');
    console.log('  otherwise: the edit generator wrote source this genre does not');
    console.log('  accept. The spillover percentiles above are computed only over');
    console.log('  variants that rendered, so they understate the corpus.');
  } else {
    console.log('All generated edit variants rendered.');
  }

  if (covResult.unread) {
    console.log('');
    console.log((strict ? 'FAIL' : 'WARN') + '  ' + covResult.unread
              + ' figure(s) were considered and NOT scored for a reason that means'
              + ' the tool could not read them.');
    if (!strict) console.log('      (run with --strict to make this an exit-1 failure)');
  }
  if (covResult.broken) process.exit(2);

  process.exit((thresholdFailed || violations.length
                || (strict && (covResult.unread || editFailures.length))) ? 1 : 0);
}

main();
