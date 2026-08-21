# FigDown Migration Log

<!-- fence-check: migration-record -->

> Policy (`VERSION-MIGRATION-MODEL`): the spec versions like a **database schema** — before
> convergence it changes often, so every semantic change ships with a
> migration entry containing a **mechanical rewrite rule**. Upgrading a
> document from vA to vZ = applying every entry between them, in order.
> A v1 document MUST convert correctly to v5 by following
> v1→v2→v3→v4→v5.
>
>
> **Document layout.** The normative core framework file is
> [`core.md`](core.md); per-genre vocabulary is only under
> [`genres/`](genres/README.md).

## What this log promises, and what it does not

The stability policy is normative in
[`core.md` §13](core.md#13-stability-and-versioning-normative). Read it
before relying on anything here. In particular:

- **0.x is a preview and is NOT stable** (§13.1). A migration entry is
  evidence of care, not of a stability promise.
- **In 0.x a mechanical migration is a SHOULD** — best effort — and it
  becomes a MUST only from v1.0 (§13.3). The entries below are written
  anyway because **accumulating them is the rehearsal for v1.0's
  machinery** (§13.4).
- That rehearsal is why
  [`tools/migrate-figdown.js`](../tools/migrate-figdown.js) **MUST be
  cumulative and idempotent across versions**, not merely correct for the
  latest hop: every rewrite ever shipped stays in the tool, a document
  from any earlier version reaches the current one in a single run, and
  running it on an already-current document changes nothing (§13.4).
- **"Frozen" does not mean "stable"** (§13.2). It names the scope of the
  change-management promise: a frozen construct may still change, but
  only with an entry here, a named diagnostic, and a rewrite in the tool.

## This log is the index over the archive

Per **released** version the project commits to one **git tag** and one
**immutable, self-contained engine page**, neither ever rewritten
(§13.5). This log is the **narrative index** over that archive: each
released version's entry links **its tag** and **its runnable page**, so
a reader who needs to run an old document finds the version here and
follows the link.

The pre-release increments are not releases and are not narrated here;
this log begins at the first released language version. `0.1` is the
first release the archive obligation attaches to, and its entry is the
next section.

## 0.1  (2026-08-10, released as `v0.1.0`)

The first released language version. There is nothing to migrate **to**
`figdown 0.1`: it is where the log begins, and every dev increment below
it squashes into it.

**The archive (§13.5).**

| | |
|---|---|
| **tag** | [`v0.1.0`](https://github.com/FigDown/figdown/releases/tag/v0.1.0) |
| **runnable page** | [`archive/0.1/figdown.html`](../archive/0.1/figdown.html) — served at `https://figdown.org/archive/0.1/figdown.html` |

Open the page in any browser, paste a `figdown 0.1` document into it, and
it renders exactly as `v0.1.0` rendered it. It is a single self-contained
HTML file: no network, no install, no server.

**Which bytes the page is, and why it matters.** The archived page is the
engine **as users ran it** — the published `v0.1.0` artifact, which stamps
`data-engine-version="0.1.0"`. It is *not* the engine in the source tree at
tag `v0.1.0`, which stamps 0.1 (§13.0.4). Recovering a figure needs
the engine the reader had, and a differently-stamped engine would emit a
different `data-engine-version` and therefore different SVG bytes — which is
the one thing `RENDERING-DETERMINISM` reproducibility is about.

**The page is not the editor.** `editor/figdown.html` tracks the current
source state and changes with every increment; it is a tool, not an archive.
Only the versioned `archive/<X.Y>/` path is promised never to change.

**What else is frozen at `0.1`.** [`read/0.1/`](../read/0.1/reading.md), the
reading contract for this language version, was published with `v0.1.0` and
is archived on the same terms. `figdown 0.1` is frozen, so what its
constructs *mean* is frozen with it; a later release that needs to say
something different writes `read/0.2/`.

Both are held byte-unchanged by `gate:archive`
([`tools/archive-check.js`](../tools/archive-check.js), against
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv)), which fails on
modification, on deletion, and on a file appearing under an archived prefix
that the release did not ship — over every archived version, every run.

## 0.2  (2026-08-12, releasing as `v0.2.0`)

The second released language version, and the project's **first `Y`**. It
adds `statechart` (an EXPERIMENTAL genre requiring `figdown 0.2`) and
**removes nothing**: every `figdown 0.1` document parses to the same model
under this release as under `v0.1.8`, and every `figdown 0.1` conformance
golden passes unmodified. The full account, with the rewrite that is not
owed, is the `0.1 → 0.2` entry below.

**The reading contract.** [`read/0.2/`](../read/0.2/reading.md) is the
reading contract for `figdown 0.2` and is the **live** one from this release
on: `read/0.1/` is frozen at the bytes `v0.1.0` shipped and is never edited
again, which is exactly the version-directory mechanism `0.1`'s entry above
predicted would be used. `read/0.2/` carries `figdown 0.1`'s reading
unchanged plus the new genre's, because `Y` removes nothing.

**The archive (§13.5).**

| | |
|---|---|
| **tag** | `v0.2.0` — created by the release act |
| **runnable page** | `archive/0.2/figdown.html` — written at **publish**, from the published engine stamped `0.2.0` |

Both are **owed at the release act and not before**, for the reason `0.1`'s
entry states: the archived page is the engine *as users ran it*, and that
artifact does not exist until `publish.py` stamps it. `node
tools/archive-check.js --write 0.2` then appends the `0.2` rows — covering
`archive/0.2/figdown.html` and every file under `read/0.2/` — to
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv), after which `gate:archive`
holds them byte-frozen forever on the same terms as `0.1`.

**An engine that accepts only `figdown 0.1`** — including
[`archive/0.1/figdown.html`](../archive/0.1/figdown.html) — rejects a
`figdown 0.2` document by name (`unsupported version "0.2" (expected 0.1)`)
rather than guessing. That is core §13.0.1's `Y` < `y` branch working as
specified, and it is why a document should declare the **lowest** version
that carries what it needs.

## 0.3  (2026-08-13, releasing as `v0.3.0`)

The third released language version, and **the first that removes**. It
adds one construct — `note=`, the drawn annotation, which requires
`figdown 0.3` — and it withdraws six scene keywords from the genres whose
own domains could not defend them, `plane` from the language entirely, and
`in=` from `flowchart` and `statechart`. Every withdrawal falls outside the
compatibility promise, because the genres and keywords it touches are
EXPERIMENTAL and say so in their own documents; a real document that used
one nevertheless stops parsing. The full account, and the only list an
author can act on, is the `0.2 → 0.3` entry below.

**The reading contract.** [`read/0.3/`](../read/0.3/reading.md) is the
reading contract for `figdown 0.3` and is the **live** one from this release
on: `read/0.2/` is frozen at the bytes `v0.2.0` shipped and is never edited
again, on the same terms as `read/0.1/`. `read/0.3/` carries the drawn
annotation's reading and the withdrawn constructs' absence.

**The archive (§13.5).**

| | |
|---|---|
| **tag** | `v0.3.0` — created by the release act |
| **runnable page** | `archive/0.3/figdown.html` — written at **publish**, from the published engine stamped `0.3.0` |

Both are **owed at the release act and not before**, for the reason `0.1`'s
entry states: the archived page is the engine *as users ran it*, and that
artifact does not exist until `publish.py` stamps it. `node
tools/archive-check.js --write 0.3` then appends the `0.3` rows — covering
`archive/0.3/figdown.html` and every file under `read/0.3/` — to
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv), after which `gate:archive`
holds them byte-frozen forever on the same terms as `0.1` and `0.2`.

**An engine that accepts only `figdown 0.1`** — including
[`archive/0.1/figdown.html`](../archive/0.1/figdown.html) — rejects a
`figdown 0.3` document by name (`unsupported version "0.3" (expected 0.1)`)
rather than guessing, and an engine that stops at `figdown 0.2` names its own
ceiling the same way. That is core §13.0.1's `Y` < `y` branch working as
specified. The withdrawals are the mirror image and are worth stating here
too: they are **not** version-gated, so a newer engine reading an older
header enforces them, and an archived engine is the only place a withdrawn
spelling still runs.

## 0.4  (2026-08-17, releasing as `v0.4.0`)

The fourth released language version, and the project's **third `Y`**. It adds
**one genre token** — `sequence`, EXPERIMENTAL, requiring `figdown 0.4` — and
at the language surface it removes nothing: §10's option-key registry is
byte-unchanged, no keyword is renamed or retired, and every `figdown 0.1`,
`0.2` and `0.3` document parses to the same model under this release as it did
under `v0.3.2`. This is deliberately the same increment `STATECHART-GENRE-SCOPE` made for
`statechart`, one genre later (core §13.7.4).

**Two things nevertheless act on documents that do not move their header**, and
they are the sentences to read first, because neither is version-gated: a
`class` that declares paint the member joining it cannot use is now a line
error on **all ten** collections that accept `class=` and not on `edge` alone
(`CLASS-CHANNEL-REACH`), and a `group` band that would enclose a node the source never put in it
is now refused at geometry time rather than drawn. The first
legalises more than it rejects and was measured to move **zero** of the
repository's 524 `.fd`; the second refuses **one** published figure. The full
account, and the only list an author can act on, is the `0.3 → 0.4` entry below.

**The reading contract.** [`read/0.4/`](../read/0.4/reading.md) is the reading
contract for `figdown 0.4` and is the **live** one from this release on:
`read/0.3/` is frozen at the bytes `v0.3.0` shipped and is never edited again,
on the same terms as `read/0.1/` and `read/0.2/`. `read/0.4/` carries the
`sequence` genre's reading and **discharges erratum E1**
([ERRATA.md](ERRATA.md), `GENRE-NAMESPACE`/`FROZEN-CONTRACT-CORRECTION`): the layout zone is ignorable by
**namespace membership**, not by textual position, which is what a `pin` written
above the `layout` line — 54% of the corpus's pins — always needed it to say.
The three frozen trees keep the wording they shipped, so E1 stays in the
register for anyone reading them directly; that is the freeze working, not a
second defect. **`read/0.4/` itself freezes at this publish**, on the terms
`read/0.1/` set: from `v0.4.0` on it is the bytes this release shipped, a later
release that needs to say something different writes `read/0.5/`, and the
`--write 0.4` run below is what makes that checkable rather than merely stated.

**The archive (§13.5).**

| | |
|---|---|
| **tag** | `v0.4.0` — created by the release act |
| **runnable page** | `archive/0.4/figdown.html` — written at **publish**, from the published engine stamped `0.4.0` |

Both are **owed at the release act and not before**, for the reason `0.1`'s
entry states: the archived page is the engine *as users ran it*, and that
artifact does not exist until `publish.py` stamps it — the source engine at this
tag stamps 0.4 (§13.0.4) and is therefore the wrong bytes by
definition. `node tools/archive-check.js --write 0.4` then appends the `0.4`
rows — covering `archive/0.4/figdown.html` and every file under `read/0.4/` — to
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv), after which `gate:archive`
holds them byte-frozen forever on the same terms as `0.1`.

**A pre-existing archive debt this release inherits and does NOT quietly
settle.** `archive/MANIFEST.tsv` holds **`0.1` rows only**: the `--write` step
the `0.2` and `0.3` entries above each describe was not run at those publishes,
so `read/0.2/` and `read/0.3/` are frozen by policy and hashed by nothing, and
`gate:archive`'s green is a statement about `0.1` and about no other version.
Back-filling them now would hash today's bytes and assert they are the bytes
those releases shipped — the one claim the manifest exists to make honestly and
the one claim nobody can make retroactively. So the debt is **recorded, not
fixed** (core §13.7.4, and the `0.3 → 0.4` entry below), and the
record is what keeps `0.4` from adding a fourth unhashed tree unnoticed. The
`0.4` rows are written at the `0.4` publish, on time, for the first time since
`0.1`.

**An engine that accepts only `figdown 0.1`** — including
[`archive/0.1/figdown.html`](../archive/0.1/figdown.html) — rejects a `figdown
0.4` document by name (`unsupported version "0.4" (expected 0.1)`) rather than
guessing, and an engine that stops at `0.2` or `0.3` names its own ceiling the
same way. That is core §13.0.1's `Y` < `y` branch working as specified. The
mirror image is stated in the `0.3` entry above and is unchanged here: `CLASS-CHANNEL-REACH`'s
generalisation and the group-band refusal are **not** version-gated, so a newer
engine reading an older header applies both, and an archived engine is the only
place the older behaviour still runs.

**`v0.4.1` — a `Z` release under this language version (2026-08-18).** The
language does not move: `figdown` stays `0.4`, no `.fd` gains or loses a
spelling, no conformance golden changes, and `read/0.4/` is reused
byte-for-byte as the frozen reading contract this release does NOT rewrite
(core §13.7.3). What ships is the repair line 0.4 → 0.4,
every state of it entered below. **Two of its changes act on documents that do
not move their header**, and they are the sentences to read first, because
neither is version-gated. A `pin` whose box covers another node **completely**
is refused at geometry time when at least one of the two boxes sits at a
coordinate the author never wrote; a cover both of whose boxes are pinned is an
author statement in the one paint order the language has and is still drawn,
and **partial** overlap stays an advisory and never becomes an error. And
`sequence`'s no-restatement check is now **operand-scoped**, which only
legalises: a `state` restated in a *sibling* operand of the same fragment was
refused and is now accepted, because at most one operand of a fragment occurs.
Both are the `0.4` entry below. **A `Z` carries no
archive obligation of its own**: the runnable page and the manifest rows are
indexed by **language** version, are listed in this section's table, and are
owed at the `0.4` publish — a `Z` adds no second page beside the first.

## 0.5  (2026-08-20, releasing as `v0.5.0`)

The fifth released language version, and the project's **fourth `Y`**. It
adds **one option key** — `id=`, on the four scene connectors (`edge`,
`flowline`, `transition`, `message`), gated at `figdown 0.5` — and at the
language surface it removes nothing: §10's option-key registry gains one row
and no keyword is renamed or retired, `GENRES_BY_VERSION['0.5']` is a copy of
`0.4`'s (this `Y` adds a key rather than a genre token, the first time that
has been true), and every `figdown 0.1`–`0.4` document parses to the same
model under this release as it did under `v0.4.1`.

**Two things nevertheless act on documents that do not move their header**,
and they are the sentences to read first, because neither is version-gated: a
second carried class that binds a paint channel a first carried class already
claimed is now a line error on **every** element (`CLASS-CHANNEL-COLLISION`), and a
`bundle`'s lasso that would enclose a node its own source never gave it is
now refused at geometry time rather than drawn (`LASSO-ENCLOSURE-TRUTH`). Each was
measured against the whole shipped corpus before it landed and found **zero**
instances — five multi-class sites for the first, four lassos over four
figures for the second — so neither moves a byte of what is already
published. The full account, and the only list an author can act on, is the
`0.4 → 0.5` entry below.

**The reading contract.** [`read/0.5/`](../read/0.5/reading.md) is the
reading contract for `figdown 0.5` and is the **live** one from this release
on: `read/0.4/` is frozen at the bytes `v0.4.1` shipped and is never edited
again, on the same terms as `read/0.1/`–`read/0.3/`. `read/0.5/` carries the
`id=` handle's reading rule — an id's spelling carries no meaning of its own
(core §12.7) — plus everything `read/0.4/` already said.

**The archive (§13.5).**

| | |
|---|---|
| **tag** | `v0.5.0` — created by the release act |
| **runnable page** | `archive/0.5/figdown.html` — written at **publish**, from the published engine stamped `0.5.0` |

Both are **owed at the release act and not before**, for the reason `0.1`'s
entry states: the archived page is the engine *as users ran it*, and that
artifact does not exist until `publish.py` stamps it — the source engine at
this point in the tree stamps 0.5 (§13.0.4) and is therefore the
wrong bytes by definition. `node tools/archive-check.js --write 0.5` then
appends the `0.5` rows — covering `archive/0.5/figdown.html` and every file
under `read/0.5/` — to
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv), after which `gate:archive`
holds them byte-frozen forever on the same terms as `0.1`. `archive/MANIFEST.tsv`
still holds `0.1` rows only, for the reason `0.4`'s entry above recorded: the
debt is inherited, not settled, by this release too.

**An engine that accepts only `figdown 0.1`** — including
[`archive/0.1/figdown.html`](../archive/0.1/figdown.html) — rejects a
`figdown 0.5` document by name (`unsupported version "0.5" (expected 0.1)`)
rather than guessing, and an engine that stops at `0.2`, `0.3` or `0.4` names
its own ceiling the same way. That is core §13.0.1's `Y` < `y` branch working
as specified. The mirror image is stated in the `0.3` and `0.4` entries above
and is unchanged here: `CLASS-CHANNEL-COLLISION`'s channel-collision check and `LASSO-ENCLOSURE-TRUTH`'s lasso-truth
check are **not** version-gated, so a newer engine reading an older header
applies both, and an archived engine is the only place the older, silent
behaviour still runs.

## Entry format

```
## <from> → <to>  (<date>, <decision ref>)
Change:  what changed, semantically
Rule:    the mechanical rewrite (regex/algorithm); mark NON-MECHANICAL
         steps explicitly if any
Example: before → after
```

`<decision ref>` cites a decision ID defined in
[`decisions/registry.md`](../decisions/registry.md).

## 0.1 → 0.2  (2026-08-12, what a document must change to declare `figdown 0.2`)
Change:  **NOTHING IS FORCED. A `figdown 0.1` document does not have to
         move.** Every document that was legal at `v0.1.8` parses to the
         same model under this release — `figdown 0.1 flowchart` writing
         `edge` included, and deliberately so. That is `core.md` §13.0
         keeping its first real test: only a MAJOR version may remove, so
         **no `0.x` release may drop it**. It is supported until v1.0,
         where removing it would be a scheduled act with its own entry in
         this log and a named diagnostic. Nothing in this entry is owed by
         a document that stays where it is.

         The rest of this entry answers one question: **what must change
         in a document whose header you want to read `figdown 0.2`?**

         **One word, in one genre.** Under `flowchart`, `figdown 0.2`
         spells the connector `flowline`, so a section that raises its
         header rewrites its connector lines with it. The two move
         together or the section does not parse, and each version accepts
         exactly one spelling: `edge` under `figdown 0.2 flowchart` is a
         line error naming the word to write, and `flowline` under
         `figdown 0.1 flowchart` is a line error naming the version that
         carries it.

         | genre | under `figdown 0.1` | under `figdown 0.2` |
         |---|---|---|
         | `block`, `topology` | `edge` | `edge` |
         | `flowchart` | `edge` | `flowline` |
         | `statechart` | the genre requires `figdown 0.2` | `transition` |

         **`block` and `topology` keep `edge` at every version, and
         `node` is unchanged in every genre that has it.** The rename is
         per genre, not language-wide, and `edge` is not retired: a
         `figdown 0.2 block` or `figdown 0.2 topology` section writes
         `edge` exactly as it did before, and writing `flowline` there is
         a line error of its own. Do not migrate them by analogy — one
         genre's connector word moved, and only at `figdown 0.2`.

         **`statechart` becomes available, and it is a capability rather
         than an obligation.** `figdown 0.2` adds an EXPERIMENTAL genre
         for state machines
         ([`genres/experimental/statechart.md`](genres/experimental/statechart.md)),
         reachable only from `figdown 0.2` — `figdown 0.1 statechart` is
         a line error naming the version. No existing document has to
         become one, and moving a document to `figdown 0.2` does not
         start the question. Reclassifying is an AUTHOR judgement and
         never a mechanical one: do it when the nodes are modes the
         machine is IN rather than steps it performs, and not because the
         figure has cycles or self-loops, neither of which identifies a
         state machine. A figure that does move writes `state` and
         `transition` where it wrote `node` and `edge`, and
         `tools/migrate-figdown.js` rewrites those two words once the
         header names the genre; the reverse costs the same.

         **Nothing else changes.** The declared version reaches exactly
         two decisions in the engine — which genres a header may name,
         and which word `flowchart` spells its connector with. Every
         other keyword, option key, default, diagnostic and model field
         is identical under `figdown 0.1` and `figdown 0.2`.

Rule:    **MECHANICAL, scoped BY GENRE and BY VERSION, and the header
         moves with the keyword.** `tools/migrate-figdown.js` performs
         all of it. Read the genre and the version from each
         `figdown <ver> <genre>` header, then, on **line-initial keyword
         position only** (never inside a label, a comment or an option
         value):

           genre `flowchart`, section declaring 0.1, section writes a
           connector:      ^(\s*)figdown(\s+)0\.1(\s)  → $1figdown$20.2$3
                           ^(\s*)edge\b                → $1flowline
           genre `block`, `topology`, any non-scene genre, or a
           `flowchart` section writing no connector:      NO CHANGE
           before the first header (genre unknown):       NO CHANGE

         **The bump is per SECTION and happens only where a connector
         actually appears.** In a multi-section file each `figdown` header
         re-scopes the rule for the lines that follow it, so a
         `figdown 0.1 flowchart` section carrying connector lines comes
         out `figdown 0.2 flowchart` while a `figdown 0.1 block` section
         in the same file keeps its version AND keeps `edge`. Declaring
         the LOWEST version that carries what the section needs is the
         rule: a higher declaration narrows the set of engines that will
         read it and buys nothing. A `flowchart` section that draws no
         connector needs no `0.2` vocabulary and is left where it is.

         Idempotent by construction — no output spelling appears in a
         source position of the table, and a section already declaring
         `figdown 0.2` is left alone. A document that an earlier run
         rewrote to `flowline` and left at `figdown 0.1` has its header
         raised on the next run, which is the corpus case fixture 122
         pins; fixture 123 asserts that a `block` + `topology` document
         comes out byte-identical.

Example: `figdown 0.1 flowchart` → `figdown 0.2 flowchart`
         `edge acl -[deny]-> fwd` → `flowline acl -[deny]-> fwd`
         (`tools/migrate-fixtures/121-flowchart-edge-to-flowline.fd`; the
         drawing is unchanged)

Classification: COMPATIBLE — `figdown 0.2` ADDS and removes nothing.
         Every `figdown 0.1` document parses to the same model as it did
         at `v0.1.8`, every `figdown 0.1` conformance golden passes
         unmodified, and nothing becomes UNAVAILABLE:
         [`archive/0.1/figdown.html`](../archive/0.1/figdown.html) and
         [`read/0.1/`](../read/0.1/reading.md) are byte-untouched and
         `gate:archive` holds them so.

Ruling:  `STATECHART-GENRE-SCOPE`, `GENRE-CONNECTOR-SPELLING`, `GENRE-NODE-SPELLING`, `KEYWORD-RENAME-SCOPE`.

## 0.2 → 0.3  (2026-08-13, what a document must change to declare `figdown 0.3`)
Change:  **SOMETHING IS FORCED THIS TIME, AND IT IS NOT THE HEADER.** A
         `figdown 0.2` document parses unchanged under this release only
         if it used **none** of the spellings withdrawn below. Those
         withdrawals do not read the declared version, so **staying at
         `figdown 0.2` does not escape them**: a document that wrote one
         of these words stops parsing against this engine whatever its
         header says, and the fix is to the document, not to the number.
         That is the sentence to act on first. Everything else in this
         release is a capability rather than an obligation, and `note=`
         is the only reason a header ever has to move.

         **1. THE WITHDRAWALS — what a `figdown 0.2` document may have
         written that a `figdown 0.3` document may not.** Subject
         vocabulary is now declared PER GENRE: a spelling accepted by
         several genres was several independent declarations, never one
         inherited, and a common word can already carry a precise and
         different meaning inside a genre's own domain. Each genre kept
         only the words its domain can defend.

         | genre | withdrawn from it | what an author writes instead |
         |---|---|---|
         | `block` | `bundle`, `plane` | a link bundle is a `topology` figure — author that section as `topology`; otherwise delete the line and let the parallel edges stand |
         | `topology` | `threshold`, `band`, `plane` | `block` is the only genre that still declares the two markers — author that section as `block` |
         | `flowchart` | `group`, `threshold`, `band`, `bundle`, `plane`, and the option key `in=` | `class=` for what `group`/`in=` expressed; delete `threshold`, `band` and `bundle` outright |
         | `statechart` | `group`, `external`, `threshold`, `band`, `bundle`, `plane`, and the option key `in=` | `class=` for what `group`/`in=` expressed; the genre declares no subject vocabulary at all, so an out-of-figure endpoint is either part of the machine — a `state` — or it is prose |

         **`block` and `topology` keep `group`, `external` and `in=`, and
         `topology` keeps `bundle`.** The withdrawal is per genre and per
         word; do not migrate a genre by analogy with its neighbour.

         **`plane` is withdrawn from the LANGUAGE, not from a genre**, and
         the `plane=` and `z-index=` option keys go with it — `z-index=`
         was legal on `plane` and nowhere else, and with no way to declare
         a plane, `plane=` had one legal value left. There is **no
         replacement spelling**. Delete the line and delete every `plane=`
         that referenced it: paint order is document order, so the drawing
         is unchanged unless the planes were written out of document
         order — check the result. Where the layer was a claim about the
         SUBJECT — an overlay, a control plane, a management network —
         that meaning is a `class` whose LABEL states it (core §5).
         **`class` carries what `plane` never did**: the keyword's one
         authored use in the corpus was measured **inert** — stripping it
         and its references left the drawn markup the same byte count,
         one edge index apart, because `class=overlay` was already
         carrying the overlay's whole visual identity.

         **`group` and `in=` are one item read twice.** Both stated
         MEMBERSHIP, and once `flowchart` and `statechart` stopped
         declaring a `group` every value of `in=` in those genres was a
         dead end no spelling could satisfy, so the key was withdrawn
         with the keyword rather than left pointing at nothing. `class=`
         is what expresses membership there now: declare a `class` whose
         label names the phase or the category and write `class=` on each
         member — it earns a legend entry and applies to every member at
         once. In `statechart` the spelling is additionally **reserved**:
         `in=` is expected back with a `state`-id domain if composite
         states are earned, so writing it today would teach the wrong
         model in the exact spelling kept for the right one.

         **2. `note=` — the one construct that requires raising the
         header.** `figdown 0.3` adds the DRAWN annotation, and it is
         gated: under `figdown 0.1` or `figdown 0.2`, `note=` is a line
         error naming the version and the one-step fix. The gate's reason
         is **specific to this key**, not the generic "a new key needs
         one": `note=` has a PRIOR MEANING on the record. It was the
         retired spelling of `description=`, and that retirement's own
         diagnostic told authors to write `description=` for a tooltip
         that is never drawn. An engine that accepted `note=` under a
         `figdown 0.2` header would repaint that author's tooltip as
         **ink on the page** — core §13.0.1's named hazard, *a figure
         that looks right and means something else*. A key that had never
         been spelled before would carry no such risk and would need no
         gate.

         A document that wants a drawn annotation therefore raises the
         section header to `figdown 0.3` and writes `note="…"` on the
         annotated element's own line: `node` and its role siblings
         `process` / `decision` / `terminator`, `state`, `group`, the
         connector under each of its three spellings, and `title` —
         which gains its first option key. Attachment is by syntactic
         position and the author does not place the box. **A document
         that wants none of this is untouched**, and declaring the
         LOWEST version that carries what the section needs is still the
         rule.

         **`field` refuses `note=` at every version**, and the refusal
         states the AUDIENCE division rather than naming a replacement:
         `description=` reaches the machine and draws no ink beyond a
         tooltip, `note=` reaches the human and always draws. Neither is
         a fallback for the other, and writing both on one element is
         legal and meaningful.

         **3. `in=` on `threshold` and `band` resolves a REGION id, and
         owes nothing.** `threshold "Max" in=q offset=50%` over a `table
         q` used to answer `unknown target "q"`; it now resolves. This is
         a widening of the value domain, not a new sense and not a new
         spelling, and it is **ungated** — it parses under `figdown 0.1`
         and `figdown 0.2` exactly as under `figdown 0.3`. No previously
         valid document changes meaning and none becomes invalid: the
         only documents affected are ones that produced no figure at all.
         **A widening that makes a previously erroring document parse
         creates no migration obligation**, which is precisely the
         discriminator against `note=` above — that key had a prior
         meaning, this has no prior anything.

         **4. What is NOT in this entry, and why.** The release also
         corrected one diagnostic's WORDING: the `flowchart` connector
         message claimed `flowline` was ISO 5807's spelling, and the
         standard's own name for that symbol is *Line*. The keyword, its
         `figdown 0.2` gate and the advice the message gives are all
         unchanged, no document that parsed stops parsing, and no
         rendered figure changes — **no author acts on it**, so it is not
         a migration item. (If you quoted the old sentence in your own
         documentation, its claim about ISO 5807 was wrong.) The
         retirement messages for `layer`, `layer=` and `z=` were
         rewritten in the same release to end in the withdrawal rather
         than at a spelling that is gone; those three were already
         retired before `figdown 0.1` shipped, so no `figdown 0.2`
         document can contain one and nothing is owed there either.

Rule:    **NON-MECHANICAL for every withdrawal, and
         `tools/migrate-figdown.js` deliberately rewrites none of them.**
         It REPORTS them — `withdrawn-from-genre` for a keyword,
         `withdrawn-opt-from-genre` for `in=`, `withdrawn-plane` for the
         `plane` family — because the fix is a decision about the figure
         that no tool may make unattended, and a rewrite whose output no
         longer parses is worse than none. Four author actions cover the
         whole entry:

           DELETE            `plane`, every `plane=` that referenced it,
                             and `z-index=`; and `threshold` / `band` /
                             `bundle` in a genre that no longer declares
                             them when the figure has nowhere to move to.
           RE-GENRE          `threshold` / `band` become a `block`
                             section; `bundle` becomes a `topology`
                             section. A multi-section file may hold both,
                             so this costs a header, not a document.
           RE-EXPRESS        `group` and `in=` under `flowchart` or
                             `statechart` become a `class` declaration
                             whose label names the phase or category,
                             plus `class=` on each member.
           RAISE THE HEADER  only for `note=`, and only in the section
                             that writes it.

         **The header does not move for any withdrawal.** Raising a
         section to `figdown 0.3` neither causes nor cures one, and
         leaving it at `figdown 0.2` does not defer one. `block` and
         `topology` documents that used none of the withdrawn words are
         unaffected in every respect and need no run of the tool.

         One tool behaviour is worth knowing before you run it: the old
         `note=` → `description=` rewrite was line-agnostic and is now
         narrowed to `field` lines, which is the only directive where
         `note=` was ever legal. Running the tool on a document with a
         drawn note no longer converts that note into a tooltip.

Example: `figdown 0.2 topology` … `plane overlay "VXLAN tunnels" z-index=2`
                                   → DELETE the line, and delete every
                                     `plane=` that referenced it; the
                                     drawing is unchanged
         `figdown 0.2 topology` … `threshold "Max" in=leaf1 offset=50%`
                                   → error naming the withdrawal; author
                                     that section as `block`
         `figdown 0.2 flowchart` … `process a "A" in=g`
                                   → error naming the withdrawal; write
                                     `class ingress "Ingress phase"` and
                                     `process a "A" class=ingress`
         `figdown 0.2 statechart` … `bundle b "pair" a--b,c--d`
                                   → error; the genre declares no subject
                                     vocabulary, and two transitions
                                     between one pair of states are two
                                     different triggers
         `node a "A" note="valid only while the port is up"`
                                   → legal under `figdown 0.3`; under
                                     `figdown 0.2` it is a line error
                                     naming the version
         `threshold "Max" in=q offset=50%`  where `q` is a `table` region
                                   → parses under `figdown 0.2` too;
                                     nothing to migrate

Classification: **ADDITIVE where the compatibility promise reaches,
         BREAKING outside it — and the break is real.** `note=` adds a
         key behind a version gate and removes nothing; the `in=`
         widening removes nothing. The withdrawals are free of the
         promise: `topology`, `flowchart` and `statechart` are
         EXPERIMENTAL, each genre document stating in its own header that
         the genre "is outside the conformance surface and outside the
         compatibility promise" and "may change or be withdrawn in a
         later `0.x` without a migration entry", and in `block` — the one
         NORMATIVE scene genre — both withdrawn words were EXPERIMENTAL
         rows in that document's own keyword-status table. **Free is not
         harmless.** A document that used one of these spellings stops
         parsing, at any declared version, and this entry exists because
         a reader is owed the list rather than a silent change to the
         accepted surface. Nothing becomes UNAVAILABLE:
         [`archive/0.1/figdown.html`](../archive/0.1/figdown.html) and
         [`read/0.1/`](../read/0.1/reading.md) are byte-untouched,
         `read/0.2/` freezes here on the same terms, and `gate:archive`
         holds them so — an archived engine is where a withdrawn spelling
         still runs.

Ruling:  `DRAWN-ANNOTATION-FORM`, `MARKER-TARGET-KINDS`, `SUBJECT-VOCABULARY-SCOPE`, `SCENE-KEYWORD-MEMBERSHIP`, `PAINT-ORDER-CONSTRUCT`, `RESERVED-SPELLINGS`, `MEMBERSHIP-KEY-ACCEPTANCE`.

---

## 0.3 → 0.4  (2026-08-17, what a document must change to declare `figdown 0.4`)
Change:  **NOTHING IS FORCED BY THE HEADER, AND TWO THINGS ARE FORCED
         WITHOUT IT.** A `figdown 0.3` document does not have to move: every
         document legal at `v0.3.2` parses to the same model under this
         release, no keyword is renamed or retired, and `figdown 0.4` buys
         exactly one thing — the `sequence` genre. But **two changes in this
         release do not read the declared version at all**, so staying at
         `figdown 0.3` does not escape them. Those are items 1 and 2, and
         they are the only sentences here an author may have to act on.

         **1. A `class` must not declare paint that cannot reach the member
         that joins it — and that check now runs over ALL TEN collections
         that accept `class=`** (`CLASS-CHANNEL-REACH`). The rule is `INTERIOR-LESS-ELEMENT-PAINT`'s and its shape is unchanged; until this release the loop
         ran over `edge`s only, so a class joined by a `message`, a
         `fragment`, an `operand`, a `field` or a `cell` was never checked.
         The channel sets are derived from what each renderer actually
         READS — a key the drawing never consults is not a channel the
         member has:

         | member | channels it has |
         |---|---|
         | `node` `group` `lifeline` `state` | `fill` `stroke` `style` |
         | `edge` `message` | `stroke` `style` — no interior |
         | `fragment` `operand` | `stroke` `style` — a frame over its members |
         | `field` `cell` | `fill` `stroke` — `style=` left both at 0.1 (`STYLE-KEY-SCOPE`) |

         Two forms are line errors, both of them declared paint that cannot
         arrive: `fill=` with no `stroke=` on a class an interior-less member
         joins, and — new here — a class **all** of whose channels the member
         lacks, reachable today as a `style=`-only class on a `field` or a
         `cell`. A member with all three channels can never fail either form.
         **Measured over all 524 `.fd` in the repository, this finds zero
         instances**; you are only affected if your own figure joins a
         paint-declaring class from one of the five newly-reached
         collections. Both messages name the key to add.

         **RETIRED IN THE SAME RULING, and it only ever legalises: a class
         that declares NO paint at all is no longer a line error anywhere.**
         From 0.1 to 0.4, `CLASS-PAINT-REQUIREMENT`'s second half made `class p
         "Path"` plus `edge a -> b class=p` an error. `CLASS-CHANNEL-REACH` withdraws it: the
         harm `CLASS-PAINT-REQUIREMENT` named was "shows nothing in the legend", and `CLASS-PAINT-REQUIREMENT`'s own
         release made the derived legend draw the meaning with no swatch, so
         the rule had already been paid off by its own increment. A
         meaning-only `class` is now legal on every collection, as it has
         always been on `field`. **No document is invalidated by the
         retirement and none needs a rewrite for it.**

         **2. A `group` band that would enclose a non-member is refused
         rather than drawn**. A `group` renders as a band and the
         reader's rule is *inside the box is in the group*; of the 34
         published figures declaring a `group`, **2** drew a band around a
         node their own source never put in it, with no diagnostic. Who
         chose the position decides what happens now: if **auto-layout**
         chose it, the engine places the members contiguously and moves the
         intruder clear — silent, no author action, no syntax. If **a `pin`**
         chose it, the freedom is gone and the renderer reports a
         GEOMETRY-TIME error naming the `pin` line and the enclosed node, and
         **renders nothing**. This is a new error class raised by the
         RENDERER rather than the parser, because `parse` cannot see a
         coordinate; core §2.2 states the containment guarantee normatively
         and §8 opens the class. **A caller that writes `.svg` files MUST
         treat a non-empty render-diagnostic list exactly as it treats a
         non-empty parse-error list** — if you have your own build script,
         that is the one integration change this release asks for.

         **3. `sequence` — the one capability that requires raising the
         header.** `figdown 0.4 sequence` is a new EXPERIMENTAL genre for
         interaction diagrams
         ([`genres/experimental/sequence.md`](genres/experimental/sequence.md)),
         reachable only from `figdown 0.4`. Its source standard is OMG UML
         2.5.1 clause 17, on ISO ground because ISO/IEC 19505-2 publishes the
         same clause (`SEQUENCE-SOURCE-STANDARD`). It declares five keywords — `lifeline`,
         `message`, `state`, `fragment`, `operand` — and **no new option
         key**; §10's registry is byte-unchanged, which is why this `Y` adds
         a genre token and nothing else. Message order is TOTAL, and the
         divergence from both source standards is declared rather than
         hidden (`SEQUENCE-ORDER-MODEL`). Three spellings a reader might expect are REFUSED by
         name: `gap` (`SEQUENCE-TIME-GAP`), `group` (`SEQUENCE-PARTICIPANT-GROUPING`) and `lost=` (`UNDELIVERED-MESSAGE-MARKING`) — under
         `sequence`, `class` is what carries the meaning those would have
         carried, and a meaning-only `class` is that genre's designed idiom,
         which item 1's retirement is what makes legal.

         `figdown 0.3 sequence` answers `genre "sequence" requires figdown
         0.4 (this document declares 0.3) — write: figdown 0.4 sequence`. It
         is not `unknown genre`, which would send an author hunting a typo,
         and it is never a silent promotion to `0.4`, which core §13.7
         forbids. **A document that wants none of this is untouched**, and
         declaring the LOWEST version that carries what the section needs is
         still the rule — the showcase's own ARP figure stays `figdown 0.1`
         deliberately, for exactly that reason.

         **4. What is NOT in this entry, and why.** The release also corrects
         one diagnostic's WORDING: the retired-`boundary` message attributed
         «boundary» to UML, and the stereotype occurs zero times in OMG UML
         2.5.1 and zero times in ISO/IEC 19505-2 — it belongs to the
         Entity-Control-Boundary analysis pattern. The keyword is still
         retired, `external` is still what replaces it, the advice is
         unchanged, no document that parsed stops parsing and no figure
         changes, so **no author acts on it** and it is not a migration item.
         (If you quoted the old sentence in your own documentation, its claim
         about UML was wrong.) Likewise not migration items: the editor's
         direct-manipulation half no longer authors line errors under
         `sequence` — a GUI fix writes text you
         could always have written by hand — and `gate:standards`, which now
         requires a register row behind every claim this project makes about
         an external standard. Both change what the project ships, neither
         changes what a document must say.

Rule:    **NOTHING TO REWRITE, and `tools/migrate-figdown.js` gains no rule.**
         Nothing was renamed, retired or moved, so there is no document the
         tool could correctly change — the third `Y` in a row for which that
         is the honest answer. Three author actions cover the whole entry,
         and the first two apply only if a check fires against your own
         figure:

           ADD THE MISSING KEY   a class a `message` / `fragment` /
                                 `operand` / `field` / `cell` joins that
                                 declares only channels the member lacks:
                                   class k "K" fill=#eee
                                 →  class k "K" fill=#eee stroke=#333
                                 Keep `fill=` on the same class when members
                                 that HAVE an interior also join it — one
                                 class carries one meaning for heterogeneous
                                 members, which is why the test is per
                                 channel.
           MOVE THE PIN          `pin puts "<id>" inside the band of group
                                 "<g>"` means the drawing was already saying
                                 `<id>` is a member of `<g>`. Move the `pin`
                                 clear of the group's extent, or say what the
                                 drawing says and write `in=<g>`.
           RAISE THE HEADER      only for `sequence`, and only in the section
                                 that declares it.

         **The header does not move for items 1 or 2.** Raising a section to
         `figdown 0.4` neither causes nor cures either, and leaving it at
         `figdown 0.3` does not defer either. A document that joins no
         paint-declaring class from a newly-reached collection and pins no
         node into a band is unaffected in every respect and needs no run of
         the tool.

         **Rebuild your artifacts.** `data-engine-version=` moves and, for
         one reference figure, two band origins move with it; every other
         drawing in this repository is byte-identical apart from the stamp.

Example: `figdown 0.4 sequence`      → parses; the genre is EXPERIMENTAL
         `figdown 0.3 sequence`      → genre "sequence" requires figdown 0.4
                                       (this document declares 0.3) — write:
                                       figdown 0.4 sequence
         `class k "K" fill=#eee` + `message c -> s "m" class=k`
                                   → line error naming the member and the
                                     key to add; before this release it
                                     parsed clean, painted none of the fill,
                                     and put `k` in the legend anyway
         `class v "Vendor" style=dotted` + `field "Flags":6 class=v`
                                   → line error: every channel the class
                                     declares is one a `field` lacks
         `class dropped "Sent, never delivered"` + `message a -> b class=dropped`
                                   → LEGAL, and newly so under `sequence`;
                                     an unpainted meaning is that genre's
                                     idiom, not an omission
         `group g "Box"` / `node a "A" in=g` / `node m "M"` / `node b "B" in=g`
                                   → `a` and `b` are placed adjacent and `M`
                                     sits outside the band; before, `M` was
                                     drawn inside the box with no diagnostic
         `pin` fixing a non-member inside a group's extent
                                   → geometry-time error naming the `pin`
                                     line and the node; nothing is rendered
                                     and no artifact is written

Classification: **ADDITIVE at the language surface, and one figure becomes
         UNAVAILABLE.** `sequence` adds a genre token behind a version gate
         and removes nothing; every `figdown 0.1`, `0.2` and `0.3` document
         parses to the same model and every golden of all three versions
         passes unmodified. Two goldens moved for the version set and neither
         is a compatibility break — `014-header-bad-version` now uses `0.5` as
         its unsupported-minor example (expect this once per `Y`), and
         `016-header-major-version`'s message text gained the fourth accepted
         version. `CLASS-CHANNEL-REACH` is a widening and a reach in that order of risk, and
         it moves **zero** of the repository's 524 `.fd`. What is genuinely
         lost is one drawing: `examples/layout-compare/srl-evpn-irb-auto.fd`,
         the auto-layout arm of the layout comparison, can no longer be
         rendered — its three leaf groups interleave across ranks and no
         placement the separation pass can reach clears every band, so the
         engine refuses it. That the refusal fires is correct; that it fires
         *there* is a limit of the layout and not of the document
         (`decisions/registry.md` item 32), and the figure returns when
         group-aware rank assignment lands. Its artifact is deleted rather
         than left standing at the engine that last built it. Nothing else
         becomes UNAVAILABLE:
         [`archive/0.1/figdown.html`](../archive/0.1/figdown.html) and
         [`read/0.1/`](../read/0.1/reading.md) are byte-untouched, `read/0.3/`
         freezes here on the same terms as `read/0.2/`, and `gate:archive`
         holds `0.1` so. **`read/0.4/` also discharges erratum E1** — the
         layout zone is ignorable by namespace membership, not by textual
         position — which is the first time the erratum path core §13.7.3
         opened has actually been walked.

Ruling:  `SEQUENCE-GENRE-VOCABULARY` (the `sequence` genre, its vocabulary and its three
         refusals); `STATECHART-GENRE-SCOPE` (the version gate this genre reuses without an
         `n`-th branch); `CLASS-CHANNEL-REACH` (the class-channel generalisation and `CLASS-PAINT-REQUIREMENT`'s
         half-retirement); `INTERIOR-LESS-ELEMENT-PAINT` (the half of the channel rule that stands);
         `GENRE-NAMESPACE`/`FROZEN-CONTRACT-CORRECTION` (E1, discharged in `read/0.4/`); `VOCABULARY-SOURCE-ATTRIBUTION` (the
         retired-`boundary` wording, applied but not a migration item).

---

## 0.4 → 0.5  (2026-08-20, what a document must change to declare `figdown 0.5`)
Change:  **NOTHING IS FORCED BY THE HEADER, AND TWO THINGS ARE FORCED
         WITHOUT IT — the same shape as the last two `Y`s.** A `figdown 0.4`
         document does not have to move: every document legal at `v0.4.1`
         parses to the same model under this release, no keyword is renamed
         or retired, and `figdown 0.5` buys exactly one thing — the `id=`
         option key on the four scene connectors. But **two changes in this
         release do not read the declared version at all**, so staying at
         `figdown 0.4` does not escape them. Those are items 1 and 2, and
         they are the only sentences here an author may have to act on.

         **1. Two carried classes may not bind the same paint channel on one
         element — checked at ALL VERSIONS, not gated on `figdown 0.5`**
         (`CLASS-CHANNEL-COLLISION`). `class=` is multi-valued (core §12.5, §2.7): an
         element may join several classes, and until this release, when two
         carried classes both set the same channel (`fill`/`stroke`/`style`)
         the LAST one won silently — half the author's claim dropped with
         nothing said about it. The check is per element, per channel the
         member actually has (core §2.7's channel table): the first carried
         class to set a channel claims it, and a second carried class setting
         a claimed channel is now a line error naming both classes and the
         channel:

         ```
         Line N: classes "tagged" and "untagged" both set stroke= on this
         element — one channel, one class: move one class's paint to a
         different channel (fill=/style=), or carry only one of them
         ```

         Element-direct `fill=`/`stroke=`/`style=` is untouched — it already
         overrides every class (`LAYOUT-STABILITY`) and is not a second class SOURCE.
         **Measured over the corpus's five existing multi-class sites, all
         five already partition their classes' channels with no overlap**, so
         the rule closes a hole nothing legitimate was using; the one
         conflicting attempt on record (the UNH-IOL validation exercise, fig
         02, backlog item 68) produced a figure that silently dropped half
         its claim.

         **2. A `bundle`'s lasso may not enclose a non-member — checked at
         ALL VERSIONS, not gated on `figdown 0.5`** (`LASSO-ENCLOSURE-TRUTH`). A
         `bundle`'s ring is the drawn extent of its member links, and until
         this release nothing checked that a device drawn wholly inside it is
         actually one of them. The rule is the `group` band's own principle,
         one construct over: **whoever chose the position bears the
         responsibility.** If auto-layout chose the bystander's coordinate,
         the separation pass moves it clear of the lasso, silently, at no
         cost to the author. If a `pin` chose it, or no free room exists to
         move into, the engine reports a GEOMETRY-TIME error naming the
         `bundle` and the enclosed node and **renders nothing** — the same
         refusal voice the group-band enclosure check and the complete-cover
         check (backlog 47b) already use. A one-member bundle
         draws no ellipse and is never subject to the rule; edges are not
         tested, because a lasso exists to be crossed by lines. New output
         attribute `data-lasso` names the bundle a ring and its enclosed
         nodes belong to (`gate:safesvg`'s enumeration moves from sixty
         attributes to sixty-one), and `tools/layout-lint.js` gains a `lasso`
         axis reading it — measured at **0 over the whole shipped corpus**
         (4 lassos over 4 figures) before it landed.

         **3. `id=` — the one capability that requires raising the header.**
         `id=` becomes legal on the four scene connectors — `edge`,
         `flowline`, `transition`, `message` — trailing, keyword-only,
         OPTIONAL, unique within the section, joining the section's existing
         id namespace (`CONNECTOR-IDENTITY-KEY`). `figdown 0.4 … id=e1` is a line
         error naming the version and offering the one-step fix: raise the
         header, or delete the key — an anonymous connector stays legal and
         claims nothing less. `figdown 0.5` adds NO genre:
         `GENRES_BY_VERSION['0.5']` is a copy of `0.4`'s. One consumer lands
         with the handle: a `bundle` member may now be a connector id as well
         as an `a--b` pair (`EDGE-IDENTITY-CONSUMERS`), told apart by lexis (`--` cannot occur
         inside an id) — a LAG of N > 1 parallel links between one pair of
         devices is expressible for the first time, and item 2 above names
         the id-member route as the way to make an honest, narrow lasso.
         `data-edge` changes its VALUE, not its name: it carries the authored
         id where the connector has one and the 1-based source line where it
         does not.

         **4. What is NOT in this entry, and why.** Three further batches
         landed in the 0.5 line and none of them is a migration item,
         because none touches what a `.fd` construct means: the editor gained
         a genre-aware property inspector and closed a label-corruption class
         in its GUI edit path; every typed-block renderer
         (`bitfield`/`table`/`chart`/`timing`) now sizes its section's canvas
         from the UNION of its data extent and its own title's width, so a
         title that used to run off the right edge is now fully drawn — this
         changed zero shipped artifacts, measured over the whole corpus
         (`TYPED-BLOCK-TITLE-CANVAS`); and the table and bitfield gained parametric
         GUIs, multi-select, align/distribute/duplicate, and a source pane
         with registry-driven syntax highlighting. All three
         are editor- or renderer-only: the parser, the model and every
         renderer's semantics are byte-unchanged, and no `.fd` in the tree
         changes what it parses to.

Rule:    **NOTHING TO REWRITE for items 1 and 2 — both are author decisions
         about MEANING, not spellings, so `tools/migrate-figdown.js`
         deliberately gains no rule for either.** If either check fires
         against your own figure:

           REPARTITION THE CLASS PAIR   move one class's paint to a channel
                                 the other does not use, or drop one of the
                                 two classes from the element.
           FIX THE LASSO         move the pin that stretches the ring over
                                 the bystander, add the bystander's link to
                                 the bundle's membership, or narrow the
                                 lasso by naming id members instead of pairs
                                 (item 3 above).
           RAISE THE HEADER      only for `id=`, and only in the section
                                 that writes it.

         **The header does not move for items 1 or 2.** Raising a section to
         `figdown 0.5` neither causes nor cures either, and leaving it at
         `figdown 0.4` does not defer either — both are engine behaviour, not
         a version gate. A document with no colliding class pair and no
         lasso enclosing a bystander is unaffected in every respect and needs
         no run of the tool for either.

         **One tool behaviour for item 3.** `tools/migrate-figdown.js` gains
         one PRE-PASS and no rename rule: a section that already writes
         `id=` on a connector and declares a version below `0.5` has its
         HEADER raised to `figdown 0.5`, per section, only where the key is
         actually present — the same shape `KEYWORD-RENAME-SCOPE`'s flowchart header bump has,
         and for the same reason (a tool that emits a document which does
         not parse is worse than one that emits nothing). Fixture
         `tools/migrate-fixtures/126-connector-id-header-bump`: a first
         section writing `id=` under a `figdown 0.4` header is bumped to
         `0.5`; a second section writing no `id=` keeps its own version
         (`figdown 0.3`, untouched); a third section already at `figdown
         0.5` is left alone — the pre-pass does not fire twice, and running
         the tool over its own output changes nothing.

         **Rebuild your artifacts.** `data-engine-version=` moves for every
         artifact and no drawing in the corpus changes, because no published
         `.fd` writes `id=` except the one figure added with `CONNECTOR-IDENTITY-KEY`, and no
         shipped figure has a colliding class pair or an enclosing lasso.

Example: `figdown 0.5 topology` … `edge sw1 -- sw2 id=lag1a`
                                   → parses; `id=` is new vocabulary
         `figdown 0.4 topology` … `edge sw1 -- sw2 id=lag1a`
                                   → `id= requires figdown 0.5 (this document
                                     declares 0.4)` — raise the header, or
                                     delete the key
         `class tagged "…" stroke=#c00` + `class untagged "…" stroke=#333`
         on one `node … class=tagged,untagged`, under **any** declared
         version
                                   → line error naming both classes and
                                     `stroke=`; before this release the
                                     second class won silently
         a `bundle`'s lasso enclosing a node its own source never gave it,
         under **any** declared version
                                   → auto-layout: the bystander moves clear,
                                     silently; a `pin` chose the coordinate:
                                     geometry-time error, nothing rendered

Classification: **ADDITIVE at the language surface, and two behaviour
         hardenings that are free of the version gate.** `id=` adds a key
         behind a version gate and removes nothing; every `figdown 0.1`,
         `0.2`, `0.3` and `0.4` document parses to the same model and every
         golden of all four versions passes unmodified. Two goldens moved
         for the version set, the same two every `Y` moves:
         `014-header-bad-version` now uses `0.6` as its unsupported-minor
         example (same subject, same name, same citation — expect this once
         per `Y` for as long as the fixture exists), and
         `016-header-major-version`'s message text gained the fifth accepted
         version. The class-channel collision check (`CLASS-CHANNEL-COLLISION`) and the lasso
         truth check (`LASSO-ENCLOSURE-TRUTH`) are BREAKING outside the promise in the same
         sense the `0.3 → 0.4` group-band refusal was: each is measured at
         **zero** instances over the shipped corpus (five multi-class sites
         for `CLASS-CHANNEL-COLLISION`, four lassos over four figures for `LASSO-ENCLOSURE-TRUTH`), so nothing
         shipped becomes UNAVAILABLE by them. Nothing else becomes
         UNAVAILABLE either:
         [`archive/0.1/figdown.html`](../archive/0.1/figdown.html) and
         [`read/0.1/`](../read/0.1/reading.md) are byte-untouched,
         `read/0.4/` freezes here on the same terms as `read/0.1/`–`read/0.3/`,
         and `gate:archive` holds `0.1` so. `read/0.5/` carries `read/0.4/`
         plus the `id=` handle's reading rule.

Ruling:  `CONNECTOR-IDENTITY-KEY` (the `id=` key, the gate, and the restated discriminator —
         core §13.7.2a); `EDGE-IDENTITY-CONSUMERS` (the `bundle` id-member widening and
         `data-edge`); `MEMBER-LIST-DUPLICATION` (the duplicate rule that survives the widening
         unchanged); `CLASS-CHANNEL-COLLISION` (the class-channel collision, ungated); `LASSO-ENCLOSURE-TRUTH` (the
         lasso truth check, ungated); backlog items 68 and 69 (the UNH-IOL
         validation-exercise findings that ruled `CLASS-CHANNEL-COLLISION` and `LASSO-ENCLOSURE-TRUTH`); `DRAWN-ANNOTATION-FORM`, `MARKER-TARGET-KINDS`,
         `STATECHART-GENRE-SCOPE`, `KEYWORD-RENAME-SCOPE`, `SEQUENCE-GENRE-VOCABULARY` (the gating precedents `id=` joins and the
         diagnostic device it reuses); `LINK-OPERATOR-IN-IDS`/`QUOTED-IDS` (the id lexis); `CLASS-EMPTY-MEANING` (a handle
         is not a category); `DOMAIN-CONVENTION-DIRECTIVES` (the engine owns the ring, the author owns
         what it collects); `LAYOUT-STABILITY` (element-direct paint stays overriding, out
         of `CLASS-CHANNEL-COLLISION`'s scope); `TYPED-BLOCK-TITLE-CANVAS` (the typed-block title fix, 0.5, not
         a migration item); core §13.0 (a new key is a `Y`), §13.0.4 (`N`
         never resets), §13.5 (the archive promise), §13.7, §13.7.2,
         §13.7.2a and §13.7.5.
