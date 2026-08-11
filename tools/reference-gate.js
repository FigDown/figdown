#!/usr/bin/env node
// reference-gate.js — makes tools/reference-coverage.js a GATE.
//
// WHY A WRAPPER
// `reference-coverage` reports genre gaps that are ACCEPTED and recorded in
// examples/reference/index.md, so it exits non-zero by design and cannot be a
// pass/fail gate as it stands. It was therefore wired to nothing — a checker
// in the published tree that nothing runs, which is the `dist/` defect exactly.
//
// This pins the accepted state: the gate passes while the gap set is EXACTLY
// what the record says, and fails the moment a new gap appears or an accepted
// one closes without the record being updated.
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const ROOT = process.argv[2] || '.';

// The accepted state, as recorded in examples/reference/index.md.
const ACCEPTED = { all: 3, normativeOnly: 2 };

function gaps(args) {
  let out = '';
  try {
    out = execFileSync(process.execPath,
      [path.join(ROOT, 'tools/reference-coverage.js'), ...args],
      { cwd: ROOT, encoding: 'utf8' });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const m = /FAIL\s+(\d+)\s+genre\(s\) with gaps/.exec(out);
  return m ? Number(m[1]) : 0;
}

const all = gaps(['--strict']);
const norm = gaps(['--normative-only', '--strict']);
console.log('reference-gate  all=' + all + ' (accepted ' + ACCEPTED.all + ')  ' +
            'normative-only=' + norm + ' (accepted ' + ACCEPTED.normativeOnly + ')');
const bad = [];
if (all !== ACCEPTED.all) bad.push('all-genre gap count moved: ' + ACCEPTED.all + ' -> ' + all);
if (norm !== ACCEPTED.normativeOnly) bad.push('normative gap count moved: ' + ACCEPTED.normativeOnly + ' -> ' + norm);
if (bad.length) {
  bad.forEach(b => console.error('FAIL  ' + b));
  console.error('      Close the gap, or update the record in examples/reference/index.md.');
  process.exit(1);
}
console.log('OK  reference coverage matches the recorded accepted state');
