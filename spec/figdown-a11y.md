# FigDown Accessibility Profile — profile 1

> Status: **normative for the PROFILE**, not for the language. Nothing here
> adds, removes or changes a FigDown construct, a model field or a byte of
> any artifact rendered without the `with-a11y` option: every rule below is
> either a decision already RULED in `decisions/registry.md`
> (`ACCESSIBILITY-PROFILE`, `ACCESSIBLE-DESCRIPTION-SOURCES`, `ACCESSIBLE-TEXT-EMISSION`) or a direct implementation of one. §2.2's declaration
> field is `figdown-manifest.md`'s (`MANIFEST-ACCESSIBILITY-ROLE`); this document only points at it.
> Where this document
> and `decisions/registry.md` disagree, the proposal is
> the reasoning record and this document is the rule — read the proposal for
> WHY, read this document for WHAT.
>
> **Audience: a publisher who wants a figure to say what it is to a reader
> who cannot see it**, and any tool that checks such a claim. A renderer is
> not this document's audience in the way a publisher is: §1 is explicit
> that a renderer emitting no accessibility markup stays a conforming
> renderer, which is the whole shape of this profile.
>
> Provenance: `decisions/registry.md` (filed as
> `ACCESSIBILITY-PROFILE`; ruled 2026-08-22 as `ACCESSIBILITY-PROFILE`, `ACCESSIBLE-DESCRIPTION-SOURCES`, `ACCESSIBLE-TEXT-EMISSION`), and the 1.0 gate's
> criterion **P2** in `decisions/registry.md`. The companion profile
> for where a figure's knowledge came from and how far anyone has checked it
> is [`figdown-manifest.md`](figdown-manifest.md) (`PUBLICATION-MANIFEST-PROFILE` / P1,
> ruled as `PUBLICATION-MANIFEST-PROFILE`); its `accessibility` block (§3.7 there) is the pointer
> that this profile's description states fill in.
>
>
> **Section numbers §0–§11 are stable.** Cite them; do not renumber.

## 0. What this profile is, in one page

A published FigDown figure already carries its own meaning in text — the
`.fd` source travels inside the `.svg` (core §7) — and yet, measured
2026-08-22 across two corpora totalling 706 figures, **not one artifact
carried a role, an `aria-*` attribute, a root `<title>` or a `<desc>`.**
The name was already authored in 90% of sources here and 80% downstream;
nothing carried it into the picture.

| Channel | What it answers | Who owns it | Where |
|---|---|---|---|
| **Name** | what this figure IS, in one phrase | the AUTHOR, via `title` | artifact root `<title>` (§3); embed `alt` (§6) |
| **Description** | what it SAYS, in a paragraph | the PUBLISHER, with a review state | artifact root `<desc>` (§4) |
| **Structure** | the elements a reader can walk | the ENGINE | the shapes, their per-element `<title>`s, and the role that decides whether any of it is exposed (§2, §5) |

**The profile: a figure PUBLISHED under it carries a role, a non-visual
name, and — when it has one — a description whose review state a machine can
read.** That is a rule about publishing, not about rendering:

> **A renderer that emits nothing accessible is still a conforming
> renderer.** This profile binds what leaves a repository, never what an
> engine must do.

The reason is the one `ACCESSIBILITY-PROFILE` adopted: a generated description
must never be silently authoritative, and the only place a review can be
recorded is the publication layer. An engine has no reviewer.

**What an artifact rendered under this profile looks like**, in full:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="…" width="…" height="…"
     font-family="…" role="graphics-document">
  <title>TCP Connection State Machine (RFC 9293, Figure 5)</title>
  <desc data-desc-state="derived">Topology figure "…". 8 nodes, …</desc>
  <defs>…</defs>
  …
</svg>
```

**What this profile does not do**, named here and stated in full in §8: it
does not mandate a renderer, does not change the language, does not make
`title` mandatory in the grammar, does not claim conformance to any
accessibility standard, and is outside the `INDEPENDENT-IMPLEMENTATION-CRITERION` 1.0 conformance claim.

**Requirement keywords.** The key words of BCP 14
([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119),
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) are used in this document
as core **§0.1** declares them, and only when they appear in all capitals.
Its zh-tw twin keeps the English keywords rather than translating them, and
says so in the same place.

**Conformance classes, and the one noun here that is a person.** The class
this profile binds is the **Publisher** (core **§0.2**, `CONFORMANCE-CLASS-LIST`) — the
**PUBLISHER** of §0's ownership table. The table's other two owners are not
classes it binds: **ENGINE** is §0.2's label for Parser ∧ Renderer, which
§1.1 leaves in the MAY column on purpose, and **AUTHOR** is not a conformance
class at all — a requirement phrased on an author is a requirement on the
**Document** (§0.2). The *verifier* named here is the manifest profile's
local role, borrowed, not a class. **And this document's *reader* is a human
being** — the person a screen reader speaks to — never core §12.7's Reading
agent, which reads a model; what this profile owes the first says nothing
about the second.

---

## 1. The renderer / publication split

### 1.1 A renderer owes nothing here

`ACCESSIBILITY-PROFILE` rules the profile into existence as a **publication-level requirement,
renderer-optional**. Restated as the table the proposal's §3.6 gave and
this document adopts:

| | Renderer | Publication under this profile |
|---|---|---|
| root `<title>` from `title` | MAY | **MUST** (§3) |
| a role | MAY | **MUST** (§2) |
| root `<desc>` | MAY | **MUST**, with a state, **when a description exists** (§4) |
| description state machine-distinguishable | MAY | **MUST** (§4.3) |
| `aria-hidden` on decoration | MAY | MAY (§5) |
| embed `alt` | n/a | **MUST** ([`host-profile.md`](host-profile.md) §1.2) |
| `lang` on the root | MAY | SHOULD |

The reference engine takes the MAY column and makes it reachable: see §1.3.

### 1.2 Why the split, and not a default

Core §7 makes an artifact a pure function of (source, recorded options) and
`RENDERING-DETERMINISM` promises byte-identical output for one engine version. Adding any of the
MAYs above to DEFAULT output changes the bytes of **every** artifact and
every golden in a tree. `ACCESSIBLE-TEXT-EMISSION` ruled the two honest routes and took the first:

1. **a render option** — `with-a11y`, recorded in `data-render-options` the
   way `with-title` already is (`TITLE-RENDER-DEFAULT`'s mechanism), leaving default output
   untouched. **ADOPTED, and this is what ships.**
2. **default emission**, handled as a core §13 version event with its own
   migration entry and golden move. **REGISTERED as explicit intent for the
   next language release (0.6 or 1.0)** — the project is committed to it,
   without a date.

So an artifact that carries none of this is not non-conforming; it is an
artifact that was not published under this profile.

**`FIGDOWN_VERSION` is NOT bumped for route 1 (`VERSION-EVENT-TRIGGER`).** `--with-a11y`
changes no DEFAULT output — that is the whole point of taking route 1 rather
than route 2 — so an artifact rendered by a build with this option
available and one without it, both invoked without the flag, are
byte-identical. `FIGDOWN_VERSION`'s job is to identify the bytes an engine
produces (core §13), and route 1 produces no new bytes by default, so it
earns no bump. The new capability rides the version bump route 2 will need
when default emission lands.

### 1.3 How an artifact CLAIMS this profile

**By its recorded render options, and by nothing else.** An artifact
rendered `with-a11y` records `with-a11y` in `data-render-options` (core §7);
that string is the claim, it is the only claim, and it is what the verifier
scopes on (§7). Two consequences, both deliberate:

- An artifact rendered without the option is **out of scope**, not failing.
  A gate that failed every artifact in a tree the day the profile shipped
  would be measuring the profile's newness, not anyone's conformance.
- Two options are orthogonal and may both be in force. `with-title` (`TITLE-RENDER-DEFAULT`)
  decides whether the name is drawn as ink; this profile decides the
  accessible name. **A figure with both does not get two names**: one is
  `<text>` in the picture, the other is a `<title>` that is not rendered at
  all (SVG 1.1 §5.4). When both are recorded the value is
  `with-title with-a11y`, in that order, single-space separated (core §7).

---

## 2. The role

### 2.1 `graphics-document` is the requirement

> A published artifact's root `<svg>` **MUST** carry a role. The role
> **MUST** be `graphics-document` unless the publisher declares a downgrade
> under §2.2.

This is `ACCESSIBILITY-PROFILE` item 2, and it **supersedes `ACCESSIBILITY-PROFILE`'s own filed wording**, which
named `role="img"`. Three reasons, in the order a reader should check them:

1. **It states an existing fact rather than changing one.** SVG-AAM §5.2.55
   already maps a bare `<svg>` to `graphics-document` by default, so an
   artifact that says nothing is already a graphics document. A profile
   should have to argue for the change, not for the status quo.
2. **The W3C says so for exactly this class of picture.** WAI-ARIA Graphics
   Module §4.1: *"In general, authors SHOULD use the graphics-document role
   for structured graphics such as charts, maps, diagrams, technical
   drawing, blue prints and instructional graphics."*
3. **`img` costs a channel this project already emits.** WAI-ARIA 1.2 §5.4
   gives `img` **Children Presentational: True**, which flattens the graphic
   to one node and discards per-element `<title>` elements — **967 of them**
   across the two measured corpora (95 here, 872 downstream). The Graphics
   Module's own distinction is the same one FigDown exists to make:
   *"Relative to an img, a graphics-document is distinguished by the
   structured nature of its content."*

### 2.2 `img` as a DECLARED downgrade, and the naming rule that comes with it

`role="img"` has a real case — a small figure whose meaning is entirely in
its name, published where structural traversal would be noise. It is
therefore **admitted, and declared**:

> A publisher choosing `role="img"` **MUST** record the choice in the
> figure's manifest, in the `accessibility` block
> ([`figdown-manifest.md`](figdown-manifest.md) §3.7). A flattened graphic
> is a decision about a reader, not a rendering detail.

**Where in that block: `accessibility.role`, closed the same day the gap was
found (`MANIFEST-ACCESSIBILITY-ROLE`).** The manifest profile's `accessibility` block shipped CLOSED
— `state`, `by`, `date`, `of_source_sha256`, `additionalProperties: false`,
with `^x-` as the one reserved door — with none of those four fields able to
record a role, so the rule above was stated as `ACCESSIBILITY-PROFILE` ruled it while
mechanically unsatisfiable for one morning. `role` (`"graphics-document"` or
`"img"`, OPTIONAL, absent meaning the default) closes that gap
([`figdown-manifest.md`](figdown-manifest.md) §3.7; `MANIFEST-ACCESSIBILITY-ROLE`): a publisher
choosing `role="img"` writes `"accessibility": { "role": "img", … }` beside
the artifact, and `tools/a11y-check.js` assertion D now checks the real
fact — whether the two agree — rather than reporting that there was nowhere
to check (§7, assertion D).

> Under `role="img"` the accessible name **MUST** come from `aria-label` or
> `aria-labelledby`, not from a child `<title>` (WAI-ARIA 1.2 §5.4). Under
> `role="graphics-document"` a child `<title>` suffices (SVG-AAM §4.1.2).

**The two roles need different name markup, which is why role and naming are
one rule and not two.** The reference engine writes only
`graphics-document` and only a child `<title>`; `img` and `aria-label` are a
publisher's act, produced by a publication pipeline, never by the renderer.

---

## 3. The non-visual title

### 3.1 First child of the root, text from `title`, unmodified

> A published artifact carries, as the **FIRST child** of its root `<svg>`,
> a `<title>` whose text is the document's `title` string — **unmodified**:
> not truncated, not prefixed, not translated, not invented.

- **The source of truth is the semantic source.** No renderer invents a
  name.
- **Placement follows SVG 1.1 §5.4** (*"any 'title' element should be the
  first child element of its parent"*) and the existing `DESCRIPTION-KEY-SPELLING` rule that a
  `<title>` names its parent.
- **It is not ink.** SVG 1.1 §5.4: `title` and `desc` *"are not rendered as
  part of the graphics"*. This is the whole of the difference from `TITLE-RENDER-DEFAULT`'s
  `with-title`, and §1.3 states the orthogonality.

### 3.2 First section wins

A multi-section `.fd` has more than one `title` line and produces **one**
artifact with **one** root.

> The profile takes the **FIRST** section's `title`, and states that it
> does.

Concatenating would invent a sentence no author wrote, and no syntax names a
section ([`host-profile.md`](host-profile.md) §3), so there is nothing else
to take. A publisher who wants a particular name for a multi-section figure
has the ordinary remedy: write it first.

### 3.3 A figure with no `title` is not publishable — and that is not a language change

> A figure whose source has no `title` line **MUST NOT** be published under
> this profile until it has one.

6 of 62 sources here and 126 of 645 downstream are in this state. Two
sentences keep this from being read as more than it is:

- **`title` stays OPTIONAL in the grammar.** An untitled figure still
  parses, still renders, still means what it says. This is a policy on what
  leaves a repository under this profile, not a core-language ruling
  (`ACCESSIBILITY-PROFILE`).
- **The engine does not enforce it.** Rendering `with-a11y` a figure with no
  `title` emits no root `<title>` and no error. Unpublishability is this
  profile's rule and the verifier's job (§7 assertion A), never the
  engine's.

---

## 4. The description

The item this profile was raised for, and the only channel where something has to
be written that nobody has written: `description=` is a `field`/`message`
key (core §10), there is no figure-level equivalent, and **zero** of 706
measured figures carried a `<desc>`.

### 4.1 Three admissible sources (`ACCESSIBLE-DESCRIPTION-SOURCES` item 4)

| Source | What it is | Trust |
|---|---|---|
| **authored** | a human wrote a description of this figure | as good as the author |
| **derived** | a deterministic projection of the model into prose | exactly as good as the model, and no better |
| **generated** | a model that was not constrained to the semantic model wrote it | unknown until someone checks |

**`derived` is admissible.** `ACCESSIBILITY-PROFILE` filed the requirement as *"reviewer-approved
text (not free LLM generation)"*; `ACCESSIBLE-DESCRIPTION-SOURCES` supersedes that blanket reading **in
part**. The ban on **silent, unmarked machine text stands permanently**. The
ban on `derived` text specifically is **declined**, because a derived
description is not free generation: it is a function of the model, it is
reproducible, and it is constrained by the inference classes core §12.7.1–
§12.7.2 already carry. Banning it would ban the one description producible
at corpus scale without a human per figure.

### 4.2 The five states (`ACCESSIBLE-DESCRIPTION-SOURCES` item 5)

| state | meaning | who may set it |
|---|---|---|
| `absent` | no description exists. **Not** "the figure needs none" | — |
| `derived` | produced mechanically from the model, by a named producer and version. Authoritative about the MODEL, and about nothing else | the tool |
| `generated` | produced by a model that was not constrained to the semantic model. **Never publishable on its own** under this profile | the tool |
| `authored` | a human wrote it | the author |
| `reviewed` | a human read it against the figure and accepted it; `by` and `date` recorded, **bound to the source hash** | anyone who is not its writer |

The binding for `reviewed` is the one
[`figdown-manifest.md`](figdown-manifest.md) §3.6 already uses for review
state: `accessibility.of_source_sha256` equals `source.sha256`, or the claim
is STALE — a description reviewed against one source is not reviewed for the
next.

> **`generated` is never publishable on its own.** A publisher may pair it
> with an in-text disclosure sentence (§4.3 way 2) as their own option; that
> does not make it publishable under this profile.

### 4.3 Machine-distinguishability (`ACCESSIBLE-DESCRIPTION-SOURCES` item 6)

> A description whose state is `derived` or `generated` **MUST be
> machine-distinguishable in the published artifact.** A reader must never
> be unable to tell whether a person stands behind the sentence.

Two carriers are ADOPTED **together**, and the third is rejected as a
default:

1. **a `data-*` attribute on the `<desc>`** — cheap, invisible, and in the
   artifact's existing `data-*` idiom. The reference engine writes
   `data-desc-state="derived"`. **ADOPTED.**
2. **a sentence inside the description text** — **REJECTED as the default**:
   it enters the text a screen reader speaks, for every reader, whether or
   not the flag matters to them. Kept only as a publisher's option for
   `generated`, which is unpublishable alone regardless.
3. **the manifest** ([`figdown-manifest.md`](figdown-manifest.md) §3.7) —
   **ADOPTED, as the evidence.** Manifest-*only* is rejected because the
   artifact travels alone: a `<desc>` with no manifest beside it would read
   as authoritative with nothing to say otherwise.

So: **the artifact carries the flag, the manifest carries the evidence.**

### 4.4 The derived content rules, per genre — and the boundary

`ACCESSIBLE-DESCRIPTION-SOURCES` item 7 ruled content rules for **three** genres. They are stated here
as the rule a producer follows, and the reference producer follows them:

- **topology** — the figure's name; counts of nodes, connectors and groups;
  the named nodes; each group's members; each declared `class` and its
  stated meaning; the flow direction.
- **bitfield** — word width, numbering base and bit order, then the fields
  in order with their widths.
- **sequence** — lifelines in order, then messages in their stated total
  order, with fragments named.

**Three implementation readings this document states rather than leaves to a
reader**, each chosen because the model decides it:

- *"the named nodes"* is implemented as **every node in declaration order,
  identified by its id and, when the model carries one, its label**. The
  renderer's substitute-the-id-for-an-absent-label rule (`OMITTED-LABEL-RECORDING`/`EMPTY-LABEL-STATE`) is a
  DISPLAY rule and is deliberately not run here: the model records absence,
  and promoting an id to a name would assert a name nobody wrote.
- *"each declared `class` and its stated meaning"* inherits the derived
  legend's own filter (`PRESENTATION-AS-MEANING-CARRIER`, core §5): a `class x ""` states no meaning,
  prints no legend entry, and makes no sentence here.
- *"messages in their stated total order"* is the model's own ordering key —
  source line, ascending — because a `sequence` figure's time axis IS
  declaration order and it is total (`SEQUENCE-GENRE-VOCABULARY`).

**The boundary, stated as a deliberate limit and not an oversight:**

> **A genre with no ruled content rules gets NO derived description.** The
> state stays `absent`.

| genre | derived description | why |
|---|---|---|
| `topology` | **yes** | content rules ruled (`ACCESSIBLE-DESCRIPTION-SOURCES` item 7) |
| `bitfield` | **yes** | content rules ruled |
| `sequence` | **yes** | content rules ruled |
| `block` | no | no ruled content rules. Its model shape resembles `topology`'s, which is exactly why extending to it silently would be design rather than implementation |
| `flowchart` | no | no ruled content rules |
| `statechart` | no | no ruled content rules |
| `table` | no | no ruled content rules |
| `timing` | no | no ruled content rules |
| the experimental `chart` region | no | no ruled content rules; experimental (`CONSTRUCT-STATUS-TIERS`) |

The reason is one sentence: **inventing content rules for an unruled genre
would be a second, unreviewed specification** — the same objection `PUBLICATION-MANIFEST-PROFILE`
raised against building a verifier before its producer existed. An author
who wants a description for one of these figures has the route the state
vocabulary already provides: write an `authored` one through the publication
layer.

A derived description also does not attempt to be a complete rendering of
the model. It covers the ruled inventory and nothing else: externals,
bundles, pins, bands, thresholds, regions composed into a scene, and states
in a sequence are all model content that a derived description is silent
about. Silence under-asserts, which is safe; §4.5 is the direction that is
not.

### 4.5 The negative rule — the operative half

> A derived description **MUST NOT** state what the model does not assert.
> No causality. No "this shows how X works". No count the model cannot
> produce.

This is `ACCESSIBLE-DESCRIPTION-SOURCES`'s own emphasis and the reason the content rules above are
inventories rather than narratives. The standing example is the cost
recorded at `MULTICAST-MESSAGE-DELIVERY`: a synthetic medium lifeline puts
two ordered messages in a model where the
fact is one fan-out, and a derived description would repeat that
overstatement **in prose, to a reader who cannot see the picture to doubt
it**. A wrong sentence is worse in this channel than in any other, because
it is the only one that reader gets.

---

## 5. Decoration versus ink — a weak rule, with its inventory

> A publisher **MAY** mark purely decorative ink `aria-hidden="true"`.
> Nothing REQUIRES it. An element carrying a `data-*` identity
> (`data-node`, `data-edge`, `data-group`, `data-cell`, `data-lasso`) is
> **never** decorative and **MUST NOT** be hidden. Text a reader needs — a
> label, a ruler number, a legend entry — **MUST NOT** be hidden under any
> circumstances.

**It is weak deliberately.** WAI-ARIA 1.2 §6.7 makes `aria-hidden` a
cautious MAY for authors, conditioned on equivalent meaning staying exposed.
Turning that MAY into a MUST here would be a stricter rule than the standard
it cites, on zero measurement.

**The inventory, from the engine's own output**, recorded so that a future
tightening ruling starts with the list already made rather than re-deriving
it: arrowhead markers (`arr`), the hatch `pattern`, group rectangles and
their name strips, band fills, bundle lasso ellipses, port squares, bitfield
ruler ticks and their numbers, the derived legend's swatches, and the drag
affordance `style="cursor:move"` that ships in every published artifact.
**This inventory is not itself normative** — it names candidates, not
decoration.

**The reference engine emits no `aria-hidden` at all**, and neither
`aria-hidden` nor `aria-label` is in the Safe SVG output vocabulary (core
§15.2), for the same reason: a name that nothing emits does not belong in a
measured set.

---

## 6. The embed's `alt` text — by reference

**The rule lives in [`host-profile.md`](host-profile.md) §1.2 and is not
restated here.** `ACCESSIBLE-TEXT-EMISSION` placed it there deliberately: it is an EMBED-side rule
binding a Markdown author and a host, and §1.2 is where the embed convention
already lives. `tools/alt-check.js` (`gate:alt`) checks its cheap half over
this repository's whole Markdown corpus, every run.

Two facts this profile relies on and does not re-derive:

- For a reader who cannot see the drawing of an embedded artifact, the
  `alt` is the whole of what the embed says: HTML-AAM §3.5.56 maps `<img>`
  to the `img`/`image` role with `alt` as its accessible name, and §3.5.57
  maps an empty `alt` to `none`/`presentation`. **The artifact's own role,
  `<title>` and `<desc>` are not what that reader receives.** An artifact
  conforming to §2–§4 and an embed conforming to host-profile §1.2 are
  separately conformant things.
- The W3C's tutorial guidance for complex images asks for a two-part text
  alternative, short plus long. FigDown's answer to the second part already
  exists and already travels: **the `.fd` source is the long description**,
  and host-profile §1.2's `source:` footer is the pointer to it.

---

## 7. The verifier — six assertions

`tools/a11y-check.js` (`gate:a11y`) implements the assertion set `ACCESSIBLE-TEXT-EMISSION` ruled,
at the severities ruled, with one exception noted below.

| | assertion | severity |
|---|---|---|
| **A** | every published artifact has a root `<title>` and it equals the source's first `title` string | **fatal** |
| **B** | a `<desc>`, when present, has a state, and a `derived`/`generated` state is machine-distinguishable | **fatal** |
| **C** | a `generated` description is not published | **fatal** |
| **D** | every artifact declares a role, and a role of `img` is declared in the manifest | **warn** |
| **E** | every Markdown embed of a `.svg` in the tree has a non-empty `alt` | **fatal** |
| **F** | no element carrying a `data-*` identity is `aria-hidden` | **fatal** |

**Assertion E is NOT implemented by `tools/a11y-check.js`.** It shipped
ahead of the rest, on `ACCESSIBLE-TEXT-EMISSION`'s own direction, as `tools/alt-check.js`
(`gate:alt`) — it needed no engine change and the corpus passed it clean
(106/106 here, 797/797 downstream). Reimplementing it here would be a second
copy of one rule, which is the drift this project's gates exist to prevent.
`gate:a11y` names `gate:alt` as E's owner and checks nothing of it.

**Assertion D's severity is `warn`, as filed and as ruled.** `ACCESSIBILITY-PROFILE` settled
which role is correct; `ACCESSIBLE-TEXT-EMISSION` explicitly did not additionally tighten D. A
role of `img` with no manifest declaring it is reported and does not fail.
**This stays true after `MANIFEST-ACCESSIBILITY-ROLE`.** `MANIFEST-ACCESSIBILITY-ROLE` gave D a real field to check
(`accessibility.role` — [`figdown-manifest.md`](figdown-manifest.md) §3.7)
in place of the earlier absent-field gap, so D now checks the actual
agreement between the artifact's `role="img"` and the manifest's declaration
rather than just the field's existence — but `MANIFEST-ACCESSIBILITY-ROLE` is a manifest-schema
change, not a re-ruling of D's severity, and §10's "publication scope for
assertion D" question is untouched by it: the two questions are separate,
and only the first is what `MANIFEST-ACCESSIBILITY-ROLE` closes.

### 7.1 Scope: artifacts that CLAIM the profile

> `gate:a11y` checks exactly those artifacts whose `data-render-options`
> contains `with-a11y` (§1.3). An artifact rendered without the option is
> **reported as out of scope**, never failed.

This follows from §1.1 — a renderer owes nothing — and from arithmetic: on
the day this profile shipped, 61 of 61 artifacts in this repository were out
of scope. A gate that failed them would be reporting the profile's age.

> **Zero in-scope artifacts is an honest result, not a failure.** The gate
> says so, in as many words, and exits 0. Its fixture suite runs regardless,
> so the gate is never vacuous.

The verifier also checks `tools/a11y-fixtures/`: valid fixtures must pass,
and each invalid fixture must fail **for the reason its `.why.txt` records**
— the same discipline `tools/manifest-fixtures/` uses.

### 7.2 The producer corpus, rendered fresh

The gate carries a third corpus, for the reason `tools/safe-svg-check.js`
states about its own fixtures: **the profile is a property of the PRODUCER,
and a stored artifact only proves what the producer did once.** So every
`.fd` under `examples/` and `figures/` is re-rendered under `--with-a11y` at
gate time and checked. Two kinds of finding, and they are not the same kind
of fact:

- a **producer defect** (assertions B, C, F, and A's equality half) is
  **fatal**;
- an **author fact** (assertion A's presence half — a source with no `title`
  line) is **counted**, not failed. Those figures are not published under
  this profile and nothing claims they are; the count is a **readiness
  census** of what §3.3 would cost, which is the number a future
  default-emission release (§1.2 route 2) will need and nobody has had.

---

## 8. What this profile does not do

Named so that silence is not read as permission.

- **It does not mandate a renderer.** A renderer that emits no
  accessibility markup stays conforming (§1.1). This is a profile for
  publication.
- **It does not change the language.** No directive, no source-grammar
  option key, no model field. `description=` stays exactly what core §10
  defines — a `field`/`message` acceptor, *"an SVG `<title>` tooltip and
  nothing else"* — and gains no figure-level sibling. The figure-level
  description lives in the artifact's `<desc>`, written by publication
  tooling, never by the language.
- **It does not make `title` mandatory in the grammar** (§3.3).
- **It does not claim conformance to any accessibility standard.** It cites
  six W3C specifications to decide a handful of questions. A claim that a
  FigDown artifact *conforms* to WCAG would be a claim about a page, not
  about a figure, and nothing here supports it.
- **It does not say a screen reader exposes an SVG's internal accessibility
  tree through an `<img>` element.** That is implementation behaviour and
  this profile has verified it against no specification. §6 rests only on
  the HTML-AAM mapping, which is enough for the rule it states.
- **It does not require `aria-hidden` on anything** (§5).
- **It is not in the `INDEPENDENT-IMPLEMENTATION-CRITERION` exercise's input.** The 1.0 adversarial exercise
  hands a reader the frozen spec and the normative conformance partitions;
  a non-core profile is in neither, so no second implementation is measured
  against it and profile conformance is outside the `INDEPENDENT-IMPLEMENTATION-CRITERION` conformance claim.
- **It does not describe every genre.** §4.4 names which genres a derived
  description covers and which it does not.
- **It does not authenticate anything.** `data-sha256` proves a picture
  matches the text beside it and nothing more (core §15.6); the same limit
  applies to a description bound to that hash.

---

## 9. Claim → anchor

Every normative sentence above, and the ruling, core section or shipped
check it resolves to.

| # | Rule (§) | Anchor |
|---|---|---|
| 1 | The profile is a PUBLICATION requirement; a renderer emitting nothing accessible stays conforming (§0, §1.1) | `ACCESSIBILITY-PROFILE` item 1 |
| 2 | Emission takes the render-option route now (`with-a11y`), default emission registered for a later release (§1.2) | `ACCESSIBLE-TEXT-EMISSION` item 10; core §7 (render options), core §7/`RENDERING-DETERMINISM` (the byte-identity promise the route protects) |
| 3 | An artifact claims the profile by `with-a11y` in `data-render-options`, and only so (§1.3) | `ACCESSIBLE-TEXT-EMISSION` item 10; core §7 |
| 4 | `with-title` and the non-visual name are orthogonal; both may be in force and there is still one name (§1.3, §3.1) | `TITLE-RENDER-DEFAULT`; `ACCESSIBILITY-PROFILE` item 3; SVG 1.1 §5.4 (`title` is not rendered) |
| 5 | The role MUST be `graphics-document` (§2.1) | `ACCESSIBILITY-PROFILE` item 2 (superseding `ACCESSIBILITY-PROFILE`'s filed `img`); WAI-ARIA Graphics Module §4.1; SVG-AAM §5.2.55 |
| 6 | `img` is admitted only as a downgrade DECLARED in the manifest (§2.2) | `ACCESSIBILITY-PROFILE` item 2; [`figdown-manifest.md`](figdown-manifest.md) §3.7 |
| 7 | Under `img` the name MUST come from `aria-label`/`aria-labelledby`; under `graphics-document` a child `<title>` suffices (§2.2) | WAI-ARIA 1.2 §5.4; SVG-AAM §4.1.2 |
| 8 | The root `<title>` is the FIRST child and its text is the `title` string unmodified (§3.1) | `ACCESSIBILITY-PROFILE` item 3; `DESCRIPTION-KEY-SPELLING`; SVG 1.1 §5.4 |
| 9 | Multi-section: the FIRST section's `title` wins, stated rather than concatenated (§3.2) | `ACCESSIBILITY-PROFILE` item 3; [`host-profile.md`](host-profile.md) §3 (no syntax names a section) |
| 10 | No `title` ⇒ not publishable; `title` stays optional in the grammar (§3.3) | `ACCESSIBILITY-PROFILE` item 3 |
| 11 | Three admissible sources; `derived` is admissible (§4.1) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 4, partially superseding `ACCESSIBILITY-PROFILE` |
| 12 | The five-state vocabulary, and `generated` never publishable alone (§4.2) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 5 |
| 13 | `reviewed` is bound to the source hash (§4.2) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 5; `MANIFEST-REVIEW-STATE`; [`figdown-manifest.md`](figdown-manifest.md) §3.6 |
| 14 | `derived`/`generated` MUST be machine-distinguishable; ways 1 and 3 adopted, way 2 rejected as the default (§4.3) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 6 |
| 15 | Derived content rules for `topology`, `bitfield`, `sequence` (§4.4) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 7 |
| 16 | An unruled genre gets no derived description; the state stays `absent` (§4.4) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 7 (which ruled three genres and no more); `PUBLICATION-MANIFEST-PROFILE` (a rule without review is a second unreviewed specification) |
| 17 | The negative rule: a derived description MUST NOT state what the model does not assert (§4.5) | `ACCESSIBLE-DESCRIPTION-SOURCES` item 7; core §12.7.1–§12.7.2 (the inference classes); `MULTICAST-MESSAGE-DELIVERY` (the standing example) |
| 18 | Decoration: a weak MAY, `data-*`-identity elements never hidden, needed text never hidden (§5) | `ACCESSIBILITY-PROFILE` item 9; WAI-ARIA 1.2 §6.7 |
| 19 | The embed's `alt` rule lives in host-profile §1.2 and is not restated (§6) | `ACCESSIBLE-TEXT-EMISSION` item 8; [`host-profile.md`](host-profile.md) §1.2; `tools/alt-check.js` (`gate:alt`) |
| 20 | Six assertions at the ruled severities; E is `gate:alt`'s and is not reimplemented (§7) | `ACCESSIBLE-TEXT-EMISSION` item 11; `tools/a11y-check.js` (`gate:a11y`); `tools/alt-check.js` (`gate:alt`) |
| 21 | The verifier scopes on the claim; out-of-scope artifacts are reported, never failed; zero in scope exits 0 (§7.1) | `ACCESSIBLE-TEXT-EMISSION` item 11; §1.1 (a renderer owes nothing) |
| 22 | The producer corpus is re-rendered under `--with-a11y`; producer defects are fatal, author facts are counted (§7.2) | `tools/safe-svg-check.js` (the same rendered-fresh idiom); `ACCESSIBILITY-PROFILE` item 3 (the author/producer split) |
| 23 | `desc`, `role=` and `data-desc-state=` join the Safe SVG output vocabulary as `with-a11y`-only names; `aria-*` does not | core §15.2; `tools/safe-svg-check.js` (`gate:safesvg`, third render mode) |
| 24 | The `img` downgrade's declaration field is `accessibility.role`, CLOSED and OPTIONAL, closing the carried obligation named at P2's shipping (§2.2) | `MANIFEST-ACCESSIBILITY-ROLE`; [`figdown-manifest.md`](figdown-manifest.md) §3.7 |
| 25 | `FIGDOWN_VERSION` is not bumped for route 1: default output is unchanged, and the version identifies the bytes an engine produces (§1.2) | `VERSION-EVENT-TRIGGER`; core §13 |

---

## 10. Open items this document does not decide

Named rather than silently resolved, so a future ruling has a precise
starting point.

- **An explicitly EMPTY `title`.** `ACCESSIBILITY-PROFILE` rules that a figure with **no**
  `title` line is not publishable, and the language distinguishes an absent
  `title` from a written empty one (`title ""`, `EMPTY-LABEL-STATE`). Nothing rules
  whether an empty name is publishable. The engine emits `<title></title>`
  for it, because `ACCESSIBILITY-PROFILE` says *unmodified*; the verifier's assertion A
  compares equality and therefore passes it. **Whether an empty accessible
  name should be a publication failure is undecided.**
- **`lang` / `xml:lang` on the root.** §1.1's table records it as a
  publication SHOULD, taken from the proposal's §3.6 table. No ruling states
  which value, from which source, or what a multilingual corpus does — and
  the language has no `lang` carrier. Zero artifacts carry one today. The
  engine emits none and the verifier checks nothing.
- **A named producer and version for a `derived` description.** §4.2 says a
  `derived` state is set *"by a named producer and version"*, but nothing
  rules WHERE that name is recorded. The artifact carries the state only;
  the manifest's `accessibility` block carries `by` and `date`
  ([`figdown-manifest.md`](figdown-manifest.md) §3.7) but no producer
  version field. A future ruling that adds one narrows nothing already
  shipped.
- **Whether a `derived` description may be REVIEWED into `reviewed`.** The
  five states are a vocabulary, not a ladder (the same reading `MANIFEST-REVIEW-STATE` gives
  the manifest's review enum), and no ruling states whether a human
  accepting a derived sentence changes the state or annotates it. This
  document takes no position.
- **Publication scope for assertion D.** `ACCESSIBLE-TEXT-EMISSION` set D's severity to `warn`
  *"until publication scope is decided"*. What is decided is the scope of
  the CHECK (§7.1); what remains undecided is whether "published" is ever
  narrower than "rendered `with-a11y` and committed to this tree" — a
  distribution question, not an accessibility one.
- **Default emission's migration.** `ACCESSIBLE-TEXT-EMISSION` registers route 2 as intent for
  0.6 or 1.0 without a date, a migration entry, or a decision on what
  happens to the `with-a11y` option once the default emits.

---

## 11. The external-standard claims this profile makes

Twelve assertions, over six W3C specifications and one WAI tutorial page,
all fetched and read first-hand on 2026-08-22. They are registered in
[`standards-claims.tsv`](standards-claims.tsv) as rows **`S223`–`S238`** —
**sixteen rows for those twelve assertions**, because the register's unit is
the ASSERTION and not the table row it is presented in, plus one
`availability` row for the retrieval itself. Every one is quoted rather than
paraphrased, under the register's own rules. This document adds no new external claim; it cites the rows the
proposal's §4 already established, and is listed as a site on each.

One honesty note carried over from the proposal: row `S150` records that no
W3C text was held by this repository, and this work does **not** discharge
it. The ~24 rows S150 covers are CSS/SVG/HTML *attribute spellings* in the
vocabulary ledger — a different set of documents from the six read here.
`S238` records only that these six were retrieved.
