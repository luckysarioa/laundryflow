<?php

return [

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:3000',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    // Guard default untuk otentikasi sesi stateful.
    'guard' => 'web',

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    // Middleware tambahan untuk route sanctum.
    // API LaundryFlow memakai bearer token (stateless), sehingga
    // middleware session/CSRF tidak diaktifkan. Nilai array dibiarkan
    // default dari package; jika nanti butuh cookie-based auth,
    // publish middleware class via `php artisan install:api`.
];
