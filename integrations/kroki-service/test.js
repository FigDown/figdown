#!/usr/bin/env node
'use strict';
// Test for the figdown Kroki-companion service: ephemeral port, POST valid
// and invalid docs, and the GET deflate+base64url path in both the Kroki
// (zlib) and the raw-deflate encodings.
const assert = require('assert');
const http = require('node:http');
const zlib = require('node:zlib');
const { createServer } = require('./server.js');

const VALID = 'figdown 0.1 topology\nnode a "Alpha"\nnode b "Beta"\nedge a -- b\n';
const INVALID = 'figdown 0.1 topology\nbogus line here\nnode a "Alpha"\n';

function request(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: urlPath }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        type: res.headers['content-type'] || '',
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

async function main() {
  const server = createServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    // health
    const health = await request(port, 'GET', '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.trim(), 'ok');

    // POST valid -> 200 image/svg+xml, self-carrying artifact
    const ok = await request(port, 'POST', '/figdown/svg', VALID);
    assert.strictEqual(ok.status, 200);
    assert(ok.type.startsWith('image/svg+xml'), 'content-type is svg');
    assert(ok.body.startsWith('<svg'), 'body is SVG');
    assert(ok.body.includes('figdown-source') && ok.body.includes('data-sha256='),
      'artifact embeds source + sha');

    // POST invalid -> 400 text/plain with Line N messages
    const bad = await request(port, 'POST', '/figdown/svg', INVALID);
    assert.strictEqual(bad.status, 400);
    assert(bad.type.startsWith('text/plain'));
    assert(/^Line 2: /m.test(bad.body), '400 body lists Line N errors');
    assert(!bad.body.includes('<svg'), 'no SVG on error');

    // GET raw deflate + base64url (the encoding this service documented first)
    const enc = zlib.deflateRawSync(Buffer.from(VALID, 'utf8')).toString('base64url');
    const got = await request(port, 'GET', '/figdown/svg/' + enc);
    assert.strictEqual(got.status, 200);
    assert(got.body.startsWith('<svg'), 'GET path renders SVG');
    assert.strictEqual(got.body, ok.body, 'GET and POST render byte-identically');

    // GET as Kroki itself encodes: zlib-wrapped deflate (RFC 1950)
    const zenc = zlib.deflateSync(Buffer.from(VALID, 'utf8'), { level: 9 }).toString('base64url');
    const zgot = await request(port, 'GET', '/figdown/svg/' + zenc);
    assert.strictEqual(zgot.status, 200, 'zlib-encoded GET renders');
    assert.strictEqual(zgot.body, ok.body, 'zlib and raw GET render byte-identically');

    // A raw stream whose first two bytes pass the zlib header test still
    // decodes: the zlib attempt fails and the raw inflate runs. An encoder
    // practically never emits one (a raw stream would have to open with a
    // non-final stored block whose padding bit 3 is set), so it is built by
    // hand: stored block of 29 bytes (bytes 08 1D = a valid zlib header),
    // then the rest as a final stored block.
    const vb = Buffer.from(VALID, 'utf8'), head = vb.subarray(0, 29), rest = vb.subarray(29);
    const stored = (final, b) => Buffer.concat([Buffer.from([final ? 0x01 : 0x08,
      b.length & 255, b.length >> 8, ~b.length & 255, (~b.length >> 8) & 255]), b]);
    const look = Buffer.concat([stored(false, head), stored(true, rest)]);
    assert.deepStrictEqual([look[0], look[1]], [0x08, 0x1d]);
    assert.strictEqual(zlib.inflateRawSync(look).toString('utf8'), VALID);
    const lk = await request(port, 'GET', '/figdown/svg/' + look.toString('base64url'));
    assert.strictEqual(lk.status, 200, 'raw stream with a zlib-like header renders');
    assert.strictEqual(lk.body, ok.body);

    // GET with garbage encoding -> 400
    const junk = await request(port, 'GET', '/figdown/svg/not-valid-deflate');
    assert.strictEqual(junk.status, 400);

    // determinism: same source twice -> identical bytes
    const again = await request(port, 'POST', '/figdown/svg', VALID);
    assert.strictEqual(again.body, ok.body, 'render is deterministic');

    console.log('OK  kroki-service: health, POST 200/400, GET deflate path, determinism');
  } finally {
    server.close();
  }
  await limits();
}

// core §15.5: each limit answers with its status, and the service stays up.
async function limits() {
  const HEAVY = 'figdown 0.5 block\n' +
    Array.from({ length: 1500 }, (_, i) => 'node n' + i).join('\n') + '\n';
  const server = createServer({ maxSource: 4096, maxOutput: 2000, timeoutMs: 300, heapMb: 512 });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const alive = async () => assert.strictEqual((await request(port, 'GET', '/health')).status, 200);
  try {
    const big = await request(port, 'POST', '/figdown/svg', VALID + '#'.repeat(5000) + '\n');
    assert.strictEqual(big.status, 413, 'POST over the source limit');
    await alive();
    // 64 KiB of comment lines deflate to a few hundred bytes
    const bomb = zlib.deflateRawSync(Buffer.from(VALID + '#\n'.repeat(32768))).toString('base64url');
    assert(bomb.length < 1000);
    assert.strictEqual((await request(port, 'GET', '/figdown/svg/' + bomb)).status, 413, 'inflate is capped');
    await alive();
    const out = await request(port, 'POST', '/figdown/svg',
      'figdown 0.5 block\n' + Array.from({ length: 40 }, (_, i) => 'node n' + i).join('\n') + '\n');
    assert.strictEqual(out.status, 413, 'artifact over the output limit');
    assert(/over the 2000-byte limit/.test(out.body));
    await alive();
  } finally { server.close(); }
  const slow = createServer({ timeoutMs: 300 });
  await new Promise(r => slow.listen(0, '127.0.0.1', r));
  try {
    const p = slow.address().port;
    const t0 = Date.now();
    const r = await request(p, 'POST', '/figdown/svg', HEAVY);
    assert.strictEqual(r.status, 503, 'render over the time limit');
    assert(Date.now() - t0 < 3000, 'the timeout ends the request');
    assert.strictEqual((await request(p, 'GET', '/health')).status, 200);
    const ok = await request(p, 'POST', '/figdown/svg', VALID);
    assert.strictEqual(ok.status, 200, 'the service still renders after a timeout');
  } finally { slow.close(); }
  const tight = createServer({ heapMb: 4, timeoutMs: 20000 });
  await new Promise(r => tight.listen(0, '127.0.0.1', r));
  try {
    const p = tight.address().port;
    const r = await request(p, 'POST', '/figdown/svg', HEAVY);
    assert.strictEqual(r.status, 503, 'render over the heap limit');
    assert.strictEqual((await request(p, 'GET', '/health')).status, 200);
  } finally { tight.close(); }
  console.log('OK  kroki-service limits: source 413, inflate 413, output 413, timeout 503, heap 503; service stays up');
}

main().catch(e => { console.error(e); process.exit(1); });
