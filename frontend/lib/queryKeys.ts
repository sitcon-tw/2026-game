export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
    session: ["user", "session"] as const,
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
} as const;
