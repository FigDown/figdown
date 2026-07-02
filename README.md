# FigDown

> **Figures as text — one source, two readers.**

繁體中文版：[README.zh-tw.md](README.zh-tw.md)

FigDown is an (early, in-design) open standard for describing figures as
plain text inside Markdown — so that the *same* source is:

- **read as text by AI agents** — the knowledge in your diagrams stops
  being locked inside bitmaps, and
- **rendered as figures for humans** — deterministically converted to SVG
  that travels with the document, viewable in any Markdown viewer.

Think "the figure layer of Markdown": what Mermaid did for flowcharts,
extended to the diagram types Mermaid can't express (network topologies,
annotated block diagrams, lookup chains, packet walks…), with layout
treated as part of the knowledge.

## Why

Technical documents are full of figures whose *layout carries meaning* —
rank, zones, direction, adjacency. Today that knowledge is trapped in
images: AI agents can't reliably read it, and hand-maintained diagrams
drift from the text around them. Existing text-to-diagram tools cover only
part of the problem and none of them promise the property we consider
essential: **a small edit to the source must produce a small change in the
figure** — never a full re-layout that destroys the reader's mental map.

## Design axioms (settled so far)

1. **Text is the single source of truth.** Figures are build artifacts,
   100% generated from text. No dual maintenance, ever.
2. **Deterministic, program-only rendering.** Same source → same SVG,
   bit-level; no LLM in the rendering path.
3. **Layout stability.** Local edit → local change. Explicitly declared
   attributes (position, size, color…) are rigid; everything undeclared
   adapts automatically with minimal spillover.
4. **Two audiences, one artifact.** AI reads the fenced source block;
   humans see the embedded SVG. The standard defines how the two stay
   paired and in sync.
5. **Defaults = the common case.** Most figures should need no
   supplementary declarations at all (convention over configuration).
6. **Small, closed, token-lean core.** Every line starts with a known
   keyword; unknown lines are errors with line numbers (this powers the
   AI write→validate→fix loop). Teaching the language to an AI agent must
   fit in a lean prompt. Generic rules over special cases; survey existing
   standards before inventing anything.
7. **An editor is mandatory, but every GUI action is a text edit** —
   dragging a node writes a position declaration. The GUI never owns state
   that the text can't express.
8. **Static first; dynamic later.** Dynamic = static + a discrete
   page/step sequence (for algorithm/protocol walkthroughs), not a
   timeline animation language.

## Status

**Requirements & design phase.** Nothing to install yet. Current documents:

- [requirements-notes.md](requirements-notes.md) — the requirements log
  (R0–R13) and decisions (D1–D3), also in
  [繁體中文](requirements-notes.zh-tw.md)

Prior art feeding this design: **ProtoFlow**, a protocol-animation DSL
with a single-file engine/editor (to be published separately), where the
axioms above were first proven end-to-end.

## Contributing

Ideas, counter-examples, and prior-art pointers are very welcome — please
open an issue. The most valuable contributions right now:

- diagram types we must cover (with real samples),
- existing standards/conventions we should borrow instead of invent,
- attacks on the axioms above (tell us where they break).
