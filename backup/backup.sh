#!/bin/sh
# ==========================================================
# LaundryFlow — Database Backup Script
#
# Membuat dump MySQL terkompresi (.sql.gz) ke /backups, lalu menghapus
# backup lama sesuai kebijakan retensi.
#
# Dijalankan oleh container 'backup' via cron (lihat backup/Dockerfile).
# ==========================================================
set -e

# --- Konfigurasi (dari environment container) ---
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_DATABASE:-laundryflow}"
DB_USER="${DB_USERNAME:-laundryflow}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Kompresi: gzip (default) atau "none" untuk file .sql mentah.
COMPRESS="${BACKUP_COMPRESS:-gzip}"

# Timestamp untuk nama file: laundryflow_2026-06-26_013000.sql.gz
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
FILE_BASE="laundryflow_${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Mulai backup database '${DB_NAME}'..."

# --- Dump ---
# --single-transaction: konsisten tanpa lock (InnoDB) — aman saat app berjalan.
# --routines --triggers: sertakan stored procedure & trigger.
DUMP_OPTS="-h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} --single-transaction --routines --triggers"
export MYSQL_PWD="$DB_PASSWORD"  # hindari password muncul di process list

if [ "$COMPRESS" = "gzip" ]; then
    OUT_FILE="${BACKUP_DIR}/${FILE_BASE}.sql.gz"
    mysqldump $DUMP_OPTS "$DB_NAME" | gzip -9 > "$OUT_FILE"
else
    OUT_FILE="${BACKUP_DIR}/${FILE_BASE}.sql"
    mysqldump $DUMP_OPTS "$DB_NAME" > "$OUT_FILE"
fi

SIZE=$(du -h "$OUT_FILE" | cut -f1)
echo "[$(date)] Backup selesai: ${OUT_FILE} (${SIZE})"

# --- Rotasi: hapus backup lebih tua dari RETENTION_DAYS ---
echo "[$(date)] Rotasi: menghapus backup > ${RETENTION_DAYS} hari..."
find "$BACKUP_DIR" -name "laundryflow_*.sql*" -type f -mtime +${RETENTION_DAYS} -delete

# Ringkas daftar backup tersisa (untuk log).
REMAINING=$(find "$BACKUP_DIR" -name "laundryflow_*.sql*" -type f | wc -l | tr -d ' ')
echo "[$(date)] Total backup tersisa: ${REMAINING} file."
