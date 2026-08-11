# Genre `flowchart` — EXPERIMENTAL / EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x`. A portable figure uses `block` instead.

Load `../scene.md` first — `flowchart` reuses the whole scene vocabulary
(`node`, `group`, `external`, `edge`, `flow`, `rank`) with the same meanings,
and adds the three role keywords below. `flow down` is the default here.

## Three role keywords

```figdown
figdown 0.1 flowchart
flow down
terminator start "Request received"
process parse "Parse body"
decision valid "Schema valid?"
process apply "Apply change"
process reject "Reject"
terminator done "Response sent"
node log "Audit store" shape=cylinder
edge start -> parse
edge parse -> valid
edge valid -[yes]-> apply
edge valid -[no]-> reject
edge apply -> done
edge reject -> log
edge log -> parse
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

**A bare `node` under `flowchart` states no role, and that is often correct.**
Do not "upgrade" one to `process` unless it really is a step — a datastore, a
wait, or an annotation is none of the three, and claiming a role would be a
lie the reader cannot detect.

**Label every exit from a `decision`.** Use the on-line label form
(`edge d -[yes]-> x`) or an endpoint label; an unlabelled branch is a figure
the reader has to guess at.

**There is no loop keyword.** A plain back-edge *is* the loop.
