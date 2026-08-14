# Genre `flowchart` — EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x` without a migration entry. A portable figure uses
`block` instead.

Use `flowchart` when the figure is a **procedure**: stages performed in
order, with branches. `flow down` is the default here.

**This file is `flowchart`'s whole vocabulary.** Load it and `../layout.md`
and you can author in this genre; do not load another genre's file, because
another genre's declaration of a word is not authority for this one. In
particular this genre declares **no container**: there is no `group`, and
`in=` and `gap=` are **not this genre's option keys** — `in=` named a `group`
id and nothing else, so it went out with `group` rather than stay accepted with
no value that could resolve. Writing either is a line error that names the
withdrawal. Say what a container would have said with a `class`
whose label states it — it earns a legend entry and applies to every member at
once — or split the procedure into two figures joined by `external` endpoints.

**Under `figdown 0.2` the connector is `flowline`, not `edge`** — the word the
flowchart domain commonly uses for the symbol ISO 5807 §9.3.1 names *Line*.
Same operators, same labels, same option keys, same model; only the word
changed.

**The spelling is gated by the version you declare.** Under
`figdown 0.1 flowchart`, `edge` is still the word and `flowline` is a line
error naming the version; under `figdown 0.2 flowchart` it is the other way
round. Each version accepts exactly one spelling — two in one version would be
an alias. A document that writes `flowline` must declare `figdown 0.2`, and
`edge` under 0.1 stays legal until v1.0.

## Three role keywords, and when to write `node` instead

```figdown
figdown 0.2 flowchart
flow down
terminator start "Request received"
process parse "Parse body"
decision valid "Schema valid?"
process apply "Apply change"
process reject "Reject"
terminator done "Response sent"
node log "Audit store" shape=cylinder
flowline start -> parse
flowline parse -> valid
flowline valid -[yes]-> apply
flowline valid -[no]-> reject
flowline apply -> done
flowline reject -> log
flowline log -> parse
decision kind "Change kind?" shape=ellipse
```

`process`, `decision` and `terminator` take the same option keys and share
the same id namespace as `node`. Their geometry is **derived from the role**:
box, diamond and rounded respectively.

**Prefer a role keyword to `node … shape=diamond`.** A shape convention has
to be *learned*; a word is just *read*. And the convention is unreliable in
practice — of 216 question-labelled nodes measured across a real corpus, 78%
were diamonds, 14% ellipses and 8% carried no shape at all. A reader of the
text gets the right answer from `decision`; a reader of the geometry gets it
wrong roughly one time in five.

`shape=` still works on a role, and it changes **only the drawing**: the
model still records the role. That is the escape hatch for matching a source
drawing without lying about what the step is.

**Prefer a role. `node` is the fallback, not the default.** Reach for
`process`, `decision` or `terminator` first, and write `node` only when **the
source does not state which** the stage is.

That is what a bare `node` says here, and it is all it says: *the source does
not state the role.* ISO 5807 is a standard for **drawing** flowcharts, so it
has no "unclassified" — the person with the pen must draw some symbol, and
every drawn stage therefore has a classification. FigDown separates role from
geometry, so it can record the absence instead of inventing a role. A
transcriber who genuinely cannot tell a Process from a Predefined process
writes `node`, and that is the honest line.

**`node` is NOT the spelling for "an ISO symbol FigDown has not implemented."**
Nine ISO stage symbols have no word in this genre — Data (input/output),
Stored data, Predefined process, Preparation, Manual operation, Manual input,
Document, Parallel mode, Loop limit. That is a **gap in FigDown**, not a fact
about your figure, and writing a bare `node` for one of them files the gap as
if it were your judgement. When your source states a role this genre cannot
spell:

- write `node` — `process` would be a false claim, and nothing in the figure
  could catch it;
- **name the ISO symbol in a comment** on the same line, so the classification
  survives as text a reader can quote (a comment is never parsed, and never a
  second semantic channel);
- report the gap, so it can be counted and closed.

```figdown
node cfg "Read config file"   # ISO 5807 Data (input/output) — no FigDown role
```

So do not "upgrade" a `node` to `process` to make it look decided — and do not
write `node` because deciding was work. Those are different acts with the same
spelling, and only you know which one you did.

**Label every exit from a `decision`.** Use the on-line label form
(`flowline d -[yes]-> x`) or an endpoint label; an unlabelled branch is a
figure the reader has to guess at.

**There is no loop keyword.** A plain back-edge *is* the loop.

## `external` — the boundary, which is not the `terminator`

```figdown
figdown 0.2 flowchart
flow down
external ingress "Frame arrives on a port"
terminator start "Begin lookup"
process lookup "Look up destination"
external egress "Frame leaves the switch"
flowline ingress -> start
flowline start -> lookup
flowline lookup -> egress
```

`external` is an **out-of-figure endpoint**: the procedure connects to it and
this figure does not describe it. It is **never drawn** — the flowline simply
ends open — and it takes **no option key at all**. `terminator` is the
opposite: a drawn stage of this procedure, its start or its end.

So the question to ask is *whose* start it is. The first box of **this**
procedure is a `terminator`. A step that belongs to some other procedure, or
to the world outside the figure, is an `external`.

ISO 5807 §9.4.2 names this concept — its **Terminator** symbol is "an exit
to, or an entry from, the outside world" — and this genre already spells that
word `terminator` for the drawn start/end symbol, so the ISO term is taken
and `external` keeps FigDown's own spelling. Note what follows: ISO has no
word at all for a boundary that is *never drawn*, which is what `external`
is. The spelling is FigDown's, not ISO's, and this file is the only place
that says so.

## Presentation, layout intent and quoting

`flow` takes `flow right|down|left|up` — one of the four, once per document,
before the stages. `flow down` is this genre's default. `rank a,b,c` pulls
peers onto one row or column: ONE comma-delimited token, no spaces.

Values from a fixed list are written **bare**, never quoted: `shape=box`,
`style=dashed`, `flow down`. So are ids. Labels always take quotes.

`shape=` is pure geometry — `shape=box` (the default), `shape=rounded`,
`shape=circle`, `shape=ellipse`, `shape=diamond`, `shape=cylinder`, and
nothing else. `style=` takes `style=solid`, `style=dashed` or `style=dotted`.

`class` declares what a colour **means**, and colour that means something
must be a `class`:

```figdown
figdown 0.2 flowchart
class yes "Yes path" stroke=#16a34a
class no "No path" stroke=#dc2626
decision check "Valid?"
process accept "Accept"
process reject "Reject"
flowline check -> accept class=yes
flowline check -> reject class=no
```

A class a flowline joins MUST declare `stroke=` or `style=`; a `fill=`-only
class joined by one is an error naming `stroke=`. `fill=` and `stroke=` are
legal on any drawn element, but a flowline has no interior, so `fill=` on one
is an error.

The connector's operators are `->`, `<-`, `--` and `<->`. In a procedure you
almost always want `->`: a step follows another step in one direction, and an
undirected or two-way flowline asserts an order the reader cannot recover.

Endpoint labels nest (`flowline a [retry 1] -- b`); quote them when they hold
a line break or an unbalanced bracket. A `#` inside a bracket label is
ordinary text and needs no quotes, because `[ ]` is a verbatim region.

Under `figdown 0.3` any of these lines may carry `note=`, a drawn aside in
prose: `process parse "Parse body" note="…"`. It is never parsable and never
where a structural fact lives.
