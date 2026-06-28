<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom `amount` ke tabel subscriptions.
     *
     * FIX bug: RevenueController dan TenantController::stats() / SubscriptionController::stats()
     * sudah memanggil ->sum('amount') padahal kolom ini belum pernah dibuat — query return error/0.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedInteger('amount')->default(0)->after('plan_id');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('amount');
        });
    }
};
