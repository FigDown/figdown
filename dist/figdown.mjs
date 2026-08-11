// figdown.mjs — FigDown embeddable library (0.1.0)
// GENERATED FILE, DO NOT EDIT. Built from editor/figdown.html.
// Regenerate with: node tools/make-lib.js
'use strict';
var VERSION = "0.1.0";

// ---- engine (extracted verbatim from editor/figdown.html) ----
var __engine = (function () {
const SHAPES = ['box','rounded','circle','ellipse','diamond','cylinder'];
// The engine's own version string, and the SINGLE source of it: it sits
// INSIDE the extracted engine region, so tools/make-lib.js (dist/) and
// tools/build-svg.js (the CLI) both read this line rather than each keeping
// a copy — one more four-copy drift point removed. Every artifact records it
// (core §7, `data-engine-version=`): `RENDERING-DETERMINISM` promises byte-identical output for
// the same source AND THE SAME RENDERER VERSION, so the version is half the
// input to that promise, and under core §13 a 0.x renderer may differ from
// the next — which makes the recorded version the only thing that can
// explain a diff between two renderings of one source.
const FIGDOWN_VERSION = '0.1.0';
// Retired shape VALUES keep a named diagnostic (PROCESS §5(d)), the same way
// retired option keys do: `cloud` was the one value that named a domain
// (the internet cloud) in an enum the language keeps purely geometric
// (`SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`), so it was removed rather than demoted.
const RETIRED_SHAPES = {
  cloud: 'shape=cloud has been retired: use shape=ellipse and put the meaning in the label or a class= (shapes are pure geometry, `SHAPE-ENUM-VOCABULARY`) (MIGRATIONS)'
};
// Colors are CSS hex (#rgb / #rrggbb) or CSS named colors (spec §1) — the
// 147 CSS/SVG color keywords (lowercase) plus `transparent`. Anything else
// is a line error (closed grammar).
// 0.1: the same 147 keywords, now as name -> sRGB. The VALUES are new
// and load-bearing: `color=` is retired (`COLOUR-KEY-STATUS`) and the default label colour is
// DERIVED from the resolved fill's WCAG relative luminance (`LABEL-COLOUR-SOURCE`), so a fill
// written as a CSS name has to reach the same arithmetic a `#rrggbb` fill does.
// Values are CSS Color Module Level 4 §6.1 "Named Colors".
const CSS_COLOR_HEX=(function(){
  const m={};
  ('aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc '+
   'bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a '+
   'burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed '+
   'cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b '+
   'darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b '+
   'darkolivegreen:556b2f darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a '+
   'darkseagreen:8fbc8f darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 '+
   'darkviolet:9400d3 deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff '+
   'firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff '+
   'gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 '+
   'hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa '+
   'lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 '+
   'lightcyan:e0ffff lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 '+
   'lightpink:ffb6c1 lightsalmon:ffa07a lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 '+
   'lightslategrey:778899 lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 '+
   'magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 '+
   'mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a '+
   'mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa mistyrose:ffe4e1 '+
   'moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 '+
   'orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee '+
   'palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd '+
   'powderblue:b0e0e6 purple:800080 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 '+
   'salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 '+
   'skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f '+
   'steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee '+
   'wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32')
   .split(' ').forEach(p=>{const i=p.indexOf(':'); m[p.slice(0,i)]='#'+p.slice(i+1);});
  return m;
})();
const CSS_COLORS=new Set(Object.keys(CSS_COLOR_HEX).concat(['transparent']));
const isColor=v=>/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)||CSS_COLORS.has(v);

// ---- derived label colour (§5, `LABEL-COLOUR-SOURCE`) -------------------------------------
// v0.1 has NO author-facing label-colour key: `color=` is retired language-wide
// (`COLOUR-KEY-STATUS`) and nothing replaced it. The DEFAULT is derived from the background
// the label is drawn on, so it cannot assert a falsehood (`UNSAFE-DEFAULT-ELIMINATION`).
//
// The arithmetic is normative and is WCAG 2.1's, unaltered:
//   1. relative luminance (WCAG 2.1 "relative luminance"):
//        c    = channel / 255
//        clin = c/12.92                     when c <= 0.03928
//             = ((c + 0.055)/1.055) ** 2.4  otherwise
//        L    = 0.2126*Rlin + 0.7152*Glin + 0.0722*Blin
//   2. contrast ratio (WCAG 2.1 "contrast ratio"): (L1 + 0.05)/(L2 + 0.05).
// The threshold is not a taste value: it is the L at which white and black
// contrast EQUALLY against the background, i.e. the solution of
//   1.05/(L + 0.05) = (L + 0.05)/0.05   =>   L = sqrt(0.0525) - 0.05
//                                          =  0.179128784747792
// Above it the dark ink wins, at or below it the light ink wins. Choosing any
// other number would knowingly pick the LESS readable of the two.
const CONTRAST_L = Math.sqrt(0.0525) - 0.05;
function relLuminance(hex){
  const h=hex.length===4
    ? '#'+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3]
    : hex;
  const ch=i=>{
    const c=parseInt(h.slice(1+2*i,3+2*i),16)/255;
    return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
  };
  return 0.2126*ch(0)+0.7152*ch(1)+0.0722*ch(2);
}
// `bg` is the RESOLVED fill the label sits on (never undefined at a call site:
// every caller passes the same value it painted). `transparent` and an unknown
// token mean "no fill of its own" — the label is then on the canvas, which is
// the light case. `dark` is the renderer's ink for that context; the light ink
// is white everywhere.
const INK_LIGHT='#ffffff';
function labelInk(bg, dark){
  if(bg===undefined||bg===null||bg==='transparent') return dark;
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bg) ? bg : CSS_COLOR_HEX[bg];
  if(!hex) return dark;
  return relLuminance(hex) > CONTRAST_L ? dark : INK_LIGHT;
}
// Inside the typed blocks the dark ink is "the document's own text colour",
// which is spelled by writing NO fill attribute at all. There the derivation
// only ever ADDS the light ink, so a figure whose fills are light is byte-for-
// byte what it was before this release.
const inkAttr=(bg)=>labelInk(bg,null)===INK_LIGHT?' fill="'+INK_LIGHT+'"':'';

// 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`): the waypoint-list and dock parsers were deleted with the
// `path` directive they served. `points=(x,y),…` was the only value form in
// the language that needed a point-LIST scanner, and `tailport=`/`headport=`
// the only one that needed a compass-or-fraction dock. `pin at=` keeps its own
// single-point grammar inline where it is used, so nothing else in the
// language lost a parser. See spec/migrations.md 0.1 and core §9
// `EDGE-IDENTITY-AND-GEOMETRY` for why the constructs went and what a replacement would need.

// `LINK-OPERATOR-IN-IDS`: ONE scanner for both the "whole token is a string"
// case and the inline `key="value with spaces"` case. A token is a maximal
// run of non-whitespace in which quoted REGIONS may appear anywhere; a
// quoted region may itself contain whitespace. Two consequences the old
// two-branch scanner got wrong:
//   - `rank "a",b` used to lex as TWO tokens (`a`, `,b`) because the
//     leading-quote branch stopped at the closing quote, which is why the
//     line reported "do not mix the comma form with the space form" when
//     nothing was mixed;
//   - `field "Long Name":16` used to need a re-gluing hack downstream.
// QUOTEDNESS IS NO LONGER DISCARDED (`OPTION-POSITION-PARSING`'s principle, extended): every
// token carries `m`, a mark string index-aligned with `v` ('q' = this
// character came from inside quotes, '.' = it did not), and `qz`, the
// offsets in `v` at which a quoted region began (so an EMPTY quoted
// region — `present=""` — is still observable). Everything that has to know
// whether a value was quoted (id positions, string-typed option values,
// comma splitting) reads those two, never the raw line.
function tokenize(line){
  const toks=[]; let i=0;
  while(i<line.length){
    while(i<line.length && /\s/.test(line[i])) i++;
    if(i>=line.length) break;
    let s='', m='', qz=[];
    while(i<line.length && !/\s/.test(line[i])){
      if(line[i]==='"'){
        qz.push(s.length); i++;
        while(i<line.length && line[i]!=='"'){
          if(line[i]==='\\'){
            const e=line[i+1];
            if(e==='n'){ s+='\n'; m+='q'; i+=2; continue; }
            if(e==='"'){ s+='"'; m+='q'; i+=2; continue; }
            if(e==='\\'){ s+='\\'; m+='q'; i+=2; continue; }
            return {error:'unknown escape "\\'+(e||'')+'" (allowed: \\n \\" \\\\)'};
          }
          s+=line[i]; m+='q'; i++;
        }
        if(i>=line.length) return {error:'unterminated string'};
        i++; continue;
      }
      s+=line[i]; m+='.'; i++;
    }
    // `q` keeps its old meaning: the token as a whole is a string literal.
    toks.push({v:s,m,qz,q:qz.length>0 && !m.includes('.')});
  }
  return {toks};
}
// Quotedness of the slice [a,b) of a token. An empty slice is "quoted" iff
// a quoted region opened exactly there (`present=""`, `data="",x`).
function sliceQ(t,a,b){
  if(b>a) return !t.m.slice(a,b).includes('.');
  return t.qz.some(z=>z>=a&&z<=b);
}
// Did the slice [a,b) contain ANY quoting? Id positions reject on this, not
// on sliceQ: `node "a"b` is as much a quoted id as `node "a"` is.
function sliceHasQ(t,a,b){
  if(t.m.slice(a,b).includes('q')) return true;
  return t.qz.some(z=>z>=a&&z<=b);
}
// Split the slice [off,end) of a token into list elements on UNQUOTED
// commas, so a quoted element protects its own comma (`LINK-OPERATOR-IN-IDS`). Returns
// {v, q, h} per element: value, fully-quoted, contains-any-quote.
function splitList(t,off){
  const v=t.v, out=[]; let a=off==null?0:off;
  const start=a;
  for(let i=start;i<=v.length;i++){
    if(i===v.length || (v[i]===','&&t.m[i]==='.')){
      out.push({v:v.slice(a,i), q:sliceQ(t,a,i), h:sliceHasQ(t,a,i)});
      a=i+1;
    }
  }
  return out;
}
// Option keys are a CLOSED set (two levels):
//  - a key listed in OPT_KEYS is parsed as an option; whether it is
//    *applicable* is checked per directive against DIRECTIVE_OPTS
//    (a registered-but-inapplicable key is a line error, `INAPPLICABLE-OPTION-KEYS`);
//  - a key=value token with an unregistered key is an "unknown option"
//    line error (`UNKNOWN-OPTION-DEGRADATION`) — except inside timing `signal` lanes, where bare
//    tokens may contain '=' and stay positional (laneMode).
// `fill` was registered here until this release solely to power a retired
// migration diagnostic on the old `line` directive; it left the registry with
// the `fill` → `band` KEYWORD rename, and 0.1 gave the word back to the
// option-key namespace as the primary presentation key (`color=` → `fill=`).
// `color` stays registered as a RETIRED key so the rename gets a named
// diagnostic instead of the generic `unknown option "color="`.
// `w`/`h` stay registered as RETIRED keys (same device as
// `color`): the rename to `width=`/`height=` gets a named diagnostic instead
// of the generic `unknown option "w="`. `dir` is retired the same way in
// favour of `extend=` on `band`.
// 0.1: `color` was LIVE again and meant the TEXT colour.
// 0.1 (`COLOUR-KEY-STATUS`): `color` is RETIRED for the third and last time, and this
// time the language gains no replacement — v0.1 has no author-facing label
// colour at all (the default is derived, `LABEL-COLOUR-SOURCE`; the owner-level key that could
// be added today is the wrong shape, core §9 `ANNOTATION-LOCATOR-SPLIT`). It stays registered so
// the message can name BOTH eras: a `color=` written before this release meant
// the FILL, one written meant the LABEL, and only a human
// knows which document this is. `text` and `z` stay registered
// as RETIRED keys so each rename gets a named diagnostic. `offset` replaces
// `threshold at=` (the directive was spelled `guide` until this release);
// `at` stays live on `pin`.
// 0.1: `level` stays registered as a RETIRED key — the construct was
// DELETED (`CHART-LEVEL-KEY`), and a registered-but-retired key is the only way the
// deletion gets a named message instead of `unknown option "level="`.
// 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`): `points`, `tailport`, `headport` and `routing` join them,
// for the same reason and with a message of a NEW shape — the constructs were
// WITHDRAWN, so there is no replacement spelling to name. Their acceptor
// directive (`path`) is gone too, so they have no acceptor row at all; they
// are registered here only so the diagnostic can fire language-wide.
// 0.1 (`BITFIELD-REPETITION-CONSTRUCT`): `index` joins the registry as `field`'s repetition key.
// Its value is a RANGE — `index=0..7` — and it is the only option key whose
// value grammar is a range, so it is also the key that fixes the language's
// ONE range spelling at `..` (`RANGE-SPELLING` moves `band` off the hyphen in the same
// release).
const OPT_KEYS=new Set(['kind','type','shape','fill','color','stroke','text','in','plane','layer','label',
  'style','z','z-index','at','offset','w','h','width','height','unit','word','note','description','present','index','labels','data','numbering','from','to','gap',
  'dir','extend','level','taillabel','headlabel','class','via','points','routing','src','dst','tailport','headport']);
// Applicable option keys per directive. Keys with dedicated diagnostics
// (node kind/w/h, edge label/taillabel/headlabel, band from/to, and `color`
// wherever `fill` replaced it) are listed so their specific error messages
// fire. `edge` is consumed by
// parseEdgeLine; `title` takes exactly one quoted string (no options).
// §5 presentation attributes (`fill`, `stroke`, `text` label colour,
// `style` solid|dashed|dotted, `plane`) are optional on ANY element that can
// carry them with a rendering effect — the `GROUP-PRESENTATION-ATTRIBUTES` `group` decision applied to the
// whole registry. Three families carry a carve-out, because the
// attribute has nothing to act on there:
//  - `external` is NEVER drawn (`EXTERNAL-EDGE-ENDPOINTS`) — no fill, no border, no dash; only its
//    label exists, so it takes `text=` (plus `plane=`, organizational exactly
//    as on a node);
//  - `band` carried NO label channel at all until this release (`BAND-LABEL-STATUS`); it now
//    takes a mandatory quoted label, so `color=` applies to it like any
//    other labelled element;
//  - typed blocks (`bitfield`/`table`/`timing`) stack in document order OUTSIDE
//    the scene, so nothing can be layered against them (no `plane=`, on the
//    block or its children), and a block-wide `style=` would collide with the
//    per-item dash conventions (an `optional` field is dashed) — per-item
//    `style=` on `field`/`cell`/`signal` covers the real need.
// 0.1 registry. `text` is listed wherever it was accepted so the
// RENAME fires with a named diagnostic instead of `unknown option`; `fill`
// stays listed on `edge`/`threshold`/`bundle` for the same reason (§8.4: those
// three have no interior, so `fill=` and `stroke=` named one channel with
// silent `stroke=` precedence).
// `at` stays listed on `threshold` so its rename to `offset=` is diagnosed.
// 0.1 (`BAND-LABEL-STATUS`): `band` gained a mandatory quoted label, so it gained the
// text channel with it and now accepts `color=` — the carve-out that refused
// the key existed only because there was no label to colour.
const DIRECTIVE_OPTS={
  figdown:[],
  node:['shape','fill','stroke','style','class','in','plane','width','height'],
  // `FLOWCHART-ROLE-KEYWORDS`: the three flowchart role keywords take EXACTLY the
  // option keys `node` takes — they ARE nodes, with a role recorded. Listing
  // `width`/`height` mirrors `node` so the same "use a pin line" diagnostic
  // fires rather than a bare `unknown option`.
  process:['shape','fill','stroke','style','class','in','plane','width','height'],
  decision:['shape','fill','stroke','style','class','in','plane','width','height'],
  terminator:['shape','fill','stroke','style','class','in','plane','width','height'],
  group:['fill','stroke','style','gap','class','plane'],
  external:['plane'],
  edge:['style','class','fill','stroke','plane','label','taillabel','headlabel'],
  plane:['z','z-index'], flow:[], rank:[],
  bundle:['fill','stroke','style','plane'],
  threshold:['in','at','offset','fill','stroke','style','plane'],
  band:['in','extend','fill','stroke','style','plane','from','to'],
  // `ELEMENT-GEOMETRY-DIRECTIVE`: `size` merged into `pin`. ONE directive carries an
  // element's whole DECLARED geometry — `at=` places it, `width=`/`height=`
  // extend it — and one model object records it. All three keys are optional
  // and a `pin` with none of them is a line error, because it declares
  // nothing. The domains differ and the parser enforces the difference:
  // `at=` takes nodes, groups and externals; `width=`/`height=` take nodes
  // only (a group sizes to its members, and an external or a typed block
  // derives its geometry from its content).
  pin:['at','width','height'],
  layout:[],
  'class':['fill','stroke','style','plane'],
  // 0.1: `class=` is NOT accepted on the typed-block OPENERS. The
  // normative registry (core §10) lists its acceptors as node/group/edge/
  // field/cell — the block openers were an engine-only extra with 0 uses in
  // either corpus, and a closed registry the engine widens is not closed.
  bitfield:['word','numbering','fill','stroke'],
  table:['fill','stroke'], timing:['fill','stroke'],
  chart:['type'],
  // `STYLE-KEY-SCOPE`: `style=` LEAVES `field`, `cell` and `signal`. On a
  // `field` it silently erased the dash that is `optional`'s only visual
  // carrier — `field "B" 8 optional style=solid` kept `optional:true` in the
  // model and drew an ordinary field, so a reading agent and a human got
  // different figures from one line. That is `PRESENTATION-AS-MEANING-CARRIER`'s exact prohibition
  // (presentation may RENDER meaning, never be its only carrier). The three
  // move together because they are one minimum set: 11 in-repo uses, 0
  // downstream, and none of the three has a dash convention worth a key.
  // `PRESENCE-CONDITION-EXPRESSION`/`DESCRIPTION-KEY-SPELLING`: `note=` became `description=` (IEEE 1685's own
  // spelling for authored documentation prose) and the positional flag
  // `optional` became the option key `present=`, whose VALUE is the presence
  // condition. Both old spellings fire a named diagnostic.
  // `BITFIELD-REPETITION-CONSTRUCT`: `index=` — the repetition construct. It states that
  // the field is ONE ELEMENT of a repeated run and gives the run's index
  // range; the engine derives the elision row and the index labels from it,
  // exactly as it derives the dash and the caption from `present=`.
  field:['fill','stroke','class','description','present','index'], 'break':[],
  cell:['fill','stroke','class'], width:[],
  signal:['data','fill','stroke'], gap:[]
};
const STYLES=['solid','dashed','dotted'];
// `RULE-POSITION-ENUMERATION`: every LIVE option key whose value grammar is an enum,
// read off spec/vocabulary-sources.tsv (`shape` column = `enum`, `status`
// live). These are the option half of RULE 2.4's enum positions; the
// positional half (`figdown` version and genre, `flow` direction, `cell`
// `highlight`) is checked at each directive, because each has its own
// positional layout. `type` is `chart`'s and is experimental; it is listed
// because the rule is language-wide, not surface-wide.
const ENUM_OPT_KEYS=['shape','style','numbering','extend','type'];
// Retired option key. `color=` set the FILL, but CSS and the
// diagram languages that borrowed from it use `color` for the TEXT colour and
// `fill` for the fill — so the old spelling read as its own opposite and
// produced a legal, wrong figure. One message, one lookup (PROCESS §5).
// 0.1: `color=` is a LIVE key again (it now sets the TEXT colour), so
// the 0.1 diagnostic is gone. Nothing can replace it: an engine
// reading `color=#dc2626` cannot tell a pre-0.1 source file —
// where it meant FILL — from a post-0.1 one, where it means TEXT. The whole burden of that
// distinction therefore sits in tools/migrate-figdown.js, which refuses to
// guess: its only auto-rewriting branch is gated on the presence of `text=`,
// a token the rewrite removes, so it cannot fire twice.
// Retired option keys. Unlike `color=` — which stayed on the
// directives that accepted it so the message could be per-directive — these
// are reported WHEREVER they appear, the `colw` → `width` precedent: the
// spelling is gone from the language, so no directive can accept it and the
// generic "<directive> does not take w=" would bury the rename.
//  - `w=`/`h=`: SVG, CSS, Graphviz DOT, mxGraph and D2 all spell the size
//    attributes in full. `fill=` and `stroke=` were borrowed whole from SVG;
//    taking the abbreviation for the size pair while taking the full spelling
//    for the paint pair breaks the single-source vocabulary rule (`UNSAFE-DEFAULT-ELIMINATION`).
//  - `dir=`: HTML's `dir` attribute means TEXT WRITING DIRECTION. FigDown's
//    meant "which way the band extends from its anchor" — the same spelling
//    for a different meaning, which `UNSAFE-DEFAULT-ELIMINATION` treats as a defect in itself.
// 0.1 retirements. `text=` and `z=` left the LANGUAGE (the channel is
// now `color=`, the stacking key is now `z-index=`), so under RULE 6.2's
// placement test they fire wherever they appear, the `w=`/`h=`/`colw`
// precedent. `text=`'s message must carry the 0.1 warning too: this
// is the one migration that is NOT a rename — old `color=` set the FILL, new
// `color=` sets the TEXT — and once `color=` is live again the engine can no
// longer diagnose a pre-0.1 document at all.
const RETIRED_OPT_KEYS={
  w:'w= has been renamed: use width= (SVG, CSS, DOT, mxGraph and D2 all spell it in full — no standard abbreviates it) (MIGRATIONS)',
  h:'h= has been renamed: use height= (SVG, CSS, DOT, mxGraph and D2 all spell it in full — no standard abbreviates it) (MIGRATIONS)',
  dir:'dir= has been renamed: use extend= (HTML\'s dir= is text writing direction; this one says which way the band extends from its anchor) (MIGRATIONS)',
  text:'text= has been retired: v0.1 has NO label-colour key — the label colour is DERIVED from the fill it sits on (core §5), and the owner-level key that could replace it would colour an edge\'s [tail]/[mid]/[head] labels identically, which is the wrong shape (core §9 `ANNOTATION-LOCATOR-SPLIT`). Delete the key; if the distinction was knowledge, write it in the label or a class= meaning (§5, `PRESENTATION-AS-MEANING-CARRIER`) (MIGRATIONS)',
  // `COLOUR-KEY-STATUS`. This is the ONLY key in the language whose diagnostic
  // must name two eras and refuse to choose between them: the same six
  // characters meant the FILL before this release and the LABEL after
  // 0.1, and no engine can tell the two source files apart. Retiring
  // the key is what makes the difference DIAGNOSABLE at all — while it was
  // live, a pre-0.1 document parsed and drew a legal, wrong figure in
  // silence.
  //
  // 0.1: the MESSAGE may not name those release numbers. A `.fd` does
  // not record which pre-release wrote it — downstream every document says
  // `figdown 0.1` — so "which era is this document from?" is a question the
  // reader cannot answer by looking at anything. What they CAN look at is the
  // rest of the file, and the two eras differ in what else it may contain:
  // `fill=` did not exist while `color=` meant the FILL, and the older
  // spellings were gone by the time it meant the LABEL. The message names
  // those observables, says plainly when a file has neither, and cites the
  // release only as a MIGRATIONS lookup. Same rule as the migration tool's
  // `color=` family, which reads the same evidence to decide its refusals.
  color:'color= has been retired: the same six characters set the box FILL in one era of this language and the LABEL colour in another, and this line does not say which — which is why the key is gone rather than renamed. READ IT OFF THE REST OF THE DOCUMENT. A file that also writes fill= cannot be from the FILL era (the two keys never coexisted), so its color= was a LABEL colour: delete it and let the derived default apply (core §5). A file still writing the spellings that were retired before the LABEL era (w= h= unit= via= dir= kind= layer= boundary wrap optional) cannot be from that era, so its color= was a FILL: write fill= instead. A file with NEITHER carries no evidence at all, and the two readings then differ only in what was DRAWN — as a FILL the value painted the box interior, as a LABEL colour it painted only the text. If the colour carried meaning, put that meaning in the label or a class= (§5, `PRESENTATION-AS-MEANING-CARRIER`). tools/migrate-figdown.js reads this evidence for you and REFUSES the wrong --color-means=fill|text (MIGRATIONS)',
  kind:'kind= has been renamed: on a node use shape= (geometric; the label text carries the device semantics — MIGRATIONS 0.1), on a chart use type= (Vega, Chart.js and ECharts all spell the chart-type key "type" — MIGRATIONS 0.1). One spelling was retired on node and live on plot at the same time, inside one namespace; 0.1 closed that.',
  layer:'layer= has been renamed: use plane= (mxGraph makes a layer a containment parent that establishes coordinates; Inkscape layers can carry a transform; OGC WMS layers carry an SRS; CSS @layer is cascade priority. None of those is what this key does, and SVG has no layer at all) (MIGRATIONS)',
  labels:'labels= has been renamed: use data= (WaveDrom\'s own key for exactly this is `data`, "an array of signal labels" — one per value cell of the lane) (MIGRATIONS)',
  // 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`). These six keys end in a WITHDRAWAL, not a rename, so
  // their messages have a shape no earlier retirement in this table has: they
  // name no replacement spelling, because there is none. `via=`/`src=`/`dst=`
  // were renamed to keys that have since been withdrawn, so each
  // states the whole two-hop chain in one lookup (the `line` → `guide` →
  // `threshold` precedent) and ends at the same place.
  via:'via= has been WITHDRAWN: it was renamed points=, and points= was withdrawn with the whole `path` directive. There is no replacement spelling — author waypoints are outside the stable prior-art intersection (only 2 of 4 surveyed systems model them, and those 2 disagree on what happens when an endpoint moves). Delete the line; the edge draws under auto layout. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  src:'src= has been WITHDRAWN: it was renamed tailport=, and tailport= was withdrawn with the whole `path` directive. There is no replacement spelling — role-addressed attachment IS inside the stable prior-art intersection, but per-edge addressing needs an edge-identity construct FigDown does not have. Delete the line; the edge draws under auto layout. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  dst:'dst= has been WITHDRAWN: it was renamed headport=, and headport= was withdrawn with the whole `path` directive. There is no replacement spelling — role-addressed attachment IS inside the stable prior-art intersection, but per-edge addressing needs an edge-identity construct FigDown does not have. Delete the line; the edge draws under auto layout. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  points:'points= has been WITHDRAWN with the `path` directive (`EDGE-GEOMETRY-CONSTRUCTS`): the construct is removed from the language, not renamed, so there is no spelling to migrate to. Author waypoints are outside the stable prior-art intersection — only 2 of 4 surveyed systems model them, and those 2 disagree on what happens when an endpoint moves (mxGraph leaves them behind, ELK carries them, Visio has no waypoint concept at all). Delete the line; the edge draws under auto layout, and `pin`, `rank`, `flow` and declaration order are the content-zone means of shaping it. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  tailport:'tailport= has been WITHDRAWN with the `path` directive (`EDGE-GEOMETRY-CONSTRUCTS`): the construct is removed from the language, not renamed, so there is no spelling to migrate to. Attachment to a named site addressed by semantic role IS inside the stable prior-art intersection; FigDown\'s realisation was not (a fraction on the EDGE is mxGraph-only, and written-order attachment has zero prior art in any surveyed system). Restoring it needs an edge-identity construct first. Delete the line; the edge draws under auto layout. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  headport:'headport= has been WITHDRAWN with the `path` directive (`EDGE-GEOMETRY-CONSTRUCTS`): the construct is removed from the language, not renamed, so there is no spelling to migrate to. Attachment to a named site addressed by semantic role IS inside the stable prior-art intersection; FigDown\'s realisation was not (a fraction on the EDGE is mxGraph-only, and written-order attachment has zero prior art in any surveyed system). Restoring it needs an edge-identity construct first. Delete the line; the edge draws under auto layout. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  routing:'routing= has been WITHDRAWN with the `path` directive (`EDGE-GEOMETRY-CONSTRUCTS`): the construct is removed from the language, not renamed, so there is no spelling to migrate to. The per-edge routing SCOPE was inside the stable prior-art intersection and is deliberately lost with its host line — an override needs an edge to address, and FigDown has no edge-identity construct. Delete the line. The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md',
  unit:'unit= has been renamed: use word= (RFC 2360 §3.1: "a sequence of long words in network byte order, with each word horizontal on the page"; RFC 791 §3.1 measures the header in "32 bit words". Mermaid names the identical setting bitsPerRow — semantically right, camelCase barred. `unit=32` also inverts count-vs-unit, reading as "the unit is 32", and C\'s "unit" is the addressable storage unit, not the row width) (MIGRATIONS)',
  z:'z= has been renamed: use z-index= (CSS spells the stacking concept z-index, and RULE 4.2 takes the standard spelling in full; a single-letter key is structurally risky next to the closed timing lane alphabet, `LANE-ALPHABET-KEY-RESERVATION`) (MIGRATIONS)',
  // `DESCRIPTION-KEY-SPELLING`. The spelling leaves the LANGUAGE, so the message fires
  // wherever it appears (the `w=`/`h=`/`unit=` placement test, RULE 6.2).
  note:'note= has been renamed: use description= (IEEE 1685-2022 spells this channel `description`; SystemRDL\'s `desc` is barred by RULE 4.2 as an abbreviation. The rename is defensive: `ANNOTATION-LOCATOR-SPLIT` files `note` as the highest-demand v0.2 annotation construct — ~66 figure-identities, 20 independent reinventions — and that one will be a DRAWN callout, so a never-drawing `note=` beside an always-drawing `note` would be one spelling with two opposite behaviours) (MIGRATIONS)',
  level:'level= has been DELETED, not renamed: it drew a reference plane through a 3-D bar chart, has zero uses in either downstream corpus and zero 3-D bar charts to draw it on, was the only construct whose caption the ENGINE wrote rather than the author, and its parseFloat grammar uniquely accepted 1e3 where every other number in the language is \\d+(\\.\\d+)? — delete the key (MIGRATIONS)'
};
// `PLANE-KEYWORD-SPELLING`: the keyword `plane`/`plane=` was spelled `layer`/`layer=`.
const RETIRED_LAYER='layer has been renamed: use plane (in mxGraph — the geometry model FigDown adopted — a layer is a CONTAINMENT PARENT that establishes coordinates, so layer=overlay reads as "reparent and re-origin this element", which FigDown does not do; Inkscape layers are <g> and may carry a transform, OGC WMS layers each carry an SRS, and CSS @layer is cascade priority with no visual meaning. SVG has no layer concept at all. `plane` is claimed by no standard for a conflicting meaning and removes the layout/layer near-miss) (MIGRATIONS)';
// `THRESHOLD-KEYWORD-SPELLING`: the scene keyword `guide` became `threshold`.
const RETIRED_GUIDE='guide has been renamed: use threshold (in Illustrator, Inkscape, Figma and draw.io a "guide" is an author-only construction line that is NEVER rendered, while FigDown\'s is drawn output — an INVERTED name, which `UNSAFE-DEFAULT-ELIMINATION` rates worse than an unfamiliar one, and no counter-example was found where "guide" names rendered output. `guide` was also a FigDown coinage, and `SIZE-AND-DIRECTION-KEY-NAMING` makes coining a last resort; `threshold` comes whole from Grafana, whose "Show thresholds" render option offers "As lines", "As filled regions" and "As filled regions and lines" — FigDown\'s marker + region pair, split the same way — with IETF RED/AQM as the secondary source (RFC 2309: "Two RED parameters, minth (minimum threshold) and maxth (maximum threshold)"; RFC 7567: "an AQM algorithm configured with a threshold"). 78% of the measured corpus marks are thresholds; target/mean/reference marks: 0) (MIGRATIONS)';
// `EXTERNAL-ENDPOINT-NAMING`: the scene keyword `boundary` became `external`.
const RETIRED_BOUNDARY='boundary has been renamed: use external (it declares an external I/O endpoint — the spec\'s own words — while UML\'s «boundary» is an INTERNAL interface object, C4\'s System_Boundary is a dashed grouping container FigDown already spells `group`, and BPMN\'s Boundary Event is a third meaning) (MIGRATIONS)';
// `ROW-BREAK-NAMING`: the `bitfield` child keyword `wrap` became `break`.
const RETIRED_WRAP='wrap has been renamed: use break (in CSS and typography `wrap` is AUTOMATIC reflow — a mode — while this directive is an EXPLICIT row break, an event; CSS Fragmentation calls it "a forced break … explicitly indicated by the … author", HTML spells it `br`) (MIGRATIONS)';
// `PRESENCE-FLAG-SPELLING`: the 0.1 rename `optional` -> `conditional` (`PRESENCE-FLAG-SPELLING`)
// is REVERTED. `conditional` has zero attestation as a wire-format field
// marker and zero uses in the downstream corpus, while "optional" appears in
// 34 downstream field LABELS — authors wrote the word in the label precisely
// because the keyword no longer said it. The MODEL key moves with the surface
// (`NORMATIVE-SEMANTIC-MODEL`): it is `optional` again on both sides.
const RETIRED_FIELD_CONDITIONAL='the field flag "conditional" has been retired: write present="<the condition>" (or present="" if the condition is not stated). "conditional" was attested as a wire-format field marker nowhere — zero hits in RFC 2784, ASN.1 X.680, draft-mcquistin-augmented-ascii-diagrams, SystemRDL, IP-XACT, Kaitai Struct and protobuf — and the flag it briefly replaced, "optional", is retired too: an option key carrying the CONDITION says what a bare flag could not (MIGRATIONS)';
// `PRESENCE-CONDITION-EXPRESSION`: the positional flag `optional` becomes the option key
// `present=`, whose VALUE is the presence condition. A bare flag could say
// only THAT a field is conditional; every RFC that draws one also states WHY
// ("present only if the C bit is set"), and until now that sentence had
// nowhere to live but `note=` — invisible to the reader and, under `BITFIELD-CONDITIONAL-OFFSETS`,
// prose the model may not read. `present` is the attested spelling: X.680
// PRESENT, IP-XACT isPresent, SystemRDL ispresent, RFC 2784 "present only
// if", draft-mcquistin "present only when".
const RETIRED_FIELD_OPTIONAL='the field flag "optional" has been retired and replaced by an option key that carries the CONDITION: write present="<the condition>" (e.g. field "Checksum" 16 present="C = 1"), or present="" when the condition is not stated. The bare flag could say only THAT the field was conditional, so the condition had to live in note= — invisible to the human reading the figure, and prose the model may not parse (`BITFIELD-CONDITIONAL-OFFSETS`). present= DRAWS: the field stays dashed and a stated condition becomes a caption under the block (MIGRATIONS)';
// `TIMING-GENRE-NAMING`: the EXPERIMENTAL genre `wave` became `timing`, both as
// the header genre token and as the block opener. The old name was WaveDrom's
// MEMBER KEY, not its figure name: in WaveJSON `signal` is the root object and
// `wave` is a PROPERTY of one signal — the lane activity string — so FigDown
// named a whole figure kind after a per-lane attribute and left WaveDrom's own
// figure name ("Digital Timing Diagram") unused. `timing` is the datasheet and
// JEDEC term for this figure, and UML 2.5.1's Timing Diagram is the same
// concept (a lifeline's state over time drawn as a waveform), so it is correct
// reuse under §10, not a collision. The rename also FREES `wave` for the lane,
// which is where WaveJSON puts it.
// `ELEMENT-GEOMETRY-DIRECTIVE`: `size` is RETIRED — it did not move to another
// directive, it MERGED into one. The message therefore names a whole line
// rather than a word: an author holding `size a width=120 height=60` needs
// to know that the keys survive unchanged and only their carrier moved.
// RULE 6.2 placement: the spelling left the LANGUAGE, so this fires wherever
// it appears at line start, in every genre, ahead of the `GENRE-KEYWORD-ALLOWLIST` allowlist.
const RETIRED_SIZE='size has been retired: its keys moved onto pin — write pin <id> width=<px> height=<px> (one directive carries an element\'s whole declared geometry: at= places it, width=/height= extend it; all three keys are optional and a pin with none of them declares nothing) (MIGRATIONS)';
const RETIRED_WAVE='wave has been renamed: use timing (in WaveJSON `signal` is the root object and `wave` is a PROPERTY of one signal — its lane activity string — so `wave` named a member key, not a figure kind; WaveDrom\'s own name for the figure is "Digital Timing Diagram", "timing diagram" is the datasheet/JEDEC term for it, and UML 2.5.1\'s Timing Diagram is the same concept. The rename frees `wave` for the lane) (MIGRATIONS)';
// `EDGE-GEOMETRY-CONSTRUCTS`: `path` and `routing` are WITHDRAWN from the language.
// These two diagnostics are a NEW SHAPE for this table. Every retirement
// before them named a replacement spelling — `size` named `pin`, `guide` named
// `threshold`, `layer` named `plane`, and even `level`, which was DELETED,
// could say "delete the key" because the key was a modifier on a surviving
// line. These name none, because there is none: the constructs are gone and
// nothing in v0.1 does what they did. RULE 6.2 still binds — the spelling must
// be a line error that names its MIGRATIONS entry, never silently accepted and
// never silently rejected — so what changes is the sentence, not the contract.
// Each message therefore does three things: says WITHDRAWN (not "renamed",
// not "use X"), says what an author should do instead (delete the line and let
// auto layout draw it, with the content-zone means named), and points at where
// the decision is RECORDED so the reasoning is one lookup away.
const WITHDRAWN_WHERE=' The decision and its evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY`, decisions/registry.md';
const RETIRED_PATH='path has been WITHDRAWN from the language (`EDGE-GEOMETRY-CONSTRUCTS`) — removed, not renamed, so there is no replacement spelling. A prior-art study of Visio, draw.io/mxGraph, Graphviz and ELK found author waypoints OUTSIDE the stable intersection: only 2 of the 4 model them, and those 2 disagree on what happens when an endpoint moves. The dock realisation was outside it too — written-order attachment has zero prior art in any surveyed system. Delete the line: the edge draws under auto layout, and `rank`, `flow`, declaration order and `pin` are the content-zone means of shaping it.'+WITHDRAWN_WHERE;
const RETIRED_ROUTING='routing has been WITHDRAWN from the language (`EDGE-GEOMETRY-CONSTRUCTS`) — removed, not renamed, so there is no replacement spelling. Two routing modes and two scopes ARE inside the stable prior-art intersection, so the need is recognised and its shape is known; what is missing is the evidence and the implementation (6 of the 8 in-repo `routing=orthogonal` writings were provable no-ops, and downstream adoption was zero), and the per-edge scope cannot be restored without an edge-identity construct FigDown does not have. Delete the line; the edges draw straight.'+WITHDRAWN_WHERE;
// `TIMING-LANE-ALPHABET`: the timing lane digits `2`-`9` left the closed alphabet.
const RETIRED_LANE_DIGIT='timing lane digits 2-9 have been retired: write "=" for a data cell and name it in data= (WaveDrom defines 2..9 as "value with color N" and "=" as "value (default color 2)" — the same brick with a palette index, while FigDown drew the digit character itself as the box label and consumed no data entry, so the two readings of one lane differed silently) (MIGRATIONS)';
// 0.1 (§8.4): `edge`, `threshold` and `bundle` have NO interior, so
// `fill=` and `stroke=` named the SAME channel and `stroke=` won silently —
// two keys for one channel, resolved by an undocumented precedence that
// produced a legal, wrong figure whenever both were written (16 lines in
// this repository, 3 of them writing both on one line). Same defect shape as
// the retired `color=`; same cure, a named diagnostic.
const NO_INTERIOR=new Set(['edge','threshold','bundle']);
const FILL_NO_INTERIOR=k=>k+' has no interior, so fill= and stroke= name the same channel (stroke= won silently) — write stroke= (MIGRATIONS)';
// `STYLE-KEY-SCOPE`: `style=` left these three directives (it stays live on
// node/group/edge/class/bundle/threshold/band). The generic
// "<directive> does not take style=" would be true but would not say why, and
// on `field` the removal is a CORRECTNESS fix, not a tidy-up — so these three
// get a named diagnostic, the FILL_NO_INTERIOR precedent.
// `ROW-HIGHLIGHT-CELL-FILL-COLLISION`: the row tint and a cell fill are ONE channel. `STYLE-KEY-SCOPE`
// filed both halves of this as an HONEST NEGATIVE and left them open; they
// are closed here the way every other one-channel-two-keys collision in this
// language was closed — a named line error, not a precedence rule. A
// precedence rule is what `STYLE-KEY-SCOPE` had just finished removing from `field`.
const CELL_HL_ON_CELL='highlight is a ROW mark and takes the single-valued row form (cell <row> highlight) — on a cell address it was SILENTLY DISCARDED and never reached the model, while the cell fill drew. A row tint and a cell fill paint the same channel, so writing both for one cell has no honest resolution: tint the row (cell <row> highlight) or paint the cell (cell (<row>,<col>) fill=…/class=…), not both (MIGRATIONS)';
const CELL_HL_ROW_CONFLICT=(r,c)=>'cell ('+r+','+c+') resolves to a fill on row '+r+', which is highlighted — the cell fill overrides the row tint, so the model says "row '+r+' is highlighted" while the drawing shows only part of the row tinted (`PRESENTATION-AS-MEANING-CARRIER`: presentation may render meaning, never delete it). Drop the row highlight, or move the cell fill to a row that carries none (MIGRATIONS)';
const NO_ITEM_STYLE=new Set(['field','cell','signal']);
const STYLE_NO_ITEM=k=>k+' does not take style= — '+(k==='field'
  ? 'on a field the dash IS conditional presence (`present=`, spelled `optional` until this release), and style=solid erased it while the model still recorded the field as conditionally present (`PRESENTATION-AS-MEANING-CARRIER`: presentation may render meaning, never be its only carrier)'
  : 'a dash on one '+k+' carried no meaning the block does not already carry, and 0 documents outside this repository wrote it')
  // `DESCRIPTION-KEY-SPELLING` corrected the second half of this message. It used to
  // offer `note=` as a place to put knowledge, which was wrong twice over:
  // the key is now spelled `description=`, and NEITHER spelling draws
  // anything beyond a tooltip — sending knowledge there hides it from the
  // human, which is the same defect `STYLE-KEY-SCOPE` exists to close. The two channels
  // that DRAW are the name/label and a `class` meaning (which also earns a
  // legend entry).
  +'. Delete the key; if the distinction is knowledge, write it in the name/label or in a class= meaning — both of which DRAW; description= is documentation prose and produces no ink beyond a tooltip (MIGRATIONS)';
function splitOpts(toks, laneMode){
  // a repeated option key on one line is a line error, never
  // silent last-wins. `dup` names the first key that appeared twice.
  // `OPTION-POSITION-PARSING`: `posq` carries the quotedness of each POSITIONAL
  // token, index-aligned with `pos`. Before it existed, the two directives
  // that need to know whether their label was quoted (`bundle`, `threshold`)
  // tested `tk.toks[i].q` — the RAW stream — while reading the value from
  // `pos`, the option-stripped one. The indices diverge the moment an
  // option precedes the label (`bundle t1 fill=red "LAG" a--b`), so a legal
  // line was rejected. Option position is free everywhere else; it is free
  // here now too.
  // `LINK-OPERATOR-IN-IDS`: `posT` and `optT` carry the TOKEN behind each value —
  // `OPTION-POSITION-PARSING` built `posq` for positional quotedness; the value layer (comma
  // splitting, id checks, string-typed option values) needs the same
  // information, and it needs it for option VALUES too. `optT[k]` is
  // {t, off}: the token and the offset in `t.v` at which the value starts.
  const pos=[], posq=[], posT=[], opts={}, optT={}, unk=[]; let dup=null;
  for(const t of toks){
    const m = !t.q && /^([A-Za-z_][A-Za-z0-9_-]*)=([\s\S]*)$/.exec(t.v);
    if(m && OPT_KEYS.has(m[1])){
      if(Object.prototype.hasOwnProperty.call(opts,m[1]) && dup===null) dup=m[1];
      opts[m[1]]=m[2];
      optT[m[1]]={t, off:m[1].length+1};
    }
    else if(m && !laneMode) unk.push(m[1]);
    else { pos.push(t.v); posq.push(!!t.q); posT.push(t); }
  }
  return {pos,posq,posT,opts,optT,unk,dup};
}
// The comma form a retired space form should have been written as. Trailing
// commas on the individual tokens are the half-converted spelling (`a, b`),
// so they are dropped before joining — the suggestion must be paste-ready.
const joinListForm=toks=>toks.map(t=>String(t).replace(/,+$/,'')).filter(Boolean).join(',');
// Was the VALUE of option `k` written with quotes anywhere / entirely?
function optHasQ(optT,k){ const e=optT[k]; return !!e && sliceHasQ(e.t,e.off,e.t.v.length); }
function optQ(optT,k){ const e=optT[k]; return !!e && sliceQ(e.t,e.off,e.t.v.length); }
// The elements of a comma list held in option `k`, quote-aware.
function optList(optT,k){ const e=optT[k]; return e?splitList(e.t,e.off):null; }
// An id is a BARE token matching this pattern. The pattern is a whole-token
// anchor: `-` and `_` are ordinary interior characters, so a TRAILING `-` or
// `_` is legal (`node mux_ "MUX"` parses) — a downstream author renamed ids
// on the mistaken belief that it was not, so core §1 now says so explicitly.
const ID_RE=/^[A-Za-z_][A-Za-z0-9_-]*$/;
// `LINK-OPERATOR-IN-IDS`: `--` is the LINK OPERATOR (`edge a -- b`,
// `bundle t1 a--b`), so it must not also be able to occur inside an id.
// While it could, `bundle t1 a-x--b` had two legal readings (`a-x`+`b` and
// `a`+`x--b`) and the greedy member regex silently committed to the first,
// making the second unreachable and undiagnosed — RULE 6.3 says malformed
// input is an error, never a guess. Zero ids in either corpus contain `--`.
const DD_ID='"--" is not allowed inside an id — it is the link operator (edge a -- b, bundle t1 a--b); write a single "-" or "_" (MIGRATIONS)';
// `QUOTED-IDS`: ONE wording for every id position. It covers both
// halves of the defect it closes — a needlessly quoted legal id
// (`node "a"`, silently accepted before) and a quoted token that is not a
// legal id at all (`node "Router 1"`, which used to report the unhelpful
// `node needs an id`) — because in both cases the author's next move is the
// same: put the text in the label slot and leave the id bare.
// `QUOTING-RULES` — quoting: the TYPE gates eligibility, the DELIMITER
// gates necessity.
//   whitespace-delimited string position -> quotes MANDATORY
//   comma-delimited list element         -> quotes only when the element
//                                           contains whitespace , "  or #
//                                           (redundant quotes stay legal)
//   [ ] edge label                       -> quotes only to enable escapes
// The whitespace row is not a style preference: whitespace is ALSO the
// positional separator, so a bare token cannot grow into a phrase and the
// old failure named the wrong thing (`node a Cache miss` reported
// `unexpected argument "miss"` — a surplus argument, when the defect was a
// missing quote).
const Q_WHY='whitespace also separates positionals, so a bare token cannot express a phrase (MIGRATIONS)';
const ID_RULE='ids are bare and match [A-Za-z_][A-Za-z0-9_-]* — text with spaces or punctuation belongs in the label: node <id> "your text"';
// isId: the whole id test, used at every id position in the language.
const isId=v=>typeof v==='string'&&ID_RE.test(v)&&!v.includes('--');
// idErr(value, quotedFlag, missingMsg) -> the message for an id position, or
// null when the id is well formed. `missing` fires only when nothing at all
// was written; a written-but-illegal id always gets ID_RULE or DD_ID, never
// "<directive> needs an id".
function idErr(v,quoted,missing){
  if(v===undefined||v===null||v==='') return quoted?ID_RULE:missing;
  if(quoted) return ID_RULE;
  if(ID_RE.test(v)&&v.includes('--')) return DD_ID;
  if(!ID_RE.test(v)) return ID_RULE;
  return null;
}
// `RULE-POSITION-ENUMERATION`: RULE 2.4's OTHER HALF, enforced. The rule reads "where
// the grammar expects an id OR AN ENUM VALUE, the token MUST be bare", and
// until now only the id half existed — 14 of 14 id positions rejected a
// quoted token through `idErr`, and 0 of the enum positions rejected
// anything (`shape="box"`, `style="dashed"`, `flow "right"`,
// `figdown "0.1" block`, `numbering="msb0"`, `cell 1 "highlight"` all
// parsed). A rule enforced at half its positions is worse than no rule.
//
// THE LINE, and it is derivable rather than a list: a position whose value
// is drawn from a CLOSED SET OF SPELLINGS is written BARE. That is exactly
// the id argument (`QUOTED-IDS`) generalised — an id is closed by declaration, an
// enum and a bare keyword flag are closed by the standard — and quoting one
// invites the same false belief, that arbitrary text is admissible there
// (`PRIOR-ART-BORROWING`: two spellings of one meaning feed hallucination).
//
// Its complement is stated in the same breath, because leaving it unstated
// is what made RULE 2.3 and RULE 2.4 disagree at the table `width` position:
// where the value comes from an OPEN VALUE SPACE — a number, a point, a
// percentage, a range — redundant quotes stay INERT and legal. `index=`'s
// inertness is normative and load-bearing there (core §12.7, `INDEX-RANGE-STEP`), and
// 2.3's own reason applies: a generating agent that quotes uniformly must
// not be punished, and a validator that rejects redundant quotes makes the
// write->validate->fix loop oscillate.
//
// TWO WORD-SHAPED SPELLINGS SIT INSIDE OTHERWISE-NUMERIC GRAMMARS and stay
// INERT deliberately — table `width auto,90` and `field "A" *`. They are
// declared exceptions with a stated reason, SYNTAX-STYLE §8.6, not an
// oversight: both are ONE alternative inside a numeric value grammar, so the
// element they sit in is typed by that grammar, and splitting one comma list
// into bare-word and quotable-number elements would be a worse rule than the
// exception.
const ENUM_WHY='quoting a value drawn from a closed set suggests the position accepts arbitrary text, when it accepts only the listed spellings (SYNTAX-STYLE RULE 2.4)';
const ENUM_BARE=shown=>'this position takes a BARE value: write '+shown+' — '+ENUM_WHY;
// class= is multi-valued (comma-separated ids). Returns {ok, ids, err} —
// empty value, empty members, quoted members and illegal id spellings are
// line errors. `els` is the quote-aware element list (`LINK-OPERATOR-IN-IDS` splitList); when
// it is absent the caller only wants the ids back and quoting was already
// checked on the same line.
function parseClassList(v,els){
  if(v===undefined) return {ok:true, ids:undefined};
  if(v==='') return {ok:false, err:'class= must not be empty'};
  const parts=els?els.map(e=>e.v):String(v).split(',');
  if(parts.some(p=>p==='')) return {ok:false, err:'class= must not contain empty members'};
  for(let i=0;i<parts.length;i++){
    const e=idErr(parts[i], els?els[i].h:false, 'bad class id "'+parts[i]+'"');
    if(e) return {ok:false, err:e};
  }
  return {ok:true, ids:parts};
}

// `BITFIELD-REPETITION-CONSTRUCT`: `index=` on a `field` — the repetition construct.
//
// The value is a RANGE, and `..` is the language's ONE range separator
// (SYNTAX-STYLE §4.8; Ada ISO/IEC 8652 `1 .. 10`, Pascal ISO 7185
// `array [1..10]`, X.680 `SIZE(1..4)` — all inclusive). `band` moved off the
// hyphen onto it in the same release (`RANGE-SPELLING`), so the language has one spelling
// and needs no declared exception for a second.
//
// Tri-state, deliberately the same SHAPE as `present=`:
//   key absent      no repetition claim — NOT an assertion of one occurrence
//   index=""        repeats; nothing about the indices is stated
//   index="0..X"    repeats; the last index is opaque prose
//   index=0..7      repeats; the range is DETERMINATE, 8 elements
//
// DETERMINACY IS DECIDED BY PARSING BOTH ENDS AS INTEGERS, NEVER BY QUOTING.
// RULE 2.3 makes redundant quotes inert, so `index="0..7"` is determinate too.
// This is normative (core §12.7, genres/bitfield.md) rather than an accident
// of this function, because a future `index="0..7 step 2"` (`INDEX-RANGE-STEP`) rests on
// it: were quoting made semantic here, that extension would stop being free.
//
// `RULE-POSITION-ENUMERATION`: AND THE SPELLING THAT EXTENSION NEEDS IS NOW RESERVED.
// Inertness alone did not make `step` free. A prose `<last>` accepts ANY
// non-empty text, so `index="0..7 step 2"` was already a LEGAL document
// whose model is `{first:0, last:"7 step 2"}` and whose caption reads
// `[0] … [7 step 2]`. Shipping the step meaning later would therefore change
// what an existing legal document MEANS, and no engine could separate "prose
// that happens to read like a step clause" from "the author meant the
// extension" — the `color=` failure shape, which this project treats as its
// worst (`COLOUR-KEY-STATUS`). An extension is free only when the syntax carrying it is
// RESERVED, not merely unused. So `step` is reserved here exactly as `;` was
// reserved (`SEMICOLON-STATUS`) and for the same reason: a mark or a word that
// a future release will claim must be an error TODAY, while the claim costs
// nothing. `INDEX-RANGE-STEP`'s own measurement — 0 of 9 corpus figures with a stepped
// index — is what makes the price zero.
//
// `<first>` is ALWAYS a literal integer. That is what makes the base
// machine-readable without resolving any name — and 0-based is the canonical
// form, from IP-XACT's `indices`, which "follows C-semantics for indexing".
//
// WHITESPACE AROUND `..` IS NOT SIGNIFICANT (`index="0 .. 7"` is `index=0..7`;
// Ada writes `1 .. 10`). It is reachable only in the QUOTED form, because an
// unquoted option value is one whitespace-free token (§1) — normative in
// core §12.2 and genres/bitfield.md, pinned by golden 420.
//
// Returns {ok, val, err}. `val` is the model shape: an object with `first`
// and `last` being a NUMBER when the run is determinate and a STRING
// when it is prose. `index=""` yields `{}` — a written value that claims
// repetition and states no index at all.
const IDX_INT=/^\d+$/;
const IDX_SHAPE='index= takes a range written <first>..<last> — one ".." separator, and both ends present: index=0..7, index=53..0 (descending), index="0..Last Entry" when the last index is only named in prose, or index="" to say it repeats without stating any index';
// 0.1: the LARGEST index either end may state. `<first>` and a literal
// `<last>` are read as FigDown numbers, and core §12.5 binds a number to an
// ECMAScript double — so above 2^53-1 the value a reader gets back is NOT the
// value the author wrote (`9007199254740993` reads back as `…992`, and the
// derived count |last-first|+1 is then wrong by the rounding). §12.7 requires
// the model to be recoverable FROM THE SOURCE; a silently rounded index is the
// one thing it must not do, so the bound is a line error rather than a value.
const IDX_MAX=Number.MAX_SAFE_INTEGER;   // 9007199254740991
// `RULE-POSITION-ENUMERATION`: the reserved `step` clause. The TRIGGER is a bare
// lowercase `step` token in the prose `<last>` — whitespace-delimited on both
// sides (or at either end of the prose), matched case-sensitively.
//   CAUGHT:     index="0..7 step 2"   index="0..N step 2"   index="0..end step"
//   NOT CAUGHT: index="0..7 Step 2"   index="0..stepping"   index="0..8 steps"
//               index="0..7 in steps of 2"
// The trigger is deliberately narrow: only the EXACT spelling the extension
// would use can ever be ambiguous with it, and FigDown's vocabulary is
// lowercase everywhere (core §1), so `Step` and `steps` can never become the
// extension's spelling. A wider trigger would reject prose that could never
// collide, which is a cost with no reservation behind it.
const IDX_STEP=/(^|\s)step(\s|$)/;
const IDX_STEP_ERR='"step" is RESERVED inside an index= range and has no meaning in v0.1 — a stepped range (index="0..7 step 2", core §9 `INDEX-RANGE-STEP`) is a v0.2 extension, and the spelling is reserved now so that shipping it cannot change what a document already written means. If the last index really is prose containing this word, spell it differently ("0..7 stepping by 2", "0..7 in steps of 2"); if you meant every other element, v0.1 has no way to say it — write the run you can state and put the rest in description=';
function parseIndexRange(v){
  if(v===undefined) return {ok:true, val:undefined};
  if(v==='') return {ok:true, val:{}};              // repeats, indices unstated
  const s=String(v);
  // 0.1: a dot RUN longer than two is a mistyped separator, not a
  // separator followed by prose. `'0...7'.split('..')` yields ['0','.7'], two
  // parts, so the letter of "one '..' separator" passed it and the third dot
  // was silently absorbed into an opaque last index ".7" — an accepted figure
  // whose model contradicted the source. Checked on the RAW value, before the
  // split, because the split is exactly what loses the evidence.
  if(/\.{3}/.test(s)) return {ok:false, err:IDX_SHAPE};
  const parts=s.split('..');
  if(parts.length!==2) return {ok:false, err:IDX_SHAPE};
  const a=parts[0].trim(), b=parts[1].trim();
  if(a===''||b==='') return {ok:false, err:IDX_SHAPE};
  if(!IDX_INT.test(a))
    return {ok:false, err:'index= needs a LITERAL first index, and "'+a+'" is not one: a FigDown number is a run of DIGITS — no sign, no decimal point, no separators. Only the LAST index may be prose — the first is machine-readable by construction, which is what lets a reader place the run without resolving any name. Write index=<digits>..<last>: index=0..7, or index="0..'+a+'" if the run really starts at 0 and ends where "'+a+'" says'};
  const first=+a;
  if(first>IDX_MAX)
    return {ok:false, err:'index= first index "'+a+'" is above '+IDX_MAX+', the largest integer a FigDown number carries exactly (core §12.5 binds a number to an ECMAScript double) — a reader would get '+first+' back, not what you wrote'};
  if(IDX_INT.test(b)){
    const last=+b;
    if(last>IDX_MAX)
      return {ok:false, err:'index= last index "'+b+'" is above '+IDX_MAX+', the largest integer a FigDown number carries exactly (core §12.5 binds a number to an ECMAScript double) — a reader would get '+last+' back, not what you wrote, and the element count with it'};
    if(first===last)
      return {ok:false, err:'index='+a+'..'+b+' is a range of ONE element, which is not repetition — drop index= (an absent key claims nothing), or write the range the run really covers'};
    return {ok:true, val:{first,last}};
  }
  // `RULE-POSITION-ENUMERATION`: the prose `<last>` is where the reserved `step` clause would land,
  // and where it is therefore an error. Checked AFTER the integer branch, so
  // a determinate range never pays for it.
  if(IDX_STEP.test(b)) return {ok:false, err:IDX_STEP_ERR};
  return {ok:true, val:{first,last:b}};
}

// `GENRE-KEYWORD-ALLOWLIST`: per-header-genre top-level keyword allowlist.
// `UNIVERSAL-CORE-KEYWORDS` core is in every set (fixity, not ubiquity). Scene genres keep
// experimental scene/layout keywords (B2) but they are not the "main
// standard" taught to agents. Pure bitfield/table/timing reject scene.
//
// `LAYOUT-ZONE-NAMESPACE`: the universal core is THREE — the document's structure,
// readable before the genre is known. `layout` stays here because it is the
// zone OPENER, a structural marker, not a directive inside the zone. The
// zone's own members are a SEPARATE namespace (`LAYOUT-ZONE-NAMESPACE`).
// `EDGE-GEOMETRY-CONSTRUCTS`: that namespace now holds `pin` and NOTHING ELSE.
// `path` and `routing` were its two experimental members and both were
// withdrawn, so `LAYOUT_EXP_KW` is gone rather than empty — an empty list
// would imply the slot is waiting to be refilled, and the two SPELLINGS are
// released back to the language (core §9 `EDGE-GEOMETRY-CONSTRUCTS` closes on that fact).
const CORE_KW=['figdown','title','layout'];
const LAYOUT_KW=['pin'];                       // `LAYOUT-ZONE-NAMESPACE`, NORMATIVE — the whole namespace
const GENRE_FREE_KW=CORE_KW.concat(LAYOUT_KW);
const SCENE_KW_TOP=['node','group','external','edge','class','flow','rank'];
const SCENE_EXP_KW=['threshold','band','bundle','plane'];
const SCENE_HOST_KW=GENRE_FREE_KW.concat(SCENE_KW_TOP, SCENE_EXP_KW, ['bitfield','table','timing','chart']);
// `FLOWCHART-ROLE-KEYWORDS`: the flowchart ROLE vocabulary — the FIRST exercise of
// `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` ("a genre owns its words"). These three are legal ONLY under
// `figdown 0.1 flowchart`; `GENRE-NAMESPACE`'s allowlist is what makes `decision x` a line
// error under `block` with no extra code. Names taken whole from ISO 5807
// §9.2.1/§9.2.2.4/§9.4.2, whose own definitions are of the REFERENT ("this
// symbol represents any kind of processing function"), never of the drawn
// form — which is why `SHAPE-ENUM-VOCABULARY` is satisfied by borrowing them (`FLOWCHART-ROLE-SOURCE`).
const FLOWCHART_ROLE_KW=['process','decision','terminator'];
// Geometry DERIVED from role (`SHAPE-ENUM-VOCABULARY`'s own mapping, requirements-notes `SHAPE-ENUM-VOCABULARY`:
// "decision→diamond, terminator→rounded"). The role is the model; this is
// only its default drawing, and `shape=` on the same line overrides the
// drawing without touching the role (§12.7).
const ROLE_SHAPE={process:'box',decision:'diamond',terminator:'rounded'};
const GENRE_KW={
  block:new Set(SCENE_HOST_KW),
  topology:new Set(SCENE_HOST_KW),
  flowchart:new Set(SCENE_HOST_KW.concat(FLOWCHART_ROLE_KW)),
  bitfield:new Set(GENRE_FREE_KW.concat(['class','bitfield'])),
  // chart is experimental and attaches to a table id in the same document
  table:new Set(GENRE_FREE_KW.concat(['class','table','chart'])),
  timing:new Set(GENRE_FREE_KW.concat(['class','timing']))
};
const CHILD_KW=new Set(['field','break','cell','width','signal','gap']);

// Multi-section files (`MULTI-FIGURE-DOCUMENTS`): each `figdown 0.1 <genre>` starts a section.
// Comments/blanks before the first header belong to section 0.
function splitFigdownSections(text){
  const lines=String(text).split('\n');
  const at=[];
  for(let i=0;i<lines.length;i++){
    let t=lines[i];
    const hi=findComment(t); if(hi>=0) t=t.slice(0,hi);
    if(/^figdown(\s|$)/.test(t.trim())) at.push(i);
  }
  if(at.length<=1) return null;
  const secs=[];
  for(let s=0;s<at.length;s++){
    const from=s===0?0:at[s];
    const to=s+1<at.length?at[s+1]:lines.length;
    secs.push({startLine:from+1, text:lines.slice(from,to).join('\n')});
  }
  return secs;
}

// parse(text) -> {doc, errs, docs}
// Single-section: docs=[doc] (backward-compatible doc/errs).
// Multi-section: one doc per figdown header; errs use full-file line numbers;
// doc is docs[0] for naive callers. Render stacks sections into one SVG (`MULTI-FIGURE-DOCUMENTS`).
function parse(text){
  // 0.1: strip a leading U+FEFF BOM EXPLICITLY (core §1). It was
  // already tolerated, but only because JS `\s` happens to include U+FEFF, so
  // `.trim()` ate it — an accident of the host language that a second
  // implementation had no way to know it had to reproduce. Stripping it here
  // makes the normative rule ("a BOM at the very start of the document is
  // ignored") implementable from the spec alone. Behaviour is unchanged.
  text=String(text).replace(/^\uFEFF/,'');
  const secs=splitFigdownSections(text);
  if(!secs){
    const r=parseOne(String(text));
    return {doc:r.doc, errs:r.errs, docs:[r.doc]};
  }
  const docs=[]; const errs=[];
  for(const sec of secs){
    const r=parseOne(sec.text);
    for(const e of r.errs){
      const m=/^Line (\d+): (.*)$/.exec(e);
      if(m) errs.push('Line '+(+m[1]+sec.startLine-1)+': '+m[2]);
      else errs.push(e);
    }
    docs.push(r.doc);
  }
  return {doc:docs[0], errs, docs};
}

function parseOne(text){
  const errs=[];
  // `EMPTY-LABEL-STATE`: `title` and a plane label start ABSENT (null), never as an empty
  // string — an author who writes `title ""` has made a distinction the model
  // must keep, and the implicit `base` plane wrote no label at all.
  const doc={title:null,nodes:[],groups:[],edges:[],planes:[{id:'base',label:null,z:0}],
             flow:'right',ranks:[],pins:{},blocks:[],trunks:[],thresholds:[],bands:[],
             classes:[],boundaries:[]};
  const nodeIds=new Set(), groupIds=new Set(), planeIds=new Set(['base']), classIds=new Set(),
        bundleIds=new Set(), boundaryIds=new Set(), blockIds=new Set();
  // §1: "IDs are ... unique per document" — nodes, groups, boundaries AND the
  // typed blocks (bitfield/table/timing) share ONE namespace, so a bare id in
  // `edge`/`pin`/`chart` can never be ambiguous. `plane`, `class` and
  // `bundle` keep their own namespaces: each is referenced through a dedicated
  // option or keyword, never as a bare id.
  const dupId=id=>nodeIds.has(id)||groupIds.has(id)||boundaryIds.has(id)||blockIds.has(id);
  let cur=null;             // current typed block (bitfield/table/timing)
  // `REPEATED-DIRECTIVE-HANDLING`: `title`, `flow`, `layout` and a per-id `pin` are SINGLE-VALUED — a
  // repetition is a line error on the second occurrence, never a silent
  // last-one-wins (§8: malformed input is an error, never ignored).
  let sawHeader=false, firstContent=true, sawLayout=false, sawTitle=false, sawFlow=false;
  const LAYOUT_DIRECTIVES=new Set(['pin']);   // `EDGE-GEOMETRY-CONSTRUCTS`: `pin` is the whole layout namespace
  const lines=text.split('\n');
  const err=(n,m)=>errs.push('Line '+n+': '+m);
  // `RULE-POSITION-ENUMERATION`: the typed-block openers' LABEL is a positional string
  // and takes RULE 2.1's mandatory quotes, exactly as `node`, `group`,
  // `external`, `plane`, `class` and `bundle` already do. Until now
  // `bitfield b Hdr` and `table t Caption` were accepted with the label
  // `Hdr`/`Caption` while `node a Hdr` was a line error, and BOTH genre
  // documents write the form as `<keyword> <id> ["label"]` — so the docs
  // taught a rule the engine did not enforce, at 3 of 15 labelled positions.
  // It is the failure §2.1 says it retired: an unquoted multi-word
  // positional is not a spelling, it is a hole — `table t My Caption`
  // reported `unexpected argument "Caption"`, naming a surplus argument when
  // the defect was a missing quote. Returns true when it reported.
  const BLK_LBL=(n,kw,id,pos,posq)=>{
    if(pos[2]===undefined||posq[2]) return false;
    err(n,kw+' label must be quoted: '+kw+' '+id+' "'+pos[2]+'" — '+Q_WHY);
    return true;
  };

  // `EDGE-LABEL-PLACEMENT`/`REVERSE-ARROW-OPERATOR`: edge <id> [tail] <op> [head] <id> — a [mid] label splits the
  // operator into halves: -[x]-  -[x]->  <-[x]-  <-[x]->. Bracket content:
  // balanced brackets nest verbatim ([flags[3:0]] just works); ["..."] takes
  // the standard quoted-string escapes for unbalanced brackets / \n.
  function parseEdgeLine(s,n){
    let i=4; // past 'edge'
    const ws=()=>{ while(i<s.length&&/\s/.test(s[i])) i++; };
    // `LINK-OPERATOR-IN-IDS`: a hyphen is an id character only when it is NOT
    // followed by a second one, because `--` is the link operator. This is
    // what lets `edge a--b` mean the same thing as `bundle t1 a--b`; before
    // the ban the greedy scanner ate `a--b` as one id and then reported
    // "edge needs an operator", so the same token read oppositely two lines
    // apart (SYNTAX-STYLE §6.3).
    const readId=()=>{ const m=/^[A-Za-z_](?:[A-Za-z0-9_]|-(?!-))*/.exec(s.slice(i));
      if(!m) return null; i+=m[0].length; return m[0]; };
    // `QUOTED-IDS`: an endpoint is an id position. A quoted token or a spelling that
    // is not an id gets the ID RULE — not "edge needs <id> …", which named
    // the wrong thing when the operator was plainly there.
    const idHere=()=>i<s.length&&!/[\s[\-<>]/.test(s[i]);
    const readLbl=()=>{               // called at '['
      i++;
      if(s[i]==='"'){                 // ["..."] — quoted content
        i++; let v='';
        while(i<s.length&&s[i]!=='"'){
          if(s[i]==='\\'){ const e=s[i+1];
            if(e==='n'){ v+='\n'; i+=2; continue; }
            if(e==='"'){ v+='"'; i+=2; continue; }
            if(e==='\\'){ v+='\\'; i+=2; continue; }
            return {error:'unknown escape "\\'+(e||'')+'" (allowed: \\n \\" \\\\)'}; }
          v+=s[i]; i++;
        }
        if(i>=s.length) return {error:'unterminated string in [label]'};
        i++;
        if(s[i]!==']') return {error:'expected ] after quoted label'};
        i++;
        if(!v) return {error:'empty [label]'};
        return {v};
      }
      let depth=1,v='';
      while(i<s.length){
        const c=s[i];
        if(c==='[') depth++;
        else if(c===']'){ depth--; if(!depth){ i++;
          v=v.trim();
          if(!v) return {error:'empty [label]'};
          return {v}; } }
        v+=c; i++;
      }
      return {error:'unterminated [label] — for unbalanced brackets use ["..."]'};
    };
    ws();
    if(s[i]==='"'){ err(n,ID_RULE); return; }
    const a=readId();
    if(!a){ err(n, idHere()?ID_RULE:'edge needs <id> ->|<-|--|<-> <id>'); return; }
    if(idHere()){ err(n,ID_RULE); return; }
    ws(); let tail=null;
    if(s[i]==='['){ const r=readLbl(); if(r.error){ err(n,r.error); return; } tail=r.v; }
    ws();
    let lh=null;
    if(s.startsWith('<-',i)){ lh='<-'; i+=2; }
    else if(s[i]==='-'){ lh='-'; i++; }
    else { err(n,'edge needs an operator: -> <- -- <-> (a [mid] label splits it: -[x]->)'); return; }
    let mid=null, op=null;
    if(s[i]==='['){
      const r=readLbl(); if(r.error){ err(n,r.error); return; } mid=r.v;
      if(s.startsWith('->',i)){ op=lh==='<-'?'<->':'->'; i+=2; }
      else if(s[i]==='-'){ op=lh==='<-'?'<-':'--'; i++; }
      else { err(n,'expected - or -> to close the operator after [label]'); return; }
    } else if(lh==='<-'){
      if(s[i]==='>'){ op='<->'; i++; } else op='<-';
    } else {
      if(s[i]==='-'){ op='--'; i++; }
      else if(s[i]==='>'){ op='->'; i++; }
      else { err(n,'edge needs an operator: -> <- -- <->'); return; }
    }
    ws(); let head=null;
    if(s[i]==='['){ const r=readLbl(); if(r.error){ err(n,r.error); return; } head=r.v; }
    ws();
    if(s[i]==='"'){ err(n,ID_RULE); return; }
    const b=readId();
    if(!b){ err(n, idHere()?ID_RULE:'edge needs a target id after the operator'); return; }
    if(idHere()){ err(n,ID_RULE); return; }
    const tk2=tokenize(s.slice(i).trim());
    if(tk2.error){ err(n,tk2.error); return; }
    const {pos:p2,opts:o2,optT:oT2,unk:u2,dup:d2}=splitOpts(tk2.toks);
    if(d2){ err(n,'duplicate option "'+d2+'=" on one line'); return; }
    if(u2.length){ err(n,'unknown option "'+u2[0]+'="'); return; }
    if(p2.length){ err(n,'unexpected argument "'+p2[0]+'"'); return; }
    // 0.1: `edge` has its own scanner, so the language-wide retired
    // keys need their own check here or `edge` would be the one directive
    // that reports the generic message for a retired spelling.
    for(const rk in RETIRED_OPT_KEYS)
      if(o2[rk]!==undefined){ err(n,RETIRED_OPT_KEYS[rk]); return; }
    for(const k in o2)
      if(!DIRECTIVE_OPTS.edge.includes(k)){ err(n,'edge does not take '+k+'='); return; }
    for(const k of ['label','taillabel','headlabel'])
      if(o2[k]!==undefined){ err(n,k+'= is retired — write the label inline: edge A [tail] -[mid]-> [head] B (MIGRATIONS)'); return; }
    if(o2.fill!==undefined){ err(n,FILL_NO_INTERIOR('edge')); return; }
    for(const k of ['fill','stroke'])
      if(o2[k]!==undefined && !isColor(o2[k])){ err(n,'unknown color "'+o2[k]+'" (#hex or CSS color name)'); return; }
    // `RULE-POSITION-ENUMERATION`: `edge` was the ONE id position in the language that
    // tolerated a quoted id. `parseEdgeLine` has its own scanner and
    // therefore its own copies of the genre gate, the layout-zone gate and
    // the retired-key sweep — but it never got a copy of the id-quoting
    // check that `badOpts` applies to `in=`/`plane=` everywhere else, so
    // `node c "C" plane="over"` was a line error and
    // `edge a -> b plane="over"` was accepted. The endpoints were already
    // covered (the scanner rejects a leading `"`); this is the option value.
    if(o2.plane!==undefined){
      const e=idErr(o2.plane, optHasQ(oT2,'plane'), null);
      if(e){ err(n,e); return; }
    }
    // `RULE-POSITION-ENUMERATION`: and the enum half of RULE 2.4, for the one enum key `edge` takes.
    // Checked before the value, exactly as `badOpts` does it.
    if(o2.style!==undefined && optHasQ(oT2,'style')){ err(n,ENUM_BARE('style='+o2.style)); return; }
    if(o2.style!==undefined && !STYLES.includes(o2.style)){ err(n,'style must be solid|dashed|dotted'); return; }
    let ecls;
    if(o2['class']!==undefined){
      const pc=parseClassList(o2['class'],optList(oT2,'class'));
      if(!pc.ok){ err(n,pc.err); return; }
      ecls=pc.ids;
    }
    // §5 on an edge: the line IS a stroke and has no interior, so `stroke=`
    // and `fill=` name the same channel (`stroke=` wins when both are
    // written); `text=` colours the [tail]/[mid]/[head] labels.
    doc.edges.push({a,b,op,tail,mid,head,style:o2.style,cls:ecls,
                    stroke:o2.stroke,
                    plane:o2.plane||'base',line:n});
  }

  for(let li=0; li<lines.length; li++){
    const n=li+1;
    let raw=lines[li];
    // pipe rows are raw GFM content: no comment stripping inside them
    if(!raw.trimStart().startsWith('|')){
      const hi=findComment(raw); if(hi>=0) raw=raw.slice(0,hi);
    }
    if(!raw.trim()) continue;

    // GFM pipe row (table content)
    if(raw.trim().startsWith('|')){
      if(!cur||cur.type!=='table'){ err(n,'pipe row outside a table block'); continue; }
      const s=raw.trim();
      if(!s.endsWith('|')){ err(n,'pipe row must end with |'); continue; }
      const inner=s.slice(1,-1);
      const segs=[]; let acc='';
      for(let i=0;i<inner.length;i++){
        if(inner[i]==='\\'&&inner[i+1]==='|'){ acc+='|'; i++; }
        else if(inner[i]==='|'){ segs.push(acc); acc=''; }
        else acc+=inner[i];
      }
      segs.push(acc);
      const isSep=segs.every(x=>/^\s*:?-+:?\s*$/.test(x)) && segs.length>0;  // GFM: 1+ hyphens
      if(isSep){
        if(cur.sep){ err(n,'duplicate delimiter row'); continue; }
        if(!cur.heads.length){ err(n,'delimiter row before any header row'); continue; }
        if(segs.length!==cur.cols.length){ err(n,'delimiter row has '+segs.length+' columns, expected '+cur.cols.length); continue; }
        cur.sep=true;
        cur.aligns=segs.map(x=>{ x=x.trim();
          const l=x.startsWith(':'), r=x.endsWith(':');
          return l&&r?'center':(r?'right':(l?'left':null)); });
        continue;
      }
      // content row: raw empty segment = colspan-left (multimd "||");
      // cell exactly ^^ = rowspan-up (multimd). The only cell escapes are
      // \| (handled during segmentation) and \^^ (literal caret pair) —
      // any other backslash (including \n) is literal cell text (`TABLE-CELL-BACKSLASH`).
      // Multi-line cells (Br2): GFM-style HTML line breaks
      // <br> / <br/> / <br /> only — normalized to U+000A in the model;
      // other HTML is literal text, never markup.
      const cells=segs.map(x=>{
        if(x.length===0) return {v:'', m:'left'};
        const t=x.trim();
        if(t==='^^') return {v:'', m:'up'};
        let v=t.startsWith('\\^^')?t.slice(1):t;
        v=v.replace(/<br\s*\/?>/gi,'\n');
        return {v, m:null};
      });
      if(cells[0].m==='left'){ err(n,'colspan cannot start in the first column'); continue; }
      if(cur.heads.length===0 && cells.some(c=>c.m==='up')){ err(n,'"^^" cannot appear in the first row'); continue; }
      if(!cur.sep){
        if(cur.heads.length && cells.length!==cur.cols.length){ err(n,'header row has '+cells.length+' cells, expected '+cur.cols.length); continue; }
        cur.heads.push(cells);
        if(cur.heads.length===1) cur.cols=cells.map(c=>c.v);
      } else {
        if(cells.length!==cur.cols.length){ err(n,'row has '+cells.length+' cells, expected '+cur.cols.length); continue; }
        // rowspan cannot cross the thead/tbody boundary (multimd prior
        // art): "^^" in the first data row is a line error (`MERGE-ACROSS-DELIMITER-ROW`).
        if(!cur.rows.length && cells.some(c=>c.m==='up')){ err(n,'"^^" cannot appear in the first data row (rowspan does not cross the header delimiter row)'); continue; }
        cur.rows.push({cells,hl:false,line:n});
      }
      continue;
    }
    // `SEMICOLON-STATUS`: the `;` reservation, enforced. Runs after the pipe-row
    // block (a table cell is raw GFM content) and before every other line
    // form, so no directive can quietly give `;` a meaning.
    if(findReservedSemi(raw)>=0){ err(n,RESERVED_SEMI); continue; }
    // edge lines carry inline [labels] with free text — dedicated scanner,
    // not the generic tokenizer
    if(/^edge(\s|$)/.test(raw.trim())){
      if(firstContent){ firstContent=false; err(n,'first line must be "figdown 0.1 <genre>"'); }
      cur=null;
      // `CONTENT-LAYOUT-ZONE-SPLIT`: `edge` is a semantic directive, and it is dispatched here —
      // before the generic layout-zone gate below — so it needs its own copy
      // of that gate, or it is the one semantic line that escapes the zone.
      if(sawLayout){ err(n,'"edge" is a semantic directive — it must appear before the layout zone (`CONTENT-LAYOUT-ZONE-SPLIT`)'); continue; }
      // `GENRE-KEYWORD-ALLOWLIST`: edge is scene vocabulary only
      if(sawHeader && doc.genre && GENRE_KW[doc.genre] && !GENRE_KW[doc.genre].has('edge')){
        err(n,'"edge" is not allowed in genre '+doc.genre); continue; }
      parseEdgeLine(raw.trim(),n);
      continue;
    }
    const tk=tokenize(raw.trim());
    if(tk.error){ err(n,tk.error); continue; }
    const lead=(tk.toks.length&&!tk.toks[0].q)?tk.toks[0].v:'';
    const {pos,posq,posT,opts,optT,unk,dup}=splitOpts(tk.toks, lead==='signal');
    const kw=pos[0];
    // `INAPPLICABLE-OPTION-KEYS`/`UNKNOWN-OPTION-DEGRADATION`/`COLOUR-VALUE-VALIDATION`: uniform per-directive option checks —
    // unknown keys, registered-but-inapplicable keys, invalid colors.
    // Directives not in DIRECTIVE_OPTS (title's single quoted string, unknown
    // keywords) are handled by their own paths.
    const badOpts=(k)=>{
      const allowed=DIRECTIVE_OPTS[k];
      if(!allowed) return false;
      let bad=false;
      // same-line repeated option key (last-wins was silent data loss)
      if(dup){ err(n,'duplicate option "'+dup+'=" on one line'); bad=true; }
      for(const u of unk){ err(n,'unknown option "'+u+'="'); bad=true; }
      // Retired spelling: `color=` → `fill=`. Fires only where
      // the key was accepted; on a directive that never took it the existing
      // `<directive> does not take color=` is still the right answer.
      if(opts.fill!==undefined && NO_INTERIOR.has(k)){ err(n,FILL_NO_INTERIOR(k)); bad=true; }
      if(opts.style!==undefined && NO_ITEM_STYLE.has(k)){ err(n,STYLE_NO_ITEM(k)); bad=true; }
      // 0.1 retirements: reported on every directive, because the
      // spelling left the language rather than moving between directives.
      for(const rk in RETIRED_OPT_KEYS)
        if(opts[rk]!==undefined){ err(n,RETIRED_OPT_KEYS[rk]); bad=true; }
      // `RULE-POSITION-ENUMERATION`: RULE 2.4's enum half on the OPTION keys. One loop
      // for every enum-valued key, the same device the id-valued keys below
      // use — so a key that gains an enum grammar later is covered by
      // listing it in ENUM_OPT_KEYS, not by remembering to write a check.
      // It runs BEFORE the value checks and suppresses them for that key
      // (`enumQ`): ONE TOKEN, ONE ERROR. A quoted enum has not been
      // established to be IN the position at all, so reporting what its
      // CONTENT would have meant is premature — `shape="bkx"` says the
      // spelling is wrong, once, rather than the spelling and `unknown
      // shape` on one line. This is the convention `idErr` has followed at
      // every id position (a quoted id gets the ID RULE and
      // nothing else), `parseClassList` follows, and the `edge` scanner
      // follows by returning; the `figdown` header was made to follow it
      // here too, so all four sites agree.
      const enumQ=new Set();
      for(const k of ENUM_OPT_KEYS)
        if(opts[k]!==undefined && allowed.includes(k) && optHasQ(optT,k)){
          err(n,ENUM_BARE(k+'='+opts[k])); enumQ.add(k); bad=true; }
      for(const o in opts){
        if(RETIRED_OPT_KEYS[o]) continue;          // already reported above
        if(o==='style'&&NO_ITEM_STYLE.has(k)) continue;   // `STYLE-KEY-SCOPE`: named above
        if(allowed.includes(o)) continue;
        if(k==='group'&&o==='in') err(n,'group does not take in= — nesting is one level (node in=group) in v0.1');
        else err(n,k+' does not take '+o+'=');
        bad=true;
      }
      for(const o of ['fill','stroke'])
        if(opts[o]!==undefined && allowed.includes(o) && !isColor(opts[o])){
          err(n,'unknown color "'+opts[o]+'" (#hex or CSS color name)'); bad=true; }
      // §5 style enum — checked once, for every directive that takes style=
      if(opts.style!==undefined && allowed.includes('style') && !enumQ.has('style') && !STYLES.includes(opts.style)){
        err(n,'style must be solid|dashed|dotted'); bad=true; }
      // class= multi-value form: validate spelling here so every
      // directive that accepts class= shares one check; the parsed list is
      // re-derived at the push site via parseClassList.
      if(opts['class']!==undefined && allowed.includes('class')){
        const pc=parseClassList(opts['class'],optList(optT,'class'));
        if(!pc.ok){ err(n,pc.err); bad=true; }
      }
      // `QUOTING-RULES`: a STRING-typed option value in a whitespace-
      // delimited position is quoted — the same rule that governs a
      // positional string. Without the quotes `description=a b` silently
      // keeps only `a` and turns `b` into a surplus positional on a
      // different line of the diagnostic. There are TWO string-typed option
      // values: `description=` (`DESCRIPTION-KEY-SPELLING`, spelled `note=`
      // until then) and `present=` (`PRESENCE-CONDITION-EXPRESSION`). `present=""` is legal and is the
      // "conditional, condition not stated" form — an EMPTY quoted value,
      // not an unquoted one, so the same rule admits it.
      for(const sk of ['description','present'])
        if(opts[sk]!==undefined && allowed.includes(sk) && !optQ(optT,sk)){
          err(n,sk+'= must be quoted: '+sk+'="'+opts[sk]+'" — '+Q_WHY); bad=true; }
      // `QUOTED-IDS`: `in=` and `plane=` are ID-VALUED options, so the
      // same rule that governs a positional id governs them. An empty value
      // keeps its directive-specific message (`threshold needs in=…`); a written
      // one that is quoted or not a legal id gets the ID RULE.
      for(const k of ['in','plane'])
        if(opts[k]!==undefined && allowed.includes(k)){
          const e=idErr(opts[k], optHasQ(optT,k), null);
          if(e){ err(n,e); bad=true; }
        }
      // `RULE-POSITION-ENUMERATION`: RULE 2.4's enum half on the OPTION keys. One loop
      // for every enum-valued key, the same device the id-valued keys above
      // use — so a key that gains an enum grammar later is covered by
      // listing it once, not by remembering to write a check.
      return bad;
    };

    if(firstContent){
      firstContent=false;
      if(kw==='figdown'){
        sawHeader=true;
        // `RULE-POSITION-ENUMERATION`: the version and the genre are both enum
        // positions (vocabulary-sources.tsv `figdown.version`,
        // `figdown.genre`), so both are BARE.
        //
        // ONE TOKEN, ONE ERROR — the convention `idErr` has followed at
        // every id position, and `parseClassList` and the
        // `edge` scanner follow too. A quoted token has not been established
        // to be IN the position at all, so reporting what its CONTENT would
        // have meant is premature: `figdown 0.1 "blok"` says the spelling is
        // wrong, once, rather than the spelling and `unknown genre` on one
        // line. So the quoting check runs first and suppresses the value
        // check for that token, exactly as `badOpts` does for `shape=`.
        const hq1=!!posq[1], hq2=!!posq[2];
        if(hq1) err(n,ENUM_BARE('figdown '+pos[1]+' <genre>'));
        else if(hq2) err(n,ENUM_BARE('figdown 0.1 '+pos[2]));
        if(!hq1 && pos[1]!=='0.1') err(n,'unsupported version "'+(pos[1]||'')+'" (expected 0.1)');
        const GENRES=['block','topology','flowchart','bitfield','table','timing'];
        // 0.1: the genre token is REQUIRED. `bitfield`/`table`/`timing`
        // documents declare their kind in their content, but `block`,
        // `topology` and `flowchart` share the SAME vocabulary
        // (node/edge/group) and differ only in default flow — so the header
        // is the ONLY place such a document states which kind of figure it
        // is, and omitting it destroys the distinction with no recoverable
        // fallback. The message lists the six legal values so an authoring
        // agent fixes it in one step.
        if(pos[2]===undefined) err(n,'figdown header requires a genre (block|topology|flowchart|bitfield|table|timing)');
        else if(hq2){ /* the quoting error above is this token's one error */ }
        else if(pos[2]==='wave') err(n,RETIRED_WAVE);
        else if(!GENRES.includes(pos[2])) err(n,'unknown genre "'+pos[2]+'" (block|topology|flowchart|bitfield|table|timing)');
        else{ doc.genre=pos[2];
          // genre defaults (`GENRE-NAMESPACE`/`DEFAULT-VALUE-SELECTION`): flowchart figures flow down —
          // the census-dominant direction; an explicit flow line overrides
          if(pos[2]==='flowchart') doc.flow='down'; }
        // §1: a directive line carrying positional arguments its grammar does
        // not accept MUST be rejected — the header is a directive like any other
        if(pos.length>3) err(n,'unexpected argument "'+pos[3]+'"');
        badOpts('figdown');
        continue;
      } else { err(n,'first line must be "figdown 0.1 <genre>"'); }
    } else if(kw==='figdown'){ err(n,'duplicate version header'); continue; }

    // Retired spelling: `colw` → `width`. Keyword naming
    // discipline — one lowercase word, borrowed standard terminology; `colw`
    // was the only invented abbreviation in the registry. Reported wherever
    // it appears (inside a block or not) so the migration is unmissable.
    if(kw==='colw'){ err(n,'colw has been renamed: use width (one lowercase word; the table block scopes it to columns)'); continue; }

    // Retired spellings: four keywords whose names collided with
    // something else in the language.
    //  - `line` collided with the model's own `line` field (the source line
    //    number every element carries) and read as "draw a line", which it is
    //    not; §2.6's prose already called it a guide. 0.1 (`THRESHOLD-KEYWORD-SPELLING`) renamed
    //    that replacement again, to `threshold`, so this message names the
    //    CURRENT spelling — a two-hop migration is one lookup, not two;
    //  - `fill` read as "fill colour" (which was `color=` then) and was also an
    //    option key, so one word lived in two namespaces; §2.6's prose already
    //    called it a range band. 0.1 gave the word back to the OPTION-KEY
    //    namespace only (`color=` → `fill=`); the KEYWORD stays retired, so
    //    `fill` at line start is still this error. §10 records the declared
    //    exception to `UNSAFE-DEFAULT-ELIMINATION` that this one-directional reuse costs;
    //  - `route` sat three characters from the document-level `routing`, which
    //    is ALSO an option key on the same directive, so a typo produced
    //    another legal directive instead of an error, and `route` is a domain
    //    noun in a topology figure (`SHAPE-ENUM-VOCABULARY`: no domain nouns in the presentation
    //    vocabulary) while the directive means geometric waypoints;
    //  - `render` was a verb naming a zone that admits only geometry
    //    (`pin` — and, until this release, `path` and `routing`), and it
    //    collided with the renderer
    //    and the render options of §7. `layout` is the cross-tool word for
    //    this half of a diagram language, and the zone it opens carried the
    //    `# --- layout` comment convention before it became a keyword.
    // 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) added `path` and `routing` to this block, and they are
    // the first entries in it that name NO replacement. `route`'s own message
    // has to change with them: it pointed at `path`, which no longer exists,
    // so it now states the whole chain and ends where the others end.
    if(kw==='line'){ err(n,'line has been renamed: use threshold (a labelled reference value drawn across the target'+"'"+'s box; "line" now only names a source line number, and the 0.1 replacement `guide` was itself retired) (MIGRATIONS)'); continue; }
    if(kw==='fill'){ err(n,'fill has been renamed: use band (a range band; the KEYWORD is retired — fill= is the presentation option key)'); continue; }
    if(kw==='route'){ err(n,'route has been WITHDRAWN: it was renamed path, and path was withdrawn from the language (`EDGE-GEOMETRY-CONSTRUCTS`). There is no replacement spelling. Delete the line: the edge draws under auto layout.'+WITHDRAWN_WHERE); continue; }
    if(kw==='path'){ err(n,RETIRED_PATH); continue; }
    if(kw==='routing'){ err(n,RETIRED_ROUTING); continue; }
    if(kw==='render'){ err(n,'render has been renamed: use layout (the zone takes only pin — geometry, not presentation) (MIGRATIONS)'); continue; }
    if(kw==='wrap'){ err(n,RETIRED_WRAP); continue; }
    if(kw==='boundary'){ err(n,RETIRED_BOUNDARY); continue; }
    if(kw==='layer'){ err(n,RETIRED_LAYER); continue; }
    if(kw==='guide'){ err(n,RETIRED_GUIDE); continue; }
    if(kw==='wave'){ err(n,RETIRED_WAVE); continue; }
    if(kw==='size'){ err(n,RETIRED_SIZE); continue; }
    if(kw==='plot'){ err(n,'plot has been renamed: use chart (plot reads as an imperative — the reason render was retired — while every other block opener is a noun; ECharts, Chart.js and Mermaid all name the object a chart) (MIGRATIONS)'); continue; }

    // typed-block children
    if(cur && ['field','break','cell','width','signal','gap'].includes(kw)){
      if(badOpts(kw)) continue;
      if(cur.type==='bitfield' && kw==='field'){
        // Compact form (C bit-field convention): field F1:16,F2:8 SYN:1 ...
        // — bare name:width items separated by commas and/or spaces, no
        // per-field options. Classic form: field <name> <width> [options].
        // Classic form: field <name> <width-in-bits|*> [fill=] [description=]
        //                                             [present=]
        // Conditional presence was a POSITIONAL FLAG until this release:
        // `optional` (…0.1), `conditional` (0.1…0.1),
        // `optional` again (`PRESENCE-FLAG-SPELLING`). `PRESENCE-CONDITION-EXPRESSION` replaces the flag with
        // `present=`, an option key whose value is the presence CONDITION as
        // authored prose. Tri-state: key absent = no presence claim;
        // present="" = conditional, condition not stated; present="C = 1" =
        // conditional, condition stated.
        // '*' = variable-length field: fills the remainder of the current row.
        // At most one '*' per bitfield block (maintainer A):
        // '*' is "row remainder / trailing blob", not present-only-if-and-fixed
        // (use `present=`) and not multi-segment TLV (use table / description=
        // / v0.2).
        const cname=pos[1], cw=pos[2];
        if(cname!==undefined && (/^\d+$/.test(cw||'')&&+cw>=1 || cw==='*')){
          // `QUOTING-RULES`: the CLASSIC form's name is a whitespace-
          // delimited string position, so it is quoted. The compact form's
          // names are comma-delimited and stay bare (see below).
          if(!posq[1]){ err(n,'field name must be quoted in the classic form: field "'+cname+'" '+cw+' — '+Q_WHY); continue; }
          const fextra=pos[3];
          if(fextra==='optional'){ err(n,RETIRED_FIELD_OPTIONAL); continue; }
          if(fextra==='conditional'){ err(n,RETIRED_FIELD_CONDITIONAL); continue; }
          if(fextra!==undefined){ err(n,'unexpected argument "'+fextra+'"'); continue; }
          // `BITFIELD-REPETITION-CONSTRUCT`: `index=` states that this field is one element
          // of a repeated run. It is refused on a `*` field: `*` already means
          // "the length is not in the document", so "an element of unstated
          // width, n times" states nothing at all — two indeterminacies
          // multiplied, with a picture that would look like knowledge.
          if(cw==='*' && opts.index!==undefined){
            err(n,'index= does not apply to a * field: * means the length is NOT in the document, so "an element of unstated width, repeated" asserts nothing a reader could use. Give the repeated element its real width and put the range on it (field "Segment List" 128 index="0..Last Entry"), or keep * and drop index='); continue; }
          const irange=parseIndexRange(opts.index);
          if(!irange.ok){ err(n,irange.err); continue; }
          if(cw==='*'){
            if(cur.starCount){ err(n,'only one * field is allowed per bitfield (* fills the remainder of the row)'); continue; }
            cur.starCount=1;
          }
          cur.fields.push({name:cname,w:cw==='*'?'*':+cw,present:opts.present,
                           index:irange.val,
                           fill:opts.fill,stroke:opts.stroke,
                           cls:parseClassList(opts['class'],optList(optT,'class')).ids,
                           description:opts.description,line:n});
          cur.rowFields=true;
          continue;
        }
        // Compact form (C bit-field convention): field a:1,b:2,"Long Name":16
        //
        // 0.1: the list is read from `pos` — the OPTION-STRIPPED token
        // stream — not from the raw source line, so line-wide options apply
        // to every item.
        //
        // `COMMA-LIST-WHITESPACE`: the list is ONE whitespace-free token (RULE 3.1 —
        // a positional list must terminate, and whitespace is the only
        // terminator available). `field a:1, b:2` used to be accepted and is
        // now an error: one policy for every comma list in the language.
        // `QUOTING-RULES`: an ELEMENT is comma-delimited, so it is bare unless it
        // contains whitespace, a comma, a quote, a paren or `#` — and the
        // quotes now protect a comma inside the element too (`LINK-OPERATOR-IN-IDS` splitList).
        const items0=pos.slice(1);
        if(!items0.length||!items0.some(t=>t.includes(':'))){ err(n,'field needs <name> <width-in-bits>, or a name:width list'); continue; }
        // `BITFIELD-REPETITION-CONSTRUCT`: `index=` is CLASSIC-FORM ONLY in v0.1. Every
        // other `field` option is LINE-wide on the compact form, which is
        // right for presentation and for a shared condition — and wrong here:
        // one index range applied to every item in the list would say that
        // each of them repeats over the SAME indices, which is a claim no
        // author has yet wanted to make and which the drawing cannot show.
        if(opts.index!==undefined){
          err(n,'index= is not available on the compact field form — the range would apply LINE-wide, saying that every item repeats over the same indices. Write the repeated element in the classic form on its own line: field "<name>" <width> index=0..7'); continue; }
        if(items0.length>1){
          err(n,'field: the item list is ONE comma-delimited token — unexpected argument "'+items0[1]+'" (write field a:1,b:2 with no space after the comma; quote a name that contains whitespace: "Long Name":16) (MIGRATIONS)'); continue; }
        let bad=null; const parsed=[];
        for(const el of splitList(posT[1],0)){
          const it=el.v; if(!it) continue;
          const m=/^(.+):(\d+|\*)$/.exec(it);
          if(!m||(m[2]!=='*'&&+m[2]<1)){
            bad=it.includes(':')
              ? 'bad item "'+it+'" (expected name:width)'
              : 'bad item "'+it+'" (expected name:width; quote a name that contains spaces: "Long Name":16)';
            break; }
          const nm=m[1];
          // Bit-width overflow (genre doc: "beyond `word` on a NON-SPANNING
          // field"). A classic `field X 128` wider than the row is the
          // documented spanning case and stays legal; the compact form is the
          // C bit-field convention, where an item must fit its storage unit,
          // and its options are LINE-wide, so no single item in the list can
          // say "this one is meant to span". So an over-word compact item is
          // the overflow.
          if(m[2]!=='*' && +m[2]>cur.word){
            // The suggestion spells the CLASSIC form, and the classic name is
            // QUOTED (`QUOTING-RULES`). Until this release this string said
            // `write "field P 64"` — a second line error, so a user who
            // followed the diagnostic was told off twice.
            bad='"'+nm+':'+m[2]+'" is wider than word='+cur.word+' — a compact item must fit one row; write it in the classic form to span rows: field "'+nm+'" '+m[2]; break; }
          if(m[2]==='*'){
            if(cur.starCount){ bad='only one * field is allowed per bitfield (* fills the remainder of the row)'; break; }
            cur.starCount=1;
          }
          parsed.push({name:nm,w:m[2]==='*'?'*':+m[2]});
        }
        // On error, still keep any items parsed before the bad one so a
        // second `*` does not also cascade into "bitfield has no fields".
        if(parsed.length){
          // 0.1: line-wide options apply to every item in the list.
          for(const it of parsed) cur.fields.push({name:it.name,w:it.w,present:opts.present,
                                                   fill:opts.fill,stroke:opts.stroke,
                                                   cls:parseClassList(opts['class'],optList(optT,'class')).ids,
                                                   description:opts.description,line:n});
          cur.rowFields=true;
        }
        if(bad){ err(n,bad); continue; }
      } else if(cur.type==='bitfield' && kw==='break'){
        if(pos.length>1){ err(n,'unexpected argument "'+pos[1]+'"'); continue; }
        // `break` ends the row after the fields declared since the block
        // opened (or since the previous break). With none there is nothing to
        // break — genre doc: "break with no preceding field in the current row".
        // Spelled `wrap` until this release (`ROW-BREAK-NAMING`): in CSS/typography `wrap` is
        // AUTOMATIC reflow — a mode — while this is an EXPLICIT break, an
        // event; CSS Fragmentation calls exactly this "a forced break …
        // explicitly indicated by the … author" and HTML spells it `br`.
        // is a line error. A field that ends exactly on a row boundary still
        // counts: it IS the preceding field of the row being closed.
        if(!cur.rowFields){ err(n,'break has no preceding field in the current row'); continue; }
        cur.fields.push({wrap:true,line:n});
        cur.rowFields=false;
      } else if(cur.type==='table' && kw==='width'){
        if(cur.width){ err(n,'duplicate width'); continue; }
        // 0.1: `width auto,90,auto,25%` — ONE comma-delimited token —
        // is the canonical spelling; it terminates at the first whitespace
        // instead of consuming the rest of the line. The space form
        // `width auto 90 auto 25%` stays accepted (same reasoning as `rank`);
        // mixing the two on one line is an error.
        // `POSITIONAL-LIST-SPELLING`: comma form only; the space form is retired.
        const wtoks=pos.slice(1);
        if(wtoks.length>1){
          err(n,'width takes ONE comma-delimited token: write width '+joinListForm(wtoks)+' — the space form is retired (MIGRATIONS)'); continue; }
        const vals=wtoks.length?splitList(posT[1],0).map(e=>e.v):[];
        if(!vals.length){ err(n,'width needs one value per column (auto | <px> | <n>%)'); continue; }
        let badw=null;
        const parsed=vals.map(v=>{
          if(v==='auto') return {t:'auto'};
          // 0.1: a `px` SUFFIX is rejected. `pin width=90px` was
          // already an error, and RULE 4.4 says two constructs that share a
          // spelling on purpose must share the value grammar too.
          let m=/^(\d+(?:\.\d+)?)$/.exec(v);
          if(m) return {t:'px',v:+m[1]};
          m=/^(\d+(?:\.\d+)?)%$/.exec(v);
          if(m) return {t:'pct',v:+m[1]};
          badw=/^\d+(?:\.\d+)?px$/.test(v)
            ? 'bad width "'+v+'" — write the number without a unit: '+v.replace(/px$/,'')+' (auto | <px> | <n>%)'
            : 'bad width "'+v+'" (auto | <px> | <n>%)';
          return null;
        });
        if(badw){ err(n,badw); continue; }
        cur.width={vals:parsed,line:n};
      } else if(cur.type==='table' && kw==='cell'){
        // cell h<k>,<c> | <r>,<c> fill=…  (h1..hN = header tiers top-down;
        // data rows 1-based below the delimiter row);  cell <r> highlight
        // 0.1 (RULE 1.1a): a grid ADDRESS is a point, so the two-part
        // form is parenthesised — `cell (h1,2)`, `cell (3,4)`. The
        // single-valued row form (`cell 3 highlight`) is not a point and
        // stays bare, exactly as `threshold offset=50%` does.
        const cadr=pos[1]||'';
        if(/^h?\d+,\d+$/.test(cadr)){
          err(n,'cell address is now a paren point: cell ('+cadr+') — a bare comma pair is a list of two numbers, not an address (MIGRATIONS)'); continue; }
        const rc=/^\((h?)(\d+),(\d+)\)$/.exec(cadr)||/^(h?)(\d+)$/.exec(cadr);
        // `RULE-POSITION-ENUMERATION`: `highlight` is a bare keyword FLAG
        // (vocabulary-sources.tsv `cell.highlight`), so RULE 2.4 governs it
        // exactly as it governs an enum value: `cell 1 "highlight"` used to
        // be accepted and set the row mark. The index is found first so the
        // quotedness can be read off `posq` at the SAME index.
        const hli=pos.indexOf('highlight');
        if(hli>0&&posq[hli]){ err(n,ENUM_BARE('cell '+pos[1]+' highlight')); continue; }
        const hl=hli>0;
        const cextra=pos.slice(2).find(x=>x!=='highlight');
        if(cextra!==undefined){ err(n,'unexpected argument "'+cextra+'"'); continue; }
        // any §5 presentation attribute is annotation enough to address a cell
        const cpres=opts.fill!==undefined||opts.stroke!==undefined;
        if(!rc||(!cpres&&!opts['class']&&!hl)){ err(n,'cell needs [h]<row>[,<col>] with fill=…/class=… or highlight'); continue; }
        if(!rc[1]&&+rc[2]===0){ err(n,'row 0 is retired — address header tiers as h1..hN (top-down)'); continue; }
        // `ROW-HIGHLIGHT-CELL-FILL-COLLISION`: `highlight` is a ROW mark, `fill=` is a CELL
        // mark, and both paint the SAME channel — the cell interior. Written
        // for one cell they used to resolve silently, and the resolution ran
        // the wrong way: the flag was DISCARDED and never reached the model.
        // Two keys for one channel with a silent precedence is the `color=`
        // and the §8.4 `fill=`/`stroke=` defect, and this project's answer to
        // it has always been a named line error, never a precedence rule.
        if(hl&&rc[3]!==undefined){ err(n,CELL_HL_ON_CELL); continue; }
        if(hl&&rc[3]===undefined){
          if(rc[1]){ err(n,'highlight applies to data rows only'); continue; }
          cur.rowmarks=cur.rowmarks||[];
          cur.rowmarks.push({r:+rc[2],line:n});
        } else if(rc[3]!==undefined&&(cpres||opts['class'])){
          cur.marks=cur.marks||[];
          cur.marks.push({hdr:!!rc[1],r:+rc[2],c:+rc[3],fill:opts.fill,stroke:opts.stroke,
                          cls:parseClassList(opts['class'],optList(optT,'class')).ids,line:n});
        } else { err(n,'cell needs [h]<row>,<col> fill=…/class=… or <row> highlight'); }
      } else if(cur.type==='timing' && kw==='signal'){
        const name=pos[1], lane=pos[2];
        if(!name||!lane){ err(n,'signal needs <name> <lane>'); continue; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); continue; }
        // `TIMING-LANE-ALPHABET`: `2`-`9` LEFT the alphabet. WaveDrom's schema gives
        // them "value with color 2".."value with color 9" and `=` "value
        // (default color 2)", so `=` and `2` are the same brick and a
        // WaveDrom-literate reader counts every contiguous value cell as
        // needing a data entry. FigDown instead drew the digit CHARACTER as
        // the box label and consumed no entry, so `x..=3=5x data=cfg,val`
        // read as four data cells to them and as boxes cfg,3,val,5 here —
        // legal, different, and silent. Named diagnostic, not `unknown
        // character`, because the author's mental model is the thing to fix.
        if(/[2-9]/.test(lane)){ err(n,RETIRED_LANE_DIGIT); continue; }
        if(!/^[01pnx=.]+$/.test(lane)){ err(n,'lane may contain only 0 1 p n x = .'); continue; }
        //  / `TYPED-BLOCK-SILENT-FALLBACK`: data= is ABSENCE vs presence. An empty value, empty
        // members (a,b), or a count that does not match the lane's `=`
        // cells are all line errors — never silent drop or shift.
        // Spelled `labels=` until this release (`SIGNAL-DATA-KEY-SPELLING`): WaveDrom's own key is
        // `data`, "an array of signal labels" naming every value cell, and
        // after the `2`-`9` retirement (`TIMING-LANE-ALPHABET`) the two scopes coincide exactly.
        let labels;
        if(opts.data!==undefined){
          if(opts.data===''){ err(n,'data= must not be empty'); continue; }
          // `LINK-OPERATOR-IN-IDS`/2g: split on UNQUOTED commas, so a quoted
          // element protects its own comma (`data="a,b"` is ONE label).
          // Before this the tokenizer discarded quotedness before the split
          // and the language had no spelling at all for such an element.
          // Whether a data= element SHOULD be allowed to contain a comma is
          // deliberately left open (202 elements observed, 0 needing one, and
          // the construct is experimental) — this only makes it expressible.
          const parts=optList(optT,'data').map(e=>e.v);
          if(parts.some(p=>p==='')){ err(n,'data= must not contain empty members'); continue; }
          const eqN=(lane.match(/=/g)||[]).length;
          if(parts.length!==eqN){
            err(n,'data= has '+parts.length+' label'+(parts.length===1?'':'s')+', expected '+eqN+' (one per = in the lane)');
            continue;
          }
          labels=parts;
        }
        cur.signals.push({name,lane,labels,
                          fill:opts.fill,stroke:opts.stroke});
      } else if(cur.type==='timing' && kw==='gap'){
        // `TYPED-BLOCK-SILENT-FALLBACK`: integer only (no parseInt truncation of 1.5→1), no silent
        // duplicates, range checked after the block closes (needs all lanes).
        const raw=pos[1];
        if(raw===undefined||!/^\d+$/.test(raw)){ err(n,'gap needs a non-negative integer cycle'); continue; }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); continue; }
        const t=+raw;
        if(cur.gaps.some(g=>g.t===t)){ err(n,'duplicate gap at cycle '+t); continue; }
        cur.gaps.push({t,line:n});
      } else { err(n,'"'+kw+'" not valid inside '+cur.type); }
      continue;
    }
    cur=null; // any other keyword closes the block
    // Dynamic-profile reserved words keep their dedicated message (before `GENRE-KEYWORD-ALLOWLIST`).
    if(kw==='page'||kw==='set'||kw==='pulse'){
      err(n,'"'+kw+'" is reserved for the dynamic profile (not in v0.1)'); continue; }
    // `GENRE-KEYWORD-ALLOWLIST`: after closing a typed region, top-level keywords
    // must be in the header genre allowlist. Child keywords still use the
    // "needs a bitfield/table/timing above" path when they appear with no cur.
    if(sawHeader && doc.genre && GENRE_KW[doc.genre] && !CHILD_KW.has(kw) && !GENRE_KW[doc.genre].has(kw)){
      err(n,'"'+kw+'" is not allowed in genre '+doc.genre);
      continue;
    }
    if(badOpts(kw)) continue;

    // `CONTENT-LAYOUT-ZONE-SPLIT`: layout zone — after `layout`, only layout directives are legal
    if(sawLayout && !LAYOUT_DIRECTIVES.has(kw) && kw!=='layout'){
      err(n,'"'+kw+'" is a semantic directive — it must appear before the layout zone (`CONTENT-LAYOUT-ZONE-SPLIT`)');
      continue;
    }

    switch(kw){
      case 'title': {
        if(sawTitle){ err(n,'duplicate title line'); break; }
        // 0.1: the string MUST be quoted. `title` was the only
        // directive that accepted an unquoted string containing spaces —
        // `node`, `class`, `group` and `external` all report
        // `unexpected argument "…"` for the second word — and the
        // rest-of-line form carried three defects of its own: a title
        // could never contain a `#` (the comment scanner cut it), inner
        // quotes ended up inside the value, and escapes resolved ONLY in
        // the quoted form, so `title A\nB` and `title "A\nB"` produced
        // different values for the same visible text. One form, one
        // meaning: the token is a normal quoted string and the generic
        // tokenizer above has already resolved its escapes.
        const t0=tk.toks[1];
        if(!t0||!t0.q){ err(n,'title needs a quoted string: title "<text>" (MIGRATIONS)'); break; }
        if(tk.toks.length>2){ err(n,'unexpected argument "'+tk.toks[2].v+'"'); break; }
        doc.title=t0.v; sawTitle=true; break;
      }
      case 'class': {
        // semantic class (`CATEGORICAL-MEANING-MAPPING`): meaning + presentation defaults declared
        // once; elements join via class=<id>; the legend strip derives
        const id=pos[1];
        { const e=idErr(id,posq[1],'class needs an id'); if(e){ err(n,e); break; } }
        if(classIds.has(id)){ err(n,'duplicate class "'+id+'"'); break; }
        // 0.1 (`CLASS-EMPTY-MEANING`): the meaning field is syntactically MANDATORY and
        // its value may be EMPTY — the language's own absent/""/"text"
        // tri-state (`EMPTY-LABEL-STATE`, `EMPTY-LABEL-DIRECTIVE-COVERAGE`), the same rule labels already follow.
        //   class x            -> line error (the field is missing)
        //   class x ""         -> legal; the author claims NO meaning, so the
        //                         class is pure attribute grouping and draws
        //                         no legend entry
        //   class x "Hot path" -> legal; the entry is drawn
        // The test is ABSENCE, never truthiness: `!pos[2]` treated `""` as
        // missing, which is exactly the collapse `EMPTY-LABEL-STATE` exists to prevent.
        if(pos[2]===undefined){ err(n,'class needs a meaning: class '+id+' "<meaning>" (write "" to declare no meaning: the class then groups attributes only and draws no legend entry)'); break; }
        if(!posq[2]){ err(n,'class meaning must be quoted: class '+id+' "'+pos[2]+'" — '+Q_WHY); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        classIds.add(id);
        // `plane=` on a class is the members' default plane (an element's own
        // plane= wins, rigidity `LAYOUT-STABILITY`) — the class carries all five §5 attributes.
        doc.classes.push({id,label:pos[2],fill:opts.fill,stroke:opts.stroke,
                          style:opts.style,plane:opts.plane,line:n});
        break;
      }
      case 'plane': {
        const id=pos[1];
        { const e=idErr(id,posq[1],'plane needs an id'); if(e){ err(n,e); break; } }
        if(planeIds.has(id)){ err(n,'duplicate plane id "'+id+'"'); break; }
        if(pos[2]!==undefined&&!posq[2]){ err(n,'plane label must be quoted: plane '+id+' "'+pos[2]+'" — '+Q_WHY); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        // 0.1: `z=` -> `z-index=` (CSS's own spelling for the
        // stacking concept, taken in full per RULE 4.2). The retired `z=`
        // is caught language-wide in RETIRED_OPT_KEYS before this runs.
        let z=doc.planes.length;
        const zi=opts['z-index'];
        if(zi!==undefined){
          if(!/^-?\d+$/.test(zi)){ err(n,'z-index must be a number'); break; }
          z=parseInt(zi,10);
        }
        planeIds.add(id);
        // `EMPTY-LABEL-STATE`: absent is absent, `""` is a written value — same
        // non-collapsing form as node/group/bundle and the typed blocks.
        doc.planes.push({id,label:pos[2]!==undefined?pos[2]:null,z});
        break;
      }
      // `FLOWCHART-ROLE-KEYWORDS`: `process` / `decision` / `terminator` DESUGAR to
      // `node` plus a `role` field. One case, four spellings, so there is
      // exactly one place where a node is built and no second id namespace:
      // a role line shares the node/group/external/typed-block id space and
      // is addressable by `edge`, `pin` and `rank` like any node.
      //
      // A bare `node` under `flowchart` stays ROLE-UNSTATED — it does NOT
      // default to `process`. `UNSAFE-DEFAULT-ELIMINATION` §3: a default is legitimate only when
      // being wrong is harmless, and a flowchart node may be a datastore, an
      // annotation or a state, so `role:"process"` by default would let the
      // model assert a falsehood the figure cannot be inspected to catch.
      case 'process': case 'decision': case 'terminator':
      case 'node': {
        const role=kw==='node'?null:kw;
        const id=pos[1];
        { const e=idErr(id,posq[1],kw+' needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(opts.width!==undefined||opts.height!==undefined){ err(n,kw+' does not take width=/height= — use a pin line'); break; }
        // Geometry is DERIVED from the role, and `shape=` overrides the
        // DRAWING only. §12.7: presentation is not meaning on its own, so
        // `decision q "…" shape=box` is still a decision in the model — the
        // role is the model, the shape is how it happens to be drawn.
        const shape=opts.shape||(role?ROLE_SHAPE[role]:'box');
        if(RETIRED_SHAPES[shape]){ err(n,RETIRED_SHAPES[shape]); break; }
        if(!SHAPES.includes(shape)){ err(n,'unknown shape "'+shape+'" ('+SHAPES.join('|')+')'); break; }
        if(pos[2]!==undefined&&!posq[2]){ err(n,kw+' label must be quoted: '+kw+' '+id+' "'+pos[2]+'" — '+Q_WHY); break; }
        nodeIds.add(id);
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        // `OMITTED-LABEL-RECORDING`: an omitted label is recorded as ABSENT (null), never silently
        // replaced by the id — a reading agent must be able to tell "the author
        // wrote no label" from "the author's label happens to equal the id".
        // Display falls back to the id in render(), so the figure is unchanged.
        doc.nodes.push({id,label:pos[2]!==undefined?pos[2]:null,shape,role,fill:opts.fill,stroke:opts.stroke,
                        style:opts.style,cls:parseClassList(opts['class'],optList(optT,'class')).ids,
                        group:opts['in']||null,plane:opts.plane||'base',line:n});
        break;
      }
      case 'group': {
        const id=pos[1];
        { const e=idErr(id,posq[1],'group needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(pos[2]!==undefined&&!posq[2]){ err(n,'group label must be quoted: group '+id+' "'+pos[2]+'" — '+Q_WHY); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        groupIds.add(id);
        let ggap;
        if(opts.gap!==undefined){
          // the numeric-value rule: exact number grammar (non-negative, including 0 for flush)
          if(!/^\d+(\.\d+)?$/.test(opts.gap)){ err(n,'gap must be a non-negative number'); break; }
          ggap=parseFloat(opts.gap);
          if(!isFinite(ggap)||ggap<0){ err(n,'gap must be a non-negative number'); break; }
        }
        doc.groups.push({id,label:pos[2]!==undefined?pos[2]:null,fill:opts.fill,stroke:opts.stroke,
                         style:opts.style,gap:ggap,cls:parseClassList(opts['class'],optList(optT,'class')).ids,
                         plane:opts.plane||null,line:n});
        break;
      }
      case 'external': {
        // external I/O endpoint (`EXTERNAL-EDGE-ENDPOINTS`): "the outside world", not a
        // participant node. Referenced by edges like a node, pinnable for
        // layout, NEVER drawn as a shape — the edge simply ends open at an
        // invisible anchor, optionally with the small label beyond the end.
        // Shares the node/group/block id namespace. Of the §5 attributes it
        // can carry only the two that need no drawn shape: `text=` (the label
        // colour) and `plane=` (organizational, exactly as on a node).
        // Spelled `boundary` until this release (`EXTERNAL-ENDPOINT-NAMING`): three standards claim that
        // word for the OPPOSITE meaning (UML ECB «boundary» is an internal
        // interface object, C4 System_Boundary is a dashed grouping container,
        // BPMN's is an event), and this spec's own prose had already stopped
        // using it — §2.8 says "declares an external I/O endpoint".
        const id=pos[1];
        { const e=idErr(id,posq[1],'external needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(pos[2]!==undefined&&!posq[2]){ err(n,'external label must be quoted: external '+id+' "'+pos[2]+'" — '+Q_WHY); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        boundaryIds.add(id);
        // `EMPTY-LABEL-STATE`: the `OMITTED-LABEL-RECORDING` batch never converted this line; `pos[2]||undefined`
        // collapsed an explicitly empty label into absence. Same form as the
        // other eight label-bearing directives now.
        doc.boundaries.push({id,label:pos[2]!==undefined?pos[2]:null,plane:opts.plane,line:n});
        break;
      }
      case 'flow': {
        if(sawFlow){ err(n,'duplicate flow line'); break; }
        // `RULE-POSITION-ENUMERATION`: `flow.direction` is an enum position — bare.
        if(posq[1]){ err(n,ENUM_BARE('flow '+pos[1])); break; }
        if(!['right','down','left','up'].includes(pos[1])){ err(n,'flow needs right|down|left|up'); break; }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        doc.flow=pos[1]; sawFlow=true; break;
      }
      case 'rank': {
        // 0.1: `rank a,b,c` — ONE comma-delimited token — is the
        // canonical spelling. It terminates at the first whitespace, so the
        // rest of the line stays free for future `key=` options, and it reads
        // as one list rather than as a directive whose arity is "the rest of
        // the line". The space form `rank a b c` is NOT deprecated and stays
        // accepted: options are extracted by shape (`key=`) from anywhere on
        // the line, so the space form blocks only a trailing bare positional.
        // Migration cost of the comma form is zero — it was unreachable
        // before (a comma-bearing id is not a legal id), so no document can
        // have used it. Mixing the two spellings on one line is an error.
        // `QUOTED-IDS`: the elements are read quote-aware, so
        // `rank "a",b` reports the ID RULE instead of the old — and simply
        // wrong — "do not mix the comma form with the space form", which
        // fired because the lexer split `"a",b` into two tokens.
        // `POSITIONAL-LIST-SPELLING` REVERSES `POSITIONAL-LIST-SPELLING`'s disposition: the SPACE form is
        // retired and `rank a,b,c` is the only spelling. `POSITIONAL-LIST-SPELLING` kept both on a
        // measured migration cost (360 downstream lines, 25 local); the
        // maintainer has since ruled that cost is not a language argument
        // before the freeze, and `POSITIONAL-LIST-SPELLING`'s own words concede the change is "a
        // notation-only improvement" — while the notation IS the language.
        // Two spellings of one meaning give a generating model two attractors
        // (`PRIOR-ART-BORROWING`), and this pair is the worst of the three because `bundle`
        // could not even detect a half-converted line.
        const rtoks=pos.slice(1), rT=posT.slice(1);
        if(rtoks.length>1){
          err(n,'rank takes ONE comma-delimited token: write rank '+joinListForm(rtoks)+' — the space form is retired (MIGRATIONS)'); break; }
        const rels=rtoks.length?splitList(rT[0],0):[];
        let badr=null;
        for(const e of rels){
          const m2=idErr(e.v,e.h,'rank ids must not be empty (write rank a,b,c)');
          if(m2){ badr=m2; break; }
        }
        if(badr){ err(n,badr); break; }
        const ids=rels.map(e=>e.v);
        if(ids.length<2){ err(n,'rank needs two or more node ids'); break; }
        doc.ranks.push({ids,line:n}); break;
      }
      case 'bundle': {
        // semantic link bundle (LAG / Ethernet Segment): the renderer draws
        // the dashed ellipse around the member links automatically
        const id=pos[1];
        { const e=idErr(id,posq[1],'bundle needs an id'); if(e){ err(n,e); break; } }
        if(bundleIds.has(id)){ err(n,'duplicate bundle id "'+id+'"'); break; }
        // `OPTION-POSITION-PARSING`: quotedness is tested `pos`-aligned (posq), so an option may
        // precede the label exactly as it may on node/group/class/plane.
        let restT=posT.slice(2), tlabel=null;   // `OMITTED-LABEL-RECORDING`: absent label stays absent
        if(posq[2]){ tlabel=pos[2]; restT=posT.slice(3); }
        // 0.1 (EXPERIMENTAL, `bundle` is a demoted construct):
        // the member list may be ONE comma-delimited token —
        // `bundle t1 "LAG" a--b,c--d` — so it terminates at whitespace
        // instead of resting entirely on the `A--B` shape test. The
        // whitespace-separated form stays accepted, including the trailing
        // comma per token (`a--b, c--d`) that the old member regex already
        // tolerated and that local documents already use; that tolerance is
        // why `bundle` — unlike `rank` and `width` — cannot reject "mixing":
        // the two spellings were never distinguishable here.
        //
        // `LINK-OPERATOR-IN-IDS`: a member is SPLIT on `--`, not matched by a
        // greedy two-id regex. With `--` banned inside an id the split is
        // total: exactly two parts, each a legal id, or the line is an
        // error. `a-x--b` no longer silently picks one of two readings.
        // `POSITIONAL-LIST-SPELLING`: comma form only; the space form is retired. It
        // is now detectable — a second positional token after the label is
        // the half-converted line the old tolerance could not report.
        if(restT.length>1){
          err(n,'bundle members take ONE comma-delimited token: write bundle '+id+(tlabel===null?'':' "'+tlabel+'"')+' '+joinListForm(restT.map(t=>t.v))+' — the space form is retired (MIGRATIONS)'); break; }
        const pairs=[]; let badp=null;
        outerB:
        for(const t of restT){
          for(const s of splitList(t,0)){
            const mem=s.v.trim(); if(!mem) continue;
            if(s.h){ badp=ID_RULE; break outerB; }
            const parts=mem.split('--');
            if(parts.length!==2||!isId(parts[0])||!isId(parts[1])){
              badp='bad member "'+mem+'" (expected A--B)'; break outerB; }
            pairs.push([parts[0],parts[1]]);
          }
        }
        if(badp){ err(n,badp); break; }
        if(!pairs.length){ err(n,'bundle needs at least one member link A--B'); break; }
        bundleIds.add(id);
        // §5 on the derived ring: `fill=` stays the ring colour (stroke +
        // label) as before, `stroke=`/`text=` split it, `style=` picks the
        // dash (the conventional default is dashed), `plane=` orders this
        // ring against the other rings.
        doc.trunks.push({id,label:tlabel,pairs,stroke:opts.stroke,
                         style:opts.style,plane:opts.plane,line:n});
        break;
      }
      case 'threshold': {
        // horizontal threshold marker across the target's box:
        // threshold "<label>" in=<group|node> offset=<0..100>%
        // Spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`): in every
        // vector editor a "guide" is an author-only construction line that is
        // never rendered, so the name was inverted; `threshold` is Grafana's,
        // with IETF RED/AQM min_th/max_th as the secondary source.
        // The target may be a GROUP or a single NODE, exactly like `band`
        // (§2.6: scope follows the meaning, `AUTHORING-INTENT-OVER-RENDERING`) — the pair is symmetric.
        // `OPTION-POSITION-PARSING`: `pos`-aligned quotedness — `threshold in=a "Thr" offset=50%`
        // is legal.
        // 0.1 (`THRESHOLD-VALUE-SCOPE`): NO `value=` and NO `ref=`. Zero corpus figures
        // carry a literal numeric value — every reference is a named
        // software-configurable register, and the name already lives in the
        // mandatory label. A second carrier has no demonstrated need.
        const glabel=posq[1]?pos[1]:null;
        if(glabel===null){ err(n,'threshold needs a quoted "<label>" first'); break; }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        if(!opts['in']){ err(n,'threshold needs in=<node-or-group-id>'); break; }
        // 0.1: `at=` -> `offset=`. `at=` carried TWO value shapes —
        // a point in canvas px on `pin`, a percentage here — and no reader
        // can predict which applies without knowing the directive (RULE
        // 4.3). SVG already spells "a position along an extent, as a
        // percentage" `offset` (on <stop>), which is the same source the
        // paint keys come from, so nothing is invented.
        if(opts.at!==undefined){
          err(n,'threshold at= has been renamed: use offset=<0..100>% (at= is the pin POINT in canvas px; SVG spells a position along an extent "offset") (MIGRATIONS)'); break; }
        const m=/^(\d+(?:\.\d+)?)%$/.exec(opts.offset||'');   // % is mandatory (`BARE-FRACTION-VALUES`)
        if(!m||+m[1]<0||+m[1]>100){ err(n,'threshold needs offset=<0..100>% (with the % sign)'); break; }
        // §5: `stroke=` is the marker colour, `color=` the label colour,
        // `style=` picks the dash (default dashed), `plane=` orders this
        // marker against the other markers.
        doc.thresholds.push({label:glabel,target:opts['in'],pct:+m[1],
                         stroke:opts.stroke,style:opts.style,
                         plane:opts.plane,line:n});
        break;
      }
      case 'chart': {
        // chart family: chart <table-id> [type=bar3d]
        // rows -> X, columns -> Y, numeric cells -> Z (the table IS the data)
        // Spelled `plot` with `kind=bars3d` until this release (`CHART-BLOCK-NAMING`).
        // 0.1 (`CHART-LEVEL-KEY`): `level=` is DELETED. Zero uses corpus-wide, zero
        // 3-D bar charts, zero requests; one in-repo example and two fixtures.
        // It was the only construct whose caption the ENGINE wrote rather than
        // the author, and its parseFloat grammar uniquely accepted `1e3`,
        // breaking the otherwise-uniform \d+(\.\d+)? numeric grammar. The
        // retirement message lives in RETIRED_OPT_KEYS.
        const tid=pos[1];
        { const e=idErr(tid,posq[1],'chart needs a table id'); if(e){ err(n,e); break; } }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        const ptype=opts.type||'bar3d';
        if(ptype!=='bar3d'){ err(n,'unknown chart type "'+ptype+'" (bar3d)'); break; }
        // NB: the block discriminator is already `type`, so the chart-type
        // value is stored as `ctype` and surfaced in the model as `type`.
        doc.blocks.push({type:'chart',id:'chart_'+doc.blocks.length,tid,ctype:ptype,line:n});
        break;
      }
      case 'band': {
        // zone band: band "<label>" <pct>% | <a>..<b>%  in=<node|group> [extend=]
        // "band 15%" = 0..15; "band 15..35%" = the range in one token
        if(opts.from!==undefined||opts.to!==undefined){ err(n,'from=/to= retired — write the range positionally: band "<label>" 15% or band "<label>" 15..35%'); break; }
        // 0.1 (`BAND-LABEL-STATUS`): the label is MANDATORY and QUOTED. Until now
        // `band` had no label slot at ALL, so its complete model was
        // {target, from, to, extend, fill, line}; strip `fill=`, which §5/`PRESENTATION-AS-MEANING-CARRIER`
        // entitle a reader to discard, and a band asserted NOTHING — its
        // meaning rode on colour alone, which §5 declares must never happen.
        // Every interval region in the measured corpus is a NAMED one
        // (Headroom/Share/Guarantee, Latency/Block/Transmit, G/Y/R), and the
        // buffer-region figure was forced to carry those names in three
        // `class` declarations all literally spelled "region".
        // The label comes FIRST — the position every other labelled directive
        // in the language puts it in (`node`, `group`, `external`, `bundle`,
        // `threshold`), so one reader rule covers the whole vocabulary and
        // the sibling pair `threshold "X" in=… ` / `band "X" 15..35% in=…`
        // reads the same way. `OPTION-POSITION-PARSING` quotedness is `pos`-aligned, so an option
        // may still precede it.
        const flabel=posq[1]?pos[1]:null;
        if(flabel===null){ err(n,'band needs a quoted "<label>" first: band "<name>" <a>..<b>% in=<node-or-group-id> (a band with no label asserts nothing a reader may keep — fill= is presentation, and §5 forbids meaning riding on colour alone) (MIGRATIONS)'); break; }
        if(!opts['in']){ err(n,'band needs in=<node-or-group-id>'); break; }
        // 0.1: the `%` is MANDATORY, matching `threshold offset=` (`BARE-FRACTION-VALUES`).
        // `band 15`, `band 15-35` and `band 15%-35` all parsed before (the
        // separator was a hyphen until this release); one concept in one
        // document must not have two value grammars (RULE 4.4).
        // `RANGE-SPELLING`: the separator is `..`, and the HYPHEN form it
        // replaces gets its own named diagnostic. `15-35%` reads as
        // subtraction, and it was the language's SECOND range spelling — the
        // first being `index=` (`BITFIELD-REPETITION-CONSTRUCT`, same release), which is single-sourced
        // from Ada (ISO/IEC 8652 `1 .. 10`) and Pascal (ISO 7185
        // `array [1..10]`), both inclusive, with X.680's `SIZE(1..4)` already
        // cited by `bitfield`. `band` is EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`), so no
        // compatibility promise is owed; the diagnostic is owed anyway.
        if(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%$/.test(pos[2]||'')){
          err(n,'the hyphen range "'+pos[2]+'" is no longer the spelling: write band "'+flabel+'" '+String(pos[2]).replace('-','..')+' in=… — FigDown has ONE range grammar, "..", and a hyphen between two numbers reads as subtraction (MIGRATIONS)'); break; }
        const m=/^(\d+(?:\.\d+)?)%$|^(\d+(?:\.\d+)?)\.\.(\d+(?:\.\d+)?)%$/.exec(pos[2]||'');
        if(!m){ err(n,'band needs a range with the % sign: band "<label>" <pct>% or band "<label>" <a>..<b>%'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        const from=m[1]!==undefined?0:+m[2];
        const to=m[1]!==undefined?+m[1]:+m[3];
        if(from<0||to>100||from>=to){ err(n,'band range needs 0 <= from < to <= 100'); break; }
        // 0.1: `dir=` -> `extend=` (`UNSAFE-DEFAULT-ELIMINATION`: `dir` is HTML's text writing
        // direction; this says which way the band extends from its anchor).
        const fdir=opts.extend||'up';
        if(!['up','down','left','right'].includes(fdir)){ err(n,'extend must be up|down|left|right'); break; }
        // §5: `fill=` is the band fill; `stroke=` and/or `style=` draw the
        // band outline; `color=` is the label colour (with the
        // label); `plane=` orders this band against the other bands.
        doc.bands.push({label:flabel,target:opts['in'],from,to,dir:fdir,fill:opts.fill||'#e5e7eb',
                        stroke:opts.stroke,style:opts.style,plane:opts.plane,line:n});
        break;
      }
      // `ELEMENT-GEOMETRY-DIRECTIVE`: ONE directive for an element's declared geometry.
      // `at=` places it, `width=`/`height=` extend it; all three are optional
      // and at least one is required, because a `pin` line that declares
      // nothing is not a weaker constraint — it is a typo.
      case 'pin': {
        const id=pos[1], at=opts.at;
        const PIN_SHAPE='pin needs <id> and at=(<x>,<y>) and/or width=<px> and/or height=<px>';
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        // the numeric-value rule: value grammar is exactly -?\d+(\.\d+)? per component —
        // no scientific notation, no trailing junk, no multi-dot.
        // Negative values stay legal (canvas can place off-origin).
        { const e=idErr(id,posq[1],null); if(e){ err(n,e); break; } }
        if(!id){ err(n,PIN_SHAPE); break; }
        // 0.1 (RULE 1.1a): the pair is PARENTHESISED — at=(x,y).
        if(at!==undefined&&/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(at)){
          err(n,'pin at= now takes a paren point: at=('+at+') — a bare comma pair is a list of two numbers, not a point (MIGRATIONS)'); break; }
        const m=at===undefined?null:/^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/.exec(at);
        // A WRITTEN `at=` that does not parse is its own error, never the
        // whole-line shape message: the author declared a point and got the
        // point wrong, and telling them the line "needs an id" hides that.
        if(at!==undefined&&!m){ err(n,'pin at= needs a paren point: at=(<x>,<y>)'); break; }
        let badsz=false;
        const dim=(k)=>{                       // px only (`NON-NUMERIC-EXTENT`/`PERCENT-VALUES-LOST`)
          const v=opts[k]; if(v===undefined) return null;
          if(v===''){ err(n,k+' must be a positive number (px)'); badsz=true; return null; }
          if(/%$/.test(v)){ err(n,'percentage sizes are not in v0.1 — use px'); badsz=true; return null; }
          // 0.1 (RULE 4.4): the `width` KEYWORD and the `width=`
          // OPTION share one unit grammar — a bare number in px, `<n>%`, or
          // `auto`. `%` and `auto` are outside v0.1 SCOPE on `pin` (a node
          // has no containing extent for a percentage to resolve against,
          // and `auto` is what an absent extent already means), so each gets
          // its own named diagnostic instead of the generic number message.
          if(v==='auto'){ err(n,k+'=auto is the default — omit the key (a node with no width=/height= is already auto-sized)'); badsz=true; return null; }
          // the numeric-value rule: exact grammar \d+(\.\d+)? — rejects em/px suffixes,
          // hex (0x10), scientific notation, negatives, and zero. `at=`
          // keeps negatives; an extent is a box dimension and must be positive.
          if(!/^\d+(\.\d+)?$/.test(v)){ err(n,k+' must be a positive number (px)'); badsz=true; return null; }
          const f=parseFloat(v);
          if(!isFinite(f)||f<=0){ err(n,k+' must be a positive number (px)'); badsz=true; return null; }
          return f;
        };
        const w=dim('width'), h=dim('height');
        if(badsz) break;
        // Declares nothing: no position and no extent (§3, `ELEMENT-GEOMETRY-DIRECTIVE`).
        if(!m&&w===null&&h===null){ err(n,PIN_SHAPE); break; }
        // single-valued PER ID (`REPEATED-DIRECTIVE-HANDLING` / ): `pin a` + `pin b` is fine,
        // `pin a` twice is a line error — one element cannot sit at two
        // places or carry two extents, and last-wins would silently delete
        // whichever keys the second line omitted.
        if(doc.pins[id]!==undefined){ err(n,'duplicate pin for "'+id+'"'); break; }
        doc.pins[id]={fx:m?parseFloat(m[1]):null,fy:m?parseFloat(m[2]):null,w,h,line:n};
        break;
      }
      case 'layout': {
        if(sawLayout){ err(n,'duplicate layout line'); break; }
        if(pos.length>1){ err(n,'layout takes no arguments'); break; }
        sawLayout=true; break;
      }
      case 'bitfield': {
        const id=pos[1];
        { const e=idErr(id,posq[1],'bitfield needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(BLK_LBL(n,kw,id,pos,posq)) break;
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        blockIds.add(id);
        // §5 on a typed block: `fill=` is the default cell fill, `stroke=`
        // the cell border colour, `text=` the block caption colour.
        // `TYPED-BLOCK-SILENT-FALLBACK`: word= empty or non-integer was a silent fallback/truncation
        // (word= → 32, word=8.5 → 8). Positive integer only; absence → 32.
        // Spelled `unit=` until this release (`BITS-PER-ROW-KEY-NAMING`).
        let word=32;
        if(opts.word!==undefined){
          if(opts.word===''||!/^\d+$/.test(opts.word)||+opts.word<1){
            err(n,'word must be a positive integer');
            word=32; // keep a usable value so field lines still check
          } else word=+opts.word;
        }
        cur={type:'bitfield',id,label:pos[2]!==undefined?pos[2]:null,word,
             numbering:opts.numbering||'lsb0',fields:[],starCount:0,
             fill:opts.fill,stroke:opts.stroke,
             cls:parseClassList(opts['class'],optList(optT,'class')).ids,line:n};
        // 0.1: `numbering=` is REQUIRED — there is no default. Unlike an
        // absent label (which has a harmless rendering fallback), bit-numbering
        // direction has no harmless fallback: whichever value were defaulted,
        // the other half of the corpus would silently render a ruler that
        // asserts something false. Bit numbering is meaning, and under `MEANING-RECOVERY-SOURCE`
        // meaning comes from syntax, never from a silent default. The block
        // still opens (with the old lsb0 behaviour) so the `field` lines below
        // report their own problems in the same pass.
        if(opts.numbering===undefined) err(n,'bitfield requires numbering= (lsb0 or msb0)');
        else if(!['lsb0','msb0'].includes(cur.numbering)) err(n,'numbering must be lsb0 or msb0');
        doc.blocks.push(cur); break;
      }
      case 'table': {
        const id=pos[1];
        { const e=idErr(id,posq[1],'table needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(BLK_LBL(n,kw,id,pos,posq)) break;
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        blockIds.add(id);
        cur={type:'table',id,label:pos[2]!==undefined?pos[2]:null,cols:[],heads:[],rows:[],
             fill:opts.fill,stroke:opts.stroke,
             cls:parseClassList(opts['class'],optList(optT,'class')).ids,line:n};
        doc.blocks.push(cur); break;
      }
      case 'timing': {
        const id=pos[1];
        { const e=idErr(id,posq[1],'timing needs an id'); if(e){ err(n,e); break; } }
        if(dupId(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(BLK_LBL(n,kw,id,pos,posq)) break;
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        blockIds.add(id);
        cur={type:'timing',id,label:pos[2]!==undefined?pos[2]:null,signals:[],gaps:[],
             fill:opts.fill,stroke:opts.stroke,
             cls:parseClassList(opts['class'],optList(optT,'class')).ids,line:n};
        doc.blocks.push(cur); break;
      }
      // `step` was released: the §6 dynamic sketch uses
      // `page`/`set`/`pulse` only, and no genre claimed the word.
      case 'page': case 'set': case 'pulse':
        err(n,'"'+kw+'" is reserved for the dynamic profile (not in v0.1)'); break;
      case 'field': case 'break': case 'cell': case 'width': case 'signal': case 'gap':
        err(n,'"'+kw+'" is a typed-block child — it needs a bitfield/table/timing block above it'); break;
      default:
        err(n,'unrecognized line (unknown keyword "'+kw+'")');
    }
  }
  if(!sawHeader && text.trim()) { /* already reported on first content line */ }

  // semantic checks
  for(const nd of doc.nodes){
    if(nd.group && !groupIds.has(nd.group)) errs.push('Line '+nd.line+': unknown group "'+nd.group+'"');
    if(nd.plane && !planeIds.has(nd.plane)) errs.push('Line '+nd.line+': unknown plane "'+nd.plane+'"');
  }
  for(const g of doc.groups){
    if(g.plane && !planeIds.has(g.plane)) errs.push('Line '+g.line+': unknown plane "'+g.plane+'"');
  }
  for(const e of doc.edges){
    if(!nodeIds.has(e.a)&&!groupIds.has(e.a)&&!boundaryIds.has(e.a)) errs.push('Line '+e.line+': unknown endpoint "'+e.a+'"');
    else if(groupIds.has(e.a)) errs.push('Line '+e.line+': edge endpoint "'+e.a+'" is a group — connect to a member node (group edges are not in v0.1)');
    if(!nodeIds.has(e.b)&&!groupIds.has(e.b)&&!boundaryIds.has(e.b)) errs.push('Line '+e.line+': unknown endpoint "'+e.b+'"');
    else if(groupIds.has(e.b)) errs.push('Line '+e.line+': edge endpoint "'+e.b+'" is a group — connect to a member node (group edges are not in v0.1)');
    if(e.plane && !planeIds.has(e.plane)) errs.push('Line '+e.line+': unknown plane "'+e.plane+'"');
  }
  for(const r of doc.ranks) for(const id of r.ids)
    if(!nodeIds.has(id)) errs.push('Line '+r.line+': unknown node "'+id+'" in rank');
  for(const gl of doc.thresholds)
    if(!groupIds.has(gl.target)&&!nodeIds.has(gl.target))
      errs.push('Line '+gl.line+': unknown target "'+gl.target+'" for threshold');
  for(const f of doc.bands)
    if(!groupIds.has(f.target)&&!nodeIds.has(f.target))
      errs.push('Line '+f.line+': unknown target "'+f.target+'" for band');
  for(const t of doc.trunks) for(const [a,b] of t.pairs){
    if((!nodeIds.has(a)&&!boundaryIds.has(a))||(!nodeIds.has(b)&&!boundaryIds.has(b))){ errs.push('Line '+t.line+': unknown endpoint in "'+a+'--'+b+'"'); continue; }
    const matches=doc.edges.filter(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)).length;
    if(matches===0)
      errs.push('Line '+t.line+': no edge between "'+a+'" and "'+b+'" for bundle member');
    else if(matches>1)
      errs.push('Line '+t.line+': "'+a+'--'+b+'" is ambiguous ('+matches+' parallel edges); parallel edges are out of scope for v0.1');
  }
  // `ELEMENT-GEOMETRY-DIRECTIVE`: `pin` has a SPLIT DOMAIN, and both halves are checked
  // here because both need the finished id sets.
  //   at=              nodes, groups and external endpoints;
  //   width=/height=   nodes ONLY — a group sizes to its members (D2 reached
  //                    the same conclusion independently), and an external
  //                    endpoint or a typed block derives its geometry from
  //                    its content, so an extent there is a claim the
  //                    renderer cannot honour. Silently ignoring it was the
  //                    0.1 defect; each now names its own subject.
  for(const id in doc.pins){
    const p=doc.pins[id];
    if(p.w!==null||p.h!==null){
      if(groupIds.has(id)){
        errs.push('Line '+p.line+': pin width=/height= do not apply to group "'+id+'" — groups size to their members'); continue; }
      if(boundaryIds.has(id)){
        errs.push('Line '+p.line+': pin width=/height= do not apply to external endpoint "'+id+'" — its geometry derives from its content'); continue; }
      const blk=doc.blocks.find(b=>b.id===id);
      if(blk){
        errs.push('Line '+p.line+': pin width=/height= do not apply to the '+blk.type+' block "'+id+'" — its geometry derives from its content'); continue; }
    }
    if(!nodeIds.has(id)&&!groupIds.has(id)&&!boundaryIds.has(id))
      errs.push('Line '+p.line+': pin of unknown id "'+id+'"');
  }
  { // 0.1 (§8.4), the class-mediated half. Rejecting `fill=` on the
    // `edge` LINE is not enough on its own: before this release the edge
    // renderer read `e.stroke||e.fill`, so a class carrying only `fill=`
    // painted edges through the fill channel, and `fill=` would have gone on
    // meaning "an edge's colour" by the back door.
    //
    // A class is a bundle of channel defaults for HETEROGENEOUS members, so
    // the rule is per channel, not per class: `fill` applies to members that
    // HAVE an interior and is inapplicable to those that do not. One class
    // can therefore still carry one meaning for both — `class hot "…"
    // fill=#fee2e2 stroke=#dc2626` paints the box of a node member and the
    // line of an edge member, with no key meaning two things and no second
    // legend entry for one meaning (`CATEGORICAL-MEANING-MAPPING`).
    //
    // What is forbidden is the case that would be SILENT: a class that sets
    // `fill=` and no `stroke=`, used by an edge. Ignoring it would drop the
    // edge's colour with nothing to warn on; honouring it would make `fill`
    // mean "stroke" for that member. So it is a line error that names the
    // key to add. `edge` is the only interior-less construct taking `class=`.
    //
    // 0.1 (`CLASS-PAINT-REQUIREMENT`): the SAME hole sat one key over and was left open.
    // 0.1 rejected `fill=`-only and said nothing about a class that
    // paints NEITHER channel — `class p "Path" color=#dc2626` plus `edge a ->
    // b class=p` was accepted, drew a #555 line, and rendered a legend swatch
    // that showed nothing, so the class's meaning was invisible in its own
    // derived legend. With `color=` retired (`COLOUR-KEY-STATUS`) the remaining shape of the
    // hole is a class carrying only `style=` and/or `plane=`, or nothing at
    // all: the edge silently takes the default colour and the author who
    // declared a class to CLASSIFY the edge gets no colour and no warning.
    // Both halves are the same rule — a class an edge joins must declare at
    // least one channel an edge HAS — so they share one diagnostic shape.
    // An edge has exactly two: `stroke` (its colour) and `style` (its dash).
    // `style=`-only is therefore FINE and must stay fine: the dash reaches the
    // edge, nothing is lost, and it is how a multi-class cascade splits one
    // meaning across two declarations (`class=hot,deprecated`). The test is
    // per class, per channel — the same shape `INTERIOR-LESS-ELEMENT-PAINT` chose, for the same reason.
    for(const e of doc.edges) for(const cid of (e.cls||[])){
      const c=doc.classes.find(x=>x.id===cid);
      if(!c||c.stroke!==undefined) continue;
      if(c.fill===undefined&&c.style!==undefined) continue;
      if(c.fill!==undefined)
        errs.push('Line '+e.line+': class "'+cid+'" sets fill= but no stroke=, and an edge has no interior — add stroke= to the class (it paints the edge; fill= keeps painting members that have an interior) (MIGRATIONS)');
      else
        errs.push('Line '+e.line+': class "'+cid+'" declares no channel an edge has — add stroke= (an edge has only stroke= and style=: no interior, and v0.1 has no label-colour key). Without one the edge takes the default colour and the class shows nothing in the legend (MIGRATIONS)');
    }
  }
  { // class references must resolve (closed grammar)
    const chk=(cls,line)=>{
      if(cls===undefined||cls===null) return;
      const ids=Array.isArray(cls)?cls:[cls];
      for(const id of ids) if(!classIds.has(id))
        errs.push('Line '+line+': unknown class "'+id+'"');
    };
    for(const x of doc.nodes) chk(x.cls,x.line);
    for(const x of doc.groups) chk(x.cls,x.line);
    for(const x of doc.edges) chk(x.cls,x.line);
    for(const b of doc.blocks){
      if(b.fields) for(const f of b.fields) chk(f.cls,f.line);
      if(b.marks)  for(const mk of b.marks) chk(mk.cls,mk.line);
      chk(b.cls,b.line);
    }
  }
  for(const b of doc.blocks){
    if(b.type==='table'&&!b.heads.length) errs.push('Line '+b.line+': table has no header row');
    if(b.type==='table'&&b.heads.length&&!b.sep) errs.push('Line '+b.line+': table has no |---| delimiter row');
    if(b.type==='bitfield'&&!b.fields.some(f=>!f.wrap)) errs.push('Line '+b.line+': bitfield has no fields');
    if(b.type==='timing'&&!b.signals.length) errs.push('Line '+b.line+': timing has no signals');
    // `TYPED-BLOCK-SILENT-FALLBACK`: gap cycle must be an integer in [0, max lane length]; duplicates
    // already rejected at parse. Range needs all signals, so it runs here.
    if(b.type==='timing'&&b.gaps&&b.gaps.length){
      const maxLen=b.signals.reduce((m,s)=>Math.max(m,s.lane.length),0);
      for(const g of b.gaps){
        if(g.t>maxLen)
          errs.push('Line '+g.line+': gap cycle '+g.t+' is past the end of the timing lane (length '+maxLen+')');
      }
    }
    // `TYPED-BLOCK-SILENT-FALLBACK`: table merges must form rectangles. An L-shape (^^ next to ||
    // in a way the model cannot describe) is a line error. Prior art
    // (markdown-it-multimd-table) rejects the same class of input.
    if(b.type==='table'&&(b.heads.length||b.rows.length)){
      const grid=b.heads.map(hr=>hr.map(c=>({m:c.m,line:b.line})))
        .concat(b.rows.map(r=>r.cells.map(c=>({m:c.m,line:r.line}))));
      const covered=grid.map(row=>row.map(()=>false));
      let mergeErr=null;
      for(let r=0;r<grid.length&&!mergeErr;r++){
        for(let c=0;c<grid[r].length&&!mergeErr;c++){
          if(grid[r][c].m) continue;
          let cs=1; while(c+cs<grid[r].length&&grid[r][c+cs].m==='left') cs++;
          let rs=1; while(r+rs<grid.length&&grid[r+rs][c].m==='up') rs++;
          for(let i=0;i<rs&&!mergeErr;i++){
            for(let j=0;j<cs&&!mergeErr;j++){
              if(i===0&&j===0){ covered[r][c]=true; continue; }
              const cell=grid[r+i][c+j];
              if(!cell.m){
                mergeErr={line:cell.line,msg:'merge region is not rectangular (L-shaped or overlapping spans)'};
              } else {
                if(i===0&&cell.m!=='left')
                  mergeErr={line:cell.line,msg:'merge region is not rectangular (L-shaped or overlapping spans)'};
                else if(j===0&&cell.m!=='up')
                  mergeErr={line:cell.line,msg:'merge region is not rectangular (L-shaped or overlapping spans)'};
                else covered[r+i][c+j]=true;
              }
            }
          }
        }
      }
      if(!mergeErr){
        for(let r=0;r<grid.length&&!mergeErr;r++){
          for(let c=0;c<grid[r].length&&!mergeErr;c++){
            if(grid[r][c].m&&!covered[r][c])
              mergeErr={line:grid[r][c].line,msg:'merge marker does not attach to a rectangular span'};
          }
        }
      }
      if(mergeErr) errs.push('Line '+mergeErr.line+': '+mergeErr.msg);
    }
    if(b.type==='chart'){
      const t=doc.blocks.find(x=>x.type==='table'&&x.id===b.tid);
      if(!t) errs.push('Line '+b.line+': chart references unknown table "'+b.tid+'"');
      else{
        for(const r of t.rows) for(let c=1;c<r.cells.length;c++)
          if(!r.cells[c].m && !/^-?\d+(?:\.\d+)?$/.test(r.cells[c].v))
            { errs.push('Line '+b.line+': chart data must be numeric (row value "'+r.cells[c].v+'")'); break; }
      }
    }
    if(b.type==='table'&&b.width&&b.width.vals.length!==b.cols.length)
      errs.push('Line '+b.width.line+': width has '+b.width.vals.length+' values, expected '+b.cols.length);
    if(b.type==='table'&&b.marks) for(const mk of b.marks){
      const H=b.heads.length;
      const inRange = mk.hdr ? (mk.r>=1&&mk.r<=H) : (mk.r>=1&&mk.r<=b.rows.length);
      if(!inRange||mk.c<1||mk.c>b.cols.length){
        errs.push('Line '+mk.line+': cell '+(mk.hdr?'h':'')+mk.r+','+mk.c+' out of range'); continue;
      }
      // merged-away targets must be rejected: annotations target the anchor
      const cells = mk.hdr ? b.heads[mk.r-1] : b.rows[mk.r-1].cells;
      if(cells[mk.c-1].m)
        errs.push('Line '+mk.line+': cell '+(mk.hdr?'h':'')+mk.r+','+mk.c+' is merged away — annotate the anchor cell');
    }
    if(b.type==='table'&&b.rowmarks) for(const mk of b.rowmarks){
      if(mk.r<1||mk.r>b.rows.length)
        errs.push('Line '+mk.line+': row '+mk.r+' out of range');
    }
    // `ROW-HIGHLIGHT-CELL-FILL-COLLISION`, the SECOND half of the collision: the two marks
    // written on two lines. `cell 1 highlight` + `cell (1,2) fill=#ffffff`
    // both parsed, and the per-cell fill won at paint time, so the model
    // asserted "row 1 is highlighted" while the drawing tinted only part of
    // the row — presentation deleting the visual carrier of meaning, which is
    // exactly the `field … style=solid` shape `STYLE-KEY-SCOPE` removed `style=` for. Only
    // a mark that RESOLVES to a fill collides: `stroke=`/`style=` paint a
    // different channel and stay legal on a highlighted row.
    if(b.type==='table'&&b.marks&&b.rowmarks&&b.rowmarks.length) for(const mk of b.marks){
      if(mk.hdr||!b.rowmarks.some(r=>r.r===mk.r)) continue;
      const fills=mk.fill!==undefined
        || (mk.cls||[]).some(id=>{const c=doc.classes.find(x=>x.id===id); return c&&c.fill!==undefined;});
      if(fills) errs.push('Line '+mk.line+': '+CELL_HL_ROW_CONFLICT(mk.r,mk.c));
    }
  }
  // §5 `plane=` resolves against the declared planes wherever it is written —
  // the rule nodes/groups/edges have always had, now applied uniformly.
  // Declaration order does not matter (the check runs after the whole pass).
  for(const x of (doc.boundaries||[]).concat(doc.trunks||[], doc.thresholds||[],
                                             doc.bands||[], doc.classes||[]))
    if(x.plane && !planeIds.has(x.plane)) errs.push('Line '+x.line+': unknown plane "'+x.plane+'"');
  return {doc,errs};
}

// Stack several single-section render results into ONE svg (multi-section `MULTI-FIGURE-DOCUMENTS`).
// Each section is an independent figure; no shared ids or cross edges.
// Marker/pattern ids are prefixed so defs do not collide.
function stackSectionSvgs(results){
  const GAP=28;
  let y=0, maxW=0;
  const chunks=[];
  for(let i=0;i<results.length;i++){
    const svg=results[i].svg;
    const vb=/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(svg);
    const W=vb?+vb[1]:400, H=vb?+vb[2]:200;
    maxW=Math.max(maxW,W);
    let inner=svg.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
    const pfx='s'+i+'_';
    inner=inner.replace(/\bid="([^"]+)"/g,'id="'+pfx+'$1"')
               .replace(/url\(#([^)]+)\)/g,'url(#'+pfx+'$1)');
    chunks.push('<g transform="translate(0,'+y+')">'+inner+'</g>');
    y+=H+(i+1<results.length?GAP:0);
  }
  if(!chunks.length) y=1;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+Math.ceil(maxW)+' '+Math.ceil(y)+'" width="'+Math.ceil(maxW)+'" height="'+Math.ceil(y)+'" font-family="system-ui,sans-serif">'
    +chunks.join('')+'</svg>';
}

// `SEMICOLON-STATUS`: `;` is RESERVED for a future statement separator, and
// RULE 1.3 says a reserved mark MUST NOT be given any other meaning. Until
// this release it was an ordinary character: `node a ;` parsed and `;`
// became the node's LABEL. It is now a line error wherever it is part of the
// GRAMMAR — that is, everywhere except the FOUR verbatim regions (this
// function handles three of them; the pipe row is the caller's, see below).
// The count read "three" until this release, listing four:
//   - inside a quoted string  ("…;…"),
//   - inside a comment        (already stripped before this runs),
//   - inside an edge label    (edge a -[packet arrives; TMR != 0]-> b),
//   - inside a GFM pipe row   (raw table content; checked by the caller).
// The bracket exemption is NOT optional: `[ ]` is the language's verbatim
// text region, and three downstream figures write a `;` inside an edge label
// as ordinary prose. Returns the index of the offending `;`, or -1.
function findReservedSemi(s){
  let inq=false, depth=0;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(inq){
      if(c==='\\'&&i+1<s.length){ i++; continue; }
      if(c==='"') inq=false;
      continue;
    }
    if(c==='"'){ inq=true; continue; }
    if(c==='['){ depth++; continue; }
    if(c===']'){ if(depth) depth--; continue; }
    if(c===';'&&!depth) return i;
  }
  return -1;
}
const RESERVED_SEMI='";" is reserved for a future statement separator and has no meaning in v0.1 — write one directive per line; a literal ";" belongs inside a quoted string, an [edge label] or a comment (MIGRATIONS)';

function findComment(s){
  // '#' starts a comment only at line start or after whitespace,
  // so hex colors like fill=#0d9488 survive.
  // 0.1: the in-string state honours the SAME escapes the tokenizer
  // does (\n \" \\). Without this, `title "a \" b # c"` toggled `inq` on the
  // escaped quote, read the `#` as a comment introducer, cut the line there
  // and reported `unterminated string` for a perfectly legal input line.
  //
  // `VERBATIM-REGION-SCOPE`: `[ ]` IS A VERBATIM REGION FOR `#` TOO. SYNTAX-STYLE
  // §1 names four verbatim regions — a quoted string, an `[edge label]`, a
  // comment and a GFM pipe row — and `;` was honoured in all four from
  // 0.1 (`SEMICOLON-STATUS`, findReservedSemi below carries the same `depth`
  // counter). `#` was honoured in three: comment stripping ran before edge
  // dispatch and knew nothing about brackets, so `edge a -[hop #1]-> b` was
  // cut at the `#` and reported `unterminated [label]`. §1's own
  // justification for giving `[ ]` a row is this exact bug class, met and
  // fixed once for `;`; the lesson was simply not carried to the other mark,
  // and `#1`/`#2` is the natural spelling for hop and sequence numbers in
  // the protocol figures this language targets.
  //
  // The counter is safe to run on EVERY line, not just `edge` lines: it can
  // only affect a `#` that appears AFTER an unclosed `[`, and this function
  // returns at the first `#` outside brackets — so a `[` inside a comment is
  // always reached too late to matter, and `[` occurs nowhere else in the
  // grammar outside a quoted string. A stray unbalanced `[` before a `#` on
  // a non-edge line therefore swallows the comment marker and the line fails
  // as the malformed line it is, rather than half-parsing.
  let inq=false, depth=0;
  for(let i=0;i<s.length;i++){
    if(inq&&s[i]==='\\'&&i+1<s.length){ i++; continue; }
    if(s[i]==='"') inq=!inq;
    else if(inq) continue;
    else if(s[i]==='[') depth++;
    else if(s[i]===']'){ if(depth) depth--; }
    else if(s[i]==='#'&&!depth&&(i===0||/\s/.test(s[i-1]))) return i;
  }
  return -1;
}

// ============================================================
// 2. LAYOUT + RENDER (deterministic; no randomness, no Date)
// ============================================================
const FONT=13, CH=7.2, PADX=14, NH=36, GAPX=56, GAPY=44;
// §5 style= → SVG dash pattern. `def` is the construct's conventional
// default (the bundle ring and the threshold line are dashed by convention);
// an explicit style= always wins.
function dashOf(style,def){
  const p = style==='dashed'?'6 4' : style==='dotted'?'2 4' : style==='solid'?'' : def;
  return p?' stroke-dasharray="'+p+'"':'';
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function tw(s){
  const longest=Math.max(...String(s).split('\n').map(l=>l.length));
  return Math.max(30,longest*CH+2*PADX);
}
// ---- shape geometry (one source of truth for size and for clipping) ----
// A node owns a bounding box (n.x,n.y,n.w,n.h), but only the rectangle
// shapes fill it. shapeAxes() reports the shape as it is actually DRAWN:
// half-extents (a,b) about the box centre and the exponent p of the curve
// through them,
//     (|dx|/a)^p + (|dy|/b)^p = 1        p=1 rhombus, 2 ellipse, Inf rectangle
// Every shape is drawn INSIDE its box, so the box is recoverable from the
// axes with no overhang term. (`cloud` was the one exception — it drew an
// ellipse 10/8 px outside the box, and carried an (ox,oy) overhang through
// this helper, outSide() and fitOutline(); it was retired.)
// Node sizing (how large must the box be for the label to sit inside the
// outline) and borderPoint() (where does a ray from the centre leave the
// outline) both read this, so the two can never disagree about where a shape
// ends. Keep it in step with the shape drawing in renderScene.
function shapeAxes(n){
  const s=n.shape;
  if(s==='diamond') return {a:n.w/2,   b:n.h/2,   p:1};
  if(s==='circle')  return {a:n.w/2,   b:n.w/2,   p:2};  // rx=ry=w/2
  if(s==='ellipse') return {a:n.w/2,   b:n.h/2,   p:2};
  return              {a:n.w/2,   b:n.h/2,   p:Infinity};  // box, rounded, cylinder
}
// outlineNorm: <1 inside the outline, =1 on it, >1 outside. Homogeneous in
// (dx,dy) — scaling the offset scales the norm — which is what lets the same
// number serve as "how far out is this point" and "by how much must the shape
// grow to swallow it".
function outlineNorm(g,dx,dy){
  const u=Math.abs(dx)/(g.a||1e-9), v=Math.abs(dy)/(g.b||1e-9);
  return g.p===1?u+v:(g.p===2?Math.hypot(u,v):Math.max(u,v));
}
// outSide: the coordinate an orthogonal run has to reach to touch the DRAWN
// outline on one side ('l','r','t','b') — what a channel route needs when it
// arrives square-on instead of along a ray. Every registered shape is drawn
// inside its box, so this is the box edge; the call site is kept so a future
// outside-the-box outline has one place to answer for (`cloud`, the only one
// that ever was, is retired — 0.1).
function outSide(n,k){
  return k==='l'?n.x : k==='r'?n.x+n.w : k==='t'?n.y : n.y+n.h;
}
// simplifyPts: Douglas–Peucker simplification in place. The waypoint chain
// emits an entry+exit port per crossed rank; home-anchoring keeps those ports
// in a narrow corridor, so what remains is a nearly-straight run carrying tens
// of cosmetic ±few-px jogs. DP collapses that corridor to the handful of
// genuine bends a dummy-vertex chain should have, keeping every retained point
// exactly where it was (endpoints are always kept). Presentation-only.
function simplifyPts(pts,eps){
  eps=eps||3;
  if(pts.length<3) return pts;
  const keep=new Array(pts.length).fill(false);
  keep[0]=keep[pts.length-1]=true;
  const stack=[[0,pts.length-1]];
  while(stack.length){
    const [lo,hi]=stack.pop();
    if(hi<=lo+1) continue;
    const a=pts[lo], b=pts[hi];
    const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy);
    let far=-1, fd=eps;
    for(let i=lo+1;i<hi;i++){
      const p=pts[i];
      const d=L<1e-9?Math.hypot(p[0]-a[0],p[1]-a[1])
                    :Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/L;
      if(d>fd){ fd=d; far=i; }
    }
    if(far>=0){ keep[far]=true; stack.push([lo,far],[far,hi]); }
  }
  let w=0;
  for(let i=0;i<pts.length;i++) if(keep[i]) pts[w++]=pts[i];
  pts.length=w;
  return pts;
}
// roundPath: build an SVG path `d` for a polyline whose INTERIOR bends are
// softened into circular-arc fillets — the standard technical-diagram look.
// The point list is NOT modified: only the drawn path curves. At each interior
// vertex the two adjacent segments are shortened by r and rejoined with a
// quadratic (Q corner …), which for equal trims traces a circular arc tangent
// to both legs — one primitive used everywhere, so the output is deterministic.
// r = min(10, 40% of the shorter adjacent segment) keeps short jogs from
// over-rounding or inverting. Near-collinear bends (turn < ~10°, i.e. interior
// angle > ~170°) keep a hard corner. First/last points are never filleted, so
// arrowhead geometry and endpoint contact are untouched.
const FILLET_R=10;
function roundPath(pts){
  if(pts.length<3) return 'M'+pts.map(p=>p.join(' ')).join(' L');
  const f=n=>{ const s=(+n).toFixed(3); return s.replace(/\.?0+$/,''); };
  let d='M'+f(pts[0][0])+' '+f(pts[0][1]);
  for(let i=1;i+1<pts.length;i++){
    const a=pts[i-1], c=pts[i], b=pts[i+1];
    const v1x=a[0]-c[0], v1y=a[1]-c[1], L1=Math.hypot(v1x,v1y);
    const v2x=b[0]-c[0], v2y=b[1]-c[1], L2=Math.hypot(v2x,v2y);
    if(L1<1e-6||L2<1e-6){ d+=' L'+f(c[0])+' '+f(c[1]); continue; }
    // turn angle: cos of the angle between the two legs at c. Near-collinear
    // (legs nearly opposite → dot≈ -1 → angle between legs ≈180°, tiny turn)
    // keeps a hard corner.
    const dot=(v1x*v2x+v1y*v2y)/(L1*L2);
    if(dot<-0.985){ d+=' L'+f(c[0])+' '+f(c[1]); continue; } // turn < ~10°
    const r=Math.min(FILLET_R, 0.4*Math.min(L1,L2));
    if(r<0.5){ d+=' L'+f(c[0])+' '+f(c[1]); continue; }
    const p1x=c[0]+v1x/L1*r, p1y=c[1]+v1y/L1*r; // trim point toward a
    const p2x=c[0]+v2x/L2*r, p2y=c[1]+v2y/L2*r; // trim point toward b
    d+=' L'+f(p1x)+' '+f(p1y)+' Q'+f(c[0])+' '+f(c[1])+' '+f(p2x)+' '+f(p2y);
  }
  const e=pts[pts.length-1];
  d+=' L'+f(e[0])+' '+f(e[1]);
  return d;
}
// inscribedHalfW: the half-width the outline still offers at height |dy|=v —
// the room a label line really has (a rectangle offers its full half-width).
function inscribedHalfW(g,v){
  const t=Math.min(1,Math.abs(v)/(g.b||1e-9));
  return g.p===1?g.a*(1-t):(g.p===2?g.a*Math.sqrt(1-t*t):g.a);
}
// labelBox: the label's own text box (glyph extents) plus a small clearance
// so glyphs never graze the stroke — this is what must end up INSIDE.
// (line height 1.3*FONT as in textEl; 1.2*FONT covers one line's ink box)
const LBLPADX=6, LBLPADY=4;
function labelBox(label){
  const ls=String(label).split('\n');
  return [Math.max(...ls.map(l=>l.length))*CH+2*LBLPADX,
          ((ls.length-1)*1.3+1.2)*FONT+2*LBLPADY];
}
// fitOutline: grow the box by the smallest factor that pulls an iw x ih box,
// centred on the node, inside the outline. The norm at the text box's corner
// IS that factor (homogeneity), so one evaluation answers both "does it fit"
// and "by how much". Rectangles are their own outline and tw()/NH already pad
// the text, so k<=1 there and the box never moves.
function fitOutline(n,box){
  const g=shapeAxes(n), k=outlineNorm(g,box[0]/2,box[1]/2);
  if(k<=1) return;
  n.w=Math.max(n.w,2*k*g.a);
  n.h=Math.max(n.h,2*k*g.b);
  if(n.shape==='circle') n.w=n.h=Math.max(n.w,n.h);   // rx=ry=w/2: box stays square
}
// multi-line <text>: "\n" in labels becomes centered tspans
function textEl(x,y,fs,anchor,fill,content,extraAttrs){
  // halo text = two layers (white under-stroke + plain top copy) so the
  // halo survives SVG renderers without paint-order support
  if(extraAttrs && extraAttrs.indexOf('paint-order')>=0){
    const rest=extraAttrs.replace(' paint-order="stroke" stroke="#fff" stroke-width="3"','');
    return textEl(x,y,fs,anchor,'#fff',content,rest+' stroke="#fff" stroke-width="3" stroke-linejoin="round"')
         + textEl(x,y,fs,anchor,fill,content,rest);
  }
  const lines=String(content).split('\n');
  const attrs='font-size="'+fs+'" text-anchor="'+anchor+'" fill="'+fill+'"'+(extraAttrs||'');
  if(lines.length===1)
    return '<text x="'+x+'" y="'+y+'" '+attrs+'>'+esc(content)+'</text>';
  const lh=fs*1.3, y0=y-(lines.length-1)*lh/2;
  return '<text x="'+x+'" y="'+y0+'" '+attrs+'>'+
    lines.map((l,i)=>'<tspan x="'+x+'" dy="'+(i?lh:0)+'">'+esc(l)+'</tspan>').join('')+'</text>';
}

function render(doc,ropts){
  // presentation options (renderer tier, not language): {title:true}
  // draws the title. Default is NOT drawn (`DEFAULT-VALUE-SELECTION`: embedded figures almost
  // always sit under a caption in the host document; the title text
  // stays semantic in the source either way).
  const RO=ropts||{};
  // `OMITTED-LABEL-RECORDING` display fallback: the semantic model records an omitted label as
  // absent (null); the RENDERER — never the model — substitutes the id, so a
  // label-less `node a` still draws "a". This is the whole of the difference
  // between the model and the figure, and it lives here, in one place.
  // The element is COPIED rather than patched: a caller that parses, renders
  // and then reads its own `doc` must still see the absence it was given.
  // `EMPTY-LABEL-STATE`: the test is ABSENCE, not truthiness. An explicitly empty label
  // (`node a ""`) is an authorial act — the figure draws no text at all. The
  // id is an internal handle, never authored display text, so substituting it
  // would put words into a figure whose source has none.
  const lbl=(x)=>(x.label===null||x.label===undefined)?Object.assign({},x,{label:x.id}):x;
  doc=Object.assign({},doc,{
    nodes : doc.nodes.map(lbl),
    groups: doc.groups.map(lbl),
    trunks: (doc.trunks||[]).map(lbl),
    blocks: doc.blocks.map(b=>b.type==='chart'?b:lbl(b)),
  });
  // resolve class defaults (explicit element attributes win — rigidity, `LAYOUT-STABILITY`).
  // class= is multi-valued: ids apply left-to-right, later wins per channel
  // (same cascade as CSS multi-class). Single-id documents are unchanged.
  const C={}; for(const c of doc.classes||[]) C[c.id]=c;
  const classIdsOf=(x)=>{
    if(x.cls===undefined||x.cls===null) return [];
    return Array.isArray(x.cls)?x.cls:[x.cls];
  };
  const rs=(x,k)=>{
    if(x[k]!==undefined) return;
    for(const id of classIdsOf(x)){
      if(C[id] && C[id][k]!==undefined) x[k]=C[id][k];
    }
  };
  // a class carries all five §5 attributes; the element's own value wins (`LAYOUT-STABILITY`).
  // `plane` is materialized to 'base' at parse time, so "unset" is 'base' here.
  const rsl=(x)=>{
    if(!(x.plane===undefined||x.plane===null||x.plane==='base')) return;
    for(const id of classIdsOf(x)){
      if(C[id] && C[id].plane!==undefined) x.plane=C[id].plane;
    }
  };
  const rsAll=(x)=>{ rs(x,'fill'); rs(x,'stroke'); rs(x,'style'); rsl(x); };
  for(const n of doc.nodes){ rsAll(n); if(n.style===undefined) n.style='solid'; }
  for(const g of doc.groups){ rsAll(g); }
  // 0.1 (§8.4): an edge has no interior, so it takes every class
  // channel EXCEPT `fill` — which the parser has already guaranteed is
  // accompanied by a `stroke` on any class an edge joins.
  for(const e of doc.edges){ rs(e,'stroke'); rs(e,'style'); rsl(e); if(e.style===undefined) e.style='solid'; }
  for(const b of doc.blocks){
    rsAll(b);
    if(b.fields) for(const f of b.fields) rsAll(f);
    if(b.marks)  for(const mk of b.marks) rsAll(mk);
  }
  const parts=[]; let y=0, maxW=0;
  if(doc.title && RO.title===true){ parts.push('<text x="0" y="16" font-size="15" font-weight="600">'+esc(doc.title)+'</text>'); y=30;
    maxW=Math.max(maxW, doc.title.length*8.6); }  // canvas must fit the title
  let sceneMeta=null;
  if(doc.nodes.length||doc.edges.length||(doc.boundaries||[]).length){
    const s=renderScene(doc,y); parts.push(s.svg); y=s.y; maxW=Math.max(maxW,s.w);
    sceneMeta=s.meta;
  }
  for(const b of doc.blocks){
    let s;
    if(b.type==='bitfield') s=renderBitfield(b,y);
    else if(b.type==='table') s=renderTable(b,y);
    else if(b.type==='chart') s=renderChart(b,y,doc);
    else s=renderTiming(b,y);
    parts.push(s.svg); y=s.y+24; maxW=Math.max(maxW,s.w);
  }
  // 0.1 (`CLASS-EMPTY-MEANING`): a class whose meaning is the EMPTY string claims no
  // meaning, so it has nothing to explain and draws NO legend entry — it is
  // pure attribute grouping. The filter runs before the `.length` test so a
  // document whose classes are all meaning-less adds no blank strip and no
  // vertical space. (Rejected alternative: a `legend=hide` option, which
  // would have let an author claim a meaning and then hide it — the reader
  // gets the category from the model while the human sees an unexplained
  // colour. See `CLASS-EMPTY-MEANING`.)
  const legendCls=(doc.classes||[]).filter(c=>c.label!=='');
  if(legendCls.length){
    // derived legend strip (`CATEGORICAL-MEANING-MAPPING`): declaration order, swatch + meaning
    const es=[]; let lx=0, ly=y+8; const rowH=20, wrapW=Math.max(maxW,420);
    // 0.1 (`CLASS-PAINT-REQUIREMENT`): the swatch shows the class's DECLARED paint, and a
    // class that declares none gets no swatch. Before this release the swatch
    // was drawn unconditionally from `fill`/`stroke` alone, so a class whose
    // only channel was the (now retired, `COLOUR-KEY-STATUS`) label colour rendered an empty
    // box — its meaning invisible in the legend the language derives FOR that
    // meaning — and a class with no paint at all rendered a box
    // indistinguishable from `fill=white stroke=#555`, which it never wrote.
    // Retiring `color=` removes the first case; omitting the swatch removes
    // the second. Every channel a class can still declare (`fill`, `stroke`,
    // `style`) is drawn, so "declared but not shown" is now unreachable.
    for(const c of legendCls){
      const paints=c.fill!==undefined||c.stroke!==undefined||c.style!==undefined;
      const tw=String(c.label).length*6.6+(paints?30:9);
      if(lx>0 && lx+tw>wrapW){ lx=0; ly+=rowH; }
      if(paints){
        const dash=c.style==='dashed'?' stroke-dasharray="6 4"':(c.style==='dotted'?' stroke-dasharray="2 4"':'');
        es.push('<rect x="'+lx+'" y="'+(ly+3)+'" width="16" height="11" fill="'+(c.fill||'#fff')+'" stroke="'+(c.stroke||'#555')+'"'+dash+'/>');
      }
      es.push('<text x="'+(lx+(paints?21:0))+'" y="'+(ly+12.5)+'" font-size="11" fill="#1d1d1b">'+esc(c.label)+'</text>');
      lx+=tw+14; maxW=Math.max(maxW,lx);
    }
    parts.push(es.join(''));
    y=ly+rowH;
  }
  const PADL=18, PADT=6;
  const W=Math.ceil(maxW)+PADL+8, H=Math.ceil(y)+PADT+4;
  return {svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" font-family="system-ui,sans-serif">'
    +'<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
    +'<path d="M0,0 L10,5 L0,10 z" fill="#555"/></marker>'
    +'<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
    +'<line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" stroke-width="2"/></pattern></defs>'
    +'<g transform="translate('+PADL+','+PADT+')">'+parts.join('')+'</g></svg>', w:W, h:H,
    sceneMeta:sceneMeta, pad:{x:PADL,y:PADT}};
}

// ---- scene ----
function renderScene(doc,y0){
  const nodes=doc.nodes.map(n=>({...n}));
  // §2.4 plane z = paint order, applied by every pass that stacks annotations
  // (edges, bundle rings, threshold lines, zone bands). The sort is stable, so
  // same-plane items keep document order — "a later line paints on top".
  const zOf=l=>{const L=doc.planes.find(x=>x.id===l);return L?L.z:0;};
  const zsort=a=>[...(a||[])].sort((p,q)=>zOf(p.plane)-zOf(q.plane));
  // a zone band draws an outline when stroke= and/or style= is written
  const bandEdge=f=>(f.stroke||f.style)?' stroke="'+(f.stroke||'#8a8880')+'"'+dashOf(f.style,''):'';
  // boundary anchors (`EXTERNAL-EDGE-ENDPOINTS`): external I/O endpoints join the layout as
  // small invisible ~12x12 extents so externals land at natural margins;
  // they are never drawn as shapes (the edge ends open at the anchor).
  for(const b of doc.boundaries||[])
    nodes.push({id:b.id,label:b.label!==null&&b.label!==undefined?b.label:'',boundary:true,plane:b.plane||'base',group:null,
                line:b.line});
  const byId={}; nodes.forEach(n=>byId[n.id]=n);
  // sizes
  for(const n of nodes){
    if(n.boundary){ n.w=n.h=12; continue; }
    const nLines=String(n.label).split('\n').length;
    n.w=tw(n.label); n.h=NH+(nLines-1)*16;
    // `ELEMENT-GEOMETRY-DIRECTIVE`: the declared extent now rides on the `pin` entry.
    // A pin that declares only `at=` leaves w/h null and the node auto-sizes,
    // exactly as an id with no `size` line did before the merge.
    const s=doc.pins[n.id]; if(s&&(s.w!==null||s.h!==null)){ if(s.w)n.w=s.w; if(s.h)n.h=s.h; n.rigid=true; }
    if(n.shape==='diamond'){ n.w=Math.max(n.w+20,70); n.h=Math.max(n.h,48); }
    if(n.shape==='circle'){ n.w=n.h=Math.max(n.w,n.h); }
    // The box is what the layout reserves; the OUTLINE is what the reader
    // sees, and for every shape but the rectangles the two differ — a box
    // sized as if it were a rectangle lets the label cross the drawn outline
    // (a rhombus offers only its inscribed rectangle, ~half the box in each
    // direction). Grow the box until the label's text box is inside the
    // outline. An explicit extent is the author's word: a rigid node keeps
    // its box and the label shrinks to the inscribed width instead (`UNDECLARED-ATTRIBUTE-BEHAVIOUR`).
    if(!n.rigid) fitOutline(n,labelBox(n.label));
  }
  // ranks: DFS from document-order sources classifies back-edges; a
  // longest-path layering runs on the remaining DAG so sources sit at
  // layer 0. `rank a b c` merges its nodes into ONE vertex for the
  // layering (same layer) without dragging unrelated branches along.
  // "Pinned" means POSITIONED. Since `ELEMENT-GEOMETRY-DIRECTIVE` a `pin` entry may carry an extent
  // and no `at=`, and such an element still takes its auto-layout slot — so
  // the test is on the point, not on the entry's existence.
  const pinned=id=>doc.pins[id]!==undefined&&doc.pins[id].fx!==null;
  nodes.forEach((n,i)=>n.di=i);            // document order (sort tiebreak)
  const rep={}; nodes.forEach(n=>rep[n.id]=n.id);   // rank-group union-find
  const find=u=>{ while(rep[u]!==u) u=rep[u]=rep[rep[u]]; return u; };
  for(const r of doc.ranks){
    const ids=r.ids.filter(id=>byId[id]);
    for(let i=1;i<ids.length;i++){ const a=find(ids[0]),b=find(ids[i]); if(a!==b) rep[b]=a; }
  }
  const adj={}; nodes.forEach(n=>{ adj[find(n.id)]=adj[find(n.id)]||[]; });
  const isBack=new Set();                  // edges that close a cycle
  for(const e of doc.edges){
    // undirected/bidirectional edges still order ranks by document direction
    if(!byId[e.a]||!byId[e.b]) continue;
    if(e.a===e.b){ isBack.add(e); continue; }        // self-loop
    const u=find(e.a), v=find(e.b);
    if(u!==v) adj[u].push({v,e});
  }
  const state={};
  const classify=u=>{
    state[u]=1;
    for(const {v,e} of adj[u]){
      if(state[v]===1) isBack.add(e);      // gray hit = back-edge
      else if(!state[v]) classify(v);
    }
    state[u]=2;
  };
  for(const n of nodes){ const u=find(n.id); if(!state[u]) classify(u); }
  const radj={}; nodes.forEach(n=>{ radj[find(n.id)]=radj[find(n.id)]||[]; });
  for(const e of doc.edges){
    if(!byId[e.a]||!byId[e.b]||isBack.has(e)) continue;
    const u=find(e.a), v=find(e.b); if(u!==v) radj[v].push(u);
  }
  const rk={};
  const rankOf=u=>{
    if(rk[u]!==undefined) return rk[u];
    rk[u]=0;                               // DAG: placeholder is never read
    let r=0; for(const p of radj[u]) r=Math.max(r, rankOf(p)+1);
    return rk[u]=r;
  };
  nodes.forEach(n=>n.rank=rankOf(find(n.id)));
  // positions: children spread around their parents' lane (barycenter
  // sweeps down/up/down). Edges that span multiple layers get invisible
  // waypoint slots so they no longer cut through intermediate nodes.
  // ALL nodes participate in auto layout (pinned ones hold their slot so
  // that pinning X never reflows Y); pins override coordinates afterwards.
  const horiz=(doc.flow==='right'||doc.flow==='left');
  const lblPx=s=>Math.max(...String(s).split('\n').map(l=>l.length))*6.5;
  const lay=[...nodes];                    // layout participants
  const chains=new Map();                  // edge -> [A, ...waypoints, B]
  for(const e of doc.edges){
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)) continue;
    if(B.rank-A.rank<=1 || pinned(e.a) || pinned(e.b)) continue;
    const chain=[A];
    const span=B.rank-A.rank;
    for(let r=A.rank+1;r<B.rank;r++){
      // homeA/homeB/frac anchor this waypoint's cross position between its
      // OWN endpoints (dummy-vertex chain), so the barycenter sweep orders it
      // within the lane without letting the run drift to the figure margin.
      const v={virtual:true,rank:r,w:1,h:1,mn:e.mid?lblPx(e.mid):0,di:lay.length,
               homeA:A,homeB:B,frac:(r-A.rank)/span};
      lay.push(v); chain.push(v);
    }
    chain.push(B); chains.set(e,chain);
  }
  const preds=new Map(), succs=new Map(); // over layout segments
  const link=(p,c)=>{ if(!preds.has(c)) preds.set(c,[]); preds.get(c).push(p);
                      if(!succs.has(p)) succs.set(p,[]); succs.get(p).push(c); };
  for(const e of doc.edges){
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)||A.rank===B.rank) continue;
    const ch=chains.get(e)||[A,B];
    for(let i=1;i<ch.length;i++) link(ch[i-1],ch[i]);
  }
  const midW={};        // widest mid label on a one-layer edge, per node
  for(const e of doc.edges){
    if(!e.mid) continue;
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)||Math.abs(A.rank-B.rank)!==1) continue;
    midW[e.a]=Math.max(midW[e.a]||0,lblPx(e.mid));
    midW[e.b]=Math.max(midW[e.b]||0,lblPx(e.mid));
  }
  const cs=n=>horiz?n.h:n.w;               // cross-axis size
  const gapOf=(a,b)=>{  // spacing between adjacent lane members
    if(a.group&&a.group===b.group){
      const g=doc.groups.find(x=>x.id===a.group);
      if(g&&g.gap!==undefined) return g.gap;   // explicit group gap is exact
    }
    let base=horiz?GAPY:GAPX;
    if(a.virtual||b.virtual) base=Math.min(base,30);
    if(!horiz){           // beside-labels on vertical edges need width
      const la=a.virtual?a.mn:(midW[a.id]||0);
      if(la) base=Math.max(base,la+23-cs(a)/2);
    }
    return base;
  };
  const ranksArr=[];
  for(const n of lay){ (ranksArr[n.rank]=ranksArr[n.rank]||[]).push(n); }
  const laneSize=[], mainGap=[];
  ranksArr.forEach((lane,i)=>{
    if(!lane) return;
    laneSize[i]=Math.max(...lane.map(n=>horiz?n.w:n.h));
    mainGap[i]=horiz?GAPX:GAPY;
  });
  if(horiz) for(const e of doc.edges){     // labels ride ON horizontal edges:
    if(!e.mid||isBack.has(e)) continue;    // layer pitch grows to fit them
    const A=byId[e.a], B=byId[e.b]; if(!A||!B) continue;
    const r0=Math.min(A.rank,B.rank), r1=Math.max(A.rank,B.rank);
    if(r0===r1) continue;
    const need=(lblPx(e.mid)+24)/(r1-r0);
    for(let i=r0;i<r1;i++) mainGap[i]=Math.max(mainGap[i],need);
  }
  const center=n=>n.cross+cs(n)/2;
  ranksArr.forEach(lane=>{ if(!lane) return; let c=0;    // seed: doc order
    lane.forEach((n,k)=>{ n.cross=c; c+=cs(n)+(k<lane.length-1?gapOf(n,lane[k+1]):0); }); });
  const place=(lane,des)=>{   // order by desired center, resolve overlaps,
    const arr=lane.map(n=>({n,d:des.get(n)}));           // recenter the lane
    arr.sort((p,q)=>p.d-q.d||p.n.di-q.n.di);
    let cEnd=-Infinity;
    arr.forEach((x,i)=>{
      x.n.cross=Math.max(x.d-cs(x.n)/2, cEnd);
      cEnd=x.n.cross+cs(x.n)+(i<arr.length-1?gapOf(x.n,arr[i+1].n):0);
    });
    const err=arr.reduce((s,x)=>s+center(x.n)-x.d,0)/arr.length;
    arr.forEach(x=>{ x.n.cross-=err; });
    lane.length=0; arr.forEach(x=>lane.push(x.n));
  };
  const SLACK=300;   // how far a multi-rank waypoint may stray past its own
                     // endpoints' cross-axis band before the sweep clamps it
                     // (item 17); the knee of the excursion↔crossings trade.
  const sweep=dir=>{          // 1 = align to parents, -1 = align to children
    const idx=[]; ranksArr.forEach((l,i)=>l&&idx.push(i));
    const order=dir===1?idx.slice(1):idx.slice(0,-1).reverse();
    for(const i of order){
      const lane=ranksArr[i], des=new Map();
      for(const n of lane){
        const ref=(dir===1?preds:succs).get(n);
        let d=ref&&ref.length ? ref.reduce((s,m)=>s+center(m),0)/ref.length : center(n);
        // Waypoint excursion bound (item 17): a multi-rank forward edge's dummy
        // vertices may follow the barycenter freely WITHIN the cross-axis band
        // their own endpoints span — that is where the ordering that separates
        // parallel long edges from each other happens — but they may not stray
        // past that band by more than SLACK. Without this a long run in a
        // crowded region drifts, layer by layer, out to the figure margin (the
        // 900px staircase this item measured). Clamping the DESIRED position
        // (not the final one) leaves place()'s overlap resolution and node
        // spacing intact, so a clamped waypoint is not shoved onto a node; and
        // because the clamp is monotonic it does not reorder waypoints, so it
        // does not manufacture crossings among edges that did not cross before.
        // A centre-line PULL was tried instead and rejected: it makes edges
        // sharing a funnel target converge early and adds real crossings.
        if(n.virtual&&n.homeA&&n.homeB){
          const cA=center(n.homeA), cB=center(n.homeB);
          const lo=Math.min(cA,cB)-SLACK, hi=Math.max(cA,cB)+SLACK;
          d=Math.max(lo,Math.min(hi,d));
        }
        des.set(n,d);
      }
      place(lane,des);
    }
  };
  sweep(1); sweep(-1); sweep(1);
  let minC=Infinity; lay.forEach(n=>{ minC=Math.min(minC,n.cross); });
  if(!isFinite(minC)) minC=0;
  let main=0;
  ranksArr.forEach((lane,i)=>{
    if(!lane) return;
    lane.forEach(n=>{
      // waypoints span the full layer so chain bends happen in the gaps
      if(n.virtual){ if(horiz) n.w=laneSize[i]; else n.h=laneSize[i]; }
      if(horiz){ n.x=main; n.y=y0+20+n.cross-minC; }
      else     { n.y=y0+20+main; n.x=n.cross-minC; }
    });
    main+=laneSize[i]+mainGap[i];
  });
  if(doc.flow==='left'||doc.flow==='up'){
    const M=main; for(const n of lay){
      if(horiz) n.x=M-n.x-n.w; else n.y=y0+20+(M-(n.y-y0-20))-n.h; }
  }
  // Two-level coordinates (`PIN-COORDINATE-SCOPE`): a pinned GROUP anchors its local origin in
  // canvas px; a pinned MEMBER is group-local (relative to that origin);
  // ungrouped pins are canvas px. Moving a group = editing one pin line.
  const gOrigin={};
  for(const g of doc.groups){
    const p=doc.pins[g.id];
    // `ELEMENT-GEOMETRY-DIRECTIVE`: only a pin that carries `at=` anchors an origin.
    if(p&&p.fx!==null){ gOrigin[g.id]={x:p.fx, y:y0+20+p.fy}; }
    else{
      const mem=nodes.filter(n=>n.group===g.id);
      if(mem.length) gOrigin[g.id]={x:Math.min(...mem.map(n=>n.x)),
                                    y:Math.min(...mem.map(n=>n.y))};
    }
  }
  for(const n of nodes){ const p=doc.pins[n.id]; if(!p||p.fx===null) continue;
    const o=n.group?gOrigin[n.group]:null;
    if(o){ n.x=o.x+p.fx; n.y=o.y+p.fy; }
    else { n.x=p.fx; n.y=y0+20+p.fy; }
  }
  // Boundary adjacency in pinned scenes (presentation-only): auto-layout ranks
  // a degree-1 boundary relative to the free lanes, so in a scene where the
  // real content is pinned to a compact box the boundary can drift to a far
  // rank and blow the canvas out. When a boundary's connected node is pinned
  // (or the scene is substantially pinned), place the boundary just outside
  // that node's border in the flow direction — upstream for `boundary -> node`,
  // downstream for `node -> boundary` — aligned on the node's cross-axis, at a
  // small fixed gap. Explicitly pinned boundaries keep
  // their author-given placement. Strip every `pin` and the AST is unchanged.
  {
    const real=nodes.filter(n=>!n.boundary);
    const pinnedReal=real.filter(n=>pinned(n.id)).length;
    const scenePinned=real.length>0 && pinnedReal>=Math.ceil(real.length/2);
    const BGAP=30;   // border-to-anchor gap (spec range 24–40)
    for(const b of nodes){
      if(!b.boundary||pinned(b.id)) continue;
      // sole incident edge (degree-1); skip self-refs
      let node=null, downstream=true;
      for(const e of doc.edges){
        if(e.a===b.id&&byId[e.b]&&byId[e.b]!==b){ node=byId[e.b]; downstream=false; break; } // boundary -> node
        if(e.b===b.id&&byId[e.a]&&byId[e.a]!==b){ node=byId[e.a]; downstream=true;  break; } // node -> boundary
      }
      if(!node) continue;
      if(!(pinned(node.id)||scenePinned)) continue;   // unpinned scenes keep auto-layout
      // outward side in flow direction: downstream = end of flow, upstream = start
      const fwd=(doc.flow==='right'||doc.flow==='down');
      const outward=downstream===fwd ? 1 : -1;        // +1 = max side, -1 = min side
      if(horiz){
        b.y=node.y+node.h/2-b.h/2;                    // align on node's horizontal axis
        b.x=outward>0 ? node.x+node.w+BGAP : node.x-BGAP-b.w;
      }else{
        b.x=node.x+node.w/2-b.w/2;                    // align on node's vertical axis
        b.y=outward>0 ? node.y+node.h+BGAP : node.y-BGAP-b.h;
      }
    }
  }
  // Boundary labels sit beyond the open end, away from the figure (`EXTERNAL-EDGE-ENDPOINTS`).
  // bDir = outward direction of an anchor: away from its first incident
  // edge's other endpoint (document order; [0,1] = below when unwired).
  const bDir=n=>{
    for(const e of doc.edges){
      const o=e.a===n.id?byId[e.b]:(e.b===n.id?byId[e.a]:null);
      if(!o||o===n) continue;
      return [n.x+n.w/2-(o.x+o.w/2), n.y+n.h/2-(o.y+o.h/2)];
    }
    return [0,1];
  };
  // A left-pointing label (an inbound external under flow right) would
  // stick out past the canvas' left edge: shift the whole scene right so
  // it stays on canvas. The shift is uniform (relative geometry, incl.
  // pins, is preserved — same pattern as the ring-channel y-shift below)
  // and meta.left reports it so drag→pin round-trips stay stable.
  let bShift=0;
  for(const n of nodes){
    if(!n.boundary||!n.label) continue;
    const [bdx,bdy]=bDir(n), cx=n.x+n.w/2;
    const ext=Math.abs(bdx)>=Math.abs(bdy) ? (bdx<0 ? cx-10-lblPx(n.label) : 0)
                                           : cx-lblPx(n.label)/2;
    bShift=Math.max(bShift,-ext);
  }
  if(bShift){ for(const n of lay) n.x+=bShift;
              for(const k in gOrigin) gOrigin[k].x+=bShift; }
  // back-edge channel plan: slots used to be handed out in paint order, so
  // a far source could take the innermost slot and its long run crossed
  // every other return. Sort channel-bound back-edges so the source NEAREST
  // the channel gets the INNERMOST slot (vertical flow, right channel:
  // larger cx = nearer; horizontal flow, bottom channel: larger cy = nearer;
  // ties: document order). Where the pattern allows it (vertical flow,
  // clear space below the source, clear sky above the target) the loop is
  // drawn as a full concentric ring — drop row, channel, return row and hub
  // entry nested in the same order, entering the hub's top edge on the
  // channel side — so fan-in hubs (N states -> IDLE reset) have no crossings.
  const chPlan=new Map(); let chTop=0, chShift=0;
  {
    const chList=doc.edges.filter(e=>byId[e.a]&&byId[e.b]&&isBack.has(e)&&!pinned(e.a)&&!pinned(e.b));
    const near=e=>{ const A=byId[e.a]; return horiz?A.y+A.h/2:A.x+A.w/2; };
    const order=chList.map((e,i)=>({e,i}));
    order.sort((p,q)=>near(q.e)-near(p.e)||p.i-q.i);
    let cum=0;
    order.forEach(({e},ring)=>{
      const A=byId[e.a], B=byId[e.b], sx=A.x+A.w/2;
      const ringOK=!horiz&&A!==B
        &&!nodes.some(n=>n!==A&&!n.boundary&&n.x<sx&&n.x+n.w>sx&&n.y+n.h>A.y+A.h)
        &&!nodes.some(n=>n!==B&&!n.boundary&&n.x<B.x+B.w&&n.x+n.w>B.x&&n.y<B.y);
      chPlan.set(e,{ring,slot:cum,ringOK});
      cum+=(!horiz&&e.mid)?Math.max(22,lblPx(e.mid)+14):22;
    });
    // rings are all-or-nothing per target: a hub whose loops are part ring,
    // part legacy would reintroduce crossings between the two styles
    const byT={};
    order.forEach(({e})=>{ (byT[e.b]=byT[e.b]||[]).push(e); });
    for(const t in byT)
      if(!byT[t].every(e=>chPlan.get(e).ringOK))
        byT[t].forEach(e=>{ chPlan.get(e).ringOK=false; });
    // hub entries fan across the target's top edge, innermost ring nearest
    // the channel, so concentric rings never cross on their way in
    for(const t in byT){
      const g=byT[t].filter(e=>chPlan.get(e).ringOK);
      const B=byId[t], m=g.length;
      g.forEach((e,k)=>{ chPlan.get(e).ex=B.x+B.w*(m-k)/(m+1); });
    }
    // ring return rows run above the top rank; shift the whole scene down
    // when they would spill into the title band. The shift is uniform
    // (relative geometry, incl. pins, is preserved) and meta.top reports
    // the shifted origin so the editor's drag->pin round-trip stays stable.
    const rings=order.filter(({e})=>chPlan.get(e).ringOK);
    if(rings.length){
      let occT=Infinity;
      for(const n of nodes) occT=Math.min(occT, n.y-(n.group?26:0));
      const maxRing=Math.max(...rings.map(({e})=>chPlan.get(e).ring));
      chShift=Math.max(0, y0+20+maxRing*12-occT);
      if(chShift){ for(const n of lay) n.y+=chShift;
                   for(const k in gOrigin) gOrigin[k].y+=chShift; }
      chTop=occT+chShift;
    }
  }
  // anti-parallel straight edges (A->B and B->A) used to coincide: offset
  // each member of a same-pair straight group along the pair's CANONICAL
  // normal (endpoints sorted by id), so opposite directions land on
  // opposite sides; endpoints and labels shift together.
  const apOff=new Map();
  {
    const straight=e=>byId[e.a]&&byId[e.b]&&!(isBack.has(e)&&!pinned(e.a)&&!pinned(e.b))&&!chains.get(e);
    const pk=e=>e.a<e.b?e.a+'\t'+e.b:e.b+'\t'+e.a;
    const pairN={}, seen={};
    for(const e of doc.edges) if(straight(e)){ const k=pk(e); pairN[k]=(pairN[k]||0)+1; }
    for(const e of doc.edges){
      if(!straight(e)) continue;
      const k=pk(e), kk=pairN[k]; if(kk<2) continue;
      const idx=seen[k]||0; seen[k]=idx+1;
      const off=(idx-(kk-1)/2)*7;
      const lo=e.a<e.b?e.a:e.b, hi=e.a<e.b?e.b:e.a;
      const P=byId[lo], Q=byId[hi];
      const dx=(Q.x+Q.w/2)-(P.x+P.w/2), dy=(Q.y+Q.h/2)-(P.y+P.h/2), L=Math.hypot(dx,dy)||1;
      apOff.set(e,[-dy/L*off, dx/L*off]);
    }
  }
  let W=0,Hh=0;
  for(const n of lay){ W=Math.max(W,n.x+n.w); Hh=Math.max(Hh,n.y+n.h-y0-20); }
  if(W===0){W=480;} if(Hh===0){Hh=280;}
  // groups
  const gsvg=[]; const gBox={};
  for(const g of doc.groups){
    const mem=nodes.filter(n=>n.group===g.id);
    if(!mem.length) continue;
    const o=gOrigin[g.id];
    const x0=Math.min(...mem.map(n=>n.x))-14, x1=Math.max(...mem.map(n=>n.x+n.w))+14;
    const yA=Math.min(...mem.map(n=>n.y))-26, yB=Math.max(...mem.map(n=>n.y+n.h))+12;
    gBox[g.id]={x0,x1,yA,yB};
    const gdash=g.style==='dashed'?' stroke-dasharray="6 4"':(g.style==='dotted'?' stroke-dasharray="2 4"':'');
    gsvg.push('<g data-group="'+g.id+'" data-gx="'+o.x+'" data-gy="'+o.y+'" style="cursor:move">'
      +'<rect x="'+x0+'" y="'+yA+'" width="'+(x1-x0)+'" height="'+(yB-yA)+'" rx="10" fill="'+(g.fill||'#f6f5ef')+'" stroke="'+(g.stroke||'#d6d4cc')+'"'+gdash+'/>'
      +'<text x="'+(x0+10)+'" y="'+(yA+16)+'" font-size="11.5" fill="'+labelInk(g.fill||'#f6f5ef','#6f6e69')+'">'+esc(g.label)+'</text></g>');
    W=Math.max(W,x1); Hh=Math.max(Hh,yB-y0-20);
  }
  // zone bands on groups: above the group background, below the nodes.
  // dir picks the measuring axis and its 0% edge: up=bottom, down=top,
  // right=left edge, left=right edge.
  const bandRect=(f,x0,yA,x1,yB)=>{
    const w=x1-x0, h=yB-yA;
    if(f.dir==='up')    return [x0, yB-h*f.to/100, w, h*(f.to-f.from)/100];
    if(f.dir==='down')  return [x0, yA+h*f.from/100, w, h*(f.to-f.from)/100];
    if(f.dir==='right') return [x0+w*f.from/100, yA, w*(f.to-f.from)/100, h];
    return [x1-w*f.to/100, yA, w*(f.to-f.from)/100, h];   // left
  };
  for(const f of zsort(doc.bands)){
    const B=gBox[f.target]; if(!B) continue;
    const [bx,by,bw,bh]=bandRect(f,B.x0,B.yA,B.x1,B.yB);
    gsvg.push('<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="'+f.fill+'" opacity="0.9"'+bandEdge(f)+'/>');
  }
  // edges (sorted by plane z, then doc order)
  const edges=zsort(doc.edges);
  const esvg=[], lblsvg=[];  // labels paint last = closest to the viewer
  // ── deferred edge-label placement ───────────────────────────────────────
  // An edge label is not written where it is emitted.  Each emission reserves
  // its slot in lblsvg (so the paint order is unchanged) and registers the
  // segment it belongs to; one greedy pass after the edge loop scores several
  // candidate positions per label against the already-placed labels, the node
  // boxes, the arrowheads and the other edges, and writes the winner into the
  // reserved slot.  Requests are consumed in registration order, which is
  // edge order, which is deterministic — same input, same output.
  const lblReq=[], edgeSegs=[], arrowBox=[];
  const reqLabel=o=>{ o.idx=lblsvg.length; lblsvg.push(''); lblReq.push(o); };
  const noteSegs=(e,pp)=>{ for(let i=0;i+1<pp.length;i++) edgeSegs.push({e,p:pp[i],q:pp[i+1]}); };
  // arrowTri: explicit triangle painted in lblsvg (above nodes) instead of
  // SVG marker-end/marker-start which are occluded by the node fill.
  // tip=[x,y], from=[x,y] is the adjacent shaft point toward the interior
  // (direction: from→tip). Geometry matches #arr marker (viewBox 0 0 10 10,
  // refX=9, refY=5, markerWidth=7, markerHeight=7, markerUnits=strokeWidth=1.6):
  //   arm = 9*(7/10)*1.6 ≈ 10.08 px, half-width = 5*(7/10)*1.6 ≈ 5.6 px.
  const arrowTri=(tip,from,col)=>{
    const dx=tip[0]-from[0], dy=tip[1]-from[1], L=Math.hypot(dx,dy)||1;
    const ux=dx/L, uy=dy/L;          // unit vector from→tip
    const arm=10.08, hw=5.6;
    const bx=tip[0]-ux*arm, by=tip[1]-uy*arm;  // base centre
    const lx=bx-uy*hw, ly=by+ux*hw;             // left corner
    const rx=bx+uy*hw, ry=by-ux*hw;             // right corner
    lblsvg.push('<path d="M'+tip[0]+' '+tip[1]+' L'+lx+' '+ly+' L'+rx+' '+ry+' z" fill="'+col+'" stroke="none"/>');
    arrowBox.push({x:Math.min(tip[0],lx,rx), y:Math.min(tip[1],ly,ry),
                   w:Math.max(tip[0],lx,rx)-Math.min(tip[0],lx,rx),
                   h:Math.max(tip[1],ly,ry)-Math.min(tip[1],ly,ry)});
  };
  // back-edge side channel: beyond the occupied lanes (nodes AND group boxes)
  let occR=0, occB=0;
  for(const n of nodes){ occR=Math.max(occR,n.x+n.w); occB=Math.max(occB,n.y+n.h); }
  for(const k in gBox){ occR=Math.max(occR,gBox[k].x1); occB=Math.max(occB,gBox[k].yB); }
  if(!horiz) chains.forEach((chain,e)=>{      // chain labels stick out right
    if(!e.mid) return;
    const v=chain[1+Math.floor((chain.length-3)/2)];
    occR=Math.max(occR, v.x+v.w/2+9+lblPx(e.mid));
  });
  for(const e of edges){
    const A=byId[e.a], B=byId[e.b]; if(!A||!B) continue;
    // an edge is pure stroke: `stroke=` and `fill=` name the same channel
    // (stroke= wins), `text=` colours the [tail]/[mid]/[head] labels.
    // 0.1 (§8.4): `fill=` on an edge is a line error, so the silent
    // precedence this line encoded no longer has anything to resolve.
    const col=e.stroke||'#555';
    // 0.1 (`LABEL-COLOUR-SOURCE`): an edge has no interior, so its labels cannot be
    // derived from a fill — they follow their OWNER, the line. Before this
    // release the mid label did (`e.color||col`) and the [tail]/[head] labels
    // did NOT (`e.color||'#555'`): one construct, two undocumented defaults,
    // so a stroke=#0f766e edge drew a teal mid label and two grey endpoint
    // labels. All three now take the line's colour.
    const lcol=col, ecol=col;
    const dash=e.style==='dashed'?' stroke-dasharray="6 4"':(e.style==='dotted'?' stroke-dasharray="2 4"':'');
    const wantsStart=e.op==='<->'||e.op==='<-', wantsEnd=e.op==='<->'||e.op==='->';
    const m1='', m2='';   // markers removed — arrowTri() paints triangles above nodes in lblsvg
    const halo=' paint-order="stroke" stroke="#fff" stroke-width="3"';
    const seg=(p,q,t,lbl,fs)=>reqLabel({p,q,t0:t,text:lbl,fs,col:ecol,halo,e,A,B,kind:'end'});
    if(isBack.has(e)&&!pinned(e.a)&&!pinned(e.b)){
      // back-edge (retry loop): polyline through a side channel beyond the
      // occupied lanes instead of a straight line hidden under the spine,
      // using the nested slot from the channel plan. Ring-eligible loops
      // wrap over the top and enter the hub's top edge; otherwise, when
      // the sideways run to the channel would cut through a sibling node,
      // the route drops into the inter-layer gap first.
      const lane=r=>(ranksArr[r]||[]).filter(n=>!n.virtual);
      const P=chPlan.get(e), ring=P.ring;
      const pts=[];
      if(horiz){             // channel runs below the lanes
        const chY=occB+28+P.slot;             // labels ride ON the channel
        const colR=r=>Math.max(...lane(r).map(n=>n.x+n.w));
        const blockedV=(y1,y2,xx,skip)=>nodes.some(n=>n!==skip&&!n.boundary&&n.x<xx&&n.x+n.w>xx&&n.y+n.h>y1&&n.y<y2);
        const sx=A===B?A.x+A.w*0.3:A.x+A.w/2, tx=A===B?B.x+B.w*0.7:B.x+B.w/2;
        if(A!==B&&blockedV(A.y+A.h,chY,sx,A)){
          const gx=colR(A.rank)+10+ring*7;
          pts.push([outSide(A,'r'),A.y+A.h/2],[gx,A.y+A.h/2],[gx,chY]);
        } else pts.push([sx,outSide(A,'b')],[sx,chY]);
        if(A!==B&&blockedV(B.y+B.h,chY,tx,B)){
          const gx=colR(B.rank)+10+ring*7;
          pts.push([gx,chY],[gx,B.y+B.h/2],[outSide(B,'r'),B.y+B.h/2]);
        } else pts.push([tx,chY],[tx,outSide(B,'b')]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[1]===chY);
          reqLabel({p:pts[c1],q:pts[c1+1],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:false});
        }
      } else if(P.ringOK){   // concentric ring: under, around, over, in
        const sx=A.x+A.w/2;
        const gy=occB+14+ring*12, chX=occR+28+P.slot, topY=chTop-14-ring*12;
        pts.push([sx,outSide(A,'b')],[sx,gy],[chX,gy],[chX,topY],[P.ex,topY],[P.ex,outSide(B,'t')]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[0]===chX);
          reqLabel({p:pts[c1],q:pts[c1+1],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:false});
        }
      } else {               // channel runs right of the lanes
        const chX=occR+28+P.slot;
        const laneB=r=>Math.max(...lane(r).map(n=>n.y+n.h));
        const blockedH=(x1,x2,yy,skip)=>nodes.some(n=>n!==skip&&!n.boundary&&n.y<yy&&n.y+n.h>yy&&n.x+n.w>x1&&n.x<x2);
        const sy=A===B?A.y+A.h*0.3:A.y+A.h/2, ty=A===B?B.y+B.h*0.7:B.y+B.h/2;
        if(A!==B&&blockedH(A.x+A.w,chX,sy,A)){
          const gy=laneB(A.rank)+10+ring*7;
          pts.push([A.x+A.w/2,outSide(A,'b')],[A.x+A.w/2,gy],[chX,gy]);
        } else pts.push([outSide(A,'r'),sy],[chX,sy]);
        if(A!==B&&blockedH(B.x+B.w,chX,ty,B)){
          const gy=laneB(B.rank)+10+ring*7;
          pts.push([chX,gy],[B.x+B.w/2,gy],[B.x+B.w/2,outSide(B,'b')]);
        } else pts.push([chX,ty],[outSide(B,'r'),ty]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[0]===chX);
          reqLabel({p:pts[c1],q:pts[c1+1],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:false});
        }
      }
      // non-incident nodes are obstacles for the channel runs too: a run
      // that would cut through a sibling (e.g. a pinned node parked on the
      // escape lane) detours around it instead of drawing across it. When
      // spanning the following corner point gives a shorter total run than
      // detour + remaining leg (a detour "spike"), the corner is dropped.
      const obsN=nodes.filter(n=>n!==A&&n!==B&&!n.boundary).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
      const plen=pp=>{let s=0;for(let k=0;k+1<pp.length;k++)s+=Math.hypot(pp[k+1][0]-pp[k][0],pp[k+1][1]-pp[k][1]);return s;};
      for(let i=0;i+1<pts.length;i++){
        const d=routeAround(pts[i],pts[i+1],obsN);
        if(!d) continue;
        let ins=d.slice(1,-1), drop=0;
        if(i+2<pts.length){
          const span=segHitsObs(pts[i],pts[i+2],obsN)
            ?routeAround(pts[i],pts[i+2],obsN):[pts[i],pts[i+2]];
          if(span&&plen(span)<plen(d)+Math.hypot(pts[i+2][0]-pts[i+1][0],pts[i+2][1]-pts[i+1][1])-1e-6){
            ins=span.slice(1,-1); drop=1;
          }
        }
        pts.splice(i+1,drop,...ins);
        i+=ins.length;
      }
      for(const p of pts){ W=Math.max(W,p[0]+4); Hh=Math.max(Hh,p[1]+16-y0-20); }
      esvg.push('<path data-edge="'+e.line+'" d="'+roundPath(pts)+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+'/>');
      noteSegs(e,pts);
      if(e.tail) seg(pts[0],pts[1],0.5,e.tail,10);
      if(e.head) seg(pts[pts.length-1],pts[pts.length-2],0.5,e.head,10);
      if(wantsStart) arrowTri(pts[0],pts[1],col);
      if(wantsEnd)   arrowTri(pts[pts.length-1],pts[pts.length-2],col);
      continue;
    }
    const chain=chains.get(e);
    if(chain){
      // multi-layer edge: polyline through its reserved waypoint lane;
      // each waypoint contributes an entry and an exit port so the run
      // through a layer is parallel to it and diagonals stay in the gaps
      const pts=[];
      let px=A.x+A.w/2, py=A.y+A.h/2;
      for(const v of chain.slice(1,-1)){
        const cx=v.x+v.w/2, cy=v.y+v.h/2;
        let p=horiz?[v.x,cy]:[cx,v.y], q=horiz?[v.x+v.w,cy]:[cx,v.y+v.h];
        if(horiz? px>cx : py>cy){ const t=p; p=q; q=t; }
        pts.push(p,q); px=q[0]; py=q[1];
      }
      const p0=borderPoint(A,pts[0][0],pts[0][1]);
      const p1=borderPoint(B,pts[pts.length-1][0],pts[pts.length-1][1]);
      pts.unshift(p0); pts.push(p1);
      // the middle waypoint's own port run carries the label; capture it now,
      // before collinear simplification renumbers the point list
      let midSeg=null;
      if(e.mid){ const j=Math.floor((chain.length-3)/2); midSeg=[pts[1+2*j],pts[2+2*j]]; }
      // Obstacle avoidance on the chain run: the excursion clamp pulls a long
      // forward run in toward its own endpoints, which can make a connector
      // segment graze a node the edge does not touch. routeAround detours only
      // segments that actually hit an obstacle (it returns null otherwise), so
      // clean chains — every chain before this change — are left byte-for-byte
      // unchanged; only a clamped segment that would pierce a node gets bent
      // around it. This keeps the edge-through-node count from regressing while
      // the clamp does its job. Same obstacle set the straight edges use.
      {
        const obs=nodes.filter(n=>n!==A&&n!==B&&!n.boundary).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
        for(let i=0;i+1<pts.length;i++){
          const d=routeAround(pts[i],pts[i+1],obs);
          if(!d) continue;
          const ins=d.slice(1,-1);
          if(midSeg&&midSeg[0]===pts[i]&&midSeg[1]===pts[i+1]&&ins.length) midSeg=[pts[i],ins[0]];
          pts.splice(i+1,0,...ins); i+=ins.length;
        }
      }
      // Collapse collinear interior points: home-anchored waypoints line up, so
      // the per-rank entry/exit ports leave long straight runs punctuated by
      // redundant vertices. Dropping points that lie on the segment between
      // their neighbours turns a 40-point staircase into the 2–4 bends a
      // dummy-vertex chain should have, without moving the drawn line.
      simplifyPts(pts);
      esvg.push('<path data-edge="'+e.line+'" d="'+roundPath(pts)+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+'/>');
      noteSegs(e,pts);
      if(midSeg) reqLabel({p:midSeg[0],q:midSeg[1],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:false});
      if(e.tail) seg(p0,pts[1],0.4,e.tail,10);
      if(e.head) seg(p1,pts[pts.length-2],0.4,e.head,10);
      if(wantsStart) arrowTri(pts[0],pts[1],col);
      if(wantsEnd)   arrowTri(pts[pts.length-1],pts[pts.length-2],col);
      continue;
    }
    const ax=A.x+A.w/2, ay=A.y+A.h/2, bx=B.x+B.w/2, by=B.y+B.h/2;
    let [x1,yy1]=borderPoint(A,bx,by), [x2,yy2]=borderPoint(B,ax,ay);
    const ap=apOff.get(e);   // anti-parallel fan-out (labels ride along)
    if(ap){ x1+=ap[0]; yy1+=ap[1]; x2+=ap[0]; yy2+=ap[1]; }
    // group boxes and non-incident nodes are routing obstacles: a straight
    // run that pierces a node it does not touch, or a group box it neither
    // starts nor ends inside, detours around the obstacle boundary instead
    // (routeAround). Obstacle-free edges keep the plain line unchanged.
    let route=null;
    if(A!==B){
      const obs=nodes.filter(n=>n!==A&&n!==B&&!n.boundary).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
      for(const k in gBox){
        const b=gBox[k];
        const inG=(px,py)=>px>b.x0&&px<b.x1&&py>b.yA&&py<b.yB;
        if(!inG(x1,yy1)&&!inG(x2,yy2))
          obs.push({x:b.x0,y:b.yA,w:b.x1-b.x0,h:b.yB-b.yA});
      }
      route=routeAround([x1,yy1],[x2,yy2],obs);
      if(route){           // leave the node facing the first/last bend
        route[0]=borderPoint(A,route[1][0],route[1][1]);
        route[route.length-1]=borderPoint(B,route[route.length-2][0],route[route.length-2][1]);
      }
    }
    if(route){
      esvg.push('<path data-edge="'+e.line+'" d="'+roundPath(route)+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+'/>');
      noteSegs(e,route);
      if(e.mid){             // the longest segment carries the mid label
        let bi=0,bl=-1;
        for(let i=0;i+1<route.length;i++){
          const l=Math.hypot(route[i+1][0]-route[i][0],route[i+1][1]-route[i][1]);
          if(l>bl){ bl=l; bi=i; }
        }
        reqLabel({p:route[bi],q:route[bi+1],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:bi===0});
      }
      if(e.tail) seg(route[0],route[1],0.25,e.tail,10);
      if(e.head) seg(route[route.length-1],route[route.length-2],0.25,e.head,10);
      if(wantsStart) arrowTri(route[0],route[1],col);
      if(wantsEnd)   arrowTri(route[route.length-1],route[route.length-2],col);
      for(const pP of route){ W=Math.max(W,pP[0]+4); Hh=Math.max(Hh,pP[1]+4-y0-20); }
      continue;
    }
    esvg.push('<line data-edge="'+e.line+'" x1="'+x1+'" y1="'+yy1+'" x2="'+x2+'" y2="'+yy2+'" stroke="'+col+'" stroke-width="1.6"'+dash+'/>');
    noteSegs(e,[[x1,yy1],[x2,yy2]]);
    if(e.mid)
      reqLabel({p:[x1,yy1],q:[x2,yy2],text:e.mid,fs:11,col:lcol,halo,e,A,B,kind:'mid',first:true});
    // endpoint labels at the tail/head positions (three-position model, `EDGE-LABEL-PLACEMENT`)
    if(e.tail) seg([x1,yy1],[x2,yy2],0.18,e.tail,10);
    if(e.head) seg([x1,yy1],[x2,yy2],0.82,e.head,10);
    if(wantsStart) arrowTri([x1,yy1],[x2,yy2],col);
    if(wantsEnd)   arrowTri([x2,yy2],[x1,yy1],col);
  }
  // ── edge-label placement: candidates + greedy collision-aware choice ─────
  // For each registered label the carrying segment is sampled at several
  // parameters t and on both sides of the line, giving a small candidate set.
  // Candidates are scored by overlap area against everything already on the
  // canvas — the labels placed before it (document order), the node boxes,
  // the arrowheads, and the other edges — plus a pull back toward the
  // preferred point on the segment.  The lowest score wins.  No randomness,
  // no iteration to a fixed point: one deterministic pass.
  if(lblReq.length){
    const obst=nodes.filter(n=>!n.boundary).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h,n}));
    const ovl=(a,b)=>{
      const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
      const iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
      return ix>0&&iy>0?ix*iy:0;
    };
    // Liang-Barsky: does segment p→q touch the interior of rect r?
    const segHit=(p,q,r)=>{
      let t0=0,t1=1;
      const d=[q[0]-p[0],q[1]-p[1]];
      const P=[-d[0],d[0],-d[1],d[1]];
      const Q=[p[0]-r.x, r.x+r.w-p[0], p[1]-r.y, r.y+r.h-p[1]];
      for(let i=0;i<4;i++){
        if(Math.abs(P[i])<1e-9){ if(Q[i]<0) return false; continue; }
        const t=Q[i]/P[i];
        if(P[i]<0){ if(t>t1) return false; if(t>t0) t0=t; }
        else      { if(t<t0) return false; if(t<t1) t1=t; }
      }
      return t1>t0;
    };
    const CLAMP=t=>Math.max(0.06,Math.min(0.94,t));
    const cand=(r,t,side)=>{
      const lines=String(r.text).split('\n'), n=lines.length;
      const w=Math.max(...lines.map(l=>l.length))*6.5*r.fs/11;
      const lh=r.fs*1.3, h=(n-1)*lh+r.fs*1.1;
      const up=(n-1)*lh/2+r.fs*0.85;          // baseline y = box top + up
      const mx=r.p[0]+(r.q[0]-r.p[0])*t, my=r.p[1]+(r.q[1]-r.p[1])*t;
      let bx,by,x,anchor=n>1?'middle':'start';
      if(side==='on')          { bx=mx-w/2; by=my-4-up;  anchor='middle'; }
      else if(side==='above')  { bx=mx-w/2; by=my-3-h;   anchor='middle'; }
      else if(side==='below')  { bx=mx-w/2; by=my+3;     anchor='middle'; }
      else if(side==='right')  { bx=mx+6;   by=my-h/2; }
      else                     { bx=mx-6-w; by=my-h/2; }
      x=anchor==='middle'?bx+w/2:bx;
      return {x,y:by+up,anchor,t,side,box:{x:bx,y:by,w,h}};
    };
    const placed=[];
    for(const r of lblReq){
      const dx=r.q[0]-r.p[0], dy=r.q[1]-r.p[1];
      const across=Math.abs(dx)>=Math.abs(dy);
      let sides, ts, tPref;
      if(r.kind==='end'){
        // endpoint labels keep their historical spot as first choice
        sides=['on'].concat(across?['above','below']:['right','left']);
        tPref=r.t0;
        ts=[r.t0,r.t0-0.06,r.t0+0.06,r.t0-0.12,r.t0+0.12].map(CLAMP);
      } else {
        sides=across?['above','below']:['right','left'];
        // flowchart convention: a short branch marker leaving a decision node
        // reads as that branch's name only if it sits next to the decision.
        // `FLOWCHART-ROLE-KEYWORDS`: the test is the ROLE, not the geometry. Until
        // this release it read `r.A.shape==='diamond'`, which is the renderer
        // consuming a `shape=` value AS a role — exactly what `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` forbids,
        // and a live violation the backlog had recorded (entry 12). Now that
        // `decision` exists as a word, the heuristic can ask the model.
        const branch=r.first && r.A && r.A.role==='decision' &&
                     String(r.text).length<=3 && !String(r.text).includes('\n');
        tPref=branch?0.22:0.5;
        ts=branch?[0.22,0.3,0.16,0.4,0.5,0.62]:[0.5,0.38,0.62,0.28,0.72];
      }
      let best=null,bestS=Infinity;
      for(let si=0;si<sides.length;si++) for(const t of ts){
        const c=cand(r,t,sides[si]);
        let s=0;
        for(const b of placed)   s+=3*ovl(c.box,b);
        for(const o of obst)     s+=(o.n===r.A||o.n===r.B?6:2.4)*ovl(c.box,o);
        for(const a of arrowBox) s+=4*ovl(c.box,a);
        for(const g of edgeSegs) if(g.e!==r.e && segHit(g.p,g.q,c.box)) s+=26;
        s+=70*Math.abs(t-tPref)+si*10;
        if(c.box.x<2) s+=400;                 // would fall off the left margin
        if(s<bestS-1e-9){ bestS=s; best=c; }
      }
      lblsvg[r.idx]=textEl(best.x,best.y,r.fs,best.anchor,r.col,r.text,r.halo);
      placed.push(best.box);
      W=Math.max(W, best.box.x+best.box.w+4);
      Hh=Math.max(Hh, best.box.y+best.box.h+4-y0-20);
    }
  }
  // nodes on top (each wrapped in a draggable, identifiable group)
  const nsvg=[];
  for(const n of nodes){
    if(n.boundary){
      // never drawn as a shape (`EXTERNAL-EDGE-ENDPOINTS`): the edge already ended open at the
      // anchor; a declared label sits just beyond the open end, on the
      // side away from the figure — small muted text with a white halo
      if(!n.label) continue;
      const cx=n.x+n.w/2, cy=n.y+n.h/2, [bdx,bdy]=bDir(n);
      const bhalo=' paint-order="stroke" stroke="#fff" stroke-width="3"';
      // an `external` is never drawn (`EXTERNAL-EDGE-ENDPOINTS`): no fill, no line of its own, so
      // there is nothing to derive from. Its label keeps the muted canvas ink
      // (`LABEL-COLOUR-SOURCE` — stated in §5 rather than left to the engine).
      const bcol='#555';
      if(Math.abs(bdx)>=Math.abs(bdy)){
        if(bdx>=0){ lblsvg.push(textEl(cx+10,cy+3.5,10,'start',bcol,n.label,bhalo));
                    W=Math.max(W,cx+12+lblPx(n.label)); }
        else lblsvg.push(textEl(cx-10,cy+3.5,10,'end',bcol,n.label,bhalo));
      } else if(bdy>=0){
        lblsvg.push(textEl(cx,cy+17,10,'middle',bcol,n.label,bhalo));
        Hh=Math.max(Hh,cy+21-y0-20);
      } else lblsvg.push(textEl(cx,cy-10,10,'middle',bcol,n.label,bhalo));
      continue;
    }
    nsvg.push('<g data-node="'+n.id+'" data-x="'+n.x+'" data-y="'+n.y+'" style="cursor:move">');
    const fill=n.fill||'#fff', stroke=n.stroke||'#8a8880', txt=labelInk(fill,'#1d1d1b');
    const ndash=n.style==='dashed'?' stroke-dasharray="6 4"':(n.style==='dotted'?' stroke-dasharray="2 4"':'');
    if(n.shape==='diamond'){
      const cx=n.x+n.w/2, cy=n.y+n.h/2;
      nsvg.push('<polygon points="'+cx+','+n.y+' '+(n.x+n.w)+','+cy+' '+cx+','+(n.y+n.h)+' '+n.x+','+cy+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    } else if(n.shape==='rounded'){
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="'+Math.min(14,n.h/2)+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+' stroke-width="1.8"/>');
    } else if(n.shape==='ellipse'||n.shape==='circle'){
      nsvg.push('<ellipse cx="'+(n.x+n.w/2)+'" cy="'+(n.y+n.h/2)+'" rx="'+(n.w/2)+'" ry="'+(n.shape==='circle'?n.w/2:n.h/2)+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    } else if(n.shape==='cylinder'){
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="3" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>'
        +'<line x1="'+n.x+'" y1="'+(n.y+7)+'" x2="'+(n.x+n.w)+'" y2="'+(n.y+7)+'" stroke="'+stroke+'"/>');
    } else {
      // box = right-angle rectangle (the mainstream default: Mermaid/
      // Graphviz rects, hardware block diagrams); use shape=rounded for corners
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    }
    // zone bands on this node (dir: up=bottom-based, down, left, right)
    for(const f of zsort(doc.bands)){
      if(f.target!==n.id) continue;
      const [bx,by,bw,bh]=bandRect(f,n.x,n.y,n.x+n.w,n.y+n.h);
      nsvg.push('<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="'+f.fill+'" opacity="0.9"'+bandEdge(f)+'/>');
    }
    // label with shrink-to-fit when size is rigid (`UNDECLARED-ATTRIBUTE-BEHAVIOUR`); multi-line via "\n"
    let fs=FONT;
    const nl=String(n.label).split('\n');
    const need=Math.max(...nl.map(l=>l.length))*CH;
    // budget = the width the OUTLINE offers at the label's own height, minus
    // 8 px clearance each side. For a box that is n.w-16, exactly as before;
    // for a rhombus or an ellipse it is the inscribed width, so a rigid
    // shaped node shrinks its text to what the reader can actually see.
    const avail=2*inscribedHalfW(shapeAxes(n),nl.length*8)-16;
    if(n.rigid && need>avail) fs=Math.max(8, FONT*avail/need);
    nsvg.push(textEl(n.x+n.w/2, n.y+n.h/2+fs*0.35, fs, 'middle', txt, n.label));
    nsvg.push('</g>');
  }
  // trunk rings (semantic LAG/ES bundles): the ellipse is DERIVED from the
  // member links' midpoints — drag a node and the ring follows
  const tsvg=[];
  for(const t of zsort(doc.trunks)){
    const mids=[];
    for(const [a,b] of t.pairs){
      const A=byId[a], B=byId[b]; if(!A||!B) continue;
      const [x1,yy1]=borderPoint(A,B.x+B.w/2,B.y+B.h/2);
      const [x2,yy2]=borderPoint(B,A.x+A.w/2,A.y+A.h/2);
      mids.push([(x1+x2)/2,(yy1+yy2)/2]);
    }
    if(!mids.length) continue;
    const cx=mids.reduce((s,m)=>s+m[0],0)/mids.length;
    const cy=mids.reduce((s,m)=>s+m[1],0)/mids.length;
    const rx=Math.max(46, Math.max(...mids.map(m=>Math.abs(m[0]-cx)))+38);
    const ry=Math.max(26, Math.max(...mids.map(m=>Math.abs(m[1]-cy)))+22);
    // 0.1 (§8.4): the ring has no interior — `stroke=` is the one
    // name for its channel; `fill=` on a bundle is now a line error, so the
    // model field is always absent and the old `t.fill` fallback is gone.
    const col=t.stroke||'#64748b';
    tsvg.push('<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="transparent" stroke="'+(t.stroke||col)+'"'+dashOf(t.style,'6 4')+' stroke-width="1.6"/>');
    tsvg.push(textEl(cx, cy+4, 11.5, 'middle', col, t.label,' paint-order="stroke" stroke="#fff" stroke-width="3"'));
    W=Math.max(W,cx+rx); Hh=Math.max(Hh,cy+ry-y0-20);
  }
  // threshold markers + labels (top layer). The target is a GROUP box or,
  // a single NODE box — the same two scopes `band` has always
  // taken (§2.6, `AUTHORING-INTENT-OVER-RENDERING`); a node's box is spelled in the gBox coordinate shape.
  for(const gl of zsort(doc.thresholds)){
    const gn=byId[gl.target];
    const B=gBox[gl.target] || (gn ? {x0:gn.x, x1:gn.x+gn.w, yA:gn.y, yB:gn.y+gn.h} : null);
    if(!B) continue;
    const ly=B.yB-(B.yB-B.yA)*gl.pct/100;
    // 0.1 (§8.4): same as the bundle ring — `stroke=` only.
    const col=gl.stroke||'#ef4444';
    tsvg.push('<g data-gline="'+gl.line+'" data-gtop="'+B.yA+'" data-gbot="'+B.yB+'" style="cursor:ns-resize">'
      +'<line x1="'+B.x0+'" y1="'+ly+'" x2="'+B.x1+'" y2="'+ly+'" stroke="'+(gl.stroke||col)+'" stroke-width="'+(gl.pct>=100?4:2)+'"'+dashOf(gl.style,'7 4')+'/>'
      +'<line x1="'+B.x0+'" y1="'+ly+'" x2="'+B.x1+'" y2="'+ly+'" stroke="transparent" stroke-width="12"/>'
      +textEl(B.x1+8, ly+4, 11, 'start', col, gl.label,' paint-order="stroke" stroke="#fff" stroke-width="3"')+'</g>');
    W=Math.max(W, B.x1+8+tw(gl.label)); Hh=Math.max(Hh, B.yB-y0-20);
  }
  // band labels (`BAND-LABEL-STATUS`). The RECT is painted with its target — under
  // the nodes for a group-scope band, with the node for a node-scope one — so
  // the label cannot ride along there: it would be occluded by whatever sits on
  // top. It is written here instead, in the same top layer as the threshold
  // labels, CENTRED INSIDE the band's own rectangle. Inside, not beside: the
  // band already owns an area, so the name needs no gutter and the canvas box
  // does not grow — W and Hh are untouched, which is why adding the label moves
  // no existing geometry in any figure.
  for(const f of zsort(doc.bands)){
    const bn=byId[f.target];
    const B=gBox[f.target] || (bn ? {x0:bn.x, x1:bn.x+bn.w, yA:bn.y, yB:bn.y+bn.h} : null);
    if(!B) continue;
    const [bx,by,bw,bh]=bandRect(f,B.x0,B.yA,B.x1,B.yB);
    tsvg.push(textEl(bx+bw/2, by+bh/2+4, 11, 'middle', labelInk(f.fill,'#334155'), f.label,
                     ' paint-order="stroke" stroke="#fff" stroke-width="3"'));
  }
  const yEnd=y0+20+Hh+10;
  return {svg:gsvg.join('')+esvg.join('')+nsvg.join('')+tsvg.join('')+lblsvg.join(''), y:yEnd, w:W+2,
          meta:{W:W, top:y0+20+chShift, Hh:Hh, left:bShift}};
}
// borderPoint: where the ray from n's centre toward (tx,ty) leaves the shape.
// It must leave the DRAWN outline: a rectangle clip on a diamond or an ellipse
// stops on the bounding box, which for a rhombus can be a corner where the
// shape is not — the endpoint then floats in empty space next to the shape.
function borderPoint(n,tx,ty){
  const cx=n.x+n.w/2, cy=n.y+n.h/2, dx=tx-cx, dy=ty-cy;
  if(dx===0&&dy===0) return [cx,cy];
  const g=shapeAxes(n);
  // rectangles keep the original min-of-ratios expression (bit-for-bit, so
  // no rectangle figure moves); curved shapes divide the direction by the
  // homogeneous outline norm, which lands exactly on the outline.
  const s=g.p===Infinity
    ? Math.min(g.a/Math.abs(dx||1e-9), g.b/Math.abs(dy||1e-9))
    : 1/outlineNorm(g,dx,dy);
  return [cx+dx*s, cy+dy*s];
}
// straight-edge obstacle routing: group boxes and non-incident nodes are
// obstacles a straight edge must not cut through.
// clipSegRect (Liang-Barsky): the [t0,t1] parameter window where segment
// p->q lies inside the box, or null when it misses entirely.
function clipSegRect(p,q,x0,y0,x1,y1){
  let t0=0,t1=1; const dx=q[0]-p[0], dy=q[1]-p[1];
  for(const [den,num] of [[-dx,p[0]-x0],[dx,x1-p[0]],[-dy,p[1]-y0],[dy,y1-p[1]]]){
    if(den===0){ if(num<0) return null; continue; }
    const t=num/den;
    if(den<0){ if(t>t1) return null; if(t>t0) t0=t; }
    else     { if(t<t0) return null; if(t<t1) t1=t; }
  }
  return t0<t1?[t0,t1]:null;
}
// routeAround: detour segment p->q around obstacle rects via the shortest
// clear polyline. Candidate bend points are the corners of each obstacle
// expanded by a 10px clearance margin; a sight-line is clear when it cuts
// no obstacle interior. Dijkstra over that visibility graph keeps routes
// short and calm, and is deterministic (fixed vertex order — endpoints,
// then obstacles in caller order with corners clockwise from top-left —
// breaks ties). Obstacles already containing an endpoint cannot be
// avoided and are ignored. Returns the detour polyline, or null when the
// straight segment is clear — callers keep their original rendering then.
function segHitsObs(p,q,obs){
  for(const r of obs)
    if(clipSegRect(p,q,r.x+2,r.y+2,r.x+r.w-2,r.y+r.h-2)) return true;
  return false;
}
function routeAround(p,q,obs){
  const M=10;
  const inside=(pt,r)=>pt[0]>r.x+2&&pt[0]<r.x+r.w-2&&pt[1]>r.y+2&&pt[1]<r.y+r.h-2;
  obs=obs.filter(r=>!inside(p,r)&&!inside(q,r));
  const blocked=(a,b)=>segHitsObs(a,b,obs);
  if(!blocked(p,q)) return null;
  const V=[p.slice(),q.slice()];
  for(const r of obs){
    const L=r.x-M, T=r.y-M, R=r.x+r.w+M, B=r.y+r.h+M;
    for(const c of [[L,T],[R,T],[R,B],[L,B]])
      if(!obs.some(o=>inside(c,o))) V.push(c);
  }
  const n=V.length, dist=Array(n).fill(Infinity), from=Array(n).fill(-1), done=Array(n).fill(false);
  dist[0]=0;
  for(;;){
    let u=-1;
    for(let i=0;i<n;i++) if(!done[i]&&(u<0||dist[i]<dist[u])) u=i;
    if(u<0||u===1||dist[u]===Infinity) break;
    done[u]=true;
    for(let v=0;v<n;v++){
      if(done[v]||blocked(V[u],V[v])) continue;
      const d=dist[u]+Math.hypot(V[v][0]-V[u][0],V[v][1]-V[u][1]);
      if(d<dist[v]-1e-9){ dist[v]=d; from[v]=u; }
    }
  }
  if(dist[1]===Infinity) return null;    // boxed in: keep the straight line
  const pts=[]; for(let v=1;v!==-1;v=from[v]) pts.push(V[v]); pts.reverse();
  for(let i=1;i+1<pts.length;i++){ // drop duplicate / collinear midpoints
    const a=pts[i-1], b=pts[i], c=pts[i+1];
    const cr=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if(Math.hypot(b[0]-a[0],b[1]-a[1])<0.5||Math.abs(cr)<1e-6){ pts.splice(i,1); i--; }
  }
  return pts.length>2?pts:null;
}

// ---- bitfield ----
function renderBitfield(b,y0){
  const cell=Math.max(18,Math.min(28,Math.floor(760/b.word))), rh=30, ruler=16;
  const svg=[]; let y=y0+18;
  // §5 on the block: text= is the caption colour, fill=/stroke= are the
  // per-cell defaults a field can override.
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(b.label)+'</text>');
  // ruler: lsb0 (register style, default) = N-1..0; msb0 (RFC style) = 0..N-1
  for(let i=0;i<b.word;i++){
    const bit=(b.numbering==='msb0') ? i : b.word-1-i;
    svg.push('<text x="'+(i*cell+cell/2)+'" y="'+(y+11)+'" font-size="8.5" text-anchor="middle" fill="#6f6e69">'+bit+'</text>');
  }
  y+=ruler;
  // `BITFIELD-REPETITION-CONSTRUCT`: the DERIVED elision row. A field carrying `index=` is
  // ONE ELEMENT of a repeated run, and the engine draws what that means. Same
  // division of labour as `present=`: the author names the meaning, the engine
  // owns the convention (`DOMAIN-CONVENTION-DIRECTIVES`), and there is no option key for any of it.
  //
  // `REPEATED-RUN-DRAWING`: WHAT that means is the RFC's own drawing — FIRST
  // element, elision, LAST element. RFC 8754 §2, the document examples/srh.fd
  // transcribes, prints
  //
  //     |            Segment List[0] (128-bit IPv6 address)             |
  //                                   ...
  //     |            Segment List[n] (128-bit IPv6 address)             |
  //
  // and 0.1 already ruled that a spanning field follows the RFC's
  // drawing rather than a FigDown one; this is the same ruling applied to the
  // other construct in the same figure. Until this release the engine drew ONE
  // occurrence and hung `[first] … [last]` on the strip — a FigDown invention
  // where a convention already existed.
  //
  // THE INDEX IS APPENDED TO THE AUTHOR'S LABEL, never inserted into it:
  // `Segment List (128-bit IPv6 address) [0]`, not the RFC's
  // `Segment List[0] (128-bit IPv6 address)`. Placing it the RFC's way would
  // mean PARSING the label to find where a bracket belongs, and a label is
  // opaque text (§12.7) — the engine may not read it. This is a deliberate
  // departure from the RFC's typography and the trade is the right one: the
  // reader still learns which occurrence is which, and the cost is zero.
  //
  // THE ELISION MARK IS DERIVED, never special-cased. The elements not drawn
  // number `|last - first| - 1`, and the mark is drawn when that is not ZERO:
  //   index=0..7   6 undrawn   [0], elision, [7]
  //   index=0..n   indeterminate (a prose last index)   [0], elision, [n]
  //   index=0..1   0 undrawn   [0], [1], and NO elision mark — the mark means
  //                "there are more, not drawn", and drawing it over nothing
  //                would be a false statement. It falls out of the arithmetic.
  //   index=0..0   a line error before it reaches here (not repetition)
  //   index=53..0  descending, 52 undrawn — the absolute value is why
  //
  // `index=""` (the model records `{}`) keeps the ONE-occurrence drawing plus
  // a bare strip: the author claimed repetition and declined to state any
  // index, so there is no `[first]` and no `[last]` to write, and two boxes
  // would assert a first and a last the author did not state. Same ruling
  // `present=""` gets — the author does not say, the engine does not speak for
  // them.
  //
  // The strip itself carries NO text but the elision mark. With the indices on
  // the occurrences, `[first] … [last]` on the strip would repeat them.
  //
  // THE STRIP OCCUPIES NO BIT POSITIONS. The bit cursor is untouched by it —
  // it is vertical space only, in the same family as the blank cells a
  // `break` leaves behind — so the ruler keeps meaning what it means and a
  // reader that counts drawn rows is reading the drawing (`MEANING-RECOVERY-SOURCE`), which it must
  // not do. Its width is the element's OWN columns, never the whole word: a
  // full-width strip would claim columns the element does not occupy.
  const EL_H=16;
  const elis=[];  // {row, x, w, text} — one per repeated element, in row order
  // Two repeated elements ending on the SAME drawn row share one strip BAND,
  // so the shift counts distinct rows, never elements.
  const elisBands=(below)=>{ const s=new Set();
    for(const e of elis) if(below===null||e.row<below) s.add(e.row); return s.size; };
  const shiftFor=(row)=>elisBands(row)*EL_H;
  // `FIELD-WIDER-THAN-WORD`: ONE FIELD IS ONE BOX.
  //
  // A field wider than `word=` occupies several rows. Until this release each
  // row was a separate fully-bordered <rect> carrying the full label, so a
  // 128-bit address at word=32 drew as FOUR captioned boxes and a reader saw
  // four fields where the model has one. In examples/srh.fd it was worse: the
  // four rows sat directly above that element's elision strip, so the figure
  // read as "elements 0,1,2,3 are drawn, more are elided" —
  // asserting a count of 4 that is 128/32, an artifact of the word width,
  // while the document records that run as INDETERMINATE. The drawing stated
  // a number the source refuses to state. `MEANING-RECOVERY-SOURCE` forbids a READER to take a
  // quantity off the drawing; this is the other half of that duty, which is
  // the engine's: do not draw a quantity the model does not carry.
  //
  // The convention is the RFCs' own. RFC 8200 §3 and RFC 8754 §2 draw a
  // multi-row field with `+   +` at its internal boundaries — the side
  // verticals continue, the horizontal rule is ABSENT — and write the name
  // once, centred on the whole extent.
  //
  // But a spanning field is not always a rectangle: a 48-bit MAC at word=32
  // fills all of row N and columns 0..15 of row N+1, an L (the case that was
  // examples/ethernet-ii.fd, cut — conformance case 424 now
  // carries all three geometries). So the rule is not "drop the horizontal
  // line". It is:
  //
  //     the boundary between two consecutive segments of the SAME field is
  //     unstroked over the horizontal extent the two segments SHARE, and
  //     stroked everywhere else.
  //
  // That is the RFCs' too, and not a generalisation of theirs: RFC 2892
  // §4.5/§4.6 draws exactly this L for a 48-bit MAC — the rule absent across
  // the field's own columns, a bare `+` at each end, the name once in the
  // wider piece. LaTeX `bytefield` §2.4 spells the same drawing as
  // `\bitbox[lrt]` over `\wordbox[lrb]`.
  //
  // Where that shared extent is EMPTY nothing can be suppressed and the field
  // has to draw as two boxes: `field "Sender Protocol Address" 32` in what
  // was examples/arp.fd starts at column 16 and ends at column 15 of the next
  // row, so its halves meet at one CORNER and share no column, and a corner
  // is not an edge a renderer can leave out. That is the ONLY geometry with
  // two boxes — every middle segment of a spanning field is a full row, so it
  // overlaps both neighbours, and disjointness can only ever happen between
  // the first segment and the second.
  //
  // The first cut of this rule captioned once per DRAWN BOX, which put the
  // name on both halves and reproduced the very misreading the rest of the
  // change removes — two captioned boxes read as two fields, and same-name
  // does not disambiguate in a language where eight fields may all be named
  // `U` (examples/srh.fd). So: THE NAME APPEARS ONCE, on the first box in
  // reading order, and every later box of the same field carries the
  // CONTINUATION MARK below instead. No box is left anonymous and no box
  // claims to be a field of its own.
  //
  // CONT — the continuation mark. RULE 4.1 says a vocabulary is borrowed
  // whole from ONE source and that invention is the last resort, so the
  // survey came first and it came back EMPTY: no packet- or register-diagram
  // tradition has a mark for this geometry. What was checked, and what each
  // does, so the next reader does not repeat it:
  //
  //   RFC ASCII art        — RFC 2892 §4.5/§4.6 is the one place the IETF
  //                          draws a 48-bit field wrapping MID-row: the
  //                          horizontal rule is absent across the field's
  //                          columns with a bare `+` at each end, and the
  //                          name is written ONCE, in the WIDER piece, the
  //                          narrow piece left blank. That is this engine's
  //                          L, and it corroborates the placement below —
  //                          but its pieces SHARE columns, so an unstroked
  //                          edge is available. RFC 826 never draws ARP's
  //                          addresses at all (a prose byte list), and RFC
  //                          903 defers to it, so the corner-touching case
  //                          has no IETF drawing anywhere. LaTeX
  //                          `bytefield` §2.4 encodes the same habit
  //                          (`\bitbox[lrt]` over `\wordbox[lrb]`).
  //   WaveDrom `bitfield`  — clips the field per lane and writes the FULL
  //                          name into every lane, each fully boxed. That
  //                          is precisely the drawing this release removes.
  //   IP-XACT / IEEE 1685  — a metadata schema with no rendering at all;
  //                          `fieldSegment` (1685-2022) slices a PORT onto
  //                          a field, not a field across a row. Nothing.
  //   Kaitai / DFDL        — neither draws a bit grid (Kaitai's graphviz
  //                          target is a pos/size/type table), so the case
  //                          cannot arise. Nothing.
  //   ISO 5807 / ISO 128   — the off-page connector is control flow, and a
  //                          break line means material REMOVED, the
  //                          opposite claim. Wrong semantics, not adopted.
  //
  // So this is a coinage, and it is the minimal one: the ordinary
  // typographic abbreviation for a thing continued below, in italic to mark
  // it as the ENGINE's word and not the author's — the same division of
  // labour as the derived `present=` caption and the derived index suffix
  // (`DOMAIN-CONVENTION-DIRECTIVES`), and like those it has no option key and cannot be turned off.
  // It is deliberately TEXT. The two graphical marks this genre already
  // spends are the dashed stroke, which IS `present=` and which nothing else
  // may set or clear (`STYLE-KEY-SCOPE`), and the dotted elision strip `index=` draws
  // (whose `…` is why the mark is not an ellipsis) — a third stroke pattern
  // could not be read unambiguously against those two.
  //
  // REJECTED, so it is not re-litigated blind: the hardware-datasheet
  // convention, which is the one real prior art for the geometry — repeat
  // the name on both pieces with a bit-range suffix, `Base 31:24` /
  // `Base Address 15:00` (Intel SDM Vol. 3A Fig. 3-8), `COUNT[15:8]` /
  // `COUNT[7:0]` (Microchip DS40001882). It loses twice. It repeats the
  // name, which is the misreading being removed; and the suffix is a
  // COMPUTED bit range, which core §12.7 keeps out of the model on purpose
  // and `MEANING-RECOVERY-SOURCE` forbids a reader to take off the drawing — drawing one would
  // publish the number the model declines to hold. WHAT WOULD REOPEN IT: a
  // decision to materialize bit ranges in the model, which would make the
  // suffix a fact the drawing merely displays rather than one it invents.
  const CONT='(cont.)';
  //
  // boxOutline: the true outline of a box that is not a rectangle. Merge
  // vertically adjacent segments of equal extent into BANDS, then walk the
  // right side down and the left side back up. Every horizontal edge the walk
  // emits is a real boundary of the field; the shared part of an internal
  // boundary is never reached, which is the `+   +` above. A <path> is used
  // rather than rects-plus-edge-suppression because the shared edge is the
  // one edge a per-row rect cannot leave out: a rect strokes four sides or
  // none, and "none" would also lose the two verticals that must continue.
  // Fill stays a single closed region, so `fill=` paints the field once with
  // no seam, and the stroke carries `present=`'s dash around the whole
  // outline instead of around each row (`STYLE-KEY-SCOPE`: the dash IS conditional
  // presence, and nothing else may set or clear it).
  const boxOutline=(bx)=>{
    const bands=[];
    for(const s of bx){
      const t=bands[bands.length-1];
      if(t && t.x===s.x && t.w===s.w) t.y1=s.y+rh;
      else bands.push({x:s.x, w:s.w, y0:s.y, y1:s.y+rh});
    }
    const pts=[], add=(px,py)=>{ const t=pts[pts.length-1];
      if(!t || t[0]!==px || t[1]!==py) pts.push([px,py]); };
    add(bands[0].x+bands[0].w, bands[0].y0);
    for(let j=0;j<bands.length;j++){                    // right side, downward
      add(bands[j].x+bands[j].w, bands[j].y1);
      if(j+1<bands.length) add(bands[j+1].x+bands[j+1].w, bands[j].y1);
    }
    add(bands[bands.length-1].x, bands[bands.length-1].y1);   // the bottom
    for(let j=bands.length-1;j>=0;j--){                 // left side, upward
      add(bands[j].x, bands[j].y0);
      if(j>0) add(bands[j-1].x, bands[j].y0);
    }
    return 'M'+pts.map(p=>p[0]+' '+p[1]).join(' L')+' Z';
  };
  let pos=0; // bit cursor
  for(const f of b.fields){
    if(f.wrap){ pos=Math.ceil((pos||1)/b.word)*b.word; continue; }
    // '*' = variable-length: fill the remainder of the current row
    const w0 = f.w==='*' ? (b.word - (pos % b.word)) : f.w;
    // The row segments ONE OCCURRENCE of this field occupies, in order — one
    // row's worth each. The bit cursor advances here and nowhere else, so
    // `break` and the elision strip keep meaning exactly what they meant.
    const cut=()=>{
      const segs=[]; let rem=w0;
      while(rem>0){
        const row=Math.floor(pos/b.word), col=pos%b.word;
        const span=Math.min(rem, b.word-col);
        segs.push({row:row, x:col*cell, w:span*cell, y:y+row*rh+shiftFor(row)});
        pos+=span; rem-=span;
      }
      return segs;
    };
    // `STYLE-KEY-SCOPE`: the dash IS conditional presence, and nothing else
    // can set or clear it. `style=` used to win here under `LAYOUT-STABILITY` (the explicit
    // beats the convention), which meant `style=solid` erased the only mark
    // that carried the flag while the model kept it — `PRESENTATION-AS-MEANING-CARRIER`'s prohibition.
    // `PRESENCE-CONDITION-EXPRESSION`: the carrier is now `present=`, and BOTH of its
    // written forms dash — `present=""` claims conditional presence just as
    // `present="C = 1"` does; only the caption below distinguishes them.
    const dash=f.present!==undefined?' stroke-dasharray="5 3"':'';
    const cfill=f.fill||b.fill||'#fff';
    const paint=' fill="'+cfill+'" stroke="'+(f.stroke||b.stroke||'#555')+'"'+dash;
    // Draw one occurrence. `suffix` is the derived index label — '' for a
    // field that is not one element of a run, ' [0]' / ' [n]' for the two
    // occurrences `REPEATED-RUN-DRAWING` draws. It is APPENDED to the author's label, and the
    // label is never read (see the `REPEATED-RUN-DRAWING` note above).
    const drawOcc=(segs,suffix)=>{
    // Group the segments into DRAWN BOXES. Two consecutive segments join when
    // they are vertically adjacent AND share a positive horizontal extent.
    // The vertical test is not decoration: an elision strip can open a 16px
    // band between two rows, and a box must never be drawn across one.
    const boxes=[[segs[0]]];
    for(let i=1;i<segs.length;i++){
      const p=segs[i-1], q=segs[i];
      if(q.y===p.y+rh && Math.min(p.x+p.w,q.x+q.w) > Math.max(p.x,q.x))
        boxes[boxes.length-1].push(q);
      else boxes.push([q]);
    }
    boxes.forEach(function(bx,bi){
      // `DESCRIPTION-KEY-SPELLING`: the `<title>` is a CHILD of the shape it names, not
      // a sibling. Until this release it was pushed into the block's stream
      // after the rect and the label, so it landed under the figure's single
      // <g> — and SVG says a <title> names its PARENT, so every description in
      // a figure named the same <g> and a conforming UA showed one arbitrary
      // tooltip for the whole figure. Written on the FIRST box of a spanning
      // field only: one field, one description.
      const desc=(f.description!==undefined && bi===0)?'<title>'+esc(f.description)+'</title>':'';
      // A box whose segments all have the same horizontal extent is a plain
      // rectangle — the RFC's `+   +` case, and the only shape a
      // single-segment field can have, which is why an unspanned field's
      // bytes are unchanged by all of this.
      const flat=bx.every(s=>s.x===bx[0].x&&s.w===bx[0].w);
      const shape=flat
        ? '<rect x="'+bx[0].x+'" y="'+bx[0].y+'" width="'+bx[0].w+'" height="'+(bx.length*rh)+'"'+paint
        : '<path d="'+boxOutline(bx)+'"'+paint;
      const tag=flat?'rect':'path';
      svg.push(desc?shape+'>'+desc+'</'+tag+'>':shape+'/>');
      // ONE caption per box: the NAME on the first box, CONT on every later
      // one. The first box, not the widest — reading order is the order the
      // bits are in, so the name sits where the field starts, and a reader who
      // meets `(cont.)` has already met the name. Choosing the widest box
      // instead would put the name after the mark whenever the tail is the
      // roomier half, which is the ARP case (16 columns against 16 — a tie
      // that only reading order breaks anyway).
      //
      // A flat box is one open area, so it takes the RFC's placement: centred
      // on the box's whole vertical extent. A non-flat box has no row spanning
      // that extent, and centring there would put ink across a stroked
      // boundary or across columns that belong to the next field — so the
      // caption goes in the box's WIDEST segment, its largest contiguous area,
      // ties keeping the topmost.
      const cap=bi===0?String(f.name)+suffix:CONT;
      let lead=bx[0]; for(const s of bx) if(s.w>lead.w) lead=s;
      const ly=flat ? bx[0].y+bx.length*rh/2 : lead.y+rh/2;
      let fs=11; const need=cap.length*6.2;
      // The font shrinks to fit the segment that carries it, floor 7px — the
      // rule a too-narrow one-row field has always had. Below the floor the
      // caption overflows its box rather than vanishing: a name half outside
      // its box is legible, an undrawn one leaves a box no reader can
      // identify — and that applies to `(cont.)` for the same reason, since a
      // one-column continuation (`field "x" 2` starting at the last column)
      // is narrower than the mark at any size.
      if(need>lead.w-6) fs=Math.max(7,11*(lead.w-6)/need);
      svg.push('<text x="'+(lead.x+lead.w/2)+'" y="'+(ly+fs*0.35)+'" font-size="'+fs+'" text-anchor="middle"'+(bi?' font-style="italic"':'')+inkAttr(cfill)+'>'+esc(cap)+'</text>');
    });
    };
    const ix=f.index;
    // `REPEATED-RUN-DRAWING`: the FIRST element carries `[first]` — but only when the author
    // stated one. `index=""` names no index, so nothing is appended and only
    // this one occurrence is drawn.
    const stated = ix!==undefined && ix.first!==undefined;
    const first=cut();
    if(!first.length) continue;   // a zero-width field draws nothing (and cannot parse)
    drawOcc(first, stated?' ['+ix.first+']':'');
    if(ix!==undefined){
      // The elements between the two drawn ones. `null` = indeterminate: a
      // prose last index, or `index=""`, which states no index to subtract.
      const undrawn = (typeof ix.last==='number') ? Math.abs(ix.last-ix.first)-1 : null;
      // The elision strip, directly under the FIRST element's last drawn row —
      // between the two occurrences, which is where RFC 8754 §2 prints its
      // `...`. Not drawn when nothing is elided; see the `REPEATED-RUN-DRAWING` note above.
      if(undrawn!==0){
        const ls=first[first.length-1];
        elis.push({row:ls.row, x:ls.x, w:ls.w, y:ls.y+rh, text:'…'});
      }
      if(stated){
        // The LAST element is the first one translated straight down by its
        // own height, so the two occurrences stand in the same columns and
        // read as the same shape repeated. The cursor moves by whole ROWS to
        // get there — the skipped cells are blank drawing, in the same family
        // as the ones a `break` leaves, and are NOT bits.
        pos += first.length*b.word - w0;
        drawOcc(cut(), ' ['+ix.last+']');
      }
    }
  }
  for(const e of elis){
    const st=(b.stroke||'#555');
    // `ELISION-MARK-EXTENT`: THE SIDE DOTS SAY WHICH COLUMNS ARE ELIDED, so a
    // strip that already spans the whole word does not draw them. RFC 8754 §2
    // prints its `...` row with NO `|` at either end — the box is simply open
    // there — and an element occupying the full word needs no mark to say
    // which columns it occupied, because it occupied all of them. The dots
    // still carry information for a narrower element (reference/bitfield.fd's
    // `Queue Depth` runs columns 16-31), where without them the strip's extent
    // is guesswork. Derived from the geometry, never an option key: the same
    // shape as `REPEATED-RUN-DRAWING`'s rule for the mark itself, which draws iff something is
    // in fact undrawn.
    if(e.w < b.word*cell){
      svg.push('<line x1="'+e.x+'" y1="'+e.y+'" x2="'+e.x+'" y2="'+(e.y+EL_H)+'" stroke="'+st+'" stroke-dasharray="2 3"/>');
      svg.push('<line x1="'+(e.x+e.w)+'" y1="'+e.y+'" x2="'+(e.x+e.w)+'" y2="'+(e.y+EL_H)+'" stroke="'+st+'" stroke-dasharray="2 3"/>');
    }
    let fs=10.5; const need=e.text.length*6.2;
    if(need>e.w-6) fs=Math.max(7,10.5*(e.w-6)/need);
    svg.push('<text x="'+(e.x+e.w/2)+'" y="'+(e.y+EL_H/2+fs*0.35)+'" font-size="'+fs+'" text-anchor="middle" fill="#6f6e69">'+esc(e.text)+'</text>');
  }
  const rows=Math.max(1,Math.ceil(pos/b.word));
  let yb=y+rows*rh+elisBands(null)*EL_H+6, wb=b.word*cell+2;
  // `PRESENCE-CONDITION-EXPRESSION`: the DERIVED presence caption. `present=` must DRAW, or
  // the condition would be visible to a reading agent and invisible to the
  // human looking at the same figure — half an inversion, and the shape `CLASS-EMPTY-MEANING`
  // rejected `legend=hide` for. The author names the meaning; the engine owns
  // the drawing convention (`DOMAIN-CONVENTION-DIRECTIVES`), exactly as with the derived legend and the
  // derived bundle ring — there is no option key for this.
  // `present=""` draws NO caption line: the author claimed nothing, and
  // "condition unknown" would be the engine speaking for the author.
  const capt=b.fields.filter(f=>f.present);
  if(capt.length){
    yb+=4;
    for(const f of capt){
      const s=f.name+' — present: '+f.present;
      svg.push('<text x="0" y="'+(yb+9)+'" font-size="10.5" fill="#6f6e69">'+esc(s)+'</text>');
      wb=Math.max(wb, s.length*6.3+2); yb+=14;
    }
    yb+=2;
  }
  return {svg:svg.join(''), y:yb, w:wb};
}

// ---- table (with ^ rowspan / < colspan merging and per-cell marks) ----
function renderTable(t,y0){
  // Per-row height grows with multi-line cells (<br> → U+000A at parse).
  // Single-line rows keep the historical 26px so existing figures stay put.
  const CFS=12, CLH=CFS*1.3, CMIN=26;
  const svg=[]; let y=y0+18;
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(t.label)+'</text>');
  // grid: header tiers (from `head`/`cols` lines) then data rows
  const H=t.heads.length;
  const grid=t.heads.map(hr=>hr.map(c=>({v:c.v,m:c.m,hdr:true})))
    .concat(t.rows.map(r=>r.cells.map(c=>({v:c.v,m:c.m}))));
  const hlRow=r=>r>=H&&(t.rowmarks||[]).some(mk=>mk.r===r-H+1);
  const alignOf=c=>(t.aligns&&t.aligns[c])||null;
  const nLines=v=>Math.max(1,String(v==null?'':v).split('\n').length);
  const widths=t.cols.map((c,i)=>{
    let w=30;
    for(const hr of t.heads) if(!hr[i].m) w=Math.max(w,tw(hr[i].v));
    for(const r of t.rows) if(!r.cells[i].m) w=Math.max(w,tw(r.cells[i].v));
    return w;
  });
  if(t.width){                      // width: auto = natural, px fixed, % of natural total
    const base=widths.reduce((a,b2)=>a+b2,0);
    t.width.vals.forEach((v,i)=>{
      if(v.t==='px') widths[i]=v.v;
      else if(v.t==='pct') widths[i]=v.v/100*base;
    });
  }
  const totalW=widths.reduce((a,b)=>a+b,0);
  // row heights from max line-count among anchors that start on that row
  const rowH=grid.map(row=>{
    let ml=1;
    for(let c=0;c<row.length;c++) if(!row[c].m) ml=Math.max(ml,nLines(row[c].v));
    return Math.max(CMIN, Math.round(8+ml*CLH));
  });
  const yAt=[0];
  for(let r=0;r<grid.length;r++) yAt.push(yAt[r]+rowH[r]);
  // cell marks: h1..hN address header tiers top-down, r>=1 the data rows
  const markOf=(r,c)=>(t.marks||[]).find(mk=>(mk.hdr?mk.r-1:H+mk.r-1)===r&&mk.c===c+1);
  const yTop=y+4;
  for(let r=0;r<grid.length;r++){
    for(let c=0;c<grid[r].length;c++){
      const cell=grid[r][c];
      if(cell.m) continue;                    // merged into an anchor cell
      let cs=1; while(c+cs<grid[r].length && grid[r][c+cs].m==='left') cs++;
      let rs=1; while(r+rs<grid.length && grid[r+rs][c].m==='up') rs++;
      const x=widths.slice(0,c).reduce((a,b)=>a+b,0);
      const wsum=widths.slice(c,c+cs).reduce((a,b)=>a+b,0);
      const yy=yTop+yAt[r], h=yAt[r+rs]-yAt[r];
      const mk=markOf(r,c);
      // block fill= is the default DATA-cell fill (header tint is structural)
      const fill=(mk&&mk.fill)||(cell.hdr?'#eeede6':(hlRow(r)?'#fef3c7':(t.fill||'#fff')));
      // addressable cells carry table-id:row:col (row 0 = bottom header tier)
      const addrR = r>=H ? (r-H+1) : (r===H-1 ? 0 : null);
      const addr = addrR===null ? '' : ' data-cell="'+t.id+':'+addrR+':'+(c+1)+'" style="cursor:pointer"';
      svg.push('<rect x="'+x+'" y="'+yy+'" width="'+wsum+'" height="'+h+'" fill="'+fill+'" stroke="'+((mk&&mk.stroke)||t.stroke||'#c9c7bf')+'"'+addr+'/>');
      // alignment: headers centered; data follows GFM colon alignment (default left)
      const al=cell.hdr?'center':(alignOf(c)||'left');
      const tx=al==='center'?x+wsum/2:(al==='right'?x+wsum-7:x+7);
      const anchor=al==='center'?'middle':(al==='right'?'end':'start');
      // multi-line via U+000A (from <br> at parse). Single-line path keeps
      // the historical <text> shape (no default fill=) so figures without
      // <br> stay byte-stable; multi-line uses textEl like node labels.
      const cv=cell.v==null?'':String(cell.v);
      if(cv.indexOf('\n')<0){
        svg.push('<text x="'+tx+'" y="'+(yy+h/2+4.3)+'" font-size="12" text-anchor="'+anchor+'"'+(cell.hdr?' font-weight="600"':'')+inkAttr(fill)+'>'+esc(cv)+'</text>');
      } else {
        svg.push(textEl(tx, yy+h/2+4, CFS, anchor, labelInk(fill,'#1d1d1b'), cv, cell.hdr?' font-weight="600"':''));
      }
    }
  }
  const yEnd=yTop+yAt[grid.length];
  return {svg:svg.join(''), y:yEnd+6, w:totalW+2};
}

// ---- chart bar3d: deterministic isometric projection of a table ----
function shade(hex,f){
  const v=parseInt(hex.slice(1),16);
  const c=x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0');
  return '#'+c(((v>>16)&255)*f)+c(((v>>8)&255)*f)+c((v&255)*f);
}
const CHART_PALETTE=['#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#14b8a6','#eab308','#64748b'];
function renderChart(b,y0,doc){
  const t=doc.blocks.find(x=>x.type==='table'&&x.id===b.tid);
  const rows=t.rows.map(r=>r.cells.slice(1).map(c=>parseFloat(c.v)||0));
  const rLab=t.rows.map(r=>r.cells[0].v), cLab=t.cols.slice(1);
  const R=rows.length, C=cLab.length;
  const zmax=Math.max(...rows.flat(), 1);
  const W2=20,H2=10,ZS=130/zmax,BAR=0.72;
  const ox=R*W2+8, oy=y0+18+ZS*zmax+6;
  const P=(r,c,z)=>[ox+(c-r)*W2, oy+(c+r)*H2-z*ZS];
  const svg=[];
  svg.push('<text x="0" y="'+(y0+14)+'" font-size="13" font-weight="600">'+esc(t.label)+' — bar3d</text>');
  // floor grid edges
  const F=[P(0,0,0),P(R,0,0),P(R,C,0),P(0,C,0)];
  svg.push('<polygon points="'+F.map(p=>p.join(',')).join(' ')+'" fill="#f6f5ef" stroke="#d6d4cc"/>');
  // bars, far to near
  const order=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)order.push([r,c]);
  order.sort((a,b2)=>(a[0]+a[1])-(b2[0]+b2[1]));
  for(const [r,c] of order){
    const h=rows[r][c]; if(h<=0) continue;
    const col=CHART_PALETTE[c%CHART_PALETTE.length];
    const i0=r+(1-BAR)/2, i1=r+(1+BAR)/2, j0=c+(1-BAR)/2, j1=c+(1+BAR)/2;
    const A=P(i0,j0,h),Bp=P(i1,j0,h),Cp=P(i1,j1,h),D=P(i0,j1,h);
    const B0=P(i1,j0,0),C0=P(i1,j1,0),D0=P(i0,j1,0);
    svg.push('<polygon points="'+[Bp,Cp,C0,B0].map(p=>p.join(',')).join(' ')+'" fill="'+shade(col,0.72)+'"/>');
    svg.push('<polygon points="'+[Cp,D,D0,C0].map(p=>p.join(',')).join(' ')+'" fill="'+shade(col,0.55)+'"/>');
    svg.push('<polygon points="'+[A,Bp,Cp,D].map(p=>p.join(',')).join(' ')+'" fill="'+col+'"/>');
  }
  // axis labels
  rLab.forEach((l,r)=>{ const p=P(r+0.5,-0.15,0); svg.push(textEl(p[0]-4,p[1]+10,10,'end','#6f6e69',l)); });
  cLab.forEach((l,c)=>{ const p=P(R+0.15,c+0.5,0); svg.push(textEl(p[0]+4,p[1]+10,10,'start','#6f6e69',l)); });
  // z ruler at the right-back corner
  const zr=P(0,C,0);
  svg.push('<line x1="'+(zr[0]+14)+'" y1="'+zr[1]+'" x2="'+(zr[0]+14)+'" y2="'+(zr[1]-zmax*ZS)+'" stroke="#8a8880"/>');
  for(const z of [0, Math.round(zmax/2), Math.round(zmax)]){
    svg.push('<line x1="'+(zr[0]+11)+'" y1="'+(zr[1]-z*ZS)+'" x2="'+(zr[0]+17)+'" y2="'+(zr[1]-z*ZS)+'" stroke="#8a8880"/>');
    svg.push(textEl(zr[0]+21, zr[1]-z*ZS+3.5, 9.5, 'start', '#6f6e69', String(z)));
  }
  const w=P(R,C,0)[0]+70, hgt=P(R,C,0)[1]+24-y0;
  return {svg:svg.join(''), y:y0+hgt, w:w};
}

// ---- timing ----
function renderTiming(w,y0){
  const cycleW=26, laneH=30, laneGap=12, nameW=Math.max(...w.signals.map(s=>tw(s.name)),60);
  const svg=[]; let y=y0+18;
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(w.label)+'</text>');
  const cycles=Math.max(...w.signals.map(s=>s.lane.length));
  w.signals.forEach((s,si)=>{
    const top=y+8+si*(laneH+laneGap), bot=top+laneH-8;
    // §5 per signal: fill= data-box fill, stroke= the waveform colour,
    // style= the path dash. 0.1 (`LABEL-COLOUR-SOURCE`): the signal NAME sits in the
    // left gutter, on the canvas, so it takes the canvas ink; only the data
    // labels sit on `sbox` and derive from it.
    const sbox=s.fill||w.fill||'#eef6ff', spath=s.stroke||w.stroke||'#1d4ed8';
    svg.push('<text x="'+(nameW-10)+'" y="'+(top+(laneH-8)/2+4)+'" font-size="11.5" text-anchor="end" font-family="monospace">'+esc(s.name)+'</text>');
    let d='', prev=null, li=0, dataIdx=0;
    for(let i=0;i<s.lane.length;i++){
      let ch=s.lane[i];
      if(ch==='.') ch=prev||'0';
      const x=nameW+i*cycleW;
      if(ch==='p'||ch==='n'){
        const hiFirst=(ch==='p');
        const a=hiFirst?top:bot, b=hiFirst?bot:top;
        d+='M'+x+','+a+' L'+(x+cycleW/2)+','+a+' L'+(x+cycleW/2)+','+b+' L'+(x+cycleW)+','+b+' ';
        // draw transition edge at cycle start
        if(prev) d+='M'+x+','+top+' L'+x+','+bot+' ';
      } else if(ch==='0'||ch==='1'){
        const yy=(ch==='1')?top:bot;
        const pv=(prev==='1')?top:(prev==='0'?bot:null);
        if(pv!==null&&pv!==yy) d+='M'+x+','+pv+' L'+x+','+yy+' ';
        d+='M'+x+','+yy+' L'+(x+cycleW)+','+yy+' ';
      } else if(ch==='x'){
        svg.push('<rect x="'+x+'" y="'+top+'" width="'+cycleW+'" height="'+(bot-top)+'" fill="url(#hatch)" stroke="#999"/>');
      } else if(ch==='='){
        // merge consecutive identical data chars
        let j=i; while(j+1<s.lane.length && s.lane[j+1]==='.') j++;
        const span=j-i+1;
        svg.push('<rect x="'+x+'" y="'+top+'" width="'+(cycleW*span)+'" height="'+(bot-top)+'" fill="'+sbox+'" stroke="'+(s.stroke||w.stroke||'#7aa7d9')+'"/>');
        const lbl = (s.labels&&s.labels[dataIdx++])||'';
        if(lbl) svg.push('<text x="'+(x+cycleW*span/2)+'" y="'+((top+bot)/2+4)+'" font-size="10.5" text-anchor="middle"'+inkAttr(sbox)+'>'+esc(lbl)+'</text>');
        i=j;
      }
      prev=ch;
    }
    if(d) svg.push('<path d="'+d+'" fill="none" stroke="'+spath+'" stroke-width="1.6"/>');
  });
  for(const g of w.gaps){
    const cycle=(g&&typeof g==='object')?g.t:g;
    const x=nameW+cycle*cycleW;
    const hTotal=w.signals.length*(laneH+laneGap);
    svg.push('<path d="M'+x+','+(y+4)+' q4,'+(hTotal/4)+' 0,'+(hTotal/2)+' q-4,'+(hTotal/4)+' 0,'+(hTotal/2)+'" fill="none" stroke="#999" stroke-width="2"/>');
  }
  const H=y+8+w.signals.length*(laneH+laneGap);
  return {svg:svg.join(''), y:H, w:nameW+cycles*cycleW+2};
}

// ============================================================
return { parse: parse, render: render, stackSectionSvgs: stackSectionSvgs };
})();

// ---- minimal synchronous SHA-256 (FIPS 180-4), hex output ----
// Dependency-free so artifact() works in browsers and Node alike.
var __SHA_K = [
0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function __sha256hex(text) {
  var b = [], i, c;
  for (i = 0; i < text.length; i++) {           // UTF-8 encode
    c = text.codePointAt(i); if (c > 0xffff) i++;
    if (c < 0x80) b.push(c);
    else if (c < 0x800) b.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) b.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else b.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  var len = b.length, hi = Math.floor(len / 0x20000000), lo = (len << 3) >>> 0;
  b.push(0x80);
  while (b.length % 64 !== 56) b.push(0);
  b.push(hi >>> 24 & 255, hi >>> 16 & 255, hi >>> 8 & 255, hi & 255,
         lo >>> 24 & 255, lo >>> 16 & 255, lo >>> 8 & 255, lo & 255);
  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var w = new Array(64), r = function (x, n) { return (x >>> n) | (x << (32 - n)); };
  for (var off = 0; off < b.length; off += 64) {
    for (i = 0; i < 16; i++)
      w[i] = (b[off+4*i] << 24) | (b[off+4*i+1] << 16) | (b[off+4*i+2] << 8) | b[off+4*i+3];
    for (i = 16; i < 64; i++)
      w[i] = (w[i-16] + (r(w[i-15],7) ^ r(w[i-15],18) ^ (w[i-15] >>> 3))
            + w[i-7]  + (r(w[i-2],17) ^ r(w[i-2],19)  ^ (w[i-2] >>> 10))) | 0;
    var a=H[0],bb=H[1],cc=H[2],d=H[3],e=H[4],f=H[5],g=H[6],hh=H[7];
    for (i = 0; i < 64; i++) {
      var t1 = (hh + (r(e,6)^r(e,11)^r(e,25)) + ((e & f) ^ (~e & g)) + __SHA_K[i] + w[i]) | 0;
      var t2 = ((r(a,2)^r(a,13)^r(a,22)) + ((a & bb) ^ (a & cc) ^ (bb & cc))) | 0;
      hh=g; g=f; f=e; e=(d+t1)|0; d=cc; cc=bb; bb=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+bb)|0; H[2]=(H[2]+cc)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+hh)|0;
  }
  var out = '';
  for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
  return out;
}

// ---- public API ----
// parse(text) -> { doc, errors, docs }
//   errors: "Line N: message"
//   docs: one entry per figdown section (length 1 for ordinary files)
//   doc: docs[0] (compat for single-section callers)
function parse(text) {
  var p = __engine.parse(String(text));
  var docs = p.docs && p.docs.length ? p.docs : (p.doc ? [p.doc] : []);
  return { doc: p.doc, errors: p.errs, docs: docs };
}
// Stack multi-section SVGs (MULTI-FIGURE-DOCUMENTS): one .fd → one .svg, sections top-to-bottom.
function __stackSectionSvgs(results) {
  if (typeof __engine.stackSectionSvgs === 'function')
    return __engine.stackSectionSvgs(results);
  // fallback if engine build is older
  return results[0] && results[0].svg;
}
// render(text, opts) -> { svg, errors }  svg is null when there are errors
// (determinism over convenience: no partial renders of invalid input).
// opts (presentation, renderer tier): { title: true } draws the title;
// the default does NOT (embedded figures almost always sit under the
// host document's caption — the majority case).
// Multi-section sources are stacked vertically into a single SVG (MULTI-FIGURE-DOCUMENTS).
function render(text, opts) {
  var p = parse(text);
  if (p.errors.length) return { svg: null, errors: p.errors };
  if (p.docs.length > 1) {
    var rs = p.docs.map(function (d) { return __engine.render(d, opts); });
    return { svg: __engine.stackSectionSvgs(rs), errors: [] };
  }
  return { svg: __engine.render(p.doc, opts).svg, errors: [] };
}
// renderDoc(doc, opts) -> svg string, for an already-validated doc from parse().
// For multi-section, pass parse().docs to renderDocs instead.
function renderDoc(doc, opts) {
  return __engine.render(doc, opts).svg;
}
function renderDocs(docs, opts) {
  if (!docs || !docs.length) return '';
  if (docs.length === 1) return __engine.render(docs[0], opts).svg;
  return __engine.stackSectionSvgs(docs.map(function (d) { return __engine.render(d, opts); }));
}
// artifact(text) -> { svg, errors }  svg is the full self-carrying SVG:
// the render plus a <metadata id="figdown-source"> block embedding the
// source text, the SHA-256 OF THAT SOURCE, and the engine version that
// rendered it (same convention as tools/build-svg.js; spec core §7).
// svg is null when there are errors.
function artifact(text, opts) {
  var src = String(text);
  var p = render(src, opts);
  if (p.errors.length) return { svg: null, errors: p.errors };
  // The artifact records the SHA-256 OF THE SOURCE, the ENGINE VERSION that
  // rendered it, and any non-default render option (core §7) — together they
  // keep third-party rebuilds bit-identical and give a diff somewhere to point
  var optAttr = (opts && opts.title === true) ? ' data-render-options="with-title"' : '';
  var meta = '<metadata id="figdown-source" data-sha256="' + __sha256hex(src) + '"'
    + ' data-engine-version="' + VERSION + '"' + optAttr + '><![CDATA[\n'
    + src.replace(/]]>/g, ']]]]><![CDATA[>') + '\n]]></metadata>';
  return { svg: p.svg.replace(/<\/svg>$/, meta + '</svg>'), errors: [] };
}

var version = VERSION;
export { parse, render, renderDoc, renderDocs, artifact, version };
