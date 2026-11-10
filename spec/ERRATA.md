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

## E2 — `statechart`'s default shape, stated as `box`

- **Superseding ruling:** `STATECHART-GENRE-SCOPE` — the genre is the only place "this is a state
  machine" is written, which is why its `SHAPE-ENUM-VOCABULARY` rule says not to encode state-ness
  in a shape. The direct cause is the repair that shipped in `v0.4.1`,
  which made `state` derive `rounded` so that obeying `SHAPE-ENUM-VOCABULARY` no longer drew a
  process box.
- **Affected language versions:** `figdown` 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.5/experimental/statechart.md`

  and, transitively, `skill/figdown/reference/experimental/statechart.md`,
  which `gate:skill-coverage` holds byte-identical to the live read tree, so
  every agent that loads the skill is told the wrong default.

- **Wrong wording** (verbatim):

  > `shape=` is pure geometry and changes only the drawing — `shape=box` (the
  > default), `shape=rounded`, `shape=circle`, `shape=ellipse`, `shape=diamond`,

- **Why it is wrong.** A `state` with no `shape=` is drawn `rounded`, not
  `box`, and has been since `v0.4.1` — before `read/0.5/` was written, so
  the text was wrong on the day it shipped. Probed on the public tags: a
  `state` with no `shape=` derives `box` at `v0.4.0` and `rounded` at
  `v0.4.1` and every later release.

- **Correct wording:**

  > `shape=` is pure geometry and changes only the drawing — `shape=rounded`
  > (the default for a `state`), `shape=box`, `shape=circle`, `shape=ellipse`,
  > `shape=diamond`,

- **`read/0.4/` is not an erratum.** `read/0.4/experimental/statechart.md`
  carries the same sentence, and it was right when `v0.4.0` shipped it: that
  engine draws a `state` as `box`. The default changed in `v0.4.1`, which
  reused `read/0.4/` byte for byte, so it is a change, and it is recorded where
  changes are recorded: the `v0.4.1` changelog entry ("`state` derives its
  rounded geometry from the word").

- **Bytes deliberately unchanged**, for the reasons E1 gives: the frozen file
  keeps what `figdown 0.5` shipped, and the correction lives here.

- **Apply to the next read tree.** Whoever writes the next `read/<X.Y>/`
  MUST write the corrected wording rather than copying this sentence forward.

---

## E3 — `layout.md` sends an installed agent to a tool it does not have

- **Superseding ruling:** `SKILL-BUNDLE-LINK-ROOT` — the skill bundle is read from an installed
  copy with no repository above it, so it may only point at what ships inside
  it.
- **Affected language versions:** `figdown` 0.1, 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.1/layout.md`
  - `read/0.2/layout.md`
  - `read/0.3/layout.md`
  - `read/0.4/layout.md`
  - `read/0.5/layout.md`

  and, transitively, `skill/figdown/reference/layout.md`.

- **Wrong wording** (verbatim):

  > Iteration loop: build → look at the SVG → run `node tools/layout-lint.js` →

- **Why it is wrong.** `tools/layout-lint.js` is in neither the skill bundle
  nor the npm package; an agent working from an installed copy cannot run it.
  The sentence is true only inside the source repository.

- **Correct wording:**

  > Iteration loop: build → look at the SVG → add **one** rung → repeat → stop
  > when it is legible. (In the source repository, `node tools/layout-lint.js`
  > also scores the drawing.)

- **Apply to the next read tree.**

---

## E4 — `bundle` is said to take `fill=`, and (in 0.5) parallel links to be unspellable

- **Superseding ruling:** `INTERIOR-LESS-ELEMENT-PAINT` — a key may not name a channel the element does
  not have; a ring has no interior, so `fill=` on `bundle` was retired. For the second sentence, `EDGE-IDENTITY-CONSUMERS`: a `bundle` member may be a
  connector id, which is exactly how one of two parallel links is named.
- **Affected language versions:** `figdown` 0.3, 0.4 and 0.5 (the `fill=`
  sentence); 0.5 only (the parallel-link sentence — before `figdown 0.5`
  there was no connector id, and it was true)
- **Frozen files carrying the wrong wording:**
  - `read/0.3/experimental/topology.md`
  - `read/0.4/experimental/topology.md`
  - `read/0.5/experimental/topology.md`

  and, transitively, `skill/figdown/reference/experimental/topology.md`.

- **Wrong wording** (verbatim):

  > - `bundle` takes `fill=`, `stroke=` and `style=`; the dashed ring is drawn

  and, in `read/0.5/experimental/topology.md` only:

  > pair, so a bundle over parallel links cannot be spelled — declare the

- **Why it is wrong.** The engine refuses `fill=` on `bundle` under every
  header from `figdown 0.1`; `topology.md`'s own vocabulary row lists
  `stroke` and `style` only. And from `figdown 0.5` a parallel link is named
  by its `id=`, and `bundle lag "LAG" e1,e2` is accepted — the same file
  spells one a few paragraphs later.

- **Correct wording:**

  > - `bundle` takes `stroke=` and `style=`; the dashed ring is drawn for you.

  > (0.5) Two parallel links between one pair are told apart by `id=`, and a
  > bundle names them by id: `bundle lag "LAG" e1,e2`.

- **Apply to the next read tree.**

---

## E5 — `transcribe.md` sends a condition to `description=`

- **Superseding ruling:** `PRESENCE-CONDITION-EXPRESSION` — a condition is carried by the genre's own
  condition key (`present=` on a field), not by a flag or a tooltip.
- **Affected language versions:** `figdown` 0.1, 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.1/transcribe.md`
  - `read/0.2/transcribe.md`
  - `read/0.3/transcribe.md`
  - `read/0.4/transcribe.md`
  - `read/0.5/transcribe.md`

  and, transitively, `skill/figdown/reference/transcribe.md`.

- **Wrong wording** (verbatim):

  > - **Conditional encodings** go in `description="valid when …"` — which draws

- **Why it is wrong.** `node`, `edge`, `group`, `signal`, `table` and
  `bitfield` all refuse `description=` (probed on the `figdown 0.1` archive
  engine and on today's: `node does not take description=`); only `field`
  and the `sequence` elements accept it. Following the advice gives a line
  error.

- **Correct wording:**

  > - **Conditional encodings** go in the genre's condition key — `present=`
  >   on a bitfield `field` — and, if a human must see the condition, in the
  >   label too.

- **Apply to the next read tree.**

---

## E6 — `bitfield.md` says a field's dash can come from a class

- **Superseding ruling:** `CLASS-PAINT-REQUIREMENT` — a class must declare a channel the member it
  joins actually has; a field has no dash channel of its own.
- **Affected language versions:** `figdown` 0.1, 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.1/bitfield.md`
  - `read/0.2/bitfield.md`
  - `read/0.3/bitfield.md`
  - `read/0.4/bitfield.md`
  - `read/0.5/bitfield.md`

  and, transitively, `skill/figdown/reference/bitfield.md`.

- **Wrong wording** (verbatim):

  > A per-field dash comes from `present=` or from a `class=` the field joins.

- **Why it is wrong.** A field that joins a dashed class is drawn solid; only
  the class's legend swatch is dashed (rendered on today's engine and on the
  engine of `read/0.1`'s commit), and `gate:legend` reports that class as an
  unreachable channel.

- **Correct wording:**

  > A per-field dash comes from `present=` only.

- **Apply to the next read tree.**

---

## E7 — `statechart.md` prices a withdrawal at one line per figure

- **Superseding ruling:** `GENRE-NODE-SPELLING` — `state` replaces `node` in `statechart`, so a rewrite back to `block` touches every `state` and `transition` line.
- **Affected language versions:** `figdown` 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.2/experimental/statechart.md`
  - `read/0.3/experimental/statechart.md`
  - `read/0.4/experimental/statechart.md`
  - `read/0.5/experimental/statechart.md`

  and, transitively, the vendored copy under `skill/figdown/reference/` where one exists.

- **Wrong wording** (verbatim):

  > and the rewrite back is one line.

- **Why it is wrong.** `state` and `transition` are `statechart`'s own words. Swapping a statechart's header to `block` is refused on each such line (probed on `turnstile.fd`: 8 errors); six shipped statechart figures hold about 100 such lines.

- **Correct wording:**

  > and the rewrite back is one line per `state` and `transition` line.

- **Apply to the next read tree.**

---

## E8 — `reading.md` says only line 1 names the genre

- **Superseding ruling:** `SPEC-PROVENANCE-LINE` — a `.fd` file's first line is a provenance comment; the header line is the first line that is not blank or a comment.
- **Affected language versions:** `figdown` 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.2/reading.md`
  - `read/0.3/reading.md`
  - `read/0.4/reading.md`
  - `read/0.5/reading.md`

  and, transitively, the vendored copy under `skill/figdown/reference/` where one exists.

- **Wrong wording** (verbatim):

  > machine" in a `title` decides nothing. Only line 1 decides. What you may and

- **Why it is wrong.** No shipped `.fd` starts with `figdown `; line 1 is the provenance comment `SPEC-PROVENANCE-LINE` requires, so a reader who looks only at line 1 finds no genre.

- **Correct wording:**

  > machine" in a `title` decides nothing. Only the header line decides (the first line that is not blank or a comment). What you may and

- **Apply to the next read tree.**

---

## E9 — `scene.md` says the genre is on line 1

- **Superseding ruling:** `SPEC-PROVENANCE-LINE` — a `.fd` file's first line is a provenance comment; the header line is the first line that is not blank or a comment.
- **Affected language versions:** `figdown` 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.3/scene.md`
  - `read/0.4/scene.md`
  - `read/0.5/scene.md`

  and, transitively, the vendored copy under `skill/figdown/reference/` where one exists.

- **Wrong wording** (verbatim):

  > | genre on line 1 | where its vocabulary is declared |

- **Why it is wrong.** Same fault as E8: the genre sits on the header line, not on line 1, in every shipped figure. The same file's other "line 1" mentions (line 6, line 25) carry the same correction.

- **Correct wording:**

  > | genre on the header line | where its vocabulary is declared |

- **Apply to the next read tree.**

---

## E10 — `scene.md` says presentation attributes have no restriction by element kind

- **Superseding ruling:** `INTERIOR-LESS-ELEMENT-PAINT` — a key may not name a channel the element does not have (`STYLE-KEY-SCOPE` applied it to `style=` on `field`, `cell` and `signal`); the engine likewise refuses `style=` on `external` and `fill=` on `fragment`/`operand`.
- **Affected language versions:** `figdown` 0.1, 0.2, 0.3, 0.4 and 0.5
- **Frozen files carrying the wrong wording:**
  - `read/0.1/scene.md`
  - `read/0.2/scene.md`
  - `read/0.3/scene.md`
  - `read/0.4/scene.md`
  - `read/0.5/scene.md`

  and, transitively, the vendored copy under `skill/figdown/reference/` where one exists.

- **Wrong wording** (verbatim):

  > `stroke=` are legal on any element, groups included. There is no restriction
  > by element kind — only the two-channel rule: an `edge` has no

- **Why it is wrong.** The engine refuses some channels on some elements (probed: `external` refuses `style=`; `fragment` and `operand` refuse `fill=`). The acceptor list is in core §5.

- **Correct wording:**

  > Presentation attributes work on most elements; which element takes which is listed in core §5. Beyond that, the two-channel rule: an `edge` has no interior.

- **Apply to the next read tree.**

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

**Carried forward (`CONNECTOR-IDENTITY-KEY`).** `read/0.5/` is written from
`read/0.4/`, so it inherits the corrected wording, and the two tools were
repointed again in that increment. The correction does not have to be
re-applied per release — what §13.7.3 requires is that it lands in the next
read tree WRITTEN, and every tree written after it copies from a corrected
ancestor. `read/0.1/`–`read/0.3/` keep the wording they shipped, which is the
freeze working.

**What is NOT discharged, and never will be.** `read/0.1/`, `read/0.2/` and
`read/0.3/` still carry the position-based wording, byte for byte, and that is
the freeze working rather than a residual defect. A consumer who reads one of
those three trees directly still reaches the correction only through the E1
entry above. That is why the entry stays here, green and unedited in its
substance, after the fix has shipped: an erratum against a frozen version is
never retired, because the bytes it corrects are never retired either.
