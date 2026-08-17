# FigDown Agent Guide (v0.1 draft)

> Audience: **AI agents** asked to create, maintain or read figures in
> Markdown documentation using FigDown. This file is the **entry point**,
> not the manual: it says what FigDown is for, what it asks of you, and
> which document answers your actual question. The teaching lives in
> [skill/figdown/](../skill/README.md), one file away.

## 1. What FigDown gives you

FigDown provides an option that did not exist before: an agent that needs to
show structure can write a `.fd` instead of falling back to prose. That
fallback was a limitation of the tooling, not a judgement about the content.

So the question "should this be a figure?" becomes a real choice rather than a
foregone one — and both wrong answers cost. Three nodes and two arrows usually
read better as one sentence ("the parser writes to the cache, which the lookup
engine reads"). A twelve-node dataflow does not. Author a figure when the
answer is a figure; do not draw out of habit, and do not fall back to prose out
of inertia.

**The language is general-purpose.** It covers whatever a documentation figure
covers — service architectures, build pipelines, org and data models, state
machines, memory maps, wire formats, schedules. Pick a genre by what the figure
**is**, never by its subject.

## 2. The two-reader contract

One source, two readers, and the contract between them is the whole design:

- A figure lives as a `.fd` text file — the **single source of truth**. The
  `.svg` is a deterministic build artifact for human eyes.
- **You read the `.fd` for meaning. Never OCR the `.svg`.** Structure is the
  content; placement and colour are presentation whose only job is to keep the
  rendered picture stable.
- Whatever you want a reader to *conclude* must be in text a reader can quote —
  a label, or a `class` meaning. A distinction carried only by a colour is a
  distinction the document has lost.
- The grammar is **closed**: an unknown line is an error, never ignored. If
  something seems missing, compose it from what exists or say so. Do not invent
  syntax.

Everything else — every keyword, every option key, every genre — is the
detail of those four sentences.

## 3. Where to go

**If you are doing the work, read
[`skill/figdown/SKILL.md`](../skill/figdown/SKILL.md) and stop there until it
routes you further.** It is short by design, and its router is mechanical:
line 1 of a `.fd` names its genre, so you know which reference file you need
before you need it. Reading a figure costs one extra file; authoring a
`bitfield` costs one different extra file, and neither pays for the other.

It is a Claude Code skill by packaging only. The files are ordinary Markdown —
any agent, in any framework, can read them straight out of the repository.

**If you are only READING a `.fd`, you do not need the skill at all.** The
per-genre reading files live at [`read/0.4/`](../read/0.4/reading.md) — the source
of truth, versioned by language version, so a future `read/<X.Y>/` will be
added beside it rather than over it (the frozen `read/0.1/`–`0.3/` trees are
exactly that history). Open `read/0.4/reading.md` and the one file for the
genre on line 1 and stop. The copy under `skill/figdown/reference/` is
generated from `read/0.4/` by `tools/make-skill.js` and exists only so the
installed bundle works with no repository and no network.

| Your question | Document |
|---|---|
| **I have a `.fd` in front of me and need to read it correctly** | [`read/0.4/reading.md`](../read/0.4/reading.md) plus the one file for the genre on line 1. **Nothing to install** — they are ordinary Markdown in this repository. |
| How do I write, build and embed a figure? | [`skill/figdown/SKILL.md`](../skill/figdown/SKILL.md), then whatever its router names |
| What may I conclude from a figure someone else wrote? | [`read/0.4/reading.md`](../read/0.4/reading.md) |
| How do I turn an existing drawing into a `.fd`? | [`read/0.4/transcribe.md`](../read/0.4/transcribe.md) |
| It parses, but it reads badly | [layout.md](layout.md) |
| I need to show X and cannot find the construct | [expressing.md](expressing.md) |
| How do I decide how to express a figure at all? | [authoring.md](authoring.md) |
| Is this figure worth the effort — what does the language actually do? | [showcase.md](showcase.md) |
| What is normative? | [spec/core.md](../spec/core.md); per-genre vocabulary in [spec/genres/](../spec/genres/README.md); version changes in [migrations.md](../spec/migrations.md) |

## 4. Why the syntax is not in this file

It used to be, and that was the defect. This guide carried a full grammar
cheat sheet in a single fence marked `fence-check: skip`, so not one line of
it was ever run through the engine — and it went on teaching `edge … fill=`,
which the engine rejects outright, long after that became a hard error.

The skill bundle is held to the registry by a gate: every registered keyword,
option key and enum value must be taught, no retired spelling may be taught,
and every example must parse. This document is held to none of that, so it
owns no syntax. **One document owns each fact; the other points.** Where this
guide and the bundle would disagree, the bundle is right — because something
checks it.
