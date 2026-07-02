# FigDown Standard — Requirements Discussion Notes

> Project name: **FigDown** — *Figures as text, one source, two readers.* (see D2)
>
> 繁體中文版：[requirements-notes.zh-tw.md](requirements-notes.zh-tw.md)

Status: requirements gathering (since 2026-07-01).
Purpose: generalize the ProtoFlow editor approach into a formal standard
(text as source, figures as artifacts, knowledge shared across two kinds of
readers). This file records the user's dictated requirements one by one;
once consolidated, they will be rewritten into a formal standard document.

## Background (core principles of the existing implementation, for reference)

1. Text is the single source of truth — every GUI action = editing the text on the user's behalf
2. Language first (the `nudge` precedent) — add the language directive before building the GUI
3. Never fork the engine — the editor is assembled from the engine's single file by a build script
4. Closed-grammar dividend — enumerable autocomplete, line-numbered errors, easy error recovery
5. Bidirectional sync — cursor ↔ previewed step; the step sidebar is a navigational projection of text blocks

---

## User requirements (recorded one by one)

<!-- Accumulated from here on; each entry dated, original meaning preserved, followed by an organized interpretation -->

### R0 — Original source of the need (2026-07-01)

**Context**: The user has many Word documents containing many images (a very
common scenario). The image types vary widely:

- About half can be described by a syntax like Mermaid (e.g. flowcharts)
- Many others cannot (e.g. network topologies)

**Motivation**: The knowledge in these documents should be **shared with AI
agents**. The images themselves are hard for AI to understand (the knowledge
is locked inside bitmaps).

**Current judgement**: Converting to Mermaid looks like the most suitable
direction (kept open: there may be other equally good or better options).
The problem: many images simply cannot be expressed in Mermaid.

**Desired direction**: **Extend Mermaid** (or an equivalent text-based
approach), while preserving **the way humans habitually absorb this
knowledge** — it must not be AI-readable at the cost of a worse human
reading experience.

**Key insight**: The **layout of an image materially aids understanding** —
a text-based approach must not throw away the semantics carried by layout.

**Interpretation**: This is a dual-audience problem of "textualizing image
knowledge" — one representation must let (1) AI read and use the knowledge,
and (2) humans keep an understanding experience close to the original figure
(including layout semantics). Mermaid is the baseline reference; the gap is
the figure types it cannot cover (topologies etc.) and layout expressiveness.

(Follow-up: the user will describe expectations point by point → R1, R2, …)

### R1 — Static first; dynamic later (2026-07-01)

**Original**: At minimum, **static** figures must be supported; later,
**dynamic** support is desirable — dynamic = static + a "page-flip" concept
(e.g. GIF-style frame by frame).

**Interpretation**:
- Clear priority: static is the must-have baseline; dynamic is a
  nice-to-have later goal.
- The mental model for dynamic is **discrete page-flipping** (page/frame),
  not continuous-timeline animation — fully consistent with the v2 draft
  ("dynamic = static + step timeline"; the step model is naturally
  isomorphic to pages/slides/frames; GIF export = sampling frames between
  steps).
- Implication for the standard's layering: define the static scene layer
  first; dynamic is just a step/page sequence stacked on top — not two
  separate languages.

### R2 — Positioning of dynamic (2026-07-01)

**Original**: Dynamic exists for scenarios like the current editor.html
examples — to **demonstrate and explain** algorithms, or figures with
steps/flows that are easier to understand animated.

**Interpretation**:
- Dynamic is positioned as a **teaching/explanation tool** (demonstrate and
  explain), not a required ingredient of the document knowledge base. Its
  subjects are algorithms, protocol steps, flows — content with an inherent
  time order.
- In other words, two audience scenarios diverge:
  - **Static**: serves R0's core need (Word-document knowledge shared by
    AI + humans)
  - **Dynamic**: serves demonstration/explanation (= what ProtoFlow/v2
    already does)
- The existing editor.html + ProtoFlow is regarded by the user as the
  positive example for the dynamic scenario; the standard should adopt it
  as the reference implementation of the dynamic layer, not rebuild it.

### R3 — Text as source, figures as artifacts (single truth, dual-reader projection) (2026-07-01)

**Original**: Humans will ultimately understand via "a figure" or "multiple
figures" (animation/dynamic); but the same "content" and knowledge value
must also be clearly understandable by AI. So the main expectation is
**Markdown-like: text description as the primary form (for AI), which can be
converted in a standardized way into "a figure or multiple figures" for
human reading**. This comes from the different needs of two "reader"
audiences — while **not wanting to maintain two nearly-synonymous copies of
the content**. Conclusion: maintain **text as primary (source), figures as
secondary (artifacts)**.

**Interpretation**:
- This establishes the **architectural axioms** of the whole standard:
  1. **Single source of truth = text** (Markdown-style, readable prose,
     directly digestible by AI)
  2. **Figure = deterministic rendering artifact** (the projection for
     human readers); one figure = static, multiple figures = dynamic
     (echoing R1's page-flip model)
  3. **No dual sources**: "one copy of text + one copy of figures"
     maintained separately is forbidden — figures must be 100% generated
     from text; edit the text and the figure follows
- "Standardized conversion to figures" implies the conversion must be
  **deterministic** (same text → same figure), otherwise the figure cannot
  be trusted as a faithful projection of the text — same origin as the v2
  draft's determinism principle.
- This is precisely the text-anime editor's iron rule ("text is the single
  source of truth; GUI = editing text on the user's behalf") generalized to
  the document scenario: the editor's GUI is a projection; here the
  "figure" is also a projection.
- Isomorphic to the existing Mermaid-in-Markdown ecosystem (```mermaid
  fence → rendered figure); the user wants this pattern extended to the
  figure types Mermaid cannot cover (R0).

### R4 — Text→figure must be fully automated by tools (2026-07-01)

**Original**: The "text to figure" conversion is naturally expected to be
done by a **tool** — **never by a human**.

**Interpretation**:
- The rendering pipeline must be **fully automatic with zero manual
  intervention**: humans (or AI) only write text; tools produce the
  figures. Humans never hand-draw and never hand-tune rendered output.
- Corollary 1: the language must have sufficient built-in layout
  expressiveness (echoing R0 "layout aids understanding") — with no manual
  post-editing escape route, layout semantics must be statable in the text
  source so the tool can produce a result "like the original figure".
- Corollary 2: the tool's quality bar is high — "does the auto-laid-out
  figure look good enough / human-drawn enough" directly decides whether
  this standard survives. This is exactly the core competence accumulated
  in the text-anime project (declarative layout, three-tier layout,
  determinism).
- Corollary 3: escape hatches must also take the form of "declarations
  written in the text" (like v1's `pos`/`nudge`), never "manually touched-up
  output figures".

### R5 — Beyond easy content expression, humans need (optional) layout control (2026-07-01)

**Original**: The text (source content) should easily express content and
meaning, but should also give humans control over layout and similar
aspects. An image fundamentally consists of many geometric shapes
(including lines) and **layers**, and every object has attributes such as
**color** — these are very basic image needs. Even for flowcharts, humans
editing should have a degree of control: e.g. **pinning certain objects at
an absolute position in the overall figure**, so humans can easily express
concepts such as **rank/status**. So the text needs **optional** flexibility
for (human) users to exercise.

**Interpretation**:
- The language has two indispensable levels of demands:
  1. **Semantic level** (the main body): easy expression of content and
     meaning (the main arena for AI reading/writing)
  2. **Presentation level** (optional annotations): control over geometry,
     lines, layers, colors, absolute positions etc. — humans opt in as
     needed; if unwritten, everything is automatic
- Key motivation: **position itself carries meaning** (rank, zoning,
  direction). Humans asking for absolute-position control is not cosmetic
  fine-tuning but expressing "this thing ranks higher / belongs to that
  zone" — layout is part of the knowledge (echoing R0's layout insight).
- Maps to the v2 draft's settled **three-tier layout**: fully automatic →
  semantic constraints (flow/rank/zone) → explicit positions (grid/pos
  escape hatch). R5 confirms all three tiers are needed, with the
  "unwritten = fully automatic" optional nature.
- **Tension with the v1 iron rule (to clarify)**: v1/ProtoFlow decrees
  "authors never choose colors" (plane→color is fixed); R5 asks for basic
  attribute control including color. Possible reconciliation: the document
  scenario (static figures) opens up presentation attributes, while the
  protocol-animation profile keeps semantic coloring — boundary to be
  confirmed with the user.
- **Layers** appear as a new first-class concept: v1 only has a fixed
  render-layer stack (§6.6, engine-internal); R5 asks for layers as an
  author-facing organizational unit.

### R6 — An editor is mandatory (2026-07-01)

**Original**: There must be an editor, so humans can conveniently **draw**
the figure they want.

**Interpretation**:
- The editor is a **hard requirement** (must-have), not a nice-to-have
  companion tool. The human authoring flow is "drawing", not "writing
  code" — even though the truth is text, humans need a visual interface.
- Composed with the R3/R4 axioms, the inevitable form is the existing
  editor.html iron rule: **GUI drawing actions = editing the text on the
  user's behalf**. Humans "draw"; the editor transcribes the drawing
  actions into text declarations (drag node→pos, connect→link,
  recolor→attribute line); text remains the single truth, the figure
  remains a projection.
- This also answers R5's operational side: humans exercise layout control
  mainly through the editor's direct manipulation (where you drag it =
  an absolute-position/rank declaration written in), rather than
  hand-writing coordinates.
- Corollary: language design must consider "GUI write-back" — every visual
  operation needs a corresponding text directive (the `nudge` precedent);
  this is the bidirectional contract between language and editor.
- Existing asset: editor.html's architecture (CodeMirror + direct canvas
  manipulation + build-from-engine) can serve directly as the reference
  implementation.

### R7 — Formal standard, generality, low AI teaching cost (token-lean) (2026-07-01)

**Original**: This text format **definitely needs a defined standard**, and
should be **general-purpose**; also, the material that "explains" the syntax
should be **lean** — it should not take many tokens of prompt to make an AI
agent understand it.

**Interpretation**: three sub-requirements:
1. **Formal standardization**: a normative spec (protoflow-spec.md grade:
   syntax, semantics, error model, EBNF), not a "de-facto tool format".
2. **Generality**: across scenarios (not tied to network protocols), across
   tools (anyone can implement a renderer/editor from the spec),
   interchangeable.
3. **AI teaching cost as a first-class design metric**: treat "how many
   prompt tokens it takes to teach an AI agent this language" as a hard
   constraint on language design — the syntax explanation must fit in a
   lean system prompt (hundreds of lines, not the whole spec).
- Design implications:
  - The language core must be small and orthogonal (few directives +
    consistent composition rules), letting AI generalize from regularity
    rather than long lists — v1's closed, line-oriented grammar has
    exactly this property.
  - The spec can split into two audience documents: full normative spec
    (for implementers) + lean authoring guide (as the AI agent prompt,
    like a standalone extraction of v1 spec §8).
  - "General" and "lean" pull against each other (more figure types =
    bigger language); the standard needs a profile/layering mechanism:
    small core + on-demand domain extensions; the AI only needs to be
    taught the profile in use.
  - Another token-saving lever: keep the syntax close to conventions AI
    already knows (Mermaid/DOT etc.) so prior knowledge transfers
    (usecases.md scenario 1's build-vs-buy already concluded this).

### R8 — Rendering standard: human-specified wins + small edits must not reshape the figure (2026-07-01)

**Original**: The "text→figure" process must have a **more detailed
standard**. For components with explicit parameters (position, color, and
other attributes), **the human-specified values take priority**; only the
unspecified parts may be automatically arranged and adapted by algorithms.
Main purpose: when the source (text) changes by a **small amount**, the
difference between the new and old figures **must not be large** (or humans
would have to re-understand the whole figure).

**Interpretation**:
- Two rendering rules:
  1. **Priority rule**: explicit (human-specified) > algorithmic auto.
     Auto-layout must arrange itself *around* pinned components and never
     override human intent.
  2. **Layout stability**: small input diff → small output diff. This is
     **stronger** than v2's existing "determinism" (same text → same
     figure): determinism is reproducibility for identical input;
     stability is **continuity between neighboring inputs**.
- The motivation is cognitive cost: humans hold spatial memory of a figure
  ("the FIB table is top-right"); one changed line causing a full re-layout
  destroys the reader's established mental map.
- **Design consequences (major)**:
  - usecases.md recorded partial pinning (auto + a few pinned nodes) as
    "deferred" — R8 promotes it to a **core requirement**; it can no
    longer be postponed.
  - Pure dagre/ELK-style global recomputation is inherently unstable
    (adding one node can flip the whole figure); the standard must specify
    stabilization mechanisms: pin constraints, incremental layout, or
    "materializing layout results back into text" (writing computed
    positions back as optional declarations, freezing the status quo).
  - "Materialize back into text" fits naturally with the R6 editor iron
    rule: a layout the human approves in the editor = pos declarations
    written back to the text; subsequent small edits are then naturally
    stable.
  - This is also the strongest technical argument for "why not just use
    Mermaid/Graphviz" — neither promises cross-version layout stability.

### R9 — Artifact form: SVG embedded in .md; AI reads text, humans read figures (2026-07-02)

**Original**: For reader convenience, this text-to-figure standard could let
an **LLM model produce the corresponding figure**. Default assumption: **SVG
vector graphics** — easy to embed and reference in .md, with no worry about
MD readers/viewers not supporting mermaid etc. But when **AI reads the
document, it must be able to discard the "figure"** and understand directly
from the original "text". (User's own note: much here still needs
discussion; better solutions may already exist.)

**Interpretation**:
- **Artifact format settled: SVG vector graphics**, for portability — once
  embedded in .md, any viewer displays it (img reference or inline),
  independent of viewer-side mermaid rendering support. This moves the
  "rendering moment" from the read side (Mermaid model: viewer renders
  live) to the **write side** (rendered at production time, carried with
  the document).
- **Dual-channel reading model**: within the same .md,
  - Human channel: view the embedded SVG
  - AI channel: skip the SVG, read the original text declarations
  - → the standard must define their **pairing** (how a text block and its
    SVG artifact are associated, how to mark "this figure was generated
    from that text", how to detect staleness/desync).
- **⚠ Tension with R4/R8 (to clarify; the user is aware it's unsettled)**:
  R4 says conversion is "never by a human"; R8 demands determinism +
  stability; yet R9 mentions "letting an LLM produce the figure". An LLM is
  not a deterministic tool — same input does not guarantee same output.
  Two possible readings:
  (a) The LLM is only the **caller**: the LLM writes text, then runs a
      deterministic renderer tool to produce the SVG (compatible with
      R4/R8; more likely the intent)
  (b) The LLM itself is the renderer: it generates the SVG directly
      (violates R8 stability unless the standard is detailed enough to
      squeeze out all freedom — echoing R8's "more detailed standard")
  To confirm at the next discussion. If (b), the standard's role becomes
  "a rendering specification constraining LLM output" — an entirely
  different engineering shape.
- The user explicitly keeps this open: better solutions welcome (e.g. if
  existing standards/tools already cover it).
- **→ Tension resolved; see D1 (2026-07-02).**

### R9.1 / D1 precursor — renderer clarified: program first, LLM only transitional (2026-07-02)

**Original**: R4's "tool" should preferably be realizable **without an LLM
API**. If the standard (text) syntax is well designed, it can be converted
**directly by a program**, like mermaid — rather than asking an AI/LLM agent
to regenerate it following some rule. Early on, option B (LLM conversion)
may also be considered. But the goal is **(A)**: whether a human or an AI
writes the text (humans may generate or adjust it via the editor), it must
**stably produce a 1:1 figure**. If the source hasn't changed, the "figure"
artifact must not change. Example: if the source text only edits the label
inside one object's box, the figure should change **only in that spot;
everything else stays as-is**.

**Interpretation**:
- R9's ⚠ tension is formally resolved: **option A (deterministic program
  renderer) is the goal**; option B (LLM conversion) is only an early
  transition (acceptable for bootstrapping, not the end state).
- "Well-designed syntax → program-convertible" makes **mechanical
  renderability** an acceptance criterion for syntax design: the language
  must not contain fuzzy semantics only an LLM could interpret.
- The three grades of 1:1 stability stated in one place (the final
  strengthening of R8):
  1. Same source → same figure (determinism, bit-level)
  2. Edit text inside a box → **only that spot changes** (locality: the
     blast radius of an edit matches its semantic scope; no spillover)
  3. Who wrote it doesn't matter (human/AI/editor-transcribed):
     equivalent source → equivalent figure
- "Edit box text, only that spot changes" implies a layout constraint: the
  box-sizing policy when text grows (fixed box with clipping/wrapping? box
  grows slightly without pushing the global layout?) must be specified in
  the rendering standard — a concrete instance of R8's "more detailed
  standard". → Rule settled; see R10.

### R10 — Box sizing policy: branch on "explicit size declared or not" (2026-07-02)

**Original**: The example "when text grows, the box grows slightly without
pushing the global layout" should be **conditional** — on whether the "box"
object has an explicitly constrained width/height (a value or a ratio). If
it does, added text naturally must **shrink proportionally to fit** (font
size may reduce slightly).

**Interpretation**:
- This concretizes R8's priority rule (explicit > auto) in the size
  dimension; the content-adaptation policy bifurcates:
  1. **Explicit width/height (value or ratio)**: the box size is
     inviolable — content yields to the box; text shrinks proportionally
     (slightly smaller font) to fit.
  2. **No explicit size**: the box yields to content, growing slightly,
     but **without pushing the global layout** (locality preservation,
     stability grade 2 of R9.1).
- The generalizable principle: **explicitly declared attributes are rigid
  constraints; undeclared attributes adapt flexibly, and the spillover of
  adaptation must be minimized**. Every attribute in the rendering
  standard should define its "adaptation behavior when unspecified"
  following this template.
- Size declarations support **values or ratios** (ratio relative to what —
  canvas? parent container? — detail deferred to syntax design).
- Font shrinking is an engine-side automatic adaptation; authors never
  manage font sizes — consistent with the declarative principle ("authors
  write what, the engine owns how").

### R11 — Methodology: reference existing standards, support less rather than more, generic rules first (2026-07-02)

**Original**: These standards should all be drafted **referencing existing,
established standards**, and the process should be like typical **protocol
standardization**: **prefer supporting less at first**, but do not invent
too many special cases. **"Generic" rules take priority.**

**Interpretation**: three methodological rules:
1. **Survey before invent**: for every design point, first survey existing
   standards (SVG, CSS, Mermaid, DOT/Graphviz, D2, ELK, OOXML…); borrow
   semantics/syntax/conventions where possible; inventing is the last
   resort. Continuous with usecases.md's build-vs-buy method and R7's
   "stay close to conventions AI already knows to save tokens".
2. **Conservative expansion (RFC spirit)**: the first version's feature
   surface should be small — a small, stable core beats a large surface
   riddled with special cases. Unsupported = explicitly rejected (echoing
   v1's closed grammar); extend later on demand; never add a one-off
   special case for a single scenario.
3. **Generic rules > lists of special cases**: for each new need, first ask
   "can an existing generic rule cover this" (e.g. R10's rigid/flexible
   template, v2's "why can't it be primitive + styling" review) before
   adding anything new. The number of rules is the true measure of
   language complexity (and directly determines R7's prompt-token cost).
- This aligns fully with v1/v2's existing engineering discipline: the v2
  draft's "four primitives, sealed" and "new structures must justify why
  they can't be primitive + styling" are precedents of this methodology.

### R12 — First-version scope: highest-volume content first + reserve extensibility (2026-07-02)

**Original**: The first draft of the standard should support **the content
that appears most frequently in images** (satisfy the high-volume needs
first). How far ahead we can see early on (which new needs may arise) can
also be considered — **that is when syntactic extensibility must be
reserved**.

**Interpretation**:
- First-version scope is decided by **frequency statistics**, not technical
  interest: serve the figure types with the largest volume in the corpus
  first. Combined with R11's "less" = few but precise: cut down to the
  high-frequency core.
- **TODO (important)**: run a **figure-type census/classification** over
  the user's actual Word-document images (which types, their shares, the
  constituent elements of each) as the basis for first-version scope. R0's
  "about half can be described by mermaid" is a first estimate; a finer
  inventory should precede scope-setting. Known samples: refer-images/
  (network topologies, lookup chains, packet formats — classes A/B/C of
  usecases.md scenarios 4/5).
- **Extensibility ≠ implemented extensions**: the first version does not
  build future features, but the syntax structure must leave room for
  them — concrete mechanisms (existing precedents):
  - version header (v1 `protoflow 1` pattern) + compatibility rules
    (spec §12)
  - keyword-initial line grammar: new capability = new keyword; old
    parsers report errors precisely
  - `key=value` option slots: new attributes don't break positional
    arguments
  - profile mechanism (R7): new domain = new profile; the core untouched
- Existing material for "how far ahead": usecases.md scenarios 1–5 are the
  future-needs list (protocol animation, algorithms, protocol library,
  packet walk + config tables, hardware lookup chains) — a thought-
  experiment test suite for "is the extensibility sufficient".

### R13 — Defaults = the highest-volume need (minimal-supplement principle) (2026-07-02)

**Original**: For generality of the text, the "**default**" interpretation
should correspond to **the highest-volume need** — so the text rarely needs
"supplementing" (extra declarations).

**Interpretation**:
- **Convention over configuration**: every attribute's default behavior
  targets the statistically most common usage, so most documents are
  correct "with nothing added". Supplementary declarations appear only in
  the minority of cases deviating from the mainstream.
- The effect is a three-way win, directly reinforcing earlier entries:
  - Shorter documents → fewer tokens for AI to produce and read (R7)
  - Larger undeclared area → more room for engine auto-adaptation
    (the flexible side of R8/R10)
  - Lower hand-writing burden, higher readability for humans (R3's
    Markdown-like readability)
- Procedural requirement: when fixing an attribute's default, ask "**what
  do most figures look like here**", not "what is easiest to implement".
  Defaults are statistical decisions — same source as R12's frequency
  census (the census feeds both scope and defaults).
- Composed with the R10 template, the complete attribute model:
  **undeclared → highest-volume default with flexible adaptation;
  declared → rigidly honored**.
- Corollary: defaults themselves are normative content of the standard
  (different implementations must share identical defaults, or the same
  document yields different figures, violating D1).

### R14 — Bootstrap strategy: how to be useful before any tool support exists (2026-07-02)

**Original**: One of the key open problems: early on, when no
editor/reader/viewer supports FigDown, how do we still serve real use?
The user's idea: before support arrives, store the content as `XXX.fd`
files, generate `XXX.svg` alongside, and embed the SVG into the .md file.

**Interpretation**:
- The proposal is a **sidecar convention**: `XXX.fd` (source of truth) +
  `XXX.svg` (generated artifact) + the .md embeds the SVG via a plain
  image reference. This works in *every* Markdown viewer today (GitHub,
  VS Code, Obsidian, …) with zero ecosystem buy-in — the bootstrap
  problem is solved by not requiring any FigDown awareness on the read
  side.
- **Weak point to solve**: it moves the source out of the .md — an AI
  reading the .md sees only an image link, not the text (weakening R9's
  dual-channel-in-one-file model). Candidate mitigations (not mutually
  exclusive):
  (a) **Same-basename convention**, normative: `figure.svg` ⇔ `figure.fd`
      in the same directory; AI agents are taught "when you see X.svg,
      read X.fd".
  (b) **Self-carrying SVG**: the renderer embeds the FigDown source
      inside the SVG itself (`<metadata>`/`<desc>`), plus a hash of the
      source — the artifact carries its own truth, and staleness is
      detectable (directly satisfies R9's pairing/desync requirement).
  (c) Inline fenced ```figdown block in the .md next to (or instead of)
      the image, for the day viewers render it natively — the Mermaid
      endgame.
- Suggested staging: **Stage 0** = sidecar convention + CLI generator
  (works everywhere, today); **Stage 1** = fenced-block rendering via
  plugins (VS Code extension, GitHub-style native support as adoption
  grows); the sidecar convention remains valid forever as the
  lowest-common-denominator fallback.
- The `.fd` → `.svg` generation step needs a definition of *when* it
  runs: manual CLI, editor-on-save, file watcher, pre-commit hook, or CI
  — candidates to standardize as recommended (non-normative) workflows.

### R15 — Prior-art landscape: adjacent projects exist; the target intersection does not (2026-07-02)

**Trigger**: the user asked "isn't there already a similar project? this need
seems inevitably a trend". Quick survey (2026-07-02; a full `prior-art.md`
deep survey is a planned follow-up):

- **D2** (Terrastruct) — the closest neighbor. Modern declarative diagram
  language, multiple layout engines (dagre/ELK/proprietary TALA),
  deterministic (same input → same output), some position control
  (`near`), positioned explicitly as "better than Mermaid".
- **Mermaid** — the de-facto language LLMs already write (GitHub renders it
  natively), but minimal layout control; positions cannot be pinned.
- **PlantUML / blockdiag family / WaveDrom / Graphviz** — broad type
  coverage collectively (timing, nwdiag, bitfield) but fragmented across
  languages; hardware docs need several of them combined.
- **draw.io / Excalidraw** — important precedent: `.drawio.svg` /
  `.excalidraw.svg` embed the source inside the SVG (= R14's self-carrying
  artifact). But GUI-first; the "source" is coordinate serialization, not
  semantically meaningful text for AI.
- **Academic (DiagrammerGPT etc.)** — LLM plans layout and generates
  images; goal is generation, not a maintainable knowledge source.

**FigDown differentiators no existing project promises**:
1. Cross-edit **layout stability** as a spec guarantee (D1 grade 2:
   local edit → local change) — D2's determinism covers identical input
   only; adding one node may still reflow everything.
2. **Pinned params are rigid, auto-layout adapts around them** as a core
   axiom (D2 has partial ability, not a normative commitment).
3. **Normative source↔artifact pairing** (SVG↔text sync/staleness
   detection as part of the standard).
4. **GUI = text edit** editor contract.
5. Hardware/network-doc type coverage (bitfield + waveform + topology +
   lookup chains) in **one** language.
6. **AI teaching token cost** as a first-class design metric.

### R16 — Templates: the figure *type* is an application profile (2026-07-02)

**Original**: Return to a "template" concept — the figure categories from
our census. Each figure type exists to convey different information, so
**the same keyword may carry different meaning per type**. The type should
be treated as a template (an application), which is an inherent
optimization.

**Interpretation**:
- One core grammar (lexical rules, attribute model, pin/layer semantics),
  many **templates** = per-figure-type vocabularies and defaults:
  1. Per-template keyword meaning: `node` in `topology` is a device
     (icon-ish default), in `flowchart` a step (rect), in `block` a
     module — the template disambiguates.
  2. Per-template defaults: R13 upgraded — defaults are chosen from the
     census statistics *of that bucket* (flowchart defaults `flow down`,
     block defaults `flow right`, topology defaults undirected edges…).
  3. Per-template AI teaching unit (R7 maximized): teach the core + only
     the template in use.
- **Census buckets = the template list and its priority order**; the
  classified sample folders become each template's design corpus and
  acceptance set. "Classification is design."
- Resolves the node-shape question: `kind` vocabularies are defined per
  template; `shape=` remains a cross-template presentation override.
- Syntax surface: the version header declares the template, e.g.
  `figdown 0.1 block`. Typed blocks (bitfield/table/wave) are templates
  that can also embed in a scene document (mixed documents, cf. OQ-S5).
- Guardrail (R11): a new template requires corpus evidence — templates
  must not metastasize. Mermaid validates the pattern (first word
  declares the diagram type) but FigDown templates share one core
  grammar rather than being N separate languages.

### R17 — Tables: Markdown mental model + merging/colors; mine the sample folder (2026-07-02)

**Original**: Tables need cell merging (rowspan/colspan). Markdown does
tables well; our difference is (a) rendering them *as an image*, (b)
extending beyond what MD can express — merging, colors, and whatever
other needs **the collected image library** reveals.

**Interpretation**:
- Clarification: GFM tables actually *cannot* merge cells — that gap is
  exactly part of FigDown's value. The MD table remains the mental model
  (R11 borrow), FigDown adds merging + per-cell color + image artifact.
- Syntax settled in draft §4.2: unquoted `^` = merge up (rowspan),
  unquoted `<` = merge left (colspan), quoted forms are literals;
  `cell r,c color=…` for per-cell marks (annotation attaches to an
  address).
- **Method (user-directed): mine `classified/table-matrix/` (212 unique
  samples, 917 weighted) for the table feature list** — multi-level
  headers, alignment, borders, column widths… The census folders are the
  requirements source for every template (R16 "classification is
  design").
- **Survey completed (2026-07-02, 5 vision agents, 212 samples)**:
  cellcolor 58.5% · merged 41.5% · headercol 41.0% · multiheader 34.9% ·
  multitable 20.8% · colwidth 20.3% · partialborder 17.0% · memmap
  14.2% · rowhl 12.3% · symbol 11.8% · plain only 6.6% · alignmix 1.4% ·
  rotated 0.5%. Consequences: multiheader promoted to must-have (now
  `head` repeatable lines in the draft + PoC); alignmix/rotated cut from
  v0.1 with evidence; partialborder/memmap parked as v0.2 candidates.
  Raw data: figdown-samples/results/table-features.*.tsv.

### Open question OQ1 — Build on D2 vs. a new language (2026-07-02)

D2 is close enough that R11 (survey before invent) obliges a deep read of
D2's language, layout engines, and license before deciding whether FigDown
should be an extension/profile over D2 semantics or a new language.
Status: **open**.

**Finding (2026-07-02): D2 has almost no Markdown-ecosystem penetration.**
No native rendering on GitHub/GitLab (open community request only); an
official Obsidian plugin (requires local D2 CLI); VS Code extension serves
`.d2` files (markdown-preview rendering still a feature request). Two
consequences: (1) strongly validates R14's write-side-rendering/sidecar
strategy — even a company-backed, technically superior language cannot get
read-side viewer adoption, so FigDown must not depend on it; (2) reshapes
OQ1 — "borrow D2's ecosystem" is not a real argument (there is none to
borrow); the remaining case for D2 is language design + layout-engine
reuse, e.g. the D2 CLI as one renderer backend in our pipeline.

## Open questions

<!-- Ambiguities found in the requirements, to confirm with the user -->

- **OQ1**: Build on D2 vs. new language (see R15). Requires deep D2 survey.

## Decisions

<!-- Formal decisions after discussion converges -->

### D1 — The renderer is a deterministic program, no LLM dependency (2026-07-02)

Text→figure conversion is performed by a **pure program (no LLM API)**, as
in the mermaid model; LLM conversion is only an early transitional scheme.
Syntax design must guarantee mechanical renderability (no fuzzy semantics
requiring LLM interpretation). Three-grade stability commitment:
(1) same source → same figure; (2) local edit → local change, all else
as-is; (3) written by human / AI / editor — equivalent source → equivalent
figure.

### D2 — Project name: **FigDown** (2026-07-02)

The project is named **FigDown** (Figure + Markdown), tagline:
*"Figures as text — one source, two readers."*
- Positioning understood in one second: "the figure layer of Markdown";
  naming follows the Markdown family convention.
- File extension candidates: `.figdown` / `.fd`; fenced-block language tag:
  ```figdown.
- GitHub checked, no major name collisions (2026-07-02). Rejected:
  Graphein (taken by a protein graph library), Isograph (taken by a
  GraphQL framework), Semagram (taken by academic projects), Duograph,
  Textagram (available but not chosen).
- Plan: publish on GitHub for open collaboration and refinement.

### D3 — Documentation language convention: English primary, Traditional Chinese in parallel (2026-07-02)

To gather ideas on GitHub, documents use **English as the primary file**:
`xxx.md` (English) with `xxx.zh-tw.md` (Traditional Chinese) maintained in
parallel. These notes follow the convention: `requirements-notes.md` (EN,
this file) + `requirements-notes.zh-tw.md`.

### D4 — Pins are absolute px; first drag freezes the whole layout (2026-07-02)

Born from PoC testing (the user dragged one node and the whole figure
reflowed). Three rules, now in the syntax draft (§3, OQ-S2 resolved):
1. `pin at=` uses **absolute canvas px** — canvas-relative fractions were
   tried and rejected (canvas growth moved every fractional pin,
   defeating the purpose of pinning).
2. **Pin-on-first-touch**: the editor materializes *all* node positions
   into `pin` lines on the user's first drag; afterwards layout is fully
   manual and the algorithm stands down. Auto-layout also computes ALL
   nodes (pinned ones hold their slot) so pinning X never reflows Y.
3. **Edges are always derived** from node borders — they adapt
   automatically and can never be pinned.
