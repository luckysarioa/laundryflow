<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('outlet_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kategori', 50); // sabun, listrik, sewa, gaji, dll
            $table->string('deskripsi');
            $table->unsignedInteger('nominal');
            $table->date('tanggal');
            $table->timestamps();

            $table->index(['tanggal']);
            $table->index(['kategori']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
