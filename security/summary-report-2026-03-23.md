# Security Summary Report
- Project: 2026-game
- Source reports: `2026-03-23_16-55-41.md`, `2026-03-23_16-55-52.md`, `2026-03-23_16-59-05.md`, `2026-03-23_16-59-26.md`
- Summary date: 2026-03-23
- Context: system lifetime = 1 day

## Executive Summary
- 四份報告的結論高度一致：目前最高風險不是傳統 SQLi/XSS，而是 token/session 設計與登入流程暴露，這些問題在活動當天可被立即重放利用。
- 共同高風險主題包含：`?token=` URL 登入、前端把 token 存進 localStorage / JS 可讀 cookie、後端直接把原始 secret 當 session、以及 `/games/submissions` 可被腳本濫用。
- 若 repo 內提交的 `.env`、seed token、登入連結曾實際用於正式環境，風險等級會再提升到接近「拿到 repo 即可直接接管 admin / player / staff / booth 流程」。
- 對 1 天壽命的系統來說，最值得搶修的是能立刻阻止帳號接管、權限濫用、coupon 濫發與排行榜污染的項目；一般性 hardening 應排在後面。

## Consolidated Findings
### 1. Token / Session handling 是核心風險
- 四份報告都指出 login token 被放在 URL、瀏覽器可見儲存與 cookie 中，任何瀏覽器歷史、截圖、共享裝置、extension、trace/log 洩漏都可能直接變成帳號接管。
- player/staff/booth/admin token 都存在相同模式，其中 admin 風險最高，因為報告指出 `ADMIN_KEY` 直接被重用為登入與 session 驗證依據。
- 多份報告提到前端實作反而繞過後端 `HttpOnly` cookie 保護：後端雖設 `HttpOnly`，前端卻又把 raw token 寫進 JS 可讀 cookie 與 persisted store。

### 2. Privileged login flow 容易被重放與擴散
- admin / cashier / booth / player 流程普遍接受 `?token=` 自動登入，且沒有在進頁後立即清掉 URL。
- 一份報告已觀察到 token 出現在 `frontend/.next/dev/trace`，代表這種設計不只是理論風險，實際上已可能進入本地 trace / log。
- 若這些連結透過群組訊息、文件、QR code 或手機分享傳遞，活動現場的外洩與轉傳風險非常高。

### 3. `/games/submissions` 是最明確的業務濫用面
- 兩份報告明確點出 `POST /api/games/submissions` 幾乎無驗證，只要滿足少量條件就能推進關卡、排名與 coupon issuance。
- 這是 1 天活動場景中特別高價值的攻擊面，因為不需要長期潛伏，腳本即可立刻影響公平性、排行榜與發券。

### 4. Secrets / seed data 可能已構成即時接管風險
- 一份報告將 `backend/.env` 中的 `ADMIN_KEY` 與 DB 連線資訊列為 Critical，若仍為正式值，攻擊者可直接取得管理權限或資料庫存取。
- 另一份報告指出 repo 中存在可預測或已提交的 user/staff/booth token、登入 CSV 與 seed data；若正式環境曾匯入，等同大量憑證已外洩。
- 另有報告指出 Docker build 目前會把整個 backend context `COPY . .`，在沒有 `.dockerignore` 的情況下，本地 `.env` 可能被帶入 build context 或 cache。

### 5. 次高優先但成本低的風險
- 多份報告提到 `/metrics` 與 `/docs` 可能在 prod 對外暴露，會降低攻擊者的偵察成本。
- 一份報告指出前端使用 `next 16.1.6` 且有 external rewrite `/api/*`，命中已知 request smuggling 風險條件；若為自架 `next start`，建議直接升版。
- 另有報告指出登入端點缺乏 pre-auth rate limit，會放大弱 token、已外洩 token 或撞號嘗試的成功率。

## Cross-Report Consensus
### Critical / High consensus
- URL token login 應立即移除或至少在前端第一時間 scrub。
- 不應再把 raw token 存在 localStorage、Zustand persist、或 JS 可讀 cookie。
- admin session 不應直接重用 `ADMIN_KEY`；所有原始 bearer secret 都應與 session 分離。
- `/games/submissions` 需立即補強或暫時關閉 coupon / progression side effects。

### Medium consensus
- 對所有 session/login endpoint 加上 pre-auth rate limit。
- 關閉或限制 `/metrics`、`/docs`。
- 升級 `next` 至安全版本，並檢查 rewrite/proxy 邊界。
- 補上 `backend/.dockerignore`，避免 `.env` 進入 Docker build context。

## Recommended Fix Priority
### P0 - 活動前必修
1. 停止所有 `?token=` 登入流程，改為 POST body、Authorization header 或一次性 code exchange。
2. 前端移除所有 raw token 持久化邏輯，只保留 server-set `HttpOnly` session cookie。
3. 將 admin/staff/booth/player 的原始 secret 與 session 分離，縮短 TTL，必要時加入 rotation / logout。
4. 立即封住 `/games/submissions` 濫用路徑；若來不及完整修補，先停 coupon issuance 與排行榜推進。
5. 若 `.env`、seed token、CSV login link 曾用於正式環境，立刻全面輪替與失效。

### P1 - 低成本高報酬
1. 對所有 login/session endpoint 加 pre-auth rate limit 與告警。
2. 關閉正式環境 `/docs`，限制 `/metrics` 為內網或管理 ACL。
3. 升級 `next` 到 `16.1.7+`，或先在 edge/proxy 阻擋高風險 rewritten request 型態。
4. 新增 `backend/.dockerignore`，避免 `.env` 與本地敏感檔案進入 build context。

### P2 - 可延後
- 通用型 hardening（CSP、security headers 微調、廣泛依賴升級）可在上述 exploitability 問題處理後再做。

## Items Needing Manual Confirmation
- `backend/.env` 內的 `ADMIN_KEY`、DB credentials 是否仍是正式環境現值。
- `backend/data/*.json`、`backend/data/SITCON_2026_users.csv` 等 seed/token 資料是否曾匯入正式環境。
- staff / booth / admin login link 是否透過可轉傳連結、公開文件或群組訊息發放。
- 正式環境是否真的對外暴露 `/metrics`、`/docs`。
- 部署鏈是否使用 remote Docker builder / cache，使 `.env` build context 風險更實際。

## Final Assessment
- 這四份報告彼此沒有明顯衝突，且主軸非常集中：目前系統最需要處理的是「憑證暴露後可立即重放」與「遊戲流程可立即濫用」。
- 若只能修少數項目，建議依序處理：URL token、client-side token persistence、admin/session secret reuse、`/games/submissions`、以及已提交 secrets/token 的輪替。
- 未發現比上述更高價值、且更值得在活動前搶修的 SQLi / XSS / authz bypass 類問題。
