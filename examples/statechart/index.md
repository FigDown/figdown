# Statechart-style examples (experimental design)

> These figures use **`figdown 0.1 block`** (main standard, portable).
> They are written in the **planned `statechart` authoring style**:
> nodes as modes, labelled edges as transitions, short canvas labels,
> multi-line `#` notes, optional companion `table` section.
>
> Genre token **`statechart` is not in the engine yet** — see
> decisions/registry.md.
> When it lands (experimental), only the header line should need to change.
>
> Full TCP Fig.5: [../showcase/tcp-state-machine.fd](../showcase/tcp-state-machine.fd)
> (flowchart header + dense RFC labels).
>
>
> **Cut from five figures to two.** Traffic light, door lock and
> TCP simplified were four-to-six-state `block` figures using `node`, `edge`
> and `class` and nothing else — the same constructs the turnstile shows in
> fewer lines. Two remain, and each earns it: **turnstile** is the minimal FSM,
> **dhcp-client** is the only figure in the repo with three or more sections
> and the only user of `<br>` outside `examples/reference/`. State machines
> were the most over-represented subject in the gallery; being the most
> familiar kind of diagram is not the same as being the most instructive one.

| Example | Classic of… | Source |
|---|---|---|
| Turnstile | Textbook FSM (coin / push) — the minimal state figure | [turnstile.fd](turnstile.fd) · [svg](turnstile.svg) |
| DHCP client | RFC 2131 client FSM; **multi-line demo** (`\n` labels, `["…\n…"]` edge mids, `#` blocks, `<br>` table cells) | [dhcp-client.fd](dhcp-client.fd) · [svg](dhcp-client.svg) |

```bash
node tools/build-svg.js examples/statechart
```

### Hand-layout in the editor

Load any of these `.fd` files in `editor/figdown.html` → **Pin all** /
drag states → **Ortho** / **Route** for edges. Layout lines stay in the
first section. Step-by-step: [EDITOR-WORKFLOW.md](EDITOR-WORKFLOW.md).
