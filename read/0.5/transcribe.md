# Transcribing an existing figure

## Source fidelity first — identify the format before you start

Never reach for vision when the structure is already in the file. Three
tiers, and you state which one you used in the provenance comment:

| Tier | Sources | Method |
|---|---|---|
| 1 | semantic graph — `.vsdx`, draw.io | extract nodes, edges and labels **structurally**. No vision |
| 2 | vector — SVG, EMF, vector PDF | extract all text and geometry structurally; infer topology from the geometry; vision only for the residue |
| 3 | raster | vision is the **last resort**, and everything it produces must be verified |

## Reconstruct the meaning, do not trace the drawing

Recover what the original *means*, then state that in FigDown. Measured, so
that the temptation has a number beside it: of 216 question-labelled nodes in
the production corpus, **78% are diamonds, 14% ellipses and 8% carry no shape
at all** — a source's diamond is not evidence of a decision, its question is.

- **Verify every bitfield row's width sum against the original ruler.**
- **Never fabricate.** Mark every uncertainty in a `#` comment for human
  review rather than filling the gap with a plausible guess.
- **Record provenance** in comments at the top of the `.fd`: original
  filename, hash, the spec section or document it came from, and the tier.
- **Colours that classify become classes.** One `class` per category, joined
  with `class=`. A bare `fill=` carrying unstated meaning loses that meaning
  the moment anyone reads the text instead of the picture.
- **Conditional encodings** go in `description="valid when …"` — which draws
  no ink beyond a tooltip, so if a human must see the condition, put it in
  the label too.
- **Composite originals split.** One `.fd` per concept; the Markdown around
  them composes the page. A single figure trying to be four figures is
  harder to edit and harder to read.
- **Dense per-element data belongs in a table**, not in per-node
  annotations. Annotate the nodes only when the adjacency itself carries the
  meaning.
- **Declare a closed-world reading.** If the original's meaning depends on what
  is NOT drawn — a topology where an unlisted connection is *forbidden* rather
  than merely absent — say so explicitly and state every prohibition in a table
  or a note. Absence leaves no trace in the syntax, so no tool can catch this
  one and no reader can recover it.

## Originals outside FigDown's scope

Charts with continuous data, electrical schematics, photographs: keep the
raster, and **always** add a table or prose alongside it that encodes the
figure's knowledge in machine-readable text. A reader must be able to recover
the meaning without rendering the image. This is not optional.
