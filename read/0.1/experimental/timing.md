# Genre `timing` — EXPERIMENTAL / EXPERIMENTAL

The genre itself is outside the v0.1 conformance surface: it may change or be
withdrawn in a later `0.x`. There is no portable alternative — a waveform
that must be portable belongs in a `table` of cycles, or in prose.

```figdown
figdown 0.1 timing
title "Read burst"

timing rd "SDRAM read"
signal clk  pppppppp        # p = rising-edge clock, n = falling-edge
signal cs   1000000.        # 0 and 1 are levels; `.` continues the previous
signal addr x=x.....x       # x = undefined/don't-care; = is a data cell
signal data x..==..x data=D0,D1
gap 4                       # a break in the time axis
signal rdy  0..1...0. stroke=#16a34a
```

## The rules

- **A lane is one character per cycle.** Cycle *t* is the *t*-th character.
  `.` repeats the previous value rather than starting a new one.
- **Lane alphabet:** `p` `n` (clock edges), `0` `1` (levels), `x`
  (undefined), `=` (a data cell), `.` (continue). **Digits 2–9 are not lane
  characters** — write `=` for a data cell and name it in `data=`.
- **`data=`** is a comma-separated list of names, one per `=` cell in that
  lane, in order.
- **`gap <cycle>`** marks a break in the time axis. Cycles stay contiguous
  across it: a gap is a drawing device, not a jump in the numbering.
- `fill=` and `stroke=` are legal on `timing` and on each `signal`.

The block opener takes an id like every other typed block: `timing rd "…"`.
