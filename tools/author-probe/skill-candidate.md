---
name: figdown
description: Draw a figure a human can read and an agent can read too — FigDown .fd text that states the meaning, with a deterministic SVG embedded in Markdown. Use when asked to create, edit, fix, or read diagrams/figures in docs — block and architecture diagrams, topologies, flowcharts, state machines, message-sequence exchanges between parties, bit-level layouts (packet headers, hardware registers), tables, timing waveforms — or when a .md contains an SVG with a "source: *.fd" footer.
---

# FigDown — figures as text, one source, two readers

A figure lives as a `.fd` text file (single source of truth). The SVG is a
deterministic build artifact for human eyes; **you read the `.fd` for meaning —
never OCR the SVG**. Structure (nodes, edges, fields, rows) is the content;
placement and colour are presentation whose only job is rendering stability.

**Choose the form that communicates best.** Three modes: (1) prose, list or
table alone for linear facts, values or procedures — do not draw; (2) a figure
alone when it is self-contained; (3) figure + prose, the common case — the
figure carries structure and relationships, the surrounding prose carries the
detail. When the answer involves a figure, author one. When it does not, do
not draw out of habit. The `.fd` must carry everything the rendered figure
conveys, and no more is owed.

**Mode 3 has an authoring consequence:** if the figure is the outline, do not
cram the whole story into it. Keep labels short and leave the detail to the
host document. Overstuffed labels are the visible symptom of an author making
the figure do prose's job.

## Workflow

1. Edit or create `X.fd` (never edit an `.svg`). A new file opens with the
   spec provenance line, verbatim, then the header — see *The document
   skeleton* below.
2. Build + validate: `node <this-skill-dir>/build-svg.js X.fd`
   Errors come as `Line N: message` — fix and rerun until `OK`. Titles are not
   drawn by default (Markdown supplies the caption); `--with-title` opts in.
3. Embed in Markdown — the SVG only, never `.fd` content. Below, `X` is the
   basename from step 1 and both paths are written relative to the **host
   document**, not to this skill. The source footer is the convention that
   lets a later reader find the `.fd` behind a rendered figure, so it is
   written on every embed:

   ```markdown
   ![What the figure shows](figures/X.svg)

   <sub>source: [figures/X.fd](figures/X.fd)</sub>
   ```

4. Keep `X.fd` and `X.svg` side by side, same basename; commit both.

If a `.fd` is missing, its `.svg` carries the source verbatim, the SHA-256 of
that source and the engine version that rendered it, in
`<metadata id="figdown-source" data-sha256="…" data-engine-version="…">`.
Recover from there. On hash mismatch the `.fd` is truth: rebuild. If the hash
matches but your drawing differs, compare `data-engine-version` — that is the
other half of "same source → same SVG".

## Repair loop, truthfulness and delivery order

**Bounded repair loop.** After step 2 fails, keep fixing and rerunning only
while each attempt's error count is a new minimum — strictly lower than
every attempt before it. Two consecutive rounds with no improvement mean
another identical round will not help either: stop, and report the
remaining errors truthfully instead of trying a third time.

**Truthfulness.** A run that still reports errors is never described as a
success, in any wording. Never delete or weaken meaningful declared content
— a node, an edge, a field, a row, a signal, whatever the genre calls it —
merely to make the error count reach zero; removing what the figure states
is not a repair, it is a smaller, different figure wearing the same
filename. Once a run passes cleanly, the document is frozen: no further
edits chasing "one more improvement."

**Artifact first.** Write the file, or the fenced block, before explaining
it. Commentary, reasoning and a description of what changed come after the
artifact exists — never before it, and never interleaved with it.

## When the figure comes from a source

Drawing is step 5 of 6. The steps before it decide what is true; the step after
it is how you find out you were wrong.

**1 — Get the structure out, don't look at the picture.** Containers ship a
drawing twice: the editable object and a flat render of it. The render is not
the source. Open the container, take the object, and read nodes, edges and
labels from it. Vision is for flat pixels with no structure left, and
everything it produces is a hypothesis until checked.

**2 — Let the extraction pick the genre.** Many text shapes and no connectors
is not a graph: it is a `table`. Conditions with one outcome per combination is
a `table`, not a `flowchart` — drawn as a chart it buys crossing edges and
nothing else. Two mirrored mechanisms are two figures. A run in which most of a
page's figures become tables is a correct run. **The SHAPES in the source
drawing are the tempting signal and they carry nothing** — the original author
picked them by habit, by stencil and by tool default, and no two drawings agree;
what decides the genre is the ROLES and the QUESTIONS in it, which is what the
extraction gives you and the picture does not.

**3 — Separate what the source states from what you concluded.** Write the
stated thing; for the rest, leave a `#` comment at the point of doubt and list
it where the host document can count it. A length the source does not give
stays the unresolved marker its genre provides, a condition the source states
goes in the genre's own condition key rather than into a label, and a value it
words in prose stays worded — resolving any of them is fabrication with a
plausible face.

**4 — Keep the original.** Store it beside the `.fd` and never delete it: a
later reader may find a misread, and the fix needs the ground truth. After
that, the `.fd` changes only when understanding changes.

**5 — Draw.**

**6 — Verify, and be able to fail.** Diff your `.fd` against the extracted
structure: same node set, same edge set, same labels. This is what catches an
invented node and a dropped edge — neither is visible in a picture that looks
fine. Then build and **look at the render**. Lint and crossing counts are a
smoke alarm, not a judge. A figure is not done because the file exists; it is
done when it has been compared and seen.

**Across a corpus:** one figure per session, one tool call per figure; never
read a large extraction whole; two failures on a step means halve the step;
keep progress in a file, not in the session. Check once per corpus that every
figure has both `.fd` and `.svg`, that every embed resolves, and that every
recorded uncertainty is still recorded.

## Load only what you need

This file is the whole genre-independent language. **Everything else is one
lookup away, and the lookup is mechanical:** line 1 of a `.fd` names its genre,
so you know which file you need before you need it.

<!-- skill-coverage: router -->

| Genre on line 1 | Load | Add only for EXPERIMENTAL constructs |
|---|---|---|
| `block` — architecture, dataflow, hierarchy | `reference/scene.md`, `reference/layout.md` | `reference/experimental/block.md`, `reference/experimental/chart.md` |
| `bitfield` — packet headers, register layouts | `reference/bitfield.md` | — |
| `table` — config, state, memory maps | `reference/table.md` | `reference/experimental/chart.md` |
| `topology` | `reference/experimental/topology.md`, `reference/layout.md` | `reference/experimental/chart.md` |
| `flowchart` | `reference/experimental/flowchart.md`, `reference/layout.md` | `reference/experimental/chart.md` |
| `statechart` | `reference/experimental/statechart.md`, `reference/layout.md` | `reference/experimental/chart.md` |
| `timing` | — | `reference/experimental/timing.md` |
| `sequence` — message exchanges over time | — | `reference/experimental/sequence.md` |

**`sequence` draws a ladder**, and you place nothing in it: participants are
columns and time runs down the page, both in the order the source declares
them, so no key in that genre moves a coordinate — not even a layout-zone one,
which parses and changes nothing there. Its file is the whole of its
vocabulary, and it is the one genre where the layout file buys you nothing.
Three constructs an author arriving from another genre reaches for were
argued and REFUSED there — a time-gap line, a band over participants, and a
per-message "sent but never delivered" flag; each is a line error that names
its ground and the spelling to write instead, so write the source and read
the message rather than guessing. Its file says how.

Two more files answer a **task** rather than a genre:

- **Reading a `.fd` someone else wrote, to summarise or answer from it** →
  `reference/reading.md`. It is the contract for what you may conclude and
  what you must not infer, and it is all you need: a reader can skip every
  genre file above. **The correction that used to be printed here is now in the
  file itself**, so read `reference/reading.md` as it stands. If you ever meet
  an OLDER copy of that contract — one that says *"Ignore the layout zone.
  Everything from the `layout` keyword down is …"* — do not read that as a rule
  about **position**. Ignore the layout **namespace** — its one member is `pin`
  — **wherever a member appears**, because a `pin` may legally sit *before* the
  `layout` line, and about half of them do. Membership decides, not position.
  It is the same rule stated above under "layout and pin".
- **Transcribing an existing figure** — a drawing, a screenshot, another
  format → `reference/transcribe.md`.

Pick the genre by what the figure IS, not by its subject: the left-hand
column above says what each is for.

**Where portability and that answer disagree, the ANSWER decides.** `block`,
`bitfield` and `table` are the portable three — inside the v0.1 conformance
surface and its compatibility promise — and taking one of them *against* the
answer is a trade you STATE, never a default. State it in a `#` comment that
names the genre you did not write and what the reader must not conclude from
the one you did. Two different prices hide under the word "portable" and they
are charged by different rows: `topology` and `flowchart` are dispatchable at
`figdown 0.1`, so choosing them moves no version and only carries the EXPERIMENTAL
withdrawal risk; `statechart` and `sequence` move the declared version as well.
"It must render on any released version" is therefore not an argument for
leaving the first two. An approximation you do not state is indistinguishable
from a judgement about what the figure is, so the reader inherits the wrong
one.

**Load the genre file BEFORE you write line 2, not only when something
fails.** A scene genre may spell the thing and the line with **its own
domain's words**, and it may rank its keywords — preferring a precise one and
keeping a general one as the honest fallback. Neither is guessable from this
file, and neither is optional: the wrong spelling is a line error, and the
lazy spelling is a claim you did not mean to make. The genre file states both
in its first screen.

**Where a genre ranks its keywords, the general one means "the source does not
state this" — and nothing else.** It is the transcriber's honest line for a
source that leaves something unsaid, not a shrug and not a shortcut. It is
**not** the spelling for something FigDown cannot express: that is a **coverage
gap in the language**, and burying it in the general keyword makes the
language's hole look like your judgement, in a spelling no reader can tell
apart from a real decision. When your source states something no keyword
carries: write the general keyword, **name the missing thing in a `#` comment
on the same line**, and report the gap. The comment is text a reader can quote
and it survives every re-render; it is never parsed and never a second
semantic channel. Each genre file names its own ranking and its own fallback.

## The document skeleton

The grammar is **CLOSED**: an unknown line is an error, never ignored. Five
keywords — `figdown`, `title`, `class`, `layout`, `pin` — mean the same thing
under every genre and no genre may redefine them. Everything else belongs to a
genre.

```figdown
# FigDown — figures as text. Spec: https://github.com/FigDown/figdown
                            # ^ FIRST LINE of every document you write.
                            # Verbatim, em dash included. It is a comment:
                            # the parser ignores it. It is there because the
                            # file travels — into a wiki, a ticket, a pasted
                            # message — and tells whoever meets it there what
                            # the format is and where it is defined.
figdown 0.1 block           # REQUIRED first significant line; comments and
                            # blanks may precede it. The genre is REQUIRED.
                            # A later `figdown 0.1 <genre>` starts a new
                            # section with its own genre; one file still
                            # renders to one SVG.
                            # The VERSION is `0.1`, `0.2` or `0.4`. Write the
                            # LOWEST one that carries what the figure needs.
                            # `0.1` carries every other genre. `0.2` is the
                            # floor for `statechart` and `0.4` the floor for
                            # `sequence`: neither exists at `0.1`, and a
                            # version below a genre's floor is a line error
                            # (`figdown 0.3 sequence` does not parse).
                            # Sections may differ; each declares its own.
title "Some Title"          # optional; the quotes are REQUIRED
# comments start with '#'; inside quotes the only escapes are \n \" \\
class hot "Congested path" stroke=#dc2626   # meaning + style, declared once
```

**Quotes mark a STRING, and nothing else.** Every label is quoted, at every
position that has one — `title "TCP Header"`, `class c "meaning"`, and the
label of every block opener — because whitespace also separates arguments, so
a bare token cannot hold a phrase. Everything that is *not* a string is bare:
ids and references (`class=hot`), and every value drawn from a fixed list of
spellings (`style=dashed`, and the header's own `figdown 0.1 <genre>`).
Quoting one of those is a line error. Quoting a NUMBER or a point is not:
`width="90"` and `at="(1,2)"` are legal and mean exactly what the bare forms
mean.

**`class` is how meaning survives.** Colour and shape alone assert nothing a
reader can recover: a `class` states the meaning in text and the legend draws
itself from it. Anything you want a reader to *conclude* goes in a label or a
class meaning — never in a colour alone. A class with an empty meaning
(`class c ""`) deliberately claims nothing.

**Two paint channels, SVG's own**, legal on any element that has them:

| Key | What it paints |
|---|---|
| `fill=` | the **interior** of a shape — `#rgb`, `#rrggbb`, a CSS colour name, or `transparent` |
| `stroke=` | the **outline** of a shape, and the **whole** of a line |
| `style=` | `solid` \| `dashed` \| `dotted` |
| `class=` | one or more declared class ids, comma-separated: `class=hot,legacy` |

A line — an edge, a marker, a ring — has no interior, so `fill=` on one is an
error naming `stroke=`. There is **no label-colour key**: a label's colour is
derived from the background it sits on, so light text lands on dark fills by
itself.

**`layout` and `pin`** are the layout zone. Everything from a `layout` line
down is geometry that exists only to stabilise the `.svg`: it carries no
meaning, no genre may put its own semantics inside it, and `pin` is the only
directive legal there. When READING, ignore every member of the **layout
namespace** — `pin`, and nothing else today (core §10 (a′)) — **wherever it
appears**: membership decides, not position, and `pin` is legal before the
`layout` line too. See `reference/layout.md` when writing.

## Portability: two statuses, and the parser tells you nothing

Every keyword, option key and genre is either **NORMATIVE** (NORMATIVE — inside the
v0.1 conformance surface and its compatibility promise) or **EXPERIMENTAL**
(EXPERIMENTAL — the engine accepts it and your document keeps working, but it is
outside both, and may change or be withdrawn in a later `0.x`).

**The parser never warns**, so a line that parses tells you nothing about its
status — this is the only signal you get. Everything reachable *only* through
the right-hand column of the router is EXPERIMENTAL: use it when the figure needs
it, and say so beside the figure.

**Hybrid figures** (a scene and a table in one artifact): start a second
section with its own `figdown 0.1 <genre>` header rather than nesting one
genre's block inside another's.

## Do not invent syntax

If something seems missing, compose it from what exists or tell the user.
Retired spellings are hard errors whose message names the replacement — read
the error instead of guessing around it.

## Maintaining a document written against an older version

Line 1 pins the version, so never mix syntax generations in one file. When the
language moves, a **NORMATIVE** construct ships a mechanical rewrite rule and
you upgrade by applying the rules in order. An **EXPERIMENTAL** one carries no
such promise: it may be withdrawn with nothing that does what it did, in which
case the tooling reports and cannot rewrite, and a human decides what the
figure should say instead.

Full spec and docs: https://github.com/FigDown/figdown
