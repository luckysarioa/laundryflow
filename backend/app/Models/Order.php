<?php

namespace App\Models;

use App\Jobs\SendWhatsAppJob;
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
        'outlet_id',
        'total_berat',
        'total_harga',
        'status',
        'catatan',
        'tipe_pembayaran',
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

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ----- Status helpers -----

    /**
     * Majukan status ke tahap berikutnya dalam alur:
     * Antrian → Cuci → Setrika → Siap → Diambil.
     * Auto kirim WhatsApp ke customer.
     */
    public function advanceStatus(): OrderStatus
    {
        $next = OrderStatus::next($this->status);

        if ($next === null) {
            return OrderStatus::from($this->status);
        }

        $this->status = $next->value;

        if ($next === OrderStatus::Diambil && $this->tgl_selesai === null) {
            $this->tgl_selesai = now();
            $this->recordTransaction();
        }

        $this->save();

        // Auto kirim WhatsApp notifikasi
        $this->sendStatusNotification();

        return $next;
    }

    /**
     * Set status langsung (mis. dari kanban board).
     * Auto kirim WhatsApp ke customer.
     */
    public function setStatus(OrderStatus $status): void
    {
        $this->status = $status->value;

        if ($status === OrderStatus::Diambil && $this->tgl_selesai === null) {
            $this->tgl_selesai = now();
            $this->recordTransaction();
        }

        $this->save();

        // Auto kirim WhatsApp notifikasi
        $this->sendStatusNotification();
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
            'tipe_pembayaran' => $this->tipe_pembayaran ?? 'tunai',
        ]);
    }

    /**
     * Kirim notifikasi WhatsApp otomatis ke customer.
     */
    protected function sendStatusNotification(): void
    {
        try {
            $this->load('customer');
            if ($this->customer && $this->customer->no_hp) {
                SendWhatsAppJob::dispatch($this->id);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send WhatsApp notification', [
                'order_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ----- Estimasi Selesai -----

    /**
     * Estimasi waktu selesai berdasarkan layanan dan berat.
     * Rata-rata: 30 menit per kg untuk cuci, 20 menit untuk setrika.
     */
    public function getEstimatedCompletion(): ?string
    {
        if ($this->status === 'diambil') {
            return null;
        }

        $waktuPerKg = match($this->service?->nama_layanan) {
            'Setrika Saja' => 20, // menit per kg
            'Express 6 Jam' => 10,
            default => 30, // cuci kering, cuci setrika
        };

        $totalMenit = (int) ceil($this->total_berat * $waktuPerKg);
        $jam = floor($totalMenit / 60);
        $menit = $totalMenit % 60;

        // Tambahkan buffer 30 menit
        $totalMenit += 30;
        $jam = floor($totalMenit / 60);
        $menit = $totalMenit % 60;

        if ($jam > 0 && $menit > 0) {
            return "{$jam} jam {$menit} menit";
        } elseif ($jam > 0) {
            return "{$jam} jam";
        } else {
            return "{$menit} menit";
        }
    }

    /**
     * Hitung estimated completion time (datetime).
     */
    public function getEstimatedCompletionTime(): ?\Carbon\Carbon
    {
        if ($this->status === 'diambil') {
            return null;
        }

        $waktuPerKg = match($this->service?->nama_layanan) {
            'Setrika Saja' => 20,
            'Express 6 Jam' => 10,
            default => 30,
        };

        $totalMenit = (int) ceil($this->total_berat * $waktuPerKg) + 30;

        // Estimasi dari waktu masuk
        return $this->tgl_masuk?->addMinutes($totalMenit);
    }
}
