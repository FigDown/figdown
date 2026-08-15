#!/usr/bin/env node
// corpus.js — THE ONE ENUMERATION EVERY CORPUS GATE CALLS.
//
// Why this file exists (CORPUS-ENUMERATION-MECHANISM, superseding an earlier ruling's "no general fix").
// An earlier ruling counted fourteen instances of one defect: a check measures a
// PROPERTY OF WHAT IT FOUND, and the defect is in what it did not find. It
// concluded the class has "a general question and no general fix", because no
// mechanism can decide what SHOULD be in a check's denominator — that is a claim
// about the world.
//
// CORPUS-ENUMERATION-MECHANISM corrects that for the MECHANISM: the conclusion is right about the CHOICE
// and wrong about the MECHANISM, and the evidence is that four gates carried the
// SAME hard-coded directory list with the SAME non-recursive `readdirSync`:
//
//   shape-check.js      230 files opened,  71 rows printed
//   boundary-check.js   212 files opened,   2 rows printed
//   strip-check.js       38 files opened,  21 rows printed
//   stability-check.js   38 files opened,  16 processed, 22 skipped
//
// Those are not four independent judgements about scope. They are one copied
// line. The choice of roots still has to be made by a person and is still
// written down per gate — but the WALK, the skip taxonomy, the coverage line
// and the empty-corpus guard are mechanism, and mechanism copied by hand is
// mechanism that drifts. They live here once.
//
// The three rules this module makes structural rather than remembered:
//
//   1. THE WALK RECURSES. A gate that does not recurse is a gate that lies.
//   2. THE COVERAGE LINE IS UNCONDITIONAL. considered / scored / skipped, with
//      every skip reason listed, printed WHETHER OR NOT ANY COUNT IS ZERO. A
//      gate that goes silent on an empty result is the bug: "clean" and "I
//      could not read any of them" must not be the same output.
//   3. AN EMPTY CORPUS IS A TOOL ERROR, NEVER A PASS. If the default roots
//      yield no `.fd` at all, the corpus has moved or the gate is misconfigured.
//      `assertNonEmpty` exits 2 and says so. This module can never be the
//      reason a gate reports success for work it did not do.
//
// Strict policy, stated once because all four gates now share it:
// an unscored-but-IN-SCOPE figure FAILS --strict when the reason means "the
// tool could not read it" (parse-error, render-error, geometry-error,
// unreadable). A silent skip is indistinguishable from a pass, so it must
// cost something. The reasons NOT in that set are the ones that are a correct
// ANSWER rather than a failure to answer — "this genre has nothing to
// measure", "this scene declares no boundary". Those are still counted and
// still named on every run, so they are not silent either.
//
// The one exception, and it is structural, not a tolerance: a conformance case
// paired with a sibling `.errors.txt` is INVALID ON PURPOSE. Its parse error is
// the fixture's whole point. Those are counted under `invalid-by-design` and
// never fail --strict. The pairing is read off the filesystem, not off a list
// in this file, so a new error fixture is classified correctly the day it lands.
'use strict';

const fs   = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Directory names never descended into, whatever root is given. Each is named
// with its reason so the exclusion is VISIBLE in the run header rather than
// implied by a file simply not appearing in the table.
const PRUNED_DIRS = {
  'node_modules': 'third-party packages',
  '.git':         'version-control internals',
};

// Roots no corpus gate judges by default. Printed on every run so "absent from
// the table" is never the only evidence of an exclusion.
const NOT_JUDGED = [
  ['tools/migrate-fixtures/', 'migration fixtures — inputs are pre-migration by design'],
  ['archive/',                'frozen releases'],
  ['read/',                   'frozen releases'],
  ['conformance/experimental/', 'experimental-genre fixtures — gated by conformance/run.js --experimental'],
];

// ── Root descriptors ─────────────────────────────────────────────────────────
// A gate names its roots by KEY. The key carries the policy, so a gate cannot
// pick up a root without also picking up whether that root's figures are
// expected to be readable.
//
//   expect: 'valid' — every .fd here must parse and render; failure to read one
//                     is a defect in the figure and fails --strict.
//   expect: 'mixed' — a fixture corpus where SOME files are invalid on purpose.
//                     `invalidByDesign(p)` decides which, from the filesystem.
const ROOTS = {
  'examples': {
    dir: 'examples',
    expect: 'valid',
    why: 'published figures — the corpus this gate exists to judge',
  },
  'figures': {
    dir: 'figures',
    expect: 'valid',
    why: 'published figures embedded in the standard documents',
  },
  'conformance/cases': {
    dir: 'conformance/cases',
    expect: 'mixed',
    why: 'v1 conformance fixtures; those paired with .errors.txt are invalid on purpose',
    invalidByDesign: p => fs.existsSync(p.replace(/\.fd$/, '.errors.txt')),
  },
};

// ── Skip taxonomy ────────────────────────────────────────────────────────────
// Every reason a `.fd` can be considered and not scored. The coverage line
// prints ALL of these on every run, zero or not — a reason that appears only
// when non-zero is a reason nobody knows the tool has.
//
// `strict: true` means "the tool could not read this figure", which is
// indistinguishable from a clean figure unless it costs something.
const BASE_REASONS = [
  ['parse-error',       'the engine rejected the source',                 true],
  ['render-error',      'render() threw or returned nothing',             true],
  ['geometry-error',    'the SVG reader failed on the output',            true],
  ['unreadable',        'file could not be read',                         true],
  ['not-a-fd-file',     'named on the command line but not a .fd',        true],
  ['not-found',         'path does not exist',                            true],
  ['invalid-by-design', 'conformance fixture paired with .errors.txt',    false],
];

// collectFd RECURSES. `skips` accumulates {file, reason} for anything named but
// not usable, so a bad command-line argument is COUNTED rather than thrown away.
function collectFd(arg, skips) {
  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved)) {
    skips.push({ file: rel(arg), reason: 'not-found' });
    return [];
  }
  if (!fs.statSync(resolved).isDirectory()) {
    // An explicitly named file must actually BE a .fd: handing a render gate an
    // `.svg` feeds SVG markup to the FigDown parser, which answers with a
    // genuine-looking parse error about line 1 of a file that was never source.
    if (!resolved.endsWith('.fd')) {
      skips.push({ file: rel(arg), reason: 'not-a-fd-file' });
      return [];
    }
    return [resolved];
  }
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })
                      .sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (Object.prototype.hasOwnProperty.call(PRUNED_DIRS, e.name)) continue;
        walk(p);
      } else if (e.name.endsWith('.fd')) {
        out.push(p);
      }
    }
  })(resolved);
  return out;
}

function rel(p) {
  const r = path.relative(PROJECT_ROOT, path.resolve(p));
  return r.startsWith('..') ? p : r;
}

// ── Enumerate ────────────────────────────────────────────────────────────────
// `rootKeys` is the gate's DECLARED scope — the one judgement this module
// cannot make for it. `inputs` are command-line paths, which override.
//
// Returns { files, skips, roots, given, invalidByDesign:Set }.
function enumerate(rootKeys, inputs) {
  const skips = [];
  const given = inputs && inputs.length > 0;

  const searchPaths = given
    ? inputs.slice()
    : rootKeys.map(k => {
        if (!ROOTS[k]) throw new Error('corpus.js: unknown root key "' + k + '"');
        return path.join(PROJECT_ROOT, ROOTS[k].dir);
      });

  const files = [];
  for (const sp of searchPaths)
    for (const f of collectFd(sp, skips))
      if (!files.includes(f)) files.push(f);

  // Classify invalid-by-design fixtures, whether reached by a default root or
  // named on the command line — the property belongs to the FILE, not the path
  // that found it.
  const invalid = new Set();
  for (const f of files) {
    for (const k of Object.keys(ROOTS)) {
      const r = ROOTS[k];
      if (r.expect !== 'mixed' || !r.invalidByDesign) continue;
      const rootDir = path.join(PROJECT_ROOT, r.dir) + path.sep;
      if (f.startsWith(rootDir) && r.invalidByDesign(f)) invalid.add(f);
    }
  }

  return { files, skips, searchPaths, roots: rootKeys, given, invalidByDesign: invalid };
}

// RULE 3. An empty corpus is a tool error, never a pass. Called by every gate
// straight after `enumerate`. If the gate was given explicit paths and they
// matched nothing, that is also an error — a typo'd path must not report clean.
function assertNonEmpty(en, gateName) {
  if (en.files.length) return;
  console.error('');
  console.error(gateName + ': FOUND NO .fd FILES AT ALL.');
  console.error('  searched: ' + en.searchPaths.map(rel).join('  '));
  console.error('  A corpus gate that finds no corpus has not passed — it has');
  console.error('  failed to run. Either the roots moved or the paths given are');
  console.error('  wrong. Refusing to report success for work not done.');
  process.exit(2);
}

// ── Coverage reporter ────────────────────────────────────────────────────────
// RULE 2. Prints unconditionally. There is no code path through `report()` that
// prints nothing, and no count is suppressed for being zero.
class Coverage {
  constructor(gateName, en, extraReasons) {
    this.gate = gateName;
    this.en = en;
    this.reasons = BASE_REASONS.concat(extraReasons || []);
    this.skips = en.skips.slice();      // walk-time skips are already coverage
    this.scored = 0;
  }

  skip(file, reason, detail) {
    this.skips.push({ file: rel(file), reason, detail });
  }

  score() { this.scored++; }

  strictReasons() {
    return new Set(this.reasons.filter(r => r[2]).map(r => r[0]));
  }

  // Printed at the TOP of a run: what was searched, and what was deliberately not.
  header() {
    const en = this.en;
    console.log(this.gate + '  files=' + en.files.length);
    console.log('  ' + (en.given ? 'given:               ' : 'searched (recursive):')
              + ' ' + en.searchPaths.map(rel).join('  '));
    if (!en.given) {
      for (const k of en.roots)
        console.log('    ' + pad(ROOTS[k].dir, 26) + ROOTS[k].why);
      console.log('  not judged by default, by design:');
      for (const [r, why] of NOT_JUDGED)
        console.log('    ' + pad(r, 26) + why);
    }
    console.log('');
  }

  // Printed at the END. Returns the number of strict-failing skips.
  report(opts) {
    const verbose = !!(opts && opts.verbose);
    const strictSet = this.strictReasons();

    const byReason = new Map(this.reasons.map(r => [r[0], []]));
    for (const s of this.skips) {
      if (!byReason.has(s.reason)) byReason.set(s.reason, []);
      byReason.get(s.reason).push(s);
    }

    // "considered" = every path this run looked at: the .fd files the walk
    // found, plus the paths named but not usable as one.
    const walkSkips = this.skips.filter(
      s => s.reason === 'not-found' || s.reason === 'not-a-fd-file').length;
    const considered = this.en.files.length + walkSkips;

    console.log('');
    console.log('considered ' + considered
              + '  scored ' + this.scored
              + '  skipped ' + this.skips.length);
    for (const [reason, why, isStrict] of this.reasons) {
      const hits = byReason.get(reason) || [];
      console.log('  ' + pad(reason, 20) + lpad(hits.length, 4) + '   ' + why
                + (isStrict ? '  [fails --strict]' : ''));
      if (hits.length && (verbose || isStrict))
        for (const h of hits)
          console.log('      ' + h.file + (h.detail ? ' — ' + h.detail : ''));
    }

    // Arithmetic that must hold. If it does not, the gate has lost track of its
    // own denominator, which is the exact defect this module exists to prevent.
    const accounted = this.scored + this.skips.length;
    if (accounted !== considered) {
      console.log('');
      console.log('COVERAGE ARITHMETIC BROKEN: scored ' + this.scored
                + ' + skipped ' + this.skips.length + ' = ' + accounted
                + ', but ' + considered + ' were considered. ' +
                (considered - accounted) + ' file(s) fell through unreported.');
      return { unread: this.skips.filter(s => strictSet.has(s.reason)).length,
               broken: true };
    }

    return { unread: this.skips.filter(s => strictSet.has(s.reason)).length,
             broken: false };
  }
}

function pad(s, n)  { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function lpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

module.exports = {
  PROJECT_ROOT, PRUNED_DIRS, NOT_JUDGED, ROOTS, BASE_REASONS,
  collectFd, enumerate, assertNonEmpty, Coverage, rel, pad, lpad,
};
