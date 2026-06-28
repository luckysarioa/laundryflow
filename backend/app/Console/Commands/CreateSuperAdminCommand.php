<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Membuat atau memperbarui akun superadmin.
 *
 * Berguna untuk deployment production yang sudah berjalan, di mana seeder
 * dilewati karena APP_ENV=production. Menyelesaikan masalah "login superadmin
 * gagal — kredensial salah" yang terjadi karena user belum pernah dibuat.
 *
 * Idempoten: bila email sudah ada, hanya password & role yang diperbarui.
 *
 * Catatan password: assign PLAINTEXT — model User punya cast 'password'
 * => 'hashed' yang akan meng-hash SATU kali otomatis. JANGAN Hash::make()
 * di sini (menyebabkan double-hash → login gagal).
 *
 * Contoh:
 *   php artisan app:create-superadmin
 *   php artisan app:create-superadmin --email=admin@x.com --password=rahasia
 */
class CreateSuperAdminCommand extends Command
{
    protected $signature = 'app:create-superadmin
                            {--email= : Email superadmin (default: dari SUPERADMIN_EMAIL atau superadmin@laundryflow.id)}
                            {--name= : Nama superadmin (default: Super Admin)}
                            {--password= : Password superadmin (default: dari SUPERADMIN_PASSWORD atau "password")}';

    protected $description = 'Buat/perbarui akun superadmin (idempoten). Gunakan untuk deployment existing yang belum punya akun superadmin.';

    public function handle(): int
    {
        $email = $this->option('email') ?: env('SUPERADMIN_EMAIL', 'superadmin@laundryflow.id');
        $name = $this->option('name') ?: env('SUPERADMIN_NAME', 'Super Admin');
        $password = $this->option('password') ?: env('SUPERADMIN_PASSWORD', 'password');

        $existed = User::where('email', $email)->exists();

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'nama' => $name,
                'password' => $password,
                'role' => 'superadmin',
            ]
        );

        $this->info($existed
            ? "Akun superadmin diperbarui: {$user->email}"
            : "Akun superadmin dibuat: {$user->email}");
        $this->line("  Nama     : {$user->nama}");
        $this->line("  Role     : {$user->role}");
        $this->warn('  Password : (disembunyikan) — gunakan --password=... untuk mengubah.');

        return self::SUCCESS;
    }
}
