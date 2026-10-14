// Bundle Mermaid locally so case diagrams do not depend on an external CDN.
import mermaid from 'mermaid';
try {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: getComputedStyle(document.body).fontFamily, flowchart: { htmlLabels: false } });
  await document.fonts.ready;
  await mermaid.run({ querySelector: '.mermaid' });
  document.querySelectorAll('.mermaid svg').forEach(svg => {
    svg.style.minWidth = `${Math.ceil(svg.viewBox.baseVal.width)}px`;
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Project diagram' : '项目流程与关系图');
    svg.parentElement.setAttribute('tabindex', '0');
  });
} catch {
  document.querySelectorAll('pre.mermaid').forEach(element => {
    const notice = document.createElement('p');
    notice.className = 'quiet-note';
    notice.textContent = document.documentElement.lang === 'en'
      ? 'The diagram is unavailable. Its source is shown below.'
      : '图表暂时无法加载，下面保留了图表原文。';
    element.before(notice);
  });
}
