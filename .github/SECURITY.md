# Security policy

## Reporting a vulnerability

**Do not open a public issue.** Report privately, either through GitHub's
private vulnerability reporting on this repository (Security → Report a
vulnerability), or by email to `security@figdown.org`. Include the affected
component, a minimal input that reproduces the problem, and what you observed.

Expect an acknowledgement, then a fix or a ruling with its reasoning. Please
give the project a chance to ship a fix before disclosing publicly.

## What is in scope

Two components accept input that may not be trusted:

- **the npm package `figdown`** — the library builds in `dist/` and the
  `figdown-svg` command-line tool. It parses `.fd` text and emits SVG, so the
  interesting classes are unbounded resource use on hostile input, and any path
  by which source text reaches the output SVG unescaped.
- **`integrations/kroki-service/`** — an HTTP service that renders submitted
  documents, which means it parses untrusted input by design. Anyone deploying
  it should treat it as an untrusted-input boundary: run it isolated, behind a
  gateway, with request-size and timeout limits.

The editor (`editor/figdown.html`) renders whatever the person operating it
opens. It is a local tool, not a service, and is in scope only for issues that
would also affect the library it is generated from.

## What is not a vulnerability

A document that fails to parse, renders unexpectedly, or produces a poor layout
is a bug, not a security issue — use the bug-report issue form. A determinism
breakage is likewise a bug, and a loud one: see
[`conformance/README.md`](../conformance/README.md).

A change to the language itself is neither; it goes through the proposal route
in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Supported versions

FigDown is pre-1.0, and **0.x is a preview that carries no stability promise**.
Only the current release line receives fixes. Older released versions remain
*runnable* through the archived engine page published with each release — that
is an availability promise, not a maintenance one, and no security fix is
backported to it. The versioning policy is
[`spec/core.md` §13](../spec/core.md#13-stability-and-versioning-normative).
