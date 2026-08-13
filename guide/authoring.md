# Authoring SOP — from "I need a figure" to the right FigDown

> Audience: **humans** (and agents) deciding how to express a figure.
> Companion to [agents.md](agents.md) (the agent workflow)
> and [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) (how the language changes).
> Once you have chosen a genre below, consult [expressing.md](expressing.md) for a one-line "I need to show X → use Y" lookup.

## Field-tested pitfalls (quick reference)

For the full explanation of each entry see the per-genre reading files: scene
pitfalls in [read/0.2/scene.md](../read/0.2/scene.md), bit-numbering in
[read/0.2/bitfield.md](../read/0.2/bitfield.md), arrangement in
[read/0.2/layout.md](../read/0.2/layout.md).

| Symptom | Correct spelling |
|---|---|
| Bit ruler reversed vs source figure | `numbering=` is required — read it off the source: `lsb0` draws N-1…0 L→R (hw register), `msb0` draws 0…N-1 L→R (IETF RFC). It relabels the ruler only: fields are declared L→R under both, so `lsb0` means declaring MSB-first (`DECLARATION-ORDER-SEMANTICS`) |
| Containment drawn as an invented edge A → sub-block | `group` + `in=` on member node; `gap=0` for flush stacking |
| Dashed/colored frame "not supported" | `style=dashed`, `fill=`, `stroke=` are legal on any element including groups, and all three are NORMATIVE since 0.1 (`STROKE-KEY-STATUS`). There are exactly TWO paint channels, SVG's own: `fill=` is the interior, `stroke=` the outline of a shape and the WHOLE of a line — so an `edge`/`bundle`/`threshold` takes `stroke=` and never `fill=`. There is no label-colour key: `color=`/`text=` are retired line errors and the label colour is derived from the background (`COLOUR-KEY-STATUS`/`LABEL-COLOUR-SOURCE`) |
| Yes/No decision edges lose colors | An edge is a line with no interior, so `fill=` cannot paint it — `stroke=` does. Declare `class yes "…" stroke=…` and `class no "…" stroke=…`, then tag edges `class=yes` / `class=no`. Keep `fill=` on the same class only if nodes join it too (it paints members that have an interior). A `fill=`-only class joined by an edge is a line error (`INTERIOR-LESS-ELEMENT-PAINT`/`CLASS-PAINT-REQUIREMENT`) |
| Literal `\n` shows in label | `\n` works only inside quoted strings: `node a "Line one\nLine two"` |
| Inventing label for an unlabeled shape | Never fabricate. Shape has NO text in the original → `node a ""` (records `label: ""`, draws blank). Label merely unknown/unreadable → omit it and flag in a `#` comment (the id renders as a placeholder). A cloud in the source is `shape=ellipse` with what it is in the label — `shape=cloud` was retired at 0.1 (`SHAPE-ENUM-VOCABULARY`: geometry only) |
| External I/O as a fake node | Use `external <id> "label"` — never drawn as a shape, edge ends open |
| Shared bus flattened to point-to-point star | Model as ONE intermediate node fanning out (mid-edge taps pending, `TAP-VERSUS-JUNCTION-SPELLING`) |
| Topology/hierarchy figure comes out scrambled | Add `pin` hints + `flow` direction; auto-layout alone won't reproduce a specific arrangement |
| Byte-block header forced into `bitfield` | No bit scale → use a single-row `table` or `node` sequence to avoid a misleading bit ruler |
| `node` under `figdown 0.1 bitfield` (or `table`) | Genre allowlist (`GENRE-KEYWORD-ALLOWLIST`): scene keywords are illegal there — use `block` / multi-section, or pure bitfield/table only |
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
[`read/0.2/transcribe.md`](../read/0.2/transcribe.md).

## Step 2 — Pick the genre (main standard first)

| The figure is about… | Genre | Status |
|---|---|---|
| bit positions in a packet header / register | `bitfield` | **MAIN STANDARD** (NORMATIVE) |
| rows × columns of values (configs, states, maps) | `table` | **MAIN STANDARD** (NORMATIVE) |
| components, containment, dataflow — box-and-wire | `block` | **MAIN STANDARD** (NORMATIVE) |
| devices and the links between them | `topology` | EXPERIMENTAL — prefer `block` when portable |
| steps, decisions, and control flow | `flowchart` (defaults `flow down`; owns `process` / `decision` / `terminator`) | EXPERIMENTAL — prefer `block` + `flow down` when portable |
| states a machine is IN, and transitions between them | `statechart` (**needs `figdown 0.2`**; a node is a `state`, a connector a `transition`) | EXPERIMENTAL — prefer `block` when portable. Choose it only when a node is a **mode endured**, not a step performed: a retry loop is a `flowchart` however its title reads |
| signals changing over time cycles | `timing` | EXPERIMENTAL |

**Prefer the three main-standard genres** (`block`, `bitfield`, `table`)
for anything that must stay portable across implementations and across
v0.1. EXPERIMENTAL genres still parse and are not deprecated, but they
sit outside the compatibility promise (`CONSTRUCT-STATUS-TIERS`, spec §10) and may change
without a migration entry. Use them only when the figure truly needs
them and portability is not a goal.

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
