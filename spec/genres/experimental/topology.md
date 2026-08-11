# FigDown Genre: `topology`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any topology figure.
>
> **Genre status: EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** `topology`
> is outside the v0.1 conformance surface and outside the compatibility
> promise. The engine accepts it unchanged, every existing `topology`
> document parses and renders exactly as before, and no `.fd` needs
> rewriting — but the genre may change or be withdrawn in a later `0.x`
> without a migration entry, and a `topology` document is not a portable
> v0.1 document. It is demoted because it has **not converged** — it still
> shares `block`'s namespace with nothing but a default to tell the two
> apart (`DOMAIN-VOCABULARY-PREFERENCE` §4) — not because it is wrong or deprecated. The NORMATIVE
> v0.1 genres are `block`, `bitfield` and `table`. See core doc §10 for
> what the status means. This document remains normative *for* the genre:
> it is the authority on what `topology` means.

**Census**: 5.0% weighted. Prior art: none borrowed wholesale; `bundle`
is the one topology-flavoured construct and takes its neutral umbrella
name from the aggregation concepts the figures actually show.

## Purpose

Expresses a **network of devices and the links between them**: fabrics,
overlays, access layers, peering diagrams. Distinguished from `block` not
by vocabulary — it shares all of it — but by what the figure is about: the
nodes are devices or endpoints, and the edges are physical or logical
links rather than dataflow steps.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `right` | The core-model default; topology figures are commonly re-laid out with `pin` |
| `shape` | `box` | The core-model default (§2.1) |

## Complete vocabulary (normative)

Every keyword and option key valid in a `topology` document, with this genre's
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
**S** = the scene namespace shared with `block` and
`flowchart`; **N** = a nested-genre opener — composition, not `topology`
vocabulary (§4, `GENRE-COMPOSITION`).

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. Because
`topology` is itself an experimental genre, every row below is outside the
conformance surface *as written in a `topology` document*; the column
records each construct's **own** status, which is what an author needs when
carrying the same construct into `block`.

| Keyword | Form | NS | Status | Option keys | `topology` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.1 topology` | C | NORMATIVE | — | required, first significant line |
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
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `topology` top level |
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

**`bundle` and `plane` are this genre's own working vocabulary, and they
are outside the v0.1 surface — not removed from it.** They were NORMATIVE until this release and were demoted by `CONSTRUCT-STATUS-TIERS` on measured evidence: over the
50-document in-repo corpus `bundle` appears in 4 documents and `plane` in
3, and **all seven of those documents are `topology` documents**. Both
appear zero times in `block`, `bitfield` and `table`, so neither belongs to
any normative genre's minimum set, and the genre they do belong to is
itself EXPERIMENTAL. Nothing about that is a loss for `topology`: these are
the constructs its figures actually use, they keep exactly the meaning
§2.4 and §2.5 give them, the engine renders them byte-identically, and
this document remains the authority on what they mean. The status column
says only what it says everywhere else — a figure that needs them is not a
portable v0.1 figure, which is already true of every `topology` document by
virtue of its header. Read together, the two facts are one fact: this
genre and its vocabulary have not converged yet, and they are held back
together.

### Option-key values

| Key | Values | Status | `topology` default |
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
keyword, because a keyword and its only declaration point move together: in
a document that may not declare a plane, `plane=` could only ever name the
implicit `base`, which is an option with exactly one legal value. `extend=`
and `z-index=` are demoted only because the sole directives that accept them
(`band`, `plane`) are. **`points=`, `tailport=`, `headport=` and `routing=` had
rows here until this release**: `path` alone accepted all four, and `EDGE-GEOMETRY-CONSTRUCTS` withdrew
them from the language with it. The implicit `base` plane
is untouched by all of this: a document that declares no `plane` still has
`planes[0] = {id:"base", z:0}` and every element still reports
`plane: "base"`.

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

Today the only difference is a default. `topology` shares the scene namespace
with `block` and `flowchart` and every entry above is identical under all
three, except:

| | `block` | `topology` | `flowchart` |
|---|---|---|---|
| `flow` default | `right` | **`right`** | `down` |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | NORMATIVE | **EXPERIMENTAL** | EXPERIMENTAL |

The status row is the second difference, and it is a statement about
convergence rather than about syntax: `block` is the scene genre v0.1
freezes on, and the other two are held back precisely *because* the row
above it is the only thing separating them from it (`DOMAIN-VOCABULARY-PREFERENCE` §4).

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `topology` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future
genre MAY spell a keyword the same as `topology`'s with a different meaning; no
v0.1 genre does, and neither the core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the
layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`) can ever be redefined.

Two scene constructs carry most of the topology load and are worth naming,
though both belong to the shared scene namespace and are available under
every scene genre: **`bundle`** (§2.5) — the one scene construct that
arrived from topology figures, and EXPERIMENTAL for exactly
that reason — and **`external`** (§2.8), an external endpoint that is never
drawn as a box (`EXTERNAL-EDGE-ENDPOINTS`) and stays NORMATIVE.

Directed and coloured edges work under `topology` exactly as under `block`.
Within one namespace a genre never restricts explicit syntax (field feedback: a downstream transcription once lost direction semantics by assuming
otherwise).

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A topology figure's meaning is a **scene** with the same reading rule as
§2's core model: nodes, containment, and relations.

- A node names a device or endpoint; its label carries what the device *is*
  (`FIDELITY-TARGET`). `shape=` is geometry and never encodes a device class (`SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`) —
  a router is a router because its label says so.
- An edge names a link. Direction comes from the operator; endpoint order
  and operator token are preserved as written (§2.3, `READ-SIDE-DETERMINISM`).
- A `bundle` names the aggregation relation over its member edges; members
  are recorded in written order and resolve unordered per member (§2.5).
- A `external` names something outside the figure's scope; it has no box
  and carries no presentation but its label and plane.
- Geometry carries nothing. Adjacency in the rendered picture is not
  connectivity — only an `edge` is. The `layout` zone is ignored by default
  (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`), and that skip is only safe because the zone is a namespace
  of its own whose every member is genre-independent, so no genre semantics
  can ever appear inside it (`LAYOUT-ZONE-NAMESPACE`).

## Errors

`topology` adds no error conditions of its own. Its validation profile is
the core profile: unknown keyword, unknown or inapplicable option, unknown
`shape`, duplicate id (nodes, groups, externals and typed blocks share one
namespace), dangling edge endpoint, `in=` cycle, ambiguous or unknown
`bundle` member, and the single-valued-directive rules of §8 — all line
errors.

## What this genre does NOT own (OPEN QUESTION, `DOMAIN-VOCABULARY-PREFERENCE` §4)

`DOMAIN-VOCABULARY-PREFERENCE` rules that every genre SHOULD introduce keywords naming its own
domain's participants and relations. Whether `topology` has such a domain
vocabulary is **explicitly open and undecided**, exactly as for `block`.
The case for one is stronger here than for `block` — `bundle` already
exists and came from this domain — but `SHAPE-ENUM-VOCABULARY` constrains it sharply: device
class must not become a shape enum or a presentation attribute, so any
topology vocabulary must be *words naming relations*, not geometry.

No topology-specific keywords beyond `bundle` are proposed here, and
`bundle` itself is now EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) — which does not weaken the case above
but sharpens it: the one word this genre has earned is held outside the
frozen surface *until* the ownership question is settled, rather than
frozen into the shared scene namespace before it is. Open
questions that would feed such a vocabulary are recorded in the core doc
§9 (`TAP-VERSUS-JUNCTION-SPELLING` edge taps and junctions; `MEANINGFUL-ARRANGEMENT` declared arrangement). `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION`
settles the *permission* question — a genre may own its words, and may even
reuse another genre's spelling — so what remains open is only whether
`topology` has words worth owning.

## Example

```figdown
figdown 0.1 topology
title "EVPN Fabric"
node s1 "Spine-1" shape=rounded
node s2 "Spine-2" shape=rounded
node l1 "Leaf-1" shape=rounded
node l2 "Leaf-2" shape=rounded
external wan "Upstream WAN"
edge l1 -- s1
edge l1 -- s2
edge l2 -- s1
edge l2 -- s2
edge s1 -> wan
bundle es1 "ES-1 (multi-homed)" l1--s1,l2--s1 stroke=#0d9488
```
