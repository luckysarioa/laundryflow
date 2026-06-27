<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;
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

        // Hapus wrapping "data" pada response API Resource.
        // Default Laravel membungkus: OrderResource::collection() -> {"data":[...]}.
        // Frontend LaundryFlow mengharapkan PLAIN ARRAY ([...]) sesuai kontrak API
        // (api.ts: Promise<Order[]>). Tanpa ini, frontend crash saat .filter()/.map()
        // pada object {data:[...]} (bukan array) — "client-side exception".
        // Berlaku global untuk SEMUA Resource (orders, customers, services, dll).
        JsonResource::withoutWrapping();
    }
}
