import { translate } from './i18n.js';
let rendererPromise;

// Load the local renderer only when the visitor requests an image.
function loadRenderer(doc) {
  if (doc.defaultView.html2canvas) return Promise.resolve(doc.defaultView.html2canvas);
  rendererPromise ||= new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = new URL('./html2canvas-1.4.1.min.js', import.meta.url).href;
    script.onload = () => {
      if (doc.defaultView.html2canvas) resolve(doc.defaultView.html2canvas);
      else { rendererPromise = null; script.remove(); reject(new Error('Image renderer unavailable')); }
    };
    script.onerror = () => {
      rendererPromise = null;
      script.remove();
      reject(new Error('Image renderer could not load'));
    };
    doc.head.append(script);
  });
  return rendererPromise;
}

export async function renderResumeImage(resume, rasterize) {
  const doc = resume.ownerDocument;
  await doc.fonts?.ready;
  const existingFrames = new Set(doc.querySelectorAll('.html2canvas-container'));
  const options = {
    backgroundColor: '#ffffff',
    scale: 2,
    windowWidth: 960,
    windowHeight: 1024,
    scrollX: 0,
    scrollY: 0,
    logging: false,
    ignoreElements: element => element.matches('.resume-case-link'),
    async onclone(cloneDoc, sheet) {
      cloneDoc.documentElement.dataset.theme = 'light';
      cloneDoc.documentElement.style.colorScheme = 'light';
      sheet.classList.add('resume-image-sheet');
      sheet.querySelectorAll('.resume-case-link').forEach(link => link.remove());
      cloneDoc.body.replaceChildren(sheet);
      await cloneDoc.fonts?.ready;
      const { width, height } = sheet.getBoundingClientRect();
      if (!width || !height) throw new Error('Empty resume image');
      // Bound long-image memory use, including on phones; preserve full height.
      options.scale = Math.min(2, Math.sqrt(5_000_000 / (width * height)), 32760 / width, 32760 / height);
    },
  };
  try {
    const canvas = await rasterize(resume, options);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Image encoding failed');
    return blob;
  } finally {
    // The renderer removes its frame on success; also clean up on failure.
    doc.querySelectorAll('.html2canvas-container').forEach(frame => {
      if (!existingFrames.has(frame)) frame.remove();
    });
  }
}

function downloadImage(blob, filename, doc) {
  const url = doc.defaultView.URL.createObjectURL(blob);
  const link = doc.createElement('a');
  link.href = url;
  link.download = filename;
  doc.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive while the browser starts saving the image.
  doc.defaultView.setTimeout(() => doc.defaultView.URL.revokeObjectURL(url), 60_000);
}

export function initializeResumeImageExport(doc, { renderer = loadRenderer, save = downloadImage } = {}) {
  const button = doc.querySelector('[data-export-resume-image]');
  const resume = doc.querySelector('.resume-document');
  if (!button || !resume) return;
  const label = button.querySelector('span');
  const status = doc.querySelector('[data-resume-export-status]');
  button.hidden = false;
  const exportImage = async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = translate('正在生成…', doc);
    status.hidden = false;
    status.textContent = translate('正在生成简历图片…', doc);
    try {
      const rasterize = await renderer(doc);
      const blob = await renderResumeImage(resume, rasterize);
      const name = resume.querySelector('h1').textContent.trim().replace(/[\\/:*?"<>|]/g, '');
      await save(blob, `${name}-${translate('简历', doc)}.png`, doc);
      status.textContent = translate('图片已生成，请在浏览器下载中查看。', doc);
    } catch {
      status.textContent = translate('图片生成失败，请重试。也可以使用“打印简历”保存 PDF。', doc);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      label.textContent = translate('导出图片', doc);
    }
  };
  button.addEventListener('click', exportImage);
  return exportImage;
}

if (typeof document !== 'undefined') initializeResumeImageExport(document);
