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
> v0.1 document. It is demoted because it has **not converged** (`DOMAIN-VOCABULARY-PREFERENCE` §4) —
> not because it is wrong or deprecated. The NORMATIVE v0.1 genres are
> `block`, `bitfield` and `table`. See core doc §10 for what the status
> means. This document remains normative *for* the genre: it is the
> authority on what `topology` means.
>
> **This document DECLARES this genre's vocabulary (`SUBJECT-VOCABULARY-SCOPE`)
> instead of forwarding to `block`'s.** It used to say that `topology` was
> "distinguished from `block` not by vocabulary — it shares all of it", which
> is a genre document stating that it does not contain its own vocabulary and
> is therefore incomplete against `GENRE-VOCABULARY-OBLIGATION`'s own exchange condition
> (`decisions/registry.md`). `topology`'s subject vocabulary is
> **`group`, `external` and `bundle`**, declared below; `threshold`, `band`
> and `plane` were withdrawn from this genre in the same release.

**Census**: 5.0% weighted. Prior art: none borrowed wholesale; `bundle`
is the one topology-flavoured construct and takes its neutral umbrella
name from the aggregation concepts the figures actually show.

## Purpose

Expresses a **network of devices and the links between them**: fabrics,
overlays, access layers, peering diagrams. What the figure is about is the
first distinction from `block`: the nodes are devices or endpoints, and the
edges are physical or logical links rather than dataflow steps.

**Vocabulary is the second, and it is a real one.** This
genre declares `group`, `external` and `bundle` — three declarations of its
own, written below in this genre's words, with this genre's reading advice
and this genre's collisions named. Two of the three spellings are also
`block`'s; those are `block`'s separate declarations, which agree with these
today and are free to stop agreeing (`GENRE-VOCABULARY-OBLIGATION`, `SUBJECT-VOCABULARY-SCOPE`). One of the three, `bundle`,
has a referent no other genre can name, and defining it by that referent is
shorter and stronger than the geometric definition the shared text used to
carry.

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
**H** = the **scene host set** — `class`, `flow`, `rank`. Every scene genre
accepts all three and **none of them is subject vocabulary**: `class` is a
styling declaration and `flow`/`rank` are layout intent, so none of them
names a referent, no genre's domain holds a competing meaning for one, and no
genre can independently earn or lose one (`SUBJECT-VOCABULARY-SCOPE`); **T** =
**`topology`'s OWN vocabulary** (`GENRE-VOCABULARY-OBLIGATION`; `SUBJECT-VOCABULARY-SCOPE`) — declared in this
document, which is normative for it. Where `block` or `flowchart` spells the
same word, that is **that genre's own declaration agreeing with this one**,
not this one borrowed; **N** = a nested-genre opener — composition, not
`topology` vocabulary (§4, `GENRE-COMPOSITION`).

**The NS column changed.** Every row now marked **T** or **H**
was marked **S**, "the scene namespace shared with `block` and `flowchart`".
There was no such namespace — there was a set of words four genres happened
to accept — and calling it one is precisely what let this document claim it
shared a vocabulary it never declared.

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
| `title` | `title "<text>"` | C | NORMATIVE | `note` (requires `figdown 0.3`) | absent; `note=` is `title`'s FIRST option key (`DRAWN-ANNOTATION-FORM`) |
| `node` | `node <id> ["label"]` | T | NORMATIVE | `shape` `fill` `stroke` `style` `class` `in` `note` (requires `figdown 0.3`) | `shape=box`, label absent; a node is a DEVICE or an endpoint |
| `group` | `group <id> ["label"]` | T | NORMATIVE | `fill` `stroke` `style` `class` `gap` `note` (requires `figdown 0.3`) | one nesting level — see the declaration below, where this genre's own default is the open question |
| `external` | `external <id> ["label"]` | T | NORMATIVE | **none** | never drawn (`EXTERNAL-EDGE-ENDPOINTS`); since 0.1 it took no paint key — `color=` was its only one and it is retired (`COLOUR-KEY-STATUS`) — and since 0.3 (`PAINT-ORDER-CONSTRUCT`) it takes **no option key at all**: `plane=` was its last one. No `note=` — it puts nothing on the page, so there is nothing for a note to stand beside |
| `edge` | `edge <a> [tail] <op> [head] <b>` | T | NORMATIVE | `stroke` `style` `class` `note` (requires `figdown 0.3`) | op is written form; `[mid]` splits the operator; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`); an edge is a LINK, physical or logical |
| `bundle` | `bundle <id> ["label"] <a>--<b>,<c>--<d>` | T | **EXPERIMENTAL** | `stroke` `style` | a LAG, an ECMP set, an EVPN Ethernet Segment — see the declaration below. Ring drawn dashed; member list is ONE whitespace-free comma-delimited token (the space form was RETIRED at 0.1); no `fill=` — a ring has no interior (§8.4) |
| `class` | `class <id> "<meaning>"` | H | NORMATIVE | `fill` `stroke` `style` | the meaning FIELD is REQUIRED, its VALUE may be `""` (= no meaning claimed, no legend entry — `CLASS-EMPTY-MEANING`); a class an `edge` joins must not declare `fill=` without `stroke=` — an edge has no interior, so the two name ONE channel (`INTERIOR-LESS-ELEMENT-PAINT`). Declaring NO paint is legal: the class claims a meaning and the edge keeps its default line (`CLASS-PAINT-REQUIREMENT`'s second half RETIRED at 0.4, `CLASS-CHANNEL-REACH`) |
| `flow` | `flow right\|down\|left\|up` | H | NORMATIVE | — | **`right`** |
| `rank` | `rank <id>,<id>[,<id>…]` | H | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token; the space form was RETIRED at 0.1; the rest of the line is reserved for future options |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px; group members are group-local. All three keys are OPTIONAL and at least one is REQUIRED; `at=` applies to nodes, groups and `external` endpoints, `width=`/`height=` to **nodes only** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — `size` is retired and its keys moved here) |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `topology` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | 0.1 correction: `chart` was legal at a scene document's top level but had no vocabulary row anywhere. It is defined by its reference to a `table` id, and `table` is a legal host keyword in every scene genre, so a scene document can carry both the data and the chart. `type=bar3d` is the only value. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1 (`CHART-LEVEL-KEY`), so `chart <table-id> [type=bar3d]` is the whole grammar. |

`bundle` is demoted, not removed: the engine accepts it exactly as before and
every document that uses it keeps rendering.

**Two rows left this table, and the deletion is recorded rather
than silent.** `path` and `routing` were core keywords until 0.1, then
EXPERIMENTAL members of the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW** them
from the language along with the four option keys only `path` accepted
(`points=` `routing=` `tailport=` `headport=`). There is **no replacement
spelling** — they were removed, not renamed — so the fix for a document that
used them is to **delete** those lines, which changes the rendered output (the
edge falls back to auto layout; shape it with `rank`, `flow`, declaration order
and `pin`). The evidence: [../../migrations.md](../../migrations.md)
0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, and `decisions/registry.md`
`LAYOUT-ZONE-NAMESPACE` is unchanged; only its membership is, and it now holds `pin` alone.

### The `topology` genre's own subject vocabulary (NS = T)

**Three declarations, made here, by this genre, for this genre** (`GENRE-VOCABULARY-OBLIGATION`; `SUBJECT-VOCABULARY-SCOPE`). `block` spells `group` and `external` too, and `flowchart`
spells `external`. Those are their declarations; these are `topology`'s, and
neither side is derived from the other. The difference is not decorative: two
of the three carry a **domain collision** that no other genre has, and the
third has a **referent** no other genre can name.

#### `group` — NORMATIVE

    group <id> ["label"] [fill=] [stroke=] [style=] [class=] [gap=] [note=]

A `group` names a **containing region of the network**: a site, a POD, a
rack, a data centre, a maintenance domain. Membership is declared with `in=`
on the member node and never inferred from where the renderer put the box.

**COLLISION — warn a reader off the multicast reading.** In this genre's
domain, "group" first means a **multicast group** (IGMP/MLD), and a topology
figure is a very likely place to draw multicast: `group g "224.0.0.5"` reads
as one, and it is not one. The collision is **SOFT**, which is why the
spelling survives: **the wrong reading is contradicted by the picture**,
because a multicast group is never drawn as a box round its members, and this
`group` always is. A reader who takes the multicast sense for a moment is
corrected by the figure itself, not left with a wrong figure.

**Why it is not renamed.** Every networking synonym is *more* taken than the
word it would replace: `zone` (DNS, and the firewall zone), `cluster`
(RFC 4456's route-reflector cluster), `domain` (RFC 7926's routing domain),
`area` (OSPF), `site` (EVPN). Trading a soft collision the picture corrects
for a hard collision the picture cannot is a bad trade, and this is the
argument, not "renaming is expensive" — a rename here is FREE, since
`topology` is an experimental genre (§Genre status).

**This genre's default is `block`'s default today, and that is now visible as
a coincidence rather than a rule.** One nesting level — a
node in a group, no group in a group — is what the engine enforces. Whether
one level is right for a **POD inside a fabric**, which is the shape topology
figures actually have, is a question that could not even be asked while the
sentence "one nesting level" belonged to no genre. It is this genre's
question to answer, in this document, and answering it would not touch
`block`.

#### `external` — NORMATIVE

    external <id> ["label"]        # no option key at all

An endpoint **outside the drawn network**: the upstream WAN, the peer AS, the
customer edge the figure does not enumerate. It states that a link leaves the
figure, and nothing more; it is never drawn as a shape (`EXTERNAL-EDGE-ENDPOINTS`), and the edge
simply ends open at the figure's natural margin.

**COLLISION — the external ROUTE.** In networking, "external" is first an
external route: an OSPF Type 5 or Type 7 external LSA, eBGP, an "external
peer". FigDown's means *outside this figure*. The two authored uses in the
tree show the ambiguity closing: `examples/pvlan-flows.fd` writes
`external rtr "Router"` for a router that is outside the figure, which a
reader may take as *the external-facing router* — a different claim about a
router that is very much inside the network.

**SOFT, for the same structural reason as `group`, and it is a different
reason from `group`'s.** An `external` **is never drawn at all**, so it can
never be mistaken for a device the figure is making a claim about; the wrong
reading has nothing to attach to. And the same synonym problem applies: every
networking word for "outside" is already an assertion about routing.

**Contrast the other two declarations of this spelling, because they are
genuinely different documents.** `flowchart`'s `external`
has a **referent and a citation** — ISO 5807 §9.4.2's *Terminator*, the
off-page terminus (a citation still **PENDING VERIFICATION**: §9.4.2 sits
past the readable pp. 1-8, so both the spelling and the clause number are
unread; added 0.3.z, see `decisions/registry.md`). `block`'s has **no source standard at all** and says so.
`topology`'s has neither a referent nor an innocent domain: it has a
collision to warn about. One shared paragraph could carry exactly one of
those three, and it carried none of them.

#### `bundle` — EXPERIMENTAL

    bundle <id> ["label"] <a>--<b>,<c>--<d>   [stroke=] [style=]

A **LINK BUNDLE**: a set of parallel links between the same pair of devices
operated as one logical link — a **LAG** (IEEE 802.1AX), an **ECMP set**, an
**EVPN Ethernet Segment**. Drawn as a dashed ring enclosing its member links;
members are named as one whitespace-free comma-delimited token, recorded in
written order, and each resolves against a declared `edge`. No `fill=`: a
ring has no interior (§8.4).

**That is the whole definition, and it is shorter and stronger than the
geometric one it replaces.** Until 0.3 the shared text
defined `bundle` as *a dashed ring around parallel edges between the same
pair* — a description of a drawing that asserts nothing. This genre does not
need it: **the domain reading and the drawn reading are the same reading**,
so naming the referent defines the construct completely.
`examples/srl-evpn-irb.fd` writes `bundle es1 "ES-1 / LAG-1" …` and a network
engineer and the renderer agree about what it means without consulting
either.

Its EXPERIMENTAL STATUS — what being outside the conformance surface costs, and the
skip promise that goes with it — is treated in
[../../experimental.md](../../experimental.md) §E2, which
records the construct as declared by this genre. The declaration itself is
here.

This is **the one clean cell of the twenty-four** the audit examined
(`decisions/registry.md`): real authored evidence — 3 authored
figures, all `topology` — and no collision at all. `block` declared the same
spelling with zero authored uses and nothing to name; `SCENE-KEYWORD-MEMBERSHIP` withdrew that
cell and left this one untouched.

**RULE 4.1 EXCEPTION, recorded deliberately.** IEEE 802.1AX is cited here as
the **REFERENT**, not as the source of the orthography. The standard's own
noun is *aggregation* (Link Aggregation Group), and RULE 4.1 would ordinarily
take that spelling whole. It is not taken, because it would be **false for
two of the three things this construct names**: an ECMP set is not an
aggregation in 802.1AX's sense, and an EVPN Ethernet Segment is an
identifier for a multi-homed attachment, not an aggregation either. `bundle`
is the neutral umbrella the figures themselves use. Where the
standard's noun does not cover the construct's own extension, the standard
cannot be taken whole — and the exception is written down here rather than
left as a silent deviation.

#### Withdrawn from `topology`

Three rows left this genre in one release. All three were free: `topology` is
an EXPERIMENTAL genre, outside the compatibility promise, and `EDGE-GEOMETRY-CONSTRUCTS`'s
withdrawal of `path`/`routing` is the precedent for doing it
without a version gate.

| Withdrawn | R | Ground |
|---|---|---|
| `threshold` | `SCENE-KEYWORD-MEMBERSHIP` | **Zero occurrences under `topology`**, and in this genre's domain a threshold is a QUEUE DEPTH WITH A NUMERIC VALUE (RFC 2309 `minth`/`maxth`, RFC 7567) — while FigDown's takes no `value=` and its `offset=` is a fraction of the target's rendered extent, not a quantity. `block` declares it, and the `GENRE-EARNING-THRESHOLD` scalar-marker evidence that justifies it is `block` evidence |
| `band` | `SCENE-KEYWORD-MEMBERSHIP` | Its two occurrences under `topology` were **both conformance fixtures**, never a figure anyone needed; and in this genre a *band* is a **frequency band** — radio, wireless, microwave, optical transport — which is exactly the kind of figure a topology document draws. Over-determined: no evidence and a hard collision |
| `plane` | `PAINT-ORDER-CONSTRUCT` | **Withdrawn from the LANGUAGE**, not merely from this genre, together with `plane=` and `z-index=`. It was this genre's worst collision: FigDown's `plane` was a drawing layer (a z-order), and in networking a *plane* is the control / data / management partition of a device — one of the first distinctions the field teaches — so the one word said the wrong thing to precisely the readers who write these figures. See below |

**`plane` is the case this ruling exists for, and the evidence was already in
the tree.** Both of its authored uses were `topology` documents, and one of
them showed the trap closing: `examples/evpn-fabric.fd` wrote
`plane overlay "VXLAN tunnels" z-index=2`, where *overlay* is itself a  <!-- fence-check: skip -->
networking term, so the line reads as a network-architectural assertion and
was in fact a paint order. Stripping that line and its one reference and
rebuilding produced an SVG of **12449 bytes, exactly as before** — of 198
markup tokens one differed, an edge index — because the overlay's whole
visual identity came from `class=overlay`, which the figure had already
declared. **Nothing about the implicit `base` plane changed**: every document
still has `planes[0] = {id:"base", z:0}`, every element still reports
`plane: "base"`, and paint order is document order. A figure that needs to
say "these nodes are the control plane" says it with a `class` whose meaning
states it (§5, `PRESENTATION-AS-MEANING-CARRIER`) — which is what both authored uses were already doing
alongside the keyword.

### Option-key values

| Key | Values | Status | `topology` default |
|---|---|---|---|
| `shape` | `box` `rounded` `circle` `ellipse` `diamond` `cylinder` | NORMATIVE | `box` |
| `style` | `solid` `dashed` `dotted` | NORMATIVE | per directive (`solid` on `node`/`group`/`edge`; dashed on `bundle`) |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line (`edge`, `bundle`), which is SVG's own asymmetry | NORMATIVE | absent |
| `class` | id of a declared `class` | NORMATIVE | absent |
| `in` | id of the containing `group`, on a `node` | NORMATIVE | absent |
| `note` | quoted prose — the DRAWN annotation, on `node`, `group`, `edge` and `title` (`DRAWN-ANNOTATION-FORM`) | NORMATIVE since `figdown 0.3` | absent |
| `gap` | non-negative number (px) — exact member spacing inside a `group` | NORMATIVE | absent → the renderer's automatic spacing |
| `at` | `(<x>,<y>)` canvas px — a PAREN POINT, `pin` only | NORMATIVE | optional on `pin` — nodes, groups and `external` endpoints |
| `width` `height` | px number | NORMATIVE | optional on `pin`, **nodes only** — a group, an `external` endpoint or a typed block sizes to its content; at least one of `at`/`width`/`height` is required on the line. Spelled `w=`/`h=` until 0.1; carried by `size` until 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |

`fill=`, `stroke=` and `style=` are all normative:
`stroke=` was promoted by `STROKE-KEY-STATUS` once its use count was re-measured (5 in-repo
at `CONSTRUCT-STATUS-TIERS`; 56+ in-repo and 567 downstream edge-colouring sites now). There is
no text channel — `color=` is retired language-wide (`COLOUR-KEY-STATUS`) and the label
colour is derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).
**Four rows left this table.** `plane=` and `z-index=` were
withdrawn from the LANGUAGE with the `plane` keyword (`PAINT-ORDER-CONSTRUCT`) — a keyword and
its only declaration point move together — and neither names a replacement.
`offset=` and `extend=` left this GENRE with the two directives that accepted
them, `threshold` and `band` (`SCENE-KEYWORD-MEMBERSHIP`); they are still live under `block`, which
declares both. `in=`'s second sense went with them: under `topology` it names
a containing `group` and nothing else, where under `block` it also names a
`threshold`/`band` target. **`points=`, `tailport=`, `headport=` and
`routing=` had rows here until 0.1**: `path` alone accepted all four,
and `EDGE-GEOMETRY-CONSTRUCTS` withdrew them from the language with it. The implicit `base` plane is
untouched by all of this: every document still has
`planes[0] = {id:"base", z:0}`, every element still reports `plane: "base"`,
and paint order is document order.

Edge operators: `->` `<-` `--` `<->`. The written form is the model (`READ-SIDE-DETERMINISM`);
`A <- B` and `B -> A` are a *rendering* equivalence only.

Retired spellings, kept only so a stale document gets a named migration
instead of `unknown option`: `kind=` on `node` (→ `shape=`),
`width=`/`height=` on `node` (→ a `pin` line), `label=`/`taillabel=`/`headlabel=` on `edge`
(→ inline `[…]` labels). (`from=`/`to=` on `band` was a fifth; `band` is not
this genre's word, so the row moved to
[block.md](../block.md) with the keyword.) `kind=` is retired **language-wide** (`CHART-BLOCK-NAMING`), not merely on
`node`, and so is `color=` (`COLOUR-KEY-STATUS`) — it named the FILL
in one era and the LABEL in another, and no engine can tell the
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
| `boundary` | `external` | `EXTERNAL-ENDPOINT-NAMING` | the ECB analysis pattern's «boundary» is an INTERNAL interface object (CORRECTED 0.3.z: this said "UML's"; the stereotype is not in UML 2.5.1 or ISO/IEC 19505-2 — see decisions/registry.md), C4's `System_Boundary` is the dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning — all three invert or displace the intended sense, which the spec's own prose already stated as "declares an external I/O endpoint" |
| `layer` · `layer=` | *(nothing — the destination is gone)* | `PLANE-KEYWORD-SPELLING`, then `PAINT-ORDER-CONSTRUCT` | `PLANE-KEYWORD-SPELLING` renamed both to `plane` · `plane=` at 0.1, holding that no standard claimed `plane` for a conflicting meaning. **In this genre that was false when it was written**: a plane is the control / data / management partition of a device. `PAINT-ORDER-CONSTRUCT` withdrew `plane` · `plane=` from the language, so the diagnostic now states the whole chain (`layer=` → `plane=` → withdrawn) instead of ending at a spelling that no longer exists — the `route` → `path` precedent from 0.1 |
| `plot` | `chart` | `CHART-BLOCK-NAMING` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | `CHART-BLOCK-NAMING` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace. Its one legal value was renamed `bars3d` → `bar3d` |

**Changed — the annotation family, and this genre no longer
carries it.** `guide` was renamed `threshold` and `band` gained its mandatory
label in that release, while both were still legal here. Neither is
`topology`'s word (`SCENE-KEYWORD-MEMBERSHIP`), so the rename and the label rule
are recorded where the keywords now live —
[block.md](../block.md) §2.6 and its declaration section. `chart level=` is
DELETED, not renamed (`CHART-LEVEL-KEY`), and that one still applies here: `chart` is a
region opener every scene genre may write.

### The drawn annotation: `note=` (`DRAWN-ANNOTATION-FORM`)

**`note=` is the annotation that draws.** Under `topology` it is accepted on
four directives — `node`, `group`, `edge` and `title` — and its value is
**quoted prose; the quotes are mandatory** (`QUOTING-RULES`):

```figdown
figdown 0.3 topology
title "Fig 5-1 — core ring" note="Measured at the 2026-06 peak"
node r1 "R1" note="the only ASBR in this ring"
node r2 "R2"
group site "Site A" note="one maintenance window"
edge r1 -- r2 note="dark fibre, 80 km"
bundle lag1 "LAG 1" r1--r2
```

**Attachment is by SYNTACTIC POSITION** — the note is written on the annotated
element's own line. No id, no target key, no locator, and so no ambiguity
about which of several identically labelled routers is meant, which is the
recurring hazard in a topology where six leaves are all labelled `Leaf`. An
`edge` carries no id at all: an attribute on the line is the only form that
could reach a link, and that is what `note=` is.

**It requires `figdown 0.3`.** Under `figdown 0.1` or `figdown 0.2` a `note=`
on any of the four is a line error naming the version — under those headers
the spelling is still the RETIRED one that meant a never-drawn `description=`
(`DESCRIPTION-KEY-SPELLING`). Raising the section header is the whole migration; no
existing `topology` document is rewritten and none becomes invalid.

**`note=` and `description=` divide by AUDIENCE, not by length.**
`description=` reaches the **machine** — no ink beyond an SVG `<title>`
tooltip — and no `topology` directive accepts it; it belongs to `bitfield`'s
`field` ([../bitfield.md](../bitfield.md)). `note=` reaches the **human**, and
it ALWAYS draws. Where an element takes both, writing both is legal and
meaningful, and **neither is a fallback for the other**.

**The author does not place the box (`DOMAIN-CONVENTION-DIRECTIVES`).** There is no `at=`, no `side=`,
and no `left of` / `right of` on `note=`. The engine picks adjacency around
the carrier's final geometry — the router's box, the site rect, the link's
segments — after every edge label and arrowhead is placed, and **reaches for a
leader line only when adjacency fails**. A `title … note=` has no geometry to
sit beside: it draws as a figure-level note at the bottom of the canvas and
never takes a leader. In a genre whose whole point is that the engine works
out where the links go, an annotation that demanded a hand-chosen side would
be the one construct fighting the layout.

**Where a typed slot exists, `note=` is never the right answer.** `topology`'s
slots are the ones its figures lean on hardest:

- a **set of parallel links that act as one** is a `bundle`, not a note saying
  "these two are a LAG" — the bundle names the member list and draws the ring;
- a **role or category** (spine, leaf, border) is a `class` meaning, which
  earns a legend entry and applies to every member at once;
- **which site or POD a router sits in** is `in=` or the enclosing `group`;
- an **overlay, a control plane, an underlay** is a `class` whose meaning says
  so — it earns a legend entry and every member carries it. This used to read
  "an overlay is `plane=`", and that sentence is the reason `plane` is gone:
  the key set a paint order and the reader heard a network-architectural
  claim, while the `class` beside it was already carrying the meaning
  (`PAINT-ORDER-CONSTRUCT`);
- an endpoint that is **outside the drawn network** is an `external`, which is
  why `external` takes no `note=`: the construct already says the one thing
  such a note would say.

A `note=` is for what none of those hold — the caveat, the measured number,
the operational sentence the topology cannot express as structure.

### Interface labels are drawn as PORT MARKERS (backlog 57)

An `edge`'s `[tail]` and `[head]` labels name the INTERFACES the link is
attached to, and in this genre the engine draws them by the network-diagram
convention: **inside the device box, at the point the link crosses its
border** — not as free-floating text near the line's end. That is not a
cosmetic choice. A port belongs to a DEVICE, the box is the device, and a name
written in the seam between two boxes leaves the reader to decide which one it
belongs to by eye.

This is a DRAWING rule and nothing else. The syntax is unchanged, the model is
unchanged (`tail` and `head` are the same two strings §2 has always carried),
and no option key asks for it or turns it off — `DOMAIN-CONVENTION-DIRECTIVES` keeps the drawing
convention with the engine. Two ports crossing the same border spread along
it. Where a device box is genuinely too small to hold the name, the marker
hugs the border from just outside, and only if that also fails does it fall
back to the ordinary label placement out along the line.

It applies to `topology` and to no other genre, because the convention is this
genre's: in `block` an `[tail]` label names a signal or a port on a functional
block and is read against the line, and the corpus's `block` figures place it
there deliberately.

### How this differs from the other genres

**Until 0.3 this section said "today the only difference is a
default", and the sentence above it said this genre shared `block`'s
vocabulary outright.** Neither is true now, and neither should have been
comfortable then: a genre whose only difference from another is a default has
not earned a genre token.

| | `block` | `topology` | `flowchart` | `statechart` |
|---|---|---|---|---|
| the thing | `node` | `node` — a DEVICE | `node` | `state` |
| the line | `edge` | `edge` — a LINK | `flowline` | `transition` |
| own subject vocabulary (`SUBJECT-VOCABULARY-SCOPE`) | `group` `external` `threshold` `band` | **`group` `external` `bundle`** | `external` — plus `process` `decision` `terminator` | none |
| `flow` default | `right` | **`right`** | `down` | `right` |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | NORMATIVE | **EXPERIMENTAL** | EXPERIMENTAL | EXPERIMENTAL (needs `figdown 0.2`) |

Every scene genre also accepts the host set `class` / `flow` / `rank` (NS = H
above) and may open a `bitfield`/`table`/`timing`/`chart` region (§4, `GENRE-COMPOSITION`).

**Where a cell of the subject row matches `block`'s, the two are still two
declarations.** `group` and `external` here carry warnings `block`'s cannot
need — the multicast group and the external route — and `bundle` here has a
referent `block` had no way to name. That is the whole of what `SUBJECT-VOCABULARY-SCOPE` bought:
sixteen cells were withdrawn across the four genres without a
single surviving cell changing.

The status row is a statement about convergence rather than about syntax:
`block` is the scene genre v0.1 freezes on. What has changed since `DOMAIN-VOCABULARY-PREFERENCE` §4 is
the *reason* this genre is held back — no longer "nothing but a default
separates it from `block`", but that its vocabulary question (below) is still
open, and `RESERVED-SPELLINGS` records a live proposal to re-source the whole of it from
RFC 8345 should promotion ever be argued.

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `topology` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a genre MAY
spell a keyword the same as `topology`'s with a different meaning; neither the
core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`) can ever be
redefined.

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
- A `bundle` names one LOGICAL LINK over its member links — a LAG, an ECMP
  set, an Ethernet Segment. Members are recorded in written order and resolve
  unordered per member. It asserts that the links are operated as one; it
  asserts nothing about how traffic is distributed across them.
- An `external` names something outside the figure's scope. It has no box and
  carries no presentation at all — it takes no option key —
  so its label is the whole of what it puts on the page, and even that is
  drawn beside the open end of an edge rather than as a shape.
- Geometry carries nothing. Adjacency in the rendered picture is not
  connectivity — only an `edge` is. Every member of the layout NAMESPACE is
  ignored by default, wherever in the document it appears
  (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE` — membership decides, not position), and that is only
  safe because the zone is a namespace
  of its own whose every member is genre-independent, so no genre semantics
  can ever appear inside it (`LAYOUT-ZONE-NAMESPACE`).

## Errors

`topology` adds no error conditions of its own. Its validation profile is
the core profile: unknown keyword, unknown or inapplicable option, unknown
`shape`, duplicate id (nodes, groups, externals and typed blocks share one
namespace), dangling edge endpoint, ambiguous or unknown `bundle` member, and
the single-valued-directive rules of §8 — all line errors. (`in=` cycle is
listed in core §8 as a reserved category and **no v0.1 document can reach
it**: `in=` is node-only and `group … in=` is itself a line error, so
containment is one level deep and no cycle is constructible — the same
correction `block` made.)

**One genre-scoped error is new (`SCENE-KEYWORD-MEMBERSHIP`).** `threshold`, `band`
or `plane` written in a `topology` document is a **NAMED** line error, not
`unrecognized line` and not a bare allowlist message, because the author has
written a construct that was legal here until this release. Each names its
own ground — the queue-depth reading for `threshold`, the frequency band for
`band`, the control/data partition for `plane` — and says where the construct
lives now, or that it lives nowhere:

```
"threshold" is not allowed in genre topology — it was WITHDRAWN from this
genre, not misspelled: `threshold` is now declared by `block` only. …
Subject vocabulary is per genre (core §3, `GENRE-VOCABULARY-OBLIGATION`): a spelling accepted by several
genres is several independent declarations, and this genre's was withdrawn
without touching any other's. (withdrawn, `SCENE-KEYWORD-MEMBERSHIP`; MIGRATIONS
0.3)
```

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
frozen surface *until* the ownership question is settled, rather than frozen
before it is. Open questions that would feed such a vocabulary are recorded
in the core doc §9 (`TAP-VERSUS-JUNCTION-SPELLING` edge taps and junctions; `MEANINGFUL-ARRANGEMENT` declared
arrangement). `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` settles the *permission* question — a genre may own its
words, and may even reuse another genre's spelling — so what remains open is
only whether `topology` has words worth owning.

**`SUBJECT-VOCABULARY-SCOPE` does not close that question either.** Declaring `group`, `external`
and `bundle` here says who owns those three spellings; it does not say that
any of them names this genre's domain. Two of them are `block`'s words spelled
again, kept because every networking synonym is more taken (above), which is a
defensive argument, not an earning one. Only `bundle` is earned.

### Reserved, not landed — `RESERVED-SPELLINGS`

Two reservations were recorded against this genre in the same release. Neither
is proposed and neither is scheduled; both are written down so that adopting
them later is a decision rather than a rediscovery, and each carries the
condition that would reopen it.

- **`network` — the reserved word for a LAYERING relation**, from RFC 8345
  §4.1/§6.1, should the need `plane` appeared to serve ever return. Today's
  demand is **one figure**, and that figure is already served by `class`.
  *Reopens if:* a second and third figure need to assert that one set of nodes
  is SUPPORTED BY another, and `class` is measured to be losing that claim.
- **`edge` → `link`, the implication of adopting RFC 8345 for this genre**
  (§4.1/§6.2). It is clean across the whole surface: 8345's
  `node` / `link` / `termination-point` maps systematically onto what
  `topology` already spells, and taking one word from that standard without
  the rest would be the mixing the single-source rule forbids. *Reopens if:*
  `topology` is proposed for promotion out of EXPERIMENTAL — at which point
  its vocabulary source must be settled before the spellings freeze, because
  a rename is free today and is not free afterwards.

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
