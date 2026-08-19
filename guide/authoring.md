# Authoring SOP — from "I need a figure" to the right FigDown

> Audience: **humans** (and agents) deciding how to express a figure.
> Companion to [agents.md](agents.md) (the agent workflow)
> and [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) (how the language changes).
> Once you have chosen a genre below, consult [expressing.md](expressing.md) for a one-line "I need to show X → use Y" lookup.

## Field-tested pitfalls (quick reference)

For the full explanation of each entry see the per-genre reading files: scene
pitfalls in [read/0.4/scene.md](../read/0.4/scene.md), bit-numbering in
[read/0.4/bitfield.md](../read/0.4/bitfield.md), arrangement in
[read/0.4/layout.md](../read/0.4/layout.md), ladders in
[read/0.4/experimental/sequence.md](../read/0.4/experimental/sequence.md).
(`read/` is versioned by **language** version and `0.4` is the live set;
the older directories stay frozen beside it.)

| Symptom | Correct spelling |
|---|---|
| Bit ruler reversed vs source figure | `numbering=` is required — read it off the source: `lsb0` draws N-1…0 L→R (hw register), `msb0` draws 0…N-1 L→R (IETF RFC). It relabels the ruler only: fields are declared L→R under both, so `lsb0` means declaring MSB-first (`DECLARATION-ORDER-SEMANTICS`) |
| Containment drawn as an invented edge A → sub-block | `group` + `in=` on member node; `gap=0` for flush stacking |
| Dashed/colored frame "not supported" | `style=dashed`, `fill=`, `stroke=` are legal on any element including groups, and all three are NORMATIVE since 0.1 (`STROKE-KEY-STATUS`). There are exactly TWO paint channels, SVG's own: `fill=` is the interior, `stroke=` the outline of a shape and the WHOLE of a line — so an `edge`/`bundle`/`threshold` takes `stroke=` and never `fill=`. There is no label-colour key: `color=`/`text=` are retired line errors and the label colour is derived from the background (`COLOUR-KEY-STATUS`/`LABEL-COLOUR-SOURCE`) |
| Yes/No decision edges lose colors | An edge is a line with no interior, so `fill=` cannot paint it — `stroke=` does. Declare `class yes "…" stroke=…` and `class no "…" stroke=…`, then tag edges `class=yes` / `class=no`. Keep `fill=` on the same class only if nodes join it too (it paints members that have an interior). A class joined by an edge that declares `fill=` with no `stroke=` is a line error (`INTERIOR-LESS-ELEMENT-PAINT`) — and a `style=` beside the `fill=` does not answer for the missing `stroke=`. A class that declares NO paint at all is legal: it claims a meaning and the edge keeps its default line (`CLASS-CHANNEL-REACH`) |
| Hand-written `shape=diamond` with `yes`/`no` edges under a scene genre | **CONFIRM the genre — this symptom does not decide it** (`GENRE-SELECTION-PRECEDENCE`). Run Step 2's gate again: if the figure as a whole is a procedure with branches, `flowchart` says `decision` in a word instead of drawing a hint at it; if it is not, the diamond is fine where it stands. There is deliberately **no lint** on this shape, and three reasons why: of 216 question-labelled nodes in the production corpus only 78% are diamond (14% ellipse, 8% no shape), so the geometry has no inverse mapping; `shape=diamond` is the **sanctioned interim** for the mux/selector gap (expressing.md *Known limits*) and a gate must not condemn the language's own workaround; and `STATECHART-GENRE-SCOPE` already refused dispatching a genre from structure. Both live instances are right for opposite reasons — [`examples/annotated-datapath.fd`](../examples/annotated-datapath.fd) keeps its diamond under `block` because the figure needs `group`/`in=`, which `flowchart` does not have (Q3, `SCENE-KEYWORD-MEMBERSHIP`/`MEMBERSHIP-KEY-ACCEPTANCE`), and [`examples/rpf-check.fd`](../examples/rpf-check.fd) moved to `flowchart` and states the trade in its header comment |
| Literal `\n` shows in label | `\n` works only inside quoted strings: `node a "Line one\nLine two"` |
| Inventing label for an unlabeled shape | Never fabricate. Shape has NO text in the original → `node a ""` (records `label: ""`, draws blank). Label merely unknown/unreadable → omit it and flag in a `#` comment (the id renders as a placeholder). A cloud in the source is `shape=ellipse` with what it is in the label — `shape=cloud` was retired at 0.1 (`SHAPE-ENUM-VOCABULARY`: geometry only) |
| External I/O as a fake node | Use `external <id> "label"` — never drawn as a shape, edge ends open |
| Shared bus flattened to point-to-point star | Model as ONE intermediate node fanning out (mid-edge taps pending, `TAP-VERSUS-JUNCTION-SPELLING`) |
| Topology/hierarchy figure comes out scrambled | Add `pin` hints + `flow` direction; auto-layout alone won't reproduce a specific arrangement |
| Byte-block header forced into `bitfield` | No bit scale → use a single-row `table` or `node` sequence to avoid a misleading bit ruler |
| `node` under `figdown 0.1 bitfield` (or `table`) | Genre allowlist (`GENRE-KEYWORD-ALLOWLIST`): a keyword is legal only in the genres that DECLARE it, and `bitfield`/`table` declare no scene vocabulary — use `block` / multi-section, or pure bitfield/table only. This cut runs between the scene genres too (`SUBJECT-VOCABULARY-SCOPE`): `group` under `flowchart`, `external` under `statechart`, and `plane` anywhere are all line errors (`SCENE-KEYWORD-MEMBERSHIP`/`PAINT-ORDER-CONSTRUCT`) — and since 0.3 the cut reaches OPTION KEYS: `in=` under `flowchart` or `statechart` is a line error naming the withdrawal, because it named a `group` id and neither genre can declare one (`MEMBERSHIP-KEY-ACCEPTANCE`) |
| Ladder written with `node` / `edge` under `sequence` | The genre has its own five words and no scene vocabulary: `lifeline`, `message`, `state`, `fragment`, `operand`. On a `message` the undirected `--` is a line error — a message has a sender and a receiver — and `fragment` requires `type=`, which has no default. Three constructs an author arriving from another genre reaches for were argued and **REFUSED**, each with its own named diagnostic and the spelling that works instead: `gap` (`SEQUENCE-TIME-GAP`), `group` (`SEQUENCE-PARTICIPANT-GROUPING`) and the option key `lost=` (`UNDELIVERED-MESSAGE-MARKING`, replaced by a meaning-only `class`) |
| Scene + table in one file nested under one header | Main standard: second section `figdown 0.1 table` (multi-section `MULTI-FIGURE-DOCUMENTS`); nested typed regions under a scene header are legacy, not the taught path |
| Multi-line table cell via `\n` | Pipe cells: only HTML `<br>` / `<br/>` / `<br />` (normalized to a real newline); `\n` in a cell is two literal characters |

## Step 1 — State the meaning before choosing anything

Write one sentence: *"this figure states that …"*. If you cannot, the
figure is not ready to draw. FigDown is semantics-first: the text is
what an AI will read as truth; the picture is a projection. Everything
below follows from what the figure **means**, never from what it
should look like.

**If you are transcribing an existing figure**, apply the source-fidelity
check (`TRANSCRIPTION-FIDELITY-TIERS`) before anything else: identify the original format; extract
structurally when the source is structured (Tier 1: semantic-graph sources
such as Visio/.vsdx and draw.io — map directly; Tier 2: vector sources
such as SVG/EMF — extract text and geometry structurally, infer topology
from geometry, use vision only for the residue; Tier 3: raster-only —
vision is legitimate but last resort and must be verified); state the tier
in the provenance comment. The full check is
[`read/0.4/transcribe.md`](../read/0.4/transcribe.md).

## Step 2 — Pick the genre (main standard first)

| The figure is about… | Genre | Status |
|---|---|---|
| bit positions in a packet header / register | `bitfield` | **MAIN STANDARD** (NORMATIVE) |
| rows × columns of values (configs, states, maps) | `table` | **MAIN STANDARD** (NORMATIVE) |
| components, containment, dataflow — box-and-wire | `block` | **MAIN STANDARD** (NORMATIVE) |
| devices and the links between them | `topology` | EXPERIMENTAL — EXPERIMENTAL **status** only: it is dispatchable under `figdown 0.1`, so choosing it costs **no version movement** |
| steps, decisions, and control flow | `flowchart` (defaults `flow down`; owns `process` / `decision` / `terminator`) | EXPERIMENTAL — EXPERIMENTAL **status** only, same as `topology`: dispatchable under `figdown 0.1`, **no version movement** |
| states a machine is IN, and transitions between them | `statechart` (**needs `figdown 0.2`**; a node is a `state`, a connector a `transition`) | EXPERIMENTAL — and it charges **both** prices: EXPERIMENTAL status **and** a declared version off `0.1`. Choose it only when a node is a **mode endured**, not a step performed: a retry loop is a `flowchart` however its title reads |
| participants and the messages they exchange, **in time order** | `sequence` (**needs `figdown 0.4`**; participants are `lifeline` columns, time runs down the page, and `flow`/`rank`/`pin` do nothing here) | EXPERIMENTAL — and its withdrawal price is **not** `statechart`'s: that genre added no syntax, this one adds five keywords, an enum and a whole layout. Choose it when many lines run between the SAME pair of blocks **and** those lines are a time-ordered exchange; if they are distinct transitions of one machine, that is a `statechart` with a layout problem |
| signals changing over time cycles | `timing` | EXPERIMENTAL |

### The gate: three questions, in this order (`GENRE-SELECTION-PRECEDENCE`)

**Q1 — IDENTITY, and it decides.** Read the table above **downwards** and stop
at the first row that describes the figure **as a whole**. Not its subject, not
its domain, not the tool it came from: what the figure *is*. **The table is
ordered by STATUS, not by precedence, and `block` is the one row you read
LAST** wherever it sits: it is the **RESIDUAL on identity**, right only when no
*other* row names the figure, and never right merely because it is the row you
know best. (Its own genre document says the same from the other side: `block`
is chosen positively for structural relations and containment, or as the
residual for subjects no genre names — and the residual reading carries an
obligation to state what is lost.)

**Q2 — PORTABILITY, which MAY overrule Q1 — but only as a trade you STATE.**
Portability is two prices, and they are charged by different rows. Keep them
apart, because conflating them is the measured way authors get this wrong:

| The price | What it costs | Which rows charge it |
|---|---|---|
| **the declared version** | the header leaves `figdown 0.1`, so a reader pinned to an older language version cannot read the file at all | `statechart` (`0.2`) · `sequence` (`0.4`) |
| **the EXPERIMENTAL status** | the construct parses today but sits outside the v0.1 conformance surface and its compatibility promise (`CONSTRUCT-STATUS-TIERS`, spec §10), so it may change or be withdrawn in a later `0.x` | every EXPERIMENTAL row, `topology` and `flowchart` included |

- **`topology` and `flowchart` cost NO version movement.** Both have been
  dispatchable under `figdown 0.1` since they existed. So *"I need this to
  render on any released version"* is **not** an argument for leaving those two
  rungs, and it **must not be offered as one**. What you are trading there is
  status alone — the withdrawal risk — and that is a real risk to weigh, not
  the same risk.
- **`statechart` and `sequence` cost a real version move**, so taking the lower
  rung is a legitimate choice. It is a **DECLARED** choice: write a comment
  that names the genre you did not take and states what the reader must **not**
  conclude from the one you did.
  [`examples/showcase/tcp-handshake.fd`](../examples/showcase/tcp-handshake.fd) is
  the pattern — it stays `figdown 0.1`, says which genre it is not using, and
  says that its `1:`/`2:` ordinals are a naming convention and not an ordering
  the language can read.
- **Silence is the failure.** An approximation you state is a transitional
  position with an upgrade path recorded in it; an approximation you do not
  state is terminal by default, and `GENRE-EARNING-THRESHOLD` §4 is where that stops being acceptable.

**Q3 — CAPACITY, which disqualifies.** A genre that names the figure and
cannot hold it is the wrong genre. `flowchart` and `statechart` declare no
`group` and take no `in=` (`SCENE-KEYWORD-MEMBERSHIP`/`MEMBERSHIP-KEY-ACCEPTANCE`), so if the figure's content is nested
regions, **containment is a POSITIVE reason** to write `block` or `topology` —
a reason of its own, not a portability excuse wearing one.

**The choice recurs per section, and the version follows the genre.** A
multi-section file asks all three questions again at every
`figdown <version> <genre>` line, and each section declares its own version:
write the **lowest** one that carries **that section** (`STATECHART-GENRE-SCOPE`).

The genre is the header's second token — `figdown 0.1 <genre>` — and it
is **required**: a header with no genre is a line error. (The header
must be the document's first *significant* line; comments and blank
lines, such as a provenance block, may precede it.) Each genre has its
own document under [spec/genres/](../spec/genres/README.md).

**The genre is a namespace (`GENRE-NAMESPACE`), enforced as a top-level allowlist
(`GENRE-KEYWORD-ALLOWLIST`).** Top-level keywords must be legal for that genre:
`node` / `edge` under `figdown 0.1 bitfield` is a line error. The CORE three
(`figdown` `title` `layout`) are legal under every genre (fixity, not
ubiquity), and so is the **layout namespace** — `pin`, its only member since
`path` and `routing` were withdrawn (`EDGE-GEOMETRY-CONSTRUCTS`) — which is a namespace of its own
(`LAYOUT-ZONE-NAMESPACE`): every member is genre-independent and no genre may redefine one.
Typed-block children (`field`, pipe rows, `signal`, …) are legal only
inside their region.

**Hybrid panels (one `.fd` → one SVG).** Use **multi-section `MULTI-FIGURE-DOCUMENTS`**: a
later `figdown 0.1 <genre>` starts a new section with its own genre and
id space; sections stack vertically. Example: a scene section, then
`figdown 0.1 table` and the rule tables. Nested `table`/`bitfield` under
a single scene header may still parse (legacy), but it is **not** the
main-standard teaching path — do not write new documents that way.

## Step 3 — Express the meaning with existing constructs

Work down the intent index before wanting new syntax:
**[expressing.md](expressing.md) is the single place to look.** It has one row
per intent — "I need to show X → use Y" — across structure, flow, data and
quantity, plus an honest list of what v0.1 cannot express and the sanctioned
interim for each. The [pattern library](../examples/patterns/index.md) has a ready
skeleton for most of those rows.

(This step used to carry its own shorter table. It was a partial duplicate —
each list held intents the other lacked, so reading either one left a gap.
Everything it held is now in expressing.md.)

Two rules while expressing:

- **Meaning in text, geometry to the engine.** Never encode knowledge
  only in color or position; if a color classifies, it must ride on a
  `class`.
- **Validate as you go**: `node tools/build-svg.js X.fd` — errors are
  `Line N: message`; the grammar is closed, so a clean build means the
  document is fully understood.

Layout not readable after Step 3? Start with a `flow` line (the direction is
the highest-value layout intent you can state in one line), then see
[layout.md](layout.md) for the full escalation ladder
(`flow` → `rank` → `pin`) and patterns by figure family.
`pin` is the top rung: the fourth — `routing` and `path` — was WITHDRAWN from
the language (`EDGE-GEOMETRY-CONSTRUCTS`) with no replacement spelling. Edges are
routed by the engine, so when `pin` is not enough the remaining moves are
content-zone or structural (layout.md §2, §8), and the unserved need is
recorded at spec core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**.

**None of that ladder applies to a `sequence` section.** Both of its axes are
already ordered by the source — columns are `lifeline` declaration order, rows
are `message` ∪ `state` declaration order — so `flow` and `rank` are not words
in that genre at all, and a `pin` parses and moves nothing. If a ladder reads
badly, the edit is to the **source order**, not to a layout line.

## Step 4 — Nothing fits? The escalation guideline

1. **Check it is a *meaning* gap, not a convenience gap.** Test:
   express it with existing constructs as best you can, then strip all
   presentation (`pin`/`fill`) — is knowledge actually
   missing, or just prettiness? "More typing" is not a gap
   (composition beats vocabulary, `NEW-CONSTRUCT-EVIDENCE-GATE`).
2. **Check the open-questions list** — spec §9 tracks known
   gaps with their current sanctioned workarounds. If yours is there,
   use the workaround and add your sample to that discussion: corpus
   evidence is exactly what moves an OQ through the gate.
3. **Never block on the gap.** State the missing meaning in plain
   text meanwhile (a label, a `description=`, a `#` comment marking the
   spot) so no knowledge is lost while the language catches up — and
   never invent syntax: unknown lines are errors by design.
4. **File a syntax-proposal issue** (the issue form mirrors the
   [PROCESS](../.github/CONTRIBUTING.md) gate): the meaning you cannot express ·
   your best attempt and exactly what it loses · real de-identified
   samples with rough frequency · prior art you know of. Proposals
   arriving with evidence get rulings fastest. If what you cannot
   express is a figure genre's interpretation method — states, entities,
   gates, participants, and similar genre-native reading vocabulary —
   say so explicitly in the proposal: genre-interpretation loss counts
   as a semantic gap (`GENRE-EARNING-THRESHOLD`), and the construct shape to propose is a
   typed block like `bitfield`, not a new header genre. General
   constructs give you a working approximation today (the ladder's first
   rung); the genre construct is the upgrade path that evidence unlocks.
5. **New *genre* requests have the highest bar** — a genre is
   only a defaults bundle (`GENRE-NAMESPACE`), so if what you miss is a construct,
   propose the construct. A genuinely new genre needs corpus
   evidence AND semantics no existing construct can carry (`NEW-CONSTRUCT-EVIDENCE-GATE`).

## Step 5 — What happens to your proposal

Per [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md): triage → prior-art/corpus
survey → maintainer ruling with the evidence chain, recorded
permanently (rejections too) in the decision log. Adopted syntax
lands with a migration entry and conformance fixtures in the same
change — your documents never silently break.

## Keeping an out-of-scope figure: the raster-fallback obligation

Some figure types are outside FigDown's scope (charts, electrical
schematics — see spec §9 and the maintainer rulings). When you keep
such a figure as its original raster image, the document **MUST** carry
the figure's knowledge in machine-readable text alongside the image.
Add a table or prose that states the data points, thresholds,
transitions, and relationships the original conveys. An AI agent
reading the Markdown must be able to recover the figure's meaning from
text without rendering the raster — "keep the picture but lose the
knowledge" is the exact failure FigDown exists to prevent (`IMAGE-LOCKED-KNOWLEDGE`/`ELECTRICAL-SCHEMATIC-SCOPE`).

This obligation is normative: documents that claim FigDown-compliant
knowledge management must satisfy it for every out-of-scope raster they
retain.
