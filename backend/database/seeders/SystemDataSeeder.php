<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Data SISTEM yang wajib ada di SEMUA environment (termasuk production).
 *
 * Berbeda dengan data demo (UserSeeder, ServiceSeeder, dll.) yang hanya
 * relevan untuk dev/staging, akun superadmin & master plan WAJIB ada
 * agar panel superadmin & flow langganan dapat berfungsi.
 *
 * Seeder ini idempoten (updateOrCreate / firstOrCreate) → aman dijalankan
 * ulang setiap start container tanpa duplikasi data.
 */
class SystemDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            SuperAdminSeeder::class,
        ]);
    }
}
