import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.experiments = { asyncWebAssembly: true, layers: true };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)", // apply globally
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
