# Decisions

This directory is the **decision record** of the FigDown standard: why the
language is shaped the way it is, what was considered and rejected on the way,
and what evidence would justify reopening a settled question.

It is not a changelog and not a specification. The specification says what the
language *is* — [`spec/`](../spec/README.md). The changelog says what *changed*
— [`CHANGELOG.md`](../CHANGELOG.md). This directory says **why**, and it is the
only place that says it.

**[`registry.md`](registry.md) is the record.** One consolidated document, one
row per decision. Read that; this file explains how it is built and why.

## The principle

> **A rejection recorded with its reasoning is a durable asset. A rejection
> deleted is a trap.**

Someone will propose the rejected alternative again — a contributor who was not
there, a maintainer two years on, or the original maintainer having forgotten.
If the rejection is on file with its argument, that costs one link. If it was
deleted because it "lost", the next person re-derives the whole argument from a
blank page, usually less well, and sometimes reaches the opposite conclusion for
reasons that were already answered.

So an entry is not finished when it records what was chosen. It is finished when
it records **what was rejected, why, and what would change the answer.** An
entry whose rejection column is empty is either a decision nobody could disagree
with, or an entry that is not finished — and it is worth knowing which.

The corollary matters as much: a reopening condition is a **real commitment**.
If the stated evidence arrives, the decision is genuinely back on the table. Do
not write a condition you would refuse to honour — write the one you would.

## Why one registry and not one file per decision

Because the registry's job is to be **resolvable**. The normative text cites
these entries by ID, and a reader who meets a citation needs to land on its
meaning in one step. A single greppable document does that; a directory of
files makes the reader guess at a filename, and makes a bidirectional
completeness check awkward exactly where it matters most.

It also enforces the discipline the record needs. A row has room for a sentence,
not an essay. The reasoning that justified a decision at length lives in the
project's working record; what belongs here is the distillate — the ruling, its
reason, and the live alternative.

## The ID scheme

Every entry has an ID, and the normative text cites that ID.

1. **One ID space.** There are no families and no prefixes. Everything —
   settled rulings, open questions, superseded decisions — lives in one
   namespace so that a citation never has to encode which kind of thing it
   points at.
2. **Status is a field, not a prefix.** An entry's status can change without its
   ID changing, which is the whole reason it is a field:

   | Status | Means |
   |---|---|
   | `ruled` | decided and in force |
   | `open` | a known question the language does not yet answer; the entry records the current interim and what a proposal would have to show |
   | `superseded` | replaced by another entry, which is named in the row |
   | `defect` | a known deviation between the specification and an implementation |

3. **The ID names the topic, not the answer.** This is the load-bearing rule.
   `LAYOUT-ZONE-NAMESPACE` is right; `layout-is-its-own-namespace` is wrong,
   because if that ruling is ever reversed the ID becomes a lie and every
   citation to it has to be rewritten. Name **the question the entry settles**,
   never the settlement. An ID should still be accurate after the decision is
   reversed.
4. **UPPERCASE ASCII, hyphenated, short.** Two to four words.

   This is not cosmetic. **FigDown's keywords are lowercase ASCII by
   conformance invariant**, so a lowercase ID occupies the same visual space as
   the language itself — one reviewer read these as error codes or spec
   anchors. **The metalanguage must not look like the language.** It is the
   same reason RFC 2119 shouts MUST and SHOULD.

5. **No digits, unless the digit is part of an external name the entry cites.**
   `MSB0-BIT-NUMBERING`, `RFC-2119-KEYWORDS` and `D2-RELATIONSHIP` are legal
   because those are real names. `RULE-4-2`, `DECISION-17` and `ID-003` are
   not: a counter is how the old numbered codes come back wearing a new coat.
6. **Unique, and not nearly-unique.** Check for near-collisions before adding
   one: two IDs differing by a single word will be miscited forever — this has
   already happened in this repository, so it is checked mechanically.

## Adding an entry

A ruling earns an entry when it constrains what the language may become, or
settles something a later contributor could reasonably re-litigate. A proposal
that is **declined** for a substantive reason earns one too — that is precisely
the case the principle above exists for. Routine fixes earn neither.

Add the row to [`registry.md`](registry.md) in the same change that adds the
citation to the normative text. The two move together, and the check below is
what makes sure they did.

**What does not belong here:** how a release was executed, measurement
worksheets, task tracking, or internal development bookkeeping. Those are
working records. What survives from them is the ruling, distilled into a row.

**What also does not belong here:** a statement that is really specification. If
the question is "what does this keyword mean", the answer is in
[`spec/`](../spec/README.md). This directory is reached only when the question
is "why is it that and not something else".

## The completeness check

The registry is only worth citing if every citation resolves, so it is checked
in both directions on every release:

- **No citation without an entry.** Every ID appearing in published normative
  text has a row here. This count **must be zero**. A normative citation a
  reader cannot resolve is a conformance defect, not a cosmetic one: an
  implementer can neither comply with it nor tell that they cannot.
- **No entry without a citation.** Every row here is cited from somewhere. A row
  nothing points at is either dead weight or a sign that a citation was dropped
  when text was rewritten. This count should be zero, or the exception should be
  justified in the row.

**No exemptions.** Every code-shaped label in published content carries a
readable ID, including the normative genre-namespace rules that were once
numbered. The one thing the check must not "fix" is a **product name that
happens to look like a code** — the peer diagram language `D2`, the `C4` model,
the ANSI `X3.5` standard designation. Those are names, not codes, and they are
allowlisted by name.
