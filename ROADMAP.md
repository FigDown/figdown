# Roadmap

This page is a **readable projection**, not a second registry. It does not
decide anything and it is not itself an authority — every number and every
priority here is derived from documents that already carry the ruling, and
where this page and one of them disagree, the other document is right. Two
authorities it projects: decisions/registry.md
(the ratified 1.0 gate) and
decisions/registry.md (the
registered work candidates, each unruled until it is ruled on its own). Nothing
below binds by virtue of appearing on this page.

## Where the language is

`figdown 0.5.0` — a preview, and it says so in normative text (core §13.1).
Three genres are **NORMATIVE**, inside the v0.1 conformance surface and the
compatibility promise: `block`, `bitfield`, `table`. Five are **EXPERIMENTAL**
and may still change or be withdrawn: `topology`, `flowchart`, `timing`,
`statechart`, `sequence`. Every genre document states its own status; nothing
here overrides it.

Of the five, `topology` is the pilot for leaving EXPERIMENTAL. **`GENRE-GRADUATION-ORDER`** ruled
that promotion runs one genre at a time, `topology` first — it is the only
experimental genre with a completed vocabulary-source survey and a verdict
(RFC 8345) — and that `flowchart` is next, but only after 1.0 ships. `timing`,
`statechart` and `sequence` stay EXPERIMENTAL through 1.0.

## The road to 1.0

The gate is 23 criteria across five groups, each separately rulable, written
down in decisions/registry.md. That
document is the authority; this page does not restate its scoreboard as a
number, because a number copied here is a number that can go stale where
nobody is watching it — read the live count and its evidence on the
document itself, or on [PROOF.md](PROOF.md), which regenerates from the tree
on every change. The satisfied/open split lives in that document's
Scoreboard, which derives it from its own row headings; this page deliberately
carries no copy of it, because the copy that used to sit here went stale
twice.

What's still open, by group. Every piece below is owned by a registered
item in the project's working record, which is not published, except where
the entry says **no item owns** it:

- **LANGUAGE** — grammar layering + BCP 14 discipline; error
  recovery, specified or scoped out (`ERROR-RECOVERY-MODEL`); the identity/locator
  model's last two pieces, the locator coordinate grammar and termination
  points (the topology graduation gate below); the `x-` extension
  policy, which **no item owns** — the exit-criteria document names this as
  the one registry gap it found; open/closed-world inference classes
  (two registered items: one for the spec text, one for the measurement).
- **SEMANTIC INTEROP** — the semantic projection and its hash (stage 2
  of the work `tools/figdown-diff.js` already stands on); whether
  diagnostic codes become normative, which is HELD with this page's own
  authority document as the standing reopen condition.
- **CONFORMANCE** — a second independent implementation, which **no item
  owns because it is not work this project can do alone** (see the
  adversarial exercise below, which is what 1.0 asks for instead); the
  layout-stability instrument's row (the edit-locality audit
  itself already shipped as `gate:locality` under `BOUNDED-GROWTH-ACCOMMODATION`, see the document for
  this row's exact standing).
- **PUBLICATION** — nothing. Both rows closed on 2026-08-22: the publication
  manifest and provenance profile (`PUBLICATION-MANIFEST-PROFILE`) shipped as
  `spec/figdown-manifest.md` with its schema and `gate:manifest`, and the
  accessibility profile (`ACCESSIBILITY-PROFILE`) shipped as
  `spec/figdown-a11y.md` with the `with-a11y` render option and `gate:a11y`.
  One obligation is carried rather than closed and the exit-criteria document
  names it under P2: an `img` role downgrade has no manifest field to be
  declared in.
- **ECOSYSTEM** — a working implementation nobody here maintains, which
  **no item owns**, by construction; a real-world corpus characterised
  honestly, which stands on a 2026-08-05 maintainer ruling rather than on
  any registered item.

## The near horizon

Three pieces of work sit closest to landing:

- **The topology graduation gate (`RESERVED-SPELLINGS`).** `topology`'s promotion survey
  named a prioritized, gate-assigned list; one item (link identity) is
  already discharged. What's left is coupled — the attach-point object and
  the `edge` → `link` rename move together, or not at all.
- **The adversarial spec-only exercise (`INDEPENDENT-IMPLEMENTATION-CRITERION`).** 1.0 does not require a
  second implementation to exist first. It does require a reader armed with
  nothing but the frozen spec and the frozen normative conformance
  partition — no engine source, no design documents — to attempt a parser
  and model producer against every fixture in that partition, with every point
  where they had to consult the engine or guess filed as a spec defect and
  fixed. The deliverable is that defect list, not a working parser.
- **The identity model's remaining pieces.** The locator coordinate
  grammar is designed and unbuilt. Two open questions it feeds are the
  publication/provenance profile (`PUBLICATION-MANIFEST-PROFILE`) and the accessibility
  profile (`ACCESSIBILITY-PROFILE`).

## What is deliberately not planned

Some requests were asked for, evaluated, and declined — each with the
specific evidence that would reopen it, not a vague "maybe later." See
[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md#not-planned)'s Not-planned table rather
than a copy of it here; a second list invites the two to disagree.

## How priorities change

Priorities on this page change only by ruling — dated, numbered, and recorded
in decisions/registry.md's ledger —
never by editing this file directly to reflect a preference.
