import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.argv[3] || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = 'http://127.0.0.1:4331';
try {
  await page.goto(`${base}/admin/`);
  await page.getByRole('button', { name: /GitHub/i }).waitFor({ timeout: 60000 });
  assert.equal(await page.locator('#cms-status').count(), 0);
  fs.mkdirSync('.astro/qa', { recursive: true });
  await page.screenshot({ path: '.astro/qa/cms-login.png', fullPage: true });
  await page.goto(`${base}/search?q=${encodeURIComponent('阿爾卑斯山')}`);
  await page.waitForSelector('.cat-editor-card');
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  assert.ok((await page.locator('.cat-editor-card').innerText()).includes('哈修塔特'));
  await page.goto(`${base}/category-learn`);
  await page.locator('[data-filter="學習筆記"]').click();
  assert.equal(await page.locator('.cat-editor-card').count(), 1);
  assert.ok((await page.locator('.cat-editor-card').innerText()).includes('一本書'));
  await page.goto(`${base}/articles/article-3`);
  await page.waitForSelector('.article-toc');
  assert.equal(await page.locator('.toc-description').count(), 4);
  assert.deepEqual(errors, []);
  console.log('Verified actual Decap login UI, CMS configuration, extensionless search/category filters, and article TOC. Real OAuth remains pending Cloudflare secrets and deployment.');
} finally {
  await browser.close();
}
