const fs = require("node:fs");
const path = require("node:path");

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function publicWikiTitle(target) {
  const withoutHeading = target.split("#")[0];
  const segments = withoutHeading.split("/");
  return segments[segments.length - 1] || target;
}

function publicMarkdownText(value) {
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) =>
    alias || publicWikiTitle(target)
  );
}

function inlineMarkdown(value) {
  const escaped = escapeHtml(publicMarkdownText(value));
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) =>
      `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${url}</a>`
  );
  return linked.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function shouldOmitPublicLine(line) {
  return (
    /^来源：\[\[raw\//.test(line) ||
    /^原文位置：\[\[raw\//.test(line) ||
    /^相关项目：\[\[/.test(line)
  );
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let unorderedListOpen = false;
  let orderedListOpen = false;
  let blockquoteOpen = false;
  let codeBlockOpen = false;
  let codeBlockClassName = "";
  let codeBlockLines = [];

  const closeUnorderedList = () => {
    if (unorderedListOpen) {
      html.push("</ul>");
      unorderedListOpen = false;
    }
  };

  const closeOrderedList = () => {
    if (orderedListOpen) {
      html.push("</ol>");
      orderedListOpen = false;
    }
  };

  const closeBlockquote = () => {
    if (blockquoteOpen) {
      html.push("</blockquote>");
      blockquoteOpen = false;
    }
  };

  const closeBlocks = () => {
    closeUnorderedList();
    closeOrderedList();
    closeBlockquote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (codeBlockOpen) {
      if (line.startsWith("```")) {
        html.push(
          `<pre><code${codeBlockClassName}>${codeBlockLines
            .map(escapeHtml)
            .join("\n")}\n</code></pre>`
        );
        codeBlockOpen = false;
        codeBlockClassName = "";
        codeBlockLines = [];
      } else {
        codeBlockLines.push(rawLine);
      }
      continue;
    }

    if (!line) {
      closeBlocks();
      continue;
    }

    if (shouldOmitPublicLine(line)) {
      continue;
    }

    if (line.startsWith("```")) {
      closeBlocks();
      const language = line.slice(3).trim();
      codeBlockClassName = language ? ` class="language-${escapeAttribute(language)}"` : "";
      codeBlockLines = [];
      codeBlockOpen = true;
      continue;
    }

    if (line.startsWith("### ")) {
      closeBlocks();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeBlocks();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeBlocks();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      closeOrderedList();
      closeBlockquote();
      if (!unorderedListOpen) {
        html.push("<ul>");
        unorderedListOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      closeUnorderedList();
      closeBlockquote();
      if (!orderedListOpen) {
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${inlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    if (line.startsWith("> ")) {
      closeUnorderedList();
      closeOrderedList();
      if (!blockquoteOpen) {
        html.push("<blockquote>");
        blockquoteOpen = true;
      }
      html.push(`<p>${inlineMarkdown(line.slice(2))}</p>`);
      continue;
    }

    closeBlocks();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  if (codeBlockOpen) {
    html.push(
      `<pre><code${codeBlockClassName}>${codeBlockLines
        .map(escapeHtml)
        .join("\n")}\n</code></pre>`
    );
  }
  closeBlocks();
  return html.join("\n");
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

function siteHeader(prefix) {
  return `<header class="site-header">
      <a class="brand" href="${prefix}index.html" aria-label="返回首页">夏目</a>
      <nav class="nav" aria-label="主导航">
        <a href="${prefix}index.html#positioning">定位</a>
        <a href="${prefix}index.html#services">服务</a>
        <a href="${prefix}index.html#resume">简历</a>
        <a href="${prefix}index.html#cases">案例</a>
        <a href="${prefix}blog/">文章</a>
        <a href="${prefix}index.html#contact">联系</a>
      </nav>
    </header>`;
}

function pageShell({ title, description, prefix, body, script }) {
  const scriptTag = script ? `\n    <script src="${script}"></script>` : "";
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}">
    <link rel="stylesheet" href="${prefix}styles.css">
  </head>
  <body>
    ${siteHeader(prefix)}
    ${body}
    <footer class="site-footer">
      <p>作者：夏目</p>
    </footer>${scriptTag}
  </body>
</html>
`;
}

function renderBlogIndex(posts) {
  const categories = [...new Set(posts.map((post) => post.category))];
  const filters = categories
    .map(
      (category) =>
        `<button type="button" data-category="${escapeAttribute(category)}">${escapeHtml(category)}</button>`
    )
    .join("\n          ");
  const cards = posts
    .map(
      (post) => `<article class="blog-card" data-category="${escapeAttribute(post.category)}">
          <p class="eyebrow">${escapeHtml(post.category)}</p>
          <h2><a href="./${escapeAttribute(post.slug)}/">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.summary)}</p>
          <time datetime="${escapeAttribute(post.published)}">${escapeHtml(post.published)}</time>
          <div class="tag-list">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </article>`
    )
    .join("\n        ");

  return pageShell({
    title: "文章 | 夏目",
    description: "夏目的 AI 工作流、自动化和职业转型文章。",
    prefix: "../",
    script: "../script.js",
    body: `<main class="content-section blog-index">
      <div class="section-heading">
        <p>Blog</p>
        <h1>文章</h1>
      </div>
      <div class="blog-filters" aria-label="文章分类筛选">
        <button type="button" data-category="all">全部</button>
          ${filters}
      </div>
      <div class="blog-list">
        ${cards}
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
    body: `<main class="content-section blog-article">
      <article>
        <a class="back-link" href="../">返回文章列表</a>
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

function buildBlog({ resourcesDir, siteDir }) {
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
  validatePost,
};

if (require.main === module) {
  const siteDir = path.resolve(__dirname, "..");
  const resourcesDir = path.resolve(siteDir, "..", "resources");
  const posts = buildBlog({ resourcesDir, siteDir });
  console.log(`Generated ${posts.length} published blog post(s).`);
}
