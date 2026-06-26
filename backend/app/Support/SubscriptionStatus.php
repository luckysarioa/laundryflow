<?php

namespace App\Support;

enum SubscriptionStatus: string
{
    case Trial = 'trial';
    case Active = 'active';
    case PastDue = 'past_due';
    case Expired = 'expired';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Trial => 'Trial',
            self::Active => 'Aktif',
            self::PastDue => 'Perlu Pembayaran',
            self::Expired => 'Expired',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Trial => 'blue',
            self::Active => 'emerald',
            self::PastDue => 'amber',
            self::Expired => 'red',
            self::Cancelled => 'slate',
        };
    }
}
