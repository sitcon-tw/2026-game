---
title: 登入與導向
description: 管理員如何透過 token 進入後台並被導向可操作頁面。
---

<img src="/docs/attendee/opass.png" alt="OPass" style="width: 50%;" />

## 對應頁面

- `/admin?token=...`

## 功能目的

管理員入口一樣是 token-based，不是帳密登入頁。前端讀到 token 後會建立管理員登入狀態，並把使用者導向真正的功能頁。

## 實際流程

- 從 URL 讀 token
- 驗證成功後導向 `/admin/gift-coupons`
- 後續透過 admin layout 在不同功能頁之間切換

## 文件重點

- 目前前端管理員功能只聚焦在折價券管理
- 沒有看到更多後台模組，例如活動管理或關卡設定
