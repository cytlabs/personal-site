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

test("validatePost rejects invalid real calendar dates", () => {
  assert.throws(
    () =>
      validatePost(
        {
          publish: true,
          slug: "bad-date",
          title: "Bad Date",
          summary: "Invalid date example",
          category: "Delivery",
          tags: ["FDE"],
          published: "2026-02-30",
        },
        "bad-date.md"
      ),
    /bad-date.md has invalid field: published/
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
  assert.equal(fs.existsSync(path.join(siteDir, "blog", "index.html")), true);

  const articleHtml = fs.readFileSync(
    path.join(siteDir, "blog", "newer-post", "index.html"),
    "utf8"
  );
  assert.match(articleHtml, /<h1>Newer Post<\/h1>/);
  assert.match(articleHtml, /<li>item<\/li>/);
});

test("buildBlog escapes hostile values in generated HTML", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-escape-"));
  const resourcesDir = path.join(tempDir, "resources");
  const siteDir = path.join(tempDir, "site");
  fs.mkdirSync(resourcesDir);
  fs.mkdirSync(siteDir);

  fs.writeFileSync(
    path.join(resourcesDir, "hostile.md"),
    [
      "---",
      "publish: true",
      "slug: hostile-post",
      'title: Hostile <script>alert("title")</script> & "Title"',
      'summary: Summary <script>alert("summary")</script> & "Summary"',
      'category: Category <script>alert("category")</script> & "Category"',
      'tags: [Tag <script>alert("tag")</script> & "Tag"]',
      "published: 2026-03-01",
      "---",
      '# Body <script>alert("body")</script> & "Body"',
      "",
      'Paragraph <script>alert("paragraph")</script> & "Paragraph"',
    ].join("\n"),
    "utf8"
  );

  buildBlog({ resourcesDir, siteDir });

  const indexHtml = fs.readFileSync(path.join(siteDir, "blog", "index.html"), "utf8");
  const articleHtml = fs.readFileSync(
    path.join(siteDir, "blog", "hostile-post", "index.html"),
    "utf8"
  );
  const combinedHtml = `${indexHtml}\n${articleHtml}`;

  assert.doesNotMatch(combinedHtml, /<script>alert\("title"\)<\/script>/);
  assert.doesNotMatch(combinedHtml, /<script>alert\("summary"\)<\/script>/);
  assert.doesNotMatch(combinedHtml, /<script>alert\("category"\)<\/script>/);
  assert.doesNotMatch(combinedHtml, /<script>alert\("tag"\)<\/script>/);
  assert.doesNotMatch(combinedHtml, /<script>alert\("body"\)<\/script>/);
  assert.doesNotMatch(combinedHtml, /<script>alert\("paragraph"\)<\/script>/);
  assert.match(
    combinedHtml,
    /Hostile &lt;script&gt;alert\(&quot;title&quot;\)&lt;\/script&gt; &amp; &quot;Title&quot;/
  );
  assert.match(
    combinedHtml,
    /Summary &lt;script&gt;alert\(&quot;summary&quot;\)&lt;\/script&gt; &amp; &quot;Summary&quot;/
  );
  assert.match(
    combinedHtml,
    /Category &lt;script&gt;alert\(&quot;category&quot;\)&lt;\/script&gt; &amp; &quot;Category&quot;/
  );
  assert.match(
    combinedHtml,
    /Tag &lt;script&gt;alert\(&quot;tag&quot;\)&lt;\/script&gt; &amp; &quot;Tag&quot;/
  );
  assert.match(
    articleHtml,
    /Body &lt;script&gt;alert\(&quot;body&quot;\)&lt;\/script&gt; &amp; &quot;Body&quot;/
  );
  assert.match(
    articleHtml,
    /Paragraph &lt;script&gt;alert\(&quot;paragraph&quot;\)&lt;\/script&gt; &amp; &quot;Paragraph&quot;/
  );
});

test("buildBlog removes stale generated outputs without deleting unrelated site files", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-clean-"));
  const resourcesDir = path.join(tempDir, "resources");
  const siteDir = path.join(tempDir, "site");
  fs.mkdirSync(resourcesDir);
  fs.mkdirSync(path.join(siteDir, "generated"), { recursive: true });
  fs.mkdirSync(path.join(siteDir, "blog", "stale-post"), { recursive: true });
  fs.mkdirSync(path.join(siteDir, "assets"), { recursive: true });

  fs.writeFileSync(path.join(siteDir, "generated", "stale.json"), "stale", "utf8");
  fs.writeFileSync(path.join(siteDir, "blog", "stale.html"), "stale", "utf8");
  fs.writeFileSync(
    path.join(siteDir, "blog", "stale-post", "index.html"),
    "stale",
    "utf8"
  );
  fs.writeFileSync(path.join(siteDir, "keep.txt"), "keep", "utf8");
  fs.writeFileSync(path.join(siteDir, "assets", "keep.txt"), "keep", "utf8");
  fs.writeFileSync(
    path.join(resourcesDir, "fresh.md"),
    [
      "---",
      "publish: true",
      "slug: fresh-post",
      "title: Fresh Post",
      "summary: Fresh summary",
      "category: Delivery",
      "tags: [FDE]",
      "published: 2026-04-01",
      "---",
      "# Fresh Post",
    ].join("\n"),
    "utf8"
  );

  buildBlog({ resourcesDir, siteDir });

  assert.equal(fs.existsSync(path.join(siteDir, "generated", "stale.json")), false);
  assert.equal(fs.existsSync(path.join(siteDir, "blog", "stale.html")), false);
  assert.equal(
    fs.existsSync(path.join(siteDir, "blog", "stale-post", "index.html")),
    false
  );
  assert.equal(fs.readFileSync(path.join(siteDir, "keep.txt"), "utf8"), "keep");
  assert.equal(
    fs.readFileSync(path.join(siteDir, "assets", "keep.txt"), "utf8"),
    "keep"
  );
  assert.equal(fs.existsSync(path.join(siteDir, "blog", "fresh-post", "index.html")), true);
});
