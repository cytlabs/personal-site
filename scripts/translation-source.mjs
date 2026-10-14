import { createHash } from 'node:crypto';
export function translationSourceHash(post) {
  return createHash('sha256').update(JSON.stringify(post.markdown
    ? [post.title, post.description, post.category, post.status, post.period, post.overview, post.steps, post.body]
    : [post.title, post.summary, post.category, post.tags, post.body])).digest('hex');
}
