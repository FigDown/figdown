# Genre `table` — config, state, memory maps, any grid of cells

Status: NORMATIVE and portable.

The rows are **verbatim GFM**: write the Markdown table you would have
written anyway, then annotate it.

```figdown
figdown 0.1 table
title "Retention policy"

table r "Per-tier retention"
| Tier     | Copies | Retained |
|----------|:------:|----------|
| Hot      | 3      | 30 days  |
| Warm     | 2      | 1 year   |
| Archive  | 1      | 7 years  |
width auto,25%,auto          # optional column widths: auto | px | %
                             # ONE comma-delimited token, no spaces
cell (h1,3) fill=#e5e7eb     # header tiers are h1..hN, top down
cell (2,3) class=cold        # data rows are 1-based
cell 3 highlight             # a whole-ROW mark
class cold "Cold storage" fill=#dbeafe
```

## The rules

**The logical grid is the pipe rows plus the merges**, and nothing else
changes it. `^^` merges a cell into the one above (rowspan), `||` into the
one to its left (colspan), and `\|` is a literal pipe inside a cell.
Column widths, colours and alignment never alter the grid.

**Address the anchor, never a merged-away cell.** A `cell` line naming a
position that a merge absorbed has nothing to paint.

**`highlight` and `cell … fill=` are one channel.** A cell `fill=`, or a
`class=` resolving to a fill, on a row that also carries `cell <n> highlight`
is an error: the model would say "row 3 is highlighted" while the drawing
tinted only part of it. Pick one.

```figdown
figdown 0.1 table
table m "Memory map"
| Region | Base | Size |
|--------|------|------|
| Boot   | 0x0  | 64K  |
| Config ^^ | 0x10000 ||
| Data   | 0x20000 | 1M |
cell (1,1) fill=#fee2e2
```

## Vocabulary

| Line | Purpose |
|---|---|
| `table <id> "<title>"` | opens the block; the id is required |

The block title is a string and takes **quotes**. `highlight` is a bare
keyword — `cell 1 highlight`, never `cell 1 "highlight"`. A `width` value may
be quoted or bare; it changes nothing. **A colspan is an EMPTY cell — zero
characters between the pipes** (`| A || B |`). A cell holding only spaces is
an ordinary empty cell, so a formatter that pads `||` into `| |` silently
turns one spanned header into two plain ones: keep FigDown fences out of
automatic Markdown formatting.
| `\| … \| … \|` | a row; the second row is the GFM separator and sets alignment |
| `width auto,25%,auto` | column widths, one per column |
| `cell (<row>,<col>) …` | annotate one cell — `fill=` `stroke=` `class=` |
| `cell <row> highlight` | tint a whole row |

Use a `table` rather than a figure whenever the content is genuinely
tabular: a grid of values is not made clearer by being drawn as boxes.
