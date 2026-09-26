# Markdown Pro harness CI

Run with Node **24.19.0** (see `.node-version`):

```sh
npm ci
npm ci --prefix lib
npx playwright install --with-deps chromium firefox webkit
npm test
```

`npm test` runs Node contract tests, builds the production runtime bundle
(`lib/dist.js`, see `lib/package.json`), then runs Playwright 1.58.2 in Chromium,
Firefox and WebKit. The server binds only `127.0.0.1:4181` and refuses to reuse
another server. CI uses the same commands. Built bundles, traces and installed
packages are ignored. Source callback compilation is checked.

## Shared seam and package provenance

The consumer uses **@rico/bubble-element-test-harness@0.1.0**, source commit
**49ddc2b** in `ricotrevisan/bubble-plugin-test-harness`. The committed archive is
`vendor/rico-bubble-element-test-harness-0.1.0.tgz`, SHA-256
`717423e3f159b72923afac5338f8d52f1c5b4213b89e1674d97fce2d640d3fdd`.
It is the exact validated archive used by the Tiptap consumer at **20406fb**.
The dependency is a relative `file:` tarball; the lockfile records its integrity.
Neither installation nor CI reads another checkout or a workstation path.

To upgrade, validate a new version in the shared repository (unit, declaration,
and package tests), obtain its versioned `npm pack` archive, record its source
commit and SHA-256 here, and install with
`npm install --save-dev --save-exact ./vendor/<new-archive>.tgz`.
Commit archive, manifest, lockfile and provenance together; run a clean `npm ci`
and the full browser matrix. Never replace the bytes of an adopted version.
No shared source was modified and no package was published for this adoption.

The harness loads actual decoded initialize/update/reset/action bodies in the
browser realm with the shared callback signatures. It supplies persistent
per-instance data and publication/event snapshots. Canvas is an explicit array
containing an actual DOM element (this adapter never accesses it); context is
explicitly empty. No Bubble methods, expression evaluation, schema defaults,
workflow persistence or scheduling are fabricated. Compilation uses `new Function`
and only trusted local source. The fixture awaits callback loading and runtime
readiness. Publications/events are synchronous in this adapter.

## Runtime fidelity

The fixture loads the same `lib/dist.js` that is uploaded to Bubble, built from
`lib/index.js` with Showdown 2.1.0, Highlight.js 11.11.1, showdown-katex 0.8.0 and
KaTeX 0.16.21. A clean `lib/` build is byte-identical to the live asset
`//meta-q.cdn.bubble.io/f1780515404463x610209362129781900/dist.js`
(SHA-256 `9d53bc0b29533484b15432cc5a035da3a25cb3417f50bf3f5cb53d09eeb8792b`).
As in the production header, only KaTeX 0.16.9 CSS/fonts and Highlight.js 11.7.0
theme CSS come from separate files. These versions differ from the README's older
summary. The extension's published browser build embeds its own older KaTeX;
setting `window.katex` does not replace that internal renderer. Tests do not
exercise Bubble's CDN, `defer` timing or header loading order.

`lib/.npmrc` uses `legacy-peer-deps=true` because showdown-katex declares a Showdown
1.x peer range while the plugin explicitly uses 2.1.0. This reproduces the current
plugin combination rather than silently upgrading dependencies. `npm audit`
reported six findings (three low, three moderate) in this retained dependency
tree, including old KaTeX/Showdown and the extension's jsdom chain. Dependency
modernization is outside this adoption; these fixtures use controlled inputs.

Fixture-owned link nodes preserve titles/rel/disabled attributes for Default,
Github and Monokai and load real local CSS. Contract tests compare the full theme
catalog against metadata. Browser tests fail on remote requests, HTTP failures
and uncaught page errors. They do not contact CDNs. Theme assertions establish
attribute mutations; they do not claim that removing a disabled HTML attribute
reliably switches the browser's selected alternate stylesheet set.

## Coverage and established behavior

- HTML publication precedes `md_converted`, event-time HTML is retained across
  updates, and converters/data persist. The element does **not** render HTML;
  the fixture explicitly inserts published output into a separate DOM container.
- Tables, line breaks, strikeout, emoji, reference-image dimensions, new-window
  links, smooth preview and two-space nested lists exercise actual output and
  updates. Inline image dimensions are parsed even when the option is false;
  fragment links remain in the current window even when new-window links are on.
- LaTeX off/on/off/on creates new converters, renders inline/display/AsciiMath,
  and preserves Markdown options. No claim that every documented delimiter or
  every KaTeX command is covered.
- Falsy Markdown is published unchanged (`''`, `null`, `undefined`, `0`, `false`);
  truthy non-string values throw. Invalid/missing style names throw before
  publication, and quotes can cause selector syntax errors. These tests record
  the actual adapter contract, not an invented normalization policy.
- Separate instances retain separate converters/publications. `window.showdownJS`
  points to the last **created** converter, not necessarily the last updated one.
  The Highlight code action calls real `hljs.highlightAll()` across both output
  containers and does not republish highlighted HTML.
- Shared theme interference is reproduced: A selects Github, B selects Monokai;
  both theme links can remain enabled because each instance only disables its
  own cached previous theme. Repeating A's update or resetting does not repair
  this. No isolation guarantee or new global theme ownership policy is imposed.
- Three consumed property names (`simplelinebreaks`, `smoothlivepreview`,
  `parseimgdimensions`) differ from metadata camel casing. Both the discrepancy
  and missing alias behavior are asserted. Bubble's actual property-key mapping
  must be verified before changing this longstanding contract.
- Both reset bodies are empty and tested as no-ops: no teardown, state clearing,
  stylesheet cleanup or destruction is invented. Deprecated typography's empty
  initialize/update/reset get proportionate Node contract coverage. Its remote
  Tailwind header is not loaded or tested. The external HTML-to-Markdown API and
  plugin-level actions are outside this element-harness scope.

No production source bug was fixed in this adoption: shared-theme interference,
property spelling and global converter behavior are recorded explicitly.
`AAC.json` and `dist/plugin.json` contain older embedded callback bodies; tests
intentionally execute decoded `src/elements/.../*.js`, the specified source of
truth. No Pled rebuild/upload was performed or stale generated source overwritten.

## Remaining real-Bubble checks

Verify actual property names and expression values, initial/empty input coercion,
header/module readiness, selected alternate CSS and app CSS interactions,
workflow timing after `md_converted`, repeating-group lifecycle and page-wide
highlighting in a real Bubble app. Check Pled-generated output matches decoded
callbacks before a separately authorized publication. The local skill preflight
found no AGENTS.md or `.plugin_id` in this checkout; no Bubble operations were
attempted. This suite does not establish Bubble persistence or deployment success.

## Adoption verification

On Node 24.19.0, a fresh `npm ci` followed by `npm test` passed **5 contract
checks and 48 browser cases** (16 each in Chromium, Firefox and WebKit).
`npx playwright install chromium firefox webkit` installed the versions required
by the pinned Playwright release; `git diff --check` also passed. GitHub-hosted CI
has been configured but was not remotely run in this local-only task.
