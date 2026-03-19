# Fix: QR Scanner 顯示問題（Safari / iOS）

## 問題描述

`QrScanner.tsx` 在 Safari（macOS + iOS）上有三個已知問題：

### 問題 1：授權後 Scanner 不顯示

**現象：** 使用者授予相機權限後，如果畫面上已經掛載了 Scanner，該 section 會消失（空白）。離開再回來（重新掛載）則正常顯示。

**影響頁面：**
- `(player)/scan/page.tsx` — 玩家掃描頁
- `(internal)/booth/page.tsx` — 攤位掃描頁

**根因分析：**

`QrScanner.tsx` 在 `useEffect([], ...)` 中呼叫 `enumerateDevices()`。在 iOS Safari 上：

1. 首次載入時，瀏覽器尚未取得相機權限
2. `enumerateDevices()` 在未授權時回傳的 `MediaDeviceInfo` 可能有空的 `deviceId`（iOS Safari 隱私保護）
3. 元件拿到空的 `deviceId`，設為 `selectedDeviceId`
4. `Scanner` 收到 `constraints: { deviceId: { exact: "" } }` → 無法開啟任何相機 → 畫面空白
5. `useEffect` 只在 mount 時跑一次（`[]` dependency），權限授予後不會重新列舉裝置

**關鍵程式碼（第 28-41 行）：**

```typescript
useEffect(() => {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
      }
    })
    .catch(console.error);
}, []);
```

### 問題 2：超過兩顆鏡頭的 iPhone 不顯示

**現象：** iPhone 有 3 顆以上鏡頭（超廣角、廣角、望遠）時，Scanner 直接不顯示。

**根因分析：**

1. 程式碼預設選取 `videoDevices[videoDevices.length - 1]`（最後一個裝置）
2. iOS 列舉的多顆鏡頭中，某些（如望遠鏡頭）可能不支援 Web API 的即時串流，或解析度/幀率不符合 `@yudiel/react-qr-scanner` 的需求
3. 使用 `{ exact: selectedDeviceId }` constraint 會強制指定特定裝置，如果該裝置無法開啟，整個 `getUserMedia` 會失敗，不會 fallback
4. `flipCamera()` 在只有 2 顆鏡頭的假設下運作正常，但 3+ 顆鏡頭時可能輪到不支援的裝置

### 問題 3：Safari 上 Scanner 相機啟動但 video 不顯示（macOS + iOS 皆受影響）

**現象：** 切換到掃描器頁面後，相機權限指示器亮起（stream 已取得），但掃描框完全看不到畫面。回到名片頁後相機如預期停止。Safari Console 沒有任何錯誤。

**影響頁面：**
- `(player)/scan/page.tsx` — 玩家掃描頁（確認受影響）
- 其他使用 `QrScanner` 的頁面（booth、cashier、compass）因為沒有用 framer-motion 的 opacity 動畫包裹，狀況不同

**根因分析：**

透過 Safari DevTools 檢查 `<video>` 元素：

```js
const v = document.querySelector('video');
console.log(v?.offsetWidth, v?.offsetHeight, v?.srcObject, v?.paused, v?.readyState);
// → 0, 0, MediaStream, ...
```

**video 元素的 `offsetWidth` / `offsetHeight` 為 0**，雖然 `srcObject` 有 MediaStream（相機確實啟動），但因為尺寸為 0 所以不渲染。

尺寸坍縮的原因是 CSS 百分比解析問題：

1. `scan/page.tsx` 的結構：flex column (`flex-col items-center`) → `<div class="mt-8">` → `<QrScanner>`
2. `QrScanner` 外層 div 用 `w-full max-w-[300px] aspect-square`（百分比寬度 + aspect-ratio）
3. Scanner library 內部 container 用 `width: 100%; height: 100%; aspect-ratio: 1/1`
4. Video 元素用 `width: 100%; height: 100%`
5. 在 Safari 的 flex column + `align-items: center` 佈局中，`w-full`（`width: 100%`）的父層 `<div class="mt-8">` 沒有明確寬度
6. Safari 解析百分比寬度時，父層 auto → 子層 100% of auto → **坍縮為 0**
7. Chrome 則會先把 flex item 撐開到容器寬度再算百分比，所以 Chrome 正常

**關鍵差異：** 其他頁面（booth、cashier）的 `QrScanner` 直接放在有明確寬度的容器中，不經過 `items-center` 的 flex 佈局，所以不受影響。

**驗證方式：**

```js
// Safari DevTools Console — 在掃描頁執行
const v = document.querySelector('video');
console.log(v?.offsetWidth, v?.offsetHeight, v?.srcObject, v?.paused, v?.readyState);
// 修復前：0, 0, MediaStream, ...
// 修復後：300, 300, MediaStream, ...
```

---

## 修復方案

### 修復 1：權限變更後重新列舉裝置

監聽 `devicechange` 事件，當權限授予後裝置列表更新時重新列舉：

```typescript
useEffect(() => {
  if (!navigator.mediaDevices?.enumerateDevices) return;

  const enumerate = () => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(
          (d) => d.kind === "videoinput" && d.deviceId !== "",
        );
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          // 優先選後置鏡頭（label 含 back/rear/environment）
          const backCam = videoDevices.find((d) =>
            /back|rear|environment/i.test(d.label),
          );
          setSelectedDeviceId(
            (backCam ?? videoDevices[0]).deviceId,
          );
        }
      })
      .catch(console.error);
  };

  enumerate();
  navigator.mediaDevices.addEventListener("devicechange", enumerate);
  return () =>
    navigator.mediaDevices.removeEventListener("devicechange", enumerate);
}, []);
```

### 修復 2：改用 `facingMode` 作為主要 constraint，而非 `exact` deviceId

對於 iOS 多鏡頭問題，不要用 `{ exact: deviceId }` 強制指定，改用 `facingMode` 搭配 `ideal`：

```typescript
constraints={{
  ...(selectedDeviceId
    ? { deviceId: { ideal: selectedDeviceId } }  // ideal 而非 exact，允許 fallback
    : { facingMode: { ideal: "environment" } }),  // 預設後置
}}
```

`ideal` 與 `exact` 的差異：
- `exact` — 不符合就失敗，不開啟任何相機
- `ideal` — 盡量符合，不符合時自動選最接近的替代裝置

### 修復 3：過濾不可用的裝置

列舉時過濾掉 `deviceId` 為空的裝置（未授權時的佔位裝置）：

```typescript
const videoDevices = devices.filter(
  (d) => d.kind === "videoinput" && d.deviceId !== "",
);
```

### 修復 4：改用固定尺寸避免 Safari 百分比坍縮

Safari 在 flex column + `items-center` 中無法正確解析百分比寬度鏈，改用固定 pixel 尺寸：

**QrScanner.tsx 外層容器：**

```typescript
// 修復前（百分比 → Safari 坍縮為 0）
<div className="relative w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-[#6b6b6b]">

// 修復後（固定尺寸 → 所有瀏覽器一致）
<div className="relative h-[300px] w-[300px] rounded-lg overflow-hidden bg-[#6b6b6b]">
```

**Scanner styles：**

```typescript
// 修復前
styles={{ container: { width: "100%", height: "100%" }, video: { objectFit: "cover" } }}

// 修復後
styles={{ container: { width: "300px", height: "300px" }, video: { objectFit: "cover" } }}
```

**scan/page.tsx 動畫：**

移除包裹 Scanner 的 framer-motion opacity 動畫（Safari video compositing 在 `opacity: 0` 容器中可能不正確繪製）：

```typescript
// 修復前
<motion.div className="mt-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
  <QrScanner ... />
</motion.div>

// 修復後
<div className="mt-8">
  <QrScanner ... />
</div>
```

外層 motion.div 也移除 opacity，只保留 x 位移動畫：

```typescript
// 修復前
initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}

// 修復後
initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }}
```

> **待確認：** 固定 300px 在小螢幕裝置上可能過寬。確認修復有效後，可改用 `min(300px, 100%)` 或 CSS container query 讓小螢幕自適應。

### 修復 5：Scanner 載入失敗時的 fallback

在 `onError` 中嘗試 fallback 到無指定裝置（讓瀏覽器自選）：

```typescript
const [cameraError, setCameraError] = useState(false);

// 在 Scanner 的 onError 中：
onError={(error) => {
  console.error("Scanner error:", error);
  if (selectedDeviceId && !cameraError) {
    setCameraError(true);
    setSelectedDeviceId(undefined); // 清除指定裝置，讓瀏覽器自選
  }
}}
```

---

## 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/components/QrScanner.tsx` | 修復 1–4：devicechange 監聽、ideal constraint、過濾空 deviceId、固定尺寸 |
| `frontend/app/(player)/scan/page.tsx` | 修復 4：移除包裹 Scanner 的 opacity 動畫 |

`booth/page.tsx`、`cashier/page.tsx`、`compass/page.tsx` 不需修改，它們的 `QrScanner` 不在 `items-center` flex 佈局中，不受百分比坍縮影響。

---

## 測試驗證

- [ ] **macOS Safari** — Scanner video 可見（`offsetWidth`/`offsetHeight` 為 300）
- [ ] **iOS Safari** — 首次授權：授權後 Scanner 應立即顯示
- [ ] **iOS Safari** — 重新進入頁面：Scanner 正常顯示
- [ ] **iPhone 多鏡頭**（Pro/Pro Max）— Scanner 正常顯示且可切換鏡頭
- [ ] **Android Chrome** — 行為不變，Scanner 正常運作
- [ ] 切換鏡頭按鈕 — 只在有 2+ 可用鏡頭時顯示
- [ ] 掃描功能 — QR Code 掃描正常觸發 onScan callback
- [ ] 小螢幕裝置（寬度 < 300px）— 確認 Scanner 不會超出螢幕
