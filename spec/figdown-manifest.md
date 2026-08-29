# FigDown Publication Manifest — profile 1

> Status: **normative for the PROFILE**, not for the language. Nothing here
> adds, removes or changes a FigDown construct, a model field, an engine
> behaviour or a byte of any artifact: every rule below is either a decision
> already RULED in `decisions/registry.md` (`PUBLICATION-MANIFEST-PROFILE`, plus `ACCESSIBILITY-PROFILE`/`ACCESSIBLE-DESCRIPTION-SOURCES`
> for the one field this profile only points at) or a direct implementation
> of one. Where this document and `decisions/registry.md`
> disagree, the proposal is the reasoning record and this document is the
> rule — read the proposal for WHY, read this document for WHAT.
>
> **Audience: a publisher who wants to record where a figure's knowledge came
> from and how far anyone has checked it**, and any tool that reads such a
> record — a build cache, an index, a review queue, a citation checker.
> Nothing here is read by the FigDown engine (`editor/figdown.html`), and
> nothing here is required to render, embed or ship a figure; see §5.
>
> Provenance: `decisions/registry.md` (filed as
> `PUBLICATION-MANIFEST-PROFILE`; ruled 2026-08-22 as `PUBLICATION-MANIFEST-PROFILE`, `MANIFEST-REVIEW-STATE`, `MANIFEST-DEPENDENCY-AND-SEMANTIC-SLOTS`, `PER-ELEMENT-PROVENANCE`), and the 1.0
> gate's criterion **P1** in `decisions/registry.md`. The companion
> profile for a figure's non-visual name and description is
> `decisions/registry.md`
> (`ACCESSIBILITY-PROFILE` / P2, ruled as `ACCESSIBILITY-PROFILE`); this document's `accessibility`
> field (§3.7) is a pointer into that profile's states and nothing more.
>
>
> **Section numbers §0–§8 are stable.** Cite them; do not renumber.

## 0. What this profile is, in one page

A published FigDown figure — a `.fd` and its rendered `.svg` — already
answers two questions and cannot answer two more:

| Question | Answered by | Where |
|---|---|---|
| What text drew this picture? | the embedded source + `data-sha256` | artifact, core §7 |
| Which engine drew it, with which options? | `data-engine-version`, `data-render-options` | artifact, core §7 |
| **Where did the knowledge in it come from?** | **nothing, without this profile** | — |
| **How far has anyone checked it?** | **nothing, without this profile** | — |

The first two are **integrity** facts about a pair of files. Core §15.6 says
in as many words that `data-sha256` *authenticates nothing*: it proves a
picture matches the text beside it, never that the text is true, and never
who stands behind it. The last two are **publication** facts about a claim,
and until this profile they had no carrier anywhere in this repository.

**The profile: one OPTIONAL JSON sidecar per published `.fd`**, carrying
identity, hashes, provenance, review state and dependencies — and nothing
else. `X.manifest.json`, same directory, same basename as `X.fd` ⇔ `X.svg`
(§1.1). It does not enter the SVG, it does not change the language, it is
never required by a host or by this repository's own gates beyond
`gate:manifest` checking the shape of whichever manifests exist, and its
absence asserts nothing:

> **A missing manifest means nobody wrote one — never unreviewed, never no
> provenance.**

This is the language's own §12.3 absence rule (core §12.3), applied to the
profile rather than invented for it: an absent field states nothing about
the field's value, and an absent manifest states nothing about the figure's
provenance or review status. Reading "no manifest" as "unreviewed" is exactly
as wrong as reading an unwritten `label=` as an empty one.

**What this profile does not do**, named here and stated in full in §8: it
does not enter the SVG, does not change the language, is not required for
host conformance (`spec/host-profile.md` §5), does not authenticate
anything, and does not say when a publication pipeline runs.

**Requirement keywords.** The key words of BCP 14
([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119),
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) are used in this document
as core **§0.1** declares them, and only when they appear in all capitals.
Its zh-tw twin keeps the English keywords rather than translating them, and
says so in the same place.

**Conformance class, and two roles that are not one.** The class this
profile binds is the **Publisher** — the *publisher* of the Audience line
above, and one of the six classes core **§0.2** closes the list at (`CONFORMANCE-CLASS-LIST`).
Its two other actor nouns are **roles local to this profile**, not
conformance classes and not claimable as such: the **verifier** of §4, which
checks a manifest against the files it names, and the **consumer** of
§2.1(b), which reads a manifest. **This document's *consumer* is NOT core
§12.7's Reading agent** — that class reads the FigDown model and never a
manifest — and nothing stated here reaches it; the two share a spelling and
nothing else. *engine* in this document is §0.2's label for
Parser ∧ Renderer, which this profile binds nowhere: *"Nothing here is read
by the FigDown engine"* is exactly that.

---

## 1. Identity and location

### 1.1 File name and pairing

The pairing core §7 makes normative is `X.fd` ⇔ `X.svg`. The manifest is the
**third member of that set** and takes the same basename, same directory:

**`X.manifest.json`.**

Never `X.fd.json` (collides with the model-projection convention used for
conformance goldens) and never `X.pub.json` (the prepared alternative, kept
in reserve — see `decisions/registry.md` for the
rejection). This repository also has `archive/MANIFEST.tsv`, the per-release
archive ledger (`gate:archive`, core §13.5); the two never share a directory
or an extension, and this document always says **publication manifest** in
full when the distance to that file matters.

### 1.2 Per FILE, never per section

A `.fd` MAY hold more than one `figdown` section, and the whole file renders
as **one** `.svg` (core §1). No FigDown syntax names a section —
`spec/host-profile.md` §3 records that the `sN_` id prefixes the engine
writes are a collision device, never a locator — so a manifest is **per
FILE**.

Where a fact is genuinely per section — a two-section figure transcribing
two different source figures — the manifest carries it as an array **indexed
by document order and by nothing else**. A manifest MUST NOT invent a
section identifier: doing so would be a locator, and inventing one in a
sidecar would pre-empt a language decision from outside the language. A
single-valued restated field (`language.version`, §3.2) that a multi-section
file's sections declare differently is checked against the **FIRST**
section's value only, by the same convention `ACCESSIBILITY-PROFILE` uses for the artifact's
non-visual `<title>` — stated here explicitly because, unlike the title
convention, no ruling names this case; see §7's open item.

### 1.3 Optional, and its absence asserts nothing

No `.fd` requires a manifest; no host requires one to render
(`spec/host-profile.md` §5 already excludes manifests from host conformance,
and this profile does not edit that). §0's absence sentence is the rule; this
subsection exists only to give it a section number to cite.

---

## 2. Shape rules the whole profile obeys

Three, adopted from the language rather than invented for the profile
(`decisions/registry.md`; `PUBLICATION-MANIFEST-PROFILE`):

1. **Closed.** An unknown key is an **error**, never ignored — the same axiom
   as the language (core §8, §12.3) and the same choice
   [`spec/figdown-model.schema.json`](figdown-model.schema.json) makes with
   `additionalProperties: false` at every object level. A profile that
   tolerates unknown keys cannot be validated, and a validator nobody can
   fail is decoration. `spec/figdown-manifest.schema.json` states this shape
   in full and `tools/manifest-check.js` (`gate:manifest`) checks it on every
   run.
2. **One extension door, and it is the family's only one.** Keys prefixed
   `x-` are the only admissible unknowns, spelled **`x-<owner>-<key>`**. The
   door was RESERVED pending the extension policy from the day this profile
   shipped; **that policy is RULED (`LANGUAGE-EXTENSION-POLICY`/`MANIFEST-EXTENSION-NAMESPACE`, 2026-08-23)** and §2.1 states what the door means. The
   verifier reports an `x-` key, never fails on it (§4 assertion E).
   Everywhere else in the family the same prefix is **closed**: the language
   takes no `x-` keyword and no `x-` option key, ever (core §10, `LANGUAGE-EXTENSION-POLICY`), and the
   rendered artifact takes no third-party `data-*` at all
   (`spec/host-profile.md` §5, `LAYER-EXTENSION-DOORS`). **`x-` means "not FigDown's", and this
   sidecar is the one file in which something that is not FigDown's may be
   written.**
3. **Versioned in its first key.** `"figdown_manifest": "1"` is the first key
   of every manifest. A consumer that does not know the version stops; it
   does not guess — the same rule core §13.7 states for an engine reading a
   declared language version.

### 2.1 The extension door, in full (`MANIFEST-EXTENSION-NAMESPACE`)

Four rules, and no fifth. There is **no registry, no allocation and no
application**: nobody asks permission and nobody keeps a list, because a list
of extension owners is a maintenance surface whose expected membership was
measured at zero (`decisions/registry.md`).

**(a) The spelling is `x-<owner>-<key>`**, where `<owner>` is a token the
owner controls and can be traced to — a DNS label they hold, a GitHub org, a
registered project name. `x-acme-review-queue`, not `x-queue`. The reason is
not tidiness: an unowned `x-` key is a name two publishers collide on
silently — both manifests validate, both call the key `x-status`, and a
consumer merging two trees now holds one key with two meanings and no way to
tell. Owner-prefixing makes that collision impossible **without** a registry,
which is the whole point: the namespace is delegated to the owner rather than
administered by this project.

**(b) A consumer has three duties, and they are MUSTs.**

1. A consumer **MUST NOT** treat an unknown `x-` key, or its absence, as
   meaning anything about the figure. *Never infer.*
2. A consumer **MUST** be able to tell its user that the file carried keys it
   did not describe. The presence of any `x-` key is a statement that this
   manifest carries information the profile does not describe, which is
   exactly the semantic-completeness signal core §12.7 gives a reading agent
   one layer in. *Always reportable.* This generalises `PUBLICATION-MANIFEST-PROFILE` assertion E from
   *our* verifier to **any** conforming consumer.
3. A consumer **MUST NOT** let an `x-` key change the value of any profile
   field. An extension may add facts; it may never revise, override or shadow
   one. *Never revise.*

RFC 6709 §4.7 names two disciplines for unknown extensions: the must-ignore
option is to *specify that unknown extensions be "silently discarded"*, and
the must-understand option is that *a recipient encountering an unknown
extension may be required to explicitly reject it and to return an error*.
This is **neither**, deliberately: a manifest is a record, not a negotiation,
so the third option — accept, ignore for every conclusion, and **report** —
is available here in a way it is not in a protocol.

**(c) An `x-` key MUST NOT carry a fact a profile field already carries.** No
shadow review state, no second source hash, no parallel provenance array. The
failure this prevents is `MANIFEST-REVIEW-STATE`'s, in a new place: two claims about the same
thing, one of them unbound, and no rule saying which wins.

**(d) Promotion is NEVER by rename, and never by keeping the spelling.** An
`x-` key does not become a profile key. The path is that the accumulated
`x-` corpus is **evidence**: when several independent publishers are measured
to carry `x-<owner>-thing` for the same meaning, that measurement is
[`.github/CONTRIBUTING.md`](../.github/CONTRIBUTING.md) §2 step 2 — corpus evidence with a frequency — and
the profile then adds a key with **its own, unprefixed, freshly chosen
spelling**, through the same process that added `provenance` and `review`.
The `x-` keys are not migrated: they become ordinary redundant data their
owners may delete at their own pace, and a consumer that knows both simply
prefers the profile key.

**Why, and it is the whole answer to "pressure valve or landfill".** BCP 178
(RFC 6648) Appendix B diagnoses the `X-` convention's characteristic failure
as exactly this: *"unstandardized parameters have a tendency to leak into the
protected space of standardized parameters, thus introducing the need for
migration from the 'X-' name to a standardized name. Migration, in turn,
introduces interoperability issues … because older implementations will
support only the 'X-' name and newer implementations might support only the
standardized name."* **Promotion-by-renaming is the failure;
promotion-by-new-key is not**, because the old spelling never had to work and
the new one never has to be recognised by an old reader — the old reader
simply keeps reporting an `x-` key it does not know, which duty 2 already
requires of it.

**The trade this profile knowingly makes.** RFC 6648 §3 recommends that
creators of new parameters *SHOULD NOT prefix their parameter names with
"X-" or similar constructs*, and this profile keeps a prefix that BCP
deprecates. It is still the right call **here**, and `MANIFEST-EXTENSION-NAMESPACE` rules it
explicitly rather than leaving it implicit: BCP 178 addresses *parameter
creators* choosing names inside a shared registry space, while this `^x-` is
a **schema-level partition** that separates delegated names from profile
names. The BCP's substantive recommendation — assume your parameter may
become standard, and do not build a migration into your naming — is honoured
in full by rule (d), which is where the harm actually lived.

**No `x-` may ever be load-bearing.** RFC 6709 §4.7: *"Since a mandatory
extension can result in an interoperability failure when communicating with a
party that does not support the extension, this designation may not be
permitted for vendor-specific extensions and may only be allowed for
Standards Track extensions."* A consumer that implements no extension at all
must still be correct about everything this profile states.

---

## 3. The fields

Field names below are the ones `PUBLICATION-MANIFEST-PROFILE` ruled; `spec/figdown-manifest.schema.json`
is the normative shape and this section states the rule each field carries.

### 3.1 Document identity (`PUBLICATION-MANIFEST-PROFILE`)

```json
"document": { "id": "tcp-header", "path": "examples/showcase/tcp-header.fd", "sections": 1 }
```

- `id` is a **publisher-scoped logical name** for the figure, stable across
  renames of the file. It is **not** an element identity and **not** a
  cross-document identity: the identity model this project adopted
  deliberately left identity across documents closed, and this profile
  does not reopen it. Nothing in FigDown may reference this id;
  only the pipeline around the figure may.
- `path` is repository-relative and **advisory** — not subject to the
  restatement rule (§3.2), because no artifact field carries a path to
  disagree with. A manifest that travels without its tree still has `id`.
- `sections` is a count in document order, not a locator (§1.2).

### 3.2 Language, renderer and the restatement rule (`PUBLICATION-MANIFEST-PROFILE`)

```json
"language": { "version": "0.5", "genres": ["topology"] },
"renderer": { "name": "figdown-svg", "engine_version": "0.5", "render_options": "with-title" }
```

`language.version` and `language.genres` come from the source's own
`figdown <version> <genre>` header(s), in document order (§1.2 for the
multi-section case). `renderer` restates the artifact's `data-engine-version`
and, when the artifact carries one, `data-render-options` (core §7) —
`render_options` is present in the manifest **only** when the artifact
carries a non-default option, symmetric with the artifact's own rule that
"any non-default option MUST be recorded" (core §7).

**The restatement rule, because a restatement is a place two facts can
disagree.** Where the manifest restates an artifact-carried fact —
`renderer.engine_version`, `renderer.render_options`, `language.version`, and
`source.sha256` (§3.3) — **a mismatch is an error in the manifest, never a
merge and never a vote**: the `.fd` and its `.svg` are the pair core §7
defines, and a sidecar that disagrees with the pair is wrong by construction.
`tools/manifest-check.js` checks this as assertion B on every manifest it
finds beside a real `.fd`/`.svg` pair.

### 3.3 Source hash (`PUBLICATION-MANIFEST-PROFILE`)

```json
"source": { "sha256": "…64 hex…", "bytes": 1843 }
```

The same hash the artifact carries, over the same bytes, for the same reason
(core §7). `bytes` is a cheap second signal that costs nothing and catches a
truncated copy before the hash is even computed.

**What it proves is what core §15.6 says it proves: integrity, not
provenance.** The manifest does not upgrade the claim — §3.6 is where
provenance lives, and its own honesty sentence is the same one, moved one
layer out.

### 3.4 `semantic_sha256` — a designed, RESERVED slot (`MANIFEST-DEPENDENCY-AND-SEMANTIC-SLOTS`)

```json
"semantic": { "algorithm": "figdown-semantic-1+jcs", "sha256": "…64 hex…" }
```

Three rules land now; the hash itself does not.

1. **The algorithm is named in the manifest.** A bare hash is unusable the
   day a second algorithm exists; a named one is either recognized or
   refused. The name binds *(semantic projection version, canonicalization)*
   as one token, because those two together determine the bytes.
2. **An unrecognized algorithm makes the field UNREADABLE, not ignorable.** A
   consumer that does not know the name MUST NOT treat the figure as
   unchanged, and MUST NOT treat it as changed either; it reports
   `unknown-semantic-algorithm` and falls back to `source.sha256`. Silent
   fallback would let a meaning change pass as a byte change — the exact
   confusion the semantic-projection work exists to remove.
3. **Absence is not "meaning unchanged".** §0's absence rule covers it: until
   the semantic-projection work's Stage 2 lands a producer, every manifest OMITS this block.

**The dependency, stated honestly.** The semantic-projection work is
registered and not yet ruled: its Stage 1 shipped as
`tools/figdown-diff.js`; Stage 2 — the normative semantic partition and the
hash itself — remains OPEN, unchanged by this document. Core §12.5.2 already
records the likely shape (JCS) without settling it. A manifest shipped today
simply never carries the `semantic` block, and that omission is not evidence
of anything (§0).

### 3.5 Source provenance (`PUBLICATION-MANIFEST-PROFILE`)

```json
"provenance": [{
  "relation": "transcribed-from",
  "document_id": "SPEC-1234",
  "revision": "v0.4, 2025-12-09",
  "document_sha256": "…64 hex…",
  "uri": "https://…",
  "section": "§3.1.8",
  "figure": "Figure 3-6",
  "locator": { "paragraph": 342 },
  "bbox": { "page": 41, "unit": "pt", "x": 72, "y": 220, "w": 380, "h": 210 }
}]
```

- **It is an ARRAY.** A transcribed figure routinely merges a drawing with
  the prose around it. One provenance object per source claim.
- **`relation` is a small CLOSED vocabulary**, three different claims:
  `transcribed-from` (this figure is a re-drawing of that source figure),
  `derived-from` (this figure was built from that source's text, not from a
  picture), `about` (this figure documents that thing but copies nothing). A
  reader who cannot tell them apart cannot use any of them.
- **Every locator field is OPTIONAL and every one is a claim.** `section`,
  `figure`, `locator` and `bbox` are the publisher's assertions about
  somebody else's document. `document_sha256` is the only field that turns a
  claim about a NAME into a claim about BYTES — and only for a consumer
  holding those bytes. **Every provenance entry MUST carry `relation` and at
  least one of `section`, `figure`, `locator` or `bbox`** — `document_id`,
  `revision`, `document_sha256` and `uri` name WHICH document; they are not,
  on their own, a claim about WHERE in it (`tools/manifest-check.js`
  assertion D).
- **`bbox` requires `page`** (the only stated frame this profile implements
  today — the design reserves room for "another stated frame" without naming
  one, so a future ruling extends this rather than replacing `page`) **and a
  stated `unit`.** A bounding box with no coordinate system is four numbers,
  not a locator.
- **`locator`'s internal shape is deliberately OPEN**, unlike everything else
  in this profile: no ruling closes its vocabulary, and the one example given
  (`{"paragraph": 342}`) is an example, not an enumeration. A publisher may
  write whatever locator keys the source document's own structure calls for,
  until a future ruling closes this.

**The honesty sentence, verbatim:**

> A manifest's provenance block records what the publisher asserts about
> where a figure came from. It authenticates nothing. A consumer that needs
> the source must obtain it.

This is core §15.6's sentence, moved one layer out.

### 3.6 Review state (`MANIFEST-REVIEW-STATE`)

```json
"review": {
  "state": "source-verified",
  "by": "…", "date": "2026-08-22",
  "of_source_sha256": "…64 hex…",
  "note": "checked statement by statement against §3.1.8"
}
```

**The enum, four values, each a different claim with a different setter —
and NOT a ladder:**

| state | what it claims | who may set it |
|---|---|---|
| `authored` | a person or an agent wrote this `.fd` directly. Claims **nothing** about any external source | the author, or the tool that generated it |
| `transcribed` | the figure was produced FROM a source named in `provenance`. The claim is that the source was **read** — **not** that the result was checked | the transcriber |
| `reviewed` | a party who did not author it read the figure against its subject and judged it right. The claim is **human judgement**; `by` MUST name the party | anyone who is not the author |
| `source-verified` | the figure was checked against the cited source's own text, and the check is recorded. The claim is **against the source**, not about taste | anyone holding the source in `provenance` |

`reviewed` and `source-verified` are **different claims** — one is judgement,
one is correspondence — and a figure may honestly carry either without the
other. A manifest records **at most one** state, the strongest claim actually
made, with its evidence; it does not accumulate a history. (A pipeline that
wants history keeps a log; this is a manifest.)

**The binding rule, the field with the strongest measured evidence behind
it.** `of_source_sha256` is the hash the state is *about*.

> A verifier MUST report a manifest whose `review.of_source_sha256` differs
> from `source.sha256` as **STALE** — fatal, not a warning: the figure
> changed after it was reviewed, so the claim no longer has a subject.

An **UNBOUND** state (`of_source_sha256` absent) is **reported, not
failed** — a backfill note, so a publisher can adopt the profile
incrementally without repainting every shipped figure red. Every hash in
this profile binds the **full 64 hex**, never truncated — a machine-readable
field has no reason to.

### 3.7 Accessibility state — a POINTER (`PUBLICATION-MANIFEST-PROFILE`, resolved against `ACCESSIBILITY-PROFILE`/`ACCESSIBLE-DESCRIPTION-SOURCES`), plus the `role` declaration (`MANIFEST-ACCESSIBILITY-ROLE`)

```json
"accessibility": { "state": "derived", "of_source_sha256": "…", "by": "…", "date": "…", "role": "img" }
```

The **states and their meanings belong to the accessibility profile**
(`decisions/registry.md`; `ACCESSIBLE-DESCRIPTION-SOURCES`), not to this
document. This profile decides only that the field exists, that it is
**bound the same way §3.6 binds** review — a description reviewed against
one source is not reviewed for the next — and that a manifest **never
restates the description text itself**. The description lives in the
artifact's `<desc>`; the manifest records how far anyone has checked it. Two
copies of a description would be two things to disagree, and the artifact is
the one a reader actually receives.

For reference, `ACCESSIBLE-DESCRIPTION-SOURCES`'s five states: `absent` (no description exists — not
"the figure needs none"), `derived` (a deterministic model projection,
authoritative about the model and nothing else, set by the tool),
`generated` (an LLM wrote it — **never publishable on its own** under the
accessibility profile, set by the tool), `authored` (a human wrote it, set by
the author), `reviewed` (a human read it against the figure and accepted it,
bound to the source hash). This profile does not define these; it only
points at them.

**`role` — CLOSED, OPTIONAL, two members (`MANIFEST-ACCESSIBILITY-ROLE`).** `spec/figdown-a11y.md`
§2.2 requires a publisher choosing `role="img"` on the artifact to record
that choice **in this block**, and until `MANIFEST-ACCESSIBILITY-ROLE` the block shipped with no field
that could carry it — a MUST landed against a block that had already shipped
closed the same morning (`decisions/registry.md` P2's carried
obligation). `role` closes that gap: `"graphics-document"` or `"img"`, and
only those two — the same two the accessibility profile's own role vocabulary
admits (`spec/figdown-a11y.md` §2.1–§2.2). **Absent means the profile's
default requirement (`graphics-document`) and asserts nothing more** — the
same absence rule §0 states for the manifest as a whole, applied to this one
field. It is a **declaration**, not a restatement of the artifact's own
`role=` attribute: §3.2's restatement rule does not reach it, because
declaring the choice is the publisher's act and nothing in this profile
requires a renderer to read it back. `tools/a11y-check.js` assertion D reads
it to check the real fact — a role of `img` on the artifact with a matching
`accessibility.role: "img"` beside it — at its ruled `warn` severity
(`spec/figdown-a11y.md` §7), unchanged by this field's arrival: the severity
question and the field-existence question are separate, and only the second
is what `MANIFEST-ACCESSIBILITY-ROLE` closes.

### 3.8 Dependencies and invalidation (`MANIFEST-DEPENDENCY-AND-SEMANTIC-SLOTS`)

```json
"dependencies": [
  { "kind": "source", "path": "figures/common-legend.fd", "sha256": "…" },
  { "kind": "external", "id": "SPEC-1234", "sha256": "…" }
]
```

A build cache's input list: if any listed hash changes, whatever this
pipeline derived from the figure is stale. **Two rules make it safe, both
adopted verbatim, both binding:**

1. **Invalidation is a CACHE signal, never a correctness claim.** A changed
   dependency says *recompute*, never *the figure is wrong*. Only the pair
   `.fd` ⇔ `.svg` can say the latter (`spec/host-profile.md` §2.3).
2. **A stale dependency never authorizes a rebuild the artifact policy
   forbids.** `spec/host-profile.md` §2.3 splits publishing hosts (refuse a
   stale artifact) from displaying hosts (warn visibly), and §4 requires a
   REFUSED figure's artifact to be **deleted**, not rebuilt. A manifest MUST
   NOT be read as authorizing either a rebuild or a display that policy
   forbids.

---

## 4. The verifier — five assertions

`tools/manifest-check.js` (`gate:manifest`) implements the five assertions
`PUBLICATION-MANIFEST-PROFILE` pre-registered before any manifest shipped, exactly as ruled:

| | assertion |
|---|---|
| **A** | the manifest parses and its version is known (`figdown_manifest: "1"`) |
| **B** | every restated field matches the pair (§3.2's rule) — a mismatch is an error IN THE MANIFEST |
| **C** | every hash is well-formed, and `review.of_source_sha256` (and, on the same binding, `accessibility.of_source_sha256`) equals `source.sha256` or is reported STALE (fatal) / UNBOUND (reported, not fatal) |
| **D** | every `provenance` entry carries a `relation` from the closed vocabulary and at least one locator field |
| **E** | unknown keys FAIL; `x-` keys are reported as reserved, not an error |

`spec/figdown-manifest.schema.json` states the shape (assertions A's "parses"
half, most of E, and every field's type/enum/pattern); the verifier adds the
cross-field and cross-file checks JSON Schema cannot express on its own — a
hash that must match a SIBLING file, a state bound to a hash that may have
moved. It validates every `X.manifest.json` found in this repository and
every fixture in `tools/manifest-fixtures/` (valid fixtures must pass,
invalid ones must fail for their recorded reason), and reports "0 manifests
found" — cleanly, exit 0 — when the tree carries none, because §0's absence
rule makes an empty corpus a true statement, not a broken scan.

---

## 5. What this profile does not do

Named so that silence is not read as permission:

- **It does not enter the SVG.** No new `data-*`, no new metadata element, no
  byte of artifact change. Core §7 makes an artifact a pure function of
  (source, recorded options), and `RENDERING-DETERMINISM` promises byte-identical output per
  engine version; a manifest that changed artifact bytes would be a
  language-release event pretending to be a profile.
- **It does not change the language.** No directive, no option key, no model
  field. `PUBLICATION-MANIFEST-PROFILE` was filed as *non-core: no grammar impact*, and this document
  keeps that scope exactly.
- **It is not required.** Not by a host (`spec/host-profile.md` §5), not by
  `gate:artifact`, not by any other gate in this repository. A future ruling
  could require one for figures *this repository* publishes; that would be
  this repository's own policy, never the profile's requirement.
- **It authenticates nothing.** §3.3 and §3.5 both say so, in the same words
  core §15.6 uses for `data-sha256`. A signature story — who vouches for a
  manifest — is a different object with different machinery and is not
  opened here.
- **It does not say when a publication pipeline runs.** `MARKDOWN-EMBEDDING-CONVENTION` registered
  rebuild timing as a recommended workflow, not a normative one, and
  `spec/host-profile.md` §5 keeps it out; this profile does not reopen it.
- **It does not carry per-element provenance.** An `elements` array binding
  `node ← RFC X §4.2` was proposed and **REFUSED** (`PER-ELEMENT-PROVENANCE`), against its own
  three-condition bar — measured demand unmet by the one corpus large enough
  to demonstrate it, the reading-contract problem (a fact that exists only in
  a sidecar is invisible to a reading agent reading the `.fd`, core §12.7),
  and identity stability not met project-wide. `elements` is therefore an
  ordinary unknown key under §2 rule 1, and `tools/manifest-fixtures/`
  carries the fixture that pins this refusal. The reopen conditions are
  recorded in `decisions/registry.md` and are not
  restated here; they did not move by this document shipping.
- **It is not part of the 1.0 conformance claim.** The `INDEPENDENT-IMPLEMENTATION-CRITERION` adversarial
  exercise's inputs are the frozen spec partition and the frozen normative
  conformance partition; a non-core profile is in neither, so no second
  implementation is measured against it and conformance to this profile is
  never part of what `INDEPENDENT-IMPLEMENTATION-CRITERION` governs.

---

## 6. Claim → anchor

Every normative sentence above, and the ruling, core section or shipped
check it resolves to.

| # | Rule (§) | Anchor |
|---|---|---|
| 1 | A manifest is `X.manifest.json`, same basename and directory as `X.fd`/`X.svg` (§1.1) | `PUBLICATION-MANIFEST-PROFILE`; core §7 (the pairing this extends) |
| 2 | A manifest is per FILE, sections indexed by document order only, no invented locator (§1.2) | `PUBLICATION-MANIFEST-PROFILE`; `spec/host-profile.md` §3 (`sN_` prefixes are not locators) |
| 3 | A manifest is optional; absence asserts nothing (§0, §1.3) | `PUBLICATION-MANIFEST-PROFILE`; core §12.3 (the language's own absence rule) |
| 4 | Closed: unknown key is an error; `x-` is the one door, and it is the family's only one (§2) | `PUBLICATION-MANIFEST-PROFILE` (the door); `LANGUAGE-EXTENSION-POLICY` (the language takes no `x-` keyword or option key, ever; `spec/host-profile.md` §5 for the artifact side); `spec/figdown-manifest.schema.json` (`additionalProperties: false`, `patternProperties: {"^x-": {…}}`); `tools/manifest-check.js` assertion E |
| 20 | The spelling is `x-<owner>-<key>`, and there is no registry, no allocation and no application (§2.1(a)) | `MANIFEST-EXTENSION-NAMESPACE`; `spec/figdown-manifest.schema.json`'s `^x-[^-]+(-[^-]+)+$` pattern and its `$comment`; `decisions/registry.md` (expected membership of a registry, measured at zero) |
| 21 | The consumer's three duties — never infer, always reportable, never revise (§2.1(b)) | `MANIFEST-EXTENSION-NAMESPACE`, generalising `PUBLICATION-MANIFEST-PROFILE` assertion E from this repository's verifier to any conforming consumer; `tools/manifest-check.js` assertion E (`delegated extension key (`MANIFEST-EXTENSION-NAMESPACE`)`, a notice and never a failure); RFC 6709 §4.7 (`S241`/`S242`, the two disciplines this is deliberately neither of) |
| 22 | An `x-` key MUST NOT carry a fact a profile field already carries, and MUST NOT be load-bearing (§2.1(c)) | `MANIFEST-EXTENSION-NAMESPACE`; `MANIFEST-REVIEW-STATE` (the two-claims-one-unbound failure this prevents); RFC 6709 §4.7 (`S243`) |
| 23 | Promotion is never by rename and never by keeping the spelling: the `x-` corpus is evidence for the §2 gate, which adds a fresh unprefixed key (§2.1(d)) | `MANIFEST-EXTENSION-NAMESPACE`; `.github/CONTRIBUTING.md` §2 step 2 (corpus evidence with a frequency — the gate this routes to and does not duplicate); RFC 6648 Appendix B (`S240`, the migration failure this forbids) and §3 (`S239`, the recommendation knowingly traded) |
| 5 | Versioned in its first key, `figdown_manifest: "1"` (§2) | `PUBLICATION-MANIFEST-PROFILE`; core §13.7 (the same rule for an engine's declared version) |
| 6 | `document.id` is publisher-scoped, not an element or cross-document identity (§3.1) | `PUBLICATION-MANIFEST-PROFILE`; the identity model this project adopted, which left identity across documents closed |
| 7 | Restated fields (`renderer.*`, `language.version`, `source.sha256`) — mismatch is an error in the manifest (§3.2) | `PUBLICATION-MANIFEST-PROFILE`; core §7 (the artifact fields restated); `tools/manifest-check.js` assertion B |
| 8 | `source.sha256`/`bytes` prove integrity, not provenance (§3.3) | `PUBLICATION-MANIFEST-PROFILE`; core §15.6 |
| 9 | `semantic_sha256` lands as a RESERVED slot; unknown algorithm is UNREADABLE, not ignorable; absence is not "unchanged" (§3.4) | `MANIFEST-DEPENDENCY-AND-SEMANTIC-SLOTS`; core §12.5.2 (JCS reasoning, unextended) |
| 10 | `provenance` is an array; `relation` is closed to three values; every entry needs a locator (§3.5) | `PUBLICATION-MANIFEST-PROFILE`; `tools/manifest-check.js` assertion D |
| 11 | `bbox` requires `page` and `unit` (§3.5) | `PUBLICATION-MANIFEST-PROFILE` |
| 12 | The provenance honesty sentence (§3.5) | `PUBLICATION-MANIFEST-PROFILE`; core §15.6 (the sentence this moves one layer out) |
| 13 | `review.state` is a four-value enum, not a ladder (§3.6) | `MANIFEST-REVIEW-STATE` |
| 14 | `review.of_source_sha256` binds the state; STALE is fatal, UNBOUND is reported (§3.6) | `MANIFEST-REVIEW-STATE`; `tools/manifest-check.js` assertion C |
| 15 | `accessibility` is a pointer only, bound the same way, never restating description text (§3.7) | `PUBLICATION-MANIFEST-PROFILE`, resolved against `ACCESSIBILITY-PROFILE`/`ACCESSIBLE-DESCRIPTION-SOURCES` |
| 16 | `dependencies` invalidation is a cache signal, never a correctness claim, and never authorizes a forbidden rebuild (§3.8) | `MANIFEST-DEPENDENCY-AND-SEMANTIC-SLOTS`; `spec/host-profile.md` §2.3, §4 |
| 17 | Per-element provenance (`elements`) is REFUSED (§5) | `PER-ELEMENT-PROVENANCE`; `tools/manifest-fixtures/02-elements-block.invalid.json` (the fixture pinning the refusal) |
| 18 | The five verifier assertions land as ruled (§4) | `PUBLICATION-MANIFEST-PROFILE` item 13; `tools/manifest-check.js`, `npm test` `gate:manifest` |
| 19 | `accessibility.role` is a CLOSED, OPTIONAL, two-member declaration field (`graphics-document`/`img`); absent means the default and asserts nothing more (§3.7) | `MANIFEST-ACCESSIBILITY-ROLE`; `spec/figdown-a11y.md` §2.2; `spec/figdown-manifest.schema.json` |

---

## 7. Small-vocabulary items — RULED closed for now (`MANIFEST-OPEN-VOCABULARIES`)

Four gaps this profile shipped with, each named in this section from the
start rather than silently resolved. **RULED 2026-08-22, `MANIFEST-OPEN-VOCABULARIES`: keep every one
of them exactly as it shipped, registered as corpus-driven and reopenable.**
The reason is the same for all four and is stated once: **none of them
touches the language or an artifact byte** — this is a non-core sidecar, and
for a vocabulary that lives entirely here, **closing it LATER is cheap and
closing it EARLY is not**. A tightened vocabulary invalidates manifests
already written (a value that validated yesterday fails today); a widened
one never does (a value that validates today keeps validating). Nothing in
this profile's 2026-08-22 corpus demonstrates a need to close any of the
four now, so none is closed now — this is a ruling to wait for evidence, not
an oversight.

- **Per-section restatement of `language.version`: the FIRST section wins,
  and this is now the confirmed, permanent behaviour, not a placeholder.**
  §1.2 states the convention this document's own verifier follows — the
  FIRST section's declared version, by the same analogy `ACCESSIBILITY-PROFILE` uses for the
  non-visual `<title>` — and `MANIFEST-OPEN-VOCABULARIES` adopts it as ruled rather than provisional.
  A multi-section `.fd` whose sections declare different versions is checked
  against the first only; `tools/manifest-check.js` reports this as a notice
  when it applies, never as a silent assumption. **Reopen condition:** a
  corpus demonstrating that a per-section restatement (an array, the way
  `language.genres` already is) is needed rather than merely possible.
- **`locator`'s internal vocabulary** (§3.5) **stays OPEN.** A future ruling
  that closes it narrows what a publisher may write there without changing
  anything already shipped, because an open object accepts everything a
  closed one with the same keys would. **Reopen condition:** a corpus large
  enough to show what the closed vocabulary should contain — the same bar
  `PER-ELEMENT-PROVENANCE` held per-element provenance to and the one bar this profile's other
  closed enums each met before shipping closed.
- **`bbox` implements `page` only; the alternate frame stays unnamed**
  (§3.5) — the design text names the possibility ("page, or another stated
  frame") without naming the alternate key, and `MANIFEST-OPEN-VOCABULARIES` does not name one
  either. **Reopen condition:** a non-paginated source in the corpus that
  needs a stated frame `page` cannot express.
- **`dependencies[].kind` stays CLOSED at `source`/`external`**
  (§3.8, `spec/figdown-manifest.schema.json`) — the two kinds the ruled
  design's own examples use, and no third kind is added. **Reopen
  condition:** a build pipeline in the corpus with a dependency that is
  neither a FigDown `.fd` this figure's pipeline reads nor a non-FigDown
  input.

---

## 8. The external-standard claims this profile makes

**Five, all in §2.1, all about the extension door**, and all registered in
[standards-claims.tsv](standards-claims.tsv) under the register's own rules —
one row per assertion, quoted from the document's own text rather than
paraphrased. They arrived with `MANIFEST-EXTENSION-NAMESPACE` (2026-08-23); before it this section read
*"None"*, which was true of the profile as shipped on 2026-08-22.

| id | claim | document |
|---|---|---|
| `S239` | BCP 178 recommends against creating `X-`-prefixed parameter names — the strongest external argument against the door this profile keeps, stated rather than hidden | RFC 6648 §3 |
| `S240` | the diagnosed failure of the `X-` convention is MIGRATION on promotion, not the prefix itself | RFC 6648 Appendix B |
| `S241` | the must-ignore discipline for unknown extensions | RFC 6709 §4.7 |
| `S242` | the must-understand discipline, the alternative this profile also declines | RFC 6709 §4.7 |
| `S243` | a private extension may never be load-bearing; mandatory designation is confined to standards-track extensions | RFC 6709 §4.7 |

Both RFCs were retrieved and read first-hand on 2026-08-22 (`S244`); the
reasoning that used them is `decisions/registry.md`.

This document's `$schema` names JSON Schema draft 2020-12 as an
identifier, not as a quoted claim about what the draft says — the same
convention `spec/figdown-model.schema.json` already follows without a
`spec/standards-claims.tsv` entry of its own.
