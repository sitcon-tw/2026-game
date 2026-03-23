"use server";

import { serverPost, type ServerResponse } from "@/lib/server-api";
import type { SubmitResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

export async function submitLevel(): Promise<ServerResponse<SubmitResponse>> {
	const result = await serverPost<SubmitResponse>("/games/submissions", undefined, {
		cookieName: "token"
	});
	if (result.data) {
		revalidatePath("/game");
		revalidatePath("/leaderboard");
	}
	return result;
}
