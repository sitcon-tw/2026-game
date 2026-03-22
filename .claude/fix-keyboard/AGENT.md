# Issue #61 — 修鍵盤音色 & 按鈕數量

## 目標

1. **音色修正（優先）**：每顆按鈕固定對應一個音符，不會有多音符撞同按鈕的問題
2. **按鈕數量**：只顯示該關卡 unique notes 數量的按鈕，不多不少
3. **按鈕隨機排列**：每次進入關卡，按鈕位置隨機分配

## 現狀問題

**檔案**：`frontend/app/(player)/game/(game)/[level]/page.tsx`

- `mapNoteToButtonIndex()` 用 hash % buttonCount → 不同音符可能 hash 到同一顆按鈕
- `buttonNoteMap` 只存第一個映射到的音符 → 該按鈕永遠只播一個音色
- `buttonCount` 用關卡等級公式算，跟實際音符數無關 → 大量按鈕沒用到

---

## 實作計畫

### Step 1：音色修正 — 1 note = 1 button

**改 `page.tsx` L111-129**

- `buttonCount = new Set(sheet).size`（unique notes 數量）
- 取 `uniqueNotes = [...new Set(sheet)]`（保持首次出現順序）
- 用 `Math.random()` shuffle uniqueNotes 產生隨機排列（每次進關卡都不同）
- 建立 `noteToButton: Map<string, number>` — shuffle 後 index 就是 button index
- 建立 `buttonToNote: Map<number, string>` — 反向映射
- `sheetButtons = sheet.map(n => noteToButton.get(n)!)`
- 移除舊的 `mapNoteToButtonIndex()` 和 `buttonNoteMap`

**效果**：每顆按鈕 = 唯一一個音符 = 固定音色，位置每次進關卡隨機。

### Step 2：調整 Grid 排版

**改 `deriveGrid()`**

按鈕數量大幅減少（通常 2~6 顆），調整排版：
- 2 顆：2×1（水平並排）
- 3 顆：3×1
- 4 顆：2×2
- 5-6 顆：3×2
- 7-8 顆：4×2

### Step 3：顏色分配簡化

**改 `BlockGrid` L57**

按鈕少，每顆直接給不同顏色 `i % BUTTON_COLORS.length`，移除 row-based 邏輯。

### Step 4：用 useMemo + useRef 穩定 shuffle

- shuffle 結果用 `useRef` 或 `useMemo` 保持穩定，避免 re-render 導致按鈕重新排列
- 只在 `currentLevel` 或 `sheet` 內容變化時重新 shuffle

---

## 不需要改的部分

- `audio.ts`（playNote 本身沒問題，問題在映射）
- Backend API（sheet 內容不變）
- 提交判定邏輯（仍比對 sheetButtons 順序）
