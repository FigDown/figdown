# FigDown Example Gallery

> Every figure below is an SVG generated deterministically from the
> `.fd` text file next to it (`node tools/build-svg.js examples/`).
> Each SVG embeds its own source and a SHA-256 of it — open one in a
> text editor to see the "one source, two readers" idea in action.
>
> Sections mirror the template families, ordered by their share in the
> figure-type census ([census.md](../census.md)).
>
> 繁體中文版：[index.zh-tw.md](index.zh-tw.md)

## Block & architecture (census #1)

### VXLAN encapsulation — before/after frames  — [source](vxlan-encap.fd)
Classical frame vs. VXLAN frame (original L2 frame nested), the
VLAN-to-VNI arrow, and overhead/fact tables.

![VXLAN encapsulation](vxlan-encap.svg)

### Partition map — pool with global thresholds  — [source](partition-map.fd)
The same block constructs plus `line`/`fill` markers cover buffer
quotas, memory maps, and watermark charts.

![Partition map](partition-map.svg)

## Topology (with semantic annotations)

### VXLAN/EVPN Leaf-Spine Fabric  — [source](evpn-fabric.fd)
One source file: the topology (with a VXLAN-tunnel overlay layer) plus
the VNI mapping and fabric-plane tables that real design docs put next
to it.

![EVPN fabric](evpn-fabric.svg)

### EVPN-VXLAN IRB — vendor-style leaves with VRF/BD detail  — [source](srl-evpn-irb.fd)
Semantic recreation of a vendor doc figure: fabric cloud, leaf boxes
holding IP-VRF badges and dashed bridge domains, port labels on links,
a `bundle` multi-homing ring, multi-line host captions.

![EVPN-VXLAN IRB](srl-evpn-irb.svg)

## Protocol headers (bitfield, census #2)

### Ethernet II (+ optional 802.1Q)  — [source](ethernet-ii.fd)
![Ethernet II frame header](ethernet-ii.svg)

### IPv4 — RFC 791  — [source](ipv4.fd)
![IPv4 header](ipv4.svg)

### TCP — RFC 9293  — [source](tcp.fd)
![TCP header](tcp.svg)

### UDP — RFC 768  — [source](udp.fd)
![UDP header](udp.svg)

### VXLAN — RFC 7348  — [source](vxlan.fd)
![VXLAN header](vxlan.svg)

## Tables & data (census #3)

### Queue-occupancy heatmap  — [source](queue-heatmap.fd)
One table, two projections: a heatmap (per-cell marks) and a `plot`
bars3d chart with a threshold plane — rows→X, columns→Y, values→Z.

![Queue heatmap](queue-heatmap.svg)

## Just for fun

### Rainbow rings — [source](rainbow.fd)
No `layer` directives at all: line order is the layer. Seven concentric
`cloud` nodes; later lines paint on top.

![Rainbow rings](rainbow.svg)

---

More waves per the [gallery plan](../gallery-plan.md): the full header
set (E1), protocol negotiation sequences (E2), algorithm & data-structure
figures (E3), and math-annotated figures (E4).
