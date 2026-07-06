# Personal Site Blog Redesign

Date: 2026-07-06

## Goal

Refactor `personal-site` from a single-page career site into a lightweight personal site that can publish selected knowledge-base resources as public blog content.

The site should keep serving career and collaboration needs while gradually becoming a public knowledge asset. The knowledge base remains the source of truth. The website is only the public presentation layer.

## Non-Goals

- Do not build a `/knowledge` management console in this project.
- Do not add blog create, update, or delete UI.
- Do not introduce Next.js, Astro, or another application framework in this phase.
- Do not publish every knowledge-base file automatically.
- Do not modify source articles during the site build process.

## Information Architecture

The public site should contain these pages:

- `/`: Home page with positioning, credibility signals, latest posts, representative cases, and contact links.
- `/about`: About page with personal introduction, background, skills, current direction, and suitable roles or collaborations.
- `/blog`: Blog index listing published resources in reverse chronological order.
- `/blog/<slug>/`: Blog article page generated from a published resource.
- `/cases`: Case list and case detail entry points.

The home page should not be the blog page. It is the main personal index and should route visitors toward articles, cases, about content, and contact.

## Content Sources

Use the existing knowledge-base structure:

```text
resources/*.md
```

as the source for blog posts. `resources/` is the best current fit because it already contains reusable knowledge, methods, observations, and action guides.

The following directories should not be used as automatic blog sources:

- `raw/`: original material, clips, copied articles, conversation exports, and unprocessed notes.
- `projects/`: active or historical project state, usually too internal for public publishing.
- `areas/`: long-term knowledge areas and indexes, better suited to knowledge-base navigation than public posts.

Existing site content remains under:

```text
personal-site/content/*.md
personal-site/content/cases/*.md
```

## Publish Metadata

A resource becomes public only when its frontmatter includes:

```yaml
publish: true
slug: fde-local-delivery
title: FDE 与土 FDE：从工程师到现场交付
summary: 面向工程师的 FDE 转型理解与行动路径。
category: AI交付
tags: [FDE, AI交付, 职业转型]
published: 2026-07-06
```

Required fields for published posts:

- `publish`
- `slug`
- `title`
- `summary`
- `category`
- `tags`
- `published`

Files without `publish: true` must not appear in generated blog output.

## Build Approach

Keep the site lightweight. Add a local build script rather than a full framework.

Recommended script:

```text
personal-site/scripts/build-blog.js
```

Responsibilities:

1. Scan `../resources/*.md` from inside the `personal-site` project.
2. Parse frontmatter and Markdown content.
3. Select only files with `publish: true`.
4. Validate required publish metadata.
5. Generate static article HTML files.
6. Generate a blog index JSON file for homepage and blog list rendering.

Recommended generated output:

```text
personal-site/generated/
  blog-index.json
personal-site/blog/
  index.html
  fde-local-delivery/
    index.html
```

The script may write public generated artifacts to `personal-site/generated/` and `personal-site/blog/`. It must not edit files under `resources/`.

## Commands

Add minimal npm scripts without introducing an application framework:

```json
{
  "scripts": {
    "build:blog": "node scripts/build-blog.js",
    "dev": "python3 -m http.server 4173"
  }
}
```

`npm run build:blog` generates blog data, the blog index page, and article pages.

`npm run dev` serves the static site locally from `personal-site`.

## Page Behavior

### Home

The home page should act as a clear personal entry point:

- concise personal positioning
- credibility proof points
- latest three published posts
- representative cases
- contact links

### About

The about page should explain:

- who the author is
- technical background
- AI workflow and automation direction
- suitable roles, collaborations, or projects
- contact path

### Blog Index

The blog index should:

- list published posts in reverse chronological order
- show title, summary, date, category, and tags
- support category filtering
- avoid full-text search in this phase

### Blog Article

Each article page should include:

- title
- summary
- published date
- category and tags
- rendered Markdown body
- link back to `/blog/`
- author/contact footer

### Cases

The cases page should remain separate from the blog. Cases prove delivery ability; blog posts explain thinking and methods.

Each case should emphasize:

- problem
- solution
- result
- technical stack

## Error Handling

The blog build should fail with a clear message when:

- a published post is missing required metadata
- two posts use the same `slug`
- `published` is not a valid date
- `tags` is not a list
- a source Markdown file cannot be read

Unpublished resources with incomplete metadata should not fail the build.

## Testing And Verification

Minimum verification for this phase:

- Run `npm run build:blog`.
- Confirm `personal-site/generated/blog-index.json` is created.
- Confirm one `personal-site/blog/<slug>/index.html` file is created per published post.
- Serve the site locally and verify:
  - home page loads
  - blog index loads generated posts
  - article pages render
  - about page is reachable
  - cases page is reachable

## Visual Direction

Shift the site from a resume-style marketing page toward a personal knowledge engineer site:

- clearer information density
- less oversized hero emphasis
- stronger reading experience
- calm engineering-oriented layout
- enough personal positioning to support career and collaboration goals

The visual system should remain static-site friendly and avoid adding a design framework.

## Open Implementation Notes

- The first implementation can keep the existing HTML/CSS/JS structure if it remains clear.
- If static routing becomes awkward, use generated HTML files before considering a framework.
- A future migration to Next.js can be considered only after routing, search, or content complexity justifies it.
