<?php

use Illuminate\Support\Facades\Route;

// Route web minimal — API LaundryFlow sepenuhnya di routes/api.php.
Route::get('/', function () {
    return response()->json([
        'name' => 'LaundryFlow API',
        'status' => 'running',
        'docs' => '/up (health check) — lihat backend/README.md untuk kontrak endpoint.',
    ]);
});
