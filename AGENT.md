# SITCON 2026 Game — Project Overview

SITCON 2026 大地遊戲 (OMO Rhythm Game) 的前端專案。玩家在會場掃描 QR Code 解鎖關卡，並在手機上玩節奏遊戲。

## Monorepo 結構

```
/
├── frontend/          # Next.js App（本專案唯一的程式碼）
├── .github/           # GitHub workflows & copilot-instructions
├── .claude/           # Claude agent context（各功能的 AGENT 指引）
└── issues/            # Issue 追蹤
```

後端不在此 repo，API 透過 `next.config.ts` rewrite 代理至 `https://2026-game.sitcon.party/api`。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 + CSS Variables |
| State | Zustand（persist to localStorage） |
| Data Fetching | TanStack React Query + custom hooks |
| Animation | Motion library |
| Audio | Web Audio API |
| QR Scanner | `@yudiel/react-qr-scanner` |
| Language | TypeScript (strict) |
| Package Manager | pnpm |
| Formatter | Prettier（2-space, double quotes） |

---

## `frontend/app/` — 路由與 Layout 架構

App Router 使用 **route groups**（括號語法）來分離不同使用者的 layout，不影響 URL：

```
app/
├── page.tsx                  # / — Landing 頁面
├── layout.tsx                # Root layout（QueryProvider）
├── login/                    # /login — 登入頁，獨立 layout
│
├── (player)/                 # 🎮 玩家頁面群組
│   ├── layout.tsx            #    共用 Header + BottomNav
│   ├── play/                 #    /play — 解鎖方式總覽
│   │   └── (listed-page)/   #    子 route group，列表頁共用 layout
│   │       ├── booths/       #    /play/booths
│   │       ├── checkins/     #    /play/checkins
│   │       └── challenges/   #    /play/challenges
│   ├── game/                 #    /game — 遊戲關卡
│   │   └── (game)/           #    遊戲內 layout（[level] 動態路由）
│   ├── leaderboard/          #    /leaderboard
│   ├── scan/                 #    /scan — QR 掃描器
│   └── coupon/               #    /coupon — 折價券
│
└── (internal)/               # 🔧 工作人員頁面群組
    ├── layout.tsx            #    攤位專用 header
    ├── booth/                #    /booth — 攤位 dashboard
    └── cashier/              #    /cashier — 收銀台（工作人員兌換券）
```

**命名邏輯：**
- `(player)/` — 玩家看到的所有頁面，共用同一組 Header + BottomNav
- `(internal)/` — 工作人員 / 攤位人員專用，不同的 layout
- `(listed-page)/`、`(game)/` — 巢狀 route group，用來在子頁面共用特定 layout
- `login/` — 不屬於任何 group，獨立 layout

---

## `frontend/hooks/api/` — API Hooks

所有 API 呼叫都透過 TanStack React Query 封裝為 `use<Resource>.ts`，**元件中禁止直接使用 `fetch()`**。

```
hooks/api/
├── useUser.ts          # 使用者資料、登入 session
├── useActivities.ts    # 攤位 / 打卡 / 挑戰的狀態與操作
├── useGames.ts         # 關卡資訊、排行榜、提交成績
├── useFriendships.ts   # 好友數量與加好友
├── useCoupons.ts       # 折價券列表與兌換
└── index.ts            # Barrel export
```

---

## `frontend/lib/` — 工具與底層邏輯

```
lib/
├── api.ts            # fetch wrapper（ApiError、credentials: include）
├── queryKeys.ts      # React Query key 定義（集中管理）
├── audio.ts          # Web Audio API 工具（節奏遊戲用）
└── scanMessages.ts   # QR 掃描結果的訊息定義
```

**規則：** 所有 query key 必須從 `queryKeys.ts` 取用，不要在 hook 中自行定義。

---

## `frontend/stores/` — 全域狀態

Zustand stores，使用 `persist` middleware 存到 localStorage：

```
stores/
├── userStore.ts      # 使用者身份、auth token
├── gameStore.ts      # 遊戲進度與狀態
├── boothStore.ts     # 攤位 session
├── staffStore.ts     # 工作人員狀態
├── popupStore.ts     # 全域 popup 佇列（不 persist）
└── index.ts          # Barrel export
```

### Global Popup（全域蓋板通知）

任何元件皆可透過 `usePopupStore` 觸發全域 popup，掛載於 Root layout（`app/layout.tsx`），所有頁面（玩家、工作人員）共用。

**元件位置：** `components/ui/GlobalPopup.tsx` / **Store 位置：** `stores/popupStore.ts`

**PopupData 欄位：**

| 欄位 | 必填 | 說明 |
|------|------|------|
| `title` | ✅ | 標題文字（font-serif, text-2xl） |
| `description` | ❌ | 說明文字 |
| `image` | ❌ | 圖片 URL，以 aspect-[4/3] 顯示 |
| `cta` | ❌ | `{ name, link }` — 行動按鈕，`/` 開頭內部導航，否則開新分頁 |
| `doneText` | ❌ | 關閉按鈕文字，預設「關閉」 |

**Store API：**
- `showPopup(popup)` — 加入佇列，id 自動產生
- `dismissPopup(id)` — 關閉指定 popup
- `clearAll()` — 清空所有 popup

**行為：**
- 佇列機制 — `popups` 為陣列，UI 只顯示 `popups[0]`，dismiss 後自動顯示下一個
- backdrop 點擊不會自動關閉，使用者必須點按鈕操作
- 不使用 persist，重整後不保留

**範例 1 — 完整通知（圖片 + CTA + 自訂按鈕文字）：**

```typescript
import { usePopupStore } from "@/stores";

const showPopup = usePopupStore((s) => s.showPopup);

showPopup({
  title: "獲得新優惠券！",
  description: "恭喜你獲得 50 元折價券",
  image: "/assets/coupon-reward.png",
  cta: { name: "查看優惠券", link: "/coupon" },
  doneText: "知道了",
});
```

**範例 2 — 純文字提示（無圖片、無 CTA）：**

```typescript
showPopup({
  title: "交朋友已滿！",
  description: "你已經收集到所有朋友了，快去領取獎勵吧。",
});
```

**範例 3 — 連續觸發多個（佇列）：**

```typescript
showPopup({ title: "第一個通知", description: "這是佇列中的第一個" });
showPopup({ title: "第二個通知", description: "關掉第一個後會看到我" });
```

---

## `frontend/components/` — 元件組織

```
components/
├── layout/
│   ├── (player)/     # 玩家 layout 元件（AppShell, Header, BottomNav）
│   └── (booth)/      # 攤位 layout 元件（AppShell, Header）
├── providers/        # AuthGuard、QueryProvider
├── coupon/           # 折價券相關元件
├── staff/            # 工作人員相關元件
├── unlock/           # 解鎖方式卡片
├── ui/               # 共用 UI 元件（LoadingSpinner 等）
└── QrScanner.tsx     # QR 掃描器元件
```

**組織邏輯：** 按功能分資料夾，layout 元件再用 `(player)` / `(booth)` 區隔受眾。

---

## `frontend/types/` — 型別定義

`types/api.ts` 集中定義所有 API 的 request / response 型別。新增 API 時在此檔案加型別。

---

## 關鍵慣例

- **Import 路徑：** 一律使用 `@/` alias，禁用相對路徑
- **元件檔名：** PascalCase（`Header.tsx`）
- **Hook 檔名：** camelCase + `use` prefix（`useUser.ts`）
- **Store 檔名：** camelCase + `Store` suffix（`userStore.ts`）
- **Loading 狀態：** API 依賴的欄位使用 `animate-pulse` skeleton，不顯示 fallback 文字（詳見 `.claude/animate/AGENT.md`）
- **設計語言：** 暖色調（棕、金）、最大寬度 430px、mobile-first

---

## 相關文件

| 文件 | 內容 |
|------|------|
| `.github/copilot-instructions.md` | 完整技術規格、設計系統、頁面 layout 詳述 |
| `.claude/animate/AGENT.md` | Loading 動畫原則與實作指引 |
| `.github/api/api-1.json` | 後端 API Swagger 規格（調用 API 時務必參考） |
| `frontend/next.config.ts` | API proxy 設定、standalone output |
| `frontend/globals.css` | CSS 變數定義（顏色、間距、字體） |
