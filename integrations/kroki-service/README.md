# figdown Kroki-companion service

A dependency-free HTTP service that renders FigDown to SVG, in the style
of [Kroki](https://kroki.io/)'s companion containers. The long-term goal
is upstreaming FigDown into Kroki proper; this service already speaks
Kroki's wire format so it can sit behind a Kroki gateway today.

## Run

```sh
node tools/make-lib.js                      # regenerate dist/ first
node integrations/kroki-service/server.js   # listens on :8006 (PORT env to change)
```

Or with Docker (build from the repository root):

```sh
docker build -f integrations/kroki-service/Dockerfile -t figdown-kroki .
docker run -p 8006:8006 figdown-kroki
```

## Endpoints

- `POST /figdown/svg` — body is the FigDown source; returns
  `image/svg+xml` on success.
- `GET /figdown/svg/<encoded>` — Kroki wire format: the source is
  deflated with a zlib wrapper (RFC 1950), as Kroki itself encodes, and
  base64url-encoded. Example encoder:

  ```js
  const enc = require('node:zlib').deflateSync(source).toString('base64url');
  ```

  Raw deflate (RFC 1951, `deflateRawSync`), which earlier versions of this
  README showed, is still read: a stream is tried as zlib when its first
  two bytes are a valid zlib header, and as raw otherwise or when that
  fails.

- `GET /health` — `200 ok`.

Responses are the **self-carrying artifact**: the SVG embeds its own
source, a SHA-256 of that source, and the version of the engine that
rendered it, in a
`<metadata id="figdown-source" data-sha256="…" data-engine-version="…">`
block, so the figure remains round-trippable/editable and a rendering can
be reproduced or explained. Parse errors return
`400 text/plain` with one `Line N: message` per line — the same messages
the editor and CLI produce.

## Limits

FigDown sets no resource limits of its own, and core §15.5 says a service
that renders untrusted source on request MUST impose them. This one does,
and each limit has an environment override:

| variable | default | when exceeded |
|---|---|---|
| `FIGDOWN_MAX_SOURCE_BYTES` | 262144 (256 KiB) | `413`: a POST body, or a GET source after inflating |
| `FIGDOWN_MAX_OUTPUT_BYTES` | 8388608 (8 MiB) | `413`: the rendered artifact |
| `FIGDOWN_RENDER_TIMEOUT_MS` | 10000 | `503`: the render is stopped |
| `FIGDOWN_RENDER_HEAP_MB` | 512 | `503`: the render is stopped |

Each render runs in its own worker thread, so a stopped render does not
stall or crash the service. The worker costs about 90 ms per request.
Concurrency is not limited here: each render in flight may use up to
`FIGDOWN_RENDER_HEAP_MB`, so cap concurrent requests at the proxy or
container.

## Test

```sh
node integrations/kroki-service/test.js
```
