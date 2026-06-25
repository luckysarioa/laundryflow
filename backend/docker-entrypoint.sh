#!/bin/sh
# ==========================================================
# LaundryFlow Backend — Docker Entrypoint
# Persiapan sebelum Apache start: key, cache, migration.
# ==========================================================
set -e

echo "[LaundryFlow] Persiapan aplikasi Laravel..."

# 1) Pastikan .env ada. Coolify meng-inject env langsung ke container, tapi
#    Laravel membaca file .env minimal (Dotenv TIDAK menimpa env container,
#    jadi nilai dari Coolify tetap dipakai). Bila .env tidak ada, salin contoh.
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[LaundryFlow] .env dibuat dari .env.example"
    fi
fi

# 2) Generate APP_KEY bila kosong (fallback).
#    PRODUKSI: lebih baik set APP_KEY eksplisit via Coolify env agar persisten
#    (jika tidak, tiap recreate container membuat key baru → semua session/token invalid).
if [ -z "$APP_KEY" ]; then
    echo "[LaundryFlow] PERINGATAN: APP_KEY kosong, generating (TIDAK persisten antar redeploy!)."
    php artisan key:generate --force
fi

# 3) Cache config & route untuk performance.
#    ERROR TIDAK disembunyikan — bila config rusak, harus muncul di log (bukan silent fail).
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3b) Buat symlink public/storage → storage/app/public (idempoten di Laravel 11).
#      Tanpa ini, file yang di-upload (foto order) akan 404 saat diakses via /storage/*.
php artisan storage:link

# 4) Migration. Seeding HANYA saat APP_ENV != production (data demo).
#    Produksi: tabel kosong, isi via UI. Mencegah duplikat data saat redeploy.
echo "[LaundryFlow] Menjalankan migration..."
if [ "$APP_ENV" = "production" ] || [ -z "$APP_ENV" ]; then
    # Produksi: migrate tanpa seed.
    php artisan migrate --force
else
    # Dev/staging: migrate + seed (akun demo, data contoh).
    echo "[LaundryFlow] APP_ENV=${APP_ENV} → menjalankan seeder."
    php artisan migrate --force --seed
fi

echo "[LaundryFlow] Memulai Apache..."
exec "$@"
