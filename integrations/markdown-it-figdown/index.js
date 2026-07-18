'use strict';
// markdown-it-figdown — render ```figdown fences as inline SVG.
//
// CommonJS, no bundler needed. In this repository it loads the generated
// UMD build from ../../dist; the published npm version will instead
// depend on the `figdown` package (require('figdown')).
const figdown = require('../../dist/figdown.js');

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = function figdownPlugin(md) {
  const defaultFence = md.renderer.rules.fence
    || function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = (token.info || '').trim().split(/\s+/)[0];
    if (info !== 'figdown') return defaultFence(tokens, idx, options, env, self);
    // Never throw: a broken figure must not take down the whole page.
    try {
      const { svg, errors } = figdown.render(token.content);
      if (errors.length) {
        return '<pre class="figdown-error">' + escapeHtml(errors.join('\n')) + '</pre>\n';
      }
      return '<div class="figdown">' + svg + '</div>\n';
    } catch (e) {
      return '<pre class="figdown-error">' + escapeHtml('figdown: ' + e.message) + '</pre>\n';
    }
  };
};
