# ==========================================================
# LaundryFlow Backend — Laravel 11 (PHP 8.2 + Apache) untuk Docker/Coolify
# ==========================================================
FROM php:8.2-apache

# --- Ekstensi PHP yang dibutuhkan Laravel + MySQL ---
# curl: untuk healthcheck (route /up) & request WhatsApp Gateway provider.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev libonig-dev libxml2-dev libzip-dev unzip git curl \
    libicu-dev \
    && docker-php-ext-install pdo_mysql mbstring gd bcmath intl zip opcache \
    && rm -rf /var/lib/apt/lists/*

# Aktifkan mod_rewrite Apache (dibutuhkan Laravel pretty-url).
RUN a2enmod rewrite headers

# Composer (copy dari image official agar selalu versi terbaru stabil).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# --- Install dependency (layer terpisah untuk caching) ---
# CATATAN: composer.lock belum di-commit (generate di mesin lokal lalu commit).
# Tanpa lockfile, build mengambil versi terbaru → non-reproducible.
# Lihat backend/README.md bagian Setup cara generate composer.lock.
COPY composer.json composer.lock* ./
# --no-dev untuk image production (tanpa dependency testing/dev).
# --no-scripts: scripts dijalankan di entrypoint setelah env siap.
# Ignore security advisories yang memblokir semua versi Laravel 11.x (known Packagist issue).
RUN composer config --no-interaction policy.advisories.block false \
    && composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    || composer install --optimize-autoloader --no-interaction --no-scripts

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
