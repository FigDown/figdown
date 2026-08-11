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
first release the archive obligation attaches to, and the first entry
that will carry those two links.

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
