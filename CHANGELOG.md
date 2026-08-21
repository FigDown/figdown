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

## v0.5.0 — 2026-08-21

**Release `v0.5.0`, language version `figdown 0.5`.** The fourth `Y`: new
language surface is added and nothing is removed. Every `figdown 0.1` through
`0.4` document parses to the same model it always did. Five behaviour
corrections act on documents that never change their header — all five are
listed under *Upgrading* below. This is also the first release whose archive
carries more than an engine page.

**Language — a connector may be named:
[`id=`](spec/core.md) on the four scene connectors, requires `figdown 0.5`.**
`edge`, `flowline`, `transition` and `message` accept a trailing, keyword-only,
optional `id=`, unique within its section and sharing the section's existing id
namespace. The key is a **handle and nothing else**: naming a message asserts
no order, no equivalence and no identity across a branch boundary, so
`sequence`'s total order is still declaration order and its no-restatement rule
is untouched. `figdown 0.5` adds **no genre** — its genre table is a copy of
`0.4`'s, and the language number moves for one option key, which is what a `Y`
is for. A document that writes `id=` under `figdown 0.4` gets a line error
naming the version and the one-step fix.

**Language — the rule behind the version gate is restated, and one sentence is
withdrawn.** `spec/core.md` §13.7.2 said a key that had never been spelled
before "would carry no such risk and would need no gate". Every prior gated
change contradicts it — two connector keywords, two genre tokens and one option
key were all gated, and the only ungated change added no spelling at all. The
sentence is **withdrawn, kept visible in place**, and replaced by the rule the
record actually shows: **the gate engages on adding a spelling to the accepted
surface, never on what the spelling used to mean.**

**Language — three consumers land with the handle.** A `bundle` member may now
be a connector id as well as an endpoint pair, in the same comma list;
[`figdown-diff`](tools/figdown-diff.js) pairs identified edges by id in a pass
ahead of its tuple passes, leaving anonymous edges to the three conservative
passes they already had; and every rendered connector carries `data-edge` —
the authored id where it has one, the source line where it does not.

**Changed — a source character XML forbids is a line error.** An adversarial
probe of every label surface found no escaping hole and one defect that was not
an injection: a raw code point XML forbids passed through the parser, rendered
clean, and produced an `.svg` that no conforming XML reader will open. The
parser now refuses the document, names the code point, and renders nothing —
an artifact that cannot be well-formed is not an artifact. The reasoning, the
threat model and what is deliberately left unspecified are new normative text
at [`spec/core.md` §15](spec/core.md), with a gate
([`tools/safe-svg-check.js`](tools/safe-svg-check.js)) that measures every
shipped artifact against the Safe SVG profile rather than asserting it.

**Changed — a `bundle` member is stated once.** A member repeated in one member
list used to draw a two-member bundle over a single link. It is now a line
error, bound to the resolved link rather than to the spelling, so the two ways
of writing the same member collide too.

**Changed — one paint channel, one class.** `class=` is multi-valued, and where
two carried classes both declared the same channel (`fill`, `stroke` or
`style`) the engine silently drew whichever was written last. That is now a
line error. Classes that **partition** the channels stay exactly as legal as
they have always been; the rule fires only on a channel two classes both claim.

**Changed — a lasso may ring only what it collects.** A `bundle`'s ring is the
drawn extent of its member links, so a node drawn wholly inside it is drawn as
one of them. In two tiers, inheriting the group band's own principle — whoever
chose the position bears the responsibility: where an author coordinate put the
bystander inside, the engine reports on the `bundle` line and writes no
artifact; where no author coordinate is involved, the separation pass moves the
bystander clear before anything is drawn and reports only when there is nowhere
to move it to.

**Changed — a typed block's canvas covers its own title.** The canvas a
`bitfield`, `table`, `timing` or `chart` section returns is now the union of its
data extent and its title's extent. A title wider than the data used to run off
the right edge of the section it names. `pin width=`/`height=` stays refused for
a typed block: the author states the title's text, the engine owns how much room
the drawing gives it.

**Fixed — a pinned state keeps its self-transition.** A self-transition on a
pinned state collapsed to a zero-length line at the state's centre and printed
its trigger label across the state's name, so pinning silently deleted a
construct the language grants. A self-loop now draws the same way whether its
state's coordinate came from a pin or from the layout pass, on the same side
selection as before.

**Changed — a port is drawn as a fitting on the border it belongs to.** The
`topology` genre's interface names sit in the border crossing as a drawn
fitting rather than as free-floating text near the box, so a reader can tell
which side of which device an interface is on without tracing the line.

**Added — the editor becomes an editor.** The GUI edit path is now a single
transaction — one parse, one model edit, one re-render — instead of a sequence
of writes any one of which could leave the document half-changed. On top of it:
a **property inspector** for the selected element; **parametric GUIs** for
`table` and `bitfield`; **multi-select** with align, distribute and duplicate,
all section-aware; and a **source pane** whose highlighting is driven by the
keyword registry rather than by a second hand-kept copy of the grammar. Edge
editing calls the same connector grammar the parser does, so the two can no
longer disagree.

**Added — the archive freezes the suite and the spec, from this release
forward.** `archive/<X.Y>/figdown.html` answers "which engine drew this?"; it
never answered "what was a conforming implementation of `figdown X.Y` required
to do?" or "which words fixed what this document means?", and neither question
could be answered from a live tree, because `conformance/` tracks the
development language and `spec/` is edited continuously. This release freezes
both beside the page — `archive/0.5/conformance/` and `archive/0.5/spec/` — held
byte-for-byte by `archive/MANIFEST.tsv` and its gate. The mechanism is
**forward-only**: `0.1`–`0.4` are released trees, and adding files to a released
archive is rewriting it, so their suite and their spec text are reached through
their release tags, which the stability promise already guarantees. The gap is
real, it is named where a reader will look for it, and it closes by itself as
versions ship.

**Added — the reading contract for `figdown 0.5`,
[`read/0.5/`](read/0.5/reading.md), frozen at this release.**

**Added — [`PROOF.md`](PROOF.md): check this project instead of believing it.**
Every claim this repository makes about itself is listed beside the command that
decides it, and the page is generated from the tree it ships in, so a claim
whose evidence moved cannot quietly keep standing.

**Upgrading.** Raise a document's header to `figdown 0.5` only to use `id=` on a
connector. Five checks act regardless of header, and each names its own fix: a
source character XML forbids is refused (remove the code point the error names);
a `bundle` member repeated in one list is refused (state it once); two carried
classes claiming one paint channel is refused (split the channels, or carry one
class); a `bundle` lasso that would enclose a non-member is refused where an
author coordinate put it there (move the pin clear, or state the membership);
and a typed block's title now widens its own section, which changes no meaning
and may change a figure's width. Full details:
[`spec/migrations.md`](spec/migrations.md).

## v0.4.1 — 2026-08-18

**Release `v0.4.1`, language version `figdown 0.4`.** A patch release: the
language does not move — no `.fd` gains or loses a spelling, every conformance
golden passes unmodified, and `read/0.4/` is reused byte-for-byte. What ships
is a **rendering repair line**, seven batches of layout and legibility work
driven by a figure-by-figure review of the whole corpus, plus two behaviour
corrections that act on documents without touching their headers.

**Changed — the renderer asks better questions before it draws.** Seams
between ranks and groups are sized to the ink that must live in them (labels,
lassos, captions), so construct-dense figures stop piling into a few pixels.
Endpoint labels anchor a fixed distance from their own port instead of a
fraction of the span, so short edges keep their labels at their ends. A note
must be *discriminably* adjacent to its target or it takes a drawn leader, and
notes associated by adjacency alone open with their target's name in bold.
Element labels join the set that edge routing avoids. A bundle's lasso orients
by its members' direction — narrow along the links, long across them — and a
one-link bundle draws its caption without a ring. Long edges pick the free
side of the figure; parallel returns to one target take distinct lanes; three
or more same-meaning returns may merge onto one labelled trunk. The `topology`
genre adopts the port convention: interface names sit inside the device box at
the border crossing. Reciprocal message pairs run antiparallel-adjacent.
Crowded unclassed lines pair with their labels by muted tone — four hues a
just-noticeable difference apart, deriving no legend entry and stating no
meaning. Chart captions lean out of the bars' footprint; band captions clear
their node's label; `state` derives its rounded geometry from the word.

**Changed — two behaviours, neither version-gated.** A `pin` that makes one
node's box cover another **completely** is refused at geometry time when the
covered position was chosen by the engine — a cover both of whose boxes are
pinned is the author's paint-order statement and still draws, and partial
overlap never errors. And `sequence`'s no-restatement rule is now
operand-scoped, which only legalises: two mutually exclusive branches may both
end in the same state, because at most one of them occurs.

**Corpus.** The bundled examples were reviewed figure by figure and repaired
alongside the engine: the RPF check is now a fully automatic flowchart, a new
`block-c` pattern demonstrates a right-to-left response path, and the
reference topology's peer group joined its subject. The layout gate's floor
residue fell from seven flagged labels to one across the whole corpus.

**Upgrading.** Nothing to do. Figures re-render with the improvements on the
next build; no source changes are required or implied. Full details:
[`spec/migrations.md`](spec/migrations.md).

## v0.4.0 — 2026-08-17

**Release `v0.4.0`, language version `figdown 0.4`.** The third `Y`: new
language surface is added and nothing is removed. Every `figdown 0.1`, `0.2`
and `0.3` document parses to the same model it always did. Two behaviour
corrections act on documents that never change their header — both are listed
under *Upgrading* below.

**Added — the `sequence` genre (experimental, requires `figdown 0.4`),
[`spec/genres/experimental/sequence.md`](spec/genres/experimental/sequence.md).**
A ladder: participants are columns, time runs down the page, and **declaration
order is the time order** — a message's place in the source *is* its place in
the exchange, so nothing rides on label-numbering conventions. Five keywords,
every one taken from OMG UML 2.5.1 clause 17 (standing on ISO/IEC 19505-2
clause 14): `lifeline`, `message`, `state`, `fragment`, `operand`. A
`fragment` carries one of UML's twelve interaction operators in a mandatory
`type=`; `in=` states containment at five acceptors with nesting capped at one
level; the order model is deliberately **stronger than the source standard's
partial order**, and the genre document declares that divergence rather than
hiding it. No activation bars, no new option key, and three constructs the
design refused (`gap`, `group`, `lost=`) answer with named errors that say
what to write instead. Worked figures at
[`examples/sequence/`](examples/sequence/index.md) — the RFC 2131 DHCP lease
ladder and a twelve-operator tour.

**Added — the `figdown 0.4` reading contract, [`read/0.4/`](read/0.4/reading.md),
frozen at this release.** Written from `read/0.3/` with one correction the
[errata register](spec/ERRATA.md) has owed since three frozen trees shipped it:
the layout zone is ignored by **namespace membership, never by textual
position** — a `pin` before the `layout` line is ignored on the same terms as
one after it.

**Changed — the group band now means membership, in both directions.** A
`group`'s band contains every member and nothing else. Where auto-layout has
freedom, members are placed contiguously, silently. Where the author's `pin`
forces a non-member inside the band, the engine reports a geometry-time error
naming the pin line and renders nothing — it will not draw a membership the
source does not state. One bundled comparison figure's auto arm now
demonstrates exactly this refusal, and its artifact is removed rather than
left as a picture the engine calls false
([`examples/layout-compare/`](examples/layout-compare/)).

**Changed — the class-channel rule reaches every collection, and half of an
older rule retires.** A class that declares `fill=` and is joined by a member
with no interior (an `edge`, a `message`) is the same line error everywhere it
can occur. A class that declares a **meaning and no paint at all is now legal
on every member** — it draws its meaning in the derived legend with no swatch
— which only legalises: nothing that parsed before fails now, and the old
paint-less error is retired on its own obsoleted premise.

**Added — [`spec/standards-claims.tsv`](spec/standards-claims.tsv) and its
gate.** Every claim this repository makes about an external standard — what
ISO 5807, UML 2.5.1, a YANG RFC or an IEEE schema says, names, or lacks — now
needs a register row carrying its kind and its evidence, and the gate fails a
claim with no row. The register was seeded by an audit that read the source
texts; the corrections it forced are in this tree.

**Added — the cold-reader comprehension baseline crosses its floor.** The
suite ([`tools/comprehension-check.js`](tools/comprehension-check.js)) now
covers eight genres and nine figures; corpus raw comprehension stands at
**71.8%** against the 70% floor, and the new genre measures **85.4% raw /
91.5% adjusted** against the 80% bar it was commissioned under — readers who
have never seen the spec, reading `.fd` source alone.

**Upgrading.** No document changes its meaning by keeping its header. Two
checks act regardless of header: a `pin` that forces a non-member inside a
group band is now an error (move the pin clear, or state the membership with
`in=`), and a class declaring `fill=` joined by an interior-less member is now
an error everywhere (add `stroke=` to the class). Raise a document's header to
`figdown 0.4` only to use the `sequence` genre. Full details:
[`spec/migrations.md`](spec/migrations.md).

## v0.3.2 — 2026-08-15

**Release `v0.3.2`, language version `0.3`.** A patch release: the language does
not move — `figdown` stays `0.3`, no `.fd` source changes, every `figdown 0.1`,
`0.2` and `0.3` conformance golden passes unmodified, and the engine
([`editor/figdown.html`](editor/figdown.html)) is **byte-identical to v0.3.1**,
so every figure renders exactly as it did. **There is no rendering change.** What
ships is the standard's **first normative constraint on human readability**.

**Added — a legibility floor, [`spec/core.md` §14](spec/core.md).** The floor is
a MUST-NOT list of renderer *output* constraints, each decidable from the emitted
SVG alone and never touching the author's meaning. It is deliberately **not a
fourth promise** beside COMPATIBLE / REPRODUCIBLE / AVAILABLE, and a boundary
(§14.4) names what it does not cover: a floor is never a ceiling. Its first and
only rule, **F5 — label-association margin**, forbids an edge label whose
distances to its nearest and second-nearest distinct edges differ by less than
**M = 4 px**, measured from the label box centre — the geometry under which a
reader cannot tell which line a label names. Four filters keep the predicate
honest, so only genuine edge labels are ever charged.

**Added — `gate:layout` measures F5 as an advisory ratchet.**
[`tools/layout-lint.js`](tools/layout-lint.js) computes F5 as a named axis
*outside* the score and prints its count every run against a checked-in
per-figure baseline (currently **9 labels across 6 figures**, every one in a
figure still under layout repair). The gate **fails only on regression** — a
currently-clean figure that gains its first F5 defect, or any figure whose count
exceeds its baseline — so a new ambiguity is caught the moment it lands while the
filed residue is never masked as clean. When the baseline reaches 0, F5 becomes a
hard `--strict` zero and the ratchet retires.

**No `spec/migrations.md` entry, and no new author-facing spelling.** A normative
constraint on renderer output and a gate axis are not a change to the language a
`.fd` author writes, so — on the precedent for spec-only rulings with no engine
source-state change — the public migration log does not move. The internal ruling
ledger records the floor as its current watermark; that ledger is working record
and is not published.

## v0.3.1 — 2026-08-14

**Release `v0.3.1`, language version `0.3`.** A patch release: it is **rendering
and tooling only**. There is no **Language** section, because the language does
not move — `figdown` stays `0.3`, no `.fd` source changes, every `figdown 0.1`,
`0.2` and `0.3` conformance golden passes unmodified, and the frozen reading
contract [`read/0.3`](read/0.3/) is reused byte-for-byte. The same figures are
drawn better, and four new gates check things prose alone could not.

**Fixed — three or more edges into one target are drawn as one merge bus.** A
target reached by three or more edges that carry the same label used to be drawn
as that many separate lines, arrowheads and copies of the label; it is now a
single shared rail into one trunk with one arrowhead and one label. The bus is
adopted **once per figure and all-or-none** — a drawing never mixes a merged
convergence with a fanned one — and there is deliberately no per-edge override.
Alongside it, a **spine-priority straightening pass** holds a deep decision
spine in one column instead of letting it staircase across the page: the
eleven-branch reference fixture goes from **2208 px wide to 854**, with its
waypoint columns still fully reserved.

**Fixed — an edge label is placed to say which line it belongs to.** The rule
that let a label lie free across its own line is removed, and the metric that
judged placement is corrected — it had read multi-line labels as empty and every
label as left-anchored, so it could not see half of what it was scoring. On the
corrected reader, label strikes across the example corpus fall **256 → 180**
(`tcp-state-machine` 12 → 1, `srl-evpn-irb` 6 → 0, `packet-ingress` 4 → 0).
Back-edge **return lanes** land with it, and the two labels of a bidirectional
pair now sit on opposite sides: `bfd-session` goes from **`coincident` 2 to 0**
under a stricter metric.

**Fixed — a pin on a group member lands where written.** A `pin at=(400,80)` on
a member of an unpinned group used to be offset by the group's auto-layout
extent, so it landed at `min_auto_x + 400` rather than at canvas `400` and
drifted under edits it did not name — the one thing a `pin` exists to prevent.
A member of an unpinned group is now placed in canvas pixels exactly like an
ungrouped node; a member of a pinned group is unchanged.

**Added — a Model Context Protocol server, and a namespace gate.** A new
[MCP server](integrations/mcp-server/README.md) (`figdown-mcp`) carries FigDown
to agents that have no checkout, skill or shell; it adds **no fifth engine
copy**, reaching the engine only through `dist/figdown.js`, and `gate:mcp`
exercises it as a real subprocess over stdio. `gate:namespace` joins the gate
list, holding the layout namespace to one membership across the specification
and the engine. Two further checks — that every decision citation resolves to a
real ruling, and that every erratum entry matches the frozen files it corrects —
run in development, where the internal ruling ledger they read lives; that ledger
is working record and is not published, so those two checks are not among the
gates in this tree. (A shared recursive corpus walk, `tools/lib/corpus.js`, now
backs every corpus gate, replacing the hand-copied non-recursive directory lists
that had drifted between them.)

**Fixed — a frozen reading contract found wrong is corrected by *erratum*, not
by editing frozen bytes.** [`spec/ERRATA.md`](spec/ERRATA.md) is a new register,
and its first entry **E1** records that the layout namespace is ignorable by
**membership, not textual position**: the frozen reading contract says "ignore
everything from the `layout` keyword down", but a `pin` may appear *before* that
opener — 54% of the `pin` lines in the corpus do — so position is the wrong
test. The register ships with the release; the check that proves each entry
against the bytes it corrects runs in development, where the ruling ledger it
reads lives.

**The honest limit, stated plainly.** Because `read/` is indexed by **language**
version, E1 **cannot reach the frozen `read/0.3/` tree in any `0.3.z` release** —
a patch release implements `figdown 0.3` and reuses `read/0.3/` unchanged, so
those bytes stay wrong-by-bytes and correct-by-erratum. E1's corrected wording
lands in a `read/` tree only when `figdown 0.4` writes `read/0.4/`. Until then it
reaches reading-contract consumers **only** through `spec/ERRATA.md` and, for an
agent, the inline correction carried in
[`skill/figdown/SKILL.md`](skill/figdown/SKILL.md). That gap is real, and this is
exactly the kind of limit worth naming rather than papering over.

## v0.3.0 — 2026-08-13

**Language version: `0.3`.** The second minor release. It **adds** one option
key and one resolver widening, and takes nothing away from the frozen surface:
every frozen construct behaves exactly as it did at v0.2.0, and every
`figdown 0.1` and `figdown 0.2` conformance golden passes unmodified. It does
**withdraw experimental vocabulary**, which the compatibility promise has never
covered — if you write `plane`, or a scene keyword in a genre other than the
one that still declares it, read the **Experimental** sections below before
upgrading. Everything else needs no rewriting.

**Language — `note=`, the drawn annotation.** A figure often needs a short
aside that the reader must *see*: a caveat, a unit, a "counted here". Until now
the language had no way to say it, and authors reached for a detached node, a
`shape=cloud`, or a `class` invented to mean "this box is a remark". Those are
workarounds with a cost: a detached node **is a participant** in the model, so
the figure asserts something that is not true of the subject.

    figdown 0.3 block
    title "Ingress" note="counters are per port"
    node q "Queue" note="drops counted here"
    node a "A"
    edge a -> q note="backpressure"

`note=` is an **attribute**, written on the annotated element's own line. There
is no id to resolve, no target key and no ambiguity about which of three
identically labelled elements is meant. It is accepted on ten directives:
`node` and its flowchart role siblings `process`, `decision` and `terminator`;
`state`; `group`; the three connector spellings `edge`, `flowline` and
`transition`; and `title` — the first option key `title` has ever taken, and
the way to write a remark about the figure as a whole, which draws at the
bottom of the canvas with no leader line. A connector is the case that decides
the shape: an edge has no id, so an attribute is the only form that could reach
it at all.

**`note=` and `description=` are both live, and neither is a fallback for the
other.** They divide by **audience**:

| key | audience | draws | accepted on |
|---|---|---|---|
| `description=` | the machine — an SVG `<title>` tooltip | no | `field`, unchanged |
| `note=` | the human reader | **yes** | the ten directives above |

Writing both on one element is legal and means what it says: a long
machine-facing description beside a short drawn aside. The machine-only channel
is deliberate. It is what lets a bitfield carry a register's full vendor
description, a provenance note or a conformance caveat without spending ink a
human reader did not ask for, and merging the two keys would force every
machine-facing fact into the picture.

**`note=` requires `figdown 0.3`, and the reason is specific to this key** —
"a new key needs a gate" is not a reason, because it would gate every key the
language ever adds. `note=` **has a prior meaning on the record**: it was the
retired spelling of `description=`, and its retirement message actively told
authors to write `description=` for a tooltip that is never drawn. An engine
accepting `note=` under a `figdown 0.2` header would take that author at the
word the language taught them and **repaint their tooltip as ink on the page**
— a figure that looks right and means something else. So under `figdown 0.1`
and `figdown 0.2` the key is an error that names the version and the one-step
fix. A key that had never been spelled before would carry no such risk and
would need no gate; the second change in this release is exactly that case.

**Where `note=` is *not* accepted, and what would change that.** `field` keeps
`description=` and gains nothing, because there are zero measured cases of a
per-field aside that must be drawn — granting one directive both keys with no
evidence spends the distinction before anyone needs it. `cell` is syntactically
possible with zero measured cases and the `table` genre owns its own surface.
`external`, `threshold`, `band`, `bundle` and `class` have zero measured cases
on any of them. Each of those reopens on a count of real figures, not on the
observation that it would be convenient.

**There is no standalone `note` keyword, and the measurement is why.** Across
two corpora — 70 annotation instances in 23 figures of one, 75 in 25 of the
other — the two populations disagree about almost everything and agree on the
only number that decides anything: annotations spanning **two or more**
elements are between **6.7% and 10%** of the demand. Three quarters are about
exactly one element, which an attribute covers exactly, and a seventh are about
the whole figure, which `title note=` covers. For the residual tenth, authors
had already invented a footnote marker (`*`, `**`) in the annotated labels keyed
to a note carrying the same marker; its only loss is that the correspondence is
not machine-readable. That reopens if a corpus shows spanning demand exceeding
single-element demand, or a measured need to make many-to-one attribution
machine-readable.

**Language — `in=` on `threshold` and `band` now reaches a region, and this
change is *not* gated.** A marker laid across a `bitfield`, `table` or `timing`
block used to be unwritable: the target resolver's accepted set was hard-coded
to nodes and groups, so

    threshold "Max" in=q offset=50%

over a `table q` answered `unknown target "q" for threshold` — the same message
a nonexistent id gets — while the id was mandatory and another directive
already consumed it. The document was well-formed and named a real element of
itself, and the engine said the element did not exist. Region ids now resolve.

No spelling is added: no keyword, no option key, no enum value, no character,
and the option-key registry is byte-unchanged. The only documents affected are
ones that **did not parse at all**, so nothing valid changes meaning and
nothing valid becomes invalid. A version gate exists to stop a meaning drifting
under a declared header; `in=q` naming the document's own region has exactly one
possible meaning and the alternative it replaces was an error message rather
than a different figure, so there is nothing to drift from and gating would only
withhold a fix from documents that are broken today. This is not a third sense
of `in=` — it is the same relation with a larger set of ids behind it.

That two changes ship together, one gated and one not, is the point: **a
feature release may hold changes that need a version gate and changes that do
not, and the discriminator is not how new they are.**

**Experimental — each scene genre now declares its own vocabulary, and there is
no shared scene namespace.** Six keywords used to be accepted by all four scene
genres, and the specification described them as a shared category. That was an
**intersection recorded as a rule**: each genre happened to define the same six.
The description was already false in its own terms, because since v0.2.0 the
scene genres do not share the connector — `flowchart` spells it `flowline` and
`statechart` spells it `transition`.

The category is dissolved. Only the core keywords (`figdown`, `title`, `layout`)
are cross-genre, and that is a guarantee about **meaning being fixed**, never a
statement that a word is available everywhere. Each genre documents its own
complete vocabulary in its own document, even where the wording is identical —
which is also the only place a difference can be stated. `topology` can now
define `bundle` by what it refers to (a LAG, an ECMP set, an EVPN Ethernet
Segment) where `block` has no referent to name; `flowchart` can cite ISO 5807
§9.4.2 for `external` and warn that FigDown's spelling is not ISO's, which
`block`'s declaration has no reason to carry.

**16 of the 24 genre-and-keyword pairs are withdrawn.** Each was weighed on two
independent grounds — no evidence of need in that genre, and the word already
being taken there by a more established meaning — and most fail both. What
remains:

| genre | subject vocabulary it declares |
|---|---|
| `block` | `group`, `external`, `threshold`, `band` |
| `topology` | `group`, `external`, `bundle` |
| `flowchart` | `external` |
| `statechart` | none — and the empty declaration is the declaration |

Nothing is renamed. `threshold` and `band` keep their spellings in `block`
because a future scalar-marker genre should be free to name them once, with a
scale, and renaming now would hand it a retired word. `topology` keeps `group`
and `external` because every networking synonym is *more* taken — `zone`,
`cluster`, `domain`, `area`, `site` — and both collisions are contradicted by
the picture: a multicast group is never drawn as a box round its members, and
an `external` is never drawn at all.

**The error you get is not a spellcheck.** A withdrawn word is known, not
unknown, so the message says it was withdrawn from *this* genre, gives the
ground for that cell, and names the genre that still declares it.

**Experimental — `plane`, `plane=` and `z-index=` are removed from the
language**, from every genre rather than from four, and removed rather than
renamed: there is no replacement spelling. `plane` declared a **drawing layer**
— a paint order. In `topology`, the genre network engineers actually author in,
a plane is the **control / data / management partition** of a device, so the one
figure in the corpus that used the keyword declared a `plane` it named *overlay*
— and *overlay* is itself a networking word, so the line read as a
network-architectural assertion while being a z-order. It had two
authored uses in the whole corpus, and stripping it out of the figure that
declared it produces the same drawn markup down to one edge index: the overlay's
entire appearance came from the `class=` the figure had already declared.

**What to write instead.** If a set of elements is a logical layer of the
subject, that is a `class` whose label says so — which is what both authored
uses were already doing alongside the keyword. If elements merely need to paint
on top, write them later: paint order is document order, and the implicit base
layer every element is on is unchanged. `z-index=` goes because it was legal on
`plane` and on nothing else; `plane=` goes because with no way to declare a
plane it would have had exactly one legal value, the default. `external` is left
taking no option key at all.

**Three older messages were repaired at the same time.** `layer`, `layer=` and
`z=` were each retired years of increments ago by renaming them to `plane`,
`plane=` and `z-index=` — spellings that no longer exist. A message naming a
destination that is not there is worse than no message, because it sends the
author one hop further from a working document. All three now state the whole
chain and end in the withdrawal.

**Experimental — `in=` is no longer accepted in `flowchart` or `statechart`.**
It states membership, and its only value domain was the id of a containing
`group`, which neither genre declares any more. Every value it could take was a
dead end: `in=g` answered `unknown group "g"` and no spelling of `g` succeeded.
An error that names the reason beats a dangling reference no author can satisfy.
Write `class=` instead — it earns a legend entry and applies to every member at
once. `in=` is untouched under `block` and `topology`.

For `statechart` this is not merely tidying, and the reason is worth stating
because it is not the obvious one. If state nesting ever arrives it will arrive
as **a state inside a state**, through this exact key, because `in=` is already
the language's membership spelling. A key left live with a *group*-id domain
would not merely fail — it would **teach the wrong model using the exact
spelling reserved for the right one**, which is worse than an error and worse
than silence. It is expected back with a state-id domain if composite states are
ever measured as needed; both genres are experimental, so that will cost
documents nothing then, exactly as this costs them nothing now.

**Fixed — a message claimed ISO's spelling for a word ISO does not use.** The
error that fires when a `figdown 0.2 flowchart` document writes `edge` said the
connecting line is a *flowline*, "the term ISO 5807 uses for it". That clause is
false. ISO 5807:1985 §9.3.1 names the symbol **`Line`** — and §9.3.1 is on p. 7,
inside the part of the standard this project has always been able to read, so
this was not a bet on an unread clause that went the wrong way. It was a claim
that could have been checked at any time and was not.

**The keyword does not move.** `flowline` was chosen because it is what the
flowchart domain commonly writes — draw.io, Visio and the teaching texts all say
it — and that decision stands, as does the `figdown 0.2` gate and every other
diagnostic. One sentence changes: the message now says `flowline` is the term
the flowchart domain commonly uses for the symbol ISO 5807 §9.3.1 names "Line".
The failure was escalating *the domain says X* into *the standard spells it X* —
two different claims settled by two different kinds of evidence, and a message
that borrows the standard's authority for a claim the standard does not make is
worse than one that claims less, because a reader cannot tell which of the two
it means. Prefer a weaker verifiable claim to a stronger false one. The
repository's own vocabulary-source record had it right all along; only the
user-facing message overstated, and the two now agree.

No `.fd` file changes for this, no keyword moves, and the archived v0.1.0 page
is untouched: it carries an older engine that never had this message.

**Also.** `read/0.3/` is the reading contract for the new language version and
is the live one from this release on; `read/0.1/` and `read/0.2/` stay exactly
as their releases published them.

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
