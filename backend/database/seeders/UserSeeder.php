<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Akun demo (password sama untuk semua: laundry123).
     * Sinkron dengan frontend/src/lib/mock/db.ts.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'pemilik@laundryflow.id'],
            [
                'nama' => 'Budi Santoso',
                'password' => Hash::make('laundry123'),
                'role' => 'pemilik',
            ],
        );

        User::updateOrCreate(
            ['email' => 'kasir@laundryflow.id'],
            [
                'nama' => 'Siti Aminah',
                'password' => Hash::make('laundry123'),
                'role' => 'kasir',
            ],
        );
    }
}
