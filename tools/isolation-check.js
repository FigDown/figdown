#!/usr/bin/env node
// isolation-check.js — the FROZEN set must survive deletion of the
// EXPERIMENTAL set.
//
// The ruling this tool mechanises:
//
//     Delete the experimental file set. What remains must still be a
//     complete, self-consistent standard with no dangling normative
//     references.
//
// FigDown separates frozen from experimental material at the FILE level, not
// the paragraph level, so the criterion is testable by deletion. Isolation
// does NOT mean a frozen document never mentions an experimental construct —
// the registry in `spec/core.md` §10 has to list `plane`, `bundle`,
// `threshold`, `band`, `path` and `routing`, because a CLOSED language is
// obliged to say what exists. What isolation means is narrower and harder:
//
//   * the frozen set DEFINES nothing experimental, and
//   * the frozen set DEPENDS on nothing experimental — no normative sentence
//     in a frozen file may require reading an experimental file to be
//     complete;
//   * therefore every frozen mention must be MARKED as experimental and must
//     point at where the definition lives.
//
// Nothing in the repository was checking any of that. `fence-check.js` asks
// whether a snippet parses, `comment-check.js` asks whether a `.fd` comment
// teaches a retired spelling — neither can see a frozen §-reference into a
// file that is about to be cut, and a cut is exactly the operation this
// separation exists to survive.
//
// THE EXPERIMENTAL FILE SET (one place in the code: `isExperimentalPath`)
// ----------------------------------------------------------------------
// A file is EXPERIMENTAL if either holds:
//
//   1. any segment of its repo-relative path is exactly `experimental`
//      — `spec/genres/experimental/topology.md`,
//        `conformance/experimental/700-chart-basic.fd`,
//        `examples/reference/experimental/topology.fd`;
//   2. its basename is `experimental.md`
//      — `spec/experimental.md`, `spec`.
//
// Everything else scanned is FROZEN. The rule is deliberately CONVENTION-
// BASED and not a manifest: a new experimental file joins the set by being
// put in the right place, and there is no second list to keep in step. A
// manifest would be one more thing that can be stale on the day of the cut,
// which is the day it must not be.
//
// TWO TIERS — what is gated where
// -------------------------------
// The first full run produced 919 findings. 919 findings is a report, not a
// gate, so the enforced scope is narrower than the scanned scope and the
// difference is stated rather than implied. Every scanned file is labelled in
// the verdict table with the tier it is held to.
//
//   TIER 1 — LINK INTEGRITY, over EVERY frozen `.md` in scope.
//            `dangling-link` and `unmarked-link`. A broken relative link is a
//            defect anywhere, in a change log as much as in the standard, and
//            this is the half that catches a file move with a forgotten
//            inbound link.
//
//   TIER 2 — ISOLATION, over the frozen NORMATIVE STANDARD only.
//            `unmarked-citation` and `definition-in-frozen`, over the explicit
//            list in `TIER2_FILES` / `isTier2`: `spec/core.md` (+ zh), every
//            `.md` directly in `spec/genres/` (README, block, bitfield, table
//            and their zh twins — NOT `genres/experimental/`, which is
//            experimental anyway), `conformance/README.md`,
//            `examples/reference/index.md` (+ zh), `.github/CONTRIBUTING.md`,
//            `tools/README.md`.
//
// WHY TIER 2 IS NARROWER — a stated exposure, not a loophole
// ----------------------------------------------------------
// Three classes of frozen document are scanned for links and NOT held to the
// isolation checks. Each exclusion has a reason, and one of them is an open
// hole that must not be read as a clean result:
//
//   CHANGE LOGS AND HISTORY — `spec/migrations*.md`, `spec/migrate*.md`,
//     `spec/core.md`, `conformance/DISCREPANCIES.md`,
//     `conformance/ERROR-COVERAGE.md`.
//     A migration entry's JOB is to name a construct as it stood at the time,
//     including constructs that are now experimental and constructs that are
//     now retired. Demanding an experimental marker on those sentences would
//     either falsify the record ("this was experimental then" when it was not)
//     or bury it under markers until it stops being readable as history. The
//     record is written once and read as of its date.
//
//   THE TEACHING AND guide/authoring.md GUIDES — `guide/agents.md*`, `guide/authoring.md*`,
//     `guide/expressing.md*`, `guide/layout.md*`, `guide/showcase.md*`, `README*`, `skill/`.
//     These teach the WHOLE language, experimental constructs included, and
//     they mark them INLINE — inside the fence, as `# EXPERIMENTAL` /
//     `# EXPERIMENTAL` comments on the very line being taught — which is a real
//     marking discipline but not a FILE-level one, and file-level is what this
//     tool can check and what the deletion criterion is stated in.
//     STATE IT PLAINLY: this is a REMAINING EXPOSURE, not a clean result. A
//     reader who wants only the frozen surface still has to filter these
//     documents by eye. They are NOT part of the file-level isolation. Moving
//     their experimental teaching into files of its own is UNFINISHED WORK —
//     it is not a decision that the work is unnecessary, and this exclusion
//     must not be cited as one.
//
// THE CHECKS
// ----------
//   dangling-link        [tier 1] a relative markdown link whose target does
//                        not exist. The "no dangling normative references"
//                        half of the ruling, and what catches a file move that
//                        forgot an inbound link.
//   unmarked-link        [tier 1] a link from a frozen file INTO the
//                        experimental set that is not marked — a frozen
//                        sentence sending the reader into experimental
//                        material without saying so.
//                        Expect this one to read 0, and know why: the
//                        convention above puts the word "experimental" in
//                        every experimental path, so the link TEXT marks its
//                        own block and the check cannot fire while the
//                        convention holds. It is kept, and kept honest at 0,
//                        because it is the check that comes alive the moment
//                        an experimental file is named without the word in
//                        its path — the same day the convention stops being
//                        self-announcing is the day this stops being free.
//   unmarked-citation    [tier 2, REPORT-ONLY] a code-span citation of an
//                        experimental construct (`plane`, `band`, `topology`, …)
//                        sitting in an unmarked block. See below: this one is
//                        counted and named, never failed.
//                        Six spellings carried a NAMED EXCLUSION from it
//                        in an earlier release — `path`,
//                        `routing`, `points=`, `tailport=`, `headport=`,
//                        `routing=` — on the sole ground that 0.1 was
//                        going to delete the constructs, so marking their
//                        citations would have been throwaway work. It did
//                        (EDGE-GEOMETRY-CONSTRUCTS), the spellings are gone from the language, and
//                        the exclusion constant went with them. It was a
//                        one-release window and it is closed; nothing here is
//                        excluded from unmarked-citation any more.
//   definition-in-frozen [tier 2] a frozen file DEFINING an experimental
//                        construct. Two mechanical proxies: (a) a ```figdown
//                        fence whose line begins with an experimental keyword —
//                        that is a worked definition, not a citation; (b) a
//                        heading naming an experimental keyword without
//                        carrying `EXPERIMENTAL` on the heading line.
//
// WHAT FAILS AND WHAT IS ONLY COUNTED
// -----------------------------------
// `--strict` exits 1 on `dangling-link`, `unmarked-link` and
// `definition-in-frozen`. It does NOT exit 1 on `unmarked-citation`, which is
// REPORT-ONLY and is labelled `WARN` in the per-file table so it never reads
// like the other three.
//
// The reason is that the marker rule is a PROXY, and a proxy that cannot tell
// a registry row from a genuine dependency has no business failing a build.
// `spec/core.md` §10 is obliged to name every experimental construct — that is
// what a closed language's registry IS — and a mechanical block-marker test
// cannot distinguish that obligation from a frozen sentence that silently
// leans on experimental material. The other three checks do not have that
// problem: a broken link is broken, and a fence that defines `plane` defines
// it, whatever the surrounding prose says.
//
// STATE IT AS WHAT IT IS: a DEFERRED OBLIGATION, NOT A CLEAN RESULT. The
// count is printed on its own footer line with a per-construct breakdown so
// the drift stays VISIBLE while it is not enforced. Driving it to zero is
// unfinished work, and a green `--strict` is not evidence that it was done.
//
// BLOCK SCOPE — a deliberate looseness
// ------------------------------------
// A marker applies to a BLOCK: a contiguous run of non-blank lines. A
// paragraph, a list item, a heading and a markdown TABLE are each therefore
// "inside some block", and a table is ONE block — so a single EXPERIMENTAL cell
// marks every row of that table. That is accepted, exactly the way
// `comment-check.js` accepts its contiguous-comment-block scope: the units
// this repository actually writes are separated by blank lines, and a
// per-sentence scope would demand a marker on every row of §10's registry,
// whose whole purpose is to say which rows are experimental. The tradeoff is
// under-reporting inside one table, never over-reporting across paragraphs.
//
// ONE BLOCK OF REACH. A block counts as marked if IT or the block IMMEDIATELY
// PRECEDING IT carries a marker. This was measured, not guessed: of the 860
// citations the first strict-block run reported, the dominant artefact was an
// INTRODUCING SENTENCE separated from the list it introduces by one blank
// line — `guide/agents.md` says "Experimental as of 0.1:", blank line,
// then the bullet list carrying every citation. A reader takes the marker as
// governing that list, because it does; a rule that does not is measuring
// blank lines rather than meaning. The reach is exactly ONE block, so a
// marker never leaks down a whole section. It does NOT relax the heading
// proxy in `definition-in-frozen`: a heading is a promise about everything
// beneath it and must carry its own marker.
//
// Two further scoping decisions, stated so they are not mistaken for bugs:
//
//   * FENCED CODE is not prose. Lines inside a ``` fence are exempt from the
//     citation check (a figdown sample legitimately spells `plane`) and from
//     link extraction (a link written inside a fence is a sample of syntax,
//     not a reference). A ```figdown fence is instead handled by
//     definition-in-frozen.
//   * A heading counts as marked only for the LITERAL `EXPERIMENTAL` or uppercase
//     `EXPERIMENTAL`, not for a lowercase "experimental" in running prose;
//     the block rule is the case-insensitive one. A heading is a promise
//     about the section under it and is held to the louder spelling.
//
// No engine is loaded. This is a documentation gate, and coupling it to
// `figdown.html` would make the standard's own separation un-checkable from a
// checkout where the engine failed to load.
//
// Usage:
//   node tools/isolation-check.js [--strict] [--verbose] [<file.md | dir> ...]
//
//   default paths (resolved from the project root, independent of CWD):
//     spec/                 recursive
//     conformance/          recursive
//     examples/reference/   recursive
//     <project root>/*.md   NOT recursive — just the .md files sitting there
//     tools/README.md
//     .github/CONTRIBUTING.md
//   never searched: .git/, node_modules/, any dot-directory
//   only `.md` is analysed; other files met while walking are counted as
//   `skipped` and otherwise ignored
//
//   --strict   exit 1 on any dangling-link / unmarked-link /
//              definition-in-frozen finding. unmarked-citation NEVER fails.
//   --verbose  print every scanned file, not only the ones with findings
//
// Exit codes: 0 always (report-only, as fence-check.js / strip-check.js) ·
//             1 only under --strict with at least one FAILING finding ·
//             2 tool error.
//
// COVERAGE IS A NUMBER. The footer prints how many `.md` files were scanned,
// split frozen (std) / frozen (link-only) / experimental, with the `find`
// command that reproduces the total — a gate whose scope cannot be checked is
// a gate that can quietly stop scanning. The tier-2 number is the one to
// watch: if the standard grows a file and it is not on the `TIER2_FILES` list,
// that number does not move.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Default scan scope. `recursive: false` means "the .md files in this
// directory only" — the project root, whose subdirectories are covered by
// their own entries or deliberately not covered at all.
const DEFAULT_SCOPE = [
  { p: 'spec',               recursive: true  },
  { p: 'conformance',        recursive: true  },
  { p: 'examples/reference', recursive: true  },
  { p: '.',                  recursive: false },
  { p: 'guide',              recursive: true  },
  { p: 'tools/README.md',    recursive: false },
  { p: '.github/CONTRIBUTING.md', recursive: false },
];

const EXCLUDED_DIRS = new Set(['.git', 'node_modules']);

// Local, untracked, never committed. Excluded by NAME wherever they turn up,
// including when named explicitly on the command line: reporting on a file
// that is not in the repository is noise at best and, since their links point
// at other local companions, a permanent false dangling-link at worst.
const EXCLUDED_FILES = new Set([]);

// ── Tier 2: the frozen NORMATIVE STANDARD ────────────────────────────────────
//
// The isolation checks run here and nowhere else. See the header for what is
// excluded and why — in particular that the teaching guides' exclusion is an
// open exposure, not a ruling that the work is unnecessary.

const TIER2_FILES = new Set([
  'spec/core.md',
  'conformance/README.md',
  'examples/reference/index.md',
  '.github/CONTRIBUTING.md',
  'tools/README.md',
]);

/**
 * Tier 2 membership. `spec/genres/*.md` is a RULE rather than a list so a new
 * normative genre document is gated on the day it lands; `spec/genres/
 * experimental/` is one directory deeper and is experimental by the path
 * convention anyway.
 */
function isTier2(relPath) {
  if (TIER2_FILES.has(relPath)) return true;
  return /^spec\/genres\/[^/]+\.md$/.test(relPath);
}

// ── The experimental file set ────────────────────────────────────────────────
//
// The single mechanical rule. Everything else in this tool asks this
// function; nothing else knows what "experimental" means.

function isExperimentalPath(relPath) {
  const segs = relPath.split('/').filter(Boolean);
  if (segs.includes('experimental')) return true;
  const base = segs[segs.length - 1] || '';
  return base === 'experimental.md';
}

// ── The experimental vocabulary ──────────────────────────────────────────────
//
// Kept as literal lists rather than read out of the engine on purpose: the
// engine knows which spellings PARSE, not which ones the standard has
// declared outside its compatibility promise. That declaration lives in
// core §10, and it is the declaration this tool enforces.

// The four EXPERIMENTAL keywords (core §10). These drive definition-in-frozen.
// There were six until 0.1 (EDGE-GEOMETRY-CONSTRUCTS), when `path` and `routing` were
// WITHDRAWN from the language: a withdrawn construct is not an experimental
// one, it is not one at all, so it leaves this list rather than staying on it
// with an exemption.
const EXPERIMENTAL_KEYWORDS = [
  'plane', 'bundle', 'threshold', 'band',
];

// Option keys belonging to experimental constructs. `points=`, `tailport=`,
// `headport=` and `routing=` left with `path` (EDGE-GEOMETRY-CONSTRUCTS).
const EXPERIMENTAL_OPT_KEYS = [
  'plane=', 'z-index=', 'extend=', 'offset=',
];

// The three experimental genres (core §4, §10).
const EXPERIMENTAL_GENRES = ['topology', 'flowchart', 'timing'];

// THE `SCHEDULED_FOR_REMOVAL` EXCLUSION IS GONE (EDGE-GEOMETRY-CONSTRUCTS).
//
// In an earlier release this file carried a named set — `path`,
// `routing`, `points=`, `tailport=`, `headport=`, `routing=` — excluded from
// `unmarked-citation` and from nothing else, on one stated ground: the next
// release was going to delete the constructs, so every marker added to their
// citations would have been removed again in the same release. The note beside
// it said to re-enable them the moment that stopped being true.
//
// It did not stop being true. EDGE-GEOMETRY-CONSTRUCTS withdrew all six from the language, the
// spellings no longer name anything experimental, and their citations are now
// ordinary historical references in the change logs. The constant is deleted
// rather than emptied: an empty exclusion set is a slot inviting a refill, and
// the window it existed for was one release wide by construction.
//
// Nothing is excluded from `unmarked-citation` today. The count this tool
// reports is therefore the whole count, and it is still REPORT-ONLY — a
// deferred obligation, not a clean result.

// A citation is an exact whole code span, so `` `plane` `` is a citation and
// `` `plane=blue` `` is not: a span that says more than the construct name is
// carrying its own context.
const CITATIONS = new Set([
  ...EXPERIMENTAL_KEYWORDS,
  ...EXPERIMENTAL_OPT_KEYS,
  ...EXPERIMENTAL_GENRES,
]);

const KEYWORD_RE = new RegExp('\\b(' + EXPERIMENTAL_KEYWORDS.join('|') + ')\\b', 'i');

// ── Line-level scanning primitives ───────────────────────────────────────────

const FENCE_RE = /^\s*(`{3,}|~{3,})\s*(\S*)/;

/**
 * Classifies every line of a markdown file as inside or outside a fenced code
 * block, and records the info string of the fence it is inside. The opening
 * and closing fence lines themselves count as inside.
 *
 * Returns { fenced: boolean[], info: (string|null)[] } indexed by line.
 */
function fenceMap(lines) {
  const fenced = new Array(lines.length).fill(false);
  const info   = new Array(lines.length).fill(null);
  let open = null;                       // { marker, info }
  for (let i = 0; i < lines.length; i++) {
    const m = FENCE_RE.exec(lines[i]);
    if (!open) {
      if (m) {
        open = { marker: m[1][0], len: m[1].length, info: (m[2] || '').trim() };
        fenced[i] = true;
        info[i] = open.info;
      }
      continue;
    }
    fenced[i] = true;
    info[i] = open.info;
    // A closing fence is the same character, at least as long, with no info.
    if (m && m[1][0] === open.marker && m[1].length >= open.len && !m[2]) open = null;
  }
  return { fenced, info };
}

/**
 * Blocks: maximal runs of contiguous NON-BLANK lines. Returns an array with
 * one block index per line (`-1` for blank lines) plus the blocks themselves.
 */
function blockMap(lines) {
  const blocks = [];
  const of = new Array(lines.length).fill(-1);
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) { cur = null; continue; }
    if (!cur) { cur = { from: i, to: i, lines: [] }; blocks.push(cur); }
    cur.to = i;
    cur.lines.push(i);
    of[i] = blocks.length - 1;
  }
  return { blocks, of };
}

/** Whole markdown code spans on a line: `` `x` ``, not the inner text of ``…``. */
function codeSpans(line) {
  const out = [];
  const re = /(?<!`)`([^`\n]+)`(?!`)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1]);
  return out;
}

/** `[text](target)` links, with an optional `"title"`. Reference links are not used in this repo. */
function links(line) {
  const out = [];
  const re = /\[([^\]\n]*)\]\(\s*<?([^)<>\s]+)>?(?:\s+"[^"\n]*")?\s*\)/g;
  let m;
  while ((m = re.exec(line))) out.push({ text: m[1], target: m[2] });
  return out;
}

/**
 * Resolves a markdown link target to an absolute path, or null when the link
 * is not a repo-relative one. Any `scheme:` prefix (http, https, mailto, and
 * anything else) and a bare `#anchor` are not repo references; a `#anchor`
 * suffix is stripped before resolving; a leading `/` is read as repo-root
 * relative, the way a site-rooted link is served.
 */
function resolveTarget(target, fromFile) {
  let t = target.trim();
  if (!t || t.startsWith('#')) return null;
  if (/^[a-z][a-z0-9+.\-]*:/i.test(t)) return null;
  const hash = t.indexOf('#');
  if (hash >= 0) t = t.slice(0, hash);
  if (!t) return null;
  try { t = decodeURIComponent(t); } catch (e) { /* leave as written */ }
  if (t.startsWith('/')) return path.resolve(ROOT, '.' + t);
  return path.resolve(path.dirname(fromFile), t);
}

// ── The file check ───────────────────────────────────────────────────────────

function checkFile(absFile, tier2) {
  const text  = fs.readFileSync(absFile, 'utf8');
  const lines = text.split(/\r?\n/);
  const { fenced, info } = fenceMap(lines);
  const { blocks, of }   = blockMap(lines);

  // Pass 1 — mark blocks. A block CARRIES a marker when any of its lines says
  // EXPERIMENTAL / experimental (case-insensitively), or holds a link INTO the
  // experimental file set (a link that names the material is a marker even
  // when the sentence around it does not repeat the word).
  const carries = blocks.map(() => false);
  for (let b = 0; b < blocks.length; b++) {
    for (const i of blocks[b].lines) {
      const line = lines[i];
      if (/EXPERIMENTAL/.test(line) || /experimental/i.test(line)) { carries[b] = true; break; }
      let hit = false;
      for (const l of links(line)) {
        const abs = resolveTarget(l.target, absFile);
        if (abs && isExperimentalPath(path.relative(ROOT, abs).split(path.sep).join('/'))) {
          hit = true; break;
        }
      }
      if (hit) { carries[b] = true; break; }
    }
  }

  // ONE BLOCK OF REACH — a block is MARKED if it, or the block immediately
  // preceding it in document order, carries a marker. The introducing
  // sentence of a list is one blank line above the list; see the header.
  const marked = carries.map((c, b) => c || (b > 0 && carries[b - 1]));

  const found = [];
  const seen = new Set();
  // `what` names the construct a finding is about, so the footer can print a
  // per-construct breakdown without re-parsing its own output.
  const add = (line, check, detail, what) => {
    const key = line + ' ' + check + ' ' + detail;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ line, check, detail, what: what || null });
  };
  const isMarked = i => of[i] >= 0 && marked[of[i]];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;

    // ── 1 & 2 — links (prose only; a link inside a fence is a sample) ────────
    if (!fenced[i]) {
      for (const l of links(line)) {
        const abs = resolveTarget(l.target, absFile);
        if (!abs) continue;
        const rel = path.relative(ROOT, abs).split(path.sep).join('/');
        if (!fs.existsSync(abs)) {
          add(n, 'dangling-link', l.target + '  (from [' + l.text + '])');
          continue;
        }
        if (isExperimentalPath(rel) && !isMarked(i))
          add(n, 'unmarked-link', l.target + '  -> experimental, block carries no marker');
      }
    }

    // ── 3 — code-span citations (prose only) — TIER 2 ───────────────────────
    if (tier2 && !fenced[i]) {
      for (const span of codeSpans(line)) {
        const t = span.trim();
        if (!CITATIONS.has(t)) continue;
        if (isMarked(i)) continue;
        add(n, 'unmarked-citation',
          '`' + t + '`  cited without an experimental marker', t);
      }
    }

    // ── 4b — a heading naming an experimental keyword — TIER 2 ──────────────
    if (tier2 && !fenced[i]) {
      const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (h) {
        const m = KEYWORD_RE.exec(h[2]);
        // The heading LINE itself must carry the marker: a heading is a
        // promise about the whole section beneath it.
        if (m && !/EXPERIMENTAL/.test(line))
          add(n, 'definition-in-frozen',
            'heading names experimental `' + m[1].toLowerCase() + '` and is not marked: ' + h[2]);
      }
    }

    // ── 4a — a ```figdown fence DEFINING an experimental keyword — TIER 2 ───
    // `!FENCE_RE.test(line)` excludes the opening and closing fence lines,
    // which fenceMap() counts as inside the fence.
    if (tier2 && fenced[i] && info[i] === 'figdown' && !FENCE_RE.test(line)) {
      const t = line.trim();
      if (t && !t.startsWith('#')) {
        const first = t.split(/\s+/)[0];
        if (EXPERIMENTAL_KEYWORDS.includes(first))
          add(n, 'definition-in-frozen',
            '```figdown fence defines experimental `' + first + '`: ' + t);
      }
    }
  }

  found.sort((a, b) => a.line - b.line ||
    (a.check < b.check ? -1 : a.check > b.check ? 1 : 0) ||
    (a.detail < b.detail ? -1 : a.detail > b.detail ? 1 : 0));
  return found;
}

// ── File collection ──────────────────────────────────────────────────────────

const stats = { skipped: 0, excluded: 0 };

function walk(abs, recursive, out) {
  for (const e of fs.readdirSync(abs, { withFileTypes: true })
                    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const full = path.join(abs, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (!recursive) continue;
      if (e.name.startsWith('.') || EXCLUDED_DIRS.has(e.name)) continue;
      walk(full, true, out);
      continue;
    }
    if (!e.isFile()) continue;
    if (EXCLUDED_FILES.has(e.name)) { stats.excluded++; continue; }
    if (e.name.endsWith('.md')) out.push(full);
    else stats.skipped++;                 // .fd / .svg / .js / … counted, not analysed
  }
  return out;
}

function collect(p, recursive, out) {
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) throw new Error('no such path: ' + p);
  const st = fs.statSync(abs);
  if (st.isFile()) {
    // By NAME, even when named explicitly on the command line.
    if (EXCLUDED_FILES.has(path.basename(abs))) { stats.excluded++; return out; }
    if (abs.endsWith('.md')) out.push(abs);
    else stats.skipped++;
    return out;
  }
  return walk(abs, recursive, out);
}

// ── Report ───────────────────────────────────────────────────────────────────

const TIER1_CHECKS = ['dangling-link', 'unmarked-link'];
const TIER2_CHECKS = ['unmarked-citation', 'definition-in-frozen'];
const CHECKS = [...TIER1_CHECKS, ...TIER2_CHECKS];

// What `--strict` fails on. `unmarked-citation` is deliberately absent — the
// marker rule is a proxy that cannot tell §10's registry from a real
// dependency, so it is counted and named rather than enforced. See the header.
const REPORT_ONLY_CHECKS = new Set(['unmarked-citation']);
const isFailing = c => !REPORT_ONLY_CHECKS.has(c);
const FAILING_CHECKS = CHECKS.filter(isFailing);
const TIER_OF = Object.fromEntries([
  ...TIER1_CHECKS.map(c => [c, 1]),
  ...TIER2_CHECKS.map(c => [c, 2]),
]);
const pad = (s, n) => String(s).padEnd(n);

function rel(p) {
  const r = path.relative(ROOT, p).split(path.sep).join('/');
  return r.startsWith('..') ? p : r;
}

function main() {
  const args = process.argv.slice(2);
  const strict  = args.includes('--strict');
  const verbose = args.includes('--verbose');
  for (const a of args) {
    if (a.startsWith('-') && a !== '--strict' && a !== '--verbose') {
      console.error('usage: node tools/isolation-check.js [--strict] [--verbose] [<file.md | dir> ...]');
      process.exit(2);
    }
  }
  const explicit = args.filter(a => !a.startsWith('-'));

  const scope = explicit.length
    ? explicit.map(p => ({ p, recursive: true }))
    : DEFAULT_SCOPE;

  const files = [...new Set(scope.flatMap(s => collect(s.p, s.recursive, [])))].sort();

  const isDir = p => {
    const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
    return fs.existsSync(abs) && fs.statSync(abs).isDirectory();
  };
  console.log('isolation-check  files=' + files.length +
    '  scope=' + scope.map(s => s.p + (s.recursive && isDir(s.p) ? '/**' : '')).join(' '));
  console.log('  experimental set: any path segment `experimental`, or basename ' +
    'experimental.md');
  console.log('  criterion: delete the experimental set and what remains must still ' +
    'be a complete, self-consistent standard');
  console.log('  tier 1 (link integrity: ' + TIER1_CHECKS.join(', ') +
    ') — every frozen .md in scope');
  console.log('  tier 2 (isolation: ' + TIER2_CHECKS.join(', ') +
    ') — the frozen NORMATIVE STANDARD only; see the header for what is');
  console.log('           excluded and why. The teaching guides\' exclusion is a ' +
    'REMAINING EXPOSURE, not a clean result.');
  console.log('  --strict FAILS on: ' + FAILING_CHECKS.join(', ') +
    '.  unmarked-citation is REPORT-ONLY (WARN) — a deferred obligation, not a clean result.');
  console.log('  excluded from unmarked-citation: NOTHING. The one exclusion this tool ever ' +
    'carried —');
  console.log('           `path` `routing` `points=` `tailport=` `headport=` `routing=` — was ' +
    'justified by their');
  console.log('           scheduled removal, and 0.1 (EDGE-GEOMETRY-CONSTRUCTS) removed them. The window is ' +
    'closed.');

  const rows = [];
  let std = 0, linkOnly = 0, experimental = 0;
  const totals = Object.fromEntries(CHECKS.map(c => [c, 0]));

  for (const f of files) {
    const r = rel(f);
    const exp = isExperimentalPath(r);
    const t2 = !exp && isTier2(r);
    if (exp) experimental++; else if (t2) std++; else linkOnly++;
    // Checks run over FROZEN files only — an experimental file is allowed to
    // define and cite experimental material; that is what it is for.
    const findings = exp ? [] : checkFile(f, t2);
    for (const x of findings) totals[x.check]++;
    const counts = Object.fromEntries(CHECKS.map(c => [c, findings.filter(x => x.check === c).length]));
    rows.push({
      rel: r,
      cls: exp ? 'experimental' : t2 ? 'frozen (std)' : 'frozen (link-only)',
      findings, counts,
    });
  }

  const shown = verbose ? rows : rows.filter(x => x.findings.length);

  if (shown.length) {
    const w = Math.max(4, ...shown.map(x => x.rel.length));
    const cw = Math.max(5, ...shown.map(x => x.cls.length));
    console.log('');
    console.log(pad('file', w) + '  ' + pad('class', cw) + '  findings');
    console.log('-'.repeat(w) + '  ' + '-'.repeat(cw) + '  ' + '-'.repeat(8));
    for (const x of shown) {
      // FAIL / WARN prefixes so the report-only check never reads like the
      // three that fail the build.
      const summary = x.findings.length
        ? CHECKS.filter(c => x.counts[c])
            .map(c => (isFailing(c) ? 'FAIL ' : 'WARN ') + c + ' ' + x.counts[c])
            .join('  ')
        : 'ok';
      console.log(pad(x.rel, w) + '  ' + pad(x.cls, cw) + '  ' + summary);
    }
  }

  const withFindings = rows.filter(x => x.findings.length);
  for (const tier of [1, 2]) {
    const checks = tier === 1 ? TIER1_CHECKS : TIER2_CHECKS;
    const files_ = withFindings.filter(x => x.findings.some(f => TIER_OF[f.check] === tier));
    if (!files_.length) continue;
    console.log('');
    console.log('Tier ' + tier + ' findings (' + checks.join(', ') +
      ') — <file>:<line>  <check>  <detail>');
    for (const x of files_) {
      console.log('');
      for (const fnd of x.findings)
        if (TIER_OF[fnd.check] === tier)
          console.log('  ' + x.rel + ':' + fnd.line + '  ' + fnd.check + '  ' + fnd.detail);
    }
  }

  const sum = cs => cs.reduce((a, c) => a + totals[c], 0);
  const t1 = sum(TIER1_CHECKS), t2 = sum(TIER2_CHECKS), total = t1 + t2;
  const failing = sum(FAILING_CHECKS);
  const cited = totals['unmarked-citation'];
  const frozen = std + linkOnly;

  // Per-construct breakdown of the report-only check, most-cited first, ties
  // broken by name so two runs print the same order.
  const byConstruct = new Map();
  for (const x of rows)
    for (const f of x.findings)
      if (f.check === 'unmarked-citation' && f.what)
        byConstruct.set(f.what, (byConstruct.get(f.what) || 0) + 1);
  const breakdown = [...byConstruct.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => '`' + k + '` ' + v).join('  ');

  console.log('');
  console.log('scanned ' + files.length + ' .md file(s)  frozen (std) ' + std +
    '  frozen (link-only) ' + linkOnly + '  experimental ' + experimental +
    '  (non-.md skipped: ' + stats.skipped +
    ', local untracked companions excluded by name: ' + stats.excluded + ')');
  console.log('  verify the count:  find spec conformance examples/reference -name \'*.md\' ' +
    ' | wc -l   plus the root *.md files and tools/README.md.');
  console.log('findings ' + total +
    '  |  tier 1 ' + t1 + ': ' + TIER1_CHECKS.map(c => c + ' ' + totals[c]).join('  ') +
    '  |  tier 2 ' + t2 + ': ' + TIER2_CHECKS.map(c => c + ' ' + totals[c]).join('  '));
  console.log('  tier 1 ran over ' + frozen + ' frozen file(s); tier 2 ran over ' + std +
    ' of them; ' + experimental + ' experimental file(s) are classified and counted, not checked');
  console.log('failing checks (' + FAILING_CHECKS.join(', ') + '): ' + failing);

  console.log('');
  console.log('unmarked-citation ' + cited + '  REPORT-ONLY — a DEFERRED OBLIGATION, NOT A CLEAN RESULT.');
  if (cited) console.log('  by construct: ' + breakdown);
  console.log('  The marker rule is a proxy and cannot tell a §10 registry row from a genuine');
  console.log('  dependency, so this is reported to keep the drift VISIBLE rather than enforced.');
  console.log('  Driving it to zero is unfinished work; a green --strict is not evidence it was done.');
  console.log('  Nothing is excluded from this count (the 0.1 exclusion closed).');

  console.log('');
  if (!failing) {
    console.log('OK  no dangling or experimental-dependent references in the frozen set' +
      (cited ? '  (' + cited + ' unmarked citation(s) outstanding, see above)' : ''));
    process.exit(0);
  }
  console.log((strict ? 'FAIL  ' : 'WARN  ') + failing +
    ' failing finding(s) in ' +
    rows.filter(x => x.findings.some(f => isFailing(f.check))).length + ' frozen file(s)' +
    (cited ? '; plus ' + cited + ' report-only unmarked citation(s)' : '') +
    (strict ? '' : '  (report-only; run with --strict to exit 1)'));
  if (strict) process.exit(1);
  process.exit(0);
}

try {
  main();
} catch (e) {
  console.error(e.stack || e);
  process.exit(2);
}
