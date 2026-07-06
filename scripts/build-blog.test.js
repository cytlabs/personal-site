const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  buildBlog,
  extractFrontmatter,
  parseFrontmatter,
  parseMarkdownFile,
  validatePost,
} = require("./build-blog");

test("extractFrontmatter returns frontmatter and body from markdown fences", () => {
  const markdown = "---\ntitle: Hello\npublish: true\n---\n# Body\n\nText";

  assert.deepEqual(extractFrontmatter(markdown), {
    frontmatter: "title: Hello\npublish: true",
    body: "# Body\n\nText",
  });
});

test("parseFrontmatter supports booleans, strings, dates, and inline arrays", () => {
  const frontmatter = [
    "publish: true",
    "slug: career-transition",
    "title: AI Delivery",
    "summary: Practical notes",
    "category: FDE",
    "tags: [FDE, AI交付, 职业转型]",
    "published: 2026-07-06",
  ].join("\n");

  assert.deepEqual(parseFrontmatter(frontmatter), {
    publish: true,
    slug: "career-transition",
    title: "AI Delivery",
    summary: "Practical notes",
    category: "FDE",
    tags: ["FDE", "AI交付", "职业转型"],
    published: "2026-07-06",
  });
});

test("parseMarkdownFile returns null for unpublished markdown files", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-unpublished-"));
  const filePath = path.join(tempDir, "draft.md");
  fs.writeFileSync(
    filePath,
    "---\ntitle: Draft\npublish: false\n---\n# Draft\n",
    "utf8"
  );

  assert.equal(parseMarkdownFile(filePath), null);
});

test("validatePost throws when a published post is missing a required field", () => {
  assert.throws(
    () => validatePost({ publish: true, slug: "missing-title" }, "bad.md"),
    /bad.md is missing required field: title/
  );
});

test("buildBlog writes sorted blog index and article pages", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-build-"));
  const resourcesDir = path.join(tempDir, "resources");
  const siteDir = path.join(tempDir, "site");
  fs.mkdirSync(resourcesDir);
  fs.mkdirSync(siteDir);

  fs.writeFileSync(
    path.join(resourcesDir, "older.md"),
    [
      "---",
      "publish: true",
      "slug: older-post",
      "title: Older Post",
      "summary: Earlier notes",
      "category: Delivery",
      "tags: [FDE, AI交付]",
      "published: 2025-12-01",
      "---",
      "# Older Post",
      "",
      "Earlier body.",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(
    path.join(resourcesDir, "newer.md"),
    [
      "---",
      "publish: true",
      "slug: newer-post",
      "title: Newer Post",
      "summary: Later notes",
      "category: Strategy",
      "tags: [FDE, 职业转型]",
      "published: 2026-01-15",
      "---",
      "# Newer Post",
      "",
      "- item",
    ].join("\n"),
    "utf8"
  );

  const posts = buildBlog({ resourcesDir, siteDir });

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["newer-post", "older-post"]
  );

  const blogIndex = JSON.parse(
    fs.readFileSync(path.join(siteDir, "generated", "blog-index.json"), "utf8")
  );
  assert.equal(blogIndex[0].url, "./newer-post/");

  const articleHtml = fs.readFileSync(
    path.join(siteDir, "blog", "newer-post", "index.html"),
    "utf8"
  );
  assert.match(articleHtml, /<h1>Newer Post<\/h1>/);
  assert.match(articleHtml, /<li>item<\/li>/);
});
