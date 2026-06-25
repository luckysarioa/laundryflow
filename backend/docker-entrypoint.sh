#!/bin/sh
# ==========================================================
# LaundryFlow Backend — Docker Entrypoint
# Persiapan sebelum Apache start: key, cache, migration.
# ==========================================================
set -e

echo "[LaundryFlow] Persiapan aplikasi Laravel..."

# 1) Pastikan .env ada (Coolify meng-inject env langsung, tapi Laravel butuh
#    file .env minimal). Jika tidak ada, salin dari example.
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[LaundryFlow] .env dibuat dari .env.example"
    fi
fi

# 2) Generate APP_KEY bila kosong (idempoten).
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "[LaundryFlow] APP_KEY kosong, generating..."
    php artisan key:generate --force
fi

# 3) Optimasi cache config & route untuk production.
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# 4) Jalankan migration (membuat tabel bila belum ada).
#    --force: skip konfirmasi prompt di environment non-interactive.
#    --try-again: bila migration bermasalah, lanjut start server agar bisa debug.
echo "[LaundryFlow] Menjalankan migration..."
php artisan migrate --force --seed || {
    echo "[LaundryFlow] PERINGATAN: migration gagal, tetap melanjutkan start server."
}

echo "[LaundryFlow] Memulai Apache..."
exec "$@"
