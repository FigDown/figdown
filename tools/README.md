# FigDown tools

See also `../conformance/` — the v0.1 parser-conformance suite (golden fixtures + runner: `node conformance/run.js`).

- `build-svg.js` — the sidecar generator: `node tools/build-svg.js
  <file.fd | dir> ...` validates and renders deterministically
  (`X.fd → X.svg`, source + SHA-256 embedded). Engine lookup order:
  `$FIGDOWN_HTML`, a co-located `figdown.html`, `../editor/figdown.html`.
- `layout-lint.js` — render-quality linter for scene figures (see below).
- `make-skill.js` — regenerates the self-contained agent-skill bundle
  in `skill/figdown/` from the single engine source. Run after any
  engine change.
- `make-lib.js` — regenerates the embeddable library builds in `dist/`
  (`figdown.mjs` ESM + `figdown.js` UMD; API: `parse`, `render`,
  `renderDoc`, `artifact`, `version` — see `dist/README.md`) from the
  single engine source. Deterministic (same engine → byte-identical
  files). Run after any engine change; the library version constant
  lives at the top of the script.

## layout-lint.js

Checks rendered scene figures for layout defects.

```
node tools/layout-lint.js [--max-score=N] [<file.fd | dir> ...]
```

Default paths when none are given: `examples/`, `examples/patterns/`,
`figures/` (resolved from the current working directory).

**Columns in the report:**

| column | meaning |
|--------|---------|
| `nodes` / `edges` | node and edge counts extracted from the SVG |
| `cross` | true edge-edge segment crossings (shared endpoints and T-junctions excluded) |
| `thru` | edges passing through node rectangles they are not incident to |
| `novlp` | peer node-node rectangle overlaps (group containers excluded) |
| `lblcol` | edge-label bounding-box collisions (estimated: chars × 6.5 px wide, 12 px tall) |
| `coinc` | distinct edge pairs whose segments overlap collinearly for > 10 px |
| `ink/e` | total edge path length ÷ edge count |
| `score` | weighted sum: cross×2 + thru×3 + novlp×3 + lblcol×2 + coinc×2 |

Figures with no nodes and no edges are skipped silently.  
The table is sorted worst-first by `score`.  
`--max-score=N` sets a threshold: the process exits 1 if any figure exceeds it;
without the flag the tool always exits 0 (report-only mode).

Engine lookup order is the same as `build-svg.js`:
`$FIGDOWN_HTML`, a co-located `figdown.html`, `../editor/figdown.html`.
If a render throws an error the figure is retried once after 30 s; persistent
failures are reported and the figure is skipped.

## Ingesting a Word-document corpus (docx → figures → .fd)

The pipeline proven on real spec corpora (field feedback F6):

1. **Extract images** — a `.docx` is a zip; the figures live in
   `word/media/`:

   ```sh
   unzip -o spec.docx 'word/media/*' -d extracted/
   ```

2. **Convert EMF/WMF** — in real corpora the majority of figures are
   Windows metafiles, which neither browsers nor agents can read.
   Convert them first:

   ```sh
   libreoffice --headless --convert-to png extracted/word/media/*.emf --outdir viewable/
   ```

3. **Transcribe** — follow the AGENT-GUIDE section *Transcribing
   existing figures*: semantic reconstruction (not tracing), bit-width
   verification, no fabrication, provenance comments in the `.fd`.

4. **Validate** — `node tools/build-svg.js <file.fd>` until OK; embed
   the SVG in the target `.md` with the `source:` footer; commit the
   `.fd` and `.svg` together.
