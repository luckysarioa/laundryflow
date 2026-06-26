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
    /**
     * Build pesan notifikasi status order.
     * Termasuk link tracking untuk customer.
     */
    public static function forOrder(Order $order): string
    {
        $order->load(['customer', 'service']);

        $nama = $order->customer?->nama ?? 'Pelanggan';
        $status = OrderStatus::tryFrom($order->status)?->label() ?? ucfirst($order->status);
        $trackingUrl = self::getTrackingUrl($order->id);

        $lines = [
            "Halo {$nama}! 👋",
            '',
            "Status cucian Anda sudah diperbarui:",
            "*{$status}*",
            '',
            "🧾 Order #{$order->id}",
            "• Layanan: {$order->service?->nama_layanan}",
            "• Berat: {$order->total_berat} kg",
            "• Total: Rp " . number_format((int) $order->total_harga, 0, ',', '.'),
            "• Masuk: {$order->tgl_masuk?->translatedFormat('j M Y')}",
        ];

        // Tambahkan estimasi selesai jika ada
        $estimasi = $order->getEstimatedCompletion();
        if ($estimasi && $order->status !== 'diambil') {
            $lines[] = "• Estimasi selesai: {$estimasi}";
        }

        // Tambahkan link tracking
        $lines[] = '';
        $lines[] = "📍 Lacak status real-time:";
        $lines[] = $trackingUrl;

        $lines[] = '';
        $lines[] = 'Terima kasih telah mempercayakan cuciannya kepada kami 🙏';

        return implode("\n", $lines);
    }

    /**
     * Build pesan notifikasi status spesifik.
     */
    public static function statusUpdate(Order $order): string
    {
        $order->load(['customer', 'service']);

        $nama = $order->customer?->nama ?? 'Pelanggan';
        $status = OrderStatus::tryFrom($order->status)?->label() ?? ucfirst($order->status);
        $trackingUrl = self::getTrackingUrl($order->id);

        $statusEmoji = match($order->status) {
            'cuci' => '🫧',
            'setrika' => '👔',
            'siap' => '✅',
            'diambil' => '🎉',
            default => '📋',
        };

        $lines = [
            "{$statusEmoji} Halo {$nama}!",
            '',
            "Cucian Anda sedang *{$status}*.",
            "Order #{$order->id}",
        ];

        // Tambahkan estimasi selesai jika belum selesai
        if ($order->status !== 'diambil') {
            $estimasi = $order->getEstimatedCompletion();
            if ($estimasi) {
                $lines[] = "⏱ Estimasi selesai: {$estimasi}";
            }
        }

        if ($order->status === 'siap') {
            $lines[] = '';
            $lines[] = 'Cucian sudah siap diambil! Silakan datang ke laundry.';
        }

        $lines[] = '';
        $lines[] = "📍 Lacak status: {$trackingUrl}";

        return implode("\n", $lines);
    }

    /**
     * Generate tracking URL untuk order.
     */
    public static function getTrackingUrl(int $orderId): string
    {
        $baseUrl = config('app.url', 'http://localhost:3000');
        return "{$baseUrl}/tracking/{$orderId}";
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
