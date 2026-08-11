# Genre reference figures

> One (or a small set of) `.fd` files per v0.1 genre, used as the
> **vocabulary coverage** surface for
> [`tools/reference-coverage.js`](../../tools/reference-coverage.js).
>
> Coverage is over the **set** of files for that genre (e.g. `block.fd` +
> `experimental/block-experimental.fd`), not a single kitchen-sink diagram.
>
> **Frozen and experimental are separated at the FILE level.**
> This directory holds the frozen reference figures and nothing else; every
> experimental one is in [experimental/](experimental/). Deleting that
> subdirectory leaves three complete, self-consistent normative reference
> figures — which is the whole point of the split.

| Genre | Status | Reference sources | SVG |
|---|---|---|---|
| `block` | NORMATIVE | [block.fd](block.fd) | [block.svg](block.svg) |
| `bitfield` | NORMATIVE | [bitfield.fd](bitfield.fd) | [bitfield.svg](bitfield.svg) |
| `table` | NORMATIVE | [table.fd](table.fd) | [table.svg](table.svg) |

The experimental half of the corpus, in [experimental/](experimental/):

| Genre | Status | Reference sources | SVG |
|---|---|---|---|
| `block` | EXPERIMENTAL surface of a NORMATIVE genre | [experimental/block-experimental.fd](experimental/block-experimental.fd) | [experimental/block-experimental.svg](experimental/block-experimental.svg) |
| `table` | EXPERIMENTAL surface of a NORMATIVE genre | [experimental/table-experimental.fd](experimental/table-experimental.fd) | [experimental/table-experimental.svg](experimental/table-experimental.svg) |
| `topology` | EXPERIMENTAL genre | [experimental/topology.fd](experimental/topology.fd) | [experimental/topology.svg](experimental/topology.svg) |
| `flowchart` | EXPERIMENTAL genre | [experimental/flowchart.fd](experimental/flowchart.fd) | [experimental/flowchart.svg](experimental/flowchart.svg) |
| `timing` | EXPERIMENTAL genre | [experimental/timing.fd](experimental/timing.fd) | [experimental/timing.svg](experimental/timing.svg) |

```
node tools/build-svg.js examples/reference examples/reference/experimental
node tools/reference-coverage.js --normative-only            # main standard surface
node tools/reference-coverage.js --normative-only --strict   # ditto, as a verdict — EXITS 1 today
node tools/reference-coverage.js --strict                    # full table (incl. experimental) — EXITS 1 today
```

## Coverage status: the two `--strict` runs exit 1, and that is the accepted state

Those commands are published here as the coverage checks for this directory,
so their exit status is published with them. **As of 0.1 both
`--strict` forms exit 1.** A command whose failure is not written down beside
it is read as a command that passes, and the reading costs more than the
failure does. Every genre named in the table is EXPERIMENTAL, or the EXPERIMENTAL surface
of a NORMATIVE genre.

**The one NORMATIVE gap this record has ever carried was opened and closed.** `BITFIELD-REPETITION-CONSTRUCT` registered `index=` on `field`
and no reference figure exercised it, so for one release a NORMATIVE option
key of a NORMATIVE genre was missing from that genre's reference figure — the
gap the reference figures exist not to have. It was recorded here rather than
quietly carried, because 0.1's authoring scope named the `.fd` files it
could change and `bitfield.fd` was not among them. 0.1 closed it:
`bitfield.fd` gained a `rec` block with a repeated structure for `index=` to
describe, and writes all three of its forms there — a determinate literal
range, a prose last index, and the empty form. `bitfield` now reports `ok` on
all four checks under both runs.

| Command | Exit | Reported |
|---|---|---|
| `node tools/reference-coverage.js --strict` | **1** | `FAIL  3 genre(s) with gaps` — `block`, `topology`, `flowchart` |
| `node tools/reference-coverage.js --normative-only --strict` | **1** | `FAIL  2 genre(s) with gaps` — `topology`, `flowchart` |
| `node tools/reference-coverage.js --normative-only` | 0 | the same two genres, printed as gaps; without `--strict` the exit code does not carry them |

The third row is the one to hold on to. The non-strict form prints exactly the
gaps the row above it fails on, and still exits 0 — so a clean prompt from it
is not evidence of coverage; only `--strict` turns the report into a verdict.
**`reference-coverage` is consequently NOT one of this project's green gates
and must not be cited as one.** [.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) §3.1(f)
is the governing voice: state the exposure rather than implying coverage that
does not exist.

**Re-evaluated, and it still cannot be a gate.** 0.1
fixed this tool's `stripComment` defect and `capability-coverage.js` now
`require`s it, so the question was asked again: both `--strict` forms still
exit 1, with the same gap list quoted below. Nothing about the failure is
mechanical — every remaining gap is a construct that no reference figure
exercises, and closing them means `experimental/topology.fd` and
`experimental/flowchart.fd` each acquiring the EXPERIMENTAL half they have never
had (a `topology-experimental.fd` and a `flowchart-experimental.fd`, per the
0.1 file-level split), plus `chart`/`type=` somewhere in the `block`
set. That is corpus work in two EXPERIMENTAL genres on the approach to a
freeze whose surface is the three NORMATIVE ones. Adding a gate that ran only
the subset that passes — `--normative-only block bitfield table` — would be
weakening a failing check into a green one, which §3.1(f) forbids more
plainly than it forbids the absence of the gate.

### What is green, and it is the half the freeze rests on

Under `--normative-only`, all three NORMATIVE genres — `block`, `bitfield`,
`table` — report `ok` on all four checks (keywords, options, enum values,
multi-value forms) and `experimental leak: none`. Under the full run,
`bitfield`, `table` and `timing` are `ok` on all four, and `block`'s normative
rows are `ok` too: its two gaps there are both EXPERIMENTAL constructs. **No gap
recorded below is inside the v0.1 conformance surface.** Every one of them
lives in `experimental/block-experimental.fd`, `experimental/topology.fd` or
`experimental/flowchart.fd`. (That sentence was **retracted**,
which said "exactly ONE gap below is inside the v0.1 conformance surface" for
as long as that was the true thing to say. It is restored
because both commands were re-run and the gap list below is what they print —
not because closing one gap makes it safe to assume the surface is clear. A
record that says the comfortable thing after it stopped being true is the
drift this section exists to prevent, and the drift runs in both directions.)

### The recorded gap list, quoted so it can be diffed

Both blocks are the tool's own output with the `ok` and `tracked:` rows
dropped and the long lines wrapped; every `MISSING` and `FAIL` line is
reproduced word for word.

`node tools/reference-coverage.js --strict` — EXPERIMENTAL constructs throughout,
marked `(exp)` by the tool itself:

```
[block]
  MISSING keywords (1): chart (exp)
  MISSING options (1): type (exp)
[topology]
  MISSING keywords (3): threshold (exp), band (exp), chart (exp)
  MISSING options (5): fill, plane (exp), offset (exp), type (exp), extend (exp)
  MISSING enum values (11): shape=box, shape=circle, shape=ellipse, shape=diamond,
      shape=cylinder, style=solid, style=dotted, extend=up, extend=down,
      extend=left, extend=right
  MISSING multi-value forms (2): class=a,b, bundle a,b
[flowchart]
  MISSING keywords (4): bundle (exp), threshold (exp), band (exp), chart (exp)
  MISSING options (3): offset (exp), type (exp), extend (exp)
  MISSING enum values (10): shape=box, shape=rounded, shape=diamond, shape=cylinder,
      style=solid, style=dotted, extend=up, extend=down, extend=left, extend=right
  MISSING multi-value forms (1): bundle a,b
FAIL  3 genre(s) with gaps
```

`node tools/reference-coverage.js --normative-only --strict` — the same corpus
with the EXPERIMENTAL rows dropped from the vocabulary:

```
[topology]
  MISSING options (1): fill
  MISSING enum values (7): shape=box, shape=circle, shape=ellipse, shape=diamond,
      shape=cylinder, style=solid, style=dotted
  MISSING multi-value forms (1): class=a,b
  EXPERIMENTAL LEAK in topology.fd (2): bundle, plane  — move it to
      topology-experimental.fd  [advisory: the genre itself is EXPERIMENTAL]
[flowchart]
  MISSING enum values (6): shape=box, shape=rounded, shape=diamond, shape=cylinder,
      style=solid, style=dotted
  EXPERIMENTAL LEAK in flowchart.fd (5): process, decision, terminator, plane,
      plane=  — move it to flowchart-experimental.fd
      [advisory: the genre itself is EXPERIMENTAL]
[timing]                                              (no MISSING line at all)
  EXPERIMENTAL LEAK in timing.fd (3): signal, gap, data=  — move it to
      timing-experimental.fd  [advisory: the genre itself is EXPERIMENTAL]
FAIL  2 genre(s) with gaps
```

**To audit:** run both commands and compare their `MISSING` lines against the
two blocks above, which are quoted from the 0.1 run. A line here that
the output no longer prints, or a line the output prints that is not here, is
drift — the corpus or the engine's vocabulary moved and this record did not.
Re-record it in the change that moved it. A stale accepted-state record is
worse than no record, because it is read as current.

### The three classes of gap, why each is accepted, and what would close it

**Class 1 — EXPERIMENTAL constructs that no reference figure exercises.**
`chart`, `threshold`, `band`, `plane`, `bundle` and the `bundle a,b` form,
`offset=`, `type=`, `extend=` and its four values `extend=up|down|left|right`.
These are registered in the engine's vocabulary and demonstrated nowhere in
this directory. They are outside the v0.1 conformance surface, so the gap is
in *demonstration*, not in the standard: the constructs themselves are
exercised by the fixtures in `conformance/experimental/`, which
`node conformance/run.js --experimental` runs as a gate.

**Class 2 — NORMATIVE enum values and options the two experimental-genre
figures leave unexercised.** `shape=box|circle|ellipse|diamond|cylinder`,
`style=solid|dotted`, `fill=` and `class=a,b` in `topology`;
`shape=box|rounded|diamond|cylinder` and `style=solid|dotted` in `flowchart`.
The keys are normative and are demonstrated — but coverage is computed **per
genre**, deliberately, so `shape=diamond` in `block.fd` does not count for
`topology`. What these rows say is that two figures for EXPERIMENTAL genres draw a
narrower slice of the shared core than the genres allow; they do not say a
normative key is undemonstrated anywhere.

*Why both classes are accepted, and it is one reason.* Every one of these gaps
closes by adding lines to `experimental/block-experimental.fd`,
`experimental/topology.fd` or `experimental/flowchart.fd` — and
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) §3.1(b) makes a source change an
artifact rebuild, so each edit redraws the paired `.svg`. **0.1 does
not redraw those three figures**: every gap listed above predates it — none
was opened by it and none is inside the frozen surface — and its own artifact
change there is `data-engine-version` and nothing else. The one figure it did
redraw is `bitfield.svg`, which is a NORMATIVE genre's and is not in this
list. The price of closing the gaps is therefore not the
authoring, which is small; it is a redraw of three figures during a freeze, in
exchange for demonstrations of constructs that are either outside the frozen
surface (Class 1) or already demonstrated in the frozen figures of the genres
that freeze them (Class 2). The trade is accepted — and it is accepted **in
writing here**, rather than by leaving a published command to fail unremarked.

*What would close it.* Extend those three sources until each construct listed
above appears, rebuild with
`node tools/build-svg.js examples/reference/experimental`, and re-run both
commands until they exit 0. Delete this section in the same change, and not
before: the section and the exit code are meant to move together.

**Class 3 — the `EXPERIMENTAL LEAK` lines are advisory and are not part of the
failure.** The leak check exists to keep a NORMATIVE genre's frozen figure
clean of EXPERIMENTAL constructs. The three files that raise it are wholly inside
`experimental/`, which is where those constructs belong, so the tool marks
each finding `[advisory: the genre itself is EXPERIMENTAL]` and does not count
it toward the verdict. `timing` raises an advisory and still reports no gaps,
which is the clearest demonstration that these lines are not what the exit
code is about.

A NORMATIVE genre is split in two wherever it HAS an experimental surface, so
that removing the experimental file cannot silently open a coverage gap in
the normative one. That removal is a *directory* removal:
`<genre>-experimental.fd` moved into `experimental/` alongside the three
experimental genres' own figures, because the two demonstrate the same thing
— constructs outside the v0.1 conformance surface — and an isolation that
leaves half of them in the frozen directory is not an isolation.
**`bitfield` is no longer split**: `stroke=`
became NORMATIVE (`STROKE-KEY-STATUS`) and `color=` was retired language-wide (`COLOUR-KEY-STATUS`), and
those two cross-namespace colour keys were the only experimental constructs a
pure `bitfield` document could reach — so `bitfield-experimental.fd` had
nothing left to demonstrate and was deleted, with its `stroke=` coverage
folded into `bitfield.fd`. The rule itself is unchanged: `<genre>.fd` holds
only what is inside the v0.1 conformance surface and the compatibility promise,
`experimental/` holds the rest. `node tools/comment-check.js` keeps
the comments in these figures — which is where their teaching lives — from
naming a retired spelling as if it were current, and
`node tools/isolation-check.js --strict` keeps this file from citing an
experimental figure as if it were part of the frozen set.

Normative reading path for a genre remains **core + genre doc**
([spec/core.md](../../spec/core.md) + [spec/genres/](../../spec/genres/README.md)).
The experimental genres' documents are in
[spec/genres/experimental/](../../spec/genres/experimental/), and the **four**
experimental core constructs — `plane`, `bundle`, `threshold`, `band` — in
[spec/experimental.md](../../spec/experimental.md). (It read *six* until this release; `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path` and `routing`.)
