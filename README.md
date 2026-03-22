# SITCON 2026 大地遊戲

SITCON 2026 大地遊戲 專案，包含遊戲前端、後端 API，還有文件網站。

## 專案結構

- `frontend/`：Next.js 遊戲前端
- `backend/`：Go 後端 API 與資料匯入工具
- `docs/`：Astro + Starlight 文件站

## 快速開始

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

預設會開在 `http://localhost:3000`。

### Backend

先啟動資料庫：

```bash
cd backend
docker compose -f compose.dev.yaml up -d
```

再準備環境變數並啟動 API：

```bash
cp .env.example .env
just run
```

後端預設會開在 `http://localhost:8000`。

另外需要依需求設定這兩個 Google Sheet CSV 來源：

```bash
LEVEL_CSV_URL="https://docs.google.com/spreadsheets/d/<sheet-id>/export?format=csv&gid=<gid>"
SHEET_MUSIC_CSV_URL="https://docs.google.com/spreadsheets/d/<sheet-id>/export?format=csv&gid=<gid>"
```

### Docs

```bash
cd docs
pnpm install
pnpm dev
```

文件站預設會開在 `http://localhost:4321`。

## 常用指令

- `frontend/`: `pnpm dev`, `pnpm build`, `pnpm lint`
- `backend/`: `just run`, `just dev`, `just test`, `just lint`
- `docs/`: `pnpm dev`, `pnpm build`, `pnpm test`

## 補充

- 後端更完整的啟動說明在 `backend/README.md`
- 前端目前的 `/api` rewrite 設定在 `frontend/next.config.ts`
