---
name: publish-blog
description: 为 personal-site 博客创建、修改或下架 Markdown 文章，校验静态构建，并按用户的发布指令通过 Git 提交发布。适用于可访问该仓库的 AI 编程工具。
---

# 发布博客

本 skill 随项目分发，可复制到 AI 工具的 skills 目录，或由工具直接读取本文件。需要仓库工作副本、Node.js 和 Git；远程提交使用工具环境中已有的 GitHub 身份认证，不需要博客数据库。不要索取或把 token 写进文章、命令参数或仓库。

在仓库根目录操作，先阅读 README.md，检查 `git status --short` 和目标文章。`posts/*.md` 是唯一文章源；`blog/`、`generated/` 和 `dist/` 是生成物。不要直接改生成页面或覆盖其他未提交修改。若存在 `BLOG_RESOURCES_DIR`，先确认构建使用的是这次编辑的源目录。

## 内容格式

新文章使用 UTF-8、LF 换行，frontmatter 从文件首行开始：

```markdown
---
publish: true
slug: stable-english-slug
title: 文章标题
summary: 准确概括文章主张与读者收益
category: AI交付
tags: [AI, FDE]
published: 2026-09-14
---

## 正文小标题

正文……
```

`published` 使用文章真实发布日期（示例日期不是默认值）；更新已有文章保留原发布日期和 slug。slug 必须是小写英文、数字和单个连字符组合，并在公开文章中唯一。解析器仅支持单行字段、布尔值和逗号分隔的内联数组，不支持完整 YAML、多行摘要或嵌套对象。页面已输出标题 H1，正文从 H2 开始。

草稿用 `publish: false`；下架优先将现有文章改为 `publish: false`，说明旧 URL 将不可访问。若用户要求改 slug，先处理旧 URL 的永久重定向，防止既有链接失效。

保持用户观点与事实边界；不编造亲历、数据、引用或作者资历。按读者问题组织标题、摘要、例子和来源链接，不堆关键词，不承诺 SEO 排名或 AI 引用。文章正文不要包含凭据和未授权公开的材料。

## 验证与发布

1. 完成源稿后运行 `npm test` 和 `npm run build`；若已知正式域名，通过 `SITE_URL` 环境变量传入。未配置时本地构建不生成依赖域名的 SEO 产物；Vercel production 构建要求配置。
2. 检查生成的目标页面、`generated/blog-index.json` 和 `git diff --stat`。草稿不应出现在列表或部署产物中。不提交 `dist/`。
3. 用户仅要求写作或修改时，保留本地结果；用户已明确要求发布时，在已有授权范围内提交本次源文件及相关已跟踪生成物，再推送到已确认的部署分支。不要假设远程默认分支、强制推送或把无关改动一起提交。提交权限或分支保护阻止发布时停止远程写入，说明原因并保留可审查结果。
4. 若 GitHub 已连接 Vercel，推送部署分支会触发构建。检查部署状态和最终文章 URL 后才能报告“已上线”；只有 Git 推送结果时报告“已推送，部署待确认”。构建或上线失败时报告具体错误，不反复盲目重试。

没有本地仓库的工具可以使用 GitHub Contents API 更新 `posts/`：必须先读取现有文件 SHA，更新时携带 SHA；并发冲突时重新读取并核对差异，不能覆盖他人变更。只把源稿写入已确认分支，让 Vercel 构建生成页面。接口参考：https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents 。这条路径需要工具自身具备 GitHub API 调用能力，本 skill 不提供身份凭据。
