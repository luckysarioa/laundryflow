<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default settings
        $defaults = [
            'business_name' => ['value' => 'LaundryFlow', 'group' => 'business'],
            'business_address' => ['value' => '', 'group' => 'business'],
            'business_phone' => ['value' => '', 'group' => 'business'],
            'business_email' => ['value' => '', 'group' => 'business'],
            'business_logo' => ['value' => null, 'group' => 'business'],
            'currency' => ['value' => 'IDR', 'group' => 'finance'],
            'tax_rate' => ['value' => '0', 'group' => 'finance'],
            'tax_enabled' => ['value' => 'false', 'group' => 'finance'],
            'receipt_footer' => ['value' => 'Terima kasih atas kunjungan Anda', 'group' => 'receipt'],
            'whatsapp_enabled' => ['value' => 'true', 'group' => 'notification'],
            'auto_whatsapp' => ['value' => 'true', 'group' => 'notification'],
            'timezone' => ['value' => 'Asia/Jakarta', 'group' => 'system'],
            'date_format' => ['value' => 'd/m/Y', 'group' => 'system'],
            'language' => ['value' => 'id', 'group' => 'system'],
        ];

        foreach ($defaults as $key => $data) {
            DB::table('settings')->insert([
                'key' => $key,
                'value' => $data['value'],
                'group' => $data['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
