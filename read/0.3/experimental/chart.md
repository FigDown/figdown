# Charts from a table — `chart`, `type=` (EXPERIMENTAL)

Outside the v0.1 conformance surface and outside the compatibility promise:
the engine accepts it, but it may change or be withdrawn in a later `0.x`,
and the parser emits no warning. If the figure must be portable, keep the
table and drop the chart.

**`chart` is composition, not subject vocabulary.** It says nothing about
what the figure is *of*, so it is not one of the words a genre declares for
its own domain — it is legal wherever a `table` region is legal, which is the
`table` genre and every scene genre, and it means the same thing in all of
them.

```figdown
figdown 0.1 table
table t "Throughput"
| Port | Gbps |
|------|------|
| 1    | 25   |
| 2    | 40   |
chart t type=bar3d
```

- `chart <table-id>` is the whole grammar. It draws from a `table` declared
  in the same document and is defined by that reference, so the id must
  already exist.
- `type=` is the only option key and `bar3d` is its only value.
- A scene document can carry both halves: open a `table` region inside it for
  the numbers, then `chart` that id.

For anything a chart library would do better, keep the raster and put the
numbers in a table (`../transcribe.md`).
