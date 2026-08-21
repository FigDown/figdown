# FigDown agent skill

An installable skill that teaches an AI coding agent (Claude Code and
compatible agent frameworks) to maintain documentation figures with
FigDown: edit `.fd` sources, build deterministic `.svg` artifacts, and
embed them in Markdown with the `source:` footer convention.

The bundle is self-contained: `SKILL.md`, a `reference/` directory,
`build-svg.js` (validator/renderer CLI) and `figdown.html` (the engine
it extracts at runtime — also the editor: open it in any browser).

**It is built for progressive disclosure.** `SKILL.md` is the only file
always loaded, and it holds the workflow, the genre-independent
language, and a **router**. Everything else is pulled on demand, and
the routing rule is mechanical: line 1 of a `.fd` names its genre, so
the agent knows which file it needs before it needs it.

```
SKILL.md                                 always loaded
reference/scene.md                       genre `block` — its OWN vocabulary
reference/bitfield.md
reference/table.md
reference/layout.md                      arranging a scene
reference/reading.md                     reading a .fd for meaning
reference/transcribe.md                  transcribing an existing figure
reference/experimental/block.md          block's EXPERIMENTAL markers and zones
reference/experimental/chart.md          a chart from a table (any genre
                                         that can host one)
reference/experimental/topology.md       the five EXPERIMENTAL genres, each
reference/experimental/flowchart.md      declaring its OWN vocabulary in
reference/experimental/statechart.md     its own file, so an agent can
reference/experimental/timing.md         ignore the ones it is not using
reference/experimental/sequence.md       — the ladder genre, and the one
                                         whose load set has no layout file
```

`sequence` is the exception to the "genre file + layout file" pairing above:
both of its axes are declaration order, so nothing in the layout namespace
moves a mark there and its own file is the whole of what an author needs.

**Every scene genre's file is self-sufficient (`SUBJECT-VOCABULARY-SCOPE`).** There is
no shared scene-vocabulary file and there was never meant to be one: only
`figdown`, `title` and `layout` are cross-genre by definition, and a word two
genres spell the same is two independent declarations that happen to agree
today. So an agent authoring a `topology` figure loads `topology.md` and does
not have to follow a link into `block`'s file to find out what `bundle` means
— which is what it used to have to do, and what it found there was written for
a different domain. The file this list used to call
`reference/experimental/constructs.md` was that shared file; it was removed
with the ruling, and its contents went to the genres that own them.

The `reference/` files are a generated copy of [`read/0.5/`](../read/0.5/reading.md),
which is the source of truth; see "Keeping the bundle fresh" below. If you only
want to READ a `.fd` from this repository, go to `read/0.5/` and install
nothing.

An agent *reading* a figure loads `SKILL.md` + `reference/reading.md`
and nothing else; an agent authoring a `bitfield` never pays for any
scene genre's vocabulary. `node tools/skill-coverage.js --strict` is the gate:
it checks that every registered keyword, option key and enum value is
taught in its genre's load set, that no retired spelling is taught, and
that the always-loaded file stays genre-independent.

## Install

Two paths, one bundle. The plugin is a **wrapper**, not a second copy:
`.claude-plugin/plugin.json` at the repository root declares
`"skills": "./skill/"`, so the plugin ships exactly the directory documented
here. Nothing below is duplicated anywhere.

**Claude Code plugin (recommended — installs and updates itself):**

```sh
/plugin marketplace add FigDown/figdown
/plugin install figdown@figdown
```

`/plugin marketplace update figdown` refreshes the catalogue; the plugin is
pinned to the `version` in its manifest, so a new release arrives when that
number changes. No submission and no review are involved: the marketplace is
[`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json) in this
repository.

**Copy the directory (no plugin mechanism, every project):**

```sh
cp -r skill/figdown ~/.claude/skills/figdown
```

**Copy the directory (no plugin mechanism, one project only):**

```sh
cp -r skill/figdown <your-repo>/.claude/skills/figdown
```

The copy paths remain fully supported: the bundle is self-contained, so a
`cp` of `skill/figdown` into any skills directory works with no network, no
repository and no manifest.

Then ask the agent for a figure ("draw the ingress datapath as a
figure in docs/arch.md") — the skill triggers on diagram/figure work
and follows the FigDown workflow automatically. Requires Node.js for
the build step; no other dependencies, no network.

**Other agent frameworks:** nothing here is Claude-specific except the
directory convention. `SKILL.md` and `reference/` are ordinary Markdown —
point the agent at `skill/figdown/SKILL.md` and it follows the same router.
[guide/agents.md](../guide/agents.md) is the orientation page that leads here;
it teaches no syntax, because this bundle owns that.

## Keeping the bundle fresh

`figdown/figdown.html`, `figdown/build-svg.js` and everything under
`figdown/reference/` are **build artifacts** regenerated from their single
sources (`editor/figdown.html`, `tools/build-svg.js`, and — since `GENRE-REFERENCE-ADDRESS` —
[`read/0.5/`](../read/0.5/reading.md)) — never edited by hand:

```sh
node tools/make-skill.js
```

`SKILL.md` is the one hand-maintained source left in the bundle;
`make-skill.js` does not own it and does not delete it.

**Why `reference/` is vendored rather than linked.** `read/0.5/` is where a
reader of this repository is sent — nothing to install. This directory is
copied out of the repository into `~/.claude/skills/`, so a path pointing back
at `read/0.5/` would dangle the moment it is installed. The copy is therefore
generated, and `node tools/skill-coverage.js --strict` fails on any byte of
difference (check 0, VENDOR). Edit `read/0.5/`, then re-run `make-skill.js`.
