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
  rendered SVG plus a `<metadata id="figdown-source" data-sha256="…">`
  block embedding the source text and its SHA-256, the same convention as
  `tools/build-svg.js`. Synchronous and dependency-free (bundled minimal
  SHA-256). `svg` is `null` on errors.
- `version` — the spec draft version this build implements.

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
