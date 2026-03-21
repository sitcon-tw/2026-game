---
title: 登入與進入遊戲
description: 會眾從登入到進入主要玩家流程的方式。
---

會眾可以從 OPass APP -> SITCON 2026 找到大地遊戲的登入入口，系統會自動帶入票券 Token 並完成登入。

<img src="/docs/attendee/opass.png" alt="opass 登入介面" width="50%" />

如果登入失效的話，下方可以展開手動貼上票券 Token。頁面也會顯示提示文字：「請重新從 OPass 登入，操作路徑為 OPass APP > SITCON 2026 > 大地遊戲」，或尋找現場工作人員協助。

<img src="/docs/attendee/login_fail.png" alt="登入失敗" width="50%" />

登入完成後，系統會跳轉到遊戲首頁。首頁是一個有動畫效果的入場畫面，點擊畫面任意處後播放動畫，並自動進入遊戲關卡列表。

<img src="/docs/attendee/game_start.png" alt="進入遊戲" width="50%" />

## 對應頁面

- `/login`
- `/`

## 功能目的

這個功能負責讓玩家拿到登入狀態，並從首頁進入正式遊戲流程。前端支援兩種情境：一種是從外部帶 token 進站，另一種是沒有自動帶入 token 時手動輸入。

## `/login` 的實際行為

- 頁面會優先嘗試從 URL 取得 OPass token
- 如果 token 正常，玩家會被登入並跳轉到首頁 `/`
- 如果 token 無效或登入失敗，頁面會顯示錯誤狀態（`登入失敗`）並顯示目前帶入的 token 供除錯
- 如果沒有 token，前端顯示操作說明與手動輸入 token 的入口

## `/` 的實際行為

- 這是玩家看到的首頁，帶有公告跑馬燈與動畫入場畫面
- 跑馬燈會顯示目前的公告訊息（從 `/api/announcements` 取得）
- 點擊畫面任意處觸發動畫序列：專輯封面滑出、CD 旋轉並放大，約 1.75 秒後自動跳轉 `/game`

## 文件上要注意的事

- 登入後的主要玩家區會由共用 layout 接手，不需要玩家每次重新認證
- 玩家後續常用功能會集中在 `/game`、`/play`、`/scan`、`/leaderboard`、`/coupon`
