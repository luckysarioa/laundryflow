import type { NextConfig } from "next";

// URL backend untuk proxy /api/* (server-side, runtime).
// - Dev lokal  : http://localhost:8000 (php artisan serve)
// - Docker     : http://backend:80 (service name di jaringan Docker)
// Dibaca saat Next.js server start → bisa di-override via env tanpa rebuild.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Mode standalone: menghasilkan build self-contained (semua dependency
  // node_modules terkunci disertakan) → image Docker jauh lebih kecil.
  output: "standalone",
  // Proxy /api/* ke backend. Browser cukup memanggil /api/* di origin frontend
  // (same-origin) → tidak ada CORS, tidak butuh domain backend publik. Frontend
  // dibangun dengan NEXT_PUBLIC_API_URL=/api (relatif), lalu Next.js mem-proxy
  // request ke BACKEND_URL (internal Docker) saat runtime.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
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
