@echo off
REM ==========================================================
REM LaundryFlow - Startup Cepat (Frontend + Backend bersamaan)
REM
REM Menjalankan dalam mode MOCK (tidak butuh MySQL/PHP siap):
REM   - Frontend:  http://localhost:3000  (data demo)
REM
REM Untuk mode FULL-STACK (frontend + backend Laravel):
REM   1. Pastikan PHP + Composer + MySQL terinstal & berjalan.
REM   2. Buat database MySQL "laundryflow".
REM   3. Jalankan: start-backend.bat (terminal terpisah)
REM   4. Edit frontend\.env.local: NEXT_PUBLIC_USE_MOCK=false
REM                              NEXT_PUBLIC_API_URL=http://localhost:8000/api
REM   5. Jalankan: start-frontend.bat
REM ==========================================================

echo ==========================================================
echo  LaundryFlow - Mode Demo Cepat (MOCK)
echo ==========================================================
echo.
echo Menjalankan frontend dengan data demo (tanpa backend)...
echo Buka http://localhost:3000 setelah siap.
echo Login: pemilik@laundryflow.id / laundry123
echo.
echo Untuk mode full-stack, lihat petunjuk di file ini atau README.md.
echo ==========================================================
echo.

start "LaundryFlow Frontend" "%~dp0start-frontend.bat"
