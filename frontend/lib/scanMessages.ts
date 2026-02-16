/**
 * API response message → 使用者友善中文訊息 mapping table
 *
 * 用於掃描 QR code 後，將後端回傳的英文 error/status message
 * 轉換成適合直接呈現在 UI 上的中文訊息。
 *
 * 兩個 scanner 共用：(player) scan、(booth) booth
 */

// ── Shared types ──

export type ScanStatus =
    | { type: "idle" }
    | { type: "scanning" }
    | { type: "success"; message: string }
    | { type: "error"; message: string };

/** 已確認的「成功」status 值 — 只有這些才顯示綠色 */
const SUCCESS_STATUSES = new Set(["ok", "check-in success"]);

export function isSuccessStatus(status: string | undefined | null): boolean {
    return !!status && SUCCESS_STATUSES.has(status.toLowerCase());
}

// ── Message tables ──

/** ── 好友相關 (POST /friendships) ── */
const friendshipMessages: Record<string, string> = {
    // 成功
    "friendship created": "成功認識新朋友！",

    // 錯誤
    "already friends": "已經加過好友囉！",
    "cannot add yourself": "不能加自己為好友喔！",
    "missing or invalid qr code": "無效的 QR Code，請重新掃描",
    "friend limit reached": "你太 E 了！！ 好友數量已達上限，先去逛攤位吧！",
    "user not found": "找不到這位使用者",
};

/** ── 活動打卡相關 (POST /activities/check-ins) ── */
const activityCheckinMessages: Record<string, string> = {
    // 成功
    "check-in success": "打卡成功！",
    "ok": "打卡成功！",

    // 錯誤
    "already visited": "你已經打卡過囉！",
    "already checked in": "你已經打卡過囉！",
    "bad request": "無效的 QR Code，請重新掃描",
    "activity not found": "找不到此活動",
    "invalid activity qr code": "無效的活動 QR Code",
};

/** ── 攤位掃描使用者打卡 (POST /activities/booth/user/check-ins) ── */
const boothCheckinMessages: Record<string, string> = {
    // 成功
    "check-in success": "打卡成功！",
    "ok": "打卡成功！",

    // 錯誤
    "already visited": "這位會眾已經來過惹！",
    "already checked in": "這位會眾已經打卡過囉！",
    "bad request": "無效的 QR Code，請重新掃描",
    "unauthorized booth": "攤位尚未登入，請重新開啟連結",
    "user not found": "找不到此使用者",
    "invalid user qr code": "無效的使用者 QR Code",
};

/** ── 攤位登入 (POST /activities/booth/session) ── */
const boothLoginMessages: Record<string, string> = {
    "missing token": "缺少攤位 Token",
    "unauthorized booth": "攤位驗證失敗，請確認連結是否正確",
};

/** ── 工作人員登入 (POST /discount-coupons/staff/session) ── */
const staffLoginMessages: Record<string, string> = {
    "missing token": "缺少工作人員 Token",
    "unauthorized staff": "工作人員驗證失敗，請確認連結是否正確",
};

/** ── 工作人員核銷 (POST /discount-coupons/staff/redemptions) ── */
const staffRedeemMessages: Record<string, string> = {
    "missing token": "缺少折價券 Token",
    "invalid coupon": "無效的折價券",
    "unauthorized staff": "工作人員尚未登入，請重新開啟連結",
};

/** ── 使用者登入 (POST /users/session) ── */
const userSessionMessages: Record<string, string> = {
    "Missing token": "缺少登入 Token",
    "Unauthorized": "登入驗證失敗",
};

/** ── 遊戲提交 (POST /games/submissions) ── */
const gameSubmitMessages: Record<string, string> = {
    "current level cannot exceed unlock level": "目前等級已達解鎖上限，先去解鎖更多關卡吧！",
};

/** ── 通用錯誤 ── */
const commonMessages: Record<string, string> = {
    "unauthorized": "請先登入",
    "Unauthorized": "請先登入",
    "Internal Server Error": "伺服器錯誤，請稍後再試",
    "internal server error": "伺服器錯誤，請稍後再試",
};

// ── Context-aware translation ──

export type ScanContext =
    | "friendship"
    | "activity-checkin"
    | "booth-checkin"
    | "booth-login"
    | "game-submit"
    | "staff-login"
    | "staff-redeem";

const contextTables: Record<ScanContext, Record<string, string>> = {
    "friendship": friendshipMessages,
    "activity-checkin": activityCheckinMessages,
    "booth-checkin": boothCheckinMessages,
    "booth-login": boothLoginMessages,
    "game-submit": gameSubmitMessages,
    "staff-login": staffLoginMessages,
    "staff-redeem": staffRedeemMessages,
};

/**
 * 帶有情境的翻譯，同 key 在不同情境下可能有不同中文。
 * 只做 exact match（case-insensitive），不做模糊比對以避免誤判。
 *
 * @example
 * ```ts
 * translateWithContext("booth-checkin", "already visited")
 * // → "會眾已經來過惹！"
 *
 * translateWithContext("activity-checkin", "already checked in")
 * // → "你已經打卡過囉！"
 * ```
 */
export function translateWithContext(
    context: ScanContext,
    message: string | undefined | null,
    fallback = "操作失敗，請重試"
): string {
    if (!message) return fallback;

    const lower = message.toLowerCase();
    const table = contextTables[context];

    // 1. context-specific exact match
    if (table) {
        for (const [key, value] of Object.entries(table)) {
            if (key.toLowerCase() === lower) return value;
        }
    }

    // 2. common exact match
    for (const [key, value] of Object.entries(commonMessages)) {
        if (key.toLowerCase() === lower) return value;
    }

    return fallback;
}
