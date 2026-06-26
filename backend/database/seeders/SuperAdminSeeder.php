<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the superadmin user.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'superadmin@laundryflow.id'],
            [
                'nama' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
            ]
        );
    }
}
