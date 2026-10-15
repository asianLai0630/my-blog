import { getCollection } from 'astro:content';
import categories from '../data/categories.json';

export async function getPublishedArticles() {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  for (const article of articles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.id)) {
      throw new Error(`文章檔名請使用英文小寫、數字及連字號：${article.id}`);
    }
  }
  return articles.sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

export async function getArticleFeed() {
  const articles = await getPublishedArticles();
  return {
    categories,
    posts: articles.map(article => ({
      id: article.id,
      title: article.data.title,
      cat: article.data.category,
      sub: article.data.subcategory,
      group: categories.find(category => category.id === article.data.category)?.groups.find(group =>
        group.items.some(item => item[0] === article.data.subcategory))?.title || '',
      date: article.data.date.replaceAll('-', '.'),
      excerpt: article.data.description,
      readMinutes: article.data.readMinutes,
      featuredOrder: article.data.featuredOrder,
      cover: article.data.cover,
      coverAlt: article.data.coverAlt,
      searchText: (article.body || '').replace(/<[^>]+>/g, ' '),
    })),
  };
}
