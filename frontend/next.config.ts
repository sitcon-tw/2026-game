import type { NextConfig } from "next";

const apiProxyTarget = process.env.NEXT_PUBLIC_API_PROXY_TARGET || "https://2026-game.sitcon.party/api";

const nextConfig: NextConfig = {
	output: "standalone", // Required for Docker deployment
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiProxyTarget}/:path*`
			}
		];
	}
};

export default nextConfig;
