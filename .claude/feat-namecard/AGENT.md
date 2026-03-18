# feat: scan page 改為「名片優先」

## 背景

scan page 預設顯示掃描器，使用者無法快速出示名片。目標是名片優先、掃描器按鈕觸發。

## 核心策略：最小改動，複用現有元件

- `UserNamecardModal` 加一個 optional `qrToken` prop → 有傳就顯示 QR Code
- 同一個 modal 加 optional `onEdit` callback → 有傳則點擊內容區域時觸發（開啟 `UpdateMyNamecardModal`）
- scan page 用這兩個現有 modal 組合出「出示名片 + 編輯」的流程

## UserNamecardModal 改動

### 新增 Props

```ts
interface UserNamecardModalProps {
  open: boolean;
  onClose: () => void;
  user: { ... } | null;
  qrToken?: string;   // 新增：有值則在 profile row 右側顯示 QR Code
  onEdit?: () => void; // 新增：有值則點擊內容區域開啟編輯
}
```

### Layout 變更（當 `qrToken` 有值時）

Profile row 改為 grid 排版：
- 左：avatar + nickname + level（現有）
- 右：小 QR Code，點擊可放大

### 編輯提示（當 `onEdit` 有值時）

- 名片內容區域（bio / email / links）加上點擊事件 → 呼叫 `onEdit`
- 可在欄位旁加小鉛筆 icon 提示

## Scan Page 改動

### 新 Layout

1. **名片區塊**（預設顯示）
   - 用 `UserNamecardModal` 的內容（但不是 modal，是 inline 顯示），或直接開著 modal
   - 替代方案：直接在頁面 inline 呈現名片內容（不用 modal 包裝）

2. **Buttons**（namecard 下方，flex-wrap）
   - 「加好友」→ 切到掃描器
   - 「開啟掃描器」→ 切到掃描器

3. **Scanner 模式**（按鈕觸發）
   - 現有掃描功能 + 「回到我的名片」按鈕

### State

```ts
const [showScanner, setShowScanner] = useState(false);
const [showEditNamecard, setShowEditNamecard] = useState(false);
```

## 實作步驟

### Step 1: `UserNamecardModal` 加 `qrToken` + `onEdit` props

- 檔案：`frontend/components/namecard/UserNamecardModal.tsx`
- `qrToken`：profile row 改 grid，右側放 QR（小尺寸），點擊放大
- `onEdit`：內容區域可點擊，旁邊放鉛筆 icon

### Step 2: 重構 scan page

- 檔案：`frontend/app/(player)/scan/page.tsx`
- 預設顯示名片（inline 或 modal），掃描器改為按鈕觸發
- 點名片內容 → 開 `UpdateMyNamecardModal`
- 點「加好友」/「開啟掃描器」→ 切到 scanner 模式

### Step 3: 驗證 friends page 不受影響

- `UserNamecardModal` 新 props 都是 optional，不傳就跟現在一樣

## 已完成項目

### Motion 動畫（motion/react）

所有 modal / popup 統一使用相同的 spring 動畫參數：

```ts
// 彈出
initial={{ opacity: 0, scale: 0.8, y: 30 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
// 收起
exit={{ opacity: 0, scale: 0.7, y: 40 }}
// Spring 參數
transition={{ type: "spring", damping: 18, stiffness: 400, mass: 0.8 }}
// 按鈕按壓
whileTap={{ scale: 0.95 }}
```

- [x] `UserNamecardModal` — 彈出 + 收起 spring 動畫、按鈕 whileTap
- [x] `UpdateMyNamecardModal` — 彈出 + 收起 spring 動畫、所有按鈕 whileTap
- [x] QR Code 放大 popup（scan page）— 彈出 + 收起 spring 動畫
- [x] 修正 AnimatePresence 結構：外層 `<div>` 改為 `<motion.div>` 確保 exit 動畫正常觸發

### Scan Page 互動改進

- [x] Avatar 區域可點擊 → 開啟 `UpdateMyNamecardModal`（附鉛筆 icon 提示）
- [x] Bio / Email / 連結三個區塊拆成獨立 `motion.button`，各自有 staggered 進場動畫 + 獨立 whileTap 回饋

### 元件抽取

- [x] 將 scan page 的 inline 名片卡片抽成 `MyNamecardCard` 元件（`frontend/components/namecard/MyNamecardCard.tsx`）
  - Props: `nickname`, `avatar`, `currentLevel`, `bio`, `email`, `links`, `qrUrl`, `onEdit`, `onEnlargeQR`

### UX 改善

- [x] 所有可點擊元素加上 `cursor-pointer`（跨 4 個檔案）
  - `MyNamecardCard`：avatar、QR、bio/email/links rows
  - `UpdateMyNamecardModal`：backdrop、Gravatar 連結、刪除/新增連結、取消/儲存按鈕
  - `scan/page.tsx`：回到名片、加好友、開啟掃描器、QR modal backdrop/關閉
  - `friends/page.tsx`：好友項目、上/下一頁、掃描好友 QRCode、更新名牌

### 加好友後彈出對方名片

- [x] `useAddFriend` 回傳型別從 `string` 修正為 `FriendPublicProfile`
- [x] scan page `addFriend.onSuccess` 拿 response data 設定 `newFriend` state
- [x] scan page 加入 `UserNamecardModal` 顯示新好友名片，關閉時清除 state

## 目前狀態

已 commit：`79dc308` on `feat/namecard-first-scan`（關聯 issue #69）

## 涉及檔案

| 檔案 | 變更 |
|------|------|
| `frontend/components/namecard/MyNamecardCard.tsx` | **新增**：從 scan page 抽出的名片卡片元件 |
| `frontend/components/namecard/UserNamecardModal.tsx` | motion 動畫、AnimatePresence 修正、cursor-pointer |
| `frontend/components/namecard/UpdateMyNamecardModal.tsx` | motion 動畫、AnimatePresence 修正、cursor-pointer |
| `frontend/app/(player)/scan/page.tsx` | 重構為名片優先、使用 MyNamecardCard、QR popup spring、cursor-pointer |
| `frontend/app/(player)/play/(listed-page)/friends/page.tsx` | cursor-pointer |
