# FigDown Genre: `sequence`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any sequence figure.
>
> **Genre status: EXPERIMENTAL (`SEQUENCE-GENRE-VOCABULARY`).**
> `sequence` is outside the conformance surface and outside the compatibility
> promise. It may change or be **withdrawn** in a later `0.x` with no
> migration — `path` and `routing` are the precedent — but the withdrawal
> price here is **not** `statechart`'s. That genre added no syntax, so
> withdrawal cost one line per figure; this one adds five keywords, an enum,
> a reading rule and a whole layout the engine did not have. See §Status.
>
> **It requires `figdown 0.4`.** `figdown 0.3 sequence` is a line error
> carrying a named diagnostic; see core doc §13.
>
> **Three constructs are REFUSED here, and a refusal is not a withdrawal.**
> `gap` (`SEQUENCE-TIME-GAP`), `group` (`SEQUENCE-PARTICIPANT-GROUPING`) and the option key `lost=` (`UNDELIVERED-MESSAGE-MARKING`) were each
> proposed for this genre and each ruled out; this genre has never declared
> any of the three, so nothing was taken away from any document. Each is a
> **named** line error carrying its ground and the spelling that works
> instead. See §*Three refusals*.

**Census**: 1 in-repo reference figure
([`examples/reference/experimental/sequence.fd`](../../../examples/reference/experimental/sequence.fd));
**14 of 2,177 classified production images — 0.6%** — from 8 distinct source
documents, against `flowchart` 219 (10.1%), `topology` 95 (4.4%) and the
`state` bucket 25 (1.1%). In-repo, 2 of 59 non-fixture `.fd` files are
ladders drawn in another genre (`examples/showcase/tcp-handshake.fd`,
`examples/showcase/arp-resolution.fd`), both `topology` + a companion
`table`, both carrying an honest-limit comment. Prior art: **OMG UML 2.5.1
clause 17 (Interactions)** as the source standard and the source of every
word this genre owns; ITU-T Z.120 *Message Sequence Chart* as the runner-up,
read and cited but never borrowed from; protocol RFC ladder figures (RFC 2131
Figure 3, RFC 9293, RFC 8446 §2) as the corpus that motivated it.

**Why OMG UML 2.5.1 and why the ISO number sits beside it, not instead of
it.** RULE 4.1 prefers ISO and IEEE standards *where one covers the domain*.
One does: **UML's Interactions clause is itself an ISO standard**, published
as ISO/IEC 19505-2:2012(E), whose **clause 14 is Interactions**. Every word
borrowed below is an ISO-published word, and the two editions are the same
text — the ISO Foreword says so in terms: *"Apart from this Foreword, the
text of this International Standard is identical with that for the OMG
specification for UML, v2.4.1, Part 2."* So the citation rule for this genre
is fixed: **cite UML 2.5.1 as the working text**, because it is newer and
complete, and **record ISO/IEC 19505-2 clause 14 beside it** as the ISO
publication of the same vocabulary. That is the shipped `transition` row's
pattern (`GENRE-NODE-SPELLING`). Both editions are obtainable free of charge; the ISO
storefront copy is priced and the normative text is not.

**Z.120 lost on standing, and only on standing** — and the price is paid
four times. It is a dedicated 105-page standard for this one figure, it is a
line-oriented textual language with about eighty real lowercase keywords
where UML has none, and it spells the two constructs UML spells worst
(`condition` for the state assertion, `lost` for the undelivered message).
UML wins because ISO published it. The cost of that win is visible at
`state`, `fragment`, `operand` and `type=`, each of which is recorded below
as a **partial borrow** or a FigDown-owned key rather than a clean whole
borrow. *(What would reopen it: a maintainer ruling that RULE 4.1's ISO
preference does not reach a specification adopted through the PAS route. It
does **not** reopen on any new fact about either document; all three were
read end to end for the source review.)*

## Purpose

Expresses an **interaction**: a set of participants and the **messages** they
exchange, **in time order**. A `lifeline` is a participant column; time runs
down the page; a `message` is one occurrence with a place in that order; a
`state` is the condition a participant is in from that point on; a
`fragment` frames a run of occurrences and says what kind of run it is.
Typical figures: protocol handshakes, lease and renewal cycles, licence and
authorisation flows.

Distinguished from every scene genre by what the figure is **of**. A scene
genre draws a graph — parts and the relations between them — and has no
axis. Here **both axes carry meaning and neither is the author's to set**:
columns are `lifeline` declaration order and rows are `message` ∪ `state`
declaration order. That is why `flow` and `rank` are not this genre's words
(§Complete vocabulary) and why there is no key anywhere in it that moves a
coordinate.

**When to reach for it, and when not** (the maintainer's genre-choice
heuristic): when many lines run between the SAME pair of blocks, a scene
genre crowds them into one span and they read as confused overlap. If those
lines are a **time-ordered exchange between two participants**, the figure is
a sequence and belongs here — the ladder gives each message its own row, so
no two share a span. If they are distinct **transitions between states**,
they belong in `statechart` and the crowding is a layout problem, not a genre
problem.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| column order | `lifeline` declaration order, left to right | `DECLARATION-ORDER-SEMANTICS`, and there is no key that changes it |
| row order | `message` and `state` declaration order, taken jointly | `DECLARATION-ORDER-SEMANTICS` again; the model stores no ordinal, only each element's source line |
| `flow` | **not a keyword here** | both axes are already ordered by the source; a key that reordered either would make the drawing disagree with the text |
| `rank` | **not a keyword here** | same reason |
| `type=` on `fragment` | **none — the key is MANDATORY** | UML defaults the attribute to `seq`; FigDown declines the default (§*The enum*) |
| activation bars | **never drawn** | this genre has no keyword for one, so the renderer may not infer one (§*No activation bars*) |

## Complete vocabulary (normative)

**This is the whole of what a `sequence` document may write at top level.**

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three —
`figdown` `title` `layout` — identical under every genre and never redefined
(`UNIVERSAL-CORE-KEYWORDS`); **L** = the layout namespace (`LAYOUT-ZONE-NAMESPACE`), genre-independent, no genre may
define or redefine a keyword inside it; `pin` is its only member; **H** = the
scene **host set**, of which this genre admits exactly one member — `class`
is a styling declaration and not subject vocabulary, so no genre's domain
holds a competing meaning for it (`SUBJECT-VOCABULARY-SCOPE`); **S** = **`sequence`'s OWN
vocabulary** (`GENRE-VOCABULARY-OBLIGATION`), legal under this genre and no other.

Every row below is EXPERIMENTAL *as written in a `sequence` document*,
because the genre is; the Status column records each construct's own status.

| Keyword | Form | NS | Status | Option keys | `sequence` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.4 sequence` | C | NORMATIVE | — | required, first significant line; **`figdown 0.3 sequence` is a line error** (`SEQUENCE-SOURCE-STANDARD`) |
| `title` | `title "<text>"` | C | NORMATIVE | `note` | absent |
| `lifeline` | `lifeline <id> ["label"]` | **S** | **EXPERIMENTAL** | `class` `fill` `stroke` `style` `in` `note` `description` | label absent (the id draws); declares an id and joins the document-wide id namespace. UML 2.5.1 §17.3.3.1 semantics, §17.3.4.1 notation; ISO/IEC 19505-2 §14.3.17 |
| `message` | `message <a> [tail] <op> [head] <b> ["label"]` | **S** | **EXPERIMENTAL** | `class` `stroke` `style` `in` `note` `description` | `<op>` is `->`, `<-` or `<->`; **`--` is a line error here** and legal in every other genre; declares no id. UML 2.5.1 §17.4.4.1; ISO §14.3.18 |
| `state` | `state <lifeline-id> "<state name>"` | **S** | **EXPERIMENTAL** | `class` `fill` `stroke` `style` `in` `note` `description` | slot 1 **references** a lifeline and declares nothing; slot 2 is MANDATORY. UML 2.5.1 §17.2.4.5 notation prose, metaclass `StateInvariant` §17.12.25; ISO §14.3.25 |
| `fragment` | `fragment <id> ["label"] type=<operator>` | **S** | **EXPERIMENTAL** | `type` (MANDATORY) `class` `stroke` `style` `in` `note` `description` | no `fill=` — a fragment is a FRAME over the messages it holds, and painting its interior would hide them. UML 2.5.1 §17.6, `CombinedFragment` §17.12.3; ISO §14.3.3 |
| `operand` | `operand <id> ["guard"] in=<fragment-id>` | **S** | **EXPERIMENTAL** | `in` (MANDATORY) `class` `stroke` `style` `note` `description` | the quoted string is the GUARD; no `fill=`, for the same reason as `fragment`. UML 2.5.1 §17.12.14, notation §17.6.4.1; ISO §14.3.14 |
| `class` | `class <id> "<meaning>"` | H | NORMATIVE | `fill` `stroke` `style` | the meaning FIELD is REQUIRED, its VALUE may be `""` (`CLASS-EMPTY-MEANING`). **A `fill=`-only class joined by a `message`, a `fragment` or an `operand` is a line error** (`INTERIOR-LESS-ELEMENT-PAINT`, reaching this genre at 0.4 — `CLASS-CHANNEL-REACH`) — a line has no interior, so a `fill=`-only class reaches nothing on it; write `stroke=`. A class that declares NO paint at all is **legal** on every member (`CLASS-CHANNEL-REACH`) and draws its meaning in the legend with no swatch |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=…] [width=…] [height=…]` | L | NORMATIVE | the layout namespace's own, unchanged — `LAYOUT-ZONE-NAMESPACE` forbids a genre to define, redefine or extend them, so this genre states none | **accepted, parsed and IGNORED.** Both axes are declaration order, so there is no coordinate for a `pin` to set; not one mark of the drawing moves when a `pin` is added or removed (the artifact still differs, because it embeds the source), and the editor's drag gesture is disabled here for the same reason |

Option-key VALUES are the language's, not this genre's, and are unchanged
here: `style=` is `solid`/`dashed`/`dotted`, `fill=`/`stroke=` take a hex
triple, a six-digit value, one of the 147 CSS colour names or `transparent`,
`class=` takes one or more declared class ids in one comma-delimited token,
`note=` is drawn prose and `description=` is authored documentation that
never draws, and both are quoted (`QUOTING-RULES`).

**`fill=` on a `message` is a line error** — a line has no interior, so
`fill=` and `stroke=` would name one channel — and so is `fill=` on a
`fragment` or an `operand`.

**The check DOES reach this genre (`CLASS-CHANNEL-REACH`).** `INTERIOR-LESS-ELEMENT-PAINT` makes *a
class must not declare paint that cannot reach the member it joins* a line
error: `class p "Path" fill=#eee` on a `message` now answers *"class "p" sets
fill= but no stroke=, and a message has no interior — add stroke= to the
class"*, and the same on a `fragment` or an `operand` names those.

> **CORRECTION — this passage said the opposite, and the
> correction is recorded rather than swapped in.** Until this release the check
> was written over the `edges` collection alone, and **a `message` is not an
> edge** (`SEQUENCE-ORDER-MODEL`: it has its own collection, because it has a position in time
> and an edge has none), so the same mistake on a `message` was accepted,
> painted the default colour, and put the class in the derived legend. The
> check now runs over every collection that accepts `class=` — the ten of
> them — against the channel set each member's DRAWING reads, so the gap is
> closed at its cause and not per genre. **A class that claims a meaning and
> declares no paint is legal here**, on a `message` as on anything else:
> `CLASS-PAINT-REQUIREMENT`'s second half (which made that a line error on an `edge`) is RETIRED
> by `CLASS-CHANNEL-REACH`, on the ground that its own release had already fixed
> the harm it named. That is why the genre's reference figure keeps
> `class dropped "Sent, never delivered"` with no channel — under this genre
> `class` carries what `group` (`SEQUENCE-PARTICIPANT-GROUPING`) and `lost=` (`UNDELIVERED-MESSAGE-MARKING`) were refused in
> favour of, so a meaning with no paint is the designed idiom and not an
> oversight. [core §2.7](../../core.md), [MIGRATIONS](../../migrations.md)
> 0.4.

`shape=` is accepted by nothing here: a lifeline
head, a state pill and a fragment frame are the shapes the ladder draws, and
none of them is the author's to choose (`DOMAIN-CONVENTION-DIRECTIVES`, `SHAPE-ENUM-VOCABULARY`).

**The enum, and the one declared divergence.** `type=` takes one of
**twelve** BARE values, taken whole from UML's `InteractionOperatorKind`
(**UML 2.5.1 §17.12.15.3** *Literals*; ISO §14.3.15, whose own list is short
by `break`, which that edition defines at §14.3.3 instead):

`alt` `opt` `loop` `par` `strict` `seq` `critical` `neg` `assert` `ignore`
`consider` `break`

Every one is the standard's own single lowercase spelling, so the
abbreviations arrive under RULE 4.2's carve-out rather than as FigDown
coinages. **There is no default, and UML has one.** The attribute is
`interactionOperator : InteractionOperatorKind [1..1] = seq` (§17.12.3.5).
FigDown makes the key MANDATORY: a default would draw a frame that looks like
an assertion and is not one. That is a divergence, declared here rather than
discovered.

**Two spellings this genre does NOT have, and the absence is a consequence
rather than a ruling.** `flow` and `rank` are absent from the allowlist
because both of this genre's axes are already ordered by the source, so there
is nothing for either to set; they get the plain
`"flow" is not allowed in genre sequence` and not one of the three named
refusal diagnostics. The composition openers are absent for a different
reason: `GENRE-COMPOSITION` lets a scene genre host a `bitfield`, `table` or `timing` region,
and **this genre has no scene to host one in**, so `bitfield` at the top
level of a `sequence` document is a line error too. `external`, `threshold`,
`band` and `bundle` are absent because this genre never declared them — an
absence, never a withdrawal, and the diagnostic is the plain allowlist one.
`plane` is the one exception and it is not this genre's business either way:
`PAINT-ORDER-CONSTRUCT` withdrew it from the **language**, before this genre
existed, so it fires the language-level withdrawal diagnostic here as it does
everywhere.

### `state` here is NOT `statechart`'s `state`, and slot 1 is where they part

**Under `statechart`, `state locked "LOCKED"` DECLARES the id `locked`.
Under `sequence`, `state c "BOUND"` REFERENCES the lifeline `c` and declares
nothing.** That asymmetry is the first of its kind in the language and it is
stated here, in the sentence that introduces the keyword, because a reader
who carries the other genre's grammar across will get the first slot wrong.

The reason it declares nothing is not economy: **nothing in this genre refers
to a state occurrence**, so it needs no id of its own. The quoted state name
in slot 2 is **mandatory** — a state occurrence with no name asserts nothing
at all — and it is the whole content of the construct.

Two genres agreeing on a spelling is **two declarations that agree, never one
inherited** (`GENRE-VOCABULARY-OBLIGATION`, `SUBJECT-VOCABULARY-SCOPE`), and this pair does not even agree: same word,
different construct, different grammar, different source clause. UML 2.5.1
§17.2.4.5's notation prose is where this genre's word comes from — *"The
state symbol represents the equivalent of a constraint that checks the state
of the object represented by the Lifeline"* — so it is clause 17's own word
for the drawn thing and not a cross-reference into §14, which is where
`statechart` gets its own. The metaclass is `StateInvariant` (§17.12.25; ISO
§14.3.25). Record it the way the shipped `note` row is recorded: **the
picture is UML's metaclass, the spelling is its notation's** — a partial
borrow, declared.

**Two CONSECUTIVE `state` lines naming the same lifeline and the same name
are a line error.** A state that has not changed is never restated, and a
transition is derived from the adjacent pair, so a restatement would assert a
change that did not happen. It is also the reason a reader "tidying
duplicates" must not silently delete one.

### `fragment` is a PARTIAL borrow, and the debt is larger than a head-noun reduction

`fragment` is `CombinedFragment` with the qualifier dropped, and recording it
as *"a head-noun-only borrow"* would be right and insufficient. **In UML,
`fragment` alone already names something, and it is not this construct.**
§17.12.13 *InteractionFragment* is *"an abstract notion of the most general
interaction unit"*; `CombinedFragment` (§17.12.3) is **one subclass of it**,
and so is `StateInvariant` (§17.12.25.1: *"StateInvariant is an
InteractionFragment and it is placed on a Lifeline"*), and so are
OccurrenceSpecification and InteractionUse.

**So under this genre a `state` line IS a fragment in the source's sense
while not being a `fragment` in FigDown's**, and a later reader checking
RULE 4.1 against UML's metaclass list finds the word at the **wrong level of
the hierarchy**. That is a real narrowing and it is written down rather than
smoothed over — `VOCABULARY-SOURCE-ATTRIBUTION`'s rule: prefer a weaker verifiable claim to a stronger
false one. The vocabulary row in
[`../../vocabulary-sources.tsv`](../../vocabulary-sources.tsv) says the same
thing in the same words.

**The word is kept anyway, and the alternatives are named.** No better single
word exists in either candidate standard: UML's own is a compound, barred by
RULE 4.5b's no-compounding corollary; Z.120's is *inline expression*, two
words, barred by `GENRE-DOCUMENT-CONTRACT` §6(a); and neither Mermaid nor PlantUML has a keyword
for the container at all — they open the block with the operator itself,
which a flat line-oriented syntax cannot use. `fragment` is attested
**standalone** in the source's own clause title (§17.6 *Fragments*) and in its
prose, and it collides with nothing in any FigDown namespace.

**`operand` carries no such debt**, and it is worth saying because it was
nearly a coinage. The genre proposed `branch` and the ruling reversed it
(`FRAGMENT-OPERAND-SPELLING`): **both** candidate standards say *operand* — UML 2.5.1 §17.12.14
`InteractionOperand`, notation §17.6.4.1, ISO §14.3.14; Z.120 §7.2 writes
`<operand area>` throughout its grammar — so `branch` was a coinage against
both, which is the thing RULE 4.1's letter exists to stop. The objection on
record, that *operand* reads as algebra, is an **unmeasured readability
claim**, and `START-STATE-KEYWORD` refuses exactly those. *Reopens if* the comprehension suite
measures `operand` actually misleading a reader, at the bar `decision`
cleared — 22% over 216 nodes — not on the intuition.

### `in=` — five acceptors, ONE sense, and the RULE 4.3 weakening restated

`in=` means **the element this one lives inside**, and under this genre its
value is always a `fragment` or an `operand` id. It is accepted on
**`message`, `operand`, `lifeline`, `state` and `fragment`** — five
acceptors, and every one of them is **sense 1**.

**This is the restatement the language is owed.** `in=` already carries a
**declared weakening of RULE 4.3** (one key, one meaning): SYNTAX-STYLE §8.1
records its two senses — sense 1 *"the element this one lives inside"*, sense
2 *"the element this one is drawn across"* (`threshold`, `band`) — and keeps
the weakening on the record so that **a future third sense is refused**. This
genre adds acceptors and **no third sense**: a message inside a combined
fragment lives inside it in exactly the way a node lives inside a group. The
promise therefore stays **discharged at five acceptors as it was at three**,
and the growth was ruled rather than absorbed (`SEQUENCE-CONTAINMENT-SCOPE`). The genre's one
candidate for a third sense is routed elsewhere by name: an annotation is
*about* its target, not *inside* it, so when an annotation target key lands it
takes `on=`, as §8.1 requires. **This genre proposes `in=` on no
annotation-shaped construct.**

The ground for the two acceptors `SEQUENCE-CONTAINMENT-SCOPE` added is the source's own model, not
convenience: `StateInvariant` (§17.12.25) and `CombinedFragment` (§17.12.3)
are **both** `InteractionFragment` (§17.12.13), and an InteractionOperand
contains InteractionFragments — so `state … in=` and `fragment … in=` are
the containment UML already has.

Two rules come with the key, and both are about the MODEL:

- **`in=` on an `operand` names a FRAGMENT and nothing else.** A compartment
  belongs to a fragment, and a compartment has no compartments of its own
  (§17.12.3: a CombinedFragment owns its operands). A lifeline id there is
  the other specific mistake, and gets its own sentence: a fragment spans
  lifelines rather than belonging to one.
- **Members must be CONTIGUOUS in declaration order.** An operand denotes the
  **ordered run** of the occurrences it contains (§17.6), so an occurrence
  that is not in it cannot happen between two that are. Non-contiguous
  membership does not denote anything — it is not an undrawable figure, it is
  an unsatisfiable model, and the fact that the box is also undrawable is a
  consequence and not the reason (`DOMAIN-CONVENTION-DIRECTIVES` keeps drawing limits off the model's
  side of the line). A line that splits a run is a line error naming the run,
  reported once against the **deepest** container it splits, because that is
  the container whose `in=` repairs the document.

A containment **cycle** is a line error before either rule runs: `in=`
containment is a tree, and a cycle denotes nothing at all.

### Nesting is capped at ONE level, on the v0.1 `group` precedent

**A `fragment` may sit in an operand of one enclosing fragment and no
deeper.** Two levels is a line error naming both ancestors.

The cap is taken from **v0.1's `group`**, where *one level is the whole of
the language's containment*, and it is a **scope decision, not a principle** —
the diagnostic says so in those words. A second level lands on measured need,
the same evidence any other cell needs. What the cap costs today is nothing
measurable: one level is what the genre's showcase figure needs (an `opt`
inside an `alt`'s granted branch) and what the reference figure exercises.
Write a deeper interaction as a sibling fragment, or state it in
`description=`.

That a fragment nests **at all**, where a `group` may not, is the answer to a
question this genre had to put to the maintainer rather than assume: the
answer *no* would not have cost a drawing, it would have cost the construct,
and with it every `alt`-inside-`loop` figure the genre exists to draw.

### Three refusals — `gap`, `group` and `lost=`

**None of the three is a withdrawal.** This genre never declared any of them,
so no document changes and nothing is migrated; the refusals are recorded
here because a construct that was argued for and ruled out is a decision, and
a decision nobody can find is rediscovered. Each is a **named** line error
carrying its own ground and its replacement — not `unrecognized line`, and
not the bare allowlist message.

| Refused | Ruling | Ground | Write instead | Reopens if |
|---|---|---|---|---|
| `gap` | `SEQUENCE-TIME-GAP` | **The axis, not the spelling.** UML 2.5.1 §17.3.3.1 makes the vertical axis NON-PROPORTIONAL — *"The distance between two events on a time-line does not represent any literal measurement of time, only that non-zero time has passed"* — so non-zero time has ALREADY passed between every adjacent pair of events in every sequence figure, by the source's own semantics. A `gap` line would state a fact the reading rule gives everywhere, and what the author wants — *draw more vertical space here* — is a RENDERING request, which `PRESENTATION-AS-MEANING-CARRIER` keeps off the language's side of the line. `timing`'s `gap` is a different construct: there the horizontal axis IS a tick count, so a break in it removes ticks that would otherwise be asserted | the elapsed time in the following message's label, or in its `description=` | this genre ever lands a construct that makes vertical position denote a quantity — a duration constraint, an absolute timestamp — because a discontinuity then has something to interrupt |
| `group` | `SEQUENCE-PARTICIPANT-GROUPING` | **Three grounds.** ZERO measured need: the row was admitted as Mermaid `box` parity and the genre was then re-scoped to real-figure coverage without the row being re-tested. NOTHING TO BORROW: UML clause 17 has no lifeline-grouping construct — `PartDecomposition` (§17.7.3.2) decomposes ONE lifeline into a sub-interaction, and gates and the frame bound an interaction rather than a subset of its lifelines. And THE GEOMETRY IS ALREADY TAKEN: band = membership is locked into the scene genres (the band contains every member and nothing else, core §2.6), while a `group` here would span min..max COLUMNS with no contiguity rule, so a band over two non-adjacent lifelines silently encloses a third that is not a member — one word carrying two different geometric promises, which `GENRE-VOCABULARY-OBLIGATION` forbids opening without evidence | a `class` naming what the participants have in common, plus `class=` on each `lifeline`: it earns a legend entry and asserts membership without asserting adjacency | a count of real figures whose lifelines are drawn in labelled bands — and the re-proposal owes a contiguity check either way |
| `lost=` | `UNDELIVERED-MESSAGE-MARKING` | **The model it wanted is not UML's.** UML 2.5.1 §17.4.3.1's lost Message is one whose *"destination … is outside the scope of the description"* — the recipient is NOT MODELLED — while the proposed key meant the recipient is modelled, named and drawn AND DELIVERY FAILED, which is ITU-T Z.120 §4.3's model (*"a message is sent but not consumed"*) under UML's spelling. Carrying one standard's word with another standard's meaning is the cross-source mix RULE 4.1 calls a last resort, and it was undeclared | `class dropped "Sent, never delivered"` declared once, `class=dropped` on the message, and the per-message reason in `description=` | a measured rate of readers taking a dropped message for a delivered one, at 22% — **and any re-proposal must be grounded on Z.120 §4.3 rather than on UML §17.4.3.1**, which is a condition of reopening and not a footnote to it |

**Two of the three cost a real line in a real figure, and the rulings were
taken with that in view.** The genre's showcase draws RFC 2131's lease cycle:
it used `gap` twice, to mark T1 firing at 0.5× the lease and T2 at 0.875×,
and `lost=` once, on the renewal unicast that never reaches the issuing
server — which is the event that makes the T2 transition happen. All three
facts now travel in a label or in `description=`.

**Refusing a spelling is not denying the need.** `lost=` in particular stays
on the record as measured demand in two sub-domains, and the reopening
condition above names the standard a re-proposal must build on.

**`lost=` is not in the language's option registry at all**, which is what
refusing it means: no key was added anywhere. Its diagnostic therefore fires
on the unknown-option path rather than on the inapplicable-key path — a
refusal can be named without the spelling being registered, and no other
genre accepts it either.

### Reserved, not landed — the source's own escape from a partial order

**UML's escape hatch is `GeneralOrdering`, and this genre deliberately leaves
it unspelled.** §17.5.3.4 *General Orderings*: *"A GeneralOrdering restricts
the set of possible sequences. A partial order of OccurrenceSpecifications is
constrained by a set of GeneralOrderings"*; the metaclass is §17.12.10, ISO
§14.3.10.

It is named here so that a later landing is a **decision and not a
rediscovery**. Under the total order this genre declares (§Semantic model)
there is nothing left to order: every pair is already ordered by declaration.
The only place a general ordering could do work is **across a `par`
boundary** — an author who used `type=par` to unorder two messages and then
wants to re-order one pair inside it. **No figure in either measured
population has needed that**, and the one concurrency case on record is
closed by `par` alone. That is what would earn it.

### The message label has TWO spellings and ONE model key — a FINDING, not a ruling

**What ships.** A `message` may carry its text either as the **trailing
quoted string** — `message c -> s "DHCPDISCOVER"` — or in the **inline
bracket position** the shared connector scanner gives every connector,
`message c -[DHCPDISCOVER]-> s`. Both reach **one** label field in the model.
Writing both on one line is a **line error**: *"message has two labels — the
inline `-[…]->` mid-label and the trailing `"…"`. Write one"*. The model can
therefore never hold two, and the same text is never projected under two
keys.

**The trailing form is the one to write**, and it is the one the ruled
surface settles: every sequence source in the corpus puts the message text
there, and the bracket position reads as an annotation *on* the line rather
than as the message itself. `[tail]` and `[head]` are unaffected — they are
different positions, not a second spelling of the same one.

**The concern, filed rather than settled.** That two spellings reach one
model field at all is an **alias**, and the language's no-alias rule is
[`../../core.md`](../../core.md) §9 **`IDENTITY-ASSERTION`**'s shape: one thing, one
spelling, per version. This is not the identity-assertion face of `IDENTITY-ASSERTION`
(that is *"these two elements are the same entity"*), it is the same rule
seen from the syntax side, and it is recorded here because the design record
settles the trailing form and says **nothing** about the brackets. So the
document states what ships and does not invent a ruling: **both spellings
parse, writing both is an error, and whether the bracket spelling should be
refused outright under this genre is open.** It is cheap either way while the
genre is EXPERIMENTAL. *What would settle it:* the same evidence any
alias question needs — a corpus count of which spelling authors reach for,
or a reader shown both and asked whether they mean different things.

### No activation bars, and the renderer may not infer one

**UML draws a bar for the period a participant is executing.** That is
`ExecutionSpecification`, a **separate referent with a separate spelling**,
and this genre has no keyword for it — so the renderer must not manufacture
one out of which messages happen to be adjacent. Doing so would put an
assertion in the picture that the source does not make, which is `PRESENTATION-AS-MEANING-CARRIER` from the
engine's side.

The evidence is unusually clean, and it is why nothing is owed here: **0 of
27 RFC ladder figures and 0 of 14 corpus ladders draw an activation bar at
all.** The construct that would have derived them — a request/reply
distinction on the message — was itself refused for the same measured zero,
and the bars fell with it. This is a limit stated, not a gap apologised for.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

This section is what the genre is **for**. A reading agent that sees genre
`sequence` MAY conclude:

1. **Every `lifeline` is a participant in the interaction**, and the set of
   participants is **closed as drawn**: a participant not declared is not
   asserted to exist. Column position is `lifeline` declaration order and
   carries no other meaning — it is not seniority, not layering, not a
   network path.
2. **Every `message` is a message** — one occurrence with a sending event
   and a receiving event — and the operator's direction is the direction it
   travels. Its **position in the source is its position in time**.
3. **`<->` is ONE message, not two.** Core defines `<->` as bidirectional;
   under this genre it additionally means *a sustained exchange in both
   directions whose individual messages are not enumerated*. That is a genre
   reinterpretation under `GENRE-VOCABULARY-OBLIGATION`, of the same shape as `statechart`'s narrowing
   of `--`, and it is stated here because it is the reader's to carry. The
   drawing follows the model: **one shaft with two heads**, because a model
   that says one occurrence must not invite a count of two. *(The price,
   named: a reader carries per-genre operator readings. `GENRE-NAMESPACE` bounds that cost
   at core plus the one genre in the header. What would make it the wrong
   call is a second genre needing a different added meaning for `<->`, at
   which point this genre owes a distinct spelling.)*
4. **`--` asserts nothing here — it is a line error.** A Message has a
   sending event occurrence AND a receiving event occurrence (§17.4.3.1
   defines the *lost* case as the one where the receiving occurrence is
   absent), so a message with unstated direction is not a thing this domain
   has. The same operator stays legal in every other genre; the operator set
   is per genre for the same reason the keywords are.
5. **Every `state` line is the condition its lifeline is in from that point
   on**, as free text. It is quotable and attributable and **never
   parsable** — no structure is promised inside the name, and a reader may
   not bind it to a `statechart` state, in this document or any other.
6. **A `fragment` says what KIND of run its members are**, and `type=` is
   that claim. `alt` is a choice among its operands, `loop` a repetition,
   `par` a concurrency claim, and so on for the twelve. An `operand` is one
   compartment and its quoted string is the **guard**.
7. **Order is TOTAL** — see the divergence declaration below.

A reading agent MUST NOT conclude:

8. **No elapsed time, ever.** Vertical distance means only that non-zero time
   passed. There is no duration, no timestamp and no rate in this genre, and
   the absence of a `gap` construct is deliberate (§Three refusals).
9. **No concurrency unless a `par` fragment says so.** Two adjacent messages
   are **ordered**, not simultaneous. This is the direct consequence of the
   total order and it is the one place the total order costs the author a
   construct.
10. **No failure, no retransmission, no loss.** There is no keyword for any of
    them. Where a figure means one, it says so with a `class` whose meaning
    is prose, and a reader must attribute the claim to that prose rather than
    to the model.
11. **No activation, no execution period, no "busy".** Nothing is drawn for
    it and nothing may be inferred from message adjacency.
12. **No identity between two messages, however identical their labels**, and
    none between a `state` name here and a `state` id in a `statechart`
    document. FigDown has no identity or alias relation; `class` asserts a
    shared CATEGORY, never a shared IDENTITY (core §9 `IDENTITY-ASSERTION`).
13. **Nothing from the layout zone** (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`) — and here the rule is
    total rather than conventional: a `pin` in a `sequence` document changes
    no coordinate, because there is no coordinate for it to change.

### Order under `sequence` is TOTAL, and the divergence is DECLARED

> **Order under `sequence` is total, and this is stronger than the source
> standard.** The declaration order of `message` and `state` lines, taken
> jointly, is the time order of **every** occurrence in the figure, not only
> of those on one lifeline. OMG UML 2.5.1 §17.1.3 and ITU-T Z.120 §4.1 both
> assume a total time ordering **along each instance axis only**, order
> events on different lifelines via messages — a message must be sent before
> it is consumed — or via an explicit general-ordering mechanism, and
> prescribe nothing else: *"An interaction specification, therefore, imposes
> a partial ordering on the set of events being contained"* (UML §17.1.3; the
> same sentence in Z.120 §4.1 reads *"A Message Sequence Chart therefore
> imposes a partial ordering on the set of events being contained"*).
> FigDown diverges deliberately, because a source that admits several equally
> legal drawings is a source this language will not accept: the drawing would
> assert an order the model does not carry. A figure that means to leave two
> messages unordered says so with `fragment … type=par`, which is therefore
> part of the order model and not a convenience.

**The UML citation above is to 2.5.1 only, and that is deliberate.** The ISO
edition has **no counterpart to §17.1.3** — that narrative subclause is new
in UML 2.5, and the fetched ISO text returns zero occurrences for each of the
sentences that make it up — so an ISO number beside `§17.1.3` would be a
citation of nothing. The ISO edition states the same model in **two clauses
instead of one paragraph**: the per-lifeline half at §14.3.17 (Lifeline,
Semantics) and the cross-lifeline half at §14.3.10 (GeneralOrdering). The
Z.120 half of the sentence is cited even though this genre takes no word from
Z.120: **citing a standard for what it says about the domain is not borrowing
its vocabulary.**

**The ground for diverging is the REPRODUCIBLE promise.** Under a partial
order one source document admits **several legal figures** — two messages on
disjoint lifeline pairs may be drawn in either vertical order and both
drawings are equally faithful. FigDown does not produce figures that way.
Whichever one a deterministic engine picked would carry a fact the model does
not carry — *this message is above that one, therefore earlier* — which is
precisely what **`PRESENTATION-AS-MEANING-CARRIER`** forbids a renderer to do. A partial-order genre would
build that violation into the language rather than into an engine bug. (The
second reason is smaller and must not be mistaken for the first: a total
order is easier to read and easier to author, and for a two-lifeline ladder —
most of the measured corpus — the two readings coincide anyway.)

**What the ruling costs, named:** `fragment … type=par` becomes
**load-bearing rather than optional**. It is the only escape from the total
order, so a figure that means to leave two messages unordered has exactly one
way to say so.

## Why the header is the only dispatch point

The obvious alternative to a declared genre is to **detect** an interaction
from its structure. It does not work here, and the failure is measurable in
this project's own corpus.

- **Two participants with several lines between them do not separate them.**
  That drawing is a sequence in `tcp-handshake.fd` and a plain relation in
  half the `topology` figures beside it. The discriminator is whether the
  lines are **time-ordered messages between one pair** or **distinct
  relations**, and nothing in the drawing says which.
- **The workaround the corpus actually used is what proves the point.** Both
  in-repo ladders are `topology` + a companion `table` with the order parked
  in `1:`/`2:`/`3:` label ordinals — which `MEANING-RECOVERY-SOURCE` treats as **naming, not
  semantics**. Asked how many links join the client and the server, a reading
  agent answers **3** where the truth is one association carrying three
  segments in time: a confidently wrong number with nothing attached to warn
  the reader.
- **The tie case is in the same file.** `arp-resolution.fd` has two edges
  both prefixed `1:`, and the ordinal convention cannot say they are
  simultaneous. The genre says it with `type=par`.
- **A title does not separate them either.** `MEANING-RECOVERY-SOURCE` already forbids reading
  meaning out of a title, and this genre creates no exception.

So the header is the only implementable dispatch point — and unlike
`statechart`, this genre does not stop there: the header buys a reading rule
**and** a layout, because a header token alone would produce a graph drawing
of a time figure, which is a worse figure than the one it replaced.

## Status: earned on WHETHER, last on WHEN, and the withdrawal price is real

**WHETHER: earned, and on a stronger argument than `statechart` had.** `NEW-CONSTRUCT-EVIDENCE-GATE`
separates the two tests — semantic impossibility decides WHETHER, corpus
frequency decides WHEN. No composition of existing constructs expresses
relative order between two edges, and none expresses *this participant was in
state S at this point in the exchange*. `statechart`'s case was an
**interpretive** loss (one drawing, two readings); this is an **expressive**
one (the content has nowhere to go), and the workaround degrades not to
*unknown* but to *wrong*, which is the `BITFIELD-REPETITION-CONSTRUCT` condition.

**WHEN: last.** 0.6% is the lowest measured demand of any genre candidate
this project has weighed, and `GENRE-EARNING-THRESHOLD` lowers no frequency threshold. The
comparison with `statechart`'s *"3 of 91 production documents"* is **not**
made here — that is a different corpus slice. On the one slice where both
were measured the same way, the census reads `state` 25 (1.1%) and `sequence`
14 (0.6%): roughly half the frequency of the genre this project itself
recorded as *"the first genre landed ahead of its corpus evidence"*.

**And the cost difference that is a risk objection rather than a workload
one, so it stands.** `statechart` landed at the price of a header token: no
syntax, five figures re-rendered byte-identically, withdrawal one line per
figure. This genre needs five keywords, a twelve-member enum, a reading rule
that lifts a §12.7 prohibition, and **a layout the engine did not have**.
**Withdrawal would not be one line per figure**, so EXPERIMENTAL status does
not price this bet the way it priced the last one. Nothing in this document
should be read as a commitment to keep the genre.

**What would reopen it, in either direction:** re-classifying the census
`other` bucket and the `state` bucket for ladders filed elsewhere — at 0.6%
misclassification could move this materially either way; or measuring the
misreading rate directly, at the bar `decision` cleared (22% over 216 nodes),
by expressing corpus ladders as `topology` + ordinals and asking readers how
many links join the two participants. **What would kill it:** that
re-measure showing the 14 are mostly misclassified, or a demonstration that
readers of `tcp-handshake.fd` recover the order and the states correctly
today. Those two triggers live HERE now: core §9 **`MESSAGE-ORDER-AND-STATE`** closed when the genre landed, and a status is tracked by the status
line that would change, not by a closed question — if either re-measure
fires, it argues for withdrawing or demoting this genre, and this section
is where that argument is owed.

## Errors

`sequence` adds its own error conditions, and the reason is that it adds its
own constructs. The profile is the core profile plus:

- `figdown 0.3 sequence` → `genre "sequence" requires figdown 0.4 (this
  document declares 0.3) — write: figdown 0.4 sequence`. Core §13.7 forbids
  reinterpreting a document under a version it did not declare, so this is a
  rejection and not a promotion.
- `node` or `edge` at top level → a **NAMED** line error naming the word to
  write instead, the fourth application of `GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING`:

  ```
  "node" is not the word genre sequence uses for this — write "lifeline": a
  sequence figure has exactly ONE kind of participant column and it is a
  LIFELINE — the term UML 2.5.1 §17.3.3.1 defines and §17.3.4.1 draws. Each
  genre takes the term its own domain uses (block/topology `node` `edge`,
  flowchart `node` `flowline`, statechart `state` `transition`, sequence
  `lifeline` `message`) …
  ```

  There is no version gate on either spelling, unlike `flowline`: the GENRE
  requires `figdown 0.4`, so neither word is reachable from an earlier
  document and there is no earlier spelling for it to have replaced.
- `flow`, `rank`, `bitfield`, `table`, `timing`, `chart`, `external`,
  `threshold`, `band`, `bundle` at top level → the plain allowlist message,
  `"<kw>" is not allowed in genre sequence`, with no per-keyword code. None
  of them was ever declared here.
- `gap`, `group` or `lost=` → the **named refusal** diagnostics of
  §*Three refusals*, each carrying its ground, its replacement and its
  reopening condition. `gap` in particular is consulted **before** the
  typed-block-child exemption, or an author who wrote it would be told *"gap
  is a typed-block child"* — true of the language, and silent about the
  ruling they have run into.
- `message a -- b` → `message needs a direction: -> <- <->`, with the ground
  and the pointer to `<->`.
- `fragment` with no `type=` → the missing-key message, which says why there
  is no default; `type=` with a value outside the twelve → the unknown-
  operator message, which lists them; `type="alt"` → the RULE 2.4 bare-value
  message, because quoting a value drawn from a closed set suggests the
  position accepts arbitrary text.
- `operand` with no `in=`, a container with **no members**, an `in=` naming a
  lifeline, a **split run**, a **cycle**, a fragment nested **two levels
  deep**, a `state` with no quoted name, two consecutive identical `state`
  lines, and a message endpoint that is not a declared lifeline — each has
  its own sentence, and each states the model fact it rests on.

## Example

```figdown
figdown 0.4 sequence
title "Address lease and renewal"
class dropped "Sent, never delivered" stroke=#b91c1c style=dashed
lifeline c "DHCP client"
lifeline s "DHCP server"
message c -> s "DHCPDISCOVER"
message c <- s "DHCPOFFER"
message c -> s "DHCPREQUEST"
message c <- s "DHCPACK"
state c "BOUND"
fragment renew "renewal cycle" type=loop
operand t1 "at T1 — 0.5x the lease" in=renew
message c -> s "DHCPREQUEST (unicast)" in=t1 class=dropped description="the issuing server does not answer, which is what makes the next timer fire"
state c "RENEWING" in=t1
fragment fallback "if the renewal is not answered" type=alt in=t1
operand t2 "at T2 — 0.875x the lease" in=fallback
message c <-> s "DHCPREQUEST (broadcast, rebinding)" in=t2
```

Every line above is this genre's own vocabulary except `title` and `class`,
and every coordinate in the drawing is the engine's. What the author states
is who talks to whom, in what order, inside which fragment, and what
condition each participant is in — and that is the whole of the model.

Reference figure: `examples/reference/experimental/sequence.fd`.
