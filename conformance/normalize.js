'use strict';
// FigDown v0.1 — canonical semantic model projection.
//
// Input:  the `doc` object returned by the reference engine's parse()
//         (editor/figdown.html) for an error-free document.
// Output: a plain JSON-serializable object containing ONLY spec-defined
//         semantics (spec/syntax-draft.md), suitable as a golden fixture
//         that a second implementation can be compared against without
//         reading the reference engine.
//
// Stability rules (normative for the fixtures):
//   - Keys are emitted in the fixed order documented below; arrays are in
//     document order (pins/sizes are ordered by source line).
//   - Absent optional attributes are OMITTED — never emitted as null.
//     (A literal `null` in a golden would mark a spot where the engine
//     produced NaN. Since 0.1-dev.11 — DISCREPANCIES D6/D7 resolved —
//     no golden contains one; a new `null` signals an engine defect.)
//   - Engine-internal fields (cols caches, hl flags, synthetic plot ids,
//     resolved presentation defaults other than fill color — see README)
//     are excluded.
//
// Defaults policy (definitive; mirrored in README.md):
//   MATERIALIZED into the model — the engine resolves these defaults
//   before the model is visible, so they are always emitted:
//     - flow          "right" when no `flow` line is written
//     - node.shape    "box"
//     - node/edge.layer  "base"
//     - label := id   when a node/group/bitfield/table/wave omits its label
//     - the implicit base layer {id:"base", z:0} as layers[0]
//     - fill.dir      "up"      and fill.color  "#e5e7eb" (engine default)
//     - bitfield.unit 32        and bitfield.numbering "lsb0"
//     - layer.z := declaration index (1, 2, ...) when z= is omitted
//   OMITTED when absent — never null:
//     - header.template, title
//     - node/group/edge/class color, stroke, text, style, class
//     - group.gap; edge tail/mid/head; size.w / size.h (either may be
//       absent); line (guide) color; field optional/color/class/note;
//       table colw/marks/highlights; wave signal labels; wave gaps;
//       plot level
//   Empty top-level collections stay as [] (the document shape is fixed).
//   Table aligns: a column with no explicit `:` alignment is "none".
//
// Top-level key order:
//   header, title, flow, classes, layers, nodes, groups, edges, ranks,
//   pins, sizes, lines, fills, bundles, blocks
//
// Element key orders:
//   class : id, meaning, color, stroke, text, style, line
//   layer : id, label, z                     (no source line: the engine
//                                             does not record one)
//   node  : id, label, shape, group, layer, color, stroke, text, style,
//           class, line
//   group : id, label, gap, color, class, line
//   edge  : a, op, b, tail, mid, head, layer, color, style, class, line
//   rank  : ids, line
//   pin   : id, x, y, line
//   size  : id, w, h, line
//   line  : label, in, at, color, line       (guide line; `at` is a
//                                             percentage number)
//   fill  : in, from, to, dir, color, line   (from/to percentages; color
//                                             includes the engine default
//                                             when not written — caveat in
//                                             README)
//   bundle: id, label, members, color, line  (members as "a--b" strings)
//   blocks (document order), by type:
//     bitfield: type, id, label, unit, numbering, fields, line
//       field : name, width, optional, color, class, note, line
//               (width is a bit count or "*"; `optional` only when true)
//       wrap  : wrap, line
//     table   : type, id, label, heads, aligns, rows, colw, marks,
//               highlights, line
//       cell  : v, merge          (merge: "left" = colspan into the cell
//                                  to the left, "up" = rowspan into the
//                                  cell above; omitted when unmerged)
//       aligns: per-column "left"|"center"|"right"|"none"
//       row   : cells, line
//       colw  : widths, line      (each width: "auto" | {px:n} | {pct:n})
//       mark  : header, row, col, color, class, line  (`header` only when
//               true; header tiers h1..hN address as row 1..N)
//       highlight: row, line
//     wave    : type, id, label, signals, gaps, line
//       signal: name, lane, labels (labels only when present; no source
//               line: the engine does not record one)
//     plot    : type, table, kind, level, line   (experimental in v0.1)

function o(pairs) {
  // fixed-key-order object builder; skips absent (undefined/null) values.
  // NaN passes through on purpose: JSON turns it into null, which makes an
  // engine defect visible in the golden instead of silently vanishing.
  const out = {};
  for (const [k, v] of pairs) {
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

function cell(c) {
  return o([['v', c.v], ['merge', c.m]]);
}

function block(b) {
  if (b.type === 'bitfield') {
    return o([
      ['type', 'bitfield'], ['id', b.id], ['label', b.label],
      ['unit', b.unit], ['numbering', b.numbering],
      ['fields', b.fields.map(f => f.wrap
        ? o([['wrap', true], ['line', f.line]])
        : o([['name', f.name], ['width', f.w],
             ['optional', f.optional || undefined],
             ['color', f.color], ['class', f.cls], ['note', f.note],
             ['line', f.line]]))],
      ['line', b.line],
    ]);
  }
  if (b.type === 'table') {
    return o([
      ['type', 'table'], ['id', b.id], ['label', b.label],
      ['heads', b.heads.map(row => row.map(cell))],
      ['aligns', b.aligns ? b.aligns.map(a => a === null ? 'none' : a) : undefined],
      ['rows', b.rows.map(r => o([['cells', r.cells.map(cell)], ['line', r.line]]))],
      ['colw', b.colw ? o([
        ['widths', b.colw.vals.map(w =>
          w.t === 'auto' ? 'auto' : w.t === 'px' ? { px: w.v } : { pct: w.v })],
        ['line', b.colw.line]]) : undefined],
      ['marks', b.marks && b.marks.length ? b.marks.map(m => o([
        ['header', m.hdr || undefined], ['row', m.r], ['col', m.c],
        ['color', m.color], ['class', m.cls], ['line', m.line]])) : undefined],
      ['highlights', b.rowmarks && b.rowmarks.length ? b.rowmarks.map(m =>
        o([['row', m.r], ['line', m.line]])) : undefined],
      ['line', b.line],
    ]);
  }
  if (b.type === 'wave') {
    return o([
      ['type', 'wave'], ['id', b.id], ['label', b.label],
      ['signals', b.signals.map(s => o([
        ['name', s.name], ['lane', s.lane],
        ['labels', s.labels && s.labels.length ? s.labels : undefined]]))],
      ['gaps', b.gaps && b.gaps.length ? b.gaps : undefined],
      ['line', b.line],
    ]);
  }
  if (b.type === 'plot') {
    return o([['type', 'plot'], ['table', b.tid], ['kind', b.kind],
              ['level', b.level], ['line', b.line]]);
  }
  return o([['type', b.type], ['line', b.line]]);
}

function normalize(doc) {
  const byLine = (a, b) => (a.line - b.line);
  const model = {};
  // The engine accepts exactly wire-grammar version 0.1; the version is
  // therefore a constant of this projection.
  model.header = o([['version', '0.1'], ['template', doc.template]]);
  if (doc.title) model.title = doc.title;
  model.flow = doc.flow;
  model.classes = (doc.classes || []).map(c => o([
    ['id', c.id], ['meaning', c.label], ['color', c.color],
    ['stroke', c.stroke], ['text', c.text], ['style', c.style],
    ['line', c.line]]));
  model.layers = (doc.layers || []).map(l => o([
    ['id', l.id], ['label', l.label || undefined], ['z', l.z]]));
  model.nodes = (doc.nodes || []).map(n => o([
    ['id', n.id], ['label', n.label], ['shape', n.shape],
    ['group', n.group], ['layer', n.layer], ['color', n.color],
    ['stroke', n.stroke], ['text', n.text], ['style', n.style],
    ['class', n.cls], ['line', n.line]]));
  model.groups = (doc.groups || []).map(g => o([
    ['id', g.id], ['label', g.label], ['gap', g.gap], ['color', g.color],
    ['class', g.cls], ['line', g.line]]));
  model.edges = (doc.edges || []).map(e => o([
    ['a', e.a], ['op', e.op], ['b', e.b],
    ['tail', e.tail], ['mid', e.mid], ['head', e.head],
    ['layer', e.layer], ['color', e.color], ['style', e.style],
    ['class', e.cls], ['line', e.line]]));
  model.ranks = (doc.ranks || []).map(r => o([['ids', r.ids], ['line', r.line]]));
  model.pins = Object.keys(doc.pins || {})
    .map(id => ({ id, p: doc.pins[id] }))
    .sort((a, b) => byLine(a.p, b.p))
    .map(x => o([['id', x.id], ['x', x.p.fx], ['y', x.p.fy], ['line', x.p.line]]));
  model.sizes = Object.keys(doc.sizes || {})
    .map(id => ({ id, s: doc.sizes[id] }))
    .sort((a, b) => byLine(a.s, b.s))
    .map(x => o([['id', x.id], ['w', x.s.w], ['h', x.s.h], ['line', x.s.line]]));
  model.lines = (doc.glines || []).map(g => o([
    ['label', g.label], ['in', g.group], ['at', g.pct], ['color', g.color],
    ['line', g.line]]));
  model.fills = (doc.fills || []).map(f => o([
    ['in', f.target], ['from', f.from], ['to', f.to], ['dir', f.dir],
    ['color', f.color], ['line', f.line]]));
  model.bundles = (doc.trunks || []).map(t => o([
    ['id', t.id], ['label', t.label],
    ['members', t.pairs.map(p => p[0] + '--' + p[1])],
    ['color', t.color], ['line', t.line]]));
  model.blocks = (doc.blocks || []).map(block);
  return model;
}

module.exports = normalize;
module.exports.normalize = normalize;
