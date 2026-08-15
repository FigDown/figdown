# FigDown v0.1 — the EXPERIMENTAL constructs

> Status: **EXPERIMENTAL throughout**. Every construct defined in
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
> suite.** 23 of the 192 fixtures in `conformance/cases/` write an
> experimental keyword at line start. See §E0.1 for the list and for what
> a skipping implementation should do instead.
>
> **This file no longer DECLARES anything (`SUBJECT-VOCABULARY-SCOPE`).** Each
> surviving construct is declared by the one genre that has it, and this
> file records status, model and history. See §E0.

## E0. What this file is, and why it is a separate file

**Three constructs are recorded here — `bundle`, `threshold` and `band`,
with the option keys that only they accept (`extend=`, `offset=`) — and
this file DECLARES none of them.** Each is declared by
the one genre that has it, in that genre's own normative document:

| Construct | Declared by | Withdrawn from |
|---|---|---|
| `threshold` (+ `offset=`) | [genres/block.md](genres/block.md) | `topology`, `flowchart`, `statechart` (`SCENE-KEYWORD-MEMBERSHIP`) |
| `band` (+ `extend=`) | [genres/block.md](genres/block.md) | `topology`, `flowchart`, `statechart` (`SCENE-KEYWORD-MEMBERSHIP`) |
| `bundle` | [genres/experimental/topology.md](genres/experimental/topology.md) | `block`, `flowchart`, `statechart` (`SCENE-KEYWORD-MEMBERSHIP`) |
| `plane` (+ `plane=`, `z-index=`) | — | **WITHDRAWN FROM THE LANGUAGE** (`PAINT-ORDER-CONSTRUCT`) |

What stays here is what is not a genre's to say: the STATUS ruling that
separates frozen from experimental at the file level (this section), the
conformance consequence of it (§E0.1), the semantic model the constructs
project into (§E5), the register of where the frozen files still name
them (§E6), and the migration and stability contract (§E7).

**Why the declarations left (`SUBJECT-VOCABULARY-SCOPE`).** Until this release the
file defined `plane`, `bundle`, `threshold` and `band` for **all** the
scene genres at once. That made it a second shared surface beside core
§1's "scene keywords" sentence, and it carried the same defect: an
INTERSECTION written down as if it were a namespace. `GENRE-VOCABULARY-OBLIGATION` obliges a genre
to document its **complete** vocabulary — every keyword, option key, enum
value and default — in its own document; while four scene genres could
legally write `bundle` and none of them defined it, four genre documents
were incomplete **by `GENRE-VOCABULARY-OBLIGATION`'s own exchange condition**, and this file was the
reason. Core §1 now states the rule from the other end — a spelling
accepted by more than one genre is more than one declaration, never one
inherited — and this file stops being the counter-example to it. The
withdrawals do most of the work: after `SCENE-KEYWORD-MEMBERSHIP` each surviving construct has
exactly **one** declaring genre, so there is nothing left here for a
second genre to inherit even if the file offered it.

**The count of experimental core constructs: six → four → three.** The
file held **six** until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and
`routing` with their option keys `points=`, `tailport=`, `headport=` and
`routing=`; **four** until this release; and **three** now, because
**`plane` is WITHDRAWN from the language** by `PAINT-ORDER-CONSTRUCT` — the keyword, the
`plane=` option key that could only reference a declared plane, and
`z-index=`, which was legal on `plane` and nowhere else. The engine
rejects all three spellings with a diagnostic that names **no
replacement**, because there is none; that is the `path`/`routing` shape
from `EDGE-GEOMETRY-CONSTRUCTS`, and §E7 records what it costs. Evidence:
[migrations.md](migrations.md) 0.1 and 0.3,
[core.md](core.md) §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, `decisions/registry.md`
and `decisions/registry.md`/§4.6.
**§E1 and §E4 are not reused.** §E4 defined `path` and `routing`; §E1
defined `plane`. Both numbers are left vacant rather than closed up, so
that every citation of §E2–§E3 and §E5–§E7 written before this release
still resolves to the section it was written about.

**What withdrawing `plane` cost, measured.** Stripping
`plane overlay "VXLAN tunnels" z-index=2` <!-- fence-check: skip --> and the ` plane=overlay` it
supported from `examples/evpn-fabric.fd` and rebuilding produces an SVG
of **12449 bytes** — the same size as before. Of 198 markup tokens
exactly **one** differs, and it is `data-edge="36"` → `data-edge="35"`;
normalising that counter makes the two files byte-identical. The
overlay's whole visual identity — `stroke=#dc2626`, dashed — came from
`class=overlay`, which the figure had already declared. A construct whose
removal moves one index in the rendered output is not carrying the
meaning its declaration claimed. **What does NOT go with it** is the
implicit plane: `planes[0] = {id:"base", z:0}` is NORMATIVE and stays in core
§12.2, every `node` and `edge` still reports `plane: "base"`, and paint
order is **document order** — a later line paints on top. `RESERVED-SPELLINGS` records
the reservation should the need return: RFC 8345 §4.1/§6.1's `network`
is the word for a **layering relation**, and it reopens if a second and a
third figure need to assert that one set of nodes is supported by
another, and `class` is measured to be losing that claim.

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

**Complete isolation does not mean the frozen files never mention these
constructs.** The registry in core §10 must still list them — a closed
language has to say what exists — and it must list the WITHDRAWN
spellings too, because a withdrawal owes a named diagnostic exactly as a
rename does. What the frozen set may not do is **depend** on any of them:
no normative sentence in a frozen file requires this file, or an
experimental genre document, to be read in order to be complete. Every
frozen mention is marked EXPERIMENTAL and points at the declaring document.

**One frozen file DOES define, and that is the point of `SUBJECT-VOCABULARY-SCOPE`.**
`threshold` and `band` are declared by [genres/block.md](genres/block.md),
which is a **frozen** document, and their declarations sit there marked
EXPERIMENTAL — status and belonging are orthogonal (core §1, `LAYOUT-ZONE-NAMESPACE`), so a frozen
document may declare an experimental construct as long as nothing frozen
depends on it. That is not a breach of the isolation ruling; it is the
ruling read correctly. What the isolation ruling separates is the
**compatibility promise**, and `tools/isolation-check.js --strict` tests
the strip criterion after the move exactly as it did before it.

**What EXPERIMENTAL is not.** It is not deprecation and not a warning about
correctness; it is a statement that the construct has **not converged**. The
engine has no warning channel — an experimental construct parses silently and
renders — so this marking is the only signal an author or an authoring agent
gets. It is documentary by design (`CONSTRUCT-STATUS-TIERS`). An agent generating a portable figure
SHOULD restrict itself to the NORMATIVE surface, which is core plus the frozen
genre documents and nothing here.

**None of the three is deprecated, and the 0.3 move removed no
spelling from any of them.** The reference engine accepts `threshold`,
`band` and `bundle` unchanged **in their declaring genre**, with the same
grammar, the same option keys and the same model; what changed is that
each is now legal under one genre instead of four (`SCENE-KEYWORD-MEMBERSHIP`). A `.fd` that
wrote one of them under the genre that declares it needs no rewriting.
A `.fd` that wrote one under a genre that has withdrawn it gets a named
per-genre diagnostic that gives the ground rather than a spellcheck —
`"threshold" is not allowed in genre topology — it was WITHDRAWN from
this genre, not misspelled: …` — and every affected genre was
EXPERIMENTAL, or the construct was, so nothing under the compatibility
promise moved (§E7).

### E0.1 The skip promise, and where it does not hold

The isolation ruling promises that deleting the experimental file set
leaves a complete standard, and `tools/isolation-check.js` proves it for
the DOCUMENTS. It was read — including by this file — as also promising
that an implementation could skip experimental material and still conform.
**That second reading is false, and this section is the correction.**

**23 of the 192 normative fixtures write an experimental keyword at line
start**, so an implementation that rejects those keywords as unknown fails
all 23: on the error fixtures it emits a different message (`unknown
keyword` where the golden says `bundle needs an id`), and on the model
fixtures it emits an empty array where the golden carries members.

| fixture | kind | experimental keywords it writes |
|---|---|---|
| `112-lex-extra-args-every-directive` | errors | `band`, `signal`, `threshold`, `timing` |
| `115-lex-option-before-label` | model | `band`, `bundle`, `threshold` |
| `118-id-quoted-positions` | errors | `bundle`, `timing` |
| `119-id-double-dash` | errors | `bundle` |
| `123-comma-list-one-token` | errors | `bundle` |
| `125-typed-block-label-quotes` | errors | `timing` |
| `214-label-absent-vs-id` | model | `bundle`, `signal`, `timing` |
| `215-label-empty-string` | model | `bundle`, `signal`, `timing` |
| `245-block-subject-vocabulary` | model | `band`, `threshold` |
| `246-block-withdrawn-cells` | errors | `bundle`, `plane` |
| `304-presentation-on-every-element` | model | `band`, `bundle`, `signal`, `threshold`, `timing` |
| `305-presentation-carve-outs` | errors | `timing` |
| `306-presentation-value-errors` | errors | `band`, `bundle`, `threshold` |
| `414-block-id-cross-kind-collision` | errors | `signal`, `timing` |
| `478-typed-block-style-retired` | errors | `signal`, `timing` |
| `804-note-refused-generic` | errors | `band`, `bundle`, `threshold` |
| `810-threshold-in-region-target` | model | `band`, `threshold` |
| `811-threshold-in-region-ungated` | model | `band`, `threshold` |
| `901-errors-child-outside-block` | errors | `signal` |
| `905-errors-retired-text-option` | errors | `band`, `bundle`, `threshold` |
| `906-errors-needs-id` | errors | `bundle`, `timing` |
| `911-errors-retired-option-keys` | errors | `band` |
| `918-withdrawn-plane-keyword` | errors | `plane`, `signal`, `timing` |

**This table is the enumeration, and `conformance/README.md` points here
for it rather than repeating it.** It is derived by scanning
`conformance/cases/*.fd` for an experimental keyword at line start with
comments stripped; the command is in that README.

**Re-measured; it read 17 of 165.** Seven
of the eight differences are fixtures added since — `125`, `804`, `810`,
`811`, and this release's own three, `245` (`block`'s surviving subject
vocabulary), `246` (`block`'s withdrawn cells) and `918` (the withdrawn
`plane` keyword). The eighth is `PAINT-ORDER-CONSTRUCT` itself: `plane` stood in eight cells
of this table — `115`, `118`, `119`, `121`, `214`, `215`, `304`, `906` —
and the withdrawal removes it from every one of them. Only
`121-positional-quotes-scene` **leaves the list**, because `plane` was
its sole experimental keyword; the other seven keep `bundle`, `band`,
`threshold`, `timing` or `signal` and stay.

**Two rows still write `plane`, and that is not a contradiction.** `246`
and `918` are ERROR fixtures whose SUBJECT is the withdrawal: they write
the spelling in order to pin the diagnostic that rejects it, which is the
same treatment `path` and `routing` get. A withdrawn spelling can never
appear in a MODEL fixture — there is no model for it — and an error
fixture that stopped writing it would stop testing anything.

**A 24th fixture, `912`, writes `chart`, and this table has never counted
it.** That is an older scoping choice, not a new omission: the table's
vocabulary is the four constructs this file was written about, and
`chart` is a `table`-attached experimental construct that arrived by a
different route (§10 (b)). It is recorded here so that a
reader who greps the fixtures and finds 24 knows which basis this table
counts on, rather than concluding the count is wrong.

**Why they are like that, and why it is not simply a mistake.** Every one
of the 23 is a **cross-cutting lexical** case: its subject is a rule that
quantifies over the whole keyword registry — "an option may precede a
label on any directive", "every directive rejects the retired `text=`",
"a positional id may be quoted anywhere it is legal", "every element that
takes presentation keys takes them the same way". A fixture for a rule of
that shape earns its coverage by ENUMERATING the registry, and the
registry has experimental rows in it. Rewriting them over the frozen
registry alone is cheap per file and deletes exactly the coverage the
files exist to provide, so it was not done.

**What this means for an implementation, stated as a rule.**

- To claim **parser conformance** — the 192 normative fixtures — an
  implementation MUST parse `bundle`, `threshold` and `band`, and the
  `timing` genre with its `signal` child, at least well enough to produce
  their model shapes (§E5) and their error messages. **Skipping this file
  and the genre documents that declare the three is not compatible with
  that claim.**
- To claim **support for the portable authoring surface** — every
  document a v0.1 author is taught to write — an implementation may skip
  the whole experimental set. No frozen document teaches these keywords
  and they are absent from the skill's frozen genre reference, which
  `tools/isolation-check.js` and `tools/skill-coverage.js` gate.
  **This is a claim about what is TAUGHT, not about what exists on disk.**
  Eight in-repo figures outside `examples/reference/experimental/` use one
  of the three — `partition-map` and `evpn-fabric` and `srl-evpn-irb` and
  `patterns/topology-b`, plus the four `layout-compare` variants of the
  last two — so an implementation that skips the experimental surface
  cannot render this repository's own `examples/` directory in full. That
  is the honest measure of "portable surface": it is the surface an author
  is taught, and the project's own showcase reaches past it.
- These are **two different claims**, and until 0.1 this file
  offered only one sentence for both. The second is the one the isolation
  ruling actually established.

The corresponding false clause in core §12.2 — that `thresholds`, `bands`
and `bundles` are "empty on the normative surface" — is corrected in the
same release; seven of the 23 populate them.

| Construct | Declared by | Where its registry row is | Where its model shape is |
|---|---|---|---|
| `bundle` | [genres/experimental/topology.md](genres/experimental/topology.md) (§E2) | core §10 (b) | §E5 |
| `threshold` (+ `offset=`) | [genres/block.md](genres/block.md) (§E3) | core §10 (b) | §E5 |
| `band` (+ `extend=`) | [genres/block.md](genres/block.md) (§E3) | core §10 (b) | §E5 |
| `plane` (+ `plane=`, `z-index=`) | *nothing — WITHDRAWN, `PAINT-ORDER-CONSTRUCT`* | core §10, as a retired diagnostic | *none; §E1 is vacant* |

One fact about belonging is stated in core rather than here, because it
is a statement about the LANGUAGE rather than about these constructs:

- **There is no shared scene namespace for these constructs to sit in**
  (core §1, `GENRE-VOCABULARY-OBLIGATION`; 0.3, `SUBJECT-VOCABULARY-SCOPE`). Each genre declares its own subject
  vocabulary, so `threshold` and `band` are `block`'s two experimental
  declarations beside its NORMATIVE `node`, `group`, `external` and `edge`,
  and `bundle` is `topology`'s one beside its own four. Status and
  belonging stay orthogonal: `block` is a frozen document and two of the
  words it declares are EXPERIMENTAL, which is a statement about their
  stability and not about which document owns them.
  [genres/block.md](genres/block.md) remains the complete,
  self-contained normative home of that genre, and the strip test still
  passes because nothing frozen DEPENDS on the two.

**The layout-zone namespace of `LAYOUT-ZONE-NAMESPACE` no longer has an experimental member.** With
`path` and `routing` withdrawn the zone's own membership is `pin`
alone, NORMATIVE (core §10 (a′); the opener `layout` is a `UNIVERSAL-CORE-KEYWORDS` structural marker, not
a directive inside the zone). `LAYOUT-ZONE-NAMESPACE` itself is unchanged and stays whole in
core §1 — it fixes the zone's membership so that `GENRE-NAMESPACE`'s default, a reading agent
ignoring every member of the layout namespace wherever it appears (`GENRE-NAMESPACE`), has
no crack in it. The clause's own
"status and belonging are orthogonal" reasoning is preserved there: it was
written about `path`/`routing`, and it is the record of what the project
foresaw before the withdrawal, not a claim about the current membership.

## E2. `bundle` — declared by `topology` (`SUBJECT-VOCABULARY-SCOPE`/`SCENE-KEYWORD-MEMBERSHIP`)

**`bundle` is declared by
[genres/experimental/topology.md](genres/experimental/topology.md), which
is normative for that genre. This section no longer defines it.** The
grammar, the option keys, the member-matching rule and the derived ring
are stated there and only there; what follows is the record of how the
declaration got there and why this file stopped holding it.

*It was relocated here from core §2.5 and
[genres/block.md](genres/block.md) §2.5, and it moved on to `topology`'s
own document.* The demotion that brought it here was
already an argument about ONE genre: measured over the 50-document
in-repo corpus, `bundle` appeared in four documents and **every one of
them was a `topology` document**, so it belonged to no normative genre's
minimum set. Holding it in a file shared by four scene genres kept the
other three able to write a word none of them had earned, which is the
defect `SUBJECT-VOCABULARY-SCOPE` names.

**`block` withdrew it (`SCENE-KEYWORD-MEMBERSHIP`), and the ground is stronger
than the count.** `bundle` had **zero** authored uses under `block`, and
the construct is defined **by its referent**: a LAG (IEEE 802.1AX), an
ECMP set, an EVPN Ethernet Segment — a referent `topology` has and
`block` does not. Under `block` the definition had to be geometric, a
ring drawn round parallel edges with nothing to name; under `topology` it
is the umbrella noun for a thing the reader already knows. That is the
divergence the shared text hid, and it **reads better per genre**:
`topology`'s declaration is shorter and stronger than the one it
replaces. `flowchart` and `statechart` withdrew it too, and there it is
an anti-feature — two flowlines between the same two stages are different
CONDITIONS, and two transitions between the same two states are different
TRIGGERS, so a ring round them hides exactly what the figure is for.

**The spelling stays `bundle`, recorded as a deliberate RULE 4.1
exception.** IEEE 802.1AX's own noun is *aggregation*, and it is FALSE
for two of the three things the construct covers: an ECMP set is not an
aggregation and neither is an EVPN Ethernet Segment. The standard is
cited as the REFERENT and `bundle` is kept as the umbrella spelling; the
row and its `exception_reason` are in
[vocabulary-sources.tsv](vocabulary-sources.tsv).

## E3. `threshold` and `band` — declared by `block` (`SUBJECT-VOCABULARY-SCOPE`/`SCENE-KEYWORD-MEMBERSHIP`)

**`threshold` and `band` are declared by
[genres/block.md](genres/block.md), which is normative for that genre.
This section no longer defines them.** The grammar, the mandatory quoted
label, the `offset=` and `extend=` keys, the `..` range separator and the
scope rule are stated there and only there; what follows is the record of
how the declarations got there, plus the one clause that is about the
RESOLVER rather than about either construct (§E3.1).

*They were relocated here from core §2.6 and
[genres/block.md](genres/block.md) §2.6, and they went back to `block`'s
own document — this time as `block`'s own declarations
rather than as a shared section that document merely pointed at.*
`threshold` was spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`) and
`line` before that; `band` was spelled `fill` until 0.1 and gained
a MANDATORY quoted label (`BAND-LABEL-STATUS`). Every old spelling is a
line error naming its migration, and the diagnostics are unchanged by the
move.

**`topology`, `flowchart` and `statechart` withdrew both
(`SCENE-KEYWORD-MEMBERSHIP`).** The evidence was **zero authored uses** in all three, and in
each the construct fails for a reason of that genre's own: a `threshold`
is a labelled reference value drawn at a percentage of the target's
RENDERED EXTENT, and a process box, a state box and a router glyph are
all sized by their label, so the line asserts nothing a reader can read;
a `band` is a range over the same meaningless extent. In `topology` there
was a second ground — **`band` collides with the frequency band**, which
is core vocabulary of that genre's own audience.

**`band` does not collide that way in `block`, and that asymmetry is
itself the argument for `SUBJECT-VOCABULARY-SCOPE`.** `block` has **no single domain** — that
is what general-purpose means — so no domain meaning arrives with the
reader to compete with FigDown's. The same word being safe in one genre
and misleading in another cannot be recorded by one shared sentence
belonging to no genre.

**`block` keeps the spellings `threshold` and `band`, deliberately
unfrozen.** They are the `GENRE-EARNING-THRESHOLD` *interim general constructs* for the
candidate genre in core §9 — "a quantity extent carrying named reference
values and named regions". `GENRE-EARNING-THRESHOLD` forbids over-stretching a general
construct to satisfy a genre-shaped need ("approximating a genre with
general block-and-edge draws a similar picture while discarding the
meaning: 'looks right' is not 'expressed'"), and it supplies the interim
in the same breath: general constructs "let the user at least draw the
figure they want to express, so authors are never left without a way
forward." Freezing either would bind a scene construct to the
compatibility promise and foreclose the genre design; the 0.1
renames correct DEFECTS in them (an inverted name, a construct that could
carry no meaning) without promoting them. **Renaming either one now was
considered and REJECTED**: they are held unfrozen precisely so a future
scalar-marker genre can name the pair once, WITH a scale, and a rename
today would hand that genre a retired word.

**Withdrawing them from three genres is the first half of that same move,
not wasted work.** It removes three of the four genres the constructs
would eventually have to be extracted from, at zero cost and against zero
authored evidence, so the eventual extraction is a **one-genre**
operation on `block`. It also stops the corpus growing in the wrong
direction — every month `threshold` stayed legal under `statechart` was a
month someone could author one, and each such figure would be migration
debt for a genre with no meaning for the construct. And it sharpens `GENRE-EARNING-THRESHOLD`'s
own evidence: `GENRE-EARNING-THRESHOLD` rests on ~22 scalar-marker figure identities, and
leaving the constructs legal in three genres that contribute zero of them
diluted the claim that the need is a distinct genre's.

**`threshold` carries an irony worth recording where `block` declares
it.** In the QoS domain a threshold is a queue depth **with a numeric
value** — RFC 2309's `minth`/`maxth`, RFC 7567 — and those are the very
RFCs `THRESHOLD-KEYWORD-SPELLING` cited as the secondary source for the spelling. FigDown's
`threshold` takes **no `value=`** (`THRESHOLD-VALUE-SCOPE`), and its `offset=` is a fraction
of the target's rendered extent, not a quantity of anything: the target
declares no scale (core §12.7). The name is borrowed from a domain that
means a number by it, into a construct that refuses to carry one.

### E3.1 A `threshold` or `band` on a REGION (`MARKER-TARGET-KINDS`)

*This clause stays in this file because it is about the
**resolver** — which declared ids `in=` will bind — and not about either
construct's vocabulary. `in=` is a NORMATIVE core option key (core §10), so
its value domain is not `block`'s to declare; what `block` declares is
that `threshold` and `band` take `in=` at all.*

**`in=` also resolves a REGION id** — a `bitfield`, `table` or `timing` block —
in addition to a node or a group. This is a **widening of the value domain**,
not a third sense of `in=`: the relation is sense 2 verbatim, *the element this
one is drawn across*, and only the set of declared ids the resolver will bind
has grown. It is **ungated**, so it holds under `figdown 0.1` too. Before it,
`threshold "Max" in=q offset=50%` over a `table q` answered
`unknown target "q" for threshold` — the same error a nonexistent id gets —
which is why the two WRED figures in the measured corpus became GFM tables
instead.

`threshold` and `band` are **`block`'s** keywords, so they are not on the pure
`table` / `bitfield` / `timing` top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`) and this widening does
not put them there — nor are they on `topology`'s, `flowchart`'s or
`statechart`'s any more (`SCENE-KEYWORD-MEMBERSHIP`), so the header in every example below is
`block` and no other genre can be substituted for it. The path that works is
**composition** (`GENRE-COMPOSITION`): a `block` header hosting a nested region, with the mark
at the scene's top level. These are the runnable versions of the examples
cited from [genres/table.md](genres/table.md) and
[genres/bitfield.md](genres/bitfield.md).

Over a `table` region — the WRED case, and the driver the widening exists for:

```figdown
figdown 0.1 block
table wred "WRED profile"
| Queue | min_th | max_th |
|---|---|---|
| q0 | 40 | 80 |
| q1 | 30 | 70 |
threshold "max_th" in=wred offset=75%
band "drop zone" 40..80% in=wred
```

Over a `bitfield` region:

```figdown
figdown 0.1 block
bitfield hdr "Header" numbering=msb0
field "Type" 8
field "Payload" 24
threshold "byte boundary" in=hdr offset=25%
```

**On a `table` the offset is measured over the DATA ROWS**, not over the whole
grid. The header tiers name the columns; they are not values, and a threshold is
a statement about values. Measured over the grid, `offset=85%` on a three-row
table lands on the column headings and strikes through them.

**The locator COORDINATE grammar is designed and deliberately NOT built.**
`in=q(3)`, addressing a row inside the region, has no shipping consumer, and
RULE 4.7 argues against spending a grammar before one exists; `in=hdr(2)` is a
line error today. Each region genre states its own address space normatively
(`GENRE-DOCUMENT-CONTRACT`) against the day one arrives. *Reopens on* a construct that needs to
address a row, a cell or a cycle INSIDE a region.

## E5. The semantic model of the three

*Relocated here from core §12.2, unchanged. Core §12 remains
the normative contract for the model as a whole, and its Document table still
lists the top-level keys below — a closed model has to say what exists.
Everything here is the shape of a key a normative-surface reader never meets
in a document that stays inside the surface.*

*This section stayed here while the VOCABULARY moved to the
declaring genres (§E0). `GENRE-VOCABULARY-OBLIGATION`'s exchange obliges a genre to document its
keywords, option keys, enum values and defaults; the canonical model is
not on that list — it is core §12's contract, one shape per construct
whatever genre writes it — so splitting it per genre would duplicate
identical tables and invite them to drift.*

**Experimental does NOT mean unmodelled.** All three project into the canonical
model exactly like anything else, and `conformance/normalize.js` implements
that projection. What they lack is a conformance obligation.

The top-level keys, as core §12.2 lists them:

| key | present | note |
|---|---|---|
| `planes` | always, exactly one entry | wholly NORMATIVE since 0.3: `planes[0]` is the implicit `base` and `PAINT-ORDER-CONSTRUCT` withdrew the only directive that could add a second |
| `thresholds` | always (MAY be empty) | the array is empty in every document on the normative surface |
| `bands` | always (MAY be empty) | same |
| `bundles` | always (MAY be empty) | same |

**Threshold** — `threshold` (§E3). The directive and the model array were
spelled `guide` / `guides` until 0.1 (`THRESHOLD-KEYWORD-SPELLING`); `NORMATIVE-SEMANTIC-MODEL` makes the model
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
| `line` | number | always | 1-based source line |

**No `plane` row anywhere above (`PAINT-ORDER-CONSTRUCT`).** All three
carried an optional, unmaterialized `plane` key while a document could
declare a plane to point it at. The `plane=` option key is withdrawn with
the keyword, so the key can no longer be written on any of them and the
rows are deleted rather than marked absent — a model key that no source
line can produce is not a key. **What is unaffected** is the implicit
plane: `planes` still holds exactly `{id:"base", z:0}`, `node.plane` and
`edge.plane` are still materialized to `"base"` (core §12.2, §12.4), and
paint order is document order. The *Plane* element is now wholly NORMATIVE
and wholly core's; this file no longer has a half of it to describe, and
§E1 is vacant.

## E6. Where the frozen files still name these three

A closed language has to say what exists, so the frozen set names all three —
and, `block`'s own declarations aside, never defines them. Each of these is a
registry row or a marked cross-reference:

| Frozen file | What it says about the three |
|---|---|
| [core.md](core.md) §1 | that subject vocabulary is per genre (`GENRE-VOCABULARY-OBLIGATION`) and that these constructs are declared per genre, not shared — 0.3, `SUBJECT-VOCABULARY-SCOPE` |
| [core.md](core.md) §2.5–§2.6 | one marked pointer each, to §E2–§E3 |
| [core.md](core.md) §5 | which directives accept `fill=`/`stroke=`/`style=` — acceptor rows, marked |
| [core.md](core.md) §9 | the `GENRE-EARNING-THRESHOLD` candidate genre that `threshold`/`band` stand in for as interim general constructs (§E3) |
| [core.md](core.md) §10 | the **registry**: one row per keyword and per option key, with its EXPERIMENTAL status, plus the WITHDRAWN rows that are owed a named diagnostic. This is the enumeration the isolation ruling explicitly preserves |
| [core.md](core.md) §12 | the Document key list and the wholly normative `planes`/`base` model |
| [genres/block.md](genres/block.md) | **the declaration** of `threshold` and `band`, marked EXPERIMENTAL — a frozen document may declare an experimental construct as long as nothing frozen depends on it (§E0) — plus a vocabulary row for `bundle` pointing at `topology` |
| [genres/README.md](genres/README.md) | the count of demoted constructs and what a demotion means |

**Two rows left this table, and are recorded here so the
deletion is not silent.** Core §2.4 was the marked pointer to §E1, and
core §5's acceptor row named `plane=` among the presentation keys; both
went with `PAINT-ORDER-CONSTRUCT`. Every clause around them survives — §2.4's neighbours,
§5's table and §12's plane model are all frozen text — and what changed
is that none of them names a construct this file defines. The `plane`
spelling itself stays REGISTERED in core §10 as a withdrawn diagnostic,
on the same convention `path` and `routing` sit under: a registration
counts whether or not it has a live acceptor, and the engine still owes
each withdrawn spelling a named message.

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
  `via`/`src`/`dst` → `points`/`tailport`/`headport`, the 0.1
  withdrawal itself, and the 0.3 per-genre withdrawals and the
  removal of `plane` — because accumulating migrations is the rehearsal for
  v1.0's machinery (core §13.4), not because they were owed. An
  unpublished working draft is not where a reader looks for what happened
  to a keyword.
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
- **0.3 exercises the power twice more, at two different scopes,
  and the distinction is the whole content of the release.** `PAINT-ORDER-CONSTRUCT` is a
  LANGUAGE withdrawal in `EDGE-GEOMETRY-CONSTRUCTS`'s exact shape: `plane`, `plane=` and
  `z-index=` are gone everywhere, the diagnostic names no replacement,
  and `plane` joins the retired-keyword sweep AHEAD of the per-genre
  allowlist so it fires under `bitfield`, `table` and `timing` too. `SCENE-KEYWORD-MEMBERSHIP`
  is a **per-genre** withdrawal, which is new: 16 keyword/genre cells
  where the spelling survives in another genre, so the diagnostic must
  say *withdrawn from this genre, not misspelled* and give that genre's
  own ground rather than offer a spellcheck. Both were free. Three of the
  four scene genres are EXPERIMENTAL genres whose own documents promise
  they "may change or be withdrawn in a later `0.x` without a migration
  entry"; in `block`, the one NORMATIVE scene genre, the two withdrawn
  cells were `bundle` and `plane`, both EXPERIMENTAL, and neither of `block`'s
  NORMATIVE cells — `group` and `external` — is touched. No compatibility
  break, no MAJOR version spent.
- **`SCENE-KEYWORD-MEMBERSHIP` and `PAINT-ORDER-CONSTRUCT` also had to repair two diagnostics they did not
  change.** `RETIRED_LAYER`, `layer=` and `z=` each named a replacement
  spelling that `PAINT-ORDER-CONSTRUCT` has now removed, so each was rewritten to state the
  WHOLE chain — `layer` → `plane` → withdrawn — rather than send an
  author to a word that is itself a line error. The precedent is
  `route` → `path`, where the same repair was owed. A
  withdrawal's blast radius is every diagnostic that pointed at it, and
  that is a cost worth naming, because it is the one part of a
  withdrawal that is not a deletion.
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
