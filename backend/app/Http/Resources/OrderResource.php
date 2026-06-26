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
            'tipe_pembayaran' => $this->tipe_pembayaran,
            // foto: jalur RELATIF terhadap storage publik (mis. "orders/5/abc.jpg").
            // Frontend mengkonstruksi URL absolut: {backend_origin}/storage/{foto}.
            // (Sebelumnya pakai asset() yang rapuh: bergantung APP_URL persis benar.)
            'foto' => $this->foto,
            'tgl_masuk' => $this->tgl_masuk?->toIso8601String(),
            'tgl_selesai' => $this->tgl_selesai?->toIso8601String(),

            // Relasi (harus di-load oleh controller via with()).
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'service' => new ServiceResource($this->whenLoaded('service')),

            // Transaksi (jika ada) untuk cek status bayar
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
        ];
    }
}
