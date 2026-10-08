# Personal Site

这是个人网站，目标是承接个人定位、关于我、案例和公开文章。当前使用 Git 管理内容，博客来自仓库内明确标记为公开发布的 Markdown 源稿。管理身份认证由 GitHub 承担，暂未实现站内登录、数据库或自建发布 API。

## AI 发布与后台选型

可复用 skill 位于 [`skills/publish-blog/SKILL.md`](skills/publish-blog/SKILL.md)。让其他 AI 工具读取该文件并操作本仓库，或把整个 `publish-blog` 文件夹复制到该工具支持的 skills 目录。它支持写作、修改、下架、构建验证和按指令提交发布；工具需要自行具备文件操作、命令执行及 GitHub 认证能力。

现有发布链路：AI 修改 `posts/*.md` → 本地校验 → GitHub 提交 → 已连接的 Vercel 自动构建。无本地工作副本时也可以调用 GitHub Contents API 写 Markdown，仓库即内容存储，因此“有发布接口”不意味着必须引入数据库。Skill 是操作说明，不是认证服务或 HTTP 接口。

如果需要独立网页登录和即时发布，可增加管理员身份认证、服务端发布接口和持久化存储；需要多用户权限、评论或复杂查询时再引入数据库。Next.js 可以承载这些功能，但并非 SEO 的前提。不要把 Vercel 函数本地文件当作持久化数据库。

## SEO 与 GEO

正文已在构建时渲染为完整 HTML，无需为了搜索引擎读取文章而迁移框架。完整构建额外在 `dist/` 生成：

- 首页、博客（含分页）、关于、案例、探索及已发布文章的绝对 canonical 和 Open Graph 元信息。
- 文章 BlogPosting JSON-LD，包含真实标题、摘要、作者、发布日期和标签。
- `sitemap.xml` 与引用 sitemap 的 `robots.txt`，不包含草稿或 Markdown 源文件。
- `/` 展示 personal-home 的新首页，`/blog/` 及全部文章、分页地址保持不变。新增 `/explore/`、案例详情和 RSS。

在 Vercel 环境变量中设置 `SITE_URL` 为真实正式域名（例如 `https://your-domain.com`，不要带路径），然后重新构建。不要使用临时预览域名作为 SITE_URL。Vercel production 构建缺少该配置会报错；本地未配置时仍可预览，但跳过依赖域名的 SEO 输出。SEO 元信息在完整构建的 `dist/` 中，`build:blog` 只生成文章源页面。

本地检查完整部署产物：

```bash
SITE_URL=https://your-domain.com npm run build
python3 -m http.server 4173 --directory dist
```

上线后在 Search Console 验证域名、提交 `/sitemap.xml`，检查文章索引状态。GEO 的内容工作应持续补充原创案例、可验证的数据与来源、清晰的作者介绍和有用的内链；技术改造不保证收录、排名或 AI 引用。Google 的 AI 搜索仍沿用 SEO 基础，没有必须使用的 GEO 特殊标签或 llms.txt。

参考：[Google AI 搜索指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)、[Next.js 渲染与 SEO](https://nextjs.org/learn/seo/rendering-strategies)、[GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。

## UI 整合（2026-10-08）

以 `cytlabs/personal-site` 为内容与部署仓库，迁入 `cytlabs/personal-home` 的界面和房间交互（来源提交 `d627a5f9de93cc68fbedc997740e9afeeb9bad59`）。

- 首页、文章、案例、关于和探索页共用浅绿 / 深色主题与移动端布局。
- `posts/*.md`、`publish: true`、slug、日期、标签和原有 `/blog/<slug>/` 地址保持不变；列表仍按每页 6 篇静态分页，无 JavaScript 时可以阅读、翻页。
- 搜索与分类覆盖所有已发布文章，包括其他分页；搜索加载失败时保留当前页及翻页入口。
- 原关于页正文、联系方式和锚点迁至 `content/about.html`；原案例正文迁至 `content/case-studies.json`，详情页位于 `/cases/<id>/`。原 Markdown 资料继续保留。
- 3D 房间的书架、电脑和手记使用真实文章、案例与摘录；WebGL 不可用时仍能通过按钮浏览内容。房间脚本只在 `/explore/` 加载。
- 保留原 Markdown 公开内容过滤、表格、代码块、Mermaid、BlogPosting、canonical 和 sitemap，增加 `/feed.xml`。Mermaid 沿用原站 CDN，加载失败显示原文。

新增案例来自 `cytlabs/enterprise-ai-practice` 的 `543b75b31218cbc0309b335863931b51ea7f886b`：猎头招聘交付与达人营销交付。两篇案例进入首页精选、案例列表、详情与房间工作台；正文附原始材料链接，保留阶段说明和效果数据口径。

新增 99MedPass 医疗服务、VOWSCENE 婚纱摄影与 Intent 个人 AI 三个自主项目，与简历项目合计九个案例。首页仅展示两个企业实践，其他通过“查看更多”进入案例列表，案例列表、详情页、房间工作台与 sitemap 自动接入。三个项目各有独立 SVG 封面，详情注明当前阶段：官网与流程原型、品牌官网与产品设计、产品定义与架构设计。内容依据各项目当前仓库资料整理，不把原型、前端演示或规划写成已上线能力。

另按用户提供的简历新增四个项目：企业级容器平台建设与应用迁移（2021.12—2022.03）、企业级 GitOps 发布平台建设（2022.03—2022.05）、多云资源管理平台（2024.06—2024.11）、KeySafe（2024.12 起）。已移除营销 Brief、技术支持 SOP Copilot、订单对账异常助手和 GitOps 发布控制台四个旧案例，原详情路径不再生成。`period` 字段管理时间范围与口径，首页卡片、案例列表、详情与房间工作台均显示时间。完整项目日期、阶段记录月份与未提供日期分开呈现；KeySafe 的“至今”不自动延长至当前日期。成果数据按简历记录呈现。医疗详情提供官网、手机原型与完整服务原型入口。

维护位置：`site.config.mjs`（首页介绍）、`src/styles.css`（样式）、`src/main.js`（搜索及主题按钮）、`src/room*.js`（房间）、`content/room.json`（房间便签）。`npm run build:blog` 是兼容旧发布工具的生成步骤；完整预览与部署使用 `npm run build`。

使用 Node.js 22 或更新版本：

```bash
npm ci
npm run check
npm run dev
# http://localhost:4173
```

`npm run preview` 只预览已有 `dist/`。`SITE_URL` 继续使用正式站点域名；可选 `BASE_PATH` 支持子目录部署。生产部署仍由现有 Vercel 项目构建，无需新建托管项目。

自动检查包含原有发布、分页、SEO 测试，以及正文保留、跨页搜索、搜索失败、主题持久化和房间无 WebGL 交互的 DOM 测试。DOM 测试不等同于真实浏览器或 WebGL 渲染验收。

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
- 新 UI 的唯一构建入口是 `scripts/build.mjs`，模板读取 `posts/*.md`、`content/about.html` 和 `content/case-studies.json`。
- 根目录旧 HTML、`blog/` 及旧样式保留用于内容对照与兼容；部署和本地预览均使用 `dist/`，不要直接预览仓库根目录。
- `markdown-renderer.js` 是前端和构建脚本共享的 Markdown 渲染器，避免两套渲染规则不一致。

博客列表每页显示 6 篇，按发布日期倒序排列。第一页位于 `/blog/`，后续页位于 `/blog/page/2/` 等地址；分页在构建时生成，无需 JavaScript 即可翻页。每页篇数在 `scripts/blog-pagination.js` 的 `BLOG_PAGE_SIZE` 中调整，完整构建会为分页生成独立 canonical 和 sitemap 条目。

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

`npm run build` 会读取现有发布字段，以 personal-home 的 UI 生成全部公开页面到 `dist/`，并打包仅供探索页使用的 Three.js。Vercel 部署时使用 `vercel.json` 中的配置：构建命令为 `npm run build`，输出目录为 `dist`。

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
