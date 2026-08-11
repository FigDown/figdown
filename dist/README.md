# FigDown embeddable library

Generated builds — do not edit; regenerate with `node tools/make-lib.js`
(single engine source: `editor/figdown.html`).

- `figdown.mjs` — ESM
- `figdown.js` — UMD (CommonJS `require` or script tag → `globalThis.figdown`)

No dependencies, no DOM needed; works in Node and browsers.

## API

- `parse(text)` → `{ doc, errors }` — `errors` is an array of
  `"Line N: message"` strings (empty on success).
- `render(text)` → `{ svg, errors }` — `svg` is `null` whenever there are
  errors (determinism over convenience: no partial renders).
- `renderDoc(doc)` → SVG string, for an already-validated `doc` from `parse`.
- `artifact(text)` → `{ svg, errors }` — the self-carrying artifact: the
  rendered SVG plus a
  `<metadata id="figdown-source" data-sha256="…" data-engine-version="…">`
  block embedding the source text, the SHA-256 **of that source**, and the
  version string of the engine that rendered it — the same convention as
  `tools/build-svg.js` (spec core §7). Synchronous and dependency-free
  (bundled minimal SHA-256). `svg` is `null` on errors.
- `version` — the **release version** of the engine in this build, the string
  the artifact records in `data-engine-version` (spec core §13.0); reproducing
  an artifact needs both it and the source (`RENDERING-DETERMINISM`).

## The version numbers, and which is which

Spec core §13.0 defines **two** version numbers, and neither of them is a
property of this directory:

- **`figdown X.Y`** versions the **language**. It is written in the `figdown`
  header line of a `.fd` document and nowhere else. No API here returns it.
- **`vX.Y.Z`** versions the **release** — this repository and its engine. It
  is written in the git tag, in `package.json`, and in the
  `data-engine-version` attribute of every artifact. `require('figdown').version`
  returns that string.

So the two strings a consumer can see — `require('figdown').version` and
`package.json`'s `"version"` — are **the same number**, and until `v0.1.0` is
tagged they are two different *pre-release spellings* of it: the engine
carries the dated pre-release increment it was built from, and `package.json`
carries the **npm pin** that names one published tarball, spelled
`X.Y.Z-rc.N` while the release is a candidate. They converge at `v0.1.0`. The
pin itself is **not restated here** — read it from `package.json`, which is
its one home: a version burned on npm can never be republished, so the pin
advances on every publish whether or not the engine moved, and a copy of it in
prose is stale by the next one.
`make-lib.js` reads the engine version out of the engine region, so there is
no second copy of it to keep in step; the npm pin is edited by hand, and only
when a release is published.

## This directory is GATED

`node tools/dist-check.js --strict` (`npm run gate:dist`) requires that
regenerating these files is a byte-level no-op, that both builds report the
engine's own version, that both load and produce identical SVG, and that every
published `.fd` parses through `dist/figdown.js` with the same error set as the
reference engine. Until this release nothing in the repository read `dist/` at
all, and a published tarball shipped a build of an older engine that rejected
`index=` — a frozen key — and refused `examples/srh.fd`. Run the gate before
publishing.

## Integration example

```js
// ESM
import { render, artifact } from './figdown.mjs';
const { svg, errors } = render(source);
if (errors.length) console.error(errors.join('\n'));
else element.innerHTML = svg;

// To save a file that carries its own source (round-trippable):
const art = artifact(source).svg;
```

```html
<!-- UMD script tag / CDN -->
<script src="figdown.js"></script>
<script>
  const { svg, errors } = figdown.render(source);
</script>
```
