<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    /** @use HasFactory<\Database\Factories\TransactionFactory> */
    use HasFactory;

    // Hanya pakai created_at (tidak ada updated_at).
    public const UPDATED_AT = null;

    protected $fillable = [
        'order_id',
        'nominal',
        'tipe_pembayaran',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
