const BLOG_PAGE_SIZE = 6;

function getBlogPages(posts) {
  const totalPages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  return Array.from({ length: totalPages }, (_, index) => ({
    page: index + 1,
    totalPages,
    route: index === 0 ? '/blog/' : `/blog/page/${index + 1}/`,
    prefix: index === 0 ? '../' : '../../../',
    title: index === 0 ? '博客 | 夏目' : `博客 · 第 ${index + 1} 页 | 夏目`,
    description: '夏目的 AI 工作流、业务流程自动化和交付工程文章。',
    posts: posts.slice(index * BLOG_PAGE_SIZE, (index + 1) * BLOG_PAGE_SIZE),
  }));
}

module.exports = { BLOG_PAGE_SIZE, getBlogPages };
