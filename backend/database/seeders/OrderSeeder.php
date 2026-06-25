<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Service;
use App\Models\Transaction;
use App\Support\OrderStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * ~20 order lintas status dalam 30 hari terakhir (sinkron dengan mock frontend).
     * Order berstatus 'siap'/'diambil' otomatis mendapat transaksi (lunas).
     */
    public function run(): void
    {
        // Hapus data lama agar seeder idempoten.
        Transaction::query()->delete();
        Order::query()->delete();

        /**
         * Format seed: [customer_id, service_id, berat_kg, hari_lalu, status, catatan?]
         */
        $seeds = [
            // Hari ini (0)
            [1, 2, 3.5, 0, 'antrian', null],
            [2, 4, 2.0, 0, 'cuci', 'Prioritas, jemput sore'],
            [3, 1, 4.2, 0, 'siap', null],
            // Kemarin (1)
            [4, 2, 1.8, 1, 'setrika', null],
            [5, 3, 6.0, 1, 'siap', null],
            [6, 4, 2.5, 1, 'diambil', null],
            // 2-3 hari lalu
            [7, 2, 5.0, 2, 'diambil', null],
            [8, 1, 3.0, 2, 'siap', null],
            [1, 2, 2.2, 3, 'diambil', null],
            [2, 4, 1.5, 3, 'diambil', null],
            // 4-7 hari lalu
            [3, 2, 4.8, 4, 'diambil', null],
            [4, 3, 3.3, 5, 'diambil', null],
            [5, 1, 7.0, 6, 'diambil', null],
            [6, 2, 2.7, 7, 'diambil', null],
            // 10-28 hari lalu (riwayat untuk laporan)
            [7, 2, 3.9, 10, 'diambil', null],
            [8, 4, 2.0, 12, 'diambil', null],
            [1, 1, 5.5, 15, 'diambil', null],
            [2, 2, 4.0, 18, 'diambil', null],
            [3, 3, 6.5, 22, 'diambil', null],
            [4, 2, 3.0, 25, 'diambil', null],
            [5, 4, 2.8, 28, 'diambil', null],
        ];

        $tipePembayaran = ['tunai', 'qris', 'transfer'];

        foreach ($seeds as $i => $seed) {
            [$customerId, $serviceId, $berat, $hariLalu, $statusStr, $catatan] = $seed;

            $service = Service::find($serviceId);
            $status = OrderStatus::from($statusStr);

            $tglMasuk = Carbon::now()->subDays($hariLalu)->setHour(9 + ($i % 6))->startOfHour();
            $isDiambil = $status === OrderStatus::Diambil;
            $tglSelesai = $isDiambil
                ? Carbon::now()->subDays(max(0, $hariLalu - 1))->setHour(16)->startOfHour()
                : null;

            // id mengikuti auto-increment DB; frontend mengambil apa adanya.
            $order = Order::create([
                'customer_id' => $customerId,
                'service_id' => $serviceId,
                'total_berat' => $berat,
                'total_harga' => $service?->hitungHarga($berat) ?? 0,
                'status' => $status->value,
                'catatan' => $catatan,
                'tgl_masuk' => $tglMasuk,
                'tgl_selesai' => $tglSelesai,
            ]);

            // Catat transaksi untuk order lunas (siap/diambil).
            if (in_array($status, [OrderStatus::Siap, OrderStatus::Diambil], true)) {
                Transaction::create([
                    'order_id' => $order->id,
                    'nominal' => $order->total_harga,
                    'tipe_pembayaran' => $tipePembayaran[$i % 3],
                    'created_at' => $tglMasuk,
                ]);
            }
        }
    }
}
