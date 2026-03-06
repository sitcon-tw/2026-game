# Issue #26 — 新優惠券自動偵測與 Popup 通知

## 目標

前端每隔幾分鐘自動 fetch 優惠券列表，與 localStorage 中的快取比對，偵測到新優惠券時彈出全域 popup 通知（`showPopup()`）。

## 動機

玩家在活動進行中可能隨時解鎖新的優惠券，需要即時通知玩家有新券可用，提升使用率與活動參與感。

---

## 實作計畫

### 1. 建立 Coupon Polling Hook

**新增檔案**：`frontend/hooks/useCouponPolling.ts`

建立一個 custom hook，負責定時 polling 並比對新券：

- 使用 `useCoupons()` 搭配 React Query 的 `refetchInterval` 設定自動 polling（建議 3 分鐘）
- 從 localStorage 讀取上次已知的優惠券 ID 清單
- 比對 API 回傳結果與 localStorage 快取，找出 `newCoupons`（API 有但 localStorage 沒有的）
- 對每張新券呼叫 `showPopup()` 顯示通知
- 更新 localStorage 為最新的優惠券 ID 清單

**localStorage key**：`known-coupon-ids`（儲存 `string[]`，為優惠券 ID 陣列）

**注意事項：**
- 首次載入（localStorage 無快取）時，僅寫入快取，不觸發 popup（避免登入後一次噴出所有券）
- 比對邏輯應以 `DiscountCoupon.id` 為基準
- Hook 需在玩家已登入的狀態下才啟用

| # | 子任務 | 狀態 |
|---|--------|------|
| 1-1 | 建立 `useCouponPolling.ts`，實作 polling + 比對 + popup 邏輯 | ✅ |
| 1-2 | localStorage 讀寫工具（`known-coupon-ids`） | ✅ |
| 1-3 | 首次載入不觸發 popup 的防護 | ✅ |

---

### 2. Popup 通知格式

使用全域 popup（參考 `AGENT.md` 的 Global Popup 段落）：

```typescript
import { usePopupStore } from "@/stores";

const showPopup = usePopupStore((s) => s.showPopup);

// 每張新券各觸發一次
showPopup({
  title: "獲得新優惠券！",
  description: `恭喜獲得 ${coupon.price} 元折價券`,
  cta: { name: "查看優惠券", link: "/coupon" },
  doneText: "知道了",
});
```

多張新券時，逐一呼叫 `showPopup()`，popup 佇列機制會依序顯示。

| # | 子任務 | 狀態 |
|---|--------|------|
| 2-1 | 實作 popup 呼叫，含金額等動態資訊 | ✅ |

---

### 3. 掛載到玩家 Layout

**修改檔案**：`frontend/app/(player)/layout.tsx`

在玩家 layout 中引入 `useCouponPolling()`，確保所有玩家頁面都能偵測新券：

```typescript
import { useCouponPolling } from "@/hooks/useCouponPolling";

// 在 layout component 內呼叫
useCouponPolling();
```

| # | 子任務 | 狀態 |
|---|--------|------|
| 3-1 | 在 `AppShell.tsx`（player layout）掛載 polling hook | ✅ |

---

## 影響範圍

| 檔案 | 變更類型 |
|------|----------|
| `frontend/hooks/useCouponPolling.ts` | 新增 |
| `frontend/app/(player)/layout.tsx` | 修改（引入 hook） |
| `frontend/hooks/api/useCoupons.ts` | 不需修改（已有 `useCoupons()`） |
| `frontend/stores/popupStore.ts` | 不需修改（已有 `showPopup()`） |

## 相關程式碼

| 資源 | 路徑 |
|------|------|
| 優惠券 API Hook | `frontend/hooks/api/useCoupons.ts` — `useCoupons()` |
| 優惠券型別 | `frontend/types/api.ts` — `DiscountCoupon`（含 `id`, `price` 欄位） |
| Query Key | `frontend/lib/queryKeys.ts` — `queryKeys.coupons.list` |
| Popup Store | `frontend/stores/popupStore.ts` — `showPopup()` |
| Popup 元件 | `frontend/components/ui/GlobalPopup.tsx` |
| 玩家 Layout | `frontend/app/(player)/layout.tsx` |

## 注意事項

- `useCoupons()` 已使用 `queryKeys.coupons.list` 作為 query key，polling 應沿用此 key（透過 `refetchInterval` 或獨立 `useQuery`）
- 不在 hook 中自行定義 query key（遵循 `queryKeys.ts` 集中管理原則）
- 元件中禁止直接使用 `fetch()`，一律透過 API hooks
- Import 路徑使用 `@/` alias
