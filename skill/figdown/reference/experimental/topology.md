# Genre `topology` — EXPERIMENTAL / EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x`. A portable figure uses `block` instead — the
vocabulary is identical, the defaults are identical, and `block` is inside
the compatibility promise.

Load `../scene.md` first. `topology` adds **no keyword of its own and changes
no default**: it is the scene vocabulary under a name that says the figure is
a network of peers rather than a pipeline of stages. What it carries is the
intent — which matters to a reader and to nothing else.

```figdown
figdown 0.1 topology
title "Leaf-spine fabric"
flow right
node s1 "Spine 1"
node s2 "Spine 2"
group pod "Pod A"
node l1 "Leaf 1" in=pod
node l2 "Leaf 2" in=pod
external wan "To WAN"
edge l1 -- s1
edge l1 -- s2
edge l2 -- s1
edge l2 -- s2
edge s1 -- wan
class uplink "40G uplink" stroke=#0284c7
edge l2 -- s2 class=uplink
```

The constructs most topology figures reach for next — link bundles for LAGs
and ECMP sets, overlay planes for tunnels, markers and zone bands — are in
`constructs.md`, and every one of them is EXPERIMENTAL too.

The two mistakes this genre invites are both covered where they are owned:
a shared medium modelled as a mesh (`../scene.md`, "A shared bus is not a
star") and geography carried by the layout zone alone (`../layout.md`).
