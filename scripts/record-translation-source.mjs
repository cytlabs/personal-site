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
console.log('Recorded Chinese source versions for reviewed English translations.');
