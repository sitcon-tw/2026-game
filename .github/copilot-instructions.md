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

---

## 12. Deployment Strategy

### 12.1 Overview

The project supports two primary deployment methods:

1. **Docker (Containerized Deployment)** — For self-hosted servers or any Docker-compatible platform
2. **Zeabur (Platform as a Service)** — For rapid deployment with auto-scaling and zero configuration

### 12.2 Docker Deployment

#### Prerequisites

- Docker 20.10+ and Docker Compose V2+
- The following files are already configured:
  - `frontend/Dockerfile` — Multi-stage build for optimized image size
  - `frontend/.dockerignore` — Excludes unnecessary files from the image
  - `frontend/docker-compose.yml` — Orchestration configuration
  - `frontend/.env.production` — Production environment variables

#### Configuration

**Critical:** `next.config.ts` must include `output: "standalone"` for Docker deployment:

```typescript
const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://2026-game.sitcon.party/api/:path*",
      },
    ];
  },
};
```

#### Local Testing

```bash
cd frontend

# Build and start container
docker compose up --build -d

# View logs
docker logs -f sitcon-game-frontend

# Stop container
docker compose down
```

#### Production Deployment

**Option A: Docker Hub**

```bash
# Build and tag
docker build -t your-username/sitcon-game-frontend:latest .

# Push to registry
docker push your-username/sitcon-game-frontend:latest

# On production server
docker pull your-username/sitcon-game-frontend:latest
docker run -d \
  --name sitcon-game-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://2026-game.sitcon.party/api \
  --restart unless-stopped \
  your-username/sitcon-game-frontend:latest
```

**Option B: Direct Build on Server**

```bash
# Upload code to server
scp -r frontend/ user@server:/path/to/deploy/

# SSH and deploy
ssh user@server
cd /path/to/deploy/frontend
docker compose up -d
```

#### Nginx Reverse Proxy (Optional)

If you want to use a custom domain with SSL:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable HTTPS with Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

---

### 12.3 Zeabur Deployment (Recommended)

Zeabur provides zero-configuration deployment with automatic HTTPS, CDN, and continuous deployment.

#### Method 1: Auto-Detection (Recommended)

Zeabur automatically detects Next.js projects — no configuration files needed.

**Steps:**

1. **Push code to Git**
   ```bash
   git add .
   git commit -m "Deploy to Zeabur"
   git push origin main
   ```

2. **Create Project on Zeabur**
   - Go to [dash.zeabur.com](https://dash.zeabur.com)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository (`2026-game`)
   - **Important:** Set **Root Directory** to `frontend`

3. **Configure Environment Variables**
   In Zeabur Dashboard → Variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://2026-game.sitcon.party/api
   ```

4. **Deploy**
   - Zeabur automatically runs `pnpm install` and `pnpm build`
   - Your app will be available at `https://your-app.zeabur.app`

**Advantages:**
- Zero configuration — auto-detects Next.js
- Automatic HTTPS with SSL certificate
- Built-in CDN for static assets
- Continuous deployment on every `git push`
- Supports dynamic routes (`/game/[level]`)
- Faster cold starts than Docker

#### Method 2: Docker on Zeabur

If you need more control or custom system packages:

1. **Ensure Docker files exist**
   - `Dockerfile` (already configured)
   - `.dockerignore` (already configured)
   - `next.config.ts` with `output: "standalone"`

2. **Create Project on Zeabur**
   - Same as Method 1
   - Zeabur will detect `Dockerfile` and ask "Use Dockerfile?"
   - Select "Yes"

3. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://2026-game.sitcon.party/api
   ```

4. **Deploy**
   - Zeabur runs `docker build`
   - Deployment complete!

#### Custom Domain Setup

1. In Zeabur Dashboard → Domains → "Add Domain"
2. Enter your domain (e.g., `game.sitcon.party`)
3. Add CNAME record in your DNS:
   ```
   CNAME  game  your-app.zeabur.app
   ```
4. Wait for DNS propagation (usually < 5 minutes)
5. Zeabur automatically provisions SSL certificate

#### Auto-Deployment

- **Enabled by default:** Every `git push` triggers automatic deployment
- **To disable:** Dashboard → Settings → Turn off "Auto Deploy"
- **Branch deployment:** Create separate services for `main` (production) and `dev` (staging)

---

### 12.4 Environment Variables

All deployment methods require these environment variables:

| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://2026-game.sitcon.party/api` | Yes | Backend API endpoint |
| `NODE_ENV` | `production` | Auto-set | Build mode |
| `NEXT_TELEMETRY_DISABLED` | `1` | Optional | Disable Next.js telemetry |

**Important:** Variables prefixed with `NEXT_PUBLIC_` are embedded at build time and accessible in client-side code.

---

### 12.5 Common Issues & Solutions

#### Issue: `useSearchParams()` build error

**Error:**
```
useSearchParams() should be wrapped in a suspense boundary
```

**Solution:** All components using `useSearchParams()` must be wrapped in `<Suspense>`:

```tsx
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MyComponent() {
  const params = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyComponent />
    </Suspense>
  );
}
```

#### Issue: QR Scanner not working

**Cause:** Camera API requires HTTPS.

**Solution:**
- Docker: Use Nginx with SSL certificate
- Zeabur: HTTPS is automatic

#### Issue: API requests fail (CORS)

**Solution:** Ensure backend CORS settings allow your deployment domain:

```go
// Backend CORS configuration
allowedOrigins := []string{
    "https://your-app.zeabur.app",
    "https://game.sitcon.party",
    "http://localhost:3000", // Development
}
```

#### Issue: Dynamic routes return 404

**Solution:** This should not happen with proper Next.js configuration. Check:
1. `next.config.ts` has `output: "standalone"`
2. Build logs show successful page generation
3. All `[param]` folders have `page.tsx` files

---

### 12.6 Deployment Checklist

Before deploying to production:

- [ ] Environment variable `NEXT_PUBLIC_API_BASE_URL` is set correctly
- [ ] `pnpm-lock.yaml` is committed to Git
- [ ] `next.config.ts` has `output: "standalone"` (for Docker)
- [ ] All components using `useSearchParams()` are wrapped in `<Suspense>`
- [ ] Backend CORS allows your deployment domain
- [ ] SSL/HTTPS is configured (required for QR Scanner)
- [ ] Test all dynamic routes (`/game/1` through `/game/40`)
- [ ] Test QR Scanner functionality (requires HTTPS)
- [ ] Test API authentication (cookie-based)
- [ ] Verify leaderboard pagination works
- [ ] Check mobile responsiveness (viewport < 430px)

---

### 12.7 Recommended Workflow

**Development → Staging → Production**

1. **Local Development**
   ```bash
   pnpm dev
   # Test at http://localhost:3000
   ```

2. **Docker Testing**
   ```bash
   docker compose up --build
   # Test containerized build locally
   ```

3. **Staging Deployment (Zeabur `dev` branch)**
   ```bash
   git checkout dev
   git push origin dev
   # Auto-deploys to staging.zeabur.app
   ```

4. **Production Deployment (Zeabur `main` branch)**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   # Auto-deploys to production
   ```

---

### 12.8 Monitoring & Logs

#### Docker

```bash
# View live logs
docker logs -f sitcon-game-frontend

# Check container status
docker ps

# Restart container
docker restart sitcon-game-frontend
```

#### Zeabur

- Dashboard → Logs → Real-time logs
- Dashboard → Deployments → Build logs and deployment history
- Dashboard → Metrics → CPU, Memory, Network usage

---

### 12.9 Quick Reference

| Task | Docker Command | Zeabur Action |
|------|---------------|---------------|
| Deploy | `docker compose up -d` | `git push` (auto-deploys) |
| View logs | `docker logs -f sitcon-game-frontend` | Dashboard → Logs |
| Redeploy | `docker compose up --build -d` | Dashboard → Redeploy |
| Stop | `docker compose down` | Dashboard → Pause Service |
| Environment vars | Edit `docker-compose.yml` | Dashboard → Variables |
| Custom domain | Configure Nginx | Dashboard → Domains |

---

### 12.10 Files Reference

| File | Purpose | Required For |
|------|---------|--------------|
| `Dockerfile` | Container image build instructions | Docker, Zeabur (Docker mode) |
| `.dockerignore` | Exclude files from Docker image | Docker, Zeabur (Docker mode) |
| `docker-compose.yml` | Local Docker orchestration | Local testing only |
| `.env.production` | Production environment variables | Reference only |
| `next.config.ts` | Next.js configuration | All deployments |
| `zbpack.json` | Zeabur build configuration | Zeabur (auto-detect mode) |
| `.zeabur/config.yaml` | Zeabur deployment settings | Zeabur (advanced config) |

**Note:** `docker-compose.yml` is for local development only. Zeabur and most PaaS platforms do not use `docker-compose.yml`.
