import mermaid from 'mermaid';

const english = document.documentElement.lang === 'en';
const diagrams = [...document.querySelectorAll('pre.mermaid')].map(element => ({
  element, source: element.textContent, control: null,
}));
let pending = Promise.resolve();
let activeDiagram;
let viewerNumber = 0;
const viewer = document.createElement('dialog');
viewer.className = 'diagram-viewer';
viewer.setAttribute('aria-labelledby', 'diagram-viewer-title');
viewer.innerHTML = `<div class="diagram-viewer-header"><h2 id="diagram-viewer-title">${english ? 'Project diagram' : '项目图表'}</h2><button type="button">${english ? 'Close' : '关闭'} <span aria-hidden="true">×</span></button></div><div class="diagram-viewer-canvas" tabindex="0"></div>`;
document.body.append(viewer);
viewer.querySelector('button').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  const box = viewer.getBoundingClientRect();
  if (event.target === viewer && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) viewer.close();
});
viewer.addEventListener('close', () => {
  document.body.style.overflow = '';
  activeDiagram?.control.focus();
});

function refreshViewer() {
  const original = activeDiagram?.element.querySelector('svg');
  if (!original) return;
  const svg = original.cloneNode(true);
  const elements = [svg, ...svg.querySelectorAll('*')];
  const ids = new Map(elements.filter(e => e.id).map(e => [e.id, `${e.id}-viewer-${++viewerNumber}`]));
  for (const element of elements) {
    if (element.id) element.id = ids.get(element.id);
    for (const attribute of [...element.attributes]) {
      if (attribute.name === 'id') continue;
      let value = attribute.value.replace(/url\(#([^)]*)\)/g, (all, id) => ids.has(id) ? `url(#${ids.get(id)})` : all);
      if (value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
      if (attribute.name.startsWith('aria-')) value = value.split(' ').map(id => ids.get(id) || id).join(' ');
      element.setAttribute(attribute.name, value);
    }
    if (element.tagName === 'style') element.textContent = element.textContent.replace(/#([\w-]+)/g, (all, id) => ids.has(id) ? '#' + ids.get(id) : all);
  }
  svg.style.width = `${Math.ceil(svg.viewBox.baseVal.width)}px`;
  viewer.querySelector('.diagram-viewer-canvas').replaceChildren(svg);
}

function updateScrollHints() {
  for (const diagram of diagrams) {
    const svg = diagram.element.querySelector('svg');
    if (!svg) continue;
    const style = getComputedStyle(diagram.element);
    const available = diagram.element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const {width, height} = svg.viewBox.baseVal;
    const mobile = available < 560;
    const scale = mobile ? 1 : Math.min(1, available / width, 460 / height);
    svg.style.width = `${width * scale}px`;
    const scrollable = diagram.element.scrollWidth > diagram.element.clientWidth + 1;
    diagram.element.tabIndex = scrollable ? 0 : -1;
    if (diagram.control) diagram.control.previousElementSibling.hidden = !scrollable;
  }
}

function renderDiagrams() {
  pending = pending.then(async () => {
    const style = getComputedStyle(document.documentElement);
    const color = name => style.getPropertyValue(name).trim();
    mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base', htmlLabels: false,
      fontFamily: getComputedStyle(document.body).fontFamily,
      themeVariables: {
        darkMode: document.documentElement.dataset.theme === 'dark', fontSize: '15px',
        background: color('--diagram-bg'), primaryColor: color('--diagram-node'),
        primaryTextColor: color('--ink'), primaryBorderColor: color('--diagram-border'),
        secondaryColor: color('--diagram-node'), secondaryTextColor: color('--ink'),
        tertiaryColor: color('--diagram-bg'), tertiaryTextColor: color('--ink'),
        lineColor: color('--diagram-line'), textColor: color('--ink'),
        mainBkg: color('--diagram-node'), nodeBorder: color('--diagram-border'),
        clusterBkg: color('--diagram-cluster'), clusterBorder: color('--diagram-border'),
        edgeLabelBackground: color('--diagram-bg'),
      },
      flowchart: { padding: 8, nodeSpacing: 18, rankSpacing: 24, curve: 'linear', wrappingWidth: 132 },
      themeCSS: '.node rect,.node polygon,.node path,.cluster rect{filter:none!important;stroke-width:1px}.node rect{rx:6px;ry:6px}.cluster rect{rx:8px;ry:8px}.flowchart-link{stroke-width:1.25px}',
    });
    for (const {element, source} of diagrams) {
      element.textContent = source;
      delete element.dataset.processed;
    }
    try {
      await document.fonts.ready;
      await mermaid.run({ nodes: diagrams.map(({element}) => element) });
      for (const diagram of diagrams) {
        const svg = diagram.element.querySelector('svg');
        if (!svg) continue;
        // Preserve natural size rather than stretching to fill the prose column.
        svg.style.width = `${Math.ceil(svg.viewBox.baseVal.width)}px`;
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', english ? 'Project diagram' : '项目流程与关系图');
        if (!diagram.control) {
          const actions = document.createElement('div');
          actions.className = 'diagram-actions';
          const hint = document.createElement('span');
          hint.textContent = english ? 'Scroll sideways to explore.' : '可左右滑动查看';
          diagram.control = document.createElement('button');
          diagram.control.type = 'button';
          diagram.control.textContent = english ? 'View larger ↗' : '查看大图 ↗';
          diagram.control.setAttribute('aria-haspopup', 'dialog');
          diagram.control.addEventListener('click', () => {
            activeDiagram = diagram;
            refreshViewer();
            viewer.showModal();
            document.body.style.overflow = 'hidden';
          });
          actions.append(hint, diagram.control);
          diagram.element.after(actions);
        }
        diagram.control.parentElement.hidden = false;
      }
      updateScrollHints();
      if (viewer.open) refreshViewer();
    } catch {
      for (const diagram of diagrams) {
        diagram.element.textContent = diagram.source;
        delete diagram.element.dataset.processed;
        if (diagram.control) diagram.control.parentElement.hidden = true;
      }
    }
  });
  return pending;
}

await renderDiagrams();
window.addEventListener('site-theme-change', renderDiagrams);
window.addEventListener('resize', updateScrollHints);
