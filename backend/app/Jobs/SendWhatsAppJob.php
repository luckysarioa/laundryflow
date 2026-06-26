<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\WhatsApp\WhatsAppGateway;
use App\Services\WhatsApp\WhatsAppMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job async pengiriman notifikasi WhatsApp (PRD poin 4 — Queue System).
 *
 * Dipicu oleh OrderController::notify(). Karena berjalan via queue worker,
 * request API tidak diblokir dan langsung mengembalikan { success: true }.
 */
class SendWhatsAppJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan ulang bila gagal.
     */
    public int $tries = 3;

    /**
     * Detik tunggu sebelum retry.
     */
    public int $backoff = 30;

    public function __construct(
        public int $orderId,
    ) {}

    public function handle(WhatsAppGateway $gateway): void
    {
        $order = Order::with(['customer', 'service'])->find($this->orderId);

        if (! $order) {
            Log::warning('SendWhatsAppJob: order tidak ditemukan.', ['order_id' => $this->orderId]);
            return;
        }

        $no_hp = $order->customer?->no_hp;
        if (! $no_hp) {
            Log::warning('SendWhatsAppJob: customer tanpa no_hp.', ['order_id' => $this->orderId]);
            return;
        }

        $to = WhatsAppMessage::normalizeNumber($no_hp);
        $message = WhatsAppMessage::statusUpdate($order);

        $result = $gateway->send($to, $message);

        Log::info('SendWhatsAppJob selesai', [
            'order_id' => $this->orderId,
            'to' => $to,
            'success' => $result['success'] ?? false,
        ]);
    }
}
