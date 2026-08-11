#!/usr/bin/env node
'use strict';
// archive-check.js — the immutability gate.
//
//   node tools/archive-check.js [--strict]
//   node tools/archive-check.js --write <release>   (append a new release)
//
// WHY THIS FILE EXISTS
//
// core.md §13.5 makes ONE promise that is unconditional from the first
// release onward: AVAILABLE. Per released version `vX.Y.Z` the project keeps
// a git tag and a runnable engine page, and "neither is ever rewritten".
// migrations.md is the narrative index over that archive.
//
// Nothing enforced the "never rewritten" half. Every other gate in this
// repository asks whether the CURRENT state is self-consistent — dist-check
// asks whether `dist/` still matches its generator, skill-coverage check 0
// asks whether the vendored reference still matches `read/0.1/`. Those are a
// different question, and a correct answer to them is compatible with an
// archived file having been silently edited: a regenerated artifact is
// SUPPOSED to change when its generator changes. An archived one is not.
//
// The distinction, stated once:
//
//   generated content  -> must match its generator TODAY   (dist-check.js,
//                         skill-coverage.js check 0)
//   archived content   -> must match the bytes it was RELEASED with, forever
//                         (this file)
//
// WHAT IS ARCHIVED
//
//   archive/0.1/figdown.html  the engine that shipped as v0.1.0 — byte for
//                             byte the file users ran, which is the PUBLISHED
//                             engine (stamped 0.1.0), not the source engine at
//                             the tag (stamped 0.1). Recovering the
//                             picture needs the engine users had, not the one
//                             the maintainer had.
//   read/0.1/**.md            the reading contract for language `figdown 0.1`,
//                             published with v0.1.0. `figdown 0.1` is frozen,
//                             so what it means is frozen with it. A later
//                             release that wants to say something different
//                             about reading writes `read/0.2/`.
//
// WHAT IT CHECKS
//
//   A. MODIFICATION. Every path in the manifest is re-hashed (SHA-256) and
//      compared. A single changed byte fails, naming the file.
//   B. DELETION. A manifest path that no longer exists fails, naming the
//      file. Deletion is the failure mode a content hash cannot see, and the
//      one that actually destroys an archive.
//   C. ADDITION. A file under an archived prefix that the manifest does not
//      list fails. Without this, an archived version can be changed by
//      addition — a second engine page beside the first, a new `read/0.1/`
//      file the release never had — and A and B both stay green.
//   D. COVERAGE. Every released version named in the manifest must have at
//      least one runnable engine page. This is §13.5's obligation restated as
//      a test, so a release that ships with a tag and no page fails here
//      rather than being noticed years later by the reader who needed it.
//
// The check is over ALL archived versions, every run — not the newest one.
// An archive that is only verified at the moment it is written is not an
// archive; the whole promise is about the years afterwards.
//
// SCOPE — this repository, not the published site. The manifest records the
// bytes as they stand HERE, which is what the maintainer's constraint asks
// for: the archive must be reachable by git even if the domain lapses. The
// published tree is a distillate whose `read/0.1/` differs from this one by
// the publish transforms (status markers, decision codes); its own
// immutability is the publish pipeline's question, answered by its own
// history and by `damage.py`. `archive/**` is byte-identical in both trees
// because the pipeline is told not to transform it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'archive', 'MANIFEST.tsv');
const MANIFEST_REL = 'archive/MANIFEST.tsv';

// A path is "archived" if it sits under one of these prefixes. Derived from
// the manifest itself rather than written out here: a closed list of prefixes
// is the defect shape that breaks at the next release.
function prefixesOf(rows) {
  const set = new Set();
  for (const r of rows) {
    const parts = r.file.split('/');
    set.add(parts.slice(0, 2).join('/'));   // archive/0.1, read/0.1
  }
  return [...set].sort();
}

const strict = process.argv.includes('--strict');
let failures = 0;
function fail(msg) { console.log('  FAIL  ' + msg); failures++; }
function ok(msg) { console.log('  ok    ' + msg); }

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) {
    console.error('archive-check: ' + MANIFEST_REL + ' is missing — the archive has no manifest of hashes,');
    console.error('               so nothing can be said about whether it changed. This is a failure,');
    console.error('               not an empty pass.');
    process.exit(1);
  }
  const rows = [];
  const lines = fs.readFileSync(MANIFEST, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('#')) continue;
    const f = line.split('\t');
    if (f.length !== 4) {
      console.error('archive-check: ' + MANIFEST_REL + ' line ' + (i + 1) + ' has ' + f.length +
        ' fields, expected 4 (release, file, bytes, sha256)');
      process.exit(2);
    }
    rows.push({ release: f[0], file: f[1], bytes: Number(f[2]), sha: f[3].trim(), line: i + 1 });
  }
  return rows;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

// ---- --write: append a release. Never rewrites an existing row.
function write(release) {
  if (!release || release.startsWith('-')) {
    console.error('archive-check --write needs a release, e.g.  --write 0.2');
    process.exit(2);
  }
  const rows = fs.existsSync(MANIFEST) ? readManifest() : [];
  if (rows.some(r => r.release === release)) {
    console.error('archive-check --write: release ' + release + ' is already in ' + MANIFEST_REL + '.');
    console.error('               An archive row is written once and never rewritten (core.md §13.5).');
    console.error('               If the bytes on disk differ from the row, the bytes are wrong.');
    process.exit(1);
  }
  const files = [...walk(path.join(ROOT, 'archive', release), []),
                 ...walk(path.join(ROOT, 'read', release), [])]
    .filter(f => f !== MANIFEST_REL).sort();
  if (!files.length) {
    console.error('archive-check --write: nothing found under archive/' + release + '/ or read/' + release + '/');
    process.exit(1);
  }
  const lines = files.map(f => [release, f, fs.statSync(path.join(ROOT, f)).size, sha256(path.join(ROOT, f))].join('\t'));
  fs.appendFileSync(MANIFEST, lines.join('\n') + '\n');
  console.log('archive-check --write: appended ' + lines.length + ' row(s) for release ' + release);
}

const wi = process.argv.indexOf('--write');
if (wi !== -1) { write(process.argv[wi + 1]); process.exit(0); }

// ---- the gate
const rows = readManifest();
const prefixes = prefixesOf(rows);
const releases = [...new Set(rows.map(r => r.release))].sort();

console.log('archive-check — archived content is byte-unchanged from release');
console.log('  manifest: ' + MANIFEST_REL + '  (' + rows.length + ' file(s), ' +
  releases.length + ' release(s): ' + releases.join(', ') + ')');
console.log('  prefixes: ' + prefixes.join(', '));
console.log('');

// A + B
let changed = 0, missing = 0;
for (const r of rows) {
  const abs = path.join(ROOT, r.file);
  if (!fs.existsSync(abs)) {
    fail('DELETED  ' + r.file + '  (release ' + r.release + ', ' + MANIFEST_REL + ' line ' + r.line + ')\n' +
         '          The archive is an AVAILABILITY promise (core.md §13.5). Restore the file;\n' +
         '          removing the row is not the fix.');
    missing++;
    continue;
  }
  const got = sha256(abs);
  if (got !== r.sha) {
    const size = fs.statSync(abs).size;
    fail('MODIFIED ' + r.file + '  (release ' + r.release + ', ' + MANIFEST_REL + ' line ' + r.line + ')\n' +
         '          expected sha256 ' + r.sha + '  (' + r.bytes + ' bytes)\n' +
         '          on disk    sha256 ' + got + '  (' + size + ' bytes)\n' +
         '          Archived content is never rewritten. Revert the file.');
    changed++;
  }
}
if (!changed && !missing) ok(rows.length + ' archived file(s): every one present and byte-identical to release');

// C
const onDisk = new Set();
for (const p of prefixes) for (const f of walk(path.join(ROOT, p), [])) onDisk.add(f);
onDisk.delete(MANIFEST_REL);
const listed = new Set(rows.map(r => r.file));
const extra = [...onDisk].filter(f => !listed.has(f)).sort();
if (extra.length) {
  fail('UNLISTED under an archived prefix — an archived version cannot gain files either:\n' +
       extra.map(f => '            ' + f).join('\n') + '\n' +
       '          Either it belongs to a NEW release (write it under that release and run\n' +
       '          --write), or it does not belong in the archive.');
} else {
  ok('no unlisted file under ' + prefixes.join(', '));
}

// D
for (const rel of releases) {
  const pages = rows.filter(r => r.release === rel && /^archive\/[^/]+\/.*\.html$/.test(r.file)
    && fs.existsSync(path.join(ROOT, r.file)));
  if (!pages.length) {
    fail('release ' + rel + ' has no runnable engine page under archive/' + rel + '/.\n' +
         '          core.md §13.5 owes every released version a tag AND a page.');
  } else {
    ok('release ' + rel + ': ' + pages.length + ' runnable engine page(s) — ' +
       pages.map(p => p.file).join(', '));
  }
}

console.log('');
if (failures) {
  console.log('archive-check: ' + failures + ' failure(s)');
  process.exit(strict ? 1 : 1);
}
console.log('OK  every archived version is byte-unchanged from the release that shipped it');
