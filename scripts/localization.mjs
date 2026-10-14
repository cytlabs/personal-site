import { JSDOM } from 'jsdom';
import markdown from '../markdown-renderer.js';

const han = /[\u3400-\u9fff]/u;

// English is generated at build time: it works without browser-side translation.
export function createLocalizer(dictionary, { base = '', origin = '', posts = {}, cases = {} } = {}) {
  const missing = new Set();
  function text(value) {
    if (!han.test(value)) return value.replace('Email：', 'Email: ');
    const key = value.trim();
    let translated = dictionary[key];
    if (translated === undefined) {
      const branded = key.match(/^(.*?)\s*·\s*夏目$/u);
      const reading = key.match(/^约 (\d+) 分钟$/u);
      const page = key.match(/^第 (\d+) 页$/u);
      const copyright = key.match(/^© (\d{4}) 夏目$/u);
      if (branded) translated = `${text(branded[1])} · Xiamu`;
      else if (reading) translated = `${reading[1]} min read`;
      else if (page) translated = `Page ${page[1]}`;
      else if (copyright) translated = `© ${copyright[1]} Xiamu`;
      else if (key.endsWith('的构想示意')) translated = `${text(key.slice(0, -5))} — concept illustration`;
      else if (/^[←→]\s*/u.test(key)) translated = key.match(/^[←→]\s*/u)[0] + text(key.replace(/^[←→]\s*/u, ''));
      else if (key.endsWith('的文章')) translated = `${text(key.slice(0, -3))}'s articles`;
    }
    if (translated === undefined) { missing.add(key); return value; }
    return value.slice(0, value.indexOf(key)) + translated + value.slice(value.indexOf(key) + key.length);
  }
  function url(value) {
    if (!value) return value;
    if (origin && value.startsWith(origin + '/')) return origin + url(value.slice(origin.length));
    if (!value.startsWith('/')) return value;
    const local = base && value.startsWith(base + '/') ? value.slice(base.length) : value;
    if (/^\/(?:assets|generated)\//u.test(local) || local.startsWith('/en/')) return base + local;
    if (!/^\/(?:$|blog\/|cases\/|about\/|resume\/|explore\/|feed\.xml)/u.test(local)) return value;
    return `${base}/en${local}`;
  }
  function data(value) {
    if (typeof value === 'string') return value.startsWith('/') || (origin && value.startsWith(origin + '/')) ? url(value) : text(value);
    if (Array.isArray(value)) return value.map(data);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, data(v)]));
    return value;
  }
  function page(html, route) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    doc.documentElement.lang = 'en';
    const articleSlug = route.match(/^\/blog\/([^/]+)\/$/u)?.[1];
    const caseSlug = route.match(/^\/cases\/([^/]+)\/$/u)?.[1];
    if (articleSlug || (caseSlug && cases[caseSlug])) {
      const article = articleSlug ? posts[articleSlug] : cases[caseSlug];
      if (!article?.body) throw new Error(`Missing English content: ${articleSlug || caseSlug}`);
      const prose = doc.querySelector('.prose');
      const originalHeadings = [...prose.querySelectorAll('h2, h3')];
      const controls = [...prose.children].filter(element => element.matches('.article-end, .next-article, script[src]'));
      prose.innerHTML = markdown.renderMarkdown(article.body);
      const headings = [...prose.querySelectorAll('h2, h3')];
      if (headings.length !== originalHeadings.length || headings.some((h, i) => h.tagName !== originalHeadings[i].tagName)) {
        throw new Error(`English article headings differ from source: ${articleSlug}`);
      }
      headings.forEach((h, i) => { h.id = originalHeadings[i].id; });
      doc.querySelectorAll('.toc nav a').forEach((link, i) => { link.textContent = headings[i].textContent; });
      prose.append(...controls);
    }
    const walker = doc.createTreeWalker(doc.documentElement, dom.window.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script, style, pre, code')) continue;
      node.textContent = text(node.textContent);
    }
    for (const element of doc.querySelectorAll('*')) {
      for (const attribute of ['title', 'aria-label', 'placeholder', 'alt', 'content']) {
        if (element.hasAttribute(attribute)) element.setAttribute(attribute, text(element.getAttribute(attribute)));
      }
      for (const attribute of ['href', 'src']) {
        if (!element.hasAttribute(attribute) || element.hasAttribute('hreflang') || element.matches('[data-language-switch]')) continue;
        element.setAttribute(attribute, url(element.getAttribute(attribute)));
      }
    }
    const switcher = doc.querySelector('[data-language-switch]');
    switcher.href = `${base}${route}`;
    switcher.textContent = '中文';
    switcher.lang = 'zh-CN';
    switcher.hreflang = 'zh-CN';
    switcher.setAttribute('aria-label', 'Read this page in Chinese');
    doc.querySelector('meta[property="og:locale"]').content = 'en_US';
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url(ogUrl.content);
    const search = doc.querySelector('[data-search-index]');
    if (search) search.dataset.searchIndex = `${base}/en/assets/search-index.json`;
    for (const script of doc.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]')) {
      const source = JSON.parse(script.textContent);
      if (script.id === 'room-content') {
        const englishEntry = entry => {
          const slug = entry.url?.match(/\/blog\/([^/]+)\//u)?.[1];
          const article = posts[slug];
          if (!article) return;
          const d = new JSDOM(markdown.renderMarkdown(article.body)).window.document;
          const excerpts = [...d.querySelectorAll('p')].slice(0, 4).map(p => p.textContent);
          entry.pages = excerpts;
          if ('text' in entry) entry.text = excerpts[0] || article.summary;
        };
        source.zones?.[0]?.links.forEach(englishEntry);
        source.journal?.forEach(englishEntry);
      }
      const translated = data(source);
      if (script.type === 'application/ld+json') translated.inLanguage = 'en';
      script.textContent = JSON.stringify(translated).replace(/</g, '\\u003c');
    }
    return dom.serialize();
  }
  function assertComplete() {
    if (missing.size) throw new Error(`Missing English translations (${missing.size}):\n${[...missing].join('\n')}`);
  }
  return { text, url, data, page, assertComplete, missing };
}
