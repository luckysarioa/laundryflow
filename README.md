# 🫧 LaundryFlow

Sistem manajemen operasional & keuangan untuk bisnis laundry UMKM.
Mendigitalisasi alur kerja laundry dari pencatatan order, pelacakan status, hingga laporan keuangan otomatis — dengan fokus kemudahan pakai di HP (mobile-first PWA).

> **Status MVP: Full-stack lengkap & terintegrasi.**
> - **Frontend:** Next.js 15 PWA (siap pakai dengan mock data)
> - **Backend:** Laravel 11 API (MySQL, Sanctum, Queue WhatsApp)

---

## 📁 Struktur Proyek

```
laundryflow/
├── frontend/        # Next.js 15 + TypeScript + Tailwind + Recharts (PWA)
├── backend/         # Laravel 11 + MySQL + Sanctum + Queue (WhatsApp)
├── start-dev.bat    # Demo cepat: frontend dengan mock data
├── start-frontend.bat   # Frontend saja
├── start-backend.bat    # Backend (API + queue worker)
└── README.md        # Dokumen ini
```

---

## 🚀 Cara Cepat Mulai (Mode Demo — tanpa backend)

Cukup jalankan frontend dengan **data mock** (tidak butuh PHP/MySQL):

```bash
# Windows
start-dev.bat

# atau manual
cd frontend
npm install
npm run dev
```

Buka **http://localhost:3000**, login dengan:

| Role    | Email                     | Sandi         |
|---------|---------------------------|---------------|
| Pemilik | `pemilik@laundryflow.id`  | `laundry123`  |
| Kasir   | `kasir@laundryflow.id`    | `laundry123`  |

---

## 🔗 Mode Full-Stack (Frontend + Backend)

### Prasyarat
- Node.js 18.18+
- PHP 8.2+ (+ ekstensi: pdo_mysql, mbstring, openssl, bcmath)
- Composer
- MySQL 5.7+/8.x

### Langkah

**1. Siapkan backend:**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Buat database MySQL "laundryflow" dulu, lalu:
php artisan migrate --seed
php artisan serve          # http://localhost:8000
php artisan queue:work     # worker WhatsApp (terminal terpisah)
```

**2. Sambungkan frontend:**

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
cd frontend
npm run dev                # http://localhost:3000
```

> 🔑 **Kunci arsitektur:** semua data frontend melewati satu gateway (`frontend/src/lib/api.ts`).
> Switching mock → backend hanya mengubah flag di `.env.local`. **Tidak ada komponen yang diubah.**

---

## 🚢 Deploy ke Coolify (Docker)

LaundryFlow siap deploy sebagai stack Docker via `docker-compose.yml`:
**5 service** — MySQL, Backend Laravel, Queue Worker, Frontend Next.js, dan Backup otomatis.

### Arsitektur deployment (Coolify proxy + 2 domain)

Coolify sendiri menjalankan proxy (Traefik) yang menangani domain & HTTPS.
Project ini **tidak punya reverse proxy internal** — Coolify routing 2 domain langsung:

```
                    ┌──────────────────────┐
   Pengguna ──────► │  Coolify Proxy       │  (terminate TLS, auto-HTTPS)
                    │  (Traefik)           │
                    └──────┬───────┬───────┘
                           │       │
              app.domain ──┘       └──── api.domain
                           │              │
                           ▼              ▼
                    frontend:3000    backend:80
                    (Next.js PWA)    (Laravel API)
                                          │
                                          ▼
                       db (MySQL 8) ◄── queue (worker WA) ◄── backup (cron)
```

**Konsekuensi 2-domain (penting):**
- **CORS aktif** — frontend & backend beda origin → set `CORS_ALLOWED_ORIGINS` benar.
- **Frontend butuh rebuild bila ganti domain API** — karena `NEXT_PUBLIC_*` Next.js adalah
  build-time variable. Jadi tentukan domain API **sebelum** build pertama, dan rebuild
  bila domain berubah.

### File deployment
- `docker-compose.yml` — orkestrasi semua service (5 service, 2 volume)
- `frontend/Dockerfile` — Next.js standalone (image ramping)
- `backend/Dockerfile` + `backend/docker-entrypoint.sh` — Laravel (curl untuk healthcheck, auto migrate)
- `.env.docker.example` — template environment lengkap
- `backup/Dockerfile` + `backup/*.sh` — backup otomatis + restore

### Langkah deploy di Coolify

**1. Push repo** ke Git (GitHub/GitLab/Gitea) yang terhubung ke Coolify Anda.

**2. Buat resource di Coolify:**
   - **New Resource → Docker Compose** (dari repo Git atau Empty)
   - Coolify otomatis deteksi `docker-compose.yml` di root.

**3. Generate `APP_KEY`** (WAJIB, agar session/token tidak invalid tiap redeploy):
```bash
docker run --rm php:8.2-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));"
```
Salin hasilnya (mis. `base64:xxxxxx...`).

**4. Siapkan 2 subdomain** di DNS Anda, keduanya mengarah ke server Coolify:
   - `app.domainanda.com` → frontend
   - `api.domainanda.com` → backend API

**5. Set Environment Variables** di Coolify (lihat `.env.docker.example` sebagai panduan). WAJIB:
```
APP_KEY=base64:...                              # hasil langkah 3
APP_URL=https://api.domainanda.com              # URL publik backend
APP_ENV=production                              # seeder dilewati (tabel kosong)
DB_PASSWORD=<password-kuat>
DB_ROOT_PASSWORD=<password-kuat>
CORS_ALLOWED_ORIGINS=https://app.domainanda.com # origin frontend (CORS)
NEXT_PUBLIC_API_URL=https://api.domainanda.com/api  # build-time, butuh rebuild
```

**6. Map domain di Coolify:**
   - Pada service `frontend`, set Domain = `app.domainanda.com` → port `3000`.
   - Pada service `backend`, set Domain = `api.domainanda.com` → port `8081` (host) / `80` (container).
   - Coolify auto-issue sertifikat Let's Encrypt untuk keduanya.

**7. Deploy.** Coolify build semua image & start service.
   - Backend entrypoint: key (bila kosong) → config cache → migrate → seed data sistem → Apache.
   - Queue: tunggu DB siap → config cache → `queue:work`.
   - Akun **superadmin** & **master plan** otomatis dibuat saat start container (`SystemDataSeeder`), terlepas dari `APP_ENV`. Hanya data demo (user/service/order contoh) yang dilewati di production.

> ✅ **Login Super Admin** — akun dibuat otomatis saat deploy. Default:
> ```
> Email    : superadmin@laundryflow.id
> Password : password
> ```
> Ubah kredensial default via env: `SUPERADMIN_EMAIL`, `SUPERADMIN_NAME`, `SUPERADMIN_PASSWORD`.
>
> Untuk deployment yang **sudah berjalan** (tanpa redeploy), buat/perbarui akun superadmin langsung:
> ```bash
> docker compose exec backend php artisan app:create-superadmin
> # atau dengan kredensial kustom:
> docker compose exec backend php artisan app:create-superadmin --email=admin@x.com --password=rahasia
> ```

### Deploy manual (tanpa Coolify)
```bash
cp .env.docker.example .env
# Edit .env: isi APP_KEY, APP_URL, CORS, NEXT_PUBLIC_API_URL, password DB
docker compose up -d --build
docker compose logs -f
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081` (default `NEXT_PUBLIC_API_URL=http://localhost:8081/api` sudah cocok).

### Catatan operasional
- **Database persisten** via volume `db_data` → data aman saat restart/redeploy.
- **Migration otomatis** tiap start backend (`migrate --force`). Data **sistem** (superadmin + master plan) selalu di-seed; data demo hanya saat `APP_ENV != production`.
- **APP_KEY wajib persisten** — set eksplisit di env, jangan andalkan auto-generate (invalidate session tiap redeploy).
- **APP_URL** harus URL publik backend (HTTPS) — dipakai untuk storage URL & link WhatsApp.
- **WhatsApp Gateway** masih dummy (log). Implement provider nyata lalu rebuild image backend — compose tak berubah.
- **Ganti domain API** → frontend **wajib rebuild** (`NEXT_PUBLIC_*` build-time). Di Coolify: ubah env + trigger redeploy dengan build ulang image.

### ✅ Checklist sebelum deploy (wajib)

> Hasil pre-deploy audit. Tandai semua sebelum tekan tombol Deploy di Coolify.

**Environment (set di Coolify → Environment Variables):**
- [ ] `APP_KEY=base64:...` — generate dengan `docker run --rm php:8.2-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));"` (jangan biarkan kosong, akan invalidate session tiap redeploy)
- [ ] `APP_URL=https://api.domainanda.com` — **bare origin, TANPA `/api`**
- [ ] `APP_ENV=production`
- [ ] `DB_PASSWORD` & `DB_ROOT_PASSWORD` — password kuat (ganti default `changeme`)
- [ ] `CORS_ALLOWED_ORIGINS=https://app.domainanda.com` — origin frontend (WAJIB, default localhost akan diblokir CORS)
- [ ] `FRONTEND_URL=https://app.domainanda.com` — untuk link tracking di WhatsApp
- [ ] `NEXT_PUBLIC_USE_MOCK=false` & `NEXT_PUBLIC_API_URL=https://api.domainanda.com/api` — **HARUS sebagai build-args**, bukan runtime env (Next.js inline saat build)

**Opsional (fitur langganan berbayar):**
- [ ] `MIDTRANS_CLIENT_KEY` / `MIDTRANS_SERVER_KEY` / `MIDTRANS_NOTIFICATION_SECRET` — bila pakai payment. Kosongkan bila belum.

**Coolify UI:**
- [ ] Service `frontend` → Domain `app.domainanda.com` → port `3000`
- [ ] Service `backend` → Domain `api.domainanda.com` → port `8081`
- [ ] Coolify auto-issue HTTPS (Let's Encrypt) untuk keduanya

**Setelah deploy pertama (production = tanpa seeder):**
- [ ] Buat user admin: `docker compose exec backend php artisan tinker` lalu
      `\App\Models\User::create(['nama'=>'Admin','email'=>'admin@x.com','password'=>bcrypt('pass'),'role'=>'pemilik']);`
- [ ] Buat service & outlet awal via UI

**Volume persistent (sudah dikonfigurasi, jangan dihapus):**
- `db_data` — database MySQL
- `backend_storage` — foto order & file upload (hilang bila volume dibersihkan!)
- `backup_data` — hasil backup otomatis

---

## 💾 Backup & Restore Database

Service `backup` otomatis menjalankan `mysqldump` terkompresi sesuai jadwal cron
(default: **tiap hari jam 01:00**), menyimpan ke volume persistent `backup_data`,
dan menghapus backup lebih tua dari 7 hari (rotasi). Tidak ada intervensi manual.

### Konfigurasi (di `.env` / Coolify env)
| Variabel | Default | Keterangan |
|---|---|---|
| `BACKUP_SCHEDULE` | `0 1 * * *` | Cron (menit jam tgl bulan hari). Tiap hari 01:00 |
| `BACKUP_RETENTION_DAYS` | `7` | Backup lebih lama dari ini otomatis dihapus |
| `BACKUP_COMPRESS` | `gzip` | `gzip` (.sql.gz) atau `none` (.sql) |
| `BACKUP_ON_START` | `true` | Backup sekali saat container start |

> Contoh jadwal: `0 */6 * * *` = tiap 6 jam · `30 2 * * 0` = tiap Minggu 02:30

### File backup disimpan di
```
volume: backup_data  →  /backups/laundryflow_YYYY-MM-DD_HHMMSS.sql.gz
```

### Operasi manual (via Docker)

**Lihat daftar backup:**
```bash
docker compose exec backup ls -lh /backups
```

**Backup manual sekarang:**
```bash
docker compose exec backup /app/backup.sh
```

**Salin backup keluar dari server:**
```bash
docker compose cp backup:/backups/laundryflow_2026-06-26_010000.sql.gz ./
```

**Restore database:**
```bash
# Restore dari backup TERBARU:
docker compose exec backup /app/restore.sh

# Restore file spesifik:
docker compose exec backup /app/restore.sh /backups/laundryflow_2026-06-26_010000.sql.gz
```
Restore bersifat **interaktif** (akan minta konfirmasi) untuk mencegah penimpaan
tidak sengaja. Untuk otomasi, set `BACKUP_RESTORE_CONFIRM=yes`.

> Setelah restore, jalankan ulang `php artisan config:cache` di backend bila
> terjadi anomali cache (jarang diperlukan).

### Backup offsite (rekomendasi produksi)
Volume `backup_data` hanya menyimpan di server yang sama. Untuk ketahanan bencana,
sebarkan backup ke storage eksternal dengan salah satu cara:
- **Coolify Scheduled Job** yang `docker compose cp` lalu upload ke S3/MinIO/Google Drive
- **Volume mount** eksternal ke folder yang disinkronkan (rclone/restic)

---

## ✅ Kontrak Frontend ↔ Backend (Ter-verifikasi)

Audit integrasi telah dilakukan. Kontrak di bawah sudah konsisten — field, tipe, dan struktur respons cocok persis.

### Daftar endpoint & bentuk respons

| Endpoint | Method | Bentuk Respons | Catatan |
|---|---|---|---|
| `/auth/login` | POST | `{ token, user }` | user: `{id, nama, email, role}` |
| `/services` | GET | `Service[]` (array) | |
| `/customers?q=` | GET | `Customer[]` (array) | field `createdAt` (camelCase) |
| `/customers` | POST | `Customer` | |
| `/orders?status=&q=` | GET | `Order[]` (array) | nested `customer` + `service` |
| `/orders/{id}` | GET | `Order` | nested `customer` + `service` |
| `/orders` | POST | `Order` | input `customerId`, `serviceId`, `total_berat` |
| `/orders/{id}/advance` | PATCH | `Order` | status → tahap berikutnya |
| `/orders/{id}/status` | PATCH | `Order` | input `{ status }` |
| `/orders/{id}/notify` | POST | `{ success }` | kirim WA via queue |
| `/dashboard/stats` | GET | `{ omzetHariIni, jumlahOrderHariIni, cucianDiproses, siapDiambil, totalCustomer }` | |
| `/reports/revenue?dari=&sampai=` | GET | `RevenuePoint[]` (array) | satu titik per hari |
| `/transactions` | GET | `Transaction[]` (array) | field `orderId` (camelCase) |

### Konvensi penamaan field (disengaja, campuran)

Backend memakai Resource classes untuk mapping agar **persis** sama dengan ekspektasi frontend:

| Tipe | Contoh | Casing |
|---|---|---|
| Foreign key / sistem | `customerId`, `serviceId`, `orderId`, `createdAt` | **camelCase** |
| Domain & uang & tanggal | `total_berat`, `total_harga`, `tgl_masuk`, `nama_layanan`, `harga_per_kilo`, `tipe_pembayaran` | **snake_case** |

> Catatan: semua endpoint daftar mengembalikan **bare array** (bukan pagination wrapper)
> agar frontend bisa langsung `.map()`. Pagination dapat ditambahkan nanti bila data besar.

---

## 🧩 Fitur

| Fitur | Frontend | Backend |
|---|---|---|
| Auth (pemilik + kasir) | ✅ login + proteksi route | ✅ Sanctum token |
| Dashboard | ✅ omzet, cucian proses | ✅ agregasi `/dashboard/stats` |
| Order + auto-calc | ✅ berat × harga/kilo | ✅ `Service::hitungHarga()` |
| Status 5 tahap | ✅ kanban + advance | ✅ enum + transaksi otomatis |
| WhatsApp trigger | ✅ tombol kirim info | ✅ queue job (Strategy pattern) |
| Pelanggan | ✅ daftar + tambah | ✅ CRUD |
| Laporan | ✅ grafik Recharts + filter tanggal | ✅ agregasi per hari |
| PWA / offline | ✅ manifest + service worker | — |

---

## 🛠️ Stack Teknologi
- **Frontend:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Recharts
- **Backend:** Laravel 11 · PHP 8.2 · MySQL · Sanctum · Queue
- **Integrasi:** WhatsApp Gateway (Strategy pattern — dummy sekarang, ganti provider tinggal 1 binding)

---

## 📚 Dokumentasi detail
- [`frontend/`](frontend/) — lihat source; kontrak data di `src/lib/api.ts`
- [`backend/README.md`](backend/README.md) — setup backend lengkap + cara ganti WhatsApp provider

## 📝 Catatan
- Service worker frontend hanya aktif di **production build** (`npm run build && npm start`).
- Akun & data demo identik antara mock frontend dan seeder backend → tampilan konsisten saat berpindah mode.
- WhatsApp Gateway masih **dummy** (log ke file). Untuk produksi, implementasikan provider nyata (lihat `backend/README.md`).
