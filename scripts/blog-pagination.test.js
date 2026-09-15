const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { buildBlog } = require('./build-blog');
const { buildSeo } = require('./build-seo');

function fixture(t, count) {
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-pagination-'));
  t.after(() => fs.rmSync(siteDir, { recursive: true, force: true }));
  const resourcesDir = path.join(siteDir, 'posts');
  fs.mkdirSync(resourcesDir);
  for (let index = 1; index <= count; index++) {
    fs.writeFileSync(path.join(resourcesDir, `post-${index}.md`), [
      '---', 'publish: true', `slug: post-${index}`, `title: Post ${index}`,
      'summary: Summary', 'category: AI', 'tags: [AI]',
      `published: 2026-09-${String(index).padStart(2, '0')}`, '---', 'Body.',
    ].join('\n'));
  }
  return { siteDir, resourcesDir };
}

for (const count of [0, 1, 6, 7, 12, 13]) {
  test(`static pagination covers all ${count} posts once with valid navigation`, t => {
    const options = fixture(t, count);
    buildBlog(options);
    const pageCount = Math.max(1, Math.ceil(count / 6));
    const slugs = [];
    for (let page = 1; page <= pageCount; page++) {
      const route = page === 1 ? '/blog/' : `/blog/page/${page}/`;
      const html = fs.readFileSync(path.join(options.siteDir, route, 'index.html'), 'utf8');
      const cards = [...html.matchAll(/<h2><a href="([^"]+)"/g)];
      assert.equal(cards.length, Math.min(6, count - (page - 1) * 6));
      for (const [, href] of cards) {
        const url = new URL(href, `https://example.com${route}`);
        assert.ok(fs.existsSync(path.join(options.siteDir, url.pathname, 'index.html')));
        slugs.push(url.pathname.split('/')[2]);
      }
      if (pageCount === 1) {
        assert.doesNotMatch(html, /aria-label="博客分页"/);
      } else {
        const nav = html.match(/<nav class="pagination"[\s\S]*?<\/nav>/)[0];
        assert.match(nav, new RegExp(`aria-current="page" aria-label="第 ${page} 页"`));
        assert.equal(nav.includes('rel="prev"'), page > 1);
        assert.equal(nav.includes('rel="next"'), page < pageCount);
        for (const [, href] of nav.matchAll(/href="([^"]+)"/g)) {
          const url = new URL(href, `https://example.com${route}`);
          assert.ok(fs.existsSync(path.join(options.siteDir, url.pathname, 'index.html')));
          assert.notEqual(url.pathname, '/blog/page/1/');
        }
      }
      for (const asset of ['styles.css', 'script.js', 'markdown-renderer.js']) {
        const reference = html.match(new RegExp(`(?:href|src)="([^"]*${asset.replace('.', '\\.')}(?:\\?[^" ]*)?)"`))[1];
        assert.equal(new URL(reference, `https://example.com${route}`).pathname, `/${asset}`);
      }
    }
    assert.deepEqual(slugs, Array.from({ length: count }, (_, i) => `post-${count - i}`));
    if (count === 0) {
      assert.match(fs.readFileSync(path.join(options.siteDir, 'blog/index.html'), 'utf8'), /暂无公开文章/);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(options.siteDir, 'generated/blog-index.json'))).length, count);
  });
}

test('rebuilding after removing posts cleans up obsolete pagination pages', t => {
  const options = fixture(t, 13);
  buildBlog(options);
  for (let index = 7; index <= 13; index++) {
    fs.unlinkSync(path.join(options.resourcesDir, `post-${index}.md`));
  }
  buildBlog(options);
  assert.equal(fs.existsSync(path.join(options.siteDir, 'blog/page')), false);
});

test('each pagination page has its own canonical URL and sitemap entry', t => {
  const options = fixture(t, 13);
  const posts = buildBlog(options);
  for (const dir of ['', 'about', 'cases']) {
    fs.mkdirSync(path.join(options.siteDir, dir), { recursive: true });
    fs.writeFileSync(path.join(options.siteDir, dir, 'index.html'), '<html><head></head><body></body></html>');
  }
  buildSeo({ distDir: options.siteDir, posts, siteUrl: 'https://example.com' });
  const sitemap = fs.readFileSync(path.join(options.siteDir, 'sitemap.xml'), 'utf8');
  for (const route of ['/blog/', '/blog/page/2/', '/blog/page/3/']) {
    const html = fs.readFileSync(path.join(options.siteDir, route, 'index.html'), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="https://example.com${route}">`));
    assert.ok(sitemap.includes(`<loc>https://example.com${route}</loc>`));
  }
  assert.doesNotMatch(sitemap, /\/blog\/page\/1\//);
});
