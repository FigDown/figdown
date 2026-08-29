# FigDown Markdown Host Profile — v0.1

> Status: **normative for HOSTS**, not for the language. Nothing here adds,
> removes or changes a FigDown construct: every rule below is a consequence of
> [core.md](core.md) §7, §8, §10, §13.7 and §15, written out once so that two
> hosts implement it the same way instead of imitating this repository and
> diverging where imitation runs out.
>
> **Audience: whoever makes a Markdown renderer, static-site generator, wiki,
> viewer, agent tool or documentation pipeline understand FigDown.** For
> writing figures see [guide/authoring.md](../guide/authoring.md); for reading a `.fd`
> someone else wrote see [core.md §12.7](core.md#127-the-reading-agent-contract).
>
> Provenance: an advisory review, in which three independent reviewers each
> asked for it, and the 1.0 gate's criterion E2 in
> `decisions/registry.md`. Both asked for the same thing: **write down the
> conventions that already exist** — the fence word, same-basename sidecar
> pairing, hash verification, stale-artifact policy — so a host can implement
> them identically. This document invents no convention; §6 resolves every
> normative sentence in it to a core section or to a check that already runs.
>
>
> **Section numbers §0–§7 are stable.** Cite them; do not renumber.

## 0. What a host is, and the one thing this profile buys

A **host** is anything that displays a Markdown document containing FigDown and
is not the FigDown engine: GitHub, MkDocs, Docusaurus, Sphinx, VS Code,
Confluence, a wiki, a static-site build, an agent's file reader.

A host has to answer six questions, and until this page existed it answered them
by reading this repository:

1. how a FigDown source inside a `.md` is **discovered** (§1.1);
2. how a FigDown source **beside** a `.md` is discovered (§1.2);
3. how a rendered `.svg` is **verified** against its source (§2.2);
4. what to do when the artifact and the source **disagree** (§2.3);
5. how a **multi-section** file is referenced and rendered (§3);
6. what to do when a **source or an artifact is missing**, or a figure does not
   parse (§4).

Three implementations in this repository already answer them —
`integrations/markdown-it-figdown/` (the fence path),
`integrations/kroki-service/` (source over HTTP), and
`integrations/mcp-server/` (the read/verify path an agent uses). They agree
because one person wrote them. This profile is what makes agreement checkable
by someone who did not.

**Requirement keywords.** The key words of BCP 14
([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119),
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) are used in this document
as core **§0.1** declares them, and only when they appear in all capitals.
*(This sentence pointed at core §13 until `NORMATIVE-KEYWORD-DECLARATION`, where the declaration moved
above §13 so that its scope is a document rather than a section.)* Its zh-tw
twin keeps the English keywords rather than translating them, and says so in
the same place.

**Conformance class.** The party this document binds is the **Host**, one of
the six classes core **§0.2** closes the list at (`CONFORMANCE-CLASS-LIST`); the status line
above already named it in capitals, and §0.2 is where the name is now
defined. Three of this document's other nouns are that same class under a
narrower description: the *viewer*, the *reader* and the *agent tool* of §2.3
are Hosts that can only display, and the *consumer* of §5 is this profile's
Host under the noun `MANIFEST-EXTENSION-NAMESPACE` uses. §2.4's extraction rule is core §15.4's and
binds whoever extracts; where this profile states it, the party is the Host.
The *engine* this profile hands a fence body to is §0.2's LABEL for
Parser ∧ Renderer, and this document binds neither of them — *"normative for
HOSTS, not for the language"* is that same fact in the class list's words.

---

## 1. Discovery

A host discovers FigDown by exactly **three** routes, and no others: an inline
fence (§1.1), a sidecar file paired with an artifact (§1.2), and the source
embedded inside the artifact itself (§2.4). A host MUST NOT infer that a
document is FigDown from anything else — a file extension mentioned in prose, a
link's text, a heading, an image's alt text. Discovery that guesses produces a
figure rendered by one host and not another, which is the divergence this
profile exists to prevent.

### 1.1 The inline fence

A host MUST treat a fenced code block whose info string's **first word is
exactly `figdown`** as one FigDown document. The comparison is byte-exact and
case-sensitive: `Figdown` and `FIGDOWN` are not the word, and a host MUST NOT
match them. This is what `tools/fence-check.js` recognises across this
repository's whole Markdown corpus and what `markdown-it-figdown` implements
(`info.trim().split(/\s+/)[0] !== 'figdown'` falls through to the host's
default fence rendering).

**The info string is the host's surface, not the language's.** CommonMark
0.31.2 §4.5 says so in as many words — *"However, this spec does not mandate
any particular treatment of the info string"* — and adds that *"The first word
of the info string is typically used to specify the language of the code
sample"* (registered as `S213`/`S214` in
[standards-claims.tsv](standards-claims.tsv); the claim is not this project's
invention and is quoted rather than paraphrased). Two consequences a host must
not get wrong:

- **A host MUST NOT give meaning to any word after `figdown`.** No render
  options, no theme, no size, no genre override. Core §7 requires a non-default
  render option to be recorded in the artifact's `data-render-options`, so that
  an artifact stays a pure function of (source, recorded options); an option
  spelled in an info string is recorded nowhere and travels with the host, not
  with the figure. Further words are RESERVED by this profile.
- **A host that does not recognise `figdown` MUST fall back to CommonMark's own
  treatment** — display the block as literal text. That is not a degraded mode
  in FigDown's sense: the source *is* the figure's meaning, so an unrendered
  fence still says everything the drawing says. A host MUST NOT drop the block.

**Delimiters.** A host MUST support backtick fences. It SHOULD support tilde
fences, which CommonMark treats alike; this repository's own gate reads
backtick fences only, so the tilde path is permitted and is not exercised here,
and that limit is stated rather than left to be discovered.

**The body is bytes.** CommonMark: *"The content of a code fence is treated as
literal text, not parsed as inlines"* (`S215`). A host MUST hand the fence body
to the engine unchanged apart from the indentation CommonMark itself strips,
MUST NOT resolve entity or character references inside it, and MUST NOT
normalise its whitespace. FigDown is line-oriented and its error messages carry
1-based line numbers (§8); a host that rewrites the body reports line numbers
that do not match what the author wrote.

**One fence is one document, and that document MAY be multi-section.** The body
is a complete `.fd` document beginning with a `figdown <version> <genre>`
header, and it MAY contain more than one such header (core §1, `MULTI-FIGURE-DOCUMENTS`). See §3.

**An authoring consequence, because it is the one that bites.** A backtick info
string may not contain backtick characters (`S216`), and a closing fence must be
at least as long as the opening one (`S217`). A FigDown source whose quoted labels
contain a run of three or more backticks therefore needs an opening fence longer
than the longest backtick run inside it. Nothing in the language forbids such a
label; the constraint belongs to Markdown and is the author's to satisfy.

### 1.2 The sidecar pair

Core §7 makes two statements this profile depends on and does not restate:
same-basename pairing `X.fd` ⇔ `X.svg` is **normative**, and the artifact is
embedded in Markdown by a **plain image reference**.

- **The pairing is basename plus directory, and nothing else.** For an image
  reference resolving to `…/X.svg`, the source is `…/X.fd` in the same
  directory. A host MUST NOT pair by title, by alt text, by link text or by
  proximity in the document. This is exactly the enumeration
  `tools/artifact-check.js` performs over both sides of the pair.
- **The `source:` footer is an affordance, not the pairing.** The convention
  this project writes on every embed is

  ```markdown
  ![What the figure shows](figures/X.svg)

  <sub>source: [figures/X.fd](figures/X.fd)</sub>
  ```

  and `skill/figdown/SKILL.md` step 3 makes it the standard embed form; the
  example gallery uses a second spelling for the same purpose, an inline `source` link naming the `.fd` path directly
  link in the figure's heading. A host SHOULD preserve such a footer as an
  ordinary link and MAY follow it to locate the source; a host MUST NOT depend
  on it, because it is a documentation convention with two live spellings while
  the basename pairing is one normative rule. Its value is to a **human or an
  agent** holding only the rendered page: it is the visible answer to *where is
  the text behind this picture*.
- **A host without filesystem access has a third route**: the artifact carries
  its own source (§2.4). Nothing about a `.svg` requires the `.fd` to be
  reachable for the meaning to be recoverable.
- **The embed's `alt` text, normatively.** The plain image reference this
  section opens with produces an `<img>` element, and for a reader who cannot
  see the drawing, its `alt` is the whole of what the embed says (HTML-AAM
  §3.5.56–§3.5.57: an `img` maps to the `img`/`image` role with `alt` as its
  accessible name, and an empty `alt` maps to `none`/`presentation`). This
  rule was adopted from the accessibility profile's own §3.4
  (`decisions/registry.md`, ADOPTED `ACCESSIBLE-TEXT-EMISSION`, 2026-08-22) and
  lands here rather than there because it is an EMBED-side rule, and this is
  where the embed convention already lives:

  > An author embedding a FigDown artifact MUST write an `alt` that says what
  > the figure is; it SHOULD be the figure's `title`. A host MUST NOT
  > synthesize, rewrite or translate that text, and MUST NOT substitute the
  > file name. An empty `alt` is permitted only where the same figure's full
  > content is stated in adjacent prose, and in that case the artifact is
  > decorative **for that page only** — never in general.

  This codifies an existing practice rather than imposing a new one: measured
  2026-08-22, **106 of 106** embeds in this repository and **797 of 797** in
  the downstream production corpus already carry a non-empty `alt` with
  no rule requiring it (`decisions/registry.md`).
  `tools/alt-check.js` (`gate:alt`) checks the cheap half
  of this rule — that every `.svg` Markdown embed in the tree carries a
  non-empty `alt` — over this repository's own corpus, every run.

### 1.3 Which route wins when more than one is present

- **A fence is not addressable, so it can never be the same object as a file.**
  No FigDown syntax names an embedded occurrence, and the identity model
  this project adopted deliberately did not open identity across
  documents. A host therefore MUST NOT pair a fence with
  any file on disk, and MUST NOT treat a same-named `.fd` as a fence's source or
  as its authority. A fence is its own source, complete on its own line-numbered
  terms.
- **When an artifact and its paired `.fd` disagree, the `.fd` is truth.** The
  remedy is to rebuild the artifact from the source, never to edit the artifact
  and never to prefer the artifact's embedded copy (§2.3).
- **A document containing both a fence and an image of the same figure is
  publishing that figure twice**, and this profile defines no relation between
  the two: no check in this repository compares them, so no host may claim they
  agree. An author who wants one source SHOULD publish one of the two forms.

---

## 2. Verification

### 2.1 Rendering at the declared version, or not rendering

A host that **renders** a FigDown source MUST use a conforming engine that
accepts the language version the document declares. Core §13.7 states the rule
the host inherits whole: an engine MUST NOT silently reinterpret a document
under another version, and either renders it under the declared version's
semantics or **rejects it with a named diagnostic**. A host MUST NOT choose a
"closest supported" reading, because guessing produces a figure that looks
right and means something else — the one failure a reader cannot detect.

A host that cannot render at the declared version has two conforming options
and no third: **embed the artifact** built by an engine that could (§1.2), or
**show the source as text** (§1.1). Showing nothing is not among them.

### 2.2 The hash check

Every artifact carries, in its `<metadata id="figdown-source">` element, the
SHA-256 **of the source** (`data-sha256`), the full engine version that rendered
it (`data-engine-version`), and any non-default render option
(`data-render-options`) — core §7.

A host that displays an `X.svg` for which the paired `X.fd` is reachable
**SHOULD verify** it: compute the SHA-256 of the `.fd` bytes and compare with
the artifact's recorded `data-sha256`. Equality is the whole check, and it is
what `tools/artifact-check.js` runs over every shipped artifact on every build.
Two properties of that comparison a host must hold on to:

- The hash is of the **source**, never of the artifact (core §15.6). An artifact
  that was reformatted, minified or re-indented is not stale; a source that
  moved is.
- Checking the artifact against **itself** proves nothing. Every artifact in the
  two incidents core §7 and `artifact-check.js` record was internally consistent
  and every one showed a figure its `.fd` no longer described. A host MUST NOT
  report an artifact as verified on the strength of its own embedded source.

**What the check does not give you**: `data-sha256` authenticates nothing — no
key, no signature, and anyone who can change the artifact can change the hash
inside it (core §15.6). A host MUST NOT present a hash match as provenance,
authorship or trust.

### 2.3 Stale artifacts — the policy, and why it splits in two

**Stale is defined by the hash**: an artifact is stale when its recorded
`data-sha256` differs from the SHA-256 of the `.fd` it is paired with. Nothing
else is stale, and a host MUST NOT invent a second definition (a timestamp
comparison is not one — a rebuild preserves content while moving mtimes, and a
checkout reverses them).

**A host MUST NOT silently display a stale artifact.** The figure on the page
is then a statement its own source contradicts, and silence is what makes it
undetectable. Beyond that, the honest behaviour depends on what the host can
do about it, and the two cases take opposite actions:

- **A host that builds or publishes** — a static-site generator, a
  documentation pipeline, a CI step, a repository gate — **MUST refuse**: fail
  the build and name the artifact and its source. This is the policy
  `artifact-check.js` already enforces on this repository, and it is enforced
  *with or without* `--strict`, deliberately: a stale artifact is a wrong figure
  already shipped, not a lint opinion. A publishing host is in exactly that
  position, because it is the step that ships it.
- **A host that only displays what it was handed** — a viewer, a reader, an
  agent tool that cannot rebuild — **MUST show the figure with a visible
  staleness warning** that names the `.fd` as truth, or refuse to display it.
  Both are conforming; silence is not. The reference behaviour is
  `figdown_read` in `integrations/mcp-server/`, which reports
  `STALE ARTIFACT: X.fd has changed since this .svg was built. The .fd is truth
  — rebuild.` and still hands over what it has.

**Three moves a host MUST NOT make.** It MUST NOT rewrite the artifact's
recorded hash to clear the mismatch (that produces a self-consistent artifact
showing the wrong figure — core §15.6). It MUST NOT quietly substitute the
artifact's embedded source for the sidecar when the two differ. And it MUST NOT
downgrade the mismatch to a note in a log the reader of the page never sees.

**One case looks stale and is not.** A source the engine now *refuses* at
geometry time (core §8) cannot be rebuilt at all: `build-svg` writes nothing for
it, and the correct state is to have **no artifact**. A host with an engine
SHOULD distinguish the two, because "rebuild it" is advice that cannot be
followed here — the artifact is to be deleted. A host without an engine cannot
see the difference and SHOULD say *the source and the artifact disagree* rather
than naming a cause it did not determine.

### 2.4 Recovering the source from the artifact

The artifact embeds its full source in a CDATA section. Extraction is the
consumer's job and it has one rule, stated normatively in core §15.4: **an
extractor MUST be CDATA-aware**, and a regex that stops at the first
`</metadata>` recovers the wrong bytes. That section also states the reverse
rewrite (`]]]]><![CDATA[>` → `]]>`) and why recovering-then-hashing is the
check that catches a bad extraction. This profile adds nothing to it and does
not restate it; a host implementing recovery MUST read it.

An agent host holding only an artifact recovers the source and reads that. It
MUST NOT infer the figure's content from the drawing — the source is present,
exact, and hashed.

### 2.5 Engine skew

`data-engine-version` is the other half of determinism: `RENDERING-DETERMINISM` promises byte-identical
output for the same source **and** the same engine version, and core §13 does
not extend that promise across `0.x` versions. So a host that re-renders a
source and gets a drawing different from the artifact beside it MUST report the
**version** difference where one exists, not a source problem — the hash has
already ruled the source out. An artifact built by an older or newer engine than
the host runs is `engine-lag` / `engine-ahead` in `artifact-check.js`: a warning
by default, fatal under `--strict`, and never silent.

---

## 3. Multi-section files

A single `.fd` MAY contain more than one `figdown <version> <genre>` header.
Each starts a **section** with its own genre, its own declared version, its own
id space and its own layout zone (core §1). Rendering produces **one SVG per
file**: sections are drawn independently and stacked top-to-bottom in document
order, with no cross-section edges and no multi-SVG output (core §1, resolved as
`MULTI-FIGURE-DOCUMENTS`).

For a host this means:

- **A host renders every section, in document order, as one figure.** It MUST
  NOT render a subset, reorder sections, or split them into separate images. The
  reference composition is the engine's own: each section's rendering is placed
  in a translated group, stacked with a fixed gap.
- **No per-section addressing exists, and a host MUST NOT invent one.** No
  syntax names a section; nothing in the artifact marks one as a target. The
  `s0_`/`s1_` id prefixes the engine writes when stacking exist solely to keep
  ids unique across sections — they are a collision device, not a locator, and
  a host MUST NOT expose them as one. (The provenance channel core §7 does
  define, `data-edge`, names a connector, not a section.)
- **To reference one section, split the file.** The sanctioned answer is one
  `.fd` per concept, composed by the host document (core §9, `GROUP-LEVEL-FLOW`): Markdown
  already has addressable units, and two files pair with two artifacts under the
  same §7 rule.
- **Sections may declare different versions**, so a host MUST evaluate §2.1
  per section: a file may legitimately hold a section this host's engine accepts
  beside one it does not. Rendering the acceptable sections and silently
  dropping the rest is a partial render and is forbidden by §4.

Whether a section will ever be addressable is an open question, not a gap this
profile can close: identity across sections is named in
the project's working record as something this project deliberately did
**not** open, with its reopen condition on file.

---

## 4. Failure modes

Determinism over convenience, in core §8's own words: *a document with errors
renders nothing (no partial/best-effort output)*, and v0.1's single conformance
mode is strict — *a document with errors MUST NOT render* (core §10). Every row
below is that rule applied to a situation a host will actually meet.

| Situation | What the host MUST do |
|---|---|
| **A fence does not parse** | Show the diagnostics — every `Line N: <message>`, in one pass, with the line numbers intact — and show **no figure at all**. A partial or best-effort drawing is forbidden. The block's failure SHOULD stay local: the rest of the page renders (`markdown-it-figdown` replaces just the block with `<pre class="figdown-error">` and never throws). |
| **A fence's declared version is outside the engine's accepted set** | Refuse that section with a named diagnostic and never guess a version (core §13.7). A host SHOULD state, in its own documentation, which `figdown X.Y` versions it accepts — §13.7 makes that part of an engine's interface, and a host inherits it. |
| **An artifact whose paired `.fd` is absent** | Display the artifact; do **not** call it an error. The source is not lost — it is inside the artifact (§2.4), and that is what a reader or agent reads. The host MUST NOT report the figure as *verified*: with no sidecar there is nothing to verify against. `artifact-check.js` counts this as a named skip, `no-source`. |
| **A `.fd` whose artifact is absent** | Nothing to display. A building host builds it; a displaying host shows the source text. This is an error only if the engine will draw the figure — for a source the engine refuses, the absence is the **correct** state (§2.3). |
| **An `.svg` with no `figdown-source` metadata** | It was not produced by FigDown. Treat it as an ordinary image, and make no FigDown claim about it — not verified, not stale, not recoverable. |
| **Hash mismatch** | §2.3: never silent; refuse if you publish, warn visibly if you only display. |
| **An artifact for a figure the engine now refuses** | It pins a drawing the engine calls false and no rebuild can replace it; the remedy is deletion, not rebuilding. A host that detects this MUST NOT tell the reader to rebuild. |
| **Metadata present but malformed** (no `data-sha256`) | The artifact is malformed. Report it as such; do not fall back to displaying it as verified, and do not repair it by computing a hash of your own. |

---

## 5. What this profile does not cover

Named, so that a host does not read silence as permission:

**One clarifying sentence first, because "does not cover" is read two ways
(`LAYER-EXTENSION-DOORS`).** This profile governs a consumer's behaviour, not a data record;
there are no keys here to extend, and it gets no extension door. What it does
get is the negative statement the list below has always implied: **a host MAY
do more than this profile requires, and MUST NOT claim this profile while
doing anything this profile forbids.** Everything unlisted is a host's own
business; nothing unlisted licenses a host to break a rule that IS listed.

- **When the rebuild runs.** Manual CLI, editor-on-save, file watcher,
  pre-commit hook or CI — `MARKDOWN-EMBEDDING-CONVENTION` registered the question and it remains a
  recommended workflow, not a normative one. This profile says what a host does
  with an artifact it finds, never when the artifact is made.
- **Editing and round-tripping.** A host that lets a reader change a figure is
  an authoring surface, and `EDITOR-REQUIREMENT` governs it: GUI actions rewrite `.fd` text. That
  contract is the editor's, not a host's.
- **Per-host styling.** A host MAY place, scale, caption and lay out the
  artifact as its own design requires. It MUST NOT restyle the figure's
  interior — recolouring, re-theming or substituting fonts — because colour and
  shape in FigDown carry meaning only through a `class` whose stated meaning the
  derived legend prints (`PRESENTATION-AS-MEANING-CARRIER`, core §5). A host that recolours a class breaks the
  link between the legend's words and the picture, and the reader is never told.
  A host MUST NOT alter the embedded source or the `data-*` metadata under any
  styling transformation.
- **Adding to the artifact's `data-*` namespace — the rule the sentence above
  did not reach (`LAYER-EXTENSION-DOORS`).** *Altering* `data-*` was already forbidden; *adding*
  to it was unaddressed, and the tree contained four committed files that had
  done it before anyone noticed (`decisions/registry.md`).
  **The artifact's `data-*` namespace belongs to the producing engine.** A
  party that adds an attribute to a rendered artifact has produced a
  **derived file** — which may be perfectly useful, and is no longer the
  artifact that source renders to. It MUST NOT be published as a FigDown
  artifact, under the conformance claim (`INDEPENDENT-IMPLEMENTATION-CRITERION`) or under the manifest
  profile's restatement rule (`figdown-manifest.md` §3.2), and a host MUST
  NOT treat it as one. There is no `x-data-*` door and none is coming: an
  artifact attribute is read by tools that never see the source, so they
  cannot check the claim it makes (core §10, `LANGUAGE-EXTENSION-POLICY`). The names the engine
  itself emits are enumerated in core §15.2, and `gate:safesvg` holds every
  committed `.svg` in this repository to them (`RESERVED-PREFIX-ENFORCEMENT`).
- **Accessibility, mostly.** `role`, non-visual `<title>`/`<desc>` and their
  validation are the accessibility profile's, not this one — see `ACCESSIBILITY-PROFILE` (the
  profile's existence, `role="graphics-document"` superseding the `ACCESSIBILITY-PROFILE`
  filing's `role="img"`, the non-visual title, and the decoration rule) and
  `ACCESSIBLE-DESCRIPTION-SOURCES` (the description's admissible sources and state vocabulary), and
  **the profile itself, shipped 2026-08-22 at
  [`figdown-a11y.md`](figdown-a11y.md)** with the `with-a11y` render option
  and its verifier (`tools/a11y-check.js`, `gate:a11y`);
  `decisions/registry.md` is that profile's reasoning
  record. **The one exception is §1.2's alt-text
  sentence**, which this profile now states directly (`ACCESSIBLE-TEXT-EMISSION`) because it binds
  an author and a host at the embed, not the artifact.
- **Publication manifests and provenance** (`PUBLICATION-MANIFEST-PROFILE`), **media-type
  registration** (held on trigger under the project's distribution ruling), and
  **the semantic model** (core §12) — a host is not required to produce, consume
  or expose a model to conform to this profile.
- **Live rendering pipelines**: caching, sandboxing, request limits, render
  farms. Core §15.5 leaves resource limits UNSPECIFIED and this profile does not
  fill them in.

---

## 6. Claim → anchor

Every normative sentence above, and the core section or existing check it
resolves to. A rule with no anchor is not in this profile, because that is the
rule this document was written under.

| # | Rule (§) | Anchor |
|---|---|---|
| 1 | Fence discovery is the info string's first word `figdown`, byte-exact (§1.1) | `tools/fence-check.js` (it recognises an opening fence line whose info string is exactly `figdown`, over the whole Markdown corpus, every run) + `integrations/markdown-it-figdown/index.js` (first-word test) |
| 2 | The info string mandates nothing and further words carry no meaning (§1.1) | CommonMark 0.31.2 §4.5, registered `S213`/`S214`; core §7 (`data-render-options` — a non-default option MUST be recorded **in the artifact**) |
| 3 | The fence body reaches the engine byte-for-byte (§1.1) | CommonMark 0.31.2 §4.5 (`S215`, content is literal text; `S216`/`S217` for the fence-length consequence); core §8 (1-based `Line N:` diagnostics, which a rewrite falsifies) |
| 4 | A fence body is one document and MAY be multi-section (§1.1, §3) | core §1 (multi-section files, `MULTI-FIGURE-DOCUMENTS`); core §9 `MULTI-FIGURE-DOCUMENTS` |
| 5 | Sidecar pairing is same-basename, same directory (§1.2) | core §7 (*"Same-basename pairing (`X.fd` ⇔ `X.svg`) is normative"*); `tools/artifact-check.js` enumerates both sides of the pair, recursively, every run |
| 6 | The `source:` footer is a convention, not the pairing (§1.2) | `skill/figdown/SKILL.md` step 3 (the embed form); `examples/index.md` (the second live spelling — evidence that it varies while the pairing does not) |
| 7 | No fence↔file pairing; the `.fd` is truth over its artifact (§1.3) | core §7 (pairing is between the two FILES); `tools/artifact-check.js` (the comparison that matters is artifact vs the paired `.fd`); `integrations/mcp-server/server.js` (*"The .fd is truth — rebuild"*) |
| 8 | Render at the declared version or refuse; never reinterpret (§2.1, §4) | core §13.7 (both MUSTs: no silent reinterpretation, and an engine states its accepted set) |
| 9 | Verify `data-sha256` against the paired `.fd`; self-consistency proves nothing (§2.2) | core §7 (the hash is of the SOURCE); core §15.6 (what it proves and what it does not); `tools/artifact-check.js` (every shipped artifact, every run; the two recorded incidents) |
| 10 | Stale = hash mismatch; a publishing host refuses, a displaying host warns visibly, nobody is silent (§2.3) | `tools/artifact-check.js` — `STALE` is fatal **with or without** `--strict`, stated in the tool's own header as *"a wrong figure already shipped, not a lint opinion"*; `integrations/mcp-server/server.js` `figdown_read` for the display side |
| 11 | A refused figure's artifact is deleted, not rebuilt (§2.3, §4) | core §8 (geometry-time errors: nothing rendered, no artifact written); `tools/artifact-check.js` verdict `REFUSED-ARTIFACT` |
| 12 | Source extraction MUST be CDATA-aware (§2.4) | core §15.4 (the consumer MUST, and fixture `952-adversarial-metadata-breakout`) |
| 13 | Version skew is reported as skew, not as a source problem (§2.5) | core §7 (why `data-engine-version` is required) + §13 (`RENDERING-DETERMINISM` holds per engine version); `tools/artifact-check.js` verdicts `engine-lag` / `engine-ahead` |
| 14 | All sections render, in order, as one figure; no subset, no reorder (§3) | core §1 (*"sections are drawn independently and stacked top-to-bottom"*, one SVG per file) |
| 15 | No per-section addressing exists; the `sN_` prefixes are not locators (§3) | core §7 (the `data-*` provenance channel is defined for a connector, and only there); `decisions/registry.md` (identity across sections deliberately not opened) |
| 16 | Errors show as errors; never a partial render (§4) | core §8 (*"A document with errors renders nothing (no partial/best-effort output — determinism over convenience)"*); core §10 (strict is the only v0.1 mode: *"a document with errors MUST NOT render"*) |
| 17 | A host may lay an artifact out but MUST NOT restyle its interior (§5) | `PRESENTATION-AS-MEANING-CARRIER` + core §5 (meaningful colour and shape are declared as a `class` whose meaning the legend states) |
| 18 | An embed's `alt` MUST say what the figure is, MUST NOT be synthesized/rewritten/translated by a host, and MUST NOT be the file name; empty only where adjacent prose states the figure's full content (§1.2) | `ACCESSIBLE-TEXT-EMISSION` (ADOPTED from `decisions/registry.md`); HTML-AAM §3.5.56–§3.5.57 (`alt` is the accessible name; empty maps to `none`/`presentation`); `tools/alt-check.js` (`gate:alt` — every `.svg` Markdown embed in the tree, every run) |
| 19 | A host MAY exceed this profile, and MUST NOT claim it while doing anything it forbids (§5) | `LAYER-EXTENSION-DOORS` (ADOPTED from `decisions/registry.md` — the host profile gets a clarifying sentence, not an extension door); this profile's own §5 list, which the sentence states the negative half of |
| 20 | The artifact's `data-*` namespace belongs to the producing engine; a party that ADDS to it has made a derived file that MUST NOT be published as a FigDown artifact (§5) | `LAYER-EXTENSION-DOORS` (ADOPTED from `decisions/registry.md`); core §15.2 (the closed output vocabulary, with the 20 emitted `data-*` names enumerated) and `INDEPENDENT-IMPLEMENTATION-CRITERION` (the conformance claim a derived file may not enter); `tools/safe-svg-check.js` (`gate:safesvg` — every committed `.svg` in the tree, every run, since `RESERVED-PREFIX-ENFORCEMENT`) |

**Rows with no anchor, stated rather than hidden.** Two rules above rest on
this profile's own reasoning and on no check: the tilde-fence SHOULD (§1.1 —
CommonMark treats the delimiters alike, but this repository's gate reads
backtick fences only, so nothing here exercises it), and the split of §2.3 into
publishing and displaying hosts (the *refuse* half is `artifact-check.js`'s
enforced policy; the *warn visibly* half is one implementation's behaviour
raised to a rule, because a viewer that cannot rebuild cannot follow the first
half). Both are marked here so a reader can weigh them for what they are.

---

## 7. The external-standard claims this profile makes

Five, all about CommonMark, all registered in
[standards-claims.tsv](standards-claims.tsv) under the register's rules — one
row per assertion, not one per sentence — and quoted from the specification's
own text rather than paraphrased:

| id | claim | quoted |
|---|---|---|
| `S213` | CommonMark does not mandate any particular treatment of a fenced block's info string, which is why a host profile is needed at all | *"However, this spec does not mandate any particular treatment of the info string."* |
| `S214` | the first word of the info string is the conventional language slot the `figdown` word occupies | *"The first word of the info string is typically used to specify the language of the code sample"* |
| `S215` | a fence's content is literal text, not parsed as inlines | *"The content of a code fence is treated as literal text, not parsed as inlines."* |
| `S216` | a backtick fence's info string may not contain backticks | *"If the info string comes after a backtick fence, it may not contain any backtick characters."* |
| `S217` | a closing fence must be at least as long as the opening one | *"with at least as many backticks or tildes as the opening code fence"* |

The edition claimed is **CommonMark 0.31.2 (2024-01-28), §4.5 Fenced code
blocks**. A claim about a version of CommonMark other than that one is not made
here.
