<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Midtrans Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk integrasi payment gateway Midtrans.
    | Dokumentasi: https://docs.midtrans.com/
    |
    */

    // Client Key (publik, aman di frontend untuk Snap)
    'client_key' => env('MIDTRANS_CLIENT_KEY', ''),

    // Server Key (rahasia, hanya di backend)
    'server_key' => env('MIDTRANS_SERVER_KEY', ''),

    // Production mode (false = sandbox)
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),

    // Snap URL
    'snap_url' => env('MIDTRANS_SNAP_URL', 'https://app.sandbox.midtrans.com/snap/sheet.js'),

    // API URL
    'api_url' => env('MIDTRANS_API_URL', 'https://api.sandbox.midtrans.com'),

    // Webhook notification secret
    'notification_secret' => env('MIDTRANS_NOTIFICATION_SECRET', ''),

];
