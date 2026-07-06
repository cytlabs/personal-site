# Personal Site

这是个人网站，目标是承接个人定位、关于我、案例和公开文章。站点不做登录、不做数据库、不提供博客增删改查；博客内容来自知识库中明确标记为公开发布的资源文件。

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
  scripts/
    build-blog.js
  assets/
    workflow-map.svg
  content/
    profile.md
    resume.md
    cases.md
    posts.md
```

## 使用方式

博客内容来自仓库根目录的 `resources/*.md`。只有 frontmatter 中包含 `publish: true` 的资源会被发布到网站。

发布字段示例：

```yaml
publish: true
slug: fde-local-delivery
title: FDE 与土 FDE：从工程师到现场交付
summary: 面向工程师的 FDE 转型理解与行动路径。
category: AI交付
tags: [FDE, AI交付, 职业转型]
published: 2026-07-06
```

生成博客页面：

```bash
npm run build:blog
```

运行测试：

```bash
npm test
```

本地预览：

```bash
npm run dev
```

访问：

```text
http://localhost:4173
```
