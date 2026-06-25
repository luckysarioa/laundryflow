<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Tabel customers — (id, nama, no_hp, alamat).
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('no_hp');
            $table->string('alamat')->nullable();
            $table->timestamps();

            $table->index('no_hp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
