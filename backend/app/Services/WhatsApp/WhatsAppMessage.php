<?php

namespace App\Services\WhatsApp;

use App\Models\Order;
use App\Support\OrderStatus;

/**
 * Builder pesan status WhatsApp (Bahasa Indonesia, ramah pelanggan).
 * Template identik dengan yang ada di frontend (WhatsAppButton.tsx).
 */
class WhatsAppMessage
{
    public static function forOrder(Order $order): string
    {
        $order->load(['customer', 'service']);

        $nama = $order->customer?->nama ?? 'Pelanggan';
        $status = OrderStatus::tryFrom($order->status)?->label() ?? ucfirst($order->status);

        $lines = [
            "Halo {$nama}! 👋",
            'Laundry Anda sedang diproses.',
            '',
            "🧾 Order #{$order->id}",
            "• Layanan: {$order->service?->nama_layanan}",
            "• Berat: {$order->total_berat} kg",
            "• Total: Rp " . number_format((int) $order->total_harga, 0, ',', '.'),
            "• Status saat ini: *{$status}*",
            "• Masuk: {$order->tgl_masuk?->translatedFormat('j M Y')}",
            '',
            'Terima kasih telah mempercayakan cuciannya kepada kami 🙏',
        ];

        return implode("\n", $lines);
    }

    /** Normalisasi nomor HP ke format 62xxx. */
    public static function normalizeNumber(string $no_hp): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $no_hp);
        if (str_starts_with($cleaned, '0')) {
            $cleaned = '62' . substr($cleaned, 1);
        } elseif (str_starts_with($cleaned, '8')) {
            $cleaned = '62' . $cleaned;
        }
        return $cleaned;
    }
}
