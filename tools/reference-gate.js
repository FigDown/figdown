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
//
// Moved at v0.3.0, and the two numbers moved for two different reasons, both
// set out in that file's delta note. Both rose because `statechart` joined the
// tool's genre list: it had never been extended past the release that added
// the genre, so for two releases nothing checked a statechart reference figure
// at all, and the gap it now reports is that there is no such figure.
// `normativeOnly` also absorbs `note=`, a NORMATIVE option key registered this
// release that no reference figure writes yet — the one accepted gap inside
// the v0.1 conformance surface.
//
// Moved again at v0.4.0, both by one and both for the same reason: `sequence`
// joined the tool's genre list and its reference figure does not yet write the
// genre's whole surface (`layout`/`pin`, the paint keys, the `style=` values
// and the multi-value `class=` form). examples/reference/index.md records the
// gap and why it is accepted — the gap is in DEMONSTRATION, not in the
// standard. THIS FILE IS TARGET-OWNED and has no source counterpart, so no
// publish rule can move the number for it; a release that widens the accepted
// set has to say so here, which is the whole point of pinning it.
const ACCEPTED = { all: 5, normativeOnly: 5 };

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
