# Layout — getting the arrangement you meant

Non-normative guidance; it assumes you already have the syntax of `layout`
and `pin`. This file is about **when to reach for which rung**.

## State the direction first

For any scene, write `flow down` or `flow right` before the nodes. It is one
line and the highest-value layout intent you can give.

## The escalation ladder

Try the lowest rung that makes the figure readable, and stop there.

| Rung | Directive | When |
|---|---|---|
| 0 | *(nothing)* | small graphs, or figures where spatial order carries no meaning |
| 1 | `flow` | the reading direction of the figure |
| 2 | `rank` | pull parallel peers onto one row or column — stages, layers, siblings. This is **content**, not layout: it stays above the `layout` line |
| 3 | `pin` | placement IS the message. **Top rung** |

Iteration loop: build → look at the SVG → run `node tools/layout-lint.js` →
add **one** rung → repeat → stop when it is legible.

**There is no rung above 3.** Edge geometry is not authorable: the engine
routes edges, and your levers are `rank`, declaration order, `flow` and
`pin`. When `pin` is not enough, the remaining moves are structural — a
relay node, a muting `class`, or splitting one figure into two joined by
`external` endpoints.

## `pin`, and what it costs

```figdown
figdown 0.1 block
flow right
node a "Ingress"
node b "Egress"
group rack "Rack 1"
node c "Line card" in=rack
edge a -> b
layout
pin a at=(40,120)
pin b at=(360,120) width=140
pin rack at=(40,240)
pin c at=(20,20)
```

- `at=` is a point in canvas pixels. `width=`/`height=` are **nodes only** —
  a group, an `external` endpoint and a typed block all size to their
  content, and pinning an extent on one is an error.
- All three keys are optional in any combination; `pin a width=120` alone is
  legal. A `pin` carrying none of them is an error.
- **Two levels.** Pinning a `group` anchors its origin on the canvas;
  pinning a member is **group-local**. So moving a whole group is a one-line
  change, and groups never disturb each other's layout.

**Over-pinning is the common mistake.** Every `pin` is a promise every future
edit has to keep. Pin only the elements whose position *is* the message —
auto-layout keeps improving, and rung-0 quality rises for free while a pinned
figure stays exactly as rigid as you left it.

## Two facts that trip people up

**Auto-layout cannot reproduce a specific spatial arrangement** from a source
drawing. If the source's geometry carries meaning — a physical rack, a
geographic map, a stack of layers — supply `pin` hints and a `flow` together.
Insertion order is not a placement mechanism.

**The zone-deletion invariant is how you check your own work.** Delete every
`pin` line and the `layout` line above them: the structure that remains must be
the same figure, complete on its own. Anything that disappears was never in the
content zone, and putting it there is the fix.

**A load-bearing layout is a gap, not a feature.** The layout zone exists to
stabilise the SVG, and a reader is entitled to ignore it entirely. If your
figure's meaning survives only because of where things sit, say so in the
prose around the figure: the `.fd` does not carry it.
