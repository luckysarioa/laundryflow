<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Akun demo (password sama untuk semua: laundry123).
     * Sinkron dengan frontend/src/lib/mock/db.ts.
     *
     * Catatan password: assign PLAINTEXT — model User punya cast 'password'
     * => 'hashed' yang akan meng-hash SATU kali otomatis. JANGAN Hash::make()
     * di sini (menyebabkan double-hash → login gagal).
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'pemilik@laundryflow.id'],
            [
                'nama' => 'Budi Santoso',
                'password' => 'laundry123',
                'role' => 'pemilik',
            ],
        );

        User::updateOrCreate(
            ['email' => 'kasir@laundryflow.id'],
            [
                'nama' => 'Siti Aminah',
                'password' => 'laundry123',
                'role' => 'kasir',
            ],
        );
    }
}
