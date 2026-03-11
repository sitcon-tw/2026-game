# Hotfix: Coupon Page Crash (Aw, Snap! Error code: 5)

## Bug 現象

- 開啟 `/coupon` 頁面後，瀏覽器分頁直接 crash (Chrome Error code: 5)
- JS Heap 指數型飆升至 3GB+
- 非一般 JS error，是整個 tab 被 OOM kill
- 多數使用者皆能重現

## Root Cause Analysis

### 直接原因：`max_qty: 999999999` + API 回傳 `null` = 同步建立 40 億物件

**已確認的 API 回應：**

- `GET /discount-coupons`（使用者的折價券）→ 回傳 **`null`**（非空陣列 `[]`）
- `GET /discount-coupons/coupons`（折價券定義）→ 回傳 4 個 definition，每個 `max_qty: 999999999`

**Crash 流程：**

1. `api.get()` 中 `JSON.parse("null")` 回傳 `null`
2. React Query 的 `data` = `null`
3. `CouponPage` 中 `coupons ?? []` = `[]`（null 被正確處理為空陣列）
4. `buildDisplayList(definitions, [])` — 使用者沒有任何 coupon
5. 進入 `page.tsx:66-75` 的 else 分支：

```tsx
// 使用者沒有任何 coupon → owned = [] → 進入 else
else {
  for (let i = 0; i < def.max_qty; i++) {  // 999,999,999 次迭代！
    items.push({ status: "locked", ... });
  }
}
```

6. **4 個 definition × 999,999,999 = 嘗試建立 ~40 億個物件**
7. 同步 push loop 把 JS Heap 灌爆 → OOM → Tab crash

### 為什麼 Heap 是「指數型」增長？

`Array.push` 在底層使用動態陣列。當容量不足時，V8 會**倍增**分配新記憶體（amortized doubling）。所以 heap 呈指數型階梯式增長，直到 OOM。

### 次要問題：雙層 `<html><body>` + 雙重 `QueryProvider`

`app/layout.tsx` (root) 與 `app/(player)/layout.tsx` 同時定義了 `<html>`, `<body>`, `QueryProvider`：

```
<html>                          ← root layout
  <body>                        ← root layout
    <QueryProvider>             ← QueryClient #1
      <html>                    ← (player) layout ❌ 非法嵌套
        <body>                  ← (player) layout ❌ 非法嵌套
          <QueryProvider>       ← QueryClient #2 ❌ 重複
            <AppShell>
              <CouponPage/>
            </AppShell>
          </QueryProvider>
        </body>
      </html>
      <GlobalPopup/>
    </QueryProvider>
  </body>
</html>
```

後果：
- 非法 HTML → hydration mismatch warning
- 重複 QueryProvider → 兩套獨立 cache
- 非 crash 的直接原因，但會導致其他隱性問題

## Affected Files

| File | Issue |
|------|-------|
| `frontend/app/(player)/coupon/page.tsx:55-75` | `max_qty` 無上限保護，迴圈建立 ~40 億物件 → **Crash 直接原因** |
| `frontend/app/(player)/layout.tsx` | 非法嵌套 `<html><body>` + 重複 `QueryProvider` |
| `frontend/app/(player)/coupon/error.tsx` | **不存在** — 缺少 Error Boundary |

---

## Fix Plan

### Step 1（核心修復）：`buildDisplayList` 加入 `max_qty` 上限 + locked 只顯示數量

**問題本質**：locked coupon 不需要逐一渲染，只需顯示「還能獲得幾張」。
`max_qty: 999999999` 是後端表示「無上限」的方式，前端不應照字面建立物件。

**修改** `frontend/app/(player)/coupon/page.tsx`：

```tsx
// buildDisplayList 內：

const MAX_LOCKED_DISPLAY = 3; // 每個 definition 最多顯示幾張 locked

for (const def of definitions) {
  const owned = couponsByDefId.get(def.id) ?? [];

  if (owned.length > 0) {
    for (const c of owned) {
      items.push({
        status: c.used_at ? "used" : "unused",
        coupon: c,
        price: c.price,
        definitionId: def.id,
      });
    }
    // 只顯示有限數量的 locked 佔位
    const remaining = Math.min(def.max_qty - owned.length, MAX_LOCKED_DISPLAY);
    for (let i = 0; i < remaining; i++) {
      items.push({ status: "locked", price: def.amount, passLevel: def.pass_level, description: def.description, definitionId: def.id });
    }
  } else {
    // 沒有 owned → 只顯示有限數量的 locked
    const displayCount = Math.min(def.max_qty, MAX_LOCKED_DISPLAY);
    for (let i = 0; i < displayCount; i++) {
      items.push({ status: "locked", price: def.amount, passLevel: def.pass_level, description: def.description, definitionId: def.id });
    }
  }
}
```

同時加入輸入驗證：

```tsx
// CouponPage 內
const safeDefinitions = Array.isArray(definitions) ? definitions : [];
const safeCoupons = Array.isArray(coupons) ? coupons : [];
const displayList = buildDisplayList(safeDefinitions, safeCoupons);
```

### Step 2（安全網）：新增 Coupon 頁面 Error Boundary

**建立** `frontend/app/(player)/coupon/error.tsx`：

```tsx
"use client";

export default function CouponError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">
        無法載入折價券
      </h2>
      <p className="text-sm text-[var(--text-secondary)]">
        發生錯誤，請重新嘗試
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-[var(--accent-gold)] px-8 py-3 text-base font-bold text-white"
      >
        重新載入
      </button>
    </div>
  );
}
```

### Step 3（結構修復）：修正 `(player)/layout.tsx` — 移除非法嵌套

**修改** `frontend/app/(player)/layout.tsx`：移除 `<html>`, `<body>`, 重複的 `QueryProvider` 和重複的 font/css import。

```tsx
// BEFORE (有問題)
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import "@/app/globals.css";
// ...
export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className={...}>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}

// AFTER (修正後)
import AppShell from "@/components/layout/(player)/AppShell";

export default function PlayerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
```

---

## Implementation Priority

| Priority | Step | 說明 |
|----------|------|------|
| **P0** | Step 1 | `max_qty` cap + 輸入驗證 — **Crash 的直接原因** |
| **P0** | Step 2 | 新增 error boundary — 安全網，防止未來 crash loop |
| **P1** | Step 3 | 修正 layout 嵌套 — 結構性問題，影響全域 |

## Verification

1. **修復後基本測試**：開啟 `/coupon` 頁面，確認不再 crash
2. **DevTools Performance**：觀察 JS Heap，應維持穩定（< 50MB）
3. **邊界測試**：確認 API 回傳 `null` 時頁面正常顯示空列表
4. **DOM 結構**：確認 locked coupon 最多只顯示 `MAX_LOCKED_DISPLAY` 張
5. **React DevTools**：確認無 hydration mismatch warning（Step 3 修復後）
6. **其他頁面回歸**：確認 `/game`, `/friends` 等頁面功能正常
