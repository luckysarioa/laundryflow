<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    /**
     * GET /customers — daftar pelanggan (terbaru lebih dulu).
     * Mengembalikan BARE ARRAY (bukan pagination) sesuai kontrak frontend.
     * Mendukung ?q= untuk pencarian nama/no_hp.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::query()->latest();

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('nama', 'like', "%{$q}%")
                    ->orWhere('no_hp', 'like', "%{$q}%");
            });
        }

        return CustomerResource::collection($query->get());
    }

    /**
     * POST /customers — tambah pelanggan baru.
     */
    public function store(Request $request): CustomerResource
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:120'],
            'no_hp' => ['required', 'string', 'max:20'],
            'alamat' => ['nullable', 'string', 'max:255'],
        ]);

        $customer = Customer::create($data);

        return new CustomerResource($customer);
    }

    /**
     * PATCH /customers/{customer} — edit pelanggan.
     */
    public function update(Request $request, Customer $customer): CustomerResource
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:120'],
            'no_hp' => ['sometimes', 'string', 'max:20'],
            'alamat' => ['nullable', 'string', 'max:255'],
        ]);

        $customer->update($data);

        return new CustomerResource($customer);
    }

    /**
     * DELETE /customers/{customer} — hapus pelanggan.
     * Hanya bisa dihapus jika tidak ada order aktif.
     */
    public function destroy(Customer $customer)
    {
        if ($customer->orders()->whereNotIn('status', ['diambil'])->exists()) {
            return response()->json([
                'message' => 'Pelanggan masih memiliki order aktif.',
            ], 422);
        }

        $customer->delete();

        return response()->json(['success' => true]);
    }

    /**
     * GET /customers/{customer}/orders — riwayat order pelanggan.
     */
    public function orders(Customer $customer)
    {
        $orders = $customer->orders()
            ->with(['service'])
            ->latest('tgl_masuk')
            ->get();

        return \App\Http\Resources\OrderResource::collection($orders);
    }
}
