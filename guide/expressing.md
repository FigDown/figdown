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
`chart`, option keys
`extend=`/`data=`,
and genres `topology`, `flowchart`, `timing` (`CONSTRUCT-STATUS-TIERS`, spec §10), plus the two
that arrived later on the same footing, `statechart` (`STATECHART-GENRE-SCOPE`, needs
`figdown 0.2`) and `sequence` (`SEQUENCE-GENRE-VOCABULARY`, needs `figdown 0.4`) — still parse
and are not deprecated, but they sit **outside** the v0.1 compatibility promise
and may change without a migration entry. **Do not use them when the figure
must be portable.** `path` and `routing` (with `points=`, `tailport=`,
`headport=`, `routing=`) were on that list until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS`
**withdrew all six from the language**: removed, not renamed, so there is no
row for them below and no replacement to point at. Edge geometry is the
engine's; the need is filed as core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**. **`plane` went the same way
(`PAINT-ORDER-CONSTRUCT`)**, taking `z-index=` and the `plane=` option key with it —
same shape, same absence of a replacement, so no row below either. What the one
authored figure used it for, `class` already did: stripping both writings from
`examples/evpn-fabric.fd` and rebuilding changed exactly one drawn markup token
— a `data-edge` index — and nothing else. The
parser never warns; this index and §10 are the only
status sources. Top-level keywords are also **genre-allowlisted (`GENRE-KEYWORD-ALLOWLIST`)**:
`node` under `figdown 0.1 bitfield` is an error, not a silent hybrid — and
(`SUBJECT-VOCABULARY-SCOPE`) the allowlist runs **per genre all the way down**. Only
`figdown`/`title`/`layout` are cross-genre; every other keyword belongs to one
genre's own namespace, and a spelling two genres share is two independent
declarations that happen to agree today, never one inherited. So the Notes
column below names the genres each construct is legal in: `group` under
`flowchart` and `external` under `statechart` are line errors (`SCENE-KEYWORD-MEMBERSHIP`) even
though both words are live elsewhere.

**This file is the single intent index.** authoring.md Step 3 used to carry a
second, partly-overlapping table; every intent it held now lives here, so there
is one place to look and nothing to reconcile.

---

## Structure & composition

| I need to show… | Use | Notes |
|---|---|---|
| containment — node belongs inside a box | `group g "Label"` + `node n "…" in=g` | **`block` and `topology` only** — withdrawn from `flowchart` and `statechart` at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`): no figure in the tree wrote one, and UML's word for the concept is *composite state*, not `group`. **The option key `in=` followed at 0.3 (`MEMBERSHIP-KEY-ACCEPTANCE`)** and is a named line error in those two genres: it named a `group` id and nothing else, so the `SCENE-KEYWORD-MEMBERSHIP` withdrawal left every value a dead end. Under `statechart` its spelling is additionally **RESERVED** — `in=` returns there with a `state`-id domain if UML 2.5.1 §14.2.3.4 composite states are earned. One level of nesting only (spec §2.2); for deeper, represent the inner group as a proxy node |
| set membership / category (color + legend) | `class c "meaning" fill=… style=…` + `class=c` on members | legend derives automatically; bare `fill=` carries no named meaning |
| one class used on both nodes and edges | `class c "meaning" fill=… stroke=…` — BOTH keys on the one class | Since 0.1 (`INTERIOR-LESS-ELEMENT-PAINT`) the rule is per CHANNEL: `fill=` paints members that have an interior (a node box) and is inapplicable to an edge, which has none; `stroke=` paints the edge line and a node's outline; `style=` applies to both. So one class still carries one meaning for both kinds of member — do NOT split it. A class an edge joins must not declare `fill=` without `stroke=` (`INTERIOR-LESS-ELEMENT-PAINT`): on a line those two name the SAME channel, so the edge would otherwise lose its colour silently, and a `style=` beside the `fill=` does not answer what the author asked for. Declaring NO paint at all is legal on every member (`CLASS-CHANNEL-REACH`) — the class claims a meaning, the derived legend draws it with no swatch, and the edge keeps its default line. `fill=`, `stroke=` and `style=` are all NORMATIVE since 0.1 (`STROKE-KEY-STATUS`) |
| hierarchy / tree | directed `edge` chain; `flow down` to orient | the edges carry the tree; group is for spatial containment, not hierarchy |
| adjacency without a link | `in=` on the same `group`, no `edge` between them | the shared frame communicates co-location |
| cross-cutting category spanning groups | `class` + `class=` on elements in different groups | one class can mark nodes, edges, and fields across the whole document |
| system boundary / inside vs outside | `external ext "label"` + edges to/from it; internal nodes in a `group` | `external` is never drawn as a shape — the edge ends open; it names an external I/O *endpoint*, not the frame drawn around a system (that is `group`). **`block`, `topology` and `flowchart` only**: withdrawn from `statechart` at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`) because UML 2.5.1 §14 already defines `external` as a `TransitionKind` (`external | internal | local`), and that reading is the one a statechart's reader arrives with. It takes **no option key at all** since `PAINT-ORDER-CONSTRUCT` removed `plane=`, its only one |
| ownership zones / domain coloring | `class zone "Owner" fill=…` on a `group` or its members | assign to the group itself to color the frame |
| a region the source drew as a **cloud** (the internet, a transit network, an overlay fabric) | `node net "The internet" shape=ellipse` (or a `group` when other elements sit inside it), plus a `class` when the distinction is one a reader must query | `shape=cloud` was **retired at 0.1** (`SHAPE-ENUM-VOCABULARY`) — it was the only value in a geometric enum that named a domain, which `SHAPE-ENUM-VOCABULARY` forbids. `ellipse` is what preserves the drawing; the label is what preserves the meaning, and only you know which one the figure needed |
| conditional or optional element (standby link, optional component) | `class cond "Condition text" style=dashed` + `class=cond` on the element | `style=dashed` alone states nothing (`PRESENTATION-AS-MEANING-CARRIER`); write the condition in the class label |
| one-level nesting limit | `in=` on `node`; `group … in=…` is a line error | for two levels: add a proxy `node` representing the inner group |
| layer stack or spatial arrangement where order is knowledge | `edge` chain + `flow down`, or single-row `table`; state the order in prose | no spatial-arrangement construct yet — see Known limits `MEANINGFUL-ARRANGEMENT` |
| slot map / position in a spatial grid | state positions in label text + `pin` in the layout zone | `pin` is geometry only, and every member of the layout namespace is ignored by default wherever it is written (`GENRE-NAMESPACE`) — use a `table` for anything a reader must count or address |
| several links that are one logical thing (LAG, ES, trunk group) | `bundle b1 "LAG" a--c,b--c` — ONE comma-delimited token (the space form was retired at 0.1) | the dashed ring around the members is derived automatically; members resolve **as written** (`a--c` is not `c--a`). **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`), and **`topology` only** since 0.3 (`SCENE-KEYWORD-MEMBERSHIP`): every corpus use of it was already in a `topology` document, and only there can it be defined by its referent — an IEEE 802.1AX LAG, an ECMP set, an EVPN Ethernet Segment — instead of as "a ring drawn round these links" |
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
| message exchange between parties, in time order | `figdown 0.4 sequence` — one `lifeline` per party, one `message` per exchange; the ladder's row order **is** declaration order | **The genre LANDED at 0.4 (`SEQUENCE-GENRE-VOCABULARY`), and this row's old advice retires with it**: nodes-as-parties plus `1:`/`2:` ordinal labels was the interim, and ordinals are naming, not semantics (`MEANING-RECOVERY-SOURCE`). Order is now structural — every message gets its own row, so no two share a span and nothing rides on a numbering convention. `state` puts a participant's condition on that participant's own lifeline, between two messages; `fragment` + `operand` say what kind of run a group of messages is (twelve UML operators, `type=` mandatory). It is **EXPERIMENTAL** and requires `figdown 0.4`, so a figure that must stay portable still writes the scene interim — and now does so as a *choice* it can state, not as a lack. See [spec/genres/experimental/sequence.md](../spec/genres/experimental/sequence.md) and [examples/sequence/](../examples/sequence/index.md) |
| a participant's condition at a point in an exchange | under `sequence`: `state <lifeline-id> "BOUND"`, written between the two messages it sits between (add `in=<fragment\|operand>` to put it inside a frame) | slot 1 **references** a lifeline and declares nothing; the quoted state name is mandatory. Row order places it — there is no time coordinate to write. This is the fact a scene genre plus a companion `table` could only carry as prose (`examples/showcase/tcp-handshake.fd`'s state table). One limit to know before you rely on it: a lifeline's state occurrences are **one sequence**, so two mutually exclusive operands cannot both end in a drawn `INIT` |
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

> **Choosing between `sequence` and `statechart` when many lines run between
> the same two blocks.** The symptom is identical in every scene genre —
> `block`, `flowchart` and `statechart` all crowd parallel edges into the one
> span between two boxes, and the reader sees confused overlap. What settles
> it is *what those lines are*:
>
> - **Time-ordered messages between one pair of participants → `sequence`.**
>   The ladder spreads time down the page, so ten exchanges between A and B
>   are ten rows on two lifelines and no two share a span. A figure like that
>   is already a sequence; the scene genre is only where it was forced to
>   live.
> - **Distinct transitions between states → `statechart`, and fix the
>   layout.** Many edges returning to one state are different triggers with
>   different meanings, not messages in an order. That crowding is a **layout**
>   problem, not a genre problem, and the answer is
>   [layout.md](layout.md), not a new header line.
>
> In one sentence: *are these lines messages between one pair over time, or
> transitions between states?* [`examples/sequence/dhcp-lease.fd`](../examples/sequence/dhcp-lease.fd)
> and [`examples/statechart/dhcp-client.fd`](../examples/statechart/dhcp-client.fd)
> are the same protocol answered both ways, which is the cheapest way to see
> the difference.

> **Three symptoms that ask you to CONFIRM the genre — and none of them
> decides it.** Each one means: go back to [authoring.md Step 2](authoring.md#step-2--pick-the-genre-main-standard-first)'s
> gate, ask the three questions again, and then either KEEP the figure where it
> is with the reason written down, or MOVE it. Confirming and keeping is a
> result; there is deliberately no lint on any of the three, because a symptom
> that fires on correct figures is not a rule.
>
> - **A hand-written `shape=diamond` with `yes`/`no` edges under a scene
>   genre.** The full row, with the measured reason there is no lint and the
>   two live instances that are right for opposite reasons, is in the
>   [authoring.md pitfall table](authoring.md#field-tested-pitfalls-quick-reference)
>   — read it there rather than twice.
> - **Ordinal mid-labels — `-[1: SYN]->`, `-[2: SYN-ACK]->`.** These are the
>   sanctioned interim for time order under a scene genre and they are *naming,
>   not semantics* (`MEANING-RECOVERY-SOURCE`; the rows above and the Known-limits entry below say
>   so). Keeping them is the **deliberate-portability** pattern and it is only
>   correct when the document SAYS so: a comment naming `sequence` as the genre
>   not taken (it needs `figdown 0.4`) and stating that the numbers are a
>   convention no parser reads. `examples/showcase/tcp-handshake.fd` is that
>   pattern written out. Unstated ordinals are the failure case.
> - **Many parallel edges crowding one pair of boxes.** Settled by the boxed
>   note immediately above — *messages between one pair over time* versus
>   *distinct transitions between states* — and in the second case the answer
>   is [layout.md](layout.md), not a new header line.

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
| proportion of a whole / fill level | `band "Headroom" 15..35% in=g fill=…` on a `group` or `node` | the quoted label is **mandatory** and comes **first** (`BAND-LABEL-STATUS`) — a band with no name asserts nothing; `band "X" 15%` = 0..15%. The label's colour is derived from the band's fill (`LABEL-COLOUR-SOURCE`); there is no key for it. **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`), and **`block` only** since 0.3 (`SCENE-KEYWORD-MEMBERSHIP`) — under `topology` the word reads as a *frequency* band, which is the collision that withdrew it there |
| threshold / watermark | `threshold "label" in=g offset=N%` on a `group` or `node` | spelled `guide` until 0.1 (`THRESHOLD-KEYWORD-SPELLING`). Label and the `%` are both mandatory; there is no `value=` and no `ref=` — the reference lives in the label (`THRESHOLD-VALUE-SCOPE`). `threshold` and `band` take the same two scopes (`AUTHORING-INTENT-OVER-RENDERING`). **EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`), and **`block` only** since 0.3 (`SCENE-KEYWORD-MEMBERSHIP`). Even there, mind the irony the withdrawal turns on: in QoS a threshold is a queue depth **with a numeric value** (RFC 2309 `minth`/`maxth`, RFC 7567 — the very RFCs `THRESHOLD-KEYWORD-SPELLING` took the spelling from), while this one has no `value=` and its `offset=` is a fraction of the target's rendered extent, not a quantity |
| quantity comparison | `table` with numeric columns | `▁▃▅▇` Unicode blocks as sparklines in cells (`TABLE-SPARKLINE`) |
| signal values over time | `timing id "label"` + `signal name chars` (one char = one cycle) | lane alphabet: `0 1 p n x = .` (a strict subset of WaveDrom's; `2`–`9` retired at 0.1). `timing` is an **EXPERIMENTAL** genre (`CONSTRUCT-STATUS-TIERS`, spelled `wave` until 0.1) — the alphabet is settled, the surface around it is not |
| event ordering without exact times | `figdown 0.4 sequence` — `message` declaration order **is** the order, and there are no times anywhere in the genre | vertical distance on a ladder carries no duration, so a delay or a timer belongs in the message label as prose. Under a scene genre the ordinal mid-label (`-[1: SYN]->`) remains the interim, and it remains a naming convention rather than semantics (`MEANING-RECOVERY-SOURCE`) — number consistently and say in a comment that you did |
| visual code / legend | `class` — legend derives automatically from declaration order | each `class` line gives swatch + meaning text |
| annotation explaining why — prose the **human** must see | `note="…"` on the element's OWN line: `node a "A" note="…"`, `group g "G" note="…"`, `edge a -> b note="…"`, `title "T" note="…"` (the figure-level one) | `figdown 0.3` (`DRAWN-ANNOTATION-FORM`). Attachment is by **syntactic position** — no id, no target key, so no ambiguity about which of several identically-labelled elements is meant. Not `description=`: the two divide by AUDIENCE — `description=` reaches the reading agent as an SVG `<title>` and puts **no ink** on the page, `note=` always draws. Both on one element is legal; neither is a fallback for the other. **You do not place the box** (`DOMAIN-CONVENTION-DIRECTIVES`): no `at=`, no `side=`; the engine sits it beside its carrier and takes a leader line only when adjacency fails. Refused on `field` (use `description=`) and on `cell`/`external`/`threshold`/`band`/`bundle`/`class` — zero measured demand (`plane` was on that list until `PAINT-ORDER-CONSTRUCT` withdrew the keyword itself). **Where a typed slot exists, a note is never the right answer**: a category is a `class` meaning, a containment is `in=`, a field's condition is `present=` |
| cross-references within a scene | `edge` + `class` naming the relation | can't reference a table cell or bitfield field — see Known limits `CELL-EDGE-ANCHORS` / `CROSS-BLOCK-REFERENCES` |
| units | state them in the label or column header | no machine-readable unit type; interim: text in the label |
| trends / rates | `table` with a values column; `▁▃▅▇` for sparklines | charts are out of scope (`CHART-SCOPE-BOUNDARY`) — keep the raster + prose |

---

## Known limits (v0.1)

Each entry: what cannot be expressed today · OQ reference · sanctioned interim workaround.

- **same entity in two views** — no way to assert two nodes are the same participant; OQ pending; interim: shared `class` + a note stating the identity.
- ~~**strict message ordering**~~ — **SOLVED (`SEQUENCE-GENRE-VOCABULARY`)** by the `sequence` genre. A message's place in the ladder's row order *is* its place in time, so nothing rides on `1:`/`2:` label ordinals and a reading agent no longer answers *three links join the client and the server* where the truth is one association carrying three segments in time. **`MESSAGE-ORDER-AND-STATE` (spec §9) is CLOSED** — the closing condition it stated, *a genre landing that brings a ladder layout path with it*, is the one that was met, and the question is kept whole under its closure note. What genuinely remains open is not the genre's absence but **which surface a portable figure may use**: `sequence` is EXPERIMENTAL and requires `figdown 0.4`, so the two figures `MESSAGE-ORDER-AND-STATE` cites as evidence (`examples/showcase/tcp-handshake.fd`, `examples/showcase/arp-resolution.fd`) deliberately stay `figdown 0.1 topology` + a companion `table` and keep the ordinal interim behind an honest-limit comment. Interim, unchanged, for any figure that must stay on `figdown 0.1`: number labels consistently (`1: SYN`, `2: SYN-ACK`) and carry per-participant state in a second section.
- **the residual limits of `sequence` itself**, stated because the genre landing did not make them go away. A `message` is **one instant** — no separate send and receive, so no propagation delay and no two messages crossing on the wire. A `par` cannot re-order one chosen pair. A lifeline's `state` occurrences are **one sequence**, so two mutually exclusive operands cannot both end in a drawn `INIT`; the second carries the fact in `description=` instead. `ignore`/`consider` message sets and `loop` bounds live in the frame's label as prose a reader can quote and a parser cannot read, because `fragment` has no argument slot. And a **meaning-only `class`** — the sanctioned idiom for a message sent and never delivered, after `lost=` was refused (`UNDELIVERED-MESSAGE-MARKING`) — puts no ink on the page: the `.fd` reader learns which message was dropped and the `.svg` reader cannot. Every one of these is stated in the sources under `examples/sequence/`; the drawing-side ones are filed in decisions/registry.md.
- **cell anchors** — an `edge` cannot target a `table` cell or `bitfield` field; `CELL-EDGE-ANCHORS`; interim: whole-table relation + cell name in the edge label.
- **cross-block references** — no locator from one typed block to another, and no way to declare a composed region subordinate to a host element ("this table is about node X"); `CROSS-BLOCK-REFERENCES`; interim: prose note or a linking `edge` between the host nodes.
- **a repeat COUNT that names another field** — `index=` says a `bitfield` field repeats and gives the range, but the last index can only be prose when the count lives in another field (`index="0..Last Entry"`), because no value in the language may name a field; `BITFIELD-REPETITION-CONSTRUCT`'s surviving half, downstream of the locator problem `ANNOTATION-LOCATOR-SPLIT`; interim: write the prose end — the run is then honestly indeterminate, which is the correct reading, and say so in a `description=` or a `class` meaning.
- **byte-unit packet construct** — `bitfield` adds an unwanted bit ruler; `BYTE-UNIT-PACKET-BLOCKS`; interim: single-row `table`.
- **meaningful arrangement** (layer stacks, floorplans, proportional memory maps) — no declared-arrangement construct, and the layout namespace is default-ignored wherever its members are written so `pin` is not a substitute (`GENRE-NAMESPACE`); `MEANINGFUL-ARRANGEMENT`; interim: state the arrangement meaning in prose + read the `pin` lines.
- **timing-diagram span parameters** (setup/hold spans) — no named span between signal events in `timing`; `TIMING-MEASUREMENT-ANNOTATIONS`; interim: keep the original raster + prose.
- **mode-dependent field variants** — same bit range, different decode per mode; `BITFIELD-DISCRIMINATED-VARIANTS`; interim: separate labelled `bitfield` blocks + `description=`.
- **multiplicity / machine-readable units** — no count or unit type; pending corpus frequency; interim: state them in label text.
- **AND vs XOR fan-out** — `decision` (`flowchart` only) settles it for a decision's own exits: exactly one fires. For any OTHER fan-out — a `process` with several successors — the language still cannot say whether all branches fire or one does; `FLOWCHART-GENRE-DESIGN` sub-question; interim: declare a `class` naming the join discipline. `fork`/`join`/`merge` are recorded as excluded (0 corpus uses).
- **swimlanes / partitions in a flowchart** — no container-with-an-axis construct; recorded as the next flowchart candidate (Mermaid #2028, UML `ActivityPartition`, BPMN `Lane`). A swimlane partitions **across** the flow, by responsibility. The interim used to be `group` + a label naming the lane, which lost the axis; (`SCENE-KEYWORD-MEMBERSHIP`) `group` is not a `flowchart` keyword and (`MEMBERSHIP-KEY-ACCEPTANCE`) neither is `in=`, so the box interim is gone entirely — declare a `class` per partition and put `class=` on each stage, which earns a legend entry and applies to every member at once.
- **pipeline PHASES in a flowchart — a SIBLING of the row above, not the same gap** (`MEMBERSHIP-KEY-ACCEPTANCE`). **A phase is not a swimlane.** Visio ships the two as separate constructs on orthogonal axes: swimlanes (bands) name functional units — *who is responsible* — while **phases** (separators) cut **across all the lanes** to mark a stage boundary; a cross-functional flowchart routinely has both. UML's `ActivityPartition` is the actor-ish one, so it belongs to the swimlane row. A phase is **an ordered stage-partition ALONG the flow axis**. The demand is real and **was never measured**: the downstream flowchart survey counted 3266 nodes and 2684 edges across 227 deduped figures and **never counted containers at all**, so the evidence is thin on both sides. *Reopens on:* a count of downstream production parser specifications whose phases fail to read once rendered from `class`. Interim: a `class` per phase — complete on meaning, and its one residual loss (members are not guaranteed to be drawn adjacent or in phase order) is a **renderer** question filed in `decisions/registry.md` beside items 26/27, not a missing word.
- **conditional presence in scene elements** — `present=` is a `bitfield`-only option key; `node a "A" present="..."` is a line error; <!-- fence-check: skip --> v0.2 candidate; interim: `class cond "condition text" style=dashed` + `class=cond`.
- **mutually exclusive `bitfield` interpretations — a correctness trap, not a cosmetic one.** `break` is presentation-only and never reorders or skips bits, so alternative decodings of the *same* bits stacked with `break` are read by a machine as one long contiguous sequence: an 18-bit register drawn as eight alternative encodings computes as 144 bits. There is no union/case construct and nothing warns. Open question: what a variant/discriminator construct should look like (adjacent to `BITFIELD-DISCRIMINATED-VARIANTS`). Interim: **one `bitfield` block per alternative**, each labelled with the discriminator value that selects it (`bitfield ctl_a "Control — mode=0 (18 bits)" word=18`).
- ~~**first-class callout / annotation**~~ and ~~**aside / non-participating annotation**~~ — **SOLVED (`DRAWN-ANNOTATION-FORM`)** by `note=`, which is an attribute and therefore not a participant at all: the workaround it replaces (a detached dashed `node`) *was* structurally a node, so a reading agent counted it in the topology and mixed annotation text into architecture descriptions. What remains open is only the **spanning** case — one note about two or more elements, measured at 10.0% (corpus A) and 6.7% (corpus B), which an attribute cannot express. Interim, and it is the corpus's own: a **footnote marker** in the label text (`*`, `**`, `#`, `##`) with the explanation in a `note=` keyed to the same marker. Legal, drawn and readable today; its only loss is that the correspondence is not machine-readable.
- **repeated-subgraph reuse** — no way to declare a sub-structure once and instantiate it *n* times. Open question: whether declare-once/instantiate-many belongs in the language at all or in the generator above it. Interim: write each instance out.
- **two-level group nesting** — `group … in=…` is a line error; nesting is one level in v0.1. Open question: whether deeper nesting needs new syntax or only a renderer change. Interim: a proxy `node` for the inner group.
- **mux / selector shape** — `shape=` is a closed geometric set (`box|rounded|circle|ellipse|diamond|cylinder`); `shape=mux` is a line error. Open question: whether the mux trapezoid is geometry (admissible under `SHAPE-ENUM-VOCABULARY`) or a domain noun (excluded). Interim: `shape=diamond` or a box, with the selector role in the label or a `class`.
- **blank / idle lane character in `timing`** — the lane alphabet is closed and has no "no activity" cycle (`_` and `z` are line errors). Authors reach for `x`, which draws as an unknown-value hatch — a different claim. Open question: whether idle is a lane value or a `gap`-like marker. Interim: `x` plus a `data=` entry or note saying it means idle.
- **charts / plots** — deliberately out of scope (`CHART-SCOPE-BOUNDARY`); keep the raster and describe in prose or a `table`.
- **closed-world readings** (anything not drawn is denied) — absence leaves no trace in the syntax; no tool can catch this. When a figure's meaning depends on what is NOT drawn, declare the closed-world reading explicitly and state every prohibition in a table row or note (`COMPLETENESS-DEFINITION` addendum).
