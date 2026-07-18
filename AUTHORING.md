# Authoring SOP — from "I need a figure" to the right FigDown

> Audience: **humans** (and agents) deciding how to express a figure.
> Companion to [AGENT-GUIDE.md](AGENT-GUIDE.md) (the agent workflow)
> and [spec/PROCESS.md](spec/PROCESS.md) (how the language changes).
>
> 繁體中文版：[AUTHORING.zh-tw.md](AUTHORING.zh-tw.md)

## Step 1 — State the meaning before choosing anything

Write one sentence: *"this figure states that …"*. If you cannot, the
figure is not ready to draw. FigDown is semantics-first: the text is
what an AI will read as truth; the picture is a projection. Everything
below follows from what the figure **means**, never from what it
should look like.

## Step 2 — Pick the template (a defaults choice, never a cage)

| The figure is about… | Template |
|---|---|
| bit positions in a packet header / register | `bitfield` |
| rows × columns of values (configs, states, maps) | `table` |
| signals changing over time ticks | `wave` |
| devices and the links between them | `topology` |
| steps, decisions, and control flow | `flowchart` (defaults `flow down`) |
| components, containment, dataflow — or anything else box-and-wire | `block` |

Remember (D8): a template only picks **defaults** (flow direction,
units). Every directive works under every template, so a "wrong"
choice costs you at most one explicit `flow` line — it never limits
what you can say. One `.fd` may also mix blocks: a topology followed
by its VLAN `table` is one document.

## Step 3 — Express the meaning with existing constructs

Work down this checklist before wanting new syntax; the
[pattern library](examples/patterns/index.md) has a ready skeleton for
most rows.

| You want to say… | Use |
|---|---|
| these elements belong to category X (shown by color/dash) | `class x "meaning" color=… style=…` + `class=x` — the legend renders itself |
| threshold / watermark / zone inside a box | `line` (marker) and `fill` (band); attach at the scope that owns the meaning (R29) |
| these links form one logical bundle (LAG/ES…) | `bundle` |
| role/port/cardinality at a line's ends, or a verb on the line | inline edge labels: `a [1] -[places]-> [N] b` |
| these belong together spatially | `group` + `in=`; same row/column → `rank` |
| a note attached to one node | small `style=dashed` node + dotted edge (if adjacency matters) or one collected `table` (if it's dense data) |
| same bits reinterpreted by a mode | `note="valid when …"` on the field (OQ-S9) |
| two concept areas in one original image | split into one `.fd` per concept; the Markdown composes them |
| a trend inside a table cell | Unicode blocks `▁▃▅▇` as cell text (OQ-S12) |

Two rules while expressing:

- **Meaning in text, geometry to the engine.** Never encode knowledge
  only in color or position; if a color classifies, it must ride on a
  `class`.
- **Validate as you go**: `node tools/build-svg.js X.fd` — errors are
  `Line N: message`; the grammar is closed, so a clean build means the
  document is fully understood.

## Step 4 — Nothing fits? The escalation guideline

1. **Check it is a *meaning* gap, not a convenience gap.** Test:
   express it with existing constructs as best you can, then strip all
   presentation (`pin`/`size`/`color`) — is knowledge actually
   missing, or just prettiness? "More typing" is not a gap
   (composition beats vocabulary, R28).
2. **Check the open-questions list** — spec §9 (OQ-S…) tracks known
   gaps with their current sanctioned workarounds. If yours is there,
   use the workaround and add your sample to that discussion: corpus
   evidence is exactly what moves an OQ through the gate.
3. **Never block on the gap.** State the missing meaning in plain
   text meanwhile (a label, a `note=`, a `#` comment marking the
   spot) so no knowledge is lost while the language catches up — and
   never invent syntax: unknown lines are errors by design.
4. **File a syntax-proposal issue** (the template mirrors the
   [PROCESS](spec/PROCESS.md) gate): the meaning you cannot express ·
   your best attempt and exactly what it loses · real de-identified
   samples with rough frequency · prior art you know of. Proposals
   arriving with evidence get rulings fastest.
5. **New *template* requests have the highest bar** — a template is
   only a defaults bundle (D8), so if what you miss is a construct,
   propose the construct. A genuinely new template needs corpus
   evidence AND semantics no existing construct can carry (R28).

## Step 5 — What happens to your proposal

Per [spec/PROCESS.md](spec/PROCESS.md): triage → prior-art/corpus
survey → maintainer ruling with the evidence chain, recorded
permanently (rejections too) in the decision log. Adopted syntax
lands with a migration entry and conformance fixtures in the same
change — your documents never silently break.
