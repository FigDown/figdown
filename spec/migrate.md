# Migrating FigDown documents to the freeze candidate

<!-- fence-check: migration-record -->

> **Downstream-facing guide.** The full chronological log remains
> [migrations.md](migrations.md). This page is the **one place to start**
> when upgrading a corpus that was written against mixed 0.1
> engines. Headers are almost always `figdown 0.1` with **no** dev.N
> marker — you cannot tell which intermediate version a file was authored
> for — so rewrites must be **detection-based and idempotent**.
>
> **What "the freeze" in the title does and does not promise.** *Frozen*
> names the **scope of the change-management promise**, not the absence of
> change: a frozen construct may still change, but only with a
> [migrations.md](migrations.md) entry, a named diagnostic, and a rewrite
> in the tool below. **0.x is a preview and is NOT stable**, and 0.1 → 1.0
> may itself require one more migration — that being the last time one may
> be required. Normative:
> [core.md §13](core.md#13-stability-and-versioning-normative).
>
> Detection-based and idempotent is also a *requirement*, not just a
> convenience: the tool MUST be **cumulative and idempotent across
> versions**, so a document from any earlier version reaches the current
> one in a single run (core §13.4).

## Tool

```
# dry-run (default): print mechanical fixes + human-attention reports
node tools/migrate-figdown.js path/to/corpus

# apply mechanical rewrites in place
node tools/migrate-figdown.js --write path/to/corpus

# also list experimental-genre headers (topology / flowchart / timing)
node tools/migrate-figdown.js --flag-experimental path/to/corpus
```

Exit code `1` means at least one **report** item remains (not only that
mechanical fixes were suggested).

## What the tool rewrites (mechanical, idempotent)

| Old spelling | New spelling |
|---|---|
| line-initial `render` | `layout` |
| line-initial `route` | *(no target — **WITHDRAWN**)* `route` was renamed `path` at 0.1, and `path` was withdrawn from the language at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`). The rewrite this row used to describe no longer has a destination; the line is **reported**, not rewritten — see below |
| line-initial `line` | `threshold` (one hop, not two: the pre-0.1 spelling lands directly on the CURRENT keyword) |
| line-initial `guide` | `threshold` |
| line-initial `colw` | `width` |
| line-initial `trunk` | `bundle` |
| option `color=` | `fill=` **or DELETED — you must say which** (see below) |
| option `text=` | DELETED (0.1 renamed it `color=`, and 0.1 retired that too — v0.1 has no label-colour key) |
| `kind=<known>` | `shape=<geom>` (see map in the script) |
| *(none — NON-MECHANICAL since 0.1)* | the legacy keyword `fill <pct>% in=` (band). It was a rewrite to `band …` — but 0.1 (`BAND-LABEL-STATUS`) gave `band` a MANDATORY quoted label written first, and this form has no label slot to carry over, so the rewrite's output has been a hard error ever since and was refused every time. It is now **reported** with the exact line to paste — see the report table |
| `via=x,y` / `via=x,y;x,y;…` | `via=(x,y)` / `via=(x,y),(x,y),…` |
| *(none — NON-MECHANICAL)* | the optional docks added on `path` at 0.1 as `src=`/`dst=`, renamed `tailport=`/`headport=` at 0.1 (`ENDPOINT-DOCKING-KEYS`): all four spellings, and the `path` line that hosted them, are **WITHDRAWN at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)**. No rewrite, because there is nothing to rewrite to — see below |
| option `w=` / `h=` | `width=` / `height=` (`SIZE-AND-DIRECTION-KEY-NAMING`) |
| option `dir=` (on `band`) | `extend=` (`SIZE-AND-DIRECTION-KEY-NAMING`) |
| option `note=` | `description=` (`DESCRIPTION-KEY-SPELLING` — IEEE 1685's spelling; the name `note` is reserved for the v0.2 DRAWN annotation keyword) |
| the `field` flag `optional` (or `conditional`) | `present=""` (`PRESENCE-CONDITION-EXPRESSION`). MECHANICAL only to the empty form; **lifting a condition out of the neighbouring `description=` is NOT mechanical** — see the report table |
| header genre `wave` and line-initial `wave` | `timing` (`TIMING-GENRE-NAMING`) |
| a `band` range written with a HYPHEN — `band "X" 15-35%` | `band "X" 15..35%` (`RANGE-SPELLING`). FigDown has ONE range grammar, `..`, single-sourced from Ada (ISO/IEC 8652) and Pascal (ISO 7185); between two numbers a hyphen reads as subtraction. `band` is EXPERIMENTAL, so nothing was promised — the rewrite is offered anyway because a mechanical one costs nothing |
| the `level=` token on a `chart` line | DELETED — the construct is gone and the value it carried has no other home, so the token is simply removed |
| *(none — NON-MECHANICAL)* | `shape=cloud` retired; reported, never rewritten — see below |
| *(none — NON-MECHANICAL)* | compact `field` item name with unquoted spaces; reported with the exact quoted line to paste — see below |
| a BARE typed-block label — `bitfield b Hdr`, `table t Caption`, `timing w Lane` | `bitfield b "Hdr"` (`RULE-POSITION-ENUMERATION`). RULE 2.1 always required a positional string to be quoted; three of the fifteen labelled positions never enforced it, while both genre documents already wrote the form quoted. Mechanical for a SINGLE-word bare label; a multi-word one is **reported** — see the report table |  <!-- fence-check: skip -->
| a QUOTED enum value — `shape="box"` `style="dashed"` `numbering="msb0"` `extend="up"` `type="bar3d"`, `figdown "0.1" block`, `figdown 0.1 "block"`, `flow "down"`, `cell 1 "highlight"` | the same value, BARE: `shape=box` (`RULE-POSITION-ENUMERATION`). RULE 2.4's enum half, enforced at last. Pure spelling: the value inside the quotes was already the value the engine used, so the model and the drawing are unchanged |
| ~~a QUOTED `plane=` on an `edge` — `edge a -> b plane="over"`~~ | **MOOT since 0.3 (`PAINT-ORDER-CONSTRUCT`).** The rewrite was `plane="over"` → `plane=over` (`RULE-POSITION-ENUMERATION`), `plane=` being an id position whose quoting check `edge`'s scanner lacked. **`plane=` has since been WITHDRAWN with the `plane` keyword**, so there is no unquoted form to reach: quoted or bare, the key is now REPORTED and the fix is deletion — see the report table |
| *(none — additive, OPTIONAL)* | the comma forms `rank a,b,c`, `width auto,90,25%`, `bundle … a--b,c--d`. The space forms are **not** deprecated; rewrite only where it improves the document, and never half-convert — mixing the two on one `rank` or `width` line is a line error |

Running twice is a no-op for these rules.

## `color=` — the one rewrite the tool refuses to choose (`COLOUR-KEY-STATUS`)

The same six characters meant two opposite things. In one era of the language
`color=` set the **interior**; in a later one it set the **label**
(MIGRATIONS 0.1). No program can tell the two source
files apart from the line alone — which is exactly why the key was retired:
while it was live, a document from the earlier era parsed and drew a legal,
WRONG figure in silence. Now every `color=` is a hard error.

**Do not try to date your corpus.** A `.fd` does not record which pre-release
wrote it, and downstream every one of them says `figdown 0.1` — so "which era
is this from?" is a question the file cannot answer. What the file *does*
record is what else it writes, and that is what separates the two eras:

| what else the file writes | what its `color=` was | the flag |
|---|---|---|
| `fill=` | the **label** colour. `fill=` did not exist while `color=` meant the fill, so the two never coexisted | `--color-means=text` — the key is DELETED, and the derived default (core §5) is normally what you wanted |
| any of `w=` `h=` `unit=` `via=` `dir=` `kind=` `layer=` `boundary` `wrap` `optional` — spellings already retired by the time `color=` meant the label | the **fill** | `--color-means=fill` — rewritten to `fill=` |
| **both** | nothing accounts for it: each rules out one reading, so both are out | none. Both flags are refused; rewrite those lines by hand |
| **neither** | **no evidence at all**, and the tool says so rather than guessing | decide from the figure, which is where the two readings differ: as a fill the value painted the box interior, as a label colour it painted only the text |

```bash
node tools/migrate-figdown.js --color-means=fill --write path/to/corpus
node tools/migrate-figdown.js --color-means=text --write path/to/corpus
```

Without a flag a bare `color=` is REPORTED, never rewritten — and the report
names the row of that table your file is in. Three refusals guard the flags,
because each flag is an assertion about the file and a wrong assertion writes
a wrong figure that reports success. Each refusal names the evidence it read:

- `--color-means=fill` **refuses** a file that also writes `fill=` — row 1.
  Re-run with `--color-means=text`.
- `--color-means=text` **refuses** a file carrying any of the older spellings
  — row 2. Re-run with `--color-means=fill`. (Migrating those spellings first
  is **not** the way out: the hold below stops the tool doing it, precisely
  because doing it is what destroys this refusal's evidence.)
- **Every rewrite is parsed before it lands.** A rewrite that introduces a
  line error is refused and reported, never written.

**And an unresolved `color=` holds the WHOLE file.** While
`color=` is present and unclassified, *nothing* in that file is rewritten —
everything is reported, including a `color-holds-file` line naming the rules
that were withheld. The reason is that the two `--color-means` refusals above read **evidence
inside the file**, and the other rewrites delete it: migrate `boundary` →
`external` first and `--color-means=text` has nothing left to refuse, so it
deletes a `color=` that was a FILL and reports success. Settle the colour
question first — with a flag, or by hand — and everything else migrates in the
same pass.

If the colour carried MEANING, core §5 / `PRESENTATION-AS-MEANING-CARRIER` already required that meaning to
appear in text: put it in the label or in a `class` meaning. There is no
colour key to move it to, and there will not be one in v0.1 (core §9
`ANNOTATION-LOCATOR-SPLIT` — an edge carries three labels, so every owner-level key is the wrong
shape).

## `class` on an edge — add `stroke=`

An `edge` has no interior, so on it `fill=` and `stroke=` name the SAME
channel. A class an edge joins must not declare `fill=` with no `stroke=`:
that is a line error naming `stroke=`, and a `style=` beside the `fill=` does
not answer it. If the edge was drawing the default line colour, `stroke=#555`
reproduces it exactly. This is the single largest item in a downstream pass:
**549 `edge … class=` sites** reference a class carrying a colour and no
`stroke=`.

> **Correction, 0.4 (`CLASS-CHANNEL-REACH`).** From 0.1 to 0.4 this
> section also required a class an edge joins to declare paint AT ALL, on
> `CLASS-PAINT-REQUIREMENT`'s second half. That half is **RETIRED**: a class that claims a
> meaning and declares no paint is legal on every member, so
> `class p "Path"` joined by `edge a -> b class=p` needs **no** migration
> and never did — the migration tool only ever rewrote the `fill=` case, so
> a corpus run against it is already correct. Nothing to undo; if a
> downstream pass added `stroke=` by hand to a paint-less class, the added
> key is now a choice about the drawing rather than a fix.
> [MIGRATIONS](migrations.md) 0.4; [core.md §2.7](core.md).

## What the tool only reports (never invents)

| Signal | Why a human is required |
|---|---|
| `bitfield` without `numbering=` | Direction is meaning (msb0 vs lsb0); no safe default |
| `node` / `edge` / … under pure `bitfield` / `table` / `timing` | **`GENRE-KEYWORD-ALLOWLIST`** allowlist — rewrite as multi-section `MULTI-FIGURE-DOCUMENTS` or a scene host |
| more than one `*` field in one bitfield | Max one `*` per block |
| unknown `kind=` value | No shape mapping |
| `shape=cloud` (or `kind=cloud`) | **Retired 0.1 (`SHAPE-ENUM-VOCABULARY`).** NON-MECHANICAL: `shape=ellipse` keeps the drawing, but the shape was carrying the meaning — move it into the label (+ a `class`), or use a `group` if elements sit inside. A callout that borrowed the cloud has no v0.1 replacement (core §9 `NON-GRAPH-ANNOTATION-NODE`) |
| `band` line with no quoted label | **0.1.** The label is now MANDATORY and written FIRST (`band "Headroom" 15..35% in=pool`), and only the author has the region's name — that is the entire point of the change. Until then a band had no label slot at all, so once a reader discarded `fill=` as presentation it asserted nothing at all. The tool reports every unlabelled `band` line and refuses to invent a name |
| the legacy band keyword `fill <pct>% in=` | **0.1 (`BAND-LABEL-STATUS`), report-only from 0.1.** Renaming `fill` to `band` is the whole of the mechanical part, and it is not enough: `band` gained its MANDATORY quoted label in the same release, and this form never had a label to carry over. The rewrite therefore emitted a document the engine rejects, and the parse-before-write refusal above threw it away every time — so the tool announced a fix and wrote nothing. It now reports, printing the exact line to paste with the name left blank |
| compact `field` item name containing spaces, unquoted | **0.1 (`POSITIONAL-LIST-SPELLING`).** `field "Long Name":16` preserves the parsed name exactly, but a name containing a COMMA has no compact spelling at all (it must move to the classic form), and `field Total Length 16` — the classic spelling with the same defect — is one token away. Which form was meant is the author's call; the report prints the quoted line to paste |
| a `field` that WAS `optional` and carries prose beside it | **0.1 (`PRESENCE-CONDITION-EXPRESSION`).** The flag is rewritten to `present=""` mechanically. Lifting a CONDITION out of the neighbouring `description=` into `present="…"` is NON-MECHANICAL: most descriptions are not conditions, and inventing one is worse than leaving `present=""`, which says exactly what the bare flag said. The report prints the prose quoted |
| `cell (r,c) … highlight`, or a row `highlight` plus a fill-bearing cell mark on that row | **0.1 (`ROW-HIGHLIGHT-CELL-FILL-COLLISION`).** A row tint and a cell fill are one channel and both are now line errors. Which of the two the author meant is not derivable — tint the row, or paint the cell, or move the cell's distinction to `stroke=` (a different channel, still legal) |
| a `path` or `routing` line, and every spelling that resolved to one (`route`, `via=`, `src=`, `dst=`, `points=`, `tailport=`, `headport=`, `routing=`) | **WITHDRAWN 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`).** The first withdrawal in this project, and the first entry in this table with **no replacement spelling at all** — every other retirement here is a rename with a destination. The correct fix is to **DELETE the line**, and deleting it **changes the rendered output**: the edge falls back to auto layout. A tool must not change output silently, so the tool reports and a human decides. Shape the result with `rank`, `flow`, declaration order and `pin` instead. Why the constructs went, with the prior-art evidence: MIGRATIONS 0.1, core §9 `EDGE-IDENTITY-AND-GEOMETRY` |
| a hand-enumerated repeated element (`field "Segment List[0]" 128` … `field "Segment List[n]" 128`) | **0.1 (`BITFIELD-REPETITION-CONSTRUCT`), and the tool does not even report this one.** `index=` can now say it — one element plus a range, `field "Segment List" 128 index="0..Last Entry"` — but only the author knows whether two similar fields are two elements of ONE run or two different fields, and the rewrite changes the drawing. Nothing was invalidated: the old spelling still parses and still means what it meant. `examples/srh.fd` shows the shape |
| a BARE **multi-word** typed-block label — `table t My Caption` | **0.1 (`RULE-POSITION-ENUMERATION`).** `"My Caption"` and `"My"` plus a surplus argument are two readings of the same line and only the author knows which. Single-word labels are rewritten mechanically; this one is printed for you to quote |  <!-- fence-check: skip -->
| `index=` whose prose end contains a bare lowercase `step` — `index="0..7 step 2"` | **0.1 (`RULE-POSITION-ENUMERATION`).** `step` is RESERVED inside an `index=` range so that shipping the stepped range in v0.2 cannot change what a document already written means (core §9 `INDEX-RANGE-STEP`). The tool cannot tell prose that happens to read like a step clause from an author who meant "every other element" — which is the entire reason the spelling was reserved — so it reports both fixes: respell the prose (`"0..7 stepping by 2"`, `"0..7 in steps of 2"`), or, if you meant a stepped range, write the run you can state and put the rest in `description=`. Only the exact lowercase token is caught: `"0..7 Step 2"` and `"0..7 in steps of 2"` stay legal |
| a `plane` or `layer` line, and every spelling that resolved to one (`plane=`, `layer=`, `z=`, `z-index=`) | **WITHDRAWN 0.3 (`PAINT-ORDER-CONSTRUCT`).** The second withdrawal with no replacement spelling, and the same shape as `path`/`routing` above. **DELETE the line and every `plane=` that referenced it.** Paint order is document order — a later line paints on top — so the drawing is unchanged unless the planes were written out of document order; check the result. If the layer was a claim about the SUBJECT (an overlay, a control plane), that meaning belongs in a `class=` whose LABEL states it (core §5, `PRESENTATION-AS-MEANING-CARRIER`), which is what the corpus was already doing alongside the keyword: stripping `plane` from `examples/evpn-fabric.fd` left the drawn markup byte-identical but for one `data-edge` index. The `layer` → `plane` and `z=` → `z-index=` rewrites (0.1 `PLANE-KEYWORD-SPELLING`, 0.1 `Z-ORDER-KEY-NAMING`) are **report-only from 0.3** for the same reason `route` is: their target no longer exists, and a rewrite whose output does not parse is worse than none. Why the construct went: MIGRATIONS 0.3 |
| a line whose keyword this section's GENRE no longer declares — `threshold`/`band` under `topology`, `group`/`threshold`/`band`/`bundle` under `flowchart`, any of the six under `statechart`, `bundle` under `block` | **WITHDRAWN per genre at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`).** Subject vocabulary is per genre: a spelling accepted by several genres is several independent declarations, and these genres withdrew their own. The word is usually not gone from the language, only from that genre, so the fix is a **decision about the figure** — change the section header, or move the line into a section whose genre declares the word (`block` for `threshold`/`band`, `topology` for `bundle`) — which no tool may make unattended. The engine's message names the genre that still declares the word and the ground for the withdrawal. Every affected genre or keyword was EXPERIMENTAL, so nothing was owed: MIGRATIONS 0.3 |
| (with `--flag-experimental`) `topology` / `flowchart` / `timing` headers | Experimental genres: **do not bulk-rewrite** their domain vocabulary yet — it will move again |

## Recommended split for large corpora

1. **Main standard now:** files that are (or can be) `block` / `bitfield` /
   `table` — run `--write`, fix reports, prefer multi-section hybrids
   (`figdown 0.1 block` … then `figdown 0.1 table`).
2. **Experimental later:** `topology` / `flowchart` / `timing` — list with
   `--flag-experimental`, leave vocabulary alone until those genres
   converge; only apply the mechanical spelling table above if needed.

## Related

- Chronological rules: [migrations.md](migrations.md)
- The version scheme and what it promises: [core.md §13](core.md#13-stability-and-versioning-normative)
- How this tool is tested: [../tools/migrate-fixtures/README.md](../tools/migrate-fixtures/README.md)
  (`node tools/migrate-check.js` — it reports its own fixture count on every
  run, so none is written down here; idempotence is asserted on every one, and
  negative fixtures go red if a retired rewrite direction returns)
- Core framework: [core.md](core.md)
- Genre docs: [genres/README.md](genres/README.md)
- Authoring hybrid panels: [../guide/authoring.md](../guide/authoring.md)
