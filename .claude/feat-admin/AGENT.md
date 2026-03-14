# 管理員後台系統 — Feature Spec

## 功能描述

建立管理員後台系統，路由位於 `/(internal)/admin`。包含 token 登入、折價券管理（CRUD）、以及指定 user 新增折價券的功能。所有操作皆需管理員身份。

## 動機與使用情境

活動工作人員需要後台管理折價券的發放與編輯，以及針對特定玩家發放折價券。

---

## 相關 API

所有 admin API 需要 `admin_token` cookie，透過 `POST /api/admin/session` 取得。

| 用途 | Method | Path | Request | Response |
|------|--------|------|---------|----------|
| 管理員登入 | POST | `/admin/session` | Header: `Authorization: Bearer {admin_key}` | `admin.loginResponse` (設定 cookie) |
| 搜尋使用者 | GET | `/admin/users?q={keyword}&limit={n}` | Query params | `models.User[]` |
| 指定 user 發放折價券 | POST | `/admin/discount-coupons/assignments` | `{ user_id, discount_id, price }` | `models.DiscountCoupon` |
| 列出 gift coupons | GET | `/admin/gift-coupons` | - | `models.DiscountCouponGift[]` |
| 建立 gift coupon | POST | `/admin/gift-coupons` | `{ discount_id, price }` | `models.DiscountCouponGift` |
| 刪除 gift coupon | DELETE | `/admin/gift-coupons/{id}` | Path param: id | 204 No Content |
| 取得折扣券規則 | GET | `/discount-coupons/coupons` | - | `discount.couponRuleWithStatus[]` |
| 玩家兌換 gift token | POST | `/discount-coupons/gifts` | `{ token }` | `models.DiscountCoupon` |

---

## 任務清單

### 前端

#### 登入

- [x] Admin login page (`/(internal)/admin`)，透過 URL params (`token`) 自動呼叫 `POST /admin/session` 進行登入
- [x] 登入成功後導向管理後台首頁
- [x] 建立 admin auth guard（檢查 admin session 狀態）

#### Gift 折價券管理（產生 token 讓玩家領取）

- [x] Gift 折價券總覽 list 頁面 — 呼叫 `GET /admin/gift-coupons` 列出所有 gift coupons
- [x] 新增 gift coupon — 呼叫 `POST /admin/gift-coupons`，選擇 `discount_id`（從 `GET /discount-coupons/coupons` 取得規則列表），price 自動帶入規則金額
- [x] 刪除 gift coupon — 呼叫 `DELETE /admin/gift-coupons/{id}`（已被兌換的票券會提示無法刪除）
- [x] 玩家端：在 coupon page 加入兌換 code 入口 — 呼叫 `POST /discount-coupons/gifts` 以 token 兌換折價券（已存在）

#### 指定 user 新增折價券

- [x] 搜尋 user 頁面 — 呼叫 `GET /admin/users?q={keyword}` 搜尋玩家
- [x] 選擇 user 後填入折價券資訊（`discount_id`，price 自動帶入）並指派 — 呼叫 `POST /admin/discount-coupons/assignments`

### API Hooks

- [x] 建立 `useAdmin.ts` hook（包含 admin session、gift coupon CRUD、user 搜尋、指派折價券）
- [x] 在 `queryKeys.ts` 新增 admin 相關 query keys

### 路由結構

```
app/(internal)/admin/
├── page.tsx              # 登入頁（讀取 URL token 自動登入）
├── layout.tsx            # Admin layout（auth guard）
├── gift-coupons/
│   └── page.tsx          # Gift 折價券總覽 + 新增/刪除
└── assign/
    └── page.tsx          # 搜尋 user + 指派折價券
```

---

## 影響範圍

- 新增 `app/(internal)/admin/` 路由與頁面
- 新增 `hooks/api/useAdmin.ts`
- 更新 `lib/queryKeys.ts`
- 更新 `types/api.ts`（新增 admin 相關型別）
- 更新玩家端 coupon page（加入 gift token 兌換入口）

## 設計注意事項

- 沿用 `(internal)` route group 的 layout 風格
- Mobile-first，最大寬度 430px
- Loading 狀態使用 `animate-pulse` skeleton
- 所有 API 呼叫透過 React Query hooks，禁止直接 `fetch()`
- Import 路徑使用 `@/` alias
