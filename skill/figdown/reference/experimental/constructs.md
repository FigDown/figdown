# EXPERIMENTAL / EXPERIMENTAL constructs

Everything in this file is **outside the v0.1 conformance surface and outside
the compatibility promise**. The engine accepts it and your document keeps
working, but it may change or be withdrawn in a later `0.x`. The parser emits
no warning, so a line that parses tells you nothing.

Use these when the figure genuinely needs them. If the figure must be
portable, do not — and if you use one anyway, say so beside the figure.

## Markers and zones — `threshold`, `band`

```figdown
figdown 0.1 block
group pool "Storage pool"
node used "In use" in=pool
threshold "High watermark = stop writes" in=pool offset=80%
threshold "Low watermark = resume writes" in=pool offset=45%
band "Reserved" 15% in=pool fill=#fee2e2
band "Shared quota" 20..70% in=pool extend=down
```

- `threshold` needs a quoted label **and** `offset=<0..100>%`, both mandatory
  — the `%` included. There is no `value=` and no `ref=`.
- `band` needs a quoted label **first**, then either one percentage (a size)
  or an explicit `<a>..<b>%` range. `..` is the language's ONE range
  separator; the hyphen form is a line error. `extend=up|down|left|right`, and `up`
  is the default.
- The label is the knowledge in both cases. `offset=` is a fraction of the
  target's rendered extent, **not a value of any quantity** — the target
  declares no scale, so there is no conversion. Put the number in the label
  or it is not in the document.
- Both attach to a node or a group via `in=`.
- **Attach at the scope the fact belongs to.** A limit shared by everything in
  a group is one group-level marker; a fact true of one element attaches to
  that element. The renderer may draw the two the same way — the difference is
  in the text, and the text is the knowledge.

## Link bundles — `bundle`

```figdown
figdown 0.1 block
node leaf "Leaf"
node s1 "Spine 1"
node s2 "Spine 2"
edge leaf -- s1
edge leaf -- s2
bundle ecmp "ECMP uplink set (2 × 100G)" leaf--s1,leaf--s2
```

Names a set of already-declared edges as one logical link. The dashed ring is
drawn for you, and the member list is one comma-delimited token. Each member
must name an edge that already exists and is unambiguous — v0.1 has no way to
address one of two parallel edges between the same pair, so a bundle over
parallel links cannot be spelled.

## Overlay planes — `plane`, `plane=`

```figdown
figdown 0.1 block
plane overlay "VXLAN tunnels" z-index=2
node l1 "Leaf 1"
node l2 "Leaf 2"
node s1 "Spine" plane=overlay
edge l1 <-> l2 plane=overlay
```

The **label is the knowledge** — "VXLAN tunnels" is what a reader keeps, not
the paint order. Every document has an implicit `base` plane at `z-index=0`,
and every element reports it unless it names another. An omitted `z-index=`
takes the plane's 1-based declaration index. `z-index=` reorders the
annotation pass only — edges, bundle rings, thresholds and bands. `plane=` is
legal on a node, group, external endpoint, edge, class, bundle, threshold and
band.

## Charts from a table — `chart`, `type=`

```figdown
figdown 0.1 table
table t "Throughput"
| Port | Gbps |
|------|------|
| 1    | 25   |
| 2    | 40   |
chart t type=bar3d
```

Draws bars from a table's numeric cells. `type=` is the only option key and
`bar3d` is its only value. For anything a chart library would do better, keep
the raster and put the numbers in a table (`../transcribe.md`).
