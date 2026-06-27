# ==========================================================
# LaundryFlow Frontend — Next.js (standalone) untuk Docker/Coolify
# Multi-stage build: deps → build → runner (image akhir ramping).
# ==========================================================

# --- Stage 1: install dependency ---
FROM node:20-alpine AS deps
WORKDIR /app

# Copy hanya manifest → manfaatkan cache layer Docker.
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: build ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ARG agar NEXT_PUBLIC_* bisa di-inject saat build (build-time variables).
# DEFAULT: mode mock aktif. Saat deploy full-stack, override via build args
# (lihat docker-compose.yml: args → NEXT_PUBLIC_USE_MOCK=false).
# NEXT_PUBLIC_API_URL default "/api" (relatif) → browser memanggil same-origin,
# lalu Next.js mem-proxy ke BACKEND_URL via rewrites() (lihat next.config.ts).
ARG NEXT_PUBLIC_USE_MOCK=true
ARG NEXT_PUBLIC_API_URL=/api
# BACKEND_URL: tujuan proxy /api/* (server-side, di dalam jaringan Docker).
# Dievaluasi saat build oleh rewrites() — bake nilai stabil: nama service backend.
ARG BACKEND_URL=http://backend:80
ENV NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV BACKEND_URL=${BACKEND_URL}

# Next.js telemetry nonaktif di CI/build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Stage 3: runner (image final) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Jalankan sebagai user non-root (keamanan).
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Salin output standalone (sudah memuat node_modules minimal yang dibutuhkan).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Aset statis (JS/CSS/font) & folder publik (manifest PWA, sw.js, icons).
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Server standalone Next.js.
CMD ["node", "server.js"]
