import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createTemplateEngine, escapeHtml } from '../src/lib/template.js';

// Šablony pro testy vznikají v dočasné složce, aby testy nezávisely na skutečném webu
const TEMPLATES = {
  'pages/plain': '<p>Ahoj</p>',
  'pages/with-include': '<main>{{> partials/box }}</main>',
  'partials/box': '<div>{{> partials/inner }}</div>',
  'partials/inner': '<span>{{ title }}</span>',
  'pages/variables': '{{ name }}|{{{ html }}}|{{ cafe.name }}|{{ missing }}|{{ cafe.missing.deep }}',
  'pages/item': '<li>{{ label }}</li>',
  'pages/content': '<p>{{ title }}</p>',
  'layouts/base': '<html><title>{{ title }}</title><body>{{{ content }}}</body></html>',
  'cycle/a': 'A{{> cycle/b }}',
  'cycle/b': 'B{{> cycle/a }}',
  'pages/broken-include': '{{> ../secret }}',
  'pages/missing-include': '{{> partials/does-not-exist }}',
  'pages/prototype': '[{{ constructor }}][{{ name.constructor }}]'
};

let viewsDir;
let engine;

before(async () => {
  viewsDir = await mkdtemp(path.join(tmpdir(), 'holubnik-views-'));
  for (const [name, content] of Object.entries(TEMPLATES)) {
    const file = path.join(viewsDir, `${name}.html`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  engine = createTemplateEngine({
    viewsDir,
    globals: () => ({ cafe: { name: 'Holubník' }, year: 2026 })
  });
});

after(async () => {
  await rm(viewsDir, { recursive: true, force: true });
});

describe('template engine', () => {
  it('vyrenderuje šablonu bez proměnných', async () => {
    assert.equal(await engine.render('pages/plain'), '<p>Ahoj</p>');
  });

  it('vloží fragment i vnořený fragment', async () => {
    const html = await engine.render('pages/with-include', { title: 'Nadpis' });
    assert.equal(html, '<main><div><span>Nadpis</span></div></main>');
  });

  it('escapuje {{ }} a raw {{{ }}} vloží beze změny', async () => {
    const html = await engine.render('pages/variables', {
      name: '<script>alert("x")</script>',
      html: '<b>tučně</b>'
    });
    const [escaped, raw] = html.split('|');
    assert.equal(escaped, '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    assert.equal(raw, '<b>tučně</b>');
  });

  it('doplní globální data a data handleru je mohou přepsat', async () => {
    const globalHtml = await engine.render('pages/variables');
    assert.equal(globalHtml.split('|')[2], 'Holubník');

    const overridden = await engine.render('pages/variables', { cafe: { name: 'Jiná' } });
    assert.equal(overridden.split('|')[2], 'Jiná');
  });

  it('chybějící proměnnou vyrenderuje jako prázdný řetězec', async () => {
    const html = await engine.render('pages/variables', { name: 'x' });
    const parts = html.split('|');
    assert.equal(parts[3], '');
    assert.equal(parts[4], '');
  });

  it('nezpřístupní vlastnosti z prototypu objektu', async () => {
    assert.equal(await engine.render('pages/prototype', { name: 'x' }), '[][]');
  });

  it('vloží stránku do layoutu jako content', async () => {
    const html = await engine.render('pages/content', { title: 'Úvod' }, { layout: 'layouts/base' });
    assert.equal(html, '<html><title>Úvod</title><body><p>Úvod</p></body></html>');
  });

  it('renderFragment vyrenderuje jednu položku seznamu', async () => {
    const items = await Promise.all(['a', 'b'].map((label) => engine.renderFragment('pages/item', { label })));
    assert.equal(items.join(''), '<li>a</li><li>b</li>');
  });

  it('odmítne neplatný název šablony (path traversal)', async () => {
    await assert.rejects(engine.render('../etc/passwd'), /Neplatný název šablony/);
    await assert.rejects(engine.render('Pages/Plain'), /Neplatný název šablony/);
    await assert.rejects(engine.render('pages/broken-include'), /Neplatný název šablony/);
  });

  it('odmítne absolutní cestu mimo složku šablon', async () => {
    await assert.rejects(engine.render('/etc/passwd'), /mimo složku/);
  });

  it('u chybějícího fragmentu vyhodí chybu se jménem souboru', async () => {
    await assert.rejects(engine.render('pages/missing-include'), /partials\/does-not-exist\.html/);
  });

  it('zastaví cyklické vkládání fragmentů', async () => {
    await assert.rejects(engine.render('cycle/a'), /maximální hloubka/);
  });
});

describe('escapeHtml', () => {
  it('escapuje všechny nebezpečné znaky', () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
});
