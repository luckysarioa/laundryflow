# ==========================================================
# LaundryFlow Backend — Laravel 11 (PHP 8.2 + Apache) untuk Docker/Coolify
# ==========================================================
FROM php:8.2-apache

# --- Ekstensi PHP yang dibutuhkan Laravel + MySQL ---
# curl: untuk healthcheck (route /up) & request WhatsApp Gateway provider.
# default-mysql-client: untuk mysqldump (API backup /api/backups lebih andal
#   dibanding raw SQL export via Laravel; dipakai juga saat manual restore).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev libonig-dev libxml2-dev libzip-dev unzip git curl \
    libicu-dev default-mysql-client \
    && docker-php-ext-install pdo_mysql mbstring gd bcmath intl zip opcache \
    && rm -rf /var/lib/apt/lists/*

# Aktifkan mod_rewrite Apache (dibutuhkan Laravel pretty-url).
RUN a2enmod rewrite headers

# Composer (copy dari image official agar selalu versi terbaru stabil).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# --- Install dependency (layer terpisah untuk caching) ---
# CATATAN: composer.lock belum di-commit. Untuk reproducibility & menghindari
# transient failure GitHub CDN (codeload HTTP 400), generate lock sekali lalu commit.
# Sambil belum ada lock, kita retry dist 3x, lalu fallback ke source (git clone)
# yang bypass codeload.zip sepenuhnya.
COPY composer.json composer.lock* ./
# Ignore security advisories yang memblokir semua versi Laravel 11.x (known Packagist issue).
RUN composer config --no-interaction policy.advisories.block false \
    && set -e; success=0; \
       for i in 1 2 3; do \
         echo "[dist attempt $i]"; \
         if composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist; then success=1; break; fi; \
         echo "[dist attempt $i failed, retrying in 5s...]"; sleep 5; \
       done; \
       if [ "$success" != "1" ]; then \
         echo "[dist exhausted, falling back to source (git clone)]"; \
         for i in 1 2 3; do \
           echo "[source attempt $i]"; \
           if composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-source; then success=1; break; fi; \
           echo "[source attempt $i failed, retrying in 5s...]"; sleep 5; \
         done; \
       fi; \
       if [ "$success" != "1" ]; then echo "All composer install attempts failed"; exit 1; fi

# --- Copy kode aplikasi ---
COPY . .

# Buat struktur storage (git-ignored) & izinkan Apache menulis.
RUN mkdir -p storage/app/public storage/framework/{cache/data,sessions,testing,views} storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# DocumentRoot Laravel: public/
# Override default Apache config (000-default.conf) agar mengarah ke /var/www/html/public
# dan AllowOverride All (supaya .htaccess Laravel bekerja).
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# Entry point: persiapan env sebelum Apache start.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

# entrypoint menjalankan: optimize cache, migrate, lalu apache-foreground.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
