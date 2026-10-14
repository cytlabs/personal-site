import fs from 'node:fs/promises';
import path from 'node:path';
import blog from './build-blog.js';
import { translationSourceHash } from './translation-source.mjs';
const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'content/en/posts.json');
const translations = JSON.parse(await fs.readFile(file, 'utf8'));
for (const post of blog.readPosts(blog.resolveResourcesDir(root))) {
  if (!translations[post.slug]) throw new Error(`Missing English metadata: ${post.slug}`);
  await fs.access(path.join(root, 'content/en/posts', `${post.slug}.md`));
  translations[post.slug].sourceHash = translationSourceHash(post);
}
await fs.writeFile(file, JSON.stringify(translations, null, 2) + '\n');
const caseFile = path.join(root, 'content/en/cases.json');
const caseTranslations = JSON.parse(await fs.readFile(caseFile, 'utf8'));
const cases = JSON.parse(await fs.readFile(path.join(root, 'content/case-studies.json'), 'utf8'));
for (const item of cases.filter(c => c.publish !== false && c.markdown)) {
  if (!caseTranslations[item.slug]) throw new Error(`Missing English case metadata: ${item.slug}`);
  await fs.access(path.join(root, 'content/en/cases', `${item.slug}.md`));
  caseTranslations[item.slug].sourceHash = translationSourceHash({...item,body:await fs.readFile(path.join(root, item.markdown), 'utf8')});
}
await fs.writeFile(caseFile, JSON.stringify(caseTranslations, null, 2) + '\n');
console.log('Recorded Chinese source versions for reviewed English translations.');
