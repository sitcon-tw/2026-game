# Zeabur 部署指南

## 🚀 方法 1：自動檢測 Next.js（推薦）

Zeabur 會自動識別 Next.js 項目，無需 Docker 配置。

### 步驟

1. **推送程式碼到 Git**
   ```bash
   git add .
   git commit -m "Ready for Zeabur deployment"
   git push origin main
   ```

2. **在 Zeabur 建立專案**
   - 前往 [zeabur.com](https://zeabur.com)
   - 點擊「New Project」
   - 選擇「Deploy from GitHub」
   - 選擇你的 repository（`2026-game`）
   - Zeabur 會自動檢測為 Next.js 項目

3. **設定環境變數**
   在 Zeabur Dashboard 中設定：
   ```
   NEXT_PUBLIC_API_BASE_URL=https://2026-game.sitcon.party/api
   ```

4. **部署**
   - Zeabur 會自動執行 `pnpm install` 和 `pnpm build`
   - 幾分鐘後就可以訪問你的應用！

### 優點
- ✅ 零配置，自動檢測
- ✅ 自動 HTTPS
- ✅ 自動 CD（push 即部署）
- ✅ 內建 CDN
- ✅ 支援動態路由
- ✅ 比 Docker 更快的冷啟動

---

## 🐳 方法 2：使用 Docker 部署

如果你想使用 Docker（例如需要更多控制權）：

### 步驟

1. **確保檔案存在**
   - ✅ `Dockerfile`（已建立）
   - ✅ `.dockerignore`（已建立）
   - ✅ `next.config.ts` 有 `output: "standalone"`（已設定）

2. **在 Zeabur 建立專案**
   - 同上步驟 1-2

3. **Zeabur 會自動檢測 Dockerfile**
   - 如果偵測到 `Dockerfile`，Zeabur 會詢問是否使用 Docker 建置
   - 選擇「Use Dockerfile」

4. **設定環境變數**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://2026-game.sitcon.party/api
   ```

5. **部署**
   - Zeabur 會執行 `docker build`
   - 部署完成！

### 優點
- ✅ 完全控制建置過程
- ✅ 與本地環境一致
- ✅ 可以加入自訂套件

---

## 🔧 進階設定

### 自訂 Build Command

如果需要自訂建置指令，可以在 Zeabur Dashboard 的「Settings」中設定：

```bash
# Build Command
pnpm install && pnpm build

# Start Command  
pnpm start
```

### 自訂 Port

Zeabur 會自動處理 Port，無需設定。Next.js 預設使用 3000，Zeabur 會自動映射。

### 設定 Root Directory

如果你的前端在 monorepo 中（如 `frontend/` 資料夾）：

1. 在 Zeabur Dashboard 中點擊「Settings」
2. 設定 **Root Directory** 為 `frontend`
3. 儲存並重新部署

---

## 📊 監控與日誌

### 查看建置日誌
1. 前往 Zeabur Dashboard
2. 點擊你的服務
3. 點擊「Deployments」分頁
4. 點擊最新的部署查看詳細日誌

### 查看執行日誌
1. 點擊「Logs」分頁
2. 即時查看應用程式日誌

---

## 🌐 自訂域名

### 設定域名

1. 在 Zeabur Dashboard 中點擊「Domains」
2. 點擊「Add Domain」
3. 輸入你的域名（例如 `game.sitcon.party`）
4. 在 DNS 設定中新增 CNAME 記錄：
   ```
   CNAME  game  your-app.zeabur.app
   ```
5. 等待 DNS 生效（通常幾分鐘）
6. Zeabur 會自動配置 SSL 證書

---

## 🔄 自動部署

### 設定自動部署

Zeabur 預設會在每次 `git push` 時自動部署。

**關閉自動部署**（如果需要）：
1. 前往「Settings」
2. 關閉「Auto Deploy」
3. 之後需要手動點擊「Redeploy」

### 分支部署

Zeabur 支援多分支部署：
- `main` → 生產環境
- `dev` → 開發環境

在建立服務時選擇對應的分支即可。

---

## 🐛 常見問題

### 問題 1：建置失敗 - 找不到模組

**解決方案**：確保 `pnpm-lock.yaml` 已提交到 Git

```bash
git add pnpm-lock.yaml
git commit -m "Add pnpm lock file"
git push
```

### 問題 2：環境變數沒有生效

**解決方案**：
1. 檢查變數名稱是否以 `NEXT_PUBLIC_` 開頭
2. 修改環境變數後需要重新部署
3. 在 Zeabur Dashboard 點擊「Redeploy」

### 問題 3：API 請求失敗（CORS）

**解決方案**：確保後端 API 的 CORS 設定允許你的 Zeabur 域名

在後端設定：
```go
// 允許 Zeabur 域名
allowedOrigins := []string{
    "https://your-app.zeabur.app",
    "https://game.sitcon.party", // 你的自訂域名
}
```

### 問題 4：QR Scanner 無法使用

**原因**：相機權限需要 HTTPS

**解決方案**：Zeabur 自動提供 HTTPS，確保使用 `https://` 訪問（不是 `http://`）

### 問題 5：動態路由 404

**解決方案**：Zeabur 自動支援 Next.js 動態路由，無需額外設定。如果遇到問題：

1. 確認 `next.config.ts` 沒有錯誤配置
2. 檢查建置日誌是否有錯誤
3. 嘗試重新部署

---

## 📋 部署檢查清單

- [ ] 程式碼已推送到 Git
- [ ] `pnpm-lock.yaml` 已提交
- [ ] 環境變數已設定（`NEXT_PUBLIC_API_BASE_URL`）
- [ ] Root Directory 設定正確（如果在 monorepo 中）
- [ ] 建置成功（查看 Deployments 日誌）
- [ ] 訪問 Zeabur 提供的 URL 正常顯示
- [ ] 測試動態路由（`/game/1` ~ `/game/40`）
- [ ] 測試 API 連接
- [ ] 測試 QR Scanner（HTTPS）
- [ ] 設定自訂域名（如果需要）
- [ ] SSL 證書已自動配置

---

## ⚡ 效能優化

### 啟用 CDN
Zeabur 自動為靜態資源啟用 CDN，無需額外設定。

### 設定 Cache
Next.js 已內建 ISR（Incremental Static Regeneration），Zeabur 完全支援。

### Prerendering
在 `next.config.ts` 中可以設定需要預渲染的路徑：

```typescript
export default {
  output: "standalone",
  // ...其他設定
}
```

---

## 💡 推薦使用方法 1（自動檢測）

除非你有特殊需求（例如需要安裝系統層級的套件），否則建議使用方法 1（自動檢測）：

- 更快的建置時間
- 更快的冷啟動
- Zeabur 針對 Next.js 優化
- 自動處理所有配置

如果遇到問題，隨時可以切換到 Docker 方式！
