import "server-only";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "https://2026-game.sitcon.party/api";

export async function serverGet<T>(path: string, cookieName?: string): Promise<T | null> {
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (cookieName) {
		const cookieStore = await cookies();
		const token = cookieStore.get(cookieName)?.value;
		if (token) headers["Cookie"] = `${cookieName}=${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}${path}`, { headers, cache: "no-store" });
		if (!res.ok) return null;
		const text = await res.text();
		return text ? (JSON.parse(text) as T) : null;
	} catch {
		return null;
	}
}

export interface ServerResponse<T> {
	data: T | null;
	error: string | null;
	status: number;
}

export async function serverPost<T>(
	path: string,
	body?: unknown,
	options?: {
		cookieName?: string;
		bearerToken?: string;
	}
): Promise<ServerResponse<T>> {
	const cookieStore = await cookies();
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (options?.bearerToken) {
		headers["Authorization"] = `Bearer ${options.bearerToken}`;
	}
	if (options?.cookieName) {
		const token = cookieStore.get(options.cookieName)?.value;
		if (token) headers["Cookie"] = `${options.cookieName}=${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}${path}`, {
			method: "POST",
			headers,
			body: body ? JSON.stringify(body) : undefined
		});
		const text = await res.text();
		const data = text ? (JSON.parse(text) as T) : null;
		if (!res.ok) {
			const errorMsg = (data as Record<string, unknown>)?.message as string | undefined;
			return { data: null, error: errorMsg || `API error ${res.status}`, status: res.status };
		}
		return { data, error: null, status: res.status };
	} catch (e) {
		return { data: null, error: e instanceof Error ? e.message : "Unknown error", status: 0 };
	}
}

export async function serverPatch<T>(
	path: string,
	body?: unknown,
	options?: { cookieName?: string }
): Promise<ServerResponse<T>> {
	const cookieStore = await cookies();
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (options?.cookieName) {
		const token = cookieStore.get(options.cookieName)?.value;
		if (token) headers["Cookie"] = `${options.cookieName}=${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}${path}`, {
			method: "PATCH",
			headers,
			body: body ? JSON.stringify(body) : undefined
		});
		const text = await res.text();
		const data = text ? (JSON.parse(text) as T) : null;
		if (!res.ok) {
			const errorMsg = (data as Record<string, unknown>)?.message as string | undefined;
			return { data: null, error: errorMsg || `API error ${res.status}`, status: res.status };
		}
		return { data, error: null, status: res.status };
	} catch (e) {
		return { data: null, error: e instanceof Error ? e.message : "Unknown error", status: 0 };
	}
}

export async function serverDelete<T>(
	path: string,
	options?: { cookieName?: string }
): Promise<ServerResponse<T>> {
	const cookieStore = await cookies();
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (options?.cookieName) {
		const token = cookieStore.get(options.cookieName)?.value;
		if (token) headers["Cookie"] = `${options.cookieName}=${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}${path}`, {
			method: "DELETE",
			headers
		});
		const text = await res.text();
		const data = text ? (JSON.parse(text) as T) : null;
		if (!res.ok) {
			const errorMsg = (data as Record<string, unknown>)?.message as string | undefined;
			return { data: null, error: errorMsg || `API error ${res.status}`, status: res.status };
		}
		return { data, error: null, status: res.status };
	} catch (e) {
		return { data: null, error: e instanceof Error ? e.message : "Unknown error", status: 0 };
	}
}
