# 專案維護筆記

## 專案概覽

本專案是「101開鎖」的靜態網站，主要服務香港 24 小時開鎖、換鎖、電子鎖、門禁、車鎖及夾萬相關查詢。網站以 HTML、CSS、少量原生 JavaScript 組成，目前沒有使用前端框架、套件管理器或建置流程。

主要轉換目標是讓訪客快速致電或透過 WhatsApp 查詢，因此電話與 WhatsApp CTA 是全站重要元素。

## 技術棧

- 靜態 HTML 頁面
- 內嵌 CSS 為主，部分文章與案例頁共用 `css/news.css`
- 原生 JavaScript，主要共用互動邏輯在 `js/news.js`
- 本地字型在 `fonts/`，使用 WOFF2 與 `font-display: swap`
- 圖示依賴 Font Awesome CDN
- 圖片素材集中在 `image/`

## 主要檔案與目錄

| 路徑 | 用途 |
| --- | --- |
| `index.html` | 首頁，包含品牌介紹、服務入口、案例/文章摘要、地圖與聯絡區 |
| `service.html` | 服務項目頁，涵蓋開鎖、換鎖、電子鎖、門禁、車鎖、夾萬 |
| `price.html` | 收費參考頁，強調透明收費與先報價 |
| `news.html` | 開鎖新聞及知識文章列表頁，文章資料在頁面內的 JavaScript 陣列 |
| `locksmith-real-case.html` | 真實案例/地區服務列表頁，案例資料與地區篩選在頁面內的 JavaScript 陣列 |
| `news/` | 知識文章詳情頁 |
| `case/` | 真實案例詳情頁 |
| `css/news.css` | 文章與案例詳情頁的共用樣式 |
| `js/news.js` | 手機抽屜選單、子選單、錨點滑動、WhatsApp 浮動提示、語言按鈕提示 |
| `fonts/` | 本地 Inter / Poppins 字型 |
| `image/` | Logo、首頁圖、新聞圖、案例圖等素材 |
| `.gitignore` | Git 忽略規則 |

## 導覽與共用 UI

全站大多頁面共用相近的導覽架構：

- Logo：`image/logo.webp`
- 主選單：首頁、服務項目、開鎖知識、真實案例、收費參考、關於我們、聯絡我們
- 行動版使用抽屜選單
- 固定浮動按鈕：電話與 WhatsApp
- 主要電話：`+852 6610 1101`
- WhatsApp 常用連結：`https://api.whatsapp.com/send/?phone=85266101101&text=開鎖查詢&type=phone_number&app_absent=0`

修改導覽、頁尾、電話或 WhatsApp 文案時，通常需要同步更新多個 HTML 檔案，因為目前沒有模板系統。

## 內容資料位置

- `news.html` 內有 `const articles = [...]`，控制文章列表卡片、分類、圖片、摘要與連結。
- `locksmith-real-case.html` 內有 `HK_DISTRICTS` 與 `const articles = [...]`，控制真實案例列表及地區篩選。
- `case/*.html` 是個別真實案例頁，圖片多引用 `image/case/...`。
- `news/*.html` 是個別知識文章頁，圖片多引用 `image/news/...`。

新增文章或案例時，除了建立詳情頁，也要記得更新對應列表頁的 JavaScript 資料陣列。

## 樣式與視覺風格

網站主色偏深藍灰與金色：

- 深色文字/背景常用：`#1e2a3e`
- 金色強調常用：`#d4af37`
- 背景常用：`#f9fafc`

UI 風格偏專業服務型網站：清楚、可信、行動優先，CTA 要明顯但避免過度裝飾。按鈕多為膠囊形，卡片常用白底、陰影與圓角。

### 3:4 圖片顯示規則

日後如需要在案例頁或文章頁顯示 3:4 比例圖片，例如完成後室內 / 室外照片，應以外層比例框控制圖片比例，而不是只在 `img` 本身設定 `aspect-ratio`。這樣可以避免瀏覽器按原圖比例顯示，確保不同圖片都穩定裁切成 3:4。

建議 CSS：

```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.photo-frame {
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #eef2f7;
}

.photo-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

建議 HTML：

```html
<div class="photo-card">
  <div class="photo-frame">
    <img src="../image/case/example/photo.jpeg" alt="描述圖片內容" width="900" height="1200" loading="lazy" decoding="async">
  </div>
  <p>圖片說明</p>
</div>
```

如兩張 3:4 圖片需要並排顯示，保持 `.photo-grid` 使用兩欄；手機版只調整 `gap` 或文字大小，除非版面太窄，否則不要自動改成單欄。

## 效能注意事項

此網站已使用部分效能優化：

- 首屏背景圖使用 `rel="preload"` 與 `fetchpriority="high"`
- 字型使用本地 WOFF2，並以 `font-display: swap` 減少文字阻塞
- Font Awesome 多處採用 `media="print"` 加 `onload` 的非阻塞載入方式
- 圖片數量較多，目前約有 100 張以上素材，新增圖片時應注意壓縮與尺寸

後續維護時建議：

- 首屏大圖優先使用 WebP/AVIF 或壓縮後 JPEG
- 為圖片補齊 `width`、`height` 或穩定的 `aspect-ratio`，避免版面位移
- 非首屏圖片加上 `loading="lazy"`
- 避免新增阻塞式第三方資源
- 若要大幅改版，優先抽出共用 CSS/JS，減少每頁重複的內嵌程式碼

## 已知維護風險

- 多個頁面重複導覽列、頁尾、浮動 CTA 與內嵌 CSS，修改時容易漏同步。
- 部分頁面引用了 `faq.html`，但目前專案根目錄未見該檔案；修改導覽時需確認是否要新增或改連結。
- 部分案例頁圖片路徑看起來可能指向不存在或舊路徑，例如 `/case/case003/5-stars-review.jpeg`；處理案例頁時要順手檢查圖片是否能載入。
- 語言切換按鈕目前只有提示，尚未實作真正多語言內容。
- 專案沒有自動化測試或建置流程，修改後需以瀏覽器手動檢查主要頁面。

## 本地預覽

這是純靜態網站，可以直接開啟 HTML 檔案預覽。若需要模擬網站路徑與根目錄連結，建議在專案根目錄啟動簡單靜態伺服器，例如：

```bash
python3 -m http.server 8000
```

然後開啟：

```text
http://localhost:8000/
```

## Git 與忽略規則
禁止批量刪除文件及目錄
不要做用：
- ‘del /s’
- ‘rd /s’
- ‘rmdir /s’
- Remove-Item - Recurse’
- ‘ rm - rf’
需要刪除文件時，只能一次刪除一個明確路徑的文件。
正確示例： 
Remove-Item “C:\path\to\file.txt”
如果需要批量刪除文件，應停止操作，並向用戶請求，讓用戶手動刪除。

此資料夾已初始化為 Git 專案，第一次提交為 `Initial commit`。

`.gitignore` 已排除：

- macOS / 系統檔：`.DS_Store`、`Thumbs.db`
- 編輯器設定：`.vscode/`、`.idea/`
- 依賴與建置輸出：`node_modules/`、`dist/`、`build/`、`.next/` 等
- 日誌、快取、暫存檔與環境設定：`*.log`、`.cache/`、`.env*` 等
- 壓縮包與備份檔：`*.zip`、`*.bak` 等

提交前建議先檢查：

```bash
git status --short --ignored
```

## 修改建議流程

1. 先確認要改的是首頁、服務頁、列表頁，還是文章/案例詳情頁。
2. 若改導覽、頁尾、電話、WhatsApp 或品牌資訊，要搜尋全站並同步更新。
3. 若新增文章或案例，要同時更新詳情頁、列表頁資料陣列與圖片素材。
4. 修改 UI 後至少檢查桌面版與手機版，特別是抽屜選單、浮動 CTA、圖片比例與按鈕文字換行。
5. 修改效能相關內容時，優先保護 LCP/FCP：不要讓首屏圖片、字型或第三方 CSS 變成阻塞來源。
