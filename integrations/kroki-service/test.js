#!/usr/bin/env node
'use strict';
// Test for the figdown Kroki-companion service: ephemeral port, POST valid
// and invalid docs, and the GET deflate+base64url (Kroki wire format) path.
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

    // GET Kroki wire format: deflateRaw + base64url
    const enc = zlib.deflateRawSync(Buffer.from(VALID, 'utf8')).toString('base64url');
    const got = await request(port, 'GET', '/figdown/svg/' + enc);
    assert.strictEqual(got.status, 200);
    assert(got.body.startsWith('<svg'), 'GET path renders SVG');
    assert.strictEqual(got.body, ok.body, 'GET and POST render byte-identically');

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
}

main().catch(e => { console.error(e); process.exit(1); });
