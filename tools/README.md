# FigDown tools

- `build-svg.js` — the sidecar generator: `node tools/build-svg.js
  <file.fd | dir> ...` validates and renders deterministically
  (`X.fd → X.svg`, source + SHA-256 embedded). Engine lookup order:
  `$FIGDOWN_HTML`, a co-located `figdown.html`, `../editor/figdown.html`.
- `make-skill.js` — regenerates the self-contained agent-skill bundle
  in `skill/figdown/` from the single engine source. Run after any
  engine change.

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
