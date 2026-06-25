<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orderId' => $this->order_id,
            'nominal' => $this->nominal,
            'tipe_pembayaran' => $this->tipe_pembayaran,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
