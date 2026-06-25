<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource Order — wajib di-join dengan customer & service (eager load),
 * agar frontend langsung dapat data lengkap dalam satu respons.
 * Field camelCase (customerId, serviceId, ...) sesuai kontrak API.
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customerId' => $this->customer_id,
            'serviceId' => $this->service_id,
            'total_berat' => (float) $this->total_berat,
            'total_harga' => (int) $this->total_harga,
            'status' => $this->status,
            'catatan' => $this->catatan,
            'tgl_masuk' => $this->tgl_masuk?->toIso8601String(),
            'tgl_selesai' => $this->tgl_selesai?->toIso8601String(),

            // Relasi (harus di-load oleh controller via with()).
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'service' => new ServiceResource($this->whenLoaded('service')),
        ];
    }
}
