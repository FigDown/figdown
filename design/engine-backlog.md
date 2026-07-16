# Engine backlog (layout quality, pre-v0.2)

Working list of renderer/auto-layout defects observed during the
render-quality reviews; each was worked around with explicit `pin`
lines, which is acceptable (R8) but should not be *required*.

1. **Label-aware edge length**: auto-layout node pitch ignores edge
   mid-label width — short edges cannot fit their `[label]`, which
   then crowds or overlaps the neighbouring node. Spacing between
   ranks should grow to `max(default pitch, label width + margin)`.
   (Raised twice in review, 2026-07-10; fixed 2026-07-10: layer pitch
   grows for on-edge labels under `flow right|left`, lane gaps grow
   for beside-labels under `flow down|up`.)
2. **`rank` lane collapse under `flow right|down`**: rank equalisation
   uses the max of natural ranks after DFS inversion, which can pull
   whole branches into one lane/column (hash-chaining, erd-a,
   pvlan-flows all hit this before pinning). (Fixed 2026-07-10:
   back-edges are detected by DFS and removed, longest-path layering
   runs from the sources, and a `rank` group is merged into a single
   vertex for the layering so unrelated branches keep their own layer.
   Lanes are now assigned by barycenter sweeps — branch targets of a
   diamond land in distinct lanes; multi-layer edges route through
   reserved waypoint lanes; back-edges route through a side channel
   with the mid label on the channel run.)
3. Mid-labels on near-vertical edges are placed beside the line
   (fixed 2026-07-10); tail/head labels still sit on the line for
   vertical edges — same treatment needed if it shows up in practice.

Additional items from the 2026-07-15 layout-quality review (external
collaborator feedback, adopted as backlog; measurements from runnable
prototypes against the current engine):

4. **Back-edge channel nesting order** — side-channel slots are
   allocated in document order, so a far source can take the innermost
   ring and cross every other return (hub/return figures: 12 crossings
   on the state-hub pattern; nearest-source-innermost ordering
   measured 12→0). IN PROGRESS.
5. **Anti-parallel edge offset** — A→B and B→A straight edges render
   coincident with stacked labels; offset each along the canonical
   normal (±7px) so both directions are visible (measured 2→0
   coincident pairs). IN PROGRESS.
6. **Groups/siblings as routing obstacles** — long feedback and
   cross-tier edges cut through group boxes and same-layer nodes the
   waypoint system does not cover (worst case: 3 nodes pierced on one
   block-pattern figure). Route around obstacle rectangles.
7. **Equivalent-edge merge (presentation option, NOT default)** — when
   ≥2 edges share the same target (or source) AND the same label, a
   renderer MAY draw them as stubs into a collector line with one
   arrowhead + one label (junction dots at merge points). Semantics
   stay N edges (presentation-ignorable, R37-safe). Corpus scan found
   exactly one qualifying figure today — hence an option, revisited if
   the corpus grows (R11).
8. **Layout-lint tool** — institutionalize the render-quality metrics
   used in reviews (edge crossings, edge-through-node, node overlap,
   label collisions, coincident anti-parallel pairs, ink-per-edge) as
   a tools/ script runnable over the gallery in CI fashion.
