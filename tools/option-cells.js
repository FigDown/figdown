'use strict';
/**
 * option-cells.js — axis G of gate:capability. The "Option keys" cell of every
 * keyword row in the genre vocabulary tables, checked against the engine.
 *
 * WHY: nothing compared those cells with anything. Dropping `note`
 * from the `lifeline` row, or deleting the zh `lifeline` row, kept every gate
 * green. A diff of the cells against the engine's DIRECTIVE_OPTS gives rows of
 * noise (keys that exist there only so a retirement message can fire), so the
 * oracle is a PROBE: take a line the corpus already parses clean, append
 * `<key>=1`, and read what the option stage says.
 *
 *   refused   the line reports `does not take|accept <key>=`, `unknown
 *             option`, `has no interior`, or `<key>= retired`
 *   accepted  the line does not
 *   indet     the same line with `zork=1` is NOT answered `unknown option
 *             "zork="` — the command stage stopped before the option stage, so
 *             nothing can be said (reported as a count, never a pass)
 *
 * Checked, per genre document and per keyword row:
 *   1. every key the cell LISTS is not refused (a documented key the engine
 *      refuses);
 *   2. every key the engine accepts on that line is listed (an accepted key
 *      the table omits);
 *   3. the zh-tw twin has the same keyword rows with the same listed keys.
 * Rows whose Form is a cross-reference ("see §4") list nothing by design and
 * are skipped; the opener's own row in its genre document is the checked one.
 * Listed keys are the bare backticked words with bold prose and `key=`
 * mentions removed, so retirement history inside a cell is not a claim.
 */
const fs = require('fs');
const path = require('path');

const REFUSED = /does not (take|accept)|not accepted|unknown option|has no interior|is retired|[a-z]= retired|WITHDRAWN|has been (retired|renamed)/;

const DOCS = ['block', 'bitfield', 'table', 'experimental/flowchart', 'experimental/sequence',
  'experimental/statechart', 'experimental/timing', 'experimental/topology'];

function walk(d, o) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, o); else if (/\.fd$/.test(f.name)) o.push(p);
  }
  return o;
}

function splitRow(l) {
  return l.replace(/\\\|/g, '\u0001').split('|').slice(1, -1)
    .map(x => x.trim().replace(/\u0001/g, '|'));
}

// rows of the "Keyword | Form | … | Option keys" table: [{kws, form, keys}]
function rows(md) {
  const out = []; let hdr = null;
  for (const l of md.split(/\r?\n/)) {
    if (/^\| (Keyword|關鍵字) \|/.test(l) && /Option keys|選項鍵/.test(l)) { hdr = splitRow(l); continue; }
    if (!/^\|/.test(l)) { hdr = null; continue; }
    if (!hdr) continue;
    const c = splitRow(l);
    if (/^:?-+:?$/.test(c[0])) continue;
    const oi = hdr.findIndex(h => /Option keys|選項鍵/.test(h));
    const kws = [...c[0].matchAll(/`([^`\s]+)`/g)].map(m => m[1]);
    const cell = (c[oi] || '').replace(/\*\*[^*]*\*\*/g, ' ').replace(/\(requires[^)]*\)/g, ' ');
    const keys = new Set([...cell.matchAll(/`([a-z][\w-]*)`(?!=)/g)].map(m => m[1]));
    out.push({ kws, form: c[1] || '', keys });
  }
  // "same as `node`" (zh-tw flowchart): a cell naming one other ROW stands for that row's keys
  for (const r of out) {
    if (r.keys.size !== 1) continue;
    const [k] = r.keys;
    const src = out.find(o => o !== r && o.kws.includes(k) && o.keys.size > 1);
    if (src) r.keys = new Set(src.keys);
  }
  return out;
}

function check(engine, root) {
  const findings = [];
  const strip = l => l.replace(/\s+#.*$/, '');
  // templates: first clean line per (genre, keyword)
  const tpl = {};
  for (const f of walk(path.join(root, 'examples'), [])) {
    const L = fs.readFileSync(f, 'utf8').split('\n');
    const h = L.findIndex(x => /^figdown\s/.test(x));
    const m = h < 0 ? null : /^figdown\s+(\S+)\s+(\w+)/.exec(L[h]);
    if (!m || engine.parse(L.join('\n')).errs.length) continue;
    L.forEach((l, i) => {
      const t = l.trim(), k = t.split(/\s+/)[0];
      if (i <= h || !k || t[0] === '#') return;
      const key = m[2] + '|' + k;
      if (!tpl[key]) tpl[key] = { L, i, h, g: m[2] };
    });
  }
  const errsFor = (g, kw, k) => {
    const t = tpl[g + '|' + kw]; if (!t) return null;
    const L = t.L.slice();
    L[t.h] = 'figdown 0.5 ' + t.g;
    L[t.i] = strip(L[t.i]) + (new RegExp('\\s' + k + '=').test(L[t.i]) ? '' : ' ' + k + '=1');
    const r = engine.parse(L.join('\n'));
    return r.errs.filter(x => x.startsWith('Line ' + (t.i + 1) + ':'));
  };
  const state = (g, kw, k) => {
    const z = errsFor(g, kw, 'zork');
    if (!z) return 'notpl';
    if (!z.some(x => /unknown option "zork="/.test(x))) return 'indet';
    return errsFor(g, kw, k).some(x => REFUSED.test(x) && x.includes(k + '=')) ? 'refused' : 'accepted';
  };
  const dop = /const DIRECTIVE_OPTS=(\{[\s\S]*?\n\});/.exec(engine.src);
  if (!dop) throw new Error('engine drift: cannot read DIRECTIVE_OPTS — update option-cells.js');
  const allKeys = [...new Set(Object.values(new Function('return ' + dop[1])()).flat())];

  let probed = 0, indet = 0, notpl = 0, nrows = 0, zhRows = 0;
  for (const d of DOCS) {
    const g = path.basename(d);
    const en = rows(fs.readFileSync(path.join(root, 'spec/genres', d + '.md'), 'utf8'));
    const zhp = path.join(root, 'spec/genres', d + '');
    const zh = fs.existsSync(zhp) ? rows(fs.readFileSync(zhp, 'utf8')) : null;
    if (en.length < 2) throw new Error('spec drift: ' + d + '.md has ' + en.length + ' keyword rows — update option-cells.js');
    if (zh) zhRows += en.length;
    const zmap = zh && new Map(zh.map(r => [r.kws.join(' '), r]));
    for (const r of en) {
      if (/^see §/.test(r.form)) continue;
      nrows++;
      if (zmap) {
        const z = zmap.get(r.kws.join(' '));
        if (!z) findings.push(d + ': no row for `' + r.kws.join('` `') + '` (the en row exists)');
        else if ([...r.keys].sort().join() !== [...z.keys].sort().join())
          findings.push(d + ': `' + r.kws.join('` `') + '` lists [' + [...r.keys].sort() +
            '] in en but [' + [...z.keys].sort() + '] in zh-tw');
      }
      for (const kw of r.kws) {
        if (kw === 'figdown' || kw === '|') continue;
        const probeKeys = new Set([...r.keys, ...allKeys]);
        for (const k of probeKeys) {
          const s = state(g, kw, k);
          if (s === 'notpl') { notpl++; break; }
          if (s === 'indet') { indet++; continue; }
          probed++;
          if (r.keys.has(k) && s === 'refused')
            findings.push(d + ': `' + kw + '` row lists `' + k + '` but the engine refuses it');
          if (!r.keys.has(k) && s === 'accepted')
            findings.push(d + ': `' + kw + '` row omits `' + k + '`, which the engine accepts');
        }
      }
    }
    if (zh) for (const z of zh) if (!/^see |^見/.test(z.form) && !en.some(r => r.kws.join(' ') === z.kws.join(' ')))
      findings.push(d + ': row `' + z.kws.join('` `') + '` has no en counterpart');
  }
  return { findings, probed, indet, notpl, nrows, zhRows };
}

module.exports = { check, rows };
