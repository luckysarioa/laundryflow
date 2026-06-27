<?php

return [

    'name' => env('APP_NAME', 'LaundryFlow'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    // URL frontend (terpisah dari backend pada arsitektur 2-domain Coolify).
    // Dipakai untuk link yang diklik pelanggan (mis. tracking status di WhatsApp).
    'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),
    'timezone' => env('APP_TIMEZONE', 'Asia/Jakarta'),
    'locale' => 'id',
    'fallback_locale' => 'en',
    'faker_locale' => 'id_ID',

    'key' => env('APP_KEY'),
    'cipher' => env('APP_CIPHER', 'AES-256-CBC'),
    'maintenance' => [
        'driver' => 'file',
    ],

    // Di Laravel 11, provider inti (Auth, Sanctum, dll) di-auto-load framework.
    // Jangan override 'providers' di sini — itu akan MENGGANTI daftar default
    // framework dan menyebabkan binding penting hilang (mis. 'auth' →
    // "Target class [auth] does not exist" → semua route auth:sanctum 500).
    // Provider aplikasi didaftarkan di bootstrap/providers.php.

    'aliases' => \Illuminate\Support\Facades\Facade::defaultAliases()->merge([])->toArray(),
];
