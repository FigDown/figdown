# Reading a `.fd` for meaning

You are reading, not authoring. You need this file and almost none of the
syntax detail in the other files beside it.

**Read the `.fd`, never the `.svg`.** If only the SVG exists, its
`<metadata id="figdown-source">` holds the source verbatim; read that.

## What you MAY conclude

- **Participants and relationships.** Nodes are the figure's participants;
  edges are relationships between them, with direction from the operator
  (`->` `<-` `<->`; `--` asserts a relationship and no direction). An
  `external` is **not** a participant — it states only that the connection
  crosses the figure's boundary.
- **Containment** from a member's `in=`; **co-membership** from `rank`.
- **Category** from a `class` reference plus that class's stated meaning —
  the declared mapping that colour alone never provides. A class whose
  meaning is the empty string asserts **no** category: the author grouped
  attributes and claimed nothing, and you must not invent a category from
  the id or from the shared colour.
- **Absence is meaning.** No label key means the author wrote no label;
  an empty label means they deliberately wrote an empty one. Two different
  facts, both recoverable.
- **Authored prose** in a `description=` is quotable and displayable, and
  **never parsable**. Quote it, attribute it to its field, and stop. It
  carries no structure, no relation and no condition.

## Genre-specific readings

**`bitfield`.** A field's bit offset is the sum of all earlier widths.
**There is no implicit padding.** `break` breaks only the drawing row —
blank cells are not bits, but the cursor does move to the start of the next
word. Fields are always drawn left to right in declaration order.

A field's **bit number** is its column relabelled by `numbering=`: column *c*
is bit *c* under `msb0`, and bit *word−1−c* under `lsb0`, where bit numbers
descend left to right and the highest sits at the left. Compute it — the
model carries `word`, `numbering` and the widths, not the ranges.

Three cases where a single number is a **misreading**:

1. A field carrying `present=` may be absent. Offsets after it hold only when
   it is present, so you MUST branch: give per-case offsets, or state the
   presence assumption. One unconditional number is wrong.
2. A `*` field's drawn width is not its length.
3. **Repetition.** Never assume the declared field list enumerates every
   occurrence of a repeated element. Where a figure indicates repetition —
   an index or range in a label (`[0]`, `[n]`, `1..n`), a count field naming
   the section, a terminator condition stated in prose — every later offset
   is **indeterminate**. Say so. Every other gap here degrades to "unknown";
   this one degrades to *confidently wrong*.

   **`index=` is the one exception, and it is the only one.** A field
   carrying it is one element of a run, and the key tells you what the label
   never could. Both ends literal — `index=0..7` — means the run is
   determinate: it holds `|last − first| + 1` elements, the field contributes
   that many widths to the bit sequence, and **later offsets are computable
   again**. One end prose — `index="0..Last Entry"` — leaves the count out of
   the document, so later offsets stay indeterminate; the difference is that
   you learned it from syntax instead of from reading a label. In the model
   `index` is an object: `last` a number means determinate, `last` a string
   means it is not, `{}` means it repeats with no index stated. Never parse
   the prose end, and never resolve it against a field name. And never count
   the drawn rows: the drawing shows at most TWO occurrences — the first
   element and the last — whatever the count.

**`table`.** The logical grid is the pipe rows plus the `^^` / `||` merges.
Widths, colours and alignment never change it.

**`timing`.** Cycle *t* is the *t*-th character of the lane. `.` continues
the previous value, and cycles stay contiguous across a gap.

## What you MUST NOT infer

- **Ignore the layout zone.** Everything from the `layout` keyword down is
  geometry, it exists only to stabilise the SVG, and no keyword turns this on
  or off. *(One exception, and it is a workaround for a missing construct:
  if the layout looks load-bearing — dense pins forming a stack, a grid or a
  map, where stack order, cross-layer alignment or spans are the point —
  read it, and say in your summary that you did. Such a document has a
  semantics gap.)* A document with no `layout` line may use an older
  `# --- layout` comment as an informal boundary.
- **Arrangement is not precedence.** Declaration order records the author's
  statement order — a focus and reading-order signal. It is not a ranking, a
  priority or a sequence.
- **`flow` is a reading axis, not a sequence.** It says which way the figure
  is meant to be read. It does not order the nodes and asserts nothing about
  time or causality.
- **Presentation never carries meaning alone.** Colour, dash style and gaps
  may *render* meaning but must never be its only carrier. You are entitled
  to discard them; if a distinction exists only there, the document has lost
  it — **say so** rather than reconstructing it. When the colours genuinely
  *are* the subject, read the colour names in the labels and the order from
  the table or bitfield, not the hex values.
- **A keyword's meaning is relative to its genre.** Line 1 names the
  namespace. Never carry a reading from one genre into another, and read a
  nested region under **its** genre, not its host's. Multi-section files give
  each section its own genre. The permanent exceptions: `figdown`, `title`,
  `layout` and `pin` mean the same thing everywhere — which is exactly what
  lets you skip the layout zone without first knowing the genre.
- **A shared `class` is a shared category, not an identity.** The language
  has no equivalence or alias relation.
- **Status is not visible in the syntax.** A line that parses tells you
  nothing about whether it is inside the portable v0.1 surface. If
  portability matters to your answer, check the status rather than the fact
  that it parsed.
- **Absence is not prohibition.** A relationship the figure does not draw is
  simply not stated. Never read it as forbidden unless the document *says* the
  reading is closed-world and lists the prohibitions — the syntax cannot carry
  that on its own.
- **Never infer meaning from drawing geometry.**

## Out-of-scope figures

If a document keeps a raster image because the original is outside FigDown's
scope (a chart, an electrical schematic), the knowledge must also exist
alongside it as a table or prose. Recover the meaning from that text — do not
render the image.
