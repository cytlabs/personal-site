const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { buildSeo, siteOrigin } = require('./build-seo');

test('site origin rejects credentials and non-origin URLs', () => {
  assert.equal(siteOrigin('https://example.com/'), 'https://example.com');
  assert.equal(siteOrigin(''), null);
  for (const url of ['javascript:alert(1)', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com/?a=b']) {
    assert.throws(() => siteOrigin(url));
  }
});

test('SEO output uses public routes and escapes article JSON against script injection', t => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-seo-'));
  t.after(() => fs.rmSync(distDir, { recursive: true, force: true }));
  for (const dir of ['', 'blog', 'about', 'cases', 'blog/hello']) {
    fs.mkdirSync(path.join(distDir, dir), { recursive: true });
    fs.writeFileSync(path.join(distDir, dir, 'index.html'), '<html><head><link rel="canonical" href="./blog/"></head><body>Readable content</body></html>'.replace(dir ? '<link rel="canonical" href="./blog/">' : 'unused', ''));
  }
  const post = { slug: 'hello', title: '</script><script>alert(1)</script>', summary: 'A & B', published: '2026-09-14', tags: ['AI'] };
  buildSeo({ distDir, posts: [post], siteUrl: 'https://example.com' });
  const html = fs.readFileSync(path.join(distDir, 'blog/hello/index.html'), 'utf8');
  const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.equal(JSON.parse(json).headline, post.title);
  assert.ok(!json.includes('<'));
  assert.match(html, /href="https:\/\/example.com\/blog\/hello\/"/);
  assert.match(html, /Readable content/);
  const sitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) || []).length, 4);
  assert.match(sitemap, /https:\/\/example.com\/blog\/hello\//);
  assert.ok(!sitemap.includes('posts/'));
  assert.match(fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/example.com\/sitemap.xml/);
});
