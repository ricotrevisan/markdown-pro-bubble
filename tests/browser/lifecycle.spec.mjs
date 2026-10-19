import { test, expect } from '@playwright/test';

const observations = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  observations.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
    errors.push(`Unexpected remote request: ${route.request().url()}`);
    return route.abort();
  });
  await page.goto('/tests/browser/fixture.html');
  await page.waitForFunction(() => window.ready === true);
  expect(errors).toEqual([]);
});

test.afterEach(async ({ page }) => { expect(observations.get(page)).toEqual([]); });

test('publishes before md_converted, renders supplied output, and preserves data across updates/reset', async ({ page }) => {
  const result = await page.evaluate(() => {
    const initial = Object.fromEntries(Object.entries(a.instance.data).filter(([, value]) => typeof value !== 'function'));
    a.update(props({ markdown: '# Alpha\n\n**bold** & <em>raw</em>' }));
    const converter = a.instance.data.converter;
    render(a);
    a.update(props({ markdown: 'Beta' }));
    const history = structuredClone(a.history);
    a.reset();
    return { initial, same: converter === a.instance.data.converter, history, after: a.history, state: a.states.html, canvas: a.instance.canvas[0].innerHTML };
  });
  expect(result.initial).toEqual({ currentStyle: 'Default', stylesheetIsSetup: false, currentLatexEnabled: null });
  expect(result.same).toBe(true);
  expect(result.canvas).toBe('');
  expect(result.history.map(x => x.type)).toEqual(['state', 'event', 'state', 'event']);
  expect(result.history[0]).toMatchObject({ name: 'html', value: '<h1 id="alpha">Alpha</h1>\n<p><strong>bold</strong> &amp; <em>raw</em></p>' });
  expect(result.history[1]).toMatchObject({ name: 'md_converted', states: { html: result.history[0].value } });
  expect(result.history[3].states.html).toBe('<p>Beta</p>');
  expect(result.after).toEqual(result.history);
  expect(result.state).toBe('<p>Beta</p>');
  await expect(page.locator('#outputs h1')).toHaveText('Alpha');
  await expect(page.locator('#outputs strong')).toHaveText('bold');
});

for (const scenario of [
  { option: 'disableForced4SpacesIndentedSublists', markdown: '- parent\n  - child\n  - child2\n- last', selector: 'ul ul' },
  { option: 'tables', markdown: '| A | B |\n| --- | --- |\n| one | two |', selector: 'table', text: 'one' },
  { option: 'simplelinebreaks', markdown: 'one\ntwo', selector: 'br' },
  { option: 'strikethrough', markdown: '~~gone~~', selector: 'del', text: 'gone' },
  { option: 'parseimgdimensions', markdown: '![dot][image]\n\n[image]: /tests/browser/pixel.svg =20x30', selector: 'img[width="20"][height="30"]' },
  { option: 'openLinksInNewWindow', markdown: '[link](/target)', selector: 'a[target="_blank"]' },
]) {
  test(`updates supported ${scenario.option} on/off/on without rebuilding converter`, async ({ page }) => {
    const result = await page.evaluate(s => {
      const matches = [];
      let converter;
      for (const enabled of [true, false, true]) {
        a.update(props({ markdown: s.markdown, [s.option]: enabled }));
        converter ??= a.instance.data.converter;
        const output = render(a);
        matches.push(output.querySelectorAll(s.selector).length);
      }
      return { matches, same: converter === a.instance.data.converter, events: a.events.length };
    }, scenario);
    expect(result).toEqual({ matches: [1, 0, 1], same: true, events: 3 });
  });
}

test('emoji and less visible Showdown options update in both converter paths', async ({ page }) => {
  const result = await page.evaluate(() => {
    const snapshots = [];
    for (const enabled of [false, true, false]) {
      a.update(props({ markdown: ':smile:', emoji: enabled, smoothlivepreview: enabled, disableForced4SpacesIndentedSublists: enabled, latex: enabled }));
      snapshots.push({ html: a.states.html, smooth: a.instance.data.converter.getOption('smoothLivePreview'), sublists: a.instance.data.converter.getOption('disableForced4SpacesIndentedSublists') });
    }
    return snapshots;
  });
  expect(result).toEqual([
    { html: '<p>:smile:</p>', smooth: false, sublists: false },
    { html: '<p>😄</p>', smooth: true, sublists: true },
    { html: '<p>:smile:</p>', smooth: false, sublists: false },
  ]);
});

test('LaTeX off/on/off/on rebuilds converters and preserves Markdown options', async ({ page }) => {
  const result = await page.evaluate(() => {
    const converters = [], snapshots = [];
    for (const latex of [false, true, false, true]) {
      a.update(props({ latex, markdown: '$x^2$\n\n$$y^2$$\n\n~sqrt(4)~\n\n~~gone~~' }));
      converters.push(a.instance.data.converter);
      const output = render(a);
      snapshots.push({ math: output.querySelectorAll('.katex').length, display: output.querySelectorAll('.katex-display').length, strike: output.querySelector('del')?.textContent, event: a.events.at(-1).states.html === a.states.html });
    }
    return { unique: new Set(converters).size, snapshots };
  });
  expect(result.unique).toBe(4);
  expect(result.snapshots).toEqual([false, true, false, true].map(on => ({ math: on ? 3 : 0, display: on ? 1 : 0, strike: 'gone', event: true })));
  await expect(page.locator('#outputs .katex').first()).toBeVisible();
});

test('instances keep converters and publications separate while showdownJS follows creation', async ({ page }) => {
  expect(await page.evaluate(() => {
    const b = make();
    a.update(props({ markdown: '~~A~~', strikethrough: true }));
    const ac = a.instance.data.converter;
    b.update(props({ markdown: '~~B~~', strikethrough: false }));
    const bc = b.instance.data.converter;
    a.update(props({ markdown: '~~A2~~', strikethrough: true }));
    const globalStillB = window.showdownJS === bc;
    b.reset();
    a.update(props({ markdown: '$x$', latex: true }));
    return { separate: ac !== bc && a.instance.data !== b.instance.data, globalStillB, globalNowA: window.showdownJS === a.instance.data.converter, b: b.states.html, aHistory: a.events[1].states.html, bEvents: b.events.length };
  })).toEqual({ separate: true, globalStillB: true, globalNowA: true, b: '<p>~~B~~</p>', aHistory: '<p><del>A2</del></p>', bEvents: 1 });
});

test('theme attributes are page-global and instance caches can leave multiple themes enabled', async ({ page }) => {
  const result = await page.evaluate(() => {
    const flags = () => Object.fromEntries([...document.querySelectorAll('link[title]')].map(link => [link.title, link.hasAttribute('disabled')]));
    a.update(props({ style: 'Github' }));
    const first = flags();
    a.update(props({ style: 'Default', dynamicStyle: 'Monokai' }));
    const override = flags();
    a.update(props({ style: 'Github', dynamicStyle: '' }));
    const b = make();
    b.update(props({ style: 'Monokai' }));
    const shared = flags();
    a.update(props({ style: 'Github' }));
    a.reset();
    return { first, override, shared, after: flags() };
  });
  expect(result.first).toEqual({ Default: true, Github: false, Monokai: true });
  expect(result.override).toEqual({ Default: true, Github: true, Monokai: false });
  expect(result.shared).toEqual({ Default: true, Github: false, Monokai: false });
  expect(result.after).toEqual(result.shared);
});

test('highlight action runs real page-wide highlighting without republishing html', async ({ page }) => {
  const result = await page.evaluate(() => {
    const b = make();
    for (const h of [a, b]) { h.update(props({ markdown: '```javascript\nconst answer = 42;\n```' })); render(h); }
    const before = a.states.html;
    a.action('highlight', {});
    return { before, after: a.states.html, events: a.events.length, highlighted: document.querySelectorAll('code.hljs .hljs-keyword').length };
  });
  expect(result.highlighted).toBe(2);
  expect(result.after).toBe(result.before);
  expect(result.before).not.toContain('hljs-keyword');
  expect(result.events).toBe(1);
});

test('empty/missing markdown follows Showdown; invalid types and styles fail without publication', async ({ page }) => {
  const result = await page.evaluate(() => {
    const empty = [];
    for (const markdown of ['', null, undefined, 0, false]) { a.update(props({ markdown })); empty.push(a.states.html); }
    const errors = [];
    for (const markdown of [42, {}, ['text']]) {
      try { a.update(props({ markdown })); } catch (error) { errors.push(error.name); }
    }
    const before = a.events.length;
    for (const style of ['Unknown', undefined, 'bad"selector']) {
      try { a.update(props({ style })); } catch (error) { errors.push(error.name); }
    }
    return { empty, errors, before, after: a.events.length };
  });
  expect(result.empty).toEqual(['', null, undefined, 0, false]);
  expect(result.errors).toEqual(['TypeError', 'TypeError', 'TypeError', 'TypeError', 'TypeError', 'SyntaxError']);
  expect(result.before).toBe(5);
  expect(result.after).toBe(5);
});

test('records current property spelling mismatch instead of pretending metadata supplies aliases', async ({ page }) => {
  expect(await page.evaluate(() => {
    const p = props({ markdown: 'one\ntwo', simpleLineBreaks: true });
    delete p.simplelinebreaks;
    a.update(p);
    return a.states.html;
  })).toBe('<p>one\ntwo</p>');
});

test('Showdown inline dimensions ignore the option and fragment links stay in the same window', async ({ page }) => {
  expect(await page.evaluate(() => {
    a.update(props({ markdown: '![dot](/tests/browser/pixel.svg =20x30)\n\n[local](#target)', parseimgdimensions: false, openLinksInNewWindow: true }));
    const output = render(a);
    return { width: output.querySelector('img').getAttribute('width'), target: output.querySelector('a').getAttribute('target') };
  })).toEqual({ width: '20', target: null });
});

test('smooth preview suppresses incomplete setext headings across repeated updates', async ({ page }) => {
  expect(await page.evaluate(() => [false, true, false].map(smoothlivepreview => {
    a.update(props({ markdown: 'Title\n=\n\nAfter', smoothlivepreview }));
    return render(a).querySelectorAll('h1').length;
  }))).toEqual([1, 0, 1]);
});

test('render in element: output div with class hook, sync updates, removed when turned off', async ({ page }) => {
  const result = await page.evaluate(() => {
    const canvas = a.instance.canvas[0];
    a.update(props({ markdown: '# One', render_in_element: true, css_class: 'md  chat' }));
    const first = { html: canvas.innerHTML, events: a.events.length };
    const div = canvas.firstElementChild;
    a.update(props({ markdown: '# Two', render_in_element: true, css_class: 'md' }));
    const second = { same: canvas.firstElementChild === div, className: div.className, text: div.textContent, event: a.events.at(-1).states.html };
    a.update(props({ markdown: '# Three', render_in_element: false }));
    return { first, second, after: canvas.innerHTML, state: a.states.html };
  });
  expect(result.first).toEqual({ html: '<div class="markdown-pro md  chat"><h1 id="one">One</h1></div>', events: 1 });
  expect(result.second).toEqual({ same: true, className: 'markdown-pro md', text: 'Two', event: '<h1 id="two">Two</h1>' });
  expect(result.after).toBe('');
  expect(result.state).toBe('<h1 id="three">Three</h1>');
});

test('auto highlight publishes highlighted html, renders it, and tolerates unknown languages', async ({ page }) => {
  const result = await page.evaluate(() => {
    a.update(props({ markdown: '```javascript\nconst answer = 42;\n```\n\n```nosuchlang\nplain <b>\n```\n\n`inline`', auto_highlight: true, render_in_element: true }));
    const canvas = a.instance.canvas[0];
    return { state: a.states.html, unknown: canvas.querySelector('code.language-nosuchlang').className, rendered: canvas.querySelectorAll('pre code.hljs').length, keyword: canvas.querySelectorAll('.hljs-keyword').length, inline: canvas.querySelector('p code').className, escaped: canvas.querySelectorAll('pre b').length, events: a.events.length };
  });
  expect(result.state).toContain('<span class="hljs-keyword">const</span>');
  expect(result.keyword).toBe(1);
  expect(result.rendered).toBe(2);
  expect(result.unknown).toBe('nosuchlang language-nosuchlang hljs');
  expect(result.inline).toBe('');
  expect(result.escaped).toBe(0);
  expect(result.events).toBe(1);
});

test('without new options html and canvas stay as before', async ({ page }) => {
  const result = await page.evaluate(() => {
    a.update(props({ markdown: '```js\nconst a = 1;' }));
    return { state: a.states.html, canvas: a.instance.canvas[0].innerHTML, events: a.events.length };
  });
  expect(result).toEqual({ state: '<p>```js<br />\nconst a = 1;</p>', canvas: '', events: 1 });
});

for (const [name, markdown, expected] of [
  ['open code fence', 'Run:\n\n```js\nconst a = 1;', '<p>Run:</p>\n<pre><code class="js language-js">const a = 1;\n</code></pre>'],
  ['bare fence opener', '```python', '<pre><code class="python language-python">\n</code></pre>'],
  ['partial closing fence', '```js\nx\n``', '<pre><code class="js language-js">x\n</code></pre>'],
  ['closed fence untouched', '```js\nx\n```\n\nafter', '<pre><code class="js language-js">x\n</code></pre>\n<p>after</p>'],
  ['table header only', 'Intro\n\n| A | B |', '<p>Intro</p>\n<table>\n<thead>\n<tr>\n<th>A</th>\n<th>B</th>\n</tr>\n</thead>\n<tbody>\n</tbody>\n</table>'],
  ['partial delimiter keeps alignment', '| A | B |\n| :---: | -', '<table>\n<thead>\n<tr>\n<th style="text-align:center;">A</th>\n<th>B</th>\n</tr>\n</thead>\n<tbody>\n</tbody>\n</table>'],
  ['pipes inside open fence stay code', '```\n| A |', '<pre><code>| A |\n</code></pre>'],
  ['lone pipe of a starting table held back', 'Intro\n\n|', '<p>Intro</p>'],
  ['lone pipe of a new body row kept', '| A | B |\n| --- | --- |\n|', '<table>\n<thead>\n<tr>\n<th>A</th>\n<th>B</th>\n</tr>\n</thead>\n<tbody>\n</tbody>\n</table>'],
  ['ended paragraph with pipes untouched', '| A | B |\n\nNext', '<p>| A | B |</p>\n<p>Next</p>'],
]) {
  test(`streaming completes ${name}`, async ({ page }) => {
    const html = await page.evaluate(async markdown => {
      a.update(props({ markdown, streaming: true }));
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
      return a.states.html;
    }, markdown);
    expect(html).toBe(expected);
  });
}

test('streaming coalesces updates into one conversion per frame with the latest text', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const frame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
    const reply = 'Hello **world**, here is code:\n\n```js\nconst a = 1;\n```\n';
    for (let i = 1; i <= reply.length; i++) a.update(props({ markdown: reply.slice(0, i), streaming: true, render_in_element: true }));
    const beforeFrame = a.events.length;
    await frame();
    const afterFrame = { events: a.events.length, state: a.states.html, rendered: a.instance.canvas[0].firstElementChild.innerHTML };
    a.update(props({ markdown: reply + 'Done.', streaming: true, render_in_element: true }));
    a.update(props({ markdown: 'Final', streaming: false, render_in_element: true }));
    const syncEvents = a.events.length;
    await frame();
    return { beforeFrame, afterFrame, syncEvents, final: a.states.html, finalEvents: a.events.length };
  });
  expect(result.beforeFrame).toBe(0);
  expect(result.afterFrame.events).toBe(1);
  expect(result.afterFrame.state).toBe('<p>Hello <strong>world</strong>, here is code:</p>\n<pre><code class="js language-js">const a = 1;\n</code></pre>');
  expect(result.afterFrame.rendered).toBe(result.afterFrame.state);
  expect(result.syncEvents).toBe(2);
  expect(result.final).toBe('<p>Final</p>');
  expect(result.finalEvents).toBe(2);
});
