# Genre `statechart` — EXPERIMENTAL / EXPERIMENTAL

The genre itself is outside the conformance surface: it may change or be
**withdrawn** in a later `0.x` without a migration. A portable figure uses
`block` instead — that is what these figures were spelled as before `figdown
0.2`, and the rewrite back is one line.

**It needs `figdown 0.2` on line 1.** `figdown 0.1 statechart` is a line
error, and a deliberately named one: `genre "statechart" requires figdown 0.2`.
An engine may not read a `0.1` document as though it were `0.2`.

Load `../scene.md` first — `statechart` reuses the scene vocabulary
(`group`, `external`, `class`, `flow`, `rank`) with the same meanings, and
**renames the other two**: a node is a **`state`** and a connector is a
**`transition`**, both taken from OMG UML 2.5.1 §14. Nothing else changes —
same option keys, same id space, same operators, same model — and `node` or
`edge` here is a **line error** naming the word to write instead.

`flow right` is the default, as in `block`; `flowchart`'s `down` default does
**not** apply here.

**Why this genre loses `node` and `flowchart` keeps it:** a statechart has
exactly one kind of node, so there is nothing to leave unstated and `state`
gives up nothing. A flowchart stage can have a role **the source does not
state**, and there `node` is the only way to say so without asserting a role
the source never gave.

```figdown
figdown 0.2 statechart
title "Turnstile"
class mode "A mode of the mechanism" fill=#e0e7ff
state locked "LOCKED" class=mode
state unlocked "UNLOCKED" class=mode
transition locked -[coin]-> unlocked
transition unlocked -[push]-> locked
transition locked -[push]-> locked      # self-transition: the event happens
                                        # and the machine stays
flow right
```

## What the genre adds, which is a reading and not a syntax

Everything above parses identically under `block`. The genre earns its
existence in what you are entitled to conclude from it.

**Under `statechart`, and not under `flowchart` or `block`:**

- **Every top-level `state` is a state** — a *mode the machine is in*, not a
  step it performs. It has duration; the machine sits in it until something
  happens.
- **Every `transition` is a transition**, and its direction is the direction of the
  change. An undirected `--` between two states asserts a relationship the
  genre has no reading for; do not read it as a transition in both directions.
- **A mid label is a transition inscription** — the trigger, and optionally a
  guard and an effect — as free text. There is no structure in it. Quote it,
  attribute it to its edge, and stop; you may not parse `event / action` into
  fields, because nothing in the language promises that shape.
- **A self-loop is "the event occurs and the machine stays"**, which is a
  fact about the machine. Under `flowchart` the same drawing is a *poll* —
  "check again" — and that is a different claim entirely.
- **The set of states is closed.** The nodes are all the modes the figure
  asserts; a state not drawn is not asserted to exist.

**Still not conclusible, and the list is the same as everywhere else:**

- **No current state.** Nothing in a figure says which state the machine is
  in now. A fill colour does not, a `class` does not, position does not.
- **No initial and no final state.** The language has no vocabulary for
  either at `figdown 0.2` — deliberately, pending evidence, and **no `start`
  keyword was added**: ISO's terminator symbol is *both* ends distinguished by
  its label, so there is no word to borrow, and a reader who lacks one answers
  "unstated" rather than answering wrongly. A state with no incoming
  transition is *drawn* that way; it is not *declared* initial, and reading it
  as initial is inventing a fact.
- **No ordering among transitions.** Peer edges have no sequence, and an
  ordinal in a label is naming, not order.
- **No hierarchy, no regions, no history.** A `group` groups; it does not
  make a superstate.
- **Nothing from the layout zone.** `pin` is arrangement for humans; skip it.

**Reclassifying costs more than one line now.** Changing `flowchart` to
`statechart` on line 1 no longer suffices: every `flowline` becomes a
`transition` and every `node` a `state`. Run `tools/migrate-figdown.js` — it
rewrites both, scoped by the header genre.

**Do not upgrade a `flowchart` to a `statechart` on structure.** It was
measured: cycles do not separate the two (of the state machines and the
flowcharts in this project's own corpus, both are usually cyclic), and
self-loops appear in almost none. A retry loop drawn as a flowchart is exactly
the figure that reads wrong as a statechart. **Only the declared genre says
which it is** — and a title that contains the words "state machine" does not,
because a polling flowchart is routinely titled that way.
