# FigDown agent skill

An installable skill that teaches an AI coding agent (Claude Code and
compatible agent frameworks) to maintain documentation figures with
FigDown: edit `.fd` sources, build deterministic `.svg` artifacts, and
embed them in Markdown with the `source:` footer convention.

The bundle is self-contained: `SKILL.md` (instructions + cheat sheet),
`build-svg.js` (validator/renderer CLI) and `figdown.html` (the engine
it extracts at runtime — also the editor: open it in any browser).

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

**Other agent frameworks:** point the agent at
[AGENT-GUIDE.md](../AGENT-GUIDE.md) — it is the same content in a
framework-neutral form.

## Keeping the bundle fresh

The engine copy in this directory is a **build artifact** regenerated
from the single source (`editor/figdown.html`) — never edited by hand:

```sh
node tools/make-skill.js
```
