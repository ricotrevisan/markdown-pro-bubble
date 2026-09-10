import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compileCallbacks, createHarness, loadCallbacks } from '@rico/bubble-element-test-harness';
const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');
const source = async element => Object.fromEntries(await Promise.all(['initialize', 'update', 'reset'].map(async name => [name, await read(`src/elements/${element}/${name}.js`)])));

test('decoded callbacks compile with shared signatures, including actual highlight action', async () => {
  const bodies = await source('md-to-html');
  const callbacks = compileCallbacks({ ...bodies, actions: { highlight: await read('src/elements/md-to-html/actions/highlight-code.js') } });
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
  const bodies = await source('deprecated-tw-typography');
  for (const body of Object.values(bodies)) assert.equal(body.trim(), '');
  const h = createHarness({ callbacks: compileCallbacks(bodies), canvas: [] });
  h.instance.data.sentinel = 'retained';
  h.initialize(); h.update({}); h.reset();
  assert.equal(h.instance.data.sentinel, 'retained');
  assert.deepEqual(h.history, []);
});

test('metadata outputs and explicit option spelling discrepancies stay reviewable', async () => {
  const metadata = JSON.parse(await read('src/elements/md-to-html/AAC.json'));
  assert.deepEqual(Object.values(metadata.states).map(s => [s.name, s.value]), [['html', 'text']]);
  assert.deepEqual(Object.values(metadata.events).map(e => e.name), ['md_converted']);
  assert.equal(metadata.actions.AAX.caption, 'Highlight code');
  const names = Object.values(metadata.fields).map(f => f.name);
  const update = (await source('md-to-html')).update;
  const consumed = [...new Set([...update.matchAll(/properties\.(\w+)/g)].map(m => m[1]))];
  assert.deepEqual(consumed.filter(name => !names.includes(name)).sort(), ['parseimgdimensions', 'simplelinebreaks', 'smoothlivepreview']);
});

test('headers, local dependencies and fixture theme subset retain production versions', async () => {
  const shared = await read('src/shared.html');
  const headers = await read('src/elements/md-to-html/headers.html');
  const pkg = JSON.parse(await read('package.json')).devDependencies;
  for (const [alias, dep] of [['highlight.js', 'highlight.js'], ['showdown', 'showdown'], ['showdownKatex', 'showdown-katex'], ['katex', 'katex']]) {
    assert.ok(shared.includes(`https://esm.sh/${dep}@${pkg[dep]}`), alias);
  }
  assert.equal(pkg['highlight-styles'], 'npm:highlight.js@11.7.0');
  assert.equal(pkg['katex-header'], 'npm:katex@0.16.9');
  assert.ok(headers.includes('katex@0.16.9/dist/katex.min.css'));
  const metadata = JSON.parse(await read('src/elements/md-to-html/AAC.json'));
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
