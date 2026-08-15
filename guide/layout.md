# Layout Guide — arranging FigDown figures for human readers

> **Non-normative recommendation.** Nothing here is required. A `.fd` with zero
> layout lines is fully conforming (spec §3: auto-layout is the default). This
> guide teaches how to **think** about arranging a figure for human readers
> using the layout zone. All layout calls are maintainer recommendations, not
> mandates.
>
> Layout applies inside a **section** (one `figdown 0.1 <genre>` …). In a
> multi-section file (`MULTI-FIGURE-DOCUMENTS`), each section has its own content zone and optional
> `layout` zone; pins do not cross sections. Prefer main-standard genres
> (`block`, `bitfield`, `table`) when the figure must be portable — see
> [authoring.md](authoring.md).
>
> Lessons come from field observation of a downstream authoring pass.

## 1. The two-zone mindset

FigDown has two zones (spec §3, `CONTENT-LAYOUT-ZONE-SPLIT`): the **content zone** (before `layout`)
holds nodes, edges, groups, and classes — the complete knowledge of what the
figure means. The **layout zone** (after `layout`) holds only `pin` —
instructions for how that knowledge lands on a canvas. (It held four
directives once. `size` merged into `pin` under `ELEMENT-GEOMETRY-DIRECTIVE`, so one
directive now carries an element's whole declared geometry; `path` and
`routing` were **withdrawn from the language** under `EDGE-GEOMETRY-CONSTRUCTS`, with
their option keys `points=`, `tailport=`, `headport=` and `routing=` —
removed, not renamed, so there is no spelling to migrate to. See
[spec/migrations.md](../spec/migrations.md) 0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`** for
the requirement that survived them, and
the project’s working record for the evidence, which is not published.)
(The zone opener was spelled `render` before 0.1; that spelling is now a
line error, because the zone takes geometry, not presentation.)

Key invariant (`GUI-WRITEBACK-STRUCTURE`, `MEANING-RECOVERY-SOURCE`): stripping every `pin` line
must leave a document that still parses, renders under auto-layout, and
expresses the identical structure and relationships. No knowledge lives in the
layout zone. If removing a `pin` changes what an AI reader can learn, the
position was encoding meaning that should live in text instead.

**The layout NAMESPACE is DEFAULT-IGNORED (`GENRE-NAMESPACE`, strengthening `CONTENT-LAYOUT-ZONE-SPLIT`; restated
over the namespace by `GENRE-NAMESPACE`).** It exists
ONLY to stabilise the rendered `.svg`. Anything that is content, logic or
concept MUST be expressible in the content zone, so a reading agent's default
behaviour is to ignore **every member of the layout namespace, wherever in the
document it appears** — not merely that it may. **Membership decides, never
position.** Write for that: every `pin` you write is a line an AI reader will
not see, whether you put it after `layout` or before.
There is no keyword to opt in or out. (The earlier form of this promise said
"skip everything from the `layout` line down", and that was literally true and
practically empty: `pin` is legal before `layout` too, and about half the pins
in this repository's own corpus are written there, so an agent keeping that
promise still met half the layout information. `GENRE-NAMESPACE` moved the promise onto the
namespace, where the container model already was.
**the layout zone is a namespace of its own** (`LAYOUT-ZONE-NAMESPACE`, clause
`LAYOUT-ZONE-NAMESPACE`), and every
member of it is genre-independent. No genre may
define, redefine or extend a keyword inside the zone; `GENRE-VOCABULARY-OBLIGATION`, "a genre owns its
words", does not reach in. That is what makes the default safe *for ever* and
what makes it usable: ONE enumeration of the members is correct under every
genre, so a reader may apply it without even resolving the header's genre
token. That enumeration is **core §10 (a′)**, it is NORMATIVE, and it has exactly **one** member — `pin`, NORMATIVE. `layout` is not a
member: it is the zone's OPENER and lives in the universal core of three
(§10 (a)) alongside `figdown` and `title`. The withdrawal of `path` and
`routing` left `LAYOUT-ZONE-NAMESPACE` whole and took its only experimental members with it.) If a
figure needs
"arrangement carries meaning", the language owes it a content-zone construct
(`MEANINGFUL-ARRANGEMENT`); until that lands, say the arrangement in prose in the content zone
as well, and treat the layout lines as a stopgap.

Auto-layout is a **default**, not a promise. When the original figure's spatial
arrangement carries reading order — left-to-right pipeline stages, top-down
layer stack — reproduce that orientation in the layout zone so human readers
follow the same path.

Note: `flow` and `rank` are **semantic** directives (`CONTENT-LAYOUT-ZONE-SPLIT`) — CONTENT, not
layout; they go before `layout`, they survive the `GUI-WRITEBACK-STRUCTURE` strip test, and
`tools/strip-check.js` does not strip them. Only `pin` is legal after `layout`.

**Status (`CONSTRUCT-STATUS-TIERS`, spec §10).** `pin` is NORMATIVE — inside the v0.1
conformance surface and the compatibility promise — and it is
the layout zone's entire vocabulary. `path` and `routing`, with their option
keys `points=`, `routing=`, `tailport=` and `headport=`, were EXPERIMENTAL,
which meant precisely that they could be changed or withdrawn in a later `0.x`
without a migration entry; `EDGE-GEOMETRY-CONSTRUCTS` exercised that. All six spellings are now line
errors, and the engine's diagnostic names **no replacement**, because there is
none. What was withdrawn was the ability to state edge geometry by hand — not
the need for it. Where a figure genuinely needs elbow routing with per-edge
control, the requirement is on file as core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, with its known
shape (two modes, two scopes) and its blocker (a per-edge override needs an
edge-identity construct FigDown does not have). What an author does *today* is
the ladder below, which now ends at `pin`.

## 2. The escalation ladder

Try each rung, rebuild (`node tools/build-svg.js X.fd`), and **stop as soon
as the figure reads clearly.** The lowest rung that works is the right choice.

| Rung | Directive | When |
|------|-----------|------|
| 0 | *(nothing)* | Small graphs or figures where spatial order carries no meaning |
| 1 | `flow right\|down\|left\|up` | Direction of the figure — one line before `layout` |
| 2 | `rank a,b,c` | Pull parallel peers onto one row/column — **content, not layout**: it goes before `layout` and states that these elements are peers. Rungs 0–2 are all content; the layout zone starts at rung 3 |
| 3 | `pin … at=(x,y)` / `pin … width= height=` | Topology/spatial where placement IS the message. One directive, three optional keys: `at=` places (nodes, groups, `external` endpoints), `width=`/`height=` extend (**nodes only** — groups, external endpoints and typed blocks size to their content). `size` was retired into `pin` at 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`). **This is the top rung** |

**Rung 1 is where authoring should begin** for **scene** sections (`block`,
or experimental `topology` / `flowchart`). A pure `bitfield` or `table`
section usually has no `flow`/`rank`/`pin` — geometry follows content. For a
scene section, a `flow` line costs one line and gives the layout engine the
single most useful piece of intent it can receive. "Write nothing" (rung 0)
is reasonable only for a figure small enough that direction is obvious — or
for a figure where spatial order carries no meaning at all. Field evidence
confirms this is already the norm: in the first independent production corpus,
all 20 scene documents declare `flow` explicitly (15 `flow down`, 5
`flow right`); not one relies on the genre default.

**What the direction expresses.** `flow down` reads as a portrait figure whose
sequence runs top-to-bottom — the common shape for decision and process
figures. `flow right` reads as a landscape figure whose sequence runs
left-to-right — the common shape for pipelines and layered architectures. The
direction is a reading-order statement to the human, not only a layout knob:
pick the one that matches how the figure should be read, not merely how it
should be arranged. `flow` only declares the visual reading axis for
relationships that already exist; it does not create semantic precedence,
sequence, or connectivity — process order still comes from `edge` declarations
and typed-block declaration order. Honest limit: for a mesh or a hub topology with no
dominant sequence, `flow` sets the primary layering axis but does not by
itself determine the overall aspect. That gap — controlling aspect and
wrapping on figures with no dominant sequence — is tracked in the engine
backlog (long-chain wrapping / aspect control, item 10) and there is no
aspect keyword today.

Higher rungs cost future edit effort (every `pin` is a promise; §5).

**The ladder stops at rung 3, and there is no rung above it.** There used to
be: `routing orthogonal` and `path … points=` were a fourth rung for edge <!-- fence-check: skip -->
geometry until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them. Nothing replaced them, so
when a figure still does not read well after `pin`, the moves left are the
ones already on the ladder — `rank` to state which elements are peers,
declaration order, `flow` to set the reading axis, and `pin` itself
— plus the structural answers in §8: an explicit relay node for a dense
bundle, a muting `class` for edges that should recede, or splitting the figure
and joining the halves with `external` endpoints. Edges themselves are routed
by the engine and are not authorable. If what you actually need is elbow
routing under per-edge control, that need is recorded, not dismissed: core §9
**`EDGE-IDENTITY-AND-GEOMETRY`**. Say so in a comment and move on; do not reach for geometry that
would only encode it in coordinates.

**Hand geometry was losing to auto layout more often than it was winning —
which is why removing the rung cost less than it looks.** Measured on `tools/layout-lint.js` (lower
is better) when the three in-repo figures that used the withdrawn constructs
were re-authored without them: `examples/statechart/dhcp-client` went from
**23 to 6**, `examples/reference/experimental/block-experimental` from **4 to
2**, and `examples/showcase/tcp-state-machine` scored **2 either way**. Two of
the three read *better* once the hand-routed edges were handed back to the
engine. Take that as the general expectation before you assume a figure needs
geometry it cannot have.

## 3. Patterns by figure family

Each sketch is minimal and verified against `build-svg.js`. Keywords used:
`flow`, `rank`, `pin` — all from spec §3, all NORMATIVE. That is the whole
arranging vocabulary; no sketch below reaches outside it.

### Sequential pipeline — `flow` + `rank`

```figdown
figdown 0.1 block
title "Packet Pipeline"
node rx  "RX"
node par "Parser"
node pol "Policy"
node tx  "TX"
edge rx -> par
edge par -> pol
edge pol -> tx
flow right
rank rx,par,pol,tx
```

Wrap long chains: one `rank` per stage row, let auto-layout stack the rows.

### Decision flowchart — main path on one axis

```figdown
figdown 0.2 flowchart
terminator start "Start"
decision   check "Header valid?"
process    proc  "Process"
terminator drop  "Drop"
terminator done  "Done"
flowline start -> check
flowline check -[yes]-> proc
flowline check -[no]->  drop
flowline proc  -> done
flow down
rank start,check,proc,done
```

`rank` the mainline; side-exit branches fall perpendicular under auto-layout.

### Hierarchy / layers — one `rank` per layer

```figdown
figdown 0.1 block
group app   "Application"
group net   "Network"
group link  "Link"
node  http  "HTTP"  in=app
node  tcp   "TCP"   in=app
node  ip    "IP"    in=net
node  eth   "Ethernet" in=link
edge http -> tcp
edge tcp  -> ip
edge ip   -> eth
flow down
rank http,tcp
```

Layer labels go in `group` names or node labels, not only in vertical position.

### Topology / spatial — pin the anchors

```figdown
figdown 0.1 topology
node hub  "Core"
node a    "ToR-A"
node b    "ToR-B"
node c    "ToR-C"
edge hub -> a
edge hub -> b
edge hub -> c
layout
pin hub at=(300,200)
pin a   at=(150,80)
pin b   at=(450,80)
pin c   at=(300,360)
```

Pin hub, corners, or geography-defining nodes; let auto-layout fill the rest.

### Dense buses — put the masters on one `rank`

A bus is a fan-in, and a fan-in reads cleanly when everything feeding it shares
a row. State that with `rank`; the convergence then falls out of auto-layout
with no geometry at all.

```figdown
figdown 0.1 block
node cpu "CPU"
node mem "DRAM"
node dma "DMA"
node bus "Bus"
edge cpu -> bus
edge mem -> bus
edge dma -> bus
flow down
rank cpu,mem,dma
```

This sketch has no layout zone and lints at 0. Edge geometry itself is not
authorable — `routing` and `path` were withdrawn (`EDGE-GEOMETRY-CONSTRUCTS`) — so if
the fan-in is dense enough that one `rank` does not settle it, the working
answers are structural and live in §8 (*Dense fan-in and fan-out*): an
explicit relay node, or a `class` that mutes the bundle so it recedes. The
unserved part of this need — orthogonal routing with per-edge control — is
core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**.

## 4. Two-level pins (groups as layout modules)

Spec §3 (`PIN-COORDINATE-SCOPE`): a **pinned group** anchors its local origin in canvas px; a
**pinned member** is group-local. Moving a group is one edit (`pin g at=…`)
and never disturbs another group. Use groups as layout modules for figures
with independent spatial regions.

```figdown
group ingress "Ingress Pipeline"
node  rx  "RX"    in=ingress
node  par "Parse" in=ingress
group egress  "Egress Pipeline"
node  sch "Sched" in=egress
node  tx  "TX"    in=egress
layout
pin ingress at=(50,100)
pin rx      at=(0,0)
pin par     at=(120,0)
pin egress  at=(50,250)
pin sch     at=(0,0)
pin tx      at=(120,0)
```

## 5. The iteration loop for agents

```
author semantics
  → build:  node tools/build-svg.js X.fd
  → judge:  eyeball + node tools/layout-lint.js X.fd   (6 metrics; --max-score gate)
  → if not clear: add ONE rung (§2) and repeat
  → stop when it reads well
```

Before committing layout lines: `node tools/strip-check.js X.fd` — flags nodes whose only relationship to the rest of the figure is geometric (`GUI-WRITEBACK-STRUCTURE` strip test).

**Over-pinning warning (`LAYOUT-STABILITY`).** Every `pin` is a promise future edits must
keep. Pin only the elements whose position IS the message (the hub of a star,
the corners of a geographic map). Auto-layout keeps improving; engine-backlog
items will lift rung-0 quality without manual pins needing updates.

## 6. When not to fight the layout

If semantics are complete and the figure is legible, ship it. Visual difference
from the original is not semantic loss (`MEANING-RECOVERY-SOURCE`): the figure states the same
relationships regardless of where the hub sits on the canvas. Reserve layout
effort for figures where **arrangement carries meaning** — where a reader
draws a different conclusion from a different arrangement.

**A cyclic figure is the exception — it is not a place to stop.** A back-edge
in a retry loop (a `no` branch returning to an earlier step) is structural: no
*low* rung of the ladder removes it, and the crossing count is the same with or
without `flow down`. This guide used to read that as a legitimate stopping
point, on the reasoning that the graph encodes a cycle and the lint score is
only reflecting it. Half of that still stands and half of it was an excuse. A
lint score is not the goal — that part is true, and §7 shows a pair where lint
gets *worse* while the figure gets far better. But "the metric is not the goal"
is not a licence to ship a figure a reader cannot follow, and that is what the
old advice amounted to. Measured on a production corpus of 91 documents, the
flowcharts containing a cycle needed manual layout **18 times more often** than
the acyclic ones (§8) — which is what "the ladder does not help here" looks
like at scale. When the graph has a cycle, go to §9 and arrange it: explicit
arrangement is the expected cost of a cyclic figure, not a workaround for a
defect.

## 7. Before / after: the same semantics, different layout zones

The first two entries are pairs, byte-identical in the content zone. The third is the counter-case: no pair, because the fix was not in the layout zone at all. In both pairs the **tuned** side is the top-level example itself (`examples/evpn-fabric.fd`, `examples/srl-evpn-irb.fd`) — only the *auto* variant needs its own file, since the tuned figure is the one the corpus already ships. 0.1 removed the duplicate copies that used to sit under `layout-compare/`; they were byte-identical to the originals and taught nothing a second time. Score = `cross×2 + thru×3 + novlp×3 + lblcol×2 + coinc×2`.

**Lint scores are a smoke alarm, not a judge.** The srl-evpn-irb pair below shows lint getting *worse* (ink/e 109→117) while the figure becomes dramatically more readable — because the metrics do not measure group containment, overlap, or reading order. Always look at the render; the ladder ends when a human can read it. One variant of that example scored better on lint but had lost its column alignment — and the alignment was the peer signal; only looking at the render caught it.

### Leaf-spine fabric — `+flow down +rank sp1 sp2 +rank lf1 lf2 lf3`

Eight-node VXLAN/EVPN topology. Auto-layout scatters spines and leaves; three semantic directives align them into clear tiers. Lint score is the same; edge length halves (144→77 ink/e).

| variant | cross | ink/e | score |
|---------|-------|-------|-------|
| auto    | 3 | 144 | 6 |
| `+flow +rank` | 3 | 77 | 6 |

[auto .fd](../examples/layout-compare/evpn-fabric-auto.fd) · [auto .svg](../examples/layout-compare/evpn-fabric-auto.svg) · [tuned .fd](../examples/evpn-fabric.fd) · [tuned .svg](../examples/evpn-fabric.svg)

### srl-evpn-irb — two-level pins + groups (20 layout lines)

Sixteen-node EVPN-VXLAN IRB figure with three leaf groups. Auto-layout lets group boxes overlap each other and member nodes escape their frames, producing a tall chaotic column (691×955 px). The tuned version pins each group as a layout module (spec §3 `PIN-COORDINATE-SCOPE`: a pinned group anchors its local origin in canvas px; members are group-local), giving three clean leaf boxes under the fabric overlay (1228×656 px). Aspect ratio flips from portrait to landscape. Lint ink/e gets *worse* (109→117) while the figure becomes unambiguous — the metrics do not measure group containment or overlap.

| variant | cross | novlp | ink/e | score |
|---------|-------|-------|-------|-------|
| auto    | 0 | 1 | 109 | 3 |
| `+pin` ×20 | 0 | 1 | 117 | 3 |

[auto .fd](../examples/layout-compare/srl-evpn-irb-auto.fd) · [auto .svg](../examples/layout-compare/srl-evpn-irb-auto.svg) · [tuned .fd](../examples/srl-evpn-irb.fd) · [tuned .svg](../examples/srl-evpn-irb.svg)

### vxlan-encap — when layout tuning is the wrong fix (0 layout lines)

This one used to be listed here as a third before/after pair, and that was the
mistake. The packet-header figure was authored as fifteen free `node`s; auto-layout
stacked them into a 415×1704 px vertical column, so 19 `pin` lines were added to
lay the fields out left to right in byte order (896×736 px). The render looked
right — and the document was broken, because **the byte order existed only in the
`pin` x-coordinates**. Nothing in the content zone said that Outer MAC precedes
Outer IP precedes UDP precedes VXLAN, or where the original L2 frame was inserted.
The pins were not describing an arrangement; they were the only copy of the
meaning (`MEANING-RECOVERY-SOURCE`: meaning must never live in geometry).

The fix was not a better rung on the ladder — it was **a different construct**. Each
frame is now a single-row `table` whose cell order *is* the on-the-wire order, with
a header-tier span for the nested original frame and `class` marks carrying the
field roles ([vxlan-encap.fd](../examples/vxlan-encap.fd)). The document now needs
**zero** `pin`/`flow`/`rank` lines and renders at 1036×650 px.

**The diagnostic — run the `GUI-WRITEBACK-STRUCTURE` strip test before you tune.** Delete every
`flow`/`rank`/`pin` line and the bare `layout`, then re-read
what is left. If a fact you thought the figure stated is now unrecoverable — order,
adjacency, containment, grouping — you have a semantics bug, and adding layout lines
only hides it. Fix the construct: ordered sequences belong in `table`, `bitfield`, or
explicit `edge` chains; containment belongs in `group` or a header span; categories
belong in `class`. Reach for the ladder in §2 only once the stripped document already
says everything the figure says.

### Failure mode 4 — the render implies a relation the .fd never states

The first three modes park meaning where a reader may ignore it (geometry, presentation,
absence). This one is the mirror image: the `.fd` is correct but the picture asserts
something extra to a human. Worked case from a private-VLAN example in this repo: the
promiscuous port was drawn left with edges fanning out, so it read as upstream parent.
In a private VLAN it is a peer port; the fix was symmetry — four equal-size peer frames,
promiscuous port centred, router as `external` (the only genuinely external thing).

`MEANING-RECOVERY-SOURCE` protects the agent, who reads syntax; the human reads geometry. A layout that
implies false structure misleads exactly the reader the render exists for. No tool
catches this — the author must look. Peers should look like peers: equal size and
shared alignment carry peerhood without any syntax.

**Fidelity checklist** (§5 loop asks "is it readable?"; these ask "is it honest?"):

1. **Did I leave anything out?** Is any meaning riding on coordinates, on a stroke or
   colour with no class, or on an edge I did not draw? (`tools/strip-check.js` catches
   the first; the other two need your eyes.)
2. **Did I add anything?** Does the arrangement imply a hierarchy, direction, sequence,
   or grouping the content zone never states? Left-to-right and top-to-bottom both read
   as precedence — check that you meant it.
3. **Do the edges land where I meant?** An edge piercing a container frame reads as
   targeting the container; a label crossed by a stroke reads as belonging to it.

## 8. Cautions from a production corpus

A five-way review rendered and inspected all 78 documents of a production
corpus; below is what authors had to discover by trial and error, most-hit
first. Expressing-side findings are in [expressing.md](expressing.md).

**Group captions must be short.** Group rect and canvas are sized from member
geometry only, so a caption wider than its members is clipped off the *canvas*
— not merely outside the box, outside the image. Measured: two 35px members, a
caption needing 368px, canvas 78px wide, caption cut mid-word. Until the
renderer accounts for caption width, keep a caption no wider than its widest
member row and put the detail in prose. Most-worked-around defect in the corpus.

**Pick the direction for the figure's shape** (extends §2). A short linear
pipeline — four to six stages, one terminal branch — reads better as
`flow right` (measured 672×156 px) than as the tall narrow column `flow down`
gives it (241×396 px). Reverse failure: a very wide multi-line outcome node
pushes the canvas past a usable aspect ratio; wrap the label with `\n`
(860×173 → 284×205 px) or move the detail into a companion `table`.

**A cycle costs about eighteen times more layout work — budget for it.**
Measured over a production corpus of 91 documents: `flowchart` is the largest
genre in it (43 documents; then block 21, table 8, bitfield 8, timing 6, topology
5). Splitting those 43 by whether the graph contains a cycle gives 32 acyclic
and 11 cyclic — and the two behave nothing alike. Documents needing manual
layout at all: **1 of 32 acyclic (3%)** against **6 of 11 cyclic (55%)**. The
worst cases were not marginal either: 40 edges answered with 26 `pin`s; 19
edges with 12 `pin`s; 9 edges with 9 `pin`s, i.e. entirely hand-placed. Read
this as a planning number, not a complaint: an acyclic flow is almost always a
rung-1 figure, and a cyclic one should be scheduled as a figure you will
arrange. §9 is how.

(The measurement was taken while `path` still existed, and part of the manual
layout it counted was waypoint geometry — 7 `path` lines on the 40-edge
figure, 6 on the 19-edge one, and a hand-written waypoint on a five-node,
six-edge state machine. Those lines have **no successor spelling**: what such a figure gets today is `rank`, `flow`, declaration order
and `pin`, and its edges routed by the engine. The share of *cyclic* figures
that need deliberate arranging is unaffected — the ratio is what this
paragraph is for.)

**Long back-edges and bypasses read as detours — say what they are.** An edge
that skips several ranks is routed through the gaps and keeps a bend only
where something is actually in the way (`EDGE-BEND-RETENTION` — it used to pick up
a bend per rank crossed and read as a staircase); but however clean the line,
a reader who cannot tell *why* a line is out there reads it as noise. Until 0.1 the taught answer was a hand-written waypoint; `path` is withdrawn
and there is no replacement, so the answer moves into the content zone, where
it arguably belonged: name the bypass so the detour is legible as a bypass.

```figdown
node s1 "Stage 1"
node s6 "Stage 6"
class bypass "Fast path — skips the intermediate stages" style=dashed stroke=#d97706
edge s1 -[fast path]-> s6 class=bypass
flow down
```

That is the `PRESENTATION-AS-MEANING-CARRIER` discipline: the fact a human was meant to read off the
geometry is now stated in text, where the agent reader gets it too. If the
detour is still unreadable, the figure is probably too tall — shorten the span
(split it, per *When a figure is too big* below) rather than trying to place
the line. Pulling a long edge into a channel of your choosing is exactly what
core §9 **`EDGE-IDENTITY-AND-GEOMETRY`** records as unserved.

**Dense fan-in and fan-out.** Past about five edges between one node and one
rank, the bundle renders as parallel runs with stacked labels (seven terminal
targets measured 1079×156 px). Two options today: an explicit relay node, or a
class that mutes the bundle so it recedes — `class discard "Discard reasons"
stroke=#b8b6b0 style=dashed` on the terminal-bound edges, used to good effect
by a corpus author. An edge is a line with no interior, so `stroke=` is the
channel that paints it; `fill=` paints only members that have an interior, and
a `fill=`-only class joined by an edge is a line error (spec/core.md §5,
`INTERIOR-LESS-ELEMENT-PAINT`/`CLASS-PAINT-REQUIREMENT`).

**Use `rank` for a lateral bypass, not for the mainline.** Under `flow down` a
`rank` shares a *row*, so ranking the main chain flattens the figure sideways.
`rank hit,punt` lifts a decision's side exit onto the decision's own row and
leaves the mainline vertical.

**Two independent sub-diagrams side by side** — the `group` + `pin` pattern of
§4. Two state machines, each a group pinned in canvas px with group-local
members, render as two clean columns in one figure (verified in the corpus).
Without it authors split into two figures unnecessarily.

**When a figure is too big.** Around twenty nodes with a high crossing count a
single figure stops being readable — guidance, not a rule. Split it and join
the halves with `external` endpoints naming each other: `external cont
"continues in Figure 2"` / `external cont "continued from Figure 1"`. An
`external` states only that the edge crosses the figure's edge, so neither half
implies a missing participant.

## 9. Cyclic flows: why the ladder stalls, and what to do instead

Everything above assumes the graph flows one way. When it does not — a retry
loop, a state machine, a token rotation, a protocol that returns to an earlier
step — the ladder's low rungs stop paying off, and the measurement in §8 says
so: 55% of cyclic flowcharts in the production corpus needed manual layout
against 3% of acyclic ones.

### Why: two layout strategies, not two qualities of one

The auto-layout is a **layered** algorithm (Sugiyama family). It assigns each
node a rank, orders nodes within ranks, and routes edges downhill. A cycle
cannot be ranked, so the algorithm does the standard thing: it picks a back
edge, reverses it for the layering pass, and routes the real edge around the
figure's margin afterwards.

Humans draw the same graph differently. A cycle is drawn as a **ring**, with
the loop-backs in a channel outside the node column. These are two *different
strategies*, not a good and a bad version of one strategy — which is why tuning
the back-edge channel cannot converge on the human result. Nesting the channel
better (backlog item #4) makes a layered drawing tidier; it never turns it into
a ring.

There is a second cause, and it is in the language rather than the engine.
Every flowchart connector today is a plain `flowline` (spelled `edge` before 0.2, `GENRE-CONNECTOR-SPELLING` — the rename gave the genre its own word, not a role). The
renderer cannot tell the mainline from an exception branch from a retry loop — and those distinctions
are *exactly* what human flowchart routing conventions are made of.
0.1 (`FLOWCHART-ROLE-KEYWORDS`) gave the genre role vocabulary for its NODES — `process`,
`decision`, `terminator` — which is why the sketches below use it, and the
renderer already consults it (a short branch marker sits near its
`decision`, not near any diamond). **CONNECTOR roles are still missing**
(`mainline` / `exception` / `loop-back`, recorded in `LOGIC-FLOWCHART-GENRE-SCOPE` and excluded from
the 0.1 tranche), so for routing the author still has to supply by
arrangement what the source cannot state. `class main/retry/fail`, used
below, is the taught interim.

### The four conventions a human reader expects

1. **The mainline is a spine.** The path a successful run takes runs straight
   along the reading axis, unbroken, with nothing else competing for it.
2. **Exception branches leave on one side.** All of them, consistently — errors
   right, or errors left, but not both. A reader learns the side once.
3. **Loop-backs run outside the node column.** A retry or return edge belongs
   in a channel beside the figure, not threaded back between the boxes.
4. **A branch re-enters the spine at a merge point**, from the side — never by
   crossing it.

### The recipe with today's engine

- **`rank` holds the spine** — by pushing what is *not* spine off it. Under
  `flow down` a `rank` shares a row, so `rank <decision>,<its side exit>` lifts
  the exception onto the decision's own row and leaves the mainline vertical
  (§8). Ranking the main chain does the opposite: it flattens the figure
  sideways.
- **`pin` states the ring** when the figure is genuinely cyclic — a rotation, a
  lifecycle with no entry or exit. Do not try to coax a ring out of a layered
  pass; write it.
- **`class` names the loop-back** — you cannot place the return edge, so make
  it identifiable instead. Convention 3 (loop-backs run outside the node
  column) is a routing convention, and routing is the engine's: `path` was the
  lever for it and it is gone (`EDGE-GEOMETRY-CONSTRUCTS`), with the requirement filed
  at core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**. What is left is arrangement — pin the ring so the
  return has an outer channel by construction — and naming, so a reader who
  sees the line at the margin knows what it is.

Worked case, a bounded retry. The spine is `start → send → ok → done`, and the
two decisions' side exits are ranked onto their own rows so the spine keeps
the axis. Note that it needs **no layout zone at all** — with the spine
declared and the exits ranked off it, the figure lints at 0:

```figdown
figdown 0.2 flowchart
title "Session establishment with bounded retry"

class main  "Mainline — the path a successful call takes" stroke=#555
class retry "Retry — returns to an earlier step" style=dashed stroke=#d97706
class fail  "Failure exit" style=dashed stroke=#dc2626

terminator start "Start"
process    send  "Send request"
decision   ok    "Response OK?"
decision   cnt   "Retries left?"
terminator done  "Established"
terminator give  "Give up"

flow down
rank ok,cnt

flowline start -> send        class=main
flowline send  -> ok          class=main
flowline ok  -[yes]-> done    class=main
flowline ok  -[no]->  cnt     class=fail
flowline cnt -[yes]-> send    class=retry
flowline cnt -[no]->  give    class=fail
```

Note what the `class` declarations are doing: they are not decoration and not a
substitute for the missing role vocabulary either, but they do put "this edge
is the retry" in the text, where a reader — and the next author — can find it.
That is the `PRESENTATION-AS-MEANING-CARRIER` discipline applied to a cycle, and it is also
the only thing that distinguishes the retry edge at all: the figure used to
carry one `path` line pulling that edge into a channel at x=560, and when the
construct was withdrawn the line went with it. The `class` survived the
change; the geometry did not. That is the general lesson — what you write in
the content zone keeps working.

Worked case, a genuine ring. Here the cycle *is* the figure, so the arrangement
is stated outright rather than negotiated with the layout engine:

```figdown
figdown 0.1 block
title "Token rotation — the cycle IS the figure"

node s1 "Station 1" shape=rounded
node s2 "Station 2" shape=rounded
node s3 "Station 3" shape=rounded
node s4 "Station 4" shape=rounded

edge s1 -[token]-> s2
edge s2 -[token]-> s3
edge s3 -[token]-> s4
edge s4 -[token]-> s1

layout
pin s1 at=(280,20)
pin s2 at=(520,190)
pin s3 at=(280,360)
pin s4 at=(40,190)
```

### The honest expectation

For a cyclic figure, explicit arrangement is the **expected authoring cost**,
not a failure to be worked around and not a sign you have used the language
wrong. The over-pinning warning in §5 still applies to acyclic figures, where
auto-layout keeps improving and a pin is a promise with no payoff. It applies
much more weakly here: a ring you pinned is a ring that stays a ring. What is
*not* acceptable is the third option — shipping the layered drawing with a
loop-back threaded through the node column because the ladder ran out.

Cycle-aware layout (detect the strongly connected components, arrange each as a
ring with loop-backs in an outer channel) is on the engine backlog. Until it
lands, this section is the workaround, and it is a legitimate one.
