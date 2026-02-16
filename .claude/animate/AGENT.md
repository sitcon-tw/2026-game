# Loading Animation Improvements

## 核心原則

任何需要 fetch API 才能顯示的資訊，**以 text 為單位**，都應套用 `animate-pulse` 樣式，讓該欄位淡入淡出表示 data field 尚未準備好。

**重點：不是整個區塊一起 pulse，而是針對每個依賴 API 的文字欄位個別加上動畫。**

### 範例

- `frontend/components/layout/(player)/Header.tsx` 的「第 n 名」文字 — 排名來自 leaderboard API，未載入前該文字應 pulse
- `frontend/app/(player)/play/page.tsx` 的 `0/0` 進度文字與 progress bar — activities / friendCount API 未回來前，數字和進度條應 pulse
- QR Code 灰色 placeholder — 圖片來源依賴 user API 的 token，未載入前灰色方塊應 pulse

### Skeleton 原則

套用 `animate-pulse` 時，**不顯示任何 placeholder 文字**（不要出現 `0/0`、`—`、`0` 等 fallback 值）。改為渲染一個固定寬度的 skeleton 色塊，讓整個區塊以 pulse 動畫淡入淡出：

```tsx
// ✅ 正確：skeleton 色塊，無文字
{rank == null ? (
    <div className="h-5 w-16 animate-pulse rounded bg-current opacity-20" />
) : (
    <span>第 {rank} 名</span>
)}

// ❌ 錯誤：顯示 fallback 文字再加 pulse
<span className={rank == null ? "animate-pulse" : ""}>
    {rank != null ? `第 ${rank} 名` : "—"}
</span>
```

**要點：**
- 用 `<div>` 或 `<span>` 搭配 `h-*`、`w-*`、`rounded`、`bg-current opacity-20`（或適當的背景色）模擬文字佔位
- 寬度應接近實際資料渲染後的寬度，避免載入完成後版面跳動
- 進度條直接在容器上加 `animate-pulse`，不需要額外色塊

### 動畫分類

- **文字/欄位級**：`animate-pulse` skeleton 色塊（針對個別 data field，不顯示 fallback 文字）
- **整頁 loading guard**：`animate-spin`（整頁尚無法渲染時的 spinner）

---

## Tailwind CSS Animation 參考

直接使用 Tailwind 內建的 animation utility class，不需要手寫 CSS：

| Class | CSS 效果 | 用途 |
|---|---|---|
| `animate-spin` | `animation: spin 1s linear infinite`（持續旋轉 360°） | 整頁 loading spinner |
| `animate-pulse` | `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`（透明度淡入淡出） | 個別欄位 skeleton / fallback 文字 |
| `animate-ping` | `animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite`（放大 + 淡出） | 通知提示 |
| `animate-bounce` | `animation: bounce 1s infinite`（上下彈跳） | 捲動提示 |

> 參考：https://tailwindcss.com/docs/animation

---

## 規則

| 情境 | 動畫方式 |
|---|---|
| 整頁被 `isLoading` guard 擋住，顯示「載入中...」 | 用 `animate-spin` 的 spinner icon（參照 `AuthGuard.tsx` 的 `✦` 樣式） |
| 頁面已渲染但個別欄位尚未載入 | **不顯示 fallback 文字**，改為渲染 skeleton 色塊（固定寬高 + `animate-pulse` + `rounded` + `bg-current opacity-20`） |
| QR Code 圖片未載入時的灰色 placeholder block | 加 `animate-pulse` |

---

## 需要修改的檔案清單

### 1. 整頁 loading guard — 「載入中...」改為 spinner

以下 7 個頁面需統一改為帶有 `animate-spin` 的 spinner 區塊，與 `AuthGuard.tsx` 風格一致：

```tsx
// 統一替換為：
if (isLoading) {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center">
                <div className="mb-4 inline-block animate-spin text-4xl text-[var(--text-gold)]">
                    ✦
                </div>
                <p className="text-sm text-[var(--text-secondary)]">載入中…</p>
            </div>
        </div>
    );
}
```

| # | 檔案路徑 | 狀態 |
|---|---|---|
| 1-1 | `frontend/app/(player)/play/(listed-page)/booths/page.tsx` | ✅ |
| 1-2 | `frontend/app/(player)/play/(listed-page)/challenges/page.tsx` | ✅ |
| 1-3 | `frontend/app/(player)/play/(listed-page)/checkins/page.tsx` | ✅ |
| 1-4 | `frontend/app/(player)/game/page.tsx` | ✅ |
| 1-5 | `frontend/app/(player)/leaderboard/page.tsx` | ✅ |
| 1-6 | `frontend/app/(player)/game/(game)/[level]/page.tsx` | ✅ |
| 1-7 | `frontend/app/(player)/coupon/page.tsx` | ✅ |

---

### 2. Header — 排名與關卡數改為 skeleton 色塊

**檔案**：`frontend/components/layout/(player)/Header.tsx`

| # | 欄位 | 做法 | 狀態 |
|---|---|---|---|
| 2-1 | 排名 | 當 `rank == null` 時，渲染 `h-5 w-20 animate-pulse rounded bg-white/20` skeleton 色塊（不顯示 "—"） | ✅ |
| 2-2 | 關卡進度 `{current}/{unlock} 關` | 當 `!user` 時，渲染 `h-5 w-16 animate-pulse rounded bg-white/20` skeleton 色塊（不顯示 "0/0 關"） | ✅ |
| 2-3 | 進度條 | 當 `!user` 時，進度條容器加 `animate-pulse` | ✅ |

---

### 3. play/page.tsx — UnlockMethodCard skeleton 色塊

**檔案**：`frontend/app/(player)/play/page.tsx` + `frontend/components/unlock/UnlockMethodCard.tsx`

`UnlockMethodCard` 元件內，當 `total === 0`（`isLoading`）時：
- 進度條：`animate-pulse bg-white/20`，隱藏內部 bar
- 進度文字：渲染 `h-6 w-12 animate-pulse rounded bg-white/20` skeleton 色塊（不顯示 "0/0"）

| # | 欄位 | 做法 | 狀態 |
|---|---|---|---|
| 3-1 | `UnlockMethodCard` 進度條 | 當 `isLoading` 時改為 `animate-pulse bg-white/20`，隱藏內部 bar | ✅ |
| 3-2 | `UnlockMethodCard` `{current}/{total}` 文字 | 當 `isLoading` 時渲染 skeleton 色塊（不顯示文字） | ✅ |
| 3-3 | 「認識新朋友」card fallback | `friendData?.max ?? 20` 改為 `?? 0`，確保未載入時 `total=0` 能觸發 skeleton | ✅ |

---

### 4. scan/page.tsx — QR Code placeholder 與好友數 skeleton

**檔案**：`frontend/app/(player)/scan/page.tsx`

| # | 欄位 | 做法 | 狀態 |
|---|---|---|---|
| 4-1 | QR Code placeholder | 灰色方塊加 `animate-pulse` | ✅ |
| 4-2 | 好友剩餘數 `{remaining}` | 當 `!friendData` 時渲染 `inline-block h-4 w-6 animate-pulse rounded bg-current opacity-20` skeleton（不顯示數字） | ✅ |
| 4-3 | 進度條 | 當 `!friendData` 時進度條容器加 `animate-pulse` | ✅ |

---

### 5. game/page.tsx — 排名 skeleton

**檔案**：`frontend/app/(player)/game/page.tsx`

| # | 欄位 | 做法 | 狀態 |
|---|---|---|---|
| 5-1 | 排名文字 `第 X 名` | 當 `rank == null` 時渲染 `h-7 w-24 animate-pulse rounded bg-current opacity-20` skeleton（不顯示 "—"） | ✅ |

---

### 6. game/[level]/page.tsx — 提交中文字加 `animate-pulse`

**檔案**：`frontend/app/(player)/game/(game)/[level]/page.tsx`

| # | 欄位 | 做法 | 狀態 |
|---|---|---|---|
| 6-1 | `提交中...` 文字 | 加 `animate-pulse`（此為狀態提示文字，保留文字顯示） | ✅ |

---

## 完成狀態

全部完成 ✅

核心原則：**任何需要 fetch API 才能顯示的資訊，以 text 為單位，都應渲染 skeleton 色塊搭配 `animate-pulse`（不顯示 fallback 文字）；整頁無法渲染時則用 `animate-spin` spinner。**
