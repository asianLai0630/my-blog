import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import categories from './data/categories.json';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1),
    urlSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    date: z.preprocess(value => value instanceof Date && !Number.isNaN(value.valueOf())
      ? value.toISOString().slice(0, 10)
      : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期請使用 YYYY-MM-DD').refine(value => {
      const parsed = new Date(value);
      return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
    }, '日期不存在')),
    category: z.enum(['walk', 'life', 'think', 'grow']),
    subcategory: z.string().min(1),
    description: z.string().min(1),
    readMinutes: z.number().int().positive().default(5),
    draft: z.boolean().default(false),
    featuredOrder: z.preprocess(value => value === '' || value == null ? undefined : value, z.number().int().positive().optional()),
    cover: z.preprocess(value => value === '' || value == null ? undefined : value, z.string().startsWith('/images/').optional()),
    coverAlt: z.string().default(''),
    bodyClass: z.enum(['', 'magazine-article']).default(''),
    hideEyebrow: z.boolean().default(false),
    headerVariant: z.string().default('header-5703a8385bb3'),
    footerVariant: z.string().default('footer-cf4de6014b0a'),
  }).refine(data => categories.find(category => category.id === data.category)?.groups.some(group =>
    group.items.some(item => item[0] === data.subcategory)), {
    message: '子分類必須屬於選定的主分類', path: ['subcategory'],
  }),
});

export const collections = { articles };
