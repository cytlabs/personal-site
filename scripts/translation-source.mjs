import { createHash } from 'node:crypto';
export function translationSourceHash(post) {
  return createHash('sha256').update(JSON.stringify([post.title, post.summary, post.category, post.tags, post.body])).digest('hex');
}
