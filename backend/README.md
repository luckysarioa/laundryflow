# LaundryFlow — Backend (Laravel 11)

Backend API REST untuk LaundryFlow, menyediakan endpoint untuk frontend Next.js.
Dibangun dengan Laravel 11 (struktur ramping), MySQL, Laravel Sanctum (Token Auth),
dan Queue System untuk pengiriman WhatsApp async.

> Status: **Implementasi lengkap** (migrations, models, controllers, routes, seeders, queue).

---

## 📦 Stack
- Laravel 11 (PHP 8.2+)
- MySQL
- Laravel Sanctum (Bearer Token Auth)
- Queue (database driver) untuk WhatsApp async

## 🔧 Setup

### Prasyarat
- PHP 8.2+ dengan ekstensi: pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath
- Composer
- MySQL 5.7+/8.x

### Langkah

```bash
cd backend
composer install                 # instal dependency
cp .env.example .env             # salin konfigurasi
php artisan key:generate         # generate APP_KEY

# Buat database MySQL bernama "laundryflow" lalu:
php artisan migrate --seed       # jalankan migration + seeder (data demo)
php artisan serve                # API di http://localhost:8000
php artisan queue:work           # worker WhatsApp (jalankan di terminal terpisah)
```

### Akun Demo (hasil seeder)
| Role    | Email                     | Sandi         |
|---------|---------------------------|---------------|
| Pemilik | `pemilik@laundryflow.id`  | `laundry123`  |
| Kasir   | `kasir@laundryflow.id`    | `laundry123`  |

Seeder juga membuat: 4 layanan, 8 pelanggan, ~21 order lintas status (30 hari terakhir),
dan transaksi untuk order lunas. **Data ini identik dengan mock frontend** agar tampilan
konsisten saat beralih dari mock ke backend.

---

## 🔌 Kontrak API

Base path: `/api`. Format JSON. Semua route (kecuali `/auth/login`) butuh header
`Authorization: Bearer <token>` (token dari login Sanctum).

Format error: `{ "message": "..." }`. Request API selalu mengembalikan JSON
(dikonfigurasi di `bootstrap/app.php`).

### Auth
| Method | Endpoint        | Body                          | Respons                                        |
|--------|-----------------|-------------------------------|------------------------------------------------|
| POST   | `/auth/login`   | `{ email, password }`         | `{ token, user: { id, nama, email, role } }`   |
| POST   | `/auth/logout`  | —                             | `{ message }`                                   |
| GET    | `/auth/me`      | —                             | `User`                                         |

### Services
| Method | Endpoint     | Respons                              |
|--------|--------------|--------------------------------------|
| GET    | `/services`  | `Service[]` (id, nama_layanan, harga_per_kilo) |

### Customers
| Method | Endpoint        | Body                                   | Respons       |
|--------|-----------------|----------------------------------------|---------------|
| GET    | `/customers?q=` | —                                      | `Customer[]`  |
| POST   | `/customers`    | `{ nama, no_hp, alamat? }`             | `Customer`    |

### Orders
| Method | Endpoint                  | Body / Query                                  | Respons      |
|--------|---------------------------|-----------------------------------------------|--------------|
| GET    | `/orders?status=&q=`      | filter opsional                               | `Order[]` *  |
| GET    | `/orders/{id}`            | —                                             | `Order` *    |
| POST   | `/orders`                 | `{ customerId, serviceId, total_berat, catatan? }` | `Order` *    |
| PATCH  | `/orders/{id}/advance`    | — (status → tahap berikutnya)                 | `Order` *    |
| PATCH  | `/orders/{id}/status`     | `{ status }`                                  | `Order` *    |
| POST   | `/orders/{id}/notify`     | — (kirim WA via queue)                        | `{ success }`|

> *) **Order selalu di-join** dengan `customer` & `service` (eager load) — respons:
> ```json
> { "id":1, "customerId":1, "serviceId":2, "total_berat":3.5, "total_harga":31500,
>   "status":"cuci", "catatan":null,
>   "tgl_masuk":"2026-06-25T09:00:00.000Z", "tgl_selesai":null,
>   "customer": { "id":1, "nama":"Andi", "no_hp":"0812..", "alamat":"..", "createdAt":".." },
>   "service":  { "id":2, "nama_layanan":"Cuci Setrika", "harga_per_kilo":9000 } }
> ```

### Dashboard
| Method | Endpoint              | Respons                                                                 |
|--------|-----------------------|-------------------------------------------------------------------------|
| GET    | `/dashboard/stats`    | `{ omzetHariIni, jumlahOrderHariIni, cucianDiproses, siapDiambil, totalCustomer }` |

### Reports
| Method | Endpoint             | Query                          | Respons        |
|--------|----------------------|--------------------------------|----------------|
| GET    | `/reports/revenue`   | `?dari=&sampai=` (YYYY-MM-DD)  | `RevenuePoint[]` ** |

> **) `RevenuePoint` = `{ tanggal, label, omzet, jumlahOrder }`. Omzet = total order lunas
> (siap/diambil) yang `tgl_masuk` dalam rentang, dikelompokkan per hari.

### Transactions
| Method | Endpoint        | Respons         |
|--------|-----------------|-----------------|
| GET    | `/transactions` | `Transaction[]` |

---

## 💬 WhatsApp Gateway (Queue)

`POST /orders/{id}/notify` memicu `SendWhatsAppJob` via queue (PRD poin 4):

1. Controller dispatch `SendWhatsAppJob::dispatch($orderId)`.
2. API langsung mengembalikan `{ success: true }` (tidak diblokir).
3. Worker (`php artisan queue:work`) menjalankan job → memanggil WhatsApp Gateway.

### Mengganti ke provider sungguhan

Implementasi aktif: `DummyWhatsAppGateway` (hanya mencatat ke `storage/logs/whatsapp.log`).
Ganti dengan provider nyata (Fonnte / Wablas / Meta Cloud API):

1. Buat class implement `App\Services\WhatsApp\WhatsAppGateway`:
   ```php
   class FonnteWhatsAppGateway implements WhatsAppGateway {
       public function send(string $to, string $message): array {
           // panggil API Fonnte pakai Http::post(...)
           // baca token dari config/env
       }
   }
   ```
2. Ganti binding di `app/Providers/AppServiceProvider.php`:
   ```php
   $this->app->bind(
       \App\Services\WhatsApp\WhatsAppGateway::class,
       \App\Services\WhatsApp\FonnteWhatsAppGateway::class,
   );
   ```

Tidak ada job/controller yang perlu diubah — pola Strategy.

---

## 🧱 Struktur Folder

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   └── Api/            # Auth, Service, Customer, Order, Dashboard, Report, Transaction
│   │   ├── Middleware/         # EncryptCookies, VerifyCsrfToken, TrustHosts
│   │   └── Resources/          # User, Customer, Service, Order, Transaction (camelCase mapping)
│   ├── Jobs/SendWhatsAppJob.php
│   ├── Models/                 # User, Customer, Service, Order, Transaction
│   ├── Services/WhatsApp/      # Gateway interface + Dummy impl + message template
│   ├── Support/OrderStatus.php # enum alur 5 tahap
│   └── Providers/
├── bootstrap/app.php           # routing + middleware + exception (JSON for API)
├── config/                     # app, auth, cors, sanctum, database, queue, ...
├── database/
│   ├── migrations/             # default Laravel + domain tables
│   ├── factories/              # semua model
│   └── seeders/                # User, Service, Customer, Order (sinkron mock frontend)
└── routes/api.php
```

---

## 🔗 Menyambungkan Frontend

Di `frontend/.env.local`:
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Frontend akan otomatis memakai backend (lihat `frontend/src/lib/api.ts`). Tidak ada
komponen yang perlu diubah.
