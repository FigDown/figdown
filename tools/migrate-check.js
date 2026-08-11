#!/usr/bin/env node
'use strict';
// migrate-check.js — the fixture suite for tools/migrate-figdown.js.
//
// usage: node tools/migrate-check.js [--update] [--verbose] [name-filter]
//
// WHY THIS EXISTS
//
// The migration tool is what makes the compatibility promise affordable: an
// `X` bump costs a downstream corpus a command rather than a decade (core
// §13.0.1, §13.4). That is only true if the tool is RIGHT, and the failure
// mode that actually occurred is not "was wrong when written" — it is
// "stopped being right and nobody noticed". The tool carried the rewrite
// `optional` → `conditional` for a FULL RELEASE after PRESENCE-FLAG-SPELLING had reversed that
// direction, so the project's own upgrade path taught a spelling the project
// had rejected. It was found by a person READING the source. Nothing ran it.
//
// .github/CONTRIBUTING.md §3.1(c) already answers that with a rule — "the migration
// tool is verified end to end, not read" — and this file is that rule
// MECHANISED. The engine has 205 conformance fixtures; until this release the
// tool had one manual end-to-end run.
//
// HOUSE STYLE: conformance/. Numbered fixture files, byte-compared goldens,
// `--update` to move them, exit 1 on any failure.
//
//   tools/migrate-fixtures/
//     NNN-name.fd            INPUT — a document in the RETIRED spelling
//     NNN-name.expected.fd   GOLDEN — what the tool must produce from it
//     NNN-name.report.txt    GOLDEN — the report lines, when the rule is
//                            report-only (absent = no report expected)
//     NNN-name.flags         one line of CLI flags (`--color-means=fill`,
//                            `--flag-experimental`); absent = no flags
//     NNN-name.refused.fd    marks a REFUSAL fixture: the text the tool
//                            COMPUTES but must never write, because it does
//                            not parse. `.expected.fd` is then the input
//                            unchanged — what the file on disk must still be.
//
// SIX CHECKS PER FIXTURE
//
//   output       migrateText(input) === expected, byte for byte
//   report       the formatted report === the golden (or none, when absent)
//   idempotent   migrateText(expected) === expected AND records no change.
//                Asserted for EVERY fixture, because core §13.4 makes
//                idempotence a MUST and a migration a user cannot re-run
//                safely is one they will not run at all.
//   parses       the migrated result introduces no engine error the input did
//                not already have — via migrate-figdown's OWN introducedErrors
//                (REFUSAL (c)), never a second copy of it
//   negative     the produced output contains no RETIRED REWRITE DIRECTION.
//                See RETIRED_DIRECTIONS: this is the check that goes red if
//                the tool ever regains `optional` → `conditional`.
//   coverage     every rule label the fixture set exercises is counted, and
//                every RETIRED_DIRECTIONS entry MUST have a live trigger
//                fixture — an assertion nothing triggers is not an assertion.
//
// ONE SUITE-LEVEL CHECK: END TO END
//
// The six above call migrateText() directly. That is not enough for
// PROCESS §3.1(c), whose whole point is that the BINARY is run: the refusal
// path, the `--write` path and the exit code all live in main(), not in
// migrateText. So the suite also copies every fixture input into a scratch
// directory, spawns `node tools/migrate-figdown.js --write` over it, and
// compares what landed on disk against the same goldens. A refusal fixture
// must come back with the file BYTE-IDENTICAL and `REFUSED` in the output.
//
// The scratch directory is deliberately NOT named migrate-fixtures: the tool
// refuses that name outright (its guard, extended), because a
// `--write` run over the fixture corpus itself would rewrite every input into
// its own expected output and then agree with itself.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { migrateText, introducedErrors } = require('./migrate-figdown.js');

const FIXTURES = path.join(__dirname, 'migrate-fixtures');
const TOOL = path.join(__dirname, 'migrate-figdown.js');

// ---------------------------------------------------------------------------
// RETIRED REWRITE DIRECTIONS — the negative assertions.
//
// Each entry names a rewrite the tool once performed and MUST NEVER perform
// again. `trigger` is the input spelling that would set the retired rule off;
// `forbidden` is what must not come out. A fixture carrying the trigger is
// REQUIRED (see the coverage check) — a negative assertion with nothing to
// fire on is decoration.
// ---------------------------------------------------------------------------
const RETIRED_DIRECTIONS = [
  {
    name: 'optional→conditional',
    trigger: /(^|\s)optional(\s|$)/m,
    forbidden: /(^|\s)conditional(\s|$)/m,
    why: 'PRESENCE-FLAG-SPELLING REVERSED this direction and the tool went on ' +
         'rewriting `optional` → `conditional` for a full release afterwards, ' +
         'teaching a spelling the project had rejected. PRESENCE-CONDITION-EXPRESSION ' +
         'settled the flag on `present=""`. If this fires, the reversed rule is back.',
  },
  {
    name: 'route→path / via=→points= / src=,dst=→tailport=,headport=',
    trigger: /(^|\s)(route|via=|src=|dst=)/m,
    forbidden: /(^|\s)(path\s|points=|tailport=|headport=)/m,
    why: 'EDGE-GEOMETRY-CONSTRUCTS WITHDREW the whole edge-geometry family. The ' +
         'rewrites that used to feed it are suppressed, because a rewrite ' +
         'whose OUTPUT is a hard error is not a migration. If this fires, a ' +
         'withdrawn target has come back as a rewrite destination.',
  },
];

// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { update: false, verbose: false, filter: null };
  for (const a of argv) {
    if (a === '--update') out.update = true;
    else if (a === '--verbose') out.verbose = true;
    else if (a.startsWith('-')) throw new Error('unknown flag ' + a);
    else out.filter = a;
  }
  return out;
}

function readIf(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }

/** The report lines exactly as migrate-figdown.js prints them. */
function formatReports(reports) {
  if (!reports.length) return '';
  return reports.map(r => '  L' + r.line + '  [' + r.code + '] ' + r.msg).join('\n') + '\n';
}

/** Flags file -> {colorMeans, flagExp, argv}. */
function readFlags(base) {
  const raw = (readIf(base + '.flags') || '').trim();
  const argv = raw ? raw.split(/\s+/) : [];
  let colorMeans = null, flagExp = false;
  for (const a of argv) {
    if (a === '--color-means=fill') colorMeans = 'fill';
    else if (a === '--color-means=text') colorMeans = 'text';
    else if (a === '--flag-experimental') flagExp = true;
    else throw new Error('unsupported flag in ' + path.basename(base) + '.flags: ' + a);
  }
  return { colorMeans, flagExp, argv, raw };
}

function collect(filter) {
  if (!fs.existsSync(FIXTURES)) throw new Error('fixture directory missing: ' + FIXTURES);
  return fs.readdirSync(FIXTURES)
    .filter(f => f.endsWith('.fd') && !f.endsWith('.expected.fd') && !f.endsWith('.refused.fd'))
    .filter(f => !filter || f.includes(filter))
    .sort()
    .map(f => ({ name: f.replace(/\.fd$/, ''), base: path.join(FIXTURES, f.replace(/\.fd$/, '')) }));
}

// ---------------------------------------------------------------------------
function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = collect(args.filter);
  if (!cases.length) throw new Error('no fixtures matched' + (args.filter ? ' ' + args.filter : ''));

  let pass = 0, fail = 0, updated = 0;
  const failures = [];
  const rulesSeen = new Map();      // rewrite-rule label -> fixture count
  const codesSeen = new Map();      // report code -> fixture count
  const triggered = new Set();      // RETIRED_DIRECTIONS names with a live trigger
  const e2e = [];                   // fixtures to replay through the CLI

  for (const c of cases) {
    const input = fs.readFileSync(c.base + '.fd', 'utf8');
    const flags = readFlags(c.base);
    const isRefusal = fs.existsSync(c.base + '.refused.fd');
    const problems = [];

    const r = migrateText(input, flags.colorMeans);
    const reports = flags.flagExp ? r.rawReports : r.reports;
    for (const ch of r.changes) rulesSeen.set(ch.rule, (rulesSeen.get(ch.rule) || 0) + 1);
    for (const rp of reports) codesSeen.set(rp.code, (codesSeen.get(rp.code) || 0) + 1);

    // --- parses / refusal (REFUSAL (c), via the tool's own decision) --------
    const introduced = introducedErrors(input, r.text);

    // What the file must look like AFTER the tool has run over it: the
    // rewritten text normally, the INPUT unchanged when the rewrite is refused.
    const landed = introduced.length ? input : r.text;

    // --- goldens ------------------------------------------------------------
    const expPath = c.base + '.expected.fd';
    const repPath = c.base + '.report.txt';
    const refPath = c.base + '.refused.fd';
    const gotReport = formatReports(reports);

    if (args.update) {
      const writeGolden = (p, text) => {
        if (text === '') { if (fs.existsSync(p)) { fs.unlinkSync(p); updated++; } return; }
        if (readIf(p) !== text) { fs.writeFileSync(p, text, 'utf8'); updated++; }
      };
      writeGolden(expPath, landed);
      writeGolden(repPath, gotReport);
      writeGolden(refPath, introduced.length ? r.text : '');
    }

    const expected = readIf(expPath);
    if (expected === null) problems.push('no .expected.fd golden (run --update)');
    else if (landed !== expected) problems.push('output differs from .expected.fd\n' + diff(expected, landed));

    const wantReport = readIf(repPath) || '';
    if (gotReport !== wantReport) problems.push('report differs from .report.txt\n' + diff(wantReport, gotReport));

    // --- refusal shape ------------------------------------------------------
    if (introduced.length && !fs.existsSync(refPath)) {
      problems.push('the rewrite does not parse but there is no .refused.fd marker — ' +
        'a refusal is a deliberate fixture, never an accident:\n    ' + introduced.join('\n    '));
    }
    if (!introduced.length && isRefusal) {
      problems.push('marked .refused.fd but the rewrite parses cleanly — the refusal path is no longer exercised');
    }
    if (introduced.length) {
      const wantRefused = readIf(refPath);
      if (wantRefused !== null && wantRefused !== r.text) {
        problems.push('the refused text differs from .refused.fd\n' + diff(wantRefused, r.text));
      }
    }

    // --- idempotence --------------------------------------------------------
    // Asserted on what LANDS, which is the only state a user can re-run over.
    //
    // A REFUSED fixture is the one place where "a second run changes nothing"
    // is the WRONG assertion: nothing was written, so the file still carries
    // the retired spelling and a second run must of course still see it. What
    // idempotence means there is that the refusal is STABLE — the tool
    // computes the same rewrite and refuses it again, rather than oscillating
    // or writing on the second attempt.
    const again = migrateText(landed, flags.colorMeans);
    if (introduced.length) {
      if (again.text !== r.text) {
        problems.push('UNSTABLE REFUSAL — a second run computes a different rewrite\n' + diff(r.text, again.text));
      }
      if (!introducedErrors(landed, again.text).length) {
        problems.push('UNSTABLE REFUSAL — the second run would be written, so the tool ' +
          'refuses on run 1 and accepts on run 2 for the same input');
      }
    } else {
      if (again.text !== landed) {
        problems.push('NOT IDEMPOTENT — a second run changes the result again\n' + diff(landed, again.text));
      }
      if (again.changes.length) {
        problems.push('NOT IDEMPOTENT — a second run still records ' + again.changes.length +
          ' rewrite(s): ' + again.changes.map(x => x.rule).join(', '));
      }
    }

    // --- negative: no retired rewrite direction -----------------------------
    for (const d of RETIRED_DIRECTIONS) {
      if (d.trigger.test(stripComments(input))) triggered.add(d.name);
      if (d.forbidden.test(stripComments(landed)) && !d.forbidden.test(stripComments(input))) {
        problems.push('RETIRED REWRITE DIRECTION `' + d.name + '` has reappeared — the tool ' +
          'produced a spelling it must never produce.\n    ' + d.why);
      }
    }

    if (problems.length) {
      fail++;
      failures.push({ name: c.name, problems });
      console.log('FAIL  ' + c.name);
      for (const p of problems) console.log('      ' + p.replace(/\n/g, '\n      '));
    } else {
      pass++;
      if (args.verbose) {
        console.log('ok    ' + c.name +
          (flags.raw ? '  [' + flags.raw + ']' : '') +
          '  ' + r.changes.length + ' rewrite(s), ' + reports.length + ' report(s)' +
          (introduced.length ? ', REFUSED' : ''));
      }
    }

    e2e.push({ name: c.name, input, landed, flags, refused: introduced.length > 0 });
  }

  // --- no orphan goldens ----------------------------------------------------
  // conformance/run.js enforces its manifest in BOTH directions so neither list
  // can rot; the same applies here. A golden whose input was renamed or deleted
  // is a test that silently stopped running.
  if (!args.filter) {
    const inputs = new Set(cases.map(c => c.name));
    for (const f of fs.readdirSync(FIXTURES).sort()) {
      const m = /^(.*?)(\.expected\.fd|\.refused\.fd|\.report\.txt|\.flags)$/.exec(f);
      if (!m || inputs.has(m[1])) continue;
      fail++;
      console.log('FAIL  orphan golden ' + f + ' — no ' + m[1] + '.fd input. ' +
        'A golden whose input is gone is a test that stopped running silently.');
    }
  }

  // --- coverage: every negative assertion must have a live trigger ----------
  console.log('');
  for (const d of RETIRED_DIRECTIONS) {
    if (triggered.has(d.name)) {
      console.log('negative  ' + d.name + '  triggered and clean');
    } else {
      fail++;
      console.log('FAIL      negative assertion `' + d.name + '` has NO trigger fixture — ' +
        'an assertion nothing fires on is decoration. Add a fixture whose input carries the retired spelling.');
    }
  }

  // --- end to end: run the real binary --------------------------------------
  const e2eFail = runEndToEnd(e2e, args.verbose);
  fail += e2eFail;

  console.log('');
  console.log('rewrite rules covered: ' + rulesSeen.size + '   report codes covered: ' + codesSeen.size);
  if (args.verbose) {
    for (const [k, v] of [...rulesSeen].sort()) console.log('  rule   ' + k + '  (' + v + ')');
    for (const [k, v] of [...codesSeen].sort()) console.log('  report ' + k + '  (' + v + ')');
  }
  console.log(pass + ' passed, ' + fail + ' failed, ' + cases.length + ' fixture(s)' +
    (args.update ? '   goldens updated: ' + updated : ''));
  if (fail) process.exit(1);
}

/** Comments carry retired spellings on purpose; the negative check reads code. */
function stripComments(text) {
  return text.split('\n').map(l => {
    let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ && ch === '\\' && i + 1 < l.length) { i++; continue; }
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === '#' && !inQ && (i === 0 || /\s/.test(l[i - 1]))) return l.slice(0, i);
    }
    return l;
  }).join('\n');
}

function diff(want, got) {
  const w = want.split('\n'), g = got.split('\n');
  const out = [];
  for (let i = 0; i < Math.max(w.length, g.length); i++) {
    if (w[i] === g[i]) continue;
    if (w[i] !== undefined) out.push('  want L' + (i + 1) + ': ' + JSON.stringify(w[i]));
    if (g[i] !== undefined) out.push('  got  L' + (i + 1) + ': ' + JSON.stringify(g[i]));
  }
  return out.slice(0, 12).join('\n');
}

/**
 * PROCESS §3.1(c) mechanised: spawn the tool, do not call into it.
 * One scratch directory per distinct flag set, because the flags are
 * whole-invocation assertions about the corpus (`--color-means=` in
 * particular) and mixing two corpora under one invocation would test a
 * combination no user can produce.
 */
function runEndToEnd(cases, verbose) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'figdown-migrate-e2e-'));
  let fail = 0;
  try {
    const groups = new Map();
    for (const c of cases) {
      const k = c.flags.argv.join(' ');
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(c);
    }
    let g = 0;
    for (const [key, members] of groups) {
      const dir = path.join(root, 'g' + (g++));
      fs.mkdirSync(dir);
      for (const m of members) fs.writeFileSync(path.join(dir, m.name + '.fd'), m.input, 'utf8');
      let stdout = '';
      try {
        stdout = execFileSync(process.execPath, [TOOL, '--write', ...members[0].flags.argv, dir],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (e) {
        // Exit 1 is the tool's normal "report items outstanding" code.
        stdout = (e.stdout || '') + (e.stderr || '');
        if (e.status !== 1) {
          fail++;
          console.log('FAIL  end-to-end [' + (key || 'no flags') + '] exited ' + e.status + '\n' + stdout);
          continue;
        }
      }
      for (const m of members) {
        const onDisk = fs.readFileSync(path.join(dir, m.name + '.fd'), 'utf8');
        if (onDisk !== m.landed) {
          fail++;
          console.log('FAIL  end-to-end ' + m.name + ' — what the binary wrote differs from the golden\n' +
            diff(m.landed, onDisk).replace(/\n/g, '\n      '));
        }
        if (m.refused) {
          if (onDisk !== m.input) {
            fail++;
            console.log('FAIL  end-to-end ' + m.name + ' — a REFUSED file was written to anyway');
          }
          if (!/REFUSED/.test(stdout)) {
            fail++;
            console.log('FAIL  end-to-end ' + m.name + ' — the binary did not print REFUSED');
          }
        }
      }
      if (verbose) console.log('e2e   [' + (key || 'no flags') + ']  ' + members.length + ' fixture(s) replayed through the binary');
    }
    // The guard: the binary must REFUSE the fixture corpus itself.
    let guarded = false;
    try {
      execFileSync(process.execPath, [TOOL, '--write', FIXTURES], { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      guarded = /refusing to (touch|descend into)/.test((e.stdout || '') + (e.stderr || ''));
    }
    if (!guarded) {
      fail++;
      console.log('FAIL  the tool does NOT refuse tools/migrate-fixtures/ — a --write run over ' +
        'its own inputs would rewrite each one into its expected output and agree with itself');
    } else if (verbose) {
      console.log('e2e   the tool refuses tools/migrate-fixtures/ as a corpus');
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  if (!fail) console.log('e2e       ' + cases.length + ' fixture(s) replayed through the binary, corpus guard held');
  return fail;
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.stack || e);
    process.exit(2);
  }
}
