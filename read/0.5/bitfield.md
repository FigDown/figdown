# Genre `bitfield` — ordered named bit fields with widths

Status: NORMATIVE and portable.

Use it when the source shows **named fields with bit widths in a word**:
packet and frame headers, hardware register layouts, descriptors.

```figdown
figdown 0.1 bitfield
title "GRE header"

bitfield gre "GRE" word=32 numbering=msb0   # id required; numbering= REQUIRED
field "C" 1
field "Reserved0" 12 fill=#e5e7eb
field "Ver" 3 description="always 0 for this variant"
field "Protocol Type" 16
field "Checksum" 16 present="C = 1"         # conditional: draws dashed, and
field "Reserved1" 16 present="C = 1"        # captions the stated condition
break                                        # explicit mid-row break
field "Key" 32 class=opt
field flags:4,seq:4,"Sequence Number":24     # compact list; a spaced name is
                                             # quoted. Options on the line
                                             # apply to every field in it
field "Payload" *                            # * = fill the rest of the row;
                                             # at most ONE per bitfield block
class opt "Optional extension" fill=#fef3c7
```

## The rules that cause wrong figures if guessed

**`numbering=` is REQUIRED — there is no default.** Read the direction off
the source and state it.

- `numbering=msb0` draws the ruler `0…N-1` left to right (the IETF header
  convention).
- `numbering=lsb0` draws it `N-1…0` left to right (the hardware-register
  convention).

It changes **the ruler and nothing else**. Fields are declared left to right
under both values, so under `lsb0` you declare them MSB-first: the
first-declared field is the leftmost, and under `lsb0` the leftmost bit
number is the highest. Never guess — a wrong ruler looks exactly like a
right one.

**No implicit padding.** Padding is always an explicit field. A field wider
than `word=` spans rows by itself — declare it once, never split it by hand.
It draws as ONE box with its name written once. The single exception is a
field that starts mid-row and ends at or before that column on the next row:
its two pieces touch only at a corner, so they draw as two boxes, the first
carrying the name and the second an italic `(cont.)`. Both are still one
field; never split it to "fix" the picture.

**`present=` is a tri-state, and the value is prose.** The key absent means
no presence claim at all (**not** "always present"). `present=""` means
conditional with the condition unstated. `present="C = 1"` means conditional
with the condition stated. Both written forms draw dashed; a stated
condition also captions the block. The value is authored prose you may quote
and display — never parse it, never evaluate it, never resolve a name inside
it against a field.

**`description=` draws no ink** beyond a tooltip. If a human must see the
fact, put it in the label or in a `class` meaning as well.

**A repeated element is ONE field with `index=`, never N copied lines.** When
the source draws an element, an elision, and then the same element again —
`Segment List[0]` … `Segment List[n]` — declare it **once** and give the run's
index range. The engine draws that same picture back: the first element, the
elision, the last element, each carrying its index APPENDED to your label
(`Segment List (128-bit IPv6 address) [0]`). There is no line to write for any
of it. When nothing is elided (`index=0..1`) there is no elision mark, and
`index=""` draws one element and a bare mark, since you stated no index.

```figdown
figdown 0.1 bitfield
bitfield srh "Segment Routing Header" word=32 numbering=msb0
field "Last Entry" 8
field "Flags" 8
field "Tag" 16
field "Segment List (128-bit IPv6 address)" 128 index="0..Last Entry"
field "Optional TLVs" *
```

`index=` is a tri-state like `present=`. The key absent is **no repetition
claim** (**not** "it occurs once"). `index=""` says it repeats and states no
index — and then no index is drawn either. A range states one:

| written | means |
|---|---|
| `index=0..7` | 8 elements, indices 0…7 — **determinate** |
| `index=53..0` | descending, 54 elements — `first > last` is all descent needs |
| `index="0..Last Entry"` | 0-based; the last index is only named in prose |

**Write a literal range whenever the source gives you one**, because a
determinate run keeps every LATER field's offset computable. A prose last
index leaves the count out of the document, and everything after it becomes
indeterminate — correct, but weaker.

The first index is **always a literal integer**; only the last may be prose.
`..` is the language's one range separator. Quotes make no difference here:
`index=0..7` and `index="0..7"` are the same value. `index=` is on the
classic form only, and not on a `*` field.

**Not every header is a bitfield.** When the source shows byte-labelled
columns and no bit scale, a `bitfield` renders a bit ruler that is not in the
source. Use a single-row `table` or a `node` sequence instead.

## Vocabulary

| Line | Purpose |
|---|---|
| `bitfield <id> "<title>" word=<bits> numbering=msb0` | opens the block; `numbering=lsb0` is the other value |

The block title is a string and takes **quotes**; `numbering=` takes a bare
value (`msb0` / `lsb0`), never `numbering="msb0"`. A `field` width may be
quoted or bare — it is a number, so the quotes change nothing. Inside
`index=`, the word `step` is RESERVED for a future stepped range and is a
line error today; if the last index is prose that needs the idea, write it
another way (`index="0..7 in steps of 2"`).
| `field "<name>" <width>` | one field; `<width>` is a bit count, or `*` for "the rest of the row" — at most one `*` per block |
| `field "<name>" <width> index=0..7` | one ELEMENT of a repeated run; the engine draws the first element, the elision and the last, indices appended to your label |
| `field a:1,b:2,"Long Name":16` | compact list, same line |
| `break` | end the drawing row early |

Field options: `fill=` `stroke=` `class=` `description=` `present=` `index=`.
`style=` is **not** among them: on a field the dash *is* conditional
presence, so a per-field style could erase the only mark that carries it.
A per-field dash comes from `present=` or from a `class=` the field joins.

Reading a bitfield someone else wrote — bit-number arithmetic, `present=`
branching, repetition — is `reading.md`.
