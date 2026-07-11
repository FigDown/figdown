---
name: figdown
description: Create and maintain documentation figures as FigDown .fd text files with deterministic SVG artifacts embedded in Markdown. Use when asked to create, edit, fix, or read diagrams/figures in docs — network topologies, block diagrams, flowcharts, protocol headers (bitfields), tables, timing waveforms — or when a .md contains an SVG with a "source: *.fd" footer.
---

# FigDown — figures as text, one source, two readers

A figure lives as a `.fd` text file (single source of truth). The SVG
is a deterministic build artifact for human eyes; **you read the `.fd`
for meaning — never OCR the SVG**. Structure (nodes, edges, fields,
rows) is the content; `pin`/`size`/`color` lines are presentation whose
only job is rendering stability.

## Workflow

1. Edit or create `X.fd` (never edit an `.svg`).
2. Build + validate: `node <this-skill-dir>/build-svg.js X.fd`
   Errors come as `Line N: message` — fix and rerun until `OK`.
3. Embed in Markdown (SVG only; never paste `.fd` content into `.md`):

   ```markdown
   ![Ingress datapath](figures/ingress.svg)

   <sub>source: [figures/ingress.fd](figures/ingress.fd)</sub>
   ```

4. Keep `X.fd` and `X.svg` side by side, same basename; commit both.

If a `.fd` is missing but its `.svg` exists, the SVG embeds its own
source and SHA-256 in `<metadata id="figdown-source">` — recover from
there; on hash mismatch, treat the `.fd` as truth and rebuild.

## Stability rules (why your edits stay small)

- Explicit `pin`/`size`/`color` are rigid; the renderer arranges the
  rest around them. Touch only what you mean to change.
- Editor-materialized layout lives under a trailing
  `# --- layout ... ---` section; the structure above it is complete
  on its own.
- State semantics at the right scope: a config shared by a whole group
  is one group-level `line`/`fill`; per-element facts attach per node.

## Reading rules (deriving meaning from syntax alone)

- *bitfield*: field *k*'s bit offset = sum of all earlier widths.
  **No implicit padding** — padding is always an explicit field.
  `wrap` only breaks the drawing row (blank cells are not bits);
  `numbering=` changes ruler labels only; offsets after an `optional`
  field hold only when it is present.
- *table*: the logical grid = the pipe rows + `^^`/`||` merges;
  `colw`/colors/alignment never change it.
- *wave*: tick *t* = the *t*-th lane character; `.` continues; ticks
  stay contiguous across a `gap`.
- Never infer meaning from drawing geometry.

## Syntax cheat sheet (grammar is CLOSED — unknown lines are errors)

```figdown
figdown 0.1 <template>      # REQUIRED first line; template ∈
                            # block|topology|flowchart|bitfield|table|wave
title Some Title            # optional; takes the rest of the line
# comments start with '#'; escapes in quotes: \n \" \\ only

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
pin a at=x,y                # px; group members are group-local
size a w=120 h=60
line "Cap" in=g at=80%      # threshold marker across a group
fill 15% in=g color=#hex    # zone band; fill 15-35% = explicit range;
                            # dir=up|down|left|right (default up)
bundle b1 "LAG" a--c, b--c  # link bundle: dashed ring drawn automatically

# bitfield (lsb0 register-style default; numbering=msb0 for RFC style)
bitfield x "Title" unit=32 [numbering=msb0]   # id required, like node ids
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

# wave (p/n clock, 0/1 levels, x undef, = data, . continue, 0-9 values)
wave w "Title"
signal clk pppppppp
signal d   x.==..x. labels="A,B"
```

Notes that save a wrong guess: the header template only picks
*defaults* — it never restricts which directives are valid (every
directive works under every template). `flow` is document-level (one
per document). Ids (`node a`, `bitfield x`, `table t`) are required
and exist only so other lines can reference them.

Do not invent syntax — if something seems missing, compose it from the
constructs above or tell the user. The header pins the version
(`figdown 0.1`); when the spec moves, each change ships a mechanical
rewrite rule in the project's MIGRATIONS.md.

## Transcribing existing figures

Semantic reconstruction, not tracing: recover what the original means,
then state it in FigDown. Verify every bitfield row's width sum
against the original ruler. Never fabricate — mark uncertainty in a
`#` comment for human review. Record provenance (original filename +
hash + spec section) in comments at the top of the `.fd`. Per-node
annotations: dashed node + dotted edge when adjacency carries meaning,
one centralized table when it is dense data. Conditional encodings:
`note="valid when …"`. Composite originals: split into one `.fd` per
concept; the Markdown composes them.

Full spec and docs: https://github.com/FigDown/figdown
