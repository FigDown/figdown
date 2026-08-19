#!/usr/bin/env node
// genre-probe.js — THE GENRE-SELECTION BASELINE.
//
// WHAT IT MEASURES
// ----------------
// The cold-reader comprehension suite (tools/comprehension-check.js) measures
// whether an agent can READ a `.fd`. This measures the step before that:
// given a figure to author and nothing but today's documents, does an agent
// pick the right genre for line 1?
//
// It exists because a genre-selection guideline was proposed, and the two
// numbers that would price it are UNRECOVERABLE once such a guideline ships:
//
//   naive  (control)  the eight genre names, one "use when" line each, no
//                     bundle at all. This is the model's PRIOR — what it picks
//                     with no help from this project.
//   cold   (baseline) today's `skill/figdown/SKILL.md`, verbatim, pasted into
//                     the message. This is what the CURRENT documents produce.
//
// The decision the numbers settle is stated in decisions/registry.md
// and was fixed BEFORE the run: if `cold` is high, the honest recommendation
// is the minimal intervention; if `cold` is low, or below `naive` (which is
// what "prefer block when portable" predicts), the full gate ships.
//
// THE TRAP THIS TOOL IS BUILT AROUND
// ----------------------------------
// The comprehension suite's trap was authoring questions from the `.fd`. The
// trap here is authoring the ANSWER KEY from the guideline you are about to
// recommend — an exam whose key is the proposal cannot fail the proposal. So:
//
//   * every subject brief (subjects.json) describes only the FIGURE SOMEONE
//     NEEDS. It never names a genre, never uses a genre document's own
//     defining phrasing, never mentions a header line;
//   * the briefs were frozen BEFORE any ladder, table or precedence text was
//     drafted anywhere — see subjects.json `frozen_at_commit`;
//   * the keys were written by THREE INDEPENDENT LABELERS who saw the briefs
//     and the eight genre documents' own opening Purpose paragraphs, quoted
//     verbatim, and NOTHING ELSE. No selection guideline of any kind, drafted
//     or shipped, was shown to any of them;
//   * the key is the MAJORITY of the three primaries, mechanically. Unanimous
//     -> a single-genre key. Split 2-1 -> the key accepts EITHER, and only
//     with a stated reason: independent labelers with the same information
//     disagreeing is the operational definition of an ambiguous subject.
//     Split three ways -> `key-disputed`, left for the maintainer. This tool
//     does not adjudicate a dispute and does not score a disputed subject.
//
// THE COLD ROOM
// -------------
// Identical in kind to the comprehension suite's (decisions/registry.md
// §2): an isolated empty temporary directory outside the repository, every
// tool denied BY NAME, no MCP servers, no settings/memory/skills/plugins/hooks,
// no session persistence, one turn. The bundle is PASTED INTO THE MESSAGE
// rather than read from disk, so the recorded SHA-256 covers exactly what was
// presented — a reader with no Read tool could not have opened it anyway.
//
// WHAT A READER EMITS
// -------------------
// Only the two lines that open a FigDown document: the provenance comment and
// the header. The score is the third token of the header line (the genre);
// the second token (the version) is scored separately. A reader may put a
// short reason in a trailing `#` comment on the header line — that comment is
// what makes an "either" answer scorable and what makes a general-genre answer
// an honest fallback rather than a shrug.
//
// USAGE
//   node tools/genre-probe/genre-probe.js --label --labelers 3   author the keys (live)
//   node tools/genre-probe/genre-probe.js --keys                 derive keys.json (offline)
//   node tools/genre-probe/genre-probe.js --run --condition cold --readers 3
//   node tools/genre-probe/genre-probe.js --run --condition naive --readers 3
//   node tools/genre-probe/genre-probe.js                        score (offline)
//   node tools/genre-probe/genre-probe.js --report               the tables, as Markdown
//   node tools/genre-probe/genre-probe.js --audit                every answer, verbatim
//   node tools/genre-probe/genre-probe.js --verify               transcripts still match
//   node tools/genre-probe/genre-probe.js --dump <sid> --condition cold
//   node tools/genre-probe/genre-probe.js --strict               fail on an unclassified miss
//
// `--label` and `--run` are the only modes that call a model. Everything else
// is a pure function of files in the tree. Exit codes: 0 clean · 1 a finding
// · 2 tool error.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync, spawn } = require('child_process');

const PROBE_VERSION = '1.0.0';
const HERE = __dirname;
const ROOT = path.resolve(HERE, '..', '..');
const SUBJECTS_FILE = path.join(HERE, 'subjects.json');
const KEYS_FILE = path.join(HERE, 'keys.json');
const LABELS_DIR = path.join(HERE, 'labels');
const TDIR = path.join(HERE, 'transcripts');
const FAIL_FILE = path.join(HERE, 'failure-analysis.json');
const RESULTS_FILE = path.join(HERE, 'results.json');
const BUNDLE_FILE = path.join(ROOT, 'skill', 'figdown', 'SKILL.md');

const CONDITIONS = ['naive', 'cold'];
const GENRES = ['block', 'bitfield', 'table', 'topology', 'flowchart', 'statechart', 'timing', 'sequence'];

// The version each genre requires. Recorded here as the SCORING KEY, taken
// from the genre documents themselves (statechart.md "It requires `figdown
// 0.2`", sequence.md "It requires `figdown 0.4`"); everything else is 0.1.
const REQUIRED_VERSION = {
  block: '0.1', bitfield: '0.1', table: '0.1', topology: '0.1',
  flowchart: '0.1', timing: '0.1', statechart: '0.2', sequence: '0.4',
};

// Guideline-absent failure taxonomy. `ladder-not-consulted` is N/A: there is
// no ladder. Every miss must carry one of these or --strict fails.
const FAILURE_CLASSES = [
  'prior-override',      // the model's untutored prior won; the bundle did not move it
  'subject-misread',     // the genre is wrong about what the brief describes, under any guideline
  'portability-override',// chose a portable genre deliberately, with a stated reason. Arguably correct: counted, never silently credited
  'key-disputed',        // the three labelers split three ways; the subject has no key
  'unreasoned-either',   // an ambiguous subject answered inside the accepted pair but with no stated reason
  'version-error',       // genre right, version wrong (scored separately from the genre rate)
];

// ── the cold room ────────────────────────────────────────────────────────────
// Copied deliberately, not imported: this file must keep working if the
// comprehension tool is refactored, and the denial list is part of the record.
const DENIED_TOOLS = [
  'Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'Agent', 'Task', 'Skill', 'ToolSearch', 'Workflow',
  'ListAgents', 'ReportFindings', 'TaskOutput', 'TaskStop', 'SendMessage',
  'SendUserMessage', 'Monitor', 'EnterWorktree', 'ExitWorktree', 'ScheduleWakeup',
  'PushNotification', 'RemoteTrigger', 'CronCreate', 'CronDelete', 'CronList',
  'DesignSync', 'Artifact', 'ExitPlanMode', 'TodoWrite', 'SlashCommand',
  'BashOutput', 'KillShell', 'AskUserQuestion', 'Explore', 'Plan',
];

// ── the eight genres' own words ──────────────────────────────────────────────
// VERBATIM opening Purpose text from each genre document, transcribed at
// probe-freeze time. The labelers saw the long form; the `naive` condition
// sees the one-line form. Both come from this one place so that no reader and
// no labeler is working from a paraphrase somebody invented.
const PURPOSE_LONG = {
  block: 'Expresses a system as **parts and the relations between them**: functional blocks, pipelines, datapaths, layered stacks, and the containment that groups them. The largest genre in the corpus and the default choice for a figure that is not a topology, a flowchart, or one of the typed blocks.',
  bitfield: 'Expresses packet headers and hardware register layouts as an ordered list of named bit fields with widths. Renders as a ruled diagram with a bit-position ruler.',
  table: 'Expresses configuration tables, state tables, and memory maps as a logical grid with optional multi-level headers, cell spanning, per-cell colors, and row highlights. Renders as a formatted table SVG.',
  topology: 'Expresses a **network of devices and the links between them**: fabrics, overlays, access layers, peering diagrams. What the figure is about is the first distinction from `block`: the nodes are devices or endpoints, and the edges are physical or logical links rather than dataflow steps.',
  flowchart: 'Expresses a **procedure as ordered steps and the branches between them**: decision trees, error-handling paths, packet-processing procedures, configuration workflows. Distinguished from `block` by what the edges mean — control flow through time, not structural relation.',
  statechart: 'Expresses a **finite-state machine**: a closed set of **states** and the **transitions** among them. A `state` is a *mode of being* the machine is in; a `transition` is a change of mode on an event. Typical figures: protocol connection FSMs, session and lease lifecycles, hardware mode machines. Distinguished from `flowchart` by what the thing **is**: a flowchart step is performed, a state is endured.',
  timing: 'Expresses digital timing diagrams as per-signal character lanes where one character = one cycle. Renders as aligned signal waveforms with a time axis.',
  sequence: 'Expresses an **interaction**: a set of participants and the **messages** they exchange, **in time order**. A `lifeline` is a participant column; time runs down the page; a `message` is one occurrence with a place in that order. Typical figures: protocol handshakes, lease and renewal cycles, licence and authorisation flows.',
};

const PURPOSE_SHORT = {
  block: 'a system as parts and the relations between them — functional blocks, pipelines, datapaths, layered stacks, and the containment that groups them.',
  bitfield: 'packet headers and hardware register layouts, as an ordered list of named bit fields with widths.',
  table: 'configuration tables, state tables and memory maps, as a logical grid.',
  topology: 'a network of devices and the links between them — fabrics, overlays, access layers, peering diagrams.',
  flowchart: 'a procedure as ordered steps and the branches between them — decision trees, error-handling paths, configuration workflows.',
  statechart: 'a finite-state machine — a closed set of states and the transitions among them.',
  timing: 'digital timing diagrams, as per-signal character lanes where one character is one cycle.',
  sequence: 'an interaction — a set of participants and the messages they exchange, in time order.',
};

// ── helpers ──────────────────────────────────────────────────────────────────
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const die = (m) => { console.error('genre-probe: ' + m); process.exit(2); };
const pct = (n, d) => (d === 0 ? 0 : n / d);
const fmtPct = (x) => (x * 100).toFixed(1).padStart(5) + '%';

function readJSON(f) {
  let raw;
  try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { die('cannot read ' + path.relative(ROOT, f) + ': ' + e.message); }
  try { return JSON.parse(raw); } catch (e) { die('malformed JSON in ' + path.relative(ROOT, f) + ': ' + e.message); }
}

function loadSubjects() {
  const s = readJSON(SUBJECTS_FILE);
  if (!Array.isArray(s.subjects) || s.subjects.length < 24) die('the probe set must carry at least 24 subjects');
  const seen = new Set();
  for (const x of s.subjects) {
    if (!x.sid || !x.brief || !x.bucket) die('subject missing sid, bucket or brief');
    if (seen.has(x.sid)) die('duplicate sid ' + x.sid);
    seen.add(x.sid);
  }
  s._sha = sha(JSON.stringify(s.subjects.map((x) => [x.sid, x.brief])));
  return s;
}

// ── prompts ──────────────────────────────────────────────────────────────────
const LABELER_SYSTEM = [
  'You are an experienced technical-documentation editor. You are given the definitions of eight kinds of figure, quoted verbatim from the documents that define them, and a list of figures that people need drawn.',
  '',
  'For each figure, decide which ONE of the eight kinds it should be drawn as. Decide from the definitions you are given and from what the description says the figure has to show. There is no other rule book and you may not assume one exists.',
  '',
  'Some of these descriptions have one clearly right answer and some genuinely do not. Say so honestly: name a second kind as also defensible ONLY when you consider it as good an answer as your first, not merely the runner-up.',
  '',
  'Output one line per figure and nothing else — no preamble, no summary, no blank lines:',
  'SID primary=<kind> also=<kind|none> reason=<one short clause>',
  'Use the kind names exactly as they are given to you.',
].join('\n');

function labelerMessage(subjects) {
  const defs = GENRES.map((g) => `**${g}** — ${PURPOSE_LONG[g]}`).join('\n\n');
  const list = subjects.subjects.map((s) => `${s.sid}. ${s.brief}`).join('\n\n');
  return `THE EIGHT KINDS OF FIGURE (each definition is quoted verbatim from the document that defines that kind)\n\n${defs}\n\nTHE FIGURES PEOPLE NEED\n\n${list}\n\nNow output one line per figure, in the order above.\n`;
}

const READER_SYSTEM = [
  'You are an agent that writes figures as plain-text files in a format called FigDown. Someone has described a figure they need. Your job here is only the first decision: what the file\'s header line must say.',
  '',
  'A FigDown file opens with two lines — a provenance comment, then a header line of the form `figdown <version> <genre>`.',
  '',
  'Emit EXACTLY those two lines and nothing else. No preamble, no explanation, no code fence, no blank line before them. You may put a short reason as a trailing `#` comment at the end of the header line if you want to record why you chose as you did, or if more than one genre would be defensible.',
].join('\n');

function readerMessage(subject, condition, bundleText) {
  const brief = `THE FIGURE THAT IS NEEDED\n\n${subject.brief}\n`;
  if (condition === 'naive') {
    const defs = GENRES.map((g) => `- \`${g}\` — use for ${PURPOSE_SHORT[g]}`).join('\n');
    return `THE GENRES THAT EXIST\n\n${defs}\n\nThe version is a two-part number such as \`0.1\`.\n\n${brief}\nEmit the two opening lines of the file.\n`;
  }
  return `THE DOCUMENTATION YOU HAVE (complete, verbatim)\n-----BEGIN DOCUMENT-----\n${bundleText}-----END DOCUMENT-----\n\n${brief}\nEmit the two opening lines of the file.\n`;
}

// ── the live call ────────────────────────────────────────────────────────────
function cliArgs(model, system, budget) {
  return [
    '-p', '--model', model, '--system-prompt', system,
    '--disallowed-tools', DENIED_TOOLS.join(' '),
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--safe-mode', '--disable-slash-commands', '--no-session-persistence',
    '--permission-mode', 'dontAsk',
    '--output-format', 'json',
    '--max-budget-usd', String(budget),
  ];
}

function askSync(model, system, user, budget) {
  const room = fs.mkdtempSync(path.join(os.tmpdir(), 'genreprobe-'));
  const r = spawnSync('claude', cliArgs(model, system, budget), {
    input: user, cwd: room, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: Object.assign({}, process.env, { CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' }),
  });
  try { fs.rmSync(room, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  if (r.error) die('could not run the `claude` CLI: ' + r.error.message);
  try { return JSON.parse(r.stdout); } catch (e) {
    die('reader returned unparseable output (exit ' + r.status + '): ' + String(r.stdout).slice(0, 400));
  }
}

function askAsync(model, system, user, budget) {
  return new Promise((resolve) => {
    const room = fs.mkdtempSync(path.join(os.tmpdir(), 'genreprobe-'));
    const p = spawn('claude', cliArgs(model, system, budget), {
      cwd: room,
      env: Object.assign({}, process.env, { CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' }),
    });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { resolve({ _failed: 'spawn: ' + e.message }); });
    p.on('close', () => {
      try { fs.rmSync(room, { recursive: true, force: true }); } catch (e) { /* best effort */ }
      let j = null;
      try { j = JSON.parse(out); } catch (e) { j = { _failed: 'unparseable output: ' + (out || err).slice(0, 300) }; }
      resolve(j);
    });
    p.stdin.end(user);
  });
}

async function pool(items, width, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(width, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

// ── parsing a reader's two lines ─────────────────────────────────────────────
function parseHeader(text) {
  const lines = String(text || '').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^figdown\s+(\S+)\s+([A-Za-z][A-Za-z0-9_-]*)\s*(.*)$/);
    if (!m) continue;
    const rest = m[3] || '';
    const h = rest.indexOf('#');
    const reason = h >= 0 ? rest.slice(h + 1).trim() : '';
    return {
      version: m[1], genre: m[2].toLowerCase(), reason,
      reason_source: reason ? 'trailing comment on the header line' : null,
      header_line: line,
    };
  }
  // A reader that emitted no header line at all.
  return { version: null, genre: null, reason: '', reason_source: null, header_line: null };
}

function parseLabels(text) {
  const out = {};
  for (const raw of String(text || '').split('\n')) {
    // One labeler prefixed every line with the literal word `SID`; tolerated
    // here rather than re-run, because the tolerance changes no datum.
    const m = raw.trim().match(/^(?:sid\s+)?([A-Z]\d{2})\b[\s.:-]*primary\s*=\s*([A-Za-z-]+)\s+also\s*=\s*([A-Za-z-]+)\s*(?:reason\s*=\s*(.*))?$/i);
    if (!m) continue;
    const primary = m[2].toLowerCase();
    const also = m[3].toLowerCase();
    out[m[1].toUpperCase()] = {
      primary: GENRES.includes(primary) ? primary : ('?' + primary),
      also: also === 'none' ? null : (GENRES.includes(also) ? also : ('?' + also)),
      reason: (m[4] || '').trim(),
    };
  }
  return out;
}

// ── mode: --label ────────────────────────────────────────────────────────────
async function runLabelers(n, model, budget) {
  const subjects = loadSubjects();
  const system = LABELER_SYSTEM;
  const user = labelerMessage(subjects);
  fs.mkdirSync(LABELS_DIR, { recursive: true });
  const cli = (spawnSync('claude', ['--version'], { encoding: 'utf8' }).stdout || '').trim();
  console.log(`LABELING — ${n} independent labelers over ${subjects.subjects.length} subjects.`);
  console.log('Each sees the briefs and the eight genre documents\' own opening Purpose paragraphs. Nothing else.');
  const res = await pool(Array.from({ length: n }, (_, i) => i + 1), n, async (i) => {
    const r = await askAsync(model, system, user, budget);
    if (r._failed) { console.log(`  labeler ${i}: FAILED — ${r._failed}`); return null; }
    const labels = parseLabels(r.result);
    const rec = {
      probe_version: PROBE_VERSION,
      run: { utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), model_alias: model, model_used: Object.keys(r.modelUsage || {}).join(','), cli, labeler: i },
      saw: {
        shown: 'the system prompt, the eight genre documents\' own opening Purpose paragraphs quoted verbatim, and the 24 subject briefs — nothing else',
        not_shown: 'any genre-selection guideline, ladder, precedence rule or symptom table (drafted or shipped); the skill bundle; guide/authoring.md; any genre document beyond the quoted paragraph; the repository; the name of any figure in it',
        subjects_sha256: subjects._sha,
        system_sha256: sha(system),
        user_sha256: sha(user),
      },
      integrity: { turns: r.num_turns, permission_denials: (r.permission_denials || []).length, is_error: !!r.is_error },
      usage: { cost_usd: r.total_cost_usd, duration_ms: r.duration_ms },
      raw_answer_text: r.result,
      labels,
    };
    fs.writeFileSync(path.join(LABELS_DIR, `labeler-${i}.json`), JSON.stringify(rec, null, 2) + '\n');
    console.log(`  labeler ${i}: ${Object.keys(labels).length}/${subjects.subjects.length} parsed ($${(r.total_cost_usd || 0).toFixed(3)}, ${r.num_turns} turn)`);
    return rec;
  });
  return res;
}

// ── mode: --keys ─────────────────────────────────────────────────────────────
function deriveKeys() {
  const subjects = loadSubjects();
  const files = fs.existsSync(LABELS_DIR) ? fs.readdirSync(LABELS_DIR).filter((f) => /^labeler-\d+\.json$/.test(f)).sort() : [];
  if (files.length < 3) die('need at least three labeler files in tools/genre-probe/labels/');
  // Re-parsed from the stored verbatim text every time, so the key is always a
  // function of what the labeler actually wrote and never of a cached parse.
  const labelers = files.map((f) => {
    const l = readJSON(path.join(LABELS_DIR, f));
    l.labels = parseLabels(l.raw_answer_text);
    return l;
  });
  const out = {
    probe_version: PROBE_VERSION,
    subjects_sha256: subjects._sha,
    about: 'Answer keys for the genre-selection probe. Derived MECHANICALLY from three independent labelers by the rule below; no human and no guideline adjudicated any subject.',
    rule: 'ACCEPTED = every genre named as a primary by any labeler, plus every genre named `also defensible` by at least two of the three. One accepted genre -> a single-genre key. Two -> the key accepts EITHER, and only WITH a stated reason. Primaries split three ways -> key-disputed: no key, not scored, left for the maintainer.',
    rule_amendment: {
      what: 'The rule as first written derived the key from the PRIMARY votes alone and ignored the `also defensible` column.',
      why: 'Three subjects came back with a unanimous primary AND the same second genre named `also defensible` by two or three labelers — A03 by all three. A key that scores `block` on A03 as a miss would contradict the very labelers who wrote it, on a column they were explicitly told to fill in only when the second answer is as good as the first.',
      when: 'Applied after the labels were read and BEFORE any reader was run. No reader answer had been taken against any key. This is the comprehension suite\'s own discipline (decisions/registry.md: two key-review passes, both before any reader answer was consulted).',
      effect: 'A02, A03, A04 and B03 became `either-with-reason`. B03 is the one the designer did not expect: two of three labelers hold that a four-stage pipeline whose middle stages decompose is as defensible as a procedure. That is data, and it is recorded rather than overridden.',
    },
    provenance: {
      who_chose_the_briefs: 'the suite maintainer, before any selection guideline existed',
      who_chose_the_keys: labelers.map((l) => `labeler ${l.run.labeler} (${l.run.model_alias}, ${l.run.model_used || 'n/a'}, ${l.run.utc})`),
      what_the_labelers_saw: labelers[0].saw.shown,
      what_the_labelers_did_not_see: labelers[0].saw.not_shown,
      who_adjudicated_ties: 'nobody — a tie is recorded as key-disputed and handed to the maintainer unresolved',
    },
    keys: {},
  };
  for (const s of subjects.subjects) {
    const votes = labelers.map((l) => ({ labeler: l.run.labeler, ...(l.labels[s.sid] || { primary: null, also: null, reason: '(no line parsed)' }) }));
    const tally = {};
    for (const v of votes) if (v.primary) tally[v.primary] = (tally[v.primary] || 0) + 1;
    const ranked = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
    const alsoTally = {};
    for (const v of votes) if (v.also) alsoTally[v.also] = (alsoTally[v.also] || 0) + 1;
    const alsoAccepted = Object.keys(alsoTally).filter((g) => alsoTally[g] >= 2 && !ranked.includes(g));
    let type, accepted, preferred = null;
    if (ranked.length >= 3) { type = 'key-disputed'; accepted = ranked.slice(); }
    else {
      accepted = ranked.concat(alsoAccepted);
      preferred = ranked.length === 1 || tally[ranked[0]] > tally[ranked[1]] ? ranked[0] : null;
      type = accepted.length === 1 ? 'single' : 'either-with-reason';
    }
    out.keys[s.sid] = {
      bucket: s.bucket,
      type, accepted, preferred,
      required_version: accepted.length === 1 ? REQUIRED_VERSION[accepted[0]] : Object.fromEntries(accepted.map((g) => [g, REQUIRED_VERSION[g]])),
      designer_expectation: s.designer_expectation,
      designer_agrees_with_key: String(s.designer_expectation || '').includes(accepted[0] || ' ') || type === 'either-with-reason',
      votes: votes.map((v) => ({ labeler: v.labeler, primary: v.primary, also: v.also, reason: v.reason })),
      also_defensible_named_by: votes.filter((v) => v.also).map((v) => `${v.labeler}:${v.also}`),
      also_accepted_by_the_rule: alsoAccepted,
    };
  }
  const disputed = Object.keys(out.keys).filter((k) => out.keys[k].type === 'key-disputed');
  const either = Object.keys(out.keys).filter((k) => out.keys[k].type === 'either-with-reason');
  out.summary = {
    single: Object.keys(out.keys).length - disputed.length - either.length,
    either_with_reason: either.length, either_ids: either,
    key_disputed: disputed.length, key_disputed_ids: disputed,
    note_for_the_maintainer: disputed.length
      ? 'The subjects listed in key_disputed_ids split three ways among the labelers. They carry NO key, are excluded from every rate in results.json, and are yours to adjudicate. Do not resolve them from a guideline you are about to write.'
      : 'No subject split three ways; every subject carries a key.',
  };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`  wrote tools/genre-probe/keys.json — ${out.summary.single} single, ${out.summary.either_with_reason} either-with-reason, ${out.summary.key_disputed} key-disputed`);
  return out;
}

// ── mode: --run ──────────────────────────────────────────────────────────────
function bundle() {
  const t = fs.readFileSync(BUNDLE_FILE, 'utf8');
  return { text: t, sha: sha(t), path: path.relative(ROOT, BUNDLE_FILE) };
}

function transcriptName(sid, condition, reader) { return `${sid}.${condition}.r${reader}.json`; }

async function runCondition(condition, readers, model, budget, width, onlySid) {
  if (!CONDITIONS.includes(condition)) die('--condition must be one of ' + CONDITIONS.join(', '));
  const subjects = loadSubjects();
  const list = onlySid ? subjects.subjects.filter((s) => onlySid.includes(s.sid)) : subjects.subjects;
  if (!list.length) die('no subject matches --subject');
  const b = bundle();
  const cli = (spawnSync('claude', ['--version'], { encoding: 'utf8' }).stdout || '').trim();
  fs.mkdirSync(TDIR, { recursive: true });
  const jobs = [];
  for (const s of list) for (let i = 1; i <= readers; i++) jobs.push({ s, i });
  console.log(`LIVE RUN — condition=${condition}, ${list.length} subject(s) × ${readers} reader(s) = ${jobs.length} readings, model=${model}, concurrency=${width}`);
  console.log('Cold room: no tools, no MCP, no settings, empty cwd outside the repository. The bundle is pasted into the message.');
  let done = 0, spend = 0;
  await pool(jobs, width, async ({ s, i }) => {
    const user = readerMessage(s, condition, b.text);
    const r = await askAsync(model, READER_SYSTEM, user, budget);
    done++;
    if (r._failed) { console.log(`  [${done}/${jobs.length}] ${s.sid} r${i} FAILED — ${r._failed}`); return; }
    spend += r.total_cost_usd || 0;
    const parsed = parseHeader(r.result);
    const rec = {
      probe_version: PROBE_VERSION,
      run: { utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), model_alias: model, model_used: Object.keys(r.modelUsage || {}).join(','), cli, condition, reader: i },
      subject: { sid: s.sid, bucket: s.bucket, subjects_sha256: subjects._sha, brief_sha256: sha(s.brief) },
      presented: condition === 'cold'
        ? { what: 'the subject brief and ' + b.path + ', pasted verbatim into the message', bundle_path: b.path, bundle_sha256: b.sha, bundle_chars: b.text.length }
        : { what: 'the subject brief and the eight genre names, one "use when" line each, taken verbatim from PURPOSE_SHORT in this tool', bundle_path: null, bundle_sha256: null, bundle_chars: 0 },
      prompt: { system_sha256: sha(READER_SYSTEM), user_sha256: sha(user), user_chars: user.length },
      cold_room: {
        cwd: 'an isolated empty temporary directory outside the repository',
        tools_offered: 'none — every tool denied by name',
        mcp_servers: 'none',
        settings: 'safe-mode: no project or user settings, no memory file, no skills, no plugins, no hooks',
        session_persistence: false,
        shown: condition === 'cold'
          ? 'the system prompt, skill/figdown/SKILL.md verbatim, and the subject brief — nothing else'
          : 'the system prompt, eight genre names with one "use when" line each, and the subject brief — nothing else',
        not_shown: 'the specification, any genre document, any genre-selection guideline (none exists), guide/authoring.md, any .fd file, the repository, the answer key',
      },
      integrity: { turns: r.num_turns, permission_denials: (r.permission_denials || []).length, tool_calls_observed: r.num_turns > 1, is_error: !!r.is_error },
      usage: { cost_usd: r.total_cost_usd, input_tokens: (r.usage || {}).input_tokens, output_tokens: (r.usage || {}).output_tokens, duration_ms: r.duration_ms },
      raw_answer_text: r.result,
      answer: parsed,
    };
    fs.writeFileSync(path.join(TDIR, transcriptName(s.sid, condition, i)), JSON.stringify(rec, null, 2) + '\n');
    console.log(`  [${done}/${jobs.length}] ${s.sid} r${i} -> ${parsed.genre || '(no header)'} ${parsed.version || ''}${parsed.reason ? ' # ' + parsed.reason.slice(0, 48) : ''}`);
  });
  console.log(`done. condition=${condition}  spend $${spend.toFixed(3)}`);
}

// ── scoring ──────────────────────────────────────────────────────────────────
function loadTranscripts() {
  if (!fs.existsSync(TDIR)) return [];
  return fs.readdirSync(TDIR).filter((f) => f.endsWith('.json')).sort()
    .map((f) => Object.assign(readJSON(path.join(TDIR, f)), { _file: f }));
}

function scoreEverything() {
  const subjects = loadSubjects();
  const keys = fs.existsSync(KEYS_FILE) ? readJSON(KEYS_FILE) : die('no keys.json — run --label then --keys first');
  const failures = fs.existsSync(FAIL_FILE) ? (readJSON(FAIL_FILE).failures || {}) : {};
  const bundleSha = bundle().sha;
  const ts = loadTranscripts();
  const byCond = {};
  const stale = [];
  const unclassified = [];
  for (const t of ts) {
    const sid = t.subject.sid;
    const key = keys.keys[sid];
    if (!key) { stale.push(t._file + ': no key for ' + sid); continue; }
    const c = t.run.condition;
    byCond[c] = byCond[c] || { rows: [], cost: 0 };
    if (t.subject.subjects_sha256 !== subjects._sha) stale.push(t._file + ': the probe set changed since this reading');
    if (t.run.condition === 'cold' && t.presented.bundle_sha256 !== bundleSha) stale.push(t._file + ': ' + t.presented.bundle_path + ' changed since this reading');
    if (t.integrity.turns > 1) stale.push(t._file + ': reader took more than one turn — a tool may have been used');

    const a = t.answer || {};
    const inAccepted = a.genre && key.accepted.includes(a.genre);
    const hasReason = !!(a.reason && a.reason.trim().length >= 3);
    let scored, missClass = null;
    if (key.type === 'key-disputed') { scored = null; }
    else if (key.type === 'either-with-reason') {
      if (inAccepted && hasReason) scored = true;
      else if (inAccepted) { scored = false; missClass = 'unreasoned-either'; }
      else scored = false;
    } else scored = !!inAccepted;

    const cls = missClass || (scored === false ? (failures[`${sid}/${c}/r${t.run.reader}`] || failures[`${sid}/${c}`] || {}).class || null : null);
    if (scored === false && !cls) unclassified.push(`${sid}/${c}/r${t.run.reader} -> ${a.genre}`);
    if (cls && !FAILURE_CLASSES.includes(cls)) die('failure-analysis.json: unknown class "' + cls + '" at ' + sid + '/' + c);

    const wantVersion = a.genre && REQUIRED_VERSION[a.genre];
    const versionScored = a.genre && REQUIRED_VERSION[a.genre] ? (a.version === wantVersion) : null;

    byCond[c].rows.push({
      file: t._file, sid, bucket: t.subject.bucket, reader: t.run.reader,
      genre: a.genre, version: a.version, reason: a.reason, hasReason,
      keyType: key.type, accepted: key.accepted, scored, cls,
      // Sensitivity check: the same score with the stated-reason requirement
      // switched off, so the headline can be read without wondering how much
      // of it is that one rule.
      scoredReasonBlind: key.type === 'key-disputed' ? null : !!inAccepted,
      versionScored, wantVersion,
      cost: (t.usage || {}).cost_usd || 0,
    });
    byCond[c].cost += (t.usage || {}).cost_usd || 0;
  }
  for (const c of Object.keys(byCond)) {
    const rs = byCond[c].rows;
    const scored = rs.filter((r) => r.scored !== null);
    byCond[c].correct = scored.filter((r) => r.scored).length;
    byCond[c].total = scored.length;
    byCond[c].score = pct(byCond[c].correct, byCond[c].total);
    byCond[c].correct_reason_blind = scored.filter((r) => r.scoredReasonBlind).length;
    byCond[c].score_reason_blind = pct(byCond[c].correct_reason_blind, byCond[c].total);
    byCond[c].excluded_disputed = rs.length - scored.length;
    // honest fallback: of answers that chose the general scene genre, how many stated a reason
    const blocks = rs.filter((r) => r.genre === 'block');
    byCond[c].block_answers = blocks.length;
    byCond[c].block_with_reason = blocks.filter((r) => r.hasReason).length;
    byCond[c].honest_fallback = pct(byCond[c].block_with_reason, byCond[c].block_answers);
    // version correctness on the two genres that do not exist at 0.1
    const vv = rs.filter((r) => r.genre === 'statechart' || r.genre === 'sequence');
    byCond[c].version_answers = vv.length;
    byCond[c].version_correct = vv.filter((r) => r.versionScored).length;
    byCond[c].version_rate = pct(byCond[c].version_correct, byCond[c].version_answers);
    byCond[c].version_errors = vv.filter((r) => !r.versionScored).map((r) => `${r.sid}/r${r.reader}: figdown ${r.version} ${r.genre} (needs ${r.wantVersion})`);
    // any-genre version sanity across all answers
    byCond[c].version_correct_all = rs.filter((r) => r.versionScored === true).length;
    byCond[c].version_total_all = rs.filter((r) => r.versionScored !== null).length;
    const tally = {};
    for (const r of rs) if (r.scored === false && r.cls) tally[r.cls] = (tally[r.cls] || 0) + 1;
    byCond[c].classTally = tally;
  }
  return { subjects, keys, byCond, stale, unclassified };
}

function perSubject(res) {
  const out = {};
  for (const s of res.subjects.subjects) {
    const k = res.keys.keys[s.sid];
    const row = { bucket: s.bucket, key: k.type === 'key-disputed' ? 'DISPUTED' : k.accepted.join('|'), conds: {} };
    for (const c of CONDITIONS) {
      const rs = ((res.byCond[c] || {}).rows || []).filter((r) => r.sid === s.sid);
      if (!rs.length) continue;
      row.conds[c] = {
        answers: rs.map((r) => r.genre + (r.hasReason ? '*' : '')).join(' '),
        correct: rs.filter((r) => r.scored).length,
        total: rs.filter((r) => r.scored !== null).length,
      };
    }
    out[s.sid] = row;
  }
  return out;
}

function printText(res) {
  console.log('');
  console.log('GENRE-SELECTION BASELINE ' + PROBE_VERSION + '  ·  the two numbers that stop existing once a guideline ships');
  console.log('');
  const ps = perSubject(res);
  console.log('  subject  bucket             key                    naive              cold');
  console.log('  ' + '-'.repeat(88));
  for (const sid of Object.keys(ps)) {
    const r = ps[sid];
    const cell = (c) => (r.conds[c] ? (r.conds[c].correct + '/' + r.conds[c].total).padEnd(5) + ' ' + r.conds[c].answers.padEnd(30) : '—');
    console.log('  ' + sid.padEnd(9) + r.bucket.padEnd(19) + r.key.padEnd(23) + cell('naive').padEnd(19) + cell('cold'));
  }
  console.log('  ' + '-'.repeat(88));
  console.log('');
  for (const c of CONDITIONS) {
    const b = res.byCond[c];
    if (!b) continue;
    console.log('  ' + c.toUpperCase().padEnd(7) + ' genre-match ' + fmtPct(b.score) + ' (' + b.correct + '/' + b.total + ')'
      + '   [reason-blind ' + fmtPct(b.score_reason_blind) + ']'
      + '   honest-fallback ' + fmtPct(b.honest_fallback) + ' (' + b.block_with_reason + '/' + b.block_answers + ' block answers)'
      + '   version ' + fmtPct(b.version_rate) + ' (' + b.version_correct + '/' + b.version_answers + ' statechart+sequence)');
    const t = b.classTally;
    if (Object.keys(t).length) {
      console.log('           misses: ' + FAILURE_CLASSES.filter((k) => t[k]).map((k) => t[k] + ' ' + k).join(', '));
    }
    if (b.version_errors.length) console.log('           version errors: ' + b.version_errors.join(' | '));
    console.log('           spend $' + b.cost.toFixed(3) + (b.excluded_disputed ? '   (' + b.excluded_disputed + ' readings excluded: key-disputed subject)' : ''));
  }
  if (res.byCond.naive && res.byCond.cold) {
    const d = (res.byCond.cold.score - res.byCond.naive.score) * 100;
    console.log('');
    console.log('  COLD − NAIVE = ' + (d >= 0 ? '+' : '') + d.toFixed(1) + ' points  ·  ' + (d < 0
      ? 'THE DOCUMENTS MOVE AGENTS AWAY FROM THE RIGHT GENRE'
      : 'the documents help'));
  }
  console.log('');
  if (res.stale.length) { console.log('  STALE (re-run needed):'); res.stale.forEach((s) => console.log('    ' + s)); console.log(''); }
  if (res.unclassified.length) { console.log('  UNCLASSIFIED MISSES (' + res.unclassified.length + '): ' + res.unclassified.join(', ')); console.log(''); }
  return res;
}

function printMarkdown(res) {
  console.log('| Condition | Genre-match (primary) | Honest fallback | Version correctness | Readings |');
  console.log('|---|---:|---:|---:|---:|');
  for (const c of CONDITIONS) {
    const b = res.byCond[c];
    if (!b) continue;
    console.log(`| \`${c}\` | **${(b.score * 100).toFixed(1)}% (${b.correct}/${b.total})** | ${(b.honest_fallback * 100).toFixed(0)}% (${b.block_with_reason}/${b.block_answers}) | ${(b.version_rate * 100).toFixed(0)}% (${b.version_correct}/${b.version_answers}) | ${b.rows.length} |`);
  }
  console.log('');
  console.log('| Subject | Bucket | Key | naive | cold |');
  console.log('|---|---|---|---|---|');
  const ps = perSubject(res);
  for (const sid of Object.keys(ps)) {
    const r = ps[sid];
    const cell = (c) => (r.conds[c] ? `${r.conds[c].correct}/${r.conds[c].total} — ${r.conds[c].answers}` : '—');
    console.log(`| \`${sid}\` | ${r.bucket} | \`${r.key}\` | ${cell('naive')} | ${cell('cold')} |`);
  }
}

function printAudit(res, onlySid) {
  for (const c of CONDITIONS) {
    const b = res.byCond[c];
    if (!b) continue;
    for (const r of b.rows) {
      if (onlySid && r.sid !== onlySid) continue;
      console.log(`${r.scored === null ? '[?]' : r.scored ? '[+]' : '[-]'} ${r.sid} ${c} r${r.reader}  key=${r.keyType}:${r.accepted.join('|')}  got=figdown ${r.version} ${r.genre}`);
      if (r.reason) console.log(`      reason: ${r.reason}`);
      if (r.cls) console.log(`      class:  ${r.cls}`);
    }
  }
}

function writeResults(res) {
  const out = {
    probe_version: PROBE_VERSION,
    generated_by: 'tools/genre-probe/genre-probe.js --write-results (recomputed from the stored transcripts; no model was called)',
    subjects_sha256: res.subjects._sha,
    bundle_measured: { path: path.relative(ROOT, BUNDLE_FILE), sha256: bundle().sha },
    keys_summary: res.keys.summary,
    conditions: {},
    per_subject: perSubject(res),
  };
  for (const c of CONDITIONS) {
    const b = res.byCond[c];
    if (!b) continue;
    out.conditions[c] = {
      genre_match: { correct: b.correct, total: b.total, rate: Number(b.score.toFixed(4)) },
      genre_match_reason_blind: { correct: b.correct_reason_blind, total: b.total, rate: Number(b.score_reason_blind.toFixed(4)), means: 'the same answers with the stated-reason requirement on either-keys switched off' },
      honest_fallback: { with_reason: b.block_with_reason, block_answers: b.block_answers, rate: Number(b.honest_fallback.toFixed(4)) },
      version_correctness_statechart_sequence: { correct: b.version_correct, total: b.version_answers, rate: Number(b.version_rate.toFixed(4)), errors: b.version_errors },
      version_correctness_all_genres: { correct: b.version_correct_all, total: b.version_total_all },
      failure_classes: b.classTally,
      readings: b.rows.length,
      excluded_key_disputed: b.excluded_disputed,
      spend_usd: Number(b.cost.toFixed(4)),
    };
  }
  if (res.byCond.naive && res.byCond.cold) {
    out.cold_minus_naive_points = Number(((res.byCond.cold.score - res.byCond.naive.score) * 100).toFixed(1));
  }
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log('  wrote tools/genre-probe/results.json');
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

  if (has('--help') || has('-h')) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
    return;
  }

  if (has('--dump')) {
    const sid = val('--dump', null);
    const cond = val('--condition', 'cold');
    const s = loadSubjects().subjects.find((x) => x.sid === sid) || die('no subject ' + sid);
    console.log('----- SYSTEM -----');
    console.log(READER_SYSTEM);
    console.log('----- USER -----');
    console.log(readerMessage(s, cond, bundle().text));
    return;
  }

  if (has('--label')) {
    await runLabelers(Number(val('--labelers', '3')), val('--model', 'sonnet'), Number(val('--budget', '0.5')));
    return;
  }
  if (has('--keys')) { deriveKeys(); return; }

  if (has('--run')) {
    const only = val('--subject', null);
    await runCondition(val('--condition', 'cold'), Number(val('--readers', '3')), val('--model', 'sonnet'),
      Number(val('--budget', '0.10')), Number(val('--concurrency', '6')), only ? only.split(',') : null);
    return;
  }

  const res = scoreEverything();
  if (has('--audit')) { printAudit(res, val('--subject', null)); return; }
  if (has('--report')) { printMarkdown(res); return; }
  printText(res);
  if (has('--write-results')) writeResults(res);
  if (has('--verify')) {
    if (res.stale.length) { console.error('FINDING: a transcript no longer matches the probe set or the measured bundle.'); process.exit(1); }
    console.log('  verify: every transcript matches the probe set and the bundle it was taken against.');
    return;
  }
  if (has('--strict')) {
    const problems = [];
    if (res.stale.length) problems.push(res.stale.length + ' stale transcripts');
    if (res.unclassified.length) problems.push(res.unclassified.length + ' unclassified misses');
    if (problems.length) { console.error('FINDINGS: ' + problems.join('; ')); process.exit(1); }
    console.log('  strict: no stale transcript, every miss classified.');
  }
}

main();
