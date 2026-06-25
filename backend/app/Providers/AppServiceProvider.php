<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Daftarkan binding container.
     */
    public function register(): void
    {
        // Bind interface WhatsApp Gateway ke implementasi dummy.
        // Saat ingin pakai provider sungguhan (Fonnte/Wablas/Meta Cloud API),
        // cukup ganti binding ini ke implementasi baru — tidak mengubah job/controller.
        $this->app->bind(
            \App\Services\WhatsApp\WhatsAppGateway::class,
            \App\Services\WhatsApp\DummyWhatsAppGateway::class,
        );
    }

    public function boot(): void
    {
        // Set locale Carbon agar translatedFormat() (mis. label bulan pada grafik)
        // menggunakan Bahasa Indonesia.
        Carbon::setLocale($this->app->getLocale());
    }
}
