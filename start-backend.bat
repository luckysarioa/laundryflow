@echo off
REM ==========================================================
REM LaundryFlow - Startup Backend (Laravel API + Queue Worker)
REM Menjalankan API server dan queue worker untuk WhatsApp.
REM ==========================================================

cd /d "%~dp0backend"

echo [LaundryFlow] Memulai backend...
echo.

REM Pastikan dependency terpasang
if not exist "vendor\autoload.php" (
    echo [1/3] Menginstal dependency Composer...
    call composer install
    if errorlevel 1 (
        echo Gagal: composer install error. Pastikan Composer terinstal.
        pause
        exit /b 1
    )
)

REM Pastikan .env ada
if not exist ".env" (
    echo [2/3] Menyalin .env.example -^> .env ...
    copy ".env.example" ".env" >nul
    echo       Generate APP_KEY...
    call php artisan key:generate --ansi
)

REM Migrasi database (opsional - jalankan sekali, atau setiap startup di dev)
echo [3/3] Menjalankan migration ^& seeder...
call php artisan migrate --seed --force
echo.

REM Jalankan queue worker di background (WhatsApp async)
echo [LaundryFlow] Memulai queue worker (background)...
start "LaundryFlow Queue" /min php artisan queue:work

echo [LaundryFlow] API berjalan di http://localhost:8000
echo [LaundryFlow] Tekan Ctrl+C untuk menghentikan.
echo.
call php artisan serve
