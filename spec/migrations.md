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
