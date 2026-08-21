#!/usr/bin/env node
// check-candidate-core.js — does tools/author-probe/skill-candidate.md still
// pass gate:skill-coverage's CHECK 4 (CORE)?
//
// WHY THIS EXISTS
// ----------------
// tools/skill-coverage.js hardcodes its target path (`skill/figdown/SKILL.md`)
// with no file-argument override, and this probe is explicitly forbidden from
// touching skill/figdown/SKILL.md (decisions/registry.md: the
// amendment lives ONLY in the candidate file until the adoption gate passes).
// So the real gate cannot be pointed at the candidate directly. This script
// is the documented fallback: a faithful, INDEPENDENT reimplementation of
// check 4's scanning rule (skill-coverage.js's `scanDoc`, restricted to the
// 'kw'/'opt' hit kinds that check 4 reads), run against the candidate file,
// with its findings compared against the SAME scan run over the real
// skill/figdown/SKILL.md — so what is reported is not "the candidate has
// N risky tokens" (some of those may already be in the real file and already
// exempt for reasons this script does not re-derive, e.g. retirement
// markers) but "the candidate introduces tokens the real file does not
// already carry," which is the only question §0's constraint leaves
// unanswered.
//
// This is reuse, not a second copy of the registry: it requires
// tools/reference-coverage.js (`RC`) for the engine facts and the tick-span
// scanner exactly as tools/skill-coverage.js does, and reimplements only the
// ~10-line CORE-set intersection and the keyword/option-key detection rule
// that check 4 itself is built from — both are already tiny, inline
// computations in skill-coverage.js, not the vocabulary EXTRACTION RC's own
// module comment warns against duplicating.
//
// USAGE
//   node tools/author-probe/check-candidate-core.js
//
// Exit 0: no new genre-owned keyword or option key outside the real file's
// own set. Exit 1: the candidate introduces one. Exit 2: tool error (e.g.
// the engine could not be read).
'use strict';
const fs = require('fs');
const path = require('path');
const RC = require('../reference-coverage.js');

const ROOT = RC.ROOT;
const REAL_SKILL = path.join(ROOT, 'skill', 'figdown', 'SKILL.md');
const CANDIDATE = path.join(__dirname, 'skill-candidate.md');

// ── the same tiny scan check 4 runs, reimplemented (not copied) ────────────
// Only what check 4 needs: bare keyword-shaped tokens and `key=` option
// tokens inside backtick spans (outside ```figdown fences) or inside a
// ```figdown fence's own lines. Enum values, edge operators and the
// retirement-marker logic are check 2/3's concern, not check 4's, and are
// left out on purpose — reproducing them would be the "second copy" RC's
// own module comment warns against, and check 4 does not read them.
function scanKwOpt(text) {
  const lines = text.split(/\r?\n/);
  const kw = new Set();
  const opt = new Set();
  let inFence = false;
  const noteKeyVal = (raw) => {
    const re = /\b([a-z][\w-]*)=/g;
    let m;
    while ((m = re.exec(raw))) opt.add(m[1]);
  };
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) { inFence = !inFence && /^\s*```figdown\b/.test(raw); continue; }
    if (inFence) {
      const line = RC.stripComment(raw).trim();
      const m = /^([a-zA-Z][\w-]*)\b/.exec(line);
      if (m) kw.add(m[1]);
      noteKeyVal(line);
      continue;
    }
    for (const t of RC.ticks(raw)) {
      const s = t.trim();
      if (/[/\\]|\.(?:js|fd|svg|md|html|json)\b/.test(s)) continue; // path/shell command, exempt
      if (/^[a-z][\w-]*=/.test(s)) { noteKeyVal(s); continue; }
      const first = /^([a-z][\w-]*)\b/.exec(s);
      if (first && /^[a-z][\w-]*$/.test(s)) kw.add(s);
      else if (first) { kw.add(first[1]); noteKeyVal(s); }
    }
  }
  return { kw, opt };
}

function main() {
  const engine = RC.loadEngine();
  const FACTS = RC.engineVocabFacts(engine);
  const genres = Object.keys(FACTS.top).sort();
  let CORE = null;
  for (const g of genres) {
    const s = new Set(FACTS.top[g]);
    CORE = CORE === null ? s : new Set([...CORE].filter((x) => s.has(x)));
  }
  const CORE_OPT = new Set(['fill', 'stroke', 'style', 'class', 'at', 'width', 'height']);
  const isLiveKw = (k) => {
    if (k === '|') return true;
    for (const g of genres) if (FACTS.top[g].includes(k)) return true;
    for (const g of Object.keys(FACTS.children)) if (FACTS.children[g].includes(k)) return true;
    return false;
  };

  const bloat = (text) => {
    const { kw, opt } = scanKwOpt(text);
    const bloatKw = [...kw].filter((k) => !CORE.has(k) && !FACTS.retiredKw.has(k) && !RC.GENRES.includes(k) && isLiveKw(k));
    const bloatOpt = [...opt].filter((k) => !CORE_OPT.has(k) && !FACTS.retiredOpt.has(k));
    return { bloatKw, bloatOpt };
  };

  const real = bloat(fs.readFileSync(REAL_SKILL, 'utf8'));
  const cand = bloat(fs.readFileSync(CANDIDATE, 'utf8'));

  const newKw = cand.bloatKw.filter((k) => !real.bloatKw.includes(k));
  const newOpt = cand.bloatOpt.filter((k) => !real.bloatOpt.includes(k));

  console.log('check-candidate-core — reimplements gate:skill-coverage check 4 (CORE), see header comment');
  console.log('  genre-independent core (∩ of engine allowlists): ' + [...CORE].sort().join(' '));
  console.log('  real  ' + path.relative(ROOT, REAL_SKILL) + ': ' + real.bloatKw.length + ' genre-owned keyword(s) outside CORE, ' + real.bloatOpt.length + ' option key(s)');
  if (real.bloatKw.length) console.log('    kw:  ' + real.bloatKw.sort().join(', '));
  if (real.bloatOpt.length) console.log('    opt: ' + real.bloatOpt.sort().join(', '));
  console.log('  candidate ' + path.relative(ROOT, CANDIDATE) + ': ' + cand.bloatKw.length + ' genre-owned keyword(s) outside CORE, ' + cand.bloatOpt.length + ' option key(s)');
  if (cand.bloatKw.length) console.log('    kw:  ' + cand.bloatKw.sort().join(', '));
  if (cand.bloatOpt.length) console.log('    opt: ' + cand.bloatOpt.sort().join(', '));
  console.log('');
  if (newKw.length || newOpt.length) {
    console.log('FAIL — the candidate introduces genre-owned token(s) the real file does not already carry:');
    if (newKw.length) console.log('  new kw:  ' + newKw.sort().join(', '));
    if (newOpt.length) console.log('  new opt: ' + newOpt.sort().join(', '));
    process.exit(1);
  }
  console.log('OK — the candidate introduces no genre-owned keyword or option key beyond what ' + path.relative(ROOT, REAL_SKILL) + ' already carries. gate:skill-coverage check 4 should read the candidate the same way it reads the real file today.');
}

try { main(); } catch (e) { console.error(e.stack || e); process.exit(2); }
