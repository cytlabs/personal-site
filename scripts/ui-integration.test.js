const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { before, after, test } = require('node:test');
const { JSDOM } = require('jsdom');
const { readPosts } = require('./build-blog');
const { renderMarkdown } = require('../markdown-renderer');
const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'personal-site-ui-'));
let buildModule;
const html = route => fs.readFileSync(path.join(output, route, 'index.html'), 'utf8');
const documentAt = route => new JSDOM(html(route)).window.document;
const clean = text => text.replace(/\s+/g, ' ').trim();
const posts = readPosts(path.join(root, 'posts'));

before(async () => {
  process.env.SITE_URL = 'https://example.com';
  buildModule = await import('./build.mjs');
  await buildModule.build({ outputDir: output });
});
after(() => fs.rmSync(output, { recursive: true, force: true }));

test('every published article keeps its route, public prose, metadata and one page heading', () => {
  for (const post of posts) {
    const doc = documentAt(`blog/${post.slug}`);
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.querySelector('h1').textContent, post.title);
    assert.equal(doc.querySelector('link[rel=canonical]').href, `https://example.com/blog/${post.slug}/`);
    const expected = new JSDOM(renderMarkdown(post.body)).window.document;
    for (const element of expected.querySelectorAll('h1, h2, h3, p, li, pre, td, th')) {
      assert.ok(clean(doc.querySelector('main').textContent).includes(clean(element.textContent)), `${post.slug}: missing ${element.textContent.slice(0, 40)}`);
    }
    const structured = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(structured.datePublished, post.published);
    assert.deepEqual(structured.keywords, post.tags);
    assert.equal(structured.headline, post.title);
  }
  const index = JSON.parse(fs.readFileSync(path.join(output, 'assets/search-index.json')));
  assert.deepEqual(index.map(p => p.url), posts.map(p => `/blog/${p.slug}/`));
});

test('existing biography, contacts and case prose survive with legacy anchor targets', () => {
  const about = documentAt('about');
  const previous = new JSDOM(fs.readFileSync(path.join(root, 'about/index.html'), 'utf8')).window.document;
  for (const paragraph of previous.querySelectorAll('main p, main li, main td, main dd')) {
    assert.ok(clean(about.querySelector('main').textContent).includes(clean(paragraph.textContent)));
  }
  for (const element of previous.querySelectorAll('main [id]')) assert.ok(about.getElementById(element.id), element.id);
  const oldCases = new JSDOM(fs.readFileSync(path.join(root, 'cases/index.html'), 'utf8')).window.document;
  for (const article of oldCases.querySelectorAll('article.case-study')) {
    const target = documentAt(`cases/${article.id}`);
    assert.ok(documentAt('cases').getElementById(article.id));
    for (const element of article.querySelectorAll('p, li, .case-study-meta span')) {
      assert.ok(clean(target.querySelector('main').textContent).includes(clean(element.textContent)));
    }
  }
});

test('static pagination covers each article exactly once and SEO includes new pages', () => {
  const links = [];
  for (let page = 1; page <= Math.ceil(posts.length / 6); page++) {
    const route = page === 1 ? 'blog' : `blog/page/${page}`;
    const doc = documentAt(route);
    links.push(...[...doc.querySelectorAll('#page-posts .post-title')].map(a => a.getAttribute('href')));
    assert.equal(doc.querySelector('link[rel=canonical]').href, `https://example.com/${route}/`);
  }
  assert.deepEqual(links, posts.map(p => `/blog/${p.slug}/`));
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  for (const route of ['/', '/about/', '/cases/', '/explore/', '/blog/page/2/']) assert.ok(sitemap.includes(`<loc>https://example.com${route}</loc>`));
  assert.equal((fs.readFileSync(path.join(output, 'feed.xml'), 'utf8').match(/<item>/g) || []).length, posts.length);
  assert.ok(!html('').includes('http-equiv="refresh"'));
});

function interactive(route) {
  const dom = new JSDOM(html(route), { url: 'https://example.com/', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.matchMedia = () => ({matches:false, addEventListener(){}});
  dom.window.eval(fs.readFileSync(path.join(root, 'src/theme.js'), 'utf8'));
  return dom;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('search finds posts outside the current page, combines category filters and restores pagination', async () => {
  const dom = interactive('blog');
  const {window} = dom; const doc = window.document;
  window.fetch = async () => ({ ok:true, json:async()=>JSON.parse(fs.readFileSync(path.join(output,'assets/search-index.json'))) });
  window.eval(fs.readFileSync(path.join(root,'src/main.js'),'utf8'));
  const search = doc.querySelector('#post-search');
  search.value = posts.at(-1).title;
  search.dispatchEvent(new window.Event('input'));
  await settle();
  assert.equal(doc.querySelectorAll('#search-results .post-row').length, 1);
  assert.equal(doc.querySelector('#search-results a').getAttribute('href'), `/blog/${posts.at(-1).slug}/`);
  assert.equal(doc.querySelector('.pagination').hidden, true);
  search.value = ''; search.dispatchEvent(new window.Event('input')); await settle();
  assert.equal(doc.querySelector('.pagination').hidden, false);
  const category = [...doc.querySelectorAll('[data-filter]')].find(e=>e.dataset.filter===posts.at(-1).category);
  category.click(); await settle();
  assert.equal(doc.querySelectorAll('#search-results .post-row').length, posts.filter(p=>p.category===posts.at(-1).category).length);
  search.value = 'no-match-example-xyz'; search.dispatchEvent(new window.Event('input')); await settle();
  assert.equal(doc.querySelector('#no-results').hidden, false);
  dom.window.close();
});

test('failed and stale search requests keep static pages usable', async () => {
  const dom = interactive('blog/page/2'); const {window} = dom; const doc = window.document;
  let resolve;
  window.fetch = () => new Promise(done=>{resolve=done;});
  window.eval(fs.readFileSync(path.join(root,'src/main.js'),'utf8'));
  const search = doc.querySelector('#post-search');
  search.value = 'AI'; search.dispatchEvent(new window.Event('input'));
  search.value = ''; search.dispatchEvent(new window.Event('input'));
  resolve({ok:false}); await settle();
  assert.equal(doc.querySelector('#search-status').hidden, true);
  window.fetch = async()=>{throw new Error('offline');};
  search.value='AI'; search.dispatchEvent(new window.Event('input')); await settle();
  assert.equal(doc.querySelector('#page-posts').hidden, false);
  assert.equal(doc.querySelector('.pagination').hidden, false);
  assert.match(doc.querySelector('#search-status').textContent,/重新输入/);
  dom.window.close();
});

test('theme toggles and survives page initialization; restricted storage does not break it', () => {
  const dom = interactive(''); const {window} = dom;
  const theme = fs.readFileSync(path.join(root,'src/theme.js'),'utf8');
  window.eval(fs.readFileSync(path.join(root,'src/main.js'),'utf8'));
  window.document.querySelector('[data-theme-toggle]').click();
  assert.equal(window.document.documentElement.dataset.theme,'dark');
  window.eval(theme);
  assert.equal(window.siteTheme.current,'dark');
  Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});
  window.eval(theme); window.siteTheme.toggle();
  assert.equal(window.siteTheme.current,'dark');
  dom.window.close();
});

test('room uses published content and all five experiences work without WebGL', () => {
  const dom = interactive('explore'); const {window} = dom; const doc = window.document;
  const errors=[]; window.addEventListener('error',event=>errors.push(event.error));
  const data = JSON.parse(doc.querySelector('#room-content').textContent);
  assert.equal(data.zones[0].links.length,posts.length);
  assert.equal(data.zones[1].links.length,4);
  assert.equal(data.journal[0].title,posts[0].title);
  assert.ok(data.journal[0].url.startsWith('/blog/'));
  window.eval(fs.readFileSync(path.join(root,'src/room-experiences.js'),'utf8').replace('export function','function'));
  window.createExperiences({panel:doc.querySelector('#room-panel'),tooltip:doc.querySelector('#room-tooltip'),buttons:[...doc.querySelectorAll('[data-zone]')],data});
  for (const zone of ['books','desk','wall','notebook','plant']) {
    doc.querySelector(`[data-zone="${zone}"]`).click();
    assert.equal(doc.querySelector('#room-panel').hidden,false);
    if(zone==='books') {
      doc.querySelector('[data-action="book"][data-index="16"]').click();
      assert.match(doc.querySelector('.experience-link').href,new RegExp(posts.at(-1).slug));
    }
    if(zone==='desk') {
      doc.querySelector('[data-action="project"][data-index="3"]').click();
      doc.querySelector('[data-tab="sketch"]').click();
      doc.querySelector('[data-action="flow"]').click();
      assert.ok(doc.querySelector('.flow-feedback').textContent.includes('规则引擎'));
    }
    if(zone==='plant') doc.querySelector('[data-action="water"]').click();
    if(zone==='wall') doc.querySelector('[data-action="reveal"]').click();
    doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape'}));
    assert.equal(doc.querySelector('#room-panel').hidden,true);
    assert.equal(doc.activeElement.dataset.zone,zone);
  }
  assert.equal(doc.querySelector('#room-discovery-count').textContent,'5');
  assert.deepEqual(errors,[]);
  dom.window.close();
});

test('room excerpts never expose private source markers or raw markup', () => {
  const excerpts=buildModule.publicExcerpts('来源：[[raw/private]]\n\n/root/code/private\n\nPublic **note**.\n\n<script>alert(1)</script>');
  assert.deepEqual(excerpts,['Public note.','<script>alert(1)</script>']);
});
