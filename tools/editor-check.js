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
// Four checks, all of which have to keep passing forever:
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
//
//   C. TRANSACTION / SOURCE-PRESERVATION INVARIANTS — the candidate pipeline
//      (build -> parse -> render -> postcondition -> section-isolation) and
//      what a GUI edit must leave byte-identical around itself.
//
//   D. THE CONNECTOR SCANNER (`scanConnectorLine`) — the engine's
//      one connector grammar, read through the entry point the GUI's edge
//      editing calls. The GUI is forbidden a grammar of its own, so this
//      section is where "the scanner still says what the parser says" is
//      measured: for every line in the battery it asserts that the spans
//      reassemble the input, that the scanned fields equal the PARSED model's
//      for the same line, that the option span begins at endpoint `b`'s last
//      byte, and that malformed and non-connector input returns `{ok:false}`
//      instead of throwing.
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
  return new Function(html.slice(start, end) +
    '\nreturn {parse,render,findComment,scanConnectorLine,connectorKwAt,GENRE_NODE_KW,GENRE_NODE_COLL,GENRE_KW,directiveOpts,docNodes,isId,tokenize,splitOpts,belowOptVersion,FIGDOWN_VERSION};')();
}
const engine = loadEngine();

// Load exact UI functions by source sentinels. Each function is sliced up to
// the next top-level function declaration; no copy of its behavior lives here.
function uiFunction(name) {
  let at = html.indexOf('function ' + name + '(');
  if (at >= 6 && html.slice(at - 6, at) === 'async ') at -= 6;
  if (at < 0) throw new Error('cannot locate UI function ' + name);
  const a = html.indexOf('\nfunction ', at + 10);
  const b = html.indexOf('\nasync function ', at + 10);
  const next = a < 0 ? b : b < 0 ? a : Math.min(a, b);
  if (next < 0) throw new Error('cannot locate end of UI function ' + name);
  return html.slice(at, next);
}
function loadEditorCore() {
  const names = ['sectionRanges','sectionBounds','sectionText','sourceLineIn','candidateResult','validateGuiEdit','prepareGuiEdit',
    'lastContentLineIdx','contentZoneInsertIndex','connectorSelectionId','connectorModels','connectorSourceInfo','spliceConnector','edgeModel','connectorLabelText',
    'encodeConnectorLabel','connectorWithMid','spliceConnectorSpan','rewriteConnectorLabel','rewriteConnectorOperator','rewriteConnectorEndpoint',
    'authoredOptionSpan','connectorOptionSpan','rewriteConnectorOption','connectorOptionAbsent','flipConnector','deleteConnector',
    'splitLineComment','joinCodeComment','escapeFdString','guiGenre','guiVersion',
    'regexEscape','nextFreeId','declarationLineIdx','declarationModel','authoredQuotedValueSpan','declarationSourceInfo',
    'rewriteDeclarationLabel','rewriteTitle','rewriteFlow','classInsertIndex','upsertClassDeclaration','stripClassIdFromLine',
    'deleteClassDeclaration','insertExternalDeclaration','rewriteExternalLabel','rewriteBundleWithoutEndpoint','deleteExternalDeclaration',
    'stripExactOptionValue','ungroupDeclaration','buildLabelEdit','labelEditMatches','optionSpanOutsideLabel','rewriteOption',
    'declarationOptionAbsent',
    'ensureLayoutMarker','upsertLayoutDirective','mergePinKeys','upsertPin',
    'splitPipeSource','buildPipeSource','delimiterParts','tableSourceInfo','tableRowsInfo','tableCellId','parseTableCellId',
    'firstTypedBlock','tableActionTarget','tableSelectionModel','tableMark','dropLinePreserveComment','rewriteTableCellOption','tableCellOptionAbsent','setTableCellText',
    'rewriteTableCellRefsRange','rewriteTableCellRefs','tableWidthValues','setTableWidths','setTableRowHighlight',
    'insertTableRow','insertTableColumn','deleteTableRow','deleteTableColumn',
    'sourceTokenSpans','commaElementSpans','classicFieldParts','bitfieldSourceInfo','bitfieldItems','bitfieldSelectionId',
    'parseBitfieldSelectionId','bitfieldSelectionModel','encodeCompactName','compactItemParts','rewriteClassicFieldName',
    'rewriteClassicFieldWidth','rewriteCompactFieldItem','rewriteFieldOption','fieldOptionAbsent','fieldOptionWritten','setBitfieldOption',
    'addBitfieldField','addBitfieldBreak','deleteBitfieldItem','moveBitfieldLine','moveBitfieldLineBefore','bitfieldBudget',
    'moveNodeLineSource','moveNodeOrderMatches',
    'sourceLineContexts','sourceHighlightLine','inspectorHtml'];
  const src = names.map(uiFunction).join('\n');
  return new Function('parse','render','findComment','scanConnectorLine','connectorKwAt','GENRE_NODE_KW','GENRE_KW',
    'directiveOpts','docNodes','isId','tokenize','splitOpts','belowOptVersion',
    src+
    '\nreturn {buildLabelEdit,labelEditMatches,validateGuiEdit,prepareGuiEdit,sectionRanges,nextFreeId,rewriteOption,upsertPin,'+
    'rewriteConnectorLabel,rewriteConnectorOperator,rewriteConnectorEndpoint,rewriteConnectorOption,flipConnector,deleteConnector,'+
    'rewriteTitle,rewriteFlow,upsertClassDeclaration,deleteClassDeclaration,insertExternalDeclaration,rewriteExternalLabel,'+
    'deleteExternalDeclaration,ungroupDeclaration,declarationOptionAbsent,connectorOptionAbsent,connectorSelectionId,'+
    'tableRowsInfo,tableSelectionModel,tableActionTarget,tableCellId,rewriteTableCellOption,tableCellOptionAbsent,setTableCellText,setTableWidths,setTableRowHighlight,'+
    'insertTableRow,insertTableColumn,deleteTableRow,deleteTableColumn,bitfieldItems,bitfieldSelectionId,bitfieldSelectionModel,'+
    'rewriteClassicFieldName,rewriteClassicFieldWidth,rewriteCompactFieldItem,rewriteFieldOption,fieldOptionAbsent,fieldOptionWritten,setBitfieldOption,'+
    'escapeFdString,'+
    'addBitfieldField,addBitfieldBreak,deleteBitfieldItem,moveBitfieldLine,moveBitfieldLineBefore,bitfieldBudget,'+
    'moveNodeLineSource,moveNodeOrderMatches,sourceLineContexts,sourceHighlightLine};')(
      engine.parse,engine.render,engine.findComment,engine.scanConnectorLine,engine.connectorKwAt,engine.GENRE_NODE_KW,
      engine.GENRE_KW,engine.directiveOpts,engine.docNodes,engine.isId,engine.tokenize,engine.splitOpts,engine.belowOptVersion);
}
const editorCore = loadEditorCore();
// `svgArtifact` is hoisted VERBATIM out of the browser file, so it reaches for
// the WebCrypto global a browser always has. Node only exposes that global from
// v19; on v18 it lives at `node:crypto`.webcrypto and the hoisted function
// throws `crypto is not defined`. The gate supplies it rather than the editor
// branching on its host — the editor's copy must stay the browser's.
const webcrypto = globalThis.crypto || require('node:crypto').webcrypto;
const svgArtifact = new Function('FIGDOWN_VERSION', 'crypto',
  uiFunction('svgArtifact') + '\nreturn svgArtifact;')(engine.FIGDOWN_VERSION, webcrypto);

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
    emits: [
      "return commitGuiEdit('pin '+pins.length+' element(s)'",
      "const r=upsertPin(lines,sectionIndex,id,{at:'('+px+','+py+')'});",
    ],
    sample: 'pin a at=(120,40)',
    doc: ['figdown 0.1 block', 'node a "A"', 'layout', '@'],
  },
  {
    what: 'setSize — corner resize handle',
    emits: "commitGuiEdit('resize '+id,({lines})=>upsertPin(lines,item.sectionIndex,id,{width:String(w),height:String(h)})",
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
        what: 'deleteNode — the node/pin line-removal pattern',
    emits: "const declIdx=modelNode?sourceLineIn(lines,item.sectionIndex,modelNode.line):-1;",
  },
  {
    // SEQUENCE-GENRE-VOCABULARY: `sequence` REFUSES `flow`, so the GUI must not
    // write one. This was the batch's headline defect: the first GUI insert
    // into any sequence document authored `flow right`, i.e. a line error, and
    // no fixture would have caught it because `ensureFlowDirective` writes a
    // line that is legal in every genre it was written for.
    what: 'ensureFlowDirective — the genres with no scene layout axis to set',
    emits: "if(!GENRE_KW[genre]||!GENRE_KW[genre].has('flow')) return lines;",
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
    what: 'drag/resize exclusion — gesture and resize readers of the predicate',
    emits: [
      'genrePositionsByPin(lastDoc&&lastDoc.genre)',
    ],
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
      "const nd=d&&docNodes(d).find(n=>n.id===item.id);",
    ],
  },
  {
    // The same defect class one layer down, and the one this batch MEASURED:
    // A union of node spellings is wrong the moment two genres share a spelling
    // for different grammars. Under `sequence`, `state c "BOUND"` is
    // an OCCURRENCE, and the union pattern let Fill and Rename target it
    // instead of `lifeline c`, and let Raise/Lower swap a lifeline past it —
    // moving a ROW with a button that moves a COLUMN. Both patterns now read
    // the DOCUMENT'S node word. There is no line to parse: the mis-targeted
    // edits all produced documents that parse clean, which is exactly why
    // this has to be a recognizer.
    what: 'node-line patterns — the DOCUMENT\'S node word, not the union',
    emits: [
      "const n=docNodes(r.doc).find(x=>x.id===id);",
      "function nodeLineIdx(lines,id,sectionIndex){ return declarationLineIdx(lines,sectionIndex||0,'node',id); }",
      "const nodes=docNodes(parsed.doc).slice().sort((x,y)=>x.line-y.line);",
    ],
  },
  {
    // A cascade whose last member goes has to take the container with it, or
    // the delete leaves a document the engine refuses.
    what: 'deleteNode — a container emptied by the cascade drops its line',
    emits: "return dropEmptyContainers(out,before,item.sectionIndex);",
    sample: 'fragment f "F" type=loop',
    doc: ['figdown 0.4 sequence', 'lifeline c "C"', 'lifeline s "S"', '@',
          'message c -> s "m" in=f'],
  },
  {
    what: 'table inspector — new cell mark',
    emits: "lines.splice(info.end,0,'cell ('+rowTok+','+col+') '+key+'='+val);",
    sample: 'cell (1,2) fill=#fee2e2',
    doc: ['figdown 0.1 table', 'table t "T"', '| A | B |', '|---|---|', '| 1 | 2 |', '@'],
  },
  {
    what: 'delete node — rank line rewritten without the deleted id',
    emits: "out.push(joinCodeComment(rm[1]+'rank '+rest.join(','),sp.comment));",
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
    emits: "lines.splice(at,0,nkw+' '+nid+' \"Node '+nnum+'\"'+(kk!=='box'&&shaped?' shape='+kk:''));",
    sample: 'node n1 "Node 1" shape=rounded',
    doc: ['figdown 0.1 block', '@'],
  },
  {
    what: 'new group button',
    emits: "lines.splice(first,0,'group '+gid+' \"Group '+gnum+'\"');",
    sample: 'group g1 "Group 1"',
    doc: ['figdown 0.1 block', '@'],
  },
  {
    what: 'link arm — new connector',
    emits: "lines.splice(at,0,ck+' '+a+' -> '+b);",
    sample: 'edge a -> b',
    doc: ['figdown 0.1 block', 'node a "A"', 'node b "B"', '@'],
  },
  {
    // GENRE-CONNECTOR-SPELLING/GENRE-NODE-SPELLING: the same two emitters under a genre that renames both words.
    // A sample is all this file can check mechanically; the emitters above
    // are the ones that would silently regress to `node`/`edge`.
    what: 'link arm — statechart spells it `transition`',
    emits: "const guiConnKw=(lines,sectionIndex)=>connectorKwAt(guiGenre(lines,sectionIndex), guiVersion(lines,sectionIndex))||'edge';",
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
    emits: "const guiConnKw=(lines,sectionIndex)=>connectorKwAt(guiGenre(lines,sectionIndex), guiVersion(lines,sectionIndex))||'edge';",
    sample: 'edge a -> b',
    doc: ['figdown 0.1 flowchart', 'node a "A"', 'node b "B"', '@'],
  },
  {
    what: 'link arm — flowchart at 0.2 spells it `flowline`',
    emits: "const guiConnKw=(lines,sectionIndex)=>connectorKwAt(guiGenre(lines,sectionIndex), guiVersion(lines,sectionIndex))||'edge';",
    sample: 'flowline a -> b',
    doc: ['figdown 0.2 flowchart', 'node a "A"', 'node b "B"', '@'],
  },
  {
    what: 'new node button — statechart spells it `state`',
    emits: "const guiNodeKw=(lines,sectionIndex)=>GENRE_NODE_KW[guiGenre(lines,sectionIndex)]||'node';",
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
    emits: "const guiConnKw=(lines,sectionIndex)=>connectorKwAt(guiGenre(lines,sectionIndex), guiVersion(lines,sectionIndex))||'edge';",
    sample: 'message a -> b',
    doc: ['figdown 0.4 sequence', 'lifeline a "A"', 'lifeline b "B"', '@'],
  },
  {
    // And the node half. The sample carries NO `shape=`: the kind picker is
    // silent under this genre because `lifeline` does not take the key —
    // see the `&&shaped` guard on the emitter above.
    what: 'new node button — sequence spells it `lifeline`',
    emits: "const guiNodeKw=(lines,sectionIndex)=>GENRE_NODE_KW[guiGenre(lines,sectionIndex)]||'node';",
    sample: 'lifeline n1 "Node 1"',
    doc: ['figdown 0.4 sequence', '@'],
  },
  {
    what: 'threshold drag — offset rewritten in place',
    emits: "lines[i]=lines[i].replace(/offset=\\d+(?:\\.\\d+)?%?/,'offset='+pct+'%');",
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
  if (r.errs.length) { fail('EXAMPLES["' + k + '"]\n      ' + r.errs.join('\n      ')); continue; }
  const rr = (r.docs || [r.doc]).map(d => engine.render(d, { title: true }));
  const re = rr.reduce((a,x) => a.concat(x.errs || []), []);
  if (re.length || rr.some(x => !x.svg)) fail('EXAMPLES["' + k + '"] render failed\n      ' + re.join('\n      '));
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
  if (r.errs.length) { fail(em.what + ' emits a line the parser rejects: "' + em.sample + '"\n      ' + r.errs.join('\n      ')); continue; }
  const rr = engine.render(r.doc, { title: true });
  if ((rr.errs && rr.errs.length) || !rr.svg) fail(em.what + ' parses but does not render: "' + em.sample + '"\n      ' + (rr.errs || []).join('\n      '));
  else console.log('ok    ' + em.what + '  ->  ' + em.sample);
}

console.log('\nC. transaction / source-preservation invariants');
const check = (name, cond, detail) => {
  if (cond) console.log('ok    ' + name);
  else fail(name + (detail ? '\n      ' + detail : ''));
};
const target = { sectionIndex: 0, kind: 'node', id: 'a' };
const before = [
  'figdown 0.1 block',
  'node a "cost key=old # literal" fill=#0d9488 # keep tail',
  'node ab "AB"',
  'flow right',
  '',
  'figdown 0.1 table',
  'table t "Second"',
  '| A | B | C | D | E | F | G | H | I | J | K |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  '| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |',
  'cell (1,11) fill=#abcdef',
].join('\n');
const built = editorCore.buildLabelEdit(before, target, '中文 key=new # literal');
check('label emitter returns a candidate', built && built.lines, built && built.error);
const after = built.lines.join('\n');
const validated = editorCore.validateGuiEdit(before, after, 0,
  ({parsed}) => editorCore.labelEditMatches(parsed, target, '中文 key=new # literal'), built, {});
check('candidate parse + render + label postcondition', validated.ok, validated.error);
check('trailing comment survives', /node a .* # keep tail/.test(after), after.split('\n')[1]);
check('key= and # inside replacement label survive', after.includes('"中文 key=new # literal"'), after.split('\n')[1]);
check('hex color survives', after.includes('fill=#0d9488'), after.split('\n')[1]);
check('id substring safety (a does not edit ab)', after.split('\n')[2] === 'node ab "AB"', after.split('\n')[2]);
const bsec = editorCore.sectionRanges(before.split('\n'))[1];
const asec = editorCore.sectionRanges(after.split('\n'))[1];
check('later section byte-identical',
  before.split('\n').slice(bsec.start,bsec.end).join('\n') === after.split('\n').slice(asec.start,asec.end).join('\n'));
check('cell address substring remains untouched', after.includes('cell (1,11) fill=#abcdef'));
const unlabeled='figdown 0.1 block\nnode a fill=#abcdef # keep\nflow right';
const unlabeledBuilt=editorCore.buildLabelEdit(unlabeled,target,'Added');
const unlabeledAfter=unlabeledBuilt.lines.join('\n');
check('unlabelled node gains a label without consuming its first option',
  unlabeledAfter.includes('node a "Added" fill=#abcdef # keep'),unlabeledAfter);
const groupSrc='figdown 0.1 block\ngroup g "群組 #1" # group tail\nnode a "A" in=g\nflow right';
const groupTarget={sectionIndex:0,kind:'group',id:'g'};
const groupBuilt=editorCore.buildLabelEdit(groupSrc,groupTarget,'新群組 # CJK');
check('group locator is section-aware and comment-safe',groupBuilt&&groupBuilt.lines&&
  groupBuilt.lines[1]==='group g "新群組 # CJK" # group tail',groupBuilt&&groupBuilt.error||String(groupBuilt&&groupBuilt.lines));
const missing = editorCore.buildLabelEdit(before,{sectionIndex:0,kind:'node',id:'missing'},'X');
check('invalid target returns a concrete error', missing && missing.ok === false && /not found/.test(missing.error), JSON.stringify(missing));
check('invalid target leaves source byte-identical', before === String(before));
const cross = after.replace('table t "Second"','table t "Changed"');
const crossCheck = editorCore.validateGuiEdit(before,cross,0,null,null,{});
check('cross-section mutation is refused', !crossCheck.ok && /section 1 changed/.test(crossCheck.error), crossCheck.error);
const history=[]; let state=before;
const planned=editorCore.prepareGuiEdit(state,0,({text})=>editorCore.buildLabelEdit(text,target,'Undo probe'),
  ({parsed})=>editorCore.labelEditMatches(parsed,target,'Undo probe'),{},7);
if(planned.ok){ history.push(state); state=planned.after; state=history.pop(); }
check('edit -> undo restores byte-identical text', planned.ok && state===before, planned.error);
const badHistory=[], badState=before;
const badPlan=editorCore.prepareGuiEdit(badState,0,({text})=>editorCore.buildLabelEdit(text,{sectionIndex:0,kind:'node',id:'missing'},'X'),null,{},8);
check('invalid target leaves source/history unchanged', !badPlan.ok && badState===before && badHistory.length===0, badPlan.error);

console.log('\nD. Round-2 acceptance findings');
const m1src='figdown 0.1 block\nnode a "cost fill=old # literal" stroke=#111 # tail\nflow right';
const m1lines=m1src.split('\n');
const m1=editorCore.rewriteOption(m1lines,0,'node','a','fill','#abcdef');
check('M1 option edit ignores key=-shaped text inside the label',m1&&m1.lines&&
  m1.lines[1]==='node a "cost fill=old # literal" stroke=#111 fill=#abcdef # tail',m1&&m1.error||String(m1&&m1.lines));
const m1p=engine.parse(m1.lines.join('\n'));
check('M1 candidate parses and applies the real fill',!m1p.errs.length&&m1p.doc.nodes[0].fill==='#abcdef',m1p.errs.join('; '));
const clearMissing=editorCore.rewriteOption(m1src.split('\n'),0,'node','a','class','');
check('clear absent option names the option and refuses',clearMissing&&clearMissing.ok===false&&/option class= is not set/.test(clearMissing.error),JSON.stringify(clearMissing));
const badIds=editorCore.nextFreeId(['figdown 0.1 block','node'], 'n', 0);
check('nextFreeId refuses a parse-error section',badIds&&badIds.ok===false&&/section has errors/.test(badIds.error),JSON.stringify(badIds));
const multiPin=['figdown 0.1 block','node a "A"','flow right','','figdown 0.1 block','node b "B"','flow right'];
const pinBefore=multiPin.slice(0,4).join('\n');
const pinR=editorCore.upsertPin(multiPin,1,'b',{at:'(70,80)'});
check('layout emitter accepts explicit second-section bounds',pinR&&pinR.ok&&/pin b at=\(70,80\)/.test(pinR.lines.join('\n')),pinR&&pinR.error);
check('second-section pin leaves section 0 byte-identical',pinR.lines.slice(0,4).join('\n')===pinBefore,pinR.lines.join('\n'));
check('upsertPin escapes and scopes its id matcher',
  html.includes("new RegExp('^\\\\s*pin\\\\s+'+regexEscape(id)+idTokenEnd)") &&
  html.includes("const idTokenEnd='(?![A-Za-z0-9_-])';"));
check('layout helper signatures are section-aware',html.includes('function ensureLayoutMarker(lines,sectionIndex)')&&
  html.includes('function upsertLayoutDirective(lines,sectionIndex,matchRe,newLine)')&&
  html.includes('function upsertPin(lines,sectionIndex,id,patch)'));
check('dead node keyword constants are gone from the UI',!html.slice(html.indexOf('// 3. UI')).includes('NODE_KW_ALT')&&
  !html.slice(html.indexOf('// 3. UI')).includes('nodeLineReAt'));
check('inline editor CSS is in the head and uses the panel variable',html.indexOf('.inline-edit{')<html.indexOf('</style>')&&
  html.includes('background:var(--panel)'));

console.log('\nE. Batch-2 inspector emitters');
function passBuilt(name,base,built,test){
  if(!built||built.ok===false||!built.lines){fail(name+' — build refused: '+JSON.stringify(built));return null;}
  const p=engine.parse(built.lines.join('\n'));
  const rendered=p.errs.length?[]:(p.docs||[p.doc]).map(d=>engine.render(d,{title:true}));
  const renderOk=rendered.every(r=>r.svg&&!(r.errs&&r.errs.length));
  check(name,!p.errs.length&&renderOk&&test(p.doc,built.lines),p.errs.join('; ')+
    rendered.flatMap(r=>r.errs||[]).join('; ')+'\n      '+built.lines.join('\n'));
  return built.lines;
}
const edgeBase=['figdown 0.1 block','class hot "Hot"','class cold "Cold"','node a "A"','node b "B"','node c "C"','edge a [tail #1] -[mid key=old]-> [head] b style=dotted stroke=#333 class=hot,cold # edge tail'];
let el=edgeBase.slice();
el=passBuilt('edge mid-label rewrite uses scanner span and preserves endpoints/options/comment',el,editorCore.rewriteConnectorLabel(el,0,7,'mid','新標籤 # CJK'),(d,ls)=>{
  const e=d.edges[0]; return e.mid==='新標籤 # CJK'&&e.a==='a'&&e.b==='b'&&e.tail==='tail #1'&&e.head==='head'&&e.style==='dotted'&&e.stroke==='#333'&&e.cls.join(',')==='hot,cold'&&ls[6].endsWith('# edge tail');
})||el;
el=passBuilt('edge flip reverses a directed operator without swapping endpoint roles',el,editorCore.flipConnector(el,0,7),d=>d.edges[0].a==='a'&&d.edges[0].b==='b'&&d.edges[0].op==='<-')||el;
el=passBuilt('edge operator rewrite preserves written mid-label',el,editorCore.rewriteConnectorOperator(el,0,7,'<->'),d=>d.edges[0].op==='<->'&&d.edges[0].mid==='新標籤 # CJK')||el;
el=passBuilt('edge endpoint reconnect touches only the selected endpoint',el,editorCore.rewriteConnectorEndpoint(el,0,7,'b','c'),(d,ls)=>d.edges[0].a==='a'&&d.edges[0].b==='c'&&ls[6].includes('[tail #1]'))||el;
el=passBuilt('edge option edit is confined to scanner options span',el,editorCore.rewriteConnectorOption(el,0,7,'style','dashed'),(d,ls)=>d.edges[0].style==='dashed'&&d.edges[0].mid==='新標籤 # CJK'&&ls[6].endsWith('# edge tail'))||el;
const symmetricFlip=editorCore.flipConnector(el.slice(),0,7);
check('symmetric connector flip is refused with a concrete reason',
  symmetricFlip&&symmetricFlip.ok===false&&/symmetric/.test(symmetricFlip.error),JSON.stringify(symmetricFlip));
const badSeq=['figdown 0.4 sequence','lifeline a "A"','lifeline b "B"','message a -> b'];
const seqDash=editorCore.rewriteConnectorOperator(badSeq.slice(),0,4,'--');
check('sequence operator -- is refused before candidate mutation',seqDash&&seqDash.ok===false&&/require a direction/.test(seqDash.error),JSON.stringify(seqDash));
const seqTrailing=['figdown 0.4 sequence','lifeline a "A"','lifeline b "B"','message a -> b "Hello" description="keep # prose"'];
passBuilt('sequence trailing message label is edited without touching its options',seqTrailing,editorCore.rewriteConnectorLabel(seqTrailing.slice(),0,4,'mid','你好 # CJK'),(d,ls)=>d.messages[0].label==='你好 # CJK'&&d.messages[0].desc==='keep # prose'&&ls[3].includes('"你好 # CJK" description="keep # prose"'));
const noSpace=['figdown 0.1 block','node a-b "AB"','node x-y "XY"','edge a-b--x-y # compact'];
passBuilt('no-space connector endpoint edit keeps compact grammar valid',noSpace,editorCore.rewriteConnectorEndpoint(noSpace.slice(),0,4,'b','a-b'),(d,ls)=>d.edges[0].a==='a-b'&&d.edges[0].b==='a-b'&&ls[3].endsWith('# compact'));
passBuilt('compact -- connector accepts a scanner-spliced mid label',noSpace,editorCore.rewriteConnectorLabel(noSpace.slice(),0,4,'mid','中文 #1'),(d,ls)=>d.edges[0].a==='a-b'&&d.edges[0].b==='x-y'&&d.edges[0].op==='--'&&d.edges[0].mid==='中文 #1'&&ls[3].endsWith('# compact'));
const quotedNode=['figdown 0.3 block','node a note="cost fill=old" "真標籤" stroke=#111 # 尾註','flow right'];
passBuilt('node option locator ignores key= inside another quoted option',quotedNode,editorCore.rewriteOption(quotedNode.slice(),0,'node','a','fill','#abcdef'),(d,ls)=>d.nodes[0].label==='真標籤'&&d.nodes[0].fill==='#abcdef'&&d.nodes[0].note==='cost fill=old'&&ls[1].endsWith('# 尾註'));
const quotedEdge=['figdown 0.3 block','class hot "Hot"','node a "A"','node b "B"','edge a -> b note="literal class=old stroke=#bad" style=dotted # 尾註'];
passBuilt('edge option locator ignores key= inside quoted note=',quotedEdge,editorCore.rewriteConnectorOption(quotedEdge.slice(),0,5,'class','hot'),(d,ls)=>d.edges[0].cls.join(',')==='hot'&&d.edges[0].note==='literal class=old stroke=#bad'&&d.edges[0].style==='dotted'&&ls[4].endsWith('# 尾註'));
const titleBase=['figdown 0.3 block','title "same" note="same" # title tail','node a "A"'];
passBuilt('title edits positional label, not equal note= text',titleBase,editorCore.rewriteTitle(titleBase.slice(),0,'set','新的 # title'),(d,ls)=>d.title==='新的 # title'&&d.note==='same'&&ls[1].endsWith('# title tail'));
const titleRemoved=passBuilt('title remove is distinct from explicit empty',titleBase,editorCore.rewriteTitle(titleBase.slice(),0,'remove',''),d=>d.title===null)||titleBase;
passBuilt('explicit empty title is inserted as a real declaration',titleRemoved,editorCore.rewriteTitle(titleRemoved.slice(),0,'set',''),d=>d.title==='');
const flowBase=['figdown 0.1 block','node a "A"','flow right # flow tail'];
passBuilt('flow replace preserves its trailing comment',flowBase,editorCore.rewriteFlow(flowBase.slice(),0,'down'),(d,ls)=>d.flow==='down'&&ls[2]==='flow down # flow tail');
const seqFlow=editorCore.rewriteFlow(badSeq.slice(),0,'down');
check('flow emitter refuses a genre without flow',seqFlow&&seqFlow.ok===false&&/has no flow/.test(seqFlow.error),JSON.stringify(seqFlow));
const clsBase=['figdown 0.1 block','class a "A"','class b "B"','class c "C"','group g "G" class=a,b,c','node n "class=b prose" in=g class=a,b,c # node tail','node z "Z" class=b','edge n -[class=b label]-> z class=a,b,c # edge tail'];
passBuilt('class delete strips exact multi-class members and preserves order/labels/comments',clsBase,editorCore.deleteClassDeclaration(clsBase.slice(),0,'b'),(d,ls)=>{
  const n=d.nodes.find(x=>x.id==='n'),z=d.nodes.find(x=>x.id==='z'),g=d.groups[0],e=d.edges[0];
  return !d.classes.some(c=>c.id==='b')&&g.cls.join(',')==='a,c'&&n.cls.join(',')==='a,c'&&!z.cls&&e.cls.join(',')==='a,c'&&
    ls[4].includes('"class=b prose"')&&ls[6].includes('[class=b label]')&&ls[4].endsWith('# node tail')&&ls[6].endsWith('# edge tail');
});
const cellOnly=['figdown 0.1 table','class a "A"','table t "T"','| H |','|---|','| x |','cell (1,1) class=a # keep'];
passBuilt('deleting the last class-only cell mark removes the directive and preserves its comment',cellOnly,editorCore.deleteClassDeclaration(cellOnly.slice(),0,'a'),(d,ls)=>!d.classes.length&&!(d.blocks[0].marks||[]).length&&ls.includes('# keep')&&!ls.some(x=>/^cell\b/.test(x)));
const classPatch=['figdown 0.1 block','class hot "fill=old meaning" stroke=#111 # class tail','node a "A"'];
passBuilt('class update preserves declaration/comment and ignores key= in meaning',classPatch,editorCore.upsertClassDeclaration(classPatch.slice(),0,'hot',{meaning:'中文 fill=literal',fill:'#abcdef',style:'dashed'}),(d,ls)=>{const c=d.classes[0];return c.label==='中文 fill=literal'&&c.fill==='#abcdef'&&c.stroke==='#111'&&c.style==='dashed'&&ls[1].endsWith('# class tail');});
const extBase=['figdown 0.1 block','external x "Outside" # ext tail','node a "A"','edge x -> a # inbound','edge a -> x # outbound','layout','pin x at=(10,20) # pin tail','','figdown 0.1 table','table t "Keep"','| A |','|---|','| x |'];
const extSuffix=extBase.slice(8).join('\n');
passBuilt('external delete cascades declaration, exact connectors and pin in one section',extBase,editorCore.deleteExternalDeclaration(extBase.slice(),0,'x'),(d,ls)=>!d.boundaries.some(x=>x.id==='x')&&!d.edges.length&&!d.pins.x&&ls.join('\n').endsWith(extSuffix));
const extRename=['figdown 0.1 block','external x # ext tail','node a "A"','edge x -> a'];
passBuilt('external label insert preserves comment and connector',extRename,editorCore.rewriteExternalLabel(extRename.slice(),0,'x','外部 #1',false),(d,ls)=>d.boundaries[0].label==='外部 #1'&&d.edges[0].a==='x'&&ls[1].endsWith('# ext tail'));
const extInsert=['figdown 0.1 block','node a "A"','layout','pin a at=(1,2)'];
passBuilt('external add stays before the layout zone',extInsert,editorCore.insertExternalDeclaration(extInsert.slice(),0),(d,ls)=>d.boundaries.length===1&&ls.indexOf('external x1')<ls.indexOf('layout'));
const extBundle=['figdown 0.1 topology','external x "WAN"','node a "A"','node b "B"','edge a -- x','edge b -- x','edge a -- b','bundle uplinks a--x,b--x,a--b stroke=#111 # keep','layout','pin x at=(10,20)'];
passBuilt('external deletion rewrites topology bundle members before validation',extBundle,editorCore.deleteExternalDeclaration(extBundle.slice(),0,'x'),(d,ls)=>!d.boundaries.length&&d.edges.length===1&&d.edges[0].a==='a'&&d.edges[0].b==='b'&&d.trunks.length===1&&JSON.stringify(d.trunks[0].pairs)==='[["a","b"]]'&&ls.some(x=>x.includes('bundle uplinks a--b')&&x.endsWith('# keep')));
const groupBase=['figdown 0.1 block','group g "G" fill=#eee # group tail','group g2 "G2"','node a "in=g prose" in=g fill=#fff # node tail','node b "B" in=g2','layout','pin g at=(1,2) # group pin'];
passBuilt('ungroup preserves members/options/comments and exact non-member ids',groupBase,editorCore.ungroupDeclaration(groupBase.slice(),0,'g'),(d,ls)=>!d.groups.some(x=>x.id==='g')&&d.groups.some(x=>x.id==='g2')&&d.nodes.find(n=>n.id==='a').group===null&&d.nodes.find(n=>n.id==='b').group==='g2'&&ls.some(x=>x.includes('"in=g prose"')&&x.includes('fill=#fff')&&x.endsWith('# node tail'))&&!d.pins.g);
const groupDependent=['figdown 0.1 block','group g "G"','node a "A" in=g','threshold "Cap" in=g offset=50%'];
const dependentUngroup=editorCore.ungroupDeclaration(groupDependent.slice(),0,'g');
check('ungroup refuses a group still referenced by threshold/band with a concrete reason',
  dependentUngroup&&dependentUngroup.ok===false&&/threshold\/band/.test(dependentUngroup.error),JSON.stringify(dependentUngroup));
const idEnd=['figdown 0.1 block','node a_ "A"','node a_b "AB"','layout','pin a_ at=(1,2)','pin a_b at=(9,9)'];
passBuilt('id token-end matcher handles legal trailing underscore ids',idEnd,editorCore.upsertPin(idEnd.slice(),0,'a_',{at:'(3,4)'}),(d,ls)=>d.pins.a_.fx===3&&d.pins.a_b.fx===9&&ls.includes('pin a_b at=(9,9)'));
const inherited=['figdown 0.1 block','class hot "Hot" fill=#fee2e2 stroke=#111 style=dashed','node a "A" fill=#ffffff stroke=#222 style=dotted class=hot','flow right'].join('\n');
for(const key of ['fill','stroke','style']){
  const plan=editorCore.prepareGuiEdit(inherited,0,({lines})=>editorCore.rewriteOption(lines,0,'node','a',key,''),
    ({after})=>editorCore.declarationOptionAbsent(after,0,'node','a',key),{},1);
  check('Clear authored node '+key+' succeeds even when class supplies an effective value',plan.ok,plan.error);
  if(plan.ok){
    const parsed=engine.parse(plan.after);
    const rendered=parsed.errs.length?null:engine.render(parsed.doc,{title:true});
    check('Clear '+key+' keeps the inherited effective model valid',!parsed.errs.length&&rendered&&!(rendered.errs||[]).length&&parsed.doc.nodes[0][key]!==undefined,
      parsed.errs.concat(rendered&&rendered.errs||[]).join('; '));
  }
}
check('inspector shell and visible disabled reasons are present',html.includes('id="inspector"')&&html.includes('function inspectorDisabledReason(')&&html.includes('class="i-reason"'));
check('edge UI calls scanConnectorLine and creates UI-only hit targets',html.includes('const scan=scanConnectorLine(split.code,genre,version);')&&html.includes('data-edge-hit')&&html.includes("hit.removeAttribute('data-edge')"));
check('port squares are excluded from empty-canvas hit tests',occurrences(html.slice(html.indexOf('// 3. UI')),'[data-port-sq]')>=2);
check('bundle lassos are excluded from empty-canvas hit tests',occurrences(html.slice(html.indexOf('// 3. UI')),'[data-lasso]')>=2);
check('no-selection inspector exposes title, flow, class and external panels',html.includes("inspectorSection('Document title'")&&html.includes("inspectorSection('Classes'")&&html.includes("inspectorSection('External endpoints'"));
check('unsupported external control stays present and disabled',html.includes('id="iExtAdd" disabled aria-disabled="true"'));
check('multi-section DOM is marked UI-only and direct-edit handlers require section 0',html.includes('function markCanvasSections(sectionCount)')&&html.includes('function editableCanvasElement(el)')&&html.includes('if(!editable(edge)) return;'));

console.log('\nF. Batch-3/4 editor emitters and regression contracts');
const tableBase=[
  'figdown 0.1 table',
  'class warm "Warm" fill=#fee2e2',
  'class border "Border" stroke=#7f1d1d',
  'table t "多層表頭"',
  '| Group || Tail |',
  '| A | B | C |',
  '|---|---|---|',
  '| 1 | two | 3 |',
  '| x || z |',
  'cell (h1,1) fill=#aaaaaa # header mark',
  'cell (1,2) class=warm,border # data mark',
  'cell 2 highlight # row mark',
  'width auto,120,30% # widths',
  '',
  'figdown 0.1 block',
  'node keep "第二節"',
];
const tableSuffix=tableBase.slice(14).join('\n');
let tx=editorCore.setTableCellText(tableBase.slice(),0,'t','h2',2,'中|文\n次行');
passBuilt('table text edit supports CJK, escaped pipe and <br> while preserving later sections',tableBase,tx,(d,ls)=>{
  const t=d.blocks[0];
  return t.heads[1][1].v==='中|文\n次行'&&ls[5].includes('中\\|文<br>次行')&&ls.join('\n').endsWith(tableSuffix);
});
const mergedText=editorCore.setTableCellText(tableBase.slice(),0,'t','2',2,'not allowed');
check('merged continuation cell refuses direct text editing',mergedText&&mergedText.ok===false&&/merged continuation/.test(mergedText.error),JSON.stringify(mergedText));
let tc=editorCore.rewriteTableCellOption(tableBase.slice(),0,'t','h2',2,'class','warm,border');
passBuilt('table cell accepts ordered multi-class assignment',tableBase,tc,d=>{
  const m=d.blocks[0].marks.find(x=>x.hdr&&x.r===2&&x.c===2);
  return !!m&&m.cls.join(',')==='warm,border';
});
const tcClear=editorCore.rewriteTableCellOption(tc.lines.slice(),0,'t','h2',2,'class','');
passBuilt('table class Clear removes the authored key without dropping other marks',tc.lines,tcClear,(d,ls)=>{
  const m=d.blocks[0].marks.find(x=>x.hdr&&x.r===2&&x.c===2);
  return !m&&editorCore.tableCellOptionAbsent(ls.join('\n'),0,'t','h2',2,'class');
});
let tw=editorCore.setTableWidths(tableBase.slice(),0,'t','auto,80,25%');
passBuilt('table width editor accepts auto|number|n% and keeps the comment',tableBase,tw,(d,ls)=>{
  return JSON.stringify(d.blocks[0].width.vals)===JSON.stringify([{t:'auto'},{t:'px',v:80},{t:'pct',v:25}])&&
    ls.some(x=>x==='width auto,80,25% # widths');
});
const badTw=editorCore.setTableWidths(tableBase.slice(),0,'t','auto,20%');
check('table width count mismatch is refused before mutation',badTw&&badTw.ok===false&&/expected 3/.test(badTw.error),JSON.stringify(badTw));
let tr=editorCore.insertTableRow(tableBase.slice(),0,'t',1);
passBuilt('table row insert reindexes downstream row marks and preserves header addresses',tableBase,tr,(d,ls)=>{
  const t=d.blocks[0];
  return t.rows.length===3&&t.rowmarks.some(x=>x.r===3)&&
    t.marks.some(x=>!x.hdr&&x.r===1&&x.c===2)&&ls.join('\n').endsWith(tableSuffix);
});
let tic=editorCore.insertTableColumn(tableBase.slice(),0,'t',2);
passBuilt('table column insert reindexes marks, extends widths and preserves zero colspan segments',tableBase,tic,(d,ls)=>{
  const t=d.blocks[0],rows=ls.filter(x=>/^\|/.test(x));
  return t.cols.length===4&&t.width.vals.length===4&&t.marks.some(x=>!x.hdr&&x.r===1&&x.c===2)&&
    rows.some(x=>/^\| x \|\|  \| z \|$/.test(x));
});
let tdc=editorCore.deleteTableColumn(tableBase.slice(),0,'t',2);
passBuilt('table column delete drops exact marks, shifts later addresses and trims widths',tableBase,tdc,(d,ls)=>{
  const t=d.blocks[0];
  return t.cols.length===2&&t.width.vals.length===2&&!t.marks.some(x=>!x.hdr&&x.r===1&&x.c===2)&&
    ls.some(x=>x==='# data mark');
});
const oneCol=['figdown 0.1 table','table t "T"','| H |','|---|','| x |'];
const lastCol=editorCore.deleteTableColumn(oneCol.slice(),0,'t',1);
check('deleting the final table column is refused concretely',lastCol&&lastCol.ok===false&&/last table column/.test(lastCol.error),JSON.stringify(lastCol));
const rowHighlightBase=tableBase.filter(x=>!x.startsWith('cell (1,2) '));
const trh=editorCore.setTableRowHighlight(rowHighlightBase.slice(),0,'t',1,true);
passBuilt('data-row highlight is inserted through the table transaction helper',rowHighlightBase,trh,d=>d.blocks[0].rowmarks.some(x=>x.r===1));
// The insert above pushes no `cell (r,c)` past the insertion point — its only
// data mark is on row 1 and the row lands after it — so the CELL half of the
// renumbering was asserted by a case that could not fail. Inserting at the top
// is the case that moves it: without the cell arm the mark stays on row 1 and
// paints the row the author did not mark.
let trTop=editorCore.insertTableRow(tableBase.slice(),0,'t',0);
passBuilt('table row insert at the top renumbers the cell marks it displaced',tableBase,trTop,(d,ls)=>{
  const t=d.blocks[0];
  return t.rows.length===3&&t.marks.some(x=>!x.hdr&&x.r===2&&x.c===2)&&!t.marks.some(x=>!x.hdr&&x.r===1)&&
    t.marks.some(x=>x.hdr&&x.r===1&&x.c===1)&&t.rowmarks.some(x=>x.r===3)&&
    ls.some(x=>x==='cell (2,2) class=warm,border # data mark');
});
// Row deletion had no assertion at all: the row it removes owns marks, the
// rows after it move, and both are references the engine will refuse if they
// name a row that no longer exists.
const delRowBase=tableBase.filter(x=>!x.startsWith('cell 2 highlight')).concat();
let tdr=editorCore.deleteTableRow(delRowBase.slice(),0,'t',1);
passBuilt('table row delete drops that row\'s own marks and renumbers the rows after it',delRowBase,tdr,(d,ls)=>{
  const t=d.blocks[0];
  return t.rows.length===1&&!t.marks.some(x=>!x.hdr&&x.r===2)&&t.marks.some(x=>x.hdr&&x.r===1&&x.c===1)&&
    !ls.some(x=>/^cell \(1,2\)/.test(x))&&ls.some(x=>x==='# data mark');
});
const delRowMissing=editorCore.deleteTableRow(tableBase.slice(),0,'t',9);
check('deleting a row that does not exist is refused concretely',
  delRowMissing&&delRowMissing.ok===false&&/data row 9/.test(delRowMissing.error),JSON.stringify(delRowMissing));
// A dropped line takes its code and leaves its comment: the comment is the
// author's prose, and no structural edit is licensed to delete it.
const dropBase=['figdown 0.1 table','table t "T"','| A |','|---|','| 1 |','width 40 # keep me'];
const dropped=editorCore.setTableWidths(dropBase.slice(),0,'t','');
passBuilt('dropping a directive line keeps the comment that annotated it',dropBase,dropped,(d,ls)=>
  !d.blocks[0].width&&ls.some(x=>x==='# keep me'));
const badWidthToken=editorCore.setTableWidths(dropBase.slice(),0,'t','12px');
check('a width value the grammar has no spelling for is refused before mutation',
  badWidthToken&&badWidthToken.ok===false&&/12px/.test(badWidthToken.error),JSON.stringify(badWidthToken));

const bitBase=[
  'figdown 0.1 bitfield',
  'class warm "Warm" fill=#fee2e2',
  'class border "Border" stroke=#7f1d1d',
  'bitfield bf "Bits" word=16 numbering=msb0',
  'field "Classic fill=literal" 4 fill=#ffffff class=warm,border description="desc" present="" # classic tail',
  'field A:2,"B B":2,C:4 fill=#dddddd description="line" present="C = 1" # compact tail',
  'break # forced',
  'field "Last" 8',
  '',
  'figdown 0.1 block',
  'node keep "第二節"',
];
const bitSuffix=bitBase.slice(9).join('\n');
let bn=editorCore.rewriteClassicFieldName(bitBase.slice(),0,'bf',5,'中文 fill=new # literal');
passBuilt('classic bitfield rename is quote-aware and preserves options/comment',bitBase,bn,(d,ls)=>{
  const f=d.blocks[0].fields[0];
  return f.name==='中文 fill=new # literal'&&f.present===''&&f.description==='desc'&&ls[4].endsWith('# classic tail');
});
let bw=editorCore.rewriteClassicFieldWidth(bitBase.slice(),0,'bf',5,'*');
passBuilt('classic field * writes the row-remainder model',bitBase,bw,d=>d.blocks[0].fields[0].w==='*');
const zeroWidth=editorCore.rewriteClassicFieldWidth(bitBase.slice(),0,'bf',5,'0');
check('field width zero is refused before mutation',zeroWidth&&zeroWidth.ok===false&&/positive integer/.test(zeroWidth.error),JSON.stringify(zeroWidth));
let bcn=editorCore.rewriteCompactFieldItem(bitBase.slice(),0,'bf',6,1,{name:'新 名'});
passBuilt('compact item rename preserves siblings and line-wide options',bitBase,bcn,(d,ls)=>{
  const fs=d.blocks[0].fields.filter(x=>x.line===6);
  return fs.map(x=>x.name).join('|')==='A|新 名|C'&&fs.every(x=>x.present==='C = 1')&&ls[5].endsWith('# compact tail');
});
let bcw=editorCore.rewriteCompactFieldItem(bitBase.slice(),0,'bf',6,2,{width:'*'});
passBuilt('compact item * sets the selected item only',bitBase,bcw,d=>{
  const fs=d.blocks[0].fields.filter(x=>x.line===6);return fs[2].w==='*'&&fs[0].w===2&&fs[1].w===2;
});
let bp=editorCore.rewriteFieldOption(bitBase.slice(),0,'bf',5,'present','"C = 1"');
passBuilt('present condition state writes a quoted condition',bitBase,bp,d=>d.blocks[0].fields[0].present==='C = 1');
bp=editorCore.rewriteFieldOption(bp.lines.slice(),0,'bf',5,'present','""');
passBuilt('present explicit-empty state remains distinct',bp.lines,bp,d=>d.blocks[0].fields[0].present==='');
const bpClear=editorCore.rewriteFieldOption(bp.lines.slice(),0,'bf',5,'present','');
passBuilt('present absent state removes the authored option',bp.lines,bpClear,(d,ls)=>d.blocks[0].fields[0].present===undefined&&editorCore.fieldOptionAbsent(ls.join('\n'),0,'bf',5,'present'));
let bd=editorCore.rewriteFieldOption(bitBase.slice(),0,'bf',5,'description','"新的 描述 #1"');
passBuilt('field description uses quoted FigDown string encoding',bitBase,bd,d=>d.blocks[0].fields[0].description==='新的 描述 #1');
let badd=editorCore.addBitfieldField(bitBase.slice(),0,'bf');
passBuilt('bitfield add field appends in declaration order and preserves later sections',bitBase,badd,(d,ls)=>d.blocks[0].fields.some(f=>f.name==='Field'&&f.w===8)&&ls.join('\n').endsWith(bitSuffix));
const badBreak=editorCore.addBitfieldBreak(['figdown 0.1 bitfield','bitfield bf "B" word=8 numbering=msb0','field "A" 8','break'],0,'bf');
check('break without a preceding field is left to engine validation and rejected',badBreak&&badBreak.ok&&engine.parse(badBreak.lines.join('\n')).errs.some(x=>/no preceding field/.test(x)));
const secondStar=editorCore.rewriteClassicFieldWidth(['figdown 0.1 bitfield','bitfield bf "B" word=8 numbering=msb0','field "A" *','field "B" 2'],0,'bf',4,'*');
check('a second * is emitted then rejected by the engine transaction',secondStar&&secondStar.ok&&engine.parse(secondStar.lines.join('\n')).errs.some(x=>/only one \*/.test(x)));
let bmove=editorCore.moveBitfieldLine(bitBase.slice(),0,'bf',5,1);
passBuilt('bitfield up/down moves one source line and returns its new local identity',bitBase,bmove,(d,ls)=>{
  const order=d.blocks[0].fields.filter(x=>!x.wrap).map(x=>x.name);return bmove.line===6&&order[0]==='A'&&order.includes('Classic fill=literal');
});
let bdel=editorCore.deleteBitfieldItem(bitBase.slice(),0,'bf',6,1);
passBuilt('compact item delete preserves the remaining items and comment',bitBase,bdel,(d,ls)=>{
  const fs=d.blocks[0].fields.filter(x=>x.line===6);return fs.map(x=>x.name).join('|')==='A|C'&&ls[5].endsWith('# compact tail');
});
// backlog 74 (DESIGN-ARTIFACT-DRIFT-DETECTION) — a raw control character is LEGAL in a FigDown string
// and ILLEGAL in a JSON one, so the field-option postcondition must be
// answered in the grammar that governs the bytes. The value below is exactly
// what the inspector hands `opt`: quoted, and escaped by the editor's own
// `escapeFdString`, whose escape set is `\`, `"` and newline only.
const tabValue='"'+editorCore.escapeFdString('a\tb')+'"';
let jsonThrew=false; try{ JSON.parse(tabValue); }catch(e){ jsonThrew=true; }
check('backlog 74 premise: the value the editor writes is legal FigDown and illegal JSON',
  jsonThrew&&tabValue==='"a\tb"',JSON.stringify(tabValue));
const bTab=editorCore.rewriteFieldOption(bitBase.slice(),0,'bf',5,'description',tabValue);
passBuilt('a TAB inside description= is written correctly and read back by the engine',
  bitBase,bTab,d=>d.blocks[0].fields[0].description==='a\tb');
check('field-option postcondition accepts the write the grammar accepts (no JSON round-trip)',
  editorCore.fieldOptionWritten(bTab.lines.join('\n'),0,'bf',5,'description',tabValue)===true,
  bTab&&bTab.lines&&bTab.lines[4]);
// Falsifiability, both directions: a value that was NOT written must be
// refused, and an option that is absent must be refused. Without these the
// check would pass against a `return true`.
check('field-option postcondition is falsifiable by a value that was not written',
  editorCore.fieldOptionWritten(bTab.lines.join('\n'),0,'bf',5,'description','"other"')===false&&
  editorCore.fieldOptionWritten(bTab.lines.join('\n'),0,'bf',5,'present','"nope"')===false);
check('field-option postcondition still holds for the ordinary unquoted keys',
  editorCore.fieldOptionWritten(bitBase.join('\n'),0,'bf',5,'class','warm,border')===true&&
  editorCore.fieldOptionWritten(bitBase.join('\n'),0,'bf',5,'fill','#ffffff')===true);
// Scoped to the inspector rather than the whole file: `fieldOptionWritten`'s
// own header comment names the defect it replaced, and a file-wide string
// search would read that sentence as the defect.
check('the JSON round-trip is gone from the bitfield inspector (backlog 74)',
  !uiFunction('buildBitfieldInspector').includes('JSON.parse')&&
  uiFunction('buildBitfieldInspector').includes('fieldOptionWritten(after,sectionIndex,block.id,a.line,key,value)'));

// backlog 75 (DESIGN-ARTIFACT-DRIFT-DETECTION) — the toolbar's `+ Row`/`+ Col` act on the table the
// SELECTION names. `tableActionTarget` is pure so the choice is exercisable
// here; before the fix both actions called `firstTypedBlock` and this first
// check returned `t1`.
const twoTables=['figdown 0.1 table','table t1 "One"','| A | B |','|---|---|','| 1 | 2 |','','table t2 "Two"','| C |','|---|','| 3 |'];
const twoDoc=engine.parse(twoTables.join('\n')).doc;
const cellInT2={sectionIndex:0,kind:'cell',id:editorCore.tableCellId('t2','1',1)};
check('toolbar table target follows the selected cell to the SECOND table',
  editorCore.tableActionTarget(twoDoc,cellInT2).id==='t2',
  JSON.stringify(editorCore.tableActionTarget(twoDoc,cellInT2).id));
check('toolbar table target falls back to the first table when nothing is selected',
  editorCore.tableActionTarget(twoDoc,null).id==='t1');
check('toolbar table target falls back when the selection names a table that is gone',
  editorCore.tableActionTarget(twoDoc,{sectionIndex:0,kind:'cell',id:editorCore.tableCellId('gone','1',1)}).id==='t1');
// The mutation the transaction makes and the postcondition that checks it must
// name the SAME table: appending to `t2` while verifying `t1` would refuse a
// correct edit, which is the old code's second, hidden half.
const appendT2=editorCore.insertTableRow(twoTables.slice(),0,'t2',1);
passBuilt('append to the second table adds a row THERE and leaves the first alone',
  twoTables,appendT2,d=>{
    const t1=d.blocks.find(x=>x.id==='t1'),t2=d.blocks.find(x=>x.id==='t2');
    return t1.rows.length===1&&t2.rows.length===2;
  });
check('both toolbar table actions consult the selection and verify by block id',
  occurrences(html,"tableActionTarget(lastDoc,oneSelected('cell'))")===2&&
  occurrences(html,"const nt=(parsed.docs[0].blocks||[]).find(x=>x.type==='table'&&x.id===t.id);")===2&&
  !/const nt=firstTypedBlock\(parsed\.docs\[0\],'table'\)/.test(html));

const budget=editorCore.bitfieldBudget(engine.parse(bitBase.slice(0,8).join('\n')).doc.blocks[0]);
check('bitfield budget reports declared bits, word, rows and last-row usage',
  JSON.stringify(budget)===JSON.stringify({declared:20,remainder:false,rows:2,last:8,word:16,rowFields:true}),JSON.stringify(budget));

const moveBase=['figdown 0.1 block','node a "A"','node b "B"','node c "C"'];
const moveBuilt=editorCore.moveNodeLineSource(moveBase.slice(),0,'b',1,true);
const moveParsed=engine.parse(moveBuilt.lines.join('\n'));
check('§2.2 moveNodeLine regression: b moves from a,b,c to a,c,b',
  moveBuilt.ok&&moveParsed.doc.nodes.map(x=>x.id).join(',')==='a,c,b'&&editorCore.moveNodeOrderMatches(moveParsed,0,'b',moveBuilt),
  moveBuilt.lines&&moveBuilt.lines.join('\n'));
const weakened=Object.assign({},moveBuilt,{expectedIndex:1});
check('§2.2 order postcondition is falsifiable by a weakened expected index',
  editorCore.moveNodeOrderMatches(moveParsed,0,'b',weakened)===false,JSON.stringify(weakened));

const named=['figdown 0.5 block','node a "A"','node b "B"','edge a -> b id=e1 # named'];
let namedEdit=editorCore.rewriteConnectorLabel(named.slice(),0,'e1','mid','Named');
passBuilt('0.5 named connector keeps authored id through scanner-based editing',named,namedEdit,(d,ls)=>d.edges[0].id==='e1'&&d.edges[0].mid==='Named'&&ls[3].endsWith('# named'));
check('nextFreeId includes named connector ids in the shared namespace',
  editorCore.nextFreeId(['figdown 0.5 block','node n1','node a','edge a -> n1 id=n2'],'n',0).id==='n3');
const ctx05=editorCore.sourceLineContexts(['figdown 0.5 block','edge a -> b id=e1']);
const ctx04=editorCore.sourceLineContexts(['figdown 0.4 block','edge a -> b id=e1']);
check('source highlight uses registry/version context for 0.5 id=',/tok-key[^>]*>id=/.test(editorCore.sourceHighlightLine('edge a -> b id=e1',ctx05[1])));
check('source highlight leaves 0.4 id= unhighlighted',!/tok-key[^>]*>id=/.test(editorCore.sourceHighlightLine('edge a -> b id=e1',ctx04[1])));
check('source highlight escapes CJK/HTML and leaves pipe rows verbatim',
  editorCore.sourceHighlightLine('node a "<中文&>"',ctx05[0]).includes('&lt;中文&amp;&gt;')&&
  !/tok-/.test(editorCore.sourceHighlightLine('| <b> |',ctx05[0])));
check('source gutter/highlight shell and paint hook cover success and both error exits',
  html.includes('id="sourceGutter"')&&html.includes('id="sourceHighlight"')&&occurrences(uiFunction('refresh'),'paintSource(')===3);
check('table/bitfield GUI, multi-select, Ctrl+D and smart-guide entry points are wired',
  html.includes('function buildTableInspector(')&&html.includes('function buildBitfieldInspector(')&&
  html.includes("e.key.toLowerCase()==='d'")&&html.includes('function startNodeDrag(')&&
  html.includes("querySelectorAll('[data-node]')")&&html.includes("ev.target.closest('[data-node],[data-group],[data-edge-hit],[data-port-sq],[data-lasso]"));
check('named connector hit identity stays a raw string',html.includes("id:hit.dataset.edgeHit")&&!html.includes("id:+hit.dataset.edgeHit"));
// A reorder renames every row between the two ends, not just the two. The map
// is what keeps the selected row selected when another row crosses it, and
// without an assertion it can be dropped without anything turning red.
const dnd=editorCore.moveBitfieldLineBefore(
  ['figdown 0.1 bitfield','bitfield bf "B" word=8 numbering=msb0','field "a" 2','field "b" 3','field "c" 3'],0,'bf',3,5,true);
check('bitfield reorder returns the whole old-line to new-line map',
  !!dnd&&dnd.ok===true&&JSON.stringify(dnd.lineMap)===JSON.stringify({3:5,4:3,5:4})&&
  engine.parse(dnd.lines.join('\n')).doc.blocks[0].fields.map(f=>f.name).join(',')==='b,c,a',
  JSON.stringify(dnd&&{lineMap:dnd.lineMap,error:dnd.error}));
// §4's two named boundaries. A selection is one section's, and the guides snap
// to NODES: `[data-port-sq]` and `[data-lasso]` are engine ink, and a widened
// candidate selector would align a node to a fitting.
check('additive selection refuses to cross a section boundary',
  html.includes("if(additive&&selection.length&&selection.some(x=>x.sectionIndex!==item.sectionIndex)){")&&
  /failEdit\('a selection cannot cross sections'\)/.test(html));
check('smart-guide candidates are node boxes only',
  /const others=\[\.\.\.root\.querySelectorAll\('\[data-node\]'\)\]/.test(html));
// A drag whose selection was refused, or that resolved no box, must leave the
// document alone: reaching the pin path with an empty override set pinned the
// whole section and wrote a `flow` line the pointer never asked for.
check('a drag that resolved no node box writes nothing',
  html.includes("if(!wasSelected&&setSelection({sectionIndex:0,kind:'node',id},ev.shiftKey)===false) return;")&&
  /if\(!boxes\.length\) return failEdit\('drag: /.test(html));
// Backlog 71: the engine now addresses EVERY header tier through data-cell
// (renderTable), not just the bottom one, so the UI reads that channel
// directly instead of scraping the caption ink and zipping it against the
// model's anchor order. Render a real two-tier table and check the upper
// tier's anchors carry `data-cell="tt:h1:c"` — merged continuations (col 2
// under "Group A", col 4 under "Group B") must still carry nothing — while
// the bottom tier keeps its historical `:0:` spelling and the data row is
// `:1:`. This is mutation-sensitive: reverting renderTable's `addrR` to the
// old `(r===H-1?0:null)` drops the h1 attributes and turns this red.
const T71 = ['figdown 0.1 table','table tt "T"',
  '| Group A || Group B ||','| P | Q | R | S |','|---|---|---|---|','| 1 | 2 | 3 | 4 |'].join('\n');
const t71p = engine.parse(T71);
if (t71p.errs.length) fail('backlog-71 fixture fails to parse: '+t71p.errs.join('; '));
const t71svg = t71p.errs.length ? '' : (engine.render(t71p.doc,{title:true}).svg||'');
check('engine addresses the upper header tier through data-cell (backlog 71)',
  /data-cell="tt:h1:1"/.test(t71svg) && /data-cell="tt:h1:3"/.test(t71svg) &&
  !/data-cell="tt:h1:2"/.test(t71svg) && !/data-cell="tt:h1:4"/.test(t71svg) &&
  /data-cell="tt:0:1"/.test(t71svg) && /data-cell="tt:0:4"/.test(t71svg) &&
  /data-cell="tt:1:1"/.test(t71svg),
  t71svg.slice(0,600));
// The editor's UI-cell re-spelling reads that channel only — no caption/rect
// scrape, and no separate agreement guard, because there is nothing left to
// disagree with.
check('installTableCellAddresses reads data-cell only — the caption scrape is gone',
  html.includes("for(const el of root.querySelectorAll('[data-cell]')){") &&
  html.includes("rowTok=parts[1]==='0'?'h'+H:parts[1]") &&
  !html.includes('tableCaptionElements') &&
  !/font-size="13"\]\[font-weight="600"/.test(html));

console.log('\nD. connector scanner (scanConnectorLine — one grammar, two callers)');
// The battery is the request's own hard cases plus the ones the grammar has
// paid for before: bracket nesting (VERBATIM-REGION-SCOPE), a quoted bracket, the three string
// escapes, an operator written with no spaces around it, `#` inside a label
// `--` inside an identifier (LINK-OPERATOR-IN-IDS), all four connector spellings
// under the genre and version that spells them, and an absent label against a
// written one. Each row names the smallest document that gives the line its
// referents, so the SCAN can be compared against the PARSE of the same text.
const B_BLOCK = ['figdown 0.1 block', 'node a "A"', 'node b "B"', 'node a-b "AB"', 'node x-y "XY"', '@'];
const B_FLOW  = ['figdown 0.2 flowchart', 'node a "A"', 'node b "B"', '@'];
const B_STATE = ['figdown 0.2 statechart', 'state s1 "S1"', 'state s2 "S2"', '@'];
const B_SEQ   = ['figdown 0.4 sequence', 'lifeline a "A"', 'lifeline b "B"', '@'];
const SCANS = [
  { what: 'absent labels are null, not empty',
    code: 'edge a -> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:null, head:null } },
  { what: 'all three labels written',
    code: 'edge a [tail] -[mid]-> [head] b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:'tail', mid:'mid', head:'head' } },
  { what: '-- inside identifiers, operator with no spaces (LINK-OPERATOR-IN-IDS)',
    code: 'edge a-b--x-y', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a-b', b:'x-y', op:'--', tail:null, mid:null, head:null } },
  { what: 'nested brackets in a mid-label (VERBATIM-REGION-SCOPE)',
    code: 'edge a -[flags[3:0]]-> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'flags[3:0]', head:null } },
  { what: 'nested brackets in an endpoint label',
    code: 'edge a [flags[3:0]] -> [q[0]] b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:'flags[3:0]', mid:null, head:'q[0]' } },
  { what: '# inside a label is not a comment',
    code: 'edge a -[hop #1]-> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'hop #1', head:null } },
  { what: 'quoted label carrying an unbalanced bracket',
    code: 'edge a ["x]y"] -> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:'x]y', mid:null, head:null } },
  { what: 'escaped quote inside a quoted label',
    code: 'edge a -["say \\"hi\\""]-> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'say "hi"', head:null } },
  { what: 'escaped backslash inside a quoted label',
    code: 'edge a -["c:\\\\dir"]-> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'c:\\dir', head:null } },
  { what: 'escaped newline inside a quoted label',
    code: 'edge a -["two\\nlines"]-> b', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'two\nlines', head:null } },
  { what: '<-> written with no spaces, plus an option region',
    code: 'edge a<->b style=dashed stroke=#0d9488', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'<->', tail:null, mid:null, head:null } },
  { what: 'leading and trailing whitespace, offsets account for it',
    code: '  edge a <- b  ', genre: 'block', ver: '0.1', doc: B_BLOCK,
    expect: { a:'a', b:'b', op:'<-', tail:null, mid:null, head:null } },
  { what: 'flowline under flowchart 0.2 (GENRE-CONNECTOR-SPELLING/GENRE-NODE-SPELLING)',
    code: 'flowline a -[yes]-> b', genre: 'flowchart', ver: '0.2', doc: B_FLOW,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:'yes', head:null } },
  { what: 'edge under flowchart 0.1 — the version that still spells it so',
    code: 'edge a -> b', genre: 'flowchart', ver: '0.1',
    doc: ['figdown 0.1 flowchart', 'node a "A"', 'node b "B"', '@'],
    expect: { a:'a', b:'b', op:'->', tail:null, mid:null, head:null } },
  { what: 'transition under statechart 0.2',
    code: 'transition s1 -[ev / act]-> s2', genre: 'statechart', ver: '0.2', doc: B_STATE,
    expect: { a:'s1', b:'s2', op:'->', tail:null, mid:'ev / act', head:null } },
  { what: 'message under sequence 0.4, trailing label lives in the option span',
    code: 'message a -> b "Hello"', genre: 'sequence', ver: '0.4', doc: B_SEQ,
    expect: { a:'a', b:'b', op:'->', tail:null, mid:null, head:null } },
  { what: 'message with endpoint labels and an inline mid label',
    code: 'message a [t] -[SYN]-> [h] b', genre: 'sequence', ver: '0.4', doc: B_SEQ,
    expect: { a:'a', b:'b', op:'->', tail:'t', mid:'SYN', head:'h' } },
  { what: 'no genre named — any of the four spellings scans',
    code: 'transition s1 -> s2', genre: undefined, ver: undefined, doc: null,
    expect: { a:'s1', b:'s2', op:'->', tail:null, mid:null, head:null } },
];
// The refusals: each must come back as `{ok:false, error}` — never a throw,
// never a half-filled result a caller could mistake for a scan.
const SCAN_ERRS = [
  { what: 'a non-connector line', code: 'node a "A"', genre: 'block', ver: '0.1', re: /not a connector line/ },
  { what: 'a blank line', code: '', genre: 'block', ver: '0.1', re: /not a connector line/ },
  { what: 'a keyword prefix that is not the keyword', code: 'edgeless a -> b', genre: 'block', ver: '0.1', re: /not a connector line/ },
  { what: 'an empty [label] is not an absent one', code: 'edge a [] -> b', genre: 'block', ver: '0.1', re: /empty \[label\]/ },
  { what: 'an unterminated [label]', code: 'edge a -[x-> b', genre: 'block', ver: '0.1', re: /unterminated \[label\]/ },
  { what: 'an unknown escape in a quoted label', code: 'edge a -["x\\qy"]-> b', genre: 'block', ver: '0.1', re: /unknown escape/ },
  { what: 'a missing operator', code: 'edge a b', genre: 'block', ver: '0.1', re: /needs an operator/ },
  { what: 'a missing target id', code: 'edge a ->', genre: 'block', ver: '0.1', re: /needs a target id/ },
  { what: 'a quoted endpoint (QUOTED-IDS/RULE-POSITION-ENUMERATION)', code: 'edge "a" -> b', genre: 'block', ver: '0.1', re: /ids are bare/ },
  { what: "the wrong genre's word", code: 'flowline a -> b', genre: 'block', ver: '0.1', re: /is not the word genre block uses/ },
  { what: "the right word at the wrong version", code: 'flowline a -> b', genre: 'flowchart', ver: '0.1', re: /requires figdown 0\.2/ },
  { what: 'a genre with no connector at all', code: 'edge a -> b', genre: 'table', ver: '0.1', re: /is not allowed in genre table/ },
  { what: 'a non-string argument', code: null, genre: 'block', ver: '0.1', re: /must be a string/ },
];
const SPAN_ORDER = ['a', 'tail', 'connector', 'head', 'b', 'options'];
// Reassembly: walk the flat spans in source order, refusing any that runs
// backwards or overlaps its predecessor, and glue the gaps back in. `mid` is
// deliberately not in the walk — it is the one span nested inside another
// (`-[x]->` is one operator) and is checked against `connector` separately.
function reassemble(code, spans) {
  let out = '', at = 0;
  for (const k of SPAN_ORDER) {
    const s = spans[k];
    if (!s) continue;
    if (typeof s.start !== 'number' || typeof s.end !== 'number') return { bad: k + ' span is not numeric' };
    if (s.start < at) return { bad: k + ' span starts at ' + s.start + ', before the previous span ended at ' + at };
    if (s.end < s.start || s.end > code.length) return { bad: k + ' span [' + s.start + ',' + s.end + ') is out of range' };
    const gap = code.slice(at, s.start);
    if (!/^\s*$/.test(gap) && k !== 'a') return { bad: 'the gap before the ' + k + ' span is not whitespace: ' + JSON.stringify(gap) };
    out += gap + code.slice(s.start, s.end);
    at = s.end;
  }
  return { text: out + code.slice(at) };
}
for (const t of SCANS) {
  let r;
  try { r = engine.scanConnectorLine(t.code, t.genre, t.ver); }
  catch (e) { fail('scan threw on "' + t.code + '"\n      ' + (e && e.stack || e)); continue; }
  if (!r || r.ok !== true) { fail(t.what + ' — scan refused "' + t.code + '": ' + (r && r.error)); continue; }
  let bad = null;
  for (const k of ['a', 'b', 'op', 'tail', 'mid', 'head'])
    if (r[k] !== t.expect[k]) bad = k + ' is ' + JSON.stringify(r[k]) + ', expected ' + JSON.stringify(t.expect[k]);
  // absent versus written: a null field has no span, a written one has one.
  for (const k of ['tail', 'mid', 'head'])
    if ((r[k] === null) !== (r.spans[k] === undefined))
      bad = bad || k + ' disagrees with its span about being written';
  // (a) the spans reassemble the exact input.
  const re = reassemble(t.code, r.spans);
  if (re.bad) bad = bad || re.bad;
  else if (re.text !== t.code) bad = bad || 'reassembly differs from the input';
  // the slices say what the fields say.
  const slice = (k) => t.code.slice(r.spans[k].start, r.spans[k].end);
  if (slice('a') !== r.a) bad = bad || 'the a span does not cut out "' + r.a + '"';
  if (slice('b') !== r.b) bad = bad || 'the b span does not cut out "' + r.b + '"';
  for (const k of ['tail', 'mid', 'head'])
    if (r.spans[k] && !(slice(k).startsWith('[') && slice(k).endsWith(']')))
      bad = bad || 'the ' + k + ' span does not cover its brackets: ' + JSON.stringify(slice(k));
  if (r.mid === null && slice('connector') !== r.op)
    bad = bad || 'the connector span cuts out ' + JSON.stringify(slice('connector')) + ', not the operator ' + r.op;
  if (r.mid !== null && !(r.spans.mid.start > r.spans.connector.start && r.spans.mid.end < r.spans.connector.end))
    bad = bad || 'the mid span is not inside the connector span';
  // (c) the option region starts at endpoint b's last byte.
  if (r.spans.options.start !== r.spans.b.end)
    bad = bad || 'the option span starts at ' + r.spans.options.start + ', not at endpoint b\'s end ' + r.spans.b.end;
  if (r.spans.options.end !== t.code.length)
    bad = bad || 'the option span does not run to the end of the line';
  if (r.keyword !== t.code.trim().split(/\s|[-<[]/)[0])
    bad = bad || 'keyword is ' + JSON.stringify(r.keyword);
  // (b) the scanned fields agree with the PARSED model for the same line.
  if (t.doc) {
    const p = engine.parse(t.doc.map(l => (l === '@' ? t.code : l)).join('\n'));
    if (p.errs.length) bad = bad || 'the parser rejects the same line: ' + p.errs.join('; ');
    else {
      const m = (p.doc.edges[0] || p.doc.messages[0]);
      if (!m) bad = bad || 'the parser recorded no connector for the line';
      else {
        for (const k of ['a', 'b', 'op', 'tail', 'head'])
          if (m[k] !== r[k]) bad = bad || 'model.' + k + ' is ' + JSON.stringify(m[k]) + ', scan says ' + JSON.stringify(r[k]);
        // An `edge` records `mid`. A `message` records ONE `label` fed by
        // either spelling: the inline `-[x]->`, which the scanner
        // reads, or a trailing quoted positional, which lives in the option
        // region the scanner deliberately does not interpret. Both readings
        // are checked — the second by requiring the text to be inside the
        // option span, which is the promise that span makes.
        if ('mid' in m) {
          if (m.mid !== r.mid) bad = bad || 'model.mid is ' + JSON.stringify(m.mid) + ', scan says ' + JSON.stringify(r.mid);
        } else if (r.mid !== null) {
          if (m.label !== r.mid) bad = bad || 'model.label is ' + JSON.stringify(m.label) + ', scan read the inline mid-label ' + JSON.stringify(r.mid);
        } else if (m.label !== null && m.label !== undefined) {
          const optSlice = t.code.slice(r.spans.options.start);
          if (!optSlice.includes(JSON.stringify(m.label)))
            bad = bad || 'the trailing message label ' + JSON.stringify(m.label) + ' is not inside the option span';
        }
      }
    }
  }
  if (bad) fail(t.what + '  [' + t.code + ']\n      ' + bad);
  else console.log('ok    ' + t.what + '  ->  ' + JSON.stringify(t.code));
}
for (const t of SCAN_ERRS) {
  let r;
  try { r = engine.scanConnectorLine(t.code, t.genre, t.ver); }
  catch (e) { fail('scan THREW instead of returning an error for ' + t.what + '\n      ' + (e && e.stack || e)); continue; }
  if (!r || r.ok !== false) { fail(t.what + ' — expected {ok:false}, got ' + JSON.stringify(r)); continue; }
  if (typeof r.error !== 'string' || !t.re.test(r.error)) { fail(t.what + ' — error does not match ' + t.re + ': ' + r.error); continue; }
  if (r.spans !== undefined) { fail(t.what + ' — a refused scan must carry no spans'); continue; }
  console.log('ok    refused: ' + t.what);
}
// The single-grammar rule itself: the parser must READ the scanner, not carry a
// second copy of it. If `parseEdgeLine` ever grows its own tokenizer again this
// occurrence check is what says so.
check('parseEdgeLine routes through the shared scanner',
  html.includes('const sc=scanConnector(s,kw);') && html.includes('function scanConnector(s,kw){'));
check('scanConnectorLine is defined in the engine region, before the UI section',
  html.indexOf('function scanConnectorLine(') > html.indexOf('const SHAPES') &&
  html.indexOf('function scanConnectorLine(') < html.indexOf('\n// 3. UI'));
check('the genre/version connector word is spelled once',
  occurrences(html, 'const connectorWordError=(surf,genre,version)=>{') === 1 &&
  occurrences(html, 'connectorWordError(') === 2);

const ap = engine.parse(after);
const ar = ap.errs.length ? null : engine.render(ap.doc,{title:true});
Promise.all(ar && ar.svg ? [svgArtifact(after,ar.svg),svgArtifact(after,ar.svg)] : [null,null])
  .then(([a1,a2])=>{
    check('artifact parses/renders', !!a1 && !(ar.errs&&ar.errs.length), (ar&&ar.errs||[]).join('; '));
    check('artifact is byte-deterministic across two calls', a1 === a2);
    const uiStart = html.indexOf('// 3. UI');
    check('UI suffix contains no prompt(', !html.slice(uiStart).includes('prompt('));
    check('section-aware selection shape is present', html.includes("{sectionIndex:0,kind:'node',id}"));
    check('GUI commits push exactly one before snapshot', html.includes('undoStack.push(before);'));
    console.log('\n' + (fails ? fails + ' failure(s)' : 'all editor checks passed'));
    if (fails && strict) process.exit(1);
  })
  .catch(e=>{
    fail('artifact check threw\n      '+(e&&e.stack||e));
    console.log('\n'+fails+' failure(s)');
    if(strict) process.exit(1);
  });
