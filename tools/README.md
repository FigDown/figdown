# FigDown tools

See also `../conformance/` — the v0.1 parser-conformance suite (golden fixtures + runner: `node conformance/run.js`).

**This directory is not the whole gate list.** One `gate:*` script lives
outside it: `gate:mcp` runs `integrations/mcp-server/test.js`, because the MCP
server is shipped software (`bin: figdown-mcp`) rather than a linter, and its
test belongs beside it. The gate list has exactly one home — the `gate:*`
scripts in `package.json` — and `npm run gates:list` prints it.
**`lib/corpus.js` is the one enumeration every corpus gate calls.** `CORPUS-ENUMERATION-MECHANISM` records
that an earlier ruling counted fourteen instances of a check measuring a property
of what it FOUND while the defect sat in what it did not find, and concluded the
class has a general question — *what is the denominator, and who chose it?* — and
no general fix, because no mechanism can decide what SHOULD be in a denominator.
That is right about the **choice** and wrong about the **mechanism**: four gates
(`shape-check`, `boundary-check`, `strip-check`, `stability-check`) carried the
same hard-coded directory list and the same non-recursive `readdirSync`, which
is one copied line rather than four judgements. The walk, the skip taxonomy,
the coverage line and the empty-corpus guard now live in `lib/corpus.js` and
are shared; each gate still declares its own roots **by name**, because that
part is a claim about the world. The module enforces three things a gate can no
longer forget: the walk **recurses**; the coverage line is printed
**unconditionally**, every reason, zero or not; and an **empty corpus exits 2**
rather than reporting a clean run. `layout-lint.js` predates the module and
still carries its own equivalent copy.

The runner also enforces the **`LANE-ALPHABET-KEY-RESERVATION` option-key namespace guard** before it runs
any case: registering a single-letter option key drawn from the timing lane
alphabet (`p`, `n`, `x`) would silently reparse existing lanes as options, so
the run aborts with a named error instead.

- `fence-check.js` — verifies every ` ```figdown ` fence **and every FigDown
  directive written in an inline code span** against the engine, to catch doc
  snippets that teach non-existent spellings:
  `node tools/fence-check.js [--strict] [--help] [<file.md | dir> ...]`
  (default roots: repo root `*.md` plus `spec/`,
  `skill/`, `conformance/`, `examples/`, `tools/`, `figures/`,
  `integrations/` — every directory that teaches syntax, walked recursively,
  with the file count stated). Reports `ok`, `fail` (a real bad-spelling
  error), `unverified` (a fragment whose only errors are missing-declaration
  artefacts — undeclared ids, endpoints, groups — that legitimate snippets may
  omit), `skip`, and for inline spans `historical` and `stale-target`.
  `--strict` exits 1 on any `fail`; `--help` prints the roots and the markers.
  **The inline-span scan is the important half.** Most of the
  syntax this project teaches is written in a code span inside a sentence or a
  table cell, and a fenced-only checker cannot see any of it. That blind spot
  hid an invalid `class … fill=` on an edge in `guide/agents.md` for **ten
  releases**, then hid four more live errors in `guide/expressing.md`,
  `guide/authoring.md` and `guide/layout.md`, and on its first run the new scan
  found six further ones in five more files — including `field SYN 1` in
  `guide/showcase.md`, three lines below a fence that spells the same field
  correctly, and `field K 4 optional` in `spec`, present in the
  **twin alone** after the English had been fixed. A span is parsed only when
  its first word is a registered keyword, read from the engine.
  **Quoting a retired spelling on purpose** is the normal case in a migration
  document, and the tool distinguishes it structurally rather than by content
  — a heuristic that treated "contains a retired keyword" as intentional is
  exactly what let the six above survive. Four markers and one idiom:
  `<!-- fence-check: skip -->` (before a fence, or anywhere on a line to skip
  that line's spans), `skip-inline` / `resume-inline` to suspend a region,
  and `<!-- fence-check: migration-record -->` once near the top of a file
  whose SUBJECT is retired syntax. In a migration-record file a failing span
  is `historical`, **but the rewrite TARGET is still checked** — the right of
  an arrow (`→`, `->`, `=>`), or cell 2 of a two-column `| old | new |` row.
  That target is the only text in such a file an author is told to type, and
  nothing had ever verified it. The idiom applies everywhere, not only under
  the marker. *What the marker gives up, stated rather than implied:* a false
  claim in a migration-record file's narrative **prose** — a sentence
  asserting a retired form is live — is not caught there.
  **A self-test guards the migration-citation matcher.** The
  bad-spelling family is a list of phrases the engine writes verbatim, with one
  exception: `(MIGRATIONS <version>` is a CITATION FORMAT, and it is what covers
  every retired FORM — the space-delimited list, the paren point, the unquoted
  title — without this file enumerating them. A version rewrite that edits that
  string edits away the whole of that coverage, silently: six retired forms
  (`field SYN 1`, `rank hit punt`, `title TCP Header`, `pin a at=20,20`,
  `cell 1,1 fill=#eee`, `width auto 90 25%`) drop from `historical` to
  `unverified`, the run still reports **0 fail**, and nothing goes red — while
  two of the six are named in this repository's own prose as things this check
  catches, one of them in the tool's own header example. So before any file is
  read the tool now runs a known retired form through the engine and requires
  the resulting diagnostic to match the family; if it does not, the run aborts
  with exit 2 and prints the citation the engine actually emits. **A regex is
  checked by running it, never by reading it** — the rule PROCESS §3.1(c)
  states for the migration tool, applied here.
- `stability-check.js` — axiom-3 evidence harness (see below).
- `build-svg.js` — the sidecar generator: `node tools/build-svg.js
  [--with-title] <file.fd | dir> ...` validates and renders deterministically
  (titles are not drawn by default — the majority embedding case has a
  caption; `--with-title` opts in and is recorded in the artifact metadata)
  (`X.fd → X.svg`, source + SHA-256 embedded). Engine lookup order:
  `$FIGDOWN_HTML`, a co-located `figdown.html`, `../editor/figdown.html`.
  **Recursive**, and it states its file count. PROCESS
  §3.1(d) — *a gate that does not recurse is a gate that lies* — was
  written for the six read-only checks; the **generator** had the same
  defect and was missed. Handed `examples/ figures/` it rebuilt 28 of the
  66 artifacts and reported success on all 28, so the 0.1 version
  bump initially left 38 artifacts recording an engine that no longer
  existed. `artifact-check.js` caught it, which is what it is for — but a
  generator that quietly skips 58% of its input is how stale artifacts got
  shipped twice in the first place (§3.1(b)).
- `artifact-check.js` — the gate that compares an artifact against the source
  it was built from: `node tools/artifact-check.js [--strict] [--verbose]
  [<file.svg | file.fd | dir> ...]` (default paths: `examples/`, `figures/`;
  recursive). Every `.svg` records a SHA-256 **of its source** and the engine
  version that rendered it (core §7); this pairs each artifact with its
  same-basename `.fd` and fails when the two disagree. Nothing else in the
  repository could see that class of defect, and it had shipped twice. It also
  asks the engine whether each source still RENDERS, so a figure refused at
  geometry time (core §8) is allowed to have no artifact — and is not allowed
  to keep one. See below.
- `isolation-check.js` — the gate for the frozen/experimental file split:
  `node tools/isolation-check.js [--strict] [--verbose] [<file.md | dir> ...]`
  (default paths: repo-root `*.md`, `spec/`, `conformance/`,
  `examples/reference/`, `tools/README.md`, `CONTRIBUTING.md`; **recursive**).
  It mechanises the 0.1 ruling's own success criterion — *delete the
  experimental file set and what remains must still be a complete,
  self-consistent standard with no dangling normative references* — by taking
  the frozen set as the tree minus the experimental files and scanning every
  internal reference in it. Four checks: a dangling relative markdown link, a
  link into the experimental set from an unmarked block, a code-span citation
  of an experimental construct in an unmarked block, and a *definition* of an
  experimental construct inside a frozen file (a ` ```figdown ` fence whose
  directives use one, or an unmarked heading naming one). `--strict` exits 1
  on any finding. Membership of the experimental set is a path convention and
  not a manifest — any path segment named `experimental`, plus
  `spec/experimental.md` and its twin — so a new experimental file joins by
  being put in the right place. No engine is loaded; this is a documentation
  gate. See below.
- `layout-lint.js` — render-quality linter for scene figures (see below).
- `namespace-check.js` — the layout **namespace** has one membership, and two
  places state it: the `§10 (a′)` table in `spec/core.md` and
  the engine's `LAYOUT_DIRECTIVES`. `GENRE-NAMESPACE` restated §3's ignorability
  default over MEMBERSHIP rather than over the layout zone's textual extent —
  `pin` is legal before the `layout` opener as well as after it, so a promise
  phrased over the zone's extent was literally true and practically empty. A
  membership-based promise is only actionable if a reader can ENUMERATE the
  namespace, which makes `§10 (a′)` normative and makes an unchecked
  enumeration exactly the defect the ruling exists to stop. Four assertions:
  the three sources name the same keywords; each `(a′)` heading's parenthesised
  count matches its own table; `layout` is not listed as a member (it is the
  zone's opener, `§10 (a)` — `guide/layout.md` had claimed two members); and
  both core specs still state the default over membership and no longer carry
  the retired position wording. Every source is required: a missing heading, an
  unparseable table or an engine whose `LAYOUT_DIRECTIVES` moved is exit 2
  naming what moved, never a quietly smaller check. No engine is executed — the
  set is read from the engine source, as `capability-coverage.js` reads
  `CHILD_KW`. `gate:namespace` runs it with `--strict`.
- `strip-check.js` — `GUI-WRITEBACK-STRUCTURE` "strip test": flags scene nodes whose only relationship
  to the rest of the figure is geometric (no incident edge, no group membership)
  so their meaning would be lost if layout lines were stripped (see below).
  It strips the layout **namespace** — that is `pin` alone
  (core `LAYOUT-ZONE-NAMESPACE`) — plus the bare `layout` line that opens it. **Not** `flow` and `rank`,
  which core §7 classifies as content-zone scene keywords and which the
  semantic model carries (corrected; the tool had been stripping
  them, contradicting the spec). `size` left the strip set (`ELEMENT-GEOMETRY-DIRECTIVE`)
  when the keyword was retired and its `width=`/`height=` moved onto `pin`;
  `routing` and `path` left it (`EDGE-GEOMETRY-CONSTRUCTS`), withdrawn from the
  language, so the strip set shrank to one directive plus its opener.
- `boundary-check.js` — render-side check that `external` endpoints in a
  pinned scene land adjacent to their connected node (not at a far
  auto-layout rank) and never blow the canvas out:
  `node tools/boundary-check.js [--strict] [--verbose] <file.fd | dir> ...`
  (default roots: `examples/`, `conformance/cases/`, **walked recursively**).
  Asserts only pinned scenes that declare externals; "pinned" means a `pin`
  line carrying `at=`, since `ELEMENT-GEOMETRY-DIRECTIVE` lets a `pin` declare an extent and no
  position at all — but every other figure is now **counted under a named
  reason** rather than dropped. `--strict` exits 1 on any failure, or on an
  in-scope figure the tool could not read. Same engine lookup as
  `build-svg.js`.
  (The directive was spelled `boundary` until 0.1, which is where the
  file name and the engine's `doc.boundaries` model key come from.)
- `shape-check.js` — render-side check that a node's label sits inside
  the outline the node is actually **drawn** with, and that every edge
  endpoint lands **on** that outline:
  `node tools/shape-check.js [--strict] [--verbose] <file.fd | dir> ...`
  (default roots: `conformance/cases/`, `examples/`, `figures/`, **walked
  recursively** — `examples/patterns/` no longer needs naming because the walk
  reaches it, and so do the four sibling directories the old list omitted).
  Reads the rendered SVG, not engine internals; `--strict` exits 1 on any
  failure, or on an in-scope figure the tool could not read (see below).
- `editor-check.js` — the round-trip gate for everything the EDITOR writes:
  `node tools/editor-check.js [--strict]`. Two checks. (A) every entry of the
  editor's built-in `EXAMPLES` dropdown must parse with zero errors — a stale
  one hard-errors the moment a user picks it. (B) every GUI code path that
  BUILDS a directive line (node drag, resize handle, cell click, node/group
  buttons, link arm, threshold drag, delete-node's `rank` rewrite) is represented
  by a fixture holding the emitter's format string VERBATIM plus one rendered
  sample; the check asserts the format string still occurs in `figdown.html`
  (so a fixture cannot drift from the code it stands for) and that the sample
  parses clean. A fixture may record a LIST of strings (one code path spelled
  across several expressions), an occurrence `count` (one spelling shared by
  two call sites — losing either one fails), or no sample at all (a
  *recognizer*: a pattern that must keep matching what the language spells,
  such as delete-node's `^(node|pin) <id>` line removal). This class of defect
  is otherwise invisible: the parser moved `pin at=` to a paren
  point while `applyPins` kept emitting `at=x,y`, so every drag produced a
  document the engine refused, and the resize emitter had been writing the
  `w=`/`h=` retired for three releases with nothing to catch it.
  Since `ELEMENT-GEOMETRY-DIRECTIVE` the drag and the resize write the SAME `pin` line
  through `mergePinKeys`, so the fixtures cover the builder and each call
  site's patch separately. Run it after ANY engine change.
- `make-skill.js` — regenerates the self-contained agent-skill bundle
  in `skill/figdown/`: `figdown.html` and `build-svg.js` from the single
  engine source, and `reference/**.md` mirrored from `read/0.4/`, which
  is the source of truth for the per-genre reading files (`GENRE-REFERENCE-ADDRESS`). The bundle keeps its own copy because it is
  installed standalone, with no repository and no network; the copy is
  never hand-edited and `skill-coverage.js` fails on any byte of drift
  (check 0, VENDOR). Run after any engine change **and after any
  `read/0.4/` change**.
- `make-lib.js` — regenerates the embeddable library builds in `dist/`
  (`figdown.mjs` ESM + `figdown.js` UMD; API: `parse`, `render`,
  `renderDoc`, `artifact`, `version` — see `dist/README.md`) from the
  single engine source. Deterministic (same engine → byte-identical
  files). Run after any engine change. **The library version is READ FROM
  THE ENGINE**: `make-lib.js` greps `FIGDOWN_VERSION`
  out of the extracted engine region and throws if it cannot find it, so
  the only place a version is bumped is `editor/figdown.html`, in the
  same commit as the `spec/migrations.md` entry it belongs to. (Before
  that the script restated the constant by hand — a fifth copy to keep
  in step with the four engine copies, and it had been left at
  0.1 for four releases. Do not reintroduce it.)
  **Gated** — see `dist-check.js` below.
- `dist-check.js` — the gate `dist/` never had:
  `node tools/dist-check.js [--strict]`. Regenerates the two builds into a
  temp tree and byte-compares them against the committed `dist/`; asserts
  both report the engine's own `FIGDOWN_VERSION`; loads each build, renders
  a sample through it and requires the two to agree byte-for-byte; and
  reparses every published `.fd` under `examples/` and `figures/` through
  `dist/figdown.js`, requiring the same error set as the reference engine.
  *The failure:* `dist/` was the only generated artifact class in the
  repository with **no gate at all** — `conformance/run.js` loads the engine
  from `conformance/figdown.html` or `../editor/figdown.html` and never reads
  `dist/`, and `make-lib` appeared nowhere in `package.json`. It is also the
  copy a user installs (`main`, `module`, both `integrations/` projects), and
  the published tarball shipped a build of an older engine that rejected
  `index=` — a FROZEN key — and refused `examples/srh.fd` outright. Seventh
  occurrence of four-copy drift, first one in the copy that ships.
- `page-check.js` — verifies that each editor HTML page actually loads as
  JavaScript: parses every `<script>` block and reports the first syntax
  error. Catches backticks or `${` in built-in example text that would
  end a template literal and break the page in a browser while every
  Node tool kept working (the blind spot that shipped a broken editor for
  a full day). Usage: `node tools/page-check.js [page.html ...]`; default
  paths: `editor/figdown.html` and `skill/figdown/figdown.html`.
- `reference-coverage.js` — genre vocabulary **and form** coverage over
  `examples/reference/` (set of files per genre, not one kitchen-sink
  figure): `node tools/reference-coverage.js [--strict] [--normative-only]
  [genre…]`. Four checks: every keyword used, every option key used, every
  FORM used (each value of a closed enum option, and every construct that
  has a multi-value comma form shown in that form — enum lists and comma
  forms are read out of the engine, so the check throws instead of drifting),
  and — under `--normative-only` — no EXPERIMENTAL keyword or option leaking
  into `<genre>.fd`, which belongs in `<genre>-experimental.fd`.
  (`--enums` is accepted and ignored: enum coverage is always on.)
  The TRACKED vocabulary is engine-derived too: the genre docs
  supply each row's status (NORMATIVE / EXPERIMENTAL), while the `GENRE-KEYWORD-ALLOWLIST` top-level allowlist,
  the typed-block child keywords, the `|` row token, the positional flags
  (`conditional`, `highlight`) and the retirement filter all come out of
  `editor/figdown.html`. Before that the tool carried hardcoded seed lists and
  still demanded `wrap` — renamed `break` and a line error since
  — while never detecting the flag `conditional`, whose old spelling
  `optional` was the only one it knew how to look for. Keyword and option-key
  retirements are filtered separately, because `fill` is a retired KEYWORD and
  a live option key at the same time. A POSITIONAL row's ticked names stopped
  being read as option keys: `| *cycle* (positional, on `gap`) |`
  names its HOST directive, and reading it the other way demanded `gap=` of
  every `timing` reference figure — a spelling the language has never had, so
  the gap could never be closed. The file also **exports** its
  vocabulary machinery, because `skill-coverage.js` asks the same question of a
  different corpus and a second copy would drift.
- `capability-coverage.js` — the gate that the **example corpus** demonstrates
  the whole language: `node tools/capability-coverage.js [--strict]
  [--verbose]`. `reference-coverage.js` asks the same question of
  `examples/reference/` alone, and one figure can never answer it for a
  construct that is single-valued per document — `flow` is the case in point,
  which is why reference-coverage deliberately excludes keyword-argument
  enums. Spread over a CORPUS the same enum is perfectly coverable, and this
  tool is that question asked of every `.fd` under `examples/`. It fails when
  a capability has NO demonstrator, naming it.

  Written after `VERBATIM-REGION-SCOPE` (`#` is verbatim inside `[edge label]`) shipped with no example and seventeen gates said nothing — along with
  `flow left`, `flow up`, the `\"` and `\\` escapes, a negative `at=`,
  `chart` on a scene document, and the one-document hybrid form (`GENRE-COMPOSITION`), which
  the spec has described since v0.1 and no figure had ever used.

  Five of its six axes are DERIVED, so it cannot report "0 gaps" meaning
  "nothing I recognised": keywords from the engine's `GENRE_KW` + `CHILD_KW`;
  option keys from `DIRECTIVE_OPTS` (evaluated, not regexed) minus
  `RETIRED_OPT_KEYS` minus the keys that sit there only so a retirement
  message can fire, found by reading the engine's own diagnostics; every
  closed-enum value including `flow`'s, `chart`'s and — —
  the `sequence` fragment `type=` set of twelve, which is the same key
  spelled by a second genre and needs its own grab because one value of one
  set says nothing about the other. That grab is **fail-closed on a
  shrinking read**: the set is twelve because UML's `InteractionOperatorKind`
  is, so anything less means the engine declaration moved and the tool
  errors rather than quietly measuring a smaller denominator. It was tested
  by removing one operator from the corpus and watching the gate go red,
  which is the difference between coverage and the appearance of it; the comma forms
  `require`d from `reference-coverage.js` rather than restated; and the
  ESCAPES parsed out of the ABNF `escape` production in `spec/core.md` §11 —
  grow that production and the tool demands a demonstrator with no edit here.
  The derived keyword and option-key sets are cross-checked against the spec
  genre documents' Complete-vocabulary tables, so neither the engine nor the
  spec can hide a construct on its own.

  The sixth axis is a DECLARED list, and there is no honest way around it: a
  nested typed region, a negative coordinate, a `#` surviving inside brackets,
  a `class` that claims no meaning — none of these adds a keyword, an option
  key, an enum value or an escape, and nothing enumerates them as a set. `VERBATIM-REGION-SCOPE`
  is exactly that shape, which is why it slipped. So the list is fenced twice.
  (a) Every entry names a spec ANCHOR — a literal string that must still be
  present in the named spec file, so rewording the passage fails the gate
  rather than leaving it checking a capability the spec no longer describes.
  (b) The source repository adds a RULING WATERMARK axis here, which reads
  its numbered ruling ledger and fails until a new ruling is stated to have
  introduced a demonstrable capability or none. That ledger is internal
  working record and is not published, so neither it nor the axis that reads
  it is part of this copy of the tool; (a) is the fence that ships.

  **The declared axis counts SITES, not rulings (`CAPABILITY-COVERAGE-GRANULARITY`).** One
  entry is one directive, one token, one syntactic region; a ruling that
  spans sites is split across as many entries and each names its own site
  when it fails. It was one entry per RULING for one release, and that was
  measured wrong by injection: rewriting `examples/gre.fd`'s `field ""` to a
  named field — the corpus's only empty label on a `field` — left the gate
  green, because `node ""` satisfied the whole `EMPTY-LABEL-STATE` entry. The site list comes
  from the SPEC (core §12.3 enumerates the `""` directives, §1 the verbatim
  regions, §4 the composable openers), never from the corpus, and a site is
  where the syntax is WRITTEN, not what it is written about — so a negative
  `at=` is one entry although `at=` applies to nodes, groups and externals.
  15 entries → 29, 92 tracked capabilities → 106, eleven of them with no
  demonstrator when the split landed.

  **What it does not cover, stated plainly.** It checks that a capability has
  at least one demonstrator, never that the demonstrator is good. The declared
  axis is only as complete as the last ruling review — the watermark forces a
  review, it cannot perform one. Combinations are out of scope (`present=` and
  `index=` are each covered; a field carrying both is not a tracked
  capability). Error cases are `conformance/`'s job, not this tool's. Single
  demonstrators are reported as advisory, never as a failure.

- `skill-coverage.js` — the gate that the **agent skill** teaches the whole
  registry and nothing retired: `node tools/skill-coverage.js [--strict]
  [--normative-only] [--verbose]`. `skill/figdown/` is the document that
  authors documents — it authored 642 downstream `.fd` files — and its PROSE
  was checked by nothing. Two spellings it taught (`edge … fill=`, and a
  `fill=`-only class joined by an edge) had been hard errors
  and went on being taught for four releases; the measured consequence is on
  file as *supply, not demand* — `stroke=` was demoted to EXPERIMENTAL on a
  corpus count of 5, taken from a corpus that had been taught not to use it.
  Seven checks. (0) VENDOR — `skill/figdown/reference/` is byte-identical to
  `read/0.4/`, which is the source of truth (`GENRE-REFERENCE-ADDRESS`); the bundle's
  copy is generated by `make-skill.js` and a copy nothing compares is the
  eighth four-copy-drift incident waiting to happen. (1) ROUTE — every genre has a row in `SKILL.md`'s router table,
  every file it names exists, and every reference file is reachable from some
  row. (2) MISSING — a registered keyword, option key or enum value of genre
  *G* that *G*'s LOAD SET never teaches; this is the per-genre minimum-set
  check, since the genre document's Complete-vocabulary table IS the minimum
  set. (3) RETIRED — a retired or WITHDRAWN spelling taught anywhere in the
  bundle without a retirement marker beside it (same admission rule as
  `comment-check`, and the same three engine sources — with the wider verb
  list, so `WITHDRAWN` is visible). (4) CORE — the always-loaded `SKILL.md`
  teaches nothing outside the genre-independent surface, which is computed as
  the INTERSECTION of the engine's per-genre allowlists plus the presentation
  and layout-namespace option keys, never judged. (5) CODES — no internal
  decision code (`MEANING-RECOVERY-SOURCE`, `MEANINGFUL-ARRANGEMENT`, `DECLARATION-ORDER-SEMANTICS`) and no dev-increment provenance
  (0.1) survives in the bundle: the skill is installed standalone,
  without the spec beside it, so a bare citation teaches nothing and costs
  tokens in the one document whose whole purpose is to cost few.
  **Rewritten as a SHAPE TEST.** It had been an enumeration —
  `R\d{1,3}|D\d{1,2}|G\d{1,2}|A\d{1,3}|K\d{1,2}|S\d{1,2}|OQ-S\d{1,3}|0\.1-dev\.\d+` —
  with the three blind spots an enumeration always has, the same three the
  publish pipeline's copy of the idea had: it listed FAMILIES (so `GRAMMAR-SKETCH-COMPLETENESS`, `V2`,
  `INAPPLICABLE-OPTION-KEYS` were invisible), it was CASE-SENSITIVE (so every `r25`
  was invisible), and it read `.md` ONLY — while the bundle also ships
  `build-svg.js`, a file `SKILL.md` tells the agent to RUN, whose header
  carried three citations nothing had ever looked at (`MARKDOWN-EMBEDDING-CONVENTION`, 0.1,
  0.1; all three are fixed in `tools/build-svg.js`, their source).
  *A check that lists what it knows about cannot report the arrival of
  something new: it reports zero and means "nothing I recognised."* The
  pattern now carries no family letter at all, matches case-insensitively over
  every `.md`/`.js` in the bundle, and is cut down by **named
  data-versus-reference discriminators, never by a narrower pattern** — this
  repository is full of figure data shaped like codes (`DYNAMIC-FIGURE-PURPOSE` a router, `A1`/`A2`
  PVLAN communities, `Q0` a queue, `T1` a DHCP timer, `MULTI-FIGURE-DOCUMENTS` a node label). The
  discriminators: inside a ```figdown fence only `#` comment text is prose; in
  a `.js` only comment text and quoted SENTENCES; a quoted string whose first
  word is a registered keyword is a DIRECTIVE, not prose; a hex colour is a
  value; a quoted label or a code span is figure data or language text; an id
  the same file declares is data; a dotted version (`v0.1`) is a version; a
  registered keyword / option key / enum value / header-tier address `h<n>` is
  language vocabulary; and finally the token must be one THIS PROJECT HAS
  ACTUALLY USED as a code — a registry harvested from defining and citing
  positions in `spec/` and `conformance/` (`### `CLOSED-GRAMMAR` — …`,
  `## `COLOUR-VALUE-VALIDATION` — …`, `## 0.1`, `- **`GENRE-NAMESPACE` — …**`, `**`GENRE-KEYWORD-ALLOWLIST`**`,
  `(`BITFIELD-REPETITION-CONSTRUCT`)`, `(`DOMAIN-VOCABULARY-PREFERENCE` §4)`). That last one is what keeps `sha256`, `IPv4`, `L3`
  and `msb0` out **without naming them**, and what makes a family invented
  tomorrow enter the check the moment it is defined anywhere in the spec —
  no edit here. `skill/figdown/figdown.html` is exempt BY NAME and with the
  reason stated in the source: it is a byte-identical generated copy of the
  engine, and requiring it to be code-free would mean stripping the engine's
  own reasoning out of the engine. (6) ISOLATION — the strip test of PROCESS §3.1(e)
  applied to the skill: delete `skill/figdown/reference/experimental/` and
  every frozen genre must still be completely taught. **It cannot check that
  prose is TRUE** — only that it is COMPLETE against the registry and CURRENT
  against the retirement tables, which is the half that was silently rotting.
  Nothing in it is a list the tool maintains: the registry is read through
  `reference-coverage.js`, and every lookup throws if the engine's spelling
  moves.
- `comment-check.js` — the gate over `.fd` **prose**, which the engine never
  reads. Two rules, one per surface:
  `node tools/comment-check.js [--strict] [--verbose] [<file.fd | dir> ...]`
  (default paths: `examples/`, `figures/`). **(1)** no `.fd` **comment** uses a
  retired keyword, option key or enum value as if it were current — the engine
  validates directives and never comments, so a comment can teach `boundary` or
  `text=` for three releases after the language stopped accepting them with
  every gate still green, and in `examples/reference/` the comments ARE the
  teaching (eight such comments were found by hand). **(2)** no
  `.fd` string that **renders** carries an internal reference — a `class`
  meaning, a label, a `title`, a `description=` and a table's pipe cells are all
  drawn into the SVG, so a decision code there is an undecodable reference *in
  the picture*, where the reader has no document to consult even in principle.
  See below.
- `legend-check.js` — the gate over the **derived legend**, which core §2.7
  says "draws what the author declared, and nothing the author did not":
  `node tools/legend-check.js [--strict] [--verbose] [<file.fd | dir> ...]`
  (default paths: `examples/`, `figures/`; **recursive**, and it states its
  file count). Two rules, one per direction the §2.7 sentence can be broken.
  **(1) duplicate swatch** — within one figure, every legend entry must be
  visually distinguishable from every other: the resolved `(fill, stroke,
  style)` tuple is compared across classes and identical tuples fail. A legend
  that draws two identical swatches beside two different meanings CLAIMS a
  distinction the drawing does not make. Three shipped files did exactly that
  (`class bridge_domain … style=dashed stroke=#1d4ed8` beside `class pe_ce_bgp
  … style=dashed stroke=#1d4ed8`). **(2) unreachable channel** — a class may
  not declare a paint channel that reaches none of its members: the legend then
  SHOWS a distinction the drawing cannot make. Two reference figures did that
  (`class vendor … style=dotted` joined only by `field`s, and `… style=dashed`
  joined only by `cell`s — `style=` left both option lists,
  `STYLE-KEY-SCOPE`, and a class carrying it is silently dropped on those members while
  the swatch still draws the dash). Rule 2 is decided by **differential
  render**, never by a table of which element kind takes which key: the
  class's label is blanked (a label-less class draws no legend entry, `CLASS-PAINT-REQUIREMENT`/
  `CLASS-EMPTY-MEANING`), the channel is rendered at two different legal values, and identical
  output means no member can receive it. The engine owns that table, it has
  moved twice (`INTERIOR-LESS-ELEMENT-PAINT`, `STYLE-KEY-SCOPE`), and a second copy of it inside a gate is the drift
  this gate exists to catch. Neither rule is visible to any other check: both
  documents parse, both artifacts agree with their sources, and neither
  comment names a retired spelling.
- `standards-check.js` — the gate over `spec/standards-claims.tsv`, the register
  of every claim this repository makes about an **external** standard: it
  harvests each standard-name token in the live editable tree (keyed on the
  NAME, reading a following `§` as its argument — never on `§` alone), fails on
  a claim-bearing sentence with no register row, checks each row's shape against
  its `claim_kind` (`wording` · `absence` · `structure` · `availability`, the
  last carrying a **retrieval record**, which is what catches a paywall-style
  claim no quotation rule reaches), holds translations to twin parity, and
  matches quotes against the standards' own texts **when** they are present in
  `$FIGDOWN_STANDARDS_TEXT` or the gitignored `standards-text/` — printing
  SKIPPED with the count it did not check when they are not. The scanned set,
  every exclusion and its reason, and the harvest's known misses are printed on
  every run: `decisions/registry.md` found thirteen false
  external-standard claims across ~50 sites where three were known, and the
  reason they survived is that nobody held the denominator.
- `migrate-figdown.js` — detection-based, idempotent spelling migration
  toward the freeze candidate (`render`→`layout`, `via=` paren points,
  `w=`/`h=`→`width=`/`height=` and `dir=`→`extend=`,
  …): `node tools/migrate-figdown.js [--write] [--flag-experimental]
  <file.fd|dir>…`. Option-key renames touch the CODE portion of a line
  only — never inside a quoted value or a comment. Report-only items
  include the compact-`field` unquoted-name rule, which
  prints the exact quoted line to paste. See `spec/migrations.md`.

  **Requirement (spec core §13.4): this tool MUST be cumulative and
  idempotent ACROSS VERSIONS**, not merely correct for the latest hop.
  Every rewrite the project has ever shipped stays in the table below; a
  document from any earlier version must reach the current one in a
  single run; and running the tool on an already-current document must
  change nothing. The reason is that accumulating 0.x migrations is the
  rehearsal for v1.0's machinery, and a chain that has never been run end
  to end has not been rehearsed. Never delete a rule from this tool
  because "nobody is still on that version" — that is exactly the
  assumption the requirement exists to remove.

  Added — two mechanical rewrites and one report-only
  detection:

  | rule | what it does |
  |---|---|
  | `guide→threshold` | line-initial keyword `guide` → `threshold` (`THRESHOLD-KEYWORD-SPELLING`). The pre-existing `line→threshold` rewrite runs in the same pass, so the pre-0.1 spelling lands on the CURRENT keyword — one hop, not two |
  | `chart level= deleted` | on a `chart` line, DELETE the `level=<value>` token (`CHART-LEVEL-KEY`). The construct is gone and the value it carried has no other home, so deletion is the only rewrite there is — same shape as the 0.1 `fill=` drop on a no-interior directive |
  | `band-needs-label` (report only) | flags every `band` line with no quoted label and prints the shape to paste (`band "<name>" 15..35% in=pool`). NON-MECHANICAL by design: only the author has the region's name, which is the whole point of `BAND-LABEL-STATUS`, so the tool refuses to invent one |

  Both rewrites are idempotent: the old spellings became hard errors, so a rewritten file can never match again. Model consumers
  additionally rename the top-level array `guides` → `thresholds`.

  Added — one mechanical rewrite:

  | rule | what it does |
  |---|---|
  | `band range -→..` | on a `band` line, rewrite the range separator: `band "X" 15-35%` → `band "X" 15..35%` (`RANGE-SPELLING`). FigDown has ONE range grammar, `..`, and between two numbers a hyphen reads as subtraction. It runs BEFORE `band-needs-label`, so that report echoes the current spelling. Idempotent by construction: the output contains no digit-hyphen-digit left to match |

  **Guard:** the tool hard-refuses `--write` over `conformance/cases/`,
  `conformance/experimental/` and  `tools/migrate-fixtures/`.
  Retirement fixtures are *supposed* to contain retired spellings;
  a `--write` run "migrated" four of them into passing documents
  and only a final audit caught it. Conformance goldens move with
  `node conformance/run.js --update`, migration goldens with
  `node tools/migrate-check.js --update`, and nothing else.

  **The tool is tested by `migrate-check.js`, below** — it is not verified
  by reading it (.github/CONTRIBUTING.md §3.1(c)).
- `migrate-check.js` — the fixture suite for `migrate-figdown.js`:
  `node tools/migrate-check.js [--update] [--verbose] [name-filter]`.
  Fixtures live in [`migrate-fixtures/`](migrate-fixtures/README.md) — an
  input `.fd` and its expected output, one per rewrite rule, plus a golden
  report per report-only rule. Every fixture is additionally checked for
  **idempotence**, for **parsing** (through the tool's own REFUSAL (c)
  decision, never a second copy of it), and against the **retired rewrite
  directions**; then every input is replayed through the **binary** with
  `--write` in a scratch directory, because the refusal path and the exit
  code live in `main()` and calling `migrateText()` does not exercise them.
  See below.

## migrate-check.js

The engine has 205 conformance fixtures. Until 0.1 the migration
tool had **one manual end-to-end run** — and it had already failed in
exactly the way a suite catches: it carried the rewrite
`optional` → `conditional` for a **full release** after `PRESENCE-FLAG-SPELLING` reversed that
direction, so the project's own upgrade path taught a spelling the project
had rejected. It was found by a person reading the source.

| check | assertion |
|---|---|
| output | `migrateText(input)` equals the `.expected.fd` golden, byte for byte |
| report | the formatted report equals the `.report.txt` golden (or there is none) |
| idempotent | a second run changes nothing and records no rewrite — core §13.4 makes this a MUST. On a **refusal** fixture the assertion inverts: the refusal must be *stable*, never accepted on the second attempt |
| parses | the result introduces no engine error the input did not already have |
| negative | the result contains no retired rewrite direction, and **every** retired direction must have a live trigger fixture — an assertion nothing fires on is decoration |
| end to end | the binary is spawned with `--write` over a scratch copy of every input, and the corpus guard is asserted by pointing the binary at the fixture directory and requiring a refusal |

Its first run found four defects in the tool, all of them in the
"announces a fix and then writes nothing" class that REFUSAL (c) had been
silently absorbing. They are recorded in
[spec/migrations.md](../spec/migrations.md) 0.1.

## artifact-check.js

Every `.svg` in this repository is generated from a `.fd`, and every one of
them carries the evidence needed to prove it: the full source, a **SHA-256 of
that source** (`data-sha256=`), and the engine version that rendered it
(`data-engine-version=`, added) — spec core §7, which also makes
same-basename pairing (`X.fd` ⇔ `X.svg`) **normative**. No gate was using any
of it. This one does.

```
node tools/artifact-check.js [--strict] [--verbose] [<file.svg | file.fd | dir> ...]
```

Default paths when none are given: `examples/`, `figures/` (resolved from the
project root). **Recursive**, and it walks **both sides of the pair** — the
header prints `files=` (artifacts) and `sources=` (`.fd`), against 28 for the
top level of those two directories alone. A `.fd` named on the command line is
resolved to its paired artifact and vice versa. Engine lookup order:
`$FIGDOWN_HTML`, co-located `figdown.html`, `../editor/figdown.html`; the
current version — and `parse`/`render` themselves — are read
out of the engine, never restated here.

| verdict | meaning |
|---|---|
| `ok` | the recorded hash equals the SHA-256 of the paired `.fd` |
| `STALE` | it does not — the artifact draws a figure its source no longer describes |
| `engine-lag` | hash agrees, but an **older** engine rendered it |
| `engine-ahead` | hash agrees, but the artifact records a **newer** engine than this checkout has |
| `geometry-refused` | the source parses and `render` then **refuses** it (core §8): the drawing would state something the source does not. `build-svg` writes nothing for it and `layout-lint` skips it under this same name. A **missing** artifact is the correct state — counted, listed with the engine's own diagnostics, and clean |
| `REFUSED-ARTIFACT` | the engine refuses the figure and an `.svg` is on disk anyway. The remedy is `rm`, not a rebuild |
| `no-engine-version` | built before 0.1, so the attribute does not exist. **No version is inferred** — the absence is itself the information (MIGRATIONS 0.1). Counted on its own line, neither warned nor failed |
| `skip` | `no-metadata` (an `.svg` with no `figdown-source` element), `no-source` (metadata, but the paired `.fd` is absent), or `no-artifact` (a `.fd` the engine **will** draw with no `.svg` built from it). All are **counted and listed**, never silently omitted |

**A stale artifact exits 1 with or without `--strict`.** That is deliberate,
and it is the one place these tools depart from "`--strict` is what makes it
fail": a stale artifact is a wrong figure that has already shipped, not a lint
opinion. **`REFUSED-ARTIFACT` exits 1 on the same terms and for the same
reason**, and it *supersedes* `STALE` rather than weakening it: both say the
artifact is wrong, but they prescribe opposite actions and only one of them can
be carried out — a refused figure cannot be rebuilt, so "run build-svg" would be
advice that fails when followed. `--strict` adds the engine-version mismatches,
which are a WARN on their own (`RENDERING-DETERMINISM` promises byte-identical output for the same
source **and** the same renderer version, so a lagging artifact is outside the
promise even when its source matches). `--verbose` prints every artifact rather
than only the flagged ones.

**Why the refusal is a verdict and not a silence.** Walking only the `.svg`
side made the whole question invisible: a refused figure's correct state is to
have *no* artifact, and a tool that only ever looks at artifacts cannot see a
figure that has none. The other half matters just as much — an artifact left
behind by an older engine keeps shipping the picture the current engine declines
to draw, and looks perfectly consistent doing it, because its recorded hash
still matches its own embedded source. Every `.fd` in scope is classified, not a
sample: one parse plus one render each, about 1.2 s for the 57-source corpus.

**Why it exists.** The same failure shipped twice, and neither time could any
other gate see it:

- **0.1** migrated 32 `.fd` sources and never rebuilt their artifacts.
  Its byte-identity check compared the old artifacts against the old
  artifacts, so it agreed with itself.
- **0.1** repeated it with 5 artifacts (`examples/reference/block`,
  `block-experimental`, `topology`, `examples/statechart/dhcp-client`,
  `examples/layout-compare/srl-evpn-irb-tuned`). One was a **changed
  drawing**: `data-edge` carries the 1-based **source line**, and the
  `size`→`pin` merge deleted a line above the edges.

Each stale artifact was **internally consistent** — its recorded hash matched
its own embedded source — so only a comparison against the `.fd` could detect
it. That is the whole tool.

## isolation-check.js

The 0.1 ruling separates FROZEN from EXPERIMENTAL material at the FILE
level, and states its own success criterion — the `GUI-WRITEBACK-STRUCTURE` strip test applied to
documentation:

> Delete the experimental file set. What remains must still be a complete,
> self-consistent standard with no dangling normative references.

```
node tools/isolation-check.js [--strict] [--verbose] [<file.md | dir> ...]
```

**Membership of the experimental set is a path convention, not a manifest**:
any path segment named `experimental`, plus `spec/experimental.md` and its
twin. A new experimental file joins the set by being put in the right
place, so there is no list to leave stale on the day of a cut. The frozen set
is everything else scanned.

**Two tiers, and the difference is deliberate.**

| tier | checks | scope | `--strict` |
|---|---|---|---|
| **1 — link integrity** | `dangling-link`, `unmarked-link` | every frozen `.md` in scope | **fails** |
| **2 — isolation** | `definition-in-frozen`, `unmarked-citation` | the frozen normative standard only | `definition-in-frozen` **fails**; `unmarked-citation` is report-only |

Tier 2's scope is `spec/core.md`, `spec`, the `.md` files
directly in `spec/genres/`, `conformance/README.md`,
`examples/reference/index*.md`, `CONTRIBUTING.md` and this file. Three classes
are excluded, each for a stated reason rather than for convenience: the
**change logs** (`spec/MIGRATIONS*`, `spec/MIGRATE*`,
`conformance/DISCREPANCIES.md`), whose job is to name a construct as it was at
the time; the **teaching guides** (`guide/agents.md*`, `guide/layout.md*`,
`guide/showcase.md*`, `guide/expressing.md*`, `guide/authoring.md*`, `README*`, `skill/`), which teach the
whole language and mark experimental constructs inline inside the fence.
**The teaching-guide exclusion is a
remaining exposure, not a clean result** — a reader who wants only the frozen
surface still has to filter those documents by eye, and moving their
experimental teaching into files of its own is unfinished work, not a decision
that it is unnecessary.

`unmarked-citation` is report-only because its marker rule is a **proxy**: it
cannot tell a registry row (which the ruling explicitly preserves — a closed
language has to say what exists) from a genuine dependency. It is counted and
printed so drift stays visible; driving it to zero is a named obligation, not
a finished job. `definition-in-frozen` is the exact half and does fail: a
` ```figdown ` fence in a frozen file whose directives use an experimental
keyword, or an unmarked heading naming one.

Six spellings used to be excluded from `unmarked-citation` — `path`,
`routing`, `points=`, `tailport=`, `headport=`, `routing=` — on the grounds
that marking citations of constructs about to be removed would be throwaway
work. `EDGE-GEOMETRY-CONSTRUCTS` removed them, and the exclusion went with them: it
was a window, not a policy, and the tool now checks every experimental
spelling on the same terms.

No engine is loaded — this is a documentation gate, and it recurses.

## comment-check.js

`fence-check.js` engine-verifies every ` ```figdown ` fence in the Markdown
docs, and the conformance suite covers every directive. Nothing looked inside
a `#` comment, and nothing looked inside a `"string"`. Those are the two halves
of a `.fd` the parser reads past: it checks that a `class` line is well-formed
and never looks at a single character of what the comment above it or the label
inside it actually says. This tool owns both.

Rule 1 is the comments. That is where the reference figures do their teaching —
`examples/reference/block.fd` is 90 lines carrying 39 comment lines — so a
stale comment there teaches a spelling that is now a line error, with the
authority of the standard's own example. Rule 2 is the strings that render, and
has [its own section](#rule-2--no-internal-reference-in-a-string-that-renders)
below. Rule 3 is the SPEC PROVENANCE LINE (`SPEC-PROVENANCE-LINE`): every file in
the corpus must open with

```
# FigDown — figures as text. Spec: https://github.com/FigDown/figdown
```

checked on three counts — presence, exact wording (em dash included; a
paraphrase is a different sentence and cannot be searched for) and position
(line 1, hence above the `figdown` header, per core §1). The line exists
because a `.fd` file travels away from this repository and lands beside a
reader who has never heard of the format; measured, 430 `.fd`
files carried 13 URLs between them and not one resolvable locator. It is a
CONVENTION, not language surface — the parser does not read it and its
absence is not a line error — which is exactly why it needs a gate.

It lives in this tool rather than a nineteenth one because this tool is
already the gate over `.fd` prose the engine never reads, over precisely the
corpus the rule applies to. Test fixtures are deliberately outside that
corpus: `conformance/cases/`, `conformance/experimental/` and
`tools/migrate-fixtures/` are minimal inputs, and 105 of the
`conformance/cases/*.errors.txt` goldens carry 1-based `Line N:` prefixes
that an inserted line shifts by one.

```
node tools/comment-check.js [--strict] [--verbose] [<file.fd | dir> ...]
```

Default paths when none are given: `examples/`, `figures/` (resolved from the
project root). `--strict` exits 1 on any defect of any rule; `--verbose` also
prints the historical notes rule 1 admitted and the parenthesised codes rule 2
listed for review. Engine lookup order: `$FIGDOWN_HTML`, co-located
`figdown.html`, `../editor/figdown.html`.

**The vocabulary is derived from the engine**, from the same three places
the parser keeps it: `RETIRED_OPT_KEYS`, `RETIRED_SHAPES`, and every
`… has been renamed / retired / DELETED` diagnostic string (which is where
the retired KEYWORDS and the retired positional flag are spelled). A
retirement added to the engine is checked here the same day, and if those
tables move the tool throws instead of quietly checking less.

**The rule.** A retired spelling in a comment is a defect unless its
**contiguous comment block** also carries a *retirement marker*:

| | |
|---|---|
| defect | a comment that **uses** a retired spelling as if current — `# text= colours the label` |
| admitted | a comment that **names** it as history — ``# Spelled `guide` until 0.1`` |
| marker | 0.1, or one of `renamed` `retired` `deleted` `removed` `replaced` `superseded` `formerly` `until` `was` `were` `spelled` `used to` `no longer` |

Two choices in that rule are deliberate:

- **The block, not the line, is the scope.** A historical note routinely runs
  four lines and puts its version token on the last of them; the note in
  `block-experimental.fd` does exactly that. The cost is that a marker admits
  every retired spelling in its own block.
- **A bare R-number is NOT a marker.** One of the eight stale comments read
  ``# `boundary` is the outside world … drawn as a shape (`EXTERNAL-EDGE-ENDPOINTS`) …`` — the
  standard cites rule numbers everywhere, so an R-number is evidence of
  nothing.

**Two tiers of detection.** A retired spelling is matched as a bare word by
default, so a retirement added to the engine tomorrow lands in the strict
tier automatically (fail-closed). Spellings that are also ordinary English —
`line`, `fill`, `route`, `render`, `optional`, `conditional`, `note`, `wave`,
`size`, `cloud`, `via`, `unit`, `level`, `kind`, `text`, `labels`, the whole
0.1 withdrawal set (`path`, `routing`, `points`, `tailport`,
`headport`), and the
single letters — are on a named
opt-out inside the tool and are matched only in a CODE context: inside
backticks, or written as `key=` / `shape=value`. Every entry of that opt-out
is asserted to still be a retired spelling in the engine, so it cannot rot
either. The tradeoff is visible in both directions: the bare tier caught six
genuine `boundary` comments in `examples/`, and it also flags an English
"row boundary" (`conformance/cases/` has one) — reword or pass the path
explicitly. The opt-out tier is why a comment still teaching waypoints — `# via
list`, or a bare mention of a `path` line — has to be caught by eye: every
spelling in that family reads as ordinary English ("the happy path", "the
routing table", "border points"), so the bare tier cannot be trusted with it.
A backticked `` `path` `` or a written `points=` does still fail.

### Rule 2 — no internal reference in a string that renders

Rule 1 governs comments, which no reader of the picture ever sees. Rule 2
governs the opposite surface. A `class` meaning, a `node`/`edge` label, a
`title`, a `description=` and a table's pipe cells are all **drawn** — into
`<text>` in the legend and the boxes, and into the `<title>` tooltips. An
internal decision code there is not undecodable *prose*, it is an undecodable
*reference in the picture*: the `.svg` travels into someone else's wiki with no
repository beside it, so the reader has no document to consult **even in
principle**.

*The failure:* `examples/showcase/tcp-state-machine.fd` drew
`… no node-identity construct yet (`IDENTITY-ASSERTION`)` in its legend. Every gate was
green — the directive parsed, the comment was current, the artifact matched its
source. Nothing looked inside a string.

**Two tiers, because the distinction that matters is DATA vs REFERENCE and only
one half of it can be decided mechanically.**

| tier | matches | verdict |
|---|---|---|
| fail | `IDENTITY-ASSERTION`; a 0.1 provenance token; a repo-relative doc path (`spec/core.md`); a `§` hung off an internal document name (`core §9`) | strict exit 1 |
| review | a parenthesised bare code — `(`MEANING-RECOVERY-SOURCE`)`, `(`CATEGORICAL-MEANING-MAPPING`)` | printed under `--verbose`, counted, never fails |

The review tier is not timidity, it is the honest limit of the shape test:
`DYNAMIC-FIGURE-PURPOSE` is a router, `A1`/`A2` are private-VLAN communities, `Q0` is a queue,
`C1` is a chassis, `PIN-COORDINATE-SCOPE` is a device — **all five are live in this corpus**, and
a gate that failed on them would be wrong more often than right. That tier is a
human's worklist and says so. The consequence to state plainly: a bare `(`MEANING-RECOVERY-SOURCE`)`
written into a label is *reported*, not blocked, and only rule 1's namespace is
gated.

An external standard's section is a reference a reader **can** follow and is
never touched: `RFC 9293 §3.3.2` is the whole point of citing it.

**Both shapes of drawn string are read**, quoted directive strings and table
pipe rows. Missing the second is how a scan of this file class goes blind:
`examples/reference/table.fd` writes 5 of its 7 drawn strings as pipe cells,
which carry no quotes at all.

## fence-check.js

Engine-verifies every ` ```figdown ` fence in Markdown files so that a
documentation snippet that does not parse is caught before it teaches a
spelling that does not exist.

```
node tools/fence-check.js [--strict] [<file.md | dir> ...]
```

Default paths when none are given: repo root `*.md` files (non-recursive),
`spec/`, `skill/` (recursive). Archival
subdirectories are excluded from the defaults.

**Three verdict states:**

| verdict | meaning |
|---------|---------|
| `ok` | Fence parsed without errors (complete document or wrapped fragment) |
| `fail` | Real bad-spelling error: unknown keyword, unknown option, malformed line, or a complete document (`figdown …` first line) with any parse error |
| `unverified` | Fragment whose errors are exclusively missing-declaration artefacts (undeclared ids, endpoints, groups, planes) — context a snippet legitimately omits |

The distinction matters: errors about `unknown keyword`, `unknown option`,
`unknown shape`, `unknown genre`, `unknown color`, or malformed operators
are real failures even in a fragment; errors about `unknown endpoint`,
`unknown group`, `unknown node`, `unknown plane`, `unknown target`,
`pin of unknown id`, `unknown class`, or `no edge between … for bundle` are
context
artefacts that fragment snippets are expected to produce. Each alternative is
the engine's own wording; three had gone stale against it and matched nothing
(`unknown layer` → `unknown plane` and `plot references …` → `chart
references …`, and `size of unknown id` deleted with the `size`
keyword). A fourth alternative, `no edge … for path`, was
deleted with the `path` keyword itself: a `path` line in a
fence is now a plain bad-spelling `fail`, which is what a withdrawal is for.

**Opt-out marker.** A `<!-- fence-check: skip -->` comment on the line
immediately before a ` ```figdown ` fence tells the tool to skip that fence
entirely (verdict `skip`). Use it for snippets that deliberately show a wrong
spelling (e.g. a "don't do this" example or a future reserved-keyword sketch).
No blank line may appear between the marker and the opening fence.

`--strict` exits 1 if any fence is reported `fail`; without it the tool always
exits 0 (report-only mode). Engine lookup order: `$FIGDOWN_HTML`,
co-located `figdown.html`, `../editor/figdown.html`.

## stability-check.js

Measures design axiom #3 ("local edit → local change") as a number rather
than a claim. For each scene-bearing `.fd` (skipping pure `bitfield` /
`table` / `timing` figures) it applies five scripted single-line edits
**independently** (not cumulatively) and measures how far pre-existing nodes
move after each one.

```
node tools/stability-check.js [--strict] [--verbose] [--max-spillover=N] [<file.fd | dir> ...]
```

Default roots when none are given: `examples/`, `figures/`, **walked
recursively** (resolved from the project root, so the tool works from any CWD).

The node set of each document comes from the **engine's** `doc.nodes`, not
from a keyword this tool knows. Matching `^node` and nothing else was correct
only for `block` and `topology`: a flowchart declares
`terminator`/`process`/`decision` and a statechart declares `state`, so ten
scene figures — the whole of `examples/statechart/` among them — parsed to
zero node declarations and were dropped without a number. An edit that adds a
node likewise reuses the **document's own** declaration spelling, and an edit
that adds an edge is built by cloning an existing edge line, so the connector
keeps that genre's form (`flowline a -> b`, `transition a -[coin]-> b`).

**The five edits (applied to first eligible node/target in document order):**

| edit | description |
|------|-------------|
| `add-unconnected` | append a new node with no edges |
| `add-with-edge` | append a new node plus one edge from the first existing node |
| `longer-label` | extend one node's label with a long suffix |
| `add-color` | append `fill=` to one currently-unstyled node |
| `pin-unpinned` | append `pin <id> at=(x,y)` for one node that has no `pin` line at all, at its current rendered position |

**Columns in the report:**

| column | meaning |
|--------|---------|
| `moved` | number of pre-existing nodes that moved > 0.5 px |
| `maxDisp` | maximum displacement (px) across all pre-existing nodes |
| `spillover` | max displacement of nodes **not** adjacent to the edit (the axiom-3 number) |

`--max-spillover=N` sets a threshold: exits 1 if any figure×edit exceeds it;
without the flag the tool always exits 0 (report-only mode).

Pinned nodes that move under any edit are reported as **VIOLATIONS** and
always cause exit 1, regardless of the threshold flag.

Deterministic: two runs on the same codebase produce identical output.
Engine lookup order: `$FIGDOWN_HTML`, co-located `figdown.html`,
`../editor/figdown.html`. If a render throws, the figure is retried once
after 30 s; persistent failures are reported per row and skipped in totals.

## layout-lint.js

Checks rendered scene figures for layout defects.

```
node tools/layout-lint.js [--strict] [--verbose] [--max-score=N] [<file.fd | dir> ...]
```

Default paths when none are given: `examples/`, `figures/` — walked
**recursively**, resolved from the project root and so independent of the
current working directory. Every run prints the roots it searched and the
roots it deliberately does not judge (`conformance/`,
`tools/migrate-fixtures/`, `archive/`, `read/`),
so an exclusion is always visible rather than implied by a file's absence.

*Until 0.2.0 it did neither.* The search paths were the hard-coded list
`examples/`, `examples/patterns/`, `figures/` and the walk was a single
non-recursive `readdirSync`, so `examples/statechart/`, `examples/showcase/`,
`examples/reference/` and `examples/layout-compare/` were never opened.
Twenty-two files were tabled out of the fifty-six that exist, and the run
reported no skips because it had never counted the thirty-four it could not
see. A gate that does not recurse is a gate that lies (.github/CONTRIBUTING.md
§3.1(d)); check the `files=` count in the header against
`find examples figures -name '*.fd' | wc -l`.

A path named on the command line that is not a `.fd` is now refused by name.
Handing the tool an `.svg` used to feed SVG markup straight to the FigDown
parser, which answered with a convincing `Line 1:` parse error about a file
that was never FigDown source.

**Columns in the report:**

| column | meaning |
|--------|---------|
| `nodes` / `edges` | node and edge counts extracted from the SVG |
| `cross` | true edge-edge segment crossings (shared endpoints and T-junctions excluded) |
| `thru` | edges passing through node rectangles they are not incident to |
| `novlp` | peer node-node rectangle overlaps (group containers excluded) |
| `lblcol` | a label that has stopped saying which line it belongs to: one count per overlapping label PAIR, plus one count per label an edge STRIKES (however many edges cross it). Boxes are rebuilt with the engine's own `cand()` geometry — widest line × 6.5 px × `fs`/11, line height 1.3 `fs` — honouring `text-anchor` and joining `<tspan>` lines; the strike test is against the box's centre band (middle 40 % of height, inset 2 px), so a corner graze is not a strike |
| `coinc` | distinct edge pairs whose segments overlap collinearly for > 10 px — **except between two members of the same merge bus**, which are not charged. A bus draws one trunk stroked once per member (every member still emits its own full path), so shared ink there is the convention rather than a defect, and the junction dots are what tell a reader how many lines the trunk carries. Members are recognised by the `data-bus="<target-id>"` attribute the engine writes on each bus path. Coincidence with anything else — including between members of **two different** buses — is charged exactly as before |
| `ink/e` | total edge path length ÷ edge count |
| `score` | weighted sum: cross×2 + thru×3 + novlp×3 + lblcol×2 + coinc×2 |

The table is sorted worst-first by `score`.

`lblcol` says how many, never which. A diagnostic companion in the project’s
working record answers *which*: per figure it
names each struck label with the edge segment that strikes it, and each
overlapping pair. It loads this file's own `extractLabels` / `extractEdges` /
`segPassesThroughRect` rather than re-implementing them, so the diagnostic and
the gate cannot drift apart. Reach for it before changing anything about label
placement (`LABEL-PLACEMENT-METRIC`, 0.3 — the release where `lblcol` learned to read
multi-line labels at all).

**Coverage is printed on every run, whether or not any count is non-zero:**

```
considered 56  scored 36  skipped 20
  parse-error                 0   the engine rejected the source  [fails --strict]
  render-error                0   render() threw  [fails --strict]
  geometry-error              0   the SVG reader failed on the output  [fails --strict]
  no-scene-in-scene-genre     0   scene genre rendered 0 nodes and 0 edges  [fails --strict]
  unreadable                  0   file could not be read  [fails --strict]
  not-a-fd-file               0   named on the command line but not a .fd  [fails --strict]
  not-found                   0   path does not exist  [fails --strict]
  no-scene-genre             20   bitfield/table/timing/chart — nothing to measure
```

*Until 0.2.0 a figure with no nodes and no edges was dropped on a bare
`continue`, and the parse/render error counts printed only when non-zero — so
a figure the tool could not read produced output byte-identical to a figure
with no defects.* Every reason now prints its count at zero as well, because a
reason that appears only when non-zero is a reason nobody knows the tool has.

`--strict` exits 1 if any figure was considered and **not scored** for a
reason that means the tool could not read it. The single reason excluded from
that set is `no-scene-genre`: a `bitfield`, `table`, `timing` or `chart`
figure has no scene geometry to measure, so an empty render is the correct
answer rather than a failure to answer. The same empty render from a **scene**
genre (`block`, `topology`, `flowchart`, `statechart`, `sequence`) is counted
separately as `no-scene-in-scene-genre` and does fail. `sequence` is in that
set even though a ladder is **not** the scene renderer, because what the set
actually decides is whether an empty render is a correct answer or a defect: a
`bitfield` has no nodes and no edges by construction, while a ladder draws a
`data-node` per lifeline and a shaft per message, so nothing drawn means the
tool rendered a ladder and found none of it. `gate:layout` runs with `--strict`.

`--verbose` names every skipped file rather than only counting it; files
skipped for a `--strict` reason are always named.

`--max-score=N` sets a threshold: the process exits 1 if any figure exceeds
it; without the flag no scored figure can fail.

Engine lookup order is the same as `build-svg.js`:
`$FIGDOWN_HTML`, a co-located `figdown.html`, `../editor/figdown.html`.
If a render throws an error the figure is retried once after 30 s; persistent
failures are reported and the figure is skipped.

## strip-check.js

*Named `r25-check.js`, and gated as `gate:r25`, until 0.1.* The tool
does the strip test and every prose reference already called it that; the
filename was the last place carrying the internal item code. The requirement
ID **`GUI-WRITEBACK-STRUCTURE` is unchanged** — it is what the spec cites, and only the file and
gate names moved.

Automates the `GUI-WRITEBACK-STRUCTURE` "strip test" (spec §3, `GUI-WRITEBACK-STRUCTURE`, `MEANING-RECOVERY-SOURCE`): checks that stripping every
layout line leaves a document that still expresses the identical structure and
relationships. Flags scene nodes whose only relationship to the rest of the
figure is geometric — nodes that would become meaning-free orphans after the
layout namespace (`pin`, core `LAYOUT-ZONE-NAMESPACE` — its only member since `routing` and `path`
were withdrawn) and its `layout` opener are
removed.

```
node tools/strip-check.js [--strict] [<file.fd | dir> ...]
```

Default paths when none are given: `examples/`, `examples/patterns/`,
`figures/` (resolved from the project root).

**The heuristic checks:**

| heuristic | meaning |
|-----------|---------|
| scene node orphan | no incident edge AND no group membership — position is its only relation to the figure |
| pinned orphan | an orphan node that also has a `pin` line — meaning lives in coordinates |

Group membership **is** a syntactic relation: stripping layout lines still
leaves the knowledge that those nodes are peers inside that group, so a grouped
node is never an orphan.

Typed-block members (`bitfield`, `table`, `timing`) are never flagged — their
order is established by declaration, not geometry.

**Columns in the report:**

| column | meaning |
|--------|---------|
| `nodes` | total scene node count |
| `orphans` | nodes with no incident edge and no group membership |
| `pin-orph` | orphan nodes that also have a `pin` line |
| `verdict` | `ok` (no orphans), `warn` (unpinned orphans), `fail` (pinned orphans), `skip` (decorative opt-out) |

`--strict` exits 1 if any document has pinned-orphan nodes, so it can gate CI.
Without the flag the tool always exits 0 (report-only mode).

**Decorative opt-out.** A document containing the marker comment

```
# decorative
```

anywhere in the file reports `skip` and never fails, including under
`--strict`. The marker is **an assertion the author makes**: this figure
carries no knowledge that must survive the strip test — its geometry *is* the
subject (e.g. `examples/rainbow.fd`, a paint-order rendering demo), so there
are no relationships for the check to protect. Use it only when that is
genuinely true; a figure whose arrangement encodes real structure must express
that structure in syntax instead. It was spelled `# r25: decorative` until 0.1; the prefix was an internal item code, and this was the only place
the project asked an author to type one into their own document. The old
spelling is **not** accepted — `tools/migrate-figdown.js` rewrites it
(MIGRATIONS 0.1).

For each flagged document the tool prints the orphan IDs and one actionable
line: *"meaning may live in geometry — express the relation in syntax (edge,
group, or an ordered construct) instead of pins"*.

Engine lookup order: `$FIGDOWN_HTML`, co-located `figdown.html`,
`../editor/figdown.html`.

## shape-check.js

`shape=` is purely geometric (spec §2.1), so the shape has to be the
whole of what the reader sees: a label that crosses its own outline, or
an edge that stops where its node is not, shows a figure the source did
not describe. `layout-lint.js` cannot see either — it measures overlap
between *boxes*.

```
node tools/shape-check.js [--strict] [--verbose] [<file.fd | dir> ...]
```

Both properties are read off the **rendered SVG** — the drawn outline
(`polygon` / `ellipse` / `rect` attributes) and the drawn label — never
off engine internals, so the tool is an independent witness:

| check | assertion |
|-------|-----------|
| containment | every corner of a node label's text box lies inside the node's own drawn outline (not merely inside its bounding box) |
| endpoints | an edge that meets a node ends **on** that node's drawn outline: not short of it (the arrowhead hides under the fill), not beyond it (the line floats beside the shape) |

The outline model matches the shapes the engine draws:

| shape | outline |
|-------|---------|
| `box`, `rounded`, `cylinder` | `max(abs(dx)/a, abs(dy)/b) = 1` |
| `diamond` | `abs(dx)/a + abs(dy)/b = 1` |
| `ellipse`, `circle` | `(dx/a)^2 + (dy/b)^2 = 1` |

The value of that expression is the **norm**: `<1` inside, `1` on the
outline, `>1` outside; it is scale-homogeneous, so the reported numbers
read as fractions of the centre-to-outline distance. A label passes at
norm `<= 1.0`, an endpoint at `1.00 +/- 0.02`.

Reported but **not** asserted: co-located edges on the same node pair,
which the renderer deliberately fans out sideways (± 7 px per lane) —
their endpoints are offset from the outline by design. They appear in
the `fanned` column. Self-loops draw a small side loop on their own node
(`SELF-EDGE-DRAWING`) and are skipped.

`--verbose` prints the per-node and per-endpoint norms (the numbers to
quote in a review); `--strict` exits 1 on any failure. Deterministic;
engine lookup order is the same as `build-svg.js`.

## Ingesting a Word-document corpus (docx → figures → .fd)

The pipeline proven on real spec corpora:

1. **Extract images** — a `.docx` is a zip; the figures live in
   `word/media/`:

   ```sh
   unzip -o spec.docx 'word/media/*' -d extracted/
   ```

2. **Convert EMF/WMF** — in real corpora the majority of figures are
   Windows metafiles, which neither browsers nor agents can read.
   Convert them first:

   ```sh
   libreoffice --headless --convert-to png extracted/word/media/*.emf --outdir viewable/
   ```

3. **Transcribe** — follow [`read/0.4/transcribe.md`](../read/0.4/transcribe.md):
   semantic reconstruction (not tracing), bit-width verification, no
   fabrication, provenance comments in the `.fd`.

4. **Validate** — `node tools/build-svg.js <file.fd>` until OK; embed
   the SVG in the target `.md` with the `source:` footer; commit the
   `.fd` and `.svg` together.
