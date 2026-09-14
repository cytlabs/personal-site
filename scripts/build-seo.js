const fs = require("node:fs");
const path = require("node:path");
const { escapeAttribute, escapeHtml } = require("../markdown-renderer");

function siteOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an http(s) origin without a path, credentials, query or fragment');
  }
  return url.origin;
}

function buildSeo({ distDir, posts, siteUrl = process.env.SITE_URL }) {
  const origin = siteOrigin(siteUrl);
  if (!origin) {
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('Set SITE_URL to the public production origin before deploying');
    }
    console.warn('SITE_URL is unset: skipping canonical URLs and sitemap in this local build.');
    return;
  }
  const pages = [
    { route: '/blog/', title: '博客 | 夏目', description: '夏目的 AI 工作流、业务流程自动化和交付工程文章。' },
    { route: '/about/', title: '夏目｜个人说明', description: '夏目的个人经历、能力方向、工作方式和联系方式。' },
    { route: '/cases/', title: '案例 | 夏目', description: '夏目的 AI 工作流、知识库、DevOps 和内部工具交付案例。' },
    ...posts.map(post => ({ route: `/blog/${post.slug}/`, title: `${post.title} | 夏目`, description: post.summary, post })),
  ];
  for (const page of pages) {
    const url = origin + page.route;
    const file = path.join(distDir, page.route.slice(1), 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const metadata = [
      `<link rel="canonical" href="${escapeAttribute(url)}">`,
      `<meta property="og:url" content="${escapeAttribute(url)}">`,
      `<meta property="og:title" content="${escapeAttribute(page.title)}">`,
      `<meta property="og:description" content="${escapeAttribute(page.description)}">`,
      `<meta property="og:type" content="${page.post ? 'article' : 'website'}">`,
      '<meta property="og:locale" content="zh_CN">',
      '<meta name="twitter:card" content="summary">',
    ];
    if (page.post) {
      const data = {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: page.post.title, description: page.description,
        datePublished: page.post.published, inLanguage: 'zh-CN',
        mainEntityOfPage: url, url,
        author: { '@type': 'Person', name: '夏目', url: `${origin}/about/` },
        keywords: page.post.tags,
      };
      metadata.push(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
    }
    html = html.replace('</head>', `    ${metadata.join('\n    ')}\n  </head>`);
    fs.writeFileSync(file, html);
  }
  const rootFile = path.join(distDir, 'index.html');
  fs.writeFileSync(rootFile, fs.readFileSync(rootFile, 'utf8').replace('href="./blog/"', `href="${escapeAttribute(origin)}/blog/"`));
  const urls = pages.map(page => `  <url><loc>${escapeHtml(origin + page.route)}</loc></url>`);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
}

module.exports = { buildSeo, siteOrigin };
