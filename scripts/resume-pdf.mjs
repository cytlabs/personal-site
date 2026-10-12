import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import pdf from '../vendor/jspdf-4.2.0.cjs';
import { resumeVersion } from './resume-content.mjs';

const root = path.resolve(import.meta.dirname, '..');
let fontData;
const ink = '#253a34', muted = '#607269', green = '#355b47';

// Pure Node generation keeps deployment independent of a browser or system fonts.
export async function generateResumePdf(data, outputFile) {
  fontData ||= fs.readFile(path.join(root, 'fonts/WenQuanYiZenHei.ttf.gz'))
    .then(bytes => gunzipSync(bytes).toString('base64'));
  const doc = new pdf.jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('ResumeChinese.ttf', await fontData);
  doc.addFont('ResumeChinese.ttf', 'ResumeChinese', 'normal');
  doc.setFont('ResumeChinese');
  doc.setProperties({ title: `${data.name}的简历`, author: data.name,
    subject: `resume-source-sha256:${resumeVersion(data)}`, creator: 'personal-site resume build' });
  // Fail rather than silently publishing blank glyphs after a content change.
  for (const character of new Set(JSON.stringify(data))) {
    if (!doc.getFont().metadata.characterToGlyph(character.codePointAt(0))) {
      throw new Error(`Resume PDF font does not support: ${character}`);
    }
  }

  const left = 16, right = 194, width = right - left, bottom = 279;
  let y = 21;
  let currentSection = '';
  const style = (size = 10.5, color = ink) => { doc.setFontSize(size); doc.setTextColor(color); };
  const ensure = height => {
    if (y + height > bottom) {
      doc.addPage(); y = 29;
      style(9, muted); doc.text(`${data.name} · ${currentSection}`, left, 16);
      doc.setDrawColor('#cbd5ce'); doc.line(left, 21, right, 21);
    }
  };
  const lines = (text, available = width, size = 10.5) => {
    style(size);
    // Wrap Chinese by character while keeping ordinary Latin words together.
    const tokens = text.match(/[A-Za-z0-9][A-Za-z0-9_./:+#-]*|[^\S\n]+|[^\s]/gu) || [];
    const rows = [];
    let row = '';
    for (const token of tokens) {
      if (row && doc.getTextWidth(row + token) > available) {
        if (/^[，。！？；：、）】》]$/u.test(token)) {
          const characters = [...row];
          const previous = characters.pop();
          rows.push(characters.join('').trimEnd()); row = previous;
        } else {
          rows.push(row.trimEnd()); row = '';
        }
      }
      if (doc.getTextWidth(token) > available) {
        for (const character of token) {
          if (row && doc.getTextWidth(row + character) > available) {
            rows.push(row); row = '';
          }
          row += character;
        }
      } else row += row ? token : token.trimStart();
    }
    if (row) rows.push(row.trimEnd());
    return rows;
  };
  const paragraph = (text, { indent = 0, size = 10.5, color = ink, gap = 5.3 } = {}) => {
    const rows = lines(text, width - indent, size);
    for (const row of rows) {
      ensure(gap); style(size, color); doc.text(row, left + indent, y); y += gap;
    }
  };
  const heading = (title, reserve = 35, link) => {
    currentSection = title;
    const previousPageCount = doc.getNumberOfPages();
    ensure(reserve);
    if (doc.getNumberOfPages() === previousPageCount) {
      y += 3;
      doc.setDrawColor('#cbd5ce'); doc.setLineWidth(0.25); doc.line(left, y - 5, right, y - 5);
    }
    style(13, ink); doc.text(title, left, y);
    if (link) {
      style(9, green); const label = '查看全部案例 →';
      doc.textWithLink(label, right - doc.getTextWidth(label), y, { url: link });
    }
    y += 9;
  };
  const entryHeight = (title, bullets, { role, url } = {}) => {
    const bodyHeight = bullets.reduce((sum, text) => sum + lines(text, width - 4).length * 5.3 + 1.4, 0);
    return lines(title, width - 64, 11).length * 5.7 + bodyHeight +
      (role ? lines(role, width, 9).length * 5.2 : 0) +
      (url ? lines(url, width - 4, 8.5).length * 4.5 + 2 : 0) + 6;
  };
  const entry = (title, date, bullets, { role, url } = {}) => {
    const titleRows = lines(title, width - 64, 11);
    const height = entryHeight(title, bullets, { role, url });
    // Keep an ordinary entry together; longer user content can flow over pages.
    ensure(Math.min(height, bottom - 29));
    style(11);
    for (const [index, row] of titleRows.entries()) {
      if (url) doc.textWithLink(row, left, y, { url }); else doc.text(row, left, y);
      if (index === 0) { style(9, muted); doc.text(date, right, y, { align: 'right' }); style(11); }
      y += 5.7;
    }
    if (role) paragraph(role, { size: 9, color: muted, gap: 5.2 });
    for (const text of bullets) {
      ensure(5.3); style(10.5); doc.text('·', left, y);
      paragraph(text, { indent: 4 }); y += 1.4;
    }
    if (url) {
      for (const row of lines(url, width - 4, 8.5)) {
        ensure(4.5); style(8.5, green);
        doc.textWithLink(row, left + 4, y, { url }); y += 4.5;
      }
      y += 2;
    }
    y += 6;
  };

  y = 24;
  style(25); doc.text(data.name, 105, y, { align: 'center' }); y += 10;
  const contacts = [
    { text: `Email：${data.email}`, url: `mailto:${data.email}` },
    { text: `微信：${data.wechat}` }, { text: data.github.replace('https://', ''), url: data.github },
    { text: `学历：${data.education}` },
  ];
  style(9.5, muted);
  const contactRows = [[]];
  const contactGap = 9;
  let rowWidth = 0;
  for (const item of contacts) {
    const itemWidth = doc.getTextWidth(item.text);
    if (itemWidth > width) throw new Error('Resume contact information exceeds PDF width');
    if (rowWidth && rowWidth + contactGap + itemWidth > width) {
      contactRows.push([]); rowWidth = 0;
    }
    contactRows.at(-1).push({ ...item, width: itemWidth });
    rowWidth += (rowWidth ? contactGap : 0) + itemWidth;
  }
  for (const row of contactRows) {
    const total = row.reduce((sum, item) => sum + item.width, 0) + (row.length - 1) * contactGap;
    let x = 105 - total / 2;
    for (const [index, item] of row.entries()) {
      if (index) { doc.setDrawColor('#cbd5ce'); doc.setLineWidth(0.2); doc.line(x - contactGap / 2, y - 3, x - contactGap / 2, y + 0.5); }
      if (item.url) doc.textWithLink(item.text, x, y, { url: item.url }); else doc.text(item.text, x, y);
      x += item.width + contactGap;
    }
    y += 6;
  }
  doc.setDrawColor('#cbd5ce'); doc.line(left, y + 1, right, y + 1);
  y += 10;
  paragraph(data.summary); y += 7;

  for (const section of data.sections) {
    if (section.id === 'capabilities') {
      const firstHeight = lines(data.capabilities[0].text, width - 37, 10).length * 5.2 + 3;
      heading(section.title, 12 + firstHeight);
      for (const item of data.capabilities) {
        const height = lines(item.text, width - 37, 10).length * 5.2 + 3;
        ensure(height); style(10.5); doc.text(item.label, left, y);
        paragraph(item.text, { indent: 37, size: 10, color: muted, gap: 5.2 }); y += 3;
      }
    } else if (section.id === 'experience') {
      const first = data.experiences[0];
      heading(section.title, 12 + entryHeight(first.title, first.bullets));
      for (const item of data.experiences) {
        entry(item.title, `${item.start.replaceAll('-', '.')} — ${item.end?.replaceAll('-', '.') || '至今'}`, item.bullets);
      }
    } else if (section.id === 'projects') {
      const first = data.projects[0];
      heading(section.title, 12 + entryHeight(first.title, first.bullets, { role: first.role, url: first.publicUrl }), data.allCasesUrl);
      for (const item of data.projects) {
        entry(item.title, `项目时间 · ${item.start.replaceAll('-', '.')}`, item.bullets,
          { role: item.role, url: item.publicUrl });
      }
    } else throw new Error(`Unknown resume section: ${section.id}`);
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page); style(8, muted);
    doc.text(`${data.name} · ${page} / ${count}`, right, 289, { align: 'right' });
  }
  const bytes = Buffer.from(doc.output('arraybuffer'));
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, bytes);
  return { pages: count, version: resumeVersion(data), bytes: bytes.length };
}
