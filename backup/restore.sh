#!/bin/sh
# ==========================================================
# LaundryFlow — Database Restore Script
#
# Memulihkan database dari file backup (.sql atau .sql.gz).
#
# Penggunaan (di dalam container, atau via docker compose exec):
#   ./restore.sh                         → restore backup TERBARU
#   ./restore.sh /backups/file.sql.gz    → restore file spesifik
#
# Interaktif: akan konfirmasi sebelum menimpa database.
# ==========================================================
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_DATABASE:-laundryflow}"
DB_USER="${DB_USERNAME:-laundryflow}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

export MYSQL_PWD="$DB_PASSWORD"

# --- Tentukan file sumber ---
if [ -n "$1" ]; then
    SOURCE="$1"
else
    # Ambil backup terbaru (mtime terbesar).
    SOURCE=$(ls -t "${BACKUP_DIR}"/laundryflow_*.sql* 2>/dev/null | head -n 1)
fi

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
    echo "ERROR: File backup tidak ditemukan."
    echo "Tersedia di ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/laundryflow_*.sql* 2>/dev/null || echo "  (kosong)"
    echo ""
    echo "Penggunaan: ./restore.sh [path/ke/file.sql(.gz)]"
    exit 1
fi

echo "============================================================"
echo "  LaundryFlow — Database Restore"
echo "============================================================"
echo "File       : ${SOURCE}"
echo "Database   : ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"
echo "User       : ${DB_USER}"
echo "------------------------------------------------------------"
echo "PERINGATAN: ini akan MENIMPA data '${DB_NAME}' saat ini!"
echo "------------------------------------------------------------"

# Konfirmasi (lewati bila BACKUP_RESTORE_CONFIRM=yes, untuk otomasi).
if [ "${BACKUP_RESTORE_CONFIRM}" != "yes" ]; then
    printf "Ketik 'yes' untuk lanjut: "
    read -r CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Dibatalkan."
        exit 0
    fi
fi

# --- Restore ---
# cat | mysql agar bisa handle .sql mentah maupun .sql.gz (di-decompress dulu).
echo "[$(date)] Memulihkan..."
case "$SOURCE" in
    *.sql.gz)
        gunzip -c "$SOURCE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"
        ;;
    *.sql)
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$SOURCE"
        ;;
    *)
        echo "ERROR: format tidak dikenal (harus .sql atau .sql.gz)."
        exit 1
        ;;
esac

echo "[$(date)] Restore selesai. Database '${DB_NAME}' telah dipulihkan dari ${SOURCE}."
echo "Catatan: jalankan 'php artisan config:cache' di backend bila perlu."
