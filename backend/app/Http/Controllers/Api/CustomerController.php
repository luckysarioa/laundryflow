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
}
