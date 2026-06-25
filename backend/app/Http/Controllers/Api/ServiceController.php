<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
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
}
