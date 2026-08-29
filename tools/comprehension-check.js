#!/usr/bin/env node
// comprehension-check.js — the COLD-READER COMPREHENSION SUITE.
//
// WHAT IT MEASURES
// ----------------
// FigDown's positioning is "one source, two readers": a human sees a
// deterministic SVG, an agent reads the `.fd` text for meaning. The second
// half carries a stated target — **a reader who has never opened the spec
// should recover 70–80% of what a `.fd` says from the syntax alone** — and
// until this tool existed that target was an aspiration with no number behind
// it. This is the instrument that turns it into one, the way the legibility
// floor turned "a human can read the drawing" into a measurable property.
//
// It is built to be RE-RUN as the language changes, not as a one-off study:
// question sets are data, every reader answer is recorded verbatim, and
// scoring is deterministic and offline, so a disputed score is re-checked
// rather than re-run.
//
// THE ONE TRAP THIS TOOL IS BUILT AROUND
// --------------------------------------
// If the questions are written from the `.fd`, the exam measures only whether
// a reader can decode the notation that file happens to use — the denominator
// would have been chosen to be answerable, and the resulting number would be
// worth nothing. So EVERY question and EVERY answer in
// `tools/comprehension/questions/` was authored from the figure's SOURCE (the
// RFC, the IEEE standard, the convention the figure transcribes) by an agent
// that was forbidden to look at the `.fd` at all. Each question set records
// its source, its locator per question, and the `saw_figure: false` claim.
// This tool never edits a question set; it only presents and scores.
//
// WHAT A COLD READER IS SHOWN (and what it is not)
// ------------------------------------------------
// A reader is a fresh model invocation in an isolated empty directory with
// NO tools, NO MCP servers, NO project settings, NO memory and NO repository
// access. It sees exactly two things: the system prompt below, and one user
// message containing the presented text plus the questions. It is never shown
// the spec, any genre document, any other `.fd`, the file's name, or the name
// of the language.
//
// Three presentation conditions, all recorded in the transcript:
//   syntax      (default) — the `.fd` with every comment stripped. This is
//                 the condition the 70–80% target is about: comments are not
//                 syntax. It is also the only HONEST cold condition for this
//                 corpus, because the example files carry tutorial comments
//                 that quote the spec — showing those to a "cold" reader
//                 would be showing it the spec.
//   commented   — the same file with comments left in, minus the provenance
//                 banner line (which names the project and links the spec).
//                 Run as a contrast: it prices what the prose comments add.
//   title-only  — the CONTROL. The reader is shown ONLY the figure's title
//                 and is asked to answer from its own knowledge. Every figure
//                 here transcribes a well-known standard, so a model can
//                 answer some questions from memory without reading anything.
//                 The control measures that, and the number that matters is
//                 the LIFT: syntax minus title-only. A suite without this
//                 control would credit the language for what the reader
//                 already knew.
//
// WHAT THE HARNESS SUPPLIES THAT THE COLD ROOM DOES NOT REMOVE
// -------------------------------------------------------------
// (decisions/registry.md item 50, found by tools/genre-probe.) The room
// above removes tools, MCP, settings, memory and session — it does NOT empty
// the model's context of environment facts the HARNESS itself injects. The
// probe proved one concretely: asked for a document's opening lines with no
// provenance line to copy, 72 of 72 readers invented one and every single one
// carried the running account's email address. In a room with no tools and no
// settings file that string can only have come from the harness. Two
// independent defenses are taken here, the same two the newer probes take:
//   (a) the reader is instructed to emit ONLY numbered answer lines — no
//       provenance, attribution, header or signature line of any kind — which
//       removes the invitation that produced the leak rather than the string;
//   (b) `raw_answer_text` is scrubbed for an email pattern AT CAPTURE TIME
//       regardless, and every transcript records `scrub` — that it ran, the
//       pattern, and how many replacements it made (0 expected, given (a)) —
//       so a future leak through a different field is caught, not shipped.
// The scrub runs BEFORE answers are extracted, so a scrubbed string can never
// reach a score. No hash covers `raw_answer_text`.
//
// SCORING IS DETERMINISTIC
// ------------------------
// No model grades anything. A reader's free text is normalised (lowercased,
// every run of non-alphanumerics collapsed to one space) and matched against
// the question's key: `all_of` is a list of groups, every group must match,
// a group matches if any of its alternatives occurs; `none_of` rejects
// outright, so an answer that hedges both ways fails. An alternative
// beginning `re:` is a regular expression over the normalised text. Re-run
// the scorer on the stored transcripts and you get the same number for ever.
//
// THREE QUESTION CLASSES (ADV-14)
// -------------------------------
//   recall              (default) the meaning IS in the figure; the correct
//                       answer states it. This class alone is the 70-80%
//                       recovery denominator, and every question authored
//                       before 2026-08-21 is in it, unchanged.
//   unanswerable        an in-scope question the figure honestly does not
//                       answer. The correct answer is NOT STATED.
//   forbidden-inference a plausible conclusion the figure does not license —
//                       usually one the reader is tempted to draw from a
//                       MISSING element. The correct answer is again a
//                       refusal, and `none_of` names the tempting claim.
// The last two score REFUSAL-TO-HALLUCINATE, in their own denominator. They
// never enter the recovery score: recovering a meaning that is present and
// declining a meaning that is absent are different abilities, and averaging
// them would let a figure buy back a `not-in-file` miss with a refusal.
// A refusal question is a claim about the PRESENTED TEXT, so it cannot be
// authored blind from the source the way a `recall` question is. Its key
// therefore carries `absent_from_figure.tokens`, and `--check` re-asserts
// offline that not one of those tokens appears in the presented text of
// either file condition. Edit the figure to state the thing and the check
// goes red, which is the only honest way to keep such a key true over time.
//
// EVERY WRONG ANSWER MUST BE CLASSIFIED
// -------------------------------------
// A score alone is not actionable. `tools/comprehension/failure-analysis.json`
// records, for every wrong answer, WHY it was wrong:
//   ambiguous-syntax   the file states it, but the spelling admits another reading
//   misleading-keyword the keyword pulled the reader to the wrong meaning
//   not-in-file        the meaning genuinely is not in the file
//   bad-question       the question is outside what this figure claims to show
//   grading-artifact   the answer is right; the key failed to accept it
//   reader-error       the file says it plainly and the reader still missed it
// The first three are findings against the LANGUAGE; the next two are findings
// against the INSTRUMENT and are reported, never quietly dropped. `--strict`
// fails if any wrong answer is unclassified.
//
// CROSS-MODEL-FAMILY SUPPORT (ADV-14b)
// ------------------------------------
// Every transcript records `run.model_alias`, `run.model_used` and a derived
// `run.model_family`. `--run --model a,b` takes a LIST and runs each figure
// under each model in turn, writing one transcript per (figure, condition,
// model, reader); a non-default family is named in the transcript FILENAME so
// two families can never overwrite each other. The scorer scores ONE family at
// a time (`--family`, default `claude`) and prints a line naming every other
// family present with its transcript count, so a second family can never
// silently contaminate the published number — and a family that has not been
// run is visibly absent rather than quietly averaged in.
//
// USAGE
//   node tools/comprehension-check.js                 score every stored transcript
//   node tools/comprehension-check.js --report        the same, as Markdown
//   node tools/comprehension-check.js --check         instrument integrity, offline
//   node tools/comprehension-check.js --selftest      keys accept their own answers
//   node tools/comprehension-check.js --verify        transcripts still match the .fd + key
//   node tools/comprehension-check.js --dump <id>     print exactly what a reader was shown
//   node tools/comprehension-check.js --run --figure <id> --readers 3 [--condition syntax]
//                                          [--model sonnet,gpt-5] [--family claude]
//
// `--run` is the ONLY mode that makes live model calls. It is opt-in, it is
// never implied, and it is why this tool is NOT wired into `npm test`: a gate
// that bills a model on every CI run is a maintainer's decision. The offline
// modes (score, verify, report) are pure functions of files in the tree and
// could be gated safely — see decisions/registry.md.
//
// Exit codes: 0 clean · 1 a finding (below target under --strict, stale
// transcript, unclassified failure) · 2 tool error.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// 1.0.0 — the instrument the 2026-08-16/17 baseline was taken on.
// 1.1.0 — 2026-08-21: item-50 leak fix (prompt + capture-time scrub), the two
//         refusal question classes, cross-model-family runs, `--check`. The
//         published baseline numbers do NOT move: every question in it is
//         `recall`, its hash is unchanged, and the refusal classes score in
//         their own denominator. Transcripts record the version they were
//         taken under; `--write-baseline` records the set of versions it saw.
const SUITE_VERSION = '1.1.0';
const BASELINE_SUITE_VERSION = '1.0.0';
const ROOT = path.resolve(__dirname, '..');
const QDIR = path.join(ROOT, 'tools', 'comprehension', 'questions');
const TDIR = path.join(ROOT, 'tools', 'comprehension', 'transcripts');
const FAIL_FILE = path.join(ROOT, 'tools', 'comprehension', 'failure-analysis.json');
const BASE_FILE = path.join(ROOT, 'tools', 'comprehension', 'baseline.json');

const TARGET_LO = 0.70;
const TARGET_HI = 0.80;

const CONDITIONS = ['syntax', 'commented', 'title-only'];
const FAILURE_CLASSES = ['ambiguous-syntax', 'misleading-keyword', 'not-in-file',
  'bad-question', 'grading-artifact', 'reader-error'];

// ── question classes (ADV-14) ────────────────────────────────────────────────
// `recall` is the default and is the ONLY class in the recovery denominator.
// The two refusal classes are scored apart; see the header comment.
const QUESTION_CLASSES = ['recall', 'unanswerable', 'forbidden-inference'];
const REFUSAL_CLASSES = ['unanswerable', 'forbidden-inference'];
const isRefusal = (q) => REFUSAL_CLASSES.includes(q.klass);

// The model family whose readings ARE the published baseline. Everything else
// is reported separately and never averaged in. Kept as a constant rather than
// a default argument so that the one place it is decided is greppable.
const BASELINE_FAMILY = 'claude';
const READER_MODEL_DEFAULT = 'sonnet';

// A family label from whatever the CLI was asked for or reported. This is a
// coarse label on purpose: it exists to keep two vendors' readings in separate
// denominators, not to identify a build. `run.model_used` carries the exact id.
function modelFamily(alias, used) {
  const s = String(used || alias || '').toLowerCase();
  if (/claude|sonnet|opus|haiku/.test(s)) return 'claude';
  if (/gpt|o[34]-|openai/.test(s)) return 'openai';
  if (/gemini|google/.test(s)) return 'google';
  if (/llama|mistral|qwen|deepseek|grok/.test(s)) return s.replace(/[^a-z0-9]+/g, '-').split('-')[0];
  return 'other';
}

// ── email scrub at capture time (decisions/registry.md item 50) ───────────
// Identical in shape to tools/repair-probe and tools/author-probe: the same
// pattern, the same replacement marker, the same recorded `scrub` block, so a
// reader of any of the three transcript sets reads one convention.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
function scrubEmails(text) {
  let n = 0;
  const out = String(text || '').replace(EMAIL_RE, () => { n++; return '<redacted-email>'; });
  return { text: out, replacements: n };
}

// ── the cold room ────────────────────────────────────────────────────────────
// Every tool name the harness might otherwise offer. Denied BY NAME, which
// removes the definition rather than merely refusing the call: a reader that
// cannot see a Read tool cannot even learn that a repository exists.
const DENIED_TOOLS = [
  'Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'Agent', 'Task', 'Skill', 'ToolSearch', 'Workflow',
  'ListAgents', 'ReportFindings', 'TaskOutput', 'TaskStop', 'SendMessage',
  'SendUserMessage', 'Monitor', 'EnterWorktree', 'ExitWorktree', 'ScheduleWakeup',
  'PushNotification', 'RemoteTrigger', 'CronCreate', 'CronDelete', 'CronList',
  'DesignSync', 'Artifact', 'ExitPlanMode', 'TodoWrite', 'SlashCommand',
  'BashOutput', 'KillShell', 'AskUserQuestion', 'Explore', 'Plan',
];

const SYSTEM_PROMPTS = {
  // The reader is told it is looking at a figure — that much is true of any
  // agent that meets a `.fd` in a repository — and is told nothing else. The
  // language is never named: several of these figures are public, and a
  // reader that recognised the format could answer from documentation it has
  // memorised instead of from the text in front of it.
  file: [
    'You are shown the complete text of one file that describes a figure. The file is written in a plain-text figure format whose documentation you have never seen and cannot consult. You are then asked questions about the subject the figure describes.',
    '',
    'Work ONLY from the text you are shown. Do not answer from your own knowledge of the subject: if the text does not state something, answer exactly NOT STATED, even when you are confident you know the real answer from elsewhere.',
    '',
    'Answer every question. Put each answer on its own line, prefixed with its number as A1:, A2:, and so on, in order. Keep each answer to at most two sentences. Do not explain your reasoning and do not restate the questions.',
    '',
    'Emit ONLY those numbered answer lines and nothing else in your reply: no provenance line, no attribution, no header, no signature, no commentary before the first answer or after the last one.',
  ].join('\n'),
  // The control. No text at all — only the title — so its score is the part
  // of the exam that prior knowledge alone can carry.
  'title-only': [
    'You are asked questions about a figure. You are NOT shown the figure or any file: you are given only its title.',
    '',
    'Answer from your own knowledge of the subject the title names. If you do not know an answer, write exactly NOT STATED.',
    '',
    'Answer every question. Put each answer on its own line, prefixed with its number as A1:, A2:, and so on, in order. Keep each answer to at most two sentences. Do not explain your reasoning and do not restate the questions.',
    '',
    'Emit ONLY those numbered answer lines and nothing else in your reply: no provenance line, no attribution, no header, no signature, no commentary before the first answer or after the last one.',
  ].join('\n'),
};

// ── small helpers ────────────────────────────────────────────────────────────
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const die = (msg) => { console.error('comprehension-check: ' + msg); process.exit(2); };
const pct = (n, d) => (d === 0 ? 0 : n / d);
const fmtPct = (x) => (x * 100).toFixed(1).padStart(5) + '%';

function readJSON(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { die('cannot read ' + path.relative(ROOT, file) + ': ' + e.message); }
  try { return JSON.parse(raw); } catch (e) { die('malformed JSON in ' + path.relative(ROOT, file) + ': ' + e.message); }
}

// ── presentation ─────────────────────────────────────────────────────────────
// findComment() reproduces the reference engine's own comment rule (dist:
// `#` opens a comment only at line start or after whitespace, and never
// inside a quoted string or inside a `[...]` verbatim region). Reproduced
// rather than imported so that stripping can never depend on a parse
// succeeding — a reader is shown text, not a model.
function findComment(s) {
  let inq = false, depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (inq && s[i] === '\\' && i + 1 < s.length) { i++; continue; }
    if (s[i] === '"') inq = !inq;
    else if (inq) continue;
    else if (s[i] === '[') depth++;
    else if (s[i] === ']') { if (depth) depth--; }
    else if (s[i] === '#' && !depth && (i === 0 || /\s/.test(s[i - 1]))) return i;
  }
  return -1;
}

function stripComments(text) {
  const out = [];
  for (const line of text.split('\n')) {
    // A GFM pipe row is verbatim in the table genre — the engine does not
    // strip comments inside one, and neither does this.
    if (/^\s*\|/.test(line)) { out.push(line); continue; }
    const i = findComment(line);
    const kept = i === -1 ? line : line.slice(0, i);
    out.push(kept.replace(/\s+$/, ''));
  }
  // collapse the blank runs the removed comment blocks leave behind
  const compact = [];
  for (const l of out) {
    if (l === '' && compact.length && compact[compact.length - 1] === '') continue;
    compact.push(l);
  }
  while (compact.length && compact[0] === '') compact.shift();
  while (compact.length && compact[compact.length - 1] === '') compact.pop();
  return compact.join('\n') + '\n';
}

// The provenance banner names the project and links the specification. It is
// removed in EVERY condition: a reader that follows it is no longer cold.
// (In the `syntax` condition comment stripping removes it anyway; this makes
// the `commented` condition honest too, and the removal is recorded.)
function stripBanner(text) {
  return text.split('\n').filter((l) => !/^#\s*FigDown\b/.test(l) && !/^#.*github\.com\/FigDown/i.test(l)).join('\n');
}

function figureTitle(text) {
  // the drawn caption, exactly as the figure states it: a top-level `title`
  // if there is one, otherwise the caption of the first typed block.
  const m = text.match(/^\s*title\s+"((?:[^"\\]|\\.)*)"/m);
  if (m) return m[1];
  const b = text.match(/^\s*(?:bitfield|table|timing|chart)\s+\S+\s+"((?:[^"\\]|\\.)*)"/m);
  return b ? b[1] : '(untitled)';
}

function present(figureText, condition) {
  if (condition === 'syntax') return stripComments(figureText);
  if (condition === 'commented') return stripBanner(figureText).replace(/^\n+/, '');
  if (condition === 'title-only') return '';
  die('unknown condition: ' + condition);
}

function userMessage(qset, presented, title, condition) {
  const qs = qset.questions.map((q, i) => `${i + 1}. ${q.ask}`).join('\n');
  if (condition === 'title-only') {
    return `The figure's title is: "${title}"\n\nQUESTIONS\n${qs}\n`;
  }
  return `FILE (complete, verbatim):\n-----BEGIN FILE-----\n${presented}-----END FILE-----\n\nQUESTIONS\n${qs}\n`;
}

// ── scoring ──────────────────────────────────────────────────────────────────
function normalise(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function altMatches(norm, alt) {
  if (typeof alt !== 'string') return false;
  if (alt.startsWith('re:')) {
    let re;
    try { re = new RegExp(alt.slice(3)); } catch (e) { return false; }
    return re.test(norm);
  }
  return norm.includes(normalise(alt));
}

function gradeAnswer(answerText, key, klass) {
  const norm = normalise(answerText);
  const notStated = /\bnot stated\b/.test(norm);
  const refusalClass = REFUSAL_CLASSES.includes(klass || 'recall');
  if (!answerText || !norm) return { correct: false, why: 'no-answer', notStated: false, refusal: refusalClass };
  // A reader that opens with NOT STATED has declined the question.
  //
  // For a `recall` question that is a miss: in the file conditions it says the
  // file does not carry the meaning, in the control it says it does not know.
  // Either way the meaning was not recovered, so it is wrong even if the
  // sentence that follows happens to contain a key token ("not stated;
  // typically it would be low").
  //
  // For the two REFUSAL classes it is the correct answer, and the same leading
  // test decides it — one rule, read in both directions. `none_of` still
  // rejects: a reply that declines and then asserts the forbidden claim anyway
  // ("NOT STATED, though they clearly discard it") has hallucinated, and the
  // hedge must not buy the point.
  if (/^not stated/.test(norm)) {
    const banned0 = ((key && key.none_of) || []).filter((a) => altMatches(norm, a));
    if (refusalClass) {
      return {
        correct: banned0.length === 0, why: banned0.length ? 'declined-then-asserted' : 'correct',
        notStated: true, refusal: true, missed_groups: [], matched_none_of: banned0,
      };
    }
    return { correct: false, why: 'not-stated', notStated: true, refusal: false, missed_groups: [], matched_none_of: [] };
  }
  if (refusalClass) {
    // It answered. For an `unanswerable` question the figure does not carry
    // the meaning, and for a `forbidden-inference` one it does not license the
    // conclusion — so any committed answer is a hallucination by construction,
    // whatever it says. `none_of` is recorded when it matches, because "which
    // wrong thing was asserted" is the actionable half.
    const bannedR = ((key && key.none_of) || []).filter((a) => altMatches(norm, a));
    return { correct: false, why: 'answered-anyway', notStated: false, refusal: true, missed_groups: [], matched_none_of: bannedR };
  }
  const groups = (key && key.all_of) || [];
  const missed = [];
  for (const g of groups) {
    const alts = Array.isArray(g) ? g : [g];
    if (!alts.some((a) => altMatches(norm, a))) missed.push(alts);
  }
  const banned = ((key && key.none_of) || []).filter((a) => altMatches(norm, a));
  const correct = missed.length === 0 && banned.length === 0;
  return {
    correct,
    why: correct ? 'correct' : (notStated ? 'not-stated' : (banned.length ? 'rejected' : 'missing')),
    notStated,
    refusal: false,
    missed_groups: missed,
    matched_none_of: banned,
  };
}

// The reader is asked for A1..An in the order the questions were PRESENTED, so
// answer *position* is what is authoritative, not the qid string. Keyed back to
// the presented question's own qid, which keeps the extraction correct for a
// set whose qids are not a bare 1..n run.
function extractAnswers(resultText, questions) {
  const lines = String(resultText || '').split('\n');
  const out = {};
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^\s*(?:\*\*)?A\s*(\d+)\s*(?:\*\*)?\s*[:.)-]\s*(.*)$/i);
    if (m) { cur = Number(m[1]); out[cur] = (m[2] || '').trim(); continue; }
    if (cur !== null && line.trim()) out[cur] = (out[cur] + ' ' + line.trim()).trim();
  }
  const answers = {};
  questions.forEach((q, i) => { answers[q.qid] = out[i + 1] !== undefined ? out[i + 1] : null; });
  return answers;
}

// ── loading ──────────────────────────────────────────────────────────────────
function loadQuestionSets(filterIds) {
  if (!fs.existsSync(QDIR)) die('no question directory at tools/comprehension/questions');
  const files = fs.readdirSync(QDIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) die('question directory is empty — a comprehension suite with no questions has not passed, it has failed to run');
  const sets = [];
  for (const f of files) {
    const q = readJSON(path.join(QDIR, f));
    q._file = f;
    // `_sha` covers the WHOLE exam as it stands today. `_shaRecall` covers only
    // the `recall` questions, in order — which for every set authored before
    // the ADV-14 extension is byte-for-byte the JSON its readers were hashed
    // against. A transcript that matches `_shaRecall` is therefore not STALE,
    // it is a BASELINE-INSTRUMENT reading: the exam it sat is intact and some
    // questions have since been added after it. Staleness means the exam it
    // sat CHANGED, and that distinction is the whole reason for two hashes.
    q._sha = sha(JSON.stringify(q.questions));
    if (filterIds && !filterIds.includes(q.id)) continue;
    for (const k of ['id', 'genre', 'figure', 'source', 'questions']) {
      if (!q[k]) die(f + ': question set is missing "' + k + '"');
    }
    // `_shaRecall` must be taken over the questions EXACTLY as they sit on
    // disk — before any field this loader derives is written onto them — or it
    // would not reproduce the hash a 2026-08 transcript recorded.
    q._shaRecall = sha(JSON.stringify(q.questions.filter((qq) => !REFUSAL_CLASSES.includes(qq.class || 'recall'))));
    q.questions.forEach((qq, i) => {
      if (!qq.qid) qq.qid = 'q' + (i + 1);
      if (!qq.ask || !qq.answer || !qq.score) die(f + ' ' + qq.qid + ': needs ask, answer and score');
      Object.defineProperty(qq, 'klass', { value: qq.class || 'recall', enumerable: false });
      if (!QUESTION_CLASSES.includes(qq.klass)) {
        die(f + ' ' + qq.qid + ': unknown question class "' + qq.klass + '" (want one of ' + QUESTION_CLASSES.join(', ') + ')');
      }
      if (isRefusal(qq) && !(qq.absent_from_figure && Array.isArray(qq.absent_from_figure.tokens) && qq.absent_from_figure.tokens.length)) {
        die(f + ' ' + qq.qid + ': a ' + qq.klass + ' question must carry absent_from_figure.tokens — '
          + 'its key asserts the figure does not say something, and --check must be able to re-assert that offline');
      }
    });
    q._recall = q.questions.filter((qq) => !isRefusal(qq));
    q._refusal = q.questions.filter(isRefusal);
    sets.push(q);
  }
  if (filterIds && !sets.length) die('no question set matches --figure ' + filterIds.join(','));
  return sets;
}

// The baseline family keeps the historical filename EXACTLY — renaming 56
// transcripts to add a slug nobody needs would have been a gratuitous churn of
// the published record. Any other family is slugged INTO the name, so two
// vendors reading the same figure in the same condition can never collide.
function transcriptName(id, condition, reader, family) {
  const slug = (family && family !== BASELINE_FAMILY) ? String(family).replace(/[^A-Za-z0-9]+/g, '-') + '.' : '';
  return `${id}.${condition}.${slug}r${reader}.json`;
}

function loadTranscripts(id) {
  if (!fs.existsSync(TDIR)) return [];
  return fs.readdirSync(TDIR)
    .filter((f) => f.startsWith(id + '.') && f.endsWith('.json'))
    .sort()
    .map((f) => Object.assign(readJSON(path.join(TDIR, f)), { _file: f }));
}

// ── the live run ─────────────────────────────────────────────────────────────
function askReader(model, system, user, budget) {
  const room = fs.mkdtempSync(path.join(os.tmpdir(), 'coldreader-'));
  const args = [
    '-p',
    '--model', model,
    '--system-prompt', system,
    '--disallowed-tools', DENIED_TOOLS.join(' '),
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--safe-mode', '--disable-slash-commands', '--no-session-persistence',
    '--permission-mode', 'dontAsk',
    '--output-format', 'json',
    '--max-budget-usd', String(budget),
  ];
  const r = spawnSync('claude', args, {
    input: user, cwd: room, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: Object.assign({}, process.env, { CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' }),
  });
  try { fs.rmSync(room, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  if (r.error) die('could not run the `claude` CLI: ' + r.error.message);
  let out;
  try { out = JSON.parse(r.stdout); } catch (e) {
    die('reader returned unparseable output (exit ' + r.status + '): ' + String(r.stdout).slice(0, 400));
  }
  return out;
}

function runFigure(qset, condition, readers, model, budget) {
  const figPath = path.join(ROOT, qset.figure);
  if (!fs.existsSync(figPath)) die('figure not found: ' + qset.figure);
  const figureText = fs.readFileSync(figPath, 'utf8');
  const title = figureTitle(figureText);
  const presented = present(figureText, condition);
  const system = SYSTEM_PROMPTS[condition === 'title-only' ? 'title-only' : 'file'];
  const user = userMessage(qset, presented, title, condition);
  const cliVersion = (spawnSync('claude', ['--version'], { encoding: 'utf8' }).stdout || '').trim();

  for (let i = 1; i <= readers; i++) {
    process.stdout.write(`  reader ${i}/${readers} (${qset.id} · ${condition} · ${model}) … `);
    const res = askReader(model, system, user, budget);
    // ITEM 50(b): scrub BEFORE anything is derived from the reply, so no
    // scrubbed string can reach an extracted answer or a score, and record the
    // scrub in the transcript whatever it found.
    const scrub = scrubEmails(res.result);
    const answers = extractAnswers(scrub.text, qset.questions);
    const modelUsed = Object.keys(res.modelUsage || {}).join(',');
    const rec = {
      suite_version: SUITE_VERSION,
      run: {
        utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        model_alias: model,
        model_used: modelUsed,
        model_family: modelFamily(model, modelUsed),
        cli: cliVersion,
        condition,
        reader: i,
      },
      figure: {
        id: qset.id,
        genre: qset.genre,
        path: qset.figure,
        file_sha256: sha(figureText),
        title_shown: condition === 'title-only' ? title : null,
        presented_sha256: sha(presented),
        presented_lines: condition === 'title-only' ? 0 : presented.split('\n').length - 1,
        presented_chars: presented.length,
      },
      prompt: {
        system_sha256: sha(system),
        user_sha256: sha(user),
        question_set_sha256: qset._sha,
        question_set_recall_sha256: qset._shaRecall,
        question_ids: qset.questions.map((q) => q.qid),
        question_classes: qset.questions.reduce((a, q) => { a[q.qid] = q.klass; return a; }, {}),
        no_provenance_line_instructed: true,
      },
      cold_room: {
        cwd: 'an isolated empty temporary directory outside the repository',
        tools_offered: 'none — every tool denied by name',
        mcp_servers: 'none',
        settings: 'safe-mode: no project or user settings, no memory file, no skills, no plugins, no hooks',
        session_persistence: false,
        shown: condition === 'title-only'
          ? 'the system prompt, the figure title, and the questions — nothing else'
          : 'the system prompt, the presented file text, and the questions — nothing else',
        not_shown: 'the specification, any genre document, any other .fd file, the file name, the name of the language, the repository',
        // The honest half. The room removes what the room can remove; the
        // harness still supplies environment facts to the model that nothing
        // here can strip, and item 50 proved one of them concretely.
        harness_supplied_not_removed: 'the harness injects environment facts this room cannot strip — a running account identity was demonstrated by tools/genre-probe (design/engine-backlog.md item 50). Reader output is scrubbed at capture time; see `scrub`.',
      },
      integrity: {
        turns: res.num_turns,
        permission_denials: (res.permission_denials || []).length,
        tool_calls_observed: res.num_turns > 1,
        is_error: !!res.is_error,
      },
      usage: {
        cost_usd: res.total_cost_usd,
        input_tokens: (res.usage || {}).input_tokens,
        output_tokens: (res.usage || {}).output_tokens,
        cache_creation_input_tokens: (res.usage || {}).cache_creation_input_tokens,
        duration_ms: res.duration_ms,
      },
      scrub: { ran: true, pattern: 'email-regex', replacements: scrub.replacements, applied_before: 'answer extraction and scoring', hashed: false },
      raw_answer_text: scrub.text,
      answers,
    };
    const fam = rec.run.model_family;
    fs.writeFileSync(path.join(TDIR, transcriptName(qset.id, condition, i, fam)), JSON.stringify(rec, null, 2) + '\n');
    process.stdout.write(`ok ($${(res.total_cost_usd || 0).toFixed(3)})`
      + (scrub.replacements ? `  [scrubbed ${scrub.replacements} email(s)]` : '') + '\n');
  }
}

// ── report assembly ──────────────────────────────────────────────────────────
function scoreEverything(sets, failures, family) {
  const wantFamily = family || BASELINE_FAMILY;
  const rows = [];
  const otherFamilies = {};
  for (const qset of sets) {
    const figPath = path.join(ROOT, qset.figure);
    const figureText = fs.existsSync(figPath) ? fs.readFileSync(figPath, 'utf8') : null;
    const byCondition = {};
    for (const t of loadTranscripts(qset.id)) {
      // ADV-14b: one family per denominator. A transcript from another family
      // is COUNTED and NAMED below, never averaged into this one.
      const fam = (t.run && t.run.model_family) || modelFamily(t.run && t.run.model_alias, t.run && t.run.model_used);
      if (fam !== wantFamily) { otherFamilies[fam] = (otherFamilies[fam] || 0) + 1; continue; }
      const cond = t.run.condition;
      byCondition[cond] = byCondition[cond] || { readers: [], stale: [], partial: [] };
      // WHICH EXAM DID THIS READER SIT? A transcript whose recorded hash is the
      // whole current set sat the extended exam. One whose hash is the recall
      // subset sat the pre-ADV-14 exam intact and is scored over exactly the
      // questions it was asked — not stale, just earlier. Anything else means
      // the exam it sat has since CHANGED, and that is staleness.
      const recorded = t.prompt.question_set_sha256;
      const sawAll = recorded === qset._sha;
      const sawRecallOnly = !sawAll && recorded === qset._shaRecall;
      const asked = sawAll ? qset.questions : (sawRecallOnly ? qset._recall : qset.questions);
      const graded = {};
      let correct = 0, notStated = 0, unanswered = 0;
      let refusalCorrect = 0, refusalTotal = 0, recallTotal = 0;
      for (const q of asked) {
        const g = gradeAnswer(t.answers[q.qid], q.score, q.klass);
        graded[q.qid] = g;
        if (isRefusal(q)) {
          refusalTotal++;
          if (g.correct) refusalCorrect++;
          continue; // never enters the recovery denominator
        }
        recallTotal++;
        if (g.correct) correct++;
        else if (g.why === 'no-answer') unanswered++;
        else if (g.notStated) notStated++;
      }
      const staleWhy = [];
      if (figureText && t.figure.file_sha256 !== sha(figureText)) staleWhy.push('figure changed since this reading');
      if (!sawAll && !sawRecallOnly) staleWhy.push('question set changed since this reading');
      if (t.integrity && t.integrity.turns > 1) staleWhy.push('reader took more than one turn — a tool may have been used');
      byCondition[cond].readers.push({
        file: t._file, reader: t.run.reader, correct, total: recallTotal,
        refusalCorrect, refusalTotal, sawAll,
        notStated, unanswered, graded, asked, stale: staleWhy, cost: (t.usage || {}).cost_usd || 0,
      });
      if (staleWhy.length) byCondition[cond].stale.push(t._file + ': ' + staleWhy.join('; '));
      if (sawRecallOnly && qset._refusal.length) {
        byCondition[cond].partial.push(t._file + ': baseline-instrument reading — sat the '
          + qset._recall.length + ' recall questions before ' + qset._refusal.length + ' refusal question(s) were added');
      }
    }
    for (const cond of Object.keys(byCondition)) {
      const rs = byCondition[cond].readers;
      byCondition[cond].correct = rs.reduce((a, r) => a + r.correct, 0);
      byCondition[cond].total = rs.reduce((a, r) => a + r.total, 0);
      byCondition[cond].score = pct(byCondition[cond].correct, byCondition[cond].total);
      byCondition[cond].refusalCorrect = rs.reduce((a, r) => a + r.refusalCorrect, 0);
      byCondition[cond].refusalTotal = rs.reduce((a, r) => a + r.refusalTotal, 0);
      byCondition[cond].refusalScore = pct(byCondition[cond].refusalCorrect, byCondition[cond].refusalTotal);
      byCondition[cond].cost = rs.reduce((a, r) => a + r.cost, 0);
    }
    rows.push({ qset, byCondition });
  }
  // failure classification coverage, and the instrument-adjusted score.
  // ADJUSTED credits an answer the key wrongly rejected (grading-artifact) and
  // drops a question the figure never claimed to answer (bad-question) from
  // the denominator. Both numbers are printed; RAW is the headline.
  const unclassified = [];
  const classTally = {};
  let adjCorrect = 0, adjTotal = 0;
  for (const row of rows) {
    const before = [adjCorrect, adjTotal];
    for (const cond of Object.keys(row.byCondition)) {
      if (cond !== 'syntax') continue; // the headline condition is the one that must be explained
      for (const r of row.byCondition[cond].readers) {
        for (const q of r.asked) {
          if (isRefusal(q)) continue; // adjusted is a correction to the RECOVERY score only
          const k = `${row.qset.id}/${q.qid}`;
          if (r.graded[q.qid].correct) { adjCorrect++; adjTotal++; continue; }
          const entry = failures[k];
          const cls = entry && ((entry.per_reader && entry.per_reader[String(r.reader)]) || entry.class);
          if (!cls) { if (!unclassified.includes(k)) unclassified.push(k); adjTotal++; continue; }
          if (!FAILURE_CLASSES.includes(cls)) die('failure-analysis.json: unknown class "' + cls + '" at ' + k);
          classTally[cls] = (classTally[cls] || 0) + 1;
          if (cls === 'grading-artifact') { adjCorrect++; adjTotal++; }
          else if (cls === 'bad-question') { /* out of the denominator */ }
          else adjTotal++;
        }
      }
    }
    row.adjusted = { correct: adjCorrect - before[0], total: adjTotal - before[1] };
    row.adjusted.score = pct(row.adjusted.correct, row.adjusted.total);
  }
  return {
    rows, unclassified, classTally, family: wantFamily, otherFamilies,
    adjusted: { correct: adjCorrect, total: adjTotal, score: pct(adjCorrect, adjTotal) },
  };
}

function printText(res, failures) {
  const { rows } = res;
  console.log('');
  console.log('COLD-READER COMPREHENSION SUITE ' + SUITE_VERSION + '  ·  target: 70–80% from syntax alone');
  console.log('  model family scored: ' + res.family
    + (Object.keys(res.otherFamilies || {}).length
      ? '   ·  NOT scored here: ' + Object.keys(res.otherFamilies).sort()
        .map((f) => f + ' (' + res.otherFamilies[f] + ' transcript(s)) — re-run with --family ' + f).join(', ')
      : ''));
  console.log('');
  console.log('  genre        figure                 syntax  adjusted  control   lift   commented   n');
  console.log('  ' + '-'.repeat(86));
  const totals = {};
  const sorted = rows.slice().sort((a, b) => {
    const sa = (a.byCondition.syntax || {}).score, sb = (b.byCondition.syntax || {}).score;
    return (sa === undefined ? 9 : sa) - (sb === undefined ? 9 : sb);
  });
  for (const row of sorted) {
    const c = row.byCondition;
    for (const k of CONDITIONS) {
      if (!c[k]) continue;
      totals[k] = totals[k] || { correct: 0, total: 0 };
      totals[k].correct += c[k].correct; totals[k].total += c[k].total;
    }
    const s = c.syntax ? fmtPct(c.syntax.score) : '    —';
    const t = c['title-only'] ? fmtPct(c['title-only'].score) : '    —';
    const lift = (c.syntax && c['title-only'])
      ? ((c.syntax.score - c['title-only'].score) * 100).toFixed(1).padStart(5) : '    —';
    const cm = c.commented ? fmtPct(c.commented.score) : '    —';
    const n = c.syntax ? c.syntax.readers.length : 0;
    const adj = row.adjusted && row.adjusted.total ? fmtPct(row.adjusted.score) : '    —';
    console.log('  ' + row.qset.genre.padEnd(12) + row.qset.id.padEnd(23) + s + '   ' + adj + '   ' + t + '   ' + lift + '   ' + cm + '   ' + n);
  }
  console.log('  ' + '-'.repeat(86));
  const g = totals.syntax || { correct: 0, total: 0 };
  const gc = totals['title-only'];
  console.log('  OVERALL (syntax)   ' + g.correct + '/' + g.total + ' = ' + fmtPct(pct(g.correct, g.total))
    + (gc ? '   control ' + fmtPct(pct(gc.correct, gc.total)) + '   lift ' + ((pct(g.correct, g.total) - pct(gc.correct, gc.total)) * 100).toFixed(1) + ' pts' : ''));
  const overall = pct(g.correct, g.total);
  console.log('  verdict: ' + (overall >= TARGET_LO ? 'AT OR ABOVE the 70% floor' : 'BELOW the 70% floor by ' + ((TARGET_LO - overall) * 100).toFixed(1) + ' points'));
  if (res.adjusted && res.adjusted.total) {
    console.log('  instrument-adjusted  ' + res.adjusted.correct + '/' + res.adjusted.total + ' = ' + fmtPct(res.adjusted.score)
      + '   (credits answers the key wrongly rejected; drops out-of-scope questions)');
  }
  // ── refusal-to-hallucinate, ADV-14 — its OWN denominator, never the above ──
  const refusalQuestions = rows.reduce((a, r) => a + r.qset._refusal.length, 0);
  if (refusalQuestions) {
    const rt = {};
    for (const row of rows) for (const cond of CONDITIONS) {
      const c = row.byCondition[cond];
      if (!c || !c.refusalTotal) continue;
      rt[cond] = rt[cond] || { correct: 0, total: 0 };
      rt[cond].correct += c.refusalCorrect; rt[cond].total += c.refusalTotal;
    }
    console.log('');
    console.log('  REFUSAL TO HALLUCINATE (ADV-14) — ' + refusalQuestions
      + ' question(s) whose correct answer is a refusal, over '
      + rows.filter((r) => r.qset._refusal.length).length + ' figure(s). SEPARATE denominator: never in the score above.');
    if (!Object.keys(rt).length) {
      console.log('    no readings yet — the classes are authored and keyed; the run that measures them is a separate, pre-registered act.');
    } else {
      for (const cond of CONDITIONS) {
        if (!rt[cond]) continue;
        console.log('    ' + cond.padEnd(12) + rt[cond].correct + '/' + rt[cond].total + ' = ' + fmtPct(pct(rt[cond].correct, rt[cond].total))
          + (cond === 'title-only' ? '   (the TEMPTATION control: a LOW number here is what proves the question was tempting)' : ''));
      }
    }
  }
  console.log('');
  // stale + integrity
  const stale = [];
  const partial = [];
  for (const row of rows) for (const cond of Object.keys(row.byCondition)) {
    stale.push(...row.byCondition[cond].stale);
    partial.push(...(row.byCondition[cond].partial || []));
  }
  if (stale.length) { console.log('  STALE TRANSCRIPTS (re-run needed):'); stale.forEach((s) => console.log('    ' + s)); console.log(''); }
  if (partial.length) {
    console.log('  BASELINE-INSTRUMENT TRANSCRIPTS (' + partial.length + ') — not stale: the exam each sat is intact and');
    console.log('  unchanged, and questions have been added since. Each is scored over the questions it was asked,');
    console.log('  which is why the published numbers do not move. The added questions await their own run.');
    console.log('');
  }
  const awaiting = rows.filter((r) => !Object.keys(r.byCondition).length).map((r) => r.qset.id);
  if (awaiting.length) {
    console.log('  AWAITING A FIRST READING (' + awaiting.length + '): ' + awaiting.join(', '));
    console.log('  — authored and keyed, never read. They contribute nothing to any number above.');
    console.log('');
  }
  if (res.unclassified.length) {
    console.log('  UNCLASSIFIED FAILURES (' + res.unclassified.length + '): ' + res.unclassified.join(', '));
    console.log('');
  }
  // per-class tally, over ANSWERS (reader × question), syntax condition
  const tally = res.classTally || {};
  if (Object.keys(tally).length) {
    const n = Object.keys(tally).reduce((a, c) => a + tally[c], 0);
    console.log('  WHY THE ' + n + ' MISSED ANSWERS WERE MISSED (syntax condition):');
    FAILURE_CLASSES.filter((c) => tally[c]).sort((a, b) => tally[b] - tally[a])
      .forEach((c) => console.log('    ' + String(tally[c]).padStart(3) + '  ' + c));
    const zero = FAILURE_CLASSES.filter((c) => !tally[c]);
    if (zero.length) console.log('      0  ' + zero.join(', '));
    console.log('');
  }
  return overall;
}

function printMarkdown(res) {
  const { rows } = res;
  const sorted = rows.slice().sort((a, b) => ((a.byCondition.syntax || {}).score ?? 9) - ((b.byCondition.syntax || {}).score ?? 9));
  console.log('| Genre | Figure | Syntax only (raw) | Instrument-adjusted | Control (title only) | With comments | Readers |');
  console.log('|---|---|---:|---:|---:|---:|---:|');
  const tot = { syntax: [0, 0], 'title-only': [0, 0], commented: [0, 0] };
  for (const row of sorted) {
    const c = row.byCondition;
    for (const k of CONDITIONS) if (c[k]) { tot[k][0] += c[k].correct; tot[k][1] += c[k].total; }
    const cell = (k) => (c[k] ? `${(c[k].score * 100).toFixed(0)}% (${c[k].correct}/${c[k].total})` : '—');
    const adj = row.adjusted && row.adjusted.total
      ? `${(row.adjusted.score * 100).toFixed(0)}% (${row.adjusted.correct}/${row.adjusted.total})` : '—';
    console.log(`| \`${row.qset.genre}\` | \`${row.qset.id}\` | **${cell('syntax')}** | ${adj} | ${cell('title-only')} | ${cell('commented')} | ${c.syntax ? c.syntax.readers.length : 0} |`);
  }
  const c = (k) => (tot[k][1] ? `${((tot[k][0] / tot[k][1]) * 100).toFixed(0)}% (${tot[k][0]}/${tot[k][1]})` : '—');
  const adjAll = res.adjusted && res.adjusted.total
    ? `${(res.adjusted.score * 100).toFixed(0)}% (${res.adjusted.correct}/${res.adjusted.total})` : '—';
  console.log(`| **all** | **overall** | **${c('syntax')}** | ${adjAll} | ${c('title-only')} | ${c('commented')} | |`);
  // The refusal classes get their OWN table. Putting them in a column of the
  // one above would invite exactly the average the class split exists to stop.
  const withRefusal = rows.filter((r) => r.qset._refusal.length);
  if (!withRefusal.length) return;
  console.log('');
  console.log('| Genre | Figure | Refusal questions | Syntax | With comments | Control (temptation) |');
  console.log('|---|---|---:|---:|---:|---:|');
  for (const row of withRefusal) {
    const c2 = row.byCondition;
    const cell = (k) => (c2[k] && c2[k].refusalTotal ? `${(c2[k].refusalScore * 100).toFixed(0)}% (${c2[k].refusalCorrect}/${c2[k].refusalTotal})` : '—');
    const counts = QUESTION_CLASSES.filter((k) => REFUSAL_CLASSES.includes(k))
      .map((k) => row.qset._refusal.filter((q) => q.klass === k).length + ' ' + k).join(', ');
    console.log(`| \`${row.qset.genre}\` | \`${row.qset.id}\` | ${counts} | ${cell('syntax')} | ${cell('commented')} | ${cell('title-only')} |`);
  }
}

function writeBaseline(res) {
  // The version of the TOOL is not the version of the MEASUREMENT. A score is
  // a property of the transcripts it was recomputed from, so the versions the
  // transcripts themselves record are collected and written down beside the
  // tool's own — otherwise re-running --write-baseline on a newer tool would
  // silently relabel readings taken on an older instrument as if they were new.
  const versionsSeen = new Set();
  for (const row of res.rows) {
    for (const t of loadTranscripts(row.qset.id)) versionsSeen.add(t.suite_version || 'unrecorded');
  }
  const out = {
    suite_version: SUITE_VERSION,
    measured_under_suite_versions: Array.from(versionsSeen).sort(),
    baseline_suite_version: BASELINE_SUITE_VERSION,
    model_family: res.family,
    model_families_present_but_not_scored: Object.keys(res.otherFamilies || {}).sort(),
    scoring_note: 'the recovery score below counts `recall` questions only; the two ADV-14 refusal classes are scored in refusal_to_hallucinate and never averaged in',
    target: { floor: TARGET_LO, ceiling: TARGET_HI, statement: 'a reader who has never opened the spec recovers 70-80% of what a .fd says from the syntax alone' },
    generated_by: 'tools/comprehension-check.js --write-baseline (scores recomputed from the stored transcripts; no model was called)',
    figures: {},
  };
  let sc = 0, st = 0, cc = 0, ct = 0;
  for (const row of res.rows) {
    const e = { genre: row.qset.genre, figure: row.qset.figure, source: row.qset.source, conditions: {} };
    for (const cond of Object.keys(row.byCondition)) {
      const b = row.byCondition[cond];
      e.conditions[cond] = {
        correct: b.correct, total: b.total, score: Number(b.score.toFixed(4)),
        readers: b.readers.map((r) => ({ reader: r.reader, correct: r.correct, total: r.total, not_stated: r.notStated, unanswered: r.unanswered })),
      };
      if (cond === 'syntax') { sc += b.correct; st += b.total; }
      if (cond === 'title-only') { cc += b.correct; ct += b.total; }
    }
    if (row.adjusted && row.adjusted.total) {
      e.instrument_adjusted = {
        correct: row.adjusted.correct, total: row.adjusted.total,
        score: Number(row.adjusted.score.toFixed(4)),
        means: 'syntax condition, crediting answers the key wrongly rejected and dropping questions outside what the figure claims to show',
      };
    }
    if (row.qset._refusal.length) {
      e.refusal_to_hallucinate = {
        questions: row.qset._refusal.length,
        by_class: REFUSAL_CLASSES.reduce((a, k) => { a[k] = row.qset._refusal.filter((q) => q.klass === k).length; return a; }, {}),
        conditions: Object.keys(row.byCondition).reduce((a, cond) => {
          const b = row.byCondition[cond];
          if (b.refusalTotal) a[cond] = { correct: b.refusalCorrect, total: b.refusalTotal, score: Number(b.refusalScore.toFixed(4)) };
          return a;
        }, {}),
        means: 'a separate denominator: correct = the reader declined. Never averaged into the recovery score.',
      };
    }
    out.figures[row.qset.id] = e;
  }
  const rq = res.rows.reduce((a, r) => a + r.qset._refusal.length, 0);
  out.overall = {
    syntax: { correct: sc, total: st, score: Number(pct(sc, st).toFixed(4)) },
    control: { correct: cc, total: ct, score: Number(pct(cc, ct).toFixed(4)) },
    instrument_adjusted: res.adjusted
      ? { correct: res.adjusted.correct, total: res.adjusted.total, score: Number(res.adjusted.score.toFixed(4)) }
      : null,
    failure_classes: res.classTally || {},
    lift_points: Number(((pct(sc, st) - pct(cc, ct)) * 100).toFixed(1)),
    meets_floor: pct(sc, st) >= TARGET_LO,
    refusal_to_hallucinate: rq ? (() => {
      const acc = {};
      for (const row of res.rows) for (const cond of Object.keys(row.byCondition)) {
        const b = row.byCondition[cond];
        if (!b.refusalTotal) continue;
        acc[cond] = acc[cond] || { correct: 0, total: 0 };
        acc[cond].correct += b.refusalCorrect; acc[cond].total += b.refusalTotal;
      }
      for (const k of Object.keys(acc)) acc[k].score = Number(pct(acc[k].correct, acc[k].total).toFixed(4));
      return { questions_authored: rq, conditions: acc, read: !!Object.keys(acc).length };
    })() : null,
  };
  fs.writeFileSync(BASE_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log('  wrote tools/comprehension/baseline.json');
}

// ── per-answer audit dump ────────────────────────────────────────────────────
function printAudit(res, only) {
  for (const row of res.rows) {
    if (only && row.qset.id !== only) continue;
    for (const cond of Object.keys(row.byCondition)) {
      for (const r of row.byCondition[cond].readers) {
        console.log('\n=== ' + row.qset.id + ' · ' + cond + ' · reader ' + r.reader + '  ' + r.correct + '/' + r.total
          + (r.refusalTotal ? '   refusal ' + r.refusalCorrect + '/' + r.refusalTotal : '')
          + (r.sawAll ? '' : '   [baseline-instrument reading: sat ' + r.asked.length + ' of ' + row.qset.questions.length + ' questions]'));
        for (const q of r.asked) {
          const g = r.graded[q.qid];
          const t = loadTranscripts(row.qset.id).find((x) => x._file === r.file);
          console.log((g.correct ? ' [+] ' : ' [-] ') + q.qid + (isRefusal(q) ? ' <' + q.klass + '> ' : ' ') + q.ask);
          console.log('       key: ' + q.answer);
          console.log('       got: ' + (t.answers[q.qid] === null ? '(no answer extracted)' : t.answers[q.qid]));
          if (!g.correct && g.missed_groups && g.missed_groups.length) {
            console.log('       missed: ' + g.missed_groups.map((x) => '[' + x.join(' | ') + ']').join(' '));
          }
          if (!g.correct && g.matched_none_of && g.matched_none_of.length) {
            console.log('       rejected by: ' + g.matched_none_of.join(', '));
          }
        }
      }
    }
  }
}

// ── mode: --check (offline, pure function of the tree) ───────────────────────
// `--selftest` asks whether a key accepts its own answer. `--check` asks the
// questions a key CANNOT answer about itself:
//   1. does the figure the set names still exist, and does it still declare
//      the genre the set claims to be measuring;
//   2. is every question class known, and does every refusal question carry an
//      `absent_from_figure` claim;
//   3. IS THAT CLAIM STILL TRUE — none of the named tokens may appear in the
//      presented text of either FILE condition. This is the one check that
//      decays on its own: a refusal key is a statement about what the figure
//      does not say, and an author who later adds the missing fact silently
//      turns a correct key into a wrong one. Here it turns the check red
//      instead, which is the whole reason the tokens are written down.
//   4. does the presented text still carry no email address (item 50 applied
//      to the INPUT side — the figures are ours, and a provenance line with an
//      address in one would be shown to every reader).
function runCheck(sets) {
  let bad = 0;
  console.log('CHECK — comprehension instrument ' + SUITE_VERSION + ' (offline; no model is called)');
  for (const qset of sets) {
    const figPath = path.join(ROOT, qset.figure);
    const fail = (m) => { bad++; console.log('    FAIL  ' + m); };
    console.log('  ' + qset.id.padEnd(22) + ' [' + qset.genre + ']  ' + qset.figure);
    if (!fs.existsSync(figPath)) { fail('figure missing: ' + qset.figure); continue; }
    const text = fs.readFileSync(figPath, 'utf8');
    const declared = (text.match(/^\s*figdown\s+\S+\s+(\S+)/m) || [])[1];
    if (declared !== qset.genre) fail('the figure declares genre `' + declared + '`, the question set claims `' + qset.genre + '`');
    const counts = QUESTION_CLASSES.map((k) => qset.questions.filter((q) => q.klass === k).length + ' ' + k).join(', ');
    console.log('    questions: ' + qset.questions.length + '  (' + counts + ')');
    for (const cond of ['syntax', 'commented']) {
      const presented = present(text, cond);
      const norm = normalise(presented);
      const em = scrubEmails(presented);
      if (em.replacements) fail('the ' + cond + ' presentation contains ' + em.replacements + ' email address(es) — a reader would be shown one');
      for (const q of qset._refusal) {
        for (const tok of q.absent_from_figure.tokens) {
          if (altMatches(norm, tok)) {
            fail(q.qid + ' [' + q.klass + ']: the ' + cond + ' presentation now contains "' + tok
              + '", which its key asserts is absent — the figure has changed and this key is no longer true');
          }
        }
      }
    }
    if (qset._refusal.length) {
      console.log('    refusal keys: ' + qset._refusal.length + ' verified absent from both file conditions ('
        + qset._refusal.reduce((a, q) => a + q.absent_from_figure.tokens.length, 0) + ' tokens)');
    }
  }
  console.log('');
  console.log(bad ? 'CHECK: FAIL (' + bad + ' finding(s))'
    : 'CHECK: ' + sets.length + ' question set(s) name a figure that exists and declares the claimed genre; every question class is known; '
      + 'every refusal key\'s absence claim still holds against the current presented text; no presentation carries an email address.');
  return bad === 0;
}

// ── main ─────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

  if (has('--help') || has('-h')) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
    return;
  }

  const only = val('--figure', null);
  const ids = only ? only.split(',').map((s) => s.trim()) : null;
  const sets = loadQuestionSets(ids);

  if (has('--dump')) {
    const id = val('--dump', null);
    const cond = val('--condition', 'syntax');
    const qset = sets.find((s) => s.id === id) || sets[0];
    const text = fs.readFileSync(path.join(ROOT, qset.figure), 'utf8');
    const presented = present(text, cond);
    console.log(userMessage(qset, presented, figureTitle(text), cond));
    return;
  }

  if (has('--check')) { process.exit(runCheck(sets) ? 0 : 1); return; }

  if (has('--run')) {
    const cond = val('--condition', 'syntax');
    if (!CONDITIONS.includes(cond)) die('--condition must be one of ' + CONDITIONS.join(', '));
    const readers = Number(val('--readers', '3'));
    // ADV-14b: a LIST. Each model reads every named figure in turn, and its
    // family decides the transcript's filename, so a second family lands
    // beside the baseline instead of on top of it.
    const models = val('--model', READER_MODEL_DEFAULT).split(',').map((s) => s.trim()).filter(Boolean);
    if (!models.length) die('--model needs at least one model name');
    const budget = Number(val('--budget', '2.0'));
    if (!fs.existsSync(TDIR)) fs.mkdirSync(TDIR, { recursive: true });
    console.log(`LIVE RUN — ${sets.length} figure(s) × ${models.length} model(s) × ${readers} reader(s), condition=${cond}, model(s)=${models.join(', ')}`);
    console.log('Families: ' + models.map((m) => m + '→' + modelFamily(m, null)).join(', '));
    console.log('This makes live model calls. Cold room: no tools, no MCP, no settings, empty cwd.');
    console.log('Readers are instructed to emit answer lines only — no provenance line — and every reply is');
    console.log('scrubbed for an email address at capture time, with the scrub recorded (backlog item 50).');
    for (const m of models) for (const qset of sets) runFigure(qset, cond, readers, m, budget);
    console.log('done. Score with: node tools/comprehension-check.js'
      + (models.some((m) => modelFamily(m, null) !== BASELINE_FAMILY) ? ' --family <family>' : ''));
    return;
  }

  if (has('--selftest')) {
    // A key that rejects its own canonical answer is broken on its face. This
    // catches nothing subtle — a key can still reject a correct PARAPHRASE,
    // which is where every grading artifact in the first baseline came from —
    // but it is deterministic, offline, and free, so it can be gated.
    //
    // For the two refusal classes the same rule reads the other way round: the
    // canonical answer must itself be a refusal, so a key that "accepts its own
    // canonical answer" is one that scores NOT STATED as correct. An author who
    // writes a committed sentence as the canonical answer of an `unanswerable`
    // question has misunderstood the class, and this catches that too.
    let bad = 0, n = 0, nr = 0;
    for (const qset of sets) {
      for (const q of qset.questions) {
        n++;
        if (isRefusal(q)) nr++;
        const g = gradeAnswer(q.answer, q.score, q.klass);
        if (!g.correct) {
          bad++;
          console.log('  BROKEN KEY  ' + qset.id + '/' + q.qid + ' [' + q.klass + '] — the key rejects its own canonical answer');
          if (isRefusal(q) && !/^not stated/.test(normalise(q.answer))) {
            console.log('              a ' + q.klass + ' question\'s canonical answer must OPEN with NOT STATED — this one commits.');
          }
          console.log('              answer: ' + q.answer);
          console.log('              missed: ' + (g.missed_groups || []).map((x) => '[' + x.join(' | ') + ']').join(' ')
            + ((g.matched_none_of || []).length ? '  rejected by: ' + g.matched_none_of.join(', ') : ''));
        }
      }
    }
    console.log('  selftest: ' + (n - bad) + '/' + n + ' keys accept their own canonical answer'
      + (nr ? ' (' + (n - nr) + ' recall, ' + nr + ' refusal — for which the canonical answer IS the refusal).' : '.'));
    if (bad) process.exit(1);
    return;
  }

  const failures = fs.existsSync(FAIL_FILE) ? readJSON(FAIL_FILE).failures || {} : {};
  const res = scoreEverything(sets, failures, val('--family', BASELINE_FAMILY));

  if (has('--audit')) { printAudit(res, ids ? ids[0] : null); return; }
  if (has('--report')) { printMarkdown(res); return; }

  const overall = printText(res, failures);
  if (has('--write-baseline')) writeBaseline(res);

  const stale = res.rows.some((r) => Object.keys(r.byCondition).some((c) => r.byCondition[c].stale.length));
  if (has('--verify')) {
    if (stale) { console.error('FINDING: a transcript no longer matches its figure or its question set.'); process.exit(1); }
    console.log('  verify: every transcript matches the figure and question set it was taken against.');
    return;
  }
  if (has('--strict')) {
    const problems = [];
    if (stale) problems.push('stale transcripts');
    if (res.unclassified.length) problems.push(res.unclassified.length + ' unclassified failures');
    if (overall < TARGET_LO) problems.push('overall ' + (overall * 100).toFixed(1) + '% is below the 70% floor');
    if (problems.length) { console.error('FINDINGS: ' + problems.join('; ')); process.exit(1); }
  }
}

main();
