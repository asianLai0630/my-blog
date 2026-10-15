# 生活提案誌 — 獨立 Astro 版本

這個資料夾是可獨立使用的 Astro 專案。原本資料夾中的 HTML、CSS、JavaScript 與圖片未修改。

## 啟動與建置

Astro 需要 Node.js 22.12 以上及 npm 9.6.5 以上。建議使用 Node.js 22.19 以上，符合目前所有相依套件的版本要求；此電腦現有的 Node.js 22.14 已通過建置與預覽測試，但安裝時會顯示部分相依套件的版本警告。

```powershell
cd astro-version
npm install
npm run dev
```

開啟 http://127.0.0.1:4321 。結束伺服器請按 Ctrl+C。

```powershell
npm run build
npm run verify
npm run preview
```

正式部署上傳 `dist/` 內容；`src/` 和 `node_modules/` 不需要上傳。`dist/` 的檔案不可直接編輯，重新建置會覆寫。網站目前以網域根目錄部署為前提。

## 專案結構

- `src/pages/`：網站入口；`articles/[slug].astro` 自動產生所有已發布文章。
- `src/layouts/BaseLayout.astro`：共用 HTML 文件版型及腳本載入順序。
- `src/components/Header.astro`、`Footer.astro`：共用導覽列及頁尾元件。
- `src/components/markup/`：原站導覽列與頁尾的不同版本，保留各頁原有呈現。
- `src/content/articles/*.md`：文章的唯一來源，包含標題、日期、分類、摘要、圖片與正文。
- `src/content.config.ts`：文章欄位與分類驗證。
- `src/data/categories.json`：分類名稱、子分類與導覽資料。
- `src/lib/articles.ts`：已發布文章、最新排序與搜尋資料。
- `src/content/pages/*.html`：關於我與作品集的既有 HTML 內容。
- `src/content/pages/*.json`：一般頁面的 head、導覽列版本、頁尾版本及腳本清單。
- `public/assets/`：沿用原有 CSS 與瀏覽器 JavaScript。
- `public/images/`：圖片。

## 這次移植的範圍

所有頁面都由 Astro 產生靜態 HTML，使用共用版型與元件。保留 `/about.html`、`/category-travel.html`、`/articles/article-1.html` 等原有網址，以及搜尋、分類篩選、首頁輪播、作品切換、手機選單和文章目錄腳本。

12 篇文章已改用 Markdown 與 Astro 內容集合。首頁、分類頁、所有文章、搜尋、SEO 標題與描述、閱讀時間及文章數量都讀取同一份文章資料。列表依日期由新到舊排列，精選輪播依 `featuredOrder` 排列。哈修塔特原本的雜誌排版保留在 Markdown 內的 HTML 區塊，維持原有樣式。

首頁與分類頁在建置時已產生文章清單，停用 JavaScript 仍可閱讀與點入文章；輪播、篩選、分頁、搜尋等互動沿用瀏覽器 JavaScript。`public/assets/site.js` 不再保存文章資料。

## 修改內容

寫作與發布請看 [文章編輯指南](ARTICLE_GUIDE.md)。文章只需修改 `src/content/articles/` 中的一個 `.md` 檔，不必修改 JSON 或 JavaScript，也不必新增 `.astro` 頁面。

圖片放入 `public/images/`，HTML 使用 `/images/檔名`。CSS 修改 `public/assets/style.css`。共用導覽列和頁尾請依頁面的 JSON 所指定版本，修改 `src/components/markup/` 對應檔案。

每次修改後執行 `npm run build` 與 `npm run verify`。

可執行 `npm run test:content` 驗證新增、修改、草稿隱藏與自動產生文章頁面的完整流程；測試文章會自動清除。未設定主機、自動部署或 CMS，正式發布仍需建置後上傳 `dist/`。
