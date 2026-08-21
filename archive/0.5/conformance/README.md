# FigDown v0.1 parser-conformance suite

Golden fixtures that pin down the **semantic model** of FigDown v0.1.
The suite is the credibility foundation for freezing v0.1: a second
implementation is written against `spec/` **plus the goldens in this
directory**, and needs **no access to the reference engine** — the spec's
own requirement that the grammar "MUST be mechanically implementable
without consulting the reference PoC" (§11), made checkable. **Three
named exceptions**, measured and stated rather than hidden, are in the
box below; read it before you rely on the sentence above.

> **What "without reading the reference engine" does and does not claim
> (rewritten, after three reviewers measured the old
> wording and it did not hold).**
>
> The old sentence said the suite could be *passed* from `spec/` alone.
> That was **false**, and measurably so: at the time it was written, 100
> of 162 normative fixtures required error message text byte for byte and
> the messages were specified nowhere in `spec/`; 2 required a
> `{"sections": […]}` top-level shape that appeared only in `run.js`; and
> 17 wrote an experimental keyword, against a promise that experimental
> material could be skipped entirely. A standard that claims a property it
> lacks loses its credibility the day an implementer finds the gap. So the
> claim is now stated with its boundary.
>
> **The claim, as it actually holds.** Everything a second implementation
> needs is in files it may read: `spec/` for the grammar and the model,
> and **the goldens in this directory for the error-message catalogue**.
> The goldens are ordinary UTF-8 text; reading one is what the conformance
> recipe asks for, and it is not reading the PoC. `spec/core.md` §8.2 now
> says this outright — **the `.errors.txt` goldens ARE the normative error
> catalogue and §8 is not exhaustive** — which is the honest version of
> what was previously implied and nowhere written.
>
> **What is still NOT reachable, named exactly.**
>
> 1. **Error messages outside the suite.** The engine has ~195 `err()`
>    sites; the goldens pin the messages of a subset. For a rejection case
>    no fixture covers, a second implementation can know the input must be
>    rejected and can match the `Line N:` frame, but **has no way to learn
>    the required words.** What would change it: a fixture per `err()`
>    site, which `ERROR-COVERAGE.md` already measures the distance to.
> 2. **Error RECOVERY, on the fixtures where a failure cascades.** A line
>    that errors abandons its declaration, so a later reference to it
>    raises a second error — and the reference engine is not consistent
>    about this (core §8.3, §9 `ERROR-RECOVERY-MODEL`). An implementation that recovers by
>    keeping the failed declaration produces a different error SET for the
>    same input and fails fixtures whose subject is not recovery at all.
>    Matching those means matching the reference engine's behaviour, which
>    is reasoning the normative documents do not supply. What would change
>    it: a recovery model and a precedence rule in §8, in that order — a
>    MIGRATIONS-entry change, because it moves existing goldens.
> 3. **Normative fixtures write an experimental keyword**, so
>    `spec/experimental.md`'s skip promise is conditional, not absolute.
>    They are enumerated in that file's §E0.1 with what a skipping
>    implementation should do. What would change it: re-authoring the
>    cross-cutting lexical fixtures over the frozen registry only — cheap
>    per file, but it deletes the coverage those files exist to provide,
>    which is why it was not done.
>
>    **The COUNT is not written here, for the reason the rest of this file
>    gives, and it is also DISPUTED — recompute it before
>    quoting it.** This file said *17 of 165*; §E0.1 now
>    says *20 of 189* and enumerates twenty rows. Recomputed against the
>    directory —
>    `grep -lE '^(band|bundle|threshold|timing|signal)\b' conformance/cases/*.fd`
>    — the answer is **23 of 192** (the denominator moved in this release
>    too), and the three §E0.1 does not list are the three
>    fixtures this very release added: `245-block-subject-vocabulary`
>    (`threshold`, `band`), `246-block-withdrawn-cells` (`bundle`) and
>    `918-withdrawn-plane-keyword` (`timing`, `signal`). A twenty-fourth,
>    `912-retired-plot-keyword`, writes `chart` — experimental by core §4.4
>    — which §E0.1's vocabulary has never counted; that is a scoping choice
>    of the table's, older than this release, not a new omission. The
>    discrepancy is recorded rather than quietly corrected here, because
>    §E0.1 owns the enumeration and this file owns neither it nor the
>    resolution.
>
> Items 1 and 2 are the reason this file no longer claims the whole suite
> is reachable from the normative documents. Item 3 is bounded and listed.
> Everything else — the model, the JSON binding including the `sections`
> wrapper (core §12.5), accept/reject, forward references, duplication
> (core §8.1) — is reachable from `spec/` as of 0.1.

> **"Freezing" here does not mean "stable".** *Frozen* names the **scope
> of the change-management promise**: a frozen construct may still change,
> but only with a [migrations.md](../spec/migrations.md) entry, a named
> diagnostic, and a mechanical rewrite in `tools/migrate-figdown.js`.
> **FigDown 0.x is a preview and is NOT stable.** If you are writing a
> second implementation, read
> [spec/core.md §13](../spec/core.md#13-stability-and-versioning-normative)
> first — it also states the two things a conforming engine MUST do about
> declared versions (§13.7): never silently reinterpret a document under a
> version other than the one it declares, and state which versions it
> accepts.
>
> **Not partitioned by version yet.** Per-version partitioning of this
> suite — one golden set per released version, all of them run forever —
> is a v1.0 mechanism and is deliberately deferred (§13.8). Today there is
> one set, tracking the current dev increment.

**The model is defined normatively in
[spec/core.md §12](../spec/core.md), not here** (`NORMATIVE-SEMANTIC-MODEL`).
§12 is the contract: §12.2 lists every entity and every field with its
type, presence rule and meaning; §12.3 states the absent-is-omitted
rule; §12.4 is the exhaustive list of normalization rules; §12.5 makes
the JSON form the canonical binding and works one document through end
to end; §12.6 says what the model deliberately does not carry; §12.7 is
the reading-agent contract. This suite is the **test** of that contract,
and `normalize.js` is the reference **implementation** of it — read §12
first, then come here. Where the two disagree, §12 is the spec and the
disagreement belongs in DISCREPANCIES.md.

**Genre semantics** for bitfield, table, and timing are normatively defined in
[spec/genres/](../spec/genres/bitfield.md) (`GENRE-DOCUMENT-CONTRACT`). The conformance fixtures
for the `4xx`/`5xx`/`6xx` case groups are authored against those genre
documents; a second implementation should consult them for the precise
semantic model and error rules.

## Conformance tiers (spec §3)

The spec defines a tiered determinism/conformance rule; the suite maps
onto it like this:

| spec §3 tier | requirement | how this suite tests it |
|---|---|---|
| parser | "a conforming parser MUST produce the **same semantic model** for the same source" (the model is spec §12) | `cases/*.model.json` goldens — the canonical JSON binding of §12.5, byte-compared |
| parser (error side) | closed grammar: malformed input → `Line N: message`, all errors in one pass, no partial output (§8, §10 strict) | `cases/*.errors.txt` goldens — sorted error lines, byte-compared |
| renderer, same version | "same source + same renderer version → byte-identical SVG" | run.js self-check: every valid case is parsed+rendered **twice** and the SVG bytes compared. No SVG goldens exist — by spec, SVG bytes are renderer-version-specific |
| renderer, cross-implementation | "different renderers SHOULD be visually equivalent (byte-identical output … NOT required)" | **not tested** — out of scope until a Canonical SVG Rendering Profile exists |

A second implementation therefore conforms at the parser tier when, for
every **normative** case, it (a) accepts/rejects exactly as the fixtures
do, (b) reports the same error lines for rejected cases, and (c) produces
the same canonical model for accepted cases. Which cases those are is
settled by **location**: everything in `cases/` is normative, everything in
`experimental/` is not — see the next section.

## Layout

```
conformance/
  run.js               the runner (Node, no dependencies)
  normalize.js         doc → canonical semantic model projection
  STATUS.txt           the REASON manifest for experimental/ (default = normative)
  cases/               the v0.1 conformance surface — NORMATIVE fixtures
    NNN-name.fd            input document (UTF-8, exact bytes matter)
    NNN-name.model.json    golden: canonical model  (valid cases)
    NNN-name.errors.txt    golden: sorted error lines (error cases)
  experimental/        same fixture format, everything outside the surface
  DISCREPANCIES.md     audited engine-vs-spec conflicts frozen in the goldens
```

**Two counts, and only the first is "the conformance suite":** the
NORMATIVE fixtures in `cases/` are the conformance surface; the
EXPERIMENTAL fixtures in `experimental/` also run on a default invocation
and also have to pass, but carry no conformance obligation.

**Do not look for the two numbers here — this file does not carry them.**
`node conformance/run.js` prints the normative count, the experimental
count and the total run separately, recomputed from the directories on
every invocation. That output is what a claim quotes. Copies of it typed
into prose drifted for several releases running and were deleted; the few numbers still written down in this file are marked as
HISTORICAL records of what a past release *changed*.

*Historical.* **The suite's SECOND withdrawal, and — unlike the
first — a withdrawal in two different shapes at once.** `PAINT-ORDER-CONSTRUCT` removed `plane`,
`plane=` and `z-index=` from the LANGUAGE; `SCENE-KEYWORD-MEMBERSHIP` removed sixteen per-genre
CELLS, a word leaving one genre's vocabulary while staying live in another's.
The two shapes cost the suite different things.

The language-wide one follows 0.1 exactly. **SIX experimental fixtures
whose SUBJECT was `plane` were DELETED** — `124-plane-z-index`,
`330-plane-paint-order`, `331-plane-errors`, `332-plane-default-z`,
`333-plane-z-nonnumeric` and `264-edge-plane-quoted-id` — twelve files
carrying 29 non-comment lines of input. `264` is the one that needed a
ruling rather than a rule: its subject is `RULE-POSITION-ENUMERATION`'s fix for the ONE id position
in the language that tolerated a quoted id, and that position was
`edge … plane=`. `edge` has no id-valued option key left, so the behaviour is
unreachable rather than rehostable, which is the test `118-id-quoted-positions`
and `122-points-parenthesised` passed and these did not. **The
deleted numbers are not reused**, the same rule the `38x` band follows.
`334-layer-retired` survives — its subject is a retirement DIAGNOSTIC, which
§10 classifies NORMATIVE — and GREW into the whole chain: `plane`, `layer`,
`layer=`, `plane=`, `z=` and `z-index=`, six lines and six messages. Two of
its hosts moved onto a plain `node`, the `913-withdrawn-edge-geometry-keys`
device: the `plane` sweep runs ahead of the option scan and abandons the
line, so a key written on a `plane` line can no longer be reached at all.

The per-genre one is new and **deletes nothing** — a cell withdrawal moves a
fixture's HEADER, because the construct is still in the language and still has
a genre that declares it. `265-enum-bare-experimental` and
`909-errors-band-chart-bundle` were the entire `band`-under-`topology`
evidence in the tree, and both are parse/diagnostic fixtures rather than
figures anyone needed, so both were **rewritten to `block`** rather than
deleted. `909` needed a SPLIT to do it: `band` left `topology` and `bundle`
left `block`, so its three constructs no longer share one genre, and it is now
two SECTIONS of one file — `block` for `band`/`chart`, `topology` for
`bundle`. Two sections rather than two fixtures because the subject is a set
of static argument errors, not a genre, and the `bundle` half would otherwise
be a fixture of one line; multi-section is the device `224` (four headers) and
`265` (two) already use for exactly this. Two more fixtures lost an
INCIDENTAL `plane` writing and kept everything else — `225-flowchart-flowline`
(`flowline … plane=base`) and `258-edge-options` (a `plane` declaration and a
`plane=` on the edge) — the "kept and adjusted" criterion, unchanged.

**SIX new EXPERIMENTAL fixtures.** Five are the `24x` band and pin the grid
for the three experimental genres: `240-topology-subject-vocabulary` and
`242-flowchart-subject-vocabulary` are the KEEP halves (all three of
`topology`'s words, `flowchart`'s one), and `241-topology-withdrawn-cells`,
`243-flowchart-withdrawn-cells` and `244-statechart-withdrawn-cells` are the
WITHDRAW halves, each cell with its own named diagnostic. `statechart` has no
KEEP fixture because it declares NO subject vocabulary at all — the empty
declaration is what `230` and `233` already pin.

The sixth is `919-withdrawn-plane-experimental-genres`, and it is not part of
that band because the `plane` row of the grid is not a per-cell withdrawal at
all: `plane` is refused by the retired-keyword sweep, which runs **ahead** of
the genre allowlist and answers the same message in **every** genre. That is a
claim about all eight, so all eight are written down — `918` (NORMATIVE) holds
`block`, `bitfield` and `table`, `241` holds `topology` (the genre where every
authored `plane` in the tree was actually written), and `919` holds
`flowchart`, `statechart` and the `timing` genre HEADER. The `timing` section
is the one that earns its place: a region genre never declared a scene keyword,
so nothing in it could be an `SCENE-KEYWORD-MEMBERSHIP` per-cell withdrawal, which makes the message
provably the `PAINT-ORDER-CONSTRUCT` sweep rather than an assertion that it is.

*Historical.* **`208 → 218`** — eight NORMATIVE fixtures
(normative `165 → 173`) and two EXPERIMENTAL (`43 → 45`). **Exactly one
existing golden moved**: `254-edge-label-errors` lost the line that pinned
`edge a -[has # hash]-> b` as `unterminated [label]`, because `VERBATIM-REGION-SCOPE` made `#`
honour the `[ ]` verbatim region as `;` already did — that line is now a
MODEL golden in the new `262-edge-bracket-hash`. Case `253` already pinned
the quoted workaround `["has # hash"]`, and the two were **deliberate
goldens encoding opposite answers about one region**. The other new
fixtures pin `RULE-POSITION-ENUMERATION`: `125-typed-block-label-quotes`, `126-enum-bare-header`,
`127-enum-bare`, `128-quotes-inert-numeric` (the complement — quoting stays
inert at number/point/range positions), `263-edge-option-quoting`,
`422-bitfield-index-step-reserved` and `423-bitfield-index-step-prose`
(what the `step` reservation deliberately does NOT catch), plus
`264-edge-plane-quoted-id` and `265-enum-bare-experimental` in
`experimental/`. (`264` was DELETED with the `plane=` position
its subject rode on; `265`'s first section was rewritten from `topology` to
`block` in the same release. See the 0.3 record above.)

*Historical.* **`205 → 208`, an addition of three NORMATIVE
fixtures and nothing else** (normative `162 → 165`; experimental unchanged
at 43). No fixture was deleted, renamed, retagged or regenerated, and no
existing golden byte changed — the release states behaviour the engine
already had, so all 162 pre-existing normative fixtures pass unmodified.
The three close gaps a normative document had left open:
`020-multi-section-id-reuse` (ids are unique **per section**, resolving a
contradiction between two paragraphs of core §1 that no fixture decided),
`021-forward-references` (`edge a -> b` before `node a`, `in=` before its
`group`, `class=` before its `class` — resolution is a post-pass, so a
single-pass resolver was passing all 162 cases while rejecting legal
documents), and `022-duplicate-edge-and-rank` (an identical `edge` written
twice is **two** edges with no de-duplication; `rank` lines with
overlapping ids are kept unmerged — core §8.1).

*Historical.* **`203 → 205`, an addition of two NORMATIVE
fixtures and nothing else.** `BITFIELD-REPETITION-CONSTRUCT` registered `index=`, and it arrived with
`420-bitfield-index-tristate` (the model shape of the tri-state, including the
quoted and unquoted spellings of one literal range projecting identically —
the pin on "determinacy is decided by parsing both ends, never by quoting")
and `421-bitfield-index-errors` (all five named errors plus the duplicate-key
invariant). `RANGE-SPELLING`'s `band` hyphen retirement needed no new file: it is one more
line in the existing `373-band-errors`, which is EXPERIMENTAL because `band`
is. No fixture was deleted, renamed or retagged.

*Historical.* **`213 → 203` was the suite's first WITHDRAWAL,
and it is a real deletion — the only kind of movement in this file's history
that removes coverage rather than relabelling it.** `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and
`routing` from the language. TEN fixtures whose SUBJECT was one of them had
nothing left to test and were deleted (`380`, `381`, `382`, `383`, `384`,
`385`, `386`, `397`, `398`, `399`). An eleventh, `913-retired-path-option-keys`, did not die with them but
MOVED to `cases/` as
`913-withdrawn-edge-geometry-keys`, because its subject is a retirement
diagnostic and §10 classifies a retired registration NORMATIVE — with the acceptor
gone, its keys are hosted on a plain `node` and nothing experimental is left
in it. Eleven files left `experimental/` (54 → 43); ten left the suite, and
the one that moved took the normative total from 159 to 160.

Three fixtures that merely USED the constructs while testing something else
were kept and adjusted, not deleted, under the same criterion the manifest
has always applied — `118-id-quoted-positions` (an id position went with the
directive, the `size`/`ELEMENT-GEOMETRY-DIRECTIVE` precedent), `122-points-parenthesised` (RULE 1.1a
outlives two of the four spellings that illustrated it), and
`259-edge-order-preserved` (the `bundle` member rule is the subject). Two
were renamed because their names carried a construct that no longer exists:
`907-errors-edge-and-path-form` → `907-errors-edge-form`, and the `913`
above. `904-errors-retired-keywords` GREW: it now carries the two withdrawal
diagnostics alongside the renames, because a withdrawal is a retirement with
a different sentence, not a different contract (RULE 6.2 still binds).

*Historical.* **`211 → 213` was a reclassification of nothing
and an addition of nothing** — no fixture was written, deleted, renamed or
retagged, and no `.fd` byte changed. What changed is that the 52 fixtures
formerly *tagged* experimental inside `cases/` MOVED to `experimental/`,
and the two `chart` fixtures that had been sitting in `experimental/`
under a second, separate mechanism now run on a default invocation like
everything else. 211 + 2 = 213; the normative total was unchanged at 159.
The moved names are listed in the `spec/migrations.md` 0.1 entry,
because a fixture is cited by path.

*Historical.* `145 → 112` was a **reclassification, not a
deletion** (`CONSTRUCT-STATUS-TIERS`).
No case was removed, renamed or moved, no `.fd` byte changed, and every
one of the 145 still ran and still had to pass. (0.1 then took the
totals to **146 / 113**: `905-errors-retired-text-option` is new,
`100-lex-title-restofline` was replaced by
`100-lex-title-quotes-required` and `101-lex-title-quoted-equiv` renamed
to `101-lex-title-quoted` — both premises died with the unquoted `title`.
All three are normative; the experimental partition is untouched at 33.) What changed is which
total each is counted in. (The figure was 115 earlier in the same
0.1 batch, before `bundle` and `layer` were demoted; that demotion
moved `331`, `332` and `333` — the three dedicated `layer` tests written
under a `block` header — into the experimental bucket.)

*Historical.* `206 → 210` was an **addition, not a
reclassification** (
`PRESENCE-CONDITION-EXPRESSION`/`DESCRIPTION-KEY-SPELLING`/`TIMING-GENRE-NAMING`/`ROW-HIGHLIGHT-CELL-FILL-COLLISION`): four new cases —
`419-bitfield-present-tristate` (model), `479-bitfield-note-retired`
(errors), `520-table-highlight-fill-collision` (errors), and
`916-retired-wave-genre` (errors, tagged `genre=timing`). Three are
normative; `916` is tagged EXPERIMENTAL because its header genre is
`timing` (spelled `wave` until this release, `TIMING-GENRE-NAMING`), which took the
tagged-experimental count from 51 to 52 and the normative total from
155 to **158** (210 − 52). No pre-existing case was removed, renamed, or
moved bucket by this release, except the filename renames noted where
each case is cited below.

*Historical.* `210 → 211` was likewise an **addition** (`ELEMENT-GEOMETRY-DIRECTIVE`):
one new case,
`917-retired-size-keyword` (errors, normative — the retirement diagnostic is
inside the conformance surface even though the construct it names is gone),
taking the normative total from 158 to **159** (211 − 52). The
tagged-experimental partition is untouched at 52. Six cases were RENAMED in
the same release without changing bucket or count, because their subject —
the `size` directive — merged into `pin`: `363-size` → `363-pin-extent`,
`364-size-errors` → `364-pin-declares-nothing`,
`365-size-nonnumeric-rejected` → `365-pin-extent-nonnumeric-rejected`,
`366-size-percent` → `366-pin-extent-percent`,
`367-size-strict-value` → `367-pin-extent-strict-value`, and
`368-size-duplicate-and-group` → `368-pin-duplicate-and-extent-domain`. A
seventh, `118-id-quoted-positions`, lost one line: the `size` id position
left the language with its directive.

### How the experimental partition works (the mechanism)

Written down because it is the **only** machinery the suite has for
"registered, implemented, but outside the conformance surface". There is **one** mechanism, and it is **location**:

```
conformance/cases/         inside the v0.1 conformance surface — NORMATIVE
conformance/experimental/  outside it — EXPERIMENTAL
```

`--experimental` runs the experimental corpus **on its own**; a default
invocation runs **both**, reporting the two totals separately. `--update`
applies to the corpora actually selected, so experimental goldens are
rewritten by a default `--update` too — they are goldens like any other.

Properties:

- **Default is NORMATIVE.** A new fixture put in `cases/` is normative
  with no manifest edit; only an exception is written down.
- **Experimental fixtures still RUN and still must PASS.** They pin real
  reference-engine behaviour; a failure in one exits 1 exactly like a
  normative failure. Location decides the bucket, nothing else. Each is
  printed as `PASS  <case>  [experimental: <reason>]`, and the footer
  labels both totals, so console output cannot be misread as a headline
  covering the whole run.
- **Everything else is identical.** Same two golden formats
  (`.model.json` / `.errors.txt`), same one-golden-per-case rule, same
  render-twice determinism self-check, same `--update` policy.
- **The `7xx` band is documentation, not logic.** The runner never parses
  case numbers; the band table below records the convention for humans.
- **Experimental does NOT mean unmodelled.** `normalize.js` projects
  `chart` regions and `timing` regions into the canonical
  model exactly like anything else. The constructs have defined meanings;
  what they lack is a conformance obligation. A second implementation may
  skip the whole of `experimental/` and still claim v0.1 conformance.

**`STATUS.txt` survives with a narrower job: the REASON manifest.** It no
longer decides any bucket. It records WHY each fixture in `experimental/`
is outside the surface, one record per fixture:

```
default normative
370-threshold-basic  construct=threshold  threshold, basic forms
390-bundle-basic  genre=topology,construct=bundle   both
```

- **The reason is recorded, not just the fact** — `genre=<g>` or
  `construct=<k>`, plus a free-text note.
- **It cannot rot, in either direction.** The runner validates every
  record against `experimental/` AND every fixture in `experimental/`
  against the records, and exits 1 on a name that does not resolve, a
  fixture with no record, a duplicate, a malformed reason, or a missing
  `default normative` line — before any case runs.
- **One file, so it is auditable.** The whole classification, its
  criterion and the reason for each fixture are readable in one place, and
  `ls experimental/*.fd` diffed against it is the audit.

**What the unification cost, stated rather than hidden.** Until 0.1
the 52 fixtures now in `experimental/` were *tagged* inside `cases/`, and
this section argued for the tag over a directory move in these words:
*"cases are cited by filename throughout `DISCREPANCIES.md`, the R-entries
and `spec/migrations.md`. A tag keeps every citation valid; a move breaks
them, and a later status change would be a file move rather than a
one-line edit."* Both halves of that were true and both bills were paid:
every citation by path was updated in the 0.1 batch, and a status
change is now a file move plus a line edit. The isolation ruling overrules
the argument because the tag cannot deliver what it is now required to
deliver — a user or an agent who wants nothing experimental must be able
to ignore whole FILES, and a filter over a mixed directory is not that.
Two other alternatives are still rejected for their original reasons: a
marker inside the `.fd` (the fixture bytes *are* the test input, so adding
metadata changes the thing under test) and a field in the goldens
(`.model.json` is the normative §12 model projection, and error cases have
no model to put it in).

### The classification (`CONSTRUCT-STATUS-TIERS`)

**The criterion: a case's status follows what it TESTS, not what it
happens to USE.**

**The sizes are not written down here.** `node conformance/run.js` derives
every one of them from `conformance/STATUS.txt` and the two directories on
every invocation, and prints them; a number typed into this table is a copy
that drifts. The table below names the MEMBERS — which is the part no
mechanism can derive — and says which line of the runner's output gives
each size.

| Set | Size — read it from | Which |
|---|---|---|
| **A** — header genre is EXPERIMENTAL | `run.js`, the `… by genre` figure | `topology` (240, 241, 251, 258, 259, 271, 390–394, 909), `timing` (600–606, 916 — the genre was spelled `wave` until 0.1, `TIMING-GENRE-NAMING`), `flowchart` (011, 210, 213, 220–223, 225, 226, 235–238, 242, 243), `statechart` (230–234, 244), `sequence` (280–294 — the whole band, since every fixture that can declare the genre is by definition experimental) |
| **B** — dedicated test of a demoted keyword, or of an experimental genre-owned keyword | `run.js`, the `… by demoted construct` figure | `threshold`/`band` (241, 243, 244, 265, 370–376, 914) + `bundle` (240, 243, 244, 271, 390–394) + `chart` (265, 700, 701, 909, 915) + `role` (220–224, the flowchart role vocabulary) + `connector` (225–227, 233–238). **No** `path`/`routing`: there were 11 until `EDGE-GEOMETRY-CONSTRUCTS` withdrew both keywords at 0.1, and a withdrawn construct is not a demoted one. **`plane` likewise since 0.3** (`PAINT-ORDER-CONSTRUCT`): five of its six fixtures were deleted and `334-layer-retired` is the one record left, kept for its retirement diagnostic, not for the construct |
| A ∩ B | `run.js`, the `… both` figure | every `STATUS.txt` record carrying two reasons — the definition, and the only form that cannot drift. It is no longer worth enumerating by hand: 0.3 alone added five members and removed six, and the 0.1 cleanup exists because an enumeration here named three fixtures that had been deleted twenty lines above |
| **A ∪ B** — EXPERIMENTAL | `run.js`, the EXPERIMENTAL total | the whole of `conformance/experimental/` |
| **Normative total** | `run.js`, the NORMATIVE total | the whole of `conformance/cases/` |

*Historical, for the record — what the two most recent reshuffles CHANGED,
not what is true now.* `916-retired-wave-genre` (new, `TIMING-GENRE-NAMING`)
joined Set A alone, taking it from 28 to 29 and the union from 51 to 52. All 52 MOVED to `experimental/`, where the two `chart` fixtures
`700`/`701` were already sitting: 54 in the directory. Ten
`path`/`routing` fixtures were DELETED and one moved out to `cases/`. The
figures this table used to assert for the state AFTER that — A ∩ B = 15,
A ∪ B = 41 — were both wrong, and the A ∩ B enumeration still named `381`,
`398` and `399`, three of the fixtures deleted in that very release. They
were removed rather than corrected, for the reason at the top
of this section.

**An OPEN QUESTION opened, recorded here and argued in full in
`STATUS.txt`.** `SCENE-KEYWORD-MEMBERSHIP` withdrew `bundle` from `block`, and the normative
fixtures that used it as a lexical host kept their coverage by APPENDING a
`topology` section rather than deleting the line. **Eleven normative fixtures
now declare an experimental genre in one of their sections** — 115, 118, 119,
123, 214, 215, 304, 306, 804, 905, 906 (three more, 801, 802 and 807, predate
this release). Set A's criterion, read literally, reaches them: an
implementation restricted to the normative genre surface cannot parse those
sections. This file's own gloss on `224` decides the multi-section case the
other way, and criterion 3 — a fixture that merely USES an experimental
construct stays normative — governs directly. **The two now disagree, and
neither is being applied silently.** Moving eleven files would move the
published normative count, so it is a maintainer ruling and not a side effect
of a vocabulary release. What is not in dispute either way is
`spec/experimental.md` §E0.1, which already enumerates every normative
fixture that writes an experimental keyword and tells an implementer what it
costs.

`224-flowchart-roles-genre-scoped` is in **B only**: its four headers are
`block` / `topology` / `bitfield` / `flowchart`, so the genre criterion does
not reach it, but its SUBJECT is the experimental keyword.
`478-typed-block-style-retired` is **NORMATIVE**: `style=` leaving `field`
and `cell` is a change to the normative `bitfield`/`table` surface, and only
its `timing` third is experimental — a case's status follows what it TESTS.

`bundle` and `plane` (spelled `layer` until 0.1) were demoted in the same `CONSTRUCT-STATUS-TIERS` batch as
`threshold`/`band`/`path`/`routing`, which grew set B. Only **three** cases
changed bucket: `331`, `332` and `333`, the dedicated `layer` tests
written under a `block` header — nothing but the construct criterion
reached them. The other seven dedicated `bundle`/`layer` cases were
already experimental by their `topology` header and merely gained a
`construct=` reason, which is why B grew by ten while the union grew by
three. (HISTORICAL: `331`, `332` and `333` were DELETED when
`PAINT-ORDER-CONSTRUCT` withdrew `plane` from the language. The reading is kept because it is
the CRITERION, and a criterion outlives the fixtures that illustrated it —
the same reason the `path`/`routing` reading is still written down.)

Set A is experimental whole even where the case's subject is a normative
construct (`251` tests edge labels): an implementation restricted to the
normative genre surface cannot parse the fixture at all, so it cannot be
asked to.

The coverage note this used to carry has **shrunk to one item**. It
previously read that `bundle` (390–394, `271`) has no normative-genre case
at all, and that edge labels, edge options and plane paint order are
pinned normatively only by their `block`-genre siblings.
`bundle` and `plane` are themselves outside the normative surface, so
having no normative-genre case for either is correct and expected, not a
gap — and the question cannot be asked of either: `plane`
left the language (`PAINT-ORDER-CONSTRUCT`) and `bundle` left `block` (`SCENE-KEYWORD-MEMBERSHIP`), so `topology` is
now the ONLY genre that can host a `bundle` fixture at all. What remains
genuinely outstanding is **edge labels (`251`) and edge
options (`258`)** — normative behaviour on the normative `edge` keyword,
currently pinned only by fixtures written under the experimental
`topology` genre. Fixing that means new `block`-genre fixtures, not
retagging; the `.fd` bytes of an existing case are never edited to move a
count.

Three refinements the raw bands hide.

1. The `38x` band held ten files until 0.1, of which **seven**
   tested `path`/`routing`; `EDGE-GEOMETRY-CONSTRUCTS` withdrew both keywords and those seven were
   deleted. The band now holds the three that never tested them:
   `387-layout-zone-basic`, `388-layout-zone-node-after` and
   `389-layout-duplicate` exercise the `layout` zone itself with `pin` —
   both core and normative — as do `395` and `396` in the `39x` band.
   Every `38x` file is now normative, which is the band's whole story: the
   experimental half of the layout zone is gone.
2. **Twelve** cases *use* a demoted construct incidentally without being
   about it: 112, 115, 209, 214, 215, 233, 259, 301, 304, 305, 306, 307 —
   `115-lex-option-before-label` runs `bundle`, `threshold` and `band`
   through the generic option-before-label rule (`OPTION-POSITION-PARSING`, core
   lexing); the rest are presentation and lexical sweeps that touch
   `extend=`, or run `threshold`/`band`/`bundle` through a
   generic check. Until 0.3 the same sentence named `plane` and
   `plane=`/`z-index=` alongside them, and `115` ran `bundle` under a
   `block` header; `PAINT-ORDER-CONSTRUCT` withdrew `plane` from the language and `SCENE-KEYWORD-MEMBERSHIP`
   withdrew `bundle` from `block`, so those writings left `cases/` in that
   release, `115` growing a `topology` section rather than losing the
   `bundle` half of its coverage. Six more embed a `timing` block
   (itself EXPERIMENTAL) inside a normative-genre document: 112, 214, 215, 304,
   305, 414. All stay NORMATIVE under the criterion; `259` is experimental
   anyway, by its `topology` header. Moving the rest would carry
   normative coverage of `fill=`, `style=`, the label absent/empty
   states and the cross-kind id rules out of the surface with them.
3. `904-errors-retired-keywords` stays NORMATIVE, and 0.1 tested
   the reading rather than weakening it: the fixture now WRITES `path` and
   `routing` at line start, because both are retired registrations after
   `EDGE-GEOMETRY-CONSTRUCTS` and §10 classifies a retired registration NORMATIVE (diagnostic). Writing
   a retired spelling in order to be told it is retired is what this fixture
   is for; writing a LIVE demoted keyword is what would move it.
   `913-withdrawn-edge-geometry-keys` joined `cases/` in the same release on
   the same reading — it was `913-retired-path-option-keys` in
   `experimental/`, where it sat only because its retired keys were hosted on
   a `path` line.
   `914-retired-guide-keyword` is EXPERIMENTAL by the opposite reading:
   it is a dedicated test of the demoted construct's own retirement and
   it WRITES `guide` at line start (`THRESHOLD-KEYWORD-SPELLING`). It also pins the
   two-hop `line` → `threshold`: the pre-0.1 spelling now lands on
   the CURRENT keyword, one lookup rather than two.
   `915-retired-chart-level` is EXPERIMENTAL because `chart` is outside
   the v0.1 conformance surface entirely (§4.4), so its option key's
   deletion diagnostic (`CHART-LEVEL-KEY`) is too.

Every case has **exactly one** golden — `.model.json` if it parses
clean, `.errors.txt` if it does not. Case numbering groups by area
(sub-bands are named where the hundreds band holds more than one):

| band | area |
|---|---|
| `01x` | header (version, genre, composition, comments before the header) |
| `1xx` | lexical (titles, escapes, comments, option syntax, extra args) |
| `20x`–`21x` | `node`, the shape enum, per-shape geometry, absent-vs-id label, absent-vs-empty label (`EMPTY-LABEL-DIRECTIVE-COVERAGE`) |
| `23x` | `group` |
| `24x` | per-genre subject vocabulary (`SUBJECT-VOCABULARY-SCOPE`/`SCENE-KEYWORD-MEMBERSHIP`) — one KEEP fixture and one WITHDRAW fixture per scene genre, so the 24-cell grid is readable as fixtures. `240`/`241` topology, `242`/`243` flowchart, `244` statechart (all EXPERIMENTAL, in `experimental/`), `245`/`246` block (NORMATIVE, in `cases/`). `statechart` has no KEEP fixture and cannot have one — it declares no subject vocabulary at all, and the empty declaration is what `230`/`233` pin. The `plane` row of the grid is NOT here: it is a language-wide withdrawal, not a per-cell one, and lives at `918`/`919` |
| `25x`–`26x` | `edge` (operators, the three label positions, retired options, written order). `262` pins `#` inside `[ ]` and `263` the enum half of RULE 2.4 on an edge. `264` was `edge plane=` as an id position, EXPERIMENTAL because the fixture declared a live `plane`; it was DELETED at 0.3 (`PAINT-ORDER-CONSTRUCT`) with that position, and its number is not reused |
| `27x` | `boundary`, plus explicit-arrowhead geometry |
| `28x`–`29x` | `sequence` — the genre that landed across 0.4 (`SEQUENCE-GENRE-VOCABULARY`). **Fifteen fixtures, all EXPERIMENTAL, in `experimental/`**, on the same footing as `statechart`'s `23x` run: `280` the header token itself and `281` the version gate (`figdown 0.3 sequence` is a NAMED version error, not `unknown genre`); `282` the allowlist in both directions; `283` the `message` model golden, whose real subject is that `edges` stays EMPTY (`SEQUENCE-ORDER-MODEL`); `284` the wrong-word errors in both directions; `285`/`286` all five `in=` acceptors and the object rule (`SEQUENCE-CONTAINMENT-SCOPE`); `287` the MANDATORY `type=` and its twelve UML values; `288` the one-level nesting cap beside the contiguity rule; `289` the three refusals `gap`/`group`/`lost=` (`UNDELIVERED-MESSAGE-MARKING`/`SEQUENCE-TIME-GAP`/`SEQUENCE-PARTICIPANT-GROUPING`), each with its own diagnostic shape; `290` `--` refused on a `message` while still parsing on an `edge` in the same file; `291` `flow`/`rank` getting the PLAIN allowlist message rather than a named refusal; `292` the declaration-order golden; `293`/`294` the `CLASS-CHANNEL-REACH` class-channel pair (the reject half and the meaning-only KEEP half). The band opens at `280` rather than in `25x`, which the table above gives to `edge`. **One numbering collision, recorded rather than hidden:** `cases/293-class-channel-per-member` is a different, NORMATIVE fixture carrying the same number as `experimental/293-sequence-class-channel`. The two buckets are enumerated separately so nothing runs wrong and no golden is shadowed, but `293` is no longer unique across the corpus and the next `29x` allocation should not assume it is |
| `30x` | `class` and the §5 presentation attributes (carve-outs, value errors, class references never resolved) |
| `33x` | `plane` until 0.3, when `PAINT-ORDER-CONSTRUCT` withdrew the keyword from the language and `330`–`333` were deleted with it (as `124` and `264` were, in their own bands). The band now holds **one** file, `334-layer-retired` — **EXPERIMENTAL, in `experimental/`** — and its subject is the retirement DIAGNOSTIC, not the construct: the whole `layer` → `plane` → withdrawn and `z=` → `z-index=` → withdrawn chain, six spellings and six messages. The vacated numbers are not reused |
| `35x` | `flow` and `rank` |
| `36x` | `pin` — position (`360`–`362`) and extent (`363`–`368`; a separate `size` directive until 0.1, `ELEMENT-GEOMETRY-DIRECTIVE`) |
| `37x` | `threshold` and `band` (`threshold` was `line` before 0.1 and `guide` before 0.1 (`THRESHOLD-KEYWORD-SPELLING`); `band` was `fill` before 0.1) — all seven **EXPERIMENTAL, in `experimental/`** (`CONSTRUCT-STATUS-TIERS`) |
| `38x` | the `layout` zone opener (`387`–`389`, normative, in `cases/`). The band was `routing` and `path` (`path` was `route` before 0.1) until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew both keywords and their seven fixtures were deleted |
| `39x` | `bundle` (`topology` genre AND a demoted keyword since `CONSTRUCT-STATUS-TIERS`, so **EXPERIMENTAL** on both counts; since 0.3, `SCENE-KEYWORD-MEMBERSHIP`, `topology` is the ONLY genre that declares it, so no other header could host these fixtures), plus two further `layout`-zone cases (`395`, `396`, normative, in `cases/`) that did not fit the `38x` run |
| `12x` | the quoting scheme across the whole vocabulary — `118`/`119` ids, `120`/`121` positional strings, `122` points, `123` comma lists, and (`RULE-POSITION-ENUMERATION`) `125` the typed-block labels, `126`/`127` RULE 2.4's enum half, `128` its complement where quoting stays INERT |
| `4xx` | `bitfield` (`418` is the `DECLARATION-ORDER-SEMANTICS` worked example: the bit numbers a reader DERIVES from `numbering=`, which the model deliberately does not carry — spec core §12.7; `419` is the `PRESENCE-CONDITION-EXPRESSION` `present=` tri-state worked example; `420`/`421` are `BITFIELD-REPETITION-CONSTRUCT`'s `index=` — the repetition tri-state in the model, and every one of its five errors) |
| `5xx` | `table` (`520` is the `ROW-HIGHLIGHT-CELL-FILL-COLLISION` `highlight`/cell-`fill=` collision worked example) |
| `6xx` | `timing` (spelled `wave` until 0.1, `TIMING-GENRE-NAMING`) — **EXPERIMENTAL, in `experimental/`** (experimental genre, `CONSTRUCT-STATUS-TIERS`) |
| `9xx` | cross-cutting errors (unknown keyword, misplaced child, reserved dynamic keywords, duplicate single-valued directives, retired keywords, the retired `text=` option key, and the per-release retirement diagnostics — `912` `plot`, `913` the WITHDRAWN edge-geometry option keys (`EDGE-GEOMETRY-CONSTRUCTS` — seven spellings, no replacement), `914` `guide` → `threshold` (`THRESHOLD-KEYWORD-SPELLING`), `915` the DELETED `chart level=` (`CHART-LEVEL-KEY`), `916` `wave` → `timing` (`TIMING-GENRE-NAMING`), `917` `size` → `pin` (`ELEMENT-GEOMETRY-DIRECTIVE`), and `918`/`919` the WITHDRAWN `plane`/`plane=`/`z-index=` (`PAINT-ORDER-CONSTRUCT` — three spellings, no replacement); `914`, `915`, `916` and `919` are **EXPERIMENTAL, in `experimental/`**, the rest are not — `913` moved into `cases/` at 0.1. `918` and `919` are one claim in two files, split by bucket: the keyword sweep runs AHEAD of the genre allowlist and answers the same message in every genre, so checking "every genre" needs all eight written down, and three of them are experimental genres that a normative fixture cannot declare) |
| `7xx` | `chart` (spelled `plot` until 0.1) — in `experimental/`, outside the conformance surface. Until 0.1 these two fixtures were the ONLY residents of that directory and no default run executed them |
| `955` | **the bundle duplicate-member fix** (`MEMBER-LIST-DUPLICATION` — identity-model-proposal probe 5) — one **EXPERIMENTAL** fixture in `experimental/`, `955-bundle-duplicate-member`: the same resolved edge named twice in one `bundle`'s member list, once by identical spelling (`a--b,a--b`) and once by a reversed spelling of an undirected pair (`a--c,c--a`), both caught because the check is on the resolved *Edge*, not the string. It is not in `39x` — the `bundle` band, and thematically where it belongs — because that band is exhausted: `390`–`396` are in use and `397`–`399` were deleted with `routing`/`path` at `EDGE-GEOMETRY-CONSTRUCTS` and are not reused (the band's own rule, README above) |
| `95x` | **adversarial input** (core §15) — five **NORMATIVE** fixtures in `cases/`, and the only `9xx` run that carries BOTH kinds of golden. The split is the claim: §15 says the language does **not** refuse hostile-looking text (it carries it as data) but **does** refuse input that could not produce a well-formed artifact, and one fixture kind alone would pin the wrong half. **`950`–`952` are VALID documents with `.model.json` goldens** — their STRINGS spell markup, and what the golden pins is that hostile text arrives in the model byte for byte, unescaped and unstripped: `950` puts `<script>`, an event handler, a `javascript:` URL, a `foreignObject` and an `@import` into the title, a class meaning, group and node labels, all three edge-label positions and six `note=` strings; `951` does the same to `description=`, the one string written FOR a machine reader; `952` is the CDATA attack on §7's embedded source — `]]>`, the pre-spliced `]]]]><![CDATA[>`, a closing `</metadata>` and a `<script>` behind it. **`953`–`954` are REFUSALS with `.errors.txt` goldens** — `953` is `XML-CHARACTER-LEGALITY`'s XML-illegal characters (eleven lines over two diagnostics, plus a same-file node carrying tab, `U+007F`, C1 and an astral character that must produce NONE; it contains raw bytes no editor will show you, and it cannot cover the unpaired-surrogate half, which has no UTF-8 encoding — the gate probes that one through `parse()` instead), and `954` is the extreme-numeric class inside `pin at=(…)`. For `950`–`952` the complement — that the same strings reach the ARTIFACT as escaped text and never as markup — has no golden and cannot have one (spec §3 gives no byte-identity across renderer versions); it is `gate:safesvg`'s, which renders all three fresh in both render modes and reads the output structurally |

Each case isolates one behavior (error
cases may carry several lines of the *same* behavior family, since the
parser reports all errors in one pass).

## Fixture formats

**`NNN-name.errors.txt`** — the parser's error lines, one per line,
**sorted lexically**, trailing newline. Sorting makes the golden
independent of internal error-emission order (some checks run per-line,
some in a post-pass); the `Line N:` prefixes still carry the positions.

**`NNN-name.model.json`** — `JSON.stringify(model, null, 2)` + trailing
newline of the canonical model. The full shape (top-level key order,
per-element key order, which attributes are omitted when absent) is
defined normatively in **spec §12.2/§12.3/§12.5**; the header comment of
[normalize.js](normalize.js) documents the same thing from the
implementation side. Highlights:

- Keys appear in a fixed order; arrays are in document order.
- Only spec-defined semantics appear — no engine internals.
- Absent optional attributes are **omitted**, never `null`. No golden
  contains a `null` (non-numeric `z`/`w`/`h` are line errors — DISCREPANCIES `NON-NUMERIC-Z-VALUE`/`NON-NUMERIC-EXTENT`, resolved); a `null` appearing in a
  regenerated golden would signal a new engine NaN defect.
- Every element carries its 1-based source `line` where the engine
  records one (the implicit base plane, timing signals and table cells do
  not — spec §12.4 rule 6; the plane never had one because it was never
  written, which is now the only kind of plane there is).
- `header.version` is the constant `"0.1"` (the engine accepts exactly
  that version).
- Known caveat: `band.fill` includes the engine's default
  (`#e5e7eb`) when the author wrote none — the engine does not preserve
  the distinction, so the projection cannot either.
- The top-level array of scalar markers is `thresholds[]` (it was
  `guides[]` until 0.1, `THRESHOLD-KEYWORD-SPELLING` — the model array was renamed with
  the keyword, since `NORMATIVE-SEMANTIC-MODEL` makes the model normative). A `band` element
  now carries its mandatory `label` FIRST (`BAND-LABEL-STATUS`). The `color` key it
  gained with that label left the whole model (`COLOUR-KEY-STATUS`): no
  element carries one, because the language has no label-colour key.
- `chart` regions appear in the model but are **experimental** (spec
  §4.4): not part of the v0.1 conformance surface — their fixtures live
  in `experimental/`, outside the normative count, and a second
  implementation MAY skip them entirely. The same holds for the
  constructs `CONSTRUCT-STATUS-TIERS` demoted (`threshold`, `band`, `path`, `routing`) and the
  experimental genres: they project into the model
  like anything else, and the cases whose subject they are live in
  `experimental/`, with their reason recorded in `STATUS.txt`.

### Defaults in the model

Restated here for convenience; **spec §12.4 rule 1 is the normative
list**, and §12.3 the normative omitted-when-absent rule. The same list
lives in normalize.js. A second implementer should never have to
reverse-engineer any of it from golden diffs:

**Materialized** (the engine resolves these defaults, so they always
appear in the model):

- `flow` = `"right"` when no `flow` line is written
- `node.shape` = `"box"`
- `node.plane` / `edge.plane` = `"base"` (spelled `layer` until 0.1)
- the implicit base plane `{id:"base", z:0}` is always `planes[0]`
- `band.extend` = `"up"`, `band.fill` = `"#e5e7eb"` (engine default);
  `band.label` is MANDATORY (`BAND-LABEL-STATUS`), so it is never
  defaulted and never absent
- `bitfield.unit` = `32` (`numbering=` has **no** default — it is required on every `bitfield` line, `UNSAFE-DEFAULT-ELIMINATION`)

**What 0.3 changed here, and what it deliberately did not.** `PAINT-ORDER-CONSTRUCT`
withdrew the `plane` keyword, `plane=` and `z-index=` from the LANGUAGE, so
the entry that used to sit at the end of this list — `plane.z` = declaration
index (1, 2, …) when `z-index=` is omitted — is **gone**: no document can
declare a plane, so no plane can take a default `z`. `planes` is therefore
always the one-element array above and `node.plane`/`edge.plane` always the
constant `"base"`. **The model keys stay**, which is the deliberate half:
the implicit base plane was never authored, it is what "everything paints in
one plane" looks like in the §12 projection, and removing it would be a model
change nothing in the ruling asked for. Paint order is document order. The
sentence that used to follow — `plane=` is materialized only on `node` and
`edge`, and omitted when absent on `group`, `external`, `bundle`,
`threshold`, `band` and `class` — no longer describes anything an author can
write, because the key does not exist; the model shape it described is
unchanged. `header.genre` is always present — the genre
token has been REQUIRED (`HEADER-GENRE-REQUIREMENT`), so it can only be absent
from a document that failed to parse.

**Omitted when absent** (never `null`): the optional `label` of
`node`/`group`/`bundle`/`boundary`/`bitfield`/`table`/`timing` (`layer`, the
plane's own label, left this list with the keyword — `PAINT-ORDER-CONSTRUCT`)
(`OMITTED-LABEL-RECORDING` — an omitted label is **absent**, never replaced by the
id: `node a` and `node a "a"` project differently, and renderers do the
id substitution for display; an explicitly EMPTY label is a third state,
carried uniformly as `"label": ""` on all nine directives and on `title`
(`EMPTY-LABEL-STATE`, `EMPTY-LABEL-DIRECTIVE-COVERAGE` resolved) — the test is key PRESENCE,
never truthiness, and the id substitution applies only to absence, so
`""` draws nothing; cases `214-label-absent-vs-id` and
`215-label-empty-string` freeze the two halves); `title`,
`fill`/`stroke`/`style`/`class` on nodes/groups/edges/classes,
`group.gap`, edge `tail`/`mid`/`head`, `pin.x`/`pin.y` (together — `at=` is
a point) and `pin.width`/`pin.height` (each may be absent; spelled
`size.w`/`size.h` until 0.1 and carried by a separate `size`
directive until 0.1), `threshold` `stroke`, `node.role` (0.1 — written only by a
`flowchart` role keyword; a bare `node` has none, and that absence is
meaning, `UNSAFE-DEFAULT-ELIMINATION` §3), field
`present`/`fill`/`class`/`description` (`present` was the positional
flag `optional`, and `note` was `description`'s name, until 0.1 —
`PRESENCE-CONDITION-EXPRESSION`/`DESCRIPTION-KEY-SPELLING`),
table `width`/`marks`/`highlights`, timing signal `labels`, timing `gaps`.
(`plot`/`chart` `level` left this list: `CHART-LEVEL-KEY` DELETED the
option key outright rather than renaming it.)
(Until 0.1 there were two more, both additive: the
top-level scalar `routing` appeared only when the document wrote an explicit
`routing` line, and the top-level `paths` array was omitted entirely when
there were no `path` lines. `EDGE-GEOMETRY-CONSTRUCTS` withdrew both constructs, so neither key can
be emitted any more.) Likewise
(additive): the top-level `boundaries` array is omitted
when the document declares no `boundary` lines, and a boundary's
`label` is omitted when not written (a boundary has no id-default).

Empty top-level collections stay as `[]` — the document shape is fixed
(`boundaries` is the one omit-when-empty exception left; `paths` and the
scalar `routing` were the others until 0.1). In `aligns`, a column
with no explicit `:` alignment is `"none"`.

## Running

```sh
node conformance/run.js                # BOTH corpora — prints the NORMATIVE
                                       #   count (the number to quote) and the
                                       #   experimental count separately
node conformance/run.js 4              # substring filter on the file name
node conformance/run.js table          # ... or by name fragment
node conformance/run.js --update       # rewrite goldens (see policy below)
node conformance/run.js --experimental # the experimental/ corpus, on its own
```

Exit code 0 = all pass; 1 = any failure **in either bucket** — an
experimental fixture that stops passing fails the run, it is simply not
counted in the normative total. A malformed or stale `STATUS.txt` also
exits 1, before any case runs: a record naming a fixture that is not in
`experimental/`, and a fixture in `experimental/` with no record, are both
hard errors. The reference engine is located the same
way `tools/build-svg.js` does: `$FIGDOWN_HTML`, a co-located
`figdown.html`, then `../editor/figdown.html`.

## How a second implementation consumes the fixtures

The fixtures are plain files; no code here needs to run against the
second implementation. The recipe:

0. Skip `experimental/` entirely. Everything in it is EXPERIMENTAL and
   carries no conformance obligation; you may ignore the whole directory
   and still claim v0.1 conformance, and `STATUS.txt` records why each
   fixture is there. Everything in `cases/` is normative; `node
   conformance/run.js` prints how many.
1. For each normative `cases/NNN-name.fd`, parse the exact bytes with
   your implementation.
2. If `NNN-name.errors.txt` exists: your parser must reject the
   document; sort your `Line N: message` strings and byte-compare.
   (If exact message texts are too strict for you at first, compare the
   `Line N` prefixes — but message-identical is the goal, since the
   AI write→validate→fix loop consumes the messages.)
3. If `NNN-name.model.json` exists: project your parse result into the
   canonical model per **spec §12**, serialize with 2-space-indent JSON
   + trailing newline (§12.5), byte-compare.
4. Read DISCREPANCIES.md first: the goldens freeze the **reference
   engine's** behavior, including its audited deviations from the spec
   text. Where a golden and the spec conflict, the conflict is listed
   there — match the golden to pass the suite, and track the item for
   the spec/engine resolution.

## Update policy

Goldens are frozen artifacts. `--update` exists for exactly two events:

1. **A spec change** — the change ships a `spec/migrations.md` entry;
   regenerate the affected goldens in the same commit and reference the
   migration id.
2. **Resolving a DISCREPANCIES.md item** — the engine (or spec) is
   fixed; regenerate the affected goldens, delete the item from
   DISCREPANCIES.md, and say so in the commit message.

A golden diff with neither a migration entry nor a discrepancy
resolution is a red flag in review — it means behavior drifted
silently, which is the exact failure mode this suite exists to prevent.
New cases (no behavior change, just coverage) may be added freely; a new
case is NORMATIVE by living in `cases/`. A fixture whose subject is an
experimental genre or a demoted construct goes in `experimental/` instead,
and MUST carry a `STATUS.txt` record — the runner refuses to run without
one.

`STATUS.txt` is not a golden and `--update` never touches it. Moving a
fixture between the two directories changes a published count, so it
belongs in the same commit as the migration entry that justifies it — and
it is never a way to make a failing case go away: a case that stops
passing is a behaviour change, and the fixture stays where it is until it
is explained.

## The partition contract — this suite is LIVE, the archived ones are not

**This directory tracks the DEV language, not a released one.** That is
not a defect and it is not going to be fixed: the suite is how a
behaviour change is pinned the day it lands, so it necessarily runs
ahead of every release. The consequence has to be said plainly, because
it is easy to read the directory as answering a question it does not:

> At the time of writing, `conformance/cases/` pins 0.4
> behaviour. The engine that shipped as `v0.4.1` does not have all of
> it. **A `figdown 0.4` document is not entitled to this suite**, and an
> implementer who takes it as the definition of `figdown 0.4` is
> measuring against a language that was never released.

So a released language version gets its **own frozen partition**:

| | what it is | who may rely on it |
|---|---|---|
| `conformance/` | the live suite, tracking the dev language | this repository's own gates |
| `archive/<X.Y>/conformance/` | the suite **as of the release tag of `vX.Y.0`** | any document declaring `figdown X.Y`, and any implementation claiming to support it |
| `archive/<X.Y>/spec/` | `core.md` + `genres/**` **as of that same tag**, both languages | the same readers, for the normative words those fixtures encode |

**How the partition is written.** By
[`tools/snapshot-release.js`](../tools/snapshot-release.js), on release
day, from a **git rev** — never from the working tree, which is what
makes "as of the release tag" true rather than approximate. It runs
**before the release commit**, so the frozen bytes are inside the tree
the tag names. The rows land in
[`archive/MANIFEST.tsv`](../archive/MANIFEST.tsv) through the same
append-only `archive-check.js --write` the engine page uses, and from
that moment checks A–E hold these bytes exactly as they hold the engine
page: modified fails, deleted fails, and **an added file fails too**.

**What is frozen, and what is not.** The whole of `conformance/` goes in
— fixtures, `run.js`, `normalize.js`, this file, `STATUS.txt` — because
a curated "just the files you need" list is a closed list, and a closed
list is wrong the first time a file is added. The frozen `run.js` finds
`../figdown.html`, which is the archived engine page for that same
language version, so the partition runs **against the engine users
actually had**, with no repository around it. From `spec/`, `core.md`
and `genres/**` are frozen. In this repository that includes the
`.zh-tw` twins — freezing half a pair is precisely how the halves are
allowed to drift, the frozen English going on being corrected by errata
against a Chinese text no one could reproduce. A published tree that
carries no `.zh-tw` files anywhere carries none in its partitions
either: where there is no pair, there is no pair to keep whole.
`ERRATA.md`, `migrations.md` and `.github/CONTRIBUTING.md` are deliberately **not**
frozen: they are the living registries that speak *about* frozen trees
(core.md §13.7.1 puts errata outside them by design), and a correction
channel sealed inside the tree it corrects is no channel at all.

### Forward-only, and why `0.1`–`0.4` are not backfilled

**The mechanism starts at the first `X.Y` release after `0.4`.** There
is no `archive/0.1/conformance/`, no `archive/0.4/spec/`, and
`snapshot-release.js` refuses to create them.

The refusal has two grounds and the second is the stronger one.

1. **A released tree is immutable.** core.md §13.5 says the archive is
   never rewritten, and *adding* a file to a released version rewrites
   it. `archive-check.js` check C exists to say exactly that — "an
   archived version cannot gain files either" — so a backfill would have
   to defeat a gate this project bought on purpose.
2. **The bytes would not be a record.** The suite and the spec text as
   of `v0.2.0` are perfectly recoverable from the tag. But a `0.2`
   partition written in 2026-08 was never what `v0.2.0` shipped, and
   filing a reconstruction where a record belongs destroys the one
   property the archive exists to have. An archive that is *sometimes* a
   reconstruction cannot be relied on anywhere.

**The gap, named rather than papered over.** For `figdown 0.1` through
`figdown 0.4` there is no frozen suite and no frozen normative text. A
reader who needs either goes to that release's **git tag**, which §13.5
already guarantees exists and is never rewritten — `git show
v0.2.0:conformance/cases/…`. That is a worse interface than a directory
and it is the honest one. It closes forward, one release at a time, and
never backward.
