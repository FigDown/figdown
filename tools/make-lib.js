#!/usr/bin/env node
// Regenerate the embeddable library builds in dist/ from the single
// engine source, editor/figdown.html (the "regenerate, don't fork" rule,
// same pattern as make-skill.js / build-svg.js).
//
//   node tools/make-lib.js
//
// Emits:
//   dist/figdown.mjs — ESM:  export { parse, render, renderDoc, artifact, version }
//   dist/figdown.js  — UMD:  same API on module.exports / globalThis.figdown
//
// Both wrap the extracted engine in a closure so its internals stay
// private, and neither needs DOM, window, or Node APIs at import time.
// Output is deterministic: same engine source -> byte-identical files.
'use strict';
const fs = require('fs');
const path = require('path');

// The library version. Single place; tracks the spec draft version
// (spec/MIGRATIONS.md, latest entry).
const VERSION = '0.1-dev.13';

const ROOT = path.join(__dirname, '..');
const ENGINE_HTML = path.join(ROOT, 'editor', 'figdown.html');
const DIST = path.join(ROOT, 'dist');

// ---- extract the engine region (same anchors as build-svg.js) ----
const h = fs.readFileSync(ENGINE_HTML, 'utf8');
const start = h.indexOf('const SHAPES');
const end = h.indexOf('// 3. UI');
if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE_HTML);
const engine = h.slice(start, end);

// Purity check: the extracted region must not touch DOM/browser/Node
// globals — the library must be importable anywhere. Report, don't patch.
const impure = engine.match(/\b(document|window|localStorage|sessionStorage|navigator|XMLHttpRequest|fetch|require|process)\s*[.(]/g);
if (impure) throw new Error('engine region is not pure, found: ' + [...new Set(impure)].join(', '));

// ---- shared library body (identical in both builds) ----
const BODY = `var VERSION = ${JSON.stringify(VERSION)};

// ---- engine (extracted verbatim from editor/figdown.html) ----
var __engine = (function () {
${engine.trimEnd()}
return { parse: parse, render: render };
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
// parse(text) -> { doc, errors }   errors: array of "Line N: message"
function parse(text) {
  var p = __engine.parse(String(text));
  return { doc: p.doc, errors: p.errs };
}
// render(text, opts) -> { svg, errors }  svg is null when there are errors
// (determinism over convenience: no partial renders of invalid input).
// opts (presentation, renderer tier): { title: true } draws the title;
// the default does NOT (embedded figures almost always sit under the
// host document's caption — the majority case).
function render(text, opts) {
  var p = parse(text);
  if (p.errors.length) return { svg: null, errors: p.errors };
  return { svg: __engine.render(p.doc, opts).svg, errors: [] };
}
// renderDoc(doc, opts) -> svg string, for an already-validated doc from parse().
function renderDoc(doc, opts) {
  return __engine.render(doc, opts).svg;
}
// artifact(text) -> { svg, errors }  svg is the full self-carrying SVG:
// the render plus a <metadata id="figdown-source"> block embedding the
// source text and its SHA-256 (same convention as tools/build-svg.js).
// svg is null when there are errors.
function artifact(text, opts) {
  var src = String(text);
  var p = render(src, opts);
  if (p.errors.length) return { svg: null, errors: p.errors };
  // recorded render options keep third-party rebuilds bit-identical
  var optAttr = (opts && opts.title === true) ? ' data-render-options="with-title"' : '';
  var meta = '<metadata id="figdown-source" data-sha256="' + __sha256hex(src) + '"' + optAttr + '><![CDATA[\\n'
    + src.replace(/]]>/g, ']]]]><![CDATA[>') + '\\n]]></metadata>';
  return { svg: p.svg.replace(/<\\/svg>$/, meta + '</svg>'), errors: [] };
}
`;

const HEADER = (file) => `// ${file} — FigDown embeddable library (${VERSION})
// GENERATED FILE, DO NOT EDIT. Built from editor/figdown.html.
// Regenerate with: node tools/make-lib.js
`;

// ---- ESM build ----
const esm = HEADER('figdown.mjs') + `'use strict';
${BODY}
var version = VERSION;
export { parse, render, renderDoc, artifact, version };
`;

// ---- UMD build ----
const umd = HEADER('figdown.js') + `(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();               // CommonJS / Node
  } else {
    root.figdown = factory();                 // script tag: globalThis.figdown
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
${BODY}
  return { parse: parse, render: render, renderDoc: renderDoc, artifact: artifact, version: VERSION };
}));
`;

fs.mkdirSync(DIST, { recursive: true });
for (const [name, text] of [['figdown.mjs', esm], ['figdown.js', umd]]) {
  const out = path.join(DIST, name);
  fs.writeFileSync(out, text);
  console.log('OK  ' + path.relative(ROOT, out));
}
