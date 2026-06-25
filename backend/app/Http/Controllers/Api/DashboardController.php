<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Support\OrderStatus;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /dashboard/stats — ringkasan untuk dashboard (PRD poin 5).
     * Mengembalikan: omzetHariIni, jumlahOrderHariIni,
     *               cucianDiproses, siapDiambil, totalCustomer.
     */
    public function stats(Request $request)
    {
        $today = today();

        // Order yang masuk hari ini.
        $todayOrders = Order::whereDate('tgl_masuk', $today)->get();
        $omzetHariIni = $todayOrders->sum('total_harga');

        // Cucian yang masih diproses (semua status aktif, bukan 'diambil').
        $cucianDiproses = Order::whereIn('status', array_column(OrderStatus::active(), 'value'))->count();

        // Cucian siap diambil (menunggu pelanggan).
        $siapDiambil = Order::where('status', OrderStatus::Siap->value)->count();

        $totalCustomer = Customer::count();

        return response()->json([
            'omzetHariIni' => (int) $omzetHariIni,
            'jumlahOrderHariIni' => $todayOrders->count(),
            'cucianDiproses' => $cucianDiproses,
            'siapDiambil' => $siapDiambil,
            'totalCustomer' => $totalCustomer,
        ]);
    }
}
