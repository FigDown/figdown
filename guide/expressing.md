# Expressing intent in FigDown — author index

> **Non-normative index.** Spec is normative: [spec/core.md](../spec/core.md).
> Full authoring workflow: [authoring.md](authoring.md) (pick a genre first, then come back here).
> Layout hints: [layout.md](layout.md).
> Build and validate: `node tools/build-svg.js X.fd` — errors are `Line N: message`.

Purpose: one-line lookup — "I need to show X → use Y." One row per intent. Notes column = a caveat or scope limit, not a tutorial.

**Main standard vs EXPERIMENTAL.** Prefer **MAIN STANDARD** genres for
portable figures: `block`, `bitfield`, `table` (plus the `UNIVERSAL-CORE-KEYWORDS` core keywords
`figdown`/`title`/`layout` and the layout namespace's normative `pin`).
Constructs marked EXPERIMENTAL — `threshold`, `band`, `bundle`,
`plane`, `chart`, option keys
`plane=`/`z-index=`/`extend=`/`data=`,
and genres `topology`, `flowchart`, `timing` (`CONSTRUCT-STATUS-TIERS`, spec §10) — still parse and
are not deprecated, but they sit **outside** the v0.1 compatibility promise
and may change without a migration entry. **Do not use them when the figure
must be portable.** `path` and `routing` (with `points=`, `tailport=`,
`headport=`, `routing=`) were on that list until this release, when `EDGE-GEOMETRY-CONSTRUCTS`
**withdrew all six from the language**: removed, not renamed, so there is no
row for them below and no replacement to point at. Edge geometry is the
engine's; the need is filed as core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**. The parser never warns; this index and §10 are the only
status sources. Top-level keywords are also **genre-allowlisted (`GENRE-KEYWORD-ALLOWLIST`)**:
`node` under `figdown 0.1 bitfield` is an error, not a silent hybrid.

**This file is the single intent index.** authoring.md Step 3 used to carry a
second, partly-overlapping table; every intent it held now lives here, so there
is one place to look and nothing to reconcile.

---

## Structure & composition

| I need to show… | Use | Notes |
|---|---|---|
| containment — node belongs inside a box | `group g "Label"` + `node n "…" in=g` | one level of nesting only (spec §2.2); for deeper, represent the inner group as a proxy node |
| set membership / category (color + legend) | `class c "meaning" fill=… style=…` + `class=c` on members | legend derives automatically; bare `fill=` carries no named meaning |
| one class used on both nodes and edges | `class c "meaning" fill=… stroke=…` — BOTH keys on the one class | Since 0.1 (`INTERIOR-LESS-ELEMENT-PAINT`) the rule is per CHANNEL: `fill=` paints members that have an interior (a node box) and is inapplicable to an edge, which has none; `stroke=` paints the edge line and a node's outline; `style=` applies to both. So one class still carries one meaning for both kinds of member — do NOT split it. A class an edge joins MUST declare `stroke=` or `style=`: `fill=`-only (`INTERIOR-LESS-ELEMENT-PAINT`) and no-paint-at-all (`CLASS-PAINT-REQUIREMENT`) are both line errors, because the edge would otherwise lose its colour silently. `fill=`, `stroke=` and `style=` are all NORMATIVE since 0.1 (`STROKE-KEY-STATUS`) |
| hierarchy / tree | directed `edge` chain; `flow down` to orient | the edges carry the tree; group is for spatial containment, not hierarchy |
| adjacency without a link | `in=` on the same `group`, no `edge` between them | the shared frame communicates co-location |
| cross-cutting category spanning groups | `class` + `class=` on elements in different groups | one class can mark nodes, edges, and fields across the whole document |
| system boundary / inside vs outside | `external ext "label"` + edges to/from it; internal nodes in a `group` | `external` is never drawn as a shape — the edge ends open; it names an external I/O *endpoint*, not the frame drawn around a system (that is `group`) |
| ownership zones / domain coloring | `class zone "Owner" fill=…` on a `group` or its members | assign to the group itself to color the frame |
| a region the source drew as a **cloud** (the internet, a transit network, an overlay fabric) | `node net "The internet" shape=ellipse` (or a `group` when other elements sit inside it), plus a `class` when the distinction is one a reader must query | `shape=cloud` was **retired at 0.1** (`SHAPE-ENUM-VOCABULARY`) — it was the only value in a geometric enum that named a domain, which `SHAPE-ENUM-VOCABULARY` forbids. `ellipse` is what preserves the drawing; the label is what preserves the meaning, and only you know which one the figure needed |
| conditional or optional element (standby link, optional component) | `class cond "Condition text" style=dashed` + `class=cond` on the element | `style=dashed` alone states nothing (`PRESENTATION-AS-MEANING-CARRIER`); write the condition in the class label |
| one-level nesting limit | `in=` on `node`; `group … in=…` is a line error | for two levels: add a proxy `node` representing the inner group |
| layer stack or spatial arrangement where order is knowledge | `edge` chain + `flow down`, or single-row `table`; state the order in prose | no spatial-arrangement construct yet — see Known limits `MEANINGFUL-ARRANGEMENT` |
| slot map / position in a spatial grid | state positions in label text + `pin` in the layout zone | `pin` is geometry only, and the layout zone is ignored by default (`GENRE-NAMESPACE`) — use a `table` for anything a reader must count or address |
| several links that are one logical thing (LAG, ES, trunk group) | `bundle b1 "LAG" a--c,b--c` — ONE comma-delimited token (the space form was retired at 0.1) | the dashed ring around the members is derived automatically; members resolve **as written** (`a--c` is not `c--a`). **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`) — works unchanged; it is `topology` vocabulary and every corpus use of it is in a `topology` document |
| an independent plane a reader can separate (overlay vs underlay, control vs data) | `plane overlay "VXLAN tunnels" z-index=2` + `plane=overlay` on its elements | **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`) — the keyword, `z-index=` and `plane=` alike; works unchanged. The plane's **label is the knowledge**; `z` is paint order (implicit `base` is model `z` = 0; an omitted `z-index=` takes the 1-based declaration index). Honest limit: `z` reorders only the annotation pass — edges, bundle rings, thresholds, bands — nodes and groups paint in document order whatever their plane says (spec §5) |
| same row / same column (peers, stages, siblings) | `rank a,b,c` — a **semantic** (content) line, before `layout`; ONE comma-delimited token (the space form was retired at 0.1) | under `flow down` a rank shares a row, so rank the lateral peers, not the mainline ([layout.md §8](layout.md#8-cautions-from-a-production-corpus)) |
| cardinality, port name, or role at each end of a relationship | endpoint labels: `a [1] -[places]-> [N] b` | three label positions on one edge (tail · mid · head); `[flags[3:0]]` nests, `["…"]` for `\n` or unbalanced brackets. `label=`/`taillabel=`/`headlabel=` are retired options, not spellings |
| a shape in the source figure that carries no text at all (a junction, an unlabelled multiplexer, a bare glyph) | an explicitly empty label: `node j "" shape=circle` | `""` is a WRITTEN value, recorded as `label: ""` and drawn blank. Omitting the label instead makes the renderer display the **id**, which is text the source does not have. Reserve the omitted form for a label you could not read, and say so in a `#` comment (spec §2.1/§12.3, `EMPTY-LABEL-STATE`) |
| two concept areas that shared one original image | one `.fd` per concept; the Markdown composes them | `X.fd ⇔ X.svg` is one-to-one — never pack two unrelated figures into one source |
| hybrid panels in **one** artifact (scene + table, or block + bitfield panel) | **multi-section `MULTI-FIGURE-DOCUMENTS`**: a second `figdown 0.1 <genre>` line starts a new section; sections stack into one SVG | **MAIN STANDARD** hybrid path. Each section has one genre and its own id space — no cross-section edges. Nested `table`/`bitfield` under a single scene header may still parse (legacy) but is not the taught pattern |
| pure protocol header / pure table / pure box diagram | one section: `figdown 0.1 bitfield` or `table` or `block` only | do not put `node` under `bitfield`/`table` (`GENRE-KEYWORD-ALLOWLIST` allowlist error) |

---

## Flow & behaviour

| I need to show… | Use | Notes |
|---|---|---|
| ordered steps | directed `edge` chain; order = edge direction | `flow right` or `flow down` sets reading axis |
| decision + branches | under `flowchart`: `decision q "…"` + `flowline q -[yes]-> …` / `flowline q -[no]-> …` | **Prefer `decision` over `node … shape=diamond`, because the next reader then has to know nothing** — a diamond has to be learned, a word is just read. And the convention is not reliable: of 216 question-labelled nodes in the production corpus, 78% are diamond, 14% ellipse, 8% carry no shape. Under `block`/`topology` the keyword does not exist, so `shape=diamond` + labelled edges remains the baseline (`SHAPE-ENUM-VOCABULARY`: geometry only) |
| a step, a start or an end | under `flowchart`: `process p "…"` · `terminator t "…"` | Same reason. The geometry is DERIVED (box / rounded); `shape=` still works and changes only the drawing, never the role. **Prefer a role; `node` is the FALLBACK, and it means exactly one thing: THE SOURCE DOES NOT STATE THE ROLE.** ISO 5807 is a drawing standard with no "unclassified", so a genuine stage always has a classification; FigDown separates role from geometry and can therefore record the absence instead of inventing one — the transcriber's case. **A symbol this genre cannot spell is a different matter: that is a COVERAGE GAP, not an unstated role.** Nine ISO stage symbols have no word here (Data, Stored data, Predefined process, Preparation, Manual operation, Manual input, Document, Parallel mode, Loop limit). For one of those, write `node`, **name the ISO symbol in a comment** on the same line (`node cfg "Read config" # ISO 5807 Data — no FigDown role`), and report the gap — the project’s working record keeps it |
| an n-way dispatch on a value | one `decision` with ≥3 outgoing edges, each `[mid]`-labelled with the value that selects it | The single most under-marked control point in real figures. Label every exit — including the fallback (`[other]`). There is no `default`/`otherwise` keyword and none is planned (0 corpus uses) |
| loop / retry | directed cycle back to an earlier node; condition in the mid-label | **the back-edge IS the loop** — there is no `loop`/`while` construct and none is planned (172 back-edges in the corpus, not one marking itself). But a cyclic graph needs explicit arrangement, not acceptance of an unreadable crossing ([layout.md §9](layout.md#9-cyclic-flows-why-the-ladder-stalls-and-what-to-do-instead)) |
| error paths | `class err "Error path" style=dashed` + `class=err` on error edges | separate semantic category from the happy path |
| state machine / lifecycle | `figdown 0.2 statechart` — `state` per mode, labelled directed `transition`s between them | **`statechart` LANDED at `STATECHART-GENRE-SCOPE`**, and at `GENRE-NODE-SPELLING` it took its own two words (OMG UML 2.5.1 §14): `node`→`state`, `edge`→`transition`. It is EXPERIMENTAL, and reclassifying now rewrites every connector line, not just line 1 — run `tools/migrate-figdown.js`. Use it when a node is a **mode the machine is in**; use `flowchart` when it is a step performed — a retry loop is a flowchart, whatever the title says. `block` stays the portable spelling for a `figdown 0.1` corpus. No `initial`/`final` vocabulary, and order still rides on labels. See [spec/genres/experimental/statechart.md](../spec/genres/experimental/statechart.md) |
| pipeline stages | `node` per stage + `external` at the mouths + `flow right` + `rank` | `external` marks where data enters/leaves the figure |
| event → action | `edge src -[event]-> tgt` | mid-label is the trigger; head-label can name the action |
| precedence / partial order | a DAG of directed edges | absence of an edge means no stated constraint |
| fan-out / fan-in | edges from/to a common node | AND-vs-XOR join discipline: declare a `class` (`FLOWCHART-GENRE-DESIGN` — no first-class gateway yet) |
| message exchange between parties | nodes as parties + labelled directed edges; ordinal labels for ordering | strict ordering: number labels consistently (`FLOWCHART-GENRE-DESIGN`) — see Known limits |
| a label too wide for its diamond / ellipse / cylinder | nothing — shapes size themselves from their **inscribed** area | do not declare an extent; see the note below |

> **Delete declared extents added to make a shape fit its text.** Non-rectangular
> shapes were once sized by their bounding box, so authors declared an extent to
> stop `diamond` and `ellipse` labels overflowing. That is fixed. A declared
> extent is rigid and must be re-tuned whenever a label changes, so removing it
> is a maintenance win. Verified on production documents and reproducible here:
> strip every declared extent from this repo's examples that carry one and
> `node tools/shape-check.js --strict` still reports zero containment failures.
> The drawing is *not* byte-identical — the canvas shifts — but it stays
> geometrically correct. A layout-motivated extent
> ([layout.md](layout.md) rung 3) is a separate question.
>
> The spelling changed: `size` was **retired** and its keys moved
> onto `pin`, so an extent is now written `pin <id> width=<px> height=<px>`
> (`at=` optional, and `width=`/`height=` apply to **nodes only**). A stale
> document that still carries a `size` line gets a named migration diagnostic,
> not `unrecognized line`.

---

## Data & format

| I need to show… | Use | Notes |
|---|---|---|
| bit-level register / header | `bitfield id "label" [word=32] numbering=lsb0\|msb0` + `field "name" width` | `numbering=` is REQUIRED, no default: `lsb0` for hardware registers, `msb0` for IETF RFC headers. Fields are declared **left to right** under both values (`DECLARATION-ORDER-SEMANTICS`), so under `lsb0` declare them MSB-first — the leftmost bit number is the highest (`DECLARATION-ORDER-SEMANTICS`) |
| byte-level frame with no bit ruler | single-row `table`, cell order = wire order | `bitfield` adds a bit ruler — use `table` when bits are not the unit |
| struct / record layout | `table` with `Offset \| Field \| Type \| Width \| Notes` columns | cell order is authoritative; `width` for presentation only |
| memory map as lookup | `table` with address ranges + `cell (r,c) fill=` for highlights | a row `cell r highlight` and a cell `fill=`/`class=` that resolves to a fill on that same row may not both apply (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`) — tint the row or paint the cell, not both |
| lookup / translation table | `table` + `cell (r,c) fill=` for highlights | same `ROW-HIGHLIGHT-CELL-FILL-COLLISION` constraint: `highlight` (row) and `fill=` (cell) paint one channel |
| mapping between two node sets | `edge` + `class` naming the relation | the class label is the relation name; edges draw the pairs |
| pointer chains between nodes | directed `edge` chain | can't target a table cell — see Known limits `CELL-EDGE-ANCHORS` |
| conditional / variable-length fields | `field "name" width present="..."` or `field "name" *` in a `bitfield` | `present=` = fixed width, present only under a condition — a mandatory quoted, opaque-prose value: `present=""` claims conditional presence without stating the condition, `present="C = 1"` states it (`PRESENCE-CONDITION-EXPRESSION`). Do NOT repeat the condition in the label: `field "Checksum" 16 present="C = 1"`, never `field "Checksum (present if C=1)" 16 present="C = 1"`. `*` = at most one per bitfield (row remainder / trailing blob). GRE-style headers with several such fields use several `present=` fields + one trailing `*` |
| multi-line text inside a table cell | HTML `<br>` / `<br/>` / `<br />` in the cell | pipe cells are raw GFM; `\n` is **not** an escape there (two literal characters). Other HTML is literal text, not markup |
| endianness / dual ruler convention | two `bitfield` blocks with different `numbering=` | `lsb0` and `msb0` produce different rulers from the same fields, and **identical geometry**: only the numbers on the columns change (`DECLARATION-ORDER-SEMANTICS`) |
| mode-dependent field meaning | separate labelled `bitfield` blocks + `description=` per field | no first-class variant yet — see Known limits `BITFIELD-DISCRIMINATED-VARIANTS`. `description=` draws no ink beyond a tooltip, so state which mode applies in the label too if a human must see it |
| nested encapsulation / multi-tier header | `table` with <code>\|\|</code> colspan spans in header rows | <code>^^</code> for rowspan; cell order = wire order |
| a repeated element (an array of N identical fields) | `field "<name>" <width> index=<first>..<last>` — declare the element **once** | 0.1 (`BITFIELD-REPETITION-CONSTRUCT`), drawing revised 0.1 (`REPEATED-RUN-DRAWING`). The engine draws the first element, the elision and the last element, each with its index appended to your label; there is no line to write for any of it. Tri-state, like `present=`: key absent = no repetition claim, `index=""` = repeats with no index stated, a range states one. Write a LITERAL range whenever the source gives you one — a determinate run keeps every later field's offset computable. Only the LAST index may be prose; the first is always an integer |

---

## Quantity, time & relation

| I need to show… | Use | Notes |
|---|---|---|
| proportion of a whole / fill level | `band "Headroom" 15..35% in=g fill=…` on a `group` or `node` | the quoted label is **mandatory** and comes **first** (`BAND-LABEL-STATUS`) — a band with no name asserts nothing; `band "X" 15%` = 0..15%. The label's colour is derived from the band's fill (`LABEL-COLOUR-SOURCE`); there is no key for it. **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`) |
| threshold / watermark | `threshold "label" in=g offset=N%` on a `group` or `node` | spelled `guide` until 0.1 (`THRESHOLD-KEYWORD-SPELLING`). Label and the `%` are both mandatory; there is no `value=` and no `ref=` — the reference lives in the label (`THRESHOLD-VALUE-SCOPE`). `threshold` and `band` take the same two scopes (`AUTHORING-INTENT-OVER-RENDERING`). **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`) |
| quantity comparison | `table` with numeric columns | `▁▃▅▇` Unicode blocks as sparklines in cells (`TABLE-SPARKLINE`) |
| signal values over time | `timing id "label"` + `signal name chars` (one char = one cycle) | lane alphabet: `0 1 p n x = .` (a strict subset of WaveDrom's; `2`–`9` retired at 0.1). `timing` is an **EXPERIMENTAL** genre (`CONSTRUCT-STATUS-TIERS`, spelled `wave` until 0.1) — the alphabet is settled, the surface around it is not |
| event ordering without exact times | directed edges with ordinal mid-labels (`-[1: SYN]->`) | number labels consistently; no sequence genre yet |
| visual code / legend | `class` — legend derives automatically from declaration order | each `class` line gives swatch + meaning text |
| annotation explaining why | `node note "…" style=dashed` + dashed edge to the target | no first-class callout yet — see Known limits `ROW-INDEX-GUTTER` |
| cross-references within a scene | `edge` + `class` naming the relation | can't reference a table cell or bitfield field — see Known limits `CELL-EDGE-ANCHORS` / `CROSS-BLOCK-REFERENCES` |
| units | state them in the label or column header | no machine-readable unit type; interim: text in the label |
| trends / rates | `table` with a values column; `▁▃▅▇` for sparklines | charts are out of scope (`CHART-SCOPE-BOUNDARY`) — keep the raster + prose |

---

## Known limits (v0.1)

Each entry: what cannot be expressed today · OQ reference · sanctioned interim workaround.

- **same entity in two views** — no way to assert two nodes are the same participant; OQ pending; interim: shared `class` + a note stating the identity.
- **strict message ordering** — order carried only by label numbering convention; sequence genre candidate (v0.2, `FLOWCHART-GENRE-DESIGN`); interim: number labels consistently (e.g. `1: SYN`, `2: SYN-ACK`).
- **first-class callout / annotation** — a callout is structurally a node; `ROW-INDEX-GUTTER`; interim: `node note "…" style=dashed` + dashed `edge`.
- **cell anchors** — an `edge` cannot target a `table` cell or `bitfield` field; `CELL-EDGE-ANCHORS`; interim: whole-table relation + cell name in the edge label.
- **cross-block references** — no locator from one typed block to another, and no way to declare a composed region subordinate to a host element ("this table is about node X"); `CROSS-BLOCK-REFERENCES`; interim: prose note or a linking `edge` between the host nodes.
- **a repeat COUNT that names another field** — `index=` says a `bitfield` field repeats and gives the range, but the last index can only be prose when the count lives in another field (`index="0..Last Entry"`), because no value in the language may name a field; `BITFIELD-REPETITION-CONSTRUCT`'s surviving half, downstream of the locator problem `ANNOTATION-LOCATOR-SPLIT`; interim: write the prose end — the run is then honestly indeterminate, which is the correct reading, and say so in a `description=` or a `class` meaning.
- **byte-unit packet construct** — `bitfield` adds an unwanted bit ruler; `BYTE-UNIT-PACKET-BLOCKS`; interim: single-row `table`.
- **meaningful arrangement** (layer stacks, floorplans, proportional memory maps) — no declared-arrangement construct, and the layout zone is default-ignored so `pin` is not a substitute (`GENRE-NAMESPACE`); `MEANINGFUL-ARRANGEMENT`; interim: state the arrangement meaning in prose + read the layout zone.
- **timing-diagram span parameters** (setup/hold spans) — no named span between signal events in `timing`; `TIMING-MEASUREMENT-ANNOTATIONS`; interim: keep the original raster + prose.
- **mode-dependent field variants** — same bit range, different decode per mode; `BITFIELD-DISCRIMINATED-VARIANTS`; interim: separate labelled `bitfield` blocks + `description=`.
- **multiplicity / machine-readable units** — no count or unit type; pending corpus frequency; interim: state them in label text.
- **AND vs XOR fan-out** — `decision` (`flowchart` only) settles it for a decision's own exits: exactly one fires. For any OTHER fan-out — a `process` with several successors — the language still cannot say whether all branches fire or one does; `FLOWCHART-GENRE-DESIGN` sub-question; interim: declare a `class` naming the join discipline. `fork`/`join`/`merge` are recorded as excluded (0 corpus uses).
- **swimlanes / partitions in a flowchart** — no container-with-an-axis construct; recorded as the next flowchart candidate (Mermaid #2028, UML `ActivityPartition`, BPMN `Lane`); interim: `group` + a label naming the lane, which loses the axis.
- **conditional presence in scene elements** — `present=` is a `bitfield`-only option key; `node a "A" present="..."` is a line error; <!-- fence-check: skip --> v0.2 candidate; interim: `class cond "condition text" style=dashed` + `class=cond`.
- **mutually exclusive `bitfield` interpretations — a correctness trap, not a cosmetic one.** `break` is presentation-only and never reorders or skips bits, so alternative decodings of the *same* bits stacked with `break` are read by a machine as one long contiguous sequence: an 18-bit register drawn as eight alternative encodings computes as 144 bits. There is no union/case construct and nothing warns. Open question: what a variant/discriminator construct should look like (adjacent to `BITFIELD-DISCRIMINATED-VARIANTS`). Interim: **one `bitfield` block per alternative**, each labelled with the discriminator value that selects it (`bitfield ctl_a "Control — mode=0 (18 bits)" word=18`).
- **aside / non-participating annotation** — no node kind that comments on a figure without joining its graph; a free `node` parses but reads as a participant. Open question: whether an aside is a node kind or a document-level construct. Interim: prose beside the figure, or `node note "…" style=dashed` + a dashed `edge` (which does join the graph).
- **repeated-subgraph reuse** — no way to declare a sub-structure once and instantiate it *n* times. Open question: whether declare-once/instantiate-many belongs in the language at all or in the generator above it. Interim: write each instance out.
- **two-level group nesting** — `group … in=…` is a line error; nesting is one level in v0.1. Open question: whether deeper nesting needs new syntax or only a renderer change. Interim: a proxy `node` for the inner group.
- **mux / selector shape** — `shape=` is a closed geometric set (`box|rounded|circle|ellipse|diamond|cylinder`); `shape=mux` is a line error. Open question: whether the mux trapezoid is geometry (admissible under `SHAPE-ENUM-VOCABULARY`) or a domain noun (excluded). Interim: `shape=diamond` or a box, with the selector role in the label or a `class`.
- **blank / idle lane character in `timing`** — the lane alphabet is closed and has no "no activity" cycle (`_` and `z` are line errors). Authors reach for `x`, which draws as an unknown-value hatch — a different claim. Open question: whether idle is a lane value or a `gap`-like marker. Interim: `x` plus a `data=` entry or note saying it means idle.
- **charts / plots** — deliberately out of scope (`CHART-SCOPE-BOUNDARY`); keep the raster and describe in prose or a `table`.
- **closed-world readings** (anything not drawn is denied) — absence leaves no trace in the syntax; no tool can catch this. When a figure's meaning depends on what is NOT drawn, declare the closed-world reading explicitly and state every prohibition in a table row or note (`COMPLETENESS-DEFINITION` addendum).
