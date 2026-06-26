<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OutletController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

// ==========================================================
// Routes API LaundryFlow.
// ==========================================================

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [UserController::class, 'forgotPassword']);
    Route::post('reset-password', [UserController::class, 'resetPassword']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('verify-email', [UserController::class, 'verifyEmail']);
        Route::post('verify-email-confirm', [UserController::class, 'verifyEmailConfirm']);
    });
});

// Public order tracking (no auth)
Route::get('tracking/{orderId}', [OrderController::class, 'tracking']);

// Webhook routes (no auth)
Route::post('webhooks/midtrans', [WebhookController::class, 'midtrans']);

// Authenticated routes
// Middleware 'subscription' menambah header X-Subscription-Status (info untuk
// frontend) — TIDAK memblokir request. Selalu aman dipasang di seluruh route auth.
Route::middleware(['auth:sanctum', 'subscription'])->group(function () {

    // ---- Profile ----
    Route::get('profile', [UserController::class, 'profile']);
    Route::patch('profile', [UserController::class, 'updateProfile']);
    Route::post('profile/password', [UserController::class, 'changePassword']);

    // ---- User Management (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });

    // ---- Outlet Management (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('outlets', [OutletController::class, 'index']);
        Route::post('outlets', [OutletController::class, 'store']);
        Route::patch('outlets/{outlet}', [OutletController::class, 'update']);
        Route::delete('outlets/{outlet}', [OutletController::class, 'destroy']);
    });

    // ---- Services ----
    Route::get('services', [ServiceController::class, 'index']);
    Route::get('services/all', [ServiceController::class, 'all']);
    Route::middleware('role:pemilik')->group(function () {
        Route::post('services', [ServiceController::class, 'store']);
        Route::patch('services/{service}', [ServiceController::class, 'update']);
        Route::delete('services/{service}', [ServiceController::class, 'destroy']);
    });

    // ---- Customers ----
    Route::get('customers', [CustomerController::class, 'index']);
    Route::get('customers/{customer}/orders', [CustomerController::class, 'orders']);
    Route::post('customers', [CustomerController::class, 'store']);
    Route::patch('customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);

    // ---- Orders ----
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::patch('orders/{order}', [OrderController::class, 'update']);
    Route::patch('orders/{order}/advance', [OrderController::class, 'advance']);
    Route::patch('orders/{order}/status', [OrderController::class, 'setStatus']);
    Route::post('orders/{order}/notify', [OrderController::class, 'notify']);
    Route::post('orders/{order}/foto', [OrderController::class, 'uploadFoto']);
    Route::delete('orders/{order}/foto', [OrderController::class, 'deleteFoto']);
    Route::delete('orders/{order}', [OrderController::class, 'destroy']);

    // ---- Receipt ----
    Route::get('orders/{order}/receipt', [ReceiptController::class, 'receipt']);
    Route::get('orders/{order}/receipt/download', [ReceiptController::class, 'receiptDownload']);

    // ---- Expenses ----
    Route::get('expenses', [ExpenseController::class, 'index']);
    Route::post('expenses', [ExpenseController::class, 'store']);
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);

    // ---- Dashboard ----
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // ---- Reports ----
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/revenue/pdf', [ReportController::class, 'revenuePdf']);
    Route::get('reports/orders/pdf', [ReportController::class, 'ordersPdf']);
    Route::get('reports/orders/csv', [ReportController::class, 'ordersCsv']);
    Route::get('reports/revenue/csv', [ReportController::class, 'revenueCsv']);
    Route::get('reports/profit-loss', [ReportController::class, 'profitLoss']);
    Route::get('reports/expenses/csv', [ReportController::class, 'expensesCsv']);
    Route::get('reports/profit-loss/pdf', [ReportController::class, 'profitLossPdf']);

    // ---- Transactions ----
    Route::get('transactions', [TransactionController::class, 'index']);

    // ---- Notifications ----
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

    // ---- Activity Logs (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('activity-logs', [ActivityLogController::class, 'index']);
    });

    // ---- Subscription ----
    Route::get('subscription', [SubscriptionController::class, 'index']);
    Route::post('subscription/activate-trial', [SubscriptionController::class, 'activateTrial']);
    Route::post('subscription/checkout', [SubscriptionController::class, 'checkout']);
    Route::get('subscription/payment/{id}', [SubscriptionController::class, 'paymentDetail']);
    Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::get('subscription/usage', [SubscriptionController::class, 'usage']);

    // ---- Plans Management (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('plans', [PlanController::class, 'index']);
        Route::post('plans', [PlanController::class, 'store']);
        Route::get('plans/{plan}', [PlanController::class, 'show']);
        Route::patch('plans/{plan}', [PlanController::class, 'update']);
        Route::delete('plans/{plan}', [PlanController::class, 'destroy']);
    });

    // ---- System Settings (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('settings', [SettingsController::class, 'index']);
        Route::get('settings/{group}', [SettingsController::class, 'show']);
        Route::patch('settings', [SettingsController::class, 'update']);
        Route::post('settings/logo', [SettingsController::class, 'uploadLogo']);
        Route::delete('settings/logo', [SettingsController::class, 'deleteLogo']);
    });

    // ---- Backup (pemilik only) ----
    Route::middleware('role:pemilik')->group(function () {
        Route::get('backups', [BackupController::class, 'index']);
        Route::post('backups', [BackupController::class, 'store']);
        Route::get('backups/{filename}/download', [BackupController::class, 'download']);
        Route::delete('backups/{filename}', [BackupController::class, 'destroy']);
    });
});
