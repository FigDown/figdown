# FigDown Syntax — Draft v0.0 (discussion draft)

> Status: **pre-standard sketch** for discussion, 2026-07-02. Derived from
> [requirements-notes.md](requirements-notes.md) (R0–R15, D1–D3). Nothing
> here is frozen. Type priorities follow the completed figure-type census
> over a 774-document / 12k-image corpus — see [census.md](census.md):
> the v0.1 scope below covers ~95% of the corpus's classifiable diagrams.
>
> 繁體中文版：[syntax-draft.zh-tw.md](syntax-draft.zh-tw.md)

## 0. Design constraints this syntax must satisfy

From the requirements log, the syntax is boxed in by:

1. **Closed, line-oriented grammar** — every line begins with a known
   keyword; unknown lines are errors carrying a 1-based line number
   (powers the AI write→validate→fix loop). (R7, ProtoFlow heritage)
2. **Mechanically renderable** — a plain program (no LLM) converts text
   to SVG, deterministically. (D1)
3. **Rigid/flexible attribute model** — every attribute either carries an
   explicit value (rigid constraint, renderer must honor) or is absent
   (renderer adapts, spillover minimized). (R8, R10)
4. **Defaults = the statistically common case** — most figures should
   need no supplementary declarations. (R13)
5. **Token-lean teachability** — the core must fit in a ~100-line
   authoring prompt. Borrow syntax conventions AI already knows
   (Mermaid, D2, DOT, WaveDrom) wherever possible. (R7, R11)
6. **Static first** — dynamic (page/step sequences) reserves keywords but
   is out of scope for v0. (R1, R2)

## 1. Document skeleton

A FigDown document is a UTF-8 text, one directive per line.

```figdown
figdown 0.1 block               # version header + TEMPLATE, REQUIRED first line
title "L3 Forwarding Datapath"  # optional
# comments start with '#'; blank lines are ignored
...directives...
```

**Templates (R16).** The header names the document's template — the
figure type it instantiates: `block` | `topology` | `flowchart` |
`bitfield` | `table` | `wave` | `partition` (census buckets in priority
order, plus the R26-evidenced partition). All templates share this one core grammar; the template
selects the keyword vocabulary (which `kind`s exist, what `node` means)
and the defaults (flow direction, edge directedness, unit sizes) — each
tuned to that figure type's own census statistics. Teaching an AI to
author one template needs only the core + that template's sheet. A new
template requires corpus evidence (R11: no metastasis).

Lexical rules:

- Directive = `keyword positional-args… key=value-options…`
- Strings with spaces are double-quoted; bare words need no quotes.
- IDs are `[A-Za-z_][A-Za-z0-9_-]*`, unique per document.
- Colors are CSS hex (`#0d9488`) or CSS named colors.
- `#` begins a comment only at the start of a line or after whitespace
  (so `color=#0d9488` is never mistaken for a comment).
- `\n` inside a quoted string is a line break (multi-line labels;
  Graphviz/Mermaid convention). Quotes also work inside option values:
  `label="on miss"`.
- One directive per line. No line continuations. No expressions, loops,
  or macros — ever. (framework axiom)

## 2. Core scene model (covers block-architecture, topology, flowchart)

The census shows these three types are one family: **boxes, containment,
and connections** — differing only in node kinds and edge styling. They
share one core model (the "why can't it be primitive + styling" rule).

### 2.1 Nodes

```figdown
node parser "Packet Parser"
node l3 "L3 Lookup" color=#0d9488
node q1 "CRC ok?" shape=diamond
node sw1 "ToR Switch" shape=rounded
```

- `shape=` is **purely geometric** (D7): `box` (default) | `rounded` |
  `circle` | `ellipse` | `cloud` | `diamond` | `cylinder`. The language
  deliberately binds **no domain nouns** (router/host/gateway…) — an
  endless vocabulary; what a device *is* belongs in its label text
  (R22: the meaning lives in the text). Unknown shape = line error.
- Nodes accept `style=dashed|dotted` (e.g. bridge-domain boxes in
  vendor figures).

### 2.2 Containment (groups / nesting)

```figdown
group ingress "Ingress Pipeline"
node parser "Parser" in=ingress
node l2 "L2 Lookup" in=ingress
group vtep1 "VTEP-1"; node vm1 "VM" in=vtep1   # one level of nesting OK
```

Flat `in=` reference keeps the grammar line-oriented (no indentation
semantics, no `end` blocks). OQ-S1: whether to also allow an indented
block form as sugar.

### 2.3 Edges

```figdown
edge parser -> l2
edge l2 -> l3 label="on miss" style=dashed
edge sw1 -- sw2 label="100G"        # undirected link
edge a <-> b                        # bidirectional
```

`->` `--` `<->` follow Mermaid/D2 conventions (AI prior knowledge, R11).
Endpoint (port) labels use Graphviz's `taillabel=`/`headlabel=` (R18) —
the ubiquitous `e1/22.2`-style interface tags of network figures.

### 2.4 Layers (R5)

```figdown
layer overlay "LSP paths" z=2
edge r1 -> r2 layer=overlay color=#dc2626
```

Layers are author-facing organizational units; `z` order among layers is
explicit, document order within a layer is paint order — **a later line
paints on top (closer to the viewer)**, so line order itself is the
implicit z within a layer. Default layer is `base` (z=0).

### 2.5 Semantic annotations: `bundle` (topology vocabulary)

```figdown
bundle es1 "ES-1 / LAG-1" bd24a--srv, bd24b--srv color=#0ea5e9
```

Declares that the listed links form **one logical bundle** — the neutral
umbrella term (LAG, Ethernet Segment, port-channel, multi-chassis
trunk…; the label says which). The renderer **derives** the
conventional dashed ellipse around the member links — no coordinates
involved, and the ring follows the nodes wherever they move. Members
must reference existing edges (line error otherwise). This is the
semantics-first rule (R24): name the *meaning* and the engine owns the
drawing convention.

## 3. Layout control — the three tiers (R5, R8)

Everything in this section is **optional**; with none of it, the renderer
auto-lays-out deterministically.

```figdown
flow right                      # tier 2: overall direction (right|down|left|up)
rank l2 l3                      # tier 2: these nodes share a rank/row
zone left ingress               # tier 2: region hint for a group
pin l3 at=420,80                # tier 3: absolute position (canvas px)
size l3 w=120 h=60              # tier 3: explicit size (px or %)
```

Normative rules:

- **Rigidity** (R8): a `pin`/`size`/explicit attribute is a hard
  constraint; auto-layout arranges *around* pinned elements and never
  overrides them.
- **Stability** (D1): same source → same SVG (bit-level). A local edit
  must change only the corresponding local region. Renderers must
  implement pin-respecting incremental layout; the reference workflow
  lets an editor **materialize** computed positions back into `pin`
  lines to freeze a layout the author approves.
- **Size adaptation** (R10): explicit `size` → content shrinks to fit
  (font may step down). No explicit size → box grows minimally without
  displacing the global layout.
- **Two-level pins (D6)**: a pinned **group** anchors its local origin
  in canvas px; a pinned **member** is group-local (relative to that
  origin). Moving a group is therefore a one-line edit and edits inside
  one group can never disturb another. Ungrouped pins are canvas px.
- **Semantic-completeness invariant (R25)**: stripping every `pin` and
  `size` line from a document MUST leave one that still parses, still
  renders under auto layout, and expresses the identical structure and
  relationships. Editors conventionally materialize layout into a
  trailing `# layout` section so the structure reads first.
- **OQ-S2 resolved (2026-07-02): `at=` uses absolute canvas px.**
  Canvas-relative fractions were tried in the PoC and rejected: when the
  auto-laid-out extent changes, every fractional pin moves with it —
  violating the stability rule pins exist to provide. Corollary
  (**pin-on-first-touch**): the reference editor materializes *all*
  node positions into `pin` lines on the user's first drag; from then
  on layout is fully manual and the algorithm stands down. Edges are
  always derived from node borders — they adapt, and can never be
  pinned.

## 4. Typed blocks (census-dominant types)

Three figure families are *not* box-and-wire graphs and get dedicated,
closed sub-grammars. Each is introduced by its keyword and terminated by
the next top-level directive (sticky-scope, like ProtoFlow steps — no
`end` keyword). Priority order below is final, per the completed census.

### 4.1 `bitfield` — packet headers / register layouts (census #2, 23.7% weighted)

Borrow: RFC packet ASCII art semantics, WaveDrom bitfield JSON, Mermaid
packet-beta.

```figdown
bitfield gre "GRE Header" unit=32
field C:1, R:1, K:1              # compact form: comma-separated name:width
field Reserved 9                 # (C bit-field convention; names may contain
field Ver 3                      #  spaces — "Protocol Type:16" needs no quotes)
field "Protocol Type" 16 color=#bfdbfe note="rGRE_INT"
field Checksum 16 optional
field Offset 16 optional
wrap                       # explicit row break when a field ends mid-unit
```

- `unit=32` — bits per row (default 32, the common case per census).
- Widths in bits; renderer computes bit indices and draws the ruler.
- Width is a bit count, or `*` = **variable-length field**: fills the
  remainder of the current row (the RFC-diagram shape for Payload/Data
  trailers — avoids fake fixed widths and half-empty rows).
- Two field forms. Classic: `field <name> <width|*> [optional] [color=]
  [note=]`. Compact (C bit-field convention, for flag runs): `field
  a:1, b:1, Long Name:16` — commas separate items, the name is
  everything before the last colon (spaces allowed, no quotes needed),
  no per-field options. A missing comma is caught ("looks like two
  fields") rather than misparsed.
- `numbering=lsb0|msb0` — bit-numbering convention. `lsb0` (default):
  bit 0 is the LSB, ruler runs N-1…0 left-to-right (hardware-register
  style — the dominant convention in the census's bitfield bucket, per
  the R16 per-template-defaults rule). `msb0`: bit 0 is the MSB, ruler
  runs 0…N-1 (IETF RFC style). Field placement order is unaffected —
  fields always fill left-to-right in declaration order; only the ruler
  labels change.
- `optional` renders the conventional dashed border (per corpus style).

### 4.2 `table` — config/state tables, memory maps (census #3, 9.6% weighted)

```figdown
table fib "FIB Table"
| Route          || Forwarding    ||
| Prefix | Next Hop | Port | VRF   |
|--------|:--------:|------|-------|
| 10.0.0.0/8  | R2  | p1  | default |
| 10.1.0.0/16 | R4  | p2  | default |
| ^^          | R3  | p2  | default |
cell 2 highlight                   # whole-row highlight
cell 3,2 color=#dbeafe             # per-cell mark; row 0 = bottom header tier
```

- **Table content is GFM pipe syntax, verbatim** (D5, applying R18: the
  GFM table is by far the most-used text table format — paste an
  existing Markdown table and it just works; LLMs emit it with near-zero
  hallucination). `|` is a registered line-start token, so the closed
  grammar is preserved.
- The `|---|` separator row is required (GFM signature); `:` colons give
  per-column alignment (left/center/right; data defaults to left,
  headers center). Rows before the separator are header tiers —
  multiple rows = multi-level headers.
- **Merging follows markdown-it-multimd-table** (the most-adopted MD
  span extension, since core GFM has no spans): `||` (nothing between
  two pipes) extends the cell to its left (colspan); a cell containing
  exactly `^^` merges with the cell above (rowspan). `\|` is a literal
  pipe, `\^^` a literal caret pair. Illegal in the first column/row
  respectively (line error).
- Comments are not recognized inside pipe rows (cell text is raw).
- FigDown abilities beyond GFM stay as keyword lines: `cell <r>,<c>
  color=…` (per-cell mark), `cell <r> highlight` (row highlight) —
  annotation attaches to an address, keeping rows paste-clean. Row
  addressing: `0` = the bottom header tier, data rows are 1-based.
- **Feature set validated against the 212-sample `table-matrix` census
  folder (R17, 2026-07-02)**: cellcolor 58.5%, merged 41.5%, headercol
  41.0%, multiheader 34.9% are must-haves (all now in the draft);
  multitable 20.8% (covered — multiple `table` blocks per document),
  colwidth 20.3% (OQ-S3), symbol 11.8% (covered — Unicode in cell
  values), rowhl 12.3% (covered — `highlight`). Evidence-based cuts for
  v0.1: mixed per-column alignment (1.4%) and rotated text (0.5%).
  partialborder 17.0% and memmap 14.2% deferred to v0.2 candidates.
- OQ-S3: column alignment/width overrides — likely `colw 30% auto auto`
  (backed by 20.3% corpus frequency).
- Tables can attach to scene nodes (`table fib ... attach=r1`) — the
  packet-walk scenario (usecases 4) needs this; deferred to v0.2.

### 4.3 `wave` — timing/waveform (census #5, 7.2% weighted)

Borrow WaveDrom's proven per-signal character lanes verbatim (R11: do not
invent):

```figdown
wave por "Power-on reset sequencing"
signal clk    p.......
signal rst_n  0...1...
signal data   x..=3=5x  labels="cfg,val"
gap 4                       # visual break marker at tick 4
```

One char = one tick: `p` clock, `0/1` levels, `x` undefined, `=` data
cell, `.` continue. Exact lane alphabet: adopt WaveDrom's, subset TBD.

### 4.4 `partition` — resource/quota maps (R26; memmap family, 14.2% of tables)

```figdown
partition buf "Packet buffer (pages)"
column g0 "Group 0"
column g1 "Group 1"                # or `columns 4` for an anonymous even split
line cap "Max cap"                at=100%
line res "Reserved {port, queue}" at=25% color=#a3c93a fill=below
```

- Structure = N columns + horizontal threshold **lines**; colored zones
  derive from `fill=below|above`. Rendering is one outer frame with
  N−1 internal dividers. Lines are the semantics (caps, hi/lo
  thresholds); nobody draws region boxes or computes a pixel.

### 4.5 Priority note

`block-architecture` (census #1, 24.3% weighted) needs **no typed
block** — it is the core scene model (§2) plus `kind`s; flowchart
(8.3%, #4) and topology (5.0%) fold into the same model. Final census
arithmetic: core scene (37.6%) + bitfield (23.7%) + table (9.6%) +
wave (7.2%) = **78% of all non-boilerplate figure occurrences, ≈95% of
classifiable diagrams** ([census.md](census.md)).

## 5. Presentation attributes (R5)

Optional on any element: `color=` (fill), `stroke=`, `text=` (label
color), `style=solid|dashed|dotted`, `w=`/`h=`, `layer=`.
Everything else (fonts, spacing, arrowheads, routing) belongs to the
renderer/theme, not the language. Semantic-color profiles (à la
ProtoFlow's plane→color) can be layered on later as profiles; the
document scenario keeps colors free. (resolves the R5 tension)

## 6. Dynamic — reserved, not specified (R1, R2)

`page`/`step` are reserved keywords. Sketch (non-normative):

```figdown
page "After ARP resolution"
set r1.fib row="10.1.0.0/16 R4 p2"    # sticky delta on the static scene
pulse r1                                # transient highlight
```

Dynamic = the static scene + an ordered list of page deltas (sticky/
transient split as in ProtoFlow). Deferred until the static core ships.

## 7. Embedding & artifacts (R14, D1)

- Fenced block in Markdown: ` ```figdown … ``` `; sidecar file: `X.fd`.
- Generated artifact: `X.svg`, embedded in .md by plain image reference.
- The renderer MUST embed in the SVG: the full source text
  (`<metadata id="figdown-source">`) and a SHA-256 of the source —
  making the artifact self-carrying and staleness detectable.
- Same-basename pairing (`X.fd` ⇔ `X.svg`) is normative.

## 8. Error model

- Unknown keyword / malformed line → `Line N: <message>`, parse continues
  (error-recovery mode) so all errors report in one pass.
- Unknown `kind`, duplicate ID, dangling edge endpoint, `in=` cycle,
  bitfield width overflow, table row/col mismatch → all line errors.
- A document with errors renders nothing (no partial/best-effort output —
  determinism over convenience).

## 9. Open syntax questions

- OQ-S1: indented block sugar for `group`/typed blocks?
- ~~OQ-S2: `pin at=` units~~ — resolved: absolute canvas px (§3).
- OQ-S3: table column width/alignment syntax.
- OQ-S4: `edge` label position hints (ProtoFlow `nudge` heritage)?
- OQ-S5: multi-figure documents — one `.fd` = one figure (current straw
  man), or allow several?
- OQ-S6: relationship to D2 syntax where models overlap (OQ1).

## 10. Teachability check (R7)

The complete core = 16 keywords: `figdown title node group edge layer
flow rank zone pin size bitfield field wrap table cols row wave signal
gap` (+ reserved `page set pulse`). Target: full AI authoring guide in
≤120 lines. If a future addition pushes past ~20 keywords, it must
justify itself against the generic-rules-first test (R11).
