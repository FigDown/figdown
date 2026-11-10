#!/usr/bin/env node
'use strict';
// FigDown v0.1 parser-conformance runner.
//
// usage: node conformance/run.js [--update] [--experimental]
//                                [--engine-cmd=<command>] [name-filter]
//
// TWO WAYS TO REACH AN IMPLEMENTATION, AND THE DEFAULT IS UNCHANGED
//
// IN-PROCESS (default) — the reference engine is loaded out of figdown.html
// and called directly. Nothing about this path changed when the second one
// landed; every count, every gate and every golden is exactly as it was.
//
// SUBPROCESS (`--engine-cmd=<command>`, or $FIGDOWN_ENGINE_CMD) — the runner
// invokes an EXTERNAL command per fixture, writes the `.fd` bytes to its
// stdin, and compares its stdout against the SAME goldens. The command may be
// written in any language; nothing about it is inspected. This exists because
// core §0.2 (CONFORMANCE-CLASS-OBLIGATIONS) tells an outside claimant that `conformance/cases/` IS the
// Parser class's conformance suite, and until 0.5 a claimant who wrote
// their parser in anything but JavaScript could not execute the harness they
// were pointed at ($FIGDOWN_HTML only substitutes a second JAVASCRIPT engine
// mimicking this one's private module shape). Engine-backlog item 80, filed
// as a defect against INDEPENDENT-IMPLEMENTATION-CRITERION.
//
// The contract the command must satisfy is written in conformance/README.md
// ("The harness contract"); conformance/adapters/reference-engine.js is a
// worked implementation of it that drives the reference engine, and running
// the suite through it must produce results identical to the in-process path.
//
// The subprocess path covers the PARSER class only — model goldens and error
// goldens. Geometry goldens are the RENDERER's (core §8's geometry-time
// errors, raised by render(), not parse()), and the determinism self-check and
// the five engine property tests below all need in-process access to the
// reference engine, so all of them are skipped and the skip is REPORTED rather
// than absorbed. `--update` is refused in subprocess mode: goldens are minted
// by the reference engine and by nothing else.
//
// ONE MECHANISM PUTS A CASE OUTSIDE THE CONFORMANCE SURFACE: LOCATION
//
// conformance/cases/        the v0.1 conformance surface — NORMATIVE.
// conformance/experimental/ everything outside it — EXPERIMENTAL.
//
// Until 0.1 there were TWO: this directory split, plus a per-case
// tag in conformance/STATUS.txt that put 52 experimental fixtures inside
// cases/. The 0.1 isolation ruling requires frozen and
// experimental material to be separated at the FILE level, so that a
// consumer who wants nothing experimental can ignore whole files, so the
// 52 moved and the tag stopped deciding anything.
//
// STATUS.txt survives, with a narrower job: it is the REASON manifest for
// conformance/experimental/. It no longer decides a bucket (location
// does); it records WHY each fixture is outside the surface, and the
// runner enforces the correspondence in BOTH directions — a record naming
// a file that is not in experimental/ is an error, and a fixture in
// experimental/ with no record is an error. Neither list can rot.
//
// A default run executes BOTH corpora: an experimental fixture still RUNS
// and still has to PASS, because it pins real reference-engine behaviour.
// What its location changes is which TOTAL it counts toward. The headline
// conformance number is the NORMATIVE count only; a second implementation
// may skip the whole of experimental/ and still claim v0.1 conformance.
// `--experimental` runs that corpus on its own.
//
// For each <corpus>/NNN-name.fd:
//   - parse with the reference engine;
//   - if the parse reports errors: compare the SORTED error lines against
//     NNN-name.errors.txt;
//   - otherwise: project the doc through normalize.js and compare against
//     NNN-name.model.json (pretty-printed, trailing newline), AND compare any
//     GEOMETRY-TIME diagnostics from render() against NNN-name.geometry.txt
//     (absent when the figure renders clean).
// Additionally every valid case gets a determinism self-check: parse+render
// twice, the SVG byte streams must be identical. SVG output itself has no
// goldens (renderer-version-specific by spec section 3: only same source +
// same renderer version must be byte-identical).
//
// --update rewrites the goldens (and removes a stale golden of the other
// kind when a case flips between valid and erroring). Exit code 1 on any
// failure.
const fs = require('fs');
const path = require('path');

// Engine lookup, same order as tools/build-svg.js: $FIGDOWN_HTML, a
// co-located copy, then ../editor/figdown.html (the repository layout).
//
// ../figdown.html is the FROZEN layout. A copy of this runner is archived at
// each language release under archive/<X.Y>/conformance/, beside the engine
// page archive/<X.Y>/figdown.html that the same release owes (core.md §13.5).
// From there ../editor/ does not exist and never will, so without this
// candidate the frozen suite is inert: fixtures with nothing to run them.
// In the live tree <repo>/figdown.html does not exist, so this line changes
// no lookup here — it is the one line that makes every future frozen
// partition self-contained.
//
// The lookup is performed INSIDE loadEngine(), not at module load, so that a
// subprocess-mode run never touches it: `conformance/` plus an external
// command must be enough, in a tree that contains no engine page at all.
const ENGINE_CANDIDATES = () => [
  process.env.FIGDOWN_HTML,
  path.join(__dirname, 'figdown.html'),
  path.join(__dirname, '..', 'figdown.html'),
  path.join(__dirname, '..', 'editor', 'figdown.html'),
].filter(Boolean);

function loadEngine() {
  const ENGINE = ENGINE_CANDIDATES().find(p => fs.existsSync(p));
  if (!ENGINE) throw new Error('figdown.html not found (set FIGDOWN_HTML or keep it next to this script)');
  const h = fs.readFileSync(ENGINE, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate engine in ' + ENGINE);
  const factory = new Function(h.slice(start, end) +
    '\nreturn {parse, render, stackSectionSvgs, tokenize, findComment, OPT_KEYS, LANE_RE:/^[01pnx=.]+$/};');
  return factory();
}

// LANE-ALPHABET-KEY-RESERVATION — option-key namespace guard.
//
// `splitOpts(tk.toks, lead==='signal')` keeps UNREGISTERED `key=value` tokens
// positional inside a wave `signal` lane, but a REGISTERED key is stolen
// first: splitOpts tests OPT_KEYS before it consults the laneMode guard. Lane
// characters are `[01pnx=.]`, which includes `p`, `n`, `x` and `=` — so a
// lane written `x=01` is positional ONLY because no option key is spelled
// `x`. Registering a single-letter key drawn from the lane alphabet would
// silently turn existing lanes into options: no error, a different figure.
// The constraint is normative (core §10 genre namespace, genres/experimental/timing.md);
// this is the guard that makes a future registration fail loudly here rather
// than corrupt lanes quietly.
function assertLaneKeyNamespace(engine) {
  const reserved = [];
  for (const k of engine.OPT_KEYS) if (k.length === 1 && engine.LANE_RE.test(k)) reserved.push(k);
  if (reserved.length) {
    console.error('OPTION-KEY NAMESPACE VIOLATION (LANE-ALPHABET-KEY-RESERVATION): ' +
      reserved.map(k => '"' + k + '="').join(', ') +
      ' collide with the timing lane alphabet [01pnx=.].');
    console.error('A single-letter option key spelled with a lane character makes every');
    console.error('existing `signal <name> <lane>` containing it parse as an option instead.');
    console.error('Pick a full-word spelling (spec/core.md §10, spec/genres/experimental/timing.md).');
    process.exit(1);
  }
}

// 0.1 — comment-scanner property test.
//
// `findComment` and `tokenize` each maintain their own idea of "inside a
// string", and they must never disagree: findComment runs FIRST and truncates
// the line, so if it thinks a `#` is outside a string when the tokenizer would
// have swallowed it, a legal document is destroyed before the tokenizer ever
// sees it. That is exactly the 0.1 defect (`title "a \" b # c"` was
// rejected as `unterminated string`), and it came from findComment toggling
// its in-quote flag on an ESCAPED quote.
//
// The property, over generated quoted values built from `#`, `\"`, `\\` and
// plain text: for every line, the prefix findComment keeps must never cut
// inside a region the tokenizer treats as a string. Checked by comparing the
// tokenization of the whole line with the tokenization of the kept prefix:
// if findComment cut inside a string, the prefix fails to tokenize (or the
// leading tokens change). Deterministic enumeration, no RNG — the suite must
// be reproducible.
function assertCommentScanner(engine) {
  const ATOMS = ['a', '#', '\\"', '\\\\', ' ', 'b#c', '\\\\#', '# ', ' # '];
  const bad = [];
  const check = (line) => {
    const hi = engine.findComment(line);
    const kept = hi >= 0 ? line.slice(0, hi) : line;
    const whole = engine.tokenize(line);
    if (whole.error) return;              // not a well-formed line; nothing to promise
    const pre = engine.tokenize(kept);
    if (pre.error) { bad.push(line + '  -> cut inside a string: ' + pre.error); return; }
    // The kept prefix must be a token-wise prefix of the whole line.
    for (let i = 0; i < pre.toks.length; i++) {
      if (i >= whole.toks.length || pre.toks[i].v !== whole.toks[i].v) {
        bad.push(line + '  -> token ' + i + ' changed: ' +
          JSON.stringify(pre.toks[i] && pre.toks[i].v) + ' vs ' +
          JSON.stringify(whole.toks[i] && whole.toks[i].v));
        return;
      }
    }
  };
  for (const a of ATOMS) for (const b of ATOMS) {
    check('title "' + a + b + '"');
    check('title "' + a + '" # ' + b);
    check('field x 8 note="' + a + b + '"');
    check('node id "' + a + '" fill=#0d9488');
    check('node id "' + a + b + '" # trailing ' + b);
  }
  if (bad.length) {
    console.error('COMMENT SCANNER PROPERTY FAILED: findComment and');
    console.error('tokenize disagree about where a string ends, on ' + bad.length + ' input(s):');
    for (const b of bad.slice(0, 10)) console.error('  ' + b);
    process.exit(1);
  }
}

// GROUP-BOUNDARY-OBSTACLE — a group boundary is crossed, not terminated on.
//
// THE REGRESSION THIS PINS. 0.4 made a `group`'s NAME an obstacle to
// the router, correctly (an element label is ink and a shaft must not read as
// striking through it) but without the exemption its sibling rule already had.
// A group's name strip runs the full width of the band's TOP, so it lies
// across every approach an outside node has to a member INSIDE the group:
// every boundary-crossing edge in the figure left its corridor, ran down the
// band's outer edge and entered the member from the side. The drawing then
// said the line arrives at the CONTAINER when the source says it arrives at
// the MEMBER. It shipped for nine engine versions and was found by a reader,
// not by this suite.
//
// WHY IT IS HERE AND NOT IN cases/. Three pins were available and two cannot
// see this defect. A MODEL golden reads the AST, which is byte-identical
// before and after the fix — a route is not in the model. A `.geometry.txt`
// golden records render()'s REFUSAL diagnostics, and this figure renders
// clean, so its golden would be absent and would pin nothing. The artifact
// corpus does carry the case now (`examples/pvlan-flows` edge 81), but
// `gate:artifact` compares an artifact against its SOURCE HASH and never
// re-renders, so a re-introduction would survive it. What is left is the
// mechanism this file already has: an in-process engine property test that
// RENDERS and asserts a drawn property. This is the third.
//
// THE PROPERTY. In a figure whose only obstacles are the group band and its
// name, an edge with one endpoint outside the group and one endpoint on a
// member inside it is drawn as a straight `<line>` to that member. Two
// controls travel with it so the fix cannot be over-applied: an edge wholly
// inside the group is also straight (it never met the strip), and an edge
// between two OUTSIDE nodes whose straight run would cross the name IS still
// detoured — that last one is the whole of what 0.4 was right about,
// and a fix that straightened it too would have put the strikethrough back.
function assertGroupCrossingEdge(engine) {
  const SRC = [
    'figdown 0.5 topology',
    'title "group-crossing edge"',
    'group pod "A group whose name strip spans the whole width of its band"',
    'node up "Up" ',
    'node west "West"',
    'node east "East"',
    'node lf "Leaf" in=pod',
    'node tor "ToR" in=pod',
    'flow down',
    'edge up -- lf',          // crosses the boundary: must stay straight
    'edge lf -- tor',         // wholly inside: must stay straight
    'edge west -- east',      // wholly outside, over the name: must detour
    'layout',
    'pin up at=(180,20) width=120 height=50',
    'pin west at=(20,150) width=90 height=50',
    'pin east at=(420,150) width=90 height=50',
    'pin pod at=(60,110)',
    'pin lf at=(60,60) width=120 height=50',
    'pin tor at=(60,180) width=120 height=50',
  ].join('\n');
  const { doc, errs: errors } = engine.parse(SRC);
  const bad = [];
  if (errors && errors.length) {
    bad.push('the property figure no longer parses: ' + errors.join('; '));
  } else {
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    // `data-edge` carries the 1-based SOURCE LINE of the edge (CONNECTOR-IDENTITY-KEY).
    const kindOf = (line) => {
      const m = svg.match(new RegExp('<(line|path) data-edge="' + line + '"'));
      return m ? m[1] : null;
    };
    const want = [
      [10, 'line', 'up -- lf crosses the group boundary and must reach the MEMBER'],
      [11, 'line', 'lf -- tor is wholly inside the group and never met the name strip'],
      [12, 'path', 'west -- east is foreign to the group and must go round its name'],
    ];
    for (const [ln, kind, why] of want) {
      const got = kindOf(ln);
      if (got !== kind) bad.push('edge on line ' + ln + ': expected <' + kind +
        '>, got ' + (got ? '<' + got + '>' : 'no edge element') + ' — ' + why);
    }
  }
  if (bad.length) {
    console.error('GROUP-CROSSING EDGE PROPERTY FAILED (GROUP-BOUNDARY-OBSTACLE): a group');
    console.error('boundary is crossed, not terminated on — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

// 0.5 — a labelled edge between two same-rank nodes is drawn
// across the gap between them, and the gap holds its label.
//
// THE DEFECT THIS PINS. The seam pass budgeted a link label on the MAIN axis
// only. Two nodes in one `rank` sit side by side under vertical flow, the
// edge between them runs along the cross axis, and its label is centred on
// that run: `rank a,b` with a 35-character label drew a 56 px gap under a
// ~185 px label, written over both boxes, exit 0. `examples/evpn-fabric`'s
// leaf-to-leaf VXLAN label overprinted both leaves by about 12 px.
//
// WHY IT IS HERE AND NOT IN cases/: GROUP-BOUNDARY-OBSTACLE's reason. The figure renders clean,
// so a `.geometry.txt` golden would be absent, and the model is unchanged.
//
// THE PROPERTY. Under `flow down`, in topology, flowchart and statechart, the
// gap between the two boxes is at least the label's drawn width (5.5 px per
// character at 11 px is below any width the engine draws) and the label's
// centre lies inside the gap. One control: the same figure with no label
// keeps its old 56 px gap, so the room is asked for by the label alone.
function assertSameRankLabelClear(engine) {
  const LBL = 'a rather long link description label';
  const fig = (genre, label) => {
    const [nd, ln] = genre === 'statechart' ? ['state', 'transition']
                   : genre === 'flowchart' ? ['node', 'flowline'] : ['node', 'edge'];
    const arrow = genre === 'topology' ? (label ? ' -[' + label + ']- ' : ' -- ')
                                       : (label ? ' -[' + label + ']-> ' : ' -> ');
    return ['figdown 0.5 ' + genre, 'flow down', nd + ' a "Alpha"', nd + ' b "Beta"',
            'rank a,b', ln + ' a' + arrow + 'b'].join('\n');
  };
  const gapOf = (src) => {
    const { doc, errs } = engine.parse(src);
    if (errs && errs.length) return { err: errs.join('; ') };
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    const r = [...svg.matchAll(/<rect x="([-\d.]+)" y="[-\d.]+" width="([\d.]+)" height="[\d.]+"[^>]*stroke="#8a8880"/g)]
      .map(m => [+m[1], +m[1] + +m[2]]).sort((p, q) => p[0] - q[0]);
    const t = svg.match(new RegExp('<text x="([-\\d.]+)"[^>]*fill="#555">' + LBL));
    return { lo: r[0] && r[0][1], hi: r[1] && r[1][0], lx: t ? +t[1] : null };
  };
  const bad = [];
  for (const g of ['topology', 'flowchart', 'statechart']) {
    const w = gapOf(fig(g, LBL)), c = gapOf(fig(g, null));
    if (w.err || c.err) { bad.push(g + ': the property figure no longer parses: ' + (w.err || c.err)); continue; }
    const need = LBL.length * 5.5;
    if (!(w.hi - w.lo >= need)) bad.push(g + ': gap ' + (w.hi - w.lo).toFixed(1) + ' px under a label of at least ' + need + ' px');
    if (w.lx === null || !(w.lx > w.lo && w.lx < w.hi)) bad.push(g + ': the label is not centred in the gap (x ' + w.lx + ')');
    if (Math.abs((c.hi - c.lo) - 56) > 0.01) bad.push(g + ': the unlabelled control moved, gap ' + (c.hi - c.lo).toFixed(1) + ' px (want 56)');
  }
  if (bad.length) {
    console.error('SAME-RANK LABEL PROPERTY FAILED: a labelled edge');
    console.error('between same-rank nodes overprints them — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

// 0.5 — three or more labelled links between one pair of nodes
// under vertical flow draw their labels apart.
//
// THE DEFECT THIS PINS. The seam between two ranks budgeted no label room for
// a pair's parallel links, and every mid label chose among the same five
// parameters in the middle 44 % of the run. Five `a -[member i link]- b`
// under `flow down` drew five labels 0 to 10 px apart in a 44 px seam, two of
// them on one baseline. The seam now holds a line per label, and each label
// takes its own slot along the run.
//
// THE PROPERTY. With three and with five such links, no two label boxes
// overlap (5.5 px per character, 11 px line box: smaller than drawn), and
// every label lies between the two node boxes. One or two links keep the
// default placement and are not asserted here.
// 0.5 — the header is required (core §1), including in a text with
// no significant line at all. These inputs cannot live in a fixture file
// (an empty case is not a case, and a CR-only file's line endings do not
// survive every checkout), so they are built here. Each drew an empty figure
// with 0 errors through this release.
function assertHeaderRequired(engine) {
  const bad = [];
  const want = /^Line 1: missing header/;
  for (const [name, src] of [['empty', ''], ['blank lines', '\n \n\t\n'],
    ['comments only', '# a\n# b\n'], ['BOM then comment', '\uFEFF# a\n']]) {
    const { errs } = engine.parse(src);
    if (!errs || errs.length !== 1 || !want.test(errs[0])) bad.push(name + ': ' + JSON.stringify(errs));
  }
  const { errs } = engine.parse('# provenance\n\nfigdown 0.5 block\nnode a\n');
  if (errs && errs.length) bad.push('comments before a header must stay legal: ' + JSON.stringify(errs));
  if (bad.length) {
    console.error('HEADER-REQUIRED VIOLATION (core §1):\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertBareCr(engine) {
  // core §1 / §15.4: a CR not followed by LF is an illegal
  // character — it ends no line, and XML would turn it into LF inside the
  // artifact. CRLF stays a line end. (The CR-only file, which also lacks a
  // header, moved here from assertHeaderRequired: it now carries both.)
  const bad = [];
  const CR = /^Line (\d+): illegal character U\+000D — a CR not followed by LF/;
  for (const [name, src, want] of [
    ['CR inside a label', 'figdown 0.5 block\nnode a "x\ry"', ['2']],
    ['CR inside a comment', 'figdown 0.5 block\n# c\rnode b\nnode a "A"', ['2']],
    ['CR at end of text', 'figdown 0.5 block\nnode a "A"\r', ['2']],
    ['CR before CRLF', 'figdown 0.5 block\r\nnode a "A"\r\r\n', ['2']],
    ['CRLF document', 'figdown 0.5 block\r\nnode a "A"\r\n', []]]) {
    const errs = engine.parse(src).errs || [];
    const lines = errs.map(e => (CR.exec(e) || [])[1]).filter(Boolean);
    if (JSON.stringify(lines) !== JSON.stringify(want) || errs.length !== want.length) bad.push(name + ': ' + JSON.stringify(errs));
  }
  const cr = engine.parse('# provenance\rfigdown 0.5 block\rnode a\r').errs || [];
  if (cr.length !== 2 || !CR.test(cr[0]) || !/^Line 1: missing header/.test(cr[1])) bad.push('CR-only file opening with a comment: ' + JSON.stringify(cr));
  if (bad.length) {
    console.error('BARE-CR VIOLATION (core §1):\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertSequenceNotes(engine) {
  // sequence (DQ): note= on each of the five elements draws in
  // the note column, naming its kind and target, inside the canvas; a
  // self-message `<->` has two heads like any `<->`; `[tail]`/`[head]` are a
  // line error.
  const bad = [];
  const src = 'figdown 0.5 sequence\nlifeline c "C" note="n-lifeline"\nlifeline s "S"\n' +
    'message c -> s "m" id=m1 note="n-message"\nstate s "Up" note="n-state"\n' +
    'fragment f "F" type=loop note="n-fragment"\noperand o "g" in=f note="n-operand"\nmessage s -> s "x" in=o';
  const p = engine.parse(src);
  if (p.errs && p.errs.length) bad.push('notes doc does not parse: ' + p.errs.join('; '));
  else {
    const svg = engine.render(p.doc, {}).svg || '';
    const W = parseFloat((/<svg[^>]*\bwidth="([\d.]+)"/.exec(svg) || [])[1]);
    for (const [kind, ref, text] of [['lifeline', 'c', 'n-lifeline'], ['message', 'm1', 'n-message'],
      ['state', '5', 'n-state'], ['fragment', 'f', 'n-fragment'], ['operand', 'o', 'n-operand']]) {
      const m = new RegExp('<g class="fd-note" data-note-on="' + kind + '" data-note-for="' + ref + '"><path d="M([\\d.]+) [\\d.]+ H[\\d.]+ L([\\d.]+) ').exec(svg);
      if (!m || !svg.includes('>' + text + '<')) bad.push(kind + ' note not drawn');
      else if (!(parseFloat(m[2]) <= W)) bad.push(kind + ' note runs off the canvas (' + m[2] + ' > ' + W + ')');
    }
  }
  const heads = s => ((engine.render(engine.parse(s).doc, {}).svg || '').match(/ z" fill="#334155" stroke="none"/g) || []).length;
  const base = 'figdown 0.5 sequence\nlifeline c\n';
  if (heads(base + 'message c <-> c "x"') !== 2) bad.push('self-message <-> does not draw two heads');
  if (heads(base + 'message c -> c "x"') !== 1) bad.push('self-message -> does not draw one head');
  for (const m of ['message c [t] -> s', 'message c -> [h] s', 'message c [t] <-> [h] s']) {
    const e = engine.parse(base + 'lifeline s\n' + m).errs || [];
    if (e.length !== 1 || !/^Line 4: message takes no \[tail\] or \[head\] label/.test(e[0])) bad.push(m + ': ' + JSON.stringify(e));
  }
  if (bad.length) {
    console.error('SEQUENCE-NOTES VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertSequenceMargin(engine) {
  // sequence (DR): the canvas ends a margin past the rightmost
  // ink. A last-column self-message label and a one-column fragment caption
  // are both counted in that ink; until this version their room was also
  // reserved a second time, and the right margin grew by the label's width.
  // Ink is estimated from each <text> (0.65 em per character, by anchor).
  const bad = [];
  const pre = 'figdown 0.5 sequence\nlifeline a "A"\nlifeline b "B"\nmessage a -> b "m"\n';
  for (const tail of ['message b -> b "a fairly long self-message label"',
    'fragment f "a long fragment caption written on one column" type=loop\noperand o "g" in=f\nmessage b -> b "y" in=o']) {
    const svg = engine.render(engine.parse(pre + tail).doc, {}).svg || '';
    const W = parseFloat((/<svg[^>]*\bwidth="([\d.]+)"/.exec(svg) || [])[1]);
    let ink = 0;
    for (const m of svg.matchAll(/<text x="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*text-anchor="(\w+)"[^>]*>([^<]*)</g)) {
      const w = m[4].length * parseFloat(m[2]) * 0.65, x = parseFloat(m[1]);
      ink = Math.max(ink, m[3] === 'start' ? x + w : m[3] === 'middle' ? x + w / 2 : x);
    }
    if (!(W - ink <= 60)) bad.push(tail.split('\n')[0] + ': canvas ' + W + ' ends ' + Math.round(W - ink) + ' past the estimated ink');
  }
  if (bad.length) {
    console.error('SEQUENCE-MARGIN VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertGroupRankHint(engine) {
  // group: when auto-layout cannot separate a non-member
  // from a group whose members span ranks, the refusal names a `rank` line
  // holding the members, and following it draws the figure.
  const src = fs.readFileSync(path.join(__dirname, 'experimental', '973-group-encloses-rank-hint.fd'), 'utf8');
  const errs = engine.render(engine.parse(src).doc).errs || [];
  const m = errs.map(e => /: (rank [\w,-]+)\.$/.exec(e)).filter(Boolean)[0];
  let bad = null;
  if (!m) bad = 'refusal names no rank line: ' + JSON.stringify(errs);
  else {
    const p2 = engine.parse(src + '\n' + m[1]);
    const e2 = (p2.errs || []).concat(engine.render(p2.doc).errs || []);
    if (e2.length) bad = 'following "' + m[1] + '" still fails: ' + JSON.stringify(e2);
  }
  if (bad) {
    console.error('GROUP-RANK-HINT VIOLATION:\n  ' + bad);
    process.exit(1);
  }
}

function assertStatePillClears(engine) {
  // sequence (GJ): a `state` pill is centred on its lifeline and
  // as wide as its name, so the lifelines beside it must sit at least half a
  // pill away; until this version a long state on the middle of three
  // lifelines painted over both neighbours. Lifelines are the dashed <line>s.
  const bad = [];
  const name = 'AWAITING-ACKNOWLEDGEMENT-FROM-THE-REPLICA';
  const src = 'figdown 0.5 sequence\nlifeline a "A"\nlifeline b "B"\nlifeline c "C"\n' +
    'state b "' + name + '"\nmessage a -> b "m"\nmessage b -> c "n"\n';
  const svg = engine.render(engine.parse(src).doc, {}).svg || '';
  const xs = [...svg.matchAll(/<line x1="([\d.]+)"[^>]*stroke-dasharray/g)].map(m => parseFloat(m[1]));
  const half = (name.length * 6.6 + 18) / 2;
  if (xs.length < 3) bad.push('found ' + xs.length + ' lifelines, expected 3');
  else for (const [i, j] of [[0, 1], [1, 2]])
    if (!(xs[j] - xs[i] >= half)) bad.push('lifelines ' + i + '/' + j + ' are ' + Math.round(xs[j] - xs[i]) + ' px apart; the pill reaches ' + Math.round(half) + ' px each side');
  if (bad.length) {
    console.error('STATE-PILL VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertLabelsInside(engine) {
  // 0.5: an author label stays inside the box or canvas
  // that holds it. Sequence boxes are sized for the label's LINE COUNT; a
  // centred `external` label widens the canvas; bar3d z-ruler ticks are
  // counted in the width and never name a value above the data maximum.
  const bad = [];
  const svgOf = src => { const p = engine.parse(src); return engine.render(p.doc).svg || ''; };
  const num = (re, s) => parseFloat((re.exec(s) || [])[1]);
  const W = s => num(/viewBox="0 0 ([\d.]+)/, s);
  const seq = svgOf('figdown 0.5 sequence\nlifeline a "Client\\nhost A\\nport 1234"\nlifeline b "Server"\n' +
    'message a -> b "SYN"\nmessage a <- b "SYN+ACK\\nseq=y\\nack=x+1\\nwin=65535"\nstate b "LISTEN\\nwaiting"\n' +
    'fragment f "attempt\\nretry" type=loop\noperand o "n<3" in=f\nmessage a -> b "ACK" in=o');
  const headH = num(/<rect x="[\d.]+" y="8" width="[\d.]+" height="([\d.]+)" rx="4"/, seq);
  if (!(headH >= 3 * 13 * 1.3)) bad.push('three-line lifeline head is ' + headH + ' px tall');
  const arrows = [...seq.matchAll(/<line data-edge="\d+" x1="[\d.]+" y1="([\d.]+)"/g)].map(m => parseFloat(m[1]));
  const labels = [...seq.matchAll(/<text x="[\d.]+" y="([\d.]+)" font-size="11" text-anchor="middle" fill="#1d1d1b"/g)].map(m => parseFloat(m[1]));
  if (!(labels[1] - 11 * 0.8 > arrows[0] + 2)) bad.push('four-line message label (top ' + labels[1] + ') reaches the arrow above (' + arrows[0] + ')');
  const pillH = num(/<rect [^>]*height="([\d.]+)" rx="9"/, seq);
  if (!(pillH >= 2 * 11 * 1.3)) bad.push('two-line state pill is ' + pillH + ' px tall');
  const frameY = num(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="[\d.]+" fill="none" stroke="#64748b"/, seq);
  const capY = num(/<text x="[\d.]+" y="([\d.]+)" font-size="10.5" text-anchor="start" fill="#475569"/, seq);
  if (!(capY - 10.5 * 0.8 >= frameY)) bad.push('two-line fragment caption (top ' + capY + ') rises above its frame (' + frameY + ')');
  const ext = svgOf('figdown 0.5 topology\nflow down\nnode a "A"\nexternal net "The public Internet via upstream transit"\nedge a -- net');
  const ex = num(/<text x="([\d.]+)"[^>]*text-anchor="middle"[^>]*>The public/, ext);
  if (!(W(ext) >= ex + 40 * 10 * 0.55 / 2)) bad.push('centred external label runs past the canvas (' + W(ext) + ')');
  for (const v of ['9.6', '0.72 |\n| STATIC-DYNAMIC-PRIORITY | 6.74 |\n| DYNAMIC-FIGURE-PURPOSE | 9.24 |\n| TEXT-VERSUS-FIGURE-AUTHORITY | 8.10 |\n| RENDER-AUTOMATION | 7.41 |\n| PRESENTATION-CONTROL-TIERS | 0.64']) {
    const ch = svgOf('figdown 0.5 block\ntable t "T"\n| Name | C0 |\n|---|---:|\n| IMAGE-LOCKED-KNOWLEDGE | ' + v + ' |\nchart t type=bar3d');
    const ticks = [...ch.matchAll(/<text x="([\d.]+)"[^>]*font-size="9.5"[^>]*>([^<]*)/g)];
    const zmax = Math.max(...v.split(/[|\n R]+/).map(parseFloat).filter(x => !isNaN(x) && x < 100));
    for (const t of ticks) {
      if (parseFloat(t[1]) + t[2].length * 9.5 * 0.6 > W(ch)) bad.push('bar3d tick "' + t[2] + '" past the canvas (' + W(ch) + ')');
      if (parseFloat(t[2]) > zmax) bad.push('bar3d tick "' + t[2] + '" above the data maximum ' + zmax);
    }
  }
  if (bad.length) {
    console.error('LABELS-INSIDE VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertStackKeepsText(engine) {
  // multi-section stacking: only url() attribute values are
  // re-prefixed; author text containing "url(#x)" is drawn as written, and
  // the timing hatch fill still points at its own section's pattern.
  const src = 'figdown 0.5 block\nnode a "see url(#x) here"\nfigdown 0.5 timing\ntiming t "T"\nsignal s xx01';
  const { docs, errs } = engine.parse(src);
  if (errs && errs.length) { console.error('STACK-TEXT: does not parse: ' + errs.join('; ')); process.exit(1); }
  const out = engine.stackSectionSvgs(docs.map(d => engine.render(d)));
  const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
  const bad = [];
  if (!svg.includes('>see url(#x) here<')) bad.push('the label was rewritten');
  if (!/fill="url\(#s1_hatch\)"/.test(svg) || !svg.includes('id="s1_hatch"')) bad.push('the hatch fill is not re-prefixed to s1_hatch');
  if (bad.length) {
    console.error('STACK-TEXT VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertGroupPushNoCover(engine) {
  // group push (BP): two non-members inside one band used to be
  // pushed onto each other — refused as "completely over" under flow down/up,
  // drawn overlapping under right/left. Every flow must draw, with no two
  // node boxes overlapping.
  const bad = [];
  for (const flow of ['down', 'up', 'right', 'left']) {
    const src = 'figdown 0.5 block\nflow ' + flow + '\ngroup g "G"\nnode a "A" in=g\nnode p "P" in=g\nnode b "BB"\nnode c "CCCCCCCCCCCCCCC"\nedge c -- p\nedge b -- p';
    const { doc, errs } = engine.parse(src);
    if (errs && errs.length) { bad.push(flow + ': does not parse: ' + errs.join('; ')); continue; }
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    const gerr = (out && out.errors) || [];
    if (gerr.length || !svg) { bad.push(flow + ': not drawn: ' + gerr.join('; ')); continue; }
    const B = [...svg.matchAll(/<g data-node="(\w+)" data-x="([-\d.]+)" data-y="([-\d.]+)"[\s\S]*?<rect[^>]*width="([\d.]+)" height="([\d.]+)"/g)]
      .map(m => [m[1], +m[2], +m[3], +m[4], +m[5]]);
    if (B.length !== 4) { bad.push(flow + ': found ' + B.length + ' node boxes, want 4'); continue; }
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const [x, y] = [B[i], B[j]];
      if (x[1] < y[1] + y[3] && y[1] < x[1] + x[3] && x[2] < y[2] + y[4] && y[2] < x[2] + x[4]) bad.push(flow + ': "' + x[0] + '" overlaps "' + y[0] + '"');
    }
  }
  if (bad.length) {
    console.error('GROUP-PUSH VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertLabelsOnCanvas(engine) {
  // scene renderer: the label pass runs last and the canvas
  // used to grow right and down only, so a tall edge label went off the top.
  // Every text's first baseline must leave room for its ascent (0.75 em) and
  // a start-anchored text must begin at x >= 0.
  const bad = [];
  for (const [name, src] of [
    ['five-line label, flow right', 'figdown 0.5 block\nnode a "A"\nnode b "B"\nedge a -["l1\\nl2\\nl3\\nl4\\nl5"]-> b'],
    ['five-line label, flow down', 'figdown 0.5 block\nflow down\nnode a "A"\nnode b "B"\nedge a -["l1\\nl2\\nl3\\nl4\\nl5\\nl6\\nl7\\nl8"]-> b']]) {
    const { doc, errs } = engine.parse(src);
    if (errs && errs.length) { bad.push(name + ': does not parse: ' + errs.join('; ')); continue; }
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    for (const m of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)" text-anchor="(\w+)"/g)) {
      const x = +m[1], y = +m[2], fs = +m[3];
      if (y - 0.75 * fs < 0 || (m[4] === 'start' && x < 0)) { bad.push(name + ': text at (' + x + ',' + y + ') is off the canvas'); break; }
    }
  }
  if (bad.length) {
    console.error('LABEL-OFF-CANVAS VIOLATION:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertMessageEdges(engine) {
  // core §7 / §13.7.5: every sequence message shaft carries
  // `data-edge` — the authored id where it has one, else its source line.
  const src = 'figdown 0.5 sequence\nlifeline a "A"\nlifeline b "B"\nmessage a -> b "x" id=m1\nmessage b <- a "y"\nmessage a -> a "self"';
  const out = engine.render(engine.parse(src).doc, {});
  const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
  const got = [...svg.matchAll(/<(?:line|path) data-edge="([^"]*)"/g)].map(m => m[1]).join(',');
  if (got !== 'm1,5,6') {
    console.error('MESSAGE-EDGE VIOLATION (core §7): want data-edge m1,5,6 on the three shafts, got [' + got + ']');
    process.exit(1);
  }
}

function assertTimingEdges(engine) {
  // timing genre: a vertical edge at a cell boundary exactly
  // where the level changes. `p` ends low, `n` ends high; `x`/`=` have no
  // level. Two-cell lanes, so the only boundary is the one between them.
  const bad = [];
  const want = { pn: 0, np: 0, '1p': 0, '0n': 0, p1: 1, n0: 1, pp: 1, nn: 1, '0p': 1, '1n': 1, xp: 0, '=p': 0, p0: 0, n1: 0 };
  for (const [lane, n] of Object.entries(want)) {
    const out = engine.render(engine.parse('figdown 0.5 timing\ntiming t "T"\nsignal a ' + lane).doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    const d = (/<path d="([^"]*)" fill="none" stroke="[^"]*" stroke-width="1\.6"/.exec(svg) || [])[1];
    if (d === undefined) { bad.push(lane + ': no waveform path'); continue; }
    const xs = [...d.matchAll(/M([\d.]+),([\d.]+) L([\d.]+),([\d.]+)/g)]
      .filter(m => m[1] === m[3] && m[2] !== m[4]).map(m => +m[1]);
    // The lane starts at the name gutter's right edge: the name is drawn
    // end-anchored 10 units left of it.
    const name = /<text x="([\d.]+)" y="[^"]*" font-size="11\.5" text-anchor="end"/.exec(svg);
    if (!name) { bad.push(lane + ': no signal name'); continue; }
    const edge = +name[1] + 10 + 26;
    const at = xs.filter(x => Math.abs(x - edge) < 0.01).length;
    if (at !== n) bad.push(lane + ': ' + at + ' edge(s) at the boundary, want ' + n);
  }
  if (bad.length) {
    console.error('TIMING-EDGE VIOLATION (timing genre):\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertBareNoQuote(engine) {
  // core §1: a bare position takes no quote anywhere in the
  // token. The header and the other genres' keywords cannot share a fixture
  // with 967, so they are pinned here.
  const bad = [];
  for (const [name, src, want] of [
    ['header version', 'figdown 0".5" block\nnode a', /^Line 1: this position takes a BARE value/],
    ['header genre', 'figdown 0.5 bl"ock"\nnode a', /^Line 1: this position takes a BARE value/],
    ['header keyword', '"figdown" 0.5 block\nnode a', /^Line 1: a keyword is written bare: figdown$/],
    ['sequence keyword', 'figdown 0.5 sequence\n"lifeline" a', /^Line 2: a keyword is written bare: lifeline$/],
    ['sequence id', 'figdown 0.5 sequence\nlifeline a"x"', /^Line 2: ids are bare/],
    ['child keyword', 'figdown 0.5 table\ntable t "T"\n| A |\n|---|\n| a |\n"cell" 1 highlight', /^Line 6: a keyword is written bare: cell$/],
    ['highlight flag', 'figdown 0.5 table\ntable t "T"\n| A |\n|---|\n| a |\ncell 1 high"light"', /^Line 6: this position takes a BARE value/],
    ['not a keyword', 'figdown 0.5 block\n"foo" a', /^Line 2: "foo" is not allowed in genre block$/]]) {
    const { errs } = engine.parse(src);
    if (!errs || errs.length !== 1 || !want.test(errs[0])) bad.push(name + ': ' + JSON.stringify(errs));
  }
  if (bad.length) {
    console.error('BARE-NO-QUOTE VIOLATION (core §1):\n  ' + bad.join('\n  '));
    process.exit(1);
  }
}

function assertParallelLabelsApart(engine) {
  const bad = [];
  for (const n of [3, 5]) {
    const src = ['figdown 0.5 topology', 'flow down', 'node a "Alpha"', 'node b "Beta"']
      .concat(Array.from({ length: n }, (_, i) => 'edge a -[member ' + (i + 1) + ' link]- b')).join('\n');
    const { doc, errs } = engine.parse(src);
    if (errs && errs.length) { bad.push(n + ' links: the property figure no longer parses: ' + errs.join('; ')); continue; }
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    const L = [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="11" text-anchor="(\w+)" fill="(?!#fff")[^"]*">(member \d link)/g)]
      .map(m => { const w = m[4].length * 5.5, x = +m[1];
        const x0 = m[3] === 'start' ? x : m[3] === 'end' ? x - w : x - w / 2;
        return { t: m[4], x0, x1: x0 + w, y0: +m[2] - 9, y1: +m[2] + 2 }; });
    const R = [...svg.matchAll(/<rect x="[-\d.]+" y="([-\d.]+)" width="[\d.]+" height="([\d.]+)"[^>]*stroke="#8a8880"/g)]
      .map(m => [+m[1], +m[1] + +m[2]]).sort((p, q) => p[0] - q[0]);
    if (L.length !== n) { bad.push(n + ' links: found ' + L.length + ' labels'); continue; }
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      if (!(a.y0 >= R[0][1] && a.y1 <= R[1][0])) bad.push(n + ' links: "' + a.t + '" is not between the boxes');
      for (let j = i + 1; j < L.length; j++) { const b = L[j];
        if (Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0))
          bad.push(n + ' links: "' + a.t + '" overlaps "' + b.t + '"'); }
    }
  }
  // 0.5: 99 or more such links once left no label position, and
  // render threw. Across the flow (`rank a,b`) the links take no slots.
  for (const lay of [['flow down'], ['flow up'], ['flow down', 'rank a,b']]) {
    const src = ['figdown 0.5 topology'].concat(lay, ['node a "Alpha"', 'node b "Beta"'])
      .concat(Array.from({ length: 99 }, (_, i) => 'edge a -[l' + (i + 1) + ']- b')).join('\n');
    try { engine.render(engine.parse(src).doc, {}); }
    catch (e) { bad.push('99 links, ' + lay.join(' + ') + ': render threw: ' + e.message); }
  }
  // 0.5: under horizontal flow a same-rank pair with three or more
  // labelled links slots them along the run. Three 3-line labels overlapped
  // in a 47 px gap; two keep that gap.
  for (const n of [2, 3]) {
    const names = ['alpha\\nbeta\\ngamma', 'delta\\nepsilon\\nzeta', 'eta\\ntheta\\niota'].slice(0, n);
    const src = ['figdown 0.5 topology', 'flow left', 'rank n0,n1', 'node n0 "Zero"', 'node n1 "One"']
      .concat(names.map(t => 'edge n0 -["' + t + '"]- n1')).join('\n');
    const { doc, errs } = engine.parse(src);
    if (errs && errs.length) { bad.push('horizontal ' + n + ': no longer parses: ' + errs.join('; ')); continue; }
    const out = engine.render(doc, {});
    const svg = (out && typeof out === 'object') ? (out.svg || '') : String(out || '');
    const L = [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="11" text-anchor="(\w+)" fill="(?!#fff")[^"]*">([\s\S]*?)<\/text>/g)]
      .map(m => { const lines = [...m[4].matchAll(/>([^<]*)<\/tspan>/g)].map(x => x[1]);
        const w = Math.max(...lines.map(t => t.length)) * 5.5, x = +m[1];
        const x0 = m[3] === 'start' ? x : m[3] === 'end' ? x - w : x - w / 2;
        return { t: lines.join('/'), x0, x1: x0 + w, y0: +m[2] - 9, y1: +m[2] + 11 * (lines.length - 1) + 2 }; });
    const R = [...svg.matchAll(/<rect x="[-\d.]+" y="([-\d.]+)" width="[\d.]+" height="([\d.]+)"[^>]*stroke="#8a8880"/g)]
      .map(m => [+m[1], +m[1] + +m[2]]).sort((p, q) => p[0] - q[0]);
    if (L.length !== n || R.length !== 2) { bad.push('horizontal ' + n + ': found ' + L.length + ' labels, ' + R.length + ' boxes'); continue; }
    const gap = R[1][0] - R[0][1];
    if (n === 2 && Math.abs(gap - 47) > 0.5) bad.push('horizontal 2: the gap moved (47 -> ' + gap + ' px)');
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const p = L[i], q = L[j];
      if (Math.min(p.x1, q.x1) > Math.max(p.x0, q.x0) && Math.min(p.y1, q.y1) > Math.max(p.y0, q.y0))
        bad.push('horizontal ' + n + ': "' + p.t + '" overlaps "' + q.t + '"'); }
  }
  if (bad.length) {
    console.error('PARALLEL LABEL PROPERTY FAILED: labelled parallel');
    console.error('links stack their labels — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

// GROUP-SEPARATION-PLACEMENT — the group-separation push never moves a node out of
// the figure or onto another node.
//
// THE DEFECT THIS PINS. The pass that keeps a non-member out of a `group`
// band pushes the intruder clear, and carries along whatever it would be
// pushed onto. It tested only the MOVER against the layout's starting edge,
// so a node it carried could land past that edge, where the viewBox clipped
// it away: figure 1 below drew `b` at y=-58 on a 248-px canvas, exit 0, no
// error — the drawing said `b` is not there. And a node lying between the
// mover and the band edge was neither carried nor avoided, so the mover could
// land on it: figure 2 drew two nodes in the same box. On 1500 random group
// figures (the seed figure 2 comes from) the fix takes 76 off-canvas and 6
// overlapping drawings to 0 and 0; no tracked `.fd` changed a byte.
//
// WHY IT IS HERE AND NOT IN cases/: the same reason as GROUP-BOUNDARY-OBSTACLE's test. Both
// figures render clean, so a `.geometry.txt` golden would be absent, and a
// model golden cannot see a coordinate.
//
// THE PROPERTY. Every drawn node box lies inside the viewBox, and no two
// drawn node boxes overlap.
function assertGroupPushStaysOnCanvas(engine) {
  const FIGS = [
    ['carried node pushed off the canvas', [
      'figdown 0.5 block',
      'group g "G"',
      'node a "A" in=g',
      'node b "B"',
      'node c "C"',
      'node d "D" in=g',
      'edge c -> a',
    ]],
    ['mover lands on a node it left behind', [
      'figdown 0.5 block',
      'flow right',
      'group g0 "G0"',
      'group g1 "G1"',
      'group g2 "G2"',
      'node n0 "N0" in=g1',
      'node n1 "N1x"',
      'node n2 "N2x"',
      'node n3 "N3x" in=g2',
      'node n4 "N4xxxxxxxxxxx"',
      'node n5 "N5xxxxxxxxxx" in=g1',
      'node n6 "N6xxxx"',
      'node n7 "N7xxxx" in=g2',
      'node n8 "N8xxxxx"',
      'node n9 "N9x" in=g2',
      'edge n6 -> n0',
      'edge n5 -> n8',
      'edge n1 -> n9',
      'edge n7 -> n9',
      'edge n3 -> n8',
      'edge n7 -> n1',
      'edge n1 -> n2',
      'edge n2 -> n1',
    ]],
  ];
  const bad = [];
  for (const [name, lines] of FIGS) {
    const { doc, errs: errors } = engine.parse(lines.join('\n'));
    if (errors && errors.length) { bad.push(name + ': no longer parses: ' + errors.join('; ')); continue; }
    const out = engine.render(doc, {});
    if (out.errs && out.errs.length) { bad.push(name + ': refused: ' + out.errs[0]); continue; }
    const svg = out.svg || '';
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    const tr = svg.match(/<g transform="translate\(([-\d.]+),([-\d.]+)\)">/);
    const ox = tr ? +tr[1] : 0, oy = tr ? +tr[2] : 0;
    const boxes = [];
    const re = /<g data-node="([^"]+)" data-x="([-\d.e]+)" data-y="([-\d.e]+)"[^>]*>(.*?)<\/g>/g;
    let m;
    while ((m = re.exec(svg))) {
      const r = m[4].match(/<rect[^>]*width="([\d.]+)" height="([\d.]+)"/);
      if (r) boxes.push({ id: m[1], x: +m[2] + ox, y: +m[3] + oy, w: +r[1], h: +r[2] });
    }
    if (!boxes.length) { bad.push(name + ': no node box found in the render'); continue; }
    for (const b of boxes) {
      if (b.x < vb[0] - 0.5 || b.y < vb[1] - 0.5 || b.x + b.w > vb[0] + vb[2] + 0.5 || b.y + b.h > vb[1] + vb[3] + 0.5)
        bad.push(name + ': node "' + b.id + '" at (' + b.x + ',' + b.y + ') lies outside viewBox ' + vb.join(' '));
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5)
        bad.push(name + ': nodes "' + a.id + '" and "' + b.id + '" overlap');
    }
  }
  if (bad.length) {
    console.error('GROUP-PUSH PROPERTY FAILED (GROUP-SEPARATION-PLACEMENT): the group-separation');
    console.error('push must keep every node on the canvas and off every other node — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

// 0.5 — an input-sized list never becomes a call's argument
// list.
//
// THE DEFECT THIS PINS. The renderer measured a label, a table cell, a note or
// a timing figure by spreading one array element per input line into
// `Math.max(...)`/`Math.min(...)`. A call's arguments live on the stack, so
// about 130k lines in ONE label overflowed it: render() threw `RangeError:
// Maximum call stack size exceeded` instead of drawing or refusing. Twelve
// sites now fold the list instead; the output of every input that rendered
// before is unchanged.
//
// WHY IT IS HERE AND NOT IN cases/. A fixture would have to BE the large
// input — a quarter of a megabyte of source and a model golden of 200k lines,
// committed to pin one property. Both figures render clean, so a
// `.geometry.txt` golden would be absent too. The property is a statement
// about render() not throwing, which this file's in-process tests already
// make, so the input is generated here instead: 200k lines in a node label
// (the measured-label sites) and 200k `<br>` breaks in a table cell (the
// typed-block sites). Under a second each.
//
// THE PROPERTY. Both figures render without throwing and without a refusal.
function assertInputSizedArrays(engine) {
  const N = 200000;
  const FIGS = [
    ['a node label of ' + N + ' lines',
      'figdown 0.5 block\nnode a "' + 'x\\n'.repeat(N) + 'x"\n'],
    ['a table cell of ' + N + ' line breaks',
      'figdown 0.5 table\ntable t "T"\n| A |\n|---|\n| ' + 'x<br>'.repeat(N) + 'x |\n'],
  ];
  const bad = [];
  for (const [name, src] of FIGS) {
    const { doc, errs: errors } = engine.parse(src);
    if (errors && errors.length) { bad.push(name + ': no longer parses: ' + errors[0]); continue; }
    let out;
    try { out = engine.render(doc, {}); }
    catch (e) { bad.push(name + ': render threw ' + e.constructor.name + ': ' + e.message); continue; }
    if (out.errs && out.errs.length) bad.push(name + ': refused: ' + out.errs[0]);
  }
  if (bad.length) {
    console.error('INPUT-SIZED ARRAY PROPERTY FAILED: render() must');
    console.error('not spread an input-sized list into a call — ' + bad.length + ' violation(s):');
    for (const b of bad) console.error('  ' + b);
    process.exit(1);
  }
}

const normalize = require('./normalize.js');

const args = process.argv.slice(2);

// An unknown `--flag` is REFUSED, never ignored. Until 2026-08-24 this runner
// dropped anything it did not recognise, which is survivable for `--experimntal`
// (the run is visibly smaller) and dangerous for `--engine-cmd`: a caller who
// mistypes the flag that selects THEIR engine gets a green run of OURS and no
// hint that their program was never executed. A conformance runner that can
// report someone else's pass as your own is worse than one that refuses to
// start, so it refuses to start. Same axiom as the language: unknown input is
// an error, never silence (core §8).
const KNOWN_FLAGS = ['--update', '--experimental', '--help'];
const unknownFlags = args.filter(a => a.startsWith('--')
  && !KNOWN_FLAGS.includes(a) && !a.startsWith('--engine-cmd='));
if (unknownFlags.length) {
  console.error('unrecognized option(s): ' + unknownFlags.join(' '));
  console.error('usage: node conformance/run.js [--update] [--experimental]');
  console.error("       [--engine-cmd='<command>'] [name-filter]");
  console.error('');
  console.error('Refused rather than ignored: if this was a mistyped');
  console.error("--engine-cmd='…', running anyway would have tested the");
  console.error('reference engine and reported the result as yours.');
  process.exit(2);
}

const update = args.includes('--update');
const experimental = args.includes('--experimental');
const filter = args.filter(a => !a.startsWith('--'))[0] || null;

// Subprocess mode. The CLI form is PRIMARY (it makes the run reproducible from
// its own command line); the environment variable is the same switch for a
// caller who cannot edit the command, and the CLI wins when both are set. Only
// the `--engine-cmd=<command>` spelling is accepted — a space-separated form
// would be indistinguishable from the positional name-filter.
const cmdArg = args.find(a => a.startsWith('--engine-cmd='));
const ENGINE_CMD = (cmdArg ? cmdArg.slice('--engine-cmd='.length)
                           : (process.env.FIGDOWN_ENGINE_CMD || '')).trim() || null;
if (ENGINE_CMD && update) {
  console.error('--update is refused in subprocess mode: goldens are minted by the');
  console.error('reference engine and by nothing else. Re-run without --engine-cmd.');
  process.exit(2);
}
const { spawnSync } = require('child_process');

// One fixture through the external command. Returns exactly one of
// {model}, {errLines} or {fatal} — see conformance/README.md for the rules
// these three cases encode.
function runEngineCmd(srcBuf) {
  const r = spawnSync(ENGINE_CMD, {
    shell: true,
    input: srcBuf,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (r.error) return { fatal: 'engine command could not be run: ' + r.error.message };
  const stderr = r.stderr ? r.stderr.toString('utf8') : '';
  const tail = stderr.trim() ? '\n--- stderr\n' + stderr : '';
  if (r.signal) return { fatal: 'engine command killed by signal ' + r.signal + tail };
  const stdout = r.stdout ? r.stdout.toString('utf8') : '';
  if (r.status === 0) return { model: stdout };
  if (r.status === 1) {
    // One `Line N: <message>` per line. The final LF is required by the
    // contract but a missing one is tolerated here rather than turned into a
    // second, confusing failure mode; an EMPTY line is not tolerated, because
    // no diagnostic is empty and swallowing one would hide a truncated list.
    const lines = stdout.split('\n');
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (!lines.length) return { fatal: 'engine command exited 1 but named no error' + tail };
    const blank = lines.findIndex(l => l === '');
    if (blank >= 0) return { fatal: 'engine command emitted an empty error line at position ' + (blank + 1) + tail };
    return { errLines: lines };
  }
  return { fatal: 'engine command exited ' + r.status +
                  ' (0 = model on stdout, 1 = errors on stdout; anything else is a failure)' + tail };
}

// --- reason manifest (conformance/STATUS.txt) -----------------------------
// Line-oriented, `#` comments, `default normative` plus one record per
// EXPERIMENTAL fixture: `<case>  <reason>[,<reason>...]  <note>`. Since
// 0.1 the manifest does not decide any bucket — the directory does —
// so it is validated in both directions: every record must name a fixture in
// experimental/, and every fixture in experimental/ must carry a record.
const STATUS_FILE = path.join(__dirname, 'STATUS.txt');
const NORMATIVE_DIR   = path.join(__dirname, 'cases');
const EXPERIMENTAL_DIR = path.join(__dirname, 'experimental');

function loadStatus(expDir) {
  const tags = new Map();               // case base name -> [reason, ...]
  if (!fs.existsSync(STATUS_FILE)) {
    console.error('missing ' + STATUS_FILE + ' — the reason manifest is required');
    process.exit(1);
  }
  const lines = fs.readFileSync(STATUS_FILE, 'utf8').split('\n');
  const bad = [];
  let sawDefault = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const m = /^(\S+)(?:\s+(\S+))?/.exec(line);
    if (m[1] === 'default') {
      sawDefault = true;
      if (m[2] !== 'normative') bad.push('STATUS.txt line ' + (i + 1) + ': only `default normative` is supported');
      return;
    }
    const name = m[1];
    if (!m[2]) { bad.push('STATUS.txt line ' + (i + 1) + ': "' + name + '" has no reason field'); return; }
    if (!fs.existsSync(path.join(expDir, name + '.fd'))) {
      bad.push('STATUS.txt line ' + (i + 1) + ': no such fixture "' + name + '" in experimental/');
      return;
    }
    if (tags.has(name)) { bad.push('STATUS.txt line ' + (i + 1) + ': "' + name + '" listed twice'); return; }
    const reasons = m[2].split(',').filter(Boolean);
    for (const r of reasons) {
      if (!/^(genre|construct)=\S+$/.test(r)) bad.push('STATUS.txt line ' + (i + 1) + ': bad reason "' + r + '" (expected genre=<g> or construct=<k>)');
    }
    tags.set(name, reasons);
  });
  if (!sawDefault) bad.push('STATUS.txt: missing the `default normative` line');
  // The other direction: an experimental fixture with no recorded reason.
  for (const f of fs.readdirSync(expDir).filter(f => f.endsWith('.fd')).sort()) {
    const base = f.replace(/\.fd$/, '');
    if (!tags.has(base)) bad.push('STATUS.txt: experimental/' + f + ' has no record — every experimental fixture states why it is outside the surface');
  }
  if (bad.length) { bad.forEach(b => console.error(b)); process.exit(1); }
  return tags;
}

// The manifest is validated on every run, so a stale entry is caught even by
// an --experimental invocation.
const STATUS = loadStatus(EXPERIMENTAL_DIR);

// A default run executes both corpora; --experimental executes the
// experimental one alone. Each entry carries the directory it came from,
// which is the ONLY thing that decides its bucket.
const corpora = experimental
  ? [{ dir: EXPERIMENTAL_DIR, exp: true }]
  : [{ dir: NORMATIVE_DIR, exp: false }, { dir: EXPERIMENTAL_DIR, exp: true }];

// A golden with no sibling `.fd` is never enumerated, so it would sit in the
// corpus checking nothing — a deleted case would leave its expectation behind
// and the run would not notice. Every corpus is checked, whatever the filter.
{
  const GOLDEN = /\.(model\.json|errors\.txt|geometry\.txt)$/;
  const orphans = [];
  for (const dir of [NORMATIVE_DIR, EXPERIMENTAL_DIR]) {
    for (const f of fs.readdirSync(dir).filter(f => GOLDEN.test(f)).sort()) {
      if (!fs.existsSync(path.join(dir, f.replace(GOLDEN, '.fd')))) {
        orphans.push(path.basename(dir) + '/' + f + ': golden with no ' + f.replace(GOLDEN, '.fd') + ' beside it');
      }
    }
  }
  // the corpus is CLOSED. A subdirectory or a file that is neither a case
  // nor one of its goldens is never run — `cases/zz/x.fd` would sit there
  // looking like coverage — so either is an error, not a silent skip.
  for (const dir of [NORMATIVE_DIR, EXPERIMENTAL_DIR]) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory())
        orphans.push(path.basename(dir) + '/' + f + '/: a subdirectory — the runner reads one level only, so nothing in it runs');
      else if (!f.endsWith('.fd') && !GOLDEN.test(f))
        orphans.push(path.basename(dir) + '/' + f + ': not a case (.fd) or a golden (.model.json, .errors.txt, .geometry.txt)');
    }
  }
  if (orphans.length) { orphans.forEach(o => console.error(o)); process.exit(1); }
}

let files = [];
for (const c of corpora) {
  for (const f of fs.readdirSync(c.dir).filter(f => f.endsWith('.fd')).sort()) {
    files.push({ dir: c.dir, exp: c.exp, file: f, base: f.replace(/\.fd$/, '') });
  }
}
if (filter) files = files.filter(f => f.file.includes(filter));
if (!files.length) { console.error('no cases match "' + (filter || '') + '"'); process.exit(1); }

const EXP = new Set(files.filter(f => f.exp).map(f => f.base));
const isExp = base => EXP.has(base);
const reasonOf = base => STATUS.get(base) || [];

// In subprocess mode the reference engine is never loaded — that is the whole
// point: the harness must run in a tree that has no figdown.html at all. The
// property tests below take the reference engine's PRIVATE symbols
// (`OPT_KEYS`, `LANE_RE`, `findComment`, `tokenize`, `render`), so they are in-process
// only and their absence is stated in the summary, not hidden.
const engine = ENGINE_CMD ? null : loadEngine();
if (engine) {
  assertLaneKeyNamespace(engine);
  assertCommentScanner(engine);
  assertGroupCrossingEdge(engine);
  assertGroupPushStaysOnCanvas(engine);
  assertInputSizedArrays(engine);
  assertSameRankLabelClear(engine);
  assertParallelLabelsApart(engine);
  assertHeaderRequired(engine);
  assertBareNoQuote(engine);
  assertTimingEdges(engine);
  assertMessageEdges(engine);
  assertLabelsOnCanvas(engine);
  assertGroupPushNoCover(engine);
  assertStackKeepsText(engine);
  assertBareCr(engine);
  assertSequenceNotes(engine);
  assertSequenceMargin(engine);
  assertGroupRankHint(engine);
  assertStatePillClears(engine);
  assertLabelsInside(engine);
}
let geometrySkipped = 0;
const tally = {
  normative:    { pass: 0, fail: 0, total: 0 },
  experimental: { pass: 0, fail: 0, total: 0 },
};
let updated = 0;
const failures = [];

function report(name, ok, why) {
  const t = tally[isExp(name) ? 'experimental' : 'normative'];
  const tag = isExp(name) ? '  [experimental: ' + reasonOf(name).join(',') + ']' : '';
  if (ok) { t.pass++; console.log('PASS  ' + name + tag); }
  else { t.fail++; failures.push({ name, why }); console.log('FAIL  ' + name + tag + '  — ' + why.split('\n')[0]); }
}

for (const f of files) {
  tally[f.exp ? 'experimental' : 'normative'].total++;
}

for (const entry of files) {
  const { dir: CASES, base } = entry;
  const srcBuf = fs.readFileSync(path.join(CASES, entry.file));
  const src = srcBuf.toString('utf8');
  const errPath = path.join(CASES, base + '.errors.txt');
  const modelPath = path.join(CASES, base + '.model.json');
  const geoPath = path.join(CASES, base + '.geometry.txt');

  // --- the implementation's verdict, from whichever path is in use --------
  // Exactly one of the two is non-null afterwards: `errs` when the document
  // is REFUSED, `modelBytes` when it is ACCEPTED. Everything below compares
  // the same two things against the same two goldens, whichever path
  // produced them — which is what makes the subprocess run evidence.
  let errs = null;         // ['Line N: message', ...], any order
  let modelBytes = null;   // canonical §12.5 serialization, bytes as compared
  if (ENGINE_CMD) {
    const r = runEngineCmd(srcBuf);
    if (r.fatal) { report(base, false, r.fatal); continue; }
    if (r.errLines) errs = r.errLines; else modelBytes = r.model;
  } else {
    let parsed;
    try { parsed = engine.parse(src); }
    catch (e) { report(base, false, 'parse threw: ' + e.message); continue; }
    const { doc } = parsed;
    const docs = parsed.docs && parsed.docs.length ? parsed.docs : (doc ? [doc] : []);
    if (parsed.errs.length) errs = parsed.errs;
    else {
      // Multi-section (MULTI-FIGURE-DOCUMENTS): { "sections": [ model, ... ] } (core §12.5);
      // single-section stays flat.
      try {
        modelBytes = docs.length > 1
          ? JSON.stringify({ sections: docs.map(d => normalize(d)) }, null, 2) + '\n'
          : JSON.stringify(normalize(doc), null, 2) + '\n';
      } catch (e) { report(base, false, 'normalize threw: ' + e.message); continue; }
    }
  }

  if (errs) {
    const actual = errs.slice().sort().join('\n') + '\n';
    if (update) {
      fs.writeFileSync(errPath, actual);
      if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
      if (fs.existsSync(geoPath)) fs.unlinkSync(geoPath);
      updated++; console.log('UPDT  ' + base + '  (' + errs.length + ' error line' + (errs.length > 1 ? 's' : '') + ')');
      continue;
    }
    if (fs.existsSync(modelPath)) { report(base, false, 'stale golden: case now errors but ' + base + '.model.json exists'); continue; }
    if (fs.existsSync(geoPath)) { report(base, false, 'stale golden: case now errors but ' + base + '.geometry.txt exists'); continue; }
    if (!fs.existsSync(errPath)) { report(base, false, 'missing golden ' + base + '.errors.txt — actual errors:\n' + actual); continue; }
    const expected = fs.readFileSync(errPath, 'utf8');
    if (expected !== actual) { report(base, false, 'error mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
    report(base, true);
    continue;
  }

  // valid case: canonical model golden
  const actual = modelBytes;

  // RENDERER-CLASS CHECKS — in-process only (core §0.2: the subprocess
  // contract covers the Parser class). Both need render(), which is not on
  // the contract's surface; a subprocess run counts the geometry goldens it
  // did not check and prints the number rather than absorbing the gap.
  if (ENGINE_CMD) {
    if (fs.existsSync(geoPath)) geometrySkipped++;
  } else {
    // determinism self-check (spec section 3, renderer tier): parse+render
    // twice, byte-compare. Runs in --update mode too — a non-deterministic
    // engine must never mint goldens.
    try {
      const renderParsed = (p) => {
        const ds = p.docs && p.docs.length ? p.docs : [p.doc];
        if (ds.length > 1) return engine.stackSectionSvgs(ds.map(d => engine.render(d)));
        return engine.render(ds[0]).svg;
      };
      const svg1 = renderParsed(engine.parse(src));
      const svg2 = renderParsed(engine.parse(src));
      if (svg1 !== svg2) { report(base, false, 'determinism self-check: two renders of the same source differ'); continue; }
    } catch (e) { report(base, false, 'render threw: ' + e.message); continue; }

    // GEOMETRY-TIME DIAGNOSTICS. A figure whose SOURCE is
    // impeccable can still draw a false statement — a group band that encloses a
    // non-member, a pin that covers a node completely — and the engine reports
    // those from `render`, not from `parse`. Until now nothing in this corpus
    // could express one: the runner rendered only to compare two byte streams and
    // threw the diagnostics away, so the whole channel `tools/build-svg.js` gates
    // artifacts on was untested. A case that renders with diagnostics is pinned by
    // NNN-name.geometry.txt, exactly as a parse error is pinned by
    // NNN-name.errors.txt; a case that renders clean must have no such golden.
    let gerrs;
    try {
      const p2 = engine.parse(src);
      const ds = p2.docs && p2.docs.length ? p2.docs : [p2.doc];
      gerrs = ds.reduce((a, d) => a.concat(engine.render(d).errs || []), []);
    } catch (e) { report(base, false, 'render threw: ' + e.message); continue; }
    const gActual = gerrs.length ? gerrs.slice().sort().join('\n') + '\n' : '';
    if (update) {
      if (gerrs.length) { fs.writeFileSync(geoPath, gActual); updated++; console.log('UPDT  ' + base + '  (' + gerrs.length + ' geometry diagnostic' + (gerrs.length > 1 ? 's' : '') + ')'); }
      else if (fs.existsSync(geoPath)) fs.unlinkSync(geoPath);
    } else if (gerrs.length) {
      if (!fs.existsSync(geoPath)) { report(base, false, 'missing golden ' + base + '.geometry.txt — actual geometry diagnostics:\n' + gActual); continue; }
      const gExpected = fs.readFileSync(geoPath, 'utf8');
      if (gExpected !== gActual) { report(base, false, 'geometry mismatch\n--- expected\n' + gExpected + '--- actual\n' + gActual); continue; }
    } else if (fs.existsSync(geoPath)) {
      report(base, false, 'stale golden: case now renders clean but ' + base + '.geometry.txt exists'); continue;
    }
  }

  if (update) {
    fs.writeFileSync(modelPath, actual);
    if (fs.existsSync(errPath)) fs.unlinkSync(errPath);
    updated++; console.log('UPDT  ' + base + '  (model)');
    continue;
  }
  if (fs.existsSync(errPath)) { report(base, false, 'stale golden: case now parses clean but ' + base + '.errors.txt exists'); continue; }
  if (!fs.existsSync(modelPath)) { report(base, false, 'missing golden ' + base + '.model.json'); continue; }
  const expected = fs.readFileSync(modelPath, 'utf8');
  if (expected !== actual) { report(base, false, 'model mismatch\n--- expected\n' + expected + '--- actual\n' + actual); continue; }
  report(base, true);
}

const N = tally.normative, X = tally.experimental;
const fail = N.fail + X.fail;

console.log('');
// Printed ONLY in subprocess mode, so the default run's output — which
// tools/make-proof.js parses — is byte-for-byte what it always was.
if (ENGINE_CMD) {
  console.log('HARNESS  subprocess  [' + ENGINE_CMD + ']');
  console.log('PARSER-CLASS RUN (core §0.2). Model goldens and error goldens were');
  console.log('compared against the external command\'s stdout, by the same code and');
  console.log('against the same files the in-process path uses. Renderer-class checks');
  console.log('were NOT run: ' + geometrySkipped + ' geometry golden(s) unchecked, no determinism');
  console.log('self-check, and the five reference-engine property tests skipped — all');
  console.log('of them need in-process access to the engine. Contract: conformance/README.md.');
  console.log('');
}
if (update) {
  console.log(updated + ' golden(s) written, ' + fail + ' failure(s)');
} else if (experimental) {
  console.log('CORPUS  conformance/experimental/' + (filter ? '  (filter: ' + filter + ')' : ''));
  console.log('EXPERIMENTAL — outside the v0.1 conformance surface. A conforming');
  console.log('implementation MAY skip every case here. Never counted in the');
  console.log('normative total; run `node conformance/run.js` for that number.');
  console.log('  ' + X.pass + ' passed, ' + X.fail + ' failed, ' + X.total + ' total');
} else {
  // breakdown over the cases actually run, so a filtered run does not
  // quote whole-manifest figures next to a partial total.
  const byReason = { genre: 0, construct: 0, both: 0 };
  for (const f of files) {
    const rs = STATUS.get(f.base);
    if (!rs) continue;
    const g = rs.some(r => r.startsWith('genre=')), c = rs.some(r => r.startsWith('construct='));
    if (g && c) byReason.both++; else if (g) byReason.genre++; else if (c) byReason.construct++;
  }
  console.log('CORPORA  conformance/cases/ + conformance/experimental/' +
              (filter ? '  (filter: ' + filter + ')' : ''));
  console.log('');
  console.log('NORMATIVE — conformance/cases/, the v0.1 conformance surface. THIS');
  console.log('is "the conformance suite" and the only number that may be quoted');
  console.log('as one.');
  console.log('  ' + N.pass + ' passed, ' + N.fail + ' failed, ' + N.total + ' total');
  console.log('');
  console.log('EXPERIMENTAL — conformance/experimental/. Run above and required to');
  console.log('pass, because they pin reference-engine behaviour, but their SUBJECT');
  console.log('is outside the surface (CONSTRUCT-STATUS-TIERS: experimental genres, demoted constructs,');
  console.log('`chart`), so they are NOT part of the total above. A second');
  console.log('implementation may skip the whole directory and still conform; the');
  console.log('reason for each is recorded in conformance/STATUS.txt.');
  console.log('  ' + X.pass + ' passed, ' + X.fail + ' failed, ' + X.total + ' total' +
              '   (' + (byReason.genre + byReason.both) + ' by genre, ' +
              (byReason.construct + byReason.both) + ' by demoted construct, ' +
              byReason.both + ' both)');
  console.log('');
  console.log('Run `node conformance/run.js --experimental` for that corpus alone.');
  console.log('');
  console.log('TOTAL RUN  ' + (N.pass + X.pass) + ' passed, ' + fail + ' failed, ' +
              (N.total + X.total) + ' total  (exit 1 on any failure, either bucket)');
}
for (const f of failures) {
  console.log('\n=== FAIL ' + f.name + '\n' + f.why);
}
process.exit(fail ? 1 : 0);
