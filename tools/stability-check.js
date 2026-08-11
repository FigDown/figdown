#!/usr/bin/env node
// stability-check.js — axiom-3 evidence harness for FigDown
// Measures "local edit → local change": applies single-line edits to each
// scene .fd and reports how far pre-existing nodes move (displacement), with
// special focus on SPILLOVER = max displacement of nodes NOT adjacent to the
// edit.
//
// Usage:
//   node tools/stability-check.js [--max-spillover=N] [<file.fd | dir> ...]
//
// Default paths when none are given: examples/  examples/patterns/  figures/
// Exits 1 if --max-spillover=N is set and any figure×edit exceeds it, or if
// any pinned node moves (a VIOLATION, always reported).
'use strict';

const fs   = require('fs');
const path = require('path');

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
  return { ok: true, svg: result.svg };
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
function parseNodes(src) {
  const lines = src.split('\n');
  const pins = new Set();      // any pin line
  const pinnedAt = new Set();  // pin line carrying at=
  const nodes = [];

  // First pass: collect pin targets.
  for (const ln of lines) {
    const pm = ln.match(/^pin\s+(\S+)\b/);
    if (!pm) continue;
    pins.add(pm[1]);
    if (/\bat=/.test(ln)) pinnedAt.add(pm[1]);
  }

  // Second pass: collect node declarations.
  // Format: node <id> [<label>] [options…]
  // We need the first identifier after `node` as the id.
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const nm = ln.match(/^node\s+(\S+)/);
    if (!nm) continue;
    const id = nm[1];

    // Extract label (the quoted or bare token following the id).
    // quotedForm is the exact as-written form (with quotes if quoted),
    // label is the human-readable inner content.
    let label = id, quotedForm = id; // fallback
    const afterId = ln.slice(ln.indexOf(id) + id.length).trim();
    const qm = afterId.match(/^"((?:[^"\\]|\\.)*)"/);
    if (qm) {
      label = qm[1];
      quotedForm = '"' + qm[1] + '"'; // the exact quoted form in source
    } else {
      const bm = afterId.match(/^(\S+)/);
      if (bm && bm[1] && !bm[1].includes('=')) { label = bm[1]; quotedForm = bm[1]; }
    }

    const hasColor = /\bfill=/.test(ln);
    const inMatch  = ln.match(/\bin=(\S+)/);
    const groupId  = inMatch ? inMatch[1] : null;

    nodes.push({
      id,
      label,
      quotedForm,
      line: i,          // 0-based line index
      hasPinLine: pins.has(id),
      hasPinAt: pinnedAt.has(id),
      hasColor,
      groupId,
      sourceLine: ln,
    });
  }
  return nodes;
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
function editAddUnconnectedNode(src, nodes) {
  if (!nodes.length) return null;
  const newId  = '_stab_newA';
  const append = '\nnode ' + newId + ' "Stability Check Node A"';
  return { editName: 'add-unconnected', newSrc: src + append, editedNodeId: newId, newNodeId: newId };
}

// (b) Append a new node + one edge from the first existing node.
function editAddConnectedNode(src, nodes) {
  if (!nodes.length) return null;
  const anchor = nodes[0].id;
  const newId  = '_stab_newB';
  const append = '\nnode ' + newId + ' "Stability Check Node B"\nedge ' + anchor + ' -> ' + newId;
  return { editName: 'add-with-edge', newSrc: src + append, editedNodeId: newId, newNodeId: newId, anchorId: anchor };
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
    newLabel));
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
  const append = '\npin ' + target.id + ' at=(' + Math.round(pos.x) + ',' + Math.round(pos.y) + ')';
  return { editName: 'pin-unpinned', newSrc: src + append, editedNodeId: target.id };
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

function collectFd(arg) {
  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved)) {
    process.stderr.write('warning: path not found: ' + arg + '\n');
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
  const inputs = [];
  for (const a of argv) {
    const ms = a.match(/^--max-spillover=(\d+(?:\.\d+)?)$/);
    if (ms) { maxSpillover = parseFloat(ms[1]); continue; }
    if (a.startsWith('--')) {
      process.stderr.write('unknown flag: ' + a + '\n');
      process.exit(2);
    }
    inputs.push(a);
  }

  // Default search paths resolved from project root (independent of CWD).
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

  // Collect all .fd files.
  const files = [];
  for (const sp of searchPaths) {
    for (const f of collectFd(sp)) {
      if (!files.includes(f)) files.push(f);
    }
  }

  if (!files.length) {
    process.stderr.write('No .fd files found in the given paths.\n');
    process.exit(0);
  }

  // Column widths for the output table.
  const C = {
    file:    32,
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
  let   thresholdFailed = false;
  let   skipped = 0, processed = 0;

  for (const fdPath of files) {
    let src;
    try { src = fs.readFileSync(fdPath, 'utf8'); }
    catch (e) {
      process.stderr.write('Cannot read ' + fdPath + ': ' + e.message + '\n');
      skipped++;
      continue;
    }

    // Skip non-scene genres.
    if (!isSceneGenre(src)) { skipped++; continue; }

    const rel = path.relative(process.cwd(), fdPath);

    // Parse node declarations from source.
    const nodeDecls = parseNodes(src);
    if (!nodeDecls.length) { skipped++; continue; }

    // Determine which nodes are pinned — POSITIONED, i.e. a pin line carrying
    // at=. A width=/height=-only pin (ELEMENT-GEOMETRY-DIRECTIVE) declares an extent, not a place,
    // and the renderer is free to move that node; asserting it must not move
    // would report a violation the language never promised.
    const pinnedIds = new Set(nodeDecls.filter(n => n.hasPinAt).map(n => n.id));

    // Step 1: Render baseline.
    const baseResult = renderWithRetry(engine, src, rel);
    if (!baseResult.ok) {
      process.stderr.write('skip ' + rel + ': ' + (baseResult.errs[0] || 'unknown error') + '\n');
      skipped++;
      continue;
    }

    const basePositions = extractNodePositions(baseResult.svg);
    if (!basePositions.length) { skipped++; continue; }

    const basePosMap = new Map(basePositions.map(p => [p.id, p]));

    // Step 2: Generate the five edit variants.
    const edits = [
      editAddUnconnectedNode(src, nodeDecls),
      editAddConnectedNode(src, nodeDecls),
      editChangeLabelLonger(src, nodeDecls),
      editAddColor(src, nodeDecls),
      editPinUnpinned(src, nodeDecls, basePositions),
    ].filter(Boolean);

    if (!edits.length) { skipped++; continue; }

    processed++;

    // Step 3: For each edit, render and measure.
    for (const edit of edits) {
      const afterResult = renderWithRetry(engine, edit.newSrc, rel + ' (' + edit.editName + ')');
      if (!afterResult.ok) {
        console.log(
          pad(rel,            C.file) + '  ' +
          pad(edit.editName,  C.edit) + '  ' +
          lpad('-', C.moved)          + '  ' +
          lpad('-', C.maxDisp)        + '  ' +
          lpad('-', C.spill)          +
          '  (render failed)');
        continue;
      }

      const afterPositions = extractNodePositions(afterResult.svg);
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
        flag);
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

  if (processed) {
    console.log('');
    console.log('Figures processed: ' + processed + '  skipped: ' + skipped);
  }

  // VIOLATIONS — pinned-node movement.
  if (violations.length) {
    console.log('');
    console.log('VIOLATIONS — pinned nodes that moved (must be zero):');
    for (const v of violations) {
      console.log('  ' + v.file + '  edit=' + v.edit + '  node=' + v.nodeId
        + '  moved=' + fmtFloat(v.dist, 1) + ' px');
    }
  } else if (processed) {
    console.log('');
    console.log('No pinned-node violations.');
  }

  process.exit((thresholdFailed || violations.length) ? 1 : 0);
}

main();
