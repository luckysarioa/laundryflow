<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\OrderStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /reports/revenue?dari=&sampai=
     *
     * Mengembalikan pendapatan harian dalam rentang tanggal.
     * Omzet = total_harga order berstatus lunas (siap/diambil) yang
     * tgl_masuk jatuh dalam rentang, dikelompokkan per hari.
     *
     * Setiap titik: { tanggal, label, omzet, jumlahOrder }
     */
    public function revenue(Request $request)
    {
        $data = $request->validate([
            'dari' => ['required', 'date'],
            'sampai' => ['required', 'date', 'after_or_equal:dari'],
        ]);

        $dari = Carbon::parse($data['dari'])->startOfDay();
        $sampai = Carbon::parse($data['sampai'])->endOfDay();

        // Status lunas = siap / diambil.
        $lunasValues = [OrderStatus::Siap->value, OrderStatus::Diambil->value];

        $orders = Order::whereIn('status', $lunasValues)
            ->whereBetween('tgl_masuk', [$dari, $sampai])
            ->selectRaw('DATE(tgl_masuk) as tanggal, SUM(total_harga) as omzet, COUNT(*) as jumlah_order')
            ->groupBy('tanggal')
            ->get()
            ->keyBy('tanggal');

        // Bangun bucket per hari (termasuk hari tanpa omzet agar chart utuh).
        $points = [];
        $cursor = $dari->copy();
        while ($cursor <= $sampai) {
            $key = $cursor->toDateString();
            $row = $orders->get($key);

            $points[] = [
                'tanggal' => $key,
                'label' => $cursor->translatedFormat('j M'), // mis. "25 Jun"
                'omzet' => (int) ($row->omzet ?? 0),
                'jumlahOrder' => (int) ($row->jumlah_order ?? 0),
            ];

            $cursor->addDay();
        }

        return response()->json($points);
    }
}
