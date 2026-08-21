# Genre `sequence` — EXPERIMENTAL

The genre is outside the conformance surface: it may change or be
**withdrawn** in a later `0.x` without a migration. There is no portable
rewrite of a sequence figure — a scene genre cannot carry time order — so a
figure written here is written here.

**It draws a ladder.** Participants are columns, left to right in `lifeline`
declaration order; time runs down the page, one row per `message` or `state`
in the order you wrote them. A `fragment` is a frame around the rows that
name it, with its operator in a tab at the top-left corner; an `operand` is a
compartment of that frame, as wide as the frame, divided from the one above
by a dashed rule, with its guard drawn `[in brackets]` at the left; a `state`
is a pill centred on its own column. A message to and from the same lifeline
draws a small rectangular loop; a message between non-adjacent columns is one
straight shaft over the lifelines it crosses, which are left intact; `<->`
draws ONE shaft with two heads, because it is one message and not two.

**You place nothing.** This genre has no key that moves a coordinate — not
`flow`, not `rank`, not a position. `layout` and `pin` still parse, because
they are the language's and no genre may redefine them, and a `pin` here
changes nothing at all: the drawing is identical with and without it.
Everything you can change about the figure, you change by changing what the
source SAYS.

**There are no activation bars.** UML draws a bar for the period a
participant is executing; that is a different thing from a message, this
genre has no word for it, and the renderer will not invent one out of which
messages happen to be adjacent.

**It needs `figdown 0.4` on line 1.** `figdown 0.3 sequence` is a line error,
and a deliberately named one: `genre "sequence" requires figdown 0.4`.

## The vocabulary, which is five words

**This file is `sequence`'s whole vocabulary.** Load it and you can author in
this genre; do not load another genre's file, because another genre's
declaration of a word is not authority for this one.

| Line | What it declares |
|---|---|
| `lifeline <id> ["label"]` | a participant column — this genre's word for a node |
| `message <a> -> <b> ["label"]` | one message from `<a>` to `<b>` — this genre's word for a connector |
| `state <lifeline-id> "<state name>"` | the named state a lifeline is in from here on |
| `fragment <id> ["label"] type=<operator>` | a combined fragment — a framed region of the exchange |
| `operand <id> ["guard"] in=<fragment-id>` | one compartment of a fragment |

All five are taken from OMG UML 2.5.1 clause 17, which is this genre's source
standard, and every one of them is published by ISO as well, in ISO/IEC
19505-2 clause 14. Three more words are legal because they are not about
exchanges at all: `class` (what a colour means), `title`, and `layout`/`pin`
— though a `pin` has nothing to place here.

**`flow` and `rank` are NOT this genre's keywords**, and that is a
consequence rather than an omission: both axes are already ordered by the
source. Columns are in `lifeline` declaration order; time runs down the page
in the order the `message` and `state` lines are written. A key that
reordered either would make the drawing disagree with the text.

**A `bitfield`, `table` or `timing` region cannot be opened here either.** A
scene genre can host one because it has a scene to host it in; a ladder has
no scene, so those three openers are line errors under `sequence`. Put the
companion table in its own section with its own header line.

## Order is declaration order, and it is TOTAL

The figure's time axis is the `message` and `state` lines **in the order you
wrote them**. There is one order, it is total, and every reader gets the same
one. UML and ITU-T Z.120 both define a *partial* order — total along each
participant's own axis only, with cross-participant order coming from the
messages themselves. FigDown asserts more than either, deliberately, so that
one source never admits two equally legal drawings and a reader never has to
compute an ordering. **Write the lines in the order the events happen.**

The one way to say that two messages are NOT ordered is a `par` fragment
around them. That makes `type=par` part of the order model rather than a
convenience: without it, adjacent means earlier-than, always.

## `message`: three operators, and `--` is an error

```figdown
figdown 0.4 sequence
lifeline c "Client"
lifeline s "Server"
message c -> s "DHCPDISCOVER"
message c <- s "DHCPOFFER"
message c <-> s "keepalive"
```

`->` and `<-` give the direction; `<->` is a sustained two-way exchange whose
individual messages are not enumerated — one message, drawn with one shaft
and two heads. **`--` is a line error here** and legal in every other genre:
a message has a sending event and a receiving event, so one with no direction
is not a thing this domain has.

The trailing quoted string is the message text, and it is where to write it.
The shared connector grammar also accepts a label in the inline bracket
position — `message c -[DHCPDISCOVER]-> s` — and both spellings reach the
same one field, so **writing both on one line is a line error**. Prefer the
trailing form; the bracket position reads as an annotation on the line rather
than as the message itself. `[tail]` and `[head]` are a different thing and
are unaffected: they label the two ends, not the message.

Both endpoints must be declared `lifeline` ids.

## `state`: slot 1 REFERENCES a lifeline

```figdown
figdown 0.4 sequence
lifeline c "Client"
state c "BOUND"
```

This is the one place a word means something different from what it means in
another genre. Under `statechart`, `state locked "LOCKED"` **declares** the id
`locked`. Under `sequence`, `state c "BOUND"` **references** the lifeline `c`
and declares nothing: nothing here refers to a state occurrence, so it needs no
id of its own. The quoted name is **mandatory** — a state occurrence with no
name asserts nothing.

Two consecutive `state` lines naming the same lifeline and the same name are a
line error: a state that has not changed is never restated.

## `fragment` and `operand`: `type=` is mandatory

```figdown
figdown 0.4 sequence
lifeline c "Client"
lifeline s "Server"
fragment renew "renewal cycle" type=loop
operand t1 "while the lease is live" in=renew
message c -> s "DHCPREQUEST" in=t1
```

`type=` takes one of **twelve** values, bare, taken whole from UML's
`InteractionOperatorKind`:

`alt` `opt` `loop` `par` `strict` `seq` `critical` `neg` `assert` `ignore`
`consider` `break`

There is **no default**. UML gives the attribute one (`seq`) and FigDown does
not, because a default draws a frame that looks like an assertion and is not
one. An `operand` is a compartment **of** a fragment, so its `in=` is
mandatory, and its quoted string is the guard. A fragment or an operand with
no members is a line error: a container's extent is the span of the lines
that name it, and a container with no extent asserts nothing.

## `in=`: five acceptors, one meaning, one level

`in=` means *the element this one lives inside*, and its value is always a
`fragment` or an `operand` id. It is accepted on **`message`, `operand`,
`lifeline`, `state` and `fragment`** — five acceptors, all the same meaning.
An `operand`'s `in=` is narrower still: a compartment belongs to a FRAGMENT,
never to another compartment.

Three rules come with it:

- **Members must be CONTIGUOUS** in declaration order. An operand denotes the
  ordered run of the occurrences it contains, so an occurrence that is not in
  it cannot happen between two that are. A line that splits a run is a line
  error naming the run.
- **Fragment nesting is capped at ONE level.** A fragment may sit in an
  operand of one enclosing fragment and no deeper. Write a deeper interaction
  as a sibling fragment, or state it in `description=`.
- **Containment is a tree.** A container that ends up inside itself is a line
  error, because a cycle denotes nothing.

## Three things this genre refuses, and what to write instead

Each is a line error with a named diagnostic — the engine tells you the ground
and the replacement. They are listed here so you do not reach for them.

- **`gap` — refused.** The vertical axis is not proportional: non-zero time has
  already passed between every adjacent pair of events, so the line would say
  nothing new, and *draw it further apart* is a rendering request. Put the
  elapsed time into the following message's label or its `description=`.
- **`group` — refused.** UML clause 17 has no lifeline-grouping construct, and
  a band across a column span would silently enclose non-members. Declare a
  `class` naming what the participants have in common and put `class=` on each
  `lifeline`: it asserts membership without asserting adjacency, and it earns a
  legend entry.
- **`lost=` — refused, and no option key was added for it.** For a message that
  was sent and not delivered, declare `class dropped "Sent, never delivered"`,
  put `class=dropped` on the message, and put the per-message reason in
  `description=`.

## A whole document

```figdown
figdown 0.4 sequence
title "Address lease and renewal"
class dropped "Sent, never delivered" stroke=#b91c1c style=dashed
lifeline c "DHCP client"
lifeline s "DHCP server"
message c -> s "DHCPDISCOVER"
message c <- s "DHCPOFFER"
state c "BOUND"
fragment renew "renewal cycle" type=loop
operand t1 "when the renewal timer fires" in=renew
message c -> s "DHCPREQUEST" in=t1 class=dropped description="the issuing server does not answer"
state c "RENEWING" in=t1
```

Presentation is the same everywhere: `fill=` the interior, `stroke=` the
outline and the whole of a line, `class=` one or more declared class ids
comma-separated, and `style=solid|dashed|dotted` for the dash pattern.
`fill=` is an error on a `message`, on a `fragment` and on an `operand` — a
line has no interior, and a frame drawn over messages must not hide them.
`shape=` is accepted by nothing here: every shape in the ladder is the
engine's. `note=` is a drawn aside in prose and `description=` is authored
documentation that is never drawn; neither is where a structural fact lives.
A `fill=`-only class joined by a `message`, a `fragment` or an `operand` is a
**line error**: a line has no interior, so that class reaches nothing on it —
write `stroke=`. (This was accepted, when the check ran over
`edge`s only; it reaches every collection that takes `class=`.) A class that declares **no paint at all** is legal on any
member and always was here: it draws its meaning in the derived legend with
no swatch, which is what `class dropped "Sent, never delivered"` does in the
reference figure. Read a paint-less class as a claim about MEANING, never as
a missing colour.

## What you may conclude from a `sequence` figure

- **Every `message` is a message**, its direction is the direction it travels,
  and its position in the source is its position in time.
- **The order is total.** Two messages written one after the other happened in
  that order.
- **`<->` is ONE message**, an exchange in both directions whose individual
  messages are not enumerated — never a count of two.
- **The set of participants is closed.** A participant not declared is not
  asserted to exist. Column position is declaration order and means nothing
  else: not seniority, not layering, not a path.
- **A `state` line is the condition its lifeline is in from that point on**,
  as free text — quotable, attributable, never parsable.
- **A `fragment` says what KIND of run its members are**, and its `type=` is
  that claim; an `operand`'s quoted string is the guard on that compartment.

**Still not conclusible:**

- **No elapsed time, ever.** Vertical distance means only that non-zero time
  passed. There is no duration, no timestamp and no rate in this genre.
- **No concurrency unless a `par` fragment says so.** Two adjacent messages are
  ordered, not simultaneous.
- **No failure, no retransmission and no loss** unless a `class` says so in
  words. There is no keyword for any of them, and a `class` meaning is prose:
  attribute it to the prose, not to the model.
- **No activation, no execution period, no "busy".** Nothing is drawn for it
  and nothing may be inferred from message adjacency.
- **No identity** between two messages with the same label, and none between a
  state name here and a state in a statechart document. A shared `class` is a
  shared category, never a shared identity.
- **Nothing from the layout zone.** Here that rule is total rather than
  conventional: a `pin` changes no coordinate, because there is none to change.

## Naming a connector — `id=` (`figdown 0.5`)

A connector may carry an optional `id=`, and most do not. Writing one gives
the line a **handle**: a name other constructs in the same section use to
point at this connector, a key a diff pairs on, and the value the artifact's
`data-edge` carries.

**What you may conclude from an id, and it is very little.** An id is a
handle and its SPELLING says nothing. Meeting `message a -> b "SYN" id=m1` you may conclude that
something in the document can refer to this connector; you may **not**
conclude that it belongs to a group of any kind, that it is the first of
several, or that it is related to a connector with a similar name. Whatever
claim looks implied is made by a construct that states it, or it is not made.

**And an unnamed connector is not a lesser one.** Anonymity is the default:
most connectors in most figures carry no id, and the absence is not a gap, a
draft state or a weaker assertion. Do not treat the named connectors in a
figure as the important ones.

An id is bare, matches `[A-Za-z_][A-Za-z0-9_-]*`, and is unique within its
section — it shares one namespace with node, group and region ids, so a
connector cannot take a name something else already has.

**An id on a message names it and orders nothing.** The figure's time axis is
declaration order and nothing else; two messages are two occurrences however
they are named, and an id never says that two of them are one, or that one
comes before another. If you need the order, read the order.
