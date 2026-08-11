# FigDown Genre: `flowchart`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any flowchart figure.
>
> **Genre status: EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).**
> `flowchart` is outside the v0.1 conformance surface and outside the
> compatibility promise. The engine accepts it unchanged, every existing
> `flowchart` document parses and renders exactly as before, and no `.fd`
> needs rewriting — but the genre may change or be withdrawn in a later
> `0.x` without a migration entry, and a `flowchart` document is not a
> portable v0.1 document. It is demoted because it had **not converged**:
> until this release it shared `block`'s namespace with nothing but a default
> (`flow down`) to tell the two apart. **0.1 (`FLOWCHART-ROLE-KEYWORDS`) landed the first
> tranche of its own vocabulary** — `process`, `decision`, `terminator`,
> §Roles below — which is the first exercise of `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` by any genre. The
> genre stays EXPERIMENTAL: the vocabulary is one tranche, not a converged
> set, and the excluded candidates (§Roles, *What is excluded*) are recorded
> rather than settled. It is not wrong or deprecated. See `DOMAIN-VOCABULARY-PREFERENCE` §4. The
> NORMATIVE v0.1 genres are `block`, `bitfield` and `table`. See core doc
> §10 for what the status means. This document remains normative *for* the
> genre: it is the authority on what `flowchart` means.

**Census**: #3 by unique images, 8.3% weighted. Prior art surveyed:
**ISO 5807** flowchart symbols (the SOURCE of the role vocabulary, §Roles);
UML 2.x activity model; BPMN 2.0 and its Descriptive conformance class;
Mermaid's `flowchart` type (adopted as *negative* prior art for role
expression — it carries role on the bracket SHAPE, which is what `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`
forbids here).

## Purpose

Expresses a **procedure as ordered steps and the branches between them**:
decision trees, error-handling paths, packet-processing procedures,
configuration workflows. Distinguished from `block` by what the edges
mean — control flow through time, not structural relation.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `down` | The one genre that overrides the core default; census-dominant for procedures. An explicit `flow` line overrides it |
| `shape` | `box` | The core-model default (§2.1) |

The `flow down` default is no longer the *entire*
behavioural difference between `flowchart` and `block`: the role vocabulary
below is the other half. Defaults are always per-genre and are justified by
that genre's own census statistics (`GENRE-NAMESPACE` `PER-GENRE-DEFAULTS`).

## Roles: `process`, `decision`, `terminator` (`FLOWCHART-ROLE-KEYWORDS`)

This clause follows UML's split — **abstract syntax**, **semantics**,
**notation** — because the whole point of the construct is that those three
are not the same thing.

### Why words, not shapes

The governing target for every FigDown keyword: **a reader who has never
opened the spec for this genre should recover 70–80% of what a `.fd` says
from the syntax alone**, leaving only the last 20–30% to the spec. Compare
the two spellings against that target:

```
node q "Header valid?" shape=diamond      # the reader must ALREADY know the
                                          # flowchart drawing convention
decision q "Header valid?"                # the reader just reads it
```

The first line is legible only to someone who has learned that a rhombus
means a branch. The second is legible to anyone who reads English. That is
the primary reason, and it is a reason about the *reader*, not about
internal consistency.

**The convention does not even hold for readers who have learned it.**
Measured over the production corpus: of **216 question-labelled nodes, 78%
are drawn `diamond`, 14% `ellipse`, and 8% carry no `shape=` at all**. A
reader applying the diamond convention therefore misreads about **a fifth**
of the corpus's decisions — and the 14% is not carelessness, it is authors
choosing a narrower outline so a wide fan-out's labels fit. *A convention
must be learned; a keyword is simply read — and a convention the language
does not carry is a convention nothing enforces*, which is exactly where
that 22% comes from.

Second, it is the rule `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` already stated: **`shape=` is geometry, role
is vocabulary.** Before this release the renderer itself broke that rule —
it placed a short branch label near the source only when
`shape === 'diamond'`, i.e. it consumed geometry AS role. That heuristic now
reads `role === 'decision'` (engine backlog entry 12, closed).

Third — and only third — the three spellings come from **ISO 5807**, whole,
under `SIZE-AND-DIRECTION-KEY-NAMING`/`GENRE-DOCUMENT-CONTRACT` §6(b). See *Source* below for why that standard, and not UML's
`action`, satisfies `SHAPE-ENUM-VOCABULARY`.

### Abstract syntax

    process    <id> ["label"]
    decision   <id> ["label"]
    terminator <id> ["label"]

Option keys are **identical to `node`**: `shape` `fill` `stroke` `style`
`class` `in` `plane`. A role line shares the node / group / external /
typed-block **id namespace** and is addressable by `edge`, `pin` and
`rank` exactly like a `node`. Every rule that governs `node` — id spelling,
label quoting, duplicate ids, the `shape=` enum, `width=`/`height=` rejection
(`<node|process|decision|terminator> does not take width=/height= — use a
pin line`) — governs a role line unchanged, because the parser desugars all
four spellings into one case.

The keywords are legal **only under `figdown 0.1 flowchart`**. Under any
other genre they are `"<keyword>" is not allowed in genre <g>` — the header
genre's allowlist (core §1, `GENRE-NAMESPACE`) enforces it with no per-keyword code.

### Semantics

A role line declares a **node bearing a `role`**:

| Keyword | `role` in the model | ISO 5807 | Means |
|---|---|---|---|
| `process` | `"process"` | §9.2.1 | a processing function: an operation, or a group of operations, that changes the value, form or location of information |
| `decision` | `"decision"` | §9.2.2.4 | a decision or switching function: **one entry**, and a number of alternative exits **of which exactly one** is taken after the conditions are evaluated |
| `terminator` | `"terminator"` | §9.4.2 | an exit to, or an entry from, the outside of the procedure — a start, an end, or a halt |

`decision` is the one role that carries a **semantic constraint beyond
naming**: its exits are mutually exclusive. A `process` with several outgoing
edges remains as ambiguous as any other fan-out (see *Semantic model*).

**A bare `node` under `flowchart` is ROLE-UNSTATED — it is NOT a `process`.**
The model OMITS `role` there, and that omission is a fourth state, readable
and distinct from all three roles. This is `UNSAFE-DEFAULT-ELIMINATION` §3: a default is legitimate
only when being wrong is harmless, and a flowchart node may be a datastore,
an annotation, a state or a wait — so defaulting to `process` could let the
model assert a falsehood that no inspection of the figure would catch.

### Notation

Geometry is **DERIVED** from the role:

| Role | Derived `shape` |
|---|---|
| `process` | `box` |
| `decision` | `diamond` |
| `terminator` | `rounded` |

This mapping is `SHAPE-ENUM-VOCABULARY`'s own (*"Flowchart shapes unify under the same axis
(decision→diamond, terminator→rounded, datastore→cylinder)"*). The derived
value is materialized into the model's `shape` field exactly as `node`'s
`box` default is.

**`shape=` on a role line is legal and overrides the DRAWING only.** The role
remains the model. No new precedence rule is needed: core §12.7 already says
presentation is not meaning on its own, so `decision d "Kind?" shape=ellipse`
is a decision drawn narrow — and an unfamiliar reader still recovers
"decision" from the word rather than from the outline. This is the case the
production corpus needed: its widest real dispatch is drawn as an ellipse
because ellipses are narrower than diamonds, and under the old spelling that
layout choice deleted the fact that the node was a branch point at all.

The converse also holds and is the reason the vocabulary exists:
`node q "Valid?" shape=diamond` carries **no role**. It is a legal figure and
a pre-migration one.

### No new edge vocabulary

Branch conditions continue to ride the edge's `[mid]` label, and the release
adds no edge keyword, no guard syntax and no branch marker. Every surveyed
system does the same: ISO 5807 §9.2.2.4 — *"the appropriate results of the
evaluation may be written adjacent to the lines representing the paths"*;
UML's bracketed guard on the outgoing edge; PlantUML's `then (yes)`; BPMN,
whose gateway markers are derived from the outgoing sequence flows'
conditions. An edge role family (`mainline` / `exception` / `loop-back`) is
recorded in `LOGIC-FLOWCHART-GENRE-SCOPE` and guide/layout.md §9 and is entangled with the logic genre;
`class main/retry/fail` is the taught interim.

### Source: why ISO 5807 and not UML

ISO 5807 is a **role** standard, not a geometry one — the opposite of what
`decisions/registry.md` originally claimed, and the correction is
annotated there in place. Its own definitions are of the **referent**:

- §3.3 *flowchart*: "…in which **symbols are used to represent operations,
  data, flow, equipment**, etc."
- §9.2.1 *Process*: "**This symbol represents any kind of processing
  function**, for example, executing a defined operation or group of
  operations resulting in a change in value, form or location of
  information…"
- §9.2.2.4 *Decision*: "This symbol represents **a decision or switching type
  function** having a single entry but where there may be a number of
  alternative exits, one and only one of which may be activated following the
  evaluation of conditions defined within the symbol."
- §3.1/§3.2 distinguish *basic* from *specific* symbols by whether "the
  precise nature or form of… the process or data media is known" — a
  statement about the referent, not about the drawing.

**Not one of the seven process-symbol names in ISO 5807 is geometric.**
Contrast Graphviz (`diamond`, `parallelogram`, `trapezium`) and Mermaid
(`diam`, `hex`, `trap-b`, `lean-r`), which are. In ISO 5807 the drawn form
appears only as an unlabelled figure beside each definition, never in the
defining sentence. So **`SHAPE-ENUM-VOCABULARY` is satisfied by borrowing ISO 5807**, and
`SIZE-AND-DIRECTION-KEY-NAMING`/`GENRE-DOCUMENT-CONTRACT` §6(b) therefore prefer it over UML's `action`.

### Verification debt: the spelling of `terminator`

**`terminator` ships on the maintainer's ruling, with two open verifications
recorded here rather than left implicit.**

1. **The spelling.** ISO 5807 §9.4.2 is behind a paywall and only pp. 1–8 of
   25 were available. Secondary sourcing plus **draw.io** and **Visio** say
   *Terminator*; **ANSI X3.5-1970** and **Mermaid** say *Terminal*. Three
   modern tools agree on `terminator`, so that is what ships — but the
   spelling is **PENDING VERIFICATION** against the purchased ISO 5807
   §9.4.2, and **`Z-ORDER-KEY-NAMING` decides it**: take the standard's own spelling in full.
   If ISO says *Terminal*, `terminator` is renamed under `Z-ORDER-KEY-NAMING` with a
   MIGRATIONS entry and a named diagnostic.
2. **The source assignment.** ISO 5807 **§10 (Conventions)** and **§11 (the
   consolidated symbol table)** were also unavailable. If either defines
   symbols by their drawn form, the "ISO 5807 is a role standard" conclusion
   above must be revisited, and with it the choice of ISO over UML.

### What is excluded, and why

The set is deliberately three. Every candidate below was considered and is
recorded as **not shipped**, with its evidence, so that adding one later is a
decision rather than a rediscovery.

| Excluded | Reason |
|---|---|
| `predefined process`, `parallel mode`, `loop limit` | ISO's names are **two words**; `GENRE-DOCUMENT-CONTRACT` §6(a) requires one lowercase word, and `SIZE-AND-DIRECTION-KEY-NAMING` forbids substituting a one-word synonym from another source. If evidence later forces them, this is a filed **naming problem**, not a silent rename. |
| `preparation`, `manual operation`, `document`, `display`, `card`, `punched tape` | ISO-only, absent from UML and BPMN; several are 1985 media artefacts. Corpus: 23 `preparation`-shaped nodes, **all** drawn as plain steps; 2 "manual" nodes that are actually software checks; 20 I/O-verb nodes with **no** distinguishing mark. |
| `fork`, `join`, `merge` | **0 occurrences in 3266 nodes and 2684 edges across both downstream trees, 0 in first-party examples, 0 unlabelled merge nodes.** Evidence of no need. Also entangled with `FLOWCHART-GENRE-DESIGN`'s AND/XOR question and `LOGIC-FLOWCHART-GENRE-SCOPE`'s logic-gate family, which core §9 says must be designed together. |
| a loop head / loop bound construct | 21% of figures contain cycles (45 of 227 deduped) with **172 back-edges — not one of which marks the loop**; 32% of those are entirely unlabelled and the rest reuse the ordinary yes/no marker. **The plain back-edge IS the mechanism**, and a `loop`/`while` keyword would state nothing the back-edge does not. |
| a `default` / `otherwise` branch | **0 edges spell `otherwise`, `else` or `default`**; 3 spell `other:`. BPMN itself puts conditional and default sequence flows **below** its 24-element Descriptive conformance class. And the downstream guideline forbids the mixed fan-out such a branch exists to disambiguate. |
| edge roles (`mainline` / `exception` / `loop-back`) | Recorded in `LOGIC-FLOWCHART-GENRE-SCOPE` and guide/layout.md §9; entangled with the logic genre. `class main/retry/fail` is the taught interim. |
| swimlanes / partitions | Not a role — **a container with an axis**. Recorded as the **next flowchart candidate**: it is Mermaid's most-requested flowchart feature (issue #2028, 401 reactions) and exists in UML (`ActivityPartition`), BPMN (`Lane`), PlantUML and Visio. |
| `annotation` as a flowchart role | Cross-genre, not flowchart-specific; it belongs to the annotation family and is filed under **`ANNOTATION-LOCATOR-SPLIT`**. Corpus: 65 annotation nodes in 31 figures, 17 of them declaring a `note`/`ann`/`annotation` class, plus two figures using `style=dashed` on an edge to mean "not control flow". |

**Two corroborations for stopping at three.** (1) BPMN ships a
**24-of-133-element "Descriptive" conformance sub-class inside its own
normative specification** — the standard itself concedes that its full
vocabulary is not what people use. (2) zur Muehlen & Recker (CAiSE 2008,
doi:10.1007/978-3-540-69534-9_35) measured that *"less than 20% of BPMN's
vocabulary is regularly used… the average model contains just 9 different
constructs"*.

The **two-keyword alternative** — drop `process` and let a bare `node` under
`flowchart` BE the step, following ISO's own basic/specific structure and
`SPELLING-LENGTH-VS-FREQUENCY`'s "the common case costs zero characters" — was considered and
**rejected on `UNSAFE-DEFAULT-ELIMINATION` §3**; it is recorded with what would reopen it in
requirements-notes `FLOWCHART-ROLE-KEYWORDS`.

## Complete vocabulary (normative)

Every keyword and option key valid in a `flowchart` document, with this genre's
defaults. Generated from the reference engine's behaviour and verified
against it; where this table and the core doc's prose disagree,
the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three —
`figdown` `title` `layout` — identical under every genre and never redefined
(`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a genre is complete
without any of them beyond `figdown`); **L** = the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`) — the layout zone is a namespace of its own, and every member of
it is genre-independent, so no genre may define, redefine or extend a keyword
inside it; `pin` is its only member (`path` and `routing` were its two
experimental members until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them);
**S** = the scene namespace shared with
`block` and `topology`; **F** = **`flowchart`'s OWN vocabulary** — legal
under this genre and no other (`FLOWCHART-ROLE-KEYWORDS`; the first exercise of
`GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` by any genre); **N** = a nested-genre opener — composition, not
`flowchart` vocabulary (§4, `GENRE-COMPOSITION`).

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. Because
`flowchart` is itself an experimental genre, every row below is outside the
conformance surface *as written in a `flowchart` document*; the column
records each construct's **own** status, which is what an author needs when
carrying the same construct into `block`.

| Keyword | Form | NS | Status | Option keys | `flowchart` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.1 flowchart` | C | NORMATIVE | — | required, first significant line |
| `title` | `title "<text>"` | C | NORMATIVE | — | absent |
| `node` | `node <id> ["label"]` | S | NORMATIVE | `shape` `fill` `stroke` `style` `class` `in` `plane` | `shape=box`, `plane=base`, label absent; under `flowchart` the model `role` is **ABSENT** — a bare node is role-UNSTATED, never a defaulted `process` |
| `process` | `process <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `in` `plane` | `role="process"`, `shape=box` DERIVED (§Roles) |
| `decision` | `decision <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `in` `plane` | `role="decision"`, `shape=diamond` DERIVED; exits are mutually exclusive |
| `terminator` | `terminator <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `in` `plane` | `role="terminator"`, `shape=rounded` DERIVED; spelling PENDING VERIFICATION (§Roles) |
| `group` | `group <id> ["label"]` | S | NORMATIVE | `fill` `stroke` `style` `class` `plane` `gap` | one nesting level; `plane` absent |
| `external` | `external <id> ["label"]` | S | NORMATIVE | `plane` | never drawn (`EXTERNAL-EDGE-ENDPOINTS`); since 0.1 it takes NO paint key at all — `color=` was its only one and it is retired (`COLOUR-KEY-STATUS`) |
| `edge` | `edge <a> [tail] <op> [head] <b>` | S | NORMATIVE | `stroke` `style` `class` `plane` | op is written form; `[mid]` splits the operator; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`) |
| `bundle` | `bundle <id> ["label"] <a>--<b>,<c>--<d>` | S | **EXPERIMENTAL** | `stroke` `style` `plane` | ring drawn dashed; member list is ONE whitespace-free comma-delimited token (the space form was RETIRED at 0.1); no `fill=` — a ring has no interior (§8.4) |
| `class` | `class <id> "<meaning>"` | S | NORMATIVE | `fill` `stroke` `style` `plane` | the meaning FIELD is REQUIRED, its VALUE may be `""` (= no meaning claimed, no legend entry — `CLASS-EMPTY-MEANING`); a class an `edge` joins MUST declare `stroke=` or `style=` (`INTERIOR-LESS-ELEMENT-PAINT`/`CLASS-PAINT-REQUIREMENT`) |
| `plane` | `plane <id> ["label"]` | S | **EXPERIMENTAL** | `z-index` | model `z` = 1-based declaration index; implicit `base` is `z` = 0 |
| `threshold` | `threshold "<label>" in=<id> offset=<0..100>%` | S | **EXPERIMENTAL** | `stroke` `style` `plane` `offset` `in` | dashed; the quoted label is REQUIRED; no `value=` and no `ref=` (`THRESHOLD-VALUE-SCOPE`). Spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`) |
| `band` | `band "<label>" <pct>%\|<a>..<b>% in=<id>` | S | **EXPERIMENTAL** | `fill` `stroke` `style` `plane` `in` `extend` | `extend=up`, `fill=#e5e7eb`; the quoted label is REQUIRED and written FIRST (`BAND-LABEL-STATUS`) |
| `flow` | `flow right\|down\|left\|up` | S | NORMATIVE | — | **`down`** |
| `rank` | `rank <id>,<id>[,<id>…]` | S | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token; the space form was RETIRED at 0.1; the rest of the line is reserved for future options |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px; group members are group-local. All three keys are OPTIONAL and at least one is REQUIRED; `at=` applies to nodes (including role lines), groups and `external` endpoints, `width=`/`height=` to **nodes only** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — `size` is retired and its keys moved here) |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `flowchart` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | 0.1 correction: `chart` was legal at a scene document's top level but had no vocabulary row anywhere. It is defined by its reference to a `table` id, and `table` is a legal host keyword in every scene genre, so a scene document can carry both the data and the chart. `type=bar3d` is the only value. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1 (`CHART-LEVEL-KEY`), so `chart <table-id> [type=bar3d]` is the whole grammar. |

`threshold`, `band`, `bundle` and `plane` are demoted, not
removed: the engine accepts all four exactly as before and every document
that uses them keeps rendering.

**Two rows left this table, and the deletion is recorded rather
than silent.** `path` and `routing` were core keywords until this release, then
EXPERIMENTAL members of the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW** them
from the language along with the four option keys only `path` accepted
(`points=` `routing=` `tailport=` `headport=`). There is **no replacement
spelling** — they were removed, not renamed — so the fix for a document that
used them is to **delete** those lines, which changes the rendered output (the
edge falls back to auto layout; shape it with `rank`, `flow`, declaration order
and `pin`). The evidence: [../../migrations.md](../../migrations.md)
0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, and `decisions/registry.md`
`LAYOUT-ZONE-NAMESPACE` is unchanged; only its membership is, and it now holds `pin` alone.

`bundle` and `plane` were NORMATIVE until this release and were demoted by `CONSTRUCT-STATUS-TIERS`.
Over the 50-document in-repo corpus `bundle` appears in 4 documents and
`plane` in 3, all seven of them `topology` — **zero** uses in any
`flowchart` document, and `flowchart` claims neither as its own vocabulary
(it has none yet; see below). The demotion therefore costs this genre
nothing it was using. Both stay legal and render exactly as before, and the
implicit `base` plane is untouched: a document that declares no `plane`
still has `planes[0] = {id:"base", z:0}`.

### Option-key values

| Key | Values | Status | `flowchart` default |
|---|---|---|---|
| `shape` | `box` `rounded` `circle` `ellipse` `diamond` `cylinder` | NORMATIVE | `box` |
| `style` | `solid` `dashed` `dotted` | NORMATIVE | per directive (`solid` on `node`/`group`/`edge`; dashed on `bundle`/`threshold`) |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line (`edge`, `bundle`, `threshold`), which is SVG's own asymmetry | NORMATIVE | absent |
| `class` | id of a declared `class` | NORMATIVE | absent |
| `in` | id of the containing `group` (`node`) or the target `node`/`group` (`threshold`/`band`) | NORMATIVE | absent |
| `plane` | id of a declared `plane` | **EXPERIMENTAL** | `base` on `node`; absent elsewhere |
| `z-index` | integer | **EXPERIMENTAL** | 1-based declaration index (model field `z`) |
| `gap` | non-negative number (px) — exact member spacing inside a `group` | NORMATIVE | absent → the renderer's automatic spacing |
| `extend` | `up` `down` `left` `right` | **EXPERIMENTAL** | `up` (spelled `dir=` until 0.1) |
| `at` | `(<x>,<y>)` canvas px — a PAREN POINT, `pin` only | NORMATIVE | optional on `pin` — nodes, groups and `external` endpoints |
| `offset` | `<0..100>%` (the `%` is mandatory) — `threshold` only; spelled `at=` until 0.1 | **EXPERIMENTAL** | required on `threshold` |
| `width` `height` | px number | NORMATIVE | optional on `pin`, **nodes only** — a group, an `external` endpoint or a typed block sizes to its content; at least one of `at`/`width`/`height` is required on the line. Spelled `w=`/`h=` until 0.1; carried by `size` until 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |

`fill=`, `stroke=` and `style=` are all normative:
`stroke=` was promoted by `STROKE-KEY-STATUS` once its use count was re-measured (5 in-repo
at `CONSTRUCT-STATUS-TIERS`; 56+ in-repo and 567 downstream edge-colouring sites now). There is
no text channel — `color=` is retired language-wide (`COLOUR-KEY-STATUS`) and the label
colour is derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).
`plane=` is demoted with the `plane`
keyword — a keyword and its only declaration point move together — and
`extend=` and `z-index=` are demoted only because the sole
directives that accept them (`band`, `plane`) are. **`points=`, `tailport=`,
`headport=` and `routing=` had rows here until this release**: `path` alone
accepted all four, and `EDGE-GEOMETRY-CONSTRUCTS` withdrew them from the language with it.

Edge operators: `->` `<-` `--` `<->`. The written form is the model (`READ-SIDE-DETERMINISM`);
`A <- B` and `B -> A` are a *rendering* equivalence only.

Retired spellings, kept only so a stale document gets a named migration
instead of `unknown option`: `kind=` on `node` (→ `shape=`),
`width=`/`height=` on `node` and on a role line (→ a `pin` line), `label=`/`taillabel=`/`headlabel=` on `edge`
(→ inline `[…]` labels) and `from=`/`to=` on `band` (→ the positional
range). `kind=` is retired **language-wide** (`CHART-BLOCK-NAMING`), not merely on
`node`, and so is `color=` (`COLOUR-KEY-STATUS`) — it named the FILL
before this release and the LABEL, and no engine can tell the
two apart, so its message names both eras and hands the choice to a human.

**Renamed.** Each old spelling is now a line error carrying a
named diagnostic that states its replacement; every rename takes the word
from a standard that already means exactly this (`UNSAFE-DEFAULT-ELIMINATION` single-source). **Two
rows left this table and are recorded here rather than dropped
silently:** `via=` → `points=` (`WAYPOINT-KEY-SPELLING`) and `src=`/`dst=` →
`tailport=`/`headport=` (`ENDPOINT-DOCKING-KEYS`). Both renames happened and were correct; `EDGE-GEOMETRY-CONSTRUCTS`
then withdrew the *replacements* from the language with `path`, so all five
spellings are line errors today and none of them names a replacement — the
diagnostic says to delete the line. A rename has a destination; a withdrawal
does not.

| Old | New | R | Why |
|---|---|---|---|
| `boundary` | `external` | `EXTERNAL-ENDPOINT-NAMING` | UML's «boundary» is an INTERNAL interface object, C4's `System_Boundary` is the dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning — all three invert or displace the intended sense, which the spec's own prose already stated as "declares an external I/O endpoint" |
| `layer` · `layer=` | `plane` · `plane=` | `PLANE-KEYWORD-SPELLING` | in mxGraph — the geometry model FigDown adopted — a layer is a CONTAINMENT PARENT that establishes coordinates; Inkscape layers may carry a transform, OGC WMS layers carry an SRS, CSS `@layer` is cascade priority, and SVG has no layer at all. No standard claims `plane` for a conflicting meaning |
| `plot` | `chart` | `CHART-BLOCK-NAMING` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | `CHART-BLOCK-NAMING` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace. Its one legal value was renamed `bars3d` → `bar3d` |

**Changed — the annotation family.** `guide` is RENAMED
`threshold` (`THRESHOLD-KEYWORD-SPELLING`: `guide` is an INVERTED name — in Illustrator, Inkscape,
Figma and draw.io a guide is an author-only construction line that is never
rendered, while FigDown's is drawn output — and it was a coinage;
`threshold` comes whole from Grafana, with IETF RED/AQM `min_th`/`max_th`
as the secondary source), and the model array `guides[]` is renamed
`thresholds[]` with it. `threshold` keeps its shape: no `value=` and no
`ref=` (`THRESHOLD-VALUE-SCOPE`). `band` gains a MANDATORY quoted label written FIRST
(`band "Headroom" 15..35% in=pool`) (`BAND-LABEL-STATUS`) — without a
label, a band whose `fill=` a reader discards as presentation asserted
nothing at all. `chart level=` is DELETED, not renamed (`CHART-LEVEL-KEY`). Both markers
stay EXPERIMENTAL. The normative treatment is
[block.md](../block.md) §2.6.

### How this differs from the other genres

Today the only difference is a default. `flowchart` shares the scene namespace
with `block` and `topology` and every entry above is identical under all
three, except:

| | `block` | `topology` | `flowchart` |
|---|---|---|---|
| `flow` default | `right` | `right` | **`down`** |
| Own keywords (`GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION`) | none | none | **`process` `decision` `terminator`** |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | NORMATIVE | EXPERIMENTAL | **EXPERIMENTAL** |

The middle row is new and is the first real difference: under
`block` or `topology` those three spellings are line errors. The status row
is a statement about convergence rather than about syntax — `block` is the
scene genre v0.1 freezes on, and `flowchart` is still held back because one
tranche of vocabulary is not a converged set (§Roles, *What is excluded*).

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `flowchart` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future
genre MAY spell a keyword the same as `flowchart`'s with a different meaning; no
v0.1 genre does, and neither the core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the
layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`) can ever be redefined — `GENRE-VOCABULARY-OBLIGATION` does not reach
inside the layout zone.

The genre token is REQUIRED (§1) and now carries more than a default: it
selects the namespace in which `decision` is a keyword rather than an error.

Two conventions matter for reading procedures:

- **Branch conditions ride the edge, not the node.** An edge's `[mid]` label
  is where the condition goes: `edge q -[yes]-> commit`. A branch whose
  condition is unwritten is a branch a reading agent cannot follow. This is
  scene-namespace behaviour, not `flowchart` behaviour.
- **`shape=diamond` is geometry, not a role.** Drawing a decision as a
  diamond is conventional and permitted, but on a bare `node` it asserts
  nothing: under `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` the shape enum is purely geometric. The fact that a step is a decision is stated by the word
  `decision`; on a document that predates it, that fact must still be
  recovered from the label text and the outgoing labelled edges.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A flowchart's meaning is a **directed procedure**: nodes are steps, edges
are transitions, and an edge's mid label is the condition under which the
transition is taken.

- A node names one step. Its label states what happens there (`FIDELITY-TARGET`).
- A node MAY carry a **role** (`process` | `decision` | `terminator`,
  §Roles). The role is a claim about the step, not about its drawing, and it
  is the model. **An absent role is absent**, not `process`: it means the
  author did not state one.
- An edge names one transition. Direction comes from the operator; endpoint
  order and operator token are preserved as written (§2.3, `READ-SIDE-DETERMINISM`).
- A node with several outgoing edges is a branch point. Which branch fires
  is stated by the edge labels and by nothing else — not by shape, not by
  colour, not by rendered position.
- Whether a fan-out means "all branches fire" or "exactly one fires" is
  **not expressible in v0.1 for a node with no role**; a reading agent MUST
  NOT assume either. Where the node IS a `decision`, ISO 5807 §9.2.2.4
  settles it: exactly one exit is taken. Making that expressible on any
  fan-out remains `FLOWCHART-GENRE-DESIGN`'s sub-question.
- `flow`/`rank` express reading order; the `layout` zone carries no meaning
  and a reading agent IGNORES it by default (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`).

## Errors

`flowchart` adds no error conditions of its own, and the role keywords add
none either — they desugar into `node`'s case, so every one of `node`'s
diagnostics fires on them verbatim, naming the keyword the author wrote.
Its validation profile is the core profile: unknown keyword, unknown or
inapplicable option, unknown `shape`, duplicate id, dangling edge endpoint,
`in=` cycle, and the single-valued-directive rules of §8 — all line errors.

The one genre-scoped error: `process` / `decision` / `terminator` written
under a genre other than `flowchart` is `"<keyword>" is not allowed in genre
<g>`, from the header genre's allowlist (core §1, `GENRE-NAMESPACE`). No per-keyword code
produces it.

## What this genre does NOT own (yet)

**`FLOWCHART-GENRE-DESIGN`(a) and (b) are CLOSED by `FLOWCHART-ROLE-KEYWORDS`.** The closed role set is
`process` / `decision` / `terminator`, and the spelling shape is *scene role
constructs* — three top-level keywords following `external`, not a typed
block following `bitfield`/`table`. What remains open:

- **(c) the migration story for existing `shape=diamond` approximations.**
  Deliberately left non-mechanical: a `shape=diamond` node is *probably* a
  decision and a `shape=rounded` one *probably* a terminator, but "probably"
  is not a rewrite rule, and the 14%-ellipse measurement above is the proof
  that the inverse mapping does not exist either. A pre-0.1 flowchart
  stays valid and readable; it is simply in the pre-migration state (`GENRE-EARNING-THRESHOLD` §4,
  `GENRE-NAMESPACE`'s fallback baseline).
- **The AND/XOR fan-out question** (`FLOWCHART-GENRE-DESIGN`'s sub-question): `decision`
  settles it for a decision's exits and for nothing else.
- **Everything in *What is excluded* above**, each with its measured
  evidence. Swimlanes are recorded there as the next candidate.

Mermaid is recorded in prior-art.md §5 as
positive prior art for "each genre owns its vocabulary" and **negative**
prior art for how flowchart expresses role: it carries decision/process/
terminal on the bracket shape, which is precisely what `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` forbids here.
FigDown's role vocabulary is words, and the geometry is derived from them.

## Example

```figdown
figdown 0.1 flowchart
title "Ingress ACL Decision"
terminator start "Frame received"
process    parse "Parse headers"
decision   acl   "ACL match?"
terminator drop  "Drop + increment counter"
process    fwd   "Forward to L2 lookup"
edge start -> parse
edge parse -> acl
edge acl -[no match]-> fwd
edge acl -[deny rule]-> drop
```

The same figure written before this release — `node acl "ACL match?"
shape=diamond` — still parses and still renders. It simply says less: the
model records a geometry where this one records a role.
