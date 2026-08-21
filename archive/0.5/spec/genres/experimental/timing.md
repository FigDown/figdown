# FigDown Genre: `timing`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any timing figure.
>
> **Genre status: EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).** `timing` is
> outside the v0.1 conformance surface and outside the compatibility
> promise. The engine accepts it unchanged, every existing `timing` document
> parses and renders exactly as before, and no `.fd` needs rewriting — but
> the genre may change or be withdrawn in a later `0.x` without a migration
> entry, and a `timing` document is not a portable v0.1 document. It is
> demoted because it has **not converged**, and the unconverged part is not
> the lane alphabet: that is a strict SUBSET of established prior art
> (WaveDrom, `DESIGN-DECISION-METHOD` — every character carries WaveDrom's own meaning; see the
> alphabet section, corrected), closed, and settled. What is unsettled is the surface around it —
> `data=`, which names the `=` cells positionally from a separate option
> rather than at the cell, and `gap`, a child keyword that carries a time
> break under the one spelling v0.1 also uses for a scene option. Neither
> is wrong and neither is deprecated. The NORMATIVE v0.1 genres are
> `block`, `bitfield` and `table`. See core doc §10 for what the status
> means. This document remains normative *for* the genre: it is the
> authority on what `timing` means.

**Census**: #5, 7.2% weighted. Prior art: WaveDrom (lane alphabet is a
strict subset of WaveDrom's, `DESIGN-DECISION-METHOD` — do not reinvent, and do not redefine:
`2`–`9` were retired for having been redefined).

## Renamed: `wave` → `timing` (`TIMING-GENRE-NAMING`)

The genre was spelled `wave` until 0.1, in both positions — the header
genre token (`figdown 0.1 wave`) and the block opener (`wave por "…"`). Both  <!-- fence-check: skip -->
old spellings are now line errors carrying a named diagnostic. The child
keywords `signal` and `gap`, the lane alphabet, `data=` and the model's
signal shape are all unchanged; only the genre's own name moved.

**The old name was a referent error, not a taste call.** In WaveJSON
`signal` is the **root object** and **`wave` is a property of one signal** —
"the signal lane activity". FigDown therefore named a whole figure kind after
WaveDrom's **member key**, and left WaveDrom's own name for the figure
unused: its tagline is "Digital **Timing** Diagram". `vocabulary-sources.tsv`
carried the contradiction openly — one row gave `signal.lane` the source
spelling `wave`, and another gave the genre opener the same spelling from the
same source. The genre row's attribution is corrected there.

`timing` is right by `GENRE-DOCUMENT-CONTRACT` §6(e): a genre is named after the established name
of the FIGURE KIND in the community whose drawing conventions it borrows.
"Timing diagram" is the datasheet and JEDEC term for this figure, and **UML
2.5.1's Timing Diagram is the same concept** — a lifeline's state over time
drawn as a waveform — so this is correct reuse under core §10, not a
collision. `timing` was unregistered in FigDown before this release.

**The rename frees `wave` for the lane**, which is a precondition for the
eventual `data=` fix: WaveJSON puts the lane string under `wave` and the value
labels under `data`, and FigDown can now spell the first of those the way its
source does.

## Purpose

Expresses digital timing diagrams as per-signal character lanes where one
character = one cycle. Renders as aligned signal waveforms with a time axis.

**When not to reach for it.** The axis here is the clock: when the ordering is
occurrence order in an exchange between participants rather than cycles, the
figure is a `sequence`, and when it is the bit layout within a word rather
than a signal's value over time, it is a `bitfield`.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| Cycle alignment | Contiguous across all signals | Cycles are globally aligned |

## Complete vocabulary (normative)

Every keyword and option key valid in a `timing` document, with this genre's
defaults. Generated from the reference engine's behaviour and verified
against it; where this table and the core doc's prose disagree,
the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three
(`figdown` `title` `layout`), identical under every genre and never
redefined (`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a genre
is complete without any of them beyond `figdown`, and a `timing` document
normally has no `layout` zone at all);
**L** = the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`) — the zone `layout`
opens, a namespace of its own that no genre owns and into which `GENRE-VOCABULARY-OBLIGATION` does not
reach; every member of it is genre-independent, and `pin` (NORMATIVE) is its only
member since `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path`/`routing`;
**W** = this genre's own vocabulary; **S** = the scene
namespace (see below); **N** = another genre's opener (composition, §4 `GENRE-COMPOSITION`).

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. Because `timing`
is itself an experimental genre, every construct it owns is outside the
conformance surface, and so is any other row *as written in a `timing`
document*; the column records each construct's **own** status, which is
what an author needs when carrying the same construct into a normative
genre.

### The `timing` genre's own vocabulary (NS = W)

| Keyword | Form | Where | Status | Option keys | Default |
|---|---|---|---|---|---|
| `timing` | `timing <id> ["label"]` | top level, under any genre | **EXPERIMENTAL** | `fill` `stroke` | label absent |
| `signal` | `signal <name> <lane-string>` | inside a `timing` region ONLY | **EXPERIMENTAL** | `data` `fill` `stroke` — **`style=` LEFT this list at 0.1** (`STYLE-KEY-SCOPE`) | lane string required |
| `gap` | `gap <cycle>` | inside a `timing` region ONLY | **EXPERIMENTAL** | — | presentation only; never renumbers cycles |

All three are EXPERIMENTAL by inheritance from the genre (`CONSTRUCT-STATUS-TIERS`), not on their own
account — there is no NORMATIVE `timing` construct, because there is no
NORMATIVE way to open a `timing` region. Demoted is not removed: the engine
accepts all three exactly as before, and every document that uses them keeps
parsing and rendering.

`signal` and `gap` at a document's top level are the line error
`"signal" is a typed-block child — it needs a bitfield/table/timing block above it`;
inside another genre's region they are `"signal" not valid inside table`
(§4, `GENRE-COMPOSITION`).

The region is closed by the next top-level directive — there is no `end`
keyword (§4).

### Lane alphabet (closed — any other character is a line error)

| Char | Meaning |
|------|---------|
| `0` | Low level |
| `1` | High level |
| `p` | Positive clock pulse |
| `n` | Negative clock pulse |
| `x` | Undefined / unknown |
| `=` | Named data cell (named in order via `data=`) |
| `.` | Continue previous value |

`0` and `1` are levels (Low / High), not data values. **A data cell is
spelled `=`, and only `=`.**

**`2`–`9` were RETIRED (`TIMING-LANE-ALPHABET`).** WaveDrom's schema defines `2`
as "value with color 2" … `9` as "value with color 9" and `=` as "value
(default color 2)" — so `=` and `2` are the SAME brick differing only in a
palette index, and WaveDrom's `data` array feeds **every** contiguous value
cell left-to-right without distinguishing them. FigDown did something else
entirely: it drew the digit CHARACTER as the box label and consumed no
`data` entry. The consequence was a silent divergence, and this document's
own example carried it: `signal data x..=3=5x data=cfg,val` read as boxes  <!-- fence-check: skip -->
`cfg,3,val,5` here and as four data cells needing four names to any
WaveDrom-literate reader, with nothing to error on. Writing the digits is
now a line error naming `=` and quoting the WaveDrom meaning.

**What "borrowed" now means, exactly.** Earlier revisions of this section
said the alphabet was "borrowed verbatim (`DESIGN-DECISION-METHOD`)". That was **false** while
`2`–`9` were live, because FigDown gave those characters a different
meaning from the standard it named. The accurate statement
is: FigDown's lane alphabet is a **strict subset** of WaveDrom's — every
character FigDown accepts (`0` `1` `p` `n` `x` `=` `.`) carries WaveDrom's
own meaning, and FigDown accepts no character WaveDrom does not define.
The characters WaveDrom defines and FigDown rejects — `z` `u` `d` `h` `l`
`P` `N` `H` `L` `|` and `2`–`9` — are **RESERVED, not redefined**: a
future version may adopt any of them with WaveDrom's meaning, and no
version may give one a different one. A lane string that parses under
FigDown therefore means the same thing under WaveDrom; the converse does
not hold, and that asymmetry is the whole of the borrowing claim.

The alphabet is the settled part of this genre — closed and unchanged by
`CONSTRUCT-STATUS-TIERS`. The genre's experimental status is about the surface around it
(`data=`, `gap`), not about these characters; an author carrying a lane
string forward should expect it to keep meaning what it means here.

**The lane alphabet reserves three spellings in the OPTION-KEY namespace
(`LANE-ALPHABET-KEY-RESERVATION`, normative — core §10).** A `signal` line is lexed in LANE MODE: a
bare token containing `=` stays positional there, which is what lets
`signal d x=01.` mean a name and a lane rather than a name and an option.
But lane mode is consulted *second* — a token whose key is REGISTERED is
taken as an option before the guard is reached. The alphabet contains the
letters `p`, `n` and `x`, so:

> A single-letter option key spelled `p`, `n` or `x` MUST NEVER be
> registered, in this genre or any other, present or future.

`x=01` is a valid lane today only because no option key is spelled `x`.
Registering one would raise no error anywhere: every existing lane
carrying that letter before an `=` would silently reparse as an option and
the figure would change. The constraint is unexpressible in the language,
so it is enforced by a guard in `conformance/run.js`, which refuses to run
while such a key is registered. `GENRE-VOCABULARY-OBLIGATION` does not waive it: a genre may redefine
a spelling's meaning, but it cannot re-lex another genre's lanes.

**`gap` is the one live cross-genre spelling in v0.1**, and it is exactly
what `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` describes at the option level rather than the keyword level: the
`timing` child keyword `gap <cycle>` (a time break) and the scene option
`gap=<px>` on `group` (member spacing) are different things with the same
spelling. They never collide — a keyword is only ever a line's first token,
an option key only ever the left of a `key=` (§10) — and the header genre
plus the region make the reading unambiguous.

### Option-key values and positional forms

| Key | Values | Status | Default |
|---|---|---|---|
| `data` | comma-separated names for the `=` data cells, in order of appearance | **EXPERIMENTAL** | absent |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line, which is SVG's own asymmetry | NORMATIVE | absent |
| *lane string* (positional) | closed alphabet `0` `1` `p` `n` `x` `=` `.` — a strict subset of WaveDrom's; `2`–`9` retired 0.1 (`TIMING-LANE-ALPHABET`) | **EXPERIMENTAL** | required; any other character is a line error |
| *cycle* (positional, on `gap`) | integer ≥ 0 | **EXPERIMENTAL** | required |

`fill=` and `stroke=` are normative (`STROKE-KEY-STATUS`
promoted `stroke=`; `COLOUR-KEY-STATUS` retired `color=`, so there is no text channel).
Neither may ever be meaning's only carrier (`GUI-WRITEBACK-STRUCTURE`/`PRESENTATION-AS-MEANING-CARRIER`). They stay
reachable in a `timing` document only as far as the genre itself is.

**`style=` left `signal` (`STYLE-KEY-SCOPE`).** A lane's meaning is its lane
string; a dashed waveform said nothing the string did not, and it had **0
uses outside this repository**. It moved with `field`'s and `cell`'s copies
as one minimum set — see [bitfield.md](../bitfield.md) for the `field` case,
which is the one that was a correctness defect (`PRESENTATION-AS-MEANING-CARRIER`) rather than a
simplification. Their status is the same under every
genre, which is why the two rows are split here even though a `timing`
document is experimental either way. `data=` and the two positional forms
are experimental because the constructs that accept them are (`signal`,
`gap`), and `data=` is one of the two reasons the genre has not converged.

Retired language-wide (`COLOUR-KEY-STATUS`): `color=`. It set the FILL
in one era and the LABEL in another, and no engine can tell the
two source files apart — so its diagnostic names BOTH eras and hands the
choice to a human. v0.1 has no label-colour key at all; the label colour is
derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).

**Renamed: `labels=` → `data=` (`SIGNAL-DATA-KEY-SPELLING`).** WaveDrom's own key is
`data`, "an array of signal labels", one entry per value cell in order of
appearance — the same array, the same order, the same bricks. A genre whose
lane alphabet is a strict subset of WaveDrom's had no reason to spell that
one array differently (`UNSAFE-DEFAULT-ELIMINATION` single-source). `labels=` is now a line error
carrying a named diagnostic; it is kept registered only so a stale document
gets that migration instead of `unknown option`.

### `timing` takes NO `note=`, and the refusal is this genre's own (`DRAWN-ANNOTATION-FORM`)

`note=` became a live option key — the **DRAWN** annotation, the
one that puts an explanation on the page — accepted on the scene genres'
elements and on `title`. **`timing` grants it to nothing.** Neither `signal`
nor `gap` nor the `timing` opener accepts it, at any version:

<!-- fence-check: skip -->
```figdown
figdown 0.3 timing
timing bus "Bus"
signal clk 01010101 note="free-running"
signal req 00110011
```

That third line is a line error under `figdown 0.3` exactly as it was under
`figdown 0.1`.

**Why, in this genre's terms.** There are **zero measured instances** of a
drawn per-signal aside in the corpus, and this genre is the least converged in
the language — every construct it owns is EXPERIMENTAL, and `data=` is one of
the two reasons it has not converged. Granting a brand-new key to a vocabulary
that may still change its shape spends the key on a surface that is not
settled. A `timing` figure that needs a drawn note today puts the waveform in
a scene section (§4, `GENRE-COMPOSITION`) and writes the `note=` on the scene element or on
`title`, where this release does accept it.

**What would reopen it:** a **measured count of `timing` figures** whose
per-signal or per-cycle caveat must be visible on the page — and, before that,
the genre converging. Bring the count and the figures.

**`note=` and `description=` divide by AUDIENCE, and `timing` accepts
neither.** `description=` reaches the **machine** — no ink beyond an SVG
`<title>` tooltip — and belongs to `bitfield`'s `field`
([../bitfield.md](../bitfield.md)); `note=` reaches the **human** and always
draws. Neither is a fallback for the other.

**Where a typed slot exists, `note=` would not be the right answer anyway.**
This genre's slots are unusually literal:

- **what a signal does over time IS its lane string** — the closed alphabet
  `0` `1` `p` `n` `x` `=` `.`, one character per cycle. A note saying "goes
  high on the third clock" says less than `001` does, and a reading agent can
  act on the string;
- **the name of a value cell is `data=`**, in order of appearance, not a note
  beside the brick;
- **a break in the record is `gap`**, which is presentation only and never
  renumbers cycles;
- **a category** shared by several signals is a `class` meaning, which earns a
  legend entry.

### This region's ADDRESS SPACE, and what `in=` consumes today (`MARKER-TARGET-KINDS`, `GENRE-DOCUMENT-CONTRACT`)

**A `timing` region's address space is `(signal,cycle)`**, stated here as this
genre's own, normatively (`GENRE-DOCUMENT-CONTRACT`):

- **signal** is the nth declared `signal`, counted in DECLARATION ORDER (`DECLARATION-ORDER-SEMANTICS`),
  1-based — declaration order is drawing order top-down, so it is also the
  order a reader sees;
- **cycle** is the 1-based position along the lane string, counted in
  characters. A `gap` never renumbers cycles, so inserting one does not move
  any address.

**Only the region HEAD is consumed today.** `threshold` and `band`
resolve (`MARKER-TARGET-KINDS`) `in=<region-id>` against a nested
`bitfield`/`table`/`timing` region as well as a `node` or a `group`:
`threshold "setup" in=bus offset=50%` names the whole `timing bus` block. The
widening is **ungated** — it adds no spelling, and the only documents it
affects are ones that previously answered `unknown target "bus" for threshold`
and drew nothing at all.

**The coordinate grammar is designed and deliberately NOT built.**
`in=bus(2,7)` — a mark addressed to one signal at one cycle, which is exactly
the shape a timing figure would eventually want — has **no shipping consumer**,
and RULE 4.7 argues against spending a grammar before one exists. The address
space is written down here so a later consumer inherits a decided answer
instead of inventing a second one; the engine accepts the region head and
nothing else.

**`GENRE-KEYWORD-ALLOWLIST` is unchanged by this.** `threshold` and `band` are still **not** on the
pure-`timing` top-level allowlist: under `figdown 0.1 timing` they remain the
line error `"threshold" is not allowed in genre timing`. `MARKER-TARGET-KINDS` changed what
`in=` may NAME, not where the two keywords may be WRITTEN. The path that works
is composition (§4, `GENRE-COMPOSITION`) — a scene header hosting a nested `timing` region,
with the mark at the scene's top level:

```figdown
figdown 0.1 block
timing bus "Bus"
signal clk 01010101
signal req 00110011
threshold "setup" in=bus offset=50%
```

### The core, and what else a `timing` document may contain

Core keywords (NS = C, never redefined by any genre — §1 `UNIVERSAL-CORE-KEYWORDS`): `figdown`
`title` `layout` — **three** (`LAYOUT-ZONE-NAMESPACE`; five until then).
Beside them stands the **layout namespace** (NS = L; `LAYOUT-ZONE-NAMESPACE`): the
zone `layout` opens is a namespace of its own, owned by no genre, holding
`pin` (NORMATIVE) alone, and **every member of it is
genre-independent** — no genre may define, redefine or extend a keyword
inside the zone, and `GENRE-VOCABULARY-OBLIGATION` does not reach in. The zone also held `path` and
`routing` (EXPERIMENTAL) until 0.1: they were core until 0.1,
demoted to EXPERIMENTAL by `CONSTRUCT-STATUS-TIERS`, and **WITHDRAWN from the language by `EDGE-GEOMETRY-CONSTRUCTS`**
on prior-art and demand evidence ([../../migrations.md](../../migrations.md)
0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**). There is no replacement spelling; `LAYOUT-ZONE-NAMESPACE` itself
is unchanged and only its membership moved.
`pin` did not leave the language when it left the core, and it absorbed
`size` (`ELEMENT-GEOMETRY-DIRECTIVE`): `size` is retired, and one `pin` line now
carries an element's whole declared geometry —
`pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]`.

`UNIVERSAL-CORE-KEYWORDS` is a **fixity** guarantee — wherever a core keyword
appears its meaning is fixed and no genre may redefine it — and **not** a
ubiquity requirement: a `timing` document that contains only its own region
has no `pin` and no `layout` zone, and is complete without them.
A typed block's geometry derives from its content, so it can be neither
pinned nor sized — and since `ELEMENT-GEOMETRY-DIRECTIVE` the two halves fail with two different
named diagnostics:

- `pin <timing-id> at=(0,0)` → `pin of unknown id "<id>"`. A typed block is
  not a node, a group or an `external` endpoint, and those are the only ids
  `at=` may place.
- `pin <timing-id> width=200` →
  `pin width=/height= do not apply to the timing block "<id>" — its geometry derives from its content`.

(`size of unknown id` is gone with the directive: a line-start `size` is now
its own migration error, naming MIGRATIONS 0.1.) In such a document
the layout zone therefore has nothing to target.

**Top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`).** A pure `timing` section accepts only
`UNIVERSAL-CORE-KEYWORDS` core (`figdown` `title` `layout`), the layout namespace's normative
member `pin`, `class`, and the `timing`
opener. The layout namespace has no other member to consider: `path` and
`routing` were kept off this list as a **status** fact rather than a namespace
one (`LAYOUT-ZONE-NAMESPACE` fixes what a zone member means wherever it is legal, not which genres
admit it), and `EDGE-GEOMETRY-CONSTRUCTS` withdrew them from the language.
Scene keywords (`node` `group` `external` `edge` `bundle` `plane`
`threshold` `band` `flow` `rank`) are line errors: `"<kw>" is not allowed
in genre timing`. That is deliberate narrowing of `GENRE-NAMESPACE`: corpus measurement already
showed ten of the eleven scene keywords appear **zero** times in pure
`bitfield`/`table`/`timing` documents; `class` is the exception and stays on
the allowlist. Hybrid figures that need both a scene and a timing panel use
**multi-section `MULTI-FIGURE-DOCUMENTS`** (a later `figdown 0.1 …` line; one file → one stacked
SVG) or a scene-host document with a nested `timing` region (`GENRE-COMPOSITION`) — never
`node` under `figdown 0.1 timing`. Nested composition under a scene header
remains legal (legacy); multi-section is the taught main-standard path.
(`timing` itself is EXPERIMENTAL under `CONSTRUCT-STATUS-TIERS`; the allowlist does not change
that.)

### How this differs from the other genres

`timing`'s own words — `timing`, `signal`, `gap` — and its own option key
`data=` are spelled by no other genre, with the single documented exception
of `gap` above. The overlaps are deliberate and are the same thing under
every genre: the core of three (NS = C), the layout namespace (NS = L, `LAYOUT-ZONE-NAMESPACE`)
and the cross-namespace keys
`fill` `stroke` `class` (§10), all NORMATIVE
(`STROKE-KEY-STATUS`/`COLOUR-KEY-STATUS`). `style=` was a fourth until 0.1, when `STYLE-KEY-SCOPE` removed it
from `signal`; it remains a cross-namespace key on the scene directives. Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future genre MAY spell a keyword
the same as `timing`'s with a different meaning; none does today — and `GENRE-VOCABULARY-OBLIGATION`
stops at the layout zone, whose members no genre may respell (`LAYOUT-ZONE-NAMESPACE`).

The second difference is status (`CONSTRUCT-STATUS-TIERS`), and it separates `timing` from its own
family rather than from the scene genres:

| | `bitfield` | `table` | `timing` |
|---|---|---|---|
| Genre status (`CONSTRUCT-STATUS-TIERS`) | NORMATIVE | NORMATIVE | **EXPERIMENTAL** |

All three nested genres own a closed sub-grammar and declare their kind in
their content; only `timing`'s surface is still moving. The statement is about
convergence, not about syntax — nothing in the tables above changes, and the
engine treats all three alike.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A timing figure's meaning is per-signal: at cycle *t* the signal has the value of the
*t*-th lane character (`.` = the previous value continues). Cycles are
contiguous and aligned across all signals in the block.

- `gap <cycle>` is a presentation-only break marker; it never removes or
  renumbers cycles. Cycles on both sides of a gap are still contiguous in
  the semantic model.
- `data=` names the `=` data cells in order of appearance.
- A reading agent MUST NOT infer signal values from rendered waveform
  geometry — the lane string is the sole source.

## Errors

| Condition | Error |
|-----------|-------|
| Unknown lane character (not in the closed alphabet) | line error |
| `gap` with no cycle argument | line error |
| `signal` with no lane string | line error |
| Unknown option on `timing` or `signal` | line error |

## Example

```figdown
figdown 0.1 timing
timing por "Power-on reset sequencing"
signal clk    p.......
signal rst_n  0...1...
signal data   x..=.=.x  data=cfg,val
gap 4
```
