import fs from 'node:fs/promises';
import path from 'node:path';
import blog from './build-blog.js';
import pagination from './blog-pagination.js';
import seo from './build-seo.js';
import markdown from '../markdown-renderer.js';
import { build as bundle } from 'esbuild';
import site from '../site.config.mjs';

const root = path.resolve(import.meta.dirname, '..');
// Inline before styles so stored/system theme is applied before first paint.
let themeScript = '';
let roomContent;
export const base = ('/' + (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')).replace(/\/$/, '');
const u = p => `${base}${p}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate = date => date.replaceAll('-', '.');
const arrow = '<span aria-hidden="true">↗</span>';
const internalArrow = '<span aria-hidden="true">→</span>';
const heading = (n, title, link, label) => `<div class="section-heading"><h2><span class="section-number">${n}</span>${title}</h2>${link ? `<a class="text-link" href="${u(link)}">${label} ${internalArrow}</a>` : ''}</div>`;
const mark = `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>`;
const roomIcon = `<div class="room-icon" aria-hidden="true"><div class="tiny-back"></div><div class="tiny-side"></div><div class="tiny-floor"></div><div class="tiny-window"></div><div class="tiny-desk"></div><div class="tiny-book"></div><div class="tiny-plant"></div></div>`;

// Keep the site's publication rules, metadata and original /blog/<slug>/ URLs.
async function content(dir) {
  if (dir === 'posts') return blog.readPosts(blog.resolveResourcesDir(root)).map((p, i) => ({
    ...p, description: p.summary, date: p.published, featured: i + 1,
    minutes: Math.max(1, Math.ceil(p.body.replace(/\s/g, '').length / 400)),
    url: `/blog/${p.slug}/`,
  }));
  const cases = JSON.parse(await fs.readFile(path.join(root, 'content/case-studies.json'), 'utf8'));
  return cases.map((c, i) => ({ ...c, featured: i + 1, url: `/cases/${c.slug}/`,
    body: c.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    status: c.status || '项目复盘', kind: c.kind || '交付实践',
  }));
}

function layout({ title, description = site.description, route = '/', active = '', body, room = false, article = null }) {
  const canonical = site.url ? new URL(u(route), site.url).href : '';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title ? `${title} · ${site.name}` : site.title)}</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:locale" content="zh_CN"><meta name="twitter:card" content="summary"><meta property="og:title" content="${esc(title || site.title)}"><meta property="og:description" content="${esc(description)}">${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}"><link rel="alternate" type="application/rss+xml" title="${esc(site.name)}的文章" href="${u('/feed.xml')}">` : ''}${article && canonical ? `<script type="application/ld+json">${JSON.stringify({
    '@context':'https://schema.org', '@type':'BlogPosting', headline:article.title,
    description:article.description, datePublished:article.date, inLanguage:'zh-CN',
    mainEntityOfPage:canonical, url:canonical, keywords:article.tags,
    author:{'@type':'Person',name:site.name,url:new URL(u('/about/'),site.url).href}
  }).replace(/</g,'\\u003c')}</script>` : ''}<meta name="theme-color" content="#e9eee5"><script>${themeScript}</script><link rel="icon" href="${u('/assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${u('/assets/styles.css')}"><script type="module" src="${u('/assets/main.js')}"></script></head><body class="${room ? 'room-page' : ''}"><a class="skip-link" href="#main">跳到主要内容</a><header class="site-header"><a class="brand" href="${u('/')}" aria-label="${esc(site.name)}，首页">${mark}<span>${esc(site.name)}<small>${esc(site.romanName)}</small></span></a><nav aria-label="主导航">${[['/', '首页'], ['/blog/', '文章'], ['/cases/', '案例'], ['/about/', '关于']].map(([href, text]) => `<a href="${u(href)}" ${active === href ? 'aria-current="page"' : ''}>${text}</a>`).join('')}</nav><a class="header-explore" href="${u('/explore/')}" ${room ? 'aria-current="page"' : ''}>探索 <span aria-hidden="true">✳</span></a><button type="button" class="theme-toggle" data-theme-toggle aria-label="深色模式" aria-pressed="false" title="切换到夜晚" hidden><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A8.6 8.6 0 0 1 10 3.5 8.7 8.7 0 1 0 20.5 14Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button></header><main id="main" ${room ? 'class="explore-main"' : ''}>${body}</main>${room ? '' : `<footer class="site-footer"><div>${mark}<span>© ${new Date().getFullYear()} ${esc(site.name)}<small>保持好奇，慢慢生长。</small></span></div><div class="footer-links"><a href="${u('/about/')}#contact">联系我 ${arrow}</a>${site.url ? `<a href="${u('/feed.xml')}">RSS ${arrow}</a>` : ''}<a href="${u('/explore/')}">去房间逛逛 ${arrow}</a></div></footer>`}</body></html>`;
}

function postRow(p, index, search = false) {
  return `<article class="post-row" ${search ? `data-entry data-category="${esc(p.category)}" data-search="${esc(p.title + ' ' + p.description + ' ' + p.category)}"` : ''}><span class="row-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><a class="post-title" href="${u(p.url)}"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></a><div class="post-meta"><span>${esc(p.category)}</span><time datetime="${p.date}">${formatDate(p.date)}</time></div><span class="row-arrow" aria-hidden="true">↗</span></article>`;
}
function casePeriod(period) {
  if (!period?.start) return '<span class="case-period">时间待补充</span>';
  const month = date => `<time datetime="${esc(date)}">${esc(formatDate(date))}</time>`;
  const label = period.basis === 'record' ? '阶段记录' : '项目时间';
  const range = period.end ? `${month(period.start)} — ${month(period.end)}` : period.basis === 'record' ? month(period.start) : `${month(period.start)} 起`;
  return `<span class="case-period">${label} · ${range}</span>`;
}
function caseCard(c) {
  return `<article class="case-card" id="${esc(c.slug)}"><a href="${u(c.url)}"><div class="case-cover ${esc(c.cover)}"><img src="${u(`/assets/${c.cover}.svg`)}" alt="" width="720" height="420" loading="lazy"><span class="cover-arrow" aria-hidden="true">↗</span></div><div class="case-meta"><span>${esc(c.category)}</span><span>${esc(c.status)}</span></div>${casePeriod(c.period)}<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></a></article>`;
}

function home(posts, cases) {
  const selected = posts.filter(p => p.featured).sort((a, b) => a.featured - b.featured).slice(0, 3);
  const projects = cases.filter(c => c.featured).sort((a, b) => a.featured - b.featured).slice(0, 5);
  const recent = posts.slice(0, 4).map(p => ({...p, type:'文章'}));
  return layout({active:'/',body:`<div class="page-shell"><section class="home-intro"><div><p class="eyebrow"><span class="status-dot"></span> 一个持续更新的个人角落</p><h1>${site.intro.split('\n').map(esc).join('<br>')}</h1><p class="intro-copy">${esc(site.bio)}</p><a class="text-link" href="${u('/about/')}">多了解我一点 ${internalArrow}</a></div><a class="room-invitation" href="${u('/explore/')}"><span class="invitation-label">A LITTLE DETOUR <span>↗</span></span>${roomIcon}<div><span class="room-invitation-title">来我的房间逛逛</span><p>换一种方式，认识这里的主人。</p></div><span class="invitation-tag">3D 探索 · 随意看看</span></a></section><div class="now-line"><span class="now-label">此刻</span><p>${esc(site.now)}</p><span class="now-decoration" aria-hidden="true">↳</span></div><section class="home-section">${heading('01','一些思考','/blog/','全部文章')}<div class="post-list">${selected.map((p,i) => postRow(p,i)).join('')}</div></section><section class="home-section">${heading('02','动手做过的事','/cases/','全部案例')}<div class="case-grid">${projects.map(caseCard).join('')}</div></section><section class="home-section updates-section">${heading('03','最近更新')}<div class="update-list">${recent.map(p => `<a href="${u(p.url)}"><time datetime="${p.date}">${formatDate(p.date)}</time><span class="update-type">${p.type}</span><span>${esc(p.title)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section><section class="closing-note"><span aria-hidden="true">✳</span><p>想法还会变，故事还在继续。<br><small>谢谢你来这里坐一会儿。</small></p><a href="${u('/about/')}#contact">打个招呼 ${arrow}</a></section></div>`});
}

function listing(items, type, current = null, pages = []) {
  const blog = type === 'blog';
  return layout({title:blog?(current?.page > 1 ? `文章 · 第 ${current.page} 页` : '文章'):'案例',active:blog?'/blog/':'/cases/',route:current?.route || `/${type}/`,body:`<div class="page-shell"><header class="page-intro"><p class="eyebrow">${blog?'NOTES & ESSAYS':'SELECTED WORK'}</p><h1>${blog?'思考留下的痕迹。':'从想法，到动手。'}</h1><p>${blog?'写技术，也写工作与生活。有些是答案，有些仍是问题。':'记录问题、判断、尝试，以及过程中发生的变化。'}</p></header>${blog?`<section class="writing-browser" aria-label="文章列表"><div class="filter-toolbar" data-filters hidden><div class="filter-tabs" aria-label="按主题筛选"><button type="button" class="active" aria-pressed="true" data-filter="all">全部 <span>${pages.length ? pages.reduce((n,p)=>n+p.posts.length,0) : items.length}</span></button>${[...new Set((pages.length ? pages.flatMap(p=>p.posts) : items).map(x=>x.category))].map(t=>`<button type="button" aria-pressed="false" data-filter="${esc(t)}">${esc(t)}</button>`).join('')}</div><label class="search-field"><span aria-hidden="true">⌕</span><input data-search-index="${u('/assets/search-index.json')}" type="search" placeholder="搜索文章" aria-label="搜索文章" id="post-search"></label></div><p class="search-status" role="status" aria-live="polite" id="search-status" hidden></p><div class="post-list" id="page-posts">${items.map((p,i)=>postRow(p,i + ((current?.page || 1)-1)*pagination.BLOG_PAGE_SIZE,true)).join('')}</div>${items.length ? '' : '<p class="quiet-note">暂无公开文章。</p>'}${current ? renderPagination(current,pages) : ''}<p class="empty-state" id="no-results" hidden>没有找到这篇文章。试试其他关键词，或切换到“全部”。</p></section>`:`<div class="case-grid cases-page-grid">${items.map(caseCard).join('')}</div><p class="quiet-note">这里也保留探索中的项目。完成情况和内容性质会在案例里说明。</p>`}</div>`});
}

function renderPagination(current, pages) {
  if (pages.length < 2) return '';
  const item = p => `<a class="pagination-link" href="${u(p.route)}" aria-label="第 ${p.page} 页" ${p.page === current.page ? 'aria-current="page"' : ''}>${p.page}</a>`;
  return `<nav class="pagination" aria-label="博客分页">${current.page > 1 ? `<a href="${u(pages[current.page-2].route)}" rel="prev">← 上一页</a>` : '<span aria-disabled="true">上一页</span>'}<div>${pages.map(item).join('')}</div>${current.page < pages.length ? `<a href="${u(pages[current.page].route)}" rel="next">下一页 →</a>` : '<span aria-disabled="true">下一页</span>'}</nav>`;
}

function withToc(html) {
  const toc = [];
  const used = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  html = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (all, depth, attrs, text) => {
    const label = text.replace(/<[^>]*>/g, '');
    const old = attrs.match(/\bid="([^"]+)"/);
    let id = old?.[1] || `toc-${toc.length+1}-${label.trim().toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu,'-').replace(/^-|-$/g,'') || 'section'}`;
    if (!old) { const stem = id; let suffix = 2; while (used.has(id)) id = `${stem}-${suffix++}`; }
    used.add(id); toc.push({id, text:label, depth});
    return `<h${depth}${attrs}${old ? '' : ` id="${esc(id)}"`}>${text}</h${depth}>`;
  });
  return {html,toc};
}

export function renderMarkdown(body, title = '') {
  // Reuse the site's escaping, public-source filtering, tables and Mermaid support.
  const html = markdown.renderMarkdown(body).replace(/^<h1>([\s\S]*?)<\/h1>\s*/, (all, heading) => plainText(heading).trim() === title.trim() ? '' : all).replace(/<h1>([\s\S]*?)<\/h1>/g, '<h2>$1</h2>');
  return withToc(html);
}

function detail(p, list, type) {
  const blog = type==='blog';
  const {html,toc} = p.html ? withToc(p.html.replace(/(src|href)="(\/(?:assets|cases)\/[^"]+)"/g, (_, attribute, url) => `${attribute}="${u(url)}"`).replace(/<h2>([\s\S]*?)<\/h2>/, (all, heading) => plainText(heading).trim() === p.title.trim() ? '' : all)) : renderMarkdown(p.body, p.title);
  const related = list.find(item => item.slug !== p.slug);
  return layout({title:p.title,description:p.description,route:p.url,active:blog?'/blog/':'/cases/',article:blog?p:null,body:`<div class="reading-progress" aria-hidden="true"></div><div class="page-shell detail-shell"><a class="back-link" href="${u(`/${type}/`)}">← ${blog?'全部文章':'全部案例'}</a><header class="article-header"><div class="article-kicker"><span>${esc(p.category)}</span>${!blog ? `<span> / </span><span>${esc(p.status)}</span>` : ''}${p.date ? `<span> / </span><time datetime="${p.date}">${formatDate(p.date)}</time><span> / </span><span>约 ${p.minutes} 分钟</span>` : ''}</div><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>${!blog ? `${casePeriod(p.period)}${p.period?.note ? `<p class="case-time-note">${esc(p.period.note)}</p>` : p.period?.basis === 'record' ? '<p class="case-time-note">时间为已有材料记录的阶段月份，项目完整起止时间尚未记录。</p>' : p.period?.basis === 'unknown' ? '<p class="case-time-note">原案例未提供项目起止时间，待补充。</p>' : ''}` : ''}</header><div class="article-layout"><article class="prose">${html}${html.includes('class="mermaid"') ? `<script type="module" src="${u('/assets/diagrams.js')}"></script>` : ''}<div class="article-end"><span>—</span><p>谢谢你读到这里。</p></div>${related?`<a class="next-article" href="${u(related.url)}"><small>${blog?'再读一篇':'另一个案例'}</small><strong>${esc(related.title)} <span aria-hidden="true">→</span></strong></a>`:''}</article><aside class="toc"><p>这一页里</p><nav aria-label="文章目录">${toc.map(t=>`<a href="#${t.id}">${t.text}</a>`).join('')}</nav><a class="toc-about" href="${u('/about/')}">${mark}<span>夏目<br><small>写下来，也做出来。</small></span></a></aside></div></div>`});
}

async function about() {
  const {html,toc} = withToc(await fs.readFile(path.join(root,'content/about.html'),'utf8'));
  return layout({title:'关于我',route:'/about/',active:'/about/',body:`<div class="page-shell about-shell"><header class="page-intro" id="top"><p class="eyebrow">A PERSON, STILL IN PROGRESS</p><h1>你好，我是${esc(site.name)}。</h1><p>AI 应用 / Agent / Skills / 企业 AI 落地</p></header><div class="about-layout"><article class="prose">${html}</article><aside class="about-aside"><div class="identity-card">${mark}<p>${esc(site.name)}<small>${esc(site.romanName)}</small></p><hr><span>理解业务，也亲手交付。</span><p class="identity-note">保持好奇。<br>让想法接触真实的世界。</p></div><nav class="about-toc" aria-label="页面目录">${toc.filter(t=>t.depth==='2').map(t=>`<a href="#${esc(t.id)}">${t.text}</a>`).join('')}</nav><a class="about-explore" href="${u('/explore/')}">${roomIcon}<strong>也可以，来房间里坐坐 ↗</strong></a></aside></div></div>`});
}

function plainText(html) {
  return html.replace(/<[^>]*>/g,'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
}

export function publicExcerpts(body) {
  return [...markdown.renderMarkdown(body).matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>plainText(m[1])).slice(0,4);
}

function explore(posts, cases) {


  const zones=[{id:'books',title:'书架',subtitle:'一些思考，放在这里。',links:posts.map(p=>({title:p.title,url:u(p.url),meta:p.category,pages:publicExcerpts(p.body)}))},{id:'desk',title:'工作台',subtitle:'把想法放到现实里试一试。',links:cases.map(p=>({title:p.title,url:u(p.url),meta:p.category,description:p.description,status:p.status,kind:p.kind,period:p.period,steps:p.steps,cover:u(`/assets/${p.cover}.svg`),pages:[p.description, ...p.steps.map(s=>s.text)]}))},{id:'wall',title:'墙上的画',subtitle:'每个人，都不止一种介绍。',links:[{title:'认识这里的主人',url:u('/about/'),meta:'关于我'}]},{id:'notebook',title:'摊开的笔记本',subtitle:site.now,links:[{title:'看看最近写下的东西',url:u('/blog/'),meta:'最近更新'}]},{id:'plant',title:'留一点时间，慢慢长大',subtitle:'有些东西，需要阳光、水，以及不急着得到结果的耐心。谢谢你发现这个小角落。',links:[]}];
  return layout({title:'来我的房间逛逛',description:'一个可探索的 3D 小房间。书架放文章，工作台放案例，也留一些小惊喜。',route:'/explore/',room:true,body:`<section class="room-stage" aria-label="3D 探索房间"><div id="room-canvas" role="img" aria-label="3D 房间：书架、工作台、画框、笔记本和绿植。也可用下方按钮探索。"></div><div class="room-heading"><p class="eyebrow">MAKE YOURSELF AT HOME</p><h1>随意逛逛，<br>不用急着离开。</h1><p>抽一本书，打开电脑，翻翻手记。<br>还有两处小惊喜，等你发现。</p></div><div id="room-loading" class="room-loading" role="status">正在打开房间…</div><div id="room-fallback" class="room-fallback" hidden><p>这个设备暂时无法显示 3D 房间。</p><p>下面的入口仍然可以带你找到所有内容。</p></div><div id="room-tooltip" class="room-tooltip" hidden></div><div class="room-controls"><span class="room-discoveries" role="status" aria-live="polite">留下足迹 <span id="room-discovery-count">0</span> / 5</span><button type="button" id="room-reset" disabled>恢复视角 ↺</button></div><div class="room-guide"><span aria-hidden="true">↔</span> 拖动转动 · 点击物件，走近看看</div><div class="room-dock" aria-label="直接探索房间物件">${zones.map((z,i)=>`<button type="button" data-zone="${z.id}"><span aria-hidden="true">${['▤','▱','▧','▥','♧'][i]}</span>${['书架','电脑','画框','手记','绿植'][i]}</button>`).join('')}</div><div class="room-panel" id="room-panel" role="dialog" aria-modal="false" aria-labelledby="room-panel-title" hidden><button type="button" class="panel-close" aria-label="关闭物件介绍">×</button><p class="eyebrow">A CORNER OF MY WORLD</p><h2 id="room-panel-title"></h2><p id="room-panel-copy"></p><div id="room-panel-links"></div></div><a class="room-exit" href="${u('/')}">← 回到主站</a></section><noscript><div class="noscript-room"><p>房间互动需要 JavaScript，你也可以直接阅读：</p>${zones.flatMap(z=>z.links).map(l=>`<a href="${l.url}">${esc(l.title)}</a>`).join('')}</div></noscript><script type="application/json" id="room-content">${JSON.stringify({zones,...roomContent}).replace(/</g,'\\u003c')}</script><script type="module" src="${u('/assets/room.js')}"></script>`});
}

export async function build({ outputDir = path.join(root, 'dist') } = {}) {
  const out = path.resolve(outputDir);
  themeScript = await fs.readFile(path.join(root, 'src/theme.js'), 'utf8');
  roomContent = JSON.parse(await fs.readFile(path.join(root, 'content/room.json'), 'utf8'));
  site.url = seo.siteOrigin(site.url) || '';
  if (!site.url && process.env.VERCEL_ENV === 'production') throw new Error('Set SITE_URL to the public production origin before deploying');
  await fs.rm(out,{recursive:true,force:true});
  await fs.mkdir(out,{recursive:true});
  await fs.cp(path.join(root,'public'),out,{recursive:true});
  const [posts,cases] = await Promise.all([content('posts'),content('cases')]);
  roomContent.journal = posts.slice(0,4).map(p=>({date:formatDate(p.date),title:p.title,text:publicExcerpts(p.body)[0] || p.description,note:p.description,url:u(p.url)}));
  const pages = [ ['/',home(posts,cases)],...pagination.getBlogPages(posts).map(page=>[page.route,listing(page.posts,'blog',page,pagination.getBlogPages(posts))]),['/cases/',listing(cases,'cases')],['/about/',await about()],['/explore/',explore(posts,cases)],...posts.map(p=>[p.url,detail(p,posts,'blog')]),...cases.map(p=>[p.url,detail(p,cases,'cases')]) ];
  for(const [route,html] of pages) {const folder=path.join(out,route);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'index.html'),html);}
  await fs.writeFile(path.join(out,'404.html'),layout({title:'这一页不在这里',body:`<div class="page-shell not-found"><p class="eyebrow">404 · LOST & FOUND</p><h1>好像走到了一条小岔路。</h1><p>这篇内容可能已经搬家，或者链接有一点偏差。</p><a class="solid-link" href="${u('/')}">回到首页 →</a></div>`}));
  await bundle({entryPoints:[path.join(root,'src/main.js'),path.join(root,'src/room.js')],outdir:path.join(out,'assets'),bundle:true,minify:true,format:'esm',target:'es2022',legalComments:'linked',metafile:false});
  await fs.copyFile(path.join(root,'src/diagrams.js'),path.join(out,'assets/diagrams.js'));
  await fs.writeFile(path.join(out,'assets/search-index.json'), JSON.stringify(posts.map(p=>({title:p.title,description:p.description,category:p.category,date:p.date,url:u(p.url),tags:p.tags}))));
  await fs.mkdir(path.join(out,'generated'),{recursive:true});
  await fs.writeFile(path.join(out,'generated/blog-index.json'), JSON.stringify(posts.map(p=>({slug:p.slug,title:p.title,summary:p.summary,category:p.category,tags:p.tags,published:p.date,url:`./${p.slug}/`}))));
  await fs.cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
  await fs.copyFile(path.join(root,'src/styles.css'),path.join(out,'assets/styles.css'));
  if(site.url){
    const full=p=>new URL(u(p),site.url).href;
    await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(([r])=>`<url><loc>${esc(full(r))}</loc></url>`).join('')}</urlset>`);
    await fs.writeFile(path.join(out,'feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.title)}</title><link>${esc(full('/'))}</link><description>${esc(site.description)}</description><language>zh-CN</language>${posts.map(p=>`<item><title>${esc(p.title)}</title><link>${esc(full(p.url))}</link><guid>${esc(full(p.url))}</guid><description>${esc(p.description)}</description><pubDate>${new Date(p.date+'T00:00:00+08:00').toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
  }
  await fs.writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\n${site.url?`Sitemap: ${new URL(u('/sitemap.xml'),site.url).href}\n`:''}`);
  console.log(`Built ${pages.length} pages + 404 (${posts.length} posts, ${cases.length} cases).`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) await build();
