# FigDown errata — corrections to frozen reading contracts

This is the project's register of **errata against frozen release trees**
(`read/<X.Y>/` and `archive/`). It exists because those trees are never
edited: §13.5 and §13.7.3 hold their bytes immutable so that what a released
language version *said* is preserved exactly. When one of them is found to
say something **wrong** — not something that later *changed*, but a
description that was already wrong on the day it shipped — the bytes still
stand, and the correction is recorded here instead.

**An erratum is not a version change.** The engine's behaviour did not move;
only the words describing it were wrong. So there is no MIGRATIONS entry, no
engine increment, and no `figdown` header bump. The distinction is the whole
reason this file is separate from [migrations.md](migrations.md), which is the
narrative index of things that genuinely *changed between language versions*
and is tied byte-for-byte to the engine's source state
(`tools/version-check.js`). Writing an erratum into MIGRATIONS would assert an
engine state that does not exist.

**How a reader uses this file.** A frozen `read/<X.Y>/` document cannot point
forward to its own correction — its bytes are fixed. So the pointer runs the
other way: an agent that enters through `skill/figdown/SKILL.md` is told to
consult this register before trusting the frozen reading contract it then
loads. Each entry below names the exact frozen wording, quotes it verbatim (so
`gate:errata` can prove it is really there), gives the correct wording, cites
the ruling that supersedes it, and states which future read tree carries the
fix.

**The hard part, named and not papered over.** A correction recorded here
reaches a consumer of the frozen `read/` tree **only through this register**,
until a *new language version's* read tree is written with the corrected
wording. A clarification that applies to an already-frozen language version
(as E1 does to `figdown` 0.1, 0.2 and 0.3) never reaches those three frozen
trees at all — they stay wrong-by-bytes forever, correct-by-erratum here. That
gap is real; this file is the only bridge across it.

---

## E1 — the layout zone's ignorability, stated by textual position instead of namespace membership

- **Superseding ruling:** `GENRE-NAMESPACE`
- **Affected language versions:** `figdown` 0.1, 0.2, 0.3
- **Frozen files carrying the wrong wording:**
  - `read/0.1/reading.md`
  - `read/0.2/reading.md`
  - `read/0.3/reading.md`

  and, transitively, `skill/figdown/reference/reading.md`, which
  `gate:skill-coverage` (check 0, VENDOR) holds byte-identical to whichever
  read tree is LIVE. From 0.1 to 0.3 the live tree was
  `read/0.3/reading.md`, so the vendored copy carried the wrong wording with it
  and could not be corrected independently of the frozen source.
  The live tree became the 0.4 one, and the vendored copy now carries the
  corrected wording — see the discharge note at the end of this file.

- **Wrong wording** (verbatim, and present in every frozen file above):

  > Ignore the layout zone
  > Everything from the `layout` keyword down is

  The full sentence reads *"Ignore the layout zone. Everything from the
  `layout` keyword down is geometry …"*, and the same document later says it is
  what *"lets you skip the layout zone without first knowing the genre."*

- **Why it is wrong.** The test it states is **textual position** — everything
  *below* the `layout` keyword. But a `pin` MAY legally appear **before** the
  `layout` opener, and the engine parses it identically in either place
  (`sawLayout` is a document-wide flag). `GENRE-NAMESPACE` measured the live corpus: of 229
  `pin` lines, 123 — about **54%** — sit outside any zone. A reader applying
  the position test literally would miss more than half of them.

- **Correct wording** (the rule the frozen text should have stated, now live in
  `core.md` §10 (a′) and stated in the skill body):

  > Ignore the layout **namespace**. Its one member today is `pin`. Ignore
  > every member wherever it appears — **membership decides, never position**.
  > A `pin` before the `layout` line is ignored on exactly the same terms as
  > one after it.

- **Bytes deliberately unchanged.** The three `read/` files above are **not**
  edited, on purpose. They correctly preserve what each frozen language version
  *said*; this entry records that what they said was wrong. Editing them would
  break the freeze (§13.5, and the publish pipeline's T15 immutability exit)
  and would destroy the record of the released wording. The frozen bytes are
  right to be wrong; the correction lives here.

- **Apply to the next read tree — DONE.** The author who writes
  the next `read/<X.Y>/` (see the version-scheme note below) MUST write the
  corrected namespace-based wording there rather than copying the
  position-based wording forward. That tree is the 0.4 one and it was written
  that way; the discharge note at the end of this file records it. This entry
  was the only correction a `read/` consumer could reach until then, and it
  remains the only one for a consumer who reads a frozen 0.1–0.3 tree directly.

---

## The next read tree — is the fix reachable soon, or only at the next `Y`?

A read tree is indexed by **language version `figdown X.Y`**, not by release
version `X.Y.Z` (core.md §13.0, §13.7.1). Consequences for E1:

- A **`0.3.z` patch release** (0.3.1, 0.3.2, …) implements language version
  `figdown 0.3` and **reuses the frozen `read/0.3/` unchanged**. It does **not**
  create a new read tree, so it cannot carry the E1 correction.
- The correction becomes reachable only when a **new language version** ships —
  the next `Y`, `figdown 0.4`, which owes a new `read/0.4/` written from
  `read/0.3/` plus its own changes (the §13.7.1 rule that produced `read/0.2/`
  and `read/0.3/`). **`read/0.4/` is where E1's corrected wording lands.**

Plainly, for the maintainer: **E1 was not reachable in any 0.3.z release.** It
reached `read/` consumers only through this register until `figdown 0.4` shipped
its `read/0.4/` tree.

---

## Discharged — E1

`figdown 0.4` landed (core.md §13.7.4) and with it `read/0.4/`, written from
`read/0.3/`. `read/0.4/reading.md` states the rule by **namespace membership**:

> Ignore the layout namespace. Its one member today is `pin`. Ignore every
> member **wherever it appears** — membership decides, never position. A `pin`
> written *before* the `layout` line is ignored on exactly the same terms as
> one written after it …

and the sentence that later said *"lets you skip the layout zone"* now says
*"lets you skip the layout namespace"*. The position-based wording was **not**
copied forward. `tools/make-skill.js` and `tools/skill-coverage.js` were
repointed from `read/0.3/` to `read/0.4/` in the same increment, so
`skill/figdown/reference/reading.md` carries the corrected wording too and
`skill/figdown/SKILL.md` no longer has to print the correction beside it.

**What is NOT discharged, and never will be.** `read/0.1/`, `read/0.2/` and
`read/0.3/` still carry the position-based wording, byte for byte, and that is
the freeze working rather than a residual defect. A consumer who reads one of
those three trees directly still reaches the correction only through the E1
entry above. That is why the entry stays here, green and unedited in its
substance, after the fix has shipped: an erratum against a frozen version is
never retired, because the bytes it corrects are never retired either.
