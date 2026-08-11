#!/usr/bin/env node
// FigDown sidecar generator: X.fd -> X.svg
// Deterministic: same source -> same SVG, bit-level. The artifact embeds
// its own source and a SHA-256 of it (spec core §7).
// The engine is never forked: parser+renderer are extracted from the editor
// single file at build time (the "regenerate, don't fork" rule).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// The engine file is looked up in order: $FIGDOWN_HTML, a co-located
// copy (the agent-skill bundle layout), then ../editor/figdown.html (the
// repository layout).
const ENGINE = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean).find(p => fs.existsSync(p));

function loadEngine() {
  if (!ENGINE) throw new Error('figdown.html not found (set FIGDOWN_HTML or keep it next to this script)');
  const h = fs.readFileSync(ENGINE, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render, stackSectionSvgs, FIGDOWN_VERSION};');
  return factory();
}

function buildOne(engine, fdPath) {
  const src = fs.readFileSync(fdPath, 'utf8');
  const parsed = engine.parse(src);
  const errs = parsed.errs || parsed.errors || [];
  const docs = parsed.docs && parsed.docs.length ? parsed.docs : (parsed.doc ? [parsed.doc] : []);
  if (errs.length) {
    console.error(fdPath + ':');
    for (const e of errs) console.error('  ' + e);
    return false;
  }
  const svg = docs.length > 1
    ? engine.stackSectionSvgs(docs.map(d => engine.render(d, RENDER_OPTS)))
    : engine.render(docs[0], RENDER_OPTS).svg;
  const hash = crypto.createHash('sha256').update(src, 'utf8').digest('hex');
  // The artifact records three things (spec core §7): the SHA-256 OF THE
  // SOURCE, the ENGINE VERSION that rendered it, and any non-default render
  // option — so a third-party rebuild (same source + same engine version +
  // same recorded options) stays bit-identical, and a diff between two
  // renderings of one source has somewhere to point.
  const optAttr = RENDER_OPTS.title === true ? ' data-render-options="with-title"' : '';
  const meta = '<metadata id="figdown-source" data-sha256="' + hash + '"'
    + ' data-engine-version="' + engine.FIGDOWN_VERSION + '"' + optAttr + '><![CDATA[\n'
    + src.replace(/]]>/g, ']]]]><![CDATA[>') + '\n]]></metadata>';
  const artifact = svg.replace(/<\/svg>$/, meta + '</svg>');
  const out = fdPath.replace(/\.fd$/, '') + '.svg';
  fs.writeFileSync(out, artifact);
  console.log('OK  ' + out);
  return true;
}

const argv = process.argv.slice(2);
const RENDER_OPTS = {};
const args = argv.filter(a => {
  if (a === '--with-title') { RENDER_OPTS.title = true; return false; }
  if (a === '--no-title') { return false; }  // already the default; accepted so old command lines keep working
  return true;
});
if (!args.length) {
  console.error('usage: node tools/build-svg.js [--with-title] <file.fd | dir> ...');
  process.exit(2);
}
// RECURSIVE. "A gate that does not recurse is a gate that lies" was written
// for the read-only CHECKS, which read only the top level of a directory.
// The GENERATOR had the same defect and was missed:
// handed `examples/ figures/` it rebuilt 28 of the 66 artifacts and reported
// success on all 28, so a version bump left 38 artifacts recording an engine
// that no longer existed. `artifact-check.js` (which does recurse) caught it,
// which is the division of labour working — but the generator lying is how the
// stale artifacts got there in the first place, twice (§3.1(b)).
function collect(a, acc) {
  const st = fs.statSync(a);
  if (!st.isDirectory()) { acc.push(a); return acc; }
  for (const name of fs.readdirSync(a).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(a, name);
    if (fs.statSync(p).isDirectory()) collect(p, acc);
    else if (name.endsWith('.fd')) acc.push(p);
  }
  return acc;
}

const engine = loadEngine();
let built = 0;
let failed = 0;
for (const a of args) {
  for (const f of collect(a, [])) { if (buildOne(engine, f)) built++; else failed++; }
}
// State the count. §3.1(d): coverage is verified as a number, not assumed —
// compare against `find <dir> -name '*.fd' | wc -l`.
// `built` counts artifacts WRITTEN, never files attempted: a file whose source
// does not parse writes nothing, and counting it as built made the summary line
// contradict the errors printed above it and the exit code below it — in CI
// logs, and in the write->validate->fix loop this message exists to serve.
// A failure is therefore reported as its own number, and the two together are
// the file count to compare against.
console.log('built ' + built + ' artifact(s) from ' + args.length + ' path argument(s)'
  + (failed ? '  —  ' + failed + ' of ' + (built + failed) + ' .fd file(s) FAILED and wrote nothing' : ''));
process.exit(failed ? 1 : 0);
