'use strict';
// FigDown v0.1 — canonical semantic model projection.
//
// Input:  the `doc` object returned by the reference engine's parse()
//         (editor/figdown.html) for an error-free document.
// Output: a plain JSON-serializable object containing ONLY spec-defined
//         semantics (spec/core.md), suitable as a golden fixture
//         that a second implementation can be compared against without
//         reading the reference engine.
//
// Stability rules (normative for the fixtures):
//   - Keys are emitted in the fixed order documented below; arrays are in
//     document order (pins are ordered by source line).
//   - Absent optional attributes are OMITTED — never emitted as null.
//     (A literal `null` in a golden would mark a spot where the engine
//     produced NaN. — DISCREPANCIES NON-NUMERIC-Z-VALUE/NON-NUMERIC-EXTENT resolved —
//     no golden contains one; a new `null` signals an engine defect.)
//   - Engine-internal fields (cols caches, hl flags, synthetic chart ids,
//     resolved presentation defaults other than fill color — see README)
//     are excluded.
//
// Defaults policy (definitive; mirrored in README.md):
//   MATERIALIZED into the model — the engine resolves these defaults
//   before the model is visible, so they are always emitted:
//     - flow          "right" when no `flow` line is written
//     - node.shape    "box"
//     - node/edge.plane  "base"
//     - the implicit base plane {id:"base", z:0} as planes[0]
//     - band.extend   "up"      and band.fill   "#e5e7eb" (engine default)
//     - bitfield.word 32   (`numbering=` has NO default —
//                           it is required on every `bitfield` line)
//     - plane.z := declaration index (1, 2, ...) when z-index= is omitted
//       (0.1 renamed the OPTION `z=` to `z-index=`; the MODEL field
//       stays `z` because it is the RESOLVED paint order, present even when
//       no option was written, not an echo of the key)
//   OMITTED when absent — never null:
//     - header.genre, title
//     - `label` on every directive whose label is optional — `node`,
//       `group`, `bundle`, `external`, `plane`, `bitfield`, `table`,
//       `timing` (OMITTED-LABEL-RECORDING/READ-SIDE-DETERMINISM; the genre was spelled `wave`
//       until this release, TIMING-GENRE-NAMING). An omitted label is ABSENT in the
//       model, never silently replaced by the id: `node a` and
//       `node a "a"` are different documents and must project
//       differently. The engine records `label: null` there and this
//       projection omits the key, per the absent-is-omitted rule above.
//       Renderers substitute the id for display; the model never does.
//       (`class`'s `meaning` and the labels of `threshold` and `band`
//       are MANDATORY, so they always appear.)
//       The test is ABSENCE, never truthiness (EMPTY-LABEL-STATE/EMPTY-LABEL-STATE): an
//       explicitly EMPTY label is a written value on all nine directives
//       and on `title`, so `"label": ""` is emitted and stays distinct
//       from the omitted key. The implicit `base` plane writes no label
//       and therefore carries none.
//     - fill, stroke, style and plane wherever §5 allows them (0.1:
//       `style` is no longer among them on `field`, `cell` or `signal` —
//       STYLE-KEY-SCOPE removed the key from those three); `edge`,
//       `threshold` and `bundle` have no interior and therefore no `fill`
//       (core §5, the carve-out table). There is NO text channel: `color` was retired language-wide
// (COLOUR-KEY-STATUS) and v0.1 has no label-colour key at all, so no
//       element carries one (the label colour is a DERIVED renderer default,
//       core §5 / LABEL-COLOUR-SOURCE, and a resolved presentation value is not model, §12.4
//       rule 4).
//       (node/group/edge/class/external/bundle/threshold/band/region/field/cell/
//       signal), plus node/group/edge class=
//     - group.gap; edge tail/mid/head; size.w / size.h (either may be
//       absent); field present/fill/class/description (PRESENCE-CONDITION-EXPRESSION/DESCRIPTION-KEY-SPELLING);
//       table width/marks/highlights; timing signal data; timing gaps
//     - routing / paths (`paths` spelled `routes` until
//       0.1): GONE (EDGE-GEOMETRY-CONSTRUCTS). The scalar `routing` and the
//       `paths` array were the two omit-when-absent exceptions here; both
//       constructs were WITHDRAWN from the language, so neither key can ever
//       be emitted again. Their omission rule is recorded rather than deleted
//       because a consumer written against an earlier 0.x may still be looking
//       for them: it will now never find them, which is the same shape as
//       never finding them in a document that declared none.
//     - externals (0.1; the model key was `boundaries` until
//       0.1): the whole array is omitted when the document declares
//       no `external` lines (additive, same rule as paths); an external's
//       label is omitted when not written
//   Empty top-level collections stay as [] (the document shape is fixed;
//   `externals` is the one omit-when-absent exception left — `paths` was the
//   other until this release).
//   Table aligns: a column with no explicit `:` alignment is "none".
//
// Top-level key order:
//   header, title, flow, classes, planes, nodes, groups,
//   externals?, edges, ranks, pins, thresholds, bands,
//   bundles, regions
//   (`routing?` sat after `flow` and `paths?` after `pins` until this release)
//   (`thresholds` was spelled `guides` until this release, THRESHOLD-KEYWORD-SPELLING/NORMATIVE-SEMANTIC-MODEL)
//
// Element key orders:
//   class : id, meaning, fill, stroke, style, plane, line
//   plane : id, label, z                     (no source line: the engine
//                                             does not record one)
//   node  : id, label, role, shape, group, plane, fill, stroke, style,
//           class, line
//           (`role` is 0.1, FLOWCHART-ROLE-KEYWORDS: "process" | "decision" |
//            "terminator", written by the three `flowchart` role keywords
//            and OMITTED for a bare `node` — a bare node is role-UNSTATED,
//            not a process, so there is no materialized default here.
//            `shape` is DERIVED from the role when the line writes no
//            `shape=`; a `shape=` on a role line changes only `shape`.)
//   group : id, label, gap, plane, fill, stroke, style, class, line
//   external: id, label, plane, line          (label only when written —
//                                             an external has no id-default
//                                             even for display)
//   edge  : a, op, b, tail, mid, head, plane, stroke, style,
//           class, line   (0.1: no `fill` — an edge has no interior,
//           so fill= and stroke= named one channel; core §5)
//   rank  : ids, line
//   pin   : id, x?, y?, width?, height?, line   (ELEMENT-GEOMETRY-DIRECTIVE: `size`
//           merged into `pin`, so the top-level `sizes` array is gone and
//           one entry carries the whole declared geometry. `x`/`y` appear
//           exactly when `at=` was written, both or neither; `width`/
//           `height` each when written; at least one of the three is
//           always present. 0.1 had renamed the source option and
//           the model key `w`/`h` to `width`/`height`)
//   threshold : label, in, offset, stroke, style, plane, line
//                                            (`in` is a node OR a group id;
//                                             `offset` is a percentage
//                                             number — 0.1 renamed
//                                             the key from `at`, which is
//                                             the pin POINT; no `fill`, core §5;
//                                             `line` is the SOURCE LINE
//                                             NUMBER — the collision that
//                                             renamed the directive `guide`
// itself renamed
//                                             `threshold`)
//   band  : label, in, from, to, extend, fill, stroke, style, plane,
//           line                           (0.1: `dir` -> `extend`;
//                                           0.1: the label is
//                                           MANDATORY and quoted, and the
//                                           text channel came with it — a
//                                           channel 0.1 then removed
//                                           from the whole language (COLOUR-KEY-STATUS);
//                                           from/to percentages; fill
//                                           includes the engine default
//                                           when not written — caveat in
//                                           README)
//   bundle: id, label, members, stroke, style, plane, line
//                                            (0.1: no `fill`, core §5)
//                                            (members as "a--b" strings)
//   regions (document order, spelled `blocks` until this release),
//     discriminated by `genre` (spelled `type` until this release) — the
//     nested genre that governs the region and its children (§4, GENRE-COMPOSITION).
//     `chart` is the one value that is not a header genre; it stays
//     EXPERIMENTAL (CONSTRUCT-STATUS-TIERS) and is outside the conformance surface:
//     bitfield: genre, id, label, word, numbering, fill, stroke,
//               fields, line
//       field : name, width, present, index, fill, stroke, class,
//               description, line
//               (width is a bit count or "*"; `present` is ABSENCE vs
//                presence and its EMPTY STRING is a written value —
//                `present: ""` = conditional with no condition stated,
//                0.1 PRESENCE-CONDITION-EXPRESSION)
//               (`index` is an OBJECT — {} = repeats with no index stated,
//                {first,last} with a NUMBER `last` = a determinate run,
//                {first,last} with a STRING `last` = the last index is
//                prose. Absence = no repetition claim. 0.1 BITFIELD-REPETITION-CONSTRUCT)
//       break : break, line
//     table   : genre, id, label, fill, stroke, heads, aligns, rows,
//               width, marks, highlights, line
//       cell  : v, merge          (merge: "left" = colspan into the cell
//                                  to the left, "up" = rowspan into the
//                                  cell above; omitted when unmerged)
//       aligns: per-column "left"|"center"|"right"|"none"
//       row   : cells, line
//       width : widths, line      (each width: "auto" | {px:n} | {pct:n})
//       mark  : header, row, col, fill, stroke, class, line
//               (`header` only when
//               true; header tiers h1..hN address as row 1..N)
//       highlight: row, line
//     timing  : genre, id, label, fill, stroke, signals, gaps, line
//       signal: name, lane, data, fill, stroke (data only
//               when present; no source line: the engine does not record one)
//     chart   : genre, table, type, line   (experimental in v0.1;
//               `level` was deleted, CHART-LEVEL-KEY)

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

// class= is multi-valued (array of ids); absence stays omitted.
function cls(v) {
  return v == null ? undefined : (Array.isArray(v) ? v : [v]);
}

function region(b) {
  if (b.type === 'bitfield') {
    return o([
      ['genre', 'bitfield'], ['id', b.id], ['label', b.label],
      ['word', b.word], ['numbering', b.numbering],
      ['fill', b.fill], ['stroke', b.stroke],
      ['class', cls(b.cls)],
      ['fields', b.fields.map(f => f.wrap
        ? o([['break', true], ['line', f.line]])
        // 0.1: `optional: true` became `present: "<condition>"` (PRESENCE-CONDITION-EXPRESSION)
        // and `note` became `description` (DESCRIPTION-KEY-SPELLING). `present` is ABSENCE vs
        // presence, and the EMPTY STRING is a written value — `present: ""`
        // means "conditional, condition not stated" and must survive
        // normalization, so the test is `!== undefined`, never truthiness.
        // BITFIELD-REPETITION-CONSTRUCT: `index` is an OBJECT, not the authored string,
        // and the shape is the whole point — a reader must be able to tell a
        // DETERMINATE run from an indeterminate one WITHOUT parsing prose.
        //   {"first":0,"last":7}            determinate  (`last` is a number)
        //   {"first":0,"last":"Last Entry"} indeterminate(`last` is a string)
        //   {}                              repeats, no index stated
        //   key absent                      no repetition claim
        // Determinacy is therefore a JSON TYPE TEST on `last`, never a
        // quoting test and never a regex over the author's text.
        : o([['name', f.name], ['width', f.w],
             ['present', f.present], ['index', f.index],
             ['fill', f.fill], ['stroke', f.stroke],
             ['class', cls(f.cls)], ['description', f.description],
             ['line', f.line]]))],
      ['line', b.line],
    ]);
  }
  if (b.type === 'table') {
    return o([
      ['genre', 'table'], ['id', b.id], ['label', b.label],
      ['fill', b.fill], ['stroke', b.stroke],
      ['class', cls(b.cls)],
      ['heads', b.heads.map(row => row.map(cell))],
      ['aligns', b.aligns ? b.aligns.map(a => a === null ? 'none' : a) : undefined],
      ['rows', b.rows.map(r => o([['cells', r.cells.map(cell)], ['line', r.line]]))],
      ['width', b.width ? o([
        ['widths', b.width.vals.map(w =>
          w.t === 'auto' ? 'auto' : w.t === 'px' ? { px: w.v } : { pct: w.v })],
        ['line', b.width.line]]) : undefined],
      ['marks', b.marks && b.marks.length ? b.marks.map(m => o([
        ['header', m.hdr || undefined], ['row', m.r], ['col', m.c],
        ['fill', m.fill], ['stroke', m.stroke],
        ['class', cls(m.cls)], ['line', m.line]])) : undefined],
      ['highlights', b.rowmarks && b.rowmarks.length ? b.rowmarks.map(m =>
        o([['row', m.r], ['line', m.line]])) : undefined],
      ['line', b.line],
    ]);
  }
  if (b.type === 'timing') {
    return o([
      ['genre', 'timing'], ['id', b.id], ['label', b.label],
      ['fill', b.fill], ['stroke', b.stroke],
      ['class', cls(b.cls)],
      ['signals', b.signals.map(s => o([
        ['name', s.name], ['lane', s.lane],
        // ABSENCE, never truthiness — data= is either missing or a
        // non-empty list (empty / empty-members are line errors in the engine).
        ['data', s.labels != null ? s.labels : undefined],
        ['fill', s.fill], ['stroke', s.stroke]]))],
      // gaps are stored as {t,line} in the engine; the model projects cycles only
      ['gaps', b.gaps && b.gaps.length
        ? b.gaps.map(g => (g && typeof g === 'object' && 't' in g) ? g.t : g)
        : undefined],
      ['line', b.line],
    ]);
  }
  if (b.type === 'chart') {
    return o([['genre', 'chart'], ['table', b.tid], ['type', b.ctype],
              ['line', b.line]]);
  }
  return o([['genre', b.type], ['line', b.line]]);
}

function normalize(doc) {
  const byLine = (a, b) => (a.line - b.line);
  const model = {};
  // STATECHART-GENRE-SCOPE: the version stopped being a constant of this
  // projection. It was one while the engine accepted exactly one wire-grammar
  // version; the engine now accepts `0.1` and `0.2`, and which one a document
  // DECLARED is meaning — it is the contract the author wrote against, and
  // §13.7 forbids a reader inferring it from anything else. The fallback is
  // for a document whose header itself errored, where no version was
  // successfully declared; every fixture that parses carries its own.
  model.header = o([['version', doc.version || '0.1'], ['genre', doc.genre]]);
  // EMPTY-LABEL-STATE/EMPTY-LABEL-STATE: absence, not truthiness — `title ""` is a written value and must
  // stay distinguishable from a document with no `title` line.
  if (doc.title !== null && doc.title !== undefined) model.title = doc.title;
  model.flow = doc.flow;
  model.classes = (doc.classes || []).map(c => o([
    ['id', c.id], ['meaning', c.label], ['fill', c.fill],
    ['stroke', c.stroke], ['style', c.style],
    ['plane', c.plane], ['line', c.line]]));
  model.planes = (doc.planes || []).map(l => o([
    ['id', l.id], ['label', l.label], ['z', l.z]]));
  model.nodes = (doc.nodes || []).map(n => o([
    ['id', n.id], ['label', n.label], ['role', n.role], ['shape', n.shape],
    ['group', n.group], ['plane', n.plane], ['fill', n.fill],
    ['stroke', n.stroke], ['style', n.style],
    ['class', cls(n.cls)], ['line', n.line]]));
  model.groups = (doc.groups || []).map(g => o([
    ['id', g.id], ['label', g.label], ['gap', g.gap], ['plane', g.plane],
    ['fill', g.fill], ['stroke', g.stroke],
    ['style', g.style], ['class', cls(g.cls)], ['line', g.line]]));
  if ((doc.boundaries || []).length)
    model.externals = doc.boundaries.map(b => o([
      ['id', b.id], ['label', b.label], ['plane', b.plane],
      ['line', b.line]]));
  model.edges = (doc.edges || []).map(e => o([
    ['a', e.a], ['op', e.op], ['b', e.b],
    ['tail', e.tail], ['mid', e.mid], ['head', e.head],
    ['plane', e.plane], ['stroke', e.stroke],
    ['style', e.style],
    ['class', cls(e.cls)], ['line', e.line]]));
  model.ranks = (doc.ranks || []).map(r => o([['ids', r.ids], ['line', r.line]]));
  // ELEMENT-GEOMETRY-DIRECTIVE: ONE object per pinned element. `x`/`y` are present
  // exactly when `at=` was written (both or neither — `at=` is a point, not
  // two scalars); `width`/`height` each when written. Every entry carries at
  // least one of the three, so an entry is never empty. The top-level
  // `sizes` array is GONE — a consumer that read it reads `pins` and tests
  // for the extent keys.
  model.pins = Object.keys(doc.pins || {})
    .map(id => ({ id, p: doc.pins[id] }))
    .sort((a, b) => byLine(a.p, b.p))
    .map(x => o([['id', x.id],
      ['x', x.p.fx === null ? undefined : x.p.fx],
      ['y', x.p.fy === null ? undefined : x.p.fy],
      ['width', x.p.w === null ? undefined : x.p.w],
      ['height', x.p.h === null ? undefined : x.p.h],
      ['line', x.p.line]]));
  model.thresholds = (doc.thresholds || []).map(g => o([
    ['label', g.label], ['in', g.target], ['offset', g.pct],
    ['stroke', g.stroke], ['style', g.style],
    ['plane', g.plane], ['line', g.line]]));
  model.bands = (doc.bands || []).map(f => o([
    ['label', f.label], ['in', f.target], ['from', f.from], ['to', f.to],
    ['extend', f.dir], ['fill', f.fill], ['stroke', f.stroke],
    ['style', f.style],
    ['plane', f.plane], ['line', f.line]]));
  model.bundles = (doc.trunks || []).map(t => o([
    ['id', t.id], ['label', t.label],
    ['members', t.pairs.map(p => p[0] + '--' + p[1])],
    ['stroke', t.stroke],
    ['style', t.style], ['plane', t.plane], ['line', t.line]]));
  model.regions = (doc.blocks || []).map(region);
  return model;
}

module.exports = normalize;
module.exports.normalize = normalize;
