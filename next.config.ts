import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  webpack(config) {
    config.experiments = { asyncWebAssembly: true, layers: true };
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ✅ Only enforce in production
          ...(isProd
            ? [
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
              ]
            : []),

          // Allow inline PDFs and images inside iframe
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' *" },
        ],
      },
      {
        source: "/tesseract/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/wasm" },
        ],
      },
      {
        source: "/pdfjs/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },
};

export default nextConfig;
