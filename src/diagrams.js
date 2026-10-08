// Preserve the existing Mermaid integration; the source stays readable if the CDN fails.
try {
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
  await mermaid.run({ querySelector: '.mermaid' });
} catch {
  document.querySelectorAll('pre.mermaid').forEach(element => {
    const notice = document.createElement('p');
    notice.className = 'quiet-note';
    notice.textContent = '图表暂时无法加载，下面保留了图表原文。';
    element.before(notice);
  });
}
