<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add superadmin role to users table enum.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Change enum to include superadmin role
            $table->enum('role', ['pemilik', 'kasir', 'superadmin'])->default('kasir')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['pemilik', 'kasir'])->default('kasir')->change();
        });
    }
};
