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

## 已完成的修改清單

### 1. 整頁 loading guard — 「載入中...」改為 spinner ✅
### 2. Header — 排名與關卡數改為 skeleton 色塊 ✅
### 3. play/page.tsx — UnlockMethodCard skeleton 色塊 ✅
### 4. scan/page.tsx — QR Code placeholder 與好友數 skeleton ✅
### 5. game/page.tsx — 排名 skeleton ✅
### 6. game/[level]/page.tsx — 提交中文字加 `animate-pulse` ✅

---

## 7. Landing Page 公告跑馬燈動畫（待實作）

**檔案**：`frontend/app/page.tsx`（Landing Page）

### 需求

將 Landing Page 頂部的訊息框（目前是靜態文字「歡迎來到 SITCON 2026 大地遊戲！」）改為從 `GET /announcements` API 抓取公告資料，並以跑馬燈動畫輪播呈現。

### API 資訊

- **端點**：`GET /api/announcements`（公開，不需登入）
- **回傳格式**：`Announcement[]`，依 `created_at` 由新到舊排序
- **Announcement Model**：
  ```ts
  interface Announcement {
    id: string;
    content: string;
    created_at: string;
  }
  ```

### 動畫流程（每則公告）

1. **翻動上來（Flip Up）**：新的一則公告從下方往上翻入訊息框，取代前一則
2. **往右捲動（Scroll Right）**：文字從左向右水平捲動，展示完整內容（因為公告文字可能超過訊息框寬度）
3. **停留（Pause）**：捲動到底後停留約 **2 秒**
4. **往下翻出（Flip Down）**：當前公告往下翻出，同時下一則從上方翻入（回到步驟 1）
5. **循環**：所有公告輪播完畢後，從第一則重新開始

### 實作步驟

#### Step 1：新增 Announcement 型別、query key、API hook

遵循 `frontend/hooks/api/` 的慣例模式：

1. 在 `frontend/types/api.ts` 新增 `Announcement` interface
2. 在 `frontend/lib/queryKeys.ts` 新增 `announcements` query key
3. 新增 `frontend/hooks/api/useAnnouncements.ts`，使用 `useQuery` + `api.get` + `queryKeys`
4. 在 `frontend/hooks/api/index.ts` re-export `useAnnouncements`

```ts
// frontend/hooks/api/useAnnouncements.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Announcement } from "@/types/api";

/** GET /announcements — 取得公告列表（公開，不需登入） */
export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.list,
    queryFn: () => api.get<Announcement[]>("/announcements"),
  });
}
```

#### Step 2：建立 AnnouncementTicker 元件

建議獨立為 `frontend/components/AnnouncementTicker.tsx`，props：

```ts
interface AnnouncementTickerProps {
  announcements: Announcement[];
}
```

#### Step 3：動畫實作（使用 framer-motion / motion）

使用 `AnimatePresence` + `motion.div` 實現：

```
狀態機：
  currentIndex: number        // 目前顯示的公告索引
  scrollPhase: "enter" | "scrolling" | "paused" | "exit"

時間軸（每則公告）：
  [enter]     → translateY 從 100% 到 0%（翻上來），duration ~0.4s
  [scrolling] → translateX 從 0 到 -(overflowWidth)px（往右捲），duration 依文字長度而定
  [paused]    → 停留 2 秒
  [exit]      → translateY 從 0% 到 -100%（往下翻出），duration ~0.4s
  → next index, 回到 [enter]
```

**關鍵細節：**
- 訊息框需要 `overflow: hidden` 來裁切動畫內容
- 水平捲動速度建議固定（例如 50px/s），讓長短文字的捲動時間自然不同
- 如果文字沒有溢出（短公告），跳過水平捲動，直接停留 2 秒
- 使用 `useRef` 量測文字實際寬度與容器寬度，計算 overflow 量
- Landing Page 不需要登入，API 也是公開的，可直接 fetch

#### Step 4：整合到 Landing Page

- 替換 `page.tsx` 中第 50-53 行的靜態文字區塊
- 保留外層訊息框圖片（`message.png`）不變
- API 載入中時顯示 skeleton pulse（遵循核心原則）
- API 失敗或無公告時，fallback 為原本的靜態文字

### Fallback 策略

| 情境 | 行為 |
|---|---|
| API 載入中 | 訊息框內顯示 skeleton 色塊 + `animate-pulse` |
| API 回傳空陣列 | 顯示預設文字「歡迎來到 SITCON 2026 大地遊戲！」 |
| API 錯誤 | 顯示預設文字「歡迎來到 SITCON 2026 大地遊戲！」 |
| 僅一則公告 | 不需要翻動，僅做水平捲動 + 停留，循環播放 |

### 實作紀錄

#### 訊息框改為 CSS background

原本用 `<Image>` 元素作底圖 + `absolute` 定位疊文字，導致文字與底圖容易錯位。改為：

- 容器使用 `bg-[url('/assets/landing/message.png')] bg-contain bg-no-repeat bg-center`
- 文字直接是容器的 flow content，用 `pl-38 md:pl-44 pr-25 md:pr-30 pt-1 pb-5` 控制內距
- 用 `aspectRatio: "500 / 90"` 維持底圖比例
- 容器加 `overflow-hidden` 裁切超出的跑馬燈文字

#### 動畫時間參數（UX 優化）

| 參數 | 值 | 說明 |
|---|---|---|
| `SCROLL_SPEED` | 40px/s | 較慢的捲動速度，方便閱讀 |
| `READ_DURATION` | 1200ms | enter 後先靜止讓使用者閱讀可見文字 |
| `PAUSE_DURATION` | 2000ms | 捲動到末端後停留時間 |
| `FLIP_DURATION` | 0.5s | 翻動動畫時長，easeInOut |
| scroll easing | `cubic-bezier(0.25, 0, 0.35, 1)` | 起步漸加速、結尾漸減速 |

完整流程：enter（0.5s 翻入）→ reading（1.2s 靜止閱讀）→ scrolling（如有溢出）→ paused（2s 停在末端）→ exit（0.5s 翻出）→ 下一則

#### 關鍵修正：捲動後保持末端位置

`x` 的 animate 需在 `scrolling`、`paused`、`exit` 三個 phase 都維持 `-overflowWidth`，避免進入 paused 時文字跳回起始位置。

### 狀態

| # | 項目 | 狀態 |
|---|---|---|
| 7-1 | 新增 `Announcement` 型別到 `types/api.ts` | ✅ |
| 7-2 | 新增 announcements query key 到 `queryKeys.ts` | ✅ |
| 7-3 | 新增 `useAnnouncements.ts` hook 到 `hooks/api/` 並從 `index.ts` re-export | ✅ |
| 7-4 | 建立 `AnnouncementTicker.tsx` 元件（含動畫邏輯） | ✅ |
| 7-5 | 在 `page.tsx` 整合 `useAnnouncements` + AnnouncementTicker | ✅ |
| 7-6 | Fallback 處理（loading skeleton / 空陣列 / 錯誤） | ✅ |
| 7-7 | 訊息框改為 CSS background + overflow-hidden 裁切 | ✅ |
