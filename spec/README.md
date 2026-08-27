# The FigDown specification

This directory is the normative definition of the language. It is split in two,
and the split is the first thing to understand.

## Frozen and experimental

Every keyword, option key and enum value in FigDown carries exactly one status.

**NORMATIVE (frozen).** In the v0.1 conformance surface and inside the
change-management promise. A frozen construct **may still change** — *frozen*
names the **scope of the promise, not the absence of change** — but a change to
one must ship, in the same release, all three of:

1. an entry in [`migrations.md`](migrations.md) carrying a **mechanical rewrite
   rule** (any step that cannot be mechanised is flagged as such),
2. a **named diagnostic**, so a document written against the old spelling fails
   loudly and by name rather than silently changing meaning, and
3. the corresponding rewrite in the migration tool, which is **cumulative and
   idempotent** across versions — a document from any earlier version reaches
   the current one in a single run, and re-running on a current document
   changes nothing.

**EXPERIMENTAL.** The engine accepts it and renders it, and it may change or be
withdrawn in a later `0.x` release with **none** of (1), (2) or (3). It is not
in the conformance surface and not in the compatibility promise. The parser
emits no warning for an experimental construct, so a reader that needs a
portable figure must consult the status column rather than infer status from
the fact that a line parsed.

Neither status is a claim of stability. **FigDown language `0.x` is a preview
and is NOT stable**; stability begins at language `1.0`. The normative policy is
[`core.md` §13](core.md#13-stability-and-versioning-normative), and the short
version is in the [repository README](../README.md#stability--read-this-before-adopting).

## Two version numbers, and which one this directory versions

This directory versions the **language**. That is the number in every `.fd`
header, and it is the number §13's compatibility promise is about.

The scheme is normative in [`core.md` §13.0](core.md#13-stability-and-versioning-normative);
in summary:

| number | versions | where it is written |
|---|---|---|
| **`figdown X.Y`** | the **document format** | the `figdown` header line of every `.fd` file |
| **`vX.Y.Z`** | the **release** — this repository and its engine | the git tag, `package.json`, every artifact's `data-engine-version` |

**`figdown X.Y` is the first two parts of `vX.Y.Z`.** Release `v0.3.2`
implements language `figdown 0.3`. The language number has no third part: a `Z`
bump is by definition a change the language did not make.

A `Z` release is one where **the language did not move** — that is the test, not
the size of the change: no document's meaning changes and none needs a rewrite,
so a `Z` may still add a tool, a profile, a schema, a render option or a gate.
`Y` adds and never removes; `X` is the only place support
may be removed, and removing it forces a migration. Because retiring a spelling
*is* removing support, **a rename takes an `X` bump** — after `v1.0.0` a frozen
construct cannot be renamed inside `figdown 1.y` (§13.9).

### Why the distinction is load-bearing here

Three promises are commonly collapsed into the word "version". They are
distinct, they have different conditions, and the specification separates them:

| promise | condition |
|---|---|
| **Compatible** — the document's meaning is preserved | same `X`, engine `Y` ≥ document `y`; **from `v1.0.0` only** |
| **Reproducible** — the SVG bytes are identical | same source **and** same release version; holds today |
| **Available** — the archived engine still runs | unconditional, from the first release |

A document can be compatible without being reproducible, and reproducible
without being compatible under a newer engine. **Available** is the one
unconditional commitment 0.x can make, and it is why "best effort" migration is
honest rather than empty: the engine that understood your document already
exists and cannot be taken away.

This directory's own division of labour follows the same split.
[`migrations.md`](migrations.md) records **language** changes only;
[`CHANGELOG.md`](../CHANGELOG.md) records releases.

## Experimental material is isolated at file level

Experimental constructs and genres are not marked inline inside frozen prose.
They live in **files of their own**, so that a reader — or an agent — who wants
only the v0.1 conformance surface can ignore those files whole. These are the
files, and there are no others:

| Experimental file | Holds |
|---|---|
| [`experimental.md`](experimental.md) | the definitions of every experimental cross-genre construct |
| [`genres/experimental/topology.md`](genres/experimental/topology.md) | the `topology` genre |
| [`genres/experimental/flowchart.md`](genres/experimental/flowchart.md) | the `flowchart` genre |
| [`genres/experimental/timing.md`](genres/experimental/timing.md) | the `timing` genre |

Two directories elsewhere in the repository belong to the same set:
`conformance/experimental/` (fixtures whose subject is outside the v0.1
surface) and `examples/reference/experimental/` (specimens that exercise it).

A frozen file **may name** an experimental construct — a closed language has to
be able to say what exists, so the registry lists them — and every such mention
is marked and points at the definition. What a frozen file may never do is
**define** one, or **depend** on one.

The test, stated so it can be run rather than believed:

> Delete the experimental file set. What remains must still be a complete,
> self-consistent standard with no dangling normative reference.

`tools/isolation-check.js --strict` is exactly that test, and it runs on every
change.

## What promises what

| | Frozen | Experimental |
|---|---|---|
| Can it change in a later 0.x? | yes | yes |
| Migration entry with a mechanical rewrite rule | **required** | not required |
| Named diagnostic for the old spelling | **required** | not required |
| Covered by the conformance suite | **yes** | tracked separately |
| Safe to build a corpus on today | as safe as 0.x gets | no |
| Can be withdrawn outright | no — it is migrated, not dropped | yes |

If you are choosing what to standardise on inside your own documentation, the
practical reading is: **build on the frozen surface, and treat anything
experimental as something you have agreed to rewrite by hand later.**

## The files

**Frozen — the language.**

| File | What it is |
|---|---|
| [`core.md`](core.md) | the cross-genre contract: document skeleton, core scene model, layout tiers, presentation, error model, keyword and option-key registries, ABNF, the **normative semantic model** (§12) including the reading-agent contract (§12.7), and the stability policy (§13) |
| [`genres/README.md`](genres/README.md) | how genres work as namespaces, and the index of the per-genre documents |
| [`genres/block.md`](genres/block.md), [`genres/bitfield.md`](genres/bitfield.md), [`genres/table.md`](genres/table.md) | one self-contained normative document per frozen genre: defaults, the **complete vocabulary table** (every keyword, option key, enum value and default valid under that genre, each with its status), semantic model, errors, a worked example, and what the genre does *not* own |
| [`migrations.md`](migrations.md) | the version log: every syntax change with its mechanical rewrite rule and its named diagnostic |
| [`syntax-style.md`](syntax-style.md) | the internal style rules the syntax obeys, so that a new construct is spelled the way the existing ones are |
| [`vocabulary-sources.tsv`](vocabulary-sources.tsv) | for each borrowed term, the external standard it was taken from |

**Experimental — outside the promise.**

| File | What it is |
|---|---|
| [`experimental.md`](experimental.md) | every experimental cross-genre construct, defined here and nowhere else |
| [`genres/experimental/`](genres/experimental/) | the three experimental genres |

## Reading order

- **Implementing?** `core.md` end to end, then the genre document for each genre
  you support, then `conformance/` — the fixtures are written to be passed
  without ever reading the reference engine.
- **Authoring?** You do not need this directory. Start at
  [`guide/authoring.md`](../guide/authoring.md); come here only for the genre
  vocabulary table when you need to know exactly what is legal.
- **Reading `.fd` programmatically?** [`guide/agents.md`](../guide/agents.md),
  then `core.md` §12 — the semantic model is what you are reading, and §12.7
  bounds what you are allowed to conclude from it.
- **Arguing about the language?** `core.md` for what it says today,
  [`decisions/`](../decisions/README.md) for why, and
  [`.github/CONTRIBUTING.md`](../.github/CONTRIBUTING.md) for how to change it.
