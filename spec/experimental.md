# FigDown v0.1 — the EXPERIMENTAL constructs

> Status: **EXPERIMENTAL / EXPERIMENTAL throughout**. Every construct defined in
> this file is **outside the v0.1 conformance surface** and **outside the
> compatibility promise** (`CONSTRUCT-STATUS-TIERS`, 0.1; core
> [§10](core.md#10-keyword-registry-conformance-modes-extensions)). An
> implementation MAY support any of it; none of it is required **for a
> document to be portable**, and any of it may change or be withdrawn in a
> later `0.x` **without a migration entry**. A document that uses any of it
> is not a portable v0.1 document.
>
> **One exception, measured and stated: an implementation
> that skips this file entirely CANNOT pass the normative conformance
> suite.** 17 of the 165 fixtures in `conformance/cases/` write an
> experimental keyword at line start. See §E0.1 for the list and for what
> a skipping implementation should do instead.

## E0. What this file is, and why it is a separate file

Four constructs live here — the keywords **`plane`**, **`bundle`**,
**`threshold`** and **`band`**, with the option keys that only they accept
(`plane=`, `z-index=`, `extend=`, `offset=`). Until this release they were
defined inline in [core.md](core.md) and in
[genres/block.md](genres/block.md), interleaved with the frozen material and
distinguished only by a status marker in the prose.

**The 0.1 isolation ruling separates frozen from experimental at the
FILE level**, so that a user or an agent who does not want experimental
constructs can ignore whole files rather than filter sentences. The test the
split has to pass is the `GUI-WRITEBACK-STRUCTURE` strip test applied to documentation:

> **Delete the experimental file set. What remains must still be a complete,
> self-consistent standard with no dangling normative references.**

The experimental file set is this document and its twin,
[genres/experimental/](genres/experimental/), `conformance/experimental/`
and `examples/reference/experimental/`. `tools/isolation-check.js --strict`
is the gate that tests the criterion mechanically, and it is run with every
other gate.

**Complete isolation does not mean the frozen files never mention these four.**
The registry in core §10 must still list them — a closed language has to say
what exists — and the frozen genre documents still carry a vocabulary row per
construct so that a reader meeting one in the wild can find out what it is.
What the frozen set may not do is **define** any of them, or **depend** on any
of them: no normative sentence in a frozen file requires this file to be read
in order to be complete. Every frozen mention is marked EXPERIMENTAL and points
here.

**What EXPERIMENTAL is not.** It is not deprecation and not a warning about
correctness; it is a statement that the construct has **not converged**. The
engine has no warning channel — an experimental construct parses silently and
renders — so this marking is the only signal an author or an authoring agent
gets. It is documentary by design (`CONSTRUCT-STATUS-TIERS`). An agent generating a portable figure
SHOULD restrict itself to the NORMATIVE surface, which is core plus the frozen
genre documents and nothing here.

**None of these four is deprecated and none is removed.** The reference engine
accepts all four unchanged, every document that uses them keeps parsing and
rendering, and **no `.fd` needs rewriting** — including for the 0.1 file
move, which changed documentation paths and not one byte of the language.

**The file held six until this release.** `path` and `routing`, with their option
keys `points=`, `tailport=`, `headport=` and `routing=`, were **WITHDRAWN from
the language** by `EDGE-GEOMETRY-CONSTRUCTS`; the engine now rejects all six spellings with a
diagnostic that names **no replacement**, because there is none. That is the
first exercise of the withdrawal power this file's status paragraph reserves,
and §E7 records what it cost. The evidence is
[migrations.md](migrations.md) 0.1, [core.md](core.md) §9 **`EDGE-IDENTITY-AND-GEOMETRY`**,
and `decisions/registry.md`
**§E4 is not reused.** It defined those two, and its number is left vacant
rather than closed up, so that every citation of §E1–§E3 and §E5–§E7 written
before this release still resolves to the section it was written about.

### E0.1 The skip promise, and where it does not hold

The isolation ruling promises that deleting the experimental file set
leaves a complete standard, and `tools/isolation-check.js` proves it for
the DOCUMENTS. It was read — including by this file — as also promising
that an implementation could skip experimental material and still conform.
**That second reading is false, and this section is the correction.**

**17 of the 165 normative fixtures write an experimental keyword at line
start**, so an implementation that rejects those keywords as unknown fails
all 17: on the error fixtures it emits a different message (`unknown
keyword` where the golden says `bundle needs an id`), and on the model
fixtures it emits an empty array where the golden carries members.

| fixture | kind | experimental keywords it writes |
|---|---|---|
| `112-lex-extra-args-every-directive` | errors | `band`, `signal`, `threshold`, `timing` |
| `115-lex-option-before-label` | model | `band`, `bundle`, `plane`, `threshold` |
| `118-id-quoted-positions` | errors | `bundle`, `plane`, `timing` |
| `119-id-double-dash` | errors | `bundle`, `plane` |
| `121-positional-quotes-scene` | errors | `plane` |
| `123-comma-list-one-token` | errors | `bundle` |
| `214-label-absent-vs-id` | model | `bundle`, `plane`, `signal`, `timing` |
| `215-label-empty-string` | model | `bundle`, `plane`, `signal`, `timing` |
| `304-presentation-on-every-element` | model | `band`, `bundle`, `plane`, `signal`, `threshold`, `timing` |
| `305-presentation-carve-outs` | errors | `signal`, `timing` |
| `306-presentation-value-errors` | errors | `band`, `bundle`, `threshold` |
| `414-block-id-cross-kind-collision` | errors | `signal`, `timing` |
| `478-typed-block-style-retired` | errors | `signal`, `timing` |
| `901-errors-child-outside-block` | errors | `signal` |
| `905-errors-retired-text-option` | errors | `band`, `bundle`, `threshold` |
| `906-errors-needs-id` | errors | `bundle`, `plane`, `timing` |
| `911-errors-retired-option-keys` | errors | `band` |

**Why they are like that, and why it is not simply a mistake.** Every one
of the 17 is a **cross-cutting lexical** case: its subject is a rule that
quantifies over the whole keyword registry — "an option may precede a
label on any directive", "every directive rejects the retired `text=`",
"a positional id may be quoted anywhere it is legal", "every element that
takes presentation keys takes them the same way". A fixture for a rule of
that shape earns its coverage by ENUMERATING the registry, and the
registry has experimental rows in it. Rewriting them over the frozen
registry alone is cheap per file and deletes exactly the coverage the
files exist to provide, so it was not done.

**What this means for an implementation, stated as a rule.**

- To claim **v0.1 parser conformance** — the 165 normative fixtures —
  an implementation MUST parse `plane`, `bundle`, `threshold` and `band`,
  and the `timing` genre with its `signal` child, at least well enough to
  produce their model shapes (§E5) and their error messages. **Skipping
  this file is not compatible with that claim.**
- To claim **support for the portable authoring surface** — every
  document a v0.1 author is taught to write — an implementation may skip
  the whole experimental set. No frozen document teaches these keywords
  and they are absent from the skill's frozen genre reference, which
  `tools/isolation-check.js` and `tools/skill-coverage.js` gate.
  **This is a claim about what is TAUGHT, not about what exists on disk.**
  Eight in-repo figures outside `examples/reference/experimental/` use one
  of the four — `partition-map` and `evpn-fabric` and `srl-evpn-irb` and
  `patterns/topology-b`, plus the four `layout-compare` variants of the
  last two — so an implementation that skips this file cannot render this
  repository's own `examples/` directory in full. That is the honest
  measure of "portable surface": it is the surface an author is taught,
  and the project's own showcase reaches past it.
- These are **two different claims**, and until this release this file
  offered only one sentence for both. The second is the one the isolation
  ruling actually established.

The corresponding false clause in core §12.2 — that `thresholds`, `bands`
and `bundles` are "empty on the normative surface" — is corrected in the
same release; four of the 17 populate them.

| Construct | Namespace | Where its registry row is | Where its model shape is |
|---|---|---|---|
| `plane` (+ `plane=`, `z-index=`) | scene (§E1) | core §10 (b), (b′) | core §12.2 *Plane* (the implicit `base` half is normative) + §E5 |
| `bundle` | scene / `topology` vocabulary (§E2) | core §10 (b) | §E5 |
| `threshold` (+ `offset=`) | scene (§E3) | core §10 (b) | §E5 |
| `band` (+ `extend=`) | scene (§E3) | core §10 (b) | §E5 |

One fact about belonging survives the move unchanged, and it is stated in
core because it is a statement about the LANGUAGE rather than about these
constructs:

- **The four scene constructs share a namespace whose other seven members are
  frozen.** `node`, `group`, `external`, `edge`, `class`, `flow` and `rank`
  are NORMATIVE and are the frozen `block` genre's vocabulary. Extracting
  `threshold`/`band`/`bundle`/`plane` into this file changes nothing about
  the seven, and [genres/block.md](genres/block.md) remains the complete,
  self-contained normative home of the scene genre without this file.

**The layout-zone namespace of `LAYOUT-ZONE-NAMESPACE` no longer has an experimental member.** With
`path` and `routing` withdrawn the zone's own membership is `pin`
alone, NORMATIVE (core §10 (a′); the opener `layout` is a `UNIVERSAL-CORE-KEYWORDS` structural marker, not
a directive inside the zone). `LAYOUT-ZONE-NAMESPACE` itself is unchanged and stays whole in
core §1 — it fixes the zone's membership so that `GENRE-NAMESPACE`'s default, a reading agent
ignoring the layout zone entirely, has no crack in it. The clause's own
"status and belonging are orthogonal" reasoning is preserved there: it was
written about `path`/`routing`, and it is the record of what the project
foresaw before the withdrawal, not a claim about the current membership.

## E1. `plane` — paint-order planes (`PRESENTATION-CONTROL-TIERS`)

*Relocated here from core §2.4 and
[genres/block.md](genres/block.md) §2.4, unchanged.*

The `plane` keyword, its option key `z-index=` and the option key `plane=`
that references a declared plane are all EXPERIMENTAL. Both the keyword and the
option key were spelled `layer`/`layer=` until this release (`PLANE-KEYWORD-SPELLING`); the old
spellings are line errors naming their migration.

```figdown
plane overlay "LSP paths" z-index=2
edge r1 -> r2 plane=overlay stroke=#dc2626
```

Planes are author-facing organizational units; `z` order among planes is
explicit, document order within a plane is paint order — **a later line
paints on top (closer to the viewer)**, so line order itself is the
implicit z within a plane. `z-index=` accepts integers only; a non-integer
value (e.g. `z-index=1.5`) is a line error.

**Default `z`** (`PLANE-Z-INDEX-DEFAULT`). Every element belongs to a plane and every plane
has a `z`, so the defaults are normative for anyone who implements the
construct at all, not implementation choices:

- The implicit `base` plane — the plane of every element that writes no
  `plane=` — is **`z = 0`**. It is always present; a document never
  declares it.
- A `plane` line **without** `z-index=` takes its **1-based position among the
  declared planes**: the first `plane` line is `z = 1`, the second
  `z = 2`, and so on. The position counts *declared* planes in document
  order, `base` excluded.
- An explicit `z-index=` **overrides** that default for its own line and does
  **not** shift the positions of the planes around it. So
  `plane a` / `plane b z-index=10` / `plane c` yields model `z` = 1, 10, 3.
- `z` values need be neither unique nor contiguous; ties keep document
  order (the same "later line paints on top" rule as within a plane).

**What does NOT move with the keyword.** The implicit `base` plane and the
model's `planes` array are **normative** and stay in core (§12.2 *Plane*,
§12.4): every document has `planes[0] = {id:"base", z:0}` and every `node`
and `edge` reports `plane: "base"`, so a reader restricted to the normative
surface needs no new case and never has to open this file. Only the
DECLARED plane — the directive, its `z-index=`, and the `plane=` reference —
is experimental.

**Why `plane=` is demoted even though five normative directives accept it.**
A keyword and its only declaration point move together: `plane=` can only
name a plane some `plane` line declared, so in a document that may not
declare one it could only ever name the implicit `base` — an option with
exactly one legal value, which is not an option. `z-index=` follows for the
same reason, being accepted by `plane` alone.

## E2. `bundle` — one logical bundle of links (`topology` vocabulary)

*Relocated here from core §2.5 and
[genres/block.md](genres/block.md) §2.5, unchanged. The genre document that
owns it is [genres/experimental/topology.md](genres/experimental/topology.md),
itself experimental.*

`bundle` is demoted because it is `topology` vocabulary and `topology` is
itself an experimental genre: measured over the 50-document in-repo corpus,
`bundle` appears in four documents and every one of them is a `topology`
document, so it belongs to no normative genre's minimum set.

```figdown
bundle es1 "ES-1 / LAG-1" bd24a--srv,bd24b--srv stroke=#0ea5e9
```

The member list is ONE comma-delimited token, so it
terminates at whitespace instead of resting on the `A--B` shape test alone.
The whitespace-separated form (`bd24a--srv, bd24b--srv`) was **RETIRED** (`COMMA-LIST-WHITESPACE`/`POSITIONAL-LIST-SPELLING`) and is now the line error `bundle members take ONE
comma-delimited token: write bundle b1 "LAG" a--c,b--c — the space form is
retired (MIGRATIONS 0.1)`. One policy governs every comma list in the
language — a list is ONE whitespace-free token — because it is the only
policy under which a positional list terminates, leaving the rest of the
line reservable for future `key=` options; `bundle` is held to it exactly as
`rank` and `width` are. The earlier ruling that the space forms were "NOT
deprecated" (`POSITIONAL-LIST-SPELLING`) rested on measured migration cost, and cost is not a
language argument before the freeze.

Declares that the listed links form **one logical bundle** — the neutral
umbrella term (LAG, Ethernet Segment, port-channel, multi-chassis
trunk…; the label says which). The label is optional; when omitted the
bundle's id is used as the rendered label. The renderer **derives** the
conventional dashed ellipse around the member links — no coordinates
involved, and the ring follows the nodes wherever they move. Members
must reference existing edges (line error otherwise), and a member
reference `A--B` must resolve to a **unique** edge — parallel edges
between the same endpoints are out of scope for v0.1 and referencing
them is an error. This is the semantics-first rule (`DOMAIN-CONVENTION-DIRECTIVES`): name the
*meaning* and the engine owns the drawing convention.

A `bundle` member is matched **without** regard to the order its endpoints
were written or the operator that joined them: `a--b`, `b--a` and `a -> b` all
resolve to the same edge, so a bundle names the *link* and not the text that
declared it. (Until this release this property was stated as a contrast with
`path`, which matched its edge as written; `path` was withdrawn from the
language by `EDGE-GEOMETRY-CONSTRUCTS`, and the property stands on its own.)

## E3. `threshold` and `band` — scalar markers and zone bands (generic)

*Relocated here from core §2.6 and
[genres/block.md](genres/block.md) §2.6, unchanged.*

`threshold` was spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`) and
`line` before that; `band` was spelled `fill` until this release and gained a
MANDATORY quoted label (`BAND-LABEL-STATUS`). Every old spelling is a line
error naming its migration.

```figdown
threshold "Max cap"                in=buf offset=80%
threshold "Reserved {port, queue}" in=buf offset=15%
band "Reserved" 15% in=buf fill=#a3c93a
```

- `threshold` is a **pure marker**: a horizontal line across the target's
  box at a percentage of its height (bottom = 0%). No id — nothing
  references a threshold. Covers thresholds, waterlines, caps, future chart
  markers (`NEW-CONSTRUCT-EVIDENCE-GATE`: this one directive replaced a would-be genre). The quoted
  label is MANDATORY.
- **`threshold` takes no `value=` and no `ref=` (`THRESHOLD-VALUE-SCOPE`).** The rename did not
  change its shape. **Zero** figures in the measured corpus carry a literal
  numeric value on a mark: every reference is a named, software-configurable
  register, and that name already lives in the mandatory label. `offset=` is
  a fraction of the target's rendered extent, **not a value of any
  quantity** — the target declares no scale (core §12.7) — though the relative
  ORDER of two thresholds on one target IS knowledge.
- **Why `guide` went (`THRESHOLD-KEYWORD-SPELLING`).** `guide` was an **inverted** name: in
  Illustrator, Inkscape, Figma and draw.io a *guide* is an author-only
  construction line that is NEVER rendered, while FigDown's is drawn
  output — and `UNSAFE-DEFAULT-ELIMINATION` rates an inverted name worse than an unfamiliar one. It
  was also a FigDown coinage, which `SIZE-AND-DIRECTION-KEY-NAMING` makes a last resort. `threshold`
  comes whole from **Grafana**, whose threshold render option is literally
  *"Show thresholds: as lines / as filled regions / as both"* — FigDown's
  marker + region pair, split the same way — with **IETF RED/AQM**
  `min_th`/`max_th` (RFC 2309, RFC 7567) as the secondary source and
  exactly what the corpus's WRED figures transcribe. The model array
  `guides[]` is renamed `thresholds[]` with the keyword (`NORMATIVE-SEMANTIC-MODEL`).
- `band` is a **range band** carrying a MANDATORY quoted label written
  FIRST, then the range positionally: `band "Reserved" 15%` = 0–15%
  (the common case needs one number); `band "Headroom" 15..35%` = an
  explicit range in one token. **The separator is `..`
  (`RANGE-SPELLING`)**: FigDown has ONE range grammar, single-sourced from Ada
  (ISO/IEC 8652) and Pascal (ISO 7185), both inclusive, and the hyphen form
  `15-35%` it replaces is a line error with a named diagnostic — between two
  numbers a hyphen reads as subtraction. Stackable. `extend=up|down|left|right` picks
  the measuring axis and its 0% edge (default `up`: 0% at the bottom —
  the waterline convention; `right` gives progress-bar style bands).
  The key was spelled `dir=` until this release; it was renamed because
  HTML's `dir` attribute means TEXT WRITING DIRECTION, and one spelling
  with two meanings is what `UNSAFE-DEFAULT-ELIMINATION` forbids. Threshold and band are decoupled
  concepts.
- **The `band` label is MANDATORY, and that is a defect fix (`BAND-LABEL-STATUS`).** Until then `band` had no label slot at all, and earlier
  editions of this section recorded that as if it were a design feature —
  "a zone band carries no label" — which was FALSE as a justification. A
  band's complete model was `{target, from, to, extend, fill, line}`; strip
  `fill=`, which core §5 and `PRESENTATION-AS-MEANING-CARRIER` entitle any reader to discard as
  presentation, and a band asserted **nothing whatsoever** — its meaning rode
  on colour alone, which core §5 declares must never happen. Every interval
  region in the measured corpus is a *named* one (Headroom/Share/Guarantee,
  Latency/Block/Transmit, G/Y/R), and the buffer-region figure that
  motivated this was forced to carry those names in three `class`
  declarations all literally spelled "region". The label is written FIRST
  because that is the position every other labelled directive in the
  language uses (`node`, `group`, `external`, `bundle`, `threshold`), so
  one reader rule covers the whole vocabulary and the sibling pair reads the
  same way. The text channel came with the label — and 0.1 then
  removed that channel from the whole language (`COLOUR-KEY-STATUS`), so a band's label
  takes the derived colour like every other label. A `band`
  line with no quoted label is a line error naming the migration; the
  migration tool reports it and refuses to invent a name.
- **Scope follows the meaning (`AUTHORING-INTENT-OVER-RENDERING`)**: both directives take a **group**
  or a **single node** as their target, and the pair is symmetric.
  Attach to the *group* when the semantics are global ("one threshold
  config referenced by all columns"); attach to a
  *node* when the semantics are genuinely per-element
  (`band "Share" 15..35% in=g2`, `threshold "watermark" in=g2` — e.g. one
  column's occupancy watermark). The writer chooses the scope that
  states their intent; the renderer treats both identically.

**Both stay EXPERIMENTAL, deliberately.** They are the `GENRE-EARNING-THRESHOLD` *interim
general constructs* for the candidate genre in core §9 — "a quantity extent
carrying named reference values and named regions". `GENRE-EARNING-THRESHOLD` forbids
over-stretching a general construct to satisfy a genre-shaped need
("approximating a genre with general block-and-edge draws a similar
picture while discarding the meaning: 'looks right' is not 'expressed'"),
and it supplies the interim in the same breath: general constructs "let
the user at least draw the figure they want to express, so authors are
never left without a way forward." Freezing these two would bind two
scene constructs to the compatibility promise and foreclose the genre
design; the 0.1 renames correct DEFECTS in them (an inverted name,
a construct that could carry no meaning) without promoting them. A defect in
an experimental construct is still a defect, which is why the rename and the
mandatory label landed anyway.

## E5. The semantic model of the four

*Relocated here from core §12.2, unchanged. Core §12 remains
the normative contract for the model as a whole, and its Document table still
lists the top-level keys below — a closed model has to say what exists.
Everything here is the shape of a key a normative-surface reader never meets
in a document that stays inside the surface.*

**Experimental does NOT mean unmodelled.** All four project into the canonical
model exactly like anything else, and `conformance/normalize.js` implements
that projection. What they lack is a conformance obligation.

The top-level keys, as core §12.2 lists them:

| key | present | note |
|---|---|---|
| `planes` | always, never empty | the ARRAY is NORMATIVE — `planes[0]` is the implicit `base`; only a DECLARED plane is EXPERIMENTAL |
| `thresholds` | always (MAY be empty) | the array is empty in every document on the normative surface |
| `bands` | always (MAY be empty) | same |
| `bundles` | always (MAY be empty) | same |

**Threshold** — `threshold` (§E3). The directive and the model array were
spelled `guide` / `guides` until this release (`THRESHOLD-KEYWORD-SPELLING`); `NORMATIVE-SEMANTIC-MODEL` makes the model
normative, so the array rename is part of the migration, the precedent
being `sizes[].w` → `.width` (an array 0.1 then merged into `pins`
entirely, `ELEMENT-GEOMETRY-DIRECTIVE`) and `text` → `color` (a key 0.1 then
removed from the model entirely, `COLOUR-KEY-STATUS`).

| key | type | present | meaning |
|---|---|---|---|
| `label` | string | always | MANDATORY on the directive, so never absent. Core §12.7 licenses exactly one reading of it: the value it names is a reference value on the `in=` target |
| `in` | string | always | the target: a node id OR a group id |
| `offset` | number | always | a fraction of the target's rendered extent, `0`–`100`, **without** the `%` sign; MAY be fractional. It is **not a value of any quantity** — the target declares no scale (core §12.7). The model key follows the source key, renamed from `at` at 0.1. The relative ORDER of two thresholds on one target, by this key, IS knowledge (core §12.7) |
| `fill` `stroke` `style` | string | when written | core §5 |
| `plane` | string | when written | **not** materialized |
| `line` | number | always | 1-based source line |

**Band** — `band` (§E3).

| key | type | present | meaning |
|---|---|---|---|
| `label` | string | always | MANDATORY since 0.1 (`BAND-LABEL-STATUS`), so never absent. Before that a band had NO label key, and with `fill=` discarded it asserted nothing at all (core §5) |
| `in` | string | always | the target: a node id OR a group id |
| `from` `to` | number | always | the range as percentages without the `%` sign; `band "R" 15%` yields `from: 0`, `to: 15` |
| `extend` | `"up"`\|`"down"`\|`"left"`\|`"right"` | always | materialized default `"up"`. Spelled `dir` in both the source and the model until 0.1 |
| `fill` | string | always | materialized (see the caveat in core §12.4) |
| `stroke` `style` | string | when written | core §5 |
| `plane` | string | when written | **not** materialized |
| `line` | number | always | 1-based source line |

**Bundle** — `bundle` (§E2); the
`bundles` array is always present and is empty in a document that
declares none.

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | unique in the bundle namespace |
| `label` | string | when written | core §12.3 |
| `members` | array of string | always | one `"a--b"` string per member, endpoints in the order the member was written |
| `fill` `stroke` `style` | string | when written | core §5 |
| `plane` | string | when written | **not** materialized |
| `line` | number | always | 1-based source line |

**Plane** — the DECLARED plane, `plane` (§E1). The *Plane* element itself and
the `planes` array stay in core §12.2, because the implicit `base` is
normative; what is experimental is every plane a document declares, and the
`label` key, which only a `plane` line can write.

A *Plane* carries **no** `line`: the engine records none. Declaration
order is preserved by array position, which is also what the default `z`
counts. The element and its model field were named `Layer`/`layer` until this release (`PLANE-KEYWORD-SPELLING`); a model key rename is normative (`NORMATIVE-SEMANTIC-MODEL`), so a second
implementation emits `plane`.

**The `plane` REFERENCE on other elements.** `node.plane` and `edge.plane`
are materialized to `"base"` and are therefore normative; on `group`,
`external`, `bundle`, `threshold`, `band` and `class` the key is omitted
when absent (core §12.4 rule 1). A value other than `"base"` can only come
from a `plane=` written against a declared plane, so it can only appear in a
document that is already outside the surface.

## E6. Where the frozen files still name these four

A closed language has to say what exists, so the frozen set names all four —
and never defines them. Each of these is a registry row or a marked
cross-reference, and each points here:

| Frozen file | What it says about the four |
|---|---|
| [core.md](core.md) §2.4–§2.6 | one marked pointer each, to §E1–§E3 |
| [core.md](core.md) §5 | which directives accept `fill=`/`stroke=`/`style=`/`plane=` — acceptor rows, marked |
| [core.md](core.md) §9 | the `GENRE-EARNING-THRESHOLD` candidate genre that `threshold`/`band` stand in for as interim general constructs (§E3) |
| [core.md](core.md) §10 | the **registry**: one row per keyword and per option key, with its EXPERIMENTAL status. This is the enumeration the isolation ruling explicitly preserves |
| [core.md](core.md) §12 | the Document key list and the normative `planes`/`base` half of the plane model |
| [genres/block.md](genres/block.md) | one vocabulary row per construct, marked EXPERIMENTAL, pointing here — so a reader who meets one in a scene document can identify it without leaving the genre document |
| [genres/README.md](genres/README.md) | the count of demoted constructs and what a demotion means |

Three rows left this table with the constructs they were about,
and are recorded here so the deletion is not silent: core §1 (`UNIVERSAL-CORE-KEYWORDS`, `LAYOUT-ZONE-NAMESPACE`) named
`path`/`routing` as EXPERIMENTAL members of the layout namespace; core §3's `GUI-WRITEBACK-STRUCTURE` strip
set named `routing`/`path` alongside `pin` as carrying no meaning; and core §9
carried **`EDGE-GEOMETRY-CONSTRUCTS`**, the `path`/`routing` language-wide reservation. All three
frozen clauses survive — `LAYOUT-ZONE-NAMESPACE`, the strip set and the open-question section are
frozen text — but none of them names an experimental construct any more. The
reservation `EDGE-GEOMETRY-CONSTRUCTS` recorded is discharged — the spellings are released — and
the open question the withdrawal leaves in its place is **`EDGE-IDENTITY-AND-GEOMETRY`** (core §9).

## E7. Migration and stability

Nothing in this file carries the compatibility promise, and that is the
point of the file. Concretely:

- A change here needs **no** `migrations.md` entry (`CONSTRUCT-STATUS-TIERS`, core §13.3). Entries
  have nonetheless been written for every change these constructs have had —
  `guide` → `threshold`, `band`'s mandatory label, `layer` → `plane`,
  `via`/`src`/`dst` → `points`/`tailport`/`headport`, and the 0.1
  withdrawal itself — because accumulating migrations is the rehearsal for
  v1.0's machinery (core §13.4), not because they were owed.
- Promotion is possible and has precedent in the other direction: `stroke=`
  was demoted by `CONSTRUCT-STATUS-TIERS` and promoted back to NORMATIVE by `STROKE-KEY-STATUS` once its use was
  re-measured. A promotion moves the construct's definition OUT of this file
  and into the frozen set, and it is a migration entry like any other.
- **Withdrawal is the case this file exists to make cheap, and it
  stopped being hypothetical.** `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and `routing`, with their
  option keys `points=`, `tailport=`, `headport=` and `routing=`, from the
  language: two of the six constructs this file defined, leaving four. The
  file-level isolation is what made it cheap — the constructs were defined in
  one place, so the removal is a deletion here plus registry rows in the frozen
  set, and `tools/isolation-check.js --strict` still passes because deleting the
  experimental file set must leave a complete standard, which is what it tests
  on every run.
- **A withdrawal, unlike every retirement before it, has no replacement
  spelling — so it has no mechanical migration.** Every earlier retired
  spelling in this project is a RENAME: `layer` → `plane`, `guide` →
  `threshold`, `dir=` → `extend=`, `via=`/`src=`/`dst=` →
  `points=`/`tailport=`/`headport=`. Each has a target, so
  `tools/migrate-figdown.js` can rewrite the line and the rendered output is
  unchanged. A withdrawal has no target. The correct action on a `path` or
  `routing` line is to **delete** it, and deleting it **changes the rendered
  output** — the edge falls back to auto layout. A tool must not do that
  silently, so the migration tool **reports** these lines and leaves them for a
  human; the engine's diagnostic names no replacement, because naming one would
  be a lie.
- **The freeze contract is not breached by this, and the reason is the
  reason this file exists.** The promise of mechanical migration covers
  **frozen** constructs. `path` and `routing` were EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) and outside the v0.1 conformance surface for twenty-four
  dev releases before they went; the status paragraph at the top of this file
  says in terms that any of it "may change or be withdrawn in a later `0.x`
  **without a migration entry**". An entry was written anyway,
  and it reports rather than rewrites.
