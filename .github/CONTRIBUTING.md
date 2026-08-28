# Contributing to FigDown

FigDown is a **closed language with a frozen surface**. Every non-blank,
non-comment line must begin with a registered keyword; anything unregistered is
an error with a line number. That is what makes the write → validate → fix loop
work for an AI agent, and it means the language cannot grow casually. A
contribution is therefore judged less on whether it is a good idea than on
whether it brings the evidence a ruling needs.

This page tells you what that evidence is and where to take it. Read
[`spec/README.md`](../spec/README.md) first if you are unclear on what *frozen*
and *experimental* mean here — the routes below differ sharply depending on
which one your change touches.

## Where to take it

| You want to… | Go to |
|---|---|
| propose a new directive, option key, enum value or genre | the **Syntax proposal** issue form |
| change or remove a **frozen** construct | the **Syntax proposal** issue form — read [Route A](#route-a--changing-a-frozen-construct) first |
| change or remove an **experimental** construct | the **Syntax proposal** issue form — [Route B](#route-b--changing-an-experimental-construct) is much lighter |
| report a figure that renders wrongly or illegibly, a specification contradiction, or broken determinism | the **Figure defect** issue form |
| ask something the docs didn't answer, or you're unsure which form fits | the **Question** issue form |
| report a security problem | [`SECURITY.md`](SECURITY.md) — never a public issue |
| write a figure rather than change the language | [`guide/authoring.md`](../guide/authoring.md), then [`guide/expressing.md`](../guide/expressing.md) |

Open an issue before opening a pull request for anything that touches the
language. A PR that changes syntax without a ruling behind it cannot be merged
no matter how good the code is, because the ruling is the part that has to be
recorded.

## The evidence gate for new syntax

A new directive, option key, enum value or genre enters the language only if
**all three** hold. Any one missing is a decline, not a delay.

1. **Semantic impossibility.** The meaning has no chance of precise expression
   through existing constructs. *"More convenient" is not sufficient* —
   composition is preferred over vocabulary, every time. Show your best attempt
   with today's syntax and state exactly what meaning it loses. If what it
   loses is keystrokes, the answer is no.
2. **Corpus evidence.** Real figures need it, with a measured frequency over a
   real body of documents. Impossibility decides **if**; frequency decides
   **when**, and how short the spelling may be — common things get short
   spellings. An intuition about frequency is not evidence; counting is cheap
   enough that offering the intuition instead is a choice.
3. **Prior art surveyed.** Check the mainstream diagram languages first,
   weighted by adoption, and borrow before inventing. This is not deference for
   its own sake: AI authors already know the mainstream spellings, so an
   invented one costs accuracy on every generated document.

Two rules govern the *name*, once the meaning is agreed:

- **A name should come whole from one external standard**, rather than be
  assembled from parts or coined. Where a candidate survives that check, it must
  still be held against what FigDown already uses the word for — including the
  words the normative prose uses to mean something else.
- **An inverted prior is worse than an opaque word.** A merely unfamiliar
  spelling costs the reader one lookup. A spelling that means *something else*
  in a standard the reader already knows produces a legal document, a rendered
  figure, and a confident wrong reading, with nothing for any gate to fire on.
  Between an opaque candidate and one that inverts a known prior, the opaque one
  wins.

## Not planned

Read this before you spend the evidence the gate above asks for. Some things
get asked for more than once, and each row below is a decision already taken
and recorded — not a preference, and not a claim that the need is imaginary.
The last column is the part that matters: every one of these reopens on
something, and naming that something is cheaper for you than re-arguing the
row.

An `IDENTIFIER` in *Recorded in* is a row in
[`decisions/registry.md`](../decisions/registry.md); a section number is
[`spec/core.md`](../spec/core.md).

| What is asked | Decision | Why, in one sentence | Recorded in | What would reopen it |
|---|---|---|---|---|
| Author-drawn edge routes — waypoints, port anchors, a routing mode | **Withdrawn** from the language; nothing replaces them | A source-graded survey of mxGraph, ELK, Visio and draw.io found the realisation sits outside the narrow stable intersection those four share — they disagree about what happens when an endpoint moves, and a disagreement about behaviour cannot be settled by choosing a better word. | `EDGE-GEOMETRY-CONSTRUCTS`; `DOMAIN-CONVENTION-DIRECTIVES` — the author names the meaning, the engine owns the drawing convention | The withdrawal **released** both spellings, so a genre may claim either as its own subject vocabulary through the ordinary evidence gate above — never again as edge geometry. The underlying need is filed as `EDGE-IDENTITY-AND-GEOMETRY` |
| A colour or label colour written straight onto an element | **Retired language-wide**; a permanent line error | Colour that classifies is a `class` whose label states what it classifies, and a live colour key was also the one thing letting an older document draw a legal, wrong figure in silence across 1602 downstream sites. | `COLOUR-KEY-STATUS`; `CATEGORICAL-MEANING-MAPPING` — a `class` plus the derived legend | The residual question is filed as `ANNOTATION-LOCATOR-SPLIT` ([`spec/core.md`](../spec/core.md) §9), and a re-proposal goes through it carrying a channel a `class` is measured to lose — an `edge` carries three labels, so an owner-level key is the wrong shape |
| An overlay or z-order keyword for painting one set of elements above another | **Withdrawn** from the language; no replacement spelling | Stripping it from its only two authored figures moved exactly one edge index and changed no ink, while to the network engineers who write those figures the word already names the control/data/management partition — the wrong reading, for precisely the intended readers. | `PAINT-ORDER-CONSTRUCT`; `RESERVED-SPELLINGS` — the word is held against the need returning | A measured figure that document order plus `class=` cannot draw: a real z-order need, not a labelled one |
| A genre's subject keyword made available under the other genres | **Withdrawn per genre** — sixteen of twenty-four genre-and-keyword pairs at once | A subject word belongs to the genre whose domain gives it a referent, and the withdrawn pairs had either no evidence of need in that genre or a domain meaning already occupying the word — most had both. | `SCENE-KEYWORD-MEMBERSHIP`; `SUBJECT-VOCABULARY-SCOPE` — subject vocabulary is per genre, never inherited | Pair by pair, on measured need inside that genre; the grid was decided pair by pair and is re-decidable the same way |
| A lenient mode: warn on a line the parser does not recognise and carry on | **Never** | The grammar is closed by axiom — every unrecognised line is an error carrying a 1-based line number, and that is the whole reason a write → validate → fix loop terminates instead of drifting. | `CLOSED-GRAMMAR`; [`spec/core.md`](../spec/core.md) §0 and §8 | Nothing. A construct you cannot express is a syntax proposal, not a tolerance |
| A structured diagnostics envelope in the public library, beside the error strings | **Built, measured, retracted** | A pre-registered A/B at the model floor — 24 repair chains, 12 per condition — moved first-round repair by **0 points** against a ≥ 15-point bar and mean rounds-to-success by **−0.4167** against a ≤ −0.5 bar. | [`PROOF.md`](../PROOF.md) §4.3 — the criteria, the run, and the one result it argues against itself with | An editor or language-server consumer with measured demand, re-measured against **that** consumer's criteria; this probe's criteria do not carry over |
| An interactive per-figure runtime — scripted SVG, hover, click, live animation | **Out of scope** | An artifact is a pure function of its source plus its recorded render options, so behaviour would be the one thing in the figure with no source to read it from. | `STATIC-DYNAMIC-PRIORITY`; `DYNAMIC-FIGURE-PURPOSE`; [`spec/core.md`](../spec/core.md) §6 (dynamic is reserved, not specified) and §7 | The reserved dynamic layer being specified after the static core — and it lands as an ordered list of page deltas, not as a runtime |
| A chart or plot construct — X-Y trend, bar, line | **Out of the normative vocabulary** | A trend chart's knowledge is its values, and a `table` answers *which is highest* and *is it rising* with equal accuracy, so the rendered shape is an idiom for the values rather than knowledge of its own. | `CHART-SCOPE-BOUNDARY` — about 1% of the measured 774-document corpus, and a semantic-completeness score of zero | Case by case on `COMPLETENESS-DEFINITION`'s irreplaceability test: strip the encoding, restate the knowledge, and see whether the central question survives. The proportional-area encoding (`MEANINGFUL-ARRANGEMENT`) is the first candidate |
| A full proposal-lifecycle process, a public roadmap board, promotion channels | **Held as premature** | The decision record already says what was decided and why, and a lifecycle process currently has zero external contributors to serve. | Not a language ruling and so not a registry row — it is a project-shape decision, kept in the project's working record | A second regular contributor, or the first substantial external proposal — whichever arrives first |

A row here is not a closed door with the handle removed. If you have the thing
in the last column, bring it: the reopen condition **is** the evidence gate for
that row, and each one is deliberately written as something a contributor can
go and measure.

## Route A — changing a frozen construct

Frozen does not mean unchangeable. It means the change must be **managed**, and
the management is not optional. A proposal to change or remove a frozen
construct must be accompanied by all of the following, or it cannot be
accepted:

1. **A mechanical rewrite rule.** Old spelling → new spelling, expressible as a
   transformation a program can perform on a document without asking a human
   anything. If part of the rewrite genuinely cannot be mechanised, that part
   must be identified explicitly rather than glossed over — and it raises the
   bar on the rest of the case considerably.
2. **A named diagnostic.** A document written against the old spelling must
   fail **loudly and by name**. A change that lets an old document keep parsing
   while quietly meaning something new is the one outcome the frozen promise
   exists to prevent, and it is refused regardless of the merits.
3. **The migration entry.** An entry in [`spec/migrations.md`](../spec/migrations.md)
   carrying (1) and (2), plus the matching rewrite in the migration tool. The
   tool must stay **cumulative and idempotent**: every rewrite the project has
   ever shipped stays in it, a document from any earlier version must reach the
   current one in a single run, and running it on an already-current document
   must change nothing.
4. **Conformance goldens.** Updated fixtures in [`conformance/`](../conformance/README.md).
   Goldens move only with a migration entry or a resolved discrepancy — never
   silently, and never because the engine's new output looked reasonable.

The practical consequence: **the cost of a frozen-surface change is mostly
migration work, not implementation work.** Budget for that when you propose one.

## Route B — changing an experimental construct

An experimental construct is outside the compatibility promise, so none of
Route A's four obligations apply. It may be changed, renamed or withdrawn
outright. What is still required:

- **the evidence gate above**, if you are *adding* something — experimental is
  not a bypass around the gate, it is a statement about stability;
- **conformance fixtures** under `conformance/experimental/`, so the behaviour
  is pinned even though it is not promised;
- **file-level isolation** (below).

Proposing that an experimental construct be **promoted to frozen** is a
different and heavier ask: it needs the corpus evidence that it is genuinely
used, and a statement of what the project is taking on by promising to migrate
it forever.

## File-level isolation

Frozen and experimental material are separated at the **file** level, never by a
marker inside frozen prose. Anything you add that is outside the v0.1
conformance surface goes into the experimental file set —
[`spec/experimental.md`](../spec/experimental.md),
[`spec/genres/experimental/`](../spec/genres/experimental/),
`conformance/experimental/`, `examples/reference/experimental/` — and nowhere
else.

A frozen file **may name** an experimental construct, because a closed language
has to be able to say what exists; every such mention is marked and points at
the definition. A frozen file may never **define** one, and no normative
sentence in a frozen file may need an experimental file read to be complete.

The test, which is run and not merely believed: *delete the experimental file
set, and what remains must still be a complete, self-consistent standard with no
dangling normative reference.* `node tools/isolation-check.js --strict` is that
test.

## Working in this repository

- **Branching.** This repository uses a **single branch**. Work on a topic
  branch in your own fork and open a pull request against it; there is no
  development branch and no promotion flow to learn.
- **One engine source.** `editor/figdown.html` is the only hand-edited engine
  file. The `dist/` builds, the engine copy inside `skill/`, and every `.svg` in
  the repository are **generated**. Regenerate them; never hand-edit them.
  Regeneration is the *last* step of a change, and every check is then re-run
  against the regenerated tree.
- **A source change obliges an artifact rebuild.** Editing an `X.fd` is not
  finished until `X.svg` has been rebuilt from it. This has shipped broken more
  than once, and the failure is invisible by inspection: each stale artifact is
  internally consistent with the source it *used* to have. Only an
  artifact-against-source comparison catches it, which is what the check does.
- **Documentation snippets must parse.** Every ` ``figdown ` fence in a
  Markdown file you touch must parse, or carry an explicit skip marker if it is
  a deliberately invalid example.
- **Goldens are frozen artifacts.** A conformance golden changes only with a
  migration entry or a resolved discrepancy. See
  [`conformance/README.md`](../conformance/README.md).

Run the checks in [`tools/README.md`](../tools/README.md) before opening a pull
request, and state their results in the description. A check that was not run is
treated as a check that failed.

## What happens to your proposal

Language changes are decided by the maintainer, and no ruling stands on taste
alone: each one cites its evidence — corpus statistics, an adoption-weighted
prior-art survey, or reproducible field feedback.

Rulings that settle something a later contributor could reasonably re-litigate
are recorded in [`decisions/`](../decisions/README.md) — **including declines**,
with what was rejected, why, and what evidence would reopen it. If your proposal
is declined for a substantive reason, expect it to be written down rather than
closed silently. That record is the point: it means the next person to have your
idea starts from the argument instead of from a blank page.

## Licence

Contributions are accepted under the MIT licence of this repository
([LICENSE](../LICENSE)).
