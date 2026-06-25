<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_layanan' => $this->nama_layanan,
            'harga_per_kilo' => $this->harga_per_kilo,
            'is_active' => $this->is_active,
        ];
    }
}
