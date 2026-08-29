#!/usr/bin/env node
/**
 * a11y-check.js — gate:a11y, the verifier for the accessibility profile
 * (spec/figdown-a11y.md).
 *
 * WHY THIS EXISTS. ACCESSIBLE-TEXT-EMISSION pre-registered a six-assertion set A–F before any
 * artifact carried a single accessibility attribute, and directed five of
 * them (A–D, F) to land once the `with-a11y` producer existed. It does now
 * (spec/figdown-a11y.md §1.2; `node tools/build-svg.js --with-a11y`), so
 * this is that verifier. Nothing here is a new decision — only an
 * implementation of ACCESSIBILITY-PROFILE's own words.
 *
 * SIX ASSERTIONS, EXACTLY AS RULED, AT THE RULED SEVERITIES:
 *   A. every published artifact has a root `<title>` and it EQUALS the
 *      source's first `title` string.                            (fatal)
 *   B. a `<desc>`, when present, has a state, and a `derived`/`generated`
 *      state is machine-distinguishable.                         (fatal)
 *   C. a `generated` description is not published.               (fatal)
 *   D. every artifact declares a role, and a role of `img` is declared in
 *      the manifest.                                             (warn)
 *   E. every Markdown embed of an `.svg` has a non-empty `alt`.  (fatal)
 *   F. no element carrying a `data-*` identity is `aria-hidden`. (fatal)
 *
 * ASSERTION E IS NOT IMPLEMENTED HERE, DELIBERATELY. It shipped ahead of the
 * rest, on ACCESSIBLE-TEXT-EMISSION's own direction, as `tools/alt-check.js` (`gate:alt`): it
 * needed no engine change and the corpus passed it clean. A second copy of
 * one rule is the drift this project's gates exist to prevent, so this tool
 * names `gate:alt` as E's owner and checks nothing of it.
 *
 * ASSERTION D IS A WARNING, as filed and as ruled. ACCESSIBILITY-PROFILE settled which role
 * is correct; ACCESSIBLE-TEXT-EMISSION explicitly declined to tighten D's severity beyond the
 * filing. D used to carry a gap this tool could not paper over: ACCESSIBILITY-PROFILE requires
 * an `img` downgrade to be DECLARED in the manifest's `accessibility` block,
 * and that block shipped CLOSED with no field for a role. THAT GAP IS NOW
 * CLOSED (MANIFEST-ACCESSIBILITY-ROLE): `accessibility.role` (spec/figdown-manifest.schema.json,
 * spec/figdown-manifest.md §3.7) is a CLOSED, OPTIONAL, two-member field
 * (`graphics-document`/`img`), so D now checks the REAL FACT — whether a
 * `role="img"` artifact has a manifest beside it whose `accessibility.role`
 * is `"img"` — rather than reporting that there was nowhere to declare it.
 * Its severity is unchanged by this: MANIFEST-ACCESSIBILITY-ROLE is a manifest-schema field, not a
 * re-ruling of D, and ACCESSIBLE-TEXT-EMISSION's "until publication scope is decided" reservation
 * on D's severity (spec/figdown-a11y.md §10) is untouched.
 *
 * SCOPE — THE ARTIFACTS THAT CLAIM THE PROFILE, AND ONLY THOSE.
 * `spec/figdown-a11y.md` §7.1: an artifact claims this profile by recording
 * `with-a11y` in `data-render-options` (core §7), and an artifact rendered
 * without the option is REPORTED AS OUT OF SCOPE, never failed. That is not
 * leniency, it is the profile's own §1.1 — a renderer that emits nothing
 * accessible stays a conforming renderer — plus arithmetic: on the day this
 * profile shipped, 61 of 61 artifacts in this repository were out of scope,
 * and a gate that failed them would be reporting the profile's age rather
 * than anyone's conformance.
 *
 * The artifact roots are `examples/` and `figures/`, recursively — the same
 * two `tools/artifact-check.js` and `tools/safe-svg-check.js` call the
 * shipped corpus. `archive/` is frozen (core §13.5), `conformance/` is a
 * fixture corpus rather than published figures, `design/prototypes/` is
 * working material, and `dist/` is build output; none of the four is a place
 * a figure is published from.
 *
 * ZERO IN-SCOPE ARTIFACTS IS AN HONEST RESULT. Unlike `tools/alt-check.js`
 * (which refuses to pass on zero embeds, because embeds are known to exist),
 * an artifact carrying the profile is OPTIONAL by §1.1, so this gate says
 * "0 artifacts claim the profile" and exits 0 when that is true. The fixture
 * suite runs regardless, so the gate is never vacuous.
 *
 * WHAT THIS TOOL DOES NOT COVER — stated plainly, not minimised:
 *   - It does not judge whether a description is GOOD, only whether its
 *     state is declared and admissible. Assertion B is a presence-and-
 *     vocabulary check; no regex reads prose for over-assertion, which is
 *     what §4.5's negative rule forbids.
 *   - It does not check `lang`/`xml:lang` (a publication SHOULD with no
 *     ruling behind it — spec/figdown-a11y.md §10).
 *   - It does not check the per-element `<title>`s that `description=`
 *     already emits; DESCRIPTION-KEY-SPELLING governs those and they predate this profile.
 *
 * Usage:
 *   node tools/a11y-check.js [--strict] [--verbose]
 *     --strict   exit 1 on any failure (CI mode; what `npm test` runs)
 *     --verbose  list every artifact and fixture checked
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(__dirname, 'a11y-fixtures');
const ARTIFACT_ROOTS = ['examples', 'figures'];

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');

let failures = 0;
const fail = (m) => { failures++; console.log('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);
const note = (m) => console.log('note  ' + m);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// The engine, for the ONE thing a regex must not guess at: what the source's
// first `title` string actually is. Quoting, escapes and the absent-versus-
// empty distinction are the parser's business, and a second reading of them
// here would be a second parser (`tools/artifact-check.js` makes the same
// choice for the same reason). dist/ is a checked build of the engine
// (gate:dist), so this is the engine, not a fork of it.
let fd;
try { fd = require(path.join(ROOT, 'dist', 'figdown.js')); }
catch (e) { console.error('cannot load dist/figdown.js: ' + e.message); process.exit(2); }

// ── reading an artifact ─────────────────────────────────────────────────────
const RE_ROOT_TAG = /^\s*<svg\b[^>]*>/;
const RE_OPTIONS  = /\bdata-render-options="([^"]*)"/;
const RE_ROLE     = /\brole="([^"]*)"/;

// The five states of spec/figdown-a11y.md §4.2. `absent` is included because
// a publisher MAY write it explicitly; it means "no description exists", so a
// `<desc>` that declares it is a contradiction and assertion B says so.
const STATES = ['absent', 'derived', 'generated', 'authored', 'reviewed'];
// The state's carrier in the artifact: ACCESSIBLE-DESCRIPTION-SOURCES item 6, way 1 — a `data-*`
// attribute on the `<desc>`. The reference engine writes `data-desc-state`.
const RE_DESC_STATE = /\bdata-desc-state="([^"]*)"/;

// ACCESSIBILITY-PROFILE item 9's identity list, verbatim: an element carrying one of these is
// never decorative and MUST NOT be hidden.
const IDENTITY_ATTRS = ['data-node', 'data-edge', 'data-group', 'data-cell', 'data-lasso'];

// The source the artifact carries inside itself (core §7). Recovering it here
// rather than reading the paired `.fd` is deliberate and is the profile's own
// reasoning applied to its verifier: THE ARTIFACT TRAVELS ALONE (§4.3), so an
// assertion about the artifact should be decidable from the artifact. The
// paired `.fd` is cross-checked when one exists, and its absence is a notice
// rather than a failure.
//
// The renderer rewrites each `]]>` in the source as `]]]]><![CDATA[>`, which
// splits the section INSIDE the terminator (core §15.4), so concatenating the
// CDATA payloads in order is the exact inverse.
function recoverSource(svg) {
  const open = svg.indexOf('<metadata id="figdown-source"');
  if (open < 0) return null;
  const gt = svg.indexOf('>', open);
  const close = svg.indexOf('</metadata>', gt);
  if (gt < 0 || close < 0) return null;
  const body = svg.slice(gt + 1, close);
  let out = '', i = 0;
  for (;;) {
    const s = body.indexOf('<![CDATA[', i);
    if (s < 0) break;
    const e = body.indexOf(']]>', s + 9);
    if (e < 0) return null;
    out += body.slice(s + 9, e);
    i = e + 3;
  }
  return out.replace(/^\n/, '').replace(/\n$/, '');
}

// Every start tag in the DRAWN region (everything before `<metadata`), with
// its attributes. Deliberately a scan and not a parse: the only questions
// asked of it are "which attributes does this tag carry" for assertion F and
// "what are the root's first children" for assertions A–C. The embedded
// source is excluded by construction, so hostile text in a label can never be
// mistaken for markup — the same split `tools/safe-svg-check.js` states.
function drawnTags(svg) {
  const cut = svg.indexOf('<metadata');
  const region = cut < 0 ? svg : svg.slice(0, cut);
  const out = [];
  const re = /<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = re.exec(region))) {
    const attrs = {};
    const ra = /([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"/g;
    let a;
    while ((a = ra.exec(m[2]))) attrs[a[1]] = a[2];
    out.push({ name: m[1], attrs, at: m.index });
  }
  return out;
}

// The root's first two element children, as raw markup, so assertion A can
// ask FIRST-CHILD and not merely PRESENT (SVG 1.1 §5.4 / DESCRIPTION-KEY-SPELLING).
function rootChildren(svg) {
  const m = RE_ROOT_TAG.exec(svg);
  if (!m) return null;
  const after = svg.slice(m.index + m[0].length);
  const kids = [];
  const re = /^\s*<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>([\s\S]*?)<\/\1>/;
  let s = after;
  for (let i = 0; i < 2; i++) {
    const k = re.exec(s);
    if (!k) break;
    kids.push({ name: k[1], attrs: k[2], text: k[3], raw: k[0] });
    s = s.slice(k[0].length);
  }
  return { open: m[0], kids };
}

// SVG text content -> the string it stands for. `esc()` in the engine escapes
// exactly four characters and nothing else, so the inverse is exactly four.
function unesc(s) {
  return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

// ── the five implemented assertions over one in-scope artifact ──────────────
// Returns { errors: [fatal], warns: [assertion D], notices: [] }.
// `fdPath` is the paired `.fd` when one exists beside the artifact; a fixture
// passes null and is checked against its own embedded source alone.
//
// `noTitleIsAuthors` splits assertion A along the line that decides WHOSE
// defect a finding is. The equality half — the root <title> must equal the
// source's `title` — is the PRODUCER's, always. The presence half is the
// AUTHOR's: a source with no `title` line makes the figure unpublishable
// (§3.3) without anything being wrong with the renderer. Corpus 3 below
// re-renders the tree's own sources and needs the second half counted rather
// than failed; a real published artifact needs both fatal.
function checkArtifact(svg, fdPath, manifestPath, noTitleIsAuthors) {
  const errors = [], warns = [], notices = [];

  const root = rootChildren(svg);
  if (!root) { errors.push('the file does not open with a root <svg> element'); return { errors, warns, notices }; }

  // ---- Assertion D (warn) — a declared role, and `img` declared twice ----
  const mRole = RE_ROLE.exec(root.open);
  if (!mRole) {
    warns.push('D: the root <svg> declares no role — the profile requires role="graphics-document" (§2.1)');
  } else if (mRole[1] === 'img') {
    warns.push('D: role="img" is a DOWNGRADE (§2.2) — it carries Children Presentational: True, so every ' +
      'per-element <title> in this artifact becomes unreachable, and the name must come from ' +
      'aria-label/aria-labelledby, not from a child <title>');
    if (!manifestPath) {
      warns.push('D: role="img" is not declared — no manifest beside this artifact (§2.2)');
    } else {
      let manifestJson = null, parseError = null;
      try { manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
      catch (e) { parseError = e.message; }
      const declaredRole = manifestJson && manifestJson.accessibility && manifestJson.accessibility.role;
      if (parseError) {
        warns.push('D: role="img" declaration could not be checked — ' + rel(manifestPath) +
          ' is not valid JSON (' + parseError + ')');
      } else if (declaredRole !== 'img') {
        warns.push('D: role="img" is not declared — ' + rel(manifestPath) + ' exists, but its ' +
          'accessibility.role is ' + JSON.stringify(declaredRole === undefined ? undefined : declaredRole) +
          ', not "img" (spec/figdown-manifest.md §3.7; ACCESSIBILITY-PROFILE, MANIFEST-ACCESSIBILITY-ROLE)');
      }
      // declaredRole === 'img': the declaration agrees with the artifact — no finding.
    }
    if (!/\baria-label(ledby)?="/.test(root.open))
      warns.push('D: role="img" with no aria-label/aria-labelledby on the root (WAI-ARIA 1.2 §5.4)');
  } else if (mRole[1] !== 'graphics-document') {
    warns.push('D: role="' + mRole[1] + '" is not a role this profile admits — ' +
      'graphics-document is the requirement, img the declared downgrade (§2.1, §2.2)');
  }

  // ---- the source this artifact claims to draw ----
  const embedded = recoverSource(svg);
  if (embedded === null) {
    errors.push('A: no recoverable <metadata id="figdown-source"> — the artifact does not carry its own ' +
      'source, so the name it claims cannot be checked against anything (core §7)');
    return { errors, warns, notices };
  }
  const parsed = fd.parse(embedded);
  if (parsed.errors.length) {
    errors.push('A: the embedded source does not parse (' + parsed.errors[0] + ') — no first `title` string to check against');
    return { errors, warns, notices };
  }
  if (fdPath) {
    const disk = fs.readFileSync(fdPath, 'utf8');
    if (disk !== embedded)
      notices.push('the paired ' + path.basename(fdPath) + ' differs from the embedded source; the embedded ' +
        'copy is what this gate reads (gate:artifact owns the pair, core §7)');
  }
  // ACCESSIBILITY-PROFILE item 3: the FIRST section's title, stated rather than concatenated.
  const first = parsed.docs && parsed.docs.length ? parsed.docs[0] : null;
  if (parsed.docs && parsed.docs.length > 1)
    notices.push('multi-section source (' + parsed.docs.length + ' sections) — the name is the FIRST section\'s ' +
      '`title`, as §3.2 states');
  const wantTitle = (first && first.title !== null && first.title !== undefined) ? String(first.title) : null;

  // ---- Assertion A (fatal) — the root <title>, first child, equal ----
  const titleKid = root.kids.length && root.kids[0].name === 'title' ? root.kids[0] : null;
  if (wantTitle === null) {
    if (titleKid)
      errors.push('A: the artifact carries a root <title> but the source has no `title` line — no renderer ' +
        'invents a name (§3.1)');
    else {
      const m = 'A: no root <title>, because the source has no `title` line. Under this profile the figure ' +
        'is NOT PUBLISHABLE until it has one (§3.3). `title` stays optional in the grammar; this is a ' +
        'publication rule, not a parse error';
      if (noTitleIsAuthors) { notices.push(m); notices.push('UNTITLED'); }
      else errors.push(m);
    }
  } else if (!titleKid) {
    const anywhere = root.kids.some(k => k.name === 'title');
    errors.push('A: no root <title> as the FIRST child of <svg>' +
      (anywhere ? ' (one appears later — SVG 1.1 §5.4 and DESCRIPTION-KEY-SPELLING put it first)' : '') +
      '. Expected ' + JSON.stringify(wantTitle) + ' (§3.1)');
  } else {
    const got = unesc(titleKid.text);
    if (got !== wantTitle)
      errors.push('A: the root <title> is ' + JSON.stringify(got) + ' but the source\'s first `title` is ' +
        JSON.stringify(wantTitle) + ' — unmodified means unmodified: not truncated, not prefixed, not ' +
        'translated (§3.1)');
  }

  // ---- Assertions B and C (fatal) — the description and its state ----
  const descKid = root.kids.find(k => k.name === 'desc');
  if (descKid) {
    const mState = RE_DESC_STATE.exec(descKid.attrs);
    if (!mState) {
      errors.push('B: the root <desc> declares no state. A description whose state is `derived` or ' +
        '`generated` MUST be machine-distinguishable in the artifact (§4.3), and an unmarked <desc> is ' +
        'exactly the silent authority ACCESSIBLE-DESCRIPTION-SOURCES keeps banned — write data-desc-state="…"');
    } else if (STATES.indexOf(mState[1]) < 0) {
      errors.push('B: data-desc-state="' + mState[1] + '" is not one of the five states ' +
        STATES.join(' / ') + ' (§4.2)');
    } else if (mState[1] === 'absent') {
      errors.push('B: data-desc-state="absent" on a <desc> that exists — `absent` means no description ' +
        'exists, which this artifact contradicts (§4.2)');
    } else if (mState[1] === 'generated') {
      errors.push('C: a `generated` description is published. It was produced by a model that was not ' +
        'constrained to the semantic model and is NEVER publishable on its own (§4.2)');
    }
  }

  // ---- Assertion F (fatal) — no identity element is hidden ----
  for (const t of drawnTags(svg)) {
    if (!('aria-hidden' in t.attrs)) continue;
    const ident = IDENTITY_ATTRS.filter(a => a in t.attrs);
    if (ident.length)
      errors.push('F: <' + t.name + ' ' + ident.map(a => a + '="' + t.attrs[a] + '"').join(' ') +
        '> carries aria-hidden="' + t.attrs['aria-hidden'] + '". An element carrying a `data-*` identity ' +
        'is never decorative and MUST NOT be hidden (§5)');
  }

  return { errors, warns, notices };
}

// ── discover the shipped artifacts ──────────────────────────────────────────
function walk(dir, out, ext) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, ext);
    else if (e.isFile() && e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const shipped = [];
for (const r of ARTIFACT_ROOTS) walk(path.join(ROOT, r), shipped, '.svg');
shipped.sort();

const inScope = [], outOfScope = [];
for (const p of shipped) {
  const svg = fs.readFileSync(p, 'utf8');
  const m = RE_OPTIONS.exec(svg);
  const opts = m ? m[1].split(/\s+/).filter(Boolean) : [];
  (opts.indexOf('with-a11y') >= 0 ? inScope : outOfScope).push(p);
}

console.log('');
console.log('a11y-check — the accessibility profile (spec/figdown-a11y.md)');
console.log('  A root <title> == source title   B <desc> has a state   C no `generated` published');
console.log('  D a declared role (warn)         F no hidden identity   E -> gate:alt, not reimplemented here');
console.log('');
console.log('ARTIFACTS  ' + shipped.length + ' under ' + ARTIFACT_ROOTS.join('/ , ') + '/ — ' +
  inScope.length + ' claim the profile, ' + outOfScope.length + ' out of scope');
console.log('  An artifact claims the profile by recording `with-a11y` in data-render-options (§1.3).');
console.log('  An artifact that does not is OUT OF SCOPE, not failing: a renderer that emits nothing');
console.log('  accessible stays a conforming renderer (§1.1), so this gate reports those and moves on.');

if (!inScope.length) {
  console.log('  0 artifacts claim the profile — nothing in ' + ARTIFACT_ROOTS.join('/ or ') +
    '/ has been rendered with --with-a11y yet.');
  console.log('  That is a true statement about the tree, not a broken scan, so it is not a failure.');
  console.log('  The fixture suite below runs regardless, so the gate is never vacuous.');
}
for (const p of inScope) {
  const svg = fs.readFileSync(p, 'utf8');
  const base = p.slice(0, -4);
  const fdPath = fs.existsSync(base + '.fd') ? base + '.fd' : null;
  const mfPath = fs.existsSync(base + '.manifest.json') ? base + '.manifest.json' : null;
  const { errors, warns, notices } = checkArtifact(svg, fdPath, mfPath);
  for (const n of notices) note(rel(p) + '  ' + n);
  for (const w of warns) console.log('WARN  ' + rel(p) + '  ' + w);
  if (errors.length) fail(rel(p) + ' —\n' + errors.map(e => '        ' + e).join('\n'));
  else ok(rel(p) + (warns.length ? '  (' + warns.length + ' warning(s))' : ''));
}
if (verbose) for (const p of outOfScope) console.log('  out of scope: ' + rel(p));

// ── corpus 2: the tree's own sources, RENDERED FRESH under with-a11y ────────
// Rendered here rather than read off disk, for the reason `tools/safe-svg-
// check.js` states about its own fixtures: the profile is a property of the
// PRODUCER, and a stored artifact only proves what the producer did once. This
// is also what keeps the gate from being hollow while the tree publishes no
// `with-a11y` artifact — the scan above can legitimately find zero, and this
// corpus still exercises every assertion against 60-odd real figures.
//
// TWO KINDS OF FINDING, AND THEY ARE NOT THE SAME KIND OF FACT:
//   - a PRODUCER defect (assertions B, C, F, and A's equality half) is FATAL.
//     The engine must never emit an unmarked or `generated` <desc>, never hide
//     an element carrying an identity, and never write a name that is not the
//     source's. Any of those is a bug in this repository's own renderer.
//   - an AUTHOR fact (assertion A's presence half — a source with no `title`
//     line) is COUNTED, not failed. Those figures are not published under this
//     profile and nothing claims they are; the count is a readiness census of
//     what §3.3 would cost, which is the number a future default-emission
//     release (§1.2 route 2) will need and nobody has had.
const sources = [];
for (const r of ARTIFACT_ROOTS) walk(path.join(ROOT, r), sources, '.fd');
sources.sort();

console.log('');
console.log('SOURCES RENDERED FRESH UNDER --with-a11y (' + sources.length + ')');
if (!sources.length) {
  fail('no `.fd` found under ' + ARTIFACT_ROOTS.join('/ or ') + '/ — the producer corpus is the evidence; ' +
    'a run without it proves nothing about the renderer');
} else {
  let rendered = 0, refused = 0, untitled = 0, described = 0, producerDefects = 0;
  const byState = {};
  for (const p of sources) {
    const src = fs.readFileSync(p, 'utf8');
    let r;
    try { r = fd.artifact(src, { a11y: true }); }
    catch (e) { fail(rel(p) + ': artifact() threw under --with-a11y — ' + e.message); producerDefects++; continue; }
    if (r.errors.length) { refused++; continue; }   // gate:artifact owns refused figures
    rendered++;
    const { errors, warns, notices } = checkArtifact(r.svg, null, null, true);
    if (notices.indexOf('UNTITLED') >= 0) untitled++;
    const ms = RE_DESC_STATE.exec(r.svg);
    if (ms) { described++; byState[ms[1]] = (byState[ms[1]] || 0) + 1; }
    if (errors.length) {
      producerDefects++;
      fail(rel(p) + ' [rendered with-a11y] —\n' + errors.map(e => '        ' + e).join('\n'));
    }
    for (const w of warns) console.log('WARN  ' + rel(p) + ' [rendered with-a11y]  ' + w);
    if (verbose) console.log('  ' + rel(p) + ': ' + errors.length + ' error(s), ' + warns.length + ' warning(s)');
  }
  console.log('  ' + rendered + ' rendered, ' + refused + ' refused by the engine (gate:artifact owns those)');
  console.log('  ' + producerDefects + ' producer defect(s) — fatal');
  console.log('=== PUBLISHABILITY CENSUS (readiness, NOT conformance) ===');
  console.log('  ' + (rendered - untitled) + '/' + rendered + ' would carry a name; ' + untitled +
    ' have no `title` line and are NOT PUBLISHABLE under this profile (§3.3)');
  console.log('  ' + described + '/' + rendered + ' get a derived <desc>' +
    (described ? ' (' + Object.keys(byState).sort().map(k => k + ': ' + byState[k]).join(', ') + ')' : '') +
    '; the rest are genres §4.4 deliberately does not cover');
}

// ── the fixture suite ───────────────────────────────────────────────────────
// The same discipline tools/manifest-fixtures/ uses: a valid fixture must
// pass, and an invalid one must fail FOR THE REASON its .why.txt records —
// the last line of the .why.txt is the substring the finding must contain, so
// a fixture that starts failing for a different reason is itself a finding.
console.log('');
if (!fs.existsSync(FIXTURES)) {
  fail('missing tools/a11y-fixtures/ — without fixtures, a passing gate proves nothing');
} else {
  const names = fs.readdirSync(FIXTURES).sort();
  const validNames = names.filter(f => f.endsWith('.valid.svg'));
  const invalidNames = names.filter(f => f.endsWith('.invalid.svg'));
  if (validNames.length < 1)
    fail('tools/a11y-fixtures/ holds no *.valid.svg — at least one artifact that satisfies the profile is required');
  if (invalidNames.length < 6)
    fail('tools/a11y-fixtures/ holds ' + invalidNames.length + ' invalid fixture(s); at least 6 are required, ' +
      'one per checkable assertion (A missing, A mismatched, B unmarked, B unknown state, C generated, F hidden identity)');

  let validPassed = 0;
  for (const n of validNames) {
    const p = path.join(FIXTURES, n);
    const { errors, warns } = checkArtifact(fs.readFileSync(p, 'utf8'), null, null);
    if (errors.length)
      fail('tools/a11y-fixtures/' + n + ' was REJECTED but is meant to be VALID:\n' +
        errors.map(e => '        ' + e).join('\n'));
    else { validPassed++; if (verbose) ok('tools/a11y-fixtures/' + n + (warns.length ? '  (' + warns.length + ' warn)' : '')); }
  }

  let invalidPassed = 0;
  for (const n of invalidNames) {
    const relf = 'tools/a11y-fixtures/' + n;
    const whyPath = path.join(FIXTURES, n.replace(/\.invalid\.svg$/, '.why.txt'));
    if (!fs.existsSync(whyPath)) { fail(relf + ' has no .why.txt — a control must record WHAT it is a control for'); continue; }
    const why = fs.readFileSync(whyPath, 'utf8').trim().split('\n');
    const wanted = why[why.length - 1].trim();
    const { errors, warns } = checkArtifact(fs.readFileSync(path.join(FIXTURES, n), 'utf8'), null, null);
    // A fixture pinning assertion D pins a WARNING, which is D's ruled
    // severity; it is still a finding and is checked the same way.
    const found = errors.concat(warns);
    if (!found.length) { fail(relf + ' was ACCEPTED — the verifier does not catch ' + JSON.stringify(wanted)); continue; }
    const joined = found.join('\n');
    if (!joined.includes(wanted)) {
      fail(relf + ' was rejected for the WRONG reason\n        expected to contain: ' + wanted +
        '\n        actual:\n' + found.map(e => '          ' + e).join('\n'));
      continue;
    }
    invalidPassed++;
    if (verbose) ok(relf + ' -> ' + found.find(e => e.includes(wanted)));
  }

  console.log('FIXTURES  ' + validPassed + '/' + validNames.length + ' valid fixture(s) accepted, ' +
    invalidPassed + '/' + invalidNames.length + ' invalid fixture(s) rejected for their recorded reason');
}

// ── report ──────────────────────────────────────────────────────────────────
console.log('');
console.log('ASSERTION E  not checked here — it ships as tools/alt-check.js (gate:alt), on ACCESSIBLE-TEXT-EMISSION\'s own');
console.log('             direction, and a second copy of one rule is drift, not coverage.');
console.log('');
console.log('=== a11y-check: ' + inScope.length + ' in-scope artifact(s), ' + outOfScope.length +
  ' out of scope, ' + failures + ' failure(s) ===');
if (failures && strict) process.exit(1);
if (failures) console.log('(not --strict: reporting only)');
