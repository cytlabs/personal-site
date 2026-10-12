// Every page uses the same theme controller, including the 3D room.
const themeToggle = document.querySelector('[data-theme-toggle]');
function updateThemeToggle() {
  if (!themeToggle) return;
  const dark = window.siteTheme.current === 'dark';
  themeToggle.hidden = false;
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.title = dark ? '切换到白天' : '切换到夜晚';
}
themeToggle?.addEventListener('click', () => window.siteTheme.toggle());
window.addEventListener('site-theme-change', updateThemeToggle);
updateThemeToggle();

const filters = document.querySelector('[data-filters]');
if (filters) {
  filters.hidden = false;
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#post-search');
  const status = document.querySelector('#search-status');
  const pagePosts = document.querySelector('#page-posts');
  const pagination = document.querySelector('.pagination');
  const empty = document.querySelector('#no-results');
  const results = document.createElement('div');
  results.className = 'post-list';
  results.id = 'search-results';
  results.hidden = true;
  pagePosts.after(results);
  let category = 'all';
  let index;
  let version = 0;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function row(post, position) {
    const article = node('article', 'post-row');
    const number = node('span', 'row-index', String(position + 1).padStart(2, '0'));
    number.setAttribute('aria-hidden', 'true');
    const link = node('a', 'post-title');
    link.href = post.url;
    link.append(node('h3', '', post.title), node('p', '', post.description));
    const meta = node('div', 'post-meta');
    const date = node('time', '', post.date.replaceAll('-', '.'));
    date.dateTime = post.date;
    meta.append(node('span', '', post.category), date);
    const arrow = node('span', 'row-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    article.append(number, link, meta, arrow);
    return article;
  }
  async function update() {
    const request = ++version;
    const query = search.value.trim().toLocaleLowerCase();
    const filtering = Boolean(query) || category !== 'all';
    if (!filtering) {
      pagePosts.hidden = false;
      if (pagination) pagination.hidden = false;
      results.hidden = true;
      empty.hidden = true;
      status.hidden = true;
      return;
    }
    status.hidden = false;
    status.textContent = '正在搜索全部文章…';
    try {
      index ||= fetch(search.dataset.searchIndex).then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      });
      const posts = await index;
      if (request !== version) return;
      const matches = posts.filter(post => (category === 'all' || post.category === category) &&
        [post.title, post.description, post.category, ...post.tags].join(' ').toLocaleLowerCase().includes(query));
      results.replaceChildren(...matches.map(row));
      results.hidden = false;
      pagePosts.hidden = true;
      if (pagination) pagination.hidden = true;
      empty.hidden = matches.length !== 0;
      status.textContent = `找到 ${matches.length} 篇文章（全部 ${posts.length} 篇）`;
    } catch {
      index = null;
      if (request !== version) return;
      results.hidden = true;
      pagePosts.hidden = false;
      if (pagination) pagination.hidden = false;
      empty.hidden = true;
      status.textContent = '搜索暂时无法加载，可以继续翻页阅读，或重新输入关键词重试。';
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    buttons.forEach(b => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    update();
  }));
  search.addEventListener('input', update);
}

const progress = document.querySelector('.reading-progress');
if (progress) {
  let pending = false;
  const update = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 1})`;
    pending = false;
  };
  addEventListener('scroll', () => {if(!pending){pending=true;requestAnimationFrame(update);}}, {passive:true});
  addEventListener('resize', update);
  update();
}
