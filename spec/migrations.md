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

---

## 0.1 — first released language version

Language `figdown 0.1` is the first released version, so **there is no earlier
released version to migrate from and this log has no entry before it.**

The language was developed through a series of pre-release increments. Those
were never published, no document was ever written against one outside the
project, and their hop-by-hop rewrite rules are development history rather than
anything a reader of this repository can act on. They are not reproduced here.

**What this means in practice:**

- **A document declaring `figdown 0.1` needs no migration.** It is written
  against the first released version.
- **The next entry will be the first change to the language**, carrying the
  mechanical rewrite rule, the named diagnostic, and the matching rewrite in
  `tools/migrate-figdown.js`, exactly as the policy above requires.
- **`tools/migrate-figdown.js` is still cumulative and idempotent**
  ([core.md §13.4](core.md#134-0x-is-a-rehearsal--what-that-means)). It retains
  every rewrite the project has ever shipped, including the pre-release ones
  this log does not narrate. Running it on a `figdown 0.1` document changes
  nothing, which is the correct result rather than an absence of one.
  `tools/migrate-check.js` is the suite that proves it.

If you hold a document written against a pre-release engine, it is not a
`figdown 0.1` document and this log cannot tell you how to convert it. Run
`tools/migrate-figdown.js` over it: the tool reports anything it cannot do
mechanically.
