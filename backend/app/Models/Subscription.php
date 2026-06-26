<?php

namespace App\Models;

use App\Support\SubscriptionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'payment_method',
        'payment_gateway_id',
        'midtrans_customer_id',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
        ];
    }

    // ----- Relations -----

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // ----- Status Checks -----

    public function isTrial(): bool
    {
        return $this->status === 'trial';
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['trial', 'active']);
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired';
    }

    public function isPastDue(): bool
    {
        return $this->status === 'past_due';
    }

    public function canAccess(string $feature): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        return $this->plan?->hasFeature($feature) ?? false;
    }

    public function ordersUsedThisMonth(): int
    {
        return $this->user->orders()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
    }

    public function canCreateOrder(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        if ($this->plan?->isUnlimited()) {
            return true;
        }

        return $this->ordersUsedThisMonth() < ($this->plan->max_orders_per_month ?? 0);
    }

    public function daysUntilExpiry(): ?int
    {
        if ($this->isTrial() && $this->trial_ends_at) {
            return (int) now()->diffInDays($this->trial_ends_at, false);
        }
        if ($this->current_period_end) {
            return (int) now()->diffInDays($this->current_period_end, false);
        }
        return null;
    }

    // ----- Actions -----

    public function activate(int $days = 30): void
    {
        $this->update([
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addDays($days),
        ]);
    }

    public function markPastDue(): void
    {
        $this->update(['status' => 'past_due']);
    }

    public function markExpired(): void
    {
        $this->update(['status' => 'expired']);
    }

    public function cancel(): void
    {
        $this->update([
            'status' => 'cancelled',
            'current_period_end' => now(),
        ]);
    }
}
