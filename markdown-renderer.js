(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SiteMarkdown = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
    const text = publicMarkdownText(value);
    let linked = "";
    let lastIndex = 0;
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<)\]]+)/g;
    const formatText = (content) =>
      escapeHtml(content).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    text.replace(linkPattern, (match, label, markdownUrl, bareUrl, index) => {
      const url = markdownUrl || bareUrl;
      linked += formatText(text.slice(lastIndex, index));
      linked += `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${label ? formatText(label) : escapeHtml(url)}</a>`;
      lastIndex = index + match.length;
      return match;
    });

    linked += formatText(text.slice(lastIndex));
    return linked;
  }

  function shouldOmitPublicLine(line) {
    return (
      /^来源：\[\[raw\//.test(line) ||
      /^原文位置：\[\[raw\//.test(line) ||
      /^相关项目：\[\[/.test(line) ||
      /\/root\/code\//.test(line)
    );
  }

  function parseTableRow(line) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map((cell) => cell.trim());
  }

  function isTableDivider(line) {
    if (!line || !line.includes("|")) {
      return false;
    }
    const cells = parseTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function renderMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const html = [];
    let unorderedListOpen = false;
    let orderedListOpen = false;
    let blockquoteOpen = false;
    let codeBlockOpen = false;
    let codeBlockFence = "";
    let codeBlockLanguage = "";
    let codeBlockClassName = "";
    let codeBlockLines = [];

    const closeCodeBlock = () => {
      if (codeBlockLanguage.toLowerCase() === "mermaid") {
        html.push(`<pre class="mermaid">${codeBlockLines.map(escapeHtml).join("\n")}</pre>`);
      } else {
        html.push(
          `<pre><code${codeBlockClassName}>${codeBlockLines
            .map(escapeHtml)
            .join("\n")}\n</code></pre>`
        );
      }
      codeBlockOpen = false;
      codeBlockFence = "";
      codeBlockLanguage = "";
      codeBlockClassName = "";
      codeBlockLines = [];
    };

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

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const rawLine = lines[lineIndex];
      const line = rawLine.trim();

      if (codeBlockOpen) {
        const closingFenceMatch = line.match(/^(`{3,}|~{3,})\s*$/);
        const closesCurrentFence =
          closingFenceMatch &&
          closingFenceMatch[1][0] === codeBlockFence[0] &&
          closingFenceMatch[1].length >= codeBlockFence.length;
        if (closesCurrentFence) {
          closeCodeBlock();
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

      const codeFenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
      if (codeFenceMatch) {
        closeBlocks();
        codeBlockFence = codeFenceMatch[1];
        codeBlockLanguage = codeFenceMatch[2].trim();
        codeBlockClassName = codeBlockLanguage
          ? ` class="language-${escapeAttribute(codeBlockLanguage)}"`
          : "";
        codeBlockLines = [];
        codeBlockOpen = true;
        continue;
      }

      const nextLine = lines[lineIndex + 1]?.trim();
      if (line.includes("|") && isTableDivider(nextLine)) {
        closeBlocks();
        const headers = parseTableRow(line);
        const rows = [];
        lineIndex += 2;
        while (lineIndex < lines.length) {
          const rowLine = lines[lineIndex].trim();
          if (!rowLine || !rowLine.includes("|")) {
            lineIndex -= 1;
            break;
          }
          rows.push(parseTableRow(rowLine));
          lineIndex += 1;
        }
        if (lineIndex >= lines.length) {
          lineIndex = lines.length;
        }
        html.push("<div class=\"markdown-table-wrap\"><table>");
        html.push(`<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`);
        html.push("<tbody>");
        for (const row of rows) {
          html.push(`<tr>${headers.map((_header, index) => `<td>${inlineMarkdown(row[index] || "")}</td>`).join("")}</tr>`);
        }
        html.push("</tbody></table></div>");
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
      closeCodeBlock();
    }
    closeBlocks();
    return html.join("\n");
  }

  return {
    escapeAttribute,
    escapeHtml,
    inlineMarkdown,
    publicMarkdownText,
    renderMarkdown,
    shouldOmitPublicLine,
  };
});
