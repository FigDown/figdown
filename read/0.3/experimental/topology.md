# Genre `topology` — EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x` without a migration entry. A portable figure uses
`block` instead, which is inside the compatibility promise.

Use `topology` when the figure is a **network of devices and the links
between them** — fabrics, overlays, access layers, peering diagrams. The
nodes are devices or endpoints and the edges are physical or logical links,
not dataflow steps. That intent is what the genre carries; it matters to a
reader and to nothing else.

**This file is `topology`'s whole vocabulary.** Load it and `../layout.md`
and you can author in this genre; do not load another genre's file, because
another genre's declaration of a word is not authority for this one. Words
`topology` does **not** declare — and there are several a `block` author
would reach for — are line errors that say so and give the ground.

## The vocabulary, in one figure

```figdown
figdown 0.1 topology
title "Leaf-spine fabric"

flow right                       # reading direction; ONE per document,
                                 # before the nodes

node s1 "Spine 1"
node s2 "Spine 2"

group pod "Pod A" gap=0          # a container; gap=0 packs its members
node l1 "Leaf 1" in=pod          # flush against each other. The id is
node l2 "Leaf 2" in=pod          # required and exists only so other lines
                                 # can name it

node fw "Firewall" shape=rounded
node store "Config store" shape=cylinder style=solid

external wan "To WAN"            # outside the figure. NEVER drawn as a
                                 # shape — the link simply ends open there

edge l1 -- s1                    # ops: ->  <-  --  <->
edge l1 -- s2
edge l2 -- s1
edge l2 -- s2
edge s1 -> wan                   # arrow points at `wan`
edge wan <- s2
edge fw <-> store
edge l1 -[lacp]-> fw             # on-line label splits the operator
edge l2 [ge-0/0/1] -- [xe-0/0/0] fw   # endpoint labels: ports, roles
edge s1 -- s2 style=dotted       # spines not cabled to each other

rank l1,l2                       # pull peers onto one row/column. ONE
                                 # comma-delimited token, no spaces

class uplink "Uplink, 40G" stroke=#0284c7
edge l2 -- s2 class=uplink

bundle lag1 "LAG to the leaf pair" l1--s1,l2--s1
```

`flow` takes `flow right|down|left|up` — one of the four, once per document.

Values from a fixed list are written **bare**, never quoted: `shape=box`,
`style=dashed`, `flow down`, `gap=0`. So are ids. Labels are the opposite
and always take quotes.

`shape=` is **pure geometry, no domain nouns** — `shape=box` (the default),
`shape=rounded`, `shape=circle`, `shape=ellipse`, `shape=diamond`,
`shape=cylinder`, and nothing else. There is no router symbol, no switch
symbol and no cloud: a cloud in a source drawing is an ellipse or a group,
with what it *is* — "the internet", "the transit provider" — written in the
label. `style=` takes `style=solid`, `style=dashed` or `style=dotted`.

`class` declares what a colour **means** and is the only way to make colour
carry meaning; a class an edge joins MUST declare `stroke=` or `style=`, and
a `fill=`-only class joined by an edge is an error naming `stroke=`. `fill=`
and `stroke=` are legal on any element, but an `edge` has no interior, so
`fill=` on one is an error.

Endpoint labels nest (`edge a [xe-0/0/0:1] -- b`); quote them when they hold
a line break or an unbalanced bracket (`edge a ["slot\n1/1"] -- b`). A `#`
inside a bracket label is ordinary text and needs no quotes —
`edge a -[hop #1]-> b` — because `[ ]` is a verbatim region.

Under `figdown 0.3` any of these lines may carry `note=`, a drawn aside in
prose: `node s1 "Spine 1" note="…"`, `edge l1 -- s1 note="…"`,
`title "Fabric" note="…"`. It is never parsable and never where a structural
fact lives.

## `group` is not a multicast group

`group` here is a **container**: a box drawn round its members, one nesting
level deep — a pod, a rack, a site, a tenant. It is not IGMP or MLD
membership, and `group g "224.0.0.5"` does not say what a reader of that
address expects.

The spelling stays anyway, because in this domain every synonym is more
taken than the word is: `zone` belongs to DNS and to firewalls, `cluster` to
route reflection (RFC 4456), `domain` to inter-domain traffic engineering
(RFC 7926), `area` to OSPF, `site` to EVPN. Trading a soft collision for a
hard one is a bad trade — and this collision **is** soft, because the drawing
contradicts the wrong reading: a multicast group is never drawn as a box
round its members.

## `external` is not an external route

`external` is an **out-of-figure endpoint**: something this figure talks to
but does not describe. It is never drawn, it takes **no option key at all**,
and the link to it simply ends open.

It is not an external route — not an OSPF Type 5 or Type 7 LSA, not an eBGP
peer, not "the external interface". Same soft collision, same reason for
keeping the spelling: an `external` is never drawn at all, so a reader who
starts with the routing sense finds nothing on the page to sustain it. Where
the figure means *the router that faces outside*, that router is a `node`
with a label saying so; `external` is for what the figure leaves out.

## `bundle` — a LAG, an ECMP set, an Ethernet Segment

```figdown
figdown 0.1 topology
node leaf "Leaf"
node s1 "Spine 1"
node s2 "Spine 2"
edge leaf -- s1
edge leaf -- s2
bundle ecmp "ECMP uplink set, 2 × 100G" leaf--s1,leaf--s2
```

A **link bundle**: a set of parallel links between the same pair of devices
operated as one logical link. Its referents are the ones this domain already
names — a link aggregation group (IEEE 802.1AX), an equal-cost multipath
set, an EVPN Ethernet Segment — and the ring drawn round the member links is
the same thing the domain means. The domain reading and the drawn reading
are one reading; this is the cell where the word and the referent agree, and
it is why `topology` declares `bundle` and the general-purpose genre has no
use for it.

`bundle` is EXPERIMENTAL even inside this experimental genre. It is spelled
`bundle` and not after the standard's own noun deliberately: *aggregation*
is right for a link aggregation group and false for an equal-cost multipath
set and for an Ethernet Segment, so the standard's word cannot be taken
whole and an umbrella spelling is the honest one.

- The member list is ONE comma-delimited token, no spaces.
- Each member must name an edge that **already exists** and is unambiguous.
  There is no way to address one of two parallel edges between the same
  pair, so a bundle over parallel links cannot be spelled — declare the
  members as distinct edges to distinct peers, as above.
- `bundle` takes `fill=`, `stroke=` and `style=`; the dashed ring is drawn
  for you.

## Two mistakes this genre invites

**A shared medium is not a star.** Flattening a bus, a broadcast segment, a
shared VLAN or a fabric's underlay into point-to-point links changes what the
figure asserts: the shared thing reaches every participant at once. Model it
as one intermediate `node` that fans out.

**Geography is not carried by the layout zone.** If where a device sits is
part of the claim — a site, a rack, a country — say it with a `group` and a
label. Delete every `pin` and the figure must still be the same figure
(`../layout.md`).
