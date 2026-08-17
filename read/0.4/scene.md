# Genre `block` — things and the connections between them

Status: NORMATIVE and portable.

Load this for any figure made of **things and the connections between
them** whose line 1 says `block`. Everything below is `block`'s own
vocabulary; nothing below is authority for any other genre.

**Every scene genre declares its own words.** There are four, and each one's
vocabulary is declared once, in its own file:

| genre on line 1 | where its vocabulary is declared |
|---|---|
| `block` | this file |
| `topology` | `experimental/topology.md` |
| `flowchart` | `experimental/flowchart.md` |
| `statechart` | `experimental/statechart.md` |

A word two of them spell the same is **two declarations that happen to agree
today**, never one inherited — each genre may withdraw, rename or constrain
its own without touching the others, and each carries its own reading advice
because the same word can be safe in one domain and misleading in another.
So do not carry a word from this file into another genre and do not go
looking here for a word another genre's file did not give you: a word the
genre on line 1 does not declare is a **line error that states the ground**,
not a spellcheck.

Three words are spelled the same in all four and are not subject vocabulary
at all — `class` says what a colour *means*, `flow` and `rank` state layout
intent. None of them names a thing in the world, so no domain holds a rival
meaning for one, and each genre's file repeats them rather than sending you
here.

## The vocabulary, in one figure

```figdown
figdown 0.1 block
title "Order intake"

flow right                  # reading direction; ONE per document, before
                            # the nodes

node audit "Audit log" shape=cylinder fill=#eef2ff stroke=#4338ca
node retry "Retry buffer" shape=rounded
node reject "Reject" shape=circle style=dashed
node route "Route?" shape=diamond
node vendor "Vendor API" shape=ellipse
node ledger "Ledger" shape=box style=solid

group intake "Intake service" gap=0     # a container; gap=0 packs its
node parse "Parse" in=intake            # members flush against each other
node check "Validate" in=intake         # the id is required and exists only
                                        # so other lines can name it

external order "Order in"         # the outside world. NEVER drawn as a
external ack "Ack out"            # shape — the edge simply ends open there

edge order -> parse               # ops: ->  <-  --  <->
edge parse -> check
edge check -> route
edge route -> retry
edge retry -> ledger
edge ledger -> ack
edge audit <- check               # arrow points at `audit`
edge check -- reject style=dotted # undirected
edge ledger <-> vendor            # both ways
edge parse -[malformed]-> reject  # on-line label splits the operator
edge parse [raw] -- [typed] check # endpoint labels: ports, cardinality, roles

rank parse,check,route      # pull peers onto one row/column. ONE
                            # comma-delimited token, no spaces

class slow "Degraded path" stroke=#dc2626
edge retry -> reject class=slow
```

`flow` takes `flow right|down|left|up` — one of the four, once per document.

Values from a fixed list are written **bare**, never quoted: `shape=box`,
`style=dashed`, `flow down`, `gap=0`. So are ids. Labels are the opposite
and always take quotes.

`shape=` is **pure geometry, no domain nouns** — `shape=box` (the default),
`shape=rounded`, `shape=circle`, `shape=ellipse`, `shape=diamond`,
`shape=cylinder`, and nothing else. A cloud in a source drawing is an ellipse
or a group, with what it *is* — "the internet", "the vendor's platform" —
written in the label.

Endpoint labels nest (`edge a [items[0:9]] -- b`); quote them when they hold
a line break or an unbalanced bracket (`edge a ["slot\n1/1"] -- b`). A `#`
inside a bracket label is ordinary text and needs no quotes —
`edge a -[hop #1]-> b` — because `[ ]` is a verbatim region, like a quoted
string, a comment and a pipe row.

## What `group` and `external` claim here, and what they do not

`block` is the **general-purpose** genre: it has no single domain, and that
is what general-purpose means. So its two container-and-boundary words carry
no domain caveat, and you should not supply one.

- **`group`** is a container and nothing more — a box drawn round its
  members, one nesting level deep. It asserts no ownership, no lifecycle, no
  address space and no failure domain. Whatever the grouping *means* goes in
  the label.
- **`external`** is an out-of-figure endpoint: something the figure talks to
  but does not describe. It is **never drawn** — the edge simply ends open —
  it takes **no option key at all**, and there is no source standard behind
  the spelling. It is FigDown's own word for FigDown's own boundary.

A genre with one domain cannot be this quiet. `topology`'s file has to warn
its reader off a rival reading of both words before it can use either; this
file has nothing to warn about, and that asymmetry is why the two
declarations are separate.

## Field-tested pitfalls

**Containment is not an edge.** An edge from a node to its own container
carries no meaning. Use `group` plus `in=` on each member, and `gap=0` when
the source drawing shows the parts flush.

**Presentation attributes work on everything.** `style=dashed`, `fill=` and
`stroke=` are legal on any element, groups included. There is no restriction
by element kind — only the two-channel rule: an `edge` has no
interior, so `fill=` on one is an error naming `stroke=`.

**Colour that means something must be a `class` with `stroke=`.** The
yes/no branch case is the common one:

```figdown
figdown 0.1 block
class yes "Yes path" stroke=#16a34a
class no "No path" stroke=#dc2626
node check "Valid?" shape=diamond
node accept "Accept"
node reject "Reject"
edge check -> accept class=yes
edge check -> reject class=no
```

A class an edge joins MUST NOT declare `fill=` with no `stroke=`: an edge has
no interior, so that class reaches nothing on it — write `stroke=`, and a
`style=` beside the `fill=` does not answer for it. A class that declares
**no paint at all** is legal on every member: it draws its meaning in the
derived legend with no swatch, and the edge keeps its default line. Read a
paint-less class as a claim about MEANING, never as a missing colour. One
class may carry both keys and serve nodes and edges at once — do not split
it.

**Never invent a label.** If the shape genuinely carries no text — a
junction, a bare glyph — write an explicitly empty label: `node j ""`. It
records `label: ""` and draws blank. If a label exists but you cannot read
it, omit the quoted label and say so in a `#` comment; the id then shows as
a visible placeholder, which is what you want for something unresolved.

**A shared medium is not a star.** Flattening a bus, a broadcast segment or
a shared message topic into point-to-point links changes what the figure
asserts: the shared thing reaches every participant at once. Model it as one
intermediate `node` that fans out.

**Externals, not fake nodes.** Anything representing the outside world — a
request arriving, a report leaving, a human operator — is an `external`, not
a `node` styled to look like one.

## Where to go next

- The figure came out scrambled, or placement is the message → `layout.md`
- Marker lines and zone bands over a `block` figure →
  `experimental/block.md` (EXPERIMENTAL)
- Bars drawn from a `table` region → `experimental/chart.md` (EXPERIMENTAL)

## The drawn annotation — `note=` (`figdown 0.3`)

`note=` is an **attribute on the annotated element's own line**, and the
element it is about is the element it is written on: `node a "A" note="…"`,
`group g "G" note="…"`, `edge a -> b note="…"`, `title "T" note="…"`.
There is no id, no target key and no locator, so there is never a question
of which of several identically-labelled elements is meant.

**What you may conclude.** The text is authored prose — quotable,
displayable, **never parsable**. It is an aside about the element, not a
fact about the figure's structure. Attribute it to its carrier and stop;
do not infer a participant, an edge or a category from it. A `note=` on
`title` is about the **figure** and about no element.

**What it is not.** It is not `description=`. The two divide by AUDIENCE:
`description=` is machine-facing and draws nothing beyond an SVG `<title>`;
`note=` is human-facing and always draws. And **where a typed slot exists,
a note is never where the fact lives** — a category is a `class` meaning, a
containment is `in=`, a direction is the operator. If a note's text looks
like structure, it is still prose: read the structure off the construct that
states it.
