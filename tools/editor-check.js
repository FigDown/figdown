#!/usr/bin/env node
'use strict';
// editor-check.js — the round-trip gate for everything the editor WRITES.
//
//   node tools/editor-check.js [--strict]
//
// The engine is one half of `editor/figdown.html`; the other half is a GUI
// that CONSTRUCTS FigDown source (EDITOR-REQUIREMENT: every GUI action is a text edit). Those
// two halves can drift, and when they do the failure is total and silent
// until a user drags something: the parser moved `pin at=` to a
// paren point while `applyPins` kept emitting `at=x,y`, so every drag produced
// a document the engine refused. The resize emitter had been writing the
// `w=`/`h=` retired for three releases with nothing to catch it.
//
// Two checks, both of which have to keep passing forever:
//
//   A. EMBEDDED EXAMPLES — every entry of `EXAMPLES` must parse with zero
//      errors. They are the dropdown; a stale one hard-errors the moment a
//      user picks it.
//
//   B. EMITTERS — for every code path that builds a directive line, this file
//      carries the emitter's format string VERBATIM plus one rendered sample,
//      and asserts (1) the format string still occurs in figdown.html, so the
//      fixture cannot silently drift from the code it stands for, and (2) the
//      rendered sample parses clean in a minimal document. Editing an emitter
//      breaks (1) and forces the fixture to be updated in the same commit.
const fs = require('fs');
const path = require('path');

const ENGINE = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean).find(p => fs.existsSync(p));

if (!ENGINE) { console.error('figdown.html not found'); process.exit(2); }
const html = fs.readFileSync(ENGINE, 'utf8');

function loadEngine() {
  const start = html.indexOf('const SHAPES');
  const end = html.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  return new Function(html.slice(start, end) + '\nreturn {parse};')();
}
const engine = loadEngine();

// --- A. embedded examples --------------------------------------------------
function examples() {
  const i = html.indexOf('const EXAMPLES={');
  if (i < 0) throw new Error('cannot locate EXAMPLES in ' + ENGINE);
  const j = html.indexOf('\n};', i);
  return new Function(html.slice(i, j + 3) + '\nreturn EXAMPLES;')();
}

// --- B. GUI emitters -------------------------------------------------------
// `emits` is the format string as it appears in the source (the drift guard).
// It may be a LIST, when one code path spells its line across several source
// expressions — every entry then has to occur verbatim.
// `count` pins how MANY times a string occurs, for a form written at more than
// one call site: two call sites that share a spelling would otherwise be
// covered by one fixture, and editing either would still find the string in
// the other. With `count` set, losing either call site fails the check.
// `sample` is what that expression produces for the stated inputs.
// `doc` wraps the sample in the smallest document that gives it referents.
// A fixture with no `sample` is a RECOGNIZER: a pattern that must keep MATCHING
// what the language spells, with no line of its own to parse.
const EMITTERS = [
  // ELEMENT-GEOMETRY-DIRECTIVE merged `size` into `pin`, so `at=`, `width=` and
  // `height=` now share ONE line and TWO GUI actions write it. The line is no
  // longer built at the call sites — both patch `mergePinKeys`, which rebuilds
  // the line from the keys already there plus the patch. That is what makes a
  // drag preserve a resize and vice versa, so the builder gets a fixture of
  // its own and the two call sites get one each for the patch they send.
  {
    what: 'mergePinKeys — the one place a pin line is spelled',
    emits: [
      "const PIN_KEYS=['at','width','height'];",
      "let code='pin '+id;",
      "for(const k of PIN_KEYS) if(cur[k]!==undefined) code+=' '+k+'='+cur[k];",
    ],
    sample: 'pin a at=(120,40) width=120 height=60',
    doc: ['figdown 0.1 block', 'node a "A"', 'layout', '@'],
  },
  {
    // Both call sites send the SAME patch shape, so one fixture stands for
    // both and `count` is what keeps it standing for both.
    what: 'applyPins (node drag) + textWithPins (headless pinned-frame probe)',
    emits: "lines=upsertPin(lines, id, {at:'('+px+','+py+')'});",
    count: 2,
    sample: 'pin a at=(120,40)',
    doc: ['figdown 0.1 block', 'node a "A"', 'layout', '@'],
  },
  {
    what: 'setSize — corner resize handle',
    emits: 'lines=upsertPin(lines, id, {width:String(w), height:String(h)});',
    sample: 'pin a width=120 height=60',
    doc: ['figdown 0.1 block', 'node a "A"', 'layout', '@'],
  },
  {
    // Not an emitter but the same drift class: deleting a node must take its
    // layout line with it. The alternation held `size` until ELEMENT-GEOMETRY-DIRECTIVE folded that
    // keyword into `pin`; if `size` ever reappears here, or `pin` drops out,
    // a delete leaves a `pin of unknown id` behind and the document stops
    // parsing. There is no emitted line to check, only the pattern.
    // GENRE-NODE-SPELLING added `state`: under `statechart` that is the node
    // spelling, and a delete that did not recognise it left the node line
    // behind while removing its pin.
    // SEQUENCE-GENRE-VOCABULARY: the hand-written alternation is GONE. It went
    // stale once per genre that adds a node word — `lifeline` was the third —
    // so it now reads the engine's own `NODE_SPELLINGS` through `NODE_KW_ALT`,
    // which is also what `nodeLineIdx` and `setNodeLabel` use. If this pattern
    // ever goes back to spelling words by hand, the next genre breaks delete.
    what: 'deleteNode — the node/pin line-removal pattern',
    emits: "new RegExp('^('+NODE_KW_ALT+'|pin)",
  },
  {
    // The single source the three GUI node-line patterns share.
    what: 'NODE_KW_ALT — node-line patterns read the engine spelling set',
    emits: "const NODE_KW_ALT=[...NODE_SPELLINGS].join('|');",
  },
  {
    // SEQUENCE-GENRE-VOCABULARY: `sequence` REFUSES `flow`, so the GUI must not
    // write one. This was the batch's headline defect: the first GUI insert
    // into any sequence document authored `flow right`, i.e. a line error, and
    // no fixture would have caught it because `ensureFlowDirective` writes a
    // line that is legal in every genre it was written for.
    what: 'ensureFlowDirective — the genres with no scene layout axis to set',
    emits: "if(genre==='bitfield'||genre==='table'||genre==='timing'||genre==='sequence') return lines;",
  },
  {
    // SEQUENCE-GENRE-VOCABULARY, residue 1: THE GESTURE THAT WRITES A LINE NOTHING
    // READS. `pin` is genre-free vocabulary, so a drag on a lifeline head
    // produced a LEGAL pin line — no parse error, no fixture here could have
    // caught it — that the ladder does not read: the head sprang back and the
    // document kept the dead layout. The exclusion is derived, not listed: a
    // genre with no `flow` in its keyword set has no axis to turn and so no
    // coordinate for a pin to set. Three call sites read it (the drag, the
    // resize handle, and the Raise/Lower status line), and `count` is what
    // keeps this fixture standing for all three: losing any one of them
    // re-opens a gesture that authors dead layout.
    what: 'drag/resize exclusion — a genre that positions itself takes no pin',
    emits: "const genrePositionsByPin=(genre)=>!!(GENRE_KW[genre]&&GENRE_KW[genre].has('flow'));",
  },
  {
    what: 'drag/resize exclusion — all three readers of the predicate',
    emits: 'genrePositionsByPin(lastDoc&&lastDoc.genre)',
    count: 3,
  },
  {
    // SEQUENCE-GENRE-VOCABULARY, residue 2: THE ENABLEMENT TEST ASKS THE GENRE'S OWN
    // COLLECTION. `GENRE_NODE_KW` says what the word is; `GENRE_NODE_COLL`
    // says where the parser puts it, and only one genre so far answers
    // anything but `nodes`. Fill/Delete/Raise/Lower were greyed out for every
    // lifeline because `select()` asked `lastDoc.nodes`, which a `sequence`
    // document never fills — the four edits underneath already worked.
    what: 'select() enablement — node rows resolved through the genre registry',
    emits: [
      "const GENRE_NODE_COLL={block:'nodes',topology:'nodes',flowchart:'nodes',",
      "const docNodes=(doc)=>(doc&&doc[GENRE_NODE_COLL[doc.genre]||'nodes'])||[];",
      "const has=id!==null && docNodes(lastDoc).some(n=>n.id===id);",
    ],
  },
  {
    // The same defect class one layer down, and the one this batch MEASURED:
    // `NODE_KW_ALT` is the union of every genre's node spelling, which is
    // right for "any node-ish line" and wrong the moment two genres share a
    // spelling for different grammars. Under `sequence`, `state c "BOUND"` is
    // an OCCURRENCE, and the union pattern let Fill and Rename target it
    // instead of `lifeline c`, and let Raise/Lower swap a lifeline past it —
    // moving a ROW with a button that moves a COLUMN. Both patterns now read
    // the DOCUMENT'S node word. There is no line to parse: the mis-targeted
    // edits all produced documents that parse clean, which is exactly why
    // this has to be a recognizer.
    what: 'node-line patterns — the DOCUMENT\'S node word, not the union',
    emits: [
      "const nodeLineReAt=lines=>new RegExp('^\\\\s*'+guiNodeKw(lines)+'\\\\s+');",
      "function nodeLineIdx(lines,id){ return lines.findIndex(l=>new RegExp('^\\\\s*'+guiNodeKw(lines)+'\\\\s+'+id+'\\\\b').test(l)); }",
      "const isNode=l=>nodeLineReAt(lines).test(l);",
    ],
  },
  {
    // A cascade whose last member goes has to take the container with it, or
    // the delete leaves a document the engine refuses.
    what: 'deleteNode — a container emptied by the cascade drops its line',
    emits: "$('src').value=dropEmptyContainers(lines, before).join('\\n'); refresh();",
    sample: 'fragment f "F" type=loop',
    doc: ['figdown 0.4 sequence', 'lifeline c "C"', 'lifeline s "S"', '@',
          'message c -> s "m" in=f'],
  },
  {
    what: 'cell click — table cell fill',
    emits: "const newLine='cell ('+r+','+c+') fill='+color;",
    sample: 'cell (1,2) fill=#fee2e2',
    doc: ['figdown 0.1 table', 'table t "T"', '| A | B |', '|---|---|', '| 1 | 2 |', '@'],
  },
  {
    what: 'delete node — rank line rewritten without the deleted id',
    emits: "return 'rank '+rest.join(',');",
    sample: 'rank a,b',
    doc: ['figdown 0.1 block', 'node a "A"', 'node b "B"', '@'],
  },
  {
    // GENRE-CONNECTOR-SPELLING/GENRE-NODE-SPELLING: the button writes the DOCUMENT'S node word, so the emitter
    // is `guiNodeKw(lines)` rather than a literal. A GUI action is a text
    // edit, and a text edit that spells the wrong genre's word is a line error.
    what: 'new node button',
    // SEQUENCE-GENRE-VOCABULARY: `&&shaped` guards the kind picker. `lifeline`
    // does not take `shape=`, so under `sequence` the picker writes nothing —
    // the option table decides, the button does not.
    emits: "lines.splice(last+1,0,guiNodeKw(lines)+' '+nid+' \"Node '+nnum+'\"'+(kk!=='box'&&shaped?' shape='+kk:''));",
    sample: 'node n1 "Node 1" shape=rounded',
    doc: ['figdown 0.1 block', '@'],
  },
  {
    what: 'new group button',
    emits: "lines.splice(firstIdx,0,'group '+gid+' \"Group '+gnum+'\"');",
    sample: 'group g1 "Group 1"',
    doc: ['figdown 0.1 block', '@'],
  },
  {
    what: 'link arm — new connector',
    emits: "lines.splice(last+1,0,ck+' '+linkArm+' -> '+id);",
    sample: 'edge a -> b',
    doc: ['figdown 0.1 block', 'node a "A"', 'node b "B"', '@'],
  },
  {
    // GENRE-CONNECTOR-SPELLING/GENRE-NODE-SPELLING: the same two emitters under a genre that renames both words.
    // A sample is all this file can check mechanically; the emitters above
    // are the ones that would silently regress to `node`/`edge`.
    what: 'link arm — statechart spells it `transition`',
    emits: "const guiConnKw=lines=>connectorKwAt(guiGenre(lines), guiVersion(lines))||'edge';",
    sample: 'transition a -> b',
    doc: ['figdown 0.2 statechart', 'state a "A"', 'state b "B"', '@'],
  },
  {
    // KEYWORD-RENAME-SCOPE: the connector word is version-gated, so the GUI has
    // to read the DECLARED VERSION as well as the genre. Inserting `flowline`
    // into a `figdown 0.1 flowchart` document would make the editor author a
    // line error, so the same emitter must produce `edge` there and
    // `flowline` one version up. Both directions are sampled.
    what: 'link arm — flowchart at 0.1 still spells it `edge`',
    emits: "const guiConnKw=lines=>connectorKwAt(guiGenre(lines), guiVersion(lines))||'edge';",
    sample: 'edge a -> b',
    doc: ['figdown 0.1 flowchart', 'node a "A"', 'node b "B"', '@'],
  },
  {
    what: 'link arm — flowchart at 0.2 spells it `flowline`',
    emits: "const guiConnKw=lines=>connectorKwAt(guiGenre(lines), guiVersion(lines))||'edge';",
    sample: 'flowline a -> b',
    doc: ['figdown 0.2 flowchart', 'node a "A"', 'node b "B"', '@'],
  },
  {
    what: 'new node button — statechart spells it `state`',
    emits: "const guiNodeKw=lines=>GENRE_NODE_KW[guiGenre(lines)]||'node';",
    sample: 'state n1 "Node 1"',
    doc: ['figdown 0.2 statechart', '@'],
  },
  {
    // SEQUENCE-GENRE-VOCABULARY: the same two emitters under the third genre that
    // renames both words. `sequence` is the case that proves the emitters are
    // table-driven rather than a two-branch special case for `statechart`:
    // `node`/`edge` are BOTH the WRONG_WORD diagnostic here, so a GUI action
    // that spelled either would author a line error in a document the user
    // had done nothing wrong in.
    what: 'link arm — sequence spells it `message`',
    emits: "const guiConnKw=lines=>connectorKwAt(guiGenre(lines), guiVersion(lines))||'edge';",
    sample: 'message a -> b',
    doc: ['figdown 0.4 sequence', 'lifeline a "A"', 'lifeline b "B"', '@'],
  },
  {
    // And the node half. The sample carries NO `shape=`: the kind picker is
    // silent under this genre because `lifeline` does not take the key —
    // see the `&&shaped` guard on the emitter above.
    what: 'new node button — sequence spells it `lifeline`',
    emits: "const guiNodeKw=lines=>GENRE_NODE_KW[guiGenre(lines)]||'node';",
    sample: 'lifeline n1 "Node 1"',
    doc: ['figdown 0.4 sequence', '@'],
  },
  {
    what: 'threshold drag — offset rewritten in place',
    emits: "lines[srcLine-1]=lines[srcLine-1].replace(/offset=\\d+(?:\\.\\d+)?%?/,'offset='+pct+'%');",
    sample: 'threshold "cap" in=a offset=60%',
    doc: ['figdown 0.1 block', 'node a "A"', '@'],
  },
  // 0.1 (EDGE-GEOMETRY-CONSTRUCTS): the `finishRoute` fixture stood here — the Route
  // button's emitter, `path <a> <op> <b> points=(x,y),…`. The `path` directive
  // was WITHDRAWN from the language, so the button, its emitter and this
  // fixture were deleted in the same change. The Ortho toggle (`routing
  // orthogonal`) went with them; it never had a fixture, which is its own
  // small lesson about what this file covers.
  {
    what: 'ensureFlowDirective — header inserted for a bare document',
    emits: "lines.unshift('figdown 0.1 block');",
    sample: 'node a "A"',
    doc: ['figdown 0.1 block', '@'],
  },
];

const strict = process.argv.includes('--strict');
let fails = 0;
const fail = (m) => { console.log('FAIL  ' + m); fails++; };

console.log('A. embedded examples');
const ex = examples();
for (const k of Object.keys(ex)) {
  const src = ex[k];
  if (typeof src !== 'string') { fail('EXAMPLES["' + k + '"] is not a string'); continue; }
  const r = engine.parse(src);
  if (r.errs.length) fail('EXAMPLES["' + k + '"]\n      ' + r.errs.join('\n      '));
  else console.log('ok    ' + k);
}

function occurrences(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) >= 0) { n++; i++; }
  return n;
}

console.log('\nB. GUI emitters (round-trip: emitted line -> parse -> zero errors)');
for (const em of EMITTERS) {
  const strings = Array.isArray(em.emits) ? em.emits : [em.emits];
  let drifted = false;
  for (const s of strings) {
    const n = occurrences(html, s);
    if (!n) {
      fail(em.what + ' — the emitter no longer contains its recorded format string:\n      ' +
        s + '\n      Update this fixture in the same change that edited the emitter.');
      drifted = true;
    } else if (em.count !== undefined && n !== em.count) {
      fail(em.what + ' — the recorded format string occurs ' + n + ' time(s), expected ' +
        em.count + ' (one per call site it stands for):\n      ' + s +
        '\n      Update this fixture in the same change that edited the emitter.');
      drifted = true;
    }
  }
  if (drifted) continue;
  // A recognizer has no line of its own; the occurrence check IS the check.
  if (em.sample === undefined) { console.log('ok    ' + em.what + '  (recognizer)'); continue; }
  const doc = em.doc.map(l => (l === '@' ? em.sample : l)).join('\n');
  const r = engine.parse(doc);
  if (r.errs.length) fail(em.what + ' emits a line the parser rejects: "' + em.sample + '"\n      ' + r.errs.join('\n      '));
  else console.log('ok    ' + em.what + '  ->  ' + em.sample);
}

console.log('\n' + (fails ? fails + ' failure(s)' : 'all editor-emitted source parses'));
if (fails && strict) process.exit(1);
