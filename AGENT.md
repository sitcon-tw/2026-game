# SITCON 2026 Game — Project Overview

SITCON 2026 大地遊戲 (OMO Rhythm Game) 的全端專案。玩家在會場掃描 QR Code 解鎖關卡，並在手機上玩節奏遊戲。

## Monorepo 結構

```
/
├── frontend/          # Next.js App（前端）
├── backend/           # Go API Server（後端，Chi router + PostgreSQL）
├── .github/           # GitHub workflows、copilot-instructions、Issue templates
├── .claude/           # Claude agent context（各功能的 AGENT 指引）
└── issues/            # Issue 追蹤
```

後端已加入此 repo（Go + Chi + PostgreSQL），前端 API 透過 `next.config.ts` rewrite 代理至 `https://2026-game.sitcon.party/api`。

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
| Icons | `lucide-react` |
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
│   │       ├── challenges/   #    /play/challenges
│   │       └── compass/      #    /play/compass — 指南針計畫（組隊互掃簽到）
│   ├── game/                 #    /game — 遊戲關卡
│   │   └── (game)/           #    遊戲內 layout（[level] 動態路由）
│   ├── leaderboard/          #    /leaderboard
│   ├── scan/                 #    /scan — QR 掃描器（含「更新我的名牌」入口）
│   └── coupon/               #    /coupon — 折價券（含 error.tsx error boundary）
│
└── (internal)/               # 🔧 工作人員 / 管理員頁面群組
    ├── layout.tsx            #    攤位專用 header
    ├── booth/                #    /booth — 攤位 dashboard
    ├── cashier/              #    /cashier — 收銀台（工作人員兌換券）
    └── admin/                #    /admin — 管理員面板（AdminGuard 權限驗證）
        ├── layout.tsx        #        AdminGuard 包裹，未驗證導回 /admin
        ├── assign/           #        /admin/assign — 手動發放折價券（下拉選券）
        └── gift-coupons/     #        /admin/gift-coupons — 禮物券管理
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
├── useUser.ts          # 使用者資料、登入 session、名牌更新（useUpdateNamecard）
├── useActivities.ts    # 攤位 / 打卡 / 挑戰的狀態與操作
├── useGames.ts         # 關卡資訊、排行榜、提交成績
├── useFriendships.ts   # 好友數量、加好友、好友列表
├── useCoupons.ts       # 折價券列表、兌換、禮物券領取、工作人員核銷/發放、券定義查詢
├── useGroup.ts         # 指南針計畫：組員列表、組內簽到
├── useAdmin.ts         # 管理員：登入、禮物券 CRUD、搜尋使用者、手動發券
├── useAnnouncements.ts # 公告列表
└── index.ts            # Barrel export
```

---

## `frontend/hooks/` — 非 API Hooks

```
hooks/
├── useCouponPolling.ts          # 每 30 秒輪詢折價券，偵測新券時彈 popup（含獲得原因）
├── useScheduledNotifications.ts # 活動日（2026-03-28 GMT+8）排程通知，每 30 秒檢查
└── api/                         # API hooks（見上方）
```

### 折價券通知（useCouponPolling）

- 輪詢 `GET /discount-coupons`，比對 localStorage 已知 ID
- 新券出現時，用 `discount_id` 比對 `CouponDefinition.description` 取得獲得原因
- Popup 文字：`獲得新折價券！` + `恭喜獲得 X 元折價券（原因）`

### 排程通知（useScheduledNotifications）

僅在 2026-03-28（GMT+8）生效，localStorage 記錄已通知的 event ID：

| 時間 | 通知 |
|------|------|
| 10:10 | 限時動態開始 |
| 11:30 | 限時動態剩 30 分鐘 |
| 12:00 | 限時動態已截止 |
| 15:40 | 排行榜 20 分鐘後結算 |
| 15:55 | 排行榜 5 分鐘後結算 |
| 16:00 | 排行榜已結算（提醒 16:30 前用完折價券） |

兩個 hook 都掛載於 `components/layout/(player)/AppShell.tsx` 的 `PlayerShell`。

---

## `frontend/lib/` — 工具與底層邏輯

```
lib/
├── api.ts            # fetch wrapper（ApiError、credentials: include）
├── queryKeys.ts      # React Query key 定義（集中管理）
├── audio.ts          # Web Audio API 工具（節奏遊戲用）
└── scanMessages.ts   # QR 掃描結果的訊息定義（支援 ScanContext: group-checkin, staff-login, staff-redeem, staff-scan-assign）
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

### Modal（共用彈出視窗）

**元件位置：** `components/ui/Modal.tsx`

統一的 modal shell 元件，封裝 backdrop、spring 進出動畫、圓角卡片容器。所有彈出視窗應使用此元件，不要自行寫 `AnimatePresence` + `fixed inset-0` 的 pattern。

**Props：**

| Prop | 型別 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `open` | `boolean` | ✅ | — | 是否顯示 |
| `onClose` | `() => void` | ❌ | — | 點擊 backdrop 時呼叫；省略則 backdrop 不可關閉 |
| `className` | `string` | ❌ | `"w-full max-w-md p-5"` | 卡片容器的額外 class（寬度、padding 等） |
| `children` | `ReactNode` | ✅ | — | 卡片內容 |

**內建行為：**
- `AnimatePresence` + spring 動畫（scale 0.8→1, y 30→0）
- `max-h-[85vh]` + `overflow-y-auto` 防溢出
- `rounded-2xl` + `shadow-2xl` + `bg-[var(--bg-primary)]`（可透過 className 覆蓋背景色）
- Backdrop 為 `bg-black/50`；有 `onClose` 時為可點擊 `<button>`，否則為純 `<div>`

**已套用的元件：**
- `GlobalPopup`（全站，無 backdrop dismiss）
- `UpdateMyNamecardModal`、`UserNamecardModal`（/scan）
- scan page QR 放大（/scan，`bg-white`）
- `RedeemReceiptModal`（/coupon，`p-0`）
- booths、checkins、challenges detail modal（/play/*，`bg-white`）

**新增彈出視窗時，一律使用此元件，不要自行寫 `AnimatePresence` + `fixed inset-0` 的 pattern。**

**範例：**

```tsx
import Modal from "@/components/ui/Modal";

{/* 一般 modal（backdrop 可關閉） */}
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <h2>標題</h2>
  <p>內容</p>
</Modal>

{/* 不可 backdrop 關閉（如 GlobalPopup） */}
<Modal open={!!data} className="w-full max-w-sm overflow-hidden p-0">
  {/* 自訂 padding、背景色等 */}
</Modal>

{/* 覆蓋背景色 */}
<Modal open={show} onClose={close} className="flex flex-col items-center gap-4 bg-white p-6">
  {/* 白色背景的 modal */}
</Modal>
```

### ProgressBar（共用進度條）

**元件位置：** `components/ui/ProgressBar.tsx`

統一的進度條元件，透過 `variant` 選擇配色以搭配不同背景。

**Props：**

| Prop | 型別 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `percent` | `number` | ✅ | — | 進度百分比（0–100） |
| `variant` | `"bronze" \| "light" \| "subtle"` | ❌ | `"subtle"` | 配色方案 |
| `height` | `string` | ❌ | `"h-2.5"` | Tailwind 高度 class |
| `loading` | `boolean` | ❌ | `false` | 顯示 pulse 載入動畫 |
| `className` | `string` | ❌ | `""` | 額外 class（寬度等） |

**Variant 配色指引：**

| Variant | 適用場景 | Track 底色 | Fill 填充色 |
|---------|----------|------------|-------------|
| `bronze` | 深色銅色背景（如 UnlockMethodCard） | `#D7994A` | `#945B17` |
| `light` | 深色 header 背景 | `white` | `accent-gold` |
| `subtle` | 淺色 / 紙張背景（如 scan page） | `rgba(93,64,55,0.15)` | `text-primary` |

新增配色時，在元件內的 `variants` 物件加一組即可。

**範例：**

```tsx
import ProgressBar from "@/components/ui/ProgressBar";

{/* 淺色背景上的進度條 */}
<ProgressBar percent={60} variant="subtle" className="w-40" />

{/* 深色 header 上，載入中 */}
<ProgressBar percent={0} variant="light" loading className="w-full" />

{/* 銅色卡片上，較粗的進度條 */}
<ProgressBar percent={75} variant="bronze" height="h-3" className="w-40" />
```

---

## `frontend/components/` — 元件組織

```
components/
├── layout/
│   ├── (player)/     # 玩家 layout 元件（AppShell, Header, BottomNav）
│   └── (booth)/      # 攤位 layout 元件（AppShell, Header）
├── namecard/         # 名牌系統元件（UpdateMyNamecardModal, UserNamecardModal）
├── providers/        # AuthGuard、AdminGuard、QueryProvider
├── coupon/           # 折價券相關元件
├── staff/            # 工作人員相關元件
├── unlock/           # 解鎖方式卡片
├── ui/               # 共用 UI 元件（Modal, ProgressBar, LoadingSpinner 等）
└── QrScanner.tsx     # QR 掃描器元件
```

**組織邏輯：** 按功能分資料夾，layout 元件再用 `(player)` / `(booth)` 區隔受眾。

---

## `frontend/types/` — 型別定義

`types/api.ts` 集中定義所有 API 的 request / response 型別。新增 API 時在此檔案加型別。

主要型別包括：
- `User` — 含 namecard 欄位（namecard_bio, namecard_links, namecard_email）、group
- `ActivityWithStatus` — 活動狀態（id, name, type, visited）
- `BoothActivity` — 攤位完整資料（含 description, link, floor, qrcode_token）
- `RankEntry` — 排行榜條目（含 id, avatar, namecard: PublicNamecard, rank）
- `RankResponse` — 排行榜回應（rank[], around[], me, page）
- `PublicNamecard` — 公開名牌（bio, links, email）
- `UpdateNamecardRequest` — 更新名牌請求
- `FriendPublicProfile` — 好友公開資料（含 namecard）— 對應後端 `models.PublicUser`
- `CouponDefinition` — 折價券定義（id, pass_level, amount, max_qty, issued_qty, description, is_max_qty_reached）
- `GroupMember` — 指南針計畫組員（id, nickname, avatar, current_level, namecard, checked_in）
- `StaffScanAssignmentItem` — 工作人員 QR 掃描發放紀錄
- `AdminLoginResponse`、`DiscountCouponGift`、`AdminAssignCouponRequest`、`AdminCreateGiftCouponRequest` — 管理員相關

**注意：** 後端 API 回傳的 `activities.activityWithStatus` 含 `description`、`floor`、`link` 欄位，但前端 `ActivityWithStatus` 目前未包含這些欄位。完整結構請參考 `BoothActivity` 或 `.github/api/api-1.json`。

---

## `backend/` — Go API Server（概要）

後端使用 Go + Chi router + PostgreSQL，已加入此 repo：

```
backend/
├── cmd/api/main.go          # API 入口
├── cmd/import/main.go       # 資料匯入工具
├── internal/
│   ├── handler/             # HTTP handler（按功能分：activities, admin, announcements, discount, friend, game, group, user）
│   │                        #   user handler 含 namecard 端點（PATCH /users/me/namecard）
│   ├── models/              # 資料模型（含 public_user.go — PublicUser 用於好友/名牌回傳）
│   ├── repository/          # DB 操作層
│   └── router/              # 路由定義
├── pkg/                     # 共用套件（config, db, helpers, middleware, logger, telemetry）
├── migrations/              # PostgreSQL migration files（至 9_add_user_namecard_fields）
├── fake_data/               # 測試用假資料
├── observability/           # Grafana, Prometheus, Promtail 設定
├── compose.dev.yaml         # Docker Compose（含 observability）
└── justfile                 # 常用指令
```

### API 端點概覽

完整 Swagger 規格見 `.github/api/api-1.json`，以下為端點摘要：

| 分類 | 方法 | 端點 | 說明 |
|------|------|------|------|
| **Users** | POST | `/users/session` | 使用者登入（OPass token → cookie） |
| | GET | `/users/me` | 取得自己的資料 |
| | PATCH | `/users/me/namecard` | 更新公開名牌（bio, links, email） |
| | GET | `/users/me/one-time-qr` | 取得一次性 QR token（20 秒輪替） |
| **Activities** | GET | `/activities/stats` | 活動列表與打卡狀態 |
| | POST | `/activities/check-ins` | 使用者掃活動 QR 打卡（check 類 +1 unlock） |
| | POST | `/activities/booth/session` | 攤位登入 |
| | GET | `/activities/booth/stats` | 攤位打卡人數 |
| | POST | `/activities/booth/user/check-ins` | 攤位掃使用者 QR 打卡（booth +2 / challenge +3） |
| **Games** | GET | `/games/levels/{level}` | 取得關卡資訊（level 或 "current"） |
| | POST | `/games/submissions` | 提交遊戲紀錄（有 rate limit） |
| | GET | `/games/leaderboards` | 排行榜（分頁 30 筆、around ±10、me） |
| **Friendships** | GET | `/friendships` | 好友列表（回傳 `PublicUser[]`） |
| | POST | `/friendships` | 加好友（回傳對方 `PublicUser`，雙方 unlock +1） |
| | GET | `/friendships/stats` | 好友數量與上限 |
| **Group** | GET | `/group/members` | 組員列表（含簽到狀態） |
| | POST | `/group/check-ins` | 組內互掃簽到（雙方 unlock +4） |
| **Discount** | GET | `/discount-coupons` | 自己的折價券 |
| | GET | `/discount-coupons/coupons` | 所有折價券規則與發放狀態（公開） |
| | POST | `/discount-coupons/gifts` | 用 gift token 領取折價券 |
| | POST | `/discount-coupons/staff/session` | 工作人員登入 |
| | POST | `/discount-coupons/staff/coupon-tokens/query` | 查詢使用者可用折價券 |
| | POST | `/discount-coupons/staff/redemptions` | 掃 QR 核銷折價券 |
| | GET | `/discount-coupons/staff/current/redemptions` | 工作人員核銷紀錄 |
| | POST | `/discount-coupons/staff/scan-assignments` | 掃 QR 發放折價券（防重複） |
| | GET | `/discount-coupons/staff/current/scan-assignments` | 工作人員發券紀錄 |
| **Announcements** | GET | `/announcements` | 公告列表（不需登入） |
| **Admin** | POST | `/admin/session` | 管理員登入（ADMIN_KEY） |
| | GET | `/admin/users` | 搜尋使用者（by nickname） |
| | POST | `/admin/discount-coupons/assignments` | 直接發券給使用者 |
| | GET | `/admin/gift-coupons` | 列出 gift coupons |
| | POST | `/admin/gift-coupons` | 建立 gift coupon |
| | DELETE | `/admin/gift-coupons/{id}` | 刪除 gift coupon |

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
| `backend/README.md` | 後端開發文件 |
| `backend/docs/index.html` | 後端 Swagger UI |
| `.claude/hotfix-coupon-crashed/AGENT.md` | Coupon crash hotfix 事後分析指引 |
| `.claude/hotfix-coupon-crashed/POSTMORTEM.md` | Coupon crash 事後分析報告 |
