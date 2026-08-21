# Genre `block` — markers and zones (EXPERIMENTAL)

`threshold` and `band` are **outside the v0.1 conformance surface and outside
the compatibility promise**. The engine accepts them and your document keeps
working, but they may change or be withdrawn in a later `0.x`. The parser
emits no warning, so a line that parses tells you nothing. Use them when the
figure genuinely needs them; if the figure must be portable, do not, and if
you use one anyway, say so beside the figure.

**Both belong to `block` alone.** They are declared by this genre and by no
other: writing either under `topology`, `flowchart` or `statechart` is a line
error that says so and gives the ground. `block` earns them because it is the
genre those figures are actually authored in; a state's box, a flowchart
stage's box and a device's box have no extent that means anything, so a line
drawn 60% down one asserts nothing a reader can read.

Load `../scene.md` first — this file adds two words to `block`'s vocabulary
and changes none of it.

```figdown
figdown 0.1 block
group pool "Storage pool"
node used "In use" in=pool
threshold "High watermark = stop writes" in=pool offset=80%
threshold "Low watermark = resume writes" in=pool offset=45%
band "Reserved" 15% in=pool fill=#fee2e2
band "Shared quota" 20..70% in=pool extend=down
```

- `threshold` needs a quoted label **and** `offset=<0..100>%`, both mandatory
  — the `%` included. There is no `value=` and no `ref=`.
- `band` needs a quoted label **first**, then either one percentage (a size)
  or an explicit `<a>..<b>%` range. `..` is the language's ONE range
  separator; the hyphen form is a line error. `extend=up|down|left|right`, and `up`
  is the default.
- Both attach to a node or a group via `in=`.
- **Attach at the scope the fact belongs to.** A limit shared by everything in
  a group is one group-level marker; a fact true of one element attaches to
  that element. The renderer may draw the two the same way — the difference is
  in the text, and the text is the knowledge.

## The label is the knowledge, and `offset=` is not a value

`offset=` is a fraction of the target's **rendered extent** — where to paint
the line — **not a value of any quantity**. The target declares no scale, so
there is no conversion and nothing to convert. Put the number in the label or
it is not in the document.

**This is the trap, and it is worth naming.** In the domain these figures
usually come from, a threshold is a queue depth **with a numeric value**: an
active-queue-management minimum and maximum threshold (RFC 2309, RFC 7567)
is a number of packets or bytes. FigDown borrowed the word from exactly that
domain and did **not** borrow the attribute the domain defines it by. So
`threshold "Max cap" in=q offset=80%` invites a reader to take 80% as the
threshold value. It is a paint position. Write
`threshold "Max cap = 800 KB" in=q offset=80%` and the figure says what you
mean.

The same holds for `band`: a band is a range over that same scale-free
extent. Its label is the whole of what it asserts.
