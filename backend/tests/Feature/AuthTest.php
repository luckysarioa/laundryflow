<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * Tes alur otentikasi Sanctum.
 * Jalankan: php artisan test --filter=AuthTest
 */
class AuthTest extends TestCase
{

    public function test_login_dengan_kredensial_benar_mengembalikan_token(): void
    {
        User::factory()->create([
            'email' => 'tes@laundryflow.id',
            'password' => bcrypt('laundry123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'tes@laundryflow.id',
            'password' => 'laundry123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'nama', 'email', 'role']]);
    }

    public function test_login_dengan_kredensial_salah_mengembalikan_401(): void
    {
        User::factory()->create([
            'email' => 'salah@laundryflow.id',
            'password' => bcrypt('laundry123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'salah@laundryflow.id',
            'password' => 'password-yang-salah',
        ]);

        $response->assertUnauthorized()
            ->assertJson(['message' => 'Email atau kata sandi salah.']);
    }

    public function test_akses_route_terproteksi_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/services');

        $response->assertUnauthorized();
    }
}
