# Error-message fixture coverage (audit)

> Approximate: static `err(n,'…')` literals in `editor/figdown.html` vs
> the `*.errors.txt` goldens in `cases/` + `experimental/`.

> **What this audit is now measuring the distance to.**
> `spec/core.md` §8.2 states the position normatively: **the `.errors.txt`
> goldens ARE the normative error catalogue, and §8 is not exhaustive.**
> The corollary is that for a rejection case no fixture covers, a second
> implementation has no way to learn the required message text — so the
> number this file computes is not housekeeping, it is **the size of the
> hole in the standard**. A fixture per `err()` site would make the
> catalogue complete by construction and is the cheaper of the two routes
> §8.2 names. Note the heuristic below counts only the ~61 STATIC
> literals; the engine has roughly 195 `err()` sites in total, and the
> interpolated majority is not measured by anything here.

**The counts are not written down here.** They were, and they were stale by
18 error lines and one file when checked — the prose said
*340 lines across 121 files* against an actual *358 across 122*. A number
that nothing recomputes drifts every time a fixture lands, so the numbers
were replaced with the command that derives them. Run it from the
repository root:

```sh
node -e '
const fs=require("fs");
const h=fs.readFileSync("editor/figdown.html","utf8");
const re=/err\(\s*[^,]+\s*,\s*(["\x27])((?:\\.|(?!\1).)*)\1\s*\)/g;
let m, sites=[]; while((m=re.exec(h))) sites.push(m[2]);
const distinct=[...new Set(sites)];
let gold="", files=0, lines=0;
for (const d of ["cases","experimental"])
  for (const f of fs.readdirSync("conformance/"+d).filter(x=>x.endsWith(".errors.txt"))) {
    const t=fs.readFileSync("conformance/"+d+"/"+f,"utf8");
    gold+=t; files++; lines+=t.split("\n").filter(l=>l.trim()).length;
  }
const un=distinct.filter(x=>!gold.includes(x.replace(/\\(.)/g,"$1")));
console.log("static err() literals: "+distinct.length+" distinct ("+sites.length+" call sites)");
console.log("fixture error lines:   "+lines+" across "+files+" files");
console.log("uncovered literals:    "+un.length);
un.forEach(x=>console.log("   "+x));'
```

The heuristic is the one this audit has always used, now stated as code
rather than as prose: `err(<expr>, '<literal>')` call sites whose message
is a single quoted string with no concatenation or interpolation, matched
against the concatenated goldens. It is approximate in one known direction
— stem matching can miss messages containing special characters — so treat
a nonzero "uncovered" as a list to read, not a failure. As of 0.1 it
reports exactly one, the residual item below.

## Uncovered / residual

- `duplicate version header` — **effectively dead after multi-section `MULTI-FIGURE-DOCUMENTS`**
  (a second `figdown` opens a new section; it is no longer a line error).
  Keep the engine branch for single-section parseOne safety; no fixture needed.

The audit heuristic previously listed edge form messages that **are** covered
by `907-errors-edge-form` (stem matching can miss special characters).

## Recent fixtures (906–916)

- `906-errors-needs-id` — class/group/node/external/bitfield/table/timing/bundle/plane needs an id
- `907-errors-edge-form` — edge operator/form. Named
  `907-errors-edge-and-path-form` until this release, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew the
  `path` directive and its three form errors went with it. The edge half is
  the subject and is unchanged
- `908-errors-table-structure` — pipe/delimiter-row/width/cell
- `909-errors-band-chart-bundle` — band range, bundle members, chart id,
  and the DELETED `chart level=` (the `plot` keyword became `chart`; `level=` became a deletion diagnostic, `CHART-LEVEL-KEY`)
- `910-errors-retired-shape-cloud` — the retired shape VALUE `shape=cloud`
  (`SHAPE-ENUM-VOCABULARY`), and that its named diagnostic beats the generic
  `unknown shape` message (whose enum text is now six values)
- `911-errors-retired-option-keys` — the three option KEYS retired
  language-wide (`w=`, `h=`, `dir=`, `SIZE-AND-DIRECTION-KEY-NAMING`). Unlike `color=`,
  which stayed registered per directive, these left the language, so the
  named message fires wherever the key appears — including on `edge`,
  which has its own scanner and needed its own copy of the check
- `912-retired-plot-keyword` — `plot` → `chart`, plus the retired `kind=`
  key that shipped with it (`CHART-BLOCK-NAMING`)
- `913-withdrawn-edge-geometry-keys` — **rewritten and moved into `cases/`
  (`EDGE-GEOMETRY-CONSTRUCTS`)**, from `experimental/913-retired-path-option-keys`.
  All SEVEN spellings of the withdrawn edge-geometry option-key family in one
  fixture: the four that were live until this release (`points=`, `tailport=`,
  `headport=`, `routing=`) and the three renamed INTO them
  (`via=`, `src=`, `dst=`, `WAYPOINT-KEY-SPELLING`/`ENDPOINT-DOCKING-KEYS`), whose messages now state the whole
  two-hop chain and end in the withdrawal. These messages are the FIRST in the
  language that name no replacement spelling, because there is none — the
  constructs were removed, not renamed. The host is a plain `node`: the
  directive that used to accept these keys is gone, so they have no acceptor
  at all. Normative, because §10 classifies a retired registration
  NORMATIVE (diagnostic) and nothing experimental is left in the fixture
- `914-retired-guide-keyword` — **new (`THRESHOLD-KEYWORD-SPELLING`)**: the
  `guide` → `threshold` rename diagnostic, plus the two-hop
  `line` → `threshold` (the pre-0.1 spelling now lands on the
  CURRENT keyword, so a stale document costs one lookup, not two).
  Tagged EXPERIMENTAL in `STATUS.txt` — it WRITES `guide` at line start,
  which makes it a dedicated test of a demoted construct
- `915-retired-chart-level` — **new (`CHART-LEVEL-KEY`)**: `level=` was
  DELETED, not renamed, and stays REGISTERED as retired so the deletion
  gets a named message instead of the generic `unknown option "level="`.
  Tagged EXPERIMENTAL (`chart` is outside the surface, §4.4)
- `916-retired-wave-genre` — **new (`TIMING-GENRE-NAMING`)**: the EXPERIMENTAL
  genre `wave` was renamed `timing` in BOTH positions it can appear — the
  header genre token (`figdown 0.1 wave`) and the block opener  <!-- fence-check: skip -->
  (`wave w "W"`) — and both fire the same named message. Tagged  <!-- fence-check: skip -->
  EXPERIMENTAL (`genre=timing`): it is a dedicated test of the retired
  spelling of an experimental genre

### Diagnostics added or changed (`RULE-POSITION-ENUMERATION`, `VERBATIM-REGION-SCOPE`)

| message (leading text) | pinned by |
|---|---|
| `this position takes a BARE value: write <bare spelling> — quoting a value drawn from a closed set suggests the position accepts arbitrary text …` — RULE 2.4's ENUM half, ONE wording at all nine positions | `126-enum-bare-header` (the `figdown` version and genre), `127-enum-bare` (`flow`, `shape=`, `style=`, `numbering=`, `cell … highlight`), `263-edge-option-quoting` (`style=` on an edge, which has its own scanner), `265-enum-bare-experimental` (`extend=` on a `band`, `type=` on a `chart`) |
| `<bitfield\|table\|timing> label must be quoted: <kw> <id> "<label>" — whitespace also separates positionals …` — RULE 2.1 completed at the three typed-block openers | `125-typed-block-label-quotes` |
| `"step" is RESERVED inside an index= range and has no meaning in v0.1 …` | `422-bitfield-index-step-reserved`; the near-misses the trigger deliberately does NOT catch are a MODEL golden, `423-bitfield-index-step-prose` |
| `ids are bare and match [A-Za-z_][A-Za-z0-9_-]* …` on an `edge`'s `plane=` — the shared id wording reaching the last position that lacked it | `264-edge-plane-quoted-id` |
| *(a REMOVED diagnostic)* `unterminated [label]` no longer fires for a `#` inside a bracket label (`VERBATIM-REGION-SCOPE`) | `254-edge-label-errors` lost that line; `262-edge-bracket-hash` pins the model it now produces |

**Note on ordering, because it is observable.** The enum check runs BEFORE the
value check and suppresses it for that token — **one token, one error** — so
`shape="bkx"` reports the spelling ONCE rather than the spelling and
`unknown shape` on one line, and `figdown 0.1 "blok"` reports the spelling
rather than the spelling and `unknown genre`. This is the convention `idErr`
has followed at every id position. The `figdown` header
reported BOTH until this release and was brought into line in the same release,
so all four enum sites now agree.

### Diagnostics added or changed

| message (leading text) | pinned by |
|---|---|
| `the field flag "optional" has been retired and replaced by an option key that carries the CONDITION: write present="<the condition>" …` | `476-bitfield-presence-flags-retired` |
| `the field flag "conditional" has been retired: write present="<the condition>" …` — rewritten at 0.1 to point at `present=` rather than `optional`, its own short-lived 0.1…0.1 replacement | `476-bitfield-presence-flags-retired` |
| `note= has been renamed: use description= (IEEE 1685-2022 spells this channel description; …)` | `479-bitfield-note-retired` |
| `wave has been renamed: use timing (in WaveJSON signal is the root object and wave is a PROPERTY of one signal …)` | `916-retired-wave-genre` (both the header-genre and block-opener call sites) |
| `highlight is a ROW mark and takes the single-valued row form (cell <row> highlight) — on a cell address it was SILENTLY DISCARDED …` | `520-table-highlight-fill-collision` (line 18: `highlight` written on a two-part cell address) |
| `cell (<r>,<c>) resolves to a fill on row <r>, which is highlighted — the cell fill overrides the row tint …` | `520-table-highlight-fill-collision` (lines 23/25: a row `highlight` plus a same-row cell `fill=`/fill-bearing `class=`) |

These close the two `cell`/`highlight` defects `STYLE-KEY-SCOPE` filed as an HONEST
NEGATIVE (both reproduced, neither fixed, in the same release that removed
`style=` from `field`/`cell`/`signal`) — `ROW-HIGHLIGHT-CELL-FILL-COLLISION` picks the "named line error,
never a precedence rule" answer, matching `color=`'s own precedent rather
than reintroducing a precedence rule into the exact spot `STYLE-KEY-SCOPE` had just
removed one from. `stroke=`-only cell marks on a highlighted row are
unaffected: `304-presentation-on-every-element` / `305-presentation-carve-outs`
still show `cell … stroke=` legal beside a row `highlight`, since `stroke=`
and a row tint paint different channels.

Positive coverage: `419-bitfield-present-tristate` freezes all three states
of `present=` (absent, `present=""`, `present="<condition>"`) in the model,
including on the compact `field` form where the option is LINE-wide.
`476-bitfield-conditional-reverted` was renamed
`476-bitfield-presence-flags-retired` in the same release — its subject
widened from the single `conditional` retirement to both retired spellings.

### Diagnostics added

| message (leading text) | pinned by |
|---|---|
| `index= takes a range written <first>..<last> — one ".." separator, and both ends present: …` (no `..`, more than one, or an empty end) | `421-bitfield-index-errors` (lines 5, 6, 9) |
| `index= needs a LITERAL first index: … Only the LAST index may be prose …` | `421-bitfield-index-errors` (line 7) |
| `index=3..3 is a range of ONE element, which is not repetition …` | `421-bitfield-index-errors` (line 8) |
| `index= does not apply to a * field: …` | `421-bitfield-index-errors` (line 11) |
| `index= is not available on the compact field form — …` | `421-bitfield-index-errors` (line 12) |
| `the hyphen range "<a>-<b>%" is no longer the spelling: write band … <a>..<b>% …` (`RANGE-SPELLING`) | `373-band-errors` (line 12) |

`duplicate option "index=" on one line` is the existing duplicate-key
invariant and is pinned by the same fixture (line 10) rather than by a new
message.

Positive coverage: `420-bitfield-index-tristate` freezes all of `index=`'s
states in the model — absent, `index=""` (`{}`), a literal range, a
DESCENDING literal range, the same range written with redundant quotes, a
prose last index, and whitespace around the `..`. The quoted and unquoted
literal rows are the pin on the normative rule that **determinacy is decided
by parsing both ends, never by quoting**: both project to the identical
`{"first":0,"last":7}`.

### Diagnostics added or changed

| message (leading text) | pinned by |
|---|---|
| `guide has been renamed: use threshold (…)` | `914-retired-guide-keyword` |
| `line has been renamed: use threshold (…)` — text rewritten: `line` now lands on `threshold` in one hop, and says that its 0.1 replacement `guide` was itself retired | `914-retired-guide-keyword`, `904-errors-retired-keywords` |
| `level= has been DELETED, not renamed: … — delete the key` | `915-retired-chart-level`, `909-errors-band-chart-bundle` |
| `band needs a quoted "<label>" first: band "<name>" <a>..<b>% in=<node-or-group-id> (…)` | `373-band-errors` (line 10) |
| `band needs a range with the % sign: band "<label>" <pct>% or band "<label>" <a>..<b>%` — usage text now shows the label | `909-errors-band-chart-bundle` |
| `from=/to= retired — write the range positionally: band "<label>" 15% or band "<label>" 15..35%` — usage text now shows the label | `373-band-errors` |
| `threshold needs a quoted "<label>" first` / `threshold needs in=<node-or-group-id>` / `threshold needs offset=<0..100>% (with the % sign)` / `unknown target "<id>" for threshold` — keyword renamed in all four | `371-threshold-errors`, `374-threshold-percent-required`, `376-threshold-offset` |

**Removed:** `band` no longer refuses `color=` — `BAND-LABEL-STATUS` gave
it a label, hence a text channel, so the §5 carve-out row is gone.
`305-presentation-carve-outs` dropped its `band … color=` line and now
emits **12** error lines instead of 13.

Other fixtures added, outside the 9xx error family:

- `115-lex-option-before-label` — option BEFORE the label on all six
  label-bearing directives (`OPTION-POSITION-PARSING`)
- `352-rank-comma-form` / `353-rank-space-form-retired` — the comma form,
  and the retirement of the space form
- `416-bitfield-compact-options` / `417-bitfield-compact-unquoted-space` —
  options on the compact `field` form, and the quoting requirement
- `518-table-width-comma-form` / `519-table-width-space-form-retired`
