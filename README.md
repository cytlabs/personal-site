# Personal Site

这是个人网站，目标是承接个人定位、关于我、案例和公开文章。当前使用 Git 管理内容，博客来自仓库内明确标记为公开发布的 Markdown 源稿。管理身份认证由 GitHub 承担，暂未实现站内登录、数据库或自建发布 API。

## AI 发布与后台选型

可复用 skill 位于 [`skills/publish-blog/SKILL.md`](skills/publish-blog/SKILL.md)。让其他 AI 工具读取该文件并操作本仓库，或把整个 `publish-blog` 文件夹复制到该工具支持的 skills 目录。它支持写作、修改、下架、构建验证和按指令提交发布；工具需要自行具备文件操作、命令执行及 GitHub 认证能力。

现有发布链路：AI 修改 `posts/*.md` → 本地校验 → GitHub 提交 → 已连接的 Vercel 自动构建。无本地工作副本时也可以调用 GitHub Contents API 写 Markdown，仓库即内容存储，因此“有发布接口”不意味着必须引入数据库。Skill 是操作说明，不是认证服务或 HTTP 接口。

如果需要独立网页登录和即时发布，可增加管理员身份认证、服务端发布接口和持久化存储；需要多用户权限、评论或复杂查询时再引入数据库。Next.js 可以承载这些功能，但并非 SEO 的前提。不要把 Vercel 函数本地文件当作持久化数据库。

## SEO 与 GEO

正文已在构建时渲染为完整 HTML，无需为了搜索引擎读取文章而迁移框架。完整构建额外在 `dist/` 生成：

- 博客、关于、案例及已发布文章的绝对 canonical 和 Open Graph 元信息。
- 文章 BlogPosting JSON-LD，包含真实标题、摘要、作者、发布日期和标签。
- `sitemap.xml` 与引用 sitemap 的 `robots.txt`，不包含草稿或 Markdown 源文件。
- Vercel 将 `/` 永久重定向到 `/blog/`，保留所有现有文章地址。

在 Vercel 环境变量中设置 `SITE_URL` 为真实正式域名（例如 `https://your-domain.com`，不要带路径），然后重新构建。不要使用临时预览域名作为 SITE_URL。Vercel production 构建缺少该配置会报错；本地未配置时仍可预览，但跳过依赖域名的 SEO 输出。SEO 元信息在完整构建的 `dist/` 中，`build:blog` 只生成文章源页面。

本地检查完整部署产物：

```bash
SITE_URL=https://your-domain.com npm run build
python3 -m http.server 4173 --directory dist
```

上线后在 Search Console 验证域名、提交 `/sitemap.xml`，检查文章索引状态。GEO 的内容工作应持续补充原创案例、可验证的数据与来源、清晰的作者介绍和有用的内链；技术改造不保证收录、排名或 AI 引用。Google 的 AI 搜索仍沿用 SEO 基础，没有必须使用的 GEO 特殊标签或 llms.txt。

参考：[Google AI 搜索指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)、[Next.js 渲染与 SEO](https://nextjs.org/learn/seo/rendering-strategies)、[GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。

## 文件结构

```text
personal-site/
  index.html
  about/
    index.html
  blog/
    index.html
    <slug>/
      index.html
  generated/
    blog-index.json
  styles.css
  script.js
  markdown-renderer.js
  scripts/
    build-blog.js
  assets/
    delivery-map.svg
  posts/
    <slug>.md
  content/
    profile.md
    resume.md
    cases.md
    posts.md
```

## 源文件与生成物

- `posts/*.md` 是博客源稿，应该手动维护并提交。
- `blog/` 和 `generated/blog-index.json` 是生成物，由 `npm run build:blog` 重建。
- `index.html`、`about/index.html`、`cases/index.html` 是手写静态页面。
- `markdown-renderer.js` 是前端和构建脚本共享的 Markdown 渲染器，避免两套渲染规则不一致。

## 使用方式

博客内容默认来自仓库根目录的 `posts/*.md`。只有 frontmatter 中包含 `publish: true` 的资源会被发布到网站。

发布字段示例：

```yaml
publish: true
slug: fde-and-local-fde
title: FDE 与土 FDE：把工程能力带到业务现场
summary: FDE 的核心不是会写更多代码，而是在真实业务现场里识别关键动作、切出可验证闭环，并用工程方法把价值交付出来。
category: AI交付
tags: [FDE, AI交付, 业务调研]
published: 2026-07-08
```

生成博客页面：

```bash
npm run build:blog
```

也可以临时指定外部资源目录：

```bash
node scripts/build-blog.js ../AiKnowledgebase/resources
```

或使用环境变量：

```bash
BLOG_RESOURCES_DIR=../AiKnowledgebase/resources npm run build:blog
```

运行测试：

```bash
npm test
```

构建部署产物：

```bash
npm run build
```

`npm run build` 会先生成博客页面，再把公开静态文件复制到 `dist/`。Vercel 部署时使用 `vercel.json` 中的配置：构建命令为 `npm run build`，输出目录为 `dist`。

本地预览：

```bash
npm run dev
```

访问：

```text
http://localhost:4173
```

## 部署到 Vercel

推荐使用 GitHub 连接 Vercel：

1. 把仓库推到 GitHub。
2. 在 Vercel 里选择 Add New Project，导入这个仓库。
3. Framework Preset 选择 Other。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。
6. 点击 Deploy。

项目已经包含 `vercel.json`，正常情况下 Vercel 会自动读取上面的构建配置。之后每次 push 到主分支都会自动触发一次生产部署，Pull Request 会生成预览部署。

也可以用 CLI：

```bash
npm i -g vercel
vercel --prod
```
