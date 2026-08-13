#!/usr/bin/env node
// artifact-check.js — every `.svg` artifact must agree with the `.fd` it was
// built from.
//
// Core §7 makes this check possible and this check is what makes §7 pay: an
// artifact embeds its own source (`<metadata id="figdown-source">`), a
// SHA-256 **of that source** (`data-sha256=`), and the engine version that
// rendered it (`data-engine-version=`, new); and same-basename
// pairing (`X.fd` <-> `X.svg`) is normative, so the artifact always has
// exactly one source file to be checked against. Nothing in the repository
// was performing that comparison.
//
// Why it exists — the same failure shipped twice:
//
//   0.1  migrated 32 `.fd` sources and never rebuilt their `.svg`
//               files. Its own byte-identity check compared the old
//               artifacts against the old artifacts, so it agreed with
//               itself and shipped 32 figures that no longer showed what
//               their source said.
//   0.1  the same omission, 5 artifacts: examples/reference/block,
//               block-experimental, topology, examples/statechart/
//               dhcp-client, examples/layout-compare/srl-evpn-irb-tuned.
//               One of them was a CHANGED DRAWING, not just changed
//               metadata: `data-edge` carries the 1-based SOURCE LINE, and
//               the ELEMENT-GEOMETRY-DIRECTIVE `size`->`pin` merge deleted a line above the edges,
//               so the artifact carried edge indices that no longer named
//               the lines they pointed at.
//
// Every one of those artifacts was INTERNALLY CONSISTENT — its recorded hash
// matched its own embedded source — which is why no existing gate could see
// them. Only the artifact-against-`.fd` comparison can.
//
// Verdicts:
//
//   ok           recorded hash == SHA-256 of the paired `.fd`
//   STALE        it does not — the artifact shows a figure its source no
//                longer describes. FAIL, exit 1, with or without --strict:
//                a stale artifact is a wrong figure already shipped, not a
//                lint opinion. (This is the one place this repository's
//                tools deviate from "--strict is what makes it fail".)
//   engine-lag   hash agrees, but the artifact was rendered by an engine
//                OLDER than the current one. WARN normally, FAIL under
//                --strict. RENDERING-DETERMINISM promises byte-identical output for the same
//                source AND the same renderer version, so a lagging
//                artifact is outside the promise even when its source
//                matches.
//   engine-ahead hash agrees, but the artifact records a NEWER engine than
//                the one in this checkout — the working tree is inconsistent
//                (an engine copy was reverted, or an artifact arrived from
//                elsewhere). Same severity as engine-lag.
//   no-version   an artifact predating 0.1 carries no
//                `data-engine-version` at all. The absence is itself the
//                information (MIGRATIONS 0.1): NO version is inferred
//                for it and it is neither warned nor failed — it is counted
//                on its own line so the number is visible.
//   skip         reported with counts, never silently omitted:
//                  no-metadata — an `.svg` with no `figdown-source` element
//                                (hand-drawn, or from another tool)
//                  no-source   — an artifact with metadata whose paired
//                                `.fd` is absent
//
// It RECURSES. Six tools in this repository were once non-recursive, and
// 40% of the gallery had therefore never been gated by any of them. A gate
// that does not recurse is a gate that lies; check the `files=` count in the
// header against `find <dir> -name '*.svg' | wc -l`.
//
// Usage:
//   node tools/artifact-check.js [--strict] [--verbose] [<file.svg | file.fd | dir> ...]
//
//   default paths: examples/  figures/  (resolved from the project root,
//                  independent of CWD)
//   --strict   also exit 1 on engine-lag / engine-ahead
//   --verbose  print every artifact, not only the flagged ones
//
// Exit codes: 0 clean · 1 stale (always) or flagged (--strict) · 2 tool error.

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PATHS = ['examples', 'figures'];

// ── Engine lookup (same order as build-svg.js / comment-check.js) ────────────

const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(ROOT, 'editor', 'figdown.html'),
].filter(Boolean);

/**
 * The current engine version is read OUT OF THE ENGINE, never out of a
 * constant kept here: a hand-mirrored version number is the defect this tool
 * would then be unable to see (`tools/make-lib.js` carried a stale mirror for
 * four releases).
 */
function engineVersion() {
  const p = ENGINE_CANDIDATES.find(f => fs.existsSync(f));
  if (!p) throw new Error('figdown.html not found (set FIGDOWN_HTML)');
  const h = fs.readFileSync(p, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + p);
  const { FIGDOWN_VERSION } =
    new Function(h.slice(start, end) + '\nreturn {FIGDOWN_VERSION};')();
  if (typeof FIGDOWN_VERSION !== 'string' || !FIGDOWN_VERSION)
    throw new Error('engine drift: no FIGDOWN_VERSION in ' + path.relative(ROOT, p));
  return { version: FIGDOWN_VERSION, path: p };
}

// ── Metadata ─────────────────────────────────────────────────────────────────

// The element the renderer writes (build-svg.js, and the editor's own
// download path). The attribute probes are deliberately `[^>]*`-tolerant in
// the same way the engine's SVG round-trip loader is: further attributes may
// be added (`data-render-options` already is), and a reader anchored on the
// element's closing `">` would break the next time one is.
const RE_META    = /<metadata id="figdown-source"([^>]*)>/;
const RE_SHA     = /\bdata-sha256="([0-9a-f]{64})"/;
const RE_ENGINE  = /\bdata-engine-version="([^"]*)"/;
const RE_OPTIONS = /\bdata-render-options="([^"]*)"/;

function readMeta(svgPath) {
  const text = fs.readFileSync(svgPath, 'utf8');
  const m = RE_META.exec(text);
  if (!m) return null;
  const attrs = m[1];
  const sha = RE_SHA.exec(attrs);
  if (!sha) throw new Error(rel(svgPath) +
    ': figdown-source metadata carries no data-sha256 — the artifact is malformed');
  const eng = RE_ENGINE.exec(attrs);
  const opt = RE_OPTIONS.exec(attrs);
  return {
    sha256: sha[1],
    engine: eng ? eng[1] : null,
    options: opt ? opt[1] : null,
  };
}

// ── Version ordering ─────────────────────────────────────────────────────────

/**
 * 0.1 < `0.1` < 0.2 < `1.0`. A released version outranks
 * every dev increment that led to it, which is what `dev: Infinity` encodes.
 * An unparseable version is not guessed at: the artifact is reported as
 * unknown-version rather than silently compared under some other reading
 * (core §13.7 — never reinterpret a declared version).
 */
function parseVersion(v) {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-dev\.(\d+))?$/.exec(String(v).trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), m[3] === undefined ? 0 : Number(m[3]),
          m[4] === undefined ? Infinity : Number(m[4])];
}

function cmpVersion(a, b) {
  const pa = parseVersion(a), pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 4; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
}

// ── File collection (RECURSIVE) ──────────────────────────────────────────────

/**
 * Collects `.svg` files. A `.fd` path is accepted on the command line and
 * resolved to its paired artifact, so `artifact-check X.fd` does what an
 * author means by it. Dot-directories are skipped (`.git`).
 */
function collect(p, out) {
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) throw new Error('no such path: ' + p);
  const st = fs.statSync(abs);
  if (st.isFile()) {
    if (abs.endsWith('.svg')) out.push(abs);
    else if (abs.endsWith('.fd')) out.push(abs.replace(/\.fd$/, '.svg'));
    return out;
  }
  for (const e of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    if (e.name.startsWith('.')) continue;
    collect(path.join(abs, e.name), out);     // recurse — see the header
  }
  return out;
}

// ── Report ───────────────────────────────────────────────────────────────────

const pad = (s, n) => String(s).padEnd(n);

/** Repo-relative where that is shorter and readable; absolute outside the tree. */
function rel(p) {
  const r = path.relative(ROOT, p);
  return r.startsWith('..') ? p : r;
}

function main() {
  const args    = process.argv.slice(2);
  const strict  = args.includes('--strict');
  const verbose = args.includes('--verbose');
  for (const a of args) {
    if (a.startsWith('-') && a !== '--strict' && a !== '--verbose') {
      console.error('usage: node tools/artifact-check.js [--strict] [--verbose] [<file.svg | file.fd | dir> ...]');
      process.exit(2);
    }
  }
  const paths = args.filter(a => !a.startsWith('-'));

  const engine = engineVersion();
  const files  = [...new Set((paths.length ? paths : DEFAULT_PATHS)
    .flatMap(p => collect(p, [])))].sort();

  console.log('artifact-check  engine=' + path.relative(ROOT, engine.path) +
    ' (' + engine.version + ')  files=' + files.length);
  console.log('  pairing: X.svg <-> X.fd, same basename (core §7, normative)');

  const rows = [];
  const skipped = { noMeta: [], noSource: [] };

  for (const svg of files) {
    const relSvg = rel(svg);
    if (!fs.existsSync(svg)) {                 // a `.fd` named on the command line with no artifact
      skipped.noSource.push({ rel: relSvg, why: 'no artifact built for the named .fd' });
      continue;
    }
    const meta = readMeta(svg);
    if (!meta) { skipped.noMeta.push({ rel: relSvg }); continue; }

    const fd = svg.replace(/\.svg$/, '.fd');
    if (!fs.existsSync(fd)) {
      skipped.noSource.push({ rel: relSvg, why: 'no paired ' + path.basename(fd) });
      continue;
    }

    const actual = crypto.createHash('sha256')
      .update(fs.readFileSync(fd, 'utf8'), 'utf8').digest('hex');
    const stale = actual !== meta.sha256;

    let engineState = 'ok';
    if (meta.engine === null) engineState = 'no-version';   // pre-0.1; infer nothing
    else {
      const c = cmpVersion(meta.engine, engine.version);
      if (c === null) engineState = 'unknown-version';
      else if (c < 0) engineState = 'engine-lag';
      else if (c > 0) engineState = 'engine-ahead';
    }

    rows.push({
      rel: relSvg, fd: rel(fd), stale, engineState,
      recorded: meta.sha256, actual, engine: meta.engine, options: meta.options,
      verdict: stale ? 'STALE'
        : engineState === 'engine-lag' || engineState === 'engine-ahead' || engineState === 'unknown-version'
          ? engineState : 'ok',
    });
  }

  const stale   = rows.filter(r => r.stale);
  const flagged = rows.filter(r => !r.stale && r.verdict !== 'ok' && r.verdict !== 'no-version');
  const noVer   = rows.filter(r => !r.stale && r.engineState === 'no-version');
  const shown   = verbose ? rows : [...stale, ...flagged];

  if (shown.length) {
    const w = Math.max(4, ...shown.map(r => r.rel.length));
    console.log('');
    console.log(pad('artifact', w) + '  ' + pad('engine', 12) + '  verdict');
    console.log('-'.repeat(w) + '  ' + '-'.repeat(12) + '  -------');
    for (const r of shown)
      console.log(pad(r.rel, w) + '  ' + pad(r.engine || '-', 12) + '  ' + r.verdict);
  }

  if (stale.length) {
    console.log('');
    console.log('STALE artifacts — the .svg does not match the .fd it is paired with:');
    for (const r of stale) {
      console.log('');
      console.log('  ' + r.rel);
      console.log('    recorded in artifact : ' + r.recorded);
      console.log('    SHA-256 of ' + r.fd + ' : ' + r.actual);
      console.log('    rebuild: node tools/build-svg.js ' + r.fd +
        (r.options === 'with-title' ? ' --with-title' : ''));
    }
  }

  if (flagged.length) {
    console.log('');
    console.log('Engine-version mismatches (hash agrees; the RENDERER differs):');
    for (const r of flagged)
      console.log('  ' + r.rel + '  built by ' + (r.engine || '?') +
        ', current engine ' + engine.version + '  [' + r.verdict + ']');
    console.log('  RENDERING-DETERMINISM promises byte-identical output for the same source AND the same');
    console.log('  renderer version — rebuild with node tools/build-svg.js <dir>…');
  }

  console.log('');
  console.log('checked ' + rows.length + '  ok ' + rows.filter(r => r.verdict === 'ok').length +
    ' (of which no-engine-version ' + noVer.length + ')' +
    '  stale ' + stale.length + '  engine-mismatch ' + flagged.length +
    '  skipped ' + (skipped.noMeta.length + skipped.noSource.length) +
    ' (no-metadata ' + skipped.noMeta.length + ', no-source ' + skipped.noSource.length + ')');

  if (noVer.length)
    console.log('  no-engine-version: built before this release, which is where the attribute ' +
      'was added; no version is inferred for them (MIGRATIONS 0.1).');
  for (const s of skipped.noMeta)
    console.log('  skip (no figdown-source metadata): ' + s.rel);
  for (const s of skipped.noSource)
    console.log('  skip (' + s.why + '): ' + s.rel);

  console.log('');
  if (stale.length) {
    console.log('FAIL  ' + stale.length + ' artifact(s) disagree with their source');
    process.exit(1);
  }
  if (flagged.length) {
    console.log((strict ? 'FAIL  ' : 'WARN  ') + flagged.length +
      ' artifact(s) built by a different engine version');
    if (strict) process.exit(1);
    process.exit(0);
  }
  console.log('OK  ' + rows.length + ' artifact(s) agree with their sources');
  process.exit(0);
}

try {
  main();
} catch (e) {
  console.error(e.stack || e);
  process.exit(2);
}
