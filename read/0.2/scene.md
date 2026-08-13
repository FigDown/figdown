# Scene genres — `block`, and the vocabulary `topology` / `flowchart` / `statechart` share

Status: `block` is NORMATIVE and portable. The same seven keywords are
the whole scene surface; `topology`, `flowchart` and `statechart` reuse them
and add — or **rename** — their own, in their own files.

Load this for any figure made of **things and the connections between them**.

**Two of the seven are spelled differently by genre.** Read
this file for what they *mean*; write the word your genre uses:

| genre | the thing | the line |
|---|---|---|
| `block`, `topology` | `node` | `edge` |
| `flowchart` | `node` | **`flowline`** |
| `statechart` | **`state`** | **`transition`** |

Each genre takes the term its own domain actually uses — ISO 5807 calls a
flowchart's connector a *flowline*; UML calls a state machine's arc a
*transition*. The wrong one is a **line error naming the right one**, never a
silent acceptance, so you cannot get this wrong without being told. Everything
else about them — operators, labels, option keys, the model — is identical.

## The seven keywords

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
`style=dashed`, `flow down`, `plane=over`. So are ids. Labels are the
opposite and always take quotes.

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

A class an edge joins MUST declare `stroke=` or `style=`; a `fill=`-only
class and a paint-less class are both errors naming `stroke=`. One class may
carry both keys and serve nodes and edges at once — do not split it.

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
- Marker lines, zone bands, link bundles, overlay planes, charts →
  `experimental/constructs.md` (EXPERIMENTAL)
