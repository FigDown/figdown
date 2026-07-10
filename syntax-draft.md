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

1. **Closed, line-oriented grammar** — every non-blank, non-comment
   line begins with a registered line-start token (a keyword, or `|`
   for table rows); unknown lines are errors carrying a 1-based line number
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

**Templates are defaults-only (R16 as narrowed by D8).** The header
names the document's template: `block` | `topology` | `flowchart` |
`bitfield` | `table` | `wave`. A template selects **defaults and a
validation profile only** — default flow (`block`→right,
`flowchart`→down), default edge directedness (`topology`→undirected),
default units — each tuned to that figure type's census statistics.
A template MUST NOT change the core meaning of a standard directive:
`node` is always a node, `edge` is always a relationship. A new
template requires corpus evidence AND semantic impossibility (R28).

**Version compatibility.** The header carries the wire-grammar version
and the template. An unknown major version MUST be rejected; an unknown
minor version SHOULD parse in lenient mode (§10); an unknown template
MUST be rejected in strict mode.

Lexical rules:

- Directive = `keyword positional-args… key=value-options…`
- Strings with spaces are double-quoted; bare words need no quotes.
- IDs are `[A-Za-z_][A-Za-z0-9_-]*`, unique per document.
- Colors are CSS hex (`#0d9488`) or CSS named colors.
- `#` begins a comment only at the start of a line or after whitespace
  (so `color=#0d9488` is never mistaken for a comment).
- Escapes inside quoted strings: `\n` line break, `\"` literal quote,
  `\\` literal backslash. Any other escape is a line error. Quotes also
  work inside option values: `label="on miss"`. (Pipe rows additionally
  use `\|` and `\^^`, §4.2.)
- `title` consumes the remainder of its line: `title TCP Header` and
  `title "TCP Header"` are equivalent (multi-word titles are never
  silently truncated).
- Keywords, option keys, enum values, IDs and references are
  **case-sensitive**; all standard keywords and option keys are
  lowercase ASCII.
- A directive line containing positional arguments its grammar does not
  accept MUST be rejected (typos never pass silently). `;` has no
  directive-separating meaning.
- The SHA-256 embedded in artifacts is computed over the exact UTF-8
  byte sequence of the source; processors MUST NOT normalize before
  hashing.
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
group vtep1 "VTEP-1"
node vm1 "VM" in=vtep1               # one level of nesting
```

Flat `in=` reference keeps the grammar line-oriented (no indentation
semantics, no `end` blocks). Groups accept `gap=<px>` — member spacing
(presentation, R5); `gap=0` packs members flush, giving the classic
one-frame-with-dividers look. OQ-S1 (indented block sugar) is
**rejected**: it would be a second containment syntax (R28/R30).

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
must reference existing edges (line error otherwise), and a member
reference `A--B` must resolve to a **unique** edge — parallel edges
between the same endpoints are out of scope for v0.1 and referencing
them is an error. This is the semantics-first rule (R24): name the
*meaning* and the engine owns the drawing convention.

### 2.6 Guide lines and zone fills: `line`, `fill` (generic markers)

```figdown
line "Max cap"                in=buf at=80%
line "Reserved {port, queue}" in=buf at=15%
fill 15% in=buf color=#a3c93a
```

- `line` is a **pure marker**: a horizontal guide across the target's
  box at a percentage of its height (bottom = 0%). No id — nothing
  references a line. Covers thresholds, waterlines, caps, future chart
  markers (R28: this one directive replaced a would-be template).
- `fill` is a **range band** written positionally: `fill 15%` = 0–15%
  (the common case needs one number); `fill 15-35%` = an explicit range
  in one token. Stackable, on a group **or** a single node. `dir=up|down|left|right` picks the
  measuring axis and its 0% edge (default `up`: 0% at the bottom —
  the waterline convention; `right` gives progress-bar style bands).
  Line and fill are decoupled concepts.
- **Scope follows the meaning (R29)**: attach to the *group* when the
  semantics are global ("one threshold config referenced by all
  columns" — the example above); attach to a *node* when the semantics
  are genuinely per-element (`fill 15-35% in=g2` — e.g. one
  column's occupancy watermark). The writer chooses the scope that
  states their intent; the renderer treats both identically.

## 3. Layout control — the three tiers (R5, R8)

Everything in this section is **optional**; with none of it, the renderer
auto-lays-out deterministically.

```figdown
flow right                      # tier 2: overall direction (right|down|left|up)
rank l2 l3                      # tier 2: these nodes share a rank/row
pin l3 at=420,80                # tier 3: position in px, relative to the
                                #         element's positioning context
size l3 w=120 h=60              # tier 3: explicit size (px or %)
```

Normative rules:

- **Rigidity** (R8): a `pin`/`size`/explicit attribute is a hard
  constraint; auto-layout arranges *around* pinned elements and never
  overrides them.
- **Determinism & stability (D1, tiered conformance)**: a conforming
  parser MUST produce the same semantic model for the same source; a
  conforming renderer MUST be deterministic (same source + same
  renderer version → byte-identical SVG); different renderers SHOULD be
  visually equivalent (byte-identical output across implementations is
  NOT required — a Canonical SVG Rendering Profile may make it opt-in
  later). A local edit must change only the corresponding local region.
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
- **OQ-S2 resolved: `at=` is px relative to the element's positioning
  context** — the canvas for ungrouped nodes and groups; the group's
  local coordinate system for group members (D6). Canvas-relative
  fractions were tried and rejected (canvas growth moved every
  fractional pin). Edges are always derived from node borders — they
  adapt, and can never be pinned.
- *Informative (editor policy, not wire format)*: editors MAY
  materialize computed positions into `pin` lines (the reference editor
  does so on the user's first drag — "pin-on-first-touch") and SHOULD
  place generated layout in a trailing `# layout` section.

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
  remainder of the current row; if `*` appears at a row boundary it
  consumes one full row (the RFC-diagram shape for Payload/Data
  trailers — avoids fake fixed widths and half-empty rows).
- Two field forms. Classic: `field <name> <width|*> [optional] [color=]
  [note=]`. Compact (C bit-field convention, for flag runs): `field
  a:1, b:1, Long Name:16` — commas separate items, the name is
  everything before the last colon (spaces allowed, no quotes needed),
  no per-field options; items MUST be comma-separated (a missing comma
  is caught rather than misparsed). Classic and compact forms are
  semantically equivalent; a single `field` line uses one form, never
  both.
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
colw auto 90 auto 25%              # optional column widths (auto | px | %)
cell 2 highlight                   # whole-row highlight (data rows 1-based)
cell 3,2 color=#dbeafe             # per-cell mark
cell h1,1 color=#eeede6            # header tiers address as h1..hN, top-down
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
  color=…` (per-cell mark), `cell <r> highlight` (row highlight),
  `colw` (one width per column: `auto` | `<px>` | `<n>%` of the natural
  total; count mismatch is a line error) — annotations attach to an
  address, keeping rows paste-clean. Addressing: header tiers are
  `h1..hN` top-down; data rows are `1..` below the separator. An
  annotation targeting a cell merged away by `^^`/`||` MUST be rejected
  — annotate the anchor cell.
- **Feature set validated against the 212-sample `table-matrix` census
  folder (R17, 2026-07-02)**: cellcolor 58.5%, merged 41.5%, headercol
  41.0%, multiheader 34.9% are must-haves (all now in the draft);
  multitable 20.8% (covered — multiple `table` blocks per document),
  colwidth 20.3% (OQ-S3), symbol 11.8% (covered — Unicode in cell
  values), rowhl 12.3% (covered — `highlight`). Evidence-based cuts for
  v0.1: mixed per-column alignment (1.4%) and rotated text (0.5%).
  partialborder 17.0% and memmap 14.2% deferred to v0.2 candidates.
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

One char = one tick. The v0.1 lane alphabet is **closed and complete**:
`0` low · `1` high · `p` positive clock pulse · `n` negative clock
pulse · `x` undefined · `=` data cell (named via `labels=`) · `.`
continue previous · `0-9` literal data values. Any other character is a
line error; further WaveDrom characters are reserved for future
versions. Note the two `gap` meanings: `gap <tick>` is a wave-block
child (visual time break); `gap=<px>` is a group layout option — the
scopes never overlap.

### 4.4 `plot` — charts from table data (EXPERIMENTAL, non-normative in v0.1)

```figdown
plot hm level=40        # hm is a table id: rows→X, columns→Y, cells→Z
```

The table IS the data (R28 — no second data syntax); `plot` maps it to
a chart. First kind: `bars3d`, a deterministic isometric projection
(fixed occlusion order, no real 3D needed) with an optional translucent
`level` threshold plane — the 3-D sibling of §2.6's guide lines.
Chart family is census-minor (~1%), so `plot` ships as an
**experimental** feature: implementations MAY support it; it is not
part of the v0.1 conformance surface. The principle it demonstrates is
normative in spirit: future chart features SHOULD reuse table blocks as
their data source.

### 4.5 Priority note

`block-architecture` (census #1, 24.3% weighted) needs **no typed
block** — it is the core scene model (§2) plus `kind`s; flowchart
(8.3%, #4) and topology (5.0%) fold into the same model. Final census
arithmetic: core scene (37.6%) + bitfield (23.7%) + table (9.6%) +
wave (7.2%) = **78% of all non-boilerplate figure occurrences, ≈95% of
classifiable diagrams** ([census.md](census.md)).

## 5. Presentation attributes (R5)

Optional on any element: `color=` (fill), `stroke=`, `text=` (label
color), `style=solid|dashed|dotted`, `layer=`; `gap=` on groups.
Dimensions belong exclusively to the `size` directive — `w=`/`h=` on a
node line is an error (one mechanism, not two). Everything else (fonts,
spacing, arrowheads, routing) belongs to the renderer/theme, not the
language.

Normative boundary (the presentation-ignorable invariant, extending
R25): removing all presentation-only attributes (`color`, `stroke`,
`text`, `style`, `gap`, `z`) and layout directives (`pin`, `size`) MUST
NOT change the document's semantic structure; semantic consumers MAY
ignore them. Consequently **color and style MUST NOT be the sole
carrier of meaning** — if color/dash denotes state, role, plane or
classification, that meaning SHOULD also appear in text or a semantic
annotation. Semantic-color profiles can be layered on later; the
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
- Unknown `shape`, duplicate ID, dangling edge endpoint, `in=` cycle,
  bitfield width overflow, table row/col mismatch → all line errors.
- A document with errors renders nothing (no partial/best-effort output —
  determinism over convenience).

## 9. Open syntax questions

- ~~OQ-S1: indented block sugar~~ — **rejected** (second containment
  syntax; R28).
- ~~OQ-S2: `pin at=` units~~ — resolved: px relative to the positioning
  context (§3).
- ~~OQ-S3: column widths~~ — resolved: `colw` is in v0.1 (§4.2); mixed
  per-column alignment stays out (census 1.4%).
- ~~OQ-S4: edge label position hints~~ — **rejected for v0.1** (pure
  presentation; would invite pixel-level hand-tuning; revisit as an
  editor extension).
- ~~OQ-S5: multi-figure documents~~ — resolved: one `.fd` produces one
  `.svg` artifact; a document MAY contain multiple top-level blocks,
  composed in document order.
- ~~OQ-S6: relationship to D2~~ — moved to an informative appendix; not
  a freeze blocker.
- OQ-S7: edge labels as structured children of the edge (tail/mid/head
  as first-class parts) — under discussion.

## 10. Keyword registry, conformance modes, extensions

**Registry (v0.1).** Top-level keywords (16):
`figdown title node group edge layer flow rank bundle line fill pin
size bitfield table wave` — plus the table-row line-start token `|`.
Typed-block child keywords (6): `field wrap cell colw signal gap`.
Reserved for the dynamic profile: `page step set pulse`.
Experimental (outside the v0.1 conformance surface): `plot`.
Each registered set (keywords, option keys, shape/style enums, edge
operators, numbering values, wave lane characters, merge markers) is
closed; additions follow the change policy (R28 gate) and land as
migration entries.

**Conformance modes (strict / lenient).**
- *Strict* (authoring, AI write→validate→fix): unknown keyword, unknown
  option, malformed line, unsupported registered value → line error; a
  document with errors MUST NOT render.
- *Lenient* (long-lived documents, viewers): unknown `x-` extension
  lines MAY be ignored with a warning; core syntax errors still fail.

**Extension namespace.** Keywords and option keys beginning with `x-`
are reserved for experimental/vendor extensions; standard keywords MUST
NOT begin with `x-`. Strict mode rejects unknown `x-` lines unless
explicitly enabled.

**Teachability check (R7).** Target: the full AI authoring guide fits
in ≤120 lines (see AGENT-GUIDE.md §5). Any addition pushing the
top-level set past ~20 keywords must survive the R28 gate.

## 11. Grammar sketch (ABNF, informative until freeze)

```abnf
document       = header *line
header         = "figdown" SP version [SP template] eol
line           = directive-line / table-row / comment-line / blank-line
directive-line = keyword *(SP argument) [SP comment] eol
argument       = qstring / option / bare-token
option         = option-key "=" option-value
keyword        = lower-alpha *(lower-alpha / DIGIT / "-")
id             = (ALPHA / "_") *(ALPHA / DIGIT / "_" / "-")
qstring        = DQUOTE *(qchar / escape) DQUOTE
escape         = "\" ("n" / DQUOTE / "\")
table-row      = "|" cell-content *("|" cell-content) "|" eol
comment-line   = *WSP "#" *VCHAR eol
```

The normative point is not this exact ABNF but that the grammar MUST be
mechanically implementable without consulting the reference PoC.
