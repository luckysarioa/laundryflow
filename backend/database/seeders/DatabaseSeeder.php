<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder utama — menjalankan semua seeder domain secara berurutan.
 * Data hasil sinkron dengan mock frontend (lib/mock/db.ts) agar tampilan
 * konsisten saat beralih dari mock ke backend sungguhan.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            SuperAdminSeeder::class,
            UserSeeder::class,
            ServiceSeeder::class,
            CustomerSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
