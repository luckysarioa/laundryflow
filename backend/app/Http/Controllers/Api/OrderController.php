<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Jobs\SendWhatsAppJob;
use App\Models\Order;
use App\Models\Service;
use App\Support\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * GET /orders — daftar order (terbaru lebih dulu).
     * Mengembalikan BARE ARRAY (bukan pagination) sesuai kontrak frontend.
     * Mendukung filter ?status= dan pencarian ?q= (nama/no_hp/id).
     * Selalu di-join dengan customer & service.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with(['customer', 'service'])->latest('tgl_masuk');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('id', $q)
                    ->orWhereHas('customer', function ($c) use ($q) {
                        $c->where('nama', 'like', "%{$q}%")
                            ->orWhere('no_hp', 'like', "%{$q}%");
                    });
            });
        }

        return OrderResource::collection($query->get());
    }

    /**
     * GET /orders/{order} — detail satu order.
     */
    public function show(Order $order): OrderResource
    {
        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * POST /orders — buat order baru.
     * total_harga dihitung otomatis: berat × harga_per_kilo.
     * Status awal = 'antrian'.
     */
    public function store(Request $request): OrderResource
    {
        $data = $request->validate([
            'customerId' => ['required', 'exists:customers,id'],
            'serviceId' => ['required', 'exists:services,id'],
            'total_berat' => ['required', 'numeric', 'min:0.1'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        $service = Service::findOrFail($data['serviceId']);

        return DB::transaction(function () use ($data, $service) {
            $order = Order::create([
                'customer_id' => $data['customerId'],
                'service_id' => $service->id,
                'total_berat' => $data['total_berat'],
                'total_harga' => $service->hitungHarga((float) $data['total_berat']),
                'status' => OrderStatus::Antrian->value,
                'catatan' => $data['catatan'] ?? null,
                'tgl_masuk' => now(),
            ]);

            $order->load(['customer', 'service']);

            return new OrderResource($order);
        });
    }

    /**
     * PATCH /orders/{order} — edit order (berat, layanan, catatan).
     * Hanya boleh diedit jika status masih 'antrian' atau 'cuci'.
     */
    public function update(Request $request, Order $order): OrderResource
    {
        if (!in_array($order->status, [OrderStatus::Antrian->value, OrderStatus::Cuci->value])) {
            return response()->json([
                'message' => 'Order hanya bisa diedit saat status Antrian atau Cuci.',
            ], 422);
        }

        $data = $request->validate([
            'serviceId' => ['sometimes', 'exists:services,id'],
            'total_berat' => ['sometimes', 'numeric', 'min:0.1'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($data, $order) {
            if (isset($data['serviceId'])) {
                $order->service_id = $data['serviceId'];
            }
            if (isset($data['total_berat'])) {
                $order->total_berat = $data['total_berat'];
            }
            if (array_key_exists('catatan', $data)) {
                $order->catatan = $data['catatan'];
            }

            // Hitung ulang total_harga jika berat atau layanan berubah
            if (isset($data['serviceId']) || isset($data['total_berat'])) {
                $service = $order->service;
                $order->total_harga = $service->hitungHarga((float) $order->total_berat);
            }

            $order->save();
        });

        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * POST /orders/{order}/foto — upload foto bukti cucian.
     */
    public function uploadFoto(Request $request, Order $order): OrderResource
    {
        $request->validate([
            'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        // Hapus foto lama jika ada
        if ($order->foto) {
            Storage::disk('public')->delete($order->foto);
        }

        $path = $request->file('foto')->store('orders/' . $order->id, 'public');
        $order->update(['foto' => $path]);

        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * DELETE /orders/{order}/foto — hapus foto bukti cucian.
     */
    public function deleteFoto(Order $order): OrderResource
    {
        if ($order->foto) {
            Storage::disk('public')->delete($order->foto);
            $order->update(['foto' => null]);
        }

        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * PATCH /orders/{order}/advance — majukan status ke tahap berikutnya.
     */
    public function advance(Order $order)
    {
        if (OrderStatus::next($order->status) === null) {
            return response()->json([
                'message' => 'Order sudah berada di status akhir (Diambil).',
            ], 422);
        }

        // recordTransaction() dipanggil di dalam advanceStatus() bila perlu.
        DB::transaction(fn () => $order->advanceStatus());

        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * PATCH /orders/{order}/status — set status secara langsung.
     */
    public function setStatus(Request $request, Order $order): OrderResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_column(OrderStatus::cases(), 'value'))],
        ]);

        DB::transaction(fn () => $order->setStatus(OrderStatus::from($data['status'])));

        $order->load(['customer', 'service']);

        return new OrderResource($order);
    }

    /**
     * POST /orders/{order}/notify — kirim notifikasi WhatsApp ke pelanggan.
     * Dispatch job async (PRD poin 4 — Queue System) agar tidak memblokir API.
     */
    public function notify(Order $order)
    {
        $order->load(['customer', 'service']);

        SendWhatsAppJob::dispatch($order->id);

        return response()->json(['success' => true]);
    }
}
