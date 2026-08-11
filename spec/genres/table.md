# FigDown Genre: `table`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any table figure.
>
> **Genre status: NORMATIVE (`CONSTRUCT-STATUS-TIERS`).** `table` is
> inside the v0.1 conformance surface and inside the compatibility promise: a
> conforming implementation MUST support it, and it changes only through a
> migration entry (`VERSION-MIGRATION-MODEL`). The NORMATIVE v0.1 genres are `block`, `bitfield`
> and `table`; `topology`, `flowchart` and `timing` are EXPERIMENTAL. See core
> doc §10 for what the status means.

**Census**: #3, 9.6% weighted. Prior art: GFM pipe tables (content rows),
markdown-it-multimd-table (span markers).

## Purpose

Expresses configuration tables, state tables, and memory maps as a logical
grid with optional multi-level headers, cell spanning, per-cell colors, and
row highlights. Renders as a formatted table SVG.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| Column alignment (data rows) | left | GFM convention |
| Column alignment (header rows) | center | GFM convention |
| Column width | `auto` | All columns auto-sized |

## Complete vocabulary (normative)

Every keyword and option key valid in a `table` document, with this genre's
defaults. Generated from the reference engine's behaviour and verified
against it; where this table and the core doc's prose disagree,
the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three
(`figdown` `title` `layout`), identical under every genre and never
redefined (`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a
`table` document has no `pin` and no `layout` zone at all, and is complete
without them); **T** = this genre's own vocabulary; **S** = the scene
namespace (see below); **N** = another genre's opener (composition, §4 `GENRE-COMPOSITION`).
The layout zone is a fourth namespace, owned by no genre (`LAYOUT-ZONE-NAMESPACE`)
and reached by no row of this table.

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change or
be withdrawn in a later `0.x` without a migration entry. `table` is itself a
normative genre, so a document that uses only NORMATIVE rows **is** a portable
v0.1 document; the EXPERIMENTAL rows are exactly what would carry it outside the
conformance surface.

### The `table` genre's own vocabulary (NS = T)

| Keyword | Form | Where | Status | Option keys | Default |
|---|---|---|---|---|---|
| `table` | `table <id> ["label"]` | top level, under any genre | NORMATIVE | `fill` `stroke` | label absent |
| `\|` (row token) | `\| cell \| cell \|` | inside a `table` region ONLY | NORMATIVE | — | header tier above `\|---\|`, data row below |
| `cell` | `cell (<r>,<c>)` · `cell <r> highlight` | inside a `table` region ONLY | NORMATIVE | `fill` `stroke` `class` — **`style=` LEFT this list at 0.1** (`STYLE-KEY-SCOPE`) | needs a mark or `highlight` |
| `width` | `width <w1>,<w2>[,<w3>…]` | inside a `table` region ONLY | NORMATIVE | — | all columns `auto`; ONE whitespace-free comma-delimited token. The space form was RETIRED at 0.1 (`POSITIONAL-LIST-SPELLING`); a `px` SUFFIX was rejected at 0.1, so this shares one unit grammar with the `width=` option (auto \| `<n>` \| `<n>%`) |
| `chart` | `chart <table-id>` | top level, under any genre that hosts a `table` | **EXPERIMENTAL** | `type` | reads the table AS the data (rows→X, columns→Y, numeric cells→Z); `type=bar3d` is the only value. Added at 0.1: the keyword had prose mentions but no vocabulary row. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1, so `chart <table-id> [type=bar3d]` is the whole grammar. |

All of this genre's own vocabulary is normative — the row token included:
`table` owns no experimental construct. The experimental constructs a pure
`table` document can still reach is `chart` (below). The two cross-namespace
colour keys used to be on this list and are not any more: `stroke=` was
promoted to NORMATIVE (`STROKE-KEY-STATUS`) and `color=` was retired
language-wide in the same release (`COLOUR-KEY-STATUS`). The engine accepts
them exactly as before and every document that uses them keeps rendering —
but a `table` document that avoids them stays wholly inside the v0.1
conformance surface. Scene keywords including `threshold` and `band` are **not**
on the pure-`table` top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`); put them on a scene section if
needed. (`chart` remains experimental and may attach to a table id in the
same pure-`table` section.)

`cell` and `width` at a document's top level are the line error
`"cell" is a typed-block child — it needs a bitfield/table/timing block above it`;
inside another genre's region they are `"cell" not valid inside bitfield`
(§4, `GENRE-COMPOSITION`).

The region is closed by the next top-level directive — there is no `end`
keyword (§4). Content rows use verbatim GFM pipe syntax; `|` is a registered
line-start token, so the grammar stays closed.

### Row types (inside the region)

| Line form | Meaning |
|-----------|---------|
| `\| cell \| cell \|` before `\|---\|` | Header tier row (`h1`, `h2`, … top-down) |
| `\|---\|` (delimiter row) | REQUIRED GFM **delimiter row** (GFM's own term); marks the header/data boundary; `:` colons give per-column alignment |
| `\| cell \| cell \|` after `\|---\|` | Data row (1-based) |

**The delimiter→alignment mapping, stated.** Each delimiter
segment is trimmed, then read for a leading and a trailing colon; the model's
`aligns` entry for that column (core §12.2) is:

| segment | leading `:` | trailing `:` | `aligns[c]` |
|---|---|---|---|
| `---` | no | no | `"none"` |
| `:--` | yes | no | `"left"` |
| `:-:` | yes | yes | `"center"` |
| `--:` | no | yes | `"right"` |

Any number of hyphens works; `-` alone is a legal segment. `"none"` is a
FOURTH value, not a synonym for `"left"`: it records that the author declared
no alignment, and rendering then applies GFM's defaults (data rows left,
header rows centre). Until this release this document said `|---|` *was* left
and never mentioned `:--` at all, while conformance case
`502-table-separator-forms` pinned all four — so a second implementation had
to reproduce a mapping no normative text stated.

### The colspan is spelled by an EMPTY segment, and a formatter can destroy it

**Normative, and stated here because this is where an author
meets it.** A cell merges LEFT when its **raw segment is empty — zero
characters between the two `|`**. `||` is what that looks like when you type
it, but the rule is the emptiness, not the digraph:

| written | reading |
|---|---|
| `\| A \|\| B \|` | two columns; the first header cell **spans two** |
| `\| A \|  \| B \|` | **three** independent cells, the middle one an ordinary empty cell |

The encoding is **injective** — the two are distinguishable and both are
pinned as goldens — and it is the only place in v0.1 where absence in the
*source text* carries meaning (core §12.3). Until this release this document
said only "`||` colspan-left", which reads as a token you type; the word
"empty" did not appear in it at all, and the actual rule lived in
`vocabulary-sources.tsv` and in a passing clause of a MIGRATIONS rewrite
rule.

> **HAZARD — a Markdown formatter that pads cells rewrites your figure.**
> `| A || B |` → `| A |  | B |` turns a two-tier header with two colspans
> into four independent single-column headers. **No error is reported**: the
> document is still legal, the model is different, and the figure is
> different. If your tool chain runs a formatter over files containing
> FigDown fences, exclude them, or verify the SVG after formatting — the
> artifact's embedded source hash (core §7) is what shows the source moved.

**This is filed, not fixed, and the project argued against itself here.**
`TABLE-ROW-SYNTAX` — the decision that ADOPTED `||`/`^^` from MultiMarkdown — rejected
whitespace-as-alignment *in the same paragraph*, because "formatters like
Prettier pad cells arbitrarily" and "invisible characters carrying semantics
is a classic failure mode (Makefile tabs) and a hallucination source for
LLMs". Both arguments apply verbatim to the rule `TABLE-ROW-SYNTAX` adopted. Changing the
spelling now is a language change in a frozen genre and every alternative
costs something, so 0.1 owes the record rather than a fix: **core §9
`COLSPAN-EMPTY-CELL-SPELLING`** states the alternatives, what would resolve it, and a lint that is
proposed and deliberately not landed.

`^^` is illegal in the first row and `||` in the first column — both are line
errors. Comments are not recognized inside pipe rows (cell text is raw).
Addressing: header tiers `h1..hN` top-down, data rows `1..` below the
delimiter row; targeting a cell merged away by `^^`/`||` is a line error —
annotate the anchor cell. Use `cell … class=<id>` rather than a bare
`fill=` whenever the mark means something (`MEANING-RECOVERY-SOURCE`/`CATEGORICAL-MEANING-MAPPING`): the class label states
the meaning and its colour renders it.

### In-cell line breaks (Br2)

Pipe cells are **raw GFM text**. The only supported **in-cell line break**
is the HTML break used in GFM tables in practice:

| Written in the cell | In the model | Rendered |
|---|---|---|
| `<br>` · `<br/>` · `<br />` (case-insensitive) | U+000A (a real newline) | multi-line cell text; row height grows |
| `\n` (backslash + letter n) | the two characters `\` and `n` | literal, **not** a break |
| any other HTML (`<b>`, `<p>`, …) | literal characters | drawn as text, never as markup |

This is a **deliberate partial alignment with GFM** (HTML `<br>` inside
table cells), not a full HTML-in-cell renderer and not the quoted-string
`\n` escape of §1. The pipe-row escape set remains only `\|` (literal
pipe) and `\^^` (literal caret pair). A reading agent treats U+000A in a
cell value as a soft line break inside that cell; it MUST NOT invent
breaks from geometry.

Attaching a table to a scene element (so an edge can point at a named cell)
is `CROSS-BLOCK-REFERENCES`, has never been implemented, and the engine rejects `attach=` as an
unknown option. Whether a composed region can be declared subordinate to an
element of its host document is a v0.2 question (§4, `GENRE-COMPOSITION`); no v0.1 syntax
expresses it, and when one is designed it must live in the content zone,
never in the layout zone.

### Option-key values and positional forms

| Key | Values | Status | Default |
|---|---|---|---|
| `class` | id of a declared `class` | NORMATIVE | absent |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line, which is SVG's own asymmetry | NORMATIVE | absent |
| *width value* (positional) | `auto` \| `<N>` \| `<N>%` | NORMATIVE | `auto`; count MUST match the column count. The value is a bare number — a `px` SUFFIX was REJECTED at 0.1 so that this keyword and the `width=` option share ONE unit grammar; `90px` is the line error `bad width "90px" — write the number without a unit: 90 (auto \| <px> \| <n>%)`. The form is ONE comma-delimited token, `width auto,90,25%`; the space form was RETIRED at 0.1 (`POSITIONAL-LIST-SPELLING`) — a positional list must terminate at whitespace for the rest of the line to be reservable for future `key=` options |
| *cell address* (positional) | `h1..hN` header tiers top-down · `1..` data rows | NORMATIVE | required |
| `highlight` (positional flag) | present / absent | NORMATIVE | absent; data rows only. **Never on a two-part address, and never on a row that also carries a cell `fill=` — 0.1, `ROW-HIGHLIGHT-CELL-FILL-COLLISION`** |
| span markers (in cell text) | `\|\|` colspan-left · `^^` rowspan-up · `\\\|` literal pipe · `\\^^` literal caret pair | NORMATIVE | — |
| in-cell line break | `<br>` · `<br/>` · `<br />` → U+000A in the model | NORMATIVE | absent; `\n` is **not** an escape in pipe cells |
| alignment (delimiter-row colons) | `\|:--\|` → `"left"` · `\|:-:\|` → `"center"` · `\|--:\|` → `"right"` · `\|---\|` (no colon) → `"none"` | NORMATIVE | `"none"` — the model records that the author declared nothing, not a guessed side. A `"none"` column RENDERS left in data rows and centre in header rows (GFM's own defaults) |

`fill=` and `stroke=` are normative (`STROKE-KEY-STATUS`
promoted `stroke=`; `COLOUR-KEY-STATUS` retired `color=`, so there is no text channel).
Neither may ever be meaning's only carrier (`GUI-WRITEBACK-STRUCTURE`/`PRESENTATION-AS-MEANING-CARRIER`).

**`style=` left `cell` (`STYLE-KEY-SCOPE`).** A dash on one cell carried no
meaning the table did not already carry, and it had **0 uses outside this
repository**. It moved together with `field`'s and `signal`'s copies as one
minimum set — the removal that mattered was `field`'s, where `style=solid`
could erase the dash that is conditional presence's only carrier (`PRESENTATION-AS-MEANING-CARRIER` — the
flag was then spelled `optional`; both it and `conditional` were retired in favour of `present=`); taking one of
the three and leaving the others would have been a special case rather than a
rule. A cell's dash now comes only from a `class=` it joins. Everything the `cell`/`width` surface is made of
is normative: the cell addresses, the `highlight` flag and the span markers,
which carry the grid's meaning, and the column widths and alignment, which
are presentation but have converged just as firmly.

Retired language-wide (`COLOUR-KEY-STATUS`): `color=`. It set the FILL
before this release and the LABEL, and no engine can tell the
two source files apart — so its diagnostic names BOTH eras and hands the
choice to a human. v0.1 has no label-colour key at all; the label colour is
derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).

**Renamed (`CHART-BLOCK-NAMING`).** The one construct this genre hosts without
owning changed spelling, and so did its option key; both old spellings are
now line errors carrying named diagnostics.

| Old | New | Why |
|---|---|---|
| `plot` | `chart` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace, so it is now retired LANGUAGE-WIDE. Its one legal value was renamed `bars3d` → `bar3d` |

**Deleted: `chart level=`.** Not renamed — **deleted**, and
there is no replacement, because the value it carried has no other home.
Zero corpus uses, zero 3-D bar charts, zero requests; it was also the only
construct in the language whose caption the ENGINE wrote rather than the
author, and its `parseFloat` grammar uniquely accepted `1e3`, breaking the
otherwise-uniform `\d+(\.\d+)?` numeric grammar. `chart <table-id>
[type=bar3d]` is now the whole grammar, and the migration tool deletes a
`level=` token from a `chart` line mechanically.

### The core, and what else a `table` document may contain

Core keywords (NS = C, never redefined by any genre — §1 `UNIVERSAL-CORE-KEYWORDS`): `figdown`
`title` `layout` — **three** (`LAYOUT-ZONE-NAMESPACE`; five
until then). Beside them stands the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`):
the zone `layout` opens is a namespace of its own, owned by no genre, and
holds `pin` (NORMATIVE) alone. Every member of it is
**genre-independent** — no genre may define, redefine or extend a keyword
inside the zone, and `GENRE-VOCABULARY-OBLIGATION` does not reach in. The zone also held `path` and
`routing` (EXPERIMENTAL) until this release, when **`EDGE-GEOMETRY-CONSTRUCTS` withdrew both from the
language**: they were core until this release, EXPERIMENTAL from `CONSTRUCT-STATUS-TIERS`, and
removed outright on prior-art and demand evidence
([../migrations.md](../migrations.md) 0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**).
There is no replacement spelling, and `LAYOUT-ZONE-NAMESPACE` itself is unchanged — only its
membership is. `pin` did not leave
the language when it left the core, and it absorbed `size`
(`ELEMENT-GEOMETRY-DIRECTIVE`): `size` is retired, and one `pin` line now carries an element's whole
declared geometry —
`pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]`.

A typed block's geometry derives from its content, so it can be neither
pinned nor sized — and since `ELEMENT-GEOMETRY-DIRECTIVE` the two halves fail with two different
named diagnostics:

- `pin <table-id> at=(0,0)` → `pin of unknown id "<id>"`. A typed block is
  not a node, a group or an `external` endpoint, and those are the only ids
  `at=` may place.
- `pin <table-id> width=200` →
  `pin width=/height= do not apply to the table block "<id>" — its geometry derives from its content`.

(`size of unknown id` is gone with the directive: a line-start `size` is now
its own migration error, naming MIGRATIONS 0.1.) In a document that
contains only its own region, the layout zone therefore has nothing to
target.

That is not a gap in the genre. `UNIVERSAL-CORE-KEYWORDS` fixes what a core keyword *means* wherever
it appears; it does not require every genre to use one. The normal `table`
document has no `pin` and no `layout` zone at all, and is a
complete, conforming v0.1 document without them.

**Top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`).** A pure `table` section accepts only
`UNIVERSAL-CORE-KEYWORDS` core (`figdown` `title` `layout`), the layout namespace's normative
member `pin`, `class` (so `cell class=`
can resolve), the `table` opener, and experimental `chart`. The layout
namespace has no other member to consider: `path` and `routing` were kept off
this list as a **status** fact rather than a namespace one (`LAYOUT-ZONE-NAMESPACE` fixes what a
zone member means wherever it is legal, not which genres admit it), and `EDGE-GEOMETRY-CONSTRUCTS`
withdrew them from the language. Scene keywords
(`node` `group` `external` `edge` `bundle` `plane` `threshold` `band`
`flow` `rank`) are line errors: `"<kw>" is not allowed in genre table`.
That is deliberate narrowing of `GENRE-NAMESPACE`: corpus measurement already showed ten of the
eleven scene keywords appear **zero** times in pure `bitfield`/`table`/`timing`
documents; `class` is the exception and stays on the allowlist. Hybrid
figures that need both a scene and a table panel use **multi-section `MULTI-FIGURE-DOCUMENTS`**
(a later `figdown 0.1 …` line; one file → one stacked SVG) or a scene-host
document with a nested `table` region (`GENRE-COMPOSITION`) — never `node` under
`figdown 0.1 table`. Nested composition under a scene header remains legal
(legacy); multi-section is the taught main-standard path.

### How this differs from the other genres

`table`'s own words — `table`, the `|` row token, `cell`, `width` — are
spelled by no other genre, and it introduces no option key of its own. The
overlaps are deliberate and are the same thing under every genre: the core
of three (NS = C), the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and the cross-namespace keys
`fill` `stroke` `class` (§10), all
NORMATIVE (`STROKE-KEY-STATUS`/`COLOUR-KEY-STATUS`). `style=` was a fourth until this release, when `STYLE-KEY-SCOPE` removed it from `cell`; it remains a
cross-namespace key on the scene directives. One shared spelling is worth naming: the `table` child keyword
`width` (a line, one value per column) and the `width=` option on `pin`
(one element's px extent — a layout-namespace directive,
and the home of the extent keys since `ELEMENT-GEOMETRY-DIRECTIVE` retired `size`) are the SAME
word, as they have been, when
`w=` was retired. That is correct, not tolerated: both denote a horizontal
extent, and `UNSAFE-DEFAULT-ELIMINATION`'s single-source rule says a language that took `fill` and
`stroke` whole from SVG must take `width` and `height` whole too. They
never collide either — a keyword is only ever a line's first token, an
option key only ever the left of a `key=` (§10) — and the two live in
different namespaces besides, `width` in this genre's and `width=` in the
layout zone's. Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future genre MAY spell a keyword the same
as `table`'s with a different meaning; none does today — and `GENRE-VOCABULARY-OBLIGATION` stops at
the layout zone, whose members no genre may respell (`LAYOUT-ZONE-NAMESPACE`).

Status is the other axis of difference, and it is a statement about
convergence rather than about syntax: `table` is a NORMATIVE v0.1 genre
alongside `block` and `bitfield`, while `topology`, `flowchart` and `timing`
are EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`, §10). `table` converged early — it owns its own words
and its own error conditions, and it takes its content-row syntax whole from
GFM, which is exactly the settledness the three experimental genres still
lack.

### `highlight` and a cell `fill=` are one channel (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`)

A row `highlight` and a cell `fill=` both paint the **cell interior**. Writing
both for the same cell is a **line error**, in either of its two forms:

```
cell (1,1) fill=#eeeeee highlight     # one line, two writers
cell 1 highlight                      # …and the two-line form
cell (1,2) fill=#ffffff
```

Both used to parse, and each resolved silently in a different direction. On
one line the `highlight` flag was **discarded and never reached the model**,
while the cell fill drew — so the document lost authored meaning with no
diagnostic. Across two lines both reached the model and the per-cell fill won
at paint time, so the model said "row 1 is highlighted" while the drawing
tinted only part of the row: presentation deleting the visual carrier of
meaning, which is what `PRESENTATION-AS-MEANING-CARRIER` forbids and what `STYLE-KEY-SCOPE` removed `style=` from `field`
for.

**Two keys for one channel resolved by an undocumented precedence is a defect
this language has met before** — `color=` (`COLOUR-KEY-STATUS`) and `fill=`/`stroke=` on
interior-less constructs (§8.4, `INTERIOR-LESS-ELEMENT-PAINT`) — and the answer has always been a named
line error, never a precedence rule. A precedence rule is exactly what `STYLE-KEY-SCOPE`
had just finished removing.

The fix costs nothing an author needs: tint the row (`cell <r> highlight`) or
paint the cell (`cell (<r>,<c>) fill=…` / `class=`), and if the distinction is
knowledge, put it in a `class` whose meaning states it. A `stroke=`-only or
`style`-free `class=` mark on a highlighted row paints a **different** channel
and stays legal.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A table's meaning is its **logical grid**: header tiers (rows above the
delimiter row, addressed `h1..hN` top-down) and data rows (1-based below the
delimiter row), with `||`/`^^` producing spanned logical cells anchored at their
top-left cell.

- `cell` marks and `highlight` are annotations attached to grid addresses.
  The fact of annotation is semantic; its color is presentation.
- `width` and column alignment are presentation-only and never change the grid.
- A reading agent derives the grid from the declared rows and span markers,
  not from rendered cell widths or visual geometry.

## Errors

| Condition | Error |
|-----------|-------|
| Missing `\|---\|` delimiter row | line error |
| A SECOND `\|---\|` delimiter row in one table | line error, `duplicate delimiter row` |
| A SECOND `width` line in one table | line error, `duplicate width` |
| `width` column count does not match table column count | line error |
| `width` written in the retired SPACE form (`width auto 90 25%`) | line error naming MIGRATIONS 0.1 |  <!-- fence-check: skip -->
| `width` value with a `px` suffix (`90px`) | line error naming the unit-free spelling |
| `^^` in the first data or header row | line error |
| `\|\|` in the first column | line error |
| `cell` targeting a merged-away cell (not the anchor) | line error |
| `cell` with an unknown row/column address | line error |
| `table` with a BARE label (`table t Caption`) | line error naming the quote, `table label must be quoted` (`RULE-POSITION-ENUMERATION`). It parsed until then, at 3 of the language's 15 labelled positions, while this document already wrote the form `table <id> ["label"]` |  <!-- fence-check: skip -->
| `highlight` written QUOTED (`cell 1 "highlight"`) | line error, RULE 2.4 (`RULE-POSITION-ENUMERATION`) — a bare keyword flag is a closed set of spellings, of size one |
| `width` element written QUOTED (`width "auto",90`) | **legal, and inert** — a table `width` element is `auto\|<n>\|<n>%`, an open value space (SYNTAX-STYLE RULE 2.3b), and `auto` is a declared exception, §8.6 |
| `highlight` on a two-part cell address (`cell (1,1) fill=… highlight`) | line error (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`) |
| A cell mark resolving to a `fill` on a row that carries `highlight` | line error (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`) |
| Unknown option on `table`, `width`, or `cell` | line error |

**The two `duplicate …` rows were golden-pinned but MISSING from this
table until this release**, in a document that opens by calling exactly that
disagreement a defect to report. They are instances of the general rule
(core §8.1): a single-valued construct is a line error on its second
occurrence. `width` is single-valued per table and the delimiter row is
single-valued per table, the same way `title` is single-valued per
section.

**Precedence, and it is not what the sibling construct does.** When a
second `width` line ALSO carries a bad value, only `duplicate width` is
reported — the value error is swallowed. `pin`, the other single-valued
per-id construct, resolves this the OPPOSITE way: it reports the value
error and never fires `duplicate pin`. Neither order is specified; both
are frozen in goldens and filed as core §9 `ERROR-RECOVERY-MODEL`. Do not infer one from
the other.

## Example

```figdown
figdown 0.1 table
table fib "FIB Table"
| Route          || Forwarding    ||
| Prefix | Next Hop | Port | VRF   |
|--------|:--------:|------|-------|
| 10.0.0.0/8  | R2  | p1  | default |
| 10.1.0.0/16 | R4  | p2  | default |
| ^^          | R3  | p2  | default |
width auto,90,auto,25%
cell 2 highlight
cell (3,2) fill=#dbeafe
cell (h1,1) fill=#eeede6
```
