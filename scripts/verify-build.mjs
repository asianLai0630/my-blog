import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(project, 'dist');
const baseRoutes = JSON.parse(fs.readFileSync(path.join(project, 'scripts/routes.json'), 'utf8')).filter(route => !route.startsWith('/articles/'));
const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const feed = JSON.parse(home.match(/<script[^>]*id="article-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
const routes = [...baseRoutes, ...feed.posts.map(post => `/articles/${post.id}.html`)];
let checkedLinks = 0;
for (const route of routes) {
  const file = path.join(dist, route.slice(1));
  assert.ok(fs.existsSync(file), `Missing route ${route}`);
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<html[^>]*lang="zh-Hant"/, `${route}: missing language`);
  assert.match(html, /<title>[^<]+<\/title>/, `${route}: missing title`);
  assert.match(html, /<main\b/, `${route}: missing content`);
  assert.match(html, /<header\b/, `${route}: missing header`);
  assert.match(html, /<footer\b/, `${route}: missing footer`);
  assert.match(html, /src="\/assets\/site.js"[^>]*defer/, `${route}: missing legacy script`);
  for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|#|\?)/i.test(url)) continue;
    const pathname = url.split(/[?#]/)[0];
    const local = pathname.startsWith('/') ? pathname.slice(1) : path.posix.join(path.posix.dirname(route), pathname).replace(/^\//, '');
    assert.ok(fs.existsSync(path.join(dist, decodeURIComponent(local))), `${route}: broken link ${url}`);
    checkedLinks++;
  }
}
for (const name of fs.readdirSync(path.join(project, 'public/assets'))) {
  assert.deepEqual(fs.readFileSync(path.join(dist, 'assets', name)), fs.readFileSync(path.join(project, 'public/assets', name)), `Changed asset ${name}`);
}
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
for (const post of feed.posts) {
  const html = fs.readFileSync(path.join(dist, 'articles', `${post.id}.html`), 'utf8');
  assert.ok(html.includes(`<h1>${escape(post.title)}</h1>`), `${post.id}: article title differs from feed`);
  assert.ok(html.includes(`content="${escape(post.excerpt)}"`), `${post.id}: SEO description differs from feed`);
}
assert.ok(feed.posts.every((post, index) => !index || feed.posts[index - 1].date >= post.date), 'Articles are not sorted by date');
console.log(`Verified ${routes.length} pages, ${checkedLinks} local links/assets, unified titles/descriptions, date sorting, and copied scripts/styles.`);
