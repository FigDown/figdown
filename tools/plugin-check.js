#!/usr/bin/env node
// plugin-check.js — the Claude Code plugin wrapper must stay a WRAPPER.
//
// 0.1 added two manifests and NOT a second copy of the skill:
//
//   .claude-plugin/plugin.json       plugin root = the repository root, with
//                                    "skills": "./skill/" pointing at the ONE
//                                    bundle that already exists
//   .claude-plugin/marketplace.json  one entry, "source": "./"
//
// The whole point is that no file of the skill is duplicated — this project
// has shipped SEVEN copy-drift incidents and an eighth copy would be an
// eighth incident. What CAN drift here is not bytes but NUMBERS AND PATHS:
// three version strings (package.json, plugin.json, the marketplace entry)
// that must be one release, and a `skills` path that silently stops resolving
// the day someone moves or renames `skill/figdown/`. A plugin whose skills
// path misses does not fail loudly; it installs and teaches nothing. So this
// gate checks the joins, which is all a wrapper has.
//
// It also checks the metadata carries no fingerprint (D10): no personal name,
// no local path, contact at figdown.org.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const strict = process.argv.includes('--strict');
const fail = [];
let found = 0;
const note = (m) => fail.push(m);

function readJSON(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { note('missing: ' + rel); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { note(rel + ': not valid JSON — ' + e.message); return null; }
}

const pkg = readJSON('package.json');
const plug = readJSON('.claude-plugin/plugin.json');
const mkt = readJSON('.claude-plugin/marketplace.json');
if (!pkg || !plug || !mkt) { report(); return; }

// ---- 1. one release, three files -----------------------------------------
const entry = (mkt.plugins || []).find((p) => p && p.name === plug.name);
if (!entry) note('marketplace.json has no entry named "' + plug.name + '"');
if ((mkt.plugins || []).length !== 1)
  note('marketplace.json: expected exactly 1 plugin entry, found ' + (mkt.plugins || []).length);
for (const [what, v] of [['plugin.json', plug.version], ['marketplace entry', entry && entry.version]]) {
  if (v !== pkg.version)
    note(what + ' version ' + JSON.stringify(v) + ' !== package.json version ' +
      JSON.stringify(pkg.version) + ' — the release is one number in three files');
}

// ---- 2. the skills path must resolve to the ONE bundle -------------------
const declared = [].concat(plug.skills || []);
if (!declared.length) note('plugin.json has no "skills" field; the wrapper would ship no skill');
for (const rel of declared) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    note('plugin.json skills path does not exist: ' + rel);
    continue;
  }
  for (const name of fs.readdirSync(dir).sort()) {
    if (fs.existsSync(path.join(dir, name, 'SKILL.md'))) found++;
  }
}
if (found !== 1)
  note('expected exactly 1 <name>/SKILL.md under the declared skills path, found ' + found);
if (!fs.existsSync(path.join(ROOT, 'skill', 'figdown', 'SKILL.md')))
  note('skill/figdown/SKILL.md is gone — the standalone install path documented in ' +
    'skill/README.md is what the plugin wraps');

// ---- 3. no second copy of the bundle ------------------------------------
if (fs.existsSync(path.join(ROOT, 'skills')))
  note('a top-level skills/ directory exists — the wrapper points at skill/ and ' +
    'must never grow a second copy of the bundle');

// ---- 4. source "./" is the marketplace root, which is this repository ----
if (entry && entry.source !== './')
  note('marketplace entry source is ' + JSON.stringify(entry && entry.source) +
    '; the plugin root IS the repository root, so it must be "./"');

// ---- 5. no fingerprint (D10) --------------------------------------------
const blob = JSON.stringify([plug, mkt]);
if (/\/home\/|\/Users\/|[A-Z]:\\\\/.test(blob)) note('manifest carries a local filesystem path');
for (const [what, o] of [['plugin.json author', plug.author], ['marketplace owner', mkt.owner]]) {
  if (!o || !o.name) { note(what + ' has no name'); continue; }
  if (o.name !== 'FigDown') note(what + ' name is ' + JSON.stringify(o.name) + ', expected "FigDown"');
  if (o.email && !/@figdown\.org$|@users\.noreply\.github\.com$/.test(o.email))
    note(what + ' email ' + JSON.stringify(o.email) + ' is neither a figdown.org nor a noreply address');
}

report();

function report() {
  console.log('plugin-check — Claude Code plugin wrapper');
  console.log('  plugin.json      ' + (plug ? plug.name + ' ' + plug.version : '(unreadable)'));
  console.log('  marketplace.json ' + (mkt ? mkt.name + ', ' + (mkt.plugins || []).length + ' entry' : '(unreadable)'));
  console.log('  skills path      ' + JSON.stringify(plug && plug.skills) + ' -> ' + found + ' skill(s)');
  console.log('');
  if (!fail.length) { console.log('OK  wrapper manifests agree with package.json and with skill/'); return; }
  for (const m of fail) console.log('  ' + m);
  console.log('');
  console.log((strict ? 'FAIL' : 'WARN') + '  ' + fail.length + ' plugin-wrapper problem(s)');
  if (strict) process.exitCode = 1;
}
