#!/usr/bin/env node
/**
 * manifest-check.js — gate:manifest, the verifier for the publication
 * manifest profile (spec/figdown-manifest.md, spec/figdown-manifest.schema.json).
 *
 * WHY THIS EXISTS. PUBLICATION-MANIFEST-PROFILE (decisions/registry.md)
 * ruled that a rule without a check is not a control, and pre-registered the
 * five assertions below before any manifest shipped. This file is that
 * verifier, built against the already-ruled design — nothing here is a new
 * decision, only an implementation of PUBLICATION-MANIFEST-PROFILE's own words.
 *
 * FIVE ASSERTIONS, EXACTLY AS RULED (PUBLICATION-MANIFEST-PROFILE item 13):
 *   A. the manifest PARSES and its version is known (`figdown_manifest: "1"`).
 *   B. every RESTATED field matches the pair it restates: `source.sha256`/
 *      `bytes` against the paired `.fd`; `renderer.engine_version` and
 *      `renderer.render_options` against the artifact's `data-engine-version`/
 *      `data-render-options`; `language.version` against the source's own
 *      declared header. A mismatch is an ERROR IN THE MANIFEST (figdown-
 *      manifest.md §1) — never a merge, never a vote, the `.fd`/`.svg` pair
 *      stays truth.
 *   C. every hash is well-formed (schema `pattern`), and `review.of_source_
 *      sha256` (and, on the same binding, `accessibility.of_source_sha256`)
 *      equals `source.sha256` or is reported STALE (fatal) / UNBOUND
 *      (reported, not fatal) when absent.
 *   D. every `provenance` entry carries a `relation` from the closed
 *      vocabulary and AT LEAST ONE locator field (`section`, `figure`,
 *      `locator` or `bbox`).
 *   E. unknown keys FAIL (the manifest is CLOSED); a well-formed extension
 *      key is REPORTED, never treated as an error. ADV-24 is RULED
 *      (LANGUAGE-EXTENSION-POLICY/MANIFEST-EXTENSION-NAMESPACE, 2026-08-23): the spelling is `x-<owner>-<key>`, there is
 *      no registry, and duty 2 of the three consumer duties — ALWAYS
 *      REPORTABLE — is what this half of E implements. An `x-` key that
 *      names no owner (`x-status`) is not an extension key at all: it fails
 *      the schema's `^x-[^-]+(-[^-]+)+$` pattern like any other unknown key,
 *      and this assertion adds the named reason so the author reads the
 *      spelling rule rather than "unknown key".
 *
 * `accessibility.role` (MANIFEST-ACCESSIBILITY-ROLE) — CLOSED, OPTIONAL, `graphics-document`/`img` —
 * validates through the schema's generic `enum` handling like any other
 * enumerated field; no assertion-specific code was needed to land it. It is
 * the field spec/figdown-a11y.md §2.2 points a publisher choosing
 * `role="img"` at; `tools/a11y-check.js` assertion D is the tool that reads
 * it back against an artifact's own `role=`.
 *
 * Schema validation (spec/figdown-manifest.schema.json) runs alongside these
 * five, never instead of them — the schema states SHAPE, the assertions above
 * state cross-field and cross-file rules JSON Schema cannot express on its
 * own (a hash matching a SIBLING file, a state bound to a hash that may have
 * moved). The validator below is the same zero-dependency minimal JSON
 * Schema 2020-12 implementation tools/schema-check.js uses, extended with the
 * two keywords this schema needs that the model schema never did:
 * `patternProperties` (the `^x-[^-]+(-[^-]+)+$` extension door) and `format: "date"`
 * (review/accessibility dates), plus `minLength`/`maxLength` for the id-ish
 * string fields. Nothing here adds an npm dependency.
 *
 * SCOPE. Every `X.manifest.json` found by a recursive walk from the repo
 * root, skipping `.git`, `node_modules`, `dist`, `archive` (frozen, never
 * edited — core §13.5), `conformance` (fixture corpus, not published
 * figures) and this tool's own `tools/manifest-fixtures/` (checked
 * separately, by name, against its `.why.txt` pins). A manifest with no
 * paired `.fd` or `.svg` beside it cannot have its restated fields checked at
 * all (assertion B), so that pairing failure is itself fatal.
 *
 * A TREE WITH ZERO MANIFESTS IS NOT A FAILURE. Unlike `tools/alt-check.js`
 * (which refuses to pass on zero embeds, because embeds are known to exist
 * today), a manifest is OPTIONAL by the profile's own §2.3 absence rule — its
 * absence asserts nothing. So this gate reports "0 manifests found" and exits
 * 0 when that is true, rather than treating an empty corpus as a broken scan.
 * The fixture suite still runs regardless, so the gate is never vacuous.
 *
 * Usage:
 *   node tools/manifest-check.js [--strict] [--verbose]
 *     --strict   exit 1 on any failure (CI mode; what `npm test` runs)
 *     --verbose  list every manifest and fixture checked
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'spec', 'figdown-manifest.schema.json');
const SCHEMA_REL = 'spec/figdown-manifest.schema.json';
const FIXTURES = path.join(__dirname, 'manifest-fixtures');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');

let failures = 0;
const fail = (m) => { failures++; console.log('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);
const note = (m) => console.log('note  ' + m);

// ── the validator (extends tools/schema-check.js's minimal implementation) ──
const ANNOTATIONS = new Set(['$schema', '$id', '$comment', 'title', 'description', '$defs']);
const APPLICATORS = new Set([
  '$ref', 'type', 'const', 'enum', 'pattern', 'format',
  'properties', 'required', 'additionalProperties', 'patternProperties', 'dependentRequired',
  'items', 'minItems', 'maxItems', 'minLength', 'maxLength',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'oneOf', 'anyOf',
]);

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}
const typeMatches = (v, t) => t === 'number' ? (typeof v === 'number') : typeOf(v) === t;

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeOf(a) !== typeOf(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (a && typeof a === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function auditKeywords(node, where, out) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return out;
  for (const k of Object.keys(node)) {
    if (ANNOTATIONS.has(k)) {
      if (k === '$defs') for (const d of Object.keys(node.$defs)) auditKeywords(node.$defs[d], '#/$defs/' + d, out);
      continue;
    }
    if (!APPLICATORS.has(k)) { out.push(where + ': "' + k + '"'); continue; }
    const v = node[k];
    if (k === 'properties') for (const p of Object.keys(v)) auditKeywords(v[p], where + '/properties/' + p, out);
    else if (k === 'patternProperties') for (const p of Object.keys(v)) auditKeywords(v[p], where + '/patternProperties/' + p, out);
    else if (k === 'items' || k === 'additionalProperties') { if (typeof v === 'object') auditKeywords(v, where + '/' + k, out); }
    else if (k === 'oneOf' || k === 'anyOf') v.forEach((s, i) => auditKeywords(s, where + '/' + k + '/' + i, out));
  }
  return out;
}

function resolve(root, ref) {
  if (!ref.startsWith('#/')) throw new Error('only local $ref is supported: ' + ref);
  let node = root;
  for (const part of ref.slice(2).split('/')) {
    node = node[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (node === undefined) throw new Error('unresolvable $ref: ' + ref);
  }
  return node;
}

function validate(schema, inst, root, at) {
  const errs = [];
  const push = (m) => errs.push((at || '(root)') + ': ' + m);

  if ('$ref' in schema) return validate(resolve(root, schema.$ref), inst, root, at);

  if ('type' in schema) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some(t => typeMatches(inst, t)))
      push('expected type ' + types.join('|') + ', got ' + typeOf(inst));
  }
  if ('const' in schema && !deepEqual(inst, schema.const))
    push('expected the constant ' + JSON.stringify(schema.const) + ', got ' + JSON.stringify(inst));
  if ('enum' in schema && !schema.enum.some(e => deepEqual(inst, e)))
    push('value ' + JSON.stringify(inst) + ' is not one of ' + JSON.stringify(schema.enum));
  if ('pattern' in schema && typeof inst === 'string' && !new RegExp(schema.pattern).test(inst))
    push('string ' + JSON.stringify(inst) + ' does not match ' + schema.pattern);
  if ('format' in schema && typeof inst === 'string' && schema.format === 'date' && !DATE_RE.test(inst))
    push('string ' + JSON.stringify(inst) + ' is not a valid date (format: date, expected YYYY-MM-DD)');

  if (typeof inst === 'string') {
    if ('minLength' in schema && inst.length < schema.minLength) push('string is shorter than minLength ' + schema.minLength);
    if ('maxLength' in schema && inst.length > schema.maxLength) push('string is longer than maxLength ' + schema.maxLength);
  }
  if (typeof inst === 'number') {
    if ('minimum' in schema && inst < schema.minimum) push(inst + ' is below the minimum ' + schema.minimum);
    if ('maximum' in schema && inst > schema.maximum) push(inst + ' is above the maximum ' + schema.maximum);
    if ('exclusiveMinimum' in schema && inst <= schema.exclusiveMinimum) push(inst + ' is not above ' + schema.exclusiveMinimum);
    if ('exclusiveMaximum' in schema && inst >= schema.exclusiveMaximum) push(inst + ' is not below ' + schema.exclusiveMaximum);
  }

  if (Array.isArray(inst)) {
    if ('minItems' in schema && inst.length < schema.minItems) push('array has ' + inst.length + ' item(s), minimum ' + schema.minItems);
    if ('maxItems' in schema && inst.length > schema.maxItems) push('array has ' + inst.length + ' item(s), maximum ' + schema.maxItems);
    if ('items' in schema) inst.forEach((v, i) => errs.push(...validate(schema.items, v, root, (at || '') + '[' + i + ']')));
  }

  if (inst && typeof inst === 'object' && !Array.isArray(inst)) {
    const keys = Object.keys(inst);
    for (const r of schema.required || []) if (!keys.includes(r)) push('missing required key "' + r + '"');
    if (schema.dependentRequired)
      for (const k of Object.keys(schema.dependentRequired))
        if (keys.includes(k)) for (const dep of schema.dependentRequired[k])
          if (!keys.includes(dep)) push('key "' + k + '" requires "' + dep + '"');
    const props = schema.properties || {};
    const pp = schema.patternProperties || {};
    for (const k of keys) {
      if (k in props) { errs.push(...validate(props[k], inst[k], root, (at || '') + '.' + k)); continue; }
      const patterns = Object.keys(pp).filter(re => new RegExp(re).test(k));
      if (patterns.length) { for (const re of patterns) errs.push(...validate(pp[re], inst[k], root, (at || '') + '.' + k)); continue; }
      if (schema.additionalProperties === false) push('unknown key "' + k + '" (the manifest is CLOSED)');
      else if (typeof schema.additionalProperties === 'object')
        errs.push(...validate(schema.additionalProperties, inst[k], root, (at || '') + '.' + k));
    }
  }

  if ('anyOf' in schema && !schema.anyOf.some(s => validate(s, inst, root, at).length === 0))
    push('matched none of the ' + schema.anyOf.length + ' anyOf alternatives');
  if ('oneOf' in schema) {
    const hits = schema.oneOf.map(s => validate(s, inst, root, at)).filter(e => e.length === 0).length;
    if (hits !== 1) push('matched ' + hits + ' of the ' + schema.oneOf.length + ' oneOf alternatives (exactly 1 required)');
  }
  return errs;
}

// ── load the schema ─────────────────────────────────────────────────────────
let schema;
try { schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')); }
catch (e) { console.error('cannot read ' + SCHEMA_REL + ': ' + e.message); process.exit(1); }

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema')
  fail(SCHEMA_REL + ' — $schema must name the 2020-12 dialect (found ' + JSON.stringify(schema.$schema) + ')');
const unknown = auditKeywords(schema, '#', []);
if (unknown.length) {
  fail(SCHEMA_REL + ' uses ' + unknown.length + ' keyword(s) this validator does not implement:\n'
     + unknown.map(u => '        ' + u).join('\n'));
} else {
  ok(SCHEMA_REL + ' — 2020-12, ' + Object.keys(schema.$defs || {}).length + ' definitions, every keyword implemented');
}

// ── the five assertions over one parsed manifest ────────────────────────────
// Returns { errors: [fatal strings], notices: [non-fatal strings] }.
// `pair` is { fd: path|null, svg: path|null } when the manifest was found in
// the tree beside a `.fd`; omitted for a fixture, which is checked in
// isolation (schema + cross-field rules only — assertion B needs a real pair).
function checkManifest(json, pair) {
  const errors = [];
  const notices = [];

  // Assertion A — parses (caller already parsed it to get here) and version known.
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    errors.push('A: the manifest is not a JSON object');
    return { errors, notices };
  }
  if (json.figdown_manifest !== '1')
    errors.push('A: unknown or missing "figdown_manifest" version (found ' + JSON.stringify(json.figdown_manifest) + ')');

  // Schema validation — SHAPE, including assertion E's "unknown key fails" half.
  for (const e of validate(schema, json, schema, '')) errors.push('SCHEMA: ' + e);

  // Assertion E, second half — a well-formed extension key is REPORTED, never
  // an error (MANIFEST-EXTENSION-NAMESPACE duty 2: always reportable). The presence of any `x-` key is
  // a statement that this manifest carries information the profile does not
  // describe, and a consumer MUST be able to tell its user so — which is why
  // this is a notice and not silence. An `x-` key that names no owner is a
  // different thing: MANIFEST-EXTENSION-NAMESPACE rule (a) rules the spelling `x-<owner>-<key>`, so
  // `x-status` is not an extension key, it is an unknown key with a
  // misleading prefix, and it gets the named reason here in addition to the
  // schema's own message.
  const XKEY = /^x-[^-]+(-[^-]+)+$/;
  (function walkX(node, at) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((v, i) => walkX(v, at + '[' + i + ']')); return; }
    for (const k of Object.keys(node)) {
      if (/^x-/.test(k)) {
        if (XKEY.test(k))
          notices.push('E: ' + (at || '(root)') + '.' + k + ' — delegated extension key (MANIFEST-EXTENSION-NAMESPACE): ' +
            'this manifest carries information the profile does not describe');
        else
          errors.push('E: ' + (at || '(root)') + '.' + k + ' — an extension key is spelled ' +
            'x-<owner>-<key> (MANIFEST-EXTENSION-NAMESPACE); "' + k + '" names no owner, and two publishers would ' +
            'collide on it silently');
      }
      walkX(node[k], (at || '') + '.' + k);
    }
  })(json, '');

  // Assertion D — every provenance entry has a relation AND at least one locator.
  if (Array.isArray(json.provenance)) {
    json.provenance.forEach((p, i) => {
      if (!p || typeof p !== 'object') return;
      const hasLocator = ['section', 'figure', 'locator', 'bbox'].some(k => k in p);
      if (!hasLocator)
        errors.push('D: provenance[' + i + '] (relation ' + JSON.stringify(p.relation) +
          ') carries no locator field — needs at least one of section, figure, locator, bbox');
    });
  }

  // Assertion C — hash binding. Well-formedness is the schema's `pattern`;
  // STALE/UNBOUND is a cross-field comparison the schema cannot express.
  function checkBinding(block, label) {
    if (!block || typeof block !== 'object') return;
    if (!('of_source_sha256' in block)) {
      notices.push('C: ' + label + '.of_source_sha256 absent — UNBOUND (reported, not fatal)');
      return;
    }
    if (json.source && typeof json.source.sha256 === 'string' &&
        typeof block.of_source_sha256 === 'string' &&
        block.of_source_sha256 !== json.source.sha256) {
      errors.push('C: ' + label + '.of_source_sha256 differs from source.sha256 — STALE (fatal): ' +
        'the figure changed after ' + label + ' was set, so the claim has no subject left');
    }
  }
  checkBinding(json.review, 'review');
  checkBinding(json.accessibility, 'accessibility');

  // Assertion B — restatement against the paired .fd / .svg.
  if (pair) {
    if (!pair.fd) {
      errors.push('B: no paired .fd found beside the manifest — restated fields cannot be verified');
    } else {
      const bytes = fs.readFileSync(pair.fd);
      const sha = crypto.createHash('sha256').update(bytes).digest('hex');
      if (json.source && json.source.sha256 && json.source.sha256 !== sha)
        errors.push('B: source.sha256 (' + json.source.sha256 + ') does not match the paired .fd (' + sha + ')');
      if (json.source && typeof json.source.bytes === 'number' && json.source.bytes !== bytes.length)
        errors.push('B: source.bytes (' + json.source.bytes + ') does not match the paired .fd (' + bytes.length + ' bytes)');

      // The declared language version: the FIRST `figdown X.Y genre` header,
      // by document order — the same "first section speaks for the whole
      // restated field" convention ACCESSIBILITY-PROFILE states for the non-visual <title>.
      const text = bytes.toString('utf8');
      const headers = [...text.matchAll(/^figdown\s+(\d+\.\d+)\s+\S+/gm)];
      if (headers.length && json.language && json.language.version) {
        if (headers.length > 1)
          notices.push('B: ' + path.relative(ROOT, pair.fd) + ' is multi-section (' + headers.length +
            ' headers) — language.version is checked against the FIRST section only; this is the ruled, ' +
            'permanent behaviour (MANIFEST-OPEN-VOCABULARIES), not a placeholder — per-section version restatement stays a ' +
            'separate, reopenable question (figdown-manifest.md §7)');
        if (json.language.version !== headers[0][1])
          errors.push('B: language.version (' + json.language.version + ') does not match the .fd\'s first declared header (' + headers[0][1] + ')');
      }
    }
    if (!pair.svg) {
      errors.push('B: no paired .svg found beside the manifest — renderer fields cannot be verified');
    } else {
      const svg = fs.readFileSync(pair.svg, 'utf8');
      const mEngine = /data-engine-version="([^"]*)"/.exec(svg);
      const mOpts = /data-render-options="([^"]*)"/.exec(svg);
      const mSha = /data-sha256="([^"]*)"/.exec(svg);
      if (json.renderer && json.renderer.engine_version && mEngine && json.renderer.engine_version !== mEngine[1])
        errors.push('B: renderer.engine_version (' + json.renderer.engine_version + ') does not match the artifact\'s data-engine-version (' + mEngine[1] + ')');
      if (json.renderer) {
        const declared = json.renderer.render_options;
        const artifact = mOpts ? mOpts[1] : undefined;
        if (declared !== artifact && !(declared === undefined && artifact === undefined))
          errors.push('B: renderer.render_options (' + JSON.stringify(declared) + ') does not match the artifact\'s data-render-options (' + JSON.stringify(artifact) + ')');
      }
      if (json.source && json.source.sha256 && mSha && json.source.sha256 !== mSha[1])
        errors.push('B: source.sha256 (' + json.source.sha256 + ') does not match the artifact\'s own data-sha256 (' + mSha[1] + ') — artifact and manifest disagree about the source hash');
    }
  }

  return { errors, notices };
}

// ── discover manifests in the tree ──────────────────────────────────────────
const SKIP_DIR = new Set(['.git', 'node_modules', 'dist', 'archive', 'conformance']);
function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (p === FIXTURES) continue; // fixtures are checked separately, by name
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.manifest.json')) out.push(p);
  }
}
const found = [];
walk(ROOT, found);
found.sort();

console.log('');
console.log('MANIFESTS  ' + found.length + ' found under the tree (excluding tools/manifest-fixtures/)');
if (!found.length) {
  console.log('  0 manifests found — the profile is optional (figdown-manifest.md §2.3: absence asserts');
  console.log('  nothing), so an empty corpus is not a gate failure.');
} else {
  for (const f of found) {
    const rel = path.relative(ROOT, f);
    const base = f.slice(0, -'.manifest.json'.length);
    const fdPath = base + '.fd', svgPath = base + '.svg';
    let json;
    try { json = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { fail(rel + ' — not JSON: ' + e.message); continue; }
    const pair = { fd: fs.existsSync(fdPath) ? fdPath : null, svg: fs.existsSync(svgPath) ? svgPath : null };
    const { errors, notices } = checkManifest(json, pair);
    for (const n of notices) note(rel + '  ' + n);
    if (errors.length) fail(rel + ' —\n' + errors.map(e => '        ' + e).join('\n'));
    else ok(rel);
    if (verbose) console.log('  ' + rel + ': ' + errors.length + ' error(s), ' + notices.length + ' notice(s)');
  }
}

// ── the fixture suite ───────────────────────────────────────────────────────
console.log('');
if (!fs.existsSync(FIXTURES)) {
  fail('missing tools/manifest-fixtures/ — without fixtures, a passing gate proves nothing');
} else {
  const validNames = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.valid.json')).sort();
  const invalidNames = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.invalid.json')).sort();
  if (validNames.length < 1) fail('tools/manifest-fixtures/ holds no *.valid.json — at least one fully-populated valid manifest is required');
  if (invalidNames.length < 8) fail('tools/manifest-fixtures/ holds ' + invalidNames.length + ' invalid fixture(s); at least 8 are required '
    + '(unknown key, elements block, bad relation, no locator, malformed hash, STALE binding, bad version, bbox without page/unit)');

  let validPassed = 0;
  for (const n of validNames) {
    const rel = 'tools/manifest-fixtures/' + n;
    let json;
    try { json = JSON.parse(fs.readFileSync(path.join(FIXTURES, n), 'utf8')); }
    catch (e) { fail(rel + ' — not JSON: ' + e.message); continue; }
    const { errors } = checkManifest(json, null);
    if (errors.length) fail(rel + ' was REJECTED but is meant to be VALID:\n' + errors.map(e => '        ' + e).join('\n'));
    else { validPassed++; if (verbose) ok(rel); }
  }

  let invalidPassed = 0;
  for (const n of invalidNames) {
    const rel = 'tools/manifest-fixtures/' + n;
    const whyPath = path.join(FIXTURES, n.replace(/\.invalid\.json$/, '.why.txt'));
    if (!fs.existsSync(whyPath)) { fail(rel + ' has no .why.txt — a control must record WHAT it is a control for'); continue; }
    const why = fs.readFileSync(whyPath, 'utf8').trim().split('\n');
    const wanted = why[why.length - 1].trim();
    let json;
    try { json = JSON.parse(fs.readFileSync(path.join(FIXTURES, n), 'utf8')); }
    catch (e) { fail(rel + ' — not JSON: ' + e.message); continue; }
    const { errors } = checkManifest(json, null);
    if (!errors.length) { fail(rel + ' was ACCEPTED — the verifier does not catch ' + JSON.stringify(wanted)); continue; }
    const joined = errors.join('\n');
    if (!joined.includes(wanted)) {
      fail(rel + ' was rejected for the WRONG reason\n        expected to contain: ' + wanted + '\n        actual:\n' + errors.map(e => '          ' + e).join('\n'));
      continue;
    }
    invalidPassed++;
    if (verbose) ok(rel + ' → rejected: ' + errors.find(e => e.includes(wanted)));
  }

  console.log('FIXTURES  ' + validPassed + '/' + validNames.length + ' valid fixture(s) accepted, ' +
    invalidPassed + '/' + invalidNames.length + ' invalid fixture(s) rejected for their recorded reason');
}

// ── report ──────────────────────────────────────────────────────────────────
console.log('');
console.log('SCHEMA  ' + SCHEMA_REL);
console.log('  ' + found.length + ' manifest(s) found in the tree');
console.log('  ' + failures + ' failure(s)');
if (failures && strict) process.exit(1);
if (failures) console.log('(not --strict: reporting only)');
