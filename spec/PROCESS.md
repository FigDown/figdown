# How the FigDown spec changes

> The other half of a trustworthy standard, next to its test suite:
> a predictable change process. This document is normative for the
> project's own workflow.
>
> 繁體中文版：[PROCESS.zh-tw.md](PROCESS.zh-tw.md)

## 1. Decision model

FigDown uses **maintainer decision with a mandatory evidence chain**:

- The maintainer rules on every language change.
- No ruling stands on taste alone: each one must cite its evidence —
  corpus statistics ([census](../design/census.md) or a targeted
  measurement), a prior-art survey
  ([prior-art](../design/prior-art.md), adoption-weighted), or
  reproducible field feedback.
- Every ruling is recorded permanently as an R (requirement) or D
  (decision) entry in
  [requirements-notes](../design/requirements-notes.md), including
  what was **rejected** and why. The decision log is the project's
  memory; nothing is decided off the record.

## 2. The gate for new syntax

A new directive, option, enum value or template enters the language
only if **all** of these hold (R28/R18/R30):

1. **Semantic impossibility** — the meaning has no chance of precise
   expression through existing constructs. "More convenient" is not
   sufficient; composition is preferred over vocabulary.
2. **Corpus evidence** — real figures need it, with measured
   frequency. Frequency decides *when* (and how short the spelling
   may be — common things spell short); impossibility decides *if*.
3. **Prior art surveyed** — mainstream diagram languages checked
   first, weighted by adoption; borrow before inventing
   (anti-hallucination: AI authors already know mainstream spellings).

The registry (spec §10) is closed: everything not registered is an
error, and additions land only through this gate.

## 3. Obligations of every change

A change to parsing or rendering semantics ships, in the same commit:

- a **[MIGRATIONS](MIGRATIONS.md) entry** with a mechanical rewrite
  rule (non-mechanical steps flagged explicitly) — upgrading vA→vZ is
  applying the entries in order;
- updated **[conformance](../conformance/README.md) goldens** —
  goldens move *only* with a migration entry or a discrepancy
  resolution, never silently;
- the **bilingual spec kept in sync** (English normative, 繁體中文
  parallel);
- an updated agent surface where affected (AGENT-GUIDE, skill bundle).

## 4. Deviations are loud

When implementation and spec disagree, the deviation is recorded in
[conformance/DISCREPANCIES.md](../conformance/DISCREPANCIES.md) and
resolved deliberately — either the engine moves to the spec or the
spec is corrected, each with its paper trail. Silently freezing
engine behavior as de-facto spec is the failure mode this process
exists to prevent.

## 5. Versioning

- Draft period: dated dev increments (`0.1-dev.N`), squashed to
  `figdown 0.1` at freeze; the migration log restarts there.
- After freeze: changes within a major version are backward
  compatible; an unknown major version MUST be rejected by
  implementations; removal/renaming requires a major bump plus a
  migration rule.
- Deprecation: a retired spelling first becomes an **error that names
  its migration entry** (see the retired `label=` family), so the fix
  is one lookup away.

## 6. Proposing a change

Open a GitHub issue using the **syntax proposal** template. It asks
for exactly what the gate needs: the meaning you cannot express, why
existing constructs cannot carry it precisely, real (de-identified)
samples, and any prior art you know. Proposals that arrive with
evidence get rulings fastest; "attacks on the axioms" (tell us where
they break) are explicitly welcome.
