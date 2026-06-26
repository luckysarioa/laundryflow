<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OutletResource;
use App\Models\Outlet;
use Illuminate\Http\Request;

class OutletController extends Controller
{
    /**
     * GET /outlets — daftar cabang.
     */
    public function index()
    {
        $outlets = Outlet::latest()->get();
        return OutletResource::collection($outlets);
    }

    /**
     * POST /outlets — tambah cabang.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $outlet = Outlet::create([
            'user_id' => $request->user()->id,
            ...$data,
        ]);

        return new OutletResource($outlet);
    }

    /**
     * PATCH /outlets/{outlet} — edit cabang.
     */
    public function update(Request $request, Outlet $outlet)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $outlet->update($data);

        return new OutletResource($outlet);
    }

    /**
     * DELETE /outlets/{outlet} — hapus cabang.
     */
    public function destroy(Outlet $outlet)
    {
        if ($outlet->orders()->exists()) {
            return response()->json(['message' => 'Cabang masih memiliki data order.'], 422);
        }

        $outlet->delete();

        return response()->json(['success' => true]);
    }
}
