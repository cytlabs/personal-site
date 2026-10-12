import fs from 'node:fs/promises';
import path from 'node:path';

// Resolve the webpage from editable resume content and public project metadata.
export async function readResumeContent({ root, cases, base = '' }) {
  const data = JSON.parse(await fs.readFile(path.join(root, 'content/resume.json'), 'utf8'));
  const site = (await import(path.join(root, 'site.config.mjs'))).default;
  const model = {
    ...data,
    email: site.email,
    github: site.github,
    wechat: 'xiamudewx',
    sections: [
      { id: 'capabilities', title: '专业能力' },
      { id: 'experience', title: '工作经历' },
      { id: 'projects', title: '项目经历' },
    ],
    projects: data.projects.map(entry => {
      const item = cases.find(c => c.slug === entry.slug && c.publish !== false);
      if (!item) throw new Error(`Resume references unknown or unpublished project: ${entry.slug}`);
      return {
        ...entry, title: item.title, start: item.period.start,
        role: item.overview.find(field => field.label === '我的责任')?.value || item.kind,
        url: `${base}/cases/${item.slug}/`,
      };
    }),
  };
  return model;
}
