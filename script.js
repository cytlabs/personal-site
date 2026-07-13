const scriptElement = document.querySelector('script[src$="script.js"]');
const basePath = scriptElement?.getAttribute("src")?.replace(/script\.js$/, "") || "./";
const { escapeHtml, renderMarkdown } = window.SiteMarkdown;

const files = {
  profile: `${basePath}content/profile.md`,
  services: `${basePath}content/services.md`,
  resume: `${basePath}content/resume.md`,
  cases: `${basePath}content/cases.md`,
};

const fallback = {
  profile: `# 个人定位

我是一名偏交付侧的 AI Workflow / DevOps 工程师，关注小团队和业务现场里的流程自动化、知识库、SOP、工单处理和内部工具。

## 我适合解决的问题

- 客户 Brief、聊天记录、工单、表格和 PDF 需要反复人工整理。
- SOP 和经验分散在文档、群聊和少数资深同事脑子里。
- AI Demo 能演示，但缺少验收标准、异常处理和团队交接。

## 我的交付方式

- 先拿真实输入，不用虚构样例判断价值。
- 先做薄切片，不一开始承诺完整平台。
- 先定义验收口径，再选择模型和工具。`,
  services: `# 服务方向

## AI 工作流薄切片

从一个真实输入开始，把读取、提取、校验、生成、人工确认和输出做成可演示闭环。

## 知识库与 SOP Copilot

把团队已有文档、排查经验、标准回复和历史工单整理成可检索、可引用、可持续更新的知识流。

## 内部工具与流程自动化

把重复整理、异常检查、报表生成和跨系统搬运变成可维护工具。`,
  resume: `# 简历概览

夏目，AI 工作流交付工程师。背景覆盖 DevOps、技术支持、自动化脚本、内部工具、知识库和 LLM Workflow。

## 能力组合

- 业务流程拆解：角色、触发、输入、处理、输出、异常、验收。
- AI 工作流：结构化输出、Prompt 版本管理、Dify Workflow、人工确认节点。
- 知识库与 SOP：文档切片、工单分类、标准回复、排查路径、升级条件。

## 联系

- 邮箱：xb990815@163.com
- GitHub：https://github.com/cyt1999`,
  cases: `# 代表案例

## 营销 Brief 处理工作流

把自然语言 Brief 转成结构化字段、缺失项追问、达人筛选条件和项目启动摘要。

## 技术支持 SOP Copilot

把工单、告警、历史 SOP 和标准回复连接起来，输出排查路径和回复草稿。

## GitOps 发布控制台

把多环境发布流程变成可审计、可回滚、可复用的团队流程。`,
};

async function loadMarkdown(key) {
  try {
    const response = await fetch(files[key], { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load ${files[key]}`);
    }
    return await response.text();
  } catch {
    return fallback[key] || "";
  }
}

async function hydrateMarkdown() {
  const panels = document.querySelectorAll("[data-md]");
  for (const panel of panels) {
    const key = panel.getAttribute("data-md");
    const markdown = await loadMarkdown(key);
    panel.innerHTML = renderMarkdown(markdown);
  }
}

async function loadBlogIndex() {
  try {
    const response = await fetch(`${basePath}generated/blog-index.json`, {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error("Failed to load generated blog index");
    }
    return await response.json();
  } catch {
    return [];
  }
}

function postUrl(post) {
  return `${basePath}blog/${encodeURIComponent(post.slug)}/`;
}

function renderPostCard(post) {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return `<article class="blog-card">
    <p class="eyebrow">${escapeHtml(post.category || "")}</p>
    <h2><a href="${escapeHtml(postUrl(post))}">${escapeHtml(post.title || "")}</a></h2>
    <p>${escapeHtml(post.summary || "")}</p>
    <time datetime="${escapeHtml(post.published || "")}">${escapeHtml(post.published || "")}</time>
    <div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  </article>`;
}

function renderLatestPosts(posts) {
  const mounts = document.querySelectorAll("[data-latest-posts]");
  if (!mounts.length) {
    return;
  }

  const latest = posts.slice(0, 3);
  for (const mount of mounts) {
    mount.innerHTML = latest.length
      ? latest.map(renderPostCard).join("")
      : "<p>暂无公开文章。</p>";
  }
}

function enableBlogFilters() {
  const filters = document.querySelectorAll(".blog-filters [data-category]");
  const cards = document.querySelectorAll(".blog-list [data-category]");
  if (!filters.length || !cards.length) {
    return;
  }

  for (const button of filters) {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category") || "all";
      for (const filter of filters) {
        filter.toggleAttribute("aria-current", filter === button);
      }
      for (const card of cards) {
        const visible = category === "all" || card.getAttribute("data-category") === category;
        card.hidden = !visible;
      }
    });
  }
}

async function hydrateBlog() {
  const posts = await loadBlogIndex();
  renderLatestPosts(posts);
  enableBlogFilters();
}

hydrateMarkdown();
hydrateBlog();
