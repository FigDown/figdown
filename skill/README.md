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
reference/scene.md                       block + the shared scene vocabulary
reference/bitfield.md
reference/table.md
reference/layout.md                      arranging a scene
reference/reading.md                     reading a .fd for meaning
reference/transcribe.md                  transcribing an existing figure
reference/experimental/constructs.md     EXPERIMENTAL markers, bands, bundles,
reference/experimental/topology.md       planes, charts — and the three
reference/experimental/flowchart.md      EXPERIMENTAL genres, kept in files of
reference/experimental/timing.md         their own so they can be ignored
```

The `reference/` files are a generated copy of [`read/0.1/`](../read/0.1/reading.md),
which is the source of truth; see "Keeping the bundle fresh" below. If you only
want to READ a `.fd` from this repository, go to `read/0.1/` and install
nothing.

An agent *reading* a figure loads `SKILL.md` + `reference/reading.md`
and nothing else; an agent authoring a `bitfield` never pays for the
scene vocabulary. `node tools/skill-coverage.js --strict` is the gate:
it checks that every registered keyword, option key and enum value is
taught in its genre's load set, that no retired spelling is taught, and
that the always-loaded file stays genre-independent.

## Install

**Claude Code, available in every project (recommended):**

```sh
cp -r skill/figdown ~/.claude/skills/figdown
```

**Claude Code, one project only:**

```sh
cp -r skill/figdown <your-repo>/.claude/skills/figdown
```

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
[`read/0.1/`](../read/0.1/reading.md)) — never edited by hand:

```sh
node tools/make-skill.js
```

`SKILL.md` is the one hand-maintained source left in the bundle;
`make-skill.js` does not own it and does not delete it.

**Why `reference/` is vendored rather than linked.** `read/0.1/` is where a
reader of this repository is sent — nothing to install. This directory is
copied out of the repository into `~/.claude/skills/`, so a path pointing back
at `read/0.1/` would dangle the moment it is installed. The copy is therefore
generated, and `node tools/skill-coverage.js --strict` fails on any byte of
difference (check 0, VENDOR). Edit `read/0.1/`, then re-run `make-skill.js`.
