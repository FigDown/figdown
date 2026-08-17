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
// USAGE
//   node tools/comprehension-check.js                 score every stored transcript
//   node tools/comprehension-check.js --report        the same, as Markdown
//   node tools/comprehension-check.js --verify        transcripts still match the .fd + key
//   node tools/comprehension-check.js --dump <id>     print exactly what a reader was shown
//   node tools/comprehension-check.js --run --figure <id> --readers 3 [--condition syntax]
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

const SUITE_VERSION = '1.0.0';
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
  ].join('\n'),
  // The control. No text at all — only the title — so its score is the part
  // of the exam that prior knowledge alone can carry.
  'title-only': [
    'You are asked questions about a figure. You are NOT shown the figure or any file: you are given only its title.',
    '',
    'Answer from your own knowledge of the subject the title names. If you do not know an answer, write exactly NOT STATED.',
    '',
    'Answer every question. Put each answer on its own line, prefixed with its number as A1:, A2:, and so on, in order. Keep each answer to at most two sentences. Do not explain your reasoning and do not restate the questions.',
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

function gradeAnswer(answerText, key) {
  const norm = normalise(answerText);
  const notStated = /\bnot stated\b/.test(norm);
  if (!answerText || !norm) return { correct: false, why: 'no-answer', notStated: false };
  // A reader that opens with NOT STATED has declined the question — in the
  // file conditions it is saying the file does not carry the meaning, in the
  // control it is saying it does not know. Either way the meaning was not
  // recovered, so it is wrong even if the sentence that follows happens to
  // contain a key token ("not stated; typically it would be low").
  if (/^not stated/.test(norm)) {
    return { correct: false, why: 'not-stated', notStated: true, missed_groups: [], matched_none_of: [] };
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
    missed_groups: missed,
    matched_none_of: banned,
  };
}

function extractAnswers(resultText, n) {
  const lines = String(resultText || '').split('\n');
  const out = {};
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^\s*(?:\*\*)?A\s*(\d+)\s*(?:\*\*)?\s*[:.)-]\s*(.*)$/i);
    if (m) { cur = Number(m[1]); out[cur] = (m[2] || '').trim(); continue; }
    if (cur !== null && line.trim()) out[cur] = (out[cur] + ' ' + line.trim()).trim();
  }
  const answers = {};
  for (let i = 1; i <= n; i++) answers['q' + i] = out[i] !== undefined ? out[i] : null;
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
    q._sha = sha(JSON.stringify(q.questions));
    if (filterIds && !filterIds.includes(q.id)) continue;
    for (const k of ['id', 'genre', 'figure', 'source', 'questions']) {
      if (!q[k]) die(f + ': question set is missing "' + k + '"');
    }
    q.questions.forEach((qq, i) => {
      if (!qq.qid) qq.qid = 'q' + (i + 1);
      if (!qq.ask || !qq.answer || !qq.score) die(f + ' ' + qq.qid + ': needs ask, answer and score');
    });
    sets.push(q);
  }
  if (filterIds && !sets.length) die('no question set matches --figure ' + filterIds.join(','));
  return sets;
}

function transcriptName(id, condition, reader) {
  return `${id}.${condition}.r${reader}.json`;
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
    process.stdout.write(`  reader ${i}/${readers} (${qset.id} · ${condition}) … `);
    const res = askReader(model, system, user, budget);
    const answers = extractAnswers(res.result, qset.questions.length);
    const rec = {
      suite_version: SUITE_VERSION,
      run: {
        utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        model_alias: model,
        model_used: Object.keys(res.modelUsage || {}).join(','),
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
      raw_answer_text: res.result,
      answers,
    };
    fs.writeFileSync(path.join(TDIR, transcriptName(qset.id, condition, i)), JSON.stringify(rec, null, 2) + '\n');
    process.stdout.write(`ok ($${(res.total_cost_usd || 0).toFixed(3)})\n`);
  }
}

// ── report assembly ──────────────────────────────────────────────────────────
function scoreEverything(sets, failures) {
  const rows = [];
  for (const qset of sets) {
    const figPath = path.join(ROOT, qset.figure);
    const figureText = fs.existsSync(figPath) ? fs.readFileSync(figPath, 'utf8') : null;
    const byCondition = {};
    for (const t of loadTranscripts(qset.id)) {
      const cond = t.run.condition;
      byCondition[cond] = byCondition[cond] || { readers: [], stale: [] };
      const graded = {};
      let correct = 0, notStated = 0, unanswered = 0;
      for (const q of qset.questions) {
        const g = gradeAnswer(t.answers[q.qid], q.score);
        graded[q.qid] = g;
        if (g.correct) correct++;
        else if (g.why === 'no-answer') unanswered++;
        else if (g.notStated) notStated++;
      }
      const staleWhy = [];
      if (figureText && t.figure.file_sha256 !== sha(figureText)) staleWhy.push('figure changed since this reading');
      if (t.prompt.question_set_sha256 !== qset._sha) staleWhy.push('question set changed since this reading');
      if (t.integrity && t.integrity.turns > 1) staleWhy.push('reader took more than one turn — a tool may have been used');
      byCondition[cond].readers.push({
        file: t._file, reader: t.run.reader, correct, total: qset.questions.length,
        notStated, unanswered, graded, stale: staleWhy, cost: (t.usage || {}).cost_usd || 0,
      });
      if (staleWhy.length) byCondition[cond].stale.push(t._file + ': ' + staleWhy.join('; '));
    }
    for (const cond of Object.keys(byCondition)) {
      const rs = byCondition[cond].readers;
      byCondition[cond].correct = rs.reduce((a, r) => a + r.correct, 0);
      byCondition[cond].total = rs.reduce((a, r) => a + r.total, 0);
      byCondition[cond].score = pct(byCondition[cond].correct, byCondition[cond].total);
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
        for (const q of row.qset.questions) {
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
  return { rows, unclassified, classTally, adjusted: { correct: adjCorrect, total: adjTotal, score: pct(adjCorrect, adjTotal) } };
}

function printText(res, failures) {
  const { rows } = res;
  console.log('');
  console.log('COLD-READER COMPREHENSION SUITE ' + SUITE_VERSION + '  ·  target: 70–80% from syntax alone');
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
  console.log('');
  // stale + integrity
  const stale = [];
  for (const row of rows) for (const cond of Object.keys(row.byCondition)) stale.push(...row.byCondition[cond].stale);
  if (stale.length) { console.log('  STALE TRANSCRIPTS (re-run needed):'); stale.forEach((s) => console.log('    ' + s)); console.log(''); }
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
}

function writeBaseline(res) {
  const out = {
    suite_version: SUITE_VERSION,
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
    out.figures[row.qset.id] = e;
  }
  out.overall = {
    syntax: { correct: sc, total: st, score: Number(pct(sc, st).toFixed(4)) },
    control: { correct: cc, total: ct, score: Number(pct(cc, ct).toFixed(4)) },
    instrument_adjusted: res.adjusted
      ? { correct: res.adjusted.correct, total: res.adjusted.total, score: Number(res.adjusted.score.toFixed(4)) }
      : null,
    failure_classes: res.classTally || {},
    lift_points: Number(((pct(sc, st) - pct(cc, ct)) * 100).toFixed(1)),
    meets_floor: pct(sc, st) >= TARGET_LO,
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
        console.log('\n=== ' + row.qset.id + ' · ' + cond + ' · reader ' + r.reader + '  ' + r.correct + '/' + r.total);
        for (const q of row.qset.questions) {
          const g = r.graded[q.qid];
          const t = loadTranscripts(row.qset.id).find((x) => x._file === r.file);
          console.log((g.correct ? ' [+] ' : ' [-] ') + q.qid + ' ' + q.ask);
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

  if (has('--run')) {
    const cond = val('--condition', 'syntax');
    if (!CONDITIONS.includes(cond)) die('--condition must be one of ' + CONDITIONS.join(', '));
    const readers = Number(val('--readers', '3'));
    const model = val('--model', 'sonnet');
    const budget = Number(val('--budget', '2.0'));
    if (!fs.existsSync(TDIR)) fs.mkdirSync(TDIR, { recursive: true });
    console.log(`LIVE RUN — ${sets.length} figure(s) × ${readers} reader(s), condition=${cond}, model=${model}`);
    console.log('This makes live model calls. Cold room: no tools, no MCP, no settings, empty cwd.');
    for (const qset of sets) runFigure(qset, cond, readers, model, budget);
    console.log('done. Score with: node tools/comprehension-check.js');
    return;
  }

  if (has('--selftest')) {
    // A key that rejects its own canonical answer is broken on its face. This
    // catches nothing subtle — a key can still reject a correct PARAPHRASE,
    // which is where every grading artifact in the first baseline came from —
    // but it is deterministic, offline, and free, so it can be gated.
    let bad = 0, n = 0;
    for (const qset of sets) {
      for (const q of qset.questions) {
        n++;
        const g = gradeAnswer(q.answer, q.score);
        if (!g.correct) {
          bad++;
          console.log('  BROKEN KEY  ' + qset.id + '/' + q.qid + ' — the key rejects its own canonical answer');
          console.log('              answer: ' + q.answer);
          console.log('              missed: ' + (g.missed_groups || []).map((x) => '[' + x.join(' | ') + ']').join(' ')
            + ((g.matched_none_of || []).length ? '  rejected by: ' + g.matched_none_of.join(', ') : ''));
        }
      }
    }
    console.log('  selftest: ' + (n - bad) + '/' + n + ' keys accept their own canonical answer.');
    if (bad) process.exit(1);
    return;
  }

  const failures = fs.existsSync(FAIL_FILE) ? readJSON(FAIL_FILE).failures || {} : {};
  const res = scoreEverything(sets, failures);

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
