<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'price_monthly',
        'price_yearly',
        'max_users',
        'max_orders_per_month',
        'max_outlets',
        'features',
        'trial_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_monthly' => 'integer',
            'price_yearly' => 'integer',
            'max_users' => 'integer',
            'max_orders_per_month' => 'integer',
            'max_outlets' => 'integer',
            'features' => 'array',
            'trial_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    // ----- Scopes -----

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ----- Helpers -----

    public function hasFeature(string $feature): bool
    {
        return $this->features[$feature] ?? false;
    }

    public function isUnlimited(): bool
    {
        return $this->max_orders_per_month === 0;
    }
}
