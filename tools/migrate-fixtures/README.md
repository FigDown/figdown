# Migration fixtures

Golden fixtures for [`tools/migrate-figdown.js`](../migrate-figdown.js).
The runner is [`tools/migrate-check.js`](../migrate-check.js):

```sh
node tools/migrate-check.js            # the gate
node tools/migrate-check.js --verbose  # per-fixture, plus the coverage lists
node tools/migrate-check.js --update   # move the goldens (deliberate act)
node tools/migrate-check.js 4          # name filter
```

## Why this exists

The migration tool is what makes the compatibility promise affordable: an
`X` bump costs a downstream corpus a command rather than a decade
([core.md §13.0.1](../../spec/core.md#13-stability-and-versioning-normative),
§13.4). That is only true if the tool is right — and *staying* right is
the failure mode that actually happened. The tool went on rewriting
`optional` → `conditional` for a **full release** after `PRESENCE-FLAG-SPELLING` had reversed
that direction, teaching a spelling the project had rejected. A person
reading the source found it. Nothing ran it.

[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) §3.1(c) answers that with a rule —
*the migration tool is verified end to end, not read*. This directory is
that rule mechanised.

## Layout

| file | role |
|---|---|
| `NNN-name.fd` | **input** — a document in the retired spelling |
| `NNN-name.expected.fd` | **golden** — what must be on disk after the tool has run |
| `NNN-name.report.txt` | **golden** — the report lines; absent means no report is expected |
| `NNN-name.flags` | one line of CLI flags (`--color-means=fill`, `--flag-experimental`); absent means none |
| `NNN-name.refused.fd` | marks a **refusal** fixture: the text the tool computes but must never write. `.expected.fd` is then the input unchanged |

Numbering groups the rules:

| range | rules |
|---|---|
| `0xx` | header and genre token |
| `1xx` | line-initial keyword renames |
| `2xx` | option-key renames |
| `3xx` | the 0.1 punctuation and quoting scheme |
| `4xx` | the `color=` / `text=` family, including all three refusals |
| `5xx` | the whole-file passes (`size` → `pin`) |
| `6xx` | report-only rules |
| `7xx` | the `kind=` map |
| `9xx` | negative assertions, refusal, and the cumulative chain |

## What each fixture is checked for

| check | assertion |
|---|---|
| **output** | `migrateText(input)` equals `.expected.fd`, byte for byte |
| **report** | the formatted report equals `.report.txt` (or there is none) |
| **idempotent** | a second run over the result changes nothing and records no rewrite. Asserted for **every** fixture — core §13.4 makes idempotence a MUST, and a migration a user cannot re-run safely is one they will not run at all |
| **parses** | the result introduces no engine error the input did not already have, decided by the tool's **own** `introducedErrors` (REFUSAL (c)) rather than a second copy of it |
| **negative** | the result contains no **retired rewrite direction** (below) |
| **end to end** | every input is copied to a scratch directory and the **binary** is spawned with `--write` over it; what lands on disk is compared against the same goldens. A refusal fixture must come back byte-identical with `REFUSED` in the output |

A refusal fixture inverts one of these: "a second run changes nothing" is
the wrong assertion when nothing was written, so what is asserted instead
is that the refusal is **stable** — the tool computes the same rewrite and
refuses it again, rather than accepting on the second attempt.

## The negative assertions

A suite proving the tool is right *today* does not prove it stays right,
and staying right is the failure that occurred. `RETIRED_DIRECTIONS` in
the runner names each rewrite the tool must never perform again, with the
input spelling that would set it off. **Every entry must have a live
trigger fixture** — the runner fails if one does not, because an assertion
nothing fires on is decoration.

| direction | trigger fixture |
|---|---|
| `optional` → `conditional` (`PRESENCE-FLAG-SPELLING` reversed it; the tool carried the reversed rule for a full release) | `901-negative-optional-not-conditional` |
| `route` → `path`, `via=` → `points=`, `src=`/`dst=` → `tailport=`/`headport=` (`EDGE-GEOMETRY-CONSTRUCTS` withdrew the targets, so the output would be a hard error) | `902-negative-route-not-path` |

## Do not run the migration tool over this directory

`tools/migrate-figdown.js` **refuses** it, with no override flag, for the
same reason it refuses `conformance/cases/`: the inputs here are retired
spellings **on purpose**. A `--write` run would rewrite each one into its
own expected output and then agree with itself. Move goldens with
`node tools/migrate-check.js --update`, never by migrating the inputs.

## Update policy

A golden moves only with a deliberate reason, recorded the same way a
conformance golden is: a [migrations.md](../../spec/migrations.md) entry,
or a defect fixed in the tool. Re-running `--update` because the output
changed is not a reason — it is the check being switched off.
