import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/content/articles/content-check-temporary.md');
assert.ok(!fs.existsSync(file), 'Temporary test filename already exists');
const build = () => {
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
};
const read = file => fs.readFileSync(path.join(root, 'dist', file), 'utf8');
const feed = () => JSON.parse(read('index.html').match(/<script[^>]*id="article-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
const title = '統一文章資料測試';
const article = (title, draft) => `---\ntitle: "${title}"\ndate: "2099-01-01"\ncategory: life\nsubcategory: 日常\ndescription: "同步摘要測試"\nreadMinutes: 7\ndraft: ${draft}\ncover: /images/hallstatt-hero.webp\n---\n\n正文限定搜尋驗證詞\n\n## Markdown 章節驗證\n\n新增文章不需建立頁面檔。\n`;
const before = feed().posts.length;
try {
  fs.writeFileSync(file, article(title, false));
  build();
  assert.equal(feed().posts.length, before + 1);
  assert.equal(feed().posts[0].title, title);
  assert.ok(read('index.html').includes(`<h3>${title}</h3>`), 'Home static list did not update');
  assert.ok(read('category-life.html').includes(`<h3>${title}</h3>`), 'Category static list did not update');
  assert.ok(read('search.html').includes(`<h3>${title}</h3>`), 'All-article static list did not update');
  assert.ok(read('articles/content-check-temporary.html').includes('Markdown 章節驗證'));
  assert.ok(feed().posts[0].searchText.includes('正文限定搜尋驗證詞'));
  fs.writeFileSync(file, article(title + '已修改', false));
  build();
  assert.equal(feed().posts[0].title, title + '已修改');
  assert.ok(read('articles/content-check-temporary.html').includes(`<h1>${title}已修改</h1>`));
  fs.writeFileSync(file, article(title + '已修改', true));
  build();
  assert.equal(feed().posts.length, before);
  assert.ok(!fs.existsSync(path.join(root, 'dist/articles/content-check-temporary.html')), 'Draft article was published');
  assert.ok(!read('index.html').includes(title), 'Draft leaked into browser feed');
  console.log('Verified add/edit/draft lifecycle: automatic routes, static home/category/search, metadata, sorting, and searchable body.');
} finally {
  if (fs.existsSync(file)) fs.unlinkSync(file);
  build();
}
