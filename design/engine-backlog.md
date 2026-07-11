# Engine backlog (layout quality, pre-v0.2)

Working list of renderer/auto-layout defects observed during the
render-quality reviews; each was worked around with explicit `pin`
lines, which is acceptable (R8) but should not be *required*.

1. **Label-aware edge length**: auto-layout node pitch ignores edge
   mid-label width — short edges cannot fit their `[label]`, which
   then crowds or overlaps the neighbouring node. Spacing between
   ranks should grow to `max(default pitch, label width + margin)`.
   (Raised twice in review, 2026-07-10.)
2. **`rank` lane collapse under `flow right|down`**: rank equalisation
   uses the max of natural ranks after DFS inversion, which can pull
   whole branches into one lane/column (hash-chaining, erd-a,
   pvlan-flows all hit this before pinning).
3. Mid-labels on near-vertical edges are placed beside the line
   (fixed 2026-07-10); tail/head labels still sit on the line for
   vertical edges — same treatment needed if it shows up in practice.
