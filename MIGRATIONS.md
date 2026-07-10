# FigDown Migration Log

> Policy (R31): the spec versions like a **database schema** — before
> convergence it changes often, so every semantic change ships with a
> migration entry containing a **mechanical rewrite rule**. Upgrading a
> document from vA to vZ = applying every entry between them, in order.
> A v1 document MUST convert correctly to v5 by following
> v1→v2→v3→v4→v5.
>
> 繁體中文版：[MIGRATIONS.zh-tw.md](MIGRATIONS.zh-tw.md)

## Entry format

```
## <from> → <to>  (<date>, <decision ref>)
Change:  what changed, semantically
Rule:    the mechanical rewrite (regex/algorithm); mark NON-MECHANICAL
         steps explicitly if any
Example: before → after
```

During the v0.1 draft period, versions are dated dev increments
(`0.1-dev.N`); they will be squashed into `0.1` at freeze, and this log
restarts from there.

---

## 0.1-dev.0 → 0.1-dev.1  (2026-07-02, D4)
Change:  `pin at=` semantics moved from canvas *fractions* (0–1) to
         absolute canvas **px**; group members later became group-local
         (D6).
Rule:    NON-MECHANICAL (requires one render of the old document to
         know the canvas size): `at=fx,fy` → `at=round(fx*W),round(fy*H)`.
Example: `pin mon at=1.0,0.0` → `pin mon at=340,0`

## 0.1-dev.1 → 0.1-dev.2  (2026-07-02, D5)
Change:  table content switched from keyword rows to **verbatim GFM
         pipe rows**; spans follow markdown-it-multimd-table.
Rule:    `cols A B C` → `| A | B | C |` + a `|---|---|---|` separator
         row; `row a b c` → `| a | b | c |`; `row ... highlight` →
         move to `cell <r> highlight`; span markers `^`→`^^` (cell
         alone), `<`→`||` (empty segment).
Example: `row 0 "From CPU"` → `| 0 | From CPU |`

## 0.1-dev.2 → 0.1-dev.3  (2026-07-02, D7)
Change:  node `kind=` (domain nouns) → `shape=` (pure geometry).
Rule:    mapping: decision→diamond · terminator→rounded ·
         datastore→cylinder · switch→rounded · router→rounded ·
         process→(delete) · host→(delete) · port→(delete) ·
         cloud→cloud. Then `s/kind=/shape=/`.
Example: `node q "CRC ok?" kind=decision` → `node q "CRC ok?" shape=diamond`

## 0.1-dev.3 → 0.1-dev.4  (2026-07-02, D7)
Change:  `trunk` renamed **`bundle`** (neutral umbrella term).
Rule:    `s/^trunk /bundle /` (line-initial keyword only).
Example: `trunk es1 "LAG" a--s, b--s` → `bundle es1 "LAG" a--s, b--s`

## 0.1-dev.4 → 0.1-dev.5  (2026-07-03, R29)
Change:  `line` became a pure marker; zones moved to the separate
         `fill` directive (decoupled; per-group or per-node).
Rule:    `line "<L>" in=<g> at=<p>% fill=below color=<c>` →
         `line "<L>" in=<g> at=<p>%` **plus** `fill in=<g> from=0% to=<p>% color=<c>`
         (fill=above analogous: from=<p>% to=100%).
Example: see rule.

## 0.1-dev.5 → 0.1-dev.6  (2026-07-03, R30)
Change:  `fill` range became positional.
Rule:    `fill in=<t> from=0% to=<b>%` → `fill <b>% in=<t>`;
         `fill in=<t> from=<a>% to=<b>%` (a>0) → `fill <a>-<b>% in=<t>`.
Example: `fill in=pool from=0% to=15%` → `fill 15% in=pool`

## 0.1-dev.6 → 0.1-dev.7  (2026-07-10, review A-4/F-2)
Change:  table cell addressing — row `0` (bottom header tier) retired;
         header tiers now address as `h1..hN` **top-down**. Data-row
         addressing (1-based below the separator) is unchanged.
Rule:    with N = the table's header-tier count:
         `cell 0,<c> …` → `cell hN,<c> …` (0 was the *bottom* tier);
         other header tiers were previously unaddressable — no other
         rewrites exist.
Example: (two-tier header) `cell 0,1 color=#eee` → `cell h2,1 color=#eee`

## 0.1-dev.7 → 0.1-dev.8  (2026-07-10, review B-3)
Change:  `zone` (layout-tier hint, accepted but never acted on) removed
         from the language; the keyword is no longer registered.
Rule:    delete every line matching `^\s*zone\b`. No semantic loss —
         the directive had no defined rendering.
Example: `zone left ingress` → (line deleted)
