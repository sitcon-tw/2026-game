import { sanitizeUser } from "@/lib/sanitize";
import { serverGet } from "@/lib/server-api";
import type { RankResponse, User } from "@/types/api";
import LevelsPageClient from "./page-client";

export default async function LevelsPage() {
	const [rawUser, leaderboard] = await Promise.all([
		serverGet<User>("/users/me", "token"),
		serverGet<RankResponse>("/games/leaderboards?page=1", "token")
	]);

	const user = rawUser ? sanitizeUser(rawUser) : null;

	return <LevelsPageClient user={user} leaderboard={leaderboard} />;
}
