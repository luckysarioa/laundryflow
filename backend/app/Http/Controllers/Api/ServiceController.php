<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    /**
     * GET /services — daftar layanan aktif.
     */
    public function index(): AnonymousResourceCollection
    {
        $services = Service::query()
            ->where('is_active', true)
            ->orderBy('nama_layanan')
            ->get();

        return ServiceResource::collection($services);
    }

    /**
     * GET /services/all — daftar semua layanan (termasuk non-aktif).
     */
    public function all(): AnonymousResourceCollection
    {
        $services = Service::query()->orderBy('nama_layanan')->get();

        return ServiceResource::collection($services);
    }

    /**
     * POST /services — tambah layanan baru.
     */
    public function store(Request $request): ServiceResource
    {
        $data = $request->validate([
            'nama_layanan' => ['required', 'string', 'max:100'],
            'harga_per_kilo' => ['required', 'integer', 'min:0'],
        ]);

        $service = Service::create([
            'nama_layanan' => $data['nama_layanan'],
            'harga_per_kilo' => $data['harga_per_kilo'],
            'is_active' => true,
        ]);

        return new ServiceResource($service);
    }

    /**
     * PATCH /services/{service} — edit layanan.
     */
    public function update(Request $request, Service $service): ServiceResource
    {
        $data = $request->validate([
            'nama_layanan' => ['sometimes', 'string', 'max:100'],
            'harga_per_kilo' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($data);

        return new ServiceResource($service);
    }

    /**
     * DELETE /services/{service} — hapus layanan.
     * Hanya bisa dihapus jika tidak ada order aktif yang menggunakannya.
     */
    public function destroy(Service $service)
    {
        if ($service->orders()->whereNotIn('status', ['diambil'])->exists()) {
            return response()->json([
                'message' => 'Layanan masih digunakan oleh order aktif.',
            ], 422);
        }

        $service->delete();

        return response()->json(['success' => true]);
    }
}
