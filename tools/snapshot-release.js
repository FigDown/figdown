#!/usr/bin/env node
'use strict';
// snapshot-release.js — the release-day act that freezes a language version's
// conformance suite and its normative spec text beside the engine page.
//
//   node tools/snapshot-release.js <X.Y> [--rev <rev>] [--dry-run]
//
// WHY THIS FILE EXISTS
//
// core.md §13.5 already owes every released version a tag and a runnable
// engine page, and `archive/MANIFEST.tsv` + `tools/archive-check.js` already
// hold those bytes immutable. Two things a reader of `figdown X.Y` needs were
// outside that promise, and both drift the same way:
//
//   1. THE CONFORMANCE SUITE. `conformance/cases/` is a LIVE suite: it tracks
//      the dev language, and today it pins 0.4 behaviour that the
//      shipped `v0.4.1` engine does not have. So there is no way, from this
//      tree, to answer "what was a conforming `figdown 0.4` implementation
//      required to do?" — the only suite present answers a later question.
//      A second implementation targeting a released language version has
//      nothing stable to be measured against.
//   2. THE NORMATIVE TEXT. `spec/core.md` and `spec/genres/**` are edited
//      continuously. A `figdown 0.4` document's meaning was fixed by the words
//      that shipped with `v0.4.0`, and those words are already gone from the
//      working tree. `read/<X.Y>/` freezes the READING contract; nothing froze
//      the NORMATIVE one.
//
// This tool performs the freeze, once, at the release that ships the language
// version: it materialises `archive/<X.Y>/conformance/` and
// `archive/<X.Y>/spec/` from a git rev's tree, then appends their manifest
// rows through the existing `archive-check.js --write` mechanism. From that
// moment the same A–E checks that guard the engine page guard these too.
//
// FORWARD-ONLY, AND WHY THERE IS NO BACKFILL
//
// The mechanism takes effect at the FIRST `X.Y` release after `0.4`. It is not
// applied retroactively to `archive/0.1` … `archive/0.4`, and this tool
// REFUSES to be pointed at them.
//
// The ground is the promise itself. A released tree is immutable: §13.5 says
// the archive is "never rewritten", and adding a file to a released version is
// a rewrite of it — check C of `archive-check.js` exists precisely to say so
// ("an archived version cannot gain files either"). Backfilling `0.2` would
// also require inventing bytes: the suite and the spec text as of `v0.2.0` can
// be recovered from the tag, but a `0.2` archive written in 2026-08 was never
// the thing `v0.2.0` shipped, and presenting it as such makes the archive a
// reconstruction rather than a record. The honest position is the smaller one:
// `0.1`–`0.4` get the engine page and the read tree they were released with,
// and the reader who needs their suite or their spec text goes to the tag,
// which §13.5 already guarantees is there. The gap is real, it is named here
// and in `conformance/README.md`, and it closes by itself as versions ship.
//
// WHAT IS FROZEN, AND FROM WHERE
//
//   archive/<X.Y>/conformance/   the WHOLE `conformance/` directory at the
//                                rev — fixtures, `run.js`, `normalize.js`,
//                                `README.md` and the bookkeeping files. Whole
//                                rather than a curated subset: a closed list
//                                of "the files needed to run it" is the defect
//                                shape that breaks the next time a file is
//                                added, and the same reasoning archive-check's
//                                `prefixesOf()` gives for deriving prefixes
//                                rather than writing them out applies here.
//   archive/<X.Y>/spec/          `core.md` and `genres/**` — the normative
//                                text, INCLUDING the `.zh-tw` twins. The twins
//                                ship with the release, and freezing one half
//                                of a pair is how the halves are allowed to
//                                drift: the frozen English would be corrected
//                                by an erratum against a Chinese text nobody
//                                could any longer produce.
//
// WHAT IS DELIBERATELY NOT FROZEN. `ERRATA.md`, `migrations.md` and
// `.github/CONTRIBUTING.md`. All three are the living registries that speak ABOUT frozen
// trees — §13.7.1 puts errata "outside the frozen trees" by design, because a
// correction that could only be recorded inside the tree it corrects could
// never be recorded at all. Freezing them would freeze the correction channel
// shut.
//
// FROM A REV, NEVER FROM THE WORKING TREE. Every byte is read with
// `git show <rev>:<path>`. The working tree at release time contains whatever
// the maintainer has open; the release ships a commit. Pointing this at the
// working tree would be the same lie as snapshotting today's `conformance/`
// as `0.4`.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// The last release made BEFORE this mechanism existed. A language version at
// or below this is refused: its tree is released and immutable.
const MECHANISM_AFTER = [0, 4];

// The spec paths that carry normative meaning for a language version. A
// PREFIX list, not a file list — `spec/genres/` gains files every release.
const SPEC_ROOTS = ['spec/core.md', 'spec', 'spec/genres/'];
const CONFORMANCE_ROOT = 'conformance/';

function die(msg) {
  console.error('snapshot-release: ' + msg);
  process.exit(1);
}

function git(args, opts) {
  return execFileSync('git', ['-C', ROOT].concat(args),
    Object.assign({ maxBuffer: 1 << 28 }, opts || {}));
}

function gitText(args) {
  return git(args, { encoding: 'utf8' });
}

// ---- arguments ----------------------------------------------------------
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
let version = null, rev = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') continue;
  if (a === '--rev') { rev = argv[++i]; continue; }
  if (a.startsWith('--')) die('unknown option ' + a);
  if (version === null) { version = a; continue; }
  die('unexpected argument ' + a);
}

if (!version) {
  console.error('snapshot-release — freeze a language version\'s conformance suite and spec text');
  console.error('');
  console.error('  node tools/snapshot-release.js <X.Y> [--rev <rev>] [--dry-run]');
  console.error('');
  console.error('  <X.Y>    the LANGUAGE version being released (0.5, not 0.5.0)');
  console.error('  --rev    the rev whose tree is frozen. Default HEAD — the commit that is');
  console.error('           about to become the release commit. Once the tag exists, name it');
  console.error('           (--rev v0.5.0); the tree is what is read, never the working copy.');
  console.error('  --dry-run  list what would be written and stop.');
  process.exit(2);
}

if (!/^\d+\.\d+$/.test(version)) {
  die('"' + version + '" is not a language version. It is X.Y — the LANGUAGE version\n' +
      '                  (0.5), not the release version (0.5.0). archive/ is indexed by\n' +
      '                  language version, because that is what a document declares.');
}

const vkey = version.split('.').map(Number);
const cmp = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);
if (cmp(vkey, MECHANISM_AFTER) <= 0) {
  console.error('snapshot-release: REFUSED — ' + version + ' is at or before ' +
    MECHANISM_AFTER.join('.') + ', and this mechanism is FORWARD-ONLY.');
  console.error('');
  console.error('  archive/' + version + '/ is a RELEASED tree. core.md §13.5 says a released');
  console.error('  archive is never rewritten, and adding files to one is rewriting it —');
  console.error('  check C of archive-check.js exists to say exactly that ("an archived');
  console.error('  version cannot gain files either").');
  console.error('');
  console.error('  There is a second reason, and it is the stronger one: bytes written');
  console.error('  today were never what v' + version + '.0 shipped. Recovering them from the tag');
  console.error('  is possible, but filing the result under archive/' + version + '/ presents a');
  console.error('  reconstruction as a record, and an archive that does that cannot be');
  console.error('  relied on for the one thing it is for.');
  console.error('');
  console.error('  The gap is real and is named in conformance/README.md: for 0.1 through');
  console.error('  ' + MECHANISM_AFTER.join('.') + ', the suite and the spec text of a language version are reached');
  console.error('  through that release\'s git tag, which §13.5 already guarantees. The');
  console.error('  mechanism starts at the next language version and the gap closes');
  console.error('  forward, never backward.');
  process.exit(1);
}

// ---- the rev ------------------------------------------------------------
if (!rev) rev = 'HEAD';
let sha, revSubject;
try {
  sha = gitText(['rev-parse', '--verify', '-q', rev + '^{commit}']).trim();
  revSubject = gitText(['log', '-1', '--format=%s', sha]).trim();
} catch (e) {
  die('rev "' + rev + '" does not resolve to a commit in this repository.');
}

// ---- the targets --------------------------------------------------------
const destBase = 'archive/' + version;
const targets = [destBase + '/conformance', destBase + '/spec'];
for (const t of targets) {
  if (fs.existsSync(path.join(ROOT, t))) {
    console.error('snapshot-release: REFUSED — ' + t + '/ already exists.');
    console.error('');
    console.error('  Immutability starts at write time, not at release time. This directory');
    console.error('  was written once; writing it again would replace bytes that are already');
    console.error('  the record, and archive-check.js A would then be measuring the second');
    console.error('  write against the second write\'s own rows.');
    console.error('');
    console.error('  If the snapshot is wrong and NOTHING has been released from it yet,');
    console.error('  remove the directory and its manifest rows by hand, deliberately, and');
    console.error('  run this again. If it has been released, it is not wrong; it is the');
    console.error('  record.');
    process.exit(1);
  }
}

// ---- enumerate the rev's tree ------------------------------------------
function filesUnder(prefix) {
  let out;
  try {
    out = gitText(['ls-tree', '-r', '--name-only', '-z', sha, '--', prefix]);
  } catch (e) {
    return [];
  }
  return out.split('\0').filter(Boolean);
}

const plan = [];   // [sourcePath, destPath]

for (const f of filesUnder(CONFORMANCE_ROOT)) {
  plan.push([f, destBase + '/conformance/' + f.slice(CONFORMANCE_ROOT.length)]);
}
const specSeen = new Set();
for (const root of SPEC_ROOTS) {
  for (const f of filesUnder(root)) {
    if (specSeen.has(f)) continue;
    specSeen.add(f);
    plan.push([f, destBase + '/spec/' + f.slice('spec/'.length)]);
  }
}

const nConf = plan.filter(p => p[1].indexOf('/conformance/') !== -1).length;
const nSpec = plan.length - nConf;
if (!nConf) die('the tree at ' + sha.slice(0, 12) + ' has no ' + CONFORMANCE_ROOT +
  ' — there is no suite to freeze, and an empty partition is worse than none.');
if (!nSpec) die('the tree at ' + sha.slice(0, 12) + ' has none of ' + SPEC_ROOTS.join(', ') +
  ' — there is no normative text to freeze.');

console.log('snapshot-release — freezing the conformance suite and spec text of figdown ' + version);
console.log('  rev:       ' + sha + '  (' + rev + ')');
console.log('             ' + revSubject);
console.log('  into:      ' + targets.join('/, ') + '/');
console.log('  files:     ' + nConf + ' conformance, ' + nSpec + ' spec  (' + plan.length + ' total)');
console.log('');

if (dryRun) {
  for (const [src, dst] of plan) console.log('  would write  ' + dst + '   <- ' + src + '@' + sha.slice(0, 12));
  console.log('');
  console.log('snapshot-release: --dry-run, nothing written.');
  process.exit(0);
}

// ---- materialise --------------------------------------------------------
let bytes = 0;
for (const [src, dst] of plan) {
  const buf = git(['show', sha + ':' + src]);
  const abs = path.join(ROOT, dst);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf);
  bytes += buf.length;
}
console.log('  wrote ' + plan.length + ' file(s), ' + bytes + ' bytes');

// ---- manifest rows ------------------------------------------------------
// Delegated, not reimplemented. `archive-check.js --write <release>` owns the
// row format (release, file, bytes, sha256), owns the append-only rule, and
// owns the refusal when a release already has rows. It walks BOTH
// `archive/<v>/` and `read/<v>/`, which is what check E now requires of us:
// placing `archive/<X.Y>/` on disk makes an existing `read/<X.Y>/` owe rows
// too, and one --write covers both in one append.
console.log('');
console.log('  appending manifest rows via archive-check.js --write ' + version);
try {
  const out = execFileSync(process.execPath,
    [path.join(ROOT, 'tools', 'archive-check.js'), '--write', version],
    { cwd: ROOT, encoding: 'utf8' });
  console.log('  ' + out.trim());
} catch (e) {
  console.error((e.stdout || '') + (e.stderr || ''));
  die('archive-check --write ' + version + ' refused. The files are on disk but have no\n' +
      '                  rows; nothing is holding them immutable yet. Resolve the refusal above\n' +
      '                  (most likely: release ' + version + ' already has rows) before committing.');
}

// ---- verify -------------------------------------------------------------
// The snapshot is not done when the bytes are written; it is done when the
// gate that guards them agrees. Running A–E here means a bad snapshot is
// caught by the tool that made it, on release day, rather than by `npm test`
// after the release commit is written.
console.log('');
console.log('  verifying with archive-check.js A-E');
try {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'archive-check.js'), '--strict'],
    { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  die('archive-check failed immediately after the snapshot. Do NOT commit this.');
}

console.log('');
console.log('snapshot-release: OK  figdown ' + version + ' now has a frozen conformance suite and');
console.log('                  spec text under ' + destBase + '/, covered by archive/MANIFEST.tsv.');
console.log('');
console.log('  This runs BEFORE the release commit, so the snapshot is INSIDE the tree the');
console.log('  release tag names. Commit these files with the release commit; the archive');
console.log('  becomes immutable at that tag, and no later release may add to it.');
