<?php

return [

    // Konfigurasi provider pihak ketiga (mail, SMS, dll.).
    // WhatsApp Gateway tidak memerlukan config di sini karena binding
    // dilakukan di AppServiceProvider; implementasi nyata bisa membaca
    // env sendiri (mis. FONNTE_TOKEN).

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
];
