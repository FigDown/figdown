#!/usr/bin/env node
'use strict';
// Dependency-free test for markdown-it-figdown: drives the plugin through
// a minimal markdown-it shim implementing just the fence-rule surface the
// plugin touches (renderer.rules.fence, token {info, content}, self.renderToken).
const assert = require('assert');
const figdownPlugin = require('./index.js');

// ---- 15-line markdown-it shim ----
function makeMd() {
  const md = { renderer: { rules: {} } };
  md.use = function (plugin) { plugin(md); return md; };
  md.render = function (src) {
    const out = [];
    const re = /```([^\n]*)\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const tokens = [{ type: 'fence', info: m[1], content: m[2] }];
      const self = { renderToken: () => '<pre><code>' + tokens[0].content + '</code></pre>\n' };
      out.push(md.renderer.rules.fence(tokens, 0, {}, {}, self));
    }
    return out.join('');
  };
  return md;
}

const md = makeMd().use(figdownPlugin);

const doc = [
  'Some prose.',
  '',
  '```figdown',
  'figdown 0.1 topology',
  'node a "Alpha"',
  'node b "Beta"',
  'edge a -- b',
  '```',
  '',
  '```figdown',
  'figdown 0.1 topology',
  'bogus line here',
  '```',
  '',
  '```js',
  'console.log("untouched");',
  '```',
  '',
].join('\n');

const html = md.render(doc);

assert(html.includes('<div class="figdown"><svg'), 'valid fence renders inline SVG');
assert(html.includes('Alpha'), 'SVG contains node label');
assert(html.includes('<pre class="figdown-error">'), 'broken fence renders error block');
assert(/Line 2: [^<]*bogus/.test(html), 'error block carries the Line N message');
assert(html.includes('console.log(&quot;untouched&quot;)') || html.includes('console.log("untouched")'),
  'non-figdown fences fall through to the default renderer');
assert(!html.includes('<svg') || html.indexOf('<svg') < html.indexOf('figdown-error'),
  'error fence did not produce an SVG');

console.log('OK  markdown-it-figdown: svg present, error block present, other fences untouched');
