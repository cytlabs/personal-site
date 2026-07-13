# Personal Site

这是个人网站，目标是承接个人定位、关于我、案例和公开文章。站点不做登录、不做数据库、不提供博客增删改查；博客内容来自仓库内明确标记为公开发布的 Markdown 源稿。

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
