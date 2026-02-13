# Monorepo Structure Context
- **Frontend App:** `frontend/`
<!-- - **Shared UI:** `packages/ui` -->
<!-- - **Backend:** `backend/` -->

---

# [Scope: frontend] Frontend Developer Instructions

> SITCON 2026 OMO Rhythm Game - Frontend Copilot Instructions

## 1. Project Overview & Role
**Project:** SITCON 2026 "Grand Game" (大地遊戲) - An OMO (Online-Merge-Offline) web application.
**Role:** Frontend Engineer (Mobile-First PWA).
**Goal:** Create a responsive, interactive web app where users unlock levels by scanning physical QR codes at the venue and play a "Simon Says" style rhythm game on their phones.

---

## 2. Tech Stack & Conventions
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (Mobile-first approach)
- **State Management:** Zustand (Global state: user progress, unlocked levels, audio settings)
- **Data Fetching:** TanStack React Query (`@tanstack/react-query`) — all API calls use custom hooks
- **Animation:** Framer Motion (Critical for game button feedback and page transitions)
- **Audio:** Web Audio API or Howler.js (Low latency is required for rhythm game)
- **Scanner:** `html5-qrcode` or `@yudiel/react-qr-scanner`
- **Language:** TypeScript (Strict mode)
- **Path Alias:** Use `@/...` for all imports (configured in `tsconfig.json`)

---

## 3. Global Design System

### 3.1 Color Palette

```css
/* Primary Colors */
--bg-primary: #EFEBE9;        /* Beige/Cream - Main background */
--bg-secondary: #D7CCC8;      /* Lighter brown - Cards, sections */
--bg-header: #5D4037;         /* Dark brown - Header bar */
--bg-header-accent: #8D6E63;  /* Medium brown - Header gradient */

/* Text Colors */
--text-primary: #5D4037;      /* Dark brown - Main text */
--text-secondary: #8D6E63;    /* Medium brown - Secondary text */
--text-light: #EFEBE9;        /* Cream - Text on dark backgrounds */
--text-gold: #D4AF37;         /* Gold - Highlights, titles */

/* Accent Colors */
--accent-gold: #D4AF37;       /* Gold - Stars, highlights, progress */
--accent-gold-light: #FFD54F; /* Light gold - Hover states */

/* Game Button Colors (Vibrant) */
--btn-red: #D32F2F;
--btn-yellow: #FBC02D;
--btn-green: #7CB342;
--btn-blue: #0288D1;
--btn-orange: #FF8F00;
--btn-purple: #7B1FA2;
--btn-pink: #E91E63;
--btn-cyan: #00ACC1;

/* Status Colors */
--status-success: #4CAF50;
--status-error: #F44336;
--status-locked: #9E9E9E;
```

### 3.2 Typography

```css
/* Font Family */
--font-heading: 'Noto Serif TC', serif;
--font-body: 'Noto Sans TC', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### 3.3 Spacing & Layout

```css
/* Layout Constants */
--header-height: 80px;
--navbar-height: 64px;
--content-max-width: 430px;
--border-radius: 12px;
--border-radius-lg: 16px;
```

### 3.4 Decorative Elements

Based on design mockups:
- **Gold 4-pointed stars** (✦) as decorative accents
- **Curved gold lines** as page dividers
- **Abstract swirl patterns** in backgrounds

---

## 4. Layout System

### 4.1 App Shell Structure

```
┌─────────────────────────────────────┐
│            HEADER (80px)            │
│  [Back] [Title] [Rank] [Progress]   │
├─────────────────────────────────────┤
│                                     │
│           MAIN CONTENT              │
│         (flex-1, scrollable)        │
│                                     │
├─────────────────────────────────────┤
│         BOTTOM NAVBAR (64px)        │
│   [🎵] [🔄] [👥] [📱] [👤]          │
└─────────────────────────────────────┘
```

### 4.2 Header Component
**Path:** `@/components/layout/Header.tsx`

#### Visual Specification
- **Height:** 80px fixed
- **Background:** Gradient `#5D4037` → `#8D6E63`
- **Border:** Bottom gold accent line (2px)

#### Elements
1. **Back Button (←)** - Circular, 32px, only when `canGoBack`
2. **Title** - "SITCON 大地遊戲" in gold (#D4AF37), serif font
3. **Rank Badge** - "第10名" format, cream color
4. **Level Badge** - "第 4 關" format, top-right
5. **Progress Bar** - Gold fill, 6px height

#### Conditional Elements (Game Screen Only)
- **Play Button (▶):** 36px circle, triggers sequence
- **Help Button (?):** 36px circle, shows tutorial

```tsx
const HEADER_CONFIG = {
  '/levels': { showBack: false, showPlay: false, showHelp: false },
  '/game/[id]': { showBack: true, showPlay: true, showHelp: true },
  '/unlock': { showBack: false, showPlay: false, showHelp: false },
  '/scanner': { showBack: false, showPlay: false, showHelp: false },
  '/leaderboard': { showBack: false, showPlay: false, showHelp: false },
  '/rewards': { showBack: true, showPlay: false, showHelp: false },
};
```

### 4.3 Bottom Navigation Bar
**Path:** `@/components/layout/BottomNav.tsx`

#### Visual Specification
- **Height:** 64px fixed
- **Background:** `#5D4037`
- **Position:** Fixed bottom with safe area padding

#### Navigation Items
| Icon | Label | Route |
|------|-------|-------|
| 🎵 | 關卡 | `/levels` |
| 🔄 | 解鎖 | `/unlock` |
| 👥 | 排行榜 | `/leaderboard` |
| 📱 | 掃描 | `/scanner` |
| 👤 | 個人 | `/profile` |

- **Inactive:** Cream (#EFEBE9), opacity 0.6
- **Active:** Gold (#D4AF37), full opacity

### 4.4 Root Layout
**Path:** `@/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-primary min-h-dvh">
        <div className="flex flex-col h-dvh max-w-[430px] mx-auto">
          <Header />
          <main className="flex-1 overflow-y-auto pb-navbar">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
```

---

## 5. Page Specifications

### 5.1 Splash Screen (初始畫面)
**Path:** `@/app/page.tsx`

- **Background:** Dark metallic gradient
- **Logo:** SITCON emblem (metallic disc)
- **Title:** "SITCON" + "大地遊戲" (gold) + "WIDE GAME"
- **Decorative:** Gold stars (✦)
- **Audio Progress:** Waveform with timestamp
- **CTA:** "進入遊戲" button → `/levels`

### 5.2 Level Selection (關卡選擇)
**Path:** `@/app/levels/page.tsx`

- **Grid:** 4 columns, 12px gap
- **Card:** Square, 12px radius

| State | Background | Opacity |
|-------|------------|---------|
| Completed | White | 100% |
| Unlocked | Beige | 80% |
| Locked | Gray | 40% |

### 5.3 Game Screen (遊戲畫面)
**Path:** `@/app/game/[id]/page.tsx`

#### Button Count by Level
| Level | Buttons | Grid |
|-------|---------|------|
| 1 | 2 | 1×2 |
| 2-5 | 4 | 2×2 |
| 6-10 | 8 | 2×4 |
| 11-15 | 12 | 3×4 |
| 16-20 | 16 | 4×4 |
| 21-25 | 20 | 4×5 |
| 26-30 | 24 | 4×6 |
| 31-35 | 28 | 4×7 |
| 36-40 | 32 | 4×8 |

#### Button Colors (repeating pattern)
```typescript
const COLORS = ['#D32F2F', '#FBC02D', '#7CB342', '#0288D1', '#FF8F00', '#7B1FA2', '#E91E63', '#00ACC1'];
```

#### Button States
- **Idle:** Normal
- **Active:** brightness(1.3), glow shadow, scale(1.05)
- **Pressed:** scale(0.95)

#### Success Overlay
- Mascot image + "通關成功！"
- Buttons: "回關卡" | "下一關"

### 5.4 Unlock Methods (解鎖關卡的方式)
**Path:** `@/app/unlock/page.tsx`

Methods:
1. **攤位** - Booth interaction
2. **認識新朋友** - Friend QR scan
3. **打卡** - Venue check-in
4. **闘關** - Challenges

### 5.5 Booth List (攤位清單)
**Path:** `@/app/unlock/booths/page.tsx`

- **Visited:** Full opacity, checkmark
- **Not Visited:** opacity 0.5

### 5.6 QR Scanner (掃描介面)
**Path:** `@/app/scanner/page.tsx`

**Two Modes:**
1. **Scanner** - Camera viewfinder
2. **My QR Code** - Display user's QR (sepia color)

Info text: "還可以認識 N 位朋友"

### 5.7 "Too Extroverted" Modal (你太E了)
**Path:** `@/components/modals/TooExtrovertedModal.tsx`

- Title: "你太E了"
- Message: "請透過其他方式獲得 X 關..."
- **Button: "仍要認識"** ← REQUIRED

### 5.8 Leaderboard (排行榜)
**Path:** `@/app/leaderboard/page.tsx`

- Top 10 + Current user (highlighted) + ±5 neighbors
- Sort: Completed levels (desc) → Completion time (earlier wins)

### 5.9 Rewards (折價券)
**Path:** `@/app/rewards/page.tsx`

#### Coupon Tiers
| Tier | Condition |
|------|-----------|
| A | Top 3 |
| B | All booths + venues |
| C | Top 30% |
| D | Top 60% |
| E | 10 levels |

- **Deadline:** 16:00 (server time)
- **Style:** Vintage tickets with "USED" stamp

### 5.10 Milestone Rewards (獎品兌換頁)
**Path:** `@/app/rewards/milestones/page.tsx`

Vertical timeline: 5關, 20關, 50關, 70關, 100關

---

## 6. Core Logic

### 6.1 Game Engine
```typescript
type GameState = 'IDLE' | 'PLAYING_SEQUENCE' | 'WAITING_INPUT' | 'SUCCESS' | 'FAIL';
```

### 6.2 Unlock System
- Initial: **5 levels unlocked**
- Friend limit: **20** (removed after all booths+venues)

### 6.3 Coupon System
- Deadline: **16:00**
- Redemption: **All at once**

---

## 7. Data Models

```typescript
interface User {
  id: string;
  name: string;
  qrToken: string;
  unlockedLevels: number[];
  completedLevels: number[];
  interactions: {
    booths: string[];
    friends: string[];
    venues: string[];
    challenges: string[];
  };
  stats: { rank: number; friendUnlockCount: number; };
}

interface LevelConfig {
  id: number;
  buttonCount: number;
  gridCols: number;
  gridRows: number;
  sequenceLength: number;
  tempo: number;
}

type CouponTier = 'A' | 'B' | 'C' | 'D' | 'E';
```

---

## 8. Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── levels/page.tsx
│   ├── game/[id]/page.tsx
│   ├── unlock/
│   │   ├── page.tsx
│   │   ├── booths/page.tsx
│   │   └── venues/page.tsx
│   ├── scanner/page.tsx
│   ├── leaderboard/page.tsx
│   ├── rewards/
│   │   ├── page.tsx
│   │   ├── detail/page.tsx
│   │   └── milestones/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── PageContainer.tsx
│   ├── game/
│   │   ├── RhythmBoard.tsx
│   │   ├── GameButton.tsx
│   │   └── GameOverlay.tsx
│   ├── levels/
│   │   ├── LevelGrid.tsx
│   │   └── LevelCard.tsx
│   ├── scanner/
│   │   ├── QRScanner.tsx
│   │   └── QRDisplay.tsx
│   ├── unlock/
│   │   ├── UnlockMethodCard.tsx
│   │   └── BoothList.tsx
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx
│   ├── rewards/
│   │   ├── CouponGauge.tsx
│   │   ├── CouponTicket.tsx
│   │   └── MilestoneTimeline.tsx
│   ├── modals/
│   │   ├── TutorialModal.tsx
│   │   ├── SuccessModal.tsx
│   │   └── TooExtrovertedModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useGameEngine.ts
│   ├── useAudio.ts
│   ├── useScanner.ts
│   ├── useUnlockSystem.ts
│   └── useServerTime.ts
├── stores/
│   ├── userStore.ts
│   └── gameStore.ts
├── lib/
│   ├── api.ts
│   ├── constants.ts
│   └── utils.ts
├── types/index.ts
├── styles/globals.css
└── public/
    ├── fonts/
    ├── images/
    └── sounds/
```

---

## 9. Tailwind Configuration

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#EFEBE9',
        brown: { DEFAULT: '#5D4037', light: '#8D6E63' },
        gold: { DEFAULT: '#D4AF37', light: '#FFD54F' },
        game: {
          red: '#D32F2F', yellow: '#FBC02D', green: '#7CB342', blue: '#0288D1',
          orange: '#FF8F00', purple: '#7B1FA2', pink: '#E91E63', cyan: '#00ACC1',
        },
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'serif'],
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      spacing: { header: '80px', navbar: '64px' },
    },
  },
};
```

---

## 10. Critical Notes

### Path Aliases
```typescript
// ✅ Always use
import { Button } from '@/components/ui/Button';

// ❌ Never use relative paths
import { Button } from '../../components/ui/Button';
```

### Layout Visibility
| Page | Back | Play/Help | BottomNav |
|------|------|-----------|-----------|
| Splash | ❌ | ❌ | ❌ |
| Levels | ❌ | ❌ | ✅ |
| Game | ✅ | ✅ | ✅ |
| Unlock | ❌ | ❌ | ✅ |
| Scanner | ❌ | ❌ | ✅ |

### Checklist
- [ ] `@/` path aliases everywhere
- [ ] Hide Play/Help except game screen
- [ ] Initial levels = 5
- [ ] Button count: +4 every 5 levels, max 32
- [ ] Friend limit = 20
- [ ] "仍要認識" button on "你太E了" modal
- [ ] Coupon deadline = 16:00 (server time)
- [ ] Coupons used all at once
- [ ] Leaderboard: Top 10 + User + ±5
- [ ] Preload audio
- [ ] Gold stars (✦) decorations
- [ ] Serif headings, sans-serif body

## API document

The file is at ./api/api-1.json. Please refer to it for API details when implementing frontend features.

---

## 11. TanStack React Query — API Data-Fetching Layer

> All server-state is managed through `@tanstack/react-query`. **Never** use raw `fetch` or `useEffect` for API calls in page/component code — always go through the hooks defined in `@/hooks/api/`.

### 11.1 Architecture Overview

```
frontend/
├── components/providers/QueryProvider.tsx   ← QueryClientProvider ("use client")
├── lib/
│   ├── api.ts                               ← Thin fetch wrapper with error handling
│   └── queryKeys.ts                         ← Centralised query-key constants
├── types/api.ts                             ← API response/request TypeScript types
└── hooks/api/
    ├── index.ts                             ← Barrel re-export
    ├── useUser.ts                           ← /users/*
    ├── useActivities.ts                     ← /activities/*
    ├── useGames.ts                          ← /games/*
    ├── useFriendships.ts                    ← /friendships/*
    └── useCoupons.ts                        ← /discount-coupons/*
```

### 11.2 QueryProvider

**Path:** `@/components/providers/QueryProvider.tsx`

Wrapped inside **both** `(player)/layout.tsx` and `(booth)/layout.tsx`.

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### 11.3 API Client (`@/lib/api.ts`)

- Base URL from `process.env.NEXT_PUBLIC_API_BASE_URL` (default `"/api"`)
- All requests include `credentials: "include"` (cookie-based auth)
- Throws `ApiError` with `status` and parsed body on non-2xx responses
- Provides `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.patch<T>`, `api.delete<T>`

```typescript
export class ApiError extends Error {
  constructor(public status: number, public data: { message?: string }) { ... }
}
```

### 11.4 Query Keys (`@/lib/queryKeys.ts`)

All keys are `as const` tuples for type safety and targeted invalidation.

```typescript
export const queryKeys = {
  user: {
    me:      ["user", "me"]      as const,
    session: ["user", "session"] as const,
  },
  activities: {
    stats:      ["activities", "stats"]        as const,
    boothStats: ["activities", "booth", "stats"] as const,
  },
  games: {
    leaderboard: (page?: number) => ["games", "leaderboard", page ?? 1] as const,
  },
  friendships: {
    list:  ["friendships"]          as const,
    count: ["friendships", "count"] as const,
  },
  coupons: {
    list: ["coupons"] as const,
  },
} as const;
```

### 11.5 API Types (`@/types/api.ts`)

Types are derived from the Swagger definitions in `./api/api-1.json`.

Key response types (keep these in sync with the spec):

| Swagger definition | TS type | Notes |
|-|-|-|
| `models.User` | `User` | `id`, `nickname`, `current_level`, `unlock_level`, `qrcode_token`, `coupon_token`, `last_pass_time`, timestamps |
| `activities.activityWithStatus` | `ActivityWithStatus` | `id`, `name`, `type` ("booth"/"checkin"/"challenge"), `visited` |
| `activities.checkinResponse` | `CheckinResponse` | `status` |
| `activities.countResponse` | `ActivityCountResponse` | `count` |
| `game.RankResponse` | `RankResponse` | `rank` (global page), `around` (±5), `me`, `page` |
| `game.RankEntry` | `RankEntry` | `nickname`, `level`, `rank` |
| `game.SubmitResponse` | `SubmitResponse` | `current_level`, `unlock_level`, `coupons[]` |
| `friend.countResponse` | `FriendCountResponse` | `count`, `max` |
| `models.DiscountCoupon` | `DiscountCoupon` | `id`, `discount_id`, `price`, `user_id`, `used_at`, `used_by`, `history_id`, timestamps |
| `discount.getUserCouponsResponse` | `GetUserCouponsResponse` | `coupons[]`, `total` |
| `discount.discountUsedResponse` | `DiscountUsedResponse` | `user_id`, `user_name`, `coupons[]`, `total`, `count`, `coupon_token`, `used_at`, `used_by` |
| `discount.historyItem` | `DiscountHistoryItem` | `id`, `user_id`, `nickname`, `staff_id`, `total`, `used_at` |
| `models.Staff` | `Staff` | `id`, `name`, `token`, timestamps |
| `res.ErrorResponse` | `ErrorResponse` | `message` |

### 11.6 Hooks Reference

All hooks live in `@/hooks/api/` and are re-exported from `@/hooks/api/index.ts`.

#### Player hooks

| Hook | Method | Endpoint | Type | Invalidates |
|-|-|-|-|-|
| `useCurrentUser()` | `useQuery` | `GET /users/me` | `User` | — |
| `useSession()` | `useQuery` | (validate cookie) | `SessionResponse` | — |
| `useLoginWithToken()` | `useMutation` | `POST /users/session` | `User` | `user.me`, `user.session` |
| `useActivityStats()` | `useQuery` | `GET /activities/stats` | `ActivityWithStatus[]` | — |
| `useCheckinActivity()` | `useMutation` | `POST /activities/{activityQRCode}` | `CheckinResponse` | `activities.stats`, `user.me` |
| `useLeaderboard(page)` | `useQuery` | `GET /games/leaderboards?page=` | `RankResponse` | — |
| `useSubmitLevel()` | `useMutation` | `POST /games/submissions` | `SubmitResponse` | `user.me`, `games.*` |
| `useFriendCount()` | `useQuery` | `GET /friendships/stats` | `FriendCountResponse` | — |
| `useAddFriend()` | `useMutation` | `POST /friendships/{userQRCode}` | `string` | `friendships.*`, `user.me` |
| `useCoupons()` | `useQuery` | `GET /discount-coupons` | `DiscountCoupon[]` | — |

#### Booth hooks

| Hook | Method | Endpoint | Type | Invalidates |
|-|-|-|-|-|
| `useBoothLogin()` | `useMutation` | `POST /activities/booth/session` | `string` | — |
| `useBoothStats()` | `useQuery` | `GET /activities/booth/stats` | `ActivityCountResponse` | — |
| `useBoothCheckin()` | `useMutation` | `POST /activities/booth/user/{userQRCode}` | `CheckinResponse` | `activities.boothStats` |

#### Staff / Discount hooks

| Hook | Method | Endpoint | Type | Invalidates |
|-|-|-|-|-|
| `useStaffLogin()` | `useMutation` | `POST /discount-coupons/staff/session` | `Staff` | — |
| `useStaffLookupCoupons(token)` | `useQuery` | `GET /discount-coupons/staff/coupon-tokens/{token}` | `GetUserCouponsResponse` | — |
| `useStaffRedeemCoupon()` | `useMutation` | `POST /discount-coupons/staff/{token}/redemptions` | `DiscountUsedResponse` | lookupCoupons, history |
| `useStaffRedemptionHistory()` | `useQuery` | `GET /discount-coupons/staff/current/redemptions` | `DiscountHistoryItem[]` | — |

### 11.7 Convention Rules

1. **Always import hooks from `@/hooks/api`**, never call `api.get()` directly in components.
2. **Mutations must invalidate** related queries on success (see table above).
3. **Login mutations** send `Authorization: Bearer {token}` header (not cookie); all other endpoints rely on the cookie set by login.
4. **Query keys** must come from `@/lib/queryKeys.ts` — never hardcode key arrays.
5. **Error handling:** Components can use `isError` / `error` from the hook; `ApiError.status` is available for conditional UI (e.g. 401 → redirect to login).
6. **Optimistic updates** are encouraged for mutations with immediate UI feedback (e.g. level completion).
7. **Environment variable:** `NEXT_PUBLIC_API_BASE_URL` in `.env.local` — defaults to `"/api"` (proxy in dev, same-origin in prod).

### 11.8 Usage Example

```tsx
"use client";
import { useCurrentUser, useActivityStats } from "@/hooks/api";

export default function SomePage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: activities } = useActivityStats();

  if (isLoading) return <div>載入中...</div>;
  return <div>歡迎，{user?.nickname}！</div>;
}
```