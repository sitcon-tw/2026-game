export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
    session: ["user", "session"] as const,
    oneTimeQr: ["user", "one-time-qr"] as const,
  },
  activities: {
    stats: ["activities", "stats"] as const,
    boothStats: ["activities", "booth", "stats"] as const,
  },
  games: {
    leaderboard: (page?: number) =>
      ["games", "leaderboard", page ?? 1] as const,
    levelInfo: (level: number | "current") =>
      ["games", "level", level] as const,
  },
  friendships: {
    list: ["friendships"] as const,
    count: ["friendships", "count"] as const,
  },
  coupons: {
    list: ["coupons"] as const,
    definitions: ["coupons", "definitions"] as const,
  },
  announcements: {
    list: ["announcements"] as const,
  },
  staff: {
    lookup: ["coupons", "staff", "lookup"] as const,
    history: ["coupons", "staff", "history"] as const,
  },
  admin: {
    giftCoupons: ["admin", "gift-coupons"] as const,
    users: (q: string) => ["admin", "users", q] as const,
  },
} as const;
