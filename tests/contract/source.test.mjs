import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compileCallbacks, createHarness, loadCallbacks } from '@rico/bubble-element-test-harness';
const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');
const source = async element => Object.fromEntries(await Promise.all(['initialize', 'update', 'reset'].map(async name => [name, await read(`src/elements/${element}/${name}.js`)])));

test('decoded callbacks compile with shared signatures, including actual highlight action', async () => {
  const bodies = await source('md-to-html-AAC');
  const callbacks = compileCallbacks({ ...bodies, actions: { highlight: await read('src/elements/md-to-html-AAC/actions/highlight-code-AAX.js') } });
  assert.equal(callbacks.initialize.length, 2);
  assert.equal(callbacks.update.length, 3);
  assert.equal(callbacks.reset.length, 2);
  assert.equal(callbacks.actions.highlight.length, 3);
  assert.equal(bodies.reset.trim(), '');
  assert.throws(() => compileCallbacks({ ...bodies, update: '{' }), /Cannot compile update/);
  assert.throws(() => compileCallbacks({ ...bodies, actions: { highlight: null } }), /action highlight: expected/);
  await assert.rejects(loadCallbacks({ initialize: '/missing.js' }, async () => new Response('missing', { status: 404 })), /missing.js.*404/);
});

test('deprecated typography callbacks are supplied no-ops, with no invented teardown', async () => {
  const bodies = await source('deprecated-tw-typography-AAO');
  for (const body of Object.values(bodies)) assert.equal(body.trim(), '');
  const h = createHarness({ callbacks: compileCallbacks(bodies), canvas: [] });
  h.instance.data.sentinel = 'retained';
  h.initialize(); h.update({}); h.reset();
  assert.equal(h.instance.data.sentinel, 'retained');
  assert.deepEqual(h.history, []);
});

test('metadata outputs and explicit option spelling discrepancies stay reviewable', async () => {
  const metadata = JSON.parse(await read('src/elements/md-to-html-AAC/AAC.json'));
  assert.deepEqual(Object.values(metadata.states).map(s => [s.name, s.value]), [['html', 'text']]);
  assert.deepEqual(Object.values(metadata.events).map(e => e.name), ['md_converted']);
  assert.equal(metadata.actions.AAX.caption, 'Highlight code');
  const names = Object.values(metadata.fields).map(f => f.name);
  const update = (await source('md-to-html-AAC')).update;
  const consumed = [...new Set([...update.matchAll(/properties\.(\w+)/g)].map(m => m[1]))];
  assert.deepEqual(consumed.filter(name => !names.includes(name)).sort(), ['parseimgdimensions', 'simplelinebreaks', 'smoothlivepreview']);
});

test('headers load the lib runtime bundle, and fixture theme subset retains production versions', async () => {
  assert.equal((await read('src/shared.html')).trim(), '');
  const headers = await read('src/elements/md-to-html-AAC/headers.html');
  const scripts = [...headers.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /^\/\/meta-q\.cdn\.bubble\.io\/f\d+x\d+\/[\w.-]+\.js$/);
  const runtime = JSON.parse(await read('lib/package.json')).dependencies;
  assert.deepEqual(runtime, { 'highlight.js': '11.11.1', katex: '0.16.21', showdown: '2.1.0', 'showdown-katex': '0.8.0' });
  const entry = await read('lib/index.js');
  for (const global of ['hljs', 'showdown', 'showdownKatex', 'katex']) assert.match(entry, new RegExp(`window\\.${global} = `));
  const pkg = JSON.parse(await read('package.json')).devDependencies;
  assert.equal(pkg['highlight-styles'], 'npm:highlight.js@11.7.0');
  assert.equal(pkg['katex-header'], 'npm:katex@0.16.9');
  assert.ok(headers.includes('katex@0.16.9/dist/katex.min.css'));
  const metadata = JSON.parse(await read('src/elements/md-to-html-AAC/AAC.json'));
  const titles = [...headers.matchAll(/title="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(titles, metadata.fields.AAa.options.split(','));
  for (const title of ['Default', 'Github', 'Monokai']) assert.ok(titles.includes(title));
  assert.ok(headers.includes('highlight.js/11.7.0/styles/default.min.css'));
});

test('vendored shared package is the validated immutable 0.1.0 archive', async () => {
  const archive = await readFile(new URL('../../vendor/rico-bubble-element-test-harness-0.1.0.tgz', import.meta.url));
  assert.equal(createHash('sha256').update(archive).digest('hex'), '717423e3f159b72923afac5338f8d52f1c5b4213b89e1674d97fce2d640d3fdd');
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.devDependencies['@rico/bubble-element-test-harness'], 'file:vendor/rico-bubble-element-test-harness-0.1.0.tgz');
});
