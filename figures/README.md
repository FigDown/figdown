# figures/

This directory holds the repository's **own** documentation figures — FigDown
dogfooding itself. Every `.fd` here is the source of the `.svg` beside it, and
each pair is embedded by exactly one document. (Specimens meant for *readers* —
the gallery, the showcase set, the layout comparisons, the pattern skeletons —
live in [`examples/`](../examples/index.md) instead.)

| Figure | Serves |
|---|---|
| `one-source-two-readers.{fd,svg}` | [README.md](../README.md) — the project tagline, drawn |
| `ingress.{fd,svg}` | [README.md](../README.md) / skill embed example — the block-architecture specimen |

Regenerate with `node tools/build-svg.js figures` after editing any `.fd`;
never hand-edit an `.svg`.
