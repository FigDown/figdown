#!/usr/bin/env node
'use strict';
// safe-svg-check.js — the Safe SVG profile gate (gate:safesvg).
//
//   node tools/safe-svg-check.js [--strict] [--verbose]
//
// WHY THIS FILE EXISTS
//
// core §15 states a profile: an artifact is markup a host embeds, so it must
// carry no script, no event handler, no `foreignObject`, and no reference
// that makes the viewer fetch anything. Before this gate that was a sentence
// about the renderer, not a fact about the tree. Twenty-seven gates ran on
// every change and NOT ONE of them opened an `.svg` and looked at its
// element names. `artifact-check.js` reads exactly two attributes out of the
// metadata block and compares a hash; `layout-lint.js` reads geometry;
// `page-check.js` reads HTML. The shipped artifacts could have grown a
// `<script>` element and every gate would have stayed green.
//
// A profile nobody checks is a claim, and core §15's rule is that the chapter
// may only say what a gate or a fixture demonstrates. This is that gate.
//
// WHY IT DOES NOT USE A REGEX
//
// Because the inputs are adversarial ON PURPOSE. The corpus includes
// `conformance/cases/950..952`, whose whole content is strings that SPELL
// markup: `<script>alert(1)</script>` as a node label, `]]>` in a title,
// `</metadata>` in a comment. A regex for `/<script/` finds all of them and
// is wrong every time — they are TEXT, and text is where they belong. The
// only check that can tell the difference is one that knows which bytes are
// markup, which are character data, and where a CDATA section begins and
// ends. So this file carries a small scanner that classifies EVERY byte of
// the document into exactly one region, and the assertions are made against
// the classification, never against the raw bytes.
//
// That scanner is also the point of the metadata assertion. Core §7 embeds
// the whole source inside the artifact, inside CDATA. A consumer that lifts
// it back out with `/<metadata[^>]*>([\s\S]*?)<\/metadata>/` reads the WRONG
// BYTES from fixture 952, which writes `</metadata>` inside a comment: the
// lazy match stops there, inside the CDATA. This gate recovers the source
// the way a consumer must, and requires it back byte for byte.
//
// WHAT IT ASSERTS  (per document, over both corpora)
//
//   A. SCANNABLE     — the scanner classifies the document to EOF with a
//                      balanced element stack and no unterminated construct,
//                      and every byte is a legal XML 1.0 character. A
//                      document that cannot be parsed cannot be judged, so
//                      failing to parse is a FAILURE, never a skip.
//                      A also has an UPSTREAM half (XML-CHARACTER-LEGALITY, core §15.5): the
//                      output is legal-charactered because the ENGINE refuses
//                      an illegal character in the SOURCE, so the gate asserts
//                      that refusal directly rather than inferring it from a
//                      corpus that happens to be clean.
//   B. ELEMENTS      — every element name is in the closed allowlist below.
//                      The list is what the renderer actually emits; a name
//                      outside it is a NEW output construct that has not been
//                      through this profile, whether or not it is dangerous.
//   C. ATTRIBUTES    — every attribute name is in the closed allowlist, AND
//                      three absolute rules hold whatever the allowlist says:
//                      no name beginning `on`, no `href`/`src`/`xlink:href`,
//                      no value containing `javascript:`.
//   D. NO FETCH      — no attribute value carries a `url(...)` naming
//                      anything but a same-document `#fragment`, and no
//                      `@import` appears in any markup region.
//   E. ONE URI       — the only absolute URI in any markup region is the SVG
//                      namespace, and only as an `xmlns` value. It is a NAME,
//                      not a fetch, and this assertion is what keeps it the
//                      only one.
//   F. ROUNDTRIP     — for a freshly rendered artifact: the text recovered
//                      from `<metadata id="figdown-source">` equals the `.fd`
//                      bytes exactly, and `data-sha256` equals the SHA-256 of
//                      those bytes. Hostile text must not change what the
//                      hash covers.
//
// WHAT IT DOES NOT ASSERT, said plainly because core §15 has to say it too:
//
//   - Nothing about RESOURCE LIMITS. A source may render for minutes or emit
//     a canvas 10^21 units wide; §15 records that as UNSPECIFIED and this
//     gate does not test it.
//   - Nothing about the RENDERER'S behaviour on a source the PARSER already
//     refuses. Assertion A's upstream half checks that the engine rejects an
//     illegal character; what the renderer would have drawn for one is moot,
//     because nothing is rendered for a document with errors (§8).
//   - Nothing about the RENDERED BYTES. Spec §3 gives byte-identity only for
//     the same source and the same renderer version, so this gate asserts a
//     PROPERTY of the output and never its bytes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const STRICT = process.argv.includes('--strict');
const VERBOSE = process.argv.includes('--verbose');

// ── the closed output vocabulary ─────────────────────────────────────────────
// THIS IS THE MEASURED SET, NOT A WISH LIST. It is the exact union of every
// element and attribute name emitted across the 60 shipped artifacts and all
// 178 `.fd` documents in the tree that render (examples/, figures/,
// conformance/cases/, conformance/experimental/), plus `data-render-options=`
// which only a `with-title` render emits and which the adversarial fixtures
// are rendered twice to exercise — 15 element names and 61 attribute names,
// and core §15.2 quotes those two numbers.
//
// `data-lasso` (backlog item 69) is the sixty-first: a `bundle`'s
// ellipse carries the bundle's id, and every node the ellipse was derived from
// carries the same id, so a reader can tell a member from a bystander by
// identity rather than by distance — the same shape `data-port-sq` gave the
// port notation.
//
// Nothing speculative belongs here. A name that is allowed but never emitted
// weakens the assertion to "the renderer emits a subset of a list somebody
// once imagined", which catches nothing; a name that is emitted but not
// listed FAILS, which is how a new output construct gets looked at before it
// ships. So: add a name only when the renderer actually emits it, and only
// having decided it belongs in the profile.
const ELEMENTS = new Set([
  'svg', 'defs', 'g', 'metadata', 'title',
  'rect', 'line', 'path', 'polygon', 'circle', 'ellipse',
  'text', 'tspan', 'marker', 'pattern',
]);

const ATTRS = new Set([
  // structure / identity
  'xmlns', 'viewBox', 'width', 'height', 'id', 'class', 'style', 'transform',
  // geometry
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
  'dy',
  // paint
  'fill', 'fill-opacity', 'opacity', 'stroke', 'stroke-width',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-linejoin',
  // type
  'font-family', 'font-size', 'font-style', 'font-weight', 'text-anchor',
  // markers / patterns
  'markerWidth', 'markerHeight', 'refX', 'refY', 'orient',
  'patternUnits', 'patternTransform',
  // FigDown's own provenance channel (core §7) — data-* only
  'data-sha256', 'data-engine-version', 'data-render-options',
  'data-node', 'data-edge', 'data-group', 'data-cell', 'data-bus',
  'data-gline', 'data-gtop', 'data-gbot', 'data-gx', 'data-gy',
  'data-x', 'data-y', 'data-note-for', 'data-note-on',
  'data-port-sq', 'data-lasso',
]);

const SVG_NS = 'http://www.w3.org/2000/svg';

// Style attribute values the renderer emits. `style=` is the one attribute
// that carries a mini-language, so its values are enumerated rather than
// pattern-matched — a `style=` that grew a `url()` would be assertion D's
// finding, and a `style=` that grew anything else is this list's. Measured:
// these three, and nothing else, across the same 238 documents.
const STYLE_VALUES = new Set([
  'cursor:move', 'cursor:pointer', 'cursor:ns-resize',
]);

// ── the scanner ──────────────────────────────────────────────────────────────
// Classifies every byte of the document into exactly one region and reports
// the markup facts. This is the whole security argument: hostile text lives
// in TEXT and CDATA regions, and no assertion below ever looks at those.
//
// Returns { tags, markupSpans, cdata, error } where
//   tags        = [{name, attrs:[[k,v]], selfClosing, close}]
//   markupSpans = [[start,end)] — every byte the scanner called markup
//   cdata       = [{start,end,text}] — CDATA section payloads, in order
function scan(src) {
  const tags = [], markupSpans = [], cdata = [];
  const stack = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;                      // rest is character data
    if (src.startsWith('<![CDATA[', lt)) {
      const end = src.indexOf(']]>', lt + 9);
      if (end < 0) return { error: 'unterminated CDATA section at offset ' + lt };
      cdata.push({ start: lt + 9, end, text: src.slice(lt + 9, end) });
      markupSpans.push([lt, lt + 9], [end, end + 3]);   // delimiters only
      i = end + 3;
      continue;
    }
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      if (end < 0) return { error: 'unterminated comment at offset ' + lt };
      i = end + 3;                          // comment body is not markup, not text
      continue;
    }
    if (src.startsWith('<?', lt)) {
      const end = src.indexOf('?>', lt + 2);
      if (end < 0) return { error: 'unterminated processing instruction at offset ' + lt };
      markupSpans.push([lt, end + 2]);
      i = end + 2;
      continue;
    }
    if (src.startsWith('<!', lt)) {         // DOCTYPE and friends
      const end = src.indexOf('>', lt);
      if (end < 0) return { error: 'unterminated declaration at offset ' + lt };
      markupSpans.push([lt, end + 1]);
      i = end + 1;
      continue;
    }
    // an ordinary tag: walk to its `>`, respecting quoted attribute values
    let j = lt + 1, q = null;
    for (; j < n; j++) {
      const c = src[j];
      if (q) { if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '>') break;
    }
    if (j >= n) return { error: 'unterminated tag at offset ' + lt };
    const body = src.slice(lt + 1, j);
    markupSpans.push([lt, j + 1]);
    i = j + 1;

    const close = body[0] === '/';
    const selfClosing = body[body.length - 1] === '/';
    const inner = body.replace(/^\//, '').replace(/\/$/, '');
    const m = /^([^\s/>]+)/.exec(inner);
    if (!m) return { error: 'tag with no name at offset ' + lt };
    const name = m[1];
    const attrs = [];
    const ATTR_RE = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    const rest = inner.slice(m[1].length);
    while ((a = ATTR_RE.exec(rest))) {
      attrs.push([a[1], a[3] !== undefined ? a[3] : a[4]]);
    }
    // a bare attribute (no `=value`) is not valid XML; report it rather than
    // silently dropping it, because a dropped attribute is an unchecked one
    const bare = rest.replace(ATTR_RE, '').trim();
    if (bare) return { error: 'unquoted or bare attribute ' + JSON.stringify(bare) + ' in <' + name + '>' };

    tags.push({ name, attrs, selfClosing, close, offset: lt });
    if (close) {
      const open = stack.pop();
      if (open !== name) {
        return { error: 'element nesting: </' + name + '> closes <' + (open || 'nothing') + '>' };
      }
    } else if (!selfClosing) {
      stack.push(name);
    }
  }
  if (stack.length) return { error: 'unclosed element(s): ' + stack.join(', ') };
  return { tags, markupSpans, cdata };
}

// XML 1.0 legal characters. A byte outside this set makes the document
// unparseable by any conforming reader, whatever else is right about it.
function illegalChars(src) {
  const bad = new Map();
  for (let k = 0; k < src.length; k++) {
    const c = src.charCodeAt(k);
    const ok = c === 0x09 || c === 0x0a || c === 0x0d ||
               (c >= 0x20 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd) ||
               (c >= 0xd800 && c <= 0xdfff);   // surrogate halves of astral pairs
    if (!ok) bad.set(c, (bad.get(c) || 0) + 1);
  }
  return bad;
}

// ── the assertions ───────────────────────────────────────────────────────────
function judge(label, src) {
  const out = [];
  const bad = illegalChars(src);
  if (bad.size) {
    out.push('A illegal XML character(s): ' +
      [...bad].map(([c, k]) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0') + ' x' + k).join(', '));
  }
  const s = scan(src);
  if (s.error) { out.push('A not scannable: ' + s.error); return out; }

  // regions the scanner called markup — the ONLY bytes D and E may read
  const markup = s.markupSpans.map(([a, b]) => src.slice(a, b)).join('\n');

  for (const t of s.tags) {
    if (t.close) continue;
    if (!ELEMENTS.has(t.name)) out.push('B element not in the profile: <' + t.name + '>');
    for (const [k, v] of t.attrs) {
      if (/^on/i.test(k))              out.push('C event handler attribute: ' + k + '=');
      if (/^(xlink:)?href$|^src$/i.test(k)) out.push('C fetching attribute: ' + k + '=' + v.slice(0, 60));
      if (/javascript:/i.test(v))      out.push('C javascript: URI in ' + k + '=');
      if (!ATTRS.has(k) && !/^xmlns(:|$)/.test(k)) out.push('C attribute not in the profile: ' + k + '= on <' + t.name + '>');
      if (k === 'style' && !STYLE_VALUES.has(v.trim())) out.push('C style= value not in the profile: ' + JSON.stringify(v.slice(0, 60)));
      let u;
      const URLF = /url\(\s*['"]?([^)'"]*)/gi;
      while ((u = URLF.exec(v))) {
        if (!u[1].trim().startsWith('#')) out.push('D external url() in ' + k + '=' + u[1].slice(0, 60));
      }
      if (/@import/i.test(v)) out.push('D @import in ' + k + '=');
      // E — the SVG namespace is the one absolute URI, and only as xmlns
      const abs = v.match(/[a-z][a-z0-9+.-]*:\/\/[^\s"']*/gi) || [];
      for (const a of abs) {
        if (/^xmlns(:|$)/.test(k) && a === SVG_NS) continue;
        out.push('E absolute URI in ' + k + '=' + a.slice(0, 70));
      }
    }
  }
  if (/@import/i.test(markup)) out.push('D @import in a markup region');
  return out;
}

// recover the embedded source the way a consumer must: from the CDATA
// sections that lie inside the metadata element, un-splicing `]]>`
function recoverSource(src, s) {
  const open = s.tags.find(t => !t.close && t.name === 'metadata' &&
                                t.attrs.some(([k, v]) => k === 'id' && v === 'figdown-source'));
  if (!open) return null;
  const start = open.offset;
  // the matching close tag: the first `</metadata>` the SCANNER saw, which is
  // the only one that is markup — a `</metadata>` inside CDATA is not a tag
  const close = s.tags.find(t => t.close && t.name === 'metadata' && t.offset > start);
  if (!close) return null;
  const inside = s.cdata.filter(c => c.start > start && c.end < close.offset);
  if (!inside.length) return null;
  // Un-splice. Core §7's embedder rewrites a source `]]>` as `]]]]><![CDATA[>`,
  // which the scanner reads back as two adjacent sections ending `]]` and
  // beginning `>`. Plain concatenation restores the terminator — the splice is
  // reversible precisely because it puts the section break INSIDE the `]]>`.
  let text = inside.map(c => c.text).join('');
  if (text.startsWith('\n')) text = text.slice(1);
  if (text.endsWith('\n')) text = text.slice(0, -1);
  return { text, sha: (open.attrs.find(([k]) => k === 'data-sha256') || [])[1] };
}

// ── corpora ──────────────────────────────────────────────────────────────────
function walk(dir, ext, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (e.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}
const rel = p => path.relative(ROOT, p);

console.log('safe-svg-check — the Safe SVG profile (core §15)');
console.log('  A scannable  B elements  C attributes  D no fetch  E one URI  F roundtrip');
console.log('');

let failures = 0, considered = 0;
const fail = m => { failures++; console.log('  FAIL  ' + m); };

// ── corpus 1: every shipped artifact ─────────────────────────────────────────
const shipped = [...walk(path.join(ROOT, 'examples'), '.svg', []),
                 ...walk(path.join(ROOT, 'figures'), '.svg', [])].sort();
if (!shipped.length) {
  console.error('safe-svg-check: no shipped .svg found — the corpus has moved or the gate is misconfigured.');
  process.exit(2);
}
console.log('SHIPPED ARTIFACTS (' + shipped.length + ')');
for (const f of shipped) {
  considered++;
  const src = fs.readFileSync(f, 'utf8');
  const bad = judge(rel(f), src);
  if (bad.length) { for (const b of bad) fail(rel(f) + ': ' + b); }
  else if (VERBOSE) console.log('  ok    ' + rel(f));
}
console.log('  ' + shipped.length + ' considered, ' + failures + ' finding(s)');
console.log('');

// ── corpus 2: the adversarial fixtures, rendered FRESH ───────────────────────
// Rendered here rather than read off disk: the profile is a property of the
// RENDERER, and a stored artifact only proves what the renderer did once.
const fd = require(path.join(ROOT, 'dist', 'figdown.js'));
const adversarial = walk(path.join(ROOT, 'conformance', 'cases'), '.fd', [])
  .filter(p => /\/95\d-adversarial-/.test(p.replace(/\\/g, '/'))).sort();
if (!adversarial.length) {
  console.error('safe-svg-check: no adversarial fixtures found (conformance/cases/95x-adversarial-*.fd).');
  console.error('  The fixtures ARE the evidence for core §15; a run without them proves nothing.');
  process.exit(2);
}
console.log('ADVERSARIAL FIXTURES, RENDERED FRESH (' + adversarial.length + ')');
const before = failures;
// Each fixture is rendered BOTH ways. `with-title` (core §7) is the one
// non-default render option, and it is the option that draws the title —
// the string an author is most likely to make hostile — into the picture
// instead of leaving it in the metadata. It also emits the one attribute
// (`data-render-options=`) that no default render produces, so rendering
// only the default would leave a name in the allowlist that the corpus
// never exercises.
const MODES = [['default', undefined], ['with-title', { title: true }]];
for (const f of adversarial) {
 for (const [mode, opts] of MODES) {
  considered++;
  const tag = rel(f) + ' [' + mode + ']';
  const fdText = fs.readFileSync(f, 'utf8');
  let r;
  try { r = fd.artifact(fdText, opts); }
  catch (e) { fail(tag + ': artifact() threw — ' + e.message); continue; }
  if (r.errors.length) { fail(tag + ': the engine refused it — ' + r.errors[0]); continue; }
  const bad = judge(tag, r.svg);
  for (const b of bad) fail(tag + ': ' + b);

  // F — the roundtrip
  const s = scan(r.svg);
  if (s.error) { fail(tag + ': F unscannable, ' + s.error); continue; }
  const rec = recoverSource(r.svg, s);
  if (!rec) { fail(tag + ': F no <metadata id="figdown-source"> recovered'); continue; }
  if (rec.text !== fdText) {
    fail(tag + ': F embedded source != the .fd bytes (' +
         rec.text.length + ' vs ' + fdText.length + ' chars)');
  }
  const want = crypto.createHash('sha256').update(fdText, 'utf8').digest('hex');
  if (rec.sha !== want) fail(tag + ': F data-sha256 ' + rec.sha + ' != ' + want);

  // the payload check, stated positively: the hostile tokens ARE in the
  // document (so nothing was silently stripped) and are in NO markup region.
  const markup = s.markupSpans.map(([a, b]) => r.svg.slice(a, b)).join('\n');
  for (const tok of ['<script', 'onload=', 'onerror=', 'onclick=', '<foreignObject', 'javascript:', '@import']) {
    if (markup.includes(tok)) fail(tag + ': hostile token ' + JSON.stringify(tok) + ' reached a MARKUP region');
  }
  if (!r.svg.includes('<script')) {
    fail(tag + ': the `<script` payload is absent entirely — ' +
         'the fixture no longer carries hostile text, or the engine stripped it');
  }
  if (VERBOSE) console.log('  ok    ' + tag + '  (' + r.svg.length + ' bytes, source roundtrip exact)');
 }
}
console.log('  ' + (adversarial.length * MODES.length) + ' considered, ' + (failures - before) + ' finding(s)');
console.log('');

// ── assertion A, upstream half (XML-CHARACTER-LEGALITY, core §15.5) ────────────────────────────
// The corpora above are legal-charactered, and a gate that only measured them
// would report the same "clean" whether the engine refuses an illegal
// character or merrily writes it into an artifact no XML reader will open.
// That was exactly the state before 0.4. So the refusal is asserted
// DIRECTLY, against the live engine, in both directions: the illegal ones must
// error, and the legal-but-suspicious ones must NOT — a refusal that also ate
// tab, DEL or an astral character would be a different and worse defect.
console.log('ENGINE REFUSES XML-ILLEGAL SOURCE CHARACTERS (A, upstream)');
const beforeA = failures;
const cp = c => 'U+' + c.toString(16).toUpperCase().padStart(4, '0');
const probe = c => fd.parse('figdown 0.4 block\nnode a "L' + String.fromCharCode(c) + 'X"\n').errors || [];
// forbidden by XML 1.0: C0 except tab/LF/CR, the two noncharacters, and a
// surrogate with no partner (unreachable from a UTF-8 file — see fixture 953)
const MUST_REJECT = [0x00, 0x01, 0x08, 0x0B, 0x0C, 0x0E, 0x1B, 0x1F, 0xFFFE, 0xFFFF, 0xD800, 0xDFFF];
// legal XML 1.0 characters that a careless "strip the weird bytes" rule eats
const MUST_ACCEPT = [0x09, 0x0D, 0x7F, 0x85, 0xA0];
for (const c of MUST_REJECT) {
  const errs = probe(c);
  if (!errs.some(e => e.indexOf('illegal character ' + cp(c)) >= 0)) {
    fail('the engine ACCEPTS ' + cp(c) + ', which XML forbids — an artifact built from it ' +
         'would not be well-formed (core §15.5, conformance/cases/953)');
  }
}
for (const c of MUST_ACCEPT) {
  if (probe(c).length) {
    fail('the engine REFUSES ' + cp(c) + ', which XML allows — the rule enforces XML\'s list, ' +
         'not a taste for printability (core §15.5)');
  }
}
// A PAIRED astral character is two surrogate code units and must stay legal:
// the naive "reject anything in D800–DFFF" rule would eat every emoji and
// every CJK extension character in the corpus.
if (fd.parse('figdown 0.4 block\nnode a "L\u{1F600}X"\n').errors.length) {
  fail('the engine REFUSES a correctly paired astral character, which IS a character — ' +
       'only an UNPAIRED surrogate is illegal (core §15.5)');
}
console.log('  ' + (MUST_REJECT.length + MUST_ACCEPT.length + 1) + ' code point(s) probed, ' +
            (failures - beforeA) + ' finding(s)');
console.log('');

console.log('=== safe-svg-check: ' + considered + ' document(s), ' + failures + ' finding(s) ===');
if (failures) {
  console.log('The Safe SVG profile is core §15 and its claim→evidence table names this gate.');
  console.log('A finding here means either the renderer gained an output construct that has');
  console.log('not been through the profile, or the profile no longer holds. Neither is a lint');
  console.log('opinion: fix the renderer, or change §15 and say why.');
  process.exit(1);
}
console.log('CLEAN — no script, no event handler, no foreignObject, no external reference.');
if (!STRICT && VERBOSE) console.log('(--strict changes nothing here: every assertion is fatal.)');
process.exit(0);
