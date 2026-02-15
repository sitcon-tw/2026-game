import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker deployment
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://2026-game.sitcon.party/api/:path*",
      },
    ];
  },
};

export default nextConfig;
