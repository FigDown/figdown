# FigDown Genre: `statechart`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any statechart figure.
>
> **Genre status: EXPERIMENTAL (`STATECHART-GENRE-SCOPE`).**
> `statechart` is outside the conformance surface and outside the
> compatibility promise. It may change or be **withdrawn** in a later `0.x`
> with no migration — `path` and `routing` are the precedent, and withdrawal
> costs a corpus one line per figure because the genre adds no syntax to
> unwind. It is experimental for a reason stated plainly rather than buried:
> **it landed ahead of its corpus evidence.** See §Status below.
>
> **It requires `figdown 0.2`.** `figdown 0.1 statechart` is a line error
> carrying a named diagnostic; see core doc §13.
>
> **The option key `in=` is WITHDRAWN from this genre (`MEMBERSHIP-KEY-ACCEPTANCE`),
> and its spelling is RESERVED.** It named a `group` id, which this genre has
> never declared and cannot (`SUBJECT-VOCABULARY-SCOPE`), so every value was a dead end — but the
> reason for withdrawing rather than leaving it is the reservation: **`in=`'s
> value domain here is a `state` id**, because UML 2.5.1 §14.2.3.4 composite
> states would arrive as nesting on `state` through this exact key. See
> §*`in=` is reserved for composite states*.

**Census**: 5 in-repo figures; **3 of 91 production documents**. Prior art:
Harel *statecharts* (the diagram-type name); **OMG UML 2.5.1 §14
(StateMachines)** as the semantic source family *and* as the source of this
genre's two keywords; protocol RFC state diagrams (TCP RFC 9293 Figure 5,
DHCP RFC 2131 §4.4) as the corpus that motivated it.

**Why OMG UML 2.5.1 and not ISO/IEC 19505**, cited the ISO
number and that was the wrong edition to name: **ISO/IEC 19505-2:2012 is the
older 2.4.1 text**, and 2.5.1 is newer and complete. Both are free, so the
choice is an edition choice and nothing else — and the clause that defines
`State` and `Transition` was actually **read** before either word was taken.
A vocabulary row that cannot be checked by a reader of this repository is a
claim, not a citation.

*(Correction, 0.3.z: this paragraph used to give a second reason — "ISO/IEC
19505 is **paywalled**" — and that reason is **false**. ISO/IEC 19505-1:2012
and 19505-2:2012 are obtainable **free of charge**: OMG hosts the normative
text at `omg.org/spec/UML/ISO/19505-2/PDF`, and the project has since fetched
and read it (`decisions/registry.md` cites clauses from it
first-hand — 14.3.17 `Lifeline`, 14.3.18 `Message`, 14.3.15
`InteractionOperatorKind`). ISO also carries them on its Publicly Available
Standards page — recorded here as reported, not as read. What was true is
that the ISO **storefront** copy is priced; a priced storefront was mistaken
for an unobtainable document, and the mistake was never checked against the
document. The **edition** half of the old sentence is correct, is untouched,
and is now the whole of the reason. Same defect class as `VOCABULARY-SOURCE-ATTRIBUTION` and as the
Terminator correction two sections below: prose asserted something about a
standards document that nobody had opened. This is the third time, which is
why `decisions/registry.md` exists.)*

## Purpose

Expresses a **finite-state machine**: a closed set of **states** and the
**transitions** among them. A `state` is a *mode of being* the machine is in;
a `transition` is a change of mode on an event. Typical figures: protocol
connection FSMs, session and lease lifecycles, hardware mode machines.

Distinguished from `flowchart` by what the thing **is**: a flowchart step is
performed, a state is endured. Nothing in the *drawing* separates them, which
is the whole reason the genre exists (§Why the header is the only dispatch
point) — and the two genres no longer share the *words*
either.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `right` | The core-model default. `statechart` does **not** take `flowchart`'s `down`: FSM figures are commonly wide, and most real ones are pinned anyway |
| `shape` | `box` | The core-model default (§2.1). Do **not** encode state-ness in a shape (`SHAPE-ENUM-VOCABULARY`) — the genre already says it |

## Complete vocabulary (normative)

**This is the whole of what a `statechart` document may write at top level.**
Until 0.3 this section was a CROSS-REFERENCE — "every row of
`topology.md`'s vocabulary table applies here unchanged, with three
substitutions" — on the ground that two copies of a twenty-row table drift.
That reasoning was sound about drift and wrong about ownership: `GENRE-VOCABULARY-OBLIGATION`'s exchange
condition is that a genre documents *its complete vocabulary in its own
document*, and a document that forwards to another genre's table is exactly
the incompleteness the audit found (`decisions/registry.md`). The
table is short now — six of the rows it used to borrow were withdrawn from
this genre in the same release — so the copy is small, and it is this genre's
own.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three —
`figdown` `title` `layout` — identical under every genre and never redefined
(`UNIVERSAL-CORE-KEYWORDS`); **L** = the layout namespace (`LAYOUT-ZONE-NAMESPACE`), genre-independent, no
genre may define or redefine a keyword inside it; `pin` is its only member;
**H** = the **scene host set** — `class`, `flow`, `rank`: styling declaration
and layout intent, not subject vocabulary, so no genre's domain holds a
competing meaning for any of them (`SUBJECT-VOCABULARY-SCOPE`); **S** =
**`statechart`'s OWN vocabulary** (`GENRE-VOCABULARY-OBLIGATION`), legal under this genre and no other;
**N** = a nested-genre opener — composition, not `statechart` vocabulary
(§4, `GENRE-COMPOSITION`).

Every row below is EXPERIMENTAL *as written in a `statechart` document*,
because the genre is; the Status column records each construct's own status,
which is what an author needs when carrying it into `block`.

| Keyword | Form | NS | Status | Option keys | `statechart` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.2 statechart` | C | NORMATIVE | — | required, first significant line; **`figdown 0.1 statechart` is a line error** (`STATECHART-GENRE-SCOPE`) |
| `title` | `title "<text>"` | C | NORMATIVE | `note` (requires `figdown 0.3`) | absent |
| `state` | `state <id> ["label"]` | **S** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `note` (requires `figdown 0.3`) | `shape=box`, label absent; `role` is recorded ABSENT, exactly as a bare `node` records it. OMG UML 2.5.1 §14 |
| `transition` | `transition <a> [tail] <op> [head] <b>` | **S** | **EXPERIMENTAL** | `stroke` `style` `class` `note` (requires `figdown 0.3`) | op is written form; `[mid]` splits the operator and carries the inscription; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`). OMG UML 2.5.1 §14 |
| `class` | `class <id> "<meaning>"` | H | NORMATIVE | `fill` `stroke` `style` | the meaning FIELD is REQUIRED, its VALUE may be `""` (`CLASS-EMPTY-MEANING`); a class a `transition` joins must not declare `fill=` without `stroke=` — a transition has no interior, so the two name ONE channel (`INTERIOR-LESS-ELEMENT-PAINT`). Declaring NO paint is legal: the class claims a meaning and the transition keeps its default line (`CLASS-PAINT-REQUIREMENT`'s second half RETIRED at 0.4, `CLASS-CHANNEL-REACH`) |
| `flow` | `flow right\|down\|left\|up` | H | NORMATIVE | — | **`right`** |
| `rank` | `rank <id>,<id>[,<id>…]` | H | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px; all three keys OPTIONAL, at least one REQUIRED; `at=` applies to states and `external` endpoints — and this genre declares no `external`, so states are the reachable case |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `statechart` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | attaches to a `table` id in the same document; `type=bar3d` is the only value |

Option-key values, edge operators and retired spellings are the language's,
not this genre's, and are unchanged here: `shape` is the six-value geometric
enum, `style` is `solid`/`dashed`/`dotted`, `fill`/`stroke` take a hex triple,
a six-digit value, one of the 147 CSS colour names or `transparent`, and the
operators are `->` `<-` `--` `<->` with the written form as the model (`READ-SIDE-DETERMINISM`).
Two keys another scene genre's table lists are absent here: `gap=` (a `group`
key, and this genre declares no `group`) and **`in=`**. `in=` is the one that
needed a ruling of its own, because it is accepted by `state` — `state` is
`node` renamed, and `node` takes the key — so unlike `gap=` it did not fall
away with its directive. It was WITHDRAWN by `MEMBERSHIP-KEY-ACCEPTANCE` and is
RESERVED; see the next subsection. `plane=` and `z-index=` are absent because
`PAINT-ORDER-CONSTRUCT` withdrew them from the LANGUAGE.

### `in=` is reserved for composite states (`MEMBERSHIP-KEY-ACCEPTANCE`)

**`in=` is not this genre's option key, and writing it is a named line
error.** Until 0.3 the parser accepted it on `state`, resolving it
against declared `group` ids — of which a statechart document can have none,
since this genre declares no subject vocabulary at all (`SUBJECT-VOCABULARY-SCOPE`). Every value was
therefore a dead end: `state s "S" in=g` answered `unknown group "g"` and no
spelling of `g` succeeded.

**The withdrawal is not merely tidying a stranded key, and the reason belongs
in this document because it is a claim about this genre's future.** `in=`'s
value domain here is a **`state` id**, not a group id. **UML 2.5.1 §14.2.3.4**
defines the composite state — a state whose behaviour is itself a state
machine, with substates nested inside it — and in FigDown that would arrive as
nesting on `state`, **through this exact key**, because `in=` is already the
language's membership spelling and `SIZE-AND-DIRECTION-KEY-NAMING` forbids a second one for the same
relation. A key left live with a group-id domain would therefore have taught
the WRONG model using the exact spelling reserved for the right one, which is
worse than an error and worse than silence. Withdrawing now and re-adding later
with the correct domain costs nothing: the genre is EXPERIMENTAL, so neither
step needs a version gate or owes a rewrite (`EDGE-GEOMETRY-CONSTRUCTS` precedent).

*What would earn `in=` back:* **UML §14.2.3.4 composite states measured as
needed in real figures** — a count of authored statechart figures whose machine
has substates the flat model cannot state, on the `NEW-CONSTRUCT-EVIDENCE-GATE`/`GENRE-EARNING-THRESHOLD` evidence bar. The
tree's authored figures (`bfd-session.fd`, `dhcp-client.fd`, `turnstile.fd`)
are all flat today.

**`region` does NOT arrive with it, and a later reader should not assume it
does.** UML 2.5.1 **§14.2.3.2**'s `Region` is the ORTHOGONAL compartment — the
construct that says a composite state is in two independent substates at once,
drawn as a dashed division of the state's box. It answers a different question
and needs its own evidence: **0 of this genre's 5 in-repo figures shows
orthogonality**, every machine in all five being in exactly one state at a
time. Tools ship nesting and orthogonality together; figures need them apart.
*`region` reopens on its own evidence only:* a figure whose machine is
genuinely in two states at once and whose reader gets it wrong drawn flat.

### This genre declares NO subject vocabulary, and the emptiness IS the declaration

**`statechart` has exactly two words of its own — `state` and `transition` —
and no subject vocabulary beyond them** (`SUBJECT-VOCABULARY-SCOPE`). This paragraph
exists because a document that simply said nothing on the question would be
indistinguishable from a document that forgot, and `GENRE-VOCABULARY-OBLIGATION` asks for a *complete*
vocabulary: a genre that owns none of the six words the other scene genres
argue over has to say so, in its own document, as a positive statement.

The evidence is unusually clean. Three authored statechart figures exist —
`examples/statechart/bfd-session.fd`, `dhcp-client.fd` and `turnstile.fd` —
all substantial, all transcribed from RFCs, and **not one of them reaches for
any of `group`, `external`, `threshold`, `band`, `bundle` or `plane`.** There
is not even a `statechart` reference figure to manufacture coverage from. The
whole column was empty on evidence alone, before any semantic argument was
made.

Three of the six also fail on **semantics**, and one on **collision**, so the
emptiness is not merely unmeasured demand:

| Withdrawn | R | Ground |
|---|---|---|
| `group` | `SCENE-KEYWORD-MEMBERSHIP` | UML's grouping construct is the **COMPOSITE STATE** and its **REGIONS**. `group` is not UML's word, and under the single-source-vocabulary rule a statechart that needed grouping should take UML 2.5.1 §14's word for it, declared here — not inherit another genre's box. Hierarchy, regions and history are deferred pending `NEW-CONSTRUCT-EVIDENCE-GATE` evidence and are available the day it arrives (reading rule 9) |
| `external` | `SCENE-KEYWORD-MEMBERSHIP` | **RESERVED — see `RESERVED-SPELLINGS` below.** UML 2.5.1 §14 defines `TransitionKind` as `external \| internal \| local`, so in this genre's own source standard "external" already names *a transition that exits and re-enters its source state, firing exit and entry behaviours*. FigDown's `external` means *an endpoint outside the figure, never drawn* (`EXTERNAL-EDGE-ENDPOINTS`). Same word, same genre, same source standard, unrelated meanings |
| `threshold` | `SCENE-KEYWORD-MEMBERSHIP` | **Ground (c), decisively.** A threshold is a labelled reference value drawn at a percentage of the target's RENDERED EXTENT — and a state has no extent that means anything: its box is sized by its label. A line drawn 60% down `ESTABLISHED` asserts nothing a UML reader can read |
| `band` | `SCENE-KEYWORD-MEMBERSHIP` | The same failure, and worse: a band is a **range** over that meaningless extent |
| `bundle` | `SCENE-KEYWORD-MEMBERSHIP` | **An anti-feature here.** Two transitions between the same pair of states are two different **triggers**, and the trigger is the entire content of the arc. Drawing a ring round them removes exactly what the figure is for |
| `plane` | `PAINT-ORDER-CONSTRUCT` | **Withdrawn from the LANGUAGE** with `plane=` and `z-index=`. Ground (a) only in this genre — a z-order has no statechart meaning either way — but it is gone everywhere: paint order is document order |

**All six withdrawals were free**, and the header says why: this genre "is
outside the conformance surface and outside the compatibility promise" and
"may change or be **withdrawn** in a later `0.x` with no migration". `EDGE-GEOMETRY-CONSTRUCTS`'s
withdrawal of `path`/`routing` is the precedent for the shape.

### Reserved, not landed — `RESERVED-SPELLINGS`

Two reservations were recorded against this genre and neither is proposed.
They are written down so that adopting either later is a decision rather than
a rediscovery, and each carries the condition that would reopen it.

- **`external` is RESERVED for UML 2.5.1 §14's `TransitionKind`.** It is
  withdrawn today as FigDown's out-of-figure endpoint, and **it may only ever
  come back meaning what UML means by it** — one of `external`, `internal`,
  `local`, describing how a transition leaves and re-enters its source state.
  A future FigDown that spells the out-of-figure endpoint in this genre must
  therefore pick a different word. *Reopens if:* transition kinds are measured
  as needed — at which point the word is already spoken for, which is the
  whole reason for reserving it.
- **`trigger=` / `effect=` are measured demand and are NOT landed.** This
  genre's 19 authored transitions carry `# trigger:` and `# effect:` comments
  in UML's exact words, **outside the model**: authors reached for UML's
  vocabulary and had to put it in a comment, which a reading agent must not
  parse (`MEANING-RECOVERY-SOURCE`). That is demand sitting in plain sight. It is not landed because
  `decisions/registry.md` makes vocabulary-emptiness a **condition**
  of the two-genre split, so a keyword tranche here reopens that ruling rather
  than extending this one. *Reopens if:* the tranche is argued from a measured
  MISREADING, at the bar `decision` cleared — 22%.

**`state` and `transition` are RENAMES, not new constructs.** Each takes the
option keys, the id namespace, the grammar, the defaults and the model of the
keyword it replaces — `state` records `role` as **absent**, exactly as a bare
`node` does. The five corpus figures re-rendered **byte-identically** across
the rename.

**Why `node` goes away here but stays in `flowchart`.** The two rulings only
look inconsistent until the reason is said: under `flowchart` a stage can have
a role **the source does not state**, and `node` is that genre's only spelling
for it — a transcriber who cannot tell a Process from a Predefined process
must be able to say so without asserting either. A statechart has **exactly
one** kind of node, so there is nothing to leave unstated: `state` loses
nothing and `node` would only be the old word for the same thing. (The reason
is *not* that `flowchart` covers three of ISO 5807's symbols and `node` stands
in for the rest — that is a coverage gap in FigDown, not a state of the
figure; see `flowchart.md` §Roles, *Which of the four to write*.) Under `statechart`, `node` and
`edge` are line errors with a **named** diagnostic (§Errors).

**`statechart` also does NOT inherit `flowchart`'s role keywords.**
`process`, `decision` and `terminator` are `flowchart`'s words (`GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION`), and
under `statechart` each is a line error — `"decision" is not allowed in genre
statechart`. This is not an oversight to be fixed later: a decision is a
*test*, and a statechart has no tests, only guarded transitions. The
condition rides the transition's `[mid]` label.

### The drawn annotation: `note=` (`DRAWN-ANNOTATION-FORM`)

**This genre states this key for itself** — as it now states every other row
above it. When this section was written it was the *only* part
of this document that did, and it said so, on the ground that "a genre
declares its own vocabulary and a shared declaration is not one". `SUBJECT-VOCABULARY-SCOPE`
generalised that sentence to the whole document a release later.

**`note=` is the annotation that draws.** Under `statechart` it is accepted on
`state`, on `transition` and on `title` — three directives, since `group` is
not this genre's word (`SCENE-KEYWORD-MEMBERSHIP`) — and its value is **quoted prose; the quotes are
mandatory** (`QUOTING-RULES`):

```figdown
figdown 0.3 statechart
title "Fig 7-1 — session" note="RFC 4271 §8.2.2, abridged"
state idle "Idle" note="the only state a cold start may enter"
state open "OpenSent" note="the Hold Timer is running from here on"
transition idle -[ManualStart]-> open note="held down for 5 s in practice"
```

**Attachment is by SYNTACTIC POSITION.** The note is written on the state's or
the transition's own line — no id, no target key, no locator. This genre needs
that more than most: two states may legitimately carry the same label, and
this document's own reading rule 11 is about exactly that gap. A note written
on the line cannot be misread onto the other one. A `transition` has no id at
all, so an attribute on its line is the only form that could reach it.

**It requires `figdown 0.3`.** The genre itself already requires `figdown 0.2`
(`STATECHART-GENRE-SCOPE`), and `note=` requires `0.3` on top of that: under `figdown 0.2` the
spelling is still the RETIRED one that meant a never-drawn `description=`
(`DESCRIPTION-KEY-SPELLING`), so `state s "Idle" note="…"` under a `0.2` header is a
line error naming the version and the one-step fix. Raising the section header
is the whole migration.

**`note=` and `description=` divide by AUDIENCE, not by length.**
`description=` reaches the **machine** — it puts no ink on the page beyond an
SVG `<title>` tooltip — and no `statechart` directive accepts it; it belongs
to `bitfield`'s `field` ([../bitfield.md](../bitfield.md)). `note=` reaches
the **human**, and it ALWAYS draws. Where an element takes both, writing both
is legal and meaningful, and **neither is a fallback for the other**.

**The author does not place the box (`DOMAIN-CONVENTION-DIRECTIVES`).** `note=` takes no `at=`, no
`side=`, and there is no `left of` / `right of` form. The engine chooses
adjacency around the state's box or the transition's segments after every
guard label and arrowhead is placed, and **reaches for a leader line only when
adjacency fails**. A `title … note=` has no geometry to sit beside: it draws
as a figure-level note at the bottom of the canvas and never takes a leader.
A statechart's transitions cross the diagram in both directions; a note the
author had pinned to a side would be the first thing a re-layout broke.

**Where a typed slot exists, `note=` is never the right answer.** This genre
has exactly the slots UML gives it, and each of them is a claim rather than
prose:

- **a state IS `state`.** The condition a lifeline is in is not something to
  write in a note beside a node — it is the directive itself. That is why this
  genre spells `state` and makes `node` a line error: a statechart has exactly
  one kind of node, so there is nothing left to leave unstated;
- **a trigger and a guard ride the transition's `[mid]` label** —
  `transition idle -[ManualStart]-> open`. A statechart has no tests, only
  guarded transitions (which is also why `decision` is not this genre's word),
  and the guard belongs on the arrow a reader is already following;
- **a category** shared by several states is a `class` meaning, which earns a
  legend entry and applies to all of them at once.

This list is one item shorter than it was. It used to end
"which composite or region a state sits in is `in=` or the enclosing
`group`", and that item was wrong three times over: `group` never made a
composite state or a region (reading rule 9 said so on the same page),
this genre does not declare `group` at all, and
`in=` is not this genre's key either (`MEMBERSHIP-KEY-ACCEPTANCE` — and its spelling is RESERVED for
the composite-state domain, which is the one thing the old item got right about
where nesting would eventually live). **The honest position is that there is no
slot for it** — hierarchy, regions and history are out of
scope at `figdown 0.2` and deferred pending `NEW-CONSTRUCT-EVIDENCE-GATE` evidence — so a `class`
meaning naming the phase is the interim, and a `note=` saying "this is inside
the Established composite" is prose a reader must interpret, not a claim they
may act on.

A `note=` is for what none of those hold: the caveat, the timer value the
model does not carry, the sentence the state machine is not able to say about
itself.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

This section is what the genre is **for**. Everything above is `block` with a
different word on line 1; everything below is what a conforming reader may
conclude from `figdown 0.2 statechart` that it may **not** conclude from
`figdown 0.1 flowchart` or `figdown 0.1 block`.

A reading agent that sees genre `statechart` MAY conclude:

1. **Every top-level `state` is a state** — a mode the machine is *in*, with
   duration. Under `block` a `node` is an unclassified participant; under
   `flowchart` it is a step, or role-unstated. Here the word says it, and
   there is no role-unstated fourth case, because there is only one role.
2. **Every `transition` is a transition**, and the operator's direction is the
   direction of the state change. `->` and `<-` are transitions; `<->`
   asserts a transition each way. **`--` asserts a relationship the genre
   gives no transition reading** — read it as an undirected association and
   say the direction is unstated, never as a transition in both directions.
3. **A `[mid]` label is the transition's inscription** — trigger, and
   optionally guard and effect — as **free text**. It is quotable and
   attributable and **never parsable**: `event / action` is a convention some
   authors follow and the language does not promise, so splitting on `/` is
   an inference the document does not license.
4. **A self-transition (`transition s -[e]-> s`) means the event occurs and the
   machine stays in `s`.** Under `flowchart` the same drawing is a *poll* —
   "not ready, check again" — which is a different claim about a different
   kind of thing. This is the single reading that flips on the header alone.
5. **The state set is closed as drawn.** The nodes are all the modes the
   figure asserts. (Absence is still not prohibition — a transition not drawn
   is not stated to be forbidden.)

A reading agent MUST NOT conclude:

6. **No current state.** Nothing in the language says which state the machine
   is in now. A `fill=`, a `class`, or a position does not, and §12.7's rule
   that presentation is never meaning on its own is not relaxed here.
7. **No initial state and no final state.** `figdown 0.2` has **no**
   vocabulary for either — `initial`, `final` and `mode` are explicitly
   deferred pending `NEW-CONSTRUCT-EVIDENCE-GATE` evidence. A state with no incoming transition is *drawn*
   that way; it is not *declared* initial, and reading it as initial invents
   a fact the author never wrote. An author who needs the distinction states
   it in a label or a `class` meaning, where a reader gets it as prose.
8. **No transition order.** Peer transitions out of a state have no sequence.
   An ordinal in a label is naming (`MEANING-RECOVERY-SOURCE`), not order.
9. **No hierarchy, regions or history**, and there is not
   even a box to misread as one: `group` was withdrawn from this genre (`SCENE-KEYWORD-MEMBERSHIP`)
   precisely because UML's grouping construct is the **composite state** and
   its **regions**, and borrowing another genre's box to draw one asserted a
   containment UML does not define that way. Superstates, orthogonal regions
   and history pseudostates are all out of scope at `figdown 0.2`, and a
   figure that needs to say a state belongs to a phase says it with a `class`
   meaning.
10. **Nothing from the layout zone** (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`). RFC-faithful FSM figures
    are heavily pinned; every pin is for humans.
11. **No identity between two states, however identical their labels.** Two
    `state` lines are two states. If a figure declares `closed "CLOSED"` and
    `closed2 "CLOSED"`, a reader MUST report **two** states — it may note that
    the labels match and that a `class` meaning or a comment claims they are
    one, and it MUST attribute that claim to the prose rather than to the
    model. It MUST NOT merge them, and it MUST NOT read distinct ids as
    distinct states *known to be different* either: the language says nothing
    about the question in that direction.

### Two identically-labelled states: the gap behind reading rule 11

Rule 11 is a **missing primitive**, not a design choice, and this section says
so because the genre's own premise — one `state` is one state — is exactly
what a duplicated node contradicts. FigDown has **no identity or alias
relation**: `class` asserts a shared CATEGORY, never a shared IDENTITY. It is
filed as [`spec/core.md`](../../core.md) §9 **`IDENTITY-ASSERTION` (identity assertion)**,
which is **OPEN** (2026-07-29 needs audit; pending a frequency measurement).

It is one primitive with three faces:

1. **`spec/core.md` §9 `IDENTITY-ASSERTION`** — the model-side statement.
2. **the project’s working record,
   the ISO 5807 **Connector** row** — genre `flowchart`'s **drawing** of the
   same model fact, not a second requirement. Status **unknown** there, which
   is honest: ISO 5807 §9.4.1 was never read in this repository.
3. **[`examples/showcase/tcp-state-machine.fd`](../../../examples/showcase/tcp-state-machine.fd)**
   — the live instance in **this genre**. It draws CLOSED twice because RFC
   9293's Figure 5 does, so it declares 12 `state` lines for a machine with 11
   states, and only a `class` legend line says otherwise. Merging the two was
   tried and **rejected on readability evidence** (the terminal transitions
   then struck the setup/abort labels around a single CLOSED). That figure is
   therefore evidence that the primitive is **missing**, not that a workaround
   exists.

**There is no UML clause to borrow here.** Elsewhere this genre's
unexpressible items are UML 2.5.1 §14 surface deliberately not taken (`initial`,
`final`, history, regions — deferred pending `NEW-CONSTRUCT-EVIDENCE-GATE` evidence, and available the
day the evidence arrives). This one is different: UML has **no** "the same
state drawn twice", so any claim that everything this genre cannot express is
§14 surface not yet borrowed does **not** cover node identity. It is unfiled
in the standard and open in FigDown. (`OPEN-QUESTION-CITATION-STATUS`.)

## Why the header is the only dispatch point (the ruling this genre rests on)

The obvious alternative to a declared genre is to **detect** a state machine
from its structure and read it accordingly. That was measured on this
project's own corpora, and it does not work:

- **Cycles do not separate them.** All five in-repo state machines are
  cyclic — and so are five in-repo figures that are not state machines.
  Precision **50%** in-repo. In the production corpus, 3 of 11 cyclic
  flowcharts are state machines: **27%**.
- **Self-loops do not separate them.** They appear in **one** of the five
  figures. Recall **20%**.
- **The confusion is not random.** A retry-loop flowchart — poll, back off,
  try again — is *exactly* the figure a state-machine reading would ruin, and
  it is also exactly the figure the structural test flags.
- **The title does not separate them either.** "State Machine" in a `title`
  is routinely a polling flowchart with decision diamonds. `MEANING-RECOVERY-SOURCE` already
  forbids reading meaning out of a title; this genre does not create an
  exception.

So the header is the only implementable dispatch point, and that conclusion
is load-bearing for anything downstream that wants to **route on** the
distinction — a different reading rule (this document), or one day a
different layout. **This increment lands the dispatch point and nothing
else.** No routing, no arc layout, no geometry change of any kind: the five
migrated corpus figures render byte-identically except for the source line
numbers embedded in the artifact.

## Status: this genre landed ahead of its evidence, and that is the price

`GENRE-EARNING-THRESHOLD` §6 filed the position that **3 of 91 production documents is thin
frequency**, and that `GENRE-EARNING-THRESHOLD` "lowers no frequency threshold". That position is
not overturned by `STATECHART-GENRE-SCOPE` and is not answered by it. It is *priced* by
EXPERIMENTAL status: this is the first genre landed before its corpus
evidence, and EXPERIMENTAL is what makes that reversible. Withdrawal needs no
migration and no rewrite of anything but line 1 plus the two renamed
spellings, because the genre adds no syntax of its own beyond those two —
`path` and `routing` already demonstrated withdrawal at that cost.
0.3's own six withdrawals are a smaller instance of the same fact:
this genre gave up six words without a single figure changing, because it was
using none of them.

**What would reopen it:** a production re-measure. If those three documents
turn out to be an artefact of how the corpus was sampled or classified, the
honest move is **withdrawal**, not defence. Nothing in this document should
be read as a commitment to keep the genre.

## Errors

`statechart` adds no error conditions of its own. Its validation profile is
the core profile, plus four that follow from the version and the allowlist:

- `figdown 0.1 statechart` → `genre "statechart" requires figdown 0.2 (this
  document declares 0.1) — write: figdown 0.2 statechart`. The message names
  the one-step fix rather than leaving the author to derive it.
  Core §13.7 forbids reinterpreting the document
  under a version it did not declare, so this is a rejection, not a promotion.
- `process` / `decision` / `terminator` at top level →
  `"<kw>" is not allowed in genre statechart`, from the allowlist, with no
  per-keyword code (the same device `FLOWCHART-ROLE-KEYWORDS` pinned for the other direction).
- **0.2 (`GENRE-NODE-SPELLING`):** `node` or `edge` at top level → a **NAMED** line
  error, because the author has written a real construct under the wrong
  spelling and `unrecognized line` would send them hunting a construct they
  already have:

  ```
  "edge" is not the word genre statechart uses for this — write "transition":
  the connecting line in a statechart is a TRANSITION — the term UML 2.5.1 §14
  uses for it. Each scene genre takes the term its own domain uses
  (block/topology `node` `edge`, flowchart `node` `flowline`, statechart
  `state` `transition`) — run tools/migrate-figdown.js to rewrite it
  (MIGRATIONS 0.2)
  ```

- **0.3 (`SCENE-KEYWORD-MEMBERSHIP`):** `group`, `external`, `threshold`, `band` or `bundle`
  at top level → a **NAMED** line error carrying that cell's own ground, not
  `unrecognized line` and not the bare allowlist message. All five were legal
  here until this release, so an author who wrote one has written a real
  construct under a genre that has stopped declaring it, and the message says
  why rather than implying a typo. `external`'s is the sharpest, because the
  ground is inside this genre's own source standard:

  ```
  "external" is not allowed in genre statechart — it was WITHDRAWN from this
  genre, not misspelled: `statechart` declares NO subject vocabulary at all,
  and `external` is additionally RESERVED here: UML 2.5.1 §14 defines
  TransitionKind as `external | internal | local`, so in this genre's own
  source standard "external" already names A TRANSITION THAT EXITS AND
  RE-ENTERS ITS SOURCE STATE. FigDown's `external` means an endpoint outside
  the figure that is never drawn — same word, same genre, same standard,
  unrelated meanings. … (withdrawn, `SCENE-KEYWORD-MEMBERSHIP`; MIGRATIONS
  0.3)
  ```

  `plane` is not in that family: it fires the LANGUAGE-level withdrawal ahead
  of the allowlist, in every genre at once (`PAINT-ORDER-CONSTRUCT`).

## Reclassifying a figure costs more than it used to, deliberately

A flowchart reclassified as a statechart changed **line 1 only**
— that is how the five corpus figures migrated. With per-genre connectors it
now rewrites **every connector line** (and every node line) as well.

**That cost was accepted, not overlooked.** The maintainer judged that the
one-line convenience was bought with an imprecision he is not willing to keep:
the two genres were spelling two different things with one word.
`tools/migrate-figdown.js` carries the mechanical rewrite rule, scoped by the
document's declared genre, so the cost is paid by the tool rather than by the
author. Withdrawal of the genre is still cheap in the sense that matters —
nothing else in the language has to change — but it is no longer a
one-line edit per figure, and §Status should be read with that in mind.

## No start keyword — considered and rejected (`START-STATE-KEYWORD`)

**There is no `start`, `initial` or `entry` keyword, and the reason is not
that nobody asked.** It is also **not** that the domain has no word to lend.
It has two: UML 2.5.1 §14.2.3.7 defines an `initial` Pseudostate and
§14.2.3.6 a FinalState — **separate words for the two ends**, which is
exactly what a borrower would want. This genre's vocabulary comes from UML,
so those are the words on the table, and the rejection has to survive their
existence rather than lean on their absence.

It does. A reader who lacks the word answers **"unstated"**, which is *safe*
rather than *wrong* — a materially different failure from the 22%-misreading
rate that earned `process`/`decision`/`terminator` their place in
`flowchart`. Under RULE 4.1 an available word is necessary but not
sufficient: the earning bar is a **measured** misreading rate, and no
statechart figure in the corpus has produced one. So `initial` and `final`
are **unadopted, not unavailable** — held in reserve by their own standard,
where a later measurement can still claim them.

*(Correction, 0.3.z: this section previously argued that ISO 5807 §9.4.2's
Terminator is "one symbol for both ends" and concluded there was "no word to
borrow from the source standard". That is `flowchart`'s standard, not this
genre's — the text said as much and then drew the conclusion anyway. The
premise was false here; the rejection was not, and stands on the earning bar
alone. Same defect class as `VOCABULARY-SOURCE-ATTRIBUTION`.)*

*(Second correction, 0.3.z: **the first correction miscited its own
replacement clause.** It gave FinalState as UML 2.5.1 §14.2.3.2, and
§14.2.3.2 is **Regions** — the number this very document cites correctly two
hundred lines above, in §*`in=` is reserved for composite states*. FinalState
is **§14.2.3.6**: *"FinalState is a special kind of State signifying that the
enclosing Region has completed."* The `initial` half was right: §14.2.3.7 is
*Pseudostate and PseudostateKind*. Both words exist and the argument is
unchanged; the pointer was wrong. Recorded rather than quietly renumbered
because of what it shows — **the correction of a false standards claim
introduced a new one in the same sentence**, which is the case for a
mechanism rather than more care. See `decisions/registry.md`.)*

**What would reopen it:** measured evidence that readers name the **wrong**
state as the start. That is the bar; an argument that the word would be
convenient is not.

## Example

```figdown
figdown 0.2 statechart
title "Turnstile statechart (classic FSM)"
class mode "A mode of the turnstile mechanism" fill=#e0e7ff
state locked "LOCKED" class=mode
state unlocked "UNLOCKED" class=mode
transition locked -[coin]-> unlocked
transition unlocked -[push]-> locked
transition locked -[push]-> locked
transition unlocked -[coin]-> unlocked
flow right
rank locked,unlocked
```

Every line above is `block` syntax with two words changed; what the genre adds
is the reading, not the shape.

Corpus figures: `examples/statechart/turnstile.fd`,
`examples/statechart/dhcp-client.fd`, `examples/showcase/tcp-state-machine.fd`,
`examples/patterns/state-a.fd`, `examples/patterns/state-b.fd`.
