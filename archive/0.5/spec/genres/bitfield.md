# FigDown Genre: `bitfield`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any bitfield figure.
>
> **Genre status: NORMATIVE (`CONSTRUCT-STATUS-TIERS`).** `bitfield` is
> inside the v0.1 conformance surface and inside the compatibility promise: a
> conforming implementation MUST support it, and it changes only through a
> migration entry (`VERSION-MIGRATION-MODEL`). The NORMATIVE v0.1 genres are `block`, `bitfield`
> and `table`; `topology`, `flowchart` and `timing` are EXPERIMENTAL. See core
> doc §10 for what the status means.

**Census**: #2, 23.7% weighted. Prior art: RFC packet ASCII art, WaveDrom
bitfield JSON, Mermaid packet-beta.

## Purpose

Expresses packet headers and hardware register layouts as an ordered list of
named bit fields with widths. Renders as a ruled diagram with a bit-position
ruler.

**When not to reach for it.** A header block counted in bytes or words rather
than in bits draws a bit ruler asserting a granularity the figure does not
have — the sanctioned answer meanwhile is a single-row `table` (**`BYTE-UNIT-PACKET-BLOCKS`**) —
and a figure whose rows are addresses or values rather than bit positions is a
`table` outright.

### Name and referent (`BITFIELD-GENRE-NAMING`)

The three prior arts above are listed without saying which one supplies the
NAME. It is **WaveDrom's**, where `bitfield` names the **diagram** —
`github.com/wavedrom/bitfield`, "bit field diagram renderer", npm `bit-field`.
The child keyword `field` is **C's and the IETF's** word for the **member**
(ISO/IEC 9899 §6.7.2.1, "bit-field"). Two sources, one for the figure and one
for the member, which is `GENRE-DOCUMENT-CONTRACT` §6(e)'s split: a genre is named after the FIGURE
KIND, a construct after the thing it is.

**FigDown deliberately does not follow C for the container.** C's container
word is `struct`, and `structure` is disqualified three ways: UML 2.5.1
Annex A publishes "Structure Diagrams" as one of the two top-level diagram
categories, and what UML/SysML classify there is what FigDown's **`block`**
genre draws — the name would invert inside FigDown's own namespace; DIN 66261
"structogram" is control flow; VHDL/Verilog "structural" is a netlist. And
**Kaitai Struct, the one tool in this domain named "Struct", is byte-oriented
by default**, so a domain reader's granularity guess goes the wrong way.
Mermaid's `packet` is disqualified separately: a `header`-class name is a
**49% defect** against the measured corpus, which draws frames, tags, shims
and registers too.

The measurement that settles the granularity question: **422 labelled
bitfield blocks, and 100% of those that set a row width set it in bits —
zero declare a byte or word count.** The name is KEPT.

## Defaults

| Setting       | Default        | Notes                             |
|---------------|----------------|-----------------------------------|
| `word`        | `32`           | Bits per row — dominant in corpus |
| `numbering`   | *(no default)* | **REQUIRED** on every `bitfield` line — see below |

### `word=` is bits per drawn row (normative, 0.1, `BITFIELD-GENRE-NAMING`)

`word=` is **bits per drawn row**. The row is called a *word* only because the
packet-header tradition this genre borrows from calls it one (RFC 2360 §3.1
asks for "each word horizontal on the page"; RFC 791 §3.1 counts the header in
"32 bit words"). A value need not be a machine word: **`word=15` on a 15-bit
counter is a correct row width, not a claim about any architecture.**

**`word` survives by default rather than by merit, and that is on the
record.** It is a prose noun lifted from RFC 791/2360, not a key any source
defines, so under `SIZE-AND-DIRECTION-KEY-NAMING`'s own logic it is a coinage wearing borrowed clothes —
and it is the rare coinage that asserts something checkably **false** for
about 20 of the corpus's ~217 instances. It is kept because every attested
alternative is worse, not because it won: Mermaid's `bitsPerRow` is
semantically exact and barred by the **lowercase-ASCII conformance
invariant** (core §10) — not by a style preference, and the same invariant
already decided ECharts `bar3D` → `bar3d` and, historically, mxGraph
`exitX`/`exitY` → `tailport`/`headport` and mxGraph `edgeStyle` → `routing`
(those two precedents stand as decisions the invariant made; their spellings
were withdrawn from the language, `EDGE-GEOMETRY-CONSTRUCTS`); packetdiag's
`colwidth` collides twice inside FigDown (with the live `width=` px extent and
with `table`'s `width` child keyword) and would reinstate the `colw`
abbreviation removed; bytefield-svg's `boxes-per-row` has a
legal hyphenated spelling but counts **boxes, not bits**, and borrowing a
spelling while changing the counted thing is the `gap.tick` mis-borrow
already retired once.

**Reopen when either holds:** (a) a source spells this setting as one
lowercase word with no FigDown collision, or spells it hyphenated in *bits*;
(b) the corpus's non-word widths grow past roughly 25–30%, making the false
connotation the common case — at which point the reopened question is the
lowercase-ASCII invariant itself, deliberately, not a `bitfield` patch.

### `numbering=` is required, and has no default (`UNSAFE-DEFAULT-ELIMINATION`)

A `bitfield` declaration line that omits `numbering=` is a **line error**:
`bitfield requires numbering= (lsb0 or msb0)`.

Most defaults are harmless: a missing label falls back to the id, a missing
`word` falls back to the corpus-dominant 32, and in both cases the worst
outcome is a figure that looks plainer than intended. Bit-numbering direction
has no such fallback. Whichever value were defaulted, every figure that meant
the *other* one would silently render a ruler asserting something false — and
the reader has no way to tell, because a wrong ruler looks exactly like a
right one. Bit numbering is meaning, and under `MEANING-RECOVERY-SOURCE` meaning comes from syntax,
never from a silent default.

Choose per figure, from the source: `msb0` for IETF RFC-style packet headers
(bit 0 is the MSB, ruler 0…N-1 left to right), `lsb0` for hardware register
layouts (bit 0 is the LSB, ruler N-1…0 left to right).

`numbering=` changes the ruler, never the field order: **fields are always
declared left to right**, whichever value is chosen (core §1 `DECLARATION-ORDER-SEMANTICS`). Under
`lsb0` that means declaring them **MSB-first** — highest bit number first —
because the leftmost column is the highest-numbered bit. See the semantic
model below for the arithmetic.

## Complete vocabulary (normative)

Every keyword and option key valid in a `bitfield` document, with this
genre's defaults. Generated from the reference engine's behaviour and
verified against it; where this table and the core doc's prose
disagree, the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three
(`figdown` `title` `layout`), identical under every genre and never
redefined (`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a
`bitfield` document has no `pin` and no `layout` zone at all, and is
complete without them); **B** = this genre's own vocabulary; **S** = the
scene namespace (see below); **N** = another genre's opener (composition,
§4 `GENRE-COMPOSITION`). The layout zone is a fourth namespace, owned by no genre (`LAYOUT-ZONE-NAMESPACE`) and reached by no row of this table.

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change or
be withdrawn in a later `0.x` without a migration entry. `bitfield` is itself
a normative genre, so a document that uses only NORMATIVE rows **is** a portable
v0.1 document; the EXPERIMENTAL rows are exactly what would carry it outside the
conformance surface.

### The `bitfield` genre's own vocabulary (NS = B)

| Keyword | Form | Where | Status | Option keys | Default |
|---|---|---|---|---|---|
| `bitfield` | `bitfield <id> ["label"]` | top level, under any genre | NORMATIVE | `word` `numbering` `fill` `stroke` | `word=32`; `numbering=` **REQUIRED, no default**; label absent |
| `field` | classic: `field "<name>" <width\|*>` — the name's quotes are MANDATORY since 0.1 (`QUOTING-RULES`) · compact: `field a:1,b:2,"Long Name":16` | inside a `bitfield` region ONLY | NORMATIVE | `fill` `stroke` `class` `description` `present` — on BOTH forms since 0.1; on the compact form they are LINE-wide · `index` — **classic form ONLY** (`BITFIELD-REPETITION-CONSTRUCT`). **`style=` LEFT this list at 0.1** (`STYLE-KEY-SCOPE`); **the positional flag `optional` LEFT it at 0.1** (`PRESENCE-CONDITION-EXPRESSION`, replaced by `present=`); **`note=` became `description=` at 0.1** (`DESCRIPTION-KEY-SPELLING`), and although `note=` came BACK to the language as the DRAWN annotation at 0.3 (`DRAWN-ANNOTATION-FORM`), **`field` refuses it at every version** — see below | `present` absent; `description` absent; `index` absent |
| `break` | `break` | inside a `bitfield` region ONLY | NORMATIVE | — | presentation only; adds no bits |

All three of this genre's own keywords are normative: `bitfield` owns no
experimental construct. **A pure `bitfield` document can
reach NO experimental construct at all.** The only two it could ever reach
were the cross-namespace colour keys, and both moved: `stroke=` was promoted
to NORMATIVE (`STROKE-KEY-STATUS`) and `color=` was retired language-wide (`COLOUR-KEY-STATUS`). Every
legal pure-`bitfield` document is therefore wholly inside the v0.1
conformance surface. (`examples/reference/bitfield-experimental.fd` was
deleted in the same release for the same reason: it had nothing left to
demonstrate.) Scene keywords including `threshold` and `band` are **not**
on the pure-`bitfield` top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`); put them on a scene section
if needed.

`field` and `break` at a document's top level are the line error
`"field" is a typed-block child — it needs a bitfield/table/timing block above it`;
inside another genre's region they are `"field" not valid inside table`
(§4, `GENRE-COMPOSITION`).

The region is closed by the next top-level directive — there is no `end`
keyword (§4). Use one form per line, never mixed.

**The compact form.** Its item list is read from the
option-stripped token stream, not from the raw source line, which has two
consequences:

- **Every `field` option is available on it** — `fill=`, `stroke=`,
  `class=`, `description=`, `present=`. They are LINE-wide: they apply to every item in the
  list, exactly as the classic form's options apply to its one field.
  Before this the compact form could carry no presentation at all, because
  the option text landed inside the last item and failed the item grammar.
- **A name containing SPACES must be quoted**: `field "Long Name":16`. The
  list can only terminate at a whitespace boundary, so an unquoted spaced
  name is indistinguishable from the next item. Unquoted, it is the line
  error `bad item "<first word>" (expected name:width; quote a name that
  contains spaces: "Long Name":16)`. A name containing a COMMA cannot be
  written in the compact form at all — use the classic form.

**A field wider than the remaining row space spans the following rows
automatically — it is still ONE field, drawn as one shape with its name
written once, and marked `(cont.)` where the geometry forces a second box
(see "Semantic model" below). Authors MUST NOT split it into
per-row pieces.**

### Option-key values and positional forms

| Key | Values | Status | Default |
|---|---|---|---|
| `word` | integer ≥ 1 — bits per row | NORMATIVE | `32` |
| `numbering` | `lsb0` \| `msb0` | NORMATIVE | **none — required on every `bitfield` line** |
| `description` | quoted string | NORMATIVE | absent |
| `present` | quoted string, **mandatory value** — `present=""` is the empty form | NORMATIVE | absent |
| `index` | a RANGE, `<first>..<last>` — separator EXACTLY two dots, whitespace around it not significant (quoted form only), each literal end at most 9007199254740991. `<first>` is always a literal integer, `<last>` is a literal integer or opaque prose; `index=""` is the empty form. Quotes are INERT (RULE 2.3): `index=0..7` and `index="0..7"` are the same value. Classic form only | NORMATIVE | absent |
| `class` | one or more comma-separated ids of declared classes — `class=`'s value is multi-valued (core §12.5); a channel two carried classes both bind is a line error (`CLASS-CHANNEL-COLLISION`) | NORMATIVE | absent |
| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line, which is SVG's own asymmetry | NORMATIVE | absent |
| *width* (positional) | integer ≥ 1 bits, or `*` = fill the row remainder (**at most one `*` per bitfield block** — 0.1) | NORMATIVE | required |

`*` means “variable-length tail / fill the remainder of the current row”,
not “conditionally present but fixed-width” (use `present=`) and not a second
independent variable region. Common protocol headers with several
conditionally present fields (e.g. GRE Checksum/Key/Sequence) use multiple
`present=` fields of **fixed** widths plus a single trailing `*` for the
payload. A second `*` in the same block is a line error
(`only one * field is allowed per bitfield (* fills the remainder of the row)`).

`fill=` and `stroke=` are normative (`STROKE-KEY-STATUS` promoted
`stroke=`; `COLOUR-KEY-STATUS` retired `color=`, so there is no text channel). Neither may
ever be meaning's only carrier (`GUI-WRITEBACK-STRUCTURE`/`PRESENTATION-AS-MEANING-CARRIER`).
This genre's own keys are all normative, including the positional width and
`present=`; `numbering=` most of all, since it is required and is meaning
rather than presentation (`UNSAFE-DEFAULT-ELIMINATION`).

**`style=` left `field` (`STYLE-KEY-SCOPE`), and the reason is `PRESENTATION-AS-MEANING-CARRIER` rather
than tidiness.** The dash is conditional presence's *only* visual carrier.
While `style=` was accepted, `field "B" 8 optional style=solid` erased the  <!-- fence-check: skip -->
dash and left the model still recording the field as conditionally present —
a reading agent got "conditional", a human looking at the same figure got an
ordinary field. That is
precisely what `PRESENTATION-AS-MEANING-CARRIER` forbids: presentation may RENDER meaning, but it must
never be meaning's only carrier and it must never be able to delete it.
Removing the key closes the hole without a special-case precedence rule.
The same removal applied to `cell` and `signal` in the same release, as one
minimum set: 11 in-repo uses across the three, **0 downstream**.

Retired language-wide (`COLOUR-KEY-STATUS`): `color=`. It set the FILL
in one era and the LABEL in another, and no engine can tell the
two source files apart — so its diagnostic names BOTH eras and hands the
choice to a human. v0.1 has no label-colour key at all; the label colour is
derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).

**Renamed.** Three of this genre's own spellings moved; each
old one is now a line error carrying a named diagnostic that states its
replacement. Every replacement is the word the genre's own sources already
use (`UNSAFE-DEFAULT-ELIMINATION` single-source).

| Old | New | R | Why |
|---|---|---|---|
| `unit=` | `word=` | `BITS-PER-ROW-KEY-NAMING` | RFC 2360 §3.1 asks for "each word horizontal on the page" and RFC 791 §3.1 counts the header in "32 bit words" — the packet-header tradition this genre draws from already calls a row a word, while `unit` named no unit in particular |
| `wrap` | `break` | `ROW-BREAK-NAMING` | in CSS and typography `wrap` is AUTOMATIC reflow — a mode — while this directive is an EXPLICIT row break, an event; CSS Fragmentation calls that "a forced break … explicitly indicated by the … author", and HTML spells it `br` |
| `optional` | `conditional` | `PRESENCE-FLAG-SPELLING` | RFC 2119 defines OPTIONAL as optional to IMPLEMENT, which is not what a wire-format field marker asserts; the wire-format sense is "present only if" (RFC 2784). **REVERTED at 0.1 (`PRESENCE-FLAG-SPELLING`), then BOTH spellings retired at 0.1 (`PRESENCE-CONDITION-EXPRESSION`) — see below. Neither `optional` nor `conditional` is live; the live key is `present=`, because a bare flag could say only THAT a field was conditional and never on what condition.** |

**Reverted (`PRESENCE-FLAG-SPELLING`): `conditional` → `optional`.** The
0.1 rename was undone on the surface AND in the model. Both spellings
are now retired — see the next section.

### `description=` is documentation prose, and it draws no ink (`DESCRIPTION-KEY-SPELLING`)

Spelled `note=` until 0.1. The source is **IEEE 1685-2022's
`description`**; SystemRDL's `desc` is barred by RULE 4.2 (an option key takes
the primary source's spelling in full).

**What it renders as, stated plainly because no document said it before:** a
`description=` produces **no ink beyond an SVG `<title>` tooltip** on the
field's own rectangle. Nothing appears on the page. **A fact a human must SEE
does not belong here** — put it in the field label, in the host Markdown
around the figure, or in a `class` meaning, which also earns a legend entry.
Core §12.7 lists it as *authored documentation prose — quotable and
displayable, never parsable*.

**Why the key was renamed rather than left alone.** `note=` sits in the
FROZEN scope, so deferring the rename would have frozen a name already judged
wrong. The collision is ahead of it: **`ANNOTATION-LOCATOR-SPLIT` files `note` as the
highest-demand v0.2 annotation construct** — about 66 figure-identities and 20
independent reinventions in the measured corpus — **and that one will be a
DRAWN callout**. A live never-drawing `note=` beside a future always-drawing
`note` keyword is one spelling with two opposite behaviours, which is exactly
why `line`, `fill` and `route` were renamed. The keyword cannot move (every
source spells it `note`); the option key can. **That prediction landed** (`DRAWN-ANNOTATION-FORM`) — the drawn annotation arrived as an option key `note=` on
the scene genres' elements and on `title`, not as a keyword, and `field`
refuses it. The next section states that refusal and its reason.

Two related defects were fixed in the same release. The SVG `<title>` is now a
**child of the `<rect>` it names** — it used to be pushed into the block's
stream after the rect and the label, so it landed under the figure's single
`<g>`, and since SVG says a `<title>` names its **parent**, every description
in a figure named the same `<g>` and a conforming UA showed one arbitrary
tooltip for the whole figure. And the `STYLE-KEY-SCOPE` `style=` diagnostic no longer
offers this channel as a place to put knowledge.

### `field` REFUSES `note=`, and the refusal is about AUDIENCE (`DRAWN-ANNOTATION-FORM`)

`note=` came back into the language as a live option key — the
**DRAWN** annotation, the one that puts an explanation on the page — accepted
on the scene genres' elements and on `title`. **`bitfield` grants it to
nothing.** `field` refuses `note=` **at every version**, and keeps
`description=`:

<!-- fence-check: skip -->
```figdown
figdown 0.3 bitfield
bitfield hdr "Header" numbering=msb0
field "Flags" 8 note="cleared on reset"
```

That third line is a line error under `figdown 0.3` exactly as it was under
`figdown 0.1`, and the diagnostic is `field`'s **own**, not the generic
"directive does not take this key": it states the division rather than naming
a replacement, because `description=` is not a replacement — it reaches a
different reader.

**Why: the two keys divide by AUDIENCE, not by length.** `description=`
reaches the **machine**. It draws no ink beyond an SVG `<title>` tooltip on
the field's own rectangle (see the section above), which is what lets a `.fd`
carry a register's full IP-XACT description without spending page space a
human reader did not ask for. `note=` reaches the **human**, and it ALWAYS
draws. Granting one directive both keys would put the whole distinction on one
line, where the only thing separating them is which reader the author had in
mind — and there are **zero measured instances** of a drawn per-field aside in
the corpus. Spending the distinction before anyone needs it is what the
refusal avoids. Neither key is a fallback for the other, here or anywhere.

**What would reopen it,** recorded so the decision can be re-taken on evidence
rather than re-argued: **a measured count of `bitfield` figures whose
per-field caveat must be VISIBLE** — not documentation prose a tool reads, but
a sentence beside one field that a human reading the page has to see. Bring
the count and the figures; `field` is the directive that would take the key.

**Where a typed slot exists, `note=` would not be the right answer anyway.**
`bitfield` is the genre with the most typed slots in the language, and each of
them is a claim rather than prose a reader must interpret:

- **a field's machine-facing prose is `description=`** — quotable,
  displayable, never parsable (core §12.7);
- **a field's condition is `present=`**, which carries the condition itself
  and draws the dash that says "may be absent"; a note saying "only when the
  T bit is set" asserts nothing the renderer or a reading agent can act on;
- **a condition SHARED by several fields is a `class`**, which earns a legend
  entry and applies to all of them at once;
- **a field's name is its quoted name**, and its width is its width; a
  repetition is `index=`, and a row break for legibility is `break`.

### This region's ADDRESS SPACE, and what `in=` consumes today (`MARKER-TARGET-KINDS`, `GENRE-DOCUMENT-CONTRACT`)

**A `bitfield` region's address space is `(n)`: the nth declared `field`,
counted in DECLARATION ORDER (`DECLARATION-ORDER-SEMANTICS`), 1-based.** One entry per classic `field`
line and one per item of a compact `field` line — `field a:1,b:2,"Long":5`
declares three, so `(2)` is `b`. An `index=` repetition is still **one**
field, however many copies it draws, because it is one declaration. Bit
numbers are deliberately not the address: `numbering=` chooses between `msb0`
and `lsb0`, so a bit index means two different things in two documents, while
declaration order means one thing in both.

**Only the region HEAD is consumed today.** `threshold` and `band`
resolve (`MARKER-TARGET-KINDS`) `in=<region-id>` against a nested
`bitfield`/`table`/`timing` region as well as a `node` or a `group`:
`threshold "boundary" in=hdr offset=50%` names the whole `bitfield hdr` block.
That widening is **ungated** — it adds no spelling, and the only documents it
affects are ones that previously produced the error
`unknown target "hdr" for threshold` and no figure at all.

**The coordinate grammar is designed and deliberately NOT built.** `in=hdr(2)`
— a mark addressed to one field inside the region — has no shipping consumer,
and RULE 4.7 argues against spending a grammar before one exists. The address
space is written down here so that a later consumer inherits a decided answer
instead of inventing a second one; the engine accepts the region head and
nothing else, and `in=hdr(2)` is a line error today.

**`GENRE-KEYWORD-ALLOWLIST` is unchanged by this.** `threshold` and `band` are still **not** on the
pure-`bitfield` top-level allowlist: under `figdown 0.1 bitfield` they remain
the line error `"threshold" is not allowed in genre bitfield`. The widening
changes what `in=` may NAME, not where the two keywords may be WRITTEN. The
path that works is composition (§4, `GENRE-COMPOSITION`) — a scene header hosting a nested
`bitfield` region, with the `threshold` line at the scene's top level:

Written out, that is a `figdown 0.1 block` header, then
`bitfield hdr "Header" numbering=msb0` opening the region, its `field "Type" 8`
and `field "Payload" 24` items, and then — back at the scene's top level, not
inside the region — `threshold "byte boundary" in=hdr offset=25%`.
<!-- fence-check: skip -->

**`threshold` and `band` are EXPERIMENTAL** (`CONSTRUCT-STATUS-TIERS`), which is why the worked
example above is written as prose rather than as a ` ```figdown ` block: a
frozen normative document may cite an experimental construct but may not
*define* one in a fence, and this file is frozen. The runnable version lives in
[../experimental.md](../experimental.md).

## Conditional presence: `present=` (`PRESENCE-CONDITION-EXPRESSION`)

**The flag became a key that carries the condition.**

| form | meaning |
|---|---|
| key **absent** | **no presence claim** — NOT an assertion that the field is always present |
| `present=""` | conditional; the condition is **not stated** |
| `present="C = 1"` | conditional; the condition is stated |

The value is a quoted string and is **syntactically mandatory**: there is no
bare form. `present` is available on the classic form and on the compact form,
where — like every `field` option — it is LINE-wide.

```figdown
figdown 0.1 bitfield
bitfield hdr "Header" word=32 numbering=msb0
field "Length" 16
field "Checksum" 16 present="C = 1"
field "Sequence" 32 present=""
```

**Why the flag had to grow a value.** A bare flag can say only *that* a field
is conditional. Every RFC that draws one also states *why* — RFC 2784's own
diagram writes `| Checksum (optional) |` and its prose says "present only if
the C bit is set" — and until 0.1 that sentence had nowhere to live but
`note=`, where it was invisible to the human reading the figure and, under
`BITFIELD-CONDITIONAL-OFFSETS`, prose the model may not read.

**`present` is the spelling, and `condition` is not.** `PRESENCE-FLAG-SPELLING` retired
`conditional` one release earlier for having **zero attestation** across
RFC 2784, ASN.1 X.680, draft-mcquistin-augmented-ascii-diagrams, SystemRDL,
IP-XACT, Kaitai Struct and protobuf; `condition` is the same root with the
same zero attestation, so adopting it would reinstate one layer down the word
just removed one layer up. `present` has **four** sources: X.680
`PresenceConstraint ::= PRESENT | ABSENT | OPTIONAL | empty` **[CORRECTED 0.3.z: every printing of this production in this file used to stop at `OPTIONAL`. X.680 §51.8.10 has a fourth alternative, `| empty`, and the quote was written as verbatim. A substring match would have passed it — see `decisions/registry.md`.]**, IP-XACT/IEEE 1685
`isPresent`, SystemRDL `ispresent`, and RFC 2784's "present only if" /
draft-mcquistin's "present only when".

**The value is opaque prose, and there is deliberately no expression
grammar.** An agent MAY quote or display it verbatim; it MUST NOT parse it,
evaluate it, resolve any name inside it against a field name, a `class` id or
anything else in the document, or derive a presence decision from it
(core §12.7). Two reasons, both cautionary precedent worth recording:
**IEEE 1685-2022 DELETED `isPresent`** — an expression-valued presence element
with a working grammar and a large tool ecosystem — because it was too
complex; and **FigDown has no reference grammar anywhere**: `class=` and `in=`
reference declared **ids**, while a bitfield field name is a **label**, not an
id. `present="C = 1"` names `C` and the language cannot resolve that to
`field "C"` three lines up. That gap is the locator problem, filed as
core §9 **`ANNOTATION-LOCATOR-SPLIT`**.

**It DRAWS, and that is a ruling, not a rendering detail.** Moving the
condition from `note=` (invisible to everyone) into the model alone would make
it visible to the reading agent and not to the human — half an inversion, and
the exact shape `CLASS-EMPTY-MEANING` rejected `legend=hide` for. The drawing is **derived**,
in the same family as the derived legend and the derived `bundle` ring: the
author names the meaning, the engine owns the convention (`DOMAIN-CONVENTION-DIRECTIVES`), and there is
no option key for it.

- `present="C = 1"` → the field draws **dashed** *and* a caption line appears
  below the block: `<field name> — present: <condition>`.
- `present=""` → the field draws **dashed**, and there is **no caption line**.
  The author claimed nothing, and inventing "condition unknown" would be the
  engine speaking for the author.
- key absent → solid, no caption.

**Where the dash actually lands.** A field's boundary is
*shared* with its neighbour, and the renderer draws each boundary exactly once.
An edge is dashed **iff at least one of the two fields touching it carries
`present=`** — so a conditional field is enclosed by a dashed outline even
where the field on the other side is unconditional. Before 0.1 each
field was stroked as its own box and the second painting won, which meant a
plain neighbour could overwrite a conditional field's dash back to solid and
silently delete the only carrier of conditional presence (`STYLE-KEY-SCOPE`).
Two consequences an author should know:

- `stroke=` no longer travels on the boundary. A field's class colour is drawn
  as a solid full-weight ring **inside** the field. A field carrying both
  `stroke=` and `present=` therefore shows a dashed boundary **and** a separate
  coloured ring, not a coloured dash: the two marks answer different questions.
- A dashed edge between a conditional field and a plain one can be read locally
  as if the plain field were conditional too. This ambiguity is **known, not
  solved** — the older drawing had it too whenever the dash happened to win the
  overwrite. The caption line and the model remain authoritative.

**The `BITFIELD-CONDITIONAL-OFFSETS` tension, stated so it is not misread as a reversal.** `BITFIELD-CONDITIONAL-OFFSETS` rejected
encoding conditionality as `note=` prose because that would "demote
machine-readable conditionality into free text… meaning derivable from syntax
alone, **never from prose inside an option value**." `present="C = 1"` *is*
prose inside an option value, and it survives `BITFIELD-CONDITIONAL-OFFSETS` on one narrow distinction:
**the key's PRESENCE remains the machine-readable flag, so nothing is
demoted — only the previously-unexpressed condition is added, at the highest
fidelity the language can currently carry.** `BITFIELD-CONDITIONAL-OFFSETS` is not reversed. What changed
is that a fact which used to be absent from the model is now in it, marked as
unparsable.

### A condition SHARED by several fields stays a `class` (`PRESENCE-CONDITION-EXPRESSION`)

When two or more fields depend on the *same* condition, declare one `class`
whose meaning **is** the condition and join all of them to it:

```figdown
class ifc "Present only if the C (Checksum Present) bit is 1 — RFC 2784 §2.2"
bitfield gre "GRE" word=32 numbering=msb0
field "Checksum" 16 present="C = 1" class=ifc
field "Reserved1" 16 present="C = 1" class=ifc
```

This is the **sanctioned** answer, and it is better than what the surveyed
formats offer. No format solves the shared case except SystemRDL, which does
it through component hierarchy — a mechanism `bitfield` does not have. Kaitai
Struct and draft-mcquistin-augmented-ascii-diagrams both say "wrap the
co-dependent fields in a sub-structure", which invents a structural boundary
the wire format does not have. FigDown's answer states the condition **once**,
keeps it **model-visible** (a `class` reference plus its meaning is on
§12.7's MAY-conclude list as a CATEGORY), and it **draws** — the class earns a
legend entry.

The two carriers do different jobs and both are worth writing: `present=`
states *this* field's condition and draws a caption; `class=` states the
**co-dependency** — that these fields appear and disappear together — which is
the machine-readable half. Neither resolves a name; see **`CONTIGUOUS-RANGE-GROUPING`** (which
tracks the coverage-span question this idiom sits inside) and **`ANNOTATION-LOCATOR-SPLIT`**.

## Repetition: `index=` (`BITFIELD-REPETITION-CONSTRUCT`)

**A `field` may be ONE ELEMENT of a repeated run, and `index=` is how it says
so.** Until 0.1 the language had no construct for this at all: a
repeated element had to be spelled out as N literal `field` lines, nothing in
the model said the list was a sample rather than the whole, and core §12.7
carried a MUST NOT precisely because that gap degrades to a *confidently
wrong* number rather than to "unknown" (`BITFIELD-REPETITION-CONSTRUCT`).

| form | meaning |
|---|---|
| key **absent** | **no repetition claim** — NOT an assertion that the field occurs once |
| `index=""` | the field repeats; **nothing about the indices is stated** |
| `index="0..Last Entry"` | 0-based; the LAST index is named only in prose |
| `index=0..7` | **determinate**: indices 0…7, **8 elements** |
| `index=53..0` | determinate and **descending**: 54 elements |

The tri-state is deliberately the same SHAPE as `present=`'s (§12.3): an
absent key is a claim that was never made, `""` is a written value that claims
repetition and states no index, and a written range states one. `index=` is
available on the **classic form only** — see *Errors* below for why.

**Writing the range (three rules, all normative; core §12.2 states them for
the model).**

- **The separator is EXACTLY two dots.** `index=0...7` is a line error, not
  "a range whose last index is the prose `.7`". Stating it took 0.1:
  the original rule said "one `..`, and both ends present", which `0...7`
  satisfies by the letter, so it parsed and recorded a `last` the source
  never wrote.
- **Whitespace around `..` is not significant.** `index="0 .. 7"` is
  `index=0..7` (Ada, ISO/IEC 8652, writes `1 .. 10`). It is reachable only in
  the QUOTED form, because an unquoted option value is one whitespace-free
  token: `index=0 .. 7` is an *unexpected argument*, not a range.
- **Each literal end is at most 9007199254740991.** Core §12.5 binds a number
  to an ECMAScript `Number`, so a larger integer would be recorded rounded
  and the derived count would be wrong; §12.7 makes the model recoverable
  from the source, so the bound is a **line error** and never a quietly
  rounded value. A *prose* last index is a string and is unbounded.

`bitfield` is a FROZEN-scope genre, so this spelling is permanent from v1.0.

### Determinacy is decided by parsing both ends, never by quoting

**Normative.** A run is DETERMINATE when **both ends parse as literal
integers**, and indeterminate otherwise. RULE 2.3 makes redundant quotes
inert, so `index="0..7"` is determinate exactly as `index=0..7` is; a value's
quoting says nothing about it.

This is stated here rather than left as a property of the implementation
because a later extension rests on it. `index="0..7 step 2"` (§9 **`INDEX-RANGE-STEP`**)
needs quoting to be free of meaning on this key: were quotes ever made
semantic here, that extension would have to be paid for twice.

**And inertness alone was not enough — `step` is RESERVED
(`RULE-POSITION-ENUMERATION`).** A prose `<last>` accepts any non-empty text, so
`index="0..7 step 2"` was **already a legal document** with the model
`{first:0, last:"7 step 2"}` and the drawn index `[7 step 2]`. The
extension's spelling was not an unclaimed slot but an OCCUPIED one, and
shipping the stepped range later would have changed what an existing legal
document means — with no way for any engine to tell prose that reads like a
step clause from an author who meant the extension. So the spelling is
reserved now, exactly as `;` was:

| written | 0.1 |
|---|---|
| `index="0..7 step 2"` | **line error** naming the reservation |
| `index="0..N step 2"` | **line error** |
| `index="0..end step"` | **line error** |
| `index="0..7 Step 2"` | legal — prose |
| `index="0..7 in steps of 2"` | legal — prose |
| `index="0..stepping"` | legal — prose |

The trigger is a **bare lowercase `step` token** in the prose `<last>`,
whitespace-delimited on both sides or at either end. It is deliberately
narrow: only the exact spelling a stepped range would use can ever be
ambiguous with it, and FigDown's vocabulary is lowercase everywhere
(core §1), so `Step` and `steps` can never become that spelling. A wider
trigger would reject prose that could never collide.

### `<first>` is ALWAYS a literal integer

`<last>` may be prose; `<first>` may not. That asymmetry is what makes the
run's **base machine-readable without resolving any name** — a reader can
always place the first element, even when it cannot count the rest. It also
fixes the canonical form as **0-based**, matching the source the key is
borrowed from (below).

`<first>` not being a literal integer is a line error, with its own message.

### What it draws

The author writes the range **once** and the engine derives the picture,
exactly as `present=` derives its dash and its caption (`DOMAIN-CONVENTION-DIRECTIVES` — the author names
the meaning, the engine owns the convention). There is no option key for any
of it.

The drawing is **RFC 8754 §2's own** (`REPEATED-RUN-DRAWING`): the document
`examples/srh.fd` transcribes prints the first element of its Segment List, a
`...` row, and the last element — and 0.1 already took that RFC's
drawing as the authority for a field wider than `word=` in the same figure.

- the **first** element draws at its declared width, then the elision, then
  the **last** element, in the same columns one band lower;
- each occurrence carries its index **appended** to the author's label —
  `Segment List (128-bit IPv6 address) [0]`, not the RFC's own
  `Segment List[0] (128-bit IPv6 address)`. Placing it the RFC's way would
  mean PARSING the label to find where a bracket belongs, and a label is
  opaque text (core §12.7) that no engine may read. This is a deliberate
  departure from the RFC's typography: the reader still learns which
  occurrence is which, and the cost is zero;
- the **elision mark** sits between the two, over the first element's own
  columns, dashed at both edges. It is **derived, never special-cased**: the
  elements not drawn number `|last − first| − 1`, and the mark is drawn when
  that is not **zero**. So `index=0..1` draws `[0]` and `[1]` and **no
  mark** — the mark says "there are more, not drawn", and over an adjacent
  pair that is a false statement. `index=0..0` never reaches the drawing: it
  is a line error, because a range of one element is not repetition. A prose
  `<last>` leaves the number undrawn indeterminate, and the mark is drawn.
  The mark carries **no text**: with the indices on the occurrences,
  `[first] … [last]` on the strip would repeat them;
- `index=""` draws **one** occurrence and a bare elision mark, with **no
  index on it**. The author claimed repetition and stated no index, so there
  is no `[first]` and no `[last]` to write, and two boxes would assert a
  first and a last the author did not state — the same ruling `present=""`
  gets for its caption.

**The elision strip occupies NO bit positions.** It is vertical space only, in
the same family as the blank cells a `break` leaves behind. The ruler is
untouched by it, and a reader that counts drawn rows is reading the drawing,
which `MEANING-RECOVERY-SOURCE` forbids. Its width is the element's own columns and never the whole
word: a full-width strip would claim columns the element does not occupy.

```figdown
figdown 0.1 bitfield
title "A repeated element"
bitfield srh "Segment Routing Header" word=32 numbering=msb0
field "Last Entry" 8
field "Flags" 8
field "Tag" 16
field "Segment List (128-bit IPv6 address)" 128 index="0..Last Entry"
field "Optional TLVs" *
```

### What a reader may conclude

Full statement in core §12.7; the arithmetic is in the semantic model below.
In short: where `index=` is written, **the base is machine-readable and may be
stated**. Both ends literal ⇒ the run is determinate, its element count is
`|last − first| + 1`, and **every later field's declared offset is determinate
again**. One end prose ⇒ later offsets are indeterminate, as before — but
reached from **syntax** rather than from reading a label.

The value is **never parsed, evaluated or resolved**, verbatim from the
`present=` contract: a prose `<last>` may be quoted and displayed and nothing
more, and an agent MUST NOT resolve it against a field name, a `class` id or
anything else in the document (the locator problem, §9 **`ANNOTATION-LOCATOR-SPLIT`**).

### Errors

Every one is a line error with its own named diagnostic.

| Condition | Why |
|---|---|
| no `..` in the value, or more than one | the value is a range; one separator, both ends present |
| `<first>` is not a literal integer | the base must be machine-readable without resolving a name |
| a fully-literal range of ONE element (`index=3..3`) | that is not repetition; an absent key already claims nothing |
| `index=` on a `*` field | `*` already means "the length is not in the document", so "an element of unstated width, n times" states nothing |
| `index=` on the **compact** form | v0.1 scope. Every other `field` option is LINE-wide there, which would say that every item repeats over the SAME indices. The diagnostic names the classic form |
| `index=` written twice on one line | the existing duplicate-option-key invariant |

### Where the spelling comes from

`index` is borrowed from **IEEE 1685-2022 (IP-XACT)**, at the ELEMENT level,
verified in the Accellera-published schemas (the schemas are public; the IEEE
text is paywalled, so this record cites the **schema file and version**, never
a clause number):

- `commonStructures.xsd:970` — global `<xs:element name="index">`, *"An index
  into an object in the referenced view."*
- `commonStructures.xsd:982` / `:821` — `<xs:element name="indices"
  type="ipxact:indicesType"/>`, a sequence of `ipxact:index`.
- `commonStructures.xsd:273-290` — `indices` on `accessHandle`: *"For a multi
  dimensional IP-XACT object, indices can be specified to select the element …
  and **follows C-semantics for indexing**"* ⇒ **0-based**, which is the
  canonical form above.
- `ipxact:indices` is referenced by `fieldRef`, `registerRef`,
  `registerFileRef`, `addressBlockRef` and `partSelect` — the standard's
  mechanism for naming *which element* of a repeated field is meant.
- the **count** is spelled separately, as `ipxact:dim` with `dim/@indexVar`:
  IP-XACT has this exact construct and calls the ordinal the *index*.
- `subscript` appears **zero** times in the schema set.

This makes **three of `field`'s five option keys single-sourced from
IP-XACT** — `description=` (`DESCRIPTION-KEY-SPELLING`), `present=` (`PRESENCE-CONDITION-EXPRESSION`, one of its four sources)
and `index=`.

**What was rejected, and what would reopen each.** `occurs` — COBOL's
`OCCURS 1 TO 50 TIMES` is a range *of counts*, so `occurs=0..7` misreads as
"up to 7 occurrences"; reopens only if the value returns to a pure count.
`subscript` — ISO 1989 defines it as *"a positive integer"*, 1-based, so
`subscript=0` asserts what its own source excludes; the same standard defines
*index* as the **displacement**, so the two cannot be separated; COBOL has
zero rows in `../vocabulary-sources.tsv`, so taking it would open a new source
for one key against RULE 4.1's last-resort bar; and its only in-tree
occurrences are typographic — the word appears in no vocabulary, in either
namespace (**four occurrences measured; the count is the ruling's and was not
re-derived here, because this repository's own tree contains neither the word
nor a typographic subscript character** — the measurement spans the wider
corpus). `indices` — attested, but it means one index *per
dimension* of a multi-dimensional array, not a range in one dimension, and it
would be the language's first plural key. `dim` / `entries` / `elements` /
`occurrence` — all flip the value to a count.

**Reopen conditions**, mirroring `word=`'s discipline: the offset or
typographic misreading is measured to fire in a real figure; **IEEE 1685
withdraws or renames `index`/`indices`** — not hypothetical, since 1685-2022
DELETED `isPresent`, as the `present=` record above notes; or v0.2 produces an
index gutter that is demonstrably not an address (§9 `ROW-INDEX-GUTTER`/`INDEX-KEY-NAMESPACE-CONTENTION`).

### The core, and what else a `bitfield` document may contain

Core keywords (NS = C, never redefined by any genre — §1 `UNIVERSAL-CORE-KEYWORDS`): `figdown`
`title` `layout` — **three** (`LAYOUT-ZONE-NAMESPACE`; five
until then). Beside them stands the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`):
the zone `layout` opens is a namespace of its own, owned by no genre, and
holds `pin` (NORMATIVE) alone. Every member of it is
**genre-independent** — no genre may define, redefine or extend a keyword
inside the zone, and `GENRE-VOCABULARY-OBLIGATION` does not reach in. The zone also held `path` and
`routing` (EXPERIMENTAL) until 0.1, when **`EDGE-GEOMETRY-CONSTRUCTS` withdrew both from the
language**: they were core until 0.1, EXPERIMENTAL from `CONSTRUCT-STATUS-TIERS`, and
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

- `pin <bitfield-id> at=(0,0)` → `pin of unknown id "<id>"`. A typed block
  is not a node, a group or an `external` endpoint, and those are the only
  ids `at=` may place.
- `pin <bitfield-id> width=64` →
  `pin width=/height= do not apply to the bitfield block "<id>" — its geometry derives from its content`.

(`size of unknown id` is gone with the directive: a line-start `size` is now
its own migration error, naming MIGRATIONS 0.1.) In a document that
contains only its own region, the layout zone therefore has nothing to
target.

That is not a gap in the genre. `UNIVERSAL-CORE-KEYWORDS` fixes what a core keyword *means* wherever
it appears; it does not require every genre to use one. The normal `bitfield`
document has no `pin` and no `layout` zone at all, and is a
complete, conforming v0.1 document without them.

**Top-level allowlist (`GENRE-KEYWORD-ALLOWLIST`).** A pure `bitfield` section accepts
only `UNIVERSAL-CORE-KEYWORDS` core (`figdown` `title` `layout`), the layout namespace's normative
member `pin`, `class` (so
`field class=` can resolve), and the `bitfield` opener. The layout
namespace has no other member to consider: `path` and `routing` were kept off
this list as a **status** fact rather than a namespace one (`LAYOUT-ZONE-NAMESPACE` fixes what a
zone member means wherever it is legal, not which genres admit it), and `EDGE-GEOMETRY-CONSTRUCTS`
withdrew them from the language. Scene keywords
(`node` `group` `external` `edge` `bundle` `plane` `threshold` `band`
`flow` `rank`) are line errors: `"<kw>" is not allowed in genre bitfield`.
That is deliberate narrowing of `GENRE-NAMESPACE`: corpus measurement already showed ten of the
eleven scene keywords appear **zero** times in pure `bitfield`/`table`/`timing`
documents; `class` is the exception and stays on the allowlist. Hybrid
figures that need both a scene and a bitfield panel use **multi-section `MULTI-FIGURE-DOCUMENTS`**
(a later `figdown 0.1 …` line; one file → one stacked SVG) or a scene-host
document with a nested `bitfield` region (`GENRE-COMPOSITION`) — never `node` under
`figdown 0.1 bitfield`. Nested composition under a scene header remains
legal (legacy); multi-section is the taught main-standard path.

### How this differs from the other genres

`bitfield`'s own words — `bitfield`, `field`, `break` — are spelled by no
other genre, and `word=`/`numbering=`/`description=`/`present=`/`index=` are
its own option keys. The
overlaps are deliberate and are the same thing under every genre: the core
of three (NS = C), the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and the four cross-namespace
keys `fill` `stroke` `style`
`class` (§10), all NORMATIVE (`STROKE-KEY-STATUS`/`COLOUR-KEY-STATUS`). One genre-level requirement is unique to `bitfield`:
`numbering=` has no default and is REQUIRED, where every other genre's
options are all optional. Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a future genre MAY spell a keyword the
same as `bitfield`'s with a different meaning; none does today — and `GENRE-VOCABULARY-OBLIGATION`
stops at the layout zone, whose members no genre may respell (`LAYOUT-ZONE-NAMESPACE`).

Status is the other axis of difference, and it is a statement about
convergence rather than about syntax: `bitfield` is a NORMATIVE v0.1 genre
alongside `block` and `table`, while `topology`, `flowchart` and `timing` are
EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`, §10). `bitfield` converged early — it owns its own words,
its own option keys and its own error conditions, which is exactly what the
three experimental genres still lack.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A `bitfield` region yields **three** quantities, and they are distinct.
All three are computable from the model alone — it carries `word`,
`numbering` and every field's width (core §12.2) — so none of them needs
the renderer (`MEANING-RECOVERY-SOURCE`). Corrected (`DECLARATION-ORDER-SEMANTICS`): the earlier wording
defined only the first and then said `numbering=` "never changes
placement", which left an `lsb0` figure asserting one thing to an agent
and the opposite to the human reading its ruler.

**1. Declared offset — where a field sits in the bit sequence.** Field
*k* occupies `[Σ widths of fields 1..k−1, +w_k)` of the declared
sequence, in declaration order. There is **no implicit padding
anywhere** — a real padding/reserved region MUST be declared as an
explicit field.

**2. Drawing position — which cell of which word a field is drawn in.**
Declaration order is drawing order (core §1 **`DECLARATION-ORDER-SEMANTICS`**): fields fill a word
from left to right in the order written, wrap to the next row when the
word is full, and a `break` advances the cursor to the start of the next
word. Field *k* therefore begins at drawing position `p_k` = the sum of
the earlier widths **plus** every column a `break` skipped, and occupies
`[p_k, p_k + w_k)`. Its **row** is `⌊p_k / word⌋` and its **column** is
`p_k mod word`. With no `break` in the block, `p_k` is quantity 1.

**3. Bit number — what the ruler calls a column.** The ruler numbers the
`word` columns of a word, and `numbering=` chooses the direction:

| `numbering=` | bit number of column `c` | bit numbers read | highest bit NUMBER |
|---|---|---|---|
| `msb0` | `c` | ASCEND left to right | at the right |
| `lsb0` | `word − 1 − c` | DESCEND left to right | at the **left** |

A field drawn at columns `[c, c + w)` therefore covers bit numbers
`c … c+w−1` ascending under `msb0`, and `word−1−c … word−c−w` descending
under `lsb0`. **The geometry is identical under both values** — the same
fields are drawn in the same cells, in declaration order, left to right —
and only the numbers attached to the columns differ. That is the whole of
what `numbering=` does, and it is why an `lsb0` figure declares its
fields **MSB-first**: the first-declared field is the leftmost, and under
`lsb0` the leftmost column carries the highest bit number.

- `break` is presentation for the bit SEQUENCE and real for the DRAWING.
  It adds, skips and reorders no bits — quantity 1 is untouched and the
  blank cells after it are not bits — but it does move the cursor to the
  start of the next word, so from a `break` onward quantity 2 runs ahead
  of quantity 1 by the skipped columns, and the bit numbers of quantity 3
  restart in a new word. A reader reporting bit numbers across a `break`
  MUST say which word it is counting in.
- `numbering=` relabels the ruler only; it never changes placement.
  Reversing the drawing under `lsb0` — putting the first-declared field on
  the right — is a misreading, and would make `bitfield` the only genre in
  which declaration order is not drawing order (`DECLARATION-ORDER-SEMANTICS`).
- A field carrying `present=` is conditionally present, in **either** of
  the key's two written forms. A reader computing absolute offsets or bit
  numbers across such a field MUST branch: emit conditional values (one set
  with the field present, one set with it absent), or state the presence
  assumption explicitly. Emitting a single unconditional number is a
  misreading (`BITFIELD-CONDITIONAL-OFFSETS`). The VALUE is authored prose about the condition and
  nothing more — quote it, never parse it, and never resolve a name inside
  it (core §12.7). **Which way the later fields move is
  numbering-dependent:** when a conditional field of width `w` is absent,
  every later field moves `w` positions earlier in the drawing (`w` columns
  left, crossing into the previous word when that runs out), so its bit
  numbers fall by `w` under `msb0` and RISE by `w` under `lsb0`.
- An **absent** `present=` key means the author wrote **no presence claim**.
  It is NOT an assertion that the field is always present, and a reader
  MUST NOT report it as one.
- **A declared field list does not enumerate every occurrence.** Where a
  figure indicates repetition — `field "Segment List[0]" 128` …
  `field "Segment List[n]" 128`, a count field naming a repeated section, a
  label saying "1..n" — an agent MUST NOT assume the declared fields are all
  of them, and MUST treat every later offset as **indeterminate**. This is the
  one gap that degrades to a *confidently wrong* number rather than to
  "unknown", which is why it is a MUST NOT.
- **`index=` is the exception, and it is reached from SYNTAX (
  `BITFIELD-REPETITION-CONSTRUCT`).** A field carrying `index=` is one element of a run, and the
  arithmetic follows from the key rather than from the label:
  - both ends literal ⇒ the run holds `|last − first| + 1` elements, the
    field contributes `w × count` to the declared bit sequence (quantity 1),
    and **every later field's declared offset is determinate again**;
  - one end prose, or `index=""` ⇒ the count is not in the document, quantity
    1 becomes indeterminate from that field on, and later offsets stay
    indeterminate — the same treatment a `*` field gets, and for the same
    reason;
  - **quantity 2 (the drawing) draws TWO occurrences at most** — the first
    and the last, or one alone when `index=""` states no index — whatever
    the count. The drawing and the bit sequence therefore diverge across a
    repeated element, further than they do across a `break`, and two drawn
    boxes are never two elements' worth of bits. A reader derives the count
    from `index=` and never from the number of drawn rows (`MEANING-RECOVERY-SOURCE`).
- A `*` field fills the remainder of the current word in the drawing —
  columns `p mod word … word−1`. That is the RIGHT-hand end under both
  numberings, hence toward the highest bit numbers under `msb0` and toward
  the **lowest** under `lsb0`. The drawn width is the renderer filling a
  row, not the field's length: the length is not in the document, so a
  reader MUST NOT report it as one. Later declared offsets are relative to
  the variable field's end (quantity 1 becomes indeterminate from there
  on); drawing resumes at the start of the next word.
- A field wider than the row space remaining to it spans the following rows
  and is still ONE field: it covers columns `c … word−1` of the row it starts
  in, every column of each full row after that, and columns `0 … r−1` of the
  last. Its bit numbers therefore run the full `0 … word−1` (or `word−1 … 0`
  under `lsb0`) once per full row. **The name is written ONCE** (
  `FIELD-WIDER-THAN-WORD`), and the renderer draws the field as ONE shape wherever the geometry
  permits one: the boundary between two consecutive rows of the same field is
  unstroked over the columns the two rows SHARE and stroked everywhere else,
  which is RFC 8200 §3's `+   +` for a field that starts at column 0, and an
  L for one whose last row is short.
  - **The one geometry that cannot be one shape.** A field that starts at
    column `c` and ends at column `r−1` of the next row with `r ≤ c` occupies
    two pieces that meet at a corner and share no column — there is no edge
    to leave unstroked. It draws as two boxes; the **first in reading order**
    carries the name and the second carries the continuation mark
    `(cont.)`, in italic, which is the renderer's word and not the author's.
    A caption too wide for the box that carries it shrinks to a 7px floor and
    then overflows the box rather than being dropped. This is the only case
    with two boxes: every middle row of a spanning field is a full row and so
    overlaps both its neighbours.
  - Two boxes are still ONE field, and so are `(cont.)` and the name above it
    (`MEANING-RECOVERY-SOURCE` — do not read the drawing). A reader that needs the count reads the
    `field` lines.
- A reading agent MUST derive all three quantities from this model and
  MUST NOT infer bits from drawing geometry. None of the three is
  materialized in the model — see core §12.7, which licenses the
  derivation and states why the model records the widths rather than the
  computed ranges.

## Errors

| Condition | Error |
|-----------|-------|
| Unknown option on `bitfield` or `field` | line error |
| Compact and classic items mixed on one `field` line | line error |
| Missing comma between compact items | line error |
| Compact item name containing spaces, unquoted | line error |
| **Compact-form** item wider than `word` | line error |
| `break` with no field declared since the block opened or since the previous `break` | line error |
| More than one `*` field in the same `bitfield` block (classic or compact) | line error |
| Unknown `numbering=` value | line error |
| `numbering=` missing from the `bitfield` declaration | line error |
| `present=` written without quotes | line error |
| The retired positional flag `optional` or `conditional` | line error naming `present=` |
| `note=` on a `field`, at ANY version (0.1 as a rename; 0.3 as a REFUSAL) | line error. Since 0.3 it states the AUDIENCE division rather than naming a rename: `note=` draws and `field` does not take it; `description=` is for prose a machine reads, and a field's presence condition is `present=` |
| `index=` with no `..`, or with more than one | line error |
| `index=` with a dot RUN longer than two — `index=0...7` | line error, the same one |
| `index=` whose FIRST index is not a literal integer | line error |
| `index=` with a literal end above 9007199254740991 | line error |
| `index=` naming a fully-literal range of one element | line error |
| `index=` on a `*` field | line error |
| `index=` on the compact `field` form | line error naming the classic form |
| `index=` whose prose `<last>` contains a bare lowercase `step` token | line error naming the RESERVATION (`RULE-POSITION-ENUMERATION`, §9 `INDEX-RANGE-STEP`) |
| `bitfield` with a BARE label (`bitfield b Hdr`) | line error naming the quote, `bitfield label must be quoted` (`RULE-POSITION-ENUMERATION`). It parsed until then, while this document already wrote the form `bitfield <id> ["label"]` |  <!-- fence-check: skip -->
| `numbering=` written QUOTED (`numbering="msb0"`) | line error, RULE 2.4 (`RULE-POSITION-ENUMERATION`) |
| `field` width written QUOTED (`field "A" "32"`, `field "A" "*"`) | **legal, and inert** — a width is `<n>\|*`, an open value space (SYNTAX-STYLE RULE 2.3b), and `*` is a declared exception, §8.6 |

The compact-overflow and `break` conditions, stated exactly:

- **Compact-form overflow.** In the compact form (`field a:8,b:40`) an
  item whose width exceeds `word` is a line error. The compact form is
  the C bit-field convention — an item must fit its storage unit — and,
  carrying no per-field options, it has no way to say "this one is meant
  to span". The **classic** form has no such rule: `field "Payload" 128`
  under `word=32` is the documented spanning case above and stays legal,
  and so does a `*` item in either form. (The name must carry its quotes:
  in the classic form whitespace is ALSO the positional separator, so a
  bare token cannot grow into a phrase, and `field Payload 128` has been  <!-- fence-check: skip -->
  the line error `field name must be quoted in the classic form: field
  "Payload" 128` — `QUOTING-RULES`.) So the rewrite for an
  overflowing compact item is mechanical: write it in the classic form
  on its own line.
- **`break` needs something to break.** `break` closes the row built from
  the fields declared since the block opened, or since the previous
  `break`. With none declared, there is nothing to break and the line is
  an error. A field that ends *exactly* on a row boundary still counts —
  it IS the preceding field of the row being closed — so the common
  "close the row" idiom (`field "first" 16` + `break` under `word=16`)
  keeps parsing, and only a genuinely empty row is rejected.

## Example

```figdown
figdown 0.1 bitfield
class ifc "Present only if the C bit is 1 — RFC 2784 §2.2"
bitfield gre "GRE Header" word=32 numbering=msb0
field C:1,R:1,K:1
field "Reserved" 9
field "Ver" 3
field "Protocol Type" 16 fill=#bfdbfe description="see RFC 1700"
field "Checksum" 16 present="C = 1" class=ifc
field "Offset" 16 present=""
break
```
