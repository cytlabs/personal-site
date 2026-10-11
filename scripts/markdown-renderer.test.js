const assert = require('node:assert/strict');
const { test } = require('node:test');
const { inlineMarkdown, renderMarkdown } = require('../markdown-renderer');

test('site paths and section links render as same-tab anchors', () => {
  for (const url of ['/blog/related/', '/', '../related/', './related/', '#section', '/blog/?a=1&b=2#section']) {
    assert.equal(inlineMarkdown(`[相关文章](${url})`),
      `<a href="${url.replaceAll('&', '&amp;')}">相关文章</a>`);
  }
});

test('external Markdown and bare URLs retain their existing behavior', () => {
  assert.equal(inlineMarkdown('[文档](https://example.com/docs) 和 https://example.com'),
    '<a href="https://example.com/docs" target="_blank" rel="noreferrer">文档</a> 和 <a href="https://example.com" target="_blank" rel="noreferrer">https://example.com</a>');
});

test('local links escape attributes and labels without enabling unsafe destinations', () => {
  assert.equal(inlineMarkdown('[<img> **标题**](/blog/?q="x"&a=1)'),
    '<a href="/blog/?q=&quot;x&quot;&amp;a=1">&lt;img&gt; <strong>标题</strong></a>');
  for (const url of ['javascript:alert(1)', 'data:text/html,unsafe', '//evil.example/', '/\\evil.example/']) {
    assert.doesNotMatch(inlineMarkdown(`[测试](${url})`), /<a\b/);
  }
  assert.equal(renderMarkdown('```markdown\n[示例](/blog/)\n```'),
    '<pre><code class="language-markdown">[示例](/blog/)\n</code></pre>');
});
