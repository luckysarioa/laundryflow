<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel invoices — tagihan bulanan per tenant (sebelumnya halaman /superadmin/invoices
     * 100% mock, tidak ada backend). Dirancang untuk generate manual via tombol superadmin.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->cascadeOnDelete();
            $table->string('invoice_number', 40)->unique(); // INV-YYYYMM-NNN
            $table->unsignedInteger('amount');               // Rupiah
            $table->string('plan_name', 50);
            $table->string('billing_period', 10);            // YYYY-MM
            $table->enum('status', ['paid', 'pending', 'overdue', 'cancelled'])->default('pending');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('status');
            $table->index('billing_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
