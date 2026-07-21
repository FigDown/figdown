#!/usr/bin/env node
// FigDown Stage-0 sidecar generator (R14): X.fd -> X.svg
// Deterministic: same source -> same SVG, bit-level. The artifact embeds
// its own source and a SHA-256 of it (spec draft section 7).
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
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render};');
  return factory();
}

function buildOne(engine, fdPath) {
  const src = fs.readFileSync(fdPath, 'utf8');
  const { doc, errs } = engine.parse(src);
  if (errs.length) {
    console.error(fdPath + ':');
    for (const e of errs) console.error('  ' + e);
    return false;
  }
  const svg = engine.render(doc, RENDER_OPTS).svg;
  const hash = crypto.createHash('sha256').update(src, 'utf8').digest('hex');
  // render options are recorded in the artifact so a third-party rebuild
  // (same source + same recorded options) stays bit-identical
  const optAttr = RENDER_OPTS.title === false ? ' data-render-options="no-title"' : '';
  const meta = '<metadata id="figdown-source" data-sha256="' + hash + '"' + optAttr + '><![CDATA[\n'
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
  if (a === '--no-title') { RENDER_OPTS.title = false; return false; }
  return true;
});
if (!args.length) {
  console.error('usage: node tools/build-svg.js [--no-title] <file.fd | dir> ...');
  process.exit(2);
}
const engine = loadEngine();
let fail = false;
for (const a of args) {
  const st = fs.statSync(a);
  const files = st.isDirectory()
    ? fs.readdirSync(a).filter(f => f.endsWith('.fd')).sort().map(f => path.join(a, f))
    : [a];
  for (const f of files) if (!buildOne(engine, f)) fail = true;
}
process.exit(fail ? 1 : 0);
