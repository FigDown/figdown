#!/usr/bin/env node
/**
 * schema-check.js — the gate over `spec/figdown-model.schema.json`, the
 * published SHAPE contract for the canonical semantic model (core §12).
 *
 * WHY A SCHEMA AT ALL. §12.2 states the model in prose tables and
 * `conformance/normalize.js` implements it, and until now those were the only
 * two statements of it. A second implementation could read the tables, and a
 * consumer could read the goldens, but nothing MACHINE-READABLE said what the
 * model's shape is — so a consumer wanting to validate a model it was handed
 * had to write the tables out again and hope it read them the same way. The
 * schema is that statement, and this gate is what stops it from drifting away
 * from the engine the day after it is written (v1 exit criterion S1, ADV-7).
 *
 * WHAT IS ASSERTED, on every run:
 *
 *   A. the schema is itself well-formed under the subset below, and uses NO
 *      keyword this validator does not implement (the LANE-ALPHABET-KEY-RESERVATION guard discipline: a
 *      keyword nobody implements is a check nobody performs, and it would pass
 *      silently);
 *   B. every `.model.json` golden — `conformance/cases/` AND
 *      `conformance/experimental/` — validates;
 *   C. every published corpus figure (`examples/`, `figures/`) parses through
 *      the reference engine, projects through `conformance/normalize.js`, and
 *      the resulting model validates. These are documents an AUTHOR wrote
 *      rather than fixtures a suite minted, and they are the half of the
 *      corpus `conformance/run.js` never sees;
 *   D. every NEGATIVE CONTROL in `tools/schema-fixtures/` is REJECTED, and
 *      rejected for the recorded REASON. A schema that accepts everything
 *      passes B and C perfectly, so B and C alone prove nothing; the controls
 *      are what make the assertion mean something.
 *
 * WHY THIS IS NOT FOLDED INTO gate:conformance, whose runner already touches
 * every model. Three reasons, and the third is decisive:
 *   1. different question. `run.js` asks "does the engine still emit the
 *      goldens' BYTES"; this asks "does the model's SHAPE match the published
 *      contract". A byte comparison against a frozen file cannot notice that
 *      the contract is wrong, because the golden IS the contract there.
 *   2. different corpus. This gate's corpus includes `examples/` and
 *      `figures/`, which `run.js` never reads, and five hand-mutated JSON
 *      files that are not FigDown documents at all.
 *   3. `conformance/run.js` is ARCHIVED WITH EACH RELEASE under
 *      `archive/<X.Y>/conformance/` and must stay self-contained there
 *      (core §13.5). Folding this in would drag the schema, this validator and
 *      the negative fixtures into every future frozen partition, for a check
 *      that is about the LIVE contract and not about the frozen bytes.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED. JSON Schema constrains the VALUE, never
 * the encoding: key ORDER, two-space indentation, the single trailing newline
 * and the raw-UTF-8 escaping rule are §12.5's canonical binding and no schema
 * can state them. A model this gate accepts may still fail §12.5's byte
 * comparison. The two tiers are complementary and neither replaces the other.
 *
 * Usage:
 *   node tools/schema-check.js [--strict] [--verbose]
 *     --strict   exit 1 on any failure (CI mode; this is what `npm test` runs)
 *     --verbose  list every file checked
 *
 * No dependencies: the validator below is a minimal JSON Schema 2020-12
 * implementation covering exactly the keyword subset the schema uses.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'spec', 'figdown-model.schema.json');
const SCHEMA_REL = 'spec/figdown-model.schema.json';
const FIXTURES = path.join(__dirname, 'schema-fixtures');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');

let failures = 0;
const fail = (m) => { failures++; console.log('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);

// ── the validator ───────────────────────────────────────────────────────────
//
// The implemented keyword set. Anything in the schema that is not here is a
// HARD ERROR rather than an ignored annotation: silently skipping an unknown
// keyword is how a schema comes to assert less than it appears to.
const ANNOTATIONS = new Set(['$schema', '$id', '$comment', 'title', 'description', '$defs']);
const APPLICATORS = new Set([
  '$ref', 'type', 'const', 'enum', 'pattern',
  'properties', 'required', 'additionalProperties', 'dependentRequired',
  'items', 'minItems', 'maxItems',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'oneOf', 'anyOf',
]);

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;                       // 'number' | 'string' | 'boolean' | 'object'
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

// Walk the schema once and collect every keyword it uses, so an unimplemented
// one is reported by NAME and by LOCATION rather than quietly doing nothing.
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

// Returns an array of error strings; empty means valid. `at` is a JSON-pointer
// -ish address into the INSTANCE, which is what a reader needs to find the
// offending key in a 900-line model.
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
    for (const k of keys) {
      if (k in props) errs.push(...validate(props[k], inst[k], root, (at || '') + '.' + k));
      else if (schema.additionalProperties === false) push('unknown key "' + k + '" (the model is CLOSED)');
      else if (typeof schema.additionalProperties === 'object')
        errs.push(...validate(schema.additionalProperties, inst[k], root, (at || '') + '.' + k));
    }
  }

  if ('anyOf' in schema && !schema.anyOf.some(s => validate(s, inst, root, at).length === 0))
    push('matched none of the ' + schema.anyOf.length + ' anyOf alternatives');
  if ('oneOf' in schema) {
    const hits = schema.oneOf.map(s => validate(s, inst, root, at)).filter(e => e.length === 0).length;
    if (hits !== 1) {
      // Report the alternative that came CLOSEST, or nothing is diagnosable.
      const best = schema.oneOf.map(s => validate(s, inst, root, at))
                               .sort((a, b) => a.length - b.length)[0] || [];
      push('matched ' + hits + ' of the ' + schema.oneOf.length + ' oneOf alternatives (exactly 1 required)' +
           (best.length ? '\n        closest alternative said: ' + best[0] : ''));
    }
  }
  return errs;
}

// ── A. the schema itself ────────────────────────────────────────────────────
let schema;
try { schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')); }
catch (e) { console.error('cannot read ' + SCHEMA_REL + ': ' + e.message); process.exit(1); }

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema')
  fail(SCHEMA_REL + ' — $schema must name the 2020-12 dialect (found ' + JSON.stringify(schema.$schema) + ')');
const unknown = auditKeywords(schema, '#', []);
if (unknown.length) {
  fail(SCHEMA_REL + ' uses ' + unknown.length + ' keyword(s) this validator does not implement — an unimplemented\n'
     + '      keyword asserts NOTHING, so it is refused rather than ignored. Implement it in\n'
     + '      tools/schema-check.js or take it out of the schema:\n'
     + unknown.map(u => '        ' + u).join('\n'));
} else {
  ok(SCHEMA_REL + ' — 2020-12, ' + Object.keys(schema.$defs).length + ' definitions, every keyword implemented');
}

// ── B. the goldens ──────────────────────────────────────────────────────────
function modelsIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.model.json')).sort()
           .map(f => path.join(dir, f));
}
let goldens = 0;
for (const bucket of ['cases', 'experimental']) {
  for (const f of modelsIn(path.join(ROOT, 'conformance', bucket))) {
    const rel = path.relative(ROOT, f);
    let model;
    try { model = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { fail(rel + ' — not JSON: ' + e.message); continue; }
    const errs = validate(schema, model, schema, '');
    if (errs.length) fail(rel + ' does not validate:\n' + errs.slice(0, 6).map(e => '        ' + e).join('\n'));
    else { goldens++; if (verbose) ok(rel); }
  }
}

// ── C. the published corpus ─────────────────────────────────────────────────
// The same projection the goldens are minted through, applied to the figures
// an author actually wrote. `conformance/run.js` never reads these.
function loadEngine() {
  const p = path.join(ROOT, 'editor', 'figdown.html');
  const h = fs.readFileSync(p, 'utf8');
  const start = h.indexOf('const SHAPES');
  const end = h.indexOf('// 3. UI');
  if (start < 0 || end < 0) throw new Error('cannot locate the engine in editor/figdown.html');
  return new Function(h.slice(start, end) + '\nreturn {parse};')();
}
function walkFd(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFd(p, out);
    else if (e.name.endsWith('.fd')) out.push(p);
  }
  return out;
}
let corpus = 0;
try {
  const engine = loadEngine();
  const normalize = require(path.join(ROOT, 'conformance', 'normalize.js'));
  const files = walkFd(path.join(ROOT, 'examples'), []).concat(walkFd(path.join(ROOT, 'figures'), []));
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const p = engine.parse(fs.readFileSync(f, 'utf8'));
    if (p.errs.length) { fail(rel + ' — the published corpus must parse clean: ' + p.errs[0]); continue; }
    const docs = p.docs && p.docs.length ? p.docs : [p.doc];
    const model = docs.length > 1 ? { sections: docs.map(normalize) } : normalize(docs[0]);
    const errs = validate(schema, model, schema, '');
    if (errs.length) fail(rel + ' — its model does not validate:\n' + errs.slice(0, 6).map(e => '        ' + e).join('\n'));
    else { corpus++; if (verbose) ok(rel); }
  }
} catch (e) {
  fail('corpus projection failed: ' + e.message);
}

// ── D. the negative controls ────────────────────────────────────────────────
// Each fixture is a model MUTATED in exactly one way, beside a `.why.txt`
// naming the substring the rejection must contain. Asserting only "it is
// rejected" would pass on a validator that rejects everything.
let controls = 0;
if (!fs.existsSync(FIXTURES)) {
  fail('missing tools/schema-fixtures/ — without the negative controls, B and C prove nothing');
} else {
  const names = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.invalid.json')).sort();
  if (names.length < 5) fail('tools/schema-fixtures/ holds ' + names.length + ' control(s); at least 5 are required '
    + '(wrong type, missing required, unknown field, bad enum, malformed id)');
  for (const n of names) {
    const rel = 'tools/schema-fixtures/' + n;
    const whyPath = path.join(FIXTURES, n.replace(/\.invalid\.json$/, '.why.txt'));
    if (!fs.existsSync(whyPath)) { fail(rel + ' has no .why.txt — a control must record WHAT it is a control for'); continue; }
    const why = fs.readFileSync(whyPath, 'utf8').trim().split('\n');
    const wanted = why[why.length - 1].trim();          // last line: the expected substring
    let model;
    try { model = JSON.parse(fs.readFileSync(path.join(FIXTURES, n), 'utf8')); }
    catch (e) { fail(rel + ' — not JSON: ' + e.message); continue; }
    const errs = validate(schema, model, schema, '');
    if (!errs.length) { fail(rel + ' was ACCEPTED — the schema does not catch ' + JSON.stringify(wanted)); continue; }
    const joined = errs.join('\n');
    if (!joined.includes(wanted)) {
      fail(rel + ' was rejected for the WRONG reason\n        expected to contain: ' + wanted
         + '\n        actual: ' + errs[0]);
      continue;
    }
    controls++;
    if (verbose) ok(rel + ' → rejected: ' + errs[0].split('\n')[0]);
  }
}

// ── report ──────────────────────────────────────────────────────────────────
console.log('');
console.log('SCHEMA  ' + SCHEMA_REL);
console.log('  ' + goldens + ' .model.json golden(s) validate  (conformance/cases + conformance/experimental)');
console.log('  ' + corpus + ' published corpus model(s) validate  (examples/, figures/ — projected through normalize.js)');
console.log('  ' + controls + ' negative control(s) rejected for the recorded reason');
console.log('  ' + failures + ' failure(s)');
if (failures && strict) process.exit(1);
if (failures) console.log('(not --strict: reporting only)');
