#!/usr/bin/env node
'use strict';
// FigDown companion service in Kroki style. Dependency-free (node:http,
// node:zlib and the generated dist build only).
//
//   POST /figdown/svg                      body = FigDown source (text)
//   GET  /figdown/svg/<deflate+base64url>  Kroki wire format:
//        raw-deflate the source, then base64url-encode it
//   GET  /health                           -> 200 "ok"
//
// Success -> 200 image/svg+xml: the self-carrying artifact (SVG with the
// source and its SHA-256 embedded). Parse errors -> 400 text/plain, one
// "Line N: message" per line. PORT env selects the port (default 8006).
const http = require('node:http');
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

// Engine lookup: a co-located copy (the Docker layout), then the
// repository layout. Regenerate with `node tools/make-lib.js`.
const LIB = [
  path.join(__dirname, 'figdown.js'),
  path.join(__dirname, '..', '..', 'dist', 'figdown.js'),
].find(p => fs.existsSync(p));
if (!LIB) {
  console.error('dist/figdown.js not found — run: node tools/make-lib.js');
  process.exit(1);
}
const figdown = require(LIB);

function reply(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(body);
}

function renderReply(res, source) {
  const { svg, errors } = figdown.artifact(source);
  if (errors.length) return reply(res, 400, 'text/plain', errors.join('\n') + '\n');
  reply(res, 200, 'image/svg+xml', svg);
}

function decodeKroki(encoded) {
  // Kroki wire format: deflate (raw, RFC 1951) then base64url.
  const buf = Buffer.from(encoded, 'base64url');
  return zlib.inflateRawSync(buf).toString('utf8');
}

function createServer() {
  return http.createServer((req, res) => {
    try {
      const url = req.url.split('?')[0];
      if (req.method === 'GET' && url === '/health') {
        return reply(res, 200, 'text/plain', 'ok\n');
      }
      if (req.method === 'POST' && url === '/figdown/svg') {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          try { renderReply(res, Buffer.concat(chunks).toString('utf8')); }
          catch (e) { reply(res, 400, 'text/plain', 'bad request: ' + e.message + '\n'); }
        });
        return;
      }
      const m = req.method === 'GET' && url.match(/^\/figdown\/svg\/([A-Za-z0-9_=-]+)$/);
      if (m) {
        let source;
        try { source = decodeKroki(m[1]); }
        catch (e) { return reply(res, 400, 'text/plain', 'bad encoded source: ' + e.message + '\n'); }
        return renderReply(res, source);
      }
      reply(res, 404, 'text/plain', 'not found\n');
    } catch (e) {
      reply(res, 500, 'text/plain', 'internal error: ' + e.message + '\n');
    }
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 8006;
  createServer().listen(port, () => {
    console.log('figdown ' + figdown.version + ' listening on :' + port);
  });
}
