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

    text.replace(/https?:\/\/[^\s<]+/g, (url, index) => {
      linked += escapeHtml(text.slice(lastIndex, index));
      linked += `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`;
      lastIndex = index + url.length;
      return url;
    });

    linked += escapeHtml(text.slice(lastIndex));
    return linked.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function shouldOmitPublicLine(line) {
    return (
      /^来源：\[\[raw\//.test(line) ||
      /^原文位置：\[\[raw\//.test(line) ||
      /^相关项目：\[\[/.test(line) ||
      /\/root\/code\//.test(line)
    );
  }

  function renderMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const html = [];
    let unorderedListOpen = false;
    let orderedListOpen = false;
    let blockquoteOpen = false;
    let codeBlockOpen = false;
    let codeBlockClassName = "";
    let codeBlockLines = [];

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

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (codeBlockOpen) {
        if (line.startsWith("```")) {
          html.push(
            `<pre><code${codeBlockClassName}>${codeBlockLines
              .map(escapeHtml)
              .join("\n")}\n</code></pre>`
          );
          codeBlockOpen = false;
          codeBlockClassName = "";
          codeBlockLines = [];
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

      if (line.startsWith("```")) {
        closeBlocks();
        const language = line.slice(3).trim();
        codeBlockClassName = language ? ` class="language-${escapeAttribute(language)}"` : "";
        codeBlockLines = [];
        codeBlockOpen = true;
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
      html.push(
        `<pre><code${codeBlockClassName}>${codeBlockLines
          .map(escapeHtml)
          .join("\n")}\n</code></pre>`
      );
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
