#!/usr/bin/env node
// Regenerate the self-contained agent-skill bundle in skill/figdown/.
//
// This script owns THREE things, all copied from a single source (the
// "regenerate, don't fork" rule):
//
//   figdown.html          <- editor/figdown.html
//   build-svg.js          <- tools/build-svg.js
//   reference/**.md       <- read/0.4/**.md          (GENRE-REFERENCE-ADDRESS;
//                                                       repointed, STATECHART-GENRE-SCOPE,
//                                                       DRAWN-ANNOTATION-FORM, and
//                                                       SEQUENCE-GENRE-VOCABULARY)
//
// SKILL.md is still hand-maintained SOURCE; this script neither writes nor
// deletes it.
//
// WHY reference/ IS GENERATED. `read/<X.Y>/` is the source of truth an ordinary
// reader of this repository is sent to — nothing to install, and a version
// directory so that a new language version is a NEW directory while the old
// one is never touched again. STATECHART-GENRE-SCOPE exercised that for the first
// time: `read/0.1/` is frozen at the bytes v0.1.0 shipped and hashed in
// `archive/MANIFEST.tsv`, `read/0.2/` is the frozen figdown 0.2 contract, and
// `read/0.3/` is the frozen figdown 0.3 contract, and `read/0.4/` is the LIVE
// contract this script
// mirrors. The `figdown 0.1` reading is unchanged inside it — `Y` removes
// nothing — plus what `figdown 0.2`, `0.3` and `0.4` added. `read/0.4/` is also
// where erratum E1 (spec/ERRATA.md, GENRE-NAMESPACE) is discharged: it states the
// layout-zone rule by NAMESPACE MEMBERSHIP rather than by textual position, so
// the vendored mirror carries the corrected wording and the
// three frozen trees keep the wording they shipped.
// The bundle still needs its own copy, because `skill/figdown/`
// is copied standalone into `~/.claude/skills/` and must work with no network
// and no repository, so a path out of the bundle would dangle. That is a
// fourth vendored copy of a text this project has already shipped SEVEN
// four-copy-drift incidents against, so it is generated here and byte-gated by
// `tools/skill-coverage.js` (check 0, VENDOR). Never hand-edit
// `skill/figdown/reference/`; edit `read/0.4/` and re-run this script.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST = path.join(ROOT, 'skill', 'figdown');
const READ_SRC = path.join(ROOT, 'read', '0.4');
const REF_DEST = path.join(DEST, 'reference');

fs.mkdirSync(DEST, { recursive: true });
for (const [src, dst] of [
  [path.join(ROOT, 'editor', 'figdown.html'), path.join(DEST, 'figdown.html')],
  [path.join(__dirname, 'build-svg.js'), path.join(DEST, 'build-svg.js')],
]) {
  fs.copyFileSync(src, dst);
  console.log('OK  ' + path.relative(ROOT, dst));
}

// reference/: mirror read/0.4/ exactly. Files that no longer exist upstream are
// DELETED here, because a stale leftover is the same defect as a stale copy —
// SKILL.md's router would go on naming a file that source no longer has.
function mirror(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  const want = new Set();
  for (const name of fs.readdirSync(srcDir).sort()) {
    const s = path.join(srcDir, name);
    const d = path.join(dstDir, name);
    if (fs.statSync(s).isDirectory()) { want.add(name); mirror(s, d); continue; }
    if (!name.endsWith('.md')) continue;
    want.add(name);
    fs.copyFileSync(s, d);
    console.log('OK  ' + path.relative(ROOT, d));
  }
  for (const name of fs.readdirSync(dstDir)) {
    if (want.has(name)) continue;
    const p = path.join(dstDir, name);
    fs.rmSync(p, { recursive: true, force: true });
    console.log('DEL ' + path.relative(ROOT, p));
  }
}
mirror(READ_SRC, REF_DEST);
