# Changelog

All notable changes to the FigDown standard and its reference engine are
recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/).

## Two version numbers

This file is organised by **release** version. FigDown carries two version
numbers and they are bound: **`figdown X.Y` is the first two parts of the
release version `vX.Y.Z`.** Release `v0.3.2` implements language `figdown 0.3`.

| number | versions | where it is written |
|---|---|---|
| **`figdown X.Y`** | the **language** — the document format | the header line of every `.fd` file |
| **`vX.Y.Z`** | the **release** — this repository and its engine | the git tag, and every artifact's `data-engine-version` |

**`package.json`'s `version` is a different object and may differ.** It is the
**npm package's release pin** — it carries pre-release suffixes (`0.1.0-rc.1`)
while the language and the engine are already at `0.1`/`0.1.0`, because a
package can be published for testing before the release it belongs to is
tagged. The engine's own `data-engine-version` is the authority for "which
build rendered this artifact"; `package.json` is the authority for "which npm
release you installed". Neither is derived from the other, and forcing them
equal would make one of them lie.

What each part of a release version commits to:

| part | meaning for this file |
|---|---|
| **`Z`** | **Bug fixes only.** No **Language** section may appear. No `.fd` file changes. |
| **`Y`** | **Features added, nothing removed.** A **Language** section may add constructs; it may never take one away. |
| **`X`** | **The only release that may remove support**, and it ships the migration that removal forces. |

So every heading below names the release version and the language version it
implements. **A release that moves the language says so explicitly** and carries
its migration entry; a release with no **Language** section did not touch it.

The normative policy is
[`spec/core.md` §13](spec/core.md#13-stability-and-versioning-normative); the
reader-facing summary is in the
[README](README.md#stability--read-this-before-adopting).

## How to read an entry

Each release lists only the categories that apply:

| Category | Means |
|---|---|
| **Language** | a change to the document format itself. Present only when the language version moves, or when a frozen construct changes within it. Always links its [`spec/migrations.md`](spec/migrations.md) entry and names the diagnostic that fires on the old spelling |
| **Added** | new tools, documents, genres or capabilities |
| **Changed** | behaviour that differs from the previous release without changing the language |
| **Deprecated** | still accepted, scheduled to go, with the replacement named |
| **Removed** | no longer accepted. For a frozen construct this is a **Language** change with a migration, never a silent drop; for an **experimental** construct it may be a plain removal |
| **Fixed** | engine, tooling or documentation defects, including specification/implementation discrepancies resolved |
| **Experimental** | anything outside the compatibility promise. Kept in its own category so a reader building on the frozen surface can skip it |

**This file is the release narrative, not the migration authority.** When a
change requires documents to be rewritten, the mechanical rewrite rule and its
named diagnostic live in [`spec/migrations.md`](spec/migrations.md); the entry
here links to it and does not restate it.

Statuses referred to above are defined in [`spec/README.md`](spec/README.md).

## Unreleased

Nothing yet.

## v0.2.0 — 2026-08-12

**Language version: `0.2`.** The first minor release, and the first time the
language number has moved. It **adds** and removes nothing: every document
that declares `figdown 0.1` parses to exactly the same model under this
release as under v0.1.8, and every `figdown 0.1` conformance golden passes
unmodified. Nothing needs rewriting.

**Language — the `statechart` genre, EXPERIMENTAL.** A figure whose nodes are
*states* — modes a machine is in — and whose edges are *transitions* can now
say so on line 1:

    figdown 0.2 statechart

The genre uses the same `group`, `class`, `flow` and `rank` every scene figure
uses, with the same meanings and the same default left-to-right flow. What it
adds is a **reading**: under `statechart`, a node is a state rather than a
step, a connector is a transition on an event, its label is that transition's
trigger and guard as free text, and a self-loop means the event happens and
the machine stays where it is. Under `flowchart` that same self-loop means
something else entirely — "not ready, check again" — and that difference is
the reason the genre exists.

**Each scene genre now uses its own domain's words for the two things every
figure is made of.** A figure is nodes and the lines between them, and the
word for each depends on what kind of figure it is:

| genre | the thing | the line |
|---|---|---|
| `block`, `topology` | `node` | `edge` |
| `flowchart` (at `figdown 0.2`) | `node` | `flowline` |
| `statechart` | `state` | `transition` |

`block` and `topology` are unchanged at every version. In the other two, the
word being replaced is an error that tells you which word to write and why —
you cannot get this wrong silently. Everything else is identical: the same
operators, the same labels, the same options, the same meaning. ISO 5807 calls
a flowchart's connecting line a *flowline*; UML calls a state machine's arc a
*transition*. Those are the words the people who read these figures already
use. The mechanical rewrite and its diagnostics are in
[`spec/migrations.md`](spec/migrations.md).

**The flowchart rename is gated by the language version, and the promise this
release makes was deliberately kept rather than quietly broken.** An earlier
step in this cycle applied the rename to *the language* instead of to a version
of it, which stopped documents that were legal at v0.1.8 from parsing. That was
a compatibility break in a `Y` release, and it is corrected here:

| declares | `edge` | `flowline` |
|---|---|---|
| `figdown 0.1 flowchart` | **legal** | version error, naming the fix |
| `figdown 0.2 flowchart` | wrong-word error | **legal** |

`statechart` needs no gate: the genre itself requires `figdown 0.2`, so its
vocabulary is unreachable from `0.1`. Writing `flowline` in a `figdown 0.1`
document reports that it requires `figdown 0.2`, that `figdown 0.1 flowchart`
spells this `edge`, and that the fix is to raise the header or write `edge` —
a one-step repair, named in the message.

Why not accept both spellings under one version? Because two forms of one
construct are justified only when each accepts input the other cannot express.
`edge` and `flowline` accept exactly the same input, so under a single version
one of them is a spelling variant and must be retired — and a retired spelling
becomes a line error that names its migration entry, so neither silent
acceptance nor silent rejection is available. Two spellings across *different
versions* is not a variant at all; it is ordinary language evolution, and each
version accepts exactly one.

**`edge` under `figdown 0.1 flowchart` goes away at v1.0, and not before.**
Only a major version may remove, so the dual support ends by version rather
than by mood: no `0.x` release may drop it, and when it goes it goes as a
scheduled act with its own migration entry and a named diagnostic. Write
nothing new against it — a new flowchart figure should declare `figdown 0.2`
and spell the connector `flowline`. Thirteen documents in this repository were
raised to `figdown 0.2` accordingly, plus eleven documentation fences.

**`node` stays in `flowchart`, and that is not an inconsistency.** A statechart
has exactly one kind of node, so `state` gives up nothing. A flowchart has
many, so it keeps a word for the stage whose kind is not stated. Two domains,
two different facts, the same rule.

**But what that word means has been corrected, and the old reason is
withdrawn.** Since `process`, `decision` and `terminator` were adopted, a bare
`node` in a flowchart was justified as the spelling for a symbol FigDown has
no word for. That was wrong, and it was wrong in a way this project refuses
everywhere else. ISO 5807 is a complete symbol set — this repository's own
record enumerates sixteen of its names, twelve stage symbols and four line
symbols, not the "around ten" previously claimed — so "none of the three" is
not a fact about your figure. It is a **coverage gap in FigDown**, and
recording it as a bare `node` disguised a gap as an authorial judgement.

A bare `node` under `flowchart` now has exactly one meaning: **the source does
not state the role.** That is permanent, it is the transcriber's honest case,
and it is the same rule as `*` for an unstated length — ISO is a drawing
standard with no "unspecified", but FigDown separates role from geometry and
so is able to say "I was not told, and I must not invent one."

**In a flowchart, prefer a role**, and write `node` only when the source
genuinely does not say. When you write `node` because FigDown has no word for
the symbol you are transcribing, do three things: write `node`; name the ISO
symbol in a `#` comment on the same line, which is never parsed and never a
second channel of meaning —

    node cfg "Read config file"   # ISO 5807 Data (input/output) — no FigDown role

— and report the gap, so it is counted rather than absorbed. Of the eighteen
flowchart documents in this repository, not one such comment existed before
this release.

**No new role was added, and the bar for adding one is stated rather than
felt.** The two live candidates are ISO's *Stored data* and a comment or
annotation symbol; each names the measurement that would settle it. Every
other symbol was measured and argues against itself — twenty-three
preparation-shaped stages are all drawn as plain steps, and across 3266 nodes
and 2684 edges there is not one fork, join or merge.

**What this costs, said plainly.** Reclassifying a flowchart as a statechart
used to be a one-line edit. It now rewrites every connector line. That was a
deliberate trade: the one-line convenience was bought by having two genres
spell two different things with one word. `tools/migrate-figdown.js` does the
rewrite for you, scoped by each document's declared genre, so your `block` and
`topology` figures are left untouched.

**One error message changed wording.** A second `flow` line used to report
`duplicate flow line`, which now reads like "a duplicate flowline" — a thing
that is not an error at all. It reports `duplicate flow directive` instead.

**Why the header and not the drawing.** The obvious alternative is to
recognise a state machine by its shape, and it was tried and measured. Every
state machine in this project's corpus contains a cycle — and so do half the
figures that are not state machines; in a larger production corpus only about
one in four cyclic flowcharts is a state machine. Self-loops appear in one
figure out of five. Worse, the figure the shape test most reliably
misclassifies is a retry loop, which is exactly the figure a state-machine
reading would get wrong. The title does not help either: "State Machine" in a
title is routinely a polling flowchart. Only the author can say which kind of
figure this is, and line 1 is where they say it.

**Deliberately not included.** There is no vocabulary for an initial state, a
final state or a state hierarchy, and no reader may infer one from a figure's
shape. There is no change to how anything is laid out or drawn: the five
figures in this repository that became statecharts render identically to
before. This release makes the distinction *expressible*, and stops there.

**No `start` keyword, and the usual argument for one rests on a false
premise.** It is often said that `terminator` names the *end* and so leaves
the start unspelled. ISO 5807 says otherwise: its Terminator is an exit to or
an entry from the outside of the procedure — a start, an end, or a halt — one
symbol for both ends, told apart by its label text. So there is no word to
borrow, and this project does not coin one. A reader without the word answers
"unstated", which is safe rather than wrong. What would reopen it is measured
evidence that readers name the *wrong* terminator as the start; that it would
be convenient, or that other tools have one, would not.

**Two states with the same label are two states, and the language cannot yet
say otherwise.** FigDown has no way to assert that two elements are the same
entity — `class` asserts a shared category, not an identity — and that gap
had been filed separately in three places that did not name each other. They
now cross-reference, and the `statechart` genre gains a reading rule for it:
a reader must report two states, may note that the labels match and that a
comment or class meaning claims they are one, must attribute that claim to the
prose rather than to the model, and must neither merge them nor read distinct
ids as states known to be *different*. The showcase TCP figure is the live
instance — it declares twelve `state` lines for TCP's eleven states because
the RFC's own figure draws CLOSED twice. Merging them was tried and rejected
on readability evidence, so that figure is recorded as evidence the primitive
is missing, not as a workaround that makes it unnecessary. The question stays
open; this release only stops it being answered by accident.

**Marked experimental, and here is the honest reason.** Three documents out
of ninety-one in the production corpus are state machines. That is a thin
basis for a genre, and this is the first one this project has added ahead of
its evidence. Experimental status is what makes that reversible: withdrawing
it would cost a document its two renamed words and its header line, which
`tools/migrate-figdown.js` can undo as mechanically as it applied them, and
nothing else in the language would have to change. If a re-measurement shows
those figures were not representative, withdrawal is the right answer.

**Reading `figdown 0.1` documents.** They are unaffected and should stay as
they are. Declare `figdown 0.2` only in a document that needs `statechart` —
a lower declaration is read by more engines. In a file with several sections,
each section declares its own version, so a `statechart` section can sit
beside a `figdown 0.1 table` section in the same file.

**An engine that only knows `figdown 0.1`** — including the archived v0.1.0
page — will reject a `figdown 0.2` document by name rather than guess at it.

**A multi-genre file was always legal, and three normative sentences said it
was not.** `spec/core.md`'s genre-namespace guarantees G1, G3 and G7 said
"document" where the language means "section". Read literally, G1 gave a file
one keyword namespace and so prohibited something the engine has always
accepted: a `figdown 0.1 block` section followed by a `figdown 0.1 flowchart`
section builds clean and reports one artifact. All three now read per section.
G3 additionally names the two mechanisms apart — **composition** is the nested
genre case, a second `figdown` header is the **section** case, and one file may
use both. G7 states that the layout zone is per section, so a `pin` naming an
id declared in another section answers `pin of unknown id "<id>"`.

Nothing to rewrite: the correction removes a prohibition and adds none. It is
recorded rather than fixed silently because a normative sentence that forbids
supported behaviour is the same class of defect as a wrong diagnostic — an
author who believes it writes two files where one would do, and an implementer
who reads it may enforce it. `.fd` → `.svg` stays one-to-one whatever the file
holds.

**Added — `title` now migrates mechanically.** `title` has required a quoted
string for many increments, so a figure transcribed before that does not build
at all, and until now the entry that retired the bare form left the repair to
the author. `tools/migrate-figdown.js` does it: it takes the line's text after
`title` as the engine saw it — comments are scanned first, so a trailing
`# note` stays a comment and is never pulled inside the quotes — and wraps
that in `"`. Unlike a bare block label there is nothing to arbitrate, because
`title` takes one positional string and no option keys, so the whole remainder
of the line is the title.

    title TCP Header        →  title "TCP Header"
    title A # note          →  title "A" # note

**It refuses rather than guesses** when the bare argument contains a `"` or a
`\`. Quoting either blind changes the rendered text — an inner quote has to be
escaped or dropped, and a backslash starts an escape — so the tool reports the
line and names the entry to read, and leaves the file alone.

**Fixed — two checks were reporting success for work they had not done.**

**The engine's version constant is correct again.** The engine stamps its
version into every artifact it builds, and that attribute is the only
machine-readable handle a reader has on which engine reproduces a figure. The
constant had been left three source states behind — one of which changed
parsing outright — so all 56 shipped artifacts named an engine that would not
necessarily have produced them, and nothing failed: every existing check
compared the engine copies against each other, and none against the tree. A new
check now holds it to the newest migration entry and requires all four engine
copies to agree. **It runs in the development repository and is not among the
gates here**: the constant is rewritten to the release number when this tree is
built, so the rule it enforces — the constant equals the newest entry the log
reached — is true only where the engine is edited.

`gate:layout` now recurses and always states its coverage. It searched a
hard-coded list of directories, so `examples/statechart/`, `examples/showcase/`,
`examples/reference/` and `examples/layout-compare/` were never opened by it at
all — it scored 22 figures out of the 56 that exist and reported no skips,
because it had never counted the 34 it could not see. Fifteen more of the 22 it
did open were dropped silently, so a figure the tool could not read produced
output identical to a figure with no defects. It now walks recursively from the
project root, names the roots it searched and the roots it deliberately does not
judge, prints considered/scored/skipped with a reason breakdown whether or not
any count is zero, refuses a non-`.fd` path by name instead of parsing markup as
FigDown, and runs strict.

**Also.** `read/0.2/` is the reading contract for the new language version
and is now the live one; `read/0.1/` stays exactly as v0.1.0 published it.

**Nothing moved on the canvas.** Every figure this release rewrote renders
byte-for-byte as it did before — the words changed, the drawings did not.

## v0.1.8 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

FigDown documents are UTF-8, and the conformance suite carries Chinese
precisely to prove non-ASCII is supported — but the engine sized every text
box by counting characters and multiplying by one constant. That constant is
a Latin average: about 0.554 em per character. A Chinese character advances a
full em. So a Chinese label was given a box a little over half the width it
needs, and the engine drew the text outside the box it had just sized for it.
`node a "封包進入交換器的轉發流程"` asked for a 114 px box and needed 184,
overhanging roughly 35 px past each wall. The suite's own UTF-8 case was
drawing its label outside its box, through every release since the first.

Text is now measured with a script-aware advance. The width classes come from
Unicode East Asian Width — a fixed character property, so the measurement is a
lookup by codepoint range: no font-metrics library, no measurement at draw
time, and the same answer on every machine. The weights are measured rather
than chosen, by rendering probe strings in the font stack the engine actually
names and reading back the advance: an ideograph, kana, bopomofo, a fullwidth
letter and the ideographic space all come to exactly one em; emoji to 1.245
em; combining marks and zero-width formatting characters to zero. Characters
whose width is *ambiguous* under that standard — the section sign, the em
dash, arrows, the check mark — stay narrow, which is the conventional reading
outside an East Asian context.

The same measurement is now used everywhere text is sized: node labels and
their shrink-to-fit, edge labels, table cells, bitfield field captions,
timing signal names, legend rows and the title. A fix in one place would have
left the defect alive where it is less visible.

Every character below U+0300 weighs exactly one, so an all-ASCII string
measures exactly as it did before. No figure in this repository changes its
drawing; all 55 artifacts are regenerated and differ only in the engine
version they record.

This makes the measurement true. It does not wrap lines — a long label is
still one line, now in a box the right size for it.

## v0.1.7 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

Two drawing conventions the auto-layout was violating are corrected; the
engine owns drawing conventions, so no document changes and no keyword
appears.

A self-transition — an edge from a state to itself — was routed through the
same side channel as long return edges, so it could lap the entire figure:
the turnstile example drew LOCKED's `push` loop around both states, asserting
a path the machine does not take. It is now what every drawing tool draws: a
small loop on one side of its own state, label beside it, on the first side
(right, left, bottom, top) where it overlaps nothing.

An edge that crosses several ranks used to pick up a bend at every rank — a
drift clamp allows only a few pixels of sideways travel per rank, so a run
that wanted to move 35 px sideways drew a nine-segment staircase. An interior
bend now survives only if removing it would make the edge pierce a node, or a
group box the edge neither starts nor ends inside. A line through a group
interior would assert a membership the figure does not declare, which is why
the group clause is part of the rule and not an optimisation.

Six figures redraw (the turnstile statechart, three flowcharts, the packet
ingress pipeline, and the auto-layout fabric comparison), with fewer bends
and no new line through anything; the remaining artifacts change only in the
engine version they record. Routing changes of this kind are placed upstream
of the engine's label and arrowhead machinery, which places both from final
geometry — the reason labels and arrows follow their edges through this
change.

## v0.1.6 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

Table cells and bitfield fields were each drawn as their own stroked box, so
every interior boundary was painted twice and whichever paint came second won.
That made a boundary's appearance an accident of document order, and it cost
more than tidiness: a conditional field's dashed boundary was overwritten solid
by an ordinary neighbour, and the dash is the only thing that says a field is
conditionally present. A figure was quietly disagreeing with its own source.

The grid is now emitted edge by edge, once per edge, and each edge is decided
by the cells on both sides of it. An edge is dashed if either neighbour is
conditional. A cell's own colour is drawn as a solid ring inside that cell
instead of on the boundary, so two adjacent marked cells both keep their
colour, and a field carrying both a colour and a condition shows a dashed
boundary and a separate coloured ring rather than a coloured dash. Ring ends
pull in only where the cell that owns them actually stops, so a mark spanning
several cells draws as one unbroken ring and never protrudes past its own cell.

Giving each side half the boundary was tried first and measured at the size
figures are read at, not zoomed: at 1× two half-width strokes land on
quarter-pixel offsets and average into one muddy pixel, losing one of the two
colours outright. The inset rings land on whole pixels and every colour
survives.

One ambiguity is left rather than claimed solved: a dashed edge between a
conditional field and a plain one reads locally as if both were conditional.
The previous drawing had the same ambiguity whenever the dash happened to win.
Every figure containing a table or a bitfield redraws — 27 of them — and the
remaining artifacts change only in the engine version they record.

Separately, the QUIC example was drawing a false offset map and is corrected.
A QUIC long header is not word-aligned: Version begins at bit offset 8. The
figure ended the drawing row after the first byte, which left 24 bits blank and
pushed every offset below it 24 bits too high — a reader computed DCID Length
at byte 8 when it is at byte 5. The row break is removed. Blank space is not a
placeholder: the same figure fabricates six widths and declares that it does,
in the model, where a reader can discount it, whereas empty cells inside a
header row declare nothing and are simply believed. Five fields now wrap with a
continuation mark, which is what a format that is not word-aligned looks like
on a fixed word grid.

## v0.1.5 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

The skill shipped as a directory to copy. That still works and stays
supported, but it could not be installed through the plugin mechanism and
could not be submitted anywhere. Two manifests fix both without a second copy
of anything: the plugin manifest's skills path resolves to the directory
already documented, and the marketplace entry's source is this repository
root. Nothing is duplicated, so nothing has to be kept in sync.
`/plugin marketplace add FigDown/figdown` works from this release.

A gate now guards the joins rather than the bytes, since a wrapper cannot
drift in content: one release number across three files, a skills path
resolving to exactly one skill, the source still the root. The failure it
exists for is silent — a plugin with a missed skills path installs perfectly
and teaches nothing.

The elision strip's dotted side lines are drawn unconditionally again,
reversing a ruling in v0.1.0 that suppressed them when the strip spanned the
whole word. That reasoning established what the marks MEAN — which columns
are elided — and never asked what they DO. Their second job had never been
written down: they make the gap read as part of the figure. Without them a
full-word elision is two bordered boxes with whitespace between and a small
grey ellipsis floating in it, which reads as an artefact rather than a mark.
Two figures redraw.

(v0.1.4 was prepared and never published; its contents are in this release.)

## v0.1.3 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

A gallery on the front page put two figures side by side, so one rendered at
37% of its natural size and its table text landed near four pixels. A figure
whose text cannot be read demonstrates nothing, and on a front page it argues
against the tool rather than for it. The gallery no longer juxtaposes: the
wider figure takes the full column alone at native size, and the second became
a line and a link, because 1243 by 832 with four sub-figures needs a page
rather than a slot.

## v0.1.2 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

The skill gained the process around drawing, which had been missing entirely:
take the structure out of a source rather than reading its picture, since a
container ships the drawing twice and the render is not the source; let the
extraction choose the genre; keep what the source states apart from what you
concluded. And the step that did not exist — diff the `.fd` against the
extracted structure, because an invented node and a dropped edge are both
invisible in a picture that looks fine, then look at the render. A process
whose last step is "write the file" has no way to fail.

Both front doors illustrated a standard that claims to cover what a flowchart
tool cannot express with a diagram any flowchart tool draws. The worked example
is now a protocol header, spliced in by byte so its claim of completeness is
checkable.

The publish pipeline now asserts the files the published tree owns outright.
`CNAME` was the one that mattered: it had no source, no generator and no gate,
so nothing could lose it — and nothing would have noticed if something did.

## v0.1.1 — 2026-08-11

**Language version: `0.1`.** Patch. No language change.

v0.1.0 stated in this repository that each released version's entry links its
tag and its runnable engine page, and then shipped without such an entry. This
release meets that obligation: `archive/0.1/figdown.html` is the engine v0.1.0
shipped, byte-identical to what anyone who installed that release ran, served
at an address that does not move.

`gate:archive` asks two questions that are not the same one: that generated
content still matches its generator, and that every archived version is
byte-unchanged from the release that shipped it. It fails on modification and
on deletion, because a manifest that notices only edits is blind to the
likelier accident.

## v0.1.0 — 2026-08-11

**Language version: `0.1`.** The first release of the FigDown standard.

The frozen core framework; three frozen genres (`block`, `bitfield`, `table`);
the normative semantic model and its reading-agent contract; the conformance
corpus; the reference engine and browser editor; the command-line tooling; and
the agent skill.

**Language `0.x` is a preview and is NOT stable** — see
[Stability](README.md#stability--read-this-before-adopting). "Frozen" names the
scope of the change-management promise, not the absence of change.

Detail is filled in when the release is cut.

<!--
Entries below this line are added at release. Categories in the order given in
"How to read an entry"; omit any that do not apply.

### Language
### Added
### Changed
### Removed
### Fixed
### Experimental
-->
