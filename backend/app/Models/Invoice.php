<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Invoice extends Model
{
    protected $fillable = [
        'tenant_id',
        'subscription_id',
        'invoice_number',
        'amount',
        'plan_name',
        'billing_period',
        'status',
        'due_date',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    // ----- Relations -----

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    // ----- Status helpers -----

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    // ----- Scopes -----

    public function scopeOfStatus(Builder $q, string $status): Builder
    {
        return $q->where('status', $status);
    }

    public function scopeForTenant(Builder $q, int $tenantId): Builder
    {
        return $q->where('tenant_id', $tenantId);
    }
}
