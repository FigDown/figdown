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

**Census**: 5 in-repo figures; **3 of 91 production documents**. Prior art:
Harel *statecharts* (the diagram-type name); **OMG UML 2.5.1 §14
(StateMachines)** as the semantic source family *and* as the source of this
genre's two keywords; protocol RFC state diagrams (TCP RFC 9293 Figure 5,
DHCP RFC 2131 §4.4) as the corpus that motivated it.

**Why OMG UML 2.5.1 and not ISO/IEC 19505**, cited the ISO
number and that was the wrong edition to name: ISO/IEC 19505 is **paywalled**
and is the older **2.4.1** text. OMG publishes 2.5.1 for free, so the clause
that defines `State` and `Transition` was actually **read** before either word
was taken. A vocabulary row that cannot be checked by a reader of this
repository is a claim, not a citation.

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

**`statechart`'s allowlist is the scene host set with its OWN two words in
the slots `node` and `edge` occupy elsewhere** (`GENRE-NODE-SPELLING`). Every row
of [topology.md](topology.md)'s vocabulary table, its option-key value table,
its connector operators and its retired spellings **apply here unchanged**,
with three substitutions and one difference:

| topology writes | statechart writes | source |
|---|---|---|
| `figdown 0.1 topology` | `figdown 0.2 statechart` | — |
| `node <id> ["label"]` | **`state <id> ["label"]`** | OMG UML 2.5.1 §14 |
| `edge <a> [tail] <op> [head] <b>` | **`transition <a> [tail] <op> [head] <b>`** | OMG UML 2.5.1 §14 |

- `flow` defaults to `right` under both.

That cross-reference is the complete vocabulary statement `GENRE-DOCUMENT-CONTRACT` asks for, and
it is a reference rather than a copy on purpose: two copies of a twenty-row
table drift, and this project has paid for that seven times.

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
9. **No hierarchy, regions or history.** `group` groups; it does not make a
   superstate, an orthogonal region or a history pseudostate. All three are
   out of scope at `figdown 0.2`.
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
migration and no rewrite of anything but line 1, because the genre adds no
syntax — `path` and `routing` already demonstrated withdrawal at that cost.

**What would reopen it:** a production re-measure. If those three documents
turn out to be an artefact of how the corpus was sampled or classified, the
honest move is **withdrawal**, not defence. Nothing in this document should
be read as a commitment to keep the genre.

## Errors

`statechart` adds no error conditions of its own. Its validation profile is
the core profile, plus three that follow from the version and the allowlist:

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
that nobody asked.** The premise usually offered for one — "`terminator` is
already the end symbol, so the start needs its own word" — is **false**. ISO
5807 §9.4.2's Terminator is *an exit to, or an entry from, the outside of the
procedure — a start, an end, or a halt*: **one symbol for both ends**,
distinguished by its label text, which is `flowchart`'s business anyway.

So there is **no word to borrow** from the source standard, and RULE 4.1
forbids coining one when the domain has not. A reader who lacks the word
answers **"unstated"**, which is *safe* rather than *wrong* — a materially
different failure from the 22%-misreading rate that earned
`process`/`decision`/`terminator` their place.

**What would reopen it:** measured evidence that readers name the **wrong**
terminator as the start. That is the bar; an argument that the word would be
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
