#!/usr/bin/env node
'use strict';
// harness-check.js — the language-agnostic harness contract is ALIVE: the
// conformance runner's subprocess mode still feeds a `.fd` on stdin, still
// compares an external command's stdout against the same goldens the
// in-process path uses, and still refuses a command that breaks a rule.
//
// WHY THIS GATE EXISTS, AND WHY IT IS NOT THE WHOLE SUITE.
//
// Engine-backlog item 80 (a defect against INDEPENDENT-IMPLEMENTATION-CRITERION) added a subprocess path to
// `conformance/run.js` so that a Parser written in any language can be run
// against `conformance/cases/`. The proof that it works is the FULL suite
// through the reference adapter — 290/290, verdict-for-verdict identical to
// the in-process run — and that proof is reproducible by one command, printed
// by `--help` below. It is NOT this gate, and the arithmetic is the reason:
// the full subprocess run costs ~33 s against the in-process run's ~0.6 s,
// because every fixture pays a fresh process start, and `npm test` as a whole
// costs ~45 s. A gate that runs it would add 73% to every gate run to
// re-derive a number that only changes when this gate is already red.
//
// So this gate buys the thing the full run does NOT buy, at ~3 s: it exercises
// the contract's RULES. The 290-fixture run walks exactly one path — a
// well-behaved adapter agreeing with every golden — and therefore proves
// nothing about what happens when an adapter exits 2, names no error, emits a
// blank line, or drops the trailing newline core §12.5 requires. Those are the
// branches a stranger will actually hit, and they are what a contract is for.
// A representative FIVE fixtures cover the plumbing (both golden kinds, the
// `sections` wrapper, the Renderer-class skip, and a fixture full of awkward
// bytes); the negatives cover the rest.
//
// Usage:
//   node tools/harness-check.js [--strict] [--help]
//
// --strict   exit 1 if any assertion fails (the gate form)
// --help     print usage and the full-suite reproduction command

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RUNNER = path.join(ROOT, 'conformance', 'run.js');
const ADAPTER = path.join(ROOT, 'conformance', 'adapters', 'reference-engine.js');
const README = path.join(ROOT, 'conformance', 'README.md');
const REF_CMD = JSON.stringify(process.execPath) + ' ' + JSON.stringify(ADAPTER);

const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('usage: node tools/harness-check.js [--strict] [--help]');
  console.log('');
  console.log('Checks that conformance/run.js\'s subprocess mode — the language-agnostic');
  console.log('harness contract of conformance/README.md — still holds, over a five-fixture');
  console.log('slice plus the contract\'s refusal branches.');
  console.log('');
  console.log('The FULL proof, run on demand rather than on every gate run (~33 s):');
  console.log('');
  console.log('  node conformance/run.js --engine-cmd=\'node conformance/adapters/reference-engine.js\'');
  console.log('');
  console.log('It must report the same verdict for every fixture as `node conformance/run.js`.');
  process.exit(0);
}

const fails = [];
function ok(what) { console.log('  ok    ' + what); }
function bad(what, detail) {
  fails.push(what);
  console.log('  FAIL  ' + what);
  if (detail) for (const l of String(detail).trim().split('\n').slice(0, 6)) console.log('        ' + l);
}

// --- running the runner ------------------------------------------------------
function runRunner(engineCmd, extra) {
  const args = [RUNNER];
  if (engineCmd) args.push('--engine-cmd=' + engineCmd);
  for (const a of extra || []) args.push(a);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// --- a temp adapter that breaks exactly one rule ------------------------------
// The negative adapters are three-line stubs whose whole content is the rule
// they violate. They are written here, beside the assertion they serve, rather
// than committed as a directory of files nobody would read; the mangling ones
// delegate to the reference adapter so that only the violated rule differs.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'figdown-harness-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {} });

function stub(name, body) {
  const p = path.join(TMP, name + '.js');
  fs.writeFileSync(p, "'use strict';\n" + body + '\n');
  return JSON.stringify(process.execPath) + ' ' + JSON.stringify(p);
}
// A stub that runs the reference adapter and mangles its stdout.
function mangler(name, expr) {
  return stub(name, [
    "const {spawnSync}=require('child_process');const fs=require('fs');",
    'const r=spawnSync(' + JSON.stringify(process.execPath) + ',[' + JSON.stringify(ADAPTER) + "],{input:fs.readFileSync(0)});",
    "let out=r.stdout.toString('utf8');",
    'out=(' + expr + ')(out);',
    'process.stdout.write(out);process.exitCode=r.status;',
  ].join('\n'));
}

// ── 1. the plumbing, over a representative slice ─────────────────────────────
//
// Five fixtures, each present for one reason. A missing one is a hard failure,
// not a silent skip: if a fixture is renamed, this gate must say so rather
// than quietly check four.
const SLICE = [
  ['200-node-basic', 'a plain single-section model golden'],
  ['019-multi-section-stack', 'the `sections` wrapper (core §12.5)'],
  ['369-pin-complete-cover-refused', 'a model golden beside a Renderer-class geometry golden'],
  ['118-id-quoted-positions', 'a 16-line error golden — the sort of core §8.3.7'],
  ['953-source-illegal-xml-characters', 'an error golden over bytes no editor will show you'],
];

console.log('1. the reference adapter over a representative slice');
for (const [name, why] of SLICE) {
  if (!fs.existsSync(path.join(ROOT, 'conformance', 'cases', name + '.fd'))) {
    bad('fixture ' + name + ' is missing — the slice names it for: ' + why);
    continue;
  }
  const r = runRunner(REF_CMD, [name]);
  const passed = r.status === 0 && /\n  1 passed, 0 failed, 1 total/.test(r.out) &&
                 new RegExp('^PASS  ' + name, 'm').test(r.out);
  if (passed) ok(name + '  — ' + why);
  else bad(name + '  — ' + why, r.out);
}
// The Renderer-class boundary is REPORTED, not absorbed.
{
  const r = runRunner(REF_CMD, ['369-pin-complete-cover-refused']);
  if (/HARNESS  subprocess/.test(r.out) && /1 geometry golden\(s\) unchecked/.test(r.out)) {
    ok('the run states its own boundary: 1 geometry golden unchecked, Renderer class');
  } else {
    bad('a subprocess run must print the geometry goldens it did not check', r.out);
  }
}

// ── 2. the contract's refusal branches ───────────────────────────────────────
console.log('2. a command that breaks a rule is REFUSED');
const NEG = [
  ['exit code 2 is an adapter failure, not a verdict',
   stub('exit2', 'process.exitCode=2;'), '200-node-basic', /exited 2/],
  ['exit 1 with nothing on stdout names no error',
   stub('silent', 'process.exitCode=1;'), '118-id-quoted-positions', /named no error/],
  ['a blank line inside the error list is not swallowed',
   stub('blank', "process.stdout.write('Line 1: a\\n\\nLine 2: b\\n');process.exitCode=1;"),
   '118-id-quoted-positions', /empty error line/],
  ['a model without core §12.5\'s trailing newline fails byte comparison',
   mangler('nonl', "s=>s.replace(/\\n$/,'')"), '200-node-basic', /model mismatch/],
  ['accepting a document the golden refuses is a failure',
   stub('accept', "process.stdout.write('{}\\n');"), '118-id-quoted-positions', /stale golden/],
  ['a command that does not exist fails the run',
   'figdown-no-such-engine-command', '200-node-basic', /engine command (exited|could not be run)/],
];
for (const [what, cmd, fixture, re] of NEG) {
  const r = runRunner(cmd, [fixture]);
  if (r.status === 1 && re.test(r.out)) ok(what);
  else bad(what, 'exit ' + r.status + '\n' + r.out);
}

// ── 3. what the contract deliberately does NOT constrain ─────────────────────
console.log('3. emission order is free (core §8.3.7)');
{
  const cmd = mangler('reversed', "s=>s.split('\\n').filter(Boolean).reverse().join('\\n')+'\\n'");
  const r = runRunner(cmd, ['118-id-quoted-positions']);
  if (r.status === 0) ok('a 16-error list emitted in reverse order still passes — the harness sorts');
  else bad('reverse-ordered errors must still pass; core §8.3.7 promises no order', r.out);
}

// ── 4. goldens are minted by the reference engine and by nothing else ────────
console.log('4. --update is refused in subprocess mode');
{
  const r = runRunner(REF_CMD, ['--update', '200-node-basic']);
  if (r.status === 2 && /--update is refused in subprocess mode/.test(r.out)) {
    ok('an external command cannot rewrite a golden');
  } else {
    bad('--update with --engine-cmd must exit 2 and say why', 'exit ' + r.status + '\n' + r.out);
  }
}

// ── 4b. a mistyped flag is REFUSED, never ignored ────────────────────────────
//
// Found 2026-08-24 by the v0.5.0 comparison demos, live in this runner until
// that day: an unknown `--flag` was dropped silently. For every other flag that
// is merely untidy; for `--engine-cmd` it is a false green — the caller's engine
// is never executed, the reference engine runs instead, and the run reports a
// pass the caller reads as their own. The refusal is the branch a stranger with
// a typo actually hits, so it is asserted here rather than trusted.
console.log('4b. an unrecognized --flag is refused, not ignored');
{
  const r = runRunner(null, ['--engine-cmdd=cat', '200-node-basic']);
  if (r.status === 2 && /unrecognized option/.test(r.out)) {
    ok('a mistyped --engine-cmd cannot report the reference engine\'s pass as yours');
  } else {
    bad('an unknown --flag must exit 2 and name itself, never run anyway',
        'exit ' + r.status + '\n' + r.out);
  }
}

// ── 5. the contract is WRITTEN DOWN where a stranger will look ───────────────
//
// A harness a stranger cannot read the rules of is the defect again in a new
// place. This asserts the paragraph exists and still names the interface's
// four load-bearing terms — not that its prose is any particular prose.
console.log('5. the contract is documented in conformance/README.md');
{
  const md = fs.existsSync(README) ? fs.readFileSync(README, 'utf8') : '';
  const want = [
    ['a section heading', /^#+ The harness contract/m],
    ['stdin as the input channel', /stdin/],
    ['stdout as the output channel', /stdout/],
    ['exit 0 for an accepted document', /exit\s*(code\s*)?`?0`?/i],
    ['exit 1 for a refused one', /exit\s*(code\s*)?`?1`?/i],
    ['a pointer at the reference adapter', /adapters\/reference-engine\.js/],
  ];
  for (const [what, re] of want) {
    if (re.test(md)) ok('README states ' + what);
    else bad('conformance/README.md must state ' + what);
  }
  if (fs.existsSync(ADAPTER)) ok('the reference adapter exists at conformance/adapters/reference-engine.js');
  else bad('conformance/adapters/reference-engine.js is missing — the contract has no worked example');
}

// --- summary -----------------------------------------------------------------
console.log('');
if (fails.length) {
  console.log('HARNESS CONTRACT: ' + fails.length + ' assertion(s) failed');
  for (const f of fails) console.log('  - ' + f);
  console.log('');
  console.log('The subprocess harness is what an implementation this project did not');
  console.log('write runs (engine-backlog item 80, CONFORMANCE-HARNESS-CONTRACT). A broken one makes');
  console.log('conformance/cases/ unrunnable by anyone outside this repository again.');
  process.exit(STRICT ? 1 : 0);
}
console.log('OK  the harness contract holds: ' + SLICE.length + ' fixture(s) through the reference');
console.log('    adapter, ' + NEG.length + ' refusal branch(es), order-freedom, the --update refusal,');
console.log('    and the contract paragraph in conformance/README.md.');
console.log('    Full proof (~33 s, not a gate — see the header):');
console.log('    node conformance/run.js --engine-cmd=\'node conformance/adapters/reference-engine.js\'');
