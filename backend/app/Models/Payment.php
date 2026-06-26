<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'amount',
        'method',
        'status',
        'gateway_ref',
        'payment_url',
        'gateway_response',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'gateway_response' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    // ----- Relations -----

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    // ----- Status -----

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function markSuccess(array $response = []): void
    {
        $this->update([
            'status' => 'success',
            'paid_at' => now(),
            'gateway_response' => $response,
        ]);
    }

    public function markFailed(array $response = []): void
    {
        $this->update([
            'status' => 'failed',
            'gateway_response' => $response,
        ]);
    }
}
