#!/usr/bin/env node
'use strict';
// FigDown companion service in Kroki style. Dependency-free (node:http,
// node:zlib and the generated dist build only).
//
//   POST /figdown/svg                      body = FigDown source (text)
//   GET  /figdown/svg/<deflate+base64url>  Kroki wire format:
//        zlib-deflate the source, then base64url-encode it (raw deflate
//        is also read)
//   GET  /health                           -> 200 "ok"
//
// Success -> 200 image/svg+xml: the self-carrying artifact (SVG with the
// source and its SHA-256 embedded). Parse errors -> 400 text/plain, one
// "Line N: message" per line. PORT env selects the port (default 8006).
//
// Limits (core §15.5: a consumer that renders untrusted source on request
// MUST impose its own; the engine imposes none). Each has an env override:
//   FIGDOWN_MAX_SOURCE_BYTES   256 KiB  body, and the inflated GET source -> 413
//   FIGDOWN_MAX_OUTPUT_BYTES   8 MiB    the rendered artifact              -> 413
//   FIGDOWN_RENDER_TIMEOUT_MS  10000    wall clock of one render           -> 503
//   FIGDOWN_RENDER_HEAP_MB     512      heap of one render                 -> 503
// Each render runs in its own worker thread, so a slow or huge figure is
// terminated without stalling or killing the service.
const http = require('node:http');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
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

// Worker side: render one source, report the artifact or its size.
if (!isMainThread) {
  const { source, maxOutput } = workerData;
  const { svg, errors } = figdown.artifact(source);
  const bytes = errors.length ? 0 : Buffer.byteLength(svg, 'utf8');
  parentPort.postMessage(bytes > maxOutput ? { errors, tooBig: bytes } : { svg, errors });
  return;
}

function envInt(name, dflt) {
  const v = Number(process.env[name]);
  return Number.isInteger(v) && v > 0 ? v : dflt;
}
const DEFAULT_LIMITS = {
  maxSource: envInt('FIGDOWN_MAX_SOURCE_BYTES', 256 * 1024),
  maxOutput: envInt('FIGDOWN_MAX_OUTPUT_BYTES', 8 * 1024 * 1024),
  timeoutMs: envInt('FIGDOWN_RENDER_TIMEOUT_MS', 10000),
  heapMb: envInt('FIGDOWN_RENDER_HEAP_MB', 512),
};

function reply(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(body);
}

function renderReply(res, source, lim) {
  let done = false;
  const finish = (code, type, body) => {
    if (done) return;
    done = true; clearTimeout(timer); worker.terminate();
    reply(res, code, type, body);
  };
  const worker = new Worker(__filename, {
    workerData: { source, maxOutput: lim.maxOutput },
    resourceLimits: { maxOldGenerationSizeMb: lim.heapMb },
  });
  const timer = setTimeout(() => finish(503, 'text/plain',
    'render exceeded ' + lim.timeoutMs + ' ms\n'), lim.timeoutMs);
  worker.on('message', ({ svg, errors, tooBig }) => {
    if (errors.length) return finish(400, 'text/plain', errors.join('\n') + '\n');
    if (tooBig) return finish(413, 'text/plain',
      'rendered artifact is ' + tooBig + ' bytes, over the ' + lim.maxOutput + '-byte limit\n');
    finish(200, 'image/svg+xml', svg);
  });
  worker.on('error', e => finish(503, 'text/plain', 'render failed: ' + e.message + '\n'));
  worker.on('exit', () => finish(503, 'text/plain', 'render failed: worker exited\n'));
}

function decodeKroki(encoded, maxSource) {
  // Kroki wire format: zlib-wrapped deflate (RFC 1950), then base64url.
  // Raw deflate (RFC 1951), which this service documented first, is still
  // read: a stream whose first two bytes are a valid zlib header is tried
  // as zlib, and anything else, or a zlib attempt that fails, as raw. Both
  // inflates are capped, so a small request cannot expand without bound.
  const buf = Buffer.from(encoded, 'base64url');
  const cap = { maxOutputLength: maxSource };
  const zlibHeader = buf.length >= 2 && (buf[0] & 0x0f) === 8 && (buf[0] >> 4) <= 7 &&
    ((buf[0] << 8) | buf[1]) % 31 === 0;
  if (zlibHeader) {
    try { return zlib.inflateSync(buf, cap).toString('utf8'); }
    catch (e) { if (e.code === 'ERR_BUFFER_TOO_LARGE') throw e; }
  }
  return zlib.inflateRawSync(buf, cap).toString('utf8');
}

function createServer(limits) {
  const lim = Object.assign({}, DEFAULT_LIMITS, limits);
  const tooLarge = res => reply(res, 413, 'text/plain',
    'source is over the ' + lim.maxSource + '-byte limit\n');
  return http.createServer((req, res) => {
    try {
      const url = req.url.split('?')[0];
      if (req.method === 'GET' && url === '/health') {
        return reply(res, 200, 'text/plain', 'ok\n');
      }
      if (req.method === 'POST' && url === '/figdown/svg') {
        const chunks = [];
        let size = 0, over = false;
        req.on('data', c => {
          if (over) return;
          size += c.length;
          if (size > lim.maxSource) {
            over = true;
            res.setHeader('Connection', 'close');
            res.on('finish', () => req.destroy());
            return tooLarge(res);
          }
          chunks.push(c);
        });
        req.on('end', () => {
          if (over) return;
          try { renderReply(res, Buffer.concat(chunks).toString('utf8'), lim); }
          catch (e) { reply(res, 400, 'text/plain', 'bad request: ' + e.message + '\n'); }
        });
        return;
      }
      const m = req.method === 'GET' && url.match(/^\/figdown\/svg\/([A-Za-z0-9_=-]+)$/);
      if (m) {
        let source;
        try { source = decodeKroki(m[1], lim.maxSource); }
        catch (e) {
          if (e.code === 'ERR_BUFFER_TOO_LARGE') return tooLarge(res);
          return reply(res, 400, 'text/plain', 'bad encoded source: ' + e.message + '\n');
        }
        return renderReply(res, source, lim);
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
