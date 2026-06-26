<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('SUPERADMIN_EMAIL', 'superadmin@laundryflow.id')],
            [
                'nama' => env('SUPERADMIN_NAME', 'Super Admin'),
                'password' => Hash::make(env('SUPERADMIN_PASSWORD', 'password')),
                'role' => 'superadmin',
            ]
        );
    }
}
