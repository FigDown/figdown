# Aborted one-shot run — does not score

These 17 transcripts (`N1`-`N4` × condition `A` × all 4 seats, plus one
in-flight `T1.A.r3`) are what condition `A` produced under this probe's
FIRST harness design, before it was redesigned. **They are not scored by
`author-probe.js --write-results` and must never be fed back into it**: the
one-shot design they were taken under is an INSTRUMENT DEFECT, not a
measurement — see `decisions/registry.md` for the ruling
and the full record.

**Why they do not score.** The original harness gave an author exactly one
cold call with no validator feedback and no second attempt. Under that
design, first-pass validity floors near 0% for BOTH conditions (a cold
model with no tool access reliably gets FigDown's exact keyword spellings
wrong on the first try, regardless of what documentation it was handed —
see the failure shapes below), which makes `decisions/registry.md`
§4's non-inferiority criterion ("B's normal-task validity not lower than
A's by more than 10 points") **vacuously passable**: 0% cannot be more than
10 points below 0%. The instrument could not have failed that half of the
gate no matter what the candidate SKILL text said. That is a defect in the
MEASUREMENT, not a finding about the candidate clauses, and it was caught
before any condition-`B` call was made — the run was killed with condition
`A` partial (14 of 16 normal chains complete, one trap chain mid-flight)
and zero condition-`B` data collected, which is what keeps the redesign
that followed legitimate rather than a retroactive rule change chasing
condition-`A`'s numbers away.

**The incidental finding, preserved because it is real data even though the
run does not score:** 14/14 completed normal chains were invalid on the
one shot they got, at BOTH models, with the full real `SKILL.md` pasted in.
Two failure shapes recur across the transcripts here:

1. **The genre name used as the declaration keyword** — `block poller
   "Poller"` instead of `node poller "Poller"` (`N1.A.r1.json`,
   `N4.A.r1.json`, `T1.A.r3.json`, and others): a cold model reasonably
   guesses that a `block`-genre document declares its parts with the word
   `block`, because SKILL.md's own genre-independent text never states the
   actual keyword — that spelling lives in `reference/scene.md`, which the
   router table names but the cold room has no tool to fetch.
2. **A bare arrow with no `edge` keyword** — `poller -> normalizer` instead
   of `edge poller -> normalizer` (`N2.A.r1.json` and others): the same
   shape of guess, for the connector.

Both are exactly the kind of defect a one-round validator message would
name immediately and precisely (`"block" is not allowed in genre block`,
`edge needs an operator: -> <- -- <->`) and a second attempt would very
likely fix — which is itself the argument for the round-based redesign:
**the validate-fix loop is load-bearing for this task, not auxiliary.** A
harness that gives an author one shot with the SKILL text alone and no
feedback is not measuring what the SKILL text teaches about repair,
truthfulness or delivery order; it is measuring whether a cold model can
memorize an exact keyword table from one read, which none of the three
candidate clauses claims to help with.
