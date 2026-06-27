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
        $order->load(['customer', 'service', 'transactions']);

        return new OrderResource($order);
    }

    /**
     * POST /orders — buat order baru.
     * total_harga dihitung otomatis: berat × harga_per_kilo.
     * Status awal = 'antrian'.
     * Cek subscription limit.
     */
    public function store(Request $request): OrderResource
    {
        // Cek subscription limit
        $user = $request->user();
        if ($user->isPemilik()) {
            $subscription = $user->subscription;
            if ($subscription && !$subscription->canCreateOrder()) {
                return response()->json([
                    'message' => 'Batas order bulanan tercapai. Upgrade plan untuk melanjutkan.',
                    'code' => 'ORDER_LIMIT_REACHED',
                ], 429);
            }
        }

        $data = $request->validate([
            'customerId' => ['required', 'exists:customers,id'],
            'serviceId' => ['required', 'exists:services,id'],
            'total_berat' => ['required', 'numeric', 'min:0.1'],
            'catatan' => ['nullable', 'string', 'max:500'],
            'tipe_pembayaran' => ['nullable', 'string', 'in:tunai,qris,transfer'],
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
                'tipe_pembayaran' => $data['tipe_pembayaran'] ?? null,
                'tgl_masuk' => now(),
            ]);

            // Log activity
            \App\Models\ActivityLog::log('order.create', $order, [
                'customer_id' => $order->customer_id,
                'total_harga' => $order->total_harga,
            ]);

            // Create notification for new order
            // CATATAN: operator ?? tidak boleh di dalam interpolation "{$...}" — PHP parse error.
            // Ekstrak ke variabel dulu (idiom yang benar).
            $customerName = $order->customer?->nama ?? 'pelanggan';
            \App\Models\Notification::createForUser(
                auth()->id(),
                'Order Baru',
                "Order #{$order->id} dari {$customerName} telah dibuat.",
                'info',
                "/orders/{$order->id}"
            );

            $order->load(['customer', 'service']);

            return new OrderResource($order);
        });
    }

    /**
     * PATCH /orders/{order} — edit order (berat, layanan, catatan, pembayaran).
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
            'tipe_pembayaran' => ['nullable', 'string', 'in:tunai,qris,transfer'],
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
            if (array_key_exists('tipe_pembayaran', $data)) {
                $order->tipe_pembayaran = $data['tipe_pembayaran'];
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

    /**
     * DELETE /orders/{order} — hapus order.
     * Hanya bisa dihapus jika status masih 'antrian' atau 'cuci'.
     */
    public function destroy(Order $order)
    {
        if (!in_array($order->status, [OrderStatus::Antrian->value, OrderStatus::Cuci->value])) {
            return response()->json([
                'message' => 'Order hanya bisa dihapus saat status Antrian atau Cuci.',
            ], 422);
        }

        // Hapus foto jika ada
        if ($order->foto) {
            Storage::disk('public')->delete($order->foto);
        }

        $order->delete();

        return response()->json(['success' => true]);
    }

    /**
     * GET /tracking/{orderId} — public order tracking (tanpa auth).
     */
    public function tracking($orderId)
    {
        $order = Order::with(['customer', 'service'])
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan.'], 404);
        }

        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'service' => $order->service?->nama_layanan,
            'total_berat' => $order->total_berat,
            'total_harga' => $order->total_harga,
            'catatan' => $order->catatan,
            'tgl_masuk' => $order->tgl_masuk?->toIso8601String(),
            'tgl_selesai' => $order->tgl_selesai?->toIso8601String(),
            'foto' => $order->foto,
            'estimasi_selesai' => $order->getEstimatedCompletion(),
        ]);
    }
}
