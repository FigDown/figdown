# markdown-it-figdown

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin that
renders fenced code blocks with info string `figdown` as inline SVG.

````markdown
```figdown
figdown 0.1 topology
node a "Alpha"
node b "Beta"
edge a -- b
```
````

On parse errors the block is replaced by a
`<pre class="figdown-error">` listing the `Line N: message` errors —
the plugin never throws, so a broken figure cannot break the page build.

## Usage

```js
const md = require('markdown-it')().use(require('markdown-it-figdown'));
const html = md.render(markdownSource);
```

In this repository the plugin loads the engine from `../../dist/figdown.js`
(regenerate it with `node tools/make-lib.js`); the published npm version
will depend on the `figdown` package instead.

## VS Code

VS Code's built-in Markdown preview accepts markdown-it plugins via the
`markdown.markdownItPlugins` extension contribution point: an extension
declares `"markdown.markdownItPlugins": true` in its `package.json` and
returns `md.use(figdownPlugin)` from `extendMarkdownIt` — figdown fences
then render live in the preview.

## Static site generators

Anything that exposes its markdown-it instance works the same way, e.g.
Eleventy (`eleventyConfig.setLibrary('md', md.use(figdownPlugin))`) or
VitePress (`markdown: { config: (md) => md.use(figdownPlugin) }`).
The output is plain inline SVG — no client-side JavaScript is shipped.

## Test

```sh
node test.js
```

Dependency-free: the test drives the plugin through a minimal shim
implementing only the fence-rule surface markdown-it exposes.
