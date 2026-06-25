<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceFactory> */
    use HasFactory;

    protected $fillable = [
        'id',
        'nama_layanan',
        'harga_per_kilo',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'harga_per_kilo' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Hitung total harga berdasarkan berat (kg).
     * Sesuai PRD: harga = berat * harga_per_kilo.
     */
    public function hitungHarga(float $beratKg): int
    {
        return (int) round($this->harga_per_kilo * $beratKg);
    }
}
