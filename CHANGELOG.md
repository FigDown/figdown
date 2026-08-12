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
