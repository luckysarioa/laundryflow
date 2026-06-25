<?php

return [

    // Konfigurasi CORS — mengizinkan frontend Next.js (localhost:3000)
    // memanggil API dari browser. Sesuai PRD: frontend & backend terpisah.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Ambil dari env agar fleksibel (production: domain frontend sungguhan).
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
