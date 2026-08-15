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
//
// AND IT COMPARES THE DESCRIPTION TEXT (0.3). Until then this gate checked
// versions, paths, `source` and fingerprints — every join EXCEPT the one piece
// of prose that is genuinely DUPLICATED. `plugin.json`'s `description` and the
// marketplace entry's `description` are two copies of one string, ~370
// characters long, and the only thing keeping them equal was someone
// re-reading both by hand. A drift there is invisible in every other gate and
// ships as two different pitches for one plugin.
//
// The four description fields are NOT all the same text and must not be forced
// to be. Only the plugin/marketplace pair is a copy; `package.json`'s is the
// npm blurb and `SKILL.md`'s is a skill TRIGGER description whose job is to
// carry "Use when …". So: the copied pair is asserted byte-identical, every
// field is asserted non-empty, and all four are PRINTED on every run with
// their lengths, so drift among the genre-different ones is visible rather
// than discovered by hand.
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

// ---- 5. the description text ---------------------------------------------
// Read the skill's frontmatter `description`. A YAML scalar may be plain,
// quoted, or folded onto continuation lines; all three are accepted, because
// the point is to compare what the field SAYS, not how it was typed.
function skillDescription() {
  const p = path.join(ROOT, 'skill', 'figdown', 'SKILL.md');
  if (!fs.existsSync(p)) { note('skill/figdown/SKILL.md missing — cannot read its description'); return null; }
  const src = fs.readFileSync(p, 'utf8');
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) { note('skill/figdown/SKILL.md has no YAML frontmatter block'); return null; }
  const lines = fm[1].split(/\r?\n/);
  const i = lines.findIndex(l => /^description\s*:/.test(l));
  if (i < 0) { note('skill/figdown/SKILL.md frontmatter has no `description:` key'); return null; }
  let v = lines[i].replace(/^description\s*:\s*/, '');
  for (let j = i + 1; j < lines.length; j++) {          // folded continuations
    if (/^\S+\s*:/.test(lines[j]) || lines[j].trim() === '') break;
    v += ' ' + lines[j].trim();
  }
  v = v.trim();
  const q = v.match(/^"([\s\S]*)"$/) || v.match(/^'([\s\S]*)'$/);
  if (q) v = q[1];
  return v.trim();
}

const DESCRIPTIONS = [
  ['package.json',       pkg.description],
  ['plugin.json',        plug.description],
  ['marketplace entry',  entry && entry.description],
  ['SKILL.md',           skillDescription()],
];

// (a) every one present and non-empty. An empty description is the silent
// failure mode for a listing: the plugin installs and describes itself as "".
for (const [what, v] of DESCRIPTIONS) {
  if (v === null) continue;                     // already reported by the reader
  if (typeof v !== 'string' || !v.trim()) note(what + ' has no description text');
}

// (b) THE COPIED PAIR must be byte-identical. This is the only pair that is a
// duplicate rather than a different genre of prose.
if (typeof plug.description === 'string' && entry && typeof entry.description === 'string'
    && plug.description !== entry.description) {
  note('plugin.json description and the marketplace entry description differ — they are '
     + 'ONE string stored twice, and nothing else in this repository compares them');
  const a = plug.description, b = entry.description;
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  note('  first difference at character ' + k
     + ': plugin.json ' + JSON.stringify(a.slice(k, k + 40))
     + ' vs marketplace ' + JSON.stringify(b.slice(k, k + 40)));
}

// (c) the skill description must carry its TRIGGER clause. A skill description
// without one still loads and simply never fires, which no other gate sees.
const skillDesc = DESCRIPTIONS[3][1];
if (typeof skillDesc === 'string' && skillDesc && !/\buse\s+when\b/i.test(skillDesc))
  note('skill/figdown/SKILL.md description has no "Use when …" clause — a skill '
     + 'description that never states its trigger loads and never fires');

// ---- 6. no fingerprint (D10) --------------------------------------------
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

  // DESCRIPTIONS, PRINTED UNCONDITIONALLY. Three of these four are different
  // genres of prose and cannot be asserted equal, so the only way drift among
  // them stops being invisible is to put them on the screen every run.
  if (typeof DESCRIPTIONS !== 'undefined') {
    console.log('');
    console.log('  description text (plugin.json and the marketplace entry must match exactly):');
    for (const [what, v] of DESCRIPTIONS) {
      const s = typeof v === 'string' ? v : '';
      console.log('    ' + what.padEnd(18) + String(s.length).padStart(4) + ' chars  '
                + JSON.stringify(s.length > 62 ? s.slice(0, 59) + '...' : s));
    }
    const a = plug && plug.description, b = entry && entry.description;
    console.log('    plugin.json == marketplace entry: '
              + (typeof a === 'string' && a === b ? 'yes' : 'NO'));
  }
  console.log('');
  if (!fail.length) { console.log('OK  wrapper manifests agree with package.json and with skill/'); return; }
  for (const m of fail) console.log('  ' + m);
  console.log('');
  console.log((strict ? 'FAIL' : 'WARN') + '  ' + fail.length + ' plugin-wrapper problem(s)');
  if (strict) process.exitCode = 1;
}
