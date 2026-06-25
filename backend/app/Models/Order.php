<?php

namespace App\Models;

use App\Support\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'service_id',
        'total_berat',
        'total_harga',
        'status',
        'catatan',
        'foto',
        'tgl_masuk',
        'tgl_selesai',
    ];

    protected function casts(): array
    {
        return [
            'total_berat' => 'decimal:2',
            'total_harga' => 'integer',
            'tgl_masuk' => 'datetime',
            'tgl_selesai' => 'datetime',
        ];
    }

    // ----- Relations -----

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ----- Status helpers -----

    /**
     * Majukan status ke tahap berikutnya dalam alur:
     * Antrian → Cuci → Setrika → Siap → Diambil.
     */
    public function advanceStatus(): OrderStatus
    {
        $next = OrderStatus::next($this->status);

        if ($next === null) {
            // Sudah di status akhir.
            return OrderStatus::from($this->status);
        }

        $this->status = $next->value;

        // Saat berubah menjadi 'diambil', tandai selesai & catat transaksi.
        if ($next === OrderStatus::Diambil && $this->tgl_selesai === null) {
            $this->tgl_selesai = now();
            $this->recordTransaction();
        }

        $this->save();

        return $next;
    }

    /**
     * Set status langsung (mis. dari kanban board).
     */
    public function setStatus(OrderStatus $status): void
    {
        $this->status = $status->value;

        if ($status === OrderStatus::Diambil && $this->tgl_selesai === null) {
            $this->tgl_selesai = now();
            $this->recordTransaction();
        }

        $this->save();
    }

    /**
     * Catat transaksi (lunas) jika belum ada — nominal = total harga order.
     */
    protected function recordTransaction(): void
    {
        if ($this->transactions()->exists()) {
            return;
        }
        $this->transactions()->create([
            'nominal' => $this->total_harga,
            'tipe_pembayaran' => 'tunai',
        ]);
    }
}
