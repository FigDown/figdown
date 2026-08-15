#!/usr/bin/env node
'use strict';
// figdown-mcp — a Model Context Protocol server over stdio.
//
// WHY THIS EXISTS. FigDown's thesis is that an agent should read a figure's
// MEANING rather than a picture. MCP is how an agent reaches a tool, so this
// is the channel that carries the thesis to agents that have no skill
// installed, no repository checkout and no shell.
//
// ── THE ENGINE IS NOT COPIED HERE ──────────────────────────────────────────
// This repository has shipped SEVEN four-copy-drift incidents. There are four
// engine copies already (`editor/figdown.html`, hand-edited, plus the three
// generated from it: `dist/figdown.js`, `dist/figdown.mjs`,
// `skill/figdown/figdown.html`). This file adds NO fifth copy: it `require`s
// `dist/figdown.js`, exactly as `integrations/kroki-service/server.js` and
// `integrations/markdown-it-figdown/index.js` already do.
//
// `dist/figdown.js` is the right consumption point rather than merely an
// available one:
//   * it is the package's own `main` — what `require('figdown')` returns;
//   * it is the ONLY artifact with a module API (parse/render/artifact);
//   * `gate:dist` (tools/dist-check.js) already holds it to the reference
//     engine BEHAVIOURALLY — regenerating must be a byte-level no-op, both
//     builds must produce identical SVG, and every published `.fd` must parse
//     through it with the SAME ERROR SET as `editor/figdown.html`. That is
//     agreement on behaviour, not on a version string, and this server
//     inherits it for free. Consuming the editor HTML by string-slicing it
//     (as `tools/build-svg.js` must, being the thing that bootstraps the
//     others) would instead be a new, ungated coupling to a source layout.
//
// ── NO NETWORK, NO SERVICE, NO KEY ─────────────────────────────────────────
// Zero dependencies, including no MCP SDK: the stdio transport is
// newline-delimited JSON-RPC 2.0, which is ~80 lines, and taking a dependency
// to save them would be the first dependency in the whole project. Nothing
// here opens a socket, resolves a name or reads a credential. The only I/O is
// stdin/stdout and, on explicit request, reading a `.fd`/`.svg` and writing
// its sidecar `.svg`.
//
//   node integrations/mcp-server/server.js        # speaks MCP on stdin/stdout
//   node integrations/mcp-server/test.js          # the gate (npm run gate:mcp)

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Engine + docs lookup. Same shape as kroki-service: an env override, a
// co-located copy (a bundled/container layout), then the repository layout —
// which is also the npm tarball layout, since `dist/` and `skill/figdown/`
// ship at these paths.
// ---------------------------------------------------------------------------
const LIB = [
  process.env.FIGDOWN_LIB,
  path.join(__dirname, 'figdown.js'),
  path.join(__dirname, '..', '..', 'dist', 'figdown.js'),
].filter(Boolean).find(p => fs.existsSync(p));
if (!LIB) {
  console.error('figdown-mcp: dist/figdown.js not found — run: node tools/make-lib.js');
  process.exit(1);
}
const figdown = require(LIB);

const SKILL_DIR = [
  process.env.FIGDOWN_SKILL,
  path.join(__dirname, 'skill'),
  path.join(__dirname, '..', '..', 'skill', 'figdown'),
].filter(Boolean).find(p => fs.existsSync(p));

const SERVER_INFO = { name: 'figdown', title: 'FigDown', version: figdown.version };

// ---------------------------------------------------------------------------
// The genre router is DERIVED, never restated.
//
// SKILL.md's `<!-- skill-coverage: router -->` table is the one home of
// "genre on line 1 -> which reference file". Hardcoding a copy of it here
// would be the same defect as a fifth engine copy, one level down: a renamed
// reference file would leave this server confidently serving a 404. So the
// table is parsed at call time, by the same marker and the same cell shape
// `tools/skill-coverage.js` uses to gate it.
// ---------------------------------------------------------------------------
function ticks(cell) {
  const out = [];
  const re = /`([^`]+)`/g;
  let m;
  while ((m = re.exec(cell))) out.push(m[1].trim());
  return out;
}

function readRouter() {
  if (!SKILL_DIR) return null;
  const skill = path.join(SKILL_DIR, 'SKILL.md');
  if (!fs.existsSync(skill)) return null;
  const lines = fs.readFileSync(skill, 'utf8').split(/\r?\n/);
  const start = lines.findIndex(l => /<!--\s*skill-coverage:\s*router\s*-->/.test(l));
  if (start < 0) return null;
  const rows = new Map();
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!/^\s*\|/.test(l)) { if (rows.size) break; else continue; }
    const cells = l.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    if (cells.every(c => /^:?-+:?$/.test(c))) continue;
    const genres = ticks(cells[0]).filter(t => /^[a-z]+$/.test(t));
    if (!genres.length) continue;
    const md = c => ticks(c || '').filter(t => /\.md$/.test(t));
    for (const g of genres) rows.set(g, { frozen: md(cells[1]), exp: md(cells[2]) });
  }
  return rows.size ? rows : null;
}

// Task-shaped reference files: they answer a JOB rather than a genre, so they
// are not in the router table and SKILL.md names them in the prose beneath it.
const TASKS = {
  reading: 'reference/reading.md',
  transcribe: 'reference/transcribe.md',
};

// ---------------------------------------------------------------------------
// Result helpers.
//
// FAILURE MODEL, stated once because it is the whole point of the diagnostics:
// a `.fd` that does not parse is a NORMAL OUTCOME of a build, not an
// exception. The engine's `Line N: message` text is the product — it names the
// line, the reason and usually the replacement spelling — so it is returned
// verbatim in the content, never flattened into an `Error`, never turned into
// a JSON-RPC error, and never truncated.
//
// The three channels are kept distinct on purpose:
//   * JSON-RPC `error`  — protocol faults only (bad JSON, unknown method).
//   * `isError: true`   — the tool could not run at all (no such file, both
//                         `source` and `path` given). The caller's request was
//                         malformed; there is nothing to read.
//   * a normal result   — including PARSE FAILED. The tool did exactly its
//                         job: it reported why the document does not parse.
//                         `ok: false` in the first line says so unambiguously,
//                         and no client hides it as an error string.
// ---------------------------------------------------------------------------
function text(...blocks) {
  return { content: blocks.filter(b => b !== null && b !== undefined).map(t => ({ type: 'text', text: String(t) })) };
}
function toolError(msg) {
  return { content: [{ type: 'text', text: 'figdown-mcp: ' + msg }], isError: true };
}
function parseFailed(label, errors) {
  return text(
    'PARSE FAILED — ' + errors.length + ' diagnostic(s)' + (label ? ' in ' + label : '') + '.\n' +
    'This is a result, not a crash: each line names the 1-based line number, the reason,\n' +
    'and (for a retired spelling) what to write instead. Fix and call again.',
    errors.join('\n')
  );
}

// `source` or `path`, never both, never neither. Returns {src, label, file} or
// throws a message string.
function takeSource(args, exts) {
  const hasSrc = typeof args.source === 'string';
  const hasPath = typeof args.path === 'string';
  if (hasSrc && hasPath) throw 'give either `source` or `path`, not both';
  if (!hasSrc && !hasPath) throw 'one of `source` or `path` is required';
  if (hasSrc) return { src: args.source, label: '<source>', file: null };
  const file = path.resolve(args.path);
  if (!fs.existsSync(file)) throw 'no such file: ' + args.path;
  if (fs.statSync(file).isDirectory()) throw args.path + ' is a directory (figdown_check accepts directories; this tool does not)';
  if (exts && !exts.some(e => file.endsWith(e))) throw args.path + ' is not a ' + exts.join(' or ') + ' file';
  return { src: fs.readFileSync(file, 'utf8'), label: args.path, file };
}

// ---------------------------------------------------------------------------
// TOOL 1 — figdown_build
// ---------------------------------------------------------------------------
function toolBuild(args) {
  let s;
  try { s = takeSource(args, ['.fd']); } catch (m) { return toolError(m); }

  const opts = args.with_title === true ? { title: true } : undefined;
  const { svg, errors } = figdown.artifact(s.src, opts);
  if (errors.length) return parseFailed(s.label, errors);

  const wrote = args.write === true && s.file
    ? s.file.replace(/\.fd$/, '') + '.svg'
    : null;
  if (args.write === true && !s.file) {
    return toolError('`write` needs `path` — the sidecar is written beside the source and nowhere else');
  }
  if (wrote) fs.writeFileSync(wrote, svg);

  // What a build returns, decided rather than defaulted: the SVG comes back
  // UNLESS it was just written to disk, in which case the path comes back and
  // the caller is spared 5-50 KB of markup it can already open. `return_svg`
  // overrides in both directions.
  const sendSvg = typeof args.return_svg === 'boolean' ? args.return_svg : !wrote;
  const sha = (svg.match(/data-sha256="([0-9a-f]{64})"/) || [])[1] || '';

  const summary = [
    'ok: true  (' + svg.length + ' bytes)',
    'engine: ' + figdown.version + (opts ? '   render options: with-title' : ''),
    'source sha256: ' + sha,
    wrote ? 'written: ' + wrote : 'written: no (pass `path` + `write:true` to emit the sidecar)',
    sendSvg ? 'The SVG follows. It is self-carrying: it embeds its own source, that source\'s'
      + '\nSHA-256 and the engine version, so it round-trips back to .fd (spec core §7).'
      : 'SVG not returned (it is on disk). Pass `return_svg:true` to receive it inline.',
  ].join('\n');

  // The model is opt-in here and the default in figdown_read: an author who
  // just wrote the source does not need it read back.
  let model = null;
  if (args.include_model === true) {
    const p = figdown.parse(s.src);
    model = 'MODEL (spec §12 semantic surface)\n' + JSON.stringify(p.docs, null, 1);
  }

  return text(summary, sendSvg ? svg : null, model);
}

// ---------------------------------------------------------------------------
// TOOL 2 — figdown_check
// ---------------------------------------------------------------------------
function collect(dir, acc) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) collect(p, acc);
    else if (name.endsWith('.fd')) acc.push(p);
  }
  return acc;
}

function toolCheck(args) {
  const files = [];
  let inline = null;
  if (typeof args.source === 'string' && typeof args.path === 'string') {
    return toolError('give either `source` or `path`, not both');
  }
  if (typeof args.source === 'string') {
    inline = args.source;
  } else if (typeof args.path === 'string') {
    const p = path.resolve(args.path);
    if (!fs.existsSync(p)) return toolError('no such path: ' + args.path);
    if (fs.statSync(p).isDirectory()) collect(p, files);
    else files.push(p);
  } else {
    return toolError('one of `source` or `path` is required');
  }

  const units = inline !== null
    ? [{ label: '<source>', src: inline }]
    : files.map(f => ({ label: path.relative(process.cwd(), f), src: fs.readFileSync(f, 'utf8') }));

  if (!units.length) return text('ok: true  0 .fd file(s) found under ' + args.path + ' — nothing to check.');

  const bad = [];
  for (const u of units) {
    const errs = figdown.parse(u.src).errors;
    if (errs.length) bad.push(u.label + ':\n' + errs.map(e => '  ' + e).join('\n'));
  }

  // State the count. A checker that does not say how many files it looked at
  // is a checker that can silently look at none (tools/README §3.1(d)).
  const head = 'ok: ' + (bad.length === 0) + '  checked ' + units.length + ' document(s), '
    + (units.length - bad.length) + ' clean, ' + bad.length + ' with diagnostics'
    + '\nengine: ' + figdown.version;
  return bad.length ? text(head, bad.join('\n\n')) : text(head);
}

// ---------------------------------------------------------------------------
// TOOL 3 — figdown_read
// ---------------------------------------------------------------------------
const META_RE = /<metadata id="figdown-source"([^>]*)><!\[CDATA\[\n?([\s\S]*?)\n?\]\]><\/metadata>/;

function toolRead(args) {
  let s;
  try { s = takeSource(args, ['.fd', '.svg']); } catch (m) { return toolError(m); }

  // Recovering source from an artifact is the documented procedure when the
  // .fd has gone missing (SKILL.md), and while we are in the metadata we get
  // the staleness check for nothing: the artifact records the SHA-256 of the
  // source it was built from and the engine that built it.
  const notes = [];
  let src = s.src;
  if (/^\s*<(\?xml|svg)/.test(src) || (s.file && s.file.endsWith('.svg'))) {
    const m = src.match(META_RE);
    if (!m) return toolError(s.label + ' is an SVG with no <metadata id="figdown-source"> block — '
      + 'it was not produced by FigDown, so there is no source to read. Never OCR the picture.');
    src = m[2].replace(/]]]]><!\[CDATA\[>/g, ']]>');
    const attrs = m[1];
    const recordedSha = (attrs.match(/data-sha256="([0-9a-f]{64})"/) || [])[1];
    const recordedEngine = (attrs.match(/data-engine-version="([^"]*)"/) || [])[1];
    notes.push('source recovered from the artifact\'s <metadata id="figdown-source"> block');
    if (recordedEngine && recordedEngine !== figdown.version) {
      notes.push('engine skew: artifact records ' + recordedEngine + ', this server runs '
        + figdown.version + ' — same source may not give a byte-identical render (RENDERING-DETERMINISM)');
    }
    const sidecar = s.file ? s.file.replace(/\.svg$/, '.fd') : null;
    if (sidecar && fs.existsSync(sidecar) && recordedSha) {
      const live = figdown.artifact(fs.readFileSync(sidecar, 'utf8')).svg;
      const liveSha = live && (live.match(/data-sha256="([0-9a-f]{64})"/) || [])[1];
      notes.push(liveSha === recordedSha
        ? 'sidecar ' + path.basename(sidecar) + ' matches the artifact\'s recorded hash'
        : 'STALE ARTIFACT: ' + path.basename(sidecar) + ' has changed since this .svg was built. '
          + 'The .fd is truth — rebuild.');
    }
  }

  const p = figdown.parse(src);
  if (p.errors.length) return parseFailed(s.label, p.errors);

  const docs = p.docs;
  const shape = docs.map((d, i) =>
    '  section ' + (i + 1) + ': figdown ' + d.version + ' ' + d.genre
    + (d.title ? '  title ' + JSON.stringify(d.title) : '')
    + '  [' + ['nodes', 'edges', 'groups', 'classes', 'blocks', 'boundaries']
      .filter(k => Array.isArray(d[k]) && d[k].length)
      .map(k => d[k].length + ' ' + k).join(', ') + ']').join('\n');

  // The reading CONTRACT travels with the model. A model handed over bare is
  // an invitation to over-infer, and reference/reading.md exists precisely
  // because the tempting inferences (colour means a category, an empty class
  // meaning means something, a note= is parsable) are the wrong ones.
  const contract = [
    'READING CONTRACT — the short form. Full text: figdown_reference {"name":"reading"}',
    '  * Nodes are participants; edges are relationships, direction from the operator',
    '    (-> <- <->; -- asserts a relationship and NO direction).',
    '  * Category comes from a `class` reference PLUS that class\'s stated meaning.',
    '    A class whose meaning is "" asserts NO category — do not invent one from the',
    '    id or the shared colour. Colour alone never carries meaning.',
    '  * Absence is meaning: label absent (null) and label "" are different facts.',
    '  * `description=` and `note=` are authored prose. Quotable, displayable, NEVER',
    '    parsable — infer no participant, edge or category from them.',
    '  * Array order is not ranking or priority (§12.7).',
    '  * Everything below `layout` is geometry with no meaning. Skip it.',
  ].join('\n');

  const head = [
    'ok: true  ' + docs.length + ' section(s) in ' + s.label,
    'engine: ' + figdown.version,
    shape,
    notes.length ? '\n' + notes.map(n => '! ' + n).join('\n') : null,
  ].filter(Boolean).join('\n');

  return text(head, contract,
    'MODEL (spec §12 semantic surface — this is the figure\'s meaning; the SVG is not)\n'
    + JSON.stringify(docs, null, 1));
}

// ---------------------------------------------------------------------------
// TOOL 4 — figdown_reference
// ---------------------------------------------------------------------------
function serveFiles(rels, header) {
  const parts = [header];
  for (const rel of rels) {
    const f = path.join(SKILL_DIR, rel);
    if (!fs.existsSync(f)) return toolError('reference file missing: ' + rel
      + ' (the router in SKILL.md names it; the file is not on disk)');
    parts.push('===== ' + rel + ' =====\n\n' + fs.readFileSync(f, 'utf8'));
  }
  return text(...parts);
}

function toolReference(args) {
  if (!SKILL_DIR) return toolError('skill/figdown/ not found — set FIGDOWN_SKILL to its directory');
  const name = typeof args.name === 'string' ? args.name.trim().toLowerCase() : '';

  if (name === 'skill' || (!name && args.experimental === undefined)) {
    const router = readRouter();
    if (!name) {
      const rows = router
        ? [...router.entries()].map(([g, r]) =>
            '  ' + g.padEnd(11) + ' -> ' + (r.frozen.join(', ') || '(none)')
            + (r.exp.length ? '   [EXPERIMENTAL: ' + r.exp.join(', ') + ']' : '')).join('\n')
        : '  (router table unavailable)';
      return text(
        'FigDown reference index. Call again with `name` set to one of:\n\n'
        + 'GENRES — the value on line 1 of a .fd, after the version:\n' + rows + '\n\n'
        + 'TASKS:\n  reading      -> ' + TASKS.reading + '   (what you MAY and MAY NOT conclude)\n'
        + '  transcribe   -> ' + TASKS.transcribe + '   (turning an existing drawing into .fd)\n'
        + '  skill        -> SKILL.md, the whole genre-independent language\n\n'
        + 'Pass `experimental:true` with a genre to add its EXPERIMENTAL files. The parser NEVER\n'
        + 'warns, so a line that parses tells you nothing about its portability status —\n'
        + 'this router is the only signal you get.\n\n'
        + 'engine: ' + figdown.version);
    }
    return serveFiles(['SKILL.md'], 'SKILL.md — the whole genre-independent language.\n'
      + 'Load the genre file BEFORE writing line 2, not only when something fails.');
  }

  if (TASKS[name]) {
    return serveFiles([TASKS[name]], 'FigDown reference: ' + name + '.');
  }

  const router = readRouter();
  if (!router) return toolError('cannot read the router table in SKILL.md');
  if (!router.has(name)) {
    return toolError('unknown reference `' + name + '`. Genres: ' + [...router.keys()].join(', ')
      + '. Tasks: ' + Object.keys(TASKS).join(', ') + ', skill.');
  }
  const row = router.get(name);
  const rels = args.experimental === true ? row.frozen.concat(row.exp) : row.frozen;
  if (!rels.length) {
    return text('Genre `' + name + '` has no frozen reference file: everything it can express is\n'
      + 'EXPERIMENTAL (outside the v0.1 conformance surface and its compatibility promise).\n'
      + 'Call again with {"name":"' + name + '","experimental":true} to load '
      + (row.exp.join(', ') || 'nothing') + '.');
  }
  return serveFiles(rels,
    'Genre `' + name + '` — ' + (args.experimental === true ? 'frozen + EXPERIMENTAL' : 'frozen (v0.1 surface)')
    + ' load set, from SKILL.md\'s router.'
    + (args.experimental !== true && row.exp.length
      ? '\nThis genre also has EXPERIMENTAL files (' + row.exp.join(', ') + '); pass `experimental:true` for them.'
      : ''));
}

// ---------------------------------------------------------------------------
// Tool registry
// ---------------------------------------------------------------------------
const SRC_OR_PATH = {
  source: { type: 'string', description: 'FigDown source text. Mutually exclusive with `path`.' },
  path: { type: 'string', description: 'Path to a file. Mutually exclusive with `source`.' },
};

const TOOLS = [
  {
    name: 'figdown_build',
    title: 'Build a FigDown figure to SVG',
    description:
      'Render one .fd document to a deterministic, self-carrying SVG (it embeds its own '
      + 'source, that source\'s SHA-256 and the engine version, so it round-trips back to text). '
      + 'Returns the SVG inline, or writes the sidecar X.fd -> X.svg beside the source and returns '
      + 'the path. If the document does not parse, this returns the diagnostics instead — that is '
      + 'a normal result, not an error.',
    inputSchema: {
      type: 'object',
      properties: {
        source: SRC_OR_PATH.source,
        path: { type: 'string', description: 'Path to a .fd file. Mutually exclusive with `source`. Required for `write`.' },
        write: { type: 'boolean', description: 'Write the sidecar X.svg beside the source .fd. Default false. There is no arbitrary output path: the sidecar is the only file this server writes.' },
        with_title: { type: 'boolean', description: 'Draw the title in the SVG. Default false — the embedding Markdown normally supplies the caption.' },
        return_svg: { type: 'boolean', description: 'Force the SVG into the result (true) or out of it (false). Default: returned unless it was written to disk.' },
        include_model: { type: 'boolean', description: 'Also return the parsed semantic model. Default false; use figdown_read when the model is what you want.' },
      },
    },
  },
  {
    name: 'figdown_check',
    title: 'Validate FigDown without rendering',
    description:
      'Parse one document or a whole tree of .fd files and return the diagnostics — line number, '
      + 'reason, and for a retired spelling the replacement. Renders nothing and writes nothing. '
      + 'This is the tool for the write -> validate -> fix loop and for sweeping a corpus; use '
      + 'figdown_build when you actually want the SVG.',
    inputSchema: {
      type: 'object',
      properties: {
        source: SRC_OR_PATH.source,
        path: { type: 'string', description: 'A .fd file, or a directory to walk recursively for .fd files. Mutually exclusive with `source`.' },
      },
    },
  },
  {
    name: 'figdown_read',
    title: 'Read a figure\'s meaning',
    description:
      'Return the parsed semantic model of a figure — participants, relationships and their '
      + 'direction, containment, and the declared meaning of every class — with the reading '
      + 'contract that says what you may and may not conclude from it. Accepts a .fd, or a '
      + 'FigDown .svg whose source is recovered from its embedded metadata (and checked against '
      + 'the sidecar for staleness). Use this instead of looking at the picture: never OCR an SVG.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'FigDown source text, or the text of a FigDown-produced SVG. Mutually exclusive with `path`.' },
        path: { type: 'string', description: 'Path to a .fd or .svg file. Mutually exclusive with `source`.' },
      },
    },
  },
  {
    name: 'figdown_reference',
    title: 'FigDown genre reference',
    description:
      'Fetch the reference for a genre or a task. The grammar is CLOSED — an unknown line is an '
      + 'error — and each genre spells things with its own domain\'s words, so read the genre '
      + 'reference BEFORE writing line 2. Call with no arguments for the index of genres and '
      + 'tasks. The parser never warns about portability, so this is the only place the '
      + 'frozen/EXPERIMENTAL split is visible.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'A genre (block, bitfield, table, topology, flowchart, statechart, timing), a task (reading, transcribe), or "skill". Omit for the index.' },
        experimental: { type: 'boolean', description: 'Include the genre\'s EXPERIMENTAL (experimental) files — outside the v0.1 conformance surface and its compatibility promise.' },
      },
    },
  },
];

const HANDLERS = {
  figdown_build: toolBuild,
  figdown_check: toolCheck,
  figdown_read: toolRead,
  figdown_reference: toolReference,
};

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 over stdio (newline-delimited). No SDK: see the header.
// ---------------------------------------------------------------------------
// The transport requires one JSON message per line with no embedded newline;
// JSON.stringify escapes newlines, so this holds for SVG and reference prose
// alike.
const DEFAULT_PROTOCOL = '2025-06-18';

function handle(msg) {
  const { id, method, params } = msg || {};
  const isNotification = id === undefined || id === null;
  const ok = result => (isNotification ? null : { jsonrpc: '2.0', id, result });
  const err = (code, message) => (isNotification ? null : { jsonrpc: '2.0', id, error: { code, message } });

  switch (method) {
    case 'initialize':
      // Echo the client's protocol revision. Every payload here is plain text
      // content blocks, which every revision carries identically, so there is
      // nothing to negotiate; a client that asked for a revision we cannot
      // serve would have to be serving something we do not use.
      return ok({
        protocolVersion: (params && typeof params.protocolVersion === 'string')
          ? params.protocolVersion : DEFAULT_PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'FigDown keeps a figure as text (.fd) and treats the SVG as a build artifact. '
          + 'Read the .fd for meaning — never OCR the SVG. Author or edit the .fd, validate with '
          + 'figdown_check until clean, then figdown_build. figdown_reference first: the grammar '
          + 'is closed, so an unknown line is an error rather than something ignored.',
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return ok({});

    case 'tools/list':
      return ok({ tools: TOOLS });

    case 'tools/call': {
      const name = params && params.name;
      const fn = HANDLERS[name];
      if (!fn) return err(-32602, 'unknown tool: ' + name);
      try {
        return ok(fn((params && params.arguments) || {}));
      } catch (e) {
        // An unexpected fault is a TOOL error, not a protocol error: the
        // caller gets the message and can act on it.
        return ok(toolError((e && e.message) || String(e)));
      }
    }

    default:
      return err(-32601, 'method not found: ' + method);
  }
}

function main() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } });
        continue;
      }
      // Older revisions permitted a batch array; 2025-06-18 removed it. Accept
      // one either way — it costs three lines and an old client is not a bug.
      const msgs = Array.isArray(msg) ? msg : [msg];
      const out = msgs.map(handle).filter(Boolean);
      for (const r of out) write(r);
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

function write(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

module.exports = { handle, TOOLS, HANDLERS };

if (require.main === module) main();
