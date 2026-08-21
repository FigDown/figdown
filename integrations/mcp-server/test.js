#!/usr/bin/env node
'use strict';
// Test for the FigDown MCP server. Two halves:
//
//   A. THE WIRE. Spawn the server as a real subprocess and speak
//      newline-delimited JSON-RPC to it over stdio, because that is the only
//      thing an MCP client will ever do. An in-process test of `handle()`
//      cannot catch a framing bug, and framing is the half we hand-rolled.
//   B. THE TOOLS. Call `handle()` in-process against REAL figures from
//      examples/ — a multi-section topology, an experimental statechart, a
//      sequence ladder whose model has no nodes and no edges, a published
//      artifact read back through its own metadata, and a deliberately broken
//      document — because a toy figure exercises none of the paths that have
//      historically broken.
//
// Run: node integrations/mcp-server/test.js   (npm run gate:mcp)
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const SERVER = path.join(HERE, 'server.js');
const { handle, TOOLS, HANDLERS } = require('./server.js');

const TCP = path.join(ROOT, 'examples', 'showcase', 'tcp-handshake.fd');
const BFD = path.join(ROOT, 'examples', 'statechart', 'bfd-session.fd');
const SEQ = path.join(ROOT, 'examples', 'sequence', 'dhcp-lease.fd');

let n = 0;
function ok(what) { n++; console.log('  ok  ' + what); }

function call(name, args) {
  const r = handle({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args || {} } });
  assert.ok(r && r.result, 'tools/call returned no result for ' + name);
  return r.result;
}
function joined(result) { return result.content.map(c => c.text).join('\n'); }

// ---------------------------------------------------------------------------
// A. The wire
// ---------------------------------------------------------------------------
function wire() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });
    const lines = [];
    let buf = '';
    p.stdout.setEncoding('utf8');
    p.stdout.on('data', c => {
      buf += c;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const l = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (l) lines.push(JSON.parse(l));
      }
      if (lines.length === 3) { p.stdin.end(); }
    });
    p.on('error', reject);
    p.on('close', () => resolve(lines));

    const send = m => p.stdin.write(JSON.stringify(m) + '\n');
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } } });
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });   // no id -> must produce NO reply
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    // A multi-line payload on one wire line is the framing case that matters.
    send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'figdown_build', arguments: { path: TCP } } });
  });
}

async function testWire() {
  const got = await wire();
  assert.strictEqual(got.length, 3, 'expected exactly 3 replies (the notification must not get one), got ' + got.length);
  assert.deepStrictEqual(got.map(m => m.id), [1, 2, 3]);
  assert.strictEqual(got[0].result.protocolVersion, '2025-06-18', 'server must echo the client protocol revision');
  assert.ok(got[0].result.serverInfo.name === 'figdown' && got[0].result.serverInfo.version,
    'serverInfo carries the engine version');
  assert.ok(got[0].result.capabilities.tools, 'declares the tools capability');
  ok('initialize: echoes the protocol revision, reports the engine version, declares tools');

  const names = got[1].result.tools.map(t => t.name).sort();
  assert.deepStrictEqual(names, ['figdown_build', 'figdown_check', 'figdown_read', 'figdown_reference']);
  for (const t of got[1].result.tools) {
    assert.ok(t.description && t.inputSchema && t.inputSchema.type === 'object', t.name + ' needs a description and an object schema');
  }
  ok('tools/list: 4 tools, each with a description and an object input schema');

  const svg = joined(got[2].result);
  assert.ok(svg.includes('<svg') && svg.includes('</svg>'), 'the SVG came back over the wire intact');
  assert.ok(svg.includes('\n'), 'multi-line payload survived newline framing');
  ok('tools/call over stdio: a multi-line SVG survives newline-delimited framing');

  // Malformed input must be a protocol error, never a crash.
  const bad = handle(JSON.parse('{"jsonrpc":"2.0","id":9,"method":"no_such_method"}'));
  assert.strictEqual(bad.error.code, -32601);
  ok('unknown method -> JSON-RPC -32601, not a crash');
}

// ---------------------------------------------------------------------------
// B. The tools, against real figures
// ---------------------------------------------------------------------------
function testBuild() {
  const r = call('figdown_build', { path: TCP });
  assert.ok(!r.isError);
  const t = joined(r);
  assert.ok(/^ok: true/.test(t), 'build reports ok: true first');
  assert.ok(/data-sha256="[0-9a-f]{64}"/.test(t), 'the artifact carries the SHA-256 of its source');
  assert.ok(t.includes('<metadata id="figdown-source"'), 'the artifact is self-carrying');
  ok('build examples/showcase/tcp-handshake.fd -> self-carrying SVG, returned inline');

  // Determinism (RENDERING-DETERMINISM): same source, same engine, byte-identical output.
  const again = joined(call('figdown_build', { path: TCP }));
  assert.strictEqual(t, again, 'two builds of one source must be byte-identical');
  ok('build is deterministic: two calls, byte-identical output');

  // Sidecar write, and the hash it records must be the hash of the source on
  // disk — the pairing artifact-check.js enforces across the repository.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'figdown-mcp-'));
  try {
    const src = fs.readFileSync(BFD, 'utf8');
    const fd = path.join(tmp, 'bfd-session.fd');
    fs.writeFileSync(fd, src);
    const w = call('figdown_build', { path: fd, write: true });
    const wt = joined(w);
    assert.ok(!w.isError && /^ok: true/.test(wt));
    const out = path.join(tmp, 'bfd-session.svg');
    assert.ok(fs.existsSync(out), 'sidecar X.fd -> X.svg written beside the source');
    assert.ok(!wt.includes('<svg'), 'the SVG is NOT echoed back when it was written to disk');
    const recorded = fs.readFileSync(out, 'utf8').match(/data-sha256="([0-9a-f]{64})"/)[1];
    const actual = require('node:crypto').createHash('sha256').update(src, 'utf8').digest('hex');
    assert.strictEqual(recorded, actual, 'the artifact records the SHA-256 of its own source');
    ok('build write:true -> sidecar on disk, hash of the real source, SVG not echoed back');

    // return_svg overrides the default in both directions.
    assert.ok(joined(call('figdown_build', { path: fd, write: true, return_svg: true })).includes('<svg'));
    assert.ok(!joined(call('figdown_build', { path: fd, return_svg: false })).includes('<svg'));
    ok('return_svg overrides the write-derived default in both directions');

    // Reading a published artifact back through its own metadata.
    const rd = call('figdown_read', { path: out });
    const rt = joined(rd);
    assert.ok(!rd.isError);
    assert.ok(rt.includes('source recovered from the artifact'), 'source recovered from <metadata>');
    assert.ok(rt.includes('matches the artifact'), 'sidecar hash checked against the artifact');
    ok('read a .svg: source recovered from its metadata, sidecar hash verified');

    // Staleness: change the .fd and the artifact must be reported stale.
    fs.writeFileSync(fd, src.replace('title "', 'title "X '));
    assert.ok(joined(call('figdown_read', { path: out })).includes('STALE ARTIFACT'),
      'a changed .fd must make its .svg report STALE');
    ok('read a .svg whose .fd moved on -> STALE ARTIFACT, "the .fd is truth"');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // `write` without `path` has nowhere to write: a tool error, not a silent no-op.
  const e = call('figdown_build', { source: 'figdown 0.1 block\nnode a "A"\n', write: true });
  assert.strictEqual(e.isError, true);
  ok('build write:true without path -> isError, not a silent no-op');
}

function testDiagnostics() {
  // Three distinct failure families in one document: a stray argument, a
  // keyword the genre does not have, and a directive missing a required part.
  const BROKEN = [
    'figdown 0.1 block',
    'title "Broken"',
    'node a "A"',
    'edge a -> zzz "missing"',
    'nodee b "B"',
    'class k fill=#eee',
  ].join('\n') + '\n';

  const r = call('figdown_build', { source: BROKEN });
  const t = joined(r);
  // THE DECISION UNDER TEST: a parse failure is a normal result. It must not
  // be isError (that channel means "the tool could not run"), it must not be a
  // JSON-RPC error, and the diagnostic text must arrive whole.
  assert.notStrictEqual(r.isError, true, 'a parse failure is a RESULT, not isError');
  assert.ok(t.startsWith('PARSE FAILED'), 'the result says so unambiguously in the first line');
  assert.ok(/Line 4:/.test(t) && /Line 5:/.test(t) && /Line 6:/.test(t), 'every line number survives');
  assert.ok(t.includes('"nodee" is not allowed in genre block'), 'the reason survives verbatim');
  assert.ok(t.includes('class needs a meaning'), 'the remedy survives verbatim');
  assert.ok(t.includes('write "" to declare no meaning'), 'the full remedy text is not truncated');
  assert.ok(!t.includes('<svg'), 'no partial render is emitted');
  ok('a broken .fd -> PARSE FAILED result (not isError), 3 diagnostics verbatim with line numbers');

  const c = joined(call('figdown_check', { source: BROKEN }));
  assert.ok(c.includes('ok: false') && c.includes('1 with diagnostics'));
  assert.ok(c.includes('Line 5:'));
  ok('check reports the same diagnostics and states its file count');
}

// The OTHER error channel (spec core §8, and the 0.4 dist defect). A
// source that parses clean can still describe a drawing that states something
// it does not; the engine reports that from `render`, and until 0.4
// the `dist/` wrapper this server requires threw the channel away and handed
// back `errors: []` beside an SVG of the refused figure. So the case is not
// "does the message read well" — it is that a picture the engine refused must
// never reach a caller or a file.
function testGeometryRefusal() {
  // `b` is pinned 400x300 at the origin and `a` is placed by the engine, so
  // `a` ends up entirely inside `b` and is not drawn at all.
  const COVERED = [
    'figdown 0.1 block',
    'title "A pin that covers a node the engine placed"',
    'node a "A"',
    'node b "B"',
    'pin b at=(0,0) width=400 height=300',
    'edge a -> b',
  ].join('\n') + '\n';

  const r = call('figdown_build', { source: COVERED });
  const t = joined(r);
  assert.notStrictEqual(r.isError, true, 'a refused figure is a RESULT, not isError');
  assert.ok(t.startsWith('FIGURE REFUSED'), 'a geometry-time refusal says so, and does NOT claim a parse failure:\n' + t.slice(0, 200));
  assert.ok(!t.startsWith('PARSE FAILED'), 'the source parses clean — naming it a parse failure sends the author to the wrong line');
  assert.ok(/completely over/.test(t), 'the diagnostic text arrives verbatim');
  assert.ok(/Line 5:/.test(t), 'it names the line the author can act on — the pin');
  assert.ok(!t.includes('<svg'), 'NO SVG: the picture the engine refused must not reach the caller');
  ok('a figure refused at geometry time -> FIGURE REFUSED result, no SVG, the pin line named');

  // The sidecar must not be written either.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'figdown-mcp-geo-'));
  try {
    const fd = path.join(tmp, 'covered.fd');
    fs.writeFileSync(fd, COVERED);
    const w = joined(call('figdown_build', { path: fd, write: true }));
    assert.ok(w.startsWith('FIGURE REFUSED'), 'write:true does not change the verdict');
    assert.ok(!fs.existsSync(path.join(tmp, 'covered.svg')),
      'NO ARTIFACT ON DISK: core §8 costs a geometry error exactly what a parse error costs');
    ok('build write:true on a refused figure -> nothing written to disk');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // And the checker must agree with the builder: a check that clears a
  // document `figdown_build` then refuses is a check that lies.
  const c = joined(call('figdown_check', { source: COVERED }));
  assert.ok(c.includes('ok: false') && c.includes('1 with diagnostics'),
    'figdown_check must see the geometry channel too:\n' + c);
  assert.ok(c.includes('completely over'), 'and report the same diagnostic');
  ok('check agrees with build on a geometry-time refusal — one verdict, two tools');
}

function testCheck() {
  const r = call('figdown_check', { path: path.join(ROOT, 'examples', 'showcase') });
  const t = joined(r);
  const m = t.match(/checked (\d+) document\(s\), (\d+) clean, (\d+) with diagnostics/);
  assert.ok(m, 'check states the count: ' + t);
  const found = Number(m[1]);
  const onDisk = fs.readdirSync(path.join(ROOT, 'examples', 'showcase')).filter(f => f.endsWith('.fd')).length;
  assert.strictEqual(found, onDisk, 'check must see every .fd in the directory');
  assert.strictEqual(Number(m[3]), 0, 'the published showcase must be clean:\n' + t);
  ok('check on a directory: found all ' + found + ' .fd, 0 with diagnostics');

  const rec = joined(call('figdown_check', { path: path.join(ROOT, 'examples') }));
  const rm = rec.match(/checked (\d+) document/);
  assert.ok(Number(rm[1]) > found, 'check must RECURSE — a gate that does not recurse is a gate that lies');
  ok('check recurses: examples/ yields ' + rm[1] + ' documents, more than one directory');
}

function testRead() {
  // Multi-section: tcp-handshake.fd is a topology plus table sections, which
  // is the composition case a single-doc reader would silently drop.
  const r = call('figdown_read', { path: TCP });
  const t = joined(r);
  assert.ok(!r.isError);
  const secs = Number(t.match(/ok: true\s+(\d+) section\(s\)/)[1]);
  assert.ok(secs > 1, 'the multi-section document must report every section, got ' + secs);
  assert.ok(t.includes('figdown 0.1 topology'), 'section genre and version reported');

  const model = JSON.parse(t.slice(t.indexOf('[\n')));
  assert.strictEqual(model.length, secs);
  const topo = model[0];
  assert.ok(topo.nodes.length >= 2 && topo.edges.length >= 3, 'participants and relationships present');
  assert.ok(topo.edges.every(e => e.op && e.line), 'every edge carries its operator and its source line');
  assert.ok(topo.classes.every(c => typeof c.label === 'string'), 'every class carries its STATED meaning');
  ok('read tcp-handshake.fd: ' + secs + ' sections, ' + topo.nodes.length + ' nodes, '
    + topo.edges.length + ' edges, ' + topo.classes.length + ' classes with stated meanings');

  assert.ok(t.includes('READING CONTRACT'), 'the model never ships without the contract');
  assert.ok(t.includes('asserts NO category'), 'the empty-meaning rule travels with the model');
  assert.ok(t.includes('NEVER'), 'the never-parsable rule for description=/note= travels with the model');
  ok('read ships the reading contract with the model, not the model bare');

  // The experimental statechart: a 0.2 genre, to prove nothing here is pinned
  // to 0.1 or to the frozen genre set.
  const b = joined(call('figdown_read', { path: BFD }));
  assert.ok(b.includes('figdown 0.2 statechart'), 'reads a 0.2 experimental genre:\n' + b.slice(0, 300));
  ok('read bfd-session.fd: figdown 0.2 statechart, the experimental surface');

  // The sequence ladder, and it is not just a third genre to tick off. Its
  // model has ZERO nodes and ZERO edges — a message is an occurrence in time,
  // not an edge (SEQUENCE-ORDER-MODEL) — so a reader written against the scene collections
  // reports a fifteen-message exchange as an empty figure and looks right
  // doing it. That is the failure this case exists to catch.
  const q = call('figdown_read', { path: SEQ });
  const qt = joined(q);
  assert.ok(!q.isError);
  assert.ok(qt.includes('figdown 0.4 sequence'), 'reads a 0.4 experimental genre:\n' + qt.slice(0, 300));
  const qm = JSON.parse(qt.slice(qt.indexOf('[\n')))[0];
  assert.strictEqual(qm.nodes.length, 0, 'a ladder declares no nodes');
  assert.strictEqual(qm.edges.length, 0, 'a message is NOT an edge (SEQUENCE-ORDER-MODEL) — `edges` must stay empty');
  assert.ok(qm.lifelines.length >= 2 && qm.messages.length >= 5,
    'the ladder\'s own collections carry the figure');
  assert.ok(qm.messages.every(m => m.line), 'every message carries its source line — the order IS the model');
  assert.ok(/\[[^\]]*\d+ lifelines[^\]]*\d+ messages/.test(qt),
    'the section-shape line must NAME the ladder collections, not report "[N classes]" and nothing else');
  assert.ok(qt.includes('`sequence` SECTION'),
    'the reading contract gains the line that inverts two of its own rules for this genre');
  ok('read dhcp-lease.fd: figdown 0.4 sequence, 0 nodes, 0 edges, '
    + qm.lifelines.length + ' lifelines, ' + qm.messages.length + ' messages, shape line and contract both adapted');

  // An SVG that FigDown did not make has no meaning to recover.
  const foreign = call('figdown_read', { source: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' });
  assert.strictEqual(foreign.isError, true);
  assert.ok(/never OCR/i.test(joined(foreign)), 'refuses to guess at a foreign picture');
  ok('read a non-FigDown SVG -> isError, and says never OCR the picture');
}

function testReference() {
  const idx = joined(call('figdown_reference', {}));
  assert.ok(idx.includes('GENRES') && idx.includes('TASKS'));
  ok('reference with no arguments -> the index of genres and tasks');

  // THE DRIFT GUARD, and the reason this file is a gate. The router is parsed
  // out of SKILL.md rather than restated here, so every genre it names must
  // still resolve to a file on disk. A renamed reference file breaks here
  // instead of breaking in an agent's context as an empty answer.
  const genres = [...idx.matchAll(/^ {2}([a-z]+) +-> /gm)].map(m => m[1]);
  assert.ok(genres.length >= 7, 'the router listed only ' + genres.length + ' genres');
  // Named rather than counted: a genre lands by getting a router row, and the
  // newest one is the row most likely to be forgotten. `sequence` is checked by
  // name because a count would still pass if it were missing and a task file
  // were added in the same release.
  assert.ok(genres.includes('sequence'),
    'the router must route `sequence` — it landed; listed: ' + genres.join(', '));
  for (const g of genres) {
    for (const exp of [false, true]) {
      const r = call('figdown_reference', { name: g, experimental: exp });
      assert.notStrictEqual(r.isError, true, 'genre ' + g + ' (experimental=' + exp + '): ' + joined(r));
      const body = joined(r);
      if (body.includes('=====')) {
        for (const m of body.matchAll(/^===== (.+?) =====$/gm)) {
          assert.ok(fs.existsSync(path.join(ROOT, 'skill', 'figdown', m[1])), 'served a missing file ' + m[1]);
        }
      }
    }
  }
  ok('every one of the ' + genres.length + ' router genres resolves to files that exist (frozen and EXPERIMENTAL)');

  const reading = joined(call('figdown_reference', { name: 'reading' }));
  assert.ok(reading.includes('reference/reading.md') && reading.includes('What you MAY conclude'));
  ok('reference name:"reading" -> the reading contract in full');

  const skill = joined(call('figdown_reference', { name: 'skill' }));
  assert.ok(skill.includes('SKILL.md') && skill.includes('CLOSED'));
  ok('reference name:"skill" -> SKILL.md, which states the grammar is closed');

  // The unknown-name probe was `sequence` until 0.4, when the genre
  // landed its vocabulary and its router row and the probe started asking for
  // a file that exists. That is the hazard of naming a PLAUSIBLE absent genre:
  // it becomes present. `swimlane` is chosen instead because it is a construct
  // this project has explicitly recorded as NOT a genre — a swimlane is the
  // open question inside `flowchart`, never a header token — so the probe
  // cannot go stale the same way, and a release that made it stale would be
  // one that ought to break a test.
  const bad = call('figdown_reference', { name: 'swimlane' });
  assert.strictEqual(bad.isError, true);
  assert.ok(joined(bad).includes('Genres:'), 'an unknown name is told what does exist');
  ok('reference for a genre that does not exist -> isError naming the ones that do');
}

function testHygiene() {
  assert.strictEqual(TOOLS.length, Object.keys(HANDLERS).length, 'every declared tool needs a handler');
  for (const t of TOOLS) assert.ok(HANDLERS[t.name], 'no handler for ' + t.name);
  // No fifth engine copy: this server must reach the engine only by require.
  const src = fs.readFileSync(SERVER, 'utf8');
  assert.ok(!/const SHAPES|new Function\(/.test(src),
    'the MCP server must not embed or re-extract the engine — it requires dist/figdown.js');
  ok('no fifth engine copy: the server reaches the engine only through require(dist/figdown.js)');
}

(async () => {
  console.log('figdown-mcp test  engine=' + require(path.join(ROOT, 'dist', 'figdown.js')).version);
  await testWire();
  testBuild();
  testDiagnostics();
  testGeometryRefusal();
  testCheck();
  testRead();
  testReference();
  testHygiene();
  console.log('\nOK  ' + n + ' assertion groups passed');
})().catch(e => {
  console.error('\nFAIL  ' + (e && e.message ? e.message : e));
  if (e && e.stack) console.error(e.stack.split('\n').slice(1, 4).join('\n'));
  process.exit(1);
});
