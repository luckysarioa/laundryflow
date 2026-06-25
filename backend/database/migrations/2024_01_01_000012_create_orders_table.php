<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Tabel orders — sesuai PRD:
     * (id, customer_id, total_berat, total_harga, status, tgl_masuk, tgl_selesai)
     * + relasi ke service & catatan.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->restrictOnDelete();

            // Berat dalam kg (2 desimal cukup untuk cucian).
            $table->decimal('total_berat', 6, 2)->default(0);
            // Harga dihitung: berat × harga_per_kilo (integer Rupiah).
            $table->unsignedInteger('total_harga')->default(0);

            // Alur 5 tahap (PRD poin 5).
            $table->enum('status', ['antrian', 'cuci', 'setrika', 'siap', 'diambil'])->default('antrian');

            $table->text('catatan')->nullable();
            $table->timestamp('tgl_masuk')->useCurrent();
            $table->timestamp('tgl_selesai')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('tgl_masuk');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
