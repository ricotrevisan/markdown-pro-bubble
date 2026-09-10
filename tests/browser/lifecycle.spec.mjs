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
    const initial = { ...a.instance.data };
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
