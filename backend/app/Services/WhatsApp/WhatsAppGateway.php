<?php

namespace App\Services\WhatsApp;

/**
 * Kontrak WhatsApp Gateway (PRD poin 3 — Integrasi WhatsApp Gateway API).
 *
 * Saat ini implementasi aktif: DummyWhatsAppGateway (di-binding di AppServiceProvider).
 * Untuk pakai provider sungguhan, buat class implement interface ini lalu ganti binding.
 *
 * Implementasi nyata yang umum: Fonnte, Wablas, atau Meta Cloud API.
 */
interface WhatsAppGateway
{
    /**
     * Kirim pesan teks WhatsApp.
     *
     * @param  string  $to  Nomor tujuan dalam format 62xxx (tanpa "+" atau spasi).
     * @param  string  $message  Isi pesan (mendukung formatting WhatsApp).
     * @return array{success: bool, message?: string}  Hasil pengiriman.
     */
    public function send(string $to, string $message): array;
}
