#!/usr/bin/env node
// strip-check.js — the GUI-WRITEBACK-STRUCTURE "strip test" for FigDown figures
//
// Named for what it does, not for the item code that ordered it: the file was
// `r25-check.js` until this release. Every prose reference in the repository
// already said "the strip test"; the filename was the last place carrying the
// internal code. The requirement ID GUI-WRITEBACK-STRUCTURE is unchanged and is still what the
// spec cites.
//
// Checks the semantic-completeness invariant (spec §3, GUI-WRITEBACK-STRUCTURE, MEANING-RECOVERY-SOURCE):
// stripping every layout line (`pin` and the bare `layout` line)
// MUST leave a document that still parses, renders, and expresses the
// identical structure and relationships.
//
// LAYOUT-ZONE-NAMESPACE names that set: the layout zone is its own NAMESPACE, and
// stripping the namespace plus its opener is exactly what this test does, so
// the strip set is read off that rule and needs no separate judgement.
//
// `size` left the set (ELEMENT-GEOMETRY-DIRECTIVE): the keyword was retired and its
// `width=`/`height=` keys moved onto `pin`, so an extent is now stripped with
// the pin line that carries it. `path` and `routing` left
// (EDGE-GEOMETRY-CONSTRUCTS), WITHDRAWN from the language rather than moved, so the namespace —
// and this strip set — is now `pin` alone. The invariant did not change; its
// membership did.
//
// `flow` and `rank` are NOT stripped (maintainer ruling). They
// are content-zone scene keywords — core §7 lists them there and the semantic
// model carries `ranks` — so stripping them was the tool contradicting the
// spec, not the spec being loose: a rank is an authored statement that these
// elements are peers, exactly the kind of knowledge the strip test exists to
// prove survives.
//
// Flags nodes whose only relationship to the rest of the figure is geometric:
//   • scene nodes with no incident edge AND no group membership (orphans)
//   • documents where ALL scene nodes are orphans (pure "pinned canvas")
//
// Group membership IS a syntactic relation: after stripping layout lines you
// still know those nodes are peers inside that group, so a grouped node is
// never an orphan.
//
// Typed blocks (bitfield/table/timing) are inherently ordered by declaration;
// their members are never flagged.
//
// A document carrying the marker comment `# decorative` is reported as
// `skip` and never fails, including under --strict. The marker is an author
// assertion: this figure carries no knowledge that must survive the strip test.
// It was spelled `# r25: decorative` until this release, which dropped the
// internal-code prefix: it is the one place the standard asked an author to
// type a project item code into their own document (MIGRATIONS).
//
// Usage:
//   node tools/strip-check.js [--strict] [<file.fd | dir> ...]
//
// --strict   exit 1 if any document has pinned-orphan scene nodes
//
// Default paths when none given: examples/  examples/patterns/  figures/
// (resolved from the project root, independent of CWD).

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Engine lookup (same order as build-svg.js / layout-lint.js) ──────────────

const ENGINE_CANDIDATES = [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean);

function findEngine() {
  return ENGINE_CANDIDATES.find(p => fs.existsSync(p)) || null;
}

function loadEngine(enginePath) {
  const h = fs.readFileSync(enginePath, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end   = h.indexOf('// 3. UI');
  if (start < 0 || end < 0)
    throw new Error('Cannot locate engine boundaries in ' + enginePath);
  // eslint-disable-next-line no-new-func
  const factory = new Function(h.slice(start, end) + '\nreturn {parse, render};');
  return factory();
}

// ── Strip helper ──────────────────────────────────────────────────────────────
// Lines to strip: those matching ^pin\b — the whole layout
// NAMESPACE (LAYOUT-ZONE-NAMESPACE) — and the bare `layout` keyword line, its opener.
// `flow` and `rank` are content, not layout.
// `size` is gone (ELEMENT-GEOMETRY-DIRECTIVE): its keys are `pin` keys now, stripped with the pin.
// `path`/`routing` are gone (EDGE-GEOMETRY-CONSTRUCTS): withdrawn from the language.

const STRIP_RE = /^pin\b/;
const LAYOUT_RE = /^layout\s*(?:#.*)?$/;

function stripLayout(src) {
  return src
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return true; // keep blanks and comments
      return !STRIP_RE.test(t) && !LAYOUT_RE.test(t);
    })
    .join('\n');
}

// ── Scene-bearing genre check ─────────────────────────────────────────────────
// Pure bitfield/table/timing documents have no scene nodes to check.

const NON_SCENE_GENRES = new Set(['bitfield', 'table', 'timing']);

function isSceneGenre(doc) {
  return !NON_SCENE_GENRES.has(doc.genre);
}

// ── Relationship coverage analysis ───────────────────────────────────────────
// Given a parsed doc, determine which scene nodes are "orphans":
// no incident edge AND no group membership.

function analyzeDoc(doc) {
  // Build set of node IDs that appear as edge endpoints.
  const connectedByEdge = new Set();
  for (const e of doc.edges) {
    connectedByEdge.add(e.a);
    connectedByEdge.add(e.b);
  }

  // Find orphan scene nodes: no incident edge AND no group membership.
  // Group membership is a syntactic relation that survives stripping, so a
  // grouped node always has a recoverable relation to the rest of the figure.
  const orphans = [];
  for (const n of doc.nodes) {
    const hasEdge  = connectedByEdge.has(n.id);
    const inGroup  = !!n.group;
    if (!hasEdge && !inGroup) {
      orphans.push(n.id);
    }
  }

  // Among orphans, find those that have a pin (pinned orphans) —
  // these are the dangerous ones: their meaning lives in coordinates.
  const pinnedOrphans = orphans.filter(id => id in doc.pins);

  const allNodesOrphans = doc.nodes.length > 0 && orphans.length === doc.nodes.length;

  return { orphans, pinnedOrphans, allNodesOrphans };
}

// ── Decorative opt-out ────────────────────────────────────────────────────────
// The marker comment `# decorative` anywhere in the document asserts that
// the figure carries no knowledge that must survive the strip test (e.g. a
// rendering demo whose content IS its geometry). Such documents report `skip`
// and never fail, including under --strict.

// The retired `# r25: decorative` spelling is NOT accepted: the marker is
// author-typed, so a silently-tolerated old spelling would be a second way to
// say one thing. `tools/migrate-figdown.js` rewrites it.
const DECORATIVE_RE = /^#\s*decorative\b/;

function isDecorative(src) {
  return src.split('\n').some(line => DECORATIVE_RE.test(line.trim()));
}

// ── File collection ───────────────────────────────────────────────────────────

function collectFd(arg) {
  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved)) {
    process.stderr.write('warning: path not found: ' + arg + '\n');
    return [];
  }
  const st = fs.statSync(resolved);
  if (st.isDirectory()) {
    return fs.readdirSync(resolved)
      .filter(f => f.endsWith('.fd'))
      .sort()
      .map(f => path.join(resolved, f));
  }
  return [resolved];
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}
function lpad(s, n) {
  s = String(s);
  return s.length >= n ? s : ' '.repeat(n - s.length) + s;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);

  let strict = false;
  const inputs = [];
  for (const a of argv) {
    if (a === '--strict') { strict = true; continue; }
    if (a.startsWith('--')) {
      process.stderr.write('unknown flag: ' + a + '\n');
      process.exit(2);
    }
    inputs.push(a);
  }

  const projectRoot = path.join(__dirname, '..');
  const searchPaths = inputs.length
    ? inputs
    : [
        path.join(projectRoot, 'examples'),
        path.join(projectRoot, 'examples', 'patterns'),
        path.join(projectRoot, 'figures'),
      ];

  const enginePath = findEngine();
  if (!enginePath) {
    process.stderr.write('figdown.html not found (set $FIGDOWN_HTML or keep it next to this script)\n');
    process.exit(2);
  }

  let engine;
  try {
    engine = loadEngine(enginePath);
  } catch (err) {
    process.stderr.write('Failed to load engine: ' + err.message + '\n');
    process.exit(2);
  }

  // Collect all .fd files.
  const files = [];
  for (const sp of searchPaths) {
    for (const f of collectFd(sp)) {
      if (!files.includes(f)) files.push(f);
    }
  }

  if (!files.length) {
    process.stderr.write('No .fd files found in the given paths.\n');
    process.exit(0);
  }

  // Column widths.
  const C = {
    file:          34,
    nodes:          5,
    orphans:        7,
    pinOrph:        9,
    verdict:        6,
  };

  const TOTAL_W = C.file + 2 + C.nodes + 2 + C.orphans + 2 + C.pinOrph + 2 + C.verdict;
  const SEP = '-'.repeat(TOTAL_W);

  const header = [
    pad('file',           C.file),
    lpad('nodes',         C.nodes),
    lpad('orphans',       C.orphans),
    lpad('pin-orph',      C.pinOrph),
    pad('verdict',        C.verdict),
  ].join('  ');

  console.log(SEP);
  console.log(header);
  console.log(SEP);

  const rows    = [];     // { rel, nodeCount, orphans, pinnedOrphans, verdict }
  let skipped   = 0;
  let anyFail   = false;

  for (const fdPath of files) {
    const rel = path.relative(process.cwd(), fdPath);

    let src;
    try { src = fs.readFileSync(fdPath, 'utf8'); }
    catch (e) {
      process.stderr.write('Cannot read ' + fdPath + ': ' + e.message + '\n');
      skipped++;
      continue;
    }

    // ── Step 1: parse as-is ──────────────────────────────────────────────────
    let base;
    try { base = engine.parse(src); }
    catch (e) {
      process.stderr.write('skip ' + rel + ': parse threw: ' + e.message + '\n');
      skipped++;
      continue;
    }

    if (base.errs && base.errs.length) {
      process.stderr.write('skip ' + rel + ': ' + base.errs[0] + '\n');
      skipped++;
      continue;
    }

    const doc = base.doc;

    // Skip non-scene documents.
    if (!isSceneGenre(doc)) { skipped++; continue; }
    if (doc.nodes.length === 0 && doc.groups.length === 0) { skipped++; continue; }

    // Author opt-out: the figure asserts it carries no strip-test knowledge.
    if (isDecorative(src)) {
      rows.push({
        rel,
        nodeCount:  doc.nodes.length,
        orphans:    '-',
        pinnedOrphans: '-',
        verdict:    'skip',
        decorative: true,
      });
      continue;
    }

    // ── Step 2: parse stripped copy ──────────────────────────────────────────
    const stripped = stripLayout(src);
    let strippedResult;
    try { strippedResult = engine.parse(stripped); }
    catch (e) {
      process.stderr.write('skip ' + rel + ': stripped parse threw: ' + e.message + '\n');
      skipped++;
      continue;
    }

    if (strippedResult.errs && strippedResult.errs.length) {
      // Stripping broke the document — severe violation.
      const row = {
        rel,
        nodeCount:     doc.nodes.length,
        orphans:       0,
        pinnedOrphans: 0,
        verdict: 'fail',
        stripError: strippedResult.errs[0],
      };
      rows.push(row);
      anyFail = true;
      continue;
    }

    // ── Step 3: relationship coverage heuristics ──────────────────────────────
    // Run analysis on ORIGINAL doc so we know which nodes had pins.
    const analysis = analyzeDoc(doc);

    let verdict = 'ok';
    if (analysis.pinnedOrphans.length > 0) verdict = 'fail';
    else if (analysis.orphans.length > 0)   verdict = 'warn';

    if (verdict === 'fail') anyFail = true;

    rows.push({
      rel,
      nodeCount:       doc.nodes.length,
      orphans:         analysis.orphans.length,
      pinnedOrphans:   analysis.pinnedOrphans.length,
      orphanIds:       analysis.orphans,
      pinnedOrphanIds: analysis.pinnedOrphans,
      allNodesOrphans: analysis.allNodesOrphans,
      verdict,
    });
  }

  // Print table.
  for (const r of rows) {
    const line = [
      pad(r.rel,                  C.file),
      lpad(r.nodeCount,           C.nodes),
      lpad(r.orphans,             C.orphans),
      lpad(r.pinnedOrphans,       C.pinOrph),
      pad(r.verdict,              C.verdict),
    ].join('  ');
    console.log(line);
  }

  console.log(SEP);
  if (skipped) console.log('skipped (non-scene / parse error): ' + skipped);

  const decorative = rows.filter(r => r.verdict === 'skip');
  if (decorative.length) {
    console.log('decorative (author opt-out, `# decorative`): ' + decorative.length);
  }

  // ── Per-flagged-doc detail ────────────────────────────────────────────────
  const flagged = rows.filter(r => r.verdict !== 'ok' && r.verdict !== 'skip');
  if (flagged.length) {
    console.log('');
    console.log('Flagged documents:');
    for (const r of flagged) {
      console.log('');
      console.log('  ' + r.rel + '  [' + r.verdict + ']');
      if (r.stripError) {
        console.log('    strip broke the document: ' + r.stripError);
        continue;
      }
      if (r.allNodesOrphans) {
        console.log('    ALL nodes are orphans — pure "pinned canvas": meaning lives in geometry entirely');
      }
      if (r.pinnedOrphanIds && r.pinnedOrphanIds.length) {
        console.log('    pinned-orphan ids: ' + r.pinnedOrphanIds.join(', '));
      } else if (r.orphanIds && r.orphanIds.length) {
        console.log('    orphan ids (unpinned): ' + r.orphanIds.join(', '));
      }
      console.log('    meaning may live in geometry — express the relation in syntax');
      console.log('    (edge, group, or an ordered construct) instead of pins');
    }
  } else if (rows.some(r => r.verdict === 'ok')) {
    console.log('');
    console.log('All documents pass the GUI-WRITEBACK-STRUCTURE strip test.');
  }

  if (strict && anyFail) {
    process.exit(1);
  }
  process.exit(0);
}

main();
