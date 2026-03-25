import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
	process.env.BACKEND_URL || "https://2026-game.sitcon.party/api";

const HOP_BY_HOP = new Set([
	"connection",
	"keep-alive",
	"transfer-encoding",
	"te",
	"trailer",
	"upgrade",
	"host",
]);

async function proxy(req: NextRequest, path: string) {
	const url = `${BACKEND_URL}/${path}${req.nextUrl.search}`;

	// Forward request headers, skipping hop-by-hop
	const reqHeaders = new Headers();
	req.headers.forEach((value, key) => {
		if (!HOP_BY_HOP.has(key.toLowerCase())) {
			reqHeaders.set(key, value);
		}
	});

	const upstream = await fetch(url, {
		method: req.method,
		headers: reqHeaders,
		body: req.body,
		// @ts-expect-error duplex required for streaming request body
		duplex: "half",
	});

	// Build response headers, ensuring Set-Cookie is forwarded
	const resHeaders = new Headers();
	upstream.headers.forEach((value, key) => {
		if (!HOP_BY_HOP.has(key.toLowerCase())) {
			resHeaders.append(key, value);
		}
	});

	// Explicitly forward Set-Cookie (may be omitted by Headers iteration)
	for (const cookie of upstream.headers.getSetCookie()) {
		resHeaders.append("Set-Cookie", cookie);
	}

	return new NextResponse(upstream.body, {
		status: upstream.status,
		headers: resHeaders,
	});
}

async function handler(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	return proxy(req, path.join("/"));
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
