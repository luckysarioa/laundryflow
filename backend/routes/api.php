<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// ==========================================================
// Routes API LaundryFlow.
// Kontrak lengkap: backend/README.md
// Semua route (kecuali login) butuh token Sanctum (Bearer).
// ==========================================================

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Semua route berikut butuh otentikasi.
Route::middleware('auth:sanctum')->group(function () {

    // Services
    Route::get('services', [ServiceController::class, 'index']);

    // Customers
    Route::get('customers', [CustomerController::class, 'index']);
    Route::post('customers', [CustomerController::class, 'store']);

    // Orders (sesuai kontrak: index, show, store, update, advance, status, notify, foto)
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::patch('orders/{order}', [OrderController::class, 'update']);
    Route::patch('orders/{order}/advance', [OrderController::class, 'advance']);
    Route::patch('orders/{order}/status', [OrderController::class, 'setStatus']);
    Route::post('orders/{order}/notify', [OrderController::class, 'notify']);
    Route::post('orders/{order}/foto', [OrderController::class, 'uploadFoto']);
    Route::delete('orders/{order}/foto', [OrderController::class, 'deleteFoto']);

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // Reports
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/revenue/pdf', [ReportController::class, 'revenuePdf']);
    Route::get('reports/orders/pdf', [ReportController::class, 'ordersPdf']);

    // Transactions
    Route::get('transactions', [TransactionController::class, 'index']);
});
