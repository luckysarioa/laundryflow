<?php

return [
    'driver' => env('HASH_DRIVER', 'bcrypt'),
    'bcrypt' => ['rounds' => env('BCRYPT_ROUNDS', 12)],
    'argon' => [
        'memory' => 65536,
        'threads' => (int) env('ARGON_THREADS', 1),
        'time' => (int) env('ARGON_TIME', 4),
    ],
];
