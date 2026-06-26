<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->string('method', 20);                 // qris, transfer, va, ewallet
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->string('gateway_ref')->nullable();     // Midtrans order_id
            $table->string('payment_url')->nullable();     // Midtrans redirect url
            $table->json('gateway_response')->nullable();  // raw response dari gateway
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('gateway_ref');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
