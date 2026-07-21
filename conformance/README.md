# FigDown v0.1 parser-conformance suite

Golden fixtures that pin down the **semantic model** of FigDown v0.1 as
defined by [spec/syntax-draft.md](../spec/syntax-draft.md). The suite is
the credibility foundation for freezing v0.1: a second implementation
can be written against the spec and tested against these fixtures
**without ever reading the reference engine** — the spec's own
requirement that the grammar "MUST be mechanically implementable without
consulting the reference PoC" (§11), made checkable.

## Conformance tiers (spec §3)

The spec defines a tiered determinism/conformance rule; the suite maps
onto it like this:

| spec §3 tier | requirement | how this suite tests it |
|---|---|---|
| parser | "a conforming parser MUST produce the **same semantic model** for the same source" | `cases/*.model.json` goldens — the canonical model projection (below), byte-compared |
| parser (error side) | closed grammar: malformed input → `Line N: message`, all errors in one pass, no partial output (§8, §10 strict) | `cases/*.errors.txt` goldens — sorted error lines, byte-compared |
| renderer, same version | "same source + same renderer version → byte-identical SVG" | run.js self-check: every valid case is parsed+rendered **twice** and the SVG bytes compared. No SVG goldens exist — by spec, SVG bytes are renderer-version-specific |
| renderer, cross-implementation | "different renderers SHOULD be visually equivalent (byte-identical output … NOT required)" | **not tested** — out of scope until a Canonical SVG Rendering Profile exists |

A second implementation therefore conforms at the parser tier when, for
every case, it (a) accepts/rejects exactly as the fixtures do, (b)
reports the same error lines for rejected cases, and (c) produces the
same canonical model for accepted cases.

## Layout

```
conformance/
  run.js               the runner (Node, no dependencies)
  normalize.js         doc → canonical semantic model projection
  cases/
    NNN-name.fd            input document (UTF-8, exact bytes matter)
    NNN-name.model.json    golden: canonical model  (valid cases)
    NNN-name.errors.txt    golden: sorted error lines (error cases)
  DISCREPANCIES.md     audited engine-vs-spec conflicts frozen in the goldens
```

Every case has **exactly one** golden — `.model.json` if it parses
clean, `.errors.txt` if it does not. Case numbering groups by area:
`01x` header, `1xx` lexical, `2xx` node/group, `25x` edge, `3xx`
class/layer/layout, `36x` pin/size, `37x` line/fill, `38x`
routing/route, `39x` bundle, `4xx` bitfield, `5xx` table, `6xx` wave,
`7xx` plot (experimental), `9xx` cross-cutting errors. Each case isolates one behavior (error
cases may carry several lines of the *same* behavior family, since the
parser reports all errors in one pass).

## Fixture formats

**`NNN-name.errors.txt`** — the parser's error lines, one per line,
**sorted lexically**, trailing newline. Sorting makes the golden
independent of internal error-emission order (some checks run per-line,
some in a post-pass); the `Line N:` prefixes still carry the positions.

**`NNN-name.model.json`** — `JSON.stringify(model, null, 2)` + trailing
newline of the canonical model. The full shape (top-level key order,
per-element key order, which attributes are omitted when absent) is
documented normatively in the header comment of
[normalize.js](normalize.js). Highlights:

- Keys appear in a fixed order; arrays are in document order.
- Only spec-defined semantics appear — no engine internals.
- Absent optional attributes are **omitted**, never `null`. No golden
  contains a `null` (non-numeric `z`/`w`/`h` are line errors since
  0.1-dev.11 — DISCREPANCIES D6/D7, resolved); a `null` appearing in a
  regenerated golden would signal a new engine NaN defect.
- Every element carries its 1-based source `line` where the engine
  records one (layers and wave signals do not).
- `header.version` is the constant `"0.1"` (the engine accepts exactly
  that version).
- Known caveat: `fill` color includes the engine's default
  (`#e5e7eb`) when the author wrote none — the engine does not preserve
  the distinction, so the projection cannot either.
- `plot` blocks appear in the model but are **experimental** (spec
  §4.4): not part of the v0.1 conformance surface; a second
  implementation MAY skip `7xx` cases.

### Defaults in the model

So a second implementer never has to reverse-engineer this from golden
diffs (the same list lives in normalize.js):

**Materialized** (the engine resolves these defaults, so they always
appear in the model):

- `flow` = `"right"` when no `flow` line is written
- `node.shape` = `"box"`
- `node.layer` / `edge.layer` = `"base"`
- label := id when a `node`/`group`/`bitfield`/`table`/`wave` omits its
  label
- the implicit base layer `{id:"base", z:0}` is always `layers[0]`
- `fill.dir` = `"up"`, `fill.color` = `"#e5e7eb"` (engine default)
- `bitfield.unit` = `32`, `bitfield.numbering` = `"lsb0"`
- `layer.z` = declaration index (1, 2, …) when `z=` is omitted

**Omitted when absent** (never `null`): `header.template`, `title`,
`color`/`stroke`/`text`/`style`/`class` on nodes/groups/edges/classes,
`group.gap`, edge `tail`/`mid`/`head`, `size.w`/`size.h` (either may be
absent), guide-line `color`, field `optional`/`color`/`class`/`note`,
table `colw`/`marks`/`highlights`, wave signal `labels`, wave `gaps`,
plot `level`. Also (0.1-dev.13, additive): top-level `routing` appears
only when the document writes an explicit `routing` line, and the
top-level `routes` array is omitted entirely when there are no `route`
lines — so every pre-dev.13 golden stayed byte-identical.

Empty top-level collections stay as `[]` — the document shape is fixed
(`routes` is the one omit-when-empty exception above).
In `aligns`, a column with no explicit `:` alignment is `"none"`.

## Running

```sh
node conformance/run.js                 # run everything
node conformance/run.js 4xx            # substring filter, e.g. only 4xx-*
node conformance/run.js table          # ... or by name fragment
node conformance/run.js --update       # rewrite goldens (see policy below)
```

Exit code 0 = all pass; 1 = any failure. The reference engine is located
the same way `tools/build-svg.js` does: `$FIGDOWN_HTML`, a co-located
`figdown.html`, then `../editor/figdown.html`.

## How a second implementation consumes the fixtures

The fixtures are plain files; no code here needs to run against the
second implementation. The recipe:

1. For each `cases/NNN-name.fd`, parse the exact bytes with your
   implementation.
2. If `NNN-name.errors.txt` exists: your parser must reject the
   document; sort your `Line N: message` strings and byte-compare.
   (If exact message texts are too strict for you at first, compare the
   `Line N` prefixes — but message-identical is the goal, since the
   AI write→validate→fix loop consumes the messages.)
3. If `NNN-name.model.json` exists: project your parse result into the
   canonical model per the normalize.js documentation, serialize with
   2-space-indent JSON + trailing newline, byte-compare.
4. Read DISCREPANCIES.md first: the goldens freeze the **reference
   engine's** behavior, including its audited deviations from the spec
   text. Where a golden and the spec conflict, the conflict is listed
   there — match the golden to pass the suite, and track the item for
   the spec/engine resolution.

## Update policy

Goldens are frozen artifacts. `--update` exists for exactly two events:

1. **A spec change** — the change ships a `spec/MIGRATIONS.md` entry;
   regenerate the affected goldens in the same commit and reference the
   migration id.
2. **Resolving a DISCREPANCIES.md item** — the engine (or spec) is
   fixed; regenerate the affected goldens, delete the item from
   DISCREPANCIES.md, and say so in the commit message.

A golden diff with neither a migration entry nor a discrepancy
resolution is a red flag in review — it means behavior drifted
silently, which is the exact failure mode this suite exists to prevent.
New cases (no behavior change, just coverage) may be added freely.
