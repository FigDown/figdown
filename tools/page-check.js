#!/usr/bin/env node
// page-check — the editor page must actually load in a browser.
//
// The single-file engine embeds its built-in examples in JS template
// literals. A backtick (or ${) in example text ends the literal and the
// page dies with a SyntaxError — while every Node tool keeps working,
// because the loaders slice out `const SHAPES` … `// 3. UI` and never see
// the rest of the file. That blind spot shipped a broken editor for a full
// day. This check parses each <script> block of each HTML page given (or
// the standard pair by default) and reports the first syntax error.
//
// Usage: node tools/page-check.js [page.html ...]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pages = process.argv.slice(2);
if (!pages.length) {
  pages.push(path.join(__dirname, '..', 'editor', 'figdown.html'),
             path.join(__dirname, '..', 'skill', 'figdown', 'figdown.html'));
}

let bad = 0;
for (const p of pages) {
  if (!fs.existsSync(p)) { console.log(`${p}  MISSING`); bad++; continue; }
  const html = fs.readFileSync(p, 'utf8');
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { console.log(`${p}  no <script> block`); bad++; continue; }
  let ok = true;
  blocks.forEach((m, i) => {
    // line number of this block's start, so the error points at the file
    const before = html.slice(0, m.index).split('\n').length;
    try { new vm.Script(m[1], { filename: p }); }
    catch (e) {
      ok = false; bad++;
      const rel = Number((/:(\d+)/.exec(String(e.stack).split('\n')[0]) || [])[1]);
      const where = Number.isFinite(rel) ? ` near line ${before + rel}` : '';
      console.log(`${p}  script #${i + 1} FAILS${where}: ${e.message}`);
    }
  });
  if (ok) console.log(`${p}  ok (${blocks.length} script block${blocks.length > 1 ? 's' : ''})`);
}
console.log(bad ? `\n${bad} failure(s)` : '\nall pages parse');
process.exit(bad ? 1 : 0);
