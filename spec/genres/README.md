# FigDown genre documents

> Navigation index for the eight genres (`GENRE-DOCUMENT-CONTRACT` documentation contract) — the
> six of `figdown 0.1`, plus `statechart`, which needs `figdown 0.2` (`STATECHART-GENRE-SCOPE`),
> plus `sequence`, which needs `figdown 0.4` (`SEQUENCE-SOURCE-STANDARD`).
>
> **Spec split:** the cross-genre framework is [../core.md](../core.md)
> (formerly `spec/core.md`). Each file below is the **only** normative
> home for that genre's vocabulary — core does not restate it.
>
> **Frozen and experimental are separated at the FILE level.**
> The three NORMATIVE genres — `block`, `bitfield`, `table` — are the `.md`
> files in this directory. The FIVE EXPERIMENTAL ones — `topology`,
> `flowchart`, `timing`, `statechart`, `sequence` — are in [experimental/](experimental/). A reader or
> an agent that wants nothing outside the v0.1 conformance surface can
> ignore that subdirectory whole, and this index and the frozen genre
> documents stay complete without it: nothing frozen is DEFINED there, and no
> normative sentence in a frozen file needs it to be read. What remains is
> the naming this table does — a closed language has to say what exists — and
> every such row is marked EXPERIMENTAL and points at where the definition lives.
> The same split runs through [../experimental.md](../experimental.md) (the
> **four** experimental core constructs — `plane`, `bundle`, `threshold`,
> `band`; this read *six* until 0.1, a figure `EDGE-GEOMETRY-CONSTRUCTS` made stale at
> 0.1 when it WITHDREW `path` and `routing` outright),
> `conformance/experimental/` and
> `examples/reference/experimental/`; `tools/isolation-check.js` is the gate.

A FigDown document's header names its **genre**, and the genre token is
REQUIRED (§1 of the [core syntax document](../core.md)):

```
figdown 0.1 <genre>
```

**The genre is a namespace (`GENRE-NAMESPACE`).** It names the document's keyword
namespace, its defaults, and its validation profile. A genre MAY define
keywords of its own and MAY reuse another genre's spelling with a different
meaning — in exchange it MUST document its **complete vocabulary** here. A
small core of **three** keywords (`figdown`, `title`, `layout`) is universal
(`UNIVERSAL-CORE-KEYWORDS`): they are the document's *structure*, resolvable before the genre is
known.

**The layout zone is a namespace of its own (`LAYOUT-ZONE-NAMESPACE`, 0.1, `LAYOUT-ZONE-NAMESPACE`).** The
zone `layout` opens holds `pin` (NORMATIVE) — and, until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them, `path` and `routing` (EXPERIMENTAL) — and
**every member of it is genre-independent**: no genre may define, redefine
or extend a keyword inside the zone. `GENRE-VOCABULARY-OBLIGATION` does not reach in there, and `GENRE-NAMESPACE`
gains a carve-out for it, because layout-zone lines *are* top-level lines.
The reason is `GENRE-NAMESPACE`'s own default — a reading agent ignores every member of the
layout namespace, wherever in the document it appears (`GENRE-NAMESPACE` states the default
over MEMBERSHIP, never over the zone's textual extent), so that default is
actionable only if one enumeration of the members is correct under every genre,
and safe only if no genre semantics can ever appear in the namespace; `LAYOUT-ZONE-NAMESPACE` closes
that crack, and core §10 (a′) is the enumeration. `layout` itself stays core because it is the
zone's **opener**, a structural marker recognisable before the genre is
known; `pin` moved out of the core into the namespace it
always lived in, and it absorbed `size` in the same release (`ELEMENT-GEOMETRY-DIRECTIVE`).

**Status and genre-independence are orthogonal axes**, and the pair the rule
was written on is now gone. `path` and `routing`
were core members until 0.1, `CONSTRUCT-STATUS-TIERS` demoted them to EXPERIMENTAL
(core doc §10), `LAYOUT-ZONE-NAMESPACE` made them genre-independent while they stayed
experimental — the two axes at once — and **`EDGE-GEOMETRY-CONSTRUCTS` withdrew both from the
language**, leaving `pin` as the zone's only member. The
orthogonality ruling is kept because it governs every future member of this
namespace, not because the constructs that produced it survive.

`UNIVERSAL-CORE-KEYWORDS` is a **fixity** guarantee, not a ubiquity requirement: *wherever a core
keyword appears its meaning is fixed and no genre may redefine it*. It does
NOT mean every genre must use all three — a `bitfield`, `table` or `timing`
document typically has no `pin` and no `layout` zone at all, and is complete
without them. `LAYOUT-ZONE-NAMESPACE` changed only `UNIVERSAL-CORE-KEYWORDS`'s **enumeration**, five keywords to
three; the fixity-not-ubiquity distinction is untouched.

**`DECLARATION-ORDER-SEMANTICS` — declaration order is drawing order along the genre's primary axis**
(`DECLARATION-ORDER-SEMANTICS`, 0.1; core doc §1). Every v0.1 genre with a primary axis obeys
it, and a new genre MUST: `table` draws `width auto,70,…` and each `|` row
left to right and its rows top to bottom, `timing` draws each `signal` as the
next lane down, and `bitfield` draws each `field` in the next cell to the
**right**, wrapping to the next word. **No option may reverse the drawing.**
`bitfield`'s `numbering=` is the case that forced the rule into writing: it
relabels the ruler and moves nothing, so `numbering=lsb0` still draws the
first-declared field leftmost — it is simply the highest-numbered bit there
([bitfield.md](bitfield.md) semantic model, `DECLARATION-ORDER-SEMANTICS`). `DECLARATION-ORDER-SEMANTICS` is about drawing only;
core §12.7 still forbids reading array order as ranking or sequence. What it
guarantees is that the human's reading order and the agent's declaration
order are the same order — the mechanism behind "one source, two readers".

Each genre has one self-contained normative document. The contract (`GENRE-DOCUMENT-CONTRACT`):
**core doc + one genre doc suffice** to author and read that genre. Each
document's vocabulary table is the authoritative per-genre reference —
generated from the reference engine's behaviour, not copied from the core
doc's prose.

| Genre | Weighted census | Family | Status (`CONSTRUCT-STATUS-TIERS`) | Own vocabulary | Vocabulary table | Document |
|---|---:|---|---|---|---|---|
| `block` | 24.3% | scene namespace | NORMATIVE | none — OPEN (`DOMAIN-VOCABULARY-PREFERENCE` §4) | [complete vocabulary](block.md#complete-vocabulary-normative) | [block.md](block.md) |
| `topology` | 5.0% | scene namespace | **EXPERIMENTAL** | `bundle` only, itself **EXPERIMENTAL** — OPEN (`DOMAIN-VOCABULARY-PREFERENCE` §4) | [complete vocabulary](experimental/topology.md#complete-vocabulary-normative) | [experimental/topology.md](experimental/topology.md) |
| `flowchart` | 8.3% | scene namespace | **EXPERIMENTAL** | `process`, `decision`, `terminator` (`FLOWCHART-ROLE-KEYWORDS`) — the **first exercise of `GENRE-VOCABULARY-OBLIGATION`** by any genre; plus `flowline` (`GENRE-CONNECTOR-SPELLING`), which **replaces** the scene `edge` here rather than adding to it; each itself **EXPERIMENTAL** | [complete vocabulary](experimental/flowchart.md#complete-vocabulary-normative) | [experimental/flowchart.md](experimental/flowchart.md) |
| `bitfield` | 23.7% | nested genre | NORMATIVE | `bitfield`, `field`, `break` | [complete vocabulary](bitfield.md#complete-vocabulary-normative) | [bitfield.md](bitfield.md) |
| `table` | 9.6% | nested genre | NORMATIVE | `table`, `\|` rows, `cell`, `width` | [complete vocabulary](table.md#complete-vocabulary-normative) | [table.md](table.md) |
| `timing` | 7.2% | nested genre | **EXPERIMENTAL** | `timing`, `signal`, `gap` | [complete vocabulary](experimental/timing.md#complete-vocabulary-normative) | [experimental/timing.md](experimental/timing.md) |
| `statechart` | 3 of 91 production docs | scene namespace | **EXPERIMENTAL** | `state`, `transition` (`GENRE-NODE-SPELLING`, OMG UML 2.5.1 §14) — they **replace** the scene `node` and `edge` here; needs `figdown 0.2` | [complete vocabulary](experimental/statechart.md#complete-vocabulary-normative) | [experimental/statechart.md](experimental/statechart.md) |
| `sequence` | 14 of 2,177 production images (0.6%) | **ladder — its own family** | **EXPERIMENTAL** | `lifeline`, `message`, `state`, `fragment`, `operand` (`SEQUENCE-GENRE-VOCABULARY`, OMG UML 2.5.1 §17) — `lifeline`/`message` **replace** the scene `node` and `edge`, and the other three are this genre's own; plus the mandatory `type=` on `fragment`, whose twelve values are UML's `InteractionOperatorKind`; needs `figdown 0.4` | [complete vocabulary](experimental/sequence.md#complete-vocabulary-normative) | [experimental/sequence.md](experimental/sequence.md) |

**Genre status (`CONSTRUCT-STATUS-TIERS`, core doc §10).** Each genre carries a
status. The six of `figdown 0.1` split three and three; `statechart` (`STATECHART-GENRE-SCOPE`)
made the experimental side four, and `sequence` (`SEQUENCE-SOURCE-STANDARD`) five:

| Status | Genres | What it means |
|---|---|---|
| **NORMATIVE** (NORMATIVE) | `block`, `bitfield`, `table` | Inside the v0.1 **conformance surface** and inside the **compatibility promise**. A conforming implementation MUST support the genre; it changes only through a migration entry (`VERSION-MIGRATION-MODEL`). |
| **EXPERIMENTAL** (EXPERIMENTAL) | `topology`, `flowchart`, `timing`, `statechart`, `sequence` | The reference engine accepts the genre and its documents keep working — but it is **outside** both. It may change or be withdrawn in a later `0.x` **without a migration entry**, and a document written in it is not a portable v0.1 document. |

The demotion is documentation only. The engine accepts all six genres
unchanged, every existing document parses and renders exactly as before, and
**no `.fd` needs rewriting**; nothing is deprecated and nothing is removed.
EXPERIMENTAL says the genre has **not converged**, not that it is wrong. An
agent generating a portable figure SHOULD stay on the normative surface.

The reasons are per genre. `topology` still shares `block`'s namespace with
nothing but a default to tell it apart — that is exactly `DOMAIN-VOCABULARY-PREFERENCE` §4's open
question, and it is held back *because* it is still open. `flowchart` LEFT
that state (`FLOWCHART-ROLE-KEYWORDS`): it now owns `process`, `decision` and
`terminator`, the first exercise of `GENRE-VOCABULARY-OBLIGATION` by any genre. It stays experimental
for a different reason — one tranche is not a converged set, and the
excluded candidates (fork/join/merge, a loop construct, a default branch,
edge roles, swimlanes) are recorded rather than settled.
`timing`'s lane alphabet is settled (a strict SUBSET of prior art, `DESIGN-DECISION-METHOD`, and
closed — `2`–`9` were retired for having been redefined), but the surface around it is not: `data=` and `gap` are both
unresolved. `sequence` is experimental for the reason its own document states
plainly: **0.6% is the lowest measured demand of any genre candidate this
project has weighed**, and unlike `statechart` its withdrawal would not cost
one line per figure — it brought five keywords, an enum and a whole ladder
layout with it, so EXPERIMENTAL does not price this bet the way it priced the
last one. Each genre document states its own status at the top.

**The five demoted constructs — all EXPERIMENTAL, all DEFINED in
[../experimental.md](../experimental.md).** Independently of genre status,
`CONSTRUCT-STATUS-TIERS` demotes
five constructs to EXPERIMENTAL in **every** genre: the keywords `threshold`,
`band`, `bundle`, `plane` and the option key `plane=`.
The four keywords are defined in that one file and named —
never defined — in the frozen genre documents.
(`extend=` and `z-index=` follow, because the
only directives that accept them — `band`, `plane` — are demoted.)
A demotion moves **status** and nothing else.
**The count, and how it was reached: 9 → 7 → 5.** It was nine until 0.1, when `stroke=` was promoted back to NORMATIVE
(`STROKE-KEY-STATUS`, on a re-measured count) and `color=` was retired language-wide
(`COLOUR-KEY-STATUS`), taking it to seven. It is **five**, when `EDGE-GEOMETRY-CONSTRUCTS`
**withdrew** `path` and `routing` from the language — with the four option
keys only `path` accepted, `points=` `routing=` `tailport=` `headport=`.
A withdrawal is not a demotion: a demoted construct still parses and still
renders, while a withdrawn one is a line error naming **no replacement**,
because there is none. The evidence is in
[../migrations.md](../migrations.md) 0.1 and core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**. `fill=`, `stroke=` and `style=` are normative, and since
presentation may never be meaning's only carrier (`GUI-WRITEBACK-STRUCTURE`), no document loses
meaning.

`bundle` and `plane` joined the list on measured evidence, not on taste.
**The measurement that decided it, dated (`CONSTRUCT-STATUS-TIERS`, 2026-08-04):** over
the 50-document in-repo corpus of the day, `bundle` appeared in 4 documents and
`plane` — then still spelled `layer`, renamed (`PLANE-KEYWORD-SPELLING`) — in 3, and
all seven were `topology` documents, with zero uses in `block`, `bitfield` or
`table`.

**Re-measured, over today's 66 published `.fd`
(`examples/` + `figures/`):** `bundle` in 6 documents, `plane` in 6,
**10 distinct documents**, and they are **no longer all `topology`** —
`examples/reference/experimental/block-experimental.fd` has a `block` header
and uses BOTH, and `examples/reference/experimental/flowchart.fd` uses
`plane`. The paragraph stated the 0.1 numbers in the PRESENT tense and
so shipped a claim the tree had already falsified; the numbers are now dated
and the re-measurement is beside them.

**The ruling does not move**, and the reason is worth stating rather than
implying: the two documents that broke the "all topology" clause are the
reference corpus's own **experimental** exhibits, whose job is to exercise
experimental constructs. Every use is still outside the normative genres'
minimum sets, so neither construct is in one, and `bundle` is `topology`'s own domain vocabulary
(`DOMAIN-VOCABULARY-PREFERENCE` §4), so it moves with its genre. `plane=` is demoted with the `plane`
keyword because a keyword and its only declaration point move together: in
a document that may not declare a plane, `plane=` could only ever name the
implicit `base` — an option with exactly one legal value. The implicit
`base` plane itself does not move: every document still has
`planes[0] = {id:"base", z:0}` and every element still reports
`plane: "base"`, so the normative model shape is unchanged. The v0.1
NORMATIVE scene keywords are therefore the seven `node`, `group`,
`external`, `edge`, `class`, `flow`, `rank` — 13 normative top-level
keywords in all (3 core + `pin` + 7 scene + the `bitfield`/`table`
openers), of **22** top-level keywords total. That total read 24, when `ELEMENT-GEOMETRY-DIRECTIVE` retired `size`, until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS`'s
withdrawal of `path` and `routing` took it to 22; the **13** does not move,
because both withdrawn keywords were EXPERIMENTAL. (Both figures read one lower
here and in core §10 until 0.1, when the missing `chart` entry was
added to the registry — it is EXPERIMENTAL, so again the **13** is unmoved.) Every
genre document's vocabulary table now
carries a per-construct **Status** column: it records each construct's own
status, which is what an author needs when carrying it from one genre to
another.

**The 0.1 renames.** Ten spellings moved in one release: the scene
keywords `boundary` → `external` (`EXTERNAL-ENDPOINT-NAMING`) and `layer`/`layer=` →
`plane`/`plane=` (`PLANE-KEYWORD-SPELLING`); on `path`, `via=` → `points=` (`WAYPOINT-KEY-SPELLING`) and
`src=`/`dst=` → `tailport=`/`headport=` (`ENDPOINT-DOCKING-KEYS`) — a rename whose *destinations*
were themselves withdrawn (`EDGE-GEOMETRY-CONSTRUCTS`), so those five spellings are
all line errors today and none of them names a replacement; `plot` → `chart` with
`kind=` → `type=` and its one value `bars3d` → `bar3d` (`CHART-BLOCK-NAMING`, retiring
`kind=` LANGUAGE-WIDE); in `bitfield`, `unit=` → `word=` (`BITS-PER-ROW-KEY-NAMING`),
`wrap` → `break` (`ROW-BREAK-NAMING`) and the `field` flag `optional` → `conditional`
(`PRESENCE-FLAG-SPELLING`); and on `signal`, `labels=` → `data=` (`SIGNAL-DATA-KEY-SPELLING`). Every old spelling is
now a line error carrying a named diagnostic, and each genre document
states the prior-art reason for its own renames.

**The 0.1 annotation-family batch.** Three defect fixes on the two
EXPERIMENTAL scene markers plus one deletion. The keyword `guide` is
**renamed `threshold`**, and the model array `guides[]` becomes
`thresholds[]` with it: `guide` was an INVERTED name — in Illustrator,
Inkscape, Figma and draw.io a guide is an author-only construction line that
is never rendered, while FigDown's is drawn output — and a FigDown coinage
besides, while `threshold` comes whole from Grafana ("Show thresholds: as
lines / as filled regions / as both"), with IETF RED/AQM `min_th`/`max_th`
(RFC 2309, RFC 7567) as the secondary source. `threshold` keeps its shape:
no `value=`, no `ref=`. `band` gains a **mandatory quoted label written
first** (`band "Headroom" 15..35% in=pool`) — without
a label, a band whose `fill=` a reader is entitled to discard as
presentation asserted nothing at all. `chart level=` is **deleted**, not
renamed, so `chart <table-id> [type=bar3d]` is the whole grammar. Both
markers stay EXPERIMENTAL: a defect in an experimental construct is still a
defect, but fixing it is not a promotion. The normative treatment is
[block.md](block.md) §2.6.

Three families, one language:

- **Scene namespace** (`block`, `topology`, `flowchart`, `statechart`) share
  one vocabulary — `group`, `class`, `flow`, `rank` and the rest of §2 — and
  differ in defaults and in **what each calls the thing and the line**
  (`GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING`): `block`/`topology` write `node`/`edge`,
  `flowchart` writes `node`/`flowline`, `statechart` writes
  `state`/`transition`. Each takes the term its own domain uses; the
  constructs, grammar and model are identical. `flowchart` defaults to
  `flow down`; the others to `flow right`. Because the *constructs* are
  identical, the header is still the ONLY place such a document states which
  kind of figure it is; that is why the genre token is required.
- **Nested genres** (`bitfield`, `table`, `timing`) each own a closed
  sub-grammar and declare their kind in their content as well as in the
  header.
- **The ladder** (`sequence`, EXPERIMENTAL) is neither, and the
  difference is not a matter of taste: a scene genre draws a graph and has no
  axis, while **both** of this genre's axes carry meaning and neither is the
  author's to set — columns are `lifeline` declaration order, rows are
  `message` ∪ `state` declaration order (`DECLARATION-ORDER-SEMANTICS`, twice). That is why it declares
  no `flow` and no `rank`, why no key in it moves a coordinate, and why it
  cannot host a composed region: there is no scene to host one in. It shares
  the scene genres' per-genre node/connector rename (`lifeline`/`message`)
  and nothing else. See
  [experimental/sequence.md](experimental/sequence.md), which is EXPERIMENTAL
  throughout.

**Top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`).** The header genre is an **allowlist**
of legal top-level keywords for that section (enforced `GENRE-NAMESPACE`). `UNIVERSAL-CORE-KEYWORDS` core
(`figdown` `title` `layout`) and the layout namespace's normative member
`pin` (`LAYOUT-ZONE-NAMESPACE`) are always allowed. Pure `bitfield` / `table` / `timing` reject
scene keywords (`node`, `edge`, …) except `class` (and experimental `chart`
under `table`). Scene genres share the scene vocabulary, may open nested
typed regions. Until 0.1 the scene lists were also the only ones
carrying the layout namespace's experimental members `path`/`routing` — a
**status** fact, not a namespace one, since `LAYOUT-ZONE-NAMESPACE` fixes what a zone member means
wherever it is legal and says nothing about which genres admit it, the same
fixity-not-ubiquity distinction `UNIVERSAL-CORE-KEYWORDS` draws. `EDGE-GEOMETRY-CONSTRUCTS` withdrew both, so the
distinction now has no instance and is stated for the next member the zone
gains.
Error form: `"<kw>" is not allowed in genre <g>`.

**Multi-section hybrid (`MULTI-FIGURE-DOCUMENTS`, main-standard path).** A `.fd` MAY contain more
than one `figdown 0.1 <genre>` line. Each starts a **section** with its own
allowlist and id space; rendering still produces **one SVG** (sections
stacked). Prefer this for hybrid panels (scene + table, block + bitfield
panel). Nested typed regions under a single scene header remain legal
(legacy `GENRE-COMPOSITION`) but are not the taught main-standard path.

**The composition rule (`GENRE-NAMESPACE` `GENRE-COMPOSITION`, restating `LOGIC-FLOWCHART-GENRE-SCOPE` §4 at the vocabulary
level).** A scene document may also compose genres by nesting. A
`bitfield`, `table` or `timing` line under a scene header opens a region
governed by THAT genre's namespace; the region's child keywords are valid
only inside it and are a line error at the section's top level, and the host
genre does not acquire the region's vocabulary. Composition is how a hybrid
figure is expressed — it is never a reason to found a new genre. In v0.1
composed regions (nested or multi-section) stand in document order, each
complete in itself.

**Two v0.2 targets, recorded openly.**

1. **Region syntax for the scene genres.** Only `bitfield`, `table` and
   `timing` have a region form today, so only they can be composed.
   `block`/`topology`/`flowchart` have none — `GROUP-LEVEL-FLOW`/`CROSS-BLOCK-REFERENCES` territory.
2. **Independent scene vocabularies.** `block`, `topology` and `flowchart`
   still share one namespace and are not yet independently clean. That is
   `DOMAIN-VOCABULARY-PREFERENCE` §4's open question: flowchart's direction is ruled (`FLOWCHART-GENRE-DESIGN`); for
   `block` and `topology` it remains open whether they have a domain
   vocabulary at all, or whether a scene of parts and relations simply *is*
   their domain.

Both are ADDITIONS under `VERSION-MIGRATION-MODEL` and need no major version bump. A third
direction is recorded alongside them: **subordinate composition** — the
ability to declare that a composed region is *about* an element of its host
document ("this table is about node `X`") — is `CROSS-BLOCK-REFERENCES`, v0.2, and is not
designed here. One constraint on it is already fixed: subordination is
SEMANTIC, so it must live in the content zone; it cannot be carried by `pin`
or anything else in the layout namespace, every member of which reading agents
ignore by default wherever it is written (§3, `GENRE-NAMESPACE`) and which no genre may
extend (`LAYOUT-ZONE-NAMESPACE`). A new layout-zone keyword
would have to clear the `NEW-CONSTRUCT-EVIDENCE-GATE` gate, and it would be genre-independent too —
which is exactly why subordination cannot go there.

**Vocabulary ownership (`DOMAIN-VOCABULARY-PREFERENCE`, permitted by `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION`).** Every genre SHOULD
introduce keywords naming its own domain's participants and relations rather
than overloading `node`/`edge`. The nested genres already do. `GENRE-NAMESPACE` settles
the permission question — a genre owns its words — so what remains open per
genre is only whether it has words worth owning.

**A note on length (`GENRE-DOCUMENT-CONTRACT` §3).** The vocabulary tables push several of these
documents past `GENRE-DOCUMENT-CONTRACT`'s ~120-line compression guidance. The guidance was
examined and the tables kept: they are the per-genre authority a reader is
sent to instead of the core doc, and structure (tables, one-line entries) is
what `GENRE-DOCUMENT-CONTRACT` §3 asks completeness to be achieved through.

`chart` is EXPERIMENTAL and outside the v0.1 conformance surface
(§10); it is not a genre and has no genre document. It IS a top-level
keyword and is counted as one — registry row: core §10 (c′), definition
§4.4, vocabulary row in [table.md](table.md).

**`statechart` LANDED (`STATECHART-GENRE-SCOPE`)** as an EXPERIMENTAL genre, and it
is the reason the language number moved: it is surface `figdown 0.1` does not
have, so it requires `figdown 0.2` and `figdown 0.1 statechart` stays a line
error. When it landed it added **no keywords** — the header token, the scene
allowlist and a reading rule were the whole increment. **0.2 (`GENRE-NODE-SPELLING`)
gave it its two:** `state` and `transition`, taken whole from OMG UML 2.5.1
§14, replacing `node` and `edge` here (which are now named line errors). That
also made reclassifying a figure cost every connector line rather than line 1
— a cost accepted deliberately, and paid by `tools/migrate-figdown.js`. The design record is
decisions/registry.md;
the normative document is
[experimental/statechart.md](experimental/statechart.md).

**Deferred, and named so it is not mistaken for an oversight:** `initial`,
`final` and `mode` (draft §5.2) are NOT in the language, gated on `NEW-CONSTRUCT-EVIDENCE-GATE`
evidence. A reader may not infer an initial or final state from a figure's
shape.

**`sequence` LANDED across this release (`SEQUENCE-GENRE-VOCABULARY`)**, EXPERIMENTAL, and
it is the reason the language number moved to `0.4`: it is surface
`figdown 0.3` does not have, so it requires `figdown 0.4` and
`figdown 0.3 sequence` stays a line error. Unlike `statechart` it did **not**
land as a header token alone — a dispatch point with no ladder would have
produced a graph drawing of a time figure — so the increment brought five
keywords (`lifeline`, `message`, `state`, `fragment`, `operand`), one
mandatory enum key (`type=`, twelve values from OMG UML 2.5.1 §17), five
acceptors for `in=` capped at one level of nesting, and a renderer. **Three
constructs were REFUSED rather than withdrawn** — `gap` (`SEQUENCE-TIME-GAP`), `group`
(`SEQUENCE-PARTICIPANT-GROUPING`) and `lost=` (`UNDELIVERED-MESSAGE-MARKING`) — because this genre never declared them; each is
a named line error carrying its ground and its replacement. The design record
is decisions/registry.md;
the normative document is
[experimental/sequence.md](experimental/sequence.md); the question that asked
for it, closed, is core §9 `MESSAGE-ORDER-AND-STATE`.
