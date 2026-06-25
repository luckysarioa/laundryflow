<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Tabel transactions — (id, order_id, nominal, tipe_pembayaran).
     * Dibuat otomatis ketika status order mencapai 'siap'/'diambil' (lunas).
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('nominal');
            $table->enum('tipe_pembayaran', ['tunai', 'qris', 'transfer'])->default('tunai');
            $table->timestamp('created_at')->useCurrent();

            $table->index('order_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
