<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);               // free, pro, enterprise
            $table->string('label', 100);              // "Free", "Pro", "Enterprise"
            $table->unsignedInteger('price_monthly');   // Rupiah, 0 = free
            $table->unsignedInteger('price_yearly');    // Rupiah, 0 = free
            $table->unsignedInteger('max_users')->default(1);
            $table->unsignedInteger('max_orders_per_month')->default(0); // 0 = unlimited
            $table->unsignedInteger('max_outlets')->default(1);
            $table->json('features')->nullable();       // { pdf, wa, backup, kanban }
            $table->unsignedInteger('trial_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
