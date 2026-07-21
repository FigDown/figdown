# FigDown Agent Guide (v0.1 draft)

> Audience: **AI agents** asked to create or maintain figures in
> Markdown documentation using FigDown. This file is self-contained —
> a fresh session pointed here can start working. Full normative
> details live in [syntax-draft.md](spec/syntax-draft.md); version changes
> in [MIGRATIONS.md](spec/MIGRATIONS.md).
>
> 繁體中文版：[AGENT-GUIDE.zh-tw.md](AGENT-GUIDE.zh-tw.md)

## 1. The model

A figure lives as a `.fd` text file — the **single source of truth**.
Think of it as HTML+CSS in one small file: the structure and relations
(nodes, edges, groups, tables, fields) are the content; `pin`/`size`/
`color` lines are presentation parameters whose only job is to keep the
rendered picture **stable** (same source → same SVG, bit-level; small
edit → small visual change). The SVG is a deterministic projection for
human eyes; it also embeds its own source and a SHA-256 of it
(`<metadata id="figdown-source">`).

## 2. Reading rule (how to understand a figure)

- To learn what a figure **means**, read its `.fd` — never OCR the SVG.
- In a Markdown doc, each figure is an embedded SVG with a footer line
  pointing at its `.fd` (see §3). Follow that path.
- If the `.fd` is missing, recover the source from the SVG's embedded
  metadata; if the embedded SHA-256 does not match the recovered text,
  the artifact was edited after generation — treat the `.fd` as truth
  and regenerate.
- **You may stop at the layout marker** (R43): everything from the
  first `# --- layout` comment down is rendering-only
  (`pin`/`size`/`route`/`routing`) and carries no meaning — skip it
  when reading for semantics.
- **Meaning is derived from the syntax alone, never from drawing
  geometry** (R37). The rules per block:
  - *bitfield*: field *k*'s bit offset = the sum of all earlier
    declared widths; there is **no implicit padding** (real padding is
    always an explicit field); `wrap` only breaks the drawing row —
    blank cells after it are not bits; `numbering=` changes ruler
    labels only; offsets after an `optional` field hold only when it
    is present.
  - *table*: the logical grid = the pipe rows plus `^^`/`||` merges
    (anchored top-left); `colw`, colors and alignment never change it.
  - *wave*: tick *t* = the *t*-th lane character, `.` continues the
    previous value; ticks stay contiguous across a `gap`.

## 3. Embedding convention for Markdown docs (current stage)

Until `.fd` is natively rendered by Markdown viewers (as mermaid is),
the project's recommended usage is:

```markdown
![Ingress datapath](figures/ingress.svg)

<sub>source: [figures/ingress.fd](figures/ingress.fd)</sub>
```

- Embed **the SVG only**; never paste `.fd` content into the `.md`.
- Always add the `source:` footer with the `.fd` path — that file is
  the figure's origin and the AI-readable meaning.
- Keep `X.fd` and `X.svg` side by side with the same basename.

## 4. Maintenance workflow

1. Edit the `.fd` (never the SVG).
2. Rebuild: `node tools/build-svg.js <file.fd>` — this validates and
   renders. Errors come as `Line N: message`; fix and rerun until OK.
   Titles are NOT drawn by default (the Markdown supplies the
   caption). For a standalone artifact that should carry its visible
   name, build with `--with-title` (recorded in the artifact).
3. Commit the `.fd` and `.svg` together.

Stability rules while editing:
- Explicit values (`pin`, `size`, `color`) are rigid — the renderer
  arranges everything else around them. Touch only what you mean to
  change.
- Editor-materialized layout lives in a trailing
  `# --- layout ... ---` section; the structure above it is complete
  on its own (deleting every `pin`/`size` line must leave the same
  structure — that is a spec invariant).
- State the semantics at the right scope: a config shared by all
  columns is one group-level `line`/`fill`; per-element facts attach
  per node. The renderer may draw both the same — the text difference
  is the knowledge.

## 5. Transcribing existing figures (from a spec/image original)

Transcription is **semantic reconstruction, not tracing**: recover
what the original *means*, then state that meaning in FigDown — never
copy geometry for its own sake.

- **Verify bit totals.** For every bitfield row, sum the declared
  widths against the original's ruler — multi-row encoding-variant
  figures are where transcriptions silently drift.
- **Never fabricate.** If the original is ambiguous or unreadable, do
  not invent fields, bits or connections — mark the uncertainty in a
  `#` comment and flag it for human review.
- **Record provenance.** Put the original figure's filename, content
  hash, and spec section anchor in `#` comments at the top of the
  `.fd` — the transcription stays auditable.
- **Per-node annotations**: if spatial adjacency carries meaning, use
  a small `style=dashed` node next to the target with a dotted edge;
  if it is dense tabular data, one centralized `table` is the better
  transcription. Choose by meaning (R29) — both are sanctioned.
- **Semantic colors → classes.** When the original distinguishes
  categories by color/line style (56% of corpus figures do), declare a
  `class` per category and join elements with `class=` — never leave
  bare `color=` carrying unstated meaning.
- **Conditional encodings** (same bits reinterpreted by a mode):
  current convention is `note="valid when …"` on the field plus a
  human-review flag (OQ-S9 tracks a first-class construct).
- **Composite originals** (two concept areas in one image): split
  into one `.fd` per concept; the Markdown document composes them.
- Templates never restrict expressiveness: directed, colored edges
  work under `topology` exactly as under `block`.

## 6. Core syntax cheat sheet

```figdown
figdown 0.1 <template>      # REQUIRED first line; template ∈
                            # block|topology|flowchart|bitfield|table|wave
title "..."                 # optional, takes the rest of the line;
                            # escapes in quotes: \n \" \\ only

# core scene (block / topology / flowchart)
node a "Label" [shape=rounded|circle|ellipse|cloud|diamond|cylinder]
               [color=#hex] [style=dashed] [in=<group>]
group g "Label" [gap=0]     # container; gap=0 packs members flush
edge a -> b [style=dashed] [color=#hex]  # ops: -> <- -- <->
edge a -[label]-> b         # on-line label splits the operator
edge a [p1] -- [p2] b       # endpoint labels (ports/cardinality/roles)
                            # [flags[3:0]] nests; ["..."] for \n or
                            # unbalanced brackets (string escapes apply)
flow right|down             # layout direction
rank a b c                  # same row/column
pin a at=x,y                # absolute px; group members are group-local
size a w=120 h=60
routing orthogonal          # straight edges draw as right-angle elbows
route c -> a via=x,y;x,y    # rigid waypoints for ONE edge (as written);
                            # routing/route are presentation-only and go
                            # in the trailing # --- layout --- section,
                            # never on the edge line itself
line "Cap" in=g at=80%      # threshold marker across a group
fill 15% in=g color=#hex    # zone band; fill 15-35% = explicit range;
                            # dir=up|down|left|right (default up)
bundle b1 "LAG" a--c, b--c  # link bundle: dashed ring drawn automatically
class vidp "VID_P flow" color=#hex [style=dashed]  # semantic class:
edge a -> b class=vidp      # meaning+style once; legend derives;
                            # also on node/group/field/cell marks

# bitfield (packet headers lsb0-default; use numbering=msb0 for RFC style)
bitfield x "Title" unit=32 [numbering=msb0]
field Name 16 [optional] [color=#hex] [note="..."]
field a:1, b:2, Long Name:16     # compact; * width = fill rest of row
field Marker 128                 # wider than unit → spans rows automatically
                                 # (ONE field — never split it by hand)
wrap                             # only for an explicit mid-row break

# table (verbatim GFM; ^^ rowspan, || colspan, \| literal pipe)
table t "Title"
| A | B |
|---|:-:|
| 1 | 2 |
colw auto 25%                # optional column widths (auto | px | %)
cell 1,2 color=#hex          # data rows 1-based; header tiers h1..hN top-down
cell h1,1 color=#hex         # never annotate a merged-away cell — use the anchor
cell 1 highlight
plot t level=40              # EXPERIMENTAL: X-Y-Z bars from numeric cells

# wave (WaveDrom-style lanes; p clock, 0/1, x undef, = data, . continue)
wave w "Title"
signal clk pppppppp
signal d   x.==..x. labels="A,B"
```

Grammar is CLOSED: any unknown line/keyword/option is an error with a
1-based line number. Do not invent syntax — if something seems missing,
express it with the constructs above or flag it to the maintainer.
The header template only picks *defaults* — it never restricts which
directives are valid. `flow` is document-level. Ids (`node a`,
`bitfield x`, `table t`) are required and exist only for reference.

## 7. Versioning

The header pins the version (`figdown 0.1`). When the spec moves, each
change ships a mechanical rewrite rule in
[MIGRATIONS.md](spec/MIGRATIONS.md); upgrade a document by applying the
entries in order. Never silently mix syntax generations in one file.
