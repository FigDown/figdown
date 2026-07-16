#!/usr/bin/env node
'use strict';
// FigDown v0.1 parser-conformance runner.
//
// usage: node conformance/run.js [--update] [name-filter]
//
// For each conformance/cases/NNN-name.fd:
//   - parse with the reference engine;
//   - if the parse reports errors: compare the SORTED error lines against
//     NNN-name.errors.txt;
//   - otherwise: project the doc through normalize.js and compare against
//     NNN-name.model.json (pretty-printed, trailing newline).
// Additionally every valid case gets a determinism self-check: parse+render
// twice, the SVG byte streams must be identical. SVG output itself has no
// goldens (renderer-version-specific by spec section 3: only same source +
// same renderer version must be byte-identical).
//
// --update rewrites the goldens (and removes a stale golden of the other
// kind when a case flips between valid and erroring). Exit code 1 on any
// failure.
const fs = require('fs');
const path = require('path');

// Engine lookup, same order as tools/build-svg.js: $FIGDOWN_HTML, a
// co-located copy, then ../editor/figdown.html (the repository layout).
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

const normalize = require('./normalize.js');

const args = process.argv.slice(2);
const update = args.includes('--update');
const filter = args.filter(a => a !== '--update')[0] || null;

const CASES = path.join(__dirname, 'cases');
let files = fs.readdirSync(CASES).filter(f => f.endsWith('.fd')).sort();
if (filter) files = files.filter(f => f.includes(filter));
if (!files.length) { console.error('no cases match "' + (filter || '') + '"'); process.exit(1); }

const engine = loadEngine();
let pass = 0, fail = 0, updated = 0;
const failures = [];

function report(name, ok, why) {
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; failures.push({ name, why }); console.log('FAIL  ' + name + '  — ' + why.split('\n')[0]); }
}

for (const f of files) {
  const base = f.replace(/\.fd$/, '');
  const src = fs.readFileSync(path.join(CASES, f), 'utf8');
  const errPath = path.join(CASES, base + '.errors.txt');
  const modelPath = path.join(CASES, base + '.model.json');
  let parsed;
  try { parsed = engine.parse(src); }
  catch (e) { report(base, false, 'parse threw: ' + e.message); continue; }
  const { doc, errs } = parsed;

  if (errs.length) {
    const actual = errs.slice().sort().join('\n') + '\n';
    if (update) {
      fs.writeFileSync(errPath, actual);
      if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
      updated++; console.log('UPDT  ' + base + '  (' + errs.length + ' error line' + (errs.length > 1 ? 's' : '') + ')');
      continue;
    }
    if (fs.existsSync(modelPath)) { report(base, false, 'stale golden: case now errors but ' + base + '.model.json exists'); continue; }
    if (!fs.existsSync(errPath)) { report(base, false, 'missing golden ' + base + '.errors.txt — actual errors:\n' + actual); continue; }
    const expected = fs.readFileSync(errPath, 'utf8');
    if (expected !== actual) { report(base, false, 'error mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
    report(base, true);
    continue;
  }

  // valid case: canonical model golden
  let actual;
  try { actual = JSON.stringify(normalize(doc), null, 2) + '\n'; }
  catch (e) { report(base, false, 'normalize threw: ' + e.message); continue; }

  // determinism self-check (spec section 3, renderer tier): parse+render
  // twice, byte-compare. Runs in --update mode too — a non-deterministic
  // engine must never mint goldens.
  try {
    const svg1 = engine.render(engine.parse(src).doc).svg;
    const svg2 = engine.render(engine.parse(src).doc).svg;
    if (svg1 !== svg2) { report(base, false, 'determinism self-check: two renders of the same source differ'); continue; }
  } catch (e) { report(base, false, 'render threw: ' + e.message); continue; }

  if (update) {
    fs.writeFileSync(modelPath, actual);
    if (fs.existsSync(errPath)) fs.unlinkSync(errPath);
    updated++; console.log('UPDT  ' + base + '  (model)');
    continue;
  }
  if (fs.existsSync(errPath)) { report(base, false, 'stale golden: case now parses clean but ' + base + '.errors.txt exists'); continue; }
  if (!fs.existsSync(modelPath)) { report(base, false, 'missing golden ' + base + '.model.json'); continue; }
  const expected = fs.readFileSync(modelPath, 'utf8');
  if (expected !== actual) { report(base, false, 'model mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
  report(base, true);
}

console.log('');
if (update) {
  console.log(updated + ' golden(s) written, ' + fail + ' failure(s)');
} else {
  console.log(pass + ' passed, ' + fail + ' failed, ' + files.length + ' total');
}
for (const f of failures) {
  console.log('\n=== FAIL ' + f.name + '\n' + f.why);
}
process.exit(fail ? 1 : 0);
