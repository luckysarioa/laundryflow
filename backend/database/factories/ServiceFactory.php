<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    public function definition(): array
    {
        $daftar = ['Cuci Kering', 'Cuci Setrika', 'Setrika Saja', 'Express 6 Jam'];
        return [
            'nama_layanan' => fake()->unique()->randomElement($daftar),
            'harga_per_kilo' => fake()->randomElement([5000, 7000, 9000, 15000]),
            'is_active' => true,
        ];
    }
}
