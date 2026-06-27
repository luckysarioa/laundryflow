#!/bin/sh
# ==========================================================
# LaundryFlow Backend — Docker Entrypoint
# Persiapan sebelum Apache start: key, cache, migration.
# ==========================================================
set -e

echo "[LaundryFlow] Persiapan aplikasi Laravel..."

# 0) Pastikan struktur storage/framework ada & writable.
#    Ini WAJIB di runtime karena:
#    - Volume 'backend_storage' hanya mount storage/app/public
#    - Beberapa image/hapus container bisa menghapus folder framework
#    - Tanpa storage/framework/views → Blade compiler throw
#      "Please provide a valid cache path" → semua endpoint 500.
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
# Pastikan file log yang mungkin sudah ada (owned root dari shell exec) juga www-data writable.
touch storage/logs/laravel.log
chown www-data:www-data storage/logs/laravel.log 2>/dev/null || true
chmod 664 storage/logs/laravel.log 2>/dev/null || true

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

# 3b) Buat symlink public/storage → storage/app/public (idempoten di Laravel 11).
#      Tanpa ini, file yang di-upload (foto order) akan 404 saat diakses via /storage/*.
php artisan storage:link

# 4) Migration. Seeding data demo HANYA saat APP_ENV != production.
#    Data SISTEM (superadmin + master plan) WAJIB di-seed di SEMUA environment
#    — tanpa superadmin, login panel superadmin selalu gagal. Seeder idempoten
#    (firstOrCreate/updateOrCreate) sehingga aman dijalankan setiap start container.
echo "[LaundryFlow] Menjalankan migration..."
if [ "$APP_ENV" = "production" ] || [ -z "$APP_ENV" ]; then
    # Produksi: migrate + seed data SISTEM saja (superadmin + plan).
    # Data demo (user/service/order contoh) dilewati.
    php artisan migrate --force
    echo "[LaundryFlow] APP_ENV=${APP_ENV} → seeding data sistem (superadmin + plan)."
    php artisan db:seed --class=SystemDataSeeder --force
else
    # Dev/staging: migrate + seed lengkap (akun demo, data contoh).
    echo "[LaundryFlow] APP_ENV=${APP_ENV} → menjalankan seeder lengkap."
    php artisan migrate --force --seed
fi

echo "[LaundryFlow] Memulai Apache..."
exec "$@"
