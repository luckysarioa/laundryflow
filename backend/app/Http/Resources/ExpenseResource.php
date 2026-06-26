<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kategori' => $this->kategori,
            'deskripsi' => $this->deskripsi,
            'nominal' => (int) $this->nominal,
            'tanggal' => $this->tanggal?->toDateString(),
            'user' => new \App\Http\Resources\UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
