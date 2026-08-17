# FigDown Genre: `flowchart`

> Normative genre document (`GENRE-DOCUMENT-CONTRACT`). Core doc + this doc suffice to author and
> read any flowchart figure.
>
> **Genre status: EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`).**
> `flowchart` is outside the v0.1 conformance surface and outside the
> compatibility promise. The engine accepts it unchanged, every existing
> `flowchart` document parses and renders exactly as before, and no `.fd`
> needs rewriting — but the genre may change or be withdrawn in a later
> `0.x` without a migration entry, and a `flowchart` document is not a
> portable v0.1 document. It is demoted because it had **not converged**:
> until 0.1 it shared `block`'s namespace with nothing but a default
> (`flow down`) to tell the two apart. **0.1 (`FLOWCHART-ROLE-KEYWORDS`) landed the first
> tranche of its own vocabulary** — `process`, `decision`, `terminator`,
> §Roles below — which is the first exercise of `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` by any genre. The
> genre stays EXPERIMENTAL: the vocabulary is one tranche, not a converged
> set, and the excluded candidates (§Roles, *What is excluded*) are recorded
> rather than settled. It is not wrong or deprecated. See `DOMAIN-VOCABULARY-PREFERENCE` §4. The
> NORMATIVE v0.1 genres are `block`, `bitfield` and `table`. See core doc
> §10 for what the status means. This document remains normative *for* the
> genre: it is the authority on what `flowchart` means.
>
> **The rest of this genre's vocabulary became its own too
> (`SUBJECT-VOCABULARY-SCOPE`).** There is no shared "scene vocabulary" to inherit any more. Beside
> the four words above, `flowchart` declares exactly one subject keyword —
> **`external`**, the off-page terminus (§The `external` endpoint) — and
> withdrew five: `group`, `threshold`, `band` and `bundle` from this genre
> (`SCENE-KEYWORD-MEMBERSHIP`), and `plane` from the language (`PAINT-ORDER-CONSTRUCT`).
>
> **The option key `in=` followed `group` out of this genre
> (`MEMBERSHIP-KEY-ACCEPTANCE`).** It named a `group` id and nothing else, so the `SCENE-KEYWORD-MEMBERSHIP` withdrawal left
> it accepted with no value that could resolve; the key is now a named line
> error here and `class=` is what expresses membership. The same ruling records
> **pipeline phases as a SIBLING candidate to swimlanes** — two constructs on
> orthogonal axes, not one — in §*What is excluded*.

**Census**: #3 by unique images, 8.3% weighted. Prior art surveyed:
**ISO 5807** flowchart symbols (the SOURCE of the role vocabulary, §Roles);
UML 2.x activity model; BPMN 2.0 and its Descriptive conformance class;
Mermaid's `flowchart` type (adopted as *negative* prior art for role
expression — it carries role on the bracket SHAPE, which is what `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`
forbids here).

## Purpose

Expresses a **procedure as ordered steps and the branches between them**:
decision trees, error-handling paths, packet-processing procedures,
configuration workflows. Distinguished from `block` by what the edges
mean — control flow through time, not structural relation.

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| `flow` | `down` | The one genre that overrides the core default; census-dominant for procedures. An explicit `flow` line overrides it |
| `shape` | `box` | The core-model default (§2.1) |

The `flow down` default is no longer the *entire*
behavioural difference between `flowchart` and `block`: the role vocabulary
below is the other half. Defaults are always per-genre and are justified by
that genre's own census statistics (`GENRE-NAMESPACE` `PER-GENRE-DEFAULTS`).

## Roles: `process`, `decision`, `terminator` (`FLOWCHART-ROLE-KEYWORDS`)

This clause follows UML's split — **abstract syntax**, **semantics**,
**notation** — because the whole point of the construct is that those three
are not the same thing.

### Why words, not shapes

The governing target for every FigDown keyword: **a reader who has never
opened the spec for this genre should recover 70–80% of what a `.fd` says
from the syntax alone**, leaving only the last 20–30% to the spec. Compare
the two spellings against that target:

```
node q "Header valid?" shape=diamond      # the reader must ALREADY know the
                                          # flowchart drawing convention
decision q "Header valid?"                # the reader just reads it
```

The first line is legible only to someone who has learned that a rhombus
means a branch. The second is legible to anyone who reads English. That is
the primary reason, and it is a reason about the *reader*, not about
internal consistency.

**The convention does not even hold for readers who have learned it.**
Measured over the production corpus: of **216 question-labelled nodes, 78%
are drawn `diamond`, 14% `ellipse`, and 8% carry no `shape=` at all**. A
reader applying the diamond convention therefore misreads about **a fifth**
of the corpus's decisions — and the 14% is not carelessness, it is authors
choosing a narrower outline so a wide fan-out's labels fit. *A convention
must be learned; a keyword is simply read — and a convention the language
does not carry is a convention nothing enforces*, which is exactly where
that 22% comes from.

Second, it is the rule `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` already stated: **`shape=` is geometry, role
is vocabulary.** Before this release the renderer itself broke that rule —
it placed a short branch label near the source only when
`shape === 'diamond'`, i.e. it consumed geometry AS role. That heuristic now
reads `role === 'decision'` (engine backlog entry 12, closed).

Third — and only third — the three spellings come from **ISO 5807**, whole,
under `SIZE-AND-DIRECTION-KEY-NAMING`/`GENRE-DOCUMENT-CONTRACT` §6(b). See *Source* below for why that standard, and not UML's
`action`, satisfies `SHAPE-ENUM-VOCABULARY`.

### Abstract syntax

    process    <id> ["label"]
    decision   <id> ["label"]
    terminator <id> ["label"]

Option keys are **identical to `node`**: `shape` `fill` `stroke` `style`
`class` `note`. `in` was a seventh until 0.3 (`MEMBERSHIP-KEY-ACCEPTANCE`) withdrew it from
this genre — it named a `group`, which this genre stopped declaring (`SCENE-KEYWORD-MEMBERSHIP`), so every value was a dead end; see *`in=` is withdrawn from
`flowchart` at 0.3*. `plane` was an eighth until `PAINT-ORDER-CONSTRUCT` withdrew it from
the language. A role line shares the node / external / typed-block **id
namespace** and is addressable by `flowline`, `pin` and `rank` exactly like a
`node`. Every rule that governs `node` — id spelling,
label quoting, duplicate ids, the `shape=` enum, `width=`/`height=` rejection
(`<node|process|decision|terminator> does not take width=/height= — use a
pin line`) — governs a role line unchanged, because the parser desugars all
four spellings into one case.

The keywords are legal **only under `figdown 0.1 flowchart`** and later.
Under any
other genre they are `"<keyword>" is not allowed in genre <g>` — the header
genre's allowlist (core §1, `GENRE-NAMESPACE`) enforces it with no per-keyword code.

### Semantics

A role line declares a **node bearing a `role`**:

| Keyword | `role` in the model | ISO 5807 | Means |
|---|---|---|---|
| `process` | `"process"` | §9.2.1 | a processing function: an operation, or a group of operations, that changes the value, form or location of information |
| `decision` | `"decision"` | §9.2.2.4 | a decision or switching function: **one entry**, and a number of alternative exits **of which exactly one** is taken after the conditions are evaluated |
| `terminator` | `"terminator"` | §9.4.2 | an exit to, or an entry from, the outside of the procedure — a start, an end, or a halt |

`decision` is the one role that carries a **semantic constraint beyond
naming**: its exits are mutually exclusive. A `process` with several outgoing
edges remains as ambiguous as any other fan-out (see *Semantic model*).

#### Which of the four to write

**Prefer one of the three ISO roles — `process`, `decision`, `terminator`.
Write `node` only when the source does not state which.** They are not four
equal spellings: the roles are the first choice and `node` is the fallback.

**What `node` means here, exactly: THE SOURCE DOES NOT STATE THE ROLE.** That
is its only legitimate use, and it is a permanent one. ISO 5807 is a standard
for **drawing** flowcharts: an author with a pen must put *some* symbol on the
paper, so the standard has no way to say "unclassified" and a genuine
flowchart stage always has an ISO classification. FigDown separates role from
geometry, which lets it say the thing ISO cannot — **the source does not state
the role, and I must not invent one.** That is this project's own rule, not a
flowchart special case: it is `*` for a length the document does not carry,
`present=` for a condition the document does state, and a prose value that
must not be resolved into a number. The corpus is transcription-heavy, and a
transcriber genuinely unable to tell a Process from a Predefined process is
the case this spelling exists to serve.

**What `node` does NOT mean: "an ISO symbol this genre has not implemented."**
That case is real, but it is not a property of the figure — it is a **coverage
gap in FigDown**. A stage ISO classifies as Data is a Data stage whether or
not this genre can spell it, so writing a bare `node` there records an absence
the author does not have. Worse, it records it **silently, in a spelling that
looks like a deliberate authorial choice**: the reader sees "role unstated"
and the truth is "the language ran out of words". Do not let a gap disguise
itself as a judgement.

**When the source states a role `flowchart` cannot spell, do three things:**

1. **Write `node`.** It is still the only legal spelling — `process` would be
   a false claim, and one no inspection of the figure could catch.
2. **Comment the line with the ISO symbol name**, so the information survives
   in text a reader can quote even though the model cannot carry it:

   ```figdown
   node cfg "Read config file"   # ISO 5807 Data (input/output) — no FigDown role
   ```

   A comment is not a second semantic channel and a reading agent must not
   parse it (`MEANING-RECOVERY-SOURCE`). It is the honest interim: quotable prose beside a model
   that says less than the author knows.
3. **Report the gap.** It belongs in the ISO 5807 coverage ledger in
   the project’s working record,
   which records every symbol in this repository's record of the standard as
   *spelled*, *partial* or *gap*, with whatever evidence exists for needing
   it. A gap with a real figure behind it is evidence; a gap nobody reports is
   invisible, and invisible gaps do not get closed.

**How wide the gap is, measured rather than gestured at.** This repository's
own record of ISO 5807 lists **sixteen** symbol names — twelve stage symbols
and four line symbols (`spec/vocabulary-sources.tsv`). This genre spells
**three** stage roles and **one** line (`flowline`); `style=dashed` carries a
fourth as presentation only. Nine stage symbols have no word here: Predefined
process, Manual operation, Preparation, Parallel mode, Loop limit, Data,
Stored data, Manual input, Document. Each is a gap in the ledger with its own
evidence, not a licence to write `node` and move on. **[CORRECTED 0.3.z: the
sixteen is the REPOSITORY'S record, and the record is short. Counted against
ISO 5807's readable pp. 1–8, clause 9 names twenty-one symbols — ten data,
seven process, four line — so the record omits six readable data symbols
(Internal storage, Sequential access storage, Direct access storage, Card,
Punched tape, Display) and includes one, Terminator, that sits past p. 8 and
is unread. The stage gap is **fifteen**, not nine. The three spelled roles do
not change; the denominator does. Enumeration and evidence in
the project’s working record; class analysis in
`decisions/registry.md`.]** (Earlier drafts of this
document said *"around ten symbol kinds"*; that understated the repository's
own record and is corrected here.)

So the two authors who both write `node` are doing different things, and a
reader is entitled to tell them apart: one read a source that did not state
the role; the other did not think. The language cannot distinguish them —
which is exactly why no check flags a bare `node` here, and why the burden is
on the author. If the stage **is** an operation, a test, or an entry/exit,
write the word for it.

**A bare `node` under `flowchart` is ROLE-UNSTATED — it is NOT a `process`.**
The model OMITS `role` there, and that omission is a fourth state, readable
and distinct from all three roles. This is `UNSAFE-DEFAULT-ELIMINATION` §3: a default is legitimate
only when being wrong is harmless, and a flowchart node may be a datastore,
an annotation, a state or a wait — so defaulting to `process` could let the
model assert a falsehood that no inspection of the figure would catch.

### Notation

Geometry is **DERIVED** from the role:

| Role | Derived `shape` |
|---|---|
| `process` | `box` |
| `decision` | `diamond` |
| `terminator` | `rounded` |

This mapping is `SHAPE-ENUM-VOCABULARY`'s own (*"Flowchart shapes unify under the same axis
(decision→diamond, terminator→rounded, datastore→cylinder)"*). The derived
value is materialized into the model's `shape` field exactly as `node`'s
`box` default is.

**`shape=` on a role line is legal and overrides the DRAWING only.** The role
remains the model. No new precedence rule is needed: core §12.7 already says
presentation is not meaning on its own, so `decision d "Kind?" shape=ellipse`
is a decision drawn narrow — and an unfamiliar reader still recovers
"decision" from the word rather than from the outline. This is the case the
production corpus needed: its widest real dispatch is drawn as an ellipse
because ellipses are narrower than diamonds, and under the old spelling that
layout choice deleted the fact that the node was a branch point at all.

The converse also holds and is the reason the vocabulary exists:
`node q "Valid?" shape=diamond` carries **no role**. It is a legal figure and
a pre-migration one.

### The connector is `flowline` (`GENRE-CONNECTOR-SPELLING`) — under `figdown 0.2` (`KEYWORD-RENAME-SCOPE`)

**The spelling is GATED BY THE DECLARED LANGUAGE VERSION**, and that gate is
part of the rule, not a footnote to it:

| header | the connector | the other word |
|---|---|---|
| `figdown 0.1 flowchart` | **`edge`** — exactly as at `v0.1.8` | `flowline` is a line error **naming the version** |
| `figdown 0.2 flowchart` | **`flowline`** | `edge` is the named wrong-word line error |

`GENRE-CONNECTOR-SPELLING` as shipped applied the rename to the **language** rather than to a version
of it, so `figdown 0.1 flowchart` + `edge` — legal at `v0.1.8` — stopped
parsing, with nothing recording that as a decision. **`KEYWORD-RENAME-SCOPE` gates it**: core
§13.0 lets only a MAJOR version remove, so a `figdown 0.1` document keeps the
spelling it was written with. Two spellings inside **one** version would be a
spelling variant, which SYNTAX-STYLE RULE 5 forbids (*two forms of one
construct are justified ONLY when each accepts input the other cannot express*
— `edge` and `flowline` accept the same input, so one MUST be retired, and
RULE 6.2 makes the retired one a line error naming its MIGRATIONS entry); two
spellings across **versions** is ordinary
language evolution, and each version accepts exactly one — which is why
`flowline` under `figdown 0.1` is an error rather than a silent synonym:

```
"flowline" requires figdown 0.2 (this document declares 0.1): under figdown 0.1
genre flowchart spells this "edge". The rename is gated by the language version
— a figdown 0.1 document keeps the spelling it was written with (core §13.0:
only a MAJOR version removes) — so raise the header to figdown 0.2 or write
"edge" (MIGRATIONS 0.2)
```

**`edge` here is supported until v1.0 and no `0.x` may drop it.** The removal
is a scheduled act with its own MIGRATIONS entry, not a judgement that 0.1
feels old. Write new flowcharts as `figdown 0.2` with `flowline`;
`tools/migrate-figdown.js` raises the header **with** the keyword, because a
rewrite that produces `figdown 0.1` + `flowline` produces a document that does
not parse. `statechart` needs no gate of its own: the **genre** requires
`figdown 0.2`, so its vocabulary cannot be reached from a 0.1 document.

**Under `figdown 0.2 flowchart` the line between two steps is spelled
`flowline`, and `edge` is a line error.** *Flowline* is what the flowchart
domain commonly calls the connecting symbol ISO 5807 §9.3.1 names **Line**;
a flowchart is a procedure, not a graph, and `edge` was the graph
word borrowed from DOT before this genre had a vocabulary of its own. Nothing
else changes: `flowline` takes the same operators, the same `[tail]`/`[mid]`/
`[head]` label positions, the same option keys and the same model as `edge`.
The five 0.2.0 corpus figures re-rendered **byte-identically** under the new
spelling — it is a rename, and only a rename.

**The verification status is recorded, not claimed away — and for this word it
is now READ, not pending (`VOCABULARY-SOURCE-ATTRIBUTION`).** §9.3.1 (*Basic line symbol*)
sits **inside** the readable pp. 1–8 and names the symbol **Line**: *"This
symbol represents the flow of data or control."* ISO 5807 nowhere spells it
*flowline*. The criterion the maintainer applied is **the term the domain
actually uses** — draw.io, Visio and the teaching texts all say *flowline* —
corroborated across independent sources, *not* RULE 4.1's requirement of the
standard's exact orthography; that ruling stands, and the keyword does not
move. What changed at `VOCABULARY-SOURCE-ATTRIBUTION` is only the CLAIM: nothing here may say ISO spells
the symbol `flowline`. `terminator`'s own pending status is untouched — §9.4.2
is past p. 8 and remains unread, along with the rest of pp. 9–25.

**The cost, accepted deliberately.** Before 0.2, reclassifying a
flowchart as a statechart changed **line 1 only** — that is how the five corpus
figures migrated at `STATECHART-GENRE-SCOPE`. With per-genre connectors it now rewrites **every
connector line**. The maintainer judged that the one-line convenience was
bought with an imprecision he is not willing to keep; `tools/migrate-figdown.js`
carries the mechanical rule, so the cost is machine-paid, not author-paid.

### No new branch vocabulary

Branch conditions continue to ride the flowline's `[mid]` label, and the
release adds no branch keyword, no guard syntax and no branch marker. Every surveyed
system does the same: ISO 5807 §9.2.2.4 — *"the appropriate results of the
evaluation may be written adjacent to the lines representing the paths"*;
UML's bracketed guard on the outgoing edge; PlantUML's `then (yes)`; BPMN,
whose gateway markers are derived from the outgoing sequence flows'
conditions. A connector role family (`mainline` / `exception` / `loop-back`) is
recorded in `LOGIC-FLOWCHART-GENRE-SCOPE` and guide/layout.md §9 and is entangled with the logic genre;
`class main/retry/fail` is the taught interim.

### Source: why ISO 5807 and not UML

ISO 5807 is a **role** standard, not a geometry one — the opposite of what
the project’s working record originally claimed, and the correction is
annotated there in place. Its own definitions are of the **referent**:

- §3.3 *flowchart*: "…in which **symbols are used to represent operations,
  data, flow, equipment**, etc."
- §9.2.1 *Process*: "**This symbol represents any kind of processing
  function**, for example, executing a defined operation or group of
  operations resulting in a change in value, form or location of
  information…"
- §9.2.2.4 *Decision*: "This symbol represents **a decision or switching type
  function** having a single entry but where there may be a number of
  alternative exits, one and only one of which may be activated following the
  evaluation of conditions defined within the symbol."
- §3.1/§3.2 distinguish *basic* from *specific* symbols by whether "the
  precise nature or form of… the process or data media is known" — a
  statement about the referent, not about the drawing.

**Not one of the seven process-symbol names in ISO 5807 is geometric.**
Contrast Graphviz (`diamond`, `parallelogram`, `trapezium`) and Mermaid
(`diam`, `hex`, `trap-b`, `lean-r`), which are. In ISO 5807 the drawn form
appears only as an unlabelled figure beside each definition, never in the
defining sentence. So **`SHAPE-ENUM-VOCABULARY` is satisfied by borrowing ISO 5807**, and
`SIZE-AND-DIRECTION-KEY-NAMING`/`GENRE-DOCUMENT-CONTRACT` §6(b) therefore prefer it over UML's `action`.

### Verification debt: the spelling of `terminator`

**`terminator` ships on the maintainer's ruling, with two open verifications
recorded here rather than left implicit.**

1. **The spelling.** ISO 5807 §9.4.2 is behind a paywall and only pp. 1–8 of
   25 were available. Secondary sourcing plus **draw.io** and **Visio** say
   *Terminator*; **ANSI X3.5-1970** and **Mermaid** say *Terminal*. Three
   modern tools agree on `terminator`, so that is what ships — but the
   spelling is **PENDING VERIFICATION** against the purchased ISO 5807
   §9.4.2, and **`Z-ORDER-KEY-NAMING` decides it**: take the standard's own spelling in full.
   If ISO says *Terminal*, `terminator` is renamed under `Z-ORDER-KEY-NAMING` with a
   MIGRATIONS entry and a named diagnostic.
2. **The source assignment.** ISO 5807 **§10 (Conventions)** and **§11 (the
   consolidated symbol table)** were also unavailable. If either defines
   symbols by their drawn form, the "ISO 5807 is a role standard" conclusion
   above must be revisited, and with it the choice of ISO over UML.

### What is excluded, and why

The set is deliberately three. Every candidate below was considered and is
recorded as **not shipped**, with its evidence, so that adding one later is a
decision rather than a rediscovery.

This table records **decisions**. The symbol-by-symbol **coverage** view —
every name in this repository's record of ISO 5807 marked *spelled*, *partial*
or *gap*, with the measurement that would close each gap — is the ledger in
the project’s working record.
It lives there because it changes whenever a measurement lands or a paywalled
clause is read, and because it has to be able to say *"unknown"* about the
standard itself.

| Excluded | Reason |
|---|---|
| `predefined process`, `parallel mode`, `loop limit` | ISO's names are **two words**; `GENRE-DOCUMENT-CONTRACT` §6(a) requires one lowercase word, and `SIZE-AND-DIRECTION-KEY-NAMING` forbids substituting a one-word synonym from another source. If evidence later forces them, this is a filed **naming problem**, not a silent rename. |
| `preparation`, `manual operation`, `document`, `display`, `card`, `punched tape` | ISO-only, absent from UML and BPMN; several are 1985 media artefacts. Corpus: 23 `preparation`-shaped nodes, **all** drawn as plain steps; 2 "manual" nodes that are actually software checks; 20 I/O-verb nodes with **no** distinguishing mark. |
| `fork`, `join`, `merge` | **0 occurrences in 3266 nodes and 2684 edges across both downstream trees, 0 in first-party examples, 0 unlabelled merge nodes.** Evidence of no need. Also entangled with `FLOWCHART-GENRE-DESIGN`'s AND/XOR question and `LOGIC-FLOWCHART-GENRE-SCOPE`'s logic-gate family, which core §9 says must be designed together. |
| a loop head / loop bound construct | 21% of figures contain cycles (45 of 227 deduped) with **172 back-edges — not one of which marks the loop**; 32% of those are entirely unlabelled and the rest reuse the ordinary yes/no marker. **The plain back-edge IS the mechanism**, and a `loop`/`while` keyword would state nothing the back-edge does not. |
| a `default` / `otherwise` branch | **0 edges spell `otherwise`, `else` or `default`**; 3 spell `other:`. BPMN itself puts conditional and default sequence flows **below** its 24-element Descriptive conformance class. And the downstream guideline forbids the mixed fan-out such a branch exists to disambiguate. |
| edge roles (`mainline` / `exception` / `loop-back`) | Recorded in `LOGIC-FLOWCHART-GENRE-SCOPE` and guide/layout.md §9; entangled with the logic genre. `class main/retry/fail` is the taught interim. |
| swimlanes / partitions | Not a role — **a container with an axis**. Recorded as the **next flowchart candidate**: it is Mermaid's most-requested flowchart feature (issue #2028, 401 reactions) and exists in UML (`ActivityPartition`), BPMN (`Lane`), PlantUML and Visio. A swimlane partitions **across** the flow, by responsibility. |
| pipeline **phases** — **a SIBLING candidate, added 0.3 (`MEMBERSHIP-KEY-ACCEPTANCE`), not extra weight for the row above** | **A phase is not a swimlane**, and the distinction is not FigDown's invention: **Visio ships the two as separate constructs on orthogonal axes** — swimlanes (bands), one per functional unit, answering *who is responsible*; and **phases** (separators), which cut **across all the lanes** to mark a stage boundary in the process — and a cross-functional flowchart routinely has both at once. **UML's `ActivityPartition` is the actor-ish one**: it partitions actions by the classifier, part or actor that performs them, which is the swimlane row's construct, not a stage divider. A phase is therefore **an ORDERED STAGE-PARTITION ALONG THE FLOW AXIS** — the stages of one flow cut into consecutive named intervals, order-bearing, covering the flow rather than dividing responsibility across it. Neither is a degenerate case of the other and the two must be weighed apart. **The demand is real and was never measured**: the downstream flowchart survey counted 3266 nodes and 2684 edges across 227 deduped figures and **never counted containers at all**, so the thin evidence is thin on both sides — 0 authored uses of `group` here is a real zero, but the absence of demand evidence is an absence of MEASUREMENT. *Reopens on:* a count of downstream production parser specifications whose phases fail to read once rendered from `class`. The taught interim is a `class` per phase; its residual loss is a RENDERER question (adjacency and phase order are not guaranteed), filed in `decisions/registry.md` beside items 26/27, **not** a vocabulary one. |
| `annotation` as a flowchart role | Cross-genre, not flowchart-specific; it belongs to the annotation family and is filed under **`ANNOTATION-LOCATOR-SPLIT`**. Corpus: 65 annotation nodes in 31 figures, 17 of them declaring a `note`/`ann`/`annotation` class, plus two figures using `style=dashed` on an edge to mean "not control flow". |

**Two corroborations for stopping at three.** (1) BPMN ships a
**24-of-133-element "Descriptive" conformance sub-class inside its own
normative specification** — the standard itself concedes that its full
vocabulary is not what people use. (2) zur Muehlen & Recker (CAiSE 2008,
doi:10.1007/978-3-540-69534-9_35) measured that *"less than 20% of BPMN's
vocabulary is regularly used… the average model contains just 9 different
constructs"*.

The **two-keyword alternative** — drop `process` and let a bare `node` under
`flowchart` BE the step, following ISO's own basic/specific structure and
`SPELLING-LENGTH-VS-FREQUENCY`'s "the common case costs zero characters" — was considered and
**rejected on `UNSAFE-DEFAULT-ELIMINATION` §3**; it is recorded with what would reopen it in
requirements-notes `FLOWCHART-ROLE-KEYWORDS`.

## Complete vocabulary (normative)

Every keyword and option key valid in a `flowchart` document, with this genre's
defaults. Generated from the reference engine's behaviour and verified
against it; where this table and the core doc's prose disagree,
the disagreement is a defect — report it.

**NS** = namespace (§1, `GENRE-NAMESPACE`): **C** = the universal core of three —
`figdown` `title` `layout` — identical under every genre and never redefined
(`UNIVERSAL-CORE-KEYWORDS` — a **fixity** guarantee, not a ubiquity requirement: a genre is complete
without any of them beyond `figdown`); **L** = the **layout namespace** (`LAYOUT-ZONE-NAMESPACE`) — the layout zone is a namespace of its own, and every member of
it is genre-independent, so no genre may define, redefine or extend a keyword
inside it; `pin` is its only member (`path` and `routing` were its two
experimental members until `EDGE-GEOMETRY-CONSTRUCTS` withdrew them);
**H** = the **scene host set** — `class`, `flow`, `rank`. Every scene genre
accepts all three and **none of them is subject vocabulary**: `class` is a
styling declaration and `flow`/`rank` are layout intent, so none names a
referent, no genre's domain holds a competing meaning for one, and no genre
can independently earn or lose one (`SUBJECT-VOCABULARY-SCOPE`); **F** =
**`flowchart`'s OWN vocabulary** (`GENRE-VOCABULARY-OBLIGATION`) — declared in this document, which is
normative for it. Four of its members are legal under this genre and no other
(`process`, `decision`, `terminator` — 0.1, `FLOWCHART-ROLE-KEYWORDS`, the first exercise
of `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` by any genre; and `flowline` — 0.2, `GENRE-CONNECTOR-SPELLING`, which **replaces**
`edge` here rather than adding to it). The other two, `node` and `external`,
are spelled by other genres as well, and those are **their own separate
declarations agreeing with this one** (`SUBJECT-VOCABULARY-SCOPE`), not this one shared; **N** = a
nested-genre opener — composition, not `flowchart` vocabulary (§4, `GENRE-COMPOSITION`).

**The NS column changed.** Every row now marked **F** or **H**
that is not one of the four role/connector words was marked **S**, "the scene
namespace shared with `block` and `topology`". There was no such namespace,
only a set of words four genres happened to accept — and five of the words
this table listed under it are not this genre's words at all any more.

**Status** = the `CONSTRUCT-STATUS-TIERS` status (§10): **NORMATIVE** = NORMATIVE, inside the v0.1
conformance surface and the compatibility promise; **EXPERIMENTAL** =
EXPERIMENTAL, the engine accepts it but it is outside both and may change
or be withdrawn in a later `0.x` without a migration entry. Because
`flowchart` is itself an experimental genre, every row below is outside the
conformance surface *as written in a `flowchart` document*; the column
records each construct's **own** status, which is what an author needs when
carrying the same construct into `block`.

| Keyword | Form | NS | Status | Option keys | `flowchart` default |
|---|---|---|---|---|---|
| `figdown` | `figdown 0.1 flowchart` | C | NORMATIVE | — | required, first significant line |
| `title` | `title "<text>"` | C | NORMATIVE | `note` (requires `figdown 0.3`) | absent; `note=` is `title`'s FIRST option key (`DRAWN-ANNOTATION-FORM`) |
| `node` | `node <id> ["label"]` | **F** | NORMATIVE | `shape` `fill` `stroke` `style` `class` `note` (requires `figdown 0.3`) | `shape=box`, label absent; under `flowchart` the model `role` is **ABSENT** — a bare node is role-UNSTATED, never a defaulted `process` |
| `process` | `process <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `note` (requires `figdown 0.3`) | `role="process"`, `shape=box` DERIVED (§Roles) |
| `decision` | `decision <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `note` (requires `figdown 0.3`) | `role="decision"`, `shape=diamond` DERIVED; exits are mutually exclusive |
| `terminator` | `terminator <id> ["label"]` | **F** | **EXPERIMENTAL** | `shape` `fill` `stroke` `style` `class` `note` (requires `figdown 0.3`) | `role="terminator"`, `shape=rounded` DERIVED; spelling PENDING VERIFICATION (§Roles) |
| `external` | `external <id> ["label"]` | **F** | NORMATIVE | **none** | the OFF-PAGE terminus — see the declaration below. Never drawn (`EXTERNAL-EDGE-ENDPOINTS`); since 0.1 it took no paint key (`color=` was its only one, retired by `COLOUR-KEY-STATUS`) and since 0.3 (`PAINT-ORDER-CONSTRUCT`) **no option key at all**; no `note=` either — nothing of it is drawn, so a note would have nothing to stand beside |
| `flowline` | `flowline <a> [tail] <op> [head] <b>` | **F** | **EXPERIMENTAL** | `stroke` `style` `class` `note` (requires `figdown 0.3`) | **`edge` under this genre is a line error (`GENRE-CONNECTOR-SPELLING`)**; op is written form; `[mid]` splits the operator; all three labels take the line's colour (`LABEL-COLOUR-SOURCE`) |
| `class` | `class <id> "<meaning>"` | H | NORMATIVE | `fill` `stroke` `style` | the meaning FIELD is REQUIRED, its VALUE may be `""` (= no meaning claimed, no legend entry — `CLASS-EMPTY-MEANING`); a class a `flowline` joins must not declare `fill=` without `stroke=` — a flowline has no interior, so the two name ONE channel (`INTERIOR-LESS-ELEMENT-PAINT`). Declaring NO paint is legal: the class claims a meaning and the flowline keeps its default line (`CLASS-PAINT-REQUIREMENT`'s second half RETIRED at 0.4, `CLASS-CHANNEL-REACH`) |
| `flow` | `flow right\|down\|left\|up` | H | NORMATIVE | — | **`down`** |
| `rank` | `rank <id>,<id>[,<id>…]` | H | NORMATIVE | — | two or more ids in ONE whitespace-free comma-delimited token; the space form was RETIRED at 0.1; the rest of the line is reserved for future options |
| `layout` | `layout` | C | NORMATIVE | — | opens the layout zone (§3) |
| `pin` | `pin <id> [at=(<x>,<y>)] [width=<px>] [height=<px>]` | L | NORMATIVE | `at` `width` `height` | canvas px. All three keys are OPTIONAL and at least one is REQUIRED; `at=` applies to nodes (including role lines) and `external` endpoints — the group case in `LAYOUT-ZONE-NAMESPACE`'s language-wide rule is unreachable here, since this genre declares no `group` (`SCENE-KEYWORD-MEMBERSHIP`) — and `width=`/`height=` to **nodes only** (`ELEMENT-GEOMETRY-DIRECTIVE`, 0.1 — `size` is retired and its keys moved here) |
| `bitfield` `table` `timing` | see §4 | N | NORMATIVE (`bitfield` `table`) · **EXPERIMENTAL** (`timing`) | — | composition (§4, `GENRE-COMPOSITION`); their child keywords are NOT valid at `flowchart` top level |
| `chart` | `chart <table-id>` | N | **EXPERIMENTAL** | `type` | 0.1 correction: `chart` was legal at a scene document's top level but had no vocabulary row anywhere. It is defined by its reference to a `table` id, and `table` is a legal host keyword in every scene genre, so a scene document can carry both the data and the chart. `type=bar3d` is the only value. Spelled `plot` with `kind=bars3d` until 0.1; `level=` was DELETED at 0.1 (`CHART-LEVEL-KEY`), so `chart <table-id> [type=bar3d]` is the whole grammar. |

**Two rows left this table, and the deletion is recorded rather
than silent.** `path` and `routing` were core keywords until 0.1, then
EXPERIMENTAL members of the layout namespace (`LAYOUT-ZONE-NAMESPACE`), and `EDGE-GEOMETRY-CONSTRUCTS` **WITHDREW** them
from the language along with the four option keys only `path` accepted
(`points=` `routing=` `tailport=` `headport=`). There is **no replacement
spelling** — they were removed, not renamed — so the fix for a document that
used them is to **delete** those lines, which changes the rendered output (the
edge falls back to auto layout; shape it with `rank`, `flow`, declaration order
and `pin`). The evidence: [../../migrations.md](../../migrations.md)
0.1, core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, and `decisions/registry.md`
`LAYOUT-ZONE-NAMESPACE` is unchanged; only its membership is, and it now holds `pin` alone.

### The `external` endpoint — this genre's one subject keyword (NS = F)

    external <id> ["label"]        # no option key at all

**An OFF-PAGE terminus.** It declares that a flowline leaves the charted
procedure, or arrives from outside it, without naming a stage the chart is
making claims about. It is never drawn as a shape (`EXTERNAL-EDGE-ENDPOINTS`): the flowline ends
open at an anchor auto-layout places at the natural margin, and the label,
when written, renders as small muted text just beyond the open end. Two
authored figures use it exactly this way — `examples/packet-ingress.fd` and
`examples/showcase/l2-forwarding-logic.fd`.

**ISO 5807 §9.4.2 already names this concept, and this genre's spelling is
NOT ISO's — stated here rather than left silent.** Everywhere else this
document exercises single-source vocabulary: `process`, `decision` and
`terminator` come whole from ISO 5807 (§Roles, *Source*), and `flowline` is the
flowchart domain's common term for the symbol §9.3.1 names *Line* (`VOCABULARY-SOURCE-ATTRIBUTION`). This
one does not. ISO 5807 §9.4.2's **Terminator** is *"an exit to, or an entry
from, the outside of the procedure"* — an entry or exit at the boundary,
which is the same concept — and §9.4 additionally names the **off-page
connector** for the case where the chart continues on another page.

**The rename RULE 4.1 would point at is BLOCKED, and the blocker is inside
this genre.** ISO's word is *terminator*, and `terminator` is **already this
genre's live keyword**, taken from the same standard for the drawn start/end
symbol. One spelling cannot mean both, and neither meaning is available to
give up: the role keyword is what the 22%-misreading measurement earned, and
the boundary endpoint is what 70–80% of block/flowchart figures contain at
least one of (`EXTERNAL-EDGE-ENDPOINTS`). So the spelling stays `external`, and **ISO has no word
at all for the variant this construct actually is** — a boundary endpoint
that is *never drawn*. ISO 5807 is a standard for drawing flowcharts by hand;
an author with a pen must put a symbol on the paper, so "the endpoint exists
and is not drawn" is not a thing that standard can say.

**This divergence reads better per genre than it ever could
shared.** `block` declares `external` too, and its declaration has **no
source standard behind it at all** and says so; `topology`'s has a
**collision** to warn about — the external route (OSPF Type 5/7, eBGP).
Three genres, one grammar, three different provenances and three different
things a reader needs to be told. The shared paragraph told none of them.

### Withdrawn from `flowchart`

Five words this table used to list are not this genre's words any more. All
five withdrawals were free: `flowchart` is an EXPERIMENTAL genre, outside the
compatibility promise, and `EDGE-GEOMETRY-CONSTRUCTS`'s withdrawal of `path`/`routing` is the precedent for doing it without a version gate.

| Withdrawn | R | Ground |
|---|---|---|
| `group` | `SCENE-KEYWORD-MEMBERSHIP` | **One occurrence in the whole tree, and it was this genre's own reference figure** — a file whose stated purpose is to demonstrate every form of every keyword, so citing it as evidence of need is circular (`decisions/registry.md`). Zero authored uses. Swimlanes, which is what a flowchart container would actually be for, are recorded as the next candidate below and are *"not a role — a container with an axis"*, so a plain `group` was never going to be that construct |
| `threshold` | `SCENE-KEYWORD-MEMBERSHIP` | Zero occurrences, and the concept does not apply: a threshold is a labelled reference value drawn at a percentage of the target's **rendered extent**, and a process box's extent is an artefact of its label length. A line drawn 60% down a `Classify` box asserts nothing a reader can read |
| `band` | `SCENE-KEYWORD-MEMBERSHIP` | Zero occurrences, and a band is a **range** over that same meaningless extent |
| `bundle` | `SCENE-KEYWORD-MEMBERSHIP` | Zero occurrences, and it is an anti-feature here: two flowlines between the same pair of stages are two different **conditions**, and the condition is the whole content of the arc. Drawing a ring round them hides exactly what the figure is for |
| `plane` | `PAINT-ORDER-CONSTRUCT` | **Withdrawn from the LANGUAGE**, with `plane=` and `z-index=`. One occurrence under `flowchart`, in this genre's own reference figure. There is no replacement spelling: paint order is document order, a later line paints on top, and a set of stages forming a logical layer of the SUBJECT is a `class` whose meaning says so (§5, `PRESENTATION-AS-MEANING-CARRIER`) |

### `in=` is withdrawn from `flowchart`

**The withdrawal above stranded an OPTION KEY, and 0.3 (`MEMBERSHIP-KEY-ACCEPTANCE`) finishes
the job.** `in=` states membership and its only value domain is *the id of a
containing `group`* — so once this genre stopped declaring `group`, no such id
could exist in a `flowchart` document and **every value of the key was a dead
end**. In an earlier release, `process a "A" in=g` answered
`unknown group "g"` and **no spelling of `g` succeeded**. An unknown-option
error that names the reason beats a dangling reference no author can satisfy,
so the key is withdrawn from this genre rather than left accepted.

**What was checked before withdrawing the key wholesale**, because a key
stranded on one directive need not be stranded on another. `in=` has exactly
six acceptors in the language: `node`, `process`, `decision`, `terminator`,
`state`, and the pair `threshold` / `band`. The first four are this genre's,
and all four resolve `in=` against declared GROUP ids and nothing else.
`threshold` and `band` are the only acceptors with a wider domain — 0.3
(`MARKER-TARGET-KINDS`) widened theirs to REGION ids — and neither is a `flowchart` keyword
since `SCENE-KEYWORD-MEMBERSHIP`. **The widening never reached `node`**, which is checkable rather
than assumed: a `flowchart` document may declare a region (`bitfield`, `table`,
`timing` and `chart` are `GENRE-COMPOSITION` region openers, legal in every scene genre), and
`node a "A" in=q` over a `table q` still answered `unknown group "q"`. Nothing
in this genre was left un-stranded, which is why the withdrawal is by KEY and
not directive by directive.

**The diagnostic points at `class=`**, because an author who wrote `in=` was
trying to express membership and is owed what expresses it today: declare a
`class` whose label names the phase and write `class=` on each stage — it earns
a legend entry and applies to every member at once. Containment in a flowchart
remains an OPEN question; **swimlanes and phases are the two constructs it is
waiting on, and they are two constructs, not one** (§*What is excluded*).

### Option-key values

| Key | Values | Status | `flowchart` default |
|---|---|---|---|
| `shape` | `box` `rounded` `circle` `ellipse` `diamond` `cylinder` | NORMATIVE | `box` |
| `style` | `solid` `dashed` `dotted` | NORMATIVE | per directive — `solid` on `node`, a role line and `flowline` |

| `fill` | `#rgb` · `#rrggbb` · one of the 147 CSS colour names · `transparent` | NORMATIVE | absent |
| `stroke` | same value set as `fill` — the OUTLINE of anything with an interior, and the WHOLE of a line (`flowline`), which is SVG's own asymmetry | NORMATIVE | absent |
| `class` | id of a declared `class` | NORMATIVE | absent |
| `note` | quoted prose — the DRAWN annotation, on `process`, `decision`, `terminator`, a bare `node`, `flowline` and `title` (`DRAWN-ANNOTATION-FORM`) | NORMATIVE since `figdown 0.3` | absent |
| `at` | `(<x>,<y>)` canvas px — a PAREN POINT, `pin` only | NORMATIVE | optional on `pin` — nodes (including role lines) and `external` endpoints |
| `width` `height` | px number | NORMATIVE | optional on `pin`, **nodes only** — an `external` endpoint or a typed block sizes to its content; at least one of `at`/`width`/`height` is required on the line. Spelled `w=`/`h=` until 0.1; carried by `size` until 0.1 (`ELEMENT-GEOMETRY-DIRECTIVE`) |

`fill=`, `stroke=` and `style=` are all normative:
`stroke=` was promoted by `STROKE-KEY-STATUS` once its use count was re-measured (5 in-repo
at `CONSTRUCT-STATUS-TIERS`; 56+ in-repo and 567 downstream edge-colouring sites now). There is
no text channel — `color=` is retired language-wide (`COLOUR-KEY-STATUS`) and the label
colour is derived from the background it sits on (core §5, `LABEL-COLOUR-SOURCE`).
**Four rows left this table.** `plane=` and `z-index=` were
withdrawn from the LANGUAGE with the `plane` keyword (`PAINT-ORDER-CONSTRUCT`) — a keyword and
its only declaration point move together — and neither names a replacement.
`extend=`, `offset=` and `gap=` left this GENRE with the directives that
accepted them (`band`, `threshold` and `group`, `SCENE-KEYWORD-MEMBERSHIP`); all three are still
live under `block`, which declares those keywords. **`points=`, `tailport=`,
`headport=` and `routing=` had rows here until 0.1**: `path` alone
accepted all four, and `EDGE-GEOMETRY-CONSTRUCTS` withdrew them from the language with it.

**A sixth row left: `in=` (`MEMBERSHIP-KEY-ACCEPTANCE`).** It is withdrawn from this
GENRE, not from the language — it is untouched under `block` and `topology`,
on every directive that accepts it there. The ground and what was checked
first are above, under *`in=` is withdrawn from `flowchart` at 0.3*.

Edge operators: `->` `<-` `--` `<->`. The written form is the model (`READ-SIDE-DETERMINISM`);
`A <- B` and `B -> A` are a *rendering* equivalence only.

Retired spellings, kept only so a stale document gets a named migration
instead of `unknown option`: `kind=` on `node` (→ `shape=`),
`width=`/`height=` on `node` and on a role line (→ a `pin` line), and
`label=`/`taillabel=`/`headlabel=` on the connector (→ inline `[…]` labels).
(`from=`/`to=` on `band` was a fifth; `band` is not this genre's word, so that row moved to [../block.md](../block.md) with the
keyword.) `kind=` is retired **language-wide** (`CHART-BLOCK-NAMING`), not merely on
`node`, and so is `color=` (`COLOUR-KEY-STATUS`) — it named the FILL
in one era and the LABEL in another, and no engine can tell the
two apart, so its message names both eras and hands the choice to a human.

**Renamed.** Each old spelling is now a line error carrying a
named diagnostic that states its replacement; every rename takes the word
from a standard that already means exactly this (`UNSAFE-DEFAULT-ELIMINATION` single-source). **Two
rows left this table and are recorded here rather than dropped
silently:** `via=` → `points=` (`WAYPOINT-KEY-SPELLING`) and `src=`/`dst=` →
`tailport=`/`headport=` (`ENDPOINT-DOCKING-KEYS`). Both renames happened and were correct; `EDGE-GEOMETRY-CONSTRUCTS`
then withdrew the *replacements* from the language with `path`, so all five
spellings are line errors today and none of them names a replacement — the
diagnostic says to delete the line. A rename has a destination; a withdrawal
does not.

| Old | New | R | Why |
|---|---|---|---|
| `boundary` | `external` | `EXTERNAL-ENDPOINT-NAMING` | the ECB analysis pattern's «boundary» is an INTERNAL interface object (CORRECTED 0.3.z: this said "UML's"; the stereotype is not in UML 2.5.1 or ISO/IEC 19505-2 — see decisions/registry.md), C4's `System_Boundary` is the dashed grouping container FigDown already spells `group`, and BPMN's Boundary Event is a third meaning — all three invert or displace the intended sense, which the spec's own prose already stated as "declares an external I/O endpoint" |
| `layer` · `layer=` | *(nothing — the destination is gone)* | `PLANE-KEYWORD-SPELLING`, then `PAINT-ORDER-CONSTRUCT` | `PLANE-KEYWORD-SPELLING` renamed both to `plane` · `plane=` at 0.1, holding that no standard claimed `plane` for a conflicting meaning — a claim made in a paragraph belonging to no genre, and false in `topology`, where a plane is the control / data / management partition. `PAINT-ORDER-CONSTRUCT` withdrew `plane` · `plane=` from the language, so the diagnostic now states the whole chain (`layer=` → `plane=` → withdrawn) rather than ending at a spelling that no longer exists — the `route` → `path` precedent from 0.1 |
| `plot` | `chart` | `CHART-BLOCK-NAMING` | `plot` reads as an imperative — the reason `render` was retired at 0.1 — while every other block opener is a noun, and ECharts, Chart.js and Mermaid all name the object a chart |
| `kind=` | `type=` | `CHART-BLOCK-NAMING` | Vega, Chart.js and ECharts spell the chart-type key `type`; `kind=` was retired on `node` and live on `plot` at the same time, inside one namespace. Its one legal value was renamed `bars3d` → `bar3d` |

**Changed — the annotation family, and this genre no longer
carries it.** `guide` was renamed `threshold` and `band` gained its mandatory
quoted label in that release, while both were still legal here. Neither is
`flowchart`'s word (`SCENE-KEYWORD-MEMBERSHIP`), so the rename and the label rule
are recorded where the keywords now live — [../block.md](../block.md) §2.6
and its declaration section. `chart level=` is DELETED, not renamed (`CHART-LEVEL-KEY`),
and that one still applies here: `chart` is a region opener every scene genre
may write.

### The drawn annotation: `note=` (`DRAWN-ANNOTATION-FORM`)

**`note=` is the annotation that draws.** Under `flowchart` it is accepted on
the three role keywords `process`, `decision` and `terminator`, on a bare
role-unstated `node`, on `flowline`, and on `title`. Its value is
**quoted prose; the quotes are mandatory** (`QUOTING-RULES`):

```figdown
figdown 0.3 flowchart
title "Fig 2-4 — admission" note="ISO 5807 symbols only"
terminator start "Start" note="entered once per packet"
process classify "Classify" note="reads the DSCP, never rewrites it"
decision fits "Fits in queue?"
external drop "to the drop counter"
flowline start -> classify
flowline classify -> fits note="one packet at a time"
```

**Attachment is by SYNTACTIC POSITION** — the note is written on the stage's
or the flowline's own line. There is no id to write, no target key and no
locator, so a chart with two stages both labelled `Retry` has no ambiguity
about which one carries the aside. A `flowline` has no id at all: an attribute
on its line is the only form that could ever reach a connector here.

**It requires `figdown 0.3`.** `flowchart`'s own connector already needs
`figdown 0.2` (`GENRE-CONNECTOR-SPELLING`/`KEYWORD-RENAME-SCOPE`), and `note=` needs `0.3`: under an earlier header
the spelling is still the RETIRED one that meant a never-drawn `description=`
(`DESCRIPTION-KEY-SPELLING`), so the engine names the version and the fix rather than
repainting a tooltip as ink. Raising the section header is the whole
migration.

**`note=` and `description=` divide by AUDIENCE, not by length.**
`description=` reaches the **machine** — no ink beyond an SVG `<title>`
tooltip — and no `flowchart` directive accepts it; it belongs to `bitfield`'s
`field` ([../bitfield.md](../bitfield.md)). `note=` reaches the **human**, and
it ALWAYS draws. Both on one stage is legal and meaningful, and **neither is a
fallback for the other**.

**The author does not place the box (`DOMAIN-CONVENTION-DIRECTIVES`).** `note=` takes no `at=`, no
`side=`, and there is no `left of` / `right of` to write. The engine chooses
adjacency around the stage's or the flowline's final geometry, after every
branch label and arrowhead has been placed, and **reaches for a leader line
only when adjacency fails**. A `title … note=` has no geometry to sit beside:
it draws as a figure-level note at the bottom of the canvas and never takes a
leader. This genre's `flow` default is `down` and its charts grow by
insertion; an annotation pinned to a hand-chosen side would be wrong the first
time a stage was added above it.

**Where a typed slot exists, `note=` is never the right answer.** `flowchart`
has more typed slots than any other scene genre, and each of them says
something a note can only describe:

- **what kind of stage this is** is the role keyword itself — `process`,
  `decision`, `terminator`. A `node "Check"` with `note="this is a decision"`
  asserts nothing a reader may act on; `decision check "Check"` does. And when
  the source genuinely does not state the kind, the answer is the bare `node`
  — role UNSTATED is a value here, not a gap to paper over with prose;
- **a branch condition** is the flowline's `[mid]` label
  (`flowline fits -[yes]-> enqueue`), which is where a reader looks for it;
- **a category** shared by several stages is a `class` meaning, which earns a
  legend entry and applies to all of them at once;
- an endpoint **outside the charted procedure** is an `external`, which is why
  `external` takes no `note=`.

This list is one item shorter than it was. It used to say
"which phase or swimlane a stage belongs to is `in=` or the enclosing
`group`", and neither half of that is available: `group` is not this genre's
word (`SCENE-KEYWORD-MEMBERSHIP`), and `in=` is not this genre's option key (`MEMBERSHIP-KEY-ACCEPTANCE`), the second withdrawal following from the first. **A note is
still not the answer** — the honest position is that `flowchart` has no
containment construct today, that **swimlanes and phases** are the two
constructs the need is waiting on (§What is excluded, where they are recorded
as siblings on orthogonal axes), and that a `class` meaning is the taught
interim, because it earns a legend entry and applies to every member of the
phase at once. What the interim does NOT give is a guarantee that the members
are drawn adjacent or in phase order; that is a renderer question, filed in
`decisions/registry.md` beside items 26/27.

A `note=` is for what none of those hold: the caveat, the measured number, the
sentence about the procedure that the procedure's own shapes cannot carry.

### How this differs from the other genres

**The opening sentence of this section used to be "today the only difference
is a default". It has been false and it is now false four
times over**, which is the argument `SUBJECT-VOCABULARY-SCOPE` makes structurally: a difference
that has nowhere to be declared is a difference nobody maintains.

| | `block` | `topology` | `flowchart` | `statechart` |
|---|---|---|---|---|
| `flow` default | `right` | `right` | **`down`** | `right` |
| the thing | `node` | `node` | `node` | **`state`** |
| the line | `edge` | `edge` | **`flowline`** | **`transition`** |
| own subject vocabulary (`SUBJECT-VOCABULARY-SCOPE`) | `group` `external` `threshold` `band` | `group` `external` `bundle` | **`external` only** | none |
| own keywords no other genre has (`GENRE-VOCABULARY-OBLIGATION`) | none | none | **`process` `decision` `terminator` `flowline`** | **`state` `transition`** |
| Genre status (`CONSTRUCT-STATUS-TIERS`) | NORMATIVE | EXPERIMENTAL | **EXPERIMENTAL** | **EXPERIMENTAL** (needs `figdown 0.2`) |

Every scene genre also accepts the host set `class` / `flow` / `rank` (NS = H
above) and may open a `bitfield`/`table`/`timing`/`chart` region (§4, `GENRE-COMPOSITION`).

The role row is new and was the first real difference: under
`block` or `topology` those three spellings are line errors. The two
vocabulary rows are new (`GENRE-CONNECTOR-SPELLING`/`GENRE-NODE-SPELLING`) and cut in both directions —
`edge` is now a line error *here*, and `flowline` is one under `block`. The
subject row is new: this genre is the **thinnest** of the four
by subject vocabulary, holding one word, and that is the honest count rather
than the five it used to appear to share. Where it and `block` both read
`external`, the two are separate declarations with different provenances —
ISO 5807 §9.4.2 here, no source standard there (see the declaration above).

**Why `node` stays here but not in `statechart`**, since the two rulings look
inconsistent until the reason is stated: under `flowchart` a stage can have a
role the **source does not state**, and `node` is the only spelling for that —
remove it and a transcriber who cannot tell a Process from a Predefined
process must guess, in a spelling that asserts the guess. `statechart` has
**exactly one** kind of node, so `state` loses nothing: with one role there is
nothing to leave unstated. (The reason is *not* the coverage argument this
paragraph used to give — "ISO has ~ten kinds and we carry three". That is a
gap in FigDown, not a fourth state of the figure; see §Roles, *Which of the
four to write*.) The status row
is a statement about convergence rather than about syntax — `block` is the
scene genre v0.1 freezes on, and `flowchart` is still held back because one
tranche of vocabulary is not a converged set (§Roles, *What is excluded*).

`bitfield`, `table` and `timing` own their own child keywords, which are not
valid at a `flowchart` document's top level (§4, `GENRE-COMPOSITION`). Under `GENRE-NAMESPACE` `GENRE-VOCABULARY-OBLIGATION` a genre MAY
spell a keyword the same as `flowchart`'s with a different meaning, and
neither the core rows (NS = C, `UNIVERSAL-CORE-KEYWORDS`) nor the layout-namespace rows (NS = L, `LAYOUT-ZONE-NAMESPACE`)
can ever be redefined — `GENRE-VOCABULARY-OBLIGATION` does not reach inside the layout zone.

The genre token is REQUIRED (§1) and now carries more than a default: it
selects the namespace in which `decision` is a keyword rather than an error.

Two conventions matter for reading procedures:

- **Branch conditions ride the flowline, not the node.** A flowline's `[mid]`
  label is where the condition goes: `flowline q -[yes]-> commit`. A branch whose
  condition is unwritten is a branch a reading agent cannot follow. This is
  the connector's behaviour under every scene genre, not a `flowchart`
  peculiarity — the three genres declare it separately and agree.
- **`shape=diamond` is geometry, not a role.** Drawing a decision as a
  diamond is conventional and permitted, but on a bare `node` it asserts
  nothing: under `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` the shape enum is purely geometric. The fact that a step is a decision is stated by the word
  `decision`; on a document that predates it, that fact must still be
  recovered from the label text and the outgoing labelled edges.

## Semantic model (normative — reading rule, `MEANING-RECOVERY-SOURCE`)

A flowchart's meaning is a **directed procedure**: nodes are steps, flowlines
are transitions, and a flowline's mid label is the condition under which the
transition is taken.

- A node names one step. Its label states what happens there (`FIDELITY-TARGET`).
- A node MAY carry a **role** (`process` | `decision` | `terminator`,
  §Roles). The role is a claim about the step, not about its drawing, and it
  is the model. **An absent role is absent**, not `process`: it means the
  author did not state one.
- A flowline names one transition. Direction comes from the operator; endpoint
  order and operator token are preserved as written (§2.3, `READ-SIDE-DETERMINISM`).
- A node with several outgoing flowlines is a branch point. Which branch fires
  is stated by the flowline labels and by nothing else — not by shape, not by
  colour, not by rendered position.
- Whether a fan-out means "all branches fire" or "exactly one fires" is
  **not expressible in v0.1 for a node with no role**; a reading agent MUST
  NOT assume either. Where the node IS a `decision`, ISO 5807 §9.2.2.4
  settles it: exactly one exit is taken. Making that expressible on any
  fan-out remains `FLOWCHART-GENRE-DESIGN`'s sub-question.
- `flow`/`rank` express reading order; the `layout` zone carries no meaning
  and a reading agent IGNORES it by default (§3, `CONTENT-LAYOUT-ZONE-SPLIT`/`GENRE-NAMESPACE`).

## Errors

`flowchart` adds no error conditions of its own, and the role keywords add
none either — they desugar into `node`'s case, so every one of `node`'s
diagnostics fires on them verbatim, naming the keyword the author wrote.
Its validation profile is the core profile: unknown keyword, unknown or
inapplicable option, unknown `shape`, duplicate id, dangling flowline
endpoint, and the single-valued-directive rules of §8 — all line errors.
(`in=` cycle is a category core §8 reserves and **no `flowchart` document can
reach**: this genre declares no `group` at all, so there is
nothing for `in=` to name and nothing to make a cycle out of — and
the key itself is not this genre's, so every `in=` here is the
named withdrawal error rather than the dangling reference it was for one
release.)

The genre-scoped errors. The first two come from the header genre's allowlist
(core §1, `GENRE-NAMESPACE`) and need no per-keyword code; the third is named per cell:

1. `process` / `decision` / `terminator` written under a genre other than
   `flowchart` is `"<keyword>" is not allowed in genre <g>`.
2. **0.2 (`GENRE-CONNECTOR-SPELLING`):** `edge` written under `flowchart` — and `state`,
   `flowline` or `transition` written under a genre that does not use them —
   is a **NAMED** line error, not `unrecognized line` and not the bare
   allowlist message:

   ```
   "edge" is not the word genre flowchart uses for this — write "flowline":
   the connecting line in a flowchart is a FLOWLINE — the term the flowchart
   domain commonly uses for the symbol ISO 5807 §9.3.1 names "Line". Each
   genre takes the term its own domain uses (block/topology `node` `edge`,
   flowchart `node` `flowline`, statechart `state` `transition`, sequence
   `lifeline` `message`) — run tools/migrate-figdown.js to rewrite it
   (MIGRATIONS 0.2)
   ```

   The author has written a **real construct under the wrong spelling**, which
   is a different situation from an unknown word, so the message names the word
   this genre uses, says why, and names the tool that rewrites the document.

3. **0.3 (`SCENE-KEYWORD-MEMBERSHIP`):** `group`, `threshold`, `band` or `bundle` written
   under `flowchart` is a **NAMED** line error carrying that cell's own
   ground. The author has written a construct that was legal here until this
   release, so `unrecognized line` would send them hunting a typo, and the
   bare allowlist message would tell them nothing about why:

   ```
   "group" is not allowed in genre flowchart — it was WITHDRAWN from this
   genre, not misspelled: `flowchart` no longer declares `group`. … Subject
   vocabulary is per genre (core §3, `GENRE-VOCABULARY-OBLIGATION`): a spelling accepted by several
   genres is several independent declarations, and this genre's was withdrawn
   without touching any other's. (withdrawn, `SCENE-KEYWORD-MEMBERSHIP`; MIGRATIONS
   0.3)
   ```

   `plane` is not in that family: it fires the LANGUAGE-level withdrawal
   ahead of the allowlist, in every genre at once (`PAINT-ORDER-CONSTRUCT`).

## What this genre does NOT own (yet)

**`FLOWCHART-GENRE-DESIGN`(a) and (b) are CLOSED by `FLOWCHART-ROLE-KEYWORDS`.** The closed role set is
`process` / `decision` / `terminator`, and the spelling shape is *scene role
constructs* — three top-level keywords following `external`, not a typed
block following `bitfield`/`table`. What remains open:

- **(c) the migration story for existing `shape=diamond` approximations.**
  Deliberately left non-mechanical: a `shape=diamond` node is *probably* a
  decision and a `shape=rounded` one *probably* a terminator, but "probably"
  is not a rewrite rule, and the 14%-ellipse measurement above is the proof
  that the inverse mapping does not exist either. A pre-0.1 flowchart
  stays valid and readable; it is simply in the pre-migration state (`GENRE-EARNING-THRESHOLD` §4,
  `GENRE-NAMESPACE`'s fallback baseline).
- **The AND/XOR fan-out question** (`FLOWCHART-GENRE-DESIGN`'s sub-question): `decision`
  settles it for a decision's exits and for nothing else.
- **Everything in *What is excluded* above**, each with its measured
  evidence. Swimlanes are recorded there as the next candidate.
- **Containment, which this genre now has NO construct for.** `group` was
  withdrawn against one circular occurrence and zero authored
  uses (`SCENE-KEYWORD-MEMBERSHIP`), and with it went the only value `in=` could name here — so
  `in=` itself was withdrawn (`MEMBERSHIP-KEY-ACCEPTANCE`), the key being stranded
  rather than merely unused. That is a gap stated rather than papered over,
  and it is **two** candidates, not one: a **swimlane** — *"not a role — a
  container with an axis"*, partitioning ACROSS the flow by responsibility —
  and a **phase**, an ordered stage-partition ALONG the flow axis (§What is
  excluded records them as siblings, with Visio shipping both and UML's
  `ActivityPartition` being the swimlane one). Taking a plain box because a
  plain box was already on the allowlist is exactly the borrowing `SUBJECT-VOCABULARY-SCOPE` ends.
  `class main/retry/fail` is the taught interim, as it is for connector roles.
  **The demand for phases is real and was never measured** — the downstream
  survey counted 3266 nodes and 2684 edges across 227 deduped figures and
  never counted containers at all — and the condition that reopens it is a
  count of downstream production parser specifications whose phases fail to
  read once rendered from `class` (`MEMBERSHIP-KEY-ACCEPTANCE` §4).

Mermaid is recorded in prior-art.md §5 as
positive prior art for "each genre owns its vocabulary" and **negative**
prior art for how flowchart expresses role: it carries decision/process/
terminal on the bracket shape, which is precisely what `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS` forbids here.
FigDown's role vocabulary is words, and the geometry is derived from them.

## Example

```figdown
figdown 0.2 flowchart
title "Ingress ACL Decision"
terminator start "Frame received"
process    parse "Parse headers"
decision   acl   "ACL match?"
terminator drop  "Drop + increment counter"
process    fwd   "Forward to L2 lookup"
flowline start -> parse
flowline parse -> acl
flowline acl -[no match]-> fwd
flowline acl -[deny rule]-> drop
```

The same figure written before 0.1 — `node acl "ACL match?"
shape=diamond` — still parses and still renders. It simply says less: the
model records a geometry where this one records a role.
