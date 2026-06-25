<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => null, // wajib di-set saat create (Transaction::factory()->for($order))
            'nominal' => fake()->numberBetween(15000, 200000),
            'tipe_pembayaran' => fake()->randomElement(['tunai', 'qris', 'transfer']),
            'created_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
