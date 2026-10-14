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
const allCases = JSON.parse(fs.readFileSync(path.join(root, 'content/case-studies.json')));
const cases = allCases.filter(c => c.publish !== false);
const posts = readPosts(path.join(root, 'posts'));

before(async () => {
  process.env.SITE_URL = 'https://example.com';
  buildModule = await import('./build.mjs');
  await buildModule.build({ outputDir: output });
});
after(() => fs.rmSync(output, { recursive: true, force: true }));

test('phone workspace article renders its related article as a navigable link', () => {
  const doc = documentAt('blog/cloud-workspace-from-phone');
  const destination = '/blog/outsource-capabilities-own-context/';
  const link = doc.querySelector(`.prose a[href="${destination}"]`);
  assert.ok(link, 'related article must be an anchor, not literal Markdown');
  assert.equal(link.textContent, '《能力可以外包，AI 的上下文不行》');
  assert.equal(link.hasAttribute('target'), false);
  assert.ok(fs.existsSync(path.join(output, destination, 'index.html')));
  assert.ok(!doc.querySelector('.prose').textContent.includes(`](${destination})`));
});

test('case details retain their content without illustrations or image placeholders', () => {
  for (const item of cases) {
    const doc = documentAt(`cases/${item.slug}`);
    const prose = doc.querySelector('.prose');
    assert.equal(prose.querySelectorAll('img, figure, [data-image-slot], .case-image-placeholder').length, 0);
    assert.ok(!prose.innerHTML.includes('<!-- case-image:'));
    assert.ok(!prose.textContent.includes('图片待补充'));
    assert.ok(!Object.hasOwn(item, 'imageSlots'));
    assert.equal(doc.querySelectorAll('.case-brief dt').length, item.overview.length);
    for (const heading of ['我的工作范围', '交付物与关键做法', '这个案例能够说明的能力']) {
      assert.ok([...prose.querySelectorAll('h2')].some(h => h.textContent === heading));
    }
  }
});

test('project start dates order the published listing and room workbench independently of homepage selection', () => {
  const expected = ['intent', 'recruitment-delivery',
    'creator-marketing-delivery', 'keysafe-password-manager', 'multi-cloud-management',
    'enterprise-gitops-platform', 'kubernetes-platform'];
  assert.deepEqual([...documentAt('cases').querySelectorAll('.case-card')].map(c => c.id), expected);
  const room = JSON.parse(documentAt('explore').querySelector('#room-content').textContent);
  assert.deepEqual(room.zones[1].links.map(c => c.url), expected.map(slug => `/cases/${slug}/`));
  const input = [{slug:'undated'}, {slug:'older', period:{start:'2023-01'}},
    {slug:'completed', period:{start:'2022-01', end:'2024-05'}},
    {slug:'same-month', period:{start:'2024-05', basis:'record'}}];
  assert.deepEqual(buildModule.sortCases(input).map(c => c.slug), ['same-month', 'older', 'completed', 'undated']);
  assert.equal(input[0].slug, 'undated');
});

test('hidden projects retain source content without public pages, links or room data', () => {
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  const publicPages = [html(''), html('cases'), html('explore'), ...cases.map(c => html(`cases/${c.slug}`))];
  for (const slug of ['99medpass', 'vowscene']) {
    const source = allCases.find(c => c.slug === slug);
    assert.equal(source.publish, false);
    assert.ok(source.html && source.steps.length);
    assert.equal(fs.existsSync(path.join(output, 'cases', slug, 'index.html')), false);
    assert.ok(!sitemap.includes(`/cases/${slug}/`));
    for (const page of publicPages) {
      assert.ok(!page.includes(`/cases/${slug}/`));
      assert.ok(!page.includes(source.title));
    }
    assert.throws(() => buildModule.selectFeaturedCases(allCases, [slug, 'recruitment-delivery']), /unpublished/);
  }
});

test('case cards and details display only a project start date with one consistent label', () => {
  const listing = documentAt('cases');
  for (const item of cases) {
    const expected = `项目时间 · ${item.period.start.replaceAll('-', '.')}`;
    const card = listing.getElementById(item.slug);
    const detail = documentAt(`cases/${item.slug}`);
    assert.equal(card.querySelector('.case-period').textContent, expected);
    assert.equal(card.querySelectorAll('.case-period time').length, 1);
    assert.equal(detail.querySelector('.article-header .case-period').textContent, expected);
    assert.equal(detail.querySelectorAll('.case-time-note').length, 0);
    assert.equal(card.querySelector('time').getAttribute('datetime'), item.period.start);
  }
});

test('homepage shows exactly two configured cases in order with original metadata and working detail links', async () => {
  const { default: site } = await import('../site.config.mjs');
  const home = documentAt('');
  const cards = [...home.querySelectorAll('.case-card')];
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map(c => c.id), site.featuredCaseSlugs);
  for (const card of cards) {
    const item = cases.find(c => c.slug === card.id);
    assert.equal(card.querySelector('h3').textContent, item.title);
    assert.equal(card.querySelector('p').textContent, item.description);
    assert.equal(card.querySelector('.case-meta span:last-child').textContent, item.status);
    assert.equal(card.querySelector('a').getAttribute('href'), `/cases/${item.slug}/`);
    assert.equal(documentAt(`cases/${item.slug}`).querySelector('h1').textContent, item.title);
  }
  assert.ok([...home.querySelectorAll('a[href="/cases/"]')].some(a => a.textContent.includes('查看更多')));
});

test('featured selection follows explicit configuration regardless of dates and rejects invalid configuration', () => {
  const slugs = ['enterprise-gitops-platform', 'recruitment-delivery'];
  const input = buildModule.sortCases(cases);
  const originalOrder = input.map(c => c.slug);
  assert.deepEqual(buildModule.selectFeaturedCases(input, slugs).map(c => c.slug), slugs);
  assert.deepEqual(buildModule.selectFeaturedCases(input.toReversed(), slugs.toReversed()).map(c => c.slug), slugs.toReversed());
  assert.deepEqual(input.map(c => c.slug), originalOrder);
  for (const invalid of [null, [], [slugs[0]], [...slugs, 'intent'], [slugs[0], slugs[0]]]) {
    assert.throws(() => buildModule.selectFeaturedCases(input, invalid), /exactly two distinct/);
  }
  assert.throws(() => buildModule.selectFeaturedCases(input, [slugs[0], 'missing-case']), /Unknown or unpublished featured case slug: missing-case/);
});

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

test('maintained biography and contacts render with anchor targets', () => {
  const about = documentAt('about');
  const previous = new JSDOM(fs.readFileSync(path.join(root, 'content/about.html'), 'utf8')).window.document;
  for (const paragraph of previous.querySelectorAll('p, li, td, dd')) {
    assert.ok(clean(about.querySelector('main').textContent).includes(clean(paragraph.textContent)));
  }
  for (const element of previous.querySelectorAll('[id]')) assert.ok(about.getElementById(element.id), element.id);
});

test('web resume includes current personal details and concise experience titles', () => {
  const about = documentAt('about');
  assert.equal(documentAt('').querySelector('.site-header nav a[href="/resume/"]'), null);
  assert.ok(documentAt('').querySelector('.footer-links a[href="/resume/"]'));
  assert.ok(about.querySelector('#contact a[href="/resume/"]'));
  const dom = interactive('resume');
  const doc = dom.window.document;
  assert.equal(doc.querySelector('h1').textContent, '陈雨桐');
  assert.equal(doc.querySelector('.resume-nickname'), null);
  assert.ok(about.querySelector('h1').textContent.includes('雨桐'));
  assert.ok(about.querySelector('.identity-card').textContent.includes('雨桐'));
  assert.equal(doc.querySelector('.resume-contact a[href^="mailto:"]').textContent, 'Email：cytlabss@gmail.com');
  assert.equal(doc.querySelector('.resume-contact').children[3].textContent, '学历：本科');
  assert.equal(doc.querySelector('.resume-contact').lastElementChild.textContent, '工作年限：7年');
  assert.equal(doc.querySelector('.resume-summary'), null);
  assert.equal(doc.querySelector('#resume-education'), null);
  assert.equal(doc.querySelector('#resume-collaboration'), null);
  assert.deepEqual([...doc.querySelectorAll('.resume-section h2')].map(e => e.textContent),
    ['专业能力', '工作经历', '项目经历']);
  assert.equal(doc.querySelector('.resume-header').firstElementChild.tagName, 'H1');
  assert.ok(doc.querySelector('h1').nextElementSibling.classList.contains('resume-contact'));
  assert.deepEqual([...doc.querySelectorAll('#resume-experience time')].map(t => t.dateTime),
    ['2024-06', '2021-08', '2024-03', '2019-11', '2021-06']);
  assert.equal(doc.querySelector('#resume-experience .resume-role'), null);
  assert.deepEqual([...doc.querySelectorAll('#resume-experience h3')].map(e => e.textContent),
    ['全栈开发', 'DevOps', '基础运维']);
  assert.equal(doc.querySelectorAll('#resume-projects .resume-entry').length, 3);
  const section = doc.querySelector('#resume-projects');
  assert.ok(section.firstElementChild.querySelector('a[href="/cases/"]'));
  assert.deepEqual([...section.querySelectorAll('.resume-date time')].map(t => t.dateTime),
    ['2026-10', '2026-09', '2026-07']);
  for (const link of doc.querySelectorAll('#resume-projects .resume-entry a')) {
    assert.ok(cases.some(c => new URL(link.getAttribute('href'), 'https://example.com').pathname === `/cases/${c.slug}/`));
  }
  const printButton = doc.querySelector('[data-print-resume]');
  assert.equal(printButton.textContent, '打印简历');
  assert.equal(printButton.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(printButton.hidden, true);
  let printed = 0;
  dom.window.print = () => printed++;
  dom.window.eval(fs.readFileSync(path.join(root, 'src/main.js'), 'utf8'));
  assert.equal(printButton.hidden, false);
  printButton.click();
  assert.equal(printed, 1);
  const printStyles = new JSDOM(`<style>${fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8')}</style>`);
  const media = [...printStyles.window.document.styleSheets[0].cssRules].find(rule => rule.conditionText === 'print');
  assert.ok(media);
  for (const selector of ['.site-header', '.site-footer', '.resume-toolbar', '.resume-case-link', '.resume-export-status']) {
    assert.ok([...media.cssRules].some(rule => rule.selectorText?.includes(selector) && rule.style.display === 'none'));
  }
  assert.ok(![...media.cssRules].some(rule => rule.selectorText?.includes('.resume-header') && rule.style?.display === 'none'));
  printStyles.window.close();
  assert.equal(doc.querySelector('.resume-download'), null);
  assert.equal(fs.existsSync(path.join(output, 'assets/resume.pdf')), false);
  for (const link of section.querySelectorAll('.resume-entry > a')) assert.equal(clean(link.textContent), '查看详情 →');
  dom.window.close();
});

test('resume image exports current content without controls or changing the live theme', async () => {
  const { initializeResumeImageExport } = await import('../src/resume-image.js');
  const dom = new JSDOM(html('resume'));
  const doc = dom.window.document;
  doc.documentElement.dataset.theme = 'dark';
  doc.querySelector('.resume-entry li').textContent = '修改后最新的简历内容';
  const resume = doc.querySelector('.resume-document');
  const original = resume.outerHTML;
  const button = doc.querySelector('[data-export-resume-image]');
  assert.equal(button.hidden, true);
  assert.equal(doc.querySelector('script[src="/assets/resume-image.js"]').type, 'module');
  assert.ok(fs.existsSync(path.join(output, 'assets/html2canvas-1.4.1.min.js')));
  assert.ok(!html('').includes('/assets/resume-image.js'));
  let calls = 0;
  let saved;
  const blob = new Blob(['png test payload'], { type: 'image/png' });
  const exportImage = initializeResumeImageExport(doc, {
    renderer: async () => async (element, options) => {
      calls++;
      assert.equal(element, resume);
      assert.equal(options.windowWidth, 960);
      assert.equal(options.scrollY, 0);
      assert.equal(options.backgroundColor, '#ffffff');
      assert.ok(options.ignoreElements(doc.querySelector('.resume-case-link')));
      assert.ok(!options.ignoreElements(doc.querySelector('h1')));
      const clone = new JSDOM(html('resume'));
      const sheet = clone.window.document.querySelector('.resume-document');
      sheet.replaceWith(element.cloneNode(true));
      const current = clone.window.document.querySelector('.resume-document');
      current.getBoundingClientRect = () => ({ width: 880, height: 2500 });
      await options.onclone(clone.window.document, current);
      assert.equal(clone.window.document.documentElement.dataset.theme, 'light');
      assert.equal(clone.window.document.body.children.length, 1);
      assert.equal(clone.window.document.querySelector('.site-header'), null);
      assert.equal(current.querySelector('.resume-case-link'), null);
      assert.ok(current.textContent.includes('修改后最新的简历内容'));
      assert.equal(current.querySelectorAll('.resume-section').length, 3);
      assert.equal(current.querySelectorAll('.resume-entry').length, 6);
      assert.ok(current.classList.contains('resume-image-sheet'));
      assert.ok(options.scale > 1 && options.scale <= 2);
      assert.ok(880 * 2500 * options.scale ** 2 <= 5_000_001);
      clone.window.close();
      return { toBlob(callback, type) { assert.equal(type, 'image/png'); callback(blob); } };
    },
    save: async (image, filename) => { saved = { image, filename }; },
  });
  assert.equal(button.hidden, false);
  const pending = exportImage();
  assert.equal(button.disabled, true);
  await exportImage();
  await pending;
  assert.equal(calls, 1);
  assert.equal(saved.image, blob);
  assert.equal(saved.filename, '陈雨桐-简历.png');
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, '导出图片');
  assert.equal(doc.documentElement.dataset.theme, 'dark');
  assert.equal(resume.outerHTML, original);
  assert.ok(doc.querySelector('[data-resume-export-status]').textContent.includes('图片已生成'));
  dom.window.close();
});

test('failed resume image exports allow retry and remove rendering frames', async () => {
  const { initializeResumeImageExport, renderResumeImage } = await import('../src/resume-image.js');
  const dom = new JSDOM(html('resume'));
  const doc = dom.window.document;
  let attempts = 0;
  const exportImage = initializeResumeImageExport(doc, {
    renderer: async () => { attempts++; throw new Error('Offline'); },
    save: () => assert.fail('Failed export must not download'),
  });
  await exportImage();
  assert.ok(doc.querySelector('[data-resume-export-status]').textContent.includes('请重试'));
  assert.equal(doc.querySelector('[data-export-resume-image]').disabled, false);
  assert.equal(doc.querySelector('[data-export-resume-image]').hasAttribute('aria-busy'), false);
  await exportImage();
  assert.equal(attempts, 2);
  await assert.rejects(renderResumeImage(doc.querySelector('.resume-document'), async () => {
    const frame = doc.createElement('iframe');
    frame.className = 'html2canvas-container';
    doc.body.append(frame);
    return { toBlob(callback) { callback(null); } };
  }), /Image encoding failed/);
  assert.equal(doc.querySelector('.html2canvas-container'), null);
  assert.ok(doc.querySelector('.resume-document'));
  dom.window.close();
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
  for (const route of ['/', '/about/', '/resume/', '/cases/', '/explore/', '/blog/page/2/']) assert.ok(sitemap.includes(`<loc>https://example.com${route}</loc>`));
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
  assert.equal(data.zones[1].links.length,cases.length);
  assert.equal(data.journal[0].title,posts[0].title);
  assert.ok(data.journal[0].url.startsWith('/blog/'));
  window.eval(fs.readFileSync(path.join(root,'src/room-experiences.js'),'utf8').replace('export function','function'));
  window.createExperiences({panel:doc.querySelector('#room-panel'),tooltip:doc.querySelector('#room-tooltip'),buttons:[...doc.querySelectorAll('[data-zone]')],data});
  for (const zone of ['books','desk','wall','notebook','plant']) {
    doc.querySelector(`[data-zone="${zone}"]`).click();
    assert.equal(doc.querySelector('#room-panel').hidden,false);
    if(zone==='books') {
      doc.querySelector(`[data-action="book"][data-index="${posts.length - 1}"]`).click();
      assert.match(doc.querySelector('.experience-link').href,new RegExp(posts.at(-1).slug));
    }
    if(zone==='desk') {
      const firstProject = data.zones[1].links[0];
      assert.equal(doc.querySelector('.desktop-note').textContent, `项目时间 · ${firstProject.period.start.replaceAll('-', '.')}`);
      const gitops=data.zones[1].links.findIndex(p=>p.url==='/cases/enterprise-gitops-platform/');
      doc.querySelector(`[data-action="project"][data-index="${gitops}"]`).click();
      doc.querySelector('[data-tab="sketch"]').click();
      doc.querySelector('[data-action="flow"]').click();
      assert.ok(doc.querySelector('.flow-feedback').textContent.includes('Kustomize'));
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
