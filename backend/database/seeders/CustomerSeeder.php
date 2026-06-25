<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * 8 pelanggan demo (sinkron dengan mock frontend).
     */
    public function run(): void
    {
        $customers = [
            ['id' => 1, 'nama' => 'Andi Wijaya', 'no_hp' => '081234567890', 'alamat' => 'Jl. Melati No. 12, Kebon Jeruk'],
            ['id' => 2, 'nama' => 'Dewi Lestari', 'no_hp' => '082198765432', 'alamat' => 'Jl. Anggrek No. 8, Tanah Kusir'],
            ['id' => 3, 'nama' => 'Rudi Hartono', 'no_hp' => '085711122233', 'alamat' => 'Jl. Kenanga No. 21, Cipete'],
            ['id' => 4, 'nama' => 'Maya Sari', 'no_hp' => '081399988877', 'alamat' => 'Jl. Flamboyan No. 5, Permata Hijau'],
            ['id' => 5, 'nama' => 'Joko Susilo', 'no_hp' => '087812345678', 'alamat' => 'Jl. Cempaka No. 17, Kebayoran'],
            ['id' => 6, 'nama' => 'Rina Marlina', 'no_hp' => '082233445566', 'alamat' => 'Jl. Dahlia No. 3, Pondok Indah'],
            ['id' => 7, 'nama' => 'Agus Setiawan', 'no_hp' => '081567891011', 'alamat' => 'Jl. Teratai No. 9, Bintaro'],
            ['id' => 8, 'nama' => 'Putri Nabila', 'no_hp' => '083812345670', 'alamat' => 'Jl. Bougenville No. 14, Pasar Minggu'],
        ];

        foreach ($customers as $c) {
            Customer::updateOrCreate(['id' => $c['id']], $c);
        }
    }
}
