<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'link',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ----- Scopes -----

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    // ----- Actions -----

    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }

    // ----- Helpers -----

    public static function createForUser(
        int $userId,
        string $title,
        string $message,
        string $type = 'info',
        string|null $link = null
    ): static {
        return static::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
        ]);
    }
}
