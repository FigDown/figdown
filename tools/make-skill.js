#!/usr/bin/env node
// Regenerate the self-contained agent-skill bundle in skill/figdown/.
// SKILL.md is source (hand-maintained); the engine + build tool are
// copied from their single sources (the "regenerate, don't fork" rule).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST = path.join(ROOT, 'skill', 'figdown');

fs.mkdirSync(DEST, { recursive: true });
for (const [src, dst] of [
  [path.join(ROOT, 'poc', 'figdown.html'), path.join(DEST, 'figdown.html')],
  [path.join(__dirname, 'build-svg.js'), path.join(DEST, 'build-svg.js')],
]) {
  fs.copyFileSync(src, dst);
  console.log('OK  ' + path.relative(ROOT, dst));
}
