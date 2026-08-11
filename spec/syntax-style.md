# FigDown Syntax Style Guide — v0.1

<!-- fence-check: migration-record -->

> Status: **normative for the DESIGN of the language**. Working text,
> 2026-08-06, against engine `editor/figdown.html` @ 0.1.
>
> **Everything §9 scheduled has LANDED**. Every
> correction this document called for is now shipped; §9 records what each
> release did, and §10 records what is still open.
>
> **Audience: whoever proposes or reviews a change to FigDown's grammar.**
> This is not an authoring guide — for that see [guide/authoring.md](../guide/authoring.md),
> and [skill/figdown/SKILL.md](../skill/figdown/SKILL.md) if you are an agent
> ([guide/agents.md](../guide/agents.md) is the orientation page that leads there). Its purpose is to make future
> syntax decisions **derivable from stated rules** instead of re-argued case
> by case.
>
> Relation to [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md): PROCESS §2 is the gate — it decides
> **whether** a construct enters the language. This document decides **what
> it may look like** once it is in. A proposal must clear both.
>
> Machine-readable companion: [vocabulary-sources.tsv](vocabulary-sources.tsv)
> — one row per option key, positional value shape and keyword spelling.
>
>
> **Section numbers §0–§11 are stable.** Cite them; do not renumber.

## 0. How to read this document

Three kinds of statement appear, and they are marked differently:

| Marker | Meaning |
|---|---|
| **RULE** | Normative. A proposal that breaks it is rejected unless it also amends this document. |
| **SCHEDULED** | The language contradicts a RULE today; the correction is ruled and carries a target release (§9). Not an open question. |
| **DECLARED EXCEPTION** | The language contradicts a RULE today and will keep doing so. The reason is stated (§8). |

**"Frozen" and "the freeze", as this document uses them.** *Frozen* names
the **scope of the change-management promise**, not the absence of change:
a frozen construct MAY still change, but only with a
[migrations.md](migrations.md) entry carrying a mechanical rewrite rule, a
**named diagnostic**, and the matching rewrite in
`tools/migrate-figdown.js`. It does **not** mean "stable" — FigDown 0.x
claims stability of nothing. Normative:
[core.md §13.2](core.md#132-frozen-is-not-stable-and-the-difference-is-the-point).
That is also why this document's cost arguments run the way they do: a
correction is cheaper to make before the freeze than after, because after
it the correction owes the whole apparatus above.

**The honesty obligation.** Every RULE below that a shipped construct
contradicts names that construct, and says whether it is SCHEDULED (with
the release) or a DECLARED EXCEPTION (with the reason). A rule with an
undocumented exception is worse than no rule: it teaches a reviewer to
distrust the whole document.

**Evidence.** Every claim about parser behaviour in this document was
verified by running `parse()` from `editor/figdown.html` @ 0.1 on
the stated input. Where the engine, `core.md` and a genre document
disagree, this document records the **engine** and lists the disagreement
in §10. Citations are `file:line`.

## 1. The punctuation scheme

FigDown uses exactly **five** marks with structural meaning. They are
**orthogonal**: no mark does two jobs, and no job is done by two marks.

| Mark | Role |
|---|---|
| `,` | separates the elements of a list — always, everywhere |
| `( )` | groups a composite value (a point / tuple) so it can be **one element** of a list |
| `[ ]` | verbatim text region — the label slot inside an edge operator |
| `" "` | string literal: it delimits AND it enables escapes |
| `;` | RESERVED for a future statement separator (C/C++-like) |

Everything else — `-` `>` `<` `:` `%` `*` `#` `|` `^` `=` `\` `..` `^^`
`||` — belongs to a specific construct's value grammar, not to the
punctuation scheme.

**Four residual marks were missing from that list until this release, and
§1's own sentence is why it matters.** `..` was adopted as the language's
one range separator (`RANGE-SPELLING`) and named nowhere here; `\` has
been the escape introducer inside quoted strings and the two pipe-cell
escapes (`\|`, `\^^`) since long before that; and `^^`/`||` are digraphs,
not repetitions of `^` and `|`, which is exactly the kind of fact a
character-by-character list loses. A mark doing structural work that is not
written down is a mark the next rule forgets — and this section forgot four
of its own.

`[ ]` earned its row. It was always in the language (`EDGE-LABEL-PLACEMENT`/`REVERSE-ARROW-OPERATOR`
edge labels) but was not named as part of the scheme, and the omission had
a consequence: the first cut of the `;` rule said "legal inside a quoted
string or a comment" and would have broken three downstream figures that
write a `;` inside an edge label as ordinary prose. A mark doing
structural work that is not written down is a mark the next rule forgets.

**And the lesson was not carried, which cost `#` two years of the same
bug.** `;` was honoured in all four verbatim regions. `#`
was honoured in three: comment stripping ran before edge dispatch and knew
nothing about brackets, so `edge a -[hop #1]-> b` was `unterminated
[label]` while `edge a -["hop #1"]-> b` parsed. **Two deliberate goldens
encoded opposite answers about one region** — `conformance/cases/253`
pinned the quoted workaround as correct, `254` pinned the bare form as a
failure. `VERBATIM-REGION-SCOPE` makes `#` honour `[ ]` too, by the same `depth`
counter `findReservedSemi` has carried, and `#1`/`#2` is
the natural spelling for hop and sequence numbers in the protocol figures
this language targets. **The general form of the lesson: when a mark earns
a verbatim region, every OTHER mark that region protects must be re-checked
in the same release.**

### 1.1 The three derived rules

**RULE 1.1a — a point is parenthesised.** A point is `(x,y)`; a point with
an optional third component is `(x,y,z)`. This holds wherever a construct
takes a coordinate pair, a bbox fraction pair, or a grid address.

**RULE 1.1b — a list of points is `(x,y),(x,y)`.** Because the comma
separates list elements and the parens group a composite value, the two
never compete: `(200,100),(200,200)` is a list of **two** points and can be
read as such with no construct-specific knowledge.

**RULE 1.1b currently has NO instance in the language, and it stays
written down.** Its only instance was `points=` on `path`, withdrawn (`EDGE-GEOMETRY-CONSTRUCTS`) — and the engine's own note records that `points=` "was
the only value form in the language that needed a point-LIST scanner". The
rule survives the loss of its instance because it is the *derivation* of
1.1a and 1.1c, not a fact about one key: it is what makes the parens
necessary at all, and it is the shape the next variable-length point list
must take. A rule kept against the day it is needed is cheaper than a rule
re-derived under pressure.

**RULE 1.1c — a bare comma pair is a list of two scalars, and nothing
else.** `at=50,145` therefore reads as a two-element list of numbers, not
as a point. This is why it is wrong: the spelling asserts the wrong shape.

The reasoning is recorded in MIGRATIONS 0.1, which parenthesised
the waypoint key `via=` (renamed `points=`): parens separate
the **point** delimiter from the **list** delimiter, and they make a single
point unambiguous (`(90,60)` versus a bare `90,60`, which is
indistinguishable from a two-number list). That derivation is the origin of
all three rules; the key it was derived on was withdrawn
(`EDGE-GEOMETRY-CONSTRUCTS`), so the verification below now cites the surviving instances.
Verified: `pin a at=50,145` is the line error *"pin at= now takes a paren
point"* (figdown.html:1738-1745), and `cell h1,2` is *"cell address is now
a paren point"* (:1284); `at=(50,145)` and `cell (h1,2)` parse.

### 1.2 Where the language breaks RULE 1.1a today

Four constructs wrote a point as a bare comma pair. All four were
corrected; each old form is now a line error naming its
migration entry. Two of the four — the `path` docks — left the language
entirely (`EDGE-GEOMETRY-CONSTRUCTS`), so the table now has **two** live rows, and
the two withdrawn ones are kept struck through because the correction they
record is what the rule was derived from.

| Construct | Before 0.1 | From 0.1 |
|---|---|---|
| `pin … at=` | `at=50,145` | `at=(50,145)` |
| ~~`path src=`~~ | ~~`src=0.5,1` (fraction form)~~ | ~~`src=(0.5,1)`~~ — the key was renamed `tailport=` at 0.1 and **WITHDRAWN with `path` at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)** |
| ~~`path dst=`~~ | ~~`dst=0.5,1`~~ | ~~`dst=(0.5,1)`~~ — renamed `headport=`, **withdrawn at 0.1** |
| `cell` address | `cell h1,2` / `cell 3,4` | `cell (h1,2)` / `cell (3,4)` |

The **single-valued** forms are untouched, and that is the rule rather than
an exception: `threshold offset=50%` and `cell 3 highlight` are not points, so
they stay bare. Parens mark a composite value; they do not mark "a value".

An earlier reading of the corpus suggested a rule that would have kept
these legal — *parens mark canvas-space points, bare pairs mark normalized
value tuples or addresses*. That rule is **rejected**: it is not derivable
from the marks, it must be memorised per construct, and it makes
`at=(x,y)` and `cell r,c` look like different kinds of thing when both are
"a position stated as two components". One shape, one spelling. (The
rejection was originally argued on `via=(x,y)` versus `src=u,v`, both of
which were withdrawn; it is restated on the surviving pair
because the argument was never about those two keys.)

### 1.3 `;` is reserved and is not enforced

**RULE 1.3 — `;` is reserved for a future statement separator and MUST NOT
be given any other meaning.** It was taken back from `via=`
for exactly this reason (migrations.md:1328-1338; core.md:329-331).

**The reservation was not enforced until this release.** Before that,
verified: `node a ;` **parsed**, and `;` became the node's *label*;
`node a;` reported `node needs an id`; `;` alone reported `";" is not
allowed in genre block` (the genre allowlist, not a reservation
diagnostic). The reserved mark was an ordinary character that was
sometimes an error by accident.

**(`SEMICOLON-STATUS`)** a `;` is a line error wherever it is part of the
grammar, with a diagnostic that names the reservation. It stays legal in
all four verbatim regions: inside a quoted string, inside an `[edge
label]`, inside a comment, and inside a GFM pipe row. `core.md`'s
"`;` has no directive-separating meaning" was corrected in the same
release. Evidence for the bracket exemption: the local corpus has 139
lines containing a `;`, every one inside a string or a comment except
three deliberate error fixtures; the downstream corpus has three figures
writing a `;` inside an edge label as prose.

**Recording note — closed.** The `;` reservation had **no R-number**: it
landed as MIGRATIONS 0.1 with no entry in `requirements-notes.md`.
Per PROCESS §1 ("nothing is decided off the record") it now has one:
**`SEMICOLON-STATUS`**. The same gap covered 0.1 (`src=`/`dst=` docks), now
**`ENDPOINT-DOCKING-KEYS`**.

## 2. The quoting rule

**RULE 2 (`QUOTING-RULES`) — the TYPE gates eligibility; the DELIMITER gates
necessity.** Two independent questions, answered separately.

*Eligibility.* Only a position whose grammar is **string** may carry
quotes at all. Ids, enum values, numbers, colours and references never
may — see §2.4.

*Necessity.* Given a string-typed position, whether the quotes are
REQUIRED depends only on what delimits it:

| Delimiter | Positions | Rule |
|---|---|---|
| whitespace | `title`, `node`/`group`/`external`/`plane` labels, `class` meaning, classic `field` name, and the two string-typed option values `description=` and `present=` | quotes **MANDATORY** |
| comma | `labels=` elements, compact `field` names | quotes required only when the element contains whitespace, a comma, a quote, a paren or `#`; redundant quotes stay **legal** |
| `[ ]` | edge tail/mid/head labels | quotes required only to enable escape processing |

All three rows are enforced. The sections below give
each row its reason.

### 2.1 Positional strings MUST be quoted

**RULE 2.1 — every positional argument whose value is a string MUST be
written as a quoted token.** `node a "Cache"`, `title "TCP Header"`,
`class c "meaning"`, `field "Payload" 8`.

*Reason.* Whitespace is **also** the positional separator, so a bare token
cannot express a multi-word string — there is no way for the lexer to know
where the string ends. The failure is not theoretical: verified,
`node a Cache miss` produces

    Line 2: unexpected argument "miss"

which names the wrong thing. The author's error is a missing quote; the
message reports a surplus argument. `PAINT-KEY-NAMING` §5 retired the one directive that
tried to work around this (`title` consumed the rest of its line) and
listed the three defects it bought — a title could never contain `#`, inner
quotes leaked into the value, and `\n` meant two different things depending
on quoting (requirements-notes.md:3142-3158). The lesson generalises:
**an unquoted multi-word positional is not a spelling, it is a hole.**

**LANDED 0.1.** Where a position's grammar is *string* and its
delimiter is whitespace, an unquoted token is a line error whose message
names the quote and prints the corrected line.

**COMPLETED 0.1 (`RULE-POSITION-ENUMERATION`): three positions had been missed, and they
brought back the failure this section says it retired.** The typed-block
openers `bitfield`, `table` and `timing` accepted a BARE label — `bitfield
b Hdr` parsed with the label `Hdr`, `table t Caption` parsed — while `node
a Hdr` was a line error. That is 3 of the language's 15 labelled positions,
and **both genre documents already wrote the form as `<keyword> <id>
["label"]`**, quoted: the documents taught a rule the engine did not
enforce. The multi-word case reproduced the exact diagnostic this section
opens with — `table t My Caption` reported `unexpected argument
"Caption"`, naming a surplus argument when the defect was a missing quote.
All three now use the one shared check and the one shared wording. **The
audit that found them was the first to run this rule against the WHOLE
labelled-position list rather than case by case**, which is why fifteen
releases of case-by-case application had not.

**`description=` and `present=` are in this row too, and that is not an
extension.** They are the language's only string-typed OPTION values, and an
option value is delimited by whitespace exactly as a positional is:
`description=a b` silently kept `a` and turned `b` into a surplus positional
reported on a different part of the line. Same defect, same cure. (The first
was spelled `note=` until this release, `DESCRIPTION-KEY-SPELLING`; the second replaced a bare
positional flag at the same release, `PRESENCE-CONDITION-EXPRESSION`.) **`present=""` is admitted by the
same rule, not excepted from it**: it is an EMPTY QUOTED value, which is a
written value under §12.3's tri-state, and the rule tests quotedness, never
emptiness.

### 2.2 List elements MAY be bare

**RULE 2.2 — an element of a comma-delimited list MAY be written bare when
it matches the identifier pattern `[A-Za-z_][A-Za-z0-9_-]*`. Quotes are
REQUIRED when the element contains whitespace, a comma, a quote, a paren
or `#`.**

*Reason.* The comma already bounds the element, so there is no conflict
with the separator. The whitespace conflict returns only when the element
itself contains whitespace, and that is exactly where the quote is
required. `field "Long Name":16` is the shipped instance of this reasoning
(bitfield.md:107-111).

**Quoting is per element, and mixing is fine.** A three-element list is

    labels="a b c",d,ef1

and `labels="a,b,c"` is ONE element whose text is `a,b,c`.

**Before this release the parser did not do this.** Verified then, on a lane
with two `=` cells: `labels="a,b"` reported *"labels= has 2 labels,
expected 1"* — the quotes were stripped by the tokenizer's inline-quote
path **before** the value was split on commas, so a quoted element could
not protect a comma. The same held for `class=` and `rank`. The
consequence was that **no `labels=` label and no `class` id could contain
a comma — the language had no spelling for it at all.**

**LANDED 0.1 (`LINK-OPERATOR-IN-IDS`/`QUOTING-RULES`).** Quotedness now travels with the value:
each token carries a mark string index-aligned with its characters, and
every comma split consults it. `labels="a,b"` is ONE label.

**Still open, deliberately.** Whether a `labels=` element *should* be
allowed to contain a comma is NOT ruled: 202 elements observed, 0 needing
one, and the construct is experimental. 0.1 made it expressible;
it did not make it recommended. See §10.

### 2.3 Redundant quotes are legal

**RULE 2.3 — quoting a list element that did not need quoting is LEGAL,
never an error — in list positions whose ELEMENT GRAMMAR IS `string`.**
That is `labels=` elements, compact `field` names and table `width`
values. `labels="a b","c"` and `labels="a b",c` are the same value. This
is deliberate: a generating agent that quotes uniformly must not be
punished for it, and a validator that rejects redundant quotes would make
the write→validate→fix loop oscillate.

**AMENDED (`RULE-POSITION-ENUMERATION`): table `width` values leave this rule, and
the reason is that they were never string-typed.** A table `width`
element's grammar is `auto | <number> | <number>%`
(`vocabulary-sources.tsv`, `width.values`), which is not `string` — so
2.3's own scope clause, "list positions whose ELEMENT GRAMMAR IS
`string`", never covered them, while 2.3's prose named them anyway. That
contradiction is what made 2.3 and 2.4 disagree at one position, which the
first whole-vocabulary audit of RULE 2.4 found. The rule's remaining
instances are `labels=` elements and compact `field` names. Quoting stays
LEGAL and INERT on table `width` values — under **RULE 2.3b** below, which
is where they belong.

**RULE 2.3b (`RULE-POSITION-ENUMERATION`) — where a position's value comes from an OPEN VALUE
SPACE, redundant quotes are INERT and LEGAL.** That is a number, a point, a
percentage, a range: `gap=`, `z-index=`, `word=`, `pin at=`,
`pin width=`/`height=`, a `cell` address, a `field` width, a table `width`
element, and `index=`. `gap="4"` and `gap=4` produce the same model, and
`cell "(1,1)"` addresses the same cell as `cell (1,1)`.

*Reason, and it is 2.3's own.* A generating agent that quotes uniformly
must not be punished for it, and a validator that rejects redundant quotes
makes the write→validate→fix loop oscillate. `index=`'s inertness is the
load-bearing case: it is normative in core §12.7 because core §9 `INDEX-RANGE-STEP`'s
extension rests on it.

*Where the line falls, so a future position can be classified without
asking.* **A closed set of spellings is written bare (RULE 2.4); an open
value space tolerates redundant quotes (this rule).** An id is closed by
declaration; an enum and a bare keyword flag are closed by this standard.
A number, a point, a percentage and a range are not — there is no namespace
for an author to be misled about, and the model is identical either way.
Two word-shaped spellings sit inside otherwise-numeric grammars and are
inert with them: table `width auto` and `field … *` — a **DECLARED
EXCEPTION**, §8.6.

**The scope clause was added, and the collision it resolves
is recorded here rather than left to be found after the freeze.** As
originally written, RULE 2.3 blessed `class="c1","c2"` while RULE 2.4
forbade `node "c1"` — the SAME namespace, opposite rulings, in adjacent
sections. The resolution: 2.3 is about redundant quoting where quoting is
*eligible at all*, and eligibility is 2.4's question, not 2.3's. A list
whose element grammar is `id` (`class=`, `rank`, `bundle` members) is
governed by 2.4 and takes no quotes; `class="c1","c2"` is now a line
error carrying the id rule. Rule 2.3 never had authority over an id
position; it merely failed to say so.

**`index=`'s value joined this rule (`BITFIELD-REPETITION-CONSTRUCT`), and the reason is
normative rather than convenient.** `index=0..7` and `index="0..7"` are the
same value: quotes on this key are **INERT**, and a run's DETERMINACY is
decided by parsing both ends as integers — never by whether the value carried
quotes. That is stated in core §12.7 and in the `bitfield` genre document, not
left as a property of the parser, because a later extension rests on it:
`index="0..7 step 2"` (core §9 **`INDEX-RANGE-STEP`**) needs quoting to be free of
meaning on this key. Making quotes semantic here would silently price that
extension.

### 2.4 Ids and enum values are bare, never quoted

**RULE 2.4 — where the grammar expects an id, an enum value or a bare
keyword flag, the token MUST be bare. A quoted token in any of those
positions is a line error.**

**ENFORCED IN FULL (`RULE-POSITION-ENUMERATION`). Until then this rule held at 14
of 14 id positions and 0 of 9 enum positions**, and a rule enforced at half
its positions is worse than no rule: it teaches a reviewer to trust a
statement the engine does not keep. All of the following parsed, verified:
`shape="box"`, `style="dashed"`, `flow "right"`, `figdown "0.1" block`,
`figdown 0.1 "block"`, `numbering="msb0"`, `cell 1 "highlight"`,
`extend="up"`, `type="bar3d"`. All nine are line errors now, through one
wording:

> `this position takes a BARE value: write <the bare spelling> — quoting a value drawn from a closed set suggests the position accepts arbitrary text, when it accepts only the listed spellings (SYNTAX-STYLE RULE 2.4)`

**"Bare keyword flag" was added to the rule text in the same release**, for
`cell <row> highlight` — the language's one surviving positional flag. It
is not an enum (`vocabulary-sources.tsv` types it `flag`), but the argument
is identical: it is a closed set of spellings, of size one.

**Two things the audit found and this rule does NOT claim.** Redundant
quotes at NUMBER-, POINT-, PERCENTAGE- and RANGE-typed positions stay legal
and inert — RULE 2.3b above, where `index=` is load-bearing. And the enum
check is reported BEFORE the value check, suppressing it for that token:
**one token, one error.** A quoted token has not been established to be in
the position at all, so reporting what its CONTENT would have meant is
premature — `shape="bkx"` says the spelling is wrong, once, rather than the
spelling and `unknown shape` on one line. This is the convention the id half
has followed: a quoted id gets the ID RULE and nothing
else. The `figdown` header was the one enum site that reported both, and
0.1 made it follow the same convention as the other three.

*Reason for the enum half.* An enum value is a WORD drawn from a set this
standard closes. Quoting it invites exactly the belief quoting an id
invites — that arbitrary text is admissible there (`PRIOR-ART-BORROWING`: two spellings of
one meaning feed hallucination). The id half's own argument, generalised.

*Reason.* An id is not text; it is a reference into a namespace. Accepting
`"a"` and `a` as the same reference gives the language two spellings of one
thing (`PRIOR-ART-BORROWING`: two spellings of one meaning feed hallucination) and invites an
author to believe that quoting makes an arbitrary string into an id.

**Before this release the parser did not enforce this.** Verified then:
`node "a" "Label"`, `class "c" "m"`, `group "g"` and `pin "a" at=1,2` all
parsed — quotedness was discarded before `ID_RE` was applied. Ten of the
twelve id positions accepted a quoted id silently; the remaining two
rejected it **with the wrong diagnosis**: `edge "a" -> b` said *"edge
needs `<id>` ->|<-|--|<-> `<id>`"* with the operator plainly present, and
`rank "a",b` said *"do not mix the comma form with the space form"* with
nothing mixed. The misdiagnosis was as much of the defect as the silent
acceptance.

**LANDED 0.1 (`QUOTED-IDS`), at every id position and with ONE wording:**

> `ids are bare and match [A-Za-z_][A-Za-z0-9_-]* — text with spaces or punctuation belongs in the label: node <id> "your text"`

It covers declarations (`node` `group` `boundary` `class` `layer` `bundle`
`bitfield` `table` `timing` `plot`), targets (`pin` `size`), endpoints
(`edge` `path`) and the id-valued list elements and option values (`in=`
`class=` `layer=`, `rank` members, `bundle` members) — spellings as of that
release: `boundary`, `layer`, `plot` and `size` have since been retired,
`size`'s id position went with it, and `path`'s two endpoint
id positions went with the whole directive (`EDGE-GEOMETRY-CONSTRUCTS`), leaving
`edge` as the only endpoint pair. One wording rather
than three because the author's next move is the same for `node "a"`
(pointless quoting), `node "Router 1"` and `node 交換器`: leave the id
bare, put the text in the label. Migration cost: **zero** — 0 quoted ids
in 4255 declarations and 4561 historical id spellings. Both wrong
diagnoses were fixed in the same release.

## 3. Lists and terminators

### 3.1 A variable-length positional list must terminate

**RULE 3.1 (`POSITIONAL-LIST-SPELLING`) — every variable-length positional list is ONE
comma-delimited token, which terminates at the first whitespace. The rest
of the line is RESERVED for future `key=` options.**

`POSITIONAL-LIST-SPELLING`'s generalized form: *every positional list must have a terminator, and
the cheapest time to give it one is while the terminating spelling is still
unreachable* (requirements-notes.md:3428-3430). A directive whose arity is
"the rest of the line" can never grow a trailing positional, and its
grammar cannot be written down honestly.

The four lists: `rank a,b,c`; table `width auto,90,25%`; `bundle t1 "LAG"
a--b,c--d`; `field a:1,b:2`.

### 3.2 One whitespace policy for every comma list

**RULE 3.2 — a comma-delimited list has ONE whitespace policy, and it is
the same policy in every construct in the language.**

Before this release there were **five**, all verified:

| Construct | `a, b` (space after comma) | `a ,b` |
|---|---|---|
| `rank` | **error** — *"the comma form takes one token"* | error |
| table `width` | **error** — same message | error |
| `field` compact | **accepted** | **error** — *"looks like two fields"* |
| `bundle` members | **accepted** | accepted |
| `class=` / `labels=` (inside an option value) | **error** — *`bad class id " c2"`*, no trimming | error |

There is no principle that produces five answers.

**LANDED 0.1 (`COMMA-LIST-WHITESPACE`). The policy is: a comma-delimited list is ONE
whitespace-free token.** `rank a, b`, `field a:1, b:2` and
`bundle t1 a--b, c--d` are all errors; `class=" c2"` stays one.

**Why this policy and not trimming, which is what an earlier draft of this
section recommended.** Trimming — *whitespace around a comma is
insignificant* — is the GFM/CSS/JSON convention and is what a generating
agent produces by default, which is exactly why it was recommended first.
It is nonetheless **incompatible with RULE 3.1 (`POSITIONAL-LIST-SPELLING`)**: a variable-length
positional list must TERMINATE so that the rest of the line can be
reserved for future `key=` options, and whitespace is the only terminator
available. Trimming deletes the terminator, and with it the guarantee that
any of these four directives can ever grow an option. The chosen policy is
also the smaller change: four of the five constructs (`rank`, `width`,
`class=`/`labels=`, `via=`) already implemented it.

**Nothing became inexpressible.** Whitespace inside an ELEMENT is written
by quoting the element (`labels="a b",c`); quoting suspends the whitespace
rule, which is what a string literal is for. The policy removes a spelling
for whitespace AROUND a comma — which nothing in either corpus needs — and
removes whitespace from no value.

### 3.3 Two spellings of one list is not a design

See §5. The space forms of `rank`, table `width` and `bundle` members were
**retired** (`POSITIONAL-LIST-SPELLING`).

## 4. Naming

### 4.1 Single-source vocabulary

**RULE 4.1 — a genre's (or a construct family's) vocabulary is borrowed
WHOLE from ONE authoritative standard. ISO and IEEE standards are preferred
where one covers the domain; otherwise the adoption-weighted mainstream
leader (`PRIOR-ART-BORROWING`). Mixing sources is a LAST RESORT and MUST be justified in the
proposal's report.**

Upstream: `PRIOR-ART-BORROWING` (follow the mainstream, weighted by adoption —
requirements-notes.md:631-651), `DESIGN-DECISION-METHOD` §1 (survey before invent — `:414-418`),
`GENRE-DOCUMENT-CONTRACT` §6(b) (a genre name follows the source of the borrowed symbols),
`DOMAIN-VOCABULARY-PREFERENCE` §3(d) ("the vocabulary must be borrowed from the domain's standard
terminology where one exists" — `:1995-1996`), `SIZE-AND-DIRECTION-KEY-NAMING` (borrow whole or not at
all — `:3432-3448`).

**What justifying a mix looks like — the `table` genre (`TABLE-ROW-SYNTAX`).** This is the
worked example; a proposal that mixes sources must produce an argument of
this shape.

1. **Name the primary source and show it was taken whole.** Content rows
   are **verbatim GFM pipe syntax** — `| a | b |`, the required `|---|`
   **delimiter row** (GFM's own term, adopted), colon alignment, and GFM's own default alignments
   (table.md:15, :28-29, :80, :88, :137). Nothing was adapted; an existing
   Markdown table pastes in unchanged.
2. **Show the primary source cannot express the need.** `TABLE-ROW-SYNTAX`:
   *"Since core GFM has no spans…"* (requirements-notes.md:4475). This is
   the load-bearing sentence. Inconvenience would not have sufficed —
   PROCESS §2.1 requires semantic impossibility.
3. **Choose the second source by the same rule that chose the first.**
   Merging follows **markdown-it-multimd-table**, *"the most-adopted MD
   span extension"* (`:4476`) — `PRIOR-ART-BORROWING` applied a second time, not a taste
   call. `PRIOR-ART-BORROWING`'s own audit item (`our ^ vs ^^`, `:654-657`) is what forced
   the check; FigDown's provisional `^` lost the usage count to multimd's
   `^^` and was retired.
4. **Show the two vocabularies do not collide.** `||` and `^^` are inert in
   GFM — a GFM renderer draws them as empty and literal cells — so a
   FigDown table is still a valid GFM table and the mix costs the reader
   nothing (`UNSAFE-DEFAULT-ELIMINATION`'s test).
5. **Draw the line and stop.** *"FigDown abilities beyond GFM stay as
   keyword lines (`cell r,c …`, `cell r highlight`)"* (`:4477-4478`).
   Everything past the borrowed sources is FigDown's own vocabulary in
   FigDown's own line grammar — not a third dialect. The genre does take a
   sliver from a **third** source, and it shows what a legitimate sliver
   looks like: `<br>` for an in-cell line break is HTML, admitted because it
   is *"the HTML break used in GFM tables in practice"* (table.md:101-102)
   and confined by an explicit boundary — *"a deliberate partial alignment
   with GFM …, not a full HTML-in-cell renderer"*, with every other tag
   staying literal text (table.md:110-115). A borrow this narrow must state
   its boundary in the same sentence that opens it.
6. **Record what was rejected and why.** Whitespace-as-alignment was
   proposed and refused on two grounds — no open standard does it, and
   invisible characters carrying semantics is a known failure mode
   (`:4482-4492`).

**Recorded — the layout family is single-sourced, and that
is what decided `ELEMENT-GEOMETRY-DIRECTIVE`'s spelling.** Its borrowed spellings were **DOT×3** —
`layout`, `pin`, and the `size` `ELEMENT-GEOMETRY-DIRECTIVE` retired — against **SVG×1**, `path`;
the coinages in the zone were `routing` and the option key `at=`. So
when `size`'s keys had to land somewhere, the family's own source answered
it: DOT holds a node in place with `pin` and gives it extent with
`width`/`height`, so folding the extent keys onto `pin` keeps the whole
family on one source instead of opening a second one for a single word.
`geometry` was the alternative and it lost on attestation: it has **zero
rows** in `vocabulary-sources.tsv` and no keyword-level attestation in any
line-oriented diagram language — mxGraph's `as="geometry"` is a *field
role* in an XML serialization, from a format with no statement keywords at
all, so it cannot supply a keyword spelling under this rule. The full
argument, including what would reopen it, is in
decisions/registry.md `ELEMENT-GEOMETRY-DIRECTIVE`.

**Recount (`EDGE-GEOMETRY-CONSTRUCTS`) — the zone's KEYWORDS are now
single-sourced without qualification.** The withdrawal removed the only
non-DOT keyword in the zone and the only coined keyword in it at the same
time: `path` was the **SVG×1**, and `routing` was one of the two coinages.
The keyword tally is therefore **DOT×3** (`layout`, `pin`, and the retired
`size`) against **SVG×0** and **FigDown×0** — every keyword a reader can
write in the layout zone comes from one source. The zone's remaining
coinage is the option key `at=`, and it is now the only one. `ELEMENT-GEOMETRY-DIRECTIVE`'s
argument is not weakened by this; it is now literally true rather than
true-with-an-exception, because there is no second keyword source left to
point at. Recorded because the earlier figure ("SVG×1, `path`") is on the
record and a reader who found it would otherwise count a source the zone no
longer has. Derivation, from the layout-namespace rows of
`vocabulary-sources.tsv`, counting live rows only (the ten `EDGE-GEOMETRY-CONSTRUCTS` rows are
present but retired, so they are not counted here): keywords `layout`,
`pin`, and the retired `size`, all three `source = DOT`; option keys `at`
(`FigDown`) and `width`/`height` (`SVG` — re-filed into this namespace from
core, not borrowed for it, which is why the keyword tally and
the option-key tally were always counted apart).

**Two of the sources this project actually borrows from are missing from
the genre docs.** `->`/`--`'s DOT lineage and the `||`/`^^` mixing
justification exist only in `design/`, which is not normative. If
`vocabulary-sources.tsv` must be derivable from normative documents alone,
those rows have no normative citation today. See §10.

### 4.2 Never abbreviate for brevity alone

**RULE 4.2 (`SIZE-AND-DIRECTION-KEY-NAMING`) — an option key takes the primary source's spelling in
full. An abbreviation is legal only when the abbreviation IS the standard's
own spelling.**

- Retired for breaking it: `w=`/`h=` → `width=`/`height=` — *"SVG, CSS,
  Graphviz DOT, mxGraph and D2 all spell the size attributes `width` and
  `height`; **no** mainstream diagram or graphics language abbreviates
  them"* (requirements-notes.md:3435-3438). `colw` → `width`
  was the same call.
- Permitted under the exception at the time, and **no longer a live
  instance**: `src=`/`dst=` — the stock IETF/engineering
  couplet, adopted precisely *because* the abbreviation was taken to be the
  standard's own spelling. Both were retired (`ENDPOINT-DOCKING-KEYS`) when the
  attribution was re-derived and found false — `vocabulary-sources.tsv`
  records the negative — and their replacements `tailport=`/`headport=` were
  withdrawn with `path` (`EDGE-GEOMETRY-CONSTRUCTS`). Kept here because it is the
  worked example of what the exception permits and of how an attribution gets
  checked (migrations.md:1358-1359;
  layout-properties-prior-art.md:236, :243-250, which also records the
  fallback: *"If the product prefers full words … ship `source=`/`target=`
  instead … Do not mix"*).

The normative sentence this rule restates: *"one lowercase word, borrowed
standard terminology, scope-precise, mutually disambiguating — no invented
abbreviations"* (core.md:1168-1170).

**Corollary — frequency buys brevity, but only within one source.** `SPELLING-LENGTH-VS-FREQUENCY`'s
gradient (requirements-notes.md:941-957) says the common case spells short.
It licenses *choosing* the shorter of two spellings the standard itself
offers; it never licenses inventing one.

### 4.3 A name that collides is a defect

**RULE 4.3 (`UNSAFE-DEFAULT-ELIMINATION`) — reuse across namespaces is permitted, but it MUST NOT
cost the reader. One key means one thing and carries one value shape.**

Three sub-rules, each with shipped evidence:

- **A live spelling may not sit in two namespaces.** `line`, `fill` and
  `route` were renamed for exactly this
  (requirements-notes.md:2124-2160). A **retired** spelling MAY be reused
  in the other namespace; a live one may not (`PAINT-KEY-NAMING` §3, `:3119-3123`).
- **A spelling that inverts the reader's prior is worse than one that is
  merely opaque** (`PAINT-KEY-NAMING` §1, `:3083-3095`). `color=` set the fill while CSS
  spells the fill `fill`; the result was a legal, wrong figure with nothing
  to warn on.
- **One key, one value shape.** `at=` carried a point on `pin` and a
  percentage on `threshold` — two grammars behind one spelling, and no reader
  can predict which applies without knowing the directive. **LANDED
  0.1**: `guide at=` → `guide offset=`, borrowed from SVG's
  `<stop offset>`, the standard's own name for "a position along an
  extent, as a percentage". `pin at=` keeps the name; the marker (renamed
  `threshold`, `THRESHOLD-KEYWORD-SPELLING`) is the
  demoted construct and the cheaper one to move (20 local uses, 0
  downstream).

### 4.4 One spelling, one value grammar

**RULE 4.4 — where two constructs deliberately share a spelling because
they denote the same concept, they MUST share the value grammar too.**

The `table` child keyword `width` and the `width=` option on `pin` share a
spelling on purpose (`SIZE-AND-DIRECTION-KEY-NAMING`; core.md:1173-1178) — both are a horizontal
extent. (The option was carried by `size` until this release, when `ELEMENT-GEOMETRY-DIRECTIVE`
merged that keyword into `pin`; the key, its grammar and this rule are
unchanged by the move, only the directive that carries it.) But verified,
they do not share a grammar:

| Input | table `width` keyword | `pin … width=` option |
|---|---|---|
| `90` | accepted (px) | accepted (px) |
| `90px` | **accepted** | **error** — *"width must be a positive number (px)"* |
| `25%` | **accepted** | **error** — *"percentage sizes are not in v0.1"* |
| `auto` | accepted | error |

Sharing the word while differing on the units is the defect `SIZE-AND-DIRECTION-KEY-NAMING` set out to
remove, one layer down.

**LANDED.** 0.1 rejected the `px` SUFFIX in table `width`, which
was the one true grammar divergence: both now take a bare number in px,
`<n>%`, or `auto`, and neither takes a unit suffix. 0.1 gave the
two remaining rows named diagnostics instead of the generic number
message. `%` and `auto` on the option are a **v0.1 SCOPE limit, not a
second grammar** — a node has no containing extent for a percentage to
resolve against, and `auto` is what an unwritten `width=` already means, so
registering it would add a second spelling for "omit the key" (`PRIOR-ART-BORROWING`).
Recorded as a DECLARED EXCEPTION in §8.5.

A second instance, also closed: `band` accepted its range with the `%`
**optional** (`band 15 in=a` parsed) while the marker required it. Same
concept, same document, two grammars. **LANDED 0.1**: `%` is
mandatory on `band`.

### 4.5 Reserved spellings

**RULE 4.5 (`LANE-ALPHABET-KEY-RESERVATION`) — when a construct's value space is a closed alphabet,
that alphabet reserves the corresponding spellings in every namespace the
lexer consults before it.**

Concretely and permanently: **single-letter option keys drawn from the timing
lane alphabet `[01pnx=.]` — that is `p`, `n` and `x` — MUST NEVER be
registered in the option-key namespace, in any genre, present or future.**

Registering one produces no error anywhere: every existing lane containing
that letter before an `=` silently reparses as an option and the figure
changes (requirements-notes.md:3343-3380). The constraint is unexpressible
in the language, so `conformance/run.js` refuses to run while such a key is
registered. `GENRE-VOCABULARY-OBLIGATION` does not waive it — a genre may redefine a spelling's
meaning, but it cannot re-lex another genre's lanes.

**Generalisation for reviewers:** before registering any option key, check
it against every closed alphabet in the language, not only the timing lane.

### 4.5b A GENRE is named after the figure kind (`GENRE-DOCUMENT-CONTRACT` §6(e))

**RULE 4.5b (`GENRE-DOCUMENT-CONTRACT` §6(e), added 0.1) — a genre is named after the
established name of the FIGURE KIND in the community whose drawing
conventions it borrows; not after the thing depicted, and not after any
construct inside it.** The name SHOULD let a reader who has not read the
genre's spec predict what kind of figure the section draws, and any
granularity or discreteness the genre's constructs assume MUST be carried by
the name if the syntax does not otherwise state it. Corollary to `GENRE-DOCUMENT-CONTRACT` §6(a):
one lowercase token, spelled as the source spells it — FigDown never closes
up, hyphenates or compounds on its own initiative.

The normative statement lives in `GENRE-DOCUMENT-CONTRACT` §6 (requirements-notes.md); it is
mirrored here because the naming rules of §4 are where a reviewer looks.
Worked cases: `wave` violated it (WaveJSON's `wave` is a PROPERTY of a
`signal`, so the genre was named after a construct inside itself) and became
`timing` (`TIMING-GENRE-NAMING`); `bitfield` satisfies it and its bit
granularity is carried by the name, which is what disqualified `structure`
and `packet` (`BITFIELD-GENRE-NAMING`); `topology` does not cleanly fit — it names the SUBJECT
rather than the figure kind — and is recorded rather than changed. A genre's
name is independent of its keywords: three of the six have no same-named
opener, so keyword-echo is evidence of nothing.

### 4.6 The reserved and extension namespaces

`page`, `set`, `pulse` are reserved for the dynamic profile and produce a
named diagnostic (figdown.html:939). Keywords and option keys beginning
`x-` are reserved for a future extension mechanism and MUST NOT be used by
standard vocabulary (core.md:1464-1466). `step` was reserved until this release and **released**: a word reserved against nothing costs authors
a name for nothing (core.md:1137-1140). Reviewers should apply that test to
every reservation they propose.

### 4.7 A spelling spent in one namespace is spent everywhere

**RULE 4.7 (maintainer) — absent necessity, do not spend the
same spelling in more than one namespace. Where two candidate spellings
are otherwise equal, prefer the one that does not have to be reserved
across namespaces.**

This is a **naming** rule, not a namespace mechanic. RULE 4.3 is the
enforcement side of the same idea — it forbids a *live* spelling from
sitting in two namespaces at once, after the fact. RULE 4.7 applies one
step earlier, at the moment of choosing: the spelling that costs nothing
to reserve is the better spelling, all else equal, because reuse forces
spec and definition adjustments later and consumes flexibility the
language has not yet needed.

The rule is a tie-breaker and nothing more. **Necessity beats it**, and
necessity is what RULE 4.1 measures: a single-sourced, attested spelling
is not to be passed over for an unattested one merely because the attested
one has to be reserved. Where the two rules point the same way, the choice
is free; where they conflict, 4.1 wins and 4.7 becomes an OPEN QUESTION
filed against the choice, not a veto of it.

**The instance that produced the rule (`LAYOUT-ZONE-NAMESPACE`).** Making the
layout zone genre-independent (`LAYOUT-ZONE-NAMESPACE`, core §1) reserved `pin`, `path` and
`routing` **language-wide**: no genre may ever define any of them as its
own keyword. That is a real price paid for `GENRE-NAMESPACE`'s clean premise, and two
of the three are ordinary general-purpose words. FigDown is a
general-purpose figures-as-text standard aiming to cover ALL figures, so
`path` is a word that filesystem trees, state machines, flow diagrams,
geographic figures and call graphs could each reasonably want — the
reservation is not narrow, and neither is what it costs. Both were
EXPERIMENTAL, so renaming was still free and the exposure was filed as
**core §9 `EDGE-GEOMETRY-CONSTRUCTS`** rather than acted on. Had this rule existed when those
two were named, it would have argued for a spelling with nothing else
contending for it.

**The exposure was discharged, and the reasoning above is
kept because it is the record of what was foreseen.** `EDGE-GEOMETRY-CONSTRUCTS` withdrew `path`
and `routing` from the language, so **both spellings are released**: `LAYOUT-ZONE-NAMESPACE`'s
reservation now binds `pin` alone, and a future genre may take `path` or
`routing` as its own keyword — subject to the `NEW-CONSTRUCT-EVIDENCE-GATE` gate like any new word,
and to this rule, which would still argue against `path` for exactly the
reason stated above. `LAYOUT-ZONE-NAMESPACE` itself is untouched and stays frozen in core §1;
what changed is its membership, not the clause. The two spellings did not
leave because of the reservation — they left on prior-art and demand
evidence (core §9 **`EDGE-IDENTITY-AND-GEOMETRY`**, `decisions/registry.md`) — but
the reservation was one of the costs that made keeping them expensive, and
that is worth recording in a rule whose whole subject is what a spelling
costs to reserve. **`EDGE-GEOMETRY-CONSTRUCTS` is closed as discharged; `EDGE-IDENTITY-AND-GEOMETRY` is what stands
in its place.**

**The second instance, and the first time the rule LOST (`BITFIELD-REPETITION-CONSTRUCT`).**
`index=` was registered as `bitfield`'s repetition range while core §9
**`ROW-INDEX-GUTTER`** had been naming `index=` as the spelling for a future per-row
gutter since it was filed. RULE 4.7 argued against spending the word twice;
RULE 4.1 argued for it, because `index` is single-sourced and verified in the
IEEE 1685-2022 schemas while no candidate for the gutter had been measured at
all. **4.1 won, and the clause above cashed out exactly as written**: the loss
converts to an open question filed against the choice, **core §9 `INDEX-KEY-NAMESPACE-CONTENTION`**, not
to a veto of it. Two things are worth carrying from this instance. First, the
rule did its job by being LOSABLE — an unrecorded tie-break is a trap, and the
filing is the record. Second, the price turned out smaller than it looked once
the gutter's own evidence was read: `ANNOTATION-FAMILY-SEQUENCING`'s gutter evidence is **100%
addresses**, and `address` is registered nowhere — **zero rows** in
[`vocabulary-sources.tsv`](vocabulary-sources.tsv) as a spelling; its one
word-match, `cell.address`, is a positional slot id — so the spelling 4.7 was
protecting may not have been the right one for that construct anyway. That is
recorded in `ROW-INDEX-GUTTER`, not ruled.

### 4.8 One range grammar: `..`

**RULE 4.8 (`RANGE-SPELLING`) — FigDown has ONE range grammar, and it is
`<first>..<last>`, inclusive at both ends. No construct may introduce a
second separator.**

The rule is the RULE 4.4 idea applied one level up: 4.4 says one spelling may
not carry two value grammars; 4.8 says one CONCEPT — a range — may not have
two spellings across the language. Two spellings of one meaning give a
generating model two attractors and no signal about which is intended (`PRIOR-ART-BORROWING`),
and a reader has to learn both.

*Source.* `..` is single-sourced from ISO: **Ada** (ISO/IEC 8652) writes
`1 .. 10` and **Pascal** (ISO 7185) writes `array [1..10]`, both **inclusive**
at both ends, and **X.680**'s `SIZE(1..4)` is already cited by the `bitfield`
genre document. Nothing was coined.

*Instances.* `index=0..7` on a `bitfield` `field` (`BITFIELD-REPETITION-CONSTRUCT`, NORMATIVE) and
`band "Headroom" 15..35%` (`RANGE-SPELLING`, EXPERIMENTAL).

**The two rejected separators, with their reasons, so neither is proposed
again:**

- **the hyphen** — `band "Headroom" 15-35%` was the spelling until this release, and between two numbers it **reads as subtraction**: `10-20%`
  is a legal arithmetic expression whose value is not the interval it means.
  It was the second range spelling in the language, and retiring it is what
  lets §8 carry **no declared exception for two coexisting range grammars**.
  `band` is EXPERIMENTAL, so nothing was promised — a named diagnostic was
  owed anyway and is what it got (10 lines across 9 files; the migration tool
  rewrites them mechanically).
- **`~`** — rejected on three grounds. In English it means *approximately*,
  which is the worst available connotation in a figure about exact positions.
  In C, C++, Java and JavaScript it is **bitwise NOT**, which is the worst
  available collision in a genre about bits. And it is a range separator in
  **no programming language and no standard** — only a CJK typographic
  convention, which is a fact about typesetting, not grammar attestation.

## 5. Two forms of one construct

**RULE 5 — two forms of one construct are justified ONLY when each accepts
input the other cannot express. If both forms have the same accepted-input
set, one is a spelling variant and MUST be retired.**

*Reason.* `PRIOR-ART-BORROWING`'s primary rationale is hallucination resistance: two
spellings of one meaning give a generating model two attractors and no
signal about which is intended. `NEW-CONSTRUCT-EVIDENCE-GATE`/PROCESS §2.1 add that "more convenient"
never clears the gate. A form that adds no input adds only ambiguity.

**The test is the ACCEPTED-INPUT SET, not the model.** Two forms that
normalize to the same model object are still justified if their input sets
differ. The instance this was written on — `path src=ne` versus
`path src=0.62,1`, a compass token and a fraction pair resolving to the
same model value — was **withdrawn (`EDGE-GEOMETRY-CONSTRUCTS`)** with the whole
`path` directive, so the language currently has **no** live two-form pair
of this kind. The principle is unchanged and is what §5.1 and §5.2 below
apply: the model is one concept, and a surface MAY offer a named subset
plus an escape hatch when the escape hatch reaches inputs the subset
cannot spell.

### 5.1 Forms that STAY

| Pair | What each accepts that the other cannot |
|---|---|
| `field` **classic** `field "Payload" 64` vs **compact** `field a:1,b:2` | Classic only: a field **wider than `word`** (verified: `field "Payload" 64` under `word=32` parses and spans rows as ONE field; `field P:64` is *"is wider than word=32"*); **per-field** options. Compact only: several fields on one line with line-wide options. Also classic-only: a name containing a comma (bitfield.md:110-111). The classic name is QUOTED — mandatory since 0.1 (`QUOTING-RULES`), because whitespace also separates the positionals — and the compact name is bare unless it contains whitespace, which is the exact inverse and is why the two forms are told apart at all. Presence is `present=` in both forms (the bare `optional`/`conditional` flag was retired at 0.1, `PRESENCE-CONDITION-EXPRESSION`). |
| ~~`path src=` **compass** `n\|e\|s\|w\|ne\|se\|sw\|nw` vs **fraction** `u,v`~~ | ~~Compass only: a named, readable, snap-to-edge subset a human writes by hand. Fraction only: the continuous domain — `0.62,1` has no compass spelling. A named subset plus an escape hatch for the continuous domain.~~ **The pair STAYED under this rule and then left the language with its host: `src=`/`dst=` were renamed `tailport=`/`headport=` at 0.1 (`ENDPOINT-DOCKING-KEYS`) and WITHDRAWN with `path` at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`).** The row is struck through rather than deleted because the verdict was correct and is the worked example of "a named subset plus an escape hatch" — the reason the construct went was the *realisation* of the dock (a fraction on the EDGE has prior art in one surveyed system only) and not the two-form question this rule asks. |
| `edge a -> b` vs `edge b <- a` | Statement order is itself meaning — which side the author is talking about (`REVERSE-ARROW-OPERATOR`, requirements-notes.md:1061-1067). `READ-SIDE-DETERMINISM` made the written form the model and forbade normalization (`:2049-2055`), so the two are not interchangeable at the model layer either. |

### 5.2 Forms that GO — **RETIRED (`POSITIONAL-LIST-SPELLING`)**

| Pair | Verdict |
|---|---|
| `rank a,b,c` vs `rank a b c` | Same accepted-input set. Spelling variant. |
| `width auto,90` vs `width auto 90` | Same accepted-input set. Spelling variant. |
| `bundle t1 a--b,c--d` vs `bundle t1 a--b c--d` | Same accepted-input set. Spelling variant, and the pair is worse than the other two: the space form is *undetectably* mixed with the comma form, so `bundle` cannot even report a half-converted line (figdown.html:1105-1108). |

**This reverses `POSITIONAL-LIST-SPELLING`'s disposition, and the reversal is deliberate.** `POSITIONAL-LIST-SPELLING`
ruled the space forms *"NOT deprecated and must not error"*, on a measured
migration cost of 360 downstream lines and 25 local ones
(requirements-notes.md:3399-3408). That is a **cost** argument, and under
the project's freeze rule a workload objection does not decide a language
question — evidence and risk objections do. `POSITIONAL-LIST-SPELLING`'s own reasoning already
concedes the point ("a notation-only improvement"): the notation IS the
language. The retirement is mechanical in both directions and
`tools/migrate-figdown.js` performs it. **`POSITIONAL-LIST-SPELLING` records the reversal as a
SUPERSESSION of `POSITIONAL-LIST-SPELLING`, not as a contradiction to be discovered later.** The
two do not both stand: `POSITIONAL-LIST-SPELLING`'s disposition ("NOT deprecated and must not
error") is void. What survives from `POSITIONAL-LIST-SPELLING` is RULE 3.1 —
every positional list must terminate — which `COMMA-LIST-WHITESPACE` then leaned on to choose
the whitespace policy.

## 6. Closure and diagnostics

### 6.1 The grammar is closed

**RULE 6.1 — unknown lines, unknown option keys, and registered keys on
directives that do not accept them are ERRORS. Nothing is ever silently
ignored.** (core.md:24-27, :1254-1260, :528-529; .github/CONTRIBUTING.md:40-41.)

A closed set that is not written down is not closed, it is merely
unimplementable (`HEADER-GENRE-REQUIREMENT` §5). Every closed set — keywords, option keys, shape
and style enums, edge operators, numbering values, lane characters, merge
markers — must be enumerated in the registry.

### 6.2 Retired spellings get a named diagnostic

**RULE 6.2 — a retired spelling becomes a line error that NAMES its
MIGRATIONS entry. Silent acceptance and silent rejection are both
forbidden.** (.github/CONTRIBUTING.md:78-80.)

Placement follows one test: a spelling that moved **between directives**
keeps a per-directive message (`from=`/`to=` on `band`,
`label=`/`taillabel=`/`headlabel=` on `edge`); a spelling that left the
**language** fires wherever it appears (`w=`, `h=`, `dir=` — the `colw`
precedent, `SIZE-AND-DIRECTION-KEY-NAMING` `:3450-3457`; `color=` joined them, `COLOUR-KEY-STATUS`). Retired **values** follow the same rule as retired keys
(`shape=cloud`, `SHAPE-ENUM-VOCABULARY` `:3270-3273`).

### 6.3 Malformed input is an error, never a guess

**RULE 6.3 — where input admits two legal readings, the parser MUST report
an error. It MUST NOT pick one.**

**Was** broken by `bundle`; fixed (`LINK-OPERATOR-IN-IDS`). Verified before
the fix: with nodes `a-x` and `b` declared,
`bundle t1 a-x--b` parses — the member regex
`^([A-Za-z_][A-Za-z0-9_-]*)--([A-Za-z_][A-Za-z0-9_-]*)$`
(figdown.html:1114) is greedy, so it silently commits to `a-x` / `b`. The
other reading — `a` / `x--b`, where `x--b` is an equally legal id — is
**unreachable**: with those two nodes declared the same line reports
*"unknown endpoint in `a-x--b`"*. An author with a node named `x--b`
could not write that bundle at all. **LANDED 0.1**: `--` is
forbidden inside an id, at every id position, with a named diagnostic.
Migration cost: zero — no id in either corpus contained `--`. A member is
now SPLIT on `--` rather than matched by a greedy two-id regex, so the
split is total: exactly two parts, each a legal id, or the line errors.

The same `--` reads oppositely two lines apart, which is its own defect:
`edge a--b` **was** an error (the edge scanner's greedy `readId` ate
`a--b`, then found no operator) while `bundle t1 a--b` was the
**canonical** spelling. Forbidding `--` inside an id resolved both: the id
scanner now stops before a `--` (a `-` is an id character only when it is
not followed by a second one), so `edge a--b` and `bundle t1 a--b` read
the same token the same way.

### 6.4 A default must not be able to assert a falsehood

**RULE 6.4 (`UNSAFE-DEFAULT-ELIMINATION` §3) — a default is legitimate only when being wrong is
harmless. A default that can make the artifact state something false is
forbidden; the value becomes REQUIRED.**

`numbering=` is the shipped instance: an absent value defaulted to `lsb0`
and drew a bit ruler that *asserts* bit 0 is at the other end of the word,
with no inspection that catches it (requirements-notes.md:2178-2195). An
absent label defaults to the id and is harmless — the model still records
the absence, so nothing untrue is claimed.

## 7. The twelve invariants the language already keeps

These are not new rules; they are the consistency the language has already
achieved. A proposal must not break them. Each was verified against the
parser. The maintainer-ruling item codes cited in the table (`OMITTED-LABEL-RECORDING`, `REPEATED-DIRECTIVE-HANDLING`,
`EMPTY-LABEL-STATE`) are defined in the
A-code registry.

| Invariant | Evidence (verified) |
|---|---|
| **Case-sensitivity.** Keywords, option keys, enum values and ids are case-sensitive; every standard spelling is lowercase ASCII. | `Node a` → `"Node" is not allowed in genre block`; `shape=Box` → `unknown shape "Box"`; `Fill=red` → `unknown option "Fill="`; `fill=Red` → `unknown color "Red"`. figdown.html:143, 281, 1014 |
| **Enum values are a single lowercase word.** No enum member is hyphenated, abbreviated or multi-word. | `SHAPES` (figdown.html:114), `STYLES` (:421), `flow` (:1532), `extend` (:1717), `numbering` (:1814). The sixth instance, `routing`'s `orthogonal\|straight`, was **withdrawn at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`)**; the citation is replaced rather than left pointing at deleted code, and the invariant loses no support — five live enums keep it. |
| **One colour shape everywhere.** `#rgb` / `#rrggbb` / one of the 147 lowercase CSS names / `transparent`, on every key that takes a colour. | `isColor` (figdown.html:143), applied uniformly at :679-681 and :553-554 |
| **Option position is free (`OPTION-POSITION-PARSING`).** Any `key=` token is extracted by shape from anywhere on the line; positionals close up behind it. | `node fill=red a "L"`, `bundle t1 fill=red "LAG" a--b`, `threshold in=a "Thr" offset=50%` all parse. figdown.html:347-368 |
| **A repeated option key on one line is an error.** Never last-wins. | `node a fill=red fill=blue` → `duplicate option "fill=" on one line`. figdown.html:662 |
| **An unknown option key is an error.** | `node a foo=bar` → `unknown option "foo="`. figdown.html:663 |
| **Absent, `""` and `"x"` are three distinct label states (`OMITTED-LABEL-RECORDING`/`EMPTY-LABEL-STATE`).** | `node a` → `"label": null`; `node a ""` → `"label": ""`. figdown.html:1021, 1039, 1060, 1003 |
| **Every retired spelling carries a named diagnostic naming its migration.** | `color=` :329; `w=`/`h=`/`dir=` :342-346; `kind=` :1010; `label=` family :551; `from=`/`to=` :1169; `shape=cloud` :123; `colw` :727; `line`/`fill`/`route`/`render` :750-753 |
| **One id namespace for nodes, groups, boundaries and typed blocks.** `class`, `layer` and `bundle` keep their own. | `node a` + `group a` → `duplicate id "a"`; `node a` + `bitfield a …` → `duplicate id "a"`; `class c "x"` + `layer c` → parses. figdown.html:508 |
| **Repeating a single-valued directive is an error on the second occurrence (`REPEATED-DIRECTIVE-HANDLING`).** | `duplicate title line`, `duplicate flow line`, `duplicate pin for "a"`, `duplicate layout line` — all verified. figdown.html:1385, 1531, 1774, 1779. (`duplicate size for "a"` was one instance until 0.1 retired the keyword; `duplicate pin for "a"` now covers the merged geometry line. `duplicate routing line` was another until 0.1 **withdrew** `routing`, `EDGE-GEOMETRY-CONSTRUCTS` — the citation is removed rather than left pointing at deleted code, and the "at most one `path` per edge" duplicate check went with it. Four live instances still carry the invariant.) |
| **The grammar is closed.** Every non-blank non-comment line must begin with a registered token. Under a DECLARED genre the message names the genre (`"zzz" is not allowed in genre block`); `unrecognized line` is what an implementation must produce when no valid genre is in force. core §0.1 states both from 0.1. | the genre allowlist, and `unrecognized line` in the switch default |
| **Comma within a value, whitespace between positionals.** No construct uses whitespace as an intra-value delimiter, and no construct uses a comma as a positional separator. Since 0.1 (`COMMA-LIST-WHITESPACE`) this is exact rather than nearly-true: a comma list is ONE whitespace-free token everywhere. | The comma appears only inside `at=`, `class=`, `labels=`, `rank`, `width`, `bundle`, `field` compact and `cell` — always within one value. Verified across all eight. (It was ten until 0.1: `via=` and the `src=`/`dst=` pair, counted as one carrier each, went with the `path` directive under `EDGE-GEOMETRY-CONSTRUCTS`. 10 − 2 = 8.) |

**Numeric value grammars are uniform — now an invariant.** The one exception was `chart level=` (spelled `plot level=` until this release), which used bare `parseFloat` and therefore accepted `1e3`
where every other numeric key rejects scientific notation by exact regex. It was **deleted** (`CHART-LEVEL-KEY`), not fixed: zero uses
corpus-wide, zero 3-D bar charts and zero requests, so the construct did
not earn a grammar repair. Every numeric value in the language is now
`-?\d+(\.\d+)?` per component.

## 8. Declared exceptions

### 8.1 `in=` carries two relations

`in=` means **containment** on `node` (which group holds this node) and
**annotation target** on `threshold` and `band` (which node or group this
marker is drawn across). Verified: both parse; core.md §10 and
block.md both record the split.

**Kept, with the reason.** The two relations are disjoint *per directive* —
no directive accepts `in=` in both senses, so no line is ambiguous — and
both are honestly "the element this one lives inside". The alternative,
inventing a second key (`on=`, `target=`), would add a spelling for a
distinction the reader never has to make. It is nonetheless a **weakening**
of RULE 4.3, and it is recorded as an exception rather than silently
tolerated so that a future third sense of `in=` is refused.

**The v0.2 annotation target key MUST be `on=`.** This
is recorded here, before anyone designs against it. The v0.2 candidate
`note` is an annotation attached to a target, and a `note … in=<id>` would
be exactly the **third sense of `in=`** the paragraph above promises to
refuse — it is neither containment nor "drawn across", but "about". Using
`on=` therefore does not deepen the declared exception, it **closes** it:
`in=` keeps two senses and gains no third, and the annotation family gets
the key that says what it means. `on` is unregistered today (verified
against the closed option-key registry, core.md §10) and appears on no
avoid-list. See also the locator note in core.md §9: `on=` names the
target, and the grammar for naming a *sub-element* as that target is a
separate, shared problem.

### 8.2 `fill` is a retired keyword and a live option key

Recorded already in core.md:1187-1205 and restated here so this document is
complete: `fill` at line start is *always* the error
`fill has been renamed: use band`, and `fill=` is *always* the option key.
They can never meet in a document that parses. The exception is
**directional** — a retired spelling MAY be reused in the other namespace,
a live one may not (`PAINT-KEY-NAMING` §3).

### 8.3 `gap` is the one live cross-namespace spelling for DIFFERENT concepts

The `timing` child keyword `gap <cycle>` (a time break) and the scene option
`gap=<px>` on `group` (member spacing) are different concepts under one
spelling (timing.md:128-134). Accepted under `GENRE-VOCABULARY-OBLIGATION` because a keyword is only
ever a line's first token and an option key only ever the left of a `key=`.
Recorded here because `UNSAFE-DEFAULT-ELIMINATION`'s test is about the **reader**, not the parser,
and this one does cost the reader a moment.

**Accuracy fix.** Until this release this section claimed `gap`
was "the one LIVE cross-namespace spelling in v0.1", which is false as
written: `class`/`class=`, `width`/`width=`, `plane`/`plane=` and
`routing`/`routing=` were all live in both namespaces. What is unique
about `gap` is the *semantics*, not the liveness — the others denote the
**same concept** on both sides (a class and its join, a horizontal extent, a
paint plane and its membership, and — until it went — a routing mode and its
per-edge override), which is what core §10 calls correct rather than
tolerated. `gap` is the only live pair whose two sides denote **different
concepts**, and that is the property that costs a reader anything. Stated
exactly because a claim about what is unique is worthless when
counterexamples sit in the same registry.

**Recount (`EDGE-GEOMETRY-CONSTRUCTS`).** `routing`/`routing=` is no longer one of
them: `EDGE-GEOMETRY-CONSTRUCTS` withdrew **both** registrations at once — the keyword and the
option key on `path` — so the same-concept counterexamples go **four → three**
(`class`/`class=`, `width`/`width=`, `plane`/`plane=`). Derived by dropping
`routing` from the list of four above; `vocabulary-sources.tsv`'s header
comment records the same list from the other side — five spellings appear as
both an option and a keyword (`class` `gap` `layer` `routing` `width`), of
which `layer` is retired in both namespaces and `routing` is now withdrawn in
both, leaving **three** live pairs. `gap`'s own status is untouched: it remains the one live pair whose
two sides mean different things, and it remains a declared exception. Nothing
here was discharged by the withdrawal — this section's exception is `gap`, and
`gap` is still live.

### 8.4 NOT an exception — `fill=`/`stroke=` on interior-less constructs — **FIXED (`INTERIOR-LESS-ELEMENT-PAINT`)**

On `edge`, `threshold` and `bundle` there is no interior, so `fill=` and
`stroke=` named the **same channel** and `stroke=` won silently. That was
a **DEFECT**, not an exception: two keys for one channel, resolved by an
undocumented precedence that produced a legal, wrong figure when both were
written. Measured in this repository: 16 lines across 242 `.fd`, of which
**3 wrote both keys on the same line**.

**`fill=` on those three is a line error naming
`stroke=`.** It landed in the same release as `text=` → `color=` because
that release already rewrites every colour-bearing line: one migration
family, one diagnostic set, one corpus rewrite, instead of rewriting the
same lines twice.

**The class-mediated half, which the original scoping missed.** Before the
fix the edge renderer read `e.stroke || e.fill`, so a class carrying
`fill=` painted edges *through the fill channel* — rejecting `fill=` on
the `edge` line alone would have left `fill=` meaning "an edge's colour"
by the back door. Measured when found: ~20 classes across 14 local files,
two of them shared between nodes and edges.

**The rule is per CHANNEL, not per class.** A class is a bundle of channel
defaults for HETEROGENEOUS members: `fill` applies to members that HAVE an
interior and is inapplicable to those that do not. So one class still
carries one meaning for both — `class hot "…" fill=#fee2e2 stroke=#dc2626`
paints a node member's box and an edge member's line — and **no class has
to be split, so no meaning gains a second legend entry** (`CATEGORICAL-MEANING-MAPPING`). Forbidden
is only the case that would be SILENT: a class that sets `fill=` and no
`stroke=`, used by an edge. Ignoring it would drop the edge's colour with
nothing to warn on; honouring it would make `fill` mean "stroke" for that
member, which is RULE 4.3's prohibition.

**The half this scoping missed, closed (`CLASS-PAINT-REQUIREMENT`).** The same
hole sat one key over: a class that painted NEITHER channel and was joined
by an edge was accepted in silence. `class p "Path" color=#dc2626` plus
`edge a -> b class=p` parsed, drew a `#555` line, and rendered a legend
swatch showing nothing — the class's meaning invisible in the legend the
language derives FOR it. `INTERIOR-LESS-ELEMENT-PAINT` fixed one key and left the identical hole one
key over. It is now a line error naming `stroke=`, with the same per-
channel shape: an edge has exactly `stroke=` and `style=`, so `style=`-only
stays legal (the dash reaches the edge) and "declares neither" does not.
Zero legitimate uses in either corpus; the three in-repo instances were one
class, `underlay`, whose intent was the default line colour and which now
says so.

### 8.5 `%` and `auto` on `pin width=` are a scope limit, not a second grammar

RULE 4.4 requires `width` (the table keyword) and `width=` (the option key
on `pin`) to share one value grammar, and they do: a bare
number in px, `<n>%`, or `auto`, with no unit suffix anywhere.

`pin width=25%` and `pin width=auto` are nonetheless line errors, each
with its own named diagnostic. **Kept, with the reason.** A node has no
containing extent for a percentage to resolve against in v0.1 (`NON-NUMERIC-EXTENT`/13),
and `auto` is precisely what an unwritten `width=` already means — so
registering it would add a second spelling for "omit the key" (`PRIOR-ART-BORROWING`). This
is a documented, diagnosed capability gap in one construct, not two
grammars behind one word, and it is recorded here rather than silently
tolerated so that a future `pin width=50%` proposal is answered by the
containing-extent question and not by taste.

The exception was written against `size width=` and moved to `pin width=`
(`ELEMENT-GEOMETRY-DIRECTIVE`) untouched: the merge changed which directive carries
the key, not the key, its value grammar or the reason (only "an absent
`size` line" became "an unwritten `width=`", because a `pin` line may now
be present for the placement and silent about the extent).

### 8.6 `auto` and `*` are word-shaped values inside numeric grammars, and quoting stays inert on them

RULE 2.4 says a value drawn from a closed set of spellings is written bare.
Two live spellings are words drawn from a closed set and are nonetheless
governed by RULE 2.3b, where quoting is INERT: **the `auto` element of a
table `width` list**, and **`*` as a `field` width**. `width "auto",90` and
`field "A" "*"` parse, and produce the same model as the bare spellings.

**Kept, with the reason.** Each is ONE alternative inside a value grammar
that is otherwise numeric — `auto | <number> | <number>%` and
`<number> | *` — so the element they sit in is typed by that grammar, not
by the alternative taken. Enforcing bareness on them would split one comma
list into bare-word elements and quotable-number elements, decided per
element by which branch the author happened to write; that is a worse rule
than this exception, and it would make `width auto,"90"` legal while
`width "auto",90` was not. RULE 2.3's own argument applies unchanged: a
generating agent that quotes uniformly must not be punished.

This is recorded here rather than silently tolerated so that a future
audit of RULE 2.4 finds a reason instead of a gap — which is exactly what
0.1's audit did NOT find when it counted the enum positions, and
the reason that release exists.

## 9. Corrections by release — all LANDED

These were ruled and scheduled by earlier revisions of this document.
All of them have now shipped; each row names what the release did.

### 0.1 — three of this document's own rules, checked against the whole vocabulary for the first time (`RULE-POSITION-ENUMERATION`, `VERBATIM-REGION-SCOPE`)

Every rule below had only ever been applied case by case. The first
whole-vocabulary pass found all three broken.

| # | Correction | Rule | Migration cost |
|---|---|---|---|
| 1 | **RULE 2.4's ENUM half, enforced** — it held at 14 of 14 id positions and **0 of 9** enum positions. `shape="box"`, `style="dashed"`, `flow "right"`, `figdown "0.1" block`, `figdown 0.1 "block"`, `numbering="msb0"`, `cell 1 "highlight"`, `extend="up"` and `type="bar3d"` are line errors now, through one wording and one shared check. The rule text gains "bare keyword flag" for `cell … highlight`. | 2.4 | **zero measured** — 0 quoted enum values in the corpus; `tools/migrate-figdown.js` strips the quotes mechanically |
| 2 | **RULE 2.3's scope corrected, and RULE 2.3b written down** — a table `width` element's grammar is `auto\|<number>\|<number>%`, not `string`, so 2.3 never had authority there while its prose claimed it. That was the one position where 2.3 and 2.4 disagreed. Quoting stays inert on numbers, points, percentages and ranges, with `index=` as the load-bearing case; `auto` and `*` are a DECLARED EXCEPTION (§8.6). | 2.3, 2.3b, 2.4 | **none** — the behaviour is unchanged; what changed is that it is now stated |
| 3 | **RULE 2.1 completed at the typed-block openers** — `bitfield`, `table` and `timing` accepted a bare label, at 3 of 15 labelled positions, while both genre documents wrote the form quoted. `table t My Caption` reproduced the exact `unexpected argument "Caption"` misdiagnosis §2.1 opens with. | 2.1 | mechanical — `tools/migrate-figdown.js` quotes the label; **0 in-repo, 0 downstream** |
| 4 | **`edge`'s one missing id check** — `parseEdgeLine` has its own copies of the genre gate, the layout-zone gate and the retired-key sweep, but not the id-quoting check, so `edge a -> b plane="over"` was accepted while `node c "C" plane="over"` was a line error. One missing call; `edge` was the ONE id position in the language that tolerated a quoted id. | 2.4 | **none** — 0 uses |
| 5 | **`#` honours `[ ]`, as `;` has since 0.1** (`VERBATIM-REGION-SCOPE`). See §1: two deliberate goldens encoded opposite answers about one verbatim region. | 1 | **none** — the change only ACCEPTS input that was rejected |
| 6 | **`step` is RESERVED inside `index=`** (core §9 `INDEX-RANGE-STEP`). The extension that entry filed as needing "no new key and no migration" was already a legal document with a prose `<last>` of `"7 step 2"`, so the second half was false. Reserved now, exactly as `;` was at 0.1 and for the same reason. | 4.5, 6.2 | **zero measured** — 0 of 9 corpus figures have a stepped index; the rewrite is not mechanical (only the author knows what the prose meant) and the tool reports rather than guesses |

### 0.1 — the repetition construct, and one range grammar (`BITFIELD-REPETITION-CONSTRUCT`, `RANGE-SPELLING`)

| # | Correction | Rule | Migration cost |
|---|---|---|---|
| 1 | **`index=` on a `bitfield` `field`** — the repetition range, `<first>..<last>`, tri-state in the same shape as `present=`. `<first>` is always a literal integer; `<last>` may be opaque prose. Quotes are INERT on the key (RULE 2.3 above) and DETERMINACY is decided by parsing both ends, which is normative because `index="0..7 step 2"` (core §9 `INDEX-RANGE-STEP`) rests on it. The spelling is single-sourced from IEEE 1685-2022 (IP-XACT), verified in the Accellera schemas, making three of `field`'s five option keys IP-XACT's. RULE 4.7 lost to RULE 4.1 here and converted to a filing, core §9 **`INDEX-KEY-NAMESPACE-CONTENTION`**. | 4.1, 4.7, 4.8, 2.3 | **none** — a new key; nothing had to change |
| 2 | **`band` moves onto the one range grammar**: `band "Headroom" 15..35%`. The hyphen form reads as subtraction and was the language's second range spelling; RULE 4.8 above now forbids a second separator outright, so §8 needs no declared exception for the pair. `band` is EXPERIMENTAL (`CONSTRUCT-STATUS-TIERS`), so nothing was promised; a named diagnostic was owed anyway. | 4.8, 6.2 | mechanical — 10 lines across 9 files in-repo; `tools/migrate-figdown.js` rewrites `band <a>-<b>%` → `band <a>..<b>%` |

### 0.1 — the layout zone becomes a namespace (`LAYOUT-ZONE-NAMESPACE`, `ELEMENT-GEOMETRY-DIRECTIVE`)

| # | Correction | Rule | Migration cost |
|---|---|---|---|
| 1 | **The layout zone is a namespace of its own** — core §1 clause **`LAYOUT-ZONE-NAMESPACE`**. Every member is genre-independent: no genre may define, redefine or extend a keyword inside the zone, so `GENRE-VOCABULARY-OBLIGATION` (a genre owns its words) does not reach in. `path` and `routing` become genre-independent while STAYING experimental — the two axes are orthogonal, experimental describing stability and genre-independence describing belonging. The sentence licensing a future genre to redefine the pair is **withdrawn** (that half of `CONSTRUCT-STATUS-TIERS` reversed; `CONSTRUCT-STATUS-TIERS`'s demotion of the pair from core to experimental stands). **Superseded in part at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`): `path` and `routing` were withdrawn from the language, so `LAYOUT-ZONE-NAMESPACE`'s membership is now `pin` alone and both spellings are RELEASED — a future genre may claim either, under `NEW-CONSTRUCT-EVIDENCE-GATE` like any new word. `LAYOUT-ZONE-NAMESPACE` itself stands unamended; only its membership changed. The reasoning is kept in full because it is the record of the orthogonality ruling, which still governs every future member of the zone.** | 4.5, 4.6 | **none** — no document changes |
| 2 | **`size` merges into `pin`**: `pin <id> at=(x,y) width=<W> height=<H>`, all three keys optional and a `pin` line carrying none of them a line error. Split domain: `at=` places nodes, groups and `external` endpoints, while `width=`/`height=` are **nodes only**, because a group, an `external` endpoint and a typed block all derive their geometry from their content. `size` is RETIRED with a named diagnostic spelling the whole replacement line. The model's `sizes` array is deleted; each `pins` entry carries optional `at`, `width` and `height`. | 4.1, 6.2 | mechanical — `tools/migrate-figdown.js` folds a `size` line into the id's `pin` line, or renames it where the id has no `pin` |

One directive now carries an element's whole declared geometry, which is
what makes the diagnostics nameable in both directions: a line-start `size`
names `pin`, and `width=`/`height=` written on `node` (or on
`process`/`decision`/`terminator`) names the `pin` line rather than a
keyword that no longer exists. The top-level keyword count goes 24 → 23,
partitioned 3 universal core (`figdown` `title` `layout`, the document's
structure — `layout` stays there because it OPENS the zone) + 3 in the
layout namespace (`pin`, `path`, `routing`) + 11 scene + 3 flowchart + 3
nested-genre openers = 23. Option keys stay at 42 as this document counted
them then, with the three geometry keys (`at` `width` `height`) re-filed
from core to the layout namespace.

**Recount (`EDGE-GEOMETRY-CONSTRUCTS`)**, because the partition above is the one a
reader will find first and it is now two keywords out of date. Withdrawing
`path` and `routing` takes the **top-level keyword count 23 → 21** and
empties two of the three slots in the layout namespace: **3 universal core +
1 layout namespace (`pin` alone) + 11 scene + 3 flowchart + 3 nested-genre
openers = 21.** Every other bucket is untouched — the withdrawal removed two
layout-namespace keywords and nothing else — and core §10 sums the same
partition as `3 + 1 + 11 + 3 + 3 = 21`. On the option-key side `EDGE-GEOMETRY-CONSTRUCTS` withdrew
**four** keys (`points=` `routing=` `tailport=` `headport=`), all four
accepted only by `path`, which empties the "layout, experimental" bucket
entirely; core §10's registry total does **not** move, because a registration
counts there whether or not it has a live acceptor and the four are still
owed a named diagnostic. `vocabulary-sources.tsv` agrees: all four keep their
rows with status `retired`, the treatment `via` `src` `dst` `w` `h` `level`
and `text` already get, so its option-key total stays at 45 rows for 44
distinct spellings too. Dropping them was considered — that table attributes a
LIVE spelling to its source — and rejected, because three surviving rows
(`word`, `pin`, `via`/`src`/`dst`) cite the withdrawn attributions as standing
precedent, and a table that doubles as the retirement registry cannot delete
the entries that make it one. **The counts in both files count LIVE
registrations only**; a withdrawn row is present and uncounted, exactly like
every retired row beside it.

### 0.1 — the last pre-freeze language batch (`PRESENCE-CONDITION-EXPRESSION`–`BITFIELD-GENRE-NAMING`)

| # | Correction | Rule | Migration cost |
|---|---|---|---|
| 1 | The `field` presence FLAG becomes the option key `present=`, carrying the CONDITION. Both historical spellings (`optional`, `conditional`) are line errors. | 4.1, 5 | 48 flagged lines mechanical (22 in-repo, 26 downstream); 18 condition lifts NON-MECHANICAL |
| 2 | `note=` → `description=` (IEEE 1685's spelling), pre-empting the v0.2 `note` KEYWORD, which will DRAW. | 4.2, 4.3 | 1852 uses, mechanical |
| 3 | The genre `wave` → `timing`: the old name was WaveDrom's MEMBER KEY, not its figure name. | **4.5b** | 79+79 downstream, 11+18 in-repo, mechanical |
| 4 | `highlight` and a cell `fill=` may not both apply to one cell — a named line error, not a precedence rule. | 6.1, 6.3 | 1 in-repo file, 0 downstream |
| 5 | RULE **4.5b** written down: a genre is named after the FIGURE KIND. | — | documentation |
| 6 | `word=` documented as bits per drawn row, and recorded as kept-by-default; the TSV's false "only identifier attestation" claim corrected. | 4.1 | documentation |

### 0.1 — reject what the registry never granted (`LINK-OPERATOR-IN-IDS`, `QUOTED-IDS`)

| # | Correction | Rule | Migration cost |
|---|---|---|---|
| 1 | `--` forbidden inside an id; `bundle` members split rather than regex-matched; `edge a--b` now reads like `bundle t1 a--b`. | 6.3 | 0 ids in either corpus |
| 2 | The comment scanner honours `\"`, so `title "a \" b # c"` parses. A property test in `conformance/run.js` asserts `findComment` and `tokenize` can never disagree again. | 6.1 | 0 (only widens) |
| 3 | `class=` removed from the `bitfield`/`table`/`timing` **openers** — the engine accepted a key the normative registry never listed. | 6.1 | 0 uses |
| 4 | `%` mandatory on `band` ranges, matching the marker. | 4.4 | 0 uses |
| 5 | `90px` rejected in table `width`; the two `width` spellings now share one unit grammar. | 4.4 | 0 uses |
| 6 | A quoted token in an id position is a line error, at every id position, with one wording; the two WRONG diagnoses (`edge`, `rank`) fixed. | 2.4 | 0 quoted ids in 4255 declarations |
| 7 | Genre-doc and ABNF corrections (below). | — | documentation |
| 8 | R-numbers assigned retroactively: `;` reservation = **`SEMICOLON-STATUS`**, `src=`/`dst=` docks = **`ENDPOINT-DOCKING-KEYS`**. | PROCESS §1 | documentation |

Documentation corrections in the same release, all done:

- core §2.3 listed three edge operators; there are four (`--` was missing,
  and it is the most-used one).
- `path src=` / `dst=` appeared in **no** genre document; the scene genre
  tables were given rows for both. *(All of that vocabulary — `path` and its
  four option keys — was withdrawn from the language, `EDGE-GEOMETRY-CONSTRUCTS`, and
  the rows added here were removed from the genre documents in the same
  release. The correction is kept on the record because what it evidenced is
  still true and still enforced by `tools/reference-coverage.js`: a live
  construct with no row in the genre document that admits it cannot be looked
  up by the reader who meets it.)*
- `via=`'s value shape was recorded in its **retired** pre-0.1 form
  `x,y;x,y;…` in all three scene genre docs; all three were corrected to
  `via=(x,y),(x,y)`. *(Same fate: the key was renamed `points=`
  And withdrawn with `path`.)*
- `plot` had no vocabulary row anywhere. **Ruling: the allowlist is right
  and the tables were incomplete.** `plot` is defined by its reference to
  a `table` id, and `table` is a legal host keyword in every scene genre,
  so a scene document can hold both the data and the chart; forbidding
  `plot` there would make a legal figure unwritable in the only genre that
  can carry its data. The rows were added (marked experimental) to the
  three scene genres and to `table.md`.
- The ABNF excluded `=` from option values and bare tokens, although
  option values may contain `=` (`description="a=b"`) and timing lanes
  **require** it — the ABNF could not express the timing genre. Fixed.
- **`unrecognized line` is unreachable under a valid genre**, because the
  genre allowlist fires first. **Ruling: correct core §0.1, not the
  engine.** The allowlist message is strictly more informative (it names
  the genre), and `unrecognized line` is still reachable — it is what
  fires when no valid genre is in force (a missing or unknown genre
  token). §0.1 now states which message an implementation must produce in
  which case, instead of promising one that cannot appear.
- The id pattern is presented so that a trailing `-` or `_` is
  unambiguously legal. Field evidence: a downstream author's comment
  records renaming `mux_` in the belief that a trailing underscore was
  illegal. It parses.

### 0.1 — the punctuation and quoting scheme, enforced (`SEMICOLON-STATUS`–`POSITIONAL-LIST-SPELLING`)

| # | Correction | Rule |
|---|---|---|
| 1 | All points parenthesised: `pin at=(x,y)`, `path src=(u,v)`, `path dst=(u,v)`, `cell (r,c)`. Two of the four left the language at 0.1 (`EDGE-GEOMETRY-CONSTRUCTS`) with the `path` directive; `pin at=` and `cell` are the live instances. | 1.1a |
| 2 | `;` reserved with a named diagnostic outside the four verbatim regions (string, `[edge label]`, comment, pipe row). | 1.3 |
| 3 | Quoting enforced on all three delimiter rows; a quoted list element protects its content (`labels="a,b"` is ONE element); an unquoted whitespace-delimited string gets a diagnostic naming the quote. | 2 |
| 4 | The space forms of `rank`, table `width` and `bundle` members retired — **`POSITIONAL-LIST-SPELLING`'s disposition reversed**. | 5.2 |
| 5 | One whitespace policy for every comma list: the list is ONE whitespace-free token. | 3.2 |
| 6 | The `width` keyword and the `width=` option finished onto one unit grammar; `%`/`auto` on `size` recorded as a scope limit (§8.5). | 4.4 |

### 0.1 — the colour model closes (`STROKE-KEY-STATUS`–`CLASS-PAINT-REQUIREMENT`)

| # | Correction | Rule |
|---|---|---|
| 1 | `stroke=` promoted to NORMATIVE — SVG's own key, and SVG's own shape/line asymmetry stated as the reading rule. | 4.1 |
| 2 | `color=` RETIRED language-wide, with NO replacement. It is the only key ever re-pointed to a second meaning, and retiring it is what makes the two eras diagnosable. | 4.3, 6.2 |
| 3 | The default label colour is DERIVED from the background's WCAG relative luminance — not an option key, so it cannot be wrong (`UNSAFE-DEFAULT-ELIMINATION`). | — |
| 4 | A class an edge joins must declare a channel an edge HAS; the legend swatch shows declared paint only. | §8.4 |

**§9's "not implementable" note below is now moot, and how it was
discharged matters.** The diagnostic this document demanded — *say which
meaning the author probably intended* — could not exist while `color=` was
live, because a legal line is not an error. Retiring the key makes it an
error, and an error message MAY name both eras and refuse to choose. That
is the only mechanism that turns the 1602 downstream `color=` sites from
silent wrong figures into 1602 hard errors.

### 0.1 — the channel vocabulary (`TEXT-COLOUR-KEY-NAMING`–`Z-ORDER-KEY-NAMING`)

| # | Correction | Rule |
|---|---|---|
| 1 | `text=` → `color=`. **Not a rename**: old `color=` meant FILL. (`color=` was itself retired at 0.1, `COLOUR-KEY-STATUS`.) | 4.1 |
| 2 | `z=` → `z-index=` — CSS's own spelling, taken in full. | 4.2, 4.5 |
| 3 | `guide at=` → `guide offset=`, so no key carries two value shapes. | 4.3 |
| 4 | `fill=` retired on `edge`/`guide`/`bundle`, including the class-mediated path. | §8.4 |

**Why `text=` → `color=` is the one migration that is not a rename.** The
history is the whole argument, and it is unchanged from earlier revisions
of this section: `color=` originally set the **fill** and was retired precisely *because* CSS and SVG spell the fill `fill` and the
text colour `color`; the three channels were then named `fill=`,
`stroke=`, `text=`; and that left the borrowed set **incomplete**, with
the standard's own word for the third channel sitting unused in the
registry as a retired diagnostic. So old `color=` meant fill and new
`color=` means text.

**One thing this section previously required is NOT implementable, and
saying so is part of the record.** It asked that "the diagnostic on a bare
`color=` must say which meaning the author probably intended and name both
entries". Once `color=` is a live key again there is no such diagnostic:
`color=#dc2626` is a legal line with the new meaning, and nothing
distinguishes it from a pre-0.1 one. What was done instead:
`text=`'s diagnostic names both entries and states the meaning change, and
the whole remaining burden sits in `tools/migrate-figdown.js`, whose
refusal to guess is structural — see `TEXT-COLOUR-KEY-NAMING` and MIGRATIONS 0.1 for the
idempotence argument.

`z=` moved for two reasons at once: it was the last single-letter key,
which `LANE-ALPHABET-KEY-RESERVATION` makes structurally risky in a language whose lexer consults a
closed single-character alphabet, and CSS spells the concept `z-index` —
RULE 4.2 takes the full spelling. It is the first hyphenated option key;
the precedent is `taillabel`/`headlabel`, taken whole from Graphviz
including their run-together spelling. The rule is *the standard's own
spelling*, not *our preferred shape*.

## 10. Where this document does not match what the parser does

Recorded per PROCESS §4 (deviations are loud). Everything here was
verified by running the engine.

**Closed since the previous revision** — items 1, 2, 3, 5 and 6 of the old
list (the unenforced `;`, quoting not protecting a comma, the `bundle`
`--` ambiguity, the `edge`/`bundle` whitespace disagreement, and `via=`
documented in its retired form) are all fixed and are no longer
deviations. Item 4 was resolved by correcting core §0.1 rather than the
engine.

**Open:**

1. **Whether a `labels=` element may contain a comma is deliberately
   OPEN.** 0.1 made it *expressible* (`labels="a,b"` is one
   element) without ruling that it is *allowed to stay* expressible: 202
   elements observed, 0 needing one, and `timing` is experimental. A future
   ruling may forbid it; nothing in the corpus depends on the answer.
2. **The table colspan is spelled by the ABSENCE of a character, and `TABLE-ROW-SYNTAX`
   argued against exactly that.** A pipe cell whose RAW segment is empty is
   a colspan-left; a whitespace-only segment is an ordinary empty cell. The
   encoding is injective and both readings are goldens, so nothing is
   ambiguous — but a Markdown formatter that pads cells rewrites the figure
   with no error, and `TABLE-ROW-SYNTAX`, the decision that ADOPTED `||`/`^^`, rejected
   whitespace-as-alignment in the same paragraph on those very grounds
   ("formatters like Prettier pad cells arbitrarily"; "invisible characters
   carrying semantics is a classic failure mode"). This is not a deviation
   between this document and the parser — they agree — but it is a rule of
   §1's kind (a mark doing structural work) that no normative document
   stated until this release. Now stated in core §12.3 and `genres/table.md`,
   and filed as core §9 **`COLSPAN-EMPTY-CELL-SPELLING`**: changing the spelling is a language
   change in a frozen genre, so this release owes the record, not a fix.
3. **`tools/layout-lint.js` mis-measures every non-rectangular node.**
   `extractNodes` tests `<rect>` before `<polygon>`/`<ellipse>` within a
   fixed character window, so for a diamond, circle or ellipse it can pick
   up the *next* node's rect. Any `novlp`/`thru`/`cross` number for a
   figure containing one of those shapes is unreliable. This is a TOOL
   defect, not a language one, and the tool's numbers must not be treated
   as a gate until it is fixed.

## 11. The machine-readable companion

[vocabulary-sources.tsv](vocabulary-sources.tsv) carries one row per
option key, per positional value shape, per keyword spelling, and — — **per lexical MARK**, with the
source standard, that standard's own spelling, the value shape, the
accepted syntax **as derived from the parser**, the `CONSTRUCT-STATUS-TIERS` status, any
foreign standard that conflicts, and — non-empty only where the row breaks
a rule above — the exception reason and its target release.

**The mark rows close a gap in this section's own promise.** This section
has called the file "the machine-readable companion" to a document whose
**§1 is about marks**, and the promise held for keys and value shapes
only: `#`, `;`, `"`, `\`, `,`, `( )`, `[ ]`, `..`, `^^` and `||` had **no
rows at all**. A fourth `kind`, `mark`, and a matching `shape` value now
carry them — the mark's name as the key (the characters are not safe TSV
primary keys), the literal mark as `source_spelling`, and the mark's ROLE
plus where it is ordinary text as `accepted_syntax`. Mark rows are **not**
counted in the option-key or keyword totals: they are a fourth namespace,
not more members of the first three.

It is the input to a future `tools/syntax-style-check.js`, which should be
able to assert: every registered option key has a row; every row's
`source` and `shape` are in the closed enums; every `exception_reason`
names a section of this document and a release; and every
`scheduled-rename` row still exists (or has flipped to `retired`) at the
target release. **There are no `scheduled-rename` rows
left**: every one has landed and reads its final state.

**Two enum extensions were needed and are declared in the file's header.**
The brief's `source` list (SVG CSS DOT IETF ISO GFM multimd FigDown) does
not cover five sources the genre documents actually cite —
**Mermaid** (edge label positions, the `["…"]` bracket form, `class`),
**D2** (the edge operator set), **WaveDrom** (the lane alphabet, borrowed
verbatim), **C** (the compact `field` bit-field convention) and **HTML**
(`dir=`, as a conflict). The brief's `shape` list does not cover
`scalar-number` (`chart level=`, retired but still carrying
a row, because the table is also the retirement registry) or
`enum-or-point` (`src=`/`dst=`, the §5.1 union shape by design; both rows are
retired and both survive 0.1's withdrawal of their replacements,
because the table is also the retirement registry).
The `source` list gained **ECharts** and **Grafana** and
**Highcharts**: no member of the older enum has a threshold
or a value-band primitive at all, and recording either as coined would
have been false. Both enums are extended rather than forced, because
forcing them would put a false value in a machine-read table.

**`ISO` was in the brief's enum from the start and had no rows until this release.** It gained three — the `flowchart` role keywords `process`,
`decision` and `terminator`, taken whole from ISO 5807 (`FLOWCHART-ROLE-KEYWORDS`/`FLOWCHART-ROLE-SOURCE`). The
absence had been recorded as measured rather than accidental: `shape=` is
purely geometric under `SHAPE-ENUM-VOCABULARY`/`EXTERNAL-EDGE-ENDPOINTS`, so ISO 5807's symbol names had nothing to
attach to until the genre owned a role vocabulary. RULE: *borrow the
domain's own standard terminology first, and ISO/IEEE standards are
preferred* (§ above) is satisfied by those three and is what excluded the
alternatives — ISO's `predefined process`, `parallel mode` and `loop limit`
are **two words** and fail the one-lowercase-word rule, and `SIZE-AND-DIRECTION-KEY-NAMING` forbids
substituting a one-word synonym from another source, so they are a filed
naming problem rather than a silent rename. One `exception_reason` on the
`terminator` row records a **verification debt**, which is a use of that
column the tool should tolerate: ISO 5807 §9.4.2 was paywalled, so the
spelling rests on draw.io and Visio against ANSI X3.5-1970 and Mermaid,
and `Z-ORDER-KEY-NAMING` decides it once the clause is read.

---

**Cross-references.** [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) (the gate and the change
obligations) · [core.md](core.md) §1 (lexical rules), §10 (the registry) ·
[migrations.md](migrations.md) (every retirement's rewrite rule) ·
requirements-notes.md `PRIOR-ART-BORROWING`, `NEW-CONSTRUCT-EVIDENCE-GATE`, `SPELLING-LENGTH-VS-FREQUENCY`,
`REVERSE-ARROW-OPERATOR`, `UNSAFE-DEFAULT-ELIMINATION`, `HEADER-GENRE-REQUIREMENT`, `CONSTRUCT-STATUS-TIERS`, `PAINT-KEY-NAMING`, `SHAPE-ENUM-VOCABULARY`, `OPTION-POSITION-PARSING`, `LANE-ALPHABET-KEY-RESERVATION`, `POSITIONAL-LIST-SPELLING`, `SIZE-AND-DIRECTION-KEY-NAMING`, `TABLE-ROW-SYNTAX`.
