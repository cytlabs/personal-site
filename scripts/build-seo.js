const fs = require("node:fs");
const path = require("node:path");
const { getBlogPages } = require("./blog-pagination");
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
    ...getBlogPages(posts),
    { route: '/', title: '夏目 — Work, Notes & Systems', description: '夏目做过的项目、正在研究的问题，以及关于 AI、工作与组织的公开记录。' },
    { route: '/about/', title: 'About — 夏目', description: '关于夏目：从运维、开发到 AI 应用与企业现场，以及现在持续关注的问题。' },
    { route: '/projects/', title: 'Projects — 夏目', description: '夏目做过、正在做以及持续研究的项目。' },
    { route: '/projects/enterprise-ai-practice/', title: 'Enterprise AI Practice — 夏目', description: '重新思考当 AI 开始承担越来越多工作以后，企业应该怎样组织任务、上下文、流程和人的判断。' },
    ...posts.map(post => ({ route: `/blog/${post.slug}/`, title: `${post.title} | 夏目`, description: post.summary, post })),
  ];
  for (const page of pages) {
    const url = origin + page.route;
    const file = page.route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, page.route.slice(1), 'index.html');
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
  const urls = pages.map(page => `  <url><loc>${escapeHtml(origin + page.route)}</loc></url>`);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
}

module.exports = { buildSeo, siteOrigin };
