# Changelog

All notable changes to the FigDown standard and its reference engine are
recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/).

## Two version numbers

This file is organised by **release** version. FigDown carries two version
numbers and they are bound: **`figdown X.Y` is the first two parts of the
release version `vX.Y.Z`.** Release `v0.3.2` implements language `figdown 0.3`.

| number | versions | where it is written |
|---|---|---|
| **`figdown X.Y`** | the **language** — the document format | the header line of every `.fd` file |
| **`vX.Y.Z`** | the **release** — this repository and its engine | the git tag, and every artifact's `data-engine-version` |

**`package.json`'s `version` is a different object and may differ.** It is the
**npm package's release pin** — it carries pre-release suffixes (`0.1.0-rc.1`)
while the language and the engine are already at `0.1`/`0.1.0`, because a
package can be published for testing before the release it belongs to is
tagged. The engine's own `data-engine-version` is the authority for "which
build rendered this artifact"; `package.json` is the authority for "which npm
release you installed". Neither is derived from the other, and forcing them
equal would make one of them lie.

What each part of a release version commits to:

| part | meaning for this file |
|---|---|
| **`Z`** | **Bug fixes only.** No **Language** section may appear. No `.fd` file changes. |
| **`Y`** | **Features added, nothing removed.** A **Language** section may add constructs; it may never take one away. |
| **`X`** | **The only release that may remove support**, and it ships the migration that removal forces. |

So every heading below names the release version and the language version it
implements. **A release that moves the language says so explicitly** and carries
its migration entry; a release with no **Language** section did not touch it.

The normative policy is
[`spec/core.md` §13](spec/core.md#13-stability-and-versioning-normative); the
reader-facing summary is in the
[README](README.md#stability--read-this-before-adopting).

## How to read an entry

Each release lists only the categories that apply:

| Category | Means |
|---|---|
| **Language** | a change to the document format itself. Present only when the language version moves, or when a frozen construct changes within it. Always links its [`spec/migrations.md`](spec/migrations.md) entry and names the diagnostic that fires on the old spelling |
| **Added** | new tools, documents, genres or capabilities |
| **Changed** | behaviour that differs from the previous release without changing the language |
| **Deprecated** | still accepted, scheduled to go, with the replacement named |
| **Removed** | no longer accepted. For a frozen construct this is a **Language** change with a migration, never a silent drop; for an **experimental** construct it may be a plain removal |
| **Fixed** | engine, tooling or documentation defects, including specification/implementation discrepancies resolved |
| **Experimental** | anything outside the compatibility promise. Kept in its own category so a reader building on the frozen surface can skip it |

**This file is the release narrative, not the migration authority.** When a
change requires documents to be rewritten, the mechanical rewrite rule and its
named diagnostic live in [`spec/migrations.md`](spec/migrations.md); the entry
here links to it and does not restate it.

Statuses referred to above are defined in [`spec/README.md`](spec/README.md).

## Unreleased

Nothing yet.

## v0.1.0 — unreleased

**Language version: `0.1`.** The first release of the FigDown standard.

The frozen core framework; three frozen genres (`block`, `bitfield`, `table`);
the normative semantic model and its reading-agent contract; the conformance
corpus; the reference engine and browser editor; the command-line tooling; and
the agent skill.

**Language `0.x` is a preview and is NOT stable** — see
[Stability](README.md#stability--read-this-before-adopting). "Frozen" names the
scope of the change-management promise, not the absence of change.

Detail is filled in when the release is cut.

<!--
Entries below this line are added at release. Categories in the order given in
"How to read an entry"; omit any that do not apply.

### Language
### Added
### Changed
### Removed
### Fixed
### Experimental
-->
