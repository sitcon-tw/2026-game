# 收銀員頁面 — Feature Spec

## 功能描述

收銀員專用頁面 (`/cashier`)，位於 `app/(internal)/cashier`。提供掃描玩家折價券 QR code、查看使用紀錄、以及確認核銷的功能。

## 動機與使用情境

活動紀念品攤位的收銀員需要掃描玩家的折價券 QR code，確認折扣金額並完成核銷流程。

---

## 相關 API

所有 staff API 需要 `staff_token` cookie，透過 `POST /api/discount-coupons/staff/session` 取得。

| 用途 | Method | Path | Request | Response |
|------|--------|------|---------|----------|
| 工作人員登入 | POST | `/discount-coupons/staff/session` | Header: `Authorization: Bearer {token}` | `models.Staff`（設定 cookie） |
| 查詢使用者可用折扣券 | POST | `/discount-coupons/staff/coupon-tokens/query` | `{ user_coupon_token }` | `discount.getUserCouponsResponse`（`{ coupons, total }`） |
| 核銷折扣券 | POST | `/discount-coupons/staff/redemptions` | `{ user_coupon_token }` | `discount.discountUsedResponse`（`{ coupons, total, user_name, ... }`） |
| 取得核銷紀錄 | GET | `/discount-coupons/staff/current/redemptions` | - | `discount.historyItem[]` |

---

## 現有實作盤點

以下是已經完成的部分（在 `frontend/feat-cashier` branch 中）：

### 已完成

- [x] 工作人員登入 — 透過 URL params (`token`) 自動呼叫 `POST /discount-coupons/staff/session`
- [x] Staff store（`stores/staffStore.ts`）— 持久化 `staffToken` / `staffName`
- [x] API hooks（`hooks/api/useCoupons.ts`）— `useStaffLogin`、`useStaffLookupCoupons`、`useStaffRedeemCoupon`、`useStaffRedemptionHistory`
- [x] QR code 掃描功能 — 使用 `QrScanner` 元件掃描玩家折價券 token
- [x] 掃描後查詢折扣券 — 呼叫 lookup API 取得可用折扣券與總額
- [x] 確認核銷流程 — `RedemptionCard` 元件顯示折扣資訊 + 確認按鈕
- [x] 核銷紀錄列表 — `RedemptionHistoryList` 元件顯示歷史紀錄
- [x] 身份切換按鈕 — 固定在右下角，可切換回玩家模式

---

## 任務清單

### 前端改善

#### 掃描折價券功能

- [x] 取消核銷功能 — 掃描後查詢結果顯示時，加入「取消」按鈕可以回到掃描模式（清除 `lookupResult`）
- [x] 掃描成功/失敗通知 — 核銷成功時呼叫 `showPopup()` 顯示成功通知（含金額資訊），取代目前的 `setTimeout` 自動消失邏輯

#### 使用紀錄頁面

- [x] 核銷紀錄 loading skeleton — 替換目前的「載入核銷紀錄中...」文字為 `animate-pulse` skeleton
- [x] 核銷紀錄空狀態優化 — 加入插圖或更明確的引導文字

#### 確認使用（confirm）流程

- [x] 核銷確認二次確認 — 核銷前加入確認對話框或額外步驟，避免誤觸（兩步驟：先按「確認核銷」→ 再按「確定？再按一次」）
- [x] 顯示玩家資訊 — 核銷結果顯示 `user_name`（API response 有回傳）

#### 通知訊息

- [x] 核銷成功通知 — 使用 `showPopup({ title: "核銷成功", description: "共折抵 {total} 元" })` 取代 inline status message
- [x] 核銷失敗通知 — 使用 `showPopup()` 顯示 API 回傳的錯誤訊息

#### UI / UX

- [x] `RedemptionCard` 設計優化 — 對齊設計語言（暖色調、圓角、陰影）
- [x] `RedemptionHistoryList` 設計優化 — 卡片式呈現，統一設計風格
- [x] 登入失敗 UI — 優化登入失敗的錯誤提示樣式

### API Hooks 改善

- [x] `useStaffRedeemCoupon` 的 `invalidateQueries` 改用 `queryKeys.ts` 集中管理的 key，取代目前硬編碼的陣列
- [x] `useStaffRedemptionHistory` 的 `queryKey` 同上

---

## 路由結構

```
app/(internal)/cashier/
└── page.tsx              # 收銀員頁面（登入 + 掃描 + 核銷 + 紀錄）
```

## 相關元件

```
components/staff/
├── RedemptionCard.tsx          # 掃描結果卡片（折扣券資訊 + 確認核銷按鈕）
└── RedemptionHistoryList.tsx   # 核銷紀錄列表
```

---

## 影響範圍

- 修改 `app/(internal)/cashier/page.tsx`
- 修改 `components/staff/RedemptionCard.tsx`
- 修改 `components/staff/RedemptionHistoryList.tsx`
- 修改 `hooks/api/useCoupons.ts`（query key 改善）
- 修改 `lib/queryKeys.ts`（新增 staff 相關 keys）

## 設計注意事項

- 沿用 `(internal)` route group 的 layout 風格（`AppShell` from `components/layout/(booth)/`）
- Mobile-first，最大寬度 430px
- Loading 狀態使用 `animate-pulse` skeleton，不顯示 fallback 文字
- 所有 API 呼叫透過 React Query hooks，禁止直接 `fetch()`
- Import 路徑使用 `@/` alias
- 通知訊息統一使用 `showPopup()` 全域 popup
