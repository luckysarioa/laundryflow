<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\OrderStatus;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    /**
     * GET /reports/revenue/pdf?dari=&sampai=
     *
     * Export laporan pendapatan ke PDF.
     */
    public function revenuePdf(Request $request)
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
            ->with(['customer', 'service'])
            ->orderBy('tgl_masuk')
            ->get();

        // Hitung ringkasan
        $totalOmzet = $orders->sum('total_harga');
        $totalOrder = $orders->count();
        $avgPerHari = $totalOrder > 0 ? round($totalOmzet / max(1, $dari->diffInDays($sampai) + 1)) : 0;

        // Group per hari untuk tabel
        $dailyData = $orders->groupBy(function ($order) {
            return $order->tgl_masuk->toDateString();
        })->map(function ($dayOrders, $date) {
            return [
                'tanggal' => Carbon::parse($date)->translatedFormat('d F Y'),
                'omzet' => $dayOrders->sum('total_harga'),
                'jumlah_order' => $dayOrders->count(),
            ];
        })->values();

        $pdf = Pdf::loadView('reports.revenue', [
            'dari' => $dari->translatedFormat('d F Y'),
            'sampai' => $sampai->translatedFormat('d F Y'),
            'totalOmzet' => $totalOmzet,
            'totalOrder' => $totalOrder,
            'avgPerHari' => $avgPerHari,
            'dailyData' => $dailyData,
            'orders' => $orders,
        ]);

        $filename = "laporan-pendapatan-{$dari->format('Y-m-d')}-sampai-{$sampai->format('Y-m-d')}.pdf";

        return $pdf->download($filename);
    }

    /**
     * GET /reports/orders/pdf?dari=&sampai=&status=
     *
     * Export daftar order ke PDF.
     */
    public function ordersPdf(Request $request)
    {
        $data = $request->validate([
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'status' => ['nullable', Rule::in(array_column(OrderStatus::cases(), 'value'))],
        ]);

        $query = Order::with(['customer', 'service'])->latest('tgl_masuk');

        if (!empty($data['dari']) && !empty($data['sampai'])) {
            $dari = Carbon::parse($data['dari'])->startOfDay();
            $sampai = Carbon::parse($data['sampai'])->endOfDay();
            $query->whereBetween('tgl_masuk', [$dari, $sampai]);
        }

        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $orders = $query->get();

        $pdf = Pdf::loadView('reports.orders', [
            'orders' => $orders,
            'dari' => $data['dari'] ?? null,
            'sampai' => $data['sampai'] ?? null,
            'status' => $data['status'] ?? null,
        ]);

        $filename = "laporan-order-" . now()->format('Y-m-d') . ".pdf";

        return $pdf->download($filename);
    }

    /**
     * GET /reports/orders/csv — export orders ke CSV.
     */
    public function ordersCsv(Request $request)
    {
        $data = $request->validate([
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'status' => ['nullable', Rule::in(array_column(OrderStatus::cases(), 'value'))],
        ]);

        $query = Order::with(['customer', 'service'])->latest('tgl_masuk');

        if (!empty($data['dari']) && !empty($data['sampai'])) {
            $query->whereBetween('tgl_masuk', [
                Carbon::parse($data['dari'])->startOfDay(),
                Carbon::parse($data['sampai'])->endOfDay(),
            ]);
        }

        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $orders = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="laporan-order-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Pelanggan', 'HP', 'Layanan', 'Berat (kg)', 'Total (Rp)', 'Status', 'Tanggal Masuk', 'Tanggal Selesai']);

            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->id,
                    $order->customer->nama ?? '-',
                    $order->customer->no_hp ?? '-',
                    $order->service->nama_layanan ?? '-',
                    $order->total_berat,
                    $order->total_harga,
                    $order->status,
                    $order->tgl_masuk?->format('d/m/Y H:i'),
                    $order->tgl_selesai?->format('d/m/Y H:i'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * GET /reports/revenue/csv — export revenue ke CSV.
     */
    public function revenueCsv(Request $request)
    {
        $data = $request->validate([
            'dari' => ['required', 'date'],
            'sampai' => ['required', 'date', 'after_or_equal:dari'],
        ]);

        $dari = Carbon::parse($data['dari'])->startOfDay();
        $sampai = Carbon::parse($data['sampai'])->endOfDay();

        $lunasValues = [OrderStatus::Siap->value, OrderStatus::Diambil->value];

        $orders = Order::whereIn('status', $lunasValues)
            ->whereBetween('tgl_masuk', [$dari, $sampai])
            ->with(['customer', 'service'])
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="laporan-pendapatan-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Tanggal', 'ID Order', 'Pelanggan', 'Layanan', 'Berat (kg)', 'Total (Rp)', 'Pembayaran']);

            foreach ($orders->sortBy('tgl_masuk') as $order) {
                fputcsv($file, [
                    $order->tgl_masuk?->format('d/m/Y'),
                    $order->id,
                    $order->customer->nama ?? '-',
                    $order->service->nama_layanan ?? '-',
                    $order->total_berat,
                    $order->total_harga,
                    $order->transactions->first()->tipe_pembayaran ?? '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
