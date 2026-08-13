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
owed, is the `0.1 → 0.2` entry at the end of this log.

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
