---
name: publish-blog
description: 操作夏目的 personal-site 博客项目，自动定位或克隆仓库，创建、修改、下架 Markdown 文章，验证构建，并按已获授权通过 Git 推送发布到 xiamu.cc。用于博客更新与发布，不代替选题和文章写作方法。
---

# 夏目的博客发布

## 项目连接

- 默认工作副本：`/root/code/personal-site`。
- GitHub：`cytlabs/personal-site`；SSH 地址 `git@github.com:cytlabs/personal-site.git`，HTTPS 地址 `https://github.com/cytlabs/personal-site.git`。
- 正式博客：`https://www.xiamu.cc/blog/`；正式构建域名：`https://www.xiamu.cc`。
- 当前生产分支为 `main`，推送后由已连接的 Vercel 自动构建。每次操作先核对远程、分支及项目配置，不能将默认分支自动等同生产分支。

先检查默认路径；不存在时用当前环境已有的 GitHub 认证克隆：

```bash
git clone git@github.com:cytlabs/personal-site.git /root/code/personal-site
```

SSH 不可用时可用上述 HTTPS 地址。其他环境可选择有写权限的工作目录，并记录实际路径。目标路径已存在但不是该仓库时，不覆盖它，另选目录。身份认证使用工具环境已有配置，不索取或把 token 写入文章、仓库或命令参数。

进入仓库后读取适用的 `AGENTS.md`、`README.md`、`package.json`、`vercel.json` 和本次目标文章，检查 `git status --short`、当前分支、origin 与远程进展。干净且位于确认的生产分支时可用 `git pull --ff-only origin main` 同步；有无关修改或分叉时使用独立副本处理，不覆盖或强制重置。

## 文章源稿与审核

`posts/*.md` 是文章源；`blog/`、`generated/` 和 `dist/` 是生成物。文章写作按当前能力目录获取适用方法；本 Skill 负责项目操作。

Digital Self 中的 `TASK-BLOG-ARTICLES` 保存现有草稿、来源审核、反馈和历史，可用 `ds tasks get TASK-BLOG-ARTICLES` 获取。记录可能很长，按当前字段读取；历史路径只是归档标识，不代表本地文件仍存在。用户直接给出明确稿件时不必读取全部历史。

用户要求写作、测试 Skill，或说“这篇不错”，不自动授权公开发布文章。已有明确发布或更新授权时直接执行该范围，不重复确认。审核后实质改变文章需重新审核；保存 Skill 与公开文章是不同操作。

草稿保存在非公开位置。`publish: false` 只阻止进入静态站点，不会隐藏已推送到 GitHub 的 Markdown；向远程提交草稿前仍需符合内容可公开范围。下架将已公开源稿改为 `publish: false`，原 URL 会消失，但不会抹去 Git 历史。

## 源稿格式

UTF-8、LF 换行，frontmatter 从首行开始。草稿模板：

```markdown
---
publish: false
slug: stable-english-slug
title: 文章标题
summary: 准确概括正文主张
category: AI实践
tags: [AI, 个人实践]
---

## 正文小标题

正文……
```

正式发布时设 `publish: true`，并填写 `published: YYYY-MM-DD`，值为真实首次发布日期。更新已有文章保留原发布日期和 slug。slug 仅用小写英文字母、数字和单个连字符，在公开文章中唯一。改文件名不必改 slug；确需改公开地址时在 `vercel.json` 配置旧地址到新地址的永久重定向，并纳入本次检查。

解析器不是完整 YAML：支持单行字段、布尔值、逗号分隔内联数组；不支持多行摘要或嵌套对象。页面模板已有 H1，导入文章时移除正文中重复的标题 H1，正文小标题从 H2 开始。来源审计与内部状态不混入公开正文；保留事实、引用归属与必要限定。

## 本地验证

在仓库根目录运行：

```bash
npm test
env -u BLOG_RESOURCES_DIR SITE_URL=https://www.xiamu.cc npm run build
```

当前项目无需第三方 npm 依赖，Node.js 与 Git 即可执行；若 package.json 后续新增依赖，按项目锁文件安装。完整构建会重建已跟踪的 `blog/` 和 `generated/blog-index.json`，并输出忽略跟踪的 `dist/`。上述命令明确使用本仓库 `posts/`；仅在任务确实使用外部源目录时保留 `BLOG_RESOURCES_DIR`。

检查目标页面 `dist/blog/<slug>/index.html` 的正文、标题与链接，核对列表、`dist/generated/blog-index.json`、canonical、`dist/sitemap.xml`。草稿或下架文章不应出现在这些产物中；既有其他文章仍须保留。预览部署产物可运行 `python3 -m http.server 4173 --directory dist`。

构建会跳过 `publish: false` 文件，草稿构建通过不代表其发布元数据有效。需要预览草稿或测试发布链路时，在独立临时副本中补齐元数据并暂设 `publish: true`，检查生成结果；测试副本不推送。可再改回 false 验证旧页面清理。Skill 测试不靠向生产发送测试文章完成。

## 提交与上线

获得本次发布授权后，核对 `git diff` 与 `git status --short`，只暂存本次源稿和相关生成物；下架时包含对应生成页面的删除。不要提交 `dist/` 或无关修改。检查暂存差异后提交，再执行明确目标的 `git push origin main`；如实际部署分支已变，使用确认后的分支。

推送前确认本地待推送的提交都属于授权范围。远程有新提交时先获取并核对，在独立干净副本合并处理，重跑受影响检查；不强制推送。认证、分支保护或构建失败时保留工作结果并报告具体阻碍，不盲目重试。

推送成功仅表示代码已上传。通过可用的部署状态检查与正式文章 URL 回读，确认新版本正文、列表和地址后，才能报告已上线；仅见旧页面或尚无部署结果时报告已推送、部署待确认。记录提交号、文章 URL、审核版本和验证结果到当前任务，供后续会话接续。
