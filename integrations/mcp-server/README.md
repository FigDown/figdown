# figdown-mcp — FigDown over the Model Context Protocol

A dependency-free MCP server that gives an AI agent the three things it needs
to work with FigDown figures: **build** a `.fd` into an SVG, find out **why**
one does not parse, and **read** a figure's meaning out of the model rather
than out of the picture.

FigDown exists so an agent can read a figure's *meaning* instead of OCR-ing a
drawing. MCP is how agents reach tools. This is that channel — and it is the
only one that exposes the parsed semantic model (spec core §12), which is what
a *reading* agent actually wants and what neither the SVG nor the CLI hands
over.

## No network, no service, no API key

Nothing here opens a socket, resolves a name, or reads a credential. There is
no account, no rate limit and no telemetry. The server has **zero
dependencies** — including no MCP SDK: the stdio transport is newline-delimited
JSON-RPC 2.0, which is about eighty lines, and taking a dependency to save them
would have been the first dependency in the whole project.

Its only I/O is stdin/stdout plus, on explicit request, reading a `.fd`/`.svg`
and writing that source's sidecar. **There is no arbitrary output path:** the
only file this server ever writes is `X.svg` beside the `X.fd` it was given,
and only when the call passes `write: true`.

## It does not contain a copy of the engine

This repository has shipped seven four-copy-drift incidents. There are four
engine copies already — `editor/figdown.html` (hand-edited) plus the three
generated from it (`dist/figdown.js`, `dist/figdown.mjs`,
`skill/figdown/figdown.html`). This server adds **no fifth copy**: it
`require`s `dist/figdown.js`, exactly as the other two integrations do.

`dist/figdown.js` is the right consumption point rather than merely an
available one. It is the package's own `main` — what `require('figdown')`
returns — it is the only artifact with a module API, and `npm run gate:dist`
already holds it to the reference engine *behaviourally*: regenerating must be
a byte-level no-op, both builds must render identically, and every published
`.fd` must parse through it with **the same error set** as
`editor/figdown.html`. That is agreement on behaviour rather than on a version
string, and this server inherits it for free.

The same rule applies one level down. The genre router — *which reference file
does genre G need* — is **parsed out of `skill/figdown/SKILL.md`** at call
time, by the same marker comment `tools/skill-coverage.js` gates, rather than
restated here. A restated router would let a renamed reference file turn into
an agent silently receiving nothing.

## Run it

```sh
node tools/make-lib.js                    # regenerate dist/ first, if you edited the engine
node integrations/mcp-server/server.js    # speaks MCP on stdin/stdout
```

Configure an MCP client with either the published executable or the path:

```json
{
  "mcpServers": {
    "figdown": { "command": "npx", "args": ["-y", "figdown", "figdown-mcp"] }
  }
}
```

```json
{
  "mcpServers": {
    "figdown": { "command": "node", "args": ["/path/to/figdown/integrations/mcp-server/server.js"] }
  }
}
```

Two environment overrides, in the style of `tools/build-svg.js`: `FIGDOWN_LIB`
(path to `figdown.js`) and `FIGDOWN_SKILL` (path to the `skill/figdown/`
directory holding `SKILL.md` and `reference/`).

## The tools

Four, matching the three verbs `skill/figdown/SKILL.md` already teaches —
author, build, read — plus the diagnostics loop that connects them. A tool
nobody calls is a maintenance cost with no reader, so there are no others: in
particular there is no layout-lint tool and no "render to PNG".

| Tool | Why an agent needs it |
|---|---|
| `figdown_build` | Turn one `.fd` into the deterministic, self-carrying SVG. The artifact embeds its own source, that source's SHA-256 and the engine version (core §7), so it round-trips back to text. |
| `figdown_check` | Parse one document *or walk a whole tree*, render nothing, write nothing. This is the write → validate → fix loop and the corpus sweep; it exists separately from `build` so that iterating on a broken file costs no render and puts no SVG in the agent's context. |
| `figdown_read` | The semantic model — participants, relationships and direction, containment, and the **stated meaning** of every class — shipped with the reading contract. Accepts a `.svg` too, recovering the source from its metadata and reporting the artifact stale if the `.fd` has moved on. A `sequence` section reports its own collections (lifelines, messages, states, fragments, operands) and gets one extra contract line, because in that genre a message is **not** an edge and array order **is** the meaning. |
| `figdown_reference` | The per-genre reference, so an agent knows what a genre may and may not say. The grammar is **closed** and the parser **never warns about portability**, so this is the only place the frozen / EXPERIMENTAL split is visible. |

### `figdown_build`

`source` or `path` (not both); `write`, `with_title`, `return_svg`,
`include_model`.

**What it returns, decided rather than defaulted.** The SVG comes back inline
*unless* it was just written to disk, in which case the path comes back and the
caller is spared 5–50 KB of markup it can already open. `return_svg` overrides
in both directions. The parsed model is **opt-in** here (`include_model`) and
the default in `figdown_read`: an author who just wrote the source does not
need it read back, and a reader should not have to render to get it.

### `figdown_check`

`source`, or `path` to a file **or a directory** (walked recursively — a check
that does not recurse is a check that lies). It states how many documents it
looked at, so the number can be compared against `find <dir> -name '*.fd' | wc -l`.

### `figdown_read`

`source` or `path`, `.fd` or `.svg`. Returns the section shape, the reading
contract in short form, and the full model as JSON with every element's source
line. Handed an SVG that FigDown did not produce it refuses and says so, rather
than guessing at the picture.

### `figdown_reference`

`name` — a genre (`block`, `bitfield`, `table`, `topology`, `flowchart`,
`statechart`, `timing`, `sequence`), a task (`reading`, `transcribe`), or
`skill`. Omit it for the index. The list is not restated here or in the tool's
schema as the authority — it is **parsed out of `SKILL.md`'s router at call
time**, so a genre that lands without a router row is invisible to this tool
and `gate:mcp` fails rather than an agent receiving nothing. `experimental: true` adds the genre's EXPERIMENTAL files, which sit
outside the v0.1 conformance surface and its compatibility promise.

## A parse error is a result, not an exception

The diagnostics are the product: each one carries a 1-based line number, the
reason, and — for a retired spelling — what to write instead. They are what
makes an automated author → validate → fix loop possible, so they must reach
the caller intact. Three channels are kept distinct:

| Channel | Used for |
|---|---|
| JSON-RPC `error` | Protocol faults only: unparseable JSON, unknown method. |
| `isError: true` | The tool could not run at all — no such file, `source` *and* `path` given, an SVG with no FigDown metadata. The request was malformed; there was nothing to read. |
| a normal result | **Including a parse failure.** The tool did exactly its job: it reported why the document does not parse. The first line reads `PARSE FAILED — N diagnostic(s)`, the engine's text follows verbatim, and no client can hide it as an error string. |

No partial render is ever emitted: `svg` is null whenever there are errors —
determinism over convenience.

## Where MCP fits awkwardly, stated plainly

- **A tool that wants to return two things.** A build is an SVG *and* its
  metadata; a read is a model *and* the contract for using it. MCP's result is
  an ordered list of content blocks, which carries them — but the blocks are
  untyped text, so "this block is the SVG and that one is the model" can only
  be said in prose inside the blocks. Structured output (`structuredContent` +
  `outputSchema`) would type it, at the cost of client compatibility across
  protocol revisions; this server puts machine-readable payloads in the text
  blocks as JSON instead, which every revision carries identically.
- **The diagnostic does not fit the error shape.** MCP has one error flag and
  two meanings to spend it on ("your request was malformed" and "your document
  is malformed"). Those need opposite handling — the first is the caller's bug,
  the second is the caller's *work product* and the whole reason the tool
  exists — so `isError` is reserved for the first and the second is a normal
  result. Anyone reading a transcript should know that a clean-looking result
  can still say `PARSE FAILED`.
- **Protocol version.** Every payload here is plain text content blocks, which
  every revision carries identically, so there is nothing to negotiate: the
  server echoes the revision the client asked for.

## Test

```sh
node integrations/mcp-server/test.js     # npm run gate:mcp
```

It speaks real JSON-RPC to a spawned subprocess (framing is the half that was
hand-rolled, and an in-process test cannot catch a framing bug), then exercises
every tool against real figures from `examples/` — a multi-section topology, an
experimental `figdown 0.2 statechart`, a `figdown 0.4 sequence` ladder whose
model has no nodes and no edges at all, a published artifact read back through
its own metadata, and a deliberately broken document. Two of its assertions are
drift guards rather than feature tests: every genre in SKILL.md's router must
still resolve to files that exist — `sequence` by name, since a genre that
lands without a router row is the failure this guard exists for — and this
server must contain no engine copy.
