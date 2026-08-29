#!/usr/bin/env node
// run.js — THE LAYOUT-LOCALITY INSTRUMENT (ADV-9, axiom LAYOUT-STABILITY).
//
// LAYOUT-STABILITY (decisions/registry.md, 2026-07-01) and core §3 RENDERING-DETERMINISM make the same
// promise in two voices:
//
//   LAYOUT-STABILITY   "when the source changes by a small amount, the difference between the
//         new and old figures must not be large … layout stability: small input
//         diff -> small output diff. This is STRONGER than determinism."
//   RENDERING-DETERMINISM   "A local edit must change only the corresponding local region."
//
// Determinism has a gate (`conformance/`, `gate:artifact`). Crowding has a gate
// (`gate:layout`'s F5/F6). LOCALITY had neither — `gate:stability` measures how
// FAR nodes move, which is the magnitude question, and this measures whether the
// nodes that the edit did not name moved AT ALL, which is the contract question.
// The two are siblings, not duplicates; see decisions/registry.md
// §"what gate:stability already covered".
//
// Usage:
//   node tools/layout-stability/run.js                  measure + ratchet (the gate)
//   node tools/layout-stability/run.js --verbose        + what each edit changed
//   node tools/layout-stability/run.js --strict         harness defects also fail
//   node tools/layout-stability/run.js --write-baseline rewrite results.json
//   node tools/layout-stability/run.js --figure <path>  one figure, no ratchet
//
// EXIT CODES
//   0  every pair matches or beats its recorded baseline
//   1  a REGRESSION: a pair that was local is not any more, or a measured count
//      rose above its recorded value, or (--strict) an edit would not render
//   2  the tool could not do its job: engine missing, a corpus file has moved,
//      results.json unreadable. Never confused with a clean run.
'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CORPUS, EDIT_CLASSES, CLASS_ORDER, generateEdits } = require('./edit-pairs.js');

const ROOT     = path.join(__dirname, '..', '..');
const RESULTS  = path.join(__dirname, 'results.json');

// The movement floor, in px. 0.5 is `gate:stability`'s epsilon and is kept
// identical on purpose: two instruments reading the same geometry must not
// disagree about whether something moved. It is well above float noise (the
// engine rounds emitted coordinates to 3 decimals) and well below one line of
// text, so "moved" means a reader could see it.
const EPS = 0.5;

// ── Engine lookup (same order and same reason as build-svg.js / layout-lint.js /
// stability-check.js: one hand-edited engine, found wherever the caller put it) ─
const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, '..', 'figdown.html'),
  path.join(ROOT, 'editor', 'figdown.html'),
].filter(Boolean);

function loadEngine() {
  const p = ENGINE_CANDIDATES.find(x => fs.existsSync(x));
  if (!p) {
    process.stderr.write('figdown.html not found (set $FIGDOWN_HTML)\n');
    process.exit(2);
  }
  const h = fs.readFileSync(p, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) {
    process.stderr.write('Cannot locate engine boundaries in ' + p + '\n');
    process.exit(2);
  }
  // eslint-disable-next-line no-new-func
  const api = new Function(h.slice(start, end) + '\nreturn {parse, render};')();
  return { api, path: p, sha: crypto.createHash('sha256').update(h).digest('hex').slice(0, 12) };
}

// ── Reading geometry out of an SVG ────────────────────────────────────────────

// Node positions: `data-x`/`data-y` are the layout-space coordinates the
// renderer writes for every positioned element, before the canvas padding
// translate — the same handle `gate:stability` reads.
function nodesOf(svg) {
  const out = new Map();
  const re = /<g data-node="([^"]*)" data-x="([^"]*)" data-y="([^"]*)"/g;
  let m;
  while ((m = re.exec(svg)) !== null) out.set(m[1], { x: parseFloat(m[2]), y: parseFloat(m[3]) });
  return out;
}

// Connector geometry, keyed by `data-edge`. CONNECTOR-IDENTITY-KEY: the value is the AUTHORED id
// where the connector has one and the 1-BASED SOURCE LINE where it does not, and
// the two can never be confused because no id is a decimal number. A key that is
// a line number is translated back through the edit's line map by the caller.
//
// A connector may be drawn as several elements (a bus trunk and its stubs share
// one key), so the value is the CONCATENATION of every element's coordinates in
// document order — one string per key, compared whole.
function edgesOf(svg) {
  const out = new Map();
  const re = /<(path|line) data-edge="([^"]*)"([^>]*)>/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    const attrs = m[3];
    let nums;
    const d = attrs.match(/\bd="([^"]*)"/);
    if (d) {
      // Every SVG path command this engine emits (M, L, Q) takes coordinate
      // PAIRS, so a plain in-order number scan alternates x, y, x, y…
      nums = (d[1].match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    } else {
      const g = k => { const q = attrs.match(new RegExp('\\b' + k + '="([^"]*)"')); return q ? parseFloat(q[1]) : 0; };
      nums = [g('x1'), g('y1'), g('x2'), g('y2')];
    }
    if (!out.has(m[2])) out.set(m[2], []);
    out.get(m[2]).push(nums);
  }
  return out;
}

// DID THE EDIT DO ANYTHING AT ALL? A `local` verdict is only evidence of
// stability if the edit had a visible effect to be stable AROUND. A relabel that
// does not change its own box has nothing to displace, and grading it `local`
// would be scoring a null result as a pass — so the named element's own drawn
// width is measured beside everything else, and a row with no self-effect is
// marked rather than counted as a quiet success. The width is the first
// `width="…"` inside the element's own `<g data-node>` (its shape), read up to
// the next node group.
function boxWidths(svg) {
  const out = new Map();
  const re = /<g data-node="([^"]*)"/g;
  const starts = [];
  let m;
  while ((m = re.exec(svg)) !== null) starts.push({ id: m[1], at: m.index });
  for (let i = 0; i < starts.length; i++) {
    const seg = svg.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : svg.length);
    // A `box`/`rounded` node is a <rect width=…>; an `ellipse`/`circle` is
    // <ellipse rx=…> and has no width attribute at all, so a width-only reader
    // reported `null` for every round node — `srl-evpn-irb`'s `cloud` among
    // them — and a null self-effect is indistinguishable from an unmeasured one.
    const w = seg.match(/\bwidth="(\d+(?:\.\d+)?)"/);
    const r = seg.match(/\brx="(\d+(?:\.\d+)?)"/);
    if (w) out.set(starts[i].id, parseFloat(w[1]));
    else if (r) out.set(starts[i].id, 2 * parseFloat(r[1]));
  }
  return out;
}

function canvasOf(svg) {
  const m = svg.match(/\bwidth="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/);
  return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 0, h: 0 };
}

// THE SCENE ORIGIN IS REPORTED, AND EVERY MEASUREMENT HAS TO SUBTRACT IT.
// Several passes shift the WHOLE scene by one uniform offset so ink that belongs
// off the low side of the canvas has somewhere to be drawn (a left-pointing
// boundary label, a ring return row, a long-edge corridor). None of them reflows
// anything — relative geometry, pins included, is preserved exactly — but in raw
// coordinates a uniform shift reads as "every node moved", which is the opposite
// of what this instrument is asking. `stability-check.js` found this the hard
// way on `patterns/block-b`; nodes AND connector paths live in the same
// pre-translate space, so the same delta clears both.
//
// TWO WAYS AN EDITED SOURCE CAN FAIL TO PRODUCE A FIGURE, AND THEY ARE NOT THE
// SAME FINDING:
//   kind 'parse'    the engine REFUSED THE SOURCE. That is a HARNESS defect —
//                   the generator wrote something this genre does not accept —
//                   and it is a measurement that did not happen.
//   kind 'refused'  the source is a legal document and the LAYOUT PASS declined
//                   to draw it ("the figure is not drawn rather than drawn
//                   wrongly"). That is a measurement that DID happen and whose
//                   answer is the largest possible non-locality: the blast
//                   radius of the edit is the entire figure. It is recorded as
//                   its own verdict, never as a harness excuse.
function renderOne(engine, src) {
  const { doc, errs } = engine.api.parse(src);
  if (errs && errs.length) return { ok: false, kind: 'parse', err: errs[0] };
  let r;
  try { r = engine.api.render(doc); }
  catch (e) { return { ok: false, kind: 'refused', err: 'render threw: ' + e.message }; }
  if (r.errs && r.errs.length) return { ok: false, kind: 'refused', err: r.errs[0] };
  return {
    ok: true, doc, svg: r.svg,
    org: [(r.sceneMeta && r.sceneMeta.left) || 0, (r.sceneMeta && r.sceneMeta.top) || 0],
  };
}

// ── Rank axis (BOUNDED-GROWTH-ACCOMMODATION, informative since (b′)) ────────────────────────────────
//
// BOUNDED-GROWTH-ACCOMMODATION's FIRST attempt at amending UNDECLARED-ATTRIBUTE-BEHAVIOUR's growth promise (ruling (b), same
// landing day) was SAME-RANK LOCALITY: growth may be absorbed within the
// affected rank; only cross-rank displacement is a violation. The honest
// regrade against that criterion still found 6 of 12 pairs violating —
// BOUNDED-GROWTH-ACCOMMODATION's own reopen condition, met the day it landed — because a label
// grows a box's WIDTH, which IS the main-axis (rank-progression) extent
// whenever `doc.flow` is horizontal, so growth in a horizontal-flow figure
// is structurally a cross-rank push no wording change can fix. The SAME
// regrade also measured something (b) had not been asked to look for:
// displacement never exceeded the growth delta itself, in any of the 12
// pairs. **BOUNDED-GROWTH-ACCOMMODATION was revised the same day to ruling (b′), BOUNDED
// ACCOMMODATION**, graded in `gradePair` below against `selfDw` (the named
// node's own growth), not against rank. The rank axis computed here is KEPT
// — same-rank/cross-rank is still a real structural fact and still worth
// reporting (`rec.sameRankMoved`/`crossRankMoved` in results.json) — but it
// is no longer what the verdict grades. See decisions/registry.md
// BOUNDED-GROWTH-ACCOMMODATION for the full arc and decisions/registry.md for
// the regrade this comment summarises.
//
// The engine's own rank is an internal ranking-DP value assigned during
// layout (`editor/figdown.html`, `nodes.forEach(n=>n.rank=rankOf(find(n.id)))`)
// and it is never exported by `parse()` or `render()` — this instrument calls
// the engine only through those two functions (loadEngine, above), so it
// cannot read `n.rank` directly without reaching into the engine's private
// layout closure, which `--strict`'s own "measure the output, not the
// internals" discipline (§2 of the baseline doc) rules out.
//
// So rank is APPROXIMATED by the axis the flow direction defines, which is
// exactly the axis the engine's own geometry pass uses to express rank:
// `horiz=(doc.flow==='right'||doc.flow==='left')` picks the MAIN axis (rank
// increases along x when horiz, along y when not), and the engine lays out
// every node in one rank at a shared main-axis coordinate — only the
// CROSS-axis position (`n.cross`) varies within a rank (`cs=n=>horiz?n.h:
// n.w`). Reading the main-axis coordinate straight off the SAME base render
// that assigned the rank is therefore not a guess: two nodes the engine put
// in the same rank read the identical coordinate (within EPS, the same
// epsilon the displacement axis already uses), and two nodes in different
// ranks do not, in every one of the twelve corpus figures' auto-layout scene
// genres.
//
// `sequence` has no rank at all — `flow`/`rank` are refused outright (SUBJECT-VOCABULARY-SCOPE,
// SEQUENCE-PARTICIPANT-GROUPING) and its lifelines are placed left-to-right in DECLARATION ORDER, not
// by the ranking DP. Its `doc.flow` is therefore never touched away from the
// engine's own default ('right'), which happens to land it on the same 'x'
// axis this approximation already uses for every horizontal-flow figure —
// the axis along which lifeline COLUMNS vary, which is the closest analogue
// a column genre has to "which rank". This is named here rather than left
// implicit: it is an analogy for `sequence`, not a measurement of a rank the
// genre does not compute.
function rankAxisOf(doc) {
  return (doc.flow === 'right' || doc.flow === 'left') ? 'x' : 'y';
}

// ── The three ADV-9 axes ──────────────────────────────────────────────────────

// Axis 1 — displacement of every node the edit did NOT name. `rankInfo`, when
// given (BOUNDED-GROWTH-ACCOMMODATION, `label-longer` only), additionally splits the moved set into
// SAME-RANK (the rank the named/grown element itself sits in, approximated by
// `rankAxisOf` above) and CROSS-RANK. Every other class ignores it and grades
// the whole moved set as before.
function displacement(base, after, dOx, dOy, named, rankInfo) {
  let movedCount = 0, maxDisp = 0, maxId = null;
  const moved = [];
  for (const [id, b] of base) {
    const a = after.get(id);
    if (!a) continue;                       // gone: a structural change, not a move
    if (named.has(id)) continue;
    const dx = (a.x - dOx) - b.x, dy = (a.y - dOy) - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist > EPS) { movedCount++; moved.push({ id, dist }); }
    if (dist > maxDisp) { maxDisp = dist; maxId = id; }
  }
  moved.sort((p, q) => q.dist - p.dist);
  const out = { movedCount, maxDisp, maxId, moved };
  if (rankInfo) {
    const { rankOf, targetRank } = rankInfo;
    const same = [], cross = [];
    // `moved` is already sorted by distance descending, so the split
    // preserves that order and each subset's [0] is its own max.
    for (const p of moved) {
      const r = rankOf(p.id);
      const isSameRank = targetRank != null && r != null && Math.abs(r - targetRank) <= EPS;
      (isSameRank ? same : cross).push(p);
    }
    out.sameRank  = { count: same.length,  maxDisp: same.length  ? same[0].dist  : 0, maxId: same.length  ? same[0].id  : null };
    out.crossRank = { count: cross.length, maxDisp: cross.length ? cross[0].dist : 0, maxId: cross.length ? cross[0].id : null };
  }
  return out;
}

// Axis 2 — reroute scope: how many connectors whose two endpoints are BOTH
// unnamed by the edit had their drawn path change. The denominator is those same
// foreign connectors, so "3/14" reads as "three of the fourteen edges this edit
// has no business touching were redrawn".
function reroute(baseEdges, afterEdges, keyMap, foreignKeys) {
  let changed = 0;
  const which = [];
  for (const key of foreignKeys) {
    const b = baseEdges.get(key);
    if (!b) continue;
    const a = afterEdges.get(keyMap(key));
    if (!a) { changed++; which.push(key + ' (vanished)'); continue; }
    if (!sameGeometry(b, a)) { changed++; which.push(key); }
  }
  return { changed, total: foreignKeys.length, which };
}

function sameGeometry(bParts, aParts) {
  if (bParts.length !== aParts.length) return false;
  for (let i = 0; i < bParts.length; i++) {
    const b = bParts[i], a = aParts[i];
    if (b.length !== a.length) return false;
    for (let k = 0; k < b.length; k++) if (Math.abs(b[k] - a[k]) > EPS) return false;
  }
  return true;
}

// ── The verdict ───────────────────────────────────────────────────────────────
//
// Graded against the clause named in EDIT_CLASSES[cls].promise, never against an
// invented ideal. Two independent grounds:
//
//  * THE PIN RULE, which crosses every tier. A node the author placed with `at=`
//    that the edit did not name must be exactly where the author put it (core §3
//    priority rule, LAYOUT-STABILITY). A violation here is a violation in an advisory class.
//  * THE CONTRACTUAL TIER. For the classes whose cited clause promises the rest
//    of the figure holds still, any unnamed node that moves or any foreign
//    connector that reroutes is a violation; for the two PURE classes (a comment,
//    a colour value) the canvas size must not change either, because those edits
//    have no region at all.
//  * `label-longer` IS DIFFERENT since BOUNDED-GROWTH-ACCOMMODATION (b′), BOUNDED ACCOMMODATION: UNDECLARED-ATTRIBUTE-BEHAVIOUR no
//    longer promises the rest of the figure holds still at all — it promises a
//    moved node never travels farther than the grown box itself grew. Its
//    `boundedGrowth` flag (edit-pairs.js) therefore grades displacement against
//    `m.over` (nodes past the growth-delta bound), NOT against `m.movedCount`,
//    and does NOT grade reroute — a reroute with zero node movement is not a
//    displacement at all under (b′), and it is backlog item 77's defect, not
//    UNDECLARED-ATTRIBUTE-BEHAVIOUR's. `m.rerouted` is still recorded on the pair (`rec.reroute`) so
//    item 77 stays measured; it just does not flip this pair's verdict.
function gradePair(cls, m) {
  const reasons = [];
  if (m.pinnedMoved.length)
    reasons.push('pinned node(s) moved: ' + m.pinnedMoved.map(p => p.id + ' ' + p.dist.toFixed(1) + 'px').join(', '));
  if (EDIT_CLASSES[cls].tier === 'contractual') {
    if (EDIT_CLASSES[cls].boundedGrowth) {
      if (m.over && m.over.length) {
        const worst = m.over.slice().sort((a, b) => b.dist - a.dist)[0];
        reasons.push(m.over.length + ' unnamed node(s) moved past the growth bound ('
                   + (m.bound == null ? '?' : m.bound.toFixed(1)) + 'px), worst '
                   + worst.dist.toFixed(1) + 'px (' + worst.id + ') — BOUNDED-GROWTH-ACCOMMODATION (b′) tolerates '
                   + 'displacement up to the growth delta, not beyond it');
      }
      // Reroute is deliberately NOT graded here — see the block comment above.
    } else {
      if (m.movedCount > 0)
        reasons.push(m.movedCount + ' unnamed node(s) moved, max ' + m.maxDisp.toFixed(1) + 'px (' + m.maxId + ')');
      if (m.rerouted > 0)
        reasons.push(m.rerouted + '/' + m.rerouteTotal + ' foreign connector(s) rerouted');
    }
    if (EDIT_CLASSES[cls].pure && (m.dw !== 0 || m.dh !== 0))
      reasons.push('canvas changed by ' + m.dw + '×' + m.dh + ' px');
  }
  return { verdict: reasons.length ? 'VIOLATION' : 'local', reasons };
}

// ── Formatting ────────────────────────────────────────────────────────────────
const pad  = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); };
const lpad = (s, n) => { s = String(s); return s.length >= n ? s.slice(-n)   : ' '.repeat(n - s.length) + s; };

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  let write = false, strict = false, verbose = false, only = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write-baseline') { write = true; continue; }
    if (a === '--strict')  { strict = true; continue; }
    if (a === '--verbose') { verbose = true; continue; }
    if (a === '--figure')  { only = argv[++i]; continue; }
    process.stderr.write('unknown flag: ' + a + '\n');
    process.exit(2);
  }

  const engine = loadEngine();

  // THE CORPUS IS A WRITTEN LIST, SO A MISSING MEMBER IS AN ERROR. A gate whose
  // denominator can shrink without saying so is the defect tools/lib/corpus.js
  // was written to end; a hand-written list pays the same price a walk does.
  const wanted = only ? [[only, 'named on the command line']] : CORPUS;
  const missing = wanted.filter(([f]) => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    process.stderr.write('corpus file(s) not found — the list in edit-pairs.js is stale:\n');
    for (const [f] of missing) process.stderr.write('  ' + f + '\n');
    process.exit(2);
  }

  let baseline = null;
  if (!write && !only) {
    try { baseline = JSON.parse(fs.readFileSync(RESULTS, 'utf8')); }
    catch (e) {
      process.stderr.write('results.json unreadable (' + e.message + ') — run with --write-baseline\n');
      process.exit(2);
    }
  }

  console.log('LAYOUT-LOCALITY INSTRUMENT — ADV-9, axiom LAYOUT-STABILITY / core §3 RENDERING-DETERMINISM');
  console.log('engine ' + path.relative(ROOT, engine.path) + ' sha256:' + engine.sha
            + '   epsilon ' + EPS + ' px   ' + wanted.length + ' figure(s) × '
            + CLASS_ORDER.length + ' edit class(es)');
  console.log('');

  const C = { file: 42, edit: 18, moved: 6, disp: 9, rr: 9, dwh: 11, v: 9 };
  const SEP = '-'.repeat(C.file + C.edit + C.moved + C.disp + C.rr + C.dwh + C.v + 12);
  console.log(SEP);
  console.log([pad('figure', C.file), pad('edit', C.edit), lpad('moved', C.moved),
               lpad('maxDisp', C.disp), lpad('reroute', C.rr), lpad('canvasΔ', C.dwh),
               pad('verdict', C.v)].join('  '));
  console.log(SEP);

  const pairs = {};          // key -> record
  const violations = [];
  const refusals   = [];     // legal edited source the layout pass declined to draw
  const failures   = [];     // source the PARSER refused — a harness defect
  const notApplicable = [];

  for (const [rel, why] of wanted) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const base = renderOne(engine, src);
    if (!base.ok) {
      failures.push({ file: rel, edit: '(baseline)', err: base.err });
      console.log(pad(rel, C.file) + '  ' + pad('(baseline)', C.edit) + '  (would not render: ' + base.err + ')');
      continue;
    }
    const baseNodes  = nodesOf(base.svg);
    const baseWidths = boxWidths(base.svg);
    const baseEdges  = edgesOf(base.svg);
    const baseCanvas = canvasOf(base.svg);
    const baseConn   = (base.doc.edges && base.doc.edges.length) ? base.doc.edges : [];
    // Which nodes did the author place? Read off the source, because `pin` is
    // genre-independent (core §1 LAYOUT-ZONE-NAMESPACE) — and only a pin carrying `at=` is a
    // POSITION. A `pin` with width=/height= alone declares an extent (ELEMENT-GEOMETRY-DIRECTIVE), and
    // asserting that node must not move would grade against a promise the
    // language never made.
    const pinned = new Set();
    for (const ln of src.split('\n')) {
      const pm = ln.match(/^pin\s+(\S+)\b/);
      if (pm && /\bat=/.test(ln)) pinned.add(pm[1]);
    }
    // BOUNDED-GROWTH-ACCOMMODATION's rank approximation (see rankAxisOf above), read once per figure
    // off the BASE render — rank is a structural fact of the unedited layout,
    // not something the edit changes.
    const rankAxis = rankAxisOf(base.doc);
    const rankOf = id => { const p = baseNodes.get(id); return p ? p[rankAxis] : null; };

    for (const edit of generateEdits(src, base.doc)) {
      const key = rel + '|' + edit.name;
      if (!edit.src) {
        notApplicable.push({ file: rel, edit: edit.name });
        console.log(pad(rel, C.file) + '  ' + pad(edit.name, C.edit) + '  '
                  + lpad('-', C.moved) + '  ' + lpad('-', C.disp) + '  '
                  + lpad('-', C.rr) + '  ' + lpad('-', C.dwh) + '  ' + pad('n/a', C.v));
        continue;
      }
      const after = renderOne(engine, edit.src);
      if (!after.ok && after.kind === 'parse') {
        // A SOURCE THE PARSER REFUSES IS A MEASUREMENT THAT DID NOT HAPPEN, and
        // it is a HARNESS defect until proven otherwise: the generator wrote
        // source this genre does not accept. It is never a quiet dash.
        failures.push({ file: rel, edit: edit.name, err: after.err });
        console.log(pad(rel, C.file) + '  ' + pad(edit.name, C.edit) + '  (source refused: ' + after.err + ')');
        continue;
      }
      if (!after.ok) {
        // The layout pass declined to draw a legal document. Recorded as a
        // measured outcome — the edit's blast radius is the whole figure.
        const rec = {
          figure: rel, edit: edit.name, tier: EDIT_CLASSES[edit.name].tier,
          verdict: 'refused', moved: null, reroute: null,
          reasons: ['the layout pass declined to draw the edited figure: ' + after.err],
          detail: edit.detail,
        };
        pairs[key] = rec;
        refusals.push(rec);
        console.log([pad(rel, C.file), pad(edit.name, C.edit), lpad('-', C.moved),
                     lpad('-', C.disp), lpad('-', C.rr), lpad('-', C.dwh),
                     pad('refused', C.v)].join('  ') + (verbose ? '  ' + edit.detail : ''));
        continue;
      }
      const dOx = after.org[0] - base.org[0], dOy = after.org[1] - base.org[1];
      const afterNodes  = nodesOf(after.svg);
      const afterEdges  = edgesOf(after.svg);
      const afterCanvas = canvasOf(after.svg);

      // Self-effect: how much the named element's own box grew. Computed
      // BEFORE displacement/grading because `label-longer`'s BOUNDED-GROWTH-ACCOMMODATION (b′)
      // criterion — BOUNDED ACCOMMODATION — grades displacement AGAINST it:
      // no unnamed node may move farther than the named node's own box grew.
      const afterWidths = boxWidths(after.svg);
      let selfDw = null;
      for (const id of edit.named) {
        if (baseWidths.has(id) && afterWidths.has(id)) {
          selfDw = +(afterWidths.get(id) - baseWidths.get(id)).toFixed(1);
          break;
        }
      }

      // `label-longer`'s two BOUNDED-GROWTH-ACCOMMODATION axes are BOTH computed here, but they play
      // different roles now (BOUNDED-GROWTH-ACCOMMODATION, superseding the (b) same-rank attempt):
      //  - rankInfo -> sameRank/crossRank: REPORTED ONLY (informative — the
      //    structural finding that horizontal flow makes width growth
      //    main-axis stays true and stays interesting) — no longer graded.
      //  - boundedInfo -> the growth delta (`selfDw`) itself is what the
      //    verdict grades against: displacement ≤ growth delta (+ε).
      const rankInfo = EDIT_CLASSES[edit.name].boundedGrowth
        ? { rankOf, targetRank: rankOf(edit.named.values().next().value) }
        : null;
      const d = displacement(baseNodes, afterNodes, dOx, dOy, edit.named, rankInfo);

      // A connector is FOREIGN to the edit when neither endpoint is named by it.
      const foreignKeys = baseConn
        .filter(e => !edit.named.has(e.a) && !edit.named.has(e.b))
        .map(e => (e.id !== undefined && e.id !== null) ? String(e.id) : String(e.line))
        .filter(k => baseEdges.has(k));
      // A `data-edge` that is a line number moves when the edit moves lines;
      // translate base line -> after line through the edit's own map.
      const afterLineOfBase = new Map();
      edit.map.forEach((b, a) => { if (b >= 0) afterLineOfBase.set(b + 1, a + 1); });
      const keyMap = k => (/^\d+$/.test(k) ? String(afterLineOfBase.get(+k) || k) : k);
      const rr = reroute(baseEdges, afterEdges, keyMap, foreignKeys);

      // Origin-corrected displacement of every PINNED node the edit did not name.
      const pinnedMoved = d.moved.filter(p => pinned.has(p.id));

      // Bounded-growth check (BOUNDED-GROWTH-ACCOMMODATION (b′)): every unnamed moved node's distance
      // must be <= the named node's own growth delta, within EPS. `over` is
      // the moved nodes that broke it — empty on all 12 corpus pairs measured
      // at ruling time, which is the entire point of (b′) over (b).
      const bound = (selfDw == null) ? null : Math.abs(selfDw) + EPS;
      const over = (EDIT_CLASSES[edit.name].boundedGrowth && bound != null)
        ? d.moved.filter(p => p.dist > bound)
        : [];

      const m = {
        movedCount: d.movedCount, maxDisp: d.maxDisp, maxId: d.maxId,
        sameRank: d.sameRank || null, crossRank: d.crossRank || null,
        over, bound,
        rerouted: rr.changed, rerouteTotal: rr.total,
        dw: +(afterCanvas.w - baseCanvas.w).toFixed(1),
        dh: +(afterCanvas.h - baseCanvas.h).toFixed(1),
        pinnedMoved,
      };
      const g = gradePair(edit.name, m);

      // The denominator is the nodes that EXISTED and were NOT named — an id the
      // edit invents (`_ls_free`) is in `named` but not in the baseline, so
      // subtracting the size of `named` printed rows like `5/4`: five of four.
      let unnamedTotal = 0;
      for (const id of baseNodes.keys()) if (!edit.named.has(id)) unnamedTotal++;

      const rec = {
        figure: rel, edit: edit.name, tier: EDIT_CLASSES[edit.name].tier,
        unnamedTotal,
        moved: m.movedCount, maxDisp: +m.maxDisp.toFixed(1), maxMovedId: m.maxId,
        // BOUNDED-GROWTH-ACCOMMODATION: present for `boundedGrowth` classes (label-longer) only.
        // `moved`/`maxDisp` above stay the RAW total (all axes), unchanged
        // in meaning from every other class. `sameRankMoved`/`crossRankMoved`
        // are the (b)-era same-rank split — kept as REPORTED metrics (the
        // structural finding still holds) but no longer graded. `overBound`
        // is what (b′) actually grades: unnamed nodes displaced past the
        // named node's own growth delta.
        sameRankMoved: m.sameRank ? m.sameRank.count : null,
        crossRankMoved: m.crossRank ? m.crossRank.count : null,
        maxCrossRankDisp: m.crossRank ? +m.crossRank.maxDisp.toFixed(1) : null,
        maxCrossRankId: m.crossRank ? m.crossRank.maxId : null,
        namedBoxDw: selfDw,
        overBound: EDIT_CLASSES[edit.name].boundedGrowth ? m.over.length : null,
        maxOverBoundId: m.over.length ? m.over.sort((a, b) => b.dist - a.dist)[0].id : null,
        reroute: m.rerouted, rerouteTotal: m.rerouteTotal,
        canvasDw: m.dw, canvasDh: m.dh,
        pinnedMoved: pinnedMoved.map(p => p.id + ':' + p.dist.toFixed(1)),
        verdict: g.verdict, reasons: g.reasons, detail: edit.detail,
      };
      pairs[key] = rec;
      if (g.verdict === 'VIOLATION') violations.push(rec);

      console.log([
        pad(rel, C.file), pad(edit.name, C.edit),
        lpad(m.movedCount + '/' + unnamedTotal, C.moved),
        lpad(m.maxDisp.toFixed(1), C.disp),
        lpad(m.rerouteTotal ? (m.rerouted + '/' + m.rerouteTotal) : '-', C.rr),
        lpad(m.dw + '×' + m.dh, C.dwh),
        pad(g.verdict === 'VIOLATION' ? 'VIOLATION' : 'local', C.v),
      ].join('  ')
        + (edit.name === 'label-longer' && selfDw === 0 ? '  (no self-effect)' : '')
        + (edit.name === 'label-longer' && m.rerouted > 0 ? '  (' + m.rerouted + '/' + m.rerouteTotal + ' reroute — item 77, not graded here)' : '')
        + (verbose ? '  ' + edit.detail : ''));
    }
  }
  console.log(SEP);

  // ── Per-class roll-up. Printed on every run, zero or not. ───────────────────
  console.log('');
  console.log('BY EDIT CLASS  (tier: contractual = the cited clause promises stillness)');
  console.log(pad('class', 20) + pad('tier', 14) + lpad('measured', 9) + lpad('local', 7)
            + lpad('viol', 6) + lpad('refused', 9) + lpad('n/a', 6));
  for (const cls of CLASS_ORDER) {
    const rows = Object.values(pairs).filter(r => r.edit === cls);
    const na = notApplicable.filter(r => r.edit === cls).length;
    console.log(pad(cls, 20) + pad(EDIT_CLASSES[cls].tier, 14)
              + lpad(rows.length, 9)
              + lpad(rows.filter(r => r.verdict === 'local').length, 7)
              + lpad(rows.filter(r => r.verdict === 'VIOLATION').length, 6)
              + lpad(rows.filter(r => r.verdict === 'refused').length, 9)
              + lpad(na, 6));
  }

  // ── Violations, stated in full, always ─────────────────────────────────────
  console.log('');
  if (violations.length) {
    console.log('LOCALITY VIOLATIONS — ' + violations.length + ' of ' + Object.keys(pairs).length + ' measured pair(s):');
    for (const v of violations) {
      console.log('  ' + v.figure + '  [' + v.edit + ']');
      for (const r of v.reasons) console.log('      ' + r);
    }
  } else {
    console.log('No locality violations across ' + Object.keys(pairs).length + ' measured pair(s).');
  }

  // ── Refusals, stated in full, always ───────────────────────────────────────
  console.log('');
  if (refusals.length) {
    console.log('REFUSED — ' + refusals.length + ' edited figure(s) the layout pass declined to draw:');
    for (const r of refusals) console.log('  ' + r.figure + '  [' + r.edit + ']  ' + r.reasons[0]);
    console.log('  A refusal is not a harness defect: the source parses. It is the');
    console.log('  largest non-locality there is — one added line and the reader has');
    console.log('  no figure at all.');
  } else {
    console.log('No edited figure was refused by the layout pass.');
  }

  // ── Harness health, stated in full, always ─────────────────────────────────
  console.log('');
  if (failures.length) {
    console.log('SOURCE THE PARSER REFUSED — ' + failures.length + ' measurement(s) did not happen:');
    for (const f of failures) console.log('  ' + f.file + '  [' + f.edit + ']  ' + f.err);
    console.log('  Each is a HARNESS defect until proven otherwise: the generator');
    console.log('  wrote source this genre does not accept. The table above is');
    console.log('  computed only over edits that parsed.');
  } else {
    console.log('Every applicable edit produced a parseable document ('
              + notApplicable.length + ' class×figure combination(s) not applicable).');
  }

  // ── The ratchet ────────────────────────────────────────────────────────────
  //
  // Same contract as gate:layout's F5/F6 baselines, for the same reason. The
  // residue below is REAL — no epsilon was widened and no class was downgraded
  // to shrink it — and it is TOLERATED because fixing it is engine work, not
  // instrument work. What fails is a REGRESSION: a pair that was local and is
  // not any more, or a count that rose. A pair the baseline does not know that
  // is already a violation also fails, so a figure cannot be added with a fresh
  // violation nobody looked at.
  let exit = 0;
  if (write) {
    const out = {
      instrument: 'layout-stability (ADV-9) — locality of a local edit',
      axiom: 'LAYOUT-STABILITY (design/requirements-notes.md) / core §3 RENDERING-DETERMINISM "a local edit must change only the corresponding local region"',
      measured: new Date().toISOString().slice(0, 10),
      engine: path.relative(ROOT, engine.path),
      engine_sha256_12: engine.sha,
      epsilon_px: EPS,
      pairs,
    };
    fs.writeFileSync(RESULTS, JSON.stringify(out, null, 2) + '\n');
    console.log('');
    console.log('results.json rewritten: ' + Object.keys(pairs).length + ' pair(s).');
  } else if (baseline) {
    const regressions = [], improvements = [], fresh = [];
    for (const [key, rec] of Object.entries(pairs)) {
      const b = baseline.pairs[key];
      if (!b) {
        if (rec.verdict === 'VIOLATION') fresh.push(key + ' — ' + rec.reasons.join('; '));
        continue;
      }
      // A count is `null` on a refused pair, and `null > 0` is false while
      // `3 > null` is true — so the counts are only ever compared when BOTH
      // sides are numbers, and the verdict change carries the rest.
      const num = (x, y) => typeof x === 'number' && typeof y === 'number';
      if (b.verdict === 'local' && rec.verdict !== 'local')
        regressions.push(key + ' — was local, now ' + rec.verdict + ': ' + rec.reasons.join('; '));
      else if (b.verdict === 'VIOLATION' && rec.verdict === 'refused')
        regressions.push(key + ' — was a violation, now refused: ' + rec.reasons.join('; '));
      else if (num(rec.moved, b.moved) && rec.moved > b.moved)
        regressions.push(key + ' — nodes moved ' + b.moved + ' -> ' + rec.moved);
      else if (num(rec.reroute, b.reroute) && rec.reroute > b.reroute)
        regressions.push(key + ' — foreign reroutes ' + b.reroute + ' -> ' + rec.reroute);
      else if (b.verdict !== 'local' && rec.verdict === 'local')
        improvements.push(key + ' — was ' + b.verdict + ', now local');
      else if (num(rec.moved, b.moved) && num(rec.reroute, b.reroute)
               && (rec.moved < b.moved || rec.reroute < b.reroute))
        improvements.push(key + ' — moved ' + b.moved + ' -> ' + rec.moved
                        + ', reroutes ' + b.reroute + ' -> ' + rec.reroute);
    }
    const goneKeys = Object.keys(baseline.pairs).filter(k => !(k in pairs));
    console.log('');
    console.log('RATCHET vs results.json (measured ' + baseline.measured + ', engine sha256:'
              + baseline.engine_sha256_12 + ')');
    if (regressions.length) {
      console.log('  REGRESSION — ' + regressions.length + ':');
      for (const r of regressions) console.log('    ' + r);
      exit = 1;
    } else {
      console.log('  no regressions.');
    }
    if (fresh.length) {
      console.log('  UNRECORDED VIOLATION — ' + fresh.length + ' pair(s) the baseline does not know:');
      for (const r of fresh) console.log('    ' + r);
      console.log('    Record them deliberately (--write-baseline) or fix them; an');
      console.log('    unrecorded violation is one nobody has read.');
      exit = 1;
    }
    if (improvements.length) {
      console.log('  IMPROVED — ' + improvements.length + ' (refresh with --write-baseline in the same commit):');
      for (const r of improvements) console.log('    ' + r);
    }
    if (goneKeys.length) {
      console.log('  NOT MEASURED THIS RUN — ' + goneKeys.length + ' pair(s) in the baseline that produced no row:');
      for (const k of goneKeys) console.log('    ' + k);
      console.log('    A baseline entry nothing measures asserts a measurement that');
      console.log('    no longer exists. Remove it deliberately, with its number kept.');
      exit = 1;
    }
  }

  if (strict && failures.length) {
    console.log('');
    console.log('FAIL  --strict: ' + failures.length + ' edit(s) did not render.');
    exit = 1;
  }
  process.exit(exit);
}

main();
