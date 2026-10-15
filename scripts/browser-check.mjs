// Optional browser verification: node scripts/browser-check.mjs <playwright-package-directory>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(fs.readFileSync(path.join(project, 'scripts/routes.json'), 'utf8'));
const browser = await chromium.launch({ headless: true, executablePath: process.argv[3] || undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const go = async route => {
  const response = await page.goto(`http://127.0.0.1:4321${route}`, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, route);
  await page.waitForFunction(() => typeof initSite === 'function');
  await page.waitForSelector('main#app');
};
try {
  for (const route of routes) {
    await go(route);
    assert.equal(await page.locator('main#app').count(), 1, route);
    assert.ok(await page.locator('main').innerText(), `${route}: empty content`);
  }
  await go('/index.html');
  await page.locator('[data-carousel="1"]').click();
  assert.equal(await page.locator('[data-slide="1"]').getAttribute('aria-hidden'), 'false');
  await page.locator('#searchToggle').click();
  await page.locator('#searchInput').fill('東京');
  await page.locator('#searchInput').press('Enter');
  await page.waitForURL('**/search.html?q=*');
  await page.waitForSelector('.cat-editor-card');
  assert.ok((await page.locator('#app').innerText()).includes('東京散步'));
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  await go('/category-travel.html?sub=' + encodeURIComponent('日本'));
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  await page.locator('[data-filter="全部"]').click();
  assert.equal(await page.locator('.cat-editor-card').count(), 3);
  await page.locator('.cat-editor-card').first().click();
  await page.waitForURL('**/articles/*.html');
  await page.waitForSelector('.toc-header');
  await page.locator('.toc-header').click();
  assert.equal(await page.locator('.toc-header').getAttribute('aria-expanded'), 'true');
  assert.ok(await page.locator('.toc-content a').count() >= 2);
  await go('/search.html?q=' + encodeURIComponent('阿爾卑斯山'));
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  assert.ok((await page.locator('.cat-editor-card').innerText()).includes('哈修塔特'));
  await go('/articles/article-3.html');
  assert.equal(await page.locator('.magazine-chapter').count(), 4);
  assert.equal(await page.locator('.toc-content a').count(), 4);
  assert.ok((await page.locator('.article-hero-image').getAttribute('src')).includes('hallstatt-hero.webp'));
  await go('/index.html');
  assert.ok((await page.locator('#latestPinned').innerText()).includes('哈修塔特'));
  await go('/about.html');
  await page.locator('[data-work-index="1"]').click();
  await page.waitForFunction(() => document.getElementById('b22WorkTitle').textContent === '插畫');
  await page.locator('#b22WorkLink').click();
  await page.waitForURL('**/portfolio-illustration.html');
  await page.setViewportSize({ width: 390, height: 844 });
  await go('/index.html');
  await page.locator('#menuToggle').click();
  assert.ok((await page.locator('#mobilePanel').getAttribute('class')).includes('show'));
  await page.locator('#mobilePanel [data-goto="walk"][data-sub="日本"]').click();
  await page.waitForURL('**/category-travel.html?sub=*');
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile horizontal overflow');
  await go('/index.html');
  fs.mkdirSync(path.join(project, '.astro/qa'), { recursive: true });
  await page.screenshot({ path: path.join(project, '.astro/qa/home-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(project, '.astro/qa/home-desktop.png'), fullPage: true });
  assert.deepEqual(errors, [], 'Browser JavaScript errors');
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto('http://127.0.0.1:4321/articles/article-1.html');
  assert.ok((await staticPage.locator('main').innerText()).includes('東京散步'));
  await noJs.close();
  console.log(`Browser verified ${routes.length} routes, carousel, search, filtering, article navigation/TOC, portfolio switching, mobile menu, and article content without JavaScript.`);
} finally {
  await browser.close();
}
