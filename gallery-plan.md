# FigDown Example Gallery — Plan

> Promotion strategy (R19): FigDown is sold by *meaningful figures*, not
> by spec prose. Every example ships as a `X.fd` + `X.svg` sidecar pair
> (dogfooding R14); the gallery index embeds the SVGs, so the repo itself
> demonstrates "one source, two readers" to every visitor.
>
> 繁體中文版：[gallery-plan.zh-tw.md](gallery-plan.zh-tw.md)

## E1 — Protocol headers (bitfield template) — ready today

The template is implemented; production is the AI-author → parser-validate
loop (ProtoFlow §8 heritage). Target set (~15, all `numbering=msb0`
RFC style unless noted):

Ethernet II · 802.1Q VLAN · ARP · IPv4 · IPv6 · TCP · UDP · ICMP ·
ICMPv6 · GRE (done) · VXLAN · MPLS label stack · DNS message ·
DHCP message · QUIC long header

Acceptance: byte-accurate against the RFC; renders within one screen.

## E2 — Protocol negotiation (sequence template) — needs design first

TCP 3-way handshake & teardown · TLS 1.3 full/resumed handshake ·
DHCP DORA · DNS recursive resolution · ARP request/reply · BGP session
setup · OSPF adjacency (Hello→Full) · 802.1X/EAP · QUIC 1-RTT

Prerequisite: the `sequence` template (census 0.6% in *our* corpus, but
the center of gravity for the networking/education audience this gallery
targets). Design rule (R18): borrow Mermaid sequenceDiagram conventions
(`A->>B: SYN`) — Mermaid is strongest exactly here, so syntax must feel
identical; FigDown's differentiators are the stability guarantee and the
self-carrying SVG artifact.

## E3 — Algorithms & data structures — static first, dynamic later

Static snapshots first (renderable with v0.1 core + typed blocks):
array/linked-list/stack/queue layouts · BST & heap shapes (topology-like
trees) · hash table with chaining · adjacency list/matrix pairs ·
DP table filling (table template + cell colors!) · sorting passes as a
figure sequence (one .fd per step — the page/frame model, R1).

Dynamic versions (`page`/`step`) come when the dynamic profile lands;
the ProtoFlow engine and text-anime v2 prototypes are the reference.

## E4 — Math expression support (new requirement, R20)

Algorithm/DS figures need math in labels: O(n log n), Σ, subscripts
(a_i), superscripts (2^k), fractions. Mainstream per R18: **LaTeX math
delimited by `$…$`** (KaTeX/MathJax convention; GitHub Markdown renders
it natively now). Open design question: a deterministic zero-dependency
renderer supports a *subset* (super/subscripts, Greek, common operators
via Unicode) vs. vendoring KaTeX (heavy, but complete). Start with the
subset; measure what the E3 examples actually need.

## RFC ASCII acceptance suite (R23)

RFC ASCII art is the original "figures as text". A curated set of
well-known RFC figures (packet layouts, message ladders, the RFC 9293
TCP state machine, topology sketches) forms an acceptance suite: every
figure in the list must be expressible in FigDown — with colors,
determinism, and machine-readable semantics on top.

## Production workflow

1. Author with AI (per-template authoring sheet) → validate with the PoC
   parser in a loop → human review.
2. Generate `X.svg` via the deterministic renderer; commit the pair.
3. `examples/index.md` embeds every SVG with a link to its `.fd`.
4. Each example doubles as a regression test (golden SVG snapshot).

## Milestones

- **G1**: examples/ skeleton + 5 headers (Ethernet, IPv4, TCP, UDP, VXLAN)
  + index page. Proves the pipeline.
- **G2**: full E1 set + 3 static E3 figures (DP table, BST, hash chain).
- **G3**: sequence template design → E2 set.
- **G4**: math subset (R20) → annotated E3 set; dynamic E3 when the
  dynamic profile ships.
