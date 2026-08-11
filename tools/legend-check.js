#!/usr/bin/env node
// FigDown legend gate — the legend must draw exactly the distinctions the
// figure makes, and no others.
//
// core §2.7 states the rule the derived legend exists to keep: it "draws what
// the author declared, and nothing the author did not". Two failures invert
// it in opposite directions, and BOTH shipped in the published corpus with
// every other gate green:
//
//   (A) DUPLICATE SWATCH — two classes resolve to the same drawn swatch, so
//       the legend shows two entries a reader cannot tell apart. It CLAIMS a
//       distinction the drawing does not make. Shipped in three files:
//       `class bridge_domain … style=dashed stroke=#1d4ed8` beside
//       `class pe_ce_bgp … style=dashed stroke=#1d4ed8`.
//
//   (B) UNREACHABLE CHANNEL — a class declares a paint channel that cannot
//       reach any member it is actually joined by, so the swatch draws ink no
//       element in the figure carries. It SHOWS a distinction the drawing
//       cannot make. Shipped in `examples/reference/bitfield.fd`:
//       `class vendor … style=dotted` joined only by `field`s, and `style=`
//       left `field`'s option list (STYLE-KEY-SCOPE) — the legend drew a
//       dotted swatch for a channel with no possible member.
//
// Neither is visible to any other gate: both documents PARSE, their artifacts
// AGREE with their sources, and their comments name no retired spelling. The
// project's repeated lesson is that a rule needs a gate, not care.
//
// Usage:
//   node tools/legend-check.js [--strict] [--verbose] [<file.fd | dir> ...]
//   default paths: examples/, figures/   (recursive — §3.1(d))
//   --strict   exit 1 on any failure
//   --verbose  list every legend entry with its resolved swatch
//
// Engine lookup order matches build-svg.js: $FIGDOWN_HTML, a co-located
// figdown.html, then ../editor/figdown.html.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const ENGINE = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean).find(p => fs.existsSync(p));

function loadEngine() {
  if (!ENGINE) throw new Error('figdown.html not found (set FIGDOWN_HTML or keep it next to this script)');
  const h = fs.readFileSync(ENGINE, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  return new Function(h.slice(start, end)
    + '\nreturn {parse, render, stackSectionSvgs, FIGDOWN_VERSION};')();
}

// ---- the resolved swatch -------------------------------------------------
// The renderer draws the legend swatch from the class's DECLARED channels,
// substituting its own defaults for the ones left unwritten (`fill` → #fff,
// `stroke` → #555, `style` → no dash array). A class that declares NO channel
// draws no swatch at all (CLASS-PAINT-REQUIREMENT) — only its meaning text — so it cannot
// collide with anything and is not compared.
const SWATCH_DEFAULT = { fill: '#fff', stroke: '#555', style: 'solid' };
const CHANNELS = ['fill', 'stroke', 'style'];

function declaresPaint(c) {
  return c.fill !== undefined || c.stroke !== undefined || c.style !== undefined;
}
function resolvedSwatch(c) {
  return CHANNELS.map(k => (c[k] !== undefined ? String(c[k]) : SWATCH_DEFAULT[k])).join(' | ');
}

// Two distinct legal values per channel. The probe never asks what the value
// MEANS — only whether changing it changes the drawing — so any two legal
// values that the renderer must render differently will do.
const PROBE = {
  fill:   ['#010203', '#040506'],
  stroke: ['#010203', '#040506'],
  style:  ['dashed', 'dotted'],
};

// Does class `ci` of `doc` paint anything at all through channel `k`?
//
// Asked by DIFFERENTIAL RENDER rather than by modelling which element kinds
// accept which key: the engine owns that table, it has moved twice (INTERIOR-LESS-ELEMENT-PAINT,
// STYLE-KEY-SCOPE), and a second copy of it in a gate is the drift this file exists to
// catch. The class's label is blanked first — a label-less class draws no
// legend entry (CLASS-EMPTY-MEANING/CLASS-PAINT-REQUIREMENT) — so the only ink either render can differ in
// comes from a MEMBER. Identical renders therefore mean: no member of this
// class can receive this channel.
function channelReaches(engine, doc, ci, k) {
  const out = PROBE[k].map(v => {
    const d = JSON.parse(JSON.stringify(doc));
    d.classes[ci].label = '';
    d.classes[ci][k] = v;
    try { return engine.render(d, {}).svg; } catch (e) { return 'ERR:' + e.message; }
  });
  return out[0] !== out[1];
}

function checkDoc(engine, doc, sectionNo, findings, entries) {
  const classes = doc.classes || [];
  const seen = new Map();
  classes.forEach((c, ci) => {
    if (c.label === '' || c.label === undefined) return;   // no legend entry
    if (!declaresPaint(c)) {                               // meaning-only entry
      entries.push({ section: sectionNo, id: c.id, swatch: '(no swatch)', line: c.line });
      return;
    }
    const sw = resolvedSwatch(c);
    entries.push({ section: sectionNo, id: c.id, swatch: sw, line: c.line });

    // (A) duplicate swatch
    if (seen.has(sw)) {
      findings.push({
        kind: 'duplicate-swatch',
        line: c.line,
        msg: 'class "' + c.id + '" resolves to the same legend swatch as class "'
          + seen.get(sw) + '" (' + sw + ') — the legend draws two entries a reader '
          + 'cannot tell apart, claiming a distinction the drawing does not make. '
          + 'Give one of them a different fill=, stroke= or style=, or merge the two meanings into one class.',
      });
    } else {
      seen.set(sw, c.id);
    }

    // (B) unreachable channel
    for (const k of CHANNELS) {
      if (c[k] === undefined) continue;
      if (!channelReaches(engine, doc, ci, k)) {
        findings.push({
          kind: 'unreachable-channel',
          line: c.line,
          msg: 'class "' + c.id + '" declares ' + k + '=' + c[k] + ', the legend draws it, '
            + 'and no member of the class can receive it — changing the value changes '
            + 'nothing in the figure. Either the class is joined by no element, or the '
            + 'elements it is joined by have no such channel (an edge has no interior, so '
            + 'no fill=; a field takes no style=, STYLE-KEY-SCOPE). Declare a channel its members can '
            + 'take, or drop the class.',
        });
      }
    }
  });
}

// ---- driver --------------------------------------------------------------
function collect(p, acc) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const n of fs.readdirSync(p).sort()) collect(path.join(p, n), acc);
  } else if (p.endsWith('.fd')) {
    acc.push(p);
  }
  return acc;
}

function main(argv) {
  const args = { strict: false, verbose: false, paths: [] };
  for (const a of argv) {
    if (a === '--strict') args.strict = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '-h' || a === '--help') {
      console.log('usage: node tools/legend-check.js [--strict] [--verbose] [<file.fd | dir> ...]');
      console.log('default paths: examples/ figures/  (recursive)');
      return 0;
    } else args.paths.push(a);
  }
  if (!args.paths.length) {
    args.paths = [path.join(ROOT, 'examples'), path.join(ROOT, 'figures')].filter(p => fs.existsSync(p));
  }

  const engine = loadEngine();
  const files = [];
  for (const p of args.paths) collect(p, files);

  console.log('legend-check  engine=' + path.relative(ROOT, ENGINE)
    + '  version=' + engine.FIGDOWN_VERSION);
  console.log('roots: ' + args.paths.map(p => path.relative(ROOT, p) || '.').join(' ')
    + '   (recursive)');
  console.log('');

  let failed = 0, checkedFiles = 0, skipped = 0, entryCount = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const src = fs.readFileSync(f, 'utf8');
    let parsed;
    try { parsed = engine.parse(src); } catch (e) {
      console.log('SKIP  ' + rel + '  (engine threw: ' + e.message + ')');
      skipped++; continue;
    }
    const errs = parsed.errs || parsed.errors || [];
    if (errs.length) { skipped++; continue; }   // error fixtures have no drawing
    const docs = parsed.docs && parsed.docs.length ? parsed.docs : (parsed.doc ? [parsed.doc] : []);
    checkedFiles++;

    const findings = [], entries = [];
    docs.forEach((d, i) => checkDoc(engine, d, i + 1, findings, entries));
    entryCount += entries.length;

    if (findings.length) {
      failed++;
      console.log('FAIL  ' + rel);
      for (const fi of findings) {
        console.log('        line ' + (fi.line === undefined ? '?' : fi.line)
          + ' [' + fi.kind + '] ' + fi.msg);
      }
    } else if (args.verbose && entries.length) {
      console.log('ok    ' + rel);
      for (const e of entries) console.log('        ' + e.id + '  ' + e.swatch);
    }
  }

  console.log('');
  console.log('checked ' + checkedFiles + ' figure(s), ' + entryCount + ' legend entr(ies)'
    + '   skipped ' + skipped + ' (parse errors / error fixtures)'
    + '   of ' + files.length + ' .fd file(s) found');
  console.log(failed
    ? 'FAIL  ' + failed + ' figure(s) with an indistinguishable or unreachable legend entry'
    : 'OK  every legend entry is distinguishable and every declared channel reaches a member');
  return args.strict && failed ? 1 : 0;
}

if (require.main === module) {
  try { process.exit(main(process.argv.slice(2))); }
  catch (e) { console.error(String(e && e.message || e)); process.exit(2); }
}
module.exports = { resolvedSwatch, channelReaches };
