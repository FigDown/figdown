---
name: Figure defect
about: A figure renders wrongly or illegibly — parser/renderer bug, spec contradiction, or broken determinism
title: "[defect] "
labels: figure-defect
---

<!-- Not every wrong-looking figure is a defect — some behaviour is
     deliberate and already ruled. Check .github/CONTRIBUTING.md's Not-planned
     table first. If it isn't there, this form asks for exactly what a
     fix needs. -->

## The `.fd` that reproduces it

```figdown
figdown 0.1 block
...
```

## The rendered output

<!-- Attach or link the .svg / screenshot, or paste the parser's error text
     verbatim if it fails to render at all. -->

## What you expected instead

<!-- Quote the spec section if you can. Engine-vs-spec conflicts are
     tracked loudly in conformance/DISCREPANCIES.md — this is exactly
     the kind of report we want. -->

## Engine version

<!-- The `figdown <version>` header line of the document, and, if you
     know it, the engine build (dist/figdown.js version string, or the
     editor's own footer). -->
