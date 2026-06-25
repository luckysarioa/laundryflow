<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Service;
use App\Support\OrderStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        // Berat acak 1-8 kg; total_harga & service dihitung di closure agar
        // query DB (Service) hanya berjalan saat instance benar-benar dibuat,
        // bukan saat definition() dievaluasi.
        $berat = fake()->randomFloat(2, 1, 8);

        return [
            'customer_id' => Customer::factory(),
            'service_id' => null, // diisi di.configure() / closure bawah
            'total_berat' => $berat,
            'total_harga' => 0,
            'status' => fake()->randomElement(array_column(OrderStatus::cases(), 'value')),
            'catatan' => fake()->optional(0.2)->sentence(),
            'tgl_masuk' => fake()->dateTimeBetween('-30 days', 'now'),
            'tgl_selesai' => null,
        ];
    }

    /**
     * Setelah atribut dasar di-resolve, isi service_id & total_harga.
     */
    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\Order $order) {
            $this->resolveServiceAndPrice($order);
        })->afterCreating(function (\App\Models\Order $order) {
            $this->resolveServiceAndPrice($order);
            $order->save();
        });
    }

    /**
     * Ambil service acak & hitung harga berdasarkan berat.
     */
    protected function resolveServiceAndPrice(\App\Models\Order $order): void
    {
        if (! $order->service_id) {
            $service = Service::inRandomOrder()->first();
            if (! $service) {
                $service = Service::factory()->create();
            }
            $order->service_id = $service->id;
        }

        $service = Service::find($order->service_id);
        if ($service) {
            $order->total_harga = $service->hitungHarga((float) $order->total_berat);
        }
    }
}
