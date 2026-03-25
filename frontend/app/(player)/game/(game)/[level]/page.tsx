import { sanitizeUser } from "@/lib/sanitize";
import { serverGet } from "@/lib/server-api";
import { encodeSheet } from "@/lib/sheet-codec";
import type { LevelInfoResponse, User } from "@/types/api";
import ChallengesPageClient from "./page-client";

export default async function ChallengesPage({ params }: { params: Promise<{ level: string }> }) {
	const { level } = await params;
	const currentLevel = Number(level) || 1;

	const [rawUser, levelInfo] = await Promise.all([
		serverGet<User>("/users/me", "token"),
		serverGet<LevelInfoResponse>(`/games/levels/${currentLevel}`, "token")
	]);

	// Random seed per render — encoded sheet changes every page load
	const sheetSeed = Math.floor(Math.random() * 0xffffffff);
	const encodedSheet = levelInfo?.sheet ? encodeSheet(levelInfo.sheet, sheetSeed) : null;

	const sanitizedLevelInfo = levelInfo
		? { level: levelInfo.level, notes: levelInfo.notes, speed: levelInfo.speed }
		: null;

	return (
		<ChallengesPageClient
			user={rawUser ? sanitizeUser(rawUser) : null}
			levelMeta={sanitizedLevelInfo}
			encodedSheet={encodedSheet}
			sheetSeed={sheetSeed}
			currentLevel={currentLevel}
		/>
	);
}
