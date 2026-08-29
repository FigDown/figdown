---
name: Syntax proposal
about: Propose a new directive, option, or genre — evidence-first
title: "[syntax] "
labels: syntax-proposal
---

<!-- FigDown's registry is closed; a new directive, option, enum value or
     genre enters only through the gate in .github/CONTRIBUTING.md §2: semantic
     impossibility, corpus evidence with frequency, and prior art surveyed.
     Some needs were already asked, evaluated and declined — check
     .github/CONTRIBUTING.md's Not-planned table first; if your need is there, its
     reopen condition tells you what to bring instead of re-arguing the row.
     This form asks for exactly what the gate needs, in the same five-part
     shape the first production field reports used — a report arriving with
     all five parts is one a ruling can actually be made on. -->

## The knowledge you need to express

<!-- The fact, not the picture. What does the figure need to say that it
     cannot say today? -->

## The minimal `.fd` you tried

```figdown
figdown 0.1 block
...
```

## The engine's actual output

<!-- Verbatim: the `Line N: message` it gave you, or "nothing" — parses
     clean but draws or means the wrong thing — if that's what happened.
     The distinction between the two is itself evidence. -->

## Which existing construct fails, and why

<!-- Show your best attempt with current syntax (node/group/edge/class,
     bitfield/table/timing, line/fill/bundle...) and name exactly what
     meaning is lost. This is where "semantic impossibility" gets tested:
     "less convenient" is not "impossible," and composition beats new
     vocabulary (`NEW-CONSTRUCT-EVIDENCE-GATE`) — strip presentation first (pin/fill) and check
     whether knowledge is actually missing, not just prettiness. -->

## Real samples

<!-- De-identified examples of real figures needing this — links or
     structural descriptions. How often does the pattern occur in your
     corpus? Rough frequency is enough; it decides *when*, not *if*. -->

## Prior art

<!-- How do Mermaid / PlantUML / Graphviz / D2 / others spell this,
     if at all? -->
