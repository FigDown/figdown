# Engine ↔ spec discrepancies found while freezing the v0.1 goldens

Every golden in `cases/` records what the **reference engine**
(`editor/figdown.html`) actually does. During the audit each golden was
checked against `spec/syntax-draft.md`; the items below are the places
where the engine contradicts (or outruns) the spec text. They are frozen
in the goldens **deliberately and loudly** — this file is the record.
Resolving any item means changing either the spec or the engine, adding
a `spec/MIGRATIONS.md` entry if the wire grammar moves, and regenerating
the affected golden with `--update` (see README, update policy).
Resolved items move to the **Resolved** section at the bottom — history
is kept, never deleted. Items D2–D14 were resolved in the 0.1-dev.11
strictness batch (migration entry `0.1-dev.10 → 0.1-dev.11`).

No engine *behavior* was changed while building the suite. During the
independent audit round two **cosmetic error-message** changes were
applied to the engine (no grammar or model change): the `pin` usage
message now says `at=<x>,<y>` (the `fx`/`fy` wording was retired
fraction-era vocabulary), and a typed-block child keyword outside any
block (`field`, `wrap`, `cell`, `colw`, `signal`, `gap`) now reports
`"<kw>" is a typed-block child — it needs a bitfield/table/wave block
above it` instead of the generic unknown-keyword error. Goldens 361 and
901 carry the new texts; the skill bundle was regenerated
(`tools/make-skill.js`) per the repo rule.

## D1 — `flowchart` template does not default `flow` to `down`

- Case: `011-header-template-flowchart-flow`
- Spec §1: "A template selects **defaults and a validation profile
  only** — default flow (`block`→right, `flowchart`→down) …"
- Engine: `doc.flow` is initialized to `right` and the template is never
  consulted; the golden freezes `"flow": "right"` under
  `figdown 0.1 flowchart`.

---

## Spec-unsupported strictness / policy frozen without spec backing

Engine decisions the goldens freeze although the spec text neither
requires nor forbids them (audit round 2, items a–f):

- **Inconsistent emptiness policy** — `bitfield` with no fields and
  `wave` with no signals are block-level errors
  (`406-bitfield-no-fields`, `602-wave-no-signals`), while a head-only
  `table` with no data rows is accepted (`513-table-head-only`). §8
  lists none of these three rules.
- **`colw` accepts a `px` suffix** — `colw auto 90 120px 25%` parses
  (`509-table-colw`) although §4.2's grammar and example write bare
  numbers (`colw auto 90 auto 25%`). Same lenience family as D8 (which
  is itself resolved — the `colw` lenience remains).
- **Double error for one malformed separator** — a separator with the
  wrong column count yields both `separator has 3 columns, expected 2`
  (on the row) and `table has no |---| separator row` (attributed to
  the `table` line) (`512-table-structure-errors`). One defect, two
  error lines, engine-internal attribution.
- **Zero-width `fill` range rejected** — `fill 15-15%` fails the
  engine's strict `0 <= from < to <= 100` rule (`373-fill-errors`);
  the spec never states whether an empty range is legal.
- **Template-less header accepted** — `figdown 0.1` with no template
  parses (`010-header-minimal`). §1's example comment says "version
  header + TEMPLATE, REQUIRED first line" while §11's ABNF has
  `[SP template]` optional — a spec self-contradiction. The suite
  resolves toward the ABNF (and the engine): template is optional.
- **Smaller unstated strictness** — `rank` requires ≥ 2 ids
  (`351-layout-errors`); `field X 0` is rejected only by falling
  through to the compact-form parser, with the misleading message
  `field needs <name> <width-in-bits>, or a name:width list`
  (`402-bitfield-field-errors`); `highlight` is banned on header tiers
  (`508-table-mark-errors`) though §4.2 only shows data-row examples;
  duplicate `colw` is an error whose precedence swallows the second
  line's bad-width diagnostic (`510-table-colw-errors`); an invalid id
  spelling reports `node needs an id` even though an (illegal) id is
  present (`208-node-bad-id`).

## Ambiguities (spec unclear; engine behavior frozen as-is)

- **`#` inside an unquoted edge `[label]`** — a `#` preceded by
  whitespace starts a comment even inside `edge a -[has # hash]-> b`,
  truncating the line into an unterminated-label error
  (`254-edge-label-errors`, line 6). This follows the letter of the §1
  comment rule (only pipe rows are exempted), and the quoted form
  `-["has # hash"]->` is safe (`253-edge-bracket-content`) — but the
  spec never says edge labels are subject to comment scanning.
- **`line` target kind** — `line` accepts only groups
  (`371-line-errors`, line 8 message: `in=<group-id>`), while `fill`
  explicitly takes "a group **or** a single node" (§2.6). The spec's
  `line` prose says "the target's box"; all its examples are groups.
- **Default layer `z`** — a `layer` without `z=` gets its declaration
  index (1, 2, …) (`332-layer-default-z`); §2.4 defines only
  `base` = 0 and says z among layers "is explicit".
- **Node label default** — `node a` with no label uses the id as the
  label (`200-node-basic`); the spec never states the default.
- **Duplicate `title` / `flow` / `pin` lines** — last one wins
  silently (not frozen as cases; spec silent on repetition of
  single-valued directives).

## Untestable as written (no fixture possible)

- **Lenient mode (§10)** — the reference engine implements strict mode
  only, so `x-` extension tolerance and unknown-minor-version leniency
  have no testable behavior.
- **`in=` cycles (§8 lists "in= cycle" as a line error)** — v0.1 has no
  group-in-group syntax (`in=` on a `group` line is a line error since
  0.1-dev.11, D3), so a containment cycle cannot be constructed.
- **Per-template "validation profile" (§1)** — the spec says a template
  selects "defaults and a validation profile only" but never defines
  any per-template validation rule; the engine applies none.
- **Renderer-tier conformance (§3)** — cross-renderer visual
  equivalence, the SVG metadata/SHA-256 rules (§7), and the
  strip-`pin`/`size` invariant (R25) are renderer/artifact properties,
  outside this parser suite. Same-engine determinism *is* checked
  (run.js self-check), but with no golden bytes, per §3.

---

# Resolved (0.1-dev.11)

The 0.1-dev.11 strictness batch (2026-07-16) resolved D2–D14: the
engine was aligned to the spec (or, for D11/D13, the spec was
clarified), the affected goldens were regenerated with `--update`, and
the mechanical rewrite rules live in `spec/MIGRATIONS.md`
(`0.1-dev.10 → 0.1-dev.11`). The original item texts are preserved
below; each carries its resolution note.

## D2 — `title` quoted form decodes escapes in the wrong order

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
  golden 109 regenerated (rewrite rule in MIGRATIONS 0.1-dev.11).

## D3 — registered-but-inapplicable option keys are silently ignored

- Cases: `205-node-foreign-option-ignored`, `232-group-in-ignored`
- Spec §1: closed grammar, "typos never pass silently"; §10 strict
  mode: "unknown keyword, unknown option, malformed line … → line
  error".
- Engine: the option-key set is one global list. A key that is
  registered for *some* directive but meaningless on this one is
  silently dropped: `node a "A" unit=32` parses clean, and — worse —
  `group inner "Inner" in=outer` parses clean while silently discarding
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

## D4 — extra positional arguments accepted on several directives

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

## D5 — duplicate `bundle` id accepted

- Case: `393-bundle-duplicate-id-ignored`
- Spec §1: "IDs are `[A-Za-z_][A-Za-z0-9_-]*`, **unique per document**."
- Engine: node/group/layer/class ids enforce uniqueness; `bundle` ids
  are never checked. Two `bundle es1 …` lines parse clean and both land
  in the model.
- **Resolved:** engine fixed — `duplicate bundle id "…"` is a line
  error, aligned with node/group/layer/class. Case flipped to an error
  golden (`393-bundle-duplicate-id-rejected`).

## D6 — non-numeric layer `z=` silently becomes NaN

- Case: `333-layer-z-nonnumeric`
- Spec §1/§10: closed grammar, malformed values are line errors; §2.4
  makes `z` the explicit stacking order.
- Engine: `layer o "Overlay" z=high` parses clean with `z = NaN`
  (serialized as `null` in the golden — the only place a `null` can
  appear in a fixture, see normalize.js header).
- **Resolved:** engine fixed — `z must be a number` (integer) is a line
  error. Case flipped to an error golden; a `null` can no longer occur
  in any golden (see also D7).

## D7 — non-numeric `size` dimension silently becomes NaN

- Case: `365-size-nonnumeric-ignored`
- Same family as D6: `size a w=wide h=20` parses clean; `w` is NaN
  (`null` in the golden) and only `h` survives. `group gap=` and
  `bitfield unit=`, by contrast, do validate.
- **Resolved:** engine fixed — `w must be a number` / `h must be a
  number` are line errors. Case flipped to an error golden
  (`365-size-nonnumeric-rejected`).

## D8 — `line at=` accepts a bare number without `%`

- Case: `370-line-basic` (line 5, `at=15`)
- Spec §2.6 and the engine's own error message state `at=<0..100>%`.
- Engine: the `%` is optional in the regex; `at=15` parses clean. A
  lenience, not a data corruption — but a second implementation that
  requires the `%` sign would fail this golden.
- **Resolved:** engine fixed — the `%` is mandatory; the message now
  reads `line needs at=<0..100>% (with the % sign)`. Case 370's input
  corrected to `at=15%`; new error case
  `374-line-at-percent-required`.

## D9 — `^^` accepted in the first data row (merges across the separator)

- Case: `505-table-rowspan-first-data-row`
- Spec §4.2: `||`/`^^` are "Illegal in the first column/row
  respectively (line error)", and merging follows
  markdown-it-multimd-table, which does not merge across the
  thead/tbody boundary.
- Engine: only `^^` in the first **header** row is rejected
  (`504-table-merge-position-errors`). In the first data row it parses
  clean and the merge target is a header cell on the other side of the
  `|---|` separator. At minimum a spec ambiguity ("first row" of what?);
  frozen as engine behavior.
- **Resolved:** engine fixed — `^^` in the first data row is a line
  error (rowspan does not cross the header separator; multimd prior
  art). Case flipped to an error golden.

## D10 — any leading backslash is stripped from a table cell

- Case: `506-table-cell-content` (cell `\x raw` → `x raw`)
- Spec §4.2 defines exactly two pipe-row escapes, `\|` and `\^^`, and
  says cell text is otherwise raw ("Comments are not recognized inside
  pipe rows (cell text is raw)").
- Engine: any cell whose trimmed text starts with a backslash loses
  that backslash, whatever follows it.
- **Resolved:** engine fixed — only `\|` (during segmentation) and
  `\^^` are escapes; any other leading backslash is literal cell text.
  Golden 506 regenerated (rewrite rule in MIGRATIONS 0.1-dev.11).

## D11 — unknown minor version rejected outright

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

## D12 — unknown option keys degrade to positional arguments

- Case: `111-lex-unknown-option-key`
- Spec §10 strict mode: "unknown keyword, **unknown option**, malformed
  line … → line error".
- Engine: the option-key set is global; a token with an unregistered
  key (`foo=bar`) is reclassified as a *positional argument*. On
  directives that reject extras (`node`, `group`, `class`, `flow`) it
  surfaces as `unexpected argument "foo=bar"` — wrong category, right
  outcome. On the D4 directives (`pin`, `size`, `layer`, block
  declarations, `cell`, classic `field`) it is **silently ignored**:
  `pin b at=1,2 foo=bar` parses clean (frozen in the golden by the
  absence of an error line for line 4).
- **Resolved:** engine fixed — an unregistered key is a uniform
  `unknown option "foo="` line error on every directive; inside wave
  `signal` lanes, bare tokens containing `=` remain positional (lane
  text) as before. Golden 111 regenerated; new case
  `603-wave-lane-eq-token` freezes the lane behavior.

## D13 — `size` percentage values lose their `%`

- Case: `366-size-percent`
- Spec §3: `size l3 w=120 h=60` — "explicit size (**px or %**)".
- Engine: `size a w=50%` is parsed with `parseFloat`, yielding `50`
  with the `%` discarded — `w=50%` and `w=50` (px) are
  indistinguishable in the semantic model. Percentage sizes are
  effectively unimplemented, silently.
- **Resolved:** spec §3 changed to px-only (percentage sizes are
  reserved for a future version) and the engine rejects `%` values
  with `percentage sizes are not in v0.1 — use px`. Case flipped to an
  error golden.

## D14 — color values are never validated

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
