# ==========================================================
# LaundryFlow — Backup Service
# Container ringan yang menjalankan mysqldump sesuai jadwal cron.
# Backup disimpan di volume 'backup_data' (persistent).
# ==========================================================
FROM alpine:3.19

# mariadb-client menyertakan mysqldump & mysql (kompatibel MySQL 8).
RUN apk add --no-cache mariadb-client gzip findutils tini

WORKDIR /app

# Copy script backup & restore.
COPY backup.sh restore.sh ./
RUN chmod +x backup.sh restore.sh

# Volume untuk menyimpan file backup (dipasang dari compose).
VOLUME ["/backups"]

# Entrypoint: generate crontab dari env BACKUP_SCHEDULE, lalu jalankan cron.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
