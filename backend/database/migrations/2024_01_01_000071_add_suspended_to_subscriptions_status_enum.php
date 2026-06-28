<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tambah nilai `suspended` ke enum status subscriptions.
     *
     * FIX bug: TenantController::updateStatus() menerima 'suspended' di validasi,
     * tapi enum hanya [trial, active, past_due, expired, cancelled] — update() akan
     * throw DB error saat superadmin mencoba suspend tenant.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('trial', 'active', 'past_due', 'expired', 'cancelled', 'suspended') NOT NULL DEFAULT 'trial'");
    }

    public function down(): void
    {
        // Roll semua row ber-status suspended dulu agar tidak invalid-value saat shrink enum.
        DB::table('subscriptions')->where('status', 'suspended')->update(['status' => 'past_due']);
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('trial', 'active', 'past_due', 'expired', 'cancelled') NOT NULL DEFAULT 'trial'");
    }
};
