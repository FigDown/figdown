# Engine ↔ spec discrepancies found while freezing the v0.1 goldens

> **Identifiers.** Each entry below has a decision ID, and every ID also has a
> row in [`decisions/registry.md`](../../../decisions/registry.md) with status
> `defect`. The registry row is the one-line summary; this file is the full
> account — the reproducing document, what the engine did, what the
> specification said, and how it was settled.

Every golden in `cases/` records what the **reference engine**
(`editor/figdown.html`) actually does. During the audit each golden was
checked against `spec/core.md`; the items below are the places
where the engine contradicts (or outruns) the spec text. They are frozen
in the goldens **deliberately and loudly** — this file is the record.
Resolving any item means changing either the spec or the engine, adding
a `spec/migrations.md` entry if the wire grammar moves, and regenerating
the affected golden with `--update` (see README, update policy).
Resolved items move to the **Resolved** section at the bottom — history
is kept, never deleted. Items `TITLE-ESCAPE-DECODE-ORDER`–`COLOUR-VALUE-VALIDATION` were resolved in the 0.1
strictness batch (migration entry `0.1`).

## `FLOWCHART-FLOW-DEFAULT` — `flowchart` template does not default `flow` to `down`

- Case: `011-header-template-flowchart-flow` (renamed
  `011-header-genre-flowchart-flow`, `HEADER-GENRE-REQUIREMENT` — "template"
  became "genre")
- Spec §1: "A template selects **defaults and a validation profile
  only** — default flow (`block`→right, `flowchart`→down) …"
- Engine: `doc.flow` is initialized to `right` and the template is never
  consulted; the golden freezes `"flow": "right"` under
  `figdown 0.1 flowchart`.

---

**Resolved (2026-07-16)**: implemented — the `flowchart`
template now defaults `flow` to `down`; an explicit `flow` line
overrides. Golden 011 updated; migration entry ships the rewrite rule
for documents that relied on the old behavior.

No engine *behavior* was changed while building the suite. During the
independent audit round two **cosmetic error-message** changes were
applied to the engine (no grammar or model change): the `pin` usage
message now says `at=<x>,<y>` (the `fx`/`fy` wording was retired
fraction-era vocabulary), and a typed-block child keyword outside any
block (`field`, `wrap`, `cell`, `width`, `signal`, `gap`) now reports
`"<kw>" is a typed-block child — it needs a bitfield/table/wave block
above it` (the third genre reads `timing`, `TIMING-GENRE-NAMING`) instead
of the generic unknown-keyword error. Goldens 361 and
901 carry the new texts; the skill bundle was regenerated
(`tools/make-skill.js`) per the repo rule.

## Spec-unsupported strictness / policy frozen without spec backing

Engine decisions the goldens freeze although the spec text neither
requires nor forbids them (audit round 2, items a–f):

- **Inconsistent emptiness policy** — `bitfield` with no fields and
  `timing` (spelled `wave` until 0.1, `TIMING-GENRE-NAMING`) with no signals are
  block-level errors
  (`406-bitfield-no-fields`, `602-timing-no-signals`), while a head-only
  `table` with no data rows is accepted (`513-table-head-only`). §8
  lists none of these three rules.
- ~~**`width` accepts a `px` suffix**~~ — **STALE, REMOVED 0.1.**
  The lenience was closed (the release that gave `width` and
  `width=` one unit grammar) and the item outlived it by twenty releases,
  which is how it read to a reviewer as a live defect. `width auto,90,120px,25%`
  is now the line error  <!-- fence-check: skip -->
  `bad width "120px" — write the number without a unit: 120 (auto | <px> | <n>%)`,
  and `509-table-width` carries bare numbers. The item's own example also
  used the SPACE form, itself retired (`POSITIONAL-LIST-SPELLING`), so the sentence had
  two retired spellings in it. (The directive was spelled `colw` until 0.1.)
- **Double error for one malformed delimiter row** — a delimiter row with
  the wrong column count yields both `delimiter row has 3 columns, expected 2`
  (on the row) and `table has no |---| delimiter row` (attributed to
  the `table` line) (`512-table-structure-errors`). One defect, two
  error lines, engine-internal attribution.
- **Zero-width `band` range rejected** — `band "R" 15..15%` fails the
  engine's strict `0 <= from < to <= 100` rule (`373-band-errors`);
  the spec never states whether an empty range is legal. (The directive
  was spelled `fill` until 0.1; the quoted label became mandatory
  and moved to the FRONT, `BAND-LABEL-STATUS`.)
- **Smaller unstated strictness** — `rank` requires ≥ 2 ids
  (`351-layout-errors`); `field "X" 0` is rejected only by falling
  through to the compact-form parser, with the misleading message
  `field needs <name> <width-in-bits>, or a name:width list`
  (`402-bitfield-field-errors`); duplicate `width` is an error whose
  precedence swallows the second line's bad-width diagnostic
  (`510-table-width-errors`).

  Two members of this list left it, both because the
  thing they reported had already changed underneath them:

  - ~~`highlight` is banned on header tiers though §4.2 only shows
    data-row examples~~ — the ban is **stated normatively** in
    [../spec/genres/table.md](../spec/genres/table.md) (the `highlight`
    row: *"data rows only … Never on a two-part address"*, 0.1,
    `ROW-HIGHLIGHT-CELL-FILL-COLLISION`). It is spec-backed strictness, so it does not belong under
    *spec-unsupported*. `508-table-mark-errors` still pins it.
  - ~~an invalid id spelling reports `node needs an id` even though an
    (illegal) id is present~~ — the message was replaced with the ID
    RULE itself (`QUOTED-IDS`): `208-node-bad-id` now reads
    `ids are bare and match [A-Za-z_][A-Za-z0-9_-]* — text with spaces or
    punctuation belongs in the label: node <id> "your text"`, which names
    what is wrong rather than something that is not.

## Ambiguities (spec unclear; engine behavior frozen as-is)

- **`#` inside an unquoted edge `[label]`** — a `#` preceded by
  whitespace starts a comment even inside `edge a -[has # hash]-> b`,
  truncating the line into an unterminated-label error
  (`254-edge-label-errors`, line 6). This follows the letter of the §1
  comment rule (only pipe rows are exempted), and the quoted form
  `-["has # hash"]->` is safe (`253-edge-bracket-content`) — but the
  spec never says edge labels are subject to comment scanning.

*(Three items — default layer `z`, the node label default, and duplicate
single-valued directives — left this section; see
`DUPLICATE-SINGLE-VALUED-LINES`/`LABEL-ABSENCE-VS-ID`/`PLANE-Z-UNSPECIFIED-IN-SPEC` in **Resolved** below. A fourth — the
`threshold` directive's target kind (the keyword was spelled `guide`
in an earlier release) — left it; see `THRESHOLD-BAND-TARGET-MISMATCH`. A fifth —
the genre-less header — left the strictness list; see
`GENRE-LESS-HEADER`.)*

## Untestable as written (no fixture possible)

- **Lenient mode (§10)** — the reference engine implements strict mode
  only, so `x-` extension tolerance and unknown-minor-version leniency
  have no testable behavior.
- **`in=` cycles (§8 lists "in= cycle" as a line error)** — v0.1 has no
  group-in-group syntax (`in=` on a `group` line is a line error, `INAPPLICABLE-OPTION-KEYS`), so a containment cycle cannot be constructed.
  **0.1**: core §8 and `genres/block.md` §Errors both listed the
  cycle flatly, as though a document could hit it. `genres/block.md` — a
  FROZEN genre document — now says what this item says, so the normative
  text and the fixture record agree; core §8's list keeps the entry as the
  *category* it reserves, marked with the same reason.
- **Per-genre "validation profile" (§1)** — the spec says a genre names
  a namespace, defaults and a validation profile (`GENRE-NAMESPACE`; before 0.1 it said "defaults and a validation profile only"), but it
  defines no per-genre validation rule and the engine applies none. The one
  genre-specific rule that IS tested is `bitfield`'s required `numbering=`
  (case `415-bitfield-numbering-required`). (The header token was called a
  *template* until 0.1.)

  **The *namespace* half stopped being untestable (`GENRE-KEYWORD-ALLOWLIST`), and
  this item said otherwise until 0.1.** It read *"no genre yet owns
  a keyword the others lack … all six genres accept all 21 top-level
  keywords"*, and both halves were false: `flowchart` owns `process`,
  `decision` and `terminator`; per-genre allowlists are ENFORCED
  (`"node" is not allowed in genre bitfield`,
  `"process" is not allowed in genre block`) and TESTED
  (`018-genre-k2-bitfield-rejects-node`). The count was wrong too — 22, not
  21 (core §10, `genres/README.md`), the same one-low figure
  `vocabulary-sources.tsv` carried until this release.
- **Line terminators and the BOM (§1)** — §1 now states that a
  line ends at LF or CRLF, that a bare CR is not a terminator, and that a
  leading U+FEFF is stripped. None of it is fixture-pinned: all 162 case
  sources are LF, and a fixture whose POINT is its line endings is not
  safely representable in a git working tree without a `.gitattributes`
  contract this repository does not have. Deliberate, and recorded here
  rather than left to be rediscovered.
- **U+FEFF outside the leading position (§1)** — the reference engine
  treats U+FEFF as WHITESPACE wherever whitespace is allowed, so
  `node<U+FEFF>a "A"` parses as `node a "A"`. This is an accident of the
  host language (ECMAScript `\s` includes U+FEFF, and the tokenizer trims
  and splits on `\s`), not a decision. Only the LEADING BOM is normative,
  and 0.1 made that one explicit in the engine so it no longer rests
  on the accident. The rest is unspecified lenience: a second
  implementation may reject it.
- **Renderer-tier conformance (§3)** — cross-renderer visual
  equivalence, the SVG metadata/SHA-256 rules (§7), and the
  strip-`pin`/`size` invariant (`GUI-WRITEBACK-STRUCTURE`) are renderer/artifact properties,
  outside this parser suite. Same-engine determinism *is* checked
  (run.js self-check), but with no golden bytes, per §3.

---

# Resolved

The 0.1 strictness batch (2026-07-16) resolved `TITLE-ESCAPE-DECODE-ORDER`–`COLOUR-VALUE-VALIDATION`: the
engine was aligned to the spec (or, for `UNKNOWN-MINOR-VERSION`/`PERCENT-VALUES-LOST`, the spec was
clarified), the affected goldens were regenerated with `--update`, and
the mechanical rewrite rules live in `spec/migrations.md`
(`0.1`). The original item texts are preserved
below; each carries its resolution note.

## `TITLE-ESCAPE-DECODE-ORDER` — `title` quoted form decodes escapes in the wrong order

- Case: `109-lex-title-escape-order`
- Spec §1: escapes are `\n` line break, `\"` quote, `\\` literal
  backslash. In `title "a\\nb"` the source `\\` + `n` must decode to
  backslash + letter `n` (`a\nb`, 4 chars, no newline).
- Engine: the title branch re-decodes the raw line with sequential
  regex replaces (`\n` first, `\\` last), so `a\\nb` decodes to
  `a` + backslash + **newline** + `b`. The generic tokenizer decodes the
  same string correctly for every other directive (case
  `102-lex-escapes` shows the correct behavior on a node label).
- **Resolved:** engine fixed — the title branch now decodes
  left-to-right in one pass, exactly like the generic tokenizer;
  golden 109 regenerated (rewrite rule in MIGRATIONS 0.1).

## `INAPPLICABLE-OPTION-KEYS` — registered-but-inapplicable option keys are silently ignored

- Cases: `205-node-foreign-option-ignored`, `232-group-in-ignored`
- Spec §1: closed grammar, "typos never pass silently"; §10 strict
  mode: "unknown keyword, unknown option, malformed line … → line
  error".
- Engine: the option-key set is one global list. A key that is
  registered for *some* directive but meaningless on this one is
  silently dropped: `node a "A" unit=32` parses clean (the fixture uses  <!-- fence-check: skip -->
  `numbering=`, when `unit=` was renamed `word=`), and — worse —
  `group inner "Inner" in=outer` parses clean while silently discarding  <!-- fence-check: skip -->
  the author's nesting intent (spec §2.2 shows containment only via
  `in=` on members; group-in-group is simply not a thing, so this line
  should be a line error, not a no-op).
- **Resolved:** engine fixed — option keys are now checked per
  directive (`<kw> does not take <key>=`), with a dedicated message for
  `group … in=` ("nesting is one level (node in=group) in v0.1");
  spec §2.2 now states `in=` is node-only. Cases renamed/flipped to
  error goldens (`205-node-foreign-option-rejected`,
  `232-group-in-rejected`), new case
  `410-bitfield-foreign-option-rejected`.

## `EXTRA-POSITIONAL-ARGUMENTS` — extra positional arguments accepted on several directives

- Cases: `362-pin-extra-positional-ignored`,
  `407-bitfield-decl-extra-arg-ignored`
- Spec §1: "A directive line containing positional arguments its
  grammar does not accept MUST be rejected (typos never pass
  silently)."
- Engine: `node`, `group`, `class`, `flow` do reject extras
  (`106-lex-extra-args` passes for the right reason), but `pin`,
  `size`, `layer`, `bitfield`/`table`/`wave` declarations, `cell`, and
  the classic `field` form ignore trailing positional junk:
  `pin a at=1,2 extra` and `bitfield x "X" trailing` parse clean.
- **Resolved:** engine fixed — `pin`, `size`, `layer`, `plot`, the
  `bitfield`/`table`/`wave` declarations, `cell`, and the classic
  `field` form now reject extras with the same
  `unexpected argument "…"` message as `node`/`flow`. Cases flipped to
  error goldens (`362-pin-extra-positional-rejected`,
  `407-bitfield-decl-extra-arg-rejected`).

## `DUPLICATE-BUNDLE-ID` — duplicate `bundle` id accepted

- Case: `393-bundle-duplicate-id-ignored`
- Spec §1: "IDs are `[A-Za-z_][A-Za-z0-9_-]*`, **unique per document**."
- Engine: node/group/layer/class ids enforce uniqueness; `bundle` ids
  are never checked. Two `bundle es1 …` lines parse clean and both land
  in the model.
- **Resolved:** engine fixed — `duplicate bundle id "…"` is a line
  error, aligned with node/group/layer/class. Case flipped to an error
  golden (`393-bundle-duplicate-id-rejected`).

## `NON-NUMERIC-Z-VALUE` — non-numeric layer `z=` silently becomes NaN

- Case: `333-layer-z-nonnumeric`
- Spec §1/§10: closed grammar, malformed values are line errors; §2.4
  makes `z` the explicit stacking order.
- Engine: `layer o "Overlay" z=high` parses clean with `z = NaN`  <!-- fence-check: skip -->
  (serialized as `null` in the golden — the only place a `null` can
  appear in a fixture, see normalize.js header).
- **Resolved:** engine fixed — `z must be a number` (integer) is a line
  error. Case flipped to an error golden; a `null` can no longer occur
  in any golden (see also `NON-NUMERIC-EXTENT`).
- **The case is GONE (`PAINT-ORDER-CONSTRUCT`), and the invariant it defended is
  not.** `333-plane-z-nonnumeric` — the fixture's name after the
  `layer` → `plane` rename — was DELETED with the construct: `plane` was
  withdrawn from the language, so `z-index=` has no acceptor and
  `z-index must be a number` can no longer be produced by any document.
  The GENERAL invariant this item established is still live and still
  enforced by `NON-NUMERIC-EXTENT`'s half of the family (`pin width=`/`height=`): a
  non-numeric value is a line error, and no golden may contain a `null`.
  That is checkable at any time — `grep -l null conformance/*/*.model.json`
  returns nothing.

## `NON-NUMERIC-EXTENT` — non-numeric `size` dimension silently becomes NaN

- Case: `365-size-nonnumeric-ignored` (renamed
  `365-pin-extent-nonnumeric-rejected`, `ELEMENT-GEOMETRY-DIRECTIVE` — `size` merged
  into `pin`, so the value now rides on `pin width=`)
- Same family as `NON-NUMERIC-Z-VALUE`: `size a w=wide h=20` parses clean; `w` is NaN  <!-- fence-check: skip -->
  (`null` in the golden) and only `h` survives. `group gap=` and
  `bitfield word=` (spelled `unit=` until 0.1), by contrast, do validate.
- **Resolved:** engine fixed — `w must be a number` / `h must be a
  number` are line errors. Case flipped to an error golden
  (`365-size-nonnumeric-rejected`, renamed again).

<!-- fence-check: skip-inline -->
## `BARE-FRACTION-VALUES` — `line at=` accepts a bare number without `%`
<!-- fence-check: resume-inline -->

- Case: `370-line-basic` (line 5, `at=15`) — now `370-threshold-basic`
- Spec §2.6 and the engine's own error message state `at=<0..100>%`.
- Engine: the `%` is optional in the regex; `at=15` parses clean. A
  lenience, not a data corruption — but a second implementation that
  requires the `%` sign would fail this golden.
- **Resolved:** engine fixed — the `%` is mandatory; the message now
  reads `line needs at=<0..100>% (with the % sign)`. Case 370's input
  corrected to `at=15%`; new error case
  `374-line-at-percent-required`. (The directive was renamed `guide` and `threshold` (`THRESHOLD-KEYWORD-SPELLING`), and `at=` became
  `offset=`, so those fixtures now read
  `370-threshold-basic` / `374-threshold-percent-required` and the
  message reads `threshold needs offset=<0..100>% (with the % sign)`.)

## `MERGE-ACROSS-DELIMITER-ROW` — `^^` accepted in the first data row (merges across the delimiter row)

- Case: `505-table-rowspan-first-data-row`
- Spec §4.2: `||`/`^^` are "Illegal in the first column/row
  respectively (line error)", and merging follows
  markdown-it-multimd-table, which does not merge across the
  thead/tbody boundary.
- Engine: only `^^` in the first **header** row is rejected
  (`504-table-merge-position-errors`). In the first data row it parses
  clean and the merge target is a header cell on the other side of the
  `|---|` delimiter row. At minimum a spec ambiguity ("first row" of what?);
  frozen as engine behavior.
- **Resolved:** engine fixed — `^^` in the first data row is a line
  error (rowspan does not cross the header delimiter row; multimd prior
  art). Case flipped to an error golden.

## `TABLE-CELL-BACKSLASH` — any leading backslash is stripped from a table cell

- Case: `506-table-cell-content` (cell `\x raw` → `x raw`)
- Spec §4.2 defines exactly two pipe-row escapes, `\|` and `\^^`, and
  says cell text is otherwise raw ("Comments are not recognized inside
  pipe rows (cell text is raw)").
- Engine: any cell whose trimmed text starts with a backslash loses
  that backslash, whatever follows it.
- **Resolved:** engine fixed — only `\|` (during segmentation) and
  `\^^` are escapes; any other leading backslash is literal cell text.
  Golden 506 regenerated (rewrite rule in MIGRATIONS 0.1).

## `UNKNOWN-MINOR-VERSION` — unknown minor version rejected outright

- Case: `014-header-bad-version`
- Spec §1: "an unknown minor version SHOULD parse in lenient mode
  (§10)".
- Engine: only strict mode exists; `figdown 0.2` is a line error.
  Defensible (SHOULD-strength, lenient-mode scope) but recorded because
  a second implementation that honors the SHOULD would diverge on this
  input.
- **Resolved by spec clarification:** §1 now scopes the SHOULD to
  viewer-tier (lenient-mode) implementations; a strict authoring-tier
  implementation MAY reject an unknown minor version outright (the
  reference engine does). No engine change; golden 014 unchanged.

## `UNKNOWN-OPTION-DEGRADATION` — unknown option keys degrade to positional arguments

- Case: `111-lex-unknown-option-key`
- Spec §10 strict mode: "unknown keyword, **unknown option**, malformed
  line … → line error".
- Engine: the option-key set is global; a token with an unregistered
  key (`foo=bar`) is reclassified as a *positional argument*. On
  directives that reject extras (`node`, `group`, `class`, `flow`) it
  surfaces as `unexpected argument "foo=bar"` — wrong category, right
  outcome. On the `EXTRA-POSITIONAL-ARGUMENTS` directives (`pin`, `size`, `layer`, block
  declarations, `cell`, classic `field`) it is **silently ignored**:
  `pin b at=1,2 foo=bar` parses clean (frozen in the golden by the  <!-- fence-check: skip -->
  absence of an error line for line 4).
- **Resolved:** engine fixed — an unregistered key is a uniform
  `unknown option "foo="` line error on every directive; inside timing
  `signal` lanes, bare tokens containing `=` remain positional (lane
  text) as before. Golden 111 regenerated; new case
  `603-timing-lane-eq-token` (the genre was spelled `wave` until 0.1, `TIMING-GENRE-NAMING`) freezes the lane behavior.

## `PERCENT-VALUES-LOST` — `size` percentage values lose their `%`

- Case: `366-size-percent` (renamed `366-pin-extent-percent`, `ELEMENT-GEOMETRY-DIRECTIVE`)
- Spec §3: `size l3 w=120 h=60` — "explicit size (**px or %**)".  <!-- fence-check: skip -->
- Engine: `size a w=50%` is parsed with `parseFloat`, yielding `50`  <!-- fence-check: skip -->
  with the `%` discarded — `w=50%` and `w=50` (px) are
  indistinguishable in the semantic model. Percentage sizes are
  effectively unimplemented, silently.
- **Resolved:** spec §3 changed to px-only (percentage sizes are
  reserved for a future version) and the engine rejects `%` values
  with `percentage sizes are not in v0.1 — use px`. Case flipped to an
  error golden.

## `COLOUR-VALUE-VALIDATION` — color values are never validated

- Case: `207-node-color-values`
- Spec §1: "Colors are CSS hex (`#0d9488`) or CSS named colors."
- Engine: any token is accepted verbatim: `color=teal` (legal named
  color) and `color=notacolor42` (garbage) both parse clean and land in
  the model unchanged. Closed-grammar strictness (§10) would make the
  garbage a line error.
- **Resolved:** engine fixed — every `color=`/`stroke=`/`text=` value
  must be `#rgb`/`#rrggbb` hex or a CSS named color (the 147 CSS/SVG
  keywords, lowercase, **plus `transparent`** — used by real figures
  for invisible spacers; spec §1 now says so explicitly); anything
  else is `unknown color "…" (#hex or CSS color name)`. Case 207
  flipped to an error golden; new positive case
  `209-node-color-named` freezes named-color/`transparent`/3-digit-hex
  acceptance.

## `GROUP-PRESENTATION-ATTRIBUTES` — presentation attributes rejected on `group`

- Case: `233-group-presentation`
- Spec §5: "Optional on any element: `color=` (fill), `stroke=`,
  `text=` (label color), `style=solid|dashed|dotted`, `layer=`;
  `gap=` on groups." The attributes are promised on **any** element.
- Engine: the `group` directive accepted only `color=`, `gap=` and
  `class=`; `style=`, `stroke=`, `text=` and `layer=` each fell through
  to `group does not take <key>=` and became line errors — so a
  spec-legal `group g "G" style=dashed stroke=#dc2626` failed to parse.
  Found downstream while engine-verifying a review reply that leaned on
  §5's "any element" wording.
- **Resolved (same-day):** engine fixed — `group` now accepts
  `style=`/`stroke=`/`text=`/`layer=` with the same value validation
  nodes apply (`style` ∈ `solid|dashed|dotted`; colors CSS-validated;
  `layer` must reference a declared layer), captures them in the model
  (alongside the unchanged `color=` fill and `gap=`), and the renderer
  honours them on the group box: `style`→border dash pattern,
  `stroke`→border colour, `text`→group-label colour, `layer` with the
  layering semantics nodes have. Parse acceptance only widens — nothing
  previously valid changes meaning — so no version bump and no
  `migrations.md` entry (the renderer-fix precedent). New positive case
  `233-group-presentation` freezes a dashed, red-stroked group.

## `SHAPE-AWARE-GEOMETRY` — node geometry was the bounding rectangle, whatever the shape

- Cases: `210-shape-diamond-geometry`, `211-shape-ellipse-geometry`,
  `212-shape-circle-geometry`, `213-shape-back-edge-side-channel`
  (`213` was `213-shape-cloud-geometry` until 0.1)
- Spec §2.1: `shape=` is **purely geometric** — the shape is the whole
  of what the keyword promises. §3: a renderer MUST be deterministic
  and "a local edit must change only the corresponding local region";
  §4 (`MEANING-RECOVERY-SOURCE`/`GUI-WRITEBACK-STRUCTURE`) rests on the render being a faithful reading of the
  document. A label that spills across its own outline, or an edge that
  stops where its node is not, contradicts the figure the source
  describes — the reader sees a relation that the model does not state
  (an edge ending in empty space) or loses one it does (an arrowhead
  hidden under a fill).
- Engine: every node was treated as its bounding rectangle in two
  places — node sizing and `borderPoint()` (endpoint clipping) — with
  one exception each (`diamond` got `w+20`, `circle` got `w=h`), which
  is a coincidence, not a geometry. Three symptoms, one cause:
  - **sizing** — the box was sized to hold the label *as if the node
    were a rectangle*, but a rhombus offers only its inscribed
    rectangle (about half the box in each direction) and an ellipse
    about `1/sqrt(2)` of its axes, so the text crossed the drawn
    outline. Measured on case 210 (`"Retry limit reached?"`,
    `shape=diamond`): box 192x48, the label's own text box reaching
    `|dx|/a + |dy|/b = 1.053` — outside the rhombus. Case 211
    (two-line ellipse label): 1.027. Case 212 (five-line circle
    label): 1.046. `cloud` is drawn *larger* than its box
    (`rx=w/2+10`, `ry=h/2+8`), so its sizing was already generous and
    no repo figure overflowed one — the defect is real there only for
    labels above about three lines.
  - **endpoints** — `borderPoint()` intersected the bounding box, so an
    edge meeting a diamond or an ellipse stopped where the shape is
    not. Case 210 before: rhombus vertices
    `(167.6,20) (263.6,44) (167.6,68) (71.6,44)` and an endpoint at
    `(142.8,68)` — on the box's bottom edge, but at y=68 the rhombus is
    the single point x=167.6, so the line ended 24.8 px away from the
    shape (outline norm 1.258). Ellipse 1.200, circle 1.269. On a
    `cloud` the error has the opposite sign — the endpoint landed
    *inside* the drawn ellipse (norm 0.934, 0.892), where the fill hides
    the arrowhead.
  - **label placement** — edge labels were written at a fixed offset
    from the segment midpoint with no knowledge of what was already
    there, so on dense figures they overlapped node boxes, arrowheads
    and each other (5 collisions in the repo's own figure set; 7 in a
    single 52-node production document).
- **Resolved:** engine fixed. One shape-aware geometry helper
  (`shapeAxes` / `outlineNorm` / `inscribedHalfW`) reports the outline
  a shape is actually **drawn** with — half-extents `(a,b)` about the
  box centre and the exponent of `(|dx|/a)^p + (|dy|/b)^p = 1`
  (`p=1` rhombus, `p=2` ellipse, `p=Infinity` rectangle, plus the
  cloud's `+10`/`+8` overhang) — and both the sizing pass and
  `borderPoint()` read it, so they cannot disagree about where a shape
  ends. Sizing grows the box by the smallest factor that pulls the
  label's text box inside the outline (a rigid `size` node keeps its
  box and shrinks its text to the *inscribed* width instead, `LAYOUT-STABILITY`/`UNDECLARED-ATTRIBUTE-BEHAVIOUR`);
  clipping divides the direction by the same norm, landing the endpoint
  exactly on the outline. Rectangles keep the original expression
  bit-for-bit — `box`/`rounded`/`cylinder` output is unchanged. Edge
  labels are placed by one deterministic pass in document order that
  scores a fixed candidate list against already-placed labels, node
  boxes, arrowheads and foreign edges. After: the same measurements read
  0.808 / 0.861 / 0.878 / 0.844 for containment and 1.000 for every
  endpoint. Over `conformance/cases`, `examples`, `examples/patterns`,
  `examples/showcase`, and `figures`: 189 labels; 279 endpoint records =
  237 asserted + 42 fanned; 0 failures among asserted endpoints.
  `tools/shape-check.js` goes from 25 failures to 0, and
  `tools/layout-lint.js` label collisions from 5 to 0 (total score
  125 to 115). No grammar, registry or model change: the four new cases
  freeze the *parse* of the scenarios the geometry check asserts, and
  no existing golden moved. Renderer-only, so no version bump and no
  `migrations.md` entry (the renderer-fix precedent, `GROUP-PRESENTATION-ATTRIBUTES`).
- **Historical note**: every sentence above about `cloud`
  describes a shape that no longer exists — the value was retired (`SHAPE-ENUM-VOCABULARY`,
  MIGRATIONS 0.1) and with it the `+10`/`+8` overhang, the
  `(ox,oy)` term in `shapeAxes()` and the opposite-signed endpoint
  error. No registered shape is drawn outside its box any more. The
  record is left in its original wording; case `213` was repurposed to
  the half of its coverage that survives (a back edge reaching a curved
  outline square-on).

## `PRESENTATION-SURFACE-MISMATCH` — spec §5 promised attributes the engine rejected, and the engine rejected lines the spec never mentioned

- Cases: `112-lex-extra-args-every-directive`,
  `304-presentation-on-every-element`, `305-presentation-carve-outs`,
  `306-presentation-value-errors`, `395-render-zone-edge-after`
  (renamed `395-layout-zone-edge-after`),
  `411-bitfield-compact-overflow`, `412-bitfield-wrap-without-field`,
  `413-bitfield-wrap-after-full-row`, `414-block-id-cross-kind-collision`,
  `515-table-colw-retired`
- The generalisation of `GROUP-PRESENTATION-ATTRIBUTES`, which fixed `group` alone. §5 says the
  presentation attributes are "optional on any element", but the
  per-directive option table granted them piecemeal: `boundary` took
  none, `bundle` and `cell` only `color=`, `line` only `color=`,
  `fill` no `stroke=`/`style=`, `class` no `layer=`, the typed blocks
  and `field`/`signal` almost nothing. 35 spec-legal attribute
  combinations were line errors. In the other direction the closed
  grammar was leaking: the version header, `line`, `fill`, `wrap`,
  `signal` and `gap` accepted trailing junk positionals; `edge` (its
  own dispatch path) escaped the `CONTENT-LAYOUT-ZONE-SPLIT` render-zone gate; the two
  `spec/genres/bitfield.md` error rules — compact-form width overflow
  and `wrap` with no preceding field — were documented but never
  implemented; and typed-block ids sat outside the id namespace §1
  calls "unique per document", so `node a` + `bitfield a` both parsed.
- **Resolved:** engine widened and tightened in one pass; spec caught
  up in the same increment (`0.1`).
  - §5 now carries the **carve-out table** — the four combinations
    deliberately NOT supported (`boundary` × `color`/`stroke`/`style`,
    because `EXTERNAL-EDGE-ENDPOINTS` never draws it; `fill` × `text`, because a band has no
    label; `bitfield`/`table`/`wave` × `style`/`layer`; `field`/`cell`/
    `signal` × `layer`) — and states honestly that `layer=` on
    nodes/groups/boundaries is recorded but only edges, bundle rings,
    threshold lines and zone bands are painted in layer order.
    (The `fill` × `text` row is **gone** as of 0.1: `BAND-LABEL-STATUS` gave
    `band` a mandatory quoted label, so it has a text channel and
    accepts `color=`. `305-presentation-carve-outs` lost its
    `band … color=` line with it and now emits 12 error lines, not 13.)
  - §2.8 no longer says `boundary` "takes no options": it takes `text=`
    and `layer=`, and its id namespace now includes the typed blocks.
  - `spec/genres/bitfield.md` states both error rules exactly as
    implemented (overflow is compact-form only; a field ending on a row
    boundary still counts as `wrap`'s preceding field).
  - `spec/migrations.md` `0.1` ships a mechanical
    rewrite rule for every new rejection, plus the `colw` → `width`
    keyword rename landed in the same increment (retired spelling
    reports `colw has been renamed: use width (…)`, the `kind=`/`shape=`
    precedent).
  - Ten cases freeze the result; no pre-existing golden moved except
    the two `colw` fixtures, renamed to `509-table-width` /
    `510-table-width-errors` with the keyword.

## `DUPLICATE-SINGLE-VALUED-LINES` — duplicate `title` / `flow` / `pin` lines won silently

- Cases: `903-errors-duplicate-single-valued` (new),
  `351-layout-errors` (unchanged — both its `flow` lines were already
  errors, so the new rule never fires there)
- Spec §8 / §10 strict mode: unknown or malformed input is a line error,
  never ignored. `render` already reported `duplicate render line`, but
  a second `title`, a second `flow`, or a second `pin` for the same node
  id silently overwrote the first: the document stated two things and
  the reader was never told which one was dropped. The spec was silent
  on repetition of single-valued directives, so the inconsistency had no
  arbiter.
- Corpus evidence (measured before the change, 277 `.fd` files across
  `examples/`, `conformance/cases/`, `figures/` and an external
  production corpus): zero duplicate `title`, zero duplicate `pin`, and
  exactly one duplicate `flow` — inside `351-layout-errors`, itself an
  error fixture.
- **Resolved (maintainer ruling `REPEATED-DIRECTIVE-HANDLING`):** engine fixed — the
  SECOND occurrence is a line error, worded like the existing `render`
  message: `duplicate title line`, `duplicate flow directive`,
  `duplicate pin for "<id>"`. `pin` is keyed per node id, so `pin a` +
  `pin b` stays legal. Spec §8 states the rule; MIGRATIONS
  `0.1` ships the mechanical rewrite (keep the last
  occurrence — exactly what the old engine did). No pre-existing golden
  moved.

## `LABEL-ABSENCE-VS-ID` — a node with no label was indistinguishable from one labelled with its id

- Cases: `200-node-basic` (golden updated),
  `214-label-absent-vs-id` (new)
- Spec §2.1 never stated a label default; the engine materialized
  `label = id`, so `node a` and `node a "a"` produced the *same* model.
  That is the information loss the standard exists to prevent (`MEANING-RECOVERY-SOURCE`:
  meaning must be recoverable from the syntax alone) — a reading agent
  could not tell "the author gave no label" from "the author's label
  happens to equal the id".
- **Resolved (maintainer ruling `OMITTED-LABEL-RECORDING`):** engine fixed — an
  omitted label is recorded as absent (`label: null` in the engine's
  model; the key is omitted in the canonical projection, per the
  absent-is-omitted rule of normalize.js). The RENDERER falls back to
  the id, so every rendered figure is byte-identical to 0.1 —
  verified by regenerating all 50 example/figure `.svg` artifacts with
  no diff. Applied to every directive whose label is optional:
  `node`, `group`, `bundle`, `bitfield`, `table`, `wave`. `boundary`
  (label already omitted when absent, and it has no id fallback even for
  display) and `layer` (label already projected away when empty) needed
  no change; `class`'s meaning and the marker `line`'s label (the
  keyword is `threshold`) are mandatory. `band` joined
  the mandatory-label set (`BAND-LABEL-STATUS`).
  Spec §2.1 states the rule and that the id substitution is a
  **rendering** rule, never a model rule.
- Residual, recorded not fixed: an **explicitly empty** label
  (`node a ""`) is still displayed as the id, because the renderer's
  fallback triggers on empty-or-absent. The model does distinguish the
  two (`""` vs. absent); only the drawing does not. Pre-existing
  behavior, unchanged by this increment, and no corpus document writes
  an empty label.
- **Residual closed (maintainer ruling `EMPTY-LABEL-STATE`):** the
  renderer's fallback now triggers on ABSENCE alone, so `node a ""`
  draws no text. The model half of the same defect — the three
  directives where `""` never reached the model at all — was `EMPTY-LABEL-DIRECTIVE-COVERAGE`,
  resolved in the same increment. `LABEL-ABSENCE-VS-ID` has no residual left: the
  distinction the model records is now the distinction the figure
  shows.

## `PLANE-Z-UNSPECIFIED-IN-SPEC` — the default `z` of a declared layer was engine behavior only

- Case: `332-layer-default-z` (extended)
- Spec §2.4 defined `base` = 0 and said `z` among layers "is explicit",
  while the engine gave a `layer` line without `z=` its 1-based
  declaration index and the golden froze it. A second implementation
  reading only the spec had no way to reproduce the paint order.
- **Resolved (maintainer ruling `PLANE-Z-INDEX-DEFAULT`):** spec §2.4 now states
  the rule normatively — `base` is `z = 0`; a `layer` line without `z=`
  takes its 1-based position among the declared layers; an explicit `z=`
  overrides for its own line and does not shift its neighbours; `z`
  values need be neither unique nor contiguous. No engine change (the
  engine already did exactly this, re-verified). Case `332` was extended
  with an explicit `z=10` in the middle position, so the golden now
  proves the "does not shift its neighbours" half of the rule
  (`z` = 1, 10, 3).
- **The case is GONE (`PAINT-ORDER-CONSTRUCT`), and so is the rule.** `PAINT-ORDER-CONSTRUCT`
  withdrew `plane` from the language: no document can declare one, so no
  declared plane can take a default `z`, and `332-plane-default-z` — the
  fixture's name after the `layer` → `plane` rename — was DELETED with the
  construct. Spec §2.4's normative sentence goes with it. What SURVIVES is
  the one clause this item did not create: the implicit
  `planes[0] = {id:"base", z:0}` is still projected into every model, and
  paint order is now document order — a later line paints on top. The
  lesson the item taught outlives both: a paint order a second
  implementation could not reproduce from the spec was a real hole, and it
  was closed by writing the rule down rather than by leaving the golden to
  imply it.

## `THRESHOLD-BAND-TARGET-MISMATCH` — the scalar marker accepted only a group, while a band accepted a group or a node

> The marker keyword was `line` when this item was filed, `guide` from
> 0.1, and `threshold` (`THRESHOLD-KEYWORD-SPELLING`). The case files were
> renamed with it each time; the current names are cited below.

- Cases: `375-threshold-node-target` (new), `371-threshold-errors`
  (message updated), `370-threshold-basic` (unchanged — group-scoped)
- Spec §2.6 says the scope of these markers **follows the meaning**
  (`AUTHORING-INTENT-OVER-RENDERING`): attach to the group when the threshold is shared, to the node
  when it is genuinely per-element. `fill` (now `band`) implemented
  both. `line` (now `threshold`) accepted only a group — a node target
  reported `unknown group "<id>"` — although its own prose said "a
  horizontal marker across **the target's** box" and §2.6 presented the
  two directives as a decoupled pair over the same scopes. So the spec
  promised a symmetry the engine did not have, and the error message
  named a kind (`group`) rather than the constraint.
- **Resolved (maintainer ruling `MARKER-TARGET-KINDS`):** engine widened —
  the marker now takes a group **or** a single node, exactly like
  `band`. The renderer draws a node-scoped marker across the node's own
  box (the same box a node-scoped band measures). Messages align with
  `band`'s — today they read `threshold needs in=<node-or-group-id>` and
  `unknown target "<id>" for threshold`. Spec §2.6 states the symmetry.
  No pre-existing golden moved except the two `371` message lines and
  the file renames that came with the `line` → `guide` keyword change;
  no rendered byte changed, because no document could previously have
  written a node-scoped marker.
- Both directives are still EXPERIMENTAL (§2.6, §10, `GENRE-EARNING-THRESHOLD`), and both were
  reshaped again: `threshold` keeps its shape (`THRESHOLD-VALUE-SCOPE` — no
  `value=`, no `ref=`), while `band` gained a MANDATORY quoted label
  written FIRST plus `color=` (`BAND-LABEL-STATUS`).

## `GENRE-LESS-HEADER` — a genre-less header parsed, and the spec contradicted itself about whether it should

- Cases: `010-header-genre-required` (repurposed from
  `010-header-minimal` — same number, opposite expectation),
  `012-header-missing` (message updated),
  `015-header-unknown-genre` (renamed from
  `015-header-unknown-template`, message updated)
- `figdown 0.1` with no genre token parsed cleanly. The spec said both
  things at once: §1's example comment read "version header + TEMPLATE,
  REQUIRED first line", while §11's ABNF wrote `[SP template]` —
  bracketed, i.e. optional. The suite had resolved toward the ABNF and
  the engine, and recorded the contradiction under *unstated
  strictness*; that recording was the placeholder, not the answer.
- The argument that settles it is not stylistic. `bitfield`, `table` and
  `wave` documents declare their kind in their CONTENT — they contain
  the typed block — so a reading agent recovers the kind without the
  header. `block`, `topology` and `flowchart` share the SAME vocabulary
  (`node`/`edge`/`group`) and differ only in default flow, so the header
  is the ONLY place such a document states which kind of figure it is.
  An omission there is unrecoverable, which is the same test that made
  `numbering=` required (`THRESHOLD-BAND-TARGET-MISMATCH`'s sibling ruling, `UNSAFE-DEFAULT-ELIMINATION` §3).
- Corpus evidence (measured before the change): across 282 `.fd`
  documents — this repository plus an external production corpus —
  exactly ONE omits the genre, and it is `010-header-minimal`, the
  fixture whose purpose was to test omission.
- **Resolved (maintainer ruling `HEADER-GENRE-REQUIREMENT`):** engine fixed — a
  header with no genre is the line error
  `figdown header requires a genre (block|topology|flowchart|bitfield|table|wave)`
  (the sixth value reads `timing`, `TIMING-GENRE-NAMING` — the message text
  is otherwise unchanged),
  listing the six values so an authoring agent fixes it in one step.
  §1 states the requirement and §11's ABNF drops the brackets
  (`SP genre`), so the self-contradiction is gone in both directions.
  `010` keeps its number and becomes an error fixture, so the coverage
  is preserved rather than deleted. MIGRATIONS
  `0.1` marks the rewrite NON-MECHANICAL for the
  three scene genres, because no program can choose between them.
  Related terminology change in the same increment: the header token is
  a **genre**, not a template, and the semantic model's header key is
  `genre` (`HEADER-GENRE-REQUIREMENT`).

## `FIRST-SIGNIFICANT-LINE` — the spec said "first line"; the engine, and 10% of a production corpus, said "first significant line"

- Case: `018-header-after-comments` (new)
- §1 said the `figdown` header is the "REQUIRED first line". The engine
  has always accepted comment lines and blank lines above it — they are
  stripped before the header check ever runs — so the spec text was
  stricter than every implementation and every document.
- This is a spec-side defect, not an engine one, and it had teeth: the
  conformance suite's premise (README) is that a second implementation
  can be written "without ever reading the reference engine". Written to
  the letter of §1, that implementation would reject **9 of 91**
  documents in an external production corpus — figures carrying a
  provenance block (source document, image hash, reconstruction method)
  above the header.
- **Resolved (maintainer ruling `HEADER-GENRE-REQUIREMENT`):** SPEC-ONLY. §1 now
  says the header MUST be the first **significant** line and that
  comments and blank lines MAY precede it; §11's ABNF expresses it
  (`document = *insignificant header *line`, with
  `insignificant = comment-line / blank-line`). No engine change and no
  document change; `018-header-after-comments` locks the behaviour so it
  cannot regress.

## `EMPTY-LABEL-DIRECTIVE-COVERAGE` — an explicitly empty label was collapsed into absence on three directives out of nine

- Case: `215-label-empty-string` (new)
- Spec §12.3 makes the absent-is-omitted rule normative: an optional
  attribute the source does not write is OMITTED, so the presence of a
  key means the author wrote it. `READ-SIDE-DETERMINISM`/`OMITTED-LABEL-RECORDING` is why — a materialized
  default must not merge two distinguishable documents into one model.
- The rule distinguishes *absent* from *written*. It does not distinguish *absent* from *written and empty*
  consistently. Measured against the engine:
  - `node a ""`, `group g ""`, `bundle b ""`, `bitfield h ""`,
    `table t ""`, `wave w ""` → the model records `"label": ""`, which  <!-- fence-check: skip -->
    is distinguishable from the absent case.
  - `layer L ""` → the projection writes `l.label || undefined`, so the  <!-- fence-check: skip -->
    empty string is dropped. The `||` is load-bearing for a different
    reason: the engine records the implicit `base` layer's label as
    `""`, and preserving it would put a `"label": ""` on `base` in
    every golden.
  - `boundary x ""` → the ENGINE stores `pos[2]||undefined`, so it  <!-- fence-check: skip -->
    never records the empty string at all. Every sibling directive
    uses the `pos[2]!==undefined?pos[2]:null` form that the `OMITTED-LABEL-RECORDING` batch
    introduced; `boundary` was not converted.
  - `title ""` → the projection writes `if (doc.title)`, so an empty
    title is indistinguishable from no `title` line. The engine does
    record `""`.
- Severity: LATENT, not active. No document in this repository or in
  the measured production corpus writes an empty label, and the
  renderer treats an empty label exactly like an absent one everywhere
  (`x.label ? x : {…label: x.id}`), so no rendered byte is at stake
  today. What is at stake is `READ-SIDE-DETERMINISM`'s premise: a second implementation
  written to §12.3 alone would naturally record `""` as `""` on all
  nine directives and would then diverge from the reference engine on
  three of them.
- Two independent defects are bundled here because they present as one
  symptom: an ENGINE defect (`boundary`) and a PROJECTION defect
  (`layer`, `title`). Resolving them means picking one of two rules —
  either the empty string is a written value everywhere (uniform with
  node/group/bundle/blocks, and the `base` layer stops carrying a
  label), or it is normalized to absence everywhere (uniform the other
  way, and §12.3 says so). Both are wire-compatible; neither is chosen
  here, because this increment documents behaviour rather than changing
  it.
- Frozen in `215-label-empty-string` so the current split cannot drift
  silently, and cross-referenced from spec §12.3 so no reader takes the
  inconsistency for the rule.
- **Resolved (maintainer ruling `EMPTY-LABEL-STATE`):** the FIRST of the
  two possible uniform rules was chosen — **an explicitly empty label is
  a written value everywhere, and the renderer draws nothing for it.**
  Both halves of the defect are fixed and the renderer follows:
  - ENGINE — `boundary` now uses `pos[2]!==undefined?pos[2]:null`, the
    exact form the `OMITTED-LABEL-RECORDING` batch gave the other six; `layer` uses it too,
    and the implicit `base` layer is constructed with `label: null`
    instead of `''`, which is what let the projection's `||` be
    load-bearing; `doc.title` starts as `null` instead of `''`, so a
    document with no `title` line is distinguishable from `title ""`
    inside the engine and not only in the projection.
  - PROJECTION — `normalize.js` drops both truthiness tests
    (`l.label || undefined`, `if (doc.title)`) for absence tests. The
    `base` layer still carries no label, because it now genuinely has
    none.
  - RENDERER — the single `OMITTED-LABEL-RECORDING` fallback at the top of `render()` tests
    absence instead of truthiness
    (`(x.label===null||x.label===undefined) ? {…label:x.id} : x`), so
    `""` draws blank while an omitted label still falls back to the id.
    It remains the ONE place the decision is made; the only other site
    that read a label defensively is the boundary anchor in
    `renderScene`, converted to the same absence test (a boundary has no
    id fallback either way, so its drawing is unchanged).
  - Rationale: `READ-SIDE-DETERMINISM` ruled that the model must not destroy a distinction
    the author made, and writing `""` is such a distinction. The
    substitution is not neutral either — the id is an internal handle,
    not authored display text, so drawing it puts visible text into a
    figure whose source has none. A production corpus contains five
    documents whose comments describe original figures with textless
    shapes (an unlabelled multiplexer, junction shapes carrying no text,
    gate glyphs with no text); their authors could not express blankness
    and had to invent a label or drop the shape — the source-fidelity
    loss `TRANSCRIPTION-FIDELITY-TIERS` exists to prevent.
  - Renderer tier: NOT covered by a fixture, and cannot be. This suite
    compares MODELS, not SVG (see *Renderer-tier conformance* under
    "Untestable as written" above, and §3: only same source + same
    renderer version must be byte-identical, so there are no golden
    bytes to compare). `215-label-empty-string` therefore freezes the
    model half only; the parse+render-twice determinism self-check
    exercises the blank path but asserts nothing about its content.
    The blank drawing was verified by direct measurement instead:
    rendering a blank `node`, `group`, `boundary`, `bundle`, typed block
    (`bitfield`/`table`/`wave`), `title` and the three curved shapes,
    and reading back the emitted geometry and text. A blank label emits
    an empty `<text …></text>` — which draws nothing, and is already how
    this renderer emits an empty table cell — over an undegenerate box:
    a blank node is 30x36 (the `tw()` 30 px minimum width floor) against
    35.2x36 for the one-character id, a blank group keeps its members'
    box unchanged, a blank block keeps its caption row, a blank
    `boundary` is byte-identical to an absent one (no id fallback in
    either state), and `title ""` reserves no title row at all
    (canvas 64x76, against 64x106 for `title "Hi"`). Nothing collapses
    to zero and no shape degenerates.
  - Blast radius: nil. No `.fd` in this repository other than
    `215-label-empty-string` writes an empty label, and none in the
    measured production corpus does; all 50 regenerated `.svg` artifacts
    are byte-identical in the drawing (truncated at
    `<metadata id="figdown-source"`). `215-label-empty-string` was
    updated to freeze the new uniform rule and now reads against
    `214-label-absent-vs-id`, which freezes the absent half; spec §2.1
    and §12.3 state the rule; MIGRATIONS `0.1`.

## `TOKEN-STREAM-MISMATCH` — two directives tested one token stream and read from another (`bundle`, `guide`)

> The second directive is spelled `threshold` (`THRESHOLD-KEYWORD-SPELLING`);
> the title keeps the spelling the defect was filed under.

- Cases: `115-lex-option-before-label` (new), plus `390-bundle-basic`
  and `370-threshold-basic` for the unaffected forms.
- Spec §10 and every genre vocabulary table describe options as `key=`
  tokens with no stated position, and `splitOpts` implements exactly
  that: an option is pulled out of the line wherever it sits and the
  positional arguments close up behind it. Nothing in the spec makes
  option position significant on any directive.
- The ENGINE disagreed on two directives, and in a way no test caught
  because every fixture happened to put its options last. `bundle`
  (`:999`) and `guide` (`:1021`) tested quotedness on the RAW token
  stream (`tk.toks[i].q`) while taking the value from the
  option-stripped stream (`pos[i]`). The two indices coincide only when
  no option precedes the label, so:
  - `bundle t1 fill=red "LAG" a--b` → `bad member "LAG" (expected A--B)`  <!-- fence-check: skip -->
  - `guide in=a "Thr" at=50%` → `guide needs a quoted "<label>" first`
    (today: `threshold in=a "Thr" offset=50%`)
  Both lines are legal under the spec, and the six other label-bearing
  directives (`node`, `group`, `boundary`, `class`, `layer`, plus the
  typed-block openers) accept the same shape because they index `pos`
  throughout.
- Severity: ACTIVE but latent in the corpora — no document in this
  repository or in the measured production corpus writes an option
  before a `bundle`/`threshold` label, because the error taught authors
  not to. The cost was paid in authoring, not in stored documents.
- **Resolved (`OPTION-POSITION-PARSING`):** ENGINE. `splitOpts` now returns
  `posq`, a quotedness array index-aligned with `pos`, and both call
  sites read it. Recording the fact inside `splitOpts` was chosen over
  fixing the two indices at their call sites: the defect was that the
  information needed to be right was never carried, so two more call
  sites would have made the same mistake. `115-lex-option-before-label`
  pins option-before-label on all six directives at once. No model or
  rendered byte changed for any existing document; MIGRATIONS
  `0.1` item 2.

## `COMPACT-FORM-OPTIONS` — the `field` compact form was closed to every option it was documented to have

- Cases: `416-bitfield-compact-options` (new),
  `417-bitfield-compact-unquoted-space` (new),
  `409-bitfield-form-mixing` (narrowed).
- `genres/bitfield.md:76` recorded the state as "options — **classic
  form only**", which made the engine and the spec agree. What neither
  said is that this was not a design decision: the compact branch did
  `raw.trim().replace(/^field\s+/,'')` and then split on commas, so it
  re-read the RAW source line AFTER `splitOpts` had already run. Any
  `key=value` text on the line therefore landed inside the last item and
  failed the item grammar. `fill=`, `class=` and `note=` (renamed
  `description=`, `DESCRIPTION-KEY-SPELLING`) were
  unreachable from the form that 53 downstream documents and 24 local
  documents use — not by intent, by an accident of which string the
  branch read.
  - *Note added 0.3 (`DRAWN-ANNOTATION-FORM`), annotating the sentence above rather
    than rewriting it.* The `note=` named there is the 0.1 one —
    the machine-facing tooltip key, which still exists and is still
    spelled `description=`. The SPELLING `note=` was **revived** under [SYNTAX-STYLE](../spec/syntax-style.md) RULE 4.9,
    for a different thing: the DRAWN annotation, refused on `field` at
    every version and accepted on
    `node`/`process`/`decision`/`terminator`/`state`/`group`/`edge`/
    `flowline`/`transition`/`title` under `figdown 0.3`. `DESCRIPTION-KEY-SPELLING` retired the
    name *in order to reserve it*, so the revival cashes a reservation
    rather than reversing a decision. Nothing about `COMPACT-FORM-OPTIONS` changes: the
    compact `field` form still carries `description=` line-wide, and a
    `note=` written on a `field` line — compact or classic — is a line
    error (`803-note-on-field-refused`, `479-bitfield-note-retired`).
    Read every `note=` in this entry as the pre-0.1 tooltip key.
- Severity: ACTIVE. It forced authors of the dominant form to fall back
  to the classic form line-by-line to get any presentation at all.
- **Resolved (`POSITIONAL-LIST-SPELLING`):** ENGINE + SPEC. The list is read from
  `pos` — the option-stripped stream — and every `field` option applies
  LINE-wide to every item, exactly as the classic form's options apply
  to its one field. The list can then only terminate at a whitespace
  boundary, so an item name containing spaces MUST be quoted
  (`field "Long Name":16`); unquoted it is a line error naming the cure.
  Migration cost, engine-measured: 2 local lines, 6 downstream lines in
  2 documents. (A pre-batch estimate of 10 lines in 5 documents was
  high; the number above is what the engine reports.) The tool REPORTS
  these rather than rewriting them, because a name containing a comma
  has no compact spelling at all. MIGRATIONS `0.1`
  item 1.

## `LAYOUT-VS-CONTENT-CLASSIFICATION` — `tools/r25-check.js` classified `flow` and `rank` as layout; the spec classifies them as content

- No case: this is a TOOL-vs-spec disagreement, not an engine one.
- `spec/core.md:251` (the spec-split note in §3) states that `flow` and
  `rank` are **content-zone** scene keywords whose vocabulary rows live
  in the genre documents, and §12 carries `ranks` in the semantic model.
  `guide/layout.md` said the same thing at line ~55 — and then listed
  `rank a b c` as rung 2 of the *layout* escalation ladder at line ~78,  <!-- fence-check: skip -->
  contradicting itself. (That ladder rung is quoted here in the wording it
  had at the time; `rank a b c` is itself a line error,  <!-- fence-check: skip -->
  `POSITIONAL-LIST-SPELLING` — the space form is retired and the canonical spelling is
  `rank a,b,c`. The quotation is history, not a live example.)
- `tools/r25-check.js:64` had
  `STRIP_RE = /^(flow|rank|pin|size|routing|path)\b/`, so the `GUI-WRITEBACK-STRUCTURE` strip
  test removed two content directives before asserting that meaning
  survives. A figure whose peer relationships were stated only by `rank`
  would have passed a test that had just deleted the statement.
- **Resolved (maintainer ruling):** TOOL + DOC. `flow` and
  `rank` are content; `STRIP_RE` is now
  `/^(pin|size|routing|path)\b/` — `/^(pin|routing|path)\b/`, when `size` merged into `pin` (`ELEMENT-GEOMETRY-DIRECTIVE`), and `/^pin\b/`, when `path` and `routing` were WITHDRAWN from the language
  (`EDGE-GEOMETRY-CONSTRUCTS`), leaving `pin` as the whole layout namespace — and `guide/layout.md` says content in
  both places (the ladder now marks rungs 0–2 as content and the layout
  zone as starting at rung 3). All documents still pass the strip test
  with the stricter rule.
