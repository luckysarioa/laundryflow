<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
        'outlet_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ----- Relations -----

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function outlet(): HasOne
    {
        return $this->hasOne(Outlet::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    // ----- Helpers role -----

    public function isPemilik(): bool
    {
        return $this->role === 'pemilik';
    }

    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }

    // ----- Subscription helpers -----

    public function getActiveSubscription(): ?Subscription
    {
        return $this->subscription;
    }

    public function hasActiveSubscription(): bool
    {
        $sub = $this->subscription;
        return $sub && $sub->isActive();
    }

    public function hasFeature(string $feature): bool
    {
        $sub = $this->subscription;
        if (!$sub || !$sub->isActive()) {
            return false;
        }
        return $sub->canAccess($feature);
    }
}
