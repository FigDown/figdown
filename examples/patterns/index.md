# Structure Pattern Library

> Fourteen de-identified structural skeletons distilled from the
> figure-type census over a real 774-document corpus: for each major
> figure family, agents read real samples and re-expressed **only the
> structure** with generic placeholder labels — no content, no terms,
> no fingerprints. Use them as starting templates: replace the labels,
> keep the shape.
>
> 繁體中文版：[index.zh-tw.md](index.zh-tw.md)

## Block & architecture
- [block-a](block-a.fd) — parallel lanes fanning into a collector
  ![block-a](block-a.svg)
- [block-b](block-b.fd) — containment tiers with cross-tier dashed feedback
  ![block-b](block-b.svg)

## Register / packet bit layouts
- [bitfield-a](bitfield-a.fd) — one control word: flag run + wide fields + reserved (lsb0)
  ![bitfield-a](bitfield-a.svg)
- [bitfield-b](bitfield-b.fd) — multi-word descriptor with a variable tail
  ![bitfield-b](bitfield-b.svg)

## Tables
- [table-a](table-a.fd) — two-tier merged header + rowspan label column
  ![table-a](table-a.svg)
- [table-b](table-b.fd) — rowspan/colspan merges + per-cell colors + row highlights
  ![table-b](table-b.svg)

## Flowcharts
- [flowchart-a](flowchart-a.fd) — two sequential decisions, branches converging
  ![flowchart-a](flowchart-a.svg)
- [flowchart-b](flowchart-b.fd) — retry loop-back
  ![flowchart-b](flowchart-b.svg)

## Timing / waveforms
- [wave-a](wave-a.fd) — clocked request/acknowledge handshake
  ![wave-a](wave-a.svg)
- [wave-b](wave-b.fd) — valid + labelled data-bus segments
  ![wave-b](wave-b.svg)

## Topologies
- [topology-a](topology-a.fd) — two tiers, full mesh, port labels
  ![topology-a](topology-a.svg)
- [topology-b](topology-b.fd) — chain with a redundant pair and a link bundle
  ![topology-b](topology-b.svg)

## State machines
- [state-a](state-a.fd) — cycle with retry/abort back-edges
  ![state-a](state-a.svg)
- [state-b](state-b.fd) — hub: states converging to reset
  ![state-b](state-b.svg)

## Entity-relationship (blocks-first, R36)
- [erd-a](erd-a.fd) — entities as multi-line nodes (PK/FK in label
  text), relationships with an inline verb and cardinality endpoint
  labels
  ![erd-a](erd-a.svg)
