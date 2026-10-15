# 文章編輯與發布

所有文章放在 `src/content/articles/`。現在每篇文章只需維護一個 Markdown (`.md`) 檔；首頁、分類、搜尋、SEO 描述與統計由這些檔案自動產生。

## 修改既有文章

例如哈修塔特文章在 `src/content/articles/article-3.md`。上方兩條 `---` 之間是文章資料，下方是正文。

- `title`：文章標題，同步到文章頁、首頁、分類、搜尋與瀏覽器標題。
- `date`：使用 `YYYY-MM-DD`，列表依日期由新到舊排列。
- `category`、`subcategory`：主分類與子分類。
- `description`：列表摘要與 SEO 描述。
- `readMinutes`：閱讀時間（分鐘）。
- `draft: true`：草稿，建置時不產生文章頁，也不出現在列表、搜尋或統計；想預覽正文時可暫時設為 `false`，發布前確認草稿設定。
- `draft: false`：納入下次建置。這個設定本身不會把文章上傳到正式網站。
- `featuredOrder`：選填，指定首頁精選輪播順序；不想精選時刪除此行。
- `cover`：選填，封面路徑，例如 `/images/my-trip.webp`。
- `coverAlt`：封面圖片的文字描述。

Markdown 支援正常的段落、小標題、連結、清單及圖片。哈修塔特的 `bodyClass: magazine-article`、`hideEyebrow` 及部分 HTML 區塊用來保留原有雜誌版面，修改文字時保留這些標籤。一般新文章不需要這些欄位。

## 新增文章

複製 `templates/article.md` 到 `src/content/articles/`，改名為 `article-13.md` 或英文短名稱，例如 `kyoto-walk.md`。檔名只能使用英文小寫、數字與連字號。

檔名決定網址：`kyoto-walk.md` 對應 `/articles/kyoto-walk.html`。已發布文章請盡量保留檔名，避免原有連結失效。

```markdown
---
title: "京都散步的一天"
date: "2026-10-15"
category: "walk"
subcategory: "日本"
description: "用步行記錄京都街道與午後的小店。"
readMinutes: 5
draft: false
cover: "/images/kyoto.webp"
coverAlt: "京都街道的午後風景"
---

這裡寫第一段。

## 午後的街道

這裡寫文章內容。二級標題會自動加入閱讀目錄。

![京都街道](/images/kyoto.webp)

- 想記下的第一件事
- 想記下的第二件事

[連結文字](https://example.com)
```

封面圖片還沒準備好時，移除 `cover` 和 `coverAlt` 兩行即可，網站會顯示原有的圖片預留區。上方範例的 `kyoto.webp` 是示意檔名，使用前請放入自己的圖片。

## 分類對照

| 主分類代碼 | 顯示名稱 | 可用子分類 |
| --- | --- | --- |
| `walk` | 去走走 | 日本、歐洲、行程筆記、咖啡廳、餐廳、私藏小店 |
| `life` | 好好生活 | 日常、好物分享、生活提案 |
| `think` | 想一想 | 感情絮語、人際之間、心情隨筆、人生思考 |
| `grow` | 慢慢成長 | 創作手記、學習筆記、工具與方法、成長紀錄 |

分類拼錯或日期無效時，Astro 會提示是哪篇文章有問題，避免發布錯誤資料。

## 圖片

圖片檔放在 `public/images/`。文章中引用 `/images/檔名`，不要包含 `public`。封面會同步顯示在文章頁與對應的列表卡片。

## 本機預覽與正式發布

在 `astro-version` 資料夾執行：

```powershell
npm run dev
```

開啟 http://127.0.0.1:4321 。修改 Markdown 後儲存，預覽會更新；若瀏覽器仍顯示舊內容，重新整理頁面。

正式發布前將要發布的文章設為 `draft: false`，然後執行：

```powershell
npm run build
npm run verify
```

檢查通過後，把新的 `dist/` 內容部署到主機。移除文章或改成草稿時，主機上的舊文章檔也應一併移除；建議用整包部署取代只上傳新增檔案，以免舊頁仍可被直接開啟。

不要直接修改 `dist/`，下次建置會覆寫。網站目前以網域根目錄部署為前提。
