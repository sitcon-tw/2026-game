# Fix: iOS QR Scanner 顯示問題

## 問題描述

`QrScanner.tsx` 在 iOS 上有兩個已知問題：

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

### 修復 4：Scanner 載入失敗時的 fallback

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
| `frontend/components/QrScanner.tsx` | 套用上述 4 個修復 |

`scan/page.tsx` 與 `booth/page.tsx` 不需修改，它們只是 `QrScanner` 的使用者。

---

## 測試驗證

- [ ] iOS Safari — 首次授權：授權後 Scanner 應立即顯示
- [ ] iOS Safari — 重新進入頁面：Scanner 正常顯示
- [ ] iPhone 多鏡頭（Pro/Pro Max）— Scanner 正常顯示且可切換鏡頭
- [ ] Android Chrome — 行為不變，Scanner 正常運作
- [ ] 切換鏡頭按鈕 — 只在有 2+ 可用鏡頭時顯示
- [ ] 掃描功能 — QR Code 掃描正常觸發 onScan callback
