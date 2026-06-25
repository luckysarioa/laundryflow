<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Log;

/**
 * Implementasi dummy WhatsApp Gateway.
 *
 * Tidak benar-benar mengirim ke WhatsApp — hanya mencatat ke log
 * (storage/logs/whatsapp.log) agar alur dapat diuji tanpa kredensial provider.
 *
 * Cara mengganti ke provider sungguhan:
 *   1. Buat class baru, mis. `FonnteWhatsAppGateway implements WhatsAppGateway`.
 *   2. Ganti binding di app/Providers/AppServiceProvider.php.
 */
class DummyWhatsAppGateway implements WhatsAppGateway
{
    public function send(string $to, string $message): array
    {
        Log::channel('whatsapp')->info('WhatsApp (dummy) terkirim', [
            'to' => $to,
            'message' => $message,
        ]);

        return [
            'success' => true,
            'message' => 'Pesan dicatat di log (mode dummy).',
        ];
    }
}
