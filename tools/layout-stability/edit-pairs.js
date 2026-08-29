#!/usr/bin/env node
// edit-pairs.js — THE MECHANICAL EDIT GENERATOR for the locality instrument.
//
// ADV-9 asks for an EDIT-PAIR corpus: for each figure, a set of single,
// mechanically-produced source edits, each paired with the unedited source, so
// the question "did a local edit stay local?" has a denominator instead of an
// anecdote. This file owns the edits; `run.js` owns the measurement.
//
// THE EDITS ARE GENERATED, NEVER HAND-AUTHORED. A hand-written before/after
// pair measures the pair. A generator measures the CLASS, and it keeps measuring
// it when the corpus grows: add a figure to CORPUS and it is edited nine ways
// the same day, by the same rules, with no new prose to keep in sync.
//
// Every generator is a pure function of (src, doc) and returns the SAME edit for
// the same input on every run — first-applicable-in-document-order is the
// selection rule everywhere, never "a random node", never "the biggest one".
// Determinism here is what lets `results.json` be committed and compared.
//
// WHAT AN EDIT MUST CARRY BACK, and why each field exists:
//   name    the edit class (a key in EDIT_CLASSES)
//   src     the edited source
//   map     after-line-index -> base-line-index (or -1 for a line that is new).
//           `data-edge` is the connector's authored id where it has one and its
//           1-BASED SOURCE LINE where it does not (CONNECTOR-IDENTITY-KEY). Six of
//           the nine edits move lines, so an anonymous connector's handle moves
//           with them — without this map the instrument would read every
//           anonymous edge in the figure as "rerouted" the moment a comment was
//           added above it, which is the opposite of what it is measuring.
//   named   the ids the edit NAMES. ADV-9's displacement axis is over the nodes
//           the edit did NOT name, so this set is the instrument's own
//           definition of "local" and it is deliberately SMALL: it holds the
//           edited element and, for a connector edit, its two endpoints. It does
//           NOT hold graph neighbours. `gate:stability`'s spillover measure
//           excuses neighbours; this one does not, because "the node next to the
//           one I touched moved" is exactly the reader's lost spatial memory
//           that LAYOUT-STABILITY is about.
//   detail  a human-readable statement of what was changed, printed on demand.
'use strict';

// ── The corpus subset, chosen by hand and written down ────────────────────────
//
// The corpus is a LIST, not a walk, and that is deliberate — it is the one place
// this instrument differs from `tools/lib/corpus.js`'s discipline, for a reason
// the discipline itself gives: a gate must know its denominator. Nine edits over
// every scene figure in the tree is ~350 renders and buys repetition, not
// coverage; twelve figures chosen to span every scene genre, both layout modes
// (auto and pinned) and the awkward shapes (multi-section, notes, the largest
// scene) buys the coverage. A file named here that has MOVED is a hard error in
// `run.js`, never a silent skip — a shrinking denominator is the defect
// `corpus.js` exists to prevent, and a written list must pay the same price.
const CORPUS = [
  // topology — auto layout, the protocol-scenario shape (packet walk over hosts)
  ['examples/showcase/arp-resolution.fd',      'topology, auto, 2 classes — the protocol-walk shape'],
  ['examples/showcase/tcp-handshake.fd',       'topology, auto — ordered exchange over two peers'],
  // topology — heavily pinned: the LAYOUT-STABILITY priority rule has 19 chances to break here
  ['examples/srl-evpn-irb.fd',                 'topology, 19 pins — the priority rule under load'],
  // topology + table in one document: section 2 sits BELOW section 1, so any
  // height change in section 1 is a global displacement by construction
  ['examples/evpn-fabric.fd',                  'topology, multi-section (topology + table)'],
  // block — the only figures in the corpus carrying scene `note=` (7 of them)
  ['examples/annotated-datapath.fd',           'block, auto, 7 drawn notes — the only note-bearing scene'],
  ['examples/patterns/block-b.fd',             'block, 2 pins — mixed pinned and auto in one scene'],
  ['figures/one-source-two-readers.fd',        'block, fully pinned (5/5) — the fully-determined case'],
  // flowchart — the role vocabulary (terminator/process/decision)
  ['examples/showcase/l2-forwarding-logic.fd', 'flowchart, auto, 3 classes'],
  ['examples/rpf-check.fd',                    'flowchart, auto, larger decision tree'],
  // statechart — minimal and maximal
  ['examples/statechart/turnstile.fd',         'statechart, auto, 4 transitions — the minimal FSM'],
  ['examples/showcase/tcp-state-machine.fd',   'statechart, 12 pins — the largest scene in the corpus'],
  // sequence — the genre `gate:stability` cannot measure at all (its nodes are
  // `lifeline`s, not `doc.nodes`, so that gate skips every sequence figure under
  // `no-node-decls`). It is in scope here.
  ['examples/sequence/fragment-operators.fd',  'sequence, 3 lifelines — unmeasured by gate:stability'],
];

// ── The edit classes, and what the language PROMISES about each ───────────────
//
// A verdict is only worth printing if it grades against a clause somebody wrote
// down. Each entry names the clause it grades against, and the `tier` is the
// consequence of that clause, not of an opinion about what a layout engine ought
// to do:
//
//   tier 'contractual'  the cited clause promises the rest of the figure holds
//                       still. Any unnamed node that moves, or any foreign edge
//                       that reroutes, is a VIOLATION.
//   tier 'advisory'     the edit adds or removes STRUCTURE, and auto layout is
//                       a function of the structure — so a reflow is the engine
//                       doing its job, not a broken promise. Measured and
//                       ratcheted; never graded as a violation on displacement
//                       alone.
//
// THE ONE RULE THAT CROSSES EVERY TIER: a node pinned with `at=` MUST NOT MOVE
// under any edit that does not name it (core §3, the LAYOUT-STABILITY priority rule: "explicit
// (human-specified) > algorithmic auto"). That is a violation in an advisory
// class exactly as much as in a contractual one.
const EDIT_CLASSES = {
  'comment-add': {
    tier: 'contractual', pure: true,
    promise: 'A `#` comment is not a directive. It changes no semantic fact, so ' +
             'the drawing must be identical — not merely stable, IDENTICAL ' +
             '(core §12.7 reading contract; RENDERING-DETERMINISM "a local edit must change only ' +
             'the corresponding local region", and this edit has no region).',
  },
  'class-recolor': {
    tier: 'contractual', pure: true,
    promise: 'Changing the VALUE of a `fill=` on a `class` line is presentation ' +
             'only (core §5). Colour carries no geometry, so no node may move, ' +
             'no edge may reroute and the canvas may not change size.',
  },
  'note-text': {
    tier: 'contractual', pure: false,
    promise: 'A `note=` is DRAWN prose whose box the engine places, never the ' +
             'author (core §2.9, DOMAIN-CONVENTION-DIRECTIVES/DRAWN-ANNOTATION-FORM). Rewriting it at identical length ' +
             'keeps the box the same size, so the change is confined to the ' +
             'carrier: no unnamed node may move.',
  },
  'label-same-length': {
    tier: 'contractual', pure: false,
    promise: 'The engine measures text by CODEPOINT COUNT (`cw()`: every ASCII ' +
             'codepoint is one unit), so a same-length ASCII relabel is the same ' +
             'width to the layout. Nothing at all may move — this class is the ' +
             'instrument\'s own null hypothesis.',
  },
  'label-longer': {
    tier: 'contractual', pure: false, boundedGrowth: true,
    promise: 'UNDECLARED-ATTRIBUTE-BEHAVIOUR size adaptation, core §3, AMENDED by BOUNDED-GROWTH-ACCOMMODATION (2026-08-21, ' +
             'backlog 76) to BOUNDED ACCOMMODATION, ruling (b′): with no ' +
             'explicit extent, an unnamed node may move, but never farther ' +
             'than the named node\'s own box grew (displacement <= growth ' +
             'delta + epsilon). BOUNDED-GROWTH-ACCOMMODATION\'s first attempt, (b) SAME-RANK LOCALITY, ' +
             'is SUPERSEDED — the honest regrade against it still found 6 of ' +
             '12 pairs violating (a label grows a box\'s WIDTH, which IS the ' +
             'main-axis/rank-progression extent whenever flow is horizontal, ' +
             'so growth is structurally cross-rank there) — while the SAME ' +
             'regrade measured that displacement never exceeded the growth ' +
             'delta in any of the 12 pairs, which is (b′)\'s promise stated ' +
             'as a measurement rather than derived from first principles. ' +
             '`run.js` reads `boundedGrowth` on this entry to grade ' +
             'displacement against the growth delta; the rank axes from (b) ' +
             'are still computed and reported (informative) but no longer ' +
             'graded, and reroute is graded separately (backlog item 77), ' +
             'never as part of this class\'s verdict.',
  },
  'edge-remove': {
    tier: 'advisory',
    promise: 'A connector is structure, and auto layout ranks nodes by their ' +
             'connectors — so removing one legitimately re-ranks. Graded only ' +
             'by the pin rule; the displacement is measured and ratcheted.',
  },
  'node-add-free': {
    tier: 'advisory',
    promise: 'A new disconnected node needs canvas that did not exist. Auto ' +
             'layout may make room; pinned nodes may not be moved to make it.',
  },
  'node-add-linked': {
    tier: 'advisory',
    promise: 'As node-add-free, plus one connector — the edit an author makes ' +
             'most often, and the one LAYOUT-STABILITY names as the reason global ' +
             'recomputation is unacceptable ("adding one node can flip the ' +
             'whole figure").',
  },
  'pin-move': {
    tier: 'advisory',
    promise: 'Moving one `pin at=` is the author overriding the algorithm for ' +
             'ONE element. Auto-placed neighbours may adapt around it; every ' +
             'OTHER pinned node must stay exactly where its author put it ' +
             '(core §3 priority rule; PIN-COORDINATE-SCOPE two-level pins).',
  },
};

// The order edits are generated and reported in: contractual first, weakest
// perturbation first, so a table reads from "must be identical" downwards.
const CLASS_ORDER = [
  'comment-add', 'class-recolor', 'note-text', 'label-same-length',
  'label-longer', 'edge-remove', 'node-add-free', 'node-add-linked', 'pin-move',
];

// ── Source surgery, with a line map ───────────────────────────────────────────
// Every edit goes through these three so the after->base line map is built by
// the mechanism rather than remembered by each generator.

function identityMap(n) { const m = new Array(n); for (let i = 0; i < n; i++) m[i] = i; return m; }

function insertLines(src, afterIdx, added) {
  const lines = src.split('\n');
  const map = identityMap(lines.length);
  lines.splice(afterIdx + 1, 0, ...added);
  map.splice(afterIdx + 1, 0, ...added.map(() => -1));
  return { src: lines.join('\n'), map };
}

function deleteLine(src, idx) {
  const lines = src.split('\n');
  const map = identityMap(lines.length);
  lines.splice(idx, 1);
  map.splice(idx, 1);
  return { src: lines.join('\n'), map };
}

function replaceLine(src, idx, text) {
  const lines = src.split('\n');
  const map = identityMap(lines.length);
  lines[idx] = text;
  return { src: lines.join('\n'), map };
}

// ── Reading the document's own spellings ──────────────────────────────────────
//
// NO GENRE KEYWORD IS WRITTEN IN THIS FILE. A flowchart declares
// `process`/`decision`/`terminator`, a statechart declares `state`, a sequence
// declares `lifeline`, and `block`/`topology` declare `node` — so every edit
// that writes a line reads the spelling off the line it is imitating. That is
// the lesson `stability-check.js` records in its own comments after ten figures
// were silently dropped by a hard-coded `node`.

// The document's positionable elements, in declaration order. `doc.nodes` is the
// engine's own answer for four genres; `doc.lifelines` is it for `sequence`.
function elementsOf(src, doc) {
  const lines = src.split('\n');
  const raw = (doc.nodes && doc.nodes.length) ? doc.nodes
            : (doc.lifelines || []);
  const out = [];
  for (const n of raw) {
    const idx = (n.line || 0) - 1;
    const line = lines[idx];
    if (line === undefined) continue;
    // The label as the source LITERALLY WRITES IT. `n.label` is decoded, and a
    // decoded label re-quoted puts a real newline inside a string — the corpus
    // is full of `"Host A\nwants MAC for B's IP"`.
    const at = line.indexOf(n.id);
    const after = at < 0 ? '' : line.slice(at + n.id.length);
    const qm = after.match(/^\s*"((?:[^"\\]|\\.)*)"/);
    out.push({
      id: n.id,
      idx,
      line,
      quoted: !!qm,
      labelRaw: qm ? qm[1] : null,
      declKeyword: (line.match(/^\s*(\S+)/) || [null, 'node'])[1],
    });
  }
  return out;
}

// The document's connectors, in declaration order: `doc.edges` for the scene
// genres, `doc.messages` for `sequence`.
function connectorsOf(src, doc) {
  const lines = src.split('\n');
  const raw = (doc.edges && doc.edges.length) ? doc.edges : (doc.messages || []);
  return raw.map(e => ({
    a: e.a, b: e.b, id: e.id === undefined ? null : e.id,
    idx: (e.line || 0) - 1, line: lines[(e.line || 0) - 1],
  })).filter(e => e.line !== undefined);
}

// Section 1 is the only section the engine's exported `parse` returns a model
// for, so it is the only section this instrument edits. Its end is the line
// before the SECOND `figdown` line, or EOF.
//
// The version that read `for (let i = 1; …)` — assuming section 1 opens on line
// 1 — cut every figure off at its own opener, because a `.fd` starts with a
// comment banner: `arp-resolution` opens at line 18, so `end` was 17 and the
// pins, the connectors and the notes all sat "outside section 1". Four of the
// nine classes reported `n/a` on almost the whole corpus. THE OPENER'S POSITION
// IS DATA, NOT A CONSTANT.
function section1End(src) {
  const lines = src.split('\n');
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (/^figdown\s/.test(lines[i])) starts.push(i);
  return starts.length > 1 ? starts[1] - 1 : lines.length - 1;
}

// Last word-boundary occurrence of `id` in `line`, or -1 — so retargeting an
// edge does not rewrite a label that happens to contain the id (`locked` inside
// `unlocked`). Borrowed from stability-check.js, which found that case.
function lastIdIndex(line, id) {
  const re = new RegExp('(^|[^A-Za-z0-9_-])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        + '(?![A-Za-z0-9_-])', 'g');
  let m, best = -1;
  while ((m = re.exec(line)) !== null) best = m.index + m[1].length;
  return best;
}

// SAME-LENGTH TEXT SUBSTITUTION, escape-safe.
// Each ASCII letter becomes x/X and each digit becomes 7; spaces, punctuation
// and backslash escapes are left alone, and the character AFTER a backslash is
// never touched, so `\n` stays a newline escape instead of becoming `\x`. The
// result has exactly the codepoint count of the input, which is what the
// engine's `cw()` measures — so the layout sees an identical width.
function sameLengthText(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { out += c; if (i + 1 < s.length) { out += s[i + 1]; i++; } continue; }
    if (c >= 'a' && c <= 'z') out += 'x';
    else if (c >= 'A' && c <= 'Z') out += 'X';
    else if (c >= '0' && c <= '9') out += '7';
    else out += c;
  }
  return out;
}

// ── The nine generators ───────────────────────────────────────────────────────
// Each returns { name, src, map, named, detail } or null when the class does not
// apply to this figure. A null is reported as `n/a` and counted; it is never a
// silent absence.

// (1) comment-add — a `#` line, inserted directly after the FIRST element
// declaration. Inside the content zone, in section 1, surrounded by real
// directives: the least excusable place for it to have an effect.
function genCommentAdd(src, doc, ctx) {
  if (!ctx.elements.length) return null;
  const e = ctx.elements[0];
  const r = insertLines(src, e.idx, ['# layout-stability probe: a comment, and nothing else']);
  return { name: 'comment-add', src: r.src, map: r.map, named: new Set(),
           detail: 'inserted one # line after line ' + (e.idx + 1) };
}

// (2) class-recolor — the VALUE of an existing colour key on a `class` line.
// Changing a value, never adding a key: adding `fill=` where there was none can
// legitimately give a legend a swatch it did not have, and that is a different
// experiment (`gate:stability`'s `add-color` runs it).
//
// `fill=` OR `stroke=`, because a class in this corpus is as likely to classify
// by outline as by wash — `arp-resolution`'s two classes carry `stroke=` and
// nothing else, and a fill-only reader called the figure inapplicable while
// staring at two recolourable lines. Both keys are §5 presentation; neither
// carries geometry.
const COLOUR_KEY = /\b(fill|stroke)=(#[0-9a-fA-F]{3,8})/;

function recolour(line) {
  const m = line.match(COLOUR_KEY);
  if (!m) return null;
  const to = m[2].toLowerCase() === '#e2e8f0' ? '#f1f5f9' : '#e2e8f0';
  return { line: line.replace(m[0], m[1] + '=' + to), was: m[2], to, key: m[1] };
}

function genClassRecolor(src, doc, ctx) {
  const lines = src.split('\n');
  for (let i = 0; i <= ctx.end; i++) {
    if (!/^class\s/.test(lines[i])) continue;
    const c = recolour(lines[i]);
    if (!c) continue;
    const r = replaceLine(src, i, c.line);
    return { name: 'class-recolor', src: r.src, map: r.map, named: new Set(),
             detail: 'class line ' + (i + 1) + ': ' + c.key + ' ' + c.was + ' -> ' + c.to };
  }
  // Fallback: an element's own colour value. Same experiment one level down —
  // still a value change, still pure presentation.
  for (const e of ctx.elements) {
    const c = recolour(e.line);
    if (!c) continue;
    const r = replaceLine(src, e.idx, c.line);
    return { name: 'class-recolor', src: r.src, map: r.map, named: new Set([e.id]),
             detail: 'element ' + e.id + ' line ' + (e.idx + 1) + ': ' + c.key + ' ' + c.was + ' -> ' + c.to };
  }
  return null;
}

// (3) note-text — an existing `note="…"` rewritten at identical length.
// An ELEMENT's note is preferred over the figure-level one on the `title` line:
// both are legal subjects, but a note attached to a node has a carrier whose
// region the change is supposed to stay inside, and the figure-level note has
// none — so the element note is the one that can fail. Document order picks
// within each preference.
function genNoteText(src, doc, ctx) {
  const lines = src.split('\n');
  const order = ctx.elements.map(e => e.idx)
    .concat(Array.from({ length: ctx.end + 1 }, (_, i) => i));
  for (const i of order) {
    if (i > ctx.end) continue;
    const m = lines[i].match(/\bnote="((?:[^"\\]|\\.)*)"/);
    if (!m || !m[1].length) continue;
    const r = replaceLine(src, i, lines[i].replace(m[0], 'note="' + sameLengthText(m[1]) + '"'));
    // The carrier is whatever element that line declares, if any.
    const owner = ctx.elements.find(e => e.idx === i);
    return { name: 'note-text', src: r.src, map: r.map,
             named: new Set(owner ? [owner.id] : []),
             detail: 'note on line ' + (i + 1) + ' rewritten, ' + m[1].length + ' chars in and out' };
  }
  return null;
}

// (4) label-same-length — the instrument's null hypothesis.
function genLabelSameLength(src, doc, ctx) {
  const e = ctx.elements.find(x => x.quoted && x.labelRaw && x.labelRaw.length >= 3);
  if (!e) return null;
  const r = replaceLine(src, e.idx,
    e.line.replace('"' + e.labelRaw + '"', '"' + sameLengthText(e.labelRaw) + '"'));
  if (r.src === src) return null;
  return { name: 'label-same-length', src: r.src, map: r.map, named: new Set([e.id]),
           detail: e.id + ': label rewritten at ' + e.labelRaw.length + ' chars' };
}

// (5) label-longer — nine characters more, on the same element (4) chose, so the
// two label classes differ in exactly one thing: the length.
function genLabelLonger(src, doc, ctx) {
  const e = ctx.elements.find(x => x.quoted && x.labelRaw && x.labelRaw.length >= 3);
  if (!e) return null;
  const r = replaceLine(src, e.idx,
    e.line.replace('"' + e.labelRaw + '"', '"' + e.labelRaw + ' (longer)"'));
  if (r.src === src) return null;
  return { name: 'label-longer', src: r.src, map: r.map, named: new Set([e.id]),
           detail: e.id + ': label ' + e.labelRaw.length + ' -> ' + (e.labelRaw.length + 9) + ' chars' };
}

// (6) edge-remove — the LAST connector in section 1. Last, not first, so the
// deletion perturbs the fewest source line numbers; the line map makes the
// choice cosmetic, and a written rule beats an arbitrary one either way.
function genEdgeRemove(src, doc, ctx) {
  const inSec = ctx.connectors.filter(c => c.idx <= ctx.end);
  if (inSec.length < 2) return null;         // never leave a scene with no connector
  const c = inSec[inSec.length - 1];
  const r = deleteLine(src, c.idx);
  return { name: 'edge-remove', src: r.src, map: r.map, named: new Set([c.a, c.b]),
           detail: 'removed connector ' + c.a + ' -> ' + c.b + ' (line ' + (c.idx + 1) + ')' };
}

// (7) node-add-free — one new declaration, no connector, in the genre's own
// spelling, inserted after the last declaration in section 1 (before any layout
// zone, CONTENT-LAYOUT-ZONE-SPLIT, and inside the right section).
function genNodeAddFree(src, doc, ctx) {
  if (!ctx.elements.length) return null;
  const last = ctx.elements[ctx.elements.length - 1];
  const r = insertLines(src, last.idx, [last.declKeyword + ' _ls_free "Locality probe A"']);
  return { name: 'node-add-free', src: r.src, map: r.map, named: new Set(['_ls_free']),
           detail: 'added ' + last.declKeyword + ' _ls_free after line ' + (last.idx + 1) };
}

// (8) node-add-linked — the same declaration plus a connector CLONED from the
// document's first one and retargeted, so the connector keeps the genre's own
// operator spelling (`flowline a -> b`, `transition a -[coin]-> b`, `edge a
// -[eBGP]- b`, `message c -> s`).
function genNodeAddLinked(src, doc, ctx) {
  if (!ctx.elements.length || !ctx.connectors.length) return null;
  const c = ctx.connectors[0];
  if (c.idx > ctx.end) return null;
  const i = lastIdIndex(c.line, c.b);
  if (i < 0) return null;
  const last = ctx.elements[ctx.elements.length - 1];
  const at = Math.max(last.idx, c.idx);
  if (at > ctx.end) return null;
  const r = insertLines(src, at, [
    last.declKeyword + ' _ls_link "Locality probe B"',
    c.line.slice(0, i) + '_ls_link' + c.line.slice(i + c.b.length),
  ]);
  return { name: 'node-add-linked', src: r.src, map: r.map, named: new Set(['_ls_link', c.a]),
           detail: 'added _ls_link joined to ' + c.a + ' (connector cloned from line ' + (c.idx + 1) + ')' };
}

// (9) pin-move — one existing `pin <id> at=(x,y)` shifted 24 px right. NOT
// "pin something that was not pinned": that is a different edit (it converts an
// auto node into a fixed one) and `gate:stability` already runs it. This one
// asks the question ADV-9 asks — does moving ONE pinned node move anything else.
function genPinMove(src, doc, ctx) {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i > ctx.end) break;
    const m = lines[i].match(/^pin\s+(\S+)\b.*?\bat=\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)/);
    if (!m) continue;
    const nx = (parseFloat(m[2]) + 24);
    const r = replaceLine(src, i,
      lines[i].replace(/\bat=\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)/,
                       'at=(' + nx + ',' + m[3] + ')'));
    return { name: 'pin-move', src: r.src, map: r.map, named: new Set([m[1]]),
             detail: 'pin ' + m[1] + ': x ' + m[2] + ' -> ' + nx };
  }
  return null;
}

const GENERATORS = {
  'comment-add':       genCommentAdd,
  'class-recolor':     genClassRecolor,
  'note-text':         genNoteText,
  'label-same-length': genLabelSameLength,
  'label-longer':      genLabelLonger,
  'edge-remove':       genEdgeRemove,
  'node-add-free':     genNodeAddFree,
  'node-add-linked':   genNodeAddLinked,
  'pin-move':          genPinMove,
};

// Returns one entry per CLASS_ORDER member — an edit, or null. A class that does
// not apply to a figure is reported as `n/a`, never dropped: an edit class that
// quietly stops applying is a denominator that quietly shrinks.
function generateEdits(src, doc) {
  const ctx = {
    elements: elementsOf(src, doc),
    connectors: connectorsOf(src, doc),
    end: section1End(src),
  };
  return CLASS_ORDER.map(name => {
    const e = GENERATORS[name](src, doc, ctx);
    return e || { name, src: null, map: null, named: null, detail: null };
  });
}

module.exports = { CORPUS, EDIT_CLASSES, CLASS_ORDER, generateEdits, sameLengthText };
