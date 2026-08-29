#!/usr/bin/env node
'use strict';
// reference-engine.js — the REFERENCE ADAPTER for the harness contract
// documented in conformance/README.md ("The harness contract").
//
// It is not part of the runner. It is a CLIENT of the contract, written to
// prove the contract is implementable and to keep it alive: it satisfies the
// same stdin/stdout/exit-code interface a second implementation would, and it
// happens to satisfy it by driving the reference engine. Run the whole
// normative suite through it and the results must be identical to the
// in-process path — that identity is the only evidence the contract describes
// what the runner actually compares.
//
//   node conformance/run.js --engine-cmd='node conformance/adapters/reference-engine.js'
//
// THE CONTRACT, in one paragraph (conformance/README.md is normative for it):
// read a `.fd` document as UTF-8 bytes on stdin, read to EOF; write on stdout
// EITHER the canonical JSON model of spec/core.md §12.5/§12.5.1 and exit 0,
// OR the parse errors of §8, one `Line N: <message>` per LF-terminated line,
// and exit 1. Any other exit code is an adapter failure and fails the run.
// stderr is never compared.
//
// WHY THE ENGINE LOOKUP IS DUPLICATED FROM run.js RATHER THAN SHARED. An
// adapter is on the far side of the contract: it is what a stranger replaces
// wholesale, so it must not reach into the harness for anything, or the
// contract would quietly depend on a repository-private helper again — which
// is the exact defect (engine-backlog item 80) this file exists to close.
// Twelve duplicated lines are the price of the boundary being real.
const fs = require('fs');
const path = require('path');
const normalize = require('../normalize.js');

// Same order as tools/build-svg.js and conformance/run.js.
const ENGINE = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, '..', 'figdown.html'),
  path.join(__dirname, '..', '..', 'figdown.html'),
  path.join(__dirname, '..', '..', 'editor', 'figdown.html'),
].filter(Boolean).find(p => fs.existsSync(p));

function loadEngine() {
  if (!ENGINE) throw new Error('figdown.html not found (set FIGDOWN_HTML)');
  const h = fs.readFileSync(ENGINE, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  return new Function(h.slice(start, end) + '\nreturn {parse};')();
}

function main() {
  // stdin to EOF, decoded as UTF-8. fd 0 is read as bytes so that a fixture
  // carrying awkward code points (cases/953) arrives byte for byte.
  let src;
  try { src = fs.readFileSync(0).toString('utf8'); }
  catch (e) { process.stderr.write('cannot read stdin: ' + e.message + '\n'); return 2; }

  let parsed;
  try { parsed = loadEngine().parse(src); }
  catch (e) { process.stderr.write('parse threw: ' + e.message + '\n'); return 2; }

  const { doc, errs } = parsed;
  const docs = parsed.docs && parsed.docs.length ? parsed.docs : (doc ? [doc] : []);

  if (errs.length) {
    // Emission order is free (core §8.3.7 — the harness sorts both sides).
    // Emitted unsorted on purpose, so that the runner's sort is exercised
    // rather than assumed.
    process.stdout.write(errs.join('\n') + '\n');
    return 1;
  }

  let out;
  try {
    out = docs.length > 1
      ? JSON.stringify({ sections: docs.map(d => normalize(d)) }, null, 2) + '\n'
      : JSON.stringify(normalize(doc), null, 2) + '\n';
  } catch (e) { process.stderr.write('normalize threw: ' + e.message + '\n'); return 2; }

  process.stdout.write(out);
  return 0;
}

process.exitCode = main();
