# Hand-layout workflow in the FigDown editor

Goal: load a statechart-style `.fd`, then **add or refine** the layout-zone
`pin` lines so the SVG looks intentional — without retyping the whole machine.

Open `editor/figdown.html` in a browser (file:// is fine).

Scope note: the layout zone holds `pin` and nothing else. Edge geometry is not
authorable — `path` and `routing` were withdrawn from the language (`EDGE-GEOMETRY-CONSTRUCTS`) — so everything below is about placing *elements*, and the
edges follow.

## 1. Load

- **Open…** (or Ctrl+O) → choose e.g. `examples/statechart/dhcp-client.fd`
- Or paste into the left textarea and wait for live preview
- Multi-section files (scene + `table` panels) render stacked; **layout
  GUI edits apply to the first section only** (the scene)

## 2. Freeze node positions (states)

| Action | Writes |
|---|---|
| **Pin all** | `layout` + `pin <id> at=(x,y)` for every node (current on-screen place) |
| Drag a node | updates that `pin` (and freezes the whole scene on first drag) |
| Arrow keys (node selected) | nudge pin by 1px (Shift = 10) |
| Drag corner handle | `pin <id> width= height=` (merged into the id's `pin` line — a separate `size` line until 0.1, `ELEMENT-GEOMETRY-DIRECTIVE`) |

After **Pin all**, further moves only change the lines you touch — good for
tightening a DHCP-style cluster.

## 3. Change the structure, not the strokes

The rest of the direct-manipulation set edits the **content** zone, and that is
now the whole toolbox:

| Action | Writes |
|---|---|
| Double-click empty canvas (or **+ Node**) | `node` + a `pin` for it; the shape dropdown picks `shape=` |
| Double-click a node | rename it |
| **Link** → click two nodes | `edge a -> b` |
| **⬚ Group** → drag a box | `group` (members follow by `in=`) — **not usable on a statechart document**: `group` is not this genre's keyword since 0.3 (`SCENE-KEYWORD-MEMBERSHIP`) and `in=` is not its option key since 0.3 (`MEMBERSHIP-KEY-ACCEPTANCE`), so the two lines the button writes are both line errors here. It works on a `block` or `topology` document |
| fill colour | `fill=` on the selected element |
| **Raise ↑** / **Lower ↓** | move the element's line down/up in the text — paint order |
| **Delete** (or Del) | removes the node with its `pin`s and edges |

**There is no button that routes an edge, and there is no longer meant to be.**
The editor grew two — **Ortho**, which toggled `routing orthogonal` /  <!-- fence-check: skip -->
`routing straight`, and **Route** mode, which clicked waypoints onto a `path`  <!-- fence-check: skip -->
line — and both were deleted together with the constructs they
wrote. A button that emits a line the parser rejects is exactly the drift
`tools/editor-check.js` exists to catch, so the emitter and its fixture went
in the same change.

If the edges read badly, the fixes are in the text, not in the mouse: state
the direction with `flow`, lift a side exit onto its decision's own row with
`rank`, and name what a reader was supposed to infer from the geometry with a
`class` (see [guide/layout.md](../../guide/layout.md) §2 and §9). The part of
the old workflow that genuinely has no replacement — elbow routing with
per-edge control — is recorded as an open question, `spec/core.md` §9
**`EDGE-IDENTITY-AND-GEOMETRY`**, not quietly dropped.

*Worth knowing, because it is the reason this section is written the way it
is:* this document told readers to write `path … via=(310,95)` for ten  <!-- fence-check: skip -->
releases after `via=` was renamed `points=`. Nobody noticed, and
there were two reasons rather than one. `fence-check.js` did not reach
`examples/` at all — its default roots were `.`, `spec/`, `design/` and
`skill/` — and the snippet was not in a fence anyway: it sat in an inline code
span, which the tool did not read in any file. Both holes were closed; the three withdrawn spellings above survive here only as history,
each marked as such, and the gate now reads them. A workflow document that
quotes syntax rots exactly as fast as the syntax moves; prefer naming the
button and letting the engine own the spelling.

## 4. Save

- **Save** / Ctrl+S → writes the `.fd` (source of truth)
- **SVG ⬇** → artifact with embedded source for Markdown

## 5. Multi-section safety

`pin` lines are inserted **inside the first `figdown …` section**, before any
later `figdown 0.1 table` panel. That fixes the old bug of pins landing under
the table section and vanishing from the scene model.

## 6. Suggested pass for a new state machine

1. Author states/edges with **no** layout (or only `flow right` / `flow down`)
2. Build and look before you touch the mouse — `node tools/build-svg.js X.fd`
   plus `node tools/layout-lint.js X.fd`. Hand geometry is not a given
   improvement: on the three in-repo figures that carried withdrawn
   edge-geometry lines, removing them *improved* the lint score on two and
   changed nothing on the third
3. Still unclear? Open in editor → **Pin all**
4. Drag into a compact cluster; arrow-nudge for alignment
5. Delete any `pin` that is not carrying its weight — every pin is a promise
   future edits must keep (`LAYOUT-STABILITY`)
6. Save `.fd` and rebuild the gallery SVG if needed:

```bash
node tools/build-svg.js examples/statechart/dhcp-client.fd
```
