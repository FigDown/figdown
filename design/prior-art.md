# FigDown Prior Art & Convention Survey (informative)

> Status: **informative**, 2026-07-10. Method per R18: before FigDown
> adopts a convention, survey what mainstream text-to-diagram languages
> do, **weighted by adoption** — the primary motive is
> anti-hallucination (LLMs already know the mainstream spellings) and
> the secondary is human familiarity. Syntax claims below were verified
> against the official documentation of each language, not recalled
> from memory.
>
> 繁體中文版：[prior-art.zh-tw.md](prior-art.zh-tw.md)

Adoption weighting used throughout (approximate, by Markdown-ecosystem
penetration and install base): **Mermaid ≫ PlantUML > Graphviz/DOT >
D2 > DBML/WaveDrom (domain-specific)**.

## 1. Edge labels — the three-position model (feeds OQ-S7)

### 1.1 What the mainstream does

| Language | Mid label (on the line) | Endpoint labels (near source / target) |
|---|---|---|
| Mermaid flowchart | `A -->|text| B` **or** `A -- text --> B` (the operator splits around the label) | none |
| Mermaid ER | `: label` after the relation | cardinality baked into the operator as crow's-foot ASCII (`PROPERTY ||--|{ ROOM : contains`) |
| PlantUML | `A --> B : label` | **inline quoted strings at each end**: `Class1 "1" *-- "many" Class2 : contains` |
| Graphviz DOT | `label=` | `taillabel=` / `headlabel=` attributes (+ `labeldistance`/`labelangle` pixel tuning) |
| D2 | `A -> B: label` | `source-arrowhead.label` / `target-arrowhead.label` (kept short; no auto-placement optimization) |

### 1.2 Findings

1. **The three-position model is universal.** Every surveyed language
   converges on at most three meaningful label positions per edge:
   near the tail, on the line, near the head. Graphviz names them
   (`taillabel`/`label`/`headlabel`); PlantUML and D2 spell them;
   Mermaid flowchart covers only the middle. No language offers more
   than three positions.
2. **Inline placement has strong precedent.** PlantUML puts endpoint
   labels *inline, adjacent to the endpoint name* — the text order
   mirrors the picture. Mermaid's second mid-label form splits the
   operator around the label (`A -- text --> B`) — the label sits *on*
   the line in the text exactly as it does in the figure.
3. **Pixel-level placement tuning is the exception, not the rule.**
   Only Graphviz exposes `labeldistance`/`labelangle`; Mermaid,
   PlantUML and D2 offer none. This supports keeping OQ-S4 (px offset
   hints) rejected: mainstream treats *which position* as semantic and
   *where exactly* as the renderer's job.

### 1.3 Implication for FigDown (ADOPTED 2026-07-10 — landed as migration 0.1-dev.9)

The user's requirement (R34): both endpoints of a link often carry a
role/meaning, and a line has **at most three meaningful positions**.
Proposed spelling — labels appear inline at the position they occupy
in the figure (R22: text is a 1-D encoding of the figure):

```figdown
edge customer [1] -[places]-> [N] order
edge peer1 [initiator] <-[3-way handshake]-> [responder] peer2
edge a -[label only on the line]- b
```

- Bracketed labels are optional at each of the three positions.
- The operator splits into halves around the mid label: left half `-`
  or `<-`, right half `-` or `->`; the plain (label-free) operators
  remain `--` `->` `<-` `<->`. This mirrors Mermaid's
  `A -- text --> B` split-operator convention.
- Delimiter choice `[...]` over PlantUML's quotes and Mermaid's pipes:
  quotes already mean generic string tokens in FigDown's lexer, and
  `|` is the table-row line-start token — brackets are the one
  delimiter that is unambiguous in our closed grammar. (PlantUML
  demonstrates that *inline endpoint labels* are mainstream; the exact
  delimiter has no cross-language consensus to follow.)
- `label=` / `taillabel=` / `headlabel=` retired in the same version
  (R28: one mechanism), with a mechanical migration:
  `edge A -> B label="x" taillabel="t" headlabel="h"` →
  `edge A [t] -[x]-> [h] B`.
- `<-` joined the registry (R35; D2 precedent — its operator set is
  exactly `--` `->` `<-` `<->`). Writing `Left <- Right` must not
  force the author to reorder into `Right -> Left`.
- Bracket content (ruled 2026-07-10): balanced inner brackets nest
  verbatim (`[flags[3:0]]` works as-is); unbalanced brackets / `\n` /
  literal quotes use the quoted form `["..."]` with the standard
  string escapes — Mermaid's quote-inside-shape precedent
  (`id1["text with [brackets]"]`); an empty `[]` is a line error.

## 2. ERD conventions (feeds R36)

### 2.1 What the mainstream does

| Language | Entity + attributes | Keys | Relationship + cardinality |
|---|---|---|---|
| Mermaid ER | attribute block: `CUSTOMER { int id PK, string name, string email UK }` | `PK` `FK` `UK` tokens per attribute | crow's-foot operators: `\|o` zero-or-one, `\|\|` exactly-one, `}o` zero-or-more, `}\|` one-or-more; `--` identifying, `..` non-identifying; label after `:` |
| D2 | `shape: sql_table` with typed columns; `constraint: primary_key` | constraints | plain connections; arrowhead shapes include crow's-foot variants (`cf-one`, `cf-many`) |
| PlantUML | `entity` blocks (IE notation) | field markers | quoted cardinality at endpoints + `: label` |
| DBML | `Table users { id int [pk] }` | `[pk]` etc. | `Ref: orders.user_id > users.id` — FK reference **at column level** |

### 2.2 Findings

1. The common semantic core is small: an entity = a titled record of
   typed attributes with key annotations; a relationship = a link with
   a cardinality at each end and a verb label.
2. Cardinality is expressed two ways: **baked into the operator** as
   crow's-foot ASCII (Mermaid ER) or **as endpoint labels**
   (PlantUML). The crow's-foot operators are compact but are exactly
   the kind of ASCII-art vocabulary FigDown avoids (a closed set of 8+
   two-character glyphs to teach; low readability for non-DB readers).
   Endpoint labels carry the same meaning with zero new vocabulary.
3. Only DBML makes the FK **column-to-column** reference machine-
   readable. Mermaid ER's `FK` token is a per-attribute annotation;
   which relationship it participates in stays implicit.

### 2.3 Recommendation (two levels, per user direction R36)

- **Level 1 — now, blocks-first**: an ERD is expressible today with
  core constructs: one `node` per entity (label line 1 = name,
  following lines = attributes, `PK`/`FK` as plain text), one `edge`
  per relationship, cardinality via endpoint labels (§1.3 once it
  lands; `taillabel=`/`headlabel=` today). Ships as a pattern in the
  gallery; **no new vocabulary**.
- **Level 2 — v0.2 candidate, R28-gated**: a semantic `entity`
  typed block (Mermaid-ER-shaped: typed attributes + PK/FK/UK
  annotations) would make attributes and key roles machine-readable.
  Gate: corpus evidence (ERD was not a census bucket) AND the
  demonstration that Level 1 genuinely loses meaning an agent needs.
  If adopted, follow Mermaid erDiagram's attribute grammar (most
  adopted); express cardinality as endpoint labels, not crow's-foot
  operators.

## 3. Relationship to D2 (OQ1 — informative appendix per OQ-S6)

**What D2 is.** A modern open-source diagram language by Terrastruct
(MPL-2.0), same category as Mermaid but with a more designed language
(nesting, style system, multiple layout engines). Its flagship layout
engine, TALA, is **proprietary** (closed-source, free tier only);
the open engines are dagre/ELK.

**What OQ1 actually asks.** "Build on D2" can mean three different
things, and they have different answers:

- **(a) D2 as the base language** — FigDown documents would be valid
  D2 (or a superset/profile). **Recommend closing this option.**
  Reasons: D2 has near-zero Markdown read-side penetration (no native
  GitHub/GitLab rendering — verified 2026-07-02), so there is no
  ecosystem to inherit; D2's grammar is open (unknown syntax is not a
  line error), incompatible with our closed-grammar axiom; and D2
  makes no layout-stability promise (R8) — its dagre/ELK global
  re-layout is precisely the behaviour FigDown exists to avoid.
- **(b) Borrow language design** — already doing it (the `-- -> <- <->`
  operator family in §1.3 matches D2's exactly; `key=value` options;
  the survey habit itself).
- **(c) D2 as a renderer backend / interop target** — a
  `figdown → d2` exporter would let users tap D2's polish for
  one-off exports (accepting that D2 output is not stability-
  guaranteed). This is the only live sub-question, and it is not
  v0.1 material.

**Recommendation**: close OQ1 as "not a base language" and re-file the
remainder as a v0.2 exporter/interop question.

**Ruling (2026-07-10)**: adopted — OQ1 closed as recommended.

## 4. Legend mechanisms (feeds OQ-S8)

### 4.1 What the mainstream does

| Language | Legend | Machine-readable binding? |
|---|---|---|
| PlantUML | native `legend [left\|right\|top\|bottom\|center] … endlegend` | no — a free-text box; nothing links entries to elements |
| D2 | `vars.d2-legend`: declare sample shapes/connections with labels and styles; the legend renders those samples | no — entries are styled *dummies*; real elements are not linked to them |
| Mermaid | **none** (long-standing feature request; users hack legends from dummy subgraphs) | `classDef name fill:…` + `class n1,n2 name` / `:::` binds a **named style class** to elements — but no meaning text, no legend |
| Graphviz | none (workaround: HTML-like label tables / cluster of samples) | no |

### 4.2 Findings

1. Every ecosystem needs legends (PlantUML and D2 shipped one; Mermaid
   users keep asking), yet **no surveyed language binds a *meaning* to
   a *class of elements* machine-readably** — PlantUML's is free text,
   D2's entries are styled dummies detached from the real elements.
2. Mermaid's `classDef`/`class` is the adoption-weighted prior art for
   the *naming* half: a named class attached to elements, styles
   declared once. It lacks the meaning label and the derived legend.
3. FigDown's §5 rule ("color MUST NOT be the sole carrier of meaning")
   currently has no in-language mechanism — authors must repeat the
   meaning in prose or per-edge labels. That is the actual gap the
   downstream feedback hit (three flow colors on one figure).

### 4.3 Candidate design (PROPOSAL — pending corpus frequency + ruling)

Bind meaning and style to a **named class**, and derive the legend —
the semantics-first shape (R24: name the meaning, the engine owns the
drawing convention):

```figdown
class vidp "VID_P (primary VLAN)"   color=#dc2626
class vidc "VID_C (community VLAN)" color=#2563eb
edge p1 -> p2 class=vidp
edge p2 -> p3 class=vidc
```

- One `class` line = meaning text + presentation defaults, declared
  once (Mermaid `classDef` heritage; the HTML+CSS analogy of R5 made
  literal). `class=` on any element applies it.
- The legend strip is **derived** — drawn automatically when classes
  exist, like `bundle`'s ring; no coordinates, no dummy elements.
- R37 payoff: an agent reads `class=vidp` on the edge itself — no
  correlating raw hex colors against a side table.
- The presentation-ignorable invariant (§5) refines naturally:
  stripping `color=`/`style=` from a `class` line loses nothing
  semantic; the class *name and meaning* stay.
- v0.1 workaround, sanctioned today: a small `table` with per-cell
  color marks serves as a legend (two lines per entry; clunky but
  complete).
- Before the R28 gate: a corpus pass counting legend incidence
  (legends were not a census dimension), and the ruling on whether
  `class` subsumes per-element `color=` in practice.
