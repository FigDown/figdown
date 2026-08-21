#!/usr/bin/env node
'use strict';
// figdown-diff.js — a SEMANTIC diff for FigDown documents (Stage 1).
//
//   node tools/figdown-diff.js A.fd B.fd
//   node tools/figdown-diff.js --git <revA> <revB> <path>
//   node tools/figdown-diff.js --selftest
//   [--json] [--help]
//
// WHY THIS EXISTS
//
// A reviewer looking at a `.fd` revision has exactly one question: DID THE
// MEANING CHANGE, OR ONLY THE DRAWING? A textual `git diff` cannot answer it —
// it reports a recoloured node and a deleted edge in the same voice — and the
// prior art for diffing figures answers it badly, because it has to recover
// meaning from geometry and the geometry is full of noise (design/
// advisory-intake-2026-08.md, ADV-1).
//
// FigDown does not have that problem, and the reason is the founding intent:
// the SOURCE already states the meaning and presentation never carries any
// (MEANING-RECOVERY-SOURCE, PRESENTATION-AS-MEANING-CARRIER). So a semantic diff here is not inference. It is parse, project,
// and classify each field of the model as MEANING or PRESENTATION — the
// classification is decisions/registry.md, and this file is
// the executable half of that table.
//
// WHAT IT IS NOT (Stage 1 scope)
//
// No canonical serialization, no semantic hash, no normativity claim. Those
// are the rest of ADV-1. This tool reads; it decides nothing about the
// language. Nothing here changes the engine, the spec, or any artifact.
//
// THE ONE QUALITY RULE
//
// ZERO FALSE SEMANTIC FACTS. Every itemized line must be true of the two
// documents and must name the element the way the SOURCE names it. Where the
// tool cannot pair two elements with certainty it reports a removal and an
// addition rather than guessing a rename or a label edit, and where a list
// changed length it reports at the coarser granularity it can defend. A
// coarse true statement beats a precise guess.
//
// VERDICT (first line of every run)
//   identical          both sources are byte-identical
//   comment-only       sources differ, models are equal (comments, blank
//                      lines, whitespace, line positions)
//   presentation-only  presentation deltas only
//   semantic           at least one semantic delta
//
// EXIT CODES
//   0  identical / comment-only      3  presentation-only
//   4  semantic                      2  usage error, unreadable input, or
//                                       EITHER SIDE FAILS TO PARSE
//
// Exit 2 on a parse error is not politeness. A diff computed over a document
// the engine rejected would report facts about a model that no reader will
// ever see, so the tool refuses and prints the engine's own line-numbered
// errors instead.
//
// DETERMINISM: no clock, no randomness, no network, no model calls. The same
// two inputs always produce the same bytes.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const engine = require(path.join(ROOT, 'dist', 'figdown.js'));
const normalize = require(path.join(ROOT, 'conformance', 'normalize.js'));

// ── The classification register ──────────────────────────────────────────
// S = MEANING (a reading agent may consume it) · P = PRESENTATION (a reading
// agent must ignore it). One entry per model field; the table with the reason
// for each row is decisions/registry.md. A field that is NOT
// in this register is treated as UNCLASSIFIED: it counts as a meaning delta
// AND raises a warning naming the field, so a future model key can never be
// dropped silently. Structural children (`fields`, `heads`, `rows`, `marks`,
// `highlights`, `width`, `signals`, `gaps`) are diffed by their own routines
// and are listed in STRUCTURAL_BY_REG below rather than here.
const S = 'semantic';
const P = 'presentation';

const REG = {
  header:    { version: S, genre: S },
  document:  { title: S, note: S, flow: P },
  classes:   { id: S, meaning: S, plane: S, fill: P, stroke: P, style: P },
  planes:    { id: S, label: S, z: P },
  nodes:     { id: S, label: S, role: S, group: S, plane: S, class: S, note: S,
               shape: P, fill: P, stroke: P, style: P },
  groups:    { id: S, label: S, plane: S, class: S, note: S,
               gap: P, fill: P, stroke: P, style: P },
  externals: { id: S, label: S, plane: S },
  // `id` (CONNECTOR-IDENTITY-KEY, figdown 0.5) is SEMANTIC: it is the connector's handle, what
  // a `bundle` member names it by and what `data-edge` carries, so acquiring or
  // losing one changes what the document says about the figure and not how it
  // is drawn.
  edges:     { id: S, a: S, op: S, b: S, tail: S, mid: S, head: S, plane: S,
               class: S, note: S, stroke: P, style: P },
  ranks:     { ids: P },
  pins:      { id: P, x: P, y: P, width: P, height: P },
  thresholds:{ label: S, in: S, offset: S, plane: S, stroke: P, style: P },
  bands:     { label: S, in: S, from: S, to: S, extend: S, plane: S,
               fill: P, stroke: P, style: P },
  bundles:   { id: S, label: S, members: S, plane: S, stroke: P, style: P },
  lifelines: { id: S, label: S, in: S, class: S, note: S, description: S,
               fill: P, stroke: P, style: P },
  messages:  { id: S, a: S, op: S, b: S, label: S, tail: S, head: S, in: S,
               class: S, note: S, description: S, stroke: P, style: P },
  states:    { lifeline: S, name: S, in: S, class: S, note: S, description: S,
               fill: P, stroke: P, style: P },
  fragments: { id: S, label: S, type: S, in: S, class: S, note: S,
               description: S, stroke: P, style: P },
  operands:  { id: S, label: S, in: S, class: S, note: S, description: S,
               stroke: P, style: P },
  bitfield:  { genre: S, id: S, label: S, word: S, numbering: S, class: S,
               fill: P, stroke: P },
  field:     { name: S, width: S, present: S, index: S, description: S,
               class: S, break: S, fill: P, stroke: P },
  table:     { genre: S, id: S, label: S, class: S, aligns: P,
               fill: P, stroke: P },
  mark:      { header: S, row: S, col: S, class: S, fill: P, stroke: P },
  highlight: { row: P },
  timing:    { genre: S, id: S, label: S, class: S, fill: P, stroke: P },
  signal:    { name: S, lane: S, data: S, fill: P, stroke: P },
  chart:     { genre: S, table: S, type: S },
};

// Keys diffed by a dedicated routine rather than by scalar comparison. The
// map is PER REGISTER, not global: `width` is a table's column-width line and
// also a bitfield FIELD's bit count, and the two must not share a rule.
const STRUCTURAL_BY_REG = {
  table:    new Set(['heads', 'rows', 'marks', 'highlights', 'width']),
  bitfield: new Set(['fields']),
  timing:   new Set(['signals', 'gaps']),
};
const NO_STRUCTURAL = new Set();

// Whether the mere EXISTENCE of an element of this collection is meaning.
// `pins` and `ranks` are the exceptions: a pin is the
// layout zone and a rank is a layout hint, so their appearance and
// disappearance is a presentation delta. A table `mark` and a row highlight
// are decided at their own routine, where the class assignment can be seen.
const EXISTENCE = {
  classes: S, planes: S, nodes: S, groups: S, externals: S, edges: S,
  ranks: P, pins: P, thresholds: S, bands: S, bundles: S,
  lifelines: S, messages: S, states: S, fragments: S, operands: S,
};

// ---- Small helpers ------------------------------------------------------

// `line` is the SOURCE POSITION of a directive, never its content: adding a
// comment moves every line below it without changing one fact of the figure.
// It is therefore stripped before any comparison. Declaration ORDER survives
// stripping because the projection keeps every collection in document order --
// which is what the sequence genre's time axis is made of.
function stripLines(v) {
  if (Array.isArray(v)) return v.map(stripLines);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) if (k !== 'line') out[k] = stripLines(v[k]);
    return out;
  }
  return v;
}

function j(v) { return JSON.stringify(v); }

// Value rendering for a delta line. Absence is printed as `(none)` and is
// deliberately distinct from the empty string, which prints as `""` -- the two
// are different documents everywhere a label is optional.
function fmt(v) {
  if (v === undefined || v === null) return '(none)';
  if (typeof v === 'string') return j(v);
  if (Array.isArray(v) || typeof v === 'object') return j(v);
  return String(v);
}

function eq(a, b) {
  return j(a === undefined ? null : a) === j(b === undefined ? null : b);
}

function labelPart(el) {
  return el && el.label !== undefined ? ' ' + j(el.label) : '';
}

// How the SOURCE names an element, so every itemized fact can be looked up.
// The handle a connector was given, when it was given one (CONNECTOR-IDENTITY-KEY). Empty for
// an anonymous connector, which is the language's default and the majority of
// the corpus.
function idPart(el) {
  return (el && el.id !== undefined && el.id !== null) ? el.id + ' ' : '';
}

function nameOf(kind, el, fallbackIndex) {
  switch (kind) {
    case 'classes':    return 'class ' + el.id;
    case 'planes':     return 'plane ' + el.id;
    case 'nodes':      return 'node ' + el.id + labelPart(el);
    case 'groups':     return 'group ' + el.id + labelPart(el);
    case 'externals':  return 'external ' + el.id + labelPart(el);
    // CONNECTOR-IDENTITY-KEY: a connector with an `id=` is named by it, because that is what the
    // source calls it and what every other construct reaches it by. An
    // anonymous connector keeps the endpoint text it always had — the two
    // spellings are not interchangeable and the report must not pretend they
    // are.
    case 'edges':      return 'edge ' + idPart(el) + edgeText(el);
    case 'messages':   return 'message ' + idPart(el) + edgeText(el) + labelPart(el);
    case 'ranks':      return 'rank ' + (el.ids || []).join(',');
    case 'pins':       return 'pin ' + el.id;
    case 'thresholds': return 'threshold ' + j(el.label) + ' in ' + el.in;
    case 'bands':      return 'band ' + j(el.label) + ' in ' + el.in;
    case 'bundles':    return 'bundle ' + el.id + labelPart(el);
    case 'lifelines':  return 'lifeline ' + el.id + labelPart(el);
    case 'states':     return 'state ' + el.lifeline + ' ' + j(el.name);
    case 'fragments':  return 'fragment ' + el.id + ' ' + el.type + labelPart(el);
    case 'operands':   return 'operand ' + el.id + labelPart(el);
    case 'regions':    return el.genre + ' ' +
      (el.id !== undefined ? el.id : '#' + (fallbackIndex + 1)) + labelPart(el);
    default:           return kind + ' #' + (fallbackIndex + 1);
  }
}

// `edge a -[mid]-> b`, written the way the source writes it. The tail and head
// labels are printed when present, because they are meaning too: they are the
// port / interface tags at the two ends.
function edgeText(e) {
  const mid = e.mid !== undefined ? '[' + e.mid + ']' : '';
  const op = e.op || '--';
  let opText;
  if (!mid) opText = op;
  else if (op === '->') opText = '-' + mid + '->';
  else if (op === '<-') opText = '<-' + mid + '-';
  else if (op === '<->') opText = '<-' + mid + '->';
  else opText = '-' + mid + '-';
  const t = e.tail !== undefined ? '[' + e.tail + '] ' : '';
  const h = e.head !== undefined ? ' [' + e.head + ']' : '';
  return e.a + ' ' + t + opText + h + ' ' + e.b;
}

// ---- Edge / message identity --------------------------------------------
//
// A connector may carry an `id=` from figdown 0.5 (CONNECTOR-IDENTITY-KEY) and most do not: the
// key is OPTIONAL and anonymity is the language's default. So there are two
// populations here and they are matched differently.
//
//   IDENTIFIED -- matched by the id and by nothing else, which is the rule
//   every other identified collection in this tool follows.
//   ANONYMOUS  -- matched on the only thing they carry: their ENDPOINTS,
//   their DIRECTION and their LABELS, through the three passes below,
//   unchanged.
//
// The mixed population is the normal case, so the two must compose without
// the second degrading: identified connectors pair first and leave the
// field, and the anonymous ones then run the old passes among themselves.
//
// Two writings of one relation are folded first. `a <- b` states the same
// directed relation as `b -> a`, and `a -- b` the same undirected one as
// `b -- a`, so the key is canonicalized (the arrow turned to point right, the
// symmetric operators' endpoints sorted) with the tail and head labels
// swapping seats whenever the endpoints do. Rewriting a line that way is a
// presentation-free edit and must not read as a change of meaning. The
// DISPLAY always uses the element as the source wrote it.
function canonEdge(e) {
  let a = e.a, b = e.b, op = e.op || '--', tail = e.tail, head = e.head;
  const swap = () => {
    const x = a; a = b; b = x;
    const y = tail; tail = head; head = y;
  };
  if (op === '<-') { op = '->'; swap(); }
  else if ((op === '--' || op === '<->') && a > b) swap();
  return { a, b, op, tail, head };
}

// The NODE PAIR an edge runs between, direction discarded: this is the key of
// the second matching pass, where a single unmatched edge on each side between
// the same pair may be reported as one edited edge rather than as a removal
// and an addition.
function endpointKey(e) {
  const c = canonEdge(e);
  return j([c.a, c.b].sort());
}

function fullEdgeKey(e) {
  const c = canonEdge(e);
  return j([c.a, c.op, c.b,
            c.tail === undefined ? null : c.tail,
            c.head === undefined ? null : c.head,
            e.mid === undefined ? null : e.mid,
            e.label === undefined ? null : e.label]);
}

// ---- Delta collection ---------------------------------------------------

function makeSink() {
  return { semantic: [], presentation: [], warnings: [], explained: new Set() };
}

function add(sink, register, text) {
  (register === P ? sink.presentation : sink.semantic).push(text);
}

// A model key this file does not classify. It is reported as MEANING and
// named in a warning: the alternative -- ignoring it -- would let a future
// model key change the figure while the tool reported `identical`.
function unclassified(sink, where, key) {
  sink.warnings.push('unclassified model field: ' + where + ' key `' + key +
    '` is not in the classification register; counted as meaning');
}

// ---- Field-level comparison ---------------------------------------------
//
// Compares two matched elements key by key against the register. Structural
// children are skipped here; their own routines handle them.
function compareFields(regName, name, a, b, sink) {
  const reg = REG[regName] || {};
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));
  for (const k of Array.from(keys).sort()) {
    if (k === 'line' || (STRUCTURAL_BY_REG[regName] || NO_STRUCTURAL).has(k)) continue;
    if (eq(a[k], b[k])) continue;
    let register = reg[k];
    if (!register) { register = S; unclassified(sink, regName, k); }
    add(sink, register, name + ': ' + k + ' ' + fmt(a[k]) + ' -> ' + fmt(b[k]));
  }
}

// ---- Keyed collections ---------------------------------------------------
//
// Every element that HAS an id is matched by that id, and by nothing else. A
// renamed id is therefore a removal and an addition, plus an informational
// note when the two share a label -- the tool states what it sees and does not
// promote a coincidence to an identity claim.
//
// SEVERAL ELEMENTS CAN SHARE ONE KEY, and that is where an earlier version of
// this function told lies. A state occurrence is keyed by (lifeline, name) and
// a lifeline may enter one state four times; a threshold is keyed by (target,
// label). Pairing those occurrences BY ORDINAL -- the first with the first, the
// second with the second -- means that inserting one occurrence in the middle
// re-pairs every occurrence after it, and each re-pairing is then reported as
// an attribute mutation that never happened. On one real revision of the DHCP
// sequence figure, where exactly one `state c "INIT"` was added, that produced
// two fabricated facts about `in=`.
//
// So a shared key is aligned as a MULTISET, with the same conservatism the
// edge matcher uses:
//   1. every occurrence that is UNCHANGED (equal in every field) is matched to
//      its twin first, so an insertion cannot shift the alignment;
//   2. of what is left, exactly one on each side may be reported as one edited
//      occurrence;
//   3. anything else is a removal and an addition -- never an attribute
//      mutation, because which leftover became which cannot be known.
function keyedDiff(kind, regName, listA, listB, keyOf, sink) {
  const group = (list) => {
    const m = new Map();
    list.forEach((el, i) => {
      const k = keyOf(el, i);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push({ el, i });
    });
    return m;
  };
  const A = group(listA), B = group(listB);
  const existence = EXISTENCE[kind] || S;
  const removed = [], added = [];
  const keys = Array.from(A.keys()).concat(
    Array.from(B.keys()).filter(k => !A.has(k)));

  for (const k of keys) {
    const la = A.get(k) || [], lb = B.get(k) || [];
    // pass 1 -- unchanged occurrences pair off first
    const takenB = new Set();
    const restA = [];
    for (const x of la) {
      let hit = -1;
      for (let n = 0; n < lb.length; n++) {
        if (takenB.has(n)) continue;
        if (j(x.el) === j(lb[n].el)) { hit = n; break; }
      }
      if (hit >= 0) takenB.add(hit); else restA.push(x);
    }
    const restB = lb.filter((_, n) => !takenB.has(n));
    // pass 2 -- one leftover each side is an edit; anything else is not
    if (restA.length === 1 && restB.length === 1) {
      compareFields(regName, nameOf(kind, restA[0].el, restA[0].i),
        restA[0].el, restB[0].el, sink);
    } else {
      const dup = la.length > 1 || lb.length > 1;
      restA.forEach(x => removed.push({ x, dup }));
      restB.forEach(x => added.push({ x, dup }));
    }
  }

  const byLine = (u, v) => u.x.i - v.x.i;
  removed.sort(byLine).forEach(v => add(sink, existence,
    nameOf(kind, v.x.el, v.x.i) + disambiguator(kind, v.x.el, v.dup) + ' removed'));
  added.sort(byLine).forEach(v => add(sink, existence,
    nameOf(kind, v.x.el, v.x.i) + disambiguator(kind, v.x.el, v.dup) + ' added'));

  // Same label, different id: named, never guessed at.
  for (const r of removed) {
    if (r.x.el.label === undefined) continue;
    for (const a of added) {
      if (a.x.el.label === r.x.el.label && a.x.el.id !== r.x.el.id)
        sink.warnings.push('possible rename (reported as remove + add, not as ' +
          'one element): ' + nameOf(kind, r.x.el, r.x.i) + ' and ' +
          nameOf(kind, a.x.el, a.x.i) + ' carry the same label');
    }
  }
}

// When several elements share one key, the name alone does not say WHICH one
// appeared or disappeared. These short containment and classification keys are
// what distinguishes them in the source, so they are echoed on the line.
const DISAMBIGUATE = ['in', 'group', 'role', 'type', 'offset', 'from',
                      'to', 'plane', 'class'];

// Keys the element's NAME already shows, per collection: repeating them in the
// disambiguator would say the same thing twice.
const NAMED_KEYS = { thresholds: ['in'], bands: ['in'], states: ['lifeline'] };

function disambiguator(kind, el, dup) {
  if (!dup) return '';
  const already = NAMED_KEYS[kind] || [];
  const parts = [];
  for (const k of DISAMBIGUATE) {
    if (already.indexOf(k) >= 0) continue;
    if (el[k] === undefined || k === 'plane' && el[k] === 'base') continue;
    parts.push(k + '=' + (Array.isArray(el[k]) ? el[k].join(',') : el[k]));
  }
  return parts.length ? ' (' + parts.join(', ') + ')' : '';
}

// ---- Edges and messages --------------------------------------------------
//
// Three passes, each stricter than the next is allowed to be:
//   1. exact tuple (endpoints + direction + every label) -- these are the
//      same edge, no judgement needed;
//   2. of what is left, an UNAMBIGUOUS pairing: exactly one unmatched edge
//      between that endpoint pair on each side. Only then may a label or a
//      direction edit be reported as one change to one edge;
//   3. everything else is a removal and an addition. Two edges between the
//      same pair, both edited, cannot be paired without guessing which became
//      which, and a guess here would be a false semantic fact.
//
// Pass 0 (CONNECTOR-IDENTITY-KEY) runs before all three and is by id. Where a figure names its
// connectors, pass 3 stops being where parallel edges land: four relabelled
// links between one pair read as four changes rather than as eight facts.
// Two edges the matcher has paired. Endpoints, direction and the two end
// labels are compared on the CANONICAL form, so rewriting one relation the
// other way round is reported as a rewrite (presentation) and never as a
// change of endpoints (meaning); everything else goes through the register.
function compareEdgePair(kind, regName, ea, ia, eb, sink) {
  const name = nameOf(kind, ea, ia);
  const ca = canonEdge(ea), cb = canonEdge(eb);
  if (ca.a !== cb.a || ca.b !== cb.b || ca.op !== cb.op)
    add(sink, S, name + ': endpoints/direction changed to ' + edgeText(eb));
  else if (j([ea.a, ea.op, ea.b]) !== j([eb.a, eb.op, eb.b]))
    add(sink, P, name + ': rewritten as ' + edgeText(eb) +
      ' (the same relation, written the other way round)');
  if (!eq(ca.tail, cb.tail))
    add(sink, S, name + ': tail label ' + fmt(ca.tail) + ' -> ' + fmt(cb.tail));
  if (!eq(ca.head, cb.head))
    add(sink, S, name + ': head label ' + fmt(ca.head) + ' -> ' + fmt(cb.head));
  const rest = (e) => {
    const o = {};
    for (const k of Object.keys(e))
      if (!['a', 'op', 'b', 'tail', 'head'].includes(k)) o[k] = e[k];
    return o;
  };
  compareFields(regName, name, rest(ea), rest(eb), sink);
}

function edgeDiff(kind, regName, listA, listB, sink) {
  const left = listA.map((el, i) => ({ el, i }));
  const right = listB.map((el, i) => ({ el, i }));
  const usedL = new Set(), usedR = new Set();
  const hasId = (x) => x.el.id !== undefined && x.el.id !== null;

  // PASS 0 -- BY ID (CONNECTOR-IDENTITY-KEY, figdown 0.5). A connector may now carry an `id=`,
  // and where one does it is matched by that id and by nothing else, which is
  // the rule every other identified collection in this tool already follows.
  // This pass runs FIRST so that a label edit on one of four parallel links
  // becomes ONE reported change instead of falling to pass 3 and reading as
  // eight facts -- the cost `decisions/registry.md`
  // recorded against itself, bought back here.
  const byId = new Map();
  right.forEach(r => { if (hasId(r)) byId.set(String(r.el.id), r); });
  left.forEach(l => {
    if (!hasId(l)) return;
    const r = byId.get(String(l.el.id));
    if (!r || usedR.has(r.i)) return;
    usedL.add(l.i); usedR.add(r.i);
    compareEdgePair(kind, regName, l.el, l.i, r.el, sink);
  });

  // WHAT AN UNMATCHED ID MAY NOT DO, and this is the half that keeps the
  // rename rule honest. An identified connector whose id found no twin is
  // still allowed into the passes below -- but never AGAINST ANOTHER
  // IDENTIFIED ONE. Two connectors that both carry ids and did not match have
  // DIFFERENT ids, and pairing them would be reading `id=lag1a` becoming
  // `id=lag1x` as one edit, which is the guess §5's rename rule forbids: a
  // rename is a removal and an addition. Pairing an identified connector with
  // an ANONYMOUS one is a different judgement and a safe one -- it is the
  // connector gaining or losing a handle, and only the strictest match (the
  // exact tuple, or a unique endpoint pair) can produce it.
  const pairable = (l, r) => !(hasId(l) && hasId(r));

  const byFull = new Map();
  right.forEach(r => {
    const k = fullEdgeKey(r.el);
    if (!byFull.has(k)) byFull.set(k, []);
    byFull.get(k).push(r);
  });
  left.forEach(l => {
    if (usedL.has(l.i)) return;
    const bucket = byFull.get(fullEdgeKey(l.el));
    if (!bucket) return;
    for (let n = 0; n < bucket.length; n++) {
      const r = bucket[n];
      if (usedR.has(r.i) || !pairable(l, r)) continue;
      bucket.splice(n, 1);
      usedL.add(l.i); usedR.add(r.i);
      compareEdgePair(kind, regName, l.el, l.i, r.el, sink);
      return;
    }
  });

  const restL = left.filter(x => !usedL.has(x.i));
  const restR = right.filter(x => !usedR.has(x.i));
  const group = (list) => {
    const m = new Map();
    list.forEach(x => {
      const k = endpointKey(x.el);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    });
    return m;
  };
  const gL = group(restL), gR = group(restR);
  for (const [k, ls] of gL) {
    const rs = gR.get(k);
    if (!rs || ls.length !== 1 || rs.length !== 1) continue;
    if (!pairable(ls[0], rs[0])) continue;
    usedL.add(ls[0].i); usedR.add(rs[0].i);
    compareEdgePair(kind, regName, ls[0].el, ls[0].i, rs[0].el, sink);
  }

  const existence = EXISTENCE[kind] || S;
  const goneL = left.filter(x => !usedL.has(x.i));
  const goneR = right.filter(x => !usedR.has(x.i));
  goneL.forEach(x => add(sink, existence, nameOf(kind, x.el, x.i) + ' removed'));
  goneR.forEach(x => add(sink, existence, nameOf(kind, x.el, x.i) + ' added'));

  // Different id, everything else the same: NAMED, never guessed at. This is
  // the keyed collections' shared-label note, in the form an edge can carry it
  // -- an edge's "same thing under another name" is its whole tuple, since a
  // connector has no label of its own that a node does not.
  for (const l of goneL) {
    if (!hasId(l)) continue;
    for (const r of goneR) {
      if (!hasId(r) || String(r.el.id) === String(l.el.id)) continue;
      if (fullEdgeKey(l.el) !== fullEdgeKey(r.el)) continue;
      sink.warnings.push('possible rename (reported as remove + add, not as ' +
        'one element): ' + nameOf(kind, l.el, l.i) + ' and ' +
        nameOf(kind, r.el, r.i) + ' differ only in their id=');
    }
  }
}

// ---- Ordered id-less lists ----------------------------------------------
//
// A table row, a bitfield field and a timing signal are addressed by their
// POSITION. When the two sides hold the same number of them, position is an
// honest identity and the comparison goes down to the cell; when the count
// changed, position is not, so the tool falls back to a longest-common-
// subsequence over each entry's MEANING and reports whole entries added and
// removed. That is the deliberate coarseness: `row 4 changed` after an
// insertion would be a fact about the wrong row.
function lcsPairs(a, b, keyOf) {
  const n = a.length, m = b.length;
  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let k = m - 1; k >= 0; k--)
      dp[i][k] = keyOf(a[i]) === keyOf(b[k])
        ? dp[i + 1][k + 1] + 1
        : Math.max(dp[i + 1][k], dp[i][k + 1]);
  const out = [];
  let i = 0, k = 0;
  while (i < n && k < m) {
    if (keyOf(a[i]) === keyOf(b[k])) { out.push([i, k]); i++; k++; }
    else if (dp[i + 1][k] >= dp[i][k + 1]) { out.push([i, null]); i++; }
    else { out.push([null, k]); k++; }
  }
  while (i < n) { out.push([i, null]); i++; }
  while (k < m) { out.push([null, k]); k++; }
  return out;
}

// The meaning-only projection of an element, used as the LCS key so that a
// pure recolouring never reads as a removal plus an addition.
function semanticKey(regName, el) {
  const reg = REG[regName] || {};
  const out = {};
  for (const k of Object.keys(el).sort()) {
    if (k === 'line') continue;
    if (reg[k] === P) continue;
    out[k] = el[k];
  }
  return j(out);
}

// ---- Declaration order ---------------------------------------------------
//
// Reordering declarations is not meaning (the model gives document order and
// the drawing does not follow from it), but it can move the auto-layout, so it
// is reported -- once, per collection -- as a PRESENTATION delta. It is
// reported only when the two sides hold the SAME entries in a different
// sequence; when entries were added or removed the itemized lines above
// already say so.
const ORDERED_MEANING = new Set(['messages', 'states']);

function orderDelta(kind, regName, listA, listB, sink) {
  if (ORDERED_MEANING.has(kind)) return;
  const ka = listA.map(el => semanticKey(regName, el));
  const kb = listB.map(el => semanticKey(regName, el));
  if (ka.length !== kb.length) return;
  if (j(ka) === j(kb)) return;
  if (j(ka.slice().sort()) !== j(kb.slice().sort())) return;
  add(sink, P, kind + ': declaration order changed (same entries, different ' +
    'sequence; affects layout only)');
}

// ---- Typed-block content -------------------------------------------------

function cellText(c) {
  if (!c || typeof c !== 'object') return fmt(c);
  return fmt(c.v) + (c.merge !== undefined ? ' merge=' + c.merge : '');
}

function rowText(cells) {
  return (cells || []).map(cellText).join(' | ');
}

function diffCells(name, cellsA, cellsB, sink) {
  if ((cellsA || []).length !== (cellsB || []).length) {
    add(sink, S, name + ' content changed: ' + rowText(cellsA) + ' -> ' +
      rowText(cellsB) + ' (cell count ' + (cellsA || []).length + ' -> ' +
      (cellsB || []).length + ')');
    return;
  }
  cellsA.forEach((ca, i) => {
    const cb = cellsB[i];
    if (eq(ca, cb)) return;
    add(sink, S, name + ' col ' + (i + 1) + ': ' + cellText(ca) + ' -> ' +
      cellText(cb));
  });
}

function diffTable(name, a, b, sink) {
  const ha = a.heads || [], hb = b.heads || [];
  if (ha.length !== hb.length) {
    add(sink, S, name + ': header rows ' + ha.length + ' -> ' + hb.length);
  } else {
    ha.forEach((row, i) => diffCells(name + ' header row ' + (i + 1), row, hb[i], sink));
  }

  const ra = a.rows || [], rb = b.rows || [];
  if (ra.length === rb.length) {
    ra.forEach((row, i) =>
      diffCells(name + ' row ' + (i + 1), row.cells, rb[i].cells, sink));
  } else {
    const key = (r) => j((r.cells || []).map(c => [c.v, c.merge]));
    for (const [i, k] of lcsPairs(ra, rb, key)) {
      if (i !== null && k === null)
        add(sink, S, name + ' row removed: ' + rowText(ra[i].cells));
      else if (i === null && k !== null)
        add(sink, S, name + ' row added: ' + rowText(rb[k].cells));
    }
  }

  if (!eq(a.width, b.width))
    add(sink, P, name + ': column widths ' +
      fmt(a.width && a.width.widths) + ' -> ' + fmt(b.width && b.width.widths));
  // A `mark` addresses ONE cell. Its address is its identity; two marks on one
  // address are matched in declaration order. The mark's CLASS is a class
  // assignment and therefore meaning; its fill and stroke are ink. So a mark
  // that appears or disappears is a meaning delta only when it carries a class
  // -- an uncoloured-to-coloured cell states nothing a reading agent may
  // consume (PRESENTATION-AS-MEANING-CARRIER).
  const markKey = (m) => (m.header ? 'header row ' : 'row ') + m.row +
    ' col ' + m.col;
  const bucket = (list) => {
    const m = new Map();
    (list || []).forEach(x => {
      const k = markKey(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    });
    return m;
  };
  const mA = bucket(a.marks), mB = bucket(b.marks);
  const addrs = new Set(Array.from(mA.keys()).concat(Array.from(mB.keys())));
  for (const k of Array.from(addrs).sort()) {
    const la = mA.get(k) || [], lb = mB.get(k) || [];
    const n = Math.max(la.length, lb.length);
    for (let i = 0; i < n; i++) {
      const x = la[i], y = lb[i];
      const label = name + ' mark ' + k;
      if (x && y) compareFields('mark', label, x, y, sink);
      else if (x) add(sink, x.class ? S : P, label + ' removed');
      else add(sink, y.class ? S : P, label + ' added');
    }

  }

  const hlA = (a.highlights || []).map(h => h.row).sort();
  const hlB = (b.highlights || []).map(h => h.row).sort();
  if (j(hlA) !== j(hlB))
    add(sink, P, name + ': highlighted rows ' + fmt(hlA) + ' -> ' + fmt(hlB));
}

function fieldName(f, i) {
  if (f.break) return 'break #' + (i + 1);
  return 'field ' + (f.name !== undefined ? j(f.name) : '#' + (i + 1));
}

function diffBitfield(name, a, b, sink) {
  const fa = a.fields || [], fb = b.fields || [];
  if (fa.length === fb.length) {
    fa.forEach((f, i) =>
      compareFields('field', name + ' ' + fieldName(f, i), f, fb[i], sink));
  } else {
    for (const [i, k] of lcsPairs(fa, fb, f => semanticKey('field', f))) {
      if (i !== null && k === null)
        add(sink, S, name + ' ' + fieldName(fa[i], i) + ' removed');
      else if (i === null && k !== null)
        add(sink, S, name + ' ' + fieldName(fb[k], k) + ' added');
      else compareFields('field', name + ' ' + fieldName(fa[i], i), fa[i], fb[k], sink);
    }
  }
}

function diffTiming(name, a, b, sink) {
  const sa = a.signals || [], sb = b.signals || [];
  const uniq = (l) => new Set(l.map(s => s.name)).size === l.length;
  const sig = (s) => name + ' signal ' + fmt(s.name);
  if (uniq(sa) && uniq(sb)) {
    // A signal's NAME is what the source calls it, and when the names are
    // unique on both sides it is an honest identity.
    const mA = new Map(sa.map(s => [s.name, s]));
    const mB = new Map(sb.map(s => [s.name, s]));
    for (const [k, x] of mA) {
      if (!mB.has(k)) { add(sink, S, sig(x) + ' removed'); continue; }
      compareFields('signal', sig(x), x, mB.get(k), sink);
    }
    for (const [k, y] of mB) if (!mA.has(k)) add(sink, S, sig(y) + ' added');
  } else if (sa.length === sb.length) {
    sa.forEach((s, i) => compareFields('signal', sig(s), s, sb[i], sink));
  } else {
    for (const [i, k] of lcsPairs(sa, sb, s => semanticKey('signal', s))) {
      if (i !== null && k === null) add(sink, S, sig(sa[i]) + ' removed');
      else if (i === null && k !== null) add(sink, S, sig(sb[k]) + ' added');
      else compareFields('signal', sig(sa[i]), sa[i], sb[k], sink);
    }
  }
  if (!eq(a.gaps, b.gaps))
    add(sink, S, name + ': gaps ' + fmt(a.gaps) + ' -> ' + fmt(b.gaps));
}

const REGION_REG = { bitfield: 'bitfield', table: 'table', timing: 'timing',
                     chart: 'chart' };

function diffRegions(listA, listB, sink) {
  const keyOf = (r, i) => (r.id !== undefined ? 'id:' + r.id : 'ix:' + i);
  const A = new Map(), B = new Map();
  listA.forEach((r, i) => A.set(keyOf(r, i), { el: r, i }));
  listB.forEach((r, i) => B.set(keyOf(r, i), { el: r, i }));
  for (const [k, va] of A) {
    if (!B.has(k)) { add(sink, S, nameOf('regions', va.el, va.i) + ' removed'); continue; }
    const vb = B.get(k);
    const name = nameOf('regions', va.el, va.i);
    if (va.el.genre !== vb.el.genre) {
      add(sink, S, name + ' replaced by ' + nameOf('regions', vb.el, vb.i));
      continue;
    }
    const regName = REGION_REG[va.el.genre] || 'region';
    compareFields(regName, name, va.el, vb.el, sink);
    if (va.el.genre === 'table') diffTable(name, va.el, vb.el, sink);
    else if (va.el.genre === 'bitfield') diffBitfield(name, va.el, vb.el, sink);
    else if (va.el.genre === 'timing') diffTiming(name, va.el, vb.el, sink);
  }
  for (const [k, vb] of B)
    if (!A.has(k)) add(sink, S, nameOf('regions', vb.el, vb.i) + ' added');
}

// ---- Sequence time order -------------------------------------------------
//
// A sequence figure's content includes the ORDER of its messages and states,
// and that order is the union of the two collections read down the source. A
// pure reordering leaves both collections intact, so nothing above would see
// it. It is reported only when the two sides hold exactly the same occurrences
// in a different order; when occurrences were added or removed, the itemized
// lines already say so.
function timeOrder(doc) {
  const items = [];
  (doc.messages || []).forEach(m =>
    items.push({ line: m.line, k: 'message ' + fullEdgeKey(m) }));
  (doc.states || []).forEach(s =>
    items.push({ line: s.line, k: 'state ' + s.lifeline + ' ' + j(s.name) }));
  items.sort((x, y) => x.line - y.line);
  return items.map(x => x.k);
}

function diffTimeOrder(rawA, rawB, sink) {
  const oa = timeOrder(rawA), ob = timeOrder(rawB);
  if (j(oa) === j(ob)) return;
  if (j(oa.slice().sort()) !== j(ob.slice().sort())) return;
  add(sink, S, 'sequence: the time order of messages and states changed: ' +
    oa.join(' ; ') + ' -> ' + ob.join(' ; '));
}

// ---- One section ---------------------------------------------------------

const KEYED = [
  ['classes',   'classes',   el => el.id],
  ['planes',    'planes',    el => el.id],
  ['nodes',     'nodes',     el => el.id],
  ['groups',    'groups',    el => el.id],
  ['externals', 'externals', el => el.id],
  ['bundles',   'bundles',   el => el.id],
  ['pins',      'pins',      el => el.id],
  ['thresholds','thresholds',el => el.in + '|' + el.label],
  ['bands',     'bands',     el => el.in + '|' + el.label],
  ['ranks',     'ranks',     el => j(el.ids)],
  ['lifelines', 'lifelines', el => el.id],
  ['fragments', 'fragments', el => el.id],
  ['operands',  'operands',  el => el.id],
  ['states',    'states',    el => el.lifeline + '|' + el.name],
];

// Runs one collection's diff into a child sink and merges it back, recording
// WHICH model keys that run is answerable for. The record is what the safety
// net (below) checks itself against: without it the net can only ask "did the
// walk say anything at all", which is answered by any delta anywhere.
function scoped(covers, sink, fn) {
  const child = makeSink();
  fn(child);
  const found = child.semantic.length + child.presentation.length;
  child.semantic.forEach(t => sink.semantic.push(t));
  child.presentation.forEach(t => sink.presentation.push(t));
  child.warnings.forEach(t => sink.warnings.push(t));
  if (found) for (const k of covers) sink.explained.add(k);
}

function diffSection(a, b, rawA, rawB, sink) {
  scoped(['header'], sink, s =>
    compareFields('header', 'header', a.header || {}, b.header || {}, s));
  const docA = {}, docB = {};
  for (const k of ['title', 'note', 'flow']) {
    if (a[k] !== undefined) docA[k] = a[k];
    if (b[k] !== undefined) docB[k] = b[k];
  }
  scoped(['title', 'note', 'flow'], sink, s =>
    compareFields('document', 'document', docA, docB, s));

  for (const [kind, regName, keyOf] of KEYED) {
    const la = a[kind] || [], lb = b[kind] || [];
    scoped([kind], sink, s => {
      keyedDiff(kind, regName, la, lb, keyOf, s);
      orderDelta(kind, regName, la, lb, s);
    });
  }
  scoped(['edges'], sink, s => {
    edgeDiff('edges', 'edges', a.edges || [], b.edges || [], s);
    orderDelta('edges', 'edges', a.edges || [], b.edges || [], s);
  });
  scoped(['messages'], sink, s =>
    edgeDiff('messages', 'messages', a.messages || [], b.messages || [], s));
  scoped(['regions'], sink, s => diffRegions(a.regions || [], b.regions || [], s));
  // The time-order check reads both occurrence collections and answers for
  // both: a pure reordering shows up in each of them and in neither alone.
  scoped(['messages', 'states'], sink, s => diffTimeOrder(rawA, rawB, s));
  safetyNet(a, b, sink);
}

// ---- The safety net ------------------------------------------------------
//
// Everything above is a WHITELIST: it reports the fields it knows. This is the
// complement -- an equality check over the model itself, which cannot be fooled
// by a field the routines above forgot. An unexplained model difference is
// exactly what this tool must never report as `identical`, so it is reported,
// named, and counted as meaning.
//
// IT ASKS PER COLLECTION, NOT PER DOCUMENT. The first version asked "did the
// walk produce any delta at all" -- which any delta anywhere answers, so a
// missed field in one collection was covered up by a reported field in
// another. The net now compares each model key separately and fires on a key
// whose own routine reported nothing.
//
// The comparison is made on an ORDER-INSENSITIVE canonical form (each
// collection sorted, except the sequence occurrences whose order IS content,
// and each edge folded to its canonical direction) so that the two edits the
// routines above deliberately do not call meaning -- reordering declarations,
// and rewriting `a <- b` as `b -> a` -- do not trip it.
function canonKey(k, v) {
  if (Array.isArray(v)) {
    let list = v;
    if (k === 'edges' || k === 'messages')
      list = list.map(e => Object.assign({}, e, canonEdge(e)));
    list = list.map(x => j(stripLines(x)));
    if (!ORDERED_MEANING.has(k)) list = list.slice().sort();
    return j(list);
  }
  return j(stripLines(v));
}

function safetyNet(a, b, sink) {
  const keys = Array.from(new Set(Object.keys(a).concat(Object.keys(b)))).sort();
  for (const k of keys) {
    if (canonKey(k, a[k]) === canonKey(k, b[k])) continue;
    if (sink.explained.has(k)) continue;
    add(sink, S, k + ': the two models differ here in a way this tool did not ' +
      'itemize (reported as meaning by the zero-false-negative rule)');
    sink.warnings.push('unitemized model difference in `' + k + '`: that ' +
      'collection differs but its classification routine reported nothing');
  }
}

// ---- Whole document ------------------------------------------------------

function parseSide(text, label) {
  const r = engine.parse(text);
  const errors = (r.errors || []).slice();
  const docs = (r.docs && r.docs.length) ? r.docs : (r.doc ? [r.doc] : []);
  return { label, errors, docs };
}

function diffDocuments(textA, textB, labelA, labelB) {
  const A = parseSide(textA, labelA), B = parseSide(textB, labelB);
  if (A.errors.length || B.errors.length) {
    return { fatal: true, errors: [[A.label, A.errors], [B.label, B.errors]] };
  }
  const n = Math.max(A.docs.length, B.docs.length);
  const sections = [];
  for (let i = 0; i < n; i++) {
    const sink = makeSink();
    const da = A.docs[i], db = B.docs[i];
    if (da && !db) add(sink, S, 'section ' + (i + 1) + ' removed');
    else if (!da && db) add(sink, S, 'section ' + (i + 1) + ' added');
    else diffSection(stripLines(normalize(da)), stripLines(normalize(db)), da, db, sink);
    sections.push({
      index: i + 1,
      verdict: sink.semantic.length ? 'semantic'
             : sink.presentation.length ? 'presentation-only' : 'unchanged',
      semantic: sink.semantic,
      presentation: sink.presentation,
      warnings: sink.warnings,
    });
  }
  const semantic = [], presentation = [], warnings = [];
  const tag = (s, t) => (sections.length > 1 ? '[section ' + s.index + '] ' + t : t);
  for (const s of sections) {
    s.semantic.forEach(t => semantic.push(tag(s, t)));
    s.presentation.forEach(t => presentation.push(tag(s, t)));
    s.warnings.forEach(t => warnings.push(tag(s, t)));
  }
  const verdict = semantic.length ? 'semantic'
    : presentation.length ? 'presentation-only'
    : (textA === textB ? 'identical' : 'comment-only');
  return { fatal: false, verdict, sections, semantic, presentation, warnings,
           sectionCount: n };
}

const EXIT = { identical: 0, 'comment-only': 0, 'presentation-only': 3,
               semantic: 4 };

// ---- Output --------------------------------------------------------------

const VERDICT_GLOSS = {
  identical: 'the two sources are byte-identical',
  'comment-only': 'the sources differ; the models do not (comments, blank ' +
    'lines, whitespace, line positions)',
  'presentation-only': 'the drawing changed; nothing a reading agent may ' +
    'consume did',
  semantic: 'at least one fact a reading agent may consume changed',
};

function report(res, labelA, labelB) {
  const out = [];
  out.push('VERDICT: ' + res.verdict + '  (' + VERDICT_GLOSS[res.verdict] + ')');
  out.push('  A: ' + labelA);
  out.push('  B: ' + labelB);
  if (res.sectionCount > 1) out.push('  sections: ' + res.sectionCount);
  out.push('');
  out.push('Meaning (' + res.semantic.length + ')');
  if (!res.semantic.length) out.push('  (none)');
  else res.semantic.forEach(t => out.push('  ' + t));
  out.push('');
  out.push('Presentation (' + res.presentation.length + ')');
  if (!res.presentation.length) out.push('  (none)');
  else res.presentation.forEach(t => out.push('  ' + t));
  if (res.warnings.length) {
    out.push('');
    out.push('Notes (' + res.warnings.length + ')');
    res.warnings.forEach(t => out.push('  ' + t));
  }
  return out.join('\n');
}

function reportJson(res, labelA, labelB) {
  return JSON.stringify({
    tool: 'figdown-diff',
    stage: 1,
    a: labelA,
    b: labelB,
    verdict: res.verdict,
    exit: EXIT[res.verdict],
    sections: res.sections.map(s => ({
      index: s.index,
      verdict: s.verdict,
      meaning: s.semantic,
      presentation: s.presentation,
      notes: s.warnings,
    })),
    meaning: res.semantic,
    presentation: res.presentation,
    notes: res.warnings,
  }, null, 2);
}

function reportErrors(errors, asJson) {
  if (asJson) {
    return JSON.stringify({
      tool: 'figdown-diff', stage: 1, verdict: 'error', exit: 2,
      errors: errors.map(([label, list]) => ({ source: label, errors: list })),
    }, null, 2);
  }
  const out = ['VERDICT: error  (a side did not parse; a diff over an invalid ' +
    'document would lie)'];
  for (const [label, list] of errors) {
    out.push('');
    out.push(label + ': ' + (list.length ? list.length + ' error(s)' : 'parses clean'));
    list.forEach(e => out.push('  ' + e));
  }
  return out.join('\n');
}

// ---- Self-test -----------------------------------------------------------
//
// Synthetic pairs, one per class of edit, asserting the VERDICT and the
// itemized facts. These are the tool's own regression corpus: they are
// authored here rather than taken from history so that a case exists for every
// branch of the classification, including the ones the repository's own
// revisions happen never to have exercised.
const TOPO = [
  'figdown 0.4 topology',
  'title "Leaf and spine"',
  'class underlay "Physical link between leaf and spine"',
  'node lf1 "Leaf-1"',
  'node lf2 "Leaf-2"',
  'node sp1 "Spine-1"',
  'edge lf1 -- sp1 class=underlay',
  '',
].join('\n');

function sub(text, from, to) {
  if (text.indexOf(from) < 0) throw new Error('selftest fixture: ' + from);
  return text.replace(from, to);
}

// CONNECTOR-IDENTITY-KEY/EDGE-IDENTITY-CONSUMERS: the identified-connector fixture. THREE PARALLEL LINKS between
// one pair — the population the tool used to report eight facts about when
// four of them were relabelled, because it had nothing to pair them by. It
// declares `figdown 0.5`, which is the version `id=` is legal in.
const LAG = [
  'figdown 0.5 topology',
  'title "A three-link LAG"',
  'node sw1 "Switch-1"',
  'node sw2 "Switch-2"',
  'edge sw1 -[ge-0/0/0]- sw2 id=lag1a',
  'edge sw1 -[ge-0/0/1]- sw2 id=lag1b',
  'edge sw1 -[ge-0/0/2]- sw2 id=lag1c',
  'bundle lag1 "LAG-1" lag1a,lag1b,lag1c',
  '',
].join('\n');

// The mixed population, which is the normal case and the one that must not
// degrade: two named connectors and one anonymous one between the same pair.
const MIXED = [
  'figdown 0.5 topology',
  'node sw1 "Switch-1"',
  'node sw2 "Switch-2"',
  'edge sw1 -[a]- sw2 id=m1',
  'edge sw1 -[b]- sw2 id=m2',
  'edge sw1 -[c]- sw2',
  '',
].join('\n');

const TABLE = [
  'figdown 0.4 table',
  'table ports "Port state"',
  '| Port | State |',
  '|------|-------|',
  '| e1   | up    |',
  '| e2   | down  |',
  '',
].join('\n');

const BITS = [
  'figdown 0.4 bitfield',
  'bitfield hdr "Header" word=16 numbering=msb0',
  'field "ID" 16 description="transaction identifier"',
  'field "LEN" 16',
  '',
].join('\n');

const SEQ = [
  'figdown 0.4 sequence',
  'lifeline c "Client"',
  'lifeline s "Server"',
  'message c -> s "SYN"',
  'message c <- s "SYN-ACK"',
  '',
].join('\n');

const STATECHART = [
  'figdown 0.2 statechart',
  'state s1 "IDLE"',
  'state s2 "BUSY"',
  'transition s1 -> s2',
  '',
].join('\n');

// Four `state c "INIT"` occurrences under one lifeline: the shape that made
// ordinal pairing fabricate facts.
const OCCUR = [
  'figdown 0.4 sequence',
  'lifeline c "Client"',
  'lifeline s "Server"',
  'state c "INIT"',
  'message c -> s "DISCOVER"',
  'state c "SELECTING"',
  'fragment f "did the address check out?" type=alt',
  'operand conflict "no — the address is in use" in=f',
  'message c -> s "DECLINE" in=conflict',
  'operand refused "no — the server refused" in=f',
  'message c -> s "REQUEST" in=refused',
  'state c "INIT" in=refused',
  'message c -> s "RENEW"',
  'state c "BOUND"',
  'state c "INIT"',
  '',
].join('\n');

const THRESHOLDS = [
  'figdown 0.4 block',
  'group pool "Pool"',
  'node a "A" in=pool',
  'threshold "Cap" in=pool offset=50%',
  'threshold "Cap" in=pool offset=80%',
  '',
].join('\n');

const CASES = [
  { name: 'identical',
    a: TOPO, b: TOPO, verdict: 'identical' },

  { name: 'comment-only',
    a: TOPO,
    b: sub(TOPO, 'node lf1 "Leaf-1"',
      '# the leaf that carries the host\n\nnode lf1 "Leaf-1"'),
    verdict: 'comment-only' },

  { name: 'presentation: fill',
    a: TOPO, b: sub(TOPO, 'node lf1 "Leaf-1"', 'node lf1 "Leaf-1" fill=#eef2ff'),
    verdict: 'presentation-only',
    presentation: ['node lf1 "Leaf-1": fill (none) -> "#eef2ff"'] },

  { name: 'presentation: shape',
    a: TOPO, b: sub(TOPO, 'node lf1 "Leaf-1"', 'node lf1 "Leaf-1" shape=rounded'),
    verdict: 'presentation-only',
    presentation: ['node lf1 "Leaf-1": shape "box" -> "rounded"'] },

  { name: 'presentation: stroke and style on an edge',
    a: TOPO,
    b: sub(TOPO, 'edge lf1 -- sp1 class=underlay',
      'edge lf1 -- sp1 class=underlay stroke=#dc2626 style=dashed'),
    verdict: 'presentation-only',
    presentation: ['edge lf1 -- sp1: stroke (none) -> "#dc2626"',
                   'edge lf1 -- sp1: style (none) -> "dashed"'] },

  { name: 'presentation: flow and rank',
    a: TOPO, b: sub(TOPO, 'node lf1 "Leaf-1"',
      'flow down\nrank lf1,lf2\nnode lf1 "Leaf-1"'),
    verdict: 'presentation-only',
    presentation: ['document: flow "right" -> "down"', 'rank lf1,lf2 added'] },

  { name: 'presentation: the layout zone',
    a: TOPO, b: TOPO + 'layout\npin lf1 at=(20,20)\n',
    verdict: 'presentation-only',
    presentation: ['pin lf1 added'] },

  { name: 'presentation: a class definition\'s style',
    a: TOPO,
    b: sub(TOPO, 'class underlay "Physical link between leaf and spine"',
      'class underlay "Physical link between leaf and spine" stroke=#555'),
    verdict: 'presentation-only',
    presentation: ['class underlay: stroke (none) -> "#555"'] },

  { name: 'presentation: an edge written the other way round',
    a: TOPO, b: sub(TOPO, 'edge lf1 -- sp1', 'edge sp1 -- lf1'),
    verdict: 'presentation-only',
    presentation: ['edge lf1 -- sp1: rewritten as sp1 -- lf1'] },

  { name: 'meaning: a node label',
    a: TOPO, b: sub(TOPO, 'node lf1 "Leaf-1"', 'node lf1 "Leaf-1 (VTEP)"'),
    verdict: 'semantic',
    semantic: ['node lf1 "Leaf-1": label "Leaf-1" -> "Leaf-1 (VTEP)"'] },

  { name: 'meaning: an edge added',
    a: TOPO, b: TOPO + 'edge lf2 -- sp1\n',
    verdict: 'semantic',
    semantic: ['edge lf2 -- sp1 added'] },

  { name: 'meaning: an edge removed',
    a: TOPO, b: sub(TOPO, 'edge lf1 -- sp1 class=underlay\n', ''),
    verdict: 'semantic',
    semantic: ['edge lf1 -- sp1 removed'] },

  { name: 'meaning: an edge direction',
    a: sub(TOPO, 'edge lf1 -- sp1 class=underlay', 'edge lf1 -> sp1'),
    b: sub(TOPO, 'edge lf1 -- sp1 class=underlay', 'edge sp1 -> lf1'),
    verdict: 'semantic',
    semantic: ['edge lf1 -> sp1: endpoints/direction changed to sp1 -> lf1'] },

  { name: 'meaning: an edge label',
    a: sub(TOPO, 'edge lf1 -- sp1 class=underlay', 'edge lf1 -[eBGP]- sp1'),
    b: sub(TOPO, 'edge lf1 -- sp1 class=underlay', 'edge lf1 -[iBGP]- sp1'),
    verdict: 'semantic',
    semantic: ['edge lf1 -[eBGP]- sp1: mid "eBGP" -> "iBGP"'] },

  // ---- CONNECTOR-IDENTITY-KEY/EDGE-IDENTITY-CONSUMERS: identified connectors ---------------------------------
  // The four judgements the id pass is allowed to make, and the one it is
  // not. Each case is a THREE-PARALLEL-LINK figure, which is the population
  // the tool used to have nothing to pair by.
  { name: 'meaning: a label edit on one of three parallel links, paired by id',
    a: LAG,
    b: sub(LAG, 'edge sw1 -[ge-0/0/1]- sw2 id=lag1b',
                'edge sw1 -[xe-0/0/1]- sw2 id=lag1b'),
    verdict: 'semantic',
    semantic: ['edge lag1b sw1 -[ge-0/0/1]- sw2: mid "ge-0/0/1" -> "xe-0/0/1"'],
    // ONE fact, not two. Without the id pass this pair falls to pass 3 and
    // reads as a removal plus an addition, which is the recorded cost.
    exactSemantic: 1,
    exactPresentation: 0,
    forbidden: ['removed', 'added'] },

  { name: 'meaning: a connector loses its id',
    a: LAG,
    b: sub(LAG, ' id=lag1b', '').replace('lag1a,lag1b,lag1c', 'lag1a,lag1c'),
    verdict: 'semantic',
    // The connector is still there and still says the same thing about the
    // figure; what changed is that nothing can name it any more. Pairing an
    // identified connector with an anonymous one is safe because only the
    // exact tuple can produce it.
    semantic: ['edge lag1b sw1 -[ge-0/0/1]- sw2: id "lag1b" -> (none)'],
    forbidden: ['edge lag1b sw1 -[ge-0/0/1]- sw2 removed'] },

  { name: 'meaning: a connector gains an id',
    a: MIXED,
    b: sub(MIXED, 'edge sw1 -[c]- sw2', 'edge sw1 -[c]- sw2 id=m3'),
    verdict: 'semantic',
    semantic: ['edge sw1 -[c]- sw2: id (none) -> "m3"'],
    exactSemantic: 1,
    forbidden: ['removed', 'added'] },

  { name: 'meaning: an id respelled is a removal and an addition, never a rename',
    a: LAG,
    b: sub(LAG, 'id=lag1b', 'id=lag1x').replace('lag1a,lag1b,lag1c',
                                                'lag1a,lag1x,lag1c'),
    verdict: 'semantic',
    // The rename rule does not move. Both connectors carry an id, the ids
    // differ, so the tool refuses to pair them and SAYS SO in a note instead
    // of guessing that one became the other.
    semantic: ['edge lag1b sw1 -[ge-0/0/1]- sw2 removed',
               'edge lag1x sw1 -[ge-0/0/1]- sw2 added'],
    notes: ['differ only in their id='],
    forbidden: ['id "lag1b" -> "lag1x"'] },

  { name: 'meaning: a mixed parallel population does not degrade',
    a: MIXED,
    b: sub(MIXED, 'edge sw1 -[c]- sw2', 'edge sw1 -[d]- sw2'),
    verdict: 'semantic',
    // The edited connector is the ANONYMOUS one, between a pair that also
    // carries two identified ones. The identified pair by id and leave the
    // field; what is left is one anonymous connector on each side, which the
    // existing passes handle exactly as they always did.
    semantic: ['edge sw1 -[c]- sw2: mid "c" -> "d"'],
    exactSemantic: 1,
    forbidden: ['removed', 'added'] },

  { name: 'meaning: a class assignment',
    a: TOPO, b: sub(TOPO, 'edge lf1 -- sp1 class=underlay', 'edge lf1 -- sp1'),
    verdict: 'semantic',
    semantic: ['edge lf1 -- sp1: class ["underlay"] -> (none)'] },

  { name: 'meaning: a class definition\'s label',
    a: TOPO,
    b: sub(TOPO, 'class underlay "Physical link between leaf and spine"',
      'class underlay "Logical overlay tunnel"'),
    verdict: 'semantic',
    semantic: ['class underlay: meaning "Physical link between leaf and spine"' +
      ' -> "Logical overlay tunnel"'] },

  { name: 'meaning: a note',
    a: TOPO, b: sub(TOPO, 'node lf1 "Leaf-1"',
      'node lf1 "Leaf-1" note="the only leaf with a host"'),
    verdict: 'semantic',
    semantic: ['node lf1 "Leaf-1": note (none) -> "the only leaf with a host"'] },

  { name: 'meaning: a group membership',
    a: TOPO,
    b: sub(TOPO, 'node lf1 "Leaf-1"', 'group pod "Pod 1"\nnode lf1 "Leaf-1" in=pod'),
    verdict: 'semantic',
    semantic: ['node lf1 "Leaf-1": group (none) -> "pod"',
               'group pod "Pod 1" added'] },

  { name: 'meaning: the title',
    a: TOPO, b: sub(TOPO, 'title "Leaf and spine"', 'title "Leaf and spine (pod 1)"'),
    verdict: 'semantic',
    semantic: ['document: title "Leaf and spine" -> "Leaf and spine (pod 1)"'] },

  { name: 'meaning: a rename is a remove and an add, never a guess',
    a: TOPO, b: sub(TOPO, 'node lf2 "Leaf-2"', 'node leaf2 "Leaf-2"'),
    verdict: 'semantic',
    semantic: ['node lf2 "Leaf-2" removed', 'node leaf2 "Leaf-2" added'],
    notes: ['possible rename'] },

  { name: 'meaning: a table cell',
    a: TABLE, b: sub(TABLE, '| e2   | down  |', '| e2   | up    |'),
    verdict: 'semantic',
    semantic: ['table ports "Port state" row 2 col 2: "down" -> "up"'] },

  { name: 'meaning: a table row added',
    a: TABLE, b: TABLE.replace('| e2   | down  |\n', '| e2   | down  |\n| e3   | up    |\n'),
    verdict: 'semantic',
    semantic: ['table ports "Port state" row added: "e3" | "up"'] },

  { name: 'meaning: a table merge marker',
    a: TABLE, b: sub(TABLE, '| e2   | down  |', '| e2   | <     |'),
    verdict: 'semantic',
    semantic: ['table ports "Port state" row 2 col 2:'] },

  { name: 'presentation: a table cell fill',
    a: TABLE, b: TABLE + 'cell (1,2) fill=#fecaca\n',
    verdict: 'presentation-only',
    presentation: ['table ports "Port state" mark row 1 col 2 added'] },

  { name: 'presentation: a table column width',
    a: TABLE, b: TABLE + 'width 90,auto\n',
    verdict: 'presentation-only',
    presentation: ['table ports "Port state": column widths'] },

  { name: 'meaning: a bitfield field width',
    a: BITS, b: sub(BITS, 'field "LEN" 16', 'field "LEN" 8'),
    verdict: 'semantic',
    semantic: ['bitfield hdr "Header" field "LEN": width 16 -> 8'] },

  { name: 'meaning: a bitfield description',
    a: BITS, b: sub(BITS, 'description="transaction identifier"',
      'description="transaction identifier, copied into the reply"'),
    verdict: 'semantic',
    semantic: ['bitfield hdr "Header" field "ID": description'] },

  { name: 'meaning: a message added',
    a: SEQ, b: SEQ + 'message c -> s "ACK"\n',
    verdict: 'semantic',
    semantic: ['message c -> s "ACK" added'] },

  { name: 'meaning: the time order of a sequence',
    a: SEQ + 'state c "ESTABLISHED"\n',
    b: sub(SEQ, 'message c -> s "SYN"', 'state c "ESTABLISHED"\nmessage c -> s "SYN"'),
    verdict: 'semantic',
    semantic: ['sequence: the time order of messages and states changed'] },

  { name: 'mixed: meaning and presentation together',
    a: TOPO,
    b: sub(sub(TOPO, 'node lf1 "Leaf-1"', 'node lf1 "Leaf-1 (VTEP)" fill=#eef2ff'),
      'node sp1 "Spine-1"', 'node sp1 "Spine-1" shape=rounded'),
    verdict: 'semantic',
    semantic: ['node lf1 "Leaf-1": label "Leaf-1" -> "Leaf-1 (VTEP)"'],
    presentation: ['node lf1 "Leaf-1": fill (none) -> "#eef2ff"',
                   'node sp1 "Spine-1": shape "box" -> "rounded"'] },

// ---- Regressions from the held-out evaluation --------------------------

  // A statechart `state` DERIVES shape `rounded`, so writing it changes
  // nothing: same model, and the same SVG byte for byte. Reporting a drawing
  // change here would be a false fact about the figure, and the source-level
  // edit is exactly what `comment-only` is for.
  { name: 'regression: a redundant shape= on a statechart state changes nothing',
    a: STATECHART,
    b: sub(STATECHART, 'state s1 "IDLE"', 'state s1 "IDLE" shape=rounded'),
    verdict: 'comment-only' },

  // The companion, and the one that proves the walk is not blind to the
  // collection: a shape the genre does NOT derive is seen at once.
  { name: 'regression: a real shape change on a statechart state IS seen',
    a: STATECHART,
    b: sub(STATECHART, 'state s1 "IDLE"', 'state s1 "IDLE" shape=circle'),
    verdict: 'presentation-only',
    presentation: ['node s1 "IDLE": shape "rounded" -> "circle"'] },

  { name: 'regression: state fill= on a statechart state is presentation',
    a: STATECHART,
    b: sub(STATECHART, 'state s1 "IDLE"', 'state s1 "IDLE" fill=#dbeafe'),
    verdict: 'presentation-only',
    presentation: ['node s1 "IDLE": fill (none) -> "#dbeafe"'] },

  // Four occurrences share the key (lifeline, name). One is INSERTED in the
  // middle; the other three are untouched. Pairing the multiset by ordinal
  // reported two `in=` mutations that never happened.
  { name: 'regression: one occurrence inserted among identical state occurrences',
    a: OCCUR,
    b: sub(OCCUR, 'operand refused',
      'state c "INIT" in=conflict\noperand refused'),
    verdict: 'semantic',
    semantic: ['state c "INIT" (in=conflict) added'],
    exactSemantic: 1,
    exactPresentation: 0,
    forbidden: ['in "refused" -> "conflict"', 'in (none) -> "refused"',
                'removed'] },

  // The same shape one collection over: thresholds are keyed by target+label
  // and a figure may carry several with one label.
  { name: 'regression: one threshold inserted among same-key thresholds',
    a: THRESHOLDS,
    b: sub(THRESHOLDS, 'threshold "Cap" in=pool offset=80%',
      'threshold "Cap" in=pool offset=65%\nthreshold "Cap" in=pool offset=80%'),
    verdict: 'semantic',
    semantic: ['threshold "Cap" in pool (offset=65) added'],
    exactSemantic: 1,
    forbidden: ['offset 80 -> 65', 'removed'] },

  { name: 'a side that does not parse is refused, not diffed',
    a: TOPO, b: TOPO + 'nodex q "Q"\n', fatal: true },
];

// ---- Permanent regressions -----------------------------------------------
//
// Checks that do not fit the "one document pair, one verdict" shape: the
// attribute-site audit, and the three real revision pairs that a held-out
// evaluation turned up. Each returns a list of problems; an empty list passes.
// A real-pair check SKIPS (it does not fail) where the revision cannot be read,
// so the suite still runs outside a checkout of this repository.

// The whole presentation surface, one site per (element, attribute). The two
// backstops in §3 of the design note are complements, not substitutes: they
// catch a field nobody classified. THIS catches a field nobody LOOKED at,
// which is the failure a whitelist actually has.
const AUDIT_BLOCK = [
  'figdown 0.4 block',
  'class hot "Hot path"',
  'group pool "Pool"',
  'node a "A" in=pool',
  'node b "B"',
  'edge a -- b',
  'external ext "from outside"',
  'threshold "Cap" in=pool offset=80%',
  'band "Reserved" 15% in=pool',
  '',
].join('\n');

const AUDIT_TOPO = [
  'figdown 0.4 topology',
  'node a "A"',
  'node b "B"',
  'edge a -- b',
  'bundle bun "Bundle" a--b',
  '',
].join('\n');

const AUDIT_SEQ = [
  'figdown 0.4 sequence',
  'class dropped "Sent, never delivered"',
  'lifeline c "Client"',
  'lifeline s "Server"',
  'fragment f "retry" type=loop',
  'operand o "first" in=f',
  'message c -> s "SYN" in=o',
  'state c "WAIT"',
  '',
].join('\n');

const AUDIT_TABLE = [
  'figdown 0.4 table',
  'table t "T"',
  '| A | B |',
  '|---|---|',
  '| 1 | 2 |',
  'cell (1,2) fill=#eeeeee',
  '',
].join('\n');

const AUDIT_BITS = [
  'figdown 0.4 bitfield',
  'bitfield hdr "H" word=16 numbering=msb0',
  'field "ID" 16',
  '',
].join('\n');

const AUDIT_TIMING = [
  'figdown 0.4 timing',
  'timing tt "T"',
  'signal clk   pppppppp',
  '',
].join('\n');

const AUDIT_STATE = [
  'figdown 0.2 statechart',
  'state s1 "IDLE"',
  'state s2 "BUSY"',
  'transition s1 -> s2',
  '',
].join('\n');

// [document, the line to decorate, the attribute appended, the site's name]
const AUDIT_SITES = [
  [AUDIT_BLOCK, 'node a "A" in=pool', 'fill=#eeeeee', 'node.fill'],
  [AUDIT_BLOCK, 'node a "A" in=pool', 'stroke=#333333', 'node.stroke'],
  [AUDIT_BLOCK, 'node a "A" in=pool', 'style=dashed', 'node.style'],
  [AUDIT_BLOCK, 'node a "A" in=pool', 'shape=rounded', 'node.shape'],
  [AUDIT_BLOCK, 'group pool "Pool"', 'fill=#eeeeee', 'group.fill'],
  [AUDIT_BLOCK, 'group pool "Pool"', 'stroke=#333333', 'group.stroke'],
  [AUDIT_BLOCK, 'group pool "Pool"', 'style=dashed', 'group.style'],
  [AUDIT_BLOCK, 'group pool "Pool"', 'gap=8', 'group.gap'],
  [AUDIT_BLOCK, 'edge a -- b', 'stroke=#333333', 'edge.stroke'],
  [AUDIT_BLOCK, 'edge a -- b', 'style=dashed', 'edge.style'],
  [AUDIT_BLOCK, 'class hot "Hot path"', 'fill=#eeeeee', 'class.fill'],
  [AUDIT_BLOCK, 'class hot "Hot path"', 'stroke=#333333', 'class.stroke'],
  [AUDIT_BLOCK, 'class hot "Hot path"', 'style=dashed', 'class.style'],
  [AUDIT_BLOCK, 'threshold "Cap" in=pool offset=80%', 'stroke=#333333', 'threshold.stroke'],
  [AUDIT_BLOCK, 'threshold "Cap" in=pool offset=80%', 'style=dashed', 'threshold.style'],
  [AUDIT_BLOCK, 'band "Reserved" 15% in=pool', 'fill=#eeeeee', 'band.fill'],
  [AUDIT_BLOCK, 'band "Reserved" 15% in=pool', 'stroke=#333333', 'band.stroke'],
  [AUDIT_BLOCK, 'band "Reserved" 15% in=pool', 'style=dashed', 'band.style'],
  [AUDIT_TOPO, 'bundle bun "Bundle" a--b', 'stroke=#333333', 'bundle.stroke'],
  [AUDIT_TOPO, 'bundle bun "Bundle" a--b', 'style=dashed', 'bundle.style'],
  [AUDIT_STATE, 'state s1 "IDLE"', 'fill=#eeeeee', 'statechart state.fill'],
  [AUDIT_STATE, 'state s1 "IDLE"', 'stroke=#333333', 'statechart state.stroke'],
  [AUDIT_STATE, 'state s1 "IDLE"', 'style=dashed', 'statechart state.style'],
  [AUDIT_STATE, 'state s1 "IDLE"', 'shape=circle', 'statechart state.shape'],
  [AUDIT_STATE, 'transition s1 -> s2', 'stroke=#333333', 'transition.stroke'],
  [AUDIT_STATE, 'transition s1 -> s2', 'style=dashed', 'transition.style'],
  [AUDIT_SEQ, 'lifeline c "Client"', 'fill=#eeeeee', 'lifeline.fill'],
  [AUDIT_SEQ, 'lifeline c "Client"', 'stroke=#333333', 'lifeline.stroke'],
  [AUDIT_SEQ, 'lifeline c "Client"', 'style=dashed', 'lifeline.style'],
  [AUDIT_SEQ, 'message c -> s "SYN" in=o', 'stroke=#333333', 'message.stroke'],
  [AUDIT_SEQ, 'message c -> s "SYN" in=o', 'style=dashed', 'message.style'],
  [AUDIT_SEQ, 'state c "WAIT"', 'fill=#eeeeee', 'sequence state.fill'],
  [AUDIT_SEQ, 'state c "WAIT"', 'stroke=#333333', 'sequence state.stroke'],
  [AUDIT_SEQ, 'state c "WAIT"', 'style=dashed', 'sequence state.style'],
  [AUDIT_SEQ, 'fragment f "retry" type=loop', 'stroke=#333333', 'fragment.stroke'],
  [AUDIT_SEQ, 'fragment f "retry" type=loop', 'style=dashed', 'fragment.style'],
  [AUDIT_SEQ, 'operand o "first" in=f', 'stroke=#333333', 'operand.stroke'],
  [AUDIT_SEQ, 'operand o "first" in=f', 'style=dashed', 'operand.style'],
  [AUDIT_TABLE, 'table t "T"', 'fill=#eeeeee', 'table.fill'],
  [AUDIT_TABLE, 'table t "T"', 'stroke=#333333', 'table.stroke'],
  [AUDIT_TABLE, 'cell (1,2) fill=#eeeeee', 'stroke=#333333', 'mark.stroke'],
  [AUDIT_BITS, 'bitfield hdr "H" word=16 numbering=msb0', 'fill=#eeeeee', 'bitfield.fill'],
  [AUDIT_BITS, 'bitfield hdr "H" word=16 numbering=msb0', 'stroke=#333333', 'bitfield.stroke'],
  [AUDIT_BITS, 'field "ID" 16', 'fill=#eeeeee', 'field.fill'],
  [AUDIT_BITS, 'field "ID" 16', 'stroke=#333333', 'field.stroke'],
  [AUDIT_TIMING, 'timing tt "T"', 'fill=#eeeeee', 'timing.fill'],
  [AUDIT_TIMING, 'timing tt "T"', 'stroke=#333333', 'timing.stroke'],
  [AUDIT_TIMING, 'signal clk   pppppppp', 'fill=#eeeeee', 'signal.fill'],
  [AUDIT_TIMING, 'signal clk   pppppppp', 'stroke=#333333', 'signal.stroke'],
];

const AUDIT_APPENDS = [
  [AUDIT_BLOCK, 'flow down', 'flow'],
  [AUDIT_BLOCK, 'rank a,b', 'rank'],
  [AUDIT_BLOCK, 'layout\npin a at=(20,20)', 'pin at='],
  [AUDIT_BLOCK, 'layout\npin a width=80', 'pin width='],
  [AUDIT_TABLE, 'width 90,auto', 'table column widths'],
  [AUDIT_TABLE.replace('cell (1,2) fill=#eeeeee\n', ''), 'cell 1 highlight', 'row highlight'],
];

function auditSites() {
  const problems = [];
  const check = (label, A, B) => {
    const r = diffDocuments(A, B, 'A', 'B');
    if (r.fatal) {
      problems.push(label + ': fixture does not parse — ' +
        r.errors.map(([, e]) => e.join('; ')).join(' | '));
      return;
    }
    if (r.semantic.length) {
      problems.push(label + ': reported as MEANING — ' + j(r.semantic));
      return;
    }
    if (!r.presentation.length)
      problems.push(label + ': invisible — no delta reported at all');
  };
  for (const [doc, line, attr, label] of AUDIT_SITES) {
    if (doc.indexOf(line + '\n') < 0) {
      problems.push(label + ': fixture line missing (' + line + ')');
      continue;
    }
    check(label, doc, doc.replace(line + '\n', line + ' ' + attr + '\n'));
  }
  for (const [doc, extra, label] of AUDIT_APPENDS) check(label, doc, doc + extra + '\n');
  return problems;
}

// The three pairs a held-out evaluation used. They are checked against the
// live repository when it is there, and SKIPPED (never failed) when it is not,
// so the suite is honest about what it did and did not run. The synthetic
// twins of all three are in CASES above and always run.
const REAL_PAIRS = [
  { name: 'real pair: 12 redundant shape= removed from statechart states',
    file: 'examples/showcase/tcp-state-machine.fd', a: 'eb0724b', b: 'a80e3f8',
    verdict: 'comment-only', semantic: 0, presentation: 0 },
  { name: 'real pair: 5 redundant shape= removed from statechart states',
    file: 'examples/patterns/state-b.fd', a: '0422c52', b: 'a80e3f8',
    verdict: 'comment-only', semantic: 0, presentation: 0 },
  { name: 'real pair: one state occurrence inserted among identical ones',
    file: 'examples/sequence/dhcp-lease.fd', a: 'cde4549', b: 'a80e3f8',
    verdict: 'semantic', semantic: 2, presentation: 0,
    want: ['state c "INIT" (in=conflict) added'],
    forbidden: ['in "refused" -> "conflict"', 'in (none) -> "refused"'] },
];

function realPair(c) {
  let A, B;
  try {
    A = execFileSync('git', ['show', c.a + ':' + c.file],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    B = execFileSync('git', ['show', c.b + ':' + c.file],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    return { skip: 'revision not readable here (' + c.a + '/' + c.b + ')' };
  }
  const r = diffDocuments(A, B, c.a, c.b);
  const problems = [];
  if (r.fatal) return { problems: ['both sides must parse; they did not'] };
  if (r.verdict !== c.verdict)
    problems.push('verdict ' + r.verdict + ', expected ' + c.verdict);
  if (r.semantic.length !== c.semantic)
    problems.push('meaning facts ' + r.semantic.length + ', expected ' +
      c.semantic + ' — ' + j(r.semantic));
  if (r.presentation.length !== c.presentation)
    problems.push('presentation facts ' + r.presentation.length + ', expected ' +
      c.presentation + ' — ' + j(r.presentation));
  for (const w of (c.want || []))
    if (!r.semantic.some(t => t.includes(w))) problems.push('missing: ' + w);
  for (const f of (c.forbidden || []))
    if (r.semantic.concat(r.presentation).some(t => t.includes(f)))
      problems.push('FABRICATED FACT still present: ' + f);
  return { problems };
}

const EXTRA = [
  { name: 'audit: every presentation attribute site is visible to the walk',
    run: auditSites },
].concat(REAL_PAIRS.map(c => ({
  name: c.name,
  run: () => {
    const out = realPair(c);
    if (out.skip) return { skip: out.skip };
    return out.problems;
  },
})));

function selftest(log) {
  let pass = 0, fail = 0, skip = 0;
  for (const c of CASES) {
    const res = diffDocuments(c.a, c.b, 'A', 'B');
    const problems = [];
    if (c.fatal) {
      if (!res.fatal) problems.push('expected a parse refusal, got verdict ' + res.verdict);
    } else if (res.fatal) {
      problems.push('unexpected parse errors: ' +
        res.errors.map(([l, e]) => l + ' ' + j(e)).join(' '));
    } else {
      if (res.verdict !== c.verdict)
        problems.push('verdict ' + res.verdict + ', expected ' + c.verdict);
      for (const want of (c.semantic || []))
        if (!res.semantic.some(t => t.includes(want)))
          problems.push('missing meaning fact: ' + want +
            '  [got: ' + j(res.semantic) + ']');
      for (const want of (c.presentation || []))
        if (!res.presentation.some(t => t.includes(want)))
          problems.push('missing presentation fact: ' + want +
            '  [got: ' + j(res.presentation) + ']');
      for (const want of (c.notes || []))
        if (!res.warnings.some(t => t.includes(want)))
          problems.push('missing note: ' + want);
      // A fact the tool must NOT invent. This is where a regression from the
      // held-out evaluation is pinned: not "did it say the right thing" but
      // "did it stop saying the wrong one".
      for (const no of (c.forbidden || []))
        if (res.semantic.concat(res.presentation).some(t => t.includes(no)))
          problems.push('FABRICATED FACT: ' + no +
            '  [got: ' + j(res.semantic.concat(res.presentation)) + ']');
      if (c.exactSemantic !== undefined && res.semantic.length !== c.exactSemantic)
        problems.push('meaning facts ' + res.semantic.length + ', expected exactly ' +
          c.exactSemantic + '  [got: ' + j(res.semantic) + ']');
      if (c.exactPresentation !== undefined &&
          res.presentation.length !== c.exactPresentation)
        problems.push('presentation facts ' + res.presentation.length +
          ', expected exactly ' + c.exactPresentation +
          '  [got: ' + j(res.presentation) + ']');
      // The tool must never invent a meaning delta for a case declared
      // presentation-only or comment-only.
      if (c.verdict !== 'semantic' && res.semantic.length)
        problems.push('false meaning facts: ' + j(res.semantic));
      // Nor may a case be silently unexplained.
      const unexplained = res.warnings.filter(w =>
        w.indexOf('unitemized') === 0 || w.indexOf('unclassified') === 0);
      if (unexplained.length) problems.push('register gap: ' + j(unexplained));
    }
    if (problems.length) {
      fail++;
      log('FAIL  ' + c.name);
      problems.forEach(p => log('        ' + p));
    } else {
      pass++;
      log('pass  ' + c.name);
    }
  }

  for (const x of EXTRA) {
    const out = x.run();
    if (out && out.skip) {
      skip++;
      log('skip  ' + x.name);
      log('        ' + out.skip);
      continue;
    }
    const problems = out || [];
    if (problems.length) {
      fail++;
      log('FAIL  ' + x.name);
      problems.forEach(p => log('        ' + p));
    } else {
      pass++;
      log('pass  ' + x.name);
    }
  }

  log('');
  log('SELFTEST: ' + pass + '/' + (pass + fail) + ' passed' +
      (skip ? '  (' + skip + ' skipped — stated above)' : ''));
  return fail === 0;
}

// ---- CLI -----------------------------------------------------------------

const USAGE = [
  'figdown-diff — did the MEANING change, or only the drawing?',
  '',
  'usage:',
  '  node tools/figdown-diff.js A.fd B.fd',
  '  node tools/figdown-diff.js --git <revA> <revB> <path>',
  '  node tools/figdown-diff.js --selftest',
  '',
  'options:',
  '  --json      machine-readable output',
  '  --help      this text',
  '',
  'verdicts and exit codes:',
  '  0  identical           the two sources are byte-identical',
  '  0  comment-only        the sources differ; nothing in the model does',
  '  3  presentation-only   the drawing changed; no fact a reader consumes did',
  '  4  semantic            at least one fact a reader consumes changed',
  '  2  usage error, unreadable input, or a side that does not parse',
  '',
  'The classification of every model field is design/semantic-diff-classification.md.',
].join('\n');

function readFileOrDie(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    process.stderr.write('figdown-diff: cannot read ' + p + ': ' + e.message + '\n');
    process.exit(2);
  }
}

function gitShow(rev, p) {
  try {
    return execFileSync('git', ['show', rev + ':' + p],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    process.stderr.write('figdown-diff: git show ' + rev + ':' + p +
      ' failed: ' + String(e.message).trim() + '\n');
    process.exit(2);
  }
}

function main(argv) {
  const args = argv.slice(2);
  const asJson = args.includes('--json');
  const rest = args.filter(a => a !== '--json');
  if (rest.includes('--help') || rest.includes('-h')) {
    process.stdout.write(USAGE + '\n');
    return 0;
  }
  if (rest.includes('--selftest')) {
    const lines = [];
    const okay = selftest(t => lines.push(t));
    process.stdout.write(lines.join('\n') + '\n');
    return okay ? 0 : 1;
  }
  let textA, textB, labelA, labelB;
  if (rest[0] === '--git') {
    if (rest.length !== 4) {
      process.stderr.write('figdown-diff: --git takes <revA> <revB> <path>\n\n' +
        USAGE + '\n');
      return 2;
    }
    const [, revA, revB, p] = rest;
    labelA = revA + ':' + p;
    labelB = revB + ':' + p;
    textA = gitShow(revA, p);
    textB = gitShow(revB, p);
  } else {
    if (rest.length !== 2) {
      process.stderr.write(USAGE + '\n');
      return 2;
    }
    labelA = rest[0];
    labelB = rest[1];
    textA = readFileOrDie(rest[0]);
    textB = readFileOrDie(rest[1]);
  }
  const res = diffDocuments(textA, textB, labelA, labelB);
  if (res.fatal) {
    process.stdout.write(reportErrors(
      res.errors.map(([l, e], i) => [(i === 0 ? 'A ' : 'B ') + l, e]), asJson) + '\n');
    return 2;
  }
  process.stdout.write((asJson ? reportJson(res, labelA, labelB)
                               : report(res, labelA, labelB)) + '\n');
  return EXIT[res.verdict];
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { diffDocuments, REG, EXIT };
