# FigDown Genre: `block`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any block figure.
>
> **Genre status: NORMATIVE (`CONSTRUCT-STATUS-TIERS`).** `block` is
> inside the v0.1 conformance surface and inside the compatibility promise:
> a conforming implementation MUST support it, and it changes only through
> a migration entry (`VERSION-MIGRATION-MODEL`). It is the scene genre v0.1 freezes on — its two
> namespace-siblings `topology` and `flowchart` are EXPERIMENTAL. See core
> doc §10 for what the status means. **NORMATIVE is not "stable"** and
> neither is "frozen": both name the scope of the change-management
> promise, not the absence of change, and FigDown 0.x is a preview — see
> [core §13](../core.md#13-stability-and-versioning-normative).
>
> **This file is FROZEN material, and (`SUBJECT-VOCABULARY-SCOPE`) it DECLARES its
> own experimental rows instead of borrowing them.** Two constructs share this
> genre's namespace without being part of its normative vocabulary —
> `threshold` and `band`. Both are EXPERIMENTAL; both are declared below, in
> `block`'s own words, under
> [§The `block` genre's own subject vocabulary](#the-block-genres-own-subject-vocabulary-ns--b),
> and the treatment of what their STATUS costs — the skip promise, the `GENRE-EARNING-THRESHOLD`
> interim argument — stays in [../experimental.md](../experimental.md) §E3.
> **Two others left this genre:** `bundle` is now `topology`'s
> declaration alone (`SCENE-KEYWORD-MEMBERSHIP`), and `plane` was **withdrawn from the language
> entirely** (`PAINT-ORDER-CONSTRUCT`) — keyword, `plane=` and `z-index=` together. (Two more,
> `path` and `routing`, were EXPERIMENTAL members of the genre-independent layout
> namespace until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS` **withdrew** them from the language in
> the same way.) A closed language has to say what exists *and what stopped
> existing*, so both withdrawals are recorded — in §2.4, §2.5 and in the
> declaration section — rather than deleted in silence. Nothing frozen here
> depends on the two remaining experimental rows: delete the experimental file
> set and this document is still the complete, self-contained normative home
> of genre `block`.
>
> The maintainer-ruling item codes cited below (`EDGE-WRITTEN-FORM`, `PLANE-Z-INDEX-DEFAULT`, `OMITTED-LABEL-RECORDING`, `EMPTY-LABEL-STATE`) are
> defined in the
> A-code registry.

**Census**: #1, 24.3% weighted (block-architecture). Prior art: none
borrowed wholesale — the box-and-wire scene is the shared baseline every
diagram language starts from.

## Purpose

Expresses a system as **parts and the relations between them**: functional
blocks, pipelines, datapaths, layered stacks, and the containment that
groups them. The largest genre in the corpus and the default choice for a
figure that is not a topology, a flowchart, or one of the typed blocks.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `right` | Census-dominant direction for pipelines and datapaths |
| `shape` | `box` | The core-model default (§2.1); a block is a box |

`block` is the genre whose defaults are the core model's own defaults. **What
it does not have is a borrowed vocabulary.** Until this release this paragraph
said `block` "defines no keyword of its own", and its vocabulary table was
"the scene namespace" — an INTERSECTION written down as if it were a
namespace. `SUBJECT-VOCABULARY-SCOPE` dissolves it: `group`, `external`, `threshold` and `band` are
`block`'s **own** subject vocabulary, declared in this document, which `GENRE-VOCABULARY-OBLIGATION`
makes normative for them. `topology` spells `group` and `external` too, and
`flowchart` spells `external`; each of those is **that genre's own separate
declaration, which happens to agree with this one today** — never this one
inherited. Either side may be withdrawn, renamed or constrained without
touching the other, and 0.3 did exactly that in sixteen cells.

## Complete vocabulary (normative)

Every keyword and option key valid in a `block` document, with this genre's
defaults. Generated from the reference engine's behaviour and verified
against it; where this table and the core doc's prose disagree,
the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three —
`figdown` `title` `layout` — identical under every genre and never redefined
(`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a genre is complete
without any of them beyond `figdown`); **L** = the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`) — the layout zone is a namespace of its own, and every member of
it is genre-independent, so no genre may define, redefine or extend a keyword
inside it; `pin` is its only member (`path` and `routing` were its two
experimental members until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them);
**H** = the **scene host set** — `class`, `flow`, `rank`. Every scene genre
accepts all three and **none of them is subject vocabulary**: `class` is a
styling declaration and `flow`/`rank` are layout intent, so none of them
names a referent, no genre's domain holds a competing meaning for one, and no
genre can independently earn or lose one (`SUBJECT-VOCABULARY-SCOPE`). They stand
nearer `LAYOUT-ZONE-NAMESPACE`'s genre-independent layout namespace than `GENRE-VOCABULARY-OBLIGATION`'s per-genre
vocabulary; **B** = **`block`'s OWN vocabulary** (`GENRE-VOCABULARY-OBLIGATION`; `SUBJECT-VOCABULARY-SCOPE`) —
declared in this document, which is normative for it. Where another scene
genre spells the same word, that is **that genre's own declaration agreeing
with this one**, not this one shared; **N** = a nested-genre opener —
composition, not `block` vocabulary (§4, `GENRE-COMPOSITION`).

**The NS column changed and the old letter is recorded rather
than quietly replaced.** Every row now marked **B** or **H** was marked **S**,
"the scene namespace shared with `topology` and `flowchart`". There was no
such namespace: there was a set of words four genres happened to accept, and
writing it down as one namespace is what made three genre documents
incomplete against `GENRE-VOCABULARY-OBLIGATION` (`decisions/registry.md`). `node` and `edge`
have in fact been per-genre (`GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING`) — `flowchart` spells
the connector `flowline` and `statechart` spells the pair `state`/
`transition` — so their **S** was already false when it was written.

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. `block` is
itself a normative genre, so a `block` document that uses only the NORMATIVE
rows below **is** a portable v0.1 document; the EXPERIMENTAL rows are the ones
that carry it outside the conformance surface.

| Keyword | Form | NS | Status | Option keys | `block` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.1 block` | C | NORMATIVE | — | required, first significant line |
| `title` | `title "<text>"` | C | NORMATIVE | `note` (requires `figdown 0.3`) | absent; `note=` is `title`'s FIRST option key (`DRAWN-ANNOTATION-FORM`) |
| `node` | `node <id> ["label"]` | B | NORMATIVE | `shape` `fill` `stroke` `style` `class` `in` `note` (requires `figdown 0.3`) | `shape=box`, label absent |
| `group` | `group <id> ["label"]` | B | NORMATIVE | `fill` `stroke` `style` `class` `gap` `note` (requires `figdown 0.3`) | **one nesting level** — `block`'s own default, not a language-wide one (see the declaration below) |
| `external` | `external <id> ["label"]` | B | NORMATIVE | **none** | never drawn (`EXTERNAL-EDGE-ENDPOINTS`); since 0.1 it took no paint key — `color=` was its only one and it is retired (`COLOUR-KEY-STATUS`) — and since 0.3 (`PAINT-ORDER-CONSTRUCT`) it takes **no option key at all**: `plane=` was the last one it accepted and it went with the `plane` keyword. No `note=` either — it is not drawn, so there is nothing for a note to sit beside |
| `edge` | `edge <a> [tail] <op> [head] <b>` | B | NORMATIVE | `stroke` `style` `class` `note` (requires `figdown 0.3`) | op is written form; `[mid]` splits the operator; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`) |
| `class` | `class <id> "<meaning>"` | H | NORMATIVE | `fill` `stroke` `style` | the meaning FIELD is REQUIRED, its VALUE may be `""` (= no meaning claimed, no legend entry — `CLASS-EMPTY-MEANING`); a class an `edge` joins MUST declare `stroke=` or `style=` (`INTERIOR-LESS-ELEMENT-PAINT`/`CLASS-PAINT-REQUIREMENT`) |
| `threshold` | `threshold "<label>" in=<id> offset=<0..100>%` | B | **EXPERIMENTAL** | `stroke` `style` `offset` `in` | dashed; the quoted label is REQUIRED; no `value=` and no `ref=` (`THRESHOLD-VALUE-SCOPE`). Spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`). Withdrawn from the other three scene genres at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`) and deliberately NOT renamed here (`GENRE-EARNING-THRESHOLD` interim — see the declaration below) |
| `band` | `band "<label>" <pct>%\|<a>..<b>% in=<id>` | B | **EXPERIMENTAL** | `fill` `stroke` `style` `in` `extend` | `extend=up`, `fill=#e5e7eb`; the quoted label is REQUIRED and written FIRST (`BAND-LABEL-STATUS`). Withdrawn from the other three scene genres at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`), and NOT renamed here for the same `GENRE-EARNING-THRESHOLD` reason |
| `flow` | `flow right\|down\|left\|up` | H | NORMATIVE | — | **`right`** |
| `rank` | `rank <id>,<id>[,<id>…]` | H | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token; the space form was RETIRED at 0.1; the rest of the line is reserved for future options |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px; group members are group-local. All three keys are OPTIONAL and at least one is REQUIRED; `at=` applies to nodes, groups and `external` endpoints, `width=`/`height=` to **nodes only** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — `size` is retired and its keys moved here) |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `block` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | 0.1 correction: `chart` was legal at a scene document's top level but had no vocabulary row anywhere. It is defined by its reference to a `table` id, and `table` is a legal host keyword in every scene genre, so a scene document can carry both the data and the chart. `type=bar3d` is the only value. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1 (`CHART-LEVEL-KEY`), so `chart <table-id> [type=bar3d]` is the whole grammar. |

**The two EXPERIMENTAL rows above are `block`'s own, declared below.** What
[../experimental.md](../experimental.md) §E3 adds is not their definition but
the treatment of their STATUS — the skip promise, and `GENRE-EARNING-THRESHOLD`'s argument that the
scalar-marker need is genre-shaped rather than keyword-shaped. They are
demoted, not removed: the engine accepts both exactly as before and every
document that uses them keeps rendering.

**Two rows left this table and the deletion is recorded rather
than silent.** `path` and `routing` were core keywords until 0.1, then
EXPERIMENTAL members of the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW** them
from the language: the engine now rejects both spellings, and the four option
keys only `path` accepted (`points=` `routing=` `tailport=` `headport=`) with
them. There is **no replacement spelling** — the constructs were removed, not
renamed — so a document that used them must have those lines **deleted**, which
changes the rendered output (the edge falls back to auto layout; shape it with
`rank`, `flow`, declaration order and `pin` instead). The evidence and the
decision: [../migrations.md](../migrations.md) 0.1, [core §9](../core.md#9-open-syntax-questions)
**`EDGE-IDENTITY-AND-GEOMETRY`**, and `decisions/registry.md` `LAYOUT-ZONE-NAMESPACE` itself is unchanged
and still frozen; only its membership moved, and it now holds `pin` alone.

### The `block` genre's own subject vocabulary (NS = B)

**Every keyword below is declared HERE, by this genre, for this genre**
(`GENRE-VOCABULARY-OBLIGATION`; `SUBJECT-VOCABULARY-SCOPE`). Three other scene genres spell some of the same
words. Those are separate declarations that agree with these ones today, and
the agreement is a fact about today, not a mechanism: nothing in this section
is inherited by `topology` or `flowchart`, and nothing in their documents
constrains this one. Writing the four out separately is what surfaced the
divergences recorded under each — the value of the exercise, not its
overhead (`decisions/registry.md`).

#### `group` — NORMATIVE

    group <id> ["label"] [fill=] [stroke=] [style=] [class=] [gap=] [note=]

A `group` names **containment**: the box drawn round a set of nodes that
belong together — a pipeline stage, a chip, a shelf, a failure domain.
Membership is DECLARED and never inferred from rendered geometry: a node
joins with `in=<group-id>`, and `in=` on a `group` line is itself a line
error (§2.2, `INAPPLICABLE-OPTION-KEYS`). Full treatment: §2.2.

**`block`'s defaults, and they are `block`'s:** **one nesting level** — a
node in a group, and no group in a group — and `gap=` absent, so the renderer
spaces members itself. That limit used to be recorded as "one nesting level;
`plane` absent" in a row belonging to no genre; the `plane` half is gone with
the keyword (`PAINT-ORDER-CONSTRUCT`), and the nesting half is now visibly **this genre's
default rather than the language's**. That matters:
whether one level is also right for a `topology` pod-inside-a-fabric is a
question nobody could ask while there was one sentence owned by nobody. It is
`topology`'s to answer in its own document, and answering it there would not
touch this one.

**No domain competes for the word here, and that is a property of `block`,
not of `group`.** `block` is the general-purpose genre — it has no single
domain — so a reader arrives with no prior meaning of "group" that a box
drawn round its members contradicts. `topology`'s declaration of the same
spelling has to warn off the **multicast group** (IGMP/MLD), because a
topology figure is a very likely place to draw multicast (D2). One shared
paragraph could only either carry that networking caveat into a genre that
does not need it, or omit it where it is needed.

#### `external` — NORMATIVE

    external <id> ["label"]        # no option key at all

An **out-of-figure endpoint**: it states that a connection crosses the
figure's boundary, and nothing else. It is *not* a participant (`MEANING-RECOVERY-SOURCE`), and it
is **never drawn as a shape** (`EXTERNAL-EDGE-ENDPOINTS`) — the edge ends open at an invisible
anchor auto-layout places at the figure's natural margin, and the label, when
written, renders as small muted text just beyond the open end. Full
treatment: §2.8.

**Option keys: none, as of 0.3.** `plane=` was the last key it
accepted and `PAINT-ORDER-CONSTRUCT` withdrew it with the `plane` keyword, so the row is empty
and every key now falls through to `external does not take <k>=`. It takes no
`note=`: it puts nothing on the page, so there is nothing for a note to stand
beside.

**This declaration names NO source standard, and says so rather than letting
the omission pass for modesty.** `block`'s `external` is FigDown's own word
for FigDown's own construct. Its provenance is a corpus measurement — `EXTERNAL-EDGE-ENDPOINTS`:
**70–80% of block/flowchart figures contain at least one open-ended arrow** —
and the rename that produced the spelling (`EXTERNAL-ENDPOINT-NAMING`, `boundary` → `external`) was
settled by ruling three standards' meanings OUT (UML's «boundary» is an
internal interface object; C4's `System_Boundary` is the dashed container
FigDown already spells `group`; BPMN's Boundary Event is a third thing), not
by taking a word from one of them.

**That is half of a divergence that only becomes visible written out
separately.** `flowchart` spells `external` too, and *its* declaration has a
referent and a citation: **ISO 5807 §9.4.2 *Terminator***, the off-page
terminus, plus the statement that FigDown's spelling is not ISO's
([experimental/flowchart.md](experimental/flowchart.md)). `topology`'s has a
collision to warn about — the **external route** (OSPF Type 5/7 LSA, eBGP).
`block`'s has neither. Same grammar, three different provenances and three
different pieces of reading advice; the shared paragraph carried one, and
therefore carried the wrong one twice.

#### `threshold` — EXPERIMENTAL

    threshold "<label>" in=<id> offset=<0..100>%   [stroke=] [style=]

A **labelled reference value drawn across the target**: a dashed line at
`offset=` of the target's rendered extent, with a MANDATORY quoted label. The
target is a `node`, a `group` or — (`MARKER-TARGET-KINDS`) — a nested
`bitfield`/`table`/`timing` region. No `value=` and no `ref=` (`THRESHOLD-VALUE-SCOPE`).

**The WRED irony, recorded because it is easy to miss.** In the QoS domain —
the domain of the two figures that drive the entire annotation-locator design
(`decisions/registry.md` `LAYOUT-STABILITY`) — a threshold is **a queue depth
WITH A NUMERIC VALUE**: RFC 2309's `minth`/`maxth`, RFC 7567's *"an AQM
algorithm configured with a threshold"*. Those are the very RFCs `THRESHOLD-KEYWORD-SPELLING` cited as
the secondary **source** for this spelling. But FigDown's `threshold` takes no
`value=` at all, and [../experimental.md](../experimental.md) states that
`offset=` is *"a fraction of the target's rendered extent, not a value of any
quantity — the target declares no scale"*. So a WRED reader meeting
`offset=80%` is invited to read 80% **as the threshold value**; it is a paint
position. **The word was borrowed from the domain where it is already taken,
and borrowed without the one attribute that domain defines it by.**

**It is not renamed, and the reason is `GENRE-EARNING-THRESHOLD`, not inertia.** `threshold` and
`band` are the `GENRE-EARNING-THRESHOLD` **INTERIM** constructs, deliberately left unfrozen so that
the future scalar-marker genre (core §9; prior art HTML `<meter>`, *"a scalar
measurement within a known range"*) can name this construct once, **with a
scale**. Renaming it now would hand that genre a retired word — the spelling
would be spent before the construct that deserves it exists.

**Why it survives in `block` when the collision is that sharp:** the evidence
is `block` evidence and nowhere else's. `GENRE-EARNING-THRESHOLD`'s **~22 figure-identities
concentrated in ~10 of 163 module pages, 12 of them never drawn at all**
([core §9](../core.md#9-open-syntax-questions), `QUANTITY-EXTENT-GENRE`) are authored as `block`;
`threshold` has **zero** authored uses under `topology`, `flowchart` or
`statechart`, and all three withdrew it (`SCENE-KEYWORD-MEMBERSHIP`). The withdrawal
is also the first half of the eventual extraction: three of the four genres
it would have had to be lifted out of are already gone, so when the
scalar-marker genre lands, the move is a **one-genre** operation.

#### `band` — EXPERIMENTAL

    band "<label>" <pct>% in=<id>            [fill=] [stroke=] [style=] [extend=]
    band "<label>" <a>..<b>% in=<id>         [fill=] [stroke=] [style=] [extend=]

A **labelled zone across the target's rendered extent**: either a range
`<a>..<b>%` or a single `<pct>%` edge that `extend=` grows from. Defaults
`extend=up` and `fill=#e5e7eb`. The quoted label is MANDATORY and written
FIRST (`BAND-LABEL-STATUS`): without a label slot, a band whose `fill=` a reader
correctly discards as presentation (§5, `PRESENTATION-AS-MEANING-CARRIER`) asserted **nothing whatsoever**.

**`block`'s `band` does not collide, and the reason is a property of this
genre.** In `topology`, `band` is a **frequency band** — radio, wireless,
microwave, optical transport — and topology is exactly the genre those
figures are drawn in; combined with zero authored uses (both occurrences were
conformance fixtures) that cell was over-determined and was withdrawn (`SCENE-KEYWORD-MEMBERSHIP`). Here there is no such prior, because **`block` has no
single domain — that is what general-purpose means.** A word with no
established competing meaning in the reader's head is exactly the kind of
word a general genre can carry.

**That asymmetry is itself an argument for `SUBJECT-VOCABULARY-SCOPE`:** the same
spelling is safe in one genre and misleading in another, which a single
shared declaration is structurally unable to state. Note how the divergence
resolved — **by the withdrawal, not by a caveat**. The genre that had the
problem stopped declaring the word; the genre that does not have it kept its
own declaration unchanged. That is the ruling working as designed.

`band` is unrenamed for the same `GENRE-EARNING-THRESHOLD` reason as `threshold`, and the two move
together whenever they move.

#### Withdrawn from `block`

Two rows left this genre in the same release, for two different kinds of
reason, and the difference is the whole difference between `SCENE-KEYWORD-MEMBERSHIP` and `PAINT-ORDER-CONSTRUCT`.

| Withdrawn | R | Ground |
|---|---|---|
| `bundle` | `SCENE-KEYWORD-MEMBERSHIP` | **From this genre only** — `topology` still declares it. `bundle` had **zero authored uses under `block`**: all three authored link bundles in the corpus are `topology` documents (`examples/srl-evpn-irb.fd`, `patterns/topology-b.fd`, `layout-compare/srl-evpn-irb-auto.fd`), and `block`'s count was conformance fixtures plus the block reference figure. See §2.5 |
| `plane` | `PAINT-ORDER-CONSTRUCT` | **From the LANGUAGE** — keyword, the `plane=` option key, and `z-index=`, which was legal on `plane` and nowhere else. No genre declares it now and there is no replacement spelling. See §2.4 |

A withdrawal from one genre is not a retirement of a word: writing `bundle`
under `block` is a line error that names `topology` and states the ground,
not `unrecognized line`, because the author has written a real construct
under a genre that no longer declares it. A withdrawal from the language is
the other thing entirely, and `EDGE-GEOMETRY-CONSTRUCTS`'s `path`/`routing` is its
precedent: the diagnostic names **no replacement**, because there is none.

### Option-key values

| Key | Values | Status | `block` default |
|---|---|---|---|
| `shape` | `box` `rounded` `circle` `ellipse` `diamond` `cylinder` | NORMATIVE | `box` |
| `style` | `solid` `dashed` `dotted` | NORMATIVE | per directive (`solid` on `node`/`group`/`edge`; dashed on `threshold`) |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line (`edge`, `threshold`), which is SVG's own asymmetry | NORMATIVE | absent |
| `class` | id of a declared `class` | NORMATIVE | absent |
| `in` | id of the containing `group` (`node`) or the target `node`/`group` (`threshold`/`band`) — and, since 0.3 (`MARKER-TARGET-KINDS`), the id of a nested `bitfield`/`table`/`timing` **region** on `threshold`/`band` | NORMATIVE | absent |
| `note` | quoted prose — the DRAWN annotation, on `node`, `group`, `edge` and `title` (`DRAWN-ANNOTATION-FORM`) | NORMATIVE since `figdown 0.3` | absent |
| `gap` | non-negative number (px) — exact member spacing inside a `group` | NORMATIVE | absent → the renderer's automatic spacing |
| `extend` | `up` `down` `left` `right` | **EXPERIMENTAL** | `up` (spelled `dir=` until 0.1) |
| `at` | `(<x>,<y>)` canvas px — a PAREN POINT, `pin` only; `(x,y)` is the **top-left of the element's layout box**, whatever its `shape=` (core §3) | NORMATIVE | optional on `pin` — nodes, groups and `external` endpoints |
| `offset` | `<0..100>%` (the `%` is mandatory) — `threshold` only; spelled `at=` until 0.1 | **EXPERIMENTAL** | required on `threshold` |
| `width` `height` | px number | NORMATIVE | optional on `pin`, **nodes only** — a group, an `external` endpoint or a typed block sizes to its content; at least one of `at`/`width`/`height` is required on the line. Spelled `w=`/`h=` until 0.1; carried by `size` until 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |

`fill=`, `stroke=` and `style=` are all normative:
`stroke=` was promoted by `STROKE-KEY-STATUS` once its use count was re-measured (5 in-repo
at `CONSTRUCT-STATUS-TIERS`; 56+ in-repo and 567 downstream edge-colouring sites now). There is
no text channel — `color=` is retired language-wide (`COLOUR-KEY-STATUS`) and the label
colour is derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`). `extend=`
is demoted only because the sole directive that accepts it (`band`) is.
**`plane=` and `z-index=` had rows here until this release**: `PAINT-ORDER-CONSTRUCT` withdrew
both from the language with the `plane` keyword — a keyword and its only
declaration point move together, and `z-index=` was legal on `plane` and
nowhere else. Neither names a replacement, because there is none.
**`points=`, `tailport=`, `headport=` and `routing=` had rows here until 0.1**: all four were accepted by `path` alone, and `EDGE-GEOMETRY-CONSTRUCTS` withdrew them
from the language with it — the same shape, four releases earlier.

Edge operators: `->` `<-` `--` `<->`. The written form is the model (`READ-SIDE-DETERMINISM`);
`A <- B` and `B -> A` are a *rendering* equivalence only.

Retired spellings, kept only so a stale document gets a named migration
instead of `unknown option`: `kind=` on `node` (→ `shape=`),
`width=`/`height=` on `node` (→ a `pin` line), `label=`/`taillabel=`/`headlabel=` on `edge`
(→ inline `[…]` labels) and `from=`/`to=` on `band` (→ the positional
range). `kind=` is retired **language-wide** (`CHART-BLOCK-NAMING`), not merely on
`node`, and so is `color=` (`COLOUR-KEY-STATUS`) — it named the FILL
in one era and the LABEL in another, and no engine can tell the
two apart, so its message names both eras and hands the choice to a human.

**Renamed.** Each old spelling is now a line error carrying a
named diagnostic that states its replacement; every rename takes the word
from a standard that already means exactly this (`UNSAFE-DEFAULT-ELIMINATION` single-source). **Two
rows left this table and are recorded here rather than dropped
silently:** `via=` → `points=` (`WAYPOINT-KEY-SPELLING`) and `src=`/`dst=` →
`tailport=`/`headport=` (`ENDPOINT-DOCKING-KEYS`). Those renames happened and were correct; `EDGE-GEOMETRY-CONSTRUCTS`
then withdrew the *replacements* from the language along with `path`, so all
five spellings are line errors today and **none of them names a replacement**
— the diagnostic says to delete the line. A rename has a destination; a
withdrawal does not, which is the whole difference between the two kinds of
retirement.

| Old | New | R | Why |
|---|---|---|---|
| `boundary` | `external` | `EXTERNAL-ENDPOINT-NAMING` | UML's «boundary» is an INTERNAL interface object, C4's `System_Boundary` is the dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning — all three invert or displace the intended sense, which the spec's own prose already stated as "declares an external I/O endpoint" |
| `layer` · `layer=` | *(nothing — see below)* | `PLANE-KEYWORD-SPELLING`, then `PAINT-ORDER-CONSTRUCT` | `PLANE-KEYWORD-SPELLING` renamed both to `plane` · `plane=` at 0.1, on the ground that in mxGraph — the geometry model FigDown adopted — a layer is a CONTAINMENT PARENT that establishes coordinates, while no standard claimed `plane` for a conflicting meaning. **That last clause was false in one genre and nobody could see it**, because the claim was made in a paragraph belonging to no genre: in networking, "plane" is the control / data / management partition, and `topology` is precisely the genre network engineers author in. `PAINT-ORDER-CONSTRUCT` therefore **withdrew** `plane` · `plane=` from the language, so this row's destination no longer exists and its diagnostic now states the whole chain (`layer=` → `plane=` → withdrawn) instead of ending at a spelling that is gone — the `route` → `path` precedent from 0.1 |
| `plot` | `chart` | `CHART-BLOCK-NAMING` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | `CHART-BLOCK-NAMING` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace. Its one legal value was renamed `bars3d` → `bar3d` |

**Changed — the annotation family.** One rename, one shape
change and one deletion, all on the two EXPERIMENTAL scene markers of §2.6
and on `chart`. The two mechanical ones are line errors that name their
migration; the `band` label is not mechanical, because only the author
knows the region's name.

| Old | New | R | Why |
|---|---|---|---|
| `guide` | `threshold` | `THRESHOLD-KEYWORD-SPELLING` | an **inverted** name, which `UNSAFE-DEFAULT-ELIMINATION` rates worse than an unfamiliar one: in Illustrator, Inkscape, Figma and draw.io a *guide* is an author-only construction line that is NEVER rendered, while FigDown's is drawn output, and no counter-example was found where "guide" names rendered output. `guide` was also recorded `source = FigDown` — a coinage, which `SIZE-AND-DIRECTION-KEY-NAMING` makes a last resort. `threshold` comes whole from **Grafana**, whose threshold render option is literally *"Show thresholds: as lines / as filled regions / as both"* — FigDown's marker + region pair, split the same way — with **IETF RED/AQM** `min_th`/`max_th` (RFC 2309, RFC 7567) as the secondary source. 77.8% of 126 measured corpus marks and 78% of 63 distinct marker names are thresholds; target/mean/reference marks: 0. The model array `guides[]` is renamed `thresholds[]` with the keyword (`NORMATIVE-SEMANTIC-MODEL`) |
| *(nothing)* | `threshold` label, `in=`, `offset=` unchanged | `THRESHOLD-VALUE-SCOPE` | the shape did NOT change with the name: no `value=` and no `ref=` were added, because **zero** corpus figures carry a literal numeric value — every reference is a named software-configurable register, and the name already lives in the mandatory label |
| `band <a>-<b>% …` | `band "<label>" <a>-<b>% …` | `BAND-LABEL-STATUS` | *(both spellings are as they stood at 0.1; the RANGE separator itself moved to `..` at 0.1, `RANGE-SPELLING`, so the live form today is `band "<label>" <a>..<b>% …` — the row above records what this release changed, not the current grammar)* the quoted label is now MANDATORY and written FIRST. See §2.6: with no label slot at all, a band whose `fill=` a reader discards as presentation (§5, `PRESENTATION-AS-MEANING-CARRIER`) asserted **nothing whatsoever**. Its §5 carve-out row is gone |
| `chart … level=` | *(deleted)* | `CHART-LEVEL-KEY` | not renamed — **deleted**. Zero corpus uses, zero 3-D bar charts, zero requests. It was also the only construct whose caption the ENGINE wrote rather than the author, and its `parseFloat` grammar uniquely accepted `1e3`, breaking the otherwise-uniform `\d+(\.\d+)?` numeric grammar |

### The drawn annotation: `note=` (`DRAWN-ANNOTATION-FORM`)

**`note=` puts an explanation on the page.** Under `block` it is accepted on
exactly four directives — `node`, `group`, `edge` and `title` — and its value
is **quoted prose; the quotes are mandatory**, as they are on every other
prose-valued key in the language (`QUOTING-RULES`):

```figdown
figdown 0.3 block
title "Fig 3-2 — pod fabric" note="Total: 8k tunnel indexes"
node spine "Spine" note="valid only while the uplink is up"
node leaf "Leaf"
group pod "Pod A" note="one failure domain"
edge spine -- leaf note="250 MHz"
```

**Attachment is by SYNTACTIC POSITION.** The note is written on the annotated
element's OWN line. There is no id to write, no target key, no locator — and
therefore no way to be wrong about which of three identically labelled nodes
is meant. An `edge` has no id at all, which is exactly why an attribute is the
only form that could ever reach a `block` connector: `note=` reaches it
because it is written on it.

**It requires `figdown 0.3`.** Under `figdown 0.1` or `figdown 0.2`, a `note=`
on any of the four is a line error naming the version, because under those
headers the spelling is still the RETIRED one that meant a never-drawn
`description=` (`DESCRIPTION-KEY-SPELLING`). Raising the section header is the whole
migration; no existing `block` document is rewritten, and none becomes
invalid. The v0.1 conformance surface is untouched by this row for the same
reason: a `figdown 0.1` document cannot write the key at all.

**`note=` and `description=` divide by AUDIENCE, not by length.**
`description=` reaches the **machine**: it draws no ink beyond an SVG
`<title>` tooltip, and under `block` no directive accepts it — the only one
that does is `bitfield`'s `field` ([bitfield.md](bitfield.md)). `note=`
reaches the **human**, and it ALWAYS draws. Where an element can take both,
writing both is legal and meaningful, and **neither is a fallback for the
other**: a note is not a long tooltip, and a tooltip is not a quiet note.

**The author does not place the box (`DOMAIN-CONVENTION-DIRECTIVES`).** `note=` takes no `at=`, no
`side=`, and there is no `left of` / `right of` form to write. The engine
chooses adjacency around the carrier's final geometry — the node's box, the
group's rect, the edge's segments — after every label and arrowhead has been
placed, and it **reaches for a leader line only when adjacency fails**. A
`title … note=` has no geometry to sit beside: it is drawn as a figure-level
note at the bottom of the canvas and never takes a leader. This is the same
division that keeps `at=` on `pin` and out of everything else — under `block`,
position is the layout zone's business and never an annotation's.

**Where a typed slot exists, `note=` is never the right answer.** `block` has
several, and each of them is a claim a reader can act on, where a note is only
prose a reader must interpret:

- a **category** is a `class` meaning — it earns a legend entry and every
  member of the class carries it; the same sentence copied onto six nodes
  does not;
- **containment** is `in=`, or the `group` the node is declared under — never
  a note saying "this one is inside the pod";
- a **node's name** is its quoted label; a name that will not fit its box is
  still a label problem, not an annotation;
- a **level marked across a node or a group** is a `threshold` or a `band`,
  each of which already carries a mandatory label of its own. (A **layer**
  was `plane=` until this release; there is no such key now, and a set of
  elements that forms a logical layer of the SUBJECT is a `class` whose
  meaning says so — §5, `PRESENTATION-AS-MEANING-CARRIER`.)

A `note=` is for what none of those can hold: the caveat, the measured figure,
the sentence the diagram is otherwise missing.

### How this differs from the other genres

**Until this release this section said "today the only difference is a
default", and that sentence was false in both directions.** It had been false
when `flowchart` landed `process`/`decision`/`terminator`;
after `GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING` the node and connector spellings diverged too; and after `SUBJECT-VOCABULARY-SCOPE`
each scene genre declares its own subject vocabulary, so the differences are
now the ordinary case and the agreements are the ones worth pointing at.

| | `block` | `topology` | `flowchart` | `statechart` |
|---|---|---|---|---|
| the thing | `node` | `node` | `node` | **`state`** |
| the line | `edge` | `edge` | **`flowline`** | **`transition`** |
| own subject vocabulary (`SUBJECT-VOCABULARY-SCOPE`) | **`group` `external` `threshold` `band`** | `group` `external` `bundle` | `external` — plus the roles `process` `decision` `terminator` | **none, and the emptiness is the declaration** |
| `flow` default | **`right`** | `right` | `down` | `right` |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | **NORMATIVE** | EXPERIMENTAL | EXPERIMENTAL | EXPERIMENTAL (needs `figdown 0.2`) |

Every scene genre also accepts the host set `class` / `flow` / `rank` (NS = H
above) and may open a `bitfield`/`table`/`timing`/`chart` region (§4, `GENRE-COMPOSITION`).

**Where two cells of the subject row read the same, they are still two
declarations.** `group` and `external` under `topology` are `topology`'s own
words, declared in its own document with its own reading advice — a
`topology` reader has to be warned off the multicast group and the external
route, and a `block` reader has nothing to be warned about. Sixteen cells of
that row were withdrawn without any surviving cell changing,
which is the property the shared list could not offer.

The status row is a statement about convergence rather than about syntax:
`block` is the scene genre v0.1 freezes on. What has changed since `DOMAIN-VOCABULARY-PREFERENCE` §4 is
the *reason* the others are held back — no longer "nothing but a default
separates them", but that each is still assembling a vocabulary of its own
and none has finished.

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `block` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a genre MAY
spell a keyword the same as `block`'s with a different meaning; neither the
core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`) can ever be
redefined.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

> Longer scene prose (historical core §2.1–§2.8, labels/edges/external
> detail) is archived at the end of this file under **Scene model detail**
> so core + this document remain self-contained without depending on a
> long §2 chapter in [core.md](../core.md).

A block figure's meaning is a **scene**: a set of nodes, the groups that
contain them, and the edges that relate them.

- A node names a part. Its label carries what the part *is* (`FIDELITY-TARGET`); its
  `shape=` is geometry and carries no domain meaning (`SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`).
- An edge names a relation between two parts. The operator carries the
  direction; the endpoint order and operator token are preserved exactly as
  written and MUST NOT be normalized (§2.3, `READ-SIDE-DETERMINISM`).
- A group names containment. Membership is declared with `in=`, never
  inferred from rendered geometry.
- `flow` and `rank` express reading order and peer alignment — they are
  CONTENT, not layout, and they stay in the content zone, where they pass the
  `GUI-WRITEBACK-STRUCTURE` strip test and `tools/strip-check.js` does not strip them; `pin` is
  geometry with no meaning and lives in the `layout`
  zone (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`). (`path` and `routing` were the zone's other two members
  until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them; the content/layout split the rule
  states is unaffected — it is about which zone a construct belongs in, not
  about how many constructs the layout zone holds.) `rank`'s canonical form is one comma-delimited token
  (`rank a,b,c`); the space form `rank a b c` was RETIRED at  <!-- fence-check: skip -->
  0.1 (`POSITIONAL-LIST-SPELLING`) and is now the line error `rank takes ONE
  comma-delimited token: write rank a,b,c — the space form is retired
  (MIGRATIONS 0.1)`. Reserving the rest of a `rank` line for future
  `key=` options is exactly what forces this: a positional list that runs on
  past whitespace never terminates, so there is nowhere for an option to
  begin. `POSITIONAL-LIST-SPELLING` had ruled the space form "NOT deprecated" on migration cost,
  and cost is not a language argument before the freeze. A reading agent IGNORES
  every member of the layout namespace by default, wherever in the document it
  appears (`GENRE-NAMESPACE`: membership decides, not position; core §10 (a′) enumerates) —
  the exception is the missing-construct workaround for a load-bearing
  arrangement (`MEANINGFUL-ARRANGEMENT`), which is a semantics gap, not a second contract.
  `GENRE-NAMESPACE` made that the default, and it is only safe if no genre semantics
  can ever appear in the namespace — which is exactly what `LAYOUT-ZONE-NAMESPACE`
  guarantees by making the layout zone a namespace of its own that no genre
  may define, redefine or extend a keyword inside.
- Nothing in a block figure means anything by virtue of where it was drawn.

## Errors

`block` adds no error conditions of its own. Its validation profile is the
core profile: unknown keyword, unknown or inapplicable option, unknown
`shape`, duplicate id, dangling edge endpoint, and the
single-valued-directive rules of §8 — all line errors.

**`in=` cycle is NOT in that list, and 0.1 took it out.** Core §8
reserves the category, but **no v0.1 document can reach it**: `in=` is
node-only, `in=` on a `group` line is itself a line error (
`INAPPLICABLE-OPTION-KEYS`), so containment is one level deep and no cycle is constructible.
No implementation has cycle detection, and none needs one. This document is
FROZEN, so it stated flatly an error a conforming engine can never emit —
`conformance/DISCREPANCIES.md` had filed the same fact honestly, under
*Untestable as written*, the whole time. The category stays reserved in core
§8 against a future nesting syntax; it is not a v0.1 error condition.

## What this genre does NOT own (OPEN QUESTION, `DOMAIN-VOCABULARY-PREFERENCE` §4)

`DOMAIN-VOCABULARY-PREFERENCE` rules that every genre SHOULD introduce keywords naming its own
domain's participants and relations. Whether `block` has such a domain
vocabulary is **explicitly open and undecided**. The honest position
recorded in `DOMAIN-VOCABULARY-PREFERENCE` §4 is that a scene of parts and relations may simply *be*
this genre's domain — in which case `node`/`edge`/`group` are not a
borrowed generic fallback but the correct words, and `block` legitimately
remains the generic case.

No block-specific keywords are proposed here. The vocabulary table above is
this genre's complete closed vocabulary today; if a `block`-specific word is
ever ruled in, it lands there. Until then the absence is a decision pending,
not an omission. `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` settles the *permission* question — a genre may own
its words — so what remains open is only whether `block` has words worth
owning.

**`SUBJECT-VOCABULARY-SCOPE` does not answer that question, and should not be read as
answering it.** `group`, `external`, `threshold` and `band` are now `block`'s
own declarations rather than entries in a shared list, but a declaration is a
statement of ownership, not evidence that the word names this genre's
domain. The four are exactly the words `block` already accepted; what changed
is that they are declared here, with this genre's defaults and this genre's
reading advice, instead of in a paragraph belonging to nobody. `DOMAIN-VOCABULARY-PREFERENCE` §4's
question — whether a scene of parts and relations simply *is* this genre's
domain — is unchanged and still open.

## Example

```figdown
figdown 0.1 block
title "L3 Forwarding Datapath"
group ingress "Ingress Pipeline"
node parser "Packet Parser" in=ingress
node l2 "L2 Lookup" in=ingress
node l3 "L3 Lookup"
node q "CRC ok?" shape=diamond
edge parser -> l2
edge l2 -[miss]-> l3
edge l3 -> q
```

## Scene model detail (normative; relocated from core §2)

> Relocated from `spec/core.md` §2 during the `GENRE-DOCUMENT-CONTRACT` spec split so
> **core + this document** remain sufficient without depending on
> a long scene chapter in the core framework. Subsection numbers
> below keep the historical §2.x labels for cross-reference.

### Historical heading: Core scene model

The census shows these three types are one family: **boxes, containment,
and connections** — differing only in node kinds and edge styling. They
share one core model (the "why can't it be primitive + styling" rule).

### 2.1 Nodes

```figdown
node parser "Packet Parser"
node l3 "L3 Lookup" fill=#0d9488
node q1 "CRC ok?" shape=diamond
node sw1 "ToR Switch" shape=rounded
```

- `shape=` is **purely geometric** (`SHAPE-ENUM-VOCABULARY`): `box` (default) | `rounded` |
  `circle` | `ellipse` | `diamond` | `cylinder`. The language
  deliberately binds **no domain nouns** (router/host/gateway…) — an
  endless vocabulary; what a device *is* belongs in its label text
  (`FIDELITY-TARGET`: the meaning lives in the text). Unknown shape = line error.
  `cloud` was the one value that broke this rule — it named a domain
  (the internet cloud) rather than a geometry — and was **retired** (`SHAPE-ENUM-VOCABULARY`); it now produces a named diagnostic pointing at
  `shape=ellipse` plus a label or `class` that says what the region is.
- Nodes accept `style=dashed|dotted` (e.g. bridge-domain boxes in
  vendor figures).
- **The label is optional, and an absent label is recorded as absent**
  (`OMITTED-LABEL-RECORDING`). `node a` MUST NOT be read as `node a "a"`: the model records no
  label, so a reading agent can always tell "the author wrote no label"
  from "the author's label happens to equal the id". **Renderers MUST
  fall back to displaying the id** when no label was written, so
  `node a` still draws a box reading `a`. The substitution is a
  rendering rule, never a model rule.

  The same rule applies to every directive with an optional label —
  `group`, `external` (§2.8, which has no id fallback: an unlabelled
  external draws no text at all), and the typed blocks
  `bitfield` / `table` / `timing` (§4). It is a language-wide rule, so it
  holds equally for a label-bearing directive another genre declares, such
  as `topology`'s `bundle`.

- **An explicitly empty label `""` is a written value, and it draws
  nothing** (`EMPTY-LABEL-STATE`). `node a ""` is a third state, distinct from both
  `node a` and `node a "a"`: the model records `label: ""`, and the
  renderer MUST draw no text for it. The id substitution above applies
  ONLY to absence — the id is an internal handle, never authored display
  text, so substituting it would put words into a figure whose source
  has none. This is how a source figure with a deliberately textless
  shape (an unlabelled multiplexer, a junction, a bare glyph) is written
  without inventing a label or dropping the shape (`TRANSCRIPTION-FIDELITY-TIERS`, `EMPTY-LABEL-STATE`). The rule
  is uniform across **every** label-bearing directive and `title`. The
  COUNT changed and this sentence used to carry it: the
  conformance fixture `215-label-empty-string` wrote **nine** empty labels
  and now writes **eight**, because the `plane` line left the language with
  its directive (`PAINT-ORDER-CONSTRUCT`) and the `bundle` line moved to a `topology` section
  rather than being dropped (`SCENE-KEYWORD-MEMBERSHIP`). The rule itself is untouched — what changed
  is how many directives there are to apply it to, which is why the number
  belongs in the fixture and not here.

### 2.2 Containment (groups / nesting)

```figdown
group ingress "Ingress Pipeline"
node parser "Parser" in=ingress
node l2 "L2 Lookup" in=ingress
group vtep1 "VTEP-1"
node vm1 "VM" in=vtep1               # one level of nesting
```

Flat `in=` reference keeps the grammar line-oriented (no indentation
semantics, no `end` blocks). `in=` is a **node** option; `group` does
not accept it — nesting is one level (a node in a group) in v0.1, so
`group … in=…` is a line error. Groups accept `gap=<px>` — member spacing
(presentation, `PRESENTATION-CONTROL-TIERS`); `gap=0` packs members flush, giving the classic
one-frame-with-dividers look. `INDENTED-BLOCK-SUGAR` (indented block sugar) is
**rejected**: it would be a second containment syntax (`NEW-CONSTRUCT-EVIDENCE-GATE`/`SPELLING-LENGTH-VS-FREQUENCY`).

### 2.3 Edges

```figdown
edge parser -> l2
edge l2 -[on miss]-> acl style=dashed
edge sw1 [e1/1] -- [e1/2] sw2          # endpoint (port) data
edge peer1 <-[3-way handshake]-> peer2
edge ack <- syn                        # statement order = author's focus
```

Operators `--` `->` `<-` `<->` — exactly D2's set (Mermaid/D2
conventions, AI prior knowledge, `DESIGN-DECISION-METHOD`/`REVERSE-ARROW-OPERATOR`).

**The written form is the model** (`EDGE-WRITTEN-FORM`). A conforming implementation
records an edge exactly as written — the operator token and the endpoint
order, unchanged:

- The semantic model of `edge b <- a` is `{a: "b", op: "<-", b: "a"}`.
  It MUST NOT be normalized to `{a: "a", op: "->", b: "b"}`, and the
  reverse rewrite is equally forbidden.
- The **direction of the relationship is derived from the operator**, not
  from the endpoint order: `->` runs first→second, `<-` runs
  second→first, `--` is undirected, `<->` is bidirectional. Two
  implementations therefore read the same direction out of the same
  source without ever needing to agree on a normal form.
- `A <- B` and `B -> A` are a **rendering equivalence only**: the drawn
  arrow means the same thing. They are not the same document. The
  spellings are not even visually identical — auto-layout follows
  statement order, so node positions may differ — and the spelling
  exists because the author's statement order is itself part of how
  humans encode meaning.
- Normalizing would also break **references**: a construct that names edges
  records its members in their written order — `topology`'s `bundle` is the
  live one ([experimental/topology.md](experimental/topology.md)). An
  implementation that rewrote `b <- a` into `a -> b` would resolve such a
  reference differently from one that did not — the exact
  cross-implementation divergence the standard exists to prevent (`READ-SIDE-DETERMINISM`).
  (`path`, which named one edge "exactly as written", was the second
  reference this argument cited until `EDGE-GEOMETRY-CONSTRUCTS` withdrew it; the
  first left `block`'s own vocabulary, `SCENE-KEYWORD-MEMBERSHIP`. The rule is
  unaffected either way: it is a rule about how an edge is RECORDED, and the
  divergence it describes needs only one construct anywhere in the language
  that reads written order.)

**Labels are inline, at the three meaningful positions** (`EDGE-LABEL-PLACEMENT`): near
the tail, on the line, near the head — each written where it appears
in the figure (`FIDELITY-TARGET`: text is a 1-D encoding of the figure). A `[mid]`
label splits the operator into halves (left `-` or `<-`, right `-` or
`->`), mirroring Mermaid's `A -- text --> B`. No mainstream language
offers more than three positions (prior-art.md §1).
Typical uses: interface tags (`e1/22.2`), cardinalities (`1`/`N`),
endpoint roles.

Bracket content rules:
- Balanced inner brackets nest verbatim: `[flags[3:0]]` displays
  `flags[3:0]`.
- For unbalanced brackets, `\n`, or literal quotes, use the quoted
  form `["..."]` — the standard string escapes apply (Mermaid's
  quote-inside-shape convention).
- An empty `[]` is a line error. `label=`/`taillabel=`/`headlabel=`
  are retired (migration 0.1).
- Edge endpoints are **nodes or declared `external` endpoints** (§2.8):
  an endpoint naming a group is a line error (connect to a member node;
  group-level edges are out of scope for v0.1 — silently dropping them
  would violate the no-silent-failure rule), and a truly unknown id is
  a dangling-endpoint line error.

Edge lines carry **pure semantics** — endpoints, direction, labels.
*How* a connection is drawn across the canvas is a rendering
parameter with no meaning, and it belongs in the trailing layout zone with
`pin` — never inline on an `edge` line. v0.1 has **no** per-edge geometry
construct at all: the `routing` and `path` directives held that role until
`EDGE-GEOMETRY-CONSTRUCTS` withdrew them, and nothing replaced them. Shape an edge
by shaping the scene — `rank`, `flow`, declaration order, and `pin` on the
endpoints.

### 2.4 Planes (`PRESENTATION-CONTROL-TIERS`) — WITHDRAWN FROM THE LANGUAGE (`PAINT-ORDER-CONSTRUCT`)

**The `plane` keyword, the `plane=` option key and `z-index=` no longer
exist**, in this genre or in any other. They were **removed, not renamed**, so
there is no replacement spelling to migrate to — the shape `EDGE-GEOMETRY-CONSTRUCTS` left behind
when it withdrew `path`/`routing`. Writing any of the three is a
line error that names the withdrawal and names no destination. The heading
keeps its historical number because §2.5–§2.8 are cross-referenced under
theirs.

**The measurement that settled it.** Stripping the two lines that carried a
declared plane out of `examples/evpn-fabric.fd` — the plane declaration and
the one ` plane=` reference — and rebuilding produced an SVG of **12449
bytes, exactly as before**; of 198 markup tokens **one** differed, and it was
an edge index (`data-edge="36"` → `data-edge="35"`). Normalising that index
made the two files byte-identical. The overlay's entire visual identity —
red, dashed — came from `class=overlay`, which the figure had already
declared. A construct whose removal changes nothing that is drawn is not
carrying the meaning it appears to carry; the `class` was.

**What did NOT change, and is NORMATIVE.** The implicit `base` plane and the
model's `planes` array are untouched: every document still has
`planes[0] = {id:"base", z:0}`, every `node` and `edge` still reports
`plane: "base"`, and **paint order is document order** — a later line paints
on top. A document that used the keyword deletes the declarations and every
reference to them; if the elements form a logical layer of the SUBJECT — an
overlay, a control plane — that is a `class` whose meaning states it (§5,
`PRESENTATION-AS-MEANING-CARRIER`), which is what the corpus's two authored uses were already doing
alongside it.

**Why a `block` row was withdrawn for a `topology` reason.** `plane` had zero
authored uses under `block`; both authored uses in the tree were `topology`
documents, and it was in `topology` that the spelling was worst — in
networking a *plane* is the control / data / management partition of a
device, so the one word said the wrong thing to exactly the readers who write
the figure. `PLANE-KEYWORD-SPELLING`'s 0.1 rename had recorded that "no standard claims
`plane` for a conflicting meaning", and that claim was made in a paragraph
belonging to no genre, which is why it survived four years of a genre in
which it was plainly untrue. The word is gone from every genre rather than
from one, because a z-order has no referent in any domain: there is nothing
for a genre to declare it *about*.

### 2.5 `bundle` (EXPERIMENTAL, and `topology`'s word) — WITHDRAWN FROM THIS GENRE (`SCENE-KEYWORD-MEMBERSHIP`)

**`block` no longer declares `bundle`; `topology` does, alone.** This is a
per-genre withdrawal, not a retirement: the construct is live, and writing it
under `block` is a line error that names the genre that has it and states the
ground. Its normative home is
[experimental/topology.md](experimental/topology.md), itself EXPERIMENTAL.

The evidence was one-sided. Over the in-repo corpus `bundle` has **zero
authored uses under `block`** — every authored link bundle is a `topology`
document — and its `block` occurrences were conformance fixtures plus the
`block` reference figure, neither of which is evidence of need
(`decisions/registry.md`).

**The stronger reason is the one only a per-genre declaration could
state.** `topology` defines `bundle` **by its referent** —
a LAG (IEEE 802.1AX), an ECMP set, an EVPN Ethernet Segment — in two lines,
because the domain reading and the drawn reading are the same reading. Under
`block` there is no referent to name, so the definition could only be
geometric: *a dashed ring enclosing parallel edges between the same pair*.
That is a paragraph that describes a drawing and asserts nothing, and it is
what the shared section had been carrying. The withdrawal deletes the weaker
of two definitions and leaves the stronger one where its subject matter is.

### 2.6 Thresholds and zone bands: `threshold`, `band` — EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`), and DECLARED BY `block`** — see
[§The `block` genre's own subject vocabulary](#the-block-genres-own-subject-vocabulary-ns--b)
above for the two declarations themselves, including the WRED collision that
`threshold` carries and the reason `band` does not collide here. What
[../experimental.md](../experimental.md) §E3 adds is the status treatment:
why they stay experimental through the 0.1 changes — `GENRE-EARNING-THRESHOLD` governs, the
scalar-marker need is genre-shaped rather than keyword-shaped, and these two
are the `GENRE-EARNING-THRESHOLD` *interim* while the candidate genre (core §9, `QUANTITY-EXTENT-GENRE`) is
designed. Both are outside the v0.1 conformance surface and outside the
compatibility promise; the engine accepts them unchanged and the documents
that use them keep working. See core §10 for what the status means.

**`block` is the ONLY genre that declares either.** `SCENE-KEYWORD-MEMBERSHIP`
withdrew both from `topology`, `flowchart` and `statechart` against zero
authored evidence in all three, which is also the first half of the eventual
extraction: when the scalar-marker genre lands, lifting them out is a
one-genre operation rather than a four-genre one.

**Nothing frozen in this document depends on §2.6.** `block`'s own NORMATIVE
vocabulary is `node`, `group`, `external` and `edge`, plus the host set
`class`, `flow` and `rank`; the two experimental constructs above share the
genre's namespace without being part of that set, and this document stays a
complete, self-contained normative home for genre `block` with the
experimental file set deleted.

### 2.7 Semantic classes: `class` (+ derived legend)

```figdown
class vidp "VID_P — primary VLAN"   stroke=#dc2626
class vidc "VID_C — community VLAN" stroke=#2563eb
edge up  <-> pp1 class=vidp
edge pp1 <-> cp1 class=vidc
```

`class <id> "<meaning>" [fill=] [stroke=] [style=]` declares a
**semantic class** once: a machine-readable meaning plus presentation
defaults (Mermaid `classDef` heritage; `PRESENTATION-CONTROL-TIERS`'s HTML+CSS analogy made
literal). Any `node`, `group`, `edge`, `field`, `cell` mark, or typed-
block opener (`bitfield`/`table`/`timing`) joins it via `class=<id>` —
or **multiple** classes via `class=hot,deprecated` (comma-separated,
same convention as `pin at=` / `data=`; 0.1). The model field
is an array of ids. Same-line repeated `class=` is a line error.

- The corpus evidence (prior-art §4.4): 56% of real figures carry
  categorical meaning in color with no stated mapping. `class` is that
  mapping — an agent reads `class=vidp` on the element itself (`MEANING-RECOVERY-SOURCE`),
  never correlating hex values.
- **The meaning field is mandatory; its value may be empty** (
  `CLASS-EMPTY-MEANING`) — the language's own absent/`""`/`"text"` tri-state (`EMPTY-LABEL-STATE`):

  | form | status | legend |
  |---|---|---|
  | `class x` | **line error** — the field is missing | — |
  | `class x ""` | **legal** — no meaning is claimed | **no entry** |
  | `class x "Hard ceiling"` | legal | entry drawn |

  `class x ""` is pure attribute grouping: one name applied to many
  members so a shared look is not repeated, asserting nothing about what
  the look means. A reading agent concludes NO category from it (core
  §12.7). It is **not** the way to spell a role — a `flowchart` role
  belongs in that genre's vocabulary, not in a meaning-less class.
- A **legend strip derives automatically** (declaration order, swatch +
  meaning): no coordinates, no dummy elements. It
  draws what the author declared and nothing the author did not: no swatch
  for a class that declares no paint (`CLASS-PAINT-REQUIREMENT`), and no entry at all for a
  class whose meaning is `""` (`CLASS-EMPTY-MEANING`).
- Explicit element attributes override class defaults (rigidity, `LAYOUT-STABILITY`).
  When several classes are joined, their presentation channels apply
  left-to-right and later wins per channel (CSS multi-class cascade).
- Class ids are their own namespace; referencing an undeclared class
  is a line error; duplicates are errors. Empty `class=` and empty
  members (`class=a,b`) are line errors.
- Stripping `fill=`/`style=` from a `class` line loses nothing
  semantic — the id and meaning stay (§5 invariant refined). When a
  color *classifies*, authors SHOULD use `class`; bare `fill=` is for
  decoration.

### 2.8 External endpoints: `external`

```figdown
external wire "to wire"
node mac "MAC"
edge mac -> wire
```

`external <id> ["label"]` declares an **external I/O endpoint** — the
outside world an edge enters from or leaves to. Reading semantics
(`MEANING-RECOVERY-SOURCE`): an external is *not* a participant node; it states only that the
connection crosses the figure's boundary.

- Edges reference it at either endpoint exactly like a node. **It takes NO option key whatsoever** (`PAINT-ORDER-CONSTRUCT`): `plane=` was the
  last one it accepted, and it went with the `plane` keyword, so the
  acceptor list is empty rather than short. `fill=`, `stroke=` and `style=`
  are line errors here: an external has no fill, no border and no dash to
  apply them to (§5 carve-outs); `color=` was its one paint key and it is
  retired language-wide (`COLOUR-KEY-STATUS`), so its label is drawn in the canvas ink
  (`LABEL-COLOUR-SOURCE`). Extra positional arguments are line errors.
- Ids share the node/group namespace — which also
  contains the typed-block ids (`bitfield`/`table`/`timing`), so a bare id
  in `edge`/`pin` is never ambiguous. Duplicates and cross-kind
  collisions are line errors.
- **Never drawn as a shape.** The edge simply ends open (keeping its
  normal arrowhead) at a small invisible anchor that auto-layout
  places at the figure's natural margin; `pin <id> at=(x,y)` overrides
  with node-pin semantics (`at=` is the only key an `external` endpoint
  takes — `width=`/`height=` are a line error on one, because its geometry
  derives from its content). The label, when given, renders as small
  muted text just beyond the open end, away from the edge direction.
  `shape=none` was rejected: `shape=` is purely geometric (`SHAPE-ENUM-VOCABULARY`) — an
  external is honest semantics, not a hidden node.
- Corpus evidence (`EXTERNAL-EDGE-ENDPOINTS`): 70–80% of block/flowchart figures contain at
  least one open-ended arrow.


