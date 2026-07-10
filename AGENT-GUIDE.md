# FigDown Agent Guide (v0.1 draft)

> Audience: **AI agents** asked to create or maintain figures in
> Markdown documentation using FigDown. This file is self-contained —
> a fresh session pointed here can start working. Full normative
> details live in [syntax-draft.md](syntax-draft.md); version changes
> in [MIGRATIONS.md](MIGRATIONS.md).
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

## 5. Core syntax cheat sheet

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
line "Cap" in=g at=80%      # threshold marker across a group
fill 15% in=g color=#hex    # zone band; fill 15-35% = explicit range;
                            # dir=up|down|left|right (default up)
bundle b1 "LAG" a--c, b--c  # link bundle: dashed ring drawn automatically

# bitfield (packet headers lsb0-default; use numbering=msb0 for RFC style)
bitfield x "Title" unit=32 [numbering=msb0]
field Name 16 [optional] [color=#hex] [note="..."]
field a:1, b:2, Long Name:16     # compact; * width = fill rest of row
wrap

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

## 6. Versioning

The header pins the version (`figdown 0.1`). When the spec moves, each
change ships a mechanical rewrite rule in
[MIGRATIONS.md](MIGRATIONS.md); upgrade a document by applying the
entries in order. Never silently mix syntax generations in one file.
