@echo off
REM ==========================================================
REM LaundryFlow - Startup Frontend (Next.js dev server)
REM ==========================================================

cd /d "%~dp0frontend"

echo [LaundryFlow] Memulai frontend...
echo.

REM Pastikan dependency terpasang
if not exist "node_modules" (
    echo [1/2] Menginstal dependency npm...
    call npm install
    if errorlevel 1 (
        echo Gagal: npm install error. Pastikan Node.js terinstal.
        pause
        exit /b 1
    )
)

REM Pastikan .env.local ada (default: pakai mock data)
if not exist ".env.local" (
    echo [2/2] Membuat .env.local dari .env.example ...
    copy ".env.example" ".env.local" >nul
    echo       Mode default: NEXT_PUBLIC_USE_MOCK=true (data demo)
    echo       Untuk pakai backend, ubah menjadi false dan isi NEXT_PUBLIC_API_URL.
    echo.
)

echo [LaundryFlow] Frontend berjalan di http://localhost:3000
echo [LaundryFlow] Tekan Ctrl+C untuk menghentikan.
echo.
call npm run dev
