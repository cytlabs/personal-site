const files = {
  profile: "./content/profile.md",
  services: "./content/services.md",
  resume: "./content/resume.md",
  cases: "./content/cases.md",
};

const fallback = {
  profile: `# 个人定位

我有近 7 年 DevOps / 运维 / 技术支持和远程技术交付经验，现在专注把企业里的重复流程、知识库、文档处理、客户沟通和运营任务，做成可落地的 AI 工作流和自动化工具。

## 我适合解决的问题

- 企业流程里有大量重复沟通、重复整理、重复排查。
- SOP 和经验沉淀在个人脑子里，没有变成团队资产。
- AI 工具停留在聊天层，没有进入真实业务流程。
- 小团队需要一个能同时理解需求、工程、交付和稳定性的人。

## 当前主线

当前阶段先恢复稳定现金流，优先寻找远程技术岗位，同时把 AI 工作流、自动化工具、项目案例和公开内容沉淀成长期职业资产。`,
  services: `# 服务方向

## AI 工作流落地

从一个最小闭环开始，把自然语言输入、规则判断、AI 生成、人工确认和异常处理串成可演示流程。

## 企业知识库 / SOP 自动化

把常见问题、排查步骤、标准回复和复盘文档整理成知识库，再接入问答、工单总结和 SOP 推荐。

## 内部工具与自动化脚本

优先做轻量原型，先验证能否节省时间，再决定是否产品化。`,
  resume: `# 简历概览

夏目，近 7 年技术岗位经验，方向是 DevOps / 技术支持 / 自动化 / 企业 AI 工具落地。

## 求职方向

- 远程 DevOps / SRE / 运维开发
- 技术支持 / 解决方案支持 / AI 应用实施
- 全栈工程师 / 企业 AI 产品 / AI Workflow 开发

## 核心技能

- Linux、Nginx、Docker、Kubernetes
- CI/CD、GitOps、ArgoCD、Jenkins、GitLab CI
- Python / Shell 自动化
- React / Next.js / TypeScript
- OpenAI / Claude API、Prompt、结构化输出、Dify Workflow`,
  cases: `# 代表案例

## 达人营销 AI 工作流

把客户 Brief 处理、项目启动、达人匹配、外联话术和异常提醒拆成可执行 AI Workflow。

## KeySafe 去中心化密码管理工具

Next.js + PostgreSQL / Prisma + 钱包登录 + AES-256-GCM + IPFS 的全栈原型。

## Job Search Materials Skill

把求职资料、技能矩阵、项目故事、简历版本和面试话术生成流程标准化。`,
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inlineMarkdown(value) {
  const escaped = escapeHtml(value);
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>'
  );
  return linked.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");
}

async function loadMarkdown(key) {
  try {
    const response = await fetch(files[key], { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load ${files[key]}`);
    }
    return await response.text();
  } catch {
    return fallback[key] || "";
  }
}

async function hydrate() {
  const panels = document.querySelectorAll("[data-md]");
  for (const panel of panels) {
    const key = panel.getAttribute("data-md");
    const markdown = await loadMarkdown(key);
    panel.innerHTML = renderMarkdown(markdown);
  }
}

hydrate();
