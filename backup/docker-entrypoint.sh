#!/bin/sh
# ==========================================================
# LaundryFlow Backup — Container Entrypoint
#
# Membuat crontab dari BACKUP_SCHEDULE, menulis env ke file (cron tidak
# mewarisi environment container), lalu menjalankan cron daemon.
# ==========================================================
set -e

SCHEDULE="${BACKUP_SCHEDULE:-0 1 * * *}"   # default: tiap hari jam 01:00
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
COMPRESS="${BACKUP_COMPRESS:-gzip}"

echo "[backup] Konfigurasi:"
echo "  Jadwal cron : ${SCHEDULE}"
echo "  Retensi     : ${RETENTION} hari"
echo "  Kompresi    : ${COMPRESS}"
echo "  Tujuan      : ${BACKUP_DIR}"

mkdir -p "$BACKUP_DIR"

# Cron tidak mewarisi env container → tulis env ke file lalu source di job.
ENV_FILE="/app/.env.cron"
cat > "$ENV_FILE" <<EOF
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-laundryflow}
DB_USERNAME=${DB_USERNAME:-laundryflow}
DB_PASSWORD=${DB_PASSWORD}
BACKUP_DIR=${BACKUP_DIR}
BACKUP_RETENTION_DAYS=${RETENTION}
BACKUP_COMPRESS=${COMPRESS}
EOF
chmod 600 "$ENV_FILE"

# Tulis crontab: source env, lalu jalankan backup.sh, log ke stdout container.
CRON_LINE="${SCHEDULE} . ${ENV_FILE} && /app/backup.sh >> /proc/1/fd/1 2>&1"
echo "$CRON_LINE" | crontab -

# Backup sekali saat start pertama (opsional, agar ada backup langsung)
# Hapus baris bawah bila tidak ingin backup saat bootstrap.
if [ "${BACKUP_ON_START:-true}" = "true" ]; then
    echo "[backup] Menjalankan backup awal..."
    /app/backup.sh || true
fi

echo "[backup] Cron daemon aktif. Menunggu jadwal berikutnya..."

# crond Alpine: -f (foreground) -l 8 (log level info) -d 8 (log ke stdout).
exec crond -f -l 8
