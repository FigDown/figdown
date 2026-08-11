# FigDown Example Gallery

> Every figure below is an SVG generated deterministically from the
> `.fd` text file next to it (`node tools/build-svg.js examples/`).
> Each SVG embeds its own source and a SHA-256 of it — open one in a
> text editor to see the "one source, two readers" idea in action.
>
> Sections mirror the genre families, ordered by their share in the
> figure-type census (census.md).
>
>
> See also the [structure pattern library](patterns/index.md) — generic
> skeletons distilled from a real 774-document corpus.

## Statechart-style trials (planned genre; portable `block` today)

Classic FSMs written in the planned **`statechart` authoring style**
(short labels, `#` multi-line notes, optional companion table). Header is
still `block` until the experimental genre is registered — see
[statechart/index.md](statechart/index.md) and
decisions/registry.md.

## Block & architecture (census #1)

### VXLAN encapsulation — before/after frames  — [source](vxlan-encap.fd)
Classical frame vs. VXLAN frame as single-row tables whose cell order is
the on-the-wire order (original L2 frame nested under a header span), with
the VLAN-to-VNI relation as a shared `class` plus overhead/fact tables.
Zero layout lines — see [guide/layout.md §7](../guide/layout.md#7-before--after-the-same-semantics-different-layout-zones).

![VXLAN encapsulation](vxlan-encap.svg)

### Telemetry export path — the one-document hybrid  — [source](telemetry-export.fd)
The **nested-region `GENRE-COMPOSITION` form** (spec core §4): a `block` scene whose `table`
region and `chart` sit inside the SAME document, with no second `figdown`
header. Compare with `evpn-fabric.fd` and `pvlan-flows.fd`, which use the
multi-section **`MULTI-FIGURE-DOCUMENTS`** form for the same kind of panel — both forms are in the
spec, and until this release only `MULTI-FIGURE-DOCUMENTS` had ever been shown. Also the corpus's only
`chart` on a scene document.

![Telemetry export path](telemetry-export.svg)

### RPF check — a figure that reads right to left  — [source](rpf-check.fd)
Four constructs that had no demonstrator anywhere before this release, gathered
into one small figure: `flow left` (the corpus was `right` and `down` only),
the `\"` escape inside a quoted label, a `#` inside a bracketed edge label
(verbatim since `VERBATIM-REGION-SCOPE`), and a
negative `at=` coordinate.

![RPF check](rpf-check.svg)

### Partition map — pool with global thresholds  — [source](partition-map.fd)
The same block constructs plus `threshold`/`band` markers cover buffer
quotas, memory maps, and watermark charts.

![Partition map](partition-map.svg)

## Topology (with semantic annotations)

### VXLAN/EVPN Leaf-Spine Fabric  — [source](evpn-fabric.fd)
One source file, **multi-section `MULTI-FIGURE-DOCUMENTS`**: a topology scene section plus later
`figdown 0.1 table` sections for the VNI mapping and fabric-plane tables
that real design docs put next to it (one stacked SVG; `GENRE-KEYWORD-ALLOWLIST` per section).

![EVPN fabric](evpn-fabric.svg)

### EVPN-VXLAN IRB — vendor-style leaves with VRF/BD detail  — [source](srl-evpn-irb.fd)
Semantic recreation of a vendor doc figure: fabric overlay, leaf boxes
holding IP-VRF badges and dashed bridge domains, port labels on links,
a `bundle` multi-homing ring, multi-line host captions.

![EVPN-VXLAN IRB](srl-evpn-irb.svg)

### Private VLAN — figure plus rule table  — [source](pvlan-flows.fd)
A worked example of the figure-plus-prose mode
(`COMPLETENESS-DEFINITION` mode 3): one `.fd`, two
complementary halves as **multi-section `MULTI-FIGURE-DOCUMENTS`** (scene section, then
`figdown 0.1 table`) planned as a single deliverable / one stacked SVG.
The figure carries the shape — promiscuous port, two communities, two
isolated ports, permitted flows drawn bidirectionally because VLAN
reachability is symmetric — with the three VLAN types as `class`
declarations, so the meaning is machine-readable on every edge
(`class=vidi`) and the legend strip derives automatically. The
`reach` table section carries what no arrangement of arrows can state:
the PROHIBITIONS in words (an isolated port may not reach another
isolated port, though both sit in VID_I), plus the closed-world
declaration that anything not listed as reachable is denied. Read the
two together; a missing edge is never the argument.
![Private VLAN flows and rules](pvlan-flows.svg)

## Protocol headers (bitfield, census #2)

> **This set was cut from sixteen headers to nine.** Seven of
> them (ARP, BGP, DHCP, Ethernet II, ICMP, ICMPv6, VXLAN, and a second TCP)
> exercised no construct that another header in this list did not already
> exercise; a gallery is a demonstration of CAPABILITY, and a ninth
> `word=32 numbering=msb0` header teaches nothing a reader did not learn from
> the eighth. Each survivor is here for something only it shows:
>
> | Figure | What only it demonstrates |
> |---|---|
> | `udp` | the 9-line minimum — a complete, valid figure with nothing optional in it |
> | `ipv6` | a complete fixed-length header, and a 128-bit field spanning four rows as ONE box |
> | `dns` | `word=16`, the compact `name:width` field form, and `break` |
> | `ipv4` | `present=""` (written empty) beside `present="IHL > 5"` |
> | `gre` | the only `field ""`; conditional presence plus a `class` for the co-dependency |
> | `mpls` | `break` as a structural separator (cited by name in spec/core §12.7) |
> | `quic` | multi-word structure |
> | `srh` | `index=` with an opaque range end, two blocks, `word=8` |
> | `showcase/tcp-header` | the long and compact flag forms side by side, `class=varword`, `*` |

### IPv4 — RFC 791  — [source](ipv4.fd)
The variable-length tail: Options is `*` (length not in the document) plus
`present="IHL > 5"` (absent when IHL = 5). `*` always runs to the end of its row, so
Padding is drawn on the next row rather than beside Options as RFC 791
draws it.
![IPv4 header](ipv4.svg)

### UDP — RFC 768  — [source](udp.fd)
![UDP header](udp.svg)

### IPv6 — RFC 8200  — [source](ipv6.fd)
Each 128-bit address is ONE field spanning four 32-bit rows, and it draws as
one box with no rules between them and its name written once — RFC 8200 §3's
own `+   +` convention. An exact transcription of that section:
4+8+20 + 16+8+8 + 128 + 128 = the fixed 40 octets.
![IPv6 header](ipv6.svg)

### GRE — RFC 2784/2890  — [source](gre.fd)
The conditional-presence case: Checksum and Reserved1 present iff C = 1,
Key iff K = 1, Sequence Number iff S = 1. `present="C = 1"` etc. on each
field states and draws that field's own condition; the paired fields also
share a `class` (`ifc`/`ifk`/`ifs`) stating the CO-DEPENDENCY between them,
because presence cannot reference another field by name.
![GRE header](gre.svg)

### IPv6 Segment Routing Header — RFC 8754  — [source](srh.fd)
The variable-count repeating case, and the first adopter of `index=`. RFC
8754 §2 draws Segment List[0], a literal `...` row, then Segment List[n] —
(Last Entry + 1) elements of 128 bits each. The figure declares the element
**once**, with `index="0..Last Entry"`, and the engine derives that whole
drawing — first element, elision, last element, each carrying its index — from
that one key. What is left open is the count
alone: `Last Entry` is the name of a field this language cannot resolve, so
the run is indeterminate — reached now from syntax rather than from reading a
label. The header comment says exactly what that still costs a reader.
![IPv6 Segment Routing Header](srh.svg)

### MPLS label stack — RFC 3032  — [source](mpls.fd)
![MPLS label stack](mpls.svg)

### DNS message header — RFC 1035  — [source](dns.fd)
![DNS header](dns.svg)

### QUIC long header — RFC 9000  — [source](quic.fd)
![QUIC long header](quic.svg)

## Tables & data (census #3)

### Queue-occupancy heatmap  — [source](queue-heatmap.fd)
One table, two projections: a heatmap (per-cell marks) and a `chart`
bar3d projection — rows→X, columns→Y, values→Z.

![Queue heatmap](queue-heatmap.svg)

## Procedures (flowchart — EXPERIMENTAL genre)

### Packet ingress path — the role vocabulary at work  — [source](packet-ingress.fd)
The flowchart role keywords (`process` / `decision` / `terminator`) on a subject that needs all of them: a receive → parse →
**five-way EtherType dispatch** → per-protocol check → drop/forward path,
with the VLAN branch looping back so a double-tagged frame unwinds. The
dispatch is deliberately drawn as an `ellipse` — the layout choice real
corpus figures make, because an ellipse is narrower than a diamond — which
under the old `node … shape=` spelling would have erased the fact that it is
a branch point at all. Here the word carries it and the drawing is free.

![Packet ingress path](packet-ingress.svg)

## Algorithms & data structures

### Hash table with chaining  — [source](hash-chaining.fd)
Bucket-array group, empty and occupied slots, pointer edges to
singly-linked entry chains — a static data-structure explainer.
![Hash table with chaining](hash-chaining.svg)

## Just for fun

### Rainbow rings — [source](rainbow.fd)
No `plane` directives at all: line order is the layer. Seven concentric
`ellipse` nodes; later lines paint on top.

![Rainbow rings](rainbow.svg)

## Showcase set (`showcase/`)

The six figures walked through in [guide/showcase.md](../guide/showcase.md) — each one is
presented there with its source, what a human sees, what an agent can
answer from the text alone, and what the figure still cannot say. The sources
live here; read them beside that document.

| Figure | Genre | Source | Walk-through |
|---|---|---|---|
| TCP header — bit-exact machine-readable layout | `bitfield` | [tcp-header.fd](showcase/tcp-header.fd) · [.svg](showcase/tcp-header.svg) | [guide/showcase.md §1](../guide/showcase.md#1-tcp-header--bit-exact-machine-readable-layout-bitfield) |
| TCP three-way handshake — labelled directed exchange, plus a state `table` in the same document | `topology` | [tcp-handshake.fd](showcase/tcp-handshake.fd) · [.svg](showcase/tcp-handshake.svg) | [guide/showcase.md §2](../guide/showcase.md#2-tcp-three-way-handshake--labelled-directed-exchange-topology) |
| L2 switch forwarding decision — protocol logic as a readable decision flow | `flowchart` | [l2-forwarding-logic.fd](showcase/l2-forwarding-logic.fd) · [.svg](showcase/l2-forwarding-logic.svg) | [guide/showcase.md §3](../guide/showcase.md#3-l2-switch-forwarding-decision--protocol-logic-readable-flowchart) |
| Ethernet II frame — byte order carried by syntax, not by geometry | `table` | [ethernet-frame.fd](showcase/ethernet-frame.fd) · [.svg](showcase/ethernet-frame.svg) | [guide/showcase.md §4](../guide/showcase.md#4-ethernet-ii-frame--byte-order-carried-by-syntax-table) |
| ARP resolution — `external` and `class` discipline, plus a cache-transition `table` | `topology` | [arp-resolution.fd](showcase/arp-resolution.fd) · [.svg](showcase/arp-resolution.svg) | [guide/showcase.md §5](../guide/showcase.md#5-arp-resolution--external--class-discipline-topology) |
| TCP connection state machine — 11 states, 21 transitions, all of RFC 9293 Figure 5 | `flowchart` | [tcp-state-machine.fd](showcase/tcp-state-machine.fd) · [.svg](showcase/tcp-state-machine.svg) | [guide/showcase.md §6](../guide/showcase.md#6-tcp-connection-state-machine--every-state-every-transition-flowchart) |

## Layout before / after set (`layout-compare/`)

Two figures, each shown twice: once with an empty layout zone and once with
layout intent added. The content zones are byte-identical within each pair —
that is the point. The **tuned** side is the top-level example itself, not a
copy: until this release this directory held `*-tuned.fd` files that were
md5-identical to `examples/evpn-fabric.fd` and `examples/srl-evpn-irb.fd`,
which is a duplicate rather than a demonstration. Measurements and the reading of each pair are in
[guide/layout.md §7](../guide/layout.md#7-before--after-the-same-semantics-different-layout-zones).

| Pair | auto | tuned | What the tuning adds |
|---|---|---|---|
| VXLAN/EVPN leaf-spine fabric | [.fd](layout-compare/evpn-fabric-auto.fd) · [.svg](layout-compare/evpn-fabric-auto.svg) | [.fd](evpn-fabric.fd) · [.svg](evpn-fabric.svg) | `flow down` + two `rank` lines — three semantic lines, no `pin`; edge length halves |
| EVPN-VXLAN IRB (16 nodes, three leaf groups) | [.fd](layout-compare/srl-evpn-irb-auto.fd) · [.svg](layout-compare/srl-evpn-irb-auto.svg) | [.fd](srl-evpn-irb.fd) · [.svg](srl-evpn-irb.svg) | 20 layout lines using groups as layout modules (two-level `pin`); lint gets *worse* while the figure becomes unambiguous |

---

More waves per the gallery plan: the full header
set, protocol negotiation sequences, algorithm & data-structure
figures, and math-annotated figures.
