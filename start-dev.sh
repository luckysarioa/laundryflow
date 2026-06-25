#!/usr/bin/env bash
# ==========================================================
# LaundryFlow - Startup Cepat (Linux/macOS/Git Bash)
#
# Mode MOCK (default): frontend dengan data demo, tanpa backend.
# Mode FULL-STACK: lihat petunjuk di bawah.
#
# Penggunaan: ./start-dev.sh
# ==========================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " LaundryFlow - Mode Demo (MOCK data)"
echo "=========================================================="
echo

# --- Frontend ---
cd "$ROOT/frontend"
[ ! -d node_modules ] && { echo ">> npm install..."; npm install; }
[ ! -f .env.local ] && { cp .env.example .env.local; echo ">> .env.local dibuat (MOCK mode)"; }

echo ">> Frontend: http://localhost:3000"
echo ">> Login demo: pemilik@laundryflow.id / laundry123"
echo
echo "Mode FULL-STACK (butuh PHP+MySQL):"
echo "  1. Buat DB MySQL 'laundryflow'"
echo "  2. cd backend && composer install && cp .env.example .env && php artisan key:generate"
echo "  3. php artisan migrate --seed && php artisan serve"
echo "  4. php artisan queue:work  (terminal lain)"
echo "  5. Set frontend/.env.local: NEXT_PUBLIC_USE_MOCK=false"
echo "     NEXT_PUBLIC_API_URL=http://localhost:8000/api"
echo "=========================================================="

npm run dev
