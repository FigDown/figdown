# FigDown Genre: `block`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any block figure.
>
> **Genre status: NORMATIVE (`CONSTRUCT-STATUS-TIERS`).** `block` is
> inside the v0.1 conformance surface and inside the compatibility promise:
> a conforming implementation MUST support it, and it changes only through
> a migration entry (`VERSION-MIGRATION-MODEL`). It is the scene genre v0.1 freezes on — its two
> namespace-siblings `topology` and `flowchart` are EXPERIMENTAL. See core
> doc §10 for what the status means. **NORMATIVE is not "stable"** and
> neither is "frozen": both name the scope of the change-management
> promise, not the absence of change, and FigDown 0.x is a preview — see
> [core §13](../core.md#13-stability-and-versioning-normative).
>
> **This file is FROZEN material, and it defines nothing experimental
>.** Four constructs share this genre's namespace without being
> part of its normative vocabulary — `plane`, `bundle`, `threshold`, `band`.
> All four are DEFINED in
> [../experimental.md](../experimental.md). (Two more, `path` and `routing`,
> were EXPERIMENTAL members of the genre-independent layout namespace until
> 0.1, when `EDGE-GEOMETRY-CONSTRUCTS` **withdrew** them from the language entirely; they are
> no longer named in this document because they no longer exist.) This
> document still **names** the four, in the vocabulary table and in §2.4–§2.6, because a closed language
> has to say what exists and a reader who meets one in a scene document must
> be able to identify it; it does not depend on them. Delete the
> experimental file set and this document is still the complete,
> self-contained normative home of genre `block`.
>
> The maintainer-ruling item codes cited below (`EDGE-WRITTEN-FORM`, `PLANE-Z-INDEX-DEFAULT`, `OMITTED-LABEL-RECORDING`, `EMPTY-LABEL-STATE`) are
> defined in the
> A-code registry.

**Census**: #1, 24.3% weighted (block-architecture). Prior art: none
borrowed wholesale — the box-and-wire scene is the shared baseline every
diagram language starts from.

## Purpose

Expresses a system as **parts and the relations between them**: functional
blocks, pipelines, datapaths, layered stacks, and the containment that
groups them. The largest genre in the corpus and the default choice for a
figure that is not a topology, a flowchart, or one of the typed blocks.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `right` | Census-dominant direction for pipelines and datapaths |
| `shape` | `box` | The core-model default (§2.1); a block is a box |

`block` is the genre whose defaults are the core model's own defaults. It
defines no keyword of its own and reuses no other genre's spelling, so its
vocabulary table below is the scene namespace plus the core and the rest of
the layout zone, unchanged.

## Complete vocabulary (normative)

Every keyword and option key valid in a `block` document, with this genre's
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
**S** = the scene namespace shared with `topology` and
`flowchart`; **N** = a nested-genre opener — composition, not `block`
vocabulary (§4, `GENRE-COMPOSITION`).

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. `block` is
itself a normative genre, so a `block` document that uses only the NORMATIVE
rows below **is** a portable v0.1 document; the EXPERIMENTAL rows are the ones
that carry it outside the conformance surface.

| Keyword | Form | NS | Status | Option keys | `block` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.1 block` | C | NORMATIVE | — | required, first significant line |
| `title` | `title "<text>"` | C | NORMATIVE | — | absent |
| `node` | `node <id> ["label"]` | S | NORMATIVE | `shape` `fill` `stroke` `style` `class` `in` `plane` | `shape=box`, `plane=base`, label absent |
| `group` | `group <id> ["label"]` | S | NORMATIVE | `fill` `stroke` `style` `class` `plane` `gap` | one nesting level; `plane` absent |
| `external` | `external <id> ["label"]` | S | NORMATIVE | `plane` | never drawn (`EXTERNAL-EDGE-ENDPOINTS`); since 0.1 it takes NO paint key at all — `color=` was its only one and it is retired (`COLOUR-KEY-STATUS`) |
| `edge` | `edge <a> [tail] <op> [head] <b>` | S | NORMATIVE | `stroke` `style` `class` `plane` | op is written form; `[mid]` splits the operator; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`) |
| `bundle` | `bundle <id> ["label"] <a>--<b>,<c>--<d>` | S | **EXPERIMENTAL** | `stroke` `style` `plane` | ring drawn dashed; member list is ONE whitespace-free comma-delimited token (the space form was RETIRED at 0.1); no `fill=` — a ring has no interior (§8.4) |
| `class` | `class <id> "<meaning>"` | S | NORMATIVE | `fill` `stroke` `style` `plane` | the meaning FIELD is REQUIRED, its VALUE may be `""` (= no meaning claimed, no legend entry — `CLASS-EMPTY-MEANING`); a class an `edge` joins MUST declare `stroke=` or `style=` (`INTERIOR-LESS-ELEMENT-PAINT`/`CLASS-PAINT-REQUIREMENT`) |
| `plane` | `plane <id> ["label"]` | S | **EXPERIMENTAL** | `z-index` | model `z` = 1-based declaration index; implicit `base` is `z` = 0 |
| `threshold` | `threshold "<label>" in=<id> offset=<0..100>%` | S | **EXPERIMENTAL** | `stroke` `style` `plane` `offset` `in` | dashed; the quoted label is REQUIRED; no `value=` and no `ref=` (`THRESHOLD-VALUE-SCOPE`). Spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`) |
| `band` | `band "<label>" <pct>%\|<a>..<b>% in=<id>` | S | **EXPERIMENTAL** | `fill` `stroke` `style` `plane` `in` `extend` | `extend=up`, `fill=#e5e7eb`; the quoted label is REQUIRED and written FIRST (`BAND-LABEL-STATUS`) |
| `flow` | `flow right\|down\|left\|up` | S | NORMATIVE | — | **`right`** |
| `rank` | `rank <id>,<id>[,<id>…]` | S | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token; the space form was RETIRED at 0.1; the rest of the line is reserved for future options |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px; group members are group-local. All three keys are OPTIONAL and at least one is REQUIRED; `at=` applies to nodes, groups and `external` endpoints, `width=`/`height=` to **nodes only** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — `size` is retired and its keys moved here) |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `block` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | 0.1 correction: `chart` was legal at a scene document's top level but had no vocabulary row anywhere. It is defined by its reference to a `table` id, and `table` is a legal host keyword in every scene genre, so a scene document can carry both the data and the chart. `type=bar3d` is the only value. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1 (`CHART-LEVEL-KEY`), so `chart <table-id> [type=bar3d]` is the whole grammar. |

**The four EXPERIMENTAL scene rows above are named here, and DEFINED in
[../experimental.md](../experimental.md)** (§E1 `plane`, §E2 `bundle`,
§E3 `threshold`/`band`). The rows stay because a
reader who meets one of them in a scene document must be able to identify
it from this table; nothing in the rest of this document needs them.

`threshold`, `band`, `bundle` and `plane` are demoted, not
removed: the engine accepts all four exactly as before and every document
that uses them keeps rendering.

**Two rows left this table and the deletion is recorded rather
than silent.** `path` and `routing` were core keywords until this release, then
EXPERIMENTAL members of the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW** them
from the language: the engine now rejects both spellings, and the four option
keys only `path` accepted (`points=` `routing=` `tailport=` `headport=`) with
them. There is **no replacement spelling** — the constructs were removed, not
renamed — so a document that used them must have those lines **deleted**, which
changes the rendered output (the edge falls back to auto layout; shape it with
`rank`, `flow`, declaration order and `pin` instead). The evidence and the
decision: [../migrations.md](../migrations.md) 0.1, [core §9](../core.md#9-open-syntax-questions)
**`EDGE-IDENTITY-AND-GEOMETRY`**, and `decisions/registry.md` `LAYOUT-ZONE-NAMESPACE` itself is unchanged
and still frozen; only its membership moved, and it now holds `pin` alone.

`bundle` and `plane` were NORMATIVE until this release and were demoted by `CONSTRUCT-STATUS-TIERS` on
measured evidence: over the 50-document in-repo corpus `bundle` appears in
4 documents and `plane` in 3, and all seven are `topology` documents —
**zero** uses in any `block` document. `bundle` is `topology`'s own domain
vocabulary (`DOMAIN-VOCABULARY-PREFERENCE` §4) and moves with its genre; `plane` is a generic marker
with no owning genre, the same position that demoted `threshold` and `band`.
Both stay legal under `block` and render exactly as before — a `block`
document simply leaves the conformance surface by writing one. What does
NOT move is the implicit `base` plane: a `block` document that declares no
`plane` still has `planes[0] = {id:"base", z:0}` and every element still
reports `plane: "base"`, so the normative model shape is unchanged.

### Option-key values

| Key | Values | Status | `block` default |
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
| `at` | `(<x>,<y>)` canvas px — a PAREN POINT, `pin` only; `(x,y)` is the **top-left of the element's layout box**, whatever its `shape=` (core §3) | NORMATIVE | optional on `pin` — nodes, groups and `external` endpoints |
| `offset` | `<0..100>%` (the `%` is mandatory) — `threshold` only; spelled `at=` until 0.1 | **EXPERIMENTAL** | required on `threshold` |
| `width` `height` | px number | NORMATIVE | optional on `pin`, **nodes only** — a group, an `external` endpoint or a typed block sizes to its content; at least one of `at`/`width`/`height` is required on the line. Spelled `w=`/`h=` until 0.1; carried by `size` until 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |

`fill=`, `stroke=` and `style=` are all normative:
`stroke=` was promoted by `STROKE-KEY-STATUS` once its use count was re-measured (5 in-repo
at `CONSTRUCT-STATUS-TIERS`; 56+ in-repo and 567 downstream edge-colouring sites now). There is
no text channel — `color=` is retired language-wide (`COLOUR-KEY-STATUS`) and the label
colour is derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).
`plane=` is demoted with the `plane`
keyword, because a keyword and its only declaration point move together: in
a document that may not declare a plane, `plane=` could only ever name the
implicit `base`, which is an option with exactly one legal value. `extend=`
and `z-index=` are demoted only because the sole directives that accept them
(`band`, `plane`) are. **`points=`, `tailport=`, `headport=` and `routing=`
had rows here until this release**: all four were accepted by `path` alone, and
`EDGE-GEOMETRY-CONSTRUCTS` withdrew them from the language with it (see the note under the keyword
table).

Edge operators: `->` `<-` `--` `<->`. The written form is the model (`READ-SIDE-DETERMINISM`);
`A <- B` and `B -> A` are a *rendering* equivalence only.

Retired spellings, kept only so a stale document gets a named migration
instead of `unknown option`: `kind=` on `node` (→ `shape=`),
`width=`/`height=` on `node` (→ a `pin` line), `label=`/`taillabel=`/`headlabel=` on `edge`
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
`tailport=`/`headport=` (`ENDPOINT-DOCKING-KEYS`). Those renames happened and were correct; `EDGE-GEOMETRY-CONSTRUCTS`
then withdrew the *replacements* from the language along with `path`, so all
five spellings are line errors today and **none of them names a replacement**
— the diagnostic says to delete the line. A rename has a destination; a
withdrawal does not, which is the whole difference between the two kinds of
retirement.

| Old | New | R | Why |
|---|---|---|---|
| `boundary` | `external` | `EXTERNAL-ENDPOINT-NAMING` | UML's «boundary» is an INTERNAL interface object, C4's `System_Boundary` is the dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning — all three invert or displace the intended sense, which the spec's own prose already stated as "declares an external I/O endpoint" |
| `layer` · `layer=` | `plane` · `plane=` | `PLANE-KEYWORD-SPELLING` | in mxGraph — the geometry model FigDown adopted — a layer is a CONTAINMENT PARENT that establishes coordinates; Inkscape layers may carry a transform, OGC WMS layers carry an SRS, CSS `@layer` is cascade priority, and SVG has no layer at all. No standard claims `plane` for a conflicting meaning |
| `plot` | `chart` | `CHART-BLOCK-NAMING` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | `CHART-BLOCK-NAMING` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace. Its one legal value was renamed `bars3d` → `bar3d` |

**Changed — the annotation family.** One rename, one shape
change and one deletion, all on the two EXPERIMENTAL scene markers of §2.6
and on `chart`. The two mechanical ones are line errors that name their
migration; the `band` label is not mechanical, because only the author
knows the region's name.

| Old | New | R | Why |
|---|---|---|---|
| `guide` | `threshold` | `THRESHOLD-KEYWORD-SPELLING` | an **inverted** name, which `UNSAFE-DEFAULT-ELIMINATION` rates worse than an unfamiliar one: in Illustrator, Inkscape, Figma and draw.io a *guide* is an author-only construction line that is NEVER rendered, while FigDown's is drawn output, and no counter-example was found where "guide" names rendered output. `guide` was also recorded `source = FigDown` — a coinage, which `SIZE-AND-DIRECTION-KEY-NAMING` makes a last resort. `threshold` comes whole from **Grafana**, whose threshold render option is literally *"Show thresholds: as lines / as filled regions / as both"* — FigDown's marker + region pair, split the same way — with **IETF RED/AQM** `min_th`/`max_th` (RFC 2309, RFC 7567) as the secondary source. 77.8% of 126 measured corpus marks and 78% of 63 distinct marker names are thresholds; target/mean/reference marks: 0. The model array `guides[]` is renamed `thresholds[]` with the keyword (`NORMATIVE-SEMANTIC-MODEL`) |
| *(nothing)* | `threshold` label, `in=`, `offset=` unchanged | `THRESHOLD-VALUE-SCOPE` | the shape did NOT change with the name: no `value=` and no `ref=` were added, because **zero** corpus figures carry a literal numeric value — every reference is a named software-configurable register, and the name already lives in the mandatory label |
| `band <a>-<b>% …` | `band "<label>" <a>-<b>% …` | `BAND-LABEL-STATUS` | *(both spellings are as they stood at 0.1; the RANGE separator itself moved to `..` at 0.1, `RANGE-SPELLING`, so the live form today is `band "<label>" <a>..<b>% …` — the row above records what this release changed, not the current grammar)* the quoted label is now MANDATORY and written FIRST. See §2.6: with no label slot at all, a band whose `fill=` a reader discards as presentation (§5, `PRESENTATION-AS-MEANING-CARRIER`) asserted **nothing whatsoever**. Its §5 carve-out row is gone |
| `chart … level=` | *(deleted)* | `CHART-LEVEL-KEY` | not renamed — **deleted**. Zero corpus uses, zero 3-D bar charts, zero requests. It was also the only construct whose caption the ENGINE wrote rather than the author, and its `parseFloat` grammar uniquely accepted `1e3`, breaking the otherwise-uniform `\d+(\.\d+)?` numeric grammar |

### How this differs from the other genres

Today the only difference is a default. `block` shares the scene namespace
with `topology` and `flowchart` and every entry above is identical under all
three, except:

| | `block` | `topology` | `flowchart` |
|---|---|---|---|
| `flow` default | **`right`** | `right` | `down` |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | **NORMATIVE** | EXPERIMENTAL | EXPERIMENTAL |

The status row is the second difference, and it is a statement about
convergence rather than about syntax: `block` is the scene genre v0.1
freezes on, and the other two are held back precisely *because* the row
above it is the only thing separating them from it (`DOMAIN-VOCABULARY-PREFERENCE` §4).

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `block` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future
genre MAY spell a keyword the same as `block`'s with a different meaning; no
v0.1 genre does, and neither the core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the
layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`) can ever be redefined.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

> Longer scene prose (historical core §2.1–§2.8, labels/edges/external
> detail) is archived at the end of this file under **Scene model detail**
> so core + this document remain self-contained without depending on a
> long §2 chapter in [core.md](../core.md).

A block figure's meaning is a **scene**: a set of nodes, the groups that
contain them, and the edges that relate them.

- A node names a part. Its label carries what the part *is* (`FIDELITY-TARGET`); its
  `shape=` is geometry and carries no domain meaning (`SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`).
- An edge names a relation between two parts. The operator carries the
  direction; the endpoint order and operator token are preserved exactly as
  written and MUST NOT be normalized (§2.3, `READ-SIDE-DETERMINISM`).
- A group names containment. Membership is declared with `in=`, never
  inferred from rendered geometry.
- `flow` and `rank` express reading order and peer alignment — they are
  CONTENT, not layout, and they stay in the content zone, where they pass the
  `GUI-WRITEBACK-STRUCTURE` strip test and `tools/strip-check.js` does not strip them; `pin` is
  geometry with no meaning and lives in the `layout`
  zone (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`). (`path` and `routing` were the zone's other two members
  until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them; the content/layout split the rule
  states is unaffected — it is about which zone a construct belongs in, not
  about how many constructs the layout zone holds.) `rank`'s canonical form is one comma-delimited token
  (`rank a,b,c`); the space form `rank a b c` was RETIRED at  <!-- fence-check: skip -->
  0.1 (`POSITIONAL-LIST-SPELLING`) and is now the line error `rank takes ONE
  comma-delimited token: write rank a,b,c — the space form is retired
  (MIGRATIONS)`. Reserving the rest of a `rank` line for future
  `key=` options is exactly what forces this: a positional list that runs on
  past whitespace never terminates, so there is nowhere for an option to
  begin. `POSITIONAL-LIST-SPELLING` had ruled the space form "NOT deprecated" on migration cost,
  and cost is not a language argument before the freeze. A reading agent IGNORES the layout zone by default —
  the exception is the missing-construct workaround for a load-bearing
  arrangement (`MEANINGFUL-ARRANGEMENT`), which is a semantics gap, not a second contract.
  `GENRE-NAMESPACE` made that skip the default, and it is only safe if no genre semantics
  can ever appear inside the zone — which is exactly what `LAYOUT-ZONE-NAMESPACE`
  guarantees by making the layout zone a namespace of its own that no genre
  may define, redefine or extend a keyword inside.
- Nothing in a block figure means anything by virtue of where it was drawn.

## Errors

`block` adds no error conditions of its own. Its validation profile is the
core profile: unknown keyword, unknown or inapplicable option, unknown
`shape`, duplicate id, dangling edge endpoint, and the
single-valued-directive rules of §8 — all line errors.

**`in=` cycle is NOT in that list, and 0.1 took it out.** Core §8
reserves the category, but **no v0.1 document can reach it**: `in=` is
node-only, `in=` on a `group` line is itself a line error (
`INAPPLICABLE-OPTION-KEYS`), so containment is one level deep and no cycle is constructible.
No implementation has cycle detection, and none needs one. This document is
FROZEN, so it stated flatly an error a conforming engine can never emit —
`conformance/DISCREPANCIES.md` had filed the same fact honestly, under
*Untestable as written*, the whole time. The category stays reserved in core
§8 against a future nesting syntax; it is not a v0.1 error condition.

## What this genre does NOT own (OPEN QUESTION, `DOMAIN-VOCABULARY-PREFERENCE` §4)

`DOMAIN-VOCABULARY-PREFERENCE` rules that every genre SHOULD introduce keywords naming its own
domain's participants and relations. Whether `block` has such a domain
vocabulary is **explicitly open and undecided**. The honest position
recorded in `DOMAIN-VOCABULARY-PREFERENCE` §4 is that a scene of parts and relations may simply *be*
this genre's domain — in which case `node`/`edge`/`group` are not a
borrowed generic fallback but the correct words, and `block` legitimately
remains the generic case.

No block-specific keywords are proposed here. The vocabulary table above is
this genre's complete closed vocabulary today; if a `block`-specific word is
ever ruled in, it lands there. Until then the absence is a decision pending,
not an omission. `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` settles the *permission* question — a genre may own
its words — so what remains open is only whether `block` has words worth
owning.

## Example

```figdown
figdown 0.1 block
title "L3 Forwarding Datapath"
group ingress "Ingress Pipeline"
node parser "Packet Parser" in=ingress
node l2 "L2 Lookup" in=ingress
node l3 "L3 Lookup"
node q "CRC ok?" shape=diamond
edge parser -> l2
edge l2 -[miss]-> l3
edge l3 -> q
```

## Scene model detail (normative; relocated from core §2)

> Relocated from `spec/core.md` §2 during the `GENRE-DOCUMENT-CONTRACT` spec split so
> **core + this document** remain sufficient without depending on
> a long scene chapter in the core framework. Subsection numbers
> below keep the historical §2.x labels for cross-reference.

### Historical heading: Core scene model

The census shows these three types are one family: **boxes, containment,
and connections** — differing only in node kinds and edge styling. They
share one core model (the "why can't it be primitive + styling" rule).

### 2.1 Nodes

```figdown
node parser "Packet Parser"
node l3 "L3 Lookup" fill=#0d9488
node q1 "CRC ok?" shape=diamond
node sw1 "ToR Switch" shape=rounded
```

- `shape=` is **purely geometric** (`SHAPE-ENUM-VOCABULARY`): `box` (default) | `rounded` |
  `circle` | `ellipse` | `diamond` | `cylinder`. The language
  deliberately binds **no domain nouns** (router/host/gateway…) — an
  endless vocabulary; what a device *is* belongs in its label text
  (`FIDELITY-TARGET`: the meaning lives in the text). Unknown shape = line error.
  `cloud` was the one value that broke this rule — it named a domain
  (the internet cloud) rather than a geometry — and was **retired** (`SHAPE-ENUM-VOCABULARY`); it now produces a named diagnostic pointing at
  `shape=ellipse` plus a label or `class` that says what the region is.
- Nodes accept `style=dashed|dotted` (e.g. bridge-domain boxes in
  vendor figures).
- **The label is optional, and an absent label is recorded as absent**
  (`OMITTED-LABEL-RECORDING`). `node a` MUST NOT be read as `node a "a"`: the model records no
  label, so a reading agent can always tell "the author wrote no label"
  from "the author's label happens to equal the id". **Renderers MUST
  fall back to displaying the id** when no label was written, so
  `node a` still draws a box reading `a`. The substitution is a
  rendering rule, never a model rule.

  The same rule applies to every directive with an optional label —
  `group`, `bundle` (§2.5), `external` (§2.8, which has no id fallback:
  an unlabelled external draws no text at all), and the typed blocks
  `bitfield` / `table` / `timing` (§4). `plane` labels are optional and
  purely descriptive; an absent one is likewise absent.

- **An explicitly empty label `""` is a written value, and it draws
  nothing** (`EMPTY-LABEL-STATE`). `node a ""` is a third state, distinct from both
  `node a` and `node a "a"`: the model records `label: ""`, and the
  renderer MUST draw no text for it. The id substitution above applies
  ONLY to absence — the id is an internal handle, never authored display
  text, so substituting it would put words into a figure whose source
  has none. This is how a source figure with a deliberately textless
  shape (an unlabelled multiplexer, a junction, a bare glyph) is written
  without inventing a label or dropping the shape (`TRANSCRIPTION-FIDELITY-TIERS`, `EMPTY-LABEL-STATE`). The rule
  is uniform across all nine label-bearing directives and `title`.

### 2.2 Containment (groups / nesting)

```figdown
group ingress "Ingress Pipeline"
node parser "Parser" in=ingress
node l2 "L2 Lookup" in=ingress
group vtep1 "VTEP-1"
node vm1 "VM" in=vtep1               # one level of nesting
```

Flat `in=` reference keeps the grammar line-oriented (no indentation
semantics, no `end` blocks). `in=` is a **node** option; `group` does
not accept it — nesting is one level (a node in a group) in v0.1, so
`group … in=…` is a line error. Groups accept `gap=<px>` — member spacing
(presentation, `PRESENTATION-CONTROL-TIERS`); `gap=0` packs members flush, giving the classic
one-frame-with-dividers look. `INDENTED-BLOCK-SUGAR` (indented block sugar) is
**rejected**: it would be a second containment syntax (`NEW-CONSTRUCT-EVIDENCE-GATE`/`SPELLING-LENGTH-VS-FREQUENCY`).

### 2.3 Edges

```figdown
edge parser -> l2
edge l2 -[on miss]-> acl style=dashed
edge sw1 [e1/1] -- [e1/2] sw2          # endpoint (port) data
edge peer1 <-[3-way handshake]-> peer2
edge ack <- syn                        # statement order = author's focus
```

Operators `--` `->` `<-` `<->` — exactly D2's set (Mermaid/D2
conventions, AI prior knowledge, `DESIGN-DECISION-METHOD`/`REVERSE-ARROW-OPERATOR`).

**The written form is the model** (`EDGE-WRITTEN-FORM`). A conforming implementation
records an edge exactly as written — the operator token and the endpoint
order, unchanged:

- The semantic model of `edge b <- a` is `{a: "b", op: "<-", b: "a"}`.
  It MUST NOT be normalized to `{a: "a", op: "->", b: "b"}`, and the
  reverse rewrite is equally forbidden.
- The **direction of the relationship is derived from the operator**, not
  from the endpoint order: `->` runs first→second, `<-` runs
  second→first, `--` is undirected, `<->` is bidirectional. Two
  implementations therefore read the same direction out of the same
  source without ever needing to agree on a normal form.
- `A <- B` and `B -> A` are a **rendering equivalence only**: the drawn
  arrow means the same thing. They are not the same document. The
  spellings are not even visually identical — auto-layout follows
  statement order, so node positions may differ — and the spelling
  exists because the author's statement order is itself part of how
  humans encode meaning.
- Normalizing would also break **references**: `bundle` members are recorded
  in their written order (§2.5). An implementation that rewrote `b <- a` into
  `a -> b` would resolve that reference differently from one that did
  not — the exact cross-implementation divergence the standard exists to
  prevent (`READ-SIDE-DETERMINISM`). (`path`, which named one edge "exactly as written", was the
  second reference this argument cited until `EDGE-GEOMETRY-CONSTRUCTS` withdrew it.
  One surviving reference is enough for the argument: the divergence it
  describes needs only one construct that reads written order.)

**Labels are inline, at the three meaningful positions** (`EDGE-LABEL-PLACEMENT`): near
the tail, on the line, near the head — each written where it appears
in the figure (`FIDELITY-TARGET`: text is a 1-D encoding of the figure). A `[mid]`
label splits the operator into halves (left `-` or `<-`, right `-` or
`->`), mirroring Mermaid's `A -- text --> B`. No mainstream language
offers more than three positions (prior-art.md §1).
Typical uses: interface tags (`e1/22.2`), cardinalities (`1`/`N`),
endpoint roles.

Bracket content rules:
- Balanced inner brackets nest verbatim: `[flags[3:0]]` displays
  `flags[3:0]`.
- For unbalanced brackets, `\n`, or literal quotes, use the quoted
  form `["..."]` — the standard string escapes apply (Mermaid's
  quote-inside-shape convention).
- An empty `[]` is a line error. `label=`/`taillabel=`/`headlabel=`
  are retired (migration 0.1).
- Edge endpoints are **nodes or declared `external` endpoints** (§2.8):
  an endpoint naming a group is a line error (connect to a member node;
  group-level edges are out of scope for v0.1 — silently dropping them
  would violate the no-silent-failure rule), and a truly unknown id is
  a dangling-endpoint line error.

Edge lines carry **pure semantics** — endpoints, direction, labels,
plane. *How* a connection is drawn across the canvas is a rendering
parameter with no meaning, and it belongs in the trailing layout zone with
`pin` — never inline on an `edge` line. v0.1 has **no** per-edge geometry
construct at all: the `routing` and `path` directives held that role until
`EDGE-GEOMETRY-CONSTRUCTS` withdrew them, and nothing replaced them. Shape an edge
by shaping the scene — `rank`, `flow`, declaration order, and `pin` on the
endpoints.

### 2.4 Planes (`PRESENTATION-CONTROL-TIERS`) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** Definition: [../experimental.md](../experimental.md) §E1.
The `plane` keyword, its option key `z-index=` and the option key `plane=`
that references a declared plane are outside the v0.1 conformance surface and
outside the compatibility promise. The engine accepts all three unchanged and
the documents that use them keep working. The implicit `base` plane and the
model's `planes` array are unaffected and are NORMATIVE: every document has
`planes[0] = {id:"base", z:0}`, every `node` and `edge` reports
`plane: "base"`, and a document that declares no `plane` is a portable v0.1
document. See core §10 for what the status means.

### 2.5 Semantic annotations: `bundle` (topology vocabulary) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** Definition: [../experimental.md](../experimental.md) §E2.
Genre document: [experimental/topology.md](experimental/topology.md), itself
EXPERIMENTAL. `bundle` is outside the v0.1 conformance surface and outside the
compatibility promise; the engine accepts it unchanged and the documents that
use it keep working. It is demoted because it is `topology` vocabulary and
`topology` is itself experimental: measured over the 50-document in-repo
corpus, `bundle` appears in four documents and every one of them is a
`topology` document, so it belongs to no normative genre's minimum set.

### 2.6 Thresholds and zone bands: `threshold`, `band` (generic markers) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** Definition: [../experimental.md](../experimental.md) §E3,
which also records why they stay experimental through the 0.1 changes:
`GENRE-EARNING-THRESHOLD` governs, the scalar-marker need is genre-shaped rather than
keyword-shaped, and these two are the `GENRE-EARNING-THRESHOLD` *interim* while the candidate genre
(core §9) is designed. Both are outside the v0.1 conformance surface and
outside the compatibility promise; the engine accepts them unchanged and the
documents that use them keep working. See core §10 for what the status means.

**Nothing frozen in this document depends on §2.4–§2.6.** The scene genre's
own vocabulary is the seven NORMATIVE keywords `node`, `group`, `external`,
`edge`, `class`, `flow` and `rank`; the four constructs above share their
namespace without being part of it, and this document stays a complete,
self-contained normative home for genre `block` with the experimental file
set deleted.

### 2.7 Semantic classes: `class` (+ derived legend)

```figdown
class vidp "VID_P — primary VLAN"   stroke=#dc2626
class vidc "VID_C — community VLAN" stroke=#2563eb
edge up  <-> pp1 class=vidp
edge pp1 <-> cp1 class=vidc
```

`class <id> "<meaning>" [fill=] [stroke=] [style=]` declares a
**semantic class** once: a machine-readable meaning plus presentation
defaults (Mermaid `classDef` heritage; `PRESENTATION-CONTROL-TIERS`'s HTML+CSS analogy made
literal). Any `node`, `group`, `edge`, `field`, `cell` mark, or typed-
block opener (`bitfield`/`table`/`timing`) joins it via `class=<id>` —
or **multiple** classes via `class=hot,deprecated` (comma-separated,
same convention as `pin at=` / `data=`; 0.1). The model field
is an array of ids. Same-line repeated `class=` is a line error.

- The corpus evidence (prior-art §4.4): 56% of real figures carry
  categorical meaning in color with no stated mapping. `class` is that
  mapping — an agent reads `class=vidp` on the element itself (`MEANING-RECOVERY-SOURCE`),
  never correlating hex values.
- **The meaning field is mandatory; its value may be empty** (
  `CLASS-EMPTY-MEANING`) — the language's own absent/`""`/`"text"` tri-state (`EMPTY-LABEL-STATE`):

  | form | status | legend |
  |---|---|---|
  | `class x` | **line error** — the field is missing | — |
  | `class x ""` | **legal** — no meaning is claimed | **no entry** |
  | `class x "Hard ceiling"` | legal | entry drawn |

  `class x ""` is pure attribute grouping: one name applied to many
  members so a shared look is not repeated, asserting nothing about what
  the look means. A reading agent concludes NO category from it (core
  §12.7). It is **not** the way to spell a role — a `flowchart` role
  belongs in that genre's vocabulary, not in a meaning-less class.
- A **legend strip derives automatically** (declaration order, swatch +
  meaning) — like the EXPERIMENTAL `bundle`'s ring
  ([../experimental.md](../experimental.md) §E2), no coordinates, no dummy
  elements. It
  draws what the author declared and nothing the author did not: no swatch
  for a class that declares no paint (`CLASS-PAINT-REQUIREMENT`), and no entry at all for a
  class whose meaning is `""` (`CLASS-EMPTY-MEANING`).
- Explicit element attributes override class defaults (rigidity, `LAYOUT-STABILITY`).
  When several classes are joined, their presentation channels apply
  left-to-right and later wins per channel (CSS multi-class cascade).
- Class ids are their own namespace; referencing an undeclared class
  is a line error; duplicates are errors. Empty `class=` and empty
  members (`class=a,b`) are line errors.
- Stripping `fill=`/`style=` from a `class` line loses nothing
  semantic — the id and meaning stay (§5 invariant refined). When a
  color *classifies*, authors SHOULD use `class`; bare `fill=` is for
  decoration.

### 2.8 External endpoints: `external`

```figdown
external wire "to wire"
node mac "MAC"
edge mac -> wire
```

`external <id> ["label"]` declares an **external I/O endpoint** — the
outside world an edge enters from or leaves to. Reading semantics
(`MEANING-RECOVERY-SOURCE`): an external is *not* a participant node; it states only that the
connection crosses the figure's boundary.

- Edges reference it at either endpoint exactly like a node, and the
  EXPERIMENTAL `bundle`'s members may reference such edges normally
  ([../experimental.md](../experimental.md) §E2). It
  takes exactly ONE option — the EXPERIMENTAL `plane=` (organizational, as on a
  node).
  `fill=`, `stroke=` and `style=` are line errors here: an external has no
  fill, no border and no dash to apply them to (§5 carve-outs); `color=`
  was its one paint key and it is retired language-wide (`COLOUR-KEY-STATUS`), so its
  label is drawn in the canvas ink (`LABEL-COLOUR-SOURCE`). Extra positional arguments are
  line errors.
- Ids share the node/group namespace — which also
  contains the typed-block ids (`bitfield`/`table`/`timing`), so a bare id
  in `edge`/`pin` is never ambiguous. Duplicates and cross-kind
  collisions are line errors.
- **Never drawn as a shape.** The edge simply ends open (keeping its
  normal arrowhead) at a small invisible anchor that auto-layout
  places at the figure's natural margin; `pin <id> at=(x,y)` overrides
  with node-pin semantics (`at=` is the only key an `external` endpoint
  takes — `width=`/`height=` are a line error on one, because its geometry
  derives from its content). The label, when given, renders as small
  muted text just beyond the open end, away from the edge direction.
  `shape=none` was rejected: `shape=` is purely geometric (`SHAPE-ENUM-VOCABULARY`) — an
  external is honest semantics, not a hidden node.
- Corpus evidence (`EXTERNAL-EDGE-ENDPOINTS`): 70–80% of block/flowchart figures contain at
  least one open-ended arrow.


