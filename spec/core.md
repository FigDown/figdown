# FigDown Core Syntax — v0.1

> Status: **v0.1 core framework** (`GENRE-DOCUMENT-CONTRACT`). Working text, 2026-08-05.
> Renamed from `spec/core.md` in the **spec split**: this file is the
> **cross-genre** contract (skeleton, core keywords, layout zone, composition
> rules, presentation, errors, registry, ABNF, semantic model, stability
> policy). Per-genre vocabulary lives only under
> [genres/](genres/README.md) — core + one genre doc suffice to author and
> read that genre.
>
> **This file is FROZEN material, and it defines nothing experimental
>.** The four EXPERIMENTAL constructs — `plane`, `bundle`,
> `threshold`, `band` — are DEFINED in
> [experimental.md](experimental.md), and the three EXPERIMENTAL genres in
> [genres/experimental/](genres/experimental/). This file still **names**
> them, in §10's registry and in marked cross-references, because a closed
> language has to say what exists; it does not depend on them. (There were
> six until this release, when `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW `path` and `routing`** — and
> their option keys `points=`, `tailport=`, `headport=`, `routing=` — from
> the language outright. Both were EXPERIMENTAL and outside the freeze
> scope, so no compatibility promise is broken; the need they served is on
> file as §9 **`EDGE-IDENTITY-AND-GEOMETRY`**.) Delete the
> experimental file set and what remains here is complete — the criterion
> `tools/isolation-check.js --strict` tests on every run.
>
> **Adopting FigDown? Read [§13 Stability and versioning](#13-stability-and-versioning-normative)
> first.** It is the shortest section and the one an adopter most needs:
> what a document you write today is promised, what it is not, and what is
> committed to instead. In particular, **0.x is a preview and is NOT
> stable**, and **"frozen" does not mean "stable"** (§13.2).
>
> Derived from requirements-notes.md
> (`IMAGE-LOCKED-KNOWLEDGE`–`ELEMENT-GEOMETRY-DIRECTIVE`, `RENDERING-DETERMINISM`–`RELEASE-FREEZE-CRITERIA`; the maintainer-ruling item codes cited here — `EDGE-WRITTEN-FORM`,
> `MARKER-TARGET-KINDS`–`EMPTY-LABEL-STATE` — are defined in that file's
> A-code registry).
> Type priorities follow the figure-type census —
> census.md.
>
>
> **Section numbers §0–§13 are stable.** Genre-specific prose that used to
> live in §2 / §4.x is now a pointer (or a short composition rule). Do not
> renumber when moving content — update the pointer target instead.

## 0. Design constraints this syntax must satisfy

From the requirements log, the syntax is boxed in by:

1. **Closed, line-oriented grammar** — every non-blank, non-comment
   line begins with a registered line-start token (a keyword, or `|`
   for table rows); unknown lines are errors carrying a 1-based line number
   (powers the AI write→validate→fix loop). (`CLOSED-GRAMMAR`)

   **Which message.** A conforming implementation MUST reject
   the line, and the diagnostic depends on what is known at that point:
   under a DECLARED, valid genre the message names the genre — `"zzz" is
   not allowed in genre block` — because the genre allowlist is the
   narrower closed set and naming it tells the author where to look; with
   no valid genre in force (a missing or unknown genre token) the message
   is `unrecognized line`. Earlier revisions of this section promised the
   second message unconditionally, which no implementation can deliver:
   the allowlist necessarily fires first.
2. **Mechanically renderable** — a plain program (no LLM) converts text
   to SVG, deterministically. (`RENDERING-DETERMINISM`)
3. **Rigid/flexible attribute model** — every attribute either carries an
   explicit value (rigid constraint, renderer must honor) or is absent
   (renderer adapts, spillover minimized). (`LAYOUT-STABILITY`, `UNDECLARED-ATTRIBUTE-BEHAVIOUR`)
4. **Defaults = the statistically common case** — most figures should
   need no supplementary declarations. (`DEFAULT-VALUE-SELECTION`)
5. **Token-lean teachability** — the core must fit in a ~100-line
   authoring prompt. Borrow syntax conventions AI already knows
   (Mermaid, D2, DOT, WaveDrom) wherever possible. (`AGENT-TEACHING-COST`, `DESIGN-DECISION-METHOD`)
6. **Static first** — dynamic (page/step sequences) reserves keywords but
   is out of scope for v0. (`STATIC-DYNAMIC-PRIORITY`, `DYNAMIC-FIGURE-PURPOSE`)

## 1. Document skeleton

A FigDown document is a UTF-8 text, one directive per line.

**What ends a line, and what may precede the first one.** A
line ends at **LF (`%x0A`) or CRLF (`%x0D %x0A`)**; both are accepted and a
document written either way yields the **same model**. A **bare CR** is
**not** a line terminator — a CR-only file is one line, and the reference
engine reports a line error on it rather than parsing it. The §11 ABNF
declared `CR` as a third form until this release; no implementation ever
provided it and no fixture pinned it, so the grammar was corrected to the
two forms that work. A **U+FEFF byte order mark at the very start of the
document is IGNORED** — it is stripped before the first-significant-line
rule below is applied, so a BOM'd file has the same header, the same line
numbers and the same model as the same file without one. This is stated
because a BOM is invisible: an editor can add one, and a second
implementation that did not strip it would reject documents this one
accepts. Nothing else about U+FEFF is normative; the reference engine is
wider here, and the lenience is recorded in
[conformance/DISCREPANCIES.md](../conformance/DISCREPANCIES.md).

<!-- fence-check: skip -->
```figdown
# comments and blank lines MAY precede the header
figdown 0.1 block               # version header + GENRE, REQUIRED first
                                # SIGNIFICANT line; the genre is REQUIRED
title "L3 Forwarding Datapath"  # optional
...directives...
```

**The header is the first significant line.** Comment lines
and blank lines MAY precede it; the `figdown` line MUST be the first line
that is neither. A provenance block above the header — source document,
image hash, reconstruction method — is common in production corpora and
is legal. Every line after the header is a directive, a table row, a
comment, or blank.

**The spec provenance line (`SPEC-PROVENANCE-LINE`) — a CONVENTION, not a
directive.** A `.fd` file travels away from the repository that produced
it: into a wiki, a ticket, a pasted chat message. It arrives beside a
reader who may never have heard of this format and has nothing telling
them what it is or where it is defined. Published FigDown documents
SHOULD therefore open with one comment line, above the header:

```figdown
# FigDown — figures as text. Spec: https://github.com/FigDown/figdown
figdown 0.1 block
```

It is a **pointer to the standard, which is provenance** — the same kind
of thing as the source document and image hash above, and legal for the
same reason. It is **not** language surface: the parser does not read it,
it carries no meaning to the renderer, and **its absence is not an
error**. Nothing enforces it but a repository's own tooling, which reads
files and can check a comment exactly as well as it could check a
keyword; this repository's `tools/comment-check.js` checks its presence,
wording and position over `examples/` and `figures/`. Test fixtures are
deliberately outside that scope: a fixture's job is to be a minimal
input, and inserting a line shifts the line numbers its expected
diagnostics name.

**The genre token is REQUIRED (`HEADER-GENRE-REQUIREMENT`).** The header names the
document's genre: `block` | `topology` | `flowchart` | `bitfield` |
`table` | `timing`. A header with no genre is a line error. `bitfield`,
`table` and `timing` documents also declare their kind in their content
(they contain the typed block), but `block`, `topology` and `flowchart`
share the SAME vocabulary — `node`, `edge`, `group` — and differ only in
default flow, so the header is the only place such a document states
which kind of figure it is. Omitting it destroys that distinction with
no recoverable fallback.

**The genre is a namespace (`GENRE-NAMESPACE`).** The genre names three things: the
document's **keyword namespace**, its **defaults**, and its **validation
profile**.

- **`GENRE-NAMESPACE`.** The header genre determines the keyword namespace of
  the document's TOP-LEVEL lines, **except for the layout zone, which is a
  namespace of its own (`LAYOUT-ZONE-NAMESPACE`)**. The carve-out is stated here because it would
  otherwise be missed: layout-zone lines ARE top-level lines, so without it
  `GENRE-NAMESPACE` would hand the genre a zone that `LAYOUT-ZONE-NAMESPACE` says no genre owns.
- **`GENRE-VOCABULARY-OBLIGATION`.** A genre MAY define keywords of its own,
  and MAY reuse a spelling with a different meaning and different defaults
  from another genre's. In exchange it MUST document its complete
  vocabulary — every keyword, option key, enum value and default — in its
  own document under [genres/](genres/README.md), which is normative for
  that genre.
- **`GENRE-COMPOSITION`.** A document may COMPOSE genres. A nested genre
  region (in v0.1: a `bitfield`, `table` or `timing` block) is governed by
  THAT genre's namespace; its child keywords belong to it and are NOT valid
  at the document's top level. Composition is not inheritance: the header
  genre does not acquire the nested genre's vocabulary. See §4.
- **`PER-GENRE-DEFAULTS`.** A genre's defaults need no justification
  beyond that genre's own census statistics (`DEFAULT-VALUE-SELECTION` read per bucket).
- **`UNIVERSAL-CORE-KEYWORDS`.** A small core is fixed: **`figdown`,
  `title`, `layout`** — three keywords (`LAYOUT-ZONE-NAMESPACE`; it was five
  until then, and the two that left, `pin` and `size`, did not leave the
  language: `size` merged into `pin` under `ELEMENT-GEOMETRY-DIRECTIVE` and `pin` moved to the
  layout namespace of `LAYOUT-ZONE-NAMESPACE` below. `path` and `routing` were members until this release, were demoted to EXPERIMENTAL then, and were WITHDRAWN from
  the language, `EDGE-GEOMETRY-CONSTRUCTS` — §10).
  **What core means.** *Wherever a core keyword appears, its meaning is
  fixed, and no genre may redefine it.* Core is a **fixity** guarantee.
  It is **NOT** a ubiquity requirement: core does **not** mean "must
  appear in every genre", and a genre is complete without any of them
  beyond `figdown`. `bitfield` and `table` documents have no `pin` and
  no `layout` zone at all, and that is not a deficiency —
  reading the earlier wording as ubiquity made `UNIVERSAL-CORE-KEYWORDS` contradict the
  per-genre minimum sets in [genres/](genres/README.md).
  These three are not the figure's vocabulary; they are the document's
  **structure**, and they are what a reader can resolve before the genre
  is known. `figdown` must be readable before the genre is known, or
  nothing can be dispatched; `title` names the document; and `layout` is
  the zone **opener** — a structural marker, not a directive inside the
  zone, which is why it stays here rather than moving to `LAYOUT-ZONE-NAMESPACE` with the
  zone's own members. The two-zone reading contract (§3) only
  holds across genres if `layout` itself means the same thing everywhere.
- **`LAYOUT-ZONE-NAMESPACE` — the layout zone is a namespace of its own**.
  The zone opened by `layout` (§3) constitutes its own namespace, and
  **every member of it is genre-independent**: no genre may define,
  redefine or extend a keyword inside it. `GENRE-VOCABULARY-OBLIGATION` does not reach into the
  zone. **(`EDGE-GEOMETRY-CONSTRUCTS`) its membership is `pin` (NORMATIVE) and
  nothing else**; `path` and `routing` were members until then and are
  WITHDRAWN from the language (§10). **The clause does not change — only
  its membership does**, and it still governs every keyword any future
  release puts inside the zone.
  **Status and belonging are orthogonal, and conflating them is what this
  clause exists to stop.** EXPERIMENTAL is a statement about
  **stability** — the construct has not converged and may change or be
  withdrawn before v1 (§10). Genre-independence is a statement about
  **belonging** — no genre owns the spelling or may give it a second
  meaning. A construct can be both, and `path` and `routing` were: while
  they lived they were EXPERIMENTAL *and* genre-independent. Until this release §10 read their demotion as also releasing them to `GENRE-VOCABULARY-OBLIGATION`, which
  is the confusion this clause removed; the distinction stands on its own
  and applies to the next experimental member the zone acquires.
  **Why the zone needs this and not merely a fixed `layout`.** `GENRE-NAMESPACE`'s
  default is that a reading agent ignores the layout zone ENTIRELY (§3).
  That default holds only if no genre semantics can ever appear there —
  and the skip is driven by the `layout` marker, never by inspecting what
  the zone contains, so an agent has no way to notice if some genre put
  meaning inside it. While `path`/`routing` were genre-redefinable, the
  premise had a crack; `LAYOUT-ZONE-NAMESPACE` closes it by fixing the zone's **membership**,
  not just its opener.
  A genre that needs its own edge geometry does not get it by taking a
  layout-zone spelling for itself: it must clear the `NEW-CONSTRUCT-EVIDENCE-GATE` gate for a NEW
  keyword in this namespace, and that keyword is then genre-independent
  too.
  **The price, stated as a price.** Genre-independence means the zone's
  spellings are **reserved language-wide**: after `EDGE-GEOMETRY-CONSTRUCTS` exactly one
  keyword, `pin`, is spent, and no genre may ever define it as its own
  keyword, for any meaning, however natural that meaning is in its
  domain. That is what buys `GENRE-NAMESPACE`'s clean premise, and it is a real cost
  rather than a free tightening — it consumes future flexibility, and a
  later reader who finds the reservation surprising should find the
  reasoning here rather than have to reconstruct it. The standing
  principle it follows from is SYNTAX-STYLE RULE 4.7: *absent necessity,
  do not spend the same spelling in more than one namespace.* The bill
  this clause ran up was larger until this release: it also spent `path`
  and `routing` — two ordinary, general-purpose words that many future
  genres could want — and that exposure was filed as **`EDGE-GEOMETRY-CONSTRUCTS`** (§9).
  `EDGE-GEOMETRY-CONSTRUCTS` **CLOSES `EDGE-GEOMETRY-CONSTRUCTS` by releasing both spellings**: they are no longer
  members of any namespace, so a future genre may claim either under
  `GENRE-VOCABULARY-OBLIGATION`/`NEW-CONSTRUCT-EVIDENCE-GATE`. `pin` is the mild case that remains.
- **`DECLARATION-ORDER-SEMANTICS` — declaration order is drawing order along the genre's primary
  axis**. Where a genre has a primary axis, the order in which
  its elements are DECLARED is the order in which they are DRAWN along
  that axis. Its three v0.1 instances:

  | Genre | Primary axis | Declaration order draws… |
  |---|---|---|
  | `table` | columns, then rows | `width auto,70,…` and each `\|` row run left to right; rows run top to bottom |
  | `timing` | signal rows | each `signal` is the next lane down, in document order |
  | `bitfield` | the bits of a word | each `field` is the next cell to the RIGHT, wrapping to the next word |

  A genre MUST NOT reverse the drawing on the strength of an option.
  `bitfield`'s `numbering=` is the case that made the rule explicit
  (`DECLARATION-ORDER-SEMANTICS`): it relabels the ruler and moves nothing, so `numbering=lsb0`
  still draws the first-declared field leftmost — it is simply the field
  with the HIGHEST bit number there
  ([genres/bitfield.md](genres/bitfield.md) semantic model). `DECLARATION-ORDER-SEMANTICS` is a
  statement about DRAWING, and it is not a licence to read arrangement as
  precedence: §12.7 still forbids reading array order as ranking, priority
  or sequence. What `DECLARATION-ORDER-SEMANTICS` guarantees is only that the human's reading order
  and the agent's declaration order are the same order, which is what lets
  one document answer both readers identically.

What a genre still MUST NOT do: silently reinterpret ANOTHER genre's
document. The header names exactly one genre, and a document is read under
that genre's namespace and no other (the surviving half of `FIGURE-TYPE-MECHANISM`/`GENRE-NAMESPACE`). Within
one namespace a genre never restricts explicit syntax either — the three
scene genres share one namespace today, so directed, coloured edges work
under `topology` exactly as under `block` (field feedback: a downstream
transcription lost direction semantics because an earlier draft of this
paragraph implied otherwise). A new genre requires corpus evidence AND
semantic impossibility (`NEW-CONSTRUCT-EVIDENCE-GATE`).

**What v0.1 actually delivers (updated 0.1; 0.1).** `GENRE-NAMESPACE` is
**enforced**
at the top level (`GENRE-KEYWORD-ALLOWLIST`): each header genre has an allowlist of legal
top-level keywords. `UNIVERSAL-CORE-KEYWORDS` core (`figdown` `title` `layout`) and the layout
namespace's normative member `pin` (`LAYOUT-ZONE-NAMESPACE`) are in every allowlist. The pure
genres `bitfield` / `table` / `timing` reject
scene keywords (`node`, `edge`, …). The scene genres `block` /
`topology` / `flowchart` share the scene vocabulary, may open nested
`bitfield`/`table`/`timing` regions (`GENRE-COMPOSITION`), and still accept the experimental
scene keywords (`threshold` `band` `bundle` `plane`)
without promoting them to the taught main standard. The layout namespace
has no experimental members (`EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and
`routing`); while it had, their presence on the scene allowlists only was a
**status** fact and not a namespace one, because `LAYOUT-ZONE-NAMESPACE` fixes what a
layout-zone keyword MEANS wherever it is legal and says nothing about which
genres admit it — the same fixity-not-ubiquity distinction `UNIVERSAL-CORE-KEYWORDS` draws. **
`flowchart` exercises `GENRE-VOCABULARY-OBLIGATION`** — it owns `process`, `decision` and
`terminator`, legal under that genre and no other (`FLOWCHART-ROLE-KEYWORDS`,
[genres/experimental/flowchart.md](genres/experimental/flowchart.md) §Roles). It is `GENRE-VOCABULARY-OBLIGATION`'s
"a genre MAY define keywords of its own" half; no v0.1 genre yet uses the
other half (the same spelling with a different meaning). Defaults still
differ only for `flowchart`→`flow down` and `bitfield`'s required
`numbering=`.

**Multi-section files (`MULTI-FIGURE-DOCUMENTS`).** A single `.fd` MAY contain more
than one `figdown 0.1 <genre>` line. Each starts a **section** with its
own genre allowlist and id space. Rendering still produces **one SVG per
file**: sections are drawn independently and stacked top-to-bottom. There
are no cross-section edges and no multi-SVG output. Hybrid “panels” in
one artifact use either (1) multiple sections, or (2) a `block` host with
nested typed regions. Putting `node` under `figdown 0.1 bitfield` is a
line error — not a hybrid pattern.

**Version compatibility.** The header carries the wire-grammar version
and the genre. An unknown major version MUST be rejected. The
minor-version leniency is scoped by conformance mode (§10): a
viewer-tier (lenient-mode) implementation SHOULD parse an unknown minor
version in lenient mode; a strict authoring-tier implementation MAY
reject an unknown minor version outright (the reference engine does).
An unknown genre MUST be rejected in strict mode.

Lexical rules:

- Directive = `keyword positional-args… key=value-options…`
- **Quoting is decided by the POSITION's value type, and the four answers
  are exhaustive** (SYNTAX-STYLE §2; enforced in full, `RULE-POSITION-ENUMERATION`):
  - a **string** delimited by whitespace — every positional label, the
    `class` meaning, the classic `field` name, `description=`, `present=` —
    takes **MANDATORY** quotes. Whitespace is also the positional separator,
    so a bare token cannot express a phrase;
  - an **id** or a **reference** — every declaration id, every endpoint,
    `in=`, `plane=`, `class=` and `rank`/`bundle` members — is **BARE**. A
    quoted token there is a line error;
  - an **enum value** or a **bare keyword flag** — `shape=` `style=`
    `numbering=` `extend=` `type=`, the `figdown` version and genre, the
    `flow` direction, `cell … highlight` — is **BARE**, for the same reason:
    the position accepts a closed set of spellings, and quoting one suggests
    it accepts arbitrary text;
  - a **number**, a **point**, a **percentage** or a **range** — `gap=`,
    `z-index=`, `word=`, `at=`, `pin width=`/`height=`, a `cell` address, a
    `field` width, a table `width` element, `index=` — tolerates redundant
    quotes: they are **INERT** and change nothing in the model. `index=`'s
    inertness is load-bearing (§12.7). Two word-shaped spellings sit inside
    otherwise-numeric grammars and are inert with them: table `width auto`
    and `field … *` (SYNTAX-STYLE §8.6).
- IDs are `[A-Za-z_][A-Za-z0-9_-]*`, unique **per section** — which in a
  single-section file (the overwhelming majority) is the same thing as per
  document. **Resolved**: this clause read "unique per
  document" while the multi-section paragraph above said each section has
  "its own id space", and no fixture decided between them. The **section**
  reading wins, on three grounds: sections are drawn independently with no
  cross-section edges, so a shared namespace would constrain documents that
  can never refer to each other; the alternative makes a legal one-section
  figure illegal merely by being pasted below another; and it is what the
  reference engine already did. `node a` in section 1 and `node a` in
  section 2 are **two different elements**, and neither is a `duplicate id`.
  Pinned by `020-multi-section-id-reuse`. Read the
  pattern as a whole-token anchor: the **first** character is a letter or
  `_`; **every** later character is a letter, a digit, `_` or `-`, with no
  further restriction. In particular **a trailing `-` or `_` is legal** —
  `node mux_ "MUX"` parses. (Stated explicitly because a downstream
  author's comment records renaming `mux_` in the belief that it was not.)
  There is exactly one additional restriction: **`--` may
  not appear inside an id**, because `--` is the link operator (`edge a --
  b`, `bundle t1 a--b`) and one spelling cannot be both (`LINK-OPERATOR-IN-IDS`). Write a
  single `-` or a `_` instead.
- Colors are CSS hex (`#rgb` or `#rrggbb`, e.g. `#0d9488`) or CSS named
  colors (the 147 CSS/SVG color keywords, lowercase, plus
  `transparent`); any other value is a line error.
- `#` begins a comment only at the start of a line or after whitespace
  (so `fill=#0d9488` is never mistaken for a comment).
- Escapes inside quoted strings: `\n` line break, `\"` literal quote,
  `\\` literal backslash. Any other escape is a line error. Quotes also
  work inside option values: `description="on miss"`. (Pipe rows additionally
  use `\|` and `\^^`, §4.2.)
- `title` takes exactly **one quoted string**: `title "TCP Header"`. It
  is an ordinary quoted token — the escapes above apply, a `#` inside it
  is literal, and a second positional argument is `unexpected argument`
  like everywhere else. `title TCP Header` is a line error naming <!-- fence-check: skip -->
  migration 0.1. Until that entry `title` consumed the rest of
  its line, which made it the only directive accepting an unquoted string
  with spaces and made three things impossible or ambiguous: a title
  containing `#`, a title containing `"`, and one meaning for `\n`
  (escapes resolved in the quoted form only).
- Keywords, option keys, enum values, IDs and references are
  **case-sensitive**; all standard keywords and option keys are
  lowercase ASCII.
- A directive line containing positional arguments its grammar does not
  accept MUST be rejected (typos never pass silently).
- **`;` is RESERVED for a future statement separator (`SEMICOLON-STATUS`) and
  MUST NOT be given any other meaning.** A `;` anywhere a processor is
  reading grammar is a line error naming the reservation. It stays ordinary
  text inside the four VERBATIM REGIONS — a quoted string, an `[edge label]`,
  a comment, and a GFM pipe row — and nowhere else. *(This clause read
  "`;` has no directive-separating meaning" in an earlier release: a description of what the mark did NOT do, in the release that
  had already made doing it an error. It was the one assigned mark whose rule
  is "MUST NOT be given any other meaning" and which this document never
  stated.)*
- **`#` starts a comment**, at line start or after whitespace, and it is
  honoured in the same four verbatim regions as `;` — a `#` inside a quoted
  string, an `[edge label]`, a comment or a GFM pipe row is ordinary text.
  *(The `[edge label]` half landed, `VERBATIM-REGION-SCOPE`; before it,
  `edge a -[hop #1]-> b` was `unterminated [label]`.)* A `#` that is neither
  at line start nor after whitespace is ordinary text too, which is what
  keeps `fill=#0d9488` a colour.
- The SHA-256 embedded in artifacts is computed over the exact UTF-8
  byte sequence of the source; processors MUST NOT normalize before
  hashing.
- One directive per line. No line continuations. No expressions, loops,
  or macros — ever. (framework axiom)

## 2. Core scene model (covers block-architecture, topology, flowchart)

> **Spec split (`GENRE-DOCUMENT-CONTRACT`).** The scene model — boxes, containment, and
> connections — is **normative in the genre documents**, not restated at
> length here. `block`, `topology` and `flowchart` share one scene
> namespace and differ only in defaults and status (`CONSTRUCT-STATUS-TIERS`): `block` is
> NORMATIVE; `topology` and `flowchart` are EXPERIMENTAL.
>
> **Authoring contract:** [core](core.md) (this document) **+** one genre
> doc suffice. For scene figures start with
> [genres/block.md](genres/block.md).

| Topic | Normative home |
|---|---|
| Complete scene vocabulary (`node` `group` `edge` `class` `external` `flow` `rank` …) | [genres/block.md](genres/block.md) |
| Topology-only / experimental `bundle` | [genres/experimental/topology.md](genres/experimental/topology.md) |
| Flowchart defaults (`flow down`) | [genres/experimental/flowchart.md](genres/experimental/flowchart.md) |
| Composition with typed regions (`GENRE-COMPOSITION`) | §4 below |
| Layout zone (`layout` opener; `pin` — its whole membership since 0.1) | §3 below |

Subsection numbers **§2.1–§2.8 are retained** so existing citations keep
working; each is a pointer only.

### 2.1 Nodes

Normative: [genres/block.md](genres/block.md) (vocabulary + semantic model).
Shapes are purely geometric (`SHAPE-ENUM-VOCABULARY`); the enum is closed and has **six**
values — `box` `rounded` `circle` `ellipse` `diamond` `cylinder` —
listed with its default in each scene genre's option table. `cloud` was
removed (`SHAPE-ENUM-VOCABULARY`): it named a domain, not a geometry, and a
retired value produces a named diagnostic (§10). Labels optional /
absent / empty `""` are three distinct states (`OMITTED-LABEL-RECORDING`, `EMPTY-LABEL-STATE`) — see also §12.

Under genre `flowchart` a node MAY also be declared with a **role
keyword** — `process`, `decision`, `terminator` — which records a `role`
in the model and DERIVES the shape from it (`FLOWCHART-ROLE-KEYWORDS`). The role is
the meaning; the shape remains geometry, and a `shape=` written on a role
line overrides the drawing and never the role (§12.7). A bare `node` under
`flowchart` states no role, and that absence is meaning. Normative:
[genres/experimental/flowchart.md](genres/experimental/flowchart.md) §Roles.

### 2.2 Containment (groups / nesting)

Normative: [genres/block.md](genres/block.md). A `group` line declares the
container; membership is written on the MEMBER — `node <id> … in=<group>`.
`group … in=` is a **line error** (`group does not take in= — nesting is
one level (node in=group) in v0.1`): one level is the whole of v0.1's
containment, so there is nothing for a group to be `in=`. `gap=` packs
spacing (`gap=0` flush).

### 2.3 Edges

Normative: [genres/block.md](genres/block.md). Operators `->` `<-` `--`
`<->` — **four**, and `--` is the most used of them; edge labels and
options. (Earlier revisions of this line listed three and omitted `--`.)

### 2.4 Planes (`PRESENTATION-CONTROL-TIERS`) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** Definition: [experimental.md](experimental.md) §E1.
Registry row: §10 (b), (b′). `plane` and `plane=` were spelled
`layer`/`layer=` until this release (`PLANE-KEYWORD-SPELLING`, §10). What is NOT experimental and
stays here: the implicit `base` plane and the `planes` array (§12.2, §12.4)
— every document has `planes[0] = {id:"base", z:0}` and every `node` and
`edge` reports `plane: "base"`, so a normative-surface reader needs no new
case.

### 2.5 Semantic annotations: `bundle` (topology vocabulary) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`), with the `topology` genre.** Definition:
[experimental.md](experimental.md) §E2. Genre document:
[genres/experimental/topology.md](genres/experimental/topology.md), itself
EXPERIMENTAL. Registry row: §10 (b), (b′).

### 2.6 Thresholds and zone bands: `threshold`, `band` (generic markers) — EXPERIMENTAL / EXPERIMENTAL

**EXPERIMENTAL scene markers (`CONSTRUCT-STATUS-TIERS`).** Definition:
[experimental.md](experimental.md) §E3, which also records why they stay
experimental (they are the `GENRE-EARNING-THRESHOLD` *interim general constructs* for the
candidate genre in §9). Listed on scene-genre allowlists; registry row:
§10 (b). Not part of the taught main-standard path.

`threshold` was spelled `guide` in an earlier release (`THRESHOLD-KEYWORD-SPELLING`, §10).
`band` gained a MANDATORY quoted label (`BAND-LABEL-STATUS`).

### 2.7 Semantic classes: `class` (+ derived legend)

Normative: [genres/block.md](genres/block.md) and §5 / §12. Meaning rides
on the class label (`MEANING-RECOVERY-SOURCE`), not on colour alone.

**A class must declare a channel the member it joins actually has
(`CLASS-PAINT-REQUIREMENT`).** A class is a bundle of channel defaults for
HETEROGENEOUS members, so the rule is per CHANNEL, not per class: one
class carries one meaning for a node and an edge alike (`class hot "…"
fill=#fee2e2 stroke=#dc2626` paints the box of one and the line of the
other), and no class has to be split. An `edge` has exactly two channels
— `stroke=` and `style=` — so a class an edge joins is a line error when
it declares neither: `fill=` with no `stroke=` (`INTERIOR-LESS-ELEMENT-PAINT`) and no
paint at all (`CLASS-PAINT-REQUIREMENT`) both drop the edge's colour with nothing
to warn on. `style=`-only is fine: the dash reaches the edge.

**The meaning field is mandatory; its VALUE may be empty (
`CLASS-EMPTY-MEANING`).** This is the language's own absent/`""`/`"text"` tri-state (`EMPTY-LABEL-STATE`,
§12.3), the rule labels already follow, applied to the one field that had
been collapsing the first two:

| form | status | legend |
|---|---|---|
| `class x` | **line error** — the field is missing | — |
| `class x ""` | **legal** — the author explicitly claims NO meaning | **no entry** |
| `class x "Hard ceiling"` | legal | entry drawn |

`class x ""` is **pure attribute grouping**: one name applied to many
members so a shared look is not repeated, asserting nothing about what the
look means. It is the honest spelling for what authors otherwise pay the
required field with — a restatement of the id. It is NOT the way to spell
a role: a `flowchart` role belongs in that genre's vocabulary, not in a
meaning-less class (§9, `GENRE-EARNING-THRESHOLD`/`LOGIC-FLOWCHART-GENRE-SCOPE`).

The **derived legend** shows a class's DECLARED paint and nothing else,
and only for a class that claims a meaning. A class that declares no paint
draws its meaning with no swatch, rather than a neutral box
indistinguishable from `fill=white stroke=#555`; a class whose meaning is
`""` draws no entry at all, and consumes no vertical space. The two rules
are the same rule read on two axes — **the legend draws what the author
declared, and nothing the author did not.** Every channel a class can
still declare (`fill`, `stroke`, `style`) is drawn there, so "declared but
not shown" is unreachable — which it was not before this release, when a
class whose only channel was the label colour rendered an empty swatch in
the legend the language derives FOR its meaning.

> **Considered and rejected: a per-class `legend=show|hide` option (`CLASS-EMPTY-MEANING`).**
> Prior art is exact — Highcharts' `series.showInLegend` and ECharts'
> equivalent are per-item legend opt-outs — and the need behind it is real:
> ten classes begin to dominate a figure. It is refused because
> `legend=hide` lets an author **claim a meaning and then hide it**: the
> reading agent gets the category from the model while the human sees an
> unexplained colour, which is the one-source-two-readers inversion this
> spec exists to prevent. `""` claims no meaning at all, so nothing is
> hidden and the inversion cannot arise. It also adds no key and no value
> shape. The full note, including what would reopen it and the separate
> `legend=auto` observation it raised, is in
> requirements-notes `CLASS-EMPTY-MEANING`.

### 2.8 External endpoints: `external`

Normative: [genres/block.md](genres/block.md). Open-ended edges; never a
drawn shape. The keyword was spelled `boundary` until this release (`EXTERNAL-ENDPOINT-NAMING`,
§10).

## 3. Layout control — the three tiers (`PRESENTATION-CONTROL-TIERS`, `LAYOUT-STABILITY`)

Everything in this section is **optional**; with none of it, the renderer
auto-lays-out deterministically.

**Spec-split note.** `flow` and `rank` are **content-zone** scene keywords
(reading axis / peer alignment). Their vocabulary rows and reading rules
are normative under [genres/block.md](genres/block.md) (and the scene
siblings). This section keeps the **layout-zone** contract — `layout` and
`pin`, which (`EDGE-GEOMETRY-CONSTRUCTS`) is the whole of it — plus the shared
`GUI-WRITEBACK-STRUCTURE` strip invariant. The zone is a namespace of its own and every member of it
is genre-independent (§1, `LAYOUT-ZONE-NAMESPACE`). The example below shows both zones for
teaching order; only the lines after `layout` are layout-zone syntax.

```figdown
flow right                      # content zone: overall direction (see block genre)
rank l2,l3                      # content zone: peers share a rank/row
layout                          # opens the layout zone
pin l3 at=(420,80) width=120 height=60
                                # tier 3: at= is the position in px, relative to
                                #         the element's positioning context;
                                #         width=/height= are an explicit extent
```

**What a bare `layout` line IS.** `layout` takes **no
arguments and no options** — the whole directive is the word. A
positional after it is `layout takes no arguments`; a `key=` after it is
`unknown option "<key>="`, because no option key is registered against
this directive. It is a
**zone opener**: it draws nothing, contributes nothing to the model
beyond its own presence, and its single effect is that **every line after
it belongs to the layout namespace** and every line before it belongs to
the content zone. It is single-valued per section (§8), so a second
`layout` line is `duplicate layout line`; and because the zone runs to the
end of the section, there is no closing keyword. Deleting the `layout`
line and everything after it is exactly the `GUI-WRITEBACK-STRUCTURE` strip test, which is why
the zone has an opener at all: one word makes the presentation tail
mechanically separable from the knowledge above it.

This is stated in prose because a blind-reading test found `layout` the
**weakest keyword in the language on self-evidence** — a reader who had
only the syntax reached the right meaning but at low confidence, and by
POSITION alone (it appears once, immediately before the only run of `pin`
lines), remarking that "a bare keyword is strange in a format this
attribute-happy". The keyword is bare deliberately: it names a boundary,
and a boundary has nothing to configure.

`pin` is the zone's only directive. It admitted the EXPERIMENTAL `routing` and
`path` directives until this release, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew both from the
language; §9 **`EDGE-IDENTITY-AND-GEOMETRY`** carries the requirement they served, and §10 the
diagnostics their spellings still fire.

Normative rules:

- **Rigidity** (`LAYOUT-STABILITY`): a `pin`/explicit attribute is a hard
  constraint; auto-layout arranges *around* pinned elements and never
  overrides them.
  **`pin` carries an element's whole declared geometry, and its two halves
  have DIFFERENT domains** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — the extent keys were a
  separate `size` directive until then):

      pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]

  All three keys are **optional** and **at least one is required**: a
  `pin` line carrying none of them is a line error, because it declares
  nothing and is therefore a typo rather than a weaker constraint.
  `pin a width=100` with no `at=` is legal and means exactly what a
  `size`-only line used to mean.
  - **`at=` applies to nodes, groups and `external` endpoints.**
  - **`width=`/`height=` apply to NODES ONLY.** A group sizes to its
    members; an `external` endpoint and a typed block (`bitfield`,
    `table`, `timing`) derive their geometry from their content. Each of
    the three carrying `width=`/`height=` is a line error naming its own
    subject, because an extent there is a claim the renderer cannot
    honour and silently ignoring it was the defect 0.1 closed.
  The split is on the KEYS, not on the directive: `pin` itself still
  applies to groups and externals, and pinning a group is the one-line
  edit that `PIN-COORDINATE-SCOPE`'s two-level coordinates exist for.
- **Determinism & stability (`RENDERING-DETERMINISM`, tiered conformance)**: a conforming
  parser MUST produce the same semantic model for the same source; a
  conforming renderer MUST be deterministic (same source + same
  renderer version → byte-identical SVG); different renderers SHOULD be
  visually equivalent (byte-identical output across implementations is
  NOT required — a Canonical SVG Rendering Profile may make it opt-in
  later). A local edit must change only the corresponding local region.
  The parser tier is testable against the golden fixtures in
  [conformance/](../conformance/README.md); known engine-vs-spec
  deviations are recorded loudly in its DISCREPANCIES file, never
  frozen silently.
- **Size adaptation** (`UNDECLARED-ATTRIBUTE-BEHAVIOUR`): an explicit extent → content shrinks to fit
  (font may step down). No explicit extent → box grows minimally without
  displacing the global layout. Extents are **px only** in v0.1 —
  percentage sizes are reserved for a future version. The value grammar
  is exactly `\d+(\.\d+)?` and the number MUST be **positive** (no unit
  suffix, no scientific notation, no zero, no negative — `at=` keeps
  negatives; a width is a box extent). A second `pin <id>` is a line
  error (single-valued per id, `REPEATED-DIRECTIVE-HANDLING`), and that one
  rule covers the position and the extent together: last-wins on a merged
  line would silently delete whichever keys the second line omitted.
- **Two-level pins (`PIN-COORDINATE-SCOPE`)**: a pinned **group** anchors its local origin
  in canvas px; a pinned **member** is group-local (relative to that
  origin). Moving a group is therefore a one-line edit and edits inside
  one group can never disturb another. Ungrouped pins are canvas px.
- **Semantic-completeness invariant (`GUI-WRITEBACK-STRUCTURE`)**: stripping every `pin` line
  and the `layout` opener from a document MUST leave one
  that still parses, still renders under auto layout, and expresses
  the identical structure and relationships. Editors conventionally
  place layout after a `layout` line so the structure reads first.
  **The invariant is frozen and unchanged; its MEMBERSHIP shrank.** It named `pin`, `routing` and `path` until `EDGE-GEOMETRY-CONSTRUCTS` withdrew
  the latter two from the language, and it names `pin` alone now. A strip
  set is a list of the constructs the zone contains, so removing a
  construct removes it from the list without touching the rule.
- **`PIN-COORDINATE-UNITS` resolved: `at=` is px relative to the element's positioning
  context** — the canvas for ungrouped nodes and groups; the group's
  local coordinate system for group members (`PIN-COORDINATE-SCOPE`). Canvas-relative
  fractions were tried and rejected (canvas growth moved every
  fractional pin). Edges are always derived from node borders — they
  adapt, and can never be pinned.
- **The reference corner of `at=` is the TOP-LEFT (
  normative).** `pin <id> at=(x,y)` places the **top-left corner of the
  element's layout box** — the axis-aligned bounding box of the drawn
  shape — at `(x,y)`. The anchor **does not vary by shape kind**: a
  `circle`, an `ellipse` and a `diamond` are pinned by the top-left of
  their bounding box exactly like a `box`, and the renderer derives the
  `cx`/`cy` it needs from it. This holds for every pinnable element —
  nodes, groups and `external` endpoints. The axes run
  right and down (SVG's), so a larger `y` is lower on the canvas.
  *Stated because it had never been written down: §3 said only "px
  relative to the element's positioning context", which does not choose
  a corner.*
  **`pin` is NOT Visio's `PinX`/`PinY`.** Visio shares the word and means
  the opposite anchor: its pin is the shape's **centre of rotation**, so
  a Visio-literate author who assumes centre semantics lands every
  circle, ellipse and diamond off by (w/2, h/2) — a legal, silently wrong
  figure. FigDown borrows only the word.
- **The two-zone reading contract (`CONTENT-LAYOUT-ZONE-SPLIT`, normative)**: a document has a
  content zone (top) and a layout zone — everything from a `layout`
  line to the end. The `layout` line is a bare keyword (no arguments);
  after it, ONLY layout declarations (`pin`, which is
  the zone's whole membership)
  are legal — any semantic directive after `layout` is a line error.
  The layout zone MUST NOT carry semantics; the content zone SHOULD
  NOT hold information needed only for rendering.
  **The layout zone is DEFAULT-IGNORED (`GENRE-NAMESPACE`, strengthening `CONTENT-LAYOUT-ZONE-SPLIT`).** The
  zone exists ONLY to stabilise the rendered `.svg`. Any information that
  is content, logic or concept MUST be expressible in the content zone.
  A reading agent's DEFAULT behaviour is therefore to **ignore the layout
  zone entirely** — not merely that it may. No opt-in or opt-out keyword
  is introduced; the default is the contract.
  This also puts an obligation on genre design: if a genre needs
  "arrangement carries meaning", it owes a content-zone construct
  (`MEANINGFUL-ARRANGEMENT`) — `pin` is not a substitute, and neither is anything else in
  the layout zone. `UNIVERSAL-CORE-KEYWORDS` and `LAYOUT-ZONE-NAMESPACE` (§1) are together what makes the default hold
  across genres. `UNIVERSAL-CORE-KEYWORDS` fixes the OPENER: `layout` is core and means the same
  thing under every genre, so an agent can skip the zone without knowing
  which genre it is reading, and the skip is driven by that marker rather
  than by the zone's contents. `LAYOUT-ZONE-NAMESPACE` fixes the MEMBERSHIP: every keyword
  inside the zone is genre-independent, so there is nothing a genre could
  have put there for the skipping agent to miss. The second half was added
  (`LAYOUT-ZONE-NAMESPACE`) because the first is not sufficient on its own —
  while `path`/`routing` were genre-redefinable, a future genre could have
  given one of them a meaning of its own inside the zone, and an agent
  that never looks at the contents has no way to notice. Both were
  withdrawn from the language (`EDGE-GEOMETRY-CONSTRUCTS`), so the zone now holds
  `pin` alone; `LAYOUT-ZONE-NAMESPACE` is what keeps the premise true for whatever it holds
  next.
  The one narrow exception is the gap the language has not yet closed:
  until a declared-arrangement construct exists (`MEANINGFUL-ARRANGEMENT`), a reading agent
  SHOULD read the layout zone, and say that it did, when a document's
  layout looks load-bearing — dense pins arranged as a stack, a grid, or a
  map (`PRESENTATION-AS-MEANING-CARRIER`). That is a workaround for a missing construct, not a second
  contract; a document that needs it has a semantics gap. Meaningful
  colour and shape are never in this position: they are declared as a
  `class` (§2.7) and already live in the content zone.
  Layout directives (`pin`) MAY appear
  before `layout` for documents that do not use the zone separator; a
  document with no `layout` line is valid. The zone opener was spelled
  `render` until this release; it was renamed because the zone admits only
  geometry, not presentation — and
  because `render` collided with the renderer and the render options of
  §7. `layout` is also the cross-tool word for this half of a diagram
  language, and this zone carried the `# --- layout` comment convention
  before it became a keyword.
- *Informative (editor policy, not wire format)*: editors MAY
  materialize computed positions into `pin` lines (the reference editor
  does so on the user's first drag — "pin-on-first-touch") and SHOULD
  place generated layout after a `layout` line. The old `# --- layout`
  comment convention is now just a comment with no special parser role;
  `layout` is the machine-enforced zone opener.

## 4. Typed blocks (census-dominant types)

Three figure families are *not* box-and-wire graphs and get dedicated,
closed sub-grammars. Each is introduced by its keyword and terminated by
the next top-level directive (sticky scope — no `end` keyword). Priority order below is final, per the completed census.

**Per-genre documents are normative and self-contained (`GENRE-DOCUMENT-CONTRACT`).** Each genre
has a dedicated document in `genres/` covering defaults, a **complete
vocabulary table**, the normative semantic model, error cases, and an
example. Core doc + genre doc alone suffice to author and read that genre.
The summaries below are informative; the genre docs are normative.

**A typed block is a nested genre region (`GENRE-COMPOSITION`, §1; `LOGIC-FLOWCHART-GENRE-SCOPE` §4).** Composing
genres is how FigDown expresses a hybrid figure — a block architecture
above a timing figure, a topology beside its VLAN table — and it is never a
reason to found a new genre (`LOGIC-FLOWCHART-GENRE-SCOPE` §4: hybrid figures are composition, not a
new genre). Stated at the vocabulary level:

- A `bitfield`, `table` or `timing` line opens a region governed by THAT
  genre's namespace. Its child keywords (`field`/`break`, the `|` row token
  with `cell`/`width`, `signal`/`gap`) are valid **only inside the region**;
  at the document's top level each is the line error
  `"<kw>" is a typed-block child — it needs a bitfield/table/timing block above it`.
- The reverse also holds: the host document's own keywords are not valid
  inside the region. A keyword from another genre's child set inside a
  region is `"<kw>" not valid inside <genre>`.
- Composition is **not inheritance**. A `topology` document containing a
  `table` block does not acquire the `table` genre's vocabulary; it reads
  each region under the genre that governs it.
- **In v0.1 the regions a document composes stand in document order**, each
  complete in itself, with no declared relation between them. Whether a
  region can be declared SUBORDINATE to an element of the host document —
  "this table is about node `X`", "this bitfield details the packet carried
  on edge `E`" — is `CROSS-BLOCK-REFERENCES` (cross-block semantic references), v0.2. Nothing
  here asserts that a composed region must be a peer; document order is
  what v0.1 provides, not a definition of what composition is. One
  constraint is already fixed for whoever designs `CROSS-BLOCK-REFERENCES`: a subordination
  relationship is SEMANTIC, so it MUST live in the content zone — it cannot
  be carried by `pin` or by anything else in the layout zone, which reading
  agents ignore by default (§3, `GENRE-NAMESPACE`).
- Only `bitfield`, `table` and `timing` have a region form in v0.1, so only
  they can be composed. `block`, `topology` and `flowchart` have no region
  syntax; giving them one is `GROUP-LEVEL-FLOW`/`CROSS-BLOCK-REFERENCES` territory, v0.2.

### 4.1–4.3 Genre documents are normative

Per `GENRE-DOCUMENT-CONTRACT`, each typed genre owns its **complete** vocabulary, defaults,
semantic model, errors, and examples in `genres/`. The core document
states only composition (`GENRE-COMPOSITION`, above) and the pointers below. Do not
treat the one-line summaries as a second source of truth.

### 4.1 `bitfield` — packet headers / register layouts

**NORMATIVE genre.** Normative document: [genres/bitfield.md](genres/bitfield.md).

### 4.2 `table` — config/state tables, memory maps

**NORMATIVE genre.** Normative document: [genres/table.md](genres/table.md).

### 4.3 `timing` — timing / waveform — EXPERIMENTAL GENRE

**EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** Spelled `wave` until this release (`TIMING-GENRE-NAMING`). Normative-for-the-genre document: [genres/experimental/timing.md](genres/experimental/timing.md). Outside the v0.1 conformance
surface; see §10.

### 4.4 `chart` — charts from table data (EXPERIMENTAL)

`chart <table-id> …` maps an existing `table` to a chart. Not a
genre; experimental, outside the v0.1 conformance surface (§10).
Principle: chart features SHOULD reuse table blocks as data (`NEW-CONSTRUCT-EVIDENCE-GATE`).
The opener was spelled `plot` and its type option `kind=` until this release (`CHART-BLOCK-NAMING`, §10). Its second option, `level=` (a reference plane
drawn through the bars), was **deleted** (`CHART-LEVEL-KEY`): zero uses
corpus-wide, zero 3-D bar charts, zero requests, and it was the only
construct in the language whose caption the engine wrote rather than the
author. `type=` is the one option key left.

### 4.5 Priority note

`block` (census #1) needs **no** typed-block opener — it is the
scene model ([genres/block.md](genres/block.md); historical §2).
Flowchart and topology share that model with different defaults/
status. Census: scene family + bitfield + table + timing cover most
classifiable diagrams (census.md).

## 5. Presentation attributes (`PRESENTATION-CONTROL-TIERS`)

Optional on any element: `fill=` (the interior), `stroke=` (the outline of
a shape and the whole of a line), `style=solid|dashed|dotted`, `plane=`;
`gap=` on groups. **There are exactly two paint channels, and they are
SVG's own two.** A label's colour is not a third one: v0.1 has no
label-colour key, and the default is derived (below).

**`stroke=` reads differently on a shape and on a line, and that is the
rule, not an exception.** On anything with an interior — a `node`, a
`group`, a typed block or one of its items — `stroke=` is the OUTLINE and
`fill=` is what it encloses. On an `edge`, a `bundle` ring or a
`threshold` there is no interior: the construct IS a line, so `stroke=`
is the whole of it and `fill=` is a line error naming `stroke=` (the
carve-out table below and the §10 registry row; `INTERIOR-LESS-ELEMENT-PAINT` — the citation read
"§8.4" until this release and §8 has no subsections). This is SVG's asymmetry borrowed unaltered — `<rect stroke>` is a
border, `<line stroke>` is the line — and every surveyed system reads it
the same way: mxGraph's `strokeColor` applies to vertices and edges
alike, D2's `style.stroke` is documented as applying "to shapes and
connections", and Mermaid colours a link with `linkStyle … stroke:`. A
reader needs one sentence for both cases: *`stroke=` is the ink the
element's outline is drawn with, and a line is all outline.*

> **`stroke=` is NORMATIVE (`STROKE-KEY-STATUS`).** It was demoted to
> EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) on a count of **5** uses across a
> 50-document corpus, which is no longer the fact: `examples/` and
> `figures/` alone write it **56+** times, and the downstream production
> corpus has **567 edge-colouring sites** — 549 `edge … class=` lines
> whose class carries a colour, plus 18 direct `edge … color=` — every
> one of which is a `stroke=` site. Nothing needed rewriting for the
> promotion. Documents that were not portable v0.1 documents while it was
> demoted — including this repository's own `examples/reference/block.fd`,
> `README.md`, `guide/showcase.md` and `guide/layout.md` — became portable with
> no edit. `plane=` stays EXPERIMENTAL, because the `plane` keyword that
> declares its only legal values is demoted (§10 (b′)); see §10 for the
> status rule. (`plane=` was spelled `layer=` until this release, `PLANE-KEYWORD-SPELLING`.)

> **`color=` is RETIRED language-wide (`COLOUR-KEY-STATUS`), and nothing
> replaces it.** The same six characters meant two opposite things in two
> eras: in one era `color=` set the **interior**, and
> in another it set the **label**. No engine can tell the
> two source files apart, so while the key stayed live a pre-0.1
> document parsed and drew a legal, WRONG figure in silence — `TEXT-COLOUR-KEY-NAMING`
> conceded in writing that the required diagnostic was "not
> implementable". Retiring the key is the only mechanism that makes the
> difference DIAGNOSABLE: every one of those lines is now a line error
> whose message names both eras and hands the choice to a human.
> No surveyed system has ever re-pointed a live colour key — DOT grew
> `fillcolor`/`pencolor` around an unchanged `color`, and PlantUML renamed
> and kept the old name working — and this reverses a third re-pointing.
> `text=` (an earlier release's spelling for the same channel) stays
> retired too. **Do not expect a replacement in v0.1**: the colour would
> have to attach to a LABEL, and an edge carries three of them
> (`[tail]`/`[mid]`/`[head]`), so any key on the *edge* colours all three
> identically. That makes every owner-level key that could be added today
> the wrong shape; the question is filed as a LOCATOR problem under §9
> `ANNOTATION-LOCATOR-SPLIT`, with Graphviz's `labelfontcolor` as the worked precedent for a
> system that hit the same wall.

**The default label colour is DERIVED, and it is not an option (`LABEL-COLOUR-SOURCE`).**
A label takes its colour from the background it is drawn on, so it cannot
assert a falsehood (`UNSAFE-DEFAULT-ELIMINATION`: a default that can be wrong is not allowed).
The arithmetic is normative and is WCAG 2.1's, unaltered:

1. **Relative luminance** of the background colour, per WCAG 2.1's
   *relative luminance* definition. For each 8-bit sRGB channel `C`, with
   `c = C / 255`:

   ```
   clin = c / 12.92                      when c <= 0.03928
   clin = ((c + 0.055) / 1.055) ** 2.4   otherwise
   L    = 0.2126*Rlin + 0.7152*Glin + 0.0722*Blin
   ```

2. **The threshold is not a taste value.** WCAG 2.1's *contrast ratio* is
   `(L1 + 0.05) / (L2 + 0.05)`. White (`L = 1`) and black (`L = 0`)
   contrast EQUALLY against a background of luminance `L` when
   `1.05 / (L + 0.05) = (L + 0.05) / 0.05`, i.e. at

   ```
   L0 = sqrt(0.0525) - 0.05 = 0.179128784747792…
   ```

   **The closed form is what is normative**; the decimal is an aid, and a
   renderer MUST NOT round it before the comparison. A renderer MUST use
   the **dark** ink when `L > L0` and the **light** ink otherwise. Any other threshold knowingly picks the less readable of
   the two.

3. **Which background.** A label drawn inside a filled shape takes that
   shape's RESOLVED fill — the element's own `fill=`, else its class's,
   else the block's per-item default, else the renderer's default fill.
   A label owned by a line-only construct (an `edge`'s three labels, a
   `threshold`'s label, a `bundle` ring's label) has no fill to sit on and
   takes **its owner's line colour**: labels follow their owner. A label
   drawn on the canvas — a typed block's title, an `external`'s label —
   takes the canvas ink. `transparent` is not a fill: it is the canvas.

The two ink values themselves are the renderer's, exactly as fonts and
spacing are; what this section fixes is the *choice between them*. The
reference engine uses `#ffffff` as the light ink and its per-context
default text colour as the dark one.

> **The edge-label split this closed.** Until this release an edge's `[mid]`
> label followed the line colour while its `[tail]`/`[head]` labels did
> not — one construct, two undocumented defaults, so a `stroke=#0f766e`
> edge drew a teal mid label and two grey endpoint labels. All three now
> follow the line.

Dimensions belong exclusively to the `pin` directive's `width=`/`height=`
keys (a separate `size` directive until this release, `ELEMENT-GEOMETRY-DIRECTIVE`) — `width=`/`height=`
on a node line is an error (one mechanism, not two). The abbreviations
`w=`/`h=` were retired and are a line error wherever they
appear (`UNSAFE-DEFAULT-ELIMINATION`: SVG, CSS, DOT, mxGraph and D2 all spell these in full, and
`fill=`/`stroke=` were borrowed whole from SVG). Edge routing is not in
the language at all (`EDGE-GEOMETRY-CONSTRUCTS` withdrew `routing` and `path`;
§9 `EDGE-IDENTITY-AND-GEOMETRY`) — and it was never expressible on an `edge` line even when it
was. Everything else (fonts, spacing,
arrowheads) belongs to the renderer/theme, not the language.

**Where they apply, and the deliberate carve-outs.** "Any element" means
every construct that can actually *draw* the thing the attribute names.
The four attributes are accepted on `node`, `group`, `edge`, `class`,
`bundle`, `threshold`, `band`, `external`, the typed blocks
(`bitfield`/`table`/`timing`) and their items (`field`, `cell`, `signal`)
— with exactly the exceptions below. Each exception is a line error
(`<directive> does not take <key>=`), never a silent no-op, because the
grammar is closed (§10):

| element | NOT supported | why |
|---|---|---|
| `edge`, `bundle`, `threshold` | `fill=` | none of the three has an **interior**: the construct IS a line, so `fill=` and `stroke=` would name one channel and `fill=` was the one that lost silently. Retired at 0.1 (`INTERIOR-LESS-ELEMENT-PAINT`, and the paragraph above); the message names `stroke=`. `stroke=` and `style=` stay live on all three — a line has ink and a dash. |
| `external` | `fill=`, `stroke=`, `style=` | an external endpoint is **never drawn** (`EXTERNAL-EDGE-ENDPOINTS`, §2.8): there is no fill, no border and no dash for the attribute to act on. Since 0.1 (`COLOUR-KEY-STATUS`) it takes `plane=` and nothing else: its label was the one thing it drew and `color=` was the one key it kept, so retiring that key leaves it with no paint at all. The label is still drawn, in the canvas ink (`LABEL-COLOUR-SOURCE`). |
| `bitfield`, `table`, `timing` | `style=`, `plane=` | typed blocks stack in document order **outside** the scene, so there is nothing to layer them against; and a block-wide `style=` would collide with the per-item dash convention (a field carrying `present=` is drawn dashed). |
| `field`, `cell`, `signal` | `plane=`, **`style=` (since 0.1, `STYLE-KEY-SCOPE`)** | a block item lives inside its block, which is not part of the plane stack. `style=` was accepted per item until 0.1 and was removed for a reason stronger than tidiness: on a `field` the dash is conditional presence's ONLY visual carrier, so `field "B" 8 present="" style=solid` erased it while the model still recorded the field as conditionally present — a reading agent and a human got different figures from one line, which is exactly what `MEANINGFUL-ARRANGEMENT` forbids. (The construct was the bare flag `optional` when `STYLE-KEY-SCOPE` was written; `PRESENCE-CONDITION-EXPRESSION` replaced it with `present=` at 0.1.) The three were removed together as one minimum set (11 in-repo uses, **0 downstream**); a per-item dash now comes only from the item's own semantics (`present=`) or from a `class=` it joins. | <!-- fence-check: skip -->

> **`band` left this table (`BAND-LABEL-STATUS`).** It was listed here as
> refusing `color=`, with the reason *"a zone band carries no label"* — a
> DEFECT stated as a design feature. `band` had no label slot at all, so
> its complete model was `{target, from, to, extend, fill, line}`; strip
> `fill=`, which this section and `PRESENTATION-AS-MEANING-CARRIER` entitle a reader to discard, and a
> band asserted **nothing whatsoever** — its meaning rode on colour alone,
> which the paragraphs below declare must never happen. The label is now
> MANDATORY and quoted, written first (`band "Headroom" 15..35% in=pool`),
> and the text channel came with it — a channel 0.1 then removed
> from the whole language (`COLOUR-KEY-STATUS`), so a `band`'s label now takes the derived
> colour like every other label. Every interval region in the measured corpus is a
> *named* one; the buffer-region figure that motivated this was forced to
> carry its names in three `class` declarations all spelled "region".

`plane=` is stated honestly: it is accepted on `node`, `group` and
`external` and recorded in the model, but the only pass that acts on
a plane's `z` as paint order is the annotation pass — edges, bundle rings,
threshold lines and zone bands. Nodes and groups are painted by the scene
pass in document order whatever their plane says. The attribute is kept
on them because it is *organizational* (it names the plane an element
belongs to, and `class … plane=` can default it), and because rejecting
it on three of the elements that carry every other §5 attribute would be
a worse rule than saying plainly what it does.

Value rules are uniform wherever an attribute is accepted: colors are
`#rgb`/`#rrggbb` or a CSS named color (plus `transparent`), `style` is
one of `solid|dashed|dotted`, and `plane=` MUST name a plane the
document declares — a `plane=` naming no declared plane is a line error
on every directive that takes it.

Normative boundary (the presentation-ignorable invariant, extending
`GUI-WRITEBACK-STRUCTURE`): removing all presentation-only attributes (`fill`, `stroke`,
`style`, `gap`, `z`) and layout directives (`pin`)
and the `layout` zone-opener line MUST NOT change the document's semantic structure;
semantic consumers MAY ignore them. Consequently **color and style MUST NOT be the sole
carrier of meaning** — if color/dash denotes state, role, plane or
classification, that meaning SHOULD also appear in text or a semantic
annotation — the `class` mechanism (§2.7) is that carrier: when
color/dash classifies, declare a `class` and join elements to it;
bare `fill=` remains for decoration. Semantic-color profiles can be layered on later; the
document scenario keeps colors free. (resolves the `PRESENTATION-CONTROL-TIERS` tension)

General principle (`PRESENTATION-AS-MEANING-CARRIER`): **any attribute this spec calls presentation MAY
render meaning but MUST NEVER be its only carrier** — if something is
knowledge, some text in the content zone must say it. Two consequences.
When the colours are the figure's SUBJECT MATTER (a spectrum, colour bands,
a wire colour code), the colour NAME MUST appear as text (a cell/node label
or a `class` label) and the SEQUENCE MUST live in an ordered construct
(table cell order, bitfield field order), so that a consumer that cannot
render can still answer which band is third and what that colour means; when
the exact colour VALUE is itself the datum, write the value in the text too
— the duplication with `fill=` is deliberate, the text being normative.
The same law applied to position is what `MEANINGFUL-ARRANGEMENT` (§9) has to close.

## 6. Dynamic — reserved, not specified (`STATIC-DYNAMIC-PRIORITY`, `DYNAMIC-FIGURE-PURPOSE`)

`page`, `set` and `pulse` are reserved keywords — the three the sketch
below actually uses, and the whole reserved set (§10). `step` was reserved
until this release and has been RELEASED: it appeared in no sketch, no genre
claimed it, and a word reserved against nothing costs authors a name for
nothing. Sketch (non-normative):

<!-- fence-check: skip -->
```figdown
page "After ARP resolution"
set r1.fib row="10.1.0.0/16 R4 p2"    # sticky delta on the static scene
pulse r1                                # transient highlight
```

Dynamic = the static scene + an ordered list of page deltas (sticky vs.
transient). Deferred until the static core ships.

## 7. Embedding & artifacts (`MARKDOWN-EMBEDDING-CONVENTION`, `RENDERING-DETERMINISM`)

- Fenced block in Markdown: ` ```figdown … ``` `; sidecar file: `X.fd`.
- Generated artifact: `X.svg`, embedded in .md by plain image reference.
- The renderer MUST embed in the SVG: the full source text
  (`<metadata id="figdown-source">`), a SHA-256 of the source
  (`data-sha256="…"` — the hash is of the SOURCE, never of the artifact),
  and **the full version string of the engine that rendered it**
  (`data-engine-version="…"`) — making the artifact self-carrying and
  staleness detectable.
- **Why the engine version is required.** `RENDERING-DETERMINISM` promises byte-identical
  output for *the same source and the same renderer version*, so the
  renderer version is half of the input to that promise: without it an
  artifact cannot be reproduced or verified, only re-rendered and hoped
  about. Under §13 a 0.x renderer MAY differ from the next, which makes
  the recorded version the only thing that can explain a diff between
  two renderings of one source — the alternative is to suspect the
  source, which the SHA-256 has already ruled out.
- Same-basename pairing (`X.fd` ⇔ `X.svg`) is normative.
- **Render options (renderer tier, not language).** A renderer MAY
  accept presentation options — v0.1 defines one: `with-title` (draw
  the title inside the SVG). The DEFAULT is not drawn: embedded
  figures almost always sit under the host document's caption (`DEFAULT-VALUE-SELECTION` —
  defaults follow the majority; mainstream tools also do not draw
  titles by default). The title TEXT stays semantic in the source
  either way. Any non-default option MUST be recorded in the artifact
  metadata (`data-render-options="…"`), so an artifact remains a pure
  function of (source, recorded options) and third-party rebuilds
  stay bit-identical. Options never appear in the source grammar —
  the registry is untouched, and option vocabulary is kept minimal
  (a knob must justify its existence like syntax must).

## 8. Error model

- Unknown keyword / malformed line → `Line N: <message>`, parse continues
  (error-recovery mode) so all errors report in one pass.
- Unknown `shape`, duplicate ID (node/group/`external` share one
  namespace), dangling edge endpoint (an id that names no node and no
  `external`), `in=` cycle (**a RESERVED category, not a v0.1 error** —
  `in=` is node-only and `in=` on a `group` is itself a line error, so
  containment is one level and no cycle is constructible; the entry holds
  the category for a future nesting syntax, and 0.1 removed it from
  `genres/block.md`, which stated it as a live error), a **compact**
  bitfield item wider than the row
  (`field A:16,B:64` under `word=32`), table row/col
  mismatch → all line errors. The **classic** form does NOT overflow:
  `field "B" 64` under `word=32` is the documented spanning case (§4.1),
  parses clean and stays ONE field of width 64 across two rows. The
  asymmetry is the compact form's own convention — it is C's bit-field
  spelling, where an item must fit its storage unit, and its options are
  LINE-wide, so no single item in a compact list can say "this one spans".
- **Repeating a single-valued directive is a line error on the second
  occurrence** (`REPEATED-DIRECTIVE-HANDLING`). `title`, `flow` and `layout` are single-valued per
  **section**; `pin` is single-valued **per node id within its section**
  (`pin a` + `pin b` is fine, `pin a` twice is not). "Per section" and
  "per document" coincide in a single-section file; the distinction was
  made explicit with the id-scope resolution in §1, and it
  is what the reference engine already did — two sections may each carry
  their own `title`, their own `flow`, their own `layout` zone, and a
  `pin` for the same id. Last-one-wins would be a silent failure:
  the document says two things and the reader is never told which one
  was dropped. Messages: `duplicate title line`, `duplicate flow line`,
  `duplicate layout line`, `duplicate pin for "<id>"`.
- A document with errors renders nothing (no partial/best-effort output —
  determinism over convenience).
- **A repeated option key on ONE line is a line error**, never last-wins:
  `node a fill=red fill=blue` → `duplicate option "fill=" on one line`.
  It is a property of the **option lexer**, not of any keyword, so it
  holds uniformly for **every directive that takes an option**, frozen or
  experimental, without being restated on each — verified on `node`,
  `edge`, `class`, `pin`, `bitfield` and `table`. It was **stated only in
  [syntax-style.md](syntax-style.md) §7 (I5) until this release**, a
  document whose own opening says it is normative for the DESIGN of the
  language and is not an authoring guide, and whose evidence cites engine
  line numbers an implementer is not supposed to read. Same key on
  DIFFERENT lines is a different question and is answered per construct
  (§8.1).
- **Forward references are legal.** Reference resolution is a **post-pass
  over the whole section**, not a left-to-right walk: a name may be used
  before the line that declares it. `edge a -> b` before `node a`,
  `in=g` before `group g`, and `class=c` before `class c "…"` all parse
  clean and produce the same model as the same document written in
  declaration-first order. A single-pass resolver that rejects a forward
  reference is **not conforming**, however many fixtures it passes. Stated
  And pinned by `021-forward-references`; before that no
  normative fixture exercised one, so a single-pass implementation could
  pass the whole suite while rejecting legal documents.

### 8.1 Duplication: what repeats, and what that costs

"Is writing this twice an error?" is asked of every construct, and the
answer is not uniform. Three behaviours exist and each construct has
exactly one:

| behaviour | meaning | constructs |
|---|---|---|
| **line error on the second** | single-valued (`REPEATED-DIRECTIVE-HANDLING`) | `title`, `flow`, `layout` (per section), `pin` (per id per section), `width` (per table), the `\|---\|` delimiter row (per table), a duplicate id in the node/group/`external`/typed-block namespace (per section) |
| **accepted, both kept** | the construct is a set member, and two identical members are two members | `edge`, `rank` |
| **accepted, merged** | two writings would combine into one object | *(none — no v0.1 construct merges)* |

The two accepted cases are the ones an implementer is most likely to guess
wrong, so they are stated rather than left to inference:

- **`edge` repeated identically.** `edge a -> b` written twice yields
  **two** *Edge* objects in `edges`, in document order, each with its own
  `line`. There is **no de-duplication**: the model is a multiset of
  authored statements, not a graph the engine simplifies. An implementation
  that collapses them emits a shorter `edges` array and fails the byte
  comparison.
- **`rank` lines with overlapping ids.** `rank a,b` followed by `rank b,c`
  is accepted; so is the same line written twice. Each `rank` line is one
  *Rank* object in `ranks`, and the arrays are **not** merged into
  connected components, not de-duplicated, and not checked for overlap. A
  shared id in two ranks is an ordinary authored statement.

The two per-table errors above are listed in the [table genre's Errors
table](genres/table.md#errors); they were golden-pinned but absent from it
until this release.

### 8.2 The error-message catalogue: where it is, and what is missing

**The `.errors.txt` goldens in `conformance/cases/` are the normative
catalogue of error messages, and this section is NOT exhaustive.** That is
the honest statement of the position, made; before it, the
project implied a catalogue existed somewhere in `spec/`, and none did.

- **What is specified.** Every message a normative fixture produces. **How
  many that is, is not written down here.** A number that nothing
  recomputes drifts every time a fixture lands, so this section states the
  command that derives it instead — the rule
  [conformance/ERROR-COVERAGE.md](../conformance/ERROR-COVERAGE.md) and
  `conformance/STATUS.txt` already apply to their own tallies. Run from the
  repository root:

  ```sh
  node -e '
  const fs=require("fs"), d="conformance/cases";
  let files=0, lines=0; const msgs=new Set();
  for (const f of fs.readdirSync(d).filter(x=>x.endsWith(".errors.txt"))) {
    files++;
    for (const l of fs.readFileSync(d+"/"+f,"utf8").split("\n")) {
      if (!l.trim()) continue;
      lines++; msgs.add(l.trim().replace(/^Line \d+:\s*/,""));
    }
  }
  console.log(lines+" error lines across "+files+" fixtures, "+msgs.size+
              " distinct message texts");'
  ```

  A second implementation reads the messages out of the goldens, which are
  ordinary UTF-8 text files in this repository and are **not** the reference
  engine. Reading a golden is exactly what the conformance recipe asks
  for; it is not a back door into the PoC.
- **The format is fixed even where the text is not**: one error per line,
  `Line N: <message>`, `N` 1-based and file-wide, all errors from one
  pass, output sorted for comparison (`conformance/run.js` sorts before
  it compares, so an implementation's own emission order is free).
- **What is NOT specified, stated plainly.** The reference engine has
  ~195 `err()` call sites; the suite pins the messages of a subset. **For
  an error case that no normative fixture covers, a second implementation
  has no way to learn the required message text.** It can know the input
  must be rejected, and it can match the `Line N:` frame, but the words
  are unavailable to it. This is a real gap, it is not closed by this
  section, and it is the reason
  [conformance/README.md](../conformance/README.md) no longer claims the
  whole suite is reachable from the normative documents.
- **What would close it.** Either an exhaustive catalogue in this
  document, versioned and gated so it cannot drift from the engine, or a
  fixture per `err()` site so the goldens become complete by construction.
  The second is the cheaper of the two and is the direction
  [conformance/ERROR-COVERAGE.md](../conformance/ERROR-COVERAGE.md)
  already measures; neither is a v0.1 deliverable.

### 8.3 Error recovery and precedence: UNSPECIFIED in v0.1

A line that fails **abandons its declaration** — the element it would have
created does not enter the model — and the failure can therefore
**cascade** into later lines that referred to it. `node a "A" shape=hexagon`  <!-- fence-check: skip -->
followed by `edge a -> b` yields **two** errors: the bad shape, and
`unknown endpoint "a"`.

**This is observed behaviour, pinned in the goldens, and it is NOT a
normative rule.** v0.1 does not specify recovery, and the reference engine
is not self-consistent about it:

- `bitfield x "X" numbering=zzz` errors and **still opens the block**, so  <!-- fence-check: skip -->
  its children parse.
- `bitfield x "X" class=c` errors and **does not** open the block, so  <!-- fence-check: skip -->
  every child raises a second error of its own.
- Duplicate-versus-bad-value precedence resolves in **opposite
  directions**: a second `width` line reports only `duplicate width` and
  swallows the value error the same line would otherwise raise, while a
  second `pin` reports only the value error and never fires
  `duplicate pin for "<id>"`.

The consequence for a second implementation is concrete and should not be
discovered the hard way: **an implementation that recovers differently —
by keeping the failed declaration, say — produces a different error SET
for the same input, and fails fixtures whose subject is not recovery at
all.** Until v0.1 specifies recovery, matching the goldens on these cases
means matching the reference engine's recovery, which is the one place
this suite is not reachable from the normative documents by reasoning
alone. Recorded as an open question in §9.

## 9. Open syntax questions

- ~~`INDENTED-BLOCK-SUGAR`: indented block sugar~~ — **rejected** (second containment
  syntax; `NEW-CONSTRUCT-EVIDENCE-GATE`).
- ~~`PIN-COORDINATE-UNITS`: `pin at=` units~~ — resolved: px relative to the positioning
  context (§3).
- ~~`TABLE-COLUMN-WIDTHS`: column widths~~ — resolved: `width` is in v0.1 (§4.2); mixed
  per-column alignment stays out (census 1.4%).
- ~~`EDGE-LABEL-OFFSET-CONTROL`: edge label position hints~~ — **rejected for v0.1** (pure
  presentation; would invite pixel-level hand-tuning). User ruling
  2026-07-10: stay conservative now; if real figures ever demand it,
  it can be added later — additions are cheap under `VERSION-MIGRATION-MODEL`, and the
  three-position model (§2.3) already carries *which position* as
  semantics.
- ~~`MULTI-FIGURE-DOCUMENTS`: multi-figure documents~~ — resolved: one `.fd` produces one
  `.svg` artifact; a document MAY contain multiple top-level blocks,
  composed in document order.
- ~~`D2-RELATIONSHIP`: relationship to D2~~ — informative appendix:
  prior-art.md §3.
- ~~`EDGE-LABEL-PLACEMENT`: edge labels~~ — **resolved (2026-07-10)**: inline labels at
  the three meaningful positions, `edge A [tail] <-[mid]-> [head] B`
  (§2.3); `<-` joined the operator set;
  `label=`/`taillabel=`/`headlabel=` retired (migration 0.1).
  Survey: prior-art.md §1.
- ~~`LEGEND-MECHANISM`: legend/class mechanism~~ — **resolved (2026-07-10, `CATEGORICAL-MEANING-MAPPING`)**:
  `class` adopted (§2.7); legend strip derived. Evidence:
  prior-art.md §4 (56% of corpus figures
  carried unmapped color semantics; explicit legends only ≈3%).
- `BITFIELD-DISCRIMINATED-VARIANTS`: **discriminated variants** in bitfields — the same bits
  reinterpreted by an external mode (field feedback; register maps
  do this constantly). Current standard practice: carry the condition
  in `description="valid when …"` and flag for human review. A row-level
  `when=` or a first-class variant concept needs prior art
  (SystemRDL/IP-XACT) + corpus evidence.
- `GROUP-LEVEL-FLOW`: group-level `flow` (side-by-side sub-areas inside one
  figure; field feedback). Current standard answer: split composite
  originals into one `.fd` per concept and let the Markdown compose
  them.
- `NAMED-LANES`: **named lanes / semantic layering** —
  the unifying umbrella for the layout-carries-meaning family
  (direction · layering · side-by-side, subsuming `GROUP-LEVEL-FLOW`). `rank`
  already declares same-layer membership; the open question is a
  named, rendered lane construct. Needs a prior-art pass (PlantUML
  swimlanes, BPMN lanes, Mermaid subgraphs) + corpus frequency before
  the `NEW-CONSTRUCT-EVIDENCE-GATE` gate.
- `TABLE-SPARKLINE`: in-table **trend/sparkline** primitive.
  Current sanctioned answer: Unicode block characters (▁▃▅▇) as
  authored cell text. A first-class construct waits on corpus
  evidence (chart family ≈1%).
- `LAYOUT-ZONE-INLINE-ATTRIBUTES`: **inline presentation attributes in the rendering zone** —
  presentation attributes on semantic lines (e.g. decorative `fill=`
  on a `node` line) are currently legal in both zones. A dedicated
  spelling that moves them into the rendering zone would let a reading
  agent skip them without parsing each semantic line. Tracked as
  `LAYOUT-ZONE-INLINE-ATTRIBUTES` should field demand appear (`CONTENT-LAYOUT-ZONE-SPLIT`).
- `ROW-INDEX-GUTTER`: external per-row **index/address gutter** (a semantic per-row
  property + `gutter` placement; field feedback `ANNOTATION-FAMILY-SEQUENCING`). Sanctioned
  workaround: inline the index in the label. **Trigger fired
  (2026-07-26)**: downstream pipeline delivered a concrete `annotate`
  callout proposal (53 corpus figures) and a gutter spelling proposal
  (19 corpus figures); evidence accepted. Maintainer disposition: the
  entire annotation family (gutter, callouts, edge taps `TAP-VERSUS-JUNCTION-SPELLING`, cell
  anchors `CELL-EDGE-ANCHORS`, brace grouping `CONTIGUOUS-RANGE-GROUPING`) shares one design axis and
  will be designed holistically in one v0.2 session — no piecemeal
  ruling. All v0.2 (see `ANNOTATION-FAMILY-SEQUENCING` evidence update 2026-07-26).
  **Corroboration (2026-07-27)**: downstream first authoring pass hit
  attached-callout needs in 4 more downstream evidence figures; interim
  workaround (adjacent-floating-node) sanctioned (`ANNOTATION-FAMILY-SEQUENCING` 2026-07-27).
  **Severity note (2026-07-29 needs audit)**: the sanctioned interim
  workaround — a detached dashed node used as a callout — is
  structurally a `node`, so a reading agent counts it as a participant
  in the figure's subject matter. This is not a cosmetic defect: it
  corrupts topology counts and mixes annotation text into architecture
  descriptions. This raises `ROW-INDEX-GUTTER`'s priority within the v0.2 holistic
  annotation design session: the solution must give annotations a
  first-class identity that is syntactically distinct from participants,
  not merely a styling convention that a reader must learn to ignore.
  **The spelling half was PRE-EMPTED (`BITFIELD-REPETITION-CONSTRUCT`), and this entry no
  longer names `index=` as its candidate.** `index=` is now spent in
  `bitfield`'s namespace as the repetition range on `field`, so the gutter
  may not reuse it; the filing against that choice is **`INDEX-KEY-NAMESPACE-CONTENTION`** below.
  **`ANNOTATION-FAMILY-SEQUENCING`'s own evidence points at a better spelling anyway, and the record
  should say so rather than let a name be chosen twice.** `ANNOTATION-FAMILY-SEQUENCING`'s gutter
  evidence is **100% addresses** — *"hex addresses, one per row"*, *"n+0x0,
  n+0x4"* — and **`address` is registered nowhere**: zero rows in
  `vocabulary-sources.tsv` as a spelling (the one row whose id contains the
  word, `cell.address`, is a positional SLOT id, not a key). So on its own
  evidence the gutter's better spelling is `address=`. That is **recorded, not ruled**: the v0.2 holistic
  session decides it with the rest of the family, and this note exists so
  the session starts from the evidence rather than from a spelling that was
  never measured against it.
- `LOGIC-GATE-PRIMITIVES`: digital **logic-gate primitives** (gate shapes
  and/or/xor/xnor/nand/nor/not/buf + mux/demux; edge options
  inv=/role=select/width=). **Genre ruled IN under `GENRE-EARNING-THRESHOLD`/`LOGIC-FLOWCHART-GENRE-SCOPE`
  (2026-07-25); all work is v0.2.** Evidence (`CHART-SCOPE-BOUNDARY`): vision census +
  prior art (ANSI/IEEE 91-1984 / IEC 60617-12; no text-tool ships
  them). The full-corpus measurement now scopes and prioritizes
  delivery — it no longer gates existence. **Design direction (`LOGIC-FLOWCHART-GENRE-SCOPE`)**:
  first-class gate construct family — scene participants like
  `external`, with edge signal attributes (inversion, bus width,
  select role) — NOT a shape-enum extension; `shape=` stays purely
  geometric (`SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`); the author names the meaning and the engine owns
  the standard symbol drawing (`DOMAIN-CONVENTION-DIRECTIVES`). **Staged scope (`ELECTRICAL-SCHEMATIC-SCOPE`/`LOGIC-FLOWCHART-GENRE-SCOPE`)**:
  combinational gates + inversion + mux first; sequential elements
  (D flip-flops, latches, clock-edge symbols, reset logic) ordered by
  the frequency result. Electrical schematic symbols (capacitor,
  transistor, diode, pad, etc.) remain OUT-OF-SCOPE for FigDown
  entirely (distinct domain; `ELECTRICAL-SCHEMATIC-SCOPE`).
- `CONTIGUOUS-RANGE-GROUPING`: **curly-brace grouping** — a named set over a contiguous
  range of fields/rows/nodes (`brace <fields|rows|nodes> <range>
  "label"`), distinct from `group` (box) and `class` (legend).
  Semantic gap plausible; updated frequency ~48 downstream corpus
  figures (re-scored baseline 2026-07-26, supersedes the prior `CHART-SCOPE-BOUNDARY`
  count of ~20 from one PDF). Scope note: edge-set grouping ("ellipse
  around a set of edges") is already expressible as `bundle` (`ELECTRICAL-SCHEMATIC-SCOPE`);
  `CONTIGUOUS-RANGE-GROUPING` covers contiguous field/row/node ranges only and receives no
  expansion. All v0.2; part of the holistic annotation/targeting design
  session.
- `CELL-EDGE-ANCHORS`: **table/grid cell anchors for edges** — edges can attach to
  nodes and external endpoints, but not to a named cell within a `table`
  block. Pointer/linked-list figures (descriptor rings, free-list
  chains, name-to-slot maps — a real hardware-doc genre) therefore
  degrade to whole-table relations, losing per-cell targeting.
  Semantic argument strong; updated frequency ~40 downstream corpus
  figures (re-scored baseline 2026-07-26, supersedes the "pending"
  status from `ELECTRICAL-SCHEMATIC-SCOPE`). Sanctioned workaround: use a whole-table relation
  and note the targeted cell in an edge label or `description=`. All v0.2.
- `FLOWCHART-GENRE-DESIGN`: **flowchart genre design** — flowchart ruled a genre under
  `LOGIC-FLOWCHART-GENRE-SCOPE` (2026-07-25). Components (decision, process, terminal, …) have
  definite meanings that a `shape=diamond` spelling forced readers to
  infer — a genre-interpretation loss under `GENRE-EARNING-THRESHOLD`/`MEANING-RECOVERY-SOURCE`.
  **(a) and (b) are CLOSED by `FLOWCHART-ROLE-KEYWORDS`.** (a) the closed role
  set is `process` / `decision` / `terminator`; (b) the spelling shape is
  *scene role constructs* — three top-level keywords following `external`,
  not a typed block following `bitfield`/`table`. What stays open:
  **(c) the migration story for existing `shape=diamond` approximations**,
  which is deliberately NON-mechanical — the corpus measurement that
  justified the vocabulary (of 216 question-labelled nodes, 78% diamond,
  14% ellipse, 8% no shape) is itself the proof that no inverse mapping
  from geometry to role exists. General node + `shape=` remains the
  baseline fallback (`GENRE-EARNING-THRESHOLD` §4): a pre-0.1 flowchart stays valid and
  readable, it simply says less. The excluded role candidates — `fork` /
  `join` / `merge`, a loop construct, a default branch, edge roles,
  swimlanes — are recorded with their measured evidence in
  [genres/experimental/flowchart.md](genres/experimental/flowchart.md) §Roles, *What is excluded*.
  **Sub-question recorded (2026-07-29, NOT a new OQ)**: AND-split/
  AND-join versus XOR-split/XOR-join distinction — whether a fan-out
  means "all branches fire" or "exactly one fires"; whether a join
  waits for all or races. Today only a free-text `class` label carries
  this distinction, so no closed vocabulary can be queried. Kept inside
  `FLOWCHART-GENRE-DESIGN` rather than filed separately: `LOGIC-FLOWCHART-GENRE-SCOPE` already ruled a gate
  construct family for the `logic` genre, and the split/join vocabulary
  for flowcharts and the logic-gate join/fork vocabulary must be
  designed together. Also record explicitly that this need is NOT
  flowchart-only — it appears in pipelines (fan-out to parallel workers
  vs alternative routes) and hardware datapaths (replicate vs demux);
  the vocabulary must generalize across genres.
- `TAP-VERSUS-JUNCTION-SPELLING`: **edge taps and junctions** (`EDGE-ENDPOINT-ELIGIBILITY`, 2026-07-26) — mid-edge
  attach points for two semantically distinct cases: branch/tap
  (observation only, no flow change) and junction (true connectivity
  split/join). Also covers annotation leaders targeting an edge region
  and packet-view extraction from a datapath edge. Downstream candidate:
  named edges (stable edge identity, a prerequisite) + a `tap` entity
  with `on=<edge>` and a role vocabulary. Related in spirit to `CELL-EDGE-ANCHORS`
  (sub-element targeting) but distinct in scope (scene-graph edges, not
  typed-block cells). Frequency: 22 downstream corpus figures. All v0.2;
  design deferred to the holistic targeting/annotation session with
  `ROW-INDEX-GUTTER`/`CONTIGUOUS-RANGE-GROUPING`/`CELL-EDGE-ANCHORS` (see `ANNOTATION-FAMILY-SEQUENCING` evidence update 2026-07-26).
  **Corroboration (2026-07-27)**: downstream first authoring pass
  independently hit the mid-edge gap in 4 downstream evidence figures
  (bus topologies flattened to star = semantic error; mid-wire taps
  modelled as duplicate edges = semantic error); intermediate-bus-node
  workaround sanctioned (`EDGE-ENDPOINT-ELIGIBILITY` 2026-07-27).
- `CROSS-BLOCK-REFERENCES`: **cross-block semantic references** (`CROSS-BLOCK-REFERENCES`, 2026-07-26) —
  formalizes the gap acknowledged in `LOGIC-FLOWCHART-GENRE-SCOPE` point 4: no first-class
  mechanism for one typed block to reference an element in another typed
  block within the same `.fd`. Downstream candidate: a `rel` construct
  with typed block-qualified locators and a closed role vocabulary;
  unresolved locator = line error. 5 corpus figures are explicit
  mixed-layout integrations requiring this. Explicitly NOT a new genre
  (`LOGIC-FLOWCHART-GENRE-SCOPE` point 4 stands: hybrid figures are composition, not a new genre).
  **Also the home of SUBORDINATE COMPOSITION (`GENRE-NAMESPACE` `GENRE-COMPOSITION`)**: v0.1 composes
  genre regions in document order with no declared relation between them;
  declaring that a region is *about* an element of the host document
  ("this table is about node `X`", "this bitfield details the packet
  carried on edge `E`") belongs here. Two constraints are already fixed
  for that design: the never-implemented `table … attach=` spelling is
  not a starting point (it was removed, and the engine rejects it as an
  unknown option), and a subordination relationship is SEMANTIC, so it
  MUST live in the content zone — `pin` and the rest of the layout zone
  cannot carry it, because reading agents ignore that zone by default
  (§3, `GENRE-NAMESPACE`). All v0.2.
- `PUBLICATION-MANIFEST-PROFILE`: **publication manifest and provenance profile** (`PUBLICATION-MANIFEST-PROFILE`,
  2026-07-26) — a standardized non-core JSON manifest profile per
  published figure: source page/bbox provenance, original-image hash,
  panel logical id, review/render status, accessibility description
  review status, hash-based dependency invalidation. Non-core: no
  grammar impact; currently served by a private downstream sidecar.
  Post-freeze profile work, v0.2+.
- `ACCESSIBILITY-PROFILE`: **accessibility contract profile** (`ACCESSIBILITY-PROFILE`, 2026-07-26) — a
  normative profile covering SVG `role="img"`, non-visual `<title>`
  (distinct from the `TITLE-RENDER-DEFAULT` visual-title render option), `<desc>` semantic
  summary from reviewer-approved text (not free LLM generation), Markdown
  alt-text conventions, `aria-hidden` for decorative output, and
  validation severity per profile. New territory; profile-level, v0.2+.
- `TIMING-MEASUREMENT-ANNOTATIONS`: **timing measurement annotations** (`TIMING-MEASUREMENT-ANNOTATIONS`, 2026-07-27) —
  named timing parameters (setup, hold, cycle) spanning two signal events,
  with dimension arrows, edge-alignment guides, and cycle numbering. The
  timing genre has no construct that names a span between two specific
  signal events; floating text fails `MEANING-RECOVERY-SOURCE`. Direction: model a timing
  parameter as a named semantic relation between two signal-event locators
  (nth rising/falling edge of a named signal); renderer derives dimension
  arrows and guides automatically (prior art: WaveDrom anchor-and-relation
  model). Signal-event locators are part of the secondary-target family;
  design deferred to the v0.2 holistic targeting/annotation session.
  Downstream evidence: 4 downstream evidence figures affected, 2 outright
  unrepresentable (`TIMING-MEASUREMENT-ANNOTATIONS`). Interim: keep original raster + prose. All v0.2.
- `BYTE-UNIT-PACKET-BLOCKS`: **byte-unit packet-block figures** (2026-07-27) — downstream
  first authoring pass found one figure where `bitfield` was misused for
  a byte-sized header block diagram, producing a misleading bit ruler.
  First-party corroboration now exists: the project's own
  packet-encapsulation flagship example could not express byte-sequence
  order without geometry, and the accepted workaround is a single-row
  `table`, which works but reads as tabular data rather than as a packet
  on the wire. Open question: whether a byte-oriented sequence construct
  (or a scale-less bitfield mode using `word=8` with suppressed ruler) is
  warranted, or whether `table`/`node` remains the answer. Frequency
  evidence still pending from corpus measurement; the `table` workaround
  is sanctioned meanwhile. Cross-reference `CELL-EDGE-ANCHORS` (cell anchors) since
  the table workaround loses the ability to draw a relation to one field.
- `MEANINGFUL-ARRANGEMENT`: **declared meaningful arrangement** (`MEANINGFUL-ARRANGEMENT`, 2026-07-29) — there is
  no positional equivalent of `class`: no way for an author to assert "this
  arrangement carries knowledge, and here is what it says". Where the
  language has no construct for a spatial meaning — layer stacks (stack
  order, cross-layer alignment, via spans), memory maps, floorplans — the
  meaning can only be encoded in `pin`, and the two-zone contract
  (§3) then tells readers to discard exactly those lines. Direction ruled
  (spelling deferred to the v0.2 design session): the author declares in the
  content zone that the figure's arrangement is load-bearing and states in
  prose what it expresses; such a declaration SUSPENDS the default-ignore
  rule for that document (a reading agent MUST read the layout zone),
  and the prose statement is MANDATORY so the knowledge survives for a reader
  that cannot interpret coordinates — which is what keeps the standard above
  ASCII art. Genre constructs (`GENRE-EARNING-THRESHOLD`/`LOGIC-FLOWCHART-GENRE-SCOPE`) remain the destination for recurring
  spatial domains; layer/stack, memory map and floorplan are candidate
  genres, and the escape hatch is the bridge until they land. Diagnostic
  already shipped: `tools/strip-check.js` flags elements whose only relation to
  the figure is geometric — a document that trips it is either a semantics
  gap or an arrangement that needs declaring. v0.2.
  **Evidence note (2026-07-29 needs audit):** the proportional memory map is
  a distinct sub-case of `MEANINGFUL-ARRANGEMENT` — a figure whose primary knowledge is that a
  region occupies a given FRACTION of an address space, where area is the
  encoding. This is distinct from the lookup-table memory map (address values
  in cells), which is fully covered today. The audit's corpus arithmetic is
  approximate: memory-map figures were about 14% of the table-census slice
  (`TABLE-MERGE-SUPPORT`), and the table slice about 10% of the corpus, so on the order of 1%
  overall — small but a standard convention in hardware documentation.
  Confirmation of the exact count is needed before this sub-case triggers any
  new construct under `NEW-CONSTRUCT-EVIDENCE-GATE`.
- `QUANTITY-EXTENT-GENRE`: **a quantity-extent genre — candidate under `GENRE-EARNING-THRESHOLD` (2026-08-06,
  `QUANTITY-EXTENT-GENRE`)** — "a quantity extent carrying named reference values and named
  regions". The scalar-marker need is real, but it is **genre-shaped, not
  keyword-shaped**, and `GENRE-EARNING-THRESHOLD` governs: *"General constructs like `block`
  must not be over-stretched to satisfy it — doing so loses much of the
  original intent"*, and *"approximating a genre with general
  block-and-edge draws a similar picture while discarding the meaning:
  'looks right' is not 'expressed'."* The buffer-region figure that
  motivates this draws 11 sized nodes and three classes all named
  "region"; it looks right, and "these are the buffer's regions and their
  bounds" is not expressed anywhere a reader can find it.
  **Evidence (corpus measurement over two downstream trees, 643 `.fd`
  files, 163 module pages, two chip families):** ~22 figure-identities
  need it, concentrated in ~10 of 163 module pages and spread over ≥5;
  **12 of the 22 were never drawn at all** — the downstream
  "zero-Connect → GFM table" rule routed them away, because a
  threshold-scale figure **has no edges by nature** and so trips that
  rule every time. The need has its own vocabulary — thresholds, named
  regions, capacity bounds, guarantee floors, watermark quads — which is
  what `GENRE-EARNING-THRESHOLD` means by a genre earning its own words.
  **Prior art:** HTML's `<meter>`, defined as *"a scalar measurement
  within a known range"*, is exact.
  **`threshold` and `band` are the `GENRE-EARNING-THRESHOLD` INTERIM general constructs, and
  they are deliberately NOT frozen** (§2.6, §10). Freezing them would be
  the over-stretching `GENRE-EARNING-THRESHOLD` forbids and would foreclose this genre by
  binding two scene constructs to the compatibility promise. `GENRE-EARNING-THRESHOLD` supplies
  the interim in its own text: general constructs *"let the user at least
  draw the figure they want to express, so authors are never left without
  a way forward."* The 0.1 renames (`THRESHOLD-KEYWORD-SPELLING`/`BAND-LABEL-STATUS`) correct defects in
  them; they do not promote them. All v0.2+.
- `ANNOTATION-LOCATOR-SPLIT`: **the annotation family is TWO families — annotations and
  locators (2026-08-06, `ANNOTATION-LOCATOR-SPLIT`)**. Five open questions were filed against
  "the annotation family" and scheduled for one holistic v0.2 session
  (`ROW-INDEX-GUTTER`'s disposition). They do not share one design axis; they share
  two, and the split is what bounds that session:
  - **annotations** — *a body attached to a target*. W3C's Web Annotation
    Data Model frames it exactly: an annotation has "0 or more Bodies …
    1 or more Targets". This is `ROW-INDEX-GUTTER`'s **callout half** and `NON-GRAPH-ANNOTATION-NODE`.
  - **locators** — *the grammar for naming a sub-element as a target*.
    This is `CELL-EDGE-ANCHORS` (a table cell), `TAP-VERSUS-JUNCTION-SPELLING` (a point on an edge), `CONTIGUOUS-RANGE-GROUPING`
    (a contiguous element range), `TIMING-MEASUREMENT-ANNOTATIONS` (a signal event), and `ROW-INDEX-GUTTER`'s
    **gutter half**.
  Locators are **not annotation vocabulary**: edges need them too —
  `TAP-VERSUS-JUNCTION-SPELLING`'s junction case is real connectivity, not commentary — so the
  locator grammar must be designed ONCE and consumed by annotations,
  edges and whatever comes after. **Evidence that this is the live
  constraint, not a taxonomy:** the two WRED `table`-genre figures in the
  corpus need a threshold marker on a **table**, which has neither nodes
  nor groups; `in=` on `threshold`/`band` takes a node or a group id, so
  those figures cannot use the construct at all and became GFM tables.
  That is a **locator** problem, not an annotation one, and no amount of
  annotation vocabulary fixes it.
  **The v0.2 annotation target key must be `on=`**, not a third sense of
  `in=` — recorded in SYNTAX-STYLE §8.1, which holds the declared `in=`
  exception and the standing promise that a third sense is refused.
  Choosing `on=` **closes** that exception instead of deepening it.
  **Measured demand ranking (2026-08-06):** `note`/callout demand is
  roughly **3×** the scalar-marker demand — ~66 figure-identities (96
  instances across 32 figures expressed as workarounds, 48 across 34
  dropped entirely) and, decisively, **20 distinct annotation `class`
  declarations**: the same construct independently reinvented twenty
  times because the language has no `note`. If capacity exists for one
  v0.2 annotation construct, it is `note`. (Its spelling arrives as a
  borrow, not a coinage: UML/PlantUML `note`, Mermaid `note`, GFM
  `> [!NOTE]` — see vocabulary-sources.tsv.) All v0.2.
  **A LABEL is a sub-element, so LABEL COLOUR is filed here (
  `COLOUR-KEY-STATUS`/`LABEL-COLOUR-SOURCE`).** v0.1 has no label-colour key and will not gain one: the
  reason is structural, not demand. Measured on the reference engine, a
  `color=` on an `edge` coloured **all three** of `[tail]`, `[mid]` and
  `[head]` identically, and no syntax could tell them apart —
  `tailcolor=`, `midcolor=` and an in-operator form `-["M" color=…]->`
  are all line errors. So **every owner-level key that could be added
  today is the wrong shape**: it would foreclose the right design rather
  than approximate it. Graphviz is the worked precedent — it needed a
  SECOND key (`labelfontcolor`) the moment an edge carried more than one
  label. The colour has to attach to the LABEL, which is exactly the
  locator problem above: naming a sub-element as a target, the same
  problem as a table cell (`CELL-EDGE-ANCHORS`), a point on an edge (`TAP-VERSUS-JUNCTION-SPELLING`) and a
  contiguous range (`CONTIGUOUS-RANGE-GROUPING`). What makes the absence tolerable in the
  meantime is `LABEL-COLOUR-SOURCE`'s derived default (§5): the label colour is computed
  from the background it sits on, so it is right by construction on every
  fill an author can write, and the case that motivated an explicit key —
  light text on a dark box — needs no key at all.
- `POSITIONAL-VS-NAMED-ARGUMENTS`: **MAY a positional argument also be written as a named
  argument?** (2026-08-07, maintainer proposal — **v0.2, explicitly NOT
  for the v0.1 freeze**.) The proposal borrows Python's
  positional-or-keyword parameter model: an argument written without a key
  is read by standard position, and the same argument written WITH a key
  may appear in any order. So `field "Checksum" 16 present="C = 1"` would
  also be writable as
  `field name="Checksum" bitlength=16 present="C = 1"`. (The example <!-- fence-check: skip -->
  originally used the bare flag `optional`, spelled `conditional` when the
  question was written; `PRESENCE-FLAG-SPELLING` reverted that and `PRESENCE-CONDITION-EXPRESSION` replaced
  the flag with `present=`, which removes one of this
  question's two motivating cases — see `POSITIONAL-FLAG-SPELLING`.)
  **What it buys:** `bitlength=16` is self-documenting where a bare `16`
  is not — a real readability gain for machine-generated content and for a
  reader who does not know the grammar — and order-independence removes a
  failure mode from the generating side.
  **The tension that must be resolved before it can be adopted**, stated
  rather than softened: it collides head-on with SYNTAX-STYLE RULE 5 —
  *two forms of one construct are justified ONLY when each accepts input
  the other cannot express; if both forms have the same accepted-input
  set, one is a spelling variant and MUST be retired.* `field "A" 8` and
  `field name="A" bitlength=8` produce an **identical model**, and <!-- fence-check: skip -->
  order-independence is not new input — it is the same input in a
  different order. **Under the project's own test this fails as a spelling
  variant.** Adopting it therefore requires either a stated exception with
  its cost written out, or a demonstration that the named form accepts
  something the positional form cannot.
  **Prior art, and one caution.** HTML/XML is **not** a precedent for the
  hybrid: it has no positional form at all, so it is a precedent for
  keyword-ONLY. Every diagram language surveyed uses the shape FigDown
  already has — a small number of positionals (the id, the label) plus
  keyword options: DOT (`node [label=…, shape=…]`), Mermaid, D2, TikZ.
  None makes its positionals nameable. Python's own experience is the
  caution: it later had to add `/` and `*` markers to force parameters
  positional-only or keyword-only, because **once a parameter name is
  public as a keyword, renaming it is a breaking change**. For FigDown
  that means `bitlength=` enters the compatibility promise the moment it
  ships — and the v0.1 freeze renamed a dozen keys precisely because their
  first names were wrong (`SIZE-AND-DIRECTION-KEY-NAMING`, `TIMING-LANE-ALPHABET`–`THRESHOLD-KEYWORD-SPELLING`).
  **What a v0.2 evaluation must answer.** (1) Does the named form accept
  any input the positional form cannot? (2) If not, what exception
  justifies two spellings, and what does that exception cost applied
  consistently to every directive? (3) Which names become frozen public
  API, and are they the right names — noting that `bitlength=` is itself a
  naming decision that has never been reviewed.
- `POSITIONAL-FLAG-SPELLING`: **SHOULD bare positional flags become option keys carrying a
  value list?** (2026-08-07, maintainer proposal — **v0.2, explicitly NOT
  for the v0.1 freeze**.) Separable from `POSITIONAL-VS-NAMED-ARGUMENTS` and, in the maintainer's
  judgement, **the stronger half**. **One of its two cases has since been
  settled by other means:** `optional` on a `bitfield` `field` became the
  option key `present=` (`PRESENCE-CONDITION-EXPRESSION`) — carrying a condition rather
  than a value list, so the flag family did not survive to need a list.
  What remains is `highlight` (on a `table` `cell`), and any future flag.
  The proposal spells a flag as an option key carrying a comma list:
  `cell 1 attributes=highlight`. <!-- fence-check: skip -->
  **Why this is the stronger half.** A bare flag cannot grow.
  `attributes=optional,deprecated` is expressible; two bare flags are
  not — bare words have no terminator, no order, and no way to say "no
  attributes". This is RULE 3.1 (`POSITIONAL-LIST-SPELLING` — *a variable-length list needs
  an explicit terminator so the line end stays free for future `key=`
  options*) applied to FLAGS rather than to lists, and it needs **no**
  two-form exception: it replaces one spelling with another rather than
  adding a second, so RULE 5 is satisfied outright.
  **What a v0.2 evaluation must answer.** (1) Is `attributes=` the right
  key name, or should each flag family have its own key? (2) Do the flags
  of different genres (today only `highlight` on `cell`, plus whatever a
  future genre adds) belong in one namespace or separate ones — `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` makes option keys
  per-genre, so one spelling could carry different value sets per genre.
  (3) Migration is mechanical and small (in-repo only), but it is a
  frozen-surface change and therefore owes a MIGRATIONS entry and a named
  diagnostic.
- `IDENTITY-ASSERTION`: **identity assertion** ("these two elements are the same entity")
  (2026-07-29 needs audit) — there is no equivalence or alias relation in
  FigDown: `class` asserts shared CATEGORY, not identity. This gap was the
  strongest finding of the 2026-07-29 needs audit: two independent audit
  slices converged on the same missing concept. *Structure slice*: one real
  component appearing in two views (e.g. a table participating in both a
  control-plane and a forwarding-plane view within the same document) must
  today be duplicated as two nodes joined by a prose-labelled edge — a
  reading agent counts two entities. *Data slice*: the same register field
  shown under two bit-numbering conventions, or a register field reused
  across two layered views, can only share a `class`, which asserts shared
  CATEGORY, not shared IDENTITY. Analysis: `class` is category membership;
  there is no equivalence/alias relation. Under `MEANING-RECOVERY-SOURCE` a reader derives meaning
  from constructs, so "same thing shown twice" is currently unrecoverable.
  `NEW-CONSTRUCT-EVIDENCE-GATE` status: semantic impossibility is arguable and the convergence of two
  independent slices on the same gap is real evidence, but corpus FREQUENCY
  has not been measured — the ruling trigger is a targeted count of
  dual-view/dual-context figures. Prior art to survey: identity/alias
  mechanisms in modelling languages (UML's object identity across views,
  SysML parts), and how ERD tools handle the same entity appearing in
  multiple diagrams. All v0.2; pending frequency measurement.
- `BITFIELD-UNION-VARIANTS`: **union/case bitfields** (`PRODUCTION-CORPUS-MEASUREMENT`, 2026-07-30) — CORRECTNESS trap:
  `break` rows currently read as one contiguous bit sequence, so a
  register whose bits have mutually exclusive encodings (e.g. eight
  prefix-selected interpretations of an 18-bit field) computes the
  wrong cumulative width when each encoding is expressed as a separate
  `break` row. A conforming reader following §4.1 gets confidently wrong
  bit-width values with no warning. Candidates: (a) a union/case marker
  on the `bitfield` block so rows are offset-independent; (b) a declared
  total width so mismatched field sums are a line error. Both under
  evaluation; interim: express each encoding alternative as a separate
  `bitfield` block. Priority: high (CORRECTNESS; zero-warning parse
  failure). All v0.2.
- `NON-GRAPH-ANNOTATION-NODE`: **annotation node that does not join the graph** (`PRODUCTION-CORPUS-MEASUREMENT`,
  2026-07-30) — a floating explanatory block that comments on the
  figure as a whole without being a participant. Authors today use an
  orphan dashed node, which `strip-check.js` flags as a warning and
  which a reading agent counts as a participant, corrupting topology
  descriptions. Distinct from `ROW-INDEX-GUTTER` (attached callouts with a target):
  the floating comment addresses the entire figure with no target.
  Candidate: a `note` or `comment` construct that is layout-visible but
  semantically outside the participant set. Priority: medium. All v0.2.
  **Measured corroboration (2026-08-06, `SHAPE-ENUM-VOCABULARY` — filed under `NON-GRAPH-ANNOTATION-NODE` rather
  than as a new OQ, because it is the same gap)**: while removing
  `shape=cloud` from the enum, every downstream use of that shape in a
  production corpus was inspected. All but one were domain icons
  (labels naming a network, a transport, a fabric). The exception was a
  node whose label is several lines of explanatory field values — a
  callout, not a participant — where the author had borrowed the cloud
  purely to get a shape that reads as a comment bubble. This is
  evidence of a kind the sanctioned-workaround note above does not
  have: the author did not reach for the dashed orphan node the interim
  guidance suggests, they reached for a DIFFERENT SHAPE, because no
  construct in the language says "this is an aside". The retirement
  leaves that use with no replacement at all, which raises this OQ's
  priority from medium: it is now a documented capability loss, not
  only an ergonomic gap. Design still deferred to the v0.2 holistic
  annotation session with `ROW-INDEX-GUTTER`/`CONTIGUOUS-RANGE-GROUPING`/`CELL-EDGE-ANCHORS`/`TAP-VERSUS-JUNCTION-SPELLING` — this note records the
  measurement, not a proposal.
- `REPEATED-SUBGRAPH`: **repeated subgraph / instantiation** (`PRODUCTION-CORPUS-MEASUREMENT`, 2026-07-30) —
  no construct exists to declare that a sub-structure of K nodes and M
  edges appears N times; authors must spell out all N copies in full.
  Structural sibling of the multiplicity candidate in `AUTHOR-INTENT-AUDIT` §7(a) (K=1,
  M=0); the two should be designed together. A reading agent can infer
  structural isomorphism but cannot recover the author's intent that
  these are instances of one pattern, not independently authored.
  Priority: medium (authoring burden; reading agents tolerate but do
  not identify repetition structure). All v0.2.
- `BITFIELD-REPETITION-CONSTRUCT`: **`bitfield` had no repetition construct, and still has no way to
  derive a count from another field** — a **DEFECT the project owes a fix
  for**, not a limit it chose (2026-08-07, `BITFIELD-REPETITION-CONSTRUCT`; the first half is fixed, see the end of this entry). *As filed:* a repeated element must be spelled out
  as N literal `field` lines, and nothing in the model says the list is a
  sample rather than the whole. Hits, measured in this repository's own
  corpus: `srh.fd` (RFC 8754's Segment List is `Last Entry + 1` addresses and
  the file writes two, `[0]` and `[n]`, with `Last Entry` declared as an
  ordinary 8-bit field that nothing links to the list); `mpls.fd` (RFC 3032's
  label stack is 1..n entries terminated by S=1; the file writes exactly two
  and the model asserts two); `dns.fd` (QDCOUNT/ANCOUNT/NSCOUNT/ARCOUNT are
  literally the repeat counts for four repeated sections, with nothing
  linking them). **This is the one gap that degrades to a *confidently
  wrong* number** rather than to "unknown", which is why §12.7 carries a
  MUST NOT about it rather than leaving it to the genre doc.
  **Prior art, and why it does not rescue this.** All three of `bitfield`'s
  own declared sources — RFC packet ASCII art, WaveDrom bitfield JSON,
  Mermaid packet-beta — have **no repetition construct at all**. The one
  notation in this space that solves it is
  **draft-mcquistin-augmented-ascii-diagrams** (`[Blocks]` plus a constraint
  expression over sibling field names, ABNF in its Appendix A.1), and that
  draft **expired in 2024 and was never WG-adopted**. Every mature answer —
  Kaitai Struct `repeat-expr`, DFDL `occursCount`, Scapy `count_from` — lives
  in a parser/schema notation that draws no picture, so borrowing one would
  import a schema language into a figure language. Designing this needs the
  locator problem (`ANNOTATION-LOCATOR-SPLIT`) solved first, because a count field must be
  NAMEABLE. All v0.2.
  **HALF CLOSED (`BITFIELD-REPETITION-CONSTRUCT`). The repetition construct exists:
  `index=`.** A field may now declare that it is one element of a run and give
  the run's index range, the model records it as a key rather than as bracket
  text, and the drawn elision is derived from it
  ([genres/bitfield.md](genres/bitfield.md), §12.7). Where both ends are
  literal the run is DETERMINATE, so the count is in the document and every
  later offset is computable again — the arithmetic this entry said was
  destroyed. `srh.fd` is the first adopter and no longer writes `[0]` and
  `[n]` as two fields; the first element, the elision row and the last element
  RFC 8754 draws are all derived from the one key rather than unwritable
  (`REPEATED-RUN-DRAWING`, 0.1 — until then only one element was drawn).
  **What is still open is the OTHER half, and it is one thing rather than
  four: a value cannot NAME another field.** `index="0..Last Entry"` leaves
  the last index as prose because the language cannot resolve `Last Entry` to
  the field of that name, so `srh.fd`'s run stays indeterminate — reached now
  from SYNTAX rather than from label text, which is the whole of what
  changed there. `dns.fd`'s QDCOUNT/ANCOUNT/NSCOUNT/ARCOUNT are the same gap
  in its purest form: four literal repeat counts with nothing linking them to
  what they count. `mpls.fd` is a third shape — a run terminated by a
  CONDITION (S=1) rather than by a count, which no index range can state
  either. All three are downstream of **`ANNOTATION-LOCATOR-SPLIT`**, the locator problem, and
  this entry is carried forward as the record of what `index=` did not
  solve. All v0.2.
- `BITFIELD-RANGE-WIDTH`: **a field width may not be a RANGE** — a **DEFECT**, not a
  documented limit (2026-08-07, `BITFIELD-REPETITION-CONSTRUCT`). A `field`'s width is a fixed integer
  or `*`, and `*` means "fill the remainder of the current row": a **drawing
  instruction**, not a fact about the wire. Real headers state ranges as
  facts — Ethernet payload 46–1500 bytes, IPv4 Options 0–40 octets, IPv4
  Padding 0–24 bits, TCP Options 0–320 bits, QUIC's variable-length integers
  1/2/4/8 octets — and the language cannot say any of them. **13 corpus
  fields carry range language in their label or description while declaring a
  fabricated fixed width.** The sanctioned interim expression is
  to use `*` where it is honest and otherwise to state the real extent in the
  label AND in a `class` meaning, which is in the model (§12.7) — never to
  substitute another invented number. Note that this is **not** the "at most
  one `*` per block" question: that rule is about the drawing,
  and relaxing it would not let a document state 46–1500. All v0.2.
- ~~`EDGE-GEOMETRY-CONSTRUCTS`: **`LAYOUT-ZONE-NAMESPACE` reserves `path` and `routing` language-wide, and both are
  ordinary general-purpose words**~~ — **CLOSED (`EDGE-GEOMETRY-CONSTRUCTS`)**
  (filed 2026-08-07 under `LAYOUT-ZONE-NAMESPACE`). **The reservation is gone because the
  reserved words are gone.** `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and `routing` from the
  language outright (§1 `LAYOUT-ZONE-NAMESPACE`, §3, §10), so the layout zone now contains
  **`layout`, its `UNIVERSAL-CORE-KEYWORDS` opener, and `pin`, `LAYOUT-ZONE-NAMESPACE`'s one remaining member — and
  nothing else** (§10 (a′)), while both withdrawn spellings are
  **RELEASED**:
  they belong to no namespace, and a future genre may claim either as its
  own keyword under `GENRE-VOCABULARY-OBLIGATION` through the ordinary `NEW-CONSTRUCT-EVIDENCE-GATE` gate.
  **The sharpest case, stated because it is what made the exposure real.**
  POSIX / ISO 9945 spells a filesystem pathname `path`. A future tree or
  filesystem genre would therefore have been **REQUIRED by SYNTAX-STYLE
  RULE 4.1 — take the standard's own spelling — to use a word `LAYOUT-ZONE-NAMESPACE` had made
  permanently unavailable**, with no legal way to satisfy both rules. That
  conflict no longer exists.
  **The surviving half is the mild one.** `pin` is still reserved
  language-wide and still spent: no genre may ever define it, for any
  meaning. `EDGE-GEOMETRY-CONSTRUCTS` called that the mild case when it filed it, and closing
  the entry does not retract the reservation — it only shrinks it from
  three spellings to one.
  **The exposure as filed, kept as the record of what was foreseen (a
  deleted rejection is a trap).** *Filed as an
  exposure, not as an action.* `LAYOUT-ZONE-NAMESPACE` (§1) made every layout-zone keyword
  genre-independent, which means its spellings are spent: no genre may ever
  define `pin`, `path` or `routing` as its own keyword, for any meaning.
  `pin` is the mild case — few figure kinds want the word for anything else.
  The other two are not mild, and the reason is what FigDown IS.
  **FigDown is a general-purpose figures-as-text standard; it aims to cover
  ALL figures.** The corpus that exercises it today happens to be network and
  protocol figures, but that is a fact about the corpus, not about the
  language's scope, and nothing in this section should be read as scoping the
  project to one domain. **A general-purpose standard has just reserved a
  general-purpose word.** `path` is wanted by filesystem and directory trees,
  by state machines, by flow and decision diagrams, by geographic and route
  figures, by call graphs — by whole classes of figure this language has not
  been asked to draw yet. `routing` carries the same exposure one step
  behind, and is additionally recorded in `vocabulary-sources.tsv` as a
  loaded domain word kept with the reasoning on file (`EDGE-LINE-SHAPE-KEYWORD`).
  `UNSAFE-DEFAULT-ELIMINATION`'s retirement of `route` already turned on a version of
  this argument.
  **Measured exposure (2026-08-07).** Every `path`/`routing` directive line
  that exists: **13** in three in-repo `.fd` files
  (`examples/showcase/tcp-state-machine.fd`,
  `examples/reference/experimental/block-experimental.fd`,
  `examples/statechart/dhcp-client.fd`), plus the conformance fixtures that
  pin the constructs — 15 fixture files, 33 directive lines — and
  **zero** lines in downstream production adoption. Two consequences follow,
  and both belong in the record rather than in a decision today:
  1. **Today is the cheapest point in this project's life to change these
     spellings.** Nothing downstream depends on them, no compatibility
     promise covers them (they are EXPERIMENTAL, §10), and no migration entry
     is owed. **The cost begins rising the moment the freeze is published**
     and downstream adoption starts.
  2. **Renaming is near-free; DROPPING them is not.** The three in-repo
     figures use rigid edge geometry for state-machine transitions, so
     removing the constructs would change their rendered output. Any future
     proposal to drop rather than rename must budget for that.
  **Why this is filed now rather than settled now.** Settling it would mean
  designing the edge-geometry vocabulary ahead of the evidence, which is the
  `NEW-CONSTRUCT-EVIDENCE-GATE` gate's own objection to premature vocabulary. The maintainer's decision
  for 0.1 is that `path` and `routing` **stay** in the layout
  namespace as genre-independent EXPERIMENTAL members; the rename question is
  **deliberately deferred to before the freeze is published**, and this entry
  exists so that the decision can be made then without re-deriving any of it.
  **Trigger for revisiting — whichever comes first:** (a) any genre proposal
  that wants `path` or `routing` as its own keyword, (b) the design of the
  edge-geometry / annotation family (`ANNOTATION-LOCATOR-SPLIT` is its neighbour), or (c) freeze
  publication, which is the last moment the change is cheap. The choices then
  are three, and all three are decisions rather than defaults: rename the
  layout-zone member, grant the proposing genre a different spelling, or
  accept the reservation knowingly.
  *(End of the exposure as filed.)* **What actually happened:** trigger (c)
  arrived first and a fourth choice presented itself that the entry had not
  enumerated — remove rather than rename or keep. The drop budget point 2
  demanded was then **measured** rather than assumed, and it came in smaller
  than the entry expected: removal *improved* two of the three affected
  figures on the project's own layout metric and left the third unchanged
  (numbers in `EDGE-IDENTITY-AND-GEOMETRY`). The requirement the two constructs served is not
  closed with them; it is carried forward as **`EDGE-IDENTITY-AND-GEOMETRY`**, immediately below.
- `EDGE-IDENTITY-AND-GEOMETRY`: **the language cannot ask for an elbow, and has no way to name
  the edge it would ask about** (2026-08-07, `EDGE-GEOMETRY-CONSTRUCTS`). **This is a
  requirement on file, not a note that something was deleted.** FigDown
  has no construct for **orthogonal (elbow) edge routing**, and none for
  **controlling it per edge**. Both were expressible until this release —
  `routing orthogonal|straight` figure-wide and `routing=` on a `path` — <!-- fence-check: skip -->
  and `EDGE-GEOMETRY-CONSTRUCTS` withdrew the pair with their host directive. The need did not
  go with them.
  **The shape of the answer is already known, and a future design does
  NOT need to re-run the survey.** A source-graded prior-art study of
  Visio (VSDX / the MS-VSDX XSD), draw.io / mxGraph, Graphviz and ELK —
  **216 graded claims, 77% quoted from primary sources** —
  found a **narrow stable intersection**, and routing sits inside it:
  **exactly two modes** (`orthogonal`, `straight` — "these two names, and
  only these two, appear in recognisable form in all four") and **exactly
  two scopes** (a figure-level default and a per-edge override; 3 of 4,
  Graphviz having only the graph level). Everything past those two names
  is *not* shared — four systems, four disjoint value sets, differing by
  about 6× in cardinality and disagreeing on whether the set is open or
  closed — so a design that adds a third mode is designing without prior
  art, and a design that stops at two is not. Full derivation:
  decisions/registry.md
  **The blocker is edge identity, and it is why this is an open question
  rather than a pending re-add.** A per-edge override has to *address* an
  edge, and FigDown has **no edge-identity construct**. The mechanism it
  used instead — **restating the edge to refer to it**, `path a -> b` <!-- fence-check: skip -->
  matching the edge as written — is the one identity option that
  **cannot grow**: it cannot address parallel edges (which the language
  had to make a line error for the reference alone), it cannot carry more
  than one attachment per edge, and it leaves a future annotation or
  locator grammar (**`ANNOTATION-LOCATOR-SPLIT`**) with nothing to point at. The prior art
  rules on this directly: **Graphviz uses the same restate-to-refer
  mechanism and makes it sound only by forbidding the case that breaks
  it** — its `strict` graph, which "forbids the creation of multi-edges"
  **graph-wide**. That is a language-wide commitment FigDown has never
  made and never scoped; it declared parallel edges out of scope for one
  directive's reference instead. Edge identity is *inside* the stable
  intersection and *absent* from FigDown, which makes it the first thing
  to design, not the last: parallel edges, more than one attachment per
  edge, sub-element endpoints, per-edge annotation and `ANNOTATION-LOCATOR-SPLIT`'s locators
  are all downstream of it.
  **What is deliberately given up, said as a loss and not as a
  simplification.** The **per-edge routing scope was INSIDE the
  intersection** and is surrendered anyway, because it had no host line
  left to ride on once `path` went. It is to be restored *properly*, once
  edges are addressable — not bolted back onto a restated triple. Its
  measured cost today is **one working line**: of the 8 in-repo
  `routing=orthogonal` writings, **6 are provable no-ops** — including the
  line in the reference figure whose own comment advertised it as the
  demonstration of per-edge override — and only one of the 8 is a line
  that did work.
  **Measured baseline, recorded so a future "is it worth adding back?"
  has a control group.** At withdrawal: **13** directive lines across
  **3** in-repo `.fd` files; **33** directive lines across **15**
  conformance fixture files; **zero** lines of downstream production
  adoption; and **6 of 8** `routing=orthogonal` writings provable no-ops.
  A behaviour audit found **four defects, every one of them in a part
  nobody exercised** — including a **published artifact whose labels are
  clipped**, because canvas growth on the waypoint path was one-sided.
  **Render quality, measured on the project's own linter**
  (`tools/layout-lint.js`, lower is better): removing both constructs took
  `examples/statechart/dhcp-client` from **23 to 8** — the bare strip scores
  **6**, but that is the version whose transition labels print over the node
  boxes, which the linter does not measure, so the figure was opened out and
  the number was checked against the picture rather than instead of it — and
  `examples/reference/experimental/block-experimental` from **4 to 2**;
  `examples/showcase/tcp-state-machine` scored **2 either way** and was
  re-authored with content-zone means (`rank`, `flow`, declaration order,
  `pin`) after a rendered visual comparison. So the constructs were not
  paying for themselves on the figures that used them.
  **What is NOT in the intersection, so a future design does not spend
  effort re-deciding it.** (a) **Author waypoints** — modelled by only
  **2 of the 4** systems (mxGraph `points`, ELK `bendPoints`), and those
  two disagree on the behaviour that matters: when an endpoint moves,
  mxGraph **leaves the waypoints behind** and ELK **carries them**. Visio
  has no waypoint concept at all. A disagreement about what happens when
  a node moves is a disagreement about semantics, not spelling. (b) **The
  dock realisation FigDown shipped** — a fraction on the EDGE is
  **mxGraph-only**; **written-order attachment has zero prior art in any
  surveyed system** (mxGraph and Graphviz both attach by semantic role);
  and draw.io's own documentation states that a dock fraction denotes a
  **location** — `(0.5,0.5)` is the centre — while ray-through-centre
  projection is a **separately flagged mode**. FigDown collapsed two
  attested axes into one key and then attached by written order. The
  *concept* the keys named — attachment to a **named site declared on the
  node**, addressed by **semantic role** (tail/head), denoting a
  **location** — is unanimous across all four and is inside the
  intersection; only this realisation of it was outside.
  **Scope note, because it is easy to misread this entry.** FigDown is a
  general-purpose figures-as-text standard and aims to cover ALL figures.
  Elbow routing is wanted by flowcharts, state machines, block and rack
  diagrams, org charts, circuit and piping schematics — by whole classes
  of figure, not by any one subject domain. Nothing here scopes the
  requirement to the corpus that happened to exercise it.
  **Reopen trigger — either one suffices:** (a) an **edge-identity
  construct** is designed, which unblocks the per-edge scope and `ANNOTATION-LOCATOR-SPLIT`
  together; or (b) the **edge-geometry family** is designed as a family
  (`ANNOTATION-LOCATOR-SPLIT` is its neighbour). Until one of those, adding a routing mode
  back would be designing the second storey first. All v0.2.
- `INDEX-KEY-NAMESPACE-CONTENTION`: **`index=` is spent in `bitfield`'s namespace, and the per-row
  gutter may not reuse it** (2026-08-08, `BITFIELD-REPETITION-CONSTRUCT`). **Filed under SYNTAX-STYLE
  RULE 4.7, as 4.7's own text requires**: 4.7 is a tie-breaker, not a veto,
  and where it loses it converts to an open question filed against the
  choice. It lost here to RULE 4.1 — `index` is single-sourced and verified
  in the IEEE 1685-2022 schemas (see
  [genres/bitfield.md](genres/bitfield.md)), and 4.7 does not outrank an
  attested spelling. What the choice costs: `ROW-INDEX-GUTTER`'s gutter, which this
  document named `index=` from its filing until this release, must be spelled
  something else, and no genre may give `index` a second meaning while it is
  live (RULE 4.3). **The cost looks smaller than it did**, and the reason is
  in `ROW-INDEX-GUTTER` above: `ANNOTATION-FAMILY-SEQUENCING`'s gutter evidence is 100% ADDRESSES, and `address` is
  registered nowhere, so the evidence argues for
  `address=` independently of what `index` is doing. This entry does not rule
  on that — it records that the gutter must now be named on its own evidence
  rather than by reaching for the obvious word. Closes when the v0.2
  annotation session names the gutter. All v0.2.
- `INDEX-RANGE-STEP`: **`index=` has no STEP, and the reason it was deferred is supply,
  not demand** (2026-08-08, `BITFIELD-REPETITION-CONSTRUCT`). `index=0..7` walks the integers one at a
  time; there is no way to say "every other element".
  **Measured: 0 of 9 stepped element indices** across the corpus, verified by
  a targeted second pass, with **one false positive corrected** — a 16-byte
  element spanning four word-rows is not a step. Descending needs no step
  either: `first > last` carries it (`index=53..0`).
  **The caveat is filed WITH the entry, because a bare count here would be
  misleading.** The corpus **has never been taught the construct** — `index=`
  did not exist when it was written — and that is `STROKE-KEY-STATUS`'s failure shape
  exactly: `stroke=` was demoted on a count of 5 taken from a corpus that had
  been taught not to use it, and the cause was recorded as **supply, not
  demand**. A zero measured against a vocabulary nobody had is weak evidence
  and is recorded as such.
  **Reopen triggers, both chosen so that they do not require a user to ask
  for something they cannot know exists:** (a) re-measure after `index=` has
  been taught for one full release; or (b) any single figure whose element
  index skips values.
  **The extension is verified and reserved, so a future session does not
  re-derive it.** `index="0..7 step 2"` — the Kotlin/Ruby inclusive-range
  family's own spelling — needs **no new key**, and it rests
  on the determinacy rule of §12.7: determinacy is decided by parsing both
  ends, **never by quoting**, so a quoted value carrying a `step` clause is
  free of the KEY question. Were quoting ever made semantic on this key, that
  half would stop being free — which is why that rule is normative rather than
  an implementation detail. All v0.2.
  **CORRECTED (`RULE-POSITION-ENUMERATION`): this entry said "no new key and no
  MIGRATION", and the second half was false.** `parseIndexRange` accepted any
  non-empty string as a prose `<last>`, so `field "S" 8 index="0..7 step 2"`
  was **already a legal document** — model `{first:0, last:"7 step 2"}`,
  the drawn index `[7 step 2]`. `step` was therefore not an unclaimed slot but
  an OCCUPIED one, and shipping the step meaning later would have changed what
  an existing legal document MEANS. Worse, no engine could have separated
  "prose that happens to read like a step clause" from "the author meant the
  extension" — the `color=` failure shape (`COLOUR-KEY-STATUS`), which this project treats as
  its worst.
  **The reservation, not the measurement, is what makes an extension free.**
  0.1 makes a bare lowercase `step` token in a prose `<last>` a line
  error, exactly as `;` was reserved (`SEMICOLON-STATUS`) and for the same
  reason. The trigger, its limits, and the two migration rewrites are in
  MIGRATIONS 0.1. This entry's own measurement — 0 of 9 corpus figures
  with a stepped index — is what made the reservation cost nothing today, and
  that is the general lesson now on the record: **an extension is free only
  when the syntax carrying it is RESERVED, not merely UNUSED.** A future OQ
  that files a spelling for a later release owes a reservation in the same
  release, or it is filing a migration it has not priced.
- `ERROR-RECOVERY-MODEL`: **error RECOVERY is unspecified, and it changes the error set**
  (2026-08-09). §8 says errors are reported in one pass and a
  document with errors renders nothing. It does not say what happens to the
  *rest* of a document after a line fails, and the answer is observable:
  a failed line abandons its declaration, so a later reference to it raises
  a **second, cascaded** error. An implementation that recovers by keeping
  the failed declaration reports one error where the reference engine
  reports two — on inputs whose fixtures are about something else entirely.
  **Two inconsistencies are recorded so a future design does not have to
  rediscover them.** (a) A bad option on a typed-block opener sometimes
  opens the block and sometimes does not (`numbering=zzz` does,
  `class=` on a `bitfield` does not, and the second therefore fails every
  child line as well). (b) Duplicate-versus-bad-value precedence resolves
  in **opposite directions** on two constructs that are otherwise siblings:
  `width` reports `duplicate width` and swallows the value error, `pin`
  reports the value error and never fires `duplicate pin`. Neither
  asymmetry has a stated reason; both are frozen in goldens.
  **What resolving this needs**, in order: a recovery model in §8 (abandon
  vs. keep, and whether a cascaded error is suppressed), then a precedence
  rule (first-error-wins or duplicate-wins, one of them, everywhere), then
  fixtures that make each an obligation rather than an observation. Doing
  it in that order matters, because changing recovery **changes existing
  goldens** and is therefore a MIGRATIONS-entry change under §13, not a
  bug fix. §8.3 states the position for v0.1: the goldens pin the
  reference engine's recovery, and this is the one place the suite is not
  reachable from the normative documents by reasoning alone. v0.2.
- `COLSPAN-EMPTY-CELL-SPELLING`: **the table colspan is spelled by an INVISIBLE character, and `TABLE-ROW-SYNTAX`
  already argued against exactly this** (2026-08-09). The rule is
  that a pipe-row cell whose RAW segment is empty — zero characters between
  the two `|` — is a colspan-left. `| A || B |` is a spanned header;
  `| A |  | B |` (whitespace between the pipes) is three ordinary cells. The
  encoding is INJECTIVE and both readings are pinned as goldens, so nothing is
  ambiguous. Three things follow, and all three are the entry:
  **(a) It was documented nowhere normative.** `genres/table.md` said only
  "`||` colspan-left", which reads as a token an author types; the actual
  rule — an empty RAW segment — appeared only in `vocabulary-sources.tsv` and
  in a passing clause of a MIGRATIONS rewrite rule. The word "empty" did not
  appear in `table.md` at all, and §12.3 enumerated every place absence
  carries meaning **without listing table cells**. Closed: the
  rule is now stated in §12.3 and in `genres/table.md`, where an author meets
  it.
  **(b) The ABNF cannot express it.** `cell-content = *( … )` admits the empty
  production, so the grammar cannot distinguish the colspan from an empty
  cell; the distinction lives in prose and in the goldens only.
  **(c) A FORMATTER DESTROYS IT.** Padding `||` → `| |` turns a two-tier
  header with two colspans into four independent single-column headers: no
  error, a different model, a different figure. That is a **`RENDERING-DETERMINISM` stability
  break through an ordinary tooling pass**.
  **And the project made this argument against itself.** `TABLE-ROW-SYNTAX` — the decision
  that ADOPTED `||`/`^^` — rejected whitespace-as-alignment *in the same
  paragraph*, on the grounds that *"formatters like Prettier pad cells
  arbitrarily"* and that *"invisible characters carrying semantics is a
  classic failure mode (Makefile tabs) and a hallucination source for LLMs"*.
  Both arguments apply verbatim to the rule `TABLE-ROW-SYNTAX` adopted. Before this release
  this was acknowledged in **no** spec, design or conformance document and in
  none of `INDENTED-BLOCK-SUGAR`..S40.
  **This is filed, not fixed, and the reason is stated rather than implied.**
  Changing the colspan spelling is a language change in a FROZEN genre, and
  every alternative costs something: an explicit token (`>` or `<`, multimd's
  own alternative) spends a mark language-wide (RULE 4.5's price clause); a
  `span=` option on a `cell` line moves the span out of the row it describes
  and breaks the "the pipe row IS the table" property; forbidding
  whitespace-only cells makes the two spellings one and loses the ordinary
  empty cell. **What would resolve it**, in order: measure whether any
  real-world Markdown formatter in the corpus's tool chain actually rewrites
  FigDown fences (the hazard is real but its FREQUENCY is unmeasured); then,
  if it does, price the three alternatives above against a v0.2 migration.
  **A cheap partial mitigation is proposed and deliberately NOT landed:** a
  lint that reports a pipe row containing a whitespace-only cell in a
  document that also contains a `||` colspan, since that combination is the
  signature of a half-padded row. It is a diagnostic, not a language change,
  and it belongs in `tools/`, not in the engine — filed in
  `decisions/registry.md`. v0.2.
- OQ-S42: **several INDEPENDENT cells cannot be marked as one thing**
  (2026-08-11). `class=` attaches to one `cell` and to one `field`, so
  four adjacent cells that share a class draw **four separate rings**, not one
  frame around the four. A MERGED region does not have this problem — it is one
  cell, and the engine draws its mark as one ring around the whole region — so the
  gap is precisely: the language can say "these squares are ONE CELL" and can
  say "this cell means X", and cannot say "these several cells, still
  themselves, are one thing". The workaround is to merge them, which asserts a
  structural fact that may be false, or to accept the repeated ring, which
  reads as N marks rather than one. **This is a language gap, not a rendering
  defect**, and it is filed on that basis and deliberately not designed:
  nothing in the corpus has yet asked for it, and a construct for "these
  several things are one thing" is exactly the kind that gets invented once and
  spelled three ways. **It is the same shape as `BITFIELD-REPETITION-CONSTRUCT`'s open half** (a
  `bitfield` cannot say that a run of fields is one repeating RECORD) and as
  **`CONTIGUOUS-RANGE-GROUPING`** (curly-brace grouping over a contiguous range); whoever designs
  one should be shown all three, because one construct plausibly answers them
  and three separate ones would be the drift this project keeps paying for.
  **What would reopen it:** a measured figure in the production corpus that
  needs the outer frame and cannot honestly merge. v0.2.
- **A presence condition cannot reference a field** — `present="C = 1"`
  names `C`, and the language cannot resolve that to the `field "C"` three
  lines up: a bitfield field name is a **label**, not an id, and `class=` /
  `in=` are the only reference-shaped keys FigDown has. This is the same
  **locator** gap already filed as **`ANNOTATION-LOCATOR-SPLIT`**; it is cross-referenced here
  rather than duplicated. It is the reason `present=`'s value is deliberately
  opaque prose with no expression grammar (§12.7, `PRESENCE-CONDITION-EXPRESSION`).
- *Candidate recorded (2026-07-27)*: **class line-width extension** —
  one downstream evidence figure distinguishes active/standby links by
  stroke thickness; `class` `fill=`+`style=` approximates the semantics
  today but cannot express thickness. Candidate addition: stroke width as
  an additional `class` presentation vocabulary item (`stroke-width=`).
  Low priority; no corpus frequency measured.
- *Candidate recorded (2026-07-29, needs audit)*: **multiplicity /
  replication count on a scene node** ("×3 identical workers") — today
  a replication count lives in label prose, so a reading agent counts one
  participant and cannot distinguish "one instance" from "N identical
  instances". Prior art exists nearby: relation cardinality in ERD notations
  is already surveyed (`ERD-EXPRESSION-LEVEL`), but node-level replication is a different
  construct — cardinality labels an edge, replication counts a node
  itself. Frequency evidence needed before `NEW-CONSTRUCT-EVIDENCE-GATE` gate.
- *Candidate recorded (2026-07-29, needs audit)*: **machine-readable units
  and scale for numeric values** — today a unit is a substring of a column
  header or label text; a machine reader must parse free text to extract it.
  Maintainer's own skepticism recorded honestly: FigDown is a figure
  standard, not a data schema, and label text is a legitimate meaning carrier
  under `MEANING-RECOVERY-SOURCE`. This candidate needs strong frequency evidence before it clears
  `NEW-CONSTRUCT-EVIDENCE-GATE` — it must demonstrate that unit ambiguity causes actual semantic loss
  in real figures, not merely that structured units would be convenient.
- *Sequence-genre sharpening note (2026-07-29, for `GENRE-EARNING-THRESHOLD` §6 sequence
  candidate)*: beyond the ergonomics of a ladder syntax, the 2026-07-29
  needs audit surfaced a deeper semantic point. In the generic scene model
  there is NO construct asserting relative order between edges: today's
  practice numbers the labels ("1: …", "2: …"), which is a naming
  convention, and `MEANING-RECOVERY-SOURCE` disqualifies convention-in-prose as a meaning carrier.
  A sequence genre must therefore define message ORDER as first-class
  semantics — not merely provide a familiar spelling. Note also that the
  reserved dynamic keywords (`page`/`set`/`pulse`) model scene deltas, not a
  message time axis: they record what changes between states, not that
  message A precedes message B in a single scene. They do not close this
  gap. This sharpens the design requirement for the v0.2 sequence genre:
  temporal/causal ordering between messages must be stated in syntax, not
  inferred from label numbering.
- *Stroke style as a multi-axis semantic channel — candidate scoped-and-
  doubted (2026-07-29, engine-verified, cross-reference `PRESENTATION-AS-MEANING-CARRIER`)*: dashed-versus-
  solid is one of the most universal conventions in engineering figures, and
  authors reach for `style=dashed` believing they have stated something. By
  §5 and `PRESENTATION-AS-MEANING-CARRIER` they have not — presentation may render meaning but never carry
  it alone, so a reading agent is entitled to discard it. That makes bare
  `style=dashed` a foot-gun: meaning is silently lost at authoring time.
  Engine-verified facts: `field "K" 4 present=""` parses — the bitfield genre
  already has conditional presence as a FIRST-CLASS SEMANTIC construct, with a
  dashed border as its rendering (and a derived caption
  when a condition is stated); `node a "A" present=""` and <!-- fence-check: skip -->
  `edge a -> b present=""` are both line errors — the scene model has no <!-- fence-check: skip -->
  equivalent key.
  Engine-verified sanctioned expression today: `class standby "Present only
  during failover" style=dashed` plus `class=standby` on the node or edge —
  the class label carries the condition, dashed is its presentation, and a
  legend derives automatically (§2.7). Authors and agents MUST be told
  plainly that bare `style=dashed` asserts nothing.
  **Multi-axis analysis (2026-07-29 sharpening)**: stroke style is ONE visual
  channel carrying SEVERAL INDEPENDENT semantic axes: (a) presence /
  conditionality — always present vs conditional; (b) realization —
  physical vs logical/virtual (the defining distinction of overlay-network
  figures, where an overlay tunnel is drawn dashed over its physical
  underlay); (c) attachment — real relation vs annotation leader;
  (d) status — actual vs planned/prospective. These axes are INDEPENDENT and
  can conflict: two conventional figures may use dashed for opposite meanings
  and both be correct in their own domain. Therefore NO fixed
  stroke-to-meaning mapping can ever be right, and the standard must never
  bake one in. **Candidate direction revised**: `class` is not a transitional
  workaround — it is the PERMANENT general answer, because only the author
  can say which axis is in play and what the value means on that axis.
  Generalizing `present=` to scene elements would name just ONE axis and
  risks teaching authors that dashed means conditional universally — the
  opposite of the lesson. Record as scoped-and-doubted: if a scene-level
  `present=` is ever introduced it must be explicitly limited to the presence
  axis, must not be treated as "the dashed flag", and must coexist with
  `class`-declared meanings on the other axes. Maintainer's current leaning:
  keep the language smaller and let `class` carry all axes.
  **First-party evidence (this session, described generically)**: the
  project's own examples were found to carry seven dashed edges with zero
  `class` declarations — the physical-versus-logical distinction that is the
  whole point of an overlay figure was riding on stroke style alone. Same
  failure family as the arrangement-in-geometry violation recorded in `MEANINGFUL-ARRANGEMENT`/
  `AUTHOR-INTENT-AUDIT`: meaning parked in presentation. The examples are being fixed to
  declare classes. The pattern is a recurring authoring failure mode worth a
  future lint heuristic: an element carrying `style=` or `fill=` with no
  `class=` MAY be meaning-in-presentation (a heuristic, since decorative
  styling is also legitimate).
- *Audit confirmations (2026-07-29)*: the 2026-07-29 needs audit (see `AUTHOR-INTENT-AUDIT`
  in requirements-notes.md) verified the following as cleanly expressible
  today with no semantic gap: containment, category membership, hierarchy,
  adjacency-without-link, boundaries, ownership zones, ordered steps, loops,
  error categories, pipelines, event→action, precedence DAGs, bit-level
  layouts, structs, lookup tables, conditional/variable-length fields with the
  `BITFIELD-CONDITIONAL-OFFSETS` branch rule, dual bit-numbering conventions, proportions, thresholds,
  fill levels, timing lanes, and legends. These are settled; they do not
  require further evidence gathering.

## 10. Keyword registry, conformance modes, extensions

**Keyword registry (v0.1).** 22 top-level keywords, 6 typed-block child
keywords, plus the table-row line-start token `|`. (22 until this release,
when the three `flowchart` role keywords landed — the first genre-owned set
under `GENRE-VOCABULARY-OBLIGATION`, taking the count to 25; 0.1 removed one again by merging
`size` into `pin`, `ELEMENT-GEOMETRY-DIRECTIVE`; and 0.1 removed two by WITHDRAWING `path`
and `routing`, `EDGE-GEOMETRY-CONSTRUCTS` — 24 − 2 = 22, back to the 0.1 figure by a
different route.) **Every figure in that history read one lower until this release**, because `chart` (c′) had no registry entry at all — a
keyword the engine has accepted at the top level of every scene genre and
of `table`, and which the `GENRE-KEYWORD-ALLOWLIST` paragraph below already
named. A closed language's registry is obliged to list what the language
accepts, experimental entries included; the totals here are now
re-derived from the engine's per-genre allowlists rather than carried
forward. Since `GENRE-NAMESPACE` the registry
is partitioned by NAMESPACE (§1, `GENRE-NAMESPACE`/`UNIVERSAL-CORE-KEYWORDS`/`LAYOUT-ZONE-NAMESPACE`): the **universal core** belongs
to every genre and no genre may redefine it; the **layout namespace** is
owned by no genre either (`LAYOUT-ZONE-NAMESPACE`); everything else belongs to a
genre. Since `CONSTRUCT-STATUS-TIERS` every entry also carries a **STATUS**.

**Status — the two values (`CONSTRUCT-STATUS-TIERS`).**

| Status | What it means |
|---|---|
| **NORMATIVE** | Inside the v0.1 **conformance surface** and inside the **compatibility promise**. A conforming implementation MUST support it; it changes only through a migration entry (`VERSION-MIGRATION-MODEL`). |
| **EXPERIMENTAL** | The reference engine accepts it and documents using it keep working — but it is **outside the conformance surface** and **outside the compatibility promise**. An implementation MAY support it. It may change or be withdrawn in a later `0.x` without a migration entry, and a document that uses it is not a portable v0.1 document. |

EXPERIMENTAL is not a deprecation and not a warning about correctness; it
is a statement that the construct has **not converged**. The engine has no
warning channel — an experimental construct parses silently and renders —
so **this marking is the only signal an author or an authoring agent
gets**. It is documentary by design (`CONSTRUCT-STATUS-TIERS`): a status column a reader can
consult, not a diagnostic the parser emits. An agent generating a
portable figure SHOULD restrict itself to the NORMATIVE surface.

*(a) The universal core (3) — `UNIVERSAL-CORE-KEYWORDS`, never redefined by any genre. All
NORMATIVE:*

| Keyword | Status | Role |
|---|---|---|
| `figdown` | NORMATIVE | the header; must be readable before the genre is known |
| `title` | NORMATIVE | the document's caption |
| `layout` | NORMATIVE | opens the layout zone (§3) |

These three are the document's **structure**, which is what a reader can
resolve before the genre is known. `layout` belongs here rather than with
the zone's own members in (a′) because it is the zone **opener** — the
marker that says where the zone begins — not a directive inside it.

**What "core" means (`UNIVERSAL-CORE-KEYWORDS`, restated).** Core means: *wherever
this keyword appears, its meaning is fixed, and no genre may redefine it.*
It does **NOT** mean "must appear in, or be usable by, every genre". The
earlier reading made `UNIVERSAL-CORE-KEYWORDS` contradict the per-genre minimum sets, because
`bitfield` and `table` documents have no `pin` and no `layout`
zone at all and are complete without them. `UNIVERSAL-CORE-KEYWORDS` is a **fixity** guarantee,
not a **ubiquity** requirement. The 0.1 repartition changes only
the ENUMERATION — five keywords to three — and leaves that distinction
exactly as it stands, because it is what keeps `UNIVERSAL-CORE-KEYWORDS` consistent with the
per-genre minimum sets.

*(a′) The layout namespace (1) — `LAYOUT-ZONE-NAMESPACE`, owned by no genre:*

| Keyword | Status | Role |
|---|---|---|
| `pin` | NORMATIVE | an element's declared geometry: `at=` places it, `width=`/`height=` extend it (§3) |

**Every member of this namespace is genre-independent** (§1, `LAYOUT-ZONE-NAMESPACE`): no genre may define, redefine or extend a keyword inside the
layout zone, and `GENRE-VOCABULARY-OBLIGATION` does not reach into it. **The
namespace has exactly one member.** `path` and `routing` were the other
two — core until this release, EXPERIMENTAL from `CONSTRUCT-STATUS-TIERS`'s demotion, and
**WITHDRAWN from the language by `EDGE-GEOMETRY-CONSTRUCTS`** (retired-keyword
table below; the requirement they served is §9 **`EDGE-IDENTITY-AND-GEOMETRY`**). The clause
that governs the namespace is unchanged; only its membership is.
**Status and belonging were orthogonal while both lived**, and the
distinction is kept here because it governs the next experimental member
the zone acquires: EXPERIMENTAL is a statement about **stability**,
genre-independence one about **belonging**, and a construct can be both.
Until this release this section said the opposite of the second: *"a future
genre MAY redefine `path` or `routing` under `GENRE-VOCABULARY-OBLIGATION`, and an agent may no
longer assume their meaning is genre-independent."* That sentence was
**WITHDRAWN** (`LAYOUT-ZONE-NAMESPACE`). It read a demotion in status as a release of
ownership, and it put a crack in `GENRE-NAMESPACE`'s default that a reading agent
ignores the layout zone entirely — a default that holds only if no genre
semantics can ever appear there, and whose skip is driven by the `layout`
marker rather than by any inspection of what the zone contains. `CONSTRUCT-STATUS-TIERS`'s
demotion of `path`/`routing` stood until `EDGE-GEOMETRY-CONSTRUCTS` removed them outright.
**A withdrawal DOES release the spelling**, which a demotion never did:
`path` and `routing` belong to no namespace now, so a future genre may
claim either under `GENRE-VOCABULARY-OBLIGATION` through the `NEW-CONSTRUCT-EVIDENCE-GATE` gate (§9, `EDGE-GEOMETRY-CONSTRUCTS`, closed).
`pin` absorbed `size` (`ELEMENT-GEOMETRY-DIRECTIVE`): one directive, one model
object, and `size` is a retired spelling with a named diagnostic.

*(b) The scene namespace (11) — shared today by `block`, `topology` and
`flowchart`:*

| Status | Keywords | Count |
|---|---|---:|
| NORMATIVE | `node` `group` `external` `edge` `class` `flow` `rank` | 7 |
| EXPERIMENTAL | `threshold` `band` `bundle` `plane` | 4 |

*(b″) `flowchart`'s OWN namespace (3) — the first exercise of `GENRE-VOCABULARY-OBLIGATION`
(`FLOWCHART-ROLE-KEYWORDS`):*

| Status | Keywords | Count |
|---|---|---:|
| EXPERIMENTAL | `process` `decision` `terminator` | 3 |

These three are legal **only** under `figdown 0.1 flowchart`; under any
other genre they are `"<keyword>" is not allowed in genre <g>`, from the
same allowlist that rejects `node` inside `bitfield`. They are `node` with
a `role` field, they share the node id namespace, and they take exactly
`node`'s option keys. Their status is their genre's. See
[genres/experimental/flowchart.md](genres/experimental/flowchart.md) §Roles for the vocabulary, the
derived geometry, the exclusion list and the `terminator` verification
debt.

*(b′) `bundle` and `plane` were NORMATIVE until this release and were demoted by
`CONSTRUCT-STATUS-TIERS`,* on the same evidence the genre statuses rest on. Measured over the
50-document in-repo corpus, `bundle` appears in **4** documents and
`plane` in **3**, and **every one of the seven is a `topology`
document**. Both appear **zero** times in `block`, `bitfield` and `table`
documents — so under the per-genre minimum-set reading neither is in any
normative genre's vocabulary, and `topology` is itself EXPERIMENTAL.
`bundle` is `topology`'s own domain vocabulary (`DOMAIN-VOCABULARY-PREFERENCE` §4) and is demoted
*with* its genre, not against it; `plane` is a generic marker with no
owning genre, exactly the position that demoted `threshold` and `band`. Both
remain legal, keep the meaning §2.4 and §2.5 give them, and every
document that uses them keeps rendering — the demotion changes their
status, not their semantics.

**The option key moves with its declaration point.** `plane=` is demoted
with the `plane` keyword. The two cannot be separated: `plane=` can only
name a plane some `plane` line declared, so in a document that may not
declare one it could only ever name the implicit `base` — an option with
exactly one legal value, which is not an option. `z-index=` follows too, being
accepted by `plane` alone (the same rule that carried `extend=` out with
`band`). What does **not** move is the implicit `base` plane or the
model's `planes` array: a document that declares no plane still has
`planes[0] = {id:"base", z:0}` and every element still reports
`plane: "base"` (§12.5), so a normative-surface reader needs no new case.

*(c) The three nested-genre namespaces (3 openers + 6 children + `|`).*
Each opener is a top-level line in ANY genre — that is composition (§4,
`GENRE-COMPOSITION`) — and each child keyword is valid only inside its own region. A
child's status is its genre's:

| Genre | Status | Opener (top level) | Children (region only) |
|---|---|---|---|
| `bitfield` | NORMATIVE | `bitfield` | `field` `break` |
| `table` | NORMATIVE | `table` | `\|` (row token) `cell` `width` |
| `timing` | EXPERIMENTAL | `timing` | `signal` `gap` |

*(c′) `chart` (1) — EXPERIMENTAL, and not a genre.* It opens no region and owns
no children, which is why it is its own row rather than a fourth line of
(c):

| Keyword | Status | Role |
|---|---|---|
| `chart` | EXPERIMENTAL | `chart <table-id>` — draws a `table` already in the document as a chart. Legal at the top level of `block`, `topology`, `flowchart` and `table` (`GENRE-KEYWORD-ALLOWLIST`, below). **Outside the v0.1 conformance surface**; defined in §4.4, vocabulary row in [genres/table.md](genres/table.md) |

Its status is its own, not a genre's: `chart` is accepted under three
NORMATIVE genres and is still EXPERIMENTAL, because what has not converged is
the construct — one option key, one legal value, and a data binding
(rows→X, columns→Y) that no other keyword in the language uses. An agent
writing a portable v0.1 figure leaves it alone.

3 + 1 + 11 + 3 + 3 + 1 = **22 top-level**; 2 + 2 + 2 = **6 children** (the
`|` token is a line-start token, not a keyword, and is counted separately
— which is why `table` shows three entries in the row above and
contributes two here).
`CONSTRUCT-STATUS-TIERS` changed no total — entries moved column only; 0.1 is the first
release since that ADDS keywords, three of them, all EXPERIMENTAL, taking the
total to 25, and 0.1 is the first that REMOVES one: `ELEMENT-GEOMETRY-DIRECTIVE` merged
`size` into `pin`, so 25 − 1 = 24. **0.1 removes two more, and it
is the first removal that is a WITHDRAWAL rather than a merge or a
rename**: `EDGE-GEOMETRY-CONSTRUCTS` took `path` and `routing` out of the language, so
24 − 2 = **22**. `LAYOUT-ZONE-NAMESPACE`'s repartition, like `CONSTRUCT-STATUS-TIERS`'s, moved
entries between rows without changing any total. A retired or withdrawn
keyword is not counted here — its spelling stays registered so it fires a
named diagnostic (the tables below), but it is no longer a keyword of the
language. Of the 22
top-level keywords **13 are NORMATIVE** — the core of three (a), `pin` (a′), the
seven normative scene keywords (b), and the `bitfield` and `table` openers
(c) —
and **9 are EXPERIMENTAL**: `threshold` `band` `bundle` `plane`
`timing` `process` `decision` `terminator` `chart`. (Both counts of the
withdrawn pair were EXPERIMENTAL, so NORMATIVE is unchanged and EXPERIMENTAL falls 11 → 9.
The NORMATIVE 13 has never moved; it is the EXPERIMENTAL side that carried the
missing `chart`.)
Reserved for the dynamic profile: `page set pulse` — the three the §6 <!-- fence-check: skip -->
sketch uses. `step` was reserved until this release and is now **released**
(`CONSTRUCT-STATUS-TIERS`): it appeared in no sketch and no genre claimed it, so it is an
ordinary unknown keyword again and an author may have the word.

**Genre status (`CONSTRUCT-STATUS-TIERS`).** The v0.1 NORMATIVE genre surface is **`block`,
`bitfield`, `table`**. **`topology`, `flowchart` and `timing` are
EXPERIMENTAL**: the header accepts them, their documents parse and render
exactly as before, and no `.fd` needs rewriting — but they sit outside the
conformance surface and outside the compatibility promise, and each genre
document says so at the top.

| Genre | Status |
|---|---|
| `block` `bitfield` `table` | NORMATIVE |
| `topology` `flowchart` `timing` | EXPERIMENTAL |

**The honest v0.1 state of `GENRE-NAMESPACE` (updated 0.1, `GENRE-KEYWORD-ALLOWLIST`; 0.1).** `GENRE-NAMESPACE` is
**enforced** as a per-section top-level **allowlist**. Pure `bitfield` /
`table` / `timing` reject scene keywords (`node`, `edge`, …) except `class`
(and experimental `chart` under `table`). The three scene genres still
share one scene vocabulary (plus nested typed openers and experimental
scene/layout keywords) — and `flowchart`'s allowlist is
the scene set **plus its own three role keywords**, which is what makes
`GENRE-VOCABULARY-OBLIGATION` real rather than merely permitted. Corpus measurement already matched this split: across pure
`bitfield`/`table`/`timing` documents, ten of the eleven scene keywords
appeared **zero** times; `class` is the exception and stays on those
allowlists. `GENRE-NAMESPACE` also exists so that a FUTURE genre may bring its own
namespace without a major version bump. The `GENRE-KEYWORD-ALLOWLIST` narrowing is documented in
`MIGRATIONS` 0.1; documents that mixed scene keywords under a pure
`bitfield`/`table`/`timing` header must rewrite (multi-section `MULTI-FIGURE-DOCUMENTS`, scene host
with nested region, or two files).

Keyword names follow one discipline: **one lowercase word, borrowed
standard terminology, scope-precise, mutually disambiguating** — no
invented abbreviations. The keyword and option-key namespaces are
disjoint, so a name may be reused across them without ambiguity: the
`table` child keyword `width` (a line, one value per table column) and the
`width=` option on `pin` (one node's px extent) are the SAME spelling
And that is correct rather than tolerated — they denote
the same concept, a horizontal extent, and a language that borrowed
`width` from SVG/CSS for one of them and invented an abbreviation for the
other would be the defect (`UNSAFE-DEFAULT-ELIMINATION`, single-source vocabulary). The parser can
never confuse them either — a keyword is only ever a line's first token,
an option key only ever the left side of a `key=`.
That the parser cannot confuse them does not mean a *reader* cannot:
`fill` was both a keyword and an option key, and `route` sat one typo
from the then-`routing` keyword that was also an option key on the same
line.
Both were renamed (`fill` → `band`, `route` → `path`,
and `line` → `guide`, which collided with the model's own `line` field;
`guide` was itself renamed `threshold`, `THRESHOLD-KEYWORD-SPELLING`). That whole
`route`/`path`/`routing` chain ends, where `EDGE-GEOMETRY-CONSTRUCTS` withdrew
`path` and `routing` from the language; all three spellings are now
line-start diagnostics with no live half anywhere.
Reuse across namespaces is permitted, but it must not cost the reader.

**One DECLARED EXCEPTION to the paragraph above (maintainer
ruling).** the word `fill` is once more in two
namespaces: it is a RETIRED KEYWORD, whose line-start diagnostic
`fill has been renamed: use band` this section still requires, and it is
the primary OPTION KEY, `fill=`. That is exactly the collision `UNSAFE-DEFAULT-ELIMINATION` exists
to prevent, and it is accepted knowingly rather than left unremarked. The
reasoning: the exposure being closed is larger than the collision being
opened. `color=` set the FILL while CSS, SVG and every diagram language
built on them use `color` for the TEXT colour — so an author, and this
project's primary author is an authoring agent carrying exactly those
priors, wrote `color=` meaning the label and got a legal, wrong figure,
silently, on any of thirteen directives. The collision it costs is
strictly milder than the one 0.1 removed: there, both spellings
were LIVE, and a reader meeting `fill` had to know which namespace was
in play. Here only one is live. `fill` at line start is *always* an
error carrying its own migration, `fill=` is *always* the option key, and
the two can never appear in a document that parses. The exception is
directional and does not generalise: a retired spelling MAY be reused in
the other namespace, a live one may not.

**A SECOND DECLARED EXCEPTION (maintainer ruling): `gap`.**
The rule as written has a live counterexample inside this very document
set, and leaving it unremarked would make the rule read as violated rather
than excepted. The `timing` child keyword `gap <cycle>` (a time break) and the
scene option `gap=<px>` on `group` (member spacing) are **both live**, and
they denote **different concepts** — the only such pair in v0.1. (The other
cross-namespace pairs — `class`/`class=`, `width`/`width=`, `plane`/`plane=`
— denote the SAME concept on both sides and are covered
by the paragraph above, not by this exception. `routing`/`routing=` was a
fourth such pair until this release, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew both halves at once.)
The reasoning is `GENRE-KEYWORD-ALLOWLIST`, and it is a **stronger** disjointness than the
`fill`/`route` cases ever had. There the two spellings could appear in one
document and only the parser's token position told them apart. Here they are
**section-disjoint**: `gap <cycle>` is legal only inside a `timing` region, and
a pure `timing` section rejects `group` outright (`GENRE-KEYWORD-ALLOWLIST` allowlists, §1), so the
scene `gap=` has nothing to attach to; conversely a scene genre's `gap=`
lives on a `group` line, which a `timing` region does not admit. The two can
be co-present in one FILE only across a section or region boundary that the
reader has already had to cross, and never on the same line, in the same
region, or under the same allowlist. Directionality is preserved: this
exception rests on section disjointness, not on one side being retired, and
it does not license a third pair without the same argument.
The same rule retired `render`: it read as a command, it
collided with the *renderer* and the render options of §7, and the zone
it opened admits only geometry — so it became `layout`, the cross-tool
word for that half of a diagram language. `layout` and `layer` were a
near-miss pair — five shared characters, one a bare keyword and the
other id-taking — and 0.1 removed it: the `layer` half is gone
(`PLANE-KEYWORD-SPELLING`), and `layout`/`plane` share nothing.
**`GENRE-VOCABULARY-OBLIGATION` does not waive that rule.** A genre MAY reuse another genre's
spelling with a different meaning (§1), but `UNSAFE-DEFAULT-ELIMINATION`'s test still applies: the
reuse must not cost the reader. Across genres the disambiguator is the
header — required, first significant line, exactly one genre per document —
which is what `line`, `fill` and `route` did not have. A collision INSIDE
one namespace, or with a field name of the canonical model (§12.5), remains
a defect no genre boundary can excuse.

**Retired keywords and positionals (the 0.1 batch, `TIMING-LANE-ALPHABET`–`CHART-BLOCK-NAMING`).** A
retired KEYWORD is registered exactly like a retired option key: the
spelling stays known to the parser so it produces a named migration
message at line start instead of the generic `unrecognized line`. Four
keywords, one positional flag and one enum value moved in one release,
each on the single-source-vocabulary test (`UNSAFE-DEFAULT-ELIMINATION`): the spelling FigDown
used was claimed by a standard for a different concept, or by three
standards for three concepts.

| Retired | Live spelling | Why it went |
|---|---|---|
| `boundary` | `external` | it declares an external I/O endpoint — this spec's own words (§2.8) — while UML's «boundary» is an INTERNAL interface object, C4's `System_Boundary` is a dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning. Three standards, three concepts, none of them this one. |
| `layer` (+ `layer=`) | `plane` (+ `plane=`) | in mxGraph — the geometry model FigDown adopted — a layer is a CONTAINMENT PARENT that establishes coordinates, so `layer=overlay` reads as "reparent and re-origin this element", which FigDown does not do; Inkscape layers are `<g>` and may carry a transform; OGC WMS layers each carry an SRS; CSS `@layer` is cascade priority with no visual meaning; SVG has no layer concept at all. `plane` is claimed by no standard for a conflicting meaning, and it also closes the `layout`/`layer` near-miss recorded above. |
| `wrap` (`bitfield` child) | `break` | in CSS and typography `wrap` is AUTOMATIC reflow — a MODE — while this directive is an EXPLICIT row break, an EVENT. CSS Fragmentation §4.3 calls that "a forced break … explicitly indicated by the style sheet author"; HTML spells it `br`. |
| ~~`optional` (bare flag on `field`)~~ | ~~`conditional`~~ → **`present=`** | RFC 2119 defines OPTIONAL as optional to IMPLEMENT, which is not what a wire-format field marker means; the wire-format sense is "present only if" (RFC 2784). **REVERSED at 0.1 (`PRESENCE-FLAG-SPELLING`): `optional` became the live spelling again and `conditional` the retired one** — `conditional` has zero attestation as a wire-format field marker, RFC 2784's own diagram spells the concept `(optional)`, and "optional" appears in 34 downstream field LABELS against 0 for "conditional". **BOTH are retired at 0.1 (`PRESENCE-CONDITION-EXPRESSION`): the construct is now the option key `present=`, whose VALUE is the presence condition.** The row is struck through rather than deleted because a document written at any point in that history still needs to find it. |
| `plot` (+ `kind=`) | `chart` (+ `type=`) | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart. `kind=` was RETIRED on `node` and LIVE on `plot` at the same time, inside one namespace; 0.1 closed that, and Vega, Chart.js and ECharts spell the chart-type key `type`. |
| `bars3d` (the one `type=` value) | `bar3d` | value-level spelling only; the enum still has exactly one member. |

**0.1 adds one keyword rename and one deletion (`THRESHOLD-KEYWORD-SPELLING`, `CHART-LEVEL-KEY`).**

| Retired | Live spelling | Why it went |
|---|---|---|
| `guide` | `threshold` | an **inverted** name, which `UNSAFE-DEFAULT-ELIMINATION` rates worse than an unfamiliar one. In Illustrator, Inkscape, Figma and draw.io a *guide* is an author-only construction line that is **never rendered**; FigDown's is drawn output, and no counter-example was found where "guide" names rendered output. `guide` was also recorded `source = FigDown` — a **coinage**, which `SIZE-AND-DIRECTION-KEY-NAMING` makes a last resort requiring a justification that was never on file; the rename is the one chance to convert it into a borrow. `threshold` comes whole from **Grafana**, which supplies the entire family in one vocabulary: its **"Show thresholds"** render option offers *"As lines"*, *"As filled regions"* and *"As filled regions and lines"* — FigDown's marker + region pair, split the same way — with **IETF RED/AQM** as the secondary source (RFC 2309: *"Two RED parameters, minth (minimum threshold) and maxth (maximum threshold)"*; RFC 7567: *"an AQM algorithm configured with a threshold"*), which is exactly what the corpus's WRED figures transcribe. Two independent counts agree that **77.8%** of 126 marks and **78%** of 63 distinct marker names are thresholds; target/mean/reference marks: **0**; standalone watermarks: **0**. `level` was rejected on three collisions (75 downstream registers spell `_LEVEL`/`_LVL` meaning a profile *index*; the corpus's own threshold tables head the ordinal column `Level (high → low)` and the value column `Threshold`; ISO 80000-3 defines *level* as the **logarithm** of a quantity ratio), and `watermark` was rejected for covering no capacity bound, no floor, no base level and none of the WRED staircase marks — "threshold" outnumbers it 1355:42 in the corpus prose. FigDown already called it a threshold in every place it explained it. |
| `level=` (on `chart`) | *(none — DELETED)* | not a rename. Zero uses corpus-wide, zero 3-D bar charts, zero requests; one in-repo example and two fixtures. It was also the only construct in the language whose caption the **engine** wrote rather than the author, and its `parseFloat` grammar uniquely accepted `1e3`, breaking the otherwise-uniform `\d+(\.\d+)?` numeric grammar (SYNTAX-STYLE §8). |

`band` also changed shape (`BAND-LABEL-STATUS`) — a mandatory quoted label,
written first — but that is an addition to a directive, not a retired
spelling, so it is recorded in §5 and MIGRATIONS rather than here.

**0.1 retires one keyword, and it is the first MERGE rather than a
rename (`ELEMENT-GEOMETRY-DIRECTIVE`).**

| Retired | Live spelling | Why it went |
|---|---|---|
| `size` | `pin` (`width=`/`height=` on the `pin` line) | not a rename: the keys did not change spelling, their CARRIER did. One element's declared geometry was split across two directives that shared an id, a domain, a zone and a rigidity rule, so every author who pinned a node and then resized it wrote two lines and every consumer read two objects — and the model carried two arrays for one fact. `pin` won the spelling over `geometry` on attestation and on the one property this zone must convey, removability (RULE 4.1; `geometry` has zero rows in `vocabulary-sources.tsv` and no keyword-level attestation in any line-oriented diagram language). The borrow from DOT is downgraded EXACT → MODERATE in the same pass, because Graphviz's `pin` is position-only and FigDown's now also carries extent. |

Because it is a merge, the diagnostic names a whole line rather than a
word — an author holding `size a width=120 height=60` needs to be told <!-- fence-check: skip -->
that the keys survive unchanged and only their carrier moved. The domain
split arrived with it: `at=` takes nodes, groups and externals, while
`width=`/`height=` take nodes only (§3).

**0.1 removes two keywords, and it is the first WITHDRAWAL — not a
rename, not a merge, not a deletion of a dead corner (`EDGE-GEOMETRY-CONSTRUCTS`).** A
withdrawal takes the construct out of the language with **no replacement
spelling**, so the diagnostic cannot say "use X instead"; it must say what
went, why, and what to write instead in the constructs that remain. Both
were EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) and outside the v0.1 conformance
surface and the compatibility promise, so no promise is broken and no
migration entitlement is owed — MIGRATIONS carries the entry all the same,
because a document written last week still has to be told.

| Withdrawn | Live spelling | Why it went |
|---|---|---|
| `path` (+ `points=` `tailport=` `headport=` `routing=`) | *(none — WITHDRAWN)* | a source-graded prior-art study of Visio, draw.io/mxGraph, Graphviz and ELK (216 graded claims, 77% quoted from primary sources) found the directive's two halves on **opposite sides** of a narrow stable intersection, and neither half survivable as written. **Author waypoints are outside it**: only 2 of the 4 systems model them, and those 2 disagree on what happens when an endpoint moves (mxGraph leaves them behind, ELK carries them, Visio has no waypoint concept at all) — a disagreement about behaviour, not spelling. **The dock CONCEPT is inside it** — a named site declared on the node, addressed by semantic role, denoting a location, unanimous across all four — but **FigDown's realisation was not**: a fraction on the EDGE is mxGraph-only, it collapsed two attested axes (location vs perimeter projection, which draw.io flags separately) into one key, and it attached by **written order**, which has zero prior art in any surveyed system. Restoring either half needs an **edge-identity construct** the language does not have (§9, `EDGE-IDENTITY-AND-GEOMETRY`). Measured footprint at withdrawal: 13 in-repo `.fd` directive lines in 3 files, 33 conformance directive lines in 15 fixture files, **zero** downstream adoption; four behaviour defects, all in parts nobody exercised, including a **published artifact with clipped labels**. |
| `routing` | *(none — WITHDRAWN)* | the **shape is right and the evidence is not**: two modes and two scopes are inside the stable intersection, so this is the one piece of the family prior art would have kept. It goes anyway, on demand and implementation — **6 of the 8 in-repo `routing=orthogonal` writings are provable no-ops**, downstream adoption is zero, and the per-edge scope (also inside the intersection) has no host line left once `path` goes and nothing to address even if it had one. **This is a deliberate loss, recorded as one** (§9, `EDGE-IDENTITY-AND-GEOMETRY`): it is to be restored properly once edges are addressable, not re-attached to a restated triple. |

The keyword spellings stay registered so a line-start `path` or `routing`
still produces a named message rather than the generic `unrecognized
line`, and `route` — retired to `path` — now points at a
spelling that is itself withdrawn, so its message says so. None of the
three is counted as a keyword of the language (the totals above).

Two more 0.1 retirements are recorded with the option keys below
(`unit=` → `word=`, `via=`/`src=`/`dst=` → the `points=`/`tailport=`/`headport=`
spellings that 0.1 then withdrew,
`labels=` → `data=`) and one with the timing lane alphabet (the digits `2`–`9`,
`TIMING-LANE-ALPHABET` — write `=` and name the cell in `data=`).

Experimental (outside the v0.1 conformance surface), the complete list in
its current spellings — keywords `threshold` `band` `bundle` `plane`
`timing` `chart`, option keys `plane` `z-index`
`offset` `extend` `data`
`type`, genres `topology` `flowchart` `timing`. (`stroke=` was on this list
until this release and is now NORMATIVE, `STROKE-KEY-STATUS`; `color=` was on it too and is
now retired language-wide, `COLOUR-KEY-STATUS`; the keywords `path`/`routing` and the
option keys `points`/`tailport`/`headport`/`routing` were on it until this release and are WITHDRAWN, `EDGE-GEOMETRY-CONSTRUCTS`.)
Each registered set (keywords, option keys, shape/style enums, edge
operators, numbering values, timing lane characters, merge markers) is
closed; additions follow the change policy (`NEW-CONSTRUCT-EVIDENCE-GATE` gate) and land as
migration entries.

**Reserved spellings in the option-key namespace (`LANE-ALPHABET-KEY-RESERVATION`, normative).** One
registration is forbidden outright, and the reason is a cross-namespace
collision the parser cannot detect. A `timing` `signal` line is lexed in
LANE MODE: a bare token containing `=` stays POSITIONAL there, so
`signal d x=01.` is a name and a lane, not a name and an option. But lane
mode is consulted *second* — a token whose key is REGISTERED is taken as
an option first, before the lane-mode guard is reached. The lane alphabet
is `[01pnx=.]`, which contains the letters `p`, `n` and `x` (the digits
`2`-`9` left it, `TIMING-LANE-ALPHABET` — they never were legal first characters
of a key, so the reservation is unchanged). Therefore:

> A single-letter option key drawn from the timing lane alphabet — today
> `p`, `n` and `x`, the only lane characters that are legal first
> characters of a key — MUST NEVER be registered in the option-key
> namespace, in any genre, including a future one.

Registering one would not produce an error anywhere: every existing lane
containing that letter followed by `=` would silently reparse as an
option, and the figure would change. Nothing in the language expresses
this constraint, so it is enforced mechanically —
`node conformance/run.js` refuses to run while such a key is registered
(the `LANE-ALPHABET-KEY-RESERVATION` guard). The genre-namespace rule `GENRE-VOCABULARY-OBLIGATION` does not waive it: a genre
may redefine a spelling's MEANING, but it cannot re-lex another genre's
lanes. See [genres/experimental/timing.md](genres/experimental/timing.md).

**Option-key registry (v0.1).** 45 keys. 0.1 registered six new
spellings — `plane` `type` `data` `points` `tailport` `headport` — and kept
their predecessors `layer` `kind` `labels` `via` `src` `dst`, plus `unit`
(replaced by `word`), registered as language-wide retired diagnostics; the
0.1 pass had done the same for `w`/`h` → `width`/`height` and
`dir` → `extend`. **A registration counts here whether or not it has a live
acceptor**, which is the convention `w` `h` `via` `src` `dst` `level` have
always been counted under — so 0.1's four WITHDRAWALS
(`points` `tailport` `headport` `routing`, `EDGE-GEOMETRY-CONSTRUCTS`) move from EXPERIMENTAL to
NORMATIVE (diagnostic) and the total does not change. This section previously said 33: that figure predated
0.1 and had also omitted `offset`, `z-index` and `unit` from the
namespace table below, so it was never the registry's real size. **It then
said 42 in an earlier release, and that figure went stale**, which registered `description` (`DESCRIPTION-KEY-SPELLING`, `note` kept as a
diagnostic) and `present` (`PRESENCE-CONDITION-EXPRESSION`) without recounting: 42 + 2 = 44. **It said
44 until this release**, which registered `index` (`BITFIELD-REPETITION-CONSTRUCT`, the `bitfield`
repetition key): 44 + 1 = 45. The
figure above is re-derived row by row from the key table below, which has
46 rows for 45 distinct keys — the two NORMATIVE rows spelled `fill` are ONE key
with two registrations. The set
is closed: a `key=`
token whose key is not listed here is the line error
`unknown option "<key>="`. Applicability is enforced **per directive** —
a registered key on a directive that does not accept it is also a line
error (`<directive> does not take <key>=`), so the flat list alone is
not the whole rule. The right-hand column is the complete set of
directives that accept the key.

**Namespaces (`GENRE-NAMESPACE`).** An option key belongs to the namespace of the
directives that accept it. All 45 are classified; the fourth column of the
table below is the same classification key by key. The last row is the one
kind of registration that belongs to NO directive: a spelling retired from
the language altogether, kept registered only so its rename — or its **withdrawal** — gets a named message wherever it appears.
The **layout, experimental** row emptied and is deleted
rather than left at zero: `EDGE-GEOMETRY-CONSTRUCTS` withdrew all four of its keys with their
only host directive, and they appear in the last row now.

| Namespace | Keys | Count | Status |
|---|---|---:|---|
| **layout** (`LAYOUT-ZONE-NAMESPACE` — owned by no genre; 0.1) | `at` `width` `height` (all three on `pin`) | 3 | NORMATIVE |
| **scene** (`block`/`topology`/`flowchart`) | `shape` `in` `gap` + the retired diagnostics `label` `taillabel` `headlabel` `from` `to` | 8 | NORMATIVE |
| **scene, experimental** (on the demoted `band`/`plane`/`threshold`, `CONSTRUCT-STATUS-TIERS`) | `plane` `extend` `offset` `z-index` | 4 | EXPERIMENTAL |
| **`bitfield`** | `word` `numbering` `description` `present` `index` | 5 | NORMATIVE (0.1: `note` → `description`, `DESCRIPTION-KEY-SPELLING`; the positional flag `optional` became the key `present`, `PRESENCE-CONDITION-EXPRESSION`. 0.1: `index`, the repetition range, `BITFIELD-REPETITION-CONSTRUCT`) |
| **`timing`** | `data` | 1 | EXPERIMENTAL (inherited from the `timing` genre) |
| **`table`** | *(none of its own)* | 0 | NORMATIVE |
| **cross-namespace** (§5 presentation + `class`) | `fill` `stroke` `style` `class` | 4 | NORMATIVE (0.1: `style` lost its `field`/`cell`/`signal` acceptors — `STYLE-KEY-SCOPE` — and is now cross-namespace across the scene directives only) |
| **experimental** (outside the conformance surface) | `type` (on `chart`) | 1 | EXPERIMENTAL |
| **retired language-wide** (no acceptor at all) | `w` `h` `dir` · `text` `z` · `kind` `layer` `labels` `unit` `via` `src` `dst` · `level` (DELETED not renamed) · `color` (`COLOUR-KEY-STATUS` — retired with NO replacement) · `note` (`DESCRIPTION-KEY-SPELLING` — renamed `description`) · `points` `tailport` `headport` `routing` (`EDGE-GEOMETRY-CONSTRUCTS` — **WITHDRAWN** with the `path` directive, NO replacement) | 19 | NORMATIVE (diagnostic) |

The status column follows the same two-value rule stated for keywords
above. All three surviving §5 paint/dash keys — `fill=`, `stroke=` and
`style=` — are NORMATIVE. `stroke=` was demoted by `CONSTRUCT-STATUS-TIERS` on a
count of 5 in-repo uses and promoted back by `STROKE-KEY-STATUS` once the count was
re-measured (56+ in-repo, 567 downstream edge-colouring sites); the
fourth key of the old set, `color=`, is retired outright by `COLOUR-KEY-STATUS` and the
language has no label-colour key at all (§5; the derived default is
`LABEL-COLOUR-SOURCE`). None of the three may ever be meaning's only carrier (`GUI-WRITEBACK-STRUCTURE`/`PRESENTATION-AS-MEANING-CARRIER`).
`gap=` (a `group` layout option) stays normative. `plane=` is demoted
with the `plane` keyword — a keyword and its only declaration point move
together (b′) — and `extend=`, `offset=` and `z-index=` are demoted only
because they are accepted solely by the demoted `band`, `threshold` and
`plane` respectively. The
option-key totals therefore move with the keywords: **39 NORMATIVE and 6
EXPERIMENTAL**, 45 in all. The six EXPERIMENTAL keys are `plane` `extend` `offset`
`z-index` `data` `type`; `EDGE-GEOMETRY-CONSTRUCTS`'s four withdrawals crossed the line the
other way, because a withdrawn spelling is the opposite of unconverged —
it is gone, and a fixed diagnostic message is all that is left to
implement. (Five earlier counts in this paragraph did not add
up. It read "19 NORMATIVE and 9 EXPERIMENTAL, 28 in all" against a table that summed
to 30; the arithmetic was corrected, in the same pass that
added `width`/`height`/`extend` and the three retired language-wide keys.
The "22 NORMATIVE and 11 EXPERIMENTAL, 33 in all" that replaced it left `offset`,
`z-index` and `unit` out of the namespace table altogether and counted the
live `color=` as a retired diagnostic; 0.1 recounted key by key
against the engine's registry, which is where the 42 comes from. The
"29 NORMATIVE and 13 EXPERIMENTAL" that stood until this release was itself one off its
own table, which summed to 30/12. The "32 NORMATIVE and 10 EXPERIMENTAL, 42 in all"
that stood until this release went stale, which registered
`description` and `present` without recounting. The count above is
re-derived row by row
from the key table, where the two NORMATIVE rows spelled `fill` are ONE key
with two registrations and are counted once.)

Two keys straddle their namespace by registration, and the reason is
recorded here rather than in the table: `at` is core on `pin` and carries
a diagnostic-only registration on the scene directive `threshold` (renamed
`offset=`, when the directive was still spelled `guide`);
`width`/`height` are
live on `pin` (on the retired `size` until this release, `ELEMENT-GEOMETRY-DIRECTIVE`) and carry a
diagnostic-only registration on the
scene `node`. Neither is a redefinition —
each is one key with one meaning, registered on directives in two
namespaces. Each is counted **once**, in the namespace of the registration
that names it in the table above: `at` and `width`/`height` under layout.
The `UNIVERSAL-CORE-KEYWORDS` core of three owns no option key at all — `figdown`, `title` and
`layout` take none — which is why the row that used to be spelled *core*
is now spelled *layout*. No key moved and no count changed.
`kind` used to be the third such key — retired on `node`, live on `plot`
— and 0.1 ended the straddle by retiring it language-wide (the
live half is now `type=` on `chart`).

The **cross-namespace** keys are shared by all six genres today and are
deliberately neither core nor layout. `UNIVERSAL-CORE-KEYWORDS` fixes only the document's
structure and `LAYOUT-ZONE-NAMESPACE` only the layout zone, while
`fill`/`stroke`/`style`/`class` are the figure's vocabulary, so a
future genre MAY define its own meaning and defaults for them under `GENRE-VOCABULARY-OBLIGATION` — at
the cost of documenting them in its own vocabulary table, and subject to
`UNSAFE-DEFAULT-ELIMINATION` (§10 above): reuse must not cost the reader. The three layout keys
`at`/`width`/`height` are the contrast: they sit inside the zone `LAYOUT-ZONE-NAMESPACE` closes,
so no genre may redefine them, ever. All four are NORMATIVE
(`STROKE-KEY-STATUS` promoted `stroke=`; `COLOUR-KEY-STATUS` retired `color=`, which
was the fifth).

The fourth column is the `CONSTRUCT-STATUS-TIERS` status. It is the **key's** status, and it
answers one question: *may an author write this key and stay inside the
v0.1 conformance surface?* A key is NORMATIVE when at least one directive that
**live-accepts** it is normative — the parenthetical names that directive.
A key is EXPERIMENTAL when the key itself is demoted, or when every directive
that live-accepts it is demoted.

`plane=` is the one key that falls under the FIRST of those two clauses
while normative directives still accept it. `node`, `group`, `external`,
`edge` and `class` all live-accept it and all five are NORMATIVE, so the
second clause would have kept the key normative. It is demoted in its own
right, by (b′): the key's only legal values come from `plane` lines, and
in a document that may not write one the key could name nothing but the
implicit `base`. A key with exactly one legal value is not an option, so
the keyword and its declaration point move together.

**Retired registrations are the third case, and they are NORMATIVE
(diagnostic).** A retired key has no live acceptor at all: the host
directive *rejects* it and emits a named migration message
(`from=`/`to=` on `band`, `label=`/`taillabel=`/`headlabel=` on `edge`,
`width=`/`height=` on `node`). A retired key that
left the LANGUAGE rather than a directive fires wherever it appears
instead —
`w=` `h=` `dir=` `text=` `z=`, the seven of 0.1
(`kind=` `layer=` `labels=` `unit=` `via=` `src=` `dst=`), `color=` and the four WITHDRAWN (`points=`
`tailport=` `headport=` `routing=`, `EDGE-GEOMETRY-CONSTRUCTS` — the first registrations whose
message names no successor, because there is none). What such a registration obliges an
implementation to do is produce that one fixed message, and those
messages are pinned by the **normative** conformance corpus — so the
obligation is inside the conformance surface even when the host
directive is demoted. `from=`/`to=` are therefore NORMATIVE (diagnostic) on
the demoted `band`, exactly as `label=`/`taillabel=`/`headlabel=` are on
`edge`. This is also the only reading consistent with what EXPERIMENTAL
means: a retired spelling is the opposite of unconverged — it is gone,
and only its error text remains.

| Key | Value | Accepted by | Status |
|---|---|---|---|
| `at` | `(x,y)` canvas px — a PAREN point (RULE 1.1a) | `pin` | NORMATIVE |
| `offset` | `0..100%`, the `%` mandatory | `threshold` | EXPERIMENTAL |
| `class` | id of a declared `class` | `node` (incl. `process`/`decision`/`terminator`) `group` `edge` `field` `cell` | NORMATIVE |
| `fill` | `#rgb`/`#rrggbb`/CSS name/`transparent` | `node` (incl. `process`/`decision`/`terminator`) `group` `band` `class` `bitfield` `table` `timing` `field` `cell` `signal` | NORMATIVE |
| `fill` on `edge` `threshold` `bundle` | RETIRED 0.1 — no interior, so it named the same channel as `stroke=` (§5, `INTERIOR-LESS-ELEMENT-PAINT`) | those three (all reject, naming `stroke=`) | NORMATIVE (diagnostic) |
| `color` | RETIRED language-wide at 0.1 (`COLOUR-KEY-STATUS`) — and it is the one retirement that is NOT a rename in either direction. Before 0.1 it set the FILL; from 0.1 it set the LABEL; v0.1 has no label-colour key at all. The message names BOTH eras and refuses to choose, which no live key could do | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `data` | comma-separated names for the lane's `=` data cells (WaveDrom's own key) | `signal` | EXPERIMENTAL |
| `extend` | `up`\|`down`\|`left`\|`right` | `band` | EXPERIMENTAL |
| `dir` | RETIRED language-wide at 0.1 — see below | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `gap` | px | `group` | NORMATIVE |
| `from` | `0..100%` — RETIRED, see below | `band` (rejects) | NORMATIVE (diagnostic) |
| `in` | id of the containing/target element | `node` (incl. `process`/`decision`/`terminator`) `threshold` `band` | NORMATIVE (on `node`) |
| `index` | the field's repetition RANGE, `<first>..<last>`, separator EXACTLY two dots and whitespace around it not significant (§12.2). `<first>` is ALWAYS a literal integer; `<last>` is a literal integer or opaque prose; a literal end above 9007199254740991 is a line error (§12.2, §12.5). Tri-state (§12.3): key absent = no repetition claim; `index=""` = repeats, indices not stated; a fully-literal range = determinate. **Determinacy is decided by parsing both ends as integers, NEVER by quoting** — RULE 2.3 makes quotes inert here, so `index="0..7"` is determinate too. Classic `field` form only (`BITFIELD-REPETITION-CONSTRUCT`) | `field` | NORMATIVE |
| `labels` | RETIRED language-wide at 0.1 — renamed `data=` (WaveDrom's own key is `data`, "an array of signal labels", one per value cell) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `layer` | RETIRED language-wide at 0.1 — renamed `plane=` (`PLANE-KEYWORD-SPELLING`; see the retired-keyword table above) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `description` | authored documentation prose, quoted (`QUOTING-RULES`). Draws NO ink beyond an SVG `<title>` tooltip — a fact a human must SEE belongs in the label or a `class` meaning | `field` | NORMATIVE |
| `note` | RETIRED language-wide at 0.1 — renamed `description=` (`DESCRIPTION-KEY-SPELLING`: IEEE 1685's spelling; the name is reserved for the v0.2 DRAWN annotation keyword, §9 `ANNOTATION-LOCATOR-SPLIT`) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `present` | the field's presence CONDITION as authored prose, quoted and MANDATORY. Tri-state (§12.3): key absent = no presence claim; `present=""` = conditional, condition not stated; `present="C = 1"` = conditional, condition stated. Quotable, never parsable (§12.7) | `field` | NORMATIVE |
| `numbering` | `lsb0`\|`msb0` (REQUIRED, §4.1) | `bitfield` | NORMATIVE |
| `plane` | id of a declared `plane` | `node` `group` `external` `edge` `bundle` `threshold` `band` `class` | EXPERIMENTAL |
| `points` | WITHDRAWN language-wide at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) — removed with the `path` directive, **not renamed**, so there is no spelling to migrate to. Author waypoints are outside the stable prior-art intersection (§9, `EDGE-IDENTITY-AND-GEOMETRY`) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `routing` | WITHDRAWN language-wide at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) — the mode set (`orthogonal`\|`straight`) and its two scopes ARE inside the intersection, and the key goes anyway on evidence and implementation, with **no replacement** (§9, `EDGE-IDENTITY-AND-GEOMETRY`) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `shape` | §2.1 shape enum (6 values; `cloud` RETIRED at 0.1 — see below) | `node` (incl. `process`/`decision`/`terminator`, where it overrides the DERIVED geometry and never the role — `FLOWCHART-ROLE-KEYWORDS`) | NORMATIVE |
| `src` | RETIRED language-wide at 0.1 — renamed `tailport=` (`ENDPOINT-DOCKING-KEYS`), and `tailport=` was itself **WITHDRAWN at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)**. There is **no replacement**: delete the line | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `dst` | RETIRED language-wide at 0.1 — renamed `headport=` (`ENDPOINT-DOCKING-KEYS`), and `headport=` was itself **WITHDRAWN at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)**. There is **no replacement**: delete the line | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `stroke` | colour — the OUTLINE of a shape and the WHOLE of a line (§5) | `node` (incl. `process`/`decision`/`terminator`) `group` `edge` `bundle` `threshold` `band` `class` `bitfield` `table` `timing` `field` `cell` `signal` | NORMATIVE |
| `style` | `solid`\|`dashed`\|`dotted` | `node` (incl. `process`/`decision`/`terminator`) `group` `edge` `bundle` `threshold` `band` `class` — **`field` `cell` `signal` LEFT this list at 0.1** (`STYLE-KEY-SCOPE`): on a `field` it could erase the dash that is conditional presence's only carrier while the model kept it (`PRESENTATION-AS-MEANING-CARRIER`), and the three moved as one minimum set | NORMATIVE |
| `tailport` | WITHDRAWN language-wide at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) — removed with the `path` directive, **not renamed**. Role-addressed attachment is inside the stable intersection; this realisation (a fraction on the EDGE, two attested axes collapsed into one key, attachment by written order) was not, and restoring it needs an edge-identity construct first (§9, `EDGE-IDENTITY-AND-GEOMETRY`) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `headport` | WITHDRAWN language-wide at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) — same reasoning as `tailport` | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `text` | RETIRED 0.1 — was renamed `color=`, which 0.1 then retired too (`COLOUR-KEY-STATUS`); v0.1 has no label-colour key | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `to` | `0..100%` — RETIRED, see below | `band` (rejects) | NORMATIVE (diagnostic) |
| `type` | the chart-type enum — one value, `bar3d` (spelled `bars3d` until 0.1) | `chart` | EXPERIMENTAL |
| `unit` | RETIRED language-wide at 0.1 — renamed `word=` (`BITS-PER-ROW-KEY-NAMING`) | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `via` | RETIRED language-wide at 0.1 — renamed `points=` (`WAYPOINT-KEY-SPELLING`), and `points=` was itself **WITHDRAWN at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)**. There is **no replacement**: delete the line | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `word` | bits per row | `bitfield` | NORMATIVE |
| `width` | px, strictly positive; NODES only (a group, an `external` or a typed block is a line error, §3) | `pin` · `node` (diagnostic only) | NORMATIVE |
| `height` | same as `width` | `pin` · `node` (diagnostic only) | NORMATIVE |
| `w` | RETIRED language-wide at 0.1 — see below | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `h` | RETIRED language-wide at 0.1 — see below | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `z-index` | integer paint order (CSS's spelling in full, RULE 4.2) | `plane` | EXPERIMENTAL |
| `z` | RETIRED 0.1 — renamed `z-index=` | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `kind` | RETIRED language-wide at 0.1 — on a `node` use `shape=`, on a `chart` use `type=`; one spelling was retired on `node` and live on `plot` at once, inside one namespace | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |
| `label` | RETIRED, see below | `edge` | NORMATIVE (diagnostic) |
| `taillabel` | RETIRED, see below | `edge` | NORMATIVE (diagnostic) |
| `headlabel` | RETIRED, see below | `edge` | NORMATIVE (diagnostic) |
| `level` | RETIRED language-wide at 0.1 — **DELETED, not renamed** (`CHART-LEVEL-KEY`): it drew a reference plane through a 3-D bar chart, with zero uses corpus-wide, zero 3-D bar charts and zero requests; it was the only construct whose caption the ENGINE wrote rather than the author, and its `parseFloat` grammar uniquely accepted `1e3` where every other number in the language is `\d+(\.\d+)?` | *(no acceptor; every directive rejects)* | NORMATIVE (diagnostic) |

`in=` is **NORMATIVE**, not split: it is registered on the normative `node`
and on the demoted `threshold`/`band`, and the parenthetical in the status
cell names the
normative registration that earns the status. Writing either key on a
demoted directive is outside the conformance surface, but that follows
from the **directive** being demoted, not from any second status of the
key: `threshold` and `band` carry their status to everything written on
them. Recording it as a status of the key would make `fill`, `style`
and `class` split too — all three are likewise accepted by
`threshold`/`band`/`timing` — and would leave the rule above with nothing to
decide. That is a registration fact, not two meanings; `UNSAFE-DEFAULT-ELIMINATION` and the "no
redefinition" rule are untouched.

`kind=` used to be the one key whose cell really did carry two halves,
because its two registrations were of different KINDS rather than merely
of different status: a retired, rejecting diagnostic on `node` and a live
option on the experimental `plot`. 0.1 ended that (`CHART-BLOCK-NAMING`): a
spelling retired in one half of a namespace and live in the other is the
defect `UNSAFE-DEFAULT-ELIMINATION` exists to prevent, so `kind=` left the language entirely and
the live half became `type=` on `chart`. No key carries two halves now.

**Eleven** registrations carry **no effect**; each exists only so
that a retired or misplaced spelling produces a named migration
diagnostic instead of the generic `unknown option`:
`width=`/`height=` on `node`
(→ a `pin` line), `label=`/`taillabel=`/`headlabel=` on `edge`
(→ inline `[…]` labels), `from=`/`to=` on `band`
(→ the positional range), `at=` on `threshold`
(→ `offset=<0..100>%`) and `fill=` on `edge`, `threshold` and
`bundle` (→ `stroke=`, 0.1, `INTERIOR-LESS-ELEMENT-PAINT`: no interior, so the two keys named
one channel) —
2 + 3 + 2 + 1 + 3 = 11 (key, directive) pairs; the count is per
registration. It was twenty-four until this release, when `color=` moved to
the language-wide list below and took its thirteen per-directive
registrations with it — a key that left the LANGUAGE fires wherever it
appears and needs no per-directive registration at all. It was twenty-five
until this release, when `kind=` made the same move. (This count read
**seven**, and those two read twenty and twenty-one, until this release: the
`at=` and the three `fill=` registrations were named elsewhere in this
section — in the straddle note above and in the key table — but had never
been entered here.)
One retired **VALUE** sits alongside them and is counted separately,
because it is not a (key, directive) registration: `shape=cloud`
(retired 0.1, `SHAPE-ENUM-VOCABULARY` — the one member of a purely geometric enum
that named a domain, which `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` forbid). It follows the same rule —
a named diagnostic instead of the generic `unknown shape` — and is
pinned by `910-errors-retired-shape-cloud` in the NORMATIVE corpus. It
does not change the eleven above. `type=bars3d` (renamed `bar3d`) is a second retired value and is counted the same way.

Retired **KEYS** sit alongside them for the same reason, and are also
counted separately — **nineteen** of them: `w=`, `h=` and `dir=`, `text=` and `z=`,
`kind=` `layer=` `labels=` `unit=` `via=` `src=` `dst=`,
`level=` (0.1 — DELETED rather than renamed, so its message names
no replacement), `color=` (`COLOUR-KEY-STATUS` — retired with no
replacement, and the one message that must name TWO eras), `note=`
(`DESCRIPTION-KEY-SPELLING` — renamed `description=`) and the four WITHDRAWN (`points=` `tailport=` `headport=` `routing=`, `EDGE-GEOMETRY-CONSTRUCTS`). They
are not (key, directive) pairs because they left the LANGUAGE, not a
directive — no directive accepts them, so the message fires wherever the
key appears, the `colw` → `width` precedent. `911-errors-retired-option-keys`
pins the 0.1 three in the NORMATIVE corpus. (This list read
**fourteen** until this release, having stopped: `note=` and
the four withdrawals were added to the language-wide row of the namespace
table above — which has said **19** — but never here.
Nineteen is the engine's own table, key for key.) Moving to this list
DOES change the per-registration count, and twice: `kind=` on `node` left
it, and `color=`'s thirteen per-directive registrations left
it — which is the whole of the 24 → 11 drop. (`w=`/`h=` on
`node` were two of the count before this release and `width=`/`height=` on
`node` are the same two now, so that move was neutral.)

Eight of the eleven messages are pinned by a case in the
NORMATIVE corpus — `203-node-rejected-options` (2),
`255-edge-retired-options` (3) and `905-errors-retired-text-option`, whose
last three lines pin the interior-less `fill=` trio — which is why they
are NORMATIVE (diagnostic). (That fixture also pins the retired
`text=`/`color=` family, which is on the language-wide
list below rather than in this count.) The three exceptions are
`from=`/`to=` on `band` (their only fixture, `373-band-errors`) and `at=`
on `threshold` (`376-threshold-offset`), both tagged
EXPERIMENTAL because their subject is a demoted directive. The status
rule still makes them NORMATIVE (diagnostic) — a retired spelling is gone,
which is the opposite of unconverged — but the pin is not currently in
the normative corpus, and this sentence says so rather than claiming a
coverage that does not exist.
`width=`/`height=` are live on `pin` (on `size` until this release);
`type=` is live only on the experimental `chart`, outside
the v0.1 conformance surface (`level=` was its sibling there until this release deleted it, `CHART-LEVEL-KEY`). `fill=` was registered for the same
reason until this release and left the registry with the `fill` → `band`
keyword rename; it came BACK, as the live spelling
`color=` was renamed to. That is the declared `UNSAFE-DEFAULT-ELIMINATION` exception recorded
above: `fill` is a retired keyword and a live option key at the same
time, and the two can never meet in a document that parses.
The other half of that trade closed the opposite way: `color=` is retired
again and for good (`COLOUR-KEY-STATUS`), so the key whose hazard bought the exception is
no longer in the language at all.

**Conformance mode.** v0.1 has a single mode: **strict**. Unknown
keyword, unknown option, malformed line, or unsupported registered
value → line error; a document with errors MUST NOT render. A *lenient*
mode and an `x-` extension namespace were sketched in earlier drafts
but had zero implementation, zero tests and no enablement path; both
are deferred to v0.2. Until then every unknown line —
including any keyword that happens to start with `x-` — is the ordinary
unknown-keyword error.

**Extension namespace (deferred to v0.2).** Keywords and option keys
beginning with `x-` are reserved for a future experimental/vendor
extension mechanism; standard keywords MUST NOT begin with `x-`.

**Teachability check (`AGENT-TEACHING-COST`).** Target: the full AI authoring guide fits
in ≤120 lines (the always-loaded `skill/figdown/SKILL.md` is the
measurement). **Every** addition to
the top-level keyword set must survive the `NEW-CONSTRUCT-EVIDENCE-GATE` gate — corpus evidence
AND semantic impossibility with the existing vocabulary. There is no
numeric budget: the earlier wording named a "~20 keyword" threshold that
the registry had already passed at 22, which made the rule
self-breaching, and a number in a normative document invites gaming the
count rather than answering the gate. The gate applies to the first
addition and to the hundredth alike.

## 11. Grammar sketch (ABNF)

> Completeness note (`GRAMMAR-SKETCH-COMPLETENESS`=(b), freeze prep): every nonterminal used below is
> defined here or imported from RFC 5234 core rules (`SP` `WSP` `ALPHA`
> `DIGIT` `DQUOTE` `VCHAR` `CRLF`); the `UTF8-*` productions are RFC 3629
> §4's, copied verbatim. Complete means DERIVABLE, so 0.1 corrected
> the grammar in two respects: `comment`/`comment-line` excluded `SP`
> (RFC 5234's `VCHAR` is `%x21-7E`), which made every commented line in
> this document underivable; and `qchar`, `cell-content`, `option-value`
> and `bare-token` were ASCII-only, which contradicted §1's UTF-8 rule,
> the fixture `114-lex-utf8-strings` and an engine that accepts
> `data=甲,乙` unquoted.
> The sketch is still a **sketch** of the
> line grammar — per-directive arity, genre allowlists (`GENRE-KEYWORD-ALLOWLIST`), and typed-block
> child scopes are specified in §1–§10 and the genre documents, not in this
> ABNF alone. Until freeze tags it fully normative, treat closed-grammar
> behaviour of the reference engine + §8 as the authority on errors.

```abnf
document       = *insignificant header *line
insignificant  = comment-line / blank-line
header         = "figdown" SP version SP genre eol
version        = "0.1"                    ; wire major.minor token only
genre          = "block" / "topology" / "flowchart"
               / "bitfield" / "table" / "timing"
line           = directive-line / table-row / insignificant
directive-line = keyword *(SP argument) [SP comment] eol
argument       = qstring / option / bare-token
option         = option-key "=" option-value
option-key     = lower-alpha *(lower-alpha / DIGIT / "-")
               ; must be in the closed option-key registry (§10)
option-value   = *( VCHAR / UTF8-char )   ; one unquoted token (no SP).
               ; `=` IS allowed inside a value — the option key is the
               ; text before the FIRST `=` and the value is everything
               ; after it, so `description="a=b"` and a timing lane written as a
               ; bare token (`x=01`, which REQUIRES `=`) are both
               ; expressible. Earlier revisions excluded %x3D here and in
               ; bare-token, which made the timing genre inexpressible.
               ; A qstring region may appear anywhere inside the token
               ; when the value contains spaces, `#`, or escapes.
               ; A point-valued option uses paren points:
               ;   at=(x,y)                                          (§3)
               ; A comma-delimited list value is ONE whitespace-free
               ; token; a quoted element protects its own comma (§1).
               ; Non-ASCII needs no quotes: `data=甲,乙` on a timing lane
               ; parses, so the UTF-8 rule reaches unquoted values too.
bare-token     = 1*( VCHAR / UTF8-char )  ; non-space run; ops, ids, lanes, …
               ; `=` is permitted: a timing `signal` lane is a bare token
               ; over the closed alphabet [01pnx=.].
keyword        = lower-alpha *(lower-alpha / DIGIT / "-")
id             = (ALPHA / "_") *(ALPHA / DIGIT / "_" / "-")
qstring        = DQUOTE *(qchar / escape) DQUOTE
qchar          = %x20-21 / %x23-5B / %x5D-7E / UTF8-char
               ; any VCHAR or SP except " and \ (those use escape), plus
               ; any non-ASCII character: a document is UTF-8 (§1), and
               ; `title "中文標題"` is pinned by 114-lex-utf8-strings.
escape         = "\" ("n" / DQUOTE / "\")
table-row      = "|" cell-content *("|" cell-content) "|" eol
cell-content   = *( %x09 / %x20-7E / UTF8-char )
               ; raw GFM cell text (escapes: \| \^^;
               ; multi-line only via HTML <br> forms — §4.2 / 0.1)
comment        = "#" *( WSP / VCHAR / UTF8-char )
               ; trailing on a directive line. SP is INSIDE a comment —
               ; a comment runs to end of line and this spec's own
               ; examples are ordinary prose.
comment-line   = *WSP "#" *( WSP / VCHAR / UTF8-char ) eol
blank-line     = *WSP eol
lower-alpha    = %x61-7A; a-z
eol            = CRLF / LF; NOT bare CR — see §1 and the
                                          ; note below the block
; Non-ASCII, verbatim from RFC 3629 §4 (UTF-8 is the document encoding, §1)
UTF8-char      = UTF8-2 / UTF8-3 / UTF8-4
UTF8-2         = %xC2-DF UTF8-tail
UTF8-3         = %xE0 %xA0-BF UTF8-tail / %xE1-EC 2( UTF8-tail )
               / %xED %x80-9F UTF8-tail / %xEE-EF 2( UTF8-tail )
UTF8-4         = %xF0 %x90-BF 2( UTF8-tail ) / %xF1-F3 3( UTF8-tail )
               / %xF4 %x80-8F 2( UTF8-tail )
UTF8-tail      = %x80-BF
; Imported from RFC 5234: SP WSP ALPHA DIGIT DQUOTE VCHAR CRLF
; LF = %x0A ; CR = %x0D
```

Two rules above are normative in substance, not merely sketch:
`*insignificant header` says the header is the first **significant**
line — comments and blank lines MAY precede it — and `SP genre` carries
no brackets, so the genre token is REQUIRED (§1).

**`eol` dropped `CR`.** The rule read `CRLF / LF / CR`
("any common newline form") from the first draft, and bare CR was never
implemented: a CR-only file reaches the reference engine as a single line
and fails on the second directive's first token. No fixture pinned it, and
all 162 case sources are LF. Rather than add a terminator no document uses,
the grammar was corrected to what is accepted — which is also what §1 now
states in prose. A `document` production does not show the BOM: §1 strips a
leading U+FEFF before this grammar applies.

`title` needs no exception here: it is a
`directive-line` whose one argument is a `qstring`, like every other
directive that takes a string. Until that entry it consumed the rest of
its line, and this sketch never expressed that.

The normative point is not this exact ABNF but that the grammar MUST be
mechanically implementable without consulting the reference PoC.

**This is a requirement, not a claim that it is met.** It
holds for the GRAMMAR and for the model, including the `sections` wrapper
(§12.5). It does **not** hold for two things, and §8.2 and §8.3 name them
rather than leave the requirement reading as an achievement: error
messages for cases no fixture covers, and error RECOVERY on inputs where
a failure cascades. `conformance/README.md` carries the same boundary.

## 12. The semantic model (normative)

### 12.1 Status and purpose

This section is **normative**. The abstract model below is the meaning
of a FigDown document, and the JSON form of §12.5 is its **canonical
binding**.

§3 already requires that "a conforming parser MUST produce the same
semantic model for the same source". Until this section existed, that
sentence had no referent: the model lived only inside
[conformance/normalize.js](../conformance/normalize.js) as a testing
projection, so what a second implementation was effectively told was
"match my parse tree", not "here is the meaning contract". Sections 1–11
describe how a document is **written**; this one describes what it
**means** once parsed, which is why it comes last.

The standard exists so that AI agents exchange figure meaning through
`.fd` files (`COMPLETENESS-DEFINITION`). Two agents can only share a language if the shared
artifact is the model, not the grammar: a writing agent commits to
producing a source whose model says what it meant, and a reading agent
is entitled to everything in the model and to nothing outside it. A
renderer is a third party to that exchange. Accordingly:

- A conforming parser MUST produce the model of §12.2–§12.4 for a
  document that parses without errors, and MUST produce no model at all
  for a document with errors (§8: a document with errors renders
  nothing).
- A conforming implementation SHOULD be able to emit the canonical JSON
  binding of §12.5; the golden fixtures in
  [conformance/](../conformance/README.md) are the test.
- A reading agent MAY rely on §12.7 and MUST NOT infer more.

### 12.2 The abstract model

A model is one **document** object. Every field below is listed with its
type, whether it is always present, and what it means. "Present when …"
fields are **omitted** when the condition does not hold — see §12.3.

**Document.** Keys in this order:

| key | type | present | meaning |
|---|---|---|---|
| `header` | object | always | §12.2 *Header* |
| `title` | string | when a `title` line is written | the figure's title (§1); the text is semantic whether or not a renderer draws it (§7). `title ""` is written, so the key is present and empty (§12.3) |
| `flow` | `"right"`\|`"down"`\|`"left"`\|`"up"` | always | the reading axis (§3), materialized from the genre default when no `flow` line is written |
| `classes` | array of *Class* | always (MAY be empty) | §2.7 |
| `planes` | array of *Plane* | always, never empty | the ARRAY is NORMATIVE: `planes[0]` is always the implicit `base` plane. A DECLARED plane is EXPERIMENTAL — §2.4, [experimental.md](experimental.md) §E1. Spelled `layers` until 0.1 (`PLANE-KEYWORD-SPELLING`) |
| `nodes` | array of *Node* | always (MAY be empty) | §2.1 |
| `groups` | array of *Group* | always (MAY be empty) | §2.2 |
| `externals` | array of *External* | when the document declares at least one `external` | §2.8. Spelled `boundaries` until 0.1 (`EXTERNAL-ENDPOINT-NAMING`) |
| `edges` | array of *Edge* | always (MAY be empty) | §2.3 |
| `ranks` | array of *Rank* | always (MAY be empty) | §3 |
| `pins` | array of *Pin* | always (MAY be empty) | §3, layout tier. The `sizes` array merged into this one at 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |
| `thresholds` | array of *Threshold* | always (MAY be empty) | EXPERIMENTAL — but **NOT empty on the whole normative surface**, see below; §2.6, [experimental.md](experimental.md) §E3; per-key shape in §E5. Spelled `guides` until 0.1 (`THRESHOLD-KEYWORD-SPELLING`) |
| `bands` | array of *Band* | always (MAY be empty) | EXPERIMENTAL — same caveat; §2.6, [experimental.md](experimental.md) §E3; per-key shape in §E5 |
| `bundles` | array of *Bundle* | always (MAY be empty) | EXPERIMENTAL — same caveat; §2.5, [experimental.md](experimental.md) §E2; per-key shape in §E5 |
| `regions` | array of *Region* | always (MAY be empty) | §4, in document order |

**Correction: `thresholds`, `bands` and `bundles` are NOT
empty everywhere on the normative surface.** The three rows above said
"empty on the normative surface" until this release, and it
was **false**. Measured against `conformance/cases/`: `115-lex-option-
before-label` and `304-presentation-on-every-element` carry a non-empty
`thresholds`, `bands` AND `bundles`; `214-label-absent-vs-id` and
`215-label-empty-string` carry a non-empty `bundles`. Four normative model
goldens, and an implementation that emits `[]` for all three fails them.

What is true, and is what the clause was reaching for: **no document an
author is TAUGHT to write puts anything in these arrays**, because the
three keywords are EXPERIMENTAL and the authoring surface does not teach them.
The fixtures that populate them are cross-cutting LEXICAL cases — "an
option may precede a label on every directive", "every element takes the
presentation keys" — whose subject is a rule that quantifies over the
whole keyword registry, so they enumerate the registry, experimental rows
included. See [experimental.md](experimental.md) §E0 for what this costs
the skip-experimental promise; the promise is now stated with its
exceptions rather than unconditionally.

**Header.** `header` carries the wire-grammar version and the genre.

| key | type | present | meaning |
|---|---|---|---|
| `version` | string | always | the wire-grammar version from the header line. v0.1 implementations accept exactly `"0.1"` (§1), so in this version it is a constant — **a v0.1 engine emits the literal string `"0.1"` and never copies the source token**, because the source token is the only spelling the grammar accepts. It is NOT the dev increment (0.1), which appears in a rendered artifact's `data-engine-version` and never in the model (§12.6). Stated normatively at 0.1; it was a hard-coded constant in `conformance/normalize.js` and nowhere else |
| `genre` | string | always | one of the six genre tokens (§1). REQUIRED in the source since 0.1, so it can be absent only from a document that failed to parse. Since `GENRE-NAMESPACE` it also names the NAMESPACE the document's top-level keywords belong to — a consumer resolves every non-core keyword against it (§1 `GENRE-NAMESPACE`, §12.7) |

**Class** — `class` (§2.7).

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | the class id; its own namespace |
| `meaning` | string | always | the human- and machine-readable meaning. The FIELD is mandatory on the directive, so the key is never absent — but its VALUE may be the empty string, which is a written value meaning *no meaning is claimed* (§2.7, `EMPTY-LABEL-STATE`/`CLASS-EMPTY-MEANING`). `""` MUST be recorded as `""`; normalizing it to an omitted key would destroy the distinction `EMPTY-LABEL-STATE` exists to preserve |
| `fill` `stroke` `style` | string | when written | presentation defaults the class offers its members (§5) |
| `plane` | string | when written | a declared plane id |
| `line` | number | always | 1-based source line |

**Plane** — the implicit `base`, plus (EXPERIMENTAL) any plane a `plane` line
declares. The `plane` KEYWORD is EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`) and is
defined in [experimental.md](experimental.md) §E1; the `planes` ARRAY is
not — it is always present and never empty, and in a document that declares
no plane it holds exactly the implicit `base`,
`planes[0] = {id:"base", z:0}`. A reader restricted to the normative surface
meets that one object and nothing else.

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | the plane id; `"base"` for the implicit plane |
| `label` | string | when written | descriptive only; nothing reads it. Only a `plane` line can write one, so this key is EXPERIMENTAL |
| `z` | number (integer) | always | paint order among planes; `0` for the implicit `base`. The default for a DECLARED plane is EXPERIMENTAL — [experimental.md](experimental.md) §E1 |

A *Plane* carries **no** `line`: the engine records none. Declaration
order is preserved by array position, which is also what the default `z`
counts. The element and its model field were named `Layer`/`layer` until this release (`PLANE-KEYWORD-SPELLING`); a model key rename is normative (`NORMATIVE-SEMANTIC-MODEL`), so a second
implementation emits `plane`.

**Node** — `node`, and (under `flowchart` only) `process` / `decision` /
`terminator` (§2.1; [genres/experimental/flowchart.md](genres/experimental/flowchart.md) §Roles).

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | unique in the node/group/external/block namespace |
| `label` | string | when written | §12.3 — an absent label is absent, never the id; `""` is written and stays `""` |
| `role` | string | when a role keyword was written | `"process"` \| `"decision"` \| `"terminator"` (`FLOWCHART-ROLE-KEYWORDS`). **NOT materialized**: a bare `node` has NO role, and that absence is a fourth state, not a defaulted `"process"` — `UNSAFE-DEFAULT-ELIMINATION` §3, since a flowchart node may be a datastore, an annotation, a state or a wait. Legal only under genre `flowchart` |
| `shape` | string | always | the §2.1 geometric enum; materialized default `"box"`, or DERIVED from `role` when one is written (`process`→`box`, `decision`→`diamond`, `terminator`→`rounded`). A `shape=` on a role line changes THIS field and never `role` (§12.7) |
| `group` | string | when `in=` is written | the containing group's id |
| `plane` | string | always | materialized default `"base"` |
| `fill` `stroke` `style` | string | when written | §5 |
| `class` | **array of string** | when written | **references** to declared classes, never their resolved values (§12.6). Always an array, even for one class: `class=hot` emits `["hot"]`, because `class=` is multi-valued (`class=a,b`) and a consumer must not have to branch on arity (§12.5) |
| `line` | number | always | 1-based source line |

**Group** — `group` (§2.2).

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | unique in the shared id namespace |
| `label` | string | when written | §12.3 |
| `gap` | number | when written | member spacing in px (presentation) |
| `plane` | string | when written | **not** materialized — unlike `node`/`edge` (§12.4) |
| `fill` `stroke` `style` | string | when written | §5 |
| `class` | **array of string** | when written | class references, always an array (§12.5) — `class=hot` emits `["hot"]` |
| `line` | number | always | 1-based source line |

Group membership is recorded **on the member**, as `node.group`. A
*Group* holds no child list.

**External** — `external` (§2.8). The element and the top-level array
were named `Boundary`/`boundaries` until this release (`EXTERNAL-ENDPOINT-NAMING`).

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | unique in the shared id namespace |
| `label` | string | when written | no id fallback: an unlabelled external endpoint draws no text, and so does `""` (§12.3). An external carries NO presentation key at all since 0.1: `color=` was the only one it took and it is retired (`COLOUR-KEY-STATUS`) |
| `plane` | string | when written | **not** materialized |
| `line` | number | always | 1-based source line |

**Edge** — `edge` (§2.3).

| key | type | present | meaning |
|---|---|---|---|
| `a` | string | always | the FIRST endpoint **as written** |
| `op` | `"--"`\|`"->"`\|`"<-"`\|`"<->"` | always | the operator **as written**; the direction of the relationship is derived from it (§12.4) |
| `b` | string | always | the SECOND endpoint **as written** |
| `tail` `mid` `head` | string | when written | the three label positions (§2.3) |
| `plane` | string | always | materialized default `"base"` |
| `stroke` `style` | string | when written | §5. There is **no** `fill`: an edge has no interior, so `fill=` is a line error naming `stroke=` (§5, `INTERIOR-LESS-ELEMENT-PAINT`) |
| `class` | **array of string** | when written | class references, always an array (§12.5) — `class=hot` emits `["hot"]` |
| `line` | number | always | 1-based source line |

**Rank** — `rank` (§3).

| key | type | present | meaning |
|---|---|---|---|
| `ids` | array of string | always | two or more node ids sharing a rank |
| `line` | number | always | 1-based source line |

**Pin** — `pin` (§3, layout tier). ONE object per pinned element, carrying
the whole of its declared geometry. The separate `sizes` array and its
*Size* element were **removed** (`ELEMENT-GEOMETRY-DIRECTIVE`) when `size` merged into
`pin`: one directive, one model object. A consumer that read `sizes[]` reads
`pins[]` and tests for the extent keys.

| key | type | present | meaning |
|---|---|---|---|
| `id` | string | always | the pinned node, group or external endpoint |
| `x` `y` | number | both when `at=` is written, otherwise neither | px in the element's positioning context (§3, `PIN-COORDINATE-SCOPE`); MAY be negative or fractional. `at=` is a POINT, so the pair never splits |
| `width` `height` | number | each when written | positive px matching `\d+(\.\d+)?`. **NODES only** — a group, an `external` endpoint or a typed block carrying either is a line error (§3). Spelled `w`/`h` in both the source and the model until 0.1, and carried by a separate `size` directive until 0.1 |
| `line` | number | always | 1-based source line |

At least one of `x`/`y`, `width`, `height` is always present: a `pin` line
declaring none of them is a line error, so an entry is never empty. A
second `pin` for the same id is a line error, which since the merge is one
rule covering the position and the extent together.

**Threshold**, **Band** and **Bundle** — the three elements whose
directives are EXPERIMENTAL (§10). Their per-key tables moved to
[experimental.md](experimental.md), with the rest of
those constructs' definitions. Their top-level arrays stay in the Document
table above, because a closed model has to say what exists; a document that
stays inside the v0.1 conformance surface writes none of the three, so
`thresholds`, `bands` and `bundles` are `[]`.

**Two Document keys LEFT the model (`EDGE-GEOMETRY-CONSTRUCTS`)**, and they are
the first to do so: the `paths` array and the top-level scalar `routing`,
withdrawn with the `path` and `routing` directives that were their only
source. A model produced by a conforming implementation no longer carries
either key under any circumstance, and there is no successor key — the
requirement is filed as §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, not deferred to a renamed field.
There was a fourth EXPERIMENTAL element, **Path**, whose per-key table had moved
to [experimental.md](experimental.md); it went with the
directive.

**Region** — the nested genre regions of §4, discriminated by `genre`.
Regions appear in `regions` in document order. (`regions`/`genre` were
spelled `blocks`/`type` until this release; the array held the same objects.
The pair now says what a region IS: `GENRE-NAMESPACE` `GENRE-COMPOSITION` defines a nested `bitfield`,
`table` or `timing` as a region governed by THAT genre's namespace, and the
discriminator names exactly that genre. `chart` (§4.4) is the one value
that is not a header genre; it is EXPERIMENTAL and outside the
conformance surface, so a normative-surface reader never meets it. The
value was `"plot"` until this release, `CHART-BLOCK-NAMING`.)

*bitfield* (§4.1, [genres/bitfield.md](genres/bitfield.md)):

| key | type | present | meaning |
|---|---|---|---|
| `genre` | `"bitfield"` | always | discriminator — the nested genre governing this region |
| `id` | string | always | shares the node/group/external namespace |
| `label` | string | when written | §12.3 |
| `word` | number | always | bits per row; materialized default `32` (spelled `unit` until 0.1) |
| `numbering` | `"lsb0"`\|`"msb0"` | always | REQUIRED in the source — no default (`UNSAFE-DEFAULT-ELIMINATION`) |
| `fill` `stroke` | string | when written | §5; a block takes no `style=`/`plane=` |
| `fields` | array | always, never empty | field and break items, interleaved in document order (a `bitfield` with no field is a line error) |
| `line` | number | always | 1-based source line |

A `fields` member is either a **field** — `name` (string), `width`
(number, or the string `"*"` for the variable-length form), `present`
(**string**, when written), `index` (**object**, when written),
`fill` `stroke` `class` `description` (when
written), `line` — or a **break marker**, which carries exactly
`break: true` and `line` (spelled `wrap` until this release, `ROW-BREAK-NAMING`). A field
carries **no `style`** (`STYLE-KEY-SCOPE`): the dash is conditional
presence's only carrier and nothing else may set or clear it.

**`index` is an OBJECT, and the shape is the ruling (`BITFIELD-REPETITION-CONSTRUCT`).**
The model MUST record enough that a reader can tell a DETERMINATE run from an
indeterminate one **without parsing prose**, so the authored text is not what
is stored:

| written | `index` in the model | what a reader concludes |
|---|---|---|
| *(key absent)* | *(member absent)* | no repetition claim |
| `index=""` | `{}` | it repeats; no index is stated |
| `index=0..7` or `index="0..7"` | `{"first": 0, "last": 7}` | **determinate**, 8 elements |
| `index=53..0` | `{"first": 53, "last": 0}` | determinate and descending, 54 elements |
| `index="0..Last Entry"` | `{"first": 0, "last": "Last Entry"}` | base known, count NOT in the document |

**Determinacy is therefore a JSON TYPE TEST on `last`** — number ⇒
determinate, string ⇒ prose — never a quoting test and never a regex over the
author's text (§12.7). `first` is a number whenever it is present, because
`<first>` is always a literal integer in the source. Nothing derived is
materialized: the element COUNT is not a model member, for exactly the reason
§12.4 rule 1 and `DECLARATION-ORDER-SEMANTICS` give for the bit ranges — a reader computes it from
`first` and `last`, which the model does carry.

**Three properties of the written range are normative, and each was left
unstated until this release:**

1. **Whitespace around `..` is not significant.** `index="0 .. 7"` is
   `index=0..7`; the ends are trimmed. It is reachable only in the QUOTED
   form, because an unquoted option value is one whitespace-free token (§1).
   The source is Ada (ISO/IEC 8652), which writes `1 .. 10`. Pinned by
   conformance case `420-bitfield-index-tristate`.
2. **The separator is EXACTLY two dots.** A dot run longer than two is a
   line error, not a separator followed by prose. Until this release the rule
   was stated only as "one `..`, and both ends present", and `index=0...7`
   satisfied its letter — splitting into two parts and recording
   `{"first": 0, "last": ".7"}`, a model the source does not say.
3. **Each literal end MUST be at most 9007199254740991.** §12.5 binds a
   number to an ECMAScript `Number`, so a larger integer would be stored
   rounded, and `|last − first| + 1` would then report a count the source
   does not state. §12.7 requires the model to be recoverable **from the
   source**; a silently rounded index is the case that rule exists to
   exclude, so an end above the bound is a **line error** and never a value.
   The bound applies to `first`, and to `last` when `last` is literal — a
   prose `last` is a string and carries no arithmetic.

`present` replaced a boolean (`PRESENCE-CONDITION-EXPRESSION`). The source construct was
a bare positional flag — `optional` (…0.1), `conditional`
(0.1…0.1, `PRESENCE-FLAG-SPELLING`), `optional` again (`PRESENCE-FLAG-SPELLING`) — and the
model carried `optional: true`, *present only when true*. It is now a
**string carrying the presence condition**, and the test is ABSENCE, never
truthiness: the key is present exactly when the author wrote it, and
**`present: ""` is a written value** meaning "conditional, condition not
stated" (§12.3). `description` was spelled `note` until the same release
(`DESCRIPTION-KEY-SPELLING`).

*table* (§4.2, [genres/table.md](genres/table.md)):

| key | type | present | meaning |
|---|---|---|---|
| `genre` | `"table"` | always | discriminator — the nested genre governing this region |
| `id` | string | always | shared id namespace |
| `label` | string | when written | §12.3 |
| `fill` `stroke` | string | when written | §5 |
| `heads` | array of array of *Cell* | always | header tiers, top-down (`h1`, `h2`, …) |
| `aligns` | array of string | always | per column: `"left"`, `"center"`, `"right"` or `"none"` |
| `rows` | array of *Row* | always (MAY be empty) | data rows, in document order |
| `width` | object | when a `width` line is written | `widths` (array; each member is `"auto"`, `{px: n}` or `{pct: n}`) and `line` |
| `marks` | array of *Mark* | when NON-EMPTY | per-cell annotations |
| `highlights` | array | when NON-EMPTY | each member is `row` (number) + `line` |
| `line` | number | always | 1-based source line |

**`marks` and `highlights` are keyed on EMPTINESS, not on absence.** They are the two keys in the whole model whose presence
rule is "the array has at least one member" rather than §12.3's "the
author wrote something". The distinction is invisible in v0.1 — a `cell`
line either contributes a member or is a line error, and an erroring
document emits no model at all — so the two rules currently select the
same documents. It is stated anyway because it is the rule an
implementation must **code**: emit the key when the array is non-empty,
never `[]` and never `null`. The rows read "when at least one … line is
written" until this release, which described the same behaviour by the
wrong test; the emptiness test is what `conformance/normalize.js`
implements and what the goldens pin. Contrast the document-level
`thresholds` / `bands` / `bundles` / `ranks` / `pins` / `regions`, which
are **always present** and are `[]` when empty: presence is per key, not a
model-wide convention, and §12.2 is the only place that says which is
which.

A *Cell* carries `v` (string, the cell text) and `merge` (`"left"` for a
colspan into the cell on its left, `"up"` for a rowspan into the cell
above), present only when the cell is merged. A *Cell* carries no
`line`; its position in `heads`/`rows` is its address. A *Row* carries
`cells` and `line`. A *Mark* carries `header` (boolean, present only
when the address is a header tier), `row`, `col`, `fill`, `stroke` and
`class` when written, and `line`; header tiers `h1..hN` address as `row`
`1..N`. A *Mark* carries **no `style`** (`STYLE-KEY-SCOPE`).

*timing* (§4.3, [genres/experimental/timing.md](genres/experimental/timing.md)):

| key | type | present | meaning |
|---|---|---|---|
| `genre` | `"timing"` | always | discriminator — the nested genre governing this region |
| `id` | string | always | shared id namespace |
| `label` | string | when written | §12.3 |
| `fill` `stroke` | string | when written | §5 |
| `signals` | array of *Signal* | always, never empty | in document order |
| `gaps` | array of number | when at least one `gap` child is written | cycle indices of the visual breaks |
| `line` | number | always | 1-based source line |

A *Signal* carries `name`, `lane` (the raw lane string — one character
per cycle, over the closed alphabet `[01pnx=.]`), `data` (array, when
`data=` is written; spelled `labels` in both the source and the model
until this release, `SIGNAL-DATA-KEY-SPELLING`), and `fill`/`stroke` when written. A *Signal*
carries **no `style`** (`STYLE-KEY-SCOPE`), and **no** `line`: the
engine records none, and lane order is carried by array position.

*chart* (§4.4) is EXPERIMENTAL and outside the v0.1 conformance surface.
Its shape is `genre: "chart"`, `table` (the referenced table id), `type`,
and `line` (`level` was deleted, `CHART-LEVEL-KEY`). The genre value was `"plot"` and the
type field `kind` until this release (`CHART-BLOCK-NAMING`).

### 12.3 Absent is omitted, and absence is meaning

**Normative rule.** An optional attribute that the source does not write
is **OMITTED** from the model. It MUST NOT be emitted as `null`, as an
empty string, or as a materialized stand-in value. A consumer therefore
tests for the *presence of the key*, and the presence of the key means
the author wrote it.

This is load-bearing, not tidiness. `READ-SIDE-DETERMINISM`/`OMITTED-LABEL-RECORDING` ruled that a materialized
default is legitimate only when it does not merge two distinguishable
documents into one model. `node a` and `node a "a"` are different
documents; recording the first as `label: "a"` forges authorial intent.
So: **the model records absence; the renderer substitutes the id for
display** (§2.1). The substitution is a RENDERING rule and MUST NOT
appear in the model.

The rule applies to every optional attribute in §12.2. Enumerated, the
omitted-when-absent fields are:

- `title` at document level, and the whole `externals` array
  when no `external` is declared. Every other top-level collection is present even
  when empty — the document shape is fixed. (`routing` and `paths` were
  the other two entries here until this release, when `EDGE-GEOMETRY-CONSTRUCTS` removed both keys
  from the model outright.)
- The optional **label** of `node`, `group`, `bundle`, `external`,
  `plane`, `bitfield`, `table` and `timing`. (`class`'s `meaning` and a
  the `threshold` and `band` labels are MANDATORY on their directives and so are always
  present.)
- `fill`, `stroke`, `style` wherever §5 accepts them (0.1: `style`
  is no longer accepted on `field`, `cell` or `signal` — `STYLE-KEY-SCOPE`), and
  `class` on `node`, `group`, `edge`, `field` and the `cell` mark.
- `plane` on `group`, `external`, `bundle`, `threshold`, `band` and `class`.
  (`node` and `edge` are the exception — see §12.4.)
- `node.group` (absent when no `in=`), `group.gap`, edge `tail`/`mid`/
  `head`, `pin.x`/`pin.y` (together — `at=` is a point) and
  `pin.width`/`pin.height` individually.
- `node.role` — a flowchart role keyword's own claim, absent on a bare
  `node`; the absence is meaning (`UNSAFE-DEFAULT-ELIMINATION` §3), not a defaulted `"process"`.
- table `mark.header` — a boolean present **only**
  when true.
- `field.description`, `field.present` and `field.index`, table `width`,
  `marks` and
  `highlights`, timing `signal.data`, and timing `gaps`. **`field.present`
  is the sharpest case in the list**: it is a STRING whose empty value is a
  written value, so the test is absence and never truthiness — `present: ""`
  (conditional, condition not stated) and an omitted `present` (no presence
  claim at all) are two different facts, both recoverable (
  `PRESENCE-CONDITION-EXPRESSION`). **`field.index` is built to the same shape** (`BITFIELD-REPETITION-CONSTRUCT`): an
  EMPTY OBJECT `{}` is a written value meaning "it repeats, no index stated",
  an omitted `index` is no repetition claim at all, and the test is the
  presence of the key — never emptiness and never truthiness, both of which
  would merge the two.

Two consequences a second implementation must honour. A `null` anywhere
in a model is a defect, not a value: it marks a place where a numeric
attribute produced NaN, which is a line error instead.
And an omitted key is **not** a licence to substitute: §12.7 lists what
a reading agent may conclude, and "no label was written" is one of the
things it is entitled to know.

**Absence in the SOURCE — and the one place v0.1 has it.** Everything above
is about absence in the MODEL. There is exactly one construct in v0.1 where
absence in the *source text* carries meaning, and until this release this
enumeration did not name it:

> **A table pipe row's cell is a COLSPAN when its raw segment is EMPTY —
> zero characters between the two `|`.** `| A || B |` is a two-column header
> whose first cell spans two columns. A segment holding only WHITESPACE is an
> ordinary empty cell: `| A |  | B |` is three independent single-column
> cells. The encoding is INJECTIVE — the two are distinguishable, and both
> are pinned as goldens — but the distinguishing evidence is the *absence of
> characters*, which is why it belongs in this section.

The consequences are stated where an author meets them,
[genres/table.md §"The colspan is spelled by an empty segment"](genres/table.md),
and they include a real hazard: **a formatter that pads cells rewrites the
figure.** `| A || B |` → `| A |  | B |` turns a two-tier header with a
colspan into independent single-column headers — no error, a different model,
a different figure. That is a `RENDERING-DETERMINISM` stability break through an ordinary tooling
pass, and it is filed as **§9 `COLSPAN-EMPTY-CELL-SPELLING`**, not fixed: changing the spelling is a
language change in a frozen genre.

**The empty string is a written value.** The rule above distinguishes
*absent* from *written*; an explicitly empty label is *written*, and it
is a third state (`EMPTY-LABEL-STATE`). `node a ""`, `group g ""`, `bundle b ""`,
`external x ""`, `plane L ""`, `title ""` and the typed blocks
`bitfield` / `table` / `timing` all record `label: ""` — never the omitted
key. A consumer that tests truthiness rather than key presence merges
two distinguishable documents and is non-conforming.

The reason is `READ-SIDE-DETERMINISM`'s own premise: writing `""` is a distinction the
author made, and the model must not destroy it. It is also the only way
to express a source figure whose shape carries no text; without it an
author must invent a label or drop the shape, and both lose source
fidelity (`TRANSCRIPTION-FIDELITY-TIERS`).

The id substitution is a RENDERING rule and it applies **only to
absence**. An empty label draws nothing at all — no text, and never the
id, which is an internal handle rather than authored display text. The
implicit `base` plane writes no label and therefore carries none.
(Frozen in case `215-label-empty-string`, with the absent half in
`214-label-absent-vs-id`; the split this replaced was
`conformance/DISCREPANCIES.md` **`EMPTY-LABEL-DIRECTIVE-COVERAGE`**, now resolved.)

### 12.4 Normalization rules

Everything a parser decides that is not literally in the source text.
The list is exhaustive for v0.1.

1. **Materialized defaults.** The parser resolves these before the model
   is visible, so they are ALWAYS present:

   | field | value | ruled by |
   |---|---|---|
   | `flow` | the genre default — `"down"` for `flowchart`, `"right"` for the other five — unless a `flow` line overrides it | §1, `GENRE-NAMESPACE` `PER-GENRE-DEFAULTS` |
   | `node.shape` | `"box"` | §2.1 |
   | `node.plane`, `edge.plane` | `"base"` | §2.4 |
   | `planes[0]` | the implicit base plane `{id: "base", z: 0}`, always first, never declared | §2.4, `PLANE-Z-INDEX-DEFAULT` |
   | `plane.z` | see rule 2 | §2.4, `PLANE-Z-INDEX-DEFAULT`/`READ-SIDE-DETERMINISM` |
   | `band.extend` | `"up"` | §2.6 |
   | `band.fill` | the renderer's band colour | caveat below |
   | `bitfield.word` | `32` | §4.1 |

   Every one of them names something the author left to the language;
   none of them invents content (`READ-SIDE-DETERMINISM` §3). `numbering=` is deliberately
   **not** on this list: it has no default because a wrong bit ruler
   asserts a falsehood (`UNSAFE-DEFAULT-ELIMINATION` §3).

   `band.fill` is the one entry that breaks `READ-SIDE-DETERMINISM`'s rule and is recorded
   as such (it was misspelled `band.color` in this table until this release;
   the model key has always been `fill`): the engine resolves it before the model exists, so a band
   that wrote no `fill=` is indistinguishable from one that wrote the
   default value. Frozen in the goldens and noted in
   [conformance/README.md](../conformance/README.md); a v0.2 candidate,
   not a licence.

   `plane=` is materialized only on `node` and `edge`. On `group`,
   `external`, `bundle`, `threshold`, `band` and `class` it is omitted when
   absent. The asymmetry is the reference engine's; it is stated here so
   a second implementation reproduces it exactly rather than guessing.
   Uniformity is a v0.2 candidate.

2. **Default `z`.** The implicit `base` plane is `z = 0`. A `plane` line
   without `z-index=` takes its 1-based position among the DECLARED planes in
   document order (`base` excluded). An explicit `z-index=` overrides for its
   own line only and does not shift its neighbours, so
   `plane a` / `plane b z-index=10` / `plane c` yields model `z` = 1, 10, 3. Values
   need be neither unique nor contiguous; ties keep document order.
   (§2.4, `PLANE-Z-INDEX-DEFAULT`/`READ-SIDE-DETERMINISM`.)

3. **Edge direction is derived, and the written form is preserved.** The
   model of `edge b <- a` is `{a: "b", op: "<-", b: "a"}`. Normalizing
   it to `{a: "a", op: "->", b: "b"}` is FORBIDDEN, and so is the
   reverse rewrite. The **direction of the relationship** is read from
   the operator — `->` runs first→second, `<-` runs second→first, `--`
   is undirected, `<->` is bidirectional — so two implementations agree
   on direction without agreeing on a normal form. Normalizing would
   also break references: `bundle`
   records members in written order. (§2.3, `EDGE-WRITTEN-FORM`/`READ-SIDE-DETERMINISM`.) Restating an edge to
   refer to it was `path`'s mechanism too, until `EDGE-GEOMETRY-CONSTRUCTS` withdrew the
   directive — and that mechanism's inability to grow is
   what §9 `EDGE-IDENTITY-AND-GEOMETRY` records as the blocker.

4. **No inheritance, no resolution, one scope.** The model is flat.
   `class=` is recorded as a reference and its presentation values are
   NEVER copied onto the member; `in=` is recorded on the member as
   `node.group` and never as a child list on the group; `plane=` is
   recorded on the element and never distributed from the `plane` line.
   No directive's attributes flow to any other line. The language has
   exactly one scope, rule 5.

5. **Typed-block child scope is sticky.** A child directive attaches to
   the nearest preceding block of a kind that accepts it: `field` and
   `break` to a `bitfield`; `|` rows, `cell` and `width` to a `table`;
   `signal` and `gap` to a `timing` block. There is no `end` keyword — **any
   top-level directive closes the open block**, so a `field` after a
   `node` line is the error `"field" is a typed-block child — it needs a
   bitfield/table/timing block above it`. A child whose kind the open
   block does not accept is likewise a line error. Children appear as
   arrays inside their block in document order. (§4.)

6. **Document order, and the `line` field.** Every array is in document
   order. `pins` is keyed by id in the engine and is
   emitted **sorted by source line**, which is the same thing. Within a
   plane, document order is paint order — a later line paints on top
   (§2.4).

   Every element carries `line`, its **1-based source line number**, and
   that is what makes global document order recoverable across the
   per-kind arrays. Three element kinds carry no `line` because the
   engine records none — `plane`, timing `signal`, and a table *Cell* —
   and for those, array position is the only order information. That
   asymmetry is a v0.2 candidate; it is recorded here because a second
   implementation must reproduce it to byte-compare.

   `line` counts physical source lines from 1, including comment and
   blank lines and the insignificant lines that may precede the header
   (§1). It is the same number the error model reports (§8), which is
   what makes the write→validate→fix loop work.

7. **Values are recorded as written.** Colours are NOT normalized: `#0d9`,
   `#0d9488`, `teal` and `transparent` are stored verbatim, because §5
   accepts all four spellings and a consumer that needs a canonical form
   can compute one. Percentages lose only their `%` sign
   (`threshold offset=15%` → `15`); `at=` and `cell`
   coordinates keep their sign and any fraction. Each of those two is a
   PAREN point in the source (`at=(x,y)`, `cell (r,c)`) and a pair of
   numbers in the model — the parens are the surface's way of saying "one
   composite value", and the model has no punctuation to carry.
   String escapes are RESOLVED at parse time **inside quoted-string
   tokens** (§1) — `\n` becomes a real line break in the stored string,
   `\"` a quote, `\\` a backslash — so the model holds the author's text,
   not its source spelling. **Pipe-row cells are not quoted strings**:
   their only escapes are `\|` and `\^^`, and the sole in-cell line break
   is the GFM-style HTML form `<br>` / `<br/>` / `<br />`, normalized to
   U+000A. A backslash-`n` pair in a cell is two literal
   characters.

8. **Nothing about the document is inferred.** There is no layout in the
   model, no id generation, no de-duplication, no reordering, and no
   completion of missing declarations: an id that names nothing is a
   line error (§8), never a synthesized element.

### 12.5 The canonical JSON binding

`NNN-name.model.json` as produced by
[conformance/normalize.js](../conformance/normalize.js) is the
**normative serialization** of the model. It is what a second
implementation is compared against, byte for byte.

- **Encoding**: UTF-8, no BOM. Comparison is of **UTF-8 bytes**.
- **Serialization**: `JSON.stringify(model, null, 2)` — two-space
  indentation — followed by exactly one trailing newline (LF). That
  call is the reference algorithm; a second implementation must match
  its output bytes, not invent an equivalent JSON text.
- **Key names**: exactly the names of §12.2. They are the model's
  vocabulary and are versioned like the grammar: renaming one is a
  migration entry (`template` → `genre`, 0.1, is the precedent).
- **Key order**: the emission order of §12.2, top level and per element.
  JSON objects are unordered in principle, but the goldens are compared
  as bytes, so key order is part of the binding.
- **Array order**: document order, per §12.4 rule 6.
- **Strings (the numeric-value rule = U)**: the model holds the author's
  text after source escapes are resolved (§12.4 rule 7) — real newlines,
  real quotes, real backslashes, and Unicode scalar values as written in
  the `.fd` (no NFC/NFD normalization). In the canonical JSON file:
  - non-ASCII code points appear as **raw UTF-8 characters** (e.g.
    `"title": "中文"`), not as `\uXXXX` escapes;
  - only the JSON-required escapes apply (`"`, `\`, and control
    characters such as a real U+000A becoming the two-character sequence
    `\n` in the JSON text);
  - requiring or preferring `\uXXXX` for non-ASCII is **not** conforming
    at the golden tier.
  Fixture `114-lex-utf8-strings` pins this.
- **Numbers**: plain JSON numbers as produced by `JSON.stringify` of an
  ECMAScript Number (the same binding as the reference
  `normalize.js`). Integers serialize without a decimal point;
  fractional values use ordinary JSON number syntax (so a source
  `1.10` is the number 1.1 and serializes as `1.1` — there is no
  “fractions as written” preservation of trailing zeros or of the
  source token spelling). Scientific notation is not accepted in the
  wire grammar for `pin` (the numeric-value rule value grammar); when a
  number is in the model it still serializes as a plain JSON number.
  A `null` where a number belongs is a defect (§12.3).
- **Absent keys**: omitted, never `null` (§12.3).
- **Nesting**: exactly as §12.2 — typed-block children nest inside their
  block, table cells inside `heads`/`rows`.
  The model is otherwise flat (§12.4 rule 4).

**The top-level shape, and the `sections` wrapper.** §12.2
describes the model of ONE section. A `.fd` file MAY hold more than one
(§1, `MULTI-FIGURE-DOCUMENTS`), so the canonical JSON has two top-level shapes and the section
COUNT — not the presence of a second `figdown` line, not the genre —
decides which:

- **One section**: the top level IS the §12.2 *Document* object. `header`
  is its first key. There is no wrapper. This is the shape of 62 of the
  65 valid normative fixtures.
- **Two or more sections**: the top level is an object with **exactly one
  key**, `sections`, whose value is an array of §12.2 *Document* objects,
  one per section. Nothing else appears at the top level — there is no
  document-wide `header`, `title` or count key, because there is no
  document-wide genre to put in one (each section declares its own).

| | one section | two or more |
|---|---|---|
| top-level keys | the §12.2 *Document* keys, in §12.2 order | `sections`, and only `sections` |
| where `header` lives | top level | `sections[i].header` |

- **`sections` array order** is **document order**: `sections[0]` is the
  section opened by the first `figdown` line in the file, `sections[1]` by
  the second, and so on. It is the same rule as every other array in the
  model (§12.4 rule 6), applied one level up.
- **Key order inside each element** is unchanged — the §12.2 emission
  order. The wrapper adds a level; it renames and reorders nothing.
- A section's `line` numbers are **file-wide**, not section-relative: they
  count from the first line of the `.fd`, so a `line` value is a valid
  address into the source no matter which section it came from.
- **A one-section file never takes the wrapper**, not even as an array of
  one. Two spellings for one document would defeat byte comparison, which
  is the whole mechanism of this tier.

Pinned by `013-header-duplicate`, `019-multi-section-stack` and
`020-multi-section-id-reuse`. The first two were the wrapper's ONLY
statement in the project until this release — it lived in a comment in
`conformance/run.js`, in no normative document and not even in
`conformance/normalize.js`, so an implementer could emit the wrong
top-level shape with no way to have known.

Comparison is byte equality of the whole file. A second implementation
conforms at this tier when, for every NORMATIVE case in
`conformance/cases/`, it produces a byte-identical `.model.json` — see
[conformance/README.md](../conformance/README.md) for the recipe and for
`DISCREPANCIES.md`, which lists the places where the goldens freeze an
audited engine-vs-spec conflict. Which cases are normative is settled by
LOCATION: every fixture in `conformance/cases/` is normative,
and every fixture in `conformance/experimental/` is not — those are the ones
whose subject `CONSTRUCT-STATUS-TIERS` placed outside the conformance surface (an experimental
genre, or a demoted keyword), and `conformance/STATUS.txt` records the reason
for each. They still run and still pass; they simply carry no obligation.

**Worked example.** This document — deliberately written on the FROZEN
surface only, so that the model below needs nothing from
[experimental.md](experimental.md) to be read (0.1; it declared a
EXPERIMENTAL `plane` until then):

```figdown
# provenance: hand-authored
figdown 0.1 block
title "Lookup path"
class hot "Hot path" stroke=#dc2626
node parse "Parser"
node lookup
external wire "to wire"
edge lookup <-[hit]- parse class=hot
edge lookup -> wire
layout
pin parse at=(20,20)
```

has exactly this model:

```json
{
  "header": {
    "version": "0.1",
    "genre": "block"
  },
  "title": "Lookup path",
  "flow": "right",
  "classes": [
    {
      "id": "hot",
      "meaning": "Hot path",
      "stroke": "#dc2626",
      "line": 4
    }
  ],
  "planes": [
    {
      "id": "base",
      "z": 0
    }
  ],
  "nodes": [
    {
      "id": "parse",
      "label": "Parser",
      "shape": "box",
      "plane": "base",
      "line": 5
    },
    {
      "id": "lookup",
      "shape": "box",
      "plane": "base",
      "line": 6
    }
  ],
  "groups": [],
  "externals": [
    {
      "id": "wire",
      "label": "to wire",
      "line": 7
    }
  ],
  "edges": [
    {
      "a": "lookup",
      "op": "<-",
      "b": "parse",
      "mid": "hit",
      "plane": "base",
      "class": [
        "hot"
      ],
      "line": 8
    },
    {
      "a": "lookup",
      "op": "->",
      "b": "wire",
      "plane": "base",
      "line": 9
    }
  ],
  "ranks": [],
  "pins": [
    {
      "id": "parse",
      "x": 20,
      "y": 20,
      "line": 11
    }
  ],
  "thresholds": [],
  "bands": [],
  "bundles": [],
  "regions": []
}
```

Read it against the rules. The comment above the header is insignificant
(§1) but still counts a source line, so `class` is `line: 4`. `flow` is
materialized to `"right"` although no `flow` line exists. `planes` is
present and holds exactly the implicit `base` at `z: 0` — the document
declares none, which is what a document on the frozen surface looks like,
and every element still reports `plane: "base"`. `node lookup` has **no**
`label` key — the renderer will draw
"lookup", the model will not claim the author wrote it. The first edge
keeps `op: "<-"` with `a: "lookup"`, `b: "parse"`: the relationship runs
parse→lookup, derived from the operator, and the endpoint order is the
author's. `class` is a reference and is an ARRAY, `["hot"]`, because
`class=` is multi-valued — `#dc2626` appears once, on the
class, and is never copied onto the edge. `groups`, `ranks`,
`thresholds`, `bands`, `bundles` and `regions` are present and empty. The
`layout` line contributes
nothing of its own; the `pin` after it lands in `pins`.

*Two defects in the previous edition of this example were found and fixed
when it was rewritten, and both were the same kind: the JSON
had been hand-maintained and had drifted from the engine.* It showed
`"fill": "#dc2626"` on a class whose source line writes `stroke=`, and it
showed `"class": "hot"` as a bare string where the engine emits the array
`["hot"]`. The example is now generated from the engine through
`conformance/normalize.js`, which is the same projection the goldens use.

### 12.6 What the model deliberately does not carry

The model is what survives stripping the layout zone (`GUI-WRITEBACK-STRUCTURE`'s strip test)
and removing every presentation-only attribute (§5's
presentation-ignorable invariant, `PRESENTATION-AS-MEANING-CARRIER`). Everything a renderer computes
is outside it:

- **Geometry** — computed positions and sizes, canvas dimensions,
  border anchor points, edge polylines, elbow corners, label placement,
  text metrics, font sizes. `pin` is in the model as
  the author's *declared constraints*, not as results; nothing else
  geometric is.
- **Resolved presentation** — the colours, strokes and dash styles a
  `class` supplies to its members. The model records `class: ["hot"]` and
  the class's own values, once. A consumer that wants the effective
  colour computes it; the model never bakes it in, because doing so
  would make an inherited value indistinguishable from a written one
  (§12.4 rule 4).
- **Layout results** — rank assignment, obstacle detours, the derived
  `bundle` ring, the derived legend strip, external-endpoint anchor
  placement.
  Each of these is a drawing convention the renderer owns (`DOMAIN-CONVENTION-DIRECTIVES`); the
  model holds only the semantic declaration that triggers it.
- **Derived genre readings** — the bitfield's per-field bit ranges and
  bit numbers, the table's expanded logical grid, the timing figure's per-cycle
  values. Each is a deterministic function of keys the model already
  carries, and §12.7 licenses the reader to compute it. Recording the
  result instead would put a computed value beside the written ones with
  nothing to tell them apart — the same objection that keeps resolved
  `class` presentation out (§12.4 rule 4) — and for `bitfield` there is
  often no single value to record at all: a field carrying `present=`
  branches the answer (`BITFIELD-CONDITIONAL-OFFSETS`), a `*` field leaves it indeterminate, and a
  repeated element whose range is not fully literal leaves every later
  offset indeterminate (§12.7). `DECLARATION-ORDER-SEMANTICS`, 0.1; the `index=` half of
  that last clause is 0.1, `BITFIELD-REPETITION-CONSTRUCT` — a fully-literal `index=` range
  makes the later offsets computable again, and the model still records
  the range rather than the computed offsets.
- **Rendered artifact facts** — the SVG, its embedded source copy and
  SHA-256, and any `data-render-options` (§7). The model is a function
  of the source; the artifact is a function of (source, options).
- **Anything not written down.** No inferred grouping, no inferred
  ordering, no inferred identity between elements (`IDENTITY-ASSERTION`).

The test to apply is `GUI-WRITEBACK-STRUCTURE`'s: delete every `pin` line
and the `layout` opener, then delete every `fill=`,
`stroke=`, `style=`, `gap=` and `z-index=`. What is left MUST parse,
MUST still render under auto layout, and MUST express the identical
structure and relationships. What that stripped document says is the
model's subject matter; `tools/strip-check.js` runs the first half of the
test mechanically.

### 12.7 The reading-agent contract

An agent reading a model MAY conclude:

- **Participants and relationships.** `nodes` are the figure's
  participants; `edges` are relationships between them, with direction
  derived from `op` (§12.4 rule 3). An `external` is NOT a participant —
  it states only that the connection crosses the figure's boundary
  (§2.8).
- **Containment** from `node.group`; **rank co-membership** from `ranks`;
  **bundle membership** from `bundles[].members`.
- **Category** from a `class` reference plus that class's `meaning` — the
  declared, machine-readable mapping colour alone never provides (§2.7,
  `CATEGORICAL-MEANING-MAPPING`). **A class whose `meaning` is `""` asserts NO category** (
  `CLASS-EMPTY-MEANING`): the author declared the class as attribute grouping and claimed
  nothing, so there is nothing to conclude and an agent MUST NOT invent one
  from the id or from the shared presentation. Such a class draws no legend
  entry either, so the two readers agree — which is the point.
- **Genre-specific readings** from the genre documents, which are
  normative and self-contained (`GENRE-DOCUMENT-CONTRACT`): bitfield offsets as the cumulative
  sum of declared widths with `present=` branching (`BITFIELD-CONDITIONAL-OFFSETS`), the table's
  logical grid including merges, timing cycles as lane character positions.
- **Bitfield bit numbers (`DECLARATION-ORDER-SEMANTICS`).** Until then this list said
  "offsets" and nothing about `numbering=`, and the rule below — "MAY rely
  on §12.7 and MUST NOT infer more" — therefore FORBADE a conforming
  reader to derive a bit number at all. That made the one REQUIRED option
  in the language (`numbering=`, `UNSAFE-DEFAULT-ELIMINATION`) invisible to the reader it exists
  for, while the human reading the same figure's ruler got an answer. What
  is licensed, and no more:
  - a field's **drawing span** follows from declaration order and the
    declared widths: fields fill a word left to right in the order
    written (**`DECLARATION-ORDER-SEMANTICS`**, §1), wrapping to the next word when it is full, and a
    `break` advances the cursor to the start of the next word. This gives
    each field a row `⌊p / word⌋` and a column `p mod word`;
  - a field's **bit numbers** follow by relabelling those columns with
    `numbering=`: under `msb0` the bit number of column `c` is `c`, so
    bit numbers ascend left to right; under `lsb0` it is `word − 1 − c`,
    so they DESCEND left to right and the highest bit number is at the
    left. The geometry is the same under both values; only the numbers
    change;
  - the derivation is **deterministic** given `word`, `numbering` and the
    widths, all of which the model carries (§12.2). It is therefore
    DERIVED, not inferred, and rule 8 of §12.4 — which bars inference —
    does not reach it;
  - the model does **not** materialize the result, by decision (`DECLARATION-ORDER-SEMANTICS`):
    `present=` makes the answer branched (`BITFIELD-CONDITIONAL-OFFSETS`), `*` makes it
    indeterminate, and a repeated element whose range is not fully
    literal makes every later offset
    indeterminate, so there is no single value to record for the cases
    that most need one, and §12.4 rule 1's materialized-defaults list
    stays what it says it is — things the author left to the language,
    never content computed from what the author wrote. A reader computes
    the ranges; [genres/bitfield.md](genres/bitfield.md)'s semantic model
    is the normative arithmetic and
    `conformance/cases/418-bitfield-bit-number-derivation` is the worked
    example;
  - what MUST NOT be concluded is unchanged: the drawn width of a `*`
    field is not its length, offsets across a field carrying `present=`
    MUST be branched or stated as assumptions, and nothing may be inferred
    from drawing geometry (`MEANING-RECOVERY-SOURCE`).
- **Authored documentation prose (`description=`, 0.1, `DESCRIPTION-KEY-SPELLING`).** A
  `field`'s `description` is authored documentation prose — **quotable and
  displayable, never parsable**. Until this release the key was spelled
  `note` and §12.7 did not list it at all, so a conforming reader was
  forbidden to conclude anything from it: authored content, in the content
  zone, silently discarded. What is licensed is exactly this — quote it,
  display it, attribute it to its field — and no more. It carries no
  structure, no relation and no condition; an agent MUST NOT parse it,
  and MUST NOT read a presence condition out of it (that is what
  `present=` is for, and even there the value is unparsable).

- **Absence.** No `label` key means the author wrote no label, and
  `label: ""` means the author wrote an empty one deliberately — two
  different facts, both recoverable (§12.3).
- **Thresholds and bands (EXPERIMENTAL, §2.6).** Until this release this
  list did not mention them at all, and the rule below — "MAY rely on
  §12.7 and MUST NOT infer more" — therefore FORBADE a conforming reader
  to conclude anything from `threshold "fHIGH = PAUSE turn-on threshold"`:
  authored content, in the content zone, silently discarded with no
  warning. What is licensed, and no more:
  - a `threshold` asserts that the value named by its **label** is a
    reference value on its `in=` target;
  - **the relative ordering of two thresholds on the same target, by
    `offset`, IS knowledge**, not layout. This is an explicit exception to
    the "Arrangement is not precedence" bullet below, which would
    otherwise discard it: the corpus states the fact verbatim
    ("Thresholds ordered from highest to lowest on the … axis"), so
    without the licence the document loses it;
  - `offset=` is a **fraction of the target's rendered extent, not a value
    of any quantity**. The target declares no scale, so no conversion
    exists, and an agent MUST NOT report it as a data value. If a
    quantity is wanted, it is in the label or it is not in the document
    — and if a distinction exists only in the fraction, the document has
    lost it, and the agent SHOULD say so;
  - a `band` asserts that the region named by its **label** spans that
    fraction of the target. Before this release a band had no label and
    therefore asserted nothing at all (§5, `BAND-LABEL-STATUS`);
  - both constructs are EXPERIMENTAL and outside the compatibility
    promise (§10, `CONSTRUCT-STATUS-TIERS`), so a reader that needs a portable conclusion MUST
    treat their presence as it treats any EXPERIMENTAL construct.

**Conditional presence (`bitfield`, 0.1, `PRESENCE-CONDITION-EXPRESSION`).** A `field` carrying
`present=` MAY be absent from the encoded data; a reader computing offsets or
bit numbers across it MUST branch (`BITFIELD-CONDITIONAL-OFFSETS`). The VALUE is authored prose about
that field's presence condition and nothing more. An agent MAY quote or
display it verbatim; it **MUST NOT parse it**, **MUST NOT evaluate it**,
**MUST NOT resolve any name inside it** against a field name, a `class` id or
any other element of the document, and **MUST NOT derive a presence decision
from it**. `present=""` asserts conditional presence with **no condition
stated** — the author claimed nothing, and an agent MUST NOT invent one from
the field's name, its `class`, its `description=` or its neighbours. An
**absent** `present=` key means the author wrote no presence claim; it is
**NOT** an assertion that the field is always present.

**Repetition (`bitfield`, 0.1, `BITFIELD-REPETITION-CONSTRUCT`).** An agent **MUST NOT** assume
that a declared field list enumerates every occurrence of a repeated element,
and where a figure indicates repetition it **MUST** treat all later offsets as
indeterminate. §12.7 already warns a reader off a `*` field's drawn width and
forces branching across a conditional field — the two cases where the model
cannot give one answer. A **repeated** element is the third, and it is the
worst of them: a reader computing offsets across
`field "Segment List[0]" 128` … `field "Segment List[n]" 128` derives a
**confidently wrong** number with nothing attached to warn it. Every other gap
in this section degrades to "unknown"; this one degrades to *wrong*, which is
why it is stated as a MUST NOT rather than left to the genre document.
Indications of repetition include an index or range in a field label
(`[0]`, `[n]`, `1..n`), a declared count field naming the repeated section
(DNS's QDCOUNT/ANCOUNT/NSCOUNT/ARCOUNT), and a terminator condition stated in
prose (MPLS's S bit).

**`index=` is the exception, and it is the only way out of that MUST NOT
(`BITFIELD-REPETITION-CONSTRUCT`).** Where `index=` is written, the base **is
machine-readable and may be stated**:

- **both ends literal** ⇒ the run is DETERMINATE. Its element count is
  `|last − first| + 1`, the field contributes width × count to the declared
  bit sequence, and **every later field's declared offset becomes determinate
  again** — the arithmetic the MUST NOT above otherwise destroys;
- **one end prose**, or `index=""` ⇒ later offsets stay indeterminate exactly
  as before. What changed is not the conclusion but how it is REACHED: from
  **syntax**, rather than from a reader inspecting label text;
- the value is **never parsed, evaluated or resolved**, verbatim from the
  `present=` contract above. A prose `<last>` may be quoted and displayed and
  nothing more; an agent MUST NOT resolve it against a field name, a `class`
  id or anything else in the document (§9 `ANNOTATION-LOCATOR-SPLIT`);
- **determinacy is decided by the model's TYPES, never by prose** — `last` a
  number ⇒ determinate, `last` a string ⇒ not (§12.2). An agent that needs to
  regex the author's text to answer this question is doing something the
  model was shaped to make unnecessary;
- the drawing shows at most TWO occurrences — the first element, the elision
  mark, and the last (`REPEATED-RUN-DRAWING`), or ONE alone when `index=""` states
  no index — whatever the count. Two drawn boxes are never two elements' worth
  of bits: a reader derives the count from `index=` and never from the number
  of drawn rows (`MEANING-RECOVERY-SOURCE`);
- **`step` is RESERVED inside the range and is a line error** (
  `RULE-POSITION-ENUMERATION`). The trigger is a bare lowercase `step` token in the prose `<last>`:
  `index="0..7 step 2"`, `index="0..N step 2"` and `index="0..end step"` are
  line errors; `index="0..7 Step 2"`, `index="0..7 in steps of 2"` and
  `index="0..stepping"` are not, because only the exact spelling a stepped
  range would use can ever be ambiguous with it. The reservation exists so
  that shipping the stepped range in v0.2 (§9 `INDEX-RANGE-STEP`) cannot change what a
  document already written MEANS.

**`BITFIELD-REPETITION-CONSTRUCT`'s MUST NOT stands, and it UNDER-FIRES — recorded, because it is this
section's only prose-parsing reading rule.** The rule tells a reader to look
for indications of repetition in field LABELS, and one of its own three cited
files does not put the indication there. In `examples/mpls.fd` the only
statement that the label stack repeats is in a `description=` — and the
`description=` paragraph above forbids parsing that. So the MUST NOT is
written to fire on a signal the same section refuses a reader permission to
read, and on that file it therefore does not fire at all. `index=` is the
answer to this as much as to the arithmetic: a key that a reader may consult
does not depend on where an author happened to put a sentence.
An agent MUST NOT infer:

- **Arrangement is not precedence.** Array order and `line` record the
  author's statement order, which is a focus and reading-order signal,
  not a ranking, a priority or a sequence. Where an arrangement really is
  knowledge the language has no construct yet (`MEANINGFUL-ARRANGEMENT`) — the layout
  zone is not that construct. A reading agent's DEFAULT is to ignore the
  layout zone entirely (§3, `GENRE-NAMESPACE`); `pins` is
  in the model as the author's declared geometry constraints, and
  carries no meaning. The one exception is the missing-construct workaround
  of §3: when a document's layout looks load-bearing, read it and say
  that you did.
- **`flow` is a reading axis, not a sequence.** It states the direction
  the figure is meant to be read; it does not order the nodes and it
  asserts nothing about time or causality. There is no construct in v0.1
  asserting relative order between edges (see the sequence-genre note in
  §9).
- **A keyword's meaning is relative to its genre.** `header.genre` names
  the namespace of the document's top-level lines, its defaults, and its
  validation profile (§1, `GENRE-NAMESPACE` `GENRE-NAMESPACE`). An agent MUST NOT carry a reading from
  one genre into another: a genre MAY own keywords and MAY spell one the
  same as another genre's with a different meaning and different defaults
  (`GENRE-VOCABULARY-OBLIGATION`), so a directive is only defined relative to the genre whose
  namespace it sits in. A nested region (`bitfield`, `table`, `timing`) is
  read under ITS genre, never the host's (`GENRE-COMPOSITION`, §4). (`GENRE-KEYWORD-ALLOWLIST`)
  the three pure genres reject scene top-level keywords, while the three
  scene genres still share one scene vocabulary — so a keyword's
  *legality* already depends on the section genre even when its *meaning*
  does not yet diverge (`GENRE-VOCABULARY-OBLIGATION` still unused). Multi-section files give each
  section its own genre allowlist. **Two sets are the exception an agent may
  rely on permanently.** The core (`UNIVERSAL-CORE-KEYWORDS`) — `figdown`, `title`, `layout` —
  means the same thing under every genre, and so does **every keyword of
  the layout namespace** (`LAYOUT-ZONE-NAMESPACE`): that is `pin`,
  and nothing else.
  Together those are what let an agent skip the layout zone (§3) without
  first knowing the genre: `layout` marks where the zone starts, and `LAYOUT-ZONE-NAMESPACE`
  guarantees that nothing inside it can be a genre's own semantics.
  **Status does not qualify this**, and the pair that made the point is
  the proof: `path` and `routing` were EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`)
  and genre-independent the whole time, and the status
  clause cashed out — `EDGE-GEOMETRY-CONSTRUCTS` **withdrew** both from the language (§10).
  Stability and belonging are different questions, and an agent that needs
  a portable figure must consult §10's status column rather than assume a
  construct's presence is a promise. Until this release
  this clause said an agent "must not assume their meaning is
  genre-independent"; that reading is **withdrawn** (`LAYOUT-ZONE-NAMESPACE`).
- **Status is part of what a reader must carry (`CONSTRUCT-STATUS-TIERS`, §10).** Every
  keyword and option key is either NORMATIVE (NORMATIVE — in the conformance
  surface and the compatibility promise) or EXPERIMENTAL (EXPERIMENTAL — the
  engine accepts it, but it may change or be withdrawn in a later `0.x`
  without a migration entry). The parser emits no warning for an
  experimental construct, so an agent that needs a portable figure MUST
  consult §10's status column rather than infer status from the fact that
  a line parsed.
- **Presentation is not meaning on its own.** `fill`, `stroke`,
  `style`, `gap` and `z` MAY render meaning but MUST NEVER be its only
  carrier (§5, `PRESENTATION-AS-MEANING-CARRIER`). An agent is entitled to discard them; if a
  distinction exists only there, the document has lost it, and the agent
  SHOULD say so rather than reconstruct it.
- **Identity.** Two elements sharing a `class` share a CATEGORY, not an
  identity; the language has no equivalence or alias relation (`IDENTITY-ASSERTION`).

## 13. Stability and versioning (normative)

**If you are adopting FigDown, read this section first.** It states what
the project promises about a document you write today, what it does not
promise, and what it commits to instead. `MUST`, `MUST NOT`, `SHOULD`
and `MAY` are used with their [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
meanings.

### 13.0 The version scheme (normative)

The project carries **two** version numbers, and every sentence in this
section names which one it means. They can drift, so the scheme binds
them:

| number | what it versions | where it is written |
|---|---|---|
| **`figdown X.Y`** | the **language** — the document format | the `figdown` header line of every `.fd` document (§1) |
| **`vX.Y.Z`** | the **release** — this repository and its engine | the git tag, `package.json`, and the `data-engine-version` attribute of every artifact (§7) |

**The binding.** `figdown X.Y` is **the first two parts of the release
version**. Release `v0.3.2` implements language version `figdown 0.3`.
The language number has no third part and never will: a `Z` bump is by
definition a change the language did not make.

**What each part means.** The scheme is semver-shaped, and `X` is
defined more strictly than semver requires:

| part | meaning |
|---|---|
| **`Z`** | **Bug fixes only.** No new features. The language does not move. `v0.1.1` MAY fix a rendering defect with **no `.fd` file altered** and the language unchanged. |
| **`Y`** | **New features are added. Nothing is ever removed.** Every document that a `Y` release accepted, the next `Y` release still accepts. |
| **`X`** | **The only point at which support may be removed**, and removing it **forces a migration**. |

`X` carries the whole of the removal budget. That is the strict part,
and §13.9 states what it costs.

#### 13.0.1 The compatibility rule

> For a document declaring `figdown x.y` and an engine implementing
> language version `figdown X.Y`:
>
> - **`X` = `x` and `Y` ≥ `y`** ⇒ the engine **MUST** accept the
>   document and render it correctly. Nothing the document used has been
>   removed, because `Y` never removes.
> - **`Y` < `y`** ⇒ the engine **MUST** reject it with a **named
>   diagnostic** (§13.7). It **MUST NOT** guess.
> - **`X` ≠ `x`** ⇒ out of scope of this rule; a major bump is exactly
>   the point at which support may have been removed, and the migration
>   is the answer (§13.9).
> - **`Z` is irrelevant to compatibility.** It is not part of the
>   language number and no compatibility question turns on it.

Never guessing is the same principle §0 states for unknown lines (`CLOSED-GRAMMAR`),
applied to the header: a guess yields **a figure that looks right and
means something else**, and that is the one failure a reader cannot
detect.

#### 13.0.2 Two limits, stated explicitly

Both of these are commonly assumed away, and conflating either one with
the rule above makes the archive (§13.5) look redundant when it is not.

**Limit 1 — this takes force at `v1.0.0`.** During 0.x there is **no such
guarantee**. 0.x is a preview, migrations are best effort (§13.3), and
**`figdown 0.1` → `figdown 0.2` is NOT covered** by §13.0.1. The rule is
written now so that it is rehearsed now (§13.4); it binds from `v1.0.0`.

**Limit 2 — compatible is not byte-identical.** `RENDERING-DETERMINISM` guarantees identical
SVG output for **the same source and the same renderer version** — that
and no more. A `Y` bump MAY legitimately change rendering (better label
placement, say) while removing nothing at all: the document's **meaning**
is unchanged, the **picture** may not be. To recover the exact figure you
need the exact engine, **which is precisely why the per-release archive
exists** (§13.5).

#### 13.0.3 Three promises, three different conditions

Today one word — "version" — carries all three of these, which is why
they get confused. They are distinct, and each is worth something on its
own:

| promise | what it says | condition |
|---|---|---|
| **Compatible** | the document's **meaning** is preserved; the engine accepts it and renders it correctly | same `X`, engine `Y` ≥ document `y`; **from `v1.0.0` only** |
| **Reproducible** | the **bytes** of the SVG are identical | same source **and** same renderer version `vX.Y.Z` (`RENDERING-DETERMINISM`); holds today |
| **Available** | the **archived engine still runs**, so the exact figure can always be recovered | unconditional, from the first release onward (§13.5) |

A document can be **compatible** without being **reproducible** (limit
2). It can be **reproducible** without being **compatible** under a
newer engine (that is what the archive is for). **Available** is the one
unconditional commitment 0.x can make, and §13.5 is why it can be made
unconditionally.

#### 13.0.4 What the source version string does between releases

The table above says `vX.Y.Z` is written in three places. Between two
releases the repository is at none of them, and this states what each
one carries meanwhile.

| where | between releases | at a release |
|---|---|---|
| the **git tag** | none exists for the working state | `vX.Y.Z` is created |
| **`package.json`** | still names the **last** release; it is not the state of the tree | bumped to the new `vX.Y.Z` **by the release act** |
| the engine's version constant, stamped into `data-engine-version` | a **dev increment** `X.Y-dev.N` | rewritten to `X.Y.Z` at publish |

**The dev counter does not reset and does not adopt the release
number.** `N` counts source states of the engine and only ever
increases: `v0.1.0` was published from 0.1, and the next source
state is 0.1, then 0.1. A reset would make `N`
ambiguous across releases, and adopting `X.Y.Z` early would put a
release number on an engine no tag names. Only the release act writes a
release number, and it writes it in `package.json`.

**The mapping to `vX.Y.Z` happens once, at publish.** The published
engine's version constant — and therefore the `data-engine-version` of
every artifact built from it (§7) — reads `X.Y.Z`, matching the tag and
`package.json`. Both readings of that attribute are therefore true and
distinguishable:

- **`X.Y.Z`** — a released engine. A tag names it and an archived page
  runs it (§13.5).
- **`X.Y-dev.N`** — an unreleased source engine. **No tag and no
  archived page exists for it, and none is owed**; `RENDERING-DETERMINISM`'s reproducibility
  still holds for it, but only against that exact source state.

A reader who meets `X.Y-dev.N` in an artifact is looking at output from
between two releases. It is not a version of the **language** — the
language number is still `figdown X.Y` (§13.0) — and nothing about
`figdown X.Y` compatibility turns on it.

### 13.1 0.x is a preview, and it is NOT stable

FigDown 0.x — both the language `figdown 0.y` and the releases `v0.y.z`
that implement it — is a **preview**. The language MAY change between
`figdown 0.y` versions in ways that require a document to be rewritten.
**No 0.x version carries a stability promise**, and none should be read
as carrying one.

This is said plainly because the alternative failure is expensive and
silent: an adopter infers stability from the project's visible care —
the migration log, the conformance suite, the word "frozen" — and finds
out the inference was wrong after standardising on it at scale. The care
is real. The promise a reader would guess from it is not the promise
being made. §13.3 states the promise that is.

### 13.2 "Frozen" is not "stable", and the difference is the point

The word **frozen** appears throughout this repository — a frozen
construct, the frozen surface, a frozen-surface change. It does **not**
mean "will not change".

> **Frozen** names the **scope of the change-management promise**, not
> the absence of change. A frozen construct MAY still change. What
> "frozen" guarantees is *how* it may change: a change to a frozen
> construct MUST ship, in the same release,
>
> 1. an entry in [migrations.md](migrations.md) carrying a **mechanical
>    rewrite rule** (any non-mechanical step flagged as such),
> 2. a **named diagnostic**, so a document written against the old
>    spelling fails loudly and by name instead of silently changing
>    meaning, and
> 3. the corresponding rewrite in
>    [`tools/migrate-figdown.js`](../tools/migrate-figdown.js).
>
> **Stable** would mean the construct does not change. FigDown `figdown
> 0.y` claims that of nothing.

A construct that is not frozen — anything marked EXPERIMENTAL (§10) —
MAY change or be withdrawn with none of (1), (2) or (3). "Frozen" is
therefore a real and useful guarantee, and it is a guarantee about
*process*, not about *permanence*. Read as "stable" it is a promise the
project never made, and the whole of §13 exists so that no one has to
guess which one it is.

What "may still change" **costs** once the §13.0.1 guarantees begin is
stated in §13.9, and it is not small: after `v1.0.0` a frozen construct
cannot be renamed inside `1.y.z` at all.

### 13.3 The three tiers

| | **0.x** (language `figdown 0.y`, releases `v0.y.z`) | **`v1.0.0` and later** |
|---|---|---|
| **Mechanical migration between language versions** | **SHOULD** — best effort | **MUST** |
| **A document staying on an older declared language version** | **MAY** — permitted, not promised | **MUST** be honoured; a rewrite is never forced |
| **The archived engine for a release version remaining runnable** | **MUST** | **MUST** |

Row by row:

- **Mechanical migration.** In `figdown 0.y` the project SHOULD ship a
  mechanical rewrite for every change to a frozen construct, and in
  practice does (§13.2, and every entry in the migration log). It is
  *best effort*: a `figdown 0.y` change MAY land whose migration is
  partly manual, or whose rewrite the tool cannot perform without
  knowing something only a human knows. From `v1.0.0` this becomes MUST
  — a language change that cannot be migrated mechanically cannot ship
  in a `v1.y.z` release.
- **Staying on an older language version.** In 0.x an implementation MAY
  keep accepting an older declared language version, and the project MAY
  stop doing so in a later `v0.y.z` engine. Permitted, not promised.
  From `v1.0.0` this becomes MUST: a document declaring a released
  language version keeps being readable under that version's semantics,
  and **a rewrite is never forced**. §13.0.1 is the precise form of that
  obligation.
- **The archive.** Both tiers: **MUST**. This is the one promise that
  does not weaken in 0.x, and §13.5 is why. Note what it is a promise
  about: the **release** `vX.Y.Z`, not the language `figdown X.Y` —
  because recovering the exact picture needs the exact engine (§13.0.2,
  limit 2).

### 13.4 0.x is a rehearsal — what that means

The migrations are not promised, and they are written all the same. The
reason is deliberate and belongs in the record: **accumulating them is
the rehearsal for `v1.0.0`'s machinery.** A project that begins writing
mechanical rewrites on the day it first MUST have one will discover on
that day whether its tooling, its diagnostics and its habits can produce
one — and it will discover it under a promise it cannot take back.
Writing them through 0.x is how the obligation is tested before it is
binding.

Stated as the working rule:

> **During 0.x the project follows the `v1.0.0` rules without being
> bound by them.** It issues the migration entries, writes the named
> diagnostics and keeps the archive as though §13.0.1 were already in
> force. It is not. **A process failure discovered in 0.x is therefore
> the point of 0.x, not an embarrassment** — it is the rehearsal
> returning its result, and the result is only useful if it is written
> down rather than tidied away.

Two such failures are on the record already, and they are cited here as
evidence that the rehearsal works, not as apologies:

1. **A migration that could not be mechanical.** §13.2's
   contract promises a **mechanical rewrite rule** for a change to a
   frozen construct. The withdrawal of `path` and `routing` had none —
   a *withdrawal* names no replacement spelling, so the correct action
   is **deletion**, and deletion changes the rendered output. The
   contract's wording never anticipated withdrawal at all. Found in 0.x
   this is a sentence to fix; found after `v1.0.0` it is a broken
   promise. (Those two constructs were EXPERIMENTAL, so nothing was
   owed for them — which is exactly why the gap in the *wording* was
   visible without a promise being broken. See §13.9's pressure valve.)
2. **No gate compared an artifact against its source.** Stale artifacts
   shipped twice — 32 files, then 5 — while
   every check reported success, because each artifact was internally
   consistent with itself. The fix was roughly ten lines
   (`tools/artifact-check.js`). A promise of reproducibility (§13.0.3)
   made on top of that gate set would have been a promise nothing was
   checking.

That reason carries a requirement with it, which would not follow from
"be correct for the current release":

> **[`tools/migrate-figdown.js`](../tools/migrate-figdown.js) MUST be
> cumulative and idempotent across language versions**, not merely
> correct for the latest hop. Every rewrite the project has ever shipped
> stays in the tool; a document from any earlier `figdown x.y` MUST
> reach the current one in a single run; and running the tool on an
> already-current document MUST change nothing.

Cumulative, because the rehearsal is worthless if the accumulated
rewrites are discarded each release — `v1.0.0`'s machinery is exactly
the whole chain, and a chain that has never been run end to end has not
been rehearsed. Idempotent, because a migration a user cannot re-run
safely is a migration they will not run at all.

**And the tool MUST itself be tested by fixtures, not by reading it.**
The migration tool is what makes §13.0.1 affordable: an `X` bump costs a
downstream corpus a command rather than a decade. That is only true if
the tool is right, and *staying* right is the failure mode that actually
occurred — it carried a rewrite rule for a full release after the ruling
behind it had been reversed, and a person reading the source found it,
because nothing ran it. [`tools/migrate-check.js`](../tools/migrate-check.js)
is the gate: one fixture pair per rewrite rule, a golden report per
report-only rule, idempotence asserted for every fixture, every migrated
result parsed through the engine, and a **negative** fixture that fails
if a retired rewrite direction ever reappears. FigDown can hold that
standard where a large general-purpose language could not, because the
language is small, closed and line-oriented —
[axiom 6](../README.md#design-axioms) paying off.

### 13.5 The archive — the promise that does not weaken

Per **release version** `vX.Y.Z`, the project commits to two artifacts:

1. **One git tag** naming the release.
2. **One immutable, self-contained engine page** for that release — a
   single HTML file with no external dependency, which renders `figdown
   X.Y` documents exactly as release `vX.Y.Z` defined them.

Neither is ever rewritten. A user who wants to stay on a release always
can, by using that release's engine, and **the promise does not depend
on any future engine understanding old documents**. That independence is
what makes tier 1's "best effort" honest rather than empty: even in the
worst case — a `figdown 0.y` change whose migration is incomplete, or a
future engine that drops an old declared language version — a document
written today still renders, from an artifact that already exists and
cannot be taken away.

It is also the answer to §13.0.2's limit 2. Compatibility preserves
**meaning**; only the archived engine preserves the **picture**. A `Y`
release that improves label placement removes nothing and breaks no
promise, and the reader who needs the byte-identical figure from two
years ago gets it from the archived `vX.Y.Z` page rather than from a
compatibility claim that was never made.

It is also why the archive is a MUST in 0.x while migration is only a
SHOULD: **it costs nothing ongoing.** A tag and a frozen file are
written once at release and never maintained again. A promise that is
cheap to keep forever can be made unconditionally; one that is not
should not be.

**The archive scheme.**

- The **tag** is the release's immutable source state, named `vX.Y.Z`.
- The **engine page** is the release's runnable renderer, published
  beside the tag and never edited afterwards.
- **[migrations.md](migrations.md) is the narrative index** over the
  archive: it is the ordered account of what changed between language
  versions and how to rewrite for it, and each release's entry links
  **its tag** and **its runnable page**. A reader who needs to run an
  old document goes to the migration log, finds the release, and
  follows the link.

During the `figdown 0.1` draft period the log records dated dev
increments (0.1) which are **not** releases: they will be
squashed into `figdown 0.1` at freeze (MIGRATIONS, header). No tag or
archived page exists for a dev increment, and none is owed — the archive
obligation attaches to **release versions**, and `v0.1.0` is the first.

### 13.6 One migration at `figdown 1.0`, none after

**`figdown 0.1` → `figdown 1.0` MAY require a migration**, and that is
**the last time one may be required.** From `v1.0.0` onward, a document
declaring a released language version keeps working as declared: within
`figdown 1.y`, old documents are honoured under their declared semantics
(§13.0.1), and no `v1.y.z` release forces a rewrite.

Downstream can plan on exactly that shape: **expect one migration at
`figdown 1.0`, and none after it** — until a `figdown 2.0`, which is by
§13.0 the only place a removal may occur and which arrives with its own
migration.

If the `figdown 1.0` migration is needed, it arrives under tier 2's MUST
— mechanical, with a named diagnostic, and with the `v0.1.z` archive
still runnable for anyone who chooses not to move.

### 13.7 What a conforming engine MUST do about versions

- **An engine MUST NOT silently reinterpret a document under a language
  version other than the one it declares.** For a document whose
  `figdown` header declares language version *V*, a conforming engine
  either renders it under *V*'s semantics or **rejects it with a named
  diagnostic**. It MUST NOT fall back to another version's semantics,
  guess, or apply a "closest supported" reading. This is §13.0.1's
  `Y` < `y` branch, and it holds for every mismatch, not only that one.

  The reason is the asymmetry: guessing produces **a figure that looks
  right and means something else**. Refusing produces a diagnostic the
  author acts on in one step. A figure whose meaning silently drifted is
  the one failure the reader cannot detect, which makes it worse than no
  figure at all — the same principle §0 states for unknown lines (`CLOSED-GRAMMAR`),
  applied to the header.

- **An engine MUST state which language versions it accepts.** The set
  of accepted declared versions is part of the engine's documented
  interface, not an implementation detail to be discovered by trying a
  document and reading the diagnostic. An adopter choosing an engine
  MUST be able to find out, without running it, whether it will read
  their corpus. Stating the release version `vX.Y.Z` alone does not
  satisfy this; the accepted `figdown X.Y` set is what an author's
  document is checked against.

### 13.8 What tier 2 costs, stated honestly

The `v1.0.0` promises are not free, and the price lands in one place:
**from `v1.0.0` on, every released language version's conformance cases
MUST keep passing, forever.** Each release adds a set of goldens that no
later release may break, because "a document declaring `figdown x.y`
keeps working as declared" is exactly the statement those goldens test.
The suite grows monotonically, and every future change is checked
against the whole of it.

That is the cost of the tier-2 promises, and it is recorded here so it
is chosen rather than discovered.

**Deliberately not built yet (0.x).** Two mechanisms implement the
`v1.0.0` promises and are deferred until they are owed: **version
dispatch in the parser** (selecting a language version's semantics from
the declared header rather than assuming the current one) and
**per-version partitioning of the conformance suite** (one golden set
per released language version, all of them run). Neither exists in 0.x,
and neither is needed while the archive carries the older-version
promise on its own (§13.5). Both are prerequisites for the tier-2
column, not optional refinements of it.

### 13.9 The renaming corollary — a rename is a removal

§13.0 gives `X` the whole removal budget and §13.2 says a frozen
construct MAY still change. Put together they force a rule the project
has not stated before, and it constrains every naming decision made
after `v1.0.0`:

> **Retiring a spelling IS removing support.** The old document does not
> break silently — it gets a named diagnostic, which is what §13.2's
> contract buys — but it **no longer produces a correct figure**, and
> §13.0.1 promises a correct figure, not a helpful error message.
> Therefore **after `v1.0.0` a frozen construct MUST NOT be renamed
> within `figdown 1.y`. A rename takes `figdown 2.0`.**

This is what "a frozen construct may still change" actually costs once
the guarantees begin. During `figdown 0.y` a rename is free — the
project has performed dozens, and the migration log is the evidence.
After `v1.0.0` each one is a major release.

#### 13.9.1 Why the deprecation cycle is refused

The obvious escape is the industry-standard one: deprecate in `1.3`,
warn through `1.4` and `1.5`, remove in `1.6`. **FigDown refuses it**,
and the refusal is recorded here so the argument is not re-fought every
few years and eventually lost by attrition.

**Python is the instructive case, and it does not hold this line.**
`distutils` and `imp` were removed in 3.12, the `collections` ABC
aliases in 3.10 — each by deprecate-then-remove across *minor* releases.
That is a defensible policy and a large, successful project chose it.
FigDown is deliberately stricter, for one reason:

> **Code is maintained; documents are archived.** A deprecation cycle
> assumes the author comes back, runs the thing, and sees the warning. A
> `.fd` written five years ago and never reopened has no such author. It
> is not "maintained software with a lapsed maintainer" — it is a
> figure inside a document someone is reading **right now**, and it
> simply has to render.

Python's assumption holds for its artifact: a package that nobody
imports for five years is a package nobody notices breaking, and one
that is imported daily has someone to read the `DeprecationWarning`.
FigDown's artifact inverts both halves. The figure with no maintainer is
the *normal* case, not the neglected one, and the moment of truth is a
reader opening a document, where no warning channel exists at all.

#### 13.9.2 The pressure valve — freeze is the deprecation decision

Stated alone, §13.9 reads as rigidity: a language that can never rename
anything accumulates its early mistakes forever. It does not, and the
mechanism is already in the process:

> **The thing that needs removing should never have been frozen.** The
> frozen/EXPERIMENTAL split (§10, [experimental.md](experimental.md)) is
> FigDown's deprecation mechanism, **applied before the fact instead of
> after it.**

`path` and `routing` came out of the language cleanly —
withdrawn outright, no replacement spelling, no cycle — **because they
were EXPERIMENTAL**, not because a deprecation process was followed.
That is the valve working as designed.

What the rule does, then, is **move the cost onto the decision to
freeze**, which is where measurement and argument can be brought to bear
(PROCESS §2's gate: semantic impossibility, corpus evidence, prior art
surveyed). Deprecation spends the cost after the fact, on every
downstream reader, at a moment when no evidence can be gathered and no
argument can be had. Freezing carefully spends it once, in advance, in a
room where someone can still say no.
