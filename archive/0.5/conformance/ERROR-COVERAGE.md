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

## Recent fixtures (906–918)

- `906-errors-needs-id` — class/group/node/external/bitfield/table/timing/bundle
  needs an id. TWO sections: `bundle` moved into a `topology`
  section, because `SCENE-KEYWORD-MEMBERSHIP` leaves `topology` the only genre that declares it.
  `plane` left the list in the same release — `PAINT-ORDER-CONSTRUCT` withdrew the directive, so
  a bare `plane` answers the withdrawal diagnostic (`918`) and has no
  `needs an id` message left to pin
- `907-errors-edge-form` — edge operator/form. Named
  `907-errors-edge-and-path-form` until 0.1, when `EDGE-GEOMETRY-CONSTRUCTS` withdrew the
  `path` directive and its three form errors went with it. The edge half is
  the subject and is unchanged
- `908-errors-table-structure` — pipe/delimiter-row/width/cell
- `909-errors-band-chart-bundle` — band range, bundle members, chart id,
  and the DELETED `chart level=` (the `plot` keyword became `chart`; `level=` became a deletion diagnostic, `CHART-LEVEL-KEY`).
  TWO sections: its three constructs no longer share a
  genre, `band` having left `topology` and `bundle` having left `block`
  (`SCENE-KEYWORD-MEMBERSHIP`), so it is `block` for `band`/`chart` and `topology` for `bundle`.
  Two sections rather than two fixtures — the subject is a set of static
  argument errors, not a genre, and the `bundle` half would be a fixture of
  one line. All four messages are byte-unchanged; only their line numbers
  moved
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
  fixture: the four that were live until 0.1 (`points=`, `tailport=`,
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
- `917-retired-size-keyword` — **new (`ELEMENT-GEOMETRY-DIRECTIVE`)**: `size` merged
  into `pin`. NORMATIVE — the retirement diagnostic is inside the conformance
  surface even though the construct it names is gone
- `918-withdrawn-plane-keyword` — **new (`PAINT-ORDER-CONSTRUCT`)**: the
  language-wide withdrawal of `plane`, `plane=` and `z-index=`, in three
  sections (`block`, `bitfield`, `table`) because the keyword sweep runs
  ahead of the genre allowlist and answers the same message in every genre —
  including the region genres, which never had a scene keyword to withdraw.
  NORMATIVE, the `913` reading: §10 classifies a retired registration NORMATIVE
- `919-withdrawn-plane-experimental-genres` — **new (`PAINT-ORDER-CONSTRUCT`)**:
  the EXPERIMENTAL half of `918`. "The sweep answers the same message in
  every genre" is a claim about all EIGHT, and it is only checked if all
  eight are written down: `918` holds `block`/`bitfield`/`table`,
  `241-topology-withdrawn-cells` holds `topology`, and this holds
  `flowchart`, `statechart` and the `timing` genre HEADER — a different
  position from the block opener `918` writes, the distinction `916` pins
  for the `wave` → `timing` rename. `timing` is the section worth having:
  it is a REGION genre that never declared a scene keyword, so nothing in
  it could be an `SCENE-KEYWORD-MEMBERSHIP` per-cell withdrawal and the message is provably
  arriving from the `PAINT-ORDER-CONSTRUCT` language-wide sweep. The two-hop chains are `334`

### Diagnostics added or changed (`CLASS-CHANNEL-REACH`, `INTERIOR-LESS-ELEMENT-PAINT`)

The class-channel check moved from `doc.edges` alone to **all ten collections
that accept `class=`**, tested against the channel set each member's DRAWING
reads. One diagnostic family generalises, one is new, and **one is RETIRED**.

| message (leading text) | pinned by |
|---|---|
| `class "<id>" sets fill= but no stroke=, and <a member> has no interior — add stroke= to the class …` — `INTERIOR-LESS-ELEMENT-PAINT`'s own message, unchanged in shape and now naming the member. Reaches `message`, `fragment` and `operand` at this release | `293-class-channel-per-member` (the `edge` wording, normative), `experimental/293-sequence-class-channel` (all three sequence members in one document — they reach the model by three different parse paths) |
| `class "<id>" declares only <key>=, and <a member> has no such channel — add fill= or stroke= to the class …` — NEW at 0.4. The general form of the same rule: a class whose channels are ALL channels the member lacks. Reachable today on `field` and `cell`, whose two-channel set dates from `STYLE-KEY-SCOPE` | `293-class-channel-per-member` (a `style=`-only class on a `field` and on a `cell`) |
| ~~`class "<id>" declares no channel an edge has — add stroke= (an edge has only stroke= and style=: no interior …)`~~ — **RETIRED at 0.4 (`CLASS-CHANNEL-REACH`).** `CLASS-PAINT-REQUIREMENT`'s second half made a class that declares NO paint a line error when an `edge` joined it; it is legal on every member from this release, on the ground that the same release which raised it had already made the derived legend draw such a class's meaning with no swatch | *(no longer emitted)* |

**The retired message was never covered by a fixture, and that is a finding in
its own right.** `grep "no channel an edge" conformance/` returned nothing: the diagnostic shipped, stood for fifty-seven
increments, and no golden ever recorded its text — so a second implementation
had no way to learn it and §8.2's hole was already open here. Nothing re-pins
now, which is why the retirement costs no fixture edit; the LEGALISATION it
creates is pinned instead, positively, in three places: a meaning-only class
joined by an `edge` in `293-class-channel-per-member` (no error line for it),
and the model goldens `experimental/294-sequence-class-meaning-only` and
`experimental/283-sequence-message-model`.

**Nine of the ten collections were unchecked before this release**, so the
generalisation is the fix for a whole class of silence rather than one
message: `class k "K" fill=#eee` plus `message c -> s "m" class=k` parsed
clean, painted nothing of the fill, and drew the class in the
legend. Members with all three channels (`node`, `group`, `lifeline`, `state`)
can never fail either form, and no fixture pretends otherwise.

### Diagnostics added or changed (`SEQUENCE-GENRE-VOCABULARY`)

The `sequence` genre got its five keywords, its allowlist row and its three
refusals. **Six new diagnostic families**, and one existing family reached a
fourth genre.

The families that are NEW rather than reused are the two REFUSAL ones. A
refusal is not a withdrawal and not an unknown word: the genre never declared
the spelling, so the `SCENE-KEYWORD-MEMBERSHIP` message (*"it was WITHDRAWN from this genre"*) would
state a migration that did not happen and would date it to a release nothing
changed in. They are therefore separate tables in the engine
(`REFUSED_IN`, `REFUSED_OPT_IN`) with their own message builders, and every
existing `SCENE-KEYWORD-MEMBERSHIP`/`MEMBERSHIP-KEY-ACCEPTANCE` message is byte-unchanged.

| message (leading text) | pinned by |
|---|---|
| `"<kw>" is not allowed in genre <g> — this genre REFUSED it, it is not a typo and not a withdrawal: …` — the KEYWORD refusal, one cell per ruling, each giving the ground and the spelling that works instead. `gap` (`SEQUENCE-TIME-GAP`) is consulted BEFORE the typed-block-child exemption, because it is both a `timing` child keyword and a refused word, and the child message would name the wrong reason | `289-sequence-refusals` — `group` (`SEQUENCE-PARTICIPANT-GROUPING`) and `gap` (`SEQUENCE-TIME-GAP`) |
| `<key>= is not allowed in genre <g> — this genre REFUSED the key, it is not a typo and not a withdrawal: …` — the OPTION-KEY refusal, and the only diagnostic in the engine that fires for a key **not in `OPT_KEYS`**. That is the ruling working: refusing `lost=` means adding no key, so the message rides the UNKNOWN-OPTION path in `badOpts` and in the connector scanner rather than the inapplicable-key path | `289-sequence-refusals` — `lost=` (`UNDELIVERED-MESSAGE-MARKING`), written on a `message`, which is scanned by `parseEdgeLine` and therefore needs its own copy of the check |
| `fragment needs type=<operator> — a fragment with no interaction operator asserts nothing (alt\|opt\|…\|break, UML 2.5.1 §17.12.15.3). UML defaults the attribute to seq and FigDown does not …` and `unknown interaction operator "<v>" — write one of …` — the MANDATORY-key and the ENUM diagnostics for `type=` on `fragment`. Both name **§17.12.15.3**; the draft's earlier §17.6.2 is registered FALSE (`spec/standards-claims.tsv` S024) and is printed nowhere | `287-sequence-fragment-type`, which also pins `type="alt"` reaching the existing RULE 2.4 bare-value message and `operand needs in=<fragment-id>` |
| `unknown fragment or operand "<v>" — in= on a <what> names the fragment or operand this <what> occurs inside[, and "<v>" is a LIFELINE …]. Under sequence in= is accepted on message, operand, lifeline, state and fragment — five acceptors, all sense 1 …` — the `in=` OBJECT rule (`SEQUENCE-CONTAINMENT-SCOPE`). One builder for all five acceptors, because it is one rule; the lifeline clause is added only when the value resolves to one, which is the mistake an author actually makes | `286-sequence-in-errors`; the accepting direction is a MODEL golden, `285-sequence-in-acceptors`, which writes `in=` on all five |
| `fragment "<id>" nests <n> levels deep (inside "<a>", inside "<b>") — fragment nesting is capped at ONE level in v1 …` — the NESTING CAP (`SEQUENCE-CONTAINMENT-SCOPE`), new at this increment and absent from the prototype. The message says the cap is the v0.1 `group` precedent and a SCOPE decision rather than a principle, so an author knows what would reopen it | `288-sequence-nesting-and-contiguity` |
| `Line <n>: this <kind> line splits <fragment\|operand> "<id>" (lines <a>–<b>) — members must be CONTIGUOUS in declaration order …` — the CONTIGUITY rule, ported from the prototype. One offending line is reported ONCE, against the DEEPEST container it splits, because that is the container whose `in=` repairs the document | `288-sequence-nesting-and-contiguity` |
| `message needs a direction: -> <- <-> — a Message has a sending event occurrence AND a receiving event occurrence (UML 2.5.1 §17.4.3.1 …)` — `--` is a line error in THIS genre and legal in every other | `290-sequence-message-direction`, whose second section is the KEEP half: `edge a -- b` under `block` still parses |
| `"<surf>" is not the word genre <g> uses for this — write "<want>": …` — the `GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING` family, reaching a FOURTH genre. Not a new literal; what changed is the summary list at the end, which said *"Each scene genre …"* and enumerated three genres. A list that omits a live genre under-reports, so it now reads *"Each genre …"* and names `sequence lifeline message` | `284-sequence-wrong-word`, both directions. Four existing goldens carry the new tail: `226`, `227`, `234`, `238` |
| `"<kw>" is not allowed in genre sequence` — the PLAIN allowlist message, for `flow`, `rank` and the region openers. These are NOT refusals with rulings of their own: `flow`/`rank` are absent as a CONSEQUENCE of both axes being declaration-ordered (draft §7), and the region openers are an OPEN question rather than a no | `291-sequence-flow-rank-refused`; `282-sequence-vocabulary-scoped` for the openers, and for the other direction — `fragment`/`operand` under `block` |

**Positive coverage** (model goldens, no diagnostic): `283-sequence-message-model`
(all three operators and every channel a message has, with `edges` staying
empty), `285-sequence-in-acceptors` (all five `in=` acceptors),
`292-sequence-declaration-order` (the total order, recorded only as per-element
`line` and array order).

### Diagnostics added or changed (`SUBJECT-VOCABULARY-SCOPE`, `SCENE-KEYWORD-MEMBERSHIP`, `PAINT-ORDER-CONSTRUCT`)

Subject vocabulary became **per genre** (`SUBJECT-VOCABULARY-SCOPE`), sixteen per-cell withdrawals
landed (`SCENE-KEYWORD-MEMBERSHIP`), and `plane`, `plane=` and `z-index=` left the LANGUAGE (`PAINT-ORDER-CONSTRUCT`).
The diagnostic consequence is one NEW FAMILY and one rewritten chain, and the
two are reached from different places in the parser — which is why they are
listed separately and pinned separately.

**The new family: `WITHDRAWN_FROM_GENRE`.** Reached from the `GENRE-KEYWORD-ALLOWLIST` genre-allowlist
rejection site, where the answer used to be `"<kw>" is not allowed in genre
<g>` and nothing else. That sentence is true and useless: it is what an
UNKNOWN word gets, so it sends an author who wrote a word this genre used to
accept looking for a typo. The new message says the word was **WITHDRAWN, not
misspelled**, gives the ground of ITS cell, and closes with the `GENRE-VOCABULARY-OBLIGATION` clause —
a spelling accepted by several genres is several independent declarations,
and one genre's withdrawal touches no other's. **Twelve cells carry a message
of their own**, because the grounds differ and one sentence could not carry
them; the other four of the sixteen are the `plane` row, which is not a
per-genre withdrawal at all (below).

| cell (genre × keyword) | the ground the message gives | pinned by |
|---|---|---|
| `block` × `bundle` | zero authored uses under `block`; the construct is defined by a REFERENT only `topology` has — a LAG (IEEE 802.1AX), an ECMP set, an EVPN Ethernet Segment | `246-block-withdrawn-cells` (NORMATIVE, `cases/`) |
| `topology` × `threshold` | zero occurrences, and in this domain a threshold is a QUEUE DEPTH WITH A NUMERIC VALUE (RFC 2309 `minth`/`maxth`, RFC 7567) while FigDown's takes no `value=` | `241-topology-withdrawn-cells` |
| `topology` × `band` | its two occurrences were both conformance fixtures; here a BAND is a frequency band — radio, microwave, optical transport — which is exactly the figure this genre draws | `241-topology-withdrawn-cells` |
| `flowchart` × `group` | one occurrence, and it was this genre's OWN reference figure, so citing it is circular | `243-flowchart-withdrawn-cells` |
| `flowchart` × `threshold` | a process box's extent is an artifact of its label length, so a value drawn at a percentage of it asserts nothing | `243-flowchart-withdrawn-cells` |
| `flowchart` × `band` | a range over that same meaningless extent | `243-flowchart-withdrawn-cells` |
| `flowchart` × `bundle` | parallel flowlines between two stages are different CONDITIONS; a ring round them hides what the figure is for | `243-flowchart-withdrawn-cells` |
| `statechart` × `group` | UML's grouping construct is the COMPOSITE STATE and its REGIONS; the single-source rule says take UML 2.5.1 §14's word, not another genre's | `244-statechart-withdrawn-cells` |
| `statechart` × `external` | additionally RESERVED (`RESERVED-SPELLINGS`): UML 2.5.1 §14 defines `TransitionKind` as `external \| internal \| local`, so the word already names a transition that exits and re-enters its source state | `244-statechart-withdrawn-cells` |
| `statechart` × `threshold` | a state's box is sized by its label, so a reference value drawn down it asserts nothing | `244-statechart-withdrawn-cells` |
| `statechart` × `band` | a range over that same extent | `244-statechart-withdrawn-cells` |
| `statechart` × `bundle` | an ANTI-FEATURE: two transitions between one pair of states are two TRIGGERS, and the trigger is the whole content of the arc | `244-statechart-withdrawn-cells` |

**The KEEP half has fixtures too**, because a withdrawal grid is only half
checked by its errors: `245-block-subject-vocabulary` (NORMATIVE — `group`,
`external`, `threshold`, `band`), `240-topology-subject-vocabulary`
(`group`, `external`, `bundle`) and `242-flowchart-subject-vocabulary`
(`external`) are model goldens. `statechart` has none and cannot have one —
it declares NO subject vocabulary at all, and the EMPTY declaration is what
`230-statechart-header` and `233-statechart-state-transition` already pin.

**The `plane` row is NOT part of that family**, and the difference is
observable. `plane` joins the retired-keyword sweep, which runs **ahead** of
the `GENRE-KEYWORD-ALLOWLIST` allowlist, so it answers the same message in every genre — including
`bitfield`, `table` and `timing`, which never had a scene keyword to withdraw
— and abandons the line before its options are read.

| message (leading text) | pinned by |
|---|---|
| `plane has been WITHDRAWN from the language (`PAINT-ORDER-CONSTRUCT`) — removed, not renamed, so there is no replacement spelling. It declared a DRAWING LAYER (a z-order), and in the genre that actually used it "plane" means the control / data / management partition of a network device …` — `RETIRED_PLANE`. Names no replacement, because there is none; says paint order is document order, and points at `class=` for a logical layer of the SUBJECT (core §5, `PRESENTATION-AS-MEANING-CARRIER`) | `918-withdrawn-plane-keyword` (NORMATIVE — `block`, `bitfield` and `table` sections, one each, which is what "every genre" means for the normative surface), `241-topology-withdrawn-cells` (the experimental genre where every authored `plane` in the tree was actually written), `334-layer-retired` |
| `plane= has been WITHDRAWN with the "plane" keyword (`PAINT-ORDER-CONSTRUCT`): the construct is removed from the language, not renamed … with no way to declare one the key had a single legal value — base, the implicit plane every element is already on …` — `RETIRED_OPT_KEYS.plane`. Carries the MEASUREMENT: stripping `plane` and `plane=` from `examples/evpn-fabric.fd` left the drawn SVG byte-identical but for one `data-edge` index | `918-withdrawn-plane-keyword` (on `node`, `class`, `edge`, `timing`, `field` and `cell`), `334-layer-retired` |
| `z-index= has been WITHDRAWN with the "plane" keyword (`PAINT-ORDER-CONSTRUCT`): it was legal on plane and on nothing else, so it left with its only acceptor. There is no replacement spelling and no other directive to move it to …` — `RETIRED_OPT_KEYS['z-index']`. It answered the ORDINARY allowlist message `<directive> does not take z-index=` for part of this release — left in `OPT_KEYS` with no acceptor row — and the engine's own note records why that was not good enough: the generic message is *"true, but it tells an author holding a 0.2 document that they picked the wrong host, when in fact there is no host."* RULE 6.2's placement test settles it — the spelling left the LANGUAGE, so it is reported wherever it appears, the `w=`/`h=`/`colw` precedent. The two `z` spellings now differ only in chain length: `z=` states both hops (renamed `z-index=` at 0.1, withdrawn here), `z-index=` states one | `918-withdrawn-plane-keyword` (`node`, `signal`, `field`, `cell`), `334-layer-retired` (`node`), `919-withdrawn-plane-experimental-genres` (`signal`, under a `timing` genre header) |

**Three messages were REWRITTEN, and the reason is the `route` → `path`
precedent**: each named a replacement spelling that no longer
exists, and a retirement message pointing at a withdrawn word is the language
misinforming its user. Each now states the WHOLE CHAIN in one lookup and ends
in the withdrawal.

| message (leading text) | what it said before | pinned by |
|---|---|---|
| `layer has been WITHDRAWN: it was renamed plane at 0.1, and plane was withdrawn from the language at 0.3 (`PAINT-ORDER-CONSTRUCT`). There is no replacement spelling …` | `layer has been renamed: use plane (…mxGraph… Inkscape… OGC WMS… CSS @layer…)` (MIGRATIONS 0.1) | `334-layer-retired` |
| `layer= has been WITHDRAWN: it was renamed plane= at 0.1, and plane= was withdrawn with the "plane" keyword at 0.3 (`PAINT-ORDER-CONSTRUCT`) …` | `layer= has been renamed: use plane=` (MIGRATIONS 0.1) | `334-layer-retired` |
| `z= has been WITHDRAWN: it was renamed z-index= at 0.1, and z-index= was withdrawn with the "plane" keyword at 0.3 (`PAINT-ORDER-CONSTRUCT`) — it was legal on plane and on nothing else …` | `z= has been renamed: use z-index= (CSS spells the stacking concept z-index …)` (MIGRATIONS 0.1) | `334-layer-retired` |

`334-layer-retired` is therefore the whole chain in one file — **six lines,
six messages**, one per spelling the family ever had. Its two `z` spellings
had to be REHOSTED on a plain `node`, the `913-withdrawn-edge-geometry-keys`
device: the `plane` sweep runs ahead of the option scan and
abandons the line, so a key written on a `plane` line can no longer be
reached at all. `z=` rode on one and **silently stopped being covered** the
moment the sweep landed — the fixture went on passing, because the line still
errored, with a different message. `z-index=` had no line of its own here at
all; its only fixture was `124`, which wrote it on `plane` lines. That is the
failure mode this file exists to catch, and it was caught by regenerating the
golden and READING it, not by the run passing.

**What LOST coverage, stated rather than absorbed.** Five fixtures whose
subject was `plane` were deleted (`124`, `330`–`333`) and their diagnostics
either left the language with the construct — `duplicate plane id "<id>"`,
`unknown plane "<id>"`, `z-index must be a number` — or moved to `334`. One
more, `264-edge-plane-quoted-id`, took a live message down with it: see the
0.1 table below.

**FIVE `err()` sites are now UNREACHABLE and are left in place**, and none of
them is visible to the heuristic above, because all five interpolate. Four are
the `unknown plane "<id>"` post-pass checks on `node`, `group`, `edge` and
`external`: nothing can set a non-`base` plane, so the check can never fail.
The fifth is the `edge` scanner's `idErr` on `o2.plane` — the `RULE-POSITION-ENUMERATION` fix — which
the retired-key sweep above it now returns before. They are named here rather
than counted as coverage, so that a later reader finds the reason before
concluding the messages are untested.

### Diagnostics added or changed (`DRAWN-ANNOTATION-FORM`, `MARKER-TARGET-KINDS`)

`note=` was REVIVED — retired as the old spelling of
`description=`, it returns as the **drawn** annotation under
[SYNTAX-STYLE](../spec/syntax-style.md) RULE 4.9. The rule's third
obligation is that the retirement diagnostic be **reversed in the same
release**, and "reversed" is not "deleted": the one message that used to
cover every appearance of the spelling is replaced by **two narrower ones**,
each with a fixture.

| message (leading text) | pinned by |
|---|---|
| `note= requires figdown 0.3 (this document declares <v>): under figdown <v> the spelling is still the RETIRED one that meant description=, and an engine that accepted it here would repaint a tooltip as ink …` — the VERSION GATE, `KEYWORD-RENAME-SCOPE`'s device (name the version, offer the one-step fix). INTERPOLATED, so the audit heuristic below cannot see it | `805-note-requires-0-3` — both interpolations, `0.2` and `0.1`, in one file; `806-note-accepted-at-0-3` is the same document at `0.3` and pins the accepting direction |
| `note= draws and is not accepted on field; use description= for prose a machine reads. The two keys divide by AUDIENCE, not by length …` — the `field` REFUSAL, at EVERY version. `field` is listed in `DIRECTIVE_OPTS` as taking `note` for the sole purpose of reaching this message instead of the generic one. Emitted via a named constant, so the audit heuristic below cannot see it either | `803-note-on-field-refused` (under `0.3` and under `0.1`, same string); `479-bitfield-note-retired` — the 0.1 fixture, which SURVIVES under its old name with its subject changed from a retirement to a refusal |
| `<directive> does not take note=` — the ORDINARY allowlist message, for the seven directives with no `note` row. Not a new literal; what is new is that these lines can never answer `unknown option "note="`, because the language now HAS the spelling | `804-note-refused-generic` — `cell`, `external`, `threshold`, `band`, `bundle`, `class`. There were SEVEN until 0.3; `plane` was the seventh and left the language (`PAINT-ORDER-CONSTRUCT`). The six now sit in three sections, because `SCENE-KEYWORD-MEMBERSHIP` leaves them in three genres |
| `note= must be quoted: note="<v>" — whitespace also separates positionals …` — the existing `QUOTING-RULES` message, reaching a third prose key (after `description=` and `present=`) | `809-note-must-be-quoted` — `node`, `title`, and `edge`, which has its own option scanner and its own copy of the check |
| `unsupported version "<v>" (expected 0.1 or 0.2 or 0.3 or 0.4)` — the enumeration widened when `LANG_VERSIONS` gained `0.3`, and again at 0.4 when it gained `0.4` (`SEQUENCE-GENRE-VOCABULARY`) | `016-header-major-version`; `014-header-bad-version` moved on to `figdown 0.5`, the next minor the engine does not implement, by the same rule `STATECHART-GENRE-SCOPE` applied to it at 0.2 and `DRAWN-ANNOTATION-FORM` at 0.3 |
| `genre "<g>" requires figdown <v> (this document declares <d>) — write: figdown <v> <g>` — the GENRE version gate. INTERPOLATED and answered by a SEARCH over `GENRES_BY_VERSION`, not by a per-genre branch, so the second genre to need it cost no code (core §1, §13.7, §13.7.4) | `231-statechart-requires-0-2` (`STATECHART-GENRE-SCOPE`, the first); `281-sequence-requires-0-4` (`SEQUENCE-GENRE-VOCABULARY`, the second — same message, no new literal) |

**Positive coverage** (model goldens, no diagnostic): `800-note-block-acceptors`
(`node`, `group`, `edge`, `title`), `801-note-flowchart-acceptors` (`process`,
`decision`, `terminator`, `flowline`), `802-note-statechart-acceptors` (`state`,
`transition`) — every acceptor appears in exactly one of the three, one case per
genre, because `CATEGORICAL-MEANING-MAPPING` makes each genre declare the key in its own row rather than
inherit it. `807-pre-0-3-documents-unaffected` holds the other side of the
version bump: `figdown 0.1` and `figdown 0.2` documents that never mention the
key parse exactly as before. `808-note-and-description-independent` keeps the
two keys apart — they divide by AUDIENCE, and neither is a fallback for the
other.

**`MARKER-TARGET-KINDS`, and it has no diagnostic at all** — which is the point. `in=` on
`threshold`/`band` now resolves a REGION id (`bitfield`/`table`/`timing`), so
`threshold "Max" in=q offset=50%` stops answering `unknown target "q" for
threshold`. The widening is deliberately UNGATED: it adds no spelling, the §10
registry is byte-unchanged, and the only documents it affects are ones that did
not parse at all. `810-threshold-in-region-target` (at `0.3`) and
`811-threshold-in-region-ungated` (the same body at `0.1`) are the pair.

**A KNOWN HOLE, recorded rather than left to be discovered.**
`conformance/normalize.js` does not project `note` into the canonical model.
The acceptor fixtures above therefore pin that the key PARSES and that it
disturbs nothing else — not the strings themselves. Until that projection
lands, a second implementation could accept `note=`, discard the value, and
match every model golden here. This is §8.2's hole in its other form: not a
message with no fixture, but a model field with no golden.

### Diagnostics added or changed (`RULE-POSITION-ENUMERATION`, `VERBATIM-REGION-SCOPE`)

| message (leading text) | pinned by |
|---|---|
| `this position takes a BARE value: write <bare spelling> — quoting a value drawn from a closed set suggests the position accepts arbitrary text …` — RULE 2.4's ENUM half, ONE wording at all nine positions | `126-enum-bare-header` (the `figdown` version and genre), `127-enum-bare` (`flow`, `shape=`, `style=`, `numbering=`, `cell … highlight`), `263-edge-option-quoting` (`style=` on an edge, which has its own scanner), `265-enum-bare-experimental` (`extend=` on a `band`, `type=` on a `chart`; its `band` section was rewritten from `topology` to `block` at 0.3 (`SCENE-KEYWORD-MEMBERSHIP`) and both messages are byte-unchanged) |
| `<bitfield\|table\|timing> label must be quoted: <kw> <id> "<label>" — whitespace also separates positionals …` — RULE 2.1 completed at the three typed-block openers | `125-typed-block-label-quotes` |
| `"step" is RESERVED inside an index= range and has no meaning in v0.1 …` | `422-bitfield-index-step-reserved`; the near-misses the trigger deliberately does NOT catch are a MODEL golden, `423-bitfield-index-step-prose` |
| `ids are bare and match [A-Za-z_][A-Za-z0-9_-]* …` on an `edge`'s `plane=` — the shared id wording reaching the last position that lacked it | `264-edge-plane-quoted-id`, **DELETED at 0.3**. `plane=` was the position, and with the key withdrawn (`PAINT-ORDER-CONSTRUCT`) `edge` has no id-valued option key left at all, so the behaviour is unreachable rather than rehostable. The engine's check survives as unreachable code behind the retired-key sweep; the coverage does not, and that is recorded rather than papered over |
| *(a REMOVED diagnostic)* `unterminated [label]` no longer fires for a `#` inside a bracket label (`VERBATIM-REGION-SCOPE`) | `254-edge-label-errors` lost that line; `262-edge-bracket-hash` pins the model it now produces |

**Note on ordering, because it is observable.** The enum check runs BEFORE the
value check and suppresses it for that token — **one token, one error** — so
`shape="bkx"` reports the spelling ONCE rather than the spelling and
`unknown shape` on one line, and `figdown 0.1 "blok"` reports the spelling
rather than the spelling and `unknown genre`. This is the convention `idErr`
has followed at every id position. The `figdown` header
reported BOTH until 0.1 and was brought into line in the same release,
so all four enum sites now agree.

### Diagnostics added or changed

| message (leading text) | pinned by |
|---|---|
| `the field flag "optional" has been retired and replaced by an option key that carries the CONDITION: write present="<the condition>" …` | `476-bitfield-presence-flags-retired` |
| `the field flag "conditional" has been retired: write present="<the condition>" …` — rewritten at 0.1 to point at `present=` rather than `optional`, its own short-lived 0.1…0.1 replacement | `476-bitfield-presence-flags-retired` |
| ~~`note= has been renamed: use description= (IEEE 1685-2022 spells this channel description; …)`~~ — **REMOVED at 0.3 (`DRAWN-ANNOTATION-FORM`).** The spelling is LIVE again and this message now states the opposite of the rule, so SYNTAX-STYLE RULE 4.9's third obligation required it reversed in the release that revived the key. Removed, not silently deleted: the two situations it used to cover each keep a NARROWER diagnostic of their own, in the 0.3 table below | *(no longer emitted)*; `479-bitfield-note-retired` survives under its old name and now pins the `field` REFUSAL instead |
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
