<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * 4 layanan demo (sinkron dengan mock frontend).
     */
    public function run(): void
    {
        $services = [
            ['id' => 1, 'nama_layanan' => 'Cuci Kering', 'harga_per_kilo' => 7000],
            ['id' => 2, 'nama_layanan' => 'Cuci Setrika', 'harga_per_kilo' => 9000],
            ['id' => 3, 'nama_layanan' => 'Setrika Saja', 'harga_per_kilo' => 5000],
            ['id' => 4, 'nama_layanan' => 'Express 6 Jam', 'harga_per_kilo' => 15000],
        ];

        foreach ($services as $svc) {
            Service::updateOrCreate(['id' => $svc['id']], $svc);
        }
    }
}
