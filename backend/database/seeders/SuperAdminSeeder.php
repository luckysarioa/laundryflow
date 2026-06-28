<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the superadmin user.
     *
     * Kredensial dapat di-override via env agar deployment produksi tidak
     * terkunci pada password default. Seeding bersifat idempoten
     * (firstOrCreate) sehingga aman dijalankan berulang.
     *
     * Env yang didukung:
     *   SUPERADMIN_EMAIL     (default: superadmin@laundryflow.id)
     *   SUPERADMIN_NAME      (default: Super Admin)
     *   SUPERADMIN_PASSWORD  (default: password)
     *
     * Catatan password: assign PLAINTEXT — model User punya cast 'password'
     * => 'hashed' yang akan meng-hash SATU kali otomatis. JANGAN Hash::make()
     * di sini (menyebabkan double-hash → login gagal).
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('SUPERADMIN_EMAIL', 'superadmin@laundryflow.id')],
            [
                'nama' => env('SUPERADMIN_NAME', 'Super Admin'),
                'password' => env('SUPERADMIN_PASSWORD', 'password'),
                'role' => 'superadmin',
            ]
        );
    }
}
