import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Mode standalone: menghasilkan build self-contained (semua dependency
  // node_modules terkunci disertakan) → image Docker jauh lebih kecil.
  output: "standalone",
  // Headers untuk PWA: izinkan register service worker di root path.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
