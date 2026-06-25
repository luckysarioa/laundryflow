<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Smoke test — memastikan aplikasi bisa di-bootstrap dan health check merespons.
 * Jalankan: php artisan test
 */
class ExampleTest extends TestCase
{
    public function test_application_health_endpoint_responds(): void
    {
        // Route /up disediakan oleh Laravel secara default.
        $response = $this->get('/up');

        // Harus 200 (OK) — menandakan framework berjalan normal.
        $response->assertOk();
    }
}
