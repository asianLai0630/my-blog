# GitHub、Cloudflare Pages 與 CMS 設定

本機已加入 Decap CMS 後台、文章欄位與 GitHub OAuth 登入程式。尚未上傳這些修改，也尚未在你的 Cloudflare 帳號建立網站或 GitHub OAuth App。

## 1. 將這次修改更新到 GitHub

儲存庫：`https://github.com/asianLai0630/my-blog`，分支：`main`。

已確認這個儲存庫根目錄就是 Astro 專案。請將本機 `astro-version` **裡面的內容**更新到儲存庫根目錄，不要再包一層 `astro-version`。請保留新的 `functions/`、`cms/`、`public/admin/`、`src/pages/admin/` 等檔案，以及更新後的文章 Markdown。

不要上傳 `node_modules/`、`dist/`、`.astro/`、`.env` 或 `.dev.vars`。後兩種檔案可能含金鑰，已加入 `.gitignore`。

CMS 的儲存庫與路徑設定在 `src/data/cms.js`：目前使用 `asianLai0630/my-blog`、`main`，`contentRoot` 為空字串，文章存回 `src/content/articles/`，圖片存回 `public/images/uploads/`。使用一般 JavaScript 模組，避免較舊的 Functions 打包器無法解析 JSON import attributes。

## 2. 建立 Cloudflare Pages

在 Cloudflare 的 **Workers & Pages → Create application → Pages → Import an existing Git repository**，連接 GitHub 並選擇 `asianLai0630/my-blog`。

| 欄位 | 設定 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `Astro` |
| Root directory | 留空 |
| Build command | `npm run build && npm run verify` |
| Build output directory | `dist` |
| 環境變數 `NODE_VERSION` | `22.19.0` |

專案內也有 `.nvmrc` 指定 Node 版本。先完成第一次部署，記下 Cloudflare 實際分配的網址，例如 `https://你的專案.pages.dev`；不要把此示意網址原樣貼入設定。

請使用 Git 整合部署。這個 CMS 的 GitHub 登入需要專案根目錄 `functions/` 中的 Pages Functions，不能只把 `dist/` 拖曳上傳就視為完成 CMS 部署。

## 3. 建立 GitHub OAuth App

開啟 GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**，填入：

| 欄位 | 設定 |
| --- | --- |
| Application name | `生活手札文章管理`（可自行命名） |
| Homepage URL | Cloudflare 的實際網站網址 |
| Authorization callback URL | `https://你的實際網站/api/callback` |

記下 Client ID，建立 Client secret。Client secret 只填入 Cloudflare 的秘密環境變數，請勿寫入原始碼、提交 GitHub 或貼到聊天。

## 4. 在 Cloudflare 設定登入環境變數

開啟 Pages 專案的 **Settings → Variables and Secrets**（介面版本不同時可能顯示 Environment variables），在正式環境新增：

| 名稱 | 值 | 類型 |
| --- | --- | --- |
| `CMS_SITE_URL` | 實際網站網址，例如 `https://你的專案.pages.dev`，不要加 `/admin` | 一般變數 |
| `CMS_GITHUB_CLIENT_ID` | GitHub OAuth App 的 Client ID | 一般變數 |
| `CMS_GITHUB_CLIENT_SECRET` | GitHub OAuth App 的 Client secret | Secret |

儲存後重新部署，讓 Functions 取得環境變數。目前 GitHub 儲存庫是公開的，登入請求使用 `public_repo` 權限；日後若改為私人儲存庫，另設 `CMS_GITHUB_SCOPE=repo` 並重新授權。

`CMS_SITE_URL`、OAuth App 的 Homepage/Callback URL 與實際開啟後台的網域應一致。之後改用自訂網域，請一併修改這些設定再部署。預覽分支網域不允許使用正式環境的登入設定。

## 5. 使用文章後台

開啟 `https://你的實際網站/admin/`，使用對 `my-blog` 有寫入權限的 GitHub 帳號登入。

1. 在「文章」中編輯既有文章，或新增文章。
2. 新增時填入英文小寫網址代碼，例如 `kyoto-walk`；正文與標題可以使用中文。既有文章請保留網址代碼。
3. 選擇主分類與相符的子分類、日期、摘要、閱讀時間及封面。
4. 草稿開關預設開啟。儲存草稿會將 Markdown 寫入 GitHub，但不產生公開文章頁；這是公開儲存庫，因此草稿原始檔仍可在 GitHub 被讀取。若需要保密草稿，請改用私人儲存庫。
5. 正文使用 Markdown 編輯，可透過圖片按鈕上傳或選擇圖片。哈修塔特原有的 HTML 排版標籤請保留。
6. 準備公開時，關閉草稿並儲存。CMS 將提交到 `main`，Cloudflare 的 Git 整合會觸發重建。請等部署成功後再到網站確認，CMS 儲存成功不代表網站已完成部署。

首頁、分類、搜尋、閱讀時間與封面都會由 Markdown 同步更新。CMS 中的刪除功能先關閉，避免直接刪掉既有文章；要暫時下架，開啟草稿並儲存即可。

## 本機測試

`npm run dev` 和 `npm run preview` 可顯示後台登入介面，但不執行 Cloudflare Functions，無法完成正式 GitHub 登入。OAuth 需在 Cloudflare 部署設定完成後驗證。

```powershell
npm run build
npm run verify
npm run test:cms
```

自動測試使用模擬 GitHub 回應，確認 state、PKCE、來源網域、儲存庫寫入權限、錯誤處理與 CMS 路徑；不代表已完成真實帳號登入或遠端文章儲存驗證。

## 參考文件

- [Cloudflare Pages 建置設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/)
- [Decap CMS GitHub 後端](https://decapcms.org/docs/github-backend/)
- [GitHub OAuth App 授權流程](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
