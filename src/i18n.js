import english from './locale-en.json' with { type: 'json' };

export function translate(value, doc = document) {
  if (doc.documentElement.lang !== 'en') return value;
  const key = value.trim();
  const counts = key.match(/^找到 (\d+) 篇文章（全部 (\d+) 篇）$/u);
  const project = key.match(/^项目 (\d+)$/u);
  const period = key.match(/^项目时间 · (.+)$/u);
  const excerpt = key.match(/^(.*?) \/ 摘读$/u);
  const illustration = key.endsWith('的构想示意');
  const translated = english[key] ?? (counts ? `${counts[1]} articles found (${counts[2]} total)`
    : project ? `Project ${project[1]}` : period ? `Project started · ${period[1] === '待补充' ? 'Not specified' : period[1]}`
    : excerpt ? `${excerpt[1]} / Excerpt` : illustration ? `${key.slice(0, -5)} — concept illustration` : key);
  return value.slice(0, value.indexOf(key)) + translated + value.slice(value.indexOf(key) + key.length);
}

export function translateElement(element) {
  const doc = element.ownerDocument;
  if (doc.documentElement.lang !== 'en') return;
  const walker = doc.createTreeWalker(element, 4);
  let node;
  while ((node = walker.nextNode())) node.textContent = translate(node.textContent, doc);
  for (const item of [element, ...element.querySelectorAll('*')]) {
    for (const attr of ['aria-label', 'title', 'alt']) if (item.hasAttribute(attr)) item.setAttribute(attr, translate(item.getAttribute(attr), doc));
  }
}

const switcher = typeof document !== 'undefined' && document.querySelector('[data-language-switch]');
if (switcher) {
  const preserveAnchor = () => { switcher.hash = location.hash; };
  preserveAnchor();
  addEventListener('hashchange', preserveAnchor);
}
