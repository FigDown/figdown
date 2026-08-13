# Genre `flowchart` — EXPERIMENTAL / EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x`. A portable figure uses `block` instead.

Load `../scene.md` first — `flowchart` reuses the scene vocabulary
(`node`, `group`, `external`, `flow`, `rank`) with the same meanings, and adds
the three role keywords below. `flow down` is the default here.

**Under `figdown 0.2` the connector is `flowline`, not `edge`** — ISO 5807's
own word for a flowchart's connecting line. Same operators, same labels, same
option keys, same model; only the word changed.

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
