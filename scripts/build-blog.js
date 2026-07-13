const fs = require("node:fs");
const path = require("node:path");
const {
  escapeAttribute,
  escapeHtml,
  renderMarkdown,
} = require("../markdown-renderer");

const REQUIRED_FIELDS = ["slug", "title", "summary", "category", "tags", "published"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function extractFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { frontmatter: "", body: markdown };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: "", body: markdown };
  }

  const fenceEnd = end + "\n---".length;
  const next = markdown[fenceEnd];
  if (next && next !== "\n" && next !== "\r") {
    return { frontmatter: "", body: markdown };
  }

  return {
    frontmatter: markdown.slice(4, end).trim(),
    body: markdown.slice(fenceEnd).trim(),
  };
}

function stripQuotes(value) {
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return inner.split(",").map((item) => stripQuotes(item.trim()));
  }
  return stripQuotes(trimmed);
}

function parseFrontmatter(frontmatter) {
  const parsed = {};

  for (const rawLine of frontmatter.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    if (key) {
      parsed[key] = parseValue(value);
    }
  }

  return parsed;
}

function isValidPublishedDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validatePost(post, file) {
  for (const field of REQUIRED_FIELDS) {
    if (
      post[field] === undefined ||
      post[field] === null ||
      post[field] === ""
    ) {
      throw new Error(`${file} is missing required field: ${field}`);
    }
  }

  if (!SLUG_PATTERN.test(post.slug)) {
    throw new Error(`${file} has invalid field: slug`);
  }

  if (!Array.isArray(post.tags)) {
    throw new Error(`${file} has invalid field: tags`);
  }

  if (!isValidPublishedDate(post.published)) {
    throw new Error(`${file} has invalid field: published`);
  }
}

function parseMarkdownFile(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(markdown);
  const metadata = parseFrontmatter(frontmatter);

  if (metadata.publish !== true) {
    return null;
  }

  validatePost(metadata, path.basename(filePath));

  return {
    ...metadata,
    body,
    sourcePath: filePath,
  };
}

function blogIndexEntry(post) {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    category: post.category,
    tags: post.tags,
    published: post.published,
    url: `./${post.slug}/`,
  };
}

function siteHeader(prefix, active = "") {
  const links = [
    ["博客", `${prefix}blog/`, "blog"],
    ["案例", `${prefix}cases/`, "cases"],
    ["关于", `${prefix}about/`, "about"],
  ];

  return `<header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${prefix}blog/" aria-label="返回博客">夏目 <span>AI Delivery Engineer</span></a>
        <nav class="nav" aria-label="主导航">
          ${links
            .map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`)
            .join("\n          ")}
        </nav>
      </div>
    </header>`;
}

function pageShell({ title, description, prefix, body, script, active }) {
  const scriptTag = script
    ? `\n    <script src="${prefix}markdown-renderer.js"></script>\n    <script src="${script}"></script>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}">
    <link rel="stylesheet" href="${prefix}styles.css?v=product-site-3">
  </head>
  <body>
    ${siteHeader(prefix, active)}
    ${body}
    <footer class="site-footer">
      <p>© 2026 夏目 · Powered by 夏目 &amp; AI · Built with HTML &amp; Node</p>
    </footer>${scriptTag}
  </body>
</html>
`;
}

function renderBlogIndex(posts) {
  const cards = posts
    .map(
      (post) => `<article class="blog-card">
          <h2><a href="./${escapeAttribute(post.slug)}/">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.summary)}</p>
          <div class="post-meta">
            <time datetime="${escapeAttribute(post.published)}">${escapeHtml(post.published)}</time>
            <span>·</span>
            <span>${escapeHtml(post.category)}</span>
          </div>
        </article>`
    )
    .join("\n        ");

  return pageShell({
    title: "博客 | 夏目",
    description: "夏目的 AI 工作流、业务流程自动化和交付工程文章。",
    prefix: "../",
    script: "../script.js",
    active: "blog",
    body: `<main class="page-layout">
      <div class="content-column">
        <section class="page-heading">
          <h1>博客</h1>
          <p>记录 AI 工作流、FDE 交付、技术积累和项目复盘。</p>
        </section>
        <section class="post-list">
          ${cards}
        </section>
      </div>
    </main>`,
  });
}

function renderArticle(post) {
  const tags = post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return pageShell({
    title: `${post.title} | 夏目`,
    description: post.summary,
    prefix: "../../",
    active: "blog",
    body: `<main class="section blog-article">
      <article>
        <a class="back-link" href="../">返回博客列表</a>
        <p class="eyebrow">${escapeHtml(post.category)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.summary)}</p>
        <div class="post-meta">
          <time datetime="${escapeAttribute(post.published)}">${escapeHtml(post.published)}</time>
          <div class="tag-list">${tags}</div>
        </div>
        <div class="markdown-panel">
${renderMarkdown(post.body)}
        </div>
      </article>
    </main>`,
  });
}

function resolveResourcesDir(siteDir, explicitDir) {
  const configuredDir = explicitDir || process.env.BLOG_RESOURCES_DIR;
  if (configuredDir) {
    return path.resolve(process.cwd(), configuredDir);
  }
  return path.join(siteDir, "posts");
}

function buildBlog({ resourcesDir, siteDir }) {
  if (!fs.existsSync(resourcesDir)) {
    throw new Error(
      `Blog resources directory does not exist: ${resourcesDir}. ` +
        "Create posts/*.md or pass a directory as the first argument."
    );
  }

  const posts = fs
    .readdirSync(resourcesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => parseMarkdownFile(path.join(resourcesDir, entry.name)))
    .filter(Boolean)
    .sort((a, b) => b.published.localeCompare(a.published));

  const seenSlugs = new Set();
  for (const post of posts) {
    if (seenSlugs.has(post.slug)) {
      throw new Error(`Duplicate post slug: ${post.slug}`);
    }
    seenSlugs.add(post.slug);
  }

  const generatedDir = path.join(siteDir, "generated");
  const blogDir = path.join(siteDir, "blog");
  fs.rmSync(generatedDir, { recursive: true, force: true });
  fs.rmSync(blogDir, { recursive: true, force: true });
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(blogDir, { recursive: true });

  fs.writeFileSync(
    path.join(generatedDir, "blog-index.json"),
    `${JSON.stringify(posts.map(blogIndexEntry), null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(path.join(blogDir, "index.html"), renderBlogIndex(posts), "utf8");

  for (const post of posts) {
    const postDir = path.join(blogDir, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, "index.html"), renderArticle(post), "utf8");
  }

  return posts;
}

module.exports = {
  buildBlog,
  extractFrontmatter,
  parseFrontmatter,
  parseMarkdownFile,
  resolveResourcesDir,
  validatePost,
};

if (require.main === module) {
  const siteDir = path.resolve(__dirname, "..");
  const resourcesDir = resolveResourcesDir(siteDir, process.argv[2]);
  const posts = buildBlog({ resourcesDir, siteDir });
  console.log(`Generated ${posts.length} published blog post(s).`);
}
