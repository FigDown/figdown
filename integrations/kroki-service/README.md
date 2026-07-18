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
  raw-deflated (RFC 1951) and base64url-encoded. Example encoder:

  ```js
  const enc = require('node:zlib').deflateRawSync(source).toString('base64url');
  ```

- `GET /health` — `200 ok`.

Responses are the **self-carrying artifact**: the SVG embeds its own
source and a SHA-256 of it in a `<metadata id="figdown-source">` block,
so the figure remains round-trippable/editable. Parse errors return
`400 text/plain` with one `Line N: message` per line — the same messages
the editor and CLI produce.

## Test

```sh
node integrations/kroki-service/test.js
```
